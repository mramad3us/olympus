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
//
// TECH §2.2 and §2.7's rules, added for 0.0.2 (the build sheet's §5.1 and §8, item 4):
//   - the import matrix, read from the code: core imports core; data data; world core, data, world;
//     sim core, data, world, sim; art core, data, art; render core, data, art, render, three and the
//     pure sim helpers of SIM_FOR_VIEW (places/plan.js, places/light.js); ui all of src but three;
//     src/main.js anything. Named exceptions, as BROWSER_EDGE is named: ART_FROM_RENDER, the
//     density (src/render/scale.js: TECH correction 3 put VIEWS's art/density.js there, and the
//     painters read it); and the paint worker's closure (src/art/worker.js and all it imports),
//     whose art modules may import render modules and SIM_FOR_VIEW modules whose headers say Pure.;
//   - the worker's closure imports no three, and its render and sim modules are Pure. (but the
//     density, ART_FROM_RENDER, which reads the page's ?ppm= once at load, in a worker as well);
//   - no real time (Date, performance, setTimeout, setInterval, requestAnimationFrame) in src/sim,
//     src/world, src/data, nor in src/core outside the loop (frame timing), the store (savedAt)
//     and the input (event times);
//   - three imported only under src/render (and by src/main.js, which may import anything);
//   - every emit('<literal>') in src names a fact registered in src/core/facts.js (the registered
//     names never emitted are printed);
//   - readPixels only in src/render/stats.js, under its test flag (TECH §9.10, §16.5);
//   - a module's first line is '// OLYMPUS <folder>: …' (a folder of its own path under src) or
//     '// OLYMPUS: …' (TECH §2.3; CLAUDE.md).
import { execFile } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { assert, root } from './helpers.mjs';
import { FACTS, isFact } from '../src/core/facts.js';

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
// function, a DOM type, WebAudio's constructors. A key or a variable called window (a launch window) is no DOM; a local
// named so and then dotted into is flagged, and is better renamed than excused.
const DOM = new RegExp([
  /(?<![.\w$])(document|window|navigator|localStorage|sessionStorage|indexedDB|location)\s*(\.|\[)/.source,
  /(?<![.\w$])(requestAnimationFrame|cancelAnimationFrame|getComputedStyle|matchMedia)\s*\(/.source,
  /(?<![.\w$])(HTMLElement|HTMLCanvasElement|HTMLImageElement|customElements|DOMParser|MutationObserver)(?![\w$])/.source,
  // (WebAudio is the browser's too: the sound lives in src/ui/audio, the 0.0.3 sheet's §1)
  /(?<![.\w$])(AudioContext|OfflineAudioContext|webkitAudioContext|AudioWorkletNode)(?![\w$])/.source,
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

// ---- TECH §2.2 and §2.7 (0.0.2) ----

const SRC_FOLDERS = ['core', 'data', 'world', 'sim', 'art', 'render', 'ui'];
/** The matrix: a module in a folder may import modules in these folders (TECH §2.2; the build sheet's §8, item 4). */
const MAY_IMPORT = {
  core: ['core'], data: ['data'], world: ['core', 'data', 'world'], sim: ['core', 'data', 'world', 'sim'],
  art: ['core', 'data', 'art'], render: ['core', 'data', 'art', 'render'], ui: SRC_FOLDERS, main: [...SRC_FOLDERS, 'main'],
};
/** The pure sim helpers the stage may read (TECH §2.2's SIM_FOR_VIEW, with the 0.0.2 sheet's places/plan.js, the 0.0.3 sheet's §1: the sun, the clocks, the doors, people's perception and figures, and the 0.0.4 sheet's §1: the alert's beacon). */
const SIM_FOR_VIEW = new Set(['src/sim/places/plan.js', 'src/sim/places/light.js', 'src/sim/places/sun.js', 'src/sim/places/clocks.js', 'src/sim/places/doors.js', 'src/sim/people/perception.js', 'src/sim/people/figure.js', 'src/sim/time/alerts.js']);
/** Render modules art may import: the density (TECH correction 3: art/density.js became render/scale.js). */
const ART_FROM_RENDER = new Set(['src/render/scale.js']);
const WORKER = 'src/art/worker.js';
const REAL_TIME_OK = new Set(['src/core/loop.js', 'src/core/store.js', 'src/core/input.js']);
const REAL_TIME = /(?<![.\w$])(Date|performance|setTimeout|setInterval|requestAnimationFrame)(?![\w$])|\bglobalThis\s*\.\s*(Date|performance|setTimeout|setInterval|requestAnimationFrame)\b/;
const READ_PIXELS_OK = 'src/render/stats.js';

// (the folder a module belongs to: main for src/main.js, else its first folder under src)
const folderOf = (relPath) => { const p = relPath.split('/'); return p[0] !== 'src' ? 'outside' : p.length === 2 ? 'main' : p[1]; };
const isPure = (relPath) => existsSync(path.join(root, relPath)) && /\bPure\./.test(headerText(readFileSync(path.join(root, relPath), 'utf8')));
// (the module and everything it imports, transitively, as paths from the root)
function closureOf(start) {
  const seen = new Set(), todo = [start];
  while (todo.length) {
    const f = todo.pop();
    if (seen.has(f) || !existsSync(path.join(root, f))) continue;
    seen.add(f);
    for (const i of importsOf(path.join(root, f))) todo.push(i);
  }
  return seen;
}
const report = (rules) => { for (const [rule, hits] of Object.entries(rules)) console.log(`      ${rule}: ${hits.length ? `${hits.length} violation${hits.length === 1 ? '' : 's'}` : 'none'}`); };

const RULES_0_0_2 = [
  {
    name: 'rules: the import matrix of TECH §2.2, read from the code, with its named exceptions',
    fn() {
      const files = srcFiles().map(rel), worker = closureOf(WORKER), bad = [];
      let edges = 0, excused = 0;
      for (const f of files) {
        const from = folderOf(f);
        for (const to of importsOf(path.join(root, f))) {
          edges++;
          const into = folderOf(to);
          if (MAY_IMPORT[from]?.includes(into)) continue;
          if (from === 'render' && into === 'sim' && SIM_FOR_VIEW.has(to)) continue;
          if (from === 'art' && into === 'render' && ART_FROM_RENDER.has(to)) { excused++; continue; }
          if (from === 'art' && worker.has(f) && ((into === 'render' && isPure(to)) || (into === 'sim' && SIM_FOR_VIEW.has(to) && isPure(to)))) { excused++; continue; }
          bad.push(`${f} (${from}) imports ${to} (${into})`);
        }
      }
      report({ 'the matrix': bad });
      assert(!bad.length, bad.join('\n'));
      console.log(`      ${files.length} modules, ${edges} imports; ${excused} by a named exception (the density, the worker's pure closure); SIM_FOR_VIEW ${[...SIM_FOR_VIEW].join(', ')}`);
    },
  },
  {
    name: 'rules: the paint worker\'s closure imports no three, and its render and sim modules are Pure.',
    fn() {
      const closure = [...closureOf(WORKER)].sort(), bad = [];
      for (const f of closure) {
        const src = readFileSync(path.join(root, f), 'utf8');
        if (THREE.test(codeOnly(src)) || /\bfrom\s*['"]three/.test(src)) bad.push(`${f} imports three`);
        const into = folderOf(f);
        if ((into === 'render' || into === 'sim') && !isPure(f) && !ART_FROM_RENDER.has(f)) bad.push(`${f} (${into}) is in the worker's closure without 'Pure.' in its header`);
        if (into === 'sim' && !SIM_FOR_VIEW.has(f)) bad.push(`${f} is in the worker's closure but not in SIM_FOR_VIEW`);
        if (into === 'ui' || into === 'main') bad.push(`${f} (${into}) is in the worker's closure`);
      }
      report({ 'the worker\'s closure': bad });
      assert(!bad.length, bad.join('\n'));
      const by = closure.reduce((o, f) => { o[folderOf(f)] = (o[folderOf(f)] ?? 0) + 1; return o; }, {});
      console.log(`      ${existsSync(path.join(root, WORKER)) ? `${WORKER}: ${closure.length} modules (${Object.entries(by).map(([k, n]) => `${k} ${n}`).join(', ')})` : `${WORKER} not built yet`}`);
    },
  },
  {
    name: 'rules: no real time in src/sim, src/world, src/data, nor in src/core outside the loop, the store and the input',
    fn() {
      const files = srcFiles().map(rel).filter(f => ['sim', 'world', 'data', 'core'].includes(folderOf(f)) && !REAL_TIME_OK.has(f));
      const hits = files.flatMap(f => findIn(path.join(root, f), REAL_TIME));
      report({ 'real time': hits });
      assert(!hits.length, hits.join('\n'));
      console.log(`      ${files.length} modules read no real time; allowed in ${[...REAL_TIME_OK].join(', ')}`);
    },
  },
  {
    name: 'rules: three is imported only under src/render',
    fn() {
      const files = srcFiles().map(rel).filter(f => folderOf(f) !== 'render' && folderOf(f) !== 'main');
      const hits = files.flatMap(f => readFileSync(path.join(root, f), 'utf8').split('\n').flatMap((l, k) => THREE.test(l) ? [`${f}:${k + 1}: ${l.trim()}`] : []));
      const users = srcFiles().map(rel).filter(f => folderOf(f) === 'render' && THREE.test(readFileSync(path.join(root, f), 'utf8')));
      report({ 'three outside render': hits });
      assert(!hits.length, hits.join('\n'));
      console.log(`      ${users.length} render modules import three; none elsewhere (src/main.js may, by the matrix)`);
    },
  },
  {
    name: 'rules: every emit(\'<fact>\') in src names a fact registered in src/core/facts.js',
    fn() {
      const emitted = new Map(), bad = [];
      for (const file of srcFiles()) {
        const src = readFileSync(file, 'utf8'), code = codeOnly(src);
        for (const m of code.matchAll(/\bemit\s*\(\s*(['"`])/g)) {
          const at = m.index + m[0].length, q = src[at - 1], end = src.indexOf(q, at), name = src.slice(at, end);
          if (q === '`' && name.includes('${')) continue;                // (a computed name: not checked here)
          const line = src.slice(0, m.index).split('\n').length;
          if (!emitted.has(name)) emitted.set(name, []);
          emitted.get(name).push(`${rel(file)}:${line}`);
          if (!isFact(name)) bad.push(`${rel(file)}:${line}: emit('${name}') is not a registered fact`);
        }
      }
      const never = Object.keys(FACTS).filter(n => !emitted.has(n));
      report({ 'unregistered facts': bad });
      assert(!bad.length, bad.join('\n'));
      console.log(`      ${Object.keys(FACTS).length} facts registered; ${emitted.size} emitted by name: ${[...emitted.keys()].sort().join(', ')}`);
      console.log(`      registered, never emitted: ${never.join(', ') || 'none'}`);
    },
  },
  {
    name: 'rules: readPixels appears only in src/render/stats.js',
    fn() {
      const hits = srcFiles().filter(f => rel(f) !== READ_PIXELS_OK).flatMap(f => findIn(f, /\breadPixels\b/));
      report({ readPixels: hits });
      assert(!hits.length, hits.join('\n'));
      console.log(`      readPixels nowhere but ${READ_PIXELS_OK}${existsSync(path.join(root, READ_PIXELS_OK)) ? '' : ' (not built yet)'}`);
    },
  },
  {
    name: 'rules: a module\'s first line is "// OLYMPUS <folder>: …" (a folder of its path) or "// OLYMPUS: …"',
    fn() {
      const files = srcFiles(), bad = [], forms = {};
      for (const f of files) {
        const first = readFileSync(f, 'utf8').replace(/^#![^\n]*\n/, '').split('\n')[0];
        const m = /^\/\/ OLYMPUS(?: ([a-z][\w-]*))?: \S/.exec(first);
        const dirs = rel(f).split('/').slice(1, -1);
        if (!m) bad.push(`${rel(f)}: "${first.slice(0, 60)}"`);
        else if (m[1] && !dirs.includes(m[1])) bad.push(`${rel(f)}: "OLYMPUS ${m[1]}:" names no folder of its path (${dirs.join('/') || 'src'})`);
        else forms[m[1] ?? '(none)'] = (forms[m[1] ?? '(none)'] ?? 0) + 1;
      }
      report({ 'header lines': bad });
      assert(!bad.length, bad.join('\n'));
      console.log(`      ${files.length} modules: ${Object.entries(forms).map(([k, n]) => `${k} ${n}`).join(', ')}`);
    },
  },
];

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
  ...RULES_0_0_2,
];
