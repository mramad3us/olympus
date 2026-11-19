// OLYMPUS sample: Well A's deck and its holds, the two new places' floor (pure; main.js shows the pictures). v0.0.24's stage 0 (its
// build sheet §0 item 27, §13 question 13).
//
// The void range at Phobos (Well A, "Anchor before you fire") and Testudo's berthing compartment ("Secure for burn") are floored in
// steel plate a mag boot holds on (PLACES §2.7's `plateGrid`), with holds for the hands on a grid rule (AW§4.1 item 2: a hold every
// GRID_M 1.5 m along a face, a pad-eye in the deck every PAD_EYE_M 3 m, for a lanyard's clip), and no sample showed them. Each
// picture is a patch of deck DECK_M wide and deep at 16 px/m, the bulkhead along its top with its holds, the pad-eyes in the deck,
// the game's own marine standing in it for scale (the shoot house's, the black combat EVA suit), and the corner by the bulkhead
// three times larger beside it. The plate is the game's deck plate (src/art/materials/surfaces.js deckPlate: its colour, seams and
// bolts) in panels of GRID_M, without the painter's tie-down rings (a ring that is not one of the grid's holds would read as one),
// every colour snapped to the stage's Mars palette as the stage snaps it:
//   ?p=P-a  plain plate, its weld seams (the default until scored);
//   ?p=P-b  the same plate with the hold grid painted on it in a worn safety yellow, a line every GRID_M through the pad-eyes;
//   ?h=H-a  yellow rungs on the bulkhead and ringed pad-eyes in the deck (the default until scored);
//   ?h=H-b  recessed rails: a continuous slot in the bulkhead with a steel bar in it, the pad-eyes flush rings.
// A P view draws the deck by its candidate with H-a's holds, an H view the holds by its candidate on P-a's deck. Not mag-boots' H
// group (the hand on a hold on the figure): these are the places' fittings.
import { pic, GAP } from '../portrait-lib/card.js';
import { frameOf, drawFrame, snap, marine } from '../portrait-lib/figure.js';
import { tone, hash3 } from '../../src/art/tone.js';

export const DECKS = Object.freeze(['P-a', 'P-b']), HOLDS = Object.freeze(['H-a', 'H-b']), DEFAULTS = Object.freeze({ deck: 'P-a', holds: 'H-a' });
/** The density, the patch drawn (m), the grid rule's spacings (AW§4.1 item 2) and the bulkhead's depth (m). */
export const PPM = 16, DECK_M = Object.freeze([10, 6]), GRID_M = 1.5, PAD_EYE_M = 3, WALL_M = 0.5;
/** The colours (my calls): the deck's steel, the bulkhead's, the safety yellow (the catwalk's rail, render/range.js CATWALK_RAIL), the bar's steel. */
export const DECK_C = 0x657974, WALL_C = 0x4c5258, YELLOW_C = 0xc8a43a, BAR_C = 0xa9b0b8, LABEL = 0x9aa0ab;
// (the corner drawn three times larger: 2 m wide from the patch's left and 2.25 m deep from 4 px down, so the bulkhead's rungs and
// the first pad-eye are in it)
const ZOOM = 3, ZOOM_M = Object.freeze([2, 2.25]), ZOOM_SY = 4;
const W = DECK_M[0] * PPM, H = DECK_M[1] * PPM, ZW = ZOOM_M[0] * PPM * ZOOM, ZH = ZOOM_M[1] * PPM * ZOOM;
export const SIZE = Object.freeze([GAP + W + GAP + ZW + GAP, GAP + 9 + Math.max(H, ZH) + GAP]);

// (the plate under the patch: GRID_M panels, a weld seam at each edge (a dark line, a lit one beside it), a bolt at each corner, a
// speck of wear now and then; the game's deckPlate painter's own look without its tie-down rings, which on a void deck would be
// holds the grid rule does not have (my call); P-b's grid painted on it through the pad-eyes)
function deckOf(deck) {
  const col = new Int32Array(W * H), g = GRID_M * PPM, seam = tone(DECK_C, -0.16), lit = tone(DECK_C, 0.035), bolt = tone(DECK_C, 0.1), boltSh = tone(DECK_C, -0.14);
  const lo = tone(DECK_C, -0.04), hi = tone(DECK_C, 0.04);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const a = x % g, b = y % g, r = hash3(x, y, 7) % 131;
    let c = r < 3 ? lo : r < 4 ? hi : DECK_C;
    if (a === 0 || b === 0) c = seam; else if (a === 1 || b === 1) c = lit;
    col[y * W + x] = c;
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const a = x % g, b = y % g; if ((a === 3 || a === g - 3) && (b === 3 || b === g - 3)) { col[y * W + x] = bolt; if (y + 1 < H) col[(y + 1) * W + x] = boltSh; } }
  if (deck === 'P-b') {
    // (the grid painted through the pad-eyes' rows and columns, every GRID_M at the panels' middles, worn: one pixel in five bare)
    const off = Math.round(g / 2), paintC = tone(YELLOW_C, -0.12);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const on = (x - off) % g === 0 || (y - off) % g === 0;
      if (on && ((x * 7 + y * 13) % 5) !== 0) col[y * W + x] = paintC;
    }
  }
  return col;
}

// (the bulkhead along the patch's top and its holds; the pad-eyes in the deck: on a Pic at (x0, y0), k times larger, the patch's
// pixels [sx, sy] to [sx + w, sy + h] only)
function draw(P, col, holds, x0, y0, { k = 1, sx = 0, sy = 0, w = W, h = H } = {}) {
  const wallPx = WALL_M * PPM, g = GRID_M * PPM, pe = PAD_EYE_M * PPM, off = Math.round(g / 2);
  const out = new Int32Array(col);
  const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) out[y * W + x] = c; };
  // (the bulkhead: its face, a lit top edge and a shadow on the deck at its foot)
  for (let y = 0; y < wallPx; y++) for (let x = 0; x < W; x++) put(x, y, y === 0 ? tone(WALL_C, 0.06) : y === wallPx - 1 ? tone(WALL_C, -0.08) : WALL_C);
  for (let x = 0; x < W; x++) put(x, wallPx, tone(DECK_C, -0.1));
  const holdsAt = [];
  for (let cx = off; cx < W; cx += g) holdsAt.push(cx);
  if (holds === 'H-a') {
    // (a rung a GRID_M on the bulkhead's face: a yellow bar 0.5 m wide standing a pixel off the face, its two feet dark)
    for (const cx of holdsAt) {
      const half = Math.round(0.25 * PPM);
      for (let x = cx - half; x <= cx + half; x++) put(x, wallPx - 3, YELLOW_C);
      for (let x = cx - half; x <= cx + half; x++) put(x, wallPx - 2, tone(YELLOW_C, -0.2));
      put(cx - half, wallPx - 1, tone(WALL_C, -0.2)); put(cx + half, wallPx - 1, tone(WALL_C, -0.2));
    }
  } else {
    // (a continuous rail recessed in the bulkhead: its slot dark, the bar's steel in it, a bracket every GRID_M)
    for (let x = 0; x < W; x++) { put(x, wallPx - 4, tone(WALL_C, -0.22)); put(x, wallPx - 3, BAR_C); put(x, wallPx - 2, tone(WALL_C, -0.22)); }
    for (const cx of holdsAt) put(cx, wallPx - 3, tone(BAR_C, -0.25));
  }
  // (the pad-eyes: a ring in the deck every PAD_EYE_M, H-a's yellow-ringed and proud, H-b's a flush steel ring)
  for (let cy = g + off; cy < H; cy += pe) for (let cx = off; cx < W; cx += pe) {
    for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) {
      const d = Math.hypot(i, j);
      if (d > 2.4) continue;
      if (holds === 'H-a') put(cx + i, cy + j, d > 1.5 ? YELLOW_C : d > 0.5 ? tone(DECK_C, -0.3) : BAR_C);
      else put(cx + i, cy + j, d > 1.5 ? tone(DECK_C, -0.2) : d > 0.5 ? BAR_C : tone(DECK_C, -0.3));
    }
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) P.fill(x0 + x * k, y0 + y * k, k, k, snap(out[(sy + y) * W + sx + x]));
  return { holds: holdsAt.length, padEyes: Math.ceil((H - g - off) / pe) * Math.ceil((W - off) / pe) };
}

/** The picture for a query: a Pic with .report. */
export function picture(q = new URLSearchParams()) {
  const deck = DECKS.includes(q.get('p')) ? q.get('p') : DEFAULTS.deck, holds = HOLDS.includes(q.get('h')) ? q.get('h') : DEFAULTS.holds;
  const view = q.has('h') ? holds : deck, [PW, PH] = SIZE, P = pic(PW, PH);
  const words = { 'P-a': 'PLAIN PLATE, WELD SEAMS', 'P-b': 'PLATE, THE HOLD GRID PAINTED', 'H-a': 'YELLOW RUNGS, RINGED PAD-EYES', 'H-b': 'RECESSED RAILS, FLUSH PAD-EYES' }[view];
  P.write(GAP + 1, GAP + 1, `${view}: ${words} · 16 PX/M · THE CORNER X3`, LABEL);
  const col = deckOf(deck), y0 = GAP + 9;
  const n = draw(P, col, holds, GAP, y0);
  // (the marine standing in it for scale, three metres off the bulkhead between the pad-eyes)
  const f = frameOf(marine(), 'down', 'idle0', { ppm: PPM });
  drawFrame(P, f, GAP + Math.round(W / 2) + Math.round(GRID_M * PPM / 6), y0 + Math.round(3.4 * PPM), { clip: [GAP, y0, W, H] });
  // (the corner by the bulkhead three times larger: the first hold and the first pad-eye)
  draw(P, col, holds, GAP + W + GAP, y0, { k: ZOOM, sx: 0, sy: ZOOM_SY, w: ZOOM_M[0] * PPM, h: ZOOM_M[1] * PPM });
  P.report = { view, deck, holds, gridM: GRID_M, padEyeM: PAD_EYE_M, holdsDrawn: n.holds, padEyes: n.padEyes };
  return P;
}
