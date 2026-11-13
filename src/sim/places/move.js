// OLYMPUS places: the player's walk on the live area's grid, at the body's gaits (the fast layer `player`).
//
// A speed by the keys held, the step taken on the live area's nav grid for the player's clearance
// class, and the actor's facing, gait and stride kept for the view. The speeds are BODY's gait helper
// (src/sim/body/motion.js gaitSpeeds, BODY §16.1 and §16.3, rounded to 0.01 m/s; the build sheet 0.0.4
// §8 item 11), read for the player each tick (gaitsOf: the felt g, the load, stamina, and the needs
// that forbid a run) at the place's gravity (src/sim/places/env.js gravityAt: no Mars constant is left
// here, ROADMAP "anywhere" step 2). Shift runs, while the body can run (a blown marine walks), and wins
// over Alt, which strolls; with no direction the speed is 0. The gravity's mode (gaitSpeeds' `mode`)
// names what is drawn: under 0.3 G the run is BODY §16.7's 'bound' (its 2.8 m four-frame cycle, the
// art's), and under 0.05 G every move is a 'float' at BODY §16.6's push-off speeds (a stub until
// free-fall motion: no foot falls, src/ui/audio/steps.js).
// While TIME's feetHeld (src/sim/time/doing.js: an activity under way, lying or sitting, a transition
// playing) the keys only turn a standing player (not while a transition plays: the rise keeps its
// facing) and nothing settles the feet, so a berth or a stall
// the player lies or stands in is never pushed out of (0.0.4; inertia, traction and bounding come with
// BODY §16.2).
//
// A tick's step: speedMs × TICK_MS / 1000 along the keys' direction (mx, mz each −1, 0 or 1; KeyW,
// north, is mz = −1), split by axis (a diagonal moves each axis by the step over √2, so the speed is
// the same in every direction). Collision is collide.js's: the walker's circle of its class radius
// against the walls, blocking fixtures and closed leaves its grid was built from (PLACES §2.1's
// blockers), on the grid's floor. x first, then z: each axis takes its whole step where the circle
// stays clear, else moves up to contact (the position rounded back from it), so a walker stops at
// exactly its radius from a wall and slides along it when it presses into it at an angle; a step off
// the floor is refused. The door assist (the usual top-down one, my call after the 0.0.2 review: the
// office's 0.9 m door had stopped a walk that missed its middle by 0.12 m): with one key held and its
// step cut short, the walker looks along the other axis up to NUDGE_M 0.3 m either way, in
// NUDGE_STEP_M 1 cm steps, for the nearest point it can slide to from which the whole step is clear
// (west or north first on a tie), and slides toward it by at most a step; pressing into a flat wall
// finds none. A walker whose own point it may not stand on (a door closed on it, a save from before a
// template moved a wall or a fixture, a load in a wider class) is put on the nearest free cell's
// centre within NEAREST_FREE_M 2 m at once (the nearest a straight line reaches through no wall or rail,
// from 0.0.6), keys held or not (settle), and collides from there; with
// none so near, it may only take steps that stay on the grid and bring it no farther from the nearest
// free cell anywhere on it (0.0.2 let such a walker step anywhere, so it walked through walls and off
// the grid for good). Positions are rounded to POS_STEP_M 0.1 mm (q: TECH §8.1 rule 11), so a long
// walk never drifts between engines.
//
// Facing (faceOf): moving only east–west faces 'right' or 'left', only north–south 'up' or 'down'; a
// diagonal keeps the face if it is one of its two, else takes the north–south one. Facing follows the
// keys even against a wall, but on the range's firing line with the rifle in the hands (a range session
// open, the rifle off its sling: lineStrafe) the keys move without turning, the muzzle held downrange as
// the Corps holds it (the design review of v0.0.5: a 120 ms tap of S turned the figure and the muzzle
// 90°, a fault; a tap of Q turned it 180° and stopped the line at once); slung, the keys turn as anywhere. Gait is 'idle' when nothing moved, else 'run', 'stroll' or 'walk' ('bound' or 'float' by the gravity), and
// strideM counts the metres walked modulo STRIDE_WRAP_M 201.6 m (src/data/body/gait.js, the view's
// number too), which the walk's, the run's and the bound's four-step cycles (0.64, 1.8 and 2.8 m) all
// divide (my calls), so the view picks the frame from strideM and a wrap never jumps a frame. The
// player's $px and $pz (where the actor was at the tick's start, runtime only, for the view's interpolation)
// are set at the tick's first layer (src/sim/game.js, src/sim/body/loco.js tickStart: from the rework's R2, so a
// beat ended in the input layer moves the tween's end, never its start; the layer set them itself before).
//
// 0.0.3 (the build sheet 0.0.3 §2.1): the layer first frees the door leaves that have swung open
// (doors.js doorsStep), walks the grid nav.js gives for the actor's point (a floor's, or a ground's
// window round it, NAV_EDGE_M from its edge), builds at most NAV_CHUNKS_TICK of a ground's chunks
// ahead after the move, and then asks portals.js whether the actor crossed a portal, moving it into
// the next area if it did (moveTo: the facts, the autosave, the cut that is main.js's).
// 0.0.8 (the build sheet 0.0.8 §2.6; COMBAT §25.4.5): the keys are read through the contact's feetOf
// (src/sim/combat/contact.js): with no window open the keys held, while one is open the move held at the
// sighting for the body's go and then none, so the keys are not the marine's until he has taken it in.
// 0.0.12 (the build sheet 0.0.12 §2.2, §8 items 4 to 6; BODY §16.1, §16.2; COMBAT §25.9): the movement stances. The body's
// stance is actor.moveStance ('relaxed' | 'combat' | 'assault'; absent read as Relaxed: the built walk, to the tick, so
// every shipped scene and moment 2's walk are unchanged). In Combat and Assault the walk is the stance's (motion.js
// gaitSpeeds' gait: 1.23 and 2.03 m/s at 1 G) and the body has inertia: its velocity (actor.v = [vx, vz], kept only while
// it moves) goes toward the keys' wanted velocity at the legs' push when it speeds up and their brake when it slows
// (motion.js tractionOf at the place's gravity and floor, with the kit the person carries), so a stop and a restart cost
// real time and a contact's window brakes a walking private to a stop in 0.24 s (contact.js feetOf stops the wanted
// velocity after the body's go); each axis of the tick's step collides as before. A running move beat of a bundle (the
// stepper's moveNow: stop motion with a bundle's feet under way) sets the body's place from its closed form (stepper.js
// moveAt) and the keys are not read.
// The rework's R2 (BODY §16.8, the locomotion record: src/sim/body/loco.js): every branch reports the record (gait,
// strideM, the gait phase gp, the body's yaw bodyRad) through locoStep, and a stance move keeps `locoMs`, the game time
// the body's place is for. The free body's brake (no keys, no beat: inertStep) integrates from it, so a body a beat
// placed mid-tick brakes over the rest of the tick and not over a whole one past it (the 4.06 m/s ticks of v0.0.13), and
// coastTo brings a moving body to a move's start time before the move is planned from it (bundle.js, shooting.js: a
// move begun at the tick's time from a place a tick old stood the body still for that tick, 2.03 m/s to 0 and back at
// every change of row).
// The rework's R5 (COMBAT §25.19.3.4, §25.19.8 F2: "never through each other"): a scene may name the bodies a walker keeps
// its gap from (useBodies: the shoot house's, you and your number two, BODY_GAP_M 0.50 m centre to centre). A tick's step
// by the keys or the brake that would close on such a body inside the gap is not taken and the speed into it is lost (a
// bump), and a bundle's move of the player is held where it stands a tick at a time, its timing with it (the #2's own
// guard, bundle.js gapHold, the same rule); a step that opens the gap is always taken, so nobody is ever pinned.
// 2026-11-13 (the rework's R8b, fluid movement; the user: "soldiers need to stay fluidly moving"): **never at rest in a no-stop
// zone** (src/sim/places/zones.js: a door's funnel, from the place plans). A body moving in a stance whose feet the game would
// stop (a step on the hands, stop motion, the contact's window or a startle, the keys let go) where the brake would leave it
// inside a zone, or already in one, is carried through instead (throughOf): to the next point past the zone on the path the
// scene says it is on (zones.js laneOf: the shoot house's slot path, so to the man's point of domination), else across the zone
// the way it is going, EXIT_M clear, routed round the walls; a closed form from its speed at the stance's walk, braking to rest
// at the end (actor.through, a move beat kept on the actor, plain data). The stepper's moveNow gives it like any game move, so
// the hands work while the feet carry the body out; a move of the stop's own (a bundle's beat, a shot row's feet) takes the
// feet from it, the keys out of stop motion take them back, and a step that stands still by the player's choice (zones.js
// standsStill: Stop here, Hold him, Challenge, Gun down, Off the line, a knee) lets the body brake where it is: the only way
// left to stand in a doorway, and so to earn the funnel's fault. throughTick runs the same carry for another person (the #2).
import { TICK_MS } from '../../core/clock.js';
import { q } from '../../core/num.js';
import { navOf, navAhead, nearestFree, nearestFreeInReach, centreOf, cellOf } from './nav.js';
import { standOk, sweep, onFloor } from './collide.js';
import { doorsStep } from './doors.js';
import { portalCrossed, moveTo } from './portals.js';
import { playerActor, playerId } from '../../core/ids.js';
import { STRIDE_WRAP_M } from '../../data/body/gait.js';
import { gaitsOf, tractionOf } from '../body/motion.js';
import { gravityAt, surfaceAt } from './env.js';
import { G0_MS2 } from '../../core/phys.js';
import { moveNow, moveAt, profileOf, pathLen } from '../combat/stepper.js';
import * as KIT from '../arms/kit.js';
import { valueOf, rungOf } from '../skills/templates.js';
import { SURFACES } from '../../data/places/env.js';
import { feetHeld, transPlaying } from '../time/doing.js';
import { feetOf, pendingOf } from '../combat/contact.js';
import { locoStep } from '../body/loco.js';
import { startled } from '../combat/supp.js';
import { zonesOf, liveZoneAt, exitOf, laneOf, standsStill, EXIT_M } from './zones.js';
import { routed, clipped } from '../combat/route.js';

/** The player's clearance class (PLACES §2.1: C0, PT kit or uniform, until kit sets it). */
export const PLAYER_CLS = 'C0';
export const POS_STEP_M = 0.0001;
export { STRIDE_WRAP_M };
/** The door assist: how far either way along the other axis a cut-short step looks for a way through, and in what steps (metres). */
export const NUDGE_M = 0.3, NUDGE_STEP_M = 0.01;

const sgn = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);

// ---- the bodies a walker keeps its gap from (see the header) ----

// (the scene's rule: (state, pid) → { gapM, bodies: [{ x, z }] } or null; none outside a scene that sets it; kept on the
// hoisted function, as bundle.js useClearGate keeps its, since the scene that sets it is imported while this module loads)
function bodiesOf(state, pid) { return useBodies.fn ? useBodies.fn(state, pid) : null; }
/** A scene names the bodies a walker keeps its gap from (shoothouse.js: you and your number two). fn(state, pid) → { gapM, bodies } or null. */
export function useBodies(fn) { useBodies.fn = typeof fn === 'function' ? fn : null; }
/** Whether moving a walker from (x0, z0) to (x, z) closes on a body of the scene's rule inside its gap (see the header). */
export function bodyBlocks(state, pid, x0, z0, x, z) {
  const B = bodiesOf(state, pid);
  if (!B?.bodies?.length) return false;
  return B.bodies.some(b => { const next = Math.hypot(x - b.x, z - b.z); return next < B.gapM && next < Math.hypot(x0 - b.x, z0 - b.z) - 1e-6; });
}
const K = Math.round(1 / POS_STEP_M);
// (a position rounded to POS_STEP_M back toward where it came from: never past the contact a sweep found)
const toward = (from, v) => (v >= from ? Math.floor(v * K + 1e-7) / K : Math.ceil(v * K - 1e-7) / K);
const at = (actor, axis) => (axis === 'x' ? actor.x : actor.z);
const okAt = (grid, actor, axis, v) => (axis === 'x' ? standOk(grid, v, actor.z) : standOk(grid, actor.x, v));

// (the pace the keys ask for, as the body allows: 'run' (Shift, while it can run), 'stroll' (Alt), 'walk', or 'idle' with no direction)
function keysGaitOf(input, gaits) {
  if (!input || (!sgn(input.mx) && !sgn(input.mz))) return 'idle';
  return input.run && gaits.runOk ? 'run' : input.stroll && !input.run ? 'stroll' : 'walk';
}
/** The gait drawn for the keys (gaits: motion.js gaitsOf's, the place's; required): the pace, but a run is a 'bound' in the bound band and every move a 'float' under 0.05 G (gaits.mode). */
export function gaitOf(input, gaits) {
  const p = keysGaitOf(input, gaits);
  if (p === 'idle') return p;
  if (gaits.mode === 'float') return 'float';
  return p === 'run' && gaits.mode === 'bound' ? 'bound' : p;
}
/** The speed the keys ask for, m/s: 0 with no direction; Shift (run) wins over Alt (stroll). */
export function speedOf(input, gaits) {
  const p = keysGaitOf(input, gaits);
  return p === 'idle' ? 0 : p === 'run' ? gaits.runMs : p === 'stroll' ? gaits.strollMs : gaits.walkMs;
}

/** A heading's nearest facing (the eye's cone is the facing's: perception.js eyeOf). */
export const faceOfHeadRad = (h) => { const a = Math.atan2(Math.sin(h), Math.cos(h)); return Math.abs(a) <= Math.PI / 4 ? 'right' : Math.abs(a) >= 3 * Math.PI / 4 ? 'left' : a > 0 ? 'down' : 'up'; };

/** The facing the keys give: east–west only right or left, north–south only up or down, a diagonal keeps one of its two. */
export function faceOf(mx, mz, face) {
  const x = sgn(mx), z = sgn(mz);
  const ew = x > 0 ? 'right' : x < 0 ? 'left' : null, ns = z < 0 ? 'up' : z > 0 ? 'down' : null;
  if (ew && !ns) return ew;
  if (ns && !ew) return ns;
  if (!ew && !ns) return face;
  return face === ew || face === ns ? face : ns;
}

/**
 * Put a walker on a point it may stand on: where its own is not (collide.js standOk), on the nearest
 * free cell's centre within NEAREST_FREE_M that a straight line reaches through no wall or rail (nav.js
 * nearestFreeInReach, from 0.0.6), else the nearest. Returns whether it moved. Pure but for the actor.
 */
export function settle(actor, grid) {
  if (standOk(grid, actor.x, actor.z)) return false;
  const c = nearestFreeInReach(grid, actor.x, actor.z);
  if (c < 0) return false;
  [actor.x, actor.z] = centreOf(grid, c);
  return true;
}

// (one axis's step: whole where the circle stays clear, else up to contact; nothing off the floor. Returns the metres moved)
function stepAxis(actor, grid, axis, d) {
  const from = at(actor, axis), full = q(from + d, POS_STEP_M);
  let to = full;
  if (!okAt(grid, actor, axis, full)) {
    to = toward(from, from + sgn(d) * sweep(grid, actor.x, actor.z, axis, d));
    if (to === from || !okAt(grid, actor, axis, to)) return 0;
  }
  if (axis === 'x') actor.x = to; else actor.z = to;
  return Math.abs(to - from);
}

// (the door assist: see the header. axis is the cut-short step's, d its signed length)
function nudge(actor, grid, axis, d, step) {
  const other = axis === 'x' ? 'z' : 'x', o0 = at(actor, other);
  // (how far it could slide either way before it touches something: a candidate past that is out of reach)
  const reach = [sweep(grid, actor.x, actor.z, other, -NUDGE_M), sweep(grid, actor.x, actor.z, other, NUDGE_M)];
  for (let k = 1; k * NUDGE_STEP_M <= NUDGE_M + 1e-9; k++) for (const s of [-1, 1]) {
    const o = q(o0 + s * k * NUDGE_STEP_M, POS_STEP_M), gap = Math.abs(o - o0);
    if (reach[s < 0 ? 0 : 1] < gap - 1e-6) continue;
    const px = axis === 'x' ? actor.x : o, pz = axis === 'x' ? o : actor.z;
    if (!onFloor(grid, px, pz) || !(axis === 'x' ? standOk(grid, q(px + d, POS_STEP_M), pz) : standOk(grid, px, q(pz + d, POS_STEP_M)))) continue;
    stepAxis(actor, grid, other, s * Math.min(step, gap));
    return;
  }
}

// (a walker with nothing free within NEAREST_FREE_M: steps that stay on the grid and bring it no farther from the nearest free cell anywhere)
function strayStep(actor, grid, dx, dz) {
  const c = nearestFree(grid, actor.x, actor.z, Infinity), [tx, tz] = c >= 0 ? centreOf(grid, c) : [actor.x, actor.z];
  const d2 = (x, z) => (x - tx) * (x - tx) + (z - tz) * (z - tz);
  const take = (x, z) => cellOf(grid, x, z) >= 0 && (c < 0 || d2(x, z) <= d2(actor.x, actor.z));
  if (dx) { const nx = q(actor.x + dx, POS_STEP_M); if (take(nx, actor.z)) actor.x = nx; }
  if (dz) { const nz = q(actor.z + dz, POS_STEP_M); if (take(actor.x, nz)) actor.z = nz; }
}

/**
 * Move an actor one tick on a grid (see the header): settled first, then x, then z, each up to contact,
 * and the door assist for a single key's step cut short. Returns the metres walked (a settle's move is
 * not walking). Pure but for the actor.
 */
export function moveActor(actor, mx, mz, speedMs, grid) {
  const x = sgn(mx), z = sgn(mz);
  settle(actor, grid);
  if ((!x && !z) || !(speedMs > 0)) return 0;
  const step = speedMs * TICK_MS / 1000 / (x && z ? Math.SQRT2 : 1);
  const x0 = actor.x, z0 = actor.z;
  if (!standOk(grid, actor.x, actor.z)) strayStep(actor, grid, x * step, z * step);
  else {
    const gx = x ? stepAxis(actor, grid, 'x', x * step) : 0, gz = z ? stepAxis(actor, grid, 'z', z * step) : 0;
    if (x && !z && gx < step - POS_STEP_M) nudge(actor, grid, 'x', x * step, step);
    else if (z && !x && gz < step - POS_STEP_M) nudge(actor, grid, 'z', z * step, step);
  }
  const dx = actor.x - x0, dz = actor.z - z0;
  return dx || dz ? q(Math.sqrt(dx * dx + dz * dz), POS_STEP_M) : 0;
}

/** The legs where the player stands (BODY §16.2): motion.js tractionOf at the place's gravity and floor, with what the person carries and their Fitness. */
export function legsHere(state, pid, x, z) {
  const gG = gravityAt(state, null, x, z).gG, mu = surfaceAt(state, null, x, z)?.mu;
  const loadKg = typeof KIT.kitMassKg === 'function' ? KIT.kitMassKg(state, pid) : 0;
  return tractionOf({ gMs2: gG * G0_MS2, mu: Number.isFinite(mu) ? mu : SURFACES.concrete.muDry, effFitness: valueOf(state, pid, 'fitness'), massKg: BODY_KG, loadKg });
}
/** The body under the kit, kg (the build sheet 0.0.12 §4: 25 kg of kit on 75). */
export const BODY_KG = 75;

/** The free body's time step (s): from the game time its place is for (a.locoMs) to ms, at most two ticks; a tick where it has none. */
export function inertDtS(a, ms) {
  if (!Number.isFinite(a?.locoMs)) return TICK_MS / 1000;
  return Math.max(0, Math.min(2 * TICK_MS, ms - a.locoMs)) / 1000;
}
// (one tick in Combat or Assault: the velocity toward the keys' wanted velocity at push or brake, then each axis's step
// collided; from the body's own time (inertDtS), so a body placed mid-tick by a beat moves only the rest of the tick)
function inertStep(state, a, feet, grid, stance, pid = playerId(state), dt = inertDtS(a, state.clock.ms), record = true) {
  const gaits = gaitsOf(state, pid, { gait: stance });
  const x = sgn(feet.mx), z = sgn(feet.mz), n = x && z ? Math.SQRT1_2 : 1;
  const want = x || z ? (feet.run && gaits.runOk ? gaits.runMs : gaits.walkMs) : 0;
  const wx = x * n * want, wz = z * n * want, vx0 = a.v?.[0] ?? 0, vz0 = a.v?.[1] ?? 0;
  a.locoMs = state.clock.ms;
  if (!(dt > 0)) { a.$moved = 0; return; }
  const L = legsHere(state, pid, a.x, a.z), dvx = wx - vx0, dvz = wz - vz0, dv = Math.hypot(dvx, dvz);
  const acc = Math.hypot(wx, wz) >= Math.hypot(vx0, vz0) ? L.pushMs2 : L.brakeMs2, k = dv > 0 ? Math.min(1, acc * dt / dv) : 0;
  const vx = q(vx0 + dvx * k, 0.001), vz = q(vz0 + dvz * k, 0.001);
  const sx = (vx0 + vx) / 2 * dt, sz = (vz0 + vz) / 2 * dt;
  if (want) a.face = faceOf(x, z, a.face);
  const x0 = a.x, z0 = a.z;
  if (sx) moveActor(a, Math.sign(sx), 0, Math.abs(sx) * 1000 / TICK_MS, grid);
  if (sz) moveActor(a, 0, Math.sign(sz), Math.abs(sz) * 1000 / TICK_MS, grid);
  // (a body of the scene's rule in the way (useBodies): the step not taken, as a wall's)
  if ((a.x !== x0 || a.z !== z0) && bodyBlocks(state, pid, x0, z0, a.x, a.z)) { a.x = x0; a.z = z0; }
  // (a wall stops the body: what it did not travel it loses)
  const fx = Math.abs(sx) > 1e-9 && Math.abs(a.x - x0) < Math.abs(sx) * 0.5 ? 0 : vx, fz = Math.abs(sz) > 1e-9 && Math.abs(a.z - z0) < Math.abs(sz) * 0.5 ? 0 : vz;
  if (Math.hypot(fx, fz) > 1e-3) a.v = [fx, fz]; else delete a.v;
  a.$moved = record ? locoStep(a, x0, z0, { state, pid, gait: want && feet.run && gaits.runOk ? 'run' : 'walk', stance, vMs: Math.hypot(vx, vz), dtS: dt }) : Math.hypot(a.x - x0, a.z - z0);
}
/**
 * A moving body brought to its place at ms by the brake (BODY §16.2), from the time its place is for (a.locoMs), collided on
 * the walker's grid; nothing for a body standing or already there. The bundle's and the shot row's moves call it before
 * they plan from the body's place (see the header); record: the record kept here (the player's, whose layer counts from
 * after it), else left to the mover's own layer (the #2's, from his tween start). Returns the metres it moved.
 */
export function coastTo(state, pid, a, ms = state.clock.ms, { record = true } = {}) {
  if (!a || !a.v || !Number.isFinite(a.locoMs) || a.locoMs >= ms) return 0;
  const area = state.places?.live?.area;
  if (!area) return 0;
  const grid = navOf(state, area, PLAYER_CLS, a.x, a.z), stance = a.moveStance === 'assault' ? 'assault' : 'combat';
  const keep = a.gait, now = state.clock.ms;
  // (the brake's tick runs on the clock's own time; the step is to ms)
  inertStep(state, a, { mx: 0, mz: 0 }, grid, stance, pid, inertDtS(a, ms), record);
  a.locoMs = ms <= now ? ms : now;
  const moved = a.$moved ?? 0;
  delete a.$moved;
  if (!moved) a.gait = keep;
  return moved;
}
// (after a step: the ground's chunks ahead, a portal crossed)
function finishStep(state, a, grid, area, bus) {
  const moved = a.$moved ?? 0;
  delete a.$moved;
  if (grid.kind === 'ground') navAhead(state, area, PLAYER_CLS, a.x, a.z);
  const p = moved > 0 ? portalCrossed(state, a) : null;
  if (p) moveTo(state, a.id, p.to, bus, { portal: p });
}

// (a body drawn idle that a beat or the brake moved this tick before its layer (the input layer's coast or a beat's end: from its
// tween start): it walked in this tick, so it is drawn walking (the rework's R2: a move begun this tick drew a tick idle))
const movedThisTick = (a) => (a.gait ?? 'idle') === 'idle' && Math.hypot(a.x - (a.$px ?? a.x), a.z - (a.$pz ?? a.z)) > 1e-9;

// ---- through a no-stop zone (see the header's 2026-11-13 note) ----

/** A body slower than this is at rest: no carry starts from it (m/s; my call, under a stance's crawl). */
export const THROUGH_MIN_MS = 0.05;
/** A body this near the path the scene names follows that path out of the zone (m; bundle.js ENTRY_OFF_M's figure). */
export const LANE_NEAR_M = 0.35;
/** From this rung the carry follows the man's lane on to his point of domination; below it, just clear of the doorway, his point his own to walk to (the recruit step by step; my call, the flow's rung: contact.js SUSPEND_RUNG). */
export const THROUGH_POINT_RUNG = 2;

// (where a point projects on a polyline: its segment i (path[i] to path[i + 1]), the arc s, how far off it stands)
function projectOn(path, x, z) {
  let best = { i: 0, s: 0, off: Infinity }, run = 0;
  for (let i = 0; i + 1 < path.length; i++) {
    const [ax, az] = path[i], [bx, bz] = path[i + 1], L = Math.sqrt((bx - ax) ** 2 + (bz - az) ** 2);
    const t = L > 0 ? Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (z - az) * (bz - az)) / (L * L))) : 0;
    const off = Math.sqrt((x - (ax + t * (bx - ax))) ** 2 + (z - (az + t * (bz - az))) ** 2);
    if (off < best.off - 1e-9) best = { i, s: run + t * L, off };
    run += L;
  }
  return best;
}
// (a path out of a zone cut EXIT_M past where its last leg leaves the last zone it is in (by halves on the leg, to a millimetre))
function clearOf(state, area, pts) {
  const n = pts.length, a = pts[n - 2], b = pts[n - 1];
  if (liveZoneAt(state, area, a[0], a[1]) === null) return pts;
  let lo = 0, hi = 1;
  for (let k = 0; k < 12; k++) { const m = (lo + hi) / 2; if (liveZoneAt(state, area, a[0] + (b[0] - a[0]) * m, a[1] + (b[1] - a[1]) * m)) lo = m; else hi = m; }
  const L = Math.sqrt((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2), k = L > 0 ? Math.min(1, hi + EXIT_M / L) : 1;
  return [...pts.slice(0, -1), [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]];
}
// (the path of the move a running doing of the body's has waiting next (a bundle's beat planned, not begun: the stepper's
// record), so a carry out of a doorway goes the way the drill goes next, not across it; null with none)
function nextMoveOf(state, pid) {
  const S = state.stop?.who === pid ? state.stop : null, d = S?.doing?.beats ? S.doing : S?.flow ?? null;
  const b = d?.beats?.find(x => x.st === 'wait' && x.k === 'move' && x.path?.length >= 2);
  return b ? b.path : null;
}
// (the heading of the path the scene names for a body, where it stands near it: its segment's; else null)
function laneDir(state, pid, a) {
  const lane = nextMoveOf(state, pid) ?? laneOf(state, pid);
  if (!(lane?.length >= 2)) return null;
  const pr = projectOn(lane, a.x, a.z), p = lane[pr.i], n = lane[pr.i + 1], l = Math.sqrt((n[0] - p[0]) ** 2 + (n[1] - p[1]) ** 2);
  return pr.off <= LANE_NEAR_M && l > 0 ? [(n[0] - p[0]) / l, (n[1] - p[1]) / l] : null;
}
// (the ways out of a zone from a place, heading dir (null from rest), best first: along the scene's path for the body to its
// first point past every live zone, then across the zone (the side it heads for, then the other))
function throughPaths(state, pid, area, Z, from, dir) {
  const out = [], lane = nextMoveOf(state, pid) ?? laneOf(state, pid);
  if (lane?.length >= 2) {
    const pr = projectOn(lane, from[0], from[1]), a = lane[pr.i], b = lane[pr.i + 1], tl = Math.sqrt((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2);
    const along = tl > 0 && dir ? (dir[0] * (b[0] - a[0]) + dir[1] * (b[1] - a[1])) / tl : 1;
    if (pr.off <= LANE_NEAR_M && along > -0.2) {
      const pts = [from];
      for (let i = pr.i + 1; i < lane.length; i++) { pts.push(lane[i]); if (!liveZoneAt(state, area, lane[i][0], lane[i][1])) { out.push(rungOf(state, pid, 'room') < THROUGH_POINT_RUNG ? clearOf(state, area, pts) : pts); break; } }
    }
  }
  const ahead = exitOf(Z, from, dir), back = exitOf(Z, from, dir, Z.kind === 'funnel' ? -Math.sign((Z.axis === 'x' ? ahead[1] - from[1] : ahead[0] - from[0]) * Z.into) || 1 : null);
  out.push([from, ahead], [from, back]);
  return out;
}
// (a path that never closes on a body of the scene's rule inside its gap (useBodies: your #2, you), sampled every 5 cm: a carry
// held a tick at a time against a man standing at its end would stand the body in the doorway after all)
function bodyClear(state, pid, path) {
  const B = bodiesOf(state, pid);
  if (!B?.bodies?.length) return true;
  for (const b of B.bodies) {
    let last = Math.sqrt((path[0][0] - b.x) ** 2 + (path[0][1] - b.z) ** 2);
    for (let i = 1; i < path.length; i++) {
      const [ax, az] = path[i - 1], [bx, bz] = path[i], n = Math.max(1, Math.ceil(Math.sqrt((bx - ax) ** 2 + (bz - az) ** 2) / 0.05));
      for (let k = 1; k <= n; k++) {
        const d = Math.sqrt((ax + (bx - ax) * k / n - b.x) ** 2 + (az + (bz - az) * k / n - b.z) ** 2);
        if (d < B.gapM && d < last - 1e-6) return false;
        last = d;
      }
    }
  }
  return true;
}
// (a path the walker can walk as it stands: each leg reached by the walker's circle against the walls and the leaves closed now
// (route.js clipped), a millimetre allowed; the last resort of routed (a straight leg through a shut door) is no way)
function walkable(state, area, path) {
  for (let i = 1; i < path.length; i++) {
    const c = clipped(state, path[i - 1], path[i], { area });
    if (Math.abs(c[0] - path[i][0]) > 1e-3 || Math.abs(c[1] - path[i][1]) > 1e-3) return false;
  }
  return true;
}
/**
 * The carry through a no-stop zone (see the header) for a body moving in a stance, planned at ms from its place (for a.locoMs,
 * the time its place is for) and speed: a move beat { id: 'through', k: 'move', ch: 'feet', stance, path, prof, fromMs,
 * untilMs, way: 'through', zone }, or null where the brake leaves it clear of every zone (or it is at rest, down on a knee,
 * or no way out is clear). Pure: the state is read.
 */
export function throughOf(state, pid, a, ms = state.clock.ms, { rest = false } = {}) {
  // (a Relaxed body has no speed of its own to carry (no inertia: it stops dead), so only from rest, the feet the game's)
  const st = a?.moveStance ?? 'relaxed', area = state.places?.live?.area;
  if (!a || !area || a.stance || (st !== 'combat' && st !== 'assault' && !rest) || !zonesOf(area).length) return null;
  const vx0 = a.v?.[0] ?? 0, vz0 = a.v?.[1] ?? 0, v0 = Math.sqrt(vx0 * vx0 + vz0 * vz0), moving = v0 > THROUGH_MIN_MS;
  if (!moving && !rest) return null;
  // (from rest (rest: the feet the game's, a body in a zone): the heading the way the body's path goes on, else none)
  const v = moving ? v0 : 0, L = legsHere(state, pid, a.x, a.z), stopM = v * v / (2 * L.brakeMs2);
  const Z = liveZoneAt(state, area, a.x, a.z) ?? (moving ? liveZoneAt(state, area, a.x + vx0 / v0 * stopM, a.z + vz0 / v0 * stopM) : null);
  if (!Z) return null;
  const dir = moving ? [vx0 / v0, vz0 / v0] : laneDir(state, pid, a);
  // (the first way out that the walker can walk and that ends clear of every live zone, routed round the walls; never shorter
  // than the brake from its speed: its last leg run on, as far as the walls let it)
  let path = null;
  for (const way of throughPaths(state, pid, area, Z, [a.x, a.z], dir)) {
    const p = routed(state, way, { area }).map(r => [q(r[0], 0.0001), q(r[1], 0.0001)]), len = pathLen(p);
    if (len < stopM + 0.01 && p.length >= 2) {
      const [p0, p1] = p.slice(-2), l = Math.sqrt((p1[0] - p0[0]) ** 2 + (p1[1] - p0[1]) ** 2), k = l > 0 ? (stopM + 0.01 - len) / l : 0;
      const e = clipped(state, p1, [p1[0] + (p1[0] - p0[0]) * k, p1[1] + (p1[1] - p0[1]) * k], { area });
      p[p.length - 1] = [q(e[0], 0.0001), q(e[1], 0.0001)];
    }
    const end = p[p.length - 1];
    if (p.length >= 2 && !liveZoneAt(state, area, end[0], end[1]) && walkable(state, area, p) && bodyClear(state, pid, p)) { path = p; break; }
  }
  if (!path) return null;
  const walk = gaitsOf(state, pid, { gait: st }).walkMs, P = profileOf(pathLen(path), Math.max(v, walk), L.pushMs2, L.brakeMs2, { v0: v, v1: 0 });
  const from = Number.isFinite(a.locoMs) && a.locoMs <= ms ? a.locoMs : ms;
  return { id: 'through', k: 'move', ch: 'feet', stance: st, path, prof: P, fromMs: from, untilMs: from + Math.round(P.T * 1000), way: 'through', zone: Z.id };
}
/**
 * A carry out of the live no-stop zone a body stands in, heading `away` (a unit [x, z], or null for the nearer side): across the
 * zone that way, else the other, walkable and clear of every live zone, at the stance's walk from its speed, braking to rest
 * (the #2 giving way in a doorway to you standing in it: bundle.js). A move beat as throughOf's, or null outside one.
 */
export function throughAway(state, pid, a, away, ms = state.clock.ms) {
  const st = a?.moveStance === 'assault' ? 'assault' : 'combat', area = state.places?.live?.area, Z = area && a ? liveZoneAt(state, area, a.x, a.z) : null;
  if (!Z) return null;
  const from = [a.x, a.z], v = Math.sqrt((a.v?.[0] ?? 0) ** 2 + (a.v?.[1] ?? 0) ** 2), L = legsHere(state, pid, a.x, a.z);
  const ahead = exitOf(Z, from, away), back = exitOf(Z, from, away ? [-away[0], -away[1]] : null);
  for (const e of [ahead, back]) {
    const p = routed(state, [from, e], { area }).map(r => [q(r[0], 0.0001), q(r[1], 0.0001)]), end = p[p.length - 1];
    if (p.length < 2 || liveZoneAt(state, area, end[0], end[1]) || !walkable(state, area, p) || !bodyClear(state, pid, p)) continue;
    const P = profileOf(pathLen(p), Math.max(v, gaitsOf(state, pid, { gait: st }).walkMs), L.pushMs2, L.brakeMs2, { v0: v, v1: 0 });
    return { id: 'through', k: 'move', ch: 'feet', stance: st, path: p, prof: P, fromMs: ms, untilMs: ms + Math.round(P.T * 1000), way: 'away', zone: Z.id };
  }
  return null;
}
/**
 * A walk to a place for a body giving way (the #2 back to his stack, bundle.js): routed, walkable as the leaves stand, never
 * closing on a body of the scene's rule inside its gap, never ending in a live zone; at the stance's walk from its speed,
 * braking to rest there. A move beat as throughOf's (way 'aside'), or null where there is no such walk.
 */
export function stepAside(state, pid, a, to, ms = state.clock.ms) {
  const area = state.places?.live?.area, st = a?.moveStance === 'assault' ? 'assault' : 'combat';
  if (!a || !area || liveZoneAt(state, area, to[0], to[1])) return null;
  const p = routed(state, [[a.x, a.z], to], { area }).map(r => [q(r[0], 0.0001), q(r[1], 0.0001)]);
  if (p.length < 2 || !walkable(state, area, p) || !bodyClear(state, pid, p)) return null;
  const v = Math.sqrt((a.v?.[0] ?? 0) ** 2 + (a.v?.[1] ?? 0) ** 2), L = legsHere(state, pid, a.x, a.z);
  const P = profileOf(pathLen(p), Math.max(v, gaitsOf(state, pid, { gait: st }).walkMs), L.pushMs2, L.brakeMs2, { v0: v, v1: 0 });
  return { id: 'through', k: 'move', ch: 'feet', stance: st, path: p, prof: P, fromMs: ms, untilMs: ms + Math.round(P.T * 1000), way: 'aside' };
}
/** Whether a body is in a doorway (a no-stop zone) or being carried through one: where a step that would stand it still is not the drill's lead (the rework's R8b). */
export function inDoorway(state, pid) {
  const a = state.actors?.list?.find(x => x.who === pid), area = state.places?.live?.area;
  return !!a && ((!!a.through?.prof && (a.through.untilMs ?? 0) > state.clock.ms) || (!!area && !!liveZoneAt(state, area, a.x, a.z)));
}
/** The body's carry through a zone now: the one under way (actor.through), else the one its brake would call for at ms (throughOf), or null. */
export function throughNow(state, pid, a, ms = state.clock.ms) {
  if (a?.through?.prof && (a.through.untilMs ?? 0) > ms) return a.through;
  return throughOf(state, pid, a, ms);
}
// (a step that leaves the body at rest by the player's own choice (zones.js standsStill), or a body down on a knee)
function stillByChoice(state, pid, a) {
  const S = state.stop?.who === pid ? state.stop : null;
  return !!a.stance || !!S?.feet?.still || !!S?.doing?.still || standsStill(S?.doing?.step);
}
// (a move of the stop's own under way for the player: a shot row's feet, a bundle's or a flow's move)
function ownMove(state, pid) {
  const S = state.stop?.who === pid ? state.stop : null;
  if (!S) return false;
  const run = (d) => !!d?.beats?.some(b => b.st === 'run' && b.k === 'move' && b.prof);
  return (!!S.feet && !S.feet.done) || run(S.doing) || run(S.flow);
}
// (the player's carry: dropped for a move of the stop's own, a step that stands by choice, or the keys out of the mode;
// begun where the game would stop the feet inside a zone (see the header))
function throughCheck(state, pid, a, input) {
  const own = ownMove(state, pid);
  if (a.through) {
    const f = feetOf(state, input), keys = !state.stop && !pendingOf(state) && !!(f.mx || f.mz);
    if (own || stillByChoice(state, pid, a) || keys) delete a.through;
    return;
  }
  if (own || stillByChoice(state, pid, a)) return;
  // (the feet the game's: a step under way (stop motion), a window; else the keys', which carry on from motion only. A startle
  // freezes the feet where they are, never carried through a door to the point (the reach review of 2026-11-13, default
  // yes: the game walked a frozen man into the room, the opposite of the window a bang hands the defender); the freeze's
  // own cost, kept out of the doorway's fault (shoothouse.js))
  if (startled(state, pid, state.clock.ms)) return;
  const held = feetHeld(state) || !!pendingOf(state);
  if (!held) { const f = feetOf(state, input); if (f.mx || f.mz) return; }
  if (!a.v && !held) return;
  const t = throughOf(state, pid, a, state.clock.ms, { rest: held });
  if (t) a.through = t;
}
/**
 * Another person's carry through a no-stop zone this tick (the #2's free body, bundle.js runSlot): one begun where his brake
 * would leave him in a zone (unless he is down on a knee). Returns the carry (actor.through, a move beat: the caller places him
 * by its closed form, keeps his gap and drops it at its end), or null with none (his own brake then).
 */
export function throughTick(state, pid, a, ms = state.clock.ms) {
  if (!a) return null;
  if (!a.through && !a.stance) { const t = throughOf(state, pid, a, ms, { rest: true }); if (t) a.through = t; }
  return a.through ?? null;
}

/** Whether the keys move the player without turning them: a range session open and the rifle in the hands (see the header). */
export function lineStrafe(state) {
  const R = state.armoury?.range;
  if (!R || R.end) return false;
  const posture = state.people?.[playerId(state)]?.kit?.carry?.posture ?? 'slungFront';
  return posture !== 'slungFront' && posture !== 'slungBack';
}

/** The fast layer `player` (TECH §3.1, layer 2): the player's actor walks the live area's grid by the keys held. */
export function playerStep(state, input, bus, ctx) {
  doorsStep(state);                                                // (leaves that have swung open are free before anyone moves)
  const a = playerActor(state);
  if (!a) return;
  const area = state.places?.live?.area;
  if (!area) return;
  // (2026-11-13: the carry through a no-stop zone, dropped or begun before the move is read (see the header))
  throughCheck(state, playerId(state), a, input);
  // (0.0.12: a bundle's move beat under way puts the body where its closed form says (see the header); the carry through a zone is one)
  const mv = moveNow(state, playerId(state));
  if (mv) {
    let p = moveAt(mv, state.clock.ms);
    const x0 = a.x, z0 = a.z;
    // (a body of the scene's rule in the way (useBodies): the walk held where it stands a tick, its timing with it, as the
    // #2's own guard holds his (bundle.js gapHold); counted on the beat (held, ms) for the gauges)
    if (bodyBlocks(state, playerId(state), x0, z0, p.x, p.z)) {
      mv.fromMs += TICK_MS; mv.untilMs += TICK_MS;
      const d = state.stop?.doing;
      if (d?.beats?.includes(mv) && Number.isFinite(d.untilPlanMs)) d.untilPlanMs += TICK_MS;
      mv.held = (mv.held ?? 0) + TICK_MS; mv.heldAtMs = state.clock.ms;
      p = { ...moveAt(mv, state.clock.ms), x: x0, z: z0, vMs: 0 };
    }
    // (the head and the muzzle go where the drill's eyes are (a bundle's beat with eyes: the slot's corner), else along the path)
    const run = state.stop?.doing?.beats?.filter(b => b.st === 'run') ?? [], eyes = run.find(b => b.eyes)?.eyes ?? null, look = eyes ?? mv.look ?? null;
    // (a bundle's beat below rung 3 carries its muzzle onto a point it faces (`muzzleTo`, bundle.js: the corner going in, the far leg),
    // no held sector)
    const mt = eyes ? null : mv.muzzleTo ?? null;
    a.x = p.x; a.z = p.z; a.headRad = eyes ? q(Math.atan2(eyes[1] - p.z, eyes[0] - p.x), 1e-6) : mt ? q(Math.atan2(mt[1] - p.z, mt[0] - p.x), 1e-6) : mv.muzzle ?? p.headRad;
    a.face = faceOfHeadRad(look ? Math.atan2(look[1] - p.z, look[0] - p.x) : a.headRad);
    locoStep(a, x0, z0, { state, pid: playerId(state), gait: 'walk', stance: mv.stance ?? a.moveStance ?? null, vMs: p.vMs });
    a.locoMs = state.clock.ms;
    if (movedThisTick(a)) a.gait = 'walk';
    if (p.vMs > 0) a.v = [q(p.vMs * Math.cos(p.headRad), 0.001), q(p.vMs * Math.sin(p.headRad), 0.001)]; else delete a.v;
    if (p.done && mv === state.stop?.feet) mv.done = true;
    if (p.done && mv === a.through) delete a.through;
    return;
  }
  // (0.0.8: the feet as the contact's window lets them: the move held at the sighting for the body's go, then stopped (COMBAT §25.4.5))
  const feet = feetOf(state, input), mx = sgn(feet.mx), mz = sgn(feet.mz);
  // (the feet held: the keys only turn a standing player, and a berth or a stall is never settled out of:
  // a lying player's spot is inside the rack, where a walker may not stand)
  // (nor a rising one: the rise and the dressing keep their facing, never swung round mid-frame)
  const strafe = lineStrafe(state);
  if (feetHeld(state)) {
    if ((a.posture ?? 'stand') === 'stand' && !transPlaying(a, state.clock.ms) && !strafe) a.face = faceOf(mx, mz, a.face);
    a.gait = 'idle';
    // (a body moving in a stance when its feet are held (a step in stop motion with no feet of its own: an aim, a macro)
    // brakes to a stop, never stops dead (BODY §16.2; the rework's R2: from 2.03 m/s to 0 in a tick at a stoppage's IA))
    if (a.v && (a.moveStance === 'combat' || a.moveStance === 'assault')) {
      inertStep(state, a, { mx: 0, mz: 0 }, navOf(state, area, PLAYER_CLS, a.x, a.z), a.moveStance);
      finishStep(state, a, navOf(state, area, PLAYER_CLS, a.x, a.z), area, bus);
    }
    if (movedThisTick(a)) a.gait = 'walk';
    return;
  }
  const grid = navOf(state, area, PLAYER_CLS, a.x, a.z);
  settle(a, grid);                                                 // (a spot it may not stand on: put out at once, keys or none)
  if (!strafe) a.face = faceOf(mx, mz, a.face);
  // (0.0.12: in Combat or Assault, the stance's walk and the body's inertia (see the header))
  const stance = a.moveStance === 'combat' || a.moveStance === 'assault' ? a.moveStance : null;
  if (stance) {
    inertStep(state, a, feet, grid, stance);
    if (movedThisTick(a)) a.gait = 'walk';
    finishStep(state, a, grid, area, bus);
    return;
  }
  const gaits = gaitsOf(state, playerId(state)), gait = gaitOf(feet, gaits), speed = speedOf(feet, gaits);
  if (!speed) { a.gait = 'idle'; return; }
  const x0 = a.x, z0 = a.z;
  moveActor(a, mx, mz, speed, grid);
  if ((a.x !== x0 || a.z !== z0) && bodyBlocks(state, playerId(state), x0, z0, a.x, a.z)) { a.x = x0; a.z = z0; }
  const moved = locoStep(a, x0, z0, { state, pid: playerId(state), gait, stance: null, vMs: speed });
  if (grid.kind === 'ground') navAhead(state, area, PLAYER_CLS, a.x, a.z);
  const p = moved > 0 ? portalCrossed(state, a) : null;
  if (p) moveTo(state, a.id, p.to, bus, { portal: p });
}
