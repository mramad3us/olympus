// OLYMPUS audio: the din in the ears, through the ear defenders: the coach's air horn, his blanks, Breathe's slow breath (VIEWS §11.2, §11.3; the build sheet 0.0.10 §2.3).
//
// The presenter's ear (VIEWS §11.1: "the sim decides, audio presents"): it hears the 'fx' facts of the stress course (supp.js's,
// from the scene's stressActors: kind 'horn' { key, phase: 'on' | 'off', x, z, atMs, untilMs, by } and kind 'blank' { key, x, y,
// z, atMs, by }) and asks the engine (engine.js) for:
//   the horn     on its 'on' fact, the air horn's blast (sounds.js STRESS.hornBlast, HORN_S long, the course's hornS) where the
//                coach holds it, HORN_SOURCE_DB at 1 m less the distance, through Melas's air, panned to your left by your
//                facing; through the electronic defenders' limiter (HORN_EARS_DB −20, low-passed at HORN_EARS_LP_HZ 2 kHz) when
//                worn; its 'off' fact ends nothing (the blast is its own length);
//   a blank      its report at its moment on the audio clock (its place in the tick that brought it, as the bang's), the R-7's
//                report as a neighbour's at the coach's muzzle (range.js reportVoice: 0.9 m, no crack, no strike), and the
//                berm's echo, through the defenders' gate (EARS_DB, EARS_LP_HZ: as built);
//   Breathe      while the player's Breathe runs (main.js's reading: the stop's doing 'breathe'), the box breath on the body
//                bus (STRESS.breathBox, a 4 s loop: in, hold, out, hold) at BREATHE_DB, and the band's quick breathing held off
//                (bang.js frame's breathing).
// hornVoice() and blankVoice() are the pure parts the ui-audio test measures in node.
import { playerActor } from '../../core/ids.js';
import { TICK_MS } from '../../core/clock.js';
import { airDb } from '../../sim/people/hearing.js';
import { lowpassHz } from './steps.js';
import { reportVoice, airHere } from './range.js';
import { ROLLOFF, HORN_SOURCE_DB, HORN_EARS_DB, HORN_EARS_LP_HZ, STRESS_AT, BREATHE_DB } from '../../data/sounds.js';

const dbOfDist = (dM, roll = ROLLOFF.ground) => 20 * Math.log10(1 / (1 + roll * Math.max(0, dM - 1)));
const r1 = (v) => Math.round(v * 10) / 10;
/** The pan of a sound near you by your facing (its offset to your right over NEAR_PAN_M, −1 to 1): the coach at your left shoulder pans left. */
export const NEAR_PAN_M = 2;
const RIGHT = Object.freeze({ right: [0, 1], left: [0, -1], up: [1, 0], down: [-1, 0] });
/** A near sound's pan: me { x, z, face }, at { x, z }; where you are not known, STRESS_AT's. */
export function nearPan(me, at) {
  if (!me || !at) return STRESS_AT.pan;
  const [rx, rz] = RIGHT[me.face] ?? RIGHT.right, lat = (at.x - me.x) * rx + (at.z - me.z) * rz;
  return Math.max(-1, Math.min(1, lat / NEAR_PAN_M));
}

/** The horn as you hear it: { gainDb, lowpassHz, distM, pan }. ears: the defenders worn (their limiter). */
export function hornVoice({ me = null, at = null, ears = false, pKpa } = {}) {
  const distM = me && at ? Math.hypot(at.x - me.x, at.z - me.z) : STRESS_AT.distM;
  let gainDb = HORN_SOURCE_DB + airDb(pKpa) + dbOfDist(distM), lp = lowpassHz(pKpa);
  if (ears) { gainDb += HORN_EARS_DB; lp = Math.min(lp, HORN_EARS_LP_HZ); }
  return { gainDb, lowpassHz: lp, distM, pan: nearPan(me, at) };
}
/** A blank's report as you hear it: range.js reportVoice's for a neighbour's muzzle (gated by the defenders), panned near: { gainDb, lowpassHz, distM, pan, delayS, echo }. */
export function blankVoice({ me = null, at = null, ears = false, soundMs, pKpa } = {}) {
  const v = reportVoice({ me, muzzle: at, mine: false, ears, pKpa, soundMs });
  return { ...v, pan: nearPan(me, at) };
}

/**
 * The presenter (see the header): { fact(type, payload, state), frame(state, { breathing }), stats }. engine: { stress(kind,
 * opts) (a STRESS recipe on the world bus), shot(kind, opts) (a RANGE recipe: the report), loop(key, kind, bus, gainDb) }.
 * looks: { earsOn(state, pid) } (the defenders).
 */
export function createStress(engine, { looks = {} } = {}) {
  const stats = { horns: 0, blanks: 0, echoes: 0, lastHorn: null, lastBlank: null, breathing: false };
  const earsOf = (state) => { try { return !!looks.earsOn?.(state, state.player?.id); } catch { return false; } };
  const meOf = (state) => { const a = playerActor(state); return a ? { x: a.x, z: a.z, face: a.face ?? 'right' } : null; };
  // (a fact's place in the tick that brought it, as the row shots' reports and the bang's)
  const lagOf = (f, state) => (Number.isFinite(f.atMs) ? Math.max(0, Math.min(TICK_MS, f.atMs - (state.clock.ms - TICK_MS))) / 1000 : 0);
  function fact(type, f, state) {
    if (type !== 'fx' || !state || !f || (f.kind !== 'horn' && f.kind !== 'blank')) return false;
    if (f.area && state.places?.live?.area && f.area !== state.places.live.area) return false;
    const me = meOf(state), at = Number.isFinite(f.x) ? { x: f.x, z: f.z } : null, ears = earsOf(state), lag = lagOf(f, state), air = airHere(state);
    if (f.kind === 'horn') {
      if (f.phase && f.phase !== 'on') return false;
      const v = hornVoice({ me, at, ears, pKpa: air.pKpa });
      const ok = engine.stress('hornBlast', { delayS: lag, gainDb: v.gainDb, lowHz: v.lowpassHz, pan: v.pan });
      if (ok) { stats.horns++; stats.lastHorn = { key: f.key ?? null, atMs: f.atMs ?? null, gainDb: r1(v.gainDb), lowpassHz: Math.round(v.lowpassHz), distM: r1(v.distM), pan: r1(v.pan), ears }; }
      return ok;
    }
    const v = blankVoice({ me, at, ears, soundMs: air.soundMs, pKpa: air.pKpa });
    const ok = engine.shot('report', { delayS: lag + v.delayS, gainDb: v.gainDb, lowHz: v.lowpassHz, pan: v.pan });
    if (ok) { stats.blanks++; stats.lastBlank = { key: f.key ?? null, atMs: f.atMs ?? null, gainDb: r1(v.gainDb), lowpassHz: Math.round(v.lowpassHz), distM: r1(v.distM), delayS: Math.round((lag + v.delayS) * 1000) / 1000, pan: r1(v.pan), ears }; }
    if (engine.shot('report', { delayS: lag + v.echo.delayS, gainDb: v.echo.gainDb, lowHz: v.echo.lowpassHz, pan: v.pan, rate: 0.9 })) stats.echoes++;
    return ok;
  }
  /** A frame: Breathe's box breath on the body bus while it runs (breathing: main.js's reading), else none. */
  function frame(state, { breathing = false } = {}) {
    stats.breathing = !!breathing;
    engine.loop('breathBox', 'breathBox', 'body', breathing ? BREATHE_DB : null);
  }
  return { fact, frame, stats };
}
