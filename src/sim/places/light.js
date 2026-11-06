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
//   lightingOf(...)   a room's state by Melas civil time (TIMES: day from reveille, 05:30 on a weekday
//                     and 07:00 on Saturday and Sunday, the weekday SETTING's week as the watch reads
//                     it (its years and WEEK_OFFSET: dates.js's one helper), to 18:00; evening to taps at 22:00; lights out
//                     from taps to reveille and through the slip), as its lighting class takes it (a
//                     head's 'evening' at every hour: heads stay lit).
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
// A call costs a room lookup and the lamps of one 4 m bin: the clock's state, the sky and the lamps'
// bins are kept per (area, ms) (one frame's calls share them), so the per-call work is small and
// allocates nothing. Pure (its caches are of pure functions).
import { marsClock, yearsOf } from '../../core/calendar.js';
import { HOUR_MS } from '../../core/clock.js';
import { q } from '../../core/num.js';
import * as SETTING from '../../data/setting/calendar.js';
import { MARS_ROWS, MOODS, CLASSES, CLASS_OF_KIND, WINDOW_K, LAMP_KINDS, TIMES } from '../../data/places/sky.js';
import { areaOf, siteOf, roomOf } from './model.js';
import { sunAt } from './sun.js';

export { WINDOW_K, TIMES };
/** A light level is kept to this. */
export const LEVEL_STEP = 0.0001;
/** The pools' bin, metres (TECH §9.6's 4 m grid). */
export const POOL_BIN_M = 4;
const WEEKEND = new Set([5, 6]);                                   // (Saturday and Sunday: SETTING's week, Monday 0)
// (SETTING's years, WEEK_OFFSET with them: the weekday the watch and the weekly jobs read, src/sim/time/dates.js)
const YEARS = yearsOf(SETTING), SITES = SETTING.SITES;

const lerp = (a, b, k) => a + (b - a) * k;
const lerpHex = (a, b, k) => {
  if (a === null || b === null) return a ?? b;
  const ch = (h, s) => (h >> s) & 255;
  return (Math.round(lerp(ch(a, 16), ch(b, 16), k)) << 16) | (Math.round(lerp(ch(a, 8), ch(b, 8), k)) << 8) | Math.round(lerp(ch(a, 0), ch(b, 0), k));
};
const lonOfSite = (siteId) => (SITES[siteOf(siteId)?.geo] ?? SITES.melas).lonEDeg;

/** The clock's lighting state at a site by Melas civil time: 'day' | 'evening' | 'lightsOut' (see the header). */
export function clockLighting(siteId, ms) {
  const c = marsClock(ms, lonOfSite(siteId), YEARS);
  if (c.timeslip) return 'lightsOut';
  const h = c.civilMs / HOUR_MS, reveille = WEEKEND.has(c.weekday) ? TIMES.REVEILLE_WEEKEND_H : TIMES.REVEILLE_H;
  return h < reveille || h >= TIMES.TAPS_H ? 'lightsOut' : h < TIMES.EVENING_H ? 'day' : 'evening';
}
const classOf = (room) => room?.lighting ?? CLASS_OF_KIND[room?.kind] ?? 'office';

/** A room's lighting state at a game time: 'day' | 'evening' | 'lightsOut', as its lighting class takes the clock's. */
export function lightingOf(state, areaId, roomId, ms) {
  const area = areaOf(areaId), room = area?.rooms?.find(r => r.id === roomId) ?? null;
  return CLASSES[classOf(room)]?.always ?? clockLighting(area?.site ?? 'melas', ms);
}

// ---- the open air ----

let skyLast = { site: null, ms: NaN, out: null };
/** The open air at a site: { elevDeg, azDeg, visible, eclipsed, sunColor, sunK, skyColor, skyK, ground, tint: [r, g, b], glow, shadow, level }. */
export function skyAt(siteId, ms) {
  if (skyLast.site === siteId && skyLast.ms === ms) return skyLast.out;
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
  skyLast = { site: siteId, ms, out };
  return out;
}

// ---- the lamps ----

let lampCache = new Map();                                         // (area id → { key → { list, bins } })
/** Forget the lamp tables (TECH §2.3). */
export function resetCaches() { lampCache = new Map(); skyLast = { site: null, ms: NaN, out: null }; frameLast = null; }

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
    return Object.freeze({ i, x: l.x, z: l.z, y: l.y ?? 3.0, r: K.r ?? l.r ?? 0, core: K.core, ring: K.ring, kind: l.kind ?? 'ceiling', color: K.color, room: l.room ?? null, on: litNow(l.kind ?? 'ceiling', st, dark) });
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
