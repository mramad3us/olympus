// OLYMPUS sample: the target view's subjects (VIEWS §7.7; the build sheet 0.0.18 §2.2, §9 samples L and H).
//
// The user, 2026-11-15: "we need to generalize that target view for every time we're engaging something or someone", the people
// in it "rendered ... as we see them, meaning with their gear". Each card is the game's own (src/art/doll/hitcard.js paintHitcard),
// as the hud paints it at --ui 1 (200 × 200):
//   ?set=faces   the shoot house's stands as your take-in identified them on the khaki board: a threat with a rifle, with a
//                pistol (the P-12 in his hand: v0.0.17 drew him empty-handed), a no-shoot with a phone, with empty hands, the
//                armoured face, a stand whose hands were not seen ("HANDS NOT SEEN");
//   ?l=a | b     L: a live man (your #2 in the combat EVA suit, the carrier and the R-7 at the ready) in his own colours, on the
//                card's dark ground (L-a, the default) or on a ground lifted toward the board's khaki so the amber reads (L-b),
//                at the near and mid bands;
//   ?h=a | b     H: the hostage card, the hostile behind the hostage at the viewer's right of her head (H-a, the default) or at
//                the left (H-b), in belief with a round to the head called, then in truth twice: the round clear of her (his
//                head, HEAD, he goes down) and the round that touches her (HOSTAGE HIT, NO-GO: v0.0.28, the user's note of
//                2026-11-20, "If the hostage is hit, the shot is a fail.", src/sim/arms/paper.js hostageTouched), each hole where the
//                game puts it (paper.js hostageHead).
// The picture is scaled up by a whole number to fill the window. window.__report.frame is its size, window.__ready once drawn.
import { paintHitcard, CARD_W } from '../../src/art/doll/hitcard.js';
import { PAPERS, hostageTouched } from '../../src/sim/arms/paper.js';
import { HOSTAGE_CARDS, HIT_WORDS } from './cards.js';

const params = new URLSearchParams(location.search), set = params.get('h') ? 'h' : params.get('l') ? 'l' : 'faces';
const GAP = 4, C = CARD_W;
const TWO = { outfit: 'combatSuit', suit: { model: 'ces-1', colour: 'black', helm: null }, carrier: { model: 'pc-m3', pouches: [{ key: 'p1', holds: 2, mags: 1 }, { key: 'p2', holds: 2, mags: 1 }, { key: 'dump', holds: 4, mags: 0 }] }, ears: null, rifle: { model: 'r7', finish: null, place: 'ready', mag: true }, pistol: null, thigh: null, held: null, painted: false };
const board = (face, holds, words, extra = {}) => ({ look: 'B', man: PAPERS.man, phase: 'belief', marks: [], words, line: null, tabs: [], rangeM: 4, subject: { kind: 'board', key: `${face}|${holds}`, face, holds, ...extra } });
const CARDS = set === 'faces' ? [
  board('threat', 'rifle', '1A'), board('threat', 'pistol', '3A'), board('noshoot', 'phone', '2B'), board('noshoot', 'hands', 'H'), board('armoured', 'rifle', '2A'), board('unknown', 'unseen', 'HANDS NOT SEEN · 1B'),
] : set === 'l' ? [4, 14].map(rangeM => ({ look: 'B', man: null, phase: 'belief', marks: [], words: 'LCPL ROSSI', line: null, tabs: [], rangeM, subject: { kind: 'man', key: `two|${rangeM}`, gear: TWO, person: { look: { skin: 'brown', hair: { style: 'highTight', color: 'black' } }, sex: 'm' }, ground: params.get('l') === 'b' ? 'lifted' : 'dark' } }))
  : HOSTAGE_CARDS.map(([phase, hole, words, line]) => {
    // (each hole is the sim's rule's: one clear of her by the hole and a pixel, his head's; one touching her, hers)
    if (hole && hostageTouched(hole) !== (words === HIT_WORDS)) throw new Error(`the hostage card's hole ${hole} is not as its words say`);
    return { ...board('hostage', 'pistol', words, { side: params.get('h') === 'b' ? 'left' : 'right' }), phase, marks: [{ n: 1, shotId: 'h1', called: [7.0, -28.0], seen: true, hole, zone: hole ? (words === HIT_WORDS ? 'hostage' : 'head') : null, part: 'head' }], line };
  });
const ACROSS = Math.min(3, CARDS.length), W = GAP + ACROSS * (C + GAP), H = GAP + Math.ceil(CARDS.length / ACROSS) * (C + GAP);
/** Each set's picture size (sample.json's pixel). */
export const SIZE = Object.freeze({ faces: [GAP + 3 * (C + GAP), GAP + 2 * (C + GAP)], l: [GAP + 2 * (C + GAP), GAP + C + GAP], h: [GAP + 3 * (C + GAP), GAP + C + GAP] });
const buf = new Uint32Array(W * H).fill(0xff000000 | abgr(0x0e0f14));
function abgr(c) { return ((c & 0xff) << 16) | (c & 0xff00) | ((c >>> 16) & 0xff); }
const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) buf[y * W + x] = 0xff000000 | abgr(c); };
function blit(pm, x0, y0) { for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) { const v = pm.data[y * pm.w + x]; put(x0 + x, y0 + y, ((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff)); } }
CARDS.forEach((m, i) => blit(paintHitcard(m), GAP + (i % ACROSS) * (C + GAP), GAP + Math.floor(i / ACROSS) * (C + GAP)));
const cv = document.getElementById('pic'), g = cv.getContext('2d');
cv.width = W; cv.height = H;
const img = g.createImageData(W, H);
new Uint32Array(img.data.buffer).set(buf);
g.putImageData(img, 0, 0);
function fit() { const k = Math.max(1, Math.floor(Math.min(innerWidth / W, innerHeight / H))); cv.style.width = `${W * k}px`; cv.style.height = `${H * k}px`; }
fit();
addEventListener('resize', fit);
window.__report = { frame: [W, H], set };
requestAnimationFrame(() => requestAnimationFrame(() => { window.__ready = true; }));
