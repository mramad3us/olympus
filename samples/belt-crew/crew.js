// OLYMPUS sample: "The holdouts", the dress of the armed men aboard the Patient Mule (the build sheet v0.0.27 §10, item 16; SH§8.2; pure, main.js shows it).
//
// "Away the boarding party" (v0.0.27) draws pirates or smugglers from the seed (COMBAT §14.4's irregulars) and the hauler's own unarmed
// crew; one dress serves both kinds of holdout (the sheet's §0 item 16, my call), the crew always in coveralls. Each view is one
// candidate (?d=<id>), drawn with the game's own code: the figure composed at the stage's 16 px/m by src/art/figures/compose.js and
// shaded by shade.js, snapped to the Belter palette as the hauler's stage's post pass snaps it,
// on the hauler's deck plate, three times its size:
//   row 1  a holdout aimed (the R-7 at the shoulder), toward you, away, side on to the right and to the left, on the deck;
//   row 2  the same on the deckhead, flipped top to bottom as the stage turns a body there (samples/wreck-faces K);
//   row 3  the candidate's three men side by side toward you (its makes, or its mix), then one of the hauler's crew, unarmed, in the
//          coverall the crew always wear.
// The coverall is the game's own, src/art/figures/outfits.js 'beltCoverall' (v0.0.27's look: one piece in a make by the man's seed,
// BELT_MAKES, banded, the head bare, dark work boots; this set shows the three makes side by side, each man's seed one that draws
// it), and the doll draws it too; the light vac suit unsealed is the built 'vacOpen' ("Light vac suit, helmet off": the helmet clipped
// at the pack). The candidates:
//   D-a  coveralls, three makes (Belter blue-grey, rust, faded olive);
//   D-b  the light vac suit unsealed, the helmet at the pack, on every man;
//   D-c  the mixed crew: two in coveralls, one in the vac suit (the default until scored).
// window.__report: the frame, the candidate and each drawn frame's pixel count.
import { pic, GAP } from '../portrait-lib/card.js';
import { frameOf, drawFrame } from '../portrait-lib/figure.js';
import { PALETTES, nearest } from '../../src/art/palette.js';
import { wear, BELT_MAKES, beltMakeOf } from '../../src/art/figures/outfits.js';

// (snapped to the Belter palette as the hauler's stage snaps it (src/art/palette.js 'belt', v0.0.27), memoised)
const SNAPPED = new Map();
const snap = (c) => { if (!SNAPPED.has(c)) SNAPPED.set(c, nearest(c, PALETTES.belt)); return SNAPPED.get(c); };

const LABEL_H = 9, HEAD = 0xd8dce4, LABEL = 0x9aa0ab, PLATE = 0x5a5f63, FK = 3, FCELL = Object.freeze([34 * FK, 46 * FK]);
/** The coveralls' three makes (the game's: outfits.js BELT_MAKES, Belter blue-grey, rust, faded olive), each a cloth colour. */
export const MAKES = Object.freeze(BELT_MAKES.map(M => M.cloth));
/** A seed that draws each make (the game picks a man's make by his seed: beltMakeOf). */
export const MAKE_SEEDS = Object.freeze(BELT_MAKES.map(M => { for (let s = 1; s < 1000; s++) if (beltMakeOf(s) === M) return s; return 1; }));
/** The candidates: each man's dress, three men. */
export const CANDIDATES = Object.freeze({
  'D-a': Object.freeze({ name: 'coveralls, three makes', men: Object.freeze([['coverall', 0], ['coverall', 1], ['coverall', 2]]) }),
  'D-b': Object.freeze({ name: 'the light vac suit unsealed, the helmet at the pack', men: Object.freeze([['vacOpen', 0], ['vacOpen', 1], ['vacOpen', 2]]) }),
  'D-c': Object.freeze({ name: 'the mixed crew: two in coveralls, one in the vac suit', men: Object.freeze([['coverall', 0], ['vacOpen', 1], ['coverall', 2]]) }),
});
export const DEFAULT = 'D-c';
export const FACINGS = Object.freeze(['down', 'up', 'right', 'left']);
/** A man's look: the dress and make, skin and hair by his place in the row, armed (the R-7) or not. */
export function lookOf([dress, make], i, { armed = true } = {}) {
  const skins = [0x9c6b4c, 0xc89a72, 0x6e4a34], hairs = [0x2a2018, 0x5a4030, 0x18120e];
  return wear({ outfit: dress === 'coverall' ? 'beltCoverall' : 'vacOpen', skin: skins[i % 3], head: null, hair: { style: 'medium', color: hairs[i % 3] }, seed: dress === 'coverall' ? MAKE_SEEDS[make] : 11 + i, ...(armed ? { weapon: 'rifle', carry: 'aim', model: 'r7' } : {}) });
}
export const SIZE = Object.freeze([GAP + 4 * (FCELL[0] + GAP), GAP + LABEL_H + 3 * (LABEL_H + FCELL[1] + GAP)]);

/** The picture for a query (?d=<id>): a Pic with .report. */
export function picture(q = new URLSearchParams()) {
  const id = CANDIDATES[q.get('d')] ? q.get('d') : DEFAULT, cand = CANDIDATES[id], [W, H] = SIZE, P = pic(W, H);
  const report = { frame: [W, H], id, frames: [] };
  P.write(GAP + 1, GAP + 1, `${id}: ${cand.name}`, HEAD);
  let y = GAP + LABEL_H;
  const put = (f, i, { flip = false } = {}) => {
    const X = GAP + i * (FCELL[0] + GAP);
    P.fill(X, y, FCELL[0], FCELL[1], snap(PLATE));
    const g = flip ? { ...f, px: f.px.map(([a, b, c, ch]) => [a, 2 * f.ay - b, c, ch]) } : f;
    drawFrame(P, g, X + Math.floor(FCELL[0] / 2), flip ? y + 4 * FK : y + FCELL[1] - 4 * FK, { k: FK, clip: [X, y, FCELL[0], FCELL[1]], snapOn: false, recolour: snap });
  };
  const rows = [['ON THE DECK, AIMED: TOWARD YOU, AWAY, SIDE ON RIGHT AND LEFT', false], ['ON THE DECKHEAD, AIMED, THE SAME FOUR', true]];
  for (const [words, flip] of rows) {
    P.write(GAP + 1, y + 1, words, LABEL); y += LABEL_H;
    FACINGS.forEach((dir, i) => { const f = frameOf(lookOf(cand.men[0], 0), dir, 'aim', { ppm: 16 }); put(f, i, { flip }); report.frames.push({ row: flip ? 'deckhead' : 'deck', dir, px: f.px.length }); });
    y += FCELL[1] + GAP;
  }
  P.write(GAP + 1, y + 1, 'THE THREE MEN TOWARD YOU, THEN ONE OF THE HAULER\'S CREW (ALWAYS IN COVERALLS, UNARMED)', LABEL); y += LABEL_H;
  cand.men.forEach((m, i) => { const f = frameOf(lookOf(m, i), 'down', 'aim', { ppm: 16 }); put(f, i); report.frames.push({ row: 'men', i, dress: m[0], px: f.px.length }); });
  const crew = frameOf(lookOf(['coverall', 2], 1, { armed: false }), 'down', 'idle0', { ppm: 16 });
  put(crew, 3); report.frames.push({ row: 'crew', px: crew.px.length });
  P.report = report;
  return P;
}
