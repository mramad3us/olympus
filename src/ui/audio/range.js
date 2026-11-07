// OLYMPUS audio: the range's sounds, the shot, the action's clicks, the brass and the tower's speaker (VIEWS §11.3; WEAPONS §7.12; the build sheet 0.0.5 §2.4).
//
// The presenter's ear again (VIEWS §11.1: "the sim decides, audio presents"): it hears the facts the
// arms and the shot emit and reads what the range shows (the shot role's say, arms' kitLook for the ear
// defenders), and asks the engine (engine.js) to play the recipes of src/data/sounds.js RANGE:
//   the report    the 'shot' fact fired: the R-7's report where its muzzle was (yours MUZZLE_AHEAD_M
//                 0.9 m ahead of your ear; another shooter's at their distance, inverse from 1 m with
//                 the ground's rolloff 1, panned by their offset east or west), REPORT_SOURCE_DB over the
//                 recipe's peak, through Melas's air (airDb(65.9) −1.9 dB, the low-pass at 5.2 kHz), and
//                 the berm's slap-back ECHO_DB −12 dB under it and low-passed, 2 × the muzzle's distance
//                 to the berm's face at SOUND_SPEED_MS 322 m/s later (0.17 s from the 25 m line);
//   ear defenders kitLook(state, pid).ears: every impulse (a report, its echo) EARS_DB −25 dB and
//                 low-passed at EARS_LP_HZ 2 kHz (electronic defenders: the voices pass, and stay text);
//   the clicks    each 'step' fact that starts a sub-step ({ phase: 'start' | 'sub', action, fromMs,
//                 toMs }) puts its ACTION_SOUNDS at their fractions of its span on the game clock, each
//                 played as the drawn clock passes it (so stop motion freezes them, and a skip drops what
//                 it jumped over, LATE_MS), at your hands, not muffled; a pull that did not fire and
//                 clicks (why 'dud' or 'empty') the dry click at once;
//   the brass     a case, a dud or a stripped round of the shot fact's brass { kind, landMs, at }, a
//                 soft tick on regolith where it lands when the clock passes its landMs;
//   the speaker   a 'say' fact of kind 'pa': the tower's two-note chime from the tower (KD_RANGE's
//                 tower, its deck 6 m up), PA_SOURCE_DB over its peak, before the line's words show.
// Nothing new plays while time stands still (the clock does not pass anything) or while the context is
// not running (the engine's rule). reportVoice, echoOf, clickVoice, caseVoice, chimeVoice and the
// scheduler (createClickQueue) are the pure parts the ui-audio test measures in node.
//
// The 0.0.7 round's (the build sheet 0.0.7 §2.5 (d); src/data/sounds.js's header for the numbers):
//   the crack    your own supersonic round as it leaves (the shot's flight.supersonic), an impulse;
//   the strike   a thump where the round struck, at its flight time plus its distance over the speed of sound
//                in that air (strikeVoice: 300 m, 0.42 + 0.93 = 1.35 s), the far ones under the defenders' gate;
//   the relay    a neighbour's report delayed by its distance (d / c), panned; every report and echo through
//                createReportLimiter (at most REPORT_VOICES at once, two within REPORT_MERGE_MS one), so a
//                relay firing a string is a line of shots, never a wall of noise;
//   the berm     the slap-back off the berm in front of you: the bay's on the bay, the KD's past the pits;
//   the pits     a carrier down or up its rails (the 'pit' fact) where it is, a sound's way late, under the parapet;
//   the speaker  through the defenders' circuit (low-passed at EARS_LP_HZ) when you wear them.
// The 0.0.8 round's (the build sheet 0.0.8 §2.4, §8 item 24; src/data/sounds.js's header for the numbers): the pairs pad.
//   the turner  a 'turner' fact (turn or away): its motor from atMs over the turn, the clack of its stop at toMs, at the
//               stand, on the game clock (stop motion freezes them; a turn away a little lower);
//   the timer   the coach's shot timer beeps as the targets turn (one beep for a string's turn, however many turn),
//               off your left shoulder;
//   the steel   a shot that rang on the armoured face (the shot fact's ring): the plate's ring at the turner, a flight
//               and a sound's way later, through the defenders' gate;
//   the rows    a row's rounds (the shot fact's row: a Pair, a Hammer, the failure drill) are heard at their own formula
//               time (the fact's atMs): each waits its place in the tick that brought it, on the audio clock, so the
//               pair's two reports stand a split apart; a single Fire, and every shot of test-handling and test-range,
//               sounds as it did.
// The speed of sound is ballistics.js soundMsOf(envOfPlace(…)), the one helper for it; SOUND_SPEED_MS where no
// place is known (a test's).
import { playerActor, playerId } from '../../core/ids.js';
import { isHeld, TICK_MS } from '../../core/clock.js';
import { airDb } from '../../sim/people/hearing.js';
import { lowpassHz } from './steps.js';
import { KD_RANGE } from '../../data/places/range.js';
import { AIR_KPA, ROLLOFF, PAN_FULL_M, REPORT_SOURCE_DB, MUZZLE_AHEAD_M, ECHO_DB, ECHO_LP_HZ, SOUND_SPEED_MS, EARS_DB, EARS_LP_HZ, CLICK_SOURCE_DB, PA_SOURCE_DB, ACTION_SOUNDS, DRY_WHY,
  CRACK_SOURCE_DB, IMPACT_SOURCE_DB, CARRIER_SOURCE_DB, DIST_LP_REF_HZ, DIST_LP_REF_M, DIST_LP_MIN_HZ, REPORT_VOICES, REPORT_MERGE_MS, REPORT_HOLD_S, EARS_GATE_DB, PARAPET_DB, PARAPET_LP_HZ,
  TURNER_SOURCE_DB, BEEP_SOURCE_DB, BEEP_AT, STEEL_SOURCE_DB } from '../../data/sounds.js';
import * as ballistics from '../../sim/arms/ballistics.js';

/** The berm's face (x, m) and the tower's speaker ({ x, y, z }, m: its deck) on the 25 m bay (PLACES §4.12: src/data/places/range.js, the stage's authored bay). */
export const BERM_FACE_X = KD_RANGE.bay.berm[0], TOWER_AT = Object.freeze({ x: KD_RANGE.tower.ro.x, y: KD_RANGE.tower.deckY, z: KD_RANGE.tower.ro.z });
/** The KD's impact berm's face (x, m: past the pits; PLACES §4.12), the line's berm for a shooter east of the bay's. */
export const KD_BERM_FACE_X = KD_RANGE.kd?.berm?.rect?.[0] ?? 1612;
/** The berm in front of a listener at x: the bay's on the bay, the KD's beyond it. */
export const bermFor = (x) => (Number.isFinite(x) && x > BERM_FACE_X ? KD_BERM_FACE_X : BERM_FACE_X);
/** The speed of sound where the player stands (m/s; ballistics.js's one helper), SOUND_SPEED_MS where it cannot say. */
export function soundMsAt(state) {
  try {
    const a = state ? playerActor(state) : null, c = ballistics.soundMsOf?.(ballistics.envOfPlace?.(state, state?.places?.live?.area ?? null, a?.x ?? 0, a?.z ?? 0));
    return c > 0 ? c : SOUND_SPEED_MS;
  } catch { return SOUND_SPEED_MS; }
}
/** A click or a tick the drawn clock passed more than this long ago is dropped, not played late (ms: a skip, a stall). */
export const LATE_MS = 250;

const dbOfDist = (dM, roll = ROLLOFF.ground) => 20 * Math.log10(1 / (1 + roll * Math.max(0, dM - 1)));
const panOf = (dx) => Math.max(-1, Math.min(1, dx / PAN_FULL_M));

/**
 * The report as you hear it: { gainDb, lowpassHz, distM, pan, echo: { gainDb, lowpassHz, delayS } }. me { x, z },
 * muzzle { x, z } (null or mine: MUZZLE_AHEAD_M off), ears (defenders on), pKpa the air, bermX the berm's face.
 */
export function reportVoice({ me = null, muzzle = null, mine = true, ears = false, pKpa = AIR_KPA.ground, bermX = bermFor(me?.x ?? muzzle?.x), soundMs = SOUND_SPEED_MS }) {
  const dx = mine || !me || !muzzle ? 0 : muzzle.x - me.x, dz = mine || !me || !muzzle ? 0 : muzzle.z - me.z;
  const d = mine || !me || !muzzle ? MUZZLE_AHEAD_M : Math.hypot(dx, dz);
  const earsDb = ears ? EARS_DB : 0, air = airDb(pKpa), lp = lowpassHz(pKpa);
  const gainDb = REPORT_SOURCE_DB + air + dbOfDist(d) + earsDb;
  const lowHz = ears ? Math.min(lp, EARS_LP_HZ) : lp;
  // (0.0.7: a neighbour's report comes a sound's way late; yours at once)
  const delayS = mine || !(soundMs > 0) ? 0 : d / soundMs;
  return { gainDb, lowpassHz: lowHz, distM: d, pan: panOf(dx), delayS, echo: echoOf({ muzzleX: muzzle?.x ?? me?.x ?? 0, meX: me?.x ?? muzzle?.x ?? 0, gainDb, ears, bermX, pKpa, soundMs }) };
}
/** The berm's slap-back of a report heard at gainDb: { gainDb, lowpassHz, delayS, pathM } (out from the muzzle to the berm and back to you). */
export function echoOf({ muzzleX, meX = muzzleX, gainDb, ears = false, bermX = BERM_FACE_X, pKpa = AIR_KPA.ground, soundMs = SOUND_SPEED_MS }) {
  const pathM = Math.max(0, bermX - muzzleX) + Math.max(0, bermX - meX);
  const lp = Math.min(lowpassHz(pKpa), ECHO_LP_HZ, ears ? EARS_LP_HZ : Infinity, pathM > ECHO_REF_M ? distLowpassHz(pathM / 2, pKpa) : Infinity);
  // (0.0.7: a berm further than the bay's gives its slap-back fainter by the path past the bay's, so the KD's at 300 m is a far murmur)
  const farDb = pathM > ECHO_REF_M ? 20 * Math.log10(ECHO_REF_M / pathM) : 0;
  return { gainDb: gainDb + ECHO_DB + farDb, lowpassHz: lp, delayS: soundMs > 0 ? pathM / soundMs : 0, pathM };
}
/** The bay's slap-back path (m: 2 × 28 m from the line to its berm): past it, an echo falls off with its path. */
export const ECHO_REF_M = 2 * (BERM_FACE_X - (KD_RANGE.bay.lineX ?? 1100));
/** The low-pass distance adds (Hz): the air's corner down as DIST_LP_REF_M / d past DIST_LP_REF_M, never under DIST_LP_MIN_HZ. */
export const distLowpassHz = (dM, pKpa = AIR_KPA.ground) => Math.max(DIST_LP_MIN_HZ, Math.min(lowpassHz(pKpa), DIST_LP_REF_HZ * DIST_LP_REF_M / Math.max(DIST_LP_REF_M, dM)));
/** The electronic defenders on a sound heard at gainDb (an impulse over EARS_GATE_DB taken EARS_DB down and low-passed; a quieter one passes): { gainDb, lowpassHz }. */
export function throughEars(gainDb, lowHz, ears = false) {
  if (!ears || gainDb <= EARS_GATE_DB) return { gainDb, lowpassHz: lowHz };
  return { gainDb: Math.max(EARS_GATE_DB, gainDb + EARS_DB), lowpassHz: Math.min(lowHz, EARS_LP_HZ) };
}
/** The crack of your own round leaving (supersonic): { gainDb, lowpassHz, delayS }, or null for a subsonic one. */
export function crackVoice({ supersonic = true, ears = false, pKpa = AIR_KPA.ground } = {}) {
  if (!supersonic) return null;
  const raw = CRACK_SOURCE_DB + airDb(pKpa) + dbOfDist(MUZZLE_AHEAD_M), lp = lowpassHz(pKpa);
  // (an impulse: the defenders take it as they take the report)
  return { gainDb: raw + (ears ? EARS_DB : 0), lowpassHz: ears ? Math.min(lp, EARS_LP_HZ) : lp, delayS: 0.001 };
}
/**
 * The strike coming back to you: { gainDb, lowpassHz, delayS, distM, pan }: the round's flight (tofS) plus its distance to you
 * (at { x, z }, else rangeM from the muzzle beside you) over the speed of sound; inverse with distance, low-passed by it.
 */
export function strikeVoice({ me = null, at = null, rangeM = null, tofS = 0, soundMs = SOUND_SPEED_MS, ears = false, pKpa = AIR_KPA.ground }) {
  const dx = me && at ? at.x - me.x : rangeM ?? 0, dz = me && at ? at.z - me.z : 0, d = me && at ? Math.hypot(dx, dz) : Math.max(0, rangeM ?? 0);
  const raw = IMPACT_SOURCE_DB + airDb(pKpa) + dbOfDist(d), e = throughEars(raw, distLowpassHz(d, pKpa), ears);
  return { gainDb: e.gainDb, lowpassHz: e.lowpassHz, delayS: (Number(tofS) || 0) + (soundMs > 0 ? d / soundMs : 0), distM: d, pan: panOf(me && at ? dx : 0) };
}
/** A carrier on its rails in the pits (the pit fact's x, z): { gainDb, lowpassHz, delayS, distM, pan }, under the parapet when you are not in the pits. */
export function carrierVoice({ me, at, soundMs = SOUND_SPEED_MS, ears = false, inPits = false, pKpa = AIR_KPA.ground }) {
  const dx = at.x - me.x, dz = at.z - me.z, d = Math.hypot(dx, dz);
  const raw = CARRIER_SOURCE_DB + airDb(pKpa) + dbOfDist(d) + (inPits ? 0 : PARAPET_DB);
  const e = throughEars(raw, Math.min(distLowpassHz(d, pKpa), inPits ? Infinity : PARAPET_LP_HZ), ears);
  return { gainDb: e.gainDb, lowpassHz: e.lowpassHz, delayS: soundMs > 0 ? d / soundMs : 0, distM: d, pan: panOf(dx) };
}

/** A turner's motor or clack at the stand { x, z }: { gainDb, lowpassHz, distM, pan, delayS }. */
export function turnerVoice({ me, at, soundMs = SOUND_SPEED_MS, ears = false, pKpa = AIR_KPA.ground, away = false }) {
  const dx = at.x - me.x, dz = at.z - me.z, d = Math.hypot(dx, dz);
  const raw = TURNER_SOURCE_DB + airDb(pKpa) + dbOfDist(d) + (away ? -3 : 0), e = throughEars(raw, distLowpassHz(d, pKpa), ears);
  return { gainDb: e.gainDb, lowpassHz: e.lowpassHz, distM: d, pan: panOf(dx), delayS: soundMs > 0 ? d / soundMs : 0 };
}
/** The coach's timer's beep: { gainDb, lowpassHz, pan } (at BEEP_AT off your shoulder; its electronics pass the defenders). */
export function beepVoice({ pKpa = AIR_KPA.ground } = {}) {
  return { gainDb: BEEP_SOURCE_DB + airDb(pKpa) + dbOfDist(BEEP_AT.distM), lowpassHz: lowpassHz(pKpa), pan: BEEP_AT.pan };
}
/** A round ringing on steel at { x, z }: { gainDb, lowpassHz, distM, pan, delayS } (its flight, then a sound's way; an impulse through the defenders' gate). */
export function ringVoice({ me, at, tofS = 0, soundMs = SOUND_SPEED_MS, ears = false, pKpa = AIR_KPA.ground }) {
  const dx = at.x - me.x, dz = at.z - me.z, d = Math.hypot(dx, dz);
  const raw = STEEL_SOURCE_DB + airDb(pKpa) + dbOfDist(d), e = throughEars(raw, distLowpassHz(d, pKpa), ears);
  return { gainDb: e.gainDb, lowpassHz: e.lowpassHz, distM: d, pan: panOf(dx), delayS: (Number(tofS) || 0) + (soundMs > 0 ? d / soundMs : 0) };
}
/** Where a shot's turner stands ({ x, z }), from its key in the state's session (the pairs pad), or null. */
export function turnerAtOf(state, f) {
  const key = f?.target?.key ?? (typeof f?.target === 'string' ? f.target : null) ?? f?.key ?? f?.turner ?? null;
  const T = (state?.armoury?.range?.turners ?? []).find(t => t.key === key) ?? null;
  return T ? { x: T.x, z: T.z } : null;
}

/**
 * The reports' voices (see the header): { admit(atS, { gainDb }) → 'play' | 'merged' | 'full', active(atS), stats }. A report
 * (or an echo) at atS on the audio clock is merged into one sounding within mergeMs of it, refused when voices are
 * sounding, else played and held holdS.
 */
export function createReportLimiter({ voices = REPORT_VOICES, mergeMs = REPORT_MERGE_MS, holdS = REPORT_HOLD_S } = {}) {
  let live = [];
  const stats = { played: 0, merged: 0, full: 0, most: 0 };
  return {
    admit(atS) {
      live = live.filter(v => v.endS > atS - mergeMs / 1000);
      if (live.some(v => Math.abs(v.atS - atS) * 1000 <= mergeMs)) { stats.merged++; return 'merged'; }
      const now = live.filter(v => v.atS <= atS + mergeMs / 1000 && v.endS > atS).length;
      if (now >= voices) { stats.full++; return 'full'; }
      live.push({ atS, endS: atS + holdS });
      stats.played++;
      stats.most = Math.max(stats.most, now + 1);
      return 'play';
    },
    active(atS) { return live.filter(v => v.atS <= atS && v.endS > atS).length; },
    stats,
  };
}
/** A click of your own gun's action: { gainDb, lowpassHz } (at the hands, through the air, not muffled). */
export const clickVoice = ({ pKpa = AIR_KPA.ground } = {}) => ({ gainDb: CLICK_SOURCE_DB + airDb(pKpa), lowpassHz: lowpassHz(pKpa) });
/** A case landing at { x, z }, you at me: { gainDb, lowpassHz, distM, pan }. */
export function caseVoice({ me, at, pKpa = AIR_KPA.ground }) {
  const dx = (at?.x ?? me.x) - me.x, dz = (at?.z ?? me.z) - me.z, d = Math.hypot(dx, dz);
  return { gainDb: airDb(pKpa) + dbOfDist(d), lowpassHz: lowpassHz(pKpa), distM: d, pan: panOf(dx) };
}
/** The tower's chime as you hear it: { gainDb, lowpassHz, distM, pan } (0.0.7: through the defenders' circuit, low-passed at EARS_LP_HZ, when worn). */
export function chimeVoice({ me, tower = TOWER_AT, pKpa = AIR_KPA.ground, ears = false }) {
  const dx = tower.x - me.x, dz = tower.z - me.z, d = Math.hypot(dx, dz, tower.y ?? 0);
  return { gainDb: PA_SOURCE_DB + airDb(pKpa) + dbOfDist(d), lowpassHz: Math.min(lowpassHz(pKpa), 3500, ears ? EARS_LP_HZ : Infinity), distM: d, pan: panOf(dx) };
}

/** The clicks of an action: [[kind, fraction]] (ACTION_SOUNDS, a family's 'magOut:*' for 'magOut:drop'), or []. */
export function actionSoundsOf(action) {
  if (!action) return [];
  const a = String(action);
  return ACTION_SOUNDS[a] ?? ACTION_SOUNDS[`${a.split(':')[0]}:*`] ?? [];
}

/**
 * The game-clock scheduler of the clicks and ticks: { add(atMs, kind, extra), due(nowMs) → [entries], size }. due
 * returns what the drawn clock has passed, in time order, and drops what it passed more than LATE_MS ago (counted).
 */
export function createClickQueue({ lateMs = LATE_MS } = {}) {
  let list = [];
  const stats = { added: 0, played: 0, late: 0 };
  return {
    add(atMs, kind, extra = {}) { list.push({ atMs, kind, ...extra }); list.sort((a, b) => a.atMs - b.atMs); stats.added++; },
    due(nowMs) {
      const out = [];
      while (list.length && list[0].atMs <= nowMs) {
        const e = list.shift();
        if (nowMs - e.atMs > lateMs) { stats.late++; continue; }
        out.push(e); stats.played++;
      }
      return out;
    },
    clear() { list = []; },
    get size() { return list.length; },
    stats,
  };
}

/** A live round or the dummy landing: this much under a case's tick, low-passed here (dB, Hz). */
export const DULL_DB = -3, DULL_HZ = 1800;
/** A far sound under this is not played at all (dB over its peak: a voice spent on nothing heard). */
export const STRIKE_FLOOR_DB = -60;
/** Where a shot struck (x, z, m): the face it holed (the shot's face and flight: the range's lane at its line's distance east), else rangeM along its bearing from the muzzle. */
export function strikeAt(f, from) {
  const lane = f?.face?.lane ? KD_RANGE.kd?.lanes?.find?.(l => l.lane === f.face.lane) : null;
  if (lane?.face) return { x: lane.face.x, z: lane.face.z };
  if (!from || !Number.isFinite(f?.flight?.rangeM)) return null;
  const a = Number.isFinite(f.dirRad) ? f.dirRad : KD_RANGE.downrangeRad ?? 0;
  return { x: from.x + Math.cos(a) * f.flight.rangeM, z: from.z + Math.sin(a) * f.flight.rangeM };
}

/**
 * The range's sounds over an engine (engine.js's range handle: shot(kind, { delayS, gainDb, lowHz, pan })):
 * { fact(type, payload, state), frame(state, { alpha }), stats }. looks: { kitLook(state, pid) } (arms' look.js).
 */
export function createRange(engine, { looks = {}, clock = () => (globalThis.performance?.now?.() ?? 0) / 1000 } = {}) {
  const queue = createClickQueue();
  const limiter = createReportLimiter();
  const stats = { reports: 0, echoes: 0, clicks: 0, dry: 0, cases: 0, chimes: 0, cracks: 0, strikes: 0, carriers: 0, motors: 0, clacks: 0, beeps: 0, rings: 0, rowShots: 0, byKind: {}, lastReport: null, lastEcho: null, lastClick: null, lastCase: null, lastChime: null, lastCrack: null, lastStrike: null, lastCarrier: null, lastTurner: null, lastBeep: null, lastRing: null, lastRowShot: null, queue: queue.stats, voices: limiter.stats };
  const seen = new Set();                                          // (a sub-step's clicks scheduled once: step, i, fromMs)
  let lastState = null;
  // (the defenders: the range's earsOn where it has one (0.0.7's ears slot), else the kit's look of the head)
  const earsOf = (state) => {
    try { const pid = playerId(state); return looks.earsOn ? !!looks.earsOn(state, pid) || !!looks.kitLook?.(state, pid)?.ears : !!looks.kitLook?.(state, pid)?.ears; } catch { return false; }
  };
  // (a report or an echo through the voices' limit, at its moment on the audio clock)
  const impulse = (kind, opts) => {
    const verdict = limiter.admit(clock() + (opts.delayS ?? 0));
    return verdict === 'play' ? engine.shot(kind, opts) : false;
  };
  const meOf = (state) => { const a = playerActor(state); return a ? { x: a.x, z: a.z } : null; };
  const r1 = (v) => Math.round(v * 10) / 10;

  // (0.0.8: a turn's beep once, however many turners turn on that tick)
  let beepAtMs = null;
  function fact(type, f, state) {
    if (!state || !f) return false;
    // (0.0.8: a row's round heard at its own formula time: its fact comes on the first tick at or after it, which the picture
    // draws a tick behind (the effects at their own time), so the report waits the round's place in that tick on the audio
    // clock, and a Pair's two reports stand its split apart, the tier one's hammer 0.11 s, not a tick's 0.10 or 0.15)
    if (type === 'shot' && f.row && f.fired !== false && Number.isFinite(f.atMs)) {
      const lagS = Math.max(0, Math.min(TICK_MS, f.atMs - (state.clock.ms - TICK_MS))) / 1000;
      const ok = shotSound(f, state, lagS);
      if (ok) { stats.rowShots++; stats.lastRowShot = { atMs: f.atMs, row: f.row ?? null, lagS: Math.round(lagS * 1000) / 1000 }; }
      return ok;
    }
    if (type === 'turner') {
      const at = Number.isFinite(f.x) && Number.isFinite(f.z) ? { x: f.x, z: f.z } : (state.armoury?.range?.turners ?? []).find(t => t.key === f.key) ?? null;
      if (!at || !Number.isFinite(f.atMs)) return false;
      const toMs = Number.isFinite(f.toMs) ? f.toMs : f.atMs + 300, away = f.phase === 'away';
      queue.add(f.atMs, 'turnerMotor', { at: { x: at.x, z: at.z }, away });
      queue.add(toMs, 'turnerClack', { at: { x: at.x, z: at.z }, away });
      if (!away && beepAtMs !== f.atMs) { beepAtMs = f.atMs; queue.add(f.atMs, 'timerBeep', {}); }
      return true;
    }
    if (type === 'shot') return shotSound(f, state);
    return otherFact(type, f, state);
  }
  function shotSound(f, state, lagS = 0) {
    if (f.fired === false) {
      if (!DRY_WHY.includes(f.why) || f.who !== playerId(state)) return false;
      const v = clickVoice();
      if (engine.shot('dryClick', { gainDb: v.gainDb, lowHz: v.lowpassHz })) { stats.dry++; stats.lastClick = { kind: 'dryClick', why: f.why }; return true; }
      return false;
    }
    const me = meOf(state), mine = f.who === playerId(state), ears = earsOf(state), c = soundMsAt(state);
    const muzzle = Array.isArray(f.muzzle) ? { x: f.muzzle[0], z: f.muzzle[1] } : f.muzzle ?? null;
    const v = reportVoice({ me, muzzle, mine, ears, soundMs: c });
    const ok = impulse('report', { delayS: v.delayS + lagS, gainDb: v.gainDb, lowHz: v.lowpassHz, pan: v.pan });
    if (ok) { stats.reports++; stats.lastReport = { gainDb: r1(v.gainDb), lowpassHz: Math.round(v.lowpassHz), distM: r1(v.distM), delayS: Math.round(v.delayS * 1000) / 1000, ears, mine }; }
    if (impulse('report', { delayS: v.echo.delayS + lagS, gainDb: v.echo.gainDb, lowHz: v.echo.lowpassHz, pan: v.pan, rate: 0.92 })) { stats.echoes++; stats.lastEcho = { gainDb: r1(v.echo.gainDb), lowpassHz: Math.round(v.echo.lowpassHz), delayS: Math.round(v.echo.delayS * 1000) / 1000 }; }
    // (0.0.7: your own round's crack as it leaves, then its strike coming back a flight and a sound's way later)
    // (only a shot at a face (the zero card, a KD face) has them: test-handling's card sounds as it was scored)
    const fl = f.face ? f.flight ?? null : null;
    if (mine && fl) {
      const k = crackVoice({ supersonic: fl.supersonic !== false, ears });
      if (k && engine.shot('crack', { delayS: k.delayS + lagS, gainDb: k.gainDb, lowHz: k.lowpassHz })) { stats.cracks++; stats.lastCrack = { gainDb: r1(k.gainDb) }; }
    }
    if (fl && Number.isFinite(fl.rangeM) && fl.rangeM > 0) {
      const at = strikeAt(f, muzzle ?? me);
      const sv = strikeVoice({ me, at, rangeM: fl.rangeM, tofS: fl.tofS ?? 0, soundMs: c, ears });
      if (sv.gainDb > STRIKE_FLOOR_DB && impulse('impact', { delayS: sv.delayS + lagS, gainDb: sv.gainDb, lowHz: sv.lowpassHz, pan: sv.pan })) { stats.strikes++; stats.lastStrike = { gainDb: r1(sv.gainDb), lowpassHz: Math.round(sv.lowpassHz), delayS: Math.round(sv.delayS * 1000) / 1000, distM: r1(sv.distM), mine }; }
    }
    // (the case, a dud or a stripped round: a tick where it lands, when the clock passes its landing)
    if (f.brass && Number.isFinite(f.brass.landMs)) queue.add(f.brass.landMs, 'caseTick', { at: Array.isArray(f.brass.at) ? { x: f.brass.at[0], z: f.brass.at[1] } : f.brass.at ?? null, what: f.brass.kind });
    // (0.0.8: a round that rang on the armoured face's steel, the plate's ring where it stands)
    if (f.ring && !f.through && me) {
      const at = turnerAtOf(state, f);
      if (at) {
        const rv = ringVoice({ me, at, tofS: f.flight?.tofS ?? 0, soundMs: c, ears });
        // (the plate's own voice, not one of the reports' (their limit would merge it into the report it rides behind))
        if (engine.shot('steelRing', { delayS: rv.delayS + lagS, gainDb: rv.gainDb, lowHz: rv.lowpassHz, pan: rv.pan })) { stats.rings++; stats.lastRing = { gainDb: r1(rv.gainDb), distM: r1(rv.distM), delayS: Math.round(rv.delayS * 1000) / 1000 }; }
      }
    }
    return ok;
  }
  function otherFact(type, f, state) {
    if (type === 'step') {
      if (f.who && f.who !== playerId(state)) return false;
      if (f.phase !== 'start' && f.phase !== 'sub') return false;
      if (!Number.isFinite(f.fromMs) || !Number.isFinite(f.toMs) || f.toMs <= f.fromMs) return false;
      const key = `${f.step}|${f.i}|${f.fromMs}`;
      if (seen.has(key)) return false;
      seen.add(key);
      if (seen.size > 256) seen.delete(seen.values().next().value);
      for (const [kind, k] of actionSoundsOf(f.action)) queue.add(f.fromMs + k * (f.toMs - f.fromMs), kind, { action: f.action });
      // (what the step threw out of the port, a cleared case, the coach's dummy, a stripped round: its tick where it lands)
      for (const b of f.brass ?? []) if (Number.isFinite(b.landMs)) queue.add(b.landMs, 'caseTick', { at: Array.isArray(b.at) ? { x: b.at[0], z: b.at[1] } : b.at ?? null, what: b.kind });
      return true;
    }
    if (type === 'pit') {
      // (a carrier running down or up its rails, where it is, a sound's way late, under the parapet)
      if (f.phase !== 'down' && f.phase !== 'up') return false;
      const me = meOf(state);
      if (!me || !Number.isFinite(f.x) || !Number.isFinite(f.z)) return false;
      const pits = KD_RANGE.kd?.pits, inPits = !!pits && me.x >= pits.x0 && me.x <= pits.x1;
      const v = carrierVoice({ me, at: { x: f.x, z: f.z }, soundMs: soundMsAt(state), ears: earsOf(state), inPits });
      if (v.gainDb > STRIKE_FLOOR_DB && engine.shot('carrier', { delayS: v.delayS, gainDb: v.gainDb, lowHz: v.lowpassHz, pan: v.pan, rate: f.phase === 'up' ? 1.06 : 0.94 })) { stats.carriers++; stats.lastCarrier = { gainDb: r1(v.gainDb), delayS: Math.round(v.delayS * 1000) / 1000, distM: r1(v.distM), phase: f.phase }; return true; }
      return false;
    }
    if (type === 'say' && f.kind === 'pa') {
      const me = meOf(state);
      if (!me) return false;
      const v = chimeVoice({ me, ears: earsOf(state) });
      if (engine.shot('chime', { gainDb: v.gainDb, lowHz: v.lowpassHz, pan: v.pan })) { stats.chimes++; stats.lastChime = { gainDb: r1(v.gainDb), distM: r1(v.distM) }; return true; }
    }
    return false;
  }

  /** A frame: the clicks and the ticks the drawn clock has passed (none while time stands still). */
  function frame(state, { alpha = 0 } = {}) {
    if (state !== lastState) { queue.clear(); seen.clear(); lastState = state; beepAtMs = null; }
    if (!state || state.skip) return;
    const nowMs = state.clock.ms + (isHeld(state) ? 0 : Math.max(0, Math.min(1, alpha)) * TICK_MS);
    const due = queue.due(nowMs);
    if (!due.length) return;
    const me = meOf(state);
    for (const e of due) {
      // (0.0.8: the turner's motor and clack; the timer's beep)
      if (e.kind === 'turnerMotor' || e.kind === 'turnerClack') {
        if (!me || !e.at) continue;
        const v = turnerVoice({ me, at: e.at, soundMs: soundMsAt(state), ears: earsOf(state), away: !!e.away });
        if (engine.shot(e.kind, { delayS: v.delayS, gainDb: v.gainDb, lowHz: v.lowpassHz, pan: v.pan, rate: e.away ? 0.92 : 1 })) { if (e.kind === 'turnerMotor') stats.motors++; else stats.clacks++; stats.lastTurner = { kind: e.kind, gainDb: r1(v.gainDb), distM: r1(v.distM), atMs: e.atMs, away: !!e.away }; }
        continue;
      }
      if (e.kind === 'timerBeep') {
        const v = beepVoice();
        if (engine.shot('timerBeep', { gainDb: v.gainDb, lowHz: v.lowpassHz, pan: v.pan })) { stats.beeps++; stats.lastBeep = { gainDb: r1(v.gainDb), atMs: e.atMs }; }
        continue;
      }
      if (e.kind === 'caseTick') {
        if (!me) continue;
        // (a live round or the dummy lands duller than an empty case: heavier, no ring (DULL_DB, DULL_HZ: my calls))
        const v = caseVoice({ me, at: e.at ?? me }), dull = e.what === 'round' || e.what === 'tracer' || e.what === 'dummy';
        if (engine.shot('caseTick', { gainDb: v.gainDb + (dull ? DULL_DB : 0), lowHz: dull ? Math.min(v.lowpassHz, DULL_HZ) : v.lowpassHz, pan: v.pan, rate: dull ? 0.8 : 1 })) { stats.cases++; stats.lastCase = { gainDb: r1(v.gainDb), distM: r1(v.distM), what: e.what ?? 'case' }; }
        continue;
      }
      const v = clickVoice();
      if (engine.shot(e.kind, { gainDb: v.gainDb, lowHz: v.lowpassHz })) { stats.clicks++; stats.byKind[e.kind] = (stats.byKind[e.kind] ?? 0) + 1; stats.lastClick = { kind: e.kind, action: e.action ?? null }; }
    }
  }

  return { fact, frame, stats };
}
