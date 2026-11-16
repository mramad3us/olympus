// OLYMPUS sample: the first live men's look (the build sheet 0.0.19 §1 L-look, §13 "Samples to score"; opfor §2.6).
//
// "Stack and clear, live" puts two role-players in the shoot house in place of stands 2a and 3a. Each picture is the game's own
// code: the doll (src/art/doll/doll.js with worn.js's pieces), the world figure (src/art/figures/compose.js and shade.js at 24 px/m)
// and the target view's card (src/art/doll/hitcard.js paintHitcard, as the hud paints it at --ui 1). The defaults are drawn in the
// game until you pick:
//   ?m=M1 | M2 | M3   the force-on-force mask: M1 a wire mesh in a black frame, M2 (the default) a clear lens and a moulded
//                     lower shell with three vents, M3 a smoked shield with a chin guard; the doll close, then his target card;
//   ?h=H1 | H2        a man who gave up, his rifle on the floor: H1 (the default) his hands at his shoulders, H2 by his face; the
//                     doll, then the world figure standing and kneeling (challenged), facing you, side on and from behind;
//   ?p=P1 | P2        the paint of a marking round: P1 (the default) a splat, P2 the paper's ring filled with the paint; a role-
//                     player's card in belief (two seen, one not), in truth (your two and your #2's one), and your own card with
//                     the role-players' paint in blue.
// The picture is scaled up by a whole number to fill the window. window.__report.frame is its size, window.__ready once drawn.
import { doll } from '../../src/art/doll/doll.js';
import { paintHitcard, CARD_W } from '../../src/art/doll/hitcard.js';
import { composeFrame } from '../../src/art/figures/compose.js';
import { shade } from '../../src/art/figures/shade.js';
import { coloursOf, wear } from '../../src/art/figures/outfits.js';
import { handsPose } from '../../src/art/figures/poses.js';

const params = new URLSearchParams(location.search);
const set = params.get('h') ? 'h' : params.get('p') ? 'p' : 'm', pick = params.get(set) ?? { m: 'M2', h: 'H1', p: 'P1' }[set];
const GAP = 4, BG = 0x0e0f14;
// (a role-player: utilities, the carrier with two pouches, the mask; the R-7 at the ready, or on the floor with his hands up)
const LOOK = { outfit: 'utilities', skin: 0xb98a64, head: null, hair: { style: 'medium', color: 0x3a2a20 } };
const RP = { outfit: 'utilities', suit: null, carrier: { model: 'pc-m3', pouches: [{ key: 'p1', holds: 2, mags: 1 }, { key: 'p2', holds: 2, mags: 1 }] }, ears: null, rifle: { model: 'r7', finish: null, place: 'ready', mag: true }, pistol: null, thigh: null, held: null, painted: false, mask: 'fof', hands: null };
const dollGear = (g, extra = {}) => ({ rifle: g.rifle, pistol: null, carrier: { pouches: g.carrier.pouches }, thigh: null, ears: null, held: null, mask: g.mask, hands: g.hands, ...extra });
const man = (gear, extra = {}) => ({ look: 'B', man: null, phase: 'belief', marks: [], words: 'ROLE-PLAYER', line: null, tabs: [], rangeM: 5, subject: { kind: 'man', key: `rp|${JSON.stringify(extra)}`, gear: { ...gear, ...(extra.dollGear ?? {}) }, person: { look: LOOK, sex: 'm' } } });
const pics = [];
if (set === 'm') {
  pics.push(doll({ look: LOOK, sex: 'm', scale: 2, gear: dollGear(RP, { maskLook: pick }) }));
  pics.push(paintHitcard({ ...man(RP), subject: { kind: 'man', key: `m|${pick}`, gear: { ...RP, maskLook: pick }, person: { look: LOOK, sex: 'm' } }, words: 'RIFLE · AIMING · 2A' }));
} else if (set === 'h') {
  const up = { ...RP, rifle: null, hands: 'up' };
  pics.push(doll({ look: LOOK, sex: 'm', scale: 2, gear: dollGear(up, { handsLook: pick }) }));
  const L = wear({ ...LOOK, seed: 7, weapon: null, carrier: true, mask: true }), col = coloursOf(L, 24), row = [];
  for (const kneel of [false, true]) for (const dir of ['down', 'right', 'up', 'left']) row.push(shade(composeFrame(L, dir, kneel ? 'handsKneel' : 'handsUp', { ppm: 24, pose: handsPose(pick, kneel) }).cells, col));
  pics.push(strip(row, 3));
} else {
  const paintLook = pick, rp = { ...RP };
  const marks = (truth) => [
    { n: 1, shotId: 's1', called: [-2, 4], seen: true, hole: truth ? [-3.1, 5.2] : null, zone: truth ? 'A' : null, part: 'torso', paint: 'team' },
    { n: 2, shotId: 's2', called: [3, 1], seen: true, hole: truth ? [4.4, 0.8] : null, zone: truth ? 'A' : null, part: 'torso', paint: 'team' },
    { n: 3, shotId: 's3', called: [1, -29], seen: false, hole: truth ? [1.5, -27.6] : null, zone: truth ? 'head' : null, part: 'head', paint: 'team' },
    ...(truth ? [{ n: null, kind: 'two', shotId: 't1', called: null, seen: true, hole: [-6, 12], zone: 'torso', part: 'torso', paint: 'team' }] : []),
  ];
  pics.push(paintHitcard({ ...man(rp), paintLook, marks: marks(false), words: 'AIMING · PAIR · 2 SEEN' }));
  pics.push(paintHitcard({ ...man(rp), paintLook, phase: 'truth', marks: marks(true), words: 'DOWN · PAIR, FIRE · A · A · HEAD', line: 'Three on him. He went down.' }));
  const ME = { ...RP, rifle: { ...RP.rifle }, mask: null };
  pics.push(paintHitcard({ look: 'B', man: null, phase: 'truth', paintLook, marks: [{ n: 1, called: [2, 3], seen: true, hole: [2, 3], zone: 'A', part: 'torso', paint: 'rp' }, { n: 2, called: [-4, 9], seen: true, hole: [-4, 9], zone: 'A', part: 'torso', paint: 'rp' }], words: 'PAINT: 2 TORSO', line: null, tabs: [], rangeM: 5, subject: { kind: 'man', key: 'me', gear: ME, person: { look: { ...LOOK, skin: 0x8a5a3c }, sex: 'm' } } }));
}
// (frames side by side on the doll's wall, scaled k times)
function strip(list, k) {
  const w = list.reduce((a, p) => a + p.w * k + GAP, -GAP), h = Math.max(...list.map(p => p.h)) * k, data = new Uint32Array(w * h).fill(0xff000000 | abgr(0x2a2c35));
  let x0 = 0;
  for (const p of list) { for (let y = 0; y < p.h * k; y++) for (let x = 0; x < p.w * k; x++) { const v = p.data[Math.floor(y / k) * p.w + Math.floor(x / k)]; if (v >>> 24) data[(y + h - p.h * k) * w + x0 + x] = v; } x0 += p.w * k + GAP; }
  return { w, h, data };
}
function abgr(c) { return ((c & 0xff) << 16) | (c & 0xff00) | ((c >>> 16) & 0xff); }
const W = GAP + pics.reduce((a, p) => a + p.w + GAP, 0), H = GAP * 2 + Math.max(...pics.map(p => p.h));
/** Each set's picture size (sample.json's pixel). */
export const SIZE = Object.freeze({ m: [W, H], h: [W, H], p: [W, H] });
const buf = new Uint32Array(W * H).fill(0xff000000 | abgr(BG));
let x0 = GAP;
for (const pm of pics) { for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) { const v = pm.data[y * pm.w + x]; if (v >>> 24) buf[(GAP + y) * W + x0 + x] = v; } x0 += pm.w + GAP; }
const cv = document.getElementById('pic'), g = cv.getContext('2d');
cv.width = W; cv.height = H;
const img = g.createImageData(W, H);
new Uint32Array(img.data.buffer).set(buf);
g.putImageData(img, 0, 0);
function fit() { const k = Math.max(1, Math.floor(Math.min(innerWidth / W, innerHeight / H))); cv.style.width = `${W * k}px`; cv.style.height = `${H * k}px`; }
fit();
addEventListener('resize', fit);
window.__report = { frame: [W, H], set, pick };
requestAnimationFrame(() => requestAnimationFrame(() => { window.__ready = true; }));
void CARD_W;
