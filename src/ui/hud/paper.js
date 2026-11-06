// OLYMPUS hud: the PAPER inset, your card on the 25 m line seen close, its holes as they come (VIEWS §7.5; the build sheet 0.0.5 §2.4 and §8 item 21).
//
// At 16 px/m the card 25 m off is a few pixels on the stage (the stage draws its holes as ink pixels
// there all the same), so the weapon mode's state gives it a rectangle of its own, PAPER (layout.js:
// 200 × 200 at the top centre, under PAUSED's slot): the card at PAPER_K 4 px a centimetre at --ui 1
// (30 × 30 cm, 120 px), its rings (WEAPONS §11.1's: the V inside 1.25 cm, the 5 to 2.5, the 4 to 5, the
// 3 to 7.5, the 2 to 10 cm: the shot role's BANDS × ringCm 2.5), the aiming black over the 4 ring and
// in, the lane and the distance over it, and the holes from rangeLook() (arms' look.js: your lane's
// holes { xCm, yCm, score, v, n }, xCm right and yCm up from the card's centre), each a 6.7 mm hole (the
// 6.5 × 40 mm's bullet: WEAPONS §2.2), torn dark in the paper and light in the black: one card for the
// course, so the string's own holes are numbered by their n (placed round the hole where no other number
// or hole is) with the newest ringed in red, and the earlier strings' holes stay on it plain and dimmer
// (a hole's string read from its n, which starts again at 1 with each string, where it gives none). Only the newest
// hole carries its number (the string's order is the footer's). At a string's cease fire (the range fact { phase: 'string',
// n, score, of, v, list }) the score goes under the card, every shot in order, a miss '-': "STRING 1 · 4 5 - 5 4 · 18 OF 25 · 1 V", and stays
// until the next commence fire. Graphics first (VIEWS §7.6): the score is the one line of words.
//
// paperModel(look, opts) is the pure part (the hole's place in the inset's pixels, its number, the
// newest, the score's line), drawPaper(g, model, s) draws it on a Canvas2D at s device pixels an inset
// pixel (crisp at every --ui and device ratio; its letters the plaques' 3 × 5 alphabet at whole device
// pixels), createPaper(parent) the DOM, redrawn only on change.
import { textW, writeText } from '../plaque.js';

/** The inset's pixels a centimetre of card at --ui 1, and its size (CSS px at --ui 1: layout.js RECTS.PAPER). */
export const PAPER_K = 4, PAPER_PX = 200;
/** The 25 m card: its side and its rings' unit (cm: the shot role's PAPERS.card25), the rings by their outer radius in units (BANDS). */
export const CARD_CM = 30, RING_CM = 2.5;
export const RINGS = Object.freeze([['v', 0.5], ['5', 1], ['4', 2], ['3', 3], ['2', 4]]);
/** The aiming black covers the rings to this one (my call: the 4 ring and in, a 10 cm black at 25 m). */
export const BLACK_TO = '4';
/** A hole's diameter (cm: the 6.5 × 40 mm's bullet, 6.7 mm). */
export const HOLE_CM = 0.67;

const PAPER_C = '#efe6cf', PAPER_EDGE = '#c4bba9', INKC = '#1a1214', RING_ON_PAPER = '#3a3236', RING_ON_BLACK = '#bfb6a0', NEWEST = '#c4574e', FRAME = '#5d4632', GLASS = 'rgba(20, 21, 28, 0.86)';

/** Radius of a ring (cm). */
export const ringR = (name) => (RINGS.find(([n]) => n === name)?.[1] ?? 0) * RING_CM;

/**
 * The inset's model: { lane, card: { x, y, size } (inset px), rings: [{ name, r }], blackR, holes: [{ x, y, r, n,
 * score, v, newest, onBlack }], label, score: line | null }. look: rangeLook()'s lane record ({ lane, holes })
 * or null; string: the session's string now (holes of other strings left off where the holes carry one);
 * last: the last string's result { n, score, of, v, shots } (shown until hot again); hot: the line hot.
 */
export function paperModel(look, { string = null, last = null, hot = false, rangeM = 25, k = PAPER_K, size = PAPER_PX } = {}) {
  const cardPx = CARD_CM * k, x0 = Math.round((size - cardPx) / 2), y0 = Math.round((size - cardPx) / 2) + 4;
  const cx = x0 + cardPx / 2, cy = y0 + cardPx / 2;
  // (one card for the course: every hole on it, the current string's numbered and the earlier ones plain; a hole's string is
  // its own where it says, else read from its number, which starts again at 1 with each string)
  const all = (look?.holes ?? []).filter(h => string === null || h.string === undefined || h.string === string);
  let group = 0;
  const strings = all.map((h, i) => (h.string !== undefined ? h.string : (i > 0 && (h.n ?? 0) <= (all[i - 1].n ?? 0) ? ++group : group)));
  const current = strings.length ? strings[strings.length - 1] : 0;
  const holes = all.map((h, i) => {
    const x = cx + (Number(h.xCm) || 0) * k, y = cy - (Number(h.yCm) || 0) * k, rCm = Math.hypot(Number(h.xCm) || 0, Number(h.yCm) || 0);
    return { x, y, r: (HOLE_CM / 2) * k, n: h.n ?? i + 1, score: h.score ?? 0, v: !!h.v, old: strings[i] !== current, newest: i === all.length - 1, onBlack: rCm <= ringR(BLACK_TO), inCard: Math.abs(h.xCm) <= CARD_CM / 2 && Math.abs(h.yCm) <= CARD_CM / 2 };
  }).filter(h => h.inCard);
  const mine = holes.filter(h => !h.old);
  // (the newest hole alone numbered, beside it where the number meets no hole: up and right first, then round it; the
  // string's order is the footer's (the design review's: five numbers in the black were a knot))
  placeNumbers(mine.filter(h => h.newest), holes);
  // (each shot's score in the string, a miss '-': the fact's list where it gives one (every shot fired, the misses
  // too: the runtime review's), else the string's holes on the card in their order)
  const per = Array.isArray(last?.shots) ? last.shots : mine;
  const scoreLines = last && !hot ? [`STRING ${last.n ?? '?'} · ${per.map(s => (s.hit === false ? '-' : s.v ? 'V' : s.score ?? 0)).join(' ')}`, `${last.score ?? 0} OF ${last.of ?? 0}${last.v ? ` · ${last.v} V` : ''}`] : null;
  const score = scoreLines ? scoreLines.join(' · ') : null;
  return { lane: look?.lane ?? null, card: { x: x0, y: y0, size: cardPx, cx, cy }, rings: RINGS.map(([name, u]) => ({ name, r: u * RING_CM * k })), blackR: ringR(BLACK_TO) * k, holes, label: `LANE ${look?.lane ?? '?'} · ${rangeM} M`, score, scoreLines, hot: !!hot };
}

/** A number's box beside its hole (inset px; the letters LETTER_K a pixel, 3 × 5 a digit). */
const NUM_W = 3 * 2 + 1, NUM_H = 5 * 2;
const NUM_SPOTS = Object.freeze([[3, -12], [3, 3], [-10, -12], [-10, 3], [6, -5], [-13, -5]]);
// (greedy: each numbered hole's number at the first spot round it that meets no number already placed nor any hole)
function placeNumbers(numbered, holes = numbered) {
  const boxes = [];
  const meets = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  for (const h of numbered) {
    let best = null;
    for (const [dx, dy] of NUM_SPOTS) {
      const box = { x: h.x + dx, y: h.y + dy, w: NUM_W, h: NUM_H };
      if (boxes.some(b => meets(b, box)) || holes.some(o => o !== h && meets(box, { x: o.x - 1.5, y: o.y - 1.5, w: 3, h: 3 }))) continue;
      best = box; break;
    }
    best ??= { x: h.x + NUM_SPOTS[0][0], y: h.y + NUM_SPOTS[0][1], w: NUM_W, h: NUM_H };
    boxes.push(best);
    h.numX = best.x; h.numY = best.y;
  }
}

/** A letter pixel is LETTER_K inset pixels (the 3 × 5 alphabet at 10 px tall at --ui 1), whole device pixels. */
export const LETTER_K = 2;
const letterPx = (s) => Math.max(1, Math.round(LETTER_K * s));
/** The plaques' 3 × 5 letters on a Canvas2D, at (x, y) inset pixels, LETTER_K inset pixels a letter pixel (whole device pixels). */
function letters(g, x, y, str, colour, s, k = letterPx(s)) {
  const X = Math.round(x * s), Y = Math.round(y * s);
  g.fillStyle = colour;
  writeText((px, py, w = 1, h = 1) => g.fillRect(X + px * k, Y + py * k, w * k, h * k), 0, 0, str);
}

/** The model on a Canvas2D context at s device pixels an inset pixel. */
export function drawPaper(g, m, s = 1, write = letters) {
  const S = (v) => Math.round(v * s);
  g.clearRect(0, 0, S(PAPER_PX), S(PAPER_PX));
  g.fillStyle = GLASS; g.fillRect(0, 0, S(PAPER_PX), S(PAPER_PX));
  const { x, y, size, cx, cy } = m.card;
  // (the frame's timber round the card, the card, its edge)
  g.fillStyle = FRAME; g.fillRect(S(x - 4), S(y - 4), S(size + 8), S(size + 8));
  g.fillStyle = PAPER_C; g.fillRect(S(x), S(y), S(size), S(size));
  g.fillStyle = PAPER_EDGE; g.fillRect(S(x), S(y + size - 1), S(size), Math.max(1, S(1)));
  // (the black, then the rings: ink on the paper, paper-light in the black)
  g.fillStyle = INKC; g.beginPath(); g.arc(cx * s, cy * s, m.blackR * s, 0, Math.PI * 2); g.fill();
  g.lineWidth = Math.max(1, Math.round(s));
  for (const r of m.rings) {
    g.strokeStyle = r.r <= m.blackR + 0.01 ? RING_ON_BLACK : RING_ON_PAPER;
    g.beginPath(); g.arc(cx * s, cy * s, Math.max(0.5, r.r * s - g.lineWidth / 2), 0, Math.PI * 2); g.stroke();
  }
  // (the holes: torn dark in the paper, light in the black; the newest ringed; each its number in the string)
  // (an earlier string's holes plain and dimmer, under the string's own)
  for (const h of m.holes.filter(x => x.old)) {
    g.fillStyle = h.onBlack ? '#5e574d' : '#6b6359';
    g.beginPath(); g.arc(h.x * s, h.y * s, Math.max(1, h.r * s * 0.9), 0, Math.PI * 2); g.fill();
  }
  for (const h of m.holes.filter(x => !x.old)) {
    g.fillStyle = h.onBlack ? '#b3a994' : '#0b0809';
    g.beginPath(); g.arc(h.x * s, h.y * s, Math.max(1.2, h.r * s), 0, Math.PI * 2); g.fill();
    if (h.newest) { g.strokeStyle = NEWEST; g.lineWidth = Math.max(1, Math.round(s)); g.beginPath(); g.arc(h.x * s, h.y * s, Math.max(3, (h.r + 2.5) * s), 0, Math.PI * 2); g.stroke(); }
    // (its number: light where it sits on the black, ink on the paper)
    if (write && Number.isFinite(h.numX)) { const onBlack = Math.hypot(h.numX + NUM_W / 2 - cx, h.numY + NUM_H / 2 - cy) <= m.blackR; write(g, h.numX, h.numY, String(h.n), onBlack ? '#f4efe6' : '#1a1214', s); }
  }
  if (write) {
    const k = letterPx(s) / s;                                     // (inset pixels a letter pixel)
    write(g, x - 4, y - 7 - 5 * k, m.label, '#dfe2e8', s);
    // (the score under the card, centred, a line each: the string and its shots, then the total; the letters at half size if one is too long)
    (m.scoreLines ?? []).forEach((line, i) => {
      const big = textW(line) * k <= PAPER_PX - 8, small = Math.max(1, Math.round(s)), kk = big ? k : small / s;
      const at = Math.max(2, (PAPER_PX - textW(line) * kk) / 2), ly = y + size + 7 + i * (5 * k + 3);
      if (big) write(g, at, ly, line, '#e7b84a', s); else letters(g, at, ly, line, '#e7b84a', s, small);
    });
  }
}

/** The inset in parent: { el, update(model | null, { ui, dpr }) → its words, text }. */
export function createPaper(parent) {
  const doc = globalThis.document;
  const root = Object.assign(doc.createElement('div'), { className: 'paper', hidden: true });
  const cv = doc.createElement('canvas');
  root.append(cv);
  parent.append(root);
  let sig = null, words = '';
  return {
    el: root,
    update(m, { ui = 1, dpr = globalThis.devicePixelRatio ?? 1 } = {}) {
      if (!m) { root.hidden = true; words = ''; return ''; }
      root.hidden = false;
      const s = Math.max(1, ui * dpr), side = Math.round(PAPER_PX * s);
      const sg = JSON.stringify([side, m.label, m.score, m.holes.map(h => [Math.round(h.x * 10), Math.round(h.y * 10), h.n, h.newest])]);
      if (sg !== sig) {
        sig = sg;
        cv.width = side; cv.height = side;
        const g = cv.getContext('2d');
        if (g) { g.imageSmoothingEnabled = false; drawPaper(g, m, s); }
        const mine = m.holes.filter(h => !h.old), old = m.holes.length - mine.length;
        words = `${m.label}: ${mine.length} hole${mine.length === 1 ? '' : 's'}${mine.length ? ` (${mine.map(h => `${h.n} ${h.v ? 'V' : h.score}`).join(', ')})` : ''}${old ? `, ${old} from earlier strings` : ''}${m.score ? ` · ${m.score}` : ''}`;
        root.dataset.text = words;
        root.dataset.holes = String(m.holes.length);
        root.dataset.string = String(mine.length);
      }
      return words;
    },
    get text() { return root.hidden ? '' : words; },
  };
}
