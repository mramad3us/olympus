// OLYMPUS places: the data model's registry, and the state's places record (PLACES §1.2, §1.3, §1.10).
//
// The world is a set of sites; a site is made of areas; one area is live at a time (PLACES's summary).
// Sites and areas are authored once, as frozen data in src/data/places (the test rooms, Base Melas),
// and found here by id: siteOf('test'), areaOf('test.rooms'). A template carries a version and a site
// instance pins template@version (TECH §2.4, PLACES §9.1), so a changed template is a new version.
//
// The save holds only what changed (PLACES §1.10): state.places is
//   { live: { site, area } | null,               where the player is
//     nav: { queue, pending, debtNodes },        path requests in flight (nav.js; saved for determinism)
//     sites: { <siteId>: { seed, template,       each site that has been entered: its seed and template,
//              openings: { <openingId>: { state } } } } }   and the openings whose state differs from it
// and nothing else this round (fixtures' states, zones, holes, fires, lighting, items and marks come
// with the systems that change them). An opening's state is the saved delta, else the template's
// (openingState); setOpening writes the delta (dropped again when it matches the template, so a save
// stays small) and re-marks the nav cells round the leaf on every cached grid of that area. A site's
// seed is hash('site', id, the world's seed): the same world makes the same site.
//
// lonOf(state) is the live site's east longitude, read from SETTING's one site record
// (src/data/setting/calendar.js SITES, through the site's geo), which the clocks and the recurring
// jobs' `local@` times read (the hub: one quantity, one helper). Before any site is entered it is
// Melas's, where every career starts (SETTING §3.7).
import { TEST_SITE, TEST_AREA } from '../../data/places/testroom.js';
import { MELAS_SITE } from '../../data/places/melas.js';
import { SITES } from '../../data/setting/calendar.js';
import { hash } from '../../core/hash.js';
import { put } from '../../core/ids.js';
import { remarkOpening } from './nav.js';

const byId = (list) => Object.freeze(Object.fromEntries(list.map(r => [r.id, r])));
/** Every site the game knows, by id. */
export const SITE_RECORDS = byId([TEST_SITE, MELAS_SITE]);
/** Every area with a floor plan, by id. */
export const AREA_RECORDS = byId([TEST_AREA]);
// (an opening's area, for the openings' deltas: opening ids are unique across the areas)
const OPENING_AREA = Object.freeze(Object.fromEntries(Object.values(AREA_RECORDS).flatMap(a => (a.openings ?? []).map(o => [o.id, a.id]))));

/** A site's frozen record, or null. */
export const siteOf = (siteId) => SITE_RECORDS[siteId] ?? null;
/** An area's frozen record, or null. */
export const areaOf = (areaId) => AREA_RECORDS[areaId] ?? null;
/** The live area's record, or null. */
export const liveArea = (state) => areaOf(state.places?.live?.area);
/** The live site's record, or null. */
export const liveSite = (state) => siteOf(state.places?.live?.site);

/** The live site's east longitude in degrees (SETTING's site record); Melas's before any site is entered. */
export function lonOf(state) {
  const site = liveSite(state);
  return (SITES[site?.geo] ?? SITES.melas).lonEDeg;
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

/** Make a site and area live: places.live = { site, area }, the site's record made once (its seed and template). */
export function enterSite(state, siteId, areaId) {
  const site = siteOf(siteId);
  if (!site) throw new Error(`places: no site '${siteId}'`);
  if (areaId && !site.areas.includes(areaId)) throw new Error(`places: site '${siteId}' has no area '${areaId}'`);
  const P = initPlaces(state);
  if (!P.sites[siteId]) put(state, P.sites, siteId, { seed: hash('site', siteId, state.meta?.seed ?? 0), template: site.template });
  P.live = { site: siteId, area: areaId ?? site.areas[0] };
  return P.live;
}

// (the saved record of the site an opening's area belongs to, or null)
function siteRecFor(state, openingId) {
  const area = areaOf(OPENING_AREA[openingId]);
  return area ? { area, rec: state.places?.sites?.[area.site] ?? null } : { area: null, rec: null };
}

/** An opening's state: the saved delta, else the template's ('open' for anything without a leaf). */
export function openingState(state, opening) {
  const o = typeof opening === 'string' ? areaOf(OPENING_AREA[opening])?.openings.find(x => x.id === opening) : opening;
  if (!o) return null;
  return siteRecFor(state, o.id).rec?.openings?.[o.id]?.state ?? o.state ?? 'open';
}

/** Open or close an opening ('open' | 'closed'): the saved delta, and the nav cells round its leaf re-marked. Returns the cells changed. */
export function setOpening(state, openingId, s) {
  const { area } = siteRecFor(state, openingId);
  if (!area) throw new Error(`places: no opening '${openingId}'`);
  const o = area.openings.find(x => x.id === openingId);
  if (s !== 'open' && s !== 'closed') throw new Error(`places: an opening is 'open' or 'closed', not '${s}'`);
  if (s === 'closed' && ['doorway', 'gate', 'curtain'].includes(o.kind)) throw new Error(`places: ${openingId} is a ${o.kind}: it has no leaf to close`);
  const P = initPlaces(state);
  const rec = P.sites[area.site] ?? put(state, P.sites, area.site, { seed: hash('site', area.site, state.meta?.seed ?? 0), template: siteOf(area.site).template });
  if (s === (o.state ?? 'open')) { if (rec.openings) { delete rec.openings[openingId]; if (!Object.keys(rec.openings).length) delete rec.openings; } }
  else (rec.openings ??= {})[openingId] = { state: s };
  let changed = 0;
  for (const grid of Object.values(state.$places?.nav?.[area.id] ?? {})) changed += remarkOpening(grid, area, openingId, s);
  return changed;
}
