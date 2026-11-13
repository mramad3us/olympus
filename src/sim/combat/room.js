// OLYMPUS combat: the room plans, read for the drill's beats and the shoot house's rules (COMBAT §25.7.3, §25.10.4; the build sheet 0.0.12 §2.1).
//
// A room's drill moves its men by a plan: where the stack stands, the threshold, each man's point and path, the
// corners and hot spots he must look at, his sector, the dead space. This round the plans are X4's, authored
// (src/data/places/x4-plans.js X4_PLANS, layout A of house 1 in the Wheel's sector 4); from 0.3 they are derived
// from PLACES's room polygons (COMBAT §25.7.3) and this module keeps its readers' shape.
//
// roomPlanOf(state, doorId) is the plan entered by a door (or 'hall', the lane's last leg), with what is derived
// from the place once: its id and layout, its area, the rects of its rooms (parts) and its plane, the door's line
// ({ axis, at, a, b } as the opening's: an 'x' line runs east–west at z = at, a 'z' line north–south at x = at;
// the hall's leg its gate) with `into`, the sign of the room's side of it (from the threshold). Plans are kept
// in state.$rooms by layout and door (runtime, never saved: rebuilt on a load from the frozen data), so a tick
// reads, never builds. lanePlanOf(state) is the session's lane: { lane, area, order, plans } (the layout is
// the house record's, state.armoury.range.house.lane, else A). roomOfDoor and doorOfRoom map a plan's door to
// its room and any of its rooms (room 3's far leg too) back to the plan's key.
//
// The geometry the scene's rules and the bundles read, each a closed form of the plan and a point:
//   inFunnel(plan, x, z)       within FUNNEL_M 0.5 of the door's plane and between its jambs widened by
//                              FUNNEL_SIDE_M 0.3 each side: "in the door" (the fault "Don't stop in the door!"
//                              after FUNNEL_FAULT_MS, the scene's); never for the hall's leg, which has no door. From
//                              2026-11-13 the funnel is the plan's no-stop zone (plan.funnel, src/sim/places/zones.js
//                              funnelZone: the one shape the movement code, the #2 and the scene all read)
//   pastThreshold(plan, x, z)  in one of the plan's rooms and more than THRESHOLD_M 0.3 past the plane: "in"
//   coveredNow(state, plan, actor, ms)  the hot spots the actor covers now: he is past the threshold, and each
//                              lies within SECTOR_HALF_DEG 20° of his head's yaw or his muzzle's (src/sim/arms/
//                              carry.js muzzleOf) with a clear line from his eye at his stance's layer (PEOPLE §7's
//                              sight grid: src/sim/people/perception.js clearLine), or within NEAR_M 0.6 of him
//                              with a clear line, whatever his yaw (he stands in the corner: my call)
//   coverageOf(state, plan)    the share of the plan's floor cells (the sight grid's 0.25 m) seen from its points
//                              with a clear line, the dead space's counted as cleared by the move past it: the
//                              test's 98% (COMBAT §25.13 combat-rooms); and each sector's share of the room
//   wallClearanceM(plan, x, z) the distance from a point to the nearest wall face of its area (src/sim/places/
//                              plan.js wallRect: an inner wall's 0.08 m half-thickness off its line)
//   pathLengthM(path)          a polyline's length, metres
// Pure but for the state's runtime cache and the sight grid it reads.
import { areaOf, openingOf } from '../places/model.js';
import { planOf, wallsOf, wallRect } from '../places/plan.js';
import { sightGridOf } from '../places/sight.js';
import { clearLine } from '../people/perception.js';
import { muzzleOf, angleDiff, faceRad } from '../arms/carry.js';
import { X4_PLANS } from '../../data/places/x4-plans.js';
import { FUNNEL_M, FUNNEL_SIDE_M, funnelZone, inZone } from '../places/zones.js';

/** In the door: within FUNNEL_M 0.5 of the door's plane, between its jambs widened by FUNNEL_SIDE_M 0.3 (src/sim/places/zones.js, the no-stop zones). */
export { FUNNEL_M, FUNNEL_SIDE_M };
/** In the room: past the door's plane by more than this, metres (COMBAT §25.7.3's threshold 0.3 m in). */
export const THRESHOLD_M = 0.3;
/** A hot spot is covered within this of a head's or a muzzle's yaw, degrees (the sheet's §2.1). */
export const SECTOR_HALF_DEG = 20;
/** A hot spot within this of a man is covered by his standing there, metres (my call). */
export const NEAR_M = 0.6;
/** The layout a session runs when its record names none. */
export const DEFAULT_LAYOUT = 'A';

const RAD = Math.PI / 180;
const LAYERS = Object.freeze({ stand: 'stand', kneel: 'crouch', crouch: 'crouch', prone: 'prone', lie: 'prone' });
const inRect = (r, x, z, e = 1e-9) => x >= r[0] - e && x <= r[2] + e && z >= r[1] - e && z <= r[3] + e;

/** The layout a session runs: the house record's lane, else A. */
export const layoutOf = (state) => state?.armoury?.range?.house?.lane ?? DEFAULT_LAYOUT;

// (a plan's data with what the place gives it: its rects and its plane, see the header)
function derive(layout, key, P) {
  const L = X4_PLANS[layout], area = areaOf(L.area);
  if (!area) throw new Error(`room: layout ${layout}'s area '${L.area}' is not a known area`);
  const rects = P.parts.map(id => {
    const r = area.rooms.find(x => x.id === id);
    if (!r) throw new Error(`room: plan ${key} names room '${id}', which ${L.area} lacks`);
    return [...r.rect];
  });
  const o = P.door ? openingOf(P.door) : null;
  if (P.door && !o) throw new Error(`room: plan ${key} names door '${P.door}', which is no opening`);
  const line = o ? { axis: o.axis, at: o.at, a: o.a, b: o.b } : P.gate;
  const t = line.axis === 'x' ? P.threshold[1] : P.threshold[0];
  const plane = Object.freeze({ ...line, into: t >= line.at ? 1 : -1 });
  const funnel = o ? funnelZone(`funnel:${o.id}`, o.id, line, plane.into) : null;
  return Object.freeze({ ...P, id: key, layout, area: L.area, rects: Object.freeze(rects.map(r => Object.freeze(r))), plane, funnel });
}

/** The plan entered by a door (or 'hall'), on the session's layout (see the header), or null. */
export function roomPlanOf(state, doorId, layout = layoutOf(state)) {
  const L = X4_PLANS[layout];
  if (!L || !L.plans[doorId]) return null;
  const C = state ? ((state.$rooms ??= {})[layout] ??= {}) : {};
  return (C[doorId] ??= derive(layout, doorId, L.plans[doorId]));
}

/** The session's lane: { lane, area, order, plans: { key: plan } } (see the header). */
export function lanePlanOf(state, layout = layoutOf(state)) {
  const L = X4_PLANS[layout];
  if (!L) throw new Error(`room: no layout '${layout}' (${Object.keys(X4_PLANS).join(', ')})`);
  return { lane: L.lane, area: L.area, order: [...L.order], plans: Object.fromEntries(L.order.map(k => [k, roomPlanOf(state, k, layout)])) };
}

/**
 * Whose sector a place is in, by where it is (the reach review of 2026-11-13: who owns a man was a label his stand carried, which
 * a man who moves would keep): the slot whose sector (from its point of domination, its yawRad, SECTOR_HALF_DEG either side) the
 * place's bearing is nearest the middle of, in half-widths; null for a plan without sectors.
 */
export function sectorOf(plan, x, z) {
  let best = null;
  for (const s of plan?.sectors ?? []) {
    const p = plan.points?.[s.slot - 1];
    if (!p) continue;
    const k = Math.abs(angleDiff(Math.atan2(z - p[1], x - p[0]), s.yawRad)) / (SECTOR_HALF_DEG * RAD);
    if (!best || k < best.k) best = { slot: s.slot, k };
  }
  return best?.slot ?? null;
}
/** The room of the lane a place is in, by the plans' rects (the hall's leg's too), or null outside them all (see sectorOf: the room by where a man is, never his stand's label). */
export function roomAt(state, x, z) {
  const L = lanePlanOf(state);
  for (const k of L.order) { const P = L.plans[k]; if ((P.rects ?? []).some(r => inRect(r, x, z))) return P.room; }
  return null;
}

/** A man's room and sector by where he stands now (roomAt, sectorOf), his stand's labels where the plans have no word: { room, slot }. */
export function manPlace(state, T) {
  let room = null, slot = null;
  try {
    room = roomAt(state, T.x, T.z);
    const L = room ? lanePlanOf(state) : null, P = L ? Object.values(L.plans).find(p => p.room === room) : null;
    slot = P ? sectorOf(P, T.x, T.z) : null;
  } catch { room = null; slot = null; }
  return { room: room ?? T.room ?? null, slot: slot ?? T.slot ?? 1 };
}

/** A plan's room by its door ('hall' for the hall's leg), on any layout; null when no plan has it. */
export function roomOfDoor(doorId) {
  for (const L of Object.values(X4_PLANS)) if (L.plans[doorId]) return L.plans[doorId].room;
  return null;
}
/** The plan's key (its door's id, or 'hall') of a room or any of its parts; null when no plan holds it. */
export function doorOfRoom(roomId) {
  for (const L of Object.values(X4_PLANS)) for (const k of L.order) if (L.plans[k].parts.includes(roomId)) return k;
  return null;
}

// (a point's distance past the plan's plane, + into the room)
const across = (plan, x, z) => plan.plane.into * ((plan.plane.axis === 'x' ? z : x) - plan.plane.at);

/** In the door (see the header): within FUNNEL_M of the door's plane, between its jambs widened by FUNNEL_SIDE_M. Never on the hall's leg. */
export function inFunnel(plan, x, z) {
  return !!plan?.door && !!plan.funnel && inZone(plan.funnel, x, z);
}

/** In the room (see the header): in one of the plan's rooms and more than THRESHOLD_M past its plane. */
export function pastThreshold(plan, x, z) {
  if (!plan) return false;
  return across(plan, x, z) > THRESHOLD_M && plan.rects.some(r => inRect(r, x, z));
}

/** The hot spots of a plan the actor covers now (see the header): [hotId], in the plan's order. */
export function coveredNow(state, plan, actor, ms = state?.clock?.ms ?? 0) {
  if (!plan || !actor || !pastThreshold(plan, actor.x, actor.z)) return [];
  const grid = sightGridOf(state, plan.area), layer = LAYERS[actor.stance ?? 'stand'] ?? 'stand';
  const yaws = [actor.headRad ?? faceRad(actor.face)], m = actor.who ? muzzleOf(state, actor.who, actor) : null;
  if (m && Number.isFinite(m.yawRad)) yaws.push(m.yawRad);
  const half = SECTOR_HALF_DEG * RAD, out = [];
  for (const h of plan.hot) {
    const dx = h.x - actor.x, dz = h.z - actor.z, near = Math.hypot(dx, dz) <= NEAR_M, b = Math.atan2(dz, dx);
    if (!near && !yaws.some(y => Math.abs(angleDiff(b, y)) <= half)) continue;
    if (clearLine(grid, actor.x, actor.z, h.x, h.z, layer)) out.push(h.id);
  }
  return out;
}

/** A polyline's length, metres. */
export function pathLengthM(path) {
  let n = 0;
  for (let i = 1; i < (path?.length ?? 0); i++) n += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
  return n;
}

/** The distance from a point to the nearest wall face of a plan's area, metres (see the header). */
export function wallClearanceM(plan, x, z) {
  let best = Infinity;
  for (const w of wallsOf(planOf(areaOf(plan.area)))) {
    const r = wallRect(w), dx = Math.max(r.x0 - x, 0, x - r.x1), dz = Math.max(r.z0 - z, 0, z - r.z1);
    best = Math.min(best, Math.hypot(dx, dz));
  }
  return best;
}

/**
 * What a plan's points see of its floor (see the header): { cells, seen (from a point, a clear line), dead (seen from
 * neither, inside a dead circle), share ((seen + dead) / cells), byPoint: [n], bySector: [{ slot, n, share }] }, on
 * the sight grid's cells whose centres lie in the plan's rooms (past its plane, for the hall's leg).
 */
export function coverageOf(state, plan) {
  const grid = sightGridOf(state, plan.area), C = grid.cellM, half = SECTOR_HALF_DEG * RAD;
  let cells = 0, seen = 0, dead = 0;
  const byPoint = plan.points.map(() => 0), bySector = plan.sectors.map(s => ({ slot: s.slot, n: 0, share: 0 }));
  const done = new Set();
  for (const r of plan.rects) {
    for (let j = Math.floor((r[1] - grid.z0) / C); j * C + grid.z0 < r[3]; j++) for (let i = Math.floor((r[0] - grid.x0) / C); i * C + grid.x0 < r[2]; i++) {
      const x = grid.x0 + (i + 0.5) * C, z = grid.z0 + (j + 0.5) * C, key = j * grid.nx + i;
      if (done.has(key) || !inRect(r, x, z, 0) || across(plan, x, z) <= 0) continue;
      done.add(key);
      if ((grid.bits[key] & 4) !== 0) continue;                       // (a wall's own cell is not floor)
      cells++;
      let any = false;
      plan.points.forEach(([px, pz], k) => {
        if (!clearLine(grid, px, pz, x, z, 'stand')) return;
        any = true; byPoint[k]++;
        const s = plan.sectors.findIndex(q => q.slot === k + 1);
        if (s >= 0 && Math.abs(angleDiff(Math.atan2(z - pz, x - px), plan.sectors[s].yawRad)) <= half) bySector[s].n++;
      });
      if (any) seen++;
      else if (plan.dead.some(([dx, dz, rM]) => Math.hypot(x - dx, z - dz) <= rM)) dead++;
    }
  }
  for (const s of bySector) s.share = cells ? s.n / cells : 0;
  return { cells, seen, dead, share: cells ? (seen + dead) / cells : 0, byPoint, bySector };
}
