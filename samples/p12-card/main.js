// OLYMPUS sample: the P-12's designs on the weapon card, in the Corps' black, as the holder believes the pistol.
//
// The P-12 (WEAPONS §3.2, built in v0.0.14: the sidearm from the Sergeant up, a HAD-17 of ten frangible, the thigh holster)
// has had no drawing: its card drew the R-7 (WEAPONS §3.2's note, VIEWS §4.4). Four designs of src/art/pistols.js
// (PISTOL_DESIGNS: p12a the service pistol, p12b the slab, p12c the monolith, p12d the lanyard), each drawn by the game's own
// weapon card (src/art/weaponcard.js paintWeaponCard({ drawing, finish, belief })), which reaches a pistol design only when a
// drawing names one: the game's card still draws what it drew until the user's pick. ?d= picks the design, ?f= the finish
// (none: the issue's, the Corps' black), ?set= the picture:
//   card      the card in four beliefs side by side: Condition 1 on safe with the house's ten (a round believed chambered:
//             the witness's brass at the hood's rear); firing, off safe, about six left; the slide locked back on an empty
//             magazine; a stovepipe looked at, the magazine out and a full one of ten frangible in the hand;
//   more      four more: the chamber and the count never checked ("?" by the port and on the baseplate); a double feed
//             looked at with a magazine in the hand whose weight says "a few"; Condition 3 (no round chambered, the hood
//             bare); the magazine out, the well's mouth open, nothing in the hand;
//   designs   the four designs side by side in Condition 1, each named;
//   finishes  the design in every finish (the rifles' seven, src/data/finishes.js), Condition 1.
// The cards are drawn into the page as the game's hud draws them (never snapped to the palette), at their own size, and the
// picture is scaled up by a whole number to fill the window, so the gallery shoots it crisply.
// window.__report.frame is its size, window.__ready true once drawn.
import { paintWeaponCard, CARD_W, CARD_H } from '../../src/art/weaponcard.js';
import { text } from '../../src/art/font.js';
import { PISTOL_DESIGNS, PISTOL_DESIGN_IDS } from '../../src/art/pistols.js';
import { FINISH_IDS, finishId } from '../../src/data/finishes.js';

const params = new URLSearchParams(location.search), set = params.get('set') ?? 'card';
const id = PISTOL_DESIGNS[params.get('d')] ? params.get('d') : 'p12a', fin = finishId(params.get('f'));
const ACROSS = 4, CELL_W = CARD_W + 4, LABEL_H = 8;
/** Each set's picture size (sample.json's pixel). */
export const SIZE = Object.freeze({
  card: [4 + ACROSS * CELL_W, CARD_H + 8], more: [4 + ACROSS * CELL_W, CARD_H + 8],
  designs: [4 + ACROSS * CELL_W, 4 + LABEL_H + CARD_H + 4], finishes: [4 + ACROSS * CELL_W, 4 + 2 * (LABEL_H + CARD_H + 4)],
});
const BG = 0x0e0f14, LABEL = 0x8b909b;
const [W, H] = SIZE[set] ?? SIZE.card;
const buf = new Uint32Array(W * H).fill(0xff000000 | abgr(BG));
function abgr(c) { return ((c & 0xff) << 16) | (c & 0xff00) | ((c >>> 16) & 0xff); }
const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) buf[y * W + x] = 0xff000000 | abgr(c); };
const fill = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, c); };
const say = (x, y, s, c = LABEL) => text((X, Y, w, h, col) => fill(X, Y, w, h, col), x, y, s, c);
// (a card's words, little-endian RGBA, opaque, at (x0, y0))
function blit(pm, x0, y0) {
  for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) { const v = pm.data[y * pm.w + x]; put(x0 + x, y0 + y, ((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff)); }
}

/** The beliefs (weaponcard.js cardParts reads them): the P-12 as the holder believes it. */
const COND1 = { mag: 'in', count: 10, chamber: 'live', mode: 'safe', magLoad: 'frangible' };
const BELIEFS = {
  card: [
    COND1,
    { mag: 'in', count: 6, countApprox: true, chamber: 'live', mode: 'semi', magLoad: 'frangible' },
    { mag: 'in', count: 0, chamber: 'empty', locked: true, mode: 'semi' },
    { mag: 'out', hand: { n: 10, load: 'frangible' }, chamber: 'case', stoppage: 'case', mode: 'safe' },
  ],
  more: [
    { mag: 'in', count: null, chamber: '?', mode: 'safe' },
    { mag: 'out', hand: { feel: 'few' }, chamber: 'live', stoppage: 'double', mode: 'semi' },
    { mag: 'in', count: 10, chamber: 'empty', mode: 'safe', magLoad: 'frangible' },
    { mag: 'out', chamber: 'empty', mode: 'safe' },
  ],
};

if (set === 'card' || set === 'more') BELIEFS[set].forEach((belief, i) => blit(paintWeaponCard({ drawing: id, finish: fin, belief }), 4 + i * CELL_W, 4));
else if (set === 'designs') PISTOL_DESIGN_IDS.forEach((d, i) => {
  say(5 + i * CELL_W, 4, `${PISTOL_DESIGNS[d].short}  ${d.toUpperCase()}`);
  blit(paintWeaponCard({ drawing: d, finish: fin, belief: COND1 }), 4 + i * CELL_W, 4 + LABEL_H);
});
else FINISH_IDS.forEach((f, i) => {
  const x = 4 + (i % ACROSS) * CELL_W, y = 4 + Math.floor(i / ACROSS) * (LABEL_H + CARD_H + 4);
  say(x + 1, y, f.toUpperCase());
  blit(paintWeaponCard({ drawing: id, finish: f, belief: COND1 }), x, y + LABEL_H);
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
window.__report = { frame: [W, H], set, drawing: id, finish: fin };
requestAnimationFrame(() => requestAnimationFrame(() => { window.__ready = true; }));
