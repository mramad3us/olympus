// OLYMPUS sample: a man turned on the target card, and the card's body (pure; main.js shows the pictures). The build sheet
// v0.0.23 §1 items 4 and 8 (P§6.3, the overhaul's PP's "the rifle in profile"); the candidates are C's tables (./views.js GROUPS),
// drawn by the game's own code: the doll's facing (src/art/doll/doll.js doll({ facing }), A's src/art/doll/back.js from behind),
// the target card (hitcard.js paintHitcard, the man its subject) and the stage's figure (src/art/figures compose.js and shade.js).
//
// The record's facing is read from your eye (src/sim/people/seen.js: front within π/4 of you, back beyond 3π/4, a side between).
// Each view is one candidate (?v=<id>), the live lane's role-player (utilities, the plate carrier, the force-on-force mask, the R-7):
//   F, a man turned: today's card (v0.0.22's: front on whatever way he faces), then the candidate at the near, mid and far bands;
//      then moving: the card as he turns from you (front, then the candidate's side, then from behind: F1 the default for 'back',
//      F3 for a side), at its paint rate (a new card each time his facing crosses a band), beside the stage's frames of him facing
//      you, side on and away, three times their size.
//   R, the card's body for a man with no marks on him: three records (aimed at you, at the low ready, the hands up) drawn by the
//      candidate's renderer on the card at the near and mid bands: R1 the doll (the default, the card you starred), R2 the stage's
//      figure drawn finer (composeFrame at half the band's px a metre, shown twice its size), R3 the stage's own 16 px/m cell
//      blown up nearest (four times at the near band, in step at the others). R2 and R3 stand on the card with the head at the
//      doll's head row; their chibi head spans a fifth of the figure, so the man-target's marks cannot be life size on them.
import { pic, GAP } from '../portrait-lib/card.js';
import { frameOf, drawFrame, snap } from '../portrait-lib/figure.js';
import { RP, RP_PISTOL, RP_PERSON, STAGE_RP, recOf, cardOf } from '../portrait-lib/posed.js';
import { CARD_W, CARD_MIN, HIT_C, bandOf, figTop, wordsRows } from '../../src/art/doll/hitcard.js';
import { mix } from '../../src/art/doll/grid.js';
import { GROUPS, F4_MORE } from './views.js';

export const RANGES_M = Object.freeze([4, 14, 30]);
const LABEL_H = 9, HEAD = 0xd8dce4, LABEL = 0x9aa0ab, FLOOR = 0x76726c, FK = 3, FCELL = Object.freeze([34 * FK, 48 * FK]);
/** Every candidate, by id: { group, cand }. */
export const CANDIDATES = Object.freeze(Object.fromEntries(['F', 'R'].flatMap(g => GROUPS[g].map(c => [c.id, Object.freeze({ group: g, cand: c })]))));
export const DEFAULT = 'F1';
/** The stage's direction for a facing (the figure facing you is 'down'), and R's three records with their stage frames. */
const DIR_OF = Object.freeze({ front: 'down', right: 'right', left: 'left', profile: 'right', back: 'up' });
export const R_RECS = Object.freeze([
  Object.freeze({ name: 'AIMED AT YOU', hold: Object.freeze({ how: 'rifle-aim' }), aimAt: 'you', frame: 'aim', carry: 'aim' }),
  Object.freeze({ name: 'LOW READY', hold: Object.freeze({ how: 'rifle-low' }), aimAt: null, frame: 'lowReady', carry: 'low' }),
  Object.freeze({ name: 'HANDS UP', hold: Object.freeze({ how: 'up' }), aimAt: null, frame: 'handsUp', carry: 'low' }),
]);
const cardsW = (n) => GAP + n * (CARD_W + GAP);
export const SIZE = Object.freeze({
  F: [Math.max(cardsW(4), GAP + 3 * (CARD_MIN + GAP) + 3 * (FCELL[0] + GAP)), GAP + LABEL_H + LABEL_H + CARD_W + GAP + LABEL_H + Math.max(CARD_W, FCELL[1]) + GAP],
  R: [cardsW(3), GAP + LABEL_H + 2 * (LABEL_H + CARD_W + GAP)],
});
export const sizeOf = (id) => (id === 'F4' ? [SIZE.F[0], SIZE.F[1] + LABEL_H + CARD_W + GAP] : SIZE[CANDIDATES[id]?.group ?? 'F']);

/** The candidate's record of the role-player, its facing and hold as C's table has them. */
const recFor = (cand, facing = cand.rec.facing) => recOf(RP, { ...cand.rec, facing });

/** The stage's figure on a man's card (R2, R3): the card's ground, the frame's pixels k times larger, the head at the doll's head row. */
function stageCard(rec, rangeM, { ppm, k }, words) {
  const S = CARD_W, P = pic(S, S), rows = wordsRows({ words }, S), figH = S - rows.h;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) P.put(x, y, y >= figH ? HIT_C.glass : mix(HIT_C.board, 0x3a3c45, y / figH * 0.6));
  const f = frameOf(STAGE_RP({ carry: rec.carry }), 'down', rec.frame, { ppm }), top = Math.min(...f.px.map(p => p[1]));
  drawFrame(P, f, Math.floor(S / 2), figTop(S) + (f.ay - top) * k, { k, clip: [1, 1, S - 2, figH - 1], snapOn: false });
  P.fill(0, figH, S, 1, HIT_C.edge);
  P.write(6, figH + 6, words, HIT_C.paper, 2);
  for (let x = 0; x < S; x++) { P.put(x, 0, HIT_C.edge); P.put(x, S - 1, HIT_C.edge); }
  for (let y = 0; y < S; y++) { P.put(0, y, HIT_C.edge); P.put(S - 1, y, HIT_C.edge); }
  return P;
}

/** The picture for a query (?v=<id>): a Pic with .report. */
export function picture(q = new URLSearchParams()) {
  const id = CANDIDATES[q.get('v')] ? q.get('v') : DEFAULT, { group, cand } = CANDIDATES[id], [W, H] = sizeOf(id), P = pic(W, H);
  const report = { frame: [W, H], id, group, cards: [] };
  P.write(GAP + 1, GAP + 1, `${id}: ${cand.name}`, HEAD);
  let y = GAP + LABEL_H;
  if (group === 'F') {
    const facing = cand.rec.facing;
    // (a side's today: v0.0.27's F3, the head turned; the back's: v0.0.22's front on)
    const sideOn = facing === 'right' || facing === 'profile';
    P.write(GAP + 1, y + 1, `TODAY (${sideOn ? 'V0.0.27: F3, THE HEAD TURNED' : 'V0.0.22: FRONT ON, HOWEVER HE FACES'}) · THE CANDIDATE, HIM FACING ${facing === 'back' ? 'AWAY' : 'YOUR RIGHT'}, AT 4 M, 14 M AND 30 M`, LABEL);
    y += LABEL_H;
    P.blit(sideOn ? cardOf({ gear: RP, person: RP_PERSON, rec: recFor(cand, 'right'), rangeM: 4, words: 'TODAY · F3 · 4 M', picks: { side: 'F3' } }) : cardOf({ gear: RP, person: RP_PERSON, rec: recFor(cand, 'front'), rangeM: 4, words: 'TODAY · 4 M' }), GAP, y);
    RANGES_M.forEach((r, i) => {
      const c = cardOf({ gear: RP, person: RP_PERSON, rec: recFor(cand), rangeM: r, words: `${id} · ${r} M`, picks: cand.picks ?? null });
      P.blit(c, GAP + (i + 1) * (CARD_W + GAP), y);
      report.cards.push({ rangeM: r, band: c.band, facing });
    });
    y += CARD_W + GAP;
    P.write(GAP + 1, y + 1, 'MOVING: THE CARD AS HE TURNS (A NEW CARD AS HIS FACING CROSSES A BAND) · THE STAGE\'S FRAMES, FACING YOU, SIDE ON, AWAY (X3)', LABEL);
    y += LABEL_H;
    // (the turn: front, then the side, then from behind, when the candidate is the back: the same man at the same moment, so the side
    // card is F1's own record (his hold) drawn as F4 draws a man side on (the art director's pass 3: "front is the low ready, side is
    // aimed, back has no rifle"))
    const side = facing === 'back' ? { ...cand, picks: { ...(cand.picks ?? {}), side: 'F4' } } : cand;
    const turn = facing === 'back' ? [['front', cand], ['right', side], ['back', cand]] : [['front', cand], [facing, cand]];
    // (the turn's cards at the card's smallest size, CARD_MIN, so three and the stage's three frames fit across)
    turn.forEach(([f, c], i) => {
      const card = cardOf({ gear: RP, person: RP_PERSON, rec: recFor(c, f), rangeM: 4, words: f.toUpperCase(), size: CARD_MIN, picks: c.picks ?? null });
      P.blit(card, GAP + i * (card.w + GAP), y);
    });
    const x0 = W - 3 * (FCELL[0] + GAP);
    ['down', DIR_OF[facing === 'back' ? 'right' : facing], 'up'].forEach((dir, i) => {
      const X = x0 + i * (FCELL[0] + GAP), f = frameOf(STAGE_RP({ carry: cand.rec.hold.how === 'rifle-aim' ? 'aim' : 'low' }), dir, cand.rec.hold.how === 'rifle-aim' ? 'aim' : 'lowReady', { ppm: 16 });
      P.fill(X, y, FCELL[0], FCELL[1], snap(FLOOR));
      drawFrame(P, f, X + Math.floor(FCELL[0] / 2), y + FCELL[1] - 4 * FK, { k: FK, clip: [X, y, FCELL[0], FCELL[1]] });
    });
    // (F4: the profile at its other holds and poses, either way he faces, at the near band)
    if (id === 'F4') {
      y += Math.max(CARD_W, FCELL[1]) + GAP;
      P.write(GAP + 1, y + 1, 'F4 AT HIS OTHER HOLDS, EITHER WAY HE FACES (THE LIGHT FROM THE UPPER LEFT ON BOTH) · 4 M', LABEL);
      y += LABEL_H;
      F4_MORE.forEach((m, i) => {
        const gear = m.gear === 'pistol' ? RP_PISTOL : RP, card = cardOf({ gear, person: RP_PERSON, rec: recOf(gear, m.rec), rangeM: 4, words: m.words, picks: { side: 'F4' } });
        P.blit(card, GAP + i * (CARD_W + GAP), y);
        report.cards.push({ rangeM: 4, band: card.band, more: m.words });
      });
    }
  } else {
    [4, 14].forEach((r) => {
      const band = bandOf(r);
      P.write(GAP + 1, y + 1, `${band.id.toUpperCase()} BAND (${r} M, ${band.pxPerM} PX/M): AIMED AT YOU, AT THE LOW READY, THE HANDS UP`, LABEL);
      y += LABEL_H;
      R_RECS.forEach((rr, i) => {
        const rec = recOf(RP, { hold: rr.hold, aimAt: rr.aimAt });
        const words = `${rr.name} · ${r} M`;
        const card = cand.doll ? cardOf({ gear: RP, person: RP_PERSON, rec, rangeM: r, words })
          : cand.stage.k ? stageCard(rr, r, { ppm: cand.stage.ppm, k: Math.max(1, Math.round(cand.stage.k * band.pxPerM / 96)) }, words)
            : stageCard(rr, r, { ppm: Math.round(cand.stage.ppm * band.pxPerM / 96), k: 2 }, words);
        P.blit(card, GAP + i * (CARD_W + GAP), y);
        report.cards.push({ rangeM: r, band: band.id, rec: rr.name });
      });
      y += CARD_W + GAP;
    });
  }
  P.report = report;
  return P;
}
