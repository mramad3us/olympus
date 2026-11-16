// OLYMPUS sample: the second gun on the weapon card, three ways to show it (VIEWS §4.4 "As built in v0.0.18: two guns").
//
// The user, 2026-11-15: the P-12 shown like the rifle. The house issues the P-12 beside the R-7 on every sheet, and v0.0.17's
// card showed only the gun in use: the holstered pistol's condition, or the rifle hanging on its sling with a double feed, were
// nowhere on screen. Each picture is four cards drawn by the game's own weapon card (src/art/weaponcard.js paintWeaponCard),
// each from the beliefs alone: at GO (the R-7 in use, the P-12 holstered, SAFE 1+9); after Transition (the P-12 drawn, the rifle
// hanging on its click); the rifle hanging with a double feed; the P-12 locked back on an empty. ?v= picks the way:
//   a   WC2-A, the default built: the gun in use whole, a brass hands mark at its top left, the other in a strip at the foot
//       (rows 124 to 147, under a rule): a glyph for where it is, its silhouette (a pistol ÷3, a rifle ÷4) and its condition;
//   b   WC2-B: the same strip with the place in a word ("HOLSTER", "HANGING") in place of the glyph (strip 'word');
//   c   WC2-C: two half cards side by side, each gun's own card at ÷2, the one in use lit and the other dimmed (a sample only:
//       the game draws A until you pick).
// The cards are drawn as the hud draws them, at their own size, and the picture is scaled up by a whole number to fill the
// window, so the gallery shoots it crisply. window.__report.frame is its size, window.__ready true once drawn.
import { paintWeaponCard, CARD_W, CARD_H } from '../../src/art/weaponcard.js';
import { text } from '../../src/art/font.js';

const params = new URLSearchParams(location.search), way = ['a', 'b', 'c'].includes(params.get('v')) ? params.get('v') : 'a';
const ACROSS = 4, CELL_W = CARD_W + 4, LABEL_H = 8;
/** The picture's size (sample.json's pixel): four cards across, a label over each. */
export const SIZE = Object.freeze([4 + ACROSS * CELL_W, 4 + LABEL_H + CARD_H + 4]);
const BG = 0x0e0f14, LABEL = 0x8b909b, CARD_BG = 0x2b2e3a;
const [W, H] = SIZE;
const buf = new Uint32Array(W * H).fill(0xff000000 | abgr(BG));
function abgr(c) { return ((c & 0xff) << 16) | (c & 0xff00) | ((c >>> 16) & 0xff); }
const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) buf[y * W + x] = 0xff000000 | abgr(c); };
const fill = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, c); };
const say = (x, y, s, c = LABEL) => text((X, Y, w, h, col) => fill(X, Y, w, h, col), x, y, s, c);
const rgb = (v) => ((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff);
function blit(pm, x0, y0) { for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) put(x0 + x, y0 + y, rgb(pm.data[y * pm.w + x])); }
// (a colour toward the card's backdrop by k: the gun not in use, dimmed)
const dim = (c, k) => { const m = (a, b) => Math.round(a + (b - a) * k); return (m(c >> 16, CARD_BG >> 16) << 16) | (m((c >> 8) & 0xff, (CARD_BG >> 8) & 0xff) << 8) | m(c & 0xff, CARD_BG & 0xff); };
// (WC2-C: two cards at ÷2 in one, the one in use on the left and lit, the other on the right and dimmed)
function halves(pmUse, pmOther, x0, y0) {
  fill(x0, y0, CARD_W, CARD_H, CARD_BG);
  const half = (pm, dx, k) => { for (let y = 0; y < CARD_H / 2; y++) for (let x = 0; x < CARD_W / 2; x++) put(x0 + dx + x, y0 + 37 + y, k ? dim(rgb(pm.data[(y * 2) * pm.w + x * 2]), k) : rgb(pm.data[(y * 2) * pm.w + x * 2])); };
  half(pmUse, 0, 0); half(pmOther, CARD_W / 2, 0.55);
  fill(x0 + CARD_W / 2, y0 + 30, 1, 88, 0x565b67);
}

/** The beliefs (beliefOf's records as the card reads them) and the places (guns.js's). */
const R7 = { model: 'r7', short: 'R-7', mag: 'in', magFam: 'had30', count: 9, chamber: 'live', mode: 'semi', locked: false, port: 'open', stoppage: null, cocked: true, optic: 1, sight: { elev: 0, wind: 0 } };
const P12 = { model: 'p12', short: 'P-12', mag: 'in', magFam: 'had17', count: 9, chamber: 'live', mode: 'safe', locked: false, port: 'closed', stoppage: null, cocked: true };
const VIEWS = [
  ['AT GO', { model: 'r7', belief: R7 }, { model: 'p12', place: 'holster', belief: P12 }],
  ['AFTER TRANSITION', { model: 'p12', belief: { ...P12, mode: 'semi' } }, { model: 'r7', place: 'hanging', belief: { ...R7, stoppage: 'click', cocked: false } }],
  ['THE RIFLE: A DOUBLE FEED', { model: 'p12', belief: { ...P12, mode: 'semi', count: 6, countApprox: true } }, { model: 'r7', place: 'hanging', belief: { ...R7, stoppage: 'double', chamber: 'case' } }],
  ['THE P-12 LOCKED ON EMPTY', { model: 'p12', belief: { ...P12, mode: 'semi', count: 0, chamber: 'empty', locked: true, port: 'open' } }, { model: 'r7', place: 'hanging', belief: { ...R7, stoppage: 'double', chamber: 'case' } }],
];

VIEWS.forEach(([name, use, other], i) => {
  const x = 4 + i * CELL_W, y = 4 + LABEL_H;
  say(x + 1, 4, name);
  if (way === 'c') halves(paintWeaponCard({ ...use }), paintWeaponCard({ ...other }), x, y);
  else blit(paintWeaponCard({ ...use, other, strip: way === 'b' ? 'word' : 'glyph' }), x, y);
});

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
window.__report = { frame: [W, H], way };
requestAnimationFrame(() => requestAnimationFrame(() => { window.__ready = true; }));
