// OLYMPUS tests: a save made at any phase of a gravity event carries on byte for byte (v0.0.24, ROADMAP "anywhere" step 6; the build sheet §6 C, §8 F113, as shifted: the sheet's F110).
//
// F113 (C's half; B's mid-drift, mid-push and mid-grab are freefall's): the profile is plain data on the live environment
// (places.live.env.profile: its cursor, its phase, the ramp, the falls, the card), and its events are on the queue, so a game saved
// at the warning, mid-ramp, under the hold, at the cut, on the off ramp, mid-fall, with the surprise's card waiting, and after the
// profile is done, then loaded into a fresh game, plays on to the same bytes as the game that was never saved: a burn and a cut on
// a coasting deck (the sandbox under &env=ship-coast), a body floating 3 m over it, and a surprise with its card.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { setProfile, gravCardOf } from '../src/sim/places/gravity.js';
import { TICK_MS } from '../src/core/clock.js';

const SEED = 48213, END_MS = 60_000;
const meOf = (s) => s.actors.list.find(a => a.id === s.player.actor);
// (the game: the profile set at the start, on a coasting deck the body 3 m over it)
const ENVS = Object.freeze({ burn: 'ship-coast', cut: 'ship-1g', surprise: 'ship-coast' });
function game(k, list) {
  const g = createGame({ scenario: 'sandbox', seed: SEED, env: ENVS[k] });
  setProfile(g.state, list);
  if (ENVS[k] === 'ship-coast') meOf(g.state).floatY = 3;
  return g;
}
// (one tick, the card answered 'feet' on the tick after it opens: the same input in every run)
function tick(g) {
  if (gravCardOf(g.state)) g.step(1, { act: [{ act: 'grav', args: { card: 'feet' } }] });
  else g.step(1);
}
const runTo = (g, t0, ms) => { while (g.state.clock.ms - t0 < ms) tick(g); };
// (to a save point: a time from the start, or 'card', the tick the surprise's card opens, time standing still)
const toPoint = (g, t0, at) => { if (at === 'card') { while (!gravCardOf(g.state) && g.state.clock.ms - t0 < END_MS) g.step(1); } else runTo(g, t0, at); };

const PROFILES = Object.freeze({
  burn: [{ kind: 'burn', toG: 1, atS: 20, warnS: 15 }],
  cut: [{ kind: 'burn', toG: 1.4, atS: 3, warnS: 2, holdS: 5, onsetGs: 1 }, { kind: 'cut', toG: 0, atS: 20, warnS: 5, onsetGs: 0.25 }],
  surprise: [{ kind: 'burn', toG: 0.4, atS: 5, surprise: true, onsetGs: 2, holdS: 5 }],
});
const POINTS = Object.freeze({
  burn: [['the warning', 6_000], ['mid-ramp, mid-fall', 20_800], ['the hold', 30_000], ['the off ramp', 43_000], ['done', 50_000]],
  cut: [['the first hold', 6_000], ['the cut\'s warning', 16_000], ['mid-cut', 21_000], ['cut', 30_000]],
  surprise: [['the card waiting', 'card'], ['mid-fall', 5_600], ['the hold', 8_000]],
});

export default [
  {
    name: 'F113: a save at the warning, mid-ramp and mid-fall, under the hold, on the off ramp and after the burn, at a cut and with the surprise\'s card waiting, loaded into a fresh game, carries on byte for byte to the game never saved',
    fn() {
      const rows = [];
      for (const [k, list] of Object.entries(PROFILES)) {
        const A = game(k, list), a0 = A.state.clock.ms;
        runTo(A, a0, END_MS);
        const want = A.digest();
        for (const [what, atMs] of POINTS[k]) {
          const B = game(k, list), b0 = B.state.clock.ms;
          toPoint(B, b0, atMs);
          const P = B.state.places.live.env.profile, phase = P.phase, falls = P.falls.length, card = !!P.card, cardAt = P.card?.atMs ?? null, gG = B.state.places.live.env.gravity?.gG ?? null, json = B.save();
          const C = createGame({ scenario: 'sandbox', seed: SEED, env: ENVS[k] });
          C.load(json);
          const again = C.save() === json;
          runTo(C, b0, END_MS);
          runTo(B, b0, END_MS);
          rows.push({ k, what, atMs: atMs === 'card' ? cardAt - b0 : atMs, gG, phase, falls, card, again, same: C.digest() === want, straight: B.digest() === want, ticks: (C.state.clock.ms - b0) / TICK_MS });
        }
      }
      for (const r of rows) console.log(`      ${r.k}, ${r.what} (+${r.atMs} ms, ${r.phase}, ${r.gG ?? 'the preset\'s'} G${r.falls ? `, ${r.falls} falling` : ''}${r.card ? ', the card up' : ''}): saved again ${r.again}, carried on ${r.same}, the unsaved ${r.straight}, ${r.ticks} ticks to the end`);
      assert(rows.some(r => r.phase === 'warn') && rows.some(r => r.phase === 'onset' && r.falls) && rows.some(r => r.phase === 'hold') && rows.some(r => r.phase === 'off') && rows.some(r => r.card) && rows.some(r => r.k === 'cut' && r.phase === 'onset' && r.gG > 0 && r.gG < 1.4), 'every phase met');
      for (const r of rows) assert(r.again && r.same && r.straight, JSON.stringify(r));
    },
  },
];
