// OLYMPUS sample: the hit card as the user picked it, B the khaki man-target board, belief left and truth right, at the card's size in three windows, and its figure at three ranges (VIEWS §7.7; the user's scores of 2026-11-08).
//
// The user's words of 2026-11-07: "Targets in game should be represented with the same logic we represent the shooting range
// targets, drawn with impact points drawn as well, using similar to inventory and character menu drawings of people." Their
// scores of 2026-11-08: A 10, B ★ 99, C 0, "Second set is perfect, keep all three to represent varying ranges." One string's
// marks on a turner (MARKS: a Pair to the chest, a third round high, a fourth missed), as hitMarks gives them (src/sim/arms/
// marks.js: called points by the shooter's Marksmanship, the holes the sim's), drawn by the game's own src/art/doll/hitcard.js
// paintHitcard: belief (what the marine could tell during the string) at the left and truth (the holes at the debrief) at the
// right, each in the HITCARD box a window of ?win= 1024 (1024 × 768, --ui 0.85), 1600 (1600 × 900, --ui 1.25) or 1920
// (1920 × 1080, --ui 1.5) gives it: the card painted at its box's whole pixels (200, or 170 at 1024 × 768) and shown at whole
// device pixels a card pixel where it fits, else scaled smooth into its box (src/ui/hud/hitcard.js hitFit, at a device pixel
// ratio of 1). ?set=ranges is "keep all three" as built (my reading, to confirm): the truth's card at 7, 20 and 50 m side by
// side at 1600 × 900, the board's figure at its band's density (HIT_BANDS: 96, 80 and 64 px a metre), the marks at their own
// sizes. The picture is drawn at its own size (sample.json's pixel) and scaled up by a whole number to fill the window, so the
// gallery shoots it crisply; window.__report.frame is its size.
import { paintHitcard } from '../../src/art/doll/hitcard.js';
import { hitFit } from '../../src/ui/hud/hitcard.js';
import { uiScale, RECTS } from '../../src/ui/hud/layout.js';
import { PAPERS } from '../../src/sim/arms/paper.js';

const params = new URLSearchParams(location.search), ranges = params.get('set') === 'ranges';
/** The ranges of ?set=ranges (metres: one in each band). */
export const RANGES_M = Object.freeze([7, 20, 50]);
/** The windows the views are shot for (their --ui from layout.js uiScale). */
export const WINDOWS = Object.freeze({ 1024: [1024, 768], 1600: [1600, 900], 1920: [1920, 1080] });
const win = WINDOWS[params.get('win')] ? params.get('win') : '1600', [ww, wh] = WINDOWS[win];
const ui = uiScale(ww, wh), box = Math.round(RECTS.HITCARD.w * ui), GAP = 6, BG = 0x0e0f14;
/** One string's marks in hitMarks' shape, written for the look round (a Pair to the chest, a third round high, a fourth missed: the recruit's calls near his aim, the holes where the dice put them; cm from the A zone's centre, y down). */
export const MARKS = Object.freeze([
  { n: 1, shotId: 's4-1', called: [-1.5, 2.0], seen: true, hole: [4.6, -3.1], zone: 'A', part: 'torso' },
  { n: 2, shotId: 's4-2', called: [2.5, 6.0], seen: true, hole: [-12.4, 15.8], zone: 'C', part: 'torso' },
  { n: 3, shotId: 's4-3', called: [0.5, -21.0], seen: true, hole: [3.0, -26.5], zone: 'head', part: 'head' },
  { n: 4, shotId: 's4-4', called: [6.0, 12.0], seen: false, hole: null, zone: null, part: 'torso' },
]);
const BELIEF = Object.freeze({ phase: 'belief', marks: MARKS, words: 'PAIR · HAMMER · 3 SEEN', line: null });
const TRUTH = Object.freeze({ phase: 'truth', marks: MARKS, words: 'PAIR · A · C · HEAD · MISS', line: 'Two in the chest, one in the head. He went down.' });

const W = ranges ? box * RANGES_M.length + GAP * (RANGES_M.length - 1) : box * 2 + GAP, H = box;
const buf = new Uint32Array(W * H).fill(0xff000000 | abgr(BG));
function abgr(c) { return ((c & 0xff) << 16) | (c & 0xff00) | ((c >>> 16) & 0xff); }
// (a card into its box at x0: at whole pixels centred where hitFit keeps them, else resampled to the box (bilinear, as a browser's smooth scaling))
function place(pm, x0) {
  const fit = hitFit(ui, 1), size = Math.round(pm.w * fit.k), off = Math.round((box - size) / 2);
  const rgb = (x, y) => { const v = pm.data[Math.min(pm.h - 1, Math.max(0, y)) * pm.w + Math.min(pm.w - 1, Math.max(0, x))]; return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255]; };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let c;
    if (!fit.smooth) { const v = pm.data[Math.floor(y / fit.k) * pm.w + Math.floor(x / fit.k)]; c = v & 0xffffff; }
    else {
      const sx = (x + 0.5) * pm.w / size - 0.5, sy = (y + 0.5) * pm.h / size - 0.5, ix = Math.floor(sx), iy = Math.floor(sy), fx = sx - ix, fy = sy - iy;
      const a = rgb(ix, iy), b = rgb(ix + 1, iy), d = rgb(ix, iy + 1), e = rgb(ix + 1, iy + 1);
      const ch = (i) => Math.round((a[i] * (1 - fx) + b[i] * fx) * (1 - fy) + (d[i] * (1 - fx) + e[i] * fx) * fy);
      c = ch(0) | (ch(1) << 8) | (ch(2) << 16);
    }
    buf[(off + y) * W + x0 + off + x] = 0xff000000 | c;
  }
  return fit;
}
const size = hitFit(ui, 1).size;
let fit = null, b = null, t = null;
if (ranges) RANGES_M.forEach((rangeM, i) => { const pm = paintHitcard({ size, man: PAPERS.man, rangeM, ...TRUTH }); fit = place(pm, i * (box + GAP)); t ??= pm; });
else {
  b = paintHitcard({ size, man: PAPERS.man, ...BELIEF }); t = paintHitcard({ size, man: PAPERS.man, ...TRUTH });
  fit = place(b, 0);
  place(t, box + GAP);
}

const cv = document.getElementById('pic'), g = cv.getContext('2d');
cv.width = W; cv.height = H;
const img = g.createImageData(W, H);
new Uint32Array(img.data.buffer).set(buf);
g.putImageData(img, 0, 0);
function fitWin() {
  const k = Math.max(1, Math.floor(Math.min(innerWidth / W, innerHeight / H)));
  cv.style.width = `${W * k}px`; cv.style.height = `${H * k}px`;
}
fitWin();
addEventListener('resize', fitWin);
window.__report = { frame: [W, H], look: 'B', set: ranges ? 'ranges' : 'card', win: Number(win), ui, box, card: { k: fit.k, smooth: fit.smooth }, marks: { belief: b?.marks ?? null, truth: t.marks } };
requestAnimationFrame(() => requestAnimationFrame(() => { window.__ready = true; }));
