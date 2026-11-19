// OLYMPUS render: a body or a board off the deck, drawn on the face it stands on or at the height it floats (the build sheet v0.0.25 items 7 and 8, §3.4; PC§3.2 to PC§3.4; VIEWS §2.1, §3.5).
//
// The camera looks north and down at 45°: a point at height y over plan spot (x, z) shows where the ground at z − y does (VIEWS
// §2.1), so a body off the deck is drawn at its true height over its plan point, by the projection, as v0.0.24 draws a floating
// body. This module is the stage's one reading of it, pure (no three.js: node's tests read it whole), for render/view.js (the
// figures), render/figures.js (the card's turn) and render/range.js (the boards):
//   heightLookOf(yM)   float-look's pick (F-b, the default until scored) for every body off the deck, planted or floating: one scale
//                      step FLOAT_SCALE_K nearer the camera past FLOAT_SCALE_FROM_M of lift, the blob left on the deck below, smaller
//                      and fainter the higher (figures.js's rule: 1 / (1 + 0.6 h), opacity 0.4 down to 0.15). yM is the lift over a
//                      standing man's place (liftOf: max(0, actor.floatY − FREEFALL.FLOAT_Y_M), v0.0.24's centre of mass; never
//                      `actor.y`, the floor a body stands on, which the view read before: integrate.md §8, so a floater at FLOAT_Y_M
//                      is drawn at the deck's height as every shipped one is), the one value for a planted and a floating body;
//   faceTurnFrame      the tumble's 45° frame between two faces' turns while a body changes face (the drill's 'onface' beat: its
//                      release, its tuck and turn, its lock, FACE_TURN_SHARES of the whole), so a quarter or a half turn never pops;
//   cardTurn           where a card turned by its face (art/figures/poses.js faceCard: src/data/faces.js STAGE_TURNS, samples/wreck-
//                      faces' own table: flipped top to bottom on the deckhead and the dorsal bulkhead, a quarter turn on a side one)
//                      stands: about its anchor (the cell's pixel over the sim's spot), whole pixels, raised so its lowest row stays
//                      over the deck, the plane brought nearer the camera by as much, so the anchor still lands where the spot at its
//                      height shows (figures.js's own rule; the figures flip a card in its atlas rectangle instead, so its quad
//                      keeps its winding and is never culled as a back face: cardTurn's flip is the same map, for the boards' sums);
//   turnPixels         a board's pixels (range-items.js turnerPixels' or popupPixels') turned by its face about its centre, a pixel
//                      corner, so every pixel stays on the grid;
//   wallHOf            the standing walls' height an area's picture holds: its rooms' ceiling under the area's look.wallsToCeiling (the
//                      Wreck's 2.2 m, sim/places/plan.js wallsOf's rule), else WALL_H_M (every shipped area, to the byte).
// The overhead's cue (OVERHEAD_LOOK, samples/wreck-faces K, K-b until scored): a thing on the deckhead draws its footprint dashed on
// the deck below it (a body's blob a dashed ring, figures.js; a board's its stand's, range.js; the fixed fittings' in the deck's
// batch, cutaway.js). Absent a face (actor.onFace, a stand's onFace: every shipped body and board) nothing here turns anything.
// Pure.
import { FREEFALL, VOID } from '../data/body/needs.js';
import { quarterOf } from '../data/faces.js';
import { tumbleFrame } from '../art/figures/poses.js';
import { WALL_H_M } from '../sim/places/plan.js';

/** A floating body higher than this over a standing man's place is drawn one scale step nearer the camera (m, × FLOAT_SCALE_K: samples/float-look F-b's SCALE_FROM_M, SCALE_STEP_K; v0.0.24's, moved here from view.js). */
export const FLOAT_SCALE_FROM_M = 0.5, FLOAT_SCALE_K = 1.25;
/** The overhead's cue drawn (samples/wreck-faces K: K-a the projection alone, K-b and the footprint dashed on the deck below, the default until scored). */
export const OVERHEAD_LOOK = 'K-b';
/** A face change's length (ms) and the shares of it its release ends at and its lock begins at: needs.js VOID.FACE_MS's (release 300, tuck and turn 800, lock 400: BODY §16.6), read, no number of its own. */
export const FACE_CHANGE_MS = VOID.FACE_MS.release + VOID.FACE_MS.turn + VOID.FACE_MS.lock;
export const FACE_TURN_SHARES = Object.freeze([VOID.FACE_MS.release / FACE_CHANGE_MS, (VOID.FACE_MS.release + VOID.FACE_MS.turn) / FACE_CHANGE_MS]);

/** How a body yM over a standing man's place is drawn (see the header): { scaleK, blob: { liftM, k, alpha } }. */
export function heightLookOf(yM) {
  const y = Math.max(0, Number(yM) || 0);
  return { scaleK: y > FLOAT_SCALE_FROM_M ? FLOAT_SCALE_K : 1, blob: { liftM: y, k: 1 / (1 + 0.6 * y), alpha: Math.max(0.15, 0.4 - 0.083 * y) } };
}
/** A body's lift over a standing man's place, from its free fall's height (actor.floatY, the centre of mass; absent: on the deck), metres. */
export const liftOf = (a) => (Number.isFinite(a?.floatY) ? Math.max(0, a.floatY - FREEFALL.FLOAT_Y_M) : 0);
/** The face a body stands on (actor.onFace, absent the deck: sim/body/footing.js onFaceOf's rule). */
export const onFaceOfActor = (a) => a?.onFace ?? 'deck';
/** The standing walls' height an area's picture holds (see the header), metres. */
export const wallHOf = (area) => (area?.look?.wallsToCeiling ? Math.max(0, ...(area.rooms ?? []).map(r => r.ceilingM ?? WALL_H_M)) || WALL_H_M : WALL_H_M);

/**
 * The tumble frame of a face change { from, to, k } (k its share, 0 to 1): one 45° step off the face left over the release, one short
 * of the face met over the lock, the steps between over the tuck and turn, the short way round; null when the two faces' turns are one.
 */
export function faceTurnFrame(T) {
  if (!T) return null;
  const a0 = quarterOf(T.from) * 2;
  let d = ((quarterOf(T.to) * 2 - a0) % 8 + 8) % 8;
  if (d > 4) d -= 8;
  if (!d) return null;
  const dir = Math.sign(d), n = Math.abs(d), [r0, r1] = FACE_TURN_SHARES, k = Math.max(0, Math.min(1, Number(T.k) || 0));
  const step = k < r0 ? 1 : k >= r1 ? n - 1 : 1 + Math.floor((k - r0) / (r1 - r0) * (n - 1));
  return tumbleFrame((a0 + dir * Math.max(1, Math.min(n - 1, step))) * Math.PI / 4);
}

/**
 * A card turned by quarter turns counter-clockwise on the picture (see the header), as numbers: { a, b, c, d, tx, ty, tz } the
 * affine map from the unit quad (u, v in 0..1, v up) to the world's (x, y) in the plane z = tz: x = a·u + b·v + tx, y = c·u + d·v + ty.
 * cw, ch the card's whole pixels; ax, ay its anchor's pixel corner from the card's left and from its foot (the rows below it); at
 * { x, y, z } the anchor's world spot (y its height); ppm the density. The anchor lands on a pixel corner; the card is raised so its
 * lowest row is over the deck, its plane brought as much nearer the camera, so the anchor shows where the spot at its height does.
 */
export function cardTurn({ cw, ch, ax, ay, quarter = 0, flip = false, at, ppm }) {
  const q = ((quarter % 4) + 4) % 4, f = flip ? -1 : 1, snap = (v) => Math.round(v * ppm) / ppm;
  const W = cw / ppm, H = ch / ppm, AX = ax / ppm, AY = ay / ppm;
  // (flipped top to bottom about the anchor's row first, then turned: the map's columns)
  const cos = [1, 0, -1, 0][q], sin = [0, 1, 0, -1][q], L = [cos, -sin * f, sin, cos * f];
  // (the four corners about the anchor, turned: the lowest one's height decides the lift over the deck)
  let lo = Infinity;
  for (const [u, v] of [[0, 0], [W, 0], [0, H], [W, H]]) lo = Math.min(lo, L[2] * (u - AX) + L[3] * (v - AY));
  const y0 = snap(at.y), yA = Math.max(y0, snap(-lo)), X = snap(at.x), Z = snap(at.z - y0 + yA);
  // (unit quad (u, v) → scaled (u·W, v·H) → about the anchor → flipped and turned → at the anchor's world spot)
  return { a: L[0] * W, b: L[1] * H, c: L[2] * W, d: L[3] * H, tx: X - (L[0] * AX + L[1] * AY), ty: yA - (L[2] * AX + L[3] * AY), tz: Z, yA, quarter: q, flip: !!flip };
}

/**
 * A board's pixels ([{ x, y, z, … }], world metres) flipped top to bottom (flip) then turned by quarter turns counter-clockwise on
 * the picture about (cx, cy) in its plane, a pixel corner (see the header); its depth kept. lift(p): a pixel's lift toward the camera (a face's 0.2 m, a hole's 0.24:
 * range-items.js TURNER_LIFT_M, TURNER_HOLE_LIFT_M, up and nearer alike), taken off before the turn and put back after, so a hole
 * stays on its spot of the turned face. A new list; the list itself at quarter 0.
 */
export function turnPixels(list, cx, cy, quarter, lift = null, flip = false) {
  const q = ((quarter % 4) + 4) % 4, f = flip ? -1 : 1;
  if (!q && !flip) return list;
  const cos = [1, 0, -1, 0][q], sin = [0, 1, 0, -1][q];
  return list.map(p => { const l = lift ? lift(p) : 0, dx = p.x - cx, dy = (p.y - l - cy) * f; return { ...p, x: cx + cos * dx - sin * dy, y: cy + sin * dx + cos * dy + l }; });
}
