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
// at a point, surfaceAt(state, x, z) what the feet are on (the audio's footsteps, BODY's grip later).
import { SITE_LIST } from '../../data/places/sites.js';
import { SITES, START } from '../../data/setting/calendar.js';
import { BODIES } from '../../data/places/env.js';
import { put, playerActor } from '../../core/ids.js';
import { AREA_LIST } from './areas.js';
import { remarkLeaf } from './nav.js';
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
  return where?.name ? `${head} · ${where.name}` : head;
}

// (a ground area's own surface: the area's, else its site's body's ground)
function groundOf(a) {
  const own = a.surface ?? BODIES[siteOf(a.site)?.body]?.ground;
  if (!own) throw new Error(`places: the ground '${a.id}' names no surface, and its site's body ('${siteOf(a.site)?.body}') no ground`);
  return own;
}
const segDist = (px, pz, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], L = dx * dx + dz * dz; let t = L ? ((px - a[0]) * dx + (pz - a[1]) * dz) / L : 0; t = t < 0 ? 0 : t > 1 ? 1 : t; const ex = a[0] + t * dx - px, ez = a[1] + t * dz - pz; return Math.sqrt(ex * ex + ez * ez); };
const STAIR_KINDS = new Set(['stairs', 'stairsWell']);
/**
 * What the feet are on at a point: 'tile' | 'vinyl' | 'concrete' (a floor's rooms; a flight 'stairs')
 * or, on a ground, 'paving' (its paved zones, roads and paths) else the ground's own: the area's `surface`,
 * else its site's body's (src/data/places/env.js BODIES' ground: Mars's regolith, Europa's ice). A ground
 * with neither throws (TECH §1.4: no quiet regolith off Mars). null with no area.
 */
export function surfaceAt(state, x, z, areaId = state?.places?.live?.area) {
  const a = areaOf(areaId);
  if (!a) return null;
  if (a.kind === 'ground') {
    for (const s of a.surfaces ?? []) {
      if (s.rect ? inRect(s.rect, x, z) : s.pts.some((p, k) => k + 1 < s.pts.length && segDist(x, z, p, s.pts[k + 1]) <= s.widthM / 2)) return 'paving';
    }
    return groundOf(a);
  }
  for (const f of a.fixtures ?? []) {
    if (!STAIR_KINDS.has(f.kind)) continue;
    const r = footprintOf(f);
    if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return 'stairs';
  }
  const room = roomOf(a, x, z);
  return room ? (room.surface ?? room.floor?.kind ?? 'vinyl') : 'concrete';
}
