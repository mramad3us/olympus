// OLYMPUS audio: the gunshot rebuilt (v0.0.16): the muzzle's blast, the bullet's crack, the action's clack, the space's answer, the hearing protection.
//
// The user, 2026-11-15, of v0.0.15's sound: "Sound design is pretty weak, guns should bang harder and closer to realistic, I'm sure
// you can figure out how to do that, steps are too loud". The old report (src/data/sounds.js RANGE.report: low-passed noise with
// a 0.3 ms attack, heard through a 2 kHz low-pass under the defenders and the suit) was a dull thump; this module makes the shot
// from its physics, by code, with no audio file and no Math.random (the noise is the game's sfc32 on a stream named for the part:
// the same samples on every machine and every run, src/core/rng.js stream). Every number here is my call, unscored.
//
// A shot is four parts, each rendered into samples (renderDry, renderTail), then played by the engine as two or three voices:
//   the blast   the muzzle's pressure wave as a Friedlander pulse, p(t) = (1 − t/T) e^(−b t/T): a rise of two samples (40 µs at
//               48 kHz), its positive phase T long (the R-7's 6.5 mm from a 460 mm barrel 1.1 ms at the shooter's ear, the
//               P-12's 9 mm from 110 mm 0.55 ms) and its shallow negative phase after; the powder gas's turbulence riding it
//               (white noise band-passed 220 Hz to 6.5 kHz, a 0.15 ms attack and a decay of 5 ms, the pistol's 380 Hz to 7.5 kHz
//               and 3 ms, and a slower, darker gust under it); and the thump felt in the chest (a sine falling 120 to 50 Hz over
//               30 ms, the pistol's 170 to 85 Hz over 18 ms, 5 dB lighter). The sum is saturated (tanh of drive × it: 1.5, the
//               pistol's 1.4), as the air by a muzzle and every microphone saturate, so the shot is dense and not a click. Its
//               first 2 to 5 ms are the loudest: the pulse and the gas's attack.
//   the crack   a supersonic round's shock as it passes (the shot's flight.supersonic; none for a blank): an N-wave of 0.28 ms
//               (the pistol's 0.16 ms, weaker, its round barely over Mach 1), faint at the shooter's ear behind the muzzle
//               (−9 dB, −14), ahead of the blast for a listener off the line (far: 2 ms before it, −3 dB, −9).
//   the action  your own gun's mechanism, at the hands: the R-7's gas-driven carrier unlocking at 9 ms (a steel clack, its
//               ring at 3.1 and 4.7 kHz, under the blast), the case leaving at 12 ms (a brass ping at 7.5 kHz), the carrier
//               into its buffer at 34 ms (a knock at 1.8 and 3.6 kHz) and its spring's twang, home again at 74 ms (its 700
//               rounds a minute); the P-12's slide unlocking at 4 ms, at its stop at 14 ms (3.2 kHz) and home at 38 ms
//               (4.4 kHz), higher and lighter. Nobody else's action is heard.
//   the space   the place's answer, a stereo tail without the direct sound: in a room (the shoot house's hard panels: inHouse,
//               or any area that is not a ground) the floor's bounce at 4.5 ms, the panels' first reflections over 2 to 5 m
//               (HALL's paths: 12 to 29 ms), a dense second order to 85 ms and a short diffuse tail (RT60 0.55 s, its highs
//               dying at 0.3 s); on an outdoor range a dry, longer rolling echo: the ground's bounce, the bay's side berms at
//               41 to 95 ms ('bay', where the berm in front is under BAY_PATH_M there and back), else ('open', the KD's 300 m
//               line) a few near taps; then a scatter of soft, smeared, low-passed echoes off far ground (0.25 to 1.6 s on the
//               bay, 0.4 to 2.6 s in the open) over a low rumble. The berm's slap-back is the range's geometry (range.js echoOf,
//               at the place's speed of sound), a voice of its own; the tails' reflection paths are baked at SPACE_SOUND_MS
//               (343 m/s, my call: within 6% of every air the game has; nothing assumes Mars).
//   the ears    electronic hearing protection (the combat EVA suit's active hearing filter; the ear defenders of the range and
//               the din, ears-m1 and ed1), protect(): the microphones' band (160 Hz to 7 kHz) through a limiter that catches
//               the blast in 0.2 ms and holds it driveDb (6 dB) over its ceiling (PROTECT.ceilingDb, −8 dB under the open
//               shot) into a soft clip at 1.25 × the ceiling, so the bang is clipped dense, hard and close, not muffled;
//               released over 20 ms (the action's clacks and the room's first reflections a little ducked, then the tail at
//               its own level); and the cups' or the helmet's passive leak under it (−28 dB, low-passed at 600 Hz: the thump
//               still felt). At play the electronics' make-up (PROTECT_AT: the suit's +4 dB, its speakers to 6 kHz; the
//               defenders' +4 dB, to 7 kHz). Every gunshot the game has is far over their cut-off, so worn they clamp
//               another's shot and an echo too, its distance's fall compressed to PROTECT_DIST_K (half) of the open's.
// Distance and direction (otherShot): another's shot (the #2 in the house, the relay on the line, the coach's blank) comes a
// sound's way late (d / c, the place's), inverse with distance from 1 m by the area's rolloff (1.5 indoors, 1 outdoors), low-passed
// by the air and the distance (range.js distLowpassHz), panned by its offset east or west (PAN_FULL_M, the range's convention:
// the screen's left and right); its space's answer falls off far slower (a room's diffuse field: TAIL_DIST_K of the direct's fall,
// never below TAIL_FAR_MIN_DB). Levels are against the open shot at your ear (OWN_DB over a buffer's peak, the R-7 +2.9 dB over the
// P-12 by its model's loud, 1.4 against 1.0), through the place's air (airDb: in vacuum −Infinity, nothing airborne). The engine's
// new master (mix.js MASTER) limits all of it, so a string of open shots slams the limiter and nothing clips.
//
// v0.0.20 (the build sheet v0.0.20 item 2, §0 item 21; the user, 2026-11-15: "guns should bang harder"): the shot is one of
// src/data/sounds.js SHOT_CANDIDATES, each a set of numbers read over the built ones here (gunWith: the gas's and the gust's
// decays, the thump's length and level; protectOf: the protection's ceiling carried by the candidate, PROTECT itself unchanged;
// the room's first taps): A1 is v0.0.17's to the byte (its bakes' keys unprefixed), the others baked under `${id}/` keys
// (gunBakes(id)), so the engine holds two at once and plays the old until the new is whole. A0 is no recipe here: it is
// &sound=old's report, which the engine plays through the range's old path.
//
// Pure: renderDry, renderTail, protect, ownShot, otherShot, echoShot, gunBakes and the constants; engine.js plays what they say.
import { stream, next } from '../../core/rng.js';
import { biquad, BAKE_CHUNK_SAMPLES } from './synth.js';
import { softClip } from './mix.js';
import { airDb } from '../../sim/people/hearing.js';
import { lowpassHz } from './steps.js';
import { ROLLOFF, PAN_FULL_M, HALL, DIST_LP_REF_HZ, DIST_LP_REF_M, DIST_LP_MIN_HZ, SHOT_CANDIDATES } from '../../data/sounds.js';

/** The dry parts' rate and the tails' (Hz; the engine bakes at the lower of these and its context's). */
export const GUN_RATE_HZ = 48000, TAIL_RATE_HZ = 24000;
/** The open shot at your ear against its buffer's peak (dB: over full scale, into the master's limiter). */
export const OWN_DB = 4;
/** The electronic protection (see the header): its ceiling against the open shot (dB), attack, hold and release (s), band (Hz), its soft clip's limit (× the ceiling), the limiter's hold over the ceiling (dB), the passive leak (dB, Hz). */
export const PROTECT = Object.freeze({ ceilingDb: -8, attackS: 0.0002, holdS: 0.002, releaseS: 0.02, hpHz: 160, lpHz: 7000, clipK: 1.25, driveDb: 6, passiveDb: -28, passiveLpHz: 600 });
/** The suit's and the defenders' trims at play (dB) and their speakers' corner (Hz): the helmet's a little closer and darker. */
export const PROTECT_AT = Object.freeze({ suit: Object.freeze({ db: 4, lpHz: 6000 }), ears: Object.freeze({ db: 4, lpHz: 7000 }) });
/** Worn, the protection compresses a far shot's distance fall (or an echo's) to this share of the open's (×). */
export const PROTECT_DIST_K = 0.5;
/** The tails' reflection paths are baked at this speed of sound (m/s; see the header). */
export const SPACE_SOUND_MS = 343;
/** The bay: an outdoor shot whose berm path (there and back) is under this is in the bay's space, else the open's (m). */
export const BAY_PATH_M = 120;
/** Another's shot: its space's answer falls by this share of the direct's distance fall, never below this (×, dB). */
export const TAIL_DIST_K = 0.3, TAIL_FAR_MIN_DB = -12;
/** The berm's slap-back is played this much slower than the shot (×: the far ground softens it). */
export const ECHO_RATE = 0.94;
const dbToK = (db) => 10 ** (db / 20);
const TAU = 2 * Math.PI;

/** Each gun's voice (see the header): the blast, the gas, the thump, the crack, the action's events, its length (s), its loudness (×). */
export const GUNS = Object.freeze({
  r7: Object.freeze({
    posMs: 1.1, b: 1.4, loud: 1.4, durS: 0.14, drive: 1.5,
    gas: Object.freeze({ hpHz: 220, lpHz: 6500, attackMs: 0.15, decayMs: 5, db: -4 }),
    gust: Object.freeze({ lpHz: 1700, attackMs: 1.5, decayMs: 26, db: -13 }),
    thump: Object.freeze({ hz: 120, toHz: 50, decayMs: 30, db: -9 }),
    crack: Object.freeze({ ms: 0.28, db: -9, farDb: -3 }),
    mech: Object.freeze([
      Object.freeze({ atMs: 9, band: Object.freeze([2600, 2.5]), noiseMs: 2.2, rings: Object.freeze([[3100, 9, 0], [4700, 6, -4], [6200, 4, -8]]), db: -21 }),
      Object.freeze({ atMs: 12, rings: Object.freeze([[7500, 15, 0], [9800, 9, -6]]), db: -36 }),
      Object.freeze({ atMs: 34, band: Object.freeze([2200, 2]), noiseMs: 3, rings: Object.freeze([[1800, 8, 0], [3600, 6, -3], [420, 10, -6]]), db: -23 }),
      Object.freeze({ atMs: 37, rings: Object.freeze([[1100, 28, 0], [1650, 18, -6]]), db: -38 }),
      Object.freeze({ atMs: 74, band: Object.freeze([3300, 2.5]), noiseMs: 2.5, rings: Object.freeze([[2900, 10, 0], [5100, 7, -3]]), db: -22 }),
    ]),
  }),
  p12: Object.freeze({
    posMs: 0.55, b: 1.2, loud: 1.0, durS: 0.09, drive: 1.4,
    gas: Object.freeze({ hpHz: 380, lpHz: 7500, attackMs: 0.1, decayMs: 3, db: -3 }),
    gust: Object.freeze({ lpHz: 1500, attackMs: 1, decayMs: 12, db: -16 }),
    thump: Object.freeze({ hz: 170, toHz: 85, decayMs: 18, db: -14 }),
    crack: Object.freeze({ ms: 0.16, db: -14, farDb: -9 }),
    mech: Object.freeze([
      Object.freeze({ atMs: 4, band: Object.freeze([3400, 2.5]), noiseMs: 1.2, rings: Object.freeze([[3900, 3, 0], [5600, 2.5, -4]]), db: -25 }),
      Object.freeze({ atMs: 7, rings: Object.freeze([[8200, 12, 0]]), db: -37 }),
      Object.freeze({ atMs: 14, band: Object.freeze([2800, 2]), noiseMs: 2, rings: Object.freeze([[3200, 6, 0], [700, 6, -6]]), db: -18 }),
      Object.freeze({ atMs: 38, band: Object.freeze([3800, 2.5]), noiseMs: 1.8, rings: Object.freeze([[4400, 6, 0], [6900, 4, -5]]), db: -21 }),
    ]),
  }),
});
/** A gun's sound by its model (MODELS' id); one with no sound of its own is the R-7's. */
export const gunOf = (model) => (GUNS[model] ? model : 'r7');
/** A model's loudness against the R-7's (dB: 20 log10 of the loud ratio). */
export const loudDb = (model) => 20 * Math.log10(GUNS[gunOf(model)].loud / GUNS.r7.loud);
/** A shot candidate's record (src/data/sounds.js SHOT_CANDIDATES), A1's (the built) for an unknown id; a record itself as it is (the tests' and the samples'). */
export const shotOf = (shot) => (shot && typeof shot === 'object' ? shot : SHOT_CANDIDATES[shot] ?? SHOT_CANDIDATES.A1);
/** A gun's voice under a shot candidate (see the header): the built record where the candidate says nothing, so A1 is GUNS' own object. */
export function gunWith(model, shot = 'A1') {
  const g = gunOf(model), G = GUNS[g], C = shotOf(shot);
  if (C.old || (!C.gasMs && !C.gustMs && !C.thumpMs && !C.thumpDb && !C.gasDb && !C.gustDb && !C.blastDb)) return G;
  const at = (t) => (t && Number.isFinite(t[g]) ? t[g] : null);
  return Object.freeze({
    ...G,
    ...(C.blastDb ? { blastDb: C.blastDb } : {}),
    gas: at(C.gasMs) || C.gasDb ? Object.freeze({ ...G.gas, decayMs: at(C.gasMs) ?? G.gas.decayMs, db: G.gas.db + (C.gasDb ?? 0) }) : G.gas,
    gust: at(C.gustMs) || C.gustDb ? Object.freeze({ ...G.gust, decayMs: at(C.gustMs) ?? G.gust.decayMs, db: G.gust.db + (C.gustDb ?? 0) }) : G.gust,
    thump: Object.freeze({ ...G.thump, decayMs: at(C.thumpMs) ?? G.thump.decayMs, db: G.thump.db + (C.thumpDb ?? 0) }),
  });
}
/** The protection under a shot candidate: PROTECT with the candidate's ceiling where it carries one (PROTECT itself never changes). */
export function protectOf(shot = 'A1', model = 'r7') {
  const C = shotOf(shot), up = C.protect?.makeupDb;
  if (!Number.isFinite(C.ceilingDb) && !C.protect) return PROTECT;
  // (a make-up may be per gun, { r7, p12 }, so the pistol stays under the rifle through the clamp)
  const makeupDb = up && typeof up === 'object' ? up[gunOf(model)] ?? 0 : up ?? 0;
  return Object.freeze({ ...PROTECT, ...(C.protect ?? {}), makeupDb, ...(Number.isFinite(C.ceilingDb) ? { ceilingDb: C.ceilingDb } : {}) });
}
/** A bake's key under a shot candidate: A1's as built, another's under `${id}/`. */
export const shotKey = (key, shot = 'A1') => (!shot || shot === 'A1' ? key : `${shot}/${key}`);

const tap = (ms, db, pan) => Object.freeze({ ms, db, pan });
// (the room's first order: the floor's bounce, the panels' over HALL's paths (2 × the metres to a panel at SPACE_SOUND_MS), the roof's)
const roomFirst = () => {
  const out = [tap(4.5, -7, 0)];
  HALL.earlyM.forEach((m, j) => out.push(tap((2 * m / SPACE_SOUND_MS) * 1000, -9 - 1.2 * j, j % 2 ? 0.7 : -0.7)));
  out.push(tap(17.5, -12, 0.15));
  return Object.freeze(out);
};
/** The spaces (see the header): their length (s), first taps ({ ms, db, pan }), second order, diffuse tail, rolling echo and rumble. */
export const SPACES = Object.freeze({
  room: Object.freeze({
    lenS: 0.9, first: roomFirst(), firstLpHz: 6000,
    second: Object.freeze({ n: 30, fromMs: 22, toMs: 85, dbFrom: -14, dbTo: -26, lpHz: 4200 }),
    diffuse: Object.freeze({ fromMs: 10, peakMs: 40, rt60S: 0.55, db: -13, lpHz: 3200, hiRt60S: 0.3, hiDb: -21 }),
    rolling: null, rumble: null,
  }),
  bay: Object.freeze({
    lenS: 1.8, first: Object.freeze([tap(2.2, -5, 0), tap(41, -15, -0.8), tap(55, -17, 0.8), tap(72, -19, -0.5), tap(95, -21, 0.6)]), firstLpHz: 2800,
    second: null, diffuse: null,
    rolling: Object.freeze({ n: 34, fromS: 0.25, peakS: 0.45, toS: 1.6, db: -25, lpHz: 1400, smearMs: Object.freeze([0, 2.5, 6]) }),
    rumble: Object.freeze({ peakS: 0.35, tauS: 0.5, db: -33, lpHz: 350 }),
  }),
  open: Object.freeze({
    lenS: 2.8, first: Object.freeze([tap(2.2, -5, 0), tap(24, -19, -0.6), tap(31, -21, 0.6)]), firstLpHz: 2800,
    second: null, diffuse: null,
    rolling: Object.freeze({ n: 44, fromS: 0.4, peakS: 0.8, toS: 2.6, db: -28, lpHz: 1000, smearMs: Object.freeze([0, 3, 8, 14]) }),
    rumble: Object.freeze({ peakS: 0.6, tauS: 0.9, db: -32, lpHz: 250 }),
  }),
});
/** The spaces by name. */
export const SPACE_NAMES = Object.freeze(Object.keys(SPACES));

// ---- the dsp ----
function biq(buf, type, hz, q, sr) {
  const k = biquad(type, hz, q, sr);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < buf.length; i++) { const x = buf[i], y = k.b0 * x + k.b1 * x1 + k.b2 * x2 - k.a1 * y1 - k.a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; buf[i] = y; }
  return buf;
}
const peakOf = (buf) => { let p = 0; for (let i = 0; i < buf.length; i++) p = Math.max(p, Math.abs(buf[i])); return p; };
function norm(buf) { const p = peakOf(buf); if (p > 0) for (let i = 0; i < buf.length; i++) buf[i] /= p; return buf; }
const noiseOf = (r, n) => { const b = new Float32Array(n); for (let i = 0; i < n; i++) b[i] = next(r) * 2 - 1; return b; };
const envAt = (t, attackS, decayS) => (t < 0 ? 0 : t < attackS ? t / attackS : Math.exp(-(t - attackS) / decayS));
// (a damped sine added in place: at sample i0, hz, its 1/e time, amplitude)
function ring(buf, i0, hz, tauS, amp, sr) {
  const n = Math.min(buf.length - i0, Math.round(tauS * 7 * sr));
  for (let i = 0; i < n; i++) buf[i0 + i] += amp * Math.sin(TAU * hz * i / sr) * Math.exp(-i / sr / tauS) * Math.min(1, i / 2);
}
function addScaled(out, buf, k, at = 0) { for (let i = 0; i < buf.length && at + i < out.length; i++) if (at + i >= 0) out[at + i] += buf[i] * k; }
// (the build sheet §1 item 12: the passes above as generators, the same arithmetic in the same order, a yield every
// BAKE_CHUNK_SAMPLES, so a bake's slice ends within the engine's BAKE_FRAME_MS and a chunk: a tail's rumble took 2.7 ms at once)
const CH = BAKE_CHUNK_SAMPLES;
const due = (i) => i % CH === CH - 1;
function* noiseG(r, n) { const b = new Float32Array(n); for (let i = 0; i < n; i++) { b[i] = next(r) * 2 - 1; if (due(i)) yield 'noise'; } return b; }
function* biqG(buf, type, hz, q, sr) {
  const k = biquad(type, hz, q, sr);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < buf.length; i++) { const x = buf[i], y = k.b0 * x + k.b1 * x1 + k.b2 * x2 - k.a1 * y1 - k.a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; buf[i] = y; if (due(i)) yield 'biquad'; }
  return buf;
}
function* hpG(buf, hz, sr) {
  const a = Math.exp(-TAU * hz / sr);
  let xp = 0, y = 0;
  for (let i = 0; i < buf.length; i++) { const x = buf[i]; y = a * (y + x - xp); xp = x; buf[i] = y; if (due(i)) yield 'highpass'; }
  return buf;
}
function* lpG(buf, hz, sr) {
  const a = Math.exp(-TAU * hz / sr);
  let y = 0;
  for (let i = 0; i < buf.length; i++) { y = (1 - a) * buf[i] + a * y; buf[i] = y; if (due(i)) yield 'lowpass'; }
  return buf;
}
function* normG(buf) {
  let p = 0;
  for (let i = 0; i < buf.length; i++) { p = Math.max(p, Math.abs(buf[i])); if (due(i)) yield 'peak'; }
  if (p > 0) for (let i = 0; i < buf.length; i++) { buf[i] /= p; if (due(i)) yield 'norm'; }
  return buf;
}

/**
 * A gun's dry shot (see the header): a Float32Array at sampleRate, its peak 1. part 'own' (at the shooter's ear: the blast, the
 * crack under it, the action) or 'far' (another's: the crack ahead of the blast, no action); crack false for a subsonic round.
 */
export function renderDry(model, opts = {}) { return run(dryGen(model, opts)); }
// (a generator run to its end: the bakes advance them a stage at a time across frames, the tests run them at once)
function run(it) { for (;;) { const r = it.next(); if (r.done) return r.value; } }
/** renderDry a stage at a time (a generator returning its samples), for the engine's bake budget. */
export function* dryGen(model, { part = 'own', crack = true, variant = 0, sampleRate = GUN_RATE_HZ, shot = 'A1' } = {}) {
  const G = gunWith(model, shot), sr = sampleRate, own = part === 'own';
  const n = Math.round((own ? G.durS : G.durS * 0.75) * sr), out = new Float32Array(n);
  const r = (what) => stream('gun', gunOf(model), part, what, variant);
  const lead = !own && crack ? Math.round(0.002 * sr) : 0;
  // (the blast: the Friedlander pulse, two samples' rise)
  const T = G.posMs / 1000, pulse = new Float32Array(n);
  for (let i = 0; i < n; i++) { if (due(i)) yield 'pulse'; const t = (i - lead) / sr; if (t < 0) continue; pulse[i] = (1 - t / T) * Math.exp(-G.b * t / T) * Math.min(1, (i - lead + 1) / 2); }
  addScaled(out, pulse, dbToK(G.blastDb ?? 0));
  // (the gas's turbulence and its gust)
  const gas = yield* biqG(yield* biqG(yield* noiseG(r('gas'), n), 'highpass', G.gas.hpHz, Math.SQRT1_2, sr), 'lowpass', G.gas.lpHz, Math.SQRT1_2, sr);
  for (let i = 0; i < n; i++) { gas[i] *= envAt((i - lead) / sr, G.gas.attackMs / 1000, G.gas.decayMs / 1000); if (due(i)) yield 'env'; }
  addScaled(out, yield* normG(gas), dbToK(G.gas.db));
  yield 'gas';
  const gust = yield* lpG(yield* lpG(yield* noiseG(r('gust'), n), G.gust.lpHz, sr), G.gust.lpHz, sr);
  for (let i = 0; i < n; i++) { gust[i] *= envAt((i - lead) / sr, G.gust.attackMs / 1000, G.gust.decayMs / 1000); if (due(i)) yield 'env'; }
  addScaled(out, yield* normG(gust), dbToK(G.gust.db));
  // (the thump: a sine falling over its decay)
  const th = new Float32Array(n), tau = G.thump.decayMs / 1000;
  let ph = 0;
  for (let i = 0; i < n; i++) { if (due(i)) yield 'sine'; const t = (i - lead) / sr; if (t < 0) continue; const f = G.thump.toHz + (G.thump.hz - G.thump.toHz) * Math.exp(-t / tau); ph += TAU * f / sr; th[i] = Math.sin(ph) * envAt(t, 0.0008, tau); }
  addScaled(out, yield* normG(th), dbToK(G.thump.db));
  yield 'thump';
  // (the crack: an N-wave, its edges a sample each)
  if (crack) {
    const D = Math.max(2, Math.round(G.crack.ms / 1000 * sr)), k = dbToK(own ? G.crack.db : G.crack.farDb);
    for (let i = 0; i <= D && i < n; i++) out[i] += k * (1 - 2 * i / D);
  }
  // (the action: each event a burst of noise in its band and its rings)
  if (own) {
    G.mech.forEach((e, j) => {
      const i0 = Math.round(e.atMs / 1000 * sr), ev = new Float32Array(Math.min(n - i0, Math.round(0.06 * sr)));
      if (ev.length <= 0) return;
      if (e.noiseMs) {
        const nz = noiseOf(r(`mech${j}`), ev.length);
        if (e.band) biq(nz, 'bandpass', e.band[0], e.band[1], sr); else biq(nz, 'lowpass', e.lpHz, Math.SQRT1_2, sr);
        for (let i = 0; i < ev.length; i++) ev[i] = nz[i] * Math.exp(-i / sr / (e.noiseMs / 1000));
        norm(ev);
      }
      const rr = r(`ring${j}`);
      for (const [hz, tMs, db] of e.rings) ring(ev, 0, hz * (1 + (next(rr) - 0.5) * 0.02), tMs / 1000, dbToK(db) * 0.8, sr);
      addScaled(out, norm(ev), dbToK(e.db), i0);
    });
    yield 'action';
  }
  // (the blast and its body saturated together, as the air near a muzzle and every microphone saturate: the pulse's edge
  // flattened, the gas's body brought up under it, so the shot is dense, not a click; tanh(drive x) / tanh(drive))
  yield* normG(out);
  const dk = Math.tanh(G.drive);
  for (let i = 0; i < n; i++) { out[i] = Math.tanh(G.drive * out[i]) / dk; if (due(i)) yield 'drive'; }
  yield* hpG(out, 25, sr);
  // (the end faded over 4 ms, so it never stops on a click)
  const fade = Math.round(0.004 * sr);
  for (let i = 0; i < fade && i < n; i++) out[n - 1 - i] *= i / fade;
  return yield* normG(out);
}

/**
 * A space's answer to a gun's shot (see the header): { left, right } Float32Arrays at sampleRate, without the direct sound, on
 * the dry's scale (its source's peak 1).
 */
export function renderTail(model, space, opts = {}) { return run(tailGen(model, space, opts)); }
/** renderTail a stage at a time (a generator returning { left, right }); src, the far dry at the tail's rate, if already made. */
export function* tailGen(model, space, { variant = 0, sampleRate = TAIL_RATE_HZ, src: given = null, shot = 'A1' } = {}) {
  const S = SPACES[space], early = space === 'room' ? shotOf(shot).roomEarlyDb ?? 0 : 0;
  if (!S) throw new Error(`gun: no space '${space}'`);
  const sr = sampleRate, n = Math.round(S.lenS * sr), L = new Float32Array(n), R = new Float32Array(n);
  const src = given ?? (yield* dryGen(model, { part: 'far', crack: true, variant, sampleRate: sr, shot }));
  const r = (what) => stream('gun-space', gunOf(model), space, what, variant);
  const place = (buf, ms, k, pan) => { const at = Math.round(ms / 1000 * sr); addScaled(L, buf, k * Math.min(1, 1 - 0.6 * pan), at); addScaled(R, buf, k * Math.min(1, 1 + 0.6 * pan), at); };
  const first = yield* lpG(Float32Array.from(src), S.firstLpHz, sr);
  // (A4: the room's first-order taps over 5 to 30 ms up by the candidate's roomEarlyDb)
  for (const t of S.first) place(first, t.ms, dbToK(t.db + (early && t.ms >= 5 && t.ms <= 30 ? early : 0)), t.pan);
  yield 'first';
  if (S.second) {
    const s2 = yield* lpG(Float32Array.from(src), S.second.lpHz, sr), rr = r('second');
    for (let j = 0; j < S.second.n; j++) {
      const ms = S.second.fromMs + next(rr) * (S.second.toMs - S.second.fromMs), u = (ms - S.second.fromMs) / (S.second.toMs - S.second.fromMs);
      const db = S.second.dbFrom + (S.second.dbTo - S.second.dbFrom) * u + (next(rr) - 0.5) * 4, sign = next(rr) < 0.5 ? -1 : 1;
      place(s2, ms, sign * dbToK(db), next(rr) * 2 - 1);
      if (j % 10 === 9) yield 'second';
    }
  }
  if (S.diffuse) {
    const D = S.diffuse;
    for (const [ch, buf] of [['l', L], ['r', R]]) {
      const lo = yield* lpG(yield* lpG(yield* noiseG(r(`diffuse-${ch}`), n), D.lpHz, sr), D.lpHz, sr), hi = yield* hpG(yield* noiseG(r(`hi-${ch}`), n), D.lpHz, sr);
      yield* normG(lo); yield* normG(hi);
      yield 'diffuse-noise';
      const kLo = dbToK(D.db), kHi = dbToK(D.hiDb);
      for (let i = 0; i < n; i++) {
        if (due(i)) yield 'diffuse-mix';
        const tMs = (i / sr) * 1000;
        if (tMs < D.fromMs) continue;
        const rise = Math.min(1, (tMs - D.fromMs) / (D.peakMs - D.fromMs)), after = Math.max(0, tMs - D.peakMs) / 1000;
        buf[i] += rise * (kLo * lo[i] * Math.exp(-6.9078 * after / D.rt60S) + kHi * hi[i] * Math.exp(-6.9078 * after / D.hiRt60S));
      }
      yield 'diffuse';
    }
  }
  if (S.rolling) {
    const Ro = S.rolling, rr = r('rolling'), base = yield* lpG(yield* lpG(Float32Array.from(src), Ro.lpHz, sr), Ro.lpHz, sr);
    // (each far echo smeared: copies a few ms apart, as rough ground returns it)
    const sm = new Float32Array(base.length + Math.round(Math.max(...Ro.smearMs) / 1000 * sr));
    Ro.smearMs.forEach((ms, j) => addScaled(sm, base, (j % 2 ? -0.7 : 1) / Ro.smearMs.length * 2, Math.round(ms / 1000 * sr)));
    yield* normG(sm);
    for (let j = 0; j < Ro.n; j++) {
      // (more of them near the peak: the delay drawn from a triangle between fromS, peakS and toS)
      const u = next(rr), tS = u < (Ro.peakS - Ro.fromS) / (Ro.toS - Ro.fromS)
        ? Ro.fromS + Math.sqrt(u * (Ro.toS - Ro.fromS) * (Ro.peakS - Ro.fromS))
        : Ro.toS - Math.sqrt((1 - u) * (Ro.toS - Ro.fromS) * (Ro.toS - Ro.peakS));
      const env = tS < Ro.peakS ? 1 : Math.exp(-2.3 * (tS - Ro.peakS) / (Ro.toS - Ro.peakS));
      const k = dbToK(Ro.db) * env * (0.45 + 0.55 * next(rr)) * (next(rr) < 0.5 ? -1 : 1);
      place(sm, tS * 1000, k, next(rr) * 2 - 1);
      if (j % 8 === 7) yield 'rolling';
    }
  }
  if (S.rumble) {
    const U = S.rumble;
    for (const [ch, buf] of [['l', L], ['r', R]]) {
      const nz = yield* normG(yield* lpG(yield* lpG(yield* lpG(yield* noiseG(r(`rumble-${ch}`), n), U.lpHz, sr), U.lpHz, sr), U.lpHz, sr)), k = dbToK(U.db);
      yield 'rumble-noise';
      for (let i = 0; i < n; i++) { const t = i / sr; buf[i] += k * nz[i] * (t < U.peakS ? t / U.peakS : Math.exp(-(t - U.peakS) / U.tauS)); if (due(i)) yield 'rumble-mix'; }
      yield 'rumble';
    }
  }
  yield 'tail';
  yield* hpG(L, 25, sr); yield* hpG(R, 25, sr);
  const fade = Math.round(0.05 * sr);
  for (let i = 0; i < fade && i < n; i++) { L[n - 1 - i] *= i / fade; R[n - 1 - i] *= i / fade; }
  return { left: L, right: R };
}


/**
 * Electronic hearing protection on a shot heard at refDb over its buffers' scale (see the header): { dry, tail } (the tail
 * { left, right } or null), each on the open shot's scale, so it plays at the same gain as the open one. Deterministic.
 */
export function protect(opts = {}) { return run(protectGen(opts)); }
/** protect a stage at a time (a generator returning { dry, tail, gain }). */
export function* protectGen({ dry, drySr = GUN_RATE_HZ, tail = null, tailSr = TAIL_RATE_HZ, refDb = OWN_DB, P = PROTECT } = {}) {
  // (the limiter holds what is over it driveDb over the ceiling, into the soft clip at clipK × the ceiling: a loud sound is
  // clipped dense there, a quiet one passes as it is)
  const kRef = dbToK(refDb), ceil = dbToK(refDb + P.ceilingDb), hold0 = ceil * dbToK(P.driveDb ?? 0), lenS = Math.max(dry.length / drySr, tail ? tail.left.length / tailSr : 0);
  const n = Math.ceil(lenS * drySr), g = new Float32Array(n);
  // (the gain the limiter applies over time, from what reaches the microphones: the dry and the tail together, at the ear's level)
  const atk = 1 - Math.exp(-1 / (P.attackS * drySr)), rel = 1 - Math.exp(-1 / (P.releaseS * drySr)), holdN = Math.round(P.holdS * drySr);
  let gain = 1, hold = 0;
  for (let i = 0; i < n; i++) {
    const ti = tail ? Math.min(tail.left.length - 1, Math.floor(i * tailSr / drySr)) : 0;
    const s = Math.abs(((i < dry.length ? dry[i] : 0) + (tail ? (tail.left[ti] + tail.right[ti]) / 2 : 0)) * kRef);
    const want = s > hold0 ? hold0 / s : 1;
    if (want < gain) { gain += (want - gain) * atk; hold = holdN; } else if (hold > 0) hold--; else gain += (want - gain) * rel;
    g[i] = gain;
    if (due(i)) yield 'gain';
  }
  yield 'gain';
  const band = function* (buf, sr) { return yield* biqG(yield* biqG(Float32Array.from(buf), 'highpass', P.hpHz, Math.SQRT1_2, sr), 'lowpass', P.lpHz, Math.SQRT1_2, sr); };
  const leak = function* (buf, sr) { return yield* lpG(yield* lpG(Float32Array.from(buf), P.passiveLpHz, sr), P.passiveLpHz, sr); };
  // (a candidate's make-up, its protected level raised in the bake, so ownShot's and otherShot's gains stay as built)
  const kLeak = dbToK(P.passiveDb), lim = ceil * P.clipK, kUp = dbToK(P.makeupDb ?? 0);
  const through = function* (buf, sr) {
    const e = yield* band(buf, sr), p = yield* leak(buf, sr), out = new Float32Array(buf.length);
    for (let i = 0; i < buf.length; i++) {
      const gi = g[Math.min(n - 1, Math.floor(i * drySr / sr))];
      out[i] = kUp * (softClip(e[i] * kRef * gi, lim) + p[i] * kRef * kLeak) / kRef;
      if (due(i)) yield 'through';
    }
    return out;
  };
  const d = yield* through(dry, drySr);
  if (!tail) return { dry: d, tail: null, gain: g };
  yield 'dry';
  const left = yield* through(tail.left, tailSr);
  yield 'left';
  const right = yield* through(tail.right, tailSr);
  return { dry: d, tail: { left, right }, gain: g };
}

/**
 * What the engine bakes for the guns: [{ key, variants, steps(variant, sampleRate, tailRate) → a generator returning a Float32Array
 * or { left, right } }], in order (the engine advances them within its bake budget). Keys: `${gun}:own`, `${gun}:ownSub` (no crack), `${gun}:far`, `${gun}:farSub`, `${gun}:tail:${space}`, each
 * with ':p' for the protected.
 */
export function gunBakes(shot = 'A1') {
  const memo = new Map(), out = [], k = (key) => shotKey(key, shot);
  if (shotOf(shot).old) return out;
  // (each part made once, whichever bake needs it first: the protected tail reuses the open tail and the own dry)
  function* once(key, gen) { if (memo.has(key)) return memo.get(key); const v = yield* gen(); memo.set(key, v); return v; }
  const dryOf = (gun, part, crack, v, sr) => once(`dry|${gun}|${part}|${crack}|${v}|${sr}`, () => dryGen(gun, { part, crack, variant: v, sampleRate: sr, shot }));
  const tailOf = (gun, space, v, tr) => once(`tail|${gun}|${space}|${v}|${tr}`, function* () { return yield* tailGen(gun, space, { variant: v, sampleRate: tr, src: yield* dryOf(gun, 'far', true, v, tr), shot }); });
  for (const gun of Object.keys(GUNS)) {
    const ref = OWN_DB + loudDb(gun), P = protectOf(shot, gun);
    for (const [part, crack, name] of [['own', true, 'own'], ['own', false, 'ownSub'], ['far', true, 'far'], ['far', false, 'farSub']]) {
      out.push({ key: k(`${gun}:${name}`), variants: 2, steps: (v, sr) => dryOf(gun, part, crack, v, sr) });
      out.push({ key: k(`${gun}:${name}:p`), variants: 2, steps: function* (v, sr) { return (yield* protectGen({ dry: yield* dryOf(gun, part, crack, v, sr), drySr: sr, refDb: ref, P })).dry; } });
    }
    for (const space of SPACE_NAMES) {
      out.push({ key: k(`${gun}:tail:${space}`), variants: 1, steps: (v, sr, tr) => tailOf(gun, space, v, tr) });
      out.push({ key: k(`${gun}:tail:${space}:p`), variants: 1, steps: function* (v, sr, tr) { return (yield* protectGen({ dry: yield* dryOf(gun, 'own', true, v, sr), drySr: sr, tail: yield* tailOf(gun, space, v, tr), tailSr: tr, refDb: ref, P })).tail; } });
    }
  }
  return out;
}

// ---- where and how a shot is heard ----
const dbOfDist = (dM, roll) => 20 * Math.log10(1 / (1 + roll * Math.max(0, dM - 1)));
const distLp = (dM, pKpa) => Math.max(DIST_LP_MIN_HZ, Math.min(lowpassHz(pKpa), DIST_LP_REF_HZ * DIST_LP_REF_M / Math.max(DIST_LP_REF_M, dM)));
/** The space a shot is heard in: 'room' indoors (the shoot house, a floor, a deck), else 'bay' with a berm path under BAY_PATH_M, else 'open'. */
export function spaceOf({ indoors = false, bermPathM = Infinity } = {}) {
  if (indoors) return 'room';
  return bermPathM < BAY_PATH_M ? 'bay' : 'open';
}
/** Whether a round is supersonic in this air: the shot's flight says, else its speed (m/s) over the place's speed of sound (0: none). */
export const supersonicOf = ({ flight = null, vMs = null, soundMs } = {}) => (flight && typeof flight.supersonic === 'boolean' ? flight.supersonic : Number.isFinite(vMs) && soundMs > 0 ? vMs > soundMs : true);

/**
 * Your own shot (see the header): { voices: [{ key, delayS, gainDb, lowHz, pan, rate }], gainDb, lowpassHz, space, prot }. prot:
 * null | 'suit' | 'ears'. pKpa the place's air; lagS its place in the tick that brought it.
 */
export function ownShot({ gun = 'r7', space = 'open', prot = null, pKpa, supersonic = true, lagS = 0 } = {}) {
  const g = gunOf(gun), air = airDb(pKpa), lp = lowpassHz(pKpa), P = prot ? PROTECT_AT[prot] ?? PROTECT_AT.ears : null;
  const gainDb = OWN_DB + loudDb(g) + air + (P ? P.db : 0), lowHz = P ? Math.min(lp, P.lpHz) : lp, sfx = P ? ':p' : '';
  const voices = [
    { key: `${g}:${supersonic ? 'own' : 'ownSub'}${sfx}`, delayS: lagS, gainDb, lowHz, pan: 0, rate: 1 },
    { key: `${g}:tail:${space}${sfx}`, delayS: lagS, gainDb, lowHz, pan: 0, rate: 1 },
  ];
  return { voices, gainDb, lowpassHz: lowHz, space, prot: prot ?? null, distM: 0, delayS: lagS };
}

/**
 * Another's shot heard at me from muzzle ({ x, z }: see the header): { voices, gainDb (the direct's), lowpassHz, distM, delayS, pan,
 * protected }. roll the area's rolloff (ROLLOFF.floor or .ground); soundMs the place's speed of sound (0: nothing airborne late).
 */
export function otherShot({ gun = 'r7', space = 'open', prot = null, pKpa, soundMs, me, muzzle, supersonic = true, lagS = 0, roll = ROLLOFF.ground } = {}) {
  const g = gunOf(gun), dx = muzzle && me ? muzzle.x - me.x : 0, dz = muzzle && me ? muzzle.z - me.z : 0, d = Math.hypot(dx, dz);
  const air = airDb(pKpa), base = OWN_DB + loudDb(g) + air, P = prot ? PROTECT_AT[prot] ?? PROTECT_AT.ears : null;
  const direct = base + dbOfDist(d, roll), delayS = lagS + (soundMs > 0 ? d / soundMs : 0), pan = Math.max(-1, Math.min(1, dx / PAN_FULL_M));
  const lp = distLp(d, pKpa), tailDb = base + Math.max(TAIL_FAR_MIN_DB, TAIL_DIST_K * dbOfDist(d, roll));
  // (a gunshot is far over the electronics' cut-off at any distance the game has, so worn they clamp it: the clipped part, and the
  // distance's fall compressed to PROTECT_DIST_K of the open's (the clamp holds a far shot near a close one's level, as it does))
  const sfx = P ? ':p' : '', name = supersonic ? 'far' : 'farSub', fall = dbOfDist(d, roll);
  const gainDb = P ? base + P.db + PROTECT_DIST_K * fall : direct, lowHz = P ? Math.min(lp, P.lpHz) : lp;
  const voices = [
    { key: `${g}:${name}${sfx}`, delayS, gainDb, lowHz, pan, rate: 1 },
    { key: `${g}:tail:${space}${sfx}`, delayS, gainDb: P ? base + P.db + Math.max(TAIL_FAR_MIN_DB, TAIL_DIST_K * fall) : tailDb, lowHz: P ? Math.min(lowpassHz(pKpa), P.lpHz) : lowpassHz(pKpa), pan: pan * 0.4, rate: 1 },
  ];
  return { voices, gainDb, lowpassHz: lowHz, distM: d, delayS, pan, protected: !!P, space };
}

/**
 * The berm's slap-back of a shot (range.js echoOf's { gainDb, lowpassHz, delayS } on the old report's scale, its ECHO_DB and its
 * path's fall): a voice of the far blast at the open shot's level plus the echo's fall, ECHO_RATE slower; through the
 * electronics' ceiling when worn.
 */
export function echoShot({ gun = 'r7', echoDb, lowpassHz: lowHz, delayS, pan = 0, prot = null, pKpa, lagS = 0 } = {}) {
  const g = gunOf(gun), base = OWN_DB + loudDb(g) + airDb(pKpa), P = prot ? PROTECT_AT[prot] ?? PROTECT_AT.ears : null;
  // (worn, the electronics clamp it too: the clipped part, its fall compressed as a far shot's)
  const gainDb = P ? base + P.db + PROTECT_DIST_K * echoDb : base + echoDb;
  return { key: `${g}:farSub${P ? ':p' : ''}`, delayS: lagS + delayS, gainDb, lowHz: P ? Math.min(lowHz, P.lpHz) : lowHz, pan, rate: ECHO_RATE };
}
