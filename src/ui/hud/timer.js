// OLYMPUS hud: the coach's shot timer, its paper after each string of test-pairs (COMBAT §25.10.3; the build sheet 0.0.8 §2.3, §2.4; VIEWS §7.5).
//
// On "Pairs" the coach runs a shot timer (the scene's pairs.js: it starts on the turn, its beep the turner's), and at a
// string's end he reads its paper: "TURN TO PAUSE 0.80 · PAUSE TO FIRST 1.40 · SPLITS 0.40 · 2 A, 1 HEAD". The paper is
// the scene's (paperOf, paperText: one helper for the coach's words, this paper and the end card); this module draws
// it as the paper it is, a strip of thermal paper out of the timer, in the PAPER rectangle (layout.js: the top centre
// under PAUSED's slot, which the 25 m card has on the other courses: on the pairs pad there is no card to show, and
// the walking states 'walking-paper' and 'paused-paper' give it the same place when you are out of stop motion), so
// it is placed by layout.js clear of every HUD rectangle. Graphics first: the four lines in the picture's 3 × 5
// alphabet at whole device pixels, its header the string and the line, the take-in's line marked by the sheet's
// own amber where it is the marine's (the take-in is the scored thing), the zones as marks (A, C, HEAD, MISS, NO-SHOOT
// HIT). Its words (data-text) are the scene's paperText exactly, so a test reads the same line the coach said.
// timerModel(rec, { text }) is the pure part (the rows and their numbers from the string's record: takeInMs,
// pauseToFirstMs, splitsMs, zones), drawTimer(g, model, s) draws it, createTimer(parent) the DOM, redrawn on change.
import { textW, writeText } from '../plaque.js';
import { GLOWS } from '../../art/palette.js';

/** The paper's size (CSS px at --ui 1: within layout.js RECTS.PAPER's 200 × 200), its letters' scale (paper px a font px). */
export const TIMER_W = 200, TIMER_H = 140, TIMER_K = 2;
/** The zones in the paper's order, and their words (the scene's paperText's order). */
// (0.0.8, the fixer's: the steel's own, a round that rang on a plate and the head plate down, as the scene's paper says them)
export const ZONE_ORDER = Object.freeze([['A', 'A'], ['C', 'C'], ['head', 'HEAD'], ['ring', 'RING'], ['headDown', 'HEAD DOWN'], ['miss', 'MISS'], ['noshoot', 'NO-SHOOT HIT']]);
const PAPER_C = '#efe9dc', PAPER_SHADE = '#d9d0bc', INKC = '#24201f', FAINT = '#7d746a', AMBER_C = `#${GLOWS[0].toString(16).padStart(6, '0')}`, RED_C = '#a3423c', GLASS = 'rgba(20, 21, 28, 0.86)';

const two = (ms) => (Number.isFinite(ms) ? (Math.max(0, ms) / 1000).toFixed(2) : '-');
/**
 * The paper's model: { rows: [{ label, value, mark? }], head, zones: [{ k, n, word }], text, numbers: { takeInMs, pauseToFirstMs,
 * splitsMs } }. rec: the string's record ({ k, line, takeInMs, pauseToFirstMs, splitsMs, zones } or paperOf's); text: the scene's
 * paperText of it (the coach's words); fmt: the one formatter of the take-in (react.js takeInWords), two places.
 */
export function timerModel(rec, { text = null, fmt = two } = {}) {
  if (!rec) return null;
  const splits = Array.isArray(rec.splitsMs) ? rec.splitsMs : [];
  const zones = ZONE_ORDER.map(([k, word]) => ({ k, n: Number(rec.zones?.[k]) || 0, word })).filter(z => z.n > 0);
  const rows = [
    { label: 'TURN TO PAUSE', value: Number.isFinite(rec.takeInMs) ? fmt(rec.takeInMs) : '-', mark: 'takein' },
    { label: 'PAUSE TO FIRST', value: Number.isFinite(rec.pauseToFirstMs) ? fmt(rec.pauseToFirstMs) : '-' },
    { label: 'SPLITS', value: splits.length ? splits.map(fmt).join(' ') : '-' },
  ];
  const head = `STRING ${Number.isFinite(rec.k) ? rec.k + 1 : '?'}${Number.isFinite(rec.line) ? ` · ${rec.line} M` : ''}`;
  const said = text ?? [`TURN TO PAUSE ${rows[0].value}`, `PAUSE TO FIRST ${rows[1].value}`, `SPLITS ${rows[2].value}`, zones.length ? zones.map(z => `${z.n} ${z.word}`).join(', ') : null].filter(Boolean).join(' · ');
  return { head, rows, zones, text: said, numbers: { takeInMs: rec.takeInMs ?? null, pauseToFirstMs: rec.pauseToFirstMs ?? null, splitsMs: splits.slice() } };
}

/** Draw the paper on a Canvas2D at s device pixels a paper pixel (crisp at every --ui and device ratio). */
export function drawTimer(g, m, s = 1) {
  const W = TIMER_W, H = TIMER_H, k = TIMER_K;
  const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x * s), Math.round(y * s), Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s))); };
  // (the font's pixels at k paper pixels each, through writeText's px)
  const put = (x, y, text, c) => writeText((px, py, w, h) => R(x + (px - x) * k, y + (py - y) * k, w * k, h * k, c), x, y, text, null);
  const putC = (x, y, text, c) => { g.fillStyle = c; put(x, y, text, c); };
  R(0, 0, W, H, GLASS);
  // (the strip of thermal paper, its torn top edge, a shade down its right)
  const px0 = 8, pw = W - 16;
  R(px0, 4, pw, H - 8, PAPER_C);
  for (let i = 0; i < pw; i += 4) R(px0 + i, 4, 2, 1, GLASS);
  R(px0 + pw - 2, 6, 2, H - 10, PAPER_SHADE);
  const L = px0 + 6, Rt = px0 + pw - 6, lineH = 5 * k + 7;
  putC(L, 10, 'TIMER', FAINT);
  putC(Rt - textW(m.head) * k, 10, m.head, FAINT);
  R(L, 23, pw - 12, 1, PAPER_SHADE);
  let y = 29;
  for (const r of m.rows) {
    putC(L, y, r.label, INKC);
    const vw = textW(r.value) * k;
    // (a value too long for the label's line (a string's many splits) goes on the line under it, right-aligned)
    if (L + (textW(r.label) + 3) * k + vw > Rt) y += lineH - 2;
    const vx = Rt - vw;
    // (the take-in, the scored thing, on an amber band: the marine's own time)
    if (r.mark === 'takein' && r.value !== '-') R(vx - 3, y - 2, vw + 6, 5 * k + 4, AMBER_C);
    putC(vx, y, r.value, INKC);
    y += lineH;
  }
  R(L, y - 3, pw - 12, 1, PAPER_SHADE);
  // (the zones: a line of marks, a no-shoot hit and a miss in red)
  let x = L;
  for (const z of m.zones) {
    const t = `${z.n} ${z.word}`, tw = textW(t) * k;
    if (x + tw > Rt && x > L) { x = L; y += lineH - 2; }
    putC(x, y + 2, t, z.k === 'noshoot' || z.k === 'miss' ? RED_C : INKC);
    x += tw + 10;
  }
  if (!m.zones.length) putC(L, y + 2, 'NO HITS', FAINT);
}

/** The paper in parent: { el, update(model | null, { ui, dpr }) → its words, text }. */
export function createTimer(parent) {
  const doc = globalThis.document;
  const root = Object.assign(doc.createElement('div'), { className: 'timer', hidden: true });
  const cv = doc.createElement('canvas');
  root.append(cv);
  parent.append(root);
  let sig = null, words = '';
  return {
    el: root,
    update(m, { ui = 1, dpr = globalThis.devicePixelRatio ?? 1 } = {}) {
      if (!m) { root.hidden = true; words = ''; return ''; }
      root.hidden = false;
      const s = Math.max(1, ui * dpr), sg = JSON.stringify([Math.round(s * 100), m.head, m.rows, m.zones]);
      if (sg !== sig) {
        sig = sg;
        cv.width = Math.round(TIMER_W * s); cv.height = Math.round(TIMER_H * s);
        const g = cv.getContext('2d');
        if (g) { g.imageSmoothingEnabled = false; drawTimer(g, m, s); }
        words = m.text;
        root.dataset.text = words;
        root.dataset.takein = m.rows[0]?.value ?? '';
        root.dataset.first = m.rows[1]?.value ?? '';
        root.dataset.splits = m.rows[2]?.value ?? '';
      }
      return words;
    },
    get text() { return root.hidden ? '' : words; },
  };
}
