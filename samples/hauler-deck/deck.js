// OLYMPUS sample: "A Belt hauler's crew deck", the inside of the Patient Mule's deck 2 (the build sheet v0.0.27 §10, item 16; SH§8.1; pure, main.js shows it).
//
// "Away the boarding party" (v0.0.27) is fought on deck 2 of a Belt ice hauler: the lock, the passage 1.5 m wide, two cabins and the
// hands' bunk room, every opening a hatch, every standing piece to the 2.4 m deckhead. The deck is the game's own data
// (src/data/places/hauler.js HAULER: its rooms, its hatches and its fixtures; the walls by src/sim/places/plan.js wallsOf, the dorsal
// and the side bulkheads to the deckhead, the rest cut at 1.0 m as the stage's cutaway cuts them), drawn by the stage's camera rule
// before its look is built (VIEWS §2.1: from 45° above, a point at plan (x, z) and height y drawn at (x, z − y), 16 px a metre, north
// up; back to front, each piece's top and its south face), so the look is scored first. Each view is one candidate (?i=<id>):
//   I-a  Belt grey, patched panels, union-red trim, hand-painted stencils in Lang Belta and Standard (the default until scored);
//   I-b  painted liners in faded colours, a compartment each, foam pads at the corners and the hatches, a child's drawing in cabin 1;
//   I-c  bare steel and grey foam, "run cold".
// Each picture is the whole deck at 16 px/m, then three times larger the passage from the lock, cabin 1 and the bunk room. The
// candidate's colours are drawn as they are (the Belter palette, src/art/palette.js 'belt', is built from the pick: E's), every piece's
// footprint the game's (src/sim/places/fixtures.js footprintOf), its height the catalogue's. window.__report: the frame, the candidate,
// the pieces and walls drawn.
import { pic, GAP } from '../portrait-lib/card.js';
import { HAULER, HAULER_CEILING_M } from '../../src/data/places/hauler.js';
import { planOf, wallsOf, wallRect } from '../../src/sim/places/plan.js';
import { footprintOf, mountOf, CATALOGUE } from '../../src/sim/places/fixtures.js';
import { tone, hash3 } from '../../src/art/tone.js';

/** The density and the deck's size (m), its margin above for the deckhead's height on the camera. */
export const PPM = 16, DECK_M = Object.freeze([12, 10]), TOP_M = HAULER_CEILING_M + 0.3;
const LABEL_H = 9, HEAD = 0xd8dce4, LABEL = 0x9aa0ab, ZOOM = 3, CROP_UP_M = 1.4;
/** The three crops (x0, z0, w, h metres; each from CROP_UP_M above its z0 on the picture, so the bulkheads' faces north of it show): the passage from the lock, cabin 1, the bunk room. */
export const CROPS = Object.freeze([
  Object.freeze({ name: 'THE PASSAGE FROM THE LOCK', at: [0, 3.4, 5.5, 3.6] }),
  Object.freeze({ name: 'CABIN 1', at: [2.3, 0.3, 5.5, 3.6] }),
  Object.freeze({ name: 'THE BUNK ROOM', at: [2.3, 6.6, 5.5, 3.6] }),
]);
/**
 * The candidates (see the header): the floor, the bulkheads' faces and tops, the trim, the pieces, the foam, the stencils' paint, and
 * the liners by compartment (I-b), the patches' share and tone (I-a), each my call from SH§8.1's words.
 */
export const CANDIDATES = Object.freeze({
  'I-a': Object.freeze({ name: 'Belt grey, patched panels, union-red trim, hand-painted stencils in Lang Belta and Standard', floor: 0x5c6064, wall: 0x7a7e80, top: 0x8a8e90, trim: 0x9a2a24, piece: 0x6a6e72, foam: null, paint: 0xd8d0b0, patch: 0.22, liners: null,
    stencils: [['DEK TU · BERTHS', 'DECK 2 · BERTHS'], ['KABIN WAN', 'CABIN 1'], ['BUNKS']] }),
  'I-b': Object.freeze({ name: 'painted liners in faded colours, foam pads at the corners and hatches, a child\'s drawing in cabin 1', floor: 0x58585a, wall: 0x7a8a84, top: 0x8a9690, trim: null, piece: 0x7a7470, foam: 0xb8b4a8, paint: 0x3a3a3a, patch: 0, drawing: true,
    liners: Object.freeze({ 'mu.d2.lock': 0x8a8a80, 'mu.d2.passage': 0x6e8a86, 'mu.d2.cabin-1': 0xa08a5a, 'mu.d2.cabin-2': 0x8a6a72, 'mu.d2.bunks': 0x6a7a92 }), stencils: [['DECK 2'], ['CABIN 1'], ['BUNKS']] }),
  'I-c': Object.freeze({ name: 'bare steel and grey foam, run cold', floor: 0x50585e, wall: 0x6a7480, top: 0x7a8490, trim: null, piece: 0x5a626c, foam: 0x8a9096, paint: 0xa8b4c0, patch: 0, liners: null, stencils: [['D2'], ['C1'], ['BK']] }),
});
export const DEFAULT = 'I-a';
const W = DECK_M[0] * PPM, H = Math.round((DECK_M[1] + TOP_M) * PPM);
const CW = Math.round(CROPS[0].at[2] * PPM * ZOOM), CH = Math.round(CROPS[0].at[3] * PPM * ZOOM);
export const SIZE = Object.freeze([Math.max(GAP + W + GAP, GAP + CROPS.length * (CW + GAP)), GAP + LABEL_H + LABEL_H + H + GAP + LABEL_H + CH + GAP]);

// (the deck drawn into its own buffer at 16 px/m: plan (x, z, y) at pixel (x, z − y + TOP_M))
function deckOf(C) {
  const col = new Int32Array(W * H).fill(0x0e0f14), put = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H) col[y * W + x] = c; };
  const px = (m) => Math.round(m * PPM), Y = (z, y = 0) => px(z - y + TOP_M);
  const roomAtPx = (x, z) => HAULER.rooms.find(r => x >= r.rect[0] && x < r.rect[2] && z >= r.rect[1] && z < r.rect[3]) ?? null;
  const report = { walls: 0, pieces: 0, hatches: 0 };
  // (the floor: 1.5 m plates, a seam at each edge, a patch now and then (I-a), a pad-eye every 3 m)
  for (let j = 0; j < DECK_M[1] * PPM; j++) for (let i = 0; i < W; i++) {
    const x = i / PPM, z = j / PPM, R = roomAtPx(x, z);
    if (!R) continue;
    const pi = Math.floor(x / 1.5), pj = Math.floor(z / 1.5), seam = i % 24 === 0 || j % 24 === 0;
    let c = C.floor;
    if (C.patch && (hash3(pi, pj, 5) % 100) < C.patch * 100) c = tone(c, (hash3(pi, pj, 9) % 2) ? 0.06 : -0.07);
    if (seam) c = tone(c, -0.14);
    if ((i - 12) % 48 === 0 && (j - 12) % 48 === 0) c = tone(c, 0.25);
    put(i, j + px(TOP_M), c);
  }
  // (the pieces to draw, back to front by their south edge: the walls (the plan's runs) and the standing fixtures)
  const boxes = [];
  for (const w of wallsOf(planOf(HAULER))) {
    const r = wallRect(w), liner = C.liners ? (HAULER.rooms.find(R => (w.axis === 'x' ? Math.abs(R.rect[3] - w.at) < 0.01 : Math.abs(R.rect[2] - w.at) < 0.01) && (w.axis === 'x' ? R.rect[0] <= w.a + 0.01 && R.rect[2] >= w.b - 0.01 : R.rect[1] <= w.a + 0.01 && R.rect[3] >= w.b - 0.01))?.id) : null;
    boxes.push({ r: [r.x0, r.z0, r.x1, r.z1], h: w.h, face: (liner && C.liners[liner]) ?? C.wall, top: C.top, trim: C.trim, kind: 'wall' });
  }
  for (const o of HAULER.openings) {
    // (a closed hatch's leaf in its opening, its coaming a yellow sill; its frame's trim)
    const lr = o.axis === 'x' ? [o.a, o.at - 0.04, o.b, o.at + 0.04] : [o.at - 0.04, o.a, o.at + 0.04, o.b];
    boxes.push({ r: lr, h: 2.0, face: tone(C.wall, -0.1), top: tone(C.top, -0.1), trim: C.trim, kind: 'hatch', coaming: o.coamingM, axis: o.axis, o });
    report.hatches++;
  }
  for (const f of HAULER.fixtures) {
    const m = mountOf(f), r = footprintOf(f);
    if (m === 'deck') { boxes.push({ r: [r.x0, r.z0, r.x1, r.z1], h: 0.02, face: 0x8a7a2a, top: 0x3a3c3e, kind: 'scuttle' }); continue; }
    if (m) continue;
    const h = Math.min(CATALOGUE[f.kind].h, HAULER_CEILING_M);
    boxes.push({ r: [r.x0, r.z0, r.x1, r.z1], h, face: f.kind === 'berthBox' ? tone(C.piece, 0.05) : C.piece, top: tone(C.piece, 0.1), trim: f.id.endsWith('dc-locker') ? 0x9a2a24 : null, kind: f.kind, foam: f.kind === 'berthBox' && C.foam });
    report.pieces++;
  }
  boxes.sort((a, b) => a.r[3] - b.r[3]);
  for (const B of boxes) {
    const [x0, z0, x1, z1] = B.r, X0 = px(x0), X1 = px(x1);
    // (the top at the piece's height, then its south face down to the floor)
    for (let j = Y(z0, B.h); j < Y(z1, B.h); j++) for (let i = X0; i < X1; i++) put(i, j, B.kind === 'scuttle' ? (i === X0 || i === X1 - 1 || j === Y(z0, B.h) || j === Y(z1, B.h) - 1 ? 0xc8a43a : B.top) : B.top);
    for (let j = Y(z1, B.h); j < Y(z1); j++) for (let i = X0; i < X1; i++) {
      let c = B.face;
      if (B.kind === 'berthBox' && (j - Y(z1, B.h)) % 13 === 6) c = tone(c, -0.2);                 // (the berths' shelves)
      if (B.foam && (i - X0) % 9 < 2) c = B.foam;                                                       // (foam pads on the berths' edges)
      if (B.trim && j - Y(z1, B.h) < 2) c = B.trim;                                                       // (the trim along the top)
      if (C.patch && B.kind === 'wall' && hash3(Math.floor(i / 10), Math.floor(j / 8), 3) % 100 < C.patch * 60) c = tone(c, 0.07);
      put(i, j, c);
    }
    if (B.kind === 'hatch') for (let i = (B.axis === 'x' ? X0 : px(B.o.at) - 2); i < (B.axis === 'x' ? X1 : px(B.o.at) + 2); i++) for (let j = Y(z1) - 1; j < Y(z1) + 1; j++) put(i, j, 0xc8a43a);
    if (B.kind === 'wall') report.walls++;
  }
  return { col, report };
}
// (a word painted on a bulkhead's face: the 3 × 5 alphabet into the deck's buffer)
function stencil(D, P0, x, y, words, c) { const T = pic(200, 7); T.write(0, 0, words, c); for (let j = 0; j < 7; j++) for (let i = 0; i < 200; i++) { const v = T.get(i, j); if (v === c) { const X = x + i, Y = y + j; if (X >= 0 && Y >= 0 && X < W && Y < H) D.col[Y * W + X] = c; } } }

/** The picture for a query (?i=<id>): a Pic with .report. */
export function picture(q = new URLSearchParams()) {
  const id = CANDIDATES[q.get('i')] ? q.get('i') : DEFAULT, C = CANDIDATES[id], [SW, SH] = SIZE, P = pic(SW, SH);
  const D = deckOf(C), report = { frame: [SW, SH], id, ...D.report };
  // (the stencils: on the passage's dorsal bulkhead, cabin 1's, the bunk room's; I-b's child's drawing on cabin 1's dorsal bulkhead)
  const at = (x, z) => [Math.round(x * PPM), Math.round((z - 1.6 + TOP_M) * PPM)];
  const S = C.stencils;
  stencil(D, P, ...at(5.4, 4.0), S[0].join('  '), C.paint);
  stencil(D, P, ...at(4.9, 0.0), S[1].join('  '), C.paint);
  stencil(D, P, ...at(5.5, 5.5), S[2].join('  '), C.paint);
  if (C.drawing) { const [dx, dy] = at(5.2, 0.0); [[0xd84a3a, 0, 0], [0xe8c03a, 1, 0], [0x3a8ad8, 0, 1], [0x4ab84a, 1, 1]].forEach(([c, i, j]) => { for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) D.col[(dy + 9 + j * 3 + b) * W + dx + i * 3 + a] = c; }); }
  P.write(GAP + 1, GAP + 1, `${id}: ${C.name}`, HEAD);
  let y = GAP + LABEL_H;
  P.write(GAP + 1, y + 1, 'DECK 2 AT 16 PX/M, FROM 45 DEGREES ABOVE: THE LOCK WEST, THE PASSAGE, CABINS 1 AND 2 NORTH, THE BUNK ROOM SOUTH', LABEL);
  y += LABEL_H;
  P.blit({ w: W, h: H, col: D.col }, GAP, y);
  y += H + GAP;
  P.write(GAP + 1, y + 1, `THREE TIMES LARGER: ${CROPS.map(c => c.name).join(' · ')}`, LABEL);
  y += LABEL_H;
  CROPS.forEach((cr, k) => {
    const [x0, z0] = cr.at, X0 = GAP + k * (CW + GAP), ox = Math.round(x0 * PPM), oy = Math.round((z0 + TOP_M - CROP_UP_M) * PPM);
    for (let j = 0; j < CH; j++) for (let i = 0; i < CW; i++) { const sx = ox + Math.floor(i / ZOOM), sy = oy + Math.floor(j / ZOOM); P.put(X0 + i, y + j, sx >= 0 && sy >= 0 && sx < W && sy < H ? D.col[sy * W + sx] : 0x0e0f14); }
  });
  P.report = report;
  return P;
}
