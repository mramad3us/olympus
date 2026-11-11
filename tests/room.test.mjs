// room: the room plans of X4's layout A (src/data/places/x4-plans.js) as src/sim/combat/room.js reads them (COMBAT §25.7.3, §25.13's combat-rooms; the build sheet 0.0.12 §2.1, §5.1).
//
// Printed from the code: each plan's stack, points, paths (room 1's #1 2.72 m: COMBAT §25.5.1), hot spots, sectors,
// dead space and what its points see of its floor; fails on a point under 0.4 m from a wall's face, a coverage under
// 98% (the dead space counted as cleared by the move past it), a hot spot no point sees but by the dead space,
// inFunnel or pastThreshold wrong anywhere on a probe grid round each door (against the rule written out again
// here), coveredNow wrong in a scripted room, and the plans' golden moved.
import { assert, fmt } from './helpers.mjs';
import { golden } from './golden.mjs';
import { newState, toJSON } from '../src/core/state.js';
import { X4_PLANS } from '../src/data/places/x4-plans.js';
import { WHEEL_S4, HOUSE1 } from '../src/data/places/wheel.js';
import { roomPlanOf, lanePlanOf, roomOfDoor, doorOfRoom, inFunnel, pastThreshold, coveredNow, coverageOf, pathLengthM, wallClearanceM, FUNNEL_M, FUNNEL_SIDE_M, THRESHOLD_M, SECTOR_HALF_DEG, NEAR_M } from '../src/sim/combat/room.js';
import { sightGridOf } from '../src/sim/places/sight.js';
import { clearLine } from '../src/sim/people/perception.js';

/** A point is this far or more from every wall's face (the sheet's §2.1); the floor's share the points must see (COMBAT §25.13). */
const POINT_OFF_M = 0.4, COVER_MIN = 0.98;
const P2 = (p) => `(${p.map(v => fmt(v, 2)).join(', ')})`;
// (a bare state on the Wheel's sector 4: the places the plans read, nothing else)
function houseState() {
  const s = newState(48213, { version: 'test' });
  s.places.live = { site: 'melas', area: WHEEL_S4.id };
  s.actors.area = WHEEL_S4.id;
  return s;
}

export default [
  {
    name: 'room: layout A\'s plans as authored: each stack, point, path, hot spot and sector printed; every point 0.4 m or more off every wall\'s face, room 1\'s #1 path 2.72 ± 0.05 m, the points seeing 98% or more of each floor (room 3\'s far leg the dead space the move past the middle clears), every hot spot seen from a point or in the dead space',
    fn() {
      const s = houseState(), L = lanePlanOf(s), g = sightGridOf(s, L.area), bad = [];
      console.log(`      lane ${L.lane} in ${L.area}: ${L.order.join(' → ')}`);
      for (const k of L.order) {
        const p = L.plans[k], c = coverageOf(s, p), lens = [1, 2].map(n => pathLengthM(p.paths[n]));
        const clear = p.points.map(([x, z]) => wallClearanceM(p, x, z));
        console.log(`      ${k} (${p.room}${p.parts.length > 1 ? ` + ${p.parts.slice(1).join(', ')}` : ''}, ${p.entry ?? 'the hall\'s leg'}, ${p.light}): plane ${p.plane.axis} ${p.plane.at} from ${p.plane.a} to ${p.plane.b}, into ${p.plane.into > 0 ? '+' : '−'}; threshold ${P2(p.threshold)}`);
        console.log(`        stack ${p.stack.map(P2).join(' and ')}; points ${p.points.map(P2).join(' and ')} (${clear.map(v => fmt(v, 2)).join(' and ')} m off the walls); paths ${lens.map(v => fmt(v, 2)).join(' and ')} m`);
        console.log(`        hot ${p.hot.map(h => `${h.id} ${P2([h.x, h.z])} ${h.why}`).join('; ')}; sectors ${p.sectors.map(q => `#${q.slot} ${fmt(q.yawRad, 4)} ±${q.halfDeg}°`).join(', ')}; dead ${p.dead.length ? p.dead.map(d => `${P2(d.slice(0, 2))} r ${d[2]}`).join(', ') : 'none'}; inner ${p.inner.join(', ') || 'none'}`);
        console.log(`        the floor: ${c.cells} cells, ${c.seen} seen from the points (${c.byPoint.join(' and ')}), ${c.dead} in the dead space: ${fmt(c.share * 100, 1)}%; the sectors hold ${c.bySector.map(q => `#${q.slot} ${fmt(q.share * 100, 0)}%`).join(', ')}`);
        if (clear.some(v => v < POINT_OFF_M - 1e-9)) bad.push(`${k}: a point ${clear.map(v => fmt(v, 3)).join(', ')} m off a wall`);
        if (c.share < COVER_MIN) bad.push(`${k}: the points see ${fmt(c.share * 100, 1)}%`);
        for (const h of p.hot) {
          const seen = p.points.some(([x, z]) => clearLine(g, x, z, h.x, h.z)), dead = p.dead.some(([x, z, r]) => Math.hypot(h.x - x, h.z - z) <= r);
          if (!seen && !dead) bad.push(`${k}: hot spot ${h.id} seen from no point`);
        }
        for (const n of [1, 2]) { const q = p.paths[n]; if (q[0][0] !== p.stack[n - 1][0] || q[0][1] !== p.stack[n - 1][1] || q.at(-1)[0] !== p.points[n - 1][0] || q.at(-1)[1] !== p.points[n - 1][1]) bad.push(`${k}: path ${n} does not run from its stack to its point`); }
        if (!p.sectors.every(q => q.halfDeg === SECTOR_HALF_DEG)) bad.push(`${k}: a sector not ±${SECTOR_HALF_DEG}°`);
      }
      const r1 = L.plans['o:w4:r1'], len1 = pathLengthM(r1.paths[1]);
      assert(Math.abs(len1 - 2.72) <= 0.05, `room 1's #1 path ${len1} m, not 2.72 ± 0.05`);
      assert(!bad.length, bad.join('\n'));
      // (the stands of each slot before its man on his point, seen from it but 3b in the far leg: the threats 1a, 1b, 2a and 3a in his sector, the
      // no-shoot by the inner door off it, where the drill's identification finds it)
      for (const st of HOUSE1.stands.filter(x => x.door)) {
        const p = L.plans[st.door], sec = p.sectors.find(q => q.slot === st.slot), [px, pz] = p.points[st.slot - 1];
        const off = Math.abs(((Math.atan2(st.z - pz, st.x - px) - sec.yawRad + 3 * Math.PI) % (2 * Math.PI)) - Math.PI) * 180 / Math.PI;
        console.log(`        ${st.stand} (slot ${st.slot}) ${fmt(off, 1)}° off #${st.slot}'s sector, ${clearLine(g, px, pz, st.x, st.z) ? 'seen from his point' : 'not seen from his point (the far leg)'}`);
        const seen = clearLine(g, px, pz, st.x, st.z);
        assert(st.stand === '3b' ? !seen : seen && (off <= SECTOR_HALF_DEG || (st.faces.join() === 'noshoot' && off < 90)), `${st.stand} ${off}° off its sector, seen ${seen}`);
      }
    },
  },
  {
    name: 'room: inFunnel and pastThreshold on a probe grid round every door and the hall\'s gate (FUNNEL_M 0.5 off the plane, the jambs widened 0.3; THRESHOLD_M 0.3 in, inside the plan\'s rooms): no point wrong; roomOfDoor, doorOfRoom and the cache',
    fn() {
      const s = houseState(), L = lanePlanOf(s), rows = [];
      let wrong = [];
      for (const k of L.order) {
        const p = L.plans[k], ax = p.plane.axis, n = { funnel: 0, past: 0, probes: 0 };
        // (the rule written out again: the coordinate across the plane and along it, the room's rects)
        const across = (x, z) => p.plane.into * ((ax === 'x' ? z : x) - p.plane.at), alongOf = (x, z) => (ax === 'x' ? x : z);
        const e = 1e-9, inRooms = (x, z) => p.parts.some(id => { const r = WHEEL_S4.rooms.find(q => q.id === id).rect; return x >= r[0] - e && x <= r[2] + e && z >= r[1] - e && z <= r[3] + e; });
        const mid = (p.plane.a + p.plane.b) / 2;
        for (let u = mid - 2; u <= mid + 2 + 1e-9; u += 0.05) for (let v = -2; v <= 2 + 1e-9; v += 0.05) {
          const x = ax === 'x' ? u : p.plane.at + p.plane.into * v, z = ax === 'x' ? p.plane.at + p.plane.into * v : u;
          const wantF = !!p.door && Math.abs(across(x, z)) <= FUNNEL_M && alongOf(x, z) >= p.plane.a - FUNNEL_SIDE_M && alongOf(x, z) <= p.plane.b + FUNNEL_SIDE_M;
          const wantP = across(x, z) > THRESHOLD_M && inRooms(x, z);
          const gotF = inFunnel(p, x, z), gotP = pastThreshold(p, x, z);
          n.probes++; if (gotF) n.funnel++; if (gotP) n.past++;
          if (gotF !== wantF || gotP !== wantP) wrong.push(`${k} (${fmt(x, 2)}, ${fmt(z, 2)}): funnel ${gotF}/${wantF}, past ${gotP}/${wantP}`);
        }
        // (and by hand, at the door's middle: in the plane, 0.29 and 0.31 in, 0.49 and 0.51 out; a jamb's 0.29 and 0.31 past)
        const at = (v, w = 0) => (ax === 'x' ? [mid + w, p.plane.at + p.plane.into * v] : [p.plane.at + p.plane.into * v, mid + w]);
        const hand = [[0, 0, !!p.door, false], [0.29, 0, !!p.door, false], [0.31, 0, !!p.door, true], [-0.49, 0, !!p.door, false], [-0.51, 0, false, false], [0, (p.plane.b - p.plane.a) / 2 + 0.29, !!p.door, false], [0, (p.plane.b - p.plane.a) / 2 + 0.31, false, false]];
        for (const [v, w, f, q] of hand) { const [x, z] = at(v, w); if (inFunnel(p, x, z) !== f || pastThreshold(p, x, z) !== q) wrong.push(`${k} by hand ${v}/${w}: funnel ${inFunnel(p, x, z)}, past ${pastThreshold(p, x, z)}`); }
        rows.push(`${k} ${n.probes} probes, ${n.funnel} in the funnel, ${n.past} past the threshold`);
      }
      console.log(`      ${rows.join('; ')}; wrong ${wrong.length}`);
      assert(!wrong.length, wrong.slice(0, 8).join('\n'));
      const maps = L.order.map(k => `${k} → ${roomOfDoor(k)} → ${doorOfRoom(roomOfDoor(k))}`);
      console.log(`      ${maps.join('; ')}; w4.r3-far → ${doorOfRoom('w4.r3-far')}; w4.apron-e → ${doorOfRoom('w4.apron-e')}`);
      assert(L.order.every(k => doorOfRoom(roomOfDoor(k)) === k) && doorOfRoom('w4.r3-far') === 'o:w4:r3' && doorOfRoom('w4.apron-e') === null && roomOfDoor('o:w4:closet') === null, maps.join('; '));
      // (the plans are runtime: cached in $rooms, the same object on a second read, never in a save)
      const again = roomPlanOf(s, 'o:w4:r1');
      assert(again === L.plans['o:w4:r1'] && s.$rooms?.A?.['o:w4:r1'] === again && !toJSON(s).includes('"$rooms"') && roomPlanOf(s, 'o:w4:closet') === null, 'the cache');
    },
  },
  {
    name: 'room: coveredNow in a scripted room: #1 on his point looking into his sector covers his far corner and the corner he stands in, the #2 on his the other two; nothing from the stack outside; a hot spot behind room 3\'s wing wall is not covered however he looks',
    fn() {
      const s = houseState(), L = lanePlanOf(s), r1 = L.plans['o:w4:r1'], r3 = L.plans['o:w4:r3'];
      const actor = (who, [x, z], headRad, more = {}) => ({ id: `a${who}`, who: null, x, z, face: 'up', headRad, ...more });
      const one = actor(1, r1.points[0], r1.sectors[0].yawRad), two = actor(2, r1.points[1], r1.sectors[1].yawRad);
      const c1 = coveredNow(s, r1, one), c2 = coveredNow(s, r1, two), out = coveredNow(s, r1, actor(1, r1.stack[0], -Math.PI / 2));
      const away = coveredNow(s, r1, actor(1, r1.points[0], Math.PI / 2)), kneel = coveredNow(s, r1, actor(1, r1.points[0], r1.sectors[0].yawRad, { stance: 'kneel' }));
      const far = r3.hot.find(h => h.id === 'r3:far'), atPoint = actor(1, r3.points[0], Math.atan2(far.z - r3.points[0][1], far.x - r3.points[0][0]));
      const pastMid = actor(1, [18.9, 7.6], Math.atan2(far.z - 7.6, far.x - 18.9)), c3 = coveredNow(s, r3, atPoint), c3m = coveredNow(s, r3, pastMid);
      console.log(`      room 1: #1 at ${P2(r1.points[0])} looking ${fmt(r1.sectors[0].yawRad, 3)} rad covers ${c1.join(', ')}; the #2 at ${P2(r1.points[1])} ${c2.join(', ')}; #1 on his stack ${out.join(', ') || 'none'}; #1 on his point looking back at the hall ${away.join(', ') || 'none'}; kneeling ${kneel.join(', ')}`);
      console.log(`      room 3: #1 on his point looking at the far leg ${c3.join(', ') || 'none'} (the wing wall); past the near leg's middle at (18.9, 7.6) ${c3m.join(', ') || 'none'}; within ${NEAR_M} m whatever the yaw, ±${SECTOR_HALF_DEG}° else`);
      assert(c1.join() === 'r1:nl,r1:fl' && c2.join() === 'r1:nr,r1:fr' && !out.length && away.join() === 'r1:nl' && kneel.join() === c1.join(), JSON.stringify({ c1, c2, out, away, kneel }));
      assert(!c3.includes('r3:far') && c3m.includes('r3:far'), JSON.stringify({ c3, c3m }));
    },
  },
  {
    name: 'room: the plans of X4\'s layout A are pinned by a golden (set on purpose in 0.0.12: COMBAT §25.7.3, "held by a golden hash")',
    fn() {
      const h = golden('room: X4_PLANS', X4_PLANS, '122fbb741feb40')   // (0.0.12, set on purpose: layout A, then room 3's far walk at the integration);
      console.log(`      X4_PLANS ${h}: layouts ${Object.keys(X4_PLANS).join(', ')}; layout A's ${X4_PLANS.A.order.length} plans`);
    },
  },
];
