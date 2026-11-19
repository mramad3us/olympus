// OLYMPUS tests: "Bang, then go" never dead-ends (v0.0.26; its build sheet §6 B, §8 F138's heavy half; the user, 2026-11-07: "a scene never dead-ends").
//
// Every lane reaches its card: 10 seeds × the six sheets × the four draws by the sheet's honest player (T and the shot the line names from
// the corporal up, the keys' walk below; the bang thrown by its row where the draw issued one: tests/breach-lanes.mjs breachBot 'auto'),
// the same by T alone from the corporal up (houseTBot: the bang's one press, goNow's flash default; the review of B and C, 2026-11-19),
// and the scene's fuzz (tests/bots/house.mjs breachFuzzBot: in 3 to 6 s after the bang, never a challenge, a man with his hands up
// searched where offered and shot once, which F39 catches as the fault 'surrendered', never a dead end) on 10 seeds × the six sheets with
// the draw the seed's. The live lane's own gauges are read on the scene too (tests/flawless-live.mjs liveLane and liveGaugeOf inside
// tests/game.mjs withBreach, each draw on its own on 48213 and 1000 by every sheet): F38 to F43 and F45 enforced, F15 read against the
// scene's own lane (printed), F44 and F46 (balance by sheet on a handful of lanes) printed only.
import { assert } from './helpers.mjs';
import { withBreach } from './game.mjs';
import { breachLane, BREACH_DRAWS, BREACH_SHEETS } from './breach-lanes.mjs';
import { houseKitBot } from './bots/kit.mjs';
import { liveLane, liveGaugeOf } from './flawless-live.mjs';
import { printGauge, tally, top } from './flawless.mjs';
import { RUNG_OF_TIER } from '../src/sim/skills/templates.js';

const SEEDS = Array.from({ length: 10 }, (_, i) => (i === 0 ? 48213 : 1000 + 37 * i));
const BREACH_LIVE_ENFORCED = Object.freeze(['F38', 'F39', 'F40', 'F41', 'F42', 'F43', 'F45']);

export default [
  {
    name: 'F138 (heavy): 10 seeds × the six sheets × the four draws by the sheet\'s honest player, every lane to its card, the lane ended at room 1',
    heavy: true,
    timeoutMs: 1_200_000,
    fn() {
      const bad = [];
      for (const tier of BREACH_SHEETS) {
        const ends = [], ms = [];
        for (const code of BREACH_DRAWS) for (const seed of SEEDS) {
          const { g, rec } = breachLane({ tier, seed, code });
          const H = g.state.armoury.range.house;
          ends.push(`${code.replace(',', '/')}:${rec.end}`);
          if (rec.done && H.goAtMs !== null) ms.push((H.end?.atMs ?? g.state.clock.ms) - H.goAtMs);
          if (!rec.done || !g.state.armoury.range.end || H.hall.state !== 'ahead' || H.rooms.slice(1).some(L => L.state !== 'ahead')) bad.push(`${tier} ${seed} ${code}: ${rec.done ? 'past room 1' : 'NOT DONE'}`);
        }
        console.log(`      ${tier.padEnd(8)} ${ends.length} lanes: ${top(tally(ends))}; GO to the lane's end ${(Math.min(...ms) / 1000).toFixed(1)} to ${(Math.max(...ms) / 1000).toFixed(1)} s`);
      }
      assert(!bad.length, bad.slice(0, 8).join('; '));
    },
  },
  {
    name: 'F138 (heavy, by T alone): 10 seeds × the corporal up × the four draws by houseTBot, every lane to its card, the lane ended at room 1, one G-11 through its door on the bang and none on the quiet door (the review of B and C, 2026-11-19: no T-only lane in the sweep)',
    heavy: true,
    timeoutMs: 900_000,
    fn() {
      const bad = [];
      for (const tier of BREACH_SHEETS.filter(t => (RUNG_OF_TIER[t] ?? 0) >= 2)) {
        const ends = [];
        let bangs = 0;
        for (const code of BREACH_DRAWS) for (const seed of SEEDS) {
          const { g, rec } = breachLane({ tier, seed, code, bot: 'T' });
          const H = g.state.armoury.range.house, thrown = (H.bursts ?? []).filter(b => b.thrown === H.rooms[0].door && b.model === 'g11').length, want = code.startsWith('bang') ? 1 : 0;
          ends.push(`${code.replace(',', '/')}:${rec.end}`); bangs += thrown;
          if (!rec.done || !g.state.armoury.range.end || H.hall.state !== 'ahead' || H.rooms.slice(1).some(L => L.state !== 'ahead')) bad.push(`${tier} ${seed} ${code}: ${rec.done ? 'past room 1' : 'NOT DONE'}`);
          if (thrown !== want) bad.push(`${tier} ${seed} ${code}: ${thrown} G-11 thrown`);
        }
        console.log(`      ${tier.padEnd(8)} by T, ${ends.length} lanes: ${top(tally(ends))}; G-11 thrown ${bangs} (the bang drawn on ${ends.length / 2})`);
      }
      assert(!bad.length, bad.slice(0, 8).join('; '));
    },
  },
  {
    name: 'F138 (heavy): the scene\'s fuzz on 10 seeds × the six sheets, the draw the seed\'s: every lane to its card; a round at a man with his hands up the fault \'surrendered\', never a dead end',
    heavy: true,
    timeoutMs: 900_000,
    fn() {
      const bad = [], ends = [];
      let shot = 0, faulted = 0, searched = 0, noChallenge = 0;
      for (const tier of BREACH_SHEETS) for (const seed of SEEDS) {
        const { g, rec } = breachLane({ tier, seed, code: 'drawn', bot: 'fuzz' });
        ends.push(rec.end);
        if (!rec.done || !g.state.armoury.range.end) bad.push(`${tier} ${seed}`);
        if (rec.mem.handsShot) shot++;
        if (g.state.armoury.range.house.rooms[0].faults.some(f => f.kind === 'surrendered')) faulted++;
        searched += rec.mem.searched ?? 0; noChallenge += rec.mem.noChallenge ?? 0;
      }
      console.log(`      ${ends.length} fuzz lanes: ${top(tally(ends))}; a round at a man with his hands up on ${shot}, the fault 'surrendered' on ${faulted}; searches pressed ${searched}; challenges taken back ${noChallenge}`);
      assert(!bad.length, `fuzz lanes not to their card: ${bad.join(', ')}`);
      assert(faulted >= shot, `a round at a man with his hands up not faulted: ${shot} shot, ${faulted} faulted`);
    },
  },
  {
    name: 'F138 (heavy): the live lane\'s gauges on the scene, each draw on 48213 and 1000 by every sheet: F38 to F43 and F45 met; F15 against the scene\'s own lane, F44 and F46 printed',
    heavy: true,
    timeoutMs: 1_200_000,
    fn() {
      const recs = [];
      for (const code of BREACH_DRAWS) withBreach(code, () => {
        for (const tier of BREACH_SHEETS) for (const seed of [48213, 1000]) {
          const keys = (RUNG_OF_TIER[tier] ?? 0) < 2, bang = code.startsWith('bang');
          recs.push(liveLane({ tier, seed, bot: bang ? () => houseKitBot({ use: 'flash', base: keys ? 'keys' : 'honest' }) : null }));
        }
      });
      const rows = liveGaugeOf(recs);
      printGauge(`"Bang, then go", ${recs.length} lanes (the four draws × the six sheets × 48213 and 1000)`, rows);
      const failing = rows.filter(r => BREACH_LIVE_ENFORCED.includes(r.id) && !r.met).map(r => `${r.id} ${r.name}: ${r.value}`);
      assert(recs.every(r => r.done), `lanes not to their card: ${recs.filter(r => !r.done).map(r => `${r.tier} ${r.seed}`).join(', ')}`);
      assert(!failing.length, failing.join(' | '));
    },
  },
];
