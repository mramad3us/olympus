// OLYMPUS sim: the bundles, the drill's steps for a slot and a rung, run through the stepper, and where they hand the decision back (COMBAT §25.2, §25.5, §25.7, §25.8; BODY §16.2; the build sheet 0.0.12 §2.2, §4, §8 items 2, 4, 8, 9, 20).
//
// What T does grows with the rung, the mechanics never change (the user, 2026-11-07: "no watering down but factor in
// experience in how smooth and fast we do things"): a bundle is the drill's beats (src/sim/combat/drills/enter-and-clear.js)
// planned for a door of the lane (src/sim/combat/room.js roomPlanOf: its stack, points, paths, corners, hot spots),
// a slot (1, the player's; 2, the #2's) and a rung, and run by the stepper (src/sim/combat/stepper.js), which runs the
// beats one at a time to rung 2 and lets the hands and the voice (rung 3) and the eyes (rung 4) work while the feet move.
//
// The beats' times (the build sheet's §4, each my call, reproducing §4's 1 G table):
//   move     the plan's path at the stance's walk (motion.js gaitSpeeds: Combat 1.23, Assault 2.03 m/s at 1 G), pushing
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
// The rows (shooting.js stepsOf reads them in the house): singleRows (every rung: Stack on the door, the door's rows by its
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
// at a time with react.js goMs between below rung 3, the whole room from 3, his beats at his own rung; his entry cued on
// #1's first step into the doorway with the door open (or past its plane); nothing new while he is on a man (his
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
// Pure but startBundle, stopBundle, carryOn, startSingle, runSlot and the beat handlers, which write the doing records,
// the actors, the doors and the facts.
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
import { openingOf, openingArea, openingState, setOpening } from '../places/model.js';
import { DOOR_S, leafAt } from '../places/doors.js';
import { AIM } from '../arms/shot.js';
import { facingOf } from '../arms/turners.js';
import * as KIT from '../arms/kit.js';
import { goMs } from './react.js';
import { registerKind, useBeats, advanceBeats, halt as haltDoing, flowOf, profileOf, profileAt, profileWhen, moveAt, moveNow, pathLen } from './stepper.js';
import { ENTER_AND_CLEAR, bundleDef, beatsOf, BUNDLES, ARRIVE_M, PASS_SHARE } from './drills/enter-and-clear.js';
import { roomPlanOf, lanePlanOf, pastThreshold, inFunnel } from './room.js';

/** The beats' times (see the header), s at pace 1 unless named. */
export const HIGH_READY_S = 0.3, HIGH_READY_K = 1.15, DOOR_HAND_S = 0.2, PULL_STEP_S = 0.3, KICK_S = 1.2, READ_S = 0.7, CALL_S = 0.8, CALL_FLOW_S = 0.2, MARK_S = 0.6;
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
/** The body under the kit when the person record gives none, and the kit when kit.js cannot weigh it (the build sheet §4: 25 kg on 75). */
export const BODY_KG = 75, KIT_KG = 25;
/** The words of the hand-backs (COMBAT §25.8.2). */
export const HANDBACK_WORDS = Object.freeze({
  refused: 'Locked. Kick it, or hold it.', 'refused-kick': 'Locked. Kick it again, or hold it.', 'door-unplanned': 'Door, {wall}. Hold it or clear it?',
  // (the lane's own door has no Hold it row, and a door not locked that held a kick is not locked (the fixer's of 0.0.12))
  'refused-lane': 'Locked. Kick it.', 'refused-kick-lane': 'Locked. Kick it again.', 'refused-held': 'It held. Kick it again.',
  two: "Your number two's not with you.", 'lane-end': 'End of the lane.', gun: 'The gun.', fail: 'Fumbled.', seam: null, contact: null, noshoot: null, stop: null,
});
/** The calls' words. */
export const SAY = Object.freeze({ clear: 'Clear!', ready: 'Ready.' });

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
export function planBundle(state, pid, bundleId, { door = null, slot = 1, variant = {}, rung = rungOf(state, pid, 'room'), atMs = state.clock.ms, from = null, v0 = 0, tempo = 'normal' } = {}) {
  const B = bundleDef(bundleId);
  if (!B) return null;
  const a = actorOf(state, pid), here = from ?? [a?.x ?? 0, a?.z ?? 0], sk = skillsOf(state, pid);
  const lane = laneOf(state), out = [];
  const doors = B.lane ? (() => { const i = lane?.order.indexOf(door ?? doorNow(state, pid)?.door) ?? -1; return i >= 0 ? lane.order.slice(i) : door ? [door] : []; })() : [door ?? doorNow(state, pid)?.door].filter(Boolean);
  let pos = here, vNow = v0, prevTail = null, prevPlan = null, odds = 1;
  const k = tempo === 'rushed' ? RUSH_K : 1;
  doors.forEach((dr, n) => {
    const plan = planOf(state, dr);
    if (!plan) return;
    const pre = B.lane ? `${n}:` : '', id = (x) => `${pre}${x}`, legs = legsOf(state, pid, pos[0], pos[1]);
    const how = variant.breach ?? (plan.door && lockedOf(state, plan.door) ? 'kick' : swingOf(state, plan) ?? 'push');
    const stance = entryStance(rung, variant), flowIn = rung >= 4, ids = beatsOf(B);
    for (const bid of ids) {
      const D = ENTER_AND_CLEAR.beats[bid];
      if (!D) continue;
      if (D.slots && !D.slots.includes(slot)) continue;
      if (D.rungs && !D.rungs.includes(Math.min(4, rung))) continue;
      if (bid === 'door' && !plan.door) continue;
      if ((bid === 'far' || bid === 'farlook') && !plan.far) continue;
      const after = (D.after ?? []).map(x => { const [b0, m] = x.split('@'); return `${pre}${b0}${m ? `@${m}` : ''}`; });
      if (bid === 'approach' && prevTail) after.push(prevTail);
      const beat = { key: id(bid), k: D.k, ch: D.ch, after, cut: !!D.cut, door: plan.door ?? null, plan: dr, slot, st: 'wait', fromMs: null, untilMs: null };
      if (D.k === 'move' && bid === 'far') {
        // (the far leg's walk from wherever the body stands, at Combat, braking to a stop where the leg is seen)
        const path = pathFrom(plan.far.path, pos), legs2 = legsOf(state, pid, pos[0], pos[1]);
        const P = profileOf(pathLen(path), legs2.walk.combat, legs2.pushMs2, legs2.brakeMs2, { v0: vNow, v1: 0 });
        Object.assign(beat, { path, stance: 'combat', prof: P, ms: Math.round(P.T * 1000), arriveMs: Math.round(profileWhen(P, Math.max(0, P.L - ARRIVE_M)) * 1000) });
        const h = plan.hot.find(x => x.id === plan.far.hot);
        if (h) beat.look = [h.x, h.z];
        vNow = 0; pos = path.at(-1);
      } else if (D.k === 'scan' && bid === 'farlook') {
        // (the eyes onto the far leg's middle, from the walk's heading)
        const h = plan.hot.find(x => x.id === plan.far.hot), fp = plan.far.path, end = fp.at(-1), from = fp.at(-2) ?? end;
        const hb = h ? bearing(end, hotXZ(h)) : bearing(from, end), deg = Math.abs(wrap(hb - bearing(from, end))) / D2R;
        Object.assign(beat, { to: 'far', deg: r2(deg), hot: h?.id ?? null, sweep: [q(bearing(from, end), 1e-6), q(hb, 1e-6)], ms: Math.round(lookS(sk.awr, deg) * 1000 * k), ...(h ? { eyes: [h.x, h.z] } : {}) });
      } else if (D.k === 'move') {
        const to = bid === 'approach' ? stackOf(plan, slot) : pointOf(plan, slot);
        // (the approach from the last room's point goes out the way it came in: its entry path reversed, then along the hall)
        const back = bid === 'approach' && prevPlan ? [...entryPath(prevPlan, slot)].reverse().slice(1) : [];
        const path = bid === 'approach' ? [pos, ...back, to] : pathFrom(entryPath(plan, slot), pos);
        const st = bid === 'approach' ? 'combat' : stance;
        const vMax = legs.walk[st];
        const v1 = bid === 'approach' && flowIn ? legs.walk.combat : 0;
        const P = profileOf(pathLen(path), vMax, legs.pushMs2, legs.brakeMs2, { v0: vNow, v1 });
        Object.assign(beat, { path, stance: st, prof: P, ms: Math.round(P.T * 1000), arriveMs: Math.round(profileWhen(P, P.L - ARRIVE_M) * 1000) });
        // (from rung 3 the eyes go in first, onto the slot's corner: a sector held through the entry (COMBAT §25.5.3); below it
        // the body still faces into the room as it goes in (`look`: the facing the eye's cone is, never a held sector))
        if (bid === 'enter') { const c = cornerOf(plan, slot); if (c) { beat.look = [c.x, c.z]; if (rung >= 3) beat.eyes = [c.x, c.z]; } }
        // (below rung 3 the muzzle goes in as it was on the door: straight into the room, the door's inward normal (my call))
        if (bid === 'enter' && rung < 3 && plan.plane) beat.muzzle = q(plan.plane.axis === 'x' ? (plan.plane.into > 0 ? Math.PI / 2 : -Math.PI / 2) : (plan.plane.into > 0 ? 0 : Math.PI), 1e-6);
        vNow = v1; pos = to;
      } else if (D.k === 'posture') Object.assign(beat, { to: D.to, ms: Math.round(HIGH_READY_S * HIGH_READY_K * paceOf(sk.wh) * 1000 * k) });
      else if (D.k === 'aim:point') Object.assign(beat, { to: 'door', ms: Math.round(muzzleS(sk.wh) * 1000 * k) });
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
      } else if (D.k === 'call') Object.assign(beat, { say: D.say, ms: Math.round((rung >= 3 ? CALL_FLOW_S : CALL_S) * 1000 * k) });
      else if (D.k === 'mark') Object.assign(beat, { ms: Math.round(MARK_S * paceOf(sk.wh) * 1000 * k) });
      out.push(beat);
    }
    const last = out.filter(b => b.plan === dr).at(-1);
    prevTail = last?.key ?? prevTail;
    prevPlan = plan;
  });
  if (!out.length) return null;
  const d = { beats: out, rung, atMs, fromMs: atMs, lanes: {}, subs: [] };
  const sim = simulate(d);
  return { beats: out, ms: sim, seams: [], odds, rung, door: doors[0] ?? null, slot, variant: { breach: null, entry: lane?.plans?.[doors[0]]?.entry ?? null, stance: entryStance(rung, variant), ...variant }, label: B.label };
}
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
    // (from where the body is now, at the speed it has: the plan's path re-timed, never a jump)
    if (a) {
      const here = [a.x, a.z], v0 = Math.hypot(a.v?.[0] ?? 0, a.v?.[1] ?? 0), legs = legsOf(state, d.who, a.x, a.z);
      const path = dist(here, b.path[0]) > 0.02 ? [here, ...b.path.slice(dist(here, b.path[1] ?? here) < dist(b.path[0], b.path[1] ?? here) ? 1 : 0)] : [here, ...b.path.slice(1)];
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
    const p = moveAt(b, atMs);
    placeAt(state, d.who, a, p.x, p.z);
    if (cut && p.vMs > 0) a.v = [q(p.vMs * Math.cos(p.headRad), 0.001), q(p.vMs * Math.sin(p.headRad), 0.001)];
    else if (!b.prof.v1) delete a.v;
    else a.v = [q(b.prof.v1 * Math.cos(p.headRad), 0.001), q(b.prof.v1 * Math.sin(p.headRad), 0.001)];
  },
});
registerKind('posture', {
  run(state, bus, d, b) { if (!dry(d)) setPosture(state, d.who, 'highReady'); return { ms: b.ms, ok: true, routine: true, text: 'High ready.' }; },
});
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
    // (a door inside the room the plan does not take: the bundle asks once, before the sector, "Hold it or clear it?" (COMBAT §25.8.2))
    if (b.key.endsWith('sector') && d.who === playerId(state)) {
      const plan = planOf(state, b.plan), H = houseOf(state);
      for (const id of plan?.inner ?? []) {
        if (openingState(state, id) === 'open' || H?.two?.hold === id || askedOf(state)[`inner:${id}`]) continue;
        askedOf(state)[`inner:${id}`] = atMs;
        return { ms: 0, ok: false, halt: 'door-unplanned', again: true, text: HANDBACK_WORDS['door-unplanned'].replace('{wall}', wallOf(state, plan, id)) };
      }
    }
    d.eyes = { hot: b.hot ?? null, fromMs: atMs, deg: b.deg };
    return { ms: b.ms, ok: true, routine: true };
  },
  end(state, bus, d, b) { if (!dry(d)) d.eyes = null; },
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
      if (onMan) return { ms: TWO_POLL_MS / 2, ok: true, routine: true, again: true, text: null };
      const up = plan ? upIn(state, plan.room, atMs) : [];
      // (asked once a room, as the other hand-backs: a man you chose to hold (the hostage's) is your call, and "Carry on" calls it)
      if (up.length && !askedOf(state)[`clear:${b.plan}`]) { askedOf(state)[`clear:${b.plan}`] = atMs; delete b.clearFromMs; return { ms: 0, ok: false, halt: 'contact', again: true, text: null }; }
    }
    if (!dry(d)) bus?.emit('say', { who: d.who, text: SAY[b.say] ?? b.say, kind: 'speech', durMs: b.ms, call: b.say, room: b.plan ?? null });
    // (the #2's own "Clear!" noted on the house's record: the scene drops its echo of yours within a second of it)
    if (!dry(d) && b.say === 'clear' && houseOf(state)?.two?.pid === d.who) houseOf(state).two.clearMs = atMs;
    return { ms: b.ms, ok: true, routine: true, text: SAY[b.say] ?? b.say };
  },
});
// (the threats of a room standing and facing now: the turners of the range session)
function upIn(state, room, ms) {
  return (state.armoury?.range?.turners ?? []).filter(T => T.room === room && ['threat', 'armoured', 'hostage'].includes(T.face) && (T.stoppedAtMs === null || T.stoppedAtMs === undefined) && facingOf(T, ms) >= 0.5);
}
registerKind('mark', { run(state, bus, d, b) { return { ms: b.ms, ok: true, routine: true, text: 'Room marked.' }; } });
registerKind('wait', { run(state, bus, d, b) { return { ms: b.ms, ok: true, routine: true }; } });

// (the hand-backs asked once (the #2's wait at a door, an inner door): the house's record, else the stop's, so "Carry on" goes on)
const askedOf = (state) => { const H = houseOf(state); return H ? (H.asked ??= {}) : state.stop ? (state.stop.asked ??= {}) : {}; };
/** Whether the #2 stands over TWO_SLOT_M from his slot at the lane's door, in the house (cqb.js cqb-two reads it). */
export const twoAway = (state, ms = state.clock.ms) => { const H = houseOf(state); if (!H?.two?.pid) return false; const d = twoOffSlot(state, H.two, ms); return d !== null && d > TWO_SLOT_M; };
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
const doorMid = (o) => (o.axis === 'x' ? [(o.a + o.b) / 2, o.at] : [o.at, (o.a + o.b) / 2]);
const setPosture = (state, pid, posture) => { const k = state.people?.[pid]?.kit; if (k) (k.carry ??= {}).posture = posture; };

// ---- the player's bundle in stop motion ----

/** The words of a bundle row's beats grouped by channel, for the face: { feet: n, hands: n, eyes: n, voice: n }. */
const laneCount = (beats) => beats.reduce((o, b) => ((o[b.ch] = (o[b.ch] ?? 0) + 1), o), {});

/**
 * The bundles at the lane's door (see the header): [{ id: 'drill:<bundle>[@<variant>]><door>', kind: 'bundle', label, ms,
 * beats, seams, rung, variant, lanes, off?, struck?, lead }], the rung's own first; a bundle of the rung not yet lived
 * struck "by hand first".
 */
export function bundleRows(state, pid = playerId(state), ms = state.clock.ms) {
  const here = doorNow(state, pid);
  if (!here) return [];
  const rung = rungOf(state, pid, 'room'), out = [];
  const variant = state.stop?.variant ?? {};
  for (const B of BUNDLES) {
    if (B.single || B.offeredNow === false || B.rung > rung || B.rung < 2) continue;
    // (the groups of rung 2 are offered where they apply: Stack and open before the door is open, Enter after, Dominate inside)
    if (!groupApplies(state, pid, B.id, here)) continue;
    const plan = planBundle(state, pid, B.id, { door: here.door, rung, variant, atMs: ms });
    if (!plan) continue;
    const lived = offered(state, pid, B);
    const id = `drill:${B.id}${variantTag(variant)}>${here.door}`;
    const rushed = planBundle(state, pid, B.id, { door: here.door, rung, variant, atMs: ms, tempo: 'rushed' });
    out.push({ id, kind: 'bundle', label: B.label, ms: plan.ms, rushMs: rushed?.ms ?? plan.ms, carefulMs: null, odds: plan.odds < 1 ? plan.odds : null, routine: plan.odds >= 1, off: lived ? null : 'by hand first',
      struck: !lived, subs: plan.beats.map(b => ({ id: b.key, label: b.key, ms: b.ms })), beats: plan.beats.map(b => ({ id: b.key, k: b.k, ch: b.ch, ms: b.ms })), seams: plan.seams, rung: B.rung,
      variant: plan.variant, lanes: laneCount(plan.beats), cmd: false, skill: null, lead: B.rung === rung, door: here.door, bundle: B.id });
  }
  out.sort((a, b) => b.rung - a.rung);
  // (the rows set at no time: the breach and the entry's stance, the current first ("Push ⇄ Kick", "Assault ⇄ Combat"))
  if (out.length && here.plan.door && openingState(state, here.plan.door) !== 'open') {
    const how = variant.breach ?? (lockedOf(state, here.plan.door) ? 'kick' : swingOf(state, here.plan) ?? 'push'), other = how === 'kick' ? swingOf(state, here.plan) ?? 'push' : 'kick';
    out.push(variantRow('breach', `${cap(how)} ⇄ ${cap(other)}`, other));
  }
  if (out.length && rung >= 2) {
    const st = entryStance(rung, variant), other = st === 'assault' ? 'combat' : 'assault';
    out.push(variantRow('stance', `${cap(st)} ⇄ ${cap(other)}`, other));
  }
  return out;
}
const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);
// (a variant's row: chosen, it sets the bundles' variant (state.stop.variant) at no time)
const variantRow = (key, label, to) => ({ id: `drill:variant:${key}`, kind: 'variant', label, ms: 0, rushMs: null, carefulMs: null, odds: null, routine: true, off: null, subs: [], cmd: false, skill: null, variant: { [key]: to } });
/** A variant row chosen (see bundleRows): the stop's variant set, at no time. Returns { ok, why }. */
export function setVariant(state, row) {
  const S = state.stop;
  if (!S || !row?.variant) return { ok: false, why: 'no variant' };
  S.variant = { ...(S.variant ?? {}), ...row.variant };
  return { ok: true, why: null };
}
const variantTag = (v) => { const t = [v?.entry, v?.breach, v?.stance].filter(Boolean); return t.length ? `@${t.join('+')}` : ''; };
// (whether a rung 2 group applies where the lane stands; the room and the house always at their door)
function groupApplies(state, pid, id, here) {
  if (id === 'room:clear' || id === 'house:clear') return !here.rec || here.rec.state === 'ahead' || here.rec.state === 'stacked' || !here.rec.state;
  const open = here.plan.door ? openingState(state, here.plan.door) === 'open' : true, a = actorOf(state, pid), inside = a ? pastThreshold(here.plan, a.x, a.z) : false;
  if (id === 'room:stack-open') return !open && !inside;
  if (id === 'room:enter') return open && !inside;
  if (id === 'room:dominate') return inside;
  return false;
}

/**
 * The singles in the house (see the header), the panel's shape: Stack on the door, the door's rows, Watch, Look, Move,
 * Hold it, "Clear!", Mark, the stances. Each { id, kind, label, ms, beats?, off?, warn? }.
 */
export function singleRows(state, pid = playerId(state), ms = state.clock.ms) {
  const here = doorNow(state, pid), a = actorOf(state, pid);
  if (!here || !a) return [];
  const sk = skillsOf(state, pid), rung = rungOf(state, pid, 'room'), out = [], plan = here.plan, me = [a.x, a.z];
  const row = (id, kind, label, ms0, o = {}) => ({ id, kind, label, ms: Math.round(ms0), rushMs: null, carefulMs: null, odds: null, routine: true, off: null, subs: [], cmd: false, skill: null, door: here.door, ...o });
  const inside = pastThreshold(plan, a.x, a.z), stack = stackOf(plan, 1), stacked = dist(me, stack) <= STACK_NEAR_M;
  const open = plan.door ? openingState(state, plan.door) === 'open' : true;
  if (!inside && !stacked && !(here.rec && here.rec.state === 'entered')) {
    const p = planBundle(state, pid, 'room:stack', { door: here.door, rung, atMs: ms });
    if (p) out.push(row(`drill:room:stack>${here.door}`, 'bundle', 'Stack on the door', p.ms, { beats: p.beats.map(b => ({ id: b.key, k: b.k, ch: b.ch, ms: b.ms })), bundle: 'room:stack', single: true }));
  }
  // (the door's rows: by its swing, a lock striking push and pull; within reach of its middle)
  const o = plan.door ? openingOf(plan.door) : null;
  if (o && !open && dist(me, doorMid(o)) <= DOOR_REACH_M) {
    const how = swingOf(state, plan) ?? 'push', locked = lockedOf(state, o.id), t = doorS(sk.wh, how, rung, o.openS ?? DOOR_S);
    out.push(row(`door:${how}>${o.id}`, 'door', how === 'pull' ? 'Pull it open' : 'Push it open', t.ms, { off: locked ? 'locked' : null, how }));
    const kick = doorS(sk.wh, 'kick', rung, o.openS ?? DOOR_S), od = kickOdds(state, pid, o.id);
    out.push(row(`door:kick>${o.id}`, 'door', 'Kick it', kick.ms, { odds: od, routine: false, skill: 'fitness', how: 'kick' }));
    if (!state.armoury?.range?.house?.read?.[o.id]) out.push(row(`door:read>${o.id}`, 'door', 'Read the door', READ_S * paceOf(sk.awr) * 1000, { how: 'read' }));
  }
  // (the inner doors the plan does not take, from inside: Hold it (the #2's muzzle on it), and its own rows, a lock striking push and pull)
  // (in the doorway with the door open too: from rung 3 the eyes sweep the sector while the feet are still in the door, so the
  // bundle asks "Hold it or clear it?" from there (the fixer's of 0.0.12: asked where the panel had no Hold it, T walked on))
  const atDoor = inside || (open && !!plan.door && inFunnel(plan, a.x, a.z));
  for (const id of plan.inner ?? []) {
    const io = openingOf(id), held = houseOf(state)?.two?.hold === id;
    if (!io || !atDoor) continue;
    out.push(row(`door:hold>${id}`, 'door', 'Hold it', 0, { off: held ? 'held' : null, how: 'hold' }));
    if (openingState(state, io) === 'open') continue;
    const how = swingOf(state, { ...plan, door: id }, plan.room) ?? 'push', t = doorS(sk.wh, how, rung, io.openS ?? DOOR_S), k2 = doorS(sk.wh, 'kick', rung, io.openS ?? DOOR_S);
    out.push(row(`door:${how}>${id}`, 'door', how === 'pull' ? 'Pull it open' : 'Push it open', t.ms, { off: lockedOf(state, id) ? 'locked' : null, how, inner: true }));
    out.push(row(`door:kick>${id}`, 'door', 'Kick it', k2.ms, { odds: kickOdds(state, pid, id), routine: false, skill: 'fitness', how: 'kick', inner: true }));
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
    const pt = pointOf(plan, 1), legs = legsOf(state, pid), P = profileOf(dist(me, pt), legs.walk.combat, legs.pushMs2, legs.brakeMs2);
    if (dist(me, pt) > STACK_NEAR_M) out.push(row('move:point', 'move', 'Move to your point', P.T * 1000, { to: pt }));
    // (a far leg not yet seen: the walk up to where it is (the plan's far path from where you stand), by a press as by the keys)
    const far = plan.far, farEnd = far?.path?.at(-1) ?? null;
    if (far && !here.rec?.covered?.[far.hot] && dist(me, farEnd) > STACK_NEAR_M) {
      const fp = pathFrom(far.path, me), FP = profileOf(pathLen(fp), legs.walk.combat, legs.pushMs2, legs.brakeMs2);
      out.push(row('move:far', 'move', 'Move: the far leg', FP.T * 1000, { to: farEnd, path: fp }));
    }
    out.push(row('call:clear', 'call', 'Clear!', (rung >= 3 ? CALL_FLOW_S : CALL_S) * 1000, { say: 'clear' }));
    out.push(row('mark', 'mark', 'Mark the room', MARK_S * paceOf(sk.wh) * 1000));
  } else if (here.door === 'hall') {
    const pt = pointOf(plan, 1), legs = legsOf(state, pid), P = profileOf(dist(me, pt), legs.walk.combat, legs.pushMs2, legs.brakeMs2);
    if (pt && dist(me, pt) > STACK_NEAR_M) out.push(row('move:hallEnd', 'move', 'Move to the hall\'s end', P.T * 1000, { to: pt }));
    out.push(row('call:clear', 'call', 'Clear!', (rung >= 3 ? CALL_FLOW_S : CALL_S) * 1000, { say: 'clear' }));
  }
  // (the stances: the others than the body's)
  const now = a.moveStance ?? 'relaxed';
  for (const s of MOVE_STANCES) if (s !== now) out.push(row(`gait:${s}`, 'gait', s === 'relaxed' ? 'Relaxed' : s === 'combat' ? 'Combat' : 'Assault', 0, { gait: s }));
  return out;
}
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
  return beginBeats(state, bus, pid, { step: rowId, bundle: B.id, plan, tempo, label: B.label });
}
// (a beat doing set on the player's stop and begun: 'stop' released, the start fact, the first beats at the clock)
function beginBeats(state, bus, pid, { step, bundle, plan, tempo, label }) {
  const S = state.stop, now = state.clock.ms;
  const d = { who: pid, step, kind: 'bundle', bundle, tempo, rung: plan.rung, slot: plan.slot, door: plan.door, variant: plan.variant, beats: plan.beats.map(b => ({ ...b, st: 'wait', fromMs: null, untilMs: null })),
    lanes: {}, subs: [], fromMs: now, atMs: now, untilMs: now, untilPlanMs: now + plan.ms, seams: plan.seams ?? [] };
  S.doing = d; S.phase = 'act'; S.queue = []; S.carry = null; S.feet = null;
  const me = actorOf(state, pid);
  if (me?.watch && !String(step).startsWith('watch:')) delete me.watch;
  releaseTime(state, 'stop');
  bus?.emit('bundle', { phase: 'start', who: pid, id: step, beat: null, ch: null, atMs: now, label, ms: plan.ms });
  const r = advanceBeats(state, bus, d, now);
  if (r !== 'running') beatsDone(state, bus, d, r);
  return { ok: true, why: null };
}
// (the player's beat doing finished: choosing again, the rest as "Carry on" when it halted)
function beatsDone(state, bus, d, r) {
  const S = state.stop;
  if (!S || S.doing !== d) return;
  S.doing = null;
  S.phase = 'choose';
  if (r === 'halted' && d.rest?.length) {
    // (a move cut where it stood leaves the rest of its path: the carry on, and a shot row fired moving on, take it from there)
    const paths = {};
    for (const b of d.beats) if (b.st === 'cut' && b.k === 'move' && b.prof) paths[b.key] = restPath(b, b.untilMs);
    S.carry = { from: d.step, bundle: d.bundle, door: d.door, rung: d.rung, variant: d.variant, beats: d.rest, why: d.halt?.why ?? null, words: d.halt?.words ?? null, paths };
  }
  else S.carry = null;
  // (the halt said its own fact when it came (the stepper's); here the doing's end, halted or not)
  bus?.emit('bundle', { phase: 'end', who: d.who, id: d.step, beat: null, ch: null, atMs: d.untilMs, why: d.halt?.why ?? null });
  if (d.halt?.words) bus?.emit('line', { text: d.halt.words, kind: 'warn' });
  // (no hold inside a take-in's window: the window runs at 1:1 to its pause (contact.js))
  if (!state.mind?.contact?.pending) holdTime(state, 'stop');
}
useBeats({ done: beatsDone });

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
/** The beats' words in "Carry on: …". */
export const BEAT_WORDS = Object.freeze({ approach: 'the stack', ready: 'high ready', up: 'the muzzle up', muzzle: 'the muzzle on the door', squeeze: 'the squeeze', door: 'the door', enter: 'in', corner: 'your corner', sector: 'the sector', far: 'the far leg', farlook: 'a look down the far leg', clear: '"Clear!"', mark: 'the mark' });
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
    const path = cut ? [[a.x, a.z], ...cut.slice(1)] : [[a.x, a.z], ...firstMove.path.slice(1)], P = profileOf(pathLen(path), legs.walk[firstMove.stance], legs.pushMs2, legs.brakeMs2, { v0, v1: firstMove.prof.v1 });
    Object.assign(firstMove, { path, prof: P, ms: Math.round(P.T * 1000), arriveMs: Math.round(profileWhen(P, P.L - ARRIVE_M) * 1000) });
  }
  // (a dependency on a beat already done is met: dropped)
  for (const b of beats) b.after = b.after.filter(x => keep.has(x.split('@')[0]));
  // (the rifle still at the aim after the shots: the rest starts with the muzzle up to high ready, a hands beat that flows
  // with the feet from rung 3, so the walk on never sweeps the #2 (the fixer's second pass of 0.0.12: the sergeant's Carry
  // on walked room 1 aimed and took the muzzle fault on his own #2, the line "Muzzle. Up." in the middle of T's bundle))
  if (state.people?.[pid]?.kit?.carry?.posture === 'aimed' && !beats.some(b => b.k === 'posture')) {
    const pre = /^\d+:/.test(beats[0].key) ? beats[0].key.split(':')[0] + ':' : '', wh = skillsOf(state, pid).wh;
    beats.unshift({ key: `${pre}up`, k: 'posture', ch: 'hands', to: 'highReady', after: [], cut: false, door: beats[0].door ?? null, plan: beats[0].plan, slot: 1, st: 'wait', fromMs: null, untilMs: null,
      ms: Math.round(HIGH_READY_S * HIGH_READY_K * paceOf(wh) * 1000) });
  }
  const d = { beats, rung: C.rung, atMs: ms, fromMs: ms, lanes: {}, subs: [] };
  return { beats, ms: simulate(d), rung: C.rung, slot: 1, door: C.door, variant: C.variant, seams: [] };
}
/** Carry on (the panel's "Carry on: …"): the halted bundle's rest from where the body is. Returns { ok, why }. */
export function carryOn(state, bus, pid = playerId(state), { tempo = 'normal' } = {}) {
  const S = state.stop, C = S?.carry;
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
    return { ok: true, why: null };
  } else if (row.kind === 'door') {
    const how = row.how, t = doorS(sk.wh, how, rung);
    beat = { key: 'door', k: 'door', ch: 'hands', door: row.id.split('>')[1], how, ms: t.ms, passMs: t.passMs, handMs: t.handMs, after: [] };
  } else if (row.kind === 'look') {
    const h = here?.plan?.hot?.find(x => x.id === row.hot);
    beat = { key: `look:${row.hot}`, k: 'scan', ch: 'eyes', hot: row.hot, deg: 0, ms: row.ms, after: [] };
    if (a && h) a.headRad = q(bearing([a.x, a.z], hotXZ(h)), 1e-6);
  } else if (row.kind === 'move') {
    const legs = legsOf(state, pid), path = row.path ? row.path.map(p => [...p]) : [[a.x, a.z], row.to], st = a.moveStance === 'assault' ? 'assault' : 'combat';
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

/** The body's movement stance set (V in the house, the gait rows): Relaxed slings the rifle's posture to slung, Combat low ready, Assault shouldered; the 'gait' fact. */
export function setStance(state, bus, pid, to) {
  const a = actorOf(state, pid);
  if (!a || !MOVE_STANCES.includes(to)) return false;
  const from = a.moveStance ?? 'relaxed';
  if (from === to) return false;
  a.moveStance = to;
  bus?.emit('gait', { who: pid, from, to, atMs: state.clock.ms });
  return true;
}

// ---- the face's view ----

/**
 * The running bundle (see the header): { id, label, lanes: { feet, hands, eyes, voice: [{ key, glyph }] }, fromMs, untilMs,
 * k } or null; glyphs ✓ passed, ◦ routine, ✗ fumbled or cut, · to come, ▸ running.
 */
export function bundleNow(state, pid = playerId(state), ms = state.clock.ms) {
  const d = state.stop?.who === pid ? state.stop?.doing : houseOf(state)?.two?.pid === pid ? houseOf(state).two.doing : null;
  if (!d?.beats) return null;
  const lanes = { feet: [], hands: [], eyes: [], voice: [] };
  for (const b of d.beats) {
    if (!lanes[b.ch]) continue;
    const g = b.st === 'wait' ? '·' : b.st === 'run' ? '▸' : b.st === 'cut' ? '✗' : (d.subs.find(s => s.beat === b.key)?.routine ? '◦' : d.subs.find(s => s.beat === b.key)?.ok === false ? '✗' : '✓');
    lanes[b.ch].push({ key: b.key, glyph: g });
  }
  const until = d.untilPlanMs ?? d.untilMs, k = until > d.fromMs ? Math.max(0, Math.min(1, (ms - d.fromMs) / (until - d.fromMs))) : 1;
  return { id: d.step, label: bundleDef(d.bundle)?.label ?? d.step, lanes, fromMs: d.fromMs, untilMs: until, k };
}
/** The sector the bundle's eyes hold now (react.js heldSectorOf reads it): { yawRad, why: 'bundle' } or null. */
export function bundleEyes(state, pid = playerId(state)) {
  const d = state.stop?.who === pid ? state.stop?.doing : houseOf(state)?.two?.pid === pid ? houseOf(state).two.doing : null, a = actorOf(state, pid);
  if (!d?.beats || !a) return null;
  const b = d.beats.find(x => x.st === 'run' && x.k === 'scan') ?? d.beats.find(x => x.st === 'run' && x.k === 'move' && x.key.endsWith('enter'));
  if (!b) return null;
  const plan = planOf(state, b.plan), c = plan ? cornerOf(plan, b.slot ?? 1) : null;
  return c ? { yawRad: Math.atan2(c.z - a.z, c.x - a.x), why: 'bundle' } : null;
}
// ---- the #2: his slot through the same plan (see the header) ----

/**
 * The #2's slot this tick (the scene's houseActors, the think layer): rec R.house.two { pid, aid, rung, doing, hold,
 * contact, fired, hits }. At the lane's door: below rung 3 one group at a time ('room:stack' then the door's wait, the
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
  const busy = !!(rec.contact || rec.eng);
  if (busy && rec.doing && !rec.doing.halt) haltDoing(state, bus, rec.doing, 'contact', null, ms);
  if (rec.doing) {
    const r = advanceBeats(state, bus, rec.doing, ms);
    const mv = rec.doing.beats.find(b => b.st === 'run' && b.k === 'move' && b.prof);
    if (mv) { const p = moveAt(mv, ms); placeAt(state, rec.pid, a, p.x, p.z); a.headRad = p.headRad; }
    // (his eyes: a scan sweeps his head across his sector over its time, as the player's does (shooting.js stopRules); a
    // move with a look or held eyes faces them (the fixer's of 0.0.12: his head stayed on the near corner through his
    // sector's scan, so he never saw room 3's near-leg man)
    const sc = rec.doing.beats.find(b => b.st === 'run' && b.k === 'scan' && b.sweep);
    if (sc) { const k = sc.untilMs > sc.fromMs ? Math.min(1, Math.max(0, (ms - sc.fromMs) / (sc.untilMs - sc.fromMs))) : 1; a.headRad = q(sc.sweep[0] + wrap(sc.sweep[1] - sc.sweep[0]) * k, 1e-6); }
    else if (mv && (mv.eyes ?? mv.look)) { const e = mv.eyes ?? mv.look; a.headRad = q(Math.atan2(e[1] - a.z, e[0] - a.x), 1e-6); }
    if (r === 'running') return r;
    rec.last = { step: rec.doing.step, untilMs: rec.doing.untilMs, why: rec.doing.halt?.why ?? null };
    // (the room swept only by a Dominate that ran to its end; a halted one is planned again from where he stands)
    if (r === 'ended' && rec.doing.bundle === 'room:dominate') (rec.swept ??= {})[rec.doing.door] = ms;
    rec.doing = null;
    return r;
  }
  if (busy) return 'idle';
  const here = doorNow(state, playerId(state));
  if (!here) return 'idle';
  const rung = rec.rung ?? rungOf(state, rec.pid, 'room'), gap = goMs(skillsOf(state, rec.pid).wf);
  if (rec.last && ms < rec.last.untilMs + (rung < 3 ? gap : 0)) return 'idle';
  // (his entry cued on your first step through the door, the doorway reached with the door open, not on your crossing its
  // plane (the fixer's of 0.0.12: cued on the plane, he waited in the hall while you stood in the doorway at your pause))
  const me = playerActor(state), plan = here.plan, open1 = !plan.door || openingState(state, plan.door) === 'open';
  const inside1 = me ? pastThreshold(plan, me.x, me.z) || (open1 && !!plan.door && inFunnel(plan, me.x, me.z)) : false;
  const stacked2 = dist([a.x, a.z], stackOf(plan, 2)) <= STACK_NEAR_M, inside2 = pastThreshold(plan, a.x, a.z);
  let bundle = null;
  // (cued, he goes in from wherever he stands: a man cut mid-entry by his contact goes on in, never back to the stack)
  if (!inside2 && inside1) bundle = 'room:enter';
  else if (!inside2 && !stacked2 && here.rec?.state !== 'clear') bundle = rung >= 2 ? 'room:stack-open' : 'room:stack';
  else if (inside2 && !rec.swept?.[here.door]) bundle = 'room:dominate';
  if (!bundle) return 'idle';
  // (his beats at his own rung, the recruit's #2 his muzzle on the door as the recruit's; only the groups are rung 2's, his
  // keys being the drill's (the fixer's of 0.0.12: planned at rung 2 or above, a private's #2 stacked a muzzleS quicker))
  const p = planBundle(state, rec.pid, bundle, { door: here.door, slot: 2, rung, atMs: ms, from: [a.x, a.z] });
  if (!p) return 'idle';
  rec.doing = { who: rec.pid, step: `drill:${bundle}>${here.door}`, kind: 'bundle', bundle, tempo: 'normal', rung, slot: 2, door: here.door, variant: p.variant, beats: p.beats.map(b => ({ ...b, st: 'wait' })),
    lanes: {}, subs: [], fromMs: ms, atMs: ms, untilMs: ms, untilPlanMs: ms + p.ms, seams: [] };
  bus?.emit('bundle', { phase: 'start', who: rec.pid, id: rec.doing.step, beat: null, ch: null, atMs: ms, label: bundleDef(bundle)?.label, ms: p.ms });
  return 'running';
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
export { flowOf, profileOf, profileAt, profileWhen, moveAt, moveNow };
