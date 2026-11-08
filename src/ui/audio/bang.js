// OLYMPUS audio: the bang and the chaos in the ears: the report, the ducking by felt's band, the deafness and its whine (VIEWS §11.2; BODY §17.3; the build sheet 0.0.9 §2.3).
//
// The presenter's ear (VIEWS §11.1: "the sim decides, audio presents"): it hears the 'fx' fact of kind 'bang' (supp.js
// bang(): { id, x, z, atMs }) and reads COMBAT §5's state once a frame through main.js's reading of supp.js suppNow (the
// band of what is felt, the deafness's span), and asks the engine (engine.js) for:
//   the report   the bang where it went off, at its moment on the audio clock (the fact comes on the first tick at or
//                after atMs, which the picture draws a tick behind, so it waits its place in that tick: the row shots'
//                way), BANG_SOURCE_DB over its recipe's peak at 1 m, inverse with distance with the ground's rolloff,
//                through Melas's air (airDb, the low-pass at 5.2 kHz), panned by its offset; and the bay's late echo off
//                the berm in front (range.js bermFor, ECHO_DB under it, low-passed, 2 × the distance at the speed of
//                sound); through the defenders' electronic gate when worn (EARS_DB, the range's rule);
//   the band     felt's band (suppNow().bandN; never felt itself) as the chaos stage on the world bus: BAND_DUCK_DB and
//                BAND_LP_HZ, and your breath and heart on the body bus at BAND_BODY_DB (silent when calm);
//   the deafness suppNow().deaf ({ untilMs }): the world low-passed to MUFFLE_LP_HZ and MUFFLE_DB down, and the whine on
//                the ear's bus, loud for WHINE_LOUD_S from the deafness's start, then falling over WHINE_FALL_S to its
//                floor; both easing back over the deafness's last MUFFLE_RECOVER_S. Its caption, WHINE_CAPTION, once a
//                deafness (main.js toasts it). The band's cut and the deafness's take the lower corner and add their dB.
// chaosMix(reading, ms, { fromMs }) and bangVoice(...) are the pure parts the ui-audio test measures in node; voiceRoute
// says which bus a voice goes to (the voice bus round the deafness within VOICE_NEAR_M, else the world's).
import { playerActor } from '../../core/ids.js';
import { TICK_MS } from '../../core/clock.js';
import { airDb } from '../../sim/people/hearing.js';
import { lowpassHz } from './steps.js';
import { bermFor, soundMsAt } from './range.js';
import { AIR_KPA, ROLLOFF, PAN_FULL_M, ECHO_DB, ECHO_LP_HZ, EARS_DB, EARS_LP_HZ, WORLD_OPEN_HZ, BANG_SOURCE_DB, BAND_DUCK_DB, BAND_LP_HZ, BAND_BODY_DB,
  MUFFLE_LP_HZ, MUFFLE_DB, MUFFLE_RECOVER_S, WHINE_LOUD_DB, WHINE_FLOOR_DB, WHINE_LOUD_S, WHINE_FALL_S, WHINE_CAPTION, VOICE_NEAR_M } from '../../data/sounds.js';

const dbOfDist = (dM, roll = ROLLOFF.ground) => 20 * Math.log10(1 / (1 + roll * Math.max(0, dM - 1)));
const clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));
const r1 = (v) => Math.round(v * 10) / 10;

/**
 * The bang as you hear it: { gainDb, lowpassHz, distM, pan, echo: { gainDb, lowpassHz, delayS } }. me { x, z }; at { x, z } the
 * bang; ears: the defenders worn (their gate: EARS_DB, low-passed at EARS_LP_HZ); soundMs: the speed of sound; pKpa the air.
 */
export function bangVoice({ me = null, at = null, ears = false, soundMs = 322, pKpa = AIR_KPA.ground } = {}) {
  const dx = me && at ? at.x - me.x : 0, dz = me && at ? at.z - me.z : 0, distM = Math.hypot(dx, dz);
  let gainDb = BANG_SOURCE_DB + airDb(pKpa) + dbOfDist(distM), lp = lowpassHz(pKpa);
  if (ears) { gainDb += EARS_DB; lp = Math.min(lp, EARS_LP_HZ); }
  const berm = bermFor(at?.x ?? me?.x ?? 0), there = Math.max(1, berm - (at?.x ?? 0)), back = Math.max(1, berm - (me?.x ?? 0));
  const echo = { gainDb: gainDb + ECHO_DB, lowpassHz: Math.min(lp, ECHO_LP_HZ), delayS: (there + back) / soundMs };
  return { gainDb, lowpassHz: lp, distM, pan: Math.max(-1, Math.min(1, dx / PAN_FULL_M)), echo };
}

/** The whine's level (dB against its recipe) t s after the deafness began: WHINE_LOUD_DB for WHINE_LOUD_S, then down to WHINE_FLOOR_DB over WHINE_FALL_S. */
export function whineDb(t) {
  if (!(t >= 0)) return null;
  if (t <= WHINE_LOUD_S) return WHINE_LOUD_DB;
  const u = Math.min(1, (t - WHINE_LOUD_S) / WHINE_FALL_S);
  return WHINE_LOUD_DB + (WHINE_FLOOR_DB - WHINE_LOUD_DB) * u;
}

/**
 * The mix for a reading at ms (suppNow's record, or null): { bandN, world: { lowpassHz, gainDb }, body: { gainDb | null },
 * deaf: null | { k (1 deaf, easing to 0 over its last MUFFLE_RECOVER_S), sinceS, whineDb } }. fromMs: when this deafness began
 * (the bang's moment, the presenter's memory), else its first reading.
 */
export function chaosMix(sn, ms, { fromMs = null } = {}) {
  const n = sn ? Math.max(0, Math.min(3, Math.round(Number(sn.bandN) || 0))) : 0;
  let hz = BAND_LP_HZ[n] ?? WORLD_OPEN_HZ, db = BAND_DUCK_DB[n] ?? 0, deaf = null;
  const d = sn?.deaf;
  if (d && Number.isFinite(d.untilMs) && ms < d.untilMs) {
    const k = clamp01((d.untilMs - ms) / (MUFFLE_RECOVER_S * 1000)), sinceS = Number.isFinite(fromMs) ? Math.max(0, (ms - fromMs) / 1000) : 0;
    // (the corner eased in log between open and MUFFLE_LP_HZ, the level in dB, by k)
    const deafHz = WORLD_OPEN_HZ * (MUFFLE_LP_HZ / WORLD_OPEN_HZ) ** k;
    hz = Math.min(hz, deafHz); db += MUFFLE_DB * k;
    const w = whineDb(sinceS);
    deaf = { k, sinceS, whineDb: w === null ? null : w + 20 * Math.log10(Math.max(1e-3, k)) };
  }
  return { bandN: n, world: { lowpassHz: hz, gainDb: db }, body: { gainDb: BAND_BODY_DB[n] ?? null }, deaf };
}

/** Which bus a voice goes to: 'voice' (round the deafness) within VOICE_NEAR_M of you while deafened, else 'world'. near: hearsVoice's answer where the sim gives it. */
export function voiceRoute({ deaf = false, distM = Infinity, near = null } = {}) {
  if (!deaf) return 'world';
  return (near ?? distM <= VOICE_NEAR_M) ? 'voice' : 'world';
}

/**
 * The presenter (see the header): { fact(type, payload, state), frame(state, reading), stats, caption() → WHINE_CAPTION once a
 * deafness, else null }. engine: { bang(kind, opts), chaos({ lowpassHz, gainDb }), loop(key, kind, bus, gainDb | null) }.
 * looks: { earsOn(state, pid) } (the defenders).
 */
export function createBang(engine, { looks = {} } = {}) {
  const stats = { bangs: 0, echoes: 0, lastBang: null, lastEcho: null, mix: null, whine: null, body: null, captions: 0 };
  let deafFrom = null, deafUntil = null, captionDue = false;
  const earsOf = (state) => { try { return !!looks.earsOn?.(state, state.player?.id); } catch { return false; } };
  function fact(type, f, state) {
    if (type !== 'fx' || f?.kind !== 'bang' || !state) return false;
    const a = playerActor(state), me = a ? { x: a.x, z: a.z } : null;
    if (f.area && state.places?.live?.area && f.area !== state.places.live.area) return false;
    const v = bangVoice({ me, at: { x: f.x, z: f.z }, ears: earsOf(state), soundMs: soundMsAt(state) });
    // (its place in the tick that brought it, as the row shots' reports)
    const lagS = Number.isFinite(f.atMs) ? Math.max(0, Math.min(TICK_MS, f.atMs - (state.clock.ms - TICK_MS))) / 1000 : 0;
    const flight = v.distM / soundMsAt(state);
    const ok = engine.bang('bangReport', { delayS: lagS + flight, gainDb: v.gainDb, lowHz: v.lowpassHz, pan: v.pan });
    if (ok) { stats.bangs++; stats.lastBang = { id: f.id ?? null, atMs: f.atMs ?? null, gainDb: r1(v.gainDb), lowpassHz: Math.round(v.lowpassHz), distM: r1(v.distM), delayS: Math.round((lagS + flight) * 1000) / 1000 }; }
    if (engine.bang('bangReport', { delayS: lagS + v.echo.delayS, gainDb: v.echo.gainDb, lowHz: v.echo.lowpassHz, pan: v.pan, rate: 0.85 })) { stats.echoes++; stats.lastEcho = { gainDb: r1(v.echo.gainDb), lowpassHz: Math.round(v.echo.lowpassHz), delayS: Math.round(v.echo.delayS * 1000) / 1000 }; }
    return ok;
  }
  /** A frame: the mix for the reading now (main.js's suppNow, or null), on the engine's chaos stage and loops; breathing (0.0.10: Breathe running) holds the quick breath off, stress.js's box breath in its place. */
  function frame(state, sn = null, { breathing = false } = {}) {
    const ms = state?.clock?.ms ?? 0, d = sn?.deaf;
    // (a deafness's start: the first reading of it (the bang's tick); a new one when its end moves past the old)
    if (d && Number.isFinite(d.untilMs) && ms < d.untilMs) {
      if (deafUntil === null || deafFrom === null || ms < deafFrom) { deafFrom = ms; captionDue = true; }
      deafUntil = d.untilMs;
    } else { deafFrom = null; deafUntil = null; }
    const m = chaosMix(sn, ms, { fromMs: deafFrom });
    engine.chaos(m.world);
    engine.loop('heart', 'heart', 'body', m.body.gainDb);
    engine.loop('breath', 'breath', 'body', m.body.gainDb === null || breathing ? null : m.body.gainDb - 3);
    engine.loop('whine', 'whine', 'ear', m.deaf?.whineDb ?? null);
    stats.mix = { bandN: m.bandN, lowpassHz: Math.round(m.world.lowpassHz), gainDb: r1(m.world.gainDb), deafK: m.deaf ? Math.round(m.deaf.k * 1000) / 1000 : 0 };
    stats.whine = m.deaf?.whineDb === null || m.deaf?.whineDb === undefined ? null : { db: r1(m.deaf.whineDb), sinceS: r1(m.deaf.sinceS) };
    stats.body = m.body.gainDb;
    return m;
  }
  return {
    fact, frame, stats,
    /** The deafness's caption, once a deafness (main.js shows it), else null. */
    caption() { if (!captionDue) return null; captionDue = false; stats.captions++; return WHINE_CAPTION; },
    reset() { deafFrom = null; deafUntil = null; captionDue = false; },
  };
}
