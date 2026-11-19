// OLYMPUS people: the Seen record, what a viewer sees of a person now, the one record every portrait draws from (VIEWS §4.4, §7.7; COMBAT §25.18.4; the build sheet v0.0.23 §1 A, §3.1; the portraits lens P§3.1). Pure.
//
// The user, 2026-11-17, scoring "Stack and clear" on seed 4028068471: "the portrait of the NPC holding a gun does not display the gun
// they are holding, the portraits need to be more dynamic and show us what we would be seeing, including what they are holding"; and
// of the sidearm, the same day: "sidearm should have the same stances (low ready, high ready, aimed, etc) as the rifle". The target
// card, the hostage card, the I and C cards and the loadout's marine each built what they drew from their own reading of the kit, and
// the card drew a man standing, front on, his gun hanging out of the crop, while the stage painted him aiming. This module is the one
// reading: seenOf(state, pid, { by, ms, mirror }) is
//   { who, kind: 'man', frame, gear, hold: { how, right, left, act }, aimAt, pose, facing, yawQ, light: null, cover: null, rangeM, read, key }
//   frame   the stage's frame of him, src/data/portrait.js FRAME_SEEN's names (opfor.js opforLook's, and 'prone');
//   gear    src/sim/arms/gear.js gearOf, seen by the viewer (what he wears and carries);
//   hold    how     src/data/portrait.js HOLD_HOWS: a device in his hands wins (devices.js handDeviceOf: the hands are full, the
//                   drill's setPosture refuses the gun); then his hands up (the frame's, or the actor's own flag with no gun in
//                   them); then the gun by its carry, look.js gunLook's carry and, with the P-12 out, its posture (CARRY_HOW: the
//                   pistol's low ready, high ready and aim, each its own); a magazine in a hand with no gun in them is 'mag';
//           right, left  the model in each hand, or null (no counts: a magazine in the left hand while the rifle is at the ready
//                   is left 'mag'); both hands on a two-handed hold name the gun;
//           act     the P-12's act, by gunLook's action frame (PISTOL_ACTS): 'draw' (the frame 'raise' with the rifle hanging and
//                   the P-12 still in its holster), 'holster', 'check', 'reload', 'clear', else null; only the P-12's: the rifle's
//                   admin stays the stage's frames (the card repaints on a key's change, and a rifle's every charge would repaint it);
//   aimAt   'you' when the gun is aimed (rifle-aim, pistol-aim) and its line (gunLook's muzzle tip from where he stands) is within
//           AIM_AT_RAD of the bearing to the viewer's eye, 'away' when aimed elsewhere, null when not aimed; in the mirror 'away';
//   pose    src/data/portrait.js POSES, the frame's or the body's (the actor's posture, sit; his stance, prone or kneel);
//   facing  his heading (the actor's headRad, else his four-way face) against the bearing from him to the viewer's eye: within
//           FACING_FRONT_RAD 'front', beyond FACING_BACK_RAD 'back', between them 'left' (he faces toward the viewer's left: the
//           heading turned past the bearing the way the angle grows, x right and z down on the plan) or 'right'; the viewer's own
//           record, and every record in the mirror (the I and C cards: you as in a mirror), 'front';
//   yawQ    that relative yaw, quantised to FACING_Q_RAD (a three-quarter candidate's, outside the key);
//   light, cover  reserved for v0.0.24 (the card in his light, the jamb): null, never computed this round;
//   rangeM  the distance on the ground from the viewer to him (a tenth of a metre, ui/hud/hitcard.js hitRangeM's), null in the mirror;
//   read    { holds, state }: what the viewer's take-in has read of him (engage.js seenFace and seenState, for a role-player riding
//           the range's turners), never his record: the card says it in its words ("HANDS NOT SEEN"), the picture is the eye's;
//   key     seenKey(rec): a string of SEEN_KEYS' fields only (the gear by its gearKey, the hold, aimAt, the pose, the facing, the
//           read, the range's band), so a card repaints exactly when what it draws changes, and in a pause never.
// standSeen(face, holds, read, { side, rangeM }) is a board's record (the house's and the bay's stands), kind 'board', the hold the
// stage paints for what the stand holds (range-items.js turnerFace: a rifle across the body at the low ready, a pistol at the chest,
// open hands raised, a phone), the gear standGear's; called by the target view (art reads no sim: the card is given the record).
// The sources are the stage's own readers (look.js gunLook and rangeLook, the take-in's engage.js, gear.js), never state.items by hand
// but for an item's model by its id (modelOfItem: the magazine in a hand, a gun gunLook does not draw),
// and nothing of src/sim/scenarios/ directly: the role-players' state on the stage (his record's st, the hands, the rifle where) is
// rangeLook().house.men's. rangeLook is the costly read (the house's look, its devices): it is made once a tick and kept for the
// tick's other records (by the state, the tick and ms); a caller that changes a role-player's record between two reads at one tick
// passes { fresh: true }. The stage itself is not switched to this record (the build sheet §0 item 33: gunLook's per-tick fields, the
// flash, the kick, the muzzle, the action's share, would freeze under a key): tests/flawless-seen.mjs holds the two to agree at every
// tick of the pinned lanes (F85), through an oracle of its own written from the stage's readers.
import { playerId } from '../../core/ids.js';
import { HOLD_HOWS, FRAME_SEEN, CARRY_HOW, TWO_HANDED, PISTOL_ACTS, portraitBand } from '../../data/portrait.js';
import { gunLook, rangeLook } from '../arms/look.js';
import { gearOf, gearKey, standGear } from '../arms/gear.js';
import { handDeviceOf } from '../arms/devices.js';
import { handMagOf, handGunOf } from '../arms/kit.js';
import { seenFace, seenState, liveRecOf } from '../arms/engage.js';
import { headOf, wrap } from './perception.js';

/** The facing's bands (radians from the bearing to the viewer's eye): front within FACING_FRONT_RAD, back beyond FACING_BACK_RAD, a side between; the relative yaw's step. */
export const FACING_FRONT_RAD = Math.PI / 4, FACING_BACK_RAD = 3 * Math.PI / 4, FACING_Q_RAD = Math.PI / 8;
/** A gun aimed within this of the bearing to your eye is aimed at you (radians: poses.js TURN_RAD.side's value, written here). */
export const AIM_AT_RAD = 0.2;
/** The record's fields that make its key (see the header): what a portrait draws, and nothing else. */
export const SEEN_KEYS = Object.freeze(['kind', 'face', 'gear', 'hold', 'aimAt', 'pose', 'facing', 'read', 'band']);
/** The holds a board's painted man takes for what the stand holds (see the header). */
const BOARD_HOLD = Object.freeze({ rifle: ['rifle-low', 'r7', 'r7'], pistol: ['pistol-ready', 'p12', 'p12'], phone: ['phone', 'phone', null], hands: ['up', null, null] });

const actorOfWho = (state, pid) => state.actors?.list?.find?.(a => a.who === pid) ?? null;
const headingOf = (a) => (Number.isFinite(a?.headRad) ? a.headRad : headOf(a?.face));
const modelOfItem = (state, id) => (id ? state.items?.[id]?.model ?? null : null);

// (rangeLook's role-players, made once a tick (see the header))
const MEN = new WeakMap();
function menOf(state, ms, fresh) {
  const tick = state.clock?.tick ?? null, m = MEN.get(state);
  if (!fresh && m && m.tick === tick && m.ms === ms) return m.men;
  const men = new Map((rangeLook(state, ms)?.house?.men ?? []).map(x => [x.who, x]));
  MEN.set(state, { tick, ms, men });
  return men;
}

/** The stage's frame of a person (FRAME_SEEN's names; see the header): from the actor, his gun's look and a role-player's state on the stage. */
export function frameOfSeen(a, gl, man = null) {
  if ((a?.posture ?? 'stand') === 'sit' || man?.frame === 'sitLow') return 'sit';
  const gunInHands = !!gl && (gl.carry === 'low' || gl.carry === 'high' || gl.carry === 'aim' || !!gl.pistol);
  // (his hands up: the stage's own rule (view.js: the actor's flag and no gun record), or the frame the house's look gives him)
  if (man?.frame === 'handsUp' || man?.frame === 'handsKneel' || (a?.hands === true && !gl)) return a?.stance === 'kneel' || man?.frame === 'handsKneel' ? 'kneel' : 'hands';
  // (giving up: his record says hands, the rifle still on him, lowered until it drops)
  if (man?.st === 'hands' && gunInHands) return 'drop';
  if (man?.st === 'move') return 'run';
  if (man?.st === 'freeze' && a?.stance === 'kneel') return 'cower';
  if (gl?.carry === 'aim' || gl?.pistol?.posture === 'aimed') return 'aim';
  if (a?.stance === 'prone') return 'prone';
  if (a?.stance === 'kneel') return 'crouch';
  return 'stand';
}
/** The body's pose with no frame of its own (see the header). */
const bodyPose = (a) => ((a?.posture ?? 'stand') === 'sit' ? 'sit' : a?.posture === 'lie' || a?.stance === 'prone' ? 'prone' : a?.stance === 'kneel' ? 'kneel' : 'stand');

/** The hold (see the header): { how, right, left, act }. */
export function holdOfSeen(state, pid, gl, frame, gear) {
  const dev = handDeviceOf(state, pid);
  if (dev) return { how: 'device', right: dev.model ?? null, left: null, act: null };
  const F = FRAME_SEEN[frame] ?? {};
  if (F.how === 'up') return { how: 'up', right: null, left: null, act: null };
  const magId = handMagOf(state, pid)?.id ?? null, mag = modelOfItem(state, magId);
  const how = gl ? CARRY_HOW[gl.pistol ? `pistol:${gl.pistol.posture}` : gl.carry] ?? (gl.pistol ? 'pistol-ready' : 'empty') : 'empty';
  const inHands = TWO_HANDED.has(how);
  if (!inHands && mag) return { how: 'mag', right: null, left: mag, act: null };
  const gunModel = gl ? (gl.pistol ? gl.pistol.model : gl.model) : modelOfItem(state, handGunOf(state, pid));
  // (the P-12's act: by its action's frame while it is out; the draw while it comes out of the holster, the rifle let hang)
  const fr = gl?.action?.frame;
  const act = gl?.pistol ? PISTOL_ACTS[fr] ?? null : gl && gl.carry === 'front' && fr === 'raise' && gear?.pistol?.place === 'holster' ? 'draw' : null;
  return { how, right: inHands ? gunModel : null, left: inHands ? (mag ?? gunModel) : null, act };
}

/** Whether a gun's line, from a man at (x, z), points at the eye at (ex, ez) within AIM_AT_RAD: 'you' | 'away'. */
function aimAtOf(a, gl, eye) {
  const m = gl?.muzzle, yaw = m && Math.hypot(m.x - a.x, m.z - a.z) > 1e-6 ? Math.atan2(m.z - a.z, m.x - a.x) : headingOf(a);
  return Math.abs(wrap(Math.atan2(eye.z - a.z, eye.x - a.x) - yaw)) <= AIM_AT_RAD ? 'you' : 'away';
}
/** The facing of a man at a heading seen from an eye (see the header): { facing, yawQ }. */
export function facingOfSeen(a, eye) {
  const rel = wrap(headingOf(a) - Math.atan2(eye.z - a.z, eye.x - a.x)), abs = Math.abs(rel);
  const facing = abs <= FACING_FRONT_RAD ? 'front' : abs >= FACING_BACK_RAD ? 'back' : rel > 0 ? 'left' : 'right';
  return { facing, yawQ: Math.round(rel / FACING_Q_RAD) * FACING_Q_RAD };
}

/** A record's key (see the header): SEEN_KEYS' fields only. */
export function seenKey(rec) {
  if (!rec) return '-';
  const h = rec.hold ?? {}, r = rec.read ?? {};
  const parts = {
    kind: rec.kind ?? 'man', face: rec.face ?? '', gear: gearKey(rec.gear), hold: `${h.how ?? 'empty'}:${h.right ?? ''}:${h.left ?? ''}:${h.act ?? ''}`,
    aimAt: rec.aimAt ?? '', pose: rec.pose ?? 'stand', facing: rec.facing ?? 'front', read: `${r.holds ?? ''}:${r.state ?? ''}`, band: portraitBand(rec.rangeM),
  };
  return SEEN_KEYS.map(k => parts[k]).join('|');
}

/** What the viewer sees of a person now (see the header), or null with no actor and no kit. */
export function seenOf(state, pid, { by = playerId(state), ms = state?.clock?.ms ?? 0, mirror = false, fresh = false } = {}) {
  const a = actorOfWho(state, pid);
  const gear = gearOf(state, pid, { by });
  if (!a || !gear) return null;
  const gl = state.people?.[pid]?.kit ? gunLook(state, a, ms) : null;
  const T = liveRecOf(state, pid), man = T ? menOf(state, ms, fresh).get(pid) ?? null : null;
  const frame = frameOfSeen(a, gl, man), hold = holdOfSeen(state, pid, gl, frame, gear);
  const pose = FRAME_SEEN[frame]?.pose ?? bodyPose(a);
  const me = !mirror && by !== pid ? actorOfWho(state, by) : null;
  const eye = me ? { x: me.x, z: me.z } : null;
  const { facing, yawQ } = eye ? facingOfSeen(a, eye) : { facing: 'front', yawQ: 0 };
  const aimed = hold.how === 'rifle-aim' || hold.how === 'pistol-aim';
  const aimAt = !aimed ? null : eye ? aimAtOf(a, gl, eye) : 'away';
  const rangeM = eye ? Math.round(Math.hypot(a.x - eye.x, a.z - eye.z) * 10) / 10 : null;
  const read = T ? { holds: seenFace(state, T.key).holds ?? null, state: seenState(state, T.key) } : { holds: null, state: null };
  const rec = { who: pid, kind: 'man', frame, gear, hold, aimAt, pose, facing, yawQ, light: null, cover: null, rangeM, read };
  rec.key = seenKey(rec);
  return rec;
}

/** A board's record (see the header): its painted man's gear and the hold the stage paints for what the stand holds. */
export function standSeen(face = 'threat', holds = 'rifle', read = null, { side = null, rangeM = null } = {}) {
  const shown = face === 'unknown' ? null : holds;
  const [how, right, left] = BOARD_HOLD[shown] ?? ['empty', null, null];
  const r = read && typeof read === 'object' ? { holds: read.holds ?? null, state: read.state ?? null } : { holds: typeof read === 'string' ? read : holds ?? null, state: null };
  const rec = { who: null, kind: 'board', face, frame: 'stand', gear: standGear(face, holds), hold: { how, right, left, act: null }, aimAt: null, pose: 'stand', facing: 'front', yawQ: 0,
    light: null, cover: null, rangeM: Number.isFinite(rangeM) ? rangeM : null, read: r, ...(side ? { side } : {}) };
  rec.key = seenKey(rec);
  return rec;
}

/** The holds a record can take (the seen suite's whitelist). */
export { HOLD_HOWS };
