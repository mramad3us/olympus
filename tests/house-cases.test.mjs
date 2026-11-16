// OLYMPUS tests: the drawn house's room cases, each held to room.test's rules where the assembler places it (the build sheet v0.0.21 §1 item 1, §6; house lens H2).
//
// A room case is a chunk on a side of the hall with a swing: the centre, the corner and the ell, north or south, push or pull, 12
// in stage 1 (the mirrors' 8 wait for MIRROR_ROOMS). Each is placed in its reference lane (scenes/assemble.js roomCaseOf: the first
// shape that holds it, its first placement) and its plan read as the game reads it (room.js roomPlanOf: the swing derived from the
// drawn opening, the stack checked on its latch side within STACK_SWING_TOL_M 0.02), then held to room.test's rules for layout A's:
// every point 0.4 m or more off every wall's face; the points seeing 98% or more of the floor (the dead space the far walk clears);
// every path and the far walk walkable as drawn, each leg clear on the C0 grid with the doors open and by the walker's own circle at
// 1 cm steps; each path within PATH_TOL_M 0.15 of the chunk's plan as transformed; corner.js's rule taking the plan's own entry
// and point for #1, and the DI's screen words for both men. The flipped rooms are the ones the grid does not flip with (the hall's
// south wall at 14.4 m is off the 0.25 m grid): the transform alone leaves legs cut there, printed as "raw cut", and the fitted
// plan clears them (fails without assemble.js fitPath or the routing: the raw paths cut 2 to 5 legs a flipped case).
import { assert, fmt } from './helpers.mjs';
import { newState } from '../src/core/state.js';
import { openNavOf, clearLine as navClear } from '../src/sim/places/nav.js';
import { standOk } from '../src/sim/places/collide.js';
import { roomPlanOf, coverageOf, wallClearanceM, pathLengthM } from '../src/sim/combat/room.js';
import { cornerRuleOf, screenWordsOf } from '../src/sim/combat/corner.js';
import { roomCaseOf, assembleHouse, rawPathsOf, parseHouse, PATH_TOL_M } from '../src/sim/scenes/assemble.js';

const POINT_OFF_M = 0.4, COVER_MIN = 0.98;
const P2 = (p) => `(${p.map(v => fmt(v, 2)).join(', ')})`;
// (a bare state on a drawn house: the places the plans read, the record that names the house, nothing else)
function drawnState(code) {
  const s = newState(48213, { version: 'test' }), H = assembleHouse(code);
  s.places.live = { site: 'melas', area: H.area.id };
  s.actors.area = H.area.id;
  s.armoury.range = { course: 'house', house: { lane: 'A', draw: { mode: 'drawn', v: 1, code: H.code } } };
  return s;
}
// (the least distance from a point to a polyline)
function toPath(p, path) {
  let d = Infinity;
  for (let i = 0; i < path.length; i++) {
    const a = path[i], b = path[i + 1] ?? a, vx = b[0] - a[0], vz = b[1] - a[1], l2 = vx * vx + vz * vz, t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vz) / l2)) : 0;
    d = Math.min(d, Math.hypot(a[0] + vx * t - p[0], a[1] + vz * t - p[1]));
  }
  return d;
}
const walker = (G, a, b) => { const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.01)); for (let k = 0; k <= n; k++) if (!standOk(G, a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n)) return false; return true; };
const legsCut = (G, path) => path.slice(1).filter((q, i) => !navClear(G, path[i][0], path[i][1], q[0], q[1]) || !walker(G, path[i], q)).length;

const CASES = ['C', 'K', 'E'].flatMap(L => ['n', 's'].flatMap(side => ['push', 'pull'].map(how => [L, side, how])));

export default [
  {
    name: 'the 12 room cases of stage 1 (the centre, the corner and the ell, north or south of the hall, push or pull), each in its reference lane: every point 0.4 m off the walls, the points seeing 98% of the floor, every path and far walk walkable as drawn and within PATH_TOL_M 0.15 of its transform, the stack on the latch side, the corner rule\'s entry and point the plan\'s, the screen words said (the transform alone cuts legs on every flipped room)',
    fn() {
      const bad = [];
      let rawCutFlipped = 0;
      for (const [L, side, how] of CASES) {
        const K = roomCaseOf(L, side, how), H = parseHouse(K.code), k = H.rooms.findIndex(r => r.letter === L && r.side === side);
        const s = drawnState(K.code), A = assembleHouse(K.code), door = A.plans.order[k], P = roomPlanOf(s, door), G = openNavOf(A.area.id, 'C0'), raw = rawPathsOf(K.code)[door];
        const c = coverageOf(s, P), clear = P.points.map(([x, z]) => wallClearanceM(P, x, z));
        const ways = [['1', P.paths[1], raw[1]], ['2', P.paths[2], raw[2]], ...(P.far ? [['far', P.far.path, raw.far]] : [])];
        const cut = ways.reduce((n, [, w]) => n + legsCut(G, w), 0), rawCut = ways.reduce((n, [, , w]) => n + legsCut(G, w), 0);
        const off = Math.max(...ways.flatMap(([, w, r]) => [...w.map(q => toPath(q, r)), ...r.map(q => toPath(q, w))]));
        const r1 = cornerRuleOf(P, 1), r2 = cornerRuleOf(P, 2), words = [screenWordsOf(r1), screenWordsOf(r2)];
        const pointOk = r1?.point && Math.hypot(r1.point[0] - P.points[0][0], r1.point[1] - P.points[0][1]) < 0.01;
        if (side !== (L === 'K' ? 's' : 'n')) rawCutFlipped += rawCut;
        console.log(`      ${L}${side} ${how} (${P.swing.words} ${P.entry}) in ${K.code}: points ${P.points.map(P2).join(' and ')} ${clear.map(v => fmt(v, 2)).join(' and ')} m off; ${fmt(c.share * 100, 1)}% seen; paths ${[1, 2].map(n => fmt(pathLengthM(P.paths[n]), 2)).join(' and ')} m${P.far ? `, far ${fmt(pathLengthM(P.far.path), 2)} m` : ''}; cut ${cut}, raw cut ${rawCut}; worst offset ${fmt(off, 3)} m; #1 ${r1?.entry} to ${r1?.side}, #2 ${r2?.entry}; said "${words.join('", "')}"`);
        if (clear.some(v => v < POINT_OFF_M - 1e-9)) bad.push(`${L}${side} ${how}: a point ${clear.map(v => fmt(v, 3)).join(', ')} m off a wall`);
        if (c.share < COVER_MIN) bad.push(`${L}${side} ${how}: ${fmt(c.share * 100, 1)}% seen`);
        if (cut) bad.push(`${L}${side} ${how}: ${cut} legs cut`);
        if (off > PATH_TOL_M + 1e-9) bad.push(`${L}${side} ${how}: a path ${fmt(off, 3)} m off its transform`);
        if (r1?.entry !== P.entry || !pointOk) bad.push(`${L}${side} ${how}: the rule's #1 ${r1?.entry} at ${JSON.stringify(r1?.point)}, the plan's ${P.entry} at ${JSON.stringify(P.points[0])}`);
        if (!words.every(Boolean)) bad.push(`${L}${side} ${how}: no screen words`);
        if (P.swing.how !== how) bad.push(`${L}${side} ${how}: the door read ${P.swing.how}`);
      }
      console.log(`      ${CASES.length} cases; the raw transforms of the flipped rooms cut ${rawCutFlipped} legs, the plans as fitted 0${bad.length ? `; off: ${bad.join('; ')}` : ''}`);
      assert(!bad.length && rawCutFlipped > 0, bad.join('\n') || 'no raw cut on a flipped room: the case proves nothing');
    },
  },
];
