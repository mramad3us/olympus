// OLYMPUS scenarios: test-stress, "Bang": five strings at 7 m on the 25 m bay's turners with the coach's noise, in ear defenders (ROADMAP §4.2's 0.0.7c row, its second patch, shipped as v0.0.10; COMBAT §5, §25.18.3; the build sheet 0.0.10 §2.2, §3, §8 items 2 to 10, 19).
//
// The course runs on pairs.js's engine (the sheet's §8 item 2): the session's course is 'pairs', so every door of
// handling.js, shooting.js, look.js and the instinct that reads the pairs course holds, and armoury.range.stress, present on
// this scene alone, selects the stress course's strings (drawStress), its sequence (courses.js SEQ_STRESS, through
// handling.js seqOf), its magazines (10, 10 and the coach's one-round magazine) and its noise. Each hook in pairs.js is
// guarded by R.stress, so test-pairs and "Three bangs" run to the tick. This module holds what is the stress course's own.
//
// The ground is authored (the bay of v0.0.5 with test-pairs' turners and painted lines; no new piece: the air horn and the
// blank-firing rifle are the coach's hands, drawn from rangeLook().stress, the sheet's §8 item 9); everything on it is
// procedural from the world's seed alone on named streams, never from the sheet played, so "Again as …" hears the same noise
// at the same times: the lane (drawLane(seed, 'stress')), each string's turner (stream(seed, 'stress:pick', k), COURSES.stress
// .draws.one: yours 0.5, a neighbour 0.25 each), what it holds (by hash, as pairs'), string 5's second turner (one of the two
// other lanes of the three, hash01(seed, 'stress:second')), the calm string's gap (stream(seed, 'stress:gap', k, attempt)),
// the noise's moments (stream(seed, 'stress:noise', k, attempt), the din's gaps on stream(seed, 'stress:din', attempt, i)) and
// the second turn (stream(seed, 'stress:turn2')).
//
// The strings (COURSES.stress.strings; one threat each, every one at 7 m): (1) 'calm', the turn at its gap; (2) 'din': an
// air horn sounds for din.hornS 2 s at the din's start and after every din.hornEvery-th blank, and the coach fires din.blanks
// 30 blanks at your left shoulder, his muzzle din.muzzleFwdM 0.8 m downrange of him, the first din.firstBlankMs into the din,
// then a drawn gap each; the din begins a drawn lead into the armed standby and the turn comes a drawn 8.5 to 10 s into it (after the
// second horn, about 20 blanks in: the fixer's of 0.0.10, so the recruit meets the turn under fire, not still calm), the
// blanks running on after it until the string ends (the coach stops); (3) 'called': the coach shouts "Bang!" call.callMs
// before he throws one onto the pad behind you (supp.js bang's call: heard, it is forewarned, COMBAT §5.1), the turn
// call.turnMs after the burst; (4) 'bangs': three bangs unannounced as "Three bangs"' (bangs.n, 1 s apart, the turn 2 s after
// the third); (5) 'reload': the same on the coach's one-round magazine, so the Pair runs the rifle dry (one up the spout, one
// in the magazine: the sheet's §8 item 10), and a second turner turns reload.turnMs 1.5 to 2.5 s after the RELOAD's start (a
// RELOAD, keep the empty, or Top up begun while the string runs), or reload.maxMs 10 s after the first turn if none came
// (never a dead end). The second turner's face is hung edge-on at the standby with the first's; it turns alone. While it is
// to turn the string neither ends by your safe (it is not yours to call) nor by its time; its time then runs STRING_MAX_MS
// past the second turn. The noise is planned at the string's first arming (planNoise, R.stress.plan, whole ticks); entering
// the mode or no longer being ready before its first event drops the plan (the string's attempt + 1), made again at the next
// arming; after it, the rest go on time and a re-armed turn comes no earlier than the planned one. Each event goes off once
// on lived ticks (stressActors, the pairs engine's arms 'actors' layer): 'horn' (the 'fx' horn on, supp.js dinOf each whole
// second it sounds, the 'fx' horn off), 'blank' (supp.js shotNoise at the coach's muzzle, blank: true, and the 'fx' blank),
// 'call' (the coach's speech, STRESS_COACH.call), 'bang' (supp.js bang, with the call when the string has one); events still
// to come at the string's end are dropped. The noise's start is the 'range' fact 'noise'. The coach's "Stop" after a noisy
// string waits until restMs has passed since his last noise (stressRested), so the next string's chaos starts from a pool
// mostly drained, the recruit's Breathe offered in it; he says why at it, and once the shooter stands ready and still with no
// Breathe offered the rest left goes behind the brief splash (stressRestSecond: 'stress-rest', a fast-forward of lived ticks).
//
// The record of each string (R.stress.strs[]: the sheet's §3) keeps what the card and the paper need: the felt and the pool
// at their peak and at the turn, the freeze (the startles the noise began, overlaps counted once, as "Three bangs"'), every
// rolled handling sub-step from its standby to its end with the felt it was rolled at (the fumbles), Off safe's tries on the
// live string below rung 2 (the paper's ✗ ✓), the Breathes, the RELOAD on string 5 (its start, its tries, the bolt home), the
// second turner's turn and take-in, the take-in's calm figure by the book (pairs.js calmOf), at its end the holes (every
// round fired at a turner: the truth of the hit card, arms/marks.js) and the inoculation (stressEnd: a string finished
// ('stopped', 'declared' or 'dry') at a felt peak of INOC_FELT 20 or more is an exposure for supp.js noteExposure with the
// cadre as teacher; a test sheet's counter never moves, so the record says what a career would have counted).
//
// stressNow(state, ms) is the end card's and the bots' view (the strings, the inoculation, the summary); stressLook(state,
// ms) the stage's (look.js rangeLook().stress: the coach, the horn, the blanks, the bangs); againAsStress(state, tier) what
// "Again as …" starts. The fill is testStress. Pure but testStress, the hooks and stressActors, which write the session.
import { TICK_MS } from '../../core/clock.js';
import { q } from '../../core/num.js';
import { msAtMarsTime } from '../../core/calendar.js';
import { stream, intIn, weighted } from '../../core/rng.js';
import { hashPick, hash01 } from '../../core/hash.js';
import { playerActor, playerId } from '../../core/ids.js';
import { START_MS, SITES } from '../../data/setting/calendar.js';
import { SCENES } from '../../data/scenes.js';
import { COURSES, STRESS_COACH } from '../../data/courses.js';
import { KD_RANGE, PAIRS, pairsLaneOf } from '../../data/places/range.js';
import { siteOf } from '../places/model.js';
import { setOutfit, syncActors } from '../people/place.js';
import { drawStaff, setPost } from '../people/staff.js';
import { startBody } from '../body/body.js';
import { deltaOf } from '../body/record.js';
import { testSheet, TEST_SHEETS, rungOf } from '../skills/templates.js';
import { barracks } from './barracks.js';
import { setLedgers } from './tests.js';
import { rangeOf, sayOn, drawLane, startRange } from './handling.js';
import { materialise, move, pouchesOf } from '../arms/kit.js';
import { gunField, ACTIONS } from '../arms/firearms.js';
import { gunOn } from '../arms/shooting.js';
import { turnerKey, turnTo, TURN_MS } from '../arms/turners.js';
import { takeInWords } from '../combat/react.js';
import { contactNow, pendingOf } from '../combat/contact.js';
import { bang, shotNoise, dinOf, blockOf, feltOf, bandOf, suppAt, hardOf, hardWord, inocOf, noteExposure, breatheOffer, INOC_FELT } from '../combat/supp.js';
import { pairsPoint, setupStandby, holdOf, calmOf, pairsWant, BANG_FELT } from './pairs.js';
import { startActivity } from '../time/activities.js';

/** The stress course's data (courses.js COURSES.stress): its strings by name, its noise. */
const C = COURSES.stress;
/** test-stress's setups (debug.js SETUPS lists them already, test-pairs' own): string k's "Standby" given, out of the mode, the turn armed; 'standby' is string 0's. */
export const STRESS_SETUPS = Object.freeze(['standby', 'standby:1', 'standby:2', 'standby:3', 'standby:4']);
/** The strings in order (0 to 4: the user's 1 to 5) and the paper's and the card's words for their noise. */
export const STRESS_STRINGS = C.strings;
export const NOISE_WORDS = Object.freeze({ calm: 'calm', din: 'din 30 blanks', called: 'bang called', bangs: 'three bangs', reload: 'three bangs, then the RELOAD' });
/** The string with the second turner and the RELOAD under the noise (k, the user's string 5). */
export const RELOAD_STRING = C.strings.indexOf('reload');
/** The ends that finish a string for the inoculation (the sheet's §8 item 19): stopped, declared on safe, or fired dry. */
export const FINISHED = Object.freeze(new Set(['stopped', 'declared', 'dry']));
// (the reload macros: a RELOAD (speed), RELOAD keeping the empty (retain), Top up (tactical); the parts of a reload a fumble fails)
const RELOAD_RE = /^macro:reload:(speed|retain|tactical)$/;
const RELOAD_PARTS = new Set(['reach', 'seat', 'release', 'charge', 'magOut:drop', 'magOut:pouch']);
// (a reload by its singles: the magazine out, the reach (a pouch's or at your feet), the seat, the bolt home, Charge, and the
// "Carry on" of a halted RELOAD)
const RELOAD_SINGLE = /^(magOut:(drop|pouch)|reach@\w+|seat|release|charge|queue)$/;
const SHOT_PARTS = new Set(['aim', 'hold', 'press', 'round', 'shift', 'fire', 'wait']);
const LABELS_OF = Object.freeze({ 'selector:semi': 'Off safe', 'selector:safe': 'On safe', reach: 'Reach', seat: 'Seat', release: 'Bolt home', 'magOut:drop': 'Drop the magazine', 'magOut:pouch': 'Magazine to a pouch', charge: 'Charge', up: 'Rifle up' });

const lonOf = () => SITES[siteOf('melas')?.geo]?.lonEDeg ?? 0;
const whole = (ms) => Math.ceil(ms / TICK_MS) * TICK_MS;
const tierOf = (tier) => (tier && TEST_SHEETS[tier] ? tier : SCENES['test-stress'].sheet);
const laneKey = (lane, off) => turnerKey(lane + off);
const turnerOf = (R, key) => (R?.turners ?? []).find(T => T.key === key) ?? null;
const actorOf = (state, pid) => state.actors?.list?.find(a => a.who === pid) ?? null;
/** The stress record of string k on the session, or null. */
export const recOf = (R, k) => (R?.stress?.strs ?? []).find(x => x.k === k) ?? null;
const planOf = (R, k) => (R?.stress?.plan ?? []).filter(e => e.k === k);
const fired = (e) => e.done || !!e.on;
// (the coach's word: never while a take-in runs, the window's silence (COMBAT §25.4.5))
function coachSay(state, bus, lines, ...key) {
  const R = rangeOf(state);
  if (!R || pendingOf(state)) return;
  sayOn(state, bus, { who: R.coachId, text: hashPick(lines, 'stress-coach', state.meta.seed, ...key), kind: 'speech' });
}

// ---- the draws (the seed alone) ----

/**
 * Every string's draw from the seed alone (see the header): [{ k, name, line: 7, keys, faces, holds, gapMs, second }], keys
 * the string's turners (string 5's second turner last, keys[1], its key in second), every face a threat.
 */
export function drawStress(seed, lane) {
  return C.strings.map((name, k) => {
    const own = laneKey(lane, weighted(stream(seed, 'stress:pick', k), C.draws.one));
    let second = null;
    if (name === 'reload') {
      const others = [-1, 0, 1].map(off => laneKey(lane, off)).filter(key => key !== own);
      second = others[hash01(seed, 'stress:second') < 0.5 ? 0 : 1];
    }
    const keys = second ? [own, second] : [own], faces = {}, holds = {};
    for (const key of keys) { faces[key] = 'threat'; holds[key] = holdOf(seed, k, key, 'threat'); }
    return { k, name, line: 7, keys, faces, holds, gapMs: gapOf(seed, k, 0), second };
  });
}
/** The calm string's gap from "Standby" to the turn for string k's attempt (ms, whole ticks). */
export const gapOf = (seed, k, attempt = 0) => whole(intIn(stream(seed, 'stress:gap', k, attempt), C.standbyMs[0], C.standbyMs[1]));

// ---- the fill ----

/** The fill of 'test-stress' (see the header). tier: a TEST_SHEETS id (the boot recruit by default); setup: null | 'standby' | 'standby:<k>'. */
export function testStress(state, { at = null, setup = null, tier = null } = {}) {
  const scene = SCENES['test-stress'], seed = state.meta.seed, lon = lonOf(), sheet = tierOf(tier);
  if (state.clock.ms === START_MS && scene.hour !== null) {
    const h = Math.floor(scene.hour), m = Math.round((scene.hour - h) * 60);
    state.clock.ms = state.meta.createdMs = Math.ceil(msAtMarsTime(state.clock.ms, h, m, lon) / TICK_MS) * TICK_MS;
  }
  const lane = drawLane(seed, 'stress'), L = pairsLaneOf(lane), P = L.points[7];
  barracks(state, { at: { area: KD_RANGE.area, x: P.fp.x, z: P.fp.z, face: 'right', ...(at ?? {}) } });
  const me = playerActor(state), pid = playerId(state), person = state.people[pid];
  setOutfit(me, scene.outfit);
  person.body = deltaOf(setLedgers(startBody(person, state.clock.ms, lon, seed), scene.body ?? {}));
  // (the test sheet, on the scene's player only: scenes never write a career; its inoculation fixed)
  person.skills = testSheet(sheet);
  // (the 'range-pairs' issue, its ear defenders worn and kept on (the sheet's §8 item 8); its third magazine the coach's
  // one-round one, loaded with one where the issue's has two)
  const kit = materialise(state, pid, C.kit);
  const short = state.items[kit.magIds[2]];
  short.n = C.mags[2];
  if (short.belief) short.belief.n = C.mags[2];
  const pouches = pouchesOf(state, pid).filter(p => !p.dump);
  kit.magIds.forEach((id, i) => { const p = pouches[(C.pouches[i] ?? i + 1) - 1]; if (p && !p.mags.includes(id)) move(state, id, { container: p.id }); });
  const coachId = drawStaff(state, 'melas:kd-coach');
  setPost(state, coachId, { area: KD_RANGE.area, x: P.coach.x, z: P.coach.z, face: P.coach.face });
  syncActors(state);
  const R = startRange(state, null, { course: 'pairs', lane, kit, roId: coachId, coachId });
  // (the issue's count is the stress course's magazines, not the pairs course's startRange summed)
  const issue = state.armoury.ammoIssues.find(a => a.id === R.issueId);
  if (issue) issue.n = C.mags.reduce((a, b) => a + b, 0);
  const [ten1, ten2, one] = kit.magIds;
  Object.assign(R, {
    sheet, line: 7, mags: { ten1, ten2, short: one }, wantMag: null,
    turners: PAIRS.lanes.map(T => ({ key: turnerKey(T.lane), lane: T.lane, x: T.turner.x, z: T.turner.z, y: PAIRS.face.centreY, face: null, holds: null, turnAtMs: null, awayAtMs: null, hits: [], stoppedAtMs: null })),
    str: null, strs: [], reloads: [], lull: null,
    stress: { strs: [], plan: [], inoc: [], froze: [], offSafe: null, lastStepMs: null, breathe: [] },
  });
  if (setup && /^standby(:\d)?$/.test(setup)) setupStandby(state, Number(setup.split(':')[1] ?? 0));
  return state;
}

// ---- the strings' records ----

/** A string opened at its "Standby" (pairs.js openString, after its own work): its record (see the header). */
export function stressOpen(state, bus, s, d) {
  const R = rangeOf(state);
  R.stress.strs = R.stress.strs.filter(x => x.k !== s.k);
  R.stress.plan = R.stress.plan.filter(e => e.k !== s.k);
  R.stress.strs.push({ k: s.k, name: d.name, attempt: 0, plannedAtMs: null, turnPlanMs: null, noiseAtMs: null, blanks: 0, bangs: 0, feltPeak: 0, poolPeak: 0, feltTurn: null, poolTurn: null,
    froze: [], steps: [], offSafe: [], breathe: [], reload: null, turn2AtMs: null, turned2: false, second: null, calm: null, turners: null, holes: null, done: null, inoc: null, restSaid: false });
}

/** The turn armed on the stress course (pairs.js arm): its time: the calm string's gap, else the noise's planned turn (see the header). */
export function stressArm(state, s) {
  const R = rangeOf(state), rec = recOf(R, s.k), gap = whole(state.clock.ms + gapOf(state.meta.seed, s.k, s.attempt));
  if (!rec || rec.name === 'calm') return gap;
  if (!planOf(R, s.k).length) planNoise(state, s);
  return planOf(R, s.k).some(fired) ? Math.max(gap, rec.turnPlanMs) : rec.turnPlanMs;
}
/** The noise's plan dropped before its first event (the turn disarmed): made again at the next arming, the attempt + 1. */
export function dropNoise(R, s) {
  const rec = recOf(R, s?.k), plan = planOf(R, s?.k);
  if (!rec || !plan.length || plan.some(fired)) return;
  R.stress.plan = R.stress.plan.filter(e => e.k !== s.k);
  rec.attempt += 1;
}

/**
 * The noise's plan of string s (w R.stress.plan; see the header), at its first arming, from its draw and the attempt, every
 * time on a whole tick: [{ key, k, kind: 'horn' | 'blank' | 'call' | 'bang', atMs, done, … }], key 'stress:<k>:<i>' (not
 * 'id': a save keeps id for counted ids alone). Writes the record's turnPlanMs.
 */
export function planNoise(state, s) {
  const R = rangeOf(state), rec = recOf(R, s.k), seed = state.meta.seed, a = rec.attempt, P = pairsPoint(state), now = state.clock.ms;
  const r = stream(seed, 'stress:noise', s.k, a), cx = q(P.coach.x, 0.01), cz = q(P.coach.z, 0.01), out = [];
  let i = 0;
  const add = (e) => out.push({ key: `stress:${s.k}:${++i}`, k: s.k, ...e, done: false });
  const bangAt = (n, atMs, extra = {}) => add({ kind: 'bang', i: n, atMs, x: q(P.fp.x - C.bangs.behindM, 0.01), z: q(P.fp.z + (hash01(seed, 'stress:bang-at', s.k, a, n) - 0.5) * 2 * C.bangs.spreadM, 0.01),
    fromX: cx, fromZ: cz, throwAtMs: atMs - C.bangs.throwMs, ...extra });
  if (rec.name === 'din') {
    const D = C.din, start = whole(now + intIn(r, D.leadMs[0], D.leadMs[1]));
    rec.turnPlanMs = whole(start + intIn(r, D.turnMs[0], D.turnMs[1]));
    const horn = (atMs) => add({ kind: 'horn', atMs, untilMs: atMs + D.hornS * 1000, x: cx, z: cz, n: 0, on: false });
    horn(start);
    let t = start + D.firstBlankMs;
    for (let n = 1; n <= D.blanks; n++) {
      const atMs = whole(t);
      add({ kind: 'blank', i: n, atMs, x: q(cx + D.muzzleFwdM, 0.01), z: cz });
      if (n % D.hornEvery === 0 && n < D.blanks) horn(atMs);
      t = atMs + intIn(stream(seed, 'stress:din', a, n), D.gapMs[0], D.gapMs[1]);
    }
  } else if (rec.name === 'called') {
    const K = C.call, burst = whole(now + intIn(r, K.leadMs[0], K.leadMs[1]));
    add({ kind: 'call', atMs: burst - K.callMs, x: cx, z: cz });
    bangAt(1, burst, { callAtMs: burst - K.callMs });
    rec.turnPlanMs = burst + K.turnMs;
  } else {
    const B = C.bangs, first = whole(now + intIn(r, B.leadMs[0], B.leadMs[1]));
    for (let n = 1; n <= B.n; n++) bangAt(n, first + (n - 1) * B.gapMs);
    rec.turnPlanMs = first + (B.n - 1) * B.gapMs + B.turnMs;
  }
  out.sort((x, y) => x.atMs - y.atMs);
  rec.plannedAtMs = now;
  R.stress.plan.push(...out);
  return out;
}

// ---- each lived tick ----

// (what an input did to the shooter, on the string's record: the felt and the pool at their peak, the freeze in all (the
// startles the noise began, overlaps merged), and the session's freezes for the DI's "again")
function noteInput(state, R, rec, atMs) {
  const pid = playerId(state), k = blockOf(state, pid);
  if (!k) return;
  rec.feltPeak = Math.max(rec.feltPeak, feltOf(state, pid, atMs));
  rec.poolPeak = Math.max(rec.poolPeak, Math.round(suppAt(k, atMs)));
  if (Number.isFinite(k.startleUntilMs) && k.startleUntilMs > atMs) {
    const from = Math.max(atMs, k.startleFromMs ?? atMs);
    for (const f of [rec.froze, R.stress.froze]) {
      const last = f.at(-1);
      if (last && from <= last.untilMs) last.untilMs = Math.max(last.untilMs, k.startleUntilMs);
      else f.push({ fromMs: from, untilMs: k.startleUntilMs });
    }
  }
}
const NOISE_KIND = Object.freeze({ din: 'din', called: 'call', bangs: 'bangs', reload: 'bangs' });

/** The stress course's part of the arms 'actors' layer (pairs.js pairsActors, lived; see the header): the noise due, the second turner, its take-in. */
export function stressActors(state, input, bus) {
  const R = rangeOf(state), now = state.clock.ms, s = R?.str;
  if (!R?.stress) return;
  for (const e of R.stress.plan) {
    if (e.done || e.atMs > now) continue;
    const rec = recOf(R, e.k);
    if (!rec || !s || s.k !== e.k || s.done) continue;
    if (rec.noiseAtMs === null) {
      rec.noiseAtMs = e.atMs;
      bus?.emit('range', { phase: 'noise', cmd: R.cmd?.id ?? null, hot: R.hot, rule: null, kind: NOISE_KIND[rec.name] ?? null, text: null, line: s.line, string: e.k, atMs: e.atMs });
    }
    fireEvent(state, bus, R, rec, e, now);
  }
  if (!s || s.done) return;
  const rec = recOf(R, s.k);
  if (!rec) return;
  // (string 5's second turner: 1.5 to 2.5 s into the RELOAD (stressStepStart), or reload.maxMs after the first turn)
  if (s.second && s.turnedMs !== null && !rec.turned2) {
    if (rec.turn2AtMs === null && now >= s.turnedMs + C.reload.maxMs) rec.turn2AtMs = whole(s.turnedMs + C.reload.maxMs);
    if (rec.turn2AtMs !== null && now >= rec.turn2AtMs) {
      const T = turnerOf(R, s.second);
      if (T) {
        turnTo(T, rec.turn2AtMs);
        bus?.emit('turner', { key: T.key, lane: T.lane, phase: 'turn', face: T.face, atMs: T.turnAtMs, toMs: T.turnAtMs + TURN_MS, why: 'second' });
      }
      rec.turned2 = true;
    }
  }
  noteSecond(state, R, s, rec);
}

// (one planned event going off (see the header))
function fireEvent(state, bus, R, rec, e, now) {
  const pid = playerId(state), by = R.coachId;
  if (e.kind === 'horn') {
    if (!e.on) { e.on = true; bus?.emit('fx', { kind: 'horn', key: e.key, phase: 'on', x: e.x, z: e.z, atMs: e.atMs, untilMs: e.untilMs, by }); }
    // (the din folded once a whole second it sounds (supp.js dinOf), on the second's own time)
    while (e.n < C.din.hornS && now >= e.atMs + (e.n + 1) * 1000) {
      e.n += 1;
      const atMs = e.atMs + e.n * 1000;
      if (dinOf(state, bus, { id: `${e.key}:${e.n}`, x: e.x, z: e.z, s: 1, atMs }).some(w => w.who === pid)) noteInput(state, R, rec, atMs);
    }
    if (e.n >= C.din.hornS) { e.done = true; e.on = false; bus?.emit('fx', { kind: 'horn', key: e.key, phase: 'off', x: e.x, z: e.z, atMs: e.untilMs, untilMs: e.untilMs, by }); }
    return;
  }
  e.done = true;
  if (e.kind === 'blank') {
    rec.blanks += 1;
    bus?.emit('fx', { kind: 'blank', key: e.key, x: e.x, y: 1.3, z: e.z, atMs: e.atMs, by });
    if (shotNoise(state, bus, { id: e.key, x: e.x, z: e.z, byId: by, atMs: e.atMs, blank: true }).some(w => w.who === pid)) noteInput(state, R, rec, e.atMs);
  } else if (e.kind === 'call') {
    sayOn(state, bus, { who: by, text: hashPick(STRESS_COACH.call, 'stress-coach', state.meta.seed, 'call', e.k), kind: 'speech' });
  } else if (e.kind === 'bang') {
    rec.bangs += 1;
    const call = Number.isFinite(e.callAtMs) ? { x: e.fromX, z: e.fromZ, atMs: e.callAtMs } : null;
    const out = bang(state, bus, { id: e.key, x: e.x, z: e.z, atMs: e.atMs, byId: by, kind: 'training', call });
    if (out.some(w => w.who === pid)) noteInput(state, R, rec, e.atMs);
  }
}

// (the second turner's take-in, read once from react's contact: its sighting, its pause, its time)
function noteSecond(state, R, s, rec) {
  if (!rec.turned2 || rec.second) return;
  const c = contactNow(state)?.last;
  if (!c || c.seenMs === undefined || c.seenMs < rec.turn2AtMs || !(c.ids ?? []).includes(s.second)) return;
  rec.second = { seenMs: c.seenMs, pauseMs: c.atMs, takeInMs: c.ms };
}

/** The turn taken on the stress course (pairs.js turnString): the felt and the pool at it. */
export function stressTurn(state, bus, s) {
  const R = rangeOf(state), rec = recOf(R, s.k), pid = playerId(state);
  if (!rec) return;
  rec.feltTurn = feltOf(state, pid, s.turnAtMs);
  rec.poolTurn = Math.round(suppAt(blockOf(state, pid), s.turnAtMs));
}
/** The take-in that paused on the string's first turner, noted (pairs.js noteStrContact): its calm figure by the book (pairs.js calmOf). */
export function stressContact(state, R, s, c) {
  const rec = recOf(R, s.k);
  if (rec && !rec.calm) rec.calm = calmOf(state, R, s, c);
}
/** Whether the string waits on its second turner (string 5 before the second turn): no end by the safe, nor by its time. */
export const stressWaits = (R, s) => !!s?.second && !recOf(R, s.k)?.turned2;
/** Whether the string's time is up on the stress course: STRING_MAX_MS lived since the turn, or since the second turn on string 5. */
export function stressTimeUp(R, s) {
  if (stressWaits(R, s)) return false;
  const rec = recOf(R, s.k), extra = s.second && rec?.turn2AtMs !== null ? Math.max(0, rec.turn2AtMs - s.turnedMs) : 0;
  return s.livedMs >= C.stringMaxMs + extra;
}

/** A step begun on the stress course (pairs.js pairsStepStart): the DI's last step; string 5's RELOAD (its start, the second turn drawn from it). */
export function stressStepStart(state, bus, d) {
  const R = rangeOf(state), s = R?.str;
  if (!R?.stress) return;
  R.stress.lastStepMs = d.fromMs;
  if (!s || s.done || s.turnedMs === null || s.k !== RELOAD_STRING) return;
  const rec = recOf(R, s.k), step = d?.step ?? '';
  // (the RELOAD begun: a reload's row, or its singles on a bolt believed locked back (no RELOAD in the panel: a count lost,
  // the full magazines at his feet))
  const locked = !!state.items?.[gunOn(state, playerId(state))]?.belief?.locked;
  if (!rec || !(RELOAD_RE.test(step) || (locked && RELOAD_SINGLE.test(step)) || (rec.reload && RELOAD_SINGLE.test(step)))) return;
  rec.reload ??= { startMs: d.fromMs, endMs: null, tries: [], open: false };
  if (rec.turn2AtMs === null && !rec.turned2) rec.turn2AtMs = whole(d.fromMs + intIn(stream(state.meta.seed, 'stress:turn2'), C.reload.turnMs[0], C.reload.turnMs[1]));
}

/**
 * A step ended on the stress course (pairs.js pairsAfterStep, before the string's end is checked): every rolled handling
 * sub-step on the string's record from its standby to its end, Off safe's tries on the live string below rung 2, string 5's
 * RELOAD tries (a RELOAD and its "Carry on" one try, failed when a part of it failed) and the bolt home, the Breathes.
 */
export function stressAfterStep(state, bus, d, why) {
  const R = rangeOf(state), s = R?.str, pid = playerId(state), now = state.clock.ms;
  if (!R?.stress) return;
  const rec = s ? recOf(R, s.k) : null, open = !!s && !s.done, live = open && s.turnedMs !== null;
  let at = d.fromMs;
  for (const sub of d.subs ?? []) {
    const atMs = at;
    at += sub.ms ?? 0;
    if (!sub.action || SHOT_PARTS.has(sub.action) || sub.action.startsWith('contact:') || sub.action.startsWith('stance:') || sub.grade === null || sub.grade === undefined) continue;
    if (sub.action === 'selector:semi') {
      R.stress.offSafe = { atMs, ok: sub.ok !== false };
      if (live && rec && rungOf(state, pid, 'room') < 2) rec.offSafe.push(sub.ok !== false);
    }
    if (!open || !rec) continue;
    rec.steps.push({ step: d.step, action: sub.action, label: LABELS_OF[sub.action] ?? ACTIONS[sub.action]?.label ?? sub.action, grade: sub.grade, ok: sub.ok !== false, mishap: sub.mishap ?? null, felt: feltOf(state, pid, atMs), atMs });
  }
  // (string 5's RELOAD: its tries and the bolt home)
  const L = rec?.reload;
  if (L && open) {
    // (a try: a RELOAD's row, with its "Carry on" and the singles that finish it; or the singles alone from the first to the
    // bolt home; failed when any of its parts failed)
    const failed = (d.subs ?? []).some(sub => RELOAD_PARTS.has(sub.action) && sub.ok === false), step = d.step ?? '';
    const gun = state.items?.[gunOn(state, pid)], home = !!gun?.mag && gunField(gun, 'chamber') === 'live' && !gunField(gun, 'locked');
    if (L.endMs === null && (RELOAD_RE.test(step) || RELOAD_SINGLE.test(step))) {
      if (RELOAD_RE.test(step) || !L.open || !L.tries.length) L.tries.push(!failed);
      else L.tries[L.tries.length - 1] &&= !failed;
      L.open = !home && !(RELOAD_RE.test(step) && why === 'end' && !failed);
    }
    if (L.endMs === null && home) { L.endMs = now; L.open = false; }
  }
  // (a Breathe (supp.js: the step 'breathe', in the mode or out of it): on the current string's record, else the session's)
  if (d.step === 'breathe') {
    // (its shed is supp.js breatheEnd's, the one formula (the 'breathe' fact's, the log's), kept on the step by endStep)
    (rec ?? R.stress).breathe.push({ fromMs: d.fromMs, ms: now - d.fromMs, cut: why !== 'end', shedPts: q(d.shedPts ?? 0, 0.01) });
  }
  if (rec && s) noteSecond(state, R, s, rec);
}
// ---- the string's end ----

// (the freeze in all, overlaps counted once, to ms)
const frozeOf = (f, ms = Infinity) => f.reduce((a, x) => a + Math.max(0, Math.min(x.untilMs, ms) - x.fromMs), 0);
const firstShot = (s, key = null) => (s?.shots ?? []).filter(x => x.fired && (key === null || x.key === key)).sort((a, b) => a.atMs - b.atMs)[0] ?? null;

/**
 * The stress fields of a string's paper (pairs.js stringEnd, before paperOf): { noise, blanks, blanksPlan (the din's), bangs, frozeMs, offSafe,
 * reload: { ms, tries } | null, secondMs }, the paper's lead and its RELOAD and SECOND (pairs.js paperText). Also writes the
 * record's numbers for the card.
 */
export function stressPaper(state, R, s) {
  const rec = recOf(R, s.k);
  if (!rec) return null;
  const first = firstShot(s), L = rec.reload;
  Object.assign(rec, {
    takeInMs: s.takeInMs ?? null,
    turnToFirstMs: first && s.turnedMs !== null ? first.atMs - s.turnedMs : null,
    seenToFirstMs: first && Number.isFinite(s.takeInMs) && Number.isFinite(s.pauseMs) ? s.takeInMs + first.atMs - s.pauseMs : null,
  });
  if (rec.second && s.second) {
    const f2 = (s.shots ?? []).filter(x => x.fired && x.key === s.second && x.atMs >= rec.second.pauseMs).sort((a, b) => a.atMs - b.atMs)[0] ?? null;
    rec.second.seenToFirstMs = f2 ? rec.second.takeInMs + f2.atMs - rec.second.pauseMs : null;
  }
  return {
    noise: rec.name, blanks: rec.blanks, ...(rec.name === 'din' ? { blanksPlan: C.din.blanks } : {}), bangs: rec.bangs, frozeMs: frozeOf(rec.froze), offSafe: [...rec.offSafe],
    reload: L ? { ms: L.endMs !== null ? L.endMs - L.startMs : null, tries: [...L.tries] } : null,
    secondMs: rec.second ? rec.second.takeInMs : null,
  };
}

/**
 * The string over on the stress course (pairs.js stringEnd and closeString, after the paper): the noise still to come
 * dropped (the coach stops; a horn sounding cut), the holes kept (the hit card's truth), the inoculation's exposure (see the
 * header), the coach's word on the noise, and "Breathe." when the felt is still up.
 */
export function stressEnd(state, bus, s, why) {
  const R = rangeOf(state), rec = recOf(R, s.k), pid = playerId(state), now = state.clock.ms;
  if (!rec) return;
  for (const e of R.stress.plan) {
    if (e.k !== s.k || e.done) continue;
    if (e.on) { e.on = false; bus?.emit('fx', { kind: 'horn', key: e.key, phase: 'off', x: e.x, z: e.z, atMs: now, untilMs: now, by: R.coachId }); }
    e.done = true; e.dropped = true;
  }
  R.stress.plan = R.stress.plan.filter(e => !e.dropped);
  rec.done = why;
  // (the string's turners as they ended it, and every round put at them: the hit card's truth (arms/marks.js), kept, since the
  // next string hangs fresh faces on the same turners)
  rec.turners = s.keys.map(key => { const T = turnerOf(R, key); return { key, face: T?.face ?? null, holds: T?.holds ?? null, down: Number.isFinite(T?.stoppedAtMs) }; });
  rec.holes = (s.shots ?? []).filter(x => x.fired && x.key).map(x => {
    const T = turnerOf(R, x.key), h = T?.hits.find(z => z.shotId === x.id) ?? null;
    return { key: x.key, shotId: x.id, part: x.part ?? null, zone: x.zone ?? null, at: h?.at ? [...h.at] : null, row: x.row ?? null, atMs: x.atMs };
  });
  // (the inoculation: a finished string at a felt peak of INOC_FELT or more (the sheet's §8 item 19))
  let inoc;
  if (!FINISHED.has(why)) inoc = { counted: false, would: false, why: 'not finished' };
  else if (rec.feltPeak < INOC_FELT) inoc = { counted: false, would: false, why: 'not enough to teach' };
  else { const r = noteExposure(state, pid, { feltPeak: rec.feltPeak, teacher: C.teacher, atMs: now }); inoc = { counted: r.counted, would: true, why: r.why }; }
  rec.inoc = inoc;
  R.stress.inoc.push({ k: s.k, ...inoc });
  if (s.turnedMs === null) return;
  const after = { din: STRESS_COACH.dinAfter, called: STRESS_COACH.calledAfter, bangs: STRESS_COACH.bangsAfter, reload: STRESS_COACH.reloadAfter }[rec.name];
  if (after && rec.noiseAtMs !== null) coachSay(state, bus, after, 'after', s.k);
  if (feltOf(state, pid, now) >= BANG_FELT) coachSay(state, bus, STRESS_COACH.breathe, 'breathe', s.k);
}

/** Whether the coach's rest after the current string's last noise is over (COURSES.stress.restMs; pairs.js pairsReady's "Stop"). */
export function stressRested(state) {
  return restLeftMs(state) <= 0;
}

/** The coach's rest still to run after the current string's last noise (ms; 0 once rested). */
export function restLeftMs(state) {
  const R = rangeOf(state), k = R?.str?.k;
  const last = (R?.stress?.plan ?? []).filter(e => e.k === k && fired(e)).reduce((a, e) => Math.max(a, e.kind === 'horn' ? Math.min(e.untilMs, R.str.doneAtMs ?? e.untilMs) : e.atMs), -Infinity);
  return Number.isFinite(last) ? Math.max(0, last + C.restMs - state.clock.ms) : 0;
}
/** Under this much rest left it is lived, not skipped (my call: a splash for two seconds is a flicker). */
export const REST_SKIP_MIN_MS = 2000;
/**
 * The coach's rest after a noisy string (pairs.js pairsSecond, each lived second; the design review of 0.0.10: 20 s lived at 1:1
 * with nothing on the screen, about 80 s of the tier one's 130): at "Stop" the coach says why (STRESS_COACH.rest, once a string);
 * once the shooter stands as the coach wants him (pairsWant: on safe, low ready, out of it, on his point, still), with nothing
 * running and no Breathe offered (felt under 20, or none), the rest left goes behind the brief splash ('stress-rest', a
 * fast-forward of lived ticks: the pool, the stress and the noise plan as lived, so "Again as …" hears the same noise at the
 * same times). While he acts or Breathe is offered it is lived. Returns whether the rest began.
 */
export function stressRestSecond(state, bus, ctx) {
  const R = rangeOf(state), s = R?.str;
  if (!R?.stress || R.cmd?.id !== 'stop' || !s?.done || state.skip || state.time?.doing) return false;
  const left = restLeftMs(state);
  if (left <= 0) return false;
  const rec = recOf(R, s.k);
  if (rec && !rec.restSaid) { rec.restSaid = true; coachSay(state, bus, STRESS_COACH.rest, 'rest', s.k); }
  if (left < REST_SKIP_MIN_MS || state.stop || !ctx?.sim || pairsWant(state) !== null || breatheOffer(state).ok) return false;
  return !!startActivity(state, bus, ctx, { id: 'stress-rest', args: { ms: whole(left) } })?.ok;
}

/** Whether a planned bang not yet gone off will land within joinMs of the player's startle's end (pairs.js bangDue's stress part). */
export function stressBangDue(R, untilMs, joinMs) {
  return (R?.stress?.plan ?? []).some(e => e.kind === 'bang' && !e.done && e.atMs <= untilMs + joinMs);
}

// ---- the view ----

const sum = (xs) => xs.reduce((a, b) => a + b, 0);
// (a string's fumbles: every rolled handling sub-step on its record, the failed ones and the drops (the rifle onto its sling, a magazine dropped))
function fumblesOf(rec) {
  const st = rec.steps ?? [];
  return { tries: st.length, fails: st.filter(x => !x.ok).length, drops: st.filter(x => x.mishap === 'dropped' || x.mishap === 'dropMag').length,
    failed: st.filter(x => !x.ok).map(x => ({ label: x.label, grade: x.grade, felt: x.felt, mishap: x.mishap })) };
}
// (string 5's RELOAD as the card reads it: its time to the bolt home, its tries, the failed ones, its parts rolled from its
// start to the bolt home and those that failed (a try halted by a fumble and carried on is one try, several parts), the drops)
function reloadOf(rec) {
  const L = rec.reload;
  if (!L) return null;
  const parts = (rec.steps ?? []).filter(x => RELOAD_PARTS.has(x.action) && x.atMs >= L.startMs && (L.endMs === null || x.atMs <= L.endMs));
  return { ms: L.endMs !== null ? L.endMs - L.startMs : null, tries: L.tries.length, fails: L.tries.filter(ok => !ok).length,
    parts: parts.length, partFails: parts.filter(x => !x.ok).length, drops: parts.filter(x => x.mishap === 'dropMag').length };
}

/**
 * The stress course as the end card, the papers and the bots read it (see the header), or null off it: { sheet, label, word,
 * H, strings: [{ k, name, noise, feltPeak, band, poolPeak, feltTurn, frozeMs, takeInMs, fumbles, breathe, turnToFirstMs,
 * seenToFirstMs, calmSeenToFirstMs, zones, reload, second, inoc, done, paper }], inoc: { pts, cap, would }, sessions, summary }.
 */
export function stressNow(state, ms = state.clock.ms) {
  const R = rangeOf(state);
  if (!R?.stress) return null;
  const pid = playerId(state), H = hardOf(state, pid, ms), label = TEST_SHEETS[R.sheet]?.label ?? R.sheet;
  const strings = [...R.stress.strs].sort((a, b) => a.k - b.k).map(rec => {
    const p = R.strs.find(x => x.k === rec.k && x.done !== 'setup') ?? null, cur = R.str?.k === rec.k && !R.str.done ? R.str : null;
    const z = p?.zones ?? {}, br = rec.breathe ?? [];
    return {
      // (the din by its plan, the blanks heard after it when the string ended first, as the paper's lead)
      k: rec.k, name: rec.name, noise: rec.name === 'din' ? `din ${C.din.blanks} blanks${rec.blanks < C.din.blanks ? `, ${rec.blanks} heard` : ''}` : NOISE_WORDS[rec.name], feltPeak: rec.feltPeak, band: bandOf(rec.feltPeak), poolPeak: rec.poolPeak, feltTurn: rec.feltTurn,
      frozeMs: frozeOf(rec.froze, ms), takeInMs: p?.takeInMs ?? cur?.takeInMs ?? null, fumbles: fumblesOf(rec),
      breathe: { n: br.length, ms: sum(br.map(b => b.ms)), shedPts: q(sum(br.map(b => b.shedPts ?? 0)), 0.01) },
      turnToFirstMs: rec.turnToFirstMs ?? null, seenToFirstMs: rec.seenToFirstMs ?? null,
      calmSeenToFirstMs: rec.calm ? rec.calm.turnToFirstMs - (rec.calm.sightMs ?? 0) : null,
      zones: { A: z.A ?? 0, C: z.C ?? 0, head: z.head ?? 0, miss: z.miss ?? 0 }, reload: reloadOf(rec),
      second: rec.second ? { takeInMs: rec.second.takeInMs, seenToFirstMs: rec.second.seenToFirstMs ?? null } : null,
      inoc: rec.inoc ? { counted: rec.inoc.counted, would: rec.inoc.would, why: rec.inoc.why } : null, done: rec.done, paper: p?.paper ?? null,
    };
  });
  const io = inocOf(state, pid), would = strings.filter(x => x.inoc?.would).length;
  const ended = strings.filter(x => x.done && x.done !== 'moved');
  const fz = ended.map(x => x.frozeMs), ti = ended.map(x => x.takeInMs).filter(Number.isFinite);
  const fum = sum(strings.map(x => x.fumbles.fails)), drops = sum(strings.map(x => x.fumbles.drops)), br = sum(strings.map(x => x.breathe.n)) + (R.stress.breathe?.length ?? 0);
  const zs = ['A', 'C', 'head', 'miss'].map(k => [k, sum(strings.map(x => x.zones[k]))]).filter(([, n]) => n);
  const range = (xs, w) => (xs.length ? `${w(Math.min(...xs))}${Math.max(...xs) !== Math.min(...xs) ? ` to ${w(Math.max(...xs))}` : ''}` : null);
  // (a string opened and not over (the scene ended from Esc in it) is said beside the count, so the head line agrees with the
  // lines under it (the runtime review of 0.0.10: "0 strings" over string 4's line))
  const open = strings.filter(x => !x.done).map(x => x.k + 1);
  const summary = [label, `${ended.length} string${ended.length === 1 ? '' : 's'}${open.length ? `, ${open.length === 1 ? 'string' : 'strings'} ${open.join(' and ')} not finished` : ''}`, fz.length ? `froze ${range(fz, (v) => (v ? takeInWords(v) : '0'))} s` : null,
    ti.length ? `take-in ${range(ti, takeInWords)} s` : null, `${fum} fumble${fum === 1 ? '' : 's'}${drops ? `, ${drops} drop${drops === 1 ? '' : 's'}` : ''}`,
    br ? `Breathe ${br}` : null, zs.length ? zs.map(([k, n]) => `${n} ${k}`).join(', ') : null].filter(Boolean).join(' · ');
  return { sheet: R.sheet, label, word: hardWord(H), H, strings, inoc: { pts: io.pts, cap: io.cap, fixed: io.fixed, would },
    sessions: [{ sheet: R.sheet, label, word: hardWord(H), summary }], summary };
}

/** What the end card's "Again as …" starts on the stress course: the same seed, another sheet (scenes never write a career). */
export const againAsStress = (state, tier) => ({ scenario: 'test-stress', seed: state.meta.seed, tier: tierOf(tier), setup: null });

/**
 * The stage's door to the coach's noise (look.js rangeLook().stress; the sheet's §2.3): { coach: { x, z, face }, horn: { on,
 * fromMs, untilMs } | null (the one sounding at ms), blanks: [{ key, x, z, atMs }] (those gone off within the last second),
 * bangs: [{ id, x, z, fromX, fromZ, throwAtMs, atMs, done }] (as pairs' bangs: the throw's arc, the burst, done once past) }.
 */
export function stressLook(state, ms = state.clock.ms) {
  const R = rangeOf(state);
  if (!R?.stress) return null;
  const c = actorOf(state, R.coachId), plan = R.stress.plan;
  const horn = plan.find(e => e.kind === 'horn' && e.atMs <= ms && ms < e.untilMs && (e.on || e.done)) ?? null;
  return {
    coach: c ? { x: c.x, z: c.z, face: c.face ?? 'right' } : null,
    horn: horn ? { on: true, fromMs: horn.atMs, untilMs: horn.untilMs } : null,
    blanks: plan.filter(e => e.kind === 'blank' && e.done && e.atMs <= ms && ms - e.atMs < 1000).map(e => ({ key: e.key, x: e.x, z: e.z, atMs: e.atMs })),
    bangs: plan.filter(e => e.kind === 'bang').map(e => ({ id: e.key, x: e.x, z: e.z, fromX: e.fromX, fromZ: e.fromZ, throwAtMs: e.throwAtMs, atMs: e.atMs, done: e.done && e.atMs <= ms })),
  };
}
