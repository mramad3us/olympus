// OLYMPUS places: portals, the ways from one area into the next (PLACES §1.9, §2.5; the build sheet 0.0.3 §2.1).
//
// A portal is an area's way out: { id (its opening's or its link's, CONTRACTS §10), kind, via, band:
// { axis, at, a, b, out }, to: { area, x, z, face } }. The band is the line crossed (axis 'x': a wall
// running east–west at z = at, from x = a to b; 'z' likewise in z) and `out` its outside ('n', 's',
// 'e', 'w'). It fires when the walker's centre is STEP_M 0.4 m or more past the band on its out side
// (PLACES §1.6, tradecraft's step: "the door to exit the embassy is finicky", 2026-10-28) and at most
// PORTAL_DEPTH_M 0.6 m further, within a..b: so one who comes round a flight's side onto it is on the
// stair, and one who stands farther off is not. Its arrival lies PORTAL_CLEAR_M 0.6 m or more inside
// the other area from that area's band back (validate.js holds it), so a walker never bounces.
//
// portalCrossed(state, actor): the live area's portal the actor has crossed, after the player's move
// (move.js calls it in layer 2). moveTo(state, actorId, to, bus, { portal, why }): the player's move
// across areas: 'area-leave' and then 'area-enter' ({ site, area, from, portal }), places.live set
// (the site entered if new), the actor placed at `to` with $px and $pz equal (no glide across the
// cut: the view's cut is main.js's), settled on the new grid, its old path dropped, an autosave asked
// ({ why: 'area' }, PLACES §2.5: "autosave on every area change") and a log record { kind: 'place',
// tone: 'note', text: '<area name>.' }. routeAcross(from, to): the legs a bot walks from a point in
// one area to a point in another, by Dijkstra over the portals (straight lengths inside each area,
// ties by the portals' ids), each leg { area, from, to, portal } ending at the portal's crossing point
// (the band's middle, STEP_M and half PORTAL_DEPTH_M past it) or, the last, at the goal.
import { STEP_M, PORTAL_DEPTH_M } from './plan.js';
import { areaOf, liveArea, enterSite } from './model.js';
import { navOf } from './nav.js';
import { AREA_LIST } from './areas.js';
import { settle, PLAYER_CLS } from './move.js';
import { askAutosave } from '../time/domain.js';
import { logEntry } from '../log.js';
import { cmpId, playerActor } from '../../core/ids.js';

/** A portal's arrival lies at least this inside the other area from its band back, metres (the sheet's §4). */
export const PORTAL_CLEAR_M = 0.6;

// (how far past a band a point lies on its out side, and whether it is within a..b)
export function pastBand(band, x, z) {
  const along = band.axis === 'x' ? x : z, across = band.axis === 'x' ? z : x;
  const past = band.out === 's' || band.out === 'e' ? across - band.at : band.at - across;
  return { past, within: along >= band.a && along <= band.b };
}
/** Whether a point is in a band's firing zone: within a..b, STEP_M to STEP_M + PORTAL_DEPTH_M past it. */
export function inZone(band, x, z) {
  const { past, within } = pastBand(band, x, z);
  return within && past >= STEP_M - 1e-9 && past <= STEP_M + PORTAL_DEPTH_M + 1e-9;
}
/** A band's crossing point: its middle, STEP_M and half PORTAL_DEPTH_M past it on the out side. */
export function crossingOf(band) {
  const mid = (band.a + band.b) / 2, d = STEP_M + PORTAL_DEPTH_M / 2, s = band.out === 's' || band.out === 'e' ? 1 : -1;
  return band.axis === 'x' ? [mid, band.at + s * d] : [band.at + s * d, mid];
}

/** The live area's portal an actor has crossed, or null. */
export function portalCrossed(state, actor) {
  const area = liveArea(state);
  if (!area || !actor) return null;
  for (const p of area.portals ?? []) if (inZone(p.band, actor.x, actor.z)) return p;
  return null;
}

/** The player's move across areas (see the header). Returns state.places.live. */
export function moveTo(state, actorId, to, bus, { portal = null, why = 'portal' } = {}) {
  const area = areaOf(to.area);
  if (!area) throw new Error(`places: no area '${to.area}' to move to`);
  const from = state.places?.live?.area ?? null, fromSite = state.places?.live?.site ?? null, pid = portal?.id ?? null;
  if (from) bus?.emit('area-leave', { site: fromSite, area: from, from, portal: pid });
  enterSite(state, area.site, area.id);
  const a = state.actors?.list?.find(x => x.id === actorId) ?? playerActor(state);
  if (a) {
    a.x = to.x; a.z = to.z; if (to.face) a.face = to.face;
    a.gait = 'idle'; delete a.path;
    settle(a, navOf(state, area.id, PLAYER_CLS, a.x, a.z));
    a.$px = a.x; a.$pz = a.z;
  }
  bus?.emit('area-enter', { site: area.site, area: area.id, from, portal: pid });
  if (bus) askAutosave(state, bus, 'area');
  logEntry(state, bus, { kind: 'place', tone: 'note', text: `${area.name}.`, why });
  return state.places.live;
}

const dist = (a, b) => Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
/**
 * The legs from { area, x, z } to { area, x, z } across portals: [{ area, from: [x, z], to: [x, z],
 * portal }] (the last leg's portal null), or null where no portals join them.
 */
export function routeAcross(from, to) {
  const portals = AREA_LIST.flatMap(a => (a.portals ?? []).map(p => ({ area: a.id, p, at: crossingOf(p.band) })));
  // (nodes: 'start', each portal by its area and id (reached at its crossing point, leaving at its arrival), 'goal')
  const key = (q) => `${q.area}|${q.p.id}`, best = new Map([['start', 0]]), prev = new Map(), done = new Set();
  const legsFrom = (area, pt) => [
    ...portals.filter(q => q.area === area).map(q => ({ k: key(q), q, d: dist(pt, q.at) })),
    ...(area === to.area ? [{ k: 'goal', q: null, d: dist(pt, [to.x, to.z]) }] : []),
  ];
  const at = (k) => (k === 'start' ? { area: from.area, pt: [from.x, from.z] } : (() => { const q = portals.find(x => key(x) === k); return { area: q.p.to.area, pt: [q.p.to.x, q.p.to.z] }; })());
  for (;;) {
    let u = null;
    for (const [k, v] of best) if (!done.has(k) && (u === null || v < best.get(u) || (v === best.get(u) && cmpId(k, u) < 0))) u = k;
    if (u === null) return null;
    if (u === 'goal') break;
    done.add(u);
    const { area, pt } = at(u);
    for (const e of legsFrom(area, pt)) {
      const nd = best.get(u) + e.d;
      if (!best.has(e.k) || nd < best.get(e.k)) { best.set(e.k, nd); prev.set(e.k, { u, q: e.q, area, from: pt }); }
    }
  }
  const legs = [];
  for (let k = 'goal'; k !== 'start';) {
    const s = prev.get(k);
    legs.push({ area: s.area, from: s.from, to: s.q ? s.q.at : [to.x, to.z], portal: s.q ? s.q.p : null });
    k = s.u;
  }
  return legs.reverse();
}
