// OLYMPUS hud: the hit card in the HITCARD rectangle, a turner hit drawn as the doll with its marks (VIEWS §7.7; the build sheet 0.0.10 §2.3, §8 items 16 to 18).
//
// On "Bang" (test-stress) the card stands at the top left under the log's lines (layout.js HITCARD: PAPER keeps the coach's timer,
// the debrief shows both, the picture's middle, the shooter and the coach, stays clear). What it shows is the sim's (src/sim/arms/marks.js hitMarks: one helper, the art draws what it is given): during a
// string only what the marine could tell, the called rings and the seen ones filled ('belief'), at the pause after a round on
// him in stop motion and held HIT_HOLD_MS of real time out of it; from the string's end to the next string's start the holes
// themselves, numbered and coloured by zone, the calls faint under them, and the coach's line ('truth'). The picture is
// src/art/doll/hitcard.js's (paintHitcard: B, the khaki board, the user's pick of 2026-11-08, its figure at the turner's range band
// when the model carries rangeM, else the near band's); this module chooses when, paints it at its
// box's whole pixels (cardSize: 200 from --ui 1, 170 at 1024 × 768) shown at whole device pixels a card pixel where they fit
// (hitFit), and keeps its words on data-text for the tests.
//   hitShown({ phase, n, inStop, lastT, nowT })   whether the card shows (pure)
//   cardModel(hm, { look, face, holds, tabs, rangeM })    paintHitcard's input from hitMarks' record (pure)
//   hitRangeM(T, at, lineM)                       the turner's range, the card's band's input: the line's, else the ground's (pure)
//   hitTabs(keys, shown, laneOf)                  the tabs of a string with two turners hit, newest first (pure)
//   createHitcard(parent, { paint })              the DOM: update(model | null, { ui, dpr }) → its words
import { CARD_W, cardSize, bandOf } from '../../art/doll/hitcard.js';
import { PAPERS } from '../../sim/arms/paper.js';

/** Out of stop motion the card in belief stays this long after its last change or the mode's end (ms of real time: VIEWS §7.7). */
export const HIT_HOLD_MS = 6000;
/** The look drawn (the user's scores of 2026-11-08: B ★ 99, "Second set is perfect"; A and C are gone from the art). */
export const HIT_LOOK = 'B';
/** Under this share of its box a card at whole device pixels is drawn smooth at the box's size instead (my call: 1920 × 1080's 200 in 300 is 0.67, kept crisp). */
export const HIT_FIT_MIN = 0.66;

/** Whether the card shows: any round fired at him; in truth always, in belief in stop motion or within HIT_HOLD_MS of its last change. */
export function hitShown({ phase = null, n = 0, inStop = false, lastT = -Infinity, nowT = 0 } = {}) {
  if (!n) return false;
  if (phase === 'truth') return true;
  return !!inStop || nowT - lastT < HIT_HOLD_MS;
}

/**
 * The card's size and its CSS pixels a card pixel, and whether it is drawn smooth: { size, k, smooth }. The card is painted at
 * cardSize(ui) card pixels (CARD_W from --ui 1, its box's whole pixels down to 170 at 1024 × 768's 0.85: the runtime review of
 * 0.0.10, as the 200 px card resampled to 170 smeared its marks and words), shown at whole device pixels (the largest that fit
 * its box, CARD_W × ui) where that keeps HIT_FIT_MIN of the box, else at the box's own scale, smooth (a box under 170 px).
 */
export function hitFit(ui = 1, dpr = 1) {
  const size = cardSize(ui), fill = (CARD_W * ui) / size, n = Math.floor(fill * dpr + 1e-6), k = n / dpr;
  return n >= 1 && k >= fill * HIT_FIT_MIN ? { size, k, smooth: false } : { size, k: fill, smooth: true };
}

/** The tabs of a string's turners hit, newest first: [{ key, label: 'L3', on }]; laneOf(key) the turner's lane. */
export function hitTabs(keys = [], shown = null, laneOf = () => null) {
  return keys.map(key => ({ key, label: `L${laneOf(key) ?? '?'}`, on: key === shown }));
}

/**
 * The turner's range, in metres, the input of the card's band (bandOf: near up to 10 m, mid up to 25 m, far beyond). On a
 * course it is the line the shooter stands on (lineM: the range's R.line), as the coach calls it: "Bang"'s six turners are all
 * on its 7 m line though lane 6 is 13.9 m from lane 2 on the ground. With no line, the distance on the ground (x and z, to a
 * tenth of a metre); null when there is neither, so the card draws the near band.
 */
export function hitRangeM(T, at, lineM = null) {
  if (Number.isFinite(lineM) && lineM > 0) return lineM;
  if (!T || !at || ![T.x, T.z, at.x, at.z].every(Number.isFinite)) return null;
  return Math.round(Math.hypot(T.x - at.x, T.z - at.z) * 10) / 10;
}

/** paintHitcard's input from hitMarks' record ({ key, k, face, holds, phase, marks, words, line, rangeM? }), the look, the tabs and the turner's range (metres: its band; none, the near band). */
export function cardModel(hm, { look = HIT_LOOK, face = null, holds = null, tabs = [], rangeM = null } = {}) {
  if (!hm) return null;
  const range = Number.isFinite(rangeM) ? rangeM : Number.isFinite(hm.rangeM) ? hm.rangeM : null;
  return { look, man: PAPERS.man, key: hm.key, k: hm.k, face: face ?? hm.face ?? 'threat', holds: holds ?? hm.holds ?? 'rifle', phase: hm.phase, marks: (hm.marks ?? []).map(m => ({ ...m })), words: hm.words ?? '', line: hm.line ?? null, tabs, rangeM: range };
}

/** The card's words as the tests read them: "PAIR · A · C | Two in the chest. He went down." (the line in truth only). */
export const cardText = (m) => (m ? [m.words, m.phase === 'truth' ? m.line : null].filter(Boolean).join(' | ') : '');

/** The card in parent: { el, update(model | null, { ui, dpr }) → its words, text, last (the drawn marks) }. paint: paintHitcard. */
export function createHitcard(parent, { paint } = {}) {
  const doc = globalThis.document;
  const root = Object.assign(doc.createElement('div'), { className: 'hitcard', hidden: true });
  const cv = doc.createElement('canvas');
  cv.width = CARD_W; cv.height = CARD_W;
  root.append(cv);
  parent.append(root);
  let sig = null, words = '', drawn = null, fitSig = null;
  return {
    el: root,
    update(m, { ui = 1, dpr = globalThis.devicePixelRatio ?? 1 } = {}) {
      if (!m) { root.hidden = true; words = ''; return ''; }
      root.hidden = false;
      const fit = hitFit(ui, dpr), fs = `${fit.size}|${fit.k}|${fit.smooth}`;
      if (fs !== fitSig) { fitSig = fs; sig = null; cv.width = fit.size; cv.height = fit.size; cv.style.width = `${fit.size * fit.k}px`; cv.style.height = `${fit.size * fit.k}px`; cv.style.imageRendering = fit.smooth ? 'auto' : 'pixelated'; root.dataset.k = String(fit.k); root.dataset.size = String(fit.size); root.dataset.smooth = fit.smooth ? '1' : ''; }
      const sg = JSON.stringify([m.look, bandOf(m.rangeM ?? null).id, m.face, m.holds, m.phase, m.marks.map(x => [x.n, x.called, x.seen, x.hole, x.zone]), m.words, m.line, m.tabs]);
      if (sg !== sig && paint) {
        sig = sg;
        const pm = paint({ ...m, size: fit.size });
        const g = cv.getContext('2d');
        if (g && pm) { g.putImageData(new ImageData(new Uint8ClampedArray(pm.data.buffer.slice(0)), pm.w, pm.h), 0, 0); drawn = pm.marks ?? null; }
        words = cardText(m);
        root.dataset.text = words;
        root.dataset.phase = m.phase ?? '';
        root.dataset.key = m.key ?? '';
        root.dataset.marks = JSON.stringify((drawn ?? []).map(d => [d.n, d.kind, d.zone, d.x, d.y]));
      }
      return words;
    },
    get text() { return root.hidden ? '' : words; },
    get last() { return drawn; },
  };
}
