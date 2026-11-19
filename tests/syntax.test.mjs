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
// 0.0.5 (the build sheet 0.0.5 §1, the stage's): SIM_FOR_VIEW gains src/sim/arms/look.js (what the stage
// reads of the arms: the rifle on a figure, the kit, the range's paper and brass); and SKILLS §5.12's pace
// rule, one pace helper: no function and no top-level const or let whose name has "pace" as a word
// (paceOf, PACE_K, slow_pace) is defined outside src/sim/skills/skills.js; parameters and properties
// are free (a step's pace read from paceOf is fine).
// 0.0.7 (the build sheet 0.0.7 §2.7, the stage's): SIM_FOR_VIEW gains src/sim/body/blood.js (the body's bloodLook:
// the blood on the ground and the wounds' marks the stage draws).
// 0.0.8 (the build sheet 0.0.8 §2.6; COMBAT §25.4.2): the take-in's one helper, REACT_HOME: no function and no top-level
// const or let whose name's words include "take" and "in" (or "takein"), or "react" with "ms", is defined outside
// src/sim/combat/react.js, so no module grows a reaction delay of its own (§3.2's reactMs is retired).
// 0.0.9 (the build sheet 0.0.9 §2.1, §8 item 24; COMBAT §5.9): suppression's one home, SUPP_HOME: no top-level const or let
// whose name starts SUPP_, HARD_, STARTLE_, INOC_, FLASH_, DEAF_ or NERVE_ is defined in the sim, core or data outside
// src/sim/combat/supp.js, so no module grows a suppression, hardening, startle, inoculation, flash, deafness or nerve
// constant of its own. The rule's named exceptions, each its own quantity: react.js's SUPP_MS (the take-in's 200 ms a band),
// look.js's FLASH_MS (a muzzle flash's life), wounds.js's HARD_BLEED_PM (a hard bleed), needs.js's HARD_MET (hard work's metabolic rate). The page's modules (render, ui,
// art) are left out: their FLASH_ names are the muzzle flash and the panel's highlight, not the bang's physics (my call).
// The environment foundation (ROADMAP "anywhere", step 1; TECH §1.4, PLACES §3.16, CONTRACTS §21): ENV_HOME, the
// environment's one home. Outside src/data/places/env.js (the tables), src/data/places/sites.js (the site records)
// and src/core/phys.js (G0, R, γ), no module in src holds a gravity or air number: the literals 0.38, 3.727,
// 9.80665, 65.9, 66.0 and 322 are refused in code (comments and strings blanked), but in src/art, whose numbers are
// pixel geometry and tones, never physics (my call), and for ENV_EXCEPT's named properties, each its own quantity
// (the sky's 0.38 skyK, a 9 mm load's 0.38 g of propellant); the old Melas constants' names (G_MELAS, FLOOR_KPA,
// GROUND_KPA, ROOM_C, OUTDOOR_C, MARS_G, G_MS2, DUST_G_MS2, AIR_KPA, SOUND_SPEED_MS, MARS_AIR_KG_MOL,
// EARTH_AIR_KG_MOL; from step 2 the Mars gaits' MARS_GAITS and KD_WALK_MS, the gaits being the place's) appear nowhere in src's code; G0_MS2, R_GAS and GAMMA_AIR are defined only in phys.js; and no
// parameter in src/sim defaults its gravity (`gG =` after a bracket or a comma), so no Mars default can hide a
// missing wire. From step 3 (the clock and the sky by site), ENV_QUIET: no code in src falls back to Melas by name
// (`?? 'melas'`, `|| 'melas'`, `?? SITES.melas`, `?? WATER_MIN.melas` and the like: an unknown site throws; from the
// fixer's pass of step 4 also `?? MELAS_*` and a parameter defaulted to one, `lonEDeg = MELAS_LON_E_DEG)`), and the
// readers routed through env.js localTime (CLOCK_READERS: the light, the wall clocks, the watch, the log, the stage's
// clocks) import no Mars clock of their own (marsClock, msAtMarsTime), so a ship's clock is UTC everywhere they show.
// From step 4 (the scene specs), SCENE_HOST: a scene's site is its spec's host (src/data/scenes.js), so the name
// SCENARIO_SITES is gone from src, no scenario fill (src/sim/scenarios) or src/sim/game.js moves the clock by a Mars
// clock of its own (msAtMarsTime: newGame moves it once, by env.js msAtLocal on the host's clock), and no fill names
// a site by a literal (`site: 'melas'`: its place constant reads its spec's host).
// v0.0.21 (the build sheet v0.0.21 §1 item 13, §6 stage 0): READS_HOME, the read scope's writers: no module in src assigns
// state.$reads (`.$reads =`) but src/sim/skills/instinct.js (the instinct's two evaluations) and src/sim/arms/shooting.js
// (stepsOf when no scope is open), so a scope is opened and closed only where a `finally` closes it.
// OP_HOME (the build sheet v0.0.21 §1 item 21, §3 step 3): the operation record's one reader, src/sim/combat/op.js: no other
// module of src/sim/combat/, nor src/sim/skills/instinct/cqb.js, src/sim/arms/sidearm.js, kit.js or shooting.js, names the
// house's record (`armoury.range.house`) or tests its course (`course === 'house'`) in code: they ask opOf, opLive, onHouse,
// laneRec, opRec, brokenOf or breakOpening, so the drill can meet a room off the range's lane through one branch.
// COMBAT_NO_SCENARIO (the build sheet v0.0.21 §0 item 31, §3 step 4): no module of src/sim/combat/ imports from
// src/sim/scenarios/ (the #2's brain, combat/two.js, reaches the lane through op.js's host), so a room can be cleared where no
// scenario runs.
// ENV_QUIET_G (v0.0.24's stage 0, its build sheet §0 item 23, §2 step 3; F115, the anywhere note's V15): no quiet gravity or grip.
// gravityAt never returns null and surfaceAt throws where no surface is, so a fallback behind either hides a missing wire: in
// src's code (src/art apart, whose numbers are pixels) no 9.81 (the 1 G reference is phys.js G0_MS2), no `gG ?? 1`, no fallback
// after a gravity read (`gravityAt(…)?.` or `gravityAt(…).gG ??`), and in src/sim no grip fallback (`Number.isFinite(mu) ? mu :`,
// `? mu : 0.6`). The five sites the lens found (loco.js twice, people/figure.js, render/view.js, shoothouse.js gWords) and the
// three readers' μ 0.6 (move.js, bundle.js, arms/loadout.js, now motion.js legsAt) are gone; a sixth fails here.
// QUICK_SLOW's check (the build sheet v0.0.21 §1 item 26; TECH §13.7): tests/run.mjs's frozen list of the quick files over
// QUICK_FILE_CPU_S names only files that exist, and against the last tag's list (when that tag has one) no file joins and no
// ceiling rises.
import { execFile, execFileSync } from 'node:child_process';
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
// (v0.0.20: the debrief's trace, R.house.$trace: written once by shoothouse.js traceTick, read by house-debrief.js alone)
/** The read scope's writers (v0.0.21): the only modules that assign state.$reads. */
const READS_HOME = Object.freeze(['src/sim/skills/instinct.js', 'src/sim/arms/shooting.js']);
/** The operation record's one reader (v0.0.21), and the modules held to it. */
const OP_HOME = Object.freeze({ home: 'src/sim/combat/op.js', dirs: ['src/sim/combat/'], files: ['src/sim/skills/instinct/cqb.js', 'src/sim/arms/sidearm.js', 'src/sim/arms/kit.js', 'src/sim/arms/shooting.js'] });
const TRACE_HOME = Object.freeze({ reader: 'src/sim/scenarios/house-debrief.js', writer: 'src/sim/scenarios/shoothouse.js' });
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
// 0.0.23 (the build sheet v0.0.23 §0 item 15): src/sim/places/known.js, what the stage may draw of a place and its people before
// they are seen (familiarOf, footprintOf, knownRoomsOf, hostKind, seenEver), read by view.js directly as it reads perception.
const SIM_FOR_VIEW = new Set(['src/sim/places/plan.js', 'src/sim/places/light.js', 'src/sim/places/sun.js', 'src/sim/places/clocks.js', 'src/sim/places/doors.js', 'src/sim/people/perception.js', 'src/sim/people/figure.js', 'src/sim/time/alerts.js', 'src/sim/arms/look.js', 'src/sim/body/blood.js', 'src/sim/places/known.js',
  // (v0.0.25, the build sheet §1 D: the body's face, sim/body/footing.js bodySpanOf, read by the view for a man planted on the deckhead)
  'src/sim/body/footing.js']);
/** SKILLS §5.12: the one pace helper's home (paceOf); a name with "pace" as a word is defined nowhere else in src. */
const PACE_HOME = 'src/sim/skills/skills.js';
// (a name's words: camelCase, PascalCase, snake_case and SCREAMING_CASE split; "pace" one of them)
const wordsOf = (name) => name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2').toLowerCase().split(/[\s_$]+/).filter(Boolean);
const hasPace = (name) => wordsOf(name).includes('pace');
/** COMBAT §25.4.2: the take-in's one home (takeInMs, coreMs, EXPECT); a name with "take in" or "react … ms" in its words is defined nowhere else in src. */
const REACT_HOME = 'src/sim/combat/react.js';
const hasReact = (name) => { const w = wordsOf(name); return w.includes('takein') || (w.includes('take') && w.includes('in')) || (w.includes('react') && w.includes('ms')); };
/** COMBAT §5.9: suppression's one home; its prefixes, and the named exceptions (file: name). */
/** The environment's one home (TECH §1.4): the tables, the site records and the physical constants. */
const ENV_HOME = Object.freeze(new Set(['src/data/places/env.js', 'src/data/places/sites.js', 'src/core/phys.js']));
const ENV_LITERALS = /(?<![\w.$])(0\.38|3\.727|9\.80665|65\.9|66\.0|322)(?![\w.])/g;
/** Named properties outside the home that happen to hold one of the literals, each its own quantity (not a gravity or an air). */
const ENV_EXCEPT = Object.freeze(new Set(['src/data/places/sky.js: skyK 0.38', 'src/sim/arms/calibres.js: propG 0.38']));
const ENV_OLD = Object.freeze(['G_MELAS', 'FLOOR_KPA', 'GROUND_KPA', 'ROOM_C', 'OUTDOOR_C', 'MARS_G', 'G_MS2', 'DUST_G_MS2', 'AIR_KPA', 'SOUND_SPEED_MS', 'MARS_AIR_KG_MOL', 'EARTH_AIR_KG_MOL', 'MARS_GAITS', 'KD_WALK_MS']);
const ENV_PHYS = Object.freeze(['G0_MS2', 'R_GAS', 'GAMMA_AIR']);
const ENV_G_DEFAULT = /[({,]\s*gG\s*=(?![=>])/g;
/** A quiet Melas: a fallback to the site by name (step 3). */
const ENV_QUIET = /(\?\?|\|\|)\s*(['"]melas['"]|[\w$]+\.melas(?![\w$])|MELAS_[A-Z0-9_]+)|(?<=[\w$]\s*)=\s*MELAS_[A-Z0-9_]+(?=\s*[,)])/g;
/** A quiet gravity or grip (v0.0.24's stage 0, F115): a 9.81, `gG ?? 1`, a fallback after a gravity read; in src/sim a grip fallback. */
const QUIET_G = /(?<![\w$.])9\.81(?!\d)|(?<![\w$])gG\s*\?\?\s*1(?![\d.])|(?<![\w$.])gravityAt\((?:[^()]|\([^()]*\))*\)\s*(?:\?\.|\.\s*g(?:G|Ms2)\s*\?\?)/g;
const QUIET_MU = /Number\.isFinite\(\s*mu\s*\)\s*\?\s*mu\s*:|\?\s*mu\s*:\s*0\.6(?!\d)/g;
/** The readers routed through env.js localTime: no Mars clock of their own. */
const CLOCK_READERS = Object.freeze(['src/sim/places/light.js', 'src/sim/places/clocks.js', 'src/ui/hud/watch.js', 'src/ui/cards/log.js', 'src/render/clocks.js']);
const MARS_CLOCKS = /(?<![\w$])(marsClock|msAtMarsTime)(?![\w$])/g;
/** The scene specs' guard (step 4): the old table's name, a fill's own Mars clock, a literal site in a fill. */
const SCENE_TABLE = /(?<![\w$])SCENARIO_SITES(?![\w$])/g, SCENE_CLOCK = /(?<![\w$])msAtMarsTime(?![\w$])/g, SCENE_SITE = /(?<![\w$])site\s*:\s*['"`]/g;
const SCENE_FILLS = (r) => r.startsWith('src/sim/scenarios/') || r === 'src/sim/game.js';
const SUPP_HOME = 'src/sim/combat/supp.js';
/** COMBAT §25.7.1: the stepper's one home (the build sheet 0.0.12 §2.6): the sub-steps' and the beats' boundaries are scheduled there alone. */
const STEPPER_HOME = 'src/sim/combat/stepper.js';
const STEPPER_NAMES = Object.freeze(['runSub', 'advanceBeats', 'endStep']);
/** The NPC gunner's own step clock (COMBAT §2, v0.0.7), older than the stepper: named, to join it with the fighter brains (0.1.x; my call). */
const STEPPER_EXCEPT = Object.freeze(new Set(['src/sim/arms/gunner.js: runSub']));
/** PLACES §4.15: the spin's one home (the build sheet 0.0.12 §2.6): ω and the Coriolis terms in src/sim/places/spin.js alone. */
const SPIN_HOME = 'src/sim/places/spin.js';
const SUPP_PREFIXES = Object.freeze(['SUPP_', 'HARD_', 'STARTLE_', 'INOC_', 'FLASH_', 'DEAF_', 'NERVE_']);
const SUPP_EXCEPT = Object.freeze(new Set(['src/sim/combat/react.js: SUPP_MS', 'src/sim/arms/look.js: FLASH_MS', 'src/sim/body/wounds.js: HARD_BLEED_PM', 'src/data/body/needs.js: HARD_MET']));
const hasSupp = (name) => SUPP_PREFIXES.some(p => name.startsWith(p));
/** The names a module defines at its top level or as a function anywhere: function declarations, top-level const and let. */
function definedNames(code) {
  const out = [];
  for (const m of code.matchAll(/\bfunction\s*\*?\s*([A-Za-z_$][\w$]*)\s*\(/g)) out.push({ name: m[1], at: m.index });
  for (const m of code.matchAll(/^(?:export\s+)?(?:const|let|var)\s+([^=;]+?)=/gm)) {
    // (each declarator of the line: `const a = 1, b = 2`; destructuring's names too)
    const line = code.slice(m.index, code.indexOf('\n', m.index) === -1 ? code.length : code.indexOf('\n', m.index));
    for (const d of line.replace(/^(?:export\s+)?(?:const|let|var)\s+/, '').split(/,(?![^{[]*[}\]])/)) { const n = /^\s*([A-Za-z_$][\w$]*)\s*=/.exec(d); if (n) out.push({ name: n[1], at: m.index }); }
  }
  return out;
}
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
  {
    name: 'rules: one pace helper (SKILLS §5.12): no function or top-level const named with "pace" as a word outside src/sim/skills/skills.js',
    fn() {
      const files = srcFiles(), hits = [];
      for (const f of files) {
        if (rel(f) === PACE_HOME) continue;
        const src = readFileSync(f, 'utf8'), code = codeOnly(src);
        for (const d of definedNames(code)) if (hasPace(d.name)) hits.push(`${rel(f)}:${code.slice(0, d.at).split('\n').length}: ${d.name}`);
      }
      const home = existsSync(path.join(root, PACE_HOME)) ? definedNames(codeOnly(readFileSync(path.join(root, PACE_HOME), 'utf8'))).filter(d => hasPace(d.name)).map(d => d.name) : [];
      const probe = ['paceOf', 'PACE_K', 'slow_pace', 'space', 'spaceOf', 'paced', 'Pace'].map(n => `${n} ${hasPace(n) ? 'yes' : 'no'}`);
      report({ 'pace defined outside skills.js': hits });
      console.log(`      ${files.length} modules; defined in ${PACE_HOME}: ${home.join(', ') || 'none yet'}; the word test: ${probe.join(', ')}`);
      assert(hasPace('paceOf') && hasPace('PACE_K') && hasPace('slow_pace') && !hasPace('space') && !hasPace('paced'), 'the word test');
      assert(!hits.length, hits.join('\n'));
    },
  },
  {
    name: 'rules: the stepper\'s one home (COMBAT §25.7.1, STEPPER_HOME): no module but src/sim/combat/stepper.js sets a sub-step\'s start (subFromMs) or defines runSub, advanceBeats or endStep, but the NPC gunner\'s own step clock (named)',
    fn() {
      const files = srcFiles(), hits = [], excepted = [];
      for (const f of files) {
        const r = rel(f);
        if (r === STEPPER_HOME) continue;
        const code = codeOnly(readFileSync(f, 'utf8')), lineAt = (at) => code.slice(0, at).split('\n').length;
        for (const m of code.matchAll(/\.subFromMs\s*=(?!=)/g)) hits.push(`${r}:${lineAt(m.index)}: subFromMs =`);
        for (const d of definedNames(code)) {
          if (!STEPPER_NAMES.includes(d.name)) continue;
          const key = `${r}: ${d.name}`;
          (STEPPER_EXCEPT.has(key) ? excepted : hits).push(STEPPER_EXCEPT.has(key) ? key : `${r}:${lineAt(d.at)}: ${d.name}`);
        }
      }
      const home = definedNames(codeOnly(readFileSync(path.join(root, STEPPER_HOME), 'utf8'))).map(d => d.name).filter(n => STEPPER_NAMES.includes(n) || ['begin', 'advance', 'halt', 'flowOf', 'registerKind'].includes(n));
      report({ 'a sub-step scheduled outside the stepper': hits });
      console.log(`      ${files.length} modules; ${STEPPER_HOME} defines ${home.join(', ')}; excepted: ${excepted.join('; ') || 'none'}`);
      assert(STEPPER_NAMES.every(n => home.includes(n)), `the home's names: ${home.join(', ')}`);
      assert(!hits.length, hits.join('\n'));
    },
  },
  {
    name: 'rules: the spin\'s one home (PLACES §4.15, SPIN_HOME): no module but src/sim/places/spin.js reads a spin\'s ω (omegaRadS) or defines a name with "omega" or "coriolis" in it, the environment\'s data apart',
    fn() {
      const files = srcFiles(), hits = [];
      for (const f of files) {
        const r = rel(f);
        if (r === SPIN_HOME || ENV_HOME.has(r)) continue;
        const code = codeOnly(readFileSync(f, 'utf8')), lineAt = (at) => code.slice(0, at).split('\n').length;
        for (const m of code.matchAll(/(?<![\w$])omegaRadS(?![\w$])/g)) hits.push(`${r}:${lineAt(m.index)}: omegaRadS`);
        for (const d of definedNames(code)) if (/omega|coriolis/i.test(d.name)) hits.push(`${r}:${lineAt(d.at)}: ${d.name}`);
      }
      report({ 'a spin term outside spin.js': hits });
      console.log(`      ${files.length} modules; the home: ${SPIN_HOME} and the environment's data`);
      assert(!hits.length, hits.join('\n'));
    },
  },
  {
    name: 'rules: one take-in helper (COMBAT §25.4.2): no function or top-level const named with "take in" or "react … ms" outside src/sim/combat/react.js',
    fn() {
      const files = srcFiles(), hits = [];
      for (const f of files) {
        if (rel(f) === REACT_HOME) continue;
        const code = codeOnly(readFileSync(f, 'utf8'));
        for (const d of definedNames(code)) if (hasReact(d.name)) hits.push(`${rel(f)}:${code.slice(0, d.at).split('\n').length}: ${d.name}`);
      }
      const home = existsSync(path.join(root, REACT_HOME)) ? definedNames(codeOnly(readFileSync(path.join(root, REACT_HOME), 'utf8'))).filter(d => hasReact(d.name)).map(d => d.name) : [];
      const probe = ['takeInMs', 'TAKEIN_FLOOR_MS', 'take_in', 'reactMs', 'REACT_MS', 'reactUntilMs', 'takeOff', 'inTake', 'reaction', 'reactK'].map(n => `${n} ${hasReact(n) ? 'yes' : 'no'}`);
      report({ 'a take-in defined outside react.js': hits });
      console.log(`      ${files.length} modules; defined in ${REACT_HOME}: ${home.join(', ') || 'none yet'}; the word test: ${probe.join(', ')}`);
      assert(hasReact('takeInMs') && hasReact('TAKEIN_FLOOR_MS') && hasReact('reactMs') && hasReact('REACT_MS') && hasReact('reactUntilMs') && !hasReact('takeOff') && !hasReact('reaction') && !hasReact('reactK'), 'the word test');
      assert(!hits.length, hits.join('\n'));
    },
  },
  {
    name: 'rules: suppression\'s one home (COMBAT §5.9, SUPP_HOME): no top-level SUPP_, HARD_, STARTLE_, INOC_, FLASH_, DEAF_ or NERVE_ name in the sim, core or data outside src/sim/combat/supp.js, but the rule\'s named exceptions',
    fn() {
      const files = [...simFiles(), ...walk(path.join(root, 'src', 'data'))], hits = [], excepted = [];
      for (const f of files) {
        if (rel(f) === SUPP_HOME) continue;
        const code = codeOnly(readFileSync(f, 'utf8'));
        for (const d of definedNames(code)) {
          if (!hasSupp(d.name)) continue;
          const key = `${rel(f)}: ${d.name}`;
          (SUPP_EXCEPT.has(key) ? excepted : hits).push(SUPP_EXCEPT.has(key) ? key : `${rel(f)}:${code.slice(0, d.at).split('\n').length}: ${d.name}`);
        }
      }
      const home = existsSync(path.join(root, SUPP_HOME)) ? definedNames(codeOnly(readFileSync(path.join(root, SUPP_HOME), 'utf8'))).filter(d => hasSupp(d.name)).map(d => d.name) : [];
      const gone = [...SUPP_EXCEPT].filter(k => !excepted.includes(k));
      report({ 'a suppression constant defined outside supp.js': hits });
      console.log(`      ${files.length} modules; defined in ${SUPP_HOME}: ${home.length} (${home.slice(0, 8).join(', ')}, …); excepted: ${excepted.join('; ') || 'none'}${gone.length ? `; listed but gone: ${gone.join('; ')}` : ''}`);
      assert(home.includes('SUPP_MAX') && home.includes('HARD_K') && home.includes('STARTLE_FROM') && home.includes('INOC_CAP') && home.includes('FLASH_PTS') && home.includes('DEAF_K') && home.includes('NERVE_DC0'), `the home's names: ${home.join(', ')}`);
      assert(!hits.length, hits.join('\n'));
    },
  },
  {
    name: 'rules: the environment\'s one home (TECH §1.4, ENV_HOME): no gravity or air literal in src\'s code outside src/data/places/env.js, sites.js and src/core/phys.js (src/art and the named properties apart), no old Melas constant, G0, R and γ only in phys.js, and no gG default in src/sim',
    fn() {
      const files = srcFiles(), lits = [], excepted = [], old = [], phys = [], defaults = [];
      const lineOf = (code, at) => code.slice(0, at).split('\n').length;
      for (const f of files) {
        const r = rel(f), code = codeOnly(readFileSync(f, 'utf8'));
        if (!ENV_HOME.has(r) && folderOf(r) !== 'art') for (const m of code.matchAll(ENV_LITERALS)) {
          const prop = /([A-Za-z_$][\w$]*)\s*:\s*$/.exec(code.slice(Math.max(0, m.index - 40), m.index))?.[1] ?? '', key = `${r}: ${prop} ${m[1]}`;
          (ENV_EXCEPT.has(key) ? excepted : lits).push(ENV_EXCEPT.has(key) ? key : `${r}:${lineOf(code, m.index)}: ${m[1]}`);
        }
        for (const n of ENV_OLD) for (const m of code.matchAll(new RegExp(`(?<![\\w$])${n}(?![\\w$])`, 'g'))) old.push(`${r}:${lineOf(code, m.index)}: ${n}`);
        if (r !== 'src/core/phys.js') for (const d of definedNames(code)) if (ENV_PHYS.includes(d.name)) phys.push(`${r}:${lineOf(code, d.at)}: ${d.name}`);
        if (folderOf(r) === 'sim') for (const m of code.matchAll(ENV_G_DEFAULT)) defaults.push(`${r}:${lineOf(code, m.index)}: gG =`);
      }
      // (the probe: the patterns find what they are for)
      const probe = [[ENV_LITERALS, 'const g = 3.727, p = 65.9;', 2], [ENV_LITERALS, 'x = 0.385 + 10.38 + 1322', 0], [ENV_G_DEFAULT, 'function f(h, gG = 1) {} const { gG = 2 } = o;', 2], [ENV_G_DEFAULT, 'const gG = 1; if (gG === 2) {}', 0]]
        .map(([re, text, want]) => ({ text, want, got: [...text.matchAll(re)].length }));
      const homeNames = definedNames(codeOnly(readFileSync(path.join(root, 'src/core/phys.js'), 'utf8'))).map(d => d.name);
      report({ 'a gravity or air literal outside the home': lits, 'an old Melas constant': old, 'G0, R or γ defined outside phys.js': phys, 'a gG default in src/sim': defaults });
      console.log(`      ${files.length} modules; the home: ${[...ENV_HOME].join(', ')}; phys.js defines ${homeNames.join(', ')}; excepted: ${excepted.join('; ') || 'none'}; the probe ${probe.map(p => `${p.got}/${p.want}`).join(', ')}`);
      assert(probe.every(p => p.got === p.want), JSON.stringify(probe));
      assert(ENV_PHYS.every(n => homeNames.includes(n)), `phys.js defines ${homeNames.join(', ')}`);
      assert(!lits.length && !old.length && !phys.length && !defaults.length, [...lits, ...old, ...phys, ...defaults].join('\n'));
    },
  },
  {
    name: 'rules: no quiet gravity or grip (v0.0.24\'s stage 0, F115, ENV_QUIET_G): no 9.81, no `gG ?? 1`, no fallback after a gravity read in src\'s code (src/art apart), and no grip fallback (μ 0.6) in src/sim',
    fn() {
      const files = srcFiles(), quiet = [];
      const lineOf = (code, at) => code.slice(0, at).split('\n').length;
      for (const f of files) {
        const r = rel(f), code = codeOnly(readFileSync(f, 'utf8'));
        if (folderOf(r) !== 'art') for (const m of code.matchAll(QUIET_G)) quiet.push(`${r}:${lineOf(code, m.index)}: ${m[0].replace(/\s+/g, ' ').slice(0, 60)}`);
        if (folderOf(r) === 'sim') for (const m of code.matchAll(QUIET_MU)) quiet.push(`${r}:${lineOf(code, m.index)}: ${m[0].replace(/\s+/g, ' ')}`);
      }
      // (the probe: the five sites as they were, and their plain reads)
      const probe = [
        [QUIET_G, 'gMs2 = 9.81; const g = gravityAt(state, null, a.x, a.z)?.gMs2 ?? 9.81; x = gravityAt(s, null, me?.x ?? 0, me?.z ?? 0)?.gG ?? 1; y = fig.gMs2 ?? 9.81; z = gG ?? 1;', 7],
        [QUIET_G, 'g = gravityAt(state, null, a.x, a.z).gMs2; h = 19.81; k = gG ?? 10; m = a.gG ?? 1.5; n = gravityAt(state).gG * G0_MS2;', 0],
        [QUIET_MU, 'mu: Number.isFinite(mu) ? mu : 0.6; o = { mu: Number.isFinite(mu) ? mu : SURFACES.concrete.muDry }; p = x ? mu : 0.6', 3],
        [QUIET_MU, 'mu: surfaceAt(state, null, x, z).mu; q = mu ? 1 : 0.65; r = { mu: 0.6 }', 0],
      ].map(([re, text, want]) => ({ want, got: [...text.matchAll(re)].length }));
      report({ 'a quiet gravity or grip': quiet });
      console.log(`      ${files.length} modules; the probe ${probe.map(p => `${p.got}/${p.want}`).join(', ')}`);
      assert(probe.every(p => p.got === p.want), JSON.stringify(probe));
      assert(!quiet.length, quiet.join('\n'));
    },
  },
  {
    name: 'rules: no quiet Melas (ROADMAP "anywhere" step 3, ENV_QUIET): no fallback to Melas by name in src\'s code, and the light, the wall clocks, the watch, the log and the stage\'s clocks keep no Mars clock of their own (env.js localTime is theirs)',
    fn() {
      const files = srcFiles(), quiet = [], clocks = [];
      const lineOf = (code, at) => code.slice(0, at).split('\n').length;
      for (const f of files) {
        const raw = readFileSync(f, 'utf8'), r = rel(f), code = codeOnly(raw);
        // (on the raw text, as codeOnly blanks the strings: a match counts where its operator is code, not a comment's or a string's)
        for (const m of raw.matchAll(ENV_QUIET)) if (code[m.index] === raw[m.index]) quiet.push(`${r}:${lineOf(raw, m.index)}: ${m[0]}`);
        if (CLOCK_READERS.includes(r)) for (const m of code.matchAll(MARS_CLOCKS)) clocks.push(`${r}:${lineOf(code, m.index)}: ${m[1]}`);
      }
      const probe = [[ENV_QUIET, "a ?? 'melas'; b || \"melas\"; c ?? SITES.melas; d ?? WATER_MIN.melas; e ?? MELAS_LON_E_DEG; function f(x, lonEDeg = MELAS_LON_E_DEG) {} g({ lon = MELAS_LON, k })", 7], [ENV_QUIET, "a ?? 'melas.ground'; b ?? x.melasWalls; c === 'melas'; const W = MELAS_WALLS; x === MELAS_LON", 0], [MARS_CLOCKS, 'marsClock(ms, lon); msAtMarsTime(a); marsClocks', 2]]
        .map(([re, text, want]) => ({ text, want, got: [...text.matchAll(re)].length }));
      report({ 'a fallback to Melas by name': quiet, 'a Mars clock in a reader routed through localTime': clocks });
      console.log(`      ${files.length} modules; ${CLOCK_READERS.length} clock readers (${CLOCK_READERS.map(r => r.split('/').slice(-2).join('/')).join(', ')}); the probe ${probe.map(p => `${p.got}/${p.want}`).join(', ')}`);
      assert(probe.every(p => p.got === p.want), JSON.stringify(probe));
      assert(!quiet.length && !clocks.length, [...quiet, ...clocks].join('\n'));
    },
  },
  {
    name: 'rules: a scene stands where its spec says (ROADMAP "anywhere" step 4, SCENE_HOST): no SCENARIO_SITES in src, no Mars clock in a scenario\'s fill or newGame (env.js msAtLocal at the host moves the clock), no literal site in a fill',
    fn() {
      const files = srcFiles(), table = [], clock = [], sites = [];
      const lineOf = (code, at) => code.slice(0, at).split('\n').length;
      for (const f of files) {
        const raw = readFileSync(f, 'utf8'), r = rel(f), code = codeOnly(raw);
        for (const m of code.matchAll(SCENE_TABLE)) table.push(`${r}:${lineOf(code, m.index)}`);
        if (!SCENE_FILLS(r)) continue;
        for (const m of code.matchAll(SCENE_CLOCK)) clock.push(`${r}:${lineOf(code, m.index)}`);
        // (on the raw text, as codeOnly blanks the string: a match counts where its key is code)
        for (const m of raw.matchAll(SCENE_SITE)) if (code[m.index] === raw[m.index]) sites.push(`${r}:${lineOf(raw, m.index)}: ${m[0]}`);
      }
      const probe = [[SCENE_TABLE, 'SCENARIO_SITES[x]; MY_SCENARIO_SITES', 1], [SCENE_CLOCK, 'msAtMarsTime(a); msAtMarsTimes', 1], [SCENE_SITE, "{ site: 'melas' }, { site: x.host.site }, { mysite: 'a' }", 1]]
        .map(([re, text, want]) => ({ text, want, got: [...text.matchAll(re)].length }));
      report({ 'the old SCENARIO_SITES': table, 'a Mars clock in a fill or newGame': clock, 'a literal site in a fill': sites });
      console.log(`      ${files.length} modules, ${files.map(rel).filter(SCENE_FILLS).length} of them fills or newGame; the probe ${probe.map(p => `${p.got}/${p.want}`).join(', ')}`);
      assert(probe.every(p => p.got === p.want), JSON.stringify(probe));
      assert(!table.length && !clock.length && !sites.length, [...table, ...clock, ...sites].join('\n'));
    },
  },
  {
    name: 'rules: the debrief\'s trace has one reader (the build sheet v0.0.20 §1 item 26, TRACE_HOME): no module in src names R.house.$trace but src/sim/scenarios/house-debrief.js, which reads it, and shoothouse.js, whose traceTick alone writes it (once)',
    fn() {
      const hits = [];
      for (const f of srcFiles()) { const code = codeOnly(readFileSync(f, 'utf8')), n = [...code.matchAll(/\$trace\b/g)].length; if (n) hits.push([rel(f), n]); }
      const bad = hits.filter(([f, n]) => !(f === TRACE_HOME.reader || (f === TRACE_HOME.writer && n === 1)));
      const probe = [...codeOnly('a.$trace; b.$traced; // $trace\nc[\'$trace\']').matchAll(/\$trace\b/g)].length;
      console.log(`      $trace named in ${hits.map(([f, n]) => `${f} (${n})`).join(', ') || 'no module'}; the probe ${probe}/1`);
      assert(probe === 1 && !bad.length && hits.some(([f]) => f === TRACE_HOME.reader), JSON.stringify({ bad, hits, probe }));
    },
  },
  {
    name: 'rules: the read scope\'s writers (the build sheet v0.0.21 §1 item 13, READS_HOME): no module in src assigns state.$reads but src/sim/skills/instinct.js and src/sim/arms/shooting.js',
    fn() {
      const W = /\.\$reads\s*=(?!=)/g, hits = [];
      for (const f of srcFiles()) { const n = [...codeOnly(readFileSync(f, 'utf8')).matchAll(W)].length; if (n) hits.push([rel(f), n]); }
      const bad = hits.filter(([f]) => !READS_HOME.includes(f));
      const probe = [...codeOnly('s.$reads = m; s.$reads === m; s.$readsOff = 1; // s.$reads = x').matchAll(W)].length;
      console.log(`      state.$reads assigned in ${hits.map(([f, n]) => `${f} (${n})`).join(', ') || 'no module'}; the probe ${probe}/1`);
      assert(probe === 1 && !bad.length && READS_HOME.every(f => hits.some(([g]) => g === f)), JSON.stringify({ bad, hits, probe }));
    },
  },
  {
    name: 'rules: QUICK_SLOW is frozen (the build sheet v0.0.21 §1 item 26): tests/run.mjs names only quick files that exist, and against the last tag\'s list (where it has one) no file joins and no ceiling rises',
    fn() {
      const slowOf = (src) => { const m = /const QUICK_SLOW = Object\.freeze\(\{([\s\S]*?)\n\}\);/.exec(src ?? ''); return m ? Object.fromEntries([...m[1].matchAll(/'([^']+)':\s*([0-9.]+)/g)].map(x => [x[1], Number(x[2])])) : null; };
      const now = slowOf(readFileSync(path.join(root, 'tests/run.mjs'), 'utf8'));
      assert(now && Object.keys(now).length, 'tests/run.mjs has no QUICK_SLOW');
      const missing = Object.keys(now).filter(f => !existsSync(path.join(root, 'tests', f)));
      let tag = null, then = null;
      try {
        tag = execFileSync('git', ['describe', '--tags', '--abbrev=0'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
        then = slowOf(execFileSync('git', ['show', `${tag}:tests/run.mjs`], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 24 }));
      } catch { /* (no git here, the play copy's checkout: nothing to hold it against) */ }
      const joined = then ? Object.keys(now).filter(f => !(f in then)) : [], rose = then ? Object.keys(now).filter(f => f in then && now[f] > then[f]) : [];
      console.log(`      QUICK_SLOW: ${Object.keys(now).length} files, ${Object.values(now).reduce((a, b) => a + b, 0).toFixed(1)} s of ceilings; missing ${missing.length}; the last tag ${tag ?? 'none'}${then ? `: ${Object.keys(then).length} files, joined ${joined.length}, ceilings risen ${rose.length}` : ': no list to hold it against'}`);
      assert(!missing.length && !joined.length && !rose.length, JSON.stringify({ missing, joined, rose: rose.map(f => [f, then[f], now[f]]) }));
    },
  },
  {
    name: 'rules: the operation record\'s one reader (the build sheet v0.0.21 §1 item 21, OP_HOME): no module of src/sim/combat/ but op.js, nor cqb.js, sidearm.js, kit.js or shooting.js, names armoury.range.house or tests course === \'house\' in its code',
    fn() {
      const PATS = [/armoury\??\.range\??\.house\b/g, /\.course\s*[!=]==\s*(['"])house\1/g];
      // (a match in code: its first character is code, not a comment's or a string's, which codeOnly blanks)
      const hitsIn = (src) => { const code = codeOnly(src), out = []; for (const re of PATS) for (const m of src.matchAll(re)) if (code[m.index] === src[m.index]) out.push(src.slice(m.index, m.index + m[0].length)); return out; };
      const held = srcFiles().map(rel).filter(f => f !== OP_HOME.home && (OP_HOME.dirs.some(d => f.startsWith(d)) || OP_HOME.files.includes(f)));
      const bad = [];
      for (const f of held) { const h = hitsIn(readFileSync(path.join(root, f), 'utf8')); if (h.length) bad.push(`${f}: ${h.length} (${[...new Set(h)].join(', ')})`); }
      const probe = hitsIn("const H = state.armoury?.range?.house; if (R.course === 'house') x(); // state.armoury.range.house\nconst s = 'R.course === \"house\"';").length;
      const home = hitsIn(readFileSync(path.join(root, OP_HOME.home), 'utf8')).length;
      console.log(`      ${held.length} modules held to op.js: ${bad.length} naming the house's record or course${bad.length ? `: ${bad.join('; ')}` : ''}; op.js itself ${home}; the probe ${probe}/2`);
      assert(probe === 2 && !bad.length && home > 0, JSON.stringify({ bad, probe, home }));
    },
  },
  {
    name: 'rules: the operation\'s turners and record are read through op.js off the range too (the code review of 2026-11-16): no module held to OP_HOME reads armoury.range.turners, nor names the range session in a variable whose .house or .turners it then reads (sessionOf, turnersOf)',
    fn() {
      // (an alias read: `R = state.armoury?.range`, then `R?.house` or `R.turners` before the function ends; upIn, mineUp, rebracket
      // and lineTargetOf read only the range's turners that way, so off the range "Clear!" was called with a man still up)
      const DIRECT = /armoury\??\.range\??\.turners\b/g, ALIAS = /\b(\w+)\s*=\s*state\??\.armoury\??\.range\b(?!\??\.)/g;
      const hitsIn = (src) => {
        const code = codeOnly(src), out = [], line = (i) => src.slice(0, i).split('\n').length;
        for (const m of src.matchAll(DIRECT)) if (code[m.index] === src[m.index]) out.push(`:${line(m.index)} ${m[0]}`);
        for (const m of src.matchAll(ALIAS)) {
          if (code[m.index] !== src[m.index]) continue;
          const rest = src.slice(m.index), end = rest.search(/\n(?:export |function |const \w+ = \(|\/\*\*)/), body = codeOnly(rest.slice(0, end < 0 ? undefined : end));
          const use = new RegExp(`\\b${m[1]}\\??\\.(house|turners)\\b`).exec(body);
          if (use) out.push(`:${line(m.index)} ${m[1]} = state.armoury.range, then ${use[0]}`);
        }
        return out;
      };
      const held = srcFiles().map(rel).filter(f => f !== OP_HOME.home && (OP_HOME.dirs.some(d => f.startsWith(d)) || OP_HOME.files.includes(f)));
      const bad = [];
      for (const f of held) { const h = hitsIn(readFileSync(path.join(root, f), 'utf8')); if (h.length) bad.push(`${f}${h.join(', ')}`); }
      const probe = hitsIn("function a(state) {\n  const R = state.armoury?.range, x = R?.turners;\n}\nfunction b(state) {\n  return state.armoury?.range?.turners ?? [];\n}\nfunction c(state) {\n  const R = state.armoury?.range; return R?.course; // R.house\n}\n").length;
      console.log(`      ${held.length} modules held to op.js: ${bad.length} reading the range's turners or record by an alias${bad.length ? `: ${bad.join('; ')}` : ''}; the probe ${probe}/2`);
      assert(probe === 2 && !bad.length, JSON.stringify({ bad, probe }));
    },
  },
  {
    name: 'rules: combat imports no scenario (the build sheet v0.0.21 §0 item 31): no module of src/sim/combat/ imports from src/sim/scenarios/; the #2\'s brain (combat/two.js) calls the lane through op.js\'s host',
    fn() {
      const combat = srcFiles().filter(f => rel(f).startsWith('src/sim/combat/')), bad = [];
      for (const f of combat) for (const m of importsOf(f)) if (m.startsWith('src/sim/scenarios/')) bad.push(`${rel(f)} imports ${m}`);
      const probe = importsIn("import { a } from '../scenarios/x.js';\n// import { b } from '../scenarios/y.js';", path.join(root, 'src/sim/combat/probe.js')).filter(m => m.startsWith('src/sim/scenarios/')).length;
      console.log(`      ${combat.length} modules of src/sim/combat/: ${bad.length} importing a scenario${bad.length ? `: ${bad.join('; ')}` : ''}; the probe ${probe}/1`);
      assert(probe === 1 && !bad.length && combat.some(f => rel(f) === 'src/sim/combat/two.js'), JSON.stringify({ bad, probe }));
    },
  },
  {
    name: 'rules: the #2\'s brain has one path (the build sheet v0.0.22 §2 step 1): src/sim/scenarios/house-two.js, v0.0.21\'s shim, is gone, and no module of src, tests or tools imports it; every one imports src/sim/combat/two.js',
    fn() {
      // (only a module whose text names the file is parsed: the scan reads 800 modules, the suite's CPU budget is 3 s)
      const SHIM = 'src/sim/scenarios/house-two.js', files = [...srcFiles(), ...walk(path.join(root, 'tests')), ...toolFiles()], bad = [];
      let users = 0;
      for (const f of files) {
        const src = readFileSync(f, 'utf8');
        if (!src.includes('two.js')) continue;
        const ims = importsIn(src, f);
        if (ims.includes(SHIM)) bad.push(rel(f));
        if (ims.includes('src/sim/combat/two.js')) users++;
      }
      const probe = importsIn("import { twoTick } from '../src/sim/scenarios/house-two.js';\n// import { x } from '../src/sim/scenarios/house-two.js';", path.join(root, 'tests/probe.mjs')).filter(m => m === SHIM).length;
      console.log(`      ${files.length} modules of src, tests and tools: ${bad.length} importing the shim${bad.length ? `: ${bad.join(', ')}` : ''}; ${users} importing combat/two.js; the shim ${existsSync(path.join(root, SHIM)) ? 'still there' : 'gone'}; the probe ${probe}/1`);
      assert(probe === 1 && !bad.length && !existsSync(path.join(root, SHIM)) && users > 0, JSON.stringify({ bad, probe, users }));
    },
  },
  {
    name: 'rules: the live lane\'s one seam (the build sheet v0.0.22 §0 item 16, §2 step 4): no code of src names OPFOR_SPOTS[ outside opfor.js spotOf, nor RP_STANDS outside spotOf, rpStandsOf, parseOpfor and opforCode (the URL\'s grammar), house-opfor.js\'s declarations and the import; v0.0.26 (its build sheet §1 A): BREACH_SPOTS[ outside spotOf, nor BREACH_STANDS outside rpStandsOf, likewise',
    fn() {
      const HOME = 'src/sim/scenarios/opfor.js', DATA = 'src/data/places/house-opfor.js';
      const RULES = [{ re: /\bOPFOR_SPOTS\s*\[/g, ok: ['spotOf'] }, { re: /\bRP_STANDS\b/g, ok: ['spotOf', 'rpStandsOf', 'parseOpfor', 'opforCode'] },
        { re: /\bBREACH_SPOTS\s*\[/g, ok: ['spotOf'] }, { re: /\bBREACH_STANDS\b/g, ok: ['rpStandsOf'] }];
      // (the top-level declaration a place in the code lies in: the last `function name(` or `const name =` at a line's start before
      // it, `import` for an import statement, the module's name for its data)
      const ownerAt = (code, at) => {
        const head = code.slice(0, at), line = head.slice(head.lastIndexOf('\n') + 1);
        if (/^\s*import\b/.test(line) || /^import\b[^;]*$/s.test(head.slice(head.lastIndexOf(';') + 1).trimStart())) return 'import';
        let name = null;
        for (const m of head.matchAll(/^(?:export\s+)?(?:async\s+)?(?:function\s*\*?\s*([A-Za-z_$][\w$]*)|(?:const|let|var)\s+([A-Za-z_$][\w$]*))/gm)) name = m[1] ?? m[2];
        return name;
      };
      const hitsIn = (src) => { const code = codeOnly(src), out = []; for (const R of RULES) for (const m of code.matchAll(R.re)) out.push({ what: m[0].replace(/\s+/g, ''), owner: ownerAt(code, m.index), ok: R.ok }); return out; };
      const bad = [], seen = {};
      for (const f of srcFiles()) {
        const r = rel(f), src = readFileSync(f, 'utf8');
        // (only a module whose text names either is read as code)
        if (!src.includes('OPFOR_SPOTS') && !src.includes('RP_STANDS') && !src.includes('BREACH_SPOTS') && !src.includes('BREACH_STANDS')) continue;
        for (const h of hitsIn(src)) {
          seen[r] = (seen[r] ?? 0) + 1;
          if (r === DATA || h.owner === 'import') continue;
          if (r !== HOME || !h.ok.includes(h.owner)) bad.push(`${r}: ${h.what} in ${h.owner ?? 'the module'}`);
        }
      }
      const owners = hitsIn(readFileSync(path.join(root, HOME), 'utf8')).filter(h => h.owner !== 'import').map(h => `${h.what} ${h.owner}`);
      const probe = hitsIn("import { OPFOR_SPOTS, RP_STANDS } from 'x';\nexport function spotOf(state, T) { return OPFOR_SPOTS[T.stand]; }\nfunction hear(state, T) { const S = OPFOR_SPOTS[T.stand]; } // OPFOR_SPOTS[x]\nconst all = RP_STANDS.length;")
        .filter(h => h.owner !== 'import' && !h.ok.includes(h.owner)).length;
      // (v0.0.26: the scene's table by the same rule, and its probe: a read of BREACH_SPOTS[ in hear and of BREACH_STANDS in fillOpfor refused)
      const probe2 = hitsIn("import { BREACH_SPOTS, BREACH_STANDS } from 'x';\nexport function spotOf(state, T) { return BREACH_SPOTS[T.stand]; }\nexport function rpStandsOf(state) { return BREACH_STANDS; }\nfunction hear(state, T) { const S = BREACH_SPOTS[T.stand]; }\nfunction fillOpfor(state) { for (const s of BREACH_STANDS) {} }")
        .filter(h => h.owner !== 'import' && !h.ok.includes(h.owner)).length;
      console.log(`      named in ${Object.entries(seen).map(([f, n]) => `${f} (${n})`).join(', ')}; in opfor.js's code: ${owners.join(', ')}; out of place ${bad.length}${bad.length ? `: ${bad.join('; ')}` : ''}; the probe ${probe}/2, the scene's ${probe2}/2`);
      assert(probe === 2 && probe2 === 2 && !bad.length && owners.some(o => o === 'OPFOR_SPOTS[ spotOf') && owners.some(o => o === 'RP_STANDS rpStandsOf') && owners.some(o => o === 'BREACH_SPOTS[ spotOf') && owners.some(o => o === 'BREACH_STANDS rpStandsOf'), JSON.stringify({ bad, owners, probe, probe2 }));
    },
  },
  {
    name: 'rules: the ghosts are the page\'s (the build sheet v0.0.22 §0 item 31): no module of src/sim or src/core imports src/ui/cards/house-ghosts.js',
    fn() {
      const GHOSTS = 'src/ui/cards/house-ghosts.js', bad = [];
      for (const f of simFiles()) { const src = readFileSync(f, 'utf8'); if (src.includes('house-ghosts') && importsIn(src, f).includes(GHOSTS)) bad.push(rel(f)); }
      const probe = importsIn("import { ghostOf } from '../../ui/cards/house-ghosts.js';", path.join(root, 'src/sim/scenarios/probe.js')).filter(m => m === GHOSTS).length;
      console.log(`      ${simFiles().length} sim and core modules: ${bad.length} importing the ghosts${bad.length ? `: ${bad.join(', ')}` : ''}; the module ${existsSync(path.join(root, GHOSTS)) ? 'built' : 'not built yet (v0.0.22 D)'}; the probe ${probe}/1`);
      assert(probe === 1 && !bad.length, JSON.stringify({ bad, probe }));
    },
  },
  {
    name: 'rules: the runner\'s gates and warm-up (the build sheet v0.0.25 §2 step 4): tests/run.mjs parses, reads GATES and WARM from the environment and warms a worker with its WARM_LANES; every test marked gate: true is heavy, and they are the drawn and eight-room sweeps\' four',
    fn() {
      execFileSync(process.execPath, ['--check', path.join(root, 'tests/run.mjs')], { stdio: ['ignore', 'pipe', 'pipe'] });
      const src = readFileSync(path.join(root, 'tests/run.mjs'), 'utf8');
      const has = { gates: /const GATES = process\.env\.GATES === '1'/.test(src), warm: /const WARM = process\.env\.WARM !== '0'/.test(src), lanes: /const WARM_LANES = /.test(src), skip: /if \(t\.gate && !GATES\)/.test(src), warmUp: /async function warmUp\(/.test(src) };
      // (each test object marked gate: true, found by its marker, with the heavy flag in the same object before it)
      const gates = [];
      for (const f of readdirSync(path.join(root, 'tests')).filter(x => x.endsWith('.test.mjs') && x !== 'syntax.test.mjs')) {
        const t = readFileSync(path.join(root, 'tests', f), 'utf8');
        for (const m of t.matchAll(/\n {4}gate: true,/g)) { const head = t.slice(Math.max(0, t.lastIndexOf('\n  {\n', m.index)), m.index); gates.push({ f, heavy: /\n {4}heavy: true,/.test(head) }); }
      }
      const by = gates.reduce((a, g) => ({ ...a, [g.f]: (a[g.f] ?? 0) + 1 }), {});
      console.log(`      the runner: ${Object.entries(has).map(([k, v]) => `${k} ${v ? 'yes' : 'NO'}`).join(', ')}; gates ${gates.length} (${Object.entries(by).map(([f, n]) => `${f.replace('.test.mjs', '')} ${n}`).join(', ')}), heavy ${gates.filter(g => g.heavy).length}`);
      assert(Object.values(has).every(Boolean) && gates.length === 4 && gates.every(g => g.heavy) && by['house-drawn.test.mjs'] === 2 && by['house-drawn8.test.mjs'] === 2, JSON.stringify({ has, by }));
    },
  },
];
