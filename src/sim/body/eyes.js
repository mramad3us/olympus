// OLYMPUS body: the eyes' adaptation to the light, into the dark slowly and back into the light in seconds (BODY §2's one body; PEOPLE §7.1's sight by light; the user's ask of 2026-11-06).
//
// The user, scoring v0.0.4's test-night (2026-11-06): "Would be nice to have eye adapting to darkness
// making things less dark after a while in the dark compared to when entering dark from a lit place".
// Every person's eyes carry an adaptation state, plain data on the body record (body.eyes), which
// follows the light the eyes receive; perception's reach and the picture's exposure both read it
// through one helper, eyeView(), so what you see on the screen is what the dice see.
//
// The light as the eye takes it. places' lightLevel L (0 to 1) is a brightness scale: perception's reach
// is linear in it. Brightness goes as luminance to the power 0.33 (Stevens' power law for brightness,
// exponent 0.33: S. S. Stevens, Psychophysics, 1975), so luminance goes as L cubed: Y = 100 cd/m² ×
// (L / 0.75)^3, a lit room's 0.75 being 100 cd/m² (an office's surfaces under 500 lux). The squad bay at
// lights out (0.04) is then 0.015 cd/m², the lit head (0.65) 65 cd/m²: 3.63 log units apart, the human
// eye's range "from room light" into the dark (3 to 4 log units). Every state below is a log10 cd/m²,
// and a light's colour enters by its scotopic to photopic ratio sp (src/data/places/sky.js: the rods'
// share against the cones'), Y_S = Y × sp: the rods follow the scotopic light, the cones the photopic.
// The light the eyes receive is the field (perception's fieldOf): the mean luminance over the eye's spot
// and fifteen points in front of it that it has a clear line to, so a lamp in view counts and one behind
// a wall does not; with the eyes shut (asleep, BODY's sleep) the lids pass LID_P 3% of the photopic
// light and LID_S 1% of the scotopic (the lid passes red best: Robinson, Bayliss and Fielder 1991;
// Bierman, Figueiro and Rea 2011, about 1% in the blue-green to some 10% in the deep red; my rounding),
// so a sleeper in a dark bay wakes fully dark-adapted.
//
// Three processes, each a state x that follows its target T (the field's level for it, never below
// its floor F): falling (T < x) along F + (x − F)·e^(−t/τ_down), stopping at T; rising (T > x) along
// T + (x − T)·e^(−t/τ_up). Both are exact closed forms that compose (an advance over [a, c] equals
// [a, b] then [b, c]), so lived ticks and a skip give the same eyes:
//   c   the cones: τ_down CONE_DOWN_MS 2 min to their floor CONE_FLOOR_LOG 0 (1 cd/m²), so the cones'
//       branch reaches its plateau 7 minutes into the dark (within 0.06 log units), as the classic curve
//       has it (Hecht, Haig and Chase 1937: the plateau at 5 to 10 minutes; cone pigment regenerates
//       with a time constant near 2 minutes, Rushton and Henry 1968); τ_up UP_MS 1 s;
//   rn  the rods' neural adaptation: τ_down ROD_NEURAL_MS 30 s, τ_up 1 s, to the rods' floor
//       ROD_FLOOR_LOG −2.1 (the dark the game's eye adapts to: 0.008 cd/m², lightLevel 0.034);
//   rb  the rods' bleaching: τ_down ROD_DOWN_MS 13 min to the rods' floor, τ_up ROD_BLEACH_MS 6 min
//       (rhodopsin bleaches toward its level in a lit room over minutes: Rushton 1961's regeneration
//       near 400 s), so a glance into a lit room costs a minute or two of dark adaptation and an evening
//       under the overheads costs the whole curve.
// The rods' state is r = max(rn, rb), and the eye's adapted level, in the field's photopic terms, is
// a = min(c, r − log10 sp_field): whichever system is the more sensitive leads, and a red light, which
// the rods hardly see, is read by the cones. Out of the lit head (65 cd/m²) into the bay at lights out
// (the head's warm overheads at sp 1.25, the bay's 1.0): a 1.81 at 0 s, 1.10 at 1 minute, 0.15 at 5, the
// cones' plateau 0 by 7, the rod-cone break at 8.3 (the rods pass the cones' plateau), −0.24 at 10,
// −1.24 at 20, the bay's own −1.82 at 34 (the rods' branch at full sensitivity in about 30 to 40
// minutes, the classic curve's: Hecht et al. 1937; Lamb and Pugh 2004, Prog Retin Eye Res 23:307),
// 3.63 log units in all; eyes-model prints it. Back into the light the cones and the rods' neural part
// rise with τ 1 s: a short glare (the picture's bloom) settling in 3 to 5 seconds. A red lamp spares
// the rods: the fire watch's red LED (sp 0.04) at a given brightness leaves the rods 1.6 log units
// darker-adapted than a white lamp as bright (sp 1.5).
//
// What it gives (eyeView(rec, ms), the one helper; eyesAdaptedTo() for a body with no record):
//   gain     the picture's exposure against v0.0.4's (the post pass's uniform): (Y_ref / Y_a)^0.2, Y_a
//            the adapted level and Y_ref the field's luminance or REF_LOG's 1.4 cd/m² where the field is
//            darker; 0.2 is the picture's own law (src/render/light-maps.js exposure: L^0.6, so Y^0.2).
//            v0.0.4's fixed exposure was an eye adapted to the light it stands in, as far as five
//            minutes in the dark take it (the user rated that night "pretty perfect"): REF_LOG 0.15 is
//            the eye five minutes in from the lit head, so there the gain is 1, just in from a lit place
//            0.47, fully adapted 2.48; in any lit place at rest 1. Over 1 (an eye more adapted than its
//            field: the lights come on, a door opens onto a lit hall) it is the glare, shown as a bloom;
//   coneGain the same for what the cones see, (Y_ref / Y_c)^0.2 with the cones' own state c (never over
//            gain): a lamp's lit pool and a red light, which the rods hardly see, are the cones', and the
//            cones stop at their plateau, so a dark-adapted eye sees them as v0.0.4 showed them (1.07
//            fully adapted) while the dim surfaces the rods see lighten by gain (the review of v0.0.5's
//            eyes: one gain took the fire watch's red pool to twice its brightness, toward salmon); the
//            post pass mixes the two per pixel by how much of it the rods see;
//   lightK   perception's light factor (PEOPLE §7.1's reach, 10 m + 42 m × light): the light as the
//            adapted eye takes it is L × lightK, and the dark floor's 10 m is scaled by lightK under 1,
//            lightK = (Y_ref / Y_a)^(1/3), the same quantity as gain (gain = lightK^0.6), so the picture
//            and the dice agree. In a glare (Y_a under the field) perception reads the field at rest,
//            (Y_ref / Y_field)^(1/3), and only the picture blooms (my call: a reach that collapsed for
//            the second the lights come on was a blind moment the sim's unseen-only changes used, the
//            fire watch gone from the post at reveille, a pop time-placement caught). In the bay at
//            23:00: 3.3 m just in from the head, 11.7 m (v0.0.4's) at five minutes, 17.6 m fully
//            adapted (eyes-sight prints them);
//   rod      the rods' share of vision, (CONE_FLOOR_LOG − a) / (CONE_FLOOR_LOG − ROD_FLOOR_LOG) in 0 to 1:
//            0 at five minutes, 0.87 fully adapted in the bay; the post pass takes colour from the dim
//            pixels by it and shifts them a little toward blue-green (rod vision has no colour: the
//            Purkinje shift), leaving a lamp's lit pool its colour (the cones see it);
//   shut, nv while the eyes are shut the picture is the splash's and the gain 1; with a night-vision
//            device in front of them (nv) likewise.
// Night vision (not built yet: VIEWS §16, ROADMAP's 0.6): with a helmet's or a suit's night vision on,
// the picture is the device's and the eye's adaptation is not shown, nor read by perception (the
// device's own rule, PEOPLE §7.2's, comes with it); the eyes keep adapting underneath to the light they
// receive, so taking the device off shows the eye as it is. The device sets body.eyes.nv (setNightVision),
// the one flag.
//
// The record (rounded, saved; TECH §8.1 rule 11): body.eyes = { atMs, c, rn, rb (log10 cd/m² at atMs,
// to 1e-6), yp, ys (the field's photopic and scotopic log10 luminance at the retina, held since atMs, to
// 1e-6), key (places' lightKeyOf at atMs), sky (the open air's level at atMs's minute, when the field
// reads the open air), shut (1 while the lids are closed), nv }. Its absence is an eye adapted to the
// light it stands in (eyesAdaptedTo): a new game's eyes and a v0.0.3 or v0.0.4 save's, so no upgrade
// writes them (a load must not move a new save: body-skip, places-validate); the player's first tick
// anchors them there at the clock, which is the save's on a load. The state at any ms is the closed form
// from atMs, so nothing is stepped per tick: the eyes are anchored again (the state at that instant, the
// new field) only when what they receive changes, at the exact millisecond, by eyesStep:
//   - the light's steps (places' lightKeyOf: taps, reveille, the evening, the dark rule at sunset),
//     found to the millisecond by halving, the same lived or skipped;
//   - the open air's level, held to the game minute (a field that reads the sky: outdoors, a room's
//     windows where daylight can beat its fill), at the minute; a skip steps to the minutes it changes
//     (skyChangeMs: at dawn and dusk), else by the hour;
//   - the lids: closing at the body's fallMs, opening at its wokeMs (or the instant the sleep ends);
//   - the eyes' own move (look: lived only, a skip never moves them), each tick the field differs (read
//     again only when the eye moved, turned, changed posture or a door changed what it sees: lookSig).
// The player is stepped live, at each tick (the bodyFast layer: the cheap check of the light's key, the
// field's fifteen samples only when it moved or the key changed) and in a skip at each slow step; anyone
// else's are computed when read, at rest in the light they stand in then (eyesAdaptedTo, no record:
// the cheaper way; no one else's sight is read this round, and when NPC sightings come, 0.0.10, their
// record is the same one, anchored when read).
// Pure (the model); eyesStep reads the state it is given.
import { MIN_MS } from '../../core/clock.js';
import { q } from '../../core/num.js';
import { lightKeyOf, skyAt } from '../places/light.js';
import { areaOf } from '../places/model.js';

/** The light level whose luminance is ROOM_LOG_CD (a lit room), and luminance's power of the level (Stevens: brightness ∝ Y^0.33). */
export const ROOM_LEVEL = 0.75, ROOM_LOG_CD = 2, BRIGHTNESS_EXP = 3;
/** The darkest a state reads, log10 cd/m² (a level of 0: pitch dark, far under every floor). */
export const DARK_LOG = -8;
/** The floors: the cones' plateau and the dark the rods adapt to, log10 cd/m². */
export const CONE_FLOOR_LOG = 0, ROD_FLOOR_LOG = -2.1;
/** The time constants, ms: the cones' fall, the rods' neural fall, the bleach's fall and rise, and every rise into the light. */
export const CONE_DOWN_MS = 120_000, ROD_NEURAL_MS = 30_000, ROD_DOWN_MS = 780_000, ROD_BLEACH_MS = 360_000, UP_MS = 1_000;
/** The closed lids' share of the photopic and of the scotopic light. */
export const LID_P = 0.03, LID_S = 0.01;
/** The adapted level v0.0.4's fixed exposure stands for in the dark: the eye five minutes in from the lit head, log10 cd/m². */
export const REF_LOG = 0.15;
/** The picture's exposure law, a power of the level (src/render/light-maps.js ADAPT_GAMMA), and so of luminance PICTURE_GAMMA / BRIGHTNESS_EXP. */
export const PICTURE_GAMMA = 0.6, PICTURE_EXP = PICTURE_GAMMA / BRIGHTNESS_EXP;
/** The picture's gain at most (the first instant of a glare: a white screen, not a brighter one). */
export const GAIN_MAX = 4;
/** A state's and a field's resolution, log10 units (1e-6: a part in 400,000 of luminance). */
export const LOG_STEP = 1e-6;

const LOG_LID_P = Math.log10(LID_P), LOG_LID_S = Math.log10(LID_S);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const r6 = (x) => q(x, LOG_STEP);

/** A light level's luminance, log10 cd/m² (see the header). */
export const logCdOf = (L) => (L > 0 ? Math.max(DARK_LOG, ROOM_LOG_CD + BRIGHTNESS_EXP * Math.log10(L / ROOM_LEVEL)) : DARK_LOG);
/** The light level of a luminance given as log10 cd/m². */
export const levelOfLog = (a) => ROOM_LEVEL * 10 ** ((a - ROOM_LOG_CD) / BRIGHTNESS_EXP);

/** A field from mean luminances (cd/m², photopic and scotopic) at the open eye, the lids applied when shut: { yp, ys }. */
export function fieldFrom(yP, yS, shut = false) {
  const lp = yP > 0 ? Math.max(DARK_LOG, Math.log10(yP)) : DARK_LOG, ls = yS > 0 ? Math.max(DARK_LOG, Math.log10(yS)) : DARK_LOG;
  return { yp: r6(shut ? lp + LOG_LID_P : lp), ys: r6(shut ? ls + LOG_LID_S : ls) };
}

// (one process over dt: falling to its floor F, stopped at T; or rising to T)
function follow(x0, T, F, downMs, upMs, dt) {
  if (x0 > T) return Math.max(T, F + (x0 - F) * Math.exp(-dt / downMs));
  if (x0 < T) return T + (x0 - T) * Math.exp(-dt / upMs);
  return T;
}

/** The three processes at ms from the record's anchor (the closed form, see the header): { c, rn, rb }. */
export function eyesAt(rec, ms) {
  const dt = Math.max(0, ms - rec.atMs);
  const tc = Math.max(rec.yp, CONE_FLOOR_LOG), tr = Math.max(rec.ys, ROD_FLOOR_LOG);
  if (dt === 0) return { c: rec.c, rn: rec.rn, rb: rec.rb };
  return {
    c: follow(rec.c, tc, CONE_FLOOR_LOG, CONE_DOWN_MS, UP_MS, dt),
    rn: follow(rec.rn, tr, ROD_FLOOR_LOG, ROD_NEURAL_MS, UP_MS, dt),
    rb: follow(rec.rb, tr, ROD_FLOOR_LOG, ROD_DOWN_MS, ROD_BLEACH_MS, dt),
  };
}

/** The eye's adapted level for a field (log10 cd/m², photopic terms): the more sensitive system's (see the header). */
export const adaptedLog = (st, field) => Math.min(st.c, Math.max(st.rn, st.rb) - (field.ys - field.yp));

/** The three processes adapted to a field at rest: { c, rn, rb }. */
export const restingIn = (field) => ({ c: Math.max(field.yp, CONE_FLOOR_LOG), rn: Math.max(field.ys, ROD_FLOOR_LOG), rb: Math.max(field.ys, ROD_FLOOR_LOG) });

/**
 * What the eye makes of its field at a state (see the header): { a, yp, gain, coneGain, lightK, rod, glare,
 * shut, nv }. One helper: the picture's gain and perception's lightK are the same quantity.
 */
export function viewOf(st, field, { shut = false, nv = false } = {}) {
  const a = adaptedLog(st, field), yp = field.yp;
  if (shut || nv) return { a: q(a, 0.0001), yp, gain: 1, coneGain: 1, lightK: shut ? 0 : 1, rod: 0, glare: 0, shut: !!shut, nv: !!nv };
  const ref = Math.max(yp, REF_LOG);
  const gain = Math.min(GAIN_MAX, 10 ** (PICTURE_EXP * (ref - a)));
  const coneGain = Math.min(gain, 10 ** (PICTURE_EXP * (ref - st.c)));
  const lightK = 10 ** ((ref - Math.max(a, yp)) / BRIGHTNESS_EXP);
  const rod = clamp01((CONE_FLOOR_LOG - a) / (CONE_FLOOR_LOG - ROD_FLOOR_LOG));
  return { a: q(a, 0.0001), yp, gain: q(gain, 0.0001), coneGain: q(coneGain, 0.0001), lightK: q(lightK, 0.0001), rod: q(rod, 0.0001), glare: q(Math.max(0, yp - a), 0.0001), shut: false, nv: false };
}

/** The eye of a record at ms: viewOf its closed form and its field. */
export const eyeView = (rec, ms) => viewOf(eyesAt(rec, ms), rec, { shut: !!rec.shut, nv: !!rec.nv });

/** The view of eyes adapted to a field at rest (a body with no record: see the header). */
export const eyesAdaptedTo = (field, opts = {}) => viewOf(restingIn(field), field, opts);

// ---- the record ----

/** A record anchored at ms with field f (its yp, ys), from the processes st, the light's key and sky, the lids, the device. */
export function anchored(st, ms, f, { key = null, sky = null, shut = false, nv = false } = {}) {
  const rec = { atMs: ms, c: r6(st.c), rn: r6(st.rn), rb: r6(st.rb), yp: f.yp, ys: f.ys, key };
  if (sky !== null && sky !== undefined) rec.sky = sky;
  if (shut) rec.shut = 1;
  if (nv) rec.nv = true;
  return rec;
}

/** Whether the lids are shut at t by a sleep record ({ bed, fallMs, wokeMs }): asleep from fallMs until wokeMs. */
export const shutAt = (sleep, t) => !!sleep?.bed && Number.isFinite(sleep.fallMs) && t >= sleep.fallMs && !(Number.isFinite(sleep.wokeMs) && t >= sleep.wokeMs);

// (the site whose light the eyes are under: the live area's)
const siteNow = (state) => areaOf(state?.places?.live?.area)?.site ?? null;
const floorMin = (ms) => Math.floor(ms / MIN_MS) * MIN_MS;

/**
 * The record anchored again at `at` for what the eyes receive then: fieldAt(at, shut) → { yp, ys, sky
 * (whether it reads the open air) }, the light's key and the sky's level at its minute, the lids by the
 * body's sleep. Pure but for fieldAt.
 */
export function anchorAt(state, rec, at, sleep, fieldAt) {
  const site = siteNow(state), shut = shutAt(sleep, at), f = fieldAt(at, shut);
  const st = rec ? eyesAt(rec, at) : restingIn(f);
  return anchored(st, at, f, { key: site ? lightKeyOf(site, at) : null, sky: f.sky && site ? skyAt(site, floorMin(at)).level : null, shut, nv: !!rec?.nv });
}

/**
 * The first instant in (rec.atMs, toMs] at which what the eyes receive changes by time alone (see the
 * header: the lids, the light's steps, the open air's minute), or null.
 */
export function nextChange(state, rec, sleep, toMs) {
  if (!(toMs > rec.atMs)) return null;
  let best = null;
  const take = (t) => { if (t > rec.atMs && t <= toMs && (best === null || t < best)) best = t; };
  const shutNow = shutAt(sleep, toMs);
  if (shutNow !== !!rec.shut) {
    if (shutNow) take(Math.ceil(sleep.fallMs));
    else take(Number.isFinite(sleep?.wokeMs) ? Math.ceil(sleep.wokeMs) : toMs);
  }
  const site = siteNow(state);
  if (site) {
    if (lightKeyOf(site, toMs) !== rec.key) {
      // (the first millisecond whose key is not the anchor's: the key steps at most once between two checks)
      let lo = rec.atMs, hi = toMs;
      while (hi - lo > 1) { const mid = Math.floor((lo + hi) / 2); if (lightKeyOf(site, mid) !== rec.key) hi = mid; else lo = mid; }
      take(hi);
    }
    if (rec.sky !== undefined) { const m = floorMin(toMs); if (m > rec.atMs && skyAt(site, m).level !== rec.sky) take(m); }
  }
  return best;
}

/** How far ahead skyChangeMs looks for the open air's next minute of change, ms (a day skip's hour). */
export const SKY_LOOK_MS = 60 * MIN_MS;
/**
 * When the open air a record's field reads may next change, for a skip's steps: the first game minute
 * after t0's whose sky level differs from t0's minute's (the dawn's and the dusk's minutes, while the sun
 * is in the rows' elevations or the canyon's walls cut its disc), else SKY_LOOK_MS on to look again;
 * Infinity for a field that does not read the sky. Lived ticks and a skip's steps anchor the eyes at the
 * same minutes so (the review of v0.0.5's eyes: every minute was a step, a day skip from a windowed bay
 * 1,440 steps a sol).
 */
export function skyChangeMs(state, rec, t0) {
  const site = siteNow(state);
  if (!rec || rec.sky === undefined || !site) return Infinity;
  const m0 = floorMin(t0), L0 = skyAt(site, m0).level;
  for (let m = m0 + MIN_MS; m < m0 + SKY_LOOK_MS; m += MIN_MS) if (skyAt(site, m).level !== L0) return m;
  return m0 + SKY_LOOK_MS;
}

/**
 * Bring a person's eyes to toMs (see the header): anchored again at each change time brings, then, with
 * look (lived ticks), for the eyes' own move: fieldAt(toMs, shut) against the anchor's. Writes
 * people[pid].body.eyes; returns it (null for a body the game does not simulate).
 */
export function eyesStep(state, pid, toMs, fieldAt, { look = false, lookSig = null } = {}) {
  const p = state?.people?.[pid];
  if (!p?.body || !Number.isFinite(p.body.atMs)) return null;
  const sleep = p.body.sleep ?? null;
  let rec = p.body.eyes;
  if (!rec || !Number.isFinite(rec.atMs)) return (p.body.eyes = anchorAt(state, null, toMs, sleep, fieldAt));
  for (let n = 0; n < 16; n++) {
    const at = nextChange(state, rec, sleep, toMs);
    if (at === null) break;
    rec = p.body.eyes = anchorAt(state, rec, at, sleep, fieldAt);
  }
  // (the eyes' own move: the field read again only when where they are and what they look along changed,
  // lookSig, kept runtime-only on the record: an unchanged eye in an unchanged light has the anchor's field)
  if (look && toMs >= rec.atMs && (lookSig === null || rec.$look !== lookSig)) {
    const f = fieldAt(toMs, !!rec.shut);
    if (f.yp !== rec.yp || f.ys !== rec.ys || !!f.sky !== (rec.sky !== undefined)) rec = p.body.eyes = anchorAt(state, rec, toMs, sleep, () => f);
    if (lookSig !== null) Object.defineProperty(rec, '$look', { value: lookSig, writable: true, configurable: true, enumerable: false });
  }
  return rec;
}

/** Set or clear the night-vision flag (the device's, when it comes: see the header), anchored at ms. Writes the record. */
export function setNightVision(state, pid, on, ms, fieldAt) {
  const rec = eyesStep(state, pid, ms, fieldAt);
  if (rec) { if (on) rec.nv = true; else delete rec.nv; }
  return rec;
}
