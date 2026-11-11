// OLYMPUS sample: the rifles' designs in their finishes, on the weapon card and on the chibi at 16 px/m, as the user's picks of 2026-11-08 made them.
//
// The user's scores of v0.0.11's gun samples (DESIGN.md's log, 2026-11-08): G2 the standard issue "with the scope of the V1"
// and "no green arch", in "multiple colors so we can equip ourselves to camo in environments depending on deployments"; G1 kept
// as an alternate; G0 purged; V1 kept, "in black" a contender; M1 the marksman's rifle. Each design of src/art/rifles.js
// (RIFLE_DESIGNS: r7 the R-7 as the game draws it now, g1, v1, m1 the R-7M's) drawn by the game's own code in a finish of
// src/data/finishes.js. ?d= picks the design, ?f= the finish (none: the issue's, the Corps' black), ?set= the picture:
//   card      the weapon card (src/art/weaponcard.js paintWeaponCard({ drawing, finish })) in three beliefs side by side: on
//             the line (a magazine of 28 known, a round chambered, on semi, the lever believed at 1×); at 300 m (the lever at
//             4×, the turrets off the zero, the dope, a hold, a magazine of about 12 believed tracer); and a stoppage looked at
//             (a stovepipe in the open port, the magazine out and one of 5 tracer in the hand);
//   figures   the chibi in utilities (compose.js and shade.js, as the atlas paints a frame) in five poses, prone, kneeling,
//             standing aimed, the low ready and slung on the back, each facing right, left, down and up on the bay's dark
//             floor, then right and left again on the valley's regolith; and at the right the rifle alone at 16 px/m, the same
//             four times larger, and at 24 px/m, and the close figure (the doll) with the rifle in hand;
//   finishes  every finish of the design side by side, each its card on the line and the chibi aimed and prone on the bay's
//             floor and on the regolith, so the camouflage is judged on the ground it is for.
// The picture is drawn at its own size (sample.json's pixel) and scaled up by a whole number to fill the window, so the
// gallery shoots it crisply. The figures, their ground and the rifle alone are snapped to the Mars palette as the stage's
// post pass snaps them (src/art/palette.js nearest(), the post pass's metric), so the user scores what the game shows; the
// stage's light and grade come before its snap and are not applied here. The card and the doll are drawn into the page, not
// the stage, and are never snapped: they stay raw, as in the game. ?snap=0 shows the figures raw.
// window.__report.frame is its size, window.__ready true once drawn.
import { paintWeaponCard, CARD_W, CARD_H } from '../../src/art/weaponcard.js';
import { composeFrame } from '../../src/art/figures/compose.js';
import { shade } from '../../src/art/figures/shade.js';
import { wear, coloursOf } from '../../src/art/figures/outfits.js';
import { shapeAt } from '../../src/art/figures/templates.js';
import { text } from '../../src/art/font.js';
import { RIFLE_DESIGNS, drawingOf } from '../../src/art/rifles.js';
import { FINISH_IDS, finishId } from '../../src/data/finishes.js';
import { GROUND } from '../../src/art/terrain/ground.js';
import { doll } from '../../src/art/doll/doll.js';
import { PALETTES, nearest } from '../../src/art/palette.js';

const params = new URLSearchParams(location.search), set = params.get('set') ?? 'card';
const id = RIFLE_DESIGNS[params.get('d')] ? params.get('d') : 'r7', fin = finishId(params.get('f')), D = drawingOf(id, fin);
/** The finishes sheet's tiles: four across, each a label row, the card and a strip of figures. */
const TILE_W = CARD_W + 4, TILE_H = 8 + CARD_H + 46, ACROSS = 4;
/** Each set's picture size (sample.json's pixel). */
export const SIZE = Object.freeze({ card: [4 + 3 * (CARD_W + 4), CARD_H + 8], figures: [304, 270], finishes: [4 + ACROSS * TILE_W, 4 + Math.ceil(FINISH_IDS.length / ACROSS) * TILE_H] });
const BG = 0x0e0f14, FLOOR = 0x34363f, LABEL = 0x8b909b;

const [W, H] = SIZE[set] ?? SIZE.card;
const buf = new Uint32Array(W * H).fill(0xff000000 | abgr(BG));
function abgr(c) { return ((c & 0xff) << 16) | (c & 0xff00) | ((c >>> 16) & 0xff); }
// (the stage's snap, a colour at a time, remembered: only the figures' pixels go through it)
const SNAPPED = new Map(), snapOn = (set === 'figures' || set === 'finishes') && params.get('snap') !== '0';
const snap = (c) => { if (!snapOn) return c; if (!SNAPPED.has(c)) SNAPPED.set(c, nearest(c, PALETTES.mars)); return SNAPPED.get(c); };
const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) buf[y * W + x] = 0xff000000 | abgr(c); };
const fill = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, c); };
const say = (x, y, s, c = LABEL) => text((X, Y, w, h, col) => fill(X, Y, w, h, col), x, y, s, c);
// (a Pixmap of paint.js words, little-endian RGBA, at (x0, y0), scaled k times; its holes left; snapped when `f` is snap)
function blit(pm, x0, y0, k = 1, f = (c) => c) {
  for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) {
    const v = pm.data[y * pm.w + x];
    if ((v >>> 24) >= 128) fill(x0 + x * k, y0 + y * k, k, k, f(((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff)));
  }
}

/** The rows and columns a Pixmap draws. */
function bbox(pm) {
  let x0 = pm.w, x1 = -1, y0 = pm.h, y1 = -1;
  for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) if ((pm.data[y * pm.w + x] >>> 24) >= 128) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return { x0, x1, y0, y1 };
}
/** A chibi in utilities holding the design in a finish. */
const lookFor = (finish) => wear({ outfit: 'utilities', weapon: 'rifle', carry: 'low', model: id, finish, seed: 3, skin: 'tan', hair: { style: 'highTight', color: 'dark' } });
/** A frame drawn centred in a column cw wide, its lowest row on the ground's row y + rh - 2. */
function frameAt(L, col, dir, frame, cx, cw, y, rh) {
  const fr = composeFrame(L, dir, frame, { ppm: 16 }), pm = shade(fr.cells, col), b = bbox(pm);
  blit(pm, cx + Math.round((cw - (b.x1 - b.x0 + 1)) / 2) - b.x0, y + rh - 2 - b.y1, 1, snap);
}

const ON_LINE = [{ mag: 'in', count: 28, chamber: 'live', mode: 'semi' }, {}];
if (set === 'card') {
  const beliefs = [
    ON_LINE,
    [{ mag: 'in', count: 12, countApprox: true, magLoad: 'tracer', chamber: 'live', mode: 'semi', optic: 4, sight: { elev: -3, wind: 1 }, dope: { 300: { elev: -3, wind: 0 } } }, { distance: true, line: 300, hold: { xMil: 0.5, yMil: 0 } }],
    [{ mag: 'out', hand: { n: 5, load: 'tracer' }, chamber: 'case', stoppage: 'case', port: 'open', mode: 'safe' }, {}],
  ];
  beliefs.forEach(([belief, opts], i) => blit(paintWeaponCard({ drawing: id, finish: fin, belief, ...opts }), 4 + i * (CARD_W + 4), 4));
} else if (set === 'finishes') {
  FINISH_IDS.forEach((f, i) => {
    const x = 4 + (i % ACROSS) * TILE_W, y = 4 + Math.floor(i / ACROSS) * TILE_H;
    say(x + 1, y, f.toUpperCase());
    blit(paintWeaponCard({ drawing: id, finish: f, belief: ON_LINE[0] }), x, y + 8);
    // (the chibi aimed and prone, on the bay's floor and on the regolith)
    const L = lookFor(f), col = coloursOf(L, 16), gy = y + 8 + CARD_H + 2;
    fill(x, gy, CARD_W / 2 - 1, 40, snap(FLOOR)); fill(x + CARD_W / 2 + 1, gy, CARD_W / 2 - 1, 40, snap(GROUND.regolith));
    for (const k of [0, 1]) {
      frameAt(L, col, 'right', 'aim', x + k * (CARD_W / 2 + 1), 34, gy, 40);
      frameAt(L, col, 'right', 'prone', x + k * (CARD_W / 2 + 1) + 34, 54, gy, 40);
    }
  });
} else {
  const POSES = [['prone', 'PRONE', 50], ['kneel', 'KNEEL', 34], ['aim', 'STAND', 34], ['lowReady', 'LOW', 34], ['slungBack', 'SLUNG', 34]];
  const ROWS = [['right', 38, FLOOR], ['left', 38, FLOOR], ['down', 50, FLOOR], ['up', 50, FLOOR], ['right', 38, GROUND.regolith], ['left', 38, GROUND.regolith]];
  const L = lookFor(fin), col = coloursOf(L, 16);
  let x = 4;
  for (const [, label, cw] of POSES) { say(x + 2, 3, label); x += cw; }
  let y = 11;
  for (const [dir, rh, ground] of ROWS) {
    fill(4, y, 186, rh, snap(ground));
    let cx = 4;
    for (const [frame, , cw] of POSES) { frameAt(L, col, dir, frame, cx, cw, y, rh); cx += cw; }
    y += rh + 1;
  }
  // The rifle alone: its template at 16 px/m (the magazine in), the same four times larger, at 24 px/m; outlined as the figure is.
  const alone = (lenPx, acrossK) => {
    const cells = shapeAt('rifle', lenPx, acrossK, true, D.fig);
    const xs = cells.map(c => c[0]), ys = cells.map(c => c[1]), a0 = Math.min(...xs), b0 = Math.min(...ys);
    const w = Math.max(...xs) - a0 + 3, h = Math.max(...ys) - b0 + 3, grid = Array.from({ length: h }, () => Array(w).fill(null));
    for (const [a, b, ch] of cells) grid[b - b0 + 1][a - a0 + 1] = { ch, part: 1 };
    return shade(grid, col);
  };
  const p16 = alone(16, 1), p24 = alone(24, 1.5);
  fill(196, 11, 104, 255, snap(FLOOR));
  say(200, 15, '16 PX/M'); blit(p16, 200, 23, 1, snap);
  say(200, 40, '16 PX/M X4'); blit(p16, 200, 48, 4, snap);
  say(200, 48 + p16.h * 4 + 6, '24 PX/M'); blit(p24, 200, 48 + p16.h * 4 + 14, 1, snap);
  say(270, 15, id.toUpperCase()); say(200, 108, fin.toUpperCase()); if (snapOn) say(254, 23, 'MARS');
  // (the close figure with the rifle in hand, as the doll draws it: src/art/doll/doll.js; raw, as the page shows it)
  blit(doll({ look: { outfit: 'utilities', skin: 'tan', hair: { style: 'highTight', color: 'dark' }, model: id, finish: fin }, hand: 'rifle', scale: 1 }), 200, 116);
  say(268, 240, 'DOLL');
}

const cv = document.getElementById('pic'), g = cv.getContext('2d');
cv.width = W; cv.height = H;
const img = g.createImageData(W, H);
new Uint32Array(img.data.buffer).set(buf);
g.putImageData(img, 0, 0);
function fit() {
  const k = Math.max(1, Math.floor(Math.min(innerWidth / W, innerHeight / H)));
  cv.style.width = `${W * k}px`; cv.style.height = `${H * k}px`;
}
fit();
addEventListener('resize', fit);
window.__report = { frame: [W, H], set, drawing: id, finish: fin, snapped: snapOn ? 'mars' : null };
requestAnimationFrame(() => requestAnimationFrame(() => { window.__ready = true; }));
