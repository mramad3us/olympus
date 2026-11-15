// OLYMPUS tests: the house's stall after "Move on." (COMBAT §25.19.4's no-dead-end rules; shoothouse.js stall, 2026-11-15, my call).
//
// The stall clock counts progress only (a hot spot newly covered, a round, a leg's state, a door: R1, 2026-11-12). With the P-12
// issued on every sheet (the user, 2026-11-15: "everyone should have the same loadout") the fuzz's private on seed 1148 looked
// and fired a little every minute and walked three rooms of 185 to 247 s each, to the lane's 600 s (the gauges' F14). Once
// "Move on." is said, only the leg's own state moved on buys more time: a look or a round after it does not, and the leg is
// passed STALL_MORE_MS after the words. The test stands still by Wait and, from the words on, makes the small progress a look
// makes every 10 s (the house's stall clock reset as a hot spot newly covered resets it); it fails without the rule.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse } from './bots/house.mjs';
import { stepAct } from './bots/lib.mjs';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { houseNow, STALL_MS, STALL_MORE_MS } from '../src/sim/scenarios/shoothouse.js';

const choosing = (s) => s.stop?.mode === 'stop' && s.stop.phase === 'choose';

export default [
  {
    name: 'after "Move on." a look or a round no longer buys time: a private who waits, then makes small progress every 10 s from the words on, has each leg passed STALL_MORE_MS (30 s) after them, the card well inside the lane\'s 10 minutes (before: the leg never passed while the small progress went on)',
    timeoutMs: 120_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'go' }), said = [], passed = [];
      const waiter = (state) => (choosing(state) && stepsOf(state).some(r => r.id === 'wait' && !r.off) ? { act: [stepAct('wait')] } : {});
      let lastNudge = null;
      const seen = new Set();
      const r = runHouse(g, waiter, { maxMs: 12 * 60_000, each: (game) => {
        const st = game.state, H = st.armoury.range.house, now = st.clock.ms, legs = [...H.rooms, H.hall], L = legs[H.cur];
        for (const f of game.facts('house')) if (f.phase === 'stall') { said.push(now); lastNudge = now; }
        legs.forEach((x, k) => { if (x.state === 'passed' && !seen.has(k)) { seen.add(k); passed.push(now); } });
        // (the small progress: the stall clock reset every 10 s from the words on in this leg, as a hot spot newly covered resets it)
        if (L?.stallSaid && L.state !== 'passed' && lastNudge !== null && now - lastNudge >= 10_000 && H.goAtMs !== null && !H.end) { H.stallAtMs = now; lastNudge = now; }
      } });
      const N = houseNow(g.state), gaps = said.map((t, i) => passed[i] !== undefined ? passed[i] - t : null);
      console.log(`      "Move on." at ${said.map(t => `${fmt((t - said[0]) / 1000, 0)} s`).join(', ')} (from the first); each leg passed ${gaps.map(x => (x === null ? 'never' : `${fmt(x / 1000, 2)} s`)).join(', ')} after; legs ${N.legs.map(V => V.state).join(', ')}; the lane ${N.end?.why ?? 'not ended'} (STALL_MS ${STALL_MS / 1000} s, STALL_MORE_MS ${STALL_MORE_MS / 1000} s)`);
      assert(r.done && N.end?.why !== 'time' && said.length === 4 && gaps.every(x => x !== null && x <= STALL_MORE_MS + 100), JSON.stringify({ said: said.length, gaps, end: N.end }));
    },
  },
];
