// OLYMPUS arms: the stoppage under contact and the sidearm, the reflex card's answers in close quarters (COMBAT §25.19.6; WEAPONS §3.2's note, §5.2; the shoot house's rework R6, 2026-11-13).
//
// The user's note on v0.0.12 (2026-11-11): "We get a jam in the second room, we should be able to switch to side arm or
// something realistic like take cover". In the house the reflex card on a click (shooting.js offerGunStop) offers what a
// marine in a room does, by the situation (cardOptions, COMBAT §25.19.6's table, first to last):
//   a threat facing within TRANSITION_NEAR_M 10 m, a pistol in the holster: Transition: pistol, Gun down (with a buddy up),
//       Tap, rack (standing), Off the line, Look at the port
//   a threat facing, no pistol (or farther), your #2 up: Gun down, Tap, rack, Off the line, Look at the port
//   nobody facing, your #2 up ("should immediately announce gun down and drop to one knee", FM 3-06.11 §3-15d): Gun down,
//       Tap, rack, Look at the port
//   alone, or off the lane: Tap, rack, Look at the port (as built)
// "Nothing" last always (reflex.js). Below the Sergeant, with a threat close, Transition is shown struck, "not issued". From
// Weapon handling 15 a double feed believed is named ("Gun down: remedial"), as the card names what the hands felt.
//
// Each answer is one list step of sub-steps (weaponList; the stepper times them, shooting.js rifleSub runs the rifle's, and
// sidearmSub here the rest), one press at every rung (an emergency drill is never grained, COMBAT §25.19.2.3):
//   weapon:gun-down    "Gun down!" (CALL_MS), the knee (stance:kneel), IMMEDIATE ACTION (or REMEDIAL for a double feed seen),
//                      "Gun up!", then on the knee until your #2's "Up." (wait:up, ended by the house when he says it, at
//                      most UP_WAIT_MAX_MS), and stand (FM §3-15d: "until directed to stand up")
//   weapon:offline     "Stoppage!", a step to the point WALL_OFF_M off the nearest wall square to the threat's line, at most
//                      bundle.js COVER_STEP_M, routed (state.stop.feet: the feet run beside the hands; below rung 3 the
//                      hands wait for them, step:wall), IMMEDIATE ACTION, "Up!"
//   weapon:transition  the rifle let hang (hang, 0.3 s × pace), the P-12 drawn from the thigh (draw:thigh, 1.1 s × pace, DC 8):
//                      1.40 s × paceOf(WH), 0.64 s at the tier one's 42 (WEAPONS §5.2's table); then the pistol is the gun
//                      in use (state.stop.gun; kit.js handGunOf), its shot rows the panel's (the present is the row's aim)
//   weapon:rifle-up    the P-12 holstered (§5.2's pistol stow, 1.3 s, DC 6), the rifle up (1.0 s), its drill
//   team:cover         your #2 gun down: your eyes and muzzle on his sector (the house's 'cqb-two-down' stop)
// Your #2 takes your sector on "Gun down!" and "Stoppage!" (shoothouse.js twoCover, coverTick: the step's name); his "Up."
// ends your wait on the knee. A fumbled draw or holster costs its time (×1.6) and goes on; a drop halts the step (the pistol
// stays where it was: in the holster, or in the hand). weaponRows(state, pid) are the panel's rows of the weapon group in the
// house: the answers again while the rifle is stopped (the card's "Nothing" leaves them there), Transition beside RELOAD on
// an empty rifle, Rifle up with the pistol out, Cover his sector with your #2 down. In a doorway (or carried through one:
// places/move.js inDoorway; the rework's R8b, 2026-11-13) the knee is never the lead: the drill on the hands leads while the
// feet carry you out, Gun down after it, your own choice. Pure but sidearmSub and sidearmEnd, which
// write the step's effects (the items by kit.js move).
import { q } from '../../core/num.js';
import { playerActor } from '../../core/ids.js';
import { rollerOf } from '../combat/roll.js';
import { doAction, beliefOf, actionMs, gunField } from './firearms.js';
import { subsOf } from './drills.js';
import { move, handGunOf, pistolOf } from './kit.js';
import { isLong, modelOf } from './models.js';
import { facingOf } from './turners.js';
import { TRANSITION_NEAR_M } from './specials.js';
import { inHouse, targetOf, stanceMsOf, LABELS } from './shooting.js';
import { wayOf, COVER_STEP_M, BODY_GAP_M, CALL_FLOW_S, TWO_SAY, doorNow } from '../combat/bundle.js';
import { clipped } from '../combat/route.js';
import { profileOf, pathLen } from '../combat/stepper.js';
import { legsHere, coastTo, inDoorway } from '../places/move.js';
import { gaitsOf } from '../body/motion.js';
import { gravityAt } from '../places/env.js';
import { rungOf } from '../skills/templates.js';
import { SEEN } from '../people/perception.js';
import { paceOf } from '../skills/skills.js';

/** The calls of the answers (voice, CALL_MS each: shouted as the hands move; FM 3-06.11 table 3-2). */
export const CALLS = Object.freeze({ 'call:gundown': TWO_SAY.gunDown, 'call:gunup': TWO_SAY.gunUp, 'call:stoppage': 'Stoppage!', 'call:up': 'Up!' });
/** A call's time (COMBAT §25.19.6: "Gun down!" voice, 0.2 s, flowing: bundle.js CALL_FLOW_S), ms. */
export const CALL_MS = Math.round(CALL_FLOW_S * 1000);
/** Off the line ends with the body's centre this far off the wall's face (m; COMBAT §25.19.6). */
export const WALL_OFF_M = 0.4;
/** The knee held for your #2's "Up." at most this long (ms; my call: never a dead end when he is busy or gone), and its estimate on the card (shoothouse.js UP_WAIT_MS 400). */
export const UP_WAIT_MAX_MS = 4000, UP_SAID_MS = 400;
/** Your #2 counts as up with you within this of you (m; my call: the room's width), and Gun down needs him so. */
export const BUDDY_M = 3.5;
/** The sheets the house issues the P-12 to (COMBAT §25.19.6, question 2's default: from the Sergeant up). */
export const SIDEARM_TIERS = Object.freeze(['sgt', 'raider', 'tierone']);
/** The rows' ids by the card's keys. */
export const ANSWER_STEPS = Object.freeze({ gundown: 'weapon:gun-down', offline: 'weapon:offline', transition: 'weapon:transition' });
/** The sub-steps this module runs itself (the others are the rifle's: shooting.js rifleSub). */
export const OWN_SUBS = Object.freeze(new Set([...Object.keys(CALLS), 'wait:up', 'step:wall', 'draw:thigh', 'team:cover', 'pistol:ready', 'pistol:clear']));
/** Their words (shooting.js LABELS takes them). */
export const SIDEARM_LABELS = Object.freeze({ 'call:gundown': '"Gun down!"', 'call:gunup': '"Gun up!"', 'call:stoppage': '"Stoppage!"', 'call:up': '"Up!"', 'wait:up': 'On a knee: wait for "Up."',
  'step:wall': 'Step to the wall', hang: 'Let it hang', 'draw:thigh': 'Draw the pistol', holster: 'Holster it', 'team:cover': 'Cover his sector',
  'pistol:ready': 'The pistol: rack, safe, holster', 'pistol:clear': 'The pistol: clear, holster' });
/** The tower's macros that cover the P-12 too, the pistol last (COMBAT §25.19.6; WEAPONS §5.3's note): MAKE READY racks it, UNLOAD and SHOW CLEAR clear it. */
export const ADMIN = Object.freeze({ ready: 'pistol:ready', unload: 'pistol:clear', clear: 'pistol:clear' });

const actorOf = (state, pid) => state.actors?.list?.find(a => a.who === pid) ?? null;
const rifleOf = (state, pid) => state.people?.[pid]?.kit?.worn?.sling ?? null;
const houseOf = (state) => (state.armoury?.range?.course === 'house' ? state.armoury.range.house ?? null : null);
const laneLive = (state) => { const H = houseOf(state); return !!H && H.goAtMs !== null && H.goAtMs !== undefined && !H.end; };
/** The P-12 in its holster, ready to draw, or null. */
export const holstered = (state, pid) => { const k = state.people?.[pid]?.kit; return k?.worn?.holster ?? null; };
/** The pistol in your hand (drawn), or null. */
export const drawn = (state, pid) => { const h = handGunOf(state, pid); return h && !isLong(modelOf(state.items[h])) ? h : null; };
// (the drill a stoppage believed calls for: REMEDIAL for a double feed seen, else IMMEDIATE ACTION)
const drillOf = (b) => (b?.stoppage === 'double' ? 'remedial' : 'ia');
// (its words on the card and the rows: from Weapon handling 15 what the hands felt (as built, §25.6.6))
const drillWords = (state, pid, b) => (b?.stoppage === 'double' && rollerOf(state, pid).value('weapons') >= 15 ? 'remedial' : 'tap, rack');

/** The nearest threat facing you that you know of (taken in, not forgotten: contact.js's known, or the last pause's), up and in the gun's frame: { T, dM } or null. Never one you have not seen (the reach review of 2026-11-13: the card's Transition knew of a man the marine had not taken in). */
export function threatFacing(state, pid, ms = state.clock.ms) {
  const R = state.armoury?.range, me = actorOf(state, pid);
  if (!R?.turners?.length || !me) return null;
  const c = state.mind?.contact, known = c?.known ?? {}, last = c?.last?.ids ?? [];
  let best = null;
  for (const T of R.turners) {
    if (!['threat', 'armoured', 'hostage'].includes(T.face) || (T.stoppedAtMs !== null && T.stoppedAtMs !== undefined) || facingOf(T, ms) < SEEN) continue;
    if (known[T.key] === undefined && !last.includes(T.key)) continue;
    if (!targetOf(state, T.key, pid)) continue;
    const dM = Math.hypot(T.x - me.x, T.z - me.z);
    if (!best || dM < best.dM) best = { T, dM };
  }
  return best;
}
/** Your #2 up beside you (see BUDDY_M): his rifle working, not gun down himself. */
export function buddyUp(state, pid) {
  const H = houseOf(state), W = H?.two, a = W?.pid ? actorOf(state, W.pid) : null, me = actorOf(state, pid);
  if (!a || !me || W.down) return false;
  const g = state.items?.[rifleOf(state, W.pid)];
  if (!g || gunField(g, 'jam') || gunField(g, 'chamber') !== 'live') return false;
  return Math.hypot(a.x - me.x, a.z - me.z) <= BUDDY_M;
}

/**
 * The sub-steps of an answer (see the header), or null where it cannot be done: key 'gun-down', 'offline', 'transition',
 * 'rifle-up', 'cover'. feet: Off the line's step (offlineFeet's), to know whether the hands wait for it.
 */
export function weaponList(state, pid, key, { feet = null } = {}) {
  const me = actorOf(state, pid), rifle = rifleOf(state, pid), b = rifle ? beliefOf(state, rifle) : null;
  if (!me) return null;
  if (key === 'gun-down') {
    if (!b?.stoppage || drawn(state, pid)) return null;
    return ['call:gundown', ...(me.stance === 'kneel' ? [] : ['stance:kneel']), ...subsOf(drillOf(b), b), 'call:gunup', ...(houseOf(state)?.two?.pid ? ['wait:up'] : []), 'stance:stand'];
  }
  if (key === 'offline') {
    if (!b?.stoppage || drawn(state, pid)) return null;
    const wait = feet && rungOf(state, pid, 'room') < 3;
    return ['call:stoppage', ...(wait ? ['step:wall'] : []), ...subsOf(drillOf(b), b), 'call:up'];
  }
  if (key === 'transition') return holstered(state, pid) && !drawn(state, pid) ? ['hang', 'draw:thigh'] : null;
  if (key === 'rifle-up') {
    if (!drawn(state, pid)) return null;
    return ['holster', 'up', ...(b?.stoppage ? subsOf(drillOf(b), b) : [])];
  }
  if (key === 'cover') return houseOf(state)?.two?.down ? ['team:cover'] : null;
  return null;
}
/** A list's time at the normal tempo, ms (each sub-step's own formula on its own gun; the wait for "Up." at his UP_SAID_MS). */
export function listMs(state, pid, list, { feet = null } = {}) {
  const roller = rollerOf(state, pid), me = actorOf(state, pid), rifle = state.items?.[rifleOf(state, pid)], pistol = state.items?.[pistolOf(state, pid)];
  let stance = me?.stance ?? 'stand', gun = drawn(state, pid) ? pistol : rifle, ms = 0;
  for (const a of list ?? []) {
    if (CALLS[a]) ms += CALL_MS;
    else if (a === 'wait:up') ms += UP_SAID_MS;
    else if (a === 'step:wall') ms += feet ? feet.untilMs - feet.fromMs : 0;
    else if (a === 'team:cover') ms += coverMs(state, pid).ms;
    else if (a.startsWith('stance:')) { const to = a.slice(7); ms += stanceMsOf(stance, to, roller.value('fitness'), gravityAt(state, null, me?.x ?? 0, me?.z ?? 0).gG); stance = to; }
    else if (a === 'draw:thigh') { ms += actionMs(roller, pistol, a); gun = pistol; }
    else if (a === 'holster') { ms += actionMs(roller, pistol, a); gun = rifle; }
    else ms += gun ? actionMs(roller, gun, a) : 0;
  }
  return ms;
}

/**
 * Off the line's step (see the header): the feet record (state.stop.feet's shape) to the point WALL_OFF_M off the nearest wall
 * square to the threat's line (the bracketed man's, else the nearest facing, else the head's), at most COVER_STEP_M, on the
 * side clear of your #2 (BODY_GAP_M and a margin), routed; null where no step is to be had (at the wall already, or both
 * sides blocked by him). Read at ms from where the body is (coasted to it), at the speed it has.
 */
export function offlineFeet(state, pid, ms = state.clock.ms, { coast = false } = {}) {
  let me = actorOf(state, pid);
  if (!me) return null;
  if (coast) { coastTo(state, pid, me, ms); me = actorOf(state, pid); }
  const S = state.stop, R = state.armoury?.range, pick = S?.pick ? R?.turners?.find(t => t.key === S.pick) : null;
  const T = pick && (pick.stoppedAtMs === null || pick.stoppedAtMs === undefined) ? pick : threatFacing(state, pid, ms)?.T ?? null;
  const yaw = T ? Math.atan2(T.z - me.z, T.x - me.x) : me.headRad ?? 0, H = houseOf(state), two = H?.two?.pid ? actorOf(state, H.two.pid) : null;
  const from = [me.x, me.z], reach = COVER_STEP_M + WALL_OFF_M + 0.5;
  let best = null;
  for (const side of [1, -1]) {
    const nx = -Math.sin(yaw) * side, nz = Math.cos(yaw) * side;
    const far = [me.x + nx * reach, me.z + nz * reach], stop = clipped(state, from, far), d = Math.hypot(stop[0] - me.x, stop[1] - me.z);
    // (a wall within reach: the face is the clipped point plus the walker's radius (route.js's C0, 0.27 m) along the step)
    const wall = d < reach - 1e-3, faceM = wall ? d + 0.27 : Infinity, stepM = wall ? Math.min(COVER_STEP_M, Math.max(0, faceM - WALL_OFF_M)) : COVER_STEP_M;
    if (stepM < 0.15) continue;
    const to = [q(me.x + nx * stepM, 1e-4), q(me.z + nz * stepM, 1e-4)];
    // (never into or past your #2: the step's line kept BODY_GAP_M and a margin off him)
    if (two && segDist(from, to, [two.x, two.z]) < BODY_GAP_M + 0.1) continue;
    const score = (wall ? 0 : 10) + stepM;
    if (!best || score < best.score) best = { to, score };
  }
  if (!best) return null;
  const path = wayOf(state, [from, best.to]), v = Math.hypot(me.v?.[0] ?? 0, me.v?.[1] ?? 0), L = legsHere(state, pid, me.x, me.z);
  const walk = gaitsOf(state, pid, { gait: me.moveStance ?? 'combat' }).walkMs, P = profileOf(pathLen(path), Math.max(v, walk), L.pushMs2, L.brakeMs2, { v0: v, v1: 0 });
  return { id: 'feet', k: 'move', ch: 'feet', stance: me.moveStance ?? 'combat', path: path.map(p => [q(p[0], 0.0001), q(p[1], 0.0001)]), prof: P, fromMs: ms, untilMs: ms + Math.round(P.T * 1000), way: 'planted', faceKey: T?.key ?? null };
}
function segDist(a, b, p) {
  const vx = b[0] - a[0], vz = b[1] - a[1], l2 = vx * vx + vz * vz, t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vz) / l2)) : 0;
  return Math.hypot(a[0] + vx * t - p[0], a[1] + vz * t - p[1]);
}
// (your #2's sector's bearing, and the head's turn there: Cover his sector's time, a watch's (0.3 s × pace and the turn))
function coverMs(state, pid) {
  const me = actorOf(state, pid), plan = doorNow(state, pid)?.plan, sec = plan?.sectors?.find(s => s.slot === 2) ?? null;
  const yaw = sec ? sec.yawRad : me?.headRad ?? 0, turn = Math.abs(Math.atan2(Math.sin(yaw - (me?.headRad ?? 0)), Math.cos(yaw - (me?.headRad ?? 0))));
  const wh = rollerOf(state, pid).value('weapons');
  return { yaw, ms: Math.round((0.3 * paceOf(wh) + turn / Math.PI * 0.4 * paceOf(wh)) * 1000) };
}

/**
 * The reflex card's answers in the house (see the header), from the built ones (ia: "Tap, rack"; look): [{ key, label, step, ms,
 * off? }]. Off the lane, or outside the house, the built ones as they were.
 */
export function cardOptions(state, pid, { ia, look }) {
  if (!inHouse(state) || !laneLive(state)) return [ia, look];
  const rifle = rifleOf(state, pid), b = beliefOf(state, rifle), near = threatFacing(state, pid), buddy = buddyUp(state, pid);
  const pistol = holstered(state, pid), close = !!near && near.dM <= TRANSITION_NEAR_M, words = drillWords(state, pid, b);
  const opt = (key, label) => { const list = key === 'offline' ? weaponList(state, pid, key, { feet: offlineFeet(state, pid) }) : weaponList(state, pid, key === 'gundown' ? 'gun-down' : key); return list ? { key, label, step: ANSWER_STEPS[key], ms: listMs(state, pid, list, { feet: key === 'offline' ? offlineFeet(state, pid) : null }) } : null; };
  const gd = buddy ? opt('gundown', `Gun down: ${words}`) : null, off = near ? opt('offline', `Off the line: ${words}`) : null;
  const tr = close && pistol ? opt('transition', 'Transition: pistol') : null;
  const standing = gd ? { ...ia, label: `${ia.label} (standing)` } : ia;
  const struck = close && !pistol ? [{ key: 'transition', label: 'Transition: pistol', step: null, ms: 0, off: 'not issued' }] : [];
  // (in a doorway the knee is never the card's lead: the drill on the hands while the feet carry you through (the rework's R8b:
  // places/move.js throughOf); Gun down stays offered, the player's own choice, after it)
  if (gd && inDoorway(state, pid)) return [tr, standing, gd, off, look, ...struck].filter(Boolean);
  return [tr, gd, standing, off, look, ...struck].filter(Boolean);
}

/** The weapon group's rows in the house's panel (see the header): { id, kind: 'weapon', label, ms, subs, group, slot, lead?, later?, off? }. */
export function weaponRows(state, pid, ms = state.clock.ms) {
  // (off the lane only Rifle up, a P-12 still out when the lane ended: the tower's commands are the rifle's)
  if (!inHouse(state) || (!laneLive(state) && !drawn(state, pid))) return [];
  const rifle = rifleOf(state, pid), b = rifle ? beliefOf(state, rifle) : null, near = threatFacing(state, pid, ms), out = [];
  const row = (id, key, label, slot, o = {}) => {
    const feet = key === 'offline' ? offlineFeet(state, pid, ms) : null, list = weaponList(state, pid, key, { feet });
    if (!list) return;
    out.push({ id, kind: 'weapon', label, ms: listMs(state, pid, list, { feet }), rushMs: null, carefulMs: null, odds: null, routine: null, off: null, cmd: false, skill: 'weapons',
      subs: list.map(a => ({ id: a, label: LABELS[a] ?? SIDEARM_LABELS[a] ?? a, ms: 0 })), group: 'weapon', slot, ...o });
  };
  const words = drillWords(state, pid, b), pistolOut = !!drawn(state, pid);
  if (pistolOut) row('weapon:rifle-up', 'rifle-up', `Rifle up: holster${b?.stoppage ? `, ${words}` : ''}`, 3, { lead: !near });
  else if (b?.stoppage) {
    if (holstered(state, pid)) row('weapon:transition', 'transition', 'Transition: pistol', 1, { lead: !!near && near.dM <= TRANSITION_NEAR_M });
    if (buddyUp(state, pid)) row('weapon:gun-down', 'gun-down', `Gun down: ${words}`, 0, { lead: (!near || near.dM > TRANSITION_NEAR_M || !holstered(state, pid)) && !inDoorway(state, pid) });
    row('weapon:offline', 'offline', `Off the line: ${words}`, 2, { later: !near });
  } else if (b?.locked && b.count === 0 && holstered(state, pid) && near && near.dM <= TRANSITION_NEAR_M) row('weapon:transition', 'transition', 'Transition: pistol', 1, { lead: true });
  if (houseOf(state)?.two?.down && !houseOf(state).two.coveredBy) row('team:cover', 'cover', 'Cover his sector', 0, { group: 'team', lead: true });
  return out;
}

// ---- the tower's macros over both guns (see ADMIN) ----

/** The P-12's part of a tower macro for a person (see ADMIN): [] where none is carried holstered or it is already so. */
export function adminSubs(state, pid, macroId) {
  const id = ADMIN[macroId], p = holstered(state, pid), g = p ? state.items[p] : null;
  if (!id || !g) return [];
  const b = beliefOf(state, p);
  if (id === 'pistol:ready') return b.mag === 'in' && b.chamber === 'empty' && b.count !== 0 ? [id] : [];
  return b.mag === 'in' || b.chamber !== 'empty' || b.locked ? [id] : [];
}
// (its parts: the draw and the holster at their times, unrolled (a drill on the line, unhurried: my call); between them the
// rolled actions on the pistol, each logged; the magazine out by hand into the thigh's pouch at its pouch time)
const ADMIN_PARTS = Object.freeze({ 'pistol:ready': ['charge', 'selector:safe'], 'pistol:clear': ['magOut', 'lockBack', 'inspect', 'release', 'selector:safe'] });
/** The P-12's part's time before any fumble, ms. */
export function adminMs(state, pid, sub) {
  const roller = rollerOf(state, pid), g = state.items?.[pistolOf(state, pid)];
  if (!g || !ADMIN_PARTS[sub]) return 0;
  return actionMs(roller, g, 'draw:thigh') + actionMs(roller, g, 'holster') + ADMIN_PARTS[sub].reduce((t, a) => t + actionMs(roller, g, a === 'magOut' ? 'magOut:pouch' : a), 0);
}
function adminRun(state, bus, pid, sub, d) {
  const p = holstered(state, pid), g = p ? state.items[p] : null, roller = rollerOf(state, pid);
  if (!g) return { ms: 0, ok: null, text: 'No pistol.' };
  let ms = actionMs(roller, g, 'draw:thigh') + actionMs(roller, g, 'holster'), ok = true;
  const said = [];
  for (const a of ADMIN_PARTS[sub]) {
    if (a === 'magOut') {
      if (!g.mag) continue;
      const k = state.people[pid].kit, pouch = k.worn?.thigh, m = g.mag, C = pouch ? state.items[pouch] : null;
      move(state, m, C && (C.holds ?? []).length < 2 ? { container: pouch } : { pid, hand: 1 });
      if (g.belief) delete g.belief.count;
      ms += actionMs(roller, g, 'magOut:pouch');
      continue;
    }
    const r = doAction(state, bus, { pid, gunId: p, action: a, tempo: d.tempo, pressure: 'evaluated' });
    if (r.refused) continue;
    ms += r.ms ?? 0;
    if (r.ok === false) ok = false;
    if (r.text) said.push(r.text);
  }
  return { ms, ok, text: said.at(-1) ?? 'Holstered.' };
}

// ---- the sub-steps (the stepper's, through shooting.js rifleSub and endSub) ----

/** Sub-step i of a weapon row rolled and applied at atMs where it is this module's (OWN_SUBS): { rec, text } or null. */
export function sidearmSub(state, bus, d, i, atMs) {
  const id = d.list[i];
  if (!OWN_SUBS.has(id)) return null;
  const S = state.stop, pid = S.who, rec = { action: id, ms: 0, ok: null, grade: null, routine: null, mishap: null };
  let text = SIDEARM_LABELS[id] ?? id;
  if (CALLS[id]) {
    rec.ms = CALL_MS; text = CALLS[id];
    bus?.emit('say', { who: pid, text, kind: 'speech', durMs: 900, call: id.slice(5) });
  } else if (id === 'wait:up') {
    rec.ms = UP_WAIT_MAX_MS; d.upFromMs = atMs;
  } else if (id === 'step:wall') {
    rec.ms = S.feet && !S.feet.done ? Math.max(0, S.feet.untilMs - atMs) : 0;
  } else if (id === 'team:cover') {
    const c = coverMs(state, pid);
    rec.ms = c.ms; d.coverYaw = q(c.yaw, 1e-6);
    const W = houseOf(state)?.two;
    if (W) W.coveredBy = pid;
  } else if (id === 'pistol:ready' || id === 'pistol:clear') {
    const r = adminRun(state, bus, pid, id, d);
    rec.ms = r.ms; rec.ok = r.ok; text = r.text;
  } else if (id === 'draw:thigh') {
    const p = holstered(state, pid);
    if (!p) { d.cut = true; return { rec, text: 'No pistol in the holster.' }; }
    const r = doAction(state, bus, { pid, gunId: p, action: id, tempo: d.tempo, pressure: 'evaluated' });
    Object.assign(rec, { ms: r.ms ?? 0, ok: r.ok ?? null, grade: r.grade ?? null, routine: r.routine ?? null, mishap: r.mishap ?? null });
    if (r.caught) rec.caught = true;
    if (r.clean) rec.clean = true;
    text = r.text || text;
    // (a slow draw is a draw: only a drop or a discharge halts it, the pistol where it was)
    if (r.mishap) d.halt = true; else d.drawn = p;
  }
  return { rec, text };
}

/** A weapon row's sub-step ended (see the header): the pistol into the hand or the holster, the eyes on his sector. */
export function sidearmEnd(state, bus, d, id) {
  const S = state.stop, pid = S?.who, k = pid ? state.people?.[pid]?.kit : null, me = playerActor(state);
  if (!k) return;
  if (id === 'hang') S.aim = null;
  else if (id === 'draw:thigh' && d.drawn) {
    const p = d.drawn, hands = k.hands ?? [null, null];
    delete d.drawn;
    // (both hands full (a stripped magazine and another): the draw comes to nothing, the pistol where it was)
    if (hands[0] && hands[1]) return;
    move(state, p, { pid, hand: !hands[0] ? 0 : 1 });
    S.gun = p; S.aim = null;
    (k.carry ??= {}).posture = 'lowReady';
    delete k.carry.finger;
    // (a transition is a fighting draw: the thumb takes the safety off as the pistol comes out on the lane (the design review
    // of 2026-11-13: it came out "SAFE 1 + 9", Off safe on 8, at the moment the man is up); off the lane it stays as it was)
    if (laneLive(state) && state.items[p]) state.items[p].mode = 'semi';
  } else if (id === 'holster') {
    const p = drawn(state, pid);
    // (on safe before it goes in (WEAPONS §5.2's stow): the tower's Stop judges a holstered P-12 on safe (shoothouse.js pistolLacks))
    if (p && state.items[p]) state.items[p].mode = 'safe';
    if (p) move(state, p, { pid, slot: 'holster' });
    S.gun = rifleOf(state, pid) ?? S.gun; S.aim = null;
    (k.carry ??= {}).posture = 'slungFront';
    delete k.carry.finger;
  } else if (id === 'team:cover' && me && d.coverYaw !== undefined) { me.headRad = d.coverYaw; S.aim = null; }
}

/** The wait on the knee (wait:up) ended now, your #2 having said "Up." (the house's coverTick): the doing's sub-step closed at the clock. */
export function upHeard(state, ms = state.clock.ms) {
  const d = state.stop?.doing;
  if (!d || d.beats || d.list?.[d.i] !== 'wait:up') return false;
  d.untilMs = Math.max(d.subFromMs ?? ms, ms);
  return true;
}
