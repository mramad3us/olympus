// OLYMPUS places: the environment record and its helpers, one per quantity (PLACES §1.2, §1.3, §3.11, §3.16; TECH §1.4; CONTRACTS §21).
//
// Every quantity of a place's environment is read here and computed nowhere else (the hub: one quantity,
// one helper). A place's record is resolved from layers, the most specific winning:
//   body   BODIES[site.body] (src/data/places/env.js): the surface gravity, the sky class, the ground;
//   site   the site record (src/data/places/sites.js): its body, the air outside and inside, the gravity's
//          regime and down, the palette;
//   area   its record (src/sim/places/model.js areaOf): `gravity` and `air` (absent or null: the
//          site's), its kind (a `ground` breathes the site's outside air, open to the weather; a floor,
//          a deck or a craft its inside air), `sky`;
//   live   state.places.live.env, a scene's override: { preset, gravity?, air?, airC?, rev } (absent for
//          the site's own environment, so a save made before it, and every save that never sets one,
//          is the same bytes; the upgrade 'places:env' turns a null into that absence). A preset names a
//          whole environment (ENV_PRESETS) and its fields win over every layer under it.
// The zone and room layer (a zone's gas, a room's surface and light) comes with PLACES §3's zones.
//
// envAt(state, area, x, z) is the resolved record { site, area, body, outdoors, gravity, air, sky,
// preset }; gravityAt { regime, gG, gMs2, down, onsetGs, spin }; airAt { air, word, pKpa, o2Kpa, co2Kpa,
// airC, molarKgMol, vacuum, rhoKgM3, soundMs, sinkC, open }; soundMsAt the speed of sound (0: no
// airborne path); surfaceAt { id, muDry, muWet, mu, ferrous, grip, step, dust, soilWord } under the feet
// (model.js surfaceAt names the id). `area` is an area id; null or undefined reads the live area. x and z
// are taken for the zones to come. presetEnv(id) is a preset's record with no state (the ballistic
// table's classes, the tests' matrix); bodyPlaceOf(siteId) is what a body skipped along a plan breathes
// and weighs there ({ gG, in: { pKpa, airC }, out: { pKpa, airC } }: BODY's segments, startBody).
// Derived once here: gMs2 = gG × G0, the density and the speed of sound by src/core/phys.js's gas law,
// vacuum (no pressure), open (out of doors under an air with weather: the wind blows only there) and
// sinkC (the radiative sink: the surroundings' temperature, the air's until BODY §10.2's model).
// The clock and the sky by site (ROADMAP "anywhere"'s step 3): localTime(site, ms) is the one clock
// helper, the site's clock (CLOCKS) at a game time: { face, hour, minute, second, civilMs, h, timeslip,
// slipMs, dayIndex, dayMs, dayLenMs, weekday (Monday 0), weekdayName, dayLabel, dateLabel, dayShort,
// mars }. On `mars-local` it is core's marsClock at the site's longitude with SETTING's years (the
// watch's own numbers: 'Sol 590 · MY 211', the timeslip at 24:00), `mars` the whole Mars clock; on
// `utc` the day of a ship and the Corps ('22 Mar 2351', no slip). timeAt(where, ms) is the same for a
// site or, given a number, Mars at that east longitude (the tests' and the old callers' form).
// msAtLocal(site, fromMs, hour, minute) is the first game time at or after fromMs at which the site's
// clock reads hour:minute (a sol's 24:mm is mm minutes into the slip; a UTC day has no 24). The light,
// the watch, the log, the wall clocks and the jobs' local@ and week@ slots read these, so a ship's
// 20:00 is UTC's and Melas's the sol's (env-clock). lonOfSite(site) is a Mars site's east longitude
// and **throws for a site that is not on Mars** (model.js lonOf likewise): every reader still written
// in longitudes (the body clock, the activities, the night's calls) fails loudly off Mars instead of
// keeping a sol that is not there. skyOf(state, site, area) is the sky's class: { cls, outside,
// sunBody }, outside the site's body's (BODIES' sky: mars-air, earth-air, airless; `none` for deep
// space, so a ship has no sun and no sky light), cls `none` where the area is under no sky (envAt's
// sky: a floor, a deck, a craft) and else outside. The sky is the host site's: a live preset changes
// the gravity and the air, never the sun or the sky (my call: step 4's scene specs pick the host; the fixer's
// pass made envAt's sky, skyOf and the light's skyAt agree on it: a preset's own `sky` and `body` are its
// stateless record's, presetEnv, for the ballistic table and the tests, never the live place's). A scene
// that stands under no sky stands on an area or a site that has none (the Wheel's floors, a ship's decks). routineOf
// and waterOf are the site's Plan of the Day (src/data/pod.js ROUTINES) and its water (the shower's
// minutes, src/data/activities.js WATER_MIN's row); siteAt(state) is the live site's record, or the
// start site's (SETTING §3.7) before any is entered.
// **A missing value throws**: an unknown site, body, air, preset or surface is an error, never a quiet
// Melas (TECH §1.4, rule 2). Resolved records are frozen and cached: per area with no live override,
// and per live record and area otherwise, checked against its rev (bumped by setLiveEnv), so a tick
// does a lookup, not a resolution.
// Pure (the caches hold derived records of frozen data, never state).
import { G0_MS2, gasOf } from '../../core/phys.js';
import { HOUR_MS, MIN_MS, DAY_MS, SOL_MS } from '../../core/clock.js';
import { marsClock, msAtMarsTime, utc, yearsOf, UNIX_MS_AT_EPOCH, WEEKDAYS as UTC_WEEKDAYS, MONTHS as UTC_MONTHS } from '../../core/calendar.js';
import * as SETTING from '../../data/setting/calendar.js';
import { BODIES, AIRS, SURFACES, ENV_PRESETS, CLOCKS, LIGHT_REGIMES } from '../../data/places/env.js';
import { ROUTINES } from '../../data/pod.js';
import { siteOf, areaOf, siteLonOf, surfaceAt as surfaceIdAt } from './model.js';

const DOWN = Object.freeze([0, -1, 0]), NONE = Object.freeze([0, 0, 0]);

const need = (v, what) => { if (v === undefined || v === null) throw new Error(`env: ${what}`); return v; };
const bodyOf = (id, from) => need(BODIES[id], `${from} names no known body ('${id}')`);
const airRow = (id, from) => need(AIRS[id], `${from} names no known air ('${id}')`);
const presetOf = (id) => need(ENV_PRESETS[id], `no preset '${id}' (${Object.keys(ENV_PRESETS).join(', ')})`);

/** A gravity record from a layer's { regime, gG, down, onsetGs, spin } on a body: { regime, gG, gMs2, down, onsetGs, spin }. */
function gravityOf(g, body, from) {
  const regime = need(g?.regime, `${from} names no gravity regime`);
  const gG = g.gG ?? (regime === 'surface' ? body.gG : null);
  if (!Number.isFinite(gG)) throw new Error(`env: ${from}'s ${regime} gravity has no value (gG ${gG})`);
  const down = g.down ? Object.freeze([...g.down]) : gG > 0 ? DOWN : NONE;
  return Object.freeze({ regime, gG, gMs2: gG * G0_MS2, down, onsetGs: g.onsetGs ?? 0, spin: g.spin ?? null });
}

/**
 * An air record from an AIRS id, a layer's temperature and whether it is open to the weather. The row's airC is the
 * air's set point, its default: a layer's airC wins over it (a ship with failing heat, an unheated sector), and an air
 * with no set point (vacuum) takes the layer's or throws.
 */
function airOf(id, airC, open, from) {
  if (airC !== null && airC !== undefined && !Number.isFinite(airC)) throw new Error(`env: ${from}'s temperature is not a number (${airC})`);
  const row = airRow(id, from), t = airC ?? row.airC ?? null, vacuum = !(row.pKpa > 0);
  if (!vacuum && !Number.isFinite(t)) throw new Error(`env: ${from}'s air '${id}' has no temperature`);
  const gas = gasOf(row.pKpa, t, row.molarKgMol);
  return Object.freeze({ air: id, word: row.word, pKpa: row.pKpa, o2Kpa: row.o2Kpa, co2Kpa: row.co2Kpa, airC: t, molarKgMol: row.molarKgMol, vacuum,
    rhoKgM3: gas.rhoKgM3, soundMs: gas.soundMs, sinkC: t, open: !!open && !vacuum });
}

/** Whether an id names a preset (ENV_PRESETS): the page's &env is checked by it before a game is made, so an unknown name is a toast, not a dead page. */
export const isPreset = (id) => typeof id === 'string' && Object.hasOwn(ENV_PRESETS, id);
/** A preset's record with no state (ENV_PRESETS): { preset, word, body, gravity, air, sky, outdoors }. */
export function presetEnv(id) {
  const p = presetOf(id), body = bodyOf(p.body, `preset '${id}'`), from = `preset '${id}'`;
  return Object.freeze({ preset: id, word: p.word, body: p.body, gravity: gravityOf(p.gravity, body, from), air: airOf(p.air, p.airC, p.open, from), sky: p.sky, outdoors: !!p.open });
}
const PRESETS = new Map();
const presetRec = (id) => { let r = PRESETS.get(id); if (!r) PRESETS.set(id, (r = presetEnv(id))); return r; };

// (the record of an area with no live override: its site's and body's, the area's own fields winning)
function placeEnv(areaId) {
  const area = need(areaOf(areaId), `no area '${areaId}'`), site = need(siteOf(area.site), `area '${areaId}' names no known site ('${area.site}')`);
  const body = bodyOf(site.body, `site '${site.id}'`), outdoors = area.kind === 'ground', from = `area '${areaId}'`;
  const airId = area.air ?? (outdoors ? need(site.outside?.air, `site '${site.id}' names no outside air`) : need(site.inside?.air, `site '${site.id}' names no inside air`));
  const open = outdoors && site.outside?.kind === 'air' && !!site.outside?.weather;
  return Object.freeze({ site: site.id, area: areaId, body: site.body, outdoors, gravity: gravityOf(area.gravity ?? site.gravity, body, from),
    air: airOf(airId, null, open, from), sky: area.sky ?? (outdoors ? 'open' : 'none'), preset: null });
}
const PLACES = new Map();
const placeRec = (areaId) => { let r = PLACES.get(areaId); if (!r) PLACES.set(areaId, (r = placeEnv(areaId))); return r; };

// (a live override on top of an area's record: the preset's gravity and air, then the override's own fields. The sky
// stays the area's (the header: a preset never changes the sun), so envAt's sky and skyOf agree with the light's skyAt.
// An airC alone re-reads the air under it at that temperature)
function liveEnv(base, L) {
  const p = L.preset ? presetRec(L.preset) : null, body = bodyOf(p?.body ?? base.body, `the live environment`), from = 'the live environment';
  const gravity = L.gravity ? gravityOf(L.gravity, body, from) : p ? p.gravity : base.gravity;
  const under = p ? p.air : base.air, hasC = L.airC !== undefined && L.airC !== null;
  const air = L.air || hasC ? airOf(L.air ?? under.air, hasC ? L.airC : L.air ? null : under.airC, p ? p.outdoors : base.air.open, from) : under;
  return Object.freeze({ ...base, body: p?.body ?? base.body, outdoors: p ? p.outdoors : base.outdoors, gravity, air, preset: L.preset ?? null });
}
const LIVE = new WeakMap();

/** The live override's record (state.places.live.env), or null for the site's own environment. */
export const liveEnvOf = (state) => state?.places?.live?.env ?? null;

/** The resolved environment at a place (see the header): area an area id (null: the live area). Throws for an unknown site, body, air or preset. */
export function envAt(state, area = null, x = 0, z = 0) {
  const areaId = area ?? need(state?.places?.live?.area, 'no area given and none is live');
  const base = placeRec(areaId), L = liveEnvOf(state);
  if (!L) return base;
  let m = LIVE.get(L);
  if (!m || m.rev !== (L.rev ?? 0)) LIVE.set(L, (m = { rev: L.rev ?? 0, by: new Map() }));
  let r = m.by.get(areaId);
  if (!r) m.by.set(areaId, (r = liveEnv(base, L)));
  return r;
}
/** The gravity at a place: { regime, gG, gMs2, down, onsetGs, spin } (PLACES §3.11). */
export const gravityAt = (state, area = null, x = 0, z = 0) => envAt(state, area, x, z).gravity;
/** The air at a place: { air, word, pKpa, o2Kpa, co2Kpa, airC, molarKgMol, vacuum, rhoKgM3, soundMs, sinkC, open } (PLACES §3.2, §3.16). */
export const airAt = (state, area = null, x = 0, z = 0) => envAt(state, area, x, z).air;
/** The speed of sound at a place, m/s: 0 where there is no air to carry it. */
export const soundMsAt = (state, area = null, x = 0, z = 0) => envAt(state, area, x, z).air.soundMs;

/** What the feet are on at a point: { id, muDry, muWet, mu (dry this round), ferrous, grip, step, dust, soilWord } (PLACES §2.7). */
export function surfaceAt(state, area = null, x = 0, z = 0) {
  const areaId = area ?? need(state?.places?.live?.area, 'no area given and none is live');
  const id = need(surfaceIdAt(state, x, z, areaId), `no surface at (${x}, ${z}) in '${areaId}'`), row = need(SURFACES[id], `no surface '${id}' (${Object.keys(SURFACES).join(', ')})`);
  return { id, ...row, mu: row.muDry };
}

const BODY_PLACES = new Map();
/** What a body skipped along a plan at a site breathes and weighs: { gG, in: { pKpa, airC }, out: { pKpa, airC } } (the site's own, no live override). */
export function bodyPlaceOf(siteId) {
  let r = BODY_PLACES.get(siteId);
  if (r) return r;
  const site = need(siteOf(siteId), `no site '${siteId}'`), body = bodyOf(site.body, `site '${siteId}'`), from = `site '${siteId}'`;
  const g = gravityOf(site.gravity, body, from), inAir = airOf(need(site.inside?.air, `${from} names no inside air`), null, false, from);
  const outAir = airOf(need(site.outside?.air, `${from} names no outside air`), null, true, from);
  r = Object.freeze({ gG: g.gG, in: Object.freeze({ pKpa: inAir.pKpa, airC: inAir.airC }), out: Object.freeze({ pKpa: outAir.pKpa, airC: outAir.airC }) });
  BODY_PLACES.set(siteId, r);
  return r;
}

/**
 * Set or clear the live override (a scene's environment, ROADMAP "anywhere"'s steps 2 and 4): over
 * { preset, gravity?, air?, airC? } or null. Writes state.places.live.env (saved) with its rev bumped,
 * after the preset and the airs named are checked. Returns the record written, or null.
 */
export function setLiveEnv(state, over) {
  const live = need(state?.places?.live, 'no live place to set an environment on');
  if (!over) { delete live.env; return null; }
  const rec = { preset: over.preset ?? null };
  if (over.gravity) rec.gravity = { ...over.gravity };
  if (over.air) rec.air = over.air;
  if (over.airC !== undefined) rec.airC = over.airC;
  rec.rev = (live.env?.rev ?? 0) + 1;
  checkLive(rec, live.area);                                       // (resolved before it is written: a bad override throws and the state keeps the one it had)
  live.env = rec;
  return rec;
}

// (a live record resolved on its area, off the caches: throws for an unknown preset, a gravity with no regime or value, an unknown air or a bad temperature)
function checkLive(rec, areaId) {
  if (rec.preset) presetOf(rec.preset);
  if (rec.air) airRow(rec.air, 'the live environment');
  liveEnv(placeRec(need(areaId, 'no live area to resolve the environment on')), rec);
}

/** The upgrade 'places:env' (additive): a null live environment is the site's own, written as its absence; a saved override must resolve (its preset, gravity, air and temperature), else the load throws. */
export function upgradeEnv(state) {
  const live = state?.places?.live;
  if (!live || !('env' in live)) return 0;
  if (live.env === null || live.env === undefined) { delete live.env; return 1; }
  checkLive(live.env, live.area);
  return 0;
}

// ---- the clock and the sky by site (step 3) ----

const YEARS = yearsOf(SETTING);
/** A site's record from its id or the record itself; throws for an unknown site. */
export function siteRecOf(site) {
  const s = typeof site === 'string' ? siteOf(site) : site;
  return need(s, `no site '${typeof site === 'string' ? site : site?.id ?? site}'`);
}
/** The live site's record, or the start site's (SETTING §3.7) before any site is entered. */
export const siteAt = (state) => siteRecOf(state?.places?.live?.site ?? SETTING.START.site);

/** A site's clock: its CLOCKS id; throws for none, an unknown one, or one not built. */
export function clockOf(site) {
  const s = siteRecOf(site), id = need(s.clock, `site '${s.id}' names no clock`), row = need(CLOCKS[id], `site '${s.id}' names no known clock ('${id}')`);
  if (!row.built) throw new Error(`env: site '${s.id}' keeps '${id}', which is not built yet`);
  return id;
}

/** A Mars site's east longitude, degrees (SETTING's geo record); throws for a site that is not on Mars or keeps another clock (the rule's one home is model.js siteLonOf). */
export const lonOfSite = (site) => siteLonOf(siteRecOf(site));

const pad2 = (n) => String(n).padStart(2, '0');
/** Mars's local clock at an east longitude, in localTime's form. */
export function marsTime(ms, lonEDeg) {
  const c = marsClock(ms, lonEDeg, YEARS);
  return {
    face: 'mars-local', hour: c.hour, minute: c.minute, second: c.second, civilMs: c.civilMs, h: c.timeslip ? 24 : c.civilMs / HOUR_MS,
    timeslip: c.timeslip, slipMs: c.slipMs, dayIndex: c.sol, dayMs: c.msOfSol, dayLenMs: SOL_MS, weekday: c.weekday, weekdayName: SETTING.WEEKDAYS[c.weekday],
    dayLabel: `Sol ${c.solOfYear}`, dateLabel: `Sol ${c.solOfYear} · MY ${c.my}`, dayShort: `S${c.solOfYear}`, mars: c,
  };
}
/** UTC, a ship's and the Corps' clock, in localTime's form. */
export function utcTime(ms) {
  const u = utc(ms), dayIndex = Math.floor((ms + UNIX_MS_AT_EPOCH) / DAY_MS), dayMs = ms + UNIX_MS_AT_EPOCH - dayIndex * DAY_MS, mon = UTC_MONTHS[u.month - 1].slice(0, 3);
  return {
    face: 'utc', hour: u.hour, minute: u.minute, second: u.second, civilMs: dayMs, h: dayMs / HOUR_MS,
    timeslip: false, slipMs: 0, dayIndex, dayMs, dayLenMs: DAY_MS, weekday: u.weekday, weekdayName: UTC_WEEKDAYS[u.weekday],
    dayLabel: `${u.day} ${mon}`, dateLabel: `${u.day} ${mon} ${u.year}`, dayShort: `${pad2(u.day)}${mon}`, mars: null,
  };
}

/** The site's clock at a game time (see the header): the one clock helper. */
export function localTime(site, ms) {
  const s = siteRecOf(site), id = clockOf(s);
  return id === 'mars-local' ? marsTime(ms, lonOfSite(s)) : utcTime(ms);
}
/** localTime for a site (an id or a record) or, given a number, Mars's clock at that east longitude. */
export const timeAt = (where, ms) => (typeof where === 'number' ? marsTime(ms, where) : localTime(where, ms));

/** The first game time at or after fromMs at which the site's clock reads hour:minute (see the header). */
export function msAtLocal(site, fromMs, hour, minute = 0) {
  const s = siteRecOf(site), id = clockOf(s);
  if (id === 'mars-local') return msAtMarsTime(fromMs, hour, minute, lonOfSite(s));
  const into = hour * HOUR_MS + minute * MIN_MS;
  if (!(into >= 0 && into < DAY_MS)) throw new Error(`no ${hour}:${minute} on a ${id} clock`);
  const start = Math.floor((fromMs + UNIX_MS_AT_EPOCH) / DAY_MS) * DAY_MS - UNIX_MS_AT_EPOCH;
  let t = start + into;
  if (t < fromMs) t += DAY_MS;
  return t;
}

const SKIES = new Map();
/** The sky's class at a site (see the header): { cls, outside, sunBody }; area (an id) under no sky gives cls 'none'. */
export function skyOf(state, site, area = null) {
  const s = siteRecOf(site);
  let r = SKIES.get(s);
  if (!r) {
    const outside = need(bodyOf(s.body, `site '${s.id}'`).sky, `body '${s.body}' has no sky class`);
    SKIES.set(s, (r = Object.freeze({ cls: outside, outside, sunBody: outside === 'none' ? null : s.body })));
  }
  if (area === null || r.outside === 'none' || envAt(state, area).sky !== 'none') return r;
  return Object.freeze({ ...r, cls: 'none' });
}

/** A site's Plan of the Day (src/data/pod.js ROUTINES): { reveilleH, reveilleHolidayH, tapsH, holidays }; throws for none. */
export function routineOf(site) {
  const s = siteRecOf(site), id = need(s.routine, `site '${s.id}' names no Plan of the Day (routine)`);
  return need(ROUTINES[id], `site '${s.id}' names no known routine ('${id}')`);
}
/** A site's water (a row of src/data/activities.js WATER_MIN); throws for none. */
export const waterOf = (site) => { const s = siteRecOf(site); return need(s.water, `site '${s.id}' names no water`); };

/** A site's lighting hours on the day of a localTime t: { dayH, eveningH, outH } (LIGHT_REGIMES; a base's from its Plan of the Day). */
export function lightHoursOf(site, t) {
  const s = siteRecOf(site), id = need(s.lighting, `site '${s.id}' names no lighting regime`);
  const H = need(need(LIGHT_REGIMES[id], `site '${s.id}' names no known lighting regime ('${id}')`).hours, `the lighting regime '${id}' has no hours yet`);
  if (!H.routine) return H;
  const R = routineOf(s);
  return { dayH: R.holidays.includes(t.weekday) ? R.reveilleHolidayH : R.reveilleH, eveningH: H.eveningH, outH: R.tapsH };
}
