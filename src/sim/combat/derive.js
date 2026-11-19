// OLYMPUS combat: a room plan derived from its geometry alone, the check of every authored plan and the source of X4's other five rooms (COMBAT §25.7.3; the build sheet v0.0.22 item 12, §3.1, §5; house lens G1).
//
// COMBAT §25.7.3 promised that the room plans "are derived from PLACES's room polygons ... and checked against these" (the
// authored, src/data/places/x4-plans.js). This is that derivation, a pure function of a door, the rooms it enters and the area's
// grids (the walls, the sight grid, the routing grid), writing every field an authored plan has:
//   stack     the door's swing's (swing.js stackPointsOf, on its latch side; corner.js roomFromOpening): layout A's exactly
//   points    the corner rule's own (corner.js cornerRuleOf on a plan with none), but a man who turns stops at most
//             POINT_REACH_M 1.55 m past his jamb along the door's wall: a wide room's point of domination is where he first
//             dominates it, not its far corner (room 2's #1: the rule's (24.5, 14.9) is 1.90 m deeper than the authored (22.6,
//             14.9), COMBAT §25.7.4's named gap; capped, 0.00 m off); and a point the rule puts in a no-stop funnel (its door's,
//             or a declared doorway's: zones.js, within FUNNEL_M 0.5 of the line, between the jambs widened by FUNNEL_SIDE_M) is
//             pushed straight off the line to FAR_FUNNEL_M 0.6 (FUNNEL_M + EXIT_M) where that stands FAR_WALL_M off every wall: the
//             small room's 3.2 m put both men 0.5 m in, on its own door's funnel, and the DI marked DOORWAY on a perfect run
//   sectors   the corner rule's, from the points (the arc from his far corner to the far wall's middle), SECTOR_HALF_DEG 20; but a man
//             who goes straight in down a corner-fed room's fed wall holds its far wall, the bisector of its two corners (the rule's arc
//             and the turning man's met at the far wall's middle, so a stand there was both men's: the authored room 2 gives it #2)
//   dead      the floor cells past the door's plane that neither point sees at the stand's layer (room.js coverageOf's own rule), as
//             one circle round them: their centroid, the farthest plus half a cell
//   hot       one 0.5 m in from every corner of the rooms past the plane but where a man's eye cannot reach it from a point (the
//             dead space's corners: its middle stands for them), where it is a doorway's own end (the ell's near leg running on
//             into its far leg) and within CORNER_FED_M 1.0 of a jamb (the corner-fed side's near corner is the jamb); one 0.5 m
//             off each free end of a wall a doorway cuts in the rooms (the ell's wing wall: 'bend'), into the room entered and back
//             along the wall; "behind the door" on a push door's hinge side as roomFromOpening has it; the dead space's middle
//             (`far`, its why 'far leg' for every reader that keys on it, the words the plan's `far.words`: "the far leg", "the
//             back room")
//   far       #1's walk from his point to the nearest place 0.4 m or more off every wall that sees FAR_SEE_SHARE 0.75 of the dead cells,
//             straight on the routing grid or through an inner doorway's middle; through a doorway declared a no-stop funnel
//             (a chunk's noStop), it ends FUNNEL_M + EXIT_M (0.6 m) or more past the doorway's plane, so nobody stops in it
//   paths     x4-plans.js's lane rule (the stack, the door's outer middle and the threshold LANE_OFFSET_M 0.12 toward the side the
//             slot turns to, the point), each leg held off a jamb's corner by holdOffs (below), then routed (route.js routed,
//             every door of the area open), which keeps a leg that is clear
//   entry, inner, light   the corner rule's #1 entry; the leafed openings of the rooms the plan does not take (room 2's closet); the
//             entered room's lighting ('cqbDim' dim, else day)
// holdOffs(path, jambs): where a leg passes a jamb's corner within JAMB_HOLD_M 0.28 (a body's C0 0.27 and a centimetre:
// x4-plans.js's header, "a waypoint holds it off"), a waypoint on the corner's outward bisector, at the least distance from
// JAMB_HOLD_M on (1 cm steps) at which both new legs clear every jamb by JAMB_HOLD_M and the routing grid's cells (the authored room
// 2's two hold-offs stand on that bisector, 0.41 and 0.45 m out).
// Measured against layout A (tests/plans-derived.test.mjs, F74): every field within DERIVE_TOL, and the same owner by room.js
// sectorOf for every stand and candidate place. It runs at a fill only on the lead's switch (&plans=derived, scenes/assemble.js
// planSetOf: up to 54 ms a room), never at a lane tick; X4's other five rooms are derived by tools/derive-plans.mjs, reviewed and
// committed into src/data/chunks/x4.js as `derived@1` (the hub's "game world is handcrafted": a tool proposes, the author
// commits; tests/chunks-fresh.test.mjs holds them equal to what this gives today). Pure: it reads the frozen area and its grids
// (memoised by area in the modules it reads), imports nothing of scenarios/ or scenes/.
import { roomFromOpening, cornerRuleOf, frameOf } from './corner.js';
import { routed } from './route.js';
import { openNavOf, clearLine as navClear } from '../places/nav.js';
import { sightGridOf } from '../places/sight.js';
import { clearLine as sightClear } from '../people/perception.js';
import { areaOf, openingOf } from '../places/model.js';
import { planOf, wallsOf, wallRect } from '../places/plan.js';
import { FUNNEL_M, FUNNEL_SIDE_M } from '../places/zones.js';
import { LANE_OFFSET_M } from '../../data/places/x4-plans.js';

/** A man who turns stops at most this far past his jamb along the door's wall, metres (the authored room 2's #1: house lens §0 item 1). */
export const POINT_REACH_M = 1.55;
/** A leg is held this far off a jamb's corner, metres (C0 0.27 and a centimetre: x4-plans.js's header). */
export const JAMB_HOLD_M = 0.28;
/** No waypoint of one slot's path stands within this of the other's, metres (x4-plans.js's header). */
export const WAYPOINT_GAP_M = 0.1;
/**
 * How far a derived plan may stand from the authored and still be the same plan (the build sheet v0.0.22 §5, my calls over the
 * worst measured on layout A: a point 0.17 m, a hot spot 0.16, a dead circle's centre 0.16 and radius 0.40, the far walk's end
 * 0.76, a waypoint 0.13 and a path's length 0.08 m, a sector 25.8 degrees): stack, point, hot spot, dead centre and radius, far
 * end, path (each waypoint to the other polyline, both ways), path length (m); sector (degrees).
 */
export const DERIVE_TOL = Object.freeze({ stackM: 0.02, pointM: 0.25, hotM: 0.30, deadCentreM: 0.30, deadRadiusM: 0.50, farEndM: 0.80, pathM: 0.15, pathLenM: 0.10, sectorDeg: 30 });
/** A wall a doorway cuts is a 'bend' where it runs on more than this past the doorway's end, metres (corner.js CORNER_FED_M's 1.0). */
export const BEND_MIN_M = 1.0;
/** A corner within this of a jamb is the jamb's (no hot spot), metres (corner.js CORNER_FED_M). */
export const CORNER_JAMB_M = 1.0;
/** The far walk ends at least this far off every wall, and this far past a declared funnel's plane, metres (zones.js FUNNEL_M + EXIT_M). */
export const FAR_WALL_M = 0.4, FAR_FUNNEL_M = 0.6;
/** The far walk's candidate places, every this many metres; its end sees at least this share of the dead space's cells (room 3: 0.75 gives (18.5, 7.4), 0.22 m from the authored end; seeing the middle alone gave a place 1.75 m off, its line grazing the wing wall's end). */
export const FAR_STEP_M = 0.1, FAR_SEE_SHARE = 0.75;

const r2 = (v) => Math.round(v * 100) / 100;
const D = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const inRect = (r, p, e = 1e-9) => p[0] >= r[0] - e && p[0] <= r[2] + e && p[1] >= r[1] - e && p[1] <= r[3] + e;
/** The least distance from a point to a segment. */
export function segDist(p, a, b) {
  const vx = b[0] - a[0], vz = b[1] - a[1], l2 = vx * vx + vz * vz, t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vz) / l2)) : 0;
  return Math.hypot(a[0] + vx * t - p[0], a[1] + vz * t - p[1]);
}

/**
 * A door's geometry in an area, what derivePlan reads (corner.js roomFromOpening's { door, plane, rects, threshold, swing, stack,
 * hot, corners }, and the area, the rooms entered (parts, the first holding the threshold) and the room the stack stands in).
 * opening: an opening record or id (a record may carry a swing other than the area's own: the tool's four swings).
 */
export function geoOf(areaId, opening, parts) {
  const area = areaOf(areaId), o = typeof opening === 'string' ? openingOf(opening) : opening;
  if (!area || !o) return null;
  const rects = Object.fromEntries(area.rooms.map(r => [r.id, r.rect])), from = o.rooms.find(r => !parts.includes(r));
  return { ...roomFromOpening(o, rects, from, parts), area: areaId, parts: [...parts], from, $o: o };
}

// (the wall runs of an area, and a door's jamb corners: the corners of the wall runs that end at the door's two ends, each with its
// outward bisector (away from the run's middle along the line, away from the line across it))
function jambsOf(areaId, o) {
  const out = [];
  for (const w of wallsOf(planOf(areaOf(areaId)))) {
    if (w.axis !== o.axis || Math.abs(w.at - o.at) > 0.01) continue;
    const touch = [o.a, o.b].filter(e => Math.abs(w.a - e) < 0.01 || Math.abs(w.b - e) < 0.01);
    if (!touch.length) continue;
    const R = wallRect(w), cs = [[R.x0, R.z0], [R.x1, R.z0], [R.x0, R.z1], [R.x1, R.z1]], cx = (R.x0 + R.x1) / 2, cz = (R.z0 + R.z1) / 2;
    for (const [x, z] of cs) {
      const along = o.axis === 'x' ? x : z;
      if (!touch.some(e => Math.abs(along - e) < 0.01)) continue;
      const u = [Math.sign(x - cx), Math.sign(z - cz)], n = Math.hypot(...u) || 1;
      out.push({ x, z, out: [u[0] / n, u[1] / n] });
    }
  }
  return out;
}
/**
 * A path held off the jambs (see the header): each leg passing a jamb's corner within holdM gains a waypoint on its outward bisector,
 * at the least distance from holdM (1 cm steps, to 1 m) at which both new legs clear every jamb by holdM (and, given G, a routing grid,
 * are clear on it: a waypoint in a cell the grid blocks would be routed round), and stands WAYPOINT_GAP_M or more from every point of
 * `avoid` (the other slot's path: x4-plans.js's rule, no waypoint of one slot within 0.1 m of the other's). jambs: [{ x, z, out }].
 */
export function holdOffs(path, jambs, holdM = JAMB_HOLD_M, G = null, avoid = []) {
  let p = path.map(q => [...q]);
  const clearOf = (a, b) => jambs.every(J => segDist([J.x, J.z], a, b) >= holdM - 1e-9) && (!G || navClear(G, a[0], a[1], b[0], b[1]));
  const apart = (q) => avoid.every(w => D(w, q) >= WAYPOINT_GAP_M - 1e-9);
  for (let pass = 0; pass < 4; pass++) {
    let moved = false;
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i], b = p[i + 1];
      const J = jambs.find(j => segDist([j.x, j.z], a, b) < holdM - 1e-9);
      if (!J) continue;
      let w = null;
      for (let d = holdM; d <= 1.0 + 1e-9 && !w; d += 0.01) {
        const q = [r2(J.x + J.out[0] * d), r2(J.z + J.out[1] * d)];
        if (clearOf(a, q) && clearOf(q, b) && apart(q)) w = q;
      }
      if (!w) continue;
      p = [...p.slice(0, i + 1), w, ...p.slice(i + 1)];
      moved = true;
      break;
    }
    if (!moved) break;
  }
  return p;
}

// (the point of domination with the reach cap (see the header))
function capped(geo, rule, reachM = POINT_REACH_M) {
  if (rule.turn === 'straight') return rule.derived;
  const F = frameOf(geo), q = F.to(...rule.derived), k = rule.side === 'left' ? 1 : -1, lim = F.halfW + reachM;
  return Math.abs(q.s) > lim ? F.at(q.d, k * lim) : rule.derived;
}
// (a point out of every no-stop funnel the plan meets (see the header): its own door's and the declared doorways' (zones.js zonesOf
// makes a funnel of exactly these); pushed straight off the line, on the side it stands, to FAR_FUNNEL_M, where that stands FAR_WALL_M
// off every wall, else left (house-cases' rule then says so). v0.0.22's review: the small room's corner rule, POINT_OFF_M 0.5 in and
// 1.0 m along from a side wall 1.6 m off its door's middle, put both points on its door's funnel's edge in every case)
function outOfFunnels(geo, p, funnels = []) {
  let q = p;
  for (const o of areaOf(geo.area)?.openings ?? []) {
    if (o.id !== geo.door && !funnels.includes(o.id)) continue;
    const d = (o.axis === 'x' ? q[1] : q[0]) - o.at, u = o.axis === 'x' ? q[0] : q[1];
    if (Math.abs(d) > FUNNEL_M + 1e-9 || u < o.a - FUNNEL_SIDE_M - 1e-9 || u > o.b + FUNNEL_SIDE_M + 1e-9) continue;
    const s = d >= 0 ? 1 : -1, n = (o.axis === 'x' ? [q[0], o.at + s * FAR_FUNNEL_M] : [o.at + s * FAR_FUNNEL_M, q[1]]).map(r2);
    if (wallClear(geo.area, n) >= FAR_WALL_M - 1e-9) q = n;
  }
  return q;
}
// (a man who goes straight in down a corner-fed room's fed wall holds its far wall: the bisector of his bearings to its two corners
// (the corner rule's own arc runs from his far corner to the far wall's middle, where the turning man's ends too, so a stand at the
// far wall's middle was both men's: room 2's (22.75, 19.0), the authored #2's))
function farWallYaw(geo, p) {
  const F = frameOf(geo), E = enteredOf(geo), cs = [[E[0], E[1]], [E[2], E[1]], [E[0], E[3]], [E[2], E[3]]].map(([x, z]) => F.to(x, z));
  const d1 = Math.max(...cs.map(c => c.d)), sL = Math.max(...cs.map(c => c.s)), sR = Math.min(...cs.map(c => c.s)), a = F.at(d1, sL), b = F.at(d1, sR);
  const ya = Math.atan2(a[1] - p[1], a[0] - p[0]), yb = Math.atan2(b[1] - p[1], b[0] - p[0]), mid = ya + Math.atan2(Math.sin(yb - ya), Math.cos(yb - ya)) / 2;
  return Math.round(Math.atan2(Math.sin(mid), Math.cos(mid)) * 1e4) / 1e4;
}
// (the plan's leafless inner openings: doorways between two of its rooms)
function doorwaysOf(geo) {
  return (areaOf(geo.area)?.openings ?? []).filter(o => o.kind === 'doorway' && geo.parts.includes(o.rooms[0]) && geo.parts.includes(o.rooms[1]));
}
const midOf = (o) => (o.axis === 'x' ? [(o.a + o.b) / 2, o.at] : [o.at, (o.a + o.b) / 2]);
// (the entered rect: the one holding the threshold)
const enteredOf = (geo) => geo.rects.find(r => inRect(r, geo.threshold)) ?? geo.rects[0];

/**
 * The dead space (see the header): [[x, z, rM]] (one circle, or none), from the sight grid's cells of the rooms past the door's plane
 * that neither point sees at the stand's layer; with the cells themselves for the far walk.
 */
export function deadOf(geo, points) {
  const grid = sightGridOf({}, geo.area), C = grid.cellM, F = frameOf(geo), unseen = [], done = new Set();
  for (const r of geo.rects) for (let j = Math.floor((r[1] - grid.z0) / C); j * C + grid.z0 < r[3]; j++) for (let i = Math.floor((r[0] - grid.x0) / C); i * C + grid.x0 < r[2]; i++) {
    const x = grid.x0 + (i + 0.5) * C, z = grid.z0 + (j + 0.5) * C, key = j * grid.nx + i;
    if (done.has(key) || !inRect(r, [x, z], 0) || F.to(x, z).d <= 0) continue;
    done.add(key);
    if ((grid.bits[key] & 4) !== 0) continue;
    if (!points.some(p => sightClear(grid, p[0], p[1], x, z, 'stand'))) unseen.push([x, z]);
  }
  if (!unseen.length) return { dead: [], unseen };
  const cx = unseen.reduce((a, p) => a + p[0], 0) / unseen.length, cz = unseen.reduce((a, p) => a + p[1], 0) / unseen.length;
  const rM = Math.max(...unseen.map(p => Math.hypot(p[0] - cx, p[1] - cz))) + C / 2;
  return { dead: [[r2(cx), r2(cz), r2(rM)]], unseen };
}

/**
 * The hot spots (see the header): [{ id, x, z, why }], from the geometry, the points and the dead circle (or null). Ids: 'c<n>' a
 * corner (roomFromOpening's numbering), 'bend<n>' a wall's free end, 'far' the dead space's middle.
 */
export function hotOf(geo, points, dead = null) {
  const grid = sightGridOf({}, geo.area), F = frameOf(geo), ways = doorwaysOf(geo), E = enteredOf(geo);
  const jambs = [F.at(0, F.halfW), F.at(0, -F.halfW)];
  const seen = (p) => points.some(q => sightClear(grid, q[0], q[1], p[0], p[1], 'stand'));
  const onWay = (c) => ways.some(o => Math.abs((o.axis === 'x' ? c.z : c.x) - o.at) < 1e-6 && (o.axis === 'x' ? c.x : c.z) >= o.a - 1e-6 && (o.axis === 'x' ? c.x : c.z) <= o.b + 1e-6);
  const out = [];
  for (const h of geo.hot) {
    const c = geo.corners.find(k => `gen:${k.id}` === h.id);
    if (!c || onWay(c) || jambs.some(j => D(j, [c.x, c.z]) <= CORNER_JAMB_M + 1e-9) || !seen([h.x, h.z])) continue;
    out.push({ id: c.id, x: r2(h.x), z: r2(h.z), why: h.why });
  }
  // (a wall's free end where a doorway cuts it: the shared edge of the doorway's two rooms, the doorway's ends that stop BEND_MIN_M
  // or more short of its ends; the hot spot 0.5 m into the room entered and 0.5 m back along the wall)
  let n = 0;
  for (const o of ways) {
    const ra = geo.rects[geo.parts.indexOf(o.rooms[0])], rb = geo.rects[geo.parts.indexOf(o.rooms[1])];
    if (!ra || !rb) continue;
    const lo = o.axis === 'x' ? Math.max(ra[0], rb[0]) : Math.max(ra[1], rb[1]), hi = o.axis === 'x' ? Math.min(ra[2], rb[2]) : Math.min(ra[3], rb[3]);
    const inSide = o.axis === 'x' ? Math.sign((E[1] + E[3]) / 2 - o.at) : Math.sign((E[0] + E[2]) / 2 - o.at);
    // (each end: the way the wall runs on from it, -1 from the doorway's a end, +1 from its b end)
    for (const [e, way] of [[o.a, -1], [o.b, 1]]) {
      if ((way < 0 ? e - lo : hi - e) <= BEND_MIN_M + 1e-9) continue;
      const along = r2(e + way * 0.5), across = r2(o.at + inSide * 0.5), p = o.axis === 'x' ? [along, across] : [across, along];
      if (!seen(p)) continue;
      out.push({ id: `bend${n ? n + 1 : ''}`, x: p[0], z: p[1], why: 'corner' });
      n++;
    }
  }
  if (dead) out.push({ id: 'far', x: dead[0], z: dead[1], why: 'far leg' });
  return out;
}

/**
 * #1's far walk (see the header): { path: [point, (doorway's middle), end], lenM, through (the doorway's id, or null), share } or
 * null with no place that sees FAR_SEE_SHARE of the dead cells. funnels: the ids of the doorways declared no-stop funnels; unseen:
 * the dead cells (deadOf's).
 */
export function farWalkOf(geo, point, dead, { funnels = [], unseen = null } = {}) {
  if (!dead) return null;
  const grid = sightGridOf({}, geo.area), G = openNavOf(geo.area, 'C0'), F = frameOf(geo), ways = doorwaysOf(geo);
  const cells = unseen ?? deadOf(geo, geo.points ?? [point]).unseen;
  // (a place in a declared funnel's reach: within FAR_FUNNEL_M of its doorway's line, between its jambs widened by FUNNEL_SIDE_M)
  const inFunnel = (x, z) => ways.some(o => funnels.includes(o.id) && Math.abs((o.axis === 'x' ? z : x) - o.at) < FAR_FUNNEL_M - 1e-9 && (o.axis === 'x' ? x : z) >= o.a - FUNNEL_SIDE_M && (o.axis === 'x' ? x : z) <= o.b + FUNNEL_SIDE_M);
  const cand = [];
  for (const r of geo.rects) for (let i = 0; ; i++) {
    const x = r2(r[0] + FAR_WALL_M + i * FAR_STEP_M);
    if (x > r[2] - FAR_WALL_M + 1e-9) break;
    for (let j = 0; ; j++) {
      const z = r2(r[1] + FAR_WALL_M + j * FAR_STEP_M);
      if (z > r[3] - FAR_WALL_M + 1e-9) break;
      const p = [x, z];
      if (F.to(x, z).d <= 0.3 || wallClear(geo.area, p) < FAR_WALL_M - 1e-9 || inFunnel(x, z)) continue;
      let via = null, through = null;
      if (navClear(G, point[0], point[1], x, z)) via = [];
      else for (const o of ways) {
        const m = midOf(o);
        if (!navClear(G, point[0], point[1], m[0], m[1]) || !navClear(G, m[0], m[1], x, z)) continue;
        via = [[r2(m[0]), r2(m[1])]]; through = o.id; break;
      }
      if (!via) continue;
      const pts = [point, ...via, p];
      cand.push({ d: pts.slice(1).reduce((a, q, k) => a + D(pts[k], q), 0), pts, through });
    }
  }
  cand.sort((a, b) => a.d - b.d || a.pts.at(-1)[0] - b.pts.at(-1)[0] || a.pts.at(-1)[1] - b.pts.at(-1)[1]);
  for (const c of cand) {
    const p = c.pts.at(-1), share = cells.filter(q => sightClear(grid, p[0], p[1], q[0], q[1], 'stand')).length / (cells.length || 1);
    if (share >= FAR_SEE_SHARE - 1e-9) return { path: c.pts.map(q => [r2(q[0]), r2(q[1])]), lenM: r2(c.d), through: c.through, share: r2(share) };
  }
  return null;
}
// (the distance from a point to the nearest wall face of an area: room.js wallClearanceM's, which this module may not import)
function wallClear(areaId, [x, z]) {
  let best = Infinity;
  for (const w of wallsOf(planOf(areaOf(areaId)))) {
    const r = wallRect(w), dx = Math.max(r.x0 - x, 0, x - r.x1), dz = Math.max(r.z0 - z, 0, z - r.z1);
    best = Math.min(best, Math.hypot(dx, dz));
  }
  return best;
}
/** The distance from a point to the nearest wall face of an area, metres (room.js wallClearanceM's rule). */
export const wallClearOf = (areaId, x, z) => wallClear(areaId, [x, z]);

/**
 * A room plan from its geometry (see the header): every field X4_PLANS has (room, parts, door, threshold, entry, stack, points,
 * corners, hot, sectors, dead, paths, far?, inner, light), in the area's frame. geo: geoOf's. opts: reachM and holdM (the
 * constants), open (the doors routed open: every door of the area by default), funnels (the doorways declared no-stop funnels),
 * farWords (the far hot spot's words: 'the back room' where the dead space is a room of its own).
 */
export function derivePlan(geo, { reachM = POINT_REACH_M, holdM = JAMB_HOLD_M, open = null, funnels = [], farWords = null } = {}) {
  const area = areaOf(geo.area), rules0 = [1, 2].map(sl => cornerRuleOf(geo, sl)), points = rules0.map(r => outOfFunnels(geo, capped(geo, r, reachM).map(r2), funnels));
  const withPts = { ...geo, points }, rules = [1, 2].map(sl => cornerRuleOf(withPts, sl));
  const sectors = rules.map((r, i) => ({ slot: i + 1, yawRad: r.door === 'corner-fed' && r.turn === 'straight' ? farWallYaw(geo, points[i]) : r.sector.yawRad, halfDeg: 20 }));
  const { dead, unseen } = deadOf(geo, points), hot = hotOf(geo, points, dead[0] ?? null);
  const far = dead.length ? farWalkOf(geo, points[0], dead[0], { funnels, unseen }) : null;
  const F = frameOf(geo), jambs = jambsOf(geo.area, geo.$o), doors = open ?? area.openings.filter(o => o.kind === 'door').map(o => o.id);
  const route = (p) => routed({}, p, { area: geo.area, open: doors }).map(q => [r2(q[0]), r2(q[1])]);
  const paths = {};
  for (const sl of [1, 2]) {
    const r = rules[sl - 1], off = r.turn === 'left' ? LANE_OFFSET_M : r.turn === 'right' ? -LANE_OFFSET_M : 0;
    const raw = [geo.stack[sl - 1], F.at(-0.3, off), F.at(0.3, off), points[sl - 1]].map(p => p.map(r2));
    paths[sl] = route(holdOffs(raw, jambs, holdM, openNavOf(geo.area, 'C0'), sl === 2 ? paths[1] : []));
  }
  const E = enteredOf(geo), lit = area.rooms.find(r => r.id === geo.parts[geo.rects.indexOf(E)])?.lighting;
  // (the far walk's words: the room it ends in where that is a room of its own past an inner doorway ('Room 4, the back room': "the
  // back room"); none where it ends in the entered room or a leg of it (the ell's far leg: the readers' own "the far leg"))
  const endRoom = far ? area.rooms.find(r => geo.parts.includes(r.id) && inRect(r.rect, far.path.at(-1)) && r.rect !== E && !inRect(E, far.path.at(-1))) : null;
  const words = farWords ?? (endRoom?.name?.includes(', ') ? endRoom.name.split(', ').at(-1) : null);
  const inner = area.openings.filter(o => o.id !== geo.door && o.kind === 'door' && o.rooms.some(r => geo.parts.includes(r))).map(o => o.id);
  const corners = [...geo.corners.map(c => ({ id: c.id, x: r2(c.x), z: r2(c.z) }))];
  return {
    room: geo.parts[0], parts: [...geo.parts], door: geo.door, threshold: geo.threshold.map(r2), entry: rules[0].entry,
    stack: geo.stack.map(p => p.map(r2)), points, corners, hot, sectors, dead,
    paths, ...(far ? { far: { path: route(far.path), hot: 'far', ...(words ? { words } : {}) } } : {}),
    inner, light: lit === 'cqbDim' ? 'dim' : 'day',
  };
}
