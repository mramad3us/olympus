// OLYMPUS scenarios: test-anchors, "Anchor before you fire": five stations in Well A at Phobos, each a string at the live face from the anchor the station wants (ROADMAP §9's test-voidrange brought forward; the anywhere note AW§5; COMBAT §14.8; WEAPONS §7.8; the build sheet v0.0.24 §1 D, §3.4).
//
// The user's rule of 2026-11-08: "Try keeping rifles looking like rifles even zero G stuff, let's say we use footing to hold
// recoil". In free fall the gun is the same gun; what holds its push is the footing (src/sim/body/footing.js), and this
// course teaches the footings one station at a time: (1) boots, mag boots locked on the deck at 10 m; (2) lanyard, clipped to
// a pad-eye on the north face at 15 m; (3) one hand, a hand on a hold and the P-12 in the other at 7 m (the R-7 shouldered
// there shows "one-handed, a hand on the hold −4" on its row, and the cadre says "Pistol."); (4) the wedge, across the gap
// between the two cover plates at 20 m; (5) floating, one round at 10 m pushed off into the open, then the grab at the first
// pad-eye the drift passes. The ground is authored (src/data/places/phobos.js VOID_RANGE); the times are drawn from the world's seed alone on named
// streams (each station's standby gap, stream(seed, 'anchors:gap', n)), never from the sheet played, so "Again as …" meets the
// same course.
//
// The session is the range's (state.armoury.range, course 'anchors', COURSES.anchors), so the targets, the take-in, the
// stage's turners and the shot's record read it as they read the bay's: but it has no tower (R.cmd null: handling.js
// rangeSecond gives no command) and its rules are this module's (anchorsRules in place of the range's: nothing of the bay's
// box or lanes holds in Well A). Its own record is R.anchors:
//     { tier, st (the station now, 0 to 4; 5 at the end), phase ('brief' | 'move' | 'standby' | 'string' | 'drift' | 'gap' |
//       'done'), atMs (the phase's start), briefEndMs, stations: [{ n, id, cmdAtMs, readyAtMs, turnAtMs, endAtMs, rounds:
//       [{ shot, atMs, anchor, hold, oneHand, recoverMs, plantedMs, push, zone, part, hit }], end ('fired' | 'short' |
//       'passed' | 'setup'), drift, grabAtMs, atMarkMs (the floating station's: when you were first at its mark) }], pistolSaid }
// The flow, on lived ticks (anchorsActors, in the arms domain's actors layer): the brief (VOID_CADRE.brief), then each
// station's command at the gap's end; once you stand within arriveM of its mark with its anchor (the footing's anchor and hold
// as footingOf says: 'magBoots' on boots; 'handhold' on a lanyard ('tether') or one hand on a hold; 'braced' in the wedge;
// 'floating', pushed off the mark (been at it since the command) and drifting at driftMinVMs or more, at least floatOutM from it) and
// its gun in hand, the cadre's "Standby." and the turner turns
// after its drawn gap; the string is the station's rounds at that turner, or its exposure (exposeMs) gone; then "Stop." and
// the next station nextGapMs after. A station not reached in moveOnMs of lived time is passed, the cadre saying so, so the
// course never dead-ends; on the floating station the string is followed by the drift: the grab at the first hold it passes (a
// pad-eye in the deck, any hold the footing finds) within driftMaxMs, or the cadre's word that the safety boat will fetch you. The safety boat (boatTick, my
// call) fetches a body that floats still off the deck with no hold in reach for stuckMs: the cadre's word, and boatMs after it the
// body is at the station's mark holding its pad-eye on the boat's line (the station's record counts the tow), so no stop in the open
// well is a dead end. The course's end is the
// 'range' fact 'clear' (the scene's endOn) endAfterMs after the last station's end.
// Each round fired at the course (anchorsShot, handling.js recordShot's branch) is recorded with the footing it was fired
// from (shot.js anchorOf: its row, its recovery factor), its recovery (the shot's recoverMs) against the planted one (the same
// over the row's factor), the push it left on the body (the actor's velocity after the round: B's recoil, zero where the
// footing keeps it), and its hit on the turner (the hit sensor: down at two torso or one head, as the bay's, pairs.js).
//
// anchorsNow(state, ms) is the end card's and the bots' view (the stations, their numbers, the summary); anchorsLook(state, ms)
// the stage's (the turners as the pairs pad draws them, render/range.js, and the anchors a viewer sees: the gear record's hand on a
// hold, lanyard or wedge, with the hold it is on); againAsAnchors(state, tier) what "Again as …" starts.
// The fill is testAnchors. Pure but testAnchors, anchorsActors and anchorsShot, which write the session.
import { TICK_MS } from '../../core/clock.js';
import { q } from '../../core/num.js';
import { stream, intIn } from '../../core/rng.js';
import { hashPick } from '../../core/hash.js';
import { nextId, playerActor, playerId } from '../../core/ids.js';
import { SCENES } from '../../data/scenes.js';
import { COURSES, VOID_CADRE } from '../../data/courses.js';
import { VOID_RANGE, WELL_A } from '../../data/places/phobos.js';
import { enterSite, holdNear } from '../places/model.js';
import { FOOTING } from '../../data/body/needs.js';
import { siteDayOf } from '../jobs.js';
import { setOutfit, syncActors } from '../people/place.js';
import { drawStaff, setPost } from '../people/staff.js';
import { startBody } from '../body/body.js';
import { deltaOf } from '../body/record.js';
import { footingOf, setAnchor, gearAnchorOf, anchorHoldOf } from '../body/footing.js';
import { testSheet, TEST_SHEETS } from '../skills/templates.js';
import { barracks } from './barracks.js';
import { setLedgers } from './tests.js';
import { materialise, move, issueSidearm, wear, handGunOf } from '../arms/kit.js';
import { feed } from '../arms/firearms.js';
import { gunOn } from '../arms/shooting.js';
import { anchorOf } from '../arms/shot.js';
import { turnTo, turnAway, facingOf, TURN_MS } from '../arms/turners.js';
import { BRASS_LIVE } from '../arms/look.js';
import { pendingOf } from '../combat/contact.js';

/** The course's data (courses.js COURSES.anchors). */
const C = COURSES.anchors;
/** The scene's spec. */
const SCENE = SCENES['test-anchors'];
/** test-anchors' setups: station k's command given, the stations before it set up (not scored). */
export const ANCHORS_SETUPS = Object.freeze(['s1', 's2', 's3', 's4', 's5']);
/** The stations (phobos.js STATIONS) and their ids in order. */
export const STATIONS = VOID_RANGE.stations;
/** The hit sensor (the bay's, pairs.js): down at two torso rounds in A or C, or one head round. */
export const STOP_TORSO = 2, STOP_HEAD = 1, SENSOR_MS = 100;
/** The words a footing anchor is said in, on the card and the bots' reads. */
export const ANCHOR_WORDS = Object.freeze({ planted: 'planted', light: 'standing light', magBoots: 'on mag boots', handhold: 'on a hold', braced: 'braced', floating: 'floating' });
const NUM = Object.freeze(['one', 'two', 'three', 'four', 'five']);

const tierOf = (tier) => (tier && TEST_SHEETS[tier] ? tier : SCENE.sheet);
const whole = (ms) => Math.ceil(ms / TICK_MS) * TICK_MS;
const actorOf = (state, pid) => state.actors?.list?.find(a => a.who === pid) ?? null;
/** The session on the anchors course, or null. */
export const anchorsOf = (state) => { const R = state?.armoury?.range; return R && R.course === 'anchors' ? R : null; };
const turnerOf = (R, lane) => (R?.turners ?? []).find(T => T.lane === lane) ?? null;
// (the cadre's word, never while a take-in runs (COMBAT §25.4.5: the window's silence): a text bubble at him)
function cadreSay(state, bus, lines, ...key) {
  const R = anchorsOf(state);
  if (!R || !lines) return;
  const text = hashPick(lines, 'void-cadre', state.meta.seed, ...key);
  bus?.emit('say', { who: R.coachId, text, kind: 'speech', durMs: Math.max(1500, text.length * 60) });
}

// ---- the fill ----

// (a gun made ready, Condition 1 on safe: its first magazine in, a round chambered, as the bay's 'hot' setup does)
function makeReady(state, gunId, magId) {
  const gun = state.items[gunId], mag = state.items[magId];
  if (!gun || !mag) throw new Error(`anchors: no gun ${gunId} or magazine ${magId} to make ready`);
  if (gun.mag !== magId) move(state, magId, { gun: gunId });
  feed(gun, mag);
  gun.belief = { chamber: 'live', count: mag.n, ...(mag.belief?.kind ? { load: mag.belief.kind } : {}) };
  if (mag.belief) delete mag.belief;
  gun.mode = 'safe';
}

/**
 * The fill of 'test-anchors' (see the header): the barracks drawn (Echo Company, you), you moved to Well A at Phobos at the
 * start mark in the combat EVA suit with the house's kit, made ready (the R-7 at low ready, the P-12 holstered, both
 * Condition 1 on safe), mag boots worn and locked, your sheet the tier's; the cadre at his post, booted; the turners edge-on;
 * the session (no tower) and the brief. setup 'sk' starts at station k's command, the stations before it set up.
 */
export function testAnchors(state, { at = null, setup = null, tier = null } = {}) {
  const seed = state.meta.seed, sheet = tierOf(tier), V = VOID_RANGE, keep = state.places?.live?.env ?? null;
  barracks(state);
  const me = playerActor(state), pid = playerId(state), person = state.people[pid];
  const S0 = { ...V.start, ...(at ?? {}) };
  Object.assign(me, { x: S0.x, z: S0.z, face: S0.face ?? 'right', gait: 'idle', strideM: 0 });
  enterSite(state, WELL_A.site, V.area);
  if (keep) state.places.live.env = keep;
  setOutfit(me, 'combatSuit');
  person.body = deltaOf(setLedgers(startBody(person, state.clock.ms, siteDayOf(state), seed), {}));
  person.skills = testSheet(sheet);
  const kit = materialise(state, pid, C.kit);
  const side = issueSidearm(state, pid, { model: C.sidearm.model, mags: C.sidearm.mags });
  const bootsId = wear(state, pid, 'mb-1');
  makeReady(state, kit.gunId, kit.magIds[0]);
  makeReady(state, side.gunId, side.magIds[0]);
  person.kit.carry = { ...(person.kit.carry ?? {}), posture: 'lowReady' };
  const cadrePid = drawStaff(state, 'phobos-void:cadre');
  setPost(state, cadrePid, { area: V.area, x: V.cadre.x, z: V.cadre.z, face: V.cadre.face, outfit: 'combatSuit' });
  const cadreBoots = wear(state, cadrePid, 'mb-1');
  syncActors(state);
  setAnchor(state, pid, 'boots');
  setAnchor(state, cadrePid, 'boots');
  const issueId = nextId(state, 'ai');
  state.armoury.ammoIssues.push({ id: issueId, atMs: state.clock.ms, area: V.area, toId: pid, cal: '6.5x40r', load: C.load, n: C.mags.reduce((a, b) => a + b, 0), fired: 0 });
  const now = state.clock.ms;
  const R = state.armoury.range = {
    course: 'anchors', lane: null, fp: null, roId: cadrePid, coachId: cadrePid, issueId, setMagId: null, set: null, phase: 'brief', string: -1, hot: true, cmd: null, next: null,
    shots: [], brass: [], faults: [], warned: {}, end: null, livedMs: 0, nudged: false, stoppage: null, shown: false, area: V.area, load: C.load,
    turners: V.turners.map(T => ({ key: T.key, lane: T.lane, x: T.x, z: T.z, y: T.y, faceRad: T.faceRad, name: T.name, face: 'threat', holds: 'rifle', turnAtMs: null, awayAtMs: null, hits: [], stoppedAtMs: null })),
    anchors: {
      tier: sheet, st: 0, phase: 'brief', atMs: now, briefEndMs: whole(now + C.briefMs), pistol: side.gunId, rifle: kit.gunId, boots: bootsId, cadreBoots,
      stations: STATIONS.map(s => ({ n: s.n, id: s.id, cmdAtMs: null, readyAtMs: null, turnAtMs: null, endAtMs: null, rounds: [], end: null })),
    },
  };
  if (setup) setupAnchors(state, setup);
  return state;
}

// (a setup 'sk': the stations before k set up (end 'setup'), you where station k's command finds you: at the mark of the one
// before it in its anchor, or at the start; the command at the next whole second)
function setupAnchors(state, setup) {
  const k = ANCHORS_SETUPS.indexOf(setup);
  if (k < 0) throw new Error(`anchors: no setup '${setup}' (${ANCHORS_SETUPS.join(', ')})`);
  const R = anchorsOf(state), A = R.anchors, me = playerActor(state), pid = playerId(state), now = state.clock.ms;
  for (let i = 0; i < k; i++) A.stations[i].end = 'setup';
  if (k > 0) {
    const prev = STATIONS[k - 1];
    Object.assign(me, { x: prev.mark[0], z: prev.mark[1] });
    if (prev.want !== 'magBoots') setAnchor(state, pid, null);
  }
  A.st = k; A.phase = 'gap'; A.atMs = now; A.briefEndMs = now;
  A.nextAtMs = whole(now + 1000);
}

// ---- what the course reads of you ----

/** Whether a person stands at a station's mark with its anchor and its gun (see the header): { ok, near, anchor, gun, why }. */
export function readyAt(state, st, pid = playerId(state)) {
  const me = actorOf(state, pid), R = anchorsOf(state);
  if (!me || !R) return { ok: false, why: 'no session' };
  const F = footingOf(state, pid), dM = Math.hypot(me.x - st.mark[0], me.z - st.mark[1]);
  const gunId = handGunOf(state, pid) ?? gunOn(state, pid), isPistol = gunId && gunId === R.anchors.pistol;
  const gun = st.gun === 'pistol' ? isPistol : gunId === R.anchors.rifle;
  let anchor;
  if (st.want === 'floating') anchor = F.anchor === 'floating';
  else if (st.want === 'handhold') anchor = F.anchor === 'handhold' && F.hold === st.hold;
  else anchor = F.anchor === st.want;
  // (the floating station: pushed off its mark and drifting into the open, at least floatOutM from it and within the well's run to
  // the plates; never a body standing floating somewhere else)
  const drift = Math.hypot(me.v?.[0] ?? 0, me.v?.[1] ?? 0);
  const near = st.want === 'floating' ? !!R.anchors.stations[st.n - 1]?.atMarkMs && dM >= C.floatOutM && dM <= C.floatOutM + 12 && drift >= C.driftMinVMs : dM <= C.arriveM;
  return { ok: near && anchor && gun, near, anchor, gun, dM: q(dM, 0.01), footing: F.anchor, hold: F.hold, why: !near ? 'not at the mark' : !anchor ? `not ${ANCHOR_WORDS[st.want] ?? st.want}` : !gun ? `not the ${st.gun}` : null };
}

// ---- the course, each lived tick ----

/** The course's tick (the arms domain's actors layer, lived only: see the header). */
export function anchorsActors(state, input, bus) {
  const R = anchorsOf(state);
  if (!R || R.end || state.skip) return;
  const A = R.anchors, now = state.clock.ms, st = STATIONS[A.st], rec = A.stations[A.st];
  R.livedMs += TICK_MS;
  // (your drift and spin before any round of this tick, so a round's push is read as what it changed (anchorsShot))
  const me0 = playerActor(state);
  A.vLast = me0 ? [me0.v?.[0] ?? 0, me0.v?.[1] ?? 0, Number.isFinite(me0.tumble) ? me0.tumble : 0] : [0, 0, 0];
  if (A.phase !== 'brief' && A.phase !== 'done' && boatTick(state, bus, A, st, now)) return;
  if (A.phase === 'brief') {
    if (now === A.atMs + TICK_MS) cadreSay(state, bus, VOID_CADRE.brief, 'brief');
    if (now >= A.briefEndMs) { A.phase = 'gap'; A.atMs = now; A.nextAtMs = now; }
    return;
  }
  if (A.phase === 'gap') {
    if (now < A.nextAtMs) return;
    if (A.st >= STATIONS.length) { endCourse(state, bus); return; }
    rec.cmdAtMs = now; A.phase = 'move'; A.atMs = now;
    // (the station that wants the pistol: the weapon group's rows offered while it runs (arms/sidearm.js weaponsHere))
    if (st.gun === 'pistol') A.wantPistol = true; else delete A.wantPistol;
    cadreSay(state, bus, VOID_CADRE.cmd[st.id], 'cmd', st.id);
    return;
  }
  if (A.phase === 'move') {
    // (the floating station counts a push off its mark only: noted once you have been at it since its command)
    if (st.want === 'floating' && rec.atMarkMs === undefined) { const me = playerActor(state); if (me && Math.hypot(me.x - st.mark[0], me.z - st.mark[1]) <= C.arriveM) rec.atMarkMs = now; }
    const r = readyAt(state, st);
    // (station three: the R-7 shouldered at the hold, not the pistol: the cadre's "Pistol." once)
    if (st.gun === 'pistol' && r.near && r.anchor && !r.gun && !A.pistolSaid && gunOn(state, playerId(state)) === A.rifle && state.people[playerId(state)]?.kit?.carry?.posture === 'aimed') {
      A.pistolSaid = true; cadreSay(state, bus, VOID_CADRE.pistol, 'pistol');
    }
    if (r.ok) {
      rec.readyAtMs = now; A.phase = 'standby'; A.atMs = now;
      A.turnAtMs = whole(now + intIn(stream(state.meta.seed, 'anchors:gap', st.n), C.standbyMs[0], C.standbyMs[1]));
      cadreSay(state, bus, VOID_CADRE.standby, 'standby', st.n);
      return;
    }
    if (now - rec.cmdAtMs >= C.moveOnMs) { rec.end = 'passed'; rec.endAtMs = now; cadreSay(state, bus, VOID_CADRE.passed, 'passed', st.n); nextStation(state); }
    return;
  }
  if (A.phase === 'standby') {
    if (now < A.turnAtMs) return;
    const T = turnerOf(R, st.lane);
    turnTo(T, now);
    rec.turnAtMs = now; A.phase = 'string'; A.atMs = now; R.string = A.st;
    bus?.emit('turner', { key: T.key, lane: T.lane, phase: 'turn', face: T.face, atMs: now, toMs: now + TURN_MS, why: 'anchors' });
    return;
  }
  if (A.phase === 'string') {
    const T = turnerOf(R, st.lane), fired = rec.rounds.length;
    const done = fired >= st.rounds, gone = now - rec.turnAtMs >= C.exposeMs;
    if (!done && !gone) return;
    if (pendingOf(state) && !gone) return;
    if (T.awayAtMs === null || T.awayAtMs > now) turnAway(T, now);
    rec.endAtMs = rec.rounds.at(-1)?.atMs ?? now;
    rec.end = done ? 'fired' : 'short';
    if (st.want === 'floating' && done) { A.phase = 'drift'; A.atMs = now; cadreSay(state, bus, VOID_CADRE.drift, 'drift'); return; }
    cadreSay(state, bus, done ? VOID_CADRE.stop : VOID_CADRE.short, done ? 'stop' : 'short', st.n);
    nextStation(state);
    return;
  }
  if (A.phase === 'drift') {
    const F = footingOf(state, playerId(state)), me = playerActor(state);
    if (F.anchor !== 'floating') {
      rec.grabAtMs = now; rec.grab = F.hold;
      cadreSay(state, bus, VOID_CADRE.grabbed, 'grabbed');
      nextStation(state);
    } else if (now - A.atMs >= C.driftMaxMs) {
      rec.grab = null;
      cadreSay(state, bus, VOID_CADRE.lost, 'lost');
      nextStation(state);
    }
  }
}
// (the safety boat (see the header): stuck floating still with no hold in reach for stuckMs, the cadre's word; boatMs after it, you are
// fetched to the station's mark (the last's, after the course's) holding its pad-eye on the boat's line; the station's record notes the
// tow. Returns whether the tick was the boat's)
function boatTick(state, bus, A, st, now) {
  const pid = playerId(state), me = playerActor(state);
  if (!me) return false;
  if (A.boat) {
    if (now < A.boat.atMs) return true;
    const to = (st ?? STATIONS.at(-1)).mark;
    Object.assign(me, { x: to[0], z: to[1] });
    for (const k of ['v', 'push', 'tumble', 'tumbleRad', 'aimFrom']) delete me[k];
    setAnchor(state, pid, null);
    setAnchor(state, pid, 'handhold');
    const rec = A.stations[A.st];
    if (rec) rec.towed = (rec.towed ?? 0) + 1;
    delete A.boat; delete A.stuckAtMs;
    cadreSay(state, bus, VOID_CADRE.towed, 'towed', now);
    return true;
  }
  const F = footingOf(state, pid), still = Math.hypot(me.v?.[0] ?? 0, me.v?.[1] ?? 0) < 0.02 && !me.push;
  // (off the deck is free fall's own height, actor.floatY (the review of v0.0.24's A to C moved it off actor.y, the floor a body stands
  // on: read here as y, the boat never came, and a recruit landed still in the plates' mouth floated there till the station passed:
  // the v0.0.24 integration)
  if (F.anchor !== 'floating' || !still || holdNear(state, me.x, me.z, FOOTING.REACH_M) || !(me.floatY > 0 || me.y > 0)) { delete A.stuckAtMs; return false; }
  A.stuckAtMs ??= now;
  if (now - A.stuckAtMs < C.stuckMs) return false;
  A.boat = { atMs: whole(now + C.boatMs) };
  cadreSay(state, bus, VOID_CADRE.lost, 'boat', now);
  return true;
}
function nextStation(state) {
  const A = anchorsOf(state).anchors, now = state.clock.ms;
  delete A.wantPistol;
  A.st += 1; A.phase = 'gap'; A.atMs = now;
  A.nextAtMs = whole(now + (A.st >= STATIONS.length ? C.endAfterMs : C.nextGapMs));
}
function endCourse(state, bus) {
  const R = anchorsOf(state), now = state.clock.ms;
  R.anchors.phase = 'done'; R.anchors.atMs = now; R.phase = 'clear'; R.hot = false;
  cadreSay(state, bus, VOID_CADRE.end, 'end');
  R.end = { phase: 'clear', atMs: now, why: null };
  bus?.emit('range', { phase: 'clear', cmd: null, hot: false, rule: null, kind: null, text: null });
}

/** The course's rules (the arms domain's rules layer on this course, in place of the bay's): none of the bay's box or lanes holds in Well A. */
export function anchorsRules() {}

// ---- the shots ----

/**
 * A shot recorded on the anchors course (handling.js recordShot's branch; see the header): the issue's count, the session's
 * shots and brass (the stage's blast and cases), the round on its station's record with the footing it was fired from and the
 * push it left, the turner's hits and the hit sensor.
 */
export function anchorsShot(state, bus, shot) {
  const R = anchorsOf(state);
  if (!R) return;
  const pid = playerId(state), mine = (shot.who ?? pid) === pid, now = shot.atMs ?? state.clock.ms;
  if (shot.fired && mine) {
    const issue = state.armoury.ammoIssues.find(a => a.id === R.issueId);
    if (issue) issue.fired += 1;
    R.shots.push({ id: shot.id, atMs: now, lane: null, string: R.string, hole: null, score: 0, v: false, logSeq: shot.logSeq ?? null, key: shot.target ?? null, ...(shot.load && shot.load !== 'ball' ? { load: shot.load } : {}) });
    if (R.shots.length > 100) R.shots.splice(0, R.shots.length - 100);
    if (shot.brassRec) { R.brass.push(shot.brassRec); if (R.brass.length > BRASS_LIVE) R.brass.splice(0, R.brass.length - BRASS_LIVE); }
  }
  if ((!shot.fired && shot.why === 'dud') || shot.stoppage) R.stoppage = { atMs: now, kind: shot.stoppage === 'double' ? 'double' : shot.stoppage ? 'stovepipe' : 'dud', set: false, cleared: false };
  if (!shot.fired || !mine) return;
  const A = R.anchors, st = STATIONS[A.st], rec = A.stations[A.st];
  const T = shot.target ? (R.turners ?? []).find(x => x.key === shot.target) ?? null : null, zone = shot.zone ?? null, part = shot.part ?? 'torso';
  const hit = !!T && zone !== null;
  if (hit) {
    T.hits.push({ shotId: shot.id, part, zone, ring: !!shot.ring, through: !!shot.through, at: shot.hole?.at ?? null, atMs: now });
    const torso = T.hits.filter(h => h.part === 'torso' && (h.zone === 'A' || h.zone === 'C')).length, head = T.hits.filter(h => h.zone === 'head').length;
    if (T.stoppedAtMs === null && (torso >= STOP_TORSO || head >= STOP_HEAD)) {
      T.stoppedAtMs = now; turnAway(T, now + SENSOR_MS);
      bus?.emit('turner', { key: T.key, lane: T.lane, phase: 'away', face: T.face, atMs: T.awayAtMs, toMs: T.awayAtMs + TURN_MS, why: 'hit' });
    }
  }
  // (a round of the string: fired while its turner faces, at it or not (a round into the berm is the string's too))
  if (!st || A.phase !== 'string') return;
  const anc = anchorOf(state, pid, { gunId: shot.gun ?? gunOn(state, pid) }), me = playerActor(state);
  const recoverMs = Number.isFinite(shot.recoverMs) ? shot.recoverMs : null;
  // (the push the footing kept: the body's drift and spin after the round against before it (A.vLast, the tick's or the last round's))
  const v1 = [me?.v?.[0] ?? 0, me?.v?.[1] ?? 0, Number.isFinite(me?.tumble) ? me.tumble : 0], v0 = A.vLast ?? [0, 0, 0];
  A.vLast = v1;
  const push = { vMs: q(Math.hypot(v1[0], v1[1]), 0.001), dvMs: q(Math.hypot(v1[0] - v0[0], v1[1] - v0[1]), 0.001), spinRadS: q(Math.abs(v1[2]), 0.001), dSpinRadS: q(Math.abs(v1[2] - v0[2]), 0.001) };
  rec.rounds.push({ shot: shot.id, atMs: now, anchor: anc.row, hold: anc.footing?.hold ?? null, oneHand: !!anc.oneHand, recoverMs, plantedMs: recoverMs !== null && anc.recover ? Math.round(recoverMs / anc.recover) : null,
    push, at: st.lane === T?.lane ? 'target' : T ? 'other' : 'none', zone: hit ? zone : null, part: hit ? part : null, hit });
}

// ---- the views ----

/** The stage's turners on the anchors course, in the pairs pad's shape (render/range.js draws them), or null off it. */
export function anchorsLook(state, ms = state.clock.ms) {
  const R = anchorsOf(state);
  if (!R) return null;
  const turners = (R.turners ?? []).map(T => ({
    key: T.key, lane: T.lane, x: T.x, z: T.z, y: T.y, faceRad: T.faceRad, facingK: q(facingOf(T, ms), 0.001), face: T.face, holds: T.holds,
    holes: T.hits.filter(h => h.at && h.atMs <= ms).map(h => ({ xCm: h.at[0], yCm: h.at[1], zone: h.zone, ring: !!h.ring, atMs: h.atMs })),
    down: T.stoppedAtMs !== null && T.stoppedAtMs <= ms, plateAtMs: null,
  }));
  // (the anchors a viewer sees (the gear record's, footing.js gearAnchorOf): a hand on a hold or a lanyard drawn to the hold it is on
  // (footing.js anchorHoldOf), the wedge across the passage where the body is; the boots are on the figure)
  const anchors = [];
  for (const a of state.actors?.list ?? []) {
    const kind = a.who ? gearAnchorOf(state, a.who) : null;
    if (kind !== 'hold' && kind !== 'lanyard' && kind !== 'wedge') continue;
    const h = kind === 'wedge' ? null : anchorHoldOf(state, a.who);
    // (y the body's height off the deck: free fall's actor.floatY (the fixer of v0.0.24's code review: it read actor.y, the floor)
    anchors.push({ who: a.who, kind, x: a.x, z: a.z, y: Number.isFinite(a.floatY) ? a.floatY : 0, ...(h ? { hold: { x: h.x, z: h.z, kind: h.kind } } : {}) });
  }
  return { line: null, turners, lines: [], bangs: [], anchors };
}

/**
 * The course now (the card's and the bots' view): { tier, phase, st, station (the one now: its id, want, gun, mark, rounds,
 * ready), stations (each: n, id, want, end, hits, rounds, timeMs from its command to its last round, anchors fired from,
 * recovery and planted ms, the push kept, the drift and the grab), summary, end }.
 */
export function anchorsNow(state, ms = state.clock.ms) {
  const R = anchorsOf(state);
  if (!R) return null;
  const A = R.anchors, st = STATIONS[A.st] ?? null;
  const stations = A.stations.map((x, i) => {
    const s = STATIONS[i], hits = x.rounds.filter(r => r.hit).length;
    const recov = x.rounds.map(r => r.recoverMs).filter(Number.isFinite), plant = x.rounds.map(r => r.plantedMs).filter(Number.isFinite);
    const mean = (a) => (a.length ? Math.round(a.reduce((p, v) => p + v, 0) / a.length) : null);
    return { n: s.n, id: s.id, want: s.want, gun: s.gun, dM: s.dM, end: x.end, rounds: x.rounds.length, of: s.rounds, hits,
      timeMs: x.cmdAtMs !== null && x.endAtMs !== null ? x.endAtMs - x.cmdAtMs : null, moveMs: x.cmdAtMs !== null && x.readyAtMs !== null ? x.readyAtMs - x.cmdAtMs : null,
      anchors: [...new Set(x.rounds.map(r => r.anchor))], oneHand: x.rounds.some(r => r.oneHand), recoverMs: mean(recov), plantedMs: mean(plant),
      pushMs: x.rounds.length ? Math.max(...x.rounds.map(r => r.push?.dvMs ?? 0)) : null, spinMs: x.rounds.length ? Math.max(...x.rounds.map(r => r.push?.dSpinRadS ?? 0)) : null,
      drift: x.rounds.length && s.want === 'floating' ? { vMs: x.rounds.at(-1).push.vMs, spinRadS: x.rounds.at(-1).push.spinRadS } : null, grab: x.grab ?? null, grabAtMs: x.grabAtMs ?? null, towed: x.towed ?? 0 };
  });
  const scored = stations.filter(s => s.end !== 'setup'), hits = scored.reduce((a, s) => a + s.hits, 0), rounds = scored.reduce((a, s) => a + s.of, 0);
  const passed = scored.filter(s => s.end === 'passed').length;
  const summary = `${hits} of ${rounds} hits · ${scored.filter(s => s.end === 'fired').length} of ${scored.length} stations fired${passed ? ` · ${passed} passed` : ''}`;
  return { tier: A.tier, phase: A.phase, st: A.st, station: st ? { n: st.n, id: st.id, want: st.want, hold: st.hold, gun: st.gun, mark: st.mark, rounds: st.rounds, lane: st.lane, ready: readyAt(state, st) } : null,
    stations, summary, end: R.end, cmdAtMs: A.stations[A.st]?.cmdAtMs ?? null, turnAtMs: A.turnAtMs ?? null, words: st ? NUM[st.n - 1] : null };
}

/** rangeNow's shape on the anchors course (handling.js rangeNow), its summary the end card's line: no lane, no line's box (Well A has none). */
export function anchorsRangeNow(state, R, ms = state.clock.ms) {
  const N = anchorsNow(state, ms), hits = N.stations.reduce((a, s) => a + (s.end === 'setup' ? 0 : s.hits), 0), shots = N.stations.reduce((a, s) => a + (s.end === 'setup' ? 0 : s.rounds), 0);
  return {
    course: R.course, lane: null, phase: R.phase, string: R.string, cmd: null, cmdI: null, cmdAtMs: null, hot: R.hot, observerId: R.coachId, roId: R.roId, paper: 'man',
    line: null, strings: N.stations, end: R.end, anchors: N, summary: N.summary,
    score: { shots, hits, faults: R.faults.length, clearAtMs: R.end?.phase === 'clear' ? R.end.atMs : null }, dry: false,
  };
}

/** What "Again as …" starts: the same seed on another sheet. */
export function againAsAnchors(state, tier) { return { seed: state.meta.seed, tier: tierOf(tier) }; }
