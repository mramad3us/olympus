// OLYMPUS sample: "A man in the bang", the role-player's daze and cower (the build sheet v0.0.26 §10; pure, main.js shows it).
//
// "Bang, then go" (v0.0.26: room 1 of the Wheel's house 1, two role-players, a G-11 through the door) needs two looks the game
// does not draw yet: a man dazed by the bang (startled, stunned or flash-blind: DAZED on the plaque) and a man frozen (COWERING).
// Each view is one candidate of ./poses.js (?c=<id>), drawn with the game's own code:
//   - the stage: the role-player as the live lane dresses him (utilities, the plate carrier, the force-on-force mask, the R-7;
//     ../portrait-lib/posed.js STAGE_RP) composed at the stage's 16 px/m by src/art/figures/compose.js with the candidate's pose
//     and shaded by shade.js, snapped to the Mars palette as the stage's post pass snaps it, on the house's floor, three times its
//     size: first what the stage draws today (a dazed man at his low ready, a frozen one kneeling at it), then the candidate toward
//     you, away, side on to the right and to the left; a daze each facing twice, its sway's two frames (1 px down, 1.5 Hz);
//   - the target card: today's card for the same man (a dazed man standing at his low ready; a frozen one as C1 draws him), then
//     the candidate's card at the near and mid bands (4 and 14 m), the doll drawn with the candidate's bend
//     (../portrait-lib/posed.js cardOf, paintHitcard's geometry for a man).
// The defaults (D-a, C-a) are what the game builds until the user scores. window.__report: the frame, the candidate and each
// drawn frame's pixel count (a frame that drew nothing would be a broken candidate).
import { pic, GAP } from '../portrait-lib/card.js';
import { frameOf, drawFrame, snap } from '../portrait-lib/figure.js';
import { RP, RP_PERSON, STAGE_RP, recOf, cardOf } from '../portrait-lib/posed.js';
import { CARD_W } from '../../src/art/doll/hitcard.js';
import { GROUPS, DEFAULTS } from './poses.js';

const LABEL_H = 9, HEAD = 0xd8dce4, LABEL = 0x9aa0ab, FLOOR = 0x76726c, FK = 3, FCELL = Object.freeze([34 * FK, 46 * FK]);
/** The facings, as the stage names them: toward you, away, side on to the right and to the left. */
export const FACINGS = Object.freeze(['down', 'up', 'right', 'left']);
export const RANGES_M = Object.freeze([4, 14]);
/** Every candidate, by id: { group, cand }. */
export const CANDIDATES = Object.freeze(Object.fromEntries(Object.entries(GROUPS).flatMap(([g, list]) => list.map(c => [c.id, Object.freeze({ group: g, cand: c })]))));
export const DEFAULT = DEFAULTS.D;
/** The stage's frame today for each group (the frame and the look's carry): a dazed man at his low ready, a frozen one kneeling. */
const TODAY = Object.freeze({ D: ['lowReady', 'low'], C: ['kneelLow', 'low'] });

const cells = (group) => 1 + FACINGS.length * (group === 'D' ? 2 : 1);
/** The picture's size by group. */
export const SIZE = Object.freeze(Object.fromEntries(Object.keys(GROUPS).map(g => [g, [
  Math.max(GAP + cells(g) * (FCELL[0] + GAP), GAP + (1 + RANGES_M.length) * (CARD_W + GAP)),
  GAP + LABEL_H + LABEL_H + FCELL[1] + GAP + LABEL_H + CARD_W + GAP,
]])));

/** The candidate's gear and record on the card, and today's record for the same man. */
export function cardOfCand(cand, group) {
  const c = cand.card, gear = c.front ? { ...RP, rifle: { ...RP.rifle, place: 'front' } } : RP;
  const rec = recOf(gear, { ...(c.pose ? { pose: c.pose } : {}), ...(c.facing ? { facing: c.facing } : {}), hold: { how: c.hold } });
  const today = group === 'C' ? recOf(RP, { pose: 'cower', hold: { how: 'empty' } }) : recOf(RP, { hold: { how: 'rifle-low' } });
  return { gear, rec, bend: c.bend ?? null, today };
}

/** The picture for a query (?c=<id>): a Pic with .report. */
export function picture(q = new URLSearchParams()) {
  const id = CANDIDATES[q.get('c')] ? q.get('c') : DEFAULT, { group, cand } = CANDIDATES[id], [W, H] = SIZE[group], P = pic(W, H);
  const report = { frame: [W, H], id, group, stage: [], cards: [] };
  P.write(GAP + 1, GAP + 1, `${id}: ${cand.name}`, HEAD);
  let y = GAP + LABEL_H;
  P.write(GAP + 1, y + 1, `THE STAGE, 16 PX/M X3: TODAY, THEN TOWARD YOU, AWAY, SIDE ON RIGHT AND LEFT${group === 'D' ? ' · EACH ITS SWAY, TWO FRAMES' : ''}`, LABEL);
  y += LABEL_H;
  const L = STAGE_RP({ carry: 'low' });
  const put = (f, i) => {
    const X = GAP + i * (FCELL[0] + GAP);
    P.fill(X, y, FCELL[0], FCELL[1], snap(FLOOR));
    drawFrame(P, f, X + Math.floor(FCELL[0] / 2), y + FCELL[1] - 4 * FK, { k: FK, clip: [X, y, FCELL[0], FCELL[1]] });
  };
  const [tf, tc] = TODAY[group], today = frameOf(STAGE_RP({ carry: tc }), 'down', tf, { ppm: 16 });
  put(today, 0);
  report.stage.push({ frame: `today:${tf}`, px: today.px.length });
  let i = 1;
  for (const dir of FACINGS) for (const bob of group === 'D' ? [0, 1] : [0]) {
    const f = frameOf(L, dir, 'idle0', { ppm: 16, pose: { ...cand.stage, bob } });
    put(f, i++);
    report.stage.push({ dir, bob, px: f.px.length });
  }
  y += FCELL[1] + GAP;
  P.write(GAP + 1, y + 1, 'THE TARGET CARD: TODAY, THEN THE CANDIDATE AT 4 M AND 14 M', LABEL);
  y += LABEL_H;
  const C = cardOfCand(cand, group);
  P.blit(cardOf({ gear: RP, person: RP_PERSON, rec: C.today, rangeM: 4, words: group === 'D' ? 'TODAY · RIFLE · LOOKING' : 'TODAY · COWERING' }), GAP, y);
  RANGES_M.forEach((r, k) => {
    const card = cardOf({ gear: C.gear, person: RP_PERSON, rec: C.rec, bend: C.bend, rangeM: r, words: `${id} · ${group === 'D' ? 'DAZED' : 'COWERING'} · ${r} M` });
    P.blit(card, GAP + (k + 1) * (CARD_W + GAP), y);
    report.cards.push({ rangeM: r, band: card.band ?? null });
  });
  P.report = report;
  return P;
}
