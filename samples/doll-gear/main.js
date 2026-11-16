// OLYMPUS sample: the close figure in the gear worn now (VIEWS §4.2, §4.3; the build sheet 0.0.18 §2.2, §9 sample R).
//
// The user, 2026-11-15: "the I and C menu preview of the character should show the currently worn gear". Each figure is the game's
// own doll (src/art/doll/doll.js, dressed by dress.js from a gear record as src/sim/arms/gear.js gearOf gives it), at the I and C
// cards' scale, unlit as the cards draw it:
//   ?r=a   R-a, the rifle in both hands at the low ready (the default, my call): you at GO in the shoot house (the combat EVA suit,
//          the carrier with a magazine in chest pouches 1 and 2 and the dump pouch empty, the P-12 in its thigh holster and its
//          spare below), after Transition (the P-12 at the ready, the R-7 slung front), the R-7 slung on the back, your #2 (no
//          P-12), and the range kit on the utilities with ear defenders and a magazine in the left hand;
//   ?r=b   R-b, the same with the rifle at the ready drawn hanging from the right hand, as v0.0.17's board man held it;
//   ?set=pouches  the carrier's baseplates by the magazines in its pouches, 0 to 4, and the dump pouch with 0, 2 and 4.
// The picture is scaled up by a whole number to fill the window, so the gallery shoots it crisply. window.__report.frame is its
// size, window.__ready true once drawn.
import { doll, DOLL_SCALE } from '../../src/art/doll/doll.js';
import { dressOf } from '../../src/art/doll/dress.js';
import { text } from '../../src/art/font.js';

const params = new URLSearchParams(location.search), set = params.get('set') === 'pouches' ? 'pouches' : 'kit', rb = params.get('r') === 'b';
const S = DOLL_SCALE, DW = Math.round(64 * S), DH = Math.round(142 * S), GAP = 4, LABEL_H = 8;
const ME = (over = {}) => ({ outfit: 'combatSuit', suit: { model: 'ces-1', colour: 'black', helm: null }, carrier: { model: 'pc-m3', pouches: [{ key: 'p1', holds: 2, mags: 1 }, { key: 'p2', holds: 2, mags: 1 }, { key: 'dump', holds: 4, mags: 0 }] }, ears: null, rifle: { model: 'r7', finish: null, place: 'ready', mag: true }, pistol: { model: 'p12', place: 'holster', mag: true }, thigh: { holds: 2, mags: 1 }, held: null, painted: false, ...over });
const PERSON = { look: { skin: 'tan', hair: { style: 'medReg', color: 'dark' }, head: null }, sex: 'm' };
const TWO = { look: { skin: 'brown', hair: { style: 'highTight', color: 'black' }, head: null }, sex: 'm' };
const ready = rb ? 'hand' : 'ready', rifle = (place) => ({ model: 'r7', finish: null, place, mag: true });
const pouches = (a, b, d) => ({ model: 'pc-m3', pouches: [{ key: 'p1', holds: 2, mags: a }, { key: 'p2', holds: 2, mags: b }, { key: 'dump', holds: 4, mags: d }] });
const FIGS = set === 'kit' ? [
  ['AT GO', ME({ rifle: rifle(ready) }), PERSON],
  ['TRANSITION', ME({ rifle: rifle('front'), pistol: { model: 'p12', place: 'ready', mag: true } }), PERSON],
  ['SLUNG BACK', ME({ rifle: rifle('back') }), PERSON],
  ['YOUR #2', ME({ rifle: rifle(ready), pistol: null, thigh: null }), TWO],
  ['RANGE KIT', ME({ outfit: 'utilities', suit: null, ears: 'cups', pistol: null, thigh: null, held: 'mag', rifle: rifle(ready) }), PERSON],
] : [[0, 0, 0], [1, 0, 0], [1, 1, 0], [2, 1, 0], [2, 2, 0], [2, 2, 2], [2, 2, 4]].map(([a, b, d]) => [`${a}+${b} DUMP ${d}`, ME({ carrier: pouches(a, b, d), rifle: null }), PERSON]);
const W = GAP + FIGS.length * (DW + GAP), H = GAP + LABEL_H + DH + GAP;
/** Each set's picture size (sample.json's pixel). */
export const SIZE = Object.freeze({ kit: [GAP + 5 * (DW + GAP), H], pouches: [GAP + 7 * (DW + GAP), H] });
const buf = new Uint32Array(W * H).fill(0xff000000 | abgr(0x0e0f14));
function abgr(c) { return ((c & 0xff) << 16) | (c & 0xff00) | ((c >>> 16) & 0xff); }
const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) buf[y * W + x] = 0xff000000 | abgr(c); };
const fill = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, c); };
function blit(pm, x0, y0) { for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) { const v = pm.data[y * pm.w + x]; put(x0 + x, y0 + y, ((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff)); } }
FIGS.forEach(([label, gear, person], i) => {
  const x = GAP + i * (DW + GAP);
  text((X, Y, w, h, col) => fill(X, Y, w, h, col), x + 1, GAP, String(label), 0x8b909b);
  blit(doll({ ...dressOf(gear, person), scale: S }), x, GAP + LABEL_H);
});
const cv = document.getElementById('pic'), g = cv.getContext('2d');
cv.width = W; cv.height = H;
const img = g.createImageData(W, H);
new Uint32Array(img.data.buffer).set(buf);
g.putImageData(img, 0, 0);
function fit() { const k = Math.max(1, Math.floor(Math.min(innerWidth / W, innerHeight / H))); cv.style.width = `${W * k}px`; cv.style.height = `${H * k}px`; }
fit();
addEventListener('resize', fit);
window.__report = { frame: [W, H], set, r: rb ? 'b' : 'a' };
requestAnimationFrame(() => requestAnimationFrame(() => { window.__ready = true; }));
