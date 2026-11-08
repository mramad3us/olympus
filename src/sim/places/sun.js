// OLYMPUS places: the sun over a site, and the canyon's horizon (TIME §1, §2.5; PLACES §3.15; the build sheet 0.0.3 §2.1, §8 item 5).
//
// One sun for everyone (VIEWS §2.7): the picture's key light, perception's light (light.js) and the
// clocks' sunrise all read sunAt, so the dusk on screen, in the dice and on the table are one number.
// TIME §2.5's definition, with no equation of time (the orbit is circular in the ephemeris: VIEWS
// dropped Mars24's true solar time, so "Mars24" here is its declination on the calendar's Ls):
//     δ = asin(sin MARS_OBLIQUITY_DEG × sin Ls)              the solar declination
//     H = 2π (meanSolarFrac − 0.5)                            the hour angle, from the site's mean solar time
//     sin elev = sin φ sin δ + cos φ cos δ cos H              φ the site's latitude (Melas 10.5° S)
//     az = atan2(sin H, cos H sin φ − tan δ cos φ) + 180°     from north, clockwise (tradecraft's sun())
// so the sun crosses the meridian at civil 12:00 exactly (TIME §2.4's slip centred on mean midnight).
// Ls is the calendar's (core/calendar.js lsDeg on SETTING's year), the mean solar fraction core's
// marsClock at the site's longitude: this module reads only core and data, so the stage may read it.
//
// horizonAt(site, az) is PLACES §3.15's profile: each of Melas Chasma's walls a straight crest parallel
// to the canyon's east–west axis (src/data/places/melas.js MELAS_WALLS: the south wall 8,000 m up 45 km
// off, the north wall 8,000 m up 150 km off), seen across Mars's curvature (MARS_R_KM 3,389.5):
//     for a wall at perpendicular distance D and rise H, at azimuth θ off its normal (|θ| < 90°):
//       s = D / cos θ;  h = atan((H − s² / (2R)) / s)
//     horizonAt(az) = max(h_south, h_north, HORIZON_MIN_DEG 1°)    (the far floor's mesas and fans)
// It gives 9.7° due south and 1.8° due north. A site with no horizon (the test rooms) has a flat one,
// 0°. sunAt's `visible` is the share of the disc above the horizon, 0 to 1: the disc is SUN_DISC_DEG
// 0.35° across from Mars (the Sun's 0.53° at 1 AU over Mars's 1.52 AU), so it clears a crest over
// about a minute and a half at Melas (the sun climbs about 0.24° a minute at sunrise), and the key
// light, the shadows and the street's step up come in over that time, never in a frame (v0.0.3's
// review: the canyon's sunrise snapped the whole picture between two frames). The share is the
// centre's height over the horizon across the disc's diameter (a linear limb, my call: the area of a
// circle's segment differs from it by under 0.06 and takes an acos), and `eclipsed` is a share of 0,
// the disc wholly under the horizon: the key light's off, the sky still follows the sun's geometric
// elevation (VIEWS §2.7). sunTimes finds a sol's rise and set by stepping a minute
// at a time and halving to the millisecond, with the terrain or on a flat horizon.
// Angles are rounded to 0.001° (q, TECH §8.1 rule 11) before anyone keeps them. This is Mars's sun:
// a site has a sun here only if it stands on Mars with a geo SETTING knows; any other site throws (no
// quiet Melas: TECH §1.4), and light.js asks env.js skyOf first, so a ship's sky is none and never
// reaches here (the sun by body waits for Europa: ROADMAP "anywhere"). Pure.
import { marsClock, yearsOf, lsDeg as lsOf, solStartMs } from '../../core/calendar.js';
import { SOL_MS, HOUR_MS, MIN_MS } from '../../core/clock.js';
import { q } from '../../core/num.js';
import * as SETTING from '../../data/setting/calendar.js';
import { MELAS_WALLS } from '../../data/places/melas.js';
import { SITE_LIST } from '../../data/places/sites.js';
import { BODIES } from '../../data/places/env.js';

/** Mars's obliquity, degrees (TIME §1), and its mean radius, km (PLACES §3.15's curvature): BODIES.mars's, their one home (src/data/places/env.js). */
export const MARS_OBLIQUITY_DEG = BODIES.mars.obliquityDeg;
export const MARS_R_KM = BODIES.mars.radiusKm;
/** The horizon is never under this where a site has walls: the far floor's mesas and fans, degrees (PLACES §3.15). */
export const HORIZON_MIN_DEG = 1;
/** Angles kept to this, degrees. */
export const ANGLE_STEP_DEG = 0.001;
/** The Sun's disc seen from Mars, degrees across (0.53° at 1 AU over 1.524 AU). */
export const SUN_DISC_DEG = 0.35;
/** The disc's visible share kept to this. */
export const VISIBLE_STEP = 0.0001;

const YEARS = yearsOf(SETTING), D2R = Math.PI / 180;
// (each site's latitude, longitude and walls: SETTING's site record, PLACES's walls)
const HORIZONS = Object.freeze({ melas: MELAS_WALLS });
const SITE_GEO = Object.freeze(Object.fromEntries(SITE_LIST.filter(s => s.body === 'mars' && SETTING.SITES[s.geo]).map(s => [s.id, Object.freeze({ ...SETTING.SITES[s.geo], walls: HORIZONS[s.horizon] ?? null })])));
const geoOf = (siteId) => { const g = SITE_GEO[siteId]; if (!g) throw new Error(`sun: no Martian site '${siteId}' with a known geo`); return g; };

/** The solar declination at a game time, degrees: asin(sin 25.19° × sin Ls). */
export const declinationDeg = (ms) => Math.asin(Math.sin(MARS_OBLIQUITY_DEG * D2R) * Math.sin(lsOf(ms, YEARS) * D2R)) / D2R;

/** The terrain's horizon at an azimuth (degrees from north, clockwise) at a site, degrees (see the header). */
export function horizonAt(siteId, azDeg) {
  const w = geoOf(siteId).walls;
  if (!w) return 0;
  let h = HORIZON_MIN_DEG;
  for (const [normal, D, H] of [[180, w.southKm, w.southRiseM / 1000], [0, w.northKm, w.northRiseM / 1000]]) {
    let th = ((azDeg - normal) % 360 + 540) % 360 - 180;           // (−180 to 180 off the wall's normal)
    if (Math.abs(th) >= 90) continue;
    const s = D / Math.cos(th * D2R), e = Math.atan((H - (s * s) / (2 * MARS_R_KM)) / s) / D2R;
    if (e > h) h = e;
  }
  return q(h, ANGLE_STEP_DEG);
}

// (the sun's geometric place, unrounded)
function sunRaw(siteId, ms) {
  const g = geoOf(siteId), phi = g.latDeg * D2R, dec = declinationDeg(ms) * D2R;
  const H = 2 * Math.PI * (marsClock(ms, g.lonEDeg).meanSolarFrac - 0.5);
  const elev = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H)) / D2R;
  const az = ((Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi)) / D2R + 180) % 360 + 360) % 360;
  return { elev, az };
}

let last = { site: null, ms: NaN, out: null };
/** The sun over a site at a game time: { elevDeg, azDeg, horizonDeg, visible (the disc's share above the horizon, 0 to 1), eclipsed (none of it) } (geometric; the horizon at its azimuth). */
export function sunAt(siteId, ms) {
  if (last.site === siteId && last.ms === ms) return last.out;
  const { elev, az } = sunRaw(siteId, ms), elevDeg = q(elev, ANGLE_STEP_DEG), azDeg = q(az, ANGLE_STEP_DEG), horizonDeg = horizonAt(siteId, azDeg);
  const visible = q(Math.min(1, Math.max(0, 0.5 + (elevDeg - horizonDeg) / SUN_DISC_DEG)), VISIBLE_STEP);
  const out = Object.freeze({ elevDeg, azDeg, horizonDeg, visible, eclipsed: visible === 0 });
  last = { site: siteId, ms, out };
  return out;
}

// (the sun's height over the horizon that counts: the terrain's, or a flat one)
const over = (siteId, ms, terrain) => { const s = sunAt(siteId, ms); return s.elevDeg - (terrain ? s.horizonDeg : 0); };
// (the first ms in [a, b] where up(t) turns from below 0 to at or over it (rise) or back (set), by minutes then halving)
function crossing(siteId, a, b, terrain, rising) {
  const ok = (t) => (rising ? over(siteId, t, terrain) >= 0 : over(siteId, t, terrain) < 0);
  if (ok(a)) return a;
  let lo = a, hi = null;
  for (let t = a + MIN_MS; t <= b; t += MIN_MS) { if (ok(t)) { hi = t; break; } lo = t; }
  if (hi === null) return null;
  while (hi - lo > 1) { const mid = Math.floor((lo + hi) / 2); if (ok(mid)) hi = mid; else lo = mid; }
  return hi;
}

/**
 * The sol holding ms at a site: { riseMs, setMs, dayH, noonElevDeg }, the sunrise and sunset over the
 * canyon's horizon (terrain true) or a flat one, to the millisecond; noon is civil 12:00.
 */
export function sunTimes(siteId, ms, { terrain = true } = {}) {
  const start = solStartMs(ms, geoOf(siteId).lonEDeg), noon = start + 12 * HOUR_MS;
  const riseMs = crossing(siteId, start, noon, terrain, true), setMs = crossing(siteId, noon, start + SOL_MS, terrain, false);
  return { riseMs, setMs, dayH: riseMs !== null && setMs !== null ? q((setMs - riseMs) / HOUR_MS, 0.0001) : null, noonElevDeg: sunAt(siteId, noon).elevDeg };
}
