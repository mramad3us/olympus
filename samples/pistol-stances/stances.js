// OLYMPUS sample: the P-12's stances and the R-7 hanging while it is up (pure but today.png, which main.js decodes and hands in).
//
// The user, 2026-11-17: "Graphics : Holding the sidearm with the rifle dangling should be redrawn, sidearm should have the same
// stances (low ready, high ready, aimed, etc) as the rifle". The sim already keeps one posture for whichever gun is in the hands
// (kit.carry.posture: low ready, high ready, aimed, the P-12's own while it is out), and look.js gunLook reports it as
// pistol: { model, posture } beside the rifle's carry 'front' (the R-7 hanging); the art has only two pistol frames ('draw',
// 'pistolAim', poses.js's stance pool), reached only from a stance sheet, which a hanging rifle's carry never has: so the stage
// draws you with the P-12 out as the rifle slung in front and the hands empty (render/figures.js's stand-in, the rifle's carry
// frame), and the pistol nowhere. This set shows the stances to score on the stage's figure, the doll and the card.
//   ?set=today   T, today (for reference, not scored): the stage's own picture of you at the save v0.0.17-house-pistol (the
//                sergeant after Transition, the P-12 at the low ready), three times larger (today.png, made by ./capture.mjs);
//                the doll as the I and C cards draw you then (the pistol at the ready between the fists, the R-7 slung in front);
//                the frame the stage draws (slungFront), the two pistol frames it asks for and never draws ('draw', the low
//                ready, and 'pistolAim', in which the rifle is not drawn at all), and the rifle's own stances for comparison
//                (lowReady, highReady, aim), each in four facings at 16 px/m, twice their size, snapped to the Mars palette.
//   ?ps=PS-a..PS-e  a stance of the P-12 (the candidates, drawn on the portraits round's pose engine and the figure's pistol band,
//                C's): PS-a the low ready (the default), PS-b the high ready, PS-c aimed, PS-d the hand at the holster (the draw
//                and the holster), PS-e the admin (the press check, the slide racked and the clearing; the magazine out and in
//                beside it). Each: you on the I and C cards (today's doll, then the candidate's, twice their size) and a man with
//                his P-12 so on the target card at 4 and 14 m; then the stage's figure at 16 px/m, twice its size, today's frame
//                (the rifle slung in front, no pistol) and the candidate's in four facings, and beside them the frames that go
//                with it (the low ready walking, the shot's kick, the magazine).
//   ?rh=RH1..RH3 the R-7 hanging on its sling while the P-12 is up: RH1 across the chest, muzzle down (the default), RH2 on the
//                strong-side hip, RH3 swung round to the back; at the low ready on the I and C cards (from the front and from
//                behind) and the target card, then the figure standing in four facings and walking side on, the rifle swinging
//                with the stride (a pendulum from the sling), never through the arms.
import { pic, GAP } from '../portrait-lib/card.js';
import { frameOf, drawFrame, snap, marine } from '../portrait-lib/figure.js';
import { beatPose } from '../../src/art/figures/walk.js';
import { poseOf, PISTOL_FRAMES } from '../../src/art/figures/poses.js';
import { CARD_W } from '../../src/art/doll/hitcard.js';
import { ME_PISTOL as ME_P, ME_PERSON, RP_PISTOL, RP_PERSON, STAGE_ME, recOf, dollOf, cardOf } from '../portrait-lib/posed.js';
import { PISTOL_STANCES, RIFLE_HANGS } from '../portrait-pose/poses.js';
import { dressedDoll } from '../../src/art/doll/dress.js';
import { DOLL_SCALE } from '../../src/art/doll/doll.js';

export const SETS = Object.freeze(['today', 'ps', 'rh']);
/** v0.0.27's drawing of the stances redrawn in v0.0.28 (shown first as today's): PS-b the old high ready, PS-c P1 end on. */
const TODAY_OF = Object.freeze({ 'PS-b': Object.freeze({ over: Object.freeze({ hold: Object.freeze({ how: 'pistol-high', place: 'highOld' }) }) }), 'PS-c': Object.freeze({ picks: Object.freeze({ pistol: 'P1' }) }) });
const DIRS = Object.freeze(['down', 'right', 'up', 'left']), K = 2, CW = 34, CH = 40, LABEL_H = 9, LABEL = 0x9aa0ab, HEAD = 0xd8dce4, FLOOR = 0x76726c;
/** The frames shown (see the header): [label, frame, beat pose name or null]. */
export const TODAY_ROWS = Object.freeze([
  Object.freeze(['DRAWN TODAY WITH THE P-12 OUT (SLUNGFRONT): NO PISTOL', [['slungFront', null]]]),
  Object.freeze(['ASKED, NEVER DRAWN: DRAW AND PISTOLAIM (NO RIFLE)', [['idle0', 'draw'], ['idle0', 'pistolAim']]]),
  Object.freeze(['THE RIFLE\'S OWN: LOW READY, HIGH READY, AIMED', [['lowReady', null], ['highReady', null], ['aim', null]]]),
]);
const CELL = [CW * K, CH * K], TODAY_K = 3, CROP = 64, DOLL_W = Math.round(64 * DOLL_SCALE), DOLL_H = Math.round(142 * DOLL_SCALE);
const rowW = (n) => GAP + n * 4 * (CELL[0] + 2) + (n - 1) * 6;
export const SIZE = ({ today: [Math.max(rowW(3), GAP + CROP * TODAY_K + GAP + DOLL_W + GAP), GAP + LABEL_H + Math.max(CROP * TODAY_K, DOLL_H) + GAP + TODAY_ROWS.length * (LABEL_H + CELL[1] + GAP)] });
const ME_PISTOL = { outfit: 'combatSuit', suit: { model: 'ces-1', colour: 'black', helm: null }, carrier: { model: 'pc-m3', pouches: [{ key: 'p1', holds: 2, mags: 1 }, { key: 'p2', holds: 2, mags: 1 }, { key: 'dump', holds: 4, mags: 0 }] }, ears: null, rifle: { model: 'r7', finish: null, place: 'front', mag: true }, pistol: { model: 'p12', place: 'ready', mag: true }, thigh: { holds: 2, mags: 1 }, held: null, devices: [], painted: false, mask: null, hands: null, device: null };
const PERSON = { look: { skin: 'tan', hair: { style: 'medReg', color: 'dark' }, head: null }, sex: 'm' };

/** The frames that go with each stance on the figure (beside its own, side on). */
// (v0.0.23's integration, the lead's call: PS-c aimed takes the aimed walk, pistolAimWalk0 to 3 (the C and D review's fix: the turret's
// arms over the walking legs), so the set shows the P-12 aimed on the move as it shows the low ready's walk)
export const WITH = Object.freeze({ 'PS-a': ['pistolWalk0', 'pistolWalk1', 'pistolWalk2', 'pistolWalk3'], 'PS-b': [], 'PS-c': ['pistolFire', 'pistolAimWalk0', 'pistolAimWalk1', 'pistolAimWalk2', 'pistolAimWalk3'], 'PS-d': [], 'PS-e': ['pistolMag'] });
/** The stage's hang by candidate (compose.js's rig hang: 'front' across the chest, 'hip', 'back'); the doll's are worn.js PISTOL_HANGS'. */
export const HANG_OF = Object.freeze({ RH1: 'front', RH2: 'hip', RH3: 'back' });
const YK = 2, YD = Object.freeze([64 * YK, 140 * YK]), FK = 2, FC = Object.freeze([CW * FK, CH * FK]);
const E2_W = GAP + 2 * (YD[0] + GAP) + 2 * (CARD_W + GAP);
// (two rows of the figure: today's frame and the stance in four facings, then the frames that go with it side on, so none is cut at the edge)
SIZE.ps = [E2_W, GAP + LABEL_H + LABEL_H + YD[1] + GAP + 2 * (LABEL_H + FC[1] + GAP)];
SIZE.rh = [E2_W, GAP + LABEL_H + LABEL_H + YD[1] + GAP + 2 * (LABEL_H + FC[1] + GAP)];
Object.freeze(SIZE);
/** A frame of the figure with the P-12 out, the rifle hanging as the hang says (a pistol frame's own pose, its rig's hang set). */
export function pistolFrame(dir, frame, hang = 'front') {
  const L = STAGE_ME({ carry: 'front' }), p = poseOf(frame, { weapon: 'rifle', carry: 'front' });
  return frameOf(L, dir, 'idle0', { ppm: 16, pose: { ...p, rig: { ...p.rig, hang } } });
}
function cell(P, x, y, f) {
  P.fill(x, y, FC[0], FC[1], snap(FLOOR));
  drawFrame(P, f, x + Math.floor(FC[0] / 2), y + FC[1] - 3 * FK, { k: FK, clip: [x, y, FC[0], FC[1]] });
}
const big = (P, pm, x, y) => { for (let j = 0; j < pm.h; j++) for (let i = 0; i < pm.w; i++) { const v = pm.data[j * pm.w + i]; P.fill(x + i * YK, y + j * YK, YK, YK, ((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff)); } };

/** A candidate's picture (?ps= or ?rh=): see the header. */
function candidate(set, id) {
  const [W, H] = SIZE[set], P = pic(W, H), report = { frame: [W, H], set, id, frames: [] };
  const ps = set === 'ps' ? PISTOL_STANCES.find(c => c.id === id) : PISTOL_STANCES[0], rh = set === 'rh' ? RIFLE_HANGS.find(c => c.id === id) : RIFLE_HANGS[0];
  const hang = rh.hang, rec = (gear, over = {}) => recOf(gear, { ...ps.rec, hang, ...over });
  P.write(GAP + 1, GAP + 1, `${set === 'ps' ? ps.id : rh.id}: ${set === 'ps' ? ps.name : rh.name}`, HEAD);
  let y = GAP + LABEL_H;
  P.write(GAP + 1, y + 1, set === 'ps' ? (TODAY_OF[ps.id] ? 'YOU ON THE I AND C CARDS (X2): TODAY (V0.0.27), THE CANDIDATE · A MAN WITH HIS P-12 SO ON THE TARGET CARD: TODAY, THE CANDIDATE (4 M)' : 'YOU ON THE I AND C CARDS (X2): TODAY, THE CANDIDATE · A MAN WITH HIS P-12 SO ON THE TARGET CARD, 4 M AND 14 M') : 'YOU ON THE I AND C CARDS (X2): FROM THE FRONT, FROM BEHIND · ON THE TARGET CARD, 4 M AND 14 M', LABEL);
  y += LABEL_H;
  // (v0.0.28: PS-b and PS-c redrawn (src/art/doll/held.js pistolHigh, pistolAimed); today's is v0.0.27's drawing, on the doll and the card)
  const was = set === 'ps' ? TODAY_OF[ps.id] ?? null : null;
  big(P, set === 'ps' ? (was ? dollOf(ME_P, ME_PERSON, DOLL_SCALE, rec(ME_P, was.over ?? {}), null, was.picks ?? null) : dollOf(ME_P, ME_PERSON, DOLL_SCALE, null)) : dollOf(ME_P, ME_PERSON, DOLL_SCALE, rec(ME_P)), GAP, y);
  big(P, set === 'ps' ? dollOf(ME_P, ME_PERSON, DOLL_SCALE, rec(ME_P)) : dollOf(ME_P, ME_PERSON, DOLL_SCALE, rec(ME_P, { facing: 'back' })), GAP + YD[0] + GAP, y);
  if (was) [[was, 'TODAY · 4 M'], [null, `${ps.id} · 4 M`]].forEach(([w, words], i) => P.blit(cardOf({ gear: RP_PISTOL, person: RP_PERSON, rec: rec(RP_PISTOL, w?.over ?? {}), rangeM: 4, words, picks: w?.picks ?? null }), GAP + 2 * (YD[0] + GAP) + i * (CARD_W + GAP), y));
  else [4, 14].forEach((r, i) => P.blit(cardOf({ gear: RP_PISTOL, person: RP_PERSON, rec: rec(RP_PISTOL), rangeM: r, words: `${set === 'ps' ? ps.id : rh.id} · ${r} M` }), GAP + 2 * (YD[0] + GAP) + i * (CARD_W + GAP), y));
  y += YD[1] + GAP;
  const across = Math.floor((W - GAP) / (FC[0] + GAP));
  const row = (label, frames) => {
    P.write(GAP + 1, y + 1, label, LABEL);
    y += LABEL_H;
    frames.slice(0, across).forEach(([dir, frame, today], i) => {
      const f = today ? frameOf(marine({ carry: 'front' }), dir, frame, { ppm: 16 }) : pistolFrame(dir, frame, HANG_OF[rh.id]);
      cell(P, GAP + i * (FC[0] + GAP), y, f);
      report.frames.push({ dir, frame, today: !!today, px: f.px.length });
    });
    y += FC[1] + GAP;
  };
  if (set === 'ps') {
    const own = DIRS.map(d => [d, ps.frame]), extra = (WITH[ps.id] ?? []).map(f => ['right', f]);
    row(`THE STAGE (X2): TODAY'S FRAME, THEN ${ps.frame.toUpperCase()} FACING YOU, RIGHT, AWAY, LEFT`, [['down', 'slungFront', true], ...own]);
    if (extra.length) row(`WITH IT, SIDE ON: ${extra.map(e => e[1].toUpperCase()).join(', ')}`, extra);
  } else {
    row('THE STAGE (X2): AT THE LOW READY, FACING YOU, RIGHT, AWAY, LEFT', DIRS.map(d => [d, 'pistolLow']));
    row('WALKING SIDE ON (THE LOW READY ON THE MOVE): THE RIFLE SWINGS WITH THE STRIDE', ['right', 'left'].flatMap(d => ['pistolWalk0', 'pistolWalk1', 'pistolWalk2', 'pistolWalk3'].map(f => [d, f])));
  }
  P.report = report;
  return P;
}

/** The picture: ?ps=<id>, ?rh=<id>, else set 'today' (today: the stage's crop, { w, h, px }). A Pic with .report. */
export function picture(q = new URLSearchParams(), today = null) {
  if (PISTOL_STANCES.some(c => c.id === q.get('ps'))) return candidate('ps', q.get('ps'));
  if (RIFLE_HANGS.some(c => c.id === q.get('rh'))) return candidate('rh', q.get('rh'));
  const [W, H] = SIZE.today, P = pic(W, H), report = { frame: [W, H], set: 'today', frames: [] };
  P.write(GAP + 1, GAP + 1, 'THE STAGE TODAY, THE SAVE V0.0.17-HOUSE-PISTOL (X3) · THE DOLL TODAY (I AND C)', LABEL);
  let y = GAP + LABEL_H;
  if (today) for (let j = 0; j < today.h; j++) for (let i = 0; i < today.w; i++) P.fill(GAP + i * TODAY_K, y + j * TODAY_K, TODAY_K, TODAY_K, today.px[j * today.w + i]);
  P.blit(dressedDoll(ME_PISTOL, PERSON, DOLL_SCALE), GAP + CROP * TODAY_K + GAP, y);
  y += Math.max(CROP * TODAY_K, DOLL_H) + GAP;
  const L = marine({ carry: 'front' });
  for (const [label, frames] of TODAY_ROWS) {
    P.write(GAP + 1, y + 1, label, HEAD);
    y += LABEL_H;
    frames.forEach(([frame, beat], g) => DIRS.forEach((dir, i) => {
      const x = GAP + (g * 4 + i) * (CELL[0] + 2) + g * 6, f = frameOf(L, dir, frame, { ppm: 16, pose: beat ? beatPose(beat, { weapon: 'rifle', carry: 'front' }) : null });
      P.fill(x, y, CELL[0], CELL[1], snap(FLOOR));
      drawFrame(P, f, x + Math.floor(CELL[0] / 2), y + CELL[1] - 3 * K, { k: K, clip: [x, y, CELL[0], CELL[1]] });
      if (i === 0) report.frames.push({ frame: beat ?? frame, px: f.px.length, rifle: f.px.filter(p => ['ŧ', 'ț', 'ď', 'n', 'v'].includes(p[3])).length });
    }));
    y += CELL[1] + GAP;
  }
  P.report = report;
  return P;
}
