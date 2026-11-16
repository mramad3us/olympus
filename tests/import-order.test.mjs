// OLYMPUS tests: the import order (the build sheet v0.0.19 §0 item 12, §2 step 6): each module of the house's cycles loads first in a fresh node process without a throw.
//
// shoothouse.js re-exports house-two.js's names and house-two.js calls shoothouse.js's; bundle.js, contact.js, cqb.js and
// house-two.js ask combat/team.js whose a man is; plan.js would import devplan.js (K's). A cycle of function references is
// safe, but a top-level read of a binding across it is a TDZ error whichever module loads first, and in the game it would be
// the order the page happens to load them in that decides. So each is imported first, alone, in its own process: house-two.js,
// devplan.js (K's, once it lands: until then a skip with a note), shoothouse.js, plan.js, team.js and the game itself. Each
// prints its exports' count and its load time.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { assert, root } from './helpers.mjs';

/** The modules each imported first, in its own process. */
export const FIRST = Object.freeze([
  'src/sim/scenarios/house-two.js',
  'src/sim/arms/devplan.js',
  'src/sim/scenarios/shoothouse.js',
  'src/sim/arms/plan.js',
  'src/sim/combat/team.js',
  // (the review of v0.0.19: both threw imported first, on sidearm.js's CALL_MS and house-two.js's TWO_READY_MS, top-level reads
  // of bundle.js's CALL_FLOW_S and CALL_S across the cycle)
  'src/sim/combat/bundle.js',
  'src/sim/combat/breach.js',
  'src/sim/game.js',
]);
// (K's module, not built before its merge: a skip with a note, never a pass that tested nothing)
const LATER = Object.freeze({ 'src/sim/arms/devplan.js': 'K-sim\'s (the build sheet v0.0.19 §3.1)' });

// (one module imported first in a fresh process: { ok, n, ms } or { ok: false, err })
function importFirst(rel) {
  const url = new URL(`file://${path.join(root, rel)}`).href;
  const code = `const t = performance.now(); import(${JSON.stringify(url)}).then(m => { console.log(JSON.stringify({ ok: true, n: Object.keys(m).length, ms: Math.round(performance.now() - t) })); }, e => { console.log(JSON.stringify({ ok: false, err: String(e?.stack ?? e).split('\\n').slice(0, 3).join(' | ') })); });`;
  try {
    const out = execFileSync(process.execPath, ['--input-type=module', '-e', code], { cwd: root, encoding: 'utf8', timeout: 60_000 });
    return JSON.parse(out.trim().split('\n').at(-1));
  } catch (e) { return { ok: false, err: String(e?.message ?? e).slice(0, 300) }; }
}

export default [
  {
    name: 'each of house-two.js, devplan.js, shoothouse.js, plan.js, team.js, bundle.js, combat/breach.js and game.js imported first in a fresh node process loads without a throw: no top-level read of a binding across the house\'s cycles (the build sheet v0.0.19 §0 item 12)',
    timeoutMs: 120_000,
    fn() {
      const bad = [];
      for (const rel of FIRST) {
        if (!existsSync(path.join(root, rel))) {
          assert(LATER[rel], `${rel} is missing and is not a module still to come`);
          console.log(`      ${rel}: skipped, not built yet (${LATER[rel]}): it joins this test once it lands`);
          continue;
        }
        const r = importFirst(rel);
        console.log(`      ${rel}: ${r.ok ? `loads first, ${r.n} exports, ${r.ms} ms` : `THROWS: ${r.err}`}`);
        if (!r.ok) bad.push(`${rel}: ${r.err}`);
      }
      assert(!bad.length, bad.join('\n'));
    },
  },
  {
    name: 'the literals that broke the cycle stand for what they replaced: sidearm.js CALL_MS is bundle.js CALL_FLOW_S in ms (the review of v0.0.19)',
    async fn() {
      const [{ CALL_MS }, { CALL_FLOW_S, CALL_S }] = await Promise.all([import('../src/sim/arms/sidearm.js'), import('../src/sim/combat/bundle.js')]);
      const src = (await import('node:fs')).readFileSync(path.join(root, 'src/sim/scenarios/house-two.js'), 'utf8'), ready = Number(/const TWO_READY_MS = (\d+);/.exec(src)?.[1]);
      console.log(`      CALL_MS ${CALL_MS} (CALL_FLOW_S ${CALL_FLOW_S} s); house-two.js TWO_READY_MS ${ready} (CALL_S ${CALL_S} s)`);
      assert(CALL_MS === Math.round(CALL_FLOW_S * 1000) && ready === Math.round(CALL_S * 1000), JSON.stringify({ CALL_MS, CALL_FLOW_S, ready, CALL_S }));
    },
  },
];
