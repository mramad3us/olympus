// OLYMPUS tests: opfor-spots, the role-players' authored spots (src/data/places/house-opfor.js) against the room plans: every start and hide covered by its room's plan from a point within its slot's sector, clear of every way, its dash clear and short (the build sheet v0.0.19 §1 L-opfor, §6; opfor.md §3, §5; COMBAT §25.18's reach review: "a hide spot the drill covers").
//
// spotCheck(state, stand, [x, z]) is the rule (tests/opfor-world.mjs from v0.0.22, its build sheet §0 item 17, widened to a drawn
// post and re-exported here by name for one release; on the set it is this file's v0.0.19 rule to the line): the cell lies in the leg's own rect (room 3's near leg for
// RP-B), 0.4 m or more off every wall face (room.js wallClearanceM: a C0 body and a margin), BODY_GAP_M + C0 (0.77 m) or more
// from every path, point and stack point of the plan (the far leg's walk too) and from every other stand, out of every hinged
// leaf's swing (zones.js arcsOf, the body's C0 round it), and seen from the point of a slot within that slot's sector
// (SECTOR_HALF_DEG) with a clear line at the stand's layer and the crouch's (perception.js clearLine: room.js coverageOf's
// rule), the slot that holds it by room.js sectorOf the same at the hide as at the start. It fails on a cell of a plan's way and
// on a cell of room 3's dead space, which the drill never looks at (the negative controls below). The dash: along the authored
// path, at most DASH_MAX_M 3 m, every 5 cm a C0 body off the walls, within DASH_MAX_MS 2 s at the place's run on the
// role-player's own legs (bundle.js legsOf, stepper.js profileOf).
// v0.0.26 ("Bang, then go": its build sheet §1 A, §6 A): room 1's two posts (house-opfor.js BREACH_SPOTS, 1a and 1b) by the same
// rule and the same dash, through the seam only while the scene's record (R.house.bangGo) says so; the boards' own stands refused
// by the rule (0.17 m off the north wall's face), which is why each man stands 0.2 m forward of his board, in his corner. Each man's
// rifle is laid on the funnel on the door's line inside it (aimAt), the threshold within SECTOR_HALF_DEG of it, his eyes on the threshold
// (the review of A, 2026-11-19: laid on the threshold, the house's own bang by the far wall lay outside his flash cone; breach-shock).
import { assert, near, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { OPFOR_SPOTS, RP_STANDS, BREACH_SPOTS, BREACH_STANDS } from '../src/data/places/house-opfor.js';
import { HOUSE1 } from '../src/data/places/wheel.js';
import { lanePlanOf, wallClearanceM, manPlace, SECTOR_HALF_DEG } from '../src/sim/combat/room.js';
import { legsOf } from '../src/sim/combat/bundle.js';
import { profileOf, pathLen } from '../src/sim/combat/stepper.js';
import { placeGaits } from '../src/sim/body/motion.js';
import { DASH_MAX_MS, DASH_MAX_M, spotOf, rpStandsOf } from '../src/sim/scenarios/opfor.js';
import { liveGame, spotCheck, segD, C0, GAP, rpScript } from './opfor-world.mjs';

const bearingOf = (p, q) => Math.atan2(q[1] - p[1], q[0] - p[0]);

// (v0.0.22: the rule moved to tests/opfor-world.mjs, its build sheet §0 item 17; re-exported here by name for one release)
export { spotCheck };

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
  {
    name: 'opfor-spots: v0.0.26, room 1\'s two posts for "Bang, then go" (1a your side, 1b your #2\'s) pass the same rule at start and hide, each dash clear, at most 3 m and within 2 s on his own legs, his side kept; the seam gives them only on the scene\'s record, and the boards\' own stands fail the rule (0.17 m off the wall)',
    fn() {
      const w = rpScript({ seed: 48213, tier: 'sgt' }), s = w.s, run = placeGaits(s).runMs, P = lanePlanOf(s).plans['o:w4:r1'];
      assert(JSON.stringify(rpStandsOf(s)) === JSON.stringify(BREACH_STANDS) && BREACH_STANDS.every(st => spotOf(s, { stand: st }) === BREACH_SPOTS[st]), 'the seam on the scene\'s record');
      const plain = createGame({ scenario: 'test-shoothouse', seed: 48213 }).state;
      assert(JSON.stringify(rpStandsOf(plain)) === JSON.stringify(RP_STANDS) && spotOf(plain, { stand: '1a' }) === undefined, 'the seam off it');
      const slots = { '1a': 1, '1b': 2 };
      for (const stand of BREACH_STANDS) {
        const S = BREACH_SPOTS[stand], H1 = HOUSE1.stands.find(x => x.stand === stand), T = w.man(stand), pid = T.live.who;
        const a = spotCheck(s, stand, S.start, { spot: S, slot0: slots[stand] }), b = spotCheck(s, stand, S.hide, { spot: S, slot0: a.slot }), board = spotCheck(s, stand, [H1.x, H1.z], { spot: S });
        const off = segD(S.hide, P.threshold, S.start), len = pathLen(S.dash), legs = legsOf(s, pid, S.start[0], S.start[1]), prof = profileOf(len, run, legs.pushMs2, legs.brakeMs2, { v0: 0, v1: 0 });
        let least = Infinity;
        for (let i = 1; i < S.dash.length; i++) {
          const p = S.dash[i - 1], q = S.dash[i], n = Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / 0.05);
          for (let k = 0; k <= n; k++) least = Math.min(least, wallClearanceM(P, p[0] + (q[0] - p[0]) * k / n, p[1] + (q[1] - p[1]) * k / n));
        }
        const side = (x, z) => manPlace(s, { x, z, room: T.room, slot: T.slot }).slot;
        console.log(`      ${stand} (${S.name}): start ${S.start} (the board ${H1.x},${H1.z}: ${board.why.join('; ') || 'ok'}) wall ${fmt(a.wall, 2)} m, way ${fmt(a.way, 2)} m, stands ${fmt(a.stands, 2)} m, seen from slot ${a.stand} (crouched ${a.crouch}), side ${a.slot}; ${fmt(Math.hypot(S.start[0] - P.threshold[0], S.start[1] - P.threshold[1]), 2)} m from the threshold`);
        console.log(`      ${stand} hide ${S.hide}: wall ${fmt(b.wall, 2)} m, way ${fmt(b.way, 2)} m, side ${b.slot}, ${fmt(Math.hypot(S.hide[0] - S.start[0], S.hide[1] - S.start[1]), 2)} m from the start, ${fmt(off, 2)} m off the threshold's line; the dash ${fmt(len, 2)} m, least wall ${fmt(least, 2)} m, ${fmt(prof.T * 1000, 0)} ms; holds ${!!S.holds}`);
        assert(a.ok && b.ok && !board.ok && board.why.some(x => x.includes('wall')), JSON.stringify({ stand, a, b, board }));
        assert(len <= DASH_MAX_M && least >= C0 + 0.01 && prof.T * 1000 <= DASH_MAX_MS && off >= 0.5 && side(...S.start) === side(...S.hide) && side(...S.start) === slots[stand], JSON.stringify({ stand, len, least, off }));
        // (the review of A, 2026-11-19: his rifle laid on the funnel inside the door, the threshold inside react.js SECTOR_HALF_DEG of it, his
        // eyes (the four-way face) on the threshold, so the house's own G-11 by the far wall lies inside the flash's cone: breach-shock)
        const thOff = Math.abs(Math.atan2(Math.sin(bearingOf(S.start, P.threshold) - bearingOf(S.start, S.aimAt)), Math.cos(bearingOf(S.start, P.threshold) - bearingOf(S.start, S.aimAt)))) * 180 / Math.PI;
        console.log(`      ${stand} aimAt ${S.aimAt} (${fmt(Math.hypot(S.aimAt[0] - P.threshold[0], S.aimAt[1] - P.threshold[1]), 2)} m inside the threshold, on its line), the threshold ${fmt(thOff, 1)}° off it (SECTOR_HALF_DEG ${SECTOR_HALF_DEG}); eyes ${S.eyes}`);
        assert(S.door === 'o:w4:r1' && S.aimAt[0] === P.threshold[0] && S.aimAt[1] < P.threshold[1] && thOff < SECTOR_HALF_DEG && S.eyes?.[0] === P.threshold[0] && S.eyes?.[1] === P.threshold[1] && T.x === S.start[0] && T.z === S.start[1], JSON.stringify({ stand, aimAt: S.aimAt, eyes: S.eyes, thOff, T: [T.x, T.z] }));
      }
      // (one man holds the door, yours: the build sheet §0 item 4)
      assert(BREACH_SPOTS['1a'].holds === true && !BREACH_SPOTS['1b'].holds, 'holds: 1a only');
    },
  },
];
