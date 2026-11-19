// OLYMPUS arms: what the stage reads of the arms, the rifle on a figure, the kit, the range's paper and brass (VIEWS §3.4, §4.4; WEAPONS §2.8; the build sheet 0.0.5 §2.1). Pure.
//
// The stage draws what is there (the world's truth, at a game time ms = clock.ms + alpha × TICK_MS)
// and reads it only through here (TECH §2.2's SIM_FOR_VIEW), never the state's arms records direct:
//   gunLook(state, actor, ms)  the rifle on a figure (the rework's R6: with the P-12 out, the rifle hanging, 'front', and
//                    pistol { model, posture } beside it); the model; its finish (0.0.12, only when not the issue's black); carry, the art's rig ('front' slung on
//                    its two-point sling, 'slung' on the back, 'low', 'high', 'aim'); the stance; the
//                    aim's point and since when; the last shot's game time; the action under way (the
//                    shot role's stepNow through ACTION_FRAMES, a list walked by the sub-step's k); the
//                    flash within FLASH_MS of the shot and the kick within KICK_MS (as fractions, 1 at the
//                    shot), on game time, so stop motion freezes them; the muzzle's tip (carry.js
//                    muzzleOf: the flash's and the sound's point); the finger; the magazine in or out.
//   kitLook(state, pid)   the ear defenders (in the head slot or their own, by type), the carrier, each pouch's magazines.
//   rangeLook(state, ms)  the range session's: hot (the red flag), each lane's holes (the shot role's
//                    paper.js placed them, by hash, in their ring: stored on the session's shots), the
//                    brass in flight and at rest (caseAt, each with the stance it left), the magazines
//                    lying, the bracketed target and whether the shooter is aimed, and the last shot's
//                    blast within DUST_MS (fire: where the shooter lies or kneels, facing, the stance, its
//                    game time, and 0.0.6's load and lane, a tracer's ember drawn to its card) for the
//                    stage's flash star and the dust off the regolith.
// caseAt(rec, ms, gMs2) is a case's flight in the place's gravity (WEAPONS §2.8): launched from the port
// horizontally at EJECT_MS ± 0.3 m/s (by hash), EJECT_DEG ± 20° (by hash) to the right of the bore,
// from the port's height by the stance (PORT_H_M), falling at gMs2 until it lands and rests where it
// lands in regolith: on Mars 0.87 s and 3.5 m from a standing port, 0.37 s and 1.5 m prone. The gravity
// is caseGMs2(state, area): the place's (src/sim/places/env.js gravityAt) at CASE_G_STEP_MS2, 1 mm/s²
// (the case's model is coarser than that, and Mars's 3.726527 m/s² reads 3.727, the case's gravity
// since v0.0.5); ejectCase and caseAt take it (required: TECH §1.4), and rangeLook gives the stage its
// gMs2 for the dust and the plates. **Under the float band** (gMs2 below src/data/body/needs.js GAIT_G's
// 0.05 G: a coasting deck, free fall) a case never lands (WEAPONS §2.8): it flies straight at its port's
// height and launch speed to the first face it meets, bounces once at CASE_BOUNCE 0.3 of its speed off
// that face, and drifts to the next, where it is held (v0.0.24, ROADMAP "anywhere" step 7: v0.0.11's
// CASE_FREE_M 2 m, the case held 2 m out, is gone). The faces are found once, at the ejection, by the
// ray the caller gives (`faces`: brass.js caseFacesOf(state), the live area's walls and floor's edge),
// required under the float band; the record then carries the bounce as `path` [{ atMs, x, z, v }] and
// restY (its height at rest, the port's), written only then, so every record at Mars and the Wheel is
// v0.0.10's bytes, and caseAt reads the two segments in closed form, the same whatever ticks pass. ejectCase()
// makes the record (the shot role stores it, at most BRASS_LIVE in a session); a round or the dummy
// thrown by a hand on the charging handle leaves at HAND_EJECT_K of the speed. Nothing here writes.
//
// 0.0.7 (the build sheet 0.0.7 §2.4): on test-range's KD course gunLook draws a gunner of the relay as the player is
// drawn (its aim at its own face or card, its last shot's flash and kick, its sub-step's frame: gunner.js
// gunnerNow), and rangeLook gains kd: { line, faces (all twenty lanes: the face's place and paper, how far it is
// up (the pits' carrier: range.js pitView, continuous, never a pop), its marked holes, the spotter, the score disk
// since when, the red flag since when), flags (each wind flag's heading and lift: wind.js flagOf), fires (every
// shooter's shot within FIRE_LOOK_MS 1.2 s: where they lie, sit or kneel, facing, the stance, the load), brass
// (the cases flying, with their stance) and tiles (the cases at rest, counted on their 1 m tiles: brass.js),
// dust (a round into the berm behind its face within DUST_MS), own (your point on a KD line: { lane, line, x, z, text },
// its numbered stake's place, KD_STAKE_DX_M behind your fp on its row, so the stage marks it as yours; null at 25 m
// and between lines: 0.0.7's tower fixer, the user's report of 2026-11-07, "did call me line 5 when I'm line 10") }.
// 0.0.8: on the 25 m bay (both courses: the KD's zero is fired there) rangeLook's own top-level `own` is your bay lane's
// stake the same way ({ lane, line: 25, x, z, text }, the bay's stakes now on their rows too: the tower verifier's
// finding), null off the bay's line.
// 0.0.8 (the build sheet 0.0.8 §2.4): on test-pairs' pairs course rangeLook gains pairs: { line, turners (each lane's: its
// place, how far it faces (turners.js facingOf, a closed form over TURN_MS: never a jump), the face hung and what it
// holds, its holes with their zone and whether the steel rang, down, the plate's fall), lines (the 7 m and 10 m paint) },
// src/sim/scenarios/pairs.js pairsLook: the stage's only door to the turners. 0.0.9 (the build sheet 0.0.9 §2.2, §2.3): on
// "Three bangs" pairs gains bangs: [{ id, x, z, fromX, fromZ, throwAtMs, atMs, done }], the coach's training bangs as
// planned (the throw's arc from his hand at throwAtMs, the body on the pad, the flash and the smoke at atMs; done once
// atMs is past), [] on every other course.
// 0.0.10 (the build sheet 0.0.10 §2.3): on test-stress's course rangeLook gains stress: { coach: { x, z, face }, horn: { on,
// fromMs, untilMs } | null (the air horn at his hand while it sounds), blanks: [{ key, x, z, atMs }] (each blank's muzzle
// within the last second: the flash's spot and time), bangs: [...as pairs'] }, src/sim/scenarios/stress.js stressLook; null
// on every other course.
// 0.0.12 (the build sheet 0.0.12 §2.4): on test-shoothouse's house course rangeLook gains house: src/sim/scenarios/shoothouse.js
// houseLook's (0.0.18: with bangs, the kit's grenades and bursts as pairs' bangs are, burst.js devicesLook) { instructor: { x, z, y, face, say, name }, corners: [{ room, id, x, z, covered, by }], stands: [{ key, stand, room,
// x, z, y, facingK, face, holds, holes, down }], timer: { runMs, parMs, par } }; null on every other course. 0.0.17: with
// leaves (the doors' swings) and aid (shoothouse.js cornerAidLook: your corner and point and your #2's from the read of the door,
// your sector's wedge from your entry, each with its strength k; the rule src/sim/combat/corner.js).
// v0.0.19 (the build sheet 0.0.19 §1 L-look; opfor §2.6): the house's look gains floor and men, both [] with no role-player's
// rifle lying (the turner lane draws what it drew). floor: [{ id, model, finish, x, z, y, rotRad }], every long gun lying in the live
// area (kit.js lyingOf: a role-player who gave up dropped his at his feet, still held exactly once), its heading by hash of its
// id, y its height while it falls (from FLOOR_FROM_M, over FLOOR_FALL_MS from the drop, his record's droppedAtMs: through the
// give's GIVE_DROP_MS before it the rifle is in his hands, lowered to low ready, his rifle's own frame), so it never pops from
// his hands to the floor; men: [{ key, who, st, frame, rifle }], each role-player as the stage draws him:
// frame 'handsUp' or 'handsKneel' with his hands up (by his stance), 'sitLow' down (seated, his rifle low across him), else null
// (his rifle's own frame, gunLook's), and where his rifle is, 'hands', 'floor' or 'none' (F43's reading: never 'none').
// The rework's R5 (COMBAT §25.19.5): your number two's rifle is drawn on the sub-step his hands are at (shoothouse.js handsOf: his
// tower macro's, LOAD to SHOW CLEAR, or his bundle's hands beat), the same frames as yours on the same sub-step.
// A sitting port is PORT_H_M.sit high.
// v0.0.22 (its build sheet §1 item 17; the residuals lens's R3; VIEWS §3.10): the device in the hands. heldLook(state, actor, ms) is
// what a figure holds: { id, model, shape, colour, st } from devices.js handDeviceOf (a G-11 armed, the halligan, the ram, a charge),
// and through the throw's 0.7 s, its grenade already on the floor's record (bundle.js's throw moves it at the beat's start), until its
// flight's first moment (rec.flight.fromMs: the devices layer draws it from there, burst.js devicesLook): one quantity, never both
// and never neither; null otherwise. beatOf gains the device beats the held frames turn on: 'arm' (the reach and the pin), 'throw',
// 'force' (with its tool's model: the halligan's pry, the ram's swing) and 'place', each with its share k. heldShapesOf(state, pid)
// lists the shapes a person carries (the stage bakes their cards at the brief's splash). Read by the view only, outside the look's key.
// AIM_LEAD_K, EDGE_KEEP_M and FRAME_HALF_M are VIEWS §2.4's weapon-mode lead, shared by the camera and
// the shot role's targetsOf: the frame's centre AIM_LEAD_K of the way from the player to the bracketed
// target, the player kept EDGE_KEEP_M inside the frame's half-size at 16 px/m.
import { hash01 } from '../../core/hash.js';
import { q } from '../../core/num.js';
import { ACTIONS, gunField, finishOf } from './firearms.js';
// (0.0.8: the lever's time, for the far window's ease between its scales: render reads the sim through this module only)
export { OPTIC_S } from './firearms.js';
import { muzzleOf, carryOf, faceRad } from './carry.js';
import { lyingOf, CONTAINERS } from './kit.js';
import { loadOf } from './calibres.js';
import { isLong, modelOf } from './models.js';
import { stepNow, targetsOf } from './shooting.js';
import { gunnerNow, gunnerTarget } from './gunner.js';
import { flagOf } from './wind.js';
import { tilesLook } from './brass.js';
import { pitView } from '../scenarios/range.js';
import { pairsLook } from '../scenarios/pairs.js';
import { anchorsLook } from '../scenarios/anchors.js';
import { gearAnchorOf, anchorHoldOf } from '../body/footing.js';
import { stressLook } from '../scenarios/stress.js';
import { houseLook, handsOf, houseOf } from '../scenarios/shoothouse.js';
import { devicesLook } from '../combat/burst.js';
import { devicesView } from './devlook.js';
import { DEVICES, handDeviceOf, devicesOf, liveDevices } from './devices.js';
import { KD_RANGE, KD_STAKE_DX_M, KD_STAKE_DZ_M } from '../../data/places/range.js';
import { gravityAt } from '../places/env.js';
import { G0_MS2 } from '../../core/phys.js';
import { GAIT_G } from '../../data/body/needs.js';

/** The resolution a case's and a mote's gravity is read at (m/s²; see the header). */
export const CASE_G_STEP_MS2 = 0.001;
/** The gravity a case falls at, at a place (m/s², at CASE_G_STEP_MS2): area null for the live area. */
export const caseGMs2 = (state, area = null) => q(gravityAt(state, area).gMs2, CASE_G_STEP_MS2);
const needG = (gMs2) => { if (!Number.isFinite(gMs2) || gMs2 < 0) throw new Error(`look.js: a case falls at the place's gravity (caseGMs2), not ${gMs2}`); return gMs2; };
/** Under this gravity a case does not fall (the float band at CASE_G_STEP_MS2, as caseGMs2 reads it: 0.490 m/s²); there it flies to a face and bounces off it at CASE_BOUNCE of its speed (see the header; my call). */
export const CASE_FLOAT_MS2 = q(GAIT_G.FLOAT_BELOW_G * G0_MS2, CASE_G_STEP_MS2), CASE_BOUNCE = 0.3;
/** The ejection (WEAPONS §2.8, the build sheet's §4): speed, its spread, the angle off the bore to the right and its spread, a hand's throw. */
export const EJECT_MS = 4.0, EJECT_SPREAD_MS = 0.3, EJECT_DEG = 60, EJECT_SPREAD_DEG = 20, HAND_EJECT_K = 0.5;
/** The port's height by stance (m), and where it sits: ahead along the bore and to its right of the holder. */
export const PORT_H_M = Object.freeze({ stand: 1.4, kneel: 0.95, prone: 0.25, sit: 0.9 });
/** A shooter's shot is in rangeLook.kd.fires this long (ms of game time): the build sheet 0.0.7 §2.4. */
export const FIRE_LOOK_MS = 1200;
export const PORT_AHEAD_M = 0.30, PORT_RIGHT_M = 0.12;
/** The session keeps at most this many cases (WEAPONS §2.8). */
export const BRASS_LIVE = 64;
/**
 * The art's flash and kick, on game time (ms): the flash two ticks (the design review's: at 70 ms its strong
 * part fell in a tick never drawn, and at 16 px/m a 50 ms star could not be caught), the kick 140.
 */
export const FLASH_MS = 100, KICK_MS = 140;
/**
 * A shot's blast dust off the regolith in front of a low muzzle (prone, kneeling): how long it hangs and settles (ms of game
 * time) at the least, how high its motes are thrown at the most (m), the last mote's lag after the blast (ms) and how long
 * the farthest-thrown lies before the dust is gone (ms). dustMsOf(gMs2) is the whole of it at a place's gravity: never under
 * DUST_MS, and long enough for the highest mote to land and lie DUST_LIE_MS (Europa's 1.314 m/s²: 1,742 ms, where a fixed
 * 1,200 ms ended its prone motes in the air). At Mars's 3.727 the flight is 803 ms, so DUST_MS holds, as in v0.0.10. Under
 * the float band the motes never land: DUST_MS, drifting and fading (range-items.js dustPixels).
 */
export const DUST_MS = 1200, DUST_UP_M = 0.3, DUST_LAG_MS = 30, DUST_LIE_MS = 360;
export function dustMsOf(gMs2) {
  if (!Number.isFinite(gMs2) || gMs2 < 0) throw new Error(`dustMsOf(): the place's gravity, not ${gMs2}`);
  if (gMs2 < CASE_FLOAT_MS2) return DUST_MS;
  return Math.max(DUST_MS, Math.ceil(2000 * Math.sqrt(2 * DUST_UP_M / gMs2)) + DUST_LAG_MS + DUST_LIE_MS);
}
/** VIEWS §2.4's weapon-mode lead (the camera's and targetsOf's). */
export const AIM_LEAD_K = 0.55, EDGE_KEEP_M = 2.5, FRAME_HALF_M = Object.freeze([20, 11.25]);
/** The art's frame for each action (firearms.js ACTIONS' frames, and the shot's own steps). */
export const ACTION_FRAMES = Object.freeze({
  ...Object.fromEntries(Object.entries(ACTIONS).filter(([, a]) => a.frame).map(([k, a]) => [k, a.frame])),
  aim: 'aim', hold: 'aim', fire: 'fire',
  // (the rework's R8, VIEWS §3.10.7: going down to the knee, half way over its first third, the knee after; standing, the reverse;
  // drawn so by a mover in a stance (the view's stance sheet), the carry's frame elsewhere as before)
  'stance:kneel': ['kneelGoing', 'kneelGoing', 'kneelLow', 'kneelLow', 'kneelLow', 'kneelLow'], 'stance:stand': ['kneelLow', 'kneelLow', 'kneelLow', 'kneelLow', 'kneelGoing', 'kneelGoing'],
});
/**
 * The P-12's tower admin drawn (v0.0.24, v0.0.23's lead call 5): MAKE READY's 'pistol:ready' and SHOW CLEAR's 'pistol:clear' are one
 * timed sub-step each (sidearm.js adminRun: its draw and its holster are parts of it, unrolled, the pistol in its holster in the state
 * throughout), so the figure drew the rifle through them and the admin stance was never seen. gunLook draws the P-12 in the hands
 * through the sub-step, at the low ready as adminRun holds it, by its parts in turn (the actions' frames, a list walked by the
 * sub-step's share): the hand at the holster for the draw, the rack or the clearing, the holster. Yours (stepNow) and your number two's
 * (handsOf) alike; read only, so nothing the sim keeps moves.
 */
export const ADMIN_FRAMES = Object.freeze({
  'pistol:ready': Object.freeze(['sling', 'charge', 'check', 'sling']),
  'pistol:clear': Object.freeze(['sling', 'magout', 'charge', 'check', 'release', 'check', 'sling']),
});
/** The tap's time, #2's support hand on #1's shoulder at the squeeze (VIEWS §3.10.7; game ms). */
export const TAP_MS = 300;
/**
 * The close-quarters beat a body is in at ms (VIEWS §3.10.7, the rework's R8), read from its running drill (yours: state.stop's;
 * your number two's: the house's): { kind: 'kick' | 'door' | 'tap' | 'stack', k (its share, 0 to 1), slot } or null. Its time is
 * the sim's beat's, so stop motion holds it.
 */
export function beatOf(state, pid, ms = state?.clock?.ms ?? 0) {
  const S = state?.stop?.who === pid ? state.stop : null, W = S ? null : houseOf(state)?.two;
  const beats = S ? (S.doing?.beats ?? S.flow?.beats ?? null) : W?.pid === pid ? W.doing?.beats ?? null : null;
  if (!beats?.length) return null;
  const share = (b) => (b.untilMs > b.fromMs ? Math.max(0, Math.min(1, (ms - b.fromMs) / (b.untilMs - b.fromMs))) : 1);
  const door = beats.find(b => b.k === 'door' && b.st === 'run');
  if (door && ms >= door.fromMs) {
    if (door.how === 'kick') return { kind: 'kick', k: share(door), slot: door.slot ?? 1 };
    if (ms - door.fromMs < (door.handMs ?? 200)) return { kind: 'door', k: share(door), slot: door.slot ?? 1 };
  }
  const sq = beats.find(b => b.key === 'squeeze' && b.st !== 'wait' && Number.isFinite(b.fromMs));
  if (sq && ms >= sq.fromMs && ms - sq.fromMs < TAP_MS) return { kind: 'tap', k: (ms - sq.fromMs) / TAP_MS, slot: sq.slot ?? 2 };
  // (a device's beat running: the arm (reach and pin), the throw, the force (its tool's model), the place)
  const dev = beats.find(b => DEVICE_BEAT_KINDS.includes(b.k) && b.st === 'run' && Number.isFinite(b.fromMs) && ms >= b.fromMs);
  if (dev) return { kind: dev.k, k: share(dev), slot: dev.slot ?? 1, ...(dev.k === 'force' ? { model: dev.model ?? (dev.how === 'ram' ? 'ram' : 'hal') } : {}) };
  const app = beats.find(b => b.key === 'approach'), ent = beats.find(b => b.key === 'enter');
  if (app?.st === 'done' && (!ent || ent.st === 'wait')) return { kind: 'stack', k: 0, slot: app.slot ?? 1 };
  return null;
}
/** The beats that use a device in the hands, as beatOf names them (bundle.js's kinds). */
export const DEVICE_BEAT_KINDS = Object.freeze(['arm', 'throw', 'force', 'place']);
/**
 * The device in a figure's hands at ms (see the header): { id, model, shape, colour, st }, or null. A grenade thrown is
 * still in the hand until its flight's first moment.
 */
export function heldLook(state, actor, ms = state?.clock?.ms ?? 0) {
  const pid = actor?.who;
  if (!pid) return null;
  let h = handDeviceOf(state, pid);
  if (!h) {
    for (const d of liveDevices(state)) {
      const rec = state.items[d.id], F = rec?.flight;
      if (d.kind === 'grenade' && rec.byId === pid && F && Number.isFinite(F.fromMs) && ms < F.fromMs) { h = { id: d.id, kind: d.kind, model: d.model, st: d.st }; break; }
    }
  }
  const L = h ? DEVICES[h.model]?.look : null;
  // (a grenade's throw solved, its flight's length (m), so the figure winds up and throws by how far: poses.js heldFrameOf)
  const F = h ? state.items[h.id]?.flight : null, throwM = F && Number.isFinite(F.x1) && Number.isFinite(F.x0) ? Math.round(Math.hypot(F.x1 - F.x0, F.z1 - F.z0) * 100) / 100 : null;
  return L ? { id: h.id, model: h.model, shape: L.shape, colour: L.colour, st: h.st, ...(throwM !== null ? { throwM } : {}) } : null;
}
/** The shapes of the devices a person carries, hand and pouches: the stage bakes their cards before they are needed. */
export const heldShapesOf = (state, pid) => [...new Set(devicesOf(state, pid).map(d => DEVICES[d.model]?.look?.shape).filter(Boolean))].sort();
/** The postures as the art's rigs. */
export const CARRY_RIGS = Object.freeze({ slungFront: 'front', slungBack: 'slung', lowReady: 'low', highReady: 'high', aimed: 'aim' });

const frameAt = (action, k) => {
  const f = ACTION_FRAMES[action] ?? (action?.startsWith('magOut:') ? 'magout' : null);
  if (!Array.isArray(f)) return f;
  return f[Math.min(f.length - 1, Math.max(0, Math.floor(k * f.length)))];
};
const fade = (dt, span) => (dt >= 0 && dt < span ? q(1 - dt / span, 0.001) : 0);
const session = (state) => state.armoury?.range ?? null;

// (a key's place: the target's, as the shot role lists them, or an actor's)
function placeOf(state, pid, key) {
  if (!key) return null;
  const t = (targetsOf(state, pid) ?? []).find(o => o.key === key);
  if (t) return { x: t.x, z: t.z };
  const a = state.actors?.list?.find(o => o.id === key);
  return a ? { x: a.x, z: a.z } : null;
}

/** The rifle on a figure (see the header), or null when the person carries none. */
export function gunLook(state, actor, ms = state?.clock?.ms ?? 0) {
  const pid = actor?.who, c = pid ? carryOf(state, pid, actor) : null;
  if (!c) return null;
  const gun = state.items?.[c.gunId];
  if (!gun) return null;
  const s = state.stop?.who === pid ? state.stop : null;
  const sess = session(state), shooter = sess ? sess.who ?? state.player?.id ?? null : null;
  // (0.0.7: a gunner of the KD's relay, drawn as the player is: its aim at its own target, its shots, its sub-step)
  const G = sess?.course === 'kd' && pid !== shooter ? sess.relay?.find(g => g.pid === pid) ?? null : null;
  const gT = G && c.posture === 'aimed' ? gunnerTarget(state, G) : null;
  const aimAt = s?.aim ? (s.aim.x !== undefined ? { x: s.aim.x, z: s.aim.z } : placeOf(state, pid, s.aim.key)) : gT ? { x: gT.x, z: gT.z } : null;
  const shots = sess?.course === 'kd' ? (sess.shots ?? []).filter(x => x.who === pid) : shooter === pid ? sess.shots : null;
  const shotMs = shots?.length ? shots[shots.length - 1].atMs : null;
  // (the shoot house's number two drawn as you are, on the same sub-step (shoothouse.js handsOf; COMBAT §25.19.5))
  const step = s ? stepNow(state, pid, ms) : G ? gunnerNow(state, pid, ms) : sess?.course === 'house' ? handsOf(state, pid, ms) : null;
  const m = muzzleOf(state, pid, actor);
  // (the rework's R6: the P-12 out, the rifle drawn hanging on its sling, its own look (a look already painted: no sheet made
  // mid-lane), the pistol in hand on the record for the drawing to come (VIEWS §3.10's transition frames, R8))
  const long = isLong(modelOf(gun)), rifle = long ? gun : state.items?.[state.people?.[pid]?.kit?.worn?.sling] ?? gun;
  // (the P-12's tower admin under way, the pistol holstered: drawn in the hands (ADMIN_FRAMES))
  const ap = long && ADMIN_FRAMES[step?.action] ? state.items?.[state.people?.[pid]?.kit?.worn?.holster] : null, admin = ap && !isLong(modelOf(ap)) ? ap : null;
  const af = admin ? ADMIN_FRAMES[step.action] : null;
  return {
    model: rifle.model, carry: long && !admin ? CARRY_RIGS[c.posture] ?? 'front' : 'front', stance: actor.stance ?? 'stand',
    ...(admin ? { pistol: { model: admin.model, posture: 'lowReady' } } : long ? {} : { pistol: { model: gun.model, posture: c.posture } }),
    aim: aimAt ? { x: aimAt.x, z: aimAt.z, ms: s?.aim?.settledMs ?? G?.aimAtMs ?? null } : null, shotMs,
    action: step ? { frame: af ? af[Math.min(af.length - 1, Math.max(0, Math.floor((step.k ?? 0) * af.length)))] : frameAt(step.action, step.k ?? 0), k: step.k ?? 0 } : null,
    flash: shotMs === null ? 0 : fade(ms - shotMs, FLASH_MS), kick: shotMs === null ? 0 : fade(ms - shotMs, KICK_MS),
    muzzle: m ? { x: m.x, y: m.y, z: m.z } : null, finger: c.finger, mag: !!gun.mag, locked: !!gunField(gun, 'locked'),
    // (R8: the close-quarters beat, for the stance sheet's frames: only where a drill runs, so every other look is as before)
    ...(sess?.course === 'house' ? { beat: beatOf(state, pid, ms) } : {}),
    // (its finish, from the item: only when not the issue's black, so a black rifle's look is as before)
    ...(rifle.finish ? { finish: finishOf(rifle) } : {}),
  };
}

/** The kit on a figure: { ears, carrier, pouches: [{ n }] } (n: the magazines in each pouch). */
export function kitLook(state, pid) {
  const kit = state.people?.[pid]?.kit;
  if (!kit) return { ears: false, carrier: false, pouches: [] };
  const head = state.items?.[kit.worn?.head], earsRec = state.items?.[kit.worn?.ears], carrier = state.items?.[kit.worn?.carrier];
  const pouches = (carrier?.holds ?? []).map(id => state.items[id]).filter(p => CONTAINERS[p?.model]?.fits?.includes('mag')).map(p => ({ n: (p.holds ?? []).length }));
  // (ear defenders in the head slot (ears-m1) or their own (ed1, the range's and the bay's issue since 0.0.7), by type, as
  // gear.js gearOf reads them: the hunt of v0.0.18 found the stage drawing you bare-eared under the I card's cups)
  const ears = CONTAINERS[head?.model]?.type === 'ears' || CONTAINERS[earsRec?.model]?.type === 'ears';
  // (v0.0.19: the force-on-force mask, only when worn, so every other kit's look is as it was)
  // (mag boots, only when worn (kit.js 'mb-1' in the worn 'boots' slot: the gear record's boots 'mag'), so every other kit's look is as it was)
  return { ears, carrier: !!carrier, pouches, ...(kit.worn?.mask ? { mask: true } : {}), ...(CONTAINERS[state.items?.[kit.worn?.boots]?.model]?.type === 'boots' ? { boots: 'mag' } : {}) };
}

/** A case's place at ms (WEAPONS §2.8's flight): { x, y, z, rest, rotRad }. rec: ejectCase's; gMs2 the place's (caseGMs2). */
export function caseAt(rec, ms, gMs2) {
  needG(gMs2);
  const t = Math.max(0, (Math.min(ms, rec.landMs) - rec.atMs) / 1000), rest = ms >= rec.landMs;
  const spin = hash01('brass', rec.atMs, rec.kind) * 2 * Math.PI;
  if (rest) return { x: rec.at[0], y: rec.restY ?? 0, z: rec.at[1], rest: true, rotRad: q(spin, 1e-4) };
  const g = rec.restY === undefined ? gMs2 : 0;                    // (a case in free fall does not fall: see the header)
  // (in free fall, after its bounce, the second segment from the face it met)
  const b = rec.path?.[0];
  if (b && ms >= b.atMs) {
    const s = (ms - b.atMs) / 1000;
    return { x: q(b.x + b.v[0] * s, 1e-4), y: rec.y0, z: q(b.z + b.v[2] * s, 1e-4), rest: false, rotRad: q(spin + t * 25, 1e-4) };
  }
  return { x: q(rec.x0 + rec.v[0] * t, 1e-4), y: q(Math.max(0, rec.y0 + rec.v[1] * t - 0.5 * g * t * t), 1e-4), z: q(rec.z0 + rec.v[2] * t, 1e-4), rest: false, rotRad: q(spin + t * 25, 1e-4) };
}

/**
 * A case thrown from the port (WEAPONS §2.8; the record the shot role stores): { kind, atMs, x0, y0,
 * z0, v: [vx, vy, vz], landMs, at: [x, z] }. gun: its record (unused this round but for its model);
 * carry: { x, z, yawRad (or headRad, the heading), stance, hand } (hand: thrown by a hand on the charging handle); key: the
 * hash's (the shot's id, or the step's); gMs2 the place's gravity (caseGMs2: required); faces, under the float band only and
 * required there, the ray to the first face (brass.js caseFacesOf(state)): the record then gains restY and path (see the header).
 */
export function ejectCase(gun, carry, { atMs, kind = 'case', key = '', gMs2, faces = null } = {}) {
  needG(gMs2);
  const yaw = carry.yawRad ?? carry.headRad ?? faceRad(carry.face), stance = carry.stance ?? 'stand';
  const speed = (EJECT_MS + (hash01('eject', key, 'v') * 2 - 1) * EJECT_SPREAD_MS) * (carry.hand ? HAND_EJECT_K : 1);
  const dir = yaw + (EJECT_DEG + (hash01('eject', key, 'a') * 2 - 1) * EJECT_SPREAD_DEG) * Math.PI / 180;
  const x0 = q(carry.x + PORT_AHEAD_M * Math.cos(yaw) - PORT_RIGHT_M * Math.sin(yaw), 1e-4), z0 = q(carry.z + PORT_AHEAD_M * Math.sin(yaw) + PORT_RIGHT_M * Math.cos(yaw), 1e-4);
  const y0 = PORT_H_M[stance] ?? PORT_H_M.stand;
  const vx = q(speed * Math.cos(dir), 1e-4), vz = q(speed * Math.sin(dir), 1e-4);
  if (gMs2 < CASE_FLOAT_MS2) return freeCase({ kind, atMs, x0, y0, z0, vx, vz, faces });
  const landMs = atMs + Math.round(Math.sqrt(2 * y0 / gMs2) * 1000), tq = (landMs - atMs) / 1000;
  return { kind, atMs, x0, y0, z0, v: [vx, 0, vz], landMs, at: [q(x0 + vx * tq, 1e-4), q(z0 + vz * tq, 1e-4)] };
}
// (a case under the float band, its flight to the first face, the bounce and the drift to the next (see the header))
function freeCase({ kind, atMs, x0, y0, z0, vx, vz, faces }) {
  if (typeof faces !== 'function') throw new Error('look.js: a case in free fall flies to the place\'s faces (brass.js caseFacesOf), and none were given');
  const f1 = faces(x0, z0, vx, vz), t1 = atMs + Math.round(f1.tS * 1000);
  // (the bounce: the speed into the face reversed, the whole kept at CASE_BOUNCE)
  const nl = Math.hypot(f1.n[0], f1.n[1]), nx = f1.n[0] / nl, nz = f1.n[1] / nl, dot = vx * nx + vz * nz;
  const bx = q((vx - 2 * dot * nx) * CASE_BOUNCE, 1e-4), bz = q((vz - 2 * dot * nz) * CASE_BOUNCE, 1e-4);
  const f2 = faces(f1.x, f1.z, bx, bz), landMs = t1 + Math.round((f2?.tS ?? 0) * 1000);
  return { kind, atMs, x0, y0, z0, v: [vx, 0, vz], landMs, at: [f2?.x ?? f1.x, f2?.z ?? f1.z], restY: y0, path: [{ atMs: t1, x: f1.x, z: f1.z, v: [bx, 0, bz] }] };
}

/**
 * The range as the stage draws it, or null with no session: { hot, lanes: [{ lane, mine, holes: [{
 * xCm, yCm, score, v, n, string, atMs }] }], brass: [{ x, y, z, kind, rest, rotRad }], lying: [{ id, kind: 'mag', x,
 * z }], pick: { x, z } | null, aimed, gMs2 (the place's gravity at CASE_G_STEP_MS2: the dust's and the plates' fall) }. n: the hole's number in its string, string its string (0 to 2), atMs its shot's game time.
 */
// (0.0.18: the house's look with its devices, the grenades thrown and the bursts (burst.js devicesLook); null stays null;
// v0.0.19: and the kit's devices as the devices layer draws them, render/devices.js: practice grenades, levers, charges, holes,
// the read (devlook.js); and the live men's floor and figures (see the header), only when there is something to draw, so the
// turner lane's look keeps its keys)
const withDevices = (h, state, ms) => (h ? withLive({ ...h, bangs: devicesLook(state, ms), kit: devicesView(state, ms) }, state, ms) : h);
/** A dropped rifle's fall: from this height (m, the hands at the low ready) over this long (ms: about a 0.4 m fall's time at 1 G). */
export const FLOOR_FROM_M = 0.9, FLOOR_FALL_MS = 300;
/** How near a man's feet a lying rifle is his (m). */
export const FLOOR_NEAR_M = 1.5;
/** A marking round's paint puff on a body: how long it shows (ms of game time), and its heights by the zone struck (m). */
export const PAINT_PUFF_MS = 400, PAINT_Y_M = Object.freeze({ head: 1.62, torso: 1.25 });
function withLive(h, state, ms) {
  const R = session(state), men = (R?.turners ?? []).filter(T => T.live?.who);
  const area = state.actors?.area ?? state.places?.live?.area;
  const lying = area ? lyingOf(state, area).filter(l => state.items?.[l.id]?.type === 'gun' && isLong(modelOf(state.items[l.id]))) : [];
  if (!men.length && !lying.length) return h;
  const actor = (who) => state.actors?.list?.find(a => a.who === who) ?? null;
  const floor = lying.map(l => {
    const gun = state.items[l.id], T = men.find(m => m.live.st === 'hands' && Math.hypot((actor(m.live.who)?.x ?? m.x) - l.x, (actor(m.live.who)?.z ?? m.z) - l.z) <= FLOOR_NEAR_M) ?? null;
    // (the fall from the drop (opfor.js droppedAtMs), never from the give's start 600 ms before it, by when the fall would be over
    // and the rifle popped from his hands to the floor in one tick (the review of track L); a record with no drop time, its fromMs)
    const from = T ? (Number.isFinite(T.live.droppedAtMs) ? T.live.droppedAtMs : T.live.fromMs) : null;
    const dt = Number.isFinite(from) ? ms - from : Infinity, k = dt >= 0 && dt < FLOOR_FALL_MS ? dt / FLOOR_FALL_MS : 1;
    return { id: l.id, model: gun.model, finish: gun.finish ? finishOf(gun) : null, x: l.x, z: l.z, y: q(FLOOR_FROM_M * (1 - k * k), 0.001), rotRad: q(hash01('floor', l.id) * 2 * Math.PI, 1e-4) };
  });
  const live = men.map(T => {
    const a = actor(T.live.who), c = a ? carryOf(state, T.live.who, a) : null;
    const near = a ? floor.some(f => Math.hypot(f.x - a.x, f.z - a.z) <= FLOOR_NEAR_M) : false;
    const st = T.live.st, hands = !!a?.hands || st === 'hands';
    const frame = hands && !c ? (a?.stance === 'kneel' ? 'handsKneel' : 'handsUp') : (st === 'down' || st === 'out') && c ? 'sitLow' : null;
    return { key: T.key, who: T.live.who, st, frame, rifle: c ? 'hands' : near ? 'floor' : 'none' };
  });
  // (the paint's puff where a marking round struck, the stack's on a role-player, a role-player's on a marine: the strike's game time)
  const paint = [];
  for (const T of men) {
    const a = actor(T.live.who);
    for (const hit of T.hits ?? []) if (Number.isFinite(hit.atMs) && ms - hit.atMs >= 0 && ms - hit.atMs < PAINT_PUFF_MS && hit.zone) paint.push({ x: a?.x ?? T.x, z: a?.z ?? T.z, y: PAINT_Y_M[hit.part === 'head' ? 'head' : 'torso'], atMs: hit.atMs, by: 'team' });
  }
  for (const x of R?.house?.live?.struck ?? []) {
    const a = actor(x.who);
    if (a && Number.isFinite(x.atMs) && ms - x.atMs >= 0 && ms - x.atMs < PAINT_PUFF_MS) paint.push({ x: a.x, z: a.z, y: PAINT_Y_M[x.part === 'head' ? 'head' : 'torso'], atMs: x.atMs, by: 'rp' });
  }
  return { ...h, floor, men: live, paint };
}
export function rangeLook(state, ms = state?.clock?.ms ?? 0) {
  const s = session(state);
  if (!s) return null;
  const [l0, l1] = s.lanes ?? [1, 6];
  const shots = s.shots ?? [], count = {};
  const holes = {};
  for (const sh of shots) {
    if (!sh.hole) continue;
    const k = `${sh.lane}|${sh.string ?? 0}`;
    count[k] = (count[k] ?? 0) + 1;
    (holes[sh.lane] ??= []).push({ xCm: sh.hole[0], yCm: sh.hole[1], score: sh.score ?? 0, v: !!sh.v, n: count[k], string: sh.string ?? 0, atMs: sh.atMs ?? null });
  }
  const lanes = [];
  // (the fixer of v0.0.24's play review (H1): the anchors course in Well A has no bay lanes, so no bay card's holes and no bay flags
  // (range.js reads `course`); its turners and anchors are `pairs`' below)
  if (s.course !== 'anchors') for (let lane = l0; lane <= l1; lane++) lanes.push({ lane, mine: lane === s.lane, holes: holes[lane] ?? [] });
  const area = state.actors?.area ?? state.places?.live?.area, gMs2 = caseGMs2(state, area);
  const lying = area ? lyingOf(state, area).filter(l => state.items?.[l.id]?.type === 'mag').map(l => ({ id: l.id, kind: 'mag', x: l.x, z: l.z })) : [];
  const pick = state.stop?.pick ?? null, pid = state.stop?.who ?? null;
  // (the last shot's blast: the shooter's place and stance now, which a string never moves; its game time)
  const mineShots = s.course === 'kd' ? shots.filter(x => x.who === (s.who ?? state.player?.id)) : shots;
  const last = mineShots.length ? mineShots[mineShots.length - 1] : null, me = state.actors?.list?.find(a => a.who === (s.who ?? state.player?.id)) ?? null;
  // (a tracer's: its kind, its lane, and where its trace lights and how fast it flies, the calibre's own numbers)
  const L = last?.load ? loadOf('6.5x40r', last.load) : null;
  const fire = last && me && ms - last.atMs >= 0 && ms - last.atMs < dustMsOf(gMs2) ? { atMs: last.atMs, x: me.x, z: me.z, face: me.face ?? 'right', stance: me.stance ?? 'stand',
    ...(last.load ? { load: last.load, lane: last.lane, ...(L?.traceFromM ? { traceFromM: L.traceFromM, vMs: L.vRefMs } : {}) } : {}) } : null;
  return {
    course: s.course ?? null, hot: !!s.hot, lanes, gMs2,
    brass: (s.brass ?? []).map(rec => ({ ...caseAt(rec, ms, gMs2), kind: rec.kind, stance: STANCE_OF_PORT[rec.y0] ?? 'stand', atMs: rec.atMs })),
    lying, pick: pick && pid ? placeOf(state, pid, pick) : null, aimed: !!state.stop?.aim, fire, own: s.course === 'anchors' ? null : bayOwn(s),
    kd: s.course === 'kd' ? kdLook(state, s, ms, gMs2) : null,
    pairs: s.course === 'pairs' ? pairsLook(state, ms) : s.course === 'anchors' ? anchorsLook(state, ms) : null,
    stress: s.stress ? stressLook(state, ms) : null,
    house: s.course === 'house' ? shipLook(withDevices(houseLook(state, ms), state, ms), state) : null,
  };
}
/**
 * v0.0.25 (the build sheet items 7 and 8, §3.4): a ship's lane (the house's record with `ship`, the Wreck's; absent on every house
 * lane, whose look is returned as it is): each stand's face and pop-up from its turner (turners.js turnerTargets' onFace and pop:
 * render/range.js turns the board by them), and the anchors a viewer sees, as the void range's (anchors.js anchorsLook: a hand on a
 * hold or the lanyard drawn to its hold, the wedge), with the #2's brace (the gear's 'buddy': his arm from the one bracing).
 */
function shipLook(h, state) {
  const R = session(state);
  if (!h || !R?.house?.ship) return h;
  const byKey = new Map((R.turners ?? []).map(T => [T.key, T]));
  const stands = (h.stands ?? []).map(t => { const T = byKey.get(t.key); return T && (T.onFace || T.pop) ? { ...t, ...(T.onFace ? { onFace: T.onFace } : {}), ...(T.pop ? { pop: true } : {}) } : t; });
  const anchors = [];
  for (const a of state.actors?.list ?? []) {
    const kind = a.who ? gearAnchorOf(state, a.who) : null;
    if (kind === 'buddy') {
      const b = state.actors.list.find(x => x.id === a.anchorRef || x.who === a.anchorRef);
      if (b) anchors.push({ who: a.who, kind: 'buddy', x: a.x, z: a.z, y: 0, hold: { x: b.x, z: b.z, kind: 'hand' } });
      continue;
    }
    if (kind !== 'hold' && kind !== 'lanyard' && kind !== 'wedge') continue;
    const hd = kind === 'wedge' ? null : anchorHoldOf(state, a.who);
    anchors.push({ who: a.who, kind, x: a.x, z: a.z, y: 0, ...(hd ? { hold: { x: hd.x, z: hd.z, kind: hd.kind } } : {}) });
  }
  return { ...h, stands, anchors };
}

// (0.0.8: your bay lane's stake on the 25 m line, marked as yours as on the KD's (see the header))
function bayOwn(s) {
  const B = (s.line ?? 25) === 25 && s.lane ? KD_RANGE.bay.lanes[s.lane - 1] : null;
  return B ? { lane: B.lane, line: 25, x: B.fp.x + KD_STAKE_DX_M, z: B.fp.z + KD_STAKE_DZ_M, text: String(B.lane) } : null;
}
// (0.0.7: the KD's part of rangeLook (see the header))
function kdLook(state, s, ms, gMs2) {
  const K = KD_RANGE.kd, seed = state.meta?.seed ?? 0;
  const faces = K.lanes.map(L => {
    const v = pitView(s, L.lane, ms), p = s.pits?.[L.lane];
    return { lane: L.lane, x: L.face.x, z: L.face.z, paper: L.face.paper, up: v.up, holes: (v.holes ?? []).map(h => ({ xCm: h.at[0], yCm: h.at[1], n: h.n, atMs: h.atMs })),
      spotter: v.spotter, disk: v.disk ? { value: v.disk.value, sinceMs: v.disk.sinceMs ?? null } : null, flagSinceMs: p?.flagUntilMs && p.flagUntilMs > ms ? p.flagSinceMs ?? null : null };
  });
  const flags = K.flags.map(f => ({ x: f.x, z: f.z, ...flagOf(seed, ms, f.x, f.z) }));
  const actors = state.actors?.list ?? [], fires = [], dust = [];
  for (const sh of s.shots ?? []) {
    const dt = ms - sh.atMs;
    if (dt < 0 || dt >= Math.max(FIRE_LOOK_MS, DUST_MS + 1000)) continue;
    const a = actors.find(x => x.who === sh.who);
    if (dt < FIRE_LOOK_MS && a) fires.push({ who: sh.who, atMs: sh.atMs, x: a.x, z: a.z, face: a.face ?? 'right', stance: a.stance ?? 'stand', load: sh.load ?? 'ball', lane: sh.lane });
    // (a round past its face into the berm: the dust where it struck, its flight later)
    if ((sh.line ?? 25) !== 25 && sh.lane) {
      const at = sh.atMs + 450, L = K.lanes[sh.lane - 1];
      if (L && ms >= at && ms - at < DUST_MS) dust.push({ x: K.berm.rect[0] + 0.3, y: q(L.face.upY + (sh.hole ? -sh.hole[1] / 100 : 0.6), 0.01), z: q(L.z + (sh.hole ? sh.hole[0] / 100 : 0.4), 0.01), atMs: at });
    }
  }
  const brass = (s.brass ?? []).filter(rec => rec.landMs > ms || rec.kind !== 'case').map(rec => ({ ...caseAt(rec, ms, gMs2), kind: rec.kind, stance: STANCE_OF_PORT[rec.y0] ?? 'stand', atMs: rec.atMs }));
  const L = s.kdLane ? K.lanes[s.kdLane - 1] : null, P = L && (s.line ?? 25) !== 25 ? L.points[s.line] : null;
  const own = P ? { lane: L.lane, line: s.line, x: P.fp.x + KD_STAKE_DX_M, z: L.z + KD_STAKE_DZ_M, text: String(L.lane) } : null;
  return { line: s.line ?? 25, faces, flags, fires, brass, tiles: tilesLook(state), dust, own };
}
// (a case's stance from the port height it left: PORT_H_M's values are the stances')
const STANCE_OF_PORT = Object.freeze(Object.fromEntries(Object.entries(PORT_H_M).map(([k, v]) => [v, k])));
