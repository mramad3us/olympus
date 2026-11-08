// OLYMPUS scenarios: test-handling, "Show clear": the 25 m line of the KD range on the tower's commands, a set stoppage, and show clear to the coach (ROADMAP §4.2's 0.0.6 row as v0.0.5; WEAPONS §5.3, §6.4, §11.3; the build sheet 0.0.5 §2.2).
//
// The place is authored (src/data/places/range.js KD_RANGE: the bay, the tower, the lanes, the same in
// every career); everything that happens on it is procedural, drawn from the world's seed on named
// streams: the lane (2 to 5, stream(seed, 'range:lane', course)), the coach's set stoppage
// (stream(seed, 'arms:set', course): the 2nd or 3rd magazine, its 2nd to 4th round, a dud 40, a
// stovepipe 35, a double 25: WEAPONS §11.3's dummy, the sheet §8 item 6), the tower's pace (each
// command's gap on stream(seed, 'range:gap', i)), the words by hash. The range officer and the coach are
// generated people of their posts (src/sim/people/staff.js; the user, 2026-11-05: "All people
// generated").
//
// The fill (testHandling): the barracks drawn (Echo Company, the player) at 09:00 (newGame's, the scene's spec), the player
// at their lane's firing point facing downrange in utilities and the start body, their sheet written by
// their rank's tier (SKILLS §15.1: the scene's player only), the 'range-fam' issue materialised (the R-7
// slung front, three magazines of five in the pouches, the set riding on its magazine), the RO posted on
// the tower's deck and the coach at your left shoulder (KD_RANGE's lane.coach), then startRange: the session in
// state.armoury.range, the issue in armoury.ammoIssues (15 rounds of ball to you), and the brief posted
// at the clock. setup 'hot' starts at string 1 in Condition 1 prone at low ready, aimed at your card in
// the mode, the line hot; 'bench' the same with one magazine of 15 and no set, and off safe (the bench's
// range-line presses Fire alone, fifteen times).
//
// The session (armoury.range): { course, lane, fp (the firing point's fixture name in KD_RANGE: a data key,
// not a spotId, since the bay's firing points are not placed fixtures with spots this round), roId, coachId, issueId, setMagId, set, phase,
// string, hot, cmd: { id, i, atMs }, next, shots (≤ SHOTS_KEPT 100, each with its hole), brass (≤
// BRASS_LIVE 64), faults, warned, end, livedMs, nudged, stoppage, shown }. The tower's sequence is
// courses.js SEQ (the Corps' commands: the brief, prone, LOAD, MAKE READY, three strings of commence
// fire and CEASE FIRE with the stance and RELOAD between them, UNLOAD SHOW CLEAR, "The line is clear.").
// Each command is an event (kind 'range-cmd', prio 2: an O, src 'arms:range') the RO posts when he sees
// the line ready for the last (lineReady: what he can see, a stance, a magazine in, hands still, the
// rifle on safe), a gap after (rangeSecond, on each whole second lived); onRangeCmd says it on the PA
// (say kind 'pa'), moves the phase, ends a wait or a hold at once and cuts any other step at its
// sub-step's end on CEASE FIRE (COMBAT §3.3's orderToMe). A command not done after nudgeMs 30 s of lived
// time is said again with the lane ("Lane four, LOAD."; on a KD line the point you stand on, "Point eleven, LOAD.":
// whoOnLine). The command you have still to answer is standingCmd's, which the radio box keeps on screen until it is
// done (hud/radio.js). The coach (say kind 'speech') speaks at the
// brief, after each string (its score), after the set stoppage is cleared (what it was), at the faults;
// never doing your work. Range safety (rangeRules, each tick lived): carry.js rangeSafety's verdicts
// (WEAPONS §6.4, the muzzle, the box, the aim at a person or another lane's card, the finger) become the
// coach's word and a fault, again at most every WARN_AGAIN_MS 20 s a rule (carry.js filters by the
// session's warned clock), or the stop; what only the scene can see goes to it as this tick's flags
// (noteTick: a shot and its lane, the shots on a cold line, a command acted on before the tower gave it,
// a stance or posture changed, a negligent discharge) and the minute the rifle left the box (outAtMs).
// The stop is the rule's "Cease fire! Cease fire!", the coach taking the rifle (slung again), range {
// phase: 'stopped', why }. "The
// line is clear." ends it: range { phase: 'clear' }, the mode left, the rifle slung front (the sheet §8
// item 25: the end card's seconds of play pass). rangeNow(state) is the hud's and the bots' view, its
// summary the end card's ("Clear at 09:14 · 61 of 70 · 4 V · no faults").
//
// 0.0.6, a scene never dead-ends (the user, 2026-11-07: "I shoot two prone, two kneeling and when I have to
// shoot standing, I don't have any mags left"; DESIGN.md's log). Their save: four fired, a magazine change,
// six more in the prone string, and the tower waited for ever at 'stand' for a loaded rifle. Now:
//   - **the coach's check**: while the tower waits on a command that wants rounds (LOAD, MAKE READY, a
//     string's RELOAD, a string being fired) and the line is not ready, once checkMs of it is lived (still or
//     not: the fixer's, 0.0.6; before the move-on, which then waits its moveOnMs again and passes a dry shooter
//     over with no fault) the coach counts what the shooter has (roundsLeft: the chamber, the magazine in, the hand's, the pouches', those at
//     their feet); none, and he says so in his voice and the session is dry (R.dry): the RO's readiness then
//     takes "no rounds" (on safe, in the stance) for every string left, each sat out (R.sat), scoring as not
//     fired, and the course runs on to UNLOAD, SHOW CLEAR and its end;
//   - **the line moves on**: a command the shooter has not answered after moveOnMs of lived time (the nudge
//     at nudgeMs before it) is passed over with a 'slow' fault in the coach's words, the RO's next command
//     posted; at UNLOAD, SHOW CLEAR the coach takes the rifle and clears and shows it himself (coachClears),
//     so a stance never taken, a rifle slung or a magazine never found ends at the end card all the same;
//   - **one magazine a string**: the magazine in the rifle at a string's commence fire (or the first seated
//     in it) is the string's (R.strMag); seating another before the tower's RELOAD is ahead of the tower, a
//     fault 'onemag' each time, the coach's "One magazine a string. You reload on the tower's word." the
//     first (magSeated); the panel marks the steps that would do it (oneMagWarn), never strikes them. The
//     magazine read 0 by a check, or about to come out, with a round still chambered in a hot string, the coach
//     says so first, once a string ("You've one left up the spout. Fire it.": spoutCheck); a string fired with
//     more shots than its rounds is remarked on at its CEASE FIRE ("Ten rounds in a five-round string."), never
//     praised, and goes down on the end card as over-fired (R.over; the fixer's, 0.0.6, DESIGN.md 2026-11-07).
// setup 'mixed' (my call) issues the 'range-mixed' kit: the three magazines of ball and a fourth of tracer,
// their counts told and their kinds not (one of them is tracer, the coach says), each kind its own ammunition
// issue. The course's load is ball (R.load, kit.js meantLoad: what the drills reach for first).
// 0.0.7 (the build sheet 0.0.7 §2.3, §2.7): the course engine is the course's, so test-range's kd course runs on it:
// its tower is seqOf(R) (courses.js SEQ for fam25, SEQ_KD for kd), the next command after one kdNextI's on the kd
// course (the zero's loop), its readinesses kdReady's and the relay's (gunner.js relayReady) where the shared ones
// do not answer, the commands' work kdOnCmd's and the strings' end kdStringEnd's, the box the line holds you in the
// point's on the line you are on (kdPoint), each shot recorded with its shooter (who: the relay's too, which never
// count as yours) and handed to kdShot for the pits, the 200 m string's second magazine seated without the
// one-magazine fault (KD_STRINGS mags 2), the move-on's undone work kdMoveOn's, and rangeNow's summary kdNow's
// line (src/sim/scenarios/range.js). On fam25 every path is v0.0.6's, to the tick (test-handling's score of
// 100/100/100 stands).
// 0.0.8 (the build sheet 0.0.8 §2.6): test-pairs' pairs course runs on the same engine, its own branch at each door and
// nowhere else (fam25 and kd to the tick): its sequence courses.js SEQ_PAIRS (seqOf), its readinesses pairs.js
// pairsReady's first (lineReady), the coach's commands said as speech and their work pairsOnCmd's (no RO on the tower),
// pairsSecond's part of the second, each shot handed to pairsShot (the turners, the string's record), each step's end
// to pairsAfterStep (the reloads by purpose, the string's end), the box the line holds you in the current line's
// (pairs.js pairsBox) with no lane rule (every lane's turner is yours), no 'onemag' fault nor mark (COURSES.pairs.oneMag
// false), no ahead-of-the-tower for a reload (Top up is the shooter's own), no spout word, and rangeNow pairsNow's.
// 0.0.10 (the build sheet 0.0.10 §2.2): test-stress's stress course runs on the pairs course (R.course 'pairs'), its own
// sequence courses.js SEQ_STRESS where the session carries R.stress (seqOf); everything else is pairs.js's.
import { TICK_MS, holdTime, isHeld } from '../../core/clock.js';
import { stream, int, intIn, pick, weighted } from '../../core/rng.js';
import { hashPick } from '../../core/hash.js';
import { nextId, playerActor, playerId } from '../../core/ids.js';
import { post } from '../../core/queue.js';
import { SCENES } from '../../data/scenes.js';
import { COURSES, SEQ, SEQ_KD, SEQ_PAIRS, SEQ_STRESS, KD_STRINGS, COACH, PAIRS_COACH, MACRO_CMD, MACRO_MARK, NEEDS_ROUNDS } from '../../data/courses.js';
import { KD_RANGE } from '../../data/places/range.js';
import { logEntry } from '../log.js';
import { lonOfSite } from '../places/env.js';
import { setOutfit, syncActors } from '../people/place.js';
import { drawStaff, setPost, staffName } from '../people/staff.js';
import { startBody } from '../body/body.js';
import { deltaOf } from '../body/record.js';
import { rollSheet, tierOfRank } from '../skills/templates.js';
import { barracks } from './barracks.js';
import { setLedgers } from './tests.js';
import { materialise, move, pouchFor, handMagOf, containersOf, atFeetOf } from '../arms/kit.js';
import { newMag, feed, conditionOf, gunField } from '../arms/firearms.js';
import { rangeSafety, carryOf } from '../arms/carry.js';
import { scoreOf, PAPERS } from '../arms/paper.js';
import { enterStop, leaveStop, gunOn } from '../arms/shooting.js';
import { BRASS_LIVE, ejectCase, caseGMs2 } from '../arms/look.js';
import { feetHeld } from '../time/doing.js';
import { feetOf } from '../combat/contact.js';
import { kdReady, kdRelayReady, kdOnCmd, kdNextI, kdSecond, kdStringEnd, kdShot, kdMoveOn, kdPoint, kdNow, kdWaitOnYou } from './range.js';
import { pairsReady, pairsOnCmd, pairsSecond, pairsShot, pairsAfterStep, pairsBox, pairsPoint, pairsRangeNow, pairsWant, PAIRS_NUDGE, pairsStepStart } from './pairs.js';

/** Where the scene plays. */
export const HANDLING = Object.freeze({ site: SCENES['test-handling'].host.site, area: KD_RANGE.area, course: 'fam25' });
/** The session keeps this many shots and this many cases (the build sheet §3, §4). */
export const SHOTS_KEPT = 100;
/** A rule's warning again no sooner than this (tradecraft's WARN_AGAIN_S), ms. */
export const WARN_AGAIN_MS = 20_000;
/** The radio box's cadence (tradecraft's earpiece): a line lives this long and this much a word, ms. */
export const SAY_MS = 3_500, SAY_WORD_MS = 330;
const LANE_WORD = Object.freeze(['zero', 'one', 'two', 'three', 'four', 'five', 'six']);
/** The tower's commands said again with the lane (a nudge). */
export const NUDGE = Object.freeze({ prone: 'the prone position.', load: 'LOAD.', ready: 'MAKE READY.', fire: 'commence fire.', cease: 'CEASE FIRE.',
  kneel: 'kneeling. RELOAD.', stand: 'standing. RELOAD.', clear: 'UNLOAD, SHOW CLEAR.',
  // (0.0.7: the kd course's)
  reload: 'RELOAD.', dial: 'your corrections.', optic: 'optics to four power.', dope: 'your dope.', sit: 'sitting. LOAD.', police: 'police your brass.',
  turnIn: 'rounds to your coach.', declare: 'your declaration.',
  // (0.0.8: the pairs course's, the coach's own)
  stop: 'on safe, low ready, out of it.', move10: 'back to the ten-metre line.', short: 'top up with the short one.', lull: 'top up, low ready, out of it.' });

/** The session, or null. */
export const rangeOf = (state) => state.armoury?.range ?? null;
/** The tower's sequence of a session's course (0.0.7: SEQ_KD on the kd course; 0.0.8: SEQ_PAIRS on the pairs course; 0.0.10: SEQ_STRESS on it with the stress course's R.stress). */
export const seqOf = (R) => (R?.course === 'kd' ? SEQ_KD : R?.course === 'pairs' ? (R.stress ? SEQ_STRESS : SEQ_PAIRS) : SEQ);
// (the command after i: the next, or the kd course's own (its zero's loop); null at the end)
const nextIOf = (state, R, i) => (R.course === 'kd' ? kdNextI(state, i) : i + 1 < seqOf(R).length ? i + 1 : null);
// (a shot is the player's: v0.0.6's by their lane; the kd course's by its shooter, the relay's never; the pairs course's all)
const mineOf = (state, R, x) => (R.course === 'kd' ? x.who === playerId(state) : R.course === 'pairs' ? true : x.lane === R.lane);
/** The coach's person id (the observer of a show clear), or null. */
export const coachOf = (state) => rangeOf(state)?.coachId ?? null;
/** The command a macro answers (courses.js MACRO_CMD): an id, a list of ids, or null. */
export const cmdOfMacro = (macroId) => MACRO_CMD[macroId] ?? null;
/** The command a macro completes, its ◉ in the panel (courses.js MACRO_MARK): an id, a list of ids, or null. */
export const markOfMacro = (macroId) => MACRO_MARK[macroId] ?? null;
/** A lane's record on the 25 m line. */
export const laneOf = (lane) => KD_RANGE.bay.lanes.find(L => L.lane === lane) ?? null;

// ---- words ----

const durOf = (text) => SAY_MS + SAY_WORD_MS * String(text).split(/\s+/).filter(Boolean).length;
/** Someone says something on the range (the radio box): 'say' { who, text, kind, durMs }, and the log. */
export function sayOn(state, bus, { who, text, kind = 'speech' }) {
  if (!text) return;
  bus?.emit('say', { who, text, kind, durMs: durOf(text) });
  logEntry(state, bus, { kind: 'say', tone: 'note', who, text, say: kind, ...(who ? { name: staffName(state, who) } : {}) });
}
const coachSays = (state, bus, lines, ...key) => { const R = rangeOf(state); if (R) sayOn(state, bus, { who: R.coachId, text: hashPick(lines, 'coach', state.meta.seed, ...key), kind: 'speech' }); };

// ---- the fill ----

const lonOf = () => lonOfSite(HANDLING.site);

/** The set stoppage drawn for a course (see the header): { mag (its place, 1 to 3), n (the round, counted down the magazine), kind }. */
export function drawSet(seed, course = 'fam25') {
  const S = COURSES[course].set, r = stream(seed, 'arms:set', course);
  const mag = pick(r, S.mags), round = intIn(r, S.rounds[0], S.rounds[1]), kind = weighted(r, S.kinds);
  // (the round-th to come up of a magazine of five sits at count n = 5 − round + 1: feed() takes it when the magazine holds n)
  const n = COURSES[course].mags[mag - 1] - round + 1;
  return { mag, round, n, kind };
}
/** The lane drawn for a course. */
export const drawLane = (seed, course = 'fam25') => { const L = COURSES[course].lane; return L.from + int(stream(seed, 'range:lane', course), L.to - L.from + 1); };

/** The fill of 'test-handling' (see the header). setup: null | 'hot' | 'bench' | 'mixed'. */
export function testHandling(state, { at = null, setup = null } = {}) {
  const scene = SCENES['test-handling'], C = COURSES[scene.course ?? HANDLING.course], seed = state.meta.seed, lon = lonOf();
  const lane = drawLane(seed, HANDLING.course), L = laneOf(lane);
  barracks(state, { at: { area: KD_RANGE.area, x: L.fp.x, z: L.fp.z, face: 'right', ...(at ?? {}) } });
  const me = playerActor(state), pid = playerId(state), person = state.people[pid];
  setOutfit(me, scene.outfit);
  person.body = deltaOf(setLedgers(startBody(person, state.clock.ms, lon, seed), scene.body ?? {}));
  person.skills = rollSheet(seed, pid, tierOfRank(person.service?.rank));
  const set = setup === 'bench' ? null : drawSet(seed, HANDLING.course);
  const kit = materialise(state, pid, setup === 'mixed' ? C.kitMixed : C.kit, { sets: set ? { [set.mag]: { n: set.n, kind: set.kind } } : {} });
  const roId = drawStaff(state, 'melas:kd-ro'), coachId = drawStaff(state, 'melas:kd-coach');
  const T = KD_RANGE.tower;
  setPost(state, roId, { area: KD_RANGE.area, x: T.ro.x, z: T.ro.z, y: T.deckY, face: T.ro.face });
  setPost(state, coachId, { area: KD_RANGE.area, x: L.coach.x, z: L.coach.z, face: L.coach.face });
  syncActors(state);
  startRange(state, null, { course: HANDLING.course, lane, setup, kit, set, roId, coachId });
  return state;
}

/** The session begun (see the header): the issue, the staff, the brief posted. Returns the session. */
export function startRange(state, bus, { course = 'fam25', lane, setup = null, kit = null, set = null, roId = null, coachId = null } = {}) {
  const C = COURSES[course], L = laneOf(lane), pid = playerId(state), now = state.clock.ms;
  const gunId = kit?.gunId ?? gunOn(state, pid);
  const issueId = nextId(state, 'ai');
  const rounds = C.mags.reduce((a, b) => a + b, 0);
  state.armoury.ammoIssues.push({ id: issueId, atMs: now, area: KD_RANGE.area, toId: pid, cal: '6.5x40r', load: C.load ?? 'ball', n: rounds, fired: 0 });
  const R = state.armoury.range = {
    course, lane, fp: L.fixtures.fp, roId, coachId, issueId, setMagId: set && kit ? kit.magIds[set.mag - 1] : null,
    set: set ? { mag: set.mag, n: set.n, kind: set.kind } : null, phase: 'brief', string: -1, hot: false, cmd: null, next: null,
    shots: [], brass: [], faults: [], warned: {}, end: null, livedMs: 0, nudged: false, stoppage: null, shown: false,
  };
  // (0.0.6: the course's kind, and the mixed setup's tracer magazine issued on its own line (see the header))
  if (C.load && C.load !== 'ball') R.load = C.load;
  if (setup === 'mixed' && kit) {
    const extra = kit.magIds.slice(C.mags.length).map(id => state.items[id]).filter(m => m?.load && m.load !== 'ball');
    if (extra.length) {
      const id = nextId(state, 'ai');
      state.armoury.ammoIssues.push({ id, atMs: now, area: KD_RANGE.area, toId: pid, cal: '6.5x40r', load: extra[0].load, n: extra.reduce((a, m) => a + m.n, 0), fired: 0 });
      R.issueIds = { [extra[0].load]: id };
      R.mixed = true;
    }
  }
  if (setup === 'hot' || setup === 'bench') {
    const me = playerActor(state), gun = state.items[gunId];
    let magId = kit.magIds[0];
    if (setup === 'bench') { magId = newMag(state, { fam: 'had30', n: 15, told: true }); state.armoury.ammoIssues.at(-1).n = 15; }
    move(state, magId, { gun: gunId });
    const mag = state.items[magId];
    feed(gun, mag);
    gun.belief = { chamber: 'live', count: mag.n };
    if (mag.belief) delete mag.belief;
    me.stance = 'prone';
    state.people[pid].kit.carry.posture = 'lowReady';
    const i = SEQ.findIndex(c => c.id === 'fire');
    R.cmd = { id: 'fire', i, atMs: now }; R.phase = 'string'; R.string = SEQ[i].string; R.hot = true;
    enterStop(state, bus, { pid, gunId, via: 'shoot' });
    const own = `paper:${lane}`;
    state.stop.pick = own;
    state.stop.aim = { key: own, settledMs: now };
    state.people[pid].kit.carry.posture = 'aimed';
    me.headRad = 0; me.face = 'right';
    // (the bench fires at once: its keys are Fire alone, so its rifle starts off safe)
    if (setup === 'bench') gun.mode = 'semi';
    return R;
  }
  post(state, { atMs: now, prio: 2, kind: 'range-cmd', src: 'arms:range', payload: { cmd: SEQ[0].id, i: 0 } });
  R.next = { id: SEQ[0].id, i: 0, atMs: Math.floor(now / 1000) * 1000 };
  return R;
}

// ---- what the range officer sees ----

/** Whether the shooter is still, as the RO sees it: no step under way but the wait (stop motion's chained wait too). */
export const stillOf = (state) => { const S = state.stop; return !S || !S.doing || S.doing.kind === 'wait'; };

/** Whether the line is ready for a command's next (see the header: what the RO can see). */
export function lineReady(state, cmdId = rangeOf(state)?.cmd?.id, { relay = true } = {}) {
  const R = rangeOf(state);
  if (!R || !R.cmd) return false;
  const seq = seqOf(R), def = seq[R.cmd.i] ?? seq.find(c => c.id === cmdId);
  const pid = playerId(state), me = playerActor(state), gun = state.items?.[gunOn(state, pid)];
  const still = stillOf(state);
  if (!me || !gun) return false;
  const mag = gun.mag ? state.items[gun.mag] : null, finger = state.people[pid]?.kit?.carry?.finger ?? 'off';
  const safe = gunField(gun, 'mode') === 'safe' && finger !== 'on';
  // (0.0.7: the kd course's own readinesses, and the relay ready with you)
  if (R.course === 'kd') {
    if (relay && def.ready !== 'always' && !kdRelayReady(state)) return false;
    const k = kdReady(state, def, { still, gun, mag, safe, me });
    if (k !== null) return k;
  }
  // (0.0.8: the pairs course's own readinesses)
  if (R.course === 'pairs') {
    const k = pairsReady(state, def, { still, gun, mag, safe, me });
    if (k !== null) return k;
  }
  switch (def.ready) {
    case 'always': return true;
    case 'prone': return still && me.stance === 'prone';
    // (0.0.6: once the coach has found no rounds (R.dry), "no rounds, on safe" stands for a loaded rifle (see the header))
    case 'magIn': return still && (!!gun.mag || (!!R.dry && safe));
    case 'cond1': return still && (conditionOf(gun) === 1 || (!!R.dry && safe));
    case 'emptyLocked': return still && ((!!gunField(gun, 'locked') && !!mag && mag.n === 0) || !!R.dry);
    case 'safe': return still && safe;
    case 'kneel1': return still && me.stance === 'kneel' && (conditionOf(gun) === 1 || (!!R.dry && safe));
    case 'stand1': return still && !me.stance && (conditionOf(gun) === 1 || (!!R.dry && safe));
    case 'shown': return still && !!R.shown;
    default: return false;
  }
}

// ---- the tower ----

/** The event 'range-cmd' (see the header): the tower says it, the phase moves, a wait or a hold ends. */
export function onRangeCmd(state, bus, ev) {
  const R = rangeOf(state);
  if (!R || R.end) return;
  const { cmd, i } = ev.payload ?? {};
  const def = seqOf(R)[i];
  if (!def || def.id !== cmd) return;
  const now = state.clock.ms;
  // (a command posted with its own words says them in place of its sequence's: the kd string's limit, "CEASE FIRE. Time.",
  // is its CEASE FIRE, said once (it was said, then the sequence's "CEASE FIRE." a tick after: 0.0.7's tower verifier))
  const said = typeof ev.payload?.text === 'string' ? ev.payload.text : null;
  // (0.0.8: on the pairs course the coach gives the commands himself, beside you)
  R.cmd = { id: cmd, i, atMs: now, ...(said ? { text: said } : {}) }; R.next = null; R.livedMs = 0; R.nudged = false;
  if (R.course === 'kd') R.onYouMs = 0;
  sayOn(state, bus, { who: R.roId, text: said ?? hashPick(def.say, 'range-cmd', state.meta.seed, i), kind: R.course === 'pairs' ? 'speech' : 'pa' });
  if (cmd === 'brief') { R.phase = 'brief'; if (R.course !== 'kd' && R.course !== 'pairs') coachSays(state, bus, R.mixed ? COACH.briefMixed : COACH.brief, 'brief'); }
  else if (cmd === 'fire') {
    R.hot = true; R.phase = 'string'; R.string = def.string;
    // (the string's magazine: the one in the rifle now, or the first seated in it (magSeated); a dry shooter sits it out)
    const gun = state.items[gunOn(state, playerId(state))];
    if (gun?.mag) R.strMag = gun.mag; else delete R.strMag;
    if (R.dry) (R.sat ??= []).push(def.string);
  }
  else if (cmd === 'cease') { R.hot = false; R.phase = 'cmd'; if (R.course === 'kd') kdStringEnd(state, bus, def.string); else stringScore(state, bus, def.string); }
  else if (cmd !== 'end') R.phase = 'cmd';
  bus?.emit('range', { phase: 'cmd', cmd, hot: R.hot, rule: null, kind: null, text: null, ...(R.course === 'kd' ? { line: R.line ?? null } : {}),
    ...(R.course === 'pairs' ? { line: def.line ?? R.line ?? null, ...(def.string !== undefined ? { string: def.string } : {}) } : {}) });
  if (R.course === 'kd') kdOnCmd(state, bus, def, i);
  if (R.course === 'pairs') pairsOnCmd(state, bus, def, i);
  if (cmd === 'end') { endRange(state, bus, 'clear', null); return; }
  // (orderToMe: a wait or a hold ends at once; a CEASE FIRE cuts any other step at its sub-step's end)
  const S = state.stop, d = S?.doing;
  if (S?.mode === 'stop' && d) {
    if (d.kind === 'wait' || d.list[d.i] === 'hold') {
      bus?.emit('step', { phase: 'cut', who: d.who, step: d.step, i: d.i, action: d.list[d.i], fromMs: d.subFromMs, toMs: d.untilMs, ok: true, grade: null, routine: null, mishap: null, text: cmd });
      S.doing = null; S.phase = 'choose';
      holdTime(state, 'stop');
    } else if (cmd === 'cease') d.cut = true;
  }
}

// (a string's score at its CEASE FIRE: the fact and the coach's word on it)
function stringScore(state, bus, k) {
  const R = rangeOf(state);
  const mine = R.shots.filter(s => s.string === k && s.lane === R.lane), holes = mine.map(s => ({ at: s.hole, score: s.score, v: s.v }));
  const s = scoreOf(holes), sat = !!R.sat?.includes(k);
  delete R.strMag;
  // (the string shot by shot, a miss as 0, so PAPER's line reads every shot in order (the runtime review's: it read
  // the holes on the card, leaving the misses out))
  const over = mine.length > (COURSES[R.course].mags[k] ?? Infinity);
  bus?.emit('range', { phase: 'string', cmd: 'cease', hot: false, n: k + 1, score: s.score, of: s.of, v: s.v, hits: s.hits, shots: s.shots, list: mine.map(x => ({ score: x.score ?? 0, v: !!x.v, hit: !!x.hole })), ...(sat ? { sat: true } : {}), ...(over ? { over: true } : {}) });
  // (a string sat out, or one never fired: said so, never "None of none on the paper" (0.0.6))
  if (!mine.length) { coachSays(state, bus, sat ? COACH.string.sat : COACH.string.none, 'string', k); return; }
  // (the tip by how the string was shot: haste lines only where a shot was rushed or unheld (see courses.js COACH))
  // (more shots than the string's rounds: remarked on, never praised (0.0.6, DESIGN.md 2026-11-07; the user's run fired ten
  // in the prone string and was told "All ten on the paper. Same again.")
  const rounds = COURSES[R.course].mags[k] ?? null;
  if (Number.isFinite(rounds) && mine.length > rounds) {
    (R.over ??= []).push(k);
    const fill = (l) => l.replaceAll('{Shots}', capital(countWord(mine.length))).replaceAll('{shots}', countWord(mine.length)).replaceAll('{Rounds}', capital(countWord(rounds))).replaceAll('{rounds}', countWord(rounds));
    coachSays(state, bus, COACH.string.over.map(fill), 'string', k);
    return;
  }
  const misses = s.shots - s.hits, careful = mine.length > 0 && mine.every(x => x.care === 'held');
  const nat1 = mine.filter(x => !x.hole && x.nat1).length;
  const lines = !misses ? COACH.string[0] : careful && misses === 1 && nat1 === 1 ? COACH.string.luck : careful ? COACH.string.held : COACH.string[misses] ?? COACH.string.low;
  coachSays(state, bus, lines.map(l => l.replace('{Hits}', capital(countWord(s.hits))).replace('{hits}', countWord(s.hits)).replace('{shots}', countWord(s.shots))), 'string', k);
}
// (a count in words, as the coach says it: 'four', past twenty its digits)
const COUNT_WORD = Object.freeze(['none', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
  'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty']);
const countWord = (n) => COUNT_WORD[n] ?? String(n);
const capital = (w) => w.charAt(0).toUpperCase() + w.slice(1);

/** The fast layer 'second' (live only, see the header): the RO watches; the line ready, the next command after a gap; a nudge. */
export function rangeSecond(state, input, bus, ctx) {
  if (state.clock.ms % 1000 !== 0) return;
  const R = rangeOf(state);
  if (!R || R.end || !R.cmd) return;
  // (0.0.7: the kd course's second: a splash begun, a string's limit, the brass settled)
  if (R.course === 'kd' && kdSecond(state, bus, ctx)) return;
  // (0.0.8: the pairs course's second: the string's end when the shooter is still)
  if (R.course === 'pairs' && pairsSecond(state, bus, ctx)) return;
  if (R.end) return;
  R.livedMs += 1000;
  const i = R.cmd.i, C = COURSES[R.course], SQ = seqOf(R), ni = nextIOf(state, R, i), kd = R.course === 'kd';
  if (!R.next && ni !== null && lineReady(state, R.cmd.id)) {
    const gap = i === 0 ? C.firstGapMs : intIn(stream(state.meta.seed, 'range:gap', ni), C.roGapMs[0], C.roGapMs[1]);
    const atMs = state.clock.ms + gap;
    post(state, { atMs, prio: 2, kind: 'range-cmd', src: 'arms:range', payload: { cmd: SQ[ni].id, i: ni } });
    R.next = { id: SQ[ni].id, i: ni, atMs: Math.floor(atMs / 1000) * 1000 };
    return;
  }
  // (0.0.7's tower fixer: on the kd course the nudge and the move-on wait on R.onYouMs, the lived time the line waits on
  // you alone (range.js kdWaitOnYou: your readiness not met, the relay's met, no timed string, no splash or casualty), never
  // on the relay's or the tower's own waiting (the user's report of 2026-11-07: "got a fault for making tower wait when
  // everyone was waiting"); fam25's stays R.livedMs, to the tick)
  // (0.0.8, the fixer's: on the pairs course the coach names what is still lacking (pairs.js pairsWant), never while a string runs)
  const live = R.course === 'pairs' && !!R.str && R.str.turnedMs !== null && !R.str.done;
  const nudge = R.course === 'pairs' ? (live ? null : PAIRS_NUDGE[pairsWant(state)] ?? NUDGE[R.cmd.id]) : NUDGE[R.cmd.id];
  const waited = kd ? kdWaitOnYou(state) : R.livedMs;
  if (!R.next && !R.nudged && i > 0 && waited >= C.nudgeMs && nudge) {
    R.nudged = true;
    sayOn(state, bus, { who: R.roId, text: `${R.course === 'pairs' ? 'Shooter' : whoOnLine(state)}, ${nudge}`, kind: R.course === 'pairs' ? 'speech' : 'pa' });
  }
  // (0.0.6: the coach's check, once a command that wants rounds has waited checkMs of lived time with no stoppage in
  // the rifle (a double's loose round is being cleared, not missing): none anywhere, the session dry. No stillness
  // asked: with nothing anywhere no reload can be under way, a magazine in the hand or at the feet being counted, so
  // a shooter hunting step by step for a magazine hears it before any move-on (the fixer's, 0.0.6, after the user's
  // own save played by the keys: reach at your feet, look, drop, and the line moved on with a 'slow' fault first))
  const gun = state.items?.[gunOn(state, playerId(state))];
  const clean = !!gun && !gunField(gun, 'jam') && !['case', 'dud'].includes(gunField(gun, 'chamber'));
  // (a string fired to its last round is the one wait where none left is the end of the work, not a want of it: its
  // bolt locks back on the empty, so there the check still waits for the shooter to be still)
  const firing = SQ[i].ready === 'emptyLocked' && R.shots.some(x => x.string === R.string && mineOf(state, R, x));
  // (0.0.7: on the kd course the line may wait on the relay with you ready: your own readiness met is no want of rounds)
  const ownReady = R.course === 'kd' && lineReady(state, R.cmd.id, { relay: false });
  if (!R.next && !R.dry && !ownReady && NEEDS_ROUNDS.includes(SQ[i].ready) && R.livedMs >= C.checkMs && clean && (!firing || stillOf(state)) && roundsLeft(state) === 0) {
    R.dry = { atMs: state.clock.ms, cmd: R.cmd.id };
    R.livedMs = 0;                                   // (the move-on's wait starts again from the coach's word)
    if (kd) R.onYouMs = 0;
    // (found dry while a string is called and none of it fired: that string is sat out too)
    if (R.hot && !R.shots.some(x => x.string === R.string && mineOf(state, R, x)) && !(R.sat ??= []).includes(R.string)) R.sat.push(R.string);
    coachSays(state, bus, R.course === 'pairs' ? PAIRS_COACH.dryOut : COACH.dry, 'dry', i);
    bus?.emit('range', { phase: 'dry', cmd: R.cmd.id, hot: R.hot, rule: null, kind: null, text: null });
    return;
  }
  // (0.0.6: the line waits on one lane no longer than moveOnMs of lived time: see the header; a dry shooter's
  // never a 'slow' fault, the coach having said why the rifle is not loaded)
  // (a walk the tower called and its splash not yet begun is the tower's wait, never a 'slow' fault of yours)
  if (!R.next && i > 0 && ni !== null && waited >= C.moveOnMs) moveOn(state, bus, { quiet: (!!R.dry && NEEDS_ROUNDS.includes(SQ[i].ready)) || (kd && SQ[i].ready === 'arrived') });
}

/**
 * Who the tower names on the line (the nudge's "Lane four, LOAD."): the bay's lane at 25 m, and on a KD line the point you
 * stand on, its stake's number ("Point eleven, commence fire.": the user's report of 2026-11-07, "did call me line 5 when
 * I'm line 10": the tower named the bay's lane, 5, on the KD's point 11).
 */
export function whoOnLine(state) {
  const R = rangeOf(state);
  if (R?.course === 'kd' && (R.line ?? 25) !== 25) return `Point ${COUNT_WORD[R.kdLane] ?? R.kdLane}`;
  return `Lane ${LANE_WORD[R?.lane] ?? R?.lane}`;
}

/**
 * The tower's command the shooter has still to answer, which the radio box keeps on screen until it is done (hud/radio.js
 * standingLine; the user's report of 2026-11-07: "tower sometimes doesn't say anything but we're expected to do it": the
 * box held two lines, and the coach's two after "Set your dope" pushed the tower's out the same tick, his wind call
 * wrapping after "Commence fire" the same): { i, id, who, atMs (when it was said), text (as the tower said it), short
 * (its terms in a line: courses.js `short`, "Ten rounds rapid, sixty seconds. Commence fire.", else the nudge's words,
 * "Commence fire."), point (whoOnLine) }, or null when nothing stands: no command, the brief, the end, a command your
 * readiness already meets (lineReady without the relay), the next one posted, a casualty holding the line, the line over.
 */
export function standingCmd(state) {
  const R = rangeOf(state);
  if (!R || R.end || !R.cmd || R.next) return null;
  const def = seqOf(R)[R.cmd.i];
  if (!def || def.id !== R.cmd.id || def.ready === 'always' || def.ready === 'never' || def.ready === 'zeroRead') return null;
  if (R.casualty && R.casualty.phase !== 'outcome') return null;
  if (def.id === 'fire' && !R.hot) return null;
  if (lineReady(state, def.id, { relay: false })) return null;
  const text = R.cmd.text ?? hashPick(def.say, 'range-cmd', state.meta.seed, R.cmd.i);
  return { i: R.cmd.i, id: def.id, who: R.roId, atMs: R.cmd.atMs, text, short: R.cmd.text ?? def.short ?? capital(NUDGE[def.id] ?? text), point: whoOnLine(state) };
}

/** What the shooter has to fire (the coach's count, the truth: see the header): the chamber's live round, the magazine in, the hand's, the pouches', those at their feet. */
export function roundsLeft(state, pid = playerId(state)) {
  const gun = state.items?.[gunOn(state, pid)];
  let n = gun && gunField(gun, 'chamber') === 'live' ? 1 : 0;
  const count = (id) => { const m = state.items?.[id]; if (m?.type === 'mag') n += m.n ?? 0; };
  if (gun?.mag) count(gun.mag);
  const h = handMagOf(state, pid);
  if (h) count(h.id);
  for (const c of containersOf(state, pid)) for (const id of state.items[c].holds ?? []) count(id);
  for (const l of atFeetOf(state, pid)) count(l.id);
  return n;
}

/** The line moves on (see the header): a 'slow' fault (none when quiet: a dry shooter's), the next command posted; at UNLOAD, SHOW CLEAR the coach clears the rifle. */
export function moveOn(state, bus, { quiet = false } = {}) {
  const R = rangeOf(state), i = R.cmd.i, C = COURSES[R.course], SQ = seqOf(R);
  if (SQ[i].ready === 'shown') { coachClears(state, bus); return; }
  if (!quiet) fault(state, bus, 'slow', 'warn', hashPick(R.course === 'pairs' ? PAIRS_COACH.slow : COACH.slow, 'coach', state.meta.seed, 'slow', i));
  // (0.0.7: on the kd course the coach does what was left undone (kdMoveOn); a splash still to come is waited for)
  if (R.course === 'kd') { kdMoveOn(state, bus, SQ[i]); if (SQ[i].ready === 'arrived') { R.livedMs = 0; return; } }
  const ni = nextIOf(state, R, i);
  if (ni === null) return;
  const atMs = state.clock.ms + intIn(stream(state.meta.seed, 'range:gap', ni), C.roGapMs[0], C.roGapMs[1]);
  post(state, { atMs, prio: 2, kind: 'range-cmd', src: 'arms:range', payload: { cmd: SQ[ni].id, i: ni } });
  R.next = { id: SQ[ni].id, i: ni, atMs: Math.floor(atMs / 1000) * 1000 };
}

/**
 * The coach takes the rifle never shown and clears it himself (see the header): a 'slow' fault in his words, the
 * mode left, the magazine out to a pouch (or the ground), the chamber emptied (its round thrown), the bolt home, the
 * hammer cocked, on safe, the port shut, the rifle slung front and shown: his "Clear.", the line ready to be called clear.
 */
export function coachClears(state, bus) {
  const R = rangeOf(state), pid = playerId(state), gunId = gunOn(state, pid), gun = state.items?.[gunId];
  // (once: a shooter not still at the next whole second after it (a step under way) gave the move-on again, a 'slow'
  // fault and "Clear." each second until still; the fixer's, 0.0.6)
  if (!R || R.end || R.shown || !gun) return;
  fault(state, bus, 'slow', 'warn', hashPick(COACH.take, 'coach', state.meta.seed, 'take'));
  if (state.stop) leaveStop(state, bus, 'coach');
  if (state.stop) state.stop = null;
  if (gun.mag) {
    const c = pouchFor(state, pid), me = playerActor(state);
    if (c) move(state, gun.mag, { container: c });
    else if (me) move(state, gun.mag, { ground: { area: KD_RANGE.area, x: me.x + 0.3, z: me.z + 0.1 } });
  }
  // (what was in the action comes out as he racks it: a double's loose round, then the chamber's content)
  const ch = gunField(gun, 'chamber'), kinds = gunField(gun, 'jam') ? ['round'] : [];
  if (ch) kinds.push(ch === 'case' ? 'case' : gunField(gun, 'set') === 'dud' ? 'dummy' : gunField(gun, 'load') === 'tracer' ? 'tracer' : 'round');
  if (kinds.length) recordEjects(state, pid, kinds, state.clock.ms, 'coach');
  for (const k of ['chamber', 'set', 'jam', 'locked', 'load', 'portOpen']) delete gun[k];
  delete gun.cocked; delete gun.mode;
  gun.belief = { chamber: 'empty' };
  const carry = state.people[pid]?.kit?.carry;
  if (carry) { carry.posture = 'slungFront'; delete carry.finger; }
  coachSays(state, bus, COACH.clear, 'clear', 'coach');
  R.shown = true;
}

/**
 * The coach on a magazine about to come out (or read 0 by a magazine check) with a round still chambered in a hot string
 * (0.0.6, DESIGN.md 2026-11-07: "You've one left up the spout. Fire it."): said once a string, before the change.
 * id the sub-step about to run ('magCheck' after its read). Writes R.spoutAt.
 */
export function spoutCheck(state, bus, id) {
  const R = rangeOf(state);
  // (0.0.8: not on the pairs course: no string there is fired to a magazine's last round, and Top up is its lesson)
  if (!R || R.end || !R.hot || R.spoutAt === R.string || R.course === 'pairs') return;
  const gun = state.items?.[gunOn(state, playerId(state))], mag = gun?.mag ? state.items[gun.mag] : null;
  if (!mag || (mag.n ?? 0) > 0 || gunField(gun, 'chamber') !== 'live' || gunField(gun, 'jam')) return;
  R.spoutAt = R.string;
  coachSays(state, bus, COACH.spout, 'spout', R.string);
  bus?.emit('range', { phase: 'spout', cmd: R.cmd?.id ?? null, hot: R.hot, rule: null, kind: null, text: null, via: id });
}

/** The magazine the string began with and the one about to be seated: the mark the panel shows (see the header), or null. */
export function oneMagWarn(state, magId) {
  const R = rangeOf(state);
  if (!R || R.end || !R.hot || !R.strMag || !magId || magId === R.strMag || COURSES[R.course]?.oneMag === false) return null;
  // (0.0.7: not while the kd course's string has a written change left (KD_STRINGS mags 2): magSeated draws no fault for it)
  if (R.course === 'kd' && (R.strSeats ?? 1) < (KD_STRINGS[R.string]?.mags ?? 1)) return null;
  return 'one magazine a string';
}

/**
 * A magazine of another kind than the course fires about to be seated (the panel's mark, the fixer's, 0.0.6): '<kind>:
 * the course is <load>' when the magazine is believed of another kind, else null. Never struck: firing it is no fault.
 */
export function kindWarn(state, mag) {
  const R = rangeOf(state), want = R?.load ?? 'ball', k = mag?.belief?.kind ?? null;
  return R && !R.end && k && k !== want ? `${k}: the course is ${want}` : null;
}

/** A magazine seated in the rifle (shooting.js runSub): one magazine a string, and a kind the course does not fire said once (see the header). */
export function magSeated(state, bus, magId) {
  const R = rangeOf(state);
  if (!R || R.end) return;
  // (the setup's tracer seated where the course fires ball: the coach says so once, no fault (the user's 2026-11-07 "we see
  // if it has ammo in and which kind before we decide" given its moment; the fixer's, 0.0.6))
  const m = state.items?.[magId], want = R.load ?? 'ball';
  if (m?.load && m.load !== want && !R.kindSaid) {
    R.kindSaid = true;
    coachSays(state, bus, COACH.kind.map(l => l.replaceAll('{kind}', m.load).replaceAll('{load}', want)), 'kind');
  }
  if (!R.hot) return;
  // (0.0.8: one magazine a string is waived on the pairs course (COURSES.pairs.oneMag false): string 4's RELOAD is the point)
  if (!R.strMag || COURSES[R.course]?.oneMag === false) { R.strMag = magId; return; }
  if (magId === R.strMag) return;
  // (0.0.7: the kd course's 200 m string is two magazines, the change inside it written into the course (KD_STRINGS mags 2))
  if (R.course === 'kd' && (R.strSeats = (R.strSeats ?? 1) + 1) <= (KD_STRINGS[R.string]?.mags ?? 1)) { R.strMag = magId; return; }
  R.strMag = magId;
  R.faults.push({ rule: 'onemag', kind: 'warn', atMs: state.clock.ms });
  const first = !R.oneMagSaid;
  R.oneMagSaid = true;
  if (first) sayOn(state, bus, { who: R.coachId, text: hashPick(COACH.onemag, 'coach', state.meta.seed, 'onemag'), kind: 'speech' });
  bus?.emit('range', { phase: 'fault', cmd: R.cmd?.id ?? null, hot: R.hot, rule: 'onemag', kind: 'warn', text: first ? COACH.onemag[0] : null });
}

// ---- faults and the stop ----

/** A fault on the line (the coach's word, the record, the fact): kind 'warn' or 'stop'. */
export function fault(state, bus, rule, kind, text, more = null) {
  const R = rangeOf(state);
  if (!R || R.end) return;
  R.faults.push({ rule, kind, atMs: state.clock.ms });
  if (text) sayOn(state, bus, { who: R.coachId, text, kind: 'speech' });
  bus?.emit('range', { phase: 'fault', cmd: R.cmd?.id ?? null, hot: R.hot, rule, kind, text: text ?? null, ...(more ?? {}) });
}

/** The stop: "Cease fire! Cease fire!", the coach takes the rifle, the end (see the header). */
/**
 * A range rule in words (carry.js rangeSafety's rules and the scenes' own): the toast's "Stopped: aimed at a person"
 * and the end card's, one place for both (the runtime review's of v0.0.7: the card printed the rule's id, "Stopped:
 * cold"). Data only.
 */
export const STOP_WORDS = Object.freeze({ muzzle: 'the muzzle off downrange', uprange: 'the muzzle uprange', person: 'aimed at a person', lane: 'another lane\'s card',
  walk: 'off the firing point', cold: 'a round on a cold line', ahead: 'ahead of the tower', finger: 'the finger on, moving', coach: 'the muzzle on the coach', nd: 'a negligent discharge',
  onemag: 'one magazine a string', slow: 'the line waited on you', forward: 'forward of the line', coldSafe: 'off safe on a cold line', flagged: 'the muzzle over a neighbour',
  declare: 'a false declaration', casualty: 'a casualty on the line', dry: 'out of rounds',
  // (0.0.8: the pairs course's)
  noshoot: 'a no-shoot hit', time: 'a string not engaged in its time',
  // (0.0.10, the runtime review's: the 'time' fault on a string fired at, its fact's fired (pairs.js stringEnd), so a shooter who
  // engaged is not told he did not)
  timeFired: 'time, and he was still up' });
/** A rule's words, or the rule itself if it has none. */
export const stopWords = (rule) => (rule ? STOP_WORDS[rule] ?? rule : null);

export function stopRange(state, bus, rule, text = null) {
  const R = rangeOf(state);
  if (!R || R.end) return;
  fault(state, bus, rule, 'stop', text ?? hashPick(COACH.stop, 'coach', state.meta.seed, 'stop', rule));
  endRange(state, bus, 'stopped', rule);
}

/** This tick's flags for range safety (runtime: R.$tick, gone with the tick): { ms, shot, ahead, moving, nd }. */
export function noteTick(state, flags = {}) {
  const R = rangeOf(state);
  if (!R) return null;
  const ms = state.clock.ms;
  if (!R.$tick || R.$tick.ms !== ms) R.$tick = { ms, shot: null, ahead: false, moving: false, nd: false };
  Object.assign(R.$tick, flags);
  return R.$tick;
}

/** The end of the session (see the header): the mode left, the rifle slung front, the fact with the summary. */
export function endRange(state, bus, phase, why = null) {
  const R = rangeOf(state);
  if (!R || R.end) return;
  R.end = { phase, atMs: state.clock.ms, why };
  R.phase = phase; R.hot = false;
  leaveStop(state, bus, phase === 'clear' ? 'scene' : 'stopped');
  const pid = playerId(state), carry = state.people[pid]?.kit?.carry;
  if (carry) { carry.posture = 'slungFront'; delete carry.finger; }
  const me = playerActor(state);
  if (me) delete me.headRad;
  const s = rangeNow(state).summary;
  bus?.emit('range', { phase, cmd: R.cmd?.id ?? null, hot: false, rule: why, kind: phase === 'stopped' ? 'stop' : null, text: null, why, score: s.score, of: s.of, v: s.v, n: s.shots });
}

/** The fast layer 'rules', the range's part (each tick lived): range safety's verdicts (see the header). */
export function rangeRules(state, input, bus) {
  const R = rangeOf(state);
  if (!R || R.end || state.skip || isHeld(state)) return;
  const pid = playerId(state), now = state.clock.ms, me = playerActor(state), L = R.course === 'kd' ? kdPoint(state) : R.course === 'pairs' ? { box: pairsBox(state) } : laneOf(R.lane);
  // (the minute the rifle in the hands left the firing point's box: the caller's clock for the walk rule)
  const inHand = !['slungFront', 'slungBack'].includes(state.people[pid]?.kit?.carry?.posture ?? 'slungFront');
  const out = !!me && inHand && !(me.x >= L.box[0] && me.x <= L.box[2] && me.z >= L.box[1] && me.z <= L.box[3]);
  if (out) R.outAtMs ??= now; else delete R.outAtMs;
  const t = R.$tick && R.$tick.ms === now ? R.$tick : null;
  // (a move key counts as moving only when the feet can move: in stop motion, or kneeling or prone, they are held,
  // and Q and D (KeyA, KeyD) step the brackets there; the code review's: D in a shot's recovery was a finger fault; in a
  // contact's window the feet are contact.js feetOf's, so a key held after the body's go is not moving)
  // (0.0.8, the fixer's: on the pairs course a discharge into the berm or the ground ahead (ND-1) is a fault, not the stop:
  // the scene scores the take-in, the rows and the reloads, and a sixth of the boot recruit's runs ended there before the
  // steel (the design review of v0.0.8); anywhere worse still stops the line)
  const ndFault = R.course === 'pairs' && !!t?.nd && t.ndGrade === 'ND-1';
  if (ndFault && !t.ndSaid) { t.ndSaid = true; fault(state, bus, 'nd', 'warn', hashPick(PAIRS_COACH.nd, 'coach', state.meta.seed, 'nd', now)); }
  const line = { ...rangeLine(state), warned: R.warned, outAtMs: R.outAtMs ?? null, shot: t?.shot ?? null, coldShots: R.coldShots ?? 0, ahead: !!t?.ahead,
    moving: !!t?.moving || (!feetHeld(state) && ((f) => !!(f.mx || f.mz))(feetOf(state, input))), nd: !!t?.nd && R.course !== 'kd' && !ndFault };
  const v = rangeSafety(state, pid, now, line);
  if (!v) return;
  for (const w of v.warn ?? []) {
    const at = R.warned[w.rule];
    if (at !== undefined && now - at < WARN_AGAIN_MS) continue;
    R.warned[w.rule] = now;
    fault(state, bus, w.rule, 'warn', w.text);
  }
  if (v.stop) stopRange(state, bus, v.stop.rule, v.stop.text);
}

/** The line as range safety reads it: { downrangeRad, box, lane, hot, targetKey, people, area, laneTargets }. */
export function rangeLine(state) {
  const R = rangeOf(state), L = R.course === 'kd' ? kdPoint(state) : R.course === 'pairs' ? { ...pairsPoint(state), box: pairsBox(state), lane: undefined } : laneOf(R.lane), me = playerActor(state);
  const people = (state.actors?.list ?? []).filter(a => a !== me && a.who).map(a => ({ who: a.who, actorId: a.id, x: a.x, z: a.z, y: a.y ?? 0, stance: a.stance ?? 'stand' }));
  // (the aim's target: held, or being brought onto: an aim at a person is the fault from the moment it is chosen)
  const S = state.stop, targetKey = S?.aim?.key ?? (S?.doing?.list?.[S.doing.i] === 'aim' ? S.doing.aimKey ?? null : null);
  return { downrangeRad: KD_RANGE.downrangeRad, box: L.box, lane: R.course === 'kd' ? L.lane : R.course === 'pairs' ? undefined : R.lane, hot: R.hot, targetKey, people, area: KD_RANGE.area,
    coachId: R.coachId, cmd: R.cmd?.id ?? null };
}

/** A command macro chosen: ahead of the tower, a warning (see the header). Returns whether it was ahead. */
export function aheadOf(state, bus, macroId) {
  const R = rangeOf(state), want = cmdOfMacro(macroId);
  if (!R || R.end || !want || macroId === 'cease') return false;
  const wants = Array.isArray(want) ? want : [want];
  // (given already: the tower has said that command at some point of the sequence so far)
  // (0.0.7: the kd course says LOAD and MAKE READY at each line: given already means in this stage of it)
  const given = seqOf(R).slice(0, (R.cmd?.i ?? -1) + 1).filter(c => R.course !== 'kd' || c.stage === seqOf(R)[R.cmd.i].stage);
  if (R.cmd && given.some(c => wants.includes(c.id))) return false;
  // (a RELOAD while a string is fired is one magazine a string's fault, counted when the magazine is seated (0.0.6))
  if (R.hot && macroId.startsWith('reload:')) return false;
  // (0.0.8: on the pairs course a reload is the shooter's own, never ahead of the coach: Top up in a lull is its lesson)
  if (R.course === 'pairs' && macroId.startsWith('reload:')) return false;
  noteTick(state, { ahead: true });
  return true;
}

// ---- the shots and the steps ----

// (the ammunition issue a round of a kind was counted on: the course's, or the mixed setup's tracer line)
const issueOf = (state, R, load) => state.armoury.ammoIssues.find(a => a.id === (load && R.issueIds?.[load] ? R.issueIds[load] : R.issueId));

/** A shot resolved (shot.js resolveShot): the session's records, the issue's count, a cold line's fault, the stoppage noted. */
export function recordShot(state, bus, shot) {
  const R = rangeOf(state);
  if (!R) return;
  if (R.course === 'kd') { recordKdShot(state, bus, shot); return; }
  if (R.course === 'pairs') { pairsShot(state, bus, shot); return; }
  if (shot.fired) {
    const issue = issueOf(state, R, shot.load);
    if (issue) issue.fired += 1;
    // (how it was shot, for the coach's tip: held to +4, unheld, or rushed; a natural 1)
    const mods = shot.roll?.mods ?? [], care = mods.some(m => m.src === 'tempo' && m.v < 0) ? 'rushed' : mods.some(m => m.why === 'the aim held' && m.v >= 4) ? 'held' : 'unheld';
    R.shots.push({ id: shot.id, atMs: shot.atMs, lane: shot.lane, string: R.string, hole: shot.hole?.at ?? null, score: shot.hole?.score ?? 0, v: !!shot.hole?.v, logSeq: shot.logSeq, care, ...(shot.roll?.nat === 1 ? { nat1: true } : {}), ...(shot.load && shot.load !== 'ball' ? { load: shot.load } : {}) });
    if (R.shots.length > SHOTS_KEPT) R.shots.splice(0, R.shots.length - SHOTS_KEPT);
    if (shot.brassRec) { R.brass.push(shot.brassRec); if (R.brass.length > BRASS_LIVE) R.brass.splice(0, R.brass.length - BRASS_LIVE); }
    if (R.end) return;
    if (!R.hot) R.coldShots = (R.coldShots ?? 0) + 1;
    noteTick(state, { shot: { lane: shot.lane ?? undefined } });
  }
  if ((!shot.fired && shot.why === 'dud') || shot.stoppage) R.stoppage = { atMs: shot.atMs, kind: shot.set ?? (shot.stoppage === 'double' ? 'double' : shot.stoppage ? 'stovepipe' : 'dud'), set: !!shot.set, cleared: false };
}

/**
 * A shot recorded on the kd course (0.0.7; see the header): the player's and the relay's alike on R.shots with its
 * shooter, its line, its string (its index in R.strings, strN) and its group on the zero card; the player's own on
 * their issue, their faults and their stoppage as fam25's; every case thrown with its shooter (brass.js counts the
 * player's); the pits' marking (range.js kdShot).
 */
function recordKdShot(state, bus, shot) {
  const R = rangeOf(state), pid = playerId(state), mine = (shot.who ?? pid) === pid;
  if (shot.fired) {
    if (mine) { const issue = issueOf(state, R, shot.load); if (issue) issue.fired += 1; }
    const mods = shot.roll?.mods ?? [], care = mods.some(m => m.src === 'tempo' && m.v < 0) ? 'rushed' : mods.some(m => m.why === 'the aim held' && m.v >= 4) ? 'held' : 'unheld';
    const rec = { id: shot.id, who: shot.who ?? pid, atMs: shot.atMs, lane: shot.lane, line: R.line ?? 25, string: R.string, strN: R.strings?.length ? R.strings.length - 1 : null,
      hole: shot.hole?.at ?? null, score: shot.hole?.score ?? 0, v: !!shot.hole?.v, logSeq: shot.logSeq, care,
      ...(R.string === 'zero' ? { group: (R.groups?.length ?? 1) - 1 } : {}), ...(shot.berm ? { berm: true } : {}), ...(shot.roll?.nat === 1 ? { nat1: true } : {}), ...(shot.load && shot.load !== 'ball' ? { load: shot.load } : {}) };
    R.shots.push(rec);
    if (R.shots.length > SHOTS_KEPT) R.shots.splice(0, R.shots.length - SHOTS_KEPT);
    // (the player's own on the string and the zero's group, so their scores outlive SHOTS_KEPT and the relay's many)
    if (mine && R.strings?.length && R.hot) {
      const str = R.strings.at(-1), h = { id: shot.id, at: rec.hole, score: rec.score, v: rec.v };
      str.shots.push(shot.id); (str.holes ??= []).push(h);
      // (the zero's group keeps the turrets each round was fired at, so the coach can pool the groups: paper.js poolOf)
      if (R.string === 'zero' && R.groups?.length) (R.groups.at(-1).holes ??= []).push({ ...h, sight: { elev: 0, wind: 0, ...(state.items[gunOn(state, pid)]?.sight ?? {}) } });
    }
    if (shot.brassRec) { R.brass.push({ ...shot.brassRec, who: shot.who ?? pid }); if (R.brass.length > BRASS_LIVE) R.brass.splice(0, R.brass.length - BRASS_LIVE); }
    kdShot(state, bus, shot, rec);
    if (R.end || !mine) return;
    if (!R.hot) R.coldShots = (R.coldShots ?? 0) + 1;
    noteTick(state, { shot: { lane: shot.lane ?? undefined } });
  }
  if (mine && ((!shot.fired && shot.why === 'dud') || shot.stoppage)) R.stoppage = { atMs: shot.atMs, kind: shot.set ?? (shot.stoppage === 'double' ? 'double' : shot.stoppage ? 'stovepipe' : 'dud'), set: !!shot.set, cleared: false };
}

/**
 * What a handling step threw out of the port (firearms.js doAction's ejects: 'round', 'dummy' from the
 * coach's dud, 'case' from a stovepipe), stored as the session's brass so the stage draws the orange
 * dummy and the stripped round flying and lying (look.js ejectCase: a hand's throw for a round or the
 * dummy, at HAND_EJECT_K of the port's speed). key: the step's, so each record's hash is its own.
 */
export function recordEjects(state, pid, ejects, atMs, key) {
  const R = rangeOf(state), me = playerActor(state), gun = state.items?.[gunOn(state, pid)];
  if (!R || !me || !gun || !ejects?.length) return [];
  const recs = ejects.map(kind => ejectCase(gun, { ...carryOf(state, pid), x: me.x, z: me.z, hand: kind !== 'case' }, { atMs, kind, key: `${key}:${atMs}:${kind}`, gMs2: caseGMs2(state) }));
  if (R.course === 'kd') for (const r of recs) r.who = pid;
  R.brass.push(...recs);
  if (R.brass.length > BRASS_LIVE) R.brass.splice(0, R.brass.length - BRASS_LIVE);
  // (what landed and when, for the step's fact: the sound's tick on the regolith (the runtime review's: a cleared case
  // and a stripped round made none))
  return recs.map(r => ({ kind: r.kind, landMs: r.landMs, at: r.at }));
}

/**
 * A round fired by a handling step, not a shot (a negligent discharge: firearms.js doAction's fired, a function
 * check on a round, a fumble with the finger in the guard): the issue counts it and its case flies and lies as
 * a shot's does, so the issue's fired matches the rounds the rifle counted (the code review's: the issue said 0
 * of 15 after an ND, and no case was thrown). f: the pull's result; a stoppage keeps its case.
 */
export function recordDischarge(state, bus, pid, f, atMs, key) {
  const R = rangeOf(state);
  if (!R || !f?.fired) return [];
  const issue = issueOf(state, R, f.load);
  if (issue) issue.fired += 1;
  return f.stoppage ? [] : recordEjects(state, pid, ['case'], atMs, `nd:${key}`);
}

/** A step begun (shooting.js startStep): the record; on the pairs course a reload's purpose read at its start (pairs.js pairsStepStart). */
export function onStepStart(state, bus, d) {
  if (rangeOf(state)?.course === 'pairs') pairsStepStart(state, bus, d);
  return d;
}

/** A step ended (shooting.js endStep): the show's verdict, the stoppage cleared and the coach's word, a discharge's stop. */
export function afterStep(state, bus, d, why) {
  const R = rangeOf(state);
  if (!R || R.end) return;
  const show = d.subs.find(s => s.action === 'show');
  if (show && !(why === 'halt' && d.list[d.i] === 'show')) R.shown = true;
  // (cleared once the gun holds no jam and no case or dud: a round in, or locked back on an empty magazine, as a
  // double on a magazine's 4th round leaves it, its 5th stripped; the code review's: counted only on 'live', the
  // coach's word came a string late or never)
  if (R.stoppage && !R.stoppage.cleared) {
    const gun = state.items[gunOn(state, playerId(state))];
    if (gun && !gunField(gun, 'jam') && !['case', 'dud'].includes(gunField(gun, 'chamber'))) {
      R.stoppage.cleared = true;
      if (R.stoppage.set) coachSays(state, bus, COACH.set[R.stoppage.kind] ?? COACH.set.dud, 'set', R.stoppage.kind);
      if (R.stoppage.set && R.dummy) R.dummy.cleared = true;
    }
  }
  // (0.0.8: the pairs course's: the reloads by purpose, the short magazine, the lull, the string's end)
  if (R.course === 'pairs') pairsAfterStep(state, bus, d, why);
}

// ---- the view ----

/** The session as the hud and the bots read it (see the header), or null. */
export function rangeNow(state, ms = state.clock.ms) {
  const R = rangeOf(state);
  if (!R) return null;
  if (R.course === 'kd') return kdRangeNow(state, R, ms);
  if (R.course === 'pairs') return pairsRangeNow(state, R, ms);
  const mine = R.shots.filter(s => s.lane === R.lane);
  const s = scoreOf(mine.map(h => ({ at: h.hole, score: h.score, v: h.v })));
  const strings = [0, 1, 2].map(k => ({ ...scoreOf(mine.filter(h => h.string === k).map(h => ({ at: h.hole, score: h.score, v: h.v }))), ...(R.sat?.includes(k) ? { sat: true } : {}), ...(R.over?.includes(k) ? { over: true } : {}) }));
  const L = laneOf(R.lane);
  return {
    course: R.course, lane: R.lane, phase: R.phase, string: R.string, cmd: R.cmd?.id ?? null, cmdI: R.cmd?.i ?? null, cmdAtMs: R.cmd?.atMs ?? null, hot: R.hot,
    observerId: R.coachId, roId: R.roId, paper: PAPERS[COURSES[R.course].paper] ? COURSES[R.course].paper : 'card25',
    line: { lane: R.lane, box: L.box, fp: L.fp, target: L.target, downrangeRad: KD_RANGE.downrangeRad },
    strings, end: R.end,
    summary: { score: s.score, of: s.of, v: s.v, shots: s.shots, hits: s.hits, groupCm: s.groupCm, faults: R.faults.length, clearAtMs: R.end?.phase === 'clear' ? R.end.atMs : null, sat: R.sat?.length ?? 0, over: R.over?.length ?? 0 },
    dry: !!R.dry,
  };
}

// (0.0.7: rangeNow's shape on the kd course, its summary kdNow's line (the end card's: the build sheet 0.0.7 §2.3))
function kdRangeNow(state, R, ms) {
  const K = kdNow(state, ms), P = kdPoint(state), pid = playerId(state);
  const mine = R.shots.filter(s => s.who === pid);
  const s = scoreOf(mine.map(h => ({ at: h.hole, score: h.score, v: h.v })));
  return {
    course: R.course, lane: P?.lane ?? R.lane, phase: R.phase, string: R.string, cmd: R.cmd?.id ?? null, cmdI: R.cmd?.i ?? null, cmdAtMs: R.cmd?.atMs ?? null, hot: R.hot,
    observerId: R.coachId, roId: R.roId, paper: R.paper ?? 'zero25',
    line: P ? { lane: P.lane, box: P.box, fp: P.fp, target: P.target ?? null, face: P.face ?? null, downrangeRad: KD_RANGE.downrangeRad, line: P.line } : null,
    strings: K.strings, end: R.end, kd: K, incident: K.incident,
    summary: K.summary, score: { score: s.score, of: s.of, v: s.v, shots: s.shots, hits: s.hits, faults: R.faults.length, clearAtMs: R.end?.phase === 'clear' ? R.end.atMs : null },
    dry: !!R.dry,
  };
}
