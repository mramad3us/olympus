// OLYMPUS tests: the debrief's trace (the build sheet v0.0.20 §1 item 26; card C2): shoothouse.js traceTick samples both men and each lane door's leaf every TRACE_MS from GO.
//
// The trace lives in R.house.$trace, a runtime key (state.js drops every $ key at any depth), so no save, golden or pin moves: the
// lane's save digest is the same with it and with it deleted. Each sample is checked against the actors and doors as they stood at
// its tick (the test steps the game a tick at a time and reads the new sample against the state then). One sheet on one seed.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseHonestBot } from './bots/house.mjs';
import { houseOf, houseNow, TRACE_MS, TRACE_MAX } from '../src/sim/scenarios/shoothouse.js';
import { leafAt } from '../src/sim/places/doors.js';

export default [
  {
    name: 'the trace holds both men every TRACE_MS from GO to the lane\'s end, within 0.01 m of the actors at every sample, and each lane door\'s leaf as the stage draws it (to its 0.01 step)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go' }), bot = houseHonestBot();
      let checked = 0, worstM = 0, worstK = 0, gaps = new Set();
      while (!houseNow(g.state)?.rangeEnd && g.state.clock.ms < 3_600_000 * 1e6) {
        const n0 = houseOf(g.state).$trace?.ms.length ?? 0;
        g.step(1, bot);
        const s = g.state, H = houseOf(s), T = H.$trace;
        if (!T || T.ms.length === n0) continue;
        const i = T.ms.length - 1, me = s.actors.list.find(a => a.who === s.player.id), two = s.actors.list.find(a => a.who === H.twoPid);
        worstM = Math.max(worstM, Math.hypot(T.me[i * 5] - me.x, T.me[i * 5 + 1] - me.z), Math.hypot(T.two[i * 5] - two.x, T.two[i * 5 + 1] - two.z));
        for (const [door, ks] of Object.entries(T.doors)) worstK = Math.max(worstK, Math.abs(ks[i] - leafAt(s, door, T.ms[i])));
        if (i > 0) gaps.add(T.ms[i] - T.ms[i - 1]);
        checked++;
      }
      const H = houseOf(g.state), T = H.$trace;
      console.log(`      ${checked} samples checked of ${T.ms.length} (TRACE_MAX ${TRACE_MAX}), from ${T.ms[0] - H.goAtMs} ms after GO to ${H.end.atMs - T.ms.at(-1)} ms before the end; gaps ${[...gaps].join(', ')} ms; worst place ${worstM.toFixed(4)} m, worst leaf ${worstK.toFixed(3)}; doors ${Object.keys(T.doors).join(', ')}`);
      assert(checked === T.ms.length && checked > 300 && [...gaps].every(d => d === TRACE_MS) && worstM <= 0.01 && worstK <= 0.005 + 1e-9 && Object.keys(T.doors).length === 3, JSON.stringify({ checked, gaps: [...gaps], worstM, worstK }));
    },
  },
  {
    name: 'the trace is runtime only: a lane\'s save is the same with the trace and with it deleted, and a lane loaded mid-way traces from its load',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go' }), bot = houseHonestBot();
      g.step(400, bot);
      const H = houseOf(g.state), n = H.$trace.ms.length, a = g.digest(), json = g.save();
      delete H.$trace;
      const b = g.digest();
      g.load(json); g.step(40, bot);
      const T = houseOf(g.state).$trace;
      console.log(`      ${n} samples at tick 400; the digest ${a} with, ${b} without; after a load at ${JSON.parse(json).clock.ms - H.goAtMs} ms from GO, ${T.ms.length} samples from ${T.fromMs - H.goAtMs} ms`);
      assert(a === b && !json.includes('$trace') && T.fromMs > H.goAtMs + 15_000 && T.ms.length >= 19, JSON.stringify({ a, b, from: T.fromMs - H.goAtMs }));
    },
  },
];
