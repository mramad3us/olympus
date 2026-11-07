// OLYMPUS ui: the plaques over the picture, enamelled labels in the picture's own pixel alphabet (VIEWS §9.1; tradecraft's src/ui/plaque.js, 190 lines, ported).
//
// The user, of tradecraft's browser-text labels (2026-10-27): "infocards need to be revamped, they feel
// low quality, low tech too sharp and practical". So a label in the picture is of the picture: drawn in
// its 3 × 5 pixel font (src/art/font.js, tradecraft's pixelart.js glyphs), at its scale and on its grid,
// as a small enamel plate: an ink outline, a face in the kind's colour lit along its top and shaded
// along its foot, its corners nicked, a 5 × 5 glyph, the name, and after a seam a quieter second part; a
// notch at its foot points at what it names, and a pixel of shadow lifts it off the ground. Tradecraft's
// plaque, bracket and place keep their meaning; what changed in the port:
//   - the pixels are drawn into a plain buffer first (plaquePixels, bracketPixels: { w, h, data }, the
//     data a Uint32Array in ImageData's byte order), so node tests read a plaque glyph by glyph, and
//     plaque() and bracket() only copy that onto a canvas (cached by their arguments, as tradecraft's);
//   - VIEWS §9.1's kinds (home, duty, mess, armoury, medical, way, seen, squad, hazard, exit, felt,
//     airlock) and its new glyphs (bed, fork, rifle, chevron, warn, ear, door, lock, clock) beside
//     tradecraft's (star, house, key, eye, cross, pin, aim, the arrows), and tradecraft's tail, the red
//     of what is aimed at;
//   - a meter: the plaque's foot line filled to a fraction in the face's light (the odds of the shot,
//     a graphic beside the number: VIEWS §7.6's "graphics over words");
//   - the font's missing marks (+, ?, ·, ≈, ×, (, ), =) drawn here in the same 3 × 5 manner.
//
// The shot's plaque (VIEWS §7.4, WEAPONS §7.10; the build sheet 0.0.5 §2.4) is shotPlaque(rec) over the
// shot role's plaqueOf() record ({ part, rangeText, odds, oddsText, words, aimS, held, next, dc, dcParts,
// mods }): before the aim "PAPER 85% | 25 M · AIM 0.9 S" in the picked kind's paper (seen), once aimed
// "PAPER 85% | 25 M · +4 IN 1.3 S · CLICK FIRE" in the aimed red (tail), and "HELD +4" once the hold is
// full; plaqueWords(rec) the same as one plain line ("PAPER · 25 M · 85% · AIM 0.9 S", the sheet's form),
// and plaqueParts(rec) the hover's list, the DC's parts and every modifier as the shooter believes them,
// the same list the roll will use (one helper, one list: the user's rule from tradecraft, 2026-10-26:
// "we only know what we know"). place(el, p, x, y, k, anchor) sets a plaque on the HUD, x and y in the
// picture's pixels, k the picture's scale on screen, snapped to the picture's grid.
//
// The 0.0.7 round's (the build sheet 0.0.7 §2.1 plaqueOf, §2.5 (a), (b); WEAPONS §7.10): at distance the plaque gains
// a second plate under it, the terms (termsPixels: plaqueOf's terms, range, wind, hold, zero, each a glyph and a few
// words, the wind's arrow the way the shooter believes it blows, and the chance of each ring as a strip of six cells,
// V to a miss, widths by their odds: graphics over words, readable at a glance); the hover lists the same terms and
// the rings' odds in words. farLabel(far) is the far window's plaque ("TARGET 10 · 300 M", farPointOf's label), in
// the seen kind's enamel, with the aim glyph. Every term is the shooter's belief: the wind as read (or as the coach
// called it), the zero as believed, the hold as set, the range as known on a line; the truth never reaches here.
import { glyphOf } from '../art/font.js';

/** The kinds: face, its lit edge, its shade, the letters, the glyph (VIEWS §9.1's table; tradecraft's tail and felt). */
export const STYLES = Object.freeze({
  home: Object.freeze({ face: 0xe7b84a, hi: 0xf8e08a, lo: 0xb9862e, ink: 0x14151c, glyph: 0x6e2a2e }),
  duty: Object.freeze({ face: 0x9e3c36, hi: 0xc4574e, lo: 0x6e2a2e, ink: 0xf6f4ee, glyph: 0xf8e08a }),
  mess: Object.freeze({ face: 0x7a5236, hi: 0x9a6c48, lo: 0x553824, ink: 0xf6f4ee, glyph: 0xf8e08a }),
  armoury: Object.freeze({ face: 0x5a6272, hi: 0x7a8394, lo: 0x3e4452, ink: 0xf6f4ee, glyph: 0xe7b84a }),
  medical: Object.freeze({ face: 0xf4efe6, hi: 0xffffff, lo: 0xc4bba9, ink: 0x14151c, glyph: 0x9e3c36 }),
  way: Object.freeze({ face: 0x23252f, hi: 0x353947, lo: 0x14151c, ink: 0xf6f4ee, glyph: 0xe7b84a }),
  seen: Object.freeze({ face: 0xe2dac6, hi: 0xf6f4ee, lo: 0xc4bba9, ink: 0x14151c, glyph: 0x3b6296 }),
  squad: Object.freeze({ face: 0x356f42, hi: 0x4f8a5a, lo: 0x24503a, ink: 0xf6f4ee, glyph: 0xf8e08a }),
  hazard: Object.freeze({ face: 0xd9b23a, hi: 0xf0d26a, lo: 0x9e7f22, ink: 0x14151c, glyph: 0x14151c }),
  exit: Object.freeze({ face: 0x2f7a4c, hi: 0x5fbf7e, lo: 0x1f5232, ink: 0xe8fbe8, glyph: 0xe8fbe8 }),
  felt: Object.freeze({ face: 0x1f2e4a, hi: 0x3b6296, lo: 0x14151c, ink: 0xdfe8f6, glyph: 0x95c1e3 }),
  airlock: Object.freeze({ face: 0x1f6a78, hi: 0x3a9cb0, lo: 0x124650, ink: 0xe6fbff, glyph: 0xe6fbff }),
  tail: Object.freeze({ face: 0x9e3c36, hi: 0xc4574e, lo: 0x6e2a2e, ink: 0xf6f4ee, glyph: 0xf8e08a }),
});
const INK = 0x14151c, SHADOW = Object.freeze([20, 21, 28, 140]);

/** The 5 × 5 glyphs (rows top to bottom, 1 is ink): VIEWS §9.1's new ones and tradecraft's. */
export const ICONS = Object.freeze({
  bed: ['00000', '10000', '11111', '11111', '10001'],
  fork: ['10101', '10101', '11111', '00100', '00100'],
  rifle: ['00000', '11111', '00110', '00100', '00000'],
  chevron: ['00000', '00100', '01010', '10001', '00000'],
  warn: ['00100', '01010', '01010', '10001', '11111'],
  ear: ['01110', '10001', '00101', '00110', '01100'],
  door: ['11111', '10001', '10011', '10001', '11111'],
  lock: ['01110', '11011', '10001', '11011', '01110'],
  clock: ['01110', '10101', '10111', '10001', '01110'],
  star: ['00100', '01110', '11111', '01110', '01010'],
  house: ['00100', '01110', '11111', '01010', '01110'],
  key: ['01100', '10010', '01100', '00100', '00110'],
  eye: ['00000', '01110', '11011', '01110', '00000'],
  cross: ['00000', '00100', '01110', '00100', '00000'],
  pin: ['01110', '11011', '01110', '00100', '00100'],
  aim: ['00100', '00100', '11011', '00100', '00100'],
  up: ['00100', '01110', '11111', '00100', '00100'],
  down: ['00100', '00100', '11111', '01110', '00100'],
  left: ['00100', '01100', '11111', '01100', '00100'],
  right: ['00100', '00110', '11111', '00110', '00100'],
  paper: ['11111', '10001', '10101', '10001', '11111'],
  mag: ['01110', '01010', '01110', '01010', '01110'],
  // (0.0.7: the terms at distance; my calls)
  range: ['00000', '10001', '11111', '10001', '00000'],
  flag: ['10000', '11110', '11100', '10000', '10000'],
  hold: ['00100', '00101', '11011', '00100', '00100'],
  turret: ['01110', '11111', '10101', '11111', '01110'],
});

/** The marks src/art/font.js has no glyph for, drawn the same way (3 × 5, 1 is ink; my calls). */
export const MARKS = Object.freeze({
  '+': ['000', '010', '111', '010', '000'], '?': ['110', '001', '010', '000', '010'], '·': ['0', '0', '1', '0', '0'],
  '≈': ['000', '011', '110', '011', '110'], '×': ['000', '101', '010', '101', '000'], '(': ['01', '10', '10', '10', '01'],
  ')': ['10', '01', '01', '01', '10'], '=': ['000', '111', '000', '111', '000'], '−': ['00', '00', '11', '00', '00'],
  '◉': ['010', '111', '111', '111', '010'], '>': ['100', '010', '001', '010', '100'], '<': ['001', '010', '100', '010', '001'],
  '▲': ['000', '010', '111', '000', '000'], '▼': ['000', '111', '010', '000', '000'], '✓': ['000', '001', '101', '010', '000'],
});
const rowsOf = (ch) => MARKS[ch] ?? glyphOf(ch);

/** The width in pixels of a string in the plaques' alphabet (the font's and MARKS'). */
export function textW(str) {
  let w = -1;
  for (const ch of String(str).toUpperCase()) w += rowsOf(ch)[0].length + 1;
  return Math.max(0, w);
}
/** Write a string with px(x, y, w, h, colour) from its top-left; returns the x after it. */
export function writeText(px, x, y, str, c) {
  for (const ch of String(str).toUpperCase()) {
    const g = rowsOf(ch);
    g.forEach((row, j) => [...row].forEach((b, i) => { if (b === '1') px(x + i, y + j, 1, 1, c); }));
    x += g[0].length + 1;
  }
  return x;
}

// ---- a pixel buffer (ImageData's byte order, read as 32-bit words: 0xAABBGGRR on the little-endian machines that run browsers) ----
const pack = (r, g, b, a = 255) => ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
const packHex = (c, a = 255) => pack((c >> 16) & 255, (c >> 8) & 255, c & 255, a);
/** A blank buffer and its painter: { w, h, data, px(x, y, w, h, colour: 0xRRGGBB | [r, g, b, a]), clear(x, y) }. */
export function pixelBuffer(w, h) {
  const data = new Uint32Array(w * h);
  const px = (x, y, ww = 1, hh = 1, c = INK) => {
    const v = Array.isArray(c) ? pack(...c) : packHex(c);
    for (let j = Math.max(0, y); j < Math.min(h, y + hh); j++) for (let i = Math.max(0, x); i < Math.min(w, x + ww); i++) data[j * w + i] = v;
  };
  return { w, h, data, px, clear: (x, y) => { if (x >= 0 && y >= 0 && x < w && y < h) data[y * w + x] = 0; } };
}
/** The colour 0xRRGGBB at (x, y) of a buffer, or null where it is clear. */
export function colourAt(buf, x, y) {
  const v = buf.data[y * buf.w + x];
  if (!(v >>> 24)) return null;
  return ((v & 255) << 16) | (((v >> 8) & 255) << 8) | ((v >> 16) & 255);
}

/** A colour part of the way to another. */
export function mix(a, b, t) {
  const ch = (c, s) => (c >> s) & 255, m = (s) => Math.round(ch(a, s) + (ch(b, s) - ch(a, s)) * t);
  return (m(16) << 16) | (m(8) << 8) | m(0);
}

/**
 * A plaque's pixels: { w, h, data, tip (the notch's point, from the left), words, layout: { iconX, textX, subX, y } }.
 * text the name; sub the quieter part after a seam; style a kind of STYLES; icon a glyph of ICONS; notch;
 * meter a fraction 0 to 1 drawn along its foot in the face's light (the shot's odds).
 */
export function plaquePixels({ text, sub = null, style = 'way', icon = null, notch = true, meter = null }) {
  const S = STYLES[style] ?? STYLES.way, T = String(text).toUpperCase(), U = sub ? String(sub).toUpperCase() : null;
  const iw = icon ? 5 + 3 : 0, tw = textW(T), uw = U ? 4 + textW(U) : 0;
  const w = 1 + 3 + iw + tw + uw + 3 + 1, body = 1 + 2 + 5 + 2 + 1, h = body + (notch ? 3 : 0) + 1;
  const buf = pixelBuffer(w + 1, h), { px } = buf;
  // (a pixel of shadow, right and below; the outline; the face, lit along its top, shaded along its foot)
  px(1, 1, w, body, SHADOW);
  px(0, 0, w, body, INK);
  px(1, 1, w - 2, body - 2, S.face);
  px(1, 1, w - 2, 1, S.hi); px(1, body - 2, w - 2, 1, S.lo);
  // (the meter: the foot's shade filled to its fraction in the face's light)
  if (Number.isFinite(meter)) px(1, body - 2, Math.round((w - 2) * Math.max(0, Math.min(1, meter))), 1, S.hi);
  // (the corners nicked: an enamel plate's, not a box's)
  for (const [x, y] of [[0, 0], [w - 1, 0], [0, body - 1], [w - 1, body - 1]]) buf.clear(x, y);
  let x = 4;
  const layout = { iconX: icon ? x : null, textX: null, subX: null, y: 3 };
  if (icon) { (ICONS[icon] ?? ICONS.pin).forEach((row, j) => [...row].forEach((b, i) => { if (b === '1') px(x + i, 3 + j, 1, 1, S.glyph); })); x += iw; }
  layout.textX = x;
  writeText(px, x, 3, T, S.ink);
  x += tw;
  if (U) {
    px(x + 2, 2, 1, body - 4, S.lo);                               // (the seam)
    layout.subX = x + 4;
    writeText(px, x + 4, 3, U, mix(S.ink, S.face, 0.35));
  }
  // (the notch: a point under its middle, at what it names)
  const tip = Math.floor(w / 2);
  if (notch) { px(tip - 2, body - 1, 5, 1, INK); px(tip - 1, body - 1, 3, 1, S.lo); px(tip - 1, body, 3, 1, INK); px(tip, body, 1, 1, S.lo); px(tip, body + 1, 1, 1, INK); }
  return { w: buf.w, h: buf.h, data: buf.data, tip, words: U ? `${T} ${U}` : T, layout, style };
}

/**
 * Corner brackets round what's picked, w × h pixels inside, in a style's colours: four corners, a pixel
 * of ink round each so they show on regolith and on night alike: { w, h, data, tip, words }.
 */
export function bracketPixels({ w, h, style = 'tail' }) {
  const S = STYLES[style] ?? STYLES.tail, L = Math.max(3, Math.round(Math.min(w, h) / 4));
  const buf = pixelBuffer(w + 2, h + 2), px = (x, y, ww, hh, c) => buf.px(x, y, ww, hh, c);
  for (const [cx, cy, sx, sy] of [[0, 0, 1, 1], [w + 1, 0, -1, 1], [0, h + 1, 1, -1], [w + 1, h + 1, -1, -1]]) {
    const x0 = sx > 0 ? cx : cx - L, y0 = sy > 0 ? cy : cy - L;
    px(sx > 0 ? x0 : x0 + 1, sy > 0 ? cy : cy - 2, L + 1, 3, INK); px(sx > 0 ? cx : cx - 2, sy > 0 ? y0 : y0 + 1, 3, L + 1, INK);   // (the ink round it)
    px(sx > 0 ? cx + 1 : cx - L, cy + (sy > 0 ? 1 : -1), L, 1, S.hi); px(cx + (sx > 0 ? 1 : -1), sy > 0 ? cy + 1 : cy - L, 1, L, S.hi);
  }
  return { w: buf.w, h: buf.h, data: buf.data, tip: Math.floor(buf.w / 2), words: 'target' };
}

// ---- onto canvases (the DOM), cached by their arguments as tradecraft's were ----
const kept = new Map();
function canvasOf(pix) {
  const cv = globalThis.document.createElement('canvas');
  cv.width = pix.w; cv.height = pix.h;
  const g = cv.getContext('2d');
  if (g) g.putImageData(new ImageData(new Uint8ClampedArray(pix.data.buffer.slice(0)), pix.w, pix.h), 0, 0);
  return cv;
}
const KEPT_MAX = 256;
function keep(key, make) {
  if (kept.has(key)) return kept.get(key);
  if (kept.size >= KEPT_MAX) kept.delete(kept.keys().next().value);
  const pix = make(), out = { ...pix, canvas: canvasOf(pix) };
  kept.set(key, out);
  return out;
}
/** A plaque drawn on a canvas: plaquePixels' record with its canvas. */
export function plaque(spec) {
  return keep(`p|${spec.text}|${spec.sub}|${spec.style}|${spec.icon}|${spec.notch ?? true}|${Number.isFinite(spec.meter) ? Math.round(spec.meter * 100) : ''}`, () => plaquePixels(spec));
}
/** Corner brackets on a canvas: bracketPixels' record with its canvas. */
export function bracket(spec) {
  return keep(`b|${spec.w}|${spec.h}|${spec.style}`, () => bracketPixels(spec));
}

/**
 * Set a plaque into its element (a canvas on the HUD) at x, y in the picture's pixels, k the picture's
 * scale on screen (CSS px a picture pixel), ox and oy the picture's top-left on the page; anchor 'tip'
 * (its notch's point at x, y), 'left' or 'right' (its edge at x, its middle at y), 'centre' (its middle).
 */
export function place(el, p, x, y, k, anchor = 'tip', { ox = 0, oy = 0 } = {}) {
  if (el.$p !== p) {
    el.$p = p;
    el.width = p.w; el.height = p.h;
    el.getContext('2d')?.drawImage(p.canvas, 0, 0);
    el.dataset.text = p.words;                                     // (what it says, for the tests and a reader)
    el.setAttribute('aria-label', p.words);
    el.$k = null;
  }
  if (el.$k !== k) { el.style.width = `${p.w * k}px`; el.style.height = `${p.h * k}px`; el.$k = k; }
  const ax = anchor === 'tip' ? x - p.tip : anchor === 'right' ? x - p.w : anchor === 'centre' ? x - p.w / 2 : x;
  const ay = anchor === 'tip' ? y - p.h : anchor === 'centre' ? y - p.h / 2 : y - Math.floor(p.h / 2);
  el.style.transform = `translate(${Math.round(ox + Math.round(ax) * k)}px, ${Math.round(oy + Math.round(ay) * k)}px)`;
}

// ---- the shot's plaque (WEAPONS §7.10; the shot role's plaqueOf record) ----
const s1 = (ms) => (Math.max(0, ms) / 1000).toFixed(1);
/** The odds as the plaque says them: '85%', or the banded words when the belief is loose (WEAPONS §7.10). */
export const oddsSaid = (rec) => (rec?.oddsText ?? (Number.isFinite(rec?.odds) ? `${Math.round(rec.odds * 100)}%` : rec?.words ?? '?'));
/**
 * The next click's part ('AIM 0.9 S', '+4 IN 1.3 S · CLICK FIRE', 'HELD +4 · CLICK FIRE'). rec.fireOff, when
 * the page gives it (Fire struck in the panel: 'on safe', 'a stoppage', 'chamber empty'), takes
 * CLICK FIRE's place, so the plaque never asks for a click the panel refuses ('+4 IN 1.4 S · ON SAFE');
 * rec.fireKey, the page's when the last input was a key, names Fire's digit ('+4 IN 1.4 S · 1 HELD FIRE',
 * 'HELD +4 · 1 FIRE').
 */
export function nextSaid(rec) {
  if (!rec) return '';
  if (rec.next === 'aim') return `AIM ${Number.isFinite(rec.aimS) ? rec.aimS.toFixed(1) : '?'} S`;
  const v = rec.held?.v ?? 0, full = rec.held?.full ?? 4, holding = rec.next === 'hold' && (rec.held?.toFullMs ?? 0) > 0;
  // (by the keys (rec.fireKey, the panel's Fire digit), the key named: held, it holds to +4 and fires; the design review's)
  const click = rec.fireOff ? String(rec.fireOff).toUpperCase() : rec.fireKey ? `${rec.fireKey} ${holding ? 'HELD ' : ''}FIRE` : 'CLICK FIRE';
  if (holding) return `+${full} IN ${s1(rec.held.toFullMs)} S · ${click}`;
  return `${v > 0 ? `HELD +${v} · ` : ''}${click}`;
}
/** The shot's plaque as a plaque spec: { text: 'PAPER 85%', sub: '25 M · AIM 0.9 S', style, icon, meter }. aimed: the target is the aimed one. */
export function shotPlaque(rec, { aimed = rec?.next !== 'aim' } = {}) {
  const part = String(rec?.part ?? 'TARGET').toUpperCase();
  return { text: `${part} ${oddsSaid(rec)}`, sub: `${rec?.rangeText ?? `${Math.round(rec?.rangeM ?? 0)} M`} · ${nextSaid(rec)}`, style: aimed ? 'tail' : 'seen', icon: 'aim', meter: Number.isFinite(rec?.odds) ? rec.odds : null };
}
/** The plaque as one plain line, the build sheet's form: 'PAPER · 25 M · 85% · AIM 0.9 S'. */
export function plaqueWords(rec) {
  if (!rec) return '';
  return [String(rec.part ?? 'TARGET').toUpperCase(), rec.rangeText ?? `${Math.round(rec.rangeM ?? 0)} M`, oddsSaid(rec), nextSaid(rec)].join(' · ');
}
const signed = (v) => (v > 0 ? `+${v}` : v < 0 ? `−${-v}` : '0');
/**
 * The hover's lines: { dc: 'DC 19', parts: ['base 6', 'the 25 m +7', …], mods: ['prone +4', …], total, odds }:
 * the DC's parts and every modifier as believed, in the roll's order (the same list the roll uses).
 */
export function plaqueParts(rec) {
  if (!rec) return { dc: '', parts: [], mods: [], total: 0, odds: '' };
  const parts = (rec.dcParts ?? []).map(p => `${p.why} ${signed(p.v)}`);
  const mods = (rec.mods ?? []).map(m => `${m.why} ${signed(m.v)}`);
  const total = (rec.mods ?? []).reduce((a, m) => a + (Number(m.v) || 0), 0);
  return { dc: `DC ${rec.dc ?? '?'}`, parts, mods, total, odds: oddsSaid(rec) };
}

// ---- 0.0.7: the terms at distance, the rings' odds, the far window's label (see the header) ----
/** A term's glyph by its key (plaqueOf's terms). */
export const TERM_ICONS = Object.freeze({ range: 'range', wind: 'flag', hold: 'hold', zero: 'turret' });
/** The rings' cells, V to a miss, and their colours in the strip (the face's black to the berm's dust; my calls). */
export const RING_CELLS = Object.freeze([['v', 0xf8e08a], ['5', 0xe7b84a], ['4', 0xc4574e], ['3', 0x9e3c36], ['2', 0x6e2a2e], ['miss', 0x565b67]]);
/** The rings' strip's width in pixels. */
export const RING_STRIP_PX = 36;

const fix = (v, d = 1) => { const n = Math.round(Math.abs(v) * 10 ** d) / 10 ** d; return Number.isInteger(n) ? String(n) : n.toFixed(d).replace(/0+$/, ''); };
/**
 * A term's few words as the plate says them (upper case): range "300 M"; wind "3 M/S >" (v the believed cross,
 * m/s, + blowing to the right: the arrow the way it blows; by 'coach', his call in whole m/s); hold "0.5 R" ([xMil, yMil] or { xMil, yMil }: + right,
 * + up); zero "▲2 <1" (v { elev, wind } clicks from the believed zero) or the sim's own words where v is not one of these.
 */
export function termText(t) {
  if (!t) return '';
  const v = t.v;
  if (t.key === 'range' && Number.isFinite(v)) return `${Math.round(v)} M`;
  // (the coach's call as he said it, whole metres a second ("about 3 metres a second"): the plate is never more precise
  // than what the shooter was told (the runtime review's of v0.0.7); their own read keeps its tenth)
  if (t.key === 'wind' && Number.isFinite(v) && t.by === 'coach') return Math.abs(v) < 0.5 ? 'STILL' : `${Math.round(Math.abs(v))} M/S ${v > 0 ? '>' : '<'}`;
  if (t.key === 'wind' && Number.isFinite(v)) return Math.abs(v) < 0.05 ? 'STILL' : `${fix(v)} M/S ${v > 0 ? '>' : '<'}`;
  if (t.key === 'hold' && v && (Array.isArray(v) || typeof v === 'object')) {
    const x = Array.isArray(v) ? v[0] : v.xMil, y = Array.isArray(v) ? v[1] : v.yMil;
    if (!x && !y) return 'CENTRE';
    return [x ? `${fix(x, 2)} ${x > 0 ? 'R' : 'L'}` : null, y ? `${fix(y, 2)} ${y > 0 ? 'UP' : 'DN'}` : null].filter(Boolean).join(' ');
  }
  if (t.key === 'zero' && v && typeof v === 'object' && ('elev' in v || 'wind' in v)) {
    const e = Math.round(v.elev ?? 0), w = Math.round(v.wind ?? 0);
    if (!e && !w) return 'ON ZERO';
    return [e ? `${e > 0 ? '▲' : '▼'}${Math.abs(e)}` : null, w ? `${w > 0 ? '>' : '<'}${Math.abs(w)}` : null].filter(Boolean).join(' ');
  }
  return String(t.words ?? '').toUpperCase().replace(/[^A-Z0-9 .+\-<>?·%/×=()]/g, '').slice(0, 18).trim();
}
/** The rings' odds as six shares summing to 1 (V, 5, 4, 3, 2, miss), from plaqueOf's kd.ringOdds; null if none. */
export function ringShares(ringOdds) {
  if (!ringOdds) return null;
  const raw = RING_CELLS.map(([k]) => Math.max(0, Number(ringOdds[k]) || 0)), sum = raw.reduce((a, b) => a + b, 0);
  return sum > 0 ? raw.map(x => x / sum) : null;
}
/**
 * The terms' plate: { w, h, data, words, segments: [{ key, x, w, text }], strip: { x, w, cells: [{ ring, x, w }] } | null }:
 * one enamel plate in the seen kind, a segment a term (its glyph and its words) after a seam each, and the rings'
 * strip at its end (RING_STRIP_PX wide, a cell a ring, widths by the odds).
 */
export function termsPixels(terms = [], { ringOdds = null, style = 'seen' } = {}) {
  const S = STYLES[style] ?? STYLES.seen;
  const segs = terms.filter(Boolean).map(t => ({ key: t.key, text: termText(t), icon: TERM_ICONS[t.key] ?? 'pin' })).filter(x => x.text);
  const shares = ringShares(ringOdds);
  const segW = (x) => 5 + 2 + textW(x.text);
  let w = 1 + 3;
  segs.forEach((x, i) => { w += (i ? 5 : 0) + segW(x); });
  const stripX = shares ? w + (segs.length ? 5 : 0) : null;
  if (shares) w = stripX + RING_STRIP_PX;
  w += 3 + 1;
  const body = 1 + 2 + 5 + 2 + 1, buf = pixelBuffer(w + 1, body + 1), { px } = buf;
  px(1, 1, w, body, SHADOW); px(0, 0, w, body, INK);
  px(1, 1, w - 2, body - 2, S.face); px(1, 1, w - 2, 1, S.hi); px(1, body - 2, w - 2, 1, S.lo);
  for (const [x, y] of [[0, 0], [w - 1, 0], [0, body - 1], [w - 1, body - 1]]) buf.clear(x, y);
  let x = 4;
  const out = [];
  segs.forEach((sg, i) => {
    if (i) { px(x + 2, 2, 1, body - 4, S.lo); x += 5; }
    (ICONS[sg.icon] ?? ICONS.pin).forEach((row, j) => [...row].forEach((b, k) => { if (b === '1') px(x + k, 3 + j, 1, 1, S.glyph); }));
    writeText(px, x + 7, 3, sg.text, S.ink);
    out.push({ key: sg.key, x, w: segW(sg), text: sg.text });
    x += segW(sg);
  });
  let strip = null;
  if (shares) {
    if (segs.length) px(stripX - 3, 2, 1, body - 4, S.lo);
    let cx = stripX;
    const cells = [];
    // (each ring its share of the strip, at least a pixel where it has any chance; the last takes what rounding left)
    RING_CELLS.forEach(([ring, colour], i) => {
      const cw = i === RING_CELLS.length - 1 ? stripX + RING_STRIP_PX - cx : shares[i] > 0 ? Math.max(1, Math.round(shares[i] * RING_STRIP_PX)) : 0;
      const ww = Math.max(0, Math.min(cw, stripX + RING_STRIP_PX - cx));
      if (ww) px(cx, 3, ww, 5, colour);
      cells.push({ ring, x: cx, w: ww });
      cx += ww;
    });
    px(stripX - 1, 2, RING_STRIP_PX + 2, 1, INK); px(stripX - 1, 8, RING_STRIP_PX + 2, 1, INK);
    strip = { x: stripX, w: RING_STRIP_PX, cells };
  }
  const words = [...out.map(o => o.text), shares ? ringWords(ringOdds) : null].filter(Boolean).join(' · ');
  return { w: buf.w, h: buf.h, data: buf.data, tip: Math.floor(w / 2), words, segments: out, strip, style };
}
/** The rings' odds in words, the hover's and the plate's reader's: "V 4% 5 21% 4 38% 3 22% 2 9% MISS 6%". */
export function ringWords(ringOdds) {
  const sh = ringShares(ringOdds);
  if (!sh) return '';
  return RING_CELLS.map(([k], i) => `${k === 'miss' ? 'MISS' : k.toUpperCase()} ${Math.round(sh[i] * 100)}%`).join(' ');
}
/** The terms' plate on a canvas, cached as the plaques are. */
export function termsPlaque(terms, opts = {}) {
  return keep(`t|${JSON.stringify(terms?.map(t => [t?.key, termText(t)]))}|${JSON.stringify(ringShares(opts.ringOdds)?.map(v => Math.round(v * 100)))}|${opts.style ?? ''}`, () => termsPixels(terms, opts));
}
/** The hover's lines for the terms: ['300 m', 'wind 3 m/s, blowing right (your read)', …] from the terms' own words. */
export function termLines(rec) {
  const lines = (rec?.terms ?? []).map(t => (t.words ? String(t.words) : termText(t).toLowerCase())).filter(Boolean);
  if (rec?.kd?.ringOdds) lines.push(`the rings: ${ringWords(rec.kd.ringOdds).toLowerCase()}`);
  return lines;
}
/** The far window's plaque: { text: 'TARGET 10', sub: '300 M', style: 'seen', icon: 'aim', notch: false } from farPointOf's record. */
export function farLabel(far) {
  if (!far) return null;
  const [head, ...rest] = String(far.label ?? `TARGET ${far.lane ?? '?'} · ${Math.round(far.rangeM ?? 0)} M`).toUpperCase().split(' · ');
  return { text: head, sub: rest.length ? rest.join(' · ') : null, style: 'seen', icon: 'aim', notch: false };
}
