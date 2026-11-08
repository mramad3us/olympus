// OLYMPUS places: the light, the one helper every reader of light calls (TECH §9.6, correction 14; the build sheet 0.0.3 §2.1).
//
// Perception (PEOPLE §7: a sight's reach is 10 m + 42 m × the light at the spot), the fog of
// awareness, the stage's tint of every figure and its lamp pools all ask this module, so one quantity
// has one number on every screen (the hub: "so what you see is what's rolled", tradecraft). It is
// tradecraft v0.2.0-rc3 `src/sim/light.js` (143 lines: sky(), lightAt(), lightLevel()) adapted:
//   skyAt(site, ms)   the open air: VIEWS §2.7's Mars rows (src/data/places/sky.js MARS_ROWS) by the
//                     sun's geometric elevation from sunAt (sun.js: Mars's sun at the site, the
//                     canyon's horizon), interpolated between rows (tradecraft's keyframes). The key
//                     light, the shadows, the level's and the tint's step over the 0° row's are all
//                     scaled by the disc's share above the horizon (sunAt's visible): while the wall
//                     hides the whole disc (eclipsed) the key light is off and the shadows 0, the level
//                     and the tint at most the 0° row's; the sky follows the row, so the street
//                     brightens a little before sunrise and comes up over the minute and a half the
//                     disc takes to clear the rim (not in a frame: v0.0.3's review).
//   lightingOf(...)   a room's state by the site's clock and lighting regime (env.js localTime and
//                     lightHoursOf, ROADMAP "anywhere"'s step 3): at a base, day from reveille (Melas's
//                     Plan of the Day: 05:30 on a weekday and 07:00 on Saturday and Sunday, the weekday
//                     SETTING's week as the watch reads it), to 18:00; evening to taps at 22:00; lights
//                     out from taps to reveille and through the slip; on a ship, day 06:00 to 22:00 UTC
//                     and lights out otherwise. As its lighting class takes it (a head's 'evening' at
//                     every hour: heads stay lit).
//   The sky is the site's (env.js skyOf): Mars's open air has the rows below; a site with no sky (a
//   ship: deep space) has NO_SKY, no sun and no daylight, so its windows show nothing and its 'dark'
//   lamps burn; an Earth or airless sky has no rows yet and throws.
//   lampsOf(...)      an area's lamps as the stage tables them (TECH §9.6): { i, x, z, y, r, core, ring,
//                     kind, color, room, on }, each kind's pool from LAMP_KINDS and lit by its rule
//                     (ceiling panels while their room's overheads are, night lights and the fire
//                     watch's red lamp at lights out, the duty desk's lamp and exit signs always, street
//                     lamps and floods while the sun is under 0°). The same frozen array object comes
//                     back until a lamp changes, so the stage uploads its table only then.
//   lightLevel(...)   the light at a point, 0 (pitch dark) to 1 (the light a marine reads print and
//                     sees colour by), rounded to 0.0001. Indoors: min(1, max(fill, WINDOW_K × the open
//                     air's level where the room has windows) + Σ pools), the fill the room's mood at its
//                     state (MOODS: day 0.75, evening 0.65, lights out 0.04); a pool is a lit lamp's
//                     core within r and its ring within 1.5 r, hard-edged (VIEWS §2.7: pixel art's pool;
//                     a ceiling panel makes the fill, never a pool: the sheet's §8 item 7). Outdoors (a
//                     ground, or a point of a floor in no room: a porch past an outside door) the open
//                     air's level plus the lit pools.
//   lightFrame(...), spectrumAt(frame, x, z)  the same light with its colour as the eyes take it
//                     (0.0.5's dark adaptation, src/sim/body/eyes.js): spectrumAt gives { level, sp,
//                     sky }, the level lightLevel's own number, sky whether the open air can decide it
//                     (no room, or windows whose daylight at the brightest sky beats the fill under the
//                     room's lighting now) and sp the light's scotopic to photopic ratio
//                     (the rods' share against the cones', src/data/places/sky.js's sp), each source's
//                     weighted by its share of the level (the fill or the window's sky, each pool);
//                     the frame is the clock's state, the dark rule and the lamps at ms, with the open
//                     air's level held at skyMs (the eyes hold the sky to the game minute, so lived and
//                     skipped see it change at the same instant). lightKeyOf(siteId, ms) names what of
//                     the light changes in steps (the clock's state, the dark rule): the eyes look for
//                     its steps to the millisecond.
// A call costs a room lookup and the lamps of one 4 m bin: the clock's state, the sky and the lamps'
// bins are kept per (area, ms) (one frame's calls share them; the sky for two instants, a frame's clock
// and its game minute, which the eyes read together), so the per-call work is small and allocates
// nothing. Pure (its caches are of pure functions).
import { q } from '../../core/num.js';
import { MARS_ROWS, MOODS, CLASSES, CLASS_OF_KIND, WINDOW_K, LAMP_KINDS, TIMES, SKY_SP } from '../../data/places/sky.js';
import { areaOf, roomOf } from './model.js';
import { siteRecOf, localTime, lightHoursOf, skyOf } from './env.js';
import { sunAt } from './sun.js';

/** The open air's brightest level (the sky's rows' highest). */
const SKY_MAX_LEVEL = Math.max(...MARS_ROWS.map(r => r.level));

export { WINDOW_K, TIMES };
/** A light level is kept to this. */
export const LEVEL_STEP = 0.0001;
/** The pools' bin, metres (TECH §9.6's 4 m grid). */
export const POOL_BIN_M = 4;

const lerp = (a, b, k) => a + (b - a) * k;
const lerpHex = (a, b, k) => {
  if (a === null || b === null) return a ?? b;
  const ch = (h, s) => (h >> s) & 255;
  return (Math.round(lerp(ch(a, 16), ch(b, 16), k)) << 16) | (Math.round(lerp(ch(a, 8), ch(b, 8), k)) << 8) | Math.round(lerp(ch(a, 0), ch(b, 0), k));
};
/** The clock's lighting state at a site (an id or a record) by its clock and regime: 'day' | 'evening' | 'lightsOut' (see the header). */
export function clockLighting(site, ms) {
  const s = siteRecOf(site), t = localTime(s, ms);
  if (t.timeslip) return 'lightsOut';
  const h = t.h, H = lightHoursOf(s, t);
  return h < H.dayH || h >= H.outH ? 'lightsOut' : h < H.eveningH ? 'day' : 'evening';
}
const classOf = (room) => room?.lighting ?? CLASS_OF_KIND[room?.kind] ?? 'office';

/** A room's lighting state at a game time: 'day' | 'evening' | 'lightsOut', as its lighting class takes the clock's. Throws for an unknown area. */
export function lightingOf(state, areaId, roomId, ms) {
  const area = areaOf(areaId);
  if (!area) throw new Error(`light: no area '${areaId}'`);
  const room = area.rooms?.find(r => r.id === roomId) ?? null;
  return CLASSES[classOf(room)]?.always ?? clockLighting(area.site, ms);
}

// ---- the open air ----

/** The open air where there is no sky (a ship, deep space): no sun, no sky light, level 0. */
export const NO_SKY = Object.freeze({
  elevDeg: -90, azDeg: 0, visible: 0, eclipsed: true, sunColor: null, sunK: 0, skyColor: 0x000000, skyK: 0, ground: 0x000000,
  tint: Object.freeze([0, 0, 0]), glow: 0, shadow: 0, level: 0,
});

let skyLast = { site: null, ms: NaN, out: null }, skyPrev = { site: null, ms: NaN, out: null };   // (two slots: a frame's clock and its minute, lightFrame's two)
/** The open air at a site (an id or a record): { elevDeg, azDeg, visible, eclipsed, sunColor, sunK, skyColor, skyK, ground, tint: [r, g, b], glow, shadow, level }; NO_SKY where it has none. */
export function skyAt(site, ms) {
  const siteId = typeof site === 'string' ? site : site?.id;
  if (skyLast.site === siteId && skyLast.ms === ms) return skyLast.out;
  if (skyPrev.site === siteId && skyPrev.ms === ms) { const t = skyLast; skyLast = skyPrev; skyPrev = t; return skyLast.out; }
  const cls = skyOf(null, site).outside;
  if (cls === 'none') return NO_SKY;
  if (cls !== 'mars-air') throw new Error(`light: no sky rows for '${cls}' yet (site '${siteId}'): VIEWS §2.7 has Mars's only`);
  const s = sunAt(siteId, ms), e = s.elevDeg;
  let i = 0;
  while (i < MARS_ROWS.length - 1 && e < MARS_ROWS[i + 1].elevDeg) i++;
  const a = MARS_ROWS[i], b = MARS_ROWS[Math.min(i + 1, MARS_ROWS.length - 1)];
  const k = a === b || e >= a.elevDeg ? 0 : Math.min(1, (a.elevDeg - e) / (a.elevDeg - b.elevDeg));
  const zero = MARS_ROWS.find(r => r.elevDeg === 0);
  let level = lerp(a.level, b.level, k), tint = a.tint.map((v, j) => lerp(v, b.tint[j], k));
  let sunK = lerp(a.sunK, b.sunK, k), shadow = lerp(a.shadow, b.shadow, k), sunColor = a.sun === null ? null : lerpHex(a.sun, b.sun ?? a.sun, k);
  // (the disc's share above the horizon: the key light, the shadows and the step over the 0° row come in with it)
  const f = s.visible;
  if (f < 1) {
    sunK *= f; shadow *= f;
    if (f === 0) sunColor = null;
    level = lerp(Math.min(level, zero.level), level, f);
    tint = tint.map((v, j) => lerp(Math.min(v, zero.tint[j]), v, f));
  }
  const out = Object.freeze({
    elevDeg: s.elevDeg, azDeg: s.azDeg, visible: f, eclipsed: s.eclipsed, sunColor, sunK: q(sunK, 0.0001),
    skyColor: lerpHex(a.sky, b.sky, k), skyK: q(lerp(a.skyK, b.skyK, k), 0.0001), ground: lerpHex(a.ground, b.ground, k),
    tint: Object.freeze(tint.map(v => q(v, 0.0001))), glow: q(lerp(a.glow, b.glow, k), 0.0001), shadow: q(shadow, 0.0001), level: q(level, LEVEL_STEP),
  });
  skyPrev = skyLast; skyLast = { site: siteId, ms, out };
  return out;
}

// ---- the lamps ----

let lampCache = new Map();                                         // (area id → { key → { list, bins } })
/** Forget the lamp tables (TECH §2.3). */
export function resetCaches() { lampCache = new Map(); skyLast = { site: null, ms: NaN, out: null }; skyPrev = { site: null, ms: NaN, out: null }; frameLast = null; }

// (what lights a kind: the clock's state, and whether the sun is under the geometric horizon)
function litNow(kind, roomState, dark) {
  const rule = LAMP_KINDS[kind]?.lit ?? 'lit';
  return rule === 'always' ? true : rule === 'dark' ? dark : rule === 'lightsOut' ? roomState === 'lightsOut' : roomState !== 'lightsOut';
}
// (the table and its pool bins for an area under one clock state and one sun)
function tableOf(area, clock, dark) {
  const key = `${clock}|${dark ? 1 : 0}`;
  let byKey = lampCache.get(area.id);
  if (!byKey) lampCache.set(area.id, byKey = new Map());
  let t = byKey.get(key);
  if (t) return t;
  const roomState = new Map((area.rooms ?? []).map(r => [r.id, CLASSES[classOf(r)]?.always ?? clock]));
  const list = Object.freeze((area.look?.lamps ?? []).map((l, i) => {
    const K = LAMP_KINDS[l.kind ?? 'ceiling'] ?? LAMP_KINDS.ceiling, st = l.room ? roomState.get(l.room) ?? clock : clock;
    return Object.freeze({ i, x: l.x, z: l.z, y: l.y ?? 3.0, r: K.r ?? l.r ?? 0, core: K.core, ring: K.ring, kind: l.kind ?? 'ceiling', color: K.color, sp: K.sp ?? 1, room: l.room ?? null, on: litNow(l.kind ?? 'ceiling', st, dark) });
  }));
  // (the lit pools binned by POOL_BIN_M over the area, each in every bin its 1.5 r disc touches)
  const pools = list.filter(l => l.on && l.r > 0), b = area.boundsM, nx = Math.max(1, Math.ceil((b.x1 - b.x0) / POOL_BIN_M) + 1), nz = Math.max(1, Math.ceil((b.z1 - b.z0) / POOL_BIN_M) + 1);
  const bins = Array.from({ length: nx * nz }, () => []);
  for (const l of pools) {
    const R = l.r * 1.5, i0 = Math.max(0, Math.floor((l.x - R - b.x0) / POOL_BIN_M)), i1 = Math.min(nx - 1, Math.floor((l.x + R - b.x0) / POOL_BIN_M));
    const j0 = Math.max(0, Math.floor((l.z - R - b.z0) / POOL_BIN_M)), j1 = Math.min(nz - 1, Math.floor((l.z + R - b.z0) / POOL_BIN_M));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) bins[j * nx + i].push(l);
  }
  t = { list, bins, nx, nz, x0: b.x0, z0: b.z0 };
  byKey.set(key, t);
  return t;
}

/** An area's lamps at a game time (see the header): the same frozen array object until a lamp changes. */
export function lampsOf(state, areaId, ms) {
  const area = areaOf(areaId);
  if (!area) return Object.freeze([]);
  return tableOf(area, clockLighting(area.site, ms), skyAt(area.site, ms).elevDeg < 0).list;
}

// ---- the light at a point ----

let frameLast = null;                                              // ({ area, ms, clock, sky, table }: one frame's calls share it)
function frameOf(area, ms) {
  if (frameLast && frameLast.area === area && frameLast.ms === ms) return frameLast;
  const clock = clockLighting(area.site, ms), sky = skyAt(area.site, ms);
  return (frameLast = { area, ms, clock, sky, table: tableOf(area, clock, sky.elevDeg < 0) });
}
// (the pools' sum at a point: a lamp's core within r, its ring within 1.5 r)
function poolsAt(t, x, z) {
  const i = Math.floor((x - t.x0) / POOL_BIN_M), j = Math.floor((z - t.z0) / POOL_BIN_M);
  if (i < 0 || j < 0 || i >= t.nx || j >= t.nz) return 0;
  let s = 0;
  for (const l of t.bins[j * t.nx + i]) {
    const dx = x - l.x, dz = z - l.z, d2 = dx * dx + dz * dz;
    if (d2 < l.r * l.r) s += l.core; else if (d2 < 2.25 * l.r * l.r) s += l.ring;
  }
  return s;
}

// (the pools' sum at a point and their S/P-weighted sum, as poolsAt counts them)
function poolsSpAt(t, x, z) {
  const i = Math.floor((x - t.x0) / POOL_BIN_M), j = Math.floor((z - t.z0) / POOL_BIN_M);
  if (i < 0 || j < 0 || i >= t.nx || j >= t.nz) return [0, 0];
  let s = 0, w = 0;
  for (const l of t.bins[j * t.nx + i]) {
    const dx = x - l.x, dz = z - l.z, d2 = dx * dx + dz * dz, k = d2 < l.r * l.r ? l.core : d2 < 2.25 * l.r * l.r ? l.ring : 0;
    s += k; w += k * l.sp;
  }
  return [s, w];
}

/** What of the light changes in steps at a site (the clock's lighting state, whether the sun is under the horizon): see the header. */
export function lightKeyOf(siteId, ms) { return `${clockLighting(siteId, ms)}|${skyAt(siteId, ms).elevDeg < 0 ? 1 : 0}`; }

/** An area's light at ms with the open air's level held at skyMs, for spectrumAt (see the header): { area, clock, sky, skyLevel, table }. */
export function lightFrame(state, areaId = state?.places?.live?.area, ms = state?.clock?.ms ?? 0, skyMs = ms) {
  const area = areaOf(areaId);
  if (!area) return null;
  const clock = clockLighting(area.site, ms), dark = skyAt(area.site, ms).elevDeg < 0, skyLevel = skyAt(area.site, skyMs).level;
  return { area, clock, skyLevel, table: tableOf(area, clock, dark) };
}

/**
 * The light at (x, z) of a lightFrame, with its colour as the eyes take it: { level (lightLevel's), sp
 * (the scotopic to photopic ratio), sky (whether the open air's level can decide it: a point in no
 * room, or a room whose windows' daylight at the brightest sky would beat its fill under its lighting
 * now; the eyes hold such a field to the game minute) }.
 */
export function spectrumAt(F, x, z) {
  if (!F) return { level: 1, sp: SKY_SP, sky: true };
  const [pk, pw] = poolsSpAt(F.table, x, z);
  let base, baseSp, sky;
  const room = F.area.kind === 'ground' ? null : roomOf(F.area, x, z);
  if (!room) { base = F.skyLevel; baseSp = SKY_SP; sky = true; }
  else {
    const mood = CLASSES[classOf(room)]?.always ?? F.clock, fill = MOODS[mood].fill, daylight = room.windows ? WINDOW_K * F.skyLevel : 0;
    if (daylight > fill) { base = daylight; baseSp = SKY_SP; } else { base = fill; baseSp = MOODS[mood].sp ?? 1; }
    sky = !!room.windows && WINDOW_K * SKY_MAX_LEVEL > fill;
  }
  const sum = base + pk;
  return { level: q(Math.min(1, sum), LEVEL_STEP), sp: sum > 0 ? q((base * baseSp + pw) / sum, 0.0001) : 1, sky };
}

/** The light at (x, z) in an area (the live one by default) at game time ms, 0 to 1 (see the header). */
export function lightLevel(state, x, z, ms, areaId = state?.places?.live?.area) {
  const area = areaOf(areaId);
  if (!area) return 1;
  const F = frameOf(area, ms), pools = poolsAt(F.table, x, z);
  if (area.kind === 'ground') return q(Math.min(1, F.sky.level + pools), LEVEL_STEP);
  const room = roomOf(area, x, z);
  if (!room) return q(Math.min(1, F.sky.level + pools), LEVEL_STEP);
  const mood = CLASSES[classOf(room)]?.always ?? F.clock, fill = MOODS[mood].fill;
  const daylight = room.windows ? WINDOW_K * F.sky.level : 0;
  return q(Math.min(1, Math.max(fill, daylight) + pools), LEVEL_STEP);
}
