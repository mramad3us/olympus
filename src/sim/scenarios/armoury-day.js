// OLYMPUS scenarios: test-armoury, "The window and the canopy": your R-7 drawn by serial at the armoury's window 1 and shown clear, the serials in the rank, twenty rounds by count, the relay as its outcome, the lane's show clear and brass, "No brass, no ammo", the canopy's cleaning against the squad leader's ten-thirty, the clearing barrel and the armourer's inspection (ROADMAP §4.2's 0.0.8; PLACES #15, §4.6; WEAPONS §9, §10; the build sheet v0.0.28 items 1 to 16).
//
// Not a new engine: the range's course engine (handling.js) with one more course, 'armoury', its own branch at each of the engine's
// doors and nowhere else (seqOf, lineReady, onRangeCmd, rangeSecond, standingCmd, moveOn, rangeNow): every other course to the tick.
// The scene's sequence is courses.js SEQ_ARMOURY, each command said by its speaker as a text bubble (the armourer behind window 1, the
// squad leader, the ammunition NCO; the user, 2026-11-19: "forget voice synthesis, no voices."), the next posted by the scene once the
// line is ready (armouryNext: the slip's way back to the window, a turn-back's to the table, else the next in order). The people are
// generated (the user, 2026-11-05: "All people generated"): the three posts (posts.js melas:armourer-1, -2, kd-ammo), your squad and its
// leader the roster's; the squad is placed at each stage's spots inside the splashes, never walking (the build sheet's risk 9).
//
// What is lived: the window (the card, the serial, the show clear, the signature), the rank's serial check, the ammunition point (the
// count, the signature, rounds back, the declaration), the lane after the relay (UNLOAD, SHOW CLEAR, police your brass), the canopy's
// one choice (the tempo), the barrel and the window again (the inspection, the signature). Behind a splash (data/activities.js 'arm-*'):
// the bus there and back, the relay itself (its outcome, relayOutcome), the walk from the lane, the working party and the shakedown, the
// squad leader's fetch out of the box, the armourer's pin chit; the cleaning is TIME's clean-rifle (A's, its roll at its end).
// The stations (each a spot with a yellow ring while a command wants you there, armouryLook): window 1's customer spot, your place in the
// rear rank, the ammunition point's table, the lane's point, your table under the canopy, the left clearing barrel. On a station R does
// the act the standing command asks for and R held lists every act there, struck ones with their reason (places/hand.js's scene hook,
// registered by armoury-hand.js); off one R's plate is struck ("Wait for the command"), so no wait skips the scene. The ring is drawn
// while you are off the station, and the DI's keys lead to it the way round what stands between (walkVia, the walkers' grid). Every act is a lived
// step of its own length (ACT_MS), its effect at its end; UNLOAD, SHOW CLEAR on R is the macro played whole at its end with the station's
// observer (drills.js runMacro, the macro's own time), and the step panel's (G) is the same macro in stop motion: either satisfies the
// readiness, which reads the gun's state, never the key. T (instinct/armoury.js) does the DI's next row, one a press below the corporal
// and the station's whole act from him up (ARM_BUNDLE_RUNG): Draw at the window, Rounds back and declare at the ammunition point; the
// count is never bundled. The rank's serial check calls one marine at a time, each his serial's last three digits, the next once the
// last is said (CHECK_GAP_MS), and your line waits for your name ("wait for your name") before R calls yours.
//
// Two habits with a stake, one procedure always: the armourer's slip (SLIP_W 0.25 of seeds, stream(seed, 'arm:slip')) hands you the
// next slot's rifle, caught by your read (Awareness DC SERIAL_DC) or found at the rank's check, never carried past it (the fault 'serial'
// only if you never read it); the NCO's short count (SHORT_W 0.25, 'arm:short', independent) hands nineteen, caught by your count
// (Awareness DC COUNT_DC) or found at the declaration (the shakedown, the fault 'count'); the show clear is never skipped (Sign is struck
// before it). The relay's outcome (relayOutcome, at its splash's end; 'arm:relay'): the air (AREA_DUST by weight), the rounds left
// (RELAY_LEFT) and the far cases (FAR_CASES at FAR_M down the line), then only through A's functions: the magazines filled from what was
// handed, the gun fouled (upkeep.js firedOutcome) and dusted (dustOver: RELAY_MIN prone with the port open), the brass landed as yours
// on the lane's tiles (brass.js settle), the gun left as at CEASE FIRE. The canopy's three rows are TEMPO's rushed, normal and careful,
// each priced in minutes (upkeep.js cleanMs) and in its spotless chance (cleanOdds), against the leader's "Rifles in by ten-thirty."
// (RACK_BY_H: signed in after it is the fault 'late', never a stop). The inspection is upkeep.js inspect, at most TURNBACK_MAX turn-backs
// (the third taken with the fault 'dirty'); the magazines counted at the turn-in, a short one recorded lost with its place (armoury.js
// reportLost, the fault 'lost'). Never a dead end: a command left undone is done for you after moveOnMs of lived time with the fault
// 'slow' (armouryMoveOn), and a marine out of the box (BOX_M) is fetched back after FETCH_S (the fault 'wander').
//
// The session's own record is R.arm (plain data, saved): { stage, armourerId, armourer2Id, ncoId, leaderId, gunId (yours), slipId (the
// next slot's), slip, short, given (the rifle the armourer handed), read, readOk, readAs, signed, carded, called, slipFound, handedBack,
// counted, countOk, added, handed, issued, relay: { air, dust, minutes, fired, left, far, lane }, table, tempo, cleans: [{ tempo, ms, grade,
// residual, fault }], cleanedAt, again, turnBacks, inspections: [{ atMs, verdict, total, dc, roll }], passed, signedIn, rackByMs, late,
// boxOutMs, fetches, doing (the act under way), queue (T's bundle), want (an act that starts an activity, begun on the next lived tick),
// fetch (the armourer's 8 s), check (the rank's serials), inspecting, splash, splashOn, arrived, waitMs, nudged, inRankMs, turnedIn,
// declared, policeAt }. armouryNow(state, ms) is the hud's, the bots' and the end card's one view. Pure but the fill, the acts, the tick and
// the second, which write the session.
import { TICK_MS, MIN_MS } from '../../core/clock.js';
import { stream, intIn, int, next, weighted } from '../../core/rng.js';
import { hashPick, hashInt } from '../../core/hash.js';
import { playerActor, playerId, cmpId } from '../../core/ids.js';
import { post, cancel } from '../../core/queue.js';
import { label } from '../../core/keys.js';
import { spokenMs } from '../../core/speech.js';
import { msAtDayTime, dayClock } from '../../core/calendar.js';
import { SCENES } from '../../data/scenes.js';
import { COURSES, SEQ_ARMOURY, ARM_SAY, ARM_ROWS, ARM_PRESS } from '../../data/courses.js';
import { KD_RANGE, KD_AMMO } from '../../data/places/range.js';
import { ARM_RANK, CANOPY } from '../../data/places/armoury.js';
import { armouryPlaceOf } from '../places/fixtures.js';
import { navOf, clearLine, path } from '../places/nav.js';
import { TEST_SHEETS, testSheet, rungOf } from '../skills/templates.js';
import { check, sureOf } from '../skills/checks.js';
import { rollerOf } from '../combat/roll.js';
import { siteDayOf } from '../jobs.js';
import { setOutfit, syncActors } from '../people/place.js';
import { drawStaff, setPost } from '../people/staff.js';
import { startBody } from '../body/body.js';
import { deltaOf } from '../body/record.js';
import { barracks } from './barracks.js';
import { setLedgers } from './tests.js';
import { materialise, move, containersOf, handMagOf, atFeetOf, pouchFor } from '../arms/kit.js';
import { newGun, gunField, beliefOf } from '../arms/firearms.js';
import { macrosFor, runMacro } from '../arms/drills.js';
import { gunOn, leaveStop } from '../arms/shooting.js';
import { settle, police, brassNear, brassLeft, POLICE_M, POLICE_CASE_S } from '../arms/brass.js';
import { startActivity } from '../time/activities.js';
import { rangeOf, sayOn, startRange, coachClears, rangeRules, endRange, stopRange, laneOf, roundsLeft, lineReady, recordEjects, stopWords, WARN_AGAIN_MS } from './handling.js';
import * as UPKEEP from '../arms/upkeep.js';
import * as BOOKS from '../arms/armoury.js';

/** The scene's spec and course (data/scenes.js, data/courses.js). */
const SCENE = SCENES['test-armoury'], C = COURSES.armoury;
/** The slip and the short count, each on a quarter of the seeds, independent (AM§6, the build sheet §5). */
export const SLIP_W = 0.25, SHORT_W = 0.25;
/** The read of the serial and the count, Awareness against these (WEAPONS §10.2; the count my call). */
export const SERIAL_DC = 5, COUNT_DC = 5;
/** The armourer to the rack and back, the inspection lived, a marine's serial in the rank (ms). */
export const FETCH_RACK_MS = 8000, INSPECT_MS = 8000, CHECK_EACH_MS = 1200;
/**
 * The rank's calls one at a time: the next marine waits for the last's line to be said (core/speech.js spokenMs, the bubble's own hold)
 * and this after it, so one bubble stands over the rank at a time, at its speaker (the fixer of v0.0.28's play review, finding 10: eleven
 * calls in 14 s, three bubbles at once pushed off the dense rank, "the player can't tell who is speaking"). Each says the last three
 * digits (ARM_SAY.checkTail), as a rank calls a serial check, so the call is short and its bubble narrow (ms).
 */
export const CHECK_GAP_MS = 150;
/** The splashes' game minutes: the bus, the relay, the shakedown, the working party, the walk from the lane, the squad leader's fetch. */
export const BUS_MIN = 25, RELAY_MIN = 40, SHAKEDOWN_MIN = 10, WORKPARTY_MIN = 5, WALK_MIN = 3, FETCH_MIN = 1;
/**
 * The relay's draws: the rounds left at CEASE FIRE, the far cases and how far down the line they lie (m): FAR_M [4, 7] past the police's 4 m
 * reach measured from that reach's last tile (brass.js counts a 1 m tile within reach when any of it is), so a far case is never picked up
 * from the point (my call: from the point itself, 4 m put half the "far" cases on a tile the police touched).
 */
export const RELAY_LEFT = Object.freeze([1, 3]), FAR_CASES = Object.freeze([0, 3]), FAR_M = Object.freeze([4, 7]), FAR_FROM_M = 1.5;
/** The relay's air by weight, its dust on the place's scale (WEAPONS §9.2's calm and breezy; gusty 0.9, the build sheet §14 item 16). */
export const AREA_DUST = Object.freeze({ calm: Object.freeze({ dust: 0.2, w: 40 }), breezy: Object.freeze({ dust: 0.5, w: 45 }), gusty: Object.freeze({ dust: 0.9, w: 15 }) });
/** The relay's rounds fired over its first RELAY_FIRE_MIN, the last RELAY_COOL_MIN before its end (min; my call: the tower's strings, then the line's waits). */
export const RELAY_FIRE_MIN = 25, RELAY_COOL_MIN = 12;
/** The turn-backs before the armourer takes it with the fault 'dirty' (WEAPONS §10.3). */
export const TURNBACK_MAX = 3;
/** The squad leader's time (local hours) and a trip to the barrel or the window in the DI's sum (min): the build sheet §0 item 4. */
export const RACK_BY_H = 10.5, TRIP_MIN = 1;
/** The box round the stage (m, x by z) and how long out of it before the squad leader fetches you (s). */
export const BOX_M = Object.freeze([60, 50]), FETCH_S = 30;
/** Each act's lived time (ms): AM§3's rows. */
export const ACT_MS = Object.freeze({ card: 1000, read: 2000, sign: 1500, back: 1000, call: 1000, count: 6000, sign20: 1000, roundsBack: 1500, declare: 2000, handIn: 1500, signIn: 1000 });
/** On a station within this of its spot (m); on the rank's ring this long is fallen in (ms); the ring's radius (m). */
export const STATION_M = 0.6, INRANK_MS = 1000, RING_M = 0.4;
/** The setups (the tests' and the URL's; the window is the default). */
export const ARMOURY_SETUPS = Object.freeze(['issue', 'lane', 'canopy', 'turnin']);
/** The ammunition point's spots by its table at KD_AMMO (m): yours south of it facing north, the NCO's north facing south. */
const AMMO = Object.freeze({ you: Object.freeze({ x: KD_AMMO.x, z: KD_AMMO.z + 1.0, face: 'up' }), nco: Object.freeze({ x: KD_AMMO.x, z: KD_AMMO.z - 0.8, face: 'down' }) });
/** Your table's spot under the canopy (a north spot: the camera sees your face, your hands and the mat, the build sheet item 10). */
const TABLE_SPOT = 'f:canopy:t3#1';

const whole = (ms) => Math.ceil(ms / TICK_MS) * TICK_MS;
const capital = (w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w);
const COUNT_WORD = Object.freeze(['none', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty']);
const countWord = (n) => COUNT_WORD[n] ?? String(n);
const fill = (text, f) => String(text).replace(/\{(\w+)\}/g, (m, k) => (f[k] !== undefined ? String(f[k]) : f[k.toLowerCase()] !== undefined ? capital(String(f[k.toLowerCase()])) : m));
const near = (a, p, m = null) => !!a && !!p && Math.hypot(a.x - p.x, a.z - p.z) <= (m ?? (p.station === 'rank' ? RING_M : STATION_M));

/** The session on the armoury course, or null. */
export const armouryOf = (state) => { const R = state?.armoury?.range; return R && R.course === 'armoury' && R.arm ? R : null; };
const armOf = (state) => armouryOf(state)?.arm ?? null;
const defOf = (R) => (R?.cmd ? SEQ_ARMOURY[R.cmd.i] ?? null : null);
const keyOf = (R) => defOf(R)?.key ?? null;
const indexOf = (key) => SEQ_ARMOURY.findIndex(c => c.key === key);
const tierOf = (tier) => (tier && TEST_SHEETS[tier] ? tier : SCENE.sheet);
const actorOf = (state, pid) => state.actors?.list?.find(a => a.who === pid) ?? null;

// ---- the words ----

// (a line of the scene's, at its speaker: a text bubble (handling.js sayOn), its words picked by hash)
function say(state, bus, who, lines, f = {}, ...key) {
  if (!who || !lines) return null;
  const text = fill(hashPick(lines, 'arm-say', state.meta.seed, ...key), f);
  sayOn(state, bus, { who, text, kind: 'speech' });
  return text;
}
// (who says a command: its speaker by role)
const speakerOf = (A, who) => (who === 'armourer' ? A.armourerId : who === 'nco' ? A.ncoId : A.leaderId);
// (a fault of the scene's: the record, the fact and the speaker's words, as handling.js fault does with the coach's)
function armFault(state, bus, rule, kind, who, lines, f = {}, ...key) {
  const R = armouryOf(state);
  if (!R || R.end) return;
  R.faults.push({ rule, kind, atMs: state.clock.ms });
  const text = lines ? say(state, bus, who, lines, f, 'fault', rule, ...key) : null;
  bus?.emit('range', { phase: 'fault', cmd: R.cmd?.id ?? null, hot: false, rule, kind, text: text ?? null });
}
/** A serial in words, as a marine says it ("four four seven, one nine three"): armoury.js serialWords. */
const serialSaid = (serial) => BOOKS.serialWords(serial);

// ---- the fill ----

// (the squad leader and the marines of your squad but you, in id order (TECH §2.3.1: a save's keys come back sorted, so never the billets'
// object order))
function squadOf(state) {
  const pid = playerId(state), unit = state.people[pid]?.service?.unitId, billets = state.units?.[unit]?.billets ?? {};
  const leaderId = billets.sl ?? null;
  return { leaderId, marines: Object.values(billets).filter(id => id !== pid && id !== leaderId).sort(cmpId) };
}
// (the slip's rifle's owner: a marine of the next squad's, never on screen)
function slipOwnerOf(state) {
  const pid = playerId(state), unit = state.people[pid]?.service?.unitId ?? '', n = Number(unit.slice(unit.lastIndexOf('-') + 1)) || 1;
  const other = `${unit.slice(0, unit.lastIndexOf('-'))}-${n === 1 ? 2 : 1}`, billets = state.units?.[other]?.billets ?? {};
  return billets['ft2-r'] ?? Object.values(billets).sort(cmpId)[0] ?? null;
}
// (a rifle of the armoury's: made, its dry film, its condition by its own hash (0.88 to 0.95), lying at the rack's place, its record)
function rackRifle(state, assignedId) {
  const id = newGun(state, { model: 'r7', cond: 0.93 });
  const g = state.items[id];
  g.cond = Math.round((0.88 + 0.07 * hashInt(1000, 'arm:cond', state.meta.seed, id) / 1000) * 100) / 100;
  g.lube = 'dry';
  g.locked = true;
  g.belief = { chamber: 'empty', locked: true };
  const rack = armouryPlaceOf('arm:rack');
  move(state, id, { ground: { area: KD_RANGE.area, x: rack.x, z: rack.z } });
  BOOKS.bookGun(state, id, { assignedId });
  return id;
}
// (a person put at a place now: the player's actor, or a staff or squad member's post; their actor moved where they have one)
function placeMe(state, p) {
  const me = playerActor(state);
  me.x = p.x; me.z = p.z; me.face = p.face ?? me.face; me.$px = me.x; me.$pz = me.z;
  delete me.stance; delete me.headRad;
  const carry = state.people[me.who]?.kit?.carry;
  if (carry) delete carry.near;
}
function postAt(state, pid, p) {
  if (!pid) return;
  setPost(state, pid, { area: KD_RANGE.area, x: p.x, z: p.z, face: p.face ?? 'down', ...(p.outfit ? { outfit: p.outfit } : {}) });
  const a = actorOf(state, pid);
  if (a) { a.x = p.x; a.z = p.z; a.face = p.face ?? 'down'; a.$px = a.x; a.$pz = a.z; }
}
// (the leader's place in front of the rank: past the rank's middle by 1.8 m along its facing, turned to it)
function leaderAtRank() {
  const n = ARM_RANK.length, cx = ARM_RANK.reduce((t, s) => t + s.x, 0) / n, face = ARM_RANK[0].face ?? 'down';
  const zs = ARM_RANK.map(s => s.z), d = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[face] ?? [0, 1];
  const edge = d[1] > 0 ? Math.max(...zs) : d[1] < 0 ? Math.min(...zs) : (Math.min(...zs) + Math.max(...zs)) / 2;
  const back = { down: 'up', up: 'down', left: 'right', right: 'left' }[face];
  return { x: d[0] ? cx + d[0] * 1.8 : cx, z: d[1] ? edge + d[1] * 1.8 : edge, face: back };
}
// (the squad leader's place at the canopy's north edge, on its middle walk (x 11.2 to 14.8 in its frame, the lines walk clear north of the tables))
const canopyEdge = () => ({ x: CANOPY.origin[0] + 13, z: CANOPY.origin[1] + 2.5, face: 'down' });
// (the squad at a stage's spots (see the header): placed, never walking; their actors drawn again)
function squadAt(state, where) {
  const A = armOf(state), { marines } = squadOf(state);
  if (where === 'rank') {
    marines.forEach((pid, k) => postAt(state, pid, ARM_RANK.filter(p => p.id !== 'arm:rank:you')[k]));
    postAt(state, A.leaderId, leaderAtRank());
  } else if (where === 'ammo') {
    marines.forEach((pid, k) => postAt(state, pid, { x: KD_AMMO.x - 3 - (k % 6) * 1.1, z: KD_AMMO.z + 1.5 + Math.floor(k / 6) * 1.2, face: 'up' }));
    postAt(state, A.leaderId, { x: KD_AMMO.x - 2.2, z: KD_AMMO.z - 0.5, face: 'down' });
  } else if (where === 'line') {
    const R = armouryOf(state), lanes = KD_RANGE.bay.lanes.filter(L => L.lane !== R.lane);
    marines.forEach((pid, k) => { const L = lanes[k]; postAt(state, pid, L ? { x: L.fp.x, z: L.fp.z, face: 'right' } : { x: KD_RANGE.bay.lineX - 6 - (k % 3) * 1.2, z: 284 + Math.floor(k / 3) * 3, face: 'right' }); });
    postAt(state, A.leaderId, { x: KD_RANGE.bay.lineX - 5, z: 283, face: 'right' });
  } else if (where === 'canopy') {
    // (none at your own table: a marine at its south place (#3, #4) stood 1.75 m in front of you on the picture, his head on your ring and
    // your mat; the review of v0.0.28 C)
    const spots = [], mine = String(A.table ?? TABLE_SPOT).split('#')[0];
    for (let t = 1; t <= 8; t++) for (let k = 1; k <= 4; k++) { const id = `f:canopy:t${t}#${k}`; if (!id.startsWith(`${mine}#`)) spots.push(armouryPlaceOf(id)); }
    marines.forEach((pid, k) => postAt(state, pid, spots[(k * 3) % spots.length]));
    postAt(state, A.leaderId, canopyEdge());
  }
  syncActors(state);
}

/** The fill of 'test-armoury' (see the header): setup null (the window) | 'issue' | 'lane' | 'canopy' | 'turnin'; tier the picker's sheet. */
export function testArmoury(state, { at = null, setup = null, tier = null } = {}) {
  if (setup && !ARMOURY_SETUPS.includes(setup)) throw new Error(`armoury: no setup '${setup}' (${ARMOURY_SETUPS.join(', ')})`);
  const seed = state.meta.seed, sheet = tierOf(tier), W = armouryPlaceOf('f:armoury:window-1#1');
  barracks(state, { at: { area: KD_RANGE.area, x: W.x, z: W.z, face: W.face, ...(at ?? {}) } });
  const me = playerActor(state), pid = playerId(state), person = state.people[pid];
  setOutfit(me, SCENE.outfit);
  person.body = deltaOf(setLedgers(startBody(person, state.clock.ms, siteDayOf(state), seed), SCENE.body ?? {}));
  person.skills = testSheet(sheet);
  const kit = materialise(state, pid, C.kit);
  // (the gate: upkeep live in this scene alone (upkeep.js upkeepOn), a field of armoury so a save mid-scene keeps it)
  state.armoury.upkeep = true;
  const gunId = rackRifle(state, pid), slipOwner = slipOwnerOf(state), slipId = rackRifle(state, slipOwner);
  const armourerId = drawStaff(state, 'melas:armourer-1'), armourer2Id = drawStaff(state, 'melas:armourer-2'), ncoId = drawStaff(state, 'melas:kd-ammo');
  const { leaderId } = squadOf(state);
  postAt(state, armourerId, armouryPlaceOf('f:armoury:window-1#2'));
  postAt(state, armourer2Id, armouryPlaceOf('f:armoury:window-2#2'));
  postAt(state, ncoId, AMMO.nco);
  const slip = next(stream(seed, 'arm:slip')) < SLIP_W, short = next(stream(seed, 'arm:short')) < SHORT_W;
  const R = startRange(state, null, { course: 'armoury', area: KD_RANGE.area, lane: null, kit });
  R.roId = leaderId; R.coachId = armourerId;
  R.arm = {
    stage: 'window', armourerId, armourer2Id, ncoId, leaderId, gunId, slipId, slip, short, given: null, read: false, readOk: null, readAs: null, signed: null,
    carded: false, called: false, slipFound: false, handedBack: false, counted: false, countOk: null, added: false, handed: null, issued: false,
    relay: null, table: TABLE_SPOT, tempo: null, cleans: [], cleanedAt: null, again: false, turnBacks: 0, inspections: [], passed: false, signedIn: false,
    rackByMs: msAtDayTime(state.clock.ms, Math.floor(RACK_BY_H), Math.round((RACK_BY_H % 1) * 60), siteDayOf(state)), late: false, boxOutMs: null, fetches: 0,
    doing: null, queue: [], want: null, fetch: null, check: null, inspecting: null, splash: null, splashOn: null, arrived: null, waitMs: 0, nudged: false,
    inRankMs: 0, turnedIn: null, declared: null, policeAt: null, mags: kit.magIds, tier: sheet, faultSaid: {},
  };
  squadAt(state, 'rank');
  if (setup) setupArmoury(state, setup);
  return state;
}

// (a setup (the tests' and the URL's): the stages before it lived as an honest marine would, behind no splash; the setup's command at the
// next whole second)
function setupArmoury(state, setup) {
  const R = armouryOf(state), A = R.arm, pid = playerId(state);
  // (drawn and signed: the right rifle, read, shown, signed; the slip, if the seed has one, caught at the window)
  handRifle(state, A.gunId);
  A.carded = true; A.read = true; A.readOk = true; A.readAs = BOOKS.serialOf(state, A.gunId); A.signed = A.gunId; A.called = true; A.slipFound = false; A.slipCaught = A.slip;
  BOOKS.signOut(state, A.gunId, pid, A.armourerId);
  let at = 'issue';
  arriveAmmo(state);
  if (setup === 'issue') return postAt0(state, at);
  A.counted = true; A.countOk = true; A.added = A.short; A.handed = C.issueN; issueSigned(state);
  R.lane = drawLaneOf(state);
  relayOutcome(state, null);
  at = 'lane';
  if (setup === 'lane') return postAt0(state, at);
  // (the lane's UNLOAD, SHOW CLEAR as the macro leaves it: the magazine out to a pouch, the round out, shown; then the brass, every case)
  const gun = state.items[A.gunId];
  if (gun?.mag) { const c = pouchFor(state, pid, null); if (c) move(state, gun.mag, { container: c }); }
  R.shown = true;
  police(state);
  for (const t of Object.values(R.brassTiles ?? {})) { R.policed = (R.policed ?? 0) + t.mine; t.n -= t.mine; t.mine = 0; }
  R.brassTiles = Object.fromEntries(Object.entries(R.brassTiles ?? {}).filter(([, t]) => t.n > 0));
  arriveAmmo(state);
  roundsBackNow(state, null);
  declareNow(state, null);
  arriveCanopy(state);
  at = 'clean';
  if (setup === 'canopy') return postAt0(state, at);
  const ms0 = UPKEEP.cleanMs(state, pid, A.gunId, 'normal'), out = UPKEEP.cleanEnd(state, null, pid, A.gunId, { tempo: 'normal', again: false });
  A.cleans.push({ tempo: 'normal', ms: ms0, grade: (out?.residual ?? 0) <= UPKEEP.FIND_FREE ? 'spotless' : 'carbon left', residual: out?.residual ?? 0, fault: out?.fault ?? null });
  placeMe(state, armouryPlaceOf('f:armoury:barrel-w#1'));
  A.stage = 'barrel';
  postAt0(state, 'barrel');
  // (setup's last word: 'turnin', at the barrel cleaned)
  void at;
}
// (the setup's command posted at the next whole second)
function postAt0(state, key) {
  const R = armouryOf(state), i = indexOf(key), atMs = Math.floor(state.clock.ms / 1000) * 1000 + 1000;
  // (the sequence's brief, posted by startRange, cancelled: the command posted in its place)
  cancel(state, 'arms:range');
  post(state, { atMs, prio: 2, kind: 'range-cmd', src: 'arms:range', payload: { cmd: SEQ_ARMOURY[i].id, i } });
  R.next = { id: SEQ_ARMOURY[i].id, i, atMs };
  R.arm.stage = SEQ_ARMOURY[i].stage;
}
const drawLaneOf = (state) => { const L = C.lane; return L.from + int(stream(state.meta.seed, 'arm:lane'), L.to - L.from + 1); };

// ---- the rifle, the rounds and the places ----

// (a rifle across the counter: on your sling, bolt locked back, slung front)
function handRifle(state, id) {
  const pid = playerId(state);
  move(state, id, { pid, slot: 'sling' });
  const carry = state.people[pid].kit.carry ??= {};
  carry.posture = 'slungFront'; delete carry.finger;
  armOf(state).given = id;
}
// (the rack's place behind window 1, where a rifle lies when it is not out)
const rackAt = () => { const r = armouryPlaceOf('arm:rack'); return { area: KD_RANGE.area, x: r.x, z: r.z }; };
// (a rifle back over the counter to the rack's place, not signed out: the slip's, swapped before its signature)
function rackIt(state, id) { move(state, id, { ground: rackAt() }); }
// (everything at the ammunition point: you at its table, the NCO behind it, the squad beside you)
function arriveAmmo(state) {
  const R = armouryOf(state), A = R.arm;
  placeMe(state, AMMO.you);
  postAt(state, A.ncoId, AMMO.nco);
  R.coachId = A.ncoId;
  squadAt(state, 'ammo');
}
// (everything at the canopy: you at its north edge, the squad at the tables, the leader at the edge)
function arriveCanopy(state) {
  const R = armouryOf(state), A = R.arm, e = canopyEdge();
  placeMe(state, { x: e.x - 1.5, z: e.z - 0.5, face: e.face });
  R.coachId = A.armourerId;
  delete R.lane;
  squadAt(state, 'canopy');
}
// (the issue signed: twenty on the line, handed as counted, the count on the line)
function issueSigned(state) {
  const R = armouryOf(state), A = R.arm;
  BOOKS.issueRounds(state, { issueId: R.issueId, n: C.issueN, handed: A.handed });
  const line = state.armoury.ammoIssues.find(a => a.id === R.issueId);
  if (line) line.counted = !!A.counted;
  A.issued = true;
}
// (every round of yours out of the rifle and the magazines, to the NCO: the turn-in's; the magazines kept, empty)
function emptyAction(state) {
  const pid = playerId(state), gun = state.items[gunOn(state, pid)];
  let n = 0;
  if (gun && gunField(gun, 'chamber') === 'live') { n++; delete gun.chamber; }
  const mags = new Set([gun?.mag, handMagOf(state, pid)?.id, ...containersOf(state, pid).flatMap(c => state.items[c].holds ?? []), ...atFeetOf(state, pid).map(l => l.id)].filter(Boolean));
  for (const id of mags) { const m = state.items[id]; if (m?.type !== 'mag') continue; n += m.n ?? 0; m.n = 0; m.belief = { ...(m.belief ?? {}), n: 0 }; }
  if (gun) gun.belief = { ...(gun.belief ?? {}), chamber: 'empty', ...(gun.mag ? { count: 0 } : {}) };
  return n;
}

/**
 * The relay's outcome (see the header; the build sheet item 7): the air, the rounds left and the far cases drawn on stream(seed,
 * 'arm:relay'); the magazines filled from what was handed and fired down; the gun fouled and dusted by A's functions; the brass landed as
 * yours; the gun as at CEASE FIRE (on safe, the last magazine in with left − 1, a round chambered, believed exactly); you at the lane's point,
 * the NCO at your left shoulder. Returns R.arm.relay.
 */
export function relayOutcome(state, bus) {
  const R = armouryOf(state), A = R.arm, pid = playerId(state), now = state.clock.ms, r = stream(state.meta.seed, 'arm:relay');
  const air = weighted(r, Object.entries(AREA_DUST).map(([k, v]) => [k, v.w])), left = intIn(r, RELAY_LEFT[0], RELAY_LEFT[1]), far = intIn(r, FAR_CASES[0], FAR_CASES[1]);
  const handed = A.handed ?? C.issueN, fired = handed - left, gun = state.items[A.given ?? A.gunId];
  R.lane ??= drawLaneOf(state);
  const L = laneOf(R.lane);
  // (the magazines: the first two of the three drawn that are on you filled ten and the rest, the first fired out, the second in the rifle with
  // what is left; one only on you, it takes the twenty; a magazine already in the rifle not the one to seat goes to a pouch, else your feet)
  const held = BOOKS.magsOf(state, pid, A.mags).held, gid = A.given ?? A.gunId;
  const id1 = held.length > 1 ? held[0] : null, id2 = held.length > 1 ? held[1] : held[0] ?? null, m1 = id1 ? state.items[id1] : null, m2 = id2 ? state.items[id2] : null;
  if (gun?.mag && gun.mag !== id2) {
    const c = pouchFor(state, pid, null), me = playerActor(state);
    move(state, gun.mag, c ? { container: c } : { ground: { area: KD_RANGE.area, x: me.x + 0.3, z: me.z + 0.1 } });
  }
  if (m1) { m1.n = 0; m1.belief = { ...(m1.belief ?? {}), n: 0 }; }
  if (m2 && gun) { if (gun.mag !== id2) move(state, id2, { gun: gid }); m2.n = left - 1; delete m2.belief; }
  if (gun) {
    gun.chamber = 'live'; delete gun.locked; gun.mode = 'safe'; gun.cocked = true; delete gun.portOpen;
    gun.belief = { chamber: 'live', count: m2?.n ?? 0 };
    // (the rounds counted and fouled as pulls leave them (upkeep.js firedOutcome: its own count and wear), one every RELAY_FIRE_MIN × 60 / fired s
    // to the last at RELAY_COOL_MIN before the splash's end, which is the span's end: the barrel cooled to the air's by now, so nothing of its
    // heat is kept (the build sheet §0 item 9); an air with no cooling time (a preset by &env=) keeps none either (upkeep.js liveOpts' null air))
    const at = UPKEEP.liveOpts(state, now).air ?? null;
    UPKEEP.firedOutcome(gun, fired, { ms: now - RELAY_COOL_MIN * MIN_MS, gapS: fired > 1 ? (RELAY_FIRE_MIN * 60) / (fired - 1) : 0, air: at, endMs: now });
    UPKEEP.dustOver(gun, { minutes: RELAY_MIN, airDust: AREA_DUST[air].dust, exposure: 'open', prone: true, mags: held.map(id => state.items[id]) });
  }
  const line = state.armoury.ammoIssues.find(a => a.id === R.issueId);
  if (line) line.fired = fired;
  // (the brass: the near cases round the point on the shooter's right, the far ones FAR_M down the line, every one yours, landed now)
  const cases = [];
  for (let k = 0; k < fired - far; k++) cases.push([L.fp.x - 0.3 + 1.6 * next(r), L.fp.z + 0.3 + 2.2 * next(r)]);
  const farAt = far ? FAR_FROM_M + FAR_M[0] + (FAR_M[1] - FAR_M[0]) * next(r) : null;
  // (down the line on the shooter's right, or up it where the right runs past the bay's south rope: never off the walk's ground, so every
  // case can be walked to; seed 53's lane 5 threw them over the rope)
  const sideZ = L.fp.z + FAR_FROM_M + FAR_M[1] + 0.5 <= KD_RANGE.bay.walk[3] - 0.3 ? 1 : -1;
  for (let k = 0; k < far; k++) cases.push([L.fp.x - 0.2 + 0.6 * next(r), L.fp.z + sideZ * (farAt + 0.4 * next(r))]);
  for (const [x, z] of cases) R.brass.push({ kind: 'case', atMs: now, x0: x, y0: 0, z0: z, v: [0, 0, 0], landMs: now, at: [Math.round(x * 1e4) / 1e4, Math.round(z * 1e4) / 1e4] });
  settle(state, now);
  placeMe(state, { x: L.fp.x, z: L.fp.z, face: 'right' });
  postAt(state, A.ncoId, L.coach);
  R.coachId = A.ncoId;
  A.relay = { air, dust: AREA_DUST[air].dust, minutes: RELAY_MIN, fired, left, far, farM: farAt === null ? null : Math.round(farAt * 10) / 10, lane: R.lane };
  squadAt(state, 'line');
  return A.relay;
}

// ---- the stations and the rows ----

/** Where the standing command wants you (its station's spot), or null: { id, station, x, z, face }. */
export function stationOf(state) {
  const R = armouryOf(state), A = R?.arm, k = keyOf(R), P = ARM_PRESS[k];
  if (!P) return null;
  switch (P.station) {
    case 'window': return { id: 'f:armoury:window-1#1', station: 'window', ...armouryPlaceOf('f:armoury:window-1#1') };
    case 'rank': return { id: 'arm:rank:you', station: 'rank', ...armouryPlaceOf('arm:rank:you') };
    case 'ammo': return { id: 'ammo', station: 'ammo', ...AMMO.you };
    case 'lane': { const L = laneOf(R.lane); return L ? { id: 'lane', station: 'lane', x: L.fp.x, z: L.fp.z, face: 'right' } : null; }
    case 'table': return { id: A.table, station: 'table', ...armouryPlaceOf(A.table) };
    case 'barrel': return { id: 'f:armoury:barrel-w#1', station: 'barrel', ...armouryPlaceOf('f:armoury:barrel-w#1') };
    default: return null;
  }
}
/**
 * The walk's point toward a station (armouryNow's via, T's arm-walk keys): its spot where a straight line to it is free on the walkers'
 * grid (places/nav.js clearLine, the C0 class: utilities), else the first corner of the way round (nav.js path, pulled straight, capped at
 * VIA_CAP cells), the spot when there is none. The fixer of v0.0.28's play review, finding 1: from the canopy the barrel's ring lies behind
 * its drum, T said "up (Z)" and a marine who pressed it stood against the drum 1.3 m short until the armourer cleared the rifle for him at
 * 60 s. Memoised on the tick and the walker's place (runtime only, state.$armVia).
 */
export const VIA_CAP = 4000, VIA_NEAR_M = 0.3;
export function walkVia(state, st, me = playerActor(state)) {
  if (!st || !me) return null;
  const area = state.places?.live?.area, key = `${state.clock.ms}|${me.x}|${me.z}|${st.x}|${st.z}`;
  if (state.$armVia?.key === key) return state.$armVia.via;
  let via = { x: st.x, z: st.z };
  const g = area ? navOf(state, area, 'C0', me.x, me.z) : null;
  if (g && !clearLine(g, me.x, me.z, st.x, st.z)) {
    const r = path(g, [me.x, me.z], [st.x, st.z], { cap: VIA_CAP });
    const p = r.pts?.slice(1).find(q => Math.hypot(q[0] - me.x, q[1] - me.z) > VIA_NEAR_M) ?? null;
    if (p) via = { x: p[0], z: p[1] };
  }
  state.$armVia = { key, via };
  return via;
}

// (the rows' price: "· 1 s", "· 6 s")
const secs = (ms) => `${Math.round(ms / 100) / 10} s`.replace('.0 s', ' s');
// (a roll's chance at its DC for the player: the d20's share that passes, naturals as check() counts them (a 1 caught where the read is
// sure: routine or mastered, SKILLS §5.1); the read and the count are procedures, done the same way every time)
function oddsOf(state, pid, skill, dc) {
  const roller = rollerOf(state, pid), mods = roller.mods(skill, {}) ?? [], value = roller.value(skill), v = value + mods.reduce((t, m) => t + m.v, 0);
  const sure = sureOf({ value, dc, mods, pressure: 'evaluated', procedure: true });
  let n = 0;
  for (let d = 1; d <= 20; d++) if (d === 20 || (d === 1 ? sure : d + v >= dc)) n++;
  return n / 20;
}
const pct = (p) => `${Math.round(p * 100)}%`;
// (the minutes of a clean in the rows: whole minutes)
const minOf = (ms) => Math.max(1, Math.round(ms / MIN_MS));

/**
 * The rows at your station now (R held's list: the build sheet §3.0's rows shape): { title, rows: [{ id, label, tag, struck?, why? }] },
 * or null off a station with nothing standing. Each row's label carries its price, a rolled row its chance; struck rows their reason.
 */
export function armouryRows(state) {
  const R = armouryOf(state);
  if (!R || R.end) return null;
  const A = R.arm, k = keyOf(R), P = ARM_PRESS[k], pid = playerId(state), me = playerActor(state), st = stationOf(state);
  if (!P || !st) return null;
  const at = near(me, st), rows = [], gun = state.items[A.given ?? A.gunId];
  const row = (id, ms, extra = null, struck = null) => rows.push({ id, label: `${ARM_ROWS[id]}${ms ? ` · ${secs(ms)}` : ''}${extra ? ` · ${extra}` : ''}`, tag: ARM_ROWS[id], ...(struck ? { struck: true, why: struck } : {}) });
  const busy = A.doing ? 'an act under way' : A.fetch ? 'the armourer is at the rack' : A.inspecting ? 'the armourer is looking at it' : null;
  const off = (why) => busy ?? (!at && P.station !== 'lane' ? 'not at the ring' : why);
  switch (k) {
    case 'card': row('card', ACT_MS.card, null, off(A.carded ? 'handed' : null)); break;
    case 'window': {
      row('read', ACT_MS.read, pct(oddsOf(state, pid, 'awareness', SERIAL_DC)), off(A.read ? 'read' : null));
      row('show', showMs(state), null, off(R.shown ? 'shown' : null));
      row('sign', ACT_MS.sign, null, off(A.signed ? 'signed' : R.shown ? null : ARM_SAY.showFirst[0]));
      break;
    }
    case 'serials': row('call', ACT_MS.call, null, off(A.check?.you ? (A.called ? 'called' : null) : 'wait for your name')); break;
    case 'back': row('back', ACT_MS.back, null, off(A.handedBack ? 'handed back' : null)); break;
    case 'issue': {
      row('count', ACT_MS.count, pct(oddsOf(state, pid, 'awareness', COUNT_DC)), off(A.counted || A.issued ? (A.issued ? 'signed' : 'counted') : null));
      row('sign20', ACT_MS.sign20, null, off(A.issued ? 'signed' : null));
      break;
    }
    case 'lane': row('show', showMs(state), null, busy ?? (at ? (R.shown ? 'shown' : null) : 'not at the point')); break;
    case 'police': {
      const n = brassNear(state, pid, POLICE_M).mine;
      rows.push({ id: 'police', label: `${ARM_ROWS.police} (${n}) · ${secs(Math.max(1000, n * POLICE_CASE_S * 1000))}`, tag: ARM_ROWS.police, ...(busy || !n ? { struck: true, why: busy ?? 'none of yours within 4 m' } : {}) });
      break;
    }
    case 'turnIn': {
      const n = roundsLeft(state) + (R.picked ?? 0);
      rows.push({ id: 'roundsBack', label: `${ARM_ROWS.roundsBack} (${n}) · ${secs(ACT_MS.roundsBack)}`, tag: ARM_ROWS.roundsBack, ...(off(A.turnedIn === R.cmd.i ? 'handed back' : null) ? { struck: true, why: off(A.turnedIn === R.cmd.i ? 'handed back' : null) } : {}) });
      break;
    }
    case 'declare': row('declare', ACT_MS.declare, null, off(A.declared ? 'declared' : null)); break;
    case 'clean': {
      const why = UPKEEP.cleanOff(state, pid, A.given ?? A.gunId);
      for (const t of ['rushed', 'normal', 'careful']) {
        const id = A.again ? `again${capital(t)}` : t, ms = UPKEEP.cleanMs(state, pid, A.given ?? A.gunId, t, { again: A.again }), odds = UPKEEP.cleanOdds(state, pid, A.given ?? A.gunId, t, { armourerId: A.armourerId });
        rows.push({ id, label: `${ARM_ROWS[id]} · ${minOf(ms)} min · ${pct(odds.spotless)} spotless`, tag: ARM_ROWS[id], tempo: t, ...(off(A.cleanedAt === R.cmd.i ? 'cleaned' : why) ? { struck: true, why: off(A.cleanedAt === R.cmd.i ? 'cleaned' : why) } : {}) });
      }
      break;
    }
    case 'barrel': row('barrel', showMs(state), null, off(A.barrelShown ? 'shown' : null)); break;
    case 'handIn': row('handIn', ACT_MS.handIn, null, off(A.handedIn ? 'handed in' : null)); break;
    case 'signIn': row('signIn', ACT_MS.signIn, null, off(A.signedIn ? 'signed' : null)); break;
    default: break;
  }
  if (!rows.length) return null;
  // (the R menu's card (cards/actions.js) reads a row's words, its time and its reason struck: each row carries them beside its plate's label)
  // (a row's words are its label's head, the R menu's time column (ui/kit/list.js timeTextOf) the rest of it, its price and its odds: the
  // words had kept the odds and the column read them again, "CLEAN, RUSHED · 50% SPOTLESS · 20 MIN · 50% SPOTLESS" (the fixer of v0.0.28's
  // play review, finding 7))
  for (const r of rows) { r.words = r.label.split(' · ')[0]; r.durMs = rowMs(state, r.id, r.tempo); if (r.struck) r.off = r.why; }
  return { title: { window: 'WINDOW 1', rank: 'THE RANK', ammo: 'THE AMMUNITION POINT', lane: `LANE ${R.lane ?? ''}`.trim(), table: 'YOUR TABLE', barrel: 'THE CLEARING BARREL' }[st.station] ?? 'THE ARMOURY', rows };
}
// (UNLOAD, SHOW CLEAR's time: the macro's with the station's observer, else 8 s)
function showMs(state) {
  const R = armouryOf(state), pid = playerId(state), g = gunOn(state, pid);
  const m = g ? macrosFor(state, pid, g, { observerId: R.coachId }).find(x => x.id === 'clear') : null;
  return m?.ms ?? 8000;
}

/**
 * R's quick act (places/hand.js registerHandScene): { id, label, durMs, off? } while the scene runs, never null then (a null let R fall
 * through to the place's fifteen-minute wait, whose skip would pass the scene's commands): the first row not struck at your station, else a
 * struck plate saying why ("Wait for the command"). Null off the scene and after its end.
 */
export function armouryOffer(state) {
  const R = armouryOf(state);
  if (!R || R.end || !playerActor(state)) return null;
  const m = armouryRows(state), first = m?.rows.find(r => !r.struck && (keyOf(R) !== 'clean' || r.tempo === 'normal')) ?? m?.rows.find(r => !r.struck);
  if (first) return { id: first.id, label: first.label, words: first.tag.toLowerCase(), durMs: rowMs(state, first.id) };
  const why = R.arm.doing ? 'an act under way' : m?.rows[0]?.why ?? 'nothing to do here';
  return { id: 'wait', label: 'Wait for the command', words: 'wait', durMs: 0, off: why };
}
// (a row's lived time, the plate's; a clean's its game minutes)
function rowMs(state, id, tempo = null) {
  if (ACT_MS[id]) return ACT_MS[id];
  if (tempo) { const A = armOf(state); return UPKEEP.cleanMs(state, playerId(state), A.given ?? A.gunId, tempo, { again: !!A.again }); }
  if (id === 'show' || id === 'barrel') return showMs(state);
  if (id === 'police') return Math.max(1000, brassNear(state, playerId(state), POLICE_M).mine * POLICE_CASE_S * 1000);
  return 0;
}
/** R held's rows (places/hand.js's rows hook). */
export const armouryRowsHand = (state) => armouryRows(state);

/**
 * An act at the station (R, R held's row, T's row; the bots by id): begun now as a lived step of its own time, its effect at its end
 * (armouryTick); UNLOAD, SHOW CLEAR played whole at its end with the station's observer; police and the clean begun as their activities on
 * the next lived tick. Returns { ok, why }.
 */
export function armouryAct(state, bus, id = null) {
  const R = armouryOf(state);
  if (!R || R.end) return { ok: false, why: 'not here' };
  const A = R.arm, m = armouryRows(state);
  if (!id || id === 'wait') { const o = armouryOffer(state); if (!o || o.off) return { ok: false, why: o?.off ?? 'nothing to do' }; id = o.id; }
  const r = m?.rows.find(x => x.id === id);
  if (!r) return { ok: false, why: `not '${id}' here` };
  if (r.struck) {
    // (Sign before the show clear: the armourer says so, the row not done)
    if (id === 'sign' && !R.shown && !A.doing) say(state, bus, A.armourerId, ARM_SAY.showFirst, {}, 'showFirst', state.clock.ms);
    return { ok: false, why: r.why };
  }
  const now = state.clock.ms;
  if (id === 'police') { A.want = { kind: 'police', i: R.cmd.i }; return { ok: true, why: null }; }
  if (r.tempo) { A.want = { kind: 'clean', tempo: r.tempo, again: !!A.again, i: R.cmd.i }; return { ok: true, why: null }; }
  const ms = rowMs(state, id);
  A.doing = { id, fromMs: now, untilMs: whole(now + ms) };
  bus?.emit('line', { text: `${capital(r.tag.toLowerCase())}.`, kind: 'calm' });
  return { ok: true, why: null };
}
/** T's act (instinct/armoury.js; instinct.js's 'arm:' acts): a row by id, or a bundle ('draw', 'backDeclare') queued in order. */
export function armouryTAct(state, bus, act) {
  const A = armOf(state);
  if (!A || typeof act !== 'string' || !act.startsWith('arm:')) return false;
  const id = act.slice(4);
  if (id === 'draw') { A.queue = ['read', 'show', 'sign'].filter(x => !(x === 'read' && A.read)); return runQueue(state, bus); }
  if (id === 'backDeclare') { A.queue = ['roundsBack', 'declare']; return runQueue(state, bus); }
  // (the muzzle's line: the rifle slung, off the people in front of it)
  if (id === 'sling') { const carry = state.people[playerId(state)]?.kit?.carry; if (!carry) return false; carry.posture = 'slungFront'; delete carry.finger; return true; }
  return armouryAct(state, bus, id).ok;
}
// (the bundle's next row, when it is offered and nothing runs: true once a row began)
function runQueue(state, bus) {
  const A = armOf(state);
  if (!A?.queue?.length || A.doing || A.want || A.fetch || A.inspecting) return false;
  const m = armouryRows(state), id = A.queue[0], r = m?.rows.find(x => x.id === id);
  if (!r) return false;
  if (r.struck) { if (['read', 'roundsBack'].includes(id) || r.why === 'shown' || r.why === 'read') { A.queue.shift(); return runQueue(state, bus); } return false; }
  A.queue.shift();
  return armouryAct(state, bus, id).ok;
}

// ---- the acts' ends ----

function actEnd(state, bus, id) {
  const R = armouryOf(state), A = R.arm, pid = playerId(state), now = state.clock.ms;
  switch (id) {
    case 'card': {
      A.carded = true;
      const card = BOOKS.serialOf(state, A.gunId), p = state.people[pid];
      say(state, bus, A.armourerId, ARM_SAY.cardRead, { name: p?.name?.family ?? 'Marine', card: serialSaid(card) }, 'card');
      A.fetch = { what: 'rifle', untilMs: whole(now + FETCH_RACK_MS) };
      break;
    }
    case 'read': {
      const given = A.given, serial = BOOKS.serialOf(state, given), card = BOOKS.serialOf(state, A.gunId), roll = rollOf(state, 'awareness', SERIAL_DC, 'read', A.fetches);
      A.read = true; A.readOk = roll.ok;
      if (given !== A.gunId && roll.ok) {
        A.readAs = serial;
        say(state, bus, pid, ARM_SAY.readSlip, { read: serialSaid(serial), card: serialSaid(card) }, 'read');
        say(state, bus, A.armourerId, ARM_SAY.mistake, {}, 'mistake');
        A.slipCaught = true;
        rackIt(state, given); A.given = null;
        A.fetch = { what: 'swap', untilMs: whole(now + FETCH_RACK_MS) };
      } else {
        // (a missed read takes the card's number for the rifle's: you believe it is yours)
        A.readAs = roll.ok ? serial : card;
        say(state, bus, pid, ARM_SAY.readMine, { read: serialSaid(A.readAs) }, 'read');
      }
      break;
    }
    case 'show': case 'barrel': showNow(state, bus, id); break;
    case 'sign': {
      BOOKS.signOut(state, A.given, pid, A.armourerId);
      A.signed = A.given;
      say(state, bus, A.armourerId, ARM_SAY.signed, {}, 'signed', A.fetches);
      const carry = state.people[pid].kit.carry; if (carry) { carry.posture = 'slungFront'; delete carry.finger; }
      break;
    }
    case 'call': {
      A.called = true;
      const held = gunOn(state, pid);
      say(state, bus, pid, ARM_SAY.checkOne, { serial: serialSaid(BOOKS.serialOf(state, held)) }, 'call', A.fetches);
      const bad = BOOKS.serialCheck(state, [{ pid, gunId: held }]);
      if (bad.length) {
        A.slipFound = true;
        if (!A.read) armFault(state, bus, 'serial', 'warn', A.leaderId, ARM_SAY.checkSlip, {}, 'slip');
        else say(state, bus, A.leaderId, ARM_SAY.checkSlip, {}, 'slip');
      } else say(state, bus, A.leaderId, ARM_SAY.checkOk, {}, 'checkOk');
      A.check = null;
      break;
    }
    case 'back': {
      A.handedBack = true;
      const given = A.given;
      if (given) BOOKS.signIn(state, given, A.armourerId, { at: rackAt() });
      A.given = null; A.signed = null; A.read = false; A.readOk = null; A.readAs = null; R.shown = false;
      say(state, bus, A.armourerId, ARM_SAY.handedBack, {}, 'back');
      A.fetch = { what: 'swap', untilMs: whole(now + FETCH_RACK_MS) };
      break;
    }
    case 'count': {
      const roll = rollOf(state, 'awareness', COUNT_DC, 'count');
      A.counted = true; A.countOk = roll.ok;
      if (A.short && roll.ok) { say(state, bus, pid, ARM_SAY.countShort, {}, 'count'); say(state, bus, A.ncoId, ARM_SAY.countAdded, {}, 'added'); A.added = true; }
      else say(state, bus, pid, ARM_SAY.countFull, {}, 'count');
      break;
    }
    case 'sign20': {
      A.handed = A.short && !A.added ? C.issueN - 1 : C.issueN;
      issueSigned(state);
      say(state, bus, A.ncoId, ARM_SAY.sign20, {}, 'sign20');
      break;
    }
    case 'roundsBack': roundsBackNow(state, bus); break;
    case 'declare': declareNow(state, bus); break;
    case 'handIn': {
      A.handedIn = false;
      const g = A.given ?? A.gunId;
      move(state, g, { pid: A.armourerId, hand: 0 });
      A.inspecting = { untilMs: whole(now + INSPECT_MS) };
      say(state, bus, A.armourerId, ARM_SAY.inspect, {}, 'inspect', A.turnBacks);
      break;
    }
    case 'signIn': {
      const g = A.given ?? A.gunId;
      BOOKS.signIn(state, g, A.armourerId, { at: rackAt() });
      A.signedIn = true;
      say(state, bus, A.armourerId, ARM_SAY.signedIn, {}, 'signedIn');
      if (now > A.rackByMs) { A.late = true; armFault(state, bus, 'late', 'warn', A.leaderId, ARM_SAY.late, {}, 'late'); }
      break;
    }
    default: break;
  }
}
// (a roll of the player's, its rng the seed's and the moment's: a save carries on with the same die. state.$armDie, a test's switch
// (runtime, never saved: tests/armoury-world.mjs dieAs), fixes the die's face for the next roll, so a pass and a natural 1 are scripted)
function rollOf(state, skill, dc, ...key) {
  const pid = playerId(state), roller = rollerOf(state, pid), mods = roller.mods(skill, {}) ?? [], value = roller.value(skill);
  const die = state.$armDie ?? null;
  if (die !== null) {
    delete state.$armDie;
    const v = value + mods.reduce((t, m) => t + m.v, 0), sure = sureOf({ value, dc, mods, pressure: 'evaluated', procedure: true });
    return { kind: 'check', skill, value, roll: die, mods, total: die + v, dc, ok: die === 20 || (die === 1 ? sure : die + v >= dc), scripted: true };
  }
  return check(stream(state.meta.seed, 'arm:roll', ...key, state.clock.ms), { skill, value, dc, mods, pressure: 'evaluated', procedure: true, by: pid });
}
// (UNLOAD, SHOW CLEAR played whole at the act's end, the station's observer looking (drills.js runMacro): the chambered round thrown at
// your feet, the readiness 'shown' met on the show's pass; at the barrel the muzzle in it)
function showNow(state, bus, id) {
  const R = armouryOf(state), A = R.arm, pid = playerId(state), gunId = gunOn(state, pid), gun = state.items[gunId];
  if (!gun) return;
  const live = gunField(gun, 'chamber') === 'live', carry = (state.people[pid].kit.carry ??= {});
  // (in the hands for it, at the low ready, slung again after: the act is the whole show clear, its frames the act's)
  carry.posture = 'lowReady';
  const out = runMacro(state, bus, { macro: 'clear', pid, gunId, observerId: R.coachId, pressure: 'evaluated' });
  if (live && gunField(gun, 'chamber') !== 'live') recordEjects(state, pid, ['round'], state.clock.ms, `arm-show:${R.cmd.i}`);
  const shown = out.subs.some(s => s.action === 'show' && s.ok) && !out.halted;
  if (shown) { R.shown = true; if (id === 'barrel') A.barrelShown = true; }
  carry.posture = 'slungFront'; delete carry.finger;
}
/** Rounds back (the act's end, or the NCO's on the move-on): every round on you to him, the magazines kept; the line's back. */
function roundsBackNow(state, bus) {
  const R = armouryOf(state), A = R.arm, n = emptyAction(state) + (R.picked ?? 0);
  delete R.picked;
  const line = state.armoury.ammoIssues.find(a => a.id === R.issueId);
  if (line) line.back = (line.back ?? 0) + n;
  A.turnedIn = R.cmd?.i ?? indexOf('turnIn');
  say(state, bus, A.ncoId, n === 1 ? ARM_SAY.back1 : n ? ARM_SAY.backN : ARM_SAY.backNone, { n: countWord(n) }, 'back', n);
  return n;
}
/**
 * The declaration (the act's end, or the NCO's on the move-on): armoury.js reconcile the one reader. All square, "Clear. On the bus."; a
 * magazine of yours with rounds in it lying off you, the NCO finds it on the line and books it lost with its rounds and its place (the fault
 * 'lost'; armoury.js reportLost, so the turn-in's count never books it again); a round held, the NCO's search finds it (the fault 'declare');
 * brass short, the working party's splash (the fault 'brass'); the short count, the shakedown's (the fault 'count') only when the shortfall is
 * his carton's (the line handed under its n: signed uncounted), any other round short found by his search on the line (the fault 'declare').
 * Never a dead end. Returns R.arm.declared.
 */
function declareNow(state, bus, { by = 'you' } = {}) {
  const R = armouryOf(state), A = R.arm, pid = playerId(state);
  const line = state.armoury.ammoIssues.find(a => a.id === R.issueId);
  if (line) line.brassBack = R.policed ?? 0;
  if (by === 'you') say(state, bus, pid, ARM_SAY.declared, {}, 'declared');
  // (your loaded magazines lying off you, not yet booked: the rounds in them are a loss, never the NCO's short count; the review of v0.0.28
  // B: a loaded magazine dropped on the lane was booked as his carton's, "My count, and you signed for it", and lost again at the turn-in)
  const booked = new Set((state.armoury.lost ?? []).map(l => l.itemId));
  // (lost by WEAPONS §10.6's rule (armoury.js lostOf: more than LOST_M from you and out of sight), never merely off you: a magazine at your
  // feet is yours to pick up (the fixer of v0.0.28's code review, finding 7))
  const off = BOOKS.magsOf(state, pid, A.mags).missing.filter(id => (state.items[id]?.n ?? 0) > 0 && !booked.has(id) && BOOKS.lostOf(state, id, { by: pid }).lost);
  if (off.length) {
    const n = off.reduce((t, id) => t + state.items[id].n, 0), where = whereLies(state, off[0]) ?? 'the ground';
    for (const id of off) BOOKS.reportLost(state, bus, id, { by: pid, kind: 'mag', where: whereLies(state, id) });
    armFault(state, bus, 'lost', 'fault', A.ncoId, ARM_SAY.declMag, { n: countWord(n), where }, 'mag');
  }
  const rec = BOOKS.reconcile(state, pid);
  // (the carton's shortfall: twenty on the line, nineteen handed, signed uncounted; what is short past it lies loose where you dropped it)
  const carton = line && Number.isFinite(line.handed) ? Math.max(0, (line.n ?? 0) - line.handed) : 0, all = Math.max(0, rec.short ?? 0);
  const short = carton > 0 && all >= carton, loose = all - (short ? carton : 0);
  const brassShort = (rec.brassBack ?? 0) < (rec.brassFired ?? rec.fired ?? 0), held = rec.held ?? 0;
  A.declared = { ...rec, by, atMs: state.clock.ms, brassShort, held, shortFound: short, ...(off.length ? { lostMags: off.length } : {}), ...(loose ? { loose } : {}) };
  if (held) { armFault(state, bus, 'declare', 'fault', A.ncoId, ARM_SAY.declHeld, {}, 'held'); roundsBackNow(state, bus); }
  // (rounds of yours loose on the line: his search finds them and takes them back; your declaration was false)
  if (loose) { if (line) line.back = (line.back ?? 0) + loose; armFault(state, bus, 'declare', 'fault', A.ncoId, ARM_SAY.declLoose, { n: countWord(loose) }, 'loose'); }
  // (the short count first, the shakedown's; brass short after it, the working party's)
  const brass = () => { armFault(state, bus, 'brass', 'warn', A.ncoId, ARM_SAY.declBrass, { fired: countWord(rec.brassFired ?? rec.fired), policed: countWord(rec.brassBack ?? 0) }, 'brass'); return { id: 'arm-police', ms: WORKPARTY_MIN * MIN_MS, then: 'workparty' }; };
  if (short) { say(state, bus, A.ncoId, ARM_SAY.declShort, {}, 'short'); A.splash = { id: 'arm-shakedown', ms: SHAKEDOWN_MIN * MIN_MS, then: 'shakedown' }; A.brassAfter = brassShort; }
  else if (brassShort) A.splash = brass();
  if (!held && !short && !brassShort) say(state, bus, A.ncoId, ARM_SAY.declOk, {}, 'ok');
  bus?.emit('range', { phase: 'declare', cmd: R.cmd?.id ?? null, hot: false, rule: null, kind: null, text: null, declare: { brass: R.policed ?? 0, rounds: held, ok: !held && !short && !brassShort && !loose && !off.length } });
  return A.declared;
}

// ---- each lived tick ----

/**
 * The fast layer 'rules' on the armoury course (arms/domain.js, in place of rangeRules off the lane; on the lane the range's as built, after
 * the scene's tick): the acts' ends, the fetch, the rank's serials, the inspection, the splashes begun and ended, the activities wanted, the
 * rank's ring, the muzzle near people and the box.
 */
export function armouryRules(state, input, bus, ctx) {
  const R = armouryOf(state);
  if (!R) return;
  armouryTick(state, bus, ctx);
  if (R.end || state.skip) return;
  if (R.arm.stage === 'lane' && R.lane) { rangeRules(state, input, bus, ctx); return; }
  armourySafety(state, bus);
}

/** The scene's tick (see armouryRules). */
export function armouryTick(state, bus, ctx) {
  const R = armouryOf(state);
  if (!R || R.end || state.skip) return;
  const A = R.arm, now = state.clock.ms, me = playerActor(state), pid = playerId(state);
  // (a splash or an activity ended: its outcome, on the first lived tick after it)
  if (A.splashOn && !state.time?.doing) splashEnd(state, bus);
  if (A.cleaning && !state.time?.doing) cleanDone(state, bus);
  if (A.policing !== undefined && A.policing !== null && !state.time?.doing) { A.policing = null; }
  if (R.end) return;
  // (an act's end)
  if (A.doing && now >= A.doing.untilMs) { const id = A.doing.id; A.doing = null; actEnd(state, bus, id); }
  // (a rifle shown clear and still in the hands out of stop motion goes on its sling, as R's show clear and the coach's leave it: the step
  // panel's UNLOAD, SHOW CLEAR (G) left it at the low ready, and on the lane the walk to the far cases then met range safety's "Not off the
  // point with it in your hands." and the stop (the review of v0.0.28 B: either channel satisfies, so both leave the same rifle))
  if (R.shown && !state.stop && !A.doing) {
    const carry = state.people[pid]?.kit?.carry, gun = state.items[gunOn(state, pid)];
    if (carry && gun && !['slungFront', 'slungBack'].includes(carry.posture ?? 'slungFront') && !gun.mag && gunField(gun, 'chamber') !== 'live') { carry.posture = 'slungFront'; delete carry.finger; }
  }
  // (the armourer back from the rack)
  if (A.fetch && now >= A.fetch.untilMs) {
    const what = A.fetch.what;
    A.fetch = null; A.fetches++;
    handRifle(state, A.slip && what === 'rifle' ? A.slipId : A.gunId);
    R.shown = false;
    say(state, bus, A.armourerId, ARM_SAY.fetched, {}, 'fetched', A.fetches);
    if (what === 'swap' && A.handedBack) A.handedBack = 'fetched';
    // (the right rifle after a swap: its rows again, the read too)
    if (what === 'swap') {
      A.read = false; A.readOk = null; A.readAs = null;
      // (T's Draw under way reads the right rifle too: its read was spent on the slip's, and the bundle went on to show and sign the
      // replacement unread (the fixer of v0.0.28's play review, finding 4: "serial not read, the slip caught" on the card, by T only))
      if (A.queue?.length && !A.queue.includes('read')) A.queue.unshift('read');
    }
  }
  // (the rank's serials, a marine's bubble each CHECK_EACH_MS, then your name)
  if (A.check && !A.check.you && now >= A.check.atMs) {
    const { marines } = squadOf(state), k = A.check.k;
    if (k < marines.length && !A.check.again) {
      const who = marines[k];
      const tail = serialSaid(String(100000 + hashInt(900000, 'arm:serial', state.meta.seed, who))).split(', ').at(-1);
      const said = say(state, bus, who, ARM_SAY.checkTail, { tail }, 'check', who);
      A.check.k++; A.check.atMs = now + Math.max(CHECK_EACH_MS, spokenMs(said ?? '') + CHECK_GAP_MS);
    } else { A.check.you = true; say(state, bus, A.leaderId, ARM_SAY.checkYou, { name: state.people[pid]?.name?.family ?? 'Marine' }, 'you'); }
  }
  // (the inspection's end: upkeep.js inspect, its verdict)
  if (A.inspecting && now >= A.inspecting.untilMs) { A.inspecting = null; inspectTurn(state, bus); }
  // (the rank's ring: standing on it INRANK_MS is fallen in)
  if (keyOf(R) === 'fallIn') { const st = stationOf(state); if (near(me, st) && !(me.gait && me.gait !== 'idle')) A.inRankMs += TICK_MS; else A.inRankMs = 0; }
  // (T's bundle: its next row)
  if (A.queue?.length) runQueue(state, bus);
  // (a splash or an activity wanted: begun once you are out of the mode and nothing else runs)
  if ((A.splash || A.want) && !state.time?.doing && ctx?.sim) {
    const S = state.stop;
    if (S?.mode === 'stop' && S.phase === 'choose' && !S.reflex && !S.doing) leaveStop(state, bus, 'scene');
    if (!state.stop) {
      if (A.splash) {
        const sp = A.splash, carry = state.people[pid]?.kit?.carry;
        if (carry) { carry.posture = 'slungFront'; delete carry.finger; }
        if (me) delete me.stance;
        const r = startActivity(state, bus, ctx, { id: sp.id, args: { ms: sp.ms }, force: 'outcome' });
        if (r.ok) { A.splashOn = sp; A.splash = null; }
      } else if (A.want?.kind === 'police') {
        const n = brassNear(state, pid, POLICE_M).mine, ms = Math.max(1000, Math.round(n * POLICE_CASE_S * 1000));
        if (me) me.stance = 'kneel';
        const r = startActivity(state, bus, ctx, { id: 'police-brass', args: { ms } });
        if (r.ok) A.policing = R.cmd.i; else if (me) delete me.stance;
        A.want = null;
      } else if (A.want?.kind === 'clean') {
        const w = A.want, gunId = A.given ?? A.gunId, gun = state.items[gunId];
        A.want = null;
        const ms = UPKEEP.cleanMs(state, pid, gunId, w.tempo, { again: w.again }), live = gunField(gun, 'chamber') === 'live';
        const r = startActivity(state, bus, ctx, { id: w.again ? 'clean-again' : 'clean-rifle', args: { tempo: w.tempo, again: w.again } });
        if (r.ok) {
          // (the table the clean is at, on the activity's record: the splash's framing and its vignette find the mat's table by its spot (the
          // activity takes no spot of its own, upkeep.js: uses none))
          if (state.time?.doing) state.time.doing.spotId = A.table;
          A.cleaning = { tempo: w.tempo, again: w.again, ms, fromMs: now, i: w.i, cleans: gun?.cleans ?? 0 }; A.tempo = w.tempo;
          // (a round the belief missed fell out on the mat at the strip (upkeep.js cleanStart): your declaration was false; the NCO's to count as held)
          if (live && gunField(gun, 'chamber') !== 'live') { R.picked = (R.picked ?? 0) + 1; armFault(state, bus, 'declare', 'fault', A.leaderId, ARM_SAY.liveOnMat, {}, 'mat'); }
        }
      }
    }
  }
  // (at the barrel the show must be there: a show clear made elsewhere is not the barrel's)
  if (keyOf(R) === 'barrel' && R.shown && !A.barrelShown) {
    if (near(me, stationOf(state))) A.barrelShown = true;
    else { R.shown = false; say(state, bus, A.armourerId, ARM_SAY.showFirst, {}, 'barrel', now); }
  }
}

// (the muzzle near people at the window, in the rank and at the canopy (carry.js's habit, its flag or point), and the box: the scene's
// rules off the lane)
function armourySafety(state, bus) {
  const R = armouryOf(state), A = R.arm, now = state.clock.ms, pid = playerId(state), me = playerActor(state);
  if (state.time?.doing || A.splashOn) return;
  const near0 = state.people[pid]?.kit?.carry?.near ?? {};
  const flagged = Object.values(near0).some(r => r.told && (r.result === 'flag' || r.result === 'point'));
  if (flagged && (R.warned.muzzle === undefined || now - R.warned.muzzle >= WARN_AGAIN_MS)) {
    R.warned.muzzle = now;
    const who = ['ammo', 'issue', 'walk', 'relay'].includes(A.stage) ? 'nco' : A.stage === 'rank' ? 'leader' : 'armourer';
    armFault(state, bus, 'muzzle', 'warn', speakerOf(A, who), ARM_SAY.muzzle[who], {}, 'muzzle', now);
  }
  // (a round fired off the lane: a negligent discharge, the line stopped)
  if (R.$tick && R.$tick.ms === now && R.$tick.shot) { stopRange(state, bus, 'nd'); return; }
  // (the box: out of it, the leader's word once, then the fetch after FETCH_S)
  const at = boxOf(A.stage);
  if (!at || !me) return;
  const out = me.x < at[0] || me.x > at[2] || me.z < at[1] || me.z > at[3];
  if (!out) { A.boxOutMs = null; A.boxSaid = false; return; }
  A.boxOutMs ??= now;
  if (!A.boxSaid) { A.boxSaid = true; say(state, bus, A.leaderId, ARM_SAY.box, {}, 'box', now); }
  if (now - A.boxOutMs >= FETCH_S * 1000 && !A.splash && !A.splashOn) { A.splash = { id: 'arm-fetch', ms: FETCH_MIN * MIN_MS, then: 'fetch' }; A.boxOutMs = null; A.boxSaid = false; }
}
// (the box round a stage: the armoury's ground round the window, the rank, the canopy and the barrels; the ammunition point's)
function boxOf(stage) {
  const [w, d] = BOX_M;
  if (['window', 'rank', 'canopy', 'barrel'].includes(stage)) { const W = armouryPlaceOf('f:armoury:window-1#1'), cx = W.x + 8, cz = W.z + 2; return [cx - w / 2, cz - d / 2, cx + w / 2, cz + d / 2]; }
  if (stage === 'ammo') return [KD_AMMO.x - w / 2, KD_AMMO.z - d / 2, KD_AMMO.x + w / 2, KD_AMMO.z + d / 2];
  return null;
}

// (a splash ended: its outcome (see the header))
function splashEnd(state, bus) {
  const R = armouryOf(state), A = R.arm, sp = A.splashOn;
  A.splashOn = null;
  switch (sp.then) {
    case 'ammo': arriveAmmo(state); A.stage = 'ammo'; A.arrived = sp.i; break;
    case 'relay': {
      R.lane = drawLaneOf(state);
      const o = relayOutcome(state, bus);
      A.stage = 'lane'; A.arrived = sp.i;
      sayOn(state, bus, { who: A.ncoId, text: `${hashPick(ARM_SAY.air[o.air], 'arm-say', state.meta.seed, 'air')} ${capital(countWord(o.fired))} rounds fired, ${countWord(o.left)} left.`, kind: 'speech' });
      break;
    }
    case 'walk': arriveAmmo(state); delete R.lane; A.stage = 'ammo'; A.arrived = sp.i; break;
    case 'canopy': arriveCanopy(state); A.stage = 'canopy'; A.arrived = sp.i; break;
    case 'workparty': {
      // (the working party: every case of yours left on the line picked up)
      for (const t of Object.values(R.brassTiles ?? {})) { R.policed = (R.policed ?? 0) + t.mine; t.n -= t.mine; t.mine = 0; }
      R.brassTiles = Object.fromEntries(Object.entries(R.brassTiles ?? {}).filter(([, t]) => t.n > 0));
      const line = state.armoury.ammoIssues.find(a => a.id === R.issueId);
      if (line) line.brassBack = R.policed ?? 0;
      if (A.declared) A.declared.settled = true;
      break;
    }
    case 'shakedown': {
      // (the recount finds the twentieth in his own can: the line set to what was handed, the fault yours for signing it)
      const line = state.armoury.ammoIssues.find(a => a.id === R.issueId);
      if (line) { line.n = line.handed ?? line.n; line.found = 1; }
      armFault(state, bus, 'count', 'warn', A.ncoId, ARM_SAY.shakedown, {}, 'shakedown');
      if (A.declared) A.declared.settled = true;
      if (A.brassAfter) {
        A.brassAfter = false;
        const line2 = state.armoury.ammoIssues.find(a => a.id === R.issueId);
        armFault(state, bus, 'brass', 'warn', A.ncoId, ARM_SAY.declBrass, { fired: countWord(line2?.fired ?? 0), policed: countWord(R.policed ?? 0) }, 'brass');
        A.splash = { id: 'arm-police', ms: WORKPARTY_MIN * MIN_MS, then: 'workparty' };
      }
      break;
    }
    case 'fetch': {
      A.fetches++;
      armFault(state, bus, 'wander', 'warn', A.leaderId, ARM_SAY.fetchedYou, {}, 'wander', A.fetches);
      const st = stationOf(state);
      if (st) placeMe(state, st);
      break;
    }
    case 'chit': {
      UPKEEP.fitPin(state, A.given ?? A.gunId);
      armFault(state, bus, 'part', 'warn', A.armourerId, ARM_SAY.chit, {}, 'chit');
      A.passed = true; A.handedIn = true;
      break;
    }
    case 'place': { const st = stationOf(state); if (st) placeMe(state, st); A.inRankMs = INRANK_MS; break; }
    default: break;
  }
}
// (a clean ended (A's clean-rifle or clean-again, its roll at its end: upkeep.js cleanEnd): its record from the gun)
function cleanDone(state, bus) {
  const R = armouryOf(state), A = R.arm, w = A.cleaning, g = state.items[A.given ?? A.gunId];
  A.cleaning = null;
  // (a clean that ended before its assembly (its 'D A' mask cut it: upkeep.js cleanEnd never rolled, the gun's cleans unmoved) is no clean:
  // the command stands, so the bench is done again or the line moves on (the fixer of v0.0.28's code review, finding 9))
  if (w && Number.isFinite(w.cleans) && (g?.cleans ?? 0) <= w.cleans) return;
  // (what the bench left, read off the rifle (upkeep.js cleanEnd's: the carbon it leaves, the pin): spotless at FIND_FREE or less)
  const residual = gunField(g, 'foul') ?? 0;
  A.cleans.push({ tempo: w.tempo, ms: w.ms, grade: residual <= UPKEEP.FIND_FREE ? 'spotless' : 'carbon left', residual, fault: g?.fault ?? null });
  A.cleanedAt = w.i;
  void bus;
}

// (where a lost item lies, in the words the card and the report keep: "the 25 m line, lane 3", else the place's name; null held)
function whereLies(state, itemId) {
  const at = BOOKS.lostOf(state, itemId, { by: playerId(state) }).where;
  if (!at) return null;
  const L = KD_RANGE.bay.lanes.reduce((b, l) => (Math.abs(l.fp.z - at.z) < Math.abs((b?.fp.z ?? Infinity) - at.z) ? l : b), null);
  const bay = KD_RANGE.bay, onBay = at.area === KD_RANGE.area && at.x >= bay.walk[0] - 4 && at.x <= bay.walk[2] && at.z >= bay.walk[1] && at.z <= bay.walk[3];
  return onBay && L ? `the 25 m line, lane ${L.lane}` : null;
}
/**
 * The inspection's verdict (upkeep.js inspect at the armourer's Awareness: WEAPONS §10.3), then the serial and the magazines: pass, "Clean.
 * Rack it. Condition 0.93." and Sign it in; found, "Clean it again." and the table (the third turn-back taken with the fault 'dirty'); the
 * pin, a chit and twenty minutes (the fault 'part').
 */
function inspectTurn(state, bus) {
  const R = armouryOf(state), A = R.arm, pid = playerId(state), gunId = A.given ?? A.gunId;
  const v = UPKEEP.inspect(state, gunId, { armourerId: A.armourerId });
  A.inspections.push({ atMs: state.clock.ms, verdict: v.verdict, total: v.total, dc: v.dc, roll: v.roll?.roll ?? v.roll ?? null });
  // (the magazines counted: fewer than drawn, each missing one recorded lost where it lies, once: one already in the book (the declaration's,
  // or an earlier look's before a turn-back) is counted short again but never reported or faulted twice; the review of v0.0.28 B)
  // (a magazine missing but not lost by WEAPONS §10.6's rule (armoury.js lostOf: within LOST_M of you, or in your sight) is counted with
  // those on you, never booked lost: at your feet at the window it was reported "lost" (the fixer of v0.0.28's code review, finding 7))
  const counted = BOOKS.magsOf(state, pid, A.mags), booked = new Set((state.armoury.lost ?? []).map(l => l.itemId));
  const near0 = counted.missing.filter(id => !booked.has(id) && !BOOKS.lostOf(state, id, { by: pid }).lost);
  const held = [...counted.held, ...near0], missing = counted.missing.filter(id => !near0.includes(id));
  const fresh = missing.filter(id => !booked.has(id));
  for (const id of fresh) BOOKS.reportLost(state, bus, id, { by: pid, kind: 'mag', where: whereLies(state, id) });
  const what = held.length ? `${countWord(held.length)} magazine${held.length > 1 ? 's' : ''}` : 'no magazines';
  if (fresh.length) armFault(state, bus, 'lost', 'fault', A.armourerId, ARM_SAY.magsShort, { what }, 'mags');
  else if (missing.length) say(state, bus, A.armourerId, ARM_SAY.magsShort, { what }, 'fault', 'lost', 'mags');
  else say(state, bus, A.armourerId, ARM_SAY.magsOk, {}, 'mags', A.turnBacks);
  if (v.verdict === 'pin') {
    say(state, bus, A.armourerId, ARM_SAY.pin, {}, 'pin');
    A.splash = { id: 'arm-chit', ms: UPKEEP.PIN_CHIT_MIN * MIN_MS, then: 'chit' };
    return;
  }
  if (v.verdict === 'again') {
    A.turnBacks++;
    if (A.turnBacks >= TURNBACK_MAX) { armFault(state, bus, 'dirty', 'fault', A.armourerId, ARM_SAY.taken, {}, 'dirty'); A.passed = true; A.handedIn = true; return; }
    sayOn(state, bus, { who: A.armourerId, text: v.words ?? hashPick(ARM_SAY.again, 'arm-say', state.meta.seed, 'again', A.turnBacks), kind: 'speech' });
    handRifle(state, gunId);
    A.again = true; A.barrelShown = false; R.shown = false;
    A.handedIn = 'again';
    return;
  }
  say(state, bus, A.armourerId, ARM_SAY.pass, { cond: UPKEEP.condNumber(state.items[gunId]) }, 'pass');
  A.passed = true; A.handedIn = true;
}

// ---- the course engine's doors (handling.js) ----

/** The scene's readinesses (handling.js lineReady's branch): whether the line is ready for the command's next ('shown' the range's rule: still, shown). */
export function armouryReady(state, def, { still = true } = {}) {
  const R = armouryOf(state), A = R?.arm;
  if (!A) return false;
  const busy = !!(A.doing || A.fetch || A.inspecting || A.splash || A.splashOn || A.want || A.cleaning || state.time?.doing);
  switch (def.ready) {
    case 'carded': return A.carded && !A.fetch && !!A.given;
    case 'signed': return !!A.signed && !busy;
    case 'inRank': return A.inRankMs >= INRANK_MS;
    case 'called': return A.called && !busy;
    case 'handedBack': return A.handedBack === 'fetched' && !busy;
    case 'arrived': return A.arrived === R.cmd.i && !busy;
    case 'issued': return A.issued && !busy;
    case 'always': return true;
    case 'shown': return still && !!R.shown && !busy;
    case 'policed': return (brassLeft(state).mine === 0 || A.policeMoved === R.cmd.i) && !busy && !state.stop;
    case 'turnedIn': return A.turnedIn === R.cmd.i && !busy;
    case 'declared': return !!A.declared && !busy;
    case 'cleaned': return A.cleanedAt === R.cmd.i && !busy;
    case 'barrel': return !!A.barrelShown && !busy && !state.stop;
    case 'handedIn': return (A.handedIn === true || A.handedIn === 'again') && !busy;
    case 'signedIn': return A.signedIn && !busy;
    default: return false;
  }
}

/** The command after i (see the header): the slip's way back to the window, a turn-back's to the table, else the next; null after the last. */
export function armouryNext(state, i) {
  const A = armOf(state), key = SEQ_ARMOURY[i]?.key;
  if (key === 'serials') return A.slipFound && A.handedBack !== 'fetched' && !A.backDone ? indexOf('back') : indexOf('bus');
  if (key === 'back') return indexOf('window');
  if (key === 'handIn') return A.handedIn === 'again' ? indexOf('clean') : indexOf('signIn');
  if (key === 'fallIn' || key === 'window') return i + 1;
  return i + 1 < SEQ_ARMOURY.length ? i + 1 : null;
}

/** A command said (handling.js onRangeCmd's branch): its speaker's words, the stage, the observer, the splash or the rows it opens. */
export function armouryOnCmd(state, bus, def, i) {
  const R = armouryOf(state), A = R.arm, pid = playerId(state);
  A.stage = def.stage === 'bus' || def.stage === 'relay' || def.stage === 'walk' ? A.stage : def.stage;
  A.waitMs = 0; A.nudged = false;
  const who = speakerOf(A, def.who);
  R.roId = who;
  const serial = A.given ? serialSaid(BOOKS.serialOf(state, A.given)) : '';
  const text = fill(hashPick(def.say, 'range-cmd', state.meta.seed, i, A.fetches, A.turnBacks), { serial });
  sayOn(state, bus, { who, text, kind: 'speech' });
  // (the words said kept on the command, so the radio box's standing line is the line heard (handling.js standingCmd reads R.cmd.text))
  R.cmd.text = text;
  bus?.emit('range', { phase: 'cmd', cmd: def.id, hot: false, rule: null, kind: null, text: null, key: def.key });
  switch (def.key) {
    case 'brief': R.phase = 'brief'; break;
    case 'card': R.phase = 'cmd'; R.coachId = A.armourerId; break;
    case 'window': R.phase = 'cmd'; R.coachId = A.armourerId; R.shown = false; break;
    case 'fallIn': A.inRankMs = 0; break;
    case 'serials': A.called = false; A.check = { k: 0, atMs: state.clock.ms + CHECK_EACH_MS, you: false, again: A.slipFound }; if (A.slipFound) A.backDone = true; break;
    case 'back': A.handedBack = false; break;
    case 'bus': A.splash = { id: 'arm-bus', ms: BUS_MIN * MIN_MS, then: 'ammo', i }; A.stage = 'bus'; break;
    case 'issue': R.coachId = A.ncoId; break;
    case 'relay': A.splash = { id: 'arm-relay', ms: RELAY_MIN * MIN_MS, then: 'relay', i }; A.stage = 'relay'; break;
    case 'lane': R.coachId = A.ncoId; R.shown = false; break;
    case 'police': break;
    case 'walk': A.splash = { id: 'arm-walk', ms: WALK_MIN * MIN_MS, then: 'walk', i }; A.stage = 'walk'; break;
    case 'busBack': A.splash = { id: 'arm-bus', ms: BUS_MIN * MIN_MS, then: 'canopy', i }; A.stage = 'bus'; break;
    case 'clean': A.cleanedAt = null; break;
    case 'barrel': R.coachId = A.armourerId; R.shown = false; A.barrelShown = false; break;
    case 'handIn': A.handedIn = false; break;
    case 'signIn': A.signedIn = false; break;
    case 'end': endRange(state, bus, 'clear', null); break;
    default: break;
  }
  void pid;
}

/** The scene's second (handling.js rangeSecond's branch, on whole seconds lived): the brass settled, the next command once the line is ready, the nudge and the move-on. */
export function armourySecond(state, bus, ctx) {
  const R = armouryOf(state);
  if (!R || R.end || !R.cmd) return;
  const A = R.arm, now = state.clock.ms;
  settle(state, now);
  if (R.next) return;
  const i = R.cmd.i, def = SEQ_ARMOURY[i];
  if (lineReady(state, R.cmd.id)) {
    const ni = armouryNext(state, i);
    if (ni === null) return;
    const gap = i === 0 ? C.firstGapMs : intIn(stream(state.meta.seed, 'arm:gap', ni, A.fetches, A.turnBacks), C.roGapMs[0], C.roGapMs[1]);
    const atMs = now + gap;
    post(state, { atMs, prio: 2, kind: 'range-cmd', src: 'arms:range', payload: { cmd: SEQ_ARMOURY[ni].id, i: ni } });
    R.next = { id: SEQ_ARMOURY[ni].id, i: ni, atMs: Math.floor(atMs / 1000) * 1000 };
    return;
  }
  // (the line waits on you alone: no act, fetch, check, inspection, splash or activity of the scene's under way, and a command you answer)
  const waits = def.ready !== 'always' && def.ready !== 'never' && def.ready !== 'arrived' && !(A.doing || A.fetch || A.inspecting || A.splash || A.splashOn || A.want || A.cleaning || state.time?.doing || (A.check && !A.check.you));
  if (!waits) return;
  A.waitMs += 1000;
  if (!A.nudged && A.waitMs >= C.nudgeMs) {
    A.nudged = true;
    sayOn(state, bus, { who: speakerOf(A, def.who), text: nudgeWords(state, def), kind: 'speech' });
  }
  if (A.waitMs >= C.moveOnMs) armouryMoveOn(state, bus, ctx);
}
// (the nudge: the command's terms again, the far cases named at the police)
function nudgeWords(state, def) {
  const R = armouryOf(state), name = state.people[playerId(state)]?.name?.family ?? 'Marine';
  if (def.key === 'police') { const f = farCases(state); if (f) return `${name}, ${f.n === 1 ? 'one more case' : `${countWord(f.n)} more cases`}, ${f.m} metres ${f.dir}.`; }
  void R;
  return `${name}. ${def.short ?? def.say[0]}`;
}
/** Your brass beyond the police's reach: { n, m (metres to them), dir (the screen's word), key (its move key) } or null. */
export function farCases(state) {
  const R = armouryOf(state), me = playerActor(state);
  if (!R || !me) return null;
  let n = 0, sx = 0, sz = 0;
  for (const [k, t] of Object.entries(R.brassTiles ?? {})) {
    if (!t.mine) continue;
    const [i, j] = k.split(',').map(Number), x = i + 0.5, z = j + 0.5;
    if (Math.hypot(x - me.x, z - me.z) <= POLICE_M) continue;
    n += t.mine; sx += x * t.mine; sz += z * t.mine;
  }
  if (!n) return null;
  const dx = sx / n - me.x, dz = sz / n - me.z, m = Math.max(1, Math.round(Math.hypot(dx, dz)));
  const key = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 'right' : 'left') : (dz > 0 ? 'down' : 'up');
  return { n, m, dir: key, key };
}

/** The line moves on (handling.js moveOn's branch): the command left undone done for you, the fault 'slow' in its speaker's words (see the header). */
export function armouryMoveOn(state, bus) {
  const R = armouryOf(state), A = R.arm, pid = playerId(state), def = SEQ_ARMOURY[R.cmd.i], who = speakerOf(A, def.who);
  A.waitMs = 0;
  // (a show clear never made: the observer clears it himself, his own 'slow' fault (handling.js coachClears))
  if (def.ready === 'shown' || (def.key === 'window' && !R.shown) || (def.key === 'barrel' && !A.barrelShown)) {
    coachClears(state, bus);
    if (def.key === 'barrel') A.barrelShown = true;
    if (def.key !== 'window') return;
  } else armFault(state, bus, 'slow', 'warn', who, ARM_SAY.slow, {}, 'slow', R.cmd.i);
  A.doing = null; A.queue = [];
  switch (def.key) {
    case 'card': A.carded = true; A.fetch = { what: 'rifle', untilMs: whole(state.clock.ms + FETCH_RACK_MS) }; break;
    case 'window': if (A.given) { BOOKS.signOut(state, A.given, pid, A.armourerId); A.signed = A.given; } break;
    case 'fallIn': A.splash = { id: 'arm-fetch', ms: FETCH_MIN * MIN_MS, then: 'place' }; break;
    case 'serials': if (A.check) A.check.you = true; actEnd(state, bus, 'call'); break;
    case 'back': actEnd(state, bus, 'back'); break;
    case 'issue': A.handed = A.short && !A.added ? C.issueN - 1 : C.issueN; issueSigned(state); break;
    case 'police': {
      const me = playerActor(state), st = stationOf(state), was = me ? { x: me.x, z: me.z } : null;
      if (me && st) { me.x = st.x; me.z = st.z; }
      police(state);
      if (me && was) { me.x = was.x; me.z = was.z; }
      // (the far cases are yours to walk to: left on the line, the declaration's to find)
      A.policeMoved = R.cmd.i;
      break;
    }
    case 'turnIn': roundsBackNow(state, bus); break;
    case 'declare': declareNow(state, bus, { by: 'nco' }); break;
    case 'clean': A.want = { kind: 'clean', tempo: 'normal', again: !!A.again, i: R.cmd.i }; break;
    case 'handIn': actEnd(state, bus, 'handIn'); break;
    case 'signIn': actEnd(state, bus, 'signIn'); break;
    default: break;
  }
}

/**
 * The standing command as the radio box keeps it (handling.js standingCmd's branch): the speaker's words and, after them, what to press
 * (armouryPressOf), or null when nothing stands: the brief, a splash's command, the end, your readiness met, the next posted.
 */
export function armouryStanding(state, c) {
  const R = armouryOf(state), def = defOf(R);
  if (!c || !def || def.ready === 'arrived') return null;
  const press = armouryPressOf(state, def.key);
  const who = speakerOf(R.arm, def.who);
  return { ...c, who, said: c.text, text: press ? `${c.text} · ${press}` : c.text, short: press ? `${def.short ?? c.short} · ${press}` : def.short ?? c.short };
}

/**
 * What to press for a command (the user's report of 2026-11-19: every instruction says what to press, the row by its label and the key by
 * its label read from the code): "R at the window", "walk to the yellow ring (Z Q S D)", "R: Count the rounds", "hold R: rushed, normal or
 * careful"; off the station the walk and the key ("walk to the yellow ring (Z Q S D), then R"). The next row not yet done only, never a chain
 * (the review of v0.0.28 B: the window's three rows and the panel's alternative ran the radio box's standing line past its two lines at every
 * size, so "then R: Sign for it" was never seen; R held lists them all, and the line moves on as each is done). layout: core/keys.js's
 * (AZERTY by default, as every label in the game).
 */
export function armouryPressOf(state, key, { layout = 'azerty' } = {}) {
  const R = armouryOf(state), P = ARM_PRESS[key];
  if (!R || !P) return null;
  const A = R.arm, k = (a) => label(a, { layout }), me = playerActor(state), st = stationOf(state);
  const walk = `walk to the yellow ring (${['up', 'left', 'down', 'right'].map(k).join(' ')})`;
  const on = st ? near(me, st) || (P.station === 'lane' && key === 'police') : true;
  if (key === 'fallIn') return walk;
  if (key === 'police') {
    const f = farCases(state), n = brassNear(state, playerId(state), POLICE_M).mine;
    const here = n ? `${k('hand')}: ${ARM_ROWS.police}` : null, far = f ? `${f.n === 1 ? 'one case' : `${countWord(f.n)} cases`} ${f.m} m ${f.dir}: ${k(f.key)}, then ${k('hand')}` : null;
    return [here, far].filter(Boolean).join('; ') || `${k('hand')}: ${ARM_ROWS.police}`;
  }
  if (!on) return `${walk}, then ${P.tempo ? 'hold ' : ''}${k('hand')}`;
  if (P.tempo) {
    const rows = A.again ? ['againRushed', 'againNormal', 'againCareful'] : P.rows;
    return `hold ${k('hand')}: ${rows.map(r => ARM_ROWS[r].replace(/^Clean( it again)?, /, '')).join(', ').replace(/, ([^,]*)$/, ' or $1')}`;
  }
  if (P.station === 'window' && key === 'card') return `${k('hand')} at the window`;
  // (the rank's check comes to you: no key until your name (the row is struck 'wait for your name'; the fixer of v0.0.28's play review,
  // finding 3: the line said "R: Call your serial" for 14 s while R did nothing)
  if (key === 'serials' && !A.check?.you && !A.called) return 'wait for your name';
  const done = { read: A.read, show: R.shown, sign: A.signed, count: A.counted, sign20: A.issued };
  const row = P.rows.find(id => !done[id]) ?? null;
  return row ? `${k('hand')}: ${ARM_ROWS[row]}` : null;
}

/** The GUN card's name (main.js gunShort): "R-7 · 447193" once the serial is read (the number you read: the card's after a missed read). */
export function armouryGunShort(state, short) {
  const A = armOf(state);
  if (!A || !short || !A.read || !A.readAs || gunOn(state, playerId(state)) !== (A.given ?? A.gunId)) return short;
  return `${short} · ${A.readAs}`;
}

/** The spot a splash of the scene's frames (main.js's skip-start): your table while a clean runs there (it takes no spot of its own), else null. */
export function armourySplashSpot(state) {
  const A = armOf(state), act = state?.time?.doing?.activity;
  return A && (act === 'clean-rifle' || act === 'clean-again') ? A.table : null;
}

/** The ring the stage draws (arms/look.js rangeLook's pairs record): the standing command's station while you are not on it, else null. */
export function armouryLook(state) {
  const R = armouryOf(state);
  if (!R || R.end || R.next) return null;
  const def = defOf(R), st = stationOf(state);
  // (the brass is policed where it lies: no ring for it)
  if (!def || !st || def.ready === 'arrived' || def.key === 'police' || lineReady(state, R.cmd.id)) return null;
  // (as its doc says, not while you are on it: at the table it lay over the stripped rifle on the mat in the clean's splash (the fixer of
  // v0.0.28's play review, finding 9))
  if (near(playerActor(state), st)) return null;
  return { turners: [], station: { x: st.x, z: st.z, rM: RING_M } };
}

// ---- the view ----

// (the clock as the card says it: the local hour and minute)
function clockText(state, ms) { const c = dayClock(ms, siteDayOf(state)); return `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}`; }

/**
 * The scene as the hud, the bots and the end card read it (see the header): { stage, cmd (its key), cmdId, cmdI, station, at, ring, rows,
 * acts (the rows not struck), press, issue: { n, handed, counted, fired, back, brass }, gunWords, turnBacks, late, faults, card: { summary,
 * lines }, end, tier }.
 */
export function armouryNow(state, ms = state.clock.ms) {
  const R = armouryOf(state);
  if (!R) return null;
  const A = R.arm, pid = playerId(state), me = playerActor(state), st = stationOf(state), m = armouryRows(state);
  const line = state.armoury.ammoIssues.find(a => a.id === R.issueId) ?? null, g = state.items[gunOn(state, pid)];
  const sheet = TEST_SHEETS[A.tier]?.label ?? A.tier;
  const faults = R.faults.map(f => f.rule);
  const fired = line?.fired ?? 0, back = line?.back ?? 0;
  // (the bench the card names is the decision at the table, the first clean; a re-clean shows in the turn-backs and the lines: the review of v0.0.28 B)
  const clean = A.cleans[0] ?? null;
  const summary = [
    sheet,
    A.signedIn ? `racked at ${clockText(state, R.end?.atMs ?? ms)}` : R.end ? `${R.end.phase}` : 'not racked',
    A.slip ? (A.slipCaught ? 'the slip caught at the window' : A.slipFound ? 'the slip found at the check' : 'the slip') : A.read ? 'serial read back' : 'serial not read',
    line ? `${line.n} issued${A.counted ? ' and counted' : ''}, ${fired} fired, ${back} back, ${R.policed ?? 0} brass` : 'no issue',
    clean ? `${clean.tempo}, ${minOf(clean.ms)} min` : 'not cleaned',
    A.passed ? (A.turnBacks ? `passed after ${countWord(A.turnBacks)} turn-back${A.turnBacks > 1 ? 's' : ''}` : 'passed first time') : 'not inspected',
    A.signedIn ? (A.late ? 'in after ten-thirty' : 'in by ten-thirty') : null,
    // (in words, as the card's line names them: the summary printed the rules' ids, "faults: uprange" (the fixer of v0.0.28's play review, finding 11))
    faults.length ? `faults: ${[...new Set(faults)].map(faultWords).join(', ')}` : 'no faults',
  ].filter(Boolean).join(' · ');
  return {
    stage: A.stage, cmd: keyOf(R), cmdId: R.cmd?.id ?? null, cmdI: R.cmd?.i ?? null, next: R.next ? SEQ_ARMOURY[R.next.i]?.key ?? null : null,
    station: st ? st.station : null, at: !!st && near(me, st), ring: armouryLook(state)?.station ?? null, spot: st ? { x: st.x, z: st.z, face: st.face } : null,
    via: st && !near(me, st) ? walkVia(state, st, me) : null,
    rows: m?.rows ?? [], acts: (m?.rows ?? []).filter(r => !r.struck).map(r => r.id), press: keyOf(R) ? armouryPressOf(state, keyOf(R)) : null,
    doing: A.doing?.id ?? null, busy: !!(A.doing || A.fetch || A.inspecting || A.splash || A.splashOn || A.want || A.cleaning || state.time?.doing),
    issue: line ? { n: line.n, handed: line.handed ?? line.n, counted: !!line.counted, fired, back, brass: R.policed ?? 0, left: brassLeft(state).mine } : null,
    slip: A.slip, short: A.short, read: A.read, readOk: A.readOk, slipFound: A.slipFound, slipCaught: !!A.slipCaught, counted: A.counted, added: A.added,
    gunWords: g ? beliefOf(state, gunOn(state, pid))?.condWord ?? null : null, relay: A.relay, cleans: A.cleans, turnBacks: A.turnBacks, inspections: A.inspections,
    late: A.late, rackByMs: A.rackByMs, passed: A.passed, signedIn: A.signedIn, faults, far: farCases(state), tier: A.tier, end: R.end,
    card: { summary, sheet, lines: cardLines(state, A, line, faults, summary), aspects: cardAspects(state, A, line) },
  };
}

// (the card's lines under its summary: the relay, each clean, each inspection, the faults named (AM§7's words))
const FAULT_WORDS = Object.freeze({ slow: 'the line waited on you', serial: 'the slip signed unread', count: 'a short count signed uncounted', brass: 'brass short at the declaration',
  declare: 'a false declaration', muzzle: 'a muzzle on a man', dirty: 'a dirty rifle taken at the third look', part: 'a part lost at the bench', lost: 'a magazine lost',
  wander: 'fetched back by the squad leader', late: 'in after ten-thirty', nd: 'a negligent discharge' });
const faultWords = (f) => FAULT_WORDS[f] ?? stopWords(f);
function cardLines(state, A, line, faults, summary) {
  const out = [summary];
  // (the far cases "along the line", never "down": the line said them up or down the screen by the keys, the card "down the line" (the
  // fixer of v0.0.28's play review, finding 11))
  if (A.relay) out.push(`The relay: ${A.relay.air}, ${A.relay.fired} fired, ${A.relay.left} left${A.relay.far ? `, ${A.relay.far} case${A.relay.far > 1 ? 's' : ''} thrown ${A.relay.farM} m along the line` : ''}.`);
  for (const c of A.cleans) out.push(`The bench: ${c.tempo}, ${minOf(c.ms)} min${c.grade ? `, ${c.grade}` : ''}${c.fault === 'pin' ? ', the pin lost' : ''}.`);
  // (his verdict in words, no number: "dirt 0.021" read as nothing, and "clean" after a bench that left carbon read as a contradiction, where
  // he passed what his eye did not find (the fixer of v0.0.28's play review, finding 11); a range rule's fault in the range's words
  // (handling.js stopWords): "uprange" had been printed as its id)
  for (const v of A.inspections) out.push(`The armourer: ${v.verdict === 'pass' ? 'passed it' : v.verdict === 'again' ? 'clean it again' : v.verdict === 'pin' ? 'the pin' : v.verdict === 'keep' ? 'kept it' : v.verdict}.`);
  const named = [...new Set(faults)].map(faultWords);
  if (named.length) out.push(`Faults: ${named.join('; ')}.`);
  void state; void line;
  return out;
}
// (the score's three aspects in the day's numbers (scenes.js aspects): the window and the count, the canopy, the armourer's eye)
function cardAspects(state, A, line) {
  const c = A.cleans[0];
  return [
    ['window', `${A.read ? (A.readOk ? 'serial read back' : 'serial read, the roll missed') : 'serial not read'}${A.slip ? (A.slipCaught ? ', the slip caught' : ', the slip found at the check') : ''}; ${line ? `${line.handed ?? line.n} handed${A.counted ? ', counted' : ', not counted'}` : 'no issue'}`],
    ['cleaning', c ? `${c.tempo}, ${minOf(c.ms)} min${A.cleans.length > 1 ? `, ${A.cleans.length} cleans` : ''}${A.signedIn ? (A.late ? ', in after ten-thirty' : ', in by ten-thirty') : ''}` : 'not cleaned'],
    ['inspection', A.passed ? (A.turnBacks ? `passed after ${countWord(A.turnBacks)} turn-back${A.turnBacks > 1 ? 's' : ''}` : 'passed first time') : 'not inspected'],
  ];
}

/** rangeNow's shape on the armoury course (handling.js rangeNow's branch): the end card's summary the scene's line. */
export function armouryRangeNow(state, R, ms = state.clock.ms) {
  const N = armouryNow(state, ms);
  return {
    course: R.course, lane: R.lane ?? null, phase: R.phase, string: 0, cmd: R.cmd?.id ?? null, cmdI: R.cmd?.i ?? null, cmdAtMs: R.cmd?.atMs ?? null, hot: R.hot,
    observerId: R.coachId, roId: R.roId, paper: 'man', line: null, strings: [], end: R.end, armoury: N,
    summary: { text: N.card.summary, faults: R.faults.length, clearAtMs: R.end?.phase === 'clear' ? R.end.atMs : null },
    score: { faults: R.faults.length, clearAtMs: R.end?.phase === 'clear' ? R.end.atMs : null }, dry: false,
  };
}

/** The DI's tempo at the table (the build sheet §0 item 4): the most careful whose clean, one re-clean and two trips fit before ten-thirty; none, rushed. */
export function diTempoOf(state, ms = state.clock.ms) {
  const A = armOf(state), pid = playerId(state), g = A?.given ?? A?.gunId;
  if (!A || !g) return 'normal';
  const left = A.rackByMs - ms;
  for (const t of ['careful', 'normal', 'rushed']) {
    const need = UPKEEP.cleanMs(state, pid, g, t, { again: A.again }) + UPKEEP.cleanMs(state, pid, g, t, { again: true }) + 2 * TRIP_MIN * MIN_MS;
    if (need <= left) return t;
  }
  return 'rushed';
}
/** T's bundles from this rung (the corporal up: rungOf's room family, the test sheet's). */
export const ARM_BUNDLE_RUNG = 2;
export const bundlesOf = (state) => rungOf(state, playerId(state), 'room') >= ARM_BUNDLE_RUNG;
