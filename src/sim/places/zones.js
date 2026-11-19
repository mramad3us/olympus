// OLYMPUS places: the no-stop zones, where no move the game makes for a body may end (the user, 2026-11-13: "soldiers clearing rooms know not to stop in a doorway ... soldiers need to stay fluidly moving ... a real need for a robust system").
//
// A no-stop zone is a piece of floor a body may cross but never come to rest on unless it chooses to: a door's funnel
// today (the fatal funnel, COMBAT §25.5.2), a hatch, a stairhead or a corridor's crossing when the places that have them
// declare them. The zones are data, read from the place plans, so a generated scene gets them the way the shoot house
// does: every room plan entered by a door (src/data/places/x4-plans.js X4_PLANS, the plans src/sim/combat/room.js reads)
// declares that door's funnel, every other leafed door of the area gets one from its own line (the reach review of
// 2026-11-13), and a layout may declare more in its own `noStop` list. Two shapes:
//   funnel  { id, kind: 'funnel', door, axis, at, a, b, into, depthM, sideM }: the door's line as the opening's ({ axis,
//           at, a, b }: an 'x' line runs east to west at z = at, a 'z' line north to south at x = at), `into` the sign of
//           the room's side; the zone is within depthM (FUNNEL_M 0.5) of the line and between the jambs widened by sideM
//           (FUNNEL_SIDE_M 0.3) each side (the build sheet 0.0.12 §2.1, §4: the scene's "in the door")
//   rect    { id, kind: 'rect', rect: [x0, z0, x1, z1] }: a hatch's or a stairhead's floor, as a layout declares it
//   arc     { id, kind: 'arc', door, hinge, rM, widthM, u, n }: a hinged leaf's quarter disc (src/sim/places/swing.js arcOf,
//           from the opening's own swing), a no-stop zone only while its leaf moves, and then only the part it has still to
//           sweep (swing.js inSweep: from the leaf's open fraction now to where it is going): 2026-11-15, the user's "doors
//           should have a direction they open (pull or push)"; a pull door's arc lies on the stack's side, so nobody waits in
//           it while it swings toward them
// The zones are a pure function of the frozen data, kept by area once (no state, nothing saved).
// What a zone is (its build sheet item 13; house lens G2; PLACES §1.6): each carries a `why` of ZONE_WHYS, beside its shape
// (ZONE_KINDS stay the three shapes): 'door' a leafed door's funnel (every funnel before v0.0.22), 'doorway' a leafless opening a layout
// declares a funnel (a gap no wider than FUNNEL_GAP_MAX_M 1.5 m, which a body fills: the twin room's 1.2 m inner doorway; the ell's
// 2.6 m leg stays floor), 'leaf' a leaf's arc, and 'hatch', 'stairhead' and 'crossing' the rects a place declares (none in X4). A
// layout's `noStop` list declares them: { kind: 'funnel', opening, why: 'doorway', into } or { kind: 'rect', id, rect, why }.
//
// The readers: inZone(zone, x, z); zonesOf(areaId), every funnel and rect of an area (the plan's: the arcs are not, since they
// live only while a leaf moves); arcsOf(areaId), its leaves' arcs; zoneAt(areaId, x, z), the first funnel or rect holding a point;
// liveZoneAt(state, areaId, x, z), the same among the zones live now (a funnel while its door stands open, an arc's sweep still
// to come while its leaf moves); arcLiveAt(state, Z, x, z), that test for one arc;
// exitOf(zone, from, dir), the nearest place clear of a zone the way a body is going (across a funnel to the side it heads
// for, or the side it stands on when it barely moves; out of a rect along its heading), EXIT_M past the zone's edge.
// The movement code (src/sim/places/move.js throughOf) carries a body the brake would bring to rest inside a zone through
// to the next point past it, and the stepper's moves, the #2's walk and the contact's window read the same zones.
//
// A scene names the ways a body must not come to rest across (useKeepClear: the shoot house's, your #2's way in while he is
// not yet in, 2026-11-15), and the carry ends clear of them where a way out allows. A scene names the path a body is on (useLanes: the shoot house's slot path through the current door), so the carry
// follows the man's own lane to his point of domination rather than the bare way out; and the steps that stand still by
// the player's own choice (standsStill: Stop here, Hold him, Challenge, Gun down, Off the line, a knee) are the only ones
// that may leave a body at rest in a zone, and so the only way to earn the funnel's fault.
import { plansOfArea } from '../scenes/assemble.js';
import { openingOf, openingState, openingDelta, areaOf } from './model.js';
import { arcOf, angleIn, inSweep } from './swing.js';

/** In the door: within this of the door's plane, metres (the build sheet 0.0.12 §4). */
export const FUNNEL_M = 0.5;
/** The door's jambs widened by this each side for the funnel, metres (the sheet's §2.1). */
export const FUNNEL_SIDE_M = 0.3;
/** A carry ends this far past a zone's edge, metres (my call: a body's centre clear of the line, not on it). */
export const EXIT_M = 0.1;
/** The kinds of zone (their shapes). */
export const ZONE_KINDS = Object.freeze(['funnel', 'rect', 'arc']);
/** What a zone is (see the header): its `why`. */
export const ZONE_WHYS = Object.freeze(['door', 'doorway', 'leaf', 'hatch', 'stairhead', 'crossing']);
/** A leafless gap this wide or narrower declared a funnel is one (a body fills it); wider, it is floor, metres (my call: the ell's 2.6 m leg). */
export const FUNNEL_GAP_MAX_M = 1.5;
/** The leaf kinds that swing on hinges, and so have an arc (PLACES §1.6: the sliding and the dogged kinds do not). */
export const HINGED_KINDS = Object.freeze(['door', 'extDoor', 'fireDoor', 'blastDoor']);

const inRect = (r, x, z) => x >= r[0] && x <= r[2] && z >= r[1] && z <= r[3];

/** A door's funnel (see the header): its line { axis, at, a, b }, the room's side `into` (+1 or -1); why 'door', or 'doorway' for a declared leafless one. */
export function funnelZone(id, door, line, into, why = 'door') {
  return Object.freeze({ id, kind: 'funnel', door, axis: line.axis, at: line.at, a: line.a, b: line.b, into: into >= 0 ? 1 : -1, depthM: FUNNEL_M, sideM: FUNNEL_SIDE_M, why });
}
// (a point's distance across a funnel's line, + on the room's side, and its place along the line)
const acrossOf = (Z, x, z) => Z.into * ((Z.axis === 'x' ? z : x) - Z.at);
const alongOf = (Z, x, z) => (Z.axis === 'x' ? x : z);

/** Whether a point lies in a zone (see the header). */
export function inZone(Z, x, z) {
  if (!Z) return false;
  if (Z.kind === 'rect') return inRect(Z.rect, x, z);
  if (Z.kind === 'arc') return inSweep(Z, x, z, 0, 1);
  const d = acrossOf(Z, x, z), u = alongOf(Z, x, z);
  return Math.abs(d) <= Z.depthM && u >= Z.a - Z.sideM && u <= Z.b + Z.sideM;
}

// (an area's zones, built once from the frozen plans: each door plan's funnel (deduplicated by door), then each layout's own list)
const byArea = new Map(), arcsBy = new Map();
/** Forget the memo (TECH §2.3). */
export function resetCaches() { byArea.clear(); arcsBy.clear(); }
/** Every hinged leaf's arc of an area (see the header), frozen; [] for an area with none. */
export function arcsOf(areaId) {
  if (!areaId) return [];
  let out = arcsBy.get(areaId);
  if (out) return out;
  const area = areaOf(areaId), rects = Object.fromEntries((area?.rooms ?? []).map(r => [r.id, r.rect]));
  out = Object.freeze((area?.openings ?? []).filter(o => HINGED_KINDS.includes(o.kind) && (o.leaf ?? 'hinged') === 'hinged' && Number.isFinite(o.at))
    .map(o => { const A = arcOf(o, rects); return A ? Object.freeze({ id: `arc:${o.id}`, kind: 'arc', ...A, why: 'leaf' }) : null; }).filter(Boolean));
  arcsBy.set(areaId, out);
  return out;
}
/**
 * Whether a point lies in an arc's sweep still to come now (see the header): its leaf moving (its saved delta's atMs after the
 * clock), the point within the arc and between the leaf's open fraction now and the one it is going to (1 opening, 0 closing).
 */
export function arcLiveAt(state, Z, x, z, ms = state?.clock?.ms ?? 0) {
  if (!Z || Z.kind !== 'arc') return false;
  const { dM } = angleIn(Z, x, z);
  if (dM > Z.rM) return false;
  const d = openingDelta(state, Z.door);
  if (!d || d.atMs === undefined || d.atMs <= ms) return false;
  const o = openingOf(Z.door), opening = d.state === 'open', durMs = ((opening ? o?.openS : o?.closeS) ?? 0.4) * 1000, left = Math.max(0, Math.min(1, (d.atMs - ms) / durMs));
  const now = opening ? 1 - left : left;
  return inSweep(Z, x, z, now, opening ? 1 : 0);
}
/** Every no-stop zone of an area (see the header), frozen; [] for an area with none. */
export function zonesOf(areaId) {
  if (!areaId) return [];
  let out = byArea.get(areaId);
  if (out) return out;
  const list = [], doors = new Set();
  for (const L of plansOfArea(areaId)) {   // (the area's layouts, scenes/assemble.js, set or drawn)
    if (L.area !== areaId) continue;
    for (const k of L.order) {
      const P = L.plans[k], o = P?.door ? openingOf(P.door) : null;
      if (!o || doors.has(o.id)) continue;
      doors.add(o.id);
      const t = o.axis === 'x' ? P.threshold[1] : P.threshold[0];
      list.push(funnelZone(`funnel:${o.id}`, o.id, o, t >= o.at ? 1 : -1));
    }
    for (const Z of L.noStop ?? []) {
      if (Z.kind === 'rect') list.push(Object.freeze({ id: Z.id, kind: 'rect', rect: Object.freeze([...Z.rect]), why: Z.why ?? 'hatch' }));
      // (a leafless opening declared a funnel (the twin room's inner doorway), within FUNNEL_GAP_MAX_M; a wider gap is floor)
      const o = Z.kind === 'funnel' ? openingOf(Z.opening) : null;
      if (o && !doors.has(o.id) && Math.abs(o.b - o.a) <= FUNNEL_GAP_MAX_M + 1e-9) { doors.add(o.id); list.push(funnelZone(`funnel:${o.id}`, o.id, o, Z.into ?? 1, Z.why ?? 'doorway')); }
    }
  }
  // (every other door of the area, a leaf in a frame, a funnel from its own line: room 2's closet, the booth (the reach review
  // of 2026-11-13: only the doors with a plan had one); its room's side +1 where no plan says (inZone is the same both sides;
  // exitOf reads the heading). An open doorway with no leaf (a room's inner leg, the aprons) is a room's own floor, not a door)
  for (const o of areaOf(areaId)?.openings ?? []) {
    if (o.kind !== 'door' || doors.has(o.id) || !Number.isFinite(o.at)) continue;
    doors.add(o.id);
    list.push(funnelZone(`funnel:${o.id}`, o.id, o, 1));
  }
  out = Object.freeze(list);
  byArea.set(areaId, out);
  return out;
}
/** The first zone of an area holding a point, or null. */
export function zoneAt(areaId, x, z) {
  for (const Z of zonesOf(areaId)) if (inZone(Z, x, z)) return Z;
  return null;
}
/**
 * The first zone of an area holding a point that is live now (see the header): a door's funnel only while its door stands open
 * (a closed door is no doorway to stand in, and no carry may go through its leaf), a rect always. The movement code, the #2 and
 * the gauges read this one; zoneAt is the plan's, whatever the doors.
 */
export function liveZoneAt(state, areaId, x, z) {
  for (const Z of zonesOf(areaId)) if (inZone(Z, x, z) && (Z.kind !== 'funnel' || openingState(state, Z.door) === 'open')) return Z;
  for (const Z of arcsOf(areaId)) if (arcLiveAt(state, Z, x, z)) return Z;
  return null;
}
/** A zone of an area by its id, or null. */
export const zoneById = (areaId, id) => zonesOf(areaId).find(Z => Z.id === id) ?? null;

/**
 * The nearest place clear of a zone the way a body goes (see the header): from [x, z], dir a unit heading or null. A funnel
 * is crossed square to its line, to the side the heading points at (a heading within about 11 degrees of the line's own
 * keeps the side the body stands on, into the room on the line), EXIT_M past its depth; a rect is left along the heading
 * (or by its nearest edge), EXIT_M past it. Returns [x, z].
 */
export function exitOf(Z, from, dir = null, side = null) {
  const [x, z] = from;
  if (Z.kind === 'arc') {
    // (out of the quarter along the heading, sampled every 5 cm up to 3 m; else straight away from the hinge, EXIT_M past its reach)
    const ux = dir?.[0] ?? 0, uz = dir?.[1] ?? 0;
    if (Math.abs(ux) + Math.abs(uz) > 1e-6) for (let t = 0.05; t <= 3; t += 0.05) { const px = x + ux * t, pz = z + uz * t; if (!inZone(Z, px, pz)) return [px + ux * EXIT_M, pz + uz * EXIT_M]; }
    const dx = x - Z.hinge[0], dz = z - Z.hinge[1], L = Math.hypot(dx, dz) || 1, R = Z.rM + EXIT_M;
    return [Z.hinge[0] + (dx / L) * R, Z.hinge[1] + (dz / L) * R];
  }
  if (Z.kind === 'rect') {
    const [x0, z0, x1, z1] = Z.rect, ux = dir?.[0] ?? 0, uz = dir?.[1] ?? 0;
    if (Math.abs(ux) + Math.abs(uz) > 1e-6) {
      const tx = ux > 0 ? (x1 - x) / ux : ux < 0 ? (x0 - x) / ux : Infinity, tz = uz > 0 ? (z1 - z) / uz : uz < 0 ? (z0 - z) / uz : Infinity, t = Math.max(0, Math.min(tx, tz)) + EXIT_M;
      return [x + ux * t, z + uz * t];
    }
    const opts = [[x0 - EXIT_M, z, x - x0], [x1 + EXIT_M, z, x1 - x], [x, z0 - EXIT_M, z - z0], [x, z1 + EXIT_M, z1 - z]].sort((p, q) => p[2] - q[2]);
    return [opts[0][0], opts[0][1]];
  }
  const d = acrossOf(Z, x, z), n = Z.axis === 'x' ? [0, Z.into] : [Z.into, 0];
  const dn = dir ? dir[0] * n[0] + dir[1] * n[1] : 0;
  const s = side ?? (Math.abs(dn) > 0.2 ? Math.sign(dn) : d >= 0 ? 1 : -1);
  const to = s * (Z.depthM + EXIT_M) - d;
  return [x + n[0] * to, z + n[1] * to];
}

// ---- the scene's hooks (see the header) ----

// (kept on the hoisted functions, as move.js useBodies keeps its: the scenes that set them are imported while this module loads)
/** A scene names the path a body is on: fn(state, pid) → [[x, z], …] or null (the shoot house's slot path through the current door). */
export function useLanes(fn) { useLanes.fn = typeof fn === 'function' ? fn : null; }
/** The path a body is on, by the scene's rule (useLanes), or null. */
export function laneOf(state, pid) { return useLanes.fn ? useLanes.fn(state, pid) ?? null : null; }
/**
 * A scene names the ways a body must not come to rest across: fn(state, pid) → [{ path: [[x, z], …], gapM }] (the shoot house's:
 * your number two's way in through the current door, while he is not yet in; 2026-11-15, the user: "squad AI sometimes stays out
 * of the room on entry (room 2)"). The carry through a doorway ends clear of them where it can (move.js throughOf).
 */
export function useKeepClear(fn) { useKeepClear.fn = typeof fn === 'function' ? fn : null; }
/** The ways a body must not come to rest across, by the scene's rule (useKeepClear): [] with none. */
export function keepClearOf(state, pid) { return (useKeepClear.fn ? useKeepClear.fn(state, pid) : null) ?? []; }
/** Whether a place stands clear of every way of keepClearOf (each by its gap): the least distance to each polyline. */
export function restClear(ways, x, z) {
  for (const w of ways) {
    const P = w.path ?? [];
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[i + 1] ?? a, vx = b[0] - a[0], vz = b[1] - a[1], l2 = vx * vx + vz * vz, t = l2 ? Math.max(0, Math.min(1, ((x - a[0]) * vx + (z - a[1]) * vz) / l2)) : 0;
      if (Math.hypot(a[0] + vx * t - x, a[1] + vz * t - z) < w.gapM) return false;
    }
  }
  return true;
}

/** The steps that stand still by the player's own choice (see the header): a shot's "stop here", Hold him, Challenge, Gun down, Off the line, a stance down. */
export const STANDS_STILL = /@stop$|^contact:(hold|challenge)$|^weapon:(gun-down|offline)$|^stance:(kneel|prone|crouch)$/;
/** Whether a step's id is one that stands still by choice (STANDS_STILL). */
export const standsStill = (stepId) => STANDS_STILL.test(String(stepId ?? ''));
