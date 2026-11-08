// OLYMPUS scenarios: test-pairs, "Pairs": the take-in and the shot rows on the 25 m bay's turning targets, five strings on the coach's shot timer (ROADMAP §4.2's 0.0.7b row, shipped as v0.0.8; COMBAT §25.10.3; the build sheet 0.0.8 §2.3).
//
// The ground is authored (src/data/places/range.js PAIRS: the bay of v0.0.5, a 7 m and a 10 m line painted on a pad,
// a turner's stand 1 m in front of each lane's frame, the same in every career); everything that happens on it is
// procedural, from the world's seed alone on named streams, never from the sheet played, so "Again as …" turns the
// same targets at the same gaps (the sheet's §8 item 22): the lane (drawLane: stream(seed, 'range:lane', 'pairs'), 2
// to 5), each string's turners and which is the no-shoot (stream(seed, 'pairs:pick', k)), the gap from "Standby" to the
// turn (stream(seed, 'pairs:gap', k, attempt), STANDBY_MS, whole ticks), what each face holds (by hash), the words (by
// hash). The coach is a generated person (the post melas:kd-coach; the user, 2026-11-05: "All people generated"), who
// runs the bay himself: his commands are speech (no RO on the tower: R.roId is his id, the sheet's §8 item 20) and he
// says nothing while a take-in runs.
//
// The fill (testPairs): the barracks drawn, 11:00, the player on their lane's 7 m point facing downrange in utilities
// with the start body and the test sheet picked (templates.js testSheet(tier): boot recruit, private, sergeant, Raider,
// tier one, the corporal by URL; the scene's player only, never a career), the 'range-pairs' issue (the R-7 slung
// front; magazines of 10, 10 and 2, one in each of chest pouches 1, 2 and 3), the coach at your left shoulder, the six
// turners edge-on with no face hung, then handling.js startRange on the pairs course (its sequence courses.js
// SEQ_PAIRS). setups (my call, for the tests and the page's): 'standby' (or 'standby:<k>'): string k's "Standby" given,
// you out of stop motion at low ready in Condition 1 on safe on its line, the turn armed.
//
// The strings (drawStrings; COURSES.pairs.draws' weights): (0) one turner at 7 m, yours 0.5, a neighbour 0.25 each;
// (1) two at 7 m, yours and a neighbour; (2) three at 10 m, yours and both neighbours, one a no-shoot; (3) the armoured
// silhouette at 10 m alone; (4) two threats at 10 m on the short magazine. A threat holds a rifle 0.7, a pistol 0.3; a
// no-shoot empty hands 0.6, a phone 0.4. From a 7 m point the neighbours' turners stand 23.2° off the muzzle (alert),
// from a 10 m point 16.7° (your sector): the scene teaches the factor by itself (react.js expectOf).
//
// A string (R.str): at "Standby" (pairsOnCmd) its faces are hung on their edge-on turners and the turn is armed
// (turnAtMs = now + the drawn gap) if you are out of stop motion; entering the mode before it disarms it (the coach's
// "Out of it. Wait for the turn.", once a string), and leaving it re-arms it with the next attempt's gap (pairsActors,
// the arms 'actors' layer, lived ticks). At turnAtMs every turner of the string turns (turners.js turnTo: facing over
// TURN_MS, the 'turner' fact), the line goes hot and the coach's timer starts; the take-in, the window and the pause are
// react's (src/sim/combat/contact.js), read back here (contactNow().last) for the paper. Each round on a turner
// (pairsShot, handling.js recordShot's pairs branch) goes on its record (T.hits, with where it struck) and the string's;
// a paper threat goes down at STOP_TORSO 2 torso hits or STOP_HEAD 1 head hit (the hit sensor: turned away SENSOR_MS
// after), the armoured only by its head plate (a head round at A_MARGIN: specials' steelOf), its torso rounds ringing on
// the plate (the 'fx' spark); a no-shoot hit is the fault 'noshoot'. The string ends (stringEnd) only when you are still
// (no step under way, no window open: a row is never cut by it) on the first of: every threat down ('stopped'), a
// no-shoot hit ('noshoot'), STRING_MAX_MS lived since the turn ('time', a fault: never a dead end), nothing left to
// fire anywhere ('dry'), or on safe after a round ('declared': your "done"). Then the line is cold, every turner of the
// string still facing turns away, and the coach reads his shot timer (paperOf, paperText, the one helper of the paper,
// the card and his words): "TURN TO PAUSE 0.55 · PAUSE TO FIRST 1.45 · SPLITS 0.40 · 2 A" (the take-in itself from the
// sighting to the pause, the sheet's §8 item 2; the first round's formula time from the pause; each gap between rounds;
// the zones A, C, HEAD, MISS, NO-SHOOT HIT, zeros left out). A command passed over by the coach's move-on closes an
// open string as not fired.
//
// The readinesses (pairsReady, asked first by handling.js lineReady on this course): pairsReady (out of stop motion and
// still, the rifle at low ready in Condition 1 on safe, the finger off, in the current line's box; dry: on safe in it),
// stringDone, shortReady (pairsReady with the short magazine in), toppedUp (pairsReady with the magazine in believed
// above half, or a Top up seated since the lull began, or nothing fuller to top up with). While the coach's "Back to the
// ten" stands the box the rules hold you in is both lines' (the walk back is inside it). The reloads are counted by
// their purpose (R.reloads: { kind, atMs, ms, why }), the short magazine named for Top up (R.wantMag, the sheet's §8
// item 18), the lull opened at the last string's end or at the coach's "Lull", whichever comes first (R.lull). One magazine a string is waived (COURSES.pairs.oneMag).
//
// pairsNow(state, ms) is the hud's, the bots' and the end card's view: the strings and their papers, the turners as
// seen, the reloads, and the card's three aspects (the turn, the shots, the gun) with its summary ("Private · 5 strings
// · take-in 0.55 to 1.25 s · 14 A, 1 ring, 1 head down, 4 miss · no-shoot untouched · RELOAD 2.55 s · topped up";
// the steel's zones RING and HEAD DOWN beside A, C and HEAD); againAs(state, tier)
// what "Again as …" starts (the same seed, another sheet); pairsLook(state, ms) the stage's (look.js rangeLook's pairs).
//
// 0.0.9, "Three bangs" (setup 'bangs'; the build sheet 0.0.9 §2.2, §8 items 4 to 6, 18 to 22; COMBAT §25.18.3): test-pairs
// as built, with one change: during string 0's armed standby ("string 1" in the user's counting) the coach throws three
// training bangs (COURSES.pairs.bangs: BANGS.n, BANGS.gapMs 1 s apart) onto the pad BANGS.behindM 1.5 m behind your point,
// each spread ±BANGS.spreadM across it by hash, your ears unprotected (the issue's ear defenders taken off the game on this
// setup alone, so supp.js protOf reads bare ears), and the turn comes BANGS.turnMs 2 s after the third. The plan (planBangs, R.bangs.plan) is made at the first arming of that string's turn:
// the first bang a whole-tick lead into the armed standby (stream(seed, 'pairs:bang', k, attempt), BANGS.leadMs), the
// coach's throw BANGS.throwMs before each from his hand at your shoulder; drawn from the seed alone, so "Again as …" every
// sheet hears the same bangs at the same times. Entering the mode, or no longer ready, before the first bang drops the
// plan (attempt + 1), made again at the next arming; after the first, the rest go off on time, and a re-armed turn comes
// no earlier than BANGS.turnMs after the third. Each bang is supp.js bang() at its atMs (pairsActors, lived ticks): the
// pool, the startle, the deafness and the flash are COMBAT §5's, the scene keeps only its record: the felt peak, the
// freeze in all (FROZE: the startles the bangs began, overlaps counted once, as COMBAT §5.7's T5 counts "startled in all";
// not their span from the first's start to the last's end, which made a Raider's two one-tick startles a second apart
// read "FROZE 1.05 S": my call, against the sheet's §8 item 11), and, while the felt stays at
// BANG_FELT 20 or more, every rolled handling sub-step (R.bangs.steps: Off safe, the reloads' parts) for the card. The
// banged string's paper leads "BANGS 3 · FROZE 2.45 S · " and adds "OFF SAFE ✗ ✗ ✓" after PAUSE TO FIRST (the Off
// safe single, below rung 2); every other paper is as built to the character. bangsNow(state, ms) is the end card's
// (pairsNow's .bangs): the plan, the felt peak and its band (the summary gives its sum, "the chaos 105 − hardening 7 (green)
// = felt 98", the fixer's), the freeze, the steps that failed under the chaos, the turn to the first round (turnToFirstMs,
// COMBAT §5.8's T14) and, on the card, the first round from the sighting (seenToFirstMs: the paper's TURN TO PAUSE + PAUSE
// TO FIRST, so the card and the paper show one number) against the same sheet's calm figure by the book (no dice: the
// take-in at band 0, Off safe, the aim and the press at timeK 1), and its summary line. The coach says noise, never "Bang"
// (that would forewarn: the sheet's §8 item 5): PAIRS_COACH.bangsBrief at the brief, bangsAfter after the banged paper.
//
// 0.0.10, "Bang" (test-stress; the build sheet 0.0.10 §2.2, §8 items 2 to 13): the stress course runs on this engine, the
// session's course 'pairs' and armoury.range.stress selecting its strings, its sequence (handling.js seqOf), its magazines
// and its noise (src/sim/scenarios/stress.js, the course's own module). Each hook is guarded by R.stress, so test-pairs and
// "Three bangs" run to the tick: the strings drawn by drawStress; the turn armed at stressArm's time (the noise's plan);
// pairsActors runs stressActors; the turn notes the felt at it (stressTurn) and leaves string 5's second turner edge-on
// (it turns alone, stress.js); the take-in's calm figure by the book (calmOf) kept on the stress record; the steps go to
// stressStepStart and stressAfterStep; string 5 neither ends by the safe nor by its time while its second turner is to turn
// (stressWaits, stressTimeUp); the string's end writes its stress paper fields (stressPaper: the noise's lead, OFF SAFE,
// RELOAD and SECOND, paperText's) and calls stressEnd; a closed string drops its noise; bangDue reads the stress plan's
// bangs too. One change holds on every pairs course, the sheet's §8 item 13: a live Breathe (supp.js's step 'breathe' out of
// stop motion) counts as out of it and still (outOfIt), so breathing in a standby keeps the turn armed; nobody breathes on
// test-pairs or "Three bangs" unless the player does, so their bots run to the tick.
import { TICK_MS } from '../../core/clock.js';
import { q } from '../../core/num.js';
import { msAtMarsTime } from '../../core/calendar.js';
import { stream, intIn, int, weighted } from '../../core/rng.js';
import { hashPick, hash01 } from '../../core/hash.js';
import { playerActor, playerId } from '../../core/ids.js';
import { cancel } from '../../core/queue.js';
import { START_MS, SITES } from '../../data/setting/calendar.js';
import { SCENES } from '../../data/scenes.js';
import { COURSES, PAIRS_COACH, STRESS_COACH } from '../../data/courses.js';
import { KD_RANGE, PAIRS, pairsLaneOf } from '../../data/places/range.js';
import { siteOf } from '../places/model.js';
import { WALK_MS } from '../places/move.js';
import { setOutfit, syncActors } from '../people/place.js';
import { drawStaff, setPost } from '../people/staff.js';
import { startBody } from '../body/body.js';
import { deltaOf } from '../body/record.js';
import { testSheet, TEST_SHEETS } from '../skills/templates.js';
import { barracks } from './barracks.js';
import { setLedgers } from './tests.js';
import { rangeOf, sayOn, drawLane, startRange, fault, roundsLeft, stillOf, noteTick, stopWords, seqOf } from './handling.js';
import { drawStress, stressOpen, stressArm, dropNoise, stressActors, stressTurn, stressContact, stressWaits, stressTimeUp, stressStepStart, stressAfterStep, stressPaper, stressEnd, stressBangDue, stressNow, stressRested, stressRestSecond, againAsStress } from './stress.js';
import { materialise, move, pouchesOf, believedN, discard } from '../arms/kit.js';
import { gunField, feed, beliefOf, newMag } from '../arms/firearms.js';
import { macrosFor } from '../arms/drills.js';
import { gunOn } from '../arms/shooting.js';
import { BRASS_LIVE } from '../arms/look.js';
import { TURN_MS, turnerKey, facingOf, turnTo, turnAway } from '../arms/turners.js';
import { takeInWords, takeInOf } from '../combat/react.js';
import { contactNow, pendingOf, lullOf } from '../combat/contact.js';
import { contactOf, noteContact } from '../people/mind.js';
import { bang, blockOf, feltOf, bandOf, suppTimeK, suppAt, hardOf, hardWord, STARTLE_JOIN_MS } from '../combat/supp.js';
import { actionMs, ACTIONS } from '../arms/firearms.js';
import { aimMsOf, TRIGGER_S } from '../arms/shot.js';
import { ROWS } from '../arms/specials.js';
import { rungOf } from '../skills/templates.js';

/** Where the scene plays (the build sheet §2.3). */
export const PAIRS_SCENE = Object.freeze({ site: 'melas', area: KD_RANGE.area, course: 'pairs' });
const C = COURSES.pairs;
/** The gap from "Standby" to the turn (ms, whole ticks), and a string's limit lived since the turn (ms): the sheet's §4. */
export const STANDBY_MS = C.standbyMs, STRING_MAX_MS = C.stringMaxMs;
/** A paper threat's hit sensor: down at this many torso hits or head hits, turned away this long after (ms). */
export const STOP_TORSO = 2, STOP_HEAD = 1, SENSOR_MS = 100;
/** A magazine believed above this many rounds is "above half" of the course's ten-round magazines (toppedUp; my call). */
export const HALF_N = 5;
/** "Three bangs" (setup 'bangs'; see the header): the course's bangs; the felt from which a handling sub-step counts as under them. */
export const BANGS = C.bangs, BANG_FELT = 20;
/** The setups of test-pairs (debug.js SETUPS' share): the calm course's standbys and the bangs'. */
export const PAIRS_SETUPS = Object.freeze(['standby', ...[0, 1, 2, 3, 4].map(k => `standby:${k}`), 'bangs', 'bangs:standby']);
/** The sheets the start card offers, in its order; the default. */
export const PAIRS_SHEETS = Object.freeze(SCENES['test-pairs'].sheets), PAIRS_SHEET = SCENES['test-pairs'].sheet;
/** The paper's zones in their order, and their words on the paper and on the card. */
// (the steel's own: a round that rang on a plate, and the head plate knocked down: the steel string's paper reads as steel,
// "2 RING · 1 HEAD DOWN", not as paper's A and HEAD (the design review of v0.0.8))
export const ZONES = Object.freeze(['A', 'C', 'head', 'ring', 'headDown', 'miss', 'noshoot']);
const ZONE_PAPER = Object.freeze({ A: 'A', C: 'C', head: 'HEAD', ring: 'RING', headDown: 'HEAD DOWN', miss: 'MISS', noshoot: 'NO-SHOOT HIT' });
const ZONE_CARD = Object.freeze({ A: 'A', C: 'C', head: 'head', ring: 'ring', headDown: 'head down', miss: 'miss', noshoot: 'no-shoot hit' });

const lonOf = () => SITES[siteOf(PAIRS_SCENE.site)?.geo]?.lonEDeg ?? 0;
const whole = (ms) => Math.ceil(ms / TICK_MS) * TICK_MS;
const isPairs = (state) => rangeOf(state)?.course === 'pairs';
const tierOf = (tier) => (tier && TEST_SHEETS[tier] ? tier : PAIRS_SHEET);
const actorOf = (state, pid) => state.actors?.list?.find(a => a.who === pid) ?? null;
// (the coach's word: never while a take-in runs, the window's silence: COMBAT §25.4.5)
function coachSay(state, bus, lines, ...key) {
  const R = rangeOf(state);
  if (!R || pendingOf(state)) return;
  sayOn(state, bus, { who: R.coachId, text: hashPick(lines, 'pairs-coach', state.meta.seed, ...key), kind: 'speech' });
}
const fill = (lines, map) => lines.map(l => Object.entries(map).reduce((t, [k, v]) => t.replaceAll(`{${k}}`, String(v)), l));

// ---- the draws (the seed alone) ----

const laneKey = (lane, off) => turnerKey(lane + off);
/** What a turner's face holds on string k, by hash (the draws' weights): a threat's rifle or pistol, a no-shoot's hands or phone. */
export const holdOf = (seed, k, key, face) => {
  const list = face === 'noshoot' ? C.draws.noshootHolds : C.draws.threatHolds, h = hash01('pairs:hold', seed, k, key) * 100;
  let acc = 0;
  for (const [v, w] of list) { acc += w; if (h < acc) return v; }
  return list.at(-1)[0];
};
/** The gap from "Standby" to the turn for string k's attempt (ms, whole ticks: see the header). */
export const gapOf = (seed, k, attempt = 0) => whole(intIn(stream(seed, 'pairs:gap', k, attempt), STANDBY_MS[0], STANDBY_MS[1]));

/** Every string's draw from the seed alone (see the header): [{ k, line, keys, faces, holds, gapMs }]. */
export function drawStrings(seed, lane) {
  const pick = (k) => stream(seed, 'pairs:pick', k);
  const sorted = (keys) => [...keys].sort((a, b) => Number(a.split(':')[1]) - Number(b.split(':')[1]));
  const out = [];
  const add = (k, line, keys, faceOf) => {
    const ks = sorted(keys), faces = {}, holds = {};
    for (const key of ks) { faces[key] = faceOf(key); holds[key] = holdOf(seed, k, key, faces[key]); }
    out.push({ k, line, keys: ks, faces, holds, gapMs: gapOf(seed, k, 0) });
  };
  add(0, 7, [laneKey(lane, weighted(pick(0), C.draws.one))], () => 'threat');
  add(1, 7, [laneKey(lane, 0), laneKey(lane, weighted(pick(1), C.draws.two))], () => 'threat');
  const ns = laneKey(lane, int(pick(2), 3) - 1);
  add(2, 10, [laneKey(lane, -1), laneKey(lane, 0), laneKey(lane, 1)], (key) => (key === ns ? 'noshoot' : 'threat'));
  add(3, 10, [laneKey(lane, weighted(pick(3), C.draws.armoured))], () => 'armoured');
  add(4, 10, [laneKey(lane, 0), laneKey(lane, weighted(pick(4), C.draws.short))], () => 'threat');
  return out;
}

// ---- where things are ----

/** The player's point on the session's line: { line, lane, fp, box, coach } (the 7 m or the 10 m point of their lane), or null. */
export function pairsPoint(state) {
  const R = rangeOf(state);
  if (!R || R.course !== 'pairs') return null;
  const L = pairsLaneOf(R.lane), line = R.line ?? 7, P = L.points[line];
  return { line, lane: R.lane, fp: P.fp, box: P.box, coach: P.coach };
}
/**
 * The box the range's rules hold you in (handling.js rangeLine): the line's; from "Back to the ten" until you have stood
 * in the 10 m point's box (R.at10), both lines' (the walk back is in it, and a shooter the coach's move-on left on the 7 m
 * point is not "off the firing point" for standing on it: the runtime review of v0.0.8's stop for a point never left).
 */
export function pairsBox(state) {
  const R = rangeOf(state), P = pairsPoint(state);
  if (!P) return null;
  if (R.line !== 10 || R.at10) return P.box;
  const a = pairsLaneOf(R.lane).points[7].box, b = pairsLaneOf(R.lane).points[10].box;
  return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])];
}
const inBox = (b, x, z) => x >= b[0] && x <= b[2] && z >= b[1] && z <= b[3];
/**
 * The range a shot row's reach is judged at for a turner (m; specials.js reachOf, COMBAT §25.6.1): your own lane's turner
 * counts at your line's nominal distance (7 or 10) wherever you stand inside that line's point's box (the session's line
 * first, then the other's: the walk back to the ten); null for a neighbour's turner, off the boxes or off the course (the
 * measured range then). The fix of 2026-11-07 (the user's report: "am i supposed to aim for the head ? How do I do that ?"):
 * a metre back in the 10 m box the turner was 11 m off and both head rows, then 10 m, vanished.
 */
export function pairsReachM(state, key, x, z) {
  const R = rangeOf(state);
  if (!R || R.course !== 'pairs' || key !== turnerKey(R.lane)) return null;
  const L = pairsLaneOf(R.lane), line = R.line ?? 7;
  for (const d of [line, line === 7 ? 10 : 7]) if (L?.points?.[d] && inBox(L.points[d].box, x, z)) return d;
  return null;
}
const turnerOf = (R, key) => (R?.turners ?? []).find(T => T.key === key) ?? null;

// ---- the fill ----

/** The fill of 'test-pairs' (see the header). tier: a TEST_SHEETS id (the private by default); setup: null | 'standby' | 'standby:<k>' | 'bangs' | 'bangs:standby'. */
export function testPairs(state, { at = null, setup = null, tier = null } = {}) {
  const scene = SCENES['test-pairs'], seed = state.meta.seed, lon = lonOf(), sheet = tierOf(tier);
  if (state.clock.ms === START_MS && scene.hour !== null) {
    const h = Math.floor(scene.hour), m = Math.round((scene.hour - h) * 60);
    state.clock.ms = state.meta.createdMs = Math.ceil(msAtMarsTime(state.clock.ms, h, m, lon) / TICK_MS) * TICK_MS;
  }
  const lane = drawLane(seed, 'pairs'), L = pairsLaneOf(lane), P = L.points[7];
  barracks(state, { at: { area: KD_RANGE.area, x: P.fp.x, z: P.fp.z, face: 'right', ...(at ?? {}) } });
  const me = playerActor(state), pid = playerId(state), person = state.people[pid];
  setOutfit(me, scene.outfit);
  person.body = deltaOf(setLedgers(startBody(person, state.clock.ms, lon, seed), scene.body ?? {}));
  // (the test sheet, on the scene's player only: scenes never write a career)
  person.skills = testSheet(sheet);
  const kit = materialise(state, pid, C.kit);
  // (0.0.9, "Three bangs": no ear defenders on this setup alone, the user's case ("three flashbangs go off right next to
  // him"; the build sheet 0.0.9 §8 item 5): the issue's pair taken off the game, so supp.js protOf reads bare ears)
  if (setup === 'bangs' || setup === 'bangs:standby') { const ears = person.kit?.worn?.ears; if (ears) { discard(state, ears); delete person.kit.worn.ears; } }
  // (one magazine a pouch: chest pouches 1, 2 and 3, the short one third, as the coach names it)
  const pouches = pouchesOf(state, pid).filter(p => !p.dump);
  kit.magIds.forEach((id, i) => { const p = pouches[(C.pouches[i] ?? i + 1) - 1]; if (p && !p.mags.includes(id)) move(state, id, { container: p.id }); });
  const coachId = drawStaff(state, 'melas:kd-coach');
  setPost(state, coachId, { area: KD_RANGE.area, x: P.coach.x, z: P.coach.z, face: P.coach.face });
  syncActors(state);
  const R = startRange(state, null, { course: 'pairs', lane, kit, roId: coachId, coachId });
  const [ten1, ten2, short] = kit.magIds;
  Object.assign(R, {
    sheet, line: 7, mags: { ten1, ten2, short }, wantMag: null,
    turners: PAIRS.lanes.map(T => ({ key: turnerKey(T.lane), lane: T.lane, x: T.turner.x, z: T.turner.z, y: PAIRS.face.centreY, face: null, holds: null, turnAtMs: null, awayAtMs: null, hits: [], stoppedAtMs: null })),
    str: null, strs: [], reloads: [], lull: null,
  });
  // (0.0.9: "Three bangs": the session's setup and its record (see the header); 'bangs:standby' the banged string's standby given)
  if (setup === 'bangs' || setup === 'bangs:standby') Object.assign(R, { setup: 'bangs', bangs: { attempt: 0, plan: [], steps: [], froze: [], feltPeak: 0, offSafe: null, lastStepMs: null, calm: null } });
  if (setup === 'bangs:standby') setupStandby(state, BANGS.string);
  else if (setup && /^standby(:\d)?$/.test(setup)) setupStandby(state, Number(setup.split(':')[1] ?? 0));
  return state;
}

/** A setup (w): string k's "Standby" given, the player at its line's point out of stop motion at low ready in Condition 1 on safe (0.0.10: the stress course's fill too). */
export function setupStandby(state, k) {
  const R = rangeOf(state), pid = playerId(state), me = playerActor(state), gun = state.items[gunOn(state, pid)], now = state.clock.ms, SQ = seqOf(R);
  const i = SQ.findIndex(c => c.id === 'standby' && c.string === k), def = SQ[i];
  if (i < 0) return;
  R.line = def.line;
  const P = pairsPoint(state);
  me.x = P.fp.x; me.z = P.fp.z; me.face = 'right'; me.$px = me.x; me.$pz = me.z;
  const c = actorOf(state, R.coachId);
  setPost(state, R.coachId, { area: KD_RANGE.area, x: P.coach.x, z: P.coach.z, face: P.coach.face });
  if (c) { c.x = P.coach.x; c.z = P.coach.z; c.face = P.coach.face; c.$px = c.x; c.$pz = c.z; }
  const magId = k === 4 ? R.mags.short : R.mags.ten1, mag = state.items[magId];
  move(state, magId, { gun: gun.id ?? gunOn(state, pid) });
  feed(gun, mag);
  gun.mode = 'safe';
  gun.belief = { chamber: 'live', count: mag.n };
  if (mag.belief) delete mag.belief;
  const carry = state.people[pid].kit.carry;
  carry.posture = 'lowReady'; delete carry.finger;
  cancel(state, 'arms:range');
  R.cmd = { id: def.id, i, atMs: now }; R.next = null; R.phase = 'cmd'; R.livedMs = 0;
  // (the strings before it as sat out: nothing on their papers)
  for (let j = 0; j < k; j++) R.strs.push({ k: j, line: j < 2 || R.stress ? 7 : 10, keys: [], expect: null, n: 0, takeInMs: null, pauseToFirstMs: null, splitsMs: [], zones: {}, rows: [], done: 'setup', paper: '' });
  openString(state, null, k);
}

// ---- the coach's commands ----

/** A command said on the pairs course (handling.js onRangeCmd, after the words and the phase): what the scene does at it. */
export function pairsOnCmd(state, bus, def, i) {
  const R = rangeOf(state), now = state.clock.ms;
  if (!R || R.course !== 'pairs') return;
  if (def.line) R.line = def.line;
  // (any command but the string's own closes an open string: the move-on passed it over)
  if (def.id !== 'standby' && R.str && !R.str.done) closeString(state, bus, 'moved');
  switch (def.id) {
    case 'brief':
      coachSay(state, bus, PAIRS_COACH.brief, 'brief');
      // (the bangs' brief: noise, never "Bang" (see the header))
      if (R.bangs) coachSay(state, bus, PAIRS_COACH.bangsBrief, 'bangsBrief');
      // (0.0.10: the stress course's brief names the noise)
      if (R.stress) coachSay(state, bus, STRESS_COACH.brief, 'stressBrief');
      break;
    case 'standby': openString(state, bus, def.string); break;
    case 'stop': R.hot = false; awayAll(state, bus, 'string'); break;
    case 'move10': {
      // (the coach walks back with you to the ten-metre point's shoulder: pairsActors, at the walk, never a jump)
      const P = pairsPoint(state);
      R.coachWalk = { x: P.coach.x, z: P.coach.z, face: P.coach.face };
      break;
    }
    case 'short':
      // (0.0.10: on the stress course the one-round magazine already in (a Top up between strings took it): the coach's
      // "Good" now, nothing named, so his word never lands inside the next string)
      if (R.stress && state.items[gunOn(state, playerId(state))]?.mag === R.mags.short) { R.shortIn = true; coachSay(state, bus, STRESS_COACH.short, 'short'); }
      else R.wantMag = R.mags.short;
      bus?.emit('range', { phase: 'short', cmd: def.id, hot: false, rule: null, kind: null, text: null, line: R.line }); break;
    case 'lull': openLull(state, bus); bus?.emit('range', { phase: 'lull', cmd: def.id, hot: false, rule: null, kind: null, text: null, line: R.line }); break;
    case 'clear': R.shown = false; R.wantMag = null; break;
    default: break;
  }
}

/** The last string's index (the lull follows it). */
export const LAST_STRING = C.strings.length - 1;
// (the lull: from the last string's end (or the coach's "Lull", whichever first: R.lull), and the coach hands over a fresh
// magazine of ten into a pouch with room, so it always has something to top up with (the reviews of v0.0.8: on 22 rounds
// every sheet reached it with nothing fuller, and "topped up" was never earned there); counted on the issue)
function openLull(state, bus) {
  const R = rangeOf(state);
  R.lull ??= { atMs: state.clock.ms, topUp: null };
  handOver(state, bus, R);
}
// (the lull's fresh magazine: newMag into the first chest pouch with room, the issue's count raised; the coach's word says
// where it went, and whether you are above half and need none)
function handOver(state, bus, R) {
  if (R.lull?.handed) return;
  const pid = playerId(state), pouch = pouchesOf(state, pid).find(p => !p.dump && p.room > 0);
  if (!pouch) return;
  const fam = state.items[R.mags.ten1]?.fam ?? 'had30', id = newMag(state, { fam, n: C.lullMag, load: C.load ?? 'ball', told: true });
  move(state, id, { container: pouch.id });
  const issue = state.armoury.ammoIssues.find(a => a.id === R.issueId);
  if (issue) issue.n += C.lullMag;
  R.lull.handed = true; R.mags.lull = id;
  const b = beliefOf(state, gunOn(state, pid)), above = b?.mag === 'in' && Number.isFinite(b.count) && b.count > HALF_N;
  coachSay(state, bus, fill(above ? PAIRS_COACH.lullAbove : PAIRS_COACH.hand, { pouch: pouch.word }), 'hand');
}

// (string k opened at its "Standby": its faces hung on the edge-on turners, its record, the turn armed if you are out of the mode)
function openString(state, bus, k) {
  const R = rangeOf(state), d = (R.stress ? drawStress : drawStrings)(state.meta.seed, R.lane)[k];
  if (!d) return;
  for (const key of d.keys) {
    const T = turnerOf(R, key);
    if (!T) continue;
    // (what the face holds is a painted rifle or empty hands, not an item's holder: Object.assign, so kit.js stays the one writer of those)
    Object.assign(T, { face: d.faces[key], holds: d.holds[key], hits: [], stoppedAtMs: null });
  }
  // (the take-in looks again at a turner that turns again: what the marine knew of the last string's face is gone)
  const c = contactOf(state);
  if (c?.known && d.keys.some(key => key in c.known)) noteContact(state, { known: Object.fromEntries(Object.entries(c.known).filter(([key]) => !d.keys.includes(key))) });
  R.string = k; R.hot = false;
  R.str = { k, line: d.line, keys: [...d.keys], attempt: 0, turnAtMs: null, turnedMs: null, seenMs: null, pauseMs: null, takeInMs: null, expect: null, n: 0, contactId: null,
    shots: [], done: null, livedMs: 0, ...(d.second ? { second: d.second } : {}) };
  if (R.stress) stressOpen(state, bus, R.str, d);
  if (outOfIt(state) && readyForTurn(state)) arm(state, R.str);
  bus?.emit('range', { phase: 'standby', cmd: 'standby', hot: false, rule: null, kind: null, text: null, line: d.line, string: k });
}
// (the turn armed: the drawn gap; on the banged string, BANGS.turnMs after the third bang, the plan made at the first arming)
function arm(state, s) {
  const R = rangeOf(state);
  // (0.0.10: the stress course's turn, from its noise's plan (stress.js))
  if (R.stress) { s.turnAtMs = stressArm(state, s); return; }
  const at = whole(state.clock.ms + gapOf(state.meta.seed, s.k, s.attempt));
  if (!bangsOn(R, s)) { s.turnAtMs = at; return; }
  if (!R.bangs.plan.length) planBangs(state, s);
  const third = R.bangs.plan.at(-1).atMs + BANGS.turnMs;
  s.turnAtMs = R.bangs.plan.some(b => b.done) ? Math.max(at, third) : third;
}
// (the string the bangs belong to, on the setup)
const bangsOn = (R, s) => !!R?.bangs && !!s && s.k === BANGS.string;
// (the plan dropped before its first bang: made again, attempt + 1, at the next arming)
function dropBangs(R) {
  if (!R?.bangs?.plan.length || R.bangs.plan.some(b => b.done)) return;
  R.bangs.plan = []; R.bangs.attempt += 1;
}

/**
 * The bangs' plan (w R.bangs.plan; see the header): at the first arming of the banged string's turn, BANGS.n bangs, the
 * first a whole-tick lead into the armed standby on stream(seed, 'pairs:bang', k, attempt), then BANGS.gapMs apart; each
 * BANGS.behindM behind the point, ±BANGS.spreadM across it by hash; thrown from the coach's hand BANGS.throwMs before.
 * Returns [{ key, i, x, z, fromX, fromZ, throwAtMs, atMs, done }] (key the bang's input id, 'pairs:<k>:<i>': not 'id', which a
 * save keeps for counted ids alone (tests/ids-check.mjs); the views give it as id).
 */
export function planBangs(state, s) {
  const R = rangeOf(state), seed = state.meta.seed, P = pairsPoint(state), a = R.bangs.attempt;
  const first = whole(state.clock.ms + intIn(stream(seed, 'pairs:bang', s.k, a), BANGS.leadMs[0], BANGS.leadMs[1]));
  R.bangs.plan = Array.from({ length: BANGS.n }, (_, j) => {
    const i = j + 1, atMs = first + j * BANGS.gapMs;
    return { key: `pairs:${s.k}:${i}`, i, x: q(P.fp.x - BANGS.behindM, 0.01), z: q(P.fp.z + (hash01(seed, 'pairs:bang-at', a, i) - 0.5) * 2 * BANGS.spreadM, 0.01),
      fromX: q(P.coach.x, 0.01), fromZ: q(P.coach.z, 0.01), throwAtMs: atMs - BANGS.throwMs, atMs, done: false };
  });
  return R.bangs.plan;
}

// (each planned bang at its time (lived ticks): supp.js bang(), and the scene's record of what it did to the shooter)
function fireBangs(state, bus, R, now) {
  const pid = playerId(state);
  for (const b of R.bangs.plan) {
    if (b.done || b.atMs > now) continue;
    b.done = true;
    const out = bang(state, bus, { id: b.key, x: b.x, z: b.z, atMs: b.atMs, byId: R.coachId, kind: 'training' });
    if (out.some(r => r.who === pid)) {
      R.bangs.feltPeak = Math.max(R.bangs.feltPeak, feltOf(state, pid, b.atMs));
      // (the chaos itself at its peak, for the card's sum: "the chaos 105 − hardening 7 = felt 98"; 0.0.9's fixer)
      R.bangs.poolPeak = Math.max(R.bangs.poolPeak ?? 0, Math.round(suppAt(blockOf(state, pid), b.atMs)));
    }
    // (the freeze: every startle the bangs began, overlapping ones merged (see the header))
    const k = blockOf(state, pid);
    if (k && Number.isFinite(k.startleUntilMs) && k.startleUntilMs > b.atMs) {
      const f = R.bangs.froze, from = Math.max(b.atMs, k.startleFromMs ?? b.atMs);
      const last = f.at(-1);
      if (last && from <= last.untilMs) last.untilMs = Math.max(last.untilMs, k.startleUntilMs);
      else f.push({ fromMs: from, untilMs: k.startleUntilMs });
    }
  }
}

// (every turner still facing, or turning, turned away now)
function awayAll(state, bus, why, keys = null) {
  const R = rangeOf(state), now = state.clock.ms;
  for (const T of R.turners ?? []) {
    if (keys && !keys.includes(T.key)) continue;
    if (T.turnAtMs === null || (T.awayAtMs !== null && T.awayAtMs <= now + TURN_MS)) continue;
    if (facingOf(T, now) <= 0 && now >= T.turnAtMs + TURN_MS) continue;
    turnAway(T, now);
    bus?.emit('turner', { key: T.key, lane: T.lane, phase: 'away', face: T.face, atMs: T.awayAtMs, toMs: T.awayAtMs + TURN_MS, why });
  }
}

// ---- the readinesses ----

/**
 * What the coach waits for on the pairs course (handling.js lineReady asks it first): true or false for the pairs
 * readinesses (see the header), null to let the shared switch answer (magIn, shown). ctx: { still, gun, mag, safe, me }.
 */
export function pairsReady(state, def, { gun, safe, me } = {}) {
  const R = rangeOf(state);
  if (!R || R.course !== 'pairs') return null;
  if (def.ready === 'stringDone') return !!R.str && R.str.k === def.string && R.str.done !== null;
  if (!['pairsReady', 'shortReady', 'toppedUp'].includes(def.ready)) return null;
  if (!gun || !me) return false;
  const pid = playerId(state), carry = state.people[pid]?.kit?.carry ?? {}, P = pairsPoint(state);
  const out = outOfIt(state) && !state.time?.doing && (me.gait ?? 'idle') === 'idle';
  const cond1 = gunField(gun, 'chamber') === 'live' && !!gun.mag && gunField(gun, 'mode') === 'safe';
  const ready = out && inBox(P.box, me.x, me.z) && (carry.finger ?? 'off') !== 'on' && ((carry.posture === 'lowReady' && cond1) || (!!R.dry && safe));
  if (!ready) return false;
  // (0.0.10: on the stress course the coach's "Stop" waits out his rest after the noise (stress.js stressRested))
  if (R.stress && def.id === 'stop' && !stressRested(state)) return false;
  if (def.ready === 'shortReady') return gun.mag === R.mags.short || !!R.dry || !state.items[R.mags.short];
  if (def.ready === 'toppedUp') return toppedUp(state, R, gun);
  return true;
}
/**
 * What the shooter still lacks for the coach's "ready" (pairsReady's parts, in the order they are put right): 'mag' (no
 * magazine in), 'chamber' (none up), 'safe' (off safe, or the finger on), 'low' (not at low ready), 'out' (in stop
 * motion), 'point' (off the line's point), 'still' (moving); null when ready. A dry shooter (R.dry) is asked only for the
 * safe, out and point. The coach's nudge names it and the DI's pairs-ready answers it (the design review of v0.0.8: the
 * nag said "on safe, low ready, out of it" to a shooter who was, his magazine lost in a fumble).
 */
export function pairsWant(state) {
  const R = rangeOf(state), P = pairsPoint(state), pid = playerId(state), me = playerActor(state), gun = state.items?.[gunOn(state, pid)];
  if (!R || !P || !me || !gun) return null;
  const carry = state.people[pid]?.kit?.carry ?? {}, dry = !!R.dry;
  if (!dry && !gun.mag) return 'mag';
  if (!dry && gunField(gun, 'chamber') !== 'live') return 'chamber';
  if (gunField(gun, 'mode') !== 'safe' || (carry.finger ?? 'off') === 'on') return 'safe';
  if (!dry && carry.posture !== 'lowReady') return 'low';
  if (!outOfIt(state) || state.time?.doing) return 'out';
  if (!inBox(P.box, me.x, me.z)) return 'point';
  if ((me.gait ?? 'idle') !== 'idle') return 'still';
  return null;
}
/** Whether the shooter stands in the box the line's rules hold him in (pairsBox): the DI's "Back on your point first." */
export function onPoint(state) {
  const b = pairsBox(state), me = playerActor(state);
  return !b || !me || inBox(b, me.x, me.z);
}
/** The coach's nudge by what is lacking (pairsWant): "Shooter, a magazine in." */
export const PAIRS_NUDGE = Object.freeze({ mag: 'a magazine in.', chamber: 'a round up: MAKE READY.', safe: 'on safe, finger off.', low: 'low ready.', out: 'out of it.', point: 'back on your point.', still: 'stand still.' });
// (out of stop motion, as the coach sees it: no stop motion, or a live Breathe (supp.js's step 'breathe' outside the mode: the
// sheet 0.0.10's §8 item 13, so breathing in the standby keeps the turn armed; a sighting cuts it))
const outOfIt = (state) => !state.stop || (state.stop.mode === 'live' && state.stop.doing?.step === 'breathe');
// (whether the turn may be armed: the line ready as the coach sees it, on the point of the string's line (the design review of
// v0.0.8: the turn came while the shooter stood off his point, and the stop that followed was for a place the move-on put him))
const readyForTurn = (state) => pairsWant(state) === null;

// (topped up: the magazine in believed above half, or a Top up seated since the lull began, or nothing fuller to top up with,
// or no Top up the drills offer now (drills.js macrosFor: never a readiness the panel cannot answer))
function toppedUp(state, R, gun) {
  if (R.dry || R.lull?.topUp) return true;
  const pid = playerId(state), b = beliefOf(state, gunOn(state, pid)), inN = b?.mag === 'in' && Number.isFinite(b.count) ? b.count : null;
  if (inN !== null && inN > HALF_N) return true;
  const spare = pouchesOf(state, pid).flatMap(p => p.mags).map(id => believedN(state.items[id]) ?? 0);
  if (!spare.some(n => n > (inN ?? 0))) return true;
  return !macrosFor(state, pid, gunOn(state, pid)).some(m => m.id === 'reload:tactical');
}

// ---- each lived tick and each second ----

/** The arms 'actors' layer on the pairs course (lived; see the header): the coach's walk, the turn armed, disarmed and taken, the string's lived time. */
export function pairsActors(state, input, bus) {
  const R = rangeOf(state);
  if (!R || R.course !== 'pairs' || R.end || state.skip) return;
  const now = state.clock.ms;
  if (R.coachWalk) coachStep(state, R);
  if (R.bangs) fireBangs(state, bus, R, now);
  if (R.stress) stressActors(state, input, bus);
  // (stood in the 10 m point's box once: the line's box is its own from now on (pairsBox))
  if (R.line === 10 && !R.at10) { const me = playerActor(state), b = pairsLaneOf(R.lane).points[10].box; if (me && inBox(b, me.x, me.z)) R.at10 = true; }
  const s = R.str;
  if (!s || s.done) return;
  if (s.turnedMs === null) {
    const inMode = state.stop?.mode === 'stop';
    if (s.turnAtMs !== null && inMode && now < s.turnAtMs) {
      // (into the mode before the turn: no turn on a shooter already in it; again with the next attempt's gap once out)
      s.turnAtMs = null; s.attempt += 1;
      if (bangsOn(R, s)) dropBangs(R);
      if (R.stress) dropNoise(R, s);
      if (!s.outSaid) { s.outSaid = true; coachSay(state, bus, PAIRS_COACH.out, 'out', s.k); }
    } else if (s.turnAtMs !== null && now < s.turnAtMs && !readyForTurn(state)) {
      // (off the point, or no longer ready, before the turn: no turn on him; again with the next attempt's gap once ready)
      s.turnAtMs = null; s.attempt += 1;
      if (bangsOn(R, s)) dropBangs(R);
      if (R.stress) dropNoise(R, s);
    } else if (s.turnAtMs === null && outOfIt(state) && readyForTurn(state)) {
      arm(state, s);
      // (a re-armed turn is a fresh cue: the held sector runs VIGIL_MS from now, so a long idle in the mode never
      // drops your own lane to 'alert' (react.js expectOf reads R.cueAtMs beside the command's time))
      if (s.attempt > 0 || now > (R.cmd?.atMs ?? now)) R.cueAtMs = now;
    }
    if (s.turnAtMs !== null && now >= s.turnAtMs) turnString(state, bus, s);
    return;
  }
  s.livedMs += TICK_MS;
  noteStrContact(state, s);
}

// (the string's turners face: the turn, the line hot, the coach's timer running)
function turnString(state, bus, s) {
  const R = rangeOf(state);
  for (const key of s.keys) {
    const T = turnerOf(R, key);
    // (0.0.10: string 5's second turner turns alone, in the RELOAD (stress.js))
    if (!T || key === s.second) continue;
    turnTo(T, s.turnAtMs);
    bus?.emit('turner', { key: T.key, lane: T.lane, phase: 'turn', face: T.face, atMs: T.turnAtMs, toMs: T.turnAtMs + TURN_MS, why: 'standby' });
  }
  s.turnedMs = s.turnAtMs;
  R.hot = true; R.phase = 'string';
  if (R.stress) stressTurn(state, bus, s);
  bus?.emit('range', { phase: 'turn', cmd: R.cmd?.id ?? null, hot: true, rule: null, kind: null, text: null, line: s.line, string: s.k });
}

// (the coach's walk to his new place, at the walk on Mars, one tick at a time)
function coachStep(state, R) {
  const c = actorOf(state, R.coachId), w = R.coachWalk;
  if (!c) { delete R.coachWalk; return; }
  const dx = w.x - c.x, dz = w.z - c.z, d = Math.hypot(dx, dz), step = WALK_MS * TICK_MS / 1000;
  c.$px = c.x; c.$pz = c.z;
  if (d <= step) {
    c.x = w.x; c.z = w.z; c.face = w.face; c.gait = 'idle';
    setPost(state, R.coachId, { area: KD_RANGE.area, x: w.x, z: w.z, face: w.face });
    delete R.coachWalk;
    return;
  }
  c.x = q(c.x + dx / d * step, 1e-4); c.z = q(c.z + dz / d * step, 1e-4); c.gait = 'walk';
  // (walking back he keeps his face downrange, as you do with the rifle in your hands)
  c.face = 'right';
  const p = state.people[R.coachId]?.post;
  if (p) { p.x = c.x; p.z = c.z; }
}

/** The second on the pairs course (handling.js rangeSecond, lived): the string's end when you are still. Returns false (the rest of the second runs). */
export function pairsSecond(state, bus, ctx) {
  const R = rangeOf(state);
  if (!R || R.course !== 'pairs' || R.end) return false;
  checkString(state, bus);
  // (0.0.10, the fixer's: "Bang"'s rest after the noise, said and put behind the brief splash once he stands ready (stress.js))
  if (R.stress && stressRestSecond(state, bus, ctx)) return true;
  return false;
}

// (the take-in that paused on the string's turners: its record's times, read once, from react's contact)
function noteStrContact(state, s) {
  if (s.contactId !== null || s.turnedMs === null) return;
  const c = contactNow(state)?.last;
  if (!c || c.seenMs === undefined || c.seenMs < s.turnedMs || !(c.ids ?? []).some(k => s.keys.includes(k))) return;
  Object.assign(s, { contactId: c.id, seenMs: c.seenMs, pauseMs: c.atMs, takeInMs: c.ms, expect: c.expect ?? null, n: c.n ?? (c.ids ?? []).length });
  const R = rangeOf(state);
  if (bangsOn(R, s) && !R.bangs.calm) R.bangs.calm = calmOf(state, R, s, c);
  if (R.stress) stressContact(state, R, s, c);
}

/**
 * The banged string's calm figure by the book (the sheet's §8 item 20: the formula, no dice), taken at its pause: the
 * turn's sighting as it was (physics: the turner's face coming round), the take-in at band 0 for the same case
 * (react.js takeInOf, the roll passed), Off safe below rung 2 (firearms.js actionMs), the aim from where the rifle was
 * (shot.js aimMsOf) at timeK 1 (the chaos's time factor taken back out), and the press before the round: the Pair row's
 * TRIGGER_S where its Marksmanship gate is met (specials.js rowPlan), none with Fire (its round leaves as its pull begins).
 */
export function calmOf(state, R, s, c) {
  const pid = playerId(state), gunId = gunOn(state, pid), gun = state.items?.[gunId], wf = TEST_SHEETS[R.sheet]?.wf ?? 0;
  const k = suppTimeK(feltOf(state, pid, state.clock.ms));
  const T = turnerOf(R, (c.ids ?? []).find(key => s.keys.includes(key)) ?? s.keys[0]);
  const values = TEST_SHEETS[R.sheet]?.values ?? {}, roller = { pid, light: 1, timeK: 1, value: (sk) => values[sk] ?? 0, mods: () => [] };
  const sightMs = s.seenMs - s.turnedMs, takeInMs = takeInOf({ wf, expect: s.expect ?? 'sector', n: s.n ?? 1 }).ms;
  const rung = rungOf(state, pid, 'room'), offSafeMs = rung < 2 && gun ? actionMs(roller, gun, 'selector:semi') : 0;
  const aimMs = T && gun ? Math.round(aimMsOf(state, pid, gunId, T) / k) : 0, fireMs = (values.marksmanship ?? 0) >= ROWS.pair.gate ? Math.round(TRIGGER_S * 1000) : 0;
  // (the game's own clock: the first step at the pause; below rung 2 Off safe, the aim and the shot each its own step,
  // chosen on the first tick after the last ended; from rung 2 the row's aim and press run on in one step)
  const go = sightMs + takeInMs;
  const turnToFirstMs = rung < 2 ? whole(whole(go + offSafeMs) + aimMs) + fireMs : go + aimMs + fireMs;
  return { sightMs, takeInMs, offSafeMs, aimMs, fireMs, turnToFirstMs };
}

/** The string's end if it is over and you are still (see the header): called on each lived second and after each step. */
export function checkString(state, bus) {
  const R = rangeOf(state), s = R?.str;
  if (!s || s.done || s.turnedMs === null || R.end) return null;
  if (!stillOf(state) || pendingOf(state)) return null;
  noteStrContact(state, s);
  const faces = s.keys.map(k => turnerOf(R, k)).filter(Boolean);
  const threats = faces.filter(T => T.face !== 'noshoot');
  const gun = state.items?.[gunOn(state, playerId(state))];
  let why = null;
  if (s.noshootHit) why = 'noshoot';
  else if (threats.length && threats.every(T => T.stoppedAtMs !== null)) why = 'stopped';
  else if (R.stress ? stressTimeUp(R, s) : s.livedMs >= STRING_MAX_MS) why = 'time';
  else if (roundsLeft(state) === 0) why = 'dry';
  else if (s.shots.some(x => x.fired) && gun && gunField(gun, 'mode') === 'safe' && !(R.stress && stressWaits(R, s))) why = 'declared';
  if (why) stringEnd(state, bus, why);
  return why;
}

/** The string over (see the header): its paper, the coach's word, the line cold, its turners turned away. why: 'stopped' | 'noshoot' | 'time' | 'dry' | 'declared'. */
export function stringEnd(state, bus, why) {
  const R = rangeOf(state), s = R?.str;
  if (!s || s.done) return null;
  noteStrContact(state, s);
  s.done = why; s.doneAtMs = state.clock.ms;
  R.hot = false;
  awayAll(state, bus, 'string', s.keys);
  // (0.0.9: the banged string's record of the bangs (see the header), on its paper and the card)
  if (bangsOn(R, s)) s.bangs = bangRec(state, R, s);
  // (0.0.10: the stress string's noise on its paper (stress.js stressPaper))
  if (R.stress) s.stress = stressPaper(state, R, s);
  const paper = paperOf(s);
  const rows = [];
  for (const x of s.shots) if (x.row && !x.rowI) rows.push(x.row);
  const rec = { k: s.k, line: s.line, keys: [...s.keys], expect: s.expect, n: s.n, takeInMs: s.takeInMs, pauseToFirstMs: paper.pauseToFirstMs, splitsMs: paper.splitsMs, zones: paper.zones, rows, done: why, paper: paper.text,
    ...(s.bangs ? { bangs: { ...s.bangs, offSafe: [...s.bangs.offSafe] } } : {}),
    ...(s.stress ? { stress: { ...s.stress, offSafe: [...s.stress.offSafe], reload: s.stress.reload ? { ms: s.stress.reload.ms, tries: [...s.stress.reload.tries] } : null } } : {}) };
  R.strs.push(rec);
  bus?.emit('range', { phase: 'paper', cmd: R.cmd?.id ?? null, hot: false, rule: null, kind: null, text: paper.text, line: s.line, string: s.k, why, paper });
  if (why === 'time') fault(state, bus, 'time', 'warn', hashPick(PAIRS_COACH.time, 'pairs-coach', state.meta.seed, 'time', s.k), { fired: s.shots.some(x => x.fired) });
  if (why === 'dry') coachSay(state, bus, PAIRS_COACH.dry, 'dry', s.k);
  if (why === 'declared') coachSay(state, bus, PAIRS_COACH.declared, 'declared', s.k);
  coachSay(state, bus, s.shots.some(x => x.fired) ? fill(PAIRS_COACH.paper, { paper: paper.text }) : PAIRS_COACH.none, 'paper', s.k);
  if (s.bangs?.n) coachSay(state, bus, PAIRS_COACH.bangsAfter, 'bangsAfter');
  if (R.stress) stressEnd(state, bus, s, why);
  if (s.k === LAST_STRING) openLull(state, bus);
  return rec;
}

// (a string closed by a command the move-on passed it to: never turned, or never finished; its paper as it stands)
function closeString(state, bus, why) {
  const R = rangeOf(state), s = R.str;
  if (s.turnedMs === null) {
    if (bangsOn(R, s)) dropBangs(R);
    s.done = why; s.doneAtMs = state.clock.ms;
    R.strs.push({ k: s.k, line: s.line, keys: [...s.keys], expect: null, n: 0, takeInMs: null, pauseToFirstMs: null, splitsMs: [], zones: {}, rows: [], done: why, paper: '' });
    if (R.stress) stressEnd(state, bus, s, why);
    if (s.k === LAST_STRING) openLull(state, bus);
    return;
  }
  stringEnd(state, bus, why);
}

// ---- the paper ----

// (the freeze in all: the startles the bangs began, each counted once where they overlap, to ms (see the header))
const frozeOf = (f, ms = Infinity) => f.reduce((a, x) => a + Math.max(0, Math.min(x.untilMs, ms) - x.fromMs), 0);
// (the banged string's bangs as its paper and the card keep them: how many went off, the freeze, the felt peak and its band,
// Off safe's tries as ✓ and ✗ (the single, below rung 2), the turn to the first round)
function bangRec(state, R, s) {
  const plan = R.bangs.plan, f = R.bangs.froze, first = s.shots.filter(x => x.fired).sort((a, b) => a.atMs - b.atMs)[0] ?? null;
  return { n: plan.filter(b => b.done).length, feltPeak: R.bangs.feltPeak, band: bandOf(R.bangs.feltPeak), frozeMs: frozeOf(f),
    offSafe: [...(s.offSafe ?? [])], turnToFirstMs: first && s.turnedMs !== null ? first.atMs - s.turnedMs : null,
    // (the paper's own sum, TURN TO PAUSE + PAUSE TO FIRST: the card's first round, so one quantity shows one number (the runtime
    // review of v0.0.9: the card said 5.20 s from the turner moving beside a paper summing to 5.10 s from the sighting))
    seenToFirstMs: first && Number.isFinite(s.takeInMs) && Number.isFinite(s.pauseMs) ? s.takeInMs + first.atMs - s.pauseMs : null };
}

/** The shot timer's record of a string (see the header): { takeInMs, pauseToFirstMs, splitsMs, zones, text } (the banged string's with bangs, frozeMs, offSafe). */
export function paperOf(str) {
  const fired = (str?.shots ?? []).filter(x => x.fired).sort((a, b) => a.atMs - b.atMs || (a.id < b.id ? -1 : 1));
  const zones = {};
  for (const x of fired) { const z = x.noshoot ? 'noshoot' : x.down ? 'headDown' : x.ring && !x.through ? 'ring' : x.zone ?? 'miss'; zones[z] = (zones[z] ?? 0) + 1; }
  const splitsMs = fired.slice(1).map((x, i) => x.atMs - fired[i].atMs);
  const pauseToFirstMs = fired.length && str.pauseMs !== null && str.pauseMs !== undefined ? fired[0].atMs - str.pauseMs : null;
  const paper = { takeInMs: str?.takeInMs ?? null, pauseToFirstMs, splitsMs, zones, ...(str?.bangs ? { bangs: str.bangs.n, frozeMs: str.bangs.frozeMs, offSafe: [...str.bangs.offSafe] } : {}),
    // (0.0.10: the stress course's fields (stress.js stressPaper): the noise, its blanks and bangs, the freeze, Off safe, string 5's RELOAD and SECOND)
    ...(str?.stress ? { noise: str.stress.noise, blanks: str.stress.blanks, ...(Number.isFinite(str.stress.blanksPlan) ? { blanksPlan: str.stress.blanksPlan } : {}), bangs: str.stress.bangs, frozeMs: str.stress.frozeMs, offSafe: [...str.stress.offSafe],
      reload: str.stress.reload ? { ms: str.stress.reload.ms, tries: [...str.stress.reload.tries] } : null, secondMs: str.stress.secondMs } : {}) };
  return { ...paper, text: paperText(paper) };
}

/**
 * The paper's line, the one helper of the coach, the paper and the card: 'TURN TO PAUSE 0.55 · PAUSE TO FIRST 1.45 · SPLITS
 * 0.40 · 2 A'; the banged string's (0.0.9) 'BANGS 3 · FROZE 2.45 S · TURN TO PAUSE 1.25 · PAUSE TO FIRST 3.20 · OFF SAFE ✗ ✗ ✓ ·
 * SPLITS 0.75 · 2 A' (FROZE left out when nothing froze; "OFF SAFE IN THE AIM" when the row's aim took the safe off, rung 2 up).
 */
export function paperText({ takeInMs = null, pauseToFirstMs = null, splitsMs = [], zones = {}, bangs = null, frozeMs = 0, offSafe = [], noise = null, blanks = 0, blanksPlan = null, reload = null, secondMs = null } = {}) {
  const z = ZONES.filter(k => zones[k]).map(k => `${zones[k]} ${ZONE_PAPER[k]}`).join(', ');
  // (0.0.10: the stress course's lead by its noise (calm: none, as pairs'), and any noisy string's Off safe)
  const lead = noise ? stressLead({ noise, blanks, blanksPlan, bangs, frozeMs }) : [bangs ? `BANGS ${bangs}` : null, bangs && frozeMs ? `FROZE ${takeInWords(frozeMs)} S` : null];
  const noisy = noise ? noise !== 'calm' : !!bangs;
  const ticks = (xs) => xs.map(ok => (ok ? '✓' : '✗')).join(' ');
  return [...lead,
    takeInMs === null ? 'NO PAUSE' : `TURN TO PAUSE ${takeInWords(takeInMs)}`, pauseToFirstMs === null ? 'NO ROUNDS' : `PAUSE TO FIRST ${takeInWords(pauseToFirstMs)}`,
    // (the fixer's: from rung 2 the row's aim takes the safe off, said so, so the tier one's paper has the step the recruit failed)
    noisy && offSafe?.length ? `OFF SAFE ${ticks(offSafe)}` : noisy && pauseToFirstMs !== null ? 'OFF SAFE IN THE AIM' : null,
    splitsMs.length ? `SPLITS ${splitsMs.map(takeInWords).join(' ')}` : null,
    reload ? `RELOAD ${reload.ms === null || reload.ms === undefined ? '-' : `${takeInWords(reload.ms)} S`}${reload.tries?.length ? ` ${ticks(reload.tries)}` : ''}` : null,
    secondMs !== null && secondMs !== undefined ? `SECOND ${takeInWords(secondMs)}` : null, z || null].filter(Boolean).join(' · ');
}
// (the stress paper's lead (0.0.10): 'DIN 30 BLANKS', 'BANG CALLED · FROZE 0.85 S', 'BANGS 3 · FROZE 2.40 S'; nothing on the calm string.
// The din leads with its plan, the blanks heard after it when the string ended first ('DIN 30 BLANKS · 22 HEARD': the design
// review of 0.0.10, as the tier one's shorter string read "DIN 22 BLANKS" beside the recruit's 30, as if he had faced less))
function stressLead({ noise, blanks, blanksPlan = null, bangs, frozeMs }) {
  const froze = frozeMs ? `FROZE ${takeInWords(frozeMs)} S` : null;
  if (noise === 'din') return Number.isFinite(blanksPlan) && blanks < blanksPlan ? [`DIN ${blanksPlan} BLANKS`, `${blanks} HEARD`] : [`DIN ${blanks} BLANKS`];
  if (noise === 'called') return ['BANG CALLED', froze];
  if (noise === 'bangs' || noise === 'reload') return [`BANGS ${bangs}`, froze];
  return [];
}

// ---- the shots ----

/**
 * A shot recorded on the pairs course (handling.js recordShot's pairs branch; see the header): the issue's count, the
 * session's shots (the stage's blast and brass: no hole on a 25 m card), the turner's hits and the hit sensor, the
 * steel's ring, a no-shoot hit's fault, the string's record.
 */
export function pairsShot(state, bus, shot) {
  const R = rangeOf(state);
  if (!R || R.course !== 'pairs') return;
  const T = shot.target ? turnerOf(R, shot.target) : null, s = R.str && !R.str.done && R.str.turnedMs !== null ? R.str : null;
  if (shot.fired) {
    const issue = state.armoury.ammoIssues.find(a => a.id === R.issueId);
    if (issue) issue.fired += 1;
    R.shots.push({ id: shot.id, atMs: shot.atMs, lane: null, string: R.string, hole: null, score: 0, v: false, logSeq: shot.logSeq ?? null, key: shot.target ?? null, ...(shot.load && shot.load !== 'ball' ? { load: shot.load } : {}) });
    if (R.shots.length > 100) R.shots.splice(0, R.shots.length - 100);
    if (shot.brassRec) { R.brass.push(shot.brassRec); if (R.brass.length > BRASS_LIVE) R.brass.splice(0, R.brass.length - BRASS_LIVE); }
    if (!R.end) {
      if (!R.hot) R.coldShots = (R.coldShots ?? 0) + 1;
      noteTick(state, { shot: { lane: undefined } });
    }
  }
  if ((!shot.fired && shot.why === 'dud') || shot.stoppage) R.stoppage = { atMs: shot.atMs, kind: shot.set ?? (shot.stoppage === 'double' ? 'double' : shot.stoppage ? 'stovepipe' : 'dud'), set: !!shot.set, cleared: false };
  if (!shot.fired) return;
  if (s) noteStrContact(state, s);
  const zone = shot.zone ?? null, part = shot.part ?? 'torso', hit = !!T && zone !== null && (T.face !== null);
  if (T && hit) {
    T.hits.push({ shotId: shot.id, part, zone, ring: !!shot.ring, through: !!shot.through, at: shot.hole?.at ?? null, atMs: shot.atMs });
    if (T.face === 'noshoot') {
      if (s && s.keys.includes(T.key)) s.noshootHit = true;
      fault(state, bus, 'noshoot', 'warn', hashPick(PAIRS_COACH.noshoot, 'pairs-coach', state.meta.seed, 'noshoot', shot.id));
    } else if (T.stoppedAtMs === null) {
      const torso = T.hits.filter(h => h.part === 'torso' && (h.zone === 'A' || h.zone === 'C')).length, head = T.hits.filter(h => h.zone === 'head').length;
      if (T.face === 'armoured') {
        if (shot.ring) bus?.emit('fx', { kind: 'spark', x: T.x, y: q(T.y + (shot.hole?.at ? -shot.hole.at[1] / 100 : 0), 0.01), z: q(T.z + (shot.hole?.at ? shot.hole.at[0] / 100 : 0), 0.01), atMs: shot.atMs, dir: Math.PI, size: 0.4 });
        const down = shot.down ?? (part === 'head' && zone === 'head' && !shot.ring);
        if (down) stopTurner(state, bus, T, shot.atMs);
      } else if (torso >= STOP_TORSO || head >= STOP_HEAD) stopTurner(state, bus, T, shot.atMs);
    }
  }
  // (the row by its own names, not an 'id' field: a saved record's ids are counted ids, a row's is a step's name)
  if (s) s.shots.push({ id: shot.id, atMs: shot.atMs, fired: true, key: shot.target ?? null, part, zone: hit ? zone : null, ring: !!shot.ring, noshoot: hit && T?.face === 'noshoot',
    ...(hit && shot.through ? { through: true } : {}), ...(hit && T?.face === 'armoured' && T.stoppedAtMs === shot.atMs ? { down: true } : {}),
    ...(shot.row ? { row: shot.row.id, rowN: shot.row.n ?? null, rowI: shot.row.i ?? 0 } : {}) });
}
// (the hit sensor: down, and turned away SENSOR_MS after)
function stopTurner(state, bus, T, atMs) {
  T.stoppedAtMs = atMs;
  turnAway(T, atMs + SENSOR_MS);
  bus?.emit('turner', { key: T.key, lane: T.lane, phase: 'away', face: T.face, atMs: T.awayAtMs, toMs: T.awayAtMs + TURN_MS, why: 'hit' });
}

/**
 * A step begun on the pairs course (handling.js onStepStart): a reload's purpose, read from what the marine believed at its
 * start (d.reloadWhy): 'dry' on a bolt believed locked on an empty, 'lull' once the lull is open (R.lull: from the last
 * string's end; any reload there, RELOAD on an empty bolt too), 'topUp' inside a string, 'between' otherwise (the code review of v0.0.8: every
 * Top up between strings was "lull" and every RELOAD "dry", so the card credited the wrong ones both ways).
 */
export function pairsStepStart(state, bus, d) {
  const R = rangeOf(state);
  if (!R || R.course !== 'pairs' || R.end) return;
  // (0.0.9: a step begun: the DI's line after a startle lasts until one (instinct/pairs.js pairs-froze); on the banged
  // string the take-in noted first, so its calm figure reads the rifle where it was at the pause, before the step moves it)
  if (R.bangs) R.bangs.lastStepMs = d.fromMs;
  if ((bangsOn(R, R.str) || (R.stress && R.str)) && !R.str.done && R.str.turnedMs !== null) noteStrContact(state, R.str);
  if (R.stress) stressStepStart(state, bus, d);
  if (!/^macro:reload:(speed|retain|tactical)$/.test(d?.step ?? '')) return;
  const b = beliefOf(state, gunOn(state, playerId(state))), mid = !!R.str && !R.str.done && R.str.turnedMs !== null;
  d.reloadWhy = R.lull && !mid ? 'lull' : b?.locked && b.count === 0 ? 'dry' : mid ? 'topUp' : 'between';
}

// (the handling sub-steps rolled while the felt stood at BANG_FELT or more, each at its start (the step's from plus the subs
// before it), into R.bangs.steps (the card's "under the bangs"); Off safe's tries on the banged string's live string, its
// paper's ✓ and ✗ (below rung 2, where Off safe is a step of its own); the last Off safe, the DI's "Again. Thumb it off."
// (see the header))
const SHOT_PARTS = new Set(['aim', 'hold', 'press', 'round', 'shift', 'fire', 'wait']);
function noteBangSteps(state, R, d, pid) {
  const s = R.str, live = !!s && !s.done && s.turnedMs !== null && rungOf(state, pid, 'room') < 2;
  let at = d.fromMs;
  for (const rec of d.subs ?? []) {
    const atMs = at;
    at += rec.ms ?? 0;
    if (!rec.action || SHOT_PARTS.has(rec.action) || rec.action.startsWith('contact:') || rec.action.startsWith('stance:') || rec.grade === null || rec.grade === undefined) continue;
    if (rec.action === 'selector:semi') {
      R.bangs.offSafe = { atMs, ok: rec.ok !== false };
      if (live && bangsOn(R, s)) (s.offSafe ??= []).push(rec.ok !== false);
    }
    const felt = feltOf(state, pid, atMs);
    if (felt < BANG_FELT) continue;
    R.bangs.steps.push({ step: d.step, action: rec.action, label: LABELS_OF[rec.action] ?? ACTIONS[rec.action]?.label ?? rec.action, grade: rec.grade, ok: rec.ok !== false, mishap: rec.mishap ?? null, felt, atMs, fromMs: d.fromMs });
  }
}
const LABELS_OF = Object.freeze({ 'selector:semi': 'Off safe', 'selector:safe': 'On safe', reach: 'Reach', seat: 'Seat', release: 'Bolt home', 'magOut:drop': 'Drop the magazine', 'magOut:pouch': 'Magazine to a pouch', charge: 'Charge', up: 'Rifle up' });

// (a paper threat that took STOP_TORSO in the torso, or the steel that rang on a torso round, and still stands: "Still up!")
const stillUpT = (T, since) => T.stoppedAtMs === null && T.face !== 'noshoot'
  && (T.hits.some(h => h.part === 'torso' && h.ring && !h.through && h.atMs >= since) || T.hits.filter(h => h.part === 'torso' && h.zone && h.atMs >= since).length >= STOP_TORSO);

/** A step ended on the pairs course (handling.js afterStep): the reloads by purpose, the short magazine, the lull's Top up, "Still up!", the string's end. */
export function pairsAfterStep(state, bus, d, why) {
  const R = rangeOf(state);
  if (!R || R.course !== 'pairs' || R.end) return;
  const pid = playerId(state), gun = state.items?.[gunOn(state, pid)], now = state.clock.ms;
  if (R.bangs) noteBangSteps(state, R, d, pid);
  if (R.stress) stressAfterStep(state, bus, d, why);
  const kind = /^macro:reload:(speed|retain|tactical)$/.exec(d.step ?? '')?.[1] ?? null;
  if (kind && why === 'end') {
    // (its purpose: the short one named, else as read at its start (pairsStepStart; a step of an older save: 'between'))
    const mid = !!R.str && !R.str.done && R.str.turnedMs !== null;
    const purpose = R.wantMag && gun?.mag === R.wantMag ? 'short' : d.reloadWhy ?? 'between';
    R.reloads.push({ kind, atMs: d.fromMs, ms: now - d.fromMs, why: purpose, string: mid ? R.str.k : null });
    if (purpose === 'lull' && R.lull && !R.lull.topUp) { R.lull.topUp = { atMs: d.fromMs, ms: now - d.fromMs }; coachSay(state, bus, PAIRS_COACH.lull, 'lull'); }
  }
  // (the short magazine seated, by Top up or any other way: the coach's "Good", his name for it done with)
  if (R.wantMag && gun?.mag === R.wantMag) { R.wantMag = null; R.shortIn = true; coachSay(state, bus, R.stress ? STRESS_COACH.short : PAIRS_COACH.short, 'short'); }
  // (an armoured face, or a paper one, hit in the torso and still standing after a row: the coach's "Still up!", once a string)
  const s = R.str;
  // (only what should have put him down and did not: the steel's ring, or two in the torso; one round on paper is not it
  // (the design review of v0.0.8: 47 "still up"s in 20 runs, on paper))
  if (s && !s.done && s.turnedMs !== null && !s.stillUpSaid && /^shot:/.test(d.step ?? '')) {
    const up = s.keys.map(k => turnerOf(R, k)).find(T => T && stillUpT(T, s.turnedMs));
    if (up) { s.stillUpSaid = true; coachSay(state, bus, PAIRS_COACH.stillUp, 'stillUp', s.k); }
  }
  checkString(state, bus);
}

// ---- the view ----

const rnd2 = (ms) => (ms === null || ms === undefined ? null : Math.round(ms));
/** The card's facts of a session (see the header): { turn, shots, gun }. */
function cardOf(state, R) {
  const strs = R.strs.filter(x => x.done !== 'setup');
  const turn = strs.filter(x => x.takeInMs !== null).map(x => ({ k: x.k, expect: x.expect, n: x.n, takeInMs: x.takeInMs }));
  const shots = { rounds: 0, ...Object.fromEntries(ZONES.map(z => [z, 0])), rows: {} };
  for (const x of strs) {
    for (const z of ZONES) { shots[z] += x.zones?.[z] ?? 0; shots.rounds += x.zones?.[z] ?? 0; }
    for (const id of x.rows ?? []) shots.rows[id] = (shots.rows[id] ?? 0) + 1;
  }
  // (the RELOAD on the empty: string 4's (the short magazine's point), else the first on a bolt believed locked on an
  // empty; the Top up only one made in the lull (the code review of v0.0.8: no fallback to a Top up between strings))
  const reload = R.reloads.find(r => r.why === 'dry' && r.string === 4) ?? R.reloads.find(r => r.why === 'dry') ?? null, topUp = R.lull?.topUp ?? null;
  const issue = state.armoury.ammoIssues.find(a => a.id === R.issueId);
  // (the same sheet's take-in in a room it is clearing (react.js EXPECT.area), so the bay's numbers sit beside the user's "0.8+")
  const wf = TEST_SHEETS[R.sheet]?.wf ?? null, roomMs = wf === null ? null : takeInOf({ wf, expect: 'area' }).ms;
  return { turn, roomMs, shots, gun: { reload: reload ? { kind: reload.kind, ms: reload.ms } : null, topUp: topUp ? { ms: topUp.ms } : null, short: !!R.shortIn, rounds: roundsOf(state, R, issue) } };
}
// (the rounds as the coach counts them: issued, fired, and held: on you (handling.js roundsLeft) and those thrown out of the
// port by a hand (an unload's chambered round, lying on the regolith: the session's brass of kind 'round'))
function roundsOf(state, R, issue = state.armoury.ammoIssues.find(a => a.id === R.issueId)) {
  const thrown = (R.brass ?? []).filter(b => b.kind === 'round' || b.kind === 'tracer').length;
  return { issued: issue?.n ?? 0, fired: issue?.fired ?? 0, held: roundsLeft(state) + thrown };
}

/** The end card's line (see the header): "Private · 5 strings · take-in 0.55 to 1.25 s · 13 A, 1 C, 2 head · no-shoot untouched · RELOAD 2.53 s · topped up". */
function summaryOf(state, R, card) {
  const label = TEST_SHEETS[R.sheet]?.label ?? R.sheet;
  const all = R.strs.filter(x => x.done !== 'setup').length, done = R.strs.filter(x => x.done !== 'setup' && x.paper).length, t = card.turn.map(x => x.takeInMs);
  const zones = ZONES.filter(z => z !== 'noshoot' && card.shots[z]).map(z => `${card.shots[z]} ${ZONE_CARD[z]}`).join(', ');
  // (the faults named, in STOP_WORDS' words: "1 fault: forward of the line" (the design review of v0.0.8: "· 1 fault" alone))
  const fl = R.faults.filter(f => f.rule !== 'noshoot'), faults = fl.length, faultWords = [...new Set(fl.map(f => stopWords(f.rule)))].join(', ');
  const head = R.end?.phase === 'stopped' ? `Stopped${R.end.why ? `: ${stopWords(R.end.why)}` : ''}` : null;
  // (the strings turned and timed; "3 of 5" where the coach passed some over)
  return [head, label, `${done < all ? `${done} of ${all}` : done} string${(done < all ? all : done) === 1 ? '' : 's'}`, t.length ? `take-in ${takeInWords(Math.min(...t))}${t.length > 1 && Math.max(...t) !== Math.min(...t) ? ` to ${takeInWords(Math.max(...t))}` : ''} s` : null,
    zones || (card.shots.rounds ? null : 'no rounds fired'), card.shots.noshoot ? `no-shoot hit ${card.shots.noshoot === 1 ? 'once' : `${card.shots.noshoot} times`}` : 'no-shoot untouched',
    card.gun.reload ? `${card.gun.reload.kind === 'retain' ? 'RELOAD, keep the empty' : 'RELOAD'} ${takeInWords(card.gun.reload.ms)} s` : null,
    card.gun.topUp ? 'topped up' : null, faults ? `${faults} fault${faults === 1 ? '' : 's'}: ${faultWords}` : null].filter(Boolean).join(' · ');
}

/** The session on the pairs course as the hud, the bots and the end card read it (see the header), or null. */
export function pairsNow(state, ms = state.clock.ms) {
  const R = rangeOf(state);
  if (!R || R.course !== 'pairs') return null;
  const s = R.str, card = cardOf(state, R);
  const turners = (R.turners ?? []).map(T => ({ key: T.key, lane: T.lane, x: T.x, z: T.z, y: T.y, facingK: q(facingOf(T, ms), 0.001), down: T.stoppedAtMs !== null }));
  return {
    sheet: R.sheet, label: TEST_SHEETS[R.sheet]?.label ?? R.sheet, lane: R.lane, line: R.line, string: R.string, hot: R.hot, cmd: R.cmd?.id ?? null, cmdI: R.cmd?.i ?? null,
    str: s ? { k: s.k, keys: [...s.keys], line: s.line, done: s.done, armed: s.turnAtMs !== null && s.turnedMs === null, turned: s.turnedMs !== null, turnAtMs: s.turnAtMs, paper: s.done ? R.strs.at(-1)?.paper ?? null : null } : null,
    strs: R.strs.map(x => ({ ...x })), turners, reloads: R.reloads.map(r => ({ ...r })), lull: R.lull ? { ...R.lull, on: lullOf(state, playerId(state), ms) } : null,
    wantMag: R.wantMag ?? null, mags: { ...R.mags }, rounds: card.gun.rounds, point: pairsPoint(state), card, end: R.end, summary: summaryOf(state, R, card),
    setup: R.setup ?? null, bangs: R.bangs ? bangsNow(state, ms) : null, ...(R.stress ? { stress: stressNow(state, ms) } : {}),
  };
}

/**
 * Whether a planned bang not yet gone off will land within STARTLE_JOIN_MS of the player's startle's end (supp.js joins
 * such a startle to the freeze): the face holds FROZE and the DI holds "You flinched." until the series is over, so the
 * stamp shows once with the whole freeze (the reviews of v0.0.9: "FROZE 1.90 S", then "FROZE 2.40 S" 0.1 s later).
 */
export function bangDue(state) {
  const R = rangeOf(state), B = R?.bangs, k = blockOf(state, playerId(state));
  if (!Number.isFinite(k?.startleUntilMs)) return false;
  // (0.0.10: the stress course's planned bangs too)
  if (R?.stress) return stressBangDue(R, k.startleUntilMs, STARTLE_JOIN_MS);
  if (!B?.plan?.length) return false;
  return B.plan.some(b => !b.done && b.atMs <= k.startleUntilMs + STARTLE_JOIN_MS);
}

/**
 * "Three bangs" as the end card reads it (see the header), or null off the setup: { plan: [{ id, atMs, done }], feltPeak,
 * band, frozeMs, turnToFirstMs, steps: { offSafe: { tries, fails, drops }, reload: { tries, fails, drops }, failed: [{
 * action, label, grade, mishap, felt, atMs }] }, calm: { sightMs, takeInMs, offSafeMs, aimMs, fireMs, turnToFirstMs } | null,
 * seenToFirstMs (the paper's TURN TO PAUSE + PAUSE TO FIRST), summary: 'Boot recruit · three bangs · the chaos 105 − hardening 7
 * (green) = felt 98, pinned · froze 2.45 s · Off safe 3 tries, 2 failed · first round 7.10 s after you saw him (calm 2.50 s)' }. The steps are those rolled while the felt stood at BANG_FELT or more; a RELOAD is a
 * try of RELOAD (speed or keep the empty) and its "Carry on", failed when any of its parts failed.
 */
export function bangsNow(state, ms = state.clock.ms) {
  const R = rangeOf(state);
  if (!R?.bangs) return null;
  const B = R.bangs, s = R.str && bangsOn(R, R.str) ? R.str : null, rec = R.strs.find(x => x.k === BANGS.string && x.bangs)?.bangs ?? (s ? bangRec(state, R, s) : null);
  const frozeMs = frozeOf(B.froze, ms);
  const off = B.steps.filter(x => x.action === 'selector:semi');
  // (a RELOAD try by its step; a "Carry on" of a halted one is the same try)
  const rl = [];
  let cur = null;
  for (const x of B.steps) {
    if (/^macro:reload:(speed|retain)$/.test(x.step)) { if (cur?.fromMs !== x.fromMs) rl.push(cur = { fromMs: x.fromMs, fail: false, drop: false }); }
    else if (!(x.step === 'queue' && cur && RELOAD_PARTS.has(x.action))) { cur = null; continue; }
    cur.fail ||= !x.ok; cur.drop ||= x.mishap === 'dropMag';
  }
  const steps = { offSafe: { tries: off.length, fails: off.filter(x => !x.ok).length, drops: off.filter(x => x.mishap === 'dropped').length },
    reload: { tries: rl.length, fails: rl.filter(t => t.fail).length, drops: rl.filter(t => t.drop).length },
    failed: B.steps.filter(x => !x.ok).map(x => ({ action: x.action, label: x.label, grade: x.grade, mishap: x.mishap, felt: x.felt, atMs: x.atMs })) };
  const turnToFirstMs = rec?.turnToFirstMs ?? null, calm = B.calm ? { ...B.calm } : null;
  // (the first round from the sighting, the paper's TURN TO PAUSE + PAUSE TO FIRST, beside the book's same sum)
  const seenToFirstMs = rec?.seenToFirstMs ?? null, calmSeenMs = calm ? calm.turnToFirstMs - (calm.sightMs ?? 0) : null;
  const label = TEST_SHEETS[R.sheet]?.label ?? R.sheet, n = B.plan.filter(b => b.done && b.atMs <= ms).length;
  // (the chaos's sum at its peak, the same on every sheet's line, its hardening the offset: the lesson (the design review))
  const H = hardOf(state, playerId(state), ms), f = B.feltPeak, chaos = f > 0 && f < 100 ? f + H : B.poolPeak ?? f + H;
  const summary = [label, n ? `${NUM_WORDS[n] ?? n} bang${n === 1 ? '' : 's'}` : 'no bangs yet', n ? `the chaos ${chaos} − hardening ${H} (${hardWord(H)}) = felt ${f}, ${bandOf(f)}` : null, frozeMs ? `froze ${takeInWords(frozeMs)} s` : n ? 'never froze' : null,
    steps.offSafe.tries ? `Off safe ${steps.offSafe.tries} ${steps.offSafe.tries === 1 ? 'try' : 'tries'}, ${steps.offSafe.fails} failed` : null,
    steps.reload.tries ? `RELOAD ${steps.reload.tries} ${steps.reload.tries === 1 ? 'try' : 'tries'}, ${steps.reload.fails} failed` : null,
    seenToFirstMs !== null ? `first round ${takeInWords(seenToFirstMs)} s after you saw him${calm ? ` (calm ${takeInWords(calmSeenMs)} s)` : ''}` : null].filter(Boolean).join(' · ');
  return { plan: B.plan.map(b => ({ id: b.key, atMs: b.atMs, done: b.done && b.atMs <= ms })), feltPeak: B.feltPeak, band: bandOf(B.feltPeak), frozeMs, turnToFirstMs, seenToFirstMs, steps, calm, summary };
}
const NUM_WORDS = Object.freeze(['none', 'one', 'two', 'three', 'four', 'five']);
const RELOAD_PARTS = new Set(['reach', 'seat', 'release', 'magOut:drop', 'magOut:pouch']);

/** What the end card's "Again as …" starts: the same seed, another sheet, the same setup (0.0.9: 'bangs', or null; scenes never write a career). */
export const againAs = (state, tier) => (rangeOf(state)?.stress ? againAsStress(state, tier) : { scenario: 'test-pairs', seed: state.meta.seed, tier: tierOf(tier), setup: rangeOf(state)?.setup ?? null });

/**
 * What the picture may show of a turner's face (PEOPLE §7.6: the picture draws whoever the character perceives; COMBAT
 * §25.4.6): every paper face one neutral board ('paper'), the steel as steel (seen as steel at a glance), and what it
 * holds only once this turn's take-in has identified it (contact.js last.ident; a Challenge's answer too): 'unseen', or
 * a turn not yet taken in, draws empty hands' place blank (the reviews of v0.0.8: olive for a threat and pale for a
 * no-shoot, painted from the turn, told the player what the marine did not know).
 */
export function seenFace(state, T, ms = state.clock.ms) {
  if (!T?.face) return { face: null, holds: null };
  const last = contactNow(state, ms)?.last ?? null, mine = last && T.turnAtMs !== null && last.seenMs >= T.turnAtMs && (last.ids ?? []).includes(T.key);
  const id = mine ? last.ident?.[T.key] ?? null : null;
  return { face: T.face === 'armoured' ? 'armoured' : 'paper', holds: id && id !== 'unseen' ? id : null };
}

/** The stage's door on the pairs course (look.js rangeLook().pairs; the build sheet §2.4): the line, the turners as the marine sees them (seenFace), the painted lines. */
export function pairsLook(state, ms = state.clock.ms) {
  const R = rangeOf(state);
  if (!R || R.course !== 'pairs') return null;
  const turners = (R.turners ?? []).map(T => ({
    key: T.key, lane: T.lane, x: T.x, z: T.z, y: T.y, facingK: q(facingOf(T, ms), 0.001), ...seenFace(state, T, ms),
    holes: T.hits.filter(h => h.at && h.atMs <= ms).map(h => ({ xCm: h.at[0], yCm: h.at[1], zone: h.zone, ring: !!h.ring, atMs: h.atMs })),
    down: T.stoppedAtMs !== null && T.stoppedAtMs <= ms, plateAtMs: T.face === 'armoured' ? T.stoppedAtMs : null,
  }));
  // (0.0.9: the bangs as planned: the throw's arc from the coach's hand, the body on the pad, done at its time)
  const bangs = (R.bangs?.plan ?? []).map(b => ({ id: b.key, x: b.x, z: b.z, fromX: b.fromX, fromZ: b.fromZ, throwAtMs: b.throwAtMs, atMs: b.atMs, done: b.done && b.atMs <= ms }));
  return { line: R.line, turners, lines: [7, 10].map(d => ({ x: PAIRS.lines[d].x, label: `${d} M` })), bangs };
}

/** rangeNow's shape on the pairs course (handling.js rangeNow), its summary the end card's line. */
export function pairsRangeNow(state, R, ms = state.clock.ms) {
  const P = pairsNow(state, ms), pt = pairsPoint(state);
  return {
    course: R.course, lane: R.lane, phase: R.phase, string: R.string, cmd: R.cmd?.id ?? null, cmdI: R.cmd?.i ?? null, cmdAtMs: R.cmd?.atMs ?? null, hot: R.hot,
    observerId: R.coachId, roId: R.roId, paper: 'man',
    line: { lane: R.lane, box: pt.box, fp: pt.fp, target: null, downrangeRad: KD_RANGE.downrangeRad, line: R.line },
    strings: P.strs, end: R.end, pairs: P, summary: P.summary,
    score: { shots: P.card.shots.rounds, hits: P.card.shots.A + P.card.shots.C + P.card.shots.head + P.card.shots.ring + P.card.shots.headDown, faults: R.faults.length, clearAtMs: R.end?.phase === 'clear' ? R.end.atMs : null },
    dry: !!R.dry,
  };
}

/** Whether the short magazine has been named and is not yet in (the instinct's pairs-short, the panel's). */
export const shortWanted = (state) => { const R = rangeOf(state); return !!R && R.course === 'pairs' && !!R.wantMag && state.items?.[gunOn(state, playerId(state))]?.mag !== R.wantMag; };
export { isPairs };
