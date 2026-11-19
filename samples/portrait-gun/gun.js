// OLYMPUS sample: the gun in his hands on the target card, the pictures (pure; main.js shows them, the tests read them).
//
// The user, 2026-11-17: "the portrait of the NPC holding a gun does not display the gun they are holding". The card is "Bang"'s
// B, the khaki board (src/art/doll/hitcard.js), whose painted man held his gun hanging from the right hand in the board's two
// tones, so the gun was lost in the khaki (P§1: 0 pixels in a tone of their own; the rifle half below the crop). Each picture
// is drawn by ../portrait-lib/card.js over the game's own doll: the figure, its zones, stakes and words as paintHitcard draws
// them, the gun's own pixels toned by the candidate (see that module's header). The stands are your own of seed 4028068471
// (2a the armoured face with a pistol, 1a a threat with a rifle, 3b the hostage card) and a threat with a pistol.
//   ?g=G1|G2|G3   G, how the gun reads: G1 the board's dark ink (the default), G2 its own colours, G3 ink with a khaki rim;
//                 held where W1 says (at the low ready: the rifle across the body, the pistol between both fists), the hostage
//                 card at H1;
//   ?w=W1|W2      W, where the painted man holds it, in G1's ink: W1 at the ready as the stage paints it (the default), W2
//                 hanging from the hand as today with the crop lowered to the knee (rows 4 to 150 at the near band);
//   ?h=H1|H2      H, the hostage card's hostile: H1 his fist at her head, the P-12 level at her temple (the default), H2 his
//                 rifle up beside her shoulder; in belief, in truth with a round to the head, and at the mid band.
// G and W: four columns (2a, 1a, a threat's pistol, 3b) by four rows (today's card at the near band, for comparison and not
// scored; the candidate at the near, mid and far bands: 4, 14 and 30 m). H: today's card and the candidate's three.
// The picture's report: each card's gun pixels in the gun's tone and the share of the gun inside the card's rows.
import { pic, boardFigure, hostageFigure, boardCard, sheetSize, CARD_W, GAP, W2_ROWS } from '../portrait-lib/card.js';
import { figGeom, bandOf, FIG_ROWS } from '../../src/art/doll/hitcard.js';

/** The candidates, and the defaults (the build sheet §3.3's PORTRAIT_PICKS: G1, W1, H1). */
export const GROUPS = Object.freeze({ g: Object.freeze(['G1', 'G2', 'G3']), w: Object.freeze(['W1', 'W2']), h: Object.freeze(['H1', 'H2']) });
export const DEFAULTS = Object.freeze({ g: 'G1', w: 'W1', h: 'H1' });
/** The stands drawn (face, holds, their name on seed 4028068471). */
export const STANDS = Object.freeze([['armoured', 'pistol', '2A'], ['threat', 'rifle', '1A'], ['threat', 'pistol', 'PISTOL'], ['hostage', 'pistol', '3B']]);
/** The bands (m): near, mid, far. */
export const RANGES_M = Object.freeze([4, 14, 30]);
const LABEL_H = 10;
/** Each picture's size (sample.json's pixel). */
export const SIZE = Object.freeze({ g: sheetSize(4, 4, LABEL_H), w: sheetSize(4, 4, LABEL_H), h: sheetSize(4, 1, LABEL_H) });

const scaleOf = (rangeM) => figGeom(bandOf(rangeM).pxPerM).scale;
/** One card: a stand, its hold's place, the gun's tone, the hostage's variant, at a range; words its headline. */
export function card({ face, holds, where = 'ready', tone = 'G1', hostage = 'H1', rangeM = 4, words = '', marks = [], phase = 'belief', line = null }) {
  const sc = scaleOf(rangeM);
  const fig = face === 'hostage' ? hostageFigure(where === 'hand' ? 'today' : hostage, sc) : boardFigure(face, holds, where, sc);
  return boardCard({ fig, tone, rangeM, words, marks, phase, line, rows: where === 'hand' && tone !== 'today' ? W2_ROWS : FIG_ROWS });
}

/** The picture for a query (see the header): a Pic with .report. */
export function picture(q = new URLSearchParams()) {
  const set = q.get('h') ? 'h' : q.get('w') ? 'w' : 'g', cand = GROUPS[set].includes(q.get(set)) ? q.get(set) : DEFAULTS[set];
  const [W, H] = SIZE[set], P = pic(W, H), cards = [];
  const head = { G1: 'G1 · THE BOARD\'S DARK INK, AT THE READY', G2: 'G2 · ITS OWN COLOURS, AT THE READY', G3: 'G3 · INK WITH A KHAKI RIM, AT THE READY', W1: 'W1 · AT THE READY AS THE STAGE PAINTS IT (G1)', W2: 'W2 · HANGING, THE CROP TO THE KNEE (G1)', H1: 'H1 · HIS PISTOL AT HER HEAD', H2: 'H2 · HIS RIFLE UP BESIDE HER' }[cand];
  P.write(GAP + 1, GAP + 1, `${head} · ROW 1 TODAY`, 0x9aa0ab);
  const at = (col, row) => [GAP + col * (CARD_W + GAP), GAP + LABEL_H + row * (CARD_W + GAP)];
  if (set === 'h') {
    const hole = [{ n: 1, at: [2.2, -29.1], kind: 'hole' }], call = [{ n: 1, at: [1.0, -28.0], kind: 'seen' }];
    const list = [
      { face: 'hostage', holds: 'pistol', where: 'hand', tone: 'today', words: 'TODAY · TO THE HEAD', marks: call },
      { face: 'hostage', holds: 'pistol', hostage: cand, words: `${cand} · TO THE HEAD · 1 SEEN`, marks: call },
      { face: 'hostage', holds: 'pistol', hostage: cand, words: `${cand} · TO THE HEAD · HEAD`, marks: hole, phase: 'truth', line: 'One in the head. He went down.' },
      { face: 'hostage', holds: 'pistol', hostage: cand, rangeM: 14, words: `${cand} · 14 M` },
    ];
    list.forEach((c, i) => { const k = card(c), [x, y] = at(i, 0); P.blit(k, x, y); cards.push({ i, words: c.words, gunPx: k.gunPx, inK: +k.inK.toFixed(3), band: k.band }); });
  } else {
    STANDS.forEach(([face, holds, name], col) => {
      [null, ...RANGES_M].forEach((rangeM, row) => {
        const today = rangeM === null, r = today ? 4 : rangeM;
        const where = today || (set === 'w' && cand === 'W2') ? 'hand' : 'ready', tone = today ? 'today' : set === 'g' ? cand : 'G1';
        const k = card({ face, holds, where, tone, hostage: DEFAULTS.h, rangeM: r, words: today ? `TODAY · ${name}` : `${cand} · ${name} · ${r} M` }), [x, y] = at(col, row);
        P.blit(k, x, y);
        cards.push({ stand: name, rangeM: r, today, gunPx: k.gunPx, gunN: k.gunN, inK: +k.inK.toFixed(3), band: k.band });
      });
    });
  }
  P.report = { frame: [W, H], set, candidate: cand, cards };
  return P;
}
