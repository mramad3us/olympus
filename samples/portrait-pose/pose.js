// OLYMPUS sample: the man as he stands on the target card, and you on the C card (pure; main.js shows the pictures). The build
// sheet v0.0.23 §1 items 4, 5 and 8 (P§6.2, the overhaul's PP); the candidates are C's tables (./poses.js GROUPS, drawn by the
// game's own pose engine: src/art/doll/doll.js POSE_BENDS and worn.js holdGear).
//
// The user, 2026-11-17: the portraits "need to be more dynamic and show us what we would be seeing, including what they are
// holding"; and their rule of 2026-11-12, "anything that moves is shown moving". Each view is one candidate (?c=<id>):
//   - the card: today's card for comparison (v0.0.22's: the man standing, his gear as worn, whatever he does), then the candidate
//     on the target card at the near, mid and far bands (4, 14 and 30 m), the live lane's role-player (utilities, the plate
//     carrier, the force-on-force mask, the R-7; the P-12 out for P); for Y, you on the C card as in a mirror (the doll at the I and
//     C cards' scale, twice its size), today's doll first;
//   - moving: the card at its paint rate as the record changes (it repaints only when the record's key changes, so the strip is
//     the card before and the card after), beside the stage's frames of the same moment, toward you, three times their size, as
//     src/art/figures draws them today (the stage keeps its frames; only the card is new).
// A candidate whose bend is not the game's yet (D2) is drawn with its bend outright (../portrait-lib/posed.js dollOf) on a card
// composed by paintHitcard's own geometry (manCardOf).
import { pic, GAP } from '../portrait-lib/card.js';
import { frameOf, drawFrame, snap } from '../portrait-lib/figure.js';
import { RP, RP_PISTOL, RP_PERSON, ME, ME_PISTOL, ME_PERSON, STAGE_RP, STAGE_ME, recOf, dollOf, cardOf } from '../portrait-lib/posed.js';
import { beatPose } from '../../src/art/figures/walk.js';
import { DOLL_SCALE } from '../../src/art/doll/doll.js';
import { CARD_W } from '../../src/art/doll/hitcard.js';
import { GROUPS } from './poses.js';

export const RANGES_M = Object.freeze([4, 14, 30]);
const LABEL_H = 9, HEAD = 0xd8dce4, LABEL = 0x9aa0ab, FLOOR = 0x76726c, FK = 3, FCELL = Object.freeze([34 * FK, 48 * FK]), YK = 2;
/** Every candidate, by id: { group, cand }. */
export const CANDIDATES = Object.freeze(Object.fromEntries(['A', 'P', 'K', 'D', 'C', 'Y'].flatMap(g => GROUPS[g].map(c => [c.id, Object.freeze({ group: g, cand: c })]))));
export const DEFAULT = 'A1';

/**
 * The moment each group shows moving (see the header): the gear, the record before (the candidate's is after), and the stage's
 * frames of the same moment ([frame, beat or null, the stage look's carry]); Y's by candidate.
 */
const STAGE = Object.freeze({
  A: [['lowReady', null, 'low'], ['raise', null, 'low'], ['aim', null, 'aim']],
  P: [['idle0', 'draw', 'front'], ['idle0', 'pistolAim', 'front']],
  K: [['aim', null, 'aim'], ['idle0', 'kneelGoing', 'aim'], ['kneel', null, 'aim']],
  D: [['lowReady', null, 'low'], ['sitLow', null, 'low']],
  C: [['lowReady', null, 'low']],
  'Y-k': [['lowReady', null, 'low'], ['kneelLow', null, 'low']],
  'Y-g': [['lowReady', null, 'low'], ['heldCan', null, 'front']],
  'Y-12': [['lowReady', null, 'low'], ['idle0', 'draw', 'front']],
  'Y-p': [['lowReady', null, 'low'], ['proneLow', null, 'low']],
});
/** The candidate's gear, its record (after) and the record before. */
export function momentOf(id) {
  const { group, cand } = CANDIDATES[id] ?? CANDIDATES[DEFAULT];
  const you = group === 'Y';
  let gear = group === 'P' ? RP_PISTOL : you ? (id === 'Y-12' ? ME_PISTOL : ME) : RP;
  if (cand.device) gear = { ...gear, rifle: { ...gear.rifle, place: 'front' }, device: { ...cand.device } };
  const after = recOf(gear, { ...cand.rec, facing: 'front' });
  const beforeHow = group === 'P' ? 'pistol-ready' : group === 'K' ? 'rifle-aim' : 'rifle-low';
  const before = recOf(group === 'P' || id === 'Y-12' ? gear : you ? ME : RP, { hold: { how: id === 'Y-12' ? 'rifle-low' : beforeHow }, ...(group === 'K' ? { aimAt: 'you' } : {}) });
  if (id === 'Y-12') before.gear = ME;
  if (id === 'Y-g') before.gear = ME;
  return { group, cand, gear, after, before, bend: cand.bend ?? null, stage: STAGE[group] ?? STAGE[id], person: you ? ME_PERSON : RP_PERSON, you };
}

const cardsW = (n) => GAP + n * (CARD_W + GAP);
const YDOLL = Object.freeze([64 * YK, 140 * YK]);
/** The picture's size by group: the role-players' views and Y's. */
export const SIZE = Object.freeze({
  man: [cardsW(4), GAP + LABEL_H + LABEL_H + CARD_W + GAP + LABEL_H + Math.max(CARD_W, FCELL[1]) + GAP],
  you: [Math.max(GAP + 2 * (YDOLL[0] + GAP) + 3 * (FCELL[0] + GAP), cardsW(2)), GAP + LABEL_H + LABEL_H + YDOLL[1] + GAP + LABEL_H + Math.max(140 + 0, FCELL[1]) + GAP],
});
export const sizeOf = (id) => SIZE[CANDIDATES[id]?.group === 'Y' ? 'you' : 'man'];

/** The stage's frames of the moment, toward you, FK times their size, each on its floor (x, y the strip's top-left). */
function stageStrip(P, x, y, frames, you) {
  const out = [];
  frames.forEach(([frame, beat, carry], i) => {
    const L = you ? STAGE_ME({ carry }) : STAGE_RP({ carry }), X = x + i * (FCELL[0] + GAP);
    const f = frameOf(L, 'down', frame, { ppm: 16, pose: beat ? beatPose(beat, { weapon: 'rifle', carry }) : null });
    P.fill(X, y, FCELL[0], FCELL[1], snap(FLOOR));
    drawFrame(P, f, X + Math.floor(FCELL[0] / 2), y + FCELL[1] - 4 * FK, { k: FK, clip: [X, y, FCELL[0], FCELL[1]] });
    out.push({ frame: beat ?? frame, px: f.px.length });
  });
  return out;
}

/** The picture for a query (?c=<id>): a Pic with .report. */
export function picture(q = new URLSearchParams()) {
  const id = CANDIDATES[q.get('c')] ? q.get('c') : DEFAULT, M = momentOf(id), [W, H] = sizeOf(id), P = pic(W, H);
  const report = { frame: [W, H], id, group: M.group, cards: [], stage: [] };
  P.write(GAP + 1, GAP + 1, `${id}: ${M.cand.name}`, HEAD);
  let y = GAP + LABEL_H;
  if (!M.you) {
    P.write(GAP + 1, y + 1, 'TODAY (V0.0.22: STANDING, HIS GEAR AS WORN) · THE CANDIDATE ON THE TARGET CARD AT 4 M, 14 M AND 30 M', LABEL);
    y += LABEL_H;
    const today = cardOf({ gear: M.gear, person: M.person, rec: recOf(M.gear), rangeM: 4, words: 'TODAY · 4 M' });
    P.blit(today, GAP, y);
    RANGES_M.forEach((r, i) => {
      const c = cardOf({ gear: M.gear, person: M.person, rec: M.after, bend: M.bend, rangeM: r, words: `${id} · ${r} M` });
      P.blit(c, GAP + (i + 1) * (CARD_W + GAP), y);
      report.cards.push({ rangeM: r, band: c.band });
    });
    y += CARD_W + GAP;
    P.write(GAP + 1, y + 1, 'MOVING: THE CARD BEFORE AND AFTER (REPAINTED WHEN WHAT YOU SEE CHANGES) · THE STAGE\'S FRAMES OF THE SAME MOMENT (X3)', LABEL);
    y += LABEL_H;
    P.blit(cardOf({ gear: M.before.gear, person: M.person, rec: M.before, rangeM: 4, words: 'BEFORE' }), GAP, y);
    P.blit(cardOf({ gear: M.gear, person: M.person, rec: M.after, bend: M.bend, rangeM: 4, words: 'AFTER' }), GAP + CARD_W + GAP, y);
    report.stage = stageStrip(P, GAP + 2 * (CARD_W + GAP) + GAP, y, M.stage, false);
  } else {
    P.write(GAP + 1, y + 1, 'YOU ON THE C CARD: TODAY, THEN THE CANDIDATE (X2)', LABEL);
    y += LABEL_H;
    const big = (pm, x) => { for (let j = 0; j < pm.h; j++) for (let i = 0; i < pm.w; i++) { const v = pm.data[j * pm.w + i], c = ((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff); P.fill(x + i * YK, y + j * YK, YK, YK, c); } };
    big(dollOf(M.gear, M.person, DOLL_SCALE, null), GAP);
    big(dollOf(M.gear, M.person, DOLL_SCALE, M.after, M.bend), GAP + YDOLL[0] + GAP);
    y += YDOLL[1] + GAP;
    P.write(GAP + 1, y + 1, 'MOVING: THE C CARD BEFORE AND AFTER · THE STAGE\'S FRAMES (X3)', LABEL);
    y += LABEL_H;
    P.blit(dollOf(M.before.gear, M.person, DOLL_SCALE, M.before), GAP, y);
    P.blit(dollOf(M.gear, M.person, DOLL_SCALE, M.after, M.bend), GAP + 64 + GAP, y);
    report.stage = stageStrip(P, GAP + 2 * (64 + GAP) + GAP, y, M.stage, true);
  }
  P.report = report;
  return P;
}
