// OLYMPUS tests: "Stack and clear, live" never dead-ends (the user, 2026-11-07: "a scene never dead-ends"; the build sheet v0.0.19 §8's fuzz), heavy: the house's fuzz bot on 40 seeds, every pair of the role-players' cards forced in turn.
//
// tests/bots/house.mjs houseFuzzBot presses random legal rows (never a shot, never "Clear!", the dummy never cleared), mashes the
// keys through windows, walks at random and stands in doorways: with men who fire back it takes paint, its rooms reopen, its men
// give up uncovered. Every lane must reach the card (the range's end) with no error: a casualty's cease fire, the stall's moves
// on, LANE_MAX_MS at the latest. Printed: the ends by kind and the faults the live lane added.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseFuzzBot, runHouse } from './bots/house.mjs';
import { tally, top } from './flawless.mjs';

const CARDS = Object.freeze(['fight', 'give', 'hide']);
export const PAIRS = Object.freeze(CARDS.flatMap(a => CARDS.map(b => `live:${a},${b}`)));
const TIERS = Object.freeze(['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone']);

export default [
  {
    name: 'v0.0.19: the fuzz bot on 40 seeds of the live lane, every card pair in turn and every sheet: every lane to its card with no error',
    heavy: true,
    timeoutMs: 900_000,
    fn() {
      const out = [];
      for (let i = 0; i < 40; i++) {
        const opfor = PAIRS[i % PAIRS.length], tier = TIERS[i % TIERS.length], seed = 5000 + 37 * i;
        const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'go', opfor });
        let err = null, r = null;
        try { r = runHouse(g, houseFuzzBot({ seed: i + 1 }), { maxMs: 15 * 60_000 }); } catch (e) { err = String(e?.message ?? e).slice(0, 200); }
        const H = g.state.armoury.range.house, faults = [...H.rooms, H.hall].flatMap(L => L.faults.map(f => f.kind));
        out.push({ i, seed, tier, opfor, done: !!r?.done && !err, err, end: H.end?.why ?? null, laneS: H.goAtMs !== null ? Math.round(((H.end?.atMs ?? g.state.clock.ms) - H.goAtMs) / 100) / 10 : null, errors: g.errors.length,
          live: faults.filter(k => ['surrendered', 'uncovered', 'reopened', 'casualty'].includes(k)) });
      }
      for (const o of out) console.log(`      ${String(o.i).padStart(2)} ${o.tier.padEnd(8)} ${o.seed} ${o.opfor.padEnd(16)} ${o.done ? 'card' : 'NOT DONE'} ${o.end} ${o.laneS} s${o.live.length ? `; ${o.live.join(', ')}` : ''}${o.err ? `; ${o.err}` : ''}`);
      console.log(`      ends ${top(tally(out.map(o => o.end ?? 'none')))}; the live faults ${top(tally(out.flatMap(o => o.live)))}`);
      assert(out.every(o => o.done && !o.errors), JSON.stringify(out.filter(o => !o.done || o.errors)));
    },
  },
];
