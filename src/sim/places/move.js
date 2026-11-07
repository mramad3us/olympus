// OLYMPUS places: the player's walk on the live area's grid, at the body's gaits (the fast layer `player`).
//
// A speed by the keys held, the step taken on the live area's nav grid for the player's clearance
// class, and the actor's facing, gait and stride kept for the view. The speeds are BODY's gait helper
// (src/sim/body/motion.js gaitSpeeds, BODY §16.1 and §16.3, rounded to 0.01 m/s; the build sheet 0.0.4
// §8 item 11), read for the player each tick (gaitsOf: the felt g, the load, stamina, and the needs
// that forbid a run); WALK_MS 1.14 m/s, RUN_MS 2.69 and STROLL_MS 0.75 stay exported as its Mars row,
// unloaded and rested (MARS_GAITS), which the bots and the walk tests read. Shift runs, while the body
// can run (a blown marine walks), and wins over Alt, which strolls; with no direction the speed is 0.
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
// 90°, a fault; a tap of Q turned it 180° and stopped the line at once); slung, the keys turn as anywhere. Gait is 'idle' when nothing moved, else 'run', 'stroll' or 'walk', and
// strideM counts the metres walked modulo STRIDE_WRAP_M 201.6 m (src/data/body/gait.js, the view's
// number too), which the walk's, the run's and the bound's four-step cycles (0.64, 1.8 and 2.8 m) all
// divide (my calls), so the view picks the frame from strideM and a wrap never jumps a frame. The
// player layer sets $px and $pz (where the actor was at the tick's start, runtime only) first, for the
// view's interpolation.
//
// 0.0.3 (the build sheet 0.0.3 §2.1): the layer first frees the door leaves that have swung open
// (doors.js doorsStep), walks the grid nav.js gives for the actor's point (a floor's, or a ground's
// window round it, NAV_EDGE_M from its edge), builds at most NAV_CHUNKS_TICK of a ground's chunks
// ahead after the move, and then asks portals.js whether the actor crossed a portal, moving it into
// the next area if it did (moveTo: the facts, the autosave, the cut that is main.js's).
import { TICK_MS } from '../../core/clock.js';
import { q } from '../../core/num.js';
import { navOf, navAhead, nearestFree, nearestFreeInReach, centreOf, cellOf } from './nav.js';
import { standOk, sweep, onFloor } from './collide.js';
import { doorsStep } from './doors.js';
import { portalCrossed, moveTo } from './portals.js';
import { playerActor, playerId } from '../../core/ids.js';
import { STRIDE_WRAP_M } from '../../data/body/gait.js';
import { MARS_GAITS, gaitsOf } from '../body/motion.js';
import { feetHeld, transPlaying } from '../time/doing.js';

/** The Mars gaits, unloaded and rested (BODY §16.1 by motion.js gaitSpeeds: 1.14, 2.69, 0.75 m/s). */
export const WALK_MS = MARS_GAITS.walkMs, RUN_MS = MARS_GAITS.runMs, STROLL_MS = MARS_GAITS.strollMs;
/** The player's clearance class (PLACES §2.1: C0, PT kit or uniform, until kit sets it). */
export const PLAYER_CLS = 'C0';
export const POS_STEP_M = 0.0001;
export { STRIDE_WRAP_M };
/** The door assist: how far either way along the other axis a cut-short step looks for a way through, and in what steps (metres). */
export const NUDGE_M = 0.3, NUDGE_STEP_M = 0.01;

const sgn = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);
const K = Math.round(1 / POS_STEP_M);
// (a position rounded to POS_STEP_M back toward where it came from: never past the contact a sweep found)
const toward = (from, v) => (v >= from ? Math.floor(v * K + 1e-7) / K : Math.ceil(v * K - 1e-7) / K);
const at = (actor, axis) => (axis === 'x' ? actor.x : actor.z);
const okAt = (grid, actor, axis, v) => (axis === 'x' ? standOk(grid, v, actor.z) : standOk(grid, actor.x, v));

/** The gait the keys ask for, as the body allows: 'run' (Shift, while it can run), 'stroll' (Alt), 'walk', or 'idle' with no direction. */
export function gaitOf(input, gaits = MARS_GAITS) {
  if (!input || (!sgn(input.mx) && !sgn(input.mz))) return 'idle';
  return input.run && gaits.runOk ? 'run' : input.stroll && !input.run ? 'stroll' : 'walk';
}
/** The speed the keys ask for, m/s: 0 with no direction; Shift (run) wins over Alt (stroll). */
export function speedOf(input, gaits = MARS_GAITS) {
  const g = gaitOf(input, gaits);
  return g === 'idle' ? 0 : g === 'run' ? gaits.runMs : g === 'stroll' ? gaits.strollMs : gaits.walkMs;
}

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
  a.$px = a.x; a.$pz = a.z;
  const area = state.places?.live?.area;
  if (!area) return;
  const mx = sgn(input?.mx), mz = sgn(input?.mz);
  // (the feet held: the keys only turn a standing player, and a berth or a stall is never settled out of:
  // a lying player's spot is inside the rack, where a walker may not stand)
  // (nor a rising one: the rise and the dressing keep their facing, never swung round mid-frame)
  const strafe = lineStrafe(state);
  if (feetHeld(state)) { if ((a.posture ?? 'stand') === 'stand' && !transPlaying(a, state.clock.ms) && !strafe) a.face = faceOf(mx, mz, a.face); a.gait = 'idle'; return; }
  const grid = navOf(state, area, PLAYER_CLS, a.x, a.z);
  settle(a, grid);                                                 // (a spot it may not stand on: put out at once, keys or none)
  if (!strafe) a.face = faceOf(mx, mz, a.face);
  const gaits = gaitsOf(state, playerId(state)), gait = gaitOf(input, gaits), speed = speedOf(input, gaits);
  if (!speed) { a.gait = 'idle'; return; }
  const moved = moveActor(a, mx, mz, speed, grid);
  a.gait = moved > 0 ? gait : 'idle';
  if (moved > 0) a.strideM = q(((a.strideM ?? 0) + moved) % STRIDE_WRAP_M, POS_STEP_M);
  if (grid.kind === 'ground') navAhead(state, area, PLAYER_CLS, a.x, a.z);
  const p = moved > 0 ? portalCrossed(state, a) : null;
  if (p) moveTo(state, a.id, p.to, bus, { portal: p });
}
