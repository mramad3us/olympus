// OLYMPUS tests: "Coming out!" said over the walk from the corporal up (quick; v0.0.20's F15 on the kit's lanes; COMBAT §25.19.2.1).
//
// v0.0.20's room (role B, item 12) opened every row started inside a room called clear with "Coming out!", CALL_S 0.8 s below rung 3,
// and below rung 3 no voice flows with the feet (stepper.js FLOW): the corporal stood in the cleared room through the call, then
// walked, 0.8 s a room (and the hall). On his breach lane on 1489397426 that took the lane to 121.0 s against the kit's
// KIT_LANE_MAX_S 120 (tests/flawless-kit.mjs; the build sheet's §8: the item's cost is cut, never the target moved). The call
// announces the step off, so it is said as he steps off: the `out` beat flows with the feet from rung 2 (enter-and-clear.js
// `flowFrom: 2`; the read's flow from rung 3 untouched), the call's own time kept. Below rung 2 the call is said standing, as built.
// Each case fails without the fix.
import { assert } from './helpers.mjs';
import { flawlessLane } from './flawless.mjs';
import { KIT_LANE_MAX_S, LOADOUT_OF_USE } from './flawless-kit.mjs';

// (one lane with its 'bundle' facts kept: the game clears its facts each tick, so they are read in the lane's watch)
function laneWithBeats({ tier, seed, use, pid = null }) {
  const beats = [];
  let n = 0;
  const more = (game) => {
    const ev = game.bus.events, ms = game.state.clock.ms;
    if (ev.length < n) n = 0;
    for (; n < ev.length; n++) if (ev[n][0] === 'bundle') beats.push({ ...ev[n][1], ms });
    pid ??= game.state.player.id;
  };
  const rec = flawlessLane({ tier, seed, bot: `kit:${use}`, loadout: LOADOUT_OF_USE[use] ?? use, more });
  return { rec, beats, pid };
}

let memo = null;
const corporal = () => (memo ??= laneWithBeats({ tier: 'cpl', seed: 1489397426, use: 'breach' }));

export default [
  {
    name: 'the corporal steps off on "Coming out!": his approach starts with the call, not CALL_S 0.8 s after it, at every room he leaves (breach loadout, 1489397426)',
    timeoutMs: 60_000,
    fn() {
      const { beats, pid } = corporal(), rows = [];
      for (const o of beats.filter(b => b.who === pid && b.phase === 'beat' && b.beat === 'out' && b.text)) {
        const walk = beats.find(b => b.who === pid && b.phase === 'beat' && b.id === o.id && (b.beat === 'approach' || b.beat === 'enter'));
        rows.push({ row: o.id, walk: walk?.beat ?? null, lagMs: walk ? walk.atMs - o.atMs : null });
      }
      console.log(`      ${rows.map(r => `${r.row}: ${r.walk} +${r.lagMs} ms after "Coming out!"`).join('; ')}`);
      assert(rows.length >= 2 && rows.every(r => r.lagMs === 0), JSON.stringify(rows));
    },
  },
  {
    name: 'the corporal\'s breach lane on 1489397426 runs inside KIT_LANE_MAX_S 120 s (121.0 s with "Coming out!" said standing)',
    timeoutMs: 60_000,
    fn() {
      const { rec } = corporal();
      console.log(`      lane ${rec.laneS} s, rooms ${rec.legS.map(x => x?.toFixed(2)).join(', ')} s; ends ${rec.end}`);
      assert(rec.done && rec.end === 'clear' && rec.laneS <= KIT_LANE_MAX_S, JSON.stringify({ laneS: rec.laneS, legS: rec.legS, end: rec.end, done: rec.done }));
    },
  },
];
