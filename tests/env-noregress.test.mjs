// OLYMPUS tests: env-noregress, F100 (the build sheet v0.0.24 §2 step 1, §8's F97, shifted by three: the anywhere note's V0), nothing moves at Mars and the Wheel.
//
// The anywhere round (the footing, free fall, gravity events, the two scenes off Mars) adds code that every mover, every roll
// and every pull reads, and promises that none of it moves a byte where the gravity holds the feet: at 0.3 G and up every body
// is planted, no surface is read, no profile is set, the clocks keep Melas's arithmetic by branch. This file holds that promise
// through stage 0 and roles A to D (the overhaul's E re-records the house cells' saves in its own two steps, named in its
// handoff). ROADMAP §4.2's row named it in 2026-11-08 and it was never a file; here it is one.
//   - quick: the bay at 23:00 (the barracks scene at hour 23, seed 48213, 1,000 ticks with no keys) to its save's digest, and
//     its save loaded in a fresh game carrying on 200 ticks to the same digest as the game that made it; and the house's quick
//     cell (house-pin's own: the honest tier one on 48213 from the fill to the card, its tick, run sheet and save), run through
//     house-pin's own test so there is one table of it.
//   - heavy: every shipped scene (src/data/scenes.js SCENES and STARTS) at 1,000 ticks on seed 48213 with no keys, to the save's
//     digest recorded below; then the suites that hold the rest, run whole from here (their own tables, never copied): house-pin's
//     24 cells, house-pin-drawn's 16, house-live-pin's four, game-upgrade (every save in tests/saves/ loads and carries on), the
//     user's walk of moment 2 (game-walk), and the goldens (the eleven node suites that call golden(): the people, the places'
//     validation, the house's shapes and its draws, the rooms, the doll's gear, the target view, the held devices' art and
//     samples, the determinism suite).
// The scene digests were recorded on v0.0.23's integrated tree (.run/v024/v023-snapshot.tree efa558b2) before any v0.0.24 edit,
// by .run/v024/lead-figures/scripts/scene-digests.mjs (PRINT_HASH=1 here prints them to paste). A digest that moves is a
// regression of the anywhere round until its cause is named (a move at Mars or the Wheel is never this round's to make).
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { PRINT_HASH } from './golden.mjs';
import { SCENES, STARTS } from '../src/data/scenes.js';
import housePin from './house-pin.test.mjs';

/** Every shipped scene at 1,000 ticks on 48213 with no keys: id → the save's digest (the snapshot's, before stage 0). */
export const SCENE_DIGESTS = Object.freeze({
  'test-shower': '03e433407cc54c',
  'test-night': '09b9ffb80d8748',
  'test-handling': '1ac96d904b989b',
  'test-handling-mixed': '08a22b4102bb56',
  'test-range': '0728efec39ff42',
  'test-pairs': '104c85f1e550a6',
  'test-pairs-bangs': '134a4feaa051af',
  'test-stress': '1dc15a454c90b5',
  'test-shoothouse': '1c3294d33a0743',
  'test-shoothouse-live': '1f4955475ac5ee',
  barracks: '0dcf5d76260505',
  sandbox: '041066a9e6c2e3',
  // (v0.0.24 D's two scenes, pinned by the v0.0.24 integration at the digests D and the review of D to F recorded on the final build
  // tree (c744ae46), unmoved by the merge: new scenes, so their own first pins, nothing re-recorded)
  'test-anchors': '12993752104fa6',
  'test-burn': '1881687a385edc',
});
/** The bay at 23:00 (the quick cell): the barracks at hour 23, 1,000 ticks. */
export const BAY_2300 = Object.freeze({ scenario: 'barracks', hour: 23, seed: 48213, ticks: 1000, digest: '154a1ea53a1608' });
/** The suites run whole by the heavy case: the pins, the saves, moment 2's walk, the goldens (node suites only). */
export const HELD_SUITES = Object.freeze([
  'house-pin', 'house-pin-drawn', 'house-live-pin', 'game-upgrade', 'game-walk',
  'people-roster', 'places-validate', 'house-shapes', 'house-draw8', 'room', 'doll-gear', 'target-view', 'art-held', 'samples-held', 'game-determinism',
]);

const SCENE_ROWS = () => [...Object.values(SCENES), ...Object.values(STARTS)].map(s => ({ id: s.id, scenario: s.scenario, ...(s.setup ? { setup: s.setup } : {}), ...(s.opfor ? { opfor: s.opfor } : {}) }));

// (one scene: made on 48213, n ticks with no keys, its save's digest and its errors)
function sceneAt({ id, ticks = 1000, seed = 48213, ...o }) {
  const g = createGame({ seed, ...o });
  g.step(ticks, {});
  return { id, g, tick: g.state.clock.tick, digest: g.digest(), errors: g.errors.length };
}

// (each held suite's tests run in turn, as the runner would run the file; a test that throws is the suite's failure, named)
async function runSuite(name) {
  const tests = (await import(`./${name}.test.mjs`)).default;
  const out = { name, ran: 0, failed: [] };
  for (const t of tests) {
    try { await t.fn(); out.ran++; } catch (e) { out.failed.push(`${t.name}: ${String(e?.message ?? e).split('\n')[0].slice(0, 300)}`); }
  }
  return out;
}

export default [
  {
    name: 'env-noregress, quick (F100): the bay at 23:00 is the snapshot\'s to the byte at 1,000 ticks, and its save carries on byte for byte in a fresh game',
    fn() {
      const A = sceneAt({ id: 'bay@23', ...BAY_2300 });
      const json = A.g.save();
      const B = createGame({ scenario: BAY_2300.scenario, hour: BAY_2300.hour, seed: BAY_2300.seed });
      B.load(json);
      A.g.step(200, {}); B.step(200, {});
      const on = { a: A.g.digest(), b: B.digest() };
      console.log(`      the bay at 23:00 on ${BAY_2300.seed}: tick ${A.tick}, digest ${A.digest} (the snapshot's ${BAY_2300.digest}), errors ${A.errors}; 200 ticks on: ${on.a} and from its save ${on.b}`);
      if (PRINT_HASH) return;
      assert(A.digest === BAY_2300.digest && A.errors === 0, JSON.stringify({ got: A.digest, want: BAY_2300.digest, errors: A.errors }));
      assert(on.a === on.b, JSON.stringify(on));
    },
  },
  {
    name: 'env-noregress, quick (F100): the house\'s quick cell (house-pin\'s honest tier one on 48213, from the fill to the card) is held to the tick, the run sheet and the save',
    fn() {
      const quick = housePin.filter(t => !t.heavy);
      assert(quick.length === 1, `house-pin's quick cases: ${quick.length}`);
      quick[0].fn();
    },
  },
  {
    name: 'env-noregress (F100): every shipped scene at 1,000 ticks on 48213 is the snapshot\'s to the byte, and the pins, the saves, moment 2\'s walk and the goldens hold (their own suites, run whole)',
    heavy: true,
    timeoutMs: 60 * 60_000,
    async fn() {
      const moved = [];
      for (const row of SCENE_ROWS()) {
        const r = sceneAt(row), want = SCENE_DIGESTS[row.id] ?? null;
        if (PRINT_HASH) { console.log(`      '${row.id}': '${r.digest}',`); continue; }
        const same = r.digest === want && r.errors === 0;
        console.log(`      ${row.id}: tick ${r.tick}, digest ${r.digest}${same ? '' : want ? `  MOVED from ${want}` : '  (no digest yet)'}, errors ${r.errors}`);
        if (!same) moved.push(row.id);
      }
      const unknown = Object.keys(SCENE_DIGESTS).filter(id => !SCENE_ROWS().some(r => r.id === id));
      if (PRINT_HASH) return;
      const suites = [];
      for (const name of HELD_SUITES) {
        const t0 = performance.now(), s = await runSuite(name);
        console.log(`      ${name}: ${s.ran} passed, ${s.failed.length} failed (${((performance.now() - t0) / 1000).toFixed(1)} s)${s.failed.length ? `: ${s.failed.join(' | ')}` : ''}`);
        suites.push(s);
      }
      const bad = suites.filter(s => s.failed.length);
      assert(!moved.length && !unknown.length, `scenes moved or unpinned: ${moved.join(', ')}; pinned but gone: ${unknown.join(', ')}`);
      assert(!bad.length, bad.map(s => `${s.name}: ${s.failed.join(' | ')}`).join('\n'));
    },
  },
];
