// OLYMPUS samples: the portrait sets' shared drawing (the build sheet v0.0.23 §1 item 8, E; P§6 of the portraits lens), pure.
//
// The portrait sets (samples/portrait-gun, portrait-light, portrait-suit, truth-cards) draw their candidates with the game's own
// doll and card code (src/art/doll: doll(), worn.js's stamps, hitcard.js's geometry and paintHitcard) and only sample-local code
// over them, so the game is unchanged until the user scores (the method's numbered samples). This folder has no sample.json, so
// the gallery shoots nothing here; the sets import it.
//   - Pic: a picture of whole pixels (0xrrggbb), put, fill, a doll's or a card's Pixmap blitted on it, the 3 × 5 alphabet.
//   - The gun's own pixels on the doll: from the portraits round (C's), the doll marks them itself (pm.held, the part set of what
//     the hands hold) and that is read first (heldOf); before it, doll.js drew the rifle and the pistol as parts of its grid and
//     returned only the finished picture, so this module recomputes their stamps (worn.js rifleStamp, the R-7 exactly as the doll draws it; the
//     P-12 as worn.js pistolAt draws it, written here) and marks a pixel of the doll as the gun's where the doll's colour there
//     is the stamp's, or the stamp's darkened by the doll's seam (mix with INK at 0.55): the arms and fists drawn over the gun
//     are never the gun's. (The portraits lens's prototype marked the gun by a diff with an empty-handed doll, so the bent arms
//     and the holster were darkened too, P§3.3; C's build marks the gun by its part, g.held.)
//   - boardFigure(face, holds, where): the board's painted man (hitcard.js boardGear's and boardLook's, written here: a
//     sample imports no hidden function) holding his gun at the low ready ('ready', W1: the rifle across the body, the pistol
//     between both fists at the belly, as the stage paints a turner's hold) or hanging from the right hand ('hand', today's);
//     the hostage's hostile is drawn by hostageFigure with his gun beside her head (H1) or his rifle up beside her (H2).
//   - boardCard(...): paintHitcard's board, its ground, figure, stakes, zones, words and frame, written here so the figure's
//     gun can be toned by the candidate: 'today' the board's two tones (the gun with them), G1 the gun in the board's dark ink
//     (PORTRAIT_HOLD's 0x2a2216, its lit pixels 0x3d3220), G2 the gun in its own colours, G3 the ink with a one-pixel khaki
//     rim on the pixels round it. It reports the gun's pixels on the card in the gun's tone and the share of the gun's pixels
//     inside the card's figure rows (P§8's GUN_PX_MIN 12 at the near band and GUN_IN_CROP_K 0.9).
//   - manCard(...): a man's card (a live man in his own colours on the card's dark, no stakes or zones), with his figure's mask
//     and the hands' box, for the light, the jamb and the veiled hands to be drawn over (portrait-light).
import { doll, backdropAt } from '../../src/art/doll/doll.js';
import { dressedDoll } from '../../src/art/doll/dress.js';
import { rifleStamp } from '../../src/art/doll/worn.js';
import { INK, mix, lum, cloth, flesh, REF } from '../../src/art/doll/grid.js';
import { HIT_C, figGeom, figAt, bandOf, zonesOnCard, wordsRows, STAKE_W_PX, WORDS_K, WORDS_ROW_PX, CARD_W, CARD_H, ZONES_K, HIT_SCALE, HOSTAGE_DX_PX, FIG_ROWS } from '../../src/art/doll/hitcard.js';
import { shapeAt, turned } from '../../src/art/figures/templates.js';
import { pistolDrawingOf, P12_LEN_M } from '../../src/art/pistols.js';
import { drawingOf } from '../../src/art/rifles.js';
import { SKIN } from '../../src/art/figures/outfits.js';
import { glyphOf } from '../../src/art/font.js';
import { PAPERS } from '../../src/sim/arms/paper.js';

/** The gun's tones on the board by candidate (G1 the default: PORTRAIT_HOLD's ink and its lit pixels, the build sheet §3.3). */
export const PORTRAIT_HOLD = Object.freeze({ ink: 0x2a2216, lit: 0x3d3220 });
export const TONES_G = Object.freeze(['today', 'G1', 'G2', 'G3']);
/** P§8's gauges, written here: the gun's pixels in its tone at the near band (scaled by the band's px a metre), the share inside the crop. */
export const GUN_PX_MIN = 12, GUN_IN_CROP_K = 0.9;
/** W2's crop (P§6.1): the card's figure rows lowered to the knee, 4 to 150 at the near band. */
export const W2_ROWS = Object.freeze([4, 150]);
/** A gun's pixel is lit (G1's lit tone) above this luminance (the stamp's base and light tones; its lower edge's shade is darker). */
const LIT_LUM = 80;

// (doll.js's, written here: the figure drawn from row 0 then set down DROP reference rows; BODY.m's hand and the arm's cuff)
const DROP = 2, MID = REF.W / 2, PX_PER_CM = 0.72;
const BODY_M = Object.freeze({ hand: 19.2, armIn: Object.freeze([Object.freeze([16.2, 70])]) });
export const hexOf = (v) => ((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff);
export const wordOf = (c) => (0xff000000 | ((c & 0xff) << 16) | (c & 0xff00) | ((c >>> 16) & 0xff)) >>> 0;

// ---------- a picture of whole pixels ----------
/** A picture w × h (0xrrggbb a pixel), filled with bg. */
export function pic(w, h, bg = 0x0e0f14) {
  const col = new Int32Array(w * h).fill(bg);
  const P = {
    w, h, col,
    put(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < w && y < h) col[y * w + x] = c; },
    get(x, y) { return x >= 0 && y >= 0 && x < w && y < h ? col[y * w + x] : null; },
    fill(x, y, ww, hh, c) { for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) P.put(x + i, y + j, c); },
    /** A Pixmap ({ w, h, data } words) or a Pic at (x0, y0). */
    blit(pm, x0, y0) {
      if (pm.col) { for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) P.put(x0 + x, y0 + y, pm.col[y * pm.w + x]); return; }
      for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) P.put(x0 + x, y0 + y, hexOf(pm.data[y * pm.w + x]));
    },
    /** The 3 × 5 alphabet at k pixels a font pixel; returns the x after it. */
    write(x, y, str, c, k = 1) {
      for (const ch of String(str).toUpperCase()) { const g = ch === '·' ? DOT : glyphOf(ch); g.forEach((row, j) => [...row].forEach((b, i) => { if (b === '1') P.fill(x + i * k, y + j * k, k, k, c); })); x += (g[0].length + 1) * k; }
      return x;
    },
  };
  return P;
}
const DOT = Object.freeze(['0', '0', '1', '0', '0']);
/** A string's width in the alphabet at k. */
export const textW = (str, k = 1) => Math.max(0, [...String(str).toUpperCase()].reduce((a, ch) => a + ((ch === '·' ? DOT : glyphOf(ch))[0].length + 1) * k, -k));

// ---------- the gun's own pixels on the doll ----------
/** The R-7's stamp on the doll at scale S for a place ('ready', 'hand', 'front', 'back'): [[x, y, colour]] in the doll's grid. */
export function rifleCells(S, place, mag = true) { return rifleStamp('r7', undefined, S, place, BODY_M, MID, mag); }
/** The P-12's stamp as worn.js pistolAt draws it ('ready' at the belly between both fists, 'hand' hanging from the right hand). */
export function pistolCells(S, place, mag = true) {
  const D = pistolDrawingOf('p12'), len = Math.round(P12_LEN_M * 100 * PX_PER_CM * S * (place === 'ready' ? 0.7 : 1));
  const shape = shapeAt('pistol', len, 1.6 * S, mag, D?.fig ?? null), C = { n: cloth(0x3a3d48), u: cloth(0x23252f), v: cloth(0x8a909c) };
  const [x0, y0] = place === 'ready' ? [MID * S, 57 * S] : [(MID - BODY_M.hand) * S, (BODY_M.armIn[0][1] + 2) * S];
  return turned(shape, x0, y0, Math.PI / 2, false).map(([x, y, ch]) => { const T = C[ch] ?? C.n; return [Math.round(x), Math.round(y), x > x0 + S ? T.shade : T.base]; });
}
/** Which pixels of a doll Pixmap are the gun's (see the header): a Uint8Array over the Pixmap, and how many. */
export function gunMask(pm, cells, scale) {
  const out = new Uint8Array(pm.w * pm.h), last = new Map(), drop = Math.round(DROP * scale);
  for (const [x, y, c] of cells) last.set(`${x},${y}`, c);
  let n = 0;
  for (const [k, c] of last) {
    const [x, y0] = k.split(',').map(Number), y = y0 + drop;
    if (x < 0 || y < 0 || x >= pm.w || y >= pm.h) continue;
    const i = y * pm.w + x, here = hexOf(pm.data[i]);
    if (here === c || here === mix(c, INK, 0.55)) { out[i] = 1; n++; }
  }
  return { gun: out, n };
}
/** The gun's pixels as the doll marks them (pm.held, the portraits round's), else by the stamps: { gun, n } (gunMask's shape). */
export function heldOf(pm, cells, scale) {
  if (!pm.held) return gunMask(pm, cells, scale);
  const gun = new Uint8Array(pm.w * pm.h);
  let n = 0;
  for (let i = 0; i < gun.length; i++) if (pm.held[i]) { gun[i] = 1; n++; }
  return { gun, n };
}
/** The figure's pixels (its ink round it included): those that are not the doll's wall and floor (hitcard.js maskOf's). */
export function figureMask(pm, scale) {
  const mask = new Uint8Array(pm.w * pm.h);
  for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) mask[y * pm.w + x] = hexOf(pm.data[y * pm.w + x]) !== backdropAt(x, y, scale) ? 1 : 0;
  return mask;
}

// ---------- the board's painted man ----------
/** hitcard.js boardLook's, written here. */
export const boardLook = (face) => (face === 'armoured' ? { outfit: 'carrier', skin: 'tan', hair: { style: 'highTight', color: 'dark' } } : { outfit: 'utilities', skin: face === 'noshoot' || face === 'hostage' ? 'light' : 'tan', head: null, hair: { style: 'medium', color: 'dark' } });
/** What a face's hand holds on the board (hitcard.js boardGear's rule): 'rifle', 'pistol', 'phone' or null. */
export function boardHolds(face, holds) {
  if (holds === 'unseen' || face === 'unknown' || face === 'hostage') return null;
  if (holds === 'pistol') return 'pistol';
  if (face === 'armoured' || holds === 'rifle') return 'rifle';
  if (holds === 'phone') return 'phone';
  return null;
}
/** The board's man at a doll scale with his gun at `where` ('ready' W1, 'hand' today's and W2): { pm, mask, gun, gunN }. */
export function boardFigure(face, holds, where = 'ready', scale = HIT_SCALE) {
  const what = boardHolds(face, holds), args = { look: boardLook(face), sex: 'm', scale };
  let cells = [];
  if (what === 'rifle') {
    if (where === 'hand') args.hand = 'rifle'; else args.gear = { rifle: { model: 'r7', finish: null, place: 'ready', mag: true }, painted: true };
    cells = rifleCells(scale, where === 'hand' ? 'hand' : 'ready');
  } else if (what === 'pistol') {
    args.gear = { pistol: { model: 'p12', place: where === 'hand' ? 'hand' : 'ready', mag: true }, painted: true };
    cells = pistolCells(scale, where === 'hand' ? 'hand' : 'ready');
  } else if (what === 'phone') args.gear = { held: 'phone', painted: true };
  const pm = doll(args), { gun, n } = heldOf(pm, cells, scale);
  return { pm, mask: figureMask(pm, scale), gun, gunN: n };
}

/**
 * The hostage card's two painted men (hitcard.js dollFor('hostage')'s composition, written here), the hostile's gun hand drawn
 * by this module beside her head on the side away from her: 'today' his pistol hanging from his hand (v0.0.22's: hidden behind
 * her), 'H1' his fist at her head, the P-12 level at her temple, 'H2' his rifle up beside her shoulder, the muzzle high.
 * side 'right' puts the hostile at the viewer's right. { pm, mask, gun, gunN }.
 */
export function hostageFigure(variant = 'H1', scale = HIT_SCALE, side = 'right') {
  const today = variant === 'today';
  const back = today ? doll({ look: boardLook('threat'), sex: 'm', gear: { pistol: { model: 'p12', place: 'hand', mag: true }, painted: true }, scale }) : doll({ look: boardLook('threat'), sex: 'm', scale });
  const front = doll({ look: boardLook('hostage'), sex: 'm', scale });
  const k = scale / HIT_SCALE, dx = (side === 'left' ? 1 : -1) * Math.round(HOSTAGE_DX_PX * k), dy = Math.round(3 * k), fm = figureMask(front, scale);
  const W = back.w, H = back.h, data = new Uint32Array(back.data), gun = new Uint8Array(W * H);
  // (his gun before the mirror and the hostage over him: today's pistol is the stamp's)
  const g0 = today ? gunMask(back, pistolCells(scale, 'hand'), scale).gun : new Uint8Array(W * H);
  gun.set(g0);
  if (side !== 'left') for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { data[y * W + x] = back.data[y * W + W - 1 - x]; gun[y * W + x] = g0[y * W + W - 1 - x]; }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, sx = x - dx, sy = y - dy, j = sy * front.w + sx;
    if (sx < 0 || sy < 0 || sx >= front.w || sy >= front.h || !fm[j]) continue;
    data[i] = front.data[j]; gun[i] = 0;
  }
  const pm = { ...back, data };
  if (!today) armAndGun(pm, gun, variant, scale, side, dx, dy);
  const mask = figureMask(pm, scale);
  let n = 0; for (const v of gun) n += v;
  return { pm, mask, gun, gunN: n };
}
// (the hostile's arm, fist and gun beside the hostage's head, drawn over the composite; ink round what is new)
function armAndGun(pm, gun, variant, S, side, dx, dy) {
  const W = pm.w, H = pm.h, drop = Math.round(DROP * S), s = side === 'left' ? -1 : 1, near = side === 'left' ? 0 : W - 1;
  const hx = (x) => (side === 'left' ? x : W - 1 - x);              // (his own reference x as drawn, mirrored at the viewer's right)
  const drawn = new Uint8Array(W * H);
  const put = (x, y, c, isGun = false) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; pm.data[y * W + x] = wordOf(c); drawn[y * W + x] = 1; gun[y * W + x] = isGun ? 1 : 0; };
  const skin = flesh(SKIN.tan), sleeve = cloth(0x9a6a4a);
  // (her head's centre on the card, the doll's 24 rows down at the near band, shifted by the hostage's offset; his side of it)
  const headY = Math.round(24 * S / HIT_SCALE) + dy, headX = Math.round(W / 2) + dx, edge = headX + s * Math.round(8.5 * S);
  void near; void hx;
  if (variant === 'H1') {
    // (his forearm from behind her shoulder up to the fist at her temple; the P-12 level, its muzzle at her head)
    // (the muzzle touches her temple: the fist is the slide's length out from her head's edge)
    const len = Math.round(P12_LEN_M * 100 * PX_PER_CM * S), D = pistolDrawingOf('p12'), shape = shapeAt('pistol', len, 1.6 * S, true, D?.fig ?? null), C = { n: cloth(0x3a3d48), u: cloth(0x23252f), v: cloth(0x8a909c) };
    const fist = [edge + s * Math.round(len * 0.7 + 1.5 * S), headY + Math.round(2 * S)], elbow = [fist[0] + s * Math.round(5 * S), headY + Math.round(24 * S)];
    band(put, elbow, fist, 2.6 * S, sleeve);
    // (grip at the fist, the slide pointing at her: toward the viewer's left when he is at the right)
    const th = side === 'left' ? 0 : Math.PI, gx = fist[0] + s * Math.round(len * 0.32), gy = fist[1] - Math.round(1.2 * S);
    for (const [x, y, ch] of turned(shape, gx, gy, th, side !== 'left')) { const T = C[ch] ?? C.n; put(x, y, y > gy + 0.8 * S ? T.shade : T.base, true); }
    blob(put, fist, 2.6 * S, skin);
  } else {
    // (his rifle up beside her shoulder, the muzzle high, his fist on the grip at her shoulder's height)
    const lenPx = Math.round(85 * PX_PER_CM * S), D = drawingOf('r7'), shape = shapeAt('rifle', lenPx, 2.4 * S, true, D.fig);
    const C = { n: cloth(0x5c6270), u: cloth(0x2e313c), v: cloth(0xa0a8b4), ...Object.fromEntries(Object.entries(D.colours).map(([k, c]) => [k, cloth(c)])) };
    const th = -Math.PI / 2 + s * 0.1, grip = [edge + s * Math.round(13 * S), headY + Math.round(28 * S)];
    const at = [grip[0] - Math.cos(th) * lenPx * 4.5 / 16, grip[1] - Math.sin(th) * lenPx * 4.5 / 16];
    const cells = turned(shape, at[0], at[1], th, side === 'left'), has = new Set(cells.map(([x, y]) => `${Math.round(x)},${Math.round(y)}`));
    for (const [x, y, ch] of cells) { const T = C[ch] ?? C.n; put(x, y, !has.has(`${Math.round(x) + s},${Math.round(y)}`) ? T.shade : ch === 'v' ? T.light : T.base, true); }
    band(put, [grip[0] + s * Math.round(5 * S), grip[1] + Math.round(14 * S)], grip, 2.6 * S, sleeve);
    blob(put, grip, 2.4 * S, skin);
  }
  // (the ink round what was drawn: round the gun on the wall only, round his arm and fist everywhere, so they read over her)
  const ink = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (drawn[i]) continue;
    const wall = hexOf(pm.data[i]) === backdropAt(x, y, S);
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => x + a >= 0 && x + a < W && drawn[(y + b) * W + x + a] && (wall || !gun[(y + b) * W + x + a]))) ink.push(i);
  }
  for (const i of ink) pm.data[i] = wordOf(INK);
  void drop;
}
// (a forearm: a band from a to b, its lower edge in shade)
function band(put, a, b, w, T) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, n = Math.ceil(L * 2), nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
  for (let t = 0; t <= n; t++) for (let o = -w; o <= w; o += 0.5) { const x = a[0] + (b[0] - a[0]) * t / n + nx * o, y = a[1] + (b[1] - a[1]) * t / n + ny * o; put(x, y, o > w * 0.4 ? T.shade : T.base); }
}
// (a fist: a round blob of skin, lit on its top)
function blob(put, c, r, T) { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + 0.5) put(c[0] + x, c[1] + y, y < -r * 0.3 ? T.light : T.base); }

// ---------- the board's card ----------
/**
 * A board's card (paintHitcard's board, written here; see the header): { w, h, col, gunPx, gunN, gunIn, band, marks }.
 * fig: { pm, mask, gun } (boardFigure's or hostageFigure's at the band's scale); tone: 'today' | 'G1' | 'G2' | 'G3'; rows: the
 * figure's rows at the near band (FIG_ROWS, or W2_ROWS), scaled to the band; marks: [{ n, at: [cm x, cm y], kind: 'ring' | 'seen' | 'hole' }].
 */
export function boardCard({ fig, tone = 'G1', rangeM = 4, words = '', line = null, rows = FIG_ROWS, size = CARD_W, marks = [], phase = 'belief' } = {}) {
  const band = bandOf(rangeM), G = figGeom(band.pxPerM), k = band.pxPerM / 96, S = size, W = S, H = S, col = new Int32Array(W * H);
  const put = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H) col[y * W + x] = c; };
  const blend = (x, y, c, t) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H) col[y * W + x] = mix(col[y * W + x], c, t); };
  const rect = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, c); };
  const write = (x, y, str, c, kk = 1) => { for (const ch of String(str).toUpperCase()) { const g = ch === '·' ? DOT : glyphOf(ch); g.forEach((row, j) => [...row].forEach((b, i) => { if (b === '1') rect(x + i * kk, y + j * kk, kk, kk, c); })); x += (g[0].length + 1) * kk; } return x; };
  const wr = wordsRows({ words, line, phase }, S), figH = H - wr.h, { pm, mask, gun } = fig;
  const r0 = Math.round(rows[0] * k), r1w = Math.round(rows[1] * k), at = figAt(band.pxPerM, S, pm.w);
  // (a lower crop stands the figure higher by what it adds, so the board stays on the card: W2's knee)
  const extra = Math.max(0, (r1w - r0) - (G.rows[1] - G.rows[0])), y0 = Math.max(2, at.y - extra);
  const r1 = Math.max(r0 + 1, Math.min(r1w, r0 + figH - y0));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) col[y * W + x] = y >= figH ? HIT_C.glass : mix(HIT_C.board, 0x3a3c45, y / figH * 0.6);
  // (the figure: the board's two tones; the gun by the candidate)
  let gunPx = 0, gunIn = 0, gunN = 0;
  for (let i = 0; i < gun.length; i++) gunN += gun[i];
  const isGun = (x, y) => x >= 0 && y >= 0 && x < pm.w && y < pm.h && gun[y * pm.w + x] === 1;
  for (let y = r0; y < Math.min(r1, pm.h); y++) for (let x = 0; x < pm.w; x++) {
    const i = y * pm.w + x;
    if (!mask[i]) continue;
    const c = hexOf(pm.data[i]), two = c === INK ? HIT_C.khakiInk : lum(c) > 92 ? HIT_C.khaki : HIT_C.khakiShade;
    let out = two;
    if (gun[i] && tone !== 'today') {
      out = tone === 'G2' ? c : lum(c) > LIT_LUM ? PORTRAIT_HOLD.lit : PORTRAIT_HOLD.ink;
      gunPx++;
    } else if (tone === 'G3' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => isGun(x + a, y + b))) out = HIT_C.khaki;
    if (gun[i]) gunIn++;
    put(at.x + x, y0 + y - r0, out);
  }
  const foot = y0 + r1 - r0;
  if (foot < figH) { const si = Math.round(G.stakeIn); rect(at.x + si, foot, STAKE_W_PX, figH - foot, HIT_C.stake); rect(at.x + pm.w - si - STAKE_W_PX, foot, STAKE_W_PX, figH - foot, HIT_C.stake); }
  // (the man-target's zones printed over the figure, life size, the head's circle on the head: shifted with a raised figure)
  const zones = zonesOnCard(band.pxPerM, PAPERS.man, { size: S }), shift = y0 - at.y;
  if (zones) {
    const zc = HIT_C.khakiInk, zk = ZONES_K;
    const outline = (b) => { for (let i = 0; i <= Math.round(b.w); i++) { blend(b.x + i, b.y + shift, zc, zk); if (b.y + shift + b.h < figH) blend(b.x + i, b.y + shift + b.h, zc, zk); } for (let j = 1; j < Math.round(b.h) && b.y + shift + j < figH; j++) { blend(b.x, b.y + shift + j, zc, zk); blend(b.x + b.w, b.y + shift + j, zc, zk); } };
    outline(zones.A); outline(zones.torso);
    const hz = zones.head, n = Math.max(16, Math.round(hz.r * 8)), seen = new Set();
    for (let t = 0; t < n; t++) { const x = Math.round(hz.cx + Math.cos(t / n * 2 * Math.PI) * hz.r), y = Math.round(hz.cy + shift + Math.sin(t / n * 2 * Math.PI) * hz.r), kk = `${x},${y}`; if (!seen.has(kk)) { seen.add(kk); blend(x, y, zc, zk); } }
  }
  // (the marks: an amber ring at a call, filled when seen; a hole in ink inside the board's ink rim)
  const drawn = [];
  for (const mk of marks) {
    const A = zones ? [zones.A.x + zones.A.w / 2, zones.A.y + zones.A.h / 2 + shift] : [W / 2, figH / 2], [cx, cy] = [Math.round(A[0] + mk.at[0] * G.pxPerCm), Math.round(A[1] + mk.at[1] * G.pxPerCm)];
    if (mk.kind === 'hole') { for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (!(Math.abs(i) === 2 && Math.abs(j) === 2)) put(cx + i, cy + j, Math.abs(i) === 2 || Math.abs(j) === 2 ? HIT_C.khakiInk : INK); }
    else for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const corner = Math.abs(i) === 2 && Math.abs(j) === 2, rim = Math.abs(i) === 2 || Math.abs(j) === 2; if (!corner && (rim || mk.kind === 'seen')) put(cx + i, cy + j, HIT_C.amber); else if (!corner) put(cx + i, cy + j, HIT_C.plate); }
    rect(cx + 4, cy - 9, textW(String(mk.n)) + 2, 7, HIT_C.plate); write(cx + 5, cy - 8, String(mk.n), HIT_C.paper);
    drawn.push({ n: mk.n, x: cx, y: cy });
  }
  rect(0, figH, W, 1, HIT_C.edge);
  let wy = figH + 6;
  for (const t of wr.head) { write(6, wy, t, HIT_C.paper, WORDS_K); wy += WORDS_ROW_PX; }
  if (wr.line.length) { wy += 4; for (const t of wr.line) { write(6, wy, t, HIT_C.said, WORDS_K); wy += WORDS_ROW_PX; } }
  for (let x = 0; x < W; x++) { col[x] = HIT_C.edge; col[(H - 1) * W + x] = HIT_C.edge; }
  for (let y = 0; y < H; y++) { col[y * W] = HIT_C.edge; col[y * W + W - 1] = HIT_C.edge; }
  return { w: W, h: H, col, gunPx, gunN, gunIn, inK: gunN ? gunIn / gunN : 1, band: band.id, pxPerM: band.pxPerM, marks: drawn };
}

// ---------- a man's card ----------
/**
 * A man's card (paintHitcard's man, written here so the portrait-light candidates can draw over his figure): { w, h, col, fig
 * (a Uint8Array over the card: 1 where the figure is), gun (1 where his gun's own pixels are), hands ({ x, y, w, h }: the box
 * round the fists and what is in them, card px: the gun's pixels and the fists at the low ready, 46 to 66 doll rows down
 * across the body, worn.js gearBends' bends), ground (the card's ground at a row), figH, at, band }. gear: a gear record
 * (src/sim/arms/gear.js's form), person: { look, sex }.
 */
export function manCard({ gear, person, rangeM = 4, words = '', size = CARD_W, ground = HIT_C.board } = {}) {
  const band = bandOf(rangeM), G = figGeom(band.pxPerM), S = size, W = S, H = S, col = new Int32Array(W * H), fig = new Uint8Array(W * H), gunC = new Uint8Array(W * H);
  const pm = dressedDoll(gear, person, G.scale), mask = figureMask(pm, G.scale);
  const cells = gear?.rifle?.place === 'ready' ? rifleCells(G.scale, 'ready', gear.rifle.mag !== false) : gear?.pistol?.place === 'ready' ? pistolCells(G.scale, 'ready') : [];
  const { gun } = heldOf(pm, cells, G.scale);
  const wr = wordsRows({ words }, S), figH = H - wr.h, at = figAt(band.pxPerM, S, pm.w), r0 = G.rows[0], r1 = Math.max(r0 + 1, Math.min(G.rows[1], r0 + figH - at.y));
  const groundAt = (y) => (y >= figH ? HIT_C.glass : mix(ground, 0x3a3c45, y / figH * 0.6));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) col[y * W + x] = groundAt(y);
  const k = G.scale, box = { x0: at.x + Math.round((MID - 14) * k), y0: at.y + Math.round((46 + DROP) * k) - r0, x1: 0, y1: 0 };
  box.x1 = box.x0 + Math.round(30 * k); box.y1 = box.y0 + Math.round(22 * k);
  for (let y = r0; y < Math.min(r1, pm.h); y++) for (let x = 0; x < pm.w; x++) {
    const i = y * pm.w + x;
    if (!mask[i]) continue;
    const X = at.x + x, Y = at.y + y - r0;
    if (X < 0 || Y < 0 || X >= W || Y >= figH) continue;
    col[Y * W + X] = hexOf(pm.data[i]); fig[Y * W + X] = 1;
    if (gun[i]) { gunC[Y * W + X] = 1; box.x0 = Math.min(box.x0, X); box.y0 = Math.min(box.y0, Y); box.x1 = Math.max(box.x1, X + 1); box.y1 = Math.max(box.y1, Y + 1); }
  }
  const hands = { x: box.x0 - 1, y: box.y0 - 1, w: box.x1 - box.x0 + 2, h: Math.min(figH, box.y1 + 1) - box.y0 + 1 };
  const P = pic(W, H); P.col.set(col);
  P.fill(0, figH, W, 1, HIT_C.edge);
  let wy = figH + 6;
  for (const t of wr.head) { P.write(6, wy, t, HIT_C.paper, WORDS_K); wy += WORDS_ROW_PX; }
  for (let x = 0; x < W; x++) { P.col[x] = HIT_C.edge; P.col[(H - 1) * W + x] = HIT_C.edge; }
  for (let y = 0; y < H; y++) { P.col[y * W] = HIT_C.edge; P.col[y * W + W - 1] = HIT_C.edge; }
  return { w: W, h: H, col: P.col, fig, gun: gunC, figH, hands, at, band: band.id, groundAt };
}

/** The card's size and a sheet's (cards across × down, GAP apart, a label strip on top when given). */
export const GAP = 4;
export const sheetSize = (across, down, label = 0, card = CARD_W) => [GAP + across * (card + GAP), GAP + label + down * (card + GAP)];
export { CARD_W, CARD_H, HIT_C };
