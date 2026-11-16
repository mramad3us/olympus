// OLYMPUS tests: opfor-spots, the role-players' authored spots (src/data/places/house-opfor.js) against the room plans: every start and hide covered by its room's plan from a point within its slot's sector, clear of every way, its dash clear and short (the build sheet v0.0.19 §1 L-opfor, §6; opfor.md §3, §5; COMBAT §25.18's reach review: "a hide spot the drill covers").
//
// spotCheck(state, stand, [x, z]) is the rule, written once here: the cell lies in the leg's own rect (room 3's near leg for
// RP-B), 0.4 m or more off every wall face (room.js wallClearanceM: a C0 body and a margin), BODY_GAP_M + C0 (0.77 m) or more
// from every path, point and stack point of the plan (the far leg's walk too) and from every other stand, out of every hinged
// leaf's swing (zones.js arcsOf, the body's C0 round it), and seen from the point of a slot within that slot's sector
// (SECTOR_HALF_DEG) with a clear line at the stand's layer and the crouch's (perception.js clearLine: room.js coverageOf's
// rule), the slot that holds it by room.js sectorOf the same at the hide as at the start. It fails on a cell of a plan's way and
// on a cell of room 3's dead space, which the drill never looks at (the negative controls below). The dash: along the authored
// path, at most DASH_MAX_M 3 m, every 5 cm a C0 body off the walls, within DASH_MAX_MS 2 s at the place's run on the
// role-player's own legs (bundle.js legsOf, stepper.js profileOf).
import { assert, near, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { OPFOR_SPOTS, RP_STANDS } from '../src/data/places/house-opfor.js';
import { HOUSE1 } from '../src/data/places/wheel.js';
import { lanePlanOf, wallClearanceM, sectorOf, manPlace, SECTOR_HALF_DEG } from '../src/sim/combat/room.js';
import { sightGridOf } from '../src/sim/places/sight.js';
import { clearLine } from '../src/sim/people/perception.js';
import { CLASSES } from '../src/sim/places/nav.js';
import { arcsOf, inZone } from '../src/sim/places/zones.js';
import { BODY_GAP_M, legsOf } from '../src/sim/combat/bundle.js';
import { profileOf, pathLen } from '../src/sim/combat/stepper.js';
import { placeGaits } from '../src/sim/body/motion.js';
import { DASH_MAX_MS, DASH_MAX_M } from '../src/sim/scenarios/opfor.js';
import { liveGame } from './opfor-world.mjs';

const C0 = CLASSES.C0, GAP = BODY_GAP_M + C0, RAD = Math.PI / 180, WALL_M = 0.4;
const segD = (p, a, b) => { const vx = b[0] - a[0], vz = b[1] - a[1], l2 = vx * vx + vz * vz, t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vz) / l2)) : 0; return Math.hypot(p[0] - a[0] - vx * t, p[1] - a[1] - vz * t); };
const ang = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const inRect = (r, x, z) => x >= r[0] && x <= r[2] && z >= r[1] && z <= r[3];

// (the plan's ways: its paths, the far leg's walk, its points and stack points)
function wayM(P, p) {
  let d = Infinity;
  for (const path of [...Object.values(P.paths), ...(P.far ? [P.far.path] : [])]) for (let i = 1; i < path.length; i++) d = Math.min(d, segD(p, path[i - 1], path[i]));
  for (const q of [...P.points, ...P.stack]) d = Math.min(d, Math.hypot(p[0] - q[0], p[1] - q[1]));
  return d;
}
// (the slots whose point sees p within its own sector, at a layer)
function coveredBy(state, P, p, layer) {
  const grid = sightGridOf(state, P.area), out = [];
  P.points.forEach((q, k) => {
    const sec = P.sectors.find(x => x.slot === k + 1);
    if (sec && Math.abs(ang(Math.atan2(p[1] - q[1], p[0] - q[0]) - sec.yawRad)) <= SECTOR_HALF_DEG * RAD && clearLine(grid, q[0], q[1], p[0], p[1], layer)) out.push(k + 1);
  });
  return out;
}
/** The rule (see the header): { ok, why: [..], wall, way, stands, arc, stand, crouch, slot }. */
export function spotCheck(state, stand, p, { slot0 = null } = {}) {
  const S = OPFOR_SPOTS[stand], L = lanePlanOf(state), P = L.plans[S.door], why = [];
  const wall = wallClearanceM(P, p[0], p[1]), way = wayM(P, p);
  const stands = Math.min(...HOUSE1.stands.filter(x => x.stand !== stand).map(x => Math.hypot(p[0] - x.x, p[1] - x.z)));
  const arc = arcsOf(P.area).some(A => [[0, 0], [C0, 0], [-C0, 0], [0, C0], [0, -C0]].some(([dx, dz]) => inZone(A, p[0] + dx, p[1] + dz)));
  const st = coveredBy(state, P, p, 'stand'), cr = coveredBy(state, P, p, 'crouch'), slot = sectorOf(P, p[0], p[1]);
  if (!inRect(P.rects[0], p[0], p[1])) why.push('outside his leg');
  if (wall < WALL_M) why.push(`${fmt(wall, 2)} m off a wall`);
  if (way < GAP) why.push(`${fmt(way, 2)} m off a way`);
  if (stands < GAP) why.push(`${fmt(stands, 2)} m off a stand`);
  if (arc) why.push('in a leaf\'s swing');
  if (!st.length || !cr.length) why.push('no point sees it in its sector');
  if (slot0 !== null && slot !== slot0) why.push(`its side ${slot}, not ${slot0}`);
  return { ok: !why.length, why, wall, way, stands, arc, stand: st, crouch: cr, slot };
}

export default [
  {
    name: 'opfor-spots: every role-player\'s start and hide is covered by its room\'s plan from a point within its slot\'s sector, and lies at least the body gap plus C0 from every path and point (fails on a cell of a way or of room 3\'s dead space)',
    fn() {
      const s = createGame({ scenario: 'test-shoothouse', seed: 48213 }).state;
      for (const stand of RP_STANDS) {
        const S = OPFOR_SPOTS[stand], H1 = HOUSE1.stands.find(x => x.stand === stand), P = lanePlanOf(s).plans[S.door];
        const a = spotCheck(s, stand, S.start), b = spotCheck(s, stand, S.hide, { slot0: a.slot });
        const off = segD(S.hide, P.threshold, S.start);
        console.log(`      ${stand} (${S.name}): start ${S.start} (HOUSE1's ${H1.x},${H1.z}) wall ${fmt(a.wall, 2)} m, way ${fmt(a.way, 2)} m, stands ${fmt(a.stands, 2)} m, seen from slot ${a.stand} (crouched ${a.crouch}), side ${a.slot}`);
        console.log(`      ${stand} hide ${S.hide}: wall ${fmt(b.wall, 2)} m, way ${fmt(b.way, 2)} m, stands ${fmt(b.stands, 2)} m, seen from slot ${b.stand} (crouched ${b.crouch}), side ${b.slot}, ${fmt(Math.hypot(S.hide[0] - S.start[0], S.hide[1] - S.start[1]), 2)} m from the start, ${fmt(off, 2)} m off the threshold's line; the gap ${fmt(GAP, 2)} m`);
        assert(S.start[0] === H1.x && S.start[1] === H1.z, JSON.stringify({ stand, start: S.start, H1 }));
        assert(a.ok, JSON.stringify({ stand, start: a }));
        assert(b.ok, JSON.stringify({ stand, hide: b }));
        assert(Math.hypot(S.hide[0] - S.start[0], S.hide[1] - S.start[1]) <= DASH_MAX_M && off >= 0.5, JSON.stringify({ stand, off }));
      }
      // (the negative controls: the rule refuses a cell on #1's path into room 2 and the middle of room 3's dead far leg, seen only from past the bend)
      const P2 = lanePlanOf(s).plans['o:w4:r2'], onWay = P2.paths[1][4], badWay = spotCheck(s, '2a', onWay);
      const dead = spotCheck(s, '3a', [21.25, 7.2]);
      console.log(`      controls: a cell on room 2's #1 path ${onWay}: ${badWay.why.join('; ')}; room 3's far leg middle: ${dead.why.join('; ')}`);
      assert(!badWay.ok && badWay.why.some(w => w.includes('way')), JSON.stringify(badWay));
      assert(!dead.ok && dead.why.some(w => w.includes('sees') || w.includes('outside')), JSON.stringify(dead));
    },
  },
  {
    name: 'opfor-spots: each dash is clear for a C0 body along its authored path, at most 3 m, and done within DASH_MAX_MS 2 s at the place\'s run on the role-player\'s own legs; manPlace keeps his side from start to hide',
    fn() {
      const w = liveGame({ seed: 48213, tier: 'sgt', setup: 'room:2' }), s = w.s, run = placeGaits(s).runMs;
      for (const stand of RP_STANDS) {
        const S = OPFOR_SPOTS[stand], P = lanePlanOf(s).plans[S.door], T = s.armoury.range.turners.find(x => x.stand === stand), pid = T.live.who;
        const len = pathLen(S.dash), legs = legsOf(s, pid, S.start[0], S.start[1]), prof = profileOf(len, run, legs.pushMs2, legs.brakeMs2, { v0: 0, v1: 0 });
        let least = Infinity;
        for (let i = 1; i < S.dash.length; i++) {
          const a = S.dash[i - 1], b = S.dash[i], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.05);
          for (let k = 0; k <= n; k++) least = Math.min(least, wallClearanceM(P, a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n));
        }
        const side = (x, z) => manPlace(s, { x, z, room: T.room, slot: T.slot }).slot;
        console.log(`      ${stand}: the dash ${fmt(len, 2)} m, least wall ${fmt(least, 2)} m (C0 ${C0}), ${fmt(prof.T * 1000, 0)} ms at the run ${fmt(run, 2)} m/s (push ${fmt(legs.pushMs2, 2)}, brake ${fmt(legs.brakeMs2, 2)} m/s², peak ${fmt(prof.vp, 2)} m/s); his side ${side(...S.start)} at the start, ${side(...S.hide)} at the hide`);
        assert(S.dash[0][0] === S.start[0] && S.dash[0][1] === S.start[1] && S.dash.at(-1)[0] === S.hide[0] && S.dash.at(-1)[1] === S.hide[1], JSON.stringify(S.dash));
        assert(len <= DASH_MAX_M && least >= C0 + 0.01, JSON.stringify({ stand, len, least }));
        assert(prof.T * 1000 <= DASH_MAX_MS, JSON.stringify({ stand, ms: prof.T * 1000 }));
        assert(side(...S.start) === side(...S.hide), JSON.stringify({ stand }));
      }
      near(DASH_MAX_MS, 2000, 0, 'the dash\'s limit');
    },
  },
];
