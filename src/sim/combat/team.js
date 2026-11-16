// OLYMPUS combat: the team, role kept apart from side: who a member is in the stack (his role: #1 you, #2 your number two) and which geometry slot of a room's plan he works (his side), whose man each stand is, the other side, the give line, the #2's tasks and the team's words in one table (COMBAT §25.19; the build sheet v0.0.19 §0 items 7, 8, 14, §3.2).
//
// Until v0.0.19 the two numbers were one: a stand's T.slot was both the side of the room it stands in and the man whose it
// is. This module is the one reader of "whose man" (ownerOf) and the one map between a role and a side at a door (sideOf,
// roleAt), so the sites that decide ownership (contact.js, bundle.js, instinct/cqb.js, house-two.js) call it instead of
// reading T.slot, and T.slot stays the side, the geometry (room.js manPlace writes it for a man by where he stands).
//
// The other side (FM 3-06.11 §3-29: "#2 moves in the direction opposite #1"): at your #2's cue, you past the threshold on his
// side (sideTaken: more than SIDE_TAKEN_M 0.45 m off the door's middle line, STRAIGHT_M 0.3 and a body's half-width) and his
// way along your lane clear of you, he takes yours (bundle.js sideFor, takeOtherSide here): R.house.two.side[door] = 1, once a
// room and saved, "Left!" or "Right!" as the screen shows it (the rule's `screen`, corner.js), the leg's L.sides { atMs, took } and
// the run sheet's neutral "SIDES SWAPPED" (teamMarks; question 5 of the round: noted, not a fault). Back on your own side before he
// is past his threshold, the swap is given back (giveSideBack: his walk in on yours would end on you). Whose a stand is follows the
// side: ownerOf(T) is roleAt(T's door, T.slot), so after the swap his eyes, his pars, your "Clear!"'s wait and the DI all read
// the new owners. TEAM_OPPOSITE false is v0.0.18's wait. With nothing swapped every reader gets exactly what it read before
// (absent stays absent; each site keeps its own `?? 1`): the standard lane is v0.0.18's to the byte.
//
// The doer (the build sheet's §0 item 7): DOER_DEFAULT 1, you throw and breach on the DRILL rows; your #2 on your word (TEAM 2
// "#2, bang it", TEAM 3 "Breacher up", TEAM 4 "As you were": drills/enter-and-clear.js TEAM_TASKS, bundle.js's task kinds).
// A task puts the doer at the stack's front point on the latch-side wall line and the other man on the give line (giveOf:
// GIVE_M 0.6 m off the wall line into the hall, BODY_GAP_M 0.5 + GIVE_MARGIN_M 0.1, so the two lines never cross); taskOf is
// the live task, taskWhy the reason its row is struck (the measures are bundle.js's; the order and the words are here, so
// this module imports nothing that imports bundle.js: bundle.js reads TEAM_WORDS at its own load).
//
// TEAM_WORDS is the team's words, one entry an id: { words, by (1 you, 2 your number two, 0 either), answer? (the mate's
// call that answers it), close? (the caller's that closes it) }. bundle.js TWO_SAY and SAY and sidearm.js CALLS are read from
// it (tests/team.test.mjs holds them equal), never the other way round. Pure but takeOtherSide, which writes the swap.
import { playerId } from '../../core/ids.js';
import { frameOf, cornerRuleOf } from './corner.js';
import { doorOfRoom, pastThreshold } from './room.js';

/** The other side when you take his (FM 3-06.11 §3-29); false: v0.0.18's wait and "Coming in!" (the round's question 2's switch). */
export const TEAM_OPPOSITE = true;
/** Who throws and breaches on the DRILL rows: 1 you (v0.0.18 Q3's default); 2 your #2 (the round's question 3's switch). */
export const DOER_DEFAULT = 1;
/** #1 past the threshold this far off the door's middle line has taken a side (m; corner.js STRAIGHT_M 0.3 + a body's half-width, my call). */
export const SIDE_TAKEN_M = 0.45;
/** The give line: this far off the stack's wall line into the hall (m; bundle.js BODY_GAP_M 0.5 + GIVE_MARGIN_M 0.1). */
export const GIVE_M = 0.6;
/** A cue beat waits at most this, then hands back (ms; my call: never a dead end). */
export const CUE_MAX_MS = 10_000;
/** A team call is answered within this (ms; F36's window, my call). */
export const ANSWER_MS = 1_000;

const W = (words, by, more = {}) => Object.freeze({ words, by, ...more });
/**
 * The team's words by id (see the header). TWO_SAY's ids (by 2) and CALLS' (by 1) as v0.0.18 had them, then bundle.js SAY's
 * and the team's own: the side call (its words the screen's, "Left!"), the orders and the doer's calls.
 */
export const TEAM_WORDS = Object.freeze({
  reloading: W('Reloading!', 2, { answer: 'covering', close: 'up' }),
  up: W('Up.', 2),
  covering: W('Covering!', 2),
  gunDown: W('Gun down!', 2, { answer: 'covering', close: 'gunUp' }),
  gunUp: W('Gun up!', 2),
  coming: W('Coming in!', 2),
  'call:gundown': W('Gun down!', 1, { answer: 'covering', close: 'call:gunup' }),
  'call:gunup': W('Gun up!', 1),
  'call:stoppage': W('Stoppage!', 1, { answer: 'covering', close: 'call:up' }),
  'call:up': W('Up!', 1),
  'call:covering': W('Covering!', 1),
  // (bundle.js SAY's: "Clear!" by either, the leader's "Room clear!" and "Hall clear!", the #2's "Ready.", #1's tell)
  clear: W('Clear!', 0),
  ready: W('Ready.', 2),
  roomclear: W('Room clear!', 1),
  hallclear: W('Hall clear!', 1),
  tell: W('Opens in, I go left.', 1),
  // (the doer's, whoever he is: D1's words)
  bangout: W('Bang out!', 0),
  breaching: W('Breaching!', 0),
  placing: W('Placing.', 0),
  open: W('Open!', 0),
  // (the team's own (v0.0.19): his side as the screen shows it, your orders)
  side: W(null, 2),
  bangit: W('Two, bang it!', 1),
  breacherup: W('Breacher up!', 1),
  belay: W('As you were.', 1),
  // (his, held off the stack's front point by you after your order: TWO_BLOCK_SAY_MS on, once (the review of 2026-11-16))
  front: W('Give me the door!', 2),
});

// (the house's record, read from the session, never by importing the scenario)
const houseOf = (state) => state?.armoury?.range?.house ?? null;
const other = (s) => (s === 1 ? 2 : s === 2 ? 1 : s);

/** The team's members: [{ role 1, pid you, rec null }, { role 2, pid, rec R.house.two }] with a #2 on the lane, else you alone. */
export function membersOf(state) {
  const H = houseOf(state), Wr = H?.two ?? null, two = Wr?.pid ?? H?.twoPid ?? null;
  return [{ role: 1, pid: playerId(state), rec: null }, ...(two ? [{ role: 2, pid: two, rec: Wr }] : [])];
}
/** A member by person: { role, rec } or null. */
export function memberOf(state, pid) {
  const m = membersOf(state).find(x => x.pid === pid);
  return m ? { role: m.role, rec: m.rec } : null;
}
// (the doors where the sides are swapped: R.house.two.side, { [door]: 1 }, absent where none is)
const swapped = (state, door) => houseOf(state)?.two?.side?.[door] === 1;

/** The geometry slot (side) a role works at a door: the #2's R.house.two.side[door] (absent: 2), the other for you; a role beyond 2 its own. */
export const sideOf = (state, door, role) => (swapped(state, door) ? other(role) : role);

/** The role that works a side at a door, sideOf's inverse. */
export const roleAt = (state, door, side) => (swapped(state, door) ? other(side) : side);

/**
 * Whose man a stand is (the role that owns it): roleAt(the stand's door, T.slot). With no side swapped anywhere, T.slot exactly
 * as each site read it (absent stays absent; each site keeps its own `?? 1`), so every lane without a swap is v0.0.18's.
 */
export function ownerOf(state, T) {
  const s = T?.slot;
  if (s === undefined || s === null) return s;
  const sw = houseOf(state)?.two?.side;
  if (!sw) return s;
  const door = doorOfRoom(T.room);
  return door ? roleAt(state, door, s) : s;
}

/**
 * The side of the room #1 stands on (see the header): the side ('left' | 'right', corner.js's words in the door's frame going in)
 * of the slot whose point lies nearer him across the door (the frame's lateral s), past the threshold and more than SIDE_TAKEN_M
 * (or a quarter of the two points' spread, the less) off the line halfway between them; null otherwise. A centre-fed room's
 * points stand either side of the middle line (the band SIDE_TAKEN_M); a corner-fed room's #2 goes straight down the fed wall,
 * so standing on that line is his side; a passage's two lanes are a pace apart.
 */
export function sideTaken(plan, x, z) {
  if (!plan || !pastThreshold(plan, x, z)) return null;
  const F = frameOf(plan), p1 = plan.points?.[0], p2 = plan.points?.[1];
  if (!F || !p1 || !p2) return null;
  const s = F.to(x, z).s, s1 = F.to(p1[0], p1[1]).s, s2 = F.to(p2[0], p2[1]).s, mid = (s1 + s2) / 2, band = Math.min(SIDE_TAKEN_M, Math.abs(s1 - s2) / 4);
  if (Math.abs(s - mid) <= band) return null;
  const slot = Math.abs(s - s2) < Math.abs(s - s1) ? 2 : 1;
  return cornerRuleOf(plan, slot)?.side ?? null;
}

/** The give line's point for a place on the stack's wall line (see the header): at + GIVE_M along the door's outward normal (away from the room), [x, z] to 0.0001 m. */
export function giveOf(plan, at) {
  const F = frameOf(plan);
  if (!F || !at) return null;
  return [Math.round((at[0] - F.f[0] * GIVE_M) * 1e4) / 1e4, Math.round((at[1] - F.f[1] * GIVE_M) * 1e4) / 1e4];
}

/** The #2's live task at a door (R.house.two.task, not done, belayed or failed), or null. */
export function taskOf(state, door = null) {
  const t = houseOf(state)?.two?.task ?? null;
  if (!t || ['done', 'belayed', 'failed'].includes(t.st)) return null;
  return door && t.door !== door ? null : t;
}

/** The reasons a task row is struck, in the order they are given (see taskWhy). */
export const TASK_WHY = Object.freeze({ issue: 'not issued', away: "your two's not with you", busy: "he's on a man", open: 'door open', toward: 'opens toward you', give: 'no room beside the door', inside: 'in already', none: 'nothing to belay', tasked: 'on the door already' });
/**
 * Why a task row is struck now, or null where it is live (bundle.js measures, this module orders): m { kind 'bang' | 'breach' |
 * 'belay', has (his kit carries it: breach.js kitHas for his pid), away (twoAway, or he is not idle), busy (on a man), shut
 * (the door shut), toward (the method opens toward you: a charge or the ram on a pull door), giveOk (the give line on the
 * nav), inside (you past the threshold), task (a task of his live: "As you were" live, the others struck) }.
 */
export function taskWhy(state, m) {
  if (m.kind === 'belay') return m.task ? null : TASK_WHY.none;
  if (m.task) return TASK_WHY.tasked;
  if (!m.has) return TASK_WHY.issue;
  if (m.inside) return TASK_WHY.inside;
  if (m.away) return TASK_WHY.away;
  if (m.busy) return TASK_WHY.busy;
  if (m.kind === 'breach' && !m.shut) return TASK_WHY.open;
  if (m.kind === 'breach' && m.toward) return TASK_WHY.toward;
  if (!m.giveOk) return TASK_WHY.give;
  return null;
}

/**
 * The side call's words (TEAM_WORDS.side): the side he now takes (the rule of `slot`, 1 yours when he takes yours) as the screen
 * shows it, "Left!", "Right!", "Top!", "Far left!", "Far corner, bottom!": the rule's own `screen` (corner.js computes it in the
 * view's frame; the rule object carries no frame for screenWordsOf to turn, so v0.0.19's first build fell back to the marine's own
 * words and called room 2 "Left!" where the screen and the DI say right: the review of 2026-11-16), else its words.
 */
export function sideWords(plan, slot = 1) {
  const r = cornerRuleOf(plan, slot), w = r?.screen ?? r?.words ?? 'left';
  const t = w.replace(/^the /, '');
  return `${t.charAt(0).toUpperCase()}${t.slice(1)}!`;
}

/**
 * The other side taken (see the header; bundle.js sideFor decides it): R.house.two.side[door] = 1, the leg's L.sides { atMs,
 * took }, his call "Left!" or "Right!" (TEAM_WORDS.side), a 'house' fact { phase 'sides' }. Returns 1, his side now.
 */
export function takeOtherSide(state, bus, rec, plan, door, took, ms = state.clock.ms) {
  (rec.side ??= {})[door] = 1;
  const H = houseOf(state), L = [...(H?.rooms ?? []), ...(H?.hall ? [H.hall] : [])].find(x => x.door === door) ?? null;
  if (L) L.sides = { atMs: ms, took };
  const text = sideWords(plan);
  bus?.emit('say', { who: rec.pid, text, kind: 'speech', durMs: 200, call: 'side' });
  bus?.emit('house', { phase: 'sides', room: L?.room ?? plan?.room ?? null, who: rec.pid, atMs: ms, kind: took, text });
  return 1;
}

/**
 * The swap given back (bundle.js sideFor's other way; the review of 2026-11-16): you back on your own side of the room before he is
 * past his threshold, so his walk in on yours would end on you. The door's side record dropped (R.house.two.side, gone when empty:
 * absent stays absent), the leg's L.sides with it, his call his own side as the screen shows it, a 'house' fact { phase 'sides',
 * kind 'back' }. Returns 2, his side again.
 */
export function giveSideBack(state, bus, rec, plan, door, ms = state.clock.ms) {
  if (rec?.side) { delete rec.side[door]; if (!Object.keys(rec.side).length) delete rec.side; }
  const H = houseOf(state), L = [...(H?.rooms ?? []), ...(H?.hall ? [H.hall] : [])].find(x => x.door === door) ?? null;
  if (L?.sides) delete L.sides;
  const text = sideWords(plan, 2);
  bus?.emit('say', { who: rec.pid, text, kind: 'speech', durMs: 200, call: 'side' });
  bus?.emit('house', { phase: 'sides', room: L?.room ?? plan?.room ?? null, who: rec.pid, atMs: ms, kind: 'back', text });
  return 2;
}

/** The #2's task cleared (a leg's end, the lane's end): nothing left to say or do at a door behind you. */
export function clearTask(H) {
  if (H?.two?.task) delete H.two.task;
}

/** The team's marks on a leg's run sheet row (see the header): "SIDES SWAPPED" where they were, a neutral mark (question 5). */
export function teamMarks(state, H, L) {
  return L?.sides ? ['SIDES SWAPPED'] : [];
}
