// OLYMPUS sim: the shot, its DC, every modifier, the odds the plaque shows and the roll that resolves it (WEAPONS §7; the build sheet 0.0.5 §2.2).
//
// Tradecraft's shot model (src/sim/shooting.js: aimMs, odds, shotOf, fireMs, tapsOf, climbOf), kept
// as the user asked ("Shooting should play as in Tradecraft", 2026-11-05), with WEAPONS §7's changes:
//   the DC      dcOf: SHOT_DC0 6 (tradecraft's SHOT.dc) + the kind's baseDC (a rifle 0) + the model's
//               acc (the R-7 0) + rangeDC(d) + the part's (torso 0, head +6, legs +3, a thing lying
//               about +4) or a paper's own targetDC (src/sim/arms/paper.js: the 25 m card +6), where
//               rangeDC(d) = round(5 × log2(max(d, 10 m) / 10 m)) (WEAPONS §7.2: every doubling of
//               range costs 5, so nobody is always sure or always lost from 0 to 600 m; tradecraft's
//               perM and perM² saturated at 25 m and fell to a natural 20 past 50). The 25 m card is
//               6 + 0 + 0 + 7 + 6 = DC 19, its parts listed for the log and the plaque's hover.
//   the mods    modsOf, each { why, v, src } in SKILLS' order: the position (standing 0, kneeling +2,
//               prone +4: tradecraft had no stance, quirk 7), the aim held (+round(min(4, heldS × (2 +
//               MRK/10))): tradecraft's +3 a second to +4, the rate Marksmanship's) or "still coming
//               down from the last" −2 while the muzzle settles, a follow-up's climb (−round(BURST_K 2 ×
//               k × recoil × climbOf(MRK) × support), prone support 0.8), the light on the target (dark −4,
//               dim −2), the optic (opticMod: the SO-4 at 1× +1 within 25 m), the tempo (rushed −3),
//               and the body and needs on Marksmanship's uses through the roller (eyes, arms, breath:
//               tired, cold hands, the breath after a run). No wind or holdover yet (0.0.7).
//   the odds    oddsOf on the same list (SKILLS §5.11): the plaque (plaqueOf) and the roll are one
//               computation, on what the shooter believes, which on a known-distance line in still air
//               is the truth, so here the plaque's percentage is the true odds (WEAPONS §7.10). On a
//               paper target the figure is the chance of a hole, the roll's margin at the card's edge
//               ring (paper.js KD_RINGS' last, −3) or better: the shooter's question at a card is "on the
//               paper?", and the edge ring's 2 sits under the DC (the parity review's: 85% on the plaque,
//               94.9% of rounds on the paper, where tradecraft's figure was the hole rate exactly; my
//               call). rollOdds keeps the roll's own pass at the DC.
//   the aim     aimS: 0.6 × pace × the kind's sight × the optic's sight + the turn / ((90 + 6 WH) × the
//               kind's turn) + (past the arms' arc, min(100°, 30° + 2° WH), 0.4 × pace for the feet) +
//               the posture's toAim × pace: tradecraft's AIM, a Weapon handling step (the R-7 from low
//               ready at WH 10: 0.87 s, lived 900 ms).
//   the pull    fireMs: TRIGGER_S 0.15 + (n − 1) × 60 / rpm + RECOVER_S 0.35 × recoil × pace × anchor ×
//               (1 + 0.3 (n − 1)), the cyclic rate in place of tradecraft's BURST_GAP_S, the recovery
//               on Weapon handling's pace (the R-7 at WH 10: 0.395 s, lived 400 ms). Recoil's impulse
//               does not change at 0.38 G and a planted shooter (standing, kneeling or prone on Mars)
//               keeps none of it: anchor 1.0 and climb ×1.0 (WEAPONS §7.8's 'planted').
//   taps        tapsOf: a double tap from Marksmanship 8, a triple from 18 (tradecraft's TAP_SKILL,
//               the skill moved to Marksmanship as SKILLS §2.1 assigns it); climbOf(MRK) =
//               clamp(1.4 − MRK / 25, 0.35, 1.4).
// resolveShot(state, bus, { pid, gunId, target, part, tempo, follow }) is WEAPONS §7.11's resolver for
// one pull: every draw on the shot's own stream, stream('shot', seed, pid, gunId, gun.rounds, shotId) (so
// shooting moves none of the game's other dice; the shot's id so a pull that counted no round never
// repeats the last one's dice), the pull (firearms.js pull(): a click, a set
// stoppage, a fired round), the belief by what the holder felt (feel()), the Marksmanship roll at
// pressure evaluated (never routine), the hole on the paper by hash (paper.js holeOf), the case thrown
// (look.js ejectCase), the roll in the log with its DC's parts and the hole as its verb, the 'roll',
// 'shot' and 'fx' facts. It returns { ms, shot } and records nothing of the range: the session's
// bookkeeping is the scene's (src/sim/scenarios/handling.js recordShot).
//
// 0.0.7, the shot at distance (WEAPONS §7.3, §7.4, §7.10; the build sheet 0.0.7 §2.1, §8 items 2, 4, 6, 8 and 9):
//   sitting     a stance of its own, +3 (POSITION.sit, "sitting"), offered by its own row (shooting.js).
//   the optic   opticMod at the SO-4's lever (firearms.js opticOf: 1× +1 within 25 m as before; 4× +5 to
//               300 m, its sight picture 1.20 in the aim's time).
//   the strike  poiOf(): where the round goes against the point of aim at the face, in centimetres, as the
//               truth or as the shooter believes it, four terms keyed for the plaque and the log: the zero
//               ((sight − zero) × CLICK_MRAD × d / 10 each axis: the turrets against the rifle's true zero,
//               or against the zero its holder believes), the path (ballistics.js flight() for the BZO in
//               the place's air, the Corps' dope card: believed exactly), the wind (the drift of the true
//               crosswind along the path at the moment, wind.js pathWind; believed, the shooter's read or
//               the coach's call, the later) and the hold (stop.hold { xMil (+ right), yMil (+ high) }: the
//               point of aim moved off the face's centre, as a shooter says it, "hold half a mil left", so the
//               strike moves with it; a wind from the left is held left, into it (my call: the sheet's
//               "moving the point of aim" read this way); HOLD_STEP_MRAD 0.25 within ±HOLD_MAX_MRAD 3). **On a face the bias moves the hole in
//               centimetres and is not a modifier** (§8 item 2): the d20 decides the group's spread
//               (paper.js faceHole), the strike moves it, the ring is scored where it lands. On a person it
//               would be WEAPONS §7.4's biasMod(biasCm, partRadiusCm) = −round(5 log2(1 + |bias| / r)),
//               built and tested this round, used by none.
//   the plaque  on a face, the chance of a scoring hit (a 2 or better) on the believed strike (paper.js
//               faceOdds), a percentage on a known line when the read's band moves it under 10 points,
//               else SKILLS §5.11's words at the band's two ends; its terms (the range, the wind as read,
//               the hold, the turrets against the believed zero) and kd: { aimCm, poiCm, holdMil,
//               scoreOdds, ringOdds }. The 25 m card's plaque is v0.0.5's.
//   the record  resolveShot on a face: face, aimCm, poiCm (the truth's, with its terms), hole { at, score,
//               v, onPaper, band }, crossMs (the true wind); every shot gains flight { rangeM, tofS, vMs,
//               eJ, supersonic } (test-handling's card too: an additive field). The roll's log line lists the
//               true terms with the shooter's belief beside them (WEAPONS §7.10): "A 4, high left: wind 4.6
//               m/s (you read 3), held 0.5 mil right."
// Pure but resolveShot.
import { stream } from '../../core/rng.js';
import { nextId, playerActor } from '../../core/ids.js';
import { lightLevel } from '../places/light.js';
import { logEntry } from '../log.js';
import { paceOf } from '../skills/skills.js';
import { check, oddsOf, sortMods, TEMPO, checkShort } from '../skills/checks.js';
import { rollerOf, DARK_BELOW, DIM_BELOW } from '../combat/roll.js';
import { PAPERS, holeOf, KD_RINGS, isFace, faceHole, faceOdds, poiXY } from './paper.js';
import { MODELS, KINDS, OPTICS, opticSight } from './models.js';
import { pull, feel, REFUSALS, gunField, sightOf, zeroOfGun, beliefZero, opticOf, beliefOf } from './firearms.js';
import { flight, envOfPlace, CLICK_MRAD } from './ballistics.js';
import { pathWind, windWords } from './wind.js';
import { carryOf, muzzleOf, POSTURES } from './carry.js';
import { ejectCase } from './look.js';
import { FACE_DOWN_UP } from './pits.js';

/** The shot's base DC (tradecraft's SHOT.dc). */
export const SHOT_DC0 = 6;
/** The part aimed at (tradecraft's PART_DC; a thing lying about +4: WEAPONS §7.2). */
export const PART_DC = Object.freeze({ torso: 0, head: 6, legs: 3, thing: 4 });
/** The shooter's position (WEAPONS §7.3, my call): standing 0, kneeling +2, prone +4; and the words. */
export const POSITION = Object.freeze({ stand: 0, kneel: 2, prone: 4, sit: 3 });
export const POSITION_WORD = Object.freeze({ stand: 'standing', kneel: 'kneeling', prone: 'prone', sit: 'sitting' });
/** The reticle's hold (0.0.7): its step and reach (mrad), and what a change of it costs (ms; the held aim kept). */
export const HOLD_STEP_MRAD = 0.25, HOLD_MAX_MRAD = 3, HOLD_SHIFT_MS = 300;
/** WEAPONS §7.4's part radii for biasMod (cm): torso, head, legs; a KD face's is its paper's biasRadiusCm. */
export const PART_RADIUS_CM = Object.freeze({ torso: 25, head: 9, legs: 15 });
/** The aim held: at most +HELD_MAX, at HELD_RATE0 + Marksmanship / 10 a second; coming down from the last, COMING_DOWN. */
export const HELD_MAX = 4, HELD_RATE0 = 2, COMING_DOWN = -2;
/** The pull and its recovery (tradecraft's), seconds. */
export const TRIGGER_S = 0.15, RECOVER_S = 0.35;
/** A tap's split (tradecraft's), seconds; the Marksmanship a double and a triple need. */
export const TAP_SPLIT_S = 0.25, TAP_SKILL = Object.freeze({ 2: 8, 3: 18 });
/** A follow-up's climb (WEAPONS §7.6): BURST_K × k × recoil × climbOf × support. */
export const BURST_K = 2, SUPPORT = Object.freeze({ stand: 1, kneel: 1, prone: 0.8, sit: 0.9 });
export const CLIMB = Object.freeze({ max: 1.4, per: 25, min: 0.35 });
/** The aim (tradecraft's AIM): the sight picture, the turn's rate, the arms' arc, the feet. */
export const AIM = Object.freeze({ sight: 0.6, turn: Object.freeze({ base: 90, per: 6 }), arc: Object.freeze({ base: 30, per: 2, max: 100 }), feet: 0.4 });
/** The light on the target (tradecraft's shotOf): dark and dim. */
export const LIGHT_MOD = Object.freeze({ dark: -4, dim: -2 });
/** The shooter's recoil anchor at 0.38 G (WEAPONS §7.8: 'planted' standing, kneeling or prone at 0.3 G or more). */
export const ANCHOR = Object.freeze({ recover: 1, climb: 1 });

const D2R = Math.PI / 180;
const wrap = (a) => ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;

/** WEAPONS §7.2's range term (see the header). */
export const rangeDC = (dM) => Math.round(5 * Math.log2(Math.max(dM, 10) / 10));

/** WEAPONS §3.5's optic modifier at a magnification and a range (a magnified optic; mag 0 iron sights, 'dot' a red dot). */
export function opticMod(mag, dM) {
  if (!mag) return 0;
  if (mag === 'dot') return 1;
  if (dM < 4 * mag && mag > 1) return -Math.round(Math.log2(mag));
  const v = Math.round(1 + 2 * Math.log2(mag));
  const cap = dM <= 25 ? 1 : dM <= 100 ? 3 : dM <= 300 ? 6 : 10;
  return Math.min(v, cap);
}

/** WEAPONS §7.4's bias helper: an uncorrected offset against a part's radius as a modifier, −round(5 log2(1 + |bias| / r)). */
export const biasMod = (biasCm, partRadiusCm) => -Math.round(5 * Math.log2(1 + Math.abs(biasCm) / partRadiusCm)) || 0;

/** The muzzle's climb on a follow-up, by Marksmanship (tradecraft's climbOf). */
export const climbOf = (mrk) => Math.max(CLIMB.min, Math.min(CLIMB.max, CLIMB.max - mrk / CLIMB.per));
/** The most rounds one press and its quick follow-ups put out: 1, 2 (a double tap), 3 (a triple). */
export const tapsOf = (mrk) => (mrk >= TAP_SKILL[3] ? 3 : mrk >= TAP_SKILL[2] ? 2 : 1);

/** A shot's DC at a target (see the header): { dc, parts: [{ why, v }] }, range first, base last (WEAPONS §7.10's order). */
export function dcOf({ model = 'r7', rangeM, part = 'torso', paper = null }) {
  const M = MODELS[model], K = KINDS[M.kind], P = paper ? PAPERS[paper] : null;
  const parts = [
    { why: `${Math.round(rangeM)} m`, v: rangeDC(rangeM) },
    P ? { why: P.word, v: P.targetDC } : { why: `the ${part}`, v: PART_DC[part] ?? 0 },
    { why: `the ${M.short}`, v: (K.baseDC ?? 0) + (M.acc ?? 0) },
    { why: 'base', v: SHOT_DC0 },
  ];
  return { dc: parts.reduce((s, p) => s + p.v, 0), parts };
}

/** The aim's time, seconds (see the header; WEAPONS §7.1). */
export function aimS({ pace, kindSight = 1, opticSight = 1, turnDeg = 0, value = 0, kindTurn = 1, toAimS = 0 }) {
  const arc = Math.min(AIM.arc.max, AIM.arc.base + AIM.arc.per * value);
  return AIM.sight * pace * kindSight * opticSight + turnDeg / ((AIM.turn.base + AIM.turn.per * value) * kindTurn) + (turnDeg > arc ? AIM.feet * pace : 0) + toAimS * pace;
}

/** A pull's time, ms (see the header; WEAPONS §7.6). */
export const fireMs = ({ recoil, pace, n = 1, rpm = 700, anchor = ANCHOR.recover }) =>
  Math.round((TRIGGER_S + (n - 1) * 60 / rpm + RECOVER_S * recoil * pace * anchor * (1 + 0.3 * (n - 1))) * 1000);

/** The recovery alone after a pull (ms): the muzzle back down, the aim settling again. */
export const recoverMs = ({ recoil, pace, n = 1, anchor = ANCHOR.recover }) => Math.round(RECOVER_S * recoil * pace * anchor * (1 + 0.3 * (n - 1)) * 1000);

const meOf = (state, pid) => (playerActor(state)?.who === pid ? playerActor(state) : state.actors?.list?.find(a => a.who === pid) ?? null);
const gunModel = (state, gunId) => MODELS[state.items?.[gunId]?.model ?? 'r7'];

/** How long the aim at the bracketed target has been held at ms: { aimed, heldS, v, rate, toFullMs } (WEAPONS §7.1). */
export function heldOf(state, pid, ms = state.clock.ms, key = null) {
  const aim = state.stop?.aim;
  const mrk = rollerOf(state, pid, { ms }).value('marksmanship'), rate = HELD_RATE0 + mrk / 10;
  if (!aim || (key && aim.key !== key)) return { aimed: false, heldS: 0, v: 0, rate, toFullMs: null };
  const heldS = (ms - aim.settledMs) / 1000;
  const fullS = HELD_MAX / rate;
  if (heldS < 0) return { aimed: true, heldS, v: COMING_DOWN, rate, toFullMs: Math.ceil((fullS - heldS) * 1000) };
  return { aimed: true, heldS, v: Math.round(Math.min(HELD_MAX, heldS * rate)), rate, toFullMs: Math.max(0, Math.ceil((fullS - heldS) * 1000)) };
}

/**
 * The moment's modifiers on a shot at a target (see the header), sorted in SKILLS' order. target: {
 * key, kind, x, z, dM, paper? }. follow: the follow-up's place after the first (a tap). The same list
 * makes the plaque's odds and the roll.
 */
export function modsOf(state, pid, { gunId, target, part = 'torso', tempo = 'normal', follow = 0, ms = state.clock.ms, held = null }) {
  const me = meOf(state, pid), M = gunModel(state, gunId), roller = rollerOf(state, pid, { ms });
  const mrk = roller.value('marksmanship'), stance = me?.stance ?? 'stand', out = [];
  if (POSITION[stance]) out.push({ why: POSITION_WORD[stance], v: POSITION[stance], src: 'task' });
  // (held: a gunner's own held aim, { v } (src/sim/arms/gunner.js): the stop's aim is the player's)
  const h = held ? { aimed: true, v: held.v } : heldOf(state, pid, ms, target?.key ?? null);
  if (h.aimed && h.v) out.push({ why: h.v > 0 ? 'the aim held' : 'still coming down from the last', v: h.v, src: 'task' });
  if (follow > 0) {
    const v = -Math.round(BURST_K * follow * M.recoil * climbOf(mrk) * ANCHOR.climb * (SUPPORT[stance] ?? 1));
    if (v) out.push({ why: 'the muzzle still up from the last', v, src: 'task' });
  }
  if (target && state.places?.live?.area) {
    const L = lightLevel(state, target.x, target.z, ms);
    if (L < DARK_BELOW) out.push({ why: 'the dark', v: LIGHT_MOD.dark, src: 'env' });
    else if (L < DIM_BELOW) out.push({ why: 'poor light', v: LIGHT_MOD.dim, src: 'env' });
  }
  const optic = M.optic ? OPTICS[M.optic] : null, dM = target?.dM ?? 25, mag = optic ? opticOf(state.items?.[gunId]) : 0;
  const ov = optic ? opticMod(mag, dM) : 0;
  if (ov) out.push({ why: `the ${String(M.optic).toUpperCase().replace(/^SO(\d)/, 'SO-$1')} at ${mag}×`, v: ov, src: 'gear' });
  const T = TEMPO[tempo] ?? TEMPO.normal;
  if (T.v) out.push({ why: T.why, v: T.v, src: 'tempo' });
  out.push(...roller.mods('marksmanship', { targetM: dM }));
  return sortMods(out);
}

/** The aim's time at a target from where the shooter faces and holds the rifle, ms (WEAPONS §7.1). */
export function aimMsOf(state, pid, gunId, target) {
  const me = meOf(state, pid), M = gunModel(state, gunId), K = KINDS[M.kind], roller = rollerOf(state, pid);
  const wh = roller.value('weapons');
  const head = me?.headRad ?? 0, to = Math.atan2(target.z - (me?.z ?? 0), target.x - (me?.x ?? 0));
  const posture = state.people?.[pid]?.kit?.carry?.posture ?? 'lowReady';
  const optic = M.optic ? OPTICS[M.optic] : null;
  const s = aimS({ pace: paceOf(wh), kindSight: K.sight, opticSight: optic ? opticSight(optic, opticOf(state.items?.[gunId])) : 1, turnDeg: Math.abs(wrap(to - head)) / D2R, value: wh, kindTurn: K.turn,
    toAimS: posture === 'aimed' ? 0 : POSTURES[posture]?.toAimS ?? 0 });
  return Math.round(s * 1000);
}

/** A pull's time for this shooter and gun, ms (n rounds), and its recovery alone. */
export function pullMsOf(state, pid, gunId, n = 1) {
  const M = gunModel(state, gunId), pace = paceOf(rollerOf(state, pid).value('weapons'));
  return { ms: fireMs({ recoil: M.recoil, pace, n, rpm: M.rpm ?? 700 }), recoverMs: recoverMs({ recoil: M.recoil, pace, n }) };
}

// ---- 0.0.7: the strike at distance (see the header) ----

const rangeRec = (state) => state.armoury?.range ?? null;
/** The reticle's hold a shooter has on (mrad, the mark put on the target: x right, y down), or none. */
export const holdOf = (state, pid) => (state.stop?.who === pid && state.stop.hold ? state.stop.hold : null);
/**
 * The crosswind a shooter believes (m/s, + from the left): their own read (the range session's reads, or the stop's) or
 * the coach's call on the session, the later of the two; null with neither. { crossMs, band, atMs, by: 'read' | 'coach' }.
 */
export function windBeliefOf(state, pid) {
  const R = rangeRec(state), read = R?.reads?.[pid] ?? (state.stop?.who === pid ? state.stop.read ?? null : null);
  const call = R?.call && (R.call.for ?? pid) === pid && pid === playerActor(state)?.who ? R.call : null;
  const r = read ? { crossMs: read.crossMs, band: read.band ?? null, atMs: read.atMs ?? 0, by: 'read' } : null;
  const c = call && typeof call.crossMs === 'number' ? { crossMs: call.crossMs, band: call.band ?? null, atMs: call.atMs ?? 0, by: 'coach' } : null;
  return r && c ? (c.atMs >= r.atMs ? c : r) : r ?? c;
}
// (the load a strike is computed for: the chambered round's kind, or the magazine's believed; a dummy flies as ball)
const flyingLoad = (state, gunId, belief) => {
  const g = state.items?.[gunId], l = belief ? beliefOf(state, gunId)?.magLoad ?? gunField(g, 'load') : gunField(g, 'load');
  return l === 'tracer' ? 'tracer' : 'ball';
};
const r2 = (v) => Math.round(v * 100) / 100;
// (how long ago a call or a read was made, in its words: '', ' 40 s ago', ' 2 min ago'; under 10 s it is now)
const ageWords = (ms) => (ms < 10_000 ? '' : ms < 120_000 ? ` ${Math.round(ms / 10_000) * 10} s ago` : ` ${Math.round(ms / 60_000)} min ago`);

/**
 * Where the round goes against the point of aim at a target, cm (see the header): { elevCm (+ up), windCm (+ right),
 * terms: [{ key: 'zero' | 'path' | 'wind' | 'hold', why, elevCm, windCm }], rangeM, crossMs, flight }. belief: as the
 * shooter believes it (their zero, their read). opts for a gunner (gunner.js): hold { xMil, yMil }, crossMs (a belief's
 * crossing wind, or the truth's override), ms; load the round fired (the pull's: the chamber has the next by then).
 */
export function poiOf(state, pid, gunId, target, { ms = state.clock.ms, belief = false, hold = undefined, crossMs = undefined, load: fired = null } = {}) {
  const gun = state.items?.[gunId], M = MODELS[gun?.model ?? 'r7'], me = meOf(state, pid) ?? { x: 0, z: 0 };
  const d = target?.dM ?? 25, env = envOfPlace(state, state.places?.live?.area ?? null, me.x, me.z), load = fired === 'tracer' ? 'tracer' : fired ? 'ball' : flyingLoad(state, gunId, belief);
  const cm = CLICK_MRAD * d / 10, sight = sightOf(gun), z = belief ? beliefZero(gun) : zeroOfGun(gun);
  let cross = crossMs;
  if (cross === undefined) cross = belief ? windBeliefOf(state, pid)?.crossMs ?? 0 : (target ? pathWind(state.meta.seed, ms, me, target).crossMs : 0);
  const f = flight(M.cal, load, M.barrelMm, env, d, { crossMs: cross });
  const h = hold === undefined ? holdOf(state, pid) : hold, hx = h?.xMil ?? 0, hy = h?.yMil ?? 0;
  const terms = [
    { key: 'zero', why: belief ? 'the turrets against your zero' : 'the turrets against the rifle\'s zero', elevCm: (sight.elev - z.elev) * cm, windCm: (sight.wind - z.wind) * cm },
    { key: 'path', why: `the path at ${Math.round(d)} m`, elevCm: f.pathCm, windCm: 0 },
    { key: 'wind', why: belief ? 'the wind as read' : 'the wind', elevCm: 0, windCm: f.driftCm },
    { key: 'hold', why: 'the hold', elevCm: hy * d / 10, windCm: hx * d / 10 },
  ].map(t => ({ ...t, elevCm: r2(t.elevCm), windCm: r2(t.windCm) }));
  return { elevCm: r2(terms.reduce((a, t) => a + t.elevCm, 0)), windCm: r2(terms.reduce((a, t) => a + t.windCm, 0)), terms, rangeM: d, crossMs: Math.round(cross * 100) / 100,
    flight: { rangeM: d, tofS: Math.round(f.tofS * 1000) / 1000, vMs: Math.round(f.vMs), eJ: Math.round(f.eJ), supersonic: f.supersonic } };
}

/** SKILLS §5.11's banded words for odds at the two ends of a belief's spread. */
export function oddsWords(a, b) {
  const lo = Math.min(a, b), hi = Math.max(a, b);
  if (hi < 0.15) return 'you\'d need luck';
  if (lo >= 0.7) return 'good odds';
  if (lo >= 0.4 && hi < 0.7) return 'a fair chance';
  if (hi < 0.4) return 'poor odds';
  return 'hard to say';
}
const SIDE = (x, word) => (Math.abs(x) < 0.125 ? null : `${Math.abs(x)} mil ${word[x > 0 ? 1 : 0]}`);
/** A hold in words: '0.5 mil right', '0.25 mil left, 1 mil high', 'centre'. */
export const holdWords = (h) => [SIDE(h?.xMil ?? 0, ['left', 'right']), SIDE(h?.yMil ?? 0, ['low', 'high'])].filter(Boolean).join(', ') || 'centre';
// (a hold as a coach says it, in quarters: 'a quarter of a mil', 'half a mil', 'a mil and a half', 'two mils')
const QUARTERS = ['', 'a quarter', 'a half', 'three quarters'];
const milSaid = (m) => {
  const q = Math.round(Math.abs(m) * 4), whole = Math.floor(q / 4), part = q % 4, NUM = ['', 'a', 'two', 'three'];
  if (!whole) return part === 2 ? 'half a mil' : `${QUARTERS[part]} of a mil`;
  const head = whole === 1 ? 'a mil' : `${NUM[whole] ?? whole} mils`;
  return part ? `${head} and ${QUARTERS[part]}` : head;
};
const SAID = (x, word) => (Math.abs(x) < 0.125 ? null : `${milSaid(x)} ${word[x > 0 ? 1 : 0]}`);
/** A hold in spoken words (the coach's, the DI's): 'half a mil right', 'a quarter of a mil left, a mil high', 'centre'. */
export const holdSaid = (h) => [SAID(h?.xMil ?? 0, ['left', 'right']), SAID(h?.yMil ?? 0, ['low', 'high'])].filter(Boolean).join(', ') || 'centre';
// (a strike's offset in the coach's words: 'high left', 'low', 'centre')
const offWords = ([x, y], tolCm) => [Math.abs(y) > tolCm ? (y < 0 ? 'high' : 'low') : null, Math.abs(x) > tolCm ? (x > 0 ? 'right' : 'left') : null].filter(Boolean).join(' ') || 'centre';
/** A card this close is seen in the PAPER inset as it is holed: its shot's line says the hole (m). */
export const NEAR_CARD_M = 50;
/** The hold that would cancel a crosswind's drift (and a strike's offset) at a range, mrad on HOLD_STEP_MRAD, within HOLD_MAX_MRAD: { xMil, yMil }. */
export function holdFor({ windCm = 0, elevCm = 0 }, rangeM) {
  const step = (cm) => { const m = -cm / (rangeM / 10); return Math.max(-HOLD_MAX_MRAD, Math.min(HOLD_MAX_MRAD, Math.round(m / HOLD_STEP_MRAD) * HOLD_STEP_MRAD)) || 0; };
  return { xMil: step(windCm), yMil: step(elevCm) };
}

/**
 * The plaque over the bracketed target (WEAPONS §7.10; the build sheet §2.2): { part, rangeM,
 * rangeText, odds, oddsText, words, aimS, held, next, dc, dcParts, mods }, on the shooter's beliefs
 * (a known distance in still air: the truth), the odds the roll's own. next: 'aim' (not aimed at it),
 * 'hold' (aimed, under +4), 'fire'.
 */
export function plaqueOf(state, pid, { target, part = 'torso', gunId = state.stop?.gun, ms = state.clock.ms } = {}) {
  if (!target) return null;
  const M = gunModel(state, gunId), roller = rollerOf(state, pid, { ms });
  const { dc, parts } = dcOf({ model: state.items?.[gunId]?.model ?? 'r7', rangeM: target.dM, part, paper: target.paper ?? null });
  const mods = modsOf(state, pid, { gunId, target, part, ms });
  const value = roller.value('marksmanship'), rollOdds = oddsOf(value, dc, mods);
  let odds = target.kind === 'paper' ? oddsOf(value, dc + KD_RINGS.at(-1).from, mods) : rollOdds, words = null, terms = [], kd = null;
  const h = heldOf(state, pid, ms, target.key);
  const next = !h.aimed ? 'aim' : h.v < HELD_MAX ? 'hold' : 'fire';
  if (target.kind === 'paper' && isFace(target.paper)) {
    // (a face: the chance of a scoring hit on the believed strike, at the read's band's ends; see the header)
    const b = poiOf(state, pid, gunId, target, { ms, belief: true }), fo = faceOdds(target.paper, { value, dc, mods, poiCm: b });
    const wb = windBeliefOf(state, pid), hold = holdOf(state, pid) ?? { xMil: 0, yMil: 0 }, g = state.items?.[gunId];
    // (the headline is the chance of a five or a V on the strike you believe: it moves with the hold, the held aim, the
    // wind and the dope, where the chance of a scoring hit sat at 94 to 96% whatever you did (the design review's of
    // v0.0.7); the chance on the paper stays in the strip and the hover (kd.scoreOdds))
    odds = (target.dM ?? 25) > NEAR_CARD_M ? fo.five : fo.score;
    if (wb?.band && Math.abs(wb.band[1] - wb.band[0]) > 0.05) {
      // (words in place of the number while the read's two ends move even the chance on the paper 10 points)
      const ends = wb.band.map(c => faceOdds(target.paper, { value, dc, mods, poiCm: poiOf(state, pid, gunId, target, { ms, belief: true, crossMs: c }) }).score);
      if (Math.abs(ends[0] - ends[1]) >= 0.1) words = oddsWords(ends[0], ends[1]);
    }
    const sight = sightOf(g), z = beliefZero(g), ww = wb ? windWords(wb.crossMs) : null;
    terms = [
      { key: 'range', words: `${Math.round(target.dM)} m, a known distance`, v: Math.round(target.dM) },
      // (the call's or the read's age in the words: a call goes stale as the wind moves (the design review's of v0.0.7))
      { key: 'wind', words: wb ? `wind ${ww.speedWord} ${ww.fromWord}, ${wb.by === 'coach' ? 'the coach\'s call' : 'your read'}${ageWords(ms - (wb.atMs ?? ms))}` : 'wind not read', v: wb ? wb.crossMs : null, ...(wb ? { by: wb.by } : {}) },
      { key: 'hold', words: `held ${holdWords(hold)}`, v: [hold.xMil ?? 0, hold.yMil ?? 0] },
      { key: 'zero', words: sight.elev === z.elev && sight.wind === z.wind ? 'the turrets on your zero' : `the turrets ${[sight.elev - z.elev ? `${Math.abs(sight.elev - z.elev)} ${sight.elev > z.elev ? 'up' : 'down'}` : null, sight.wind - z.wind ? `${Math.abs(sight.wind - z.wind)} ${sight.wind > z.wind ? 'right' : 'left'}` : null].filter(Boolean).join(', ')} of your zero`, v: { elev: sight.elev - z.elev, wind: sight.wind - z.wind } },
    ];
    kd = { aimCm: [0, 0], poiCm: poiXY(b), holdMil: [hold.xMil ?? 0, hold.yMil ?? 0], scoreOdds: fo.score, fiveOdds: fo.five, ringOdds: fo.rings };
  }
  return {
    part: kd && (target.dM ?? 25) > NEAR_CARD_M ? 'FIVE' : target.kind === 'paper' ? 'PAPER' : part.toUpperCase(), rangeM: Math.round(target.dM), rangeText: `${Math.round(target.dM)} M`,
    odds, rollOdds, oddsText: words ? words.toUpperCase() : `${Math.round(odds * 100)}%`, words,
    aimS: h.aimed ? null : aimMsOf(state, pid, gunId, target) / 1000, held: h, next, dc, dcParts: parts, mods, model: M.short, terms, kd,
  };
}

/**
 * The stream a pull's draws come from (WEAPONS §7.11): the shooter, the gun, its round count and the
 * pull's own shot id. The id is in it because a pull that does not fire (a misfire, a click) counts no
 * round: keyed by the count alone, the next pull would draw the same dice and misfire again, forever.
 */
export const shotStream = (state, pid, gunId, shotId) => stream('shot', state.meta.seed, pid, gunId, state.items?.[gunId]?.rounds ?? 0, shotId);

/**
 * One pull of the trigger at a target, resolved (see the header). Returns { ms, shot }: the step's time
 * (the pull and its recovery when it fired, the press alone when it clicked) and the shot record
 * { id, who, gun, atMs, fired, why, stoppage, set, muzzle, dirRad, target, lane, hole, brass, roll, logSeq, recoverMs }.
 */
export function resolveShot(state, bus, { pid, gunId, target, part = 'torso', tempo = 'normal', follow = 0, held = null, hold = undefined, log = true }) {
  const gun = state.items[gunId], mag = gun.mag ? state.items[gun.mag] : null, M = MODELS[gun.model ?? 'r7'];
  const ms = state.clock.ms, roller = rollerOf(state, pid, { ms }), wh = roller.value('weapons');
  const id = nextId(state, 'sh');
  const r = shotStream(state, pid, gunId, id);
  const f = pull(r, gun, mag);
  gun.belief = feel(gun.belief, f, { wh });
  const muzzle = muzzleOf(state, pid);
  const me = meOf(state, pid);
  const dirRad = me?.headRad ?? muzzle?.yawRad ?? 0;
  const T = TEMPO[tempo] ?? TEMPO.normal;
  let roll = null, hole = null, brass = null, entry = null, stepMs, recMs = 0, poi = null, after = '', fl = null;
  if (f.fired) {
    const { dc, parts } = dcOf({ model: gun.model ?? 'r7', rangeM: target?.dM ?? 25, part, paper: target?.paper ?? null });
    const mods = modsOf(state, pid, { gunId, target, part, tempo: 'normal', follow, ms, held });
    roll = check(r, { skill: 'marksmanship', value: roller.value('marksmanship'), dc, mods, tempo, pressure: 'evaluated', procedure: false, by: pid, dcParts: parts });
    // (the round as it flies, for every shot: the hud's crack and strike, the far window's delay)
    const fp = poiOf(state, pid, gunId, target ?? { dM: 25 }, { ms, hold, load: f.load ?? 'ball' });
    fl = fp.flight;
    if (target?.kind === 'paper' && isFace(target.paper)) {
      // (a face: the strike in centimetres, the roll the spread (see the header))
      poi = fp;
      // (a face down in the pits is behind the parapet: the round goes over into the berm)
      hole = (target.up ?? 1) < FACE_DOWN_UP ? { at: null, score: 0, v: false, onPaper: false, band: null, word: 'into the berm: the target is down', spreadCm: 0 }
        : faceHole(target.paper, { aimCm: [0, 0], poiCm: poi, roll, shotId: id, seed: state.meta.seed });
      // (the line says the roll and the shooter's own terms, never where it went nor the true wind: at 200 and 300 m the
      // shooter knows a shot by the pits' mark, the disk or the flag and the coach's word on it (WEAPONS §1, §11.5; the
      // reviews of v0.0.7: the ring and the true wind in the toast seconds before the disk spoiled the mark))
      // (the zero card at 25 m is seen at once, in the PAPER inset: its line keeps the hole and where it went)
      const wb = windBeliefOf(state, pid), h = hold === undefined ? holdOf(state, pid) : hold;
      if ((target.dM ?? 25) <= NEAR_CARD_M) {
        const P = PAPERS[target.paper], off = hole.at ? offWords([hole.at[0] - (P.markCm?.[0] ?? 0), hole.at[1] - (P.markCm?.[1] ?? 0)], P.ringCm / 2) : null;
        roll.verb = `${hole.word}${off && off !== 'centre' ? `, ${off}` : ''}.`;
      } else {
        const wind = wb ? `the wind as ${wb.by === 'coach' ? 'called' : 'read'}, ${Math.abs(wb.crossMs) < 0.5 ? 'next to none' : `${Math.round(Math.abs(wb.crossMs))} m/s ${wb.crossMs > 0 ? 'from the left' : 'from the right'}`}` : 'the wind not read';
        after = `: ${wind}, held ${holdWords(h)}.`;
        roll.verb = (target.up ?? 1) < FACE_DOWN_UP ? `${hole.word}${after}` : `away${after}`;
      }
    } else if (target?.kind === 'paper') {
      hole = holeOf(target.paper, roll, id, state.meta.seed);
      roll.verb = hole.word;
    } else roll.verb = roll.ok ? 'hit' : 'missed';
    // (a shot that did not cycle keeps its case: caught in the port (a stovepipe) or in the chamber behind the next
    // round (a double), it flies when a step clears it, not here, or it would be drawn twice: the integrator's)
    brass = f.stoppage ? null : ejectCase(gun, { ...carryOf(state, pid), x: me?.x ?? 0, z: me?.z ?? 0, headRad: dirRad }, { atMs: ms, kind: 'case', key: id });
    // (on a card the tone is the hole's, not the pass at the DC: a 2 on the edge at margin −1 is on the paper, as at 0)
    // (a KD face's line keeps a note's tone whatever the hole: the pits tell the shooter, not the colour of the line)
    const far = !!poi && (target?.dM ?? 25) > NEAR_CARD_M;
    const tone = far ? 'note' : hole ? (hole.at ? 'note' : 'warn') : roll.ok ? 'note' : 'warn';
    // (a gunner's rolls stay out of J: the log is the player's (the build sheet §8 item 23))
    if (log) {
      entry = logEntry(state, bus, { kind: 'roll', tone, roll, step: 'fire', gun: gunId, shot: id, who: pid, text: checkShort(roll), ...(hole ? { paper: far ? null : !!hole.at } : {}) });
      bus?.emit('roll', { roll, who: pid });
    }
    bus?.emit('fx', { kind: 'flash', x: muzzle?.x ?? me?.x ?? 0, y: muzzle?.y ?? 1, z: muzzle?.z ?? me?.z ?? 0, atMs: ms, dir: dirRad, size: 1.2 });
    const p = pullMsOf(state, pid, gunId);
    recMs = Math.round(p.recoverMs * T.timeK);
    stepMs = Math.round(p.ms * T.timeK);
    // (the last round: the bolt locks back, felt and seen, said as tradecraft said it (the parity review's))
    if (f.empty && log) logEntry(state, bus, { kind: 'note', tone: 'note', text: f.locked ? 'It locks back: empty.' : 'Empty.', who: pid });
  } else {
    if (log) entry = logEntry(state, bus, { kind: 'note', tone: 'note', text: REFUSALS[f.why] ?? 'Click.', who: pid });
    stepMs = Math.round(TRIGGER_S * 1000);
  }
  const shot = { id, who: pid, gun: gunId, atMs: ms, fired: !!f.fired, why: f.why ?? null, stoppage: f.stoppage ?? null, set: f.set ?? null, load: f.fired ? f.load ?? 'ball' : null,
    muzzle: muzzle ? { x: muzzle.x, y: muzzle.y, z: muzzle.z } : null, dirRad, target: target?.key ?? null, lane: target?.lane ?? null,
    hole: hole ? (poi ? { at: hole.at, score: hole.score, v: hole.v, onPaper: hole.onPaper, band: hole.band } : { at: hole.at, score: hole.score, v: hole.v }) : null, brass: brass ? { kind: brass.kind, landMs: brass.landMs, at: brass.at } : null,
    roll, logSeq: entry?.seq ?? null, recoverMs: recMs, empty: !!f.empty, brassRec: brass };
  // (0.0.7: the round's flight on every fired shot; on a face where it went and why, the truth's)
  const extra = {};
  if (fl) extra.flight = fl;
  if (poi) Object.assign(extra, { face: { paper: target.paper, lane: target.lane ?? null, line: target.line ?? null }, aimCm: [0, 0], poiCm: { elevCm: poi.elevCm, windCm: poi.windCm, terms: poi.terms }, crossMs: poi.crossMs });
  // (a round over a face down in the pits: nothing for the pits to mark (range.js kdShot))
  if (poi && (target.up ?? 1) < FACE_DOWN_UP) extra.berm = true;
  Object.assign(shot, extra);
  bus?.emit('shot', { id, who: pid, gun: gunId, atMs: ms, fired: shot.fired, why: shot.why, stoppage: shot.stoppage, set: shot.set, load: shot.load, muzzle: shot.muzzle, dirRad,
    target: shot.target, lane: shot.lane, hole: shot.hole, brass: shot.brass, logSeq: shot.logSeq,
    ...(fl ? { flight: fl } : {}), ...(poi ? { face: extra.face, aimCm: extra.aimCm, poiCm: { elevCm: poi.elevCm, windCm: poi.windCm } } : {}) });
  return { ms: stepMs, shot };
}
