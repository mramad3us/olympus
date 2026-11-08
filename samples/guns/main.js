// OLYMPUS sample: the rifles' drawings, on the weapon card and on the chibi at 16 px/m, for the user to star and score (the user, 2026-11-08: "Martian standard issue would look more like [the first reference], but we would have varyiety in the guns marines carry like [the second]").
//
// Each candidate of src/art/rifles.js (RIFLE_DRAWINGS: g0 the R-7 as the game draws it (v0.0.9's drawing, unchanged in v0.0.10), g1 and g2 the standard issue,
// v1 the variety carbine, m1 a squad marksman's look for the R-7M) drawn by the game's own code, the drawing named outright (the game's R-7 stays g0 until the
// user picks: rifles.js DRAWN_AS). ?d= picks the drawing, ?set= the picture:
//   card     the weapon card (src/art/weaponcard.js paintWeaponCard({ drawing })) in three beliefs side by side: on the
//            line (a magazine of 28 known, a round chambered, on semi); at 300 m (the lever at 4×, the turrets off the
//            zero, the dope, a hold, a magazine of about 12 believed tracer); and a stoppage looked at (a stovepipe in
//            the open port, the magazine out and one of 5 tracer in the hand);
//   figures  the chibi in utilities (compose.js and shade.js, as the atlas paints a frame) in five poses, prone, kneeling,
//            standing aimed, the low ready and slung on the back, each facing right, left, down and up on the bay's
//            dark floor, then right and left again on the valley's regolith (where furniture in a tan might vanish); and
//            at the right the rifle alone at 16 px/m, the same four times larger, and at 24 px/m, and the close figure
//            (the doll) with the rifle in hand.
// The picture is drawn at its own size (sample.json's pixel) and scaled up by a whole number to fill the window, so the
// gallery shoots it crisply. The figures, their ground and the rifle alone are snapped to the Mars palette as the stage's
// post pass snaps them (src/art/palette.js nearest(), the post pass's metric; every place in the game is on Mars so far,
// the squad bay included), so the user scores what the game shows (the judge, 2026-11-08: the raw colours had hidden two
// merges); the stage's light and grade come before its snap and are not applied here. The card and the doll are drawn
// into the page, not the stage, and are never snapped: they stay raw, as in the game. ?snap=0 shows the figures raw.
// window.__report.frame is its size, window.__ready true once drawn.
import { paintWeaponCard, CARD_W, CARD_H } from '../../src/art/weaponcard.js';
import { composeFrame } from '../../src/art/figures/compose.js';
import { shade } from '../../src/art/figures/shade.js';
import { wear, coloursOf } from '../../src/art/figures/outfits.js';
import { shapeAt } from '../../src/art/figures/templates.js';
import { text } from '../../src/art/font.js';
import { RIFLE_DRAWINGS } from '../../src/art/rifles.js';
import { GROUND } from '../../src/art/terrain/ground.js';
import { doll } from '../../src/art/doll/doll.js';
import { PALETTES, nearest } from '../../src/art/palette.js';

const params = new URLSearchParams(location.search), set = params.get('set') ?? 'card';
const D = RIFLE_DRAWINGS[params.get('d') ?? 'g0'] ?? RIFLE_DRAWINGS.g0;
/** Each set's picture size (sample.json's pixel). */
export const SIZE = Object.freeze({ card: [4 + 3 * (CARD_W + 4), CARD_H + 8], figures: [304, 270] });
const BG = 0x0e0f14, FLOOR = 0x34363f, LABEL = 0x8b909b;

const [W, H] = SIZE[set] ?? SIZE.card;
const buf = new Uint32Array(W * H).fill(0xff000000 | abgr(BG));
function abgr(c) { return ((c & 0xff) << 16) | (c & 0xff00) | ((c >>> 16) & 0xff); }
// (the stage's snap, a colour at a time, remembered: only the figures' pixels go through it)
const SNAPPED = new Map(), snapOn = set === 'figures' && params.get('snap') !== '0';
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

if (set === 'card') {
  const beliefs = [
    [{ mag: 'in', count: 28, chamber: 'live', mode: 'semi' }, {}],
    [{ mag: 'in', count: 12, countApprox: true, magLoad: 'tracer', chamber: 'live', mode: 'semi', optic: 4, sight: { elev: -3, wind: 1 }, dope: { 300: { elev: -3, wind: 0 } } }, { distance: true, line: 300, hold: { xMil: 0.5, yMil: 0 } }],
    [{ mag: 'out', hand: { n: 5, load: 'tracer' }, chamber: 'case', stoppage: 'case', port: 'open', mode: 'safe' }, {}],
  ];
  beliefs.forEach(([belief, opts], i) => blit(paintWeaponCard({ drawing: D.id, belief, ...opts }), 4 + i * (CARD_W + 4), 4));
} else {
  const POSES = [['prone', 'PRONE', 50], ['kneel', 'KNEEL', 34], ['aim', 'STAND', 34], ['lowReady', 'LOW', 34], ['slungBack', 'SLUNG', 34]];
  const ROWS = [['right', 38, FLOOR], ['left', 38, FLOOR], ['down', 50, FLOOR], ['up', 50, FLOOR], ['right', 38, GROUND.regolith], ['left', 38, GROUND.regolith]];
  const L = wear({ outfit: 'utilities', weapon: 'rifle', carry: 'low', model: D.id, seed: 3, skin: 'tan', hair: { style: 'highTight', color: 'dark' } });
  const col = coloursOf(L, 16);
  let x = 4;
  for (const [, label, cw] of POSES) { say(x + 2, 3, label); x += cw; }
  let y = 11;
  for (const [dir, rh, ground] of ROWS) {
    fill(4, y, 186, rh, snap(ground));
    let cx = 4;
    for (const [frame, , cw] of POSES) {
      // (each frame by what it draws: its pixels centred in the column, their lowest row on the row's ground)
      const fr = composeFrame(L, dir, frame, { ppm: 16 }), pm = shade(fr.cells, col), b = bbox(pm);
      blit(pm, cx + Math.round((cw - (b.x1 - b.x0 + 1)) / 2) - b.x0, y + rh - 2 - b.y1, 1, snap);
      cx += cw;
    }
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
  say(284, 15, D.id.toUpperCase()); if (snapOn) say(254, 23, 'MARS');
  // (the close figure with the rifle in hand, as the doll draws it: src/art/doll/doll.js; raw, as the page shows it)
  blit(doll({ look: { outfit: 'utilities', skin: 'tan', hair: { style: 'highTight', color: 'dark' }, model: D.id }, hand: 'rifle', scale: 1 }), 200, 116);
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
window.__report = { frame: [W, H], set, drawing: D.id, snapped: snapOn ? 'mars' : null };
requestAnimationFrame(() => requestAnimationFrame(() => { window.__ready = true; }));
