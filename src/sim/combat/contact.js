// OLYMPUS sim: the contact, from the first sighting of a target to the pause that hands the choice back: the detector, the window, the pause, the identification and the contact's rows (COMBAT §25.4.1, §25.4.5, §25.4.6, §25.4.8; the build sheet 0.0.8 §2.1, §3.1, §8 items 2, 5 to 9, 25, 26).
//
// The detector (contactLook, the people domain's fast layer 'look', lived ticks only) looks at the range
// session's turners (arms/turners.js: at most six on the bay; until the player's sightings exist in 0.0.10 it
// calls PEOPLE's sightOf on them itself, COMBAT §25.10.3) and at nothing else, so a game with no turners, gunless
// or test-handling or test-range, is never touched. A turner not yet known whose seenK = sightOf(me, its spot).vis
// × facingOf(T, ms) reaches SEEN 0.5 on this tick is seen: it opens the window (the 'contact' fact 'seen') or,
// a window being open, joins it ('join': the window's end re-taken as the first sighting plus the take-in for
// all of them, severalK by their number, the worst whoK, the slowest expectation; COMBAT §25.4.5's several
// people). A turner stays known while it faces; turned away (facing under SEEN) it is forgotten, so its next
// turn is a fresh sighting. The window's record is the mind's (people/mind.js noteContact; state.mind.contact =
// { n, known: { key: seenMs }, pending, last }), plain data, absolute times only (COMBAT §25.4.8):
//     pending = { id, ids, seenMs, untilMs, ms, expect, n, grade, roll, parts, rangeM, whoK, armed, goMs, mx, mz, run }
// where ms is react.js takeInMs's take-in and untilMs = seenMs + ms.
//
// During the window (COMBAT §25.4.5) the world runs at 1:1 and the keys are not the marine's: refusesAct(state,
// action) is true for every sim action (game.js act()'s gate, the build sheet's §2.6), the page refusing its own
// keys but Space and Esc; the feet (feetOf, read by places/move.js playerStep) carry the move held at the
// sighting for the body's go (react.js goMs: 235 ms for the private) and then stop (BODY §16.2's braking waits
// for the stances: §8 item 7), unless the marine was pre-armed (pending.armed: nobody this round), whose held
// move carries on through the window.
//
// The pause (contactInput, the people domain's fast layer 'input', which runs while time stands still): on the
// first tick at or past untilMs it enters stop motion with the contact bracketed (shooting.js enterStop, via
// 'contact', the pick the window's target nearest the muzzle's yaw) and holds 'stop', so that very tick freezes
// (TIME §4.3). A step still running then (a live V, A or W out of the mode, or a stop-motion step) is let end
// first and the pause comes on its end's tick (its boundary is taken here when due, as shooting.js stopInput
// would take it later in the same layer); a command (a macro) finishes the sub-step under way and halts there,
// its rest queued as the panel's "Carry on" (COMBAT §25.4.5 as built: the design's 250 ms FINISH_MS rule replaced, a sub-step is never cut: one
// that ends within 250 ms finishes, and so does one that ends later, the pause waiting for it); a chained wait
// is cut. It always ends in a pause, never on a person the marine has not taken in, and time never stands still
// inside the window: a stop-motion step that ends in it lets the clock run on (its 'stop' hold released here,
// should the step's end have set it), and any other hold (a reflex card) ends the window at once, so the game
// cannot freeze with every action refused. At the pause each target is identified (identify: an Awareness check
// against IDENT_DC0 6 + round(range / 5 m), +4 in the dark, on stream(seed, 'combat:ident', pid, contactId, key,
// atMs)): passed, what it holds (T.holds: 'rifle', 'pistol', 'hands', 'phone') and, on an armoured face, the
// armour; failed, 'unseen' ("can't see his hands"), never a weapon that is not there. The record moves to last =
// { id, ids, seenMs, atMs, ms, expect, n, grade, parts, pick, ident, armour, words }, the log gets a 'contact'
// entry with the take-in factor by factor and what was seen, and the bus the 'contact' fact 'pause'.
//
// The contact's rows (contactRows, read by shooting.js stepsOf at a pause on the bracketed target if it is one
// of the contact's and still faces): Hold him ('contact:hold': the aim if not on him, then the held aim to +4,
// no shot) and Challenge ('contact:challenge', CHALLENGE_MS 1.2 s, "Show me your hands!", where his hands were
// not seen or are empty: after it a fresh identification at +CHALLENGE_BONUS 4); both lead the panel (lead:
// true) for an identified no-shoot (COMBAT §25.4.6). runContactSub and endContactSub are the challenge's
// sub-step, called by shooting.js runSub and endSub. lullOf(state, pid, ms) is the lull a Top up waits for: no
// window open, no threat facing and standing, and LULL_MS 3 s since the latest of your last shot, the last
// pause and the last turner gone edge-on. contactNow(state, ms) is the HUD's view: the window's k (the brackets
// closing) and the last contact (the stamp, the plaque's lead, the log).
// 0.0.9 (the build sheet 0.0.9 §2.1, §8 items 9, 11; COMBAT §5.3, §5.7): the window's take-in reads felt's band at its
// first sighting (supp.js bandN(feltOf(state, pid, seenMs)), kept on the window as pending.band so a target joining it
// is taken in on the same band); a startle is the window re-used: refusesAct is true and feetOf stops the feet while the
// player is startled, no sighting is taken while he is startled or flash-blind (the detector looks again on the first
// tick after, with the felt of that moment), and a window open when it came pauses only once it is over.
// 0.0.10 (the build sheet 0.0.10 §2.1, §8 item 13): a sighting that opens a window while a Breathe runs (shooting.js, in the
// mode or out of it) cuts it at its sub-step's end, as the startle does; the pause comes then.
// 0.0.12 (the build sheet 0.0.12 §2.2, §8 items 4, 9; COMBAT §25.4.5, §25.8.2): in Combat and Assault the feet's stop is the
// body's (places/move.js: the wanted velocity zero after the go, the legs' brake: BODY §16.2's 0.24 m for the private at
// 1 G); a marine is pre-armed (pending.armed) when a bundle runs (state.stop.doing with beats) or a Watch is held (the
// actor's watch, src/sim/combat/bundle.js), so his feet carry on through the window. At the window's end a running bundle
// is handed back ('contact': its moves and scans cut where they stand, its other beats let end, the pause on the last's
// end), its rest the panel's "Carry on: …" (bundle.js carryRow, drill:carry); a Watch puts the muzzle on its spot at the
// pause. A target's name in the log is its record's (T.name, the house's stands), else its lane's.
// v0.0.20's close (COMBAT §25.19.6): below rung 2 your entry on your #2's bang is pre-armed as a bundle is (bangEntry): within
// burst.js BANG_LATE_MS of his bang on your door, you short of its threshold, a sighting leaves your feet on their way in.
// 2026-11-12 (the shoot house's rework R3, COMBAT §25.19.3.1): from rung 2 the window's end **suspends** a running bundle
// instead of handing it back (stepper.js suspendFlow): its moves run on through the window and are not cut, a running scan is
// paused where it stands, and the pause comes once a hands or voice beat under way has ended; the bundle waits on the stop
// as state.stop.flow and the shot chosen runs inside it (bundle.js flowIn). Below rung 2 the hand-back is as built. A flow
// taken up beside a step pre-arms the marine as a running bundle does.
// 2026-11-12 (the rework's R4, COMBAT §25.19.4): **the #2's sector is his**. A window whose men are all of his sector, he up,
// his rifle working and with you (on his stack, in the room, a slot's doing under way or on a man), none within HIS_CONE_DEG
// 20° of your muzzle, closes with no pause: the mind's `his` (his men watched every tick: the pause after all once he is no
// longer up with you), the log "His. Taken in 0.05 s", the fact 'his'. And **the standing order** (byOrder; question 1's
// default: built, from rung 4, off): at the pause, every man of the contact in your sector seen armed, facing, nobody within
// ORDER_ALONE_M 1 m of him: the doctrinal row chosen at once, moving on, "By your order: …".
// v0.0.19 (the build sheet v0.0.19 §3.3, §0 item 13; COMBAT §7.11, §25.18): **the live men**. Every sighting reads combat/men.js
// seenK (a stand's as before, to the bit: the detector quantised, twoOn raw, as each read it; a live man's by his exposure).
// The detector remembers each live man it sees this tick (c.seenAt, men.js remember) and forgets him for the take-in once he
// has been out of sight MAN_MEMORY_MS (men.js stale), so his next appearance is a fresh window; a stand is forgotten when it
// turns away, as built. A round from a man you did not know draws your eye (c.drawn, written by men.js incoming): the look
// that follows takes him in with the cone opened, his window's expectation 'alert' ("not where your muzzle was"), and the
// drawn eye is spent. The identification of a live man also reads what he is doing (last.state: 'aiming', 'looking',
// 'running', 'hands', 'cowering', 'down'; men.js LIVE_STATE), on a passed roll only. A live man down (sitting, still armed) keeps
// his rows: Hold him as "Cover him", leading. contactLive and lullOf read men.js upNow. And the startle's hold on the
// player's flow runs first in the look (bundle.js startleTick). A lane with no live man writes nothing new.
// v0.0.26 ("Bang, then go": its build sheet items 6, 7 and 9, §3.1; COMBAT §7.7, §7.11): the identification reads men.js
// liveStateOf, so a man taken in while startled, flash-blind or stunned reads 'dazed' (DAZED on the plaque), on every live lane.
// On "Bang, then go" (R.house.bangGo) the read then follows sight: a man whose state a passed look has written, seen at SEEN this
// tick (contactLook, you neither startled nor blind), is read as he is (liveStateOf), so the plaque's word, the stage's frame and T's
// line agree while he is in plain sight (the review of A, 2026-11-19: a man taken in DAZED who froze read DAZED for 4.15 s while drawn
// cowering and T said "He's done. Challenge him."); out of sight, or on the other lanes (their pins), it waits for the next look.
// Challenge is offered also on a man read cowering, or seen cowering now (his liveStateOf 'cowering', his body seen at SEEN), the
// bracket on him: a man who froze after the pause that took him in is still a man to challenge (the challenge's give is
// opfor.js challengeTick's). And "Search him" ('contact:search', SEARCH_LABEL, SEARCH_MS 20 s), on "Bang, then go"'s lane only
// (R.house.bangGo): a row on a man accounted for at his room's "Clear!" (searchableOf: ruled out there, or still accounted as
// down or with his hands up, men.js accountedOf, his leg called clear), not yet searched, within SEARCH_M 1.5 m of you, the one
// nearest you. Out of reach, the row is its walk, 'move:search' "To him, to search" (searchWalkOf: a move row as bundle.js
// startSingle runs the house's moves, at Combat to SEARCH_WALK_M 0.9 m short of the nearest such man on the line from you), so T and
// a press reach it as the keys do (the review of A, 2026-11-19: the men lay 3.0 to 4.9 m off at "Clear!", and with no walk the row
// was never offered on 192 lanes). Its 20 s are SEARCH_PARTS 4 parts, so a sighting (contactInput, as it cuts a
// Breathe) cuts it at a part's end; behind the house's skip the detector sits out, so in play only a search at 1× is cut by a sighting
// (the skip never begins over a pending; the code review of v0.0.26). Offered only until the lane's end. Its start writes R.house.bangGo.search = { key, fromMs, untilMs } (the
// scene's record of the last search begun) and its end, the sub's last tick lived, T.live.searched = { by, atMs }, bangGo.search
// back to null and the 'house' fact { phase: 'rp', kind: 'searched', key } (the last part's end only): his card turns to the truth
// then (the hud's).
// searchOn(state, ms) is whether a search is under way now (the stop's doing on its sub, or on its walk; never the record alone: a
// search cut by a cue leaves the record, and is offered again). cardPhaseOf(state, key) is the phase his hit card is drawn in: the truth once he is
// searched or the lane is over, belief before. Never required, never faulted.
// Pure but contactLook, contactInput, identify, runContactSub, endContactSub and byOrder, which write the mind, the stop
// and the log.
import { holdTime, releaseTime, isHeld } from '../../core/clock.js';
import { q } from '../../core/num.js';
import { stream } from '../../core/rng.js';
import { playerActor, playerId } from '../../core/ids.js';
import { check } from '../skills/checks.js';
import { sheetOf, rungOf } from '../skills/templates.js';
import { rollerOf, DARK_BELOW } from './roll.js';
import { SEEN } from '../people/perception.js';
import { contactOf, noteContact } from '../people/mind.js';
import { muzzleOf, angleDiff } from '../arms/carry.js';
import { turnersOf, turnerOf, facingOf, turnerTargets, edgeOnMs } from '../arms/turners.js';
import { takeInMs, goMs, takeInWords, takeInText, windowK } from './react.js';
import { enterStop, stopInput, targetOf, stepsOf, chooseStep } from '../arms/shooting.js';
import { heldOf, aimMsOf, HELD_MAX, HELD_RATE0 } from '../arms/shot.js';
import { logEntry } from '../log.js';
import { startled, feltOf, bandN, blockOf } from './supp.js';
import { halt as haltDoing, suspendFlow } from './stepper.js';
import { gunField } from '../arms/firearms.js';
import { roomPlanOf, pastThreshold, inFunnel, manPlace, doorOfRoom } from './room.js';
import { ownerOf, roleAt } from './team.js';
import { stillUp } from '../arms/specials.js';
import { seenK, upNow, stale, remember, drawnOn, gateWhy, casualtyOn, liveStateOf, accountedOf } from './men.js';
import { startleTick, flowOn, carryOn, doorNow, legsOf, wayOf } from './bundle.js';
import { profileOf, pathLen } from './stepper.js';
import { BANG_LATE_MS } from './burst.js';
import { opOf, onHouse, laneRec, sessionOf } from './op.js';

/** The rung from which a contact suspends a running bundle rather than handing it back (COMBAT §25.19.3.1). */
export const SUSPEND_RUNG = 2;

/** A man of the #2's sector is his unless he stands within HIS_CONE_DEG of your muzzle (COMBAT §25.19.4; my call). */
export const HIS_CONE_DEG = 20;

/** The identification's DC (COMBAT §25.4.6): IDENT_DC0 + round(range / IDENT_PER_M), IDENT_DARK in the dark. */
export const IDENT_DC0 = 6, IDENT_PER_M = 5, IDENT_DARK = 4;
/** The challenge (COMBAT §9.3, §25.4.6): its time and the identification's bonus after it. */
export const CHALLENGE_MS = 1200, CHALLENGE_BONUS = 4;
/** The lull a Top up waits for (the build sheet's §4). */
export const LULL_MS = 3000;
/** What a turner holds, in the words of what the marine saw; and what a failed look leaves. */
export const IDENT_WORDS = Object.freeze({ rifle: 'a rifle', pistol: 'a pistol', hands: 'hands empty', phone: 'a phone in his hand', unseen: "can't see his hands" });
/** The challenge's words. */
export const CHALLENGE_SAY = 'Show me your hands!';
/** The contact rows' labels. */
export const CONTACT_LABELS = Object.freeze({ 'contact:hold': 'Hold him', 'contact:challenge': 'Challenge' });
/** Hold him on a live man down, still armed (v0.0.19: the role-players'; COMBAT §7.11). */
export const COVER_LABEL = 'Cover him';
/** "Search him" (v0.0.26; COMBAT §7.7, CONTRACTS' 20 s): its label, its time (ms) and its reach from you (m; my call). */
export const SEARCH_LABEL = 'Search him', SEARCH_MS = 20_000, SEARCH_M = 1.5;
/** The search's parts, each SEARCH_MS / SEARCH_PARTS (my call: as Breathe's four, so a sighting cuts it at a part's end, never mid-part). */
export const SEARCH_PARTS = 4;
/** The search's walk: its end this far short of him on the line from you (m; my call: inside SEARCH_M with the walk's arrival to spare), and its label. */
export const SEARCH_WALK_M = 0.9, SEARCH_WALK_LABEL = 'To him, to search';

const sgn = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);
const ZERO_FEET = Object.freeze({ mx: 0, mz: 0, run: false, stroll: false });
const threatFace = (face) => face === 'threat' || face === 'armoured' || face === 'unknown';

/** The window open, or null. */
export function pendingOf(state) { return contactOf(state)?.pending ?? null; }

/** Whether a sim action is refused: every one while a window is open or the player is startled (COMBAT §25.4.5, §5.7; game.js act()'s gate). */
export function refusesAct(state, action) { return !!pendingOf(state) || startled(state, playerId(state), state.clock.ms) || (casualtyOn(state) && state.stop?.mode !== 'stop'); }

/**
 * The feet while a window is open (see the header): the move held at the sighting until seenMs + goMs, then
 * stopped; pre-armed, the held move all through. With no window, the input's own. Returns { mx, mz, run, stroll }.
 */
export function feetOf(state, input) {
  // (v0.0.19: a startle, and the live lane's casualty beat (men.js casualtyOn): the feet still)
  if (startled(state, playerId(state), state.clock.ms) || casualtyOn(state)) return ZERO_FEET;
  const P = pendingOf(state);
  if (!P) return { mx: sgn(input?.mx), mz: sgn(input?.mz), run: !!input?.run, stroll: !!input?.stroll };
  if (P.armed || state.clock.ms < P.seenMs + P.goMs) return { mx: P.mx, mz: P.mz, run: !!P.run, stroll: false };
  return ZERO_FEET;
}

// (the target records of a window's keys at ms, with the range from the player)
function targetsAt(state, keys, ms) {
  const me = playerActor(state);
  return turnerTargets(state, ms).filter(t => keys.includes(t.key)).sort((a, b) => keys.indexOf(a.key) - keys.indexOf(b.key))
    .map(t => ({ key: t.key, x: t.x, z: t.z, face: t.face, rangeM: q(Math.hypot(t.x - (me?.x ?? 0), t.z - (me?.z ?? 0)), 0.01) }));
}

// (the take-in of a window's targets, from its first sighting: one notice check, keyed by the contact)
// (band: the window's, felt's band at its first sighting, given on a join)
// (expect: an expectation given by key (v0.0.19: a man whose round drew the eye, 'alert'), or null as built)
function windowOf(state, pid, id, keys, seenMs, roll = null, band = null, expect = null) {
  const targets = targetsAt(state, keys, seenMs);
  const b = band ?? bandN(feltOf(state, pid, seenMs));
  const t = takeInMs(state, pid, { id, targets, seenMs, roll, band: b, ...(expect ? { expect } : {}) });
  return { t, rangeM: targets[0]?.rangeM ?? 0, band: b };
}
// (the player's eyes taken by a flash at ms)
const blindAt = (state, pid, ms) => { const r = blockOf(state, pid); return !!r && Number.isFinite(r.blindUntilMs) && ms < r.blindUntilMs; };

// (the 'contact' fact's payload)
const fact = (phase, pid, rec, extra = {}) => ({ phase, id: rec.id, who: pid, ids: [...rec.ids], seenMs: rec.seenMs, untilMs: rec.untilMs ?? rec.atMs ?? null, ms: rec.ms, expect: rec.expect, n: rec.n,
  grade: rec.grade, parts: rec.parts, ident: rec.ident ?? null, armour: rec.armour ?? null, atMs: extra.atMs ?? rec.atMs ?? rec.seenMs, ...extra });

/** The fast layer 'look', the detector (see the header): lived ticks only. */
export function contactLook(state, input, bus, ctx) {
  // (v0.0.19: the startle's hold on your flow first, every lived tick (bundle.js startleTick; see the header))
  startleTick(state, bus);
  const list = turnersOf(state);
  if (!list.length || state.skip) return;
  const me = playerActor(state);
  if (!me) return;
  const pid = me.who, ms = state.clock.ms;
  // (startled or flash-blind, nothing is taken in: the detector looks again on the first tick after)
  if (startled(state, pid, ms) || blindAt(state, pid, ms)) return;
  // (v0.0.19: the live men seen this tick, remembered (men.js), the drawn eye's man with the cone opened; then the eye spent. The
  // eye's pose at this look kept on the actor, runtime only ($look: the bodies before the stop layer turns the head), so the
  // live gauges' F38 can read the sighting again for itself, never from the detector's own verdict)
  if (list.some(T => T.live)) me.$look = { ms, x: me.x, z: me.z, headRad: me.headRad ?? null, face: me.face ?? null };
  let c0 = contactOf(state), liveK = null;
  const drawnKey = c0?.drawn && drawnOn(c0, c0.drawn.key, ms) ? c0.drawn.key : null;
  for (const T of list) {
    if (!T.live) continue;
    const k = q(seenK(state, me, T, ms, { drawn: T.key === drawnKey }), 1e-6);
    (liveK ??= {})[T.key] = k;
    if (k >= SEEN) { c0 ??= noteContact(state, {}); remember(c0.seenAt ??= {}, T.key, ms); }
  }
  // ("Bang, then go" only: a man identified at a pause and seen now in plain sight is read as he is (see the header))
  if (c0?.last?.state && liveK && laneRec(state)?.bangGo) for (const T of list) {
    const was = c0.last.state[T.key];
    if (was === undefined || !(liveK[T.key] >= SEEN)) continue;
    const now = liveStateOf(state, T, ms);
    if (now && now !== was) c0.last.state[T.key] = now;
  }
  if (c0?.drawn) delete c0.drawn;
  // (a turner turned away is forgotten: its next turn is a fresh sighting; v0.0.19, a live man out of sight MAN_MEMORY_MS too)
  if (c0) for (const key of Object.keys(c0.known)) { const T = list.find(x => x.key === key); if (!T || facingOf(T, ms) < SEEN || (T.live && stale(c0.seenAt?.[key] !== undefined ? c0.seenAt : c0.known, key, ms))) delete c0.known[key]; }
  const fresh = [];
  for (const T of list) {
    if (c0?.known?.[T.key] !== undefined || (T.stoppedAtMs !== null && T.stoppedAtMs !== undefined)) continue;
    const f = facingOf(T, ms);
    if (f < SEEN) continue;
    if ((T.live ? liveK[T.key] : q(seenK(state, me, T, ms, { f }), 1e-6)) < SEEN) continue;
    fresh.push(T.key);
  }
  if (!fresh.length) return;
  const c = noteContact(state, {});
  for (const key of fresh) c.known[key] = ms;
  // (the drawn eye's man taken in 'alert': not where your muzzle was)
  const expect = drawnKey && fresh.includes(drawnKey) ? { [drawnKey]: 'alert' } : null;
  const P = c.pending;
  if (!P) {
    const id = c.n + 1, { t, rangeM, band } = windowOf(state, pid, id, fresh, ms, null, null, expect);
    c.n = id;
    c.pending = { id, ids: fresh, seenMs: ms, untilMs: ms + t.ms, ms: t.ms, expect: t.expect, ...(t.expects && state.mind?.clearing ? { expects: t.expects } : {}), n: t.n, grade: t.grade, roll: t.roll, parts: t.parts, rangeM, whoK: t.whoK,
      armed: armedOf(state, me), goMs: goMs(sheetOf(state, pid)?.os ?? 0), mx: sgn(input?.mx), mz: sgn(input?.mz), run: !!input?.run, ...(band ? { band } : {}) };
    bus?.emit('contact', fact('seen', pid, c.pending));
    return;
  }
  // (a turner of this window turned away and back inside it is known again, not taken in twice)
  const more = fresh.filter(k => !P.ids.includes(k));
  if (!more.length) return;
  const ids = [...P.ids, ...more], { t } = windowOf(state, pid, P.id, ids, P.seenMs, P.roll, P.band ?? 0, expect);
  Object.assign(P, { ids, untilMs: Math.max(P.untilMs, P.seenMs + t.ms), ms: Math.max(P.ms, t.ms), expect: t.expect, ...(t.expects && P.expects ? { expects: { ...t.expects, ...P.expects } } : {}), n: t.n, parts: t.parts, whoK: t.whoK });
  bus?.emit('contact', fact('join', pid, P, { atMs: ms }));
}

// (below rung 2, your entry on your #2's bang (his bang task on the door you are at, burst under BANG_LATE_MS ago,
// you not yet past its threshold) is pre-armed too: the entry follows the bang, and a man seen through the doorway he opened is
// taken in on the move and fought inside (from rung 2 the entry is a bundle row, armed as built). Before, the boot recruit froze
// in the doorway for his take-in; a notice missed on room 1's man (1.45 s, about one lane in three) put his pause past the DI's
// hold and his entry 6.6 to 8.0 s after the bang, and his #2's P-12 (4 ms more on his walk to the front, the bang past a tick)
// re-rolled that notice: team-task's heavy case, 5 of 14 lanes within 3.5 s with it, 12 of 13 without)
function bangEntry(state, me) {
  const t = opOf(state)?.two?.task, bangMs = t?.done?.bang;
  if (!me || t?.kind !== 'bang' || t.st !== 'done' || !Number.isFinite(bangMs) || state.clock.ms - bangMs >= BANG_LATE_MS || rungOf(state, me.who, 'room') >= 2) return false;
  const here = doorNow(state, me.who);
  return !!here?.plan && here.door === t.door && !pastThreshold(here.plan, me.x, me.z);
}
// (0.0.12: pre-armed at the sighting: a bundle's beats running, or a Watch held (see the header); v0.0.20, your entry on his bang)
const armedOf = (state, me) => !!state.stop?.doing?.beats || (!!state.stop?.flow && !state.stop.flow.suspended) || !!me?.watch || bangEntry(state, me);

// (the window's target nearest the muzzle's yaw: the pause's bracket)
function pickOf(state, pid, keys, ms) {
  const m = muzzleOf(state, pid), R = sessionOf(state), all = targetsAt(state, keys, ms);
  // (0.0.12: in a clear with a #2, the men of your own corner first: his are his (the fixer's, after the runtime review: the
  // bracket and "Aim at" went to his man, across his sector, while the DI named yours))
  const slot = (key) => ownerOf(state, R?.turners?.find(T => T.key === key)) ?? 1;
  const own = onHouse(state) && laneRec(state)?.twoPid ? all.filter(t => slot(t.key) === 1) : [];
  const list = own.length ? own : all;
  if (!list.length) return keys[0] ?? null;
  if (!m) return list[0].key;
  let best = null;
  for (const t of list) {
    const off = Math.abs(angleDiff(Math.atan2(t.z - m.oz, t.x - m.ox), m.yawRad));
    if (!best || off < best.off - 1e-9) best = { key: t.key, off };
  }
  return best.key;
}

// (the house's; the rework's R9, 2026-11-13: a new window's pause leaves the bracket on the man you were on when he is still up after your
// rounds, of your corner, facing and in the rifle's frame: the newcomer is taken in and identified as before, but the rifle
// does not leave a man still in the fight for him (doctrine's "until the threat is down"). Before, room 2's no-shoot turning
// as the armoured man took his pair moved the bracket onto the no-shoot, and the line's "On him" was two presses at one stop,
// the aim back onto the armoured man and then his head (F13: 45 stops of 100 tier one lanes))
function keptPick(state, pid, now) {
  const S = state.stop, key = S?.mode === 'stop' ? S.pick : null, T = key ? turnerOf(state, key) : null, R = state.armoury?.range;
  if (!onHouse(state)) return null;
  if (!T || (laneRec(state)?.twoPid && (ownerOf(state, T) ?? 1) !== 1) || !stillUp(state, key) || facingOf(T, now) < SEEN || !targetOf(state, key, pid)) return null;
  return key;
}

// (the house's (the other scenes keep their pinned brackets); the rework's R9, 2026-11-13: the bracket at the pause goes onto a man of the window your look identified armed (a rifle, a
// pistol), the one nearest the muzzle, when it fell on one not seen armed: the rifle goes to the threat it has just seen, as a
// trained man's does (the identification is the player's to read on the panel at the same pause). Before, room 2's window of
// the armoured man and the no-shoot bracketed the no-shoot when nearer the muzzle, and the line's "On him" cost an aim step,
// a second stop and the par: the Raider and the tier one each missed it once in 100 lanes, F10, F13)
function armedPick(state, pid, now) {
  const S = state.stop, c = contactOf(state), last = c?.last, R = state.armoury?.range;
  if (!onHouse(state) || !S || S.mode !== 'stop' || !last || last.pick !== S.pick) return;
  const armed = (k) => last.ident?.[k] === 'rifle' || last.ident?.[k] === 'pistol';
  if (armed(S.pick) || stillUp(state, S.pick)) return;
  const own = (k) => !(onHouse(state) && laneRec(state)?.twoPid) || (ownerOf(state, turnerOf(state, k)) ?? 1) === 1;
  const keys = last.ids.filter(k => armed(k) && own(k) && targetOf(state, k, pid));
  if (!keys.length) return;
  const key = pickOf(state, pid, keys, now);
  S.pick = key; last.pick = key;
}

// (a chained wait cut at the pause, as any step chosen cuts it)
function cutWait(state, bus) {
  const S = state.stop, d = S?.doing;
  if (!d || d.kind !== 'wait') return;
  bus?.emit('step', { phase: 'cut', who: d.who, step: d.step, i: d.i, action: d.list?.[d.i] ?? null, fromMs: d.subFromMs ?? d.fromMs, toMs: d.untilMs, ok: true, grade: null, routine: null, mishap: null, text: 'cut' });
  S.doing = null; S.phase = 'choose';
}

/** The pause (see the header): the window closed, stop motion with the contact, the identification, the log. */
function pause(state, bus, c) {
  const P = c.pending, pid = playerId(state), now = state.clock.ms;
  const pick = keptPick(state, pid, now) ?? pickOf(state, pid, P.ids, now);
  // (a startle that landed inside the window held the pause to its end (contactInput): the time it added is part of the
  // take-in the stamp, J and the paper report, named, so "Contact · 1.50 s" is the sighting to the pause (the code review of
  // v0.0.9: it said the planned 0.55 s); nothing moves without a startle past the window's end)
  const B = blockOf(state, pid), late = Number.isFinite(B?.startleUntilMs) ? Math.max(0, Math.min(now, B.startleUntilMs) - P.untilMs) : 0;
  const ms = P.ms + late, parts = late ? [...(P.parts ?? []), { why: 'startled', ms: late }] : P.parts;
  const last = { id: P.id, ids: [...P.ids], seenMs: P.seenMs, atMs: now, ms, expect: P.expect, ...(P.expects ? { expects: { ...P.expects } } : {}), n: P.n, grade: P.grade, parts, pick, ident: {}, armour: {}, words: takeInText({ ...P, ms, parts }) };
  noteContact(state, { pending: null, last });
  const S = state.stop;
  if (S?.mode === 'stop') {
    cutWait(state, bus);
    S.pick = pick; S.via = 'contact';
    holdTime(state, 'stop');
  } else {
    const r = enterStop(state, bus, { pid, via: 'contact', pick, contact: { id: P.id, ms } });
    if (r?.ok && state.stop?.mode === 'stop') { state.stop.pick = pick; state.stop.via = 'contact'; }
  }
  // (0.0.12: a Watch held puts the muzzle on its spot at the pause (see the header))
  const me = playerActor(state);
  if (me?.watch && state.stop?.mode === 'stop') me.headRad = q(Math.atan2(me.watch.z - me.z, me.watch.x - me.x), 1e-6);
  if (me?.watch) delete me.watch;
  for (const key of last.ids) identify(state, pid, key, { atMs: now });
  armedPick(state, pid, now);
  const seen = last.ids.map(k => `${targetName(state, k)}: ${identWords(last, k)}`).join('; ');
  logEntry(state, bus, { kind: 'contact', tone: 'warn', text: `Contact · ${takeInWords(last.ms)} s. ${last.words} ${seen.charAt(0).toUpperCase()}${seen.slice(1)}.`, contact: last.id });
  bus?.emit('contact', fact('pause', pid, last));
  if (!byOrder(state, bus, last)) noShootOn(state, bus, last);
}

// ---- a no-shoot taken in on the move (v0.0.19, the live lane; the review of track L, F12) ----

/** The identifications that read a man who must not be shot: empty hands, a phone (cqb.js's NOSHOOT, the DI's "Hands. No weapon."). */
export const NOSHOOT_IDS = Object.freeze(new Set(['hands', 'phone']));
/**
 * On the live lane (R.house.live), from rung 2, at the pause: a window whose men are all identified no-shoots and facing, with
 * the flow suspended ('contact', or 'decision' after a shot row inside it) and nobody else of their room known to you up and not a no-shoot, goes on at once: the
 * suspended flow is taken up (bundle.js carryOn, as "Carry on" would), the log "No shot: hands empty, carrying on.", no stop.
 * Before, the pause stopped on the DI's "No shot. Carry on." right after the shot row that put the room's man down (F12: the
 * corporal on 1489397426, room 2, 2a down and 2b's phone 0.85 s after). The turner lane keeps its pause and its line as
 * built (the house pin), the question of the same rule there the user's. Returns whether the flow went on.
 */
export function noShootOn(state, bus, last) {
  const R = sessionOf(state), H = R?.house, S = state.stop, pid = playerId(state), now = state.clock.ms, c = contactOf(state);
  if (!onHouse(state) || !H?.live || !S || S.mode !== 'stop' || S.reflex || S.doing || rungOf(state, pid, 'room') < SUSPEND_RUNG) return false;
  const F = flowOn(state);
  if (!F || F.who !== pid || (F.suspended?.why !== 'contact' && F.suspended?.why !== 'decision') || !last?.ids?.length) return false;
  const rooms = new Set();
  for (const key of last.ids) {
    const T = turnerOf(state, key);
    if (!T || !NOSHOOT_IDS.has(last.ident?.[key]) || facingOf(T, now) < 0.5) return false;
    rooms.add(T.room);
  }
  // (what you know of the room's other men: your latest identification of each in the room's record (the house's leg contacts),
  // a man known, up and not read a no-shoot keeps the pause)
  const legs = [...(H.rooms ?? []), H.hall].filter(Boolean);
  const identOf = (T) => legs.find(V => V.room === T.room)?.contacts?.filter(x => x.key === T.key && x.by === 'me' && x.ident).at(-1)?.ident ?? null;
  const up = (R.turners ?? []).some(T => rooms.has(T.room) && !last.ids.includes(T.key) && c?.known?.[T.key] !== undefined && upNow(T, now) && !NOSHOOT_IDS.has(identOf(T)));
  if (up) return false;
  const r = carryOn(state, bus, pid);
  if (!r?.ok) return false;
  const words = last.ids.map(k => IDENT_WORDS[last.ident[k]] ?? last.ident[k]).join(', ');
  logEntry(state, bus, { kind: 'note', tone: 'note', text: `No shot: ${words}, carrying on.`, contact: last.id });
  return true;
}

// ---- the standing order (COMBAT §25.19.4; question 1's default: built, offered from rung 4, off) ----

/** The order's rung and its reach: nobody else standing within ORDER_ALONE_M of the man; the hammer within ORDER_HAMMER_M. */
export const ORDER_RUNG = 4, ORDER_ALONE_M = 1, ORDER_HAMMER_M = 7;
/**
 * "Engage: armed, my sector" (the house's record, R.house.order.engage 'armed'; bundle.js setVariant): at the pause, when
 * every man of the contact is in your sector, identified with a rifle or a pistol, facing, and nobody else stands within
 * ORDER_ALONE_M of him, the drill's doctrinal row is chosen at once, moving on (the failure drill where armour was seen, the
 * hammer within ORDER_HAMMER_M, else the pair): the pause has no time in it and the log says "By your order: pair, moving
 * on". A failed identification never shows a weapon, so a no-shoot, the hostage and a man unseen still pause. Returns
 * whether it fired.
 */
export function byOrder(state, bus, last) {
  const R = sessionOf(state), H = R?.house, S = state.stop, pid = playerId(state), now = state.clock.ms;
  if (!onHouse(state) || H?.order?.engage !== 'armed' || !S || S.mode !== 'stop' || S.reflex || rungOf(state, pid, 'room') < ORDER_RUNG) return false;
  const mine = (T) => !H.twoPid || (ownerOf(state, T) ?? 1) === 1;
  for (const key of last.ids) {
    const T = turnerOf(state, key), id = last.ident?.[key];
    if (!T || !mine(T) || (id !== 'rifle' && id !== 'pistol') || facingOf(T, now) < SEEN) return false;
    const crowd = (R.turners ?? []).some(o => o.key !== key && (o.stoppedAtMs === null || o.stoppedAtMs === undefined) && facingOf(o, now) >= SEEN && Math.hypot(o.x - T.x, o.z - T.z) <= ORDER_ALONE_M);
    if (crowd) return false;
  }
  const key = S.pick, T = turnerOf(state, key), me = playerActor(state);
  if (!T || !me) return false;
  const dM = Math.hypot(T.x - me.x, T.z - me.z), want = last.armour?.[key] ? ['failure', 'hammer', 'pair'] : dM <= ORDER_HAMMER_M ? ['hammer', 'pair'] : ['pair'];
  const v0 = S.variant ? { ...S.variant } : null;
  S.variant = { ...(S.variant ?? {}), feet: 'moving' };
  const rows = stepsOf(state, now).filter(r => r.kind === 'shot' && !r.off && (r.target ?? key) === key);
  const row = want.map(w => rows.find(r => r.id.split('@')[0] === `shot:${w}`)).find(Boolean);
  const r = row ? chooseStep(state, bus, { step: row.id, target: key }) : null;
  if (!r?.ok) { if (v0) S.variant = v0; else delete S.variant; return false; }
  logEntry(state, bus, { kind: 'note', tone: 'note', text: `By your order: ${row.label.toLowerCase().replace(/[,:].*$/, '')}, moving on.`, contact: last.id });
  return true;
}

/** The fast layer 'input' (runs while time stands still): the window's end, the pause on its tick (see the header). */
export function contactInput(state, input, bus, ctx) {
  const c = contactOf(state);
  // (the #2's men left to him, re-tested every tick: one crossing into your muzzle's cone, or the #2 no longer up with you,
  // and the pause comes after all (COMBAT §25.19.4))
  if (c?.his && !c.pending && !state.skip) hisTick(state, c);
  const P = c?.pending;
  if (!P || state.skip) return;
  // (v0.0.19: the live lane's casualty beat (men.js casualtyOn): the stack is out of the fight, a window closes with no pause)
  if (casualtyOn(state)) { noteContact(state, { pending: null }); return; }
  // (startled: the pause waits for its end (supp.js suppInput lets a stop hold go while it lasts))
  if (startled(state, playerId(state), state.clock.ms)) return;
  // (0.0.10: a Breathe running is cut at its sub-step's end from the sighting on, as a startle cuts it: nobody breathes on
  // through a man seen)
  const b = state.stop?.doing;
  if (b && b.kind === 'breathe' && b.i + 1 < b.list.length) b.cut = true;
  // (and "Search him", at its part's end: a man seen is a cue, the search offered again after it (see the header))
  if (b && b.list?.[b.i] === 'contact:search' && b.i + 1 < b.list.length) b.cut = true;
  if (state.clock.ms < P.untilMs) {
    // (time held inside the window would freeze the game on a person not yet taken in, every action refused: a stop-motion
    // step that ended here lets the clock run on, the body idle (COMBAT §25.4.5); any other hold (a reflex card) ends the
    // window at once, the choice being asked anyway)
    if (!isHeld(state)) return;
    const S = state.stop;
    if (S?.mode === 'stop' && !S.doing && !S.reflex && state.clock.holds.every(h => h === 'stop')) { releaseTime(state, 'stop'); return; }
  }
  // (every man of the window your #2's, he up and with you, none in your muzzle's cone: no pause, the window closed as his
  // (COMBAT §25.19.4: "His. Taken in 0.05 s."), your bundle going on)
  if (hisOnly(state, P)) { leaveHis(state, bus, c); return; }
  // (a step still running: its boundary taken now if due, and the pause at its end; a command (a macro) finishes the
  // sub-step under way and halts there, its rest queued as "Carry on" (COMBAT §25.4.5: never cut mid-sub-step))
  let d = state.stop?.doing;
  // (0.0.12: a bundle handed back at the window's end: its moves and scans cut where they stand, the rest let end (see the header))
  // (2026-11-12, R3: from rung 2 suspended instead, the feet not cut (see the header))
  if (d?.beats && !d.halt && !d.suspendAsk && !d.suspended) {
    if ((d.rung ?? rungOf(state, playerId(state), 'room')) >= SUSPEND_RUNG) suspendFlow(state, bus, d, 'contact', state.clock.ms, targetsAt(state, P.ids, state.clock.ms).map(t => [t.x, t.z]));
    else haltDoing(state, bus, d, 'contact', null, state.clock.ms);
  }
  if (d && d.kind === 'command' && state.stop.mode === 'stop' && d.i + 1 < d.list.length) d.halt = true;
  if (d && d.kind !== 'wait') {
    if (d.beats || state.clock.ms >= d.untilMs) stopInput(state, input, bus, ctx);
    d = state.stop?.doing;
    if (d && d.kind !== 'wait') return;
  }
  pause(state, bus, c);
}

// ---- the #2's sector (COMBAT §25.19.4) ----

// (the house's #2 up, his rifle working and with you: on his stack, in its doorway, inside the room, a slot's doing under way
// or on a man. The rework's R9 (2026-11-13): the doorway too, so the tick between his entry's beats (no doing, his feet in the
// door between the stack's 1.5 m and the threshold) is no longer "not with you": room 1's no-shoot watched as his paused the
// tier one there at 5.1 s on half the seeds, a stop the design's lane does not have (COMBAT §25.19.4, F13))
function twoWithYou(state) {
  const R = sessionOf(state), H = R?.house;
  if (!onHouse(state) || !H?.twoPid || !H.two?.pid) return false;
  // (his rifle as you could know it: down only once he has said "Gun down!" (H.two.down), never its working parts, which
  // you cannot see (the reach review of 2026-11-13))
  const a = state.actors?.list?.find(x => x.who === H.twoPid), gunId = state.people?.[H.twoPid]?.kit?.worn?.sling, gun = gunId ? state.items?.[gunId] : null;
  if (!a || !gun || H.two.down) return false;
  // (on his way in or on a man (his take-in, his row: the scene halts his slot for them))
  if (H.two.doing?.beats || H.two.contact || H.two.eng) return true;
  const L = (H.rooms ?? []).find(r => r.state !== 'clear' && r.state !== 'passed');
  if (!L?.door) return false;
  let plan = null;
  try { plan = roomPlanOf(state, L.door); } catch { plan = null; }
  if (!plan) return false;
  const st = plan.stack?.[1] ?? plan.stack?.[0];
  return pastThreshold(plan, a.x, a.z) || inFunnel(plan, a.x, a.z) || (!!st && Math.hypot(a.x - st[0], a.z - st[1]) <= TWO_NEAR_M);
}
/** The #2 within this of his stack counts as on it for the sector rule (m; bundle.js TWO_SLOT_M's figure). */
export const TWO_NEAR_M = 1.5;
// (whether a man stands within HIS_CONE_DEG of your muzzle's yaw)
function inMyCone(state, T) {
  const m = muzzleOf(state, playerId(state));
  if (!m) return false;
  return Math.abs(angleDiff(Math.atan2(T.z - m.oz, T.x - m.ox), m.yawRad)) <= HIS_CONE_DEG * Math.PI / 180;
}
/** Whether every man of a window is the #2's to take (see the header's 2026-11-12 note): his sector's, he up and with you, none in your muzzle's cone. */
export function hisOnly(state, P) {
  if (!P?.ids?.length || !twoWithYou(state)) return false;
  for (const key of P.ids) {
    const T = turnerOf(state, key);
    // (his sector by where the man stands now, never his stand's label (room.js manPlace; the reach review of 2026-11-13)), the
    // side's role at the door of the room he stands in (team.js roleAt: the side kept apart from the role)
    if (!T) return false;
    const at = manPlace(state, T);
    if (roleAt(state, doorOfRoom(at.room), at.slot) !== 2 || inMyCone(state, T) || !twoOn(state, T)) return false;
  }
  return true;
}
// (your #2 actually on the man: his take-in or his row on him, the man known to him, his feet on his way in, or the man in
// his sight (his eyes' vis times the man's facing at SEEN): never a man he cannot see, standing on his stack (the reach review of 2026-11-13: a window of his sector's men
// closed with no pause with him 1.5 m outside the door))
function twoOn(state, T) {
  const W = opOf(state)?.two, a = W?.pid ? state.actors?.list?.find(x => x.who === W.pid) : null;
  if (!W || !a) return false;
  if (W.contact?.key === T.key || W.eng?.key === T.key || W.known?.[T.key] !== undefined) return true;
  // (on his way in, his feet moving on his entry: the man comes into his eyes in his stride, his take-in on the move (R6))
  if (W.doing?.beats?.some(b => b.st === 'run' && b.k === 'move')) return true;
  // (the sight through combat/men.js seenK, raw as it always was here: a stand's to the bit, a live man's by his exposure)
  const ms = state.clock.ms, f = facingOf(T, ms);
  return f >= SEEN && seenK(state, a, T, ms, { f, drawn: !!T.live && drawnOn(W, T.key, ms) }) >= SEEN;
}
// (the window closed as the #2's: no pause, his men watched (c.his) until down or turned away; the log and the fact)
function leaveHis(state, bus, c) {
  const P = c.pending, pid = playerId(state), now = state.clock.ms;
  noteContact(state, { pending: null, his: { ...P, atMs: now } });
  const names = P.ids.map(k => targetName(state, k)).join(', ');
  logEntry(state, bus, { kind: 'contact', tone: 'note', text: `His. Taken in ${takeInWords(P.ms)} s: ${names}, your number two's.`, contact: P.id });
  bus?.emit('contact', fact('his', pid, P, { atMs: now }));
}
// (the #2's men watched: dropped when down or turned away; the pause after all when the #2 is no longer up with you, on this
// tick, as a window's end)
function hisTick(state, c) {
  const H = c.his, now = state.clock.ms;
  // (a man of a room called clear is no longer watched: the room's "Clear!" waits on the #2's sector (bundle.js), so his men
  // there are dealt with (R9: a no-shoot of his still facing paused you as he left the room for the next stack))
  // (the room by where the man stands now (room.js manPlace), never his stand's label: a man who moved back into a room is its)
  const legs = opOf(state)?.rooms ?? [], cleared = (T) => { const room = manPlace(state, T).room; return legs.some(L => L.room === room && (L.state === 'clear' || L.state === 'passed')); };
  const up = H.ids.filter(k => { const T = turnerOf(state, k); return T && (T.stoppedAtMs === null || T.stoppedAtMs === undefined) && facingOf(T, now) >= SEEN && !cleared(T); });
  if (!up.length) { delete c.his; return; }
  // (the men stand where they stand, so only the #2 can change: a muzzle sweeping your own sector across his man's edge is no
  // crossing (my call: re-tested on the cone, room 1's no-shoot paused the tier one mid-sweep on every seed))
  if (twoWithYou(state)) return;
  const { atMs, ...P } = H;
  delete c.his;
  c.pending = { ...P, ids: up, untilMs: now, his: true };
}

// (a target's name in the log's words)
const targetName = (state, key) => { const T = turnerOf(state, key); return T ? T.name ?? `lane ${T.lane}` : key; };
// (what was seen of a target, in words)
const identWords = (last, key) => `${IDENT_WORDS[last.ident?.[key] ?? 'unseen']}${last.armour?.[key] ? ', plate armour' : ''}`;

/**
 * A man your #2 called out to you (the build sheet v0.0.20 item 18; drill.md D5): the one write of your mind's told record,
 * state.mind.contact.told[key] = { atMs, bearingRad (from you as he called), face (what he identified, or null), at: [x, z] (the
 * place he named, as he saw it) }, read by react.js expectOf, which takes a man within corner.js TOLD_DEG of the place inside TOLD_MS
 * as expected ('sector'). Called from combat/two.js twoTick only; identify is not touched. Holds no id (ids-check). Returns the record.
 */
export function tell(state, pid, key, { atMs = state.clock.ms, bearingRad, face = null, at = null } = {}) {
  if (!state.mind || pid !== playerActor(state)?.who) return null;
  // (the contact record as the people domain makes it (mind.js noteContact): a bare one lacked `known`, and contactLook read it)
  const c = contactOf(state) ?? noteContact(state, {}), rec = { atMs, bearingRad: q(bearingRad ?? 0, 1e-6), face: face ?? null, ...(at ? { at: [q(at[0], 0.01), q(at[1], 0.01)] } : {}) };
  (c.told ??= {})[key] = rec;
  return rec;
}

/**
 * The identification of one target of the last contact (see the header): Awareness against IDENT_DC0 +
 * round(range / IDENT_PER_M) (+IDENT_DARK in the dark) − bonus. Writes last.ident[key] (and last.armour[key] on
 * an armoured face seen); a failed look never takes away what an earlier one saw. Returns { ident, armour, roll }.
 */
export function identify(state, pid, key, { bonus = 0, atMs = state.clock.ms } = {}) {
  const L = contactOf(state)?.last, T = turnerOf(state, key), me = playerActor(state);
  if (!L || !T) return null;
  const rangeM = Math.hypot(T.x - (me?.x ?? 0), T.z - (me?.z ?? 0)), roller = rollerOf(state, pid, { ms: atMs });
  const dark = roller.light < DARK_BELOW;
  const dcParts = [{ why: 'base', v: IDENT_DC0 }, { why: `${Math.round(rangeM)} m`, v: Math.round(rangeM / IDENT_PER_M) }];
  if (dark) dcParts.push({ why: 'in the dark', v: IDENT_DARK });
  if (bonus) dcParts.push({ why: 'challenged', v: -bonus });
  const parts = dcParts.filter(p => p.v), dc = parts.reduce((a, p) => a + p.v, 0);
  const roll = check(stream(state.meta.seed, 'combat:ident', pid, L.id, key, atMs), { skill: 'awareness', value: roller.value('awareness'), dc, mods: roller.mods('awareness', { ms: atMs }),
    pressure: 'evaluated', by: pid, dcParts: parts, verb: null });
  const before = L.ident[key];
  const ident = roll.ok ? T.holds : before && before !== 'unseen' ? before : 'unseen';
  const armour = (roll.ok && T.face === 'armoured') || !!L.armour[key];
  L.ident[key] = ident;
  if (armour) L.armour[key] = true;
  // (v0.0.19: a live man's state, what he is doing, on a passed roll only: a failed look leaves "can't tell")
  // (men.js liveStateOf, so a shocked man reads 'dazed')
  if (T.live && roll.ok) (L.state ??= {})[key] = liveStateOf(state, T, atMs) ?? 'looking';
  return { ident, armour, roll };
}

/**
 * A second look at a man still up and facing in your room whom the last pause did not take in (bundle.js, at a "Clear!"
 * suspended on him: COMBAT §25.19.4, never a dead end): he was taken in at an earlier pause of the room, so no take-in, but
 * the last contact becomes his (a new id, so his identification is rolled afresh) and the pause's rows are his (the
 * challenge, the shots). Returns the last contact, or null while a window is open.
 */
export function relook(state, bus, key, ms = state.clock.ms) {
  const c = noteContact(state, {}), pid = playerId(state);
  if (c.pending) return null;
  if (c.last?.ids?.includes(key)) return c.last;
  const id = c.n + 1;
  c.n = id;
  const last = { id, ids: [key], seenMs: ms, atMs: ms, ms: 0, expect: null, n: 1, grade: null, parts: [], pick: key, ident: {}, armour: {}, words: 'Still up.' };
  noteContact(state, { last });
  c.known[key] ??= ms;
  identify(state, pid, key, { atMs: ms });
  logEntry(state, bus, { kind: 'contact', tone: 'warn', text: `Still up: ${targetName(state, key)}: ${identWords(last, key)}.`, contact: id });
  bus?.emit('contact', fact('pause', pid, last));
  return last;
}

/**
 * The contact's rows on the bracketed target (see the header), the step panel's shape: { id, kind: 'contact', label,
 * ms, rushMs, carefulMs, odds, routine, off, subs: [{ id, label, ms }], list: [id], cmd, skill, target, lead }.
 */
export function contactRows(state, pid = playerId(state), ms = state.clock.ms) {
  const S = state.stop, L = contactOf(state)?.last;
  if (!S || S.mode !== 'stop') return [];
  // (the live men's rows that need no pause of their own: Challenge on a man seen cowering, Search him (see the header))
  const own = liveRows(state, pid, ms);
  if (!L || !S.pick || !L.ids.includes(S.pick)) return own;
  const key = S.pick, T = turnerTargets(state, ms).find(t => t.key === key);
  // (v0.0.19: a live man down is still armed: his rows stay, Hold him as "Cover him", leading)
  if (!T || T.facingK < SEEN || (T.down && !T.live)) return own;
  const id = L.ident[key] ?? 'unseen', cover = !!T.live && T.down, lead = id === 'hands' || id === 'phone' || cover;
  const tgt = targetOf(state, key, pid) ?? { ...T, dM: Math.hypot(T.x - (playerActor(state)?.x ?? 0), T.z - (playerActor(state)?.z ?? 0)) };
  const aimed = S.aim?.key === key;
  const aimMs = aimed ? 0 : aimMsOf(state, pid, S.gun, tgt);
  const rate = HELD_RATE0 + rollerOf(state, pid, { ms }).value('marksmanship') / 10;
  const holdMs = aimed ? (heldOf(state, pid, ms, key).toFullMs ?? 0) : Math.ceil(HELD_MAX / rate * 1000);
  const row = (rid, ms0, subs, o = {}) => ({ id: rid, kind: 'contact', label: CONTACT_LABELS[rid], ms: ms0, rushMs: null, carefulMs: null, odds: null, routine: null, off: null,
    subs, list: subs.map(s => s.id), cmd: false, skill: null, target: key, lead, ...o });
  // (held already, the aim at its full on him: struck 'held', no longer leading, so the next decision leads (the design
  // review of v0.0.8: pressed again it took 0 ms and did nothing, a dead button at the head of the panel))
  const held = aimed && heldOf(state, pid, ms, key).v >= HELD_MAX;
  const out = [row('contact:hold', aimMs + holdMs, [...(aimed ? [] : [{ id: 'aim', label: 'Aim', ms: aimMs }]), { id: 'hold', label: 'Hold the aim', ms: holdMs }], { skill: 'marksmanship', ...(cover ? { label: COVER_LABEL } : {}), ...(held ? { off: 'held', lead: false } : {}) })];
  if (id === 'unseen' || id === 'hands' || id === 'phone' || cowering(state, key, L, ms)) out.push(row('contact:challenge', CHALLENGE_MS, [{ id: 'contact:challenge', label: CONTACT_LABELS['contact:challenge'], ms: CHALLENGE_MS }], { words: CHALLENGE_SAY }));
  return [...out, ...own.filter(r => !out.some(o => o.id === r.id))];
}
// (a man read cowering at the last pause, or a live man up whom you see cowering now (his body at SEEN from your eye))
function cowering(state, key, L, ms) {
  if (L?.state?.[key] === 'cowering') return true;
  const T = turnerOf(state, key), me = playerActor(state);
  return !!T?.live && liveStateOf(state, T, ms) === 'cowering' && !!me && seenK(state, me, T, ms) >= SEEN;
}
// (a contact row of the live men's: the step panel's shape, as contactRows' own)
const liveRow = (rid, label, ms0, key, o = {}) => ({ id: rid, kind: 'contact', label, ms: ms0, rushMs: null, carefulMs: null, odds: null, routine: null, off: null,
  subs: [{ id: rid, label, ms: ms0 }], list: [rid], cmd: false, skill: null, target: key, lead: false, ...o });
// (the rows on the bracketed live man, or the man in reach, that no pause has to give: Challenge on a man seen cowering, the bracket
// on him though the last contact was another's; Search him on "Bang, then go" (see the header))
function liveRows(state, pid, ms) {
  const S = state.stop, out = [];
  const P = S?.pick ? turnerOf(state, S.pick) : null;
  if (P?.live && cowering(state, P.key, null, ms)) out.push(liveRow('contact:challenge', CONTACT_LABELS['contact:challenge'], CHALLENGE_MS, P.key, { words: CHALLENGE_SAY, lead: true }));
  const T = searchableOf(state, pid, ms)[0];
  if (T) {
    const part = { id: 'contact:search', label: SEARCH_LABEL, ms: SEARCH_MS / SEARCH_PARTS }, subs = Array.from({ length: SEARCH_PARTS }, () => ({ ...part }));
    out.push(liveRow('contact:search', SEARCH_LABEL, SEARCH_MS, T.key, { subs, list: subs.map(x => x.id) }));
  } else {
    // (none in reach: the walk to the nearest, a house move row (bundle.js startSingle's), then the search's own row there)
    const W = searchWalkOf(state, pid, ms);
    if (W) out.push(liveRow('move:search', SEARCH_WALK_LABEL, W.ms, W.key, { kind: 'move', to: W.to, subs: [], list: [] }));
  }
  return out;
}
/**
 * The walk up to the man a marine would search (v0.0.26; see the header): the nearest searchable at any reach, none within SEARCH_M;
 * { key, to: [x, z] SEARCH_WALK_M short of him on the line from the marine, ms the walk's at Combat (bundle.js legsOf, its routed way) }
 * or null.
 */
export function searchWalkOf(state, pid = playerId(state), ms = state.clock.ms) {
  if (searchableOf(state, pid, ms).length) return null;
  const T = searchableOf(state, pid, ms, { reach: false })[0], me = pid === playerId(state) ? playerActor(state) : state.actors?.list?.find(a => a.who === pid) ?? null;
  const a = T ? state.actors?.list?.find(x => x.who === T.live.who) : null;
  if (!T || !me || !a) return null;
  const d = Math.hypot(me.x - a.x, me.z - a.z), k = SEARCH_WALK_M / d, to = [q(a.x + (me.x - a.x) * k, 0.01), q(a.z + (me.z - a.z) * k, 0.01)];
  const legs = legsOf(state, pid), P = profileOf(pathLen(wayOf(state, [[me.x, me.z], to])), legs.walk.combat, legs.pushMs2, legs.brakeMs2);
  return { key: T.key, to, ms: Math.round(P.T * 1000) };
}
/**
 * The live men a marine may search now (v0.0.26; see the header), nearest first: on "Bang, then go"'s lane, accounted for at his room's
 * "Clear!" (ruled out 'clear' or 'passed' when down or with his hands up, else men.js accountedOf 'down' or 'hands' with his leg
 * clear), not yet searched, within SEARCH_M of the marine (reach false: any distance). Returns turner records.
 */
export function searchableOf(state, pid = playerId(state), ms = state.clock.ms, { reach = true } = {}) {
  const H = laneRec(state);
  // (never once the lane has ended: a man ruled out at "Clear!" keeps st 'out', and "To him, to search" stayed offered through SHOW CLEAR
  // and the wash (the code review of v0.0.26, finding 1))
  if (!H?.bangGo || !H.live || H.end) return [];
  const me = pid === playerId(state) ? playerActor(state) : state.actors?.list?.find(a => a.who === pid) ?? null;
  if (!me) return [];
  const out = [];
  for (const T of turnersOf(state)) {
    const L = T.live;
    if (!L || L.searched) continue;
    const a = state.actors?.list?.find(x => x.who === L.who), dM = a ? Math.hypot(a.x - me.x, a.z - me.z) : Infinity;
    if (reach && !(dM <= SEARCH_M)) continue;
    const was = L.st === 'out' ? (H.live.ruled ?? []).find(r => r.key === T.key)?.was ?? null : null;
    const ok = L.st === 'out' ? (L.outWhy === 'clear' || L.outWhy === 'passed') && (was === 'down' || was === 'hands')
      : (accountedOf(state, T, ms) === 'down' || accountedOf(state, T, ms) === 'hands') && (H.rooms ?? []).some(R => R.room === T.room && R.state === 'clear');
    if (ok) out.push({ T, dM });
  }
  return out.sort((x, y) => x.dM - y.dM || x.T.key.localeCompare(y.T.key)).map(x => x.T);
}
/**
 * The phase a live man's hit card is drawn in (v0.0.26; COMBAT §7.7, VIEWS §7.7): 'truth' once he is searched (T.live.searched) or the
 * lane is over (the range's end, the hot wash's truth), else 'belief'; a stand's card the lane's end alone. The one reader for the
 * card (ui/hud/target.js passes it to marks.js hitMarks) and the tests.
 */
export function cardPhaseOf(state, key) {
  const R = state.armoury?.range ?? null, T = turnerOf(state, key);
  return R?.end || T?.live?.searched ? 'truth' : 'belief';
}
/** Whether a search is running now (v0.0.26; see the header): the stop's doing on its 'contact:search' sub, not yet at its end. Returns its target's key or null. */
export function searchOn(state, ms = state.clock.ms) {
  const d = state.stop?.doing;
  // (its walk: the house's move under way, the man it walks to the nearest still searchable)
  if (d?.step === 'move:search') return searchableOf(state, d.who ?? playerId(state), ms, { reach: false })[0]?.key ?? null;
  if (!d || d.list?.[d.i] !== 'contact:search' || (Number.isFinite(d.untilMs) && ms >= d.untilMs)) return null;
  return d.target ?? state.stop?.pick ?? null;
}

/** A contact sub-step at its start (shooting.js runSub): the challenge said; v0.0.26, the search begun (see the header). Returns { ms, text }. */
export function runContactSub(state, bus, d, id, atMs) {
  if (id === 'contact:search') {
    const H = laneRec(state), key = d?.target ?? state.stop?.pick ?? null;
    if (H?.bangGo && key && !(d?.i > 0)) H.bangGo.search = { key, fromMs: atMs, untilMs: atMs + SEARCH_MS };
    return { ms: SEARCH_MS / SEARCH_PARTS, text: SEARCH_LABEL };
  }
  if (id !== 'contact:challenge') return { ms: 0, text: null };
  bus?.emit('say', { who: d?.who ?? playerId(state), text: CHALLENGE_SAY, kind: 'speech', durMs: CHALLENGE_MS });
  return { ms: CHALLENGE_MS, text: CHALLENGE_SAY };
}

/** A contact sub-step at its end (shooting.js endSub): after the challenge, a fresh identification at +CHALLENGE_BONUS, and the line says what you now see; v0.0.26, the search done (see the header). */
export function endContactSub(state, bus, d, id) {
  if (id === 'contact:search') {
    const H = laneRec(state), key = d?.target ?? state.stop?.pick ?? null, T = key ? turnerOf(state, key) : null, now = state.clock.ms;
    // (only the last part's end searches him: a search cut at an earlier part's end leaves him as he was)
    if (!T?.live || T.live.searched || (d && d.i + 1 < (d.list?.length ?? 1))) return null;
    T.live.searched = { by: d?.who ?? playerId(state), atMs: now };
    if (H?.bangGo) H.bangGo.search = null;
    bus?.emit('house', { phase: 'rp', kind: 'searched', key, stand: T.stand, who: T.live.who, atMs: now });
    return T.live.searched;
  }
  if (id !== 'contact:challenge') return null;
  const pid = d?.who ?? playerId(state), key = d?.target ?? state.stop?.pick, L = contactOf(state)?.last;
  if (!key || !L?.ids.includes(key)) return null;
  const r = identify(state, pid, key, { bonus: CHALLENGE_BONUS, atMs: state.clock.ms });
  if (!r) return null;
  const text = r.ident === 'unseen' ? "Still can't see his hands." : r.ident === 'hands' ? 'Hands. No weapon.' : r.ident === 'phone' ? 'A phone. No weapon.' : `${IDENT_WORDS[r.ident].charAt(0).toUpperCase()}${IDENT_WORDS[r.ident].slice(1)}!`;
  bus?.emit('line', { text, kind: r.ident === 'rifle' || r.ident === 'pistol' ? 'warn' : 'note' });
  logEntry(state, bus, { kind: 'contact', tone: 'note', text: `${targetName(state, key)}, challenged: ${identWords(L, key)}.`, roll: r.roll, contact: L.id });
  bus?.emit('contact', fact('ident', pid, L, { atMs: state.clock.ms }));
  return r;
}

/**
 * Whether the pause's contact is still live at ms: one of the targets taken in faces (SEEN) and stands, or (v0.0.19) is a live man down and not covered. The panel's
 * order reads it (shooting.js stepsOf: the contact's rows first, the commands that are no answer to him after).
 */
export function contactLive(state, ms = state.clock.ms) {
  const L = contactOf(state)?.last;
  if (!L?.ids?.length) return false;
  // (up and facing through combat/men.js upNow: a stand's as built; v0.0.19, a live man down and not yet covered too: he is still armed)
  return L.ids.some(k => { const T = turnerOf(state, k); return upNow(T, ms) || (!!T?.live && gateWhy(state, T, ms) === 'down'); });
}

/** Whether there is a lull (see the header) at ms. */
export function lullOf(state, pid = playerId(state), ms = state.clock.ms) {
  const c = contactOf(state);
  if (c?.pending) return false;
  const list = turnersOf(state);
  let latest = -Infinity;
  for (const T of list) {
    if (threatFace(T.face) && upNow(T, ms)) return false;
    const e = edgeOnMs(T);
    if (e !== null && e <= ms) latest = Math.max(latest, e);
  }
  for (const s of state.armoury?.range?.shots ?? []) if ((s.who ?? pid) === pid && s.atMs <= ms) latest = Math.max(latest, s.atMs);
  if (c?.last) latest = Math.max(latest, c.last.atMs);
  return ms - latest >= LULL_MS;
}

/**
 * The HUD's view of the contact at ms (see the header): { pending: { id, ids, seenMs, untilMs, ms, k, expect, n } | null,
 * last: { id, ids, seenMs, atMs, ms, expect, n, grade, parts, pick, ident, armour, words } | null }, or null before the first.
 */
export function contactNow(state, ms = state.clock.ms) {
  const c = contactOf(state);
  if (!c) return null;
  const P = c.pending;
  return {
    pending: P ? { id: P.id, ids: [...P.ids], seenMs: P.seenMs, untilMs: P.untilMs, ms: P.ms, k: windowK(P, ms), expect: P.expect, n: P.n } : null,
    last: c.last ? { ...c.last, ids: [...c.last.ids], ident: { ...c.last.ident }, armour: { ...c.last.armour } } : null,
  };
}
