// OLYMPUS sim: the bundles, the drill's steps for a slot and a rung, run through the stepper, and where they hand the decision back (COMBAT §25.2, §25.5, §25.7, §25.8; BODY §16.2; the build sheet 0.0.12 §2.2, §4, §8 items 2, 4, 8, 9, 20).
//
// What T does grows with the rung, the mechanics never change (the user, 2026-11-07: "no watering down but factor in
// experience in how smooth and fast we do things"): a bundle is the drill's beats (src/sim/combat/drills/enter-and-clear.js)
// planned for a door of the lane (src/sim/combat/room.js roomPlanOf: its stack, points, paths, corners, hot spots),
// a slot (1, the player's; 2, the #2's) and a rung, and run by the stepper (src/sim/combat/stepper.js), which runs the
// beats one at a time to rung 2 and lets the hands and the voice (rung 3) and the eyes (rung 4) work while the feet move.
//
// The beats' times (the build sheet's §4, each my call, reproducing §4's 1 G table):
//   move     the plan's path, routed round the walls on the nav (route.js routed: from 2026-11-11 every leg not clear at
//            the walker's C0 goes the nav's way, the bundle's own doors counted open), at the stance's walk
//            (motion.js gaitSpeeds: Combat 1.23, Assault 2.03 m/s at 1 G), pushing
//            and braking at BODY §16.2's legs (motion.js tractionOf: the private 3.12 and 5.07 m/s² with 25 kg on 75), as
//            a closed-form trapezoid (moveAt): rest to rest below rung 4, the approach flowing into the entry at rung 4
//            (it leaves the stack at the Combat walk and the entry speeds up into the Assault lope); its arriveMs is when
//            ARRIVE_M 0.6 m are left, the flowing hand's cue on the door
//   posture  high ready HIGH_READY_S 0.3 × the rifle's HIGH_READY_K 1.15 × paceOf(WH)
//   aim:point the muzzle onto the door: shot.js aimS's sight and turn (AIM.sight × pace + 20° / (90 + 6 WH)), no feet
//   door     the hand DOOR_HAND_S 0.2 × paceOf(WH), then the leaf's swing (the opening's openS, doors.js DOOR_S 0.4 s);
//            a pull adds PULL_STEP_S 0.3 × pace (the step aside); a kick is KICK_S 1.2 s, Fitness against the door's
//            kickDc (an unlocked door KICK_DC_OPEN 8), failed ×FAIL_K 1.6 and the bundle handed back ("Locked. Kick it
//            again, or hold it."); its passMs the leaf passable: open below rung 3, at PASS_SHARE two thirds open from 3
//   scan     the eyes: deg / (120 + 6 AWR) + 0.2 × paceOf(AWR) (the corner: from the path's heading to the slot's corner;
//            the sector: from the corner across to the farthest hot spot the slot holds); a held sector while it runs
//   call     CALL_S 0.8 s ("Clear!", "Ready"), CALL_FLOW_S 0.2 from rung 3 (said over the move)
//   mark     MARK_S 0.6 × paceOf(WH)
//   wait     the #2's seam: react.js goMs(WF)
// A failed roll (the kick) is ×FAIL_K; a rushed bundle (Shift) ×RUSH_K 0.6 on every beat but the feet's and −3 on its
// rolls, never routine (the fixer's of 0.0.12: a move's time is its profile's, the legs' limit, so a rushed walk scaled by
// time alone stopped 40% short of the stack; the hands, the eyes and the voice are what hurry). The approach and the moves read the gravity and the floor where they start (env.js gravityAt, surfaceAt:
// nothing assumes Mars or 1 G).
//
// The rows (shooting.js stepsOf reads them in the house): singleRows (every rung: Stack up, the door's rows by its
// swing and lock, Watch a hot spot, Look at one, Move to the point or the hall's end, Hold it, "Clear!", Mark, the
// stances, X go) and bundleRows (the rung's bundles at the lane's door, offered by templates.js offered: the rung reached
// and lived once by hand; a bundle of the rung not yet lived struck "by hand first"). **Below rung 2 nothing but the keys
// crosses a door's plane into a room not yet cleared** (the user: "then would move in using movement keys (game unpaused
// with X)"): rung 0 and 1 rows end at the stack and the door; Move to the point is offered only once past the threshold.
// A bundle never fires, picks, reloads, spends or crosses a door the plan does not take.
//
// Hand-backs (COMBAT §25.8.2; the rest queued as the panel's "Carry on: …", state.stop.carry): a person newly seen
// (contact.js halts the bundle at the pause, 'contact'), an identified no-shoot ('noshoot'), a door that will not open
// ('refused': "Locked. Kick it, or hold it."), a door the plan does not take ('door-unplanned': "Door, east wall. Hold it
// or clear it?"), the #2 over TWO_SLOT_M 1.5 m from his slot TWO_WAIT_MS 3 s after #1 is stacked ('two': "Your number
// two's not with you."), the gun, a failed roll not routine, a seam below the rung, the lane's end; Backspace or X stops
// it after the beat ('stop').
//
// The #2 (runSlot): the same plan for slot 2 (his stack 0.65 m behind, his point and corner the plan's second), one group
// at a time with react.js goMs between below rung 3, the whole room from 3, his beats at his own rung; his entry cued by
// distance (the rework's R5, below; v0.0.12 cued it on #1's first step into the doorway); nothing new while he is on a man (his
// take-in, his row: the scene's), and his room swept only by a Dominate that ran to its end. His shots are the scene's (shoothouse.js).
// bundleNow is the face's view of a running bundle: its lanes of glyphs and its time.
// The variants are rows set at no time (setVariant, state.stop.variant: "Push ⇄ Kick", "Assault ⇄ Combat"; the plans give
// one path a slot, so "Cross ⇄ Hook" waits); a variant rides the bundle's row id ('drill:room:clear@combat>o:w4:r1').
// A halted bundle's rest is state.stop.carry ({ from, bundle, door, rung, variant, beats, why, words, paths: the cut moves'
// rest of path }), carried on from where the body stands (carryRow, carryOn); a shot row fired moving on carries it on at
// its end when nobody of the contact stands (shooting.js: "the drill carries on", COMBAT §25.5.3). The hand-backs asked once
// (the #2's wait at a door, an inner door) are kept on the house's record (R.house.asked), so "Carry on" goes on; a kicked
// lock on R.house.broken, a door read on R.house.read. Below rung 3 the entry's muzzle goes straight in (the door's inward
// normal) and the body faces into the room (the beat's `look`); from rung 3 the eyes and the head are on the slot's corner
// (the beat's `eyes`: react.js reads it as a held sector); a scan sweeps the head (`sweep`, shooting.js stopRules).
// 2026-11-12 (the shoot house's rework R3, COMBAT §25.19.3): **the flow**. From rung 2 a contact's pause suspends the
// player's bundle instead of cutting it (contact.js; stepper.js suspendFlow): the doing moves to state.stop.flow, its beats
// untouched, and the choice is made with time standing still. A list step chosen then (a shot row, the aim, Fire, a reload,
// IMMEDIATE ACTION: flowIn) runs on the hands **inside** the flow, the flow taken up beside it (stepper.js resume with the
// hands held), so the feet go on to the point while the rounds go; a step that needs the feet (Hold him, Challenge, a
// stance, a Wait, the shot with "stop here") halts the flow as v0.0.12 halted it, its rest the panel's "Carry on: …". When
// the step ends (flowAfter) the drill goes on by itself, the bundle the doing again, with no stop and no "Carry on", unless
// a decision is owed: a man of your own corner still up and facing, a window open, a reflex card, a macro's rest; then
// the flow is suspended again and the game stands still. "Carry on" at a suspension takes the flow up with nothing beside
// it (a no-shoot's, the #2's man's). The rifle brought back to high ready first where the step left it aimed (`up`, as
// carryPlan's). Below rung 2 everything is as built (the walk in by the keys, the feet's brake at the window's end).
// The beats amended (§25.19.2.1): `ready` by slot (#1 high ready, the #2 and later low ready, muzzle down: CALL 97-20),
// the muzzle onto the door #1's only; the inner door asked from the point (`inner`, after the sector and the feet at the
// point, never from the doorway); "Clear!" waits on the scene's ready-to-clear predicate (useClearGate: a window open, a
// man turned under a second ago and not yet seen, a turner whose trigger fired and has not turned) up to CLEAR_HOLD_MS,
// then hands back ('clear'), and a man of the room up and facing suspends it from rung 2 (the shot resumes it); the
// crossing rule (crossTick): a move whose next CROSS_AHEAD_MS would carry an aimed muzzle's line across a teammate brings
// the rifle to low ready for the crossing and back after (the move kind's own rule, at every rung).
// 2026-11-12 (the rework's R4, COMBAT §25.19.2, §25.19.4): **the catalogue** (drills/enter-and-clear.js MUSCLE): one door a row
// (the lane's bundle withdrawn: planBundle plans a single door, its approach routed from wherever the body stands); the rows
// by group and slot, every row at every rung, a row above the rung greyed with its rung and paged last (later), the explosive
// breach greyed "no charge issued"; rung 2's groups Stack up, take point, "Open, in: your corner" and Dominate (the #2's
// runSlot the same groups); the labels in a marine's words for the door ("Open", "Kick", gone where it stands open), a
// Top up on the way named where the row will do it (reorgOf: the reorg beat, drills.js runMacro on the hands); the read and
// the tell at the stack, "Room clear!" ending every room row; the stances named for what they trade (STANCE_NAMES: Careful,
// Fast) and the first switch said in one line (state.mind.hints.stance); the standing order's row from rung 4 (setVariant
// keeps it on the house's record, contact.js byOrder fires it); upgradeMuscle maps a save's withdrawn rows.
// 2026-11-12 (the rework's R5, COMBAT §25.19.3.4, §25.19.5): **the #2 beside you**. His entry is cued by distance (entryGo): your
// centre ENTRY_GAP_M 0.75 m past your own threshold waypoint along your path (pastWaypointM), or, your walk in known, ahead of time
// so that he reaches his own threshold as you reach that (entryAhead, his time from his stack planned once and kept on his record);
// a #1 who stops inside by the keys cues him ENTRY_WAIT_MS later. Every tick of his walks holds the body gap (gapHold): his next
// place closing within BODY_GAP_M 0.50 m (+ GAP_GUARD_M) of you holds his walk a tick, counted on his record (rec.gap), which the
// cue should leave idle. He goes to the next stack with you: not before your own move starts, or you are LEAD_GONE_M from where you
// stood (leadGone), then after the least delay that keeps his walk GIVE_MARGIN_M more off yours (giveWay: both closed forms, a
// tick at a time). His own Top up rides his walk to the stack (`reorg`, his slot too, on his hands at every rung): "Reloading!",
// then "Up." (TWO_SAY).
// 2026-11-13 (the rework's R8b, fluid movement; the user: "soldiers need to stay fluidly moving"): **the #2 never waits in a
// doorway** (src/sim/places/zones.js's no-stop zones). He steps into one only when his way through it is clear of you
// (crossingClear: you not standing within the body gap of his path through it and CROSS_CLEAR_M past; you on the move are no
// block, since you never come to rest in one but by your own choice), so blocked he holds at his stack, outside it; a walk
// already under way is held at its edge the same way (zoneGate, counted on his record, rec.gate); and his free body, whose
// brake would leave him at rest in one (his take-in, his row), is carried through to his next point past it on his own lane
// (freeBody: places/move.js throughTick, held off you by the body gap), his head left on his man.
// Pure but startBundle, stopBundle, carryOn, startSingle, runSlot, flowIn, flowAfter, crossTick and the beat handlers,
// which write the doing records, the actors, the doors and the facts.
import { holdTime, releaseTime, TICK_MS } from '../../core/clock.js';
import { q } from '../../core/num.js';
import { stream } from '../../core/rng.js';
import { playerActor, playerId } from '../../core/ids.js';
import { G0_MS2 } from '../../core/phys.js';
import { paceOf } from '../skills/skills.js';
import { check, oddsOf } from '../skills/checks.js';
import { sheetOf, valueOf, rungOf, offered } from '../skills/templates.js';
import { gaitSpeeds, tractionOf, MOVE_STANCES } from '../body/motion.js';
import { gravityAt, surfaceAt } from '../places/env.js';
import { openingOf, openingArea, openingState, setOpening, leafClosed } from '../places/model.js';
import { DOOR_S, leafAt } from '../places/doors.js';
import { AIM } from '../arms/shot.js';
import { facingOf } from '../arms/turners.js';
import * as KIT from '../arms/kit.js';
import { halfOrLess, fullerAtHand } from '../arms/kit.js';
import { goMs } from './react.js';
import { registerKind, useBeats, advanceBeats, halt as haltDoing, flowOf, profileOf, profileAt, profileWhen, moveAt, moveNow, pathLen, suspendFlow, resume, release, markOf, pauseScans } from './stepper.js';
import { muzzleOf, flagsAt } from '../arms/carry.js';
import { relook, ORDER_RUNG } from './contact.js';
import { ENTER_AND_CLEAR, bundleDef, beatsOf, BUNDLES, ARRIVE_M, PASS_SHARE, REMOVED, MUSCLE } from './drills/enter-and-clear.js';
import { beliefOf } from '../arms/firearms.js';
import { macroMs, runMacro } from '../arms/drills.js';
import { rollerOf } from './roll.js';
import { roomPlanOf, lanePlanOf, pastThreshold, inFunnel } from './room.js';
import { routed } from './route.js';
import { coastTo, throughTick, throughAway, stepAside } from '../places/move.js';
import { liveZoneAt } from '../places/zones.js';
import { locoStep } from '../body/loco.js';
import { COURSES } from '../../data/courses.js';
import { HOUSE1 } from '../../data/places/wheel.js';

/** The beats' times (see the header), s at pace 1 unless named. */
export const HIGH_READY_S = 0.3, HIGH_READY_K = 1.15, DOOR_HAND_S = 0.2, PULL_STEP_S = 0.3, KICK_S = 1.2, READ_S = 0.7, CALL_S = 0.8, CALL_FLOW_S = 0.2, MARK_S = 0.6;
/** The rung from which the approach flows into the entry at the Combat walk, never stopping at the stack (COMBAT §25.19.8 F6: "the feet never stop between the stack and the point", rung 3 and up; the rework's R4: rung 4 before). */
export const FLOW_IN_RUNG = 3;
/** The explosive breach's count, s (COMBAT §25.19.2.1: "a count of 2 to 3 s"; data only until a charge is issued). */
export const BREACH_S = 2.5;
/** The eyes' turn (a look, a scan): deg / (LOOK_TURN_BASE + LOOK_TURN_PER × AWR) + LOOK_S × paceOf(AWR); a Watch: AIM.turn's rate + WATCH_S × paceOf(WH). */
export const LOOK_TURN_BASE = 120, LOOK_TURN_PER = 6, LOOK_S = 0.2, WATCH_S = 0.4;
/** A door unlocked kicks against KICK_DC_OPEN; a failed roll takes FAIL_K its time; a rushed bundle RUSH_K its time and RUSH_V on its rolls. */
export const KICK_DC_OPEN = 8, FAIL_K = 1.6, RUSH_K = 0.6, RUSH_V = -3;
/** The #2's place: over TWO_SLOT_M from his slot TWO_WAIT_MS after #1 is stacked hands back (the build sheet 0.0.12 §4). */
export const TWO_SLOT_M = 1.5, TWO_WAIT_MS = 3000;
/** Your "Clear!" waits on the #2's entry and sweep of the room at most this long (ms; my call), and on his man without limit. */
export const CLEAR_WAIT_MS = 5000;
/** The #2 away and not walking to his slot: the hand on the door looks again this often (ms; my call). */
export const TWO_POLL_MS = 500;
/** Stacked: within STACK_NEAR_M of the slot's stack point; the door's rows within DOOR_REACH_M of its middle. */
export const STACK_NEAR_M = 0.3, DOOR_REACH_M = 1.5;
/** Off the line's longest step to the wall (COMBAT §25.19.6, §25.19.9; arms/sidearm.js), metres. */
export const COVER_STEP_M = 1.5;
/** The body under the kit when the person record gives none, and the kit when kit.js cannot weigh it (the build sheet §4: 25 kg on 75). */
export const BODY_KG = 75, KIT_KG = 25;
/** "Clear!" waits on the scene's ready-to-clear predicate at most this long, then hands back (ms; COMBAT §25.19.9). */
export const CLEAR_HOLD_MS = 4000;
/** A "Clear!" the scene found void is said again, after its beat, at most this many times (my call: past APPEAR_MS's second at the call's 0.2 s). */
export const CALL_AGAIN_N = 8;
/** The crossing rule (COMBAT §25.19.2.1): the next CROSS_AHEAD_MS of a move looked at, every CROSS_STEP_MS (ms; my calls). */
export const CROSS_AHEAD_MS = 500, CROSS_STEP_MS = 100;
/** The #2's entry behind #1 (COMBAT §25.19.3.4, §25.19.9): cued once #1's centre is ENTRY_GAP_M past his own threshold waypoint along his path (about 0.4 s at the tier one's lope), or, off his path (the keys), past the threshold that far from it; a #1 who stands inside ENTRY_WAIT_MS cues him all the same, the body gap holding him off (my call: never a dead end). */
export const ENTRY_GAP_M = 0.75, ENTRY_WAIT_MS = 1000;
/** The body gap (COMBAT §25.19.9): a team member's move is held a tick at a time while its next place would close within BODY_GAP_M + GAP_GUARD_M of the other's body; the #2 leaves for a stack only when his walk keeps GIVE_MARGIN_M more than that off yours, looked at every GIVE_STEP_MS of delay up to GIVE_MAX_MS, GIVE_TAIL_MS past both walks' ends (m, ms; my calls). */
export const BODY_GAP_M = 0.50, GAP_GUARD_M = 0.02, GIVE_MARGIN_M = 0.1, GIVE_STEP_MS = 100, GIVE_MAX_MS = 4000, GIVE_TAIL_MS = 500;
/** #1 has gone for the next stack (the #2 goes with him): his own move running, or this far from where he stood when the #2 began to wait (m; the keys). */
export const LEAD_GONE_M = 0.5;
/** The words of the hand-backs (COMBAT §25.8.2). */
export const HANDBACK_WORDS = Object.freeze({
  refused: 'Locked. Kick it, or hold it.', 'refused-kick': 'Locked. Kick it again, or hold it.', 'door-unplanned': 'Door, {wall}. Hold it or clear it?',
  // (the lane's own door has no Hold it row, and a door not locked that held a kick is not locked (the fixer's of 0.0.12))
  'refused-lane': 'Locked. Kick it.', 'refused-kick-lane': 'Locked. Kick it again.', 'refused-held': 'It held. Kick it again.',
  two: "Your number two's not with you.", 'lane-end': 'End of the lane.', gun: 'The gun.', fail: 'Fumbled.', seam: null, contact: null, noshoot: null, stop: null, clear: 'Not clear yet.',
  twoMan: "Your two's on a man.",
});
/** The calls' words. */
export const SAY = Object.freeze({ clear: 'Clear!', ready: 'Ready.', roomclear: 'Room clear!', hallclear: 'Hall clear!', tell: 'Opens in, I go left.' });

const D2R = Math.PI / 180;
const wrap = (a) => ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const r2 = (x) => q(x, 0.01);

// ---- who: the actor, the skills, the body ----

/** A person's actor (the player's, or an NPC's in actors.list), or null. */
export const actorOf = (state, pid) => (playerId(state) === pid ? playerActor(state) : state.actors?.list?.find(a => a.who === pid) ?? null);
/** The skills a bundle's times read: { wf, mrk, wh, awr, fit }. */
export function skillsOf(state, pid) {
  const v = (k) => valueOf(state, pid, k);
  return { wf: sheetOf(state, pid)?.os ?? 0, mrk: v('marksmanship'), wh: v('weapons'), awr: v('awareness'), fit: v('fitness') };
}
/**
 * The #2 hurries to the next stack (planBundle's `hurry`, his approach at Fast) when his walk there is this much longer than
 * yours (m; my call, R9): longer than that he would stand more than about the body gap off his slot when you stand on yours.
 * At 0.5 m he hurried on nearly every leg, and the keys' recruit's lane on 48213 fell to 11.2% under the routed v0.0.12
 * figure F21 holds him to (the hall's "Clear!", which waits on his sweep, 1.9 s sooner).
 */
export const HURRY_M = 1.0;
/** The legs and the speeds where a body stands (see the header): { pushMs2, brakeMs2, walk: { relaxed, combat, assault } }. */
export function legsOf(state, pid, x, z) {
  const a = actorOf(state, pid), gx = x ?? a?.x ?? 0, gz = z ?? a?.z ?? 0;
  const gG = gravityAt(state, null, gx, gz).gG, mu = surfaceAt(state, null, gx, gz)?.mu;
  const loadKg = (typeof KIT.kitMassKg === 'function' ? KIT.kitMassKg(state, pid) : null) ?? KIT_KG;
  const t = tractionOf({ gMs2: gG * G0_MS2, mu: Number.isFinite(mu) ? mu : 0.6, effFitness: skillsOf(state, pid).fit, massKg: BODY_KG, loadKg });
  const walk = Object.fromEntries(MOVE_STANCES.map(s => [s, gaitSpeeds({ gG, gait: s }).walkMs]));
  return { ...t, walk, gG };
}

// ---- the plan: the lane and its doors ----

/** The lane's plans, in order, or null where no lane is laid (room.js lanePlanOf). */
export const laneOf = (state) => { try { return lanePlanOf(state); } catch { return null; } };
/**
 * A move's polyline made walkable on the area's grid (route.js routed: every leg the nav's where its line is not clear,
 * the doors in `open` counted open: the bundle's own, whose door beat swings the leaf first). The user, 2026-11-11:
 * "Operators path through walls when automatic pathing" (every move here was straight lines between the plan's points
 * and the body, placed with no collision).
 */
export const wayOf = (state, pts, open = []) => routed(state, pts, { area: state.places?.live?.area ?? laneOf(state)?.area ?? null, open });
// (the doors a bundle's beats open: their plans' doors)
const doorsOf = (beats) => [...new Set(beats.map(b => b.door).filter(Boolean))];
/** A plan by door id ('hall' the last leg), or null. */
export const planOf = (state, door) => { if (!door) return null; try { return door === 'hall' ? laneOf(state)?.plans?.hall ?? null : roomPlanOf(state, door); } catch { return null; } };
// (the scene's room records, if the house rides the range session: shoothouse.js R.house.rooms)
const houseOf = (state) => state.armoury?.range?.house ?? null;
const DONE_ROOM = new Set(['clear', 'passed']);
/**
 * The lane's door now (see the header): the scene's first room not clear, else (no scene) the plan nearest the actor
 * within 8 m: { door, plan, i, rec } or null.
 */
export function doorNow(state, pid = playerId(state)) {
  const lane = laneOf(state);
  if (!lane) return null;
  const H = houseOf(state);
  if (H?.rooms?.length || H?.hall) {
    const recs = [...(H.rooms ?? []), ...(H.hall ? [{ ...H.hall, door: 'hall' }] : [])];
    for (let i = 0; i < lane.order.length; i++) {
      const door = lane.order[i], rec = recs.find(r => (r.door ?? r.id) === door) ?? recs[i] ?? null;
      if (rec && DONE_ROOM.has(rec.state)) continue;
      return { door, plan: lane.plans[door] ?? planOf(state, door), i, rec };
    }
    return null;
  }
  const a = actorOf(state, pid);
  let best = null;
  for (let i = 0; i < lane.order.length; i++) {
    const door = lane.order[i], plan = lane.plans[door] ?? planOf(state, door);
    if (!plan || !a) continue;
    const d = dist([a.x, a.z], plan.stack?.[0] ?? plan.threshold);
    if (d <= 8 && (!best || d < best.d)) best = { door, plan, i, rec: null, d };
  }
  return best ? { door: best.door, plan: best.plan, i: best.i, rec: null } : null;
}

// ---- the beat times (see the header) ----

const stackOf = (plan, slot) => plan.stack?.[slot - 1] ?? plan.stack?.[0];
const pointOf = (plan, slot) => plan.points?.[slot - 1] ?? plan.points?.[0];
const entryPath = (plan, slot) => plan.paths?.[slot] ?? plan.paths?.[1] ?? [stackOf(plan, slot), pointOf(plan, slot)];
const bearing = (from, to) => Math.atan2(to[1] - from[1], to[0] - from[0]);
const hotXZ = (h) => [h.x, h.z];
/** The slot's corner in a plan: the hot spot its sector names (the one whose bearing from the point lies nearest the sector's yaw), else the plan's first. */
export function cornerOf(plan, slot) {
  const pt = pointOf(plan, slot), sec = plan.sectors?.find(s => s.slot === slot);
  const list = plan.hot?.length ? plan.hot : plan.corners ?? [];
  if (!list.length || !pt) return null;
  if (!sec) return list[0];
  return list.reduce((b, c) => (Math.abs(wrap(bearing(pt, hotXZ(c)) - sec.yawRad)) < Math.abs(wrap(bearing(pt, hotXZ(b)) - sec.yawRad)) ? c : b), list[0]);
}
/** The sector's sweep from the slot's corner (deg): to the farthest hot spot on the slot's side, as seen from its point. */
export function sweepDegOf(plan, slot) {
  const pt = pointOf(plan, slot), c = cornerOf(plan, slot);
  if (!pt || !c) return 0;
  const b0 = bearing(pt, hotXZ(c));
  let deg = 0;
  for (const h of plan.hot ?? []) deg = Math.max(deg, Math.abs(wrap(bearing(pt, hotXZ(h)) - b0)) / D2R);
  return Math.min(180, deg);
}
// (the bearing from the slot's point to the hot spot farthest round from its corner, or null)
function farHot(plan, slot) {
  const pt = pointOf(plan, slot), c = cornerOf(plan, slot);
  if (!pt || !c) return null;
  const b0 = bearing(pt, hotXZ(c));
  let best = null;
  for (const h of plan.hot ?? []) { const b = bearing(pt, hotXZ(h)); if (best === null || Math.abs(wrap(b - b0)) > Math.abs(wrap(best - b0))) best = b; }
  return best;
}
/** The eyes' turn of deg degrees for a person's Awareness (s). */
export const lookS = (awr, deg) => deg / (LOOK_TURN_BASE + LOOK_TURN_PER * awr) + LOOK_S * paceOf(awr);
/** A Watch of turn degrees for a person's Weapon handling (s): the muzzle onto the spot and held there. */
export const watchS = (wh, deg) => deg / (AIM.turn.base + AIM.turn.per * wh) + WATCH_S * paceOf(wh);
/** The muzzle onto the door from high ready (s): the sight's settle and a 20° turn, no feet (shot.js aimS's terms). */
export const muzzleS = (wh, deg = 20) => AIM.sight * paceOf(wh) + deg / (AIM.turn.base + AIM.turn.per * wh);
/** The door's breach (s): { ms, passMs } for 'push', 'pull' or 'kick' at a rung, the leaf's swing openS. */
export function doorS(wh, how = 'push', rung = 0, openS = DOOR_S) {
  const hand = how === 'kick' ? KICK_S : DOOR_HAND_S * paceOf(wh) + (how === 'pull' ? PULL_STEP_S * paceOf(wh) : 0);
  const share = rung >= 3 ? PASS_SHARE : 1;
  return { ms: Math.round((hand + openS) * 1000), passMs: Math.round((hand + openS * share) * 1000), handMs: Math.round(hand * 1000) };
}
/**
 * How a door opens from the side the plan clears it from (the opening's swing: PLACES §1.6, `into` an index of its rooms):
 * 'push' where the leaf swings away from you (into the room entered), 'pull' where it swings toward you, or null (no leaf).
 * from: the room you stand in (an inner door's: the plan's room), else the opening's other room than the plan's (the hall).
 */
export function swingOf(state, plan, from = null) {
  const o = plan?.door ? openingOf(plan.door) : null;
  if (!o) return null;
  if (!o.swing) return 'push';
  const into = o.rooms?.[o.swing.into] ?? null, here = from ?? o.rooms?.find(r => r !== plan.room) ?? null;
  return into !== here ? 'push' : 'pull';
}
/** Whether a door is locked now (its record's lock, not broken by a kick: the scene's or a kick's opening delta 'open'). */
export const lockedOf = (state, id) => { const o = openingOf(id); return !!o?.lock && openingState(state, o) !== 'open' && !state.armoury?.range?.house?.broken?.[id]; };

/** A path taken up from a point: [the point, …the path's waypoints past the segment nearest it] (a body at the stack, mid-door or inside). */
export function pathFrom(path, pos) {
  let best = { d: Infinity, i: 0 };
  for (let i = 1; i < path.length; i++) {
    const [ax, az] = path[i - 1], [bx, bz] = path[i], L2 = (bx - ax) ** 2 + (bz - az) ** 2;
    const t = L2 > 0 ? Math.max(0, Math.min(1, ((pos[0] - ax) * (bx - ax) + (pos[1] - az) * (bz - az)) / L2)) : 0;
    const d = Math.hypot(pos[0] - (ax + t * (bx - ax)), pos[1] - (az + t * (bz - az)));
    if (d < best.d - 1e-9) best = { d, i };
  }
  const rest = path.slice(best.i).filter(p => dist(p, pos) > 0.02);
  return [pos, ...(rest.length ? rest : [path.at(-1)])];
}

// ---- the plan of a bundle (see the header) ----

// (the stance of the entry: Assault from rung 3 unless the row says Combat; Combat below unless the row says Assault)
const entryStance = (rung, variant) => variant?.stance ?? (rung >= 3 ? 'assault' : 'combat');
/**
 * A bundle planned (see the header): { beats: [{ key, k, ch, ms, after, cut, … }] (a beat's name is its key, never an id: the save's id walk reads every id field as one), ms (the planned end from atMs), seams,
 * odds, rung, door, slot, variant, label }. from [x, z] where the body starts (the actor's place), v0 its speed.
 */
export function planBundle(state, pid, bundleId, { door = null, slot = 1, variant = {}, rung = rungOf(state, pid, 'room'), atMs = state.clock.ms, from = null, v0 = 0, tempo = 'normal', hurry = false } = {}) {
  const B = bundleDef(bundleId);
  if (!B || B.offeredNow === false) return null;
  const a = actorOf(state, pid), here = from ?? [a?.x ?? 0, a?.z ?? 0], sk = skillsOf(state, pid);
  const lane = laneOf(state), out = [];
  // (one door a row: the furthest one press reaches is one room (COMBAT §25.19.2; the lane's bundle withdrawn in R4))
  const dr = door ?? doorNow(state, pid)?.door ?? null, plan = planOf(state, dr);
  if (!plan) return null;
  let pos = here, vNow = v0, odds = 1;
  const k = tempo === 'rushed' ? RUSH_K : 1, open = [plan.door].filter(Boolean);
  const legs = legsOf(state, pid, pos[0], pos[1]);
  const how = variant.breach ?? (plan.door && lockedOf(state, plan.door) ? 'kick' : swingOf(state, plan) ?? 'push');
  const stance = entryStance(rung, variant), flowIn = rung >= FLOW_IN_RUNG, ids = beatsOf(B);
  // (a Top up on the way, where the row names it (the variant 'auto', COMBAT §25.19.2.1): the magazine believed at half or less of its load and a fuller one at hand)
  // (the #2 tops up by himself (COMBAT §25.19.5: a teammate's own decision; "nothing unasked" binds the player's rows))
  const reorg = (slot === 1 ? (variant.reorg ?? 'auto') === 'auto' : slot === 2 && isTwo(state, pid)) && ids.includes('reorg') ? reorgOf(state, pid) : null;
  for (const bid of ids) {
    const D = ENTER_AND_CLEAR.beats[bid];
    if (!D) continue;
    if (D.slots && !D.slots.includes(slot)) continue;
    if (D.rungs && !D.rungs.includes(Math.min(4, rung))) continue;
    if ((bid === 'door' || bid === 'read' || bid === 'tell') && !plan.door) continue;
    if (bid === 'read' && (state.armoury?.range?.house?.read?.[plan.door] || openingState(state, plan.door) === 'open')) continue;
    if (bid === 'tell' && openingState(state, plan.door) === 'open') continue;
    if ((bid === 'far' || bid === 'farlook') && !plan.far) continue;
    if (bid === 'inner' && !(plan.inner ?? []).length) continue;
    if (bid === 'reorg' && !reorg) continue;
    // (the explosive breach waits for a charge issued (COMBAT §25.19.11 question 3: struck here))
    if (bid === 'breach' && !chargeOf(state, pid)) continue;
    const after = [...(D.after ?? [])];
    const beat = { key: bid, k: D.k, ch: D.ch, after, cut: !!D.cut, door: plan.door ?? null, plan: dr, slot, st: 'wait', fromMs: null, untilMs: null, ...(Number.isFinite(D.flowFrom) ? { flowFrom: D.flowFrom } : {}) };
    if (D.k === 'move' && bid === 'far') {
      // (the far leg's walk from wherever the body stands, at Combat, braking to a stop where the leg is seen)
      const path = wayOf(state, pathFrom(plan.far.path, pos), open), legs2 = legsOf(state, pid, pos[0], pos[1]);
      const P = profileOf(pathLen(path), legs2.walk.combat, legs2.pushMs2, legs2.brakeMs2, { v0: vNow, v1: 0 });
      Object.assign(beat, { path, stance: 'combat', prof: P, ms: Math.round(P.T * 1000), arriveMs: Math.round(profileWhen(P, Math.max(0, P.L - ARRIVE_M)) * 1000) });
      // (from rung 3 the eyes lead round the bend onto the far leg as the walk goes, a sector held as the entry's corner is
      // (the rework's R9, 2026-11-13: the walk held none, so the hostage card coming round the bend was taken in 'area', x1.5,
      // and aimed from high ready with the mount: the sergeant missed his advanced par on him on 75 of 100 seeds, F10); below
      // rung 3 the body faces that way (`look`), never a held sector)
      const h = plan.hot.find(x => x.id === plan.far.hot);
      if (h) { beat.look = [h.x, h.z]; if (rung >= 3) beat.eyes = [h.x, h.z]; else beat.muzzleTo = [h.x, h.z]; }
      vNow = 0; pos = path.at(-1);
    } else if (D.k === 'scan' && bid === 'farlook') {
      // (the eyes onto the far leg's middle, its time the look's from the walk's heading; its sweep from where the walk left the
      // head: the walk faces the far leg's spot as it goes (its `look`, its eyes from rung 3, its muzzle below), so the head stays
      // there (the rework's R9, 2026-11-13: the sweep started from the walk's heading, swinging the head and the muzzle back up
      // the near leg at the walk's end, 60 degrees off the hostage card taken in on the way, and the corporal's head shot on her
      // was aimed from there: F10); with no spot, from the heading)
      const h = plan.hot.find(x => x.id === plan.far.hot), fp = plan.far.path, end = fp.at(-1), from = fp.at(-2) ?? end;
      const hb = h ? bearing(end, hotXZ(h)) : bearing(from, end), b0 = h ? hb : bearing(from, end), deg = Math.abs(wrap(hb - bearing(from, end))) / D2R;
      Object.assign(beat, { to: 'far', deg: r2(deg), hot: h?.id ?? null, sweep: [q(b0, 1e-6), q(hb, 1e-6)], ms: Math.round(lookS(sk.awr, deg) * 1000 * k), ...(h ? { eyes: [h.x, h.z] } : {}) });
    } else if (D.k === 'move') {
      const to = bid === 'approach' ? stackOf(plan, slot) : pointOf(plan, slot);
      // (the approach from wherever the body stands, routed (COMBAT §25.19.2.1): one room a row, so from the last room's point
      // straight to the next stack by the nav, no longer back out along that room's entry path, which the lane's bundle took)
      const path = wayOf(state, bid === 'approach' ? [pos, to] : pathFrom(entryPath(plan, slot), pos), open);
      // (the approach at Combat; the #2 closing on his slot from further back than you, at Fast (`hurry`, runSlot))
      const st = bid === 'approach' ? (hurry ? 'assault' : 'combat') : stance;
      const vMax = legs.walk[st];
      const v1 = bid === 'approach' && flowIn && ids.includes('enter') ? legs.walk.combat : 0;
      const P = profileOf(pathLen(path), vMax, legs.pushMs2, legs.brakeMs2, { v0: vNow, v1 });
      Object.assign(beat, { path, stance: st, prof: P, ms: Math.round(P.T * 1000), arriveMs: Math.round(profileWhen(P, P.L - ARRIVE_M) * 1000) });
      // (from rung 3 the eyes go in first, onto the slot's corner: a sector held through the entry (COMBAT §25.5.3); below it
      // the body still faces into the room as it goes in (`look`: the facing the eye's cone is, never a held sector))
      if (bid === 'enter') { const c = cornerOf(plan, slot); if (c) { beat.look = [c.x, c.z]; if (rung >= 3) beat.eyes = [c.x, c.z]; } }
      // (below rung 3 the muzzle goes where the body faces, onto the slot's corner (`muzzleTo`, no held sector: that is rung 3's
      // eyes). The rework's R9, 2026-11-13, replacing v0.0.12's "straight into the room, the door's inward normal" (my call):
      // a trained man's muzzle follows his eyes, and the normal stood 29 degrees off room 1's off-corner man, so the corporal
      // took him 'area' and aimed from high ready with the mount on every seed, missing his advanced par (F10))
      if (bid === 'enter' && rung < 3 && beat.look) beat.muzzleTo = [...beat.look];
      vNow = v1; pos = to;
    } else if (D.k === 'posture') Object.assign(beat, { to: readyOf(D.to, slot), ms: Math.round(HIGH_READY_S * HIGH_READY_K * paceOf(sk.wh) * 1000 * k) });
    else if (D.k === 'inner') Object.assign(beat, { inner: [...plan.inner], ms: 0 });
    else if (D.k === 'aim:point') Object.assign(beat, { to: 'door', ms: Math.round(muzzleS(sk.wh) * 1000 * k) });
    else if (D.k === 'read') Object.assign(beat, { ms: Math.round(READ_S * paceOf(sk.awr) * 1000 * k) });
    // (the #2's on his hands as he walks, at every rung: a man of the team does his own while moving (my call))
    else if (D.k === 'reorg') Object.assign(beat, { macro: reorg.macro, ms: Math.round(reorg.ms * k), ...(slot === 2 ? { flowFrom: 0 } : {}) });
    else if (D.k === 'door') {
      const o = openingOf(plan.door), t = doorS(sk.wh, how, rung, o?.openS ?? DOOR_S);
      if (how === 'kick') odds *= kickOdds(state, pid, plan.door);
      Object.assign(beat, { how, ms: Math.round(t.ms * k), passMs: Math.round(t.passMs * k), handMs: Math.round(t.handMs * k) });
    } else if (D.k === 'scan') {
      const pt = pointOf(plan, slot), c = cornerOf(plan, slot), path = entryPath(plan, slot);
      const deg = bid === 'corner' ? (c && pt ? Math.abs(wrap(bearing(pt, hotXZ(c)) - bearing(path.at(-2) ?? pt, pt))) / D2R : 0) : sweepDegOf(plan, slot);
      // (the head's sweep: the corner's look from the path's heading onto the corner; the sector's from the corner across to the farthest hot spot)
      const cb = c && pt ? bearing(pt, hotXZ(c)) : 0, far = farHot(plan, slot), sweep = bid === 'corner' ? [q(bearing(path.at(-2) ?? pt, pt), 1e-6), q(cb, 1e-6)] : [q(cb, 1e-6), q(far !== null ? cb + wrap(far - cb) : cb, 1e-6)];
      Object.assign(beat, { to: D.to, deg: r2(deg), hot: bid === 'corner' ? c?.id ?? null : null, sweep, ms: Math.round(lookS(sk.awr, deg) * 1000 * k), ...(bid === 'corner' && c ? { eyes: [c.x, c.z] } : {}) });
    } else if (D.k === 'call') {
      Object.assign(beat, { say: D.say, ms: Math.round((rung >= 3 ? CALL_FLOW_S : CALL_S) * 1000 * k) });
      // (#1 tells #2 how it opens and where he goes (MCWP §19b); the leader's "Room clear!", the hall's "Hall clear!")
      if (D.say === 'tell') beat.words = tellWords(state, plan, how);
      if (D.say === 'roomclear') beat.words = dr === 'hall' ? SAY.hallclear : SAY.roomclear;
    } else if (D.k === 'mark') Object.assign(beat, { ms: Math.round(MARK_S * paceOf(sk.wh) * 1000 * k) });
    else if (D.k === 'breach') Object.assign(beat, { ms: Math.round(BREACH_S * 1000) });
    out.push(beat);
  }
  if (!out.length) return null;
  const d = { beats: out, rung, atMs, fromMs: atMs, lanes: {}, subs: [] };
  const sim = simulate(d);
  return { beats: out, ms: sim, seams: [], odds, rung, door: dr, slot, reorg: !!reorg, variant: { breach: null, entry: lane?.plans?.[dr]?.entry ?? null, stance: entryStance(rung, variant), ...variant }, label: labelOf(state, B, plan, how, { reorg: !!reorg }) };
}
/**
 * A row's label in a marine's words for the door where it stands (COMBAT §25.19.2: "names its reach"): '{door}' is the
 * breach ("Open", "Kick"), gone where the door stands open ("In: your corner", "Clear the room") and in the hall ("Clear the
 * hall"); a row that names a Top up says so ("Stack up · top up on the way").
 */
export function labelOf(state, B, plan, how = null, { reorg = false } = {}) {
  let label = B?.label ?? '';
  if (label.includes('{door}')) {
    const shut = !!plan?.door && openingState(state, plan.door) !== 'open';
    if (shut) label = label.replace('{door}', how === 'kick' ? 'Kick' : 'Open');
    else label = cap(label.replace(/^\{door\},\s*/, '').replace('{door}', '')).replace('the room', plan && !plan.door ? 'the hall' : 'the room');
  }
  return reorg ? `${label} · top up on the way` : label;
}
// (#1's words to #2 at the door: how it opens and the side his corner is, as seen from the stack (MCWP §19b: One tells Two))
function tellWords(state, plan, how) {
  const st = plan?.stack?.[0], pt = plan?.points?.[0], th = plan?.threshold ?? pt;
  let side = 'left';
  if (st && pt && th) { const fx = th[0] - st[0], fz = th[1] - st[1], dx = pt[0] - th[0], dz = pt[1] - th[1]; side = dx * fz - dz * fx > 0 ? 'left' : 'right'; }
  const opens = how === 'kick' ? 'Kicking it' : how === 'pull' ? 'Opens out' : 'Opens in';
  return `${opens}, I go ${side}.`;
}
// (a Top up on the way: { macro, ms } when the magazine is believed at half or less of its load and a fuller one is at hand, else null)
function reorgOf(state, pid) {
  const gunId = state.stop?.who === pid ? state.stop.gun : state.people?.[pid]?.kit?.worn?.sling ?? null, gun = gunId ? state.items?.[gunId] : null;
  if (!gun) return null;
  const b = beliefOf(state, gunId);
  if (!b || b.stoppage || !halfOrLess(b, gun) || !fullerAtHand(state, pid, gunId, b)) return null;
  return { macro: 'reload:tactical', gunId, ms: macroMs(rollerOf(state, pid), gun, 'reload:tactical', b) };
}
// (an explosive charge issued to the person: none in the shoot house (COMBAT §25.19.11 question 3), so the breach is struck)
const chargeOf = (state, pid) => (state.people?.[pid]?.kit?.charges ?? 0) > 0;
// (a plan's beats laid out by the flow with nothing halting: the planned time, ms)
function simulate(d) {
  const copy = { ...d, beats: d.beats.map(b => ({ ...b, st: 'wait' })), lanes: {}, subs: [], dry: true };
  advanceBeats(null, null, copy, Number.MAX_SAFE_INTEGER);
  return Math.max(0, (copy.untilMs ?? copy.atMs) - d.atMs);
}
/** The kick's odds: Fitness against the door's kickDc (KICK_DC_OPEN for one not locked). */
export function kickOdds(state, pid, door) {
  const o = openingOf(door), dc = o?.lock && lockedOf(state, door) ? o.kickDc ?? 14 : KICK_DC_OPEN;
  return oddsOf(skillsOf(state, pid).fit, dc);
}

// ---- the beat handlers (registered with the stepper) ----

// (in a dry run (planning) a handler only times its beat)
const dry = (d) => !!d?.dry;
registerKind('move', {
  run(state, bus, d, b, atMs) {
    if (dry(d)) return { ms: b.ms, arriveMs: b.arriveMs };
    const a = actorOf(state, d.who);
    // (from where the body is now, at the speed it has: the plan's path re-timed, never a jump; a moving body first brought
    // to its place at the beat's start by the brake (move.js coastTo: a body a tick behind stood still for that tick, the
    // rework's R2), the player's metres kept by its layer's record, the #2's by his from his tween start)
    if (a) {
      coastTo(state, d.who, a, atMs, { record: d.who === playerId(state) });
      const here = [a.x, a.z], v0 = Math.hypot(a.v?.[0] ?? 0, a.v?.[1] ?? 0), legs = legsOf(state, d.who, a.x, a.z);
      const path = wayOf(state, dist(here, b.path[0]) > 0.02 ? [here, ...b.path.slice(dist(here, b.path[1] ?? here) < dist(b.path[0], b.path[1] ?? here) ? 1 : 0)] : [here, ...b.path.slice(1)], doorsOf(d.beats));
      const P = profileOf(pathLen(path), legs.walk[b.stance] ?? legs.walk.combat, legs.pushMs2, legs.brakeMs2, { v0, v1: b.prof?.v1 ?? 0 });
      b.path = path.map(p => [q(p[0], 0.0001), q(p[1], 0.0001)]); b.prof = P;
      a.moveStance = b.stance;
      // (never ×RUSH_K: the body's place is the profile's, moveAt, so the beat's time is the profile's T (see the header))
      return { ms: Math.round(P.T * 1000), arriveMs: Math.round(profileWhen(P, P.L - ARRIVE_M) * 1000), ok: true, routine: true };
    }
    return { ms: b.ms, arriveMs: b.arriveMs, ok: true, routine: true };
  },
  end(state, bus, d, b, { cut, atMs }) {
    if (dry(d)) return;
    const a = actorOf(state, d.who);
    if (!a || !b.prof) return;
    // (a cut leaves the body where it stands, at the time its place is for (a.locoMs), never run on to the halt's instant nor
    // back to it: a halt in a tick the hold froze put the body a tick ahead while time stood still, then stood it still a tick
    // when time ran, and one in the rules layer put it back a tick's travel (the rework's R2); its speed at that time goes on
    // into the brake (move.js inertStep, coastTo))
    const keep = cut && Number.isFinite(a.locoMs) && a.locoMs >= (b.fromMs ?? atMs);
    const p = keep ? moveAt({ ...b, untilMs: Infinity }, a.locoMs) : moveAt(b, atMs);
    if (!keep) {
      const x0 = a.x, z0 = a.z;
      placeAt(state, d.who, a, p.x, p.z); a.locoMs = atMs;
      // (the player's record keeps these metres too, its layer counting only its own; the #2's counts from his tween start)
      if (d.who === playerId(state)) locoStep(a, x0, z0, { state, pid: d.who, gait: 'walk', stance: b.stance ?? a.moveStance ?? null, vMs: p.vMs > 0 ? p.vMs : null });
    }
    if (cut && p.vMs > 0) a.v = [q(p.vMs * Math.cos(p.headRad), 0.001), q(p.vMs * Math.sin(p.headRad), 0.001)];
    else if (!b.prof.v1) delete a.v;
    else a.v = [q(b.prof.v1 * Math.cos(p.headRad), 0.001), q(b.prof.v1 * Math.sin(p.headRad), 0.001)];
  },
});
registerKind('posture', {
  run(state, bus, d, b) { const to = b.to === 'lowReady' ? 'lowReady' : 'highReady'; if (!dry(d)) setPosture(state, d.who, to); return { ms: b.ms, ok: true, routine: true, text: to === 'lowReady' ? 'Low ready.' : 'High ready.' }; },
});
/** The posture a slot's `ready` takes (COMBAT §25.19.2.1, CALL 97-20: "weapons are pointed down with the exception of the 1-Man"): #1 high ready, the #2 and later low ready. */
export const readyOf = (to, slot) => (to === 'highReady' && slot > 1 ? 'lowReady' : to);
registerKind('aim:point', {
  run(state, bus, d, b) {
    if (!dry(d)) { const a = actorOf(state, d.who), o = openingOf(b.door); if (a && o) a.headRad = q(Math.atan2(doorMid(o)[1] - a.z, doorMid(o)[0] - a.x), 1e-6); }
    return { ms: b.ms, ok: true, routine: true, text: 'Muzzle on the door.' };
  },
});
registerKind('door', {
  run(state, bus, d, b, atMs) {
    if (dry(d)) return { ms: b.ms, passMs: b.passMs };
    const o = openingOf(b.door);
    if (!o) return { ms: 0, ok: true };
    if (openingState(state, o) === 'open' && leafAt(state, o.id, atMs) >= 1) return { ms: 0, passMs: 0, ok: true, routine: true, text: 'The door is open.' };
    // (the words by the door's kind and state: an inner door can be held, the lane's cannot; a kick that failed on a door not locked "held")
    const inner = doorNow(state, d.who)?.plan?.door !== o.id;
    if (b.how !== 'kick' && lockedOf(state, o.id)) return { ms: Math.round(DOOR_HAND_S * paceOf(skillsOf(state, d.who).wh) * 1000), ok: false, halt: 'refused', again: true, text: inner ? HANDBACK_WORDS.refused : HANDBACK_WORDS['refused-lane'] };
    // (the #2 not with you at the lane's own door (never an inner one): the hand waits on the door until he is within
    // TWO_SLOT_M of his slot (his running move's closed form, so his "Ready." releases it), at most TWO_WAIT_MS from the
    // first try; still away then, it hands back once the feet have stopped, the door still to open (COMBAT §25.8.2; the
    // fixer's of 0.0.12: decided once at the beat's start, it waited 3 s on a man who arrived in 1.6 and cut the approach))
    const two = d.who === playerId(state) && doorNow(state, d.who)?.plan?.door === o.id && !askedOf(state)[`two:${o.id}`] ? houseOf(state)?.two ?? null : null;
    const off = two ? twoOffSlot(state, two, atMs) : null;
    if (off !== null && off > TWO_SLOT_M) {
      const from = (b.twoFromMs ??= atMs), by = from + TWO_WAIT_MS;
      if (atMs < by) {
        const arr = twoArriveMs(state, two, atMs), until = Math.min(by, arr ?? atMs + TWO_POLL_MS);
        const ms = Math.max(TICK_MS, until - atMs);
        return { ms, passMs: ms, ok: true, routine: true, again: true, text: 'The squeeze.' };
      }
      const feet = d.beats.find(x => x.st === 'run' && x.ch === 'feet');
      if (feet) { const ms = Math.max(TICK_MS, feet.untilMs - atMs); return { ms, passMs: ms, ok: true, routine: true, again: true, text: 'The squeeze.' }; }
      askedOf(state)[`two:${o.id}`] = atMs;
      return { ms: 0, passMs: 0, ok: false, halt: 'two', again: true, text: HANDBACK_WORDS.two };
    }
    let ms = b.ms, passMs = b.passMs, ok = true, grade = null, routine = true;
    if (b.how === 'kick') {
      const dc = o.lock && lockedOf(state, o.id) ? o.kickDc ?? 14 : KICK_DC_OPEN;
      const r = check(stream(state.meta.seed, 'house:kick', d.who, o.id, atMs), { skill: 'fitness', value: skillsOf(state, d.who).fit, dc, pressure: 'evaluated', tempo: d.tempo ?? 'normal', by: d.who, verb: null });
      ok = r.ok; grade = r.grade; routine = false;
      if (!ok) return { ms: Math.round(KICK_S * FAIL_K * 1000), ok: false, grade, halt: 'refused', again: true, text: !lockedOf(state, o.id) ? HANDBACK_WORDS['refused-held'] : inner ? HANDBACK_WORDS['refused-kick'] : HANDBACK_WORDS['refused-kick-lane'] };
      ((state.armoury.range.house ??= {}).broken ??= {})[o.id] = atMs;
    }
    // (the leaf finishes its swing at the hand's end plus openS: leafAt draws it from closed through the hand, then open)
    setOpening(state, o.id, 'open', { atMs: atMs + Math.round((b.handMs ?? 0) + (o.openS ?? DOOR_S) * 1000) });
    ((state.$places ??= {}).moving ??= new Set()).add(o.id);
    const [x, z] = doorMid(o);
    bus?.emit('door', { id: o.id, area: openingArea(o.id)?.id ?? null, x, z, state: 'open', kind: o.kind, who: d.who, how: b.how });
    return { ms, passMs, ok, grade, routine, text: b.how === 'kick' ? 'Kicked in.' : b.how === 'pull' ? 'Pulled open.' : 'Pushed open.' };
  },
});
registerKind('scan', {
  run(state, bus, d, b, atMs) {
    if (dry(d)) return { ms: b.ms };
    d.eyes = { hot: b.hot ?? null, fromMs: atMs, deg: b.deg };
    return { ms: b.ms, ok: true, routine: true };
  },
  end(state, bus, d, b) { if (!dry(d)) d.eyes = null; },
});
registerKind('inner', {
  // (a door inside the room the plan does not take: asked once, from the point, the sector swept, "Hold it or clear it?"
  // (COMBAT §25.19.2.1, §25.19.4; v0.0.12 asked it at the sector's start, which from rung 3 is the doorway: the user's
  // "drop you in the doors"); held by the #2 or opened, nothing to ask; the #2's slot never asks)
  run(state, bus, d, b, atMs) {
    if (dry(d) || d.who !== playerId(state)) return { ms: 0, ok: true, routine: true };
    const plan = planOf(state, b.plan), H = houseOf(state);
    for (const id of b.inner ?? plan?.inner ?? []) {
      if (openingState(state, id) === 'open' || H?.two?.hold === id || askedOf(state)[`inner:${id}`]) continue;
      askedOf(state)[`inner:${id}`] = atMs;
      return { ms: 0, ok: false, halt: 'door-unplanned', again: true, text: HANDBACK_WORDS['door-unplanned'].replace('{wall}', wallOf(state, plan, id)) };
    }
    return { ms: 0, ok: true, routine: true };
  },
});
registerKind('call', {
  run(state, bus, d, b, atMs) {
    // (your "Clear!" waits on your #2's side of the room: while he is on a man (his take-in, his row), or his entry and
    // sweep of this room run, at most CLEAR_WAIT_MS; then a threat of the room still up and facing hands back, the call
    // still to come (the fixer's of 0.0.12: from rung 3 T called room 1 clear at 5.35 s with the #2's man up and unfired on))
    if (!dry(d) && b.say === 'clear' && d.who === playerId(state) && b.plan) {
      const two = houseOf(state)?.two ?? null, a2 = two?.pid ? actorOf(state, two.pid) : null, plan = planOf(state, b.plan);
      const from = (b.clearFromMs ??= atMs);
      const onMan = !!(two?.contact || two?.eng);
      const sweeping = !!a2 && !two.swept?.[b.plan] && (two.doing?.door === b.plan || (plan && pastThreshold(plan, a2.x, a2.z)));
      // (the wait on his sweep ends with his group's planned end, never later than CLEAR_WAIT_MS, a tick at least: a half-second
      // poll called the room up to 0.25 s after his "Clear!" (the fixer's second pass of 0.0.12))
      if (!onMan && sweeping && atMs - from < CLEAR_WAIT_MS) {
        const end = Math.min(from + CLEAR_WAIT_MS, Number.isFinite(two.doing?.untilPlanMs) && two.doing.untilPlanMs > atMs ? two.doing.untilPlanMs : atMs + TICK_MS);
        return { ms: Math.max(TICK_MS, end - atMs), ok: true, routine: true, again: true, text: null };
      }
      // (on his man at most CLEAR_HOLD_MS, as the gate's wait: then handed back, "Your two's on a man.", the call still to come
      // (the code review of 2026-11-13: this wait alone had no cap, and a #2 kept on a man, his own drill failing again, held
      // your bundle polling for ever with no stop and no lead))
      if (onMan) {
        const m0 = (b.manFromMs ??= atMs);
        if (atMs - m0 < CLEAR_HOLD_MS) return { ms: TWO_POLL_MS / 2, ok: true, routine: true, again: true, text: null };
        delete b.manFromMs; delete b.clearFromMs;
        return { ms: 0, ok: false, halt: 'clear', again: true, text: HANDBACK_WORDS.twoMan };
      }
      delete b.manFromMs;
      // (the scene's ready-to-clear predicate first (see the header): the drill never calls a void "Clear!"; while a window is
      // open, a man turns or a trigger's gap runs it waits, a tick at a time, up to CLEAR_HOLD_MS, then hands back with the call
      // still to come (a window's own pause suspends it first: the man up below is asked only once he is taken in))
      const gate = clearGate.fn ? clearGate.fn(state, b.plan, atMs) : null;
      const all = plan ? upIn(state, plan.room, atMs) : [], two2 = !!houseOf(state)?.twoPid, up = all.filter(T => !two2 || (T.slot ?? 1) === 1);
      // (asked once a room, as the other hand-backs: a man you chose to hold (the hostage's) is your call, and "Carry on" calls it;
      // from rung 2 the flow is suspended, not halted, so the shot on him takes it up again (COMBAT §25.19.3.3); a man of your
      // #2's corner is his: the call waits on him as on the gate, then asks (2026-11-12, R3))
      const his = !up.length && all.length && !askedOf(state)[`clear:${b.plan}`];
      if (!gate && up.length && !askedOf(state)[`clear:${b.plan}`]) {
        askedOf(state)[`clear:${b.plan}`] = atMs; delete b.clearFromMs; delete b.gateFromMs;
        return (d.rung ?? 0) >= 2 ? { ms: 0, ok: true, routine: true, again: true, suspend: 'up', text: null } : { ms: 0, ok: false, halt: 'contact', again: true, text: null };
      }
      const wait = gate ?? (his ? 'his' : null);
      if (wait) {
        const g0 = (b.gateFromMs ??= atMs);
        if (atMs - g0 < CLEAR_HOLD_MS) return { ms: TICK_MS, ok: true, routine: true, again: true, text: null };
        delete b.gateFromMs;
        if (wait === 'his') { askedOf(state)[`clear:${b.plan}`] = atMs; return { ms: 0, ok: false, halt: 'contact', again: true, text: null }; }
        return { ms: 0, ok: false, halt: 'clear', again: true, text: HANDBACK_WORDS.clear };
      }
      delete b.gateFromMs;
    }
    const words = b.words ?? SAY[b.say] ?? b.say;
    if (!dry(d)) bus?.emit('say', { who: d.who, text: words, kind: 'speech', durMs: b.ms, call: b.say, room: b.plan ?? null });
    // (the #2's own "Clear!" noted on the house's record: the scene drops its echo of yours within a second of it)
    if (!dry(d) && b.say === 'clear' && houseOf(state)?.two?.pid === d.who) houseOf(state).two.clearMs = atMs;
    return { ms: b.ms, ok: true, routine: true, text: words };
  },
});
// (the scene's ready-to-clear predicate: (state, door, ms) → a reason to wait, or null; shoothouse.js registers it)
// (held on a function, which a module's instantiation sets up before its body runs: the scene registers it at its own load,
// which can come first in an import cycle (the rework's R4: bundle.js reads the gun's belief and the macros now))
function clearGate() { return clearGate.fn ?? null; }
/** The scene's ready-to-clear predicate for "Clear!" (see the header): fn(state, door, ms) → a reason or null. */
export function useClearGate(fn) { clearGate.fn = typeof fn === 'function' ? fn : null; }
// (the scene's verdict on a "Clear!" just said: (state, door, ms) → true where it was void; shoothouse.js registers it)
function callVoid() { return callVoid.fn ?? null; }
/** The scene's verdict on your "Clear!" (see the call's run): true where the call said at ms on the door's leg was void. */
export function useCallVoid(fn) { callVoid.fn = typeof fn === 'function' ? fn : null; }
// (the threats of a room standing and facing now: the turners of the range session)
// (the men of a room up and facing that you know of: taken in at the last pause or before and not forgotten (contact.js's
// known), never one nobody has seen (the reach review of 2026-11-13: the call waited on, and relooked, men behind you))
function upIn(state, room, ms) {
  const c = state.mind?.contact, known = c?.known ?? {}, last = c?.last?.ids ?? [];
  return (state.armoury?.range?.turners ?? []).filter(T => T.room === room && ['threat', 'armoured', 'hostage'].includes(T.face) && (T.stoppedAtMs === null || T.stoppedAtMs === undefined) && facingOf(T, ms) >= 0.5
    && (known[T.key] !== undefined || last.includes(T.key)));
}
registerKind('mark', { run(state, bus, d, b) { return { ms: b.ms, ok: true, routine: true, text: 'Room marked.' }; } });
// (the door read: the hinge, the swing, the lock (COMBAT §25.19.2.1), noted on the house's record as the single's is)
registerKind('read', {
  run(state, bus, d, b, atMs) {
    if (!dry(d) && b.door && d.who === playerId(state) && state.armoury?.range) ((state.armoury.range.house ??= {}).read ??= {})[b.door] = atMs;
    return { ms: b.ms, ok: true, routine: true, text: 'The door read.' };
  },
});
// (a Top up on the way (the row's reorg, COMBAT §25.19.2.1): the tactical reload's sub-steps on the hands, rolled as the
// command's (drills.js runMacro), its time theirs; still owed at the beat's start, else nothing to do)
registerKind('reorg', {
  run(state, bus, d, b) {
    if (dry(d)) return { ms: b.ms };
    const r0 = reorgOf(state, d.who);
    if (!r0) return { ms: 0, ok: true, routine: true, text: null };
    // (the #2's: "Reloading!" as he starts (FM table 3-2), his rolls on his own stream and in nobody's log, "Up." at its end)
    const two = isTwo(state, d.who);
    if (two) bus?.emit('say', { who: d.who, text: TWO_SAY.reloading, kind: 'speech', durMs: Math.round(CALL_FLOW_S * 1000), call: 'reloading' });
    const r = runMacro(state, bus, { macro: r0.macro, pid: d.who, gunId: r0.gunId, tempo: d.tempo === 'rushed' ? 'rushed' : 'normal', pressure: 'evaluated', ...(two ? { log: false, rng: 'house-two' } : {}) });
    const routine = r.subs.every(x => x.routine !== false || x.ok);
    if (two) b.said = 'up';
    return { ms: r.ms, ok: !r.halted, routine, text: r.halted ? 'The top up fumbled.' : 'Topped up.' };
  },
  end(state, bus, d, b, { cut }) { if (!dry(d) && b.said === 'up' && !cut) bus?.emit('say', { who: d.who, text: TWO_SAY.up, kind: 'speech', durMs: Math.round(CALL_FLOW_S * 1000), call: 'up' }); },
});
/** The #2's own calls (FM 3-06.11 table 3-2; COMBAT §25.19.5): "Reloading!" at his top up or a dry rifle's reload, "Up." at its end and after your rifle is back, "Covering!" as he takes your sector, "Gun down!" at his own stoppage and "Gun up!" once it is cleared (shoothouse.js twoGunDown). */
export const TWO_SAY = Object.freeze({ reloading: 'Reloading!', up: 'Up.', covering: 'Covering!', gunDown: 'Gun down!', gunUp: 'Gun up!' });
// (whether a person is the shoot house's number two)
const isTwo = (state, pid) => !!pid && (houseOf(state)?.two?.pid ?? null) === pid;
// (the explosive breach: never planned without a charge issued; a game abstraction of place, back, "Breaching!" and the count)
registerKind('breach', { run(state, bus, d, b) { if (!dry(d)) bus?.emit('say', { who: d.who, text: 'Breaching!', kind: 'speech', durMs: 600 }); return { ms: b.ms, ok: true, routine: true, text: 'Breaching!' }; } });
registerKind('wait', { run(state, bus, d, b) { return { ms: b.ms, ok: true, routine: true }; } });

// (the hand-backs asked once (the #2's wait at a door, an inner door): the house's record, else the stop's, so "Carry on" goes on)
const askedOf = (state) => { const H = houseOf(state); return H ? (H.asked ??= {}) : state.stop ? (state.stop.asked ??= {}) : {}; };
/** Whether the #2 stands over TWO_SLOT_M from his slot at the lane's door, in the house (cqb.js cqb-two reads it). */
export const twoAway = (state, ms = state.clock.ms) => { const H = houseOf(state); if (!H?.two?.pid) return false; const d = twoOffSlot(state, H.two, ms); return d !== null && d > TWO_SLOT_M; };
/** An inner door's wall in words, from the room's middle: "east wall" (the DI's lead reads it too: cqb.js stopLead). */
export function innerWall(state, plan, id) { return wallOf(state, plan, id); }
// (an inner door's wall in words, from the room's middle: "east wall")
function wallOf(state, plan, id) {
  const o = openingOf(id), r = plan?.rects?.[0];
  if (!o || !r) return 'the far wall';
  const [x, z] = doorMid(o), cx = (r[0] + r[2]) / 2, cz = (r[1] + r[3]) / 2;
  return Math.abs(x - cx) > Math.abs(z - cz) ? (x > cx ? 'east wall' : 'west wall') : (z > cz ? 'south wall' : 'north wall');
}
// (a body put where its move says: an NPC's post goes with him, so the people layer keeps him there (the scene's placeTwo's way))
function placeAt(state, pid, a, x, z) {
  a.x = x; a.z = z;
  if (pid === playerId(state)) return;
  const post = state.people?.[pid]?.post;
  if (post) { post.x = q(x, 1e-4); post.z = q(z, 1e-4); }
}
/**
 * The player's shot-row feet still running when a new step takes their place at ms (state.stop.feet: moving on, or braking
 * to plant): the body put where their closed form has it at ms, at their speed there, so the new step's move starts from
 * the body's place at its own start (the rework's R2, BODY §16.8: dropped a tick behind, the body stood still that tick).
 */
export function feetTo(state, ms = state.clock.ms) {
  const S = state.stop, f = S?.feet;
  if (!f || f.done || !f.prof) return;
  const a = actorOf(state, S.who);
  if (!a) return;
  const p = moveAt(f, ms), x0 = a.x, z0 = a.z;
  a.x = p.x; a.z = p.z; a.locoMs = ms;
  locoStep(a, x0, z0, { state, pid: S.who, gait: 'walk', stance: f.stance ?? a.moveStance ?? null, vMs: p.vMs > 0 ? p.vMs : null });
  if (p.vMs > 0) a.v = [q(p.vMs * Math.cos(p.headRad), 0.001), q(p.vMs * Math.sin(p.headRad), 0.001)]; else delete a.v;
}
const doorMid = (o) => (o.axis === 'x' ? [(o.a + o.b) / 2, o.at] : [o.at, (o.a + o.b) / 2]);
const setPosture = (state, pid, posture) => { const k = state.people?.[pid]?.kit; if (k) (k.carry ??= {}).posture = posture; };

// ---- the player's bundle in stop motion ----

/** The words of a bundle row's beats grouped by channel, for the face: { feet: n, hands: n, eyes: n, voice: n }. */
const laneCount = (beats) => beats.reduce((o, b) => ((o[b.ch] = (o[b.ch] ?? 0) + 1), o), {});

/**
 * The catalogue's rows at the lane's door (see the header; COMBAT §25.19.2): [{ id: 'drill:<row>[@<variant>]><door>', kind:
 * 'bundle', label, ms, beats, seams, rung, variant, lanes, group, slot, off?, struck?, lead, later? }], the rung's own first;
 * a row of the rung not yet lived struck "by hand first"; a row above the rung shown struck with its rung ("rung 3"), never
 * hidden (the user's "even if grayed out", 2026-11-11), and paged last (later); "Breach (explosive)" struck "no charge issued".
 */
export function bundleRows(state, pid = playerId(state), ms = state.clock.ms) {
  const here = doorNow(state, pid);
  if (!here) return [];
  const rung = rungOf(state, pid, 'room'), out = [];
  const variant = state.stop?.variant ?? {};
  for (const B of BUNDLES) {
    if (B.single || B.offeredNow === false) continue;
    // (each where it applies: the stack before the door is open, In before you are in, Dominate inside, the room's row from
    // wherever the room is still ahead)
    if (!groupApplies(state, pid, B.id, here)) continue;
    const id = `drill:${B.id}${variantTag(variant)}>${here.door}`, base = { id, kind: 'bundle', group: B.group, slot: B.slot, rung: B.rung, door: here.door, bundle: B.id, cmd: false, skill: null, carefulMs: null };
    // (a row not built yet here: the breach with no charge issued (COMBAT §25.19.11 question 3's default))
    if (B.offeredNow === 'struck') {
      if (!here.plan.door || openingState(state, here.plan.door) === 'open') continue;
      out.push({ ...base, label: B.label, ms: null, rushMs: null, odds: null, routine: true, off: B.needs === 'charge' ? 'no charge issued' : 'not issued', struck: true, subs: [], beats: [], seams: [], variant: {}, lanes: {}, lead: false, later: true });
      continue;
    }
    // (above the rung: greyed with the rung that runs it, never hidden, paged last)
    if (B.rung > rung) {
      const how = here.plan.door && lockedOf(state, here.plan.door) ? 'kick' : swingOf(state, here.plan) ?? 'push';
      out.push({ ...base, label: labelOf(state, B, here.plan, variant.breach ?? how), ms: null, rushMs: null, odds: null, routine: true, off: `rung ${B.rung}`, struck: true, subs: [], beats: [], seams: [], variant: {}, lanes: {}, lead: false, later: true });
      continue;
    }
    const plan = planBundle(state, pid, B.id, { door: here.door, rung, variant, atMs: ms });
    if (!plan) continue;
    const lived = offered(state, pid, B);
    const rushed = planBundle(state, pid, B.id, { door: here.door, rung, variant, atMs: ms, tempo: 'rushed' });
    out.push({ ...base, label: plan.label, ms: plan.ms, rushMs: rushed?.ms ?? plan.ms, odds: plan.odds < 1 ? plan.odds : null, routine: plan.odds >= 1, off: lived ? null : 'by hand first',
      struck: !lived, subs: plan.beats.map(b => ({ id: b.key, label: b.key, ms: b.ms })), beats: plan.beats.map(b => ({ id: b.key, k: b.k, ch: b.ch, ms: b.ms })), seams: plan.seams,
      variant: plan.variant, lanes: laneCount(plan.beats), lead: leadOf(B, rung), reorg: plan.reorg });
  }
  // (the live rows the rung's own first, then the rest by group and slot; the greyed after them)
  const live = out.filter(r => !r.later), grey = out.filter(r => r.later);
  live.sort((a, b) => b.rung - a.rung || GROUP_RANK(a.group) - GROUP_RANK(b.group) || a.slot - b.slot);
  const rows = [...live];
  // (the rows set at no time: the breach and the entry's stance, the current first ("Push ⇄ Kick", "Fast ⇄ Careful"), and
  // from rung 4 the standing order "Engage: armed, my sector" (COMBAT §25.19.4, off by default: question 1))
  if (live.length && rung >= 2 && here.plan.door && openingState(state, here.plan.door) !== 'open') {
    const how = variant.breach ?? (lockedOf(state, here.plan.door) ? 'kick' : swingOf(state, here.plan) ?? 'push'), other = how === 'kick' ? swingOf(state, here.plan) ?? 'push' : 'kick';
    rows.push(variantRow('breach', `${cap(how)} ⇄ ${cap(other)}`, other));
  }
  if (live.length && rung >= 2) {
    const st = entryStance(rung, variant), other = st === 'assault' ? 'combat' : 'assault';
    rows.push(variantRow('stance', `${STANCE_NAMES[st]} ⇄ ${STANCE_NAMES[other]}`, other, { stance: other }));
  }
  if (live.length && rung >= ORDER_RUNG) {
    const on = orderOf(state).engage === 'armed';
    rows.push(variantRow('engage', on ? ORDER_WORDS.on : ORDER_WORDS.off, on ? 'off' : 'armed', { hint: ORDER_WORDS.hint }));
  }
  return [...rows, ...grey];
}
// (a row the rung's own: its rung's, rung 2's three groups (COMBAT §25.19.2.3), from rung 3 the room's)
const leadOf = (B, rung) => (rung >= 3 ? B.id === 'room:clear' : rung === 2 ? ENTER_AND_CLEAR.groups.flat().includes(B.id) : B.rung === rung);
const GROUP_RANK = (g) => { const i = ['stack', 'door', 'room', 'shot', 'weapon', 'team'].indexOf(g); return i < 0 ? 9 : i; };
const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);
/** The movement stances in the words of what they trade (DESIGN.md's log, 2026-11-11: the user's "don't know what the assault <-> combat option is supposed to mean"; COMBAT §25.19.2): Careful (Combat), Fast (Assault). */
export const STANCE_NAMES = Object.freeze({ relaxed: 'Relaxed', combat: 'Careful', assault: 'Fast' });
/** The standing order's rung is contact.js's (COMBAT §25.19.4: offered from rung 4, off by default; question 1); its words. */
export const ORDER_WORDS = Object.freeze({ off: 'Engage: off ⇄ armed, my sector', on: 'Engage: armed, my sector ⇄ off', hint: 'By your order: a clean armed man in your sector is shot at the end of his take-in, no pause.' });
/** The standing order as set (COMBAT §25.19.4): the house's record { engage: 'off' | 'armed' }, off by default. */
export const orderOf = (state) => state.armoury?.range?.house?.order ?? { engage: 'off' };
// (a variant's row: chosen, it sets the bundles' variant (state.stop.variant) at no time)
const variantRow = (key, label, to, o = {}) => ({ id: `drill:variant:${key}`, kind: 'variant', label, ms: 0, rushMs: null, carefulMs: null, odds: null, routine: true, off: null, subs: [], cmd: false, skill: null, variant: { [key]: to }, ...o });
/** A variant row chosen (see bundleRows): the stop's variant set, at no time; the standing order kept on the house's record. Returns { ok, why }. */
export function setVariant(state, row, bus = null) {
  const S = state.stop;
  if (!S || !row?.variant) return { ok: false, why: 'no variant' };
  const { engage, ...rest } = row.variant;
  if (engage !== undefined) { const H = houseOf(state); if (!H) return { ok: false, why: 'no order here' }; H.order = { ...(H.order ?? {}), engage }; }
  if (Object.keys(rest).length) S.variant = { ...(S.variant ?? {}), ...rest };
  // (the entry's stance set says what it now is, in numbers, at every press (the play review of 2026-11-13: one press set
  // Careful at the tier one with no line; the user's remark of 2026-11-11 on the stances' words))
  if (rest.stance && S.who === playerId(state)) {
    const words = stanceWords.fn ? stanceWords.fn(state, S.who, rest.stance) : STANCE_NAMES[rest.stance];
    bus?.emit('line', { text: `The entry: ${words}.`, kind: 'note' });
  }
  return { ok: true, why: null };
}
const variantTag = (v) => { const t = [v?.entry, v?.breach, v?.stance].filter(Boolean); return t.length ? `@${t.join('+')}` : ''; };
// (whether a row applies where the lane stands: the stack rows outside before the door is open, In at the door, Dominate
// inside, the room's row while the room is ahead of you)
function groupApplies(state, pid, id, here) {
  const open = here.plan.door ? openingState(state, here.plan.door) === 'open' : true, a = actorOf(state, pid), inside = a ? pastThreshold(here.plan, a.x, a.z) : false;
  const ahead = !here.rec || !here.rec.state || here.rec.state === 'ahead' || here.rec.state === 'stacked';
  const me = a ? [a.x, a.z] : null, o = here.plan.door ? openingOf(here.plan.door) : null;
  const stacked = !!me && dist(me, stackOf(here.plan, 1)) <= STACK_NEAR_M, atDoor = stacked || (!!me && !!o && dist(me, doorMid(o)) <= DOOR_REACH_M);
  if (id === 'room:clear') return ahead || !inside;
  if (id === 'stack:point') return !open && !inside && !stacked && !!here.plan.door;
  if (id === 'door:breach') return !open && !inside && atDoor;
  // (In: from the door, never from down the hall: the door is its first beat, the hand on the leaf)
  if (id === 'room:in') return !inside && (atDoor || (open && !!here.plan.door) || !here.plan.door);
  if (id === 'room:dominate') return inside;
  return false;
}
/**
 * The singles in the house (see the header), the panel's shape: Stack up, the door's rows, Watch, Look, Move,
 * Hold it, "Clear!", Mark, the stances. Each { id, kind, label, ms, beats?, off?, warn? }.
 */
export function singleRows(state, pid = playerId(state), ms = state.clock.ms) {
  const here = doorNow(state, pid), a = actorOf(state, pid);
  if (!here || !a) return [];
  const sk = skillsOf(state, pid), rung = rungOf(state, pid, 'room'), out = [], plan = here.plan, me = [a.x, a.z];
  const row = (id, kind, label, ms0, o = {}) => ({ id, kind, label, ms: Math.round(ms0), rushMs: null, carefulMs: null, odds: null, routine: true, off: null, subs: [], cmd: false, skill: null, door: here.door, group: SINGLE_GROUP[kind] ?? null, ...o });
  const inside = pastThreshold(plan, a.x, a.z), stack = stackOf(plan, 1), stacked = dist(me, stack) <= STACK_NEAR_M;
  const open = plan.door ? openingState(state, plan.door) === 'open' : true;
  if (!inside && !stacked && !(here.rec && here.rec.state === 'entered')) {
    const p = planBundle(state, pid, 'stack:up', { door: here.door, rung, atMs: ms, variant: state.stop?.variant ?? {} });
    if (p) out.push(row(`drill:stack:up>${here.door}`, 'bundle', p.label, p.ms, { beats: p.beats.map(b => ({ id: b.key, k: b.k, ch: b.ch, ms: b.ms })), bundle: 'stack:up', single: true, group: 'stack', slot: 0, reorg: p.reorg }));
  }
  // (the door's rows: by its swing, a lock striking push and pull; within reach of its middle)
  const o = plan.door ? openingOf(plan.door) : null;
  if (o && !open && dist(me, doorMid(o)) <= DOOR_REACH_M) {
    const how = swingOf(state, plan) ?? 'push', locked = lockedOf(state, o.id), t = doorS(sk.wh, how, rung, o.openS ?? DOOR_S);
    out.push(row(`door:${how}>${o.id}`, 'door', `${MUSCLE['door:open'].label}: ${how}`, t.ms, { off: locked ? 'locked' : null, how, group: 'door', slot: 1 }));
    const kick = doorS(sk.wh, 'kick', rung, o.openS ?? DOOR_S), od = kickOdds(state, pid, o.id);
    out.push(row(`door:kick>${o.id}`, 'door', MUSCLE['door:kick'].label, kick.ms, { odds: od, routine: false, skill: 'fitness', how: 'kick', group: 'door', slot: 2 }));
    if (!state.armoury?.range?.house?.read?.[o.id]) out.push(row(`door:read>${o.id}`, 'door', MUSCLE['door:read'].label, READ_S * paceOf(sk.awr) * 1000, { how: 'read', group: 'door', slot: 0 }));
  }
  // (the inner doors the plan does not take, from inside: Hold it (the #2's muzzle on it), and its own rows, a lock striking push and pull)
  // (in the doorway with the door open too: from rung 3 the eyes sweep the sector while the feet are still in the door, so the
  // bundle asks "Hold it or clear it?" from there (the fixer's of 0.0.12: asked where the panel had no Hold it, T walked on))
  const atDoor = inside || (open && !!plan.door && inFunnel(plan, a.x, a.z));
  for (const id of plan.inner ?? []) {
    const io = openingOf(id), held = houseOf(state)?.two?.hold === id;
    if (!io || !atDoor) continue;
    out.push(row(`door:hold>${id}`, 'door', 'Hold it', 0, { off: held ? 'held' : null, how: 'hold', group: 'room' }));
    if (openingState(state, io) === 'open') continue;
    const how = swingOf(state, { ...plan, door: id }, plan.room) ?? 'push', t = doorS(sk.wh, how, rung, io.openS ?? DOOR_S), k2 = doorS(sk.wh, 'kick', rung, io.openS ?? DOOR_S);
    out.push(row(`door:${how}>${id}`, 'door', `${MUSCLE['door:open'].label}: ${how}`, t.ms, { off: lockedOf(state, id) ? 'locked' : null, how, inner: true, group: 'door' }));
    out.push(row(`door:kick>${id}`, 'door', MUSCLE['door:kick'].label, k2.ms, { odds: kickOdds(state, pid, id), routine: false, skill: 'fitness', how: 'kick', inner: true, group: 'door' }));
  }
  // (Watch a hot spot from outside; Look at one inside)
  const muzzleYaw = a.headRad ?? 0;
  for (const h of plan.hot ?? []) {
    const turn = Math.abs(wrap(bearing(me, hotXZ(h)) - muzzleYaw)) / D2R, name = hotName(plan, h);
    if (!inside) out.push(row(`watch:${h.id}`, 'watch', `Watch: ${name}`, watchS(sk.wh, turn) * 1000, { hot: h.id, off: a.watch?.hotId === h.id ? 'watching' : null }));
    else out.push(row(`look:${h.id}`, 'look', `Look: ${name}`, lookS(sk.awr, turn) * 1000, { hot: h.id }));
  }
  // (Move: inside a room to the slot's point; along the hall to its end; never through a door's plane below rung 2 (see the header))
  if (inside) {
    const pt = pointOf(plan, 1), legs = legsOf(state, pid), way = wayOf(state, [me, pt]), P = profileOf(pathLen(way), legs.walk.combat, legs.pushMs2, legs.brakeMs2);
    if (dist(me, pt) > STACK_NEAR_M) out.push(row('move:point', 'move', 'Move to your point', P.T * 1000, { to: pt, path: way }));
    // (a far leg not yet seen: the walk up to where it is (the plan's far path from where you stand), by a press as by the keys)
    const far = plan.far, farEnd = far?.path?.at(-1) ?? null;
    if (far && !here.rec?.covered?.[far.hot] && dist(me, farEnd) > STACK_NEAR_M) {
      const fp = wayOf(state, pathFrom(far.path, me)), FP = profileOf(pathLen(fp), legs.walk.combat, legs.pushMs2, legs.brakeMs2);
      out.push(row('move:far', 'move', 'Move: the far leg', FP.T * 1000, { to: farEnd, path: fp }));
    }
    out.push(row('call:clear', 'call', 'Clear!', (rung >= 3 ? CALL_FLOW_S : CALL_S) * 1000, { say: 'clear' }));
    out.push(row('mark', 'mark', 'Mark the room', MARK_S * paceOf(sk.wh) * 1000));
  } else if (here.door === 'hall') {
    const pt = pointOf(plan, 1), legs = legsOf(state, pid), way = pt ? wayOf(state, [me, pt]) : null, P = way ? profileOf(pathLen(way), legs.walk.combat, legs.pushMs2, legs.brakeMs2) : null;
    if (pt && dist(me, pt) > STACK_NEAR_M) out.push(row('move:hallEnd', 'move', 'Move to the hall\'s end', P.T * 1000, { to: pt, path: way }));
    out.push(row('call:clear', 'call', 'Clear!', (rung >= 3 ? CALL_FLOW_S : CALL_S) * 1000, { say: 'clear' }));
  }
  // (the stances: the others than the body's)
  const now = a.moveStance ?? 'relaxed';
  // (named for what they trade (the user's remark of 2026-11-11): Careful is Combat, Fast is Assault; the effect, shooting.js's hint)
  for (const s of MOVE_STANCES) if (s !== now) out.push(row(`gait:${s}`, 'gait', STANCE_NAMES[s], 0, { gait: s, stance: s, group: 'body' }));
  return out;
}
/**
 * Before GO in the house (the tower's MAKE READY: on your mark, gait Combat; shoothouse.js houseWant), the rows that put the
 * body right in the mode: Back on your mark (a move to the lane's start, routed) when off it by more than the course's
 * stackM, and Careful (Combat) when the gait is another. The play review of 2026-11-13: off the mark, T entered the mode,
 * nothing in it walked you back, X left it and T entered it again, 40 times. The panel's shape, as singleRows'.
 */
export function preGoRows(state, pid = playerId(state), ms = state.clock.ms) {
  const a = actorOf(state, pid), H = houseOf(state);
  if (!a || !H || (H.goAtMs !== null && H.goAtMs !== undefined)) return [];
  const out = [], S0 = HOUSE1.start, me = [a.x, a.z], to = [S0.x, S0.z];
  const row = (id, kind, label, ms0, o = {}) => ({ id, kind, label, ms: Math.round(ms0), rushMs: null, carefulMs: null, odds: null, routine: true, off: null, subs: [], cmd: false, skill: null, door: null, group: SINGLE_GROUP[kind] ?? null, ...o });
  if (dist(me, to) > COURSES.house.stackM) {
    const legs = legsOf(state, pid), way = wayOf(state, [me, to]), P = profileOf(pathLen(way), legs.walk.combat, legs.pushMs2, legs.brakeMs2);
    out.push(row('move:mark', 'move', 'Back on your mark', P.T * 1000, { to, path: way }));
  }
  if ((a.moveStance ?? 'relaxed') !== 'combat') out.push(row('gait:combat', 'gait', STANCE_NAMES.combat, 0, { gait: 'combat', stance: 'combat', group: 'body' }));
  return out;
}
// (the singles' groups on the panel (COMBAT §25.19.2: stack, door, room; the stances BODY's))
const SINGLE_GROUP = Object.freeze({ bundle: 'stack', door: 'door', watch: 'room', look: 'room', move: 'room', call: 'room', mark: 'room', gait: 'body' });
// (a hot spot's name in the panel's words)
const HOT_WORDS = Object.freeze({ 'behind the door': 'behind the door', corner: 'the corner', 'far leg': 'the far leg' });
/** A corner this deep past the door's plane or less is a near one, metres; this far or less off the door's middle is straight ahead (my calls). */
export const HOT_NEAR_M = 1.5, HOT_AHEAD_M = 0.3;
function hotName(plan, h) {
  if (h.why && h.why !== 'corner') return HOT_WORDS[h.why] ?? h.why;
  // (as seen from the door looking in: its depth past the plane, and its side of the door's middle; the plane's normal into
  // the room is the facing, and left of it is (f.z, -f.x) with x east and z south)
  const P = plan.plane, [hx, hz] = hotXZ(h);
  if (P && plan.door) {
    const f = P.axis === 'x' ? [0, P.into] : [P.into, 0], mid = (P.a + P.b) / 2;
    const c = P.axis === 'x' ? [mid, P.at] : [P.at, mid], dx = hx - c[0], dz = hz - c[1];
    const depth = dx * f[0] + dz * f[1], side = dx * f[1] - dz * f[0];
    const near = depth <= HOT_NEAR_M ? 'near' : 'far';
    return Math.abs(side) <= HOT_AHEAD_M ? `the ${near} wall` : `the ${near} ${side > 0 ? 'left' : 'right'} corner`;
  }
  // (a leg with no door (the hall): by its place along the walk from #1's stack to his point, its side of that line as
  // walked (left of a facing f is (f.z, -f.x)), so two spots at the hall's end read apart (the fixer's of 0.0.12: both
  // read "the far right corner"))
  const st = stackOf(plan, 1), pt = pointOf(plan, 1);
  if (!st || !pt) return 'the far end';
  const f = [pt[0] - st[0], pt[1] - st[1]], L = Math.hypot(f[0], f[1]) || 1, dx = hx - st[0], dz = hz - st[1];
  const along = (dx * f[0] + dz * f[1]) / L, side = (dx * f[1] - dz * f[0]) / L;
  const end = along >= L / 2 ? 'the far end' : 'the near end';
  return Math.abs(side) <= HOT_AHEAD_M ? end : `${end}, ${side > 0 ? 'left' : 'right'}`;
}

/**
 * Start a bundle row for the player in stop motion (see the header): rowId 'drill:<bundle>[@<variant>]><door>' or a
 * single's beats (row.beats). Returns { ok, why }.
 */
export function startBundle(state, bus, pid, rowId, { tempo = 'normal', row = null } = {}) {
  const S = state.stop;
  if (!S || S.mode !== 'stop') return { ok: false, why: 'not in the mode' };
  const m = /^drill:([a-z:-]+?)(?:@([a-z+]+))?(?:>(.+))?$/.exec(rowId ?? '');
  if (!m) return { ok: false, why: 'no such bundle' };
  const B = bundleDef(m[1]);
  if (!B) return { ok: false, why: 'no such bundle' };
  if (!offered(state, pid, B)) return { ok: false, why: B.rung > rungOf(state, pid, 'room') ? 'not taught' : 'by hand first' };
  const variant = { ...(S.variant ?? {}) };
  for (const t of (m[2] ?? '').split('+').filter(Boolean)) { if (['cross', 'hook'].includes(t)) variant.entry = t; else if (['push', 'pull', 'kick'].includes(t)) variant.breach = t; else if (['assault', 'combat'].includes(t)) variant.stance = t; }
  const rung = rungOf(state, pid, 'room'), plan = planBundle(state, pid, B.id, { door: m[3] ?? null, rung, variant, atMs: state.clock.ms, tempo });
  if (!plan) return { ok: false, why: 'no door' };
  return beginBeats(state, bus, pid, { step: rowId, bundle: B.id, plan, tempo, label: plan.label });
}
// (a beat doing set on the player's stop and begun: 'stop' released, the start fact, the first beats at the clock)
function beginBeats(state, bus, pid, { step, bundle, plan, tempo, label }) {
  const S = state.stop, now = state.clock.ms;
  const d = { who: pid, step, kind: 'bundle', bundle, tempo, rung: plan.rung, slot: plan.slot, door: plan.door, variant: plan.variant, beats: plan.beats.map(b => ({ ...b, st: 'wait', fromMs: null, untilMs: null })),
    lanes: {}, subs: [], fromMs: now, atMs: now, untilMs: now, untilPlanMs: now + plan.ms, seams: plan.seams ?? [], ...(label ? { label } : {}) };
  feetTo(state, now);
  // (a new bundle or single in place of a suspended flow: the flow's rest is dropped, the new doing planned from the body)
  S.doing = d; S.phase = 'act'; S.queue = []; S.carry = null; S.feet = null; S.flow = null;
  // (the stop's why reads what was begun last (cqb.js stopLead): kept in the house only, so every other scene's bytes stand)
  if (houseOf(state)) S.last = { step, bundle: bundle ?? null, door: plan.door ?? null, atMs: now };
  const me = actorOf(state, pid);
  if (me?.watch && !String(step).startsWith('watch:')) delete me.watch;
  // (a bundle or single begun with the rifle at the aim that moves or sweeps the eyes: the muzzle up first, as a carry's and the
  // flow's (2026-11-12, R3: the flow going on by itself replaced the carry that raised it; the corporal's Dominate, begun aimed
  // after his shot, swept his sector across his #2 on every seed: the gauges' F8, muzzle 100 in 100 lanes). The carry plans its own.
  if (step !== 'drill:carry' && !String(step).startsWith('watch:') && d.beats.some(b => b.k === 'move' || b.k === 'scan') && d.beats[0]?.k !== 'posture') upFirst(state, d, now);
  releaseTime(state, 'stop');
  bus?.emit('bundle', { phase: 'start', who: pid, id: step, beat: null, ch: null, atMs: now, label, ms: plan.ms });
  const r = advanceBeats(state, bus, d, now);
  if (r !== 'running') beatsDone(state, bus, d, r);
  return { ok: true, why: null };
}
// (the player's beat doing finished: choosing again, the rest as "Carry on" when it halted; suspended, the flow kept)
function beatsDone(state, bus, d, r) {
  const S = state.stop;
  if (!S || S.doing !== d) return;
  S.doing = null;
  S.phase = 'choose';
  if (r === 'suspended') {
    // (the flow suspended (see the header): kept whole on the stop, the choice made with time standing still; the pause's own
    // hold is contact.js's while a window is open, else this one; a man of the room up at "Clear!" is bracketed)
    S.flow = d; S.carry = null;
    if (d.suspended?.why === 'up') upPick(state, d, bus);
    if (!state.mind?.contact?.pending) holdTime(state, 'stop');
    return;
  }
  S.carry = r === 'halted' ? carryOf(d) : null;
  // (the halt said its own fact when it came (the stepper's); here the doing's end, halted or not)
  bus?.emit('bundle', { phase: 'end', who: d.who, id: d.step, beat: null, ch: null, atMs: d.untilMs, why: d.halt?.why ?? null });
  if (d.halt?.words) bus?.emit('line', { text: d.halt.words, kind: 'warn' });
  // (no hold inside a take-in's window: the window runs at 1:1 to its pause (contact.js))
  if (!state.mind?.contact?.pending) holdTime(state, 'stop');
}
// (a halted doing's rest as the panel's "Carry on" (see beatsDone), or null)
function carryOf(d) {
  if (!d.rest?.length) return null;
  // (a move cut where it stood leaves the rest of its path: the carry on, and a shot row fired moving on, take it from there)
  const paths = {};
  for (const b of d.beats) if (b.st === 'cut' && b.k === 'move' && b.prof) paths[b.key] = restPath(b, b.untilMs);
  return { from: d.step, bundle: d.bundle, door: d.door, rung: d.rung, variant: d.variant, beats: d.rest, why: d.halt?.why ?? null, words: d.halt?.words ?? null, paths };
}
// (a man of the room up at "Clear!": the bracket on him, your own corner's first, the last contact his (contact.js relook: a
// man the last pause did not take in has no rows and no line, and the honest T waited out the stall: 2026-11-12, R3's gauges,
// the tier one on seeds 1259 and 1333 with 1a's hands unseen after a challenge and 1b's pause after it))
function upPick(state, d, bus = null) {
  const S = state.stop, plan = planOf(state, d.beats.find(b => b.k === 'call' && b.st === 'wait')?.plan ?? d.door), two = !!houseOf(state)?.twoPid, ms = state.clock.ms;
  const up = plan ? upIn(state, plan.room, ms) : [], known = state.mind?.contact?.known ?? {};
  const mine = up.filter(t => !two || (t.slot ?? 1) === 1), T = mine.find(t => known[t.key] !== undefined) ?? mine[0] ?? up[0];
  if (!T) return;
  relook(state, bus, T.key, ms);
  S.pick = T.key; S.via = 'contact';
}
/** The men of your own corner up and facing that you know of (COMBAT §25.19.3.3's "a man still up"): the last contact's, and those of the room you are in seen and not forgotten. */
export function mineUp(state, ms = state.clock.ms) {
  const c = state.mind?.contact, L = c?.last, known = c?.known ?? {}, R = state.armoury?.range, two = !!R?.house?.twoPid;
  const room = doorNow(state, playerId(state))?.plan?.room ?? null;
  return (R?.turners ?? []).filter(T => (!two || (T.slot ?? 1) === 1) && ['threat', 'armoured', 'hostage'].includes(T.face) && (T.stoppedAtMs === null || T.stoppedAtMs === undefined)
    && facingOf(T, ms) >= 0.5 && (L?.ids?.includes(T.key) || (room && T.room === room && known[T.key] !== undefined)));
}

// ---- the flow (see the header) ----

/**
 * The steps that need the feet (COMBAT §25.19.3.1 item 3): chosen at a suspension they halt the flow, its rest "Carry on".
 * The challenge is the voice's, said on the way to the point (my call: the design lists it with Hold him, but halted it stood
 * the honest T in the doorway for its 1.2 s and earned the funnel fault, a fault by T: the gauges of 2026-11-12, F8).
 */
export const FLOW_FEET_KINDS = Object.freeze(new Set(['contact', 'stance', 'wait', 'breathe', 'leave']));
export const FLOW_VOICE_IDS = Object.freeze(new Set(['contact:challenge']));
/** Whether a list step chosen at a suspension runs inside the flow (on the hands, or the voice) or halts it (the feet's): st the panel's row, way a shot's feet. */
export const flowsWith = (st, way = null) => !!st && !st.needsFeet && (FLOW_VOICE_IDS.has(st.id) || !FLOW_FEET_KINDS.has(st.kind)) && !String(st.id).startsWith('stance:') && way !== 'stop' && way !== 'planted';
/** The player's suspended flow, or null. */
export const flowOn = (state) => (state.stop?.flow?.suspended ? state.stop.flow : null);
/**
 * A list step about to begin while a flow is suspended (shooting.js startStep, before the step's plan): taken up beside it
 * on the hands (stepper.js resume) or, a step that needs the feet, halted where it stands into "Carry on". Returns 'flow',
 * 'halted' or null (no flow).
 */
export function flowIn(state, bus, st, way = null) {
  const S = state.stop, F = flowOn(state);
  if (!F) return null;
  const now = state.clock.ms;
  if (flowsWith(st, way)) { resume(F, now, { ch: FLOW_VOICE_IDS.has(st.id) ? 'voice' : 'hands', step: st.id }); return 'flow'; }
  haltFlow(state, bus, F, 'contact', now);
  return 'halted';
}
// (a flow halted where it stands into "Carry on": its moves cut, the rest the panel's)
function haltFlow(state, bus, F, why, ms) {
  const S = state.stop;
  resume(F, ms);
  delete F.hold;
  haltDoing(state, bus, F, why, null, ms);
  advanceBeats(state, bus, F, ms);
  S.flow = null;
  S.carry = carryOf(F);
  bus?.emit('bundle', { phase: 'end', who: F.who, id: F.step, beat: null, ch: null, atMs: ms, why });
}
// (the flow beside a list step ended, halted or suspended on its own (stepper.js advance): kept as it is, the step's end decides)
function flowAdvanced(state, bus, F, r) { if (r === 'ended' || r === 'halted') F.over = r; }
/** Whether a man of your own corner is up and facing that you know of (mineUp; the #2's are his: COMBAT §25.19.4's #2 sector rule's part the flow reads). */
export const ownUp = (state, ms = state.clock.ms) => mineUp(state, ms).length > 0;
/**
 * A list step ended with the flow beside it (shooting.js afterEnd, see the header): why the step's end ('end', 'stop' (the
 * gun), 'halt', 'cut'), owed whether a decision is owed whatever the step (a window open, a reflex card to come). Returns
 * true when the drill went on by itself (the flow the doing again), false when the choice is the player's (the flow
 * suspended again, or over: its rest "Carry on" if it halted).
 */
export function flowAfter(state, bus, d, why, { owed = false } = {}) {
  const S = state.stop, F = S?.flow;
  if (!F) return false;
  const now = state.clock.ms;
  release(F, now, { ok: why === 'end' });
  if (F.over) {
    const r = F.over; delete F.over;
    S.flow = null;
    if (r === 'halted') S.carry = carryOf(F);
    bus?.emit('bundle', { phase: 'end', who: F.who, id: F.step, beat: null, ch: null, atMs: F.untilMs ?? now, why: F.halt?.why ?? null });
    if (F.halt?.words) bus?.emit('line', { text: F.halt.words, kind: 'warn' });
    return false;
  }
  // (a failure drill whose third round was not fired on a man down after the pair ended as planned: its 'cut' is an end)
  const ended = why === 'end' || (why === 'cut' && d?.assessed === 'down');
  if (owed || !ended || d?.gunStop || S.queue?.length || ownUp(state, now)) {
    suspendFlow(state, bus, F, 'decision', now);
    advanceBeats(state, bus, F, now);
    return false;
  }
  // (your "Clear!" the scene found void (a man of the room turned as you called it: the range's knowledge, not yours, which
  // the gate no longer reads): the drill is not done with the room, so the call is owed again, at most CALL_AGAIN_N times
  // (the reach review of 2026-11-13: the void call ended the drill, a stop more in the hall on 8 of 10 lanes))
  for (const b of F.beats ?? []) {
    if (b.k !== 'call' || b.say !== 'clear' || b.st !== 'done' || (b.voids ?? 0) >= CALL_AGAIN_N || !callVoid.fn?.(state, b.plan, b.untilMs)) continue;
    b.voids = (b.voids ?? 0) + 1; b.st = 'wait'; b.redo = true; b.untilMs = now;
    delete b.clearFromMs; delete b.gateFromMs; delete b.manFromMs;
  }
  // (the drill goes on: the bundle the doing again, the rifle back to high ready first where the step left it aimed)
  upFirst(state, F, now);
  S.flow = null; S.doing = F; S.phase = 'act';
  if (houseOf(state)) S.last = { step: F.step, bundle: F.bundle ?? null, door: F.door ?? null, atMs: now };
  releaseTime(state, 'stop');
  bus?.emit('bundle', { phase: 'resume', who: F.who, id: F.step, beat: null, ch: null, atMs: now });
  const r = advanceBeats(state, bus, F, now);
  if (r !== 'running') beatsDone(state, bus, F, r);
  return true;
}
// (the muzzle up to high ready first, a hands beat flowing with the feet from rung 3, where the rifle is at the aim (carryPlan's))
function upFirst(state, F, ms) {
  if (state.people?.[F.who]?.kit?.carry?.posture !== 'aimed') return;
  const first = F.beats.find(b => b.st === 'wait') ?? F.beats[0], pre = /^\d+:/.test(first?.key ?? '') ? first.key.split(':')[0] + ':' : '';
  const n = F.beats.filter(b => /(^|:)up(\.\d+)?$/.test(b.key)).length, wh = skillsOf(state, F.who).wh;
  F.beats.unshift({ key: `${pre}up.${n}`, k: 'posture', ch: 'hands', to: 'highReady', after: [], cut: false, door: first?.door ?? null, plan: first?.plan ?? null, slot: F.slot ?? 1, st: 'wait', fromMs: null, untilMs: null,
    ms: Math.round(HIGH_READY_S * HIGH_READY_K * paceOf(wh) * 1000) });
  F.atMs = Math.max(F.atMs ?? 0, ms);
}
useBeats({ done: beatsDone, flow: flowAdvanced });

/** The rest of a move beat's path from where it stood at ms: [[x, z] there, …the waypoints still ahead]. */
export function restPath(b, ms) {
  const P = b.prof, sNow = profileAt(P, Math.max(0, (ms - b.fromMs) / 1000)).s, here = moveAt(b, ms);
  const out = [[here.x, here.z]];
  let acc = 0;
  for (let i = 1; i < b.path.length; i++) { acc += dist(b.path[i - 1], b.path[i]); if (acc > sNow + 0.01) out.push([...b.path[i]]); }
  return out.length > 1 ? out : [[here.x, here.z], [...b.path.at(-1)]];
}

/** The "Carry on" row of a halted bundle (see the header), or null: { id: 'drill:carry', kind: 'bundle', label: 'Carry on: …', ms }. */
export function carryRow(state, pid = playerId(state), ms = state.clock.ms) {
  const F = flowOn(state);
  if (F) return flowRow(state, F, ms);
  const C = state.stop?.carry;
  if (!C?.beats?.length) return null;
  const p = carryPlan(state, pid, C, ms);
  if (!p) return null;
  // (the leg it stands in by its beats, the legs after it by name: "in, the sector, "Clear!", the mark; then room 2, room 3
  // and the hall" (the fixer's of 0.0.12: the lane's rest listed every beat, its keys '2:far' among them))
  const order = laneOf(state)?.order ?? [], legName = (door) => { const i = order.indexOf(door); return i < 0 ? 'the next' : door === 'hall' ? 'the hall' : `room ${i + 1}`; };
  const first = p.beats[0]?.plan ?? null, here = p.beats.filter(b => b.plan === first), later = [...new Set(p.beats.filter(b => b.plan !== first).map(b => legName(b.plan)))];
  const beatWords = [...new Set(here.map(b => BEAT_WORDS[b.key.split(':').at(-1)] ?? b.key.split(':').at(-1)))].join(', ');
  const words = later.length ? `${beatWords}; then ${later.length > 1 ? `${later.slice(0, -1).join(', ')} and ${later.at(-1)}` : later[0]}` : beatWords;
  return { id: 'drill:carry', kind: 'bundle', label: `Carry on: ${words}`, ms: p.ms, rushMs: null, carefulMs: null, odds: null, routine: true, off: null, subs: [], beats: p.beats.map(b => ({ id: b.key, k: b.k, ch: b.ch, ms: b.ms })), cmd: false, skill: null, lead: true, carry: true };
}
// (the suspended flow's "Carry on": its beats not done, taken up as they stand)
function flowRow(state, F, ms) {
  const left = F.beats.filter(b => b.st === 'wait' || b.st === 'run');
  if (!left.length) return null;
  const order = laneOf(state)?.order ?? [], legName = (door) => { const i = order.indexOf(door); return i < 0 ? 'the next' : door === 'hall' ? 'the hall' : `room ${i + 1}`; };
  const first = left[0]?.plan ?? null, here = left.filter(b => b.plan === first), later = [...new Set(left.filter(b => b.plan !== first).map(b => legName(b.plan)))];
  const beatWords = [...new Set(here.map(b => BEAT_WORDS[b.key.split(':').at(-1).replace(/\.\d+$/, '')] ?? b.key.split(':').at(-1)))].join(', ');
  const words = later.length ? `${beatWords}; then ${later.length > 1 ? `${later.slice(0, -1).join(', ')} and ${later.at(-1)}` : later[0]}` : beatWords;
  const until = F.untilPlanMs ?? ms, at = F.suspended?.atMs ?? ms;
  return { id: 'drill:carry', kind: 'bundle', label: `Carry on: ${words}`, ms: Math.max(0, until - at), rushMs: null, carefulMs: null, odds: null, routine: true, off: null, subs: [], beats: left.map(b => ({ id: b.key, k: b.k, ch: b.ch, ms: b.ms })), cmd: false, skill: null, lead: true, carry: true, flow: true };
}
/** The beats' words in "Carry on: …". */
export const BEAT_WORDS = Object.freeze({ approach: 'the stack', reorg: 'the top up', ready: 'high ready', up: 'the muzzle up', muzzle: 'the muzzle on the door', read: 'the read', tell: 'the word to your two', squeeze: 'the squeeze', door: 'the door', breach: 'the breach', enter: 'in', corner: 'your corner', sector: 'the sector', inner: 'the inner door', far: 'the far leg', farlook: 'a look down the far leg', clear: '"Clear!"', roomclear: '"Room clear!"', mark: 'the mark' });
// (the rest re-planned from where the body is now, keeping the bundle's beat ids)
function carryPlan(state, pid, C, ms) {
  const full = planBundle(state, pid, C.bundle, { door: C.door, rung: C.rung, variant: C.variant ?? {}, atMs: ms });
  if (!full) return null;
  const keep = new Set(C.beats), beats = full.beats.filter(b => keep.has(b.key));
  if (!beats.length) return null;
  const a = actorOf(state, pid), v0 = Math.hypot(a?.v?.[0] ?? 0, a?.v?.[1] ?? 0);
  const firstMove = beats.find(b => b.k === 'move');
  if (firstMove && a) {
    const legs = legsOf(state, pid), cut = C.paths?.[firstMove.key];
    // (taken up from the body's place along the cut path, never back to a waypoint already behind it, and routed)
    const path = wayOf(state, pathFrom(cut ?? firstMove.path, [a.x, a.z]), doorsOf(beats)), P = profileOf(pathLen(path), legs.walk[firstMove.stance], legs.pushMs2, legs.brakeMs2, { v0, v1: firstMove.prof.v1 });
    Object.assign(firstMove, { path, prof: P, ms: Math.round(P.T * 1000), arriveMs: Math.round(profileWhen(P, P.L - ARRIVE_M) * 1000) });
  }
  // (a dependency on a beat already done is met: dropped)
  for (const b of beats) b.after = b.after.filter(x => keep.has(x.split('@')[0]));
  // (the rifle still at the aim after the shots: the rest starts with the muzzle up to high ready, a hands beat that flows
  // with the feet from rung 3, so the walk on never sweeps the #2 (the fixer's second pass of 0.0.12: the sergeant's Carry
  // on walked room 1 aimed and took the muzzle fault on his own #2, the line "Muzzle. Up." in the middle of T's bundle).
  // First whatever the rest holds: a lane's rest holds the next room's own high ready, which waits on the approach's
  // 60%, so asked only where the rest held no posture beat the tier one walked out of room 2 aimed across his still #2
  // for 2.35 s and took the fault (the user, 2026-11-11: "we still get flagged a fault for muzzle"))
  if (state.people?.[pid]?.kit?.carry?.posture === 'aimed' && beats[0]?.k !== 'posture') {
    const pre = /^\d+:/.test(beats[0].key) ? beats[0].key.split(':')[0] + ':' : '', wh = skillsOf(state, pid).wh;
    beats.unshift({ key: `${pre}up`, k: 'posture', ch: 'hands', to: 'highReady', after: [], cut: false, door: beats[0].door ?? null, plan: beats[0].plan, slot: 1, st: 'wait', fromMs: null, untilMs: null,
      ms: Math.round(HIGH_READY_S * HIGH_READY_K * paceOf(wh) * 1000) });
  }
  const d = { beats, rung: C.rung, atMs: ms, fromMs: ms, lanes: {}, subs: [] };
  return { beats, ms: simulate(d), rung: C.rung, slot: 1, door: C.door, variant: C.variant, seams: [] };
}
/** Carry on (the panel's "Carry on: …"): the halted bundle's rest from where the body is. Returns { ok, why }. */
export function carryOn(state, bus, pid = playerId(state), { tempo = 'normal' } = {}) {
  const S = state.stop, F = flowOn(state);
  if (F) {
    // (a suspended flow taken up with nothing beside it: a no-shoot's, the #2's man's (COMBAT §25.19.4: "Carry on (T): at rung 2 and up the flow resumes"))
    const now = state.clock.ms;
    resume(F, now); upFirst(state, F, now);
    S.flow = null; S.doing = F; S.phase = 'act'; S.queue = [];
    if (houseOf(state)) S.last = { step: F.step, bundle: F.bundle ?? null, door: F.door ?? null, atMs: now };
    releaseTime(state, 'stop');
    bus?.emit('bundle', { phase: 'resume', who: pid, id: F.step, beat: null, ch: null, atMs: now });
    const r = advanceBeats(state, bus, F, now);
    if (r !== 'running') beatsDone(state, bus, F, r);
    return { ok: true, why: null };
  }
  const C = S?.carry;
  if (!C) return { ok: false, why: 'nothing to carry on' };
  const p = carryPlan(state, pid, C, state.clock.ms);
  if (!p) { S.carry = null; return { ok: false, why: 'nothing left' }; }
  return beginBeats(state, bus, pid, { step: 'drill:carry', bundle: C.bundle, plan: p, tempo, label: 'Carry on' });
}
/** Backspace (or X on a bundle): stop the player's bundle after its beat (the stepper's 'stop'). Returns whether it was asked. */
export function stopBundle(state, bus, pid = playerId(state)) {
  const d = state.stop?.doing;
  if (!d?.beats) return false;
  return haltDoing(state, bus, d, 'stop', null, state.clock.ms);
}
/** Hand a running bundle back (contact.js at the pause, the scene for 'two', 'noshoot', 'gun', 'lane-end'): why one of the stepper's HALTS. */
export function handBack(state, bus, why, words = null, pid = playerId(state)) {
  // (a flow suspended or beside a step: halted where it stands into "Carry on" (the lane's end))
  if (state.stop?.flow) { haltFlow(state, bus, state.stop.flow, why, state.clock.ms); return true; }
  const d = state.stop?.doing;
  if (!d?.beats) return false;
  return haltDoing(state, bus, d, why, words ?? HANDBACK_WORDS[why] ?? null, state.clock.ms);
}

/** A single's run in stop motion (the door's rows, Watch, Look, Move, "Clear!", Mark, the stances): one beat through the stepper. Returns { ok, why }. */
export function startSingle(state, bus, pid, row, { tempo = 'normal' } = {}) {
  const S = state.stop;
  if (!S || S.mode !== 'stop' || !row) return { ok: false, why: 'not offered' };
  if (row.off) return { ok: false, why: row.off };
  const a = actorOf(state, pid), sk = skillsOf(state, pid), rung = rungOf(state, pid, 'room'), here = doorNow(state, pid);
  if (row.kind === 'gait') { setStance(state, bus, pid, row.gait); return { ok: true, why: null }; }
  if (row.kind === 'watch') {
    const h = here?.plan?.hot?.find(x => x.id === row.hot);
    if (!h || !a) return { ok: false, why: 'nothing to watch' };
    const yaw = q(bearing([a.x, a.z], hotXZ(h)), 1e-6);
    const beat = { key: 'watch', k: 'wait', ch: 'hands', ms: row.ms, after: [], st: 'wait' };
    const r = beginBeats(state, bus, pid, { step: row.id, bundle: null, plan: { beats: [beat], ms: row.ms, rung, slot: 1, door: here.door, variant: {}, seams: [] }, tempo, label: row.label });
    // (the Watch is the body's, kept out of the mode while the keys walk him in: actor.watch, until the pause takes it in)
    a.watch = { hotId: h.id, x: h.x, z: h.z, yawRad: yaw, fromMs: state.clock.ms };
    a.headRad = yaw; setPosture(state, pid, 'highReady');
    return r;
  }
  let beat;
  if (row.kind === 'door' && row.how === 'read') {
    beat = { key: 'read', k: 'wait', ch: 'eyes', ms: row.ms, after: [] };
    ((state.armoury.range.house ??= {}).read ??= {})[here.plan.door] = state.clock.ms;
  } else if (row.kind === 'door' && row.how === 'hold') {
    const H = houseOf(state); if (H?.two) H.two.hold = row.id.split('>')[1];
    bus?.emit('say', { who: pid, text: 'Hold that door.', kind: 'speech', durMs: 800 });
    // (the question answered, the drill goes on by itself: one press for the inner door (COMBAT §25.19.4: "Hold it (T)"; the
    // rework's R4: Hold it then Carry on was two presses at one stop, the gauges' F13)
    if (S.carry?.why === 'door-unplanned' && !(plan0(state, pid)?.inner ?? []).some(id => openingState(state, id) !== 'open' && H?.two?.hold !== id)) carryOn(state, bus, pid);
    return { ok: true, why: null };
  } else if (row.kind === 'door') {
    const how = row.how, t = doorS(sk.wh, how, rung);
    beat = { key: 'door', k: 'door', ch: 'hands', door: row.id.split('>')[1], how, ms: t.ms, passMs: t.passMs, handMs: t.handMs, after: [] };
  } else if (row.kind === 'look') {
    const h = here?.plan?.hot?.find(x => x.id === row.hot);
    beat = { key: `look:${row.hot}`, k: 'scan', ch: 'eyes', hot: row.hot, deg: 0, ms: row.ms, after: [] };
    if (a && h) a.headRad = q(bearing([a.x, a.z], hotXZ(h)), 1e-6);
  } else if (row.kind === 'move') {
    const legs = legsOf(state, pid), path = wayOf(state, row.path ? pathFrom(row.path, [a.x, a.z]) : [[a.x, a.z], row.to]), st = a.moveStance === 'assault' ? 'assault' : 'combat';
    const P = profileOf(pathLen(path), legs.walk[st], legs.pushMs2, legs.brakeMs2);
    beat = { key: 'move', k: 'move', ch: 'feet', stance: st, path, prof: P, ms: Math.round(P.T * 1000), after: [], cut: true };
    // (the far leg's walk: the body turns onto the leg as it comes into view, as the bundle's does)
    const fh = row.id === 'move:far' ? here?.plan?.hot?.find(x => x.id === here.plan.far?.hot) : null;
    if (fh) beat.look = [fh.x, fh.z];
  } else if (row.kind === 'call') beat = { key: 'clear', k: 'call', ch: 'voice', say: 'clear', ms: row.ms, after: [], plan: here?.door ?? null };
  else if (row.kind === 'mark') beat = { key: 'mark', k: 'mark', ch: 'hands', ms: row.ms, after: [] };
  if (!beat) return { ok: false, why: 'not offered' };
  if (tempo === 'rushed' && beat.k !== 'move') beat.ms = Math.round(beat.ms * RUSH_K);
  return beginBeats(state, bus, pid, { step: row.id, bundle: null, plan: { beats: [beat], ms: beat.ms, rung, slot: 1, door: here?.door ?? null, variant: {}, seams: [] }, tempo, label: row.label });
}

// (the plan of the door you are at)
const plan0 = (state, pid) => doorNow(state, pid)?.plan ?? null;
/** The body's movement stance set (V in the house, the gait rows): Relaxed slings the rifle's posture to slung, Combat low ready, Assault shouldered; the 'gait' fact. */
export function setStance(state, bus, pid, to) {
  const a = actorOf(state, pid);
  if (!a || !MOVE_STANCES.includes(to)) return false;
  const from = a.moveStance ?? 'relaxed';
  if (from === to) return false;
  a.moveStance = to;
  bus?.emit('gait', { who: pid, from, to, atMs: state.clock.ms });
  // (the first switch explains itself in one line (the user, 2026-11-11: "don't know what the assault <-> combat option is
  // supposed to mean"): what the stance trades, in numbers, once a game (state.mind.hints.stance))
  if (pid === playerId(state) && !state.mind?.hints?.stance) {
    ((state.mind ??= {}).hints ??= {}).stance = state.clock.ms;
    const words = stanceWords.fn ? stanceWords.fn(state, pid, to) : STANCE_NAMES[to];
    bus?.emit('line', { text: `${words}. ${STANCE_HINT}`, kind: 'note' });
  }
  return true;
}
/** The first switch's second sentence: what V does, by the names that say what they trade. */
export const STANCE_HINT = 'V: Relaxed (rifle slung), Careful (Combat: steadier), Fast (Assault: quicker, shots worse on the move).';
// (the stance's effect in numbers, specials.js stanceHint, registered at its load: held on a function, as the clear gate is)
function stanceWords() { return stanceWords.fn ?? null; }
/** The stance's words in numbers for the first switch's line (specials.js registers stanceHint). */
export function useStanceWords(fn) { stanceWords.fn = typeof fn === 'function' ? fn : null; }

// ---- the face's view ----

/**
 * The running bundle (see the header): { id, label, lanes: { feet, hands, eyes, voice: [{ key, glyph }] }, fromMs, untilMs,
 * k } or null; glyphs (stepper.js markOf) ✓ passed, ◦ routine, ~ a natural 1 caught, ★ a natural 20, ✗ a failure that cost, – cut, · to come, ▸ running.
 */
export function bundleNow(state, pid = playerId(state), ms = state.clock.ms) {
  const d = state.stop?.who === pid ? (state.stop?.doing?.beats ? state.stop.doing : state.stop?.flow ?? state.stop?.doing) : houseOf(state)?.two?.pid === pid ? houseOf(state).two.doing : null;
  if (!d?.beats) return null;
  const lanes = { feet: [], hands: [], eyes: [], voice: [] };
  for (const b of d.beats) {
    if (!lanes[b.ch]) continue;
    const g = b.st === 'wait' ? '·' : b.st === 'run' ? '▸' : b.st === 'cut' ? '–' : markOf(d.subs.find(s => s.beat === b.key) ?? { ok: true }) ?? '✓';
    lanes[b.ch].push({ key: b.key, glyph: g });
  }
  const until = d.untilPlanMs ?? d.untilMs, k = until > d.fromMs ? Math.max(0, Math.min(1, (ms - d.fromMs) / (until - d.fromMs))) : 1;
  return { id: d.step, label: d.label ?? bundleDef(d.bundle)?.label ?? d.step, lanes, fromMs: d.fromMs, untilMs: until, k };
}
/** The sector the bundle's eyes hold now (react.js heldSectorOf reads it): { yawRad, why: 'bundle' } or null. */
export function bundleEyes(state, pid = playerId(state)) {
  const d = state.stop?.who === pid ? (state.stop?.doing?.beats ? state.stop.doing : state.stop?.flow ?? state.stop?.doing) : houseOf(state)?.two?.pid === pid ? houseOf(state).two.doing : null, a = actorOf(state, pid);
  if (!d?.beats || !a) return null;
  const b = d.beats.find(x => x.st === 'run' && x.k === 'scan') ?? d.beats.find(x => x.st === 'run' && x.k === 'move' && x.key.endsWith('enter'));
  if (!b) return null;
  const plan = planOf(state, b.plan), c = plan ? cornerOf(plan, b.slot ?? 1) : null;
  return c ? { yawRad: Math.atan2(c.z - a.z, c.x - a.x), why: 'bundle' } : null;
}
// ---- the #2: his slot through the same plan (see the header) ----

/**
 * The #2's slot this tick (the scene's houseActors, the think layer): rec R.house.two { pid, aid, rung, doing, hold,
 * contact, fired, hits }. At the lane's door: below rung 3 one group at a time ('stack:up' then the door's wait, the
 * entry, the sector) with goMs between, from rung 3 the room; his entry waits for #1's crossing the plane. Returns his
 * doing's state: 'idle' | 'running' | 'ended' | 'halted'.
 */
export function runSlot(state, bus, rec, ms = state.clock.ms) {
  if (!rec?.pid) return 'idle';
  const a = actorOf(state, rec.pid);
  if (!a) return 'idle';
  // (a man of his seen: his take-in, his identification and his row are the scene's; his slot halts where it stands and
  // starts nothing until they are done (the fixer's of 0.0.12: a Dominate planned in his window was halted the next tick and
  // never run again, so he stood 0.38 m off his point, his sector unswept))
  // (a man he takes on the move, your man while he covers you on his way in (the rework's R6: contact.move, eng.move), leaves his walk be)
  const busy = !!((rec.contact && !rec.contact.move) || (rec.eng && !rec.eng.move));
  if (busy && rec.doing && !rec.doing.halt) haltDoing(state, bus, rec.doing, 'contact', null, ms);
  if (rec.doing) {
    // (his eyes on a man he takes on the move: his corner's and his sector's looks wait, paused where they stand, none started,
    // and go on once he is off him (the rework's R9, 2026-11-13: room 2's corner ran out while his head was on the armoured man
    // he took for you, and your "Clear!" came with his corner never looked at: "Corner!", 2 of 100 tier one lanes, F7)
    // (and while he covers your sector, his head on your man or your sector's middle (shoothouse.js twoCover))
    if (rec.contact?.move || rec.eng?.move || rec.cover) { rec.doing.eyesOff = true; pauseScans(rec.doing, ms); }
    else if (rec.doing.eyesOff) { delete rec.doing.eyesOff; rec.doing.atMs = Math.max(rec.doing.atMs ?? 0, ms); }
    const r = advanceBeats(state, bus, rec.doing, ms);
    // (time held off the looks is lived: what waits on them starts from now, not back when the eyes left)
    if (rec.doing.eyesOff) rec.doing.atMs = Math.max(rec.doing.atMs ?? 0, ms);
    const mv = rec.doing.beats.find(b => b.st === 'run' && b.k === 'move' && b.prof);
    // (his place by his move's closed form, its speed his body's (BODY §16.8); with none running, the free body's brake)
    if (mv) {
      let p = moveAt(mv, ms);
      // (the body gap (see the header): his next place closing within BODY_GAP_M of yours holds his walk a tick, his time
      // and the doing's planned end with it, counted on his record (rec.gap); the cue and the departure should leave it idle)
      // (and never into a doorway he cannot cross: held outside it while you stand in his way through it (zoneGate, the rework's R8b))
      if (zoneGate(state, rec, a, p, mv, ms) || gapHold(state, rec, a, p, ms)) {
        // (held by you in a doorway: never a queue there; he gives way, out of it away from you, and his walk is planned again
        // once his way through is clear (giveWay below; the rework's R8b: the fuzz's lanes stood both of you 4 to 6 minutes))
        if (giveWayOut(state, bus, rec, a, ms)) return 'halted';
        mv.fromMs += TICK_MS; mv.untilMs += TICK_MS; if (Number.isFinite(rec.doing.untilPlanMs)) rec.doing.untilPlanMs += TICK_MS; p = { ...moveAt(mv, ms), vMs: 0 };
      }
      placeAt(state, rec.pid, a, p.x, p.z); a.headRad = p.headRad; a.locoMs = ms;
      if (p.vMs > 0) a.v = [q(p.vMs * Math.cos(p.headRad), 0.001), q(p.vMs * Math.sin(p.headRad), 0.001)]; else delete a.v;
      delete a.through;
    } else freeBody(state, rec, a, ms, busy);
    // (his eyes: a scan sweeps his head across his sector over its time, as the player's does (shooting.js stopRules); a
    // move with a look or held eyes faces them (the fixer's of 0.0.12: his head stayed on the near corner through his
    // sector's scan, so he never saw room 3's near-leg man)
    const sc = rec.doing.beats.find(b => b.st === 'run' && b.k === 'scan' && b.sweep);
    if (sc) { const k = sc.untilMs > sc.fromMs ? Math.min(1, Math.max(0, (ms - sc.fromMs) / (sc.untilMs - sc.fromMs))) : 1; a.headRad = q(sc.sweep[0] + wrap(sc.sweep[1] - sc.sweep[0]) * k, 1e-6); }
    else if (mv && (mv.eyes ?? mv.look)) { const e = mv.eyes ?? mv.look; a.headRad = q(Math.atan2(e[1] - a.z, e[0] - a.x), 1e-6); }
    // (his moves obey the crossing rule too (COMBAT §25.19.5))
    crossTick(state, rec.pid, ms);
    if (r === 'running') return r;
    rec.last = { step: rec.doing.step, untilMs: rec.doing.untilMs, why: rec.doing.halt?.why ?? null };
    // (the room swept only by a Dominate that ran to its end; a halted one is planned again from where he stands)
    if (r === 'ended' && rec.doing.bundle === 'room:dominate') (rec.swept ??= {})[rec.doing.door] = ms;
    rec.doing = null;
    return r;
  }
  // (no slot running: his body brakes from whatever speed a cut or a move's end left it (the brake, never the cut)), carried
  // through a doorway rather than left at rest in it (freeBody)
  freeBody(state, rec, a, ms, busy);
  if (a.through) return 'idle';
  if (busy) return 'idle';
  const here = doorNow(state, playerId(state));
  if (!here) return 'idle';
  const rung = rec.rung ?? rungOf(state, rec.pid, 'room'), gap = goMs(skillsOf(state, rec.pid).wf);
  if (rec.last && ms < rec.last.untilMs + (rung < 3 ? gap : 0)) return 'idle';
  // (his entry cued by distance (COMBAT §25.19.3.4, the rework's R5): your centre ENTRY_GAP_M past your own threshold
  // waypoint, his lane his own, so he steps in almost at once behind you and never through you (v0.0.12 cued him on your
  // first step into the doorway: through your body 1.8 s a lane))
  const me = playerActor(state), plan = here.plan;
  const inside1 = me ? entryGo(state, plan, me, ms, here.rec) : false;
  const stacked2 = dist([a.x, a.z], stackOf(plan, 2)) <= STACK_NEAR_M, inside2 = pastThreshold(plan, a.x, a.z);
  let bundle = null;
  // (cued, he goes in from wherever he stands: a man cut mid-entry by his contact goes on in, never back to the stack)
  // (the catalogue's groups, one at a time (COMBAT §25.19.2.3): the stack, in to his corner, his point and his sector)
  if (!inside2 && inside1) bundle = 'room:in';
  else if (!inside2 && !stacked2 && here.rec?.state !== 'clear') bundle = rung >= 2 ? 'stack:point' : 'stack:up';
  else if (inside2 && !rec.swept?.[here.door]) bundle = 'room:dominate';
  if (!bundle && !(stacked2 && !inside2)) return 'idle';
  // (to the next stack he goes with you (COMBAT §25.19.5): not before your own move starts (the tick yours does), and then when
  // his walk keeps the body gap off yours (giveWay): v0.0.12 left on a poll the moment the room was clear and stood on your way)
  const stackRow = bundle === 'stack:point' || bundle === 'stack:up';
  if (stackRow && !leadGone(state, rec, here, me)) return 'idle';
  // (not cued yet but at his stack, your walk in known: he steps off so as to reach his own threshold as you are ENTRY_GAP_M past
  // yours, never sooner (entryAhead: "almost simultaneously", the gap kept at the door rather than waited for at the stack))
  if (!bundle && !inside2 && stacked2 && me && entryAhead(state, rec, a, here, me, rung, ms)) bundle = 'room:in';
  if (!bundle) return 'idle';
  // (never into a leaf still swinging: a door kicked or pushed by the keys is 'open' at once, its leaf at its stop only at its
  // swing's end (model.js leafClosed), and the #2 cued in that while walked into it (2026-11-12, the gauges' F1: a recruit's
  // fuzz lane, the #2 0.14 m into room 1's leaf on his lane))
  if (bundle === 'room:in' && plan.door && leafClosed(state, plan.door, ms)) return 'idle';
  // (nor into a doorway you stand in, or stand on his way through: he holds at his stack, outside it, until you are through
  // (the rework's R8b, the user, 2026-11-13: "soldiers need to stay fluidly moving"; never a queue in the door))
  if (bundle === 'room:in' && !inside2 && !crossingClear(state, entryPath(plan, 2), [a.x, a.z])) return 'idle';
  // (his beats at his own rung, the recruit's #2 his muzzle on the door as the recruit's; only the groups are rung 2's, his
  // keys being the drill's (the fixer's of 0.0.12: planned at rung 2 or above, a private's #2 stacked a muzzleS quicker))
  let p = planBundle(state, rec.pid, bundle, { door: here.door, slot: 2, rung, atMs: ms, from: [a.x, a.z] });
  if (!p) return 'idle';
  // (going to the next stack from further back than you are (his point deep in the room, yours by its door; or you left first),
  // he hurries: his approach at Fast when his walk to his stack is HURRY_M longer than yours to your own, so he is on his slot
  // as you stand on yours (the rework's R9, 2026-11-13: F17, the fuzz walked from room 1's door at once while he stood on his
  // point, and he came up 2.19 m short; the same with the sergeant, 4.04 m))
  const myLeft = me ? pathLen(wayOf(state, [[me.x, me.z], stackOf(plan, 1)], [plan.door].filter(Boolean))) : 0, hisApp = p.beats.find(b => b.key === 'approach');
  if (stackRow && hisApp?.path && pathLen(hisApp.path) > myLeft + HURRY_M) p = planBundle(state, rec.pid, bundle, { door: here.door, slot: 2, rung, atMs: ms, from: [a.x, a.z], hurry: true }) ?? p;
  delete rec.wait;
  // (his start: now, or later by the least delay that keeps his walk off yours (a stack row's only); the doing waits for it)
  const at = stackRow ? ms + giveWay(state, rec, a, p, me, ms) : ms;
  rec.doing = { who: rec.pid, step: `drill:${bundle}>${here.door}`, kind: 'bundle', bundle, tempo: 'normal', rung, slot: 2, door: here.door, variant: p.variant, beats: p.beats.map(b => ({ ...b, st: 'wait' })),
    lanes: {}, subs: [], fromMs: at, atMs: at, untilMs: at, untilPlanMs: at + p.ms, seams: [] };
  bus?.emit('bundle', { phase: 'start', who: rec.pid, id: rec.doing.step, beat: null, ch: null, atMs: at, label: p.label, ms: p.ms });
  return 'running';
}
// (the #2's free body this tick (the rework's R8b, fluid movement): where his brake would leave him at rest in a no-stop zone (a
// doorway), carried through to his next point past it on his own lane (places/move.js throughTick), held off you as his walks
// are (gapHold); his head left on his man while he takes one (busy: the scene's); else the brake (coastTo))
export function freeBody(state, rec, a, ms, busy = false) {
  const t = throughTick(state, rec.pid, a, ms);
  if (!t) { coastTo(state, rec.pid, a, ms, { record: false }); return; }
  let p = moveAt(t, ms);
  if (gapHold(state, rec, a, p, ms)) {
    // (his carry into you, in a doorway: out of it the other way, away from you (throughAway), once)
    const me = playerActor(state), away = me ? unit([a.x - me.x, a.z - me.z]) : null, alt = t.way !== 'away' ? throughAway(state, rec.pid, a, away, ms) : null;
    if (alt) { a.through = alt; return freeBody(state, rec, a, ms, busy); }
    t.fromMs += TICK_MS; t.untilMs += TICK_MS; p = { ...moveAt(t, ms), x: a.x, z: a.z, vMs: 0, done: false };
  }
  placeAt(state, rec.pid, a, p.x, p.z); a.locoMs = ms;
  if (!busy) a.headRad = p.headRad;
  if (p.vMs > 0) a.v = [q(p.vMs * Math.cos(p.headRad), 0.001), q(p.vMs * Math.sin(p.headRad), 0.001)]; else delete a.v;
  if (p.done) delete a.through;
}
// ---- the #2 beside you: the entry gap, the body gap, going with you (COMBAT §25.19.3.4, §25.19.5) ----

// (a point's place along a path: the arc length of its projection, and how far off the path it stands)
function onPath(path, p) {
  let best = { s: 0, off: Infinity }, run = 0;
  for (let i = 1; i < path.length; i++) {
    const [ax, az] = path[i - 1], [bx, bz] = path[i], L = Math.hypot(bx - ax, bz - az);
    const t = L > 0 ? Math.max(0, Math.min(1, ((p[0] - ax) * (bx - ax) + (p[1] - az) * (bz - az)) / (L * L))) : 0;
    const off = Math.hypot(p[0] - (ax + t * (bx - ax)), p[1] - (az + t * (bz - az)));
    if (off < best.off - 1e-9) best = { s: run + t * L, off };
    run += L;
  }
  return best;
}
/** How far #1 stands past his own threshold waypoint (m): along his entry path where he is on it (within ENTRY_OFF_M), else straight from it once past the threshold; null outside. */
export function pastWaypointM(plan, x, z) {
  const path = entryPath(plan, 1), th = onPath(path, plan.threshold ?? path[0]), me = onPath(path, [x, z]);
  if (me.off <= ENTRY_OFF_M) return me.s - th.s;
  if (!pastThreshold(plan, x, z)) return null;
  const w = alongPath(path, th.s);
  return Math.hypot(x - w[0], z - w[1]);
}
/** Off his path by more than this, #1's gap is measured straight from the waypoint (m; my call). */
export const ENTRY_OFF_M = 0.3;
// (the point s metres along a path)
function alongPath(path, s) {
  let left = s;
  for (let i = 1; i < path.length; i++) {
    const L = dist(path[i - 1], path[i]);
    if (left <= L || i === path.length - 1) { const k = L > 0 ? Math.max(0, Math.min(1, left / L)) : 0; return [path[i - 1][0] + (path[i][0] - path[i - 1][0]) * k, path[i - 1][1] + (path[i][1] - path[i - 1][1]) * k]; }
    left -= L;
  }
  return path[0];
}
/** How far ahead #1's walk in is looked at for the entry's cue (ms; my call). */
export const ENTRY_AHEAD_MS = 4000;
/**
 * The entry's cue ahead of time (see ENTRY_GAP_M): your walk in running (its closed form), the #2 at his stack and the door
 * passable, he steps off on the first tick at which his own walk from rest (planned from where he stands, kept on his record
 * while he stands there) reaches his threshold waypoint no sooner than yours reaches ENTRY_GAP_M past your own.
 */
export function entryAhead(state, rec, a, here, me, rung, ms = state.clock.ms) {
  const plan = here.plan, lead = moveNow(state, playerId(state));
  if (!lead?.prof || (plan.door && (openingState(state, plan.door) !== 'open' || leafClosed(state, plan.door, ms)))) return false;
  // (when your walk reaches the gap: the first tick at or after ms, Infinity where it stops short)
  let t1 = Infinity;
  for (let t = ms; t <= Math.min(lead.untilMs ?? ms, ms + ENTRY_AHEAD_MS); t += TICK_MS) {
    const p = moveAt(lead, t), m = pastWaypointM(plan, p.x, p.z);
    if (m !== null && m >= ENTRY_GAP_M) { t1 = t; break; }
  }
  if (!Number.isFinite(t1)) return false;
  // (his time to his own threshold waypoint from rest, by his entry's walk as planned from his stack)
  const key = `${here.door}@${q(a.x, 0.01)},${q(a.z, 0.01)}`;
  if (rec.entryT?.key !== key) {
    const p2 = planBundle(state, rec.pid, 'room:in', { door: here.door, slot: 2, rung, atMs: ms, from: [a.x, a.z] }), mv = p2?.beats.find(b => b.key === 'enter' && b.prof);
    const path2 = entryPath(plan, 2), th2 = alongPath(path2, onPath(path2, plan.threshold ?? path2[0]).s), s2 = mv ? onPath(mv.path, th2).s : null;
    rec.entryT = { key, ms: mv && s2 !== null ? Math.round(profileWhen(mv.prof, s2) * 1000) : null };
  }
  return rec.entryT.ms !== null && ms + rec.entryT.ms >= t1;
}
/** Whether #1 is far enough in for the #2 to step in behind him (see ENTRY_GAP_M): rec the leg's record (its enteredAtMs). */
export function entryGo(state, plan, me, ms = state.clock.ms, rec = null) {
  if (!plan || !me) return false;
  if (plan.door && openingState(state, plan.door) !== 'open') return false;
  const m = pastWaypointM(plan, me.x, me.z);
  if (m !== null && m >= ENTRY_GAP_M) return true;
  // (a #1 who stopped inside (the keys' take-in brake, a planted shot) cues him after ENTRY_WAIT_MS: the body gap holds him off)
  return pastThreshold(plan, me.x, me.z) && Number.isFinite(rec?.enteredAtMs) && ms - rec.enteredAtMs >= ENTRY_WAIT_MS;
}
// ---- the #2 and the doorway (the rework's R8b, fluid movement: places/zones.js's no-stop zones) ----

/** How far past a doorway's edge the #2's way through it must be clear of you before he steps into it (m: the body gap, my call). */
export const CROSS_CLEAR_M = BODY_GAP_M;
/** You moving at this or more, or on a move of the game's, are passing through, not standing in his way (m/s: the gauges' still speed). */
export const CROSS_STILL_MS = 0.3;
// (a polyline from its point nearest `from` on: the arc s of that point, and the path's points after it)
function restOf(path, from) {
  const pr = onPath(path, from);
  let run = 0;
  for (let i = 1; i < path.length; i++) {
    const L = dist(path[i - 1], path[i]);
    if (run + L >= pr.s - 1e-9) return [alongPath(path, pr.s), ...path.slice(i)];
    run += L;
  }
  return [path[path.length - 1]];
}
// (the least distance from a point to a polyline)
function toLine(path, p) { return onPath(path, p).off; }
/**
 * Whether the #2's way through a doorway is clear of you (see CROSS_CLEAR_M): along his path from where he stands, the stretch
 * that lies in a no-stop zone and CROSS_CLEAR_M past its last point in one, with you not standing within the body gap (and its
 * guard) of it. You on the move are no block: you never come to rest in a doorway but by your own choice (places/move.js
 * throughOf), so he follows you through it, the body gap kept (gapHold). True where his path crosses no zone.
 */
export function crossingClear(state, path, from) {
  const me = playerActor(state), area = state.places?.live?.area;
  if (!me || !area || !path?.length) return true;
  if (Math.hypot(me.v?.[0] ?? 0, me.v?.[1] ?? 0) >= CROSS_STILL_MS || moveNow(state, playerId(state))) return true;
  const rest = restOf(path, from), pts = [];
  let inside = false, past = 0;
  for (let i = 0; i < rest.length; i++) {
    const z = !!liveZoneAt(state, area, rest[i][0], rest[i][1]);
    if (z) inside = true;
    pts.push(rest[i]);
    if (inside && !z) {
      // (the stretch past the zone, CROSS_CLEAR_M of it)
      const prev = rest[i - 1] ?? rest[i], l = dist(prev, rest[i]);
      past += l;
      if (past >= CROSS_CLEAR_M) break;
    }
  }
  // (a zone entered along a leg whose ends both lie outside it: sampled every 0.1 m)
  if (!inside) for (let i = 1; i < rest.length && !inside; i++) { const l = dist(rest[i - 1], rest[i]), n = Math.ceil(l / 0.1); for (let k = 1; k < n; k++) if (liveZoneAt(state, area, rest[i - 1][0] + (rest[i][0] - rest[i - 1][0]) * k / n, rest[i - 1][1] + (rest[i][1] - rest[i - 1][1]) * k / n)) { inside = true; break; } }
  if (!inside) return true;
  return pts.length < 2 ? dist(pts[0], [me.x, me.z]) >= BODY_GAP_M + GAP_GUARD_M : toLine(pts, [me.x, me.z]) >= BODY_GAP_M + GAP_GUARD_M;
}
// (held by you where he must not wait: in a doorway, or where your own move is held by his body (both standing, each in the
// other's way: the fuzz's lanes stood them 4 to 6 minutes): his doing halted ('two') and a walk out of your way, back to his
// stack at the lane's door where he is off it (places/move.js stepAside), else out of the doorway away from you (throughAway);
// his entry cued again only once his way through is clear (crossingClear). Returns whether he gave way)
function giveWayOut(state, bus, rec, a, ms) {
  const area = state.places?.live?.area, me = playerActor(state);
  if (!area || !me) return false;
  const inZone = !!liveZoneAt(state, area, a.x, a.z), mine = moveNow(state, playerId(state)), stuck = !!mine && mine.heldAtMs === ms;
  if (!inZone && !stuck) return false;
  const here = doorNow(state, playerId(state)), st = here ? stackOf(here.plan, 2) : null;
  const t = (st && dist([a.x, a.z], st) > STACK_NEAR_M ? stepAside(state, rec.pid, a, st, ms) : null) ?? (inZone ? throughAway(state, rec.pid, a, unit([a.x - me.x, a.z - me.z]), ms) : null);
  if (!t) return false;
  haltDoing(state, bus, rec.doing, 'two', null, ms);
  advanceBeats(state, bus, rec.doing, ms);
  rec.last = { step: rec.doing.step, untilMs: ms, why: 'two' };
  rec.doing = null;
  a.through = t;
  (rec.gave ??= { n: 0 }).n += 1;
  return true;
}
const unit = (d) => { const l = Math.hypot(d[0], d[1]); return l > 1e-9 ? [d[0] / l, d[1] / l] : null; };
// (the doorway's gate for the #2's walk this tick: his next place p in a no-stop zone he is not yet in, his way through it not
// clear of you (crossingClear): held a tick where he stands, outside it, counted on his record (rec.gate))
function zoneGate(state, rec, a, p, mv, ms) {
  const area = state.places?.live?.area;
  const hold = !!area && !liveZoneAt(state, area, a.x, a.z) && !!liveZoneAt(state, area, p.x, p.z) && !crossingClear(state, mv.path, [p.x, p.z]);
  if (!hold) { if (rec.gate) rec.gate.runMs = 0; return false; }
  const G = (rec.gate ??= { holds: 0, ms: 0, runMs: 0 });
  if (!G.runMs) G.holds += 1;
  G.runMs += TICK_MS; G.ms += TICK_MS;
  return true;
}
// (the body gap's guard for the #2's walk this tick: his next place p closing within BODY_GAP_M + GAP_GUARD_M of yours)
function gapHold(state, rec, a, p, ms) {
  const me = playerActor(state);
  if (!me) return false;
  const now = dist([a.x, a.z], [me.x, me.z]), next = dist([p.x, p.z], [me.x, me.z]), hold = next < BODY_GAP_M + GAP_GUARD_M && next < now - 1e-6;
  const G = (rec.gap ??= { holds: 0, ms: 0, maxMs: 0, runMs: 0 });
  if (!hold) { G.runMs = 0; return false; }
  if (!G.runMs) G.holds += 1;
  G.runMs += TICK_MS; G.ms += TICK_MS; G.maxMs = Math.max(G.maxMs, G.runMs);
  return true;
}
// (you have gone for the next stack: your own move running, or LEAD_GONE_M from where you stood when he began to wait, or there)
function leadGone(state, rec, here, me) {
  if (!me) return true;
  if (moveNow(state, playerId(state))) return true;
  if (dist([me.x, me.z], stackOf(here.plan, 1)) <= STACK_NEAR_M) return true;
  const w = (rec.wait ??= { door: here.door, at: [q(me.x, 1e-4), q(me.z, 1e-4)] });
  if (w.door !== here.door) { rec.wait = { door: here.door, at: [q(me.x, 1e-4), q(me.z, 1e-4)] }; return false; }
  return dist([me.x, me.z], w.at) >= LEAD_GONE_M;
}
/**
 * The least delay before the #2 leaves for his stack (ms, whole ticks) that keeps his walk GIVE_MARGIN_M more than the body gap
 * off yours, your running move's closed form against his planned one, looked at a tick at a time until GIVE_TAIL_MS past both
 * ends (you standing where your walk ends, or where you stand); the delay that keeps him furthest off when none does.
 */
export function giveWay(state, rec, a, p, me, ms = state.clock.ms) {
  const mv2 = p.beats.find(b => b.k === 'move' && b.prof);
  if (!mv2 || !me) return 0;
  const lead = moveNow(state, playerId(state)), T2 = Math.round(mv2.prof.T * 1000);
  const end1 = lead ? Math.max(ms, lead.untilMs ?? ms) : ms, at1 = (t) => (lead ? moveAt(lead, t) : me);
  const want = BODY_GAP_M + GAP_GUARD_M + GIVE_MARGIN_M;
  let best = { d: 0, min: -Infinity };
  for (let d = 0; d <= GIVE_MAX_MS; d += GIVE_STEP_MS) {
    const b2 = { ...mv2, fromMs: ms + d, untilMs: ms + d + T2 }, until = Math.max(end1, ms + d + T2) + GIVE_TAIL_MS;
    let min = Infinity;
    for (let t = ms; t <= until && min >= want; t += TICK_MS) {
      const p1 = at1(t), p2 = t < ms + d ? a : moveAt(b2, t);
      min = Math.min(min, dist([p1.x, p1.z], [p2.x, p2.z]));
    }
    if (min >= want) return d;
    if (min > best.min + 1e-6) best = { d, min };
  }
  return best.d;
}
// ---- the crossing rule (see the header) ----

// (the teammate a person's muzzle must not cross in the house: the player's #2, or the #2's player)
function mateOf(state, pid) {
  const H = houseOf(state), two = H?.two?.pid ?? H?.twoPid ?? null;
  if (!two) return null;
  return actorOf(state, pid === two ? playerId(state) : pid === playerId(state) ? two : null);
}
// (whether an aimed muzzle carried along a move's next CROSS_AHEAD_MS would cross the mate, the head held where it is)
function crossing(state, pid, a, mv, ms, mate) {
  for (let t = 0; t <= CROSS_AHEAD_MS; t += CROSS_STEP_MS) {
    const p = moveAt(mv, ms + t), m = muzzleOf(state, pid, { ...a, x: p.x, z: p.z }, 'aimed');
    if (flagsAt(m, mate.x, mate.z, mate.stance ?? 'stand')) return true;
  }
  return false;
}
/**
 * The crossing rule for one person this tick (see the header; COMBAT §25.19.2.1): a move under way whose next CROSS_AHEAD_MS
 * would carry an aimed muzzle's line across the teammate brings the rifle to low ready (the carry's `cross`, { from, atMs },
 * what it goes back to), and back to the aim once the look ahead is clear. A step on the hands (a shot row, the aim) owns the
 * posture: the rule stands aside for it. Returns 'low', 'back' or null.
 */
export function crossTick(state, pid, ms = state.clock.ms) {
  const c = state.people?.[pid]?.kit?.carry, a = actorOf(state, pid), mate = mateOf(state, pid);
  if (!c || !a || !mate) return null;
  const me = pid === playerId(state), mv = me ? moveNow(state, pid) : houseOf(state)?.two?.doing?.beats?.find(b => b.st === 'run' && b.k === 'move' && b.prof) ?? null;
  const hands = me && !!state.stop?.doing && !state.stop.doing.beats;
  if (c.cross) {
    if (hands) { delete c.cross; return null; }
    if (mv && c.posture === 'lowReady' && crossing(state, pid, a, mv, ms, mate)) return null;
    if (c.posture === 'lowReady') c.posture = c.cross.from;
    delete c.cross;
    return 'back';
  }
  if (hands || !mv || c.posture !== 'aimed' || !crossing(state, pid, a, mv, ms, mate)) return null;
  c.cross = { from: 'aimed', atMs: ms };
  c.posture = 'lowReady';
  return 'low';
}

/** How far the #2 stands from his slot's stack at the lane's door at ms (m; his running move's closed form, else his actor), or null. */
export function twoOffSlot(state, rec, ms = state.clock.ms) {
  const a = rec?.pid ? actorOf(state, rec.pid) : null, here = doorNow(state, playerId(state));
  if (!a || !here) return null;
  const mv = rec.doing?.beats?.find(b => b.st === 'run' && b.k === 'move' && b.prof), p = mv ? moveAt(mv, ms) : a;
  return dist([p.x, p.z], stackOf(here.plan, 2));
}
/** When the #2's running move brings him within TWO_SLOT_M of his slot (ms, a whole tick), or null where no move of his gets him there. */
export function twoArriveMs(state, rec, ms = state.clock.ms) {
  const here = doorNow(state, playerId(state)), mv = rec?.doing?.beats?.find(b => b.st === 'run' && b.k === 'move' && b.prof);
  if (!here || !mv) return null;
  const slot = stackOf(here.plan, 2), off = (t) => { const p = moveAt(mv, t); return dist([p.x, p.z], slot); };
  if (off(mv.untilMs) > TWO_SLOT_M) return null;
  if (off(ms) <= TWO_SLOT_M) return ms;
  // (the last stretch of a walk onto the slot closes on it: the first time within, by bisection)
  let lo = ms, hi = mv.untilMs;
  for (let k = 0; k < 30 && hi - lo > 1; k++) { const m = (lo + hi) / 2; if (off(m) <= TWO_SLOT_M) hi = m; else lo = m; }
  return Math.ceil(hi / TICK_MS) * TICK_MS;
}
// ---- a save made before the catalogue (COMBAT §25.19.2.2; the pre-1.0 rule: carried where it comes naturally) ----

// (a beat's key without the lane's leg prefix ('1:approach' → 'approach'), and the prefix ('1:'), or '')
const legOfKey = (k) => (/^\d+:/.test(k ?? '') ? k.split(':')[0] + ':' : '');
const bareKey = (k) => String(k ?? '').replace(/^\d+:/, '');
// (a doing of the withdrawn lane's bundle cut to the leg it stands in, as that door's room row: its beats of that leg kept, their
// keys and dependencies without the prefix, a dependency on another leg's beat dropped (done, or not this row's))
function laneToRoom(d) {
  const cur = d.beats.find(b => b.st === 'run' || b.st === 'wait') ?? d.beats.at(-1), pre = legOfKey(cur?.key), door = cur?.plan ?? d.door;
  d.beats = d.beats.filter(b => legOfKey(b.key) === pre).map(b => ({ ...b, key: bareKey(b.key), after: (b.after ?? []).filter(x => legOfKey(x) === pre).map(bareKey) }));
  for (const L of Object.values(d.lanes ?? {})) for (const g of L) g.key = bareKey(g.key);
  for (const sub of d.subs ?? []) if (sub.beat) sub.beat = bareKey(sub.beat);
  d.bundle = 'room:clear'; d.door = door; d.step = `drill:room:clear>${door}`;
  return d;
}
/**
 * The saves' mapping (an upgrade, on load): a running or suspended doing, a carry or the #2's doing of an id the catalogue
 * removed (enter-and-clear.js REMOVED): 'house:clear' becomes 'room:clear' for the leg it stands in; an id whose beats a
 * row keeps is renamed to it ('room:stack' Stack up, 'room:enter' In: your corner); any other loads as the choice (the
 * player's doing dropped, time standing still; the #2's dropped, he plans again).
 */
export function upgradeMuscle(state) {
  const S = state.stop, H = state.armoury?.range?.house;
  const lane = (() => { try { return state.places ? lanePlanOf(state) : null; } catch { return null; } })();
  const map = (d) => {
    if (!d?.beats || !(d.bundle in REMOVED)) return d;
    if (d.bundle === 'house:clear') return laneToRoom(d);
    const to = REMOVED[d.bundle];
    if (!to) return null;
    d.bundle = to; d.step = String(d.step ?? '').replace(/^drill:[a-z:-]+?(?=[@>]|$)/, `drill:${to}`);
    return d;
  };
  if (S?.doing?.beats && S.doing.bundle in REMOVED) {
    const d = map(S.doing);
    if (!d) { S.doing = null; S.phase = 'choose'; holdTime(state, 'stop'); }
  }
  if (S?.flow?.beats && S.flow.bundle in REMOVED) S.flow = map(S.flow);
  const C = S?.carry;
  if (C && C.bundle in REMOVED) {
    if (C.bundle === 'house:clear') {
      const n0 = Math.min(...(C.beats ?? []).map(k => Number(legOfKey(k).slice(0, -1) || 0))), pre = `${n0}:`, i0 = lane?.order?.indexOf(C.door) ?? -1;
      const door = i0 >= 0 ? lane.order[i0 + n0] ?? C.door : C.door;
      S.carry = { ...C, bundle: 'room:clear', door, beats: C.beats.filter(k => legOfKey(k) === pre || (!legOfKey(k) && n0 === 0)).map(bareKey),
        paths: Object.fromEntries(Object.entries(C.paths ?? {}).filter(([k]) => legOfKey(k) === pre).map(([k, v]) => [bareKey(k), v])) };
    } else if (REMOVED[C.bundle]) S.carry = { ...C, bundle: REMOVED[C.bundle] };
    else S.carry = null;
  }
  if (H?.two?.doing?.beats && H.two.doing.bundle in REMOVED) H.two.doing = map(H.two.doing);
}

export { flowOf, profileOf, profileAt, profileWhen, moveAt, moveNow };
