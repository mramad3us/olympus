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
// The fill (testHandling): the barracks drawn (Echo Company, the player), the clock at 09:00, the player
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
// time is said again with the lane ("Lane four, LOAD."). The coach (say kind 'speech') speaks at the
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
import { TICK_MS, holdTime, isHeld } from '../../core/clock.js';
import { msAtMarsTime } from '../../core/calendar.js';
import { stream, int, intIn, pick, weighted } from '../../core/rng.js';
import { hashPick } from '../../core/hash.js';
import { nextId, playerActor, playerId } from '../../core/ids.js';
import { post } from '../../core/queue.js';
import { START_MS, SITES } from '../../data/setting/calendar.js';
import { SCENES } from '../../data/scenes.js';
import { COURSES, SEQ, COACH, MACRO_CMD, MACRO_MARK } from '../../data/courses.js';
import { KD_RANGE } from '../../data/places/range.js';
import { logEntry } from '../log.js';
import { siteOf } from '../places/model.js';
import { setOutfit, syncActors } from '../people/place.js';
import { drawStaff, setPost, staffName } from '../people/staff.js';
import { startBody } from '../body/body.js';
import { deltaOf } from '../body/record.js';
import { rollSheet, tierOfRank } from '../skills/templates.js';
import { barracks } from './barracks.js';
import { setLedgers } from './tests.js';
import { materialise, move } from '../arms/kit.js';
import { newMag, feed, conditionOf, gunField } from '../arms/firearms.js';
import { rangeSafety, carryOf } from '../arms/carry.js';
import { scoreOf, PAPERS } from '../arms/paper.js';
import { enterStop, leaveStop, gunOn } from '../arms/shooting.js';
import { BRASS_LIVE, ejectCase } from '../arms/look.js';
import { feetHeld } from '../time/doing.js';

/** Where the scene plays. */
export const HANDLING = Object.freeze({ site: 'melas', area: KD_RANGE.area, course: 'fam25' });
/** The session keeps this many shots and this many cases (the build sheet §3, §4). */
export const SHOTS_KEPT = 100;
/** A rule's warning again no sooner than this (tradecraft's WARN_AGAIN_S), ms. */
export const WARN_AGAIN_MS = 20_000;
/** The radio box's cadence (tradecraft's earpiece): a line lives this long and this much a word, ms. */
export const SAY_MS = 3_500, SAY_WORD_MS = 330;
const LANE_WORD = Object.freeze(['zero', 'one', 'two', 'three', 'four', 'five', 'six']);
/** The tower's commands said again with the lane (a nudge). */
export const NUDGE = Object.freeze({ prone: 'the prone position.', load: 'LOAD.', ready: 'MAKE READY.', fire: 'commence fire.', cease: 'CEASE FIRE.',
  kneel: 'kneeling. RELOAD.', stand: 'standing. RELOAD.', clear: 'UNLOAD, SHOW CLEAR.' });

/** The session, or null. */
export const rangeOf = (state) => state.armoury?.range ?? null;
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

const lonOf = () => SITES[siteOf(HANDLING.site)?.geo]?.lonEDeg ?? 0;

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

/** The fill of 'test-handling' (see the header). setup: null | 'hot' | 'bench'. */
export function testHandling(state, { at = null, setup = null } = {}) {
  const scene = SCENES['test-handling'], C = COURSES[scene.course ?? HANDLING.course], seed = state.meta.seed, lon = lonOf();
  if (state.clock.ms === START_MS && scene.hour !== null) {
    const h = Math.floor(scene.hour), m = Math.round((scene.hour - h) * 60);
    state.clock.ms = state.meta.createdMs = Math.ceil(msAtMarsTime(state.clock.ms, h, m, lon) / TICK_MS) * TICK_MS;
  }
  const lane = drawLane(seed, HANDLING.course), L = laneOf(lane);
  barracks(state, { at: { area: KD_RANGE.area, x: L.fp.x, z: L.fp.z, face: 'right', ...(at ?? {}) } });
  const me = playerActor(state), pid = playerId(state), person = state.people[pid];
  setOutfit(me, scene.outfit);
  person.body = deltaOf(setLedgers(startBody(person, state.clock.ms, lon, seed), scene.body ?? {}));
  person.skills = rollSheet(seed, pid, tierOfRank(person.service?.rank));
  const set = setup === 'bench' ? null : drawSet(seed, HANDLING.course);
  const kit = materialise(state, pid, C.kit, { sets: set ? { [set.mag]: { n: set.n, kind: set.kind } } : {} });
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
  state.armoury.ammoIssues.push({ id: issueId, atMs: now, area: KD_RANGE.area, toId: pid, cal: '6.5x40r', load: 'ball', n: rounds, fired: 0 });
  const R = state.armoury.range = {
    course, lane, fp: L.fixtures.fp, roId, coachId, issueId, setMagId: set && kit ? kit.magIds[set.mag - 1] : null,
    set: set ? { mag: set.mag, n: set.n, kind: set.kind } : null, phase: 'brief', string: -1, hot: false, cmd: null, next: null,
    shots: [], brass: [], faults: [], warned: {}, end: null, livedMs: 0, nudged: false, stoppage: null, shown: false,
  };
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

/** Whether the line is ready for a command's next (see the header: what the RO can see). */
export function lineReady(state, cmdId = rangeOf(state)?.cmd?.id) {
  const R = rangeOf(state);
  if (!R || !R.cmd) return false;
  const def = SEQ[R.cmd.i] ?? SEQ.find(c => c.id === cmdId);
  const pid = playerId(state), me = playerActor(state), gun = state.items?.[gunOn(state, pid)];
  const S = state.stop, still = !S || !S.doing || S.doing.kind === 'wait';
  if (!me || !gun) return false;
  const mag = gun.mag ? state.items[gun.mag] : null, finger = state.people[pid]?.kit?.carry?.finger ?? 'off';
  switch (def.ready) {
    case 'always': return true;
    case 'prone': return still && me.stance === 'prone';
    case 'magIn': return still && !!gun.mag;
    case 'cond1': return still && conditionOf(gun) === 1;
    case 'emptyLocked': return still && !!gunField(gun, 'locked') && !!mag && mag.n === 0;
    case 'safe': return still && gunField(gun, 'mode') === 'safe' && finger !== 'on';
    case 'kneel1': return still && me.stance === 'kneel' && conditionOf(gun) === 1;
    case 'stand1': return still && !me.stance && conditionOf(gun) === 1;
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
  const def = SEQ[i];
  if (!def || def.id !== cmd) return;
  const now = state.clock.ms;
  R.cmd = { id: cmd, i, atMs: now }; R.next = null; R.livedMs = 0; R.nudged = false;
  sayOn(state, bus, { who: R.roId, text: hashPick(def.say, 'range-cmd', state.meta.seed, i), kind: 'pa' });
  if (cmd === 'brief') { R.phase = 'brief'; coachSays(state, bus, COACH.brief, 'brief'); }
  else if (cmd === 'fire') { R.hot = true; R.phase = 'string'; R.string = def.string; }
  else if (cmd === 'cease') { R.hot = false; R.phase = 'cmd'; stringScore(state, bus, def.string); }
  else if (cmd !== 'end') R.phase = 'cmd';
  bus?.emit('range', { phase: 'cmd', cmd, hot: R.hot, rule: null, kind: null, text: null });
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
  const s = scoreOf(holes);
  // (the string shot by shot, a miss as 0, so PAPER's line reads every shot in order (the runtime review's: it read
  // the holes on the card, leaving the misses out))
  bus?.emit('range', { phase: 'string', cmd: 'cease', hot: false, n: k + 1, score: s.score, of: s.of, v: s.v, hits: s.hits, shots: s.shots, list: mine.map(x => ({ score: x.score ?? 0, v: !!x.v, hit: !!x.hole })) });
  // (the tip by how the string was shot: haste lines only where a shot was rushed or unheld (see courses.js COACH))
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
export function rangeSecond(state, input, bus) {
  if (state.clock.ms % 1000 !== 0) return;
  const R = rangeOf(state);
  if (!R || R.end || !R.cmd) return;
  R.livedMs += 1000;
  const i = R.cmd.i, C = COURSES[R.course];
  if (!R.next && i + 1 < SEQ.length && lineReady(state, R.cmd.id)) {
    const gap = i === 0 ? C.firstGapMs : intIn(stream(state.meta.seed, 'range:gap', i + 1), C.roGapMs[0], C.roGapMs[1]);
    const atMs = state.clock.ms + gap;
    post(state, { atMs, prio: 2, kind: 'range-cmd', src: 'arms:range', payload: { cmd: SEQ[i + 1].id, i: i + 1 } });
    R.next = { id: SEQ[i + 1].id, i: i + 1, atMs: Math.floor(atMs / 1000) * 1000 };
    return;
  }
  if (!R.next && !R.nudged && i > 0 && R.livedMs >= C.nudgeMs && NUDGE[R.cmd.id]) {
    R.nudged = true;
    sayOn(state, bus, { who: R.roId, text: `Lane ${LANE_WORD[R.lane] ?? R.lane}, ${NUDGE[R.cmd.id]}`, kind: 'pa' });
  }
}

// ---- faults and the stop ----

/** A fault on the line (the coach's word, the record, the fact): kind 'warn' or 'stop'. */
export function fault(state, bus, rule, kind, text) {
  const R = rangeOf(state);
  if (!R || R.end) return;
  R.faults.push({ rule, kind, atMs: state.clock.ms });
  if (text) sayOn(state, bus, { who: R.coachId, text, kind: 'speech' });
  bus?.emit('range', { phase: 'fault', cmd: R.cmd?.id ?? null, hot: R.hot, rule, kind, text: text ?? null });
}

/** The stop: "Cease fire! Cease fire!", the coach takes the rifle, the end (see the header). */
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
  const pid = playerId(state), now = state.clock.ms, me = playerActor(state), L = laneOf(R.lane);
  // (the minute the rifle in the hands left the firing point's box: the caller's clock for the walk rule)
  const inHand = !['slungFront', 'slungBack'].includes(state.people[pid]?.kit?.carry?.posture ?? 'slungFront');
  const out = !!me && inHand && !(me.x >= L.box[0] && me.x <= L.box[2] && me.z >= L.box[1] && me.z <= L.box[3]);
  if (out) R.outAtMs ??= now; else delete R.outAtMs;
  const t = R.$tick && R.$tick.ms === now ? R.$tick : null;
  // (a move key counts as moving only when the feet can move: in stop motion, or kneeling or prone, they are held,
  // and Q and D (KeyA, KeyD) step the brackets there; the code review's: D in a shot's recovery was a finger fault)
  const line = { ...rangeLine(state), warned: R.warned, outAtMs: R.outAtMs ?? null, shot: t?.shot ?? null, coldShots: R.coldShots ?? 0, ahead: !!t?.ahead,
    moving: !!t?.moving || (!feetHeld(state) && !!(input?.mx || input?.mz)), nd: !!t?.nd };
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
  const R = rangeOf(state), L = laneOf(R.lane), me = playerActor(state);
  const people = (state.actors?.list ?? []).filter(a => a !== me && a.who).map(a => ({ who: a.who, actorId: a.id, x: a.x, z: a.z, y: a.y ?? 0, stance: a.stance ?? 'stand' }));
  // (the aim's target: held, or being brought onto: an aim at a person is the fault from the moment it is chosen)
  const S = state.stop, targetKey = S?.aim?.key ?? (S?.doing?.list?.[S.doing.i] === 'aim' ? S.doing.aimKey ?? null : null);
  return { downrangeRad: KD_RANGE.downrangeRad, box: L.box, lane: R.lane, hot: R.hot, targetKey, people, area: KD_RANGE.area,
    coachId: R.coachId, cmd: R.cmd?.id ?? null };
}

/** A command macro chosen: ahead of the tower, a warning (see the header). Returns whether it was ahead. */
export function aheadOf(state, bus, macroId) {
  const R = rangeOf(state), want = cmdOfMacro(macroId);
  if (!R || R.end || !want || macroId === 'cease') return false;
  const wants = Array.isArray(want) ? want : [want];
  // (given already: the tower has said that command at some point of the sequence so far)
  if (R.cmd && SEQ.slice(0, R.cmd.i + 1).some(c => wants.includes(c.id))) return false;
  noteTick(state, { ahead: true });
  return true;
}

// ---- the shots and the steps ----

/** A shot resolved (shot.js resolveShot): the session's records, the issue's count, a cold line's fault, the stoppage noted. */
export function recordShot(state, bus, shot) {
  const R = rangeOf(state);
  if (!R) return;
  if (shot.fired) {
    const issue = state.armoury.ammoIssues.find(a => a.id === R.issueId);
    if (issue) issue.fired += 1;
    // (how it was shot, for the coach's tip: held to +4, unheld, or rushed; a natural 1)
    const mods = shot.roll?.mods ?? [], care = mods.some(m => m.src === 'tempo' && m.v < 0) ? 'rushed' : mods.some(m => m.why === 'the aim held' && m.v >= 4) ? 'held' : 'unheld';
    R.shots.push({ id: shot.id, atMs: shot.atMs, lane: shot.lane, string: R.string, hole: shot.hole?.at ?? null, score: shot.hole?.score ?? 0, v: !!shot.hole?.v, logSeq: shot.logSeq, care, ...(shot.roll?.nat === 1 ? { nat1: true } : {}) });
    if (R.shots.length > SHOTS_KEPT) R.shots.splice(0, R.shots.length - SHOTS_KEPT);
    if (shot.brassRec) { R.brass.push(shot.brassRec); if (R.brass.length > BRASS_LIVE) R.brass.splice(0, R.brass.length - BRASS_LIVE); }
    if (R.end) return;
    if (!R.hot) R.coldShots = (R.coldShots ?? 0) + 1;
    noteTick(state, { shot: { lane: shot.lane ?? undefined } });
  }
  if ((!shot.fired && shot.why === 'dud') || shot.stoppage) R.stoppage = { atMs: shot.atMs, kind: shot.set ?? (shot.stoppage === 'double' ? 'double' : shot.stoppage ? 'stovepipe' : 'dud'), set: !!shot.set, cleared: false };
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
  const recs = ejects.map(kind => ejectCase(gun, { ...carryOf(state, pid), x: me.x, z: me.z, hand: kind !== 'case' }, { atMs, kind, key: `${key}:${atMs}:${kind}` }));
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
  const issue = state.armoury.ammoIssues.find(a => a.id === R.issueId);
  if (issue) issue.fired += 1;
  return f.stoppage ? [] : recordEjects(state, pid, ['case'], atMs, `nd:${key}`);
}

/** A step begun (shooting.js startStep): nothing the range needs yet but the record. */
export function onStepStart(state, bus, d) { return d; }

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
    }
  }
}

// ---- the view ----

/** The session as the hud and the bots read it (see the header), or null. */
export function rangeNow(state, ms = state.clock.ms) {
  const R = rangeOf(state);
  if (!R) return null;
  const mine = R.shots.filter(s => s.lane === R.lane);
  const s = scoreOf(mine.map(h => ({ at: h.hole, score: h.score, v: h.v })));
  const strings = [0, 1, 2].map(k => scoreOf(mine.filter(h => h.string === k).map(h => ({ at: h.hole, score: h.score, v: h.v }))));
  const L = laneOf(R.lane);
  return {
    course: R.course, lane: R.lane, phase: R.phase, string: R.string, cmd: R.cmd?.id ?? null, cmdI: R.cmd?.i ?? null, cmdAtMs: R.cmd?.atMs ?? null, hot: R.hot,
    observerId: R.coachId, roId: R.roId, paper: PAPERS[COURSES[R.course].paper] ? COURSES[R.course].paper : 'card25',
    line: { lane: R.lane, box: L.box, fp: L.fp, target: L.target, downrangeRad: KD_RANGE.downrangeRad },
    strings, end: R.end,
    summary: { score: s.score, of: s.of, v: s.v, shots: s.shots, hits: s.hits, groupCm: s.groupCm, faults: R.faults.length, clearAtMs: R.end?.phase === 'clear' ? R.end.atMs : null },
  };
}
