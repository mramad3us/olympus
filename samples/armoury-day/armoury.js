// OLYMPUS sample: "The window and the canopy", the armoury's day as the stage and the weapon card would draw it (the build sheet v0.0.28 §10; UK§8, UK§9, AM§13; pure, main.js shows it).
//
// "The window and the canopy" (v0.0.28, ROADMAP's 0.0.8) has four looks the game does not draw yet: the issue window in the armoury's
// south front with the armourer behind it (W), the figure at the cleaning table under the canopy (F), the rifle stripped on the mat
// while the clean runs (M) and the weapon card's dirt by condWord's band (D). Each view is one candidate (?c=<id>), drawn with the game's
// own code wherever the game has it, and the candidate's piece by this file alone, so the game is unchanged until the user scores:
//   - the people: composed at the stage's 16 px/m by src/art/figures/compose.js and shaded by shade.js (../portrait-lib/figure.js
//     frameOf), in utilities, the stage's post pass snapping every pixel to the Mars palette; the stage's camera (VIEWS §2.1: from 45°
//     above, a point at plan (x, z) and height y drawn at (x, z − y), north up, back to front); the rifle on the counter and on the mat
//     the stage's own 16 px R-7 (src/art/figures/templates.js shapeAt, the R-7's drawing and colours, src/art/rifles.js);
//   - W, the window: a strip of the armoury's south face 6 m wide, window 1 in it (the issueWindow fixture, 1.2 × 0.6 × 1.1 m), the
//     armourer 0.6 m behind it toward you, the rifle on the counter, bolt open, and you at the customer spot beside it, your back to
//     the camera: W-a the counter at the hip and the upper half open (by the camera's rule a man 0.6 m behind a 2.1 m opening is seen
//     from the hip to the chest), W-b a grille over the upper half;
//   - F, the figure at the bench: a cleanTable (2.4 × 0.9 × 0.9 m) on the canopy's concrete, you at its north spot facing south, the
//     mat before you at M-a, in daylight and under the canopy's evening lamps (a warm pool round the lamp, the rest darker): F-a the
//     sink's basin lean (the game's 'basin' frame, no new cell), F-b the bench pair (bench0 a hand on a part over the mat, bench1 the
//     rod held up to the light), each a pose written outright in the figure engine's own terms (the poses.js header's);
//   - M, the mat: cleanMat (1.0 × 0.4 m, 16 × 6 px at 16 px/m) in its five frames by the clean's part (strip, clean dirty, clean done,
//     oil, together), three times its size and at its own on the table's top, the airPuff beside the second (0.4 × 0.4 m, three frames
//     at 6 fps): M-a the Corps' olive rubber, M-b a tan canvas roll-out (more contrast for the black parts at 16 px);
//   - D, the card's dirt: the weapon card (src/art/weaponcard.js paintWeaponCard, the game's) at each band condWord gives (fine,
//     gritty, fouled, wants cleaning), the word under it: D-a dust as tan speckle on the receiver's top and in the open port, carbon at
//     the port, the bolt face and the muzzle, heavier at "wants cleaning", "fine" left as the game draws it today; D-b the card as
//     today, the word only.
// The defaults (W-a, F-a, M-a, D-a) are what the game builds until the user scores. window.__report: the frame, the candidate, the
// pieces drawn and their pixel counts (a piece that drew nothing would be a broken candidate).
import { pic, GAP } from '../portrait-lib/card.js';
import { frameOf, drawFrame, snap } from '../portrait-lib/figure.js';
import { wear, coloursOf } from '../../src/art/figures/outfits.js';
import { shapeAt } from '../../src/art/figures/templates.js';
import { paintWeaponCard, CARD_W, CARD_H } from '../../src/art/weaponcard.js';
import { tone, hash3 } from '../../src/art/tone.js';

/** The stage's density, the zoom the views draw at, the label's height. */
export const PPM = 16, K = 3, LABEL_H = 9;
const HEAD = 0xd8dce4, LABEL = 0x9aa0ab;
/** The fixtures' sizes (m), as the sheet's §5 gives them: the window, the table, the mat, the puff. */
export const WINDOW = Object.freeze({ w: 1.2, d: 0.6, h: 1.1, head: 2.1 }), TABLE = Object.freeze({ w: 2.4, d: 0.9, h: 0.9 });
export const MAT = Object.freeze({ w: 1.0, d: 0.4, px: [16, 6], frames: ['STRIP', 'CLEAN, DIRTY', 'CLEAN, DONE', 'OIL', 'TOGETHER'] }), PUFF = Object.freeze({ m: 0.4, frames: 3, fps: 6 });
/** condWord's bands as the card shows them (src/sim/arms/firearms.js condWord, 'wants the armourer' never an issue rifle's here). */
export const BANDS = Object.freeze(['fine', 'gritty', 'fouled', 'wants cleaning']);

/** The candidates, by group (the default of each first). */
export const GROUPS = Object.freeze({
  W: Object.freeze([
    Object.freeze({ id: 'W-a', name: 'the counter at the hip, the armourer in his utilities to the chest', grille: false }),
    Object.freeze({ id: 'W-b', name: 'a grille over the upper half of the window', grille: true }),
  ]),
  F: Object.freeze([
    Object.freeze({ id: 'F-a', name: 'the sink\'s basin lean, no new cell', frames: ['basin'] }),
    Object.freeze({ id: 'F-b', name: 'the bench pair: a hand on a part over the mat, the rod held up to the light', frames: ['bench0', 'bench1'] }),
  ]),
  M: Object.freeze([
    Object.freeze({ id: 'M-a', name: 'the Corps\' olive rubber mat', mat: 0x4c5638 }),
    Object.freeze({ id: 'M-b', name: 'a tan canvas roll-out', mat: 0xb4a07a }),
  ]),
  D: Object.freeze([
    Object.freeze({ id: 'D-a', name: 'dust as tan speckle on the receiver and in the port, carbon at the port, the bolt face and the muzzle', drawn: true }),
    Object.freeze({ id: 'D-b', name: 'the art clean as today, the word only', drawn: false }),
  ]),
});
export const DEFAULTS = Object.freeze({ W: 'W-a', F: 'F-a', M: 'M-a', D: 'D-a' });
/** Every candidate, by id: { group, cand }. */
export const CANDIDATES = Object.freeze(Object.fromEntries(Object.entries(GROUPS).flatMap(([g, list]) => list.map(c => [c.id, Object.freeze({ group: g, cand: c })]))));
export const DEFAULT = DEFAULTS.W;

// (the bench pair's two frames, poses written outright in the figure engine's terms (src/art/figures/poses.js's header): BASIN's lean
// and planted legs, the right hand forward on a part over the mat (bench0); the right hand up before the face, the rod to the light (bench1))
const BENCH_LEGS = Object.freeze({ r: Object.freeze([-0.06, 0.06, 0.05]), l: Object.freeze([-0.06, 0.06, 0.05]) });
export const BENCH_POSES = Object.freeze({
  bench0: Object.freeze({ lean: 0.42, legs: BENCH_LEGS, arms: Object.freeze({ r: Object.freeze([1.15, 0.45, 0.08]), l: Object.freeze([0.85, 0.7, 0.14]) }) }),
  bench1: Object.freeze({ lean: 0.12, legs: BENCH_LEGS, arms: Object.freeze({ r: Object.freeze([2.05, 0.95, 0.12]), l: Object.freeze([0.95, 0.65, 0.12]) }) }),
});

// ---------- the people ----------
/** You in utilities (no weapon: at the window before the issue, at the bench the rifle on the mat). */
export const YOU = (over = {}) => wear({ outfit: 'utilities', skin: 0xb07a58, hair: { style: 'short', color: 0x2a2018 }, seed: 5, weapon: null, ...over });
/** The armourer in utilities, a staff sergeant's look. */
export const ARMOURER = (over = {}) => wear({ outfit: 'utilities', skin: 0x7a5038, hair: { style: 'buzz', color: 0x1c1610 }, seed: 11, weapon: null, ...over });
const frame = (look, dir, name) => (BENCH_POSES[name] ? frameOf(look, dir, 'idle0', { ppm: PPM, pose: BENCH_POSES[name] }) : frameOf(look, dir, name, { ppm: PPM }));

// ---------- the stage's 16 px R-7 (templates.js shapeAt, in the R-7's colours) ----------
const RIFLE_COL = coloursOf(wear({ weapon: 'rifle', model: 'r7' }), PPM);
/** The R-7 lying level at 16 px/m: [[x, y, colour]] from its left end, its top row 0. */
export function rifleCells(lenPx = 16, { bolt = false } = {}) {
  const s = shapeAt('rifle', lenPx, 1), y0 = Math.min(...s.map(c => c[1]));
  const out = s.map(([a, b, ch]) => [a, b - y0, RIFLE_COL[ch] ?? 0x2a2c30]);
  // (the bolt locked open: the port a pixel of light steel at the receiver's middle)
  if (bolt) { const x = Math.round(lenPx * 0.5), top = out.filter(c => c[0] === x).sort((p, q) => p[1] - q[1])[0]; if (top) top[2] = 0x8a909c; }
  return out;
}

// ---------- the mat (cleanMat, five frames by the clean's part) ----------
const STEEL = 0x34363c, LOWER = 0x2a2c30, CARRIER = 0x5a5c62, RAG = 0xe4e0d2, RAG_USED = 0x9a988e, DUST = 0xb89a68, CARBON = 0x141414, GLINT = 0xf2f0e6;
/** One frame of the mat (part 0 to 4) on its colour: a 16 × 6 grid of 0xrrggbb. */
export function matFrame(part, matColour) {
  const [w, h] = MAT.px, g = Array.from({ length: h }, (_, j) => Array.from({ length: w }, (_, i) => ((i + j) % 5 === 0 ? tone(matColour, -0.06) : matColour)));
  const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < w && y < h) g[y][x] = c; };
  if (part === 0 || part === 4) { for (const [x, y, c] of rifleCells(14)) put(x + 1, y + 1, c); return g; }
  // (laid out in strip order: the upper with its barrel, the lower and stock, the carrier, the charging handle, the piston, the magazine, the rag)
  for (let x = 1; x <= 10; x++) { put(x, 1, STEEL); put(x, 2, tone(STEEL, -0.1)); }
  for (let x = 1; x <= 6; x++) { put(x, 4, LOWER); put(x, 5, tone(LOWER, -0.08)); }
  for (let x = 8; x <= 10; x++) put(x, 4, CARRIER);
  put(12, 1, STEEL); put(12, 2, STEEL); put(13, 1, STEEL);
  for (let x = 12; x <= 14; x++) put(x, 4, tone(STEEL, 0.08));
  for (let x = 12; x <= 14; x++) put(x, 5, 0x3c3a34);
  const rag = part === 1 ? RAG : RAG_USED;
  put(14, 1, rag); put(15, 1, rag); put(14, 2, rag); put(15, 2, rag);
  if (part === 1) { for (const x of [2, 4, 5, 7, 9]) put(x, 1, DUST); put(8, 4, CARBON); put(10, 1, CARBON); }
  if (part === 3) { put(9, 4, GLINT); put(6, 1, GLINT); }
  return g;
}
/** The puff's three frames (0.4 m, 6 × 6 px at 16 px/m): a mist widening and thinning. */
export function puffFrame(f) {
  const n = Math.round(PUFF.m * PPM), g = Array.from({ length: n }, () => Array(n).fill(null)), r = 1 + f * 1.1, c = 0xd8dcde;
  // (a pixel of mist inside the radius, one in (f + 2) left out by hash, so each frame is thinner than the last)
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const d = Math.hypot(i - n / 2 + 0.5, j - n / 2 + 0.5); if (d <= r && hash3(i, j, f) % (f + 2) !== 0) g[j][i] = f === 2 ? tone(c, -0.12) : c; }
  return g;
}

// ---------- the stage's crops (cabinet projection at 16 px/m, drawn three times larger) ----------
/** A crop: a plan box x0..x0+w by screen rows z0..z0+h (m), drawn into a Pic at (X, Y), K pixels a stage pixel; put(x, z, y, c) a plan point. */
function crop(P, X, Y, x0, z0, w, h, { k = K, lamp = null } = {}) {
  const W = Math.round(w * PPM), H = Math.round(h * PPM), buf = new Int32Array(W * H).fill(0x0e0f14), report = { px: 0 };
  const at = (sx, sy) => [Math.round((sx - x0) * PPM), Math.round((sy - z0) * PPM)];
  const C = {
    W, H,
    /** A stage pixel at screen metres (sx, sy). */
    dot(sx, sy, c) { const [i, j] = at(sx, sy); if (i >= 0 && j >= 0 && i < W && j < H) { buf[j * W + i] = c; report.px++; } },
    /** A stage pixel by its index. */
    pix(i, j, c) { if (i >= 0 && j >= 0 && i < W && j < H) { buf[j * W + i] = c; report.px++; } },
    /** A plan rect at height y (its top) or a vertical face (z fixed, y0..y1), in stage pixels. */
    top(px0, pz0, px1, pz1, y, c) { for (let j = Math.round((pz0 - y - z0) * PPM); j < Math.round((pz1 - y - z0) * PPM); j++) for (let i = Math.round((px0 - x0) * PPM); i < Math.round((px1 - x0) * PPM); i++) C.pix(i, j, typeof c === 'function' ? c(i, j) : c); },
    face(px0, px1, pz, y0, y1, c) { for (let j = Math.round((pz - y1 - z0) * PPM); j < Math.round((pz - y0 - z0) * PPM); j++) for (let i = Math.round((px0 - x0) * PPM); i < Math.round((px1 - x0) * PPM); i++) C.pix(i, j, typeof c === 'function' ? c(i, j) : c); },
    /** A figure frame with its feet at plan (x, z). */
    figure(f, x, z) { const [ax, ay] = at(x, z); for (const [a, b, c] of f.px) C.pix(ax + a - f.ax, ay + b - f.ay, snap(c)); },
    /** Cells [[x, y, c]] at stage pixel (i0, j0). */
    cells(list, i0, j0) { for (const [x, y, c] of list) C.pix(i0 + x, j0 + y, c); },
    stagePx: at,
    done() {
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
        let c = buf[j * W + i];
        // (the canopy's evening lamps: the picture darker, a warm pool round the lamp's foot, each colour snapped again)
        if (lamp) { const d = Math.hypot(i - lamp[0], (j - lamp[1]) * 1.4) / PPM, warm = Math.max(0, 1 - d / 2.2); c = snap(tone(c, -0.34 + 0.3 * warm)); if (warm > 0.25) c = snap(((Math.min(255, ((c >> 16) & 255) + 14)) << 16) | (c & 0xff00) | Math.max(0, (c & 255) - 10)); }
        P.fill(X + i * k, Y + j * k, k, k, c);
      }
      return report.px;
    },
  };
  return C;
}

// (the window's strip: the apron, the armoury's south face, window 1 with its counter (and grille), the armourer behind, the rifle, you)
function windowCrop(P, X, Y, cand, k) {
  const ZW = 3.2, C = crop(P, X, Y, 0, 0, 6, 4.4, { k }), wx0 = 2.4, wx1 = wx0 + WINDOW.w;
  const APRON = snap(0x9a948a), WALL = snap(0xb0a490), WALL_D = snap(0x968a76), ROOF = snap(0x7a7268), INSIDE = snap(0x3a3630), COUNTER = snap(0x6a5a44), COUNTER_TOP = snap(0x8a7658), BAR = snap(0x4a4c50);
  C.top(0, ZW, 6, 4.4 + 3.0, 0, (i, j) => (((i + j * 3) % 11) ? APRON : tone(APRON, -0.05)));
  C.top(0, -1, 6, ZW, 3.0, ROOF);
  // (the inside, then the armourer 0.6 m behind the wall, toward you)
  C.face(wx0, wx1, ZW, WINDOW.h, WINDOW.head, INSIDE);
  const arm = frame(ARMOURER(), 'down', 'idle0');
  const keep = [];
  for (const [a, b, c] of arm.px) { const [ax, ay] = C.stagePx(3.0, ZW - 0.6); keep.push([ax + a - arm.ax, ay + b - arm.ay, snap(c)]); }
  const [ox0, oy0] = C.stagePx(wx0, ZW - WINDOW.head), [ox1, oy1] = C.stagePx(wx1, ZW - WINDOW.h);
  let armPx = 0;
  for (const [i, j, c] of keep) if (i >= ox0 && i < ox1 && j >= oy0 && j < oy1) { C.pix(i, j, c); armPx++; }
  // (the south face round the opening, a seam every 1.5 m, its foot a shade darker)
  C.face(0, wx0, ZW, 0, 3.0, (i, j) => (i % 24 === 0 ? WALL_D : WALL));
  C.face(wx1, 6, ZW, 0, 3.0, (i, j) => (i % 24 === 0 ? WALL_D : WALL));
  C.face(wx0, wx1, ZW, WINDOW.head, 3.0, WALL);
  C.face(0, 6, ZW, 0, 0.12, WALL_D);
  // (the counter: its face to the hip, its top the depth of the fixture, the rifle across it, bolt open)
  C.face(wx0, wx1, ZW + WINDOW.d / 2, 0, WINDOW.h, COUNTER);
  C.top(wx0, ZW - WINDOW.d / 2, wx1, ZW + WINDOW.d / 2, WINDOW.h, COUNTER_TOP);
  const [ri, rj] = C.stagePx(wx0 + 0.1, ZW + 0.1 - WINDOW.h);
  C.cells(rifleCells(16, { bolt: true }), ri, rj);
  if (cand.grille) { const [gx0, gy0] = C.stagePx(wx0, ZW - WINDOW.head), [gx1] = C.stagePx(wx1, 0), [, gy1] = C.stagePx(0, ZW - (WINDOW.h + WINDOW.head) / 2); for (let j = gy0; j < gy1; j++) for (let i = gx0; i < gx1; i++) if (i % 3 === 0 || j === gy1 - 1) C.pix(i, j, BAR); }
  // (you at the customer spot, beside the window, your back to the camera)
  C.figure(frame(YOU(), 'up', 'idle0'), wx1 + 0.55, ZW + 0.75);
  return { px: C.done(), armourer: armPx, w: C.W * k, h: C.H * k };
}

// (the bench: the canopy's concrete, a table, you at its north spot facing south, the mat before you; the lamp's pool when lit)
function benchCrop(P, X, Y, frameName, matColour, k, lit) {
  const ZT = 3.4, x0 = 0.6, C = crop(P, X, Y, x0, 0.4, 4.8, 4.0, { k, lamp: lit ? [Math.round((3.0 - x0) * PPM), Math.round((ZT - 1.2 - 0.4) * PPM)] : null });
  const FLOOR = snap(0x8e8a84), TOPC = snap(0x6a6e62), FACE = snap(0x55584e), LEG = snap(0x3e403a);
  C.top(x0, 0.4, x0 + 4.8, 4.4 + 2, 0, (i, j) => (((i * 7 + j * 3) % 13) ? FLOOR : tone(FLOOR, -0.05)));
  const tx0 = 3.0 - TABLE.w / 2, tx1 = 3.0 + TABLE.w / 2, tz0 = ZT - TABLE.d / 2, tz1 = ZT + TABLE.d / 2;
  const you = frame(YOU(), 'down', frameName);
  C.figure(you, 2.4, ZT - 0.75);
  C.top(tx0, tz0, tx1, tz1, TABLE.h, TOPC);
  C.face(tx0, tx1, tz1, 0, TABLE.h, (i, j) => ((i - Math.round((tx0 - x0) * PPM)) % 37 < 2 ? LEG : FACE));
  // (the mat on the table's top before you: its frame 'clean, dirty', the clean's longest part)
  const [mi, mj] = C.stagePx(2.4 - MAT.w / 2, ZT - 0.3 - TABLE.h), M = matFrame(1, snap(matColour));
  M.forEach((row, y) => row.forEach((c, x) => C.pix(mi + x, mj + y, snap(c))));
  // (his hands where they reach over the table's top, drawn over it: by depth alone the stage draws a man standing north of a table
  // behind its top, which hides him below 0.6 m, his hands at the bench among it; the reach over the top is the vignette's layer, C's)
  const [fx, fy] = C.stagePx(2.4, ZT - 0.75), [, topJ] = C.stagePx(0, tz0 - TABLE.h);
  let hands = 0;
  for (const [a, b, c, ch] of you.px) { const j = fy + b - you.ay; if ((ch === 's' || ch === 'd') && j >= topJ) { C.pix(fx + a - you.ax, j, snap(c)); hands++; } }
  return { px: C.done(), hands, w: C.W * k, h: C.H * k };
}

// (the weapon card at a band, the dirt drawn over it (D-a) or not (D-b): the rifle's silhouette found by the card's own ink)
function cardAt(band, drawn) {
  const pm = paintWeaponCard({ model: 'r7', belief: { mag: 'in', count: 20, chamber: '?', mode: 'safe', port: band === 'fine' ? 'shut' : 'open' } });
  const hex = (v) => ((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff);
  const P = pic(CARD_W, CARD_H); for (let y = 0; y < CARD_H; y++) for (let x = 0; x < CARD_W; x++) P.put(x, y, hex(pm.data[y * CARD_W + x]));
  if (!drawn || band === 'fine') return { P, dirt: 0 };
  // (the rifle: the pixels inside the card's ink outline, read from the paint; its span along, the open port's light steel, its edges)
  const bg = new Set([P.get(0, 0), P.get(0, CARD_H - 1)]), INK = 0x101010;
  const isRifle = (x, y) => { const c = P.get(x, y); return c !== null && y < 100 && !bg.has(c) && c > INK && c !== P.get(CARD_W - 1, 0); };
  const px = [];
  for (let y = 10; y < 100; y++) for (let x = 0; x < CARD_W; x++) if (isRifle(x, y)) px.push([x, y]);
  if (!px.length) return { P, dirt: 0 };
  const xa = Math.min(...px.map(p => p[0])), xb = Math.max(...px.map(p => p[0])), L = xb - xa, heavy = band === 'wants cleaning';
  const lum = (c) => 0.3 * ((c >> 16) & 255) + 0.59 * ((c >> 8) & 255) + 0.11 * (c & 255), grey = (c) => Math.abs(((c >> 16) & 255) - (c & 255)) < 24;
  let dirt = 0;
  const dust = (x, y, c) => { P.put(x, y, c); dirt++; };
  for (const [x, y] of px) {
    const t = (x - xa) / L, c = P.get(x, y), edge = !isRifle(x, y - 1), port = t > 0.45 && t < 0.68 && lum(c) > 120 && grey(c);
    // (dust: tan speckle on the receiver's upper edges, 25 to 75% along, and in the open port; thicker at "wants cleaning")
    if ((band === 'gritty' || heavy) && ((edge && t > 0.25 && t < 0.75) || port) && hash3(x, y, 7) % (heavy ? 2 : 3) === 0) dust(x, y, hash3(x, y, 3) % 2 ? 0xc8a878 : 0xa88a5a);
    // (carbon: the port's bolt face and its rear half dark, the muzzle device's last 4% of the length)
    else if ((band === 'fouled' || heavy) && ((port && hash3(x, y, 5) % (heavy ? 1 : 2) === 0) || t > 0.96)) dust(x, y, hash3(x, y, 9) % 2 ? 0x1a1816 : 0x2a2622);
  }
  return { P, dirt };
}

const PUFF_GAP = 8;
/** The picture's size by group. */
const W_CROP = [6 * PPM * K, Math.round(4.4 * PPM) * K], F_CROP = [Math.round(4.8 * PPM) * K, Math.round(4.0 * PPM) * K];
export const SIZE = Object.freeze({
  W: [GAP + W_CROP[0] + GAP + 6 * PPM + GAP, GAP + LABEL_H + LABEL_H + W_CROP[1] + GAP],
  F: [GAP + 2 * (F_CROP[0] + GAP), GAP + LABEL_H + LABEL_H + F_CROP[1] + GAP],
  M: [GAP + MAT.frames.length * (MAT.px[0] * K * 2 + GAP) + 3 * (Math.round(PUFF.m * PPM) * K + PUFF_GAP), GAP + LABEL_H + LABEL_H + MAT.px[1] * K * 2 + GAP + LABEL_H + MAT.px[1] * 2 + GAP + LABEL_H],
  D: [GAP + BANDS.length * (CARD_W + GAP), GAP + LABEL_H + LABEL_H + CARD_H + GAP + LABEL_H],
});

/** A candidate's picture size: its group's, the bench's two panels a frame (F-b's bench pair four). */
export const sizeOf = (id) => { const { group, cand } = CANDIDATES[id], [w, h] = SIZE[group]; return group === 'F' ? [GAP + 2 * cand.frames.length * (F_CROP[0] + GAP), h] : [w, h]; };

/** The picture for a query (?c=<id>): a Pic with .report. */
export function picture(q = new URLSearchParams()) {
  const id = CANDIDATES[q.get('c')] ? q.get('c') : DEFAULT, { group, cand } = CANDIDATES[id], [W, H] = sizeOf(id), P = pic(W, H);
  const report = { frame: [W, H], id, group, pieces: [] };
  P.write(GAP + 1, GAP + 1, `${id}: ${cand.name}`, HEAD);
  const y = GAP + LABEL_H + LABEL_H;
  if (group === 'W') {
    P.write(GAP + 1, GAP + LABEL_H + 1, 'WINDOW 1 FROM THE APRON, 16 PX/M X3 · THE SAME AT ITS OWN SIZE', LABEL);
    const a = windowCrop(P, GAP, y, cand, K), b = windowCrop(P, GAP + W_CROP[0] + GAP, y, cand, 1);
    report.pieces.push({ what: 'window x3', px: a.px, armourer: a.armourer }, { what: 'window x1', px: b.px });
  } else if (group === 'F') {
    P.write(GAP + 1, GAP + LABEL_H + 1, `THE NORTH BENCH, 16 PX/M X3: ${cand.frames.join(' AND ').toUpperCase()} IN DAYLIGHT, THEN UNDER THE LAMPS`, LABEL);
    const panels = [...cand.frames.map(f => [f, false]), ...cand.frames.map(f => [f, true])];
    panels.forEach(([f, lit], i) => { const r = benchCrop(P, GAP + i * (F_CROP[0] + GAP), y, f, GROUPS.M[0].mat, K, lit); report.pieces.push({ what: `${f}${lit ? ' lamps' : ' day'}`, px: r.px, hands: r.hands }); });
  } else if (group === 'M') {
    P.write(GAP + 1, GAP + LABEL_H + 1, 'THE MAT BY THE CLEAN\'S PART AT X6, THEN AT X2 ON THE TABLE · THE AIR PUFF, 3 FRAMES AT 6 FPS', LABEL);
    const k6 = K * 2, step = MAT.px[0] * k6 + GAP;
    MAT.frames.forEach((name, part) => {
      const g = matFrame(part, snap(cand.mat)), X = GAP + part * step;
      g.forEach((row, j) => row.forEach((c, i) => P.fill(X + i * k6, y + j * k6, k6, k6, snap(c))));
      P.write(X, y + MAT.px[1] * k6 + 2, name, LABEL);
      // (at x2 on the table's top, under it)
      const y2 = y + MAT.px[1] * k6 + GAP + LABEL_H;
      P.fill(X - 2, y2 - 2, MAT.px[0] * 2 + 4, MAT.px[1] * 2 + 4, snap(0x6a6e62));
      g.forEach((row, j) => row.forEach((c, i) => P.fill(X + i * 2, y2 + j * 2, 2, 2, snap(c))));
      report.pieces.push({ what: `mat ${part}`, px: g.flat().length });
    });
    const n = Math.round(PUFF.m * PPM);
    for (let f = 0; f < PUFF.frames; f++) {
      const X = GAP + MAT.frames.length * step + f * (n * K + PUFF_GAP), g = puffFrame(f);
      P.fill(X, y, n * K, n * K, snap(0x6a6e62));
      let px = 0; g.forEach((row, j) => row.forEach((c, i) => { if (c !== null) { P.fill(X + i * K, y + j * K, K, K, snap(c)); px++; } }));
      P.write(X, y + n * K + 2, `${f + 1}`, LABEL);
      report.pieces.push({ what: `puff ${f}`, px });
    }
  } else {
    P.write(GAP + 1, GAP + LABEL_H + 1, 'THE WEAPON CARD BY CONDWORD\'S BAND AS THE GAME PAINTS IT AT 144 PX/M, THE WORD UNDER IT', LABEL);
    BANDS.forEach((band, i) => {
      const { P: C, dirt } = cardAt(band, cand.drawn), X = GAP + i * (CARD_W + GAP);
      P.blit(C, X, y);
      P.write(X + 2, y + CARD_H + 3, band, HEAD);
      report.pieces.push({ what: band, dirt });
    });
  }
  P.report = report;
  return P;
}
