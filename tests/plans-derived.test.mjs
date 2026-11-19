// OLYMPUS tests: the room plans derived from their geometry, against every authored one (the build sheet v0.0.22 item 12, §6 A, F74; house lens G1; COMBAT §25.7.3).
//
// combat/derive.js derivePlan gives every field of a room plan from the door, the rooms it enters and the area's grids alone. It is
// held to layout A's three door plans (x4-plans.js, the area's frame) and the chunks' four authored families (the centre's push and
// pull, the corner's 'fed-hinge', the ell's 'shape', each in its chunk's frame: assemble.js deriveChunkPlan) within DERIVE_TOL, with
// the same owner by room.js sectorOf for every stand and candidate place (tests/flawless-rooms.mjs f74 prints each field's offset). It
// fails without the reach cap (room 2's #1 1.90 m deeper: POINT_REACH_M), without the bend's hot spot (room 3's wing wall 1.08 m from
// the nearest corner's), without the hold-offs (room 2's paths routed round the jambs) and with the corner rule's own sector for a man
// going straight down a fed wall (room 2's far wall place then #1's, the authored #2's): the second case takes each out.
import { assert, fmt } from './helpers.mjs';
import { f74, planOffsets, overTol } from './flawless-rooms.mjs';
import { derivePlan, geoOf } from '../src/sim/combat/derive.js';
import { cornerRuleOf } from '../src/sim/combat/corner.js';
import { sectorOf } from '../src/sim/combat/room.js';
import { X4_PLANS } from '../src/data/places/x4-plans.js';

export default [
  {
    name: 'F74: the deriver gives layout A\'s three door plans and the chunks\' four authored families within DERIVE_TOL, the same owner by sectorOf for every stand and candidate place; each field\'s offset printed',
    fn() {
      const { row, lines } = f74();
      for (const l of lines) console.log(`      ${l}`);
      console.log(`      ${row.id} ${row.met ? 'MET ' : 'OPEN'} ${row.name}: ${row.value}`);
      assert(row.met, row.value);
    },
  },
  {
    name: 'each of the deriver\'s four rules is needed: room 2 with the reach cap lifted (POINT_REACH_M 9), without its hold-offs (JAMB_HOLD_M 0: routed round the jambs) and with the corner rule\'s own sector for its #2, room 3 without its bend, each off DERIVE_TOL or an owner',
    fn() {
      const L = X4_PLANS.A, r2 = L.plans['o:w4:r2'], r3 = L.plans['o:w4:r3'];
      const g2 = geoOf(L.area, r2.door, r2.parts), g3 = geoOf(L.area, r3.door, r3.parts), P2 = derivePlan(g2), P3 = derivePlan(g3);
      const uncapped = planOffsets(r2, derivePlan(g2, { reachM: 9 })), noCap = overTol(uncapped);
      const unheld = planOffsets(r2, derivePlan(g2, { holdM: 0 })), noHold = overTol(unheld);
      const noBend = overTol(planOffsets(r3, { ...P3, hot: P3.hot.filter(h => !h.id.startsWith('bend')) }));
      // (the corner rule's own sector for room 2's #2, who goes straight down the fed wall: the far wall's middle on both men's edges)
      const ruleSec = { ...P2, sectors: P2.sectors.map(x => (x.slot === 2 ? { ...x, yawRad: cornerRuleOf({ ...g2, points: P2.points }, 2).sector.yawRad } : x)) };
      const far = [22.75, 19.0], owners = [sectorOf(r2, ...far), sectorOf(P2, ...far), sectorOf(ruleSec, ...far)];
      console.log(`      room 2 uncapped: off in ${noCap.join(', ')} (its #1 point ${fmt(uncapped.pointM, 2)} m off); without hold-offs: off in ${noHold.join(', ') || 'nothing'} (the path ${fmt(unheld.pathM, 3)} m off, its length ${fmt(unheld.pathLenM, 3)} m); room 3 without the bend: off in ${noBend.join(', ')}; room 2's far wall place (22.75, 19.0): authored #${owners[0]}, derived #${owners[1]}, by the corner rule's sector #${owners[2]}`);
      assert(noCap.includes('pointM') && noHold.length && noBend.includes('hotM') && owners[0] === owners[1] && owners[2] !== owners[0], JSON.stringify({ noCap, noHold, noBend, owners }));
    },
  },
];
