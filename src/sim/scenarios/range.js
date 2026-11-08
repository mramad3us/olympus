// OLYMPUS scenarios: test-range, "The line at 300 m": the KD range in full, the zero, the confirm, the 200 m string, the relay, the pits and range safety (ROADMAP §4.2's 0.0.7 row; ROADMAP §4.4's moment 3, the line's part; WEAPONS §6.4, §6.6, §10.4, §11; the build sheet 0.0.7 §2.3).
//
// The ground is authored (src/data/places/range.js KD_RANGE.kd, the same in every career); what happens on it is
// procedural, from the world's seed on named streams: the bay lane (stream(seed, 'range:lane', 'kd'), 2 to 5), the
// relay (the player's squad shuffled on stream(seed, 'range:relay'): five on the bay's other lanes, six more in the
// pits), the rifles' zeroes (firearms.js drawZero), the coach's dummy (stream(seed, 'arms:set', 'kd'): which
// magazine by DUMMY_IN's weights, round 2 to 4), the tower's gaps, the wind (wind.js, a closed form), the pits'
// marking rolls (stream('pit', seed, lane, shotId)), the words by hash. Everyone is a generated person: the RO,
// the coach, the corpsman (post melas:kd-corpsman), the pits NCO (melas:kd-pits) and the relay (the user,
// 2026-11-05: "All people generated").
//
// The fill (testRange): the barracks drawn, 10:00, the player prone-to-be on bay lane L facing downrange in
// utilities with the start body and the sheet of their rank, the 'range-kd' issue (the R-7 with drawZero's error,
// the SO-4 at 1x, ear defenders, four magazines of three), the RO on the tower's deck, the coach at your left
// shoulder, the corpsman behind the line, the pits NCO at the pits; the relay of RELAY_N 6 (you and five, each with
// their own issue, on the bay's other lanes, keeping their order: KD lane = KD_LANE_K 6 + bay lane), relay 2 at the
// carriers of lanes 7 to 12; then startRange on the kd course (handling.js, generalised: its tower is
// courses.js SEQ_KD) with the session's KD keys (kdLane, stage, line, paper, groups, pits, call, reads, relay,
// relay2, staff, dummy, strings, brassTiles, policed, declared, casualty, limitAtMs). setups: 'confirm' (zeroed,
// at the 300 m line, the tower at prone), 's200' (at the 200 m line, the dope to dial), 'far' (the bench: the
// 300 m line, prone, 4x, aimed at your face, Fire alone, the relay firing).
//
// The course (SEQ_KD) and its readinesses (kdReady, read by handling.js lineReady with the relay's: relayReady):
//   - **the zero** at 25 m: three-round groups on the zeroing card; at the tower's "read your groups" the coach
//     reads yours (paper.js groupOf, callOf: the clicks from the group's centre to the card's mark), says it
//     ("Your group is low left. Ten up, four left."), and the call waits on the panel (sight:call); "Make your
//     sight corrections" waits for the turrets at the call (dialled); within ZERO_OK_CM 1 cm each axis the
//     coach writes the zero down ("Zeroed. Leave it.": belief.zero the turrets'), else the next group, at most
//     ZERO_GROUPS_MAX 4 (then "Close enough for today": the turrets written down all the same);
//   - UNLOAD, SHOW CLEAR, police your brass (the police-brass activity, kneeling at the point: behind the brief splash over LIVE_MAX_MS 10 s),
//     the unused rounds to the coach (kd:turnIn: the magazines and the rounds in them back, the empties too);
//   - **the walk** to the 300 m line behind the kd-walk splash (an outcome: ~205 m at the walk), its end the relay
//     and the coach at their points facing downrange and the line's issue in the pouches (one magazine of five, the
//     dummy in it if it is the confirm's);
//   - **the confirm** prone at 4x: optics to four power, the dope for 300 (belief.zero + the dope card), the
//     coach's wind call (wind.js readWind as the coach reads it, the hold for it: shot.js holdFor), five rounds
//     slow fire in STRING limitS 300 s, each shot marked by the pits (lived, seen in the far window: the carrier
//     down, the spotter, up, the score disk), the coach's call after the second mark (the believed zero moved by
//     it), CEASE FIRE, unload, police, turn in;
//   - **the pits** behind the kd-pits splash (PITS_MIN 20): relay 2's confirm rolled by gunner.js skipString, their
//     scores in the strip; the walk to the 200 m line inside it, the line's issue (two magazines of five);
//   - **the 200 m string**: the dope, sitting, LOAD, MAKE READY, ten rounds rapid in 60 s with the magazine change
//     inside the string (courses.js KD_STRINGS.s200 mags 2: the one written exception to one magazine a string),
//     the targets marked together after CEASE FIRE (RAPID_MARK_S); the time's limit is the tower's CEASE FIRE;
//   - **the declaration**: kd:declare, "No brass, no ammo": the brass policed against the rounds fired and the
//     rounds held against none; false, a fault and the coach makes it right (never a dead end); the end card.
// The coach's dummy (WEAPONS §11.3) rides in the confirm's magazine or one of the 200 m's: a click, cleared by its
// steps (handling.js's set stoppage: IMMEDIATE ACTION), the coach's word after.
//
// The pits (onPitEvent, the queue's 'pit' events, prio 3, src 'arms:pits'; WEAPONS §11.5 with this round's cut):
// a shot at a face posts, at its flight time + PIT_REACT_S, the carrier going down (CARRIER_S), the hole found by
// the puller (relay 2's marine on that carrier, else the pits NCO: Awareness against MARK_DC, +3 in the black, +2
// with another hole within 5 cm; the grade sets MARK_S), the spotter in it, the carrier up, the score disk on its
// pole for DISK_S (a miss: the red flag, FLAG_S); a rapid string's faces are marked together after CEASE FIRE.
// Marks are true this round. pitView gives each lane's { up 0..1, phase, spotter, disk, flagUntilMs, holes }, up
// moving over CARRIER_S (never a pop).
//
// Range safety in full (safety(), the rules layer after handling.js rangeRules, which keeps v0.0.5's verdicts on
// the line's own box: tradecraft's scenarios/range.js safety() as carry.js rangeSafety ported it): the cold line
// (the rifle in hand off safe or the finger in, the tower's line cold: a warning; a round on it: v0.0.5's warning
// then stop), forward of the line while hot (anyone past the firing line's front while hot: the stop, "Cease fire!
// Get back behind the line!"; the pits behind the parapet never count), the muzzle over people (flagging a
// neighbour or the coach: a warning; aimed at one: v0.0.5's stop), cease fire (the tower's; any shooter's on an
// ND: every rifle on safe), the ND's rule: an ND that hits nobody stops you as v0.0.5's did (the card); one that
// hits someone (ND-4, ND-5 a death: penetrate.js traceRound's hits, BODY's wounds.js applyHit) is the casualty on
// the line: the RO's CEASE FIRE, the relay on safe, the coach takes the shooter's rifle, the corpsman runs to the
// casualty, works CARE_EDGE_S beside them (careOf), the kd-casualty splash (EVAC_MIN) decides the outcome
// (casualtyOutcome), "The range is closed.", and the course goes on to UNLOAD, SHOW CLEAR, the declaration and the
// card with the incident; the player as the casualty is carried to the card through the splash.
// forceNd(state, bus, { pid, gunId, toward }) is the tests' and the debug handle's ND, graded and answered as any.
// kdNow(state, ms) is the hud's and the bots' view (its zeroing: the rifle being zeroed, shot.js zeroingOf, for the weapon
// card's dial); its summary the end card's ("Clear at 10:31 · zero in 2 groups ·
// 300 m 21 of 25 · 200 m 44 of 50 · 2 V · no faults"). The waits never dead-end: v0.0.6's coach's check and
// move-on hold on every command (handling.js rangeSecond), and the move-on here does what a command left
// undone (kdMoveOn: the coach polices, takes the rounds, declares for you, each a fault). Its nudge and its 60 s
// count the line's wait on you alone (kdWaitOnYou: never the relay's, a timed string's, a splash's or a casualty's;
// 0.0.7's tower fixer), and the walks' are the tower's own, passed over with no fault.
import { TICK_MS } from '../../core/clock.js';
import { stream, intIn, weighted, int, range as rnd, d20 } from '../../core/rng.js';
import { hashPick } from '../../core/hash.js';
import { nextId, playerActor, playerId } from '../../core/ids.js';
import { post, cancel } from '../../core/queue.js';
import { SCENES } from '../../data/scenes.js';
import { COURSES, SEQ_KD, KD_STRINGS, KD_COACH, KD_RO } from '../../data/courses.js';
import { KD_RANGE, kdLaneOf } from '../../data/places/range.js';
import { logEntry } from '../log.js';
import { lonOfSite } from '../places/env.js';
import { marsClock } from '../time/dates.js';
import { placeGaits } from '../body/motion.js';
import { setOutfit, syncActors } from '../people/place.js';
import { drawStaff, setPost, staffName } from '../people/staff.js';
import { startBody } from '../body/body.js';
import { deltaOf } from '../body/record.js';
import { rollSheet, tierOfRank } from '../skills/templates.js';
import { rollerOf } from '../combat/roll.js';
import { grade } from '../skills/checks.js';
import { barracks } from './barracks.js';
import { setLedgers } from './tests.js';
import { rangeOf, sayOn, laneOf, drawLane, startRange, endRange, fault, stopRange, roundsLeft, seqOf, lineReady, WARN_AGAIN_MS, stopWords } from './handling.js';
import { materialise, move, pouchesOf, discard, containersOf, atFeetOf, lyingOf } from '../arms/kit.js';
import { newMag, drawZero, beliefOf, sightOf, beliefZero, gunField, feed } from '../arms/firearms.js';
import { leaveStop, enterStop, gunOn } from '../arms/shooting.js';
import { poiOf, holdFor, holdSaid, zeroingOf } from '../arms/shot.js';
import { readWind, COACH_MRK_MIN } from '../arms/wind.js';
import { DOPE_CARD } from '../arms/ballistics.js';
import { groupOf, poolOf, callOf, PAPERS, scoreOf } from '../arms/paper.js';
import { muzzleOf, SLUNG, gradeNd, angleDiff } from '../arms/carry.js';
import { traceRound } from '../arms/penetrate.js';
import { applyHit, careOf, casualtyOutcome, casualtyLine, hitWhere, gradeOfHits, bloodAt } from '../body/wounds.js';
import { newGunner, gunnerStep, relayReady, relayCease, skipString, relayScores } from '../arms/gunner.js';
import { settle, police, brassLeft, brassNear, POLICE_M, POLICE_CASE_S } from '../arms/brass.js';
import { startActivity } from '../time/activities.js';
import { pitView, CARRIER_S } from '../arms/pits.js';

export { CARRIER_S };

/** Where the scene plays. */
export const RANGE = Object.freeze({ site: SCENES['test-range'].host.site, area: KD_RANGE.area, course: 'kd' });
/** The relay (you and five), relay 2 (six more, in the pits), a KD lane from a bay lane (the build sheet §8 item 10). */
export const RELAY_N = 6, RELAY2_N = 6, KD_LANE_K = 6;
/** Groups at most before the zero is written down as it stands; a group's centre this close to the mark, each axis, is zeroed (cm). */
export const ZERO_GROUPS_MAX = 4, ZERO_OK_CM = 1.0;
/** The pits (W §11.5, my calls on the times): the reaction (s), the carrier's travel (s), the marking's DC and its times by grade (s), the disk and the flag (s), a rapid string's marking (s). */
export const PIT_REACT_S = Object.freeze([0.8, 2.0]), MARK_DC = 6, MARK_BLACK = 3, MARK_NEAR = 2, MARK_NEAR_CM = 5;
export const MARK_S = Object.freeze({ superb: 2, good: 3, pass: 4, fail: 6 }), DISK_S = 4, FLAG_S = 3, RAPID_MARK_S = 12;
/** The pits' outcome (min), the casualty's edge (s) and its evacuation (min). The walk between lines is BODY's walk at the place's gravity (motion.js placeGaits: the splash's length). */
export const PITS_MIN = 20, CARE_EDGE_S = 20, EVAC_MIN = 12;
/** The coach's call on the confirm comes after this many marked hits of yours (the sheet's §6 item 4: "after two marks"; a miss tells him nothing of the zero). */
export const CONFIRM_CALL_AFTER = 2;
/** The pits NCO's post in the trench (m). */
export const PITS_NCO_AT = Object.freeze({ x: 1607, z: 301.5, y: -2.5, face: 'left' });
/** The cold line's grace after a command before a rifle off safe is a fault (ms): the shooter answering CEASE FIRE. */
export const COLD_GRACE_MS = 6_000;
/** The corpsman's place behind a line (6 m behind it, at its north end; behind the bay's line on the 25 m). */
export const corpsmanAt = (line) => (line === 25 ? { x: 1090, z: 282.5, face: 'right' } : { x: KD_RANGE.kd.lines[line].x - 6, z: 304, face: 'right' });

const lonOf = () => lonOfSite(RANGE.site);
const actorOf = (state, pid) => (pid === playerId(state) ? playerActor(state) : state.actors?.list?.find(a => a.who === pid) ?? null);
const fill = (lines, map) => lines.map(l => Object.entries(map).reduce((t, [k, v]) => t.replaceAll(`{${k}}`, String(v)), l));
const capital = (w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w);
const coachSay = (state, bus, lines, ...key) => { const R = rangeOf(state); if (R) sayOn(state, bus, { who: R.coachId, text: hashPick(lines, 'kd-coach', state.meta.seed, ...key), kind: 'speech' }); };
const roSay = (state, bus, lines, ...key) => { const R = rangeOf(state); if (R) sayOn(state, bus, { who: R.roId, text: hashPick(lines, 'kd-ro', state.meta.seed, ...key), kind: 'pa' }); };
const isKd = (state) => rangeOf(state)?.course === 'kd';

// ---- where things are ----

/** The player's KD lane (6 + their bay lane). */
export const kdLane = (state) => KD_LANE_K + (rangeOf(state)?.lane ?? 0);
/** The line whose box holds a person: 200 | 300 | 500 | 25 | null. */
export function kdLineOf(state, pid = playerId(state)) {
  const a = actorOf(state, pid);
  if (!a) return null;
  const inBox = (b) => a.x >= b[0] && a.x <= b[2] && a.z >= b[1] && a.z <= b[3];
  if (KD_RANGE.bay.lanes.some(L => inBox(L.box))) return 25;
  for (const L of KD_RANGE.kd.lanes) for (const d of [200, 300, 500]) if (inBox(L.points[d].box)) return d;
  return null;
}
/** The player's point on the session's line now: { line, lane, fp, box, coach, face? } (the bay's lane at 25 m, the KD lane past it). */
export function kdPoint(state) {
  const R = rangeOf(state);
  if (!R) return null;
  if ((R.line ?? 25) === 25) { const L = laneOf(R.lane); return { line: 25, lane: R.lane, fp: L.fp, box: L.box, coach: L.coach, target: L.target }; }
  const L = kdLaneOf(R.kdLane), P = L.points[R.line];
  return { line: R.line, lane: R.kdLane, fp: P.fp, box: P.box, coach: P.coach, face: L.face };
}
/** A gunner's or the player's point on a line: { fp, box, coach }. */
const pointOn = (line, bayLane) => (line === 25 ? laneOf(bayLane) : kdLaneOf(KD_LANE_K + bayLane).points[line]);

// ---- the fill ----

/** The dummy drawn for the course: { stage: 'confirm' | 's200-1' | 's200-2', round (2 to 4) }. */
export function drawDummy(seed) {
  const C = COURSES.kd, r = stream(seed, 'arms:set', 'kd');
  return { stage: weighted(r, C.dummyIn), round: intIn(r, C.dummyRound[0], C.dummyRound[1]) };
}
/** The relay drawn from the player's squad (see the header): { relay: [pid ×5], relay2: [pid ×6] }. */
export function drawRelay(state) {
  const me = playerId(state), unit = state.people[me]?.service?.unitId, billets = unit ? Object.values(state.units?.[unit]?.billets ?? {}) : [];
  const pool = billets.filter(p => p && p !== me && state.people[p]).sort();
  const r = stream(state.meta.seed, 'range:relay');
  for (let i = pool.length - 1; i > 0; i--) { const j = int(r, i + 1); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return { relay: pool.slice(0, RELAY_N - 1), relay2: pool.slice(RELAY_N - 1, RELAY_N - 1 + RELAY2_N) };
}

// (a rifle's zero as the armoury hands it out: off the turrets' 0 by drawZero, never shown)
const zeroRifle = (state, gunId) => { const g = state.items[gunId], z = drawZero(state.meta.seed, gunId); if (z.elev || z.wind) g.zero = z; };

/** The fill of 'test-range' (see the header). setup: null | 'confirm' | 's200' | 'far'. */
export function testRange(state, { at = null, setup = null } = {}) {
  const scene = SCENES['test-range'], seed = state.meta.seed, lon = lonOf();
  const lane = drawLane(seed, 'kd'), L = laneOf(lane);
  barracks(state, { at: { area: KD_RANGE.area, x: L.fp.x, z: L.fp.z, face: 'right', ...(at ?? {}) } });
  const me = playerActor(state), pid = playerId(state), person = state.people[pid];
  setOutfit(me, scene.outfit);
  person.body = deltaOf(setLedgers(startBody(person, state.clock.ms, lon, seed), scene.body ?? {}));
  person.skills = rollSheet(seed, pid, tierOfRank(person.service?.rank));
  const kit = materialise(state, pid, 'range-kd');
  zeroRifle(state, kit.gunId);
  const roId = drawStaff(state, 'melas:kd-ro'), coachId = drawStaff(state, 'melas:kd-coach');
  const corpsmanId = drawStaff(state, 'melas:kd-corpsman'), pitsId = drawStaff(state, 'melas:kd-pits');
  const T = KD_RANGE.tower;
  setPost(state, roId, { area: KD_RANGE.area, x: T.ro.x, z: T.ro.z, y: T.deckY, face: T.ro.face });
  setPost(state, coachId, { area: KD_RANGE.area, x: L.coach.x, z: L.coach.z, face: L.coach.face });
  setPost(state, corpsmanId, { area: KD_RANGE.area, ...corpsmanAt(25) });
  setPost(state, pitsId, { area: KD_RANGE.area, ...PITS_NCO_AT });
  // (the relay: five on the bay's other lanes in order, six in the pits at the carriers of lanes 7 to 12)
  const { relay, relay2 } = drawRelay(state), others = KD_RANGE.bay.lanes.map(l => l.lane).filter(n => n !== lane);
  const kits = {};
  relay.forEach((gp, k) => {
    const b = others[k], P = laneOf(b);
    kits[gp] = { bay: b, ...materialise(state, gp, 'range-kd') };
    zeroRifle(state, kits[gp].gunId);
    setPost(state, gp, { area: KD_RANGE.area, x: P.fp.x, z: P.fp.z, face: 'right', outfit: 'utilities' });
  });
  relay2.forEach((gp, k) => {
    const Lk = kdLaneOf(KD_LANE_K + 1 + k);
    setPost(state, gp, { area: KD_RANGE.area, x: Lk.puller.x, z: Lk.puller.z, y: KD_RANGE.kd.pits.floorY, face: Lk.puller.face, outfit: 'utilities' });
  });
  syncActors(state);
  const R = startRange(state, null, { course: 'kd', lane, setup: null, kit, set: null, roId, coachId });
  state.armoury.ammoIssues.at(-1).line = 25;
  Object.assign(R, {
    kdLane: KD_LANE_K + lane, stage: 'zero', line: 25, paper: 'zero25', groups: [], pits: {}, call: null, reads: {}, relay: [], relay2,
    staff: { ro: roId, coach: coachId, corpsman: corpsmanId, pits: pitsId }, dummy: { ...drawDummy(seed), magId: null, cleared: false },
    strings: [], brassTiles: {}, policed: 0, declared: null, casualty: null, limitAtMs: null, zeroed: false, who: pid,
  });
  for (const gp of relay) newGunner(state, { pid: gp, lane: KD_LANE_K + kits[gp].bay, bay: kits[gp].bay, gunId: kits[gp].gunId, magIds: kits[gp].magIds });
  if (setup) setupJump(state, setup);
  return state;
}

// (the setups: the course entered part-way (see the header))
function setupJump(state, setup) {
  const R = rangeOf(state), pid = playerId(state), gun = state.items[gunOn(state, pid)], seq = SEQ_KD, now = state.clock.ms;
  // (the zero done: the turrets on the rifle's zero, the coach's card)
  const zeroAll = () => { for (const p of [pid, ...R.relay.map(G => G.pid)]) { const g = state.items[gunOn(state, p)], z = g.zero ?? { elev: 0, wind: 0 }; g.sight = { ...z }; g.belief = { ...(g.belief ?? {}), zero: { ...z } }; } R.zeroed = true; };
  zeroAll();
  turnIn(state, pid);
  turnInAll(state);
  R.turnedIn = 0;
  const line = setup === 's200' ? 200 : 300;
  arriveAt(state, null, line);
  const i = setup === 's200' ? seq.findIndex(c => c.id === 'dope' && c.stage === 's200') : seq.findIndex(c => c.id === 'prone' && c.stage === 'confirm');
  R.cmd = { id: seq[i - 1].id, i: i - 1, atMs: now };
  if (setup === 'far') {
    // (the bench's: prone at 4x on the 300 m line, the dope set, a magazine in and a round up, off safe, aimed at your face,
    // Fire alone; the relay prone beside you with a long string each (two magazines of fifteen))
    cancel(state, 'arms:range');
    const me = playerActor(state), z = beliefZero(gun), dope = DOPE_CARD.r7?.[300]?.elev ?? 0;
    me.stance = 'prone'; me.headRad = 0; me.face = 'right';
    gun.optic = 4; gun.sight = { elev: z.elev + dope, wind: z.wind };
    const magId = pouchesOf(state, pid).flatMap(p => p.mags)[0];
    move(state, magId, { gun: gun.id ?? gunOn(state, pid) });
    feed(gun, state.items[magId]);
    gun.belief = { ...(gun.belief ?? {}), chamber: 'live', count: state.items[magId].n };
    gun.mode = 'semi';
    for (const G of R.relay) {
      const a = actorOf(state, G.pid), g = state.items[G.gunId], gz = beliefZero(g);
      if (a) a.stance = 'prone';
      g.optic = 4; g.sight = { elev: gz.elev + dope, wind: gz.wind };
      for (const id of G.magIds) discard(state, id);
      G.magIds = [issueMag(state, G.pid, 15), issueMag(state, G.pid, 15)];
      G.i = -1;
    }
    const fi = seq.findIndex(c => c.id === 'fire' && c.string === 'confirm');
    R.cmd = { id: 'fire', i: fi, atMs: now }; R.next = null; R.hot = true; R.phase = 'string'; R.string = 'confirm'; R.strMag = magId; R.strSeats = 1;
    R.strings.push({ id: 'confirm', line: 300, paper: 'kdA', shots: [] });
    R.limitAtMs = now + (KD_STRINGS.confirm.limitS ?? 300) * 1000;
    enterStop(state, null, { pid, gunId: gunOn(state, pid), via: 'shoot' });
    const own = `face:${R.kdLane}`;
    state.stop.pick = own; state.stop.aim = { key: own, settledMs: now };
    state.people[pid].kit.carry.posture = 'aimed';
    return;
  }
  // (the brief's post replaced by this command's)
  cancel(state, 'arms:range');
  post(state, { atMs: now, prio: 2, kind: 'range-cmd', src: 'arms:range', payload: { cmd: seq[i].id, i } });
  R.next = { id: seq[i].id, i, atMs: Math.floor(now / 1000) * 1000 };
}

// ---- the issue at a line ----

// (a magazine of n rounds into the person's first magazine pouch with room (the empties went back at the turn-in))
function issueMag(state, pid, n, set = null) {
  const id = newMag(state, { fam: 'had30', n, load: 'ball', set, told: true });
  const room = pouchesOf(state, pid).find(p => !p.dump && p.room > 0) ?? pouchesOf(state, pid).find(p => p.room > 0);
  if (room) move(state, id, { container: room.id });
  return id;
}

/** The line's issue to the player and the relay (w): the rounds of the stage's string, the dummy where it rides. */
function issueLine(state, bus, line) {
  const R = rangeOf(state), pid = playerId(state), S = line === 300 ? KD_STRINGS.confirm : KD_STRINGS.s200, now = state.clock.ms;
  const per = S.rounds / S.mags, ids = [];
  for (let k = 0; k < S.mags; k++) {
    const stage = line === 300 ? 'confirm' : `s200-${k + 1}`;
    const set = R.dummy.stage === stage ? { n: per - R.dummy.round + 1, kind: 'dud' } : null;
    ids.push(issueMag(state, pid, per, set));
    if (set) R.dummy.magId = ids.at(-1);
  }
  // (the coach's dummy rides in place of a round of ball: the issue counts the ball, the dummy apart as the coach's,
  // so fired + back balance at the count back (the code review's of v0.0.7: n 10, fired 9, back 0))
  const dud = ids.some(id => state.items[id]?.set?.kind === 'dud') ? 1 : 0;
  const issueId = nextId(state, 'ai');
  state.armoury.ammoIssues.push({ id: issueId, atMs: now, area: KD_RANGE.area, toId: pid, cal: '6.5x40r', load: 'ball', n: S.rounds - dud, fired: 0, line, ...(dud ? { dummy: 1 } : {}) });
  R.issueId = issueId;
  for (const G of R.relay) { G.magIds = Array.from({ length: S.mags }, () => issueMag(state, G.pid, per)); G.seats = 0; }
  return ids;
}

/** The rounds handed back to the coach (w): every magazine on you emptied and taken, the loose ones picked up; the issue's back. Returns the count. */
function turnIn(state, pid = playerId(state)) {
  const R = rangeOf(state);
  const gun = state.items[gunOn(state, pid)];
  // (the coach's dummy still on you goes back as his, not as a round of the issue)
  let n = roundsLeft(state, pid) + (R?.picked ?? 0) - dudsOn(state, pid);
  if (gun && gunField(gun, 'chamber') === 'live') delete gun.chamber;
  for (const c of containersOf(state, pid)) for (const id of [...(state.items[c].holds ?? [])]) if (state.items[id]?.type === 'mag') discard(state, id);
  if (gun?.mag) discard(state, gun.mag);
  // (the magazines at your feet, a speed reload's empties, go back with the rest)
  for (const l of atFeetOf(state, pid)) if (state.items[l.id]?.type === 'mag') discard(state, l.id);
  // (the coach's dummy rode on a magazine handed back: its record keeps where it was, not the magazine's id)
  if (R?.dummy?.magId && !state.items[R.dummy.magId]) R.dummy.magId = null;
  if (R) { delete R.picked; const issue = state.armoury.ammoIssues.find(a => a.id === R.issueId); if (issue) issue.back = (issue.back ?? 0) + n; R.turnedIn = (R.turnedIn ?? 0) + n; }
  return n;
}
// (the coach's dummy on a person: in a magazine not yet fed, or chambered (firearms.js feed: the chamber 'live', its set 'dud'))
function dudsOn(state, pid) {
  const gun = state.items[gunOn(state, pid)];
  let n = gun && gunField(gun, 'chamber') === 'live' && gunField(gun, 'set') === 'dud' ? 1 : 0;
  const mags = [gun?.mag, ...containersOf(state, pid).flatMap(c => state.items[c].holds ?? []), ...atFeetOf(state, pid).map(l => l.id)];
  for (const id of new Set(mags.filter(Boolean))) { const m = state.items[id]; if (m?.type === 'mag' && m.set?.kind === 'dud' && m.set.n <= (m.n ?? 0)) n++; }
  return n;
}
// (the relay's too, at once: they hand theirs over as you do)
function turnInAll(state) {
  const R = rangeOf(state);
  for (const G of R.relay ?? []) {
    for (const c of containersOf(state, G.pid)) for (const id of [...(state.items[c].holds ?? [])]) if (state.items[id]?.type === 'mag') discard(state, id);
    const g = state.items[G.gunId], a = actorOf(state, G.pid);
    if (g?.mag) discard(state, g.mag);
    if (a) for (const l of lyingOf(state, KD_RANGE.area)) if (state.items[l.id]?.type === 'mag' && Math.hypot(l.x - a.x, l.z - a.z) <= 2.5) discard(state, l.id);
    G.magIds = [];
  }
}

/**
 * Everyone at a line (w; a splash's end, a setup): the player at their point on the line facing downrange, the
 * coach at their shoulder, the relay at theirs, standing, rifles slung; the line's issue given. Returns the line.
 */
function arriveAt(state, bus, line) {
  const R = rangeOf(state), pid = playerId(state), me = playerActor(state), P = pointOn(line, R.lane);
  me.x = P.fp.x; me.z = P.fp.z; me.face = 'right'; delete me.stance; delete me.headRad;
  me.$px = me.x; me.$pz = me.z;
  const carry = state.people[pid]?.kit?.carry;
  if (carry) { carry.posture = 'slungFront'; delete carry.finger; delete carry.near; }
  setPost(state, R.coachId, { area: KD_RANGE.area, x: P.coach.x, z: P.coach.z, face: P.coach.face });
  // (the corpsman follows the relay, behind the line's north end)
  const cp = corpsmanAt(line), ca = actorOf(state, R.staff?.corpsman);
  if (R.staff?.corpsman) setPost(state, R.staff.corpsman, { area: KD_RANGE.area, ...cp });
  if (ca) { ca.x = cp.x; ca.z = cp.z; ca.face = cp.face; ca.$px = ca.x; ca.$pz = ca.z; }
  for (const G of R.relay) {
    const Q = pointOn(line, G.bay), a = actorOf(state, G.pid);
    setPost(state, G.pid, { area: KD_RANGE.area, x: Q.fp.x, z: Q.fp.z, face: 'right', outfit: 'utilities' });
    if (a) { a.x = Q.fp.x; a.z = Q.fp.z; a.face = 'right'; delete a.stance; delete a.headRad; a.$px = a.x; a.$pz = a.z; }
    const k = state.people[G.pid]?.kit?.carry;
    if (k) { k.posture = 'slungFront'; delete k.finger; delete k.near; }
    G.q = []; G.sub = null; G.untilMs = state.clock.ms;
  }
  const c = actorOf(state, R.coachId);
  if (c) { c.x = P.coach.x; c.z = P.coach.z; c.face = P.coach.face; c.$px = c.x; c.$pz = c.z; }
  R.line = line; R.paper = 'kdA'; R.stage = line === 300 ? 'confirm' : 's200';
  // (a call not dialled at the last line is the last line's: the new line's coach calls afresh)
  R.call = null; delete R.groupRead; delete R.dry;
  // (and the reads of the flags at the last line: a read is of a wind across this line's path, read here (the code
  // review's of v0.0.7: the 300 m read stood as the plaque's "your read" at the 200 m line))
  R.reads = {};
  if (line !== 25) issueLine(state, bus, line);
  return line;
}

// ---- the tower's commands on the kd course ----

// (the zero's loop: after the dial, the unload once zeroed or at the last group, else the next group's reload)
/** The index of the command after i on the kd course (handling.js rangeSecond and moveOn read it), or null at the end. */
export function kdNextI(state, i) {
  const R = rangeOf(state), seq = SEQ_KD, def = seq[i];
  if (!def || i + 1 >= seq.length) return null;
  if (R.closed && def.id !== 'clear' && seq.findIndex((c, k) => k > i && c.id === 'clear' && c.stage === 's200') > i) return R.closedNext ?? null;
  if (def.next === 'zeroLoop') {
    const left = roundsLeft(state);
    return R.zeroed || (R.groups?.length ?? 0) >= ZERO_GROUPS_MAX || left < 1 ? seq.findIndex((c, k) => k > i && c.id === 'clear') : i + 1;
  }
  if (def.next === 'fire') return seq.findIndex(c => c.id === 'fire' && c.stage === 'zero');
  return i + 1;
}

/** A command said on the kd course (handling.js onRangeCmd, after the tower's words and the phase): what the scene does at it. */
export function kdOnCmd(state, bus, def, i) {
  const R = rangeOf(state), now = state.clock.ms;
  if (def.stage && def.stage !== 'end') R.stage = def.stage;
  switch (def.id) {
    case 'brief': coachSay(state, bus, KD_COACH.brief, 'brief'); break;
    case 'fire': {
      const S = KD_STRINGS[def.string];
      R.strings.push({ id: def.string, line: S.line, paper: S.paper, shots: [], holes: [] });
      R.strSeats = 1;
      R.limitAtMs = S.limitS ? now + S.limitS * 1000 : null;
      if (def.string === 'zero') R.groups.push({ shots: [], holes: [], centreCm: null, call: null, ok: false });
      if (def.string !== 'zero') coachWind(state, bus, 'fire');
      break;
    }
    case 'cease': {
      R.limitAtMs = null;
      const S = KD_STRINGS[def.string];
      if (S?.marked === 'after') markTogether(state, bus, def.string);
      break;
    }
    case 'group': readGroup(state, bus); break;
    case 'clear': {
      R.shown = false;
      // (the zero's end: the coach writes the turrets down as the zero, zeroed or not, to be confirmed at 300)
      if (def.stage === 'zero') { const gun = state.items[gunOn(state, playerId(state))]; if (gun) gun.belief = { ...(gun.belief ?? {}), zero: sightOf(gun) }; }
      break;
    }
    case 'police': R.policeAt = null; break;
    case 'turnIn': coachSay(state, bus, KD_COACH.turnIn, 'turnIn', i); break;
    case 'walk': case 'pits': {
      leaveStop(state, bus, 'scene');
      const me = playerActor(state), P = pointOn(def.line, R.lane), dist = me ? Math.hypot(P.fp.x - me.x, P.fp.z - me.z) : 0;
      const ms = def.id === 'pits' ? PITS_MIN * 60_000 : Math.max(60_000, Math.round(dist / placeGaits(state).walkMs / 1) * 1000);
      R.splash = { id: def.id === 'pits' ? 'kd-pits' : 'kd-walk', ms, line: def.line, i };
      break;
    }
    case 'dope': {
      const clicks = DOPE_CARD.r7?.[def.line]?.elev ?? 0;
      coachSay(state, bus, fill(KD_COACH.dope, { line: def.line === 300 ? 'three hundred' : 'two hundred', clicks: clickPhrase({ elev: clicks, wind: 0 }) }), 'dope', def.line);
      coachWind(state, bus, 'dope');
      break;
    }
    case 'declare': coachSay(state, bus, KD_COACH.declare, 'declare'); break;
    case 'end': break;
    default: break;
  }
}

// (clicks in the coach's words: '3 down', '10 up, 4 left')
const clickPhrase = ({ elev = 0, wind = 0 }) => [elev ? `${Math.abs(elev)} ${elev > 0 ? 'up' : 'down'}` : null, wind ? `${Math.abs(wind)} ${wind > 0 ? 'right' : 'left'}` : null].filter(Boolean).join(', ') || 'nothing';

/** The coach reads the wind for you (wind.js readWind as he reads it) and gives the hold: R.call's crossMs and holdMil, said. */
function coachWind(state, bus, why) {
  const R = rangeOf(state), pid = playerId(state), me = playerActor(state), P = kdPoint(state), gunId = gunOn(state, pid);
  if (!P?.face || !me) return null;
  const now = state.clock.ms, dM = P.face.x - me.x;
  const w = readWind(state, R.coachId, { atMs: now, bearingRad: 0, coach: true, rangeM: dM, from: { x: me.x, z: me.z }, mrkMin: COACH_MRK_MIN });
  const target = { key: `face:${P.lane}`, kind: 'paper', paper: 'kdA', x: P.face.x, z: P.face.z, dM, lane: P.lane, line: R.line };
  const poi = poiOf(state, pid, gunId, target, { belief: true, hold: null, crossMs: w.crossMs });
  const h = holdFor({ windCm: poi.terms.find(t => t.key === 'wind')?.windCm ?? 0, elevCm: 0 }, dM);
  const keep = R.call?.clicks && !R.call.dialled ? { clicks: R.call.clicks, want: R.call.want } : {};
  R.call = { ...keep, crossMs: w.crossMs, band: w.band, holdMil: [h.xMil, h.yMil], atMs: now, for: pid };
  const n = Math.round(Math.abs(w.crossMs));
  if (Math.abs(w.crossMs) < 0.5) coachSay(state, bus, KD_COACH[w.flags === 'limp' ? 'still' : w.flags] ?? KD_COACH.still, 'still', why, R.line);
  else coachSay(state, bus, fill(KD_COACH.wind, { from: w.crossMs > 0 ? 'left' : 'right', speed: `${n} ${n === 1 ? 'metre' : 'metres'} a second`, hold: holdSaid(h).replace(/ (left|right)$/, ''), side: h.xMil > 0 ? 'right' : h.xMil < 0 ? 'left' : '' }).map(s => s.replace(/ \.$/, '.').replace(/  +/g, ' ')), 'wind', why, R.line);
  bus?.emit('range', { phase: 'call', cmd: R.cmd?.id ?? null, hot: R.hot, rule: null, kind: null, text: null, line: R.line, call: { crossMs: w.crossMs, holdMil: [h.xMil, h.yMil], clicks: R.call.clicks ?? null } });
  return R.call;
}

/** The coach reads the group just fired on the zero card (see the header). */
function readGroup(state, bus) {
  const R = rangeOf(state), pid = playerId(state), gun = state.items[gunOn(state, pid)], g = R.groups.at(-1);
  R.groupRead = R.cmd?.i ?? true;
  if (!g) return;
  const holes = (g.holes ?? []).map(h => ({ at: h.at }));
  // (the coach reads every group since the first as one, each hole moved by the clicks dialled since (paper.js poolOf):
  // a three-round group alone wanders 1.5 to 4 cm at 25 m, several clicks; pooled, nine rifles in ten zero in four groups)
  const pooled = poolOf(R.groups.flatMap(x => x.holes ?? []), sightOf(gun), 25);
  const own = groupOf(holes), grp = own.centreCm && pooled.centreCm ? { ...own, centreCm: pooled.centreCm } : own, mark = PAPERS.zero25?.markCm ?? [0, 0];
  g.shots = (g.holes ?? []).map(h => h.id);
  if (!grp.centreCm) {
    g.call = null; g.ok = false;
    coachSay(state, bus, ['Nothing on the card. Settle, and fire your next group.', 'I see no holes. Breathe, press, and again.'], 'nothing', R.groups.length);
    R.call = null;
  } else {
    const call = callOf('zero25', grp.centreCm, 25), ok = Math.abs(grp.centreCm[0] - mark[0]) <= ZERO_OK_CM && Math.abs(grp.centreCm[1] - mark[1]) <= ZERO_OK_CM;
    g.centreCm = own.centreCm; g.poolCm = grp.centreCm; g.call = ok ? null : { elev: call.elev, wind: call.wind }; g.ok = ok;
    const where = ['high', 'low'][grp.centreCm[1] > mark[1] ? 1 : 0] + (grp.centreCm[0] > mark[0] + ZERO_OK_CM ? ' right' : grp.centreCm[0] < mark[0] - ZERO_OK_CM ? ' left' : '');
    if (ok) {
      R.zeroed = true; R.call = null;
      gun.belief = { ...(gun.belief ?? {}), zero: sightOf(gun) };
      coachSay(state, bus, KD_COACH.zeroed, 'zeroed');
    } else {
      // (the call rides on the group (shooting.js pendingCall offers it as sight:call and marks it dialled), the turrets wanted beside it)
      const s = sightOf(gun);
      g.want = { elev: s.elev + call.elev, wind: s.wind + call.wind };
      R.call = null;
      coachSay(state, bus, fill(KD_COACH.group, { where, Call: capital(clickPhrase(call)) }), 'group', R.groups.length);
      // (the last group: the turrets at the call written down, confirmed at 300)
      if (R.groups.length >= ZERO_GROUPS_MAX) coachSay(state, bus, KD_COACH.notZeroed, 'notZeroed');
    }
  }
  bus?.emit('range', { phase: 'group', cmd: R.cmd?.id ?? null, hot: false, rule: null, kind: null, text: null, line: 25, group: { centreCm: grp.centreCm, call: g.call } });
  if (R.zeroed) bus?.emit('range', { phase: 'zeroed', cmd: R.cmd?.id ?? null, hot: false, rule: null, kind: null, text: null, line: 25 });
}

/** A string's end on the kd course (handling.js at CEASE FIRE): the string's fact, the coach's word on it. */
export function kdStringEnd(state, bus, key) {
  const R = rangeOf(state), mine = (R.strings.at(-1)?.holes ?? []).map(h => ({ hole: h.at, score: h.score, v: h.v }));
  const s = scoreOf(mine.map(x => ({ at: x.hole, score: x.score, v: x.v })));
  delete R.strMag;
  bus?.emit('range', { phase: 'string', cmd: 'cease', hot: false, n: R.strings.length, score: s.score, of: s.of, v: s.v, hits: s.hits, shots: s.shots, line: KD_STRINGS[key]?.line ?? null,
    list: mine.map(x => ({ score: x.score ?? 0, v: !!x.v, hit: !!x.hole })) });
  // (not while a casualty holds the line: the string's bookkeeping can wait (the runtime review's of v0.0.7))
  if (!mine.length && !R.casualty) coachSay(state, bus, ['That string goes down as not fired.', 'Not fired. It counts for nothing on the card.'], 'kd-string', key);
}

// ---- the readinesses ----

/**
 * What the RO waits for on the kd course (handling.js lineReady): true or false for the kd readinesses, null to let
 * the shared switch answer (prone, magIn, cond1, safe, shown). ctx: { still, gun, mag, safe, me }.
 */
export function kdReady(state, def, { still, gun, mag, safe, me }) {
  const R = rangeOf(state), pid = playerId(state), dry = !!R.dry;
  const cond1 = !!gun && gunField(gun, 'chamber') === 'live' && !!gun.mag && gunField(gun, 'mode') === 'safe';
  switch (def.ready) {
    case 'zeroRead': return R.groupRead === R.cmd.i;
    case 'dialled': { const s = sightOf(gun), g = R.groups?.at(-1), w = g?.want; return still && (R.zeroed || !g?.call || !w || !!g.call.dialled || (s.elev === w.elev && s.wind === w.wind)); }
    case 'optic4': return still && (gun.optic ?? 1) === 4;
    case 'dope': { const s = sightOf(gun), z = beliefZero(gun), d = DOPE_CARD.r7?.[R.line]?.elev ?? 0; return still && s.elev === z.elev + d; }
    case 'arrived': return R.arrived === R.cmd.i && !state.skip && !state.time?.doing;
    case 'sitMag': return still && me.stance === 'sit' && (!!gun.mag || (dry && safe));
    case 'sit1': return still && me.stance === 'sit' && (cond1 || (dry && safe));
    case 'policed': return R.policeAt === R.cmd.i && !state.time?.doing;
    case 'turnedIn': return R.turnedAt === R.cmd.i;
    case 'declared': return !!R.declared;
    case 'emptyLocked': {
      const S = KD_STRINGS[R.string] ?? KD_STRINGS.zero, fired = R.strings.at(-1)?.holes?.length ?? 0;
      const locked = !!gunField(gun, 'locked') && !!mag && mag.n === 0;
      return still && (dry || (locked && (fired >= S.rounds || (R.strSeats ?? 1) >= (S.mags ?? 1) || roundsLeft(state) === 0)));
    }
    default: return null;
  }
}
/** The relay's half of the RO's eye (handling.js lineReady). */
export const kdRelayReady = (state) => relayReady(state, rangeOf(state)?.cmd?.i);

/**
 * The line's wait on you alone, lived (handling.js rangeSecond, each whole second, for the nudge and the move-on; w): R.onYouMs
 * grows a second when the tower waits on you and on nobody else: the command is one of yours (not the brief, the coach's
 * reading of the groups or the end), your readiness for it not met (lineReady without the relay), the relay's met, no
 * string with a time limit being fired (the confirm's five minutes, the 200 m's sixty seconds: the tower's own CEASE FIRE
 * ends them at the limit, the pits' marks are the range's to wait for), no splash or activity under way (the walk, the
 * police: the range's own pace), no casualty holding the line, the next command not yet posted. The walks and the pits
 * ('arrived') wait on the tower's splash, on R.livedMs as before. The user's report of 2026-11-07 ("got a fault for
 * making tower wait when everyone was waiting"): the move-on counted every lived second since the command, so the 200 m
 * string's minute, counted in whole seconds from a command given between two, reached 60 s before its limit and drew a
 * 'slow' fault on anyone who used it; the confirm's slow fire, five minutes long, was cut at 60 s with a 'slow' fault and
 * a CEASE FIRE while the shooter waited on the pits; and the relay's lag was counted to you. Returns the ms waited.
 */
export function kdWaitOnYou(state) {
  const R = rangeOf(state), def = R?.cmd ? SEQ_KD[R.cmd.i] : null;
  if (!R || !def) return 0;
  if (def.ready === 'arrived') return R.livedMs;
  if (onYou(state, R, def)) R.onYouMs = (R.onYouMs ?? 0) + 1000;
  return R.onYouMs ?? 0;
}
// (whether this second the line waits on you alone: see kdWaitOnYou)
function onYou(state, R, def) {
  if (R.next || R.end || (R.casualty && R.casualty.phase !== 'outcome')) return false;
  if (def.ready === 'always' || def.ready === 'never' || def.ready === 'zeroRead') return false;
  if (state.skip || state.time?.doing || R.splash || R.splashOn) return false;
  if (R.hot && R.limitAtMs !== null && R.limitAtMs !== undefined) return false;
  if (lineReady(state, def.id, { relay: false })) return false;
  return kdRelayReady(state);
}

// ---- each second lived ----

/** The kd course's part of the second (handling.js rangeSecond, ctx the fast layer's): splashes begun, the string's limit, brass settled. */
export function kdSecond(state, bus, ctx) {
  const R = rangeOf(state), now = state.clock.ms, pid = playerId(state);
  settle(state, now);
  // (a casualty on the line holds it: no command, no move-on, until the outcome)
  const holding = R.casualty && R.casualty.phase !== 'outcome';
  if (holding) R.livedMs = 0;
  // (a splash the command asked for: begun once the player is out of the mode and nothing else runs)
  const free = () => { const S = state.stop; if (S?.mode === 'stop' && S.doing?.kind === 'wait') { S.doing = null; S.phase = 'choose'; } if (S?.mode === 'stop' && S.phase === 'choose' && !S.reflex) leaveStop(state, bus, 'scene'); };
  if (R.splash && !state.skip && !state.time?.doing) {
    free();
    if (!state.stop && ctx?.sim) {
      const sp = R.splash;
      const carry = state.people[pid]?.kit?.carry;
      if (carry) { carry.posture = 'slungFront'; delete carry.finger; }
      const me = playerActor(state);
      if (me) delete me.stance;
      const r = startActivity(state, bus, ctx, { id: sp.id, args: { ms: sp.ms }, force: 'outcome' });
      if (r.ok) { R.splashOn = sp; delete R.splash; return true; }
    }
  }
  // (the police: begun at the command once the player stands free; lived kneeling at the point)
  const def = R.cmd ? SEQ_KD[R.cmd.i] : null;
  if (def?.id === 'police' && R.policeAt !== R.cmd.i && R.policing !== R.cmd.i && R.wantPolice === R.cmd.i && !state.skip && !state.time?.doing && ctx?.sim) {
    free();
    if (!state.stop) {
      const n = brassNear(state, pid, POLICE_M).mine, me = playerActor(state);
      const ms = Math.max(1000, Math.round(n * POLICE_CASE_S * 1000));
      if (me) me.stance = 'kneel';
      const r = startActivity(state, bus, ctx, { id: 'police-brass', args: { ms } });
      if (r.ok) R.policing = R.cmd.i;
      else if (me) delete me.stance;
    }
  }
  if (holding) return true;
  // (the string's limit: the tower's CEASE FIRE at it, lived time only; its words, "CEASE FIRE. Time.", are the CEASE FIRE
  // command's own, said once when it lands (handling.js onRangeCmd: it was said here and the sequence's "CEASE FIRE." a
  // tick after, both in the box: 0.0.7's tower verifier))
  if (R.hot && R.limitAtMs !== null && R.limitAtMs !== undefined && now >= R.limitAtMs && !R.next) {
    const text = hashPick(KD_RO.limit, 'kd-ro', state.meta.seed, 'limit', R.cmd.i);
    R.limitAtMs = null; R.limitHit = R.strings.length - 1;
    const i = R.cmd.i + 1;
    post(state, { atMs: now, prio: 2, kind: 'range-cmd', src: 'arms:range', payload: { cmd: SEQ_KD[i].id, i, text } });
    R.next = { id: SEQ_KD[i].id, i, atMs: now };
  }
  return false;
}

/** An activity's part ended (src/sim/time/activities.js partEnd): the scene's work at the splash's end (see the header). */
export function kdPartEnd(state, bus, part, whole, ms) {
  const R = rangeOf(state);
  if (!R) return;
  if (part === 'police') {
    police(state);
    const me = playerActor(state);
    if (me) delete me.stance;
    R.policeAt = R.cmd?.i ?? null;
    bus?.emit('range', { phase: 'brass', cmd: R.cmd?.id ?? null, hot: false, rule: null, kind: null, text: null, policed: R.policed });
    return;
  }
  if (part === 'kd-walk' || part === 'kd-pits') {
    const sp = R.splashOn ?? { line: part === 'kd-walk' ? 300 : 200, i: R.cmd?.i };
    // (the brass left behind on the line walked away from is the player's to answer for: it stays counted)
    turnInAll(state);
    if (part === 'kd-pits') {
      // (relay 2's confirm, rolled shot by shot, their scores in the strip)
      R.relay2Scores = R.relay2.map(p => ({ who: p, ...skipString(state, p, { line: 300, paper: 'kdA', rounds: 5, position: 'prone', key: 'confirm' }) }));
      const best = R.relay2Scores.reduce((a, b) => (b.score > (a?.score ?? -1) ? b : a), null);
      if (best) logEntry(state, bus, { kind: 'note', tone: 'note', text: `Relay two's confirm: the best ${best.score} of ${best.of}, ${staffName(state, best.who)}.` });
    }
    arriveAt(state, bus, sp.line);
    R.arrived = sp.i;
    delete R.splashOn;
    bus?.emit('range', { phase: 'line', cmd: R.cmd?.id ?? null, hot: false, rule: null, kind: null, text: null, line: sp.line });
    return;
  }
  if (part === 'kd-casualty') casualtyEnd(state, bus, ms);
}

// ---- the player's range actions: police, turn in, declare ----

/** The range actions open to the player now (the panel's rows and the bots'): [{ id, label, ms }]. */
export function kdActs(state) {
  const R = rangeOf(state);
  if (!R || R.course !== 'kd' || R.end || !R.cmd) return [];
  const def = SEQ_KD[R.cmd.i], pid = playerId(state), out = [];
  if (def.id === 'police' && R.policeAt !== R.cmd.i && R.wantPolice !== R.cmd.i) {
    const n = brassNear(state, pid, POLICE_M).mine;
    out.push({ id: 'kd:police', label: `Police your brass (${n})`, ms: Math.max(1000, Math.round(n * POLICE_CASE_S * 1000)) });
  }
  if (def.id === 'turnIn' && R.turnedAt !== R.cmd.i) out.push({ id: 'kd:turnIn', label: `Rounds to the coach (${roundsLeft(state) + (R.picked ?? 0)})`, ms: 1500 });
  if (def.id === 'declare' && !R.declared) out.push({ id: 'kd:declare', label: 'No brass, no ammo', ms: 2000 });
  return out;
}

/** A range action (the domain's 'kd:<id>'; w): police begins your brass's pick-up, turnIn hands the rounds over, declare says it. */
export function kdAct(state, bus, id, ctx = null) {
  const R = rangeOf(state);
  if (!R || R.course !== 'kd' || R.end || !kdActs(state).some(a => a.id === `kd:${id}`)) return { ok: false, why: 'not now' };
  const pid = playerId(state);
  if (id === 'police') { R.wantPolice = R.cmd.i; kdSecond(state, bus, ctx); return { ok: true, why: null }; }
  if (id === 'turnIn') {
    const n = turnIn(state, pid);
    R.turnedAt = R.cmd.i;
    coachSay(state, bus, n ? fill(KD_COACH.turnedIn, { N: capital(String(n)) }) : KD_COACH.noneBack, 'turnedIn', R.cmd.i);
    return { ok: true, why: null, n };
  }
  if (id === 'declare') return declare(state, bus, { by: 'you' });
  return { ok: false, why: 'unknown' };
}

/** The declaration (see the header): R.declared { brass, fired, rounds, left, ok, atMs, by }. */
function declare(state, bus, { by = 'you' } = {}) {
  const R = rangeOf(state), pid = playerId(state), now = state.clock.ms;
  const fired = state.armoury.ammoIssues.filter(a => a.toId === pid).reduce((t, a) => t + (a.fired ?? 0), 0);
  const left = brassLeft(state).mine, rounds = roundsLeft(state) + (R.picked ?? 0);
  const ok = left === 0 && rounds === 0;
  sayOn(state, bus, { who: pid, text: hashPick(KD_COACH.declared, 'kd-declare', state.meta.seed), kind: 'speech' });
  if (!ok) {
    fault(state, bus, 'declare', 'warn', hashPick(KD_COACH.wrong, 'kd-coach', state.meta.seed, 'wrong'));
    // (the coach makes it right: the brass left picked up, the rounds taken)
    for (const t of Object.values(R.brassTiles ?? {})) { R.policed += t.mine; t.n -= t.mine; t.mine = 0; }
    turnIn(state, pid);
  }
  R.declared = { brass: R.policed, fired, rounds, left, ok, atMs: now, by };
  bus?.emit('range', { phase: 'declare', cmd: R.cmd?.id ?? null, hot: false, rule: null, kind: null, text: null, declare: { brass: R.policed, rounds, ok } });
  return { ok: true, why: null, declared: R.declared };
}

/** The move-on on the kd course (handling.js moveOn): a command left undone done by the coach, each its fault already counted. */
export function kdMoveOn(state, bus, def) {
  const R = rangeOf(state), pid = playerId(state);
  if (def.ready === 'policed') { police(state); for (const t of Object.values(R.brassTiles ?? {})) { R.policed += t.mine; t.n -= t.mine; t.mine = 0; } R.policeAt = R.cmd.i; }
  if (def.ready === 'turnedIn') { turnIn(state, pid); R.turnedAt = R.cmd.i; }
  if (def.ready === 'declared' && !R.declared) declare(state, bus, { by: 'coach' });
  if (def.ready === 'arrived' && !R.splash && !R.splashOn && R.arrived !== R.cmd.i) R.splash = { id: def.id === 'pits' ? 'kd-pits' : 'kd-walk', ms: def.id === 'pits' ? PITS_MIN * 60_000 : 180_000, line: def.line, i: R.cmd.i };
}

// ---- the shots and the pits ----

/** A KD shot recorded (handling.js recordShot): its pits' marking posted (each shot in slow fire; a rapid string's after). */
export function kdShot(state, bus, shot, rec) {
  const R = rangeOf(state), S = KD_STRINGS[R.string];
  if (!shot.fired || !rec.lane || rec.lane < 1 || (R.line ?? 25) === 25 || !S || S.marked !== 'each') return;
  // (a round fired at a face down in the pits went over it into the berm: the pullers have no hole to mark; the
  // shot is done with as marked, a miss on the card)
  if (rec.berm) { rec.marked = state.clock.ms; return; }
  const tofS = shot.flight?.tofS ?? 0.45, r = stream('pit', state.meta.seed, rec.lane, shot.id);
  const atMs = Math.ceil((state.clock.ms + (tofS + rnd(r, PIT_REACT_S[0], PIT_REACT_S[1])) * 1000) / TICK_MS) * TICK_MS;
  post(state, { atMs, prio: 3, kind: 'pit', src: 'arms:pits', payload: { lane: rec.lane, phase: 'down', shotIds: [shot.id] } });
}

// (a rapid string's faces marked together after CEASE FIRE)
function markTogether(state, bus, key) {
  const R = rangeOf(state), now = state.clock.ms, byLane = {};
  for (const s of R.shots) if (s.string === key && s.strN === R.strings.length - 1 && s.lane >= 7) (byLane[s.lane] ??= []).push(s.id);
  for (const [lane, ids] of Object.entries(byLane)) post(state, { atMs: now + 1000, prio: 3, kind: 'pit', src: 'arms:pits', payload: { lane: Number(lane), phase: 'down', shotIds: ids, rapid: true } });
}

/** The pits' view of a lane at ms (pits.js: see its header). */
export { pitView };

/** The queue's 'pit' event (w; see the header): a carrier down, marked, up, the disk. */
export function onPitEvent(state, bus, ev) {
  const R = rangeOf(state);
  if (!R || R.course !== 'kd') return;
  const { lane, phase, shotIds = [], rapid = false } = ev.payload ?? {}, now = state.clock.ms, L = kdLaneOf(lane);
  if (!L) return;
  const p = (R.pits[lane] ??= { phase: 'up', atMs: now, holes: [] });
  const fact = (ph, extra = {}) => bus?.emit('pit', { lane, phase: ph, x: L.carrier.x, z: L.z, atMs: now, shotIds, ...extra });
  if (phase === 'down') {
    // (a carrier on its way down, being marked or still rising takes the shot with the marking under way, or after it: never a jump)
    if (p.phase === 'down' || p.phase === 'marking') { p.pending = [...(p.pending ?? []), ...shotIds]; return; }
    if (p.phase === 'rising') { p.next = [...(p.next ?? []), ...shotIds]; return; }
    p.phase = 'down'; p.atMs = now; p.pending = [...shotIds]; p.disk = null; p.flagUntilMs = null;
    const marking = rapid ? RAPID_MARK_S : markS(state, lane, shotIds);
    post(state, { atMs: now + Math.round((CARRIER_S + marking) * 1000), prio: 3, kind: 'pit', src: 'arms:pits', payload: { lane, phase: 'marked', shotIds, rapid } });
    fact('down');
    return;
  }
  if (phase === 'marked') {
    const ids = p.pending ?? shotIds, shots = ids.map(id => R.shots.find(s => s.id === id)).filter(Boolean);
    let n = p.holes.length;
    for (const s of shots) if (s.hole) p.holes.push({ at: s.hole, score: s.score, v: !!s.v, n: ++n, atMs: s.atMs });
    const last = shots.at(-1);
    p.spotter = last?.hole ? [...last.hole] : p.spotter ?? null;
    p.phase = 'rising'; p.atMs = now; p.marked = ids; p.pending = [];
    for (const s of shots) s.marked = now;
    post(state, { atMs: now + Math.round(CARRIER_S * 1000), prio: 3, kind: 'pit', src: 'arms:pits', payload: { lane, phase: 'disk', shotIds: ids, rapid } });
    fact('marked');
    fact('up');
    return;
  }
  if (phase === 'disk') {
    const shots = (p.marked ?? shotIds).map(id => R.shots.find(s => s.id === id)).filter(Boolean), last = shots.at(-1);
    p.phase = 'up'; p.atMs = now;
    if (rapid) { p.disk = null; }
    else if (last?.hole) { p.disk = { value: last.v ? 'V' : last.score, untilMs: now + DISK_S * 1000, sinceMs: now }; fact('disk', { value: p.disk.value }); }
    else { p.flagUntilMs = now + FLAG_S * 1000; p.flagSinceMs = now; fact('flag'); }
    if (last?.who === playerId(state)) afterMark(state, bus, last);
    const more = [...(p.pending ?? []), ...(p.next ?? [])];
    p.pending = []; delete p.next;
    if (more.length) onPitEvent(state, bus, { payload: { lane, phase: 'down', shotIds: more } });
  }
}
// (the marking's time: the puller's Awareness against MARK_DC, harder in the black and by another hole: the grade's MARK_S)
function markS(state, lane, shotIds) {
  const R = rangeOf(state), puller = R.relay2?.[lane - KD_LANE_K - 1] ?? R.staff?.pits ?? null;
  const shot = R.shots.find(s => s.id === shotIds.at(-1)), P = PAPERS.kdA;
  let dc = MARK_DC;
  if (shot?.hole && Math.hypot(shot.hole[0], shot.hole[1]) <= (P?.blackCm ?? 15)) dc += MARK_BLACK;
  if (shot?.hole && (R.pits[lane]?.holes ?? []).some(h => Math.hypot(h.at[0] - shot.hole[0], h.at[1] - shot.hole[1]) <= MARK_NEAR_CM)) dc += MARK_NEAR;
  const v = puller ? rollerOf(state, puller).value('awareness') : 10, r = stream('pit', state.meta.seed, lane, shotIds.join(','), 'mark');
  const m = d20(r) + v - dc, g = grade(m, 0);
  return MARK_S[g === 'superb' ? 'superb' : g === 'good' ? 'good' : m >= 0 ? 'pass' : 'fail'];
}

// (a mark of the player's in the confirm: after CONFIRM_CALL_AFTER, the coach's call on the marked group, the believed zero moved by it)
function afterMark(state, bus, shot) {
  const R = rangeOf(state), pid = playerId(state);
  const marked = R.shots.filter(s => s.who === pid && s.string === 'confirm' && s.strN === R.strings.length - 1 && s.marked && s.hole);
  // (a rapid string marked together: the coach reads the whole string off the face (the design review's of v0.0.7:
  // one "Marked a V, the centre." stood for ten holes))
  if (KD_STRINGS[shot.string]?.marked === 'after') { coachSay(state, bus, rapidLine(R.shots.filter(s => s.who === pid && s.string === shot.string && s.strN === shot.strN)), 'rapid', shot.id); return; }
  // (a hole on the paper outside the rings scores 0: "Off the rings", never "A 0" (the design review's))
  coachSay(state, bus, !shot.hole ? KD_COACH.miss : (shot.score ?? 0) === 0 && !shot.v ? fill(KD_COACH.offRings, { clock: clockOf(shot.hole) }) : fill(KD_COACH.marked, { score: shot.v ? 'V' : shot.score, clock: clockOf(shot.hole) }), 'mark', shot.id);
  if (marked.length !== CONFIRM_CALL_AFTER || R.string !== 'confirm' || R.confirmCalled === R.strings.length - 1) return;
  R.confirmCalled = R.strings.length - 1;
  const grp = groupOf(marked.map(s => ({ at: s.hole }))), gun = state.items[gunOn(state, pid)];
  if (!grp.centreCm) return;
  // (the clicks that put the marked group's centre on the face's: the wind held for already, so what is left is the zero)
  const call = callOf('kdA', grp.centreCm, 300, { targetCm: [0, 0] });
  if (Math.abs(call.elev) <= 1 && Math.abs(call.wind) <= 1) { coachSay(state, bus, KD_COACH.confirmed, 'confirmed'); return; }
  // (the believed zero moves when the call is dialled: shooting.js's sight:call, as the zero's calls do)
  const s = sightOf(gun);
  R.call = { ...(R.call ?? {}), clicks: { elev: call.elev, wind: call.wind }, want: { elev: s.elev + call.elev, wind: s.wind + call.wind }, atMs: state.clock.ms, for: pid };
  delete R.call.dialled;
  coachSay(state, bus, fill(KD_COACH.confirm, { Call: capital(clickPhrase(call)), call: clickPhrase(call) }), 'confirm-call');
  bus?.emit('range', { phase: 'call', cmd: R.cmd?.id ?? null, hot: R.hot, rule: null, kind: null, text: null, line: R.line, call: { crossMs: R.call.crossMs ?? null, holdMil: R.call.holdMil ?? null, clicks: R.call.clicks } });
}
// (a rapid string read by the coach: "Ten on the paper: four V, three fives, two fours.")
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const PLURAL = { V: 'V', 5: 'fives', 4: 'fours', 3: 'threes', 2: 'twos', 0: 'off the rings' };
const SINGLE = { V: 'a V', 5: 'a five', 4: 'a four', 3: 'a three', 2: 'a two', 0: 'one off the rings' };
function rapidLine(shots) {
  const on = shots.filter(s => s.hole);
  if (!on.length) return KD_COACH.rapidNone;
  const by = {};
  for (const s of on) { const k = s.v ? 'V' : String(s.score ?? 0); by[k] = (by[k] ?? 0) + 1; }
  const list = ['V', '5', '4', '3', '2', '0'].filter(k => by[k]).map(k => (by[k] === 1 ? SINGLE[k] : `${WORDS[by[k]] ?? by[k]} ${PLURAL[k]}`));
  const n = WORDS[on.length] ?? String(on.length);
  return fill(KD_COACH.rapid, { Hits: capital(n), hits: n, list: list.length > 1 ? `${list.slice(0, -1).join(', ')} and ${list.at(-1)}` : list[0] });
}
// (a hole's place on the face as a clock: 'twelve o'clock'; 'the centre' inside the V)
const CLOCKS = ['three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'one', 'two'];
const clockOf = ([x, y]) => (Math.hypot(x, y) < 3.75 ? 'the centre' : `${CLOCKS[((Math.round(Math.atan2(y, x) / (Math.PI / 6)) % 12) + 12) % 12]} o'clock`);

// ---- range safety, in full ----

/** The fast layer 'rules', the kd course's part (each tick lived, after handling.js rangeRules): see the header. */
export function safety(state, input, bus) {
  const R = rangeOf(state);
  if (!R || R.course !== 'kd' || R.end || state.skip) return;
  const pid = playerId(state), now = state.clock.ms, me = playerActor(state);
  // (the ND's rule: the verdict carry.js ndOf noted this tick; one that hit someone is the casualty, else v0.0.5's stop)
  const nd = R.$nd && R.$nd.atMs === now && R.$nd.who === pid ? R.$nd : null;
  if (nd && !R.$ndDone) {
    R.$ndDone = true;
    if (nd.hits?.length) { casualtyStart(state, bus, { shooter: pid, nd }); return; }
    stopRange(state, bus, 'nd', null);
    return;
  }
  if (!me) return;
  const P = kdPoint(state), carry = state.people[pid]?.kit?.carry ?? {}, gun = state.items[gunOn(state, pid)];
  const warn = (rule, text) => { const at = R.warned[rule]; if (at !== undefined && now - at < WARN_AGAIN_MS) return; R.warned[rule] = now; fault(state, bus, rule, 'warn', text); };
  // (forward of the line while hot: the stop; the pits behind the parapet never count)
  if (R.hot && P && P.line !== 25) {
    const front = P.box[2];
    for (const a of state.actors?.list ?? []) {
      if (a.x <= front || a.x >= KD_RANGE.kd.pits.parapet.x0) continue;
      if (a.who === pid) { roSay(state, bus, KD_RO.forward, 'forward'); stopRange(state, bus, 'forward', hashPick(KD_RO.forward, 'kd-ro', state.meta.seed, 'fwd')); return; }
    }
  }
  // (the cold line: the rifle in hand off safe or the finger in, once the shooter has had time to answer)
  const inHand = !SLUNG.has(carry.posture ?? 'slungFront');
  const busy = state.stop?.doing && state.stop.doing.kind !== 'wait';
  if (!R.hot && R.cmd && R.cmd.id !== 'clear' && R.cmd.id !== 'fire' && inHand && gun && !busy && now - (R.cmd.atMs ?? now) >= COLD_GRACE_MS
    && (gunField(gun, 'mode') !== 'safe' || carry.finger === 'on')) warn('coldSafe', 'The line is cold. On safe, finger off.');
  // (the muzzle over a neighbour: v0.0.5's flag warning, for anyone on the line, not only the coach)
  for (const [who, rec] of Object.entries(carry.near ?? {})) if (rec.result === 'flag' && who !== R.coachId) { warn('flagged', 'Watch your muzzle. Not over the man beside you.'); break; }
}

// (the tower's CEASE FIRE given now, if a string is being fired: the course goes on from its cease; the line cold)
function ceaseNow(state) {
  const R = rangeOf(state), now = state.clock.ms, def = R.cmd ? SEQ_KD[R.cmd.i] : null;
  if (def?.id === 'fire' && R.hot) {
    cancel(state, 'arms:range');
    post(state, { atMs: now, prio: 2, kind: 'range-cmd', src: 'arms:range', payload: { cmd: SEQ_KD[R.cmd.i + 1].id, i: R.cmd.i + 1 } });
    R.next = { id: SEQ_KD[R.cmd.i + 1].id, i: R.cmd.i + 1, atMs: now };
  }
  R.hot = false; R.limitAtMs = null;
}

/** A gunner's negligent discharge (gunner.js): hits on the line are the casualty, else the line's cease and the gunner's rifle taken. */
export function gunnerNd(state, bus, G, nd) {
  const R = rangeOf(state);
  if (!R || R.end) return;
  if (nd.hits?.length) { casualtyStart(state, bus, { shooter: G.pid, nd }); return; }
  roSay(state, bus, KD_RO.ceaseNd, 'nd', G.pid);
  G.out = true;
  relayCease(state);
  ceaseNow(state);
  bus?.emit('range', { phase: 'fault', cmd: R.cmd?.id ?? null, hot: R.hot, rule: 'nd', kind: 'warn', text: null, who: G.pid });
}

// ---- the casualty on the line ----

/** An ND's hits landed (w): the RO's CEASE FIRE, the relay on safe, the shooter's rifle taken, each hit through BODY's applyHit, the corpsman sent. */
function casualtyStart(state, bus, { shooter, nd }) {
  const R = rangeOf(state), pid = playerId(state), now = state.clock.ms;
  roSay(state, bus, KD_RO.ceaseNd, 'nd', now);
  R.limitAtMs = null;
  relayCease(state);
  ceaseNow(state);
  let first = null, dead = false;
  const applied = [];
  for (const hit of nd.hits) {
    bus?.emit('hit', { ...hit, nd: true });
    const out = applyHit(state, bus, { ...hit, nd: true });
    applied.push(out);
    // (the casualty of record is the first body on the line, or the player wherever they were on it: a player hit
    // among others is carried to the card as the casualty (the code review's of v0.0.7: shot in the chest as the
    // fourth of five, they finished the course and declared, their wound nowhere on the card))
    if (!first || (hit.onId === pid && first.who !== pid)) first = { who: hit.onId, part: out?.part ?? hit.part, words: out?.words ?? null };
    dead = dead || !!out?.dead;
  }
  // (the grade the hits make it (wounds.js gradeOfHits): carry.js graded the round before it landed, ND-4 for any hit;
  // a death makes it ND-5, said again in an 'nd' fact of its own (during 'graded'), the code review's of v0.0.7)
  const grade = gradeOfHits(nd.grade ?? 'ND-4', applied);
  if (grade !== nd.grade) bus?.emit('nd', { who: shooter, gun: gunOn(state, shooter) ?? null, grade, into: nd.into ?? null, nearId: nd.nearId ?? null, atMs: now, during: 'graded', hits: nd.hits.map(h => ({ onId: h.onId, part: h.part })) });
  nd.grade = grade;
  coachSay(state, bus, KD_COACH.hit, 'hit');
  if (shooter === pid) {
    // (the coach takes your rifle: the stop's, without ending the scene)
    const gun = state.items[gunOn(state, pid)];
    if (state.stop) leaveStop(state, bus, 'coach');
    // (the round the ND chambered after it fired is cleared into the coach's hand: it goes back with the rest at the
    // turn-in (R.picked), not lost (the code review's of v0.0.7: fired + back came to n − 1))
    if (gun) {
      gun.mode = 'safe';
      if (gun.mag) { const p = pouchesOf(state, pid).find(x => x.room > 0); if (p) move(state, gun.mag, { container: p.id }); }
      if (gunField(gun, 'chamber') === 'live' && gunField(gun, 'set') !== 'dud') R.picked = (R.picked ?? 0) + 1;
      delete gun.chamber;
    }
    const c = state.people[pid]?.kit?.carry;
    if (c) { c.posture = 'slungFront'; delete c.finger; }
    R.faults.push({ rule: 'nd', kind: 'stop', atMs: now });
  } else {
    const G = R.relay.find(g => g.pid === shooter);
    if (G) G.out = true;
  }
  const c = actorOf(state, R.staff.corpsman), to = actorOf(state, first.who);
  // (everyone the round went through: the first is the corpsman's to run to, the rest are cared for with them)
  const others = [...new Set(nd.hits.map(h => h.onId))].filter(w => w !== first.who);
  for (const w of [first.who, ...others]) { const G = R.relay.find(g => g.pid === w); if (G) G.out = true; }
  R.casualty = { who: first.who, ...(others.length ? { others } : {}), byId: shooter, part: first.part, grade, phase: 'down', atMs: now, careAtMs: null, outcome: null, words: first.words,
    run: c && to ? { from: [c.x, c.z], to: [Math.round((to.x - 0.6) * 1e4) / 1e4, Math.round((to.z + 0.4) * 1e4) / 1e4] } : null };
  bus?.emit('casualty', { who: first.who, phase: 'down', byId: shooter, outcome: null, bloodPct: null, atMs: now });
  bus?.emit('range', { phase: 'casualty', cmd: R.cmd?.id ?? null, hot: false, rule: 'nd', kind: 'stop', text: null, casualty: { who: first.who, outcome: null }, grade });
  if (first.who === pid && state.stop) leaveStop(state, bus, 'stopped');
}

/** The fast layer 'actors' on the kd course (lived): the corpsman's run and care, then the relay's steps (gunner.js). */
export function kdActors(state, input, bus) {
  const R = rangeOf(state);
  if (!R || R.course !== 'kd' || state.skip) return;
  const C = R.casualty;
  if (C && (C.phase === 'down' || C.phase === 'care')) {
    const now = state.clock.ms, c = actorOf(state, R.staff.corpsman);
    if (C.phase === 'down' && c && C.run) {
      const [tx, tz] = C.run.to, dx = tx - c.x, dz = tz - c.z, d = Math.hypot(dx, dz), step = placeGaits(state).runMs * TICK_MS / 1000;
      if (d <= step) {
        c.x = tx; c.z = tz; c.stance = 'kneel'; c.gait = 'idle'; C.phase = 'care'; C.careAtMs = now;
        for (const w of [C.who, ...(C.others ?? [])]) { const rec = state.people[w]?.body; if (rec) state.people[w].body = careOf(rec, now, { tier: 'corpsman' }) ?? rec; }
        bus?.emit('casualty', { who: C.who, phase: 'care', byId: R.staff.corpsman, outcome: null, bloodPct: null, atMs: now });
        // (the corpsman's word to the casualty as he kneels: the incident heard as one, not 20 s of silence)
        sayOn(state, bus, { who: R.staff.corpsman, text: hashPick(KD_COACH.stay, 'kd-corpsman', state.meta.seed, C.atMs), kind: 'speech' });
      } else {
        c.x = Math.round((c.x + dx / d * step) * 1e4) / 1e4; c.z = Math.round((c.z + dz / d * step) * 1e4) / 1e4;
        c.gait = 'run'; c.face = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 'right' : 'left') : (dz > 0 ? 'down' : 'up');
      }
      const post = state.people[R.staff.corpsman]?.post;
      if (post) { post.x = c.x; post.z = c.z; post.face = c.face; }
      c.$px = c.x; c.$pz = c.z;
    } else if (C.phase === 'care' && now - C.careAtMs >= CARE_EDGE_S * 1000) {
      C.phase = 'evac'; C.evacAtMs = now;
      R.splash = { id: 'kd-casualty', ms: EVAC_MIN * 60_000, line: R.line, i: R.cmd?.i ?? null };
      bus?.emit('casualty', { who: C.who, phase: 'evac', byId: R.staff.corpsman, outcome: null, bloodPct: null, atMs: now });
    }
  }
  if (!C || C.phase === 'outcome') gunnerStep(state, input, bus);
}

// (the casualty's splash ended: the outcome, the range closed, the course on to the last UNLOAD, SHOW CLEAR; the player's own: the card)
function casualtyEnd(state, bus, ms) {
  const R = rangeOf(state), C = R.casualty, pid = playerId(state);
  if (!C) return;
  const rec = state.people[C.who]?.body;
  // (from the evacuation's start, as wounds.js casualtyOutcome's contract has it (the code review's of v0.0.7: from the
  // hit, the bleed to care was counted twice and the card said 95.01% where the body read 97.72%)); the blood at the
  // splash's end read off the body as it was stepped through it, so the card and the body never disagree
  const from = C.evacAtMs ?? C.careAtMs ?? C.atMs;
  const out = rec ? casualtyOutcome(rec, { fromMs: from, evacMs: EVAC_MIN * 60_000 }) : { outcome: 'evacuated', bloodPct: null, words: null };
  if (rec && !rec.dead && out.outcome !== 'dead' && Number.isFinite(ms)) out.bloodPct = Math.round(bloodAt(rec, ms) * 100) / 100;
  C.phase = 'outcome'; C.outcome = out.outcome; C.bloodPct = out.bloodPct ?? null;
  const name = C.who === pid ? 'You' : staffName(state, C.who);
  C.name = name; C.where = rec ? hitWhere(rec) : null;
  const more = (C.others ?? []).length, moreDead = (C.others ?? []).filter(w => state.people[w]?.body?.dead).length;
  C.words = (C.who === pid ? casualtyLine(state, C.who, out) : `Range closed: ${casualtyLine(state, C.who, out)}`) + (more ? `; ${more} more hit by the same round${moreDead ? `, ${moreDead} dead` : ''}` : '');
  for (const w of C.others ?? []) if (w !== pid) setPost(state, w, null);
  bus?.emit('casualty', { who: C.who, phase: 'outcome', byId: R.staff.corpsman, outcome: out.outcome, bloodPct: C.bloodPct, atMs: ms });
  // (the casualty and the corpsman off the range behind the splash: their posts stood down)
  if (C.who !== pid) setPost(state, C.who, null);
  const cp = state.people[R.staff.corpsman]?.post;
  if (cp) setPost(state, R.staff.corpsman, { area: KD_RANGE.area, ...corpsmanAt(R.line ?? 25) });
  const G = R.relay.find(g => g.pid === C.who);
  if (G) G.out = true;
  R.closed = true;
  roSay(state, bus, KD_RO.closed, 'closed');
  bus?.emit('range', { phase: 'closed', cmd: R.cmd?.id ?? null, hot: false, rule: null, kind: null, text: null, casualty: { who: C.who, outcome: out.outcome } });
  if (C.who === pid) { endRange(state, bus, 'closed', 'casualty'); return; }
  // (the course on to the last UNLOAD, SHOW CLEAR, police, turn in, the declaration and the end; a rifle the coach took is shown)
  const i = SEQ_KD.findIndex(c => c.id === 'clear' && c.stage === 's200');
  R.closedNext = i;
  if (C.byId === pid) R.shown = true;
  post(state, { atMs: ms + 2000, prio: 2, kind: 'range-cmd', src: 'arms:range', payload: { cmd: SEQ_KD[i].id, i } });
  R.next = { id: SEQ_KD[i].id, i, atMs: Math.floor((ms + 2000) / 1000) * 1000 };
  R.hot = false; R.limitAtMs = null;
}

/**
 * A negligent discharge forced now (w; the tests' and the debug handle's): from pid's rifle along the line toward a
 * person id or { x, z }, unspread, through penetrate.js traceRound; graded and answered as any (see the header).
 * Returns the verdict { grade, hits, into }.
 */
export function forceNd(state, bus, { pid = playerId(state), gunId = gunOn(state, pid), toward = null, y = null } = {}) {
  const R = rangeOf(state), gun = state.items[gunId], m = muzzleOf(state, pid);
  if (!R || !gun || !m) return null;
  const t = typeof toward === 'string' ? actorOf(state, toward) : toward;
  const yaw = t ? Math.atan2(t.z - m.z, t.x - m.x) : m.yawRad, dist = t ? Math.hypot(t.x - m.x, t.z - m.z) : 50;
  // (at the middle of the body's height as it stands, sits, kneels or lies)
  const midY = { stand: 1.0, kneel: 0.6, sit: 0.6, prone: 0.2, down: 0.2 }[t?.stance ?? 'stand'] ?? 1.0;
  const pitch = t ? Math.atan2((y ?? midY) - m.y, Math.max(0.5, dist)) : m.pitchRad;
  const tr = traceRound(state, { shooterId: pid, from: { x: m.x, y: m.y, z: m.z }, yawRad: yaw, pitchRad: pitch, cal: '6.5x40r', load: 'ball', barrelMm: 460, env: null, maxM: 2000, rngKey: `force:${state.clock.ms}`, margin: 0, nd: true });
  gun.rounds = (gun.rounds ?? 0) + 1;
  // (the chambered round is the one that went: the action cycles the next up from the magazine, as a real ND's does,
  // so the issue's count balances (fired + back = n))
  if (gunField(gun, 'chamber') === 'live') { const mg = gun.mag ? state.items[gun.mag] : null; if (mg && (mg.n ?? 0) > 0) feed(gun, mg); else delete gun.chamber; }
  const hits = tr?.hits ?? [];
  // (who it passed within 1.5 m of, and how far off downrange: graded as carry.js grades a real one)
  const ux = Math.cos(yaw), uz = Math.sin(yaw), end = tr?.stoppedBy?.at ?? null, len = end ? Math.hypot(end.x - m.x, end.z - m.z) : 200;
  let nearId = hits[0]?.onId ?? null;
  if (!nearId) for (const o of state.actors?.list ?? []) { if (o.who === pid) continue; const vx = o.x - m.x, vz = o.z - m.z, tt = Math.max(0, Math.min(len, vx * ux + vz * uz)); if (Math.hypot(vx - ux * tt, vz - uz * tt) <= 1.5) { nearId = o.who; break; } }
  const into = tr?.stoppedBy?.kind ?? 'past', offDeg = Math.abs(angleDiff(yaw, KD_RANGE.downrangeRad)) * 180 / Math.PI;
  const nd = { grade: gradeNd({ hits, nearId, offDeg, into }), into, nearId, hits: hits.map(h => ({ ...h, nd: true })), who: pid, atMs: state.clock.ms, forced: true };
  bus?.emit('nd', { who: pid, gun: gunId, grade: nd.grade, into: nd.into, nearId: nd.nearId, atMs: nd.atMs, during: 'forced', hits: hits.map(h => ({ onId: h.onId, part: h.part })) });
  const issue = state.armoury.ammoIssues.find(a => a.id === R.issueId);
  if (pid === playerId(state) && issue) issue.fired += 1;
  if (pid === playerId(state)) { R.$nd = nd; delete R.$ndDone; safety(state, null, bus); }
  else { const G = R.relay.find(g => g.pid === pid); if (G) gunnerNd(state, bus, G, nd); else if (hits.length) casualtyStart(state, bus, { shooter: pid, nd }); }
  return nd;
}

// ---- the view ----

/** The session on the kd course as the hud and the bots read it (see the header), or null. */
// (the card's zeroing: where this zero's clicks count from, or null (shot.js zeroingOf, the player's rifle))
const zeroFrom = (state, pid) => { const z = zeroingOf(state, pid, gunOn(state, pid)); return z ? { from: z.from } : null; };
export function kdNow(state, ms = state.clock.ms) {
  const R = rangeOf(state);
  if (!R || R.course !== 'kd') return null;
  const pid = playerId(state);
  const strings = R.strings.map((s) => {
    const holes = (s.holes ?? []).map((x, n) => ({ at: x.at, score: x.score, v: !!x.v, n: n + 1 }));
    const sc = scoreOf(holes);
    return { id: s.id, line: s.line, paper: s.paper, holes, score: sc.score, of: sc.of, v: sc.v, shots: sc.shots };
  });
  const pits = {};
  for (let lane = 7; lane <= 12; lane++) pits[lane] = pitView(R, lane, ms);
  const issues = state.armoury.ammoIssues.filter(a => a.toId === pid);
  const fired = issues.reduce((t, a) => t + (a.fired ?? 0), 0), left = brassLeft(state).mine;
  const relay = relayScores(state).map(r => ({ ...r, name: staffName(state, r.who) }));
  const zeroGroups = R.groups.length;
  const s300 = strings.filter(s => s.id === 'confirm').at(-1), s200 = strings.filter(s => s.id === 's200').at(-1);
  const faults = R.faults.length, vs = (s300?.v ?? 0) + (s200?.v ?? 0);
  const clock = (t) => { const c = marsClock(t, lonOf()); return `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}`; };
  const head = R.end?.phase === 'stopped' ? `Stopped${R.end.why ? `: ${stopWords(R.end.why)}` : ''}` : R.end ? `${R.end.phase === 'closed' ? 'Closed' : 'Clear'} at ${clock(R.end.atMs)}` : 'The line';
  const summary = [head, zeroGroups ? `${R.zeroed ? 'zero in' : 'not zeroed in'} ${zeroGroups} group${zeroGroups === 1 ? '' : 's'}` : null,
    // (a string the line stopped before you fired says so, never "0 of 0")
    s300 ? `300 m ${s300.of ? `${s300.score} of ${s300.of}` : 'not fired'}` : null, s200 ? `200 m ${s200.of ? `${s200.score} of ${s200.of}` : 'not fired'}` : null, vs ? `${vs} V` : null,
    faults ? `${faults} fault${faults === 1 ? '' : 's'}` : 'no faults'].filter(Boolean).join(' · ');
  const def = R.cmd ? SEQ_KD[R.cmd.i] : null;
  // (the relay's scores beside yours, ranked, on the card (the design review's of v0.0.7: computed and never shown)):
  // "Relay one: you 62 of 70 · Cpl Xie 68 · … (2nd of 6)", once the course has a scored string
  const mine = (s300?.score ?? 0) + (s200?.score ?? 0), myOf = (s300?.of ?? 0) + (s200?.of ?? 0);
  const ranked = [{ who: pid, name: 'you', score: mine, of: myOf }, ...relay.filter(r => r.of)].sort((a, b) => b.score - a.score || (a.who === pid ? -1 : b.who === pid ? 1 : 0));
  const place = ranked.findIndex(r => r.who === pid) + 1, ORD = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th'];
  const relayLine = myOf && R.end && relay.some(r => r.of) ? `Relay one: ${ranked.map(r => (r.who === pid ? `you ${r.score} of ${r.of}` : `${r.name} ${r.score} of ${r.of}`)).join(' · ')} (${ORD[place - 1] ?? place} of ${ranked.length})` : null;
  return {
    stage: R.stage, line: R.line, cmd: R.cmd?.id ?? null, cmdI: R.cmd?.i ?? null, hot: R.hot, lane: R.line === 25 ? R.lane : R.kdLane, kdLane: R.kdLane,
    limitMsLeft: R.limitAtMs ? Math.max(0, R.limitAtMs - ms) : null, ready: def?.ready ?? null,
    groups: R.groups.map(g => ({ holes: (g.holes ?? []).map(h => h.at).filter(Boolean), centreCm: g.poolCm ?? g.centreCm, call: g.call, ok: g.ok })),
    // (zeroing: the rifle being zeroed, the card's dial from the turrets as issued (shot.js zeroingOf), else null)
    zeroed: !!R.zeroed, zeroing: zeroFrom(state, pid), strings, pits, call: R.call ? { ...R.call } : null, relay, relay2: R.relay2Scores ?? null,
    brass: { fired, policed: R.policed ?? 0, left }, rounds: { held: roundsLeft(state) + (R.picked ?? 0), turnedIn: R.turnedIn ?? 0 },
    declared: R.declared, casualty: R.casualty ? { ...R.casualty } : null, closed: !!R.closed, dummy: { ...R.dummy }, acts: kdActs(state),
    end: R.end, summary, incident: R.casualty?.words && R.casualty.phase === 'outcome' ? R.casualty.words : null, relayLine,
  };
}
