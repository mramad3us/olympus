// OLYMPUS sample: the regulation cuts at their four steps, on the figure at 16 px/m and on the doll, for the user to star and score (the build sheet 0.0.6 §8 item 21; the user, 2026-11-06: "this haircut is not military acceptable, we should have to groom our hair the same way we will have to groom our beards").
//
// CAREER §2's seven cuts as the game draws them (src/art/figures/templates.js, compose.js; the doll's,
// src/art/doll/doll.js), each at its drawn step: 0 fresh from the barber, 1 growing out (from 0.3 of the
// cut's dueSols), 2 due (from 0.7), 3 out of regulation (from 1.0): a man's sides from skin to a shadow,
// a dark and the hair's colour, his top a pixel taller at 3; a woman's short cut a row longer a step, a bun
// or a braid with stray pixels at 3. ?set= picks the picture:
//   men     the men's four cuts, a row each, steps 0 to 3 facing you, side on and from behind (PT kit, bare head)
//   women   the women's three cuts, likewise
//   cover   all seven at steps 0 and 3 under the utility cover, facing you, side on and from behind
//   doll    the doll's head, each cut a row at steps 0 to 3
// The picture is drawn at its own size (sample.json's pixel) and scaled up by a whole number to fill the
// window, so the gallery shoots it crisply; window.__report.frame is its size, window.__ready true once drawn.
import { composeFrame } from '../../src/art/figures/compose.js';
import { shade } from '../../src/art/figures/shade.js';
import { wear, coloursOf } from '../../src/art/figures/outfits.js';
import { doll } from '../../src/art/doll/doll.js';

const params = new URLSearchParams(location.search), set = params.get('set') ?? 'men';
/** Each set's picture size, the cell of a figure, the backdrop. */
export const SIZE = Object.freeze({ men: [320, 140], women: [320, 108], cover: [320, 240], doll: [272, 248] });
const CW = 26, CH = 32, BG = 0x1d1f27, LINE = 0x2c2f3a;
// (each cut's look: a skin and a hair colour that show its steps, my calls; the women's cuts on women)
const LOOKS = Object.freeze({ highTight: ['tan', 'dark', 'm'], lowReg: ['light', 'brown', 'm'], medReg: ['brown', 'black', 'm'], shaved: ['dark', 'black', 'm'], bun: ['tan', 'black', 'f'], short: ['light', 'auburn', 'f'], braid: ['brown', 'dark', 'f'] });
const MEN = ['highTight', 'lowReg', 'medReg', 'shaved'], WOMEN = ['bun', 'short', 'braid'];

const [W, H] = SIZE[set] ?? SIZE.men;
const buf = new Uint32Array(W * H).fill(0xff000000 | rgbToAbgr(BG));
function rgbToAbgr(c) { return ((c & 0xff) << 16) | (c & 0xff00) | ((c >>> 16) & 0xff); }
const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) buf[y * W + x] = 0xff000000 | rgbToAbgr(c); };
// (a Pixmap of paint.js words at (x0, y0), its rows from `from`, `rows` of them)
function blit(pm, x0, y0, rows = pm.h, from = 0) {
  for (let y = 0; y < rows; y++) for (let x = 0; x < pm.w; x++) {
    const v = pm.data[(y + from) * pm.w + x];
    if (v) buf[(y0 + y) * W + x0 + x] = 0xff000000 | (v & 0xffffff);
  }
}
// (a figure standing, cropped from its feet up CH pixels)
function figure(cut, step, dir, outfit, x0, y0) {
  const [skin, color, sex] = LOOKS[cut], L = wear({ outfit, skin, hair: { style: cut, color, step }, seed: 3, sex });
  const fr = composeFrame(L, dir, 'idle0', { ppm: 16 }), pm = shade(fr.cells, coloursOf(L, 16));
  const top = Math.max(0, fr.ay - CH + 1);                         // (from the feet up: every step on one baseline)
  blit(pm, x0 + Math.round((CW - pm.w) / 2), y0, Math.min(CH, pm.h - top), top);
}
const rule = (y) => { for (let x = 0; x < W; x++) put(x, y, LINE); };

if (set === 'men' || set === 'women') {
  const cuts = set === 'men' ? MEN : WOMEN;
  cuts.forEach((cut, r) => {
    for (let step = 0; step < 4; step++) ['down', 'right', 'up'].forEach((dir, v) => figure(cut, step, dir, 'pt', 4 + (step * 3 + v) * CW, 4 + r * (CH + 3)));
    if (r) rule(2 + r * (CH + 3));
  });
} else if (set === 'cover') {
  [...MEN, ...WOMEN].forEach((cut, r) => {
    const row = Math.floor(r / 2), half = r % 2;
    [0, 3].forEach((step, si) => ['down', 'right', 'up'].forEach((dir, v) => figure(cut, step, dir, 'utilities', 4 + half * 160 + (si * 3 + v) * CW, 4 + row * (CH + 26))));
  });
} else {
  [...MEN, ...WOMEN].forEach((cut, r) => {
    const [skin, color, sex] = LOOKS[cut];
    for (let step = 0; step < 4; step++) {
      const pm = doll({ look: { outfit: 'pt', skin, hair: { style: cut, color, step } }, sex, scale: 1 });
      blit({ w: pm.w, h: 34, data: pm.data }, 4 + step * 67, 4 + r * 34 + 0, 34, 0);
    }
  });
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
window.__report = { frame: [W, H], set, cuts: set === 'men' ? MEN : set === 'women' ? WOMEN : [...MEN, ...WOMEN] };
requestAnimationFrame(() => requestAnimationFrame(() => { window.__ready = true; }));
