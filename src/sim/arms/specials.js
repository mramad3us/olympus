// OLYMPUS sim: the shot rows and the reloads by their purpose, steps chosen while time stands still and offered only when relevant (COMBAT §25.6; WEAPONS §5.3, §7, §8.5; the build sheet 0.0.8 §2.2, §8 items 3, 10 to 18).
//
// The user asked for the double and triple tap, the Mozambique and the combat reloads "as special actions
// when relevant" (2026-11-07), and the default of COMBAT §25.16's question 9 made them rows of the step
// panel in place of v0.0.5's real-time Fire-again (shooting.js tap(), retired: a press inside a recovery
// window whose cost hung on the finger). Each row is one choice, priced and rolled before you press as
// tradecraft's shot is (the plaque's odds are the roll's), and made of parts on the row, each round its
// own Marksmanship roll, its own hole and its own line in the log (shot.js resolveShot on its formula time):
//   Pair          (Marksmanship 8, within PAIR_MAX_M 25 m, two believed) a controlled pair: two torso rounds,
//                 the split one single pull (fireMs: the second sight picture), the second's climb × CONTROLLED_CLIMB_K 0.5.
//   Hammer        (12, within HAMMER_MAX_M 7 m) two on one sight picture, the split TAP_SPLIT_S 0.25 × paceOf(WH), the full climb.
//   Triple        (18, within 7 m) three, two hammer splits.
//   Failure drill (12, within FAILURE_MAX_M 15 m) the hammer, the assessment and the shift to the head (HEAD_SHIFT_S
//                 0.3 × pace), a head round (follow 2, climb × 0.5); the third not fired when the target is down after
//                 the pair (assessDown, at the shift's end: the look is the shift's time).
//   To the head   (no gate, within HEAD_MAX_M 25 m) only after "He's still up" (a torso round rang on a plate this
//                 contact, or STILL_UP_TORSO 2 torso hits, and still standing): the shift, then the round.
// The reach (the fix of 2026-11-07, the user's report on the armoured string: "am i supposed to aim for the head ? How do
// I do that ?"; the coach and the DI called for the head and the panel had no head row, the shooter a metre back in the
// 10 m point's box, the turner 11 m off, both head rows then at 10 m and compared on the rounded range): a turner in your
// own lane counts at your line's nominal distance (7 or 10 m) wherever you stand inside that line's box (pairs.js
// pairsReachM); any other target (a neighbour's turner, a person) at its measured range, unrounded, so a neighbour's
// turner at 7.6 m stays out of the Hammer. A rifle's head shot is no 10 m thing: HEAD_MAX_M 25 (the bay's length) and
// FAILURE_MAX_M 15, where they were 10; Hammer and Triple stay at 7 m (close-range drills). The odds are the measured
// range's (the roll's, dcOf by range), never the nominal's. **Never silent**: after "He's still up" To the head is in the
// panel, offered and first, or struck with its reason where it truly cannot be ("27 m, past 25", "a stoppage", "empty,
// RELOAD first", "chamber empty"), so the coach's "Still up!" and the DI's head line always point at a row (the DI names
// its key: instinct/pairs.js, panel.js digitOf).
// The parts, cumulative from the row's start as the sub-steps of stop motion (TIME §4.3: each taken on the first tick
// at or after its boundary, the round's record on its formula time): 'aim' (from rung 2, and only when not aimed at the
// target: aimMsOf, the selector to semi at the row's start at no time, the thumb during the mount: §8 item 3), 'hold'
// (careful: the held aim to +4 first), 'press' (TRIGGER_S), 'round' (its interval to the next part: the Pair's single
// pull, a hammer's split, 0 before a shift, the last round's recovery), 'shift'. Rushed: every part × TEMPO.rushed's 0.6
// and each round −3. Below rung 2 (the private, the recruit) a row is struck "off safe first" on safe and "aim first"
// when not aimed at the target: the recruit does everything step by step (the user's words). Below its gate a row is
// struck with the gate's words ("Marksmanship 12"), listed after those offered, so the recruit sees what training buys;
// out of range or not relevant it is absent (§8 item 12), but To the head after "He's still up" (struck, never absent).
// The rounds after a row's first carry its held aim (the climb is the cost, not a fresh settle); a round after a shift
// holds nothing (a new sight picture). A row halts on a click or a stoppage (the reflex card, as Fire's) and on the bolt
// locking back (the gun dry: no more rounds, its recovery the last part); a target turned away takes its rounds into the
// berm, no fault (§8 item 21).
// The order (COMBAT §25.6.1): To the head first after "He's still up"; the failure drill first where armour was seen at
// the pause or torso hits stand; else Pair, Hammer, Triple, Failure drill. Rows are offered on a turner facing (SEEN) and
// standing, or a person bracketed in a contact; the coach in the frame on a range never offers one (test-handling's panel
// is v0.0.6's but for the reloads' labels).
//
// The reloads by purpose (COMBAT §25.6.5; WEAPONS §5.3's "Reloads by purpose"; §8 item 17): the built macros, no id
// renamed, labelled by what they are for: RELOAD (reload:speed, first with the bolt believed locked on an empty), Top up
// (reload:tactical, first in a lull, contact.js lullOf, with the magazine believed at half or less), RELOAD, keep the
// empty (reload:retain). When the session names a magazine (R.wantMag: the coach's short one, §8 item 18), Top up's
// queue reaches for its pouch and its label says so ("Top up: the two-round magazine, chest pouch 3"). Nothing is done
// unasked: these are rows; T may press one only because a line asked (the DI's).
// 0.0.9 (the build sheet 0.0.9 §2.1, §8 item 9; COMBAT §25.18.1): a row's aim, press, splits, shift and recovery are ×
// the roller's timeK at the row's start (combat/supp.js suppTimeK, exactly 1 when calm), each round's odds carry the
// chaos's one entry through the roller, so a pinned recruit's Pair is slower and its odds the roll's.
// Pure but runRound, runRowSub and endRowSub.
import { logEntry } from '../log.js';
import { paceOf } from '../skills/skills.js';
import { oddsOf, TEMPO } from '../skills/checks.js';
import { rollerOf } from '../combat/roll.js';
import * as TEMPLATES from '../skills/templates.js';
import { SEEN } from '../people/perception.js';
import { aimMsOf, heldOf, dcOf, modsOf, resolveShot, fireMs, recoverMs, TRIGGER_S, TAP_SPLIT_S, HELD_MAX, HELD_RATE0, climbOf, BURST_K, ANCHOR, SUPPORT, PLATE_MM } from './shot.js';
import { A_MARGIN } from './paper.js';
import { beliefOf, actionMs } from './firearms.js';
import { macrosFor, subsOf } from './drills.js';
import { pouchesOf, believedN, sparesOf } from './kit.js';
import { famCap, MODELS } from './models.js';
import { turnersOf, turnerTargets } from './turners.js';
import { contactNow, lullOf } from '../combat/contact.js';
import { recordShot, rangeOf } from '../scenarios/handling.js';
import { pairsReachM } from '../scenarios/pairs.js';
import { targetOf, gunOn, macroRow, LABELS } from './shooting.js';

export { A_MARGIN, PLATE_MM };
/** The rows' reaches (m), COMBAT §25.6.1: the Pair, the Hammer and the Triple, the failure drill, To the head (15 and 25 from the fix of 2026-11-07; were 10 and 10). */
export const PAIR_MAX_M = 25, HAMMER_MAX_M = 7, TRIPLE_MAX_M = 7, FAILURE_MAX_M = 15, HEAD_MAX_M = 25;
/** The controlled pair's second round: its climb × this (a second sight picture). */
export const CONTROLLED_CLIMB_K = 0.5;
/** The shift to the head (s × paceOf(Weapon handling)); a re-sighted head round's climb × HEAD_CLIMB_K. */
export const HEAD_SHIFT_S = 0.3, HEAD_CLIMB_K = 0.5;
/** The rung from which a row's aim is inside it (the selector with it); below it, Aim and Off safe are steps of their own. */
export const RUNG_AIM = 2;

const round = (part, follow = 0, climbK = 1) => Object.freeze({ part, follow, climbK });
/** The rows (see the header): id, label, gate (Marksmanship), reach (m), rounds ({ part, follow, climbK }), the split's kind, the shift before round shiftAt. */
export const ROWS = Object.freeze({
  pair: Object.freeze({ key: 'pair', id: 'shot:pair', label: 'Pair', gate: 8, maxM: PAIR_MAX_M, split: 'pull', shiftAt: null,
    rounds: Object.freeze([round('torso'), round('torso', 1, CONTROLLED_CLIMB_K)]) }),
  hammer: Object.freeze({ key: 'hammer', id: 'shot:hammer', label: 'Hammer', gate: 12, maxM: HAMMER_MAX_M, split: 'tap', shiftAt: null,
    rounds: Object.freeze([round('torso'), round('torso', 1)]) }),
  triple: Object.freeze({ key: 'triple', id: 'shot:triple', label: 'Triple', gate: 18, maxM: TRIPLE_MAX_M, split: 'tap', shiftAt: null,
    rounds: Object.freeze([round('torso'), round('torso', 1), round('torso', 2)]) }),
  failure: Object.freeze({ key: 'failure', id: 'shot:failure', label: 'Failure drill', gate: 12, maxM: FAILURE_MAX_M, split: 'tap', shiftAt: 2,
    rounds: Object.freeze([round('torso'), round('torso', 1), round('head', 2, HEAD_CLIMB_K)]) }),
  head: Object.freeze({ key: 'head', id: 'shot:head', label: 'To the head', gate: null, maxM: HEAD_MAX_M, split: null, shiftAt: 0,
    rounds: Object.freeze([round('head')]) }),
});
/** The rows' base order (COMBAT §25.6.1). */
export const ROW_ORDER = Object.freeze(['pair', 'hammer', 'triple', 'failure', 'head']);
/** A row by its step id ('shot:pair'), or null. */
export const rowOf = (id) => (typeof id === 'string' && id.startsWith('shot:') ? ROWS[id.slice(5)] ?? null : null);
/** The parts' words (the panel's sub-steps). */
export const PART_LABELS = Object.freeze({ aim: 'Aim', hold: 'Hold the aim', press: 'Press', round: 'Round', shift: 'Shift to the head' });
/** The reloads' purposes and their labels by macro id (COMBAT §25.6.5). */
export const RELOAD_PURPOSE = Object.freeze({ 'reload:speed': 'speed', 'reload:tactical': 'tactical', 'reload:retain': 'retain' });
export const RELOAD_LABELS = Object.freeze({ speed: 'RELOAD', tactical: 'Top up', retain: 'RELOAD, keep the empty' });

// (the rung of the room's drill family: templates.js rungOf (the react role's), else the sheet's own, else by rank as
// COMBAT §25.3.2's RUNG_OF_TIER puts it (private 1, lance corporal and corporal 2, sergeant and above 3, officer 1))
const RANK_RUNG = Object.freeze({ Pvt: 1, PFC: 1, LCpl: 2, Cpl: 2, Sgt: 3, SSgt: 3, GySgt: 3, '2ndLt': 1, '1stLt': 1, Capt: 1 });
export function rungOfShooter(state, pid) {
  if (typeof TEMPLATES.rungOf === 'function') return TEMPLATES.rungOf(state, pid, 'room');
  const p = state.people?.[pid];
  return p?.skills?.drills?.room?.rung ?? RANK_RUNG[p?.service?.rank] ?? 1;
}

// (the turner record under a target key, and the target with its facing at a moment)
const turnerRec = (state, key) => turnersOf(state).find(t => t.key === key) ?? null;
function targetAt(state, key, pid, ms) {
  const T = targetOf(state, key, pid);
  if (!T || T.kind !== 'turner') return T;
  const t = turnerTargets(state, ms).find(x => x.key === key);
  return t ? { ...T, facingK: t.facingK, down: t.down } : T;
}
// (the torso hits a turner has taken this contact: the scene's T.hits (those with an atMs before the contact's sighting left out))
function torsoHits(state, key) {
  const T = turnerRec(state, key), since = contactNow(state)?.last?.seenMs ?? null;
  return (T?.hits ?? []).filter(h => h.part === 'torso' && (h.zone || h.ring || h.through) && (since === null || h.atMs === undefined || h.atMs >= since)).length;
}
/** A man who has taken this many torso hits this contact and stands is "still up" (the paper's hit sensor, pairs.js STOP_TORSO). */
export const STILL_UP_TORSO = 2;
// (the torso rounds that rang on a plate this contact: what the marine heard, so armour he knows of)
function rangOn(state, key) {
  const T = turnerRec(state, key), since = contactNow(state)?.last?.seenMs ?? null;
  return (T?.hits ?? []).filter(h => h.part === 'torso' && h.ring && !h.through && (since === null || h.atMs === undefined || h.atMs >= since)).length;
}
/**
 * "He's still up" (COMBAT §25.6.1): the target stands after what should have put him down: a torso round that rang on
 * a plate (the steel, heard), or STILL_UP_TORSO torso hits. One torso hit on paper is not it (the design review of
 * v0.0.8: after one round the coach, the DI and the panel all said it, and the recruit went to the head on paper).
 */
export const stillUp = (state, key) => !(turnerRec(state, key)?.stoppedAtMs != null) && (rangOn(state, key) > 0 || torsoHits(state, key) >= STILL_UP_TORSO);
/** Armour seen on the target at the pause (contact.js's identification). */
const armourSeen = (state, key) => !!contactNow(state)?.last?.armour?.[key];
/** The failure drill's assessment: the target down after the pair (the scene's hit sensor: T.stoppedAtMs at or before atMs). */
export function assessDown(state, key, atMs = state.clock.ms) {
  const T = turnerRec(state, key);
  return !!T && T.stoppedAtMs !== null && T.stoppedAtMs !== undefined && T.stoppedAtMs <= atMs;
}

/**
 * A row's plan (see the header): { ms, parts: [{ k, ms, at, i?, part?, follow?, climbK? }], rounds: [{ part, follow, climbK, at,
 * odds, climb, held }], aim, offSafe, tempo }, at each part's start from the row's (ms), for a target ({ key, dM, x, z, kind }).
 * tempo 'normal' | 'rushed' | 'careful'; atMs the row's start (the held aim's clock); odds false for the times alone (the panel's rushed and careful).
 */
export function rowPlan(state, pid, rowId, target, { tempo = 'normal', atMs = state.clock.ms, gunId = state.stop?.gun ?? gunOn(state, pid), odds = true } = {}) {
  const R = rowOf(rowId) ?? ROWS[rowId];
  if (!R || !target) return null;
  const roller = rollerOf(state, pid, { ms: atMs }), wh = roller.value('weapons'), mrk = roller.value('marksmanship'), pace = paceOf(wh);
  const gun = state.items?.[gunId], M = MODELS[gun?.model ?? 'r7'], recoil = M.recoil, rpm = M.rpm ?? 700;
  // (0.0.9: the parts × the chaos's time, the roller's at the row's start (exactly 1 when calm); the aim's own is aimMsOf's)
  const kt = tempo === 'rushed' ? TEMPO.rushed.timeK : 1, k = kt * roller.timeK, t = (ms) => Math.round(ms * k), tt = (ms) => Math.round(ms * kt);
  const aimed = state.stop?.aim?.key === target.key, rung = rungOfShooter(state, pid), b = beliefOf(state, gunId);
  const parts = [];
  const aim = !aimed && rung >= RUNG_AIM;
  if (aim) parts.push({ k: 'aim', ms: tt(aimMsOf(state, pid, gunId, target, { ms: atMs })) });
  const rate = HELD_RATE0 + mrk / 10;
  if (tempo === 'careful') {
    const h = aimed ? heldOf(state, pid, atMs, target.key) : null;
    parts.push({ k: 'hold', ms: aimed ? Math.max(0, h.toFullMs ?? 0) : Math.ceil(HELD_MAX / rate * 1000) });
  }
  const shiftMs = t(HEAD_SHIFT_S * pace * 1000), splitMs = t(R.split === 'pull' ? fireMs({ recoil, pace, rpm }) : TAP_SPLIT_S * pace * 1000);
  const recMs = t(recoverMs({ recoil, pace }));
  if (R.shiftAt !== 0) parts.push({ k: 'press', ms: t(TRIGGER_S * 1000) });
  R.rounds.forEach((r, i) => {
    if (R.shiftAt === i) parts.push({ k: 'shift', ms: shiftMs });
    const last = i === R.rounds.length - 1, ms = last ? recMs : R.shiftAt === i + 1 ? 0 : splitMs;
    parts.push({ k: 'round', ms, i, part: r.part, follow: r.follow, climbK: r.climbK });
  });
  let at = 0;
  for (const p of parts) { p.at = at; at += p.ms; }
  // (each round's odds on the roll's own list: the held aim at its time (the first's from the aim's settle; the rest
  // carry the first's; after a shift none), its climb, the tempo's −3)
  if (!odds) return { ms: at, parts, rounds: [], aim, offSafe: rung >= RUNG_AIM && b?.mode === 'safe', tempo };
  const aimEnd = aim ? parts[0].ms : null, roundTempo = tempo === 'rushed' ? 'rushed' : 'normal';
  const dcs = { torso: dcOf({ model: gun?.model ?? 'r7', rangeM: target.dM ?? 7, part: 'torso' }).dc, head: dcOf({ model: gun?.model ?? 'r7', rangeM: target.dM ?? 7, part: 'head' }).dc };
  let held0 = 0;
  const rounds = parts.filter(p => p.k === 'round').map(p => {
    const abs = atMs + p.at, shifted = R.shiftAt !== null && p.i >= R.shiftAt;
    let held;
    if (p.i === 0 && !shifted) held0 = held = aimEnd !== null ? Math.round(Math.min(HELD_MAX, Math.max(0, (p.at - aimEnd) / 1000) * rate)) : heldOf(state, pid, abs, target.key).v;
    else held = shifted ? 0 : held0;
    const mods = modsOf(state, pid, { gunId, target, part: p.part, tempo: roundTempo, follow: p.follow, climbK: p.climbK, ms: abs, held: { v: held } });
    const climb = mods.find(m => m.why === 'the muzzle still up from the last')?.v ?? 0;
    return { part: p.part, follow: p.follow, climbK: p.climbK, at: p.at, odds: oddsOf(mrk, dcs[p.part], mods), climb, held, dc: dcs[p.part] };
  });
  return { ms: at, parts, rounds, aim, offSafe: rung >= RUNG_AIM && b?.mode === 'safe', tempo };
}

// (the gun believed able: in the hands, a round believed chambered, no stoppage, the bolt forward)
const ableOf = (b) => !!b && b.chamber === 'live' && !b.stoppage && !b.locked;
const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
// (rounds believed left: the chamber's and the magazine's count when it is known exactly, else null (a count unknown or approximate))
// (a magazine believed out is known: only the chamber's round is left (the code review of v0.0.8: a Pair was offered, unstruck,
// with the magazine out, and fired one round))
const believedLeft = (b) => (b.mag === 'out' ? (b.chamber === 'live' ? 1 : 0) : typeof b.count === 'number' && !b.countApprox ? (b.chamber === 'live' ? 1 : 0) + b.count : null);
/**
 * The range a row's reach is judged at (m; see the header): a turner in your own lane on the pairs course at your line's
 * nominal distance while you stand in that line's box (pairs.js pairsReachM), else the measured range, unrounded.
 */
export function reachOf(state, pid, T) {
  const me = state.actors?.list?.find(a => a.who === pid) ?? null;
  const line = T?.kind === 'turner' && me ? pairsReachM(state, T.key, me.x, me.z) : null;
  return line ?? T?.dM ?? Infinity;
}
// (why a gun believed unable cannot take the head row: the words it is struck with (see the header))
const unableWords = (b) => (!b ? 'no rifle' : b.stoppage || b.chamber === 'dud' || b.chamber === 'case' ? 'a stoppage' : b.locked ? 'empty, RELOAD first' : b.chamber === '?' ? 'chamber unknown' : 'chamber empty');
/** Whether a target may take a shot row (see the header): a turner facing and standing, or a person bracketed in a contact. */
export function rowTarget(state, T) {
  if (!T) return false;
  if (T.kind === 'turner') return (T.facingK ?? 0) >= SEEN && !T.down;
  if (T.kind === 'person') return !!contactNow(state)?.last?.ids?.includes(T.key);
  return false;
}

/**
 * The shot rows the panel offers now (see the header), the offered first in their order (the one that leads marked
 * first), then those struck by a gate; [] where none is relevant. Each a Row: { id, kind: 'shot', label, ms, rushMs,
 * carefulMs, odds, routine, off, subs, cmd, skill, target, rounds, parts, gate, first }.
 */
export function shotRows(state, pid, ms = state.clock.ms) {
  const S = state.stop;
  if (!S || S.mode !== 'stop' || !S.pick) return [];
  const T = targetOf(state, S.pick, pid), gunId = S.gun, b = beliefOf(state, gunId);
  if (!rowTarget(state, T)) return [];
  const up = stillUp(state, T.key), able = ableOf(b);
  // (the gun believed unable: no row, but To the head after "He's still up", struck with why (see the header: never silent))
  if (!able && !up) return [];
  const mrk = rollerOf(state, pid, { ms }).value('marksmanship'), rung = rungOfShooter(state, pid), aimed = S.aim?.key === T.key;
  const reachM = reachOf(state, pid, T), armour = armourSeen(state, T.key);
  const order = !able ? ['head'] : up ? ['head', 'failure', 'pair', 'hammer', 'triple'] : armour ? ['failure', 'pair', 'hammer', 'triple'] : ['pair', 'hammer', 'triple', 'failure'];
  const left = able ? believedLeft(b) : null, offered = [], struck = [];
  for (const key of order) {
    const R = ROWS[key];
    if (key === 'head' && !up) continue;
    const far = reachM > R.maxM;
    if (far && key !== 'head') continue;
    const plan = rowPlan(state, pid, R.id, T, { atMs: ms, gunId }), rush = rowPlan(state, pid, R.id, T, { atMs: ms, gunId, tempo: 'rushed', odds: false }), care = rowPlan(state, pid, R.id, T, { atMs: ms, gunId, tempo: 'careful', odds: false });
    let off = null;
    if (!able) off = unableWords(b);
    else if (far) off = `${Math.round(reachM)} m, past ${R.maxM}`;
    else if (R.gate && mrk < R.gate) off = `Marksmanship ${R.gate}`;
    else if (left !== null && left < R.rounds.length) off = `${NUM[left] ?? left} left`;
    else if (b.mode === 'auto') off = 'on auto';
    else if (rung < RUNG_AIM && b.mode === 'safe') off = 'off safe first';
    else if (rung < RUNG_AIM && !aimed) off = 'aim first';
    const row = { id: R.id, kind: 'shot', label: R.label, ms: plan.ms, rushMs: rush.ms, carefulMs: care.ms, odds: plan.rounds[0].odds, routine: false, off,
      subs: plan.parts.map(p => ({ id: p.k, label: p.k === 'round' ? `${p.part === 'head' ? 'Head' : 'Round'} ${p.i + 1}` : PART_LABELS[p.k], ms: p.ms })),
      cmd: false, skill: 'marksmanship', target: T.key, rounds: plan.rounds.map(r => ({ part: r.part, odds: r.odds, climb: r.climb, follow: r.follow, climbK: r.climbK })),
      parts: plan.parts.map(p => ({ k: p.k, ms: p.ms, ...(p.part ? { part: p.part } : {}) })), gate: R.gate ? { skill: 'marksmanship', v: R.gate } : null, first: false };
    (off && off.startsWith('Marksmanship') ? struck : offered).push(row);
  }
  const lead = offered.find(r => !r.off);
  if (lead && (up || armour)) lead.first = true;
  return [...offered, ...struck];
}

// ---- the row played (shooting.js runSub, endSub) ----

/** The plan a step keeps (saved, so whole numbers and words only): parts { k, ms, i?, part?, follow?, climbK? }. */
export const keptPlan = (plan) => ({ ms: plan.ms, offSafe: !!plan.offSafe, parts: plan.parts.map(p => ({ k: p.k, ms: p.ms, ...(p.k === 'round' ? { i: p.i, part: p.part, follow: p.follow, climbK: p.climbK } : {}) })) });

/**
 * One 'round' sub-step (w; see the header): resolveShot on the round's formula time, its part, follow and climb, the
 * held aim the row carries; the scene's recordShot. Returns { ms, shot, text }: the part's interval, or the recovery when
 * the bolt locks back (the row cut there), 0 on a click.
 */
export function runRound(state, bus, d, i, atMs) {
  const S = state.stop, pid = S.who, gunId = S.gun, p = d.plan.parts[i], R = rowOf(d.step);
  const T = targetAt(state, d.target, pid, atMs);
  const shifted = R?.shiftAt !== null && R?.shiftAt !== undefined && p.i >= R.shiftAt;
  // (the row's first round reads the held aim at its time; the rest carry it; a round after the shift holds nothing)
  let held = null;
  if (p.i === 0 && !shifted) d.held0 = S.aim ? heldOf(state, pid, atMs, S.aim.key).v : 0;
  else held = { v: shifted ? 0 : d.held0 ?? 0 };
  const tempo = d.tempo === 'rushed' ? 'rushed' : 'normal';
  const { shot } = resolveShot(state, bus, { pid, gunId, target: T, part: p.part, tempo, follow: p.follow, climbK: p.climbK, held, atMs,
    row: { id: d.step, n: R?.rounds.length ?? 1, i: p.i } });
  recordShot(state, bus, shot);
  let ms = p.ms;
  const gun = state.items[gunId], ro = rollerOf(state, pid, { ms: atMs }), pace = paceOf(ro.value('weapons')), M = MODELS[gun?.model ?? 'r7'];
  const rec = Math.round(recoverMs({ recoil: M.recoil, pace }) * (tempo === 'rushed' ? TEMPO.rushed.timeK : 1) * ro.timeK);
  if (!shot.fired) { d.gunStop = 'click'; ms = 0; }
  else if (shot.stoppage) { d.gunStop = 'stop'; ms = rec; }
  else if (shot.empty && p.i < (R?.rounds.length ?? 1) - 1) { d.cut = true; d.dry = true; ms = rec; }
  if (S.aim && shot.fired) S.aim.settledMs = atMs + ms;
  const text = shot.fired ? `Bang. ${shot.roll?.verb ?? ''}`.trim() : 'Click.';
  return { ms, shot, text };
}

/** A row's sub-step (w): 'press', 'round' or 'shift' at atMs. Returns { ms, shot?, text }. */
export function runRowSub(state, bus, d, i, atMs) {
  const p = d.plan.parts[i];
  if (p.k === 'round') return runRound(state, bus, d, i, atMs);
  if (p.k === 'shift') return { ms: p.ms, text: 'To the head.' };
  if (p.k === 'press') return { ms: p.ms, text: 'The press.' };
  return { ms: p.ms, text: PART_LABELS[p.k] ?? p.k };
}

/** A row's sub-step's end (w): the failure drill's assessment at the shift's end; the third round not fired on a man down. */
export function endRowSub(state, bus, d) {
  const p = d.plan?.parts?.[d.i];
  if (!p || p.k !== 'shift' || d.step !== ROWS.failure.id) return;
  if (assessDown(state, d.target, d.untilMs)) {
    d.cut = true; d.assessed = 'down';
    logEntry(state, bus, { kind: 'note', tone: 'note', text: 'Down after the pair: no third round.', who: state.stop.who, step: d.step });
  }
}

// ---- the reloads by purpose (see the header) ----

const pouchWords = (key) => ({ p1: 'chest pouch 1', p2: 'chest pouch 2', p3: 'chest pouch 3', p4: 'chest pouch 4', dump: 'the dump pouch' }[key] ?? key);
/** Whether the magazine in the gun is believed at half or less (an unknown count is not). */
export function halfOrLess(b) {
  const cap = famCap(b?.magFam);
  return !!b && b.mag === 'in' && typeof b.count === 'number' && cap > 0 && b.count <= cap / 2;
}

/** Whether a spare believed fuller than the magazine in is at hand (its count known and above the gun's believed count). */
export function fullerAtHand(state, pid, gunId, b = beliefOf(state, gunId)) {
  const fams = MODELS[state.items?.[gunId]?.model ?? 'r7']?.fams ?? null, n = typeof b?.count === 'number' ? b.count : Infinity;
  return sparesOf(state, pid, null).some(id => (!fams || fams.includes(state.items[id]?.fam)) && (believedN(state.items[id]) ?? -1) > n);
}

/**
 * The reloads the panel offers now, by purpose (see the header): the built macros (drills.js macrosFor), each a Row of
 * kind 'command' (shooting.js macroRow) with purpose, its label by purpose, first (RELOAD on a bolt believed locked on
 * an empty; Top up in a lull at half or less), the first ones first; Top up's queue to the session's named magazine.
 */
export function reloadRows(state, pid, ms = state.clock.ms) {
  const S = state.stop, gunId = S?.gun ?? gunOn(state, pid), gun = state.items?.[gunId];
  if (!gun) return [];
  const b = beliefOf(state, gunId), R = rangeOf(state);
  const ms0 = macrosFor(state, pid, gunId).filter(m => RELOAD_PURPOSE[m.id]);
  if (!ms0.length) return [];
  const roller = rollerOf(state, pid, { ms }), out = [];
  for (const m of ms0) {
    const purpose = RELOAD_PURPOSE[m.id], row = { ...macroRow(state, roller, gun, b, m), purpose, label: RELOAD_LABELS[purpose], first: false };
    if (purpose === 'speed') row.first = !!b.locked && b.count === 0;
    if (purpose === 'tactical') {
      // (first in a lull, the magazine in at half or less, with a fuller one at hand: a magazine of ten in a thirty has
      // nothing to top up with from others of ten (my call: "half" alone would lead with Top up on a full load of ten))
      row.first = halfOrLess(b) && fullerAtHand(state, pid, gunId, b) && lullOf(state, pid, ms);
      // (the coach's named magazine: Top up reaches for its pouch, and says which (§8 item 18))
      const want = R?.wantMag ? state.items[R.wantMag] : null, pouch = want ? pouchesOf(state, pid).find(p => !p.dump && p.mags.includes(R.wantMag)) : null;
      if (want && pouch && gun.mag !== R.wantMag) {
        const q = subsOf(m.id, b).map(a => (a === 'reach' ? `reach@${pouch.key}` : a)), n = believedN(want);
        row.queue = q;
        row.ms = q.reduce((t, a) => t + actionMs(roller, gun, a, { tempo: 'normal' }), 0);
        row.subs = q.map(a => ({ id: a, label: LABELS[a] ?? a, ms: actionMs(roller, gun, a, { tempo: 'normal' }) }));
        row.label = `${RELOAD_LABELS.tactical}: the ${n !== null ? `${NUM[n] ?? n}-round` : 'short'} magazine, ${pouchWords(pouch.key)}`;
        row.want = R.wantMag;
      }
    }
    out.push(row);
  }
  return out.map((r, i) => ({ r, i })).sort((a, z) => Number(z.r.first) - Number(a.r.first) || a.i - z.i).map(e => e.r);
}

/** The climb a round would take (the specials suite's table): −round(BURST_K × follow × recoil × climbOf(MRK) × climbK), planted standing. */
export const climbFor = ({ mrk, follow, climbK = 1, recoil = MODELS.r7.recoil, stance = 'stand' }) => -Math.round(BURST_K * follow * recoil * climbOf(mrk) * ANCHOR.climb * (SUPPORT[stance] ?? 1) * climbK) || 0;
