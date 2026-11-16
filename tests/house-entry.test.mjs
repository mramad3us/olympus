// OLYMPUS tests: your number two in on his cue, every room (COMBAT §25.19.3.4, §25.19.5; the user, 2026-11-15: "Also squad AI sometimes stays out of the room on entry (room 2)").
//
// Three causes, each pinned so it fails without its fix (v0.0.16 held each), the #2 then past the threshold within his cue's
// time, tests/flawless.mjs TWO_CUE_MS 3 s (F25):
//   - his crossing rule (bundle.js crossingClear, the rework's R8b: "never a queue in the door") read the whole leg on which
//     its stretch CROSS_CLEAR_M past the doorway ended. Room 2's #2 runs 1.5 m straight in from the doorway to his point
//     (rooms 1 and 3 hook aside at once), so you standing anywhere within the body gap of that leg, as deep as his point,
//     held him at his stack for as long as you stood there: 36 of 91 places in the room, by the probe of 2026-11-15. The
//     stretch is now cut at CROSS_CLEAR_M past the doorway (crossingOf);
//   - you walking straight in by the keys (off your lane, which hooks hard right along room 2's wall) and letting go just
//     past the doorway stood on his way in: the feet now carry you off it as out of a doorway (places/zones.js useKeepClear,
//     move.js throughOf), on your lane to the first place clear of it;
//   - his entry begun ahead of your cue (entryAhead) and cut short of the threshold by his take-in read your cue again, and
//     with you not yet ENTRY_GAP_M along your lane sent him back to his stack to wait for it: the corporal's room 3 by T on
//     96 of 200 lanes, 4.65 s from the cue to his threshold. A cut entry now goes on in.
import { sideOf } from '../src/sim/combat/team.js';
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { flawlessLane, TWO_CUE_MS } from './flawless.mjs';
import { stepAct } from './bots/lib.mjs';
import { setOpening } from '../src/sim/places/model.js';
import { pastThreshold, lanePlanOf } from '../src/sim/combat/room.js';
import { crossingOf, crossingClear, CROSS_CLEAR_M, BODY_GAP_M } from '../src/sim/combat/bundle.js';
import { liveZoneAt } from '../src/sim/places/zones.js';

const R2 = 'o:w4:r2';
// (room 2 with you and your #2 stacked on it (setup room:2), its door open, the turners left edge-on, out of stop motion)
function room2(tier) {
  const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier, setup: 'room:2' }), s = g.state, H = s.armoury.range.house;
  for (const T of s.armoury.range.turners) T.trigger = { kind: 'never', on: null, gapMs: 0 };
  setOpening(s, R2, 'open', { atMs: s.clock.ms - 5000 });
  const P = lanePlanOf(s).plans[R2], me = s.actors.list.find(a => a.who === s.player.id), two = s.actors.list.find(a => a.who === H.twoPid);
  return { g, s, H, P, me, two };
}
// (ticks with nothing pressed (stop motion left where it opens): the ms from now to the #2 past the threshold, or null)
function twoIn(g, s, P, two, ms = 10_000, keys = () => ({})) {
  const t0 = s.clock.ms;
  for (let t = 0; t < ms / 50; t++) {
    g.step(1, s.stop ? { act: [stepAct('leave')] } : keys(t)); g.clearFacts();
    if (pastThreshold(P, two.x, two.z)) return s.clock.ms - t0;
  }
  return null;
}

export default [
  {
    name: 'his crossing ends CROSS_CLEAR_M past the doorway (bundle.js crossingOf), never at the end of the leg it lies on: room 2\'s stretch is cut 0.5 m past its funnel, and you standing still beyond it, within the body gap of his straight lane but not of the stretch, leave his way in clear: he is in within his cue\'s time and on to his point as far as the body gap lets him (v0.0.16 held him at his stack, the whole leg to his point read)',
    fn() {
      const { g, s, P, me, two } = room2('private'), area = s.places.live.area, inZone = (x, z) => !!liveZoneAt(s, area, x, z);
      const way = crossingOf(P.paths[2], P.paths[2][0], inZone), end = way.at(-1);
      // (the last point in the funnel on his lane, and the stretch's length past it)
      let lastIn = null; for (let k = 0; k <= 400; k++) { const z = P.paths[2][3][1] - 1 + k * 0.005; if (inZone(20.6, z)) lastIn = z; }
      console.log(`      room 2: his lane ${JSON.stringify(P.paths[2])}; the crossing ends at ${JSON.stringify(end.map(v => +v.toFixed(3)))}, ${fmt(end[1] - lastIn, 3)} m past the funnel's last point (CROSS_CLEAR_M ${CROSS_CLEAR_M}); his point ${JSON.stringify(P.points[1])}`);
      assert(Math.abs(end[0] - 20.6) < 1e-6 && Math.abs(end[1] - lastIn - CROSS_CLEAR_M) <= 0.06, JSON.stringify({ end, lastIn }));
      // (you still at (21.1, 15.9): 0.5 m off his straight lane, 0.71 m off the stretch's end, 0.58 m off his point)
      me.x = 21.1; me.z = 15.9; delete me.v;
      const clear = crossingClear(s, P.paths[2], P.paths[2][0]);
      g.step(1, { act: [stepAct('leave')] });
      const ms = twoIn(g, s, P, two), at = [two.x, two.z], onPoint = Math.hypot(at[0] - P.points[1][0], at[1] - P.points[1][1]);
      for (let t = 0; t < 60; t++) { g.step(1, s.stop ? { act: [stepAct('leave')] } : {}); g.clearFacts(); }
      // (v0.0.19: you standing nearer his point than yours, his way in clear, he takes your side (team.js, FM 3-06.11 §3-29): his
      // point is then yours, and he walks on to it; the crossing's stretch, this case's subject, is as v0.0.17 cut it)
      const side = sideOf(s, 'o:w4:r2', 2), pt = P.points[side - 1];
      const settled = Math.hypot(two.x - pt[0], two.z - pt[1]), gap = Math.hypot(two.x - me.x, two.z - me.z);
      console.log(`      you still at (21.10, 15.90): his way through ${clear ? 'clear' : 'NOT clear'}; past the threshold ${ms === null ? 'NEVER in 10 s' : `${fmt(ms / 1000, 2)} s`} after you left the mode; his side ${side} (v0.0.19: the other side); then ${fmt(settled, 2)} m off that side's point (held off you by the body gap), ${fmt(gap, 2)} m from you`);
      // (his point 0.58 m from you: he walks on to it as far as the body gap lets him, never through you)
      assert(clear && ms !== null && ms <= TWO_CUE_MS && settled <= 0.6 && gap >= BODY_GAP_M, JSON.stringify({ clear, ms, settled, gap }));
    },
  },
  {
    name: 'you walking straight into room 2 by the keys and letting go just past its doorway are carried off your #2\'s way in, on your lane, as out of a doorway (places/zones.js useKeepClear, move.js throughOf): he is in within his cue\'s time, the boot recruit and the private, wherever you let go from the doorway to 1 m in (v0.0.16 left you standing on his lane and him at his stack)',
    fn() {
      const rows = [];
      for (const tier of ['recruit', 'private']) for (const dx of [-0.2, 0, 0.15]) for (const goZ of [14.9, 15.1, 15.4]) {
        const { g, s, P, me, two } = room2(tier);
        me.x = P.threshold[0] + dx; me.z = 13.9; me.headRad = Math.PI / 2;
        g.step(1, { act: [stepAct('leave')] });
        let goAt = null;
        const t0 = s.clock.ms, ms = twoIn(g, s, P, two, 12_000, () => { if (goAt === null && me.z >= goZ) goAt = s.clock.ms; return goAt === null ? { mz: 1, mx: 0 } : {}; });
        for (let t = 0; t < 40; t++) { g.step(1, s.stop ? { act: [stepAct('leave')] } : {}); g.clearFacts(); }
        const lag = ms === null || goAt === null ? null : ms - (goAt - t0);
        rows.push({ tier, x: +(P.threshold[0] + dx).toFixed(2), goZ, rest: [+me.x.toFixed(2), +me.z.toFixed(2)], lag });
      }
      console.log(`      ${rows.map(r => `${r.tier} at x ${r.x} let go at z ${r.goZ}: at rest ${r.rest.join(', ')}, his threshold ${r.lag === null ? 'NEVER' : `${fmt(r.lag / 1000, 2)} s`} after`).join('\n      ')}`);
      const bad = rows.filter(r => r.lag === null || r.lag > TWO_CUE_MS);
      assert(!bad.length, JSON.stringify(bad));
    },
  },
  {
    name: 'his entry cut short of the threshold by his take-in goes on in, never back to his stack: the corporal by T on 1222 and 1370, room 3, past the threshold within his cue\'s time and no stack row begun for that door after his entry (v0.0.16: back to the stack, 4.65 s from the cue to his threshold)',
    timeoutMs: 120_000,
    fn() {
      for (const seed of [1222, 1370]) {
        let back = 0, cutAt = null;
        const rec = flawlessLane({ tier: 'cpl', seed, bot: 'honest', more: (game) => {
          const W = game.state.armoury.range.house.two, d = W.doing;
          if ((d?.step === 'drill:room:in>o:w4:r3' && d.halt) || (W.last?.step === 'drill:room:in>o:w4:r3' && W.last.why === 'contact')) cutAt ??= game.state.clock.ms;
          if (cutAt !== null && d?.step === 'drill:stack:point>o:w4:r3' && d.fromMs >= cutAt) back++;
        } });
        const E = rec.entry['o:w4:r3'], lag = E && E.cueMs !== null && E.inMs !== null ? E.inMs - E.cueMs : null;
        console.log(`      cpl ${seed}: room 3's entry ${cutAt !== null ? 'cut by his take-in' : 'not cut'}; from the cue to his threshold ${lag === null ? 'NEVER' : `${fmt(lag / 1000, 2)} s`}; back to his stack ${back ? 'yes' : 'no'}; the lane ${rec.done ? 'to its card' : 'NOT done'}`);
        assert(rec.done && cutAt !== null && lag !== null && lag <= TWO_CUE_MS && !back, JSON.stringify({ seed, cutAt, lag, back, done: rec.done }));
      }
    },
  },
];
