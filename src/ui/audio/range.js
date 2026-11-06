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
import { playerActor, playerId } from '../../core/ids.js';
import { isHeld, TICK_MS } from '../../core/clock.js';
import { airDb } from '../../sim/people/hearing.js';
import { lowpassHz } from './steps.js';
import { KD_RANGE } from '../../data/places/range.js';
import { AIR_KPA, ROLLOFF, PAN_FULL_M, REPORT_SOURCE_DB, MUZZLE_AHEAD_M, ECHO_DB, ECHO_LP_HZ, SOUND_SPEED_MS, EARS_DB, EARS_LP_HZ, CLICK_SOURCE_DB, PA_SOURCE_DB, ACTION_SOUNDS, DRY_WHY } from '../../data/sounds.js';

/** The berm's face (x, m) and the tower's speaker ({ x, y, z }, m: its deck) on the 25 m bay (PLACES §4.12: src/data/places/range.js, the stage's authored bay). */
export const BERM_FACE_X = KD_RANGE.bay.berm[0], TOWER_AT = Object.freeze({ x: KD_RANGE.tower.ro.x, y: KD_RANGE.tower.deckY, z: KD_RANGE.tower.ro.z });
/** A click or a tick the drawn clock passed more than this long ago is dropped, not played late (ms: a skip, a stall). */
export const LATE_MS = 250;

const dbOfDist = (dM, roll = ROLLOFF.ground) => 20 * Math.log10(1 / (1 + roll * Math.max(0, dM - 1)));
const panOf = (dx) => Math.max(-1, Math.min(1, dx / PAN_FULL_M));

/**
 * The report as you hear it: { gainDb, lowpassHz, distM, pan, echo: { gainDb, lowpassHz, delayS } }. me { x, z },
 * muzzle { x, z } (null or mine: MUZZLE_AHEAD_M off), ears (defenders on), pKpa the air, bermX the berm's face.
 */
export function reportVoice({ me = null, muzzle = null, mine = true, ears = false, pKpa = AIR_KPA.ground, bermX = BERM_FACE_X }) {
  const dx = mine || !me || !muzzle ? 0 : muzzle.x - me.x, dz = mine || !me || !muzzle ? 0 : muzzle.z - me.z;
  const d = mine || !me || !muzzle ? MUZZLE_AHEAD_M : Math.hypot(dx, dz);
  const earsDb = ears ? EARS_DB : 0, air = airDb(pKpa), lp = lowpassHz(pKpa);
  const gainDb = REPORT_SOURCE_DB + air + dbOfDist(d) + earsDb;
  const lowHz = ears ? Math.min(lp, EARS_LP_HZ) : lp;
  return { gainDb, lowpassHz: lowHz, distM: d, pan: panOf(dx), echo: echoOf({ muzzleX: muzzle?.x ?? me?.x ?? 0, meX: me?.x ?? muzzle?.x ?? 0, gainDb, ears, bermX, pKpa }) };
}
/** The berm's slap-back of a report heard at gainDb: { gainDb, lowpassHz, delayS, pathM } (out from the muzzle to the berm and back to you). */
export function echoOf({ muzzleX, meX = muzzleX, gainDb, ears = false, bermX = BERM_FACE_X, pKpa = AIR_KPA.ground }) {
  const pathM = Math.max(0, bermX - muzzleX) + Math.max(0, bermX - meX);
  const lp = Math.min(lowpassHz(pKpa), ECHO_LP_HZ, ears ? EARS_LP_HZ : Infinity);
  return { gainDb: gainDb + ECHO_DB, lowpassHz: lp, delayS: pathM / SOUND_SPEED_MS, pathM };
}
/** A click of your own gun's action: { gainDb, lowpassHz } (at the hands, through the air, not muffled). */
export const clickVoice = ({ pKpa = AIR_KPA.ground } = {}) => ({ gainDb: CLICK_SOURCE_DB + airDb(pKpa), lowpassHz: lowpassHz(pKpa) });
/** A case landing at { x, z }, you at me: { gainDb, lowpassHz, distM, pan }. */
export function caseVoice({ me, at, pKpa = AIR_KPA.ground }) {
  const dx = (at?.x ?? me.x) - me.x, dz = (at?.z ?? me.z) - me.z, d = Math.hypot(dx, dz);
  return { gainDb: airDb(pKpa) + dbOfDist(d), lowpassHz: lowpassHz(pKpa), distM: d, pan: panOf(dx) };
}
/** The tower's chime as you hear it: { gainDb, lowpassHz, distM, pan }. */
export function chimeVoice({ me, tower = TOWER_AT, pKpa = AIR_KPA.ground }) {
  const dx = tower.x - me.x, dz = tower.z - me.z, d = Math.hypot(dx, dz, tower.y ?? 0);
  return { gainDb: PA_SOURCE_DB + airDb(pKpa) + dbOfDist(d), lowpassHz: Math.min(lowpassHz(pKpa), 3500), distM: d, pan: panOf(dx) };
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

/**
 * The range's sounds over an engine (engine.js's range handle: shot(kind, { delayS, gainDb, lowHz, pan })):
 * { fact(type, payload, state), frame(state, { alpha }), stats }. looks: { kitLook(state, pid) } (arms' look.js).
 */
export function createRange(engine, { looks = {} } = {}) {
  const queue = createClickQueue();
  const stats = { reports: 0, echoes: 0, clicks: 0, dry: 0, cases: 0, chimes: 0, byKind: {}, lastReport: null, lastEcho: null, lastClick: null, lastCase: null, lastChime: null, queue: queue.stats };
  const seen = new Set();                                          // (a sub-step's clicks scheduled once: step, i, fromMs)
  let lastState = null;
  const earsOf = (state) => {
    try { return !!looks.kitLook?.(state, playerId(state))?.ears; } catch { return false; }
  };
  const meOf = (state) => { const a = playerActor(state); return a ? { x: a.x, z: a.z } : null; };
  const r1 = (v) => Math.round(v * 10) / 10;

  function fact(type, f, state) {
    if (!state || !f) return false;
    if (type === 'shot') {
      if (f.fired === false) {
        if (!DRY_WHY.includes(f.why) || f.who !== playerId(state)) return false;
        const v = clickVoice();
        if (engine.shot('dryClick', { gainDb: v.gainDb, lowHz: v.lowpassHz })) { stats.dry++; stats.lastClick = { kind: 'dryClick', why: f.why }; return true; }
        return false;
      }
      const me = meOf(state), mine = f.who === playerId(state), ears = earsOf(state);
      const v = reportVoice({ me, muzzle: f.muzzle ?? null, mine, ears });
      const ok = engine.shot('report', { gainDb: v.gainDb, lowHz: v.lowpassHz, pan: v.pan });
      if (ok) { stats.reports++; stats.lastReport = { gainDb: r1(v.gainDb), lowpassHz: Math.round(v.lowpassHz), distM: r1(v.distM), ears, mine }; }
      if (engine.shot('report', { delayS: v.echo.delayS, gainDb: v.echo.gainDb, lowHz: v.echo.lowpassHz, pan: v.pan, rate: 0.92 })) { stats.echoes++; stats.lastEcho = { gainDb: r1(v.echo.gainDb), lowpassHz: Math.round(v.echo.lowpassHz), delayS: Math.round(v.echo.delayS * 1000) / 1000 }; }
      // (the case, a dud or a stripped round: a tick where it lands, when the clock passes its landing)
      if (f.brass && Number.isFinite(f.brass.landMs)) queue.add(f.brass.landMs, 'caseTick', { at: Array.isArray(f.brass.at) ? { x: f.brass.at[0], z: f.brass.at[1] } : f.brass.at ?? null, what: f.brass.kind });
      return ok;
    }
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
    if (type === 'say' && f.kind === 'pa') {
      const me = meOf(state);
      if (!me) return false;
      const v = chimeVoice({ me });
      if (engine.shot('chime', { gainDb: v.gainDb, lowHz: v.lowpassHz, pan: v.pan })) { stats.chimes++; stats.lastChime = { gainDb: r1(v.gainDb), distM: r1(v.distM) }; return true; }
    }
    return false;
  }

  /** A frame: the clicks and the ticks the drawn clock has passed (none while time stands still). */
  function frame(state, { alpha = 0 } = {}) {
    if (state !== lastState) { queue.clear(); seen.clear(); lastState = state; }
    if (!state || state.skip) return;
    const nowMs = state.clock.ms + (isHeld(state) ? 0 : Math.max(0, Math.min(1, alpha)) * TICK_MS);
    const due = queue.due(nowMs);
    if (!due.length) return;
    const me = meOf(state);
    for (const e of due) {
      if (e.kind === 'caseTick') {
        if (!me) continue;
        // (a live round or the dummy lands duller than an empty case: heavier, no ring (DULL_DB, DULL_HZ: my calls))
        const v = caseVoice({ me, at: e.at ?? me }), dull = e.what === 'round' || e.what === 'dummy';
        if (engine.shot('caseTick', { gainDb: v.gainDb + (dull ? DULL_DB : 0), lowHz: dull ? Math.min(v.lowpassHz, DULL_HZ) : v.lowpassHz, pan: v.pan, rate: dull ? 0.8 : 1 })) { stats.cases++; stats.lastCase = { gainDb: r1(v.gainDb), distM: r1(v.distM), what: e.what ?? 'case' }; }
        continue;
      }
      const v = clickVoice();
      if (engine.shot(e.kind, { gainDb: v.gainDb, lowHz: v.lowpassHz })) { stats.clicks++; stats.byKind[e.kind] = (stats.byKind[e.kind] ?? 0) + 1; stats.lastClick = { kind: e.kind, action: e.action ?? null }; }
    }
  }

  return { fact, frame, stats };
}
