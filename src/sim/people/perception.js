// OLYMPUS people: perception's sight, the one visibility primitive the fog of awareness and every sighting read (PEOPLE §7.1, §7.2, §7.6).
//
// Adapted from tradecraft v0.2.0-rc3 `src/sim/perception.js` (265 lines): eyes() and openness() with
// their constants (CONE_DEG 100 plus CONE_PER_AWARENESS 2 a point of Awareness, at most CONE_MAX_DEG
// 170; an all-round radius AWARE_M 2.5 plus AWARE_PER 0.2 a point, with a 1.5 m soft edge; anyone
// within ALWAYS_M 1 m perceived; the reach SIGHT_M 10 + LIGHT_M 42 × the light at the spot looked at,
// with a 4 m soft edge; a cone with a 0.24 rad soft edge; SEEN 0.5 the rules' threshold). What changed
// (PEOPLE §7.6): tradecraft's rays against binned wall segments are replaced by clearLine over PLACES's
// sight grid, so the fog on the screen and the dice agree cell for cell ("what we see is what our
// character evaluates as being true", the user, tradecraft 2026-10-28); the glass, the felt (sense.js,
// 0.0.10) and the weather's cap (0.0.12) are not ported yet; the light is PLACES's lightLevel (TECH
// correction 14); the eye's height picks the grid's layer.
//
// eyeOf(state, actor) → { x, z, headRad, coneRad (half-angle), awareM, eyeLayer, asleep, areaId } (and
// the heading's unit vector and the cone's outer cosine, so a cell plainly outside it costs no atan2): the
// heading from the actor's face (right 0, down π/2, left π, up −π/2: x east, z south), Awareness
// PLAYER_AWARENESS 5 for the player (SKILLS's out-of-boot floor, until SKILLS) and MARINE_AWARENESS 5
// for everyone else (my call: marines read as marines); the eye's height is EYE_M by posture (stand
// 1.6, sit 1.0, lie 0.3: PLACES §2.4's eye heights) plus the actor's y, and its layer the highest of
// the grid's three it reaches (stand at 1.6 m, crouch at 1.0, prone below). A lying person but the
// player is asleep this round (they lie only in their racks after taps) and sees nothing (PEOPLE §7.2);
// the player sees from the berth unless their body sleeps (BODY's isAsleep: the 0.0.4 sheet §8, item 22).
// A berth is a blocker on the low layers (a rack's cells hold PRONE and CROUCH, its footlocker PRONE),
// so an eye lying in one would see only its own cell: a lying, awake player's eye looks out of the
// berth instead (lookOut, the integrator's call for 0.0.4: woken by the klaxon you lift your head and
// look past the rack's foot), moved along its facing through the run of cells that block its layer,
// from its own, onto the last of them (an end cell, which never blocks), at most BERTH_LOOK_M 2 m; a
// sitting one too (on the rack's edge). Within ALWAYS_M of the body's own spot, what a standing eye
// there has a clear line to is seen all the same, so your own berth, and you in it, are never in the
// fog (the review of v0.0.5's rack: with the eye out at the rack's foot, you could not see yourself sit
// up). The player's eye through a transition is the pose shown (people's poseAt), not the pose it ends
// in: lying in the berth (the berth's own eye) while lying, sitting up or lying back, sitting on the
// edge, else standing where the frame stands (the review of v0.0.5's rack: R's lying down closed the
// fog on the berth 0.4 s after the key while the figure still stood at the rack's foot, and T's rise
// opened the standing view while it sat up in the berth).
//
// clearLine(grid, ax, az, bx, bz, layer): the segment between the centres of the two points' cells,
// walked cell by cell in exact integer arithmetic (the cells it passes through, compared as
// (1 + 2k) × |dz| against (1 + 2m) × |dx|), so the walk from either end visits the same cells and
// clearLine(a, b) = clearLine(b, a) bit for bit. A cell blocks when its bits hold the layer's
// (PRONE 1, CROUCH 2, STAND 4); the two end cells never block (a wall's face lights when seen, a body
// in a rack is seen from the aisle: the 0.0.3 sheet §8, item 13). The grid's cells are 0.25 m, under
// the least clearance radius, so no walker's eye or body is in a wall's cell and the rule never sees
// through a wall (sight.js says why). Where the segment passes exactly
// through a lattice corner it is blocked only if both cells beside the corner block (no seeing through
// a diagonal crack; touching one blocking cell's corner is not blocked). Cells outside the grid block
// nothing: a floor's grid covers its walls, a ground's window holds the eye farther from its edge than
// anyone sees (sight.js SIGHT_EDGE_M, past SIGHT_M + LIGHT_M + REACH_SOFT_M 54 m).
//
// visibility(state, eye, x, z, ms) is the one primitive: openness (tradecraft's, unchanged: 1 within
// ALWAYS_M; the awareness radius's soft edge; else the cone's soft edge × the reach's, where the reach
// needs the light at (x, z) only between SIGHT_M − 2 and SIGHT_M + LIGHT_M + 2 m) × clearLine on the
// eye's area's grid, 0 to 1. sightOf(state, viewer, target) → { vis, seen }: the target's spot, a
// target behind its own drawn rack curtain seen only within ALWAYS_M; canSee its seen. sightMask(state,
// eye, mask) fills mask.vis (Float32Array, nx × nz) with visibility at each cell's centre (x0 +
// (i + 0.5) × cellM), by the same per-cell function, the grid and the eye's cell taken once: the fog
// draws this mask (VIEWS §2.11) and the poses read canSee, one function (the 0.0.3 sheet §2.2;
// people-sight proves the mask equals visibility at every cell).
//
// The adapted eye (0.0.5: the user's ask of 2026-11-06, "eye adapting to darkness making things less
// dark after a while in the dark compared to when entering dark from a lit place"). The reach reads
// the light as the eye takes it, BODY's eyes (src/sim/body/eyes.js eyeView: lightK, the same quantity
// the picture's exposure shows): the light at the spot counts as min(1, L × lightK), and the dark's
// floor SIGHT_M as SIGHT_M × min(1, lightK) (the eye's baseM), so an eye just in from a lit place sees
// only round it in a dark room and an eye adapted to the dark sees farther than v0.0.4's (lightK 1: any
// lit place at rest, and the dark five minutes in). In the squad bay at lights out: 3.3 m just in from
// the lit head, 5.6 m at a minute, 11.7 m at five, 14.9 m at twenty, 17.6 m fully adapted
// (eyes-sight prints them). The eye's lightK comes with eyeOf: the player's from their body's eyes
// record at the clock (on the tick a wake lands on, the record still shut until bodyFast anchors it
// again after the actors layer, the eyes as they open: the record's state on the open field, never a
// blind tick); anyone else's, or a player with no record yet, adapted at rest to the light they stand
// in (eyes.js eyesAdaptedTo). eyeViewOf(state, actor) hands the same view to the picture (the
// view's exposure on the post pass), so the screen and the dice read one number.
// fieldOf(state, eye, ms, shut) is the light those eyes receive, which the eyes follow: the mean
// luminance (eyes.js logCdOf, photopic, and scotopic by the light's sp: places' spectrumAt) over the
// eye's spot (weight FIELD_SELF_W 2) and FIELD_N 15 points in front of it, at FIELD_RINGS_M 1, 2.5 and
// 4.5 m and FIELD_ANGLES_RAD 0, ±0.3 and ±0.9 rad off the heading (the line straight ahead too, so a
// doorway in front of you counts: Head A lit through its open door), each counted only where the eye
// has a clear line to it and the point is not in a blocker (a point of a floor in no room, a porch past
// an outside door, is the open air, as places' lightLevel takes it), the open air's level held to the
// game minute (places' lightFrame): { yp, ys, sky }, the lids' share taken when shut (sky: whether the
// open air can decide any point, outdoors, in no room, or through a room's windows where daylight at its
// brightest would beat the room's fill under its lighting now: places' spectrumAt).
// Pure.
import { lightLevel, lightFrame, spectrumAt } from '../places/light.js';
import { sightGridOf } from '../places/sight.js';
import { isAsleep } from '../body/body.js';
import { eyeView, eyesAdaptedTo, eyesAt, viewOf, shutAt, fieldFrom, logCdOf } from '../body/eyes.js';
import { poseAt } from './place.js';
import { MIN_MS } from '../../core/clock.js';

export const CONE_DEG = 100, CONE_PER_AWARENESS = 2, CONE_MAX_DEG = 170;
export const AWARE_M = 2.5, AWARE_PER = 0.2, ALWAYS_M = 1;
export const SIGHT_M = 10, LIGHT_M = 42;
export const SEEN = 0.5;
/** The player's Awareness until SKILLS gives it (SKILLS's out-of-boot floor: the sheet's call). */
export const PLAYER_AWARENESS = 5;
/** Everyone else's this round (my call: a marine's floor, PEOPLE §1 "marines read as marines"). */
export const MARINE_AWARENESS = 5;
/** Eye heights above the actor's y by posture (PLACES §2.4: 1.6, 1.0, 0.3 m). */
export const EYE_M = Object.freeze({ stand: 1.6, sit: 1.0, lie: 0.3 });
/** The sight grid's layers (PLACES's sight.js bits) and the eye heights they stand for. */
export const LAYER_BIT = Object.freeze({ prone: 1, crouch: 2, stand: 4 });
export const LAYER_M = Object.freeze({ stand: 1.6, crouch: 1.0, prone: 0.3 });
/** The soft edges: the awareness radius's (1.5 m, its middle AWARE_SOFT_M past the radius), the reach's (4 m), the cone's (0.24 rad). */
export const AWARE_SOFT_M = 0.75, REACH_SOFT_M = 2, CONE_SOFT_RAD = 0.12;

const TAU = Math.PI * 2;
const HEADS = Object.freeze({ right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 });
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** An angle wrapped to [−π, π). */
export const wrap = (a) => ((a + Math.PI) % TAU + TAU) % TAU - Math.PI;
/** The heading of a sprite facing, radians (x east, z south). */
export const headOf = (face) => HEADS[face] ?? HEADS.down;
/** How far a lying player's eye looks out of the berth along its facing (see the header). */
export const BERTH_LOOK_M = 2;
/** The grid layer an eye at heightM reaches. */
export const layerAt = (heightM) => (heightM >= LAYER_M.stand ? 'stand' : heightM >= LAYER_M.crouch ? 'crouch' : 'prone');
/** The field the eyes receive (see the header): the eye's own spot's weight, the rings' radii and the angles off the heading. */
export const FIELD_SELF_W = 2, FIELD_RINGS_M = Object.freeze([1, 2.5, 4.5]), FIELD_ANGLES_RAD = Object.freeze([-0.9, -0.3, 0, 0.3, 0.9]);
export const FIELD_N = FIELD_RINGS_M.length * FIELD_ANGLES_RAD.length;

/** The firing line's band (0.0.7): LINE_AWARE_M either way along the line, LINE_DEPTH_M either side of it, LINE_SOFT_M its soft edge. */
export const LINE_AWARE_M = 12, LINE_DEPTH_M = 2.5, LINE_SOFT_M = 0.75;
// (the band a shooter on test-range's KD course takes in along the firing line: the neighbours prone 5 m either side are
// at the edge of the eye and in the ear (their reports, their brass), so the relay is drawn as it is, never as figures
// remembered from the walk (the integrator's call for 0.0.7, the stage's report: prone, the eye's 3.5 m and its cone
// downrange left the relay in the fog). Only on the kd course: test-handling's bay is the user's scored scene, as scored)
function lineBandOf(state, p) {
  const R = state?.armoury?.range;
  // (kept past the course's end to the card: the neighbours seen a moment before never turn to remembered figures on
  // the open line by day (the runtime review's of v0.0.7))
  if (!R || R.course !== 'kd') return null;
  const dr = R.downrangeRad ?? 0;
  return { x: p.x, z: p.z, ux: -Math.sin(dr), uz: Math.cos(dr), halfM: LINE_AWARE_M, depthM: LINE_DEPTH_M };
}

/** Someone's eyes (see the header). */
export function eyeOf(state, actor) {
  const isPlayer = !!actor && actor.id === state?.player?.actor, ms = state?.clock?.ms ?? 0;
  const aw = isPlayer ? PLAYER_AWARENESS : MARINE_AWARENESS;
  // (the player's eye through a transition is the pose shown, not its end: the fog never closes on the
  // berth while the figure still stands at the rack's foot, nor opens the standing view while it sits up)
  const p = isPlayer ? poseShown(actor, ms) : actor;
  const posture = p.posture ?? 'stand';
  const eyeM = (EYE_M[posture] ?? EYE_M.stand) + (p.y ?? 0);
  const headRad = headOf(p.face), coneRad = Math.min(CONE_MAX_DEG, CONE_DEG + CONE_PER_AWARENESS * aw) * Math.PI / 360;
  const outer = coneRad + CONE_SOFT_RAD + 1e-6;
  const eye = {
    x: p.x, z: p.z, headRad, coneRad,
    awareM: AWARE_M + AWARE_PER * aw, eyeLayer: layerAt(eyeM), asleep: isPlayer ? isAsleep(state, actor.who, state.clock?.ms) : posture === 'lie',
    areaId: state?.places?.live?.area ?? null,
    // (the heading's unit vector and the cosine past which nothing is in the cone's soft edge: a quick test before the angle)
    hx: Math.cos(headRad), hz: Math.sin(headRad), outerCos: outer >= Math.PI ? -2 : Math.cos(outer),
  };
  if (isPlayer && (posture === 'lie' || posture === 'sit') && !eye.asleep) lookOut(state, eye);
  // (0.0.7: on the KD's firing line the line is known: see lineBandOf)
  if (isPlayer && !eye.asleep) { const band = lineBandOf(state, p); if (band) eye.band = band; }
  // (the light as these eyes take it: eyeViewOf's, the picture's own number)
  const view = eye.asleep ? null : viewFor(state, actor, eye, isPlayer, ms);
  eye.lightK = view && !view.nv ? view.lightK : 1;
  eye.baseM = SIGHT_M * Math.min(1, eye.lightK);
  return eye;
}

// (where an actor's eyes are at ms: the pose a transition shows while one plays (people's poseAt: a
// lie, sitUp or lieDown frame lying in the berth, a sit frame sitting, any other standing, at its x, z
// and y), else the actor's own)
function poseShown(actor, ms) {
  const t = actor.trans;
  if (!t || ms >= t.fromMs + t.ms) return actor;
  const f = poseAt(actor, ms);
  // (in the berth, lying, sitting up or lying back: the berth's own lying eye, a rise's from or a lying down's end)
  if (f.posture === 'lie') return t.kind === 'rise' && t.from ? t.from : actor;
  return { posture: f.posture, x: f.x, z: f.z, y: f.y, face: f.face };
}

// (an eye's view: the player's record at ms, else adapted at rest to the field it stands in. A record
// still shut while the eyes are open is behind the clock by the tick a wake lands on (the sleep ends in
// the due layer, the record is anchored again in bodyFast, after the actors layer): the eyes as they
// open, the record's state at ms on the open field, what that anchor will hold, never a blind tick)
function viewFor(state, actor, eye, isPlayer, ms) {
  const body = state?.people?.[actor.who]?.body, rec = body?.eyes;
  if (!(isPlayer && rec && Number.isFinite(rec.atMs))) return eyesAdaptedTo(fieldOf(state, eye, ms, false));
  if (rec.shut && !shutAt(body.sleep ?? null, ms)) return viewOf(eyesAt(rec, ms), fieldOf(state, eye, ms, false), { nv: !!rec.nv });
  return eyeView(rec, ms);
}

/**
 * What someone's eyes make of the light now (BODY's eyes, src/sim/body/eyes.js eyeView: { a, gain,
 * coneGain, lightK, rod, glare, shut, nv }): the one helper the picture's exposure and this module's reach both
 * read (eyeOf's lightK is its lightK). Shut eyes (asleep): { shut: true, gain 1, rod 0 }.
 */
export function eyeViewOf(state, actor, ms = state?.clock?.ms ?? 0) {
  if (!actor) return null;
  const isPlayer = actor.id === state?.player?.actor, posture = actor.posture ?? 'stand';
  const asleep = isPlayer ? isAsleep(state, actor.who, ms) : posture === 'lie';
  if (asleep) return { a: null, gain: 1, coneGain: 1, lightK: 0, rod: 0, glare: 0, shut: true, nv: false };
  return viewFor(state, actor, eyeOf(state, actor), isPlayer, ms);
}

/** The light the eyes receive at ms (see the header): { yp, ys (log10 cd/m² at the retina), sky }. */
export function fieldOf(state, eye, ms = state?.clock?.ms ?? 0, shut = false) {
  const F = eye.areaId ? lightFrame(state, eye.areaId, ms, Math.floor(ms / MIN_MS) * MIN_MS) : null;
  if (!F) return { ...fieldFrom(100, 150, shut), sky: false };
  const grid = gridFor(state, eye), bit = LAYER_BIT[eye.eyeLayer] ?? LAYER_BIT.stand;
  let sumP = 0, sumS = 0, w = 0, sky = false;
  const add = (x, z, k) => {
    const s = spectrumAt(F, x, z), y = 10 ** logCdOf(s.level);
    sumP += k * y; sumS += k * y * s.sp; w += k;
    if (s.sky) sky = true;                                          // (the open air can decide this point: no room, or windows that beat the fill)
  };
  add(eye.x, eye.z, FIELD_SELF_W);
  for (const r of FIELD_RINGS_M) for (const da of FIELD_ANGLES_RAD) {
    const h = eye.headRad + da, x = eye.x + Math.cos(h) * r, z = eye.z + Math.sin(h) * r;
    if (grid) {
      const C = grid.cellM, i = Math.floor((x - grid.x0) / C), j = Math.floor((z - grid.z0) / C);
      if (i >= 0 && j >= 0 && i < grid.nx && j < grid.nz && (grid.bits[j * grid.nx + i] & bit) !== 0) continue;   // (in a wall or a blocker)
      if (!clearLine(grid, eye.x, eye.z, x, z, bit)) continue;
    }
    add(x, z, 1);
  }
  return { ...fieldFrom(w ? sumP / w : 0, w ? sumS / w : 0, shut), sky };
}

// (a lying player's eye out of the berth: along the facing through the cells that block its layer, onto the last; see the header)
function lookOut(state, eye) {
  const grid = gridFor(state, eye);
  if (!grid) return;
  const C = grid.cellM, bit = LAYER_BIT[eye.eyeLayer];
  const cell = (x, z) => { const i = Math.floor((x - grid.x0) / C), j = Math.floor((z - grid.z0) / C); return i >= 0 && j >= 0 && i < grid.nx && j < grid.nz ? j * grid.nx + i : -1; };
  const c0 = cell(eye.x, eye.z);
  if (c0 < 0 || (grid.bits[c0] & bit) === 0) return;               // (an eye not in a blocker sees from where it is)
  eye.bx = eye.x; eye.bz = eye.z;                                   // (the body's own spot: its berth stays in sight, visAt)
  let x = eye.x, z = eye.z;
  for (let d = C; d <= BERTH_LOOK_M + 1e-9; d += C) {
    const nx = eye.x + eye.hx * d, nz = eye.z + eye.hz * d, c = cell(nx, nz);
    if (c < 0 || (grid.bits[c] & bit) === 0) break;
    x = nx; z = nz;
  }
  eye.x = Math.round(x * 1e4) / 1e4; eye.z = Math.round(z * 1e4) / 1e4;
}

// ---- the line ----

/**
 * Whether the segment between the centres of the cells holding (ax, az) and (bx, bz) is clear for an
 * eye on layer ('stand' | 'crouch' | 'prone', or its bit): see the header.
 */
export function clearLine(grid, ax, az, bx, bz, layer = 'stand') {
  const bit = typeof layer === 'number' ? layer : LAYER_BIT[layer] ?? LAYER_BIT.stand;
  const C = grid.cellM, nx = grid.nx, nz = grid.nz, bits = grid.bits;
  let i = Math.floor((ax - grid.x0) / C), j = Math.floor((az - grid.z0) / C);
  const i1 = Math.floor((bx - grid.x0) / C), j1 = Math.floor((bz - grid.z0) / C);
  return walk(bits, nx, nz, bit, i, j, i1, j1);
}

// (the cells between two cells' centres, exactly: see the header; true when none blocks. ex and ez are
// (1 + 2k) × |dz| and (1 + 2m) × |dx|, kept by adding; the walk stays inside the two cells' bounding
// box, so when both lie in the grid no cell needs a bounds check)
function walk(bits, nx, nz, bit, i, j, i1, j1) {
  const di = i1 - i, dj = j1 - j, sx = di > 0 ? 1 : -1, sz = dj > 0 ? 1 : -1;
  const ax = di < 0 ? -di : di, az = dj < 0 ? -dj : dj, dex = 2 * az, dez = 2 * ax, step = sz * nx;
  if (i < 0 || j < 0 || i >= nx || j >= nz || i1 < 0 || j1 < 0 || i1 >= nx || j1 >= nz) return walkChecked(bits, nx, nz, bit, i, j, ax, az, sx, sz);
  let k = 0, m = 0, ex = az, ez = ax, idx = j * nx + i;
  while (k < ax || m < az) {
    if (k < ax && (m >= az || ex < ez)) { idx += sx; k++; ex += dex; }
    else if (m < az && (k >= ax || ez < ex)) { idx += step; m++; ez += dez; }
    else {                                                          // (exactly through a corner: the two cells beside it)
      if ((bits[idx + sx] & bit) !== 0 && (bits[idx + step] & bit) !== 0) return false;
      idx += sx + step; k++; m++; ex += dex; ez += dez;
    }
    if (k === ax && m === az) return true;                          // (the far end cell never blocks)
    if ((bits[idx] & bit) !== 0) return false;
  }
  return true;
}
// (the same walk where an end lies outside the grid: cells outside it block nothing)
function walkChecked(bits, nx, nz, bit, i, j, ax, az, sx, sz) {
  let k = 0, m = 0;
  while (k < ax || m < az) {
    if (k < ax && (m >= az || (1 + 2 * k) * az < (1 + 2 * m) * ax)) { i += sx; k++; }
    else if (m < az && (k >= ax || (1 + 2 * m) * ax < (1 + 2 * k) * az)) { j += sz; m++; }
    else {
      if (blocksAt(bits, nx, nz, bit, i + sx, j) && blocksAt(bits, nx, nz, bit, i, j + sz)) return false;
      i += sx; j += sz; k++; m++;
    }
    if (k === ax && m === az) return true;
    if (blocksAt(bits, nx, nz, bit, i, j)) return false;
  }
  return true;
}
const blocksAt = (bits, nx, nz, bit, i, j) => i >= 0 && j >= 0 && i < nx && j < nz && (bits[j * nx + i] & bit) !== 0;

// ---- visibility ----

// (the one per-cell function, visibility()'s and sightMask()'s alike: the grid given, the eye's cell given)
function visAt(state, eye, grid, ei, ej, bit, x, z, ms) {
  // (an eye looking out of a berth: within ALWAYS_M of the body's own spot, what a standing eye there has
  // a clear line to is seen, so your own berth and you in it are never in the fog)
  if (eye.bx !== undefined && grid) {
    const bx = x - eye.bx, bz = z - eye.bz, C = grid.cellM;
    if (bx * bx + bz * bz < ALWAYS_M * ALWAYS_M
      && walk(grid.bits, grid.nx, grid.nz, LAYER_BIT.stand, Math.floor((eye.bx - grid.x0) / C), Math.floor((eye.bz - grid.z0) / C), Math.floor((x - grid.x0) / C), Math.floor((z - grid.z0) / C))) return 1;
  }
  const dx = x - eye.x, dz = z - eye.z, d = Math.sqrt(dx * dx + dz * dz);
  let open, far = -1, c = 0;
  if (d < ALWAYS_M) open = 1;
  else {
    let v = clamp01((eye.awareM + AWARE_SOFT_M - d) / (2 * AWARE_SOFT_M));
    if (eye.band && v < 1) {
      // (the firing line's band (lineBandOf): along the line and a little either side of it)
      const B = eye.band, along = Math.abs((x - B.x) * B.ux + (z - B.z) * B.uz), across = Math.abs((x - B.x) * B.uz - (z - B.z) * B.ux);
      const bv = clamp01((B.halfM + LINE_SOFT_M - along) / (2 * LINE_SOFT_M)) * clamp01((B.depthM + LINE_SOFT_M - across) / (2 * LINE_SOFT_M));
      if (bv > v) v = bv;
    }
    if (v >= 1) open = 1;
    else {
      // (outside the cone's soft edge by the dot product, a hair inside its true angle: no atan2 needed, c is 0)
      const outside = eye.outerCos !== undefined && dx * eye.hx + dz * eye.hz < d * eye.outerCos;
      let off = 0;
      if (!outside) { off = Math.atan2(dz, dx) - eye.headRad; if (off > Math.PI) off -= TAU; else if (off < -Math.PI) off += TAU; }   // (both in [−π, π]: one turn at most)
      c = outside ? 0 : clamp01((eye.coneRad + CONE_SOFT_RAD - Math.abs(off)) / (2 * CONE_SOFT_RAD));
      if (c <= v) open = v;                                         // (far ≤ 1, so the cone can add nothing: tradecraft's far <= v)
      else if (d <= (eye.baseM ?? SIGHT_M) - REACH_SOFT_M) open = c;   // (the reach is at least the dark's floor: full, whatever the light)
      else if (d >= SIGHT_M + LIGHT_M + REACH_SOFT_M) open = v;    // (beyond any reach)
      else { open = v; far = 0; }                                   // (the light decides: after the line, which may make it moot)
    }
  }
  if (open <= 0 && far < 0) return 0;
  if (grid) {
    const C = grid.cellM, ti = Math.floor((x - grid.x0) / C), tj = Math.floor((z - grid.z0) / C);
    if (!walk(grid.bits, grid.nx, grid.nz, bit, ei, ej, ti, tj)) return 0;
  }
  if (far === 0) {
    const L = lightLevel(state, x, z, ms, eye.areaId), Le = L * (eye.lightK ?? 1);
    far = clamp01(((eye.baseM ?? SIGHT_M) + LIGHT_M * (Le < 1 ? Le : 1) + REACH_SOFT_M - d) / (2 * REACH_SOFT_M));
    const fc = far * c;
    if (fc > open) open = fc;
  }
  return open;
}

/** The sight grid an eye looks over (PLACES's), or null when its area has none. */
const gridFor = (state, eye) => (eye.areaId ? sightGridOf(state, eye.areaId, eye.x, eye.z) : null);

/** How well eye takes in (x, z), 0 to 1, at game time ms: openness × clearLine (see the header). */
export function visibility(state, eye, x, z, ms = state.clock.ms) {
  if (eye.asleep) return 0;
  const grid = gridFor(state, eye);
  const ei = grid ? Math.floor((eye.x - grid.x0) / grid.cellM) : 0, ej = grid ? Math.floor((eye.z - grid.z0) / grid.cellM) : 0;
  return visAt(state, eye, grid, ei, ej, LAYER_BIT[eye.eyeLayer], x, z, ms);
}

/** What a viewer actor makes of a target actor: { vis, seen } (a target behind its own drawn curtain only within ALWAYS_M). */
export function sightOf(state, viewer, target, ms = state.clock.ms) {
  if (!viewer || !target) return { vis: 0, seen: false };
  if (target.curtain && Math.hypot(target.x - viewer.x, target.z - viewer.z) >= ALWAYS_M) return { vis: 0, seen: false };
  const vis = visibility(state, eyeOf(state, viewer), target.x, target.z, ms);
  return { vis, seen: vis >= SEEN };
}

/** Whether a viewer actor sees a target actor (sightOf's seen). */
export const canSee = (state, viewer, target, ms = state.clock.ms) => sightOf(state, viewer, target, ms).seen;

/**
 * Fill mask.vis (a Float32Array of nx × nz) with visibility() at each cell's centre, x0 + (i + 0.5) ×
 * cellM by z0 + (j + 0.5) × cellM: exactly what visibility gives there (see the header). Returns mask.
 */
export function sightMask(state, eye, mask) {
  const { x0, z0, nx, nz, cellM } = mask;
  const vis = mask.vis ?? (mask.vis = new Float32Array(nx * nz));
  if (eye.asleep) { vis.fill(0); return mask; }
  const ms = state.clock.ms, grid = gridFor(state, eye), bit = LAYER_BIT[eye.eyeLayer];
  const ei = grid ? Math.floor((eye.x - grid.x0) / grid.cellM) : 0, ej = grid ? Math.floor((eye.z - grid.z0) / grid.cellM) : 0;
  // (beyond the farthest any cell can be open, nothing to compute)
  const maxM = Math.max(eye.awareM + AWARE_SOFT_M, SIGHT_M + LIGHT_M + REACH_SOFT_M) + 0.01, max2 = maxM * maxM;
  for (let j = 0; j < nz; j++) {
    const z = z0 + (j + 0.5) * cellM, dz = z - eye.z, row = j * nx;
    for (let i = 0; i < nx; i++) {
      const x = x0 + (i + 0.5) * cellM, dx = x - eye.x;
      vis[row + i] = dx * dx + dz * dz >= max2 ? 0 : visAt(state, eye, grid, ei, ej, bit, x, z, ms);
    }
  }
  return mask;
}
