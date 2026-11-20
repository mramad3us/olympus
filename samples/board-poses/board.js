// OLYMPUS sample: "A man in a real fight", blind fire and a man down at 0 G (the build sheet v0.0.27 §10; pure, main.js shows it).
//
// "Away the boarding party" (v0.0.27: the Patient Mule's deck 2 at 0 G, armed men who are not role-players, live rounds both ways)
// needs two looks the game does not draw yet: an irregular firing blind from his cover (FIRING BLIND on the plaque) and a man down
// hanging from his locked boots (DOWN, at 0 G). Each view is one candidate of ./poses.js (?c=<id>), drawn with the game's own code:
//   - the stage: a holdout as the boarding's draw dresses him until the dress is scored (the game's Belt coverall, src/art/figures/
//     outfits.js 'beltCoverall', in its blue-grey make, no carrier, no mask, the R-7), composed at the stage's 16 px/m by
//     src/art/figures/compose.js with the candidate's pose and shaded by shade.js, snapped to the Belter palette as the hauler's stage's
//     post pass snaps it, on the hauler's deck plate, three times its size: first what the stage
//     draws today (a man in cover kneeling at the low ready; a man down sitting where he is, the seated band's sitLow), then the
//     candidate toward you, away, side on to the right and to the left; a man down at 0 G also on the deckhead, flipped top to
//     bottom as the stage turns a body on the deckhead (samples/wreck-faces K), toward you and away;
//   - the target card: today's card for the same man (kneeling at the low ready; sitting), then the candidate's card at the near and
//     mid bands (4 and 14 m), the doll drawn with the candidate's bend (../portrait-lib/posed.js cardOf), in the same coverall (the
//     doll draws it too, v0.0.27).
// The defaults (B-a, Z-a) are what the game builds until the user scores. window.__report: the frame, the candidate and each drawn
// frame's pixel count (a frame that drew nothing would be a broken candidate).
import { pic, GAP } from '../portrait-lib/card.js';
import { frameOf, drawFrame } from '../portrait-lib/figure.js';
import { PALETTES, nearest } from '../../src/art/palette.js';
import { RP_PERSON, recOf, cardOf } from '../portrait-lib/posed.js';
import { RP_GEAR } from '../portrait-light/light.js';
import { wear, BELT_MAKES, beltMakeOf } from '../../src/art/figures/outfits.js';
import { CARD_W } from '../../src/art/doll/hitcard.js';
import { GROUPS, DEFAULTS } from './poses.js';

// (snapped to the Belter palette as the hauler's stage snaps it (src/art/palette.js 'belt', v0.0.27), memoised)
const SNAPPED = new Map();
const snap = (c) => { if (!SNAPPED.has(c)) SNAPPED.set(c, nearest(c, PALETTES.belt)); return SNAPPED.get(c); };

const LABEL_H = 9, HEAD = 0xd8dce4, LABEL = 0x9aa0ab, PLATE = 0x5a5f63, FK = 3, FCELL = Object.freeze([34 * FK, 46 * FK]);
/** The holdout's seed: one whose Belt coverall is the blue-grey make (the game picks a man's make by his seed: outfits.js beltMakeOf). */
export const HOLDOUT_SEED = (() => { for (let s = 1; s < 1000; s++) if (beltMakeOf(s) === BELT_MAKES[0]) return s; return 1; })();
/** The facings, as the stage names them: toward you, away, side on to the right and to the left; and the deckhead's two. */
export const FACINGS = Object.freeze(['down', 'up', 'right', 'left']), HEAD_FACINGS = Object.freeze(['down', 'up']);
export const RANGES_M = Object.freeze([4, 14]);
/** Every candidate, by id: { group, cand }. */
export const CANDIDATES = Object.freeze(Object.fromEntries(Object.entries(GROUPS).flatMap(([g, list]) => list.map(c => [c.id, Object.freeze({ group: g, cand: c })]))));
export const DEFAULT = DEFAULTS.B;
/** The stage's frame today for each group: a man in cover kneeling at the low ready; a man down sitting where he is. */
const TODAY = Object.freeze({ B: ['kneelLow', 'low'], Z: ['sitLow', 'low'] });
/** The holdout's stage look (see the header), carrying as given. */
export const HOLDOUT = (over = {}) => wear({ outfit: 'beltCoverall', skin: 0x9c6b4c, head: null, hair: { style: 'medium', color: 0x2a2018 }, seed: HOLDOUT_SEED, weapon: 'rifle', carry: 'low', model: 'r7', ...over });
/** The holdout's card gear: the role-player's (portrait-light) without his carrier or mask, in the coverall, the rifle at the ready. */
export const HOLDOUT_GEAR = Object.freeze({ ...RP_GEAR, outfit: 'beltCoverall', carrier: null, pistol: null, mask: null });
/** The holdout as the card draws him: the role-player's person with the holdout's seed (the coverall's make). */
export const HOLDOUT_PERSON = Object.freeze({ ...RP_PERSON, look: { ...RP_PERSON.look, seed: HOLDOUT_SEED } });

const cells = (group) => 1 + FACINGS.length + (group === 'Z' ? HEAD_FACINGS.length : 0);
/** The picture's size by group. */
export const SIZE = Object.freeze(Object.fromEntries(Object.keys(GROUPS).map(g => [g, [
  Math.max(GAP + cells(g) * (FCELL[0] + GAP), GAP + (1 + RANGES_M.length) * (CARD_W + GAP)),
  GAP + LABEL_H + LABEL_H + FCELL[1] + GAP + LABEL_H + CARD_W + GAP,
]])));

/** The candidate's gear and record on the card, and today's record for the same man. */
export function cardOfCand(cand, group) {
  const c = cand.card, gear = c.front ? { ...HOLDOUT_GEAR, rifle: { ...HOLDOUT_GEAR.rifle, place: 'front' } } : HOLDOUT_GEAR;
  const rec = recOf(gear, { ...(c.pose ? { pose: c.pose } : {}), ...(c.facing ? { facing: c.facing } : {}), hold: { how: c.hold } });
  const today = group === 'Z' ? recOf(HOLDOUT_GEAR, { pose: 'sit', hold: { how: 'rifle-low' } }) : recOf(HOLDOUT_GEAR, { pose: 'kneel', hold: { how: 'rifle-low' } });
  return { gear, rec, bend: c.bend ?? null, today };
}

/** The picture for a query (?c=<id>): a Pic with .report. */
export function picture(q = new URLSearchParams()) {
  const id = CANDIDATES[q.get('c')] ? q.get('c') : DEFAULT, { group, cand } = CANDIDATES[id], [W, H] = SIZE[group], P = pic(W, H);
  const report = { frame: [W, H], id, group, stage: [], cards: [] };
  P.write(GAP + 1, GAP + 1, `${id}: ${cand.name}`, HEAD);
  let y = GAP + LABEL_H;
  P.write(GAP + 1, y + 1, `THE STAGE, 16 PX/M X3: TODAY, THEN TOWARD YOU, AWAY, SIDE ON RIGHT AND LEFT${group === 'Z' ? ' · ON THE DECKHEAD TOWARD YOU AND AWAY' : ''}`, LABEL);
  y += LABEL_H;
  const L = HOLDOUT({ carry: 'low' });
  const put = (f, i, { flip = false } = {}) => {
    const X = GAP + i * (FCELL[0] + GAP);
    P.fill(X, y, FCELL[0], FCELL[1], snap(PLATE));
    if (!flip) { drawFrame(P, f, X + Math.floor(FCELL[0] / 2), y + FCELL[1] - 4 * FK, { k: FK, clip: [X, y, FCELL[0], FCELL[1]], snapOn: false, recolour: snap }); return; }
    // (on the deckhead: the frame flipped top to bottom about its anchor, the feet on the cell's top edge, as the stage turns a body there)
    const g = { ...f, px: f.px.map(([a, b, c, ch]) => [a, 2 * f.ay - b, c, ch]) };
    drawFrame(P, g, X + Math.floor(FCELL[0] / 2), y + 4 * FK, { k: FK, clip: [X, y, FCELL[0], FCELL[1]], snapOn: false, recolour: snap });
  };
  const [tf, tc] = TODAY[group], today = frameOf(HOLDOUT({ carry: tc }), 'down', tf, { ppm: 16 });
  put(today, 0);
  report.stage.push({ frame: `today:${tf}`, px: today.px.length });
  let i = 1;
  for (const dir of FACINGS) {
    const f = frameOf(L, dir, 'idle0', { ppm: 16, pose: cand.stage });
    put(f, i++);
    report.stage.push({ dir, face: 'deck', px: f.px.length });
  }
  if (group === 'Z') for (const dir of HEAD_FACINGS) {
    const f = frameOf(L, dir, 'idle0', { ppm: 16, pose: cand.stage });
    put(f, i++, { flip: true });
    report.stage.push({ dir, face: 'deckhead', px: f.px.length });
  }
  y += FCELL[1] + GAP;
  P.write(GAP + 1, y + 1, 'THE TARGET CARD: TODAY, THEN THE CANDIDATE AT 4 M AND 14 M', LABEL);
  y += LABEL_H;
  const C = cardOfCand(cand, group);
  P.blit(cardOf({ gear: HOLDOUT_GEAR, person: HOLDOUT_PERSON, rec: C.today, rangeM: 4, words: group === 'Z' ? 'TODAY · DOWN' : 'TODAY · RIFLE · AIMING' }), GAP, y);
  RANGES_M.forEach((r, k) => {
    const card = cardOf({ gear: C.gear, person: HOLDOUT_PERSON, rec: C.rec, bend: C.bend, rangeM: r, words: `${id} · ${group === 'Z' ? 'DOWN' : 'FIRING BLIND'} · ${r} M` });
    P.blit(card, GAP + (k + 1) * (CARD_W + GAP), y);
    report.cards.push({ rangeM: r, band: card.band ?? null });
  });
  P.report = report;
  return P;
}
