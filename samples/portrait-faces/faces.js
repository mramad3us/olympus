// OLYMPUS sample: a man upside down to you, on the target card (pure; main.js shows the pictures). v0.0.25's stage 0, its build
// sheet §10 (the place lens's §5): in the Wreck a man or a board can stand on the deckhead or out of a bulkhead while you stand on
// the deck, so his up is not yours. The card (the target view, the hit card B, the truth cards) is drawn by the game's own doll
// and card code (../portrait-lib/card.js boardFigure and boardCard, posed.js cardOf over src/art/doll/hitcard.js paintHitcard),
// and the candidates differ only in how that card is turned:
//   ?r=R-a  as you see him (the default until scored; the user's of 2026-11-17, "show us what we would be seeing"): the card's
//           figure turned by the quarter turns between his up and yours (the record's `roll`, people/seen.js, built this round:
//           2 for the deckhead seen from the deck, 1 or 3 across a bulkhead), his marks and their numbers turned with him, a man on
//           his side kept whole in the card's figure box (halved, every other pixel, where turned he would not fit); the words
//           under the figure stay upright;
//   ?r=R-b  upright, his face named: the card as the deck draws it, the face in its words ("ON THE DECKHEAD"), the marks upright.
// Three cards a picture, each with two rounds marked where they struck: H2, a threat board on the hold's deckhead at 4 m (roll 2);
// a threat board standing out of the starboard bulkhead at 7 m (roll 1); your #2 on the deckhead at 3 m, a man's card (roll 2).
// Your own I and C cards stay upright in every candidate (the doll is you as you know yourself), so they are not drawn here.
import { pic, GAP, CARD_W, HIT_C, boardFigure, boardCard } from '../portrait-lib/card.js';
import { ME, ME_PERSON, recOf, cardOf } from '../portrait-lib/posed.js';
import { figGeom, bandOf } from '../../src/art/doll/hitcard.js';

export const CANDIDATES = Object.freeze(['R-a', 'R-b']), DEFAULT = 'R-a';
/** The three cards: what, its face's words, the roll (quarter turns between his up and yours), the range (m), the marks (cm from the A zone's centre). */
export const CARDS = Object.freeze([
  Object.freeze({ id: 'H2', kind: 'board', face: 'ON THE DECKHEAD', roll: 2, rangeM: 4, marks: Object.freeze([Object.freeze({ n: 1, at: [3.0, -6.0], kind: 'hole' }), Object.freeze({ n: 2, at: [-4.5, -27.0], kind: 'hole' })]) }),
  Object.freeze({ id: 'S1', kind: 'board', face: 'ON STARBOARD', roll: 1, rangeM: 7, marks: Object.freeze([Object.freeze({ n: 1, at: [1.5, 2.0], kind: 'hole' }), Object.freeze({ n: 2, at: [6.0, 12.0], kind: 'hole' })]) }),
  Object.freeze({ id: '#2', kind: 'man', face: 'ON THE DECKHEAD', roll: 2, rangeM: 3, marks: Object.freeze([]) }),
]);
const LABEL_H = 10, HEAD = 0xd8dce4, LABEL = 0x9aa0ab;
export const SIZE = Object.freeze([GAP + CARDS.length * (CARD_W + GAP), GAP + LABEL_H + CARD_W + GAP + 2 * 7 + GAP]);

// (a card as a Pic of 0xrrggbb, whatever painted it)
function asPic(c) { const P = pic(c.w, c.h); P.blit(c, 0, 0); return P; }
// (the row of the card's frame line under the figure: every pixel inside the frame the edge colour)
function figRows(P) {
  for (let y = 8; y < P.h - 1; y++) { let all = true; for (let x = 1; x < P.w - 1 && all; x++) all = P.get(x, y) === HIT_C.edge; if (all) return y; }
  return P.h - 1;
}
/** A card's figure turned by roll quarter turns (see the header): the words and the frame untouched. Returns { P, halved }. */
export function turnCard(P0, roll) {
  const r = ((roll % 4) + 4) % 4, P = pic(P0.w, P0.h);
  P.col.set(P0.col);
  if (!r) return { P, halved: false };
  const figH = figRows(P0), ground = (y) => P0.get(1, y);
  // (the figure's pixels: those that differ from their row's ground, inside the frame and above the words)
  let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
  const on = (x, y) => P0.get(x, y) !== ground(y);
  for (let y = 1; y < figH; y++) for (let x = 1; x < P0.w - 1; x++) if (on(x, y)) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  for (let y = 1; y < figH; y++) for (let x = 1; x < P0.w - 1; x++) P.put(x, y, ground(y));
  if (x1 < 0) return { P, halved: false };
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1, quarter = r % 2 === 1, tw = quarter ? bh : bw, th = quarter ? bw : bh;
  const halve = tw > P0.w - 2 || th > figH - 1, s = halve ? 2 : 1, ox = 1 + Math.floor((P0.w - 2 - Math.ceil(tw / s)) / 2), oy = 1 + Math.floor((figH - 1 - Math.ceil(th / s)) / 2);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (!on(x, y) || (halve && ((x - x0) % 2 || (y - y0) % 2))) continue;
    const u = x - x0, v = y - y0;
    // (r 2: half a turn; r 1: a quarter turn, his head to your left; r 3: to your right)
    const [a, b] = r === 2 ? [bw - 1 - u, bh - 1 - v] : r === 1 ? [v, bw - 1 - u] : [bh - 1 - v, u];
    P.put(ox + Math.floor(a / s), oy + Math.floor(b / s), P0.get(x, y));
  }
  return { P, halved: halve };
}
function cardFor(c, cand) {
  const words = cand === 'R-b' ? `${c.id} · ${c.face} · ${c.rangeM} M` : `${c.id} · ${c.rangeM} M`;
  if (c.kind === 'board') {
    const fig = boardFigure('threat', 'rifle', 'ready', figGeom(bandOf(c.rangeM).pxPerM).scale);
    return asPic(boardCard({ fig, tone: 'G1', rangeM: c.rangeM, words, marks: c.marks }));
  }
  return asPic(cardOf({ gear: ME, person: ME_PERSON, rec: recOf(ME, { hold: { how: 'rifle-low' } }), rangeM: c.rangeM, words }));
}

/** The picture for a query (?r=R-a|R-b): a Pic with .report. */
export function picture(q = new URLSearchParams()) {
  const cand = CANDIDATES.includes(q.get('r')) ? q.get('r') : DEFAULT, [W, H] = SIZE, P = pic(W, H), cards = [];
  P.write(GAP + 1, GAP + 1, cand === 'R-a' ? 'R-A: TURNED AS YOU SEE HIM, FROM THE DECK · HIS MARKS TURNED WITH HIM · THE WORDS UPRIGHT' : 'R-B: UPRIGHT, HIS FACE NAMED · THE MARKS UPRIGHT', HEAD);
  CARDS.forEach((c, i) => {
    const up = cardFor(c, cand), t = cand === 'R-a' ? turnCard(up, c.roll) : { P: up, halved: false };
    P.blit(t.P, GAP + i * (CARD_W + GAP), GAP + LABEL_H);
    cards.push({ id: c.id, roll: cand === 'R-a' ? c.roll : 0, halved: t.halved });
  });
  const ly = GAP + LABEL_H + CARD_W + GAP;
  P.write(GAP + 1, ly, `H2 A BOARD ON THE HOLD'S DECKHEAD, ROLL 2 · S1 A BOARD OUT OF THE STARBOARD BULKHEAD, ROLL 1 · YOUR #2 ON THE DECKHEAD, ROLL 2`, LABEL);
  P.write(GAP + 1, ly + 7, 'YOU ON THE DECK · YOUR OWN I AND C CARDS STAY UPRIGHT', LABEL);
  P.report = { frame: [W, H], view: cand, cards };
  return P;
}
