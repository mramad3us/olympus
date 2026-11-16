// OLYMPUS tests: the shoot house's one reader (the build sheet v0.0.21 §1 item 1, §3 step 5, §0 item 47; house lens H1).
//
// The house's authored records (src/data/places/wheel.js HOUSE1 and LAYOUT_A, x4-plans.js X4_PLANS, and X4_CHUNKS, wheel.js's
// today and src/data/chunks/x4.js's once the drawn house lands) reach the game through src/sim/scenes/assemble.js (houseSpecOf,
// planSetOf, plansOfArea) and room.js alone, so a house laid out any other way changes one module. The scan reads each module's
// imports (comments left out) and fails on any other module of src importing one of those names from those files; a name of
// the same spelling from elsewhere is not the house's (echo.js has its own LAYOUT_A, Echo's layouts), and a comment naming
// HOUSE1 (turners.js, house-opfor.js) is no import. On v0.0.20's tree it fails on six modules: shoothouse.js, bundle.js,
// instinct/range.js, render/range.js, zones.js and house-debrief.js.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { assert, root } from './helpers.mjs';

/** The modules that may import the house's records, and the records' homes. */
export const HOUSE_READERS = Object.freeze(['src/data/places/wheel.js', 'src/data/places/x4-plans.js', 'src/sim/scenes/assemble.js', 'src/sim/combat/room.js']);
const HOMES = Object.freeze(['src/data/places/wheel.js', 'src/data/places/x4-plans.js', 'src/data/chunks/x4.js']);
const NAMES = Object.freeze(['HOUSE1', 'X4_PLANS', 'LAYOUT_A', 'X4_CHUNKS']);

function jsFiles(dir) {
  const out = [];
  for (const n of readdirSync(dir)) { const p = path.join(dir, n); if (statSync(p).isDirectory()) out.push(...jsFiles(p)); else if (n.endsWith('.js')) out.push(p); }
  return out;
}
// (a module's import and re-export statements, comments left out: [{ names, from (repo-relative) }]; `* as` counts as every name)
export function houseImports(src, file) {
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
  const out = [];
  for (const m of code.matchAll(/\b(?:import|export)\s*(\*\s*as\s+\w+|\{[^}]*\})\s*from\s*(['"])([^'"]+)\2/g)) {
    if (!m[3].startsWith('.')) continue;
    const from = path.relative(root, path.resolve(path.dirname(file), m[3])).split(path.sep).join('/');
    const names = m[1].startsWith('*') ? [...NAMES] : m[1].slice(1, -1).split(',').map(x => x.trim().split(/\s+as\s+/)[0]).filter(Boolean);
    out.push({ names, from });
  }
  return out;
}

export default [
  {
    name: 'the house\'s one reader: no module of src but wheel.js, x4-plans.js, scenes/assemble.js and combat/room.js imports HOUSE1, X4_PLANS, LAYOUT_A or X4_CHUNKS from their homes (six did on v0.0.20\'s tree)',
    fn() {
      const files = jsFiles(path.join(root, 'src')), bad = [], readers = [];
      for (const f of files) {
        const rel = path.relative(root, f).split(path.sep).join('/');
        const hits = houseImports(readFileSync(f, 'utf8'), f).filter(x => HOMES.includes(x.from)).flatMap(x => x.names.filter(n => NAMES.includes(n)));
        if (!hits.length) continue;
        (HOUSE_READERS.includes(rel) ? readers : bad).push(`${rel} (${[...new Set(hits)].join(', ')})`);
      }
      const probe = houseImports("import { HOUSE1, WHEEL_S4 } from '../../data/places/wheel.js';\n// import { X4_PLANS } from '../../data/places/x4-plans.js';\nimport { LAYOUT_A } from './echo.js';", path.join(root, 'src/sim/scenarios/probe.js'))
        .filter(x => HOMES.includes(x.from)).flatMap(x => x.names.filter(n => NAMES.includes(n)));
      console.log(`      ${files.length} modules: the readers ${readers.join(', ') || 'none'}; others importing the house's records ${bad.length}${bad.length ? `: ${bad.join(', ')}` : ''}; the probe ${probe.join(', ')} (want HOUSE1 alone)`);
      assert(probe.length === 1 && probe[0] === 'HOUSE1' && !bad.length, JSON.stringify({ bad, probe }));
    },
  },
];
