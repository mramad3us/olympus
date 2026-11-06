// OLYMPUS art: the weapon card. The rifle side on at the close figure's density, drawn as its holder believes it (VIEWS §4.4).
//
// The step panel shows the weapon in hand as a card (the build sheet 0.0.5 §2.3 (e), §2.4: 180 × 148 px
// at the left of the panel; WEAPONS §4.2, the sheet's §8 item 27): a side view of the R-7 at the doll's
// density (CARD_PX_PER_M 144: VIEWS §4.1's 9 × 16 px/m, a 0.92 m rifle 132 px long), its muzzle to the
// right, showing only what the character knows, so the card can be wrong and the gun right:
//   - the selector: its lever toward the believed mode, its three marks (S, 1, A) beside it, the one it
//     points at lit;
//   - the magazine: in or out; in, its believed rounds behind its window (the HAD-30 has one: a stack of
//     brass to the believed count, its top dithered when the count is approximate), a magazine whose
//     count is not known showing its body with the window blind and a "?" on its baseplate;
//   - the chamber: the port's cover shut or open; a round believed in shows a glint of brass at the port
//     (its case head when the cover is open, an orange dummy when one was seen); the bolt locked back
//     shows the bolt's face at the back of an open port; a chamber never checked shows a "?" by the port;
//   - a stoppage: felt and not yet looked at (a click, a dead trigger, a shot that did not cycle), an amber
//     "!" by the port; looked at, what was seen: a case standing up out of the port (a stovepipe) or two
//     rounds in it (a double feed).
// The optic (the SO-4) and the sling are drawn as fitted; dust and carbon wait for 0.0.8.
// paintWeaponCard({ model, belief, k = 1 }) → { w, h, data, px } (a Pixmap: little-endian RGBA words,
// ImageData's order, alpha 255 or 0; px the same array, the sheet's name for it), k an integer scale.
// cardParts(belief) → the glyphs it will draw (for the tests: every glyph read from the belief alone).
// Pure: no DOM, no three.js.
import { paint } from './paint.js';
import { text, textWidth } from './font.js';
import { tone } from './tone.js';

/** The card, pixels (the hud's STEPS card: the sheet's §4). */
export const CARD_W = 180, CARD_H = 148;
/** The rifle's density on the card: the close figure's (VIEWS §4.1: 9 × 16 px/m). */
export const CARD_PX_PER_M = 144;

const BG = 0x2b2e3a, WALL = 0x383c4a, SHADOW = 0x1f2029, INK = 0x14151c;
const POLY = 0x282b34, POLY_L = 0x3e424d, STEEL = 0x6e7582, STEEL_L = 0x9aa1ae, STEEL_D = 0x49403e;
const BRASS = 0xd0ac5e, BRASS_L = 0xf0d48a, DUMMY = 0xe08a3a, AMBER = 0xe7b84a, RED = 0xb45150, MARK = 0xdad0bc, DIM = 0x565b67, SLING = 0x4c633d;
/** The HAD-30's capacity (the arms role's FAMILIES.had30.n): the window's full height. */
const MAG_N = 30;

/** What the card draws, read from the belief alone: { mag, count, approx, chamber, port, locked, mode, mark, seen }. */
export function cardParts(belief = {}) {
  const b = belief ?? {};
  const magIn = b.mag !== 'out';
  const known = magIn && Number.isFinite(b.count);
  const portOpen = b.port === true || b.port === 'open' || !!b.locked;
  const seen = b.stoppage === 'case' || b.stoppage === 'double' ? b.stoppage : b.chamber === 'case' ? 'case' : null;
  const felt = ['click', 'dead', 'felt'].includes(b.stoppage) ? b.stoppage : null;
  return {
    mag: magIn ? 'in' : 'out', count: known ? Math.max(0, Math.min(MAG_N, b.count)) : null, approx: known && !!b.countApprox,
    chamber: b.chamber ?? '?', port: portOpen ? 'open' : 'shut', locked: !!b.locked, mode: b.mode ?? 'safe',
    mark: felt ? '!' : b.chamber === '?' ? '?' : null, seen,
  };
}

// (the font has no "?" or "≈": the card's own, 3 × 5, as the font draws; the plaque's ≈)
const EXTRA = { '?': ['###', '..#', '.##', '...', '.#.'], '≈': ['.#.#', '#.#.', '....', '.#.#', '#.#.'] };
// (a word at n pixels a font pixel: the card's words at twice the letter, the runtime and design reviews': at 1×
// "SEMI" and the count were 7 screen px tall at 1600 × 900, and shrunk at 1024 × 768 they dropped columns)
function say(px, x, y, str, c, n = 1) {
  const dot = n === 1 ? px : (X, Y, w, h, col) => px(x + (X - x) * n, y + (Y - y) * n, w * n, h * n, col);
  let cx = x;
  for (const ch of String(str)) {
    const g = EXTRA[ch];
    if (g) { g.forEach((row, j) => [...row].forEach((v, i) => { if (v === '#') dot(cx + i, y + j, 1, 1, c); })); cx += g[0].length + 1; }
    else { text(dot, cx, y, ch, c); cx += textWidth(ch) + 1; }
  }
}
const sayWidth = (str) => [...String(str)].reduce((a, ch) => a + (EXTRA[ch] ? EXTRA[ch][0].length + 1 : textWidth(ch) + 1), -1);
/** The card's words' letter scale and their baseline's top (px): the mode under the stock, the count under the magazine. */
export const WORD_K = 2, WORD_Y = 112;

// (the rifle's stations along its length, metres from the butt, and its heights above and below the bore, metres)
const M = (m) => Math.round(m * CARD_PX_PER_M);

/** The card for a belief (see the header). */
export function paintWeaponCard({ model = 'r7', belief = {}, k = 1 } = {}) {
  const P = cardParts(belief);
  const base = paint(CARD_W, CARD_H, (px, w, h) => {
    // The backdrop: the doll's wall and floor (VIEWS §4.1), the rifle's shadow thrown a little right.
    px(0, 0, w, h, BG);
    px(0, 0, w, Math.round(h * 0.62), WALL);
    px(0, Math.round(h * 0.62), w, 1, tone(WALL, -0.15));
    const layer = paint(w, h, (q) => rifle(q, P, model));
    // (the shadow: the silhouette, offset, on the floor's colour)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const v = layer.data[y * w + x];
      if ((v >>> 24) >= 128 && x + 3 < w && y + 5 < h) px(x + 3, y + 5, 1, 1, SHADOW);
    }
    // (the ink outline round the rifle, then the rifle)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if ((layer.data[y * w + x] >>> 24) >= 128) continue;
      const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const X = x + dx, Y = y + dy; return X >= 0 && Y >= 0 && X < w && Y < h && (layer.data[Y * w + X] >>> 24) >= 128; });
      if (near) px(x, y, 1, 1, INK);
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const v = layer.data[y * w + x];
      if ((v >>> 24) >= 128) px(x, y, 1, 1, ((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff));
    }
    marks(px, P);
  });
  // (opaque everywhere, alpha 255: the hud puts it straight into an ImageData)
  const W = CARD_W * k, H = CARD_H * k, data = new Uint32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) data[y * W + x] = (base.data[Math.floor(y / k) * CARD_W + Math.floor(x / k)] | 0xff000000) >>> 0;
  return { w: W, h: H, data, px: data };
}

// The R-7 at CARD_PX_PER_M, its bore along y = Y0, its butt at x = X0.
const X0 = 22, Y0 = 62;
const at = (m) => X0 + M(m);

function rifle(px, P, model) {
  void model;
  // (the sling under it, stock to handguard, slack)
  for (let x = at(0.08); x < at(0.62); x++) { const t = (x - at(0.08)) / (at(0.62) - at(0.08)), y = Y0 + 14 + Math.round(Math.sin(t * Math.PI) * 9); px(x, y, 1, 2, SLING); }
  // The stock: a butt pad, the body tapering to the receiver, a cheek riser.
  for (let x = at(0); x < at(0.24); x++) {
    const t = (x - at(0)) / M(0.24), top = Math.round(Y0 - 9 + t * 4), bot = Math.round(Y0 + 10 - t * 6);
    px(x, top, 1, bot - top, POLY);
    px(x, top, 1, 1, POLY_L);
  }
  px(at(0), Y0 - 9, 3, 19, 0x14151c);
  px(at(0.07), Y0 + 1, M(0.1), 2, tone(POLY, -0.2));
  // The lower receiver: the pistol grip angled back, the trigger and its guard, the magazine well.
  for (let j = 0; j < M(0.11); j++) px(at(0.28) - Math.round(j * 0.35), Y0 + 6 + j, 6, 1, j % 5 === 0 ? POLY_L : POLY);
  px(at(0.24), Y0 + 2, M(0.25), 7, STEEL_D);
  px(at(0.24), Y0 + 2, M(0.25), 1, STEEL);
  px(at(0.33), Y0 + 9, M(0.06), 1, STEEL_D); px(at(0.39), Y0 + 7, 1, 3, STEEL_D);
  px(at(0.345), Y0 + 7, 1, 3, STEEL_L);
  // The upper receiver: the bore's body, the charging handle at its back, the port on its right side.
  px(at(0.24), Y0 - 6, M(0.28), 9, STEEL);
  px(at(0.24), Y0 - 6, M(0.28), 1, STEEL_L);
  px(at(0.24) - 3, Y0 - 6, 4, 2, STEEL_L);
  // (the forward assist and the case deflector, small)
  px(at(0.375), Y0 - 3, 3, 3, STEEL_D);
  // The handguard, vented, the gas block, the barrel, the muzzle device.
  px(at(0.52), Y0 - 5, M(0.26), 10, POLY);
  px(at(0.52), Y0 - 5, M(0.26), 1, POLY_L);
  for (let x = at(0.55); x < at(0.76); x += 5) px(x, Y0 - 2, 3, 2, 0x14151c);
  px(at(0.78), Y0 - 2, M(0.1), 4, STEEL_D);
  px(at(0.78), Y0 - 2, M(0.1), 1, STEEL);
  px(at(0.88), Y0 - 3, M(0.04), 6, STEEL_D);
  px(at(0.88), Y0 - 3, M(0.04), 1, STEEL_L);
  // The SO-4 on its mount: the tube, the turret, the objective's bell, the glass.
  px(at(0.31), Y0 - 10, M(0.18), 4, STEEL_D);
  px(at(0.30), Y0 - 16, M(0.2), 6, POLY);
  px(at(0.30), Y0 - 16, M(0.2), 1, POLY_L);
  px(at(0.47), Y0 - 18, M(0.04), 10, POLY);
  px(at(0.39), Y0 - 19, 4, 3, POLY_L);
  px(at(0.51) - 1, Y0 - 17, 1, 8, 0x3c5d84);
  px(at(0.30) - 1, Y0 - 15, 1, 4, 0x3c5d84);
  // The magazine: in its well, curving forward, its window to the count believed.
  if (P.mag === 'in') magazine(px, P);
  else px(at(0.40), Y0 + 8, M(0.07), 2, 0x14151c);
  // The selector, above the grip: its lever toward the believed mode.
  const sx = at(0.30), sy = Y0 + 4;
  px(sx - 1, sy - 1, 3, 3, STEEL_D);
  const lever = { safe: [1, 0], semi: [0, -1], auto: [-1, 0] }[P.mode] ?? [1, 0];
  for (let i = 1; i <= 4; i++) px(sx + lever[0] * i - (lever[1] ? 0 : 0), sy + lever[1] * i, lever[1] ? 2 : 1, lever[1] ? 1 : 2, i === 4 ? MARK : STEEL_L);
  // The ejection port: its cover shut or open; what is seen in it.
  const portX = at(0.40), portY = Y0 - 3, portW = M(0.08), portH = 4;
  if (P.port === 'open') {
    px(portX, portY, portW, portH, 0x14151c);
    px(portX, portY + portH, portW, 2, STEEL_L);                                 // (the cover, hinged down)
    if (P.locked) { px(portX, portY, 3, portH, STEEL_L); px(portX + 3, portY, 1, portH, STEEL); }   // (the bolt's face, back)
    if (!P.seen && (P.chamber === 'live' || P.chamber === 'dud')) {
      const c = P.chamber === 'dud' ? DUMMY : BRASS;
      px(portX + portW - 6, portY + 1, 5, 2, c); px(portX + portW - 6, portY + 1, 5, 1, P.chamber === 'dud' ? tone(DUMMY, 0.2) : BRASS_L);
    }
  } else {
    px(portX, portY, portW, portH, STEEL_D);
    px(portX, portY, portW, 1, STEEL_L);
    if (P.chamber === 'live' || P.chamber === 'dud') px(portX + portW - 2, portY + portH - 1, 2, 1, P.chamber === 'dud' ? DUMMY : BRASS_L);   // (the glint at the cover's edge)
  }
  if (P.seen === 'case') {
    // (a stovepipe: the spent case standing up out of the port, its mouth up)
    px(portX + portW - 7, portY - 8, 4, 9, BRASS);
    px(portX + portW - 7, portY - 8, 4, 1, BRASS_L); px(portX + portW - 4, portY - 8, 1, 9, tone(BRASS, -0.2));
  } else if (P.seen === 'double') {
    // (a double feed: two rounds in the port, one over the other, their tips crossed)
    px(portX + 1, portY, portW - 2, 2, BRASS); px(portX + portW - 3, portY, 2, 2, 0xc28b4a);
    px(portX + 2, portY + 2, portW - 3, 2, BRASS_L); px(portX + portW - 2, portY + 2, 2, 2, 0xc28b4a);
  }
}

function magazine(px, P) {
  // (the HAD-30's body, 0.21 m long, curving forward; a polymer window along its side)
  const len = M(0.21), w = 9;
  const cells = [];
  for (let j = 0; j < len; j++) {
    const t = j / len, x = at(0.40) + Math.round(t * t * 14), y = Y0 + 8 + j;
    px(x, y, w, 1, POLY);
    px(x, y, 1, 1, POLY_L);
    cells.push([x + 3, y]);
  }
  const bx = cells.at(-1)[0] - 3, by = cells.at(-1)[1] + 1;
  px(bx - 1, by, w + 2, 3, POLY_L);                                              // (the baseplate)
  // (the window: a strip down the body; the rounds believed in it, from the top, brass)
  const top = 3, rows = len - top - 4;
  for (let j = 0; j < rows; j++) { const [x, y] = cells[top + j]; px(x, y, 3, 1, 0x1d2b46); }
  if (P.count === null) {
    say(px, bx + 3, by - 9, '?', AMBER);
    return;
  }
  const fill = Math.round(rows * P.count / MAG_N);
  for (let j = 0; j < fill; j++) {
    const [x, y] = cells[top + j], last = j >= fill - 2 && P.approx;
    if (last && (x + y) % 2) continue;                                          // (an approximate count: its top dithered)
    px(x, y, 3, 1, j % 2 ? BRASS : BRASS_L);
  }
}

function marks(px, P) {
  // The selector's marks round its pivot (S forward, 1 up, A back: a dot each, the believed one lit), and
  // the mode's word on the floor under the stock, white on safe and red off it.
  const sx = at(0.30), sy = Y0 + 4, dots = { safe: [sx + 6, sy], semi: [sx, sy - 6], auto: [sx - 6, sy] };
  for (const [mode, [x, y]] of Object.entries(dots)) px(x, y, 1, 1, mode === P.mode ? (mode === 'safe' ? MARK : RED) : DIM);
  const word = { safe: 'SAFE', semi: 'SEMI', auto: 'AUTO' }[P.mode] ?? String(P.mode).toUpperCase();
  say(px, X0 - 6, WORD_Y, word, P.mode === 'safe' ? MARK : RED, WORD_K);
  // The port's "?" (never checked) or "!" (a stoppage felt, not yet looked at), above the receiver over the port.
  if (P.mark) say(px, at(0.43), Y0 - 13, P.mark, AMBER);
  // The magazine's believed count beside its baseplate ("≈" when it is a guess), "MAG OUT" with none, in the
  // words' colour (it had been the dim grey of an unlit mark, hard to read on the slate).
  const label = P.mag === 'out' ? 'MAG OUT' : P.count === null ? '' : `${P.approx ? '≈' : ''}${P.count}`;
  if (label) say(px, P.mag === 'out' ? CARD_W - 4 - sayWidth(label) * WORD_K : at(0.40) + 14, WORD_Y, label, MARK, WORD_K);
}
