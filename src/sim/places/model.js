// OLYMPUS places: the data model's registry, and the state's places record (PLACES §1.2, §1.3, §1.10).
//
// The world is a set of sites; a site is made of areas; one area is live at a time (PLACES's summary).
// Sites and areas are authored once, as frozen data (the site registry, src/data/places/sites.js; the
// test rooms, Base Melas's tables in src/data/places, Echo's floors and the ground built from them at load: src/sim/places/areas.js),
// and found here by id: siteOf('melas'), areaOf('melas.echo.1'). A template carries a version and a
// site instance pins template@version (TECH §2.4, PLACES §9.1), so a changed template is a new version.
//
// The save holds only what changed (PLACES §1.10): state.places is
//   { live: { site, area, env? } | null,         where the player is, and a scene's environment (env.js)
//     nav: { queue, pending, debtNodes },        path requests in flight (nav.js; saved for determinism)
//     sites: { <siteId>: { template,             each site that has been entered: its template,
//              openings: { <openingId>: { state, atMs } } } } }   and the openings whose state differs
// and nothing else this round. No seed: the world is handcrafted (the user, 2026-11-05), so a site's
// record holds nothing to roll; v0.0.2's `seed` (hash('site', id, the world's seed), read by nothing)
// is gone, and the places domain's upgrade 'places:no-site-seed' drops it from older saves (the
// sheet's §8 item 2). An opening's delta is { state, atMs }: atMs is when its leaf finishes moving (a
// door opens over its openS, doors.js); the delta is dropped once it matches the template and has
// finished (doors.js's step, and setOpening when it lands at once), so a save stays small. A leaf
// blocks while it is closed or still opening (leafClosed: 'open' with atMs after the clock), and
// setOpening re-marks the nav and sight cells round it on every cached grid (nav.js remarkLeaf,
// sight.js), the ground's included where its reveal names the opening (Echo's outside doors: one
// leaf, read on both sides).
//
// lonOf(state) is the live site's east longitude, read from SETTING's one site record
// (src/data/setting/calendar.js SITES, through the site's geo), which the readers still written in
// Mars longitudes take (the body clock, the activities, the night's calls; the clocks, the light and
// the jobs read env.js localTime, the site's own clock). Before any site is entered it is the start
// site's, where every career starts (SETTING §3.7). It throws for an unknown site and for a site that
// is not on Mars's clock (TECH §1.4: no quiet Melas; ROADMAP "anywhere"'s step 3); siteLonOf(site) is that
// rule's one home, which env.js lonOfSite reads too. placeLine(state) is the HUD's place line (the
// live area's building, its floor in a building of floors (the area's floorName: 'upper floor'), and
// the room or ground zone the player stands in), roomOf(area, x, z) the room
// at a point, surfaceAt(state, x, z) what the feet are on, cell by cell (the audio's footsteps, BODY's footing and
// grip, the soiling; step 5), groundSurfaceOf(area) a ground's own surface under its paths.
// v0.0.24's step 5 (AW§4.1 item 2; PLACES §5.7): an area's holds are a rule, never fixtures: `holds: { gridM, padEyeM,
// faces }`, a hold (a rung) on every face (a wall run's or a blocking fixture's edge, as the nav grid's blockers have them)
// every gridM along it, and a pad-eye in the deck every padEyeM both ways, each lattice offset half a gridM from the area's
// origin (samples/void-look's H-a draws the same rule). holdNear(state, x, z, reachM, { kind }) is the nearest of them
// within reach by arithmetic on the lattice and the blockers (729 holds cost nothing a tick), or, in an area with no rule,
// the surface's own grip under the body (PLACES §2.7: a grating's 'handholds' a hold, a 'loops' strip a pad-eye, at the
// body's point); passageAt(state, x, z) the narrower free width across the body's place along x or z between the
// blockers and the closed leaves (the wedge's measure, footing.js). Both read the live area's C0 grid (nav.js navOf).
import { SITE_LIST } from '../../data/places/sites.js';
import { SITES, START } from '../../data/setting/calendar.js';
import { BODIES, SURFACES } from '../../data/places/env.js';
import { put, playerActor } from '../../core/ids.js';
import { AREA_LIST } from './areas.js';
import { remarkLeaf, navOf } from './nav.js';
import { remarkSight } from './sight.js';
import { footprintOf } from './fixtures.js';

const byId = (list) => Object.freeze(Object.fromEntries(list.map(r => [r.id, r])));
/** Every site the game knows, by id. */
export const SITE_RECORDS = byId(SITE_LIST);
/** Every area with a record, by id. */
export const AREA_RECORDS = byId(AREA_LIST);
// (an opening's area, for the openings' deltas: opening ids are unique across the areas)
const OPENING_AREA = Object.freeze(Object.fromEntries(AREA_LIST.flatMap(a => (a.openings ?? []).map(o => [o.id, a.id]))));
const OPENING_REC = Object.freeze(Object.fromEntries(AREA_LIST.flatMap(a => (a.openings ?? []).map(o => [o.id, o]))));

// ---- the generated areas' registry (PLACES §9.9; the build sheet v0.0.21 §1 item 1, §0 items 49 and 53) ----
// A generated area (a shoot house drawn from the seed: src/sim/scenes/assemble.js, which registers into this registry, so
// nothing here imports it) is an area record like any other, made at runtime from authored chunks, its id the base's with
// GEN_MARK and a variant ('melas.wheel.s4~00a1b2c3d4e5f'), every id in it carrying the same mark ('w4~00a1b2c3d4e5f.r1', 'o:w4~00a1b2c3d4e5f:r1'),
// so an opening id stays unique across the areas and every cache keyed by an area or an opening is right for nothing. areaOf,
// openingOf and openingArea read the static records first and, for an id with the mark, the registry: an id it does not hold
// is null, never a throw. The registry is runtime only (a save holds places.live.gen, from which the places domain's upgrade
// 'places:gen' rebuilds it on load: src/sim/places/domain.js); resetCaches() empties it (TECH §2.3), dropArea(id) forgets one
// area (the assembler keeps HOUSE_REG_KEEP of them, and brings an evicted one back on a read: useGenerated).
/** The mark of a generated id: the base's id, the mark, the variant. */
export const GEN_MARK = '~';
const GEN = new Map(), GEN_OPENING = new Map();
const isGen = (id) => typeof id === 'string' && id.includes(GEN_MARK);
/** Register a generated area (see above): the area and its openings found by id from now on; returns the area. */
export function registerArea(area) {
  if (!area || !isGen(area.id)) throw new Error(`places: only a generated area (an id with '${GEN_MARK}') is registered, not '${area?.id}'`);
  const old = GEN.get(area.id);
  if (old && old !== area) dropArea(area.id);
  GEN.set(area.id, area);
  for (const o of area.openings ?? []) GEN_OPENING.set(o.id, { area, o });
  return area;
}
/** Forget a generated area and its openings (see above): whether it was held. */
export function dropArea(areaId) {
  const a = GEN.get(areaId);
  if (!a) return false;
  for (const o of a.openings ?? []) if (GEN_OPENING.get(o.id)?.area === a) GEN_OPENING.delete(o.id);
  GEN.delete(areaId);
  return true;
}
// (the maker of a generated area the registry does not hold: the assembler's, which brings back a layout it assembled earlier in
// the session and evicted since (an area id or any id inside it); null for one it never made)
let RESOLVE = null;
/** Name the maker of generated areas (see above): fn(id) → area | null. The assembler sets it at its load. */
export function useGenerated(fn) { RESOLVE = typeof fn === 'function' ? fn : null; }
const genArea = (id) => GEN.get(id) ?? (RESOLVE ? RESOLVE(id) ?? null : null);
const genOpening = (id) => GEN_OPENING.get(id) ?? (RESOLVE && RESOLVE(id) ? GEN_OPENING.get(id) ?? null : null);
/** The generated areas held now, by id (the tests' and the assembler's eviction). */
export const generatedIds = () => [...GEN.keys()];
/** Forget every generated area (TECH §2.3: every module with a cache exports this). */
export function resetCaches() { GEN.clear(); GEN_OPENING.clear(); }

/** A site's frozen record, or null. */
export const siteOf = (siteId) => SITE_RECORDS[siteId] ?? null;
/** An area's frozen record (a generated one's from the registry), or null. */
export const areaOf = (areaId) => AREA_RECORDS[areaId] ?? (isGen(areaId) ? genArea(areaId) : null);
/** The live area's record, or null. */
export const liveArea = (state) => areaOf(state.places?.live?.area);
/** The live site's record, or null. */
export const liveSite = (state) => siteOf(state.places?.live?.site);
/** An opening's record (any area's, a generated one's from the registry) by its id, or null. */
export const openingOf = (id) => OPENING_REC[id] ?? (isGen(id) ? genOpening(id)?.o ?? null : null);
/** The area an opening belongs to (a generated one's from the registry), or null. */
export const openingArea = (id) => (OPENING_AREA[id] ? areaOf(OPENING_AREA[id]) : isGen(id) ? genOpening(id)?.area ?? null : null);

/** A site record's east longitude in degrees (SETTING's geo record): the rule's one home (env.js lonOfSite reads it). Throws for a site that is not on Mars's clock (see the header). */
export function siteLonOf(site) {
  if (site.body !== 'mars' || site.clock !== 'mars-local') throw new Error(`places: site '${site.id}' is not on Mars's clock (body ${site.body}, clock ${site.clock}): it has no longitude`);
  const geo = SITES[site.geo];
  if (!geo) throw new Error(`places: site '${site.id}' names no known geo ('${site.geo}')`);
  return geo.lonEDeg;
}
/** The live site's east longitude in degrees (siteLonOf); the start site's before any is entered. Throws for an unknown site and off Mars (see the header). */
export function lonOf(state) {
  const id = state?.places?.live?.site ?? START.site, site = siteOf(id);
  if (!site) throw new Error(`places: no site '${id}'`);
  return siteLonOf(site);
}

/** The places domain's fill (??=): the record's empty shape, kept where it is already set. */
export function initPlaces(state) {
  const P = (state.places ??= {});
  if (P.live === undefined) P.live = null;
  P.sites ??= {};
  const nav = (P.nav ??= {});
  nav.queue ??= []; nav.pending ??= []; nav.debtNodes ??= 0;
  return P;
}

// (a site's saved record, made once: its template, no seed)
const siteRec = (state, siteId) => { const P = initPlaces(state); return P.sites[siteId] ?? put(state, P.sites, siteId, { template: siteOf(siteId).template }); };

/** Make a site and area live: places.live = { site, area } (and a scene's env, kept within its site), the site's record made once (its template). */
export function enterSite(state, siteId, areaId) {
  const site = siteOf(siteId);
  if (!site) throw new Error(`places: no site '${siteId}'`);
  // (a generated area is its base's, so the site holds it where it holds the base and the registry has it)
  if (areaId && !site.areas.includes(areaId) && !(isGen(areaId) && site.areas.includes(areaId.split(GEN_MARK)[0]) && genArea(areaId))) throw new Error(`places: site '${siteId}' has no area '${areaId}'`);
  const P = initPlaces(state);
  siteRec(state, siteId);
  // (a scene's environment, live.env (src/sim/places/env.js), goes with it from area to area of its site, and stays behind at another site)
  const env = P.live?.site === siteId ? P.live.env : undefined;
  P.live = env ? { site: siteId, area: areaId ?? site.areas[0], env } : { site: siteId, area: areaId ?? site.areas[0] };
  return P.live;
}

/** An opening's saved delta { state, atMs }, or null (the template holds). */
export function openingDelta(state, openingId) {
  const area = openingArea(openingId);
  return area ? state.places?.sites?.[area.site]?.openings?.[openingId] ?? null : null;
}

/** An opening's state: the saved delta, else the template's ('open' for anything without a leaf). */
export function openingState(state, opening) {
  const o = typeof opening === 'string' ? openingOf(opening) : opening;
  if (!o) return null;
  return openingDelta(state, o.id)?.state ?? o.state ?? 'open';
}

/** Whether an opening's leaf blocks at game time ms: closed, or opening and not yet open (its delta's atMs ahead). */
export function leafClosed(state, opening, ms = state?.clock?.ms ?? 0) {
  const o = typeof opening === 'string' ? openingOf(opening) : opening;
  if (!o) return false;
  const d = openingDelta(state, o.id), s = d?.state ?? o.state ?? 'open';
  return s === 'closed' || (d?.atMs !== undefined && d.atMs > ms);
}

/**
 * Open or close an opening ('open' | 'closed'), its leaf finishing at atMs (now by default): the saved
 * delta { state, atMs } (dropped when it matches the template and has finished), and the nav and
 * sight cells round its leaf re-marked on every cached grid. Returns the nav cells changed.
 * v0.0.20 (the build sheet's item 15): `how` ('push' | 'pull' | 'kick'), the verb that opened it, kept on the delta beside state
 * and atMs, so the stage draws the leaf as it was opened (doors.js leafShownAt); absent, the linear swing as built.
 * v0.0.21 (the hand-off, D): `broken` (ms), a lock broken off the range's lane, written by combat/op.js breakOpening and kept
 * on the delta by every later call (a broken lock stays broken when the door is shut again).
 */
export function setOpening(state, openingId, s, { atMs = state.clock?.ms ?? 0, how = null, broken = null } = {}) {
  const area = openingArea(openingId);
  if (!area) throw new Error(`places: no opening '${openingId}'`);
  const o = openingOf(openingId);
  if (s !== 'open' && s !== 'closed') throw new Error(`places: an opening is 'open' or 'closed', not '${s}'`);
  if (s === 'closed' && ['doorway', 'gate', 'curtain'].includes(o.kind)) throw new Error(`places: ${openingId} is a ${o.kind}: it has no leaf to close`);
  const rec = siteRec(state, area.site), now = state.clock?.ms ?? 0;
  // (a lock broken off the range's lane (combat/op.js breakOpening) is the door's for good: kept on its delta through
  // every open and close after, so a delta that carries it is never dropped as the template's; absent, the delta as before)
  const br = broken ?? rec.openings?.[openingId]?.broken ?? null;
  if (s === (o.state ?? 'open') && atMs <= now && br === null) { if (rec.openings) { delete rec.openings[openingId]; if (!Object.keys(rec.openings).length) delete rec.openings; } }
  else (rec.openings ??= {})[openingId] = { state: s, atMs, ...(how ? { how } : {}), ...(br !== null ? { broken: br } : {}) };
  remarkSight(state, openingId);
  return remarkLeaf(state, openingId);
}

// ---- where the player is, and what is underfoot ----

const inRect = (r, x, z) => x >= r[0] && x <= r[2] && z >= r[1] && z <= r[3];
/** The rooms' bin index, metres a bin (each bin lists, in the area's order, the rooms that touch it). */
export const ROOM_BIN_M = 4;
const roomBins = new WeakMap();
function binsOf(a) {
  let B = roomBins.get(a);
  if (B) return B;
  const b = a.boundsM, nx = Math.ceil((b.x1 - b.x0) / ROOM_BIN_M) + 2, nz = Math.ceil((b.z1 - b.z0) / ROOM_BIN_M) + 2, x0 = b.x0 - ROOM_BIN_M, z0 = b.z0 - ROOM_BIN_M;
  const lists = Array.from({ length: nx * nz }, () => []);
  for (const r of a.rooms) {
    const i0 = Math.max(0, Math.floor((r.rect[0] - x0) / ROOM_BIN_M)), i1 = Math.min(nx - 1, Math.floor((r.rect[2] - x0) / ROOM_BIN_M));
    const j0 = Math.max(0, Math.floor((r.rect[1] - z0) / ROOM_BIN_M)), j1 = Math.min(nz - 1, Math.floor((r.rect[3] - z0) / ROOM_BIN_M));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) lists[j * nx + i].push(r);
  }
  B = { x0, z0, nx, nz, lists };
  roomBins.set(a, B);
  return B;
}
/** The room of an area at a point (edges count as in: the first room listed), or null; on a ground, null. */
export function roomOf(areaId, x, z) {
  const a = typeof areaId === 'string' ? areaOf(areaId) : areaId;
  if (!a || a.kind === 'ground') return null;
  const B = binsOf(a), i = Math.floor((x - B.x0) / ROOM_BIN_M), j = Math.floor((z - B.z0) / ROOM_BIN_M);
  if (i < 0 || j < 0 || i >= B.nx || j >= B.nz) return null;
  for (const r of B.lists[j * B.nx + i]) if (inRect(r.rect, x, z)) return r;
  return null;
}
/** The named ground zone at a point (the company street, the parade deck), or null. */
export function zoneOf(areaId, x, z) {
  const a = typeof areaId === 'string' ? areaOf(areaId) : areaId;
  return (a?.zones ?? []).find(zn => zn.name && zn.rect && inRect(zn.rect, x, z)) ?? null;
}

/**
 * The HUD's place line: 'Echo Company barracks, ground floor · 1st Squad, 2nd Platoon' (the live area's
 * building, its floor where the area names one (floorName: a building's floors; out of doors none),
 * and the room or zone the player stands in).
 */
export function placeLine(state) {
  const a = liveArea(state);
  if (!a) return '';
  const me = playerActor(state), head = a.floorName ? `${a.short ?? a.name}, ${a.floorName}` : a.short ?? a.name;
  if (!me) return head;
  const where = a.kind === 'ground' ? zoneOf(a, me.x, me.z) : roomOf(a, me.x, me.z);
  // (a room named as its area ("Well A" in Well A) said once: the fixer of v0.0.24's play review, L4)
  return where?.name && where.name !== (a.short ?? a.name) ? `${head} · ${where.name}` : head;
}

// (a ground area's own surface: the area's, else its site's body's ground)
function groundOf(a) {
  const own = a.surface ?? BODIES[siteOf(a.site)?.body]?.ground;
  if (!own) throw new Error(`places: the ground '${a.id}' names no surface, and its site's body ('${siteOf(a.site)?.body}') no ground`);
  return own;
}
/** A ground area's own surface (its `surface`, else its site's body's ground: Melas's regolith), whatever its paths are paved with; throws for a ground with neither. */
export function groundSurfaceOf(areaId) {
  const a = areaOf(areaId);
  if (a?.kind !== 'ground') throw new Error(`places: '${areaId}' is not a ground`);
  return groundOf(a);
}
const segDist = (px, pz, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], L = dx * dx + dz * dz; let t = L ? ((px - a[0]) * dx + (pz - a[1]) * dz) / L : 0; t = t < 0 ? 0 : t > 1 ? 1 : t; const ex = a[0] + t * dx - px, ez = a[1] + t * dz - pz; return Math.sqrt(ex * ex + ez * ez); };
const STAIR_KINDS = new Set(['stairs', 'stairsWell']);
/**
 * What the feet are on at a point, a SURFACES id (src/data/places/env.js; PLACES §2.7), the most specific
 * cell first (ROADMAP "anywhere" step 5: per cell). On a ground: its `surfaces` (paved zones, roads and paths:
 * each its own `surface`, 'paving' where it names none), else the ground's own (the area's `surface`, else its
 * site's body's: BODIES' ground, Mars's regolith, Europa's ice; a ground with neither throws, TECH §1.4: no quiet
 * regolith off Mars). On a floor or a deck: a patch of its `surfaces` ({ rect, surface }: a strip of deck plate, a
 * grating with its handholds), a flight 'stairs', the room's `surface` or floor kind, the area's `surface`, else
 * 'vinyl' in a room and 'concrete' between rooms. null with no area. On the live area a live environment's `surface`
 * (state.places.live.env.surface: v0.0.24, absent on every shipped scene) is every cell's: a floor laid in steel for a test.
 */
export function surfaceAt(state, x, z, areaId = state?.places?.live?.area) {
  const a = areaOf(areaId);
  if (!a) return null;
  // (ROADMAP "anywhere" step 5: the live environment's deck, a test's steel copy of a floor (tests/void-world.mjs), on the live area only)
  const over = state?.places?.live?.env?.surface;
  if (over && areaId === state.places.live.area) return over;
  if (a.kind === 'ground') {
    for (const s of a.surfaces ?? []) {
      if (s.rect ? inRect(s.rect, x, z) : s.pts.some((p, k) => k + 1 < s.pts.length && segDist(x, z, p, s.pts[k + 1]) <= s.widthM / 2)) return s.surface ?? 'paving';
    }
    return groundOf(a);
  }
  for (const s of a.surfaces ?? []) if (s.rect && inRect(s.rect, x, z)) return s.surface;
  for (const f of a.fixtures ?? []) {
    if (!STAIR_KINDS.has(f.kind)) continue;
    const r = footprintOf(f);
    if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return 'stairs';
  }
  const room = roomOf(a, x, z);
  return room ? (room.surface ?? room.floor?.kind ?? a.surface ?? 'vinyl') : (a.surface ?? 'concrete');
}

// ---- the holds and the passage (v0.0.24's step 5; see the header) ----

/** A grip of PLACES §2.7 that is a hold where it lies, by the kind holdNear gives: a grating's rails a hold, a strip of loops a pad-eye. */
const GRIP_HOLDS = Object.freeze({ handholds: 'hold', loops: 'padEye' });
// (the live floor's blockers and closed leaves as rects { x0, z0, x1, z1 }: the C0 grid's, cached with it)
function blockersHere(state, areaId) {
  const a = areaOf(areaId);
  if (!a || a.kind === 'ground') return null;
  const g = navOf(state, areaId, 'C0');
  return { g, rects: [...g.blockers, ...g.leaves.filter(l => l.closed).map(l => l.rect)] };
}
const onDeck = (B, x, z) => { const i = Math.floor((x - B.g.x0) / B.g.cellM), j = Math.floor((z - B.g.z0) / B.g.cellM); return i >= 0 && j >= 0 && i < B.g.nx && j < B.g.nz && B.g.floor[j * B.g.nx + i] === 1 && !B.rects.some(r => x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1); };
// (the lattice point nearest v along an axis: off + k step, within [lo, hi], or null)
function latticeNear(v, off, step, lo = -Infinity, hi = Infinity) {
  const k = Math.round((v - off) / step), at = off + k * step;
  if (at >= lo - 1e-9 && at <= hi + 1e-9) return at;
  const a = off + Math.ceil((lo - off) / step - 1e-9) * step, b = off + Math.floor((hi - off) / step + 1e-9) * step;
  if (a > hi + 1e-9) return null;
  return Math.abs(a - v) <= Math.abs(b - v) ? a : b;
}
/**
 * The nearest hold or pad-eye within reachM of (x, z) on the live area (see the header): { x, z, kind: 'hold' | 'padEye', dM } or
 * null. kind limits it to one of the two. In an area with no `holds` rule the surface's grip under the body (a hold at the body's point).
 */
export function holdNear(state, x, z, reachM, { kind = null } = {}) {
  const areaId = state?.places?.live?.area, a = areaOf(areaId);
  if (!a) return null;
  const H = a.holds;
  if (!H) {
    // (no rule: the grip of the surface underfoot, its SURFACES row's)
    const id = surfaceAt(state, x, z, areaId), k = id ? GRIP_HOLDS[SURFACES[id]?.grip] ?? null : null;
    return k && (!kind || kind === k) ? Object.freeze({ x, z, kind: k, dM: 0 }) : null;
  }
  const B = blockersHere(state, areaId);
  if (!B) return null;
  const off = H.gridM / 2, out = [];
  if (kind !== 'hold' && H.padEyeM) {
    const px = latticeNear(x, off, H.padEyeM), pz = latticeNear(z, off, H.padEyeM);
    for (const dx of [-1, 0, 1]) for (const dz of [-1, 0, 1]) {
      const ex = px + dx * H.padEyeM, ez = pz + dz * H.padEyeM;
      if (onDeck(B, ex, ez)) out.push({ x: ex, z: ez, kind: 'padEye' });
    }
  }
  if (kind !== 'padEye' && H.faces !== false) {
    for (const r of B.rects) {
      if (x < r.x0 - reachM || x > r.x1 + reachM || z < r.z0 - reachM || z > r.z1 + reachM) continue;
      // (each face of the rect a run of rungs: along x at its z edges, along z at its x edges)
      const hx = latticeNear(x, off, H.gridM, r.x0, r.x1), hz = latticeNear(z, off, H.gridM, r.z0, r.z1);
      if (hx !== null) for (const ez of [r.z0, r.z1]) out.push({ x: hx, z: ez, kind: 'hold' });
      if (hz !== null) for (const ex of [r.x0, r.x1]) out.push({ x: ex, z: hz, kind: 'hold' });
    }
  }
  let best = null;
  for (const h of out) {
    const d = Math.hypot(h.x - x, h.z - z);
    if (d <= reachM + 1e-9 && (!best || d < best.dM - 1e-9 || (Math.abs(d - best.dM) <= 1e-9 && (h.x < best.x || (h.x === best.x && h.z < best.z))))) best = { x: Math.round(h.x * 1000) / 1000, z: Math.round(h.z * 1000) / 1000, kind: h.kind, dM: Math.round(d * 1000) / 1000 };
  }
  return best ? Object.freeze(best) : null;
}
/**
 * The passage across the body's place on the live area (see the header): { widthM, axis: 'x' | 'z' } the narrower free width
 * between the blockers (walls, blocking fixtures, closed leaves) along x and along z, or null off a floor or with a side open.
 */
export function passageAt(state, x, z) {
  const B = blockersHere(state, state?.places?.live?.area);
  if (!B) return null;
  let e = Infinity, w = Infinity, n = Infinity, s = Infinity;
  for (const r of B.rects) {
    if (z >= r.z0 && z <= r.z1) { if (r.x0 >= x) e = Math.min(e, r.x0 - x); if (r.x1 <= x) w = Math.min(w, x - r.x1); if (r.x0 < x && r.x1 > x) return Object.freeze({ widthM: 0, axis: 'x' }); }
    if (x >= r.x0 && x <= r.x1) { if (r.z0 >= z) s = Math.min(s, r.z0 - z); if (r.z1 <= z) n = Math.min(n, z - r.z1); }
  }
  const wx = e + w, wz = s + n;
  if (!Number.isFinite(wx) && !Number.isFinite(wz)) return null;
  return Object.freeze(wx <= wz ? { widthM: Math.round(wx * 1000) / 1000, axis: 'x' } : { widthM: Math.round(wz * 1000) / 1000, axis: 'z' });
}
