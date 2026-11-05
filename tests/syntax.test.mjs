// Every module parses (node --check), and the rules of the code that a machine can check hold.
//
// Parsing first: the screens and the drawing aren't loaded by the other quick tests, so a slip
// there (tradecraft 0.1.3: a comment that swallowed the rest of a line) would only show in a
// browser. src/ and tools/*.mjs are checked, several files at a time.
//
// Then the rules every builder was given (CLAUDE.md, Rules of the code), each a test of its own
// so a failure names the rule:
//   - every module in src/ opens with a header comment that explains its model in prose;
//   - no Math.random in src/: one seeded rng with streams, cosmetic choices by hash;
//   - the sim (src/sim, src/core) never touches the DOM, and doesn't import three.js (the pixel
//     stage's alone); core's browser edge (BROWSER_EDGE: the saves, the keyboard) is named, and no
//     other sim or core module imports it;
//   - no em dashes in src/ (house style: colons and commas).
// The checks read the code with its comments and the text of its strings blanked out (codeOnly
// below), so a header that says "never Math.random" or a message about the window doesn't trip
// them. They are plain text scans, not a parser: a false alarm is fixed here, not worked around
// in the module.
import { execFile } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { assert, root } from './helpers.mjs';

const run = promisify(execFile);
const isModule = f => f.endsWith('.js') || f.endsWith('.mjs');
const walk = (dir) => !existsSync(dir) ? [] : readdirSync(dir).sort().flatMap(f => {
  const p = path.join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : isModule(p) ? [p] : [];
});
const rel = f => path.relative(root, f);
const srcFiles = () => walk(path.join(root, 'src'));
const toolFiles = () => !existsSync(path.join(root, 'tools')) ? [] : readdirSync(path.join(root, 'tools')).filter(f => f.endsWith('.mjs')).sort().map(f => path.join(root, 'tools', f));
const simFiles = () => [...walk(path.join(root, 'src', 'sim')), ...walk(path.join(root, 'src', 'core'))];

// The code of a module with its comments and the text of its strings and regular expressions blanked
// to spaces (newlines kept, so line numbers hold). Template literals keep the code inside ${ }.
// A "/" starts a regular expression where a value can't end: after an operator, an opening bracket,
// a keyword like return, or at the start.
const KEYWORDS = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw', 'case', 'do', 'else', 'yield', 'await']);
const blank = s => s.replace(/[^\n]/g, ' ');
function regexMayStart(out) {
  let k = out.length - 1;
  while (k >= 0 && /\s/.test(out[k])) k--;
  if (k < 0) return true;
  if (/[\w$]/.test(out[k])) { let s = k; while (s >= 0 && /[\w$]/.test(out[s])) s--; return KEYWORDS.has(out.slice(s + 1, k + 1)); }
  return !/[)\]"'`]/.test(out[k]);
}
export function codeOnly(src) {
  let out = '', i = 0;
  const n = src.length, modes = ['code'], braces = [0];
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (modes[modes.length - 1] === 'tpl') {
      if (c === '\\') { out += blank(src.slice(i, i + 2)); i += 2; }
      else if (c === '`') { out += c; modes.pop(); i++; }
      else if (c === '$' && d === '{') { out += '${'; modes.push('code'); braces.push(0); i += 2; }
      else { out += c === '\n' ? '\n' : ' '; i++; }
      continue;
    }
    if (c === '/' && d === '/') { const j = src.indexOf('\n', i), end = j < 0 ? n : j; out += blank(src.slice(i, end)); i = end; continue; }
    if (c === '/' && d === '*') { const j = src.indexOf('*/', i + 2), end = j < 0 ? n : j + 2; out += blank(src.slice(i, end)); i = end; continue; }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && src[j] !== c && src[j] !== '\n') j += src[j] === '\\' ? 2 : 1;
      const closed = j < n && src[j] === c;
      out += c + blank(src.slice(i + 1, Math.min(j, n))) + (closed ? c : '');
      i = closed ? j + 1 : j;
      continue;
    }
    if (c === '`') { out += c; modes.push('tpl'); i++; continue; }
    if (c === '{') { braces[braces.length - 1]++; out += c; i++; continue; }
    if (c === '}') {
      if (modes.length > 1 && braces[braces.length - 1] === 0) { modes.pop(); braces.pop(); }
      else braces[braces.length - 1]--;
      out += c; i++;
      continue;
    }
    if (c === '/' && regexMayStart(out)) {
      let j = i + 1, inClass = false;
      while (j < n && src[j] !== '\n') {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === '[') inClass = true;
        else if (src[j] === ']') inClass = false;
        else if (src[j] === '/' && !inClass) break;
        j++;
      }
      if (j < n && src[j] === '/') { out += '/' + blank(src.slice(i + 1, j)) + '/'; i = j + 1; continue; }
    }
    out += c; i++;
  }
  return out;
}

// Where in a module a pattern matches its code: "file:line: the line", for the failure message.
function findIn(file, pattern) {
  const src = readFileSync(file, 'utf8'), code = codeOnly(src).split('\n'), lines = src.split('\n');
  return code.flatMap((l, k) => pattern.test(l) ? [`${rel(file)}:${k + 1}: ${lines[k].trim().slice(0, 100)}`] : []);
}

// The leading comment of a module (after a #! line), its text without the comment marks.
function headerText(src) {
  let s = src.replace(/^#![^\n]*\n/, ''), text = '';
  for (;;) {
    s = s.replace(/^\s+/, '');
    if (s.startsWith('//')) { const j = s.indexOf('\n'); text += ' ' + s.slice(2, j < 0 ? s.length : j); s = j < 0 ? '' : s.slice(j); }
    else if (s.startsWith('/*')) { const j = s.indexOf('*/'); text += ' ' + s.slice(2, j < 0 ? s.length : j).replace(/^\s*\*/gm, ''); s = j < 0 ? '' : s.slice(j + 2); }
    else break;
  }
  return text.replace(/\s+/g, ' ').trim();
}
const HEADER_MIN_CHARS = 40;          // (a sentence: a header is prose that explains the model, not a title)

// The DOM as the sim would reach it: a member of a browser global, a call of a frame or style
// function, a DOM type. A key or a variable called window (a launch window) is no DOM; a local
// named so and then dotted into is flagged, and is better renamed than excused.
const DOM = new RegExp([
  /(?<![.\w$])(document|window|navigator|localStorage|sessionStorage|indexedDB|location)\s*(\.|\[)/.source,
  /(?<![.\w$])(requestAnimationFrame|cancelAnimationFrame|getComputedStyle|matchMedia)\s*\(/.source,
  /(?<![.\w$])(HTMLElement|HTMLCanvasElement|HTMLImageElement|customElements|DOMParser|MutationObserver)(?![\w$])/.source,
  /\bglobalThis\s*\.\s*(document|window)\b/.source,
].join('|'));
const THREE = /\bfrom\s*['"]three(\/[^'"]*)?['"]|\bimport\s*\(\s*['"]three(\/[^'"]*)?['"]\s*\)/;

// The browser's edge inside src/core: modules that talk to the browser on purpose, for main.js and
// the screens alone, and say so in their headers. The build rule says src/core never touches the
// DOM; the engine round put the saves' IndexedDB and the keyboard's listeners here (2026-11-05), so
// they are named, not excused in silence, and fenced: no other module in src/sim or src/core may
// import one, so the sim stays pure through its imports too. Moving them out of src/core (to the
// screens' side) and off this list is the lead's call.
const BROWSER_EDGE = new Set(['src/core/store.js', 'src/core/input.js']);
// What a module imports by path (static, dynamic, bare side-effect imports), found in its code (not
// its comments) and read back from the source at the same place, as paths from the root.
const importsOf = (file) => importsIn(readFileSync(file, 'utf8'), file);
function importsIn(src, file) {
  const code = codeOnly(src);
  return [...code.matchAll(/\bfrom\s*(['"])|\bimport\s*\(\s*(['"])|^\s*import\s*(['"])/gm)].map(m => {
    const at = m.index + m[0].length, q = src[at - 1];
    return src.slice(at, src.indexOf(q, at));
  }).filter(s => s.startsWith('.') || s.startsWith('/'))
    .map(s => rel(s.startsWith('/') ? path.join(root, s) : path.resolve(path.dirname(file), s)));
}

export default [
  {
    name: 'syntax: every module in src and tools parses',
    async fn() {
      const files = [...srcFiles(), ...toolFiles()], bad = [];
      let next = 0;
      const worker = async () => {
        while (next < files.length) {
          const f = files[next++];
          try { await run(process.execPath, ['--check', f]); }
          catch (e) { bad.push(`${rel(f)}: ${String(e.stderr).split('\n').find(l => /Error/.test(l)) ?? e.message}`); }
        }
      };
      await Promise.all(Array.from({ length: Math.min(8, availableParallelism()) }, worker));
      assert(!bad.length, bad.sort().join('\n'));
      console.log(`      ${files.length} modules parse (${srcFiles().length} in src, ${toolFiles().length} in tools)`);
    },
  },
  {
    name: 'rules: every module in src opens with a header comment that explains its model',
    fn() {
      const files = srcFiles(), bad = [];
      let shortest = null;
      for (const f of files) {
        const text = headerText(readFileSync(f, 'utf8'));
        if (text.length < HEADER_MIN_CHARS) bad.push(`${rel(f)}: ${text ? `header of ${text.length} characters: "${text}"` : 'no header comment'}`);
        else if (!shortest || text.length < shortest.n) shortest = { n: text.length, f: rel(f) };
      }
      assert(!bad.length, `a module opens with a comment of at least ${HEADER_MIN_CHARS} characters that explains it:\n${bad.join('\n')}`);
      console.log(`      ${files.length} modules with headers${shortest ? `; the shortest ${shortest.n} characters (${shortest.f})` : ''}`);
    },
  },
  {
    name: 'rules: no Math.random in src (one seeded rng with streams; cosmetic choices by hash)',
    fn() {
      const files = srcFiles(), hits = files.flatMap(f => findIn(f, /\bMath\s*\.\s*random\b/));
      assert(!hits.length, hits.join('\n'));
      console.log(`      ${files.length} modules, none calls Math.random`);
    },
  },
  {
    name: 'rules: the sim (src/sim, src/core) never touches the DOM or three.js, nor imports core\'s browser edge',
    fn() {
      const files = simFiles(), pure = files.filter(f => !BROWSER_EDGE.has(rel(f)));
      const dom = pure.flatMap(f => findIn(f, DOM));
      const three = files.flatMap(f => readFileSync(f, 'utf8').split('\n').flatMap((l, k) => THREE.test(l) ? [`${rel(f)}:${k + 1}: ${l.trim()}`] : []));
      const edge = pure.flatMap(f => importsOf(f).filter(i => BROWSER_EDGE.has(i)).map(i => `${rel(f)} imports ${i} (core's browser edge)`));
      const gone = [...BROWSER_EDGE].filter(f => !existsSync(path.join(root, f)));
      assert(!dom.length && !three.length && !edge.length, [...dom, ...three, ...edge].join('\n'));
      console.log(`      ${pure.length} sim and core modules pure (no DOM, no three.js, no import of the edge); the browser's edge in core: ${[...BROWSER_EDGE].filter(f => !gone.includes(f)).join(', ') || 'none'}${gone.length ? `; listed but gone: ${gone.join(', ')}` : ''}`);
    },
  },
  {
    name: 'rules: no em dashes in src (colons and commas)',
    fn() {
      const files = srcFiles(), hits = files.flatMap(f => readFileSync(f, 'utf8').split('\n').flatMap((l, k) => l.includes('\u2014') ? [`${rel(f)}:${k + 1}: ${l.trim().slice(0, 100)}`] : []));
      assert(!hits.length, hits.join('\n'));
      console.log(`      ${files.length} modules, no em dash`);
    },
  },
  {
    name: 'rules: the checks read code, not prose (comments, strings and regexes blanked; imports read from code)',
    fn() {
      const src = [
        '// Math.random is never used here',
        "const a = 'window.foo', b = \"document.x\"; /* Math.random() */",
        'const r = /Math.random/g, q = x / 2 / y;',
        'const t = `the window ${ document.title } and ${ { a: 1 }.a }`;',
        'return Math.random();',
      ].join('\n');
      const code = codeOnly(src).split('\n');
      const hasRandom = code.map(l => /\bMath\s*\.\s*random\b/.test(l)), hasDom = code.map(l => DOM.test(l));
      console.log(`      Math.random seen on lines ${hasRandom.flatMap((h, k) => h ? [k + 1] : []).join(', ')}; the DOM on ${hasDom.flatMap((h, k) => h ? [k + 1] : []).join(', ')}`);
      assert(hasRandom.join() === 'false,false,false,false,true', `Math.random: ${hasRandom}`);
      assert(hasDom.join() === 'false,false,false,true,false', `the DOM: ${hasDom}`);
      assert(code[2].includes('x / 2 / y'), `division kept: ${code[2]}`);
      const imports = importsIn([
        "// (not this one: import { load } from './store.js')",
        "import { a } from './state.js';",
        "const m = await import('../core/store.js');",
        "import './side.js';",
        "const s = 'from \"./nothing.js\"';",
      ].join('\n'), path.join(root, 'src', 'sim', 'x.js'));
      console.log(`      imports read: ${imports.join(', ')}`);
      assert(imports.join() === 'src/sim/state.js,src/core/store.js,src/sim/side.js', `imports: ${imports}`);
    },
  },
];
