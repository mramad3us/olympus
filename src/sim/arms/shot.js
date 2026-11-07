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
// Pure but resolveShot.
import { stream } from '../../core/rng.js';
import { nextId, playerActor } from '../../core/ids.js';
import { lightLevel } from '../places/light.js';
import { logEntry } from '../log.js';
import { paceOf } from '../skills/skills.js';
import { check, oddsOf, sortMods, TEMPO, checkShort } from '../skills/checks.js';
import { rollerOf, DARK_BELOW, DIM_BELOW } from '../combat/roll.js';
import { PAPERS, holeOf, KD_RINGS } from './paper.js';
import { MODELS, KINDS, OPTICS } from './models.js';
import { pull, feel, REFUSALS } from './firearms.js';
import { carryOf, muzzleOf, POSTURES } from './carry.js';
import { ejectCase } from './look.js';

/** The shot's base DC (tradecraft's SHOT.dc). */
export const SHOT_DC0 = 6;
/** The part aimed at (tradecraft's PART_DC; a thing lying about +4: WEAPONS §7.2). */
export const PART_DC = Object.freeze({ torso: 0, head: 6, legs: 3, thing: 4 });
/** The shooter's position (WEAPONS §7.3, my call): standing 0, kneeling +2, prone +4; and the words. */
export const POSITION = Object.freeze({ stand: 0, kneel: 2, prone: 4 });
export const POSITION_WORD = Object.freeze({ stand: 'standing', kneel: 'kneeling', prone: 'prone' });
/** The aim held: at most +HELD_MAX, at HELD_RATE0 + Marksmanship / 10 a second; coming down from the last, COMING_DOWN. */
export const HELD_MAX = 4, HELD_RATE0 = 2, COMING_DOWN = -2;
/** The pull and its recovery (tradecraft's), seconds. */
export const TRIGGER_S = 0.15, RECOVER_S = 0.35;
/** A tap's split (tradecraft's), seconds; the Marksmanship a double and a triple need. */
export const TAP_SPLIT_S = 0.25, TAP_SKILL = Object.freeze({ 2: 8, 3: 18 });
/** A follow-up's climb (WEAPONS §7.6): BURST_K × k × recoil × climbOf × support. */
export const BURST_K = 2, SUPPORT = Object.freeze({ stand: 1, kneel: 1, prone: 0.8 });
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
export function modsOf(state, pid, { gunId, target, part = 'torso', tempo = 'normal', follow = 0, ms = state.clock.ms }) {
  const me = meOf(state, pid), M = gunModel(state, gunId), roller = rollerOf(state, pid, { ms });
  const mrk = roller.value('marksmanship'), stance = me?.stance ?? 'stand', out = [];
  if (POSITION[stance]) out.push({ why: POSITION_WORD[stance], v: POSITION[stance], src: 'task' });
  const h = heldOf(state, pid, ms, target?.key ?? null);
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
  const optic = M.optic ? OPTICS[M.optic] : null, dM = target?.dM ?? 25;
  const ov = optic ? opticMod(optic.magMin ?? 1, dM) : 0;
  if (ov) out.push({ why: `the ${String(M.optic).toUpperCase().replace(/^SO(\d)/, 'SO-$1')} at ${optic.magMin ?? 1}×`, v: ov, src: 'gear' });
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
  const s = aimS({ pace: paceOf(wh), kindSight: K.sight, opticSight: optic?.sight ?? 1, turnDeg: Math.abs(wrap(to - head)) / D2R, value: wh, kindTurn: K.turn,
    toAimS: posture === 'aimed' ? 0 : POSTURES[posture]?.toAimS ?? 0 });
  return Math.round(s * 1000);
}

/** A pull's time for this shooter and gun, ms (n rounds), and its recovery alone. */
export function pullMsOf(state, pid, gunId, n = 1) {
  const M = gunModel(state, gunId), pace = paceOf(rollerOf(state, pid).value('weapons'));
  return { ms: fireMs({ recoil: M.recoil, pace, n, rpm: M.rpm ?? 700 }), recoverMs: recoverMs({ recoil: M.recoil, pace, n }) };
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
  const rollOdds = oddsOf(roller.value('marksmanship'), dc, mods);
  const odds = target.kind === 'paper' ? oddsOf(roller.value('marksmanship'), dc + KD_RINGS.at(-1).from, mods) : rollOdds;
  const h = heldOf(state, pid, ms, target.key);
  const next = !h.aimed ? 'aim' : h.v < HELD_MAX ? 'hold' : 'fire';
  return {
    part: target.kind === 'paper' ? 'PAPER' : part.toUpperCase(), rangeM: Math.round(target.dM), rangeText: `${Math.round(target.dM)} M`,
    odds, rollOdds, oddsText: `${Math.round(odds * 100)}%`, words: null,
    aimS: h.aimed ? null : aimMsOf(state, pid, gunId, target) / 1000, held: h, next, dc, dcParts: parts, mods, model: M.short,
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
export function resolveShot(state, bus, { pid, gunId, target, part = 'torso', tempo = 'normal', follow = 0 }) {
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
  let roll = null, hole = null, brass = null, entry = null, stepMs, recMs = 0;
  if (f.fired) {
    const { dc, parts } = dcOf({ model: gun.model ?? 'r7', rangeM: target?.dM ?? 25, part, paper: target?.paper ?? null });
    const mods = modsOf(state, pid, { gunId, target, part, tempo: 'normal', follow, ms });
    roll = check(r, { skill: 'marksmanship', value: roller.value('marksmanship'), dc, mods, tempo, pressure: 'evaluated', procedure: false, by: pid, dcParts: parts });
    if (target?.kind === 'paper') {
      hole = holeOf(target.paper, roll, id, state.meta.seed);
      roll.verb = hole.word;
    } else roll.verb = roll.ok ? 'hit' : 'missed';
    // (a shot that did not cycle keeps its case: caught in the port (a stovepipe) or in the chamber behind the next
    // round (a double), it flies when a step clears it, not here, or it would be drawn twice: the integrator's)
    brass = f.stoppage ? null : ejectCase(gun, { ...carryOf(state, pid), x: me?.x ?? 0, z: me?.z ?? 0, headRad: dirRad }, { atMs: ms, kind: 'case', key: id });
    // (on a card the tone is the hole's, not the pass at the DC: a 2 on the edge at margin −1 is on the paper, as at 0)
    const tone = hole ? (hole.at ? 'note' : 'warn') : roll.ok ? 'note' : 'warn';
    entry = logEntry(state, bus, { kind: 'roll', tone, roll, step: 'fire', gun: gunId, shot: id, who: pid, text: checkShort(roll), ...(hole ? { paper: !!hole.at } : {}) });
    bus?.emit('roll', { roll, who: pid });
    bus?.emit('fx', { kind: 'flash', x: muzzle?.x ?? me?.x ?? 0, y: muzzle?.y ?? 1, z: muzzle?.z ?? me?.z ?? 0, atMs: ms, dir: dirRad, size: 1.2 });
    const p = pullMsOf(state, pid, gunId);
    recMs = Math.round(p.recoverMs * T.timeK);
    stepMs = Math.round(p.ms * T.timeK);
    // (the last round: the bolt locks back, felt and seen, said as tradecraft said it (the parity review's))
    if (f.empty) logEntry(state, bus, { kind: 'note', tone: 'note', text: f.locked ? 'It locks back: empty.' : 'Empty.', who: pid });
  } else {
    entry = logEntry(state, bus, { kind: 'note', tone: 'note', text: REFUSALS[f.why] ?? 'Click.', who: pid });
    stepMs = Math.round(TRIGGER_S * 1000);
  }
  const shot = { id, who: pid, gun: gunId, atMs: ms, fired: !!f.fired, why: f.why ?? null, stoppage: f.stoppage ?? null, set: f.set ?? null, load: f.fired ? f.load ?? 'ball' : null,
    muzzle: muzzle ? { x: muzzle.x, y: muzzle.y, z: muzzle.z } : null, dirRad, target: target?.key ?? null, lane: target?.lane ?? null,
    hole: hole ? { at: hole.at, score: hole.score, v: hole.v } : null, brass: brass ? { kind: brass.kind, landMs: brass.landMs, at: brass.at } : null,
    roll, logSeq: entry?.seq ?? null, recoverMs: recMs, empty: !!f.empty, brassRec: brass };
  bus?.emit('shot', { id, who: pid, gun: gunId, atMs: ms, fired: shot.fired, why: shot.why, stoppage: shot.stoppage, set: shot.set, load: shot.load, muzzle: shot.muzzle, dirRad,
    target: shot.target, lane: shot.lane, hole: shot.hole, brass: shot.brass, logSeq: shot.logSeq });
  return { ms: stepMs, shot };
}
