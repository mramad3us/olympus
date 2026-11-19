// OLYMPUS sample: the end card's truth cards, three layouts (pure but the plan's pixels, which main.js draws; the overhaul's O-17).
//
// After the lane the end card shows the plan view (src/ui/cards/houseplan.js drawPlan: the house from above, the lane replayed)
// and opens one stand's truth card when you click it. O-17 shows every man and stand you engaged as he truly was at your first
// round, beside the plan, so the lane reads at a glance; this sample lays them out three ways (built in v0.0.24 on your score).
// Every card is the game's own (src/art/doll/hitcard.js paintHitcard, the truth card's model the end card's: lane.json, made by
// ./make.mjs from a lane played to its card, the private by the keys on your seed of 2026-11-17, 4028068471, the house as set);
// the plan's pixels are the game's own drawPlan at the time named (main.js draws them on a canvas and hands them in):
//   ?t=T-a   a row of small cards under the plan, in the order you engaged them, at CARD_MIN (170 px, the smallest the game
//            draws), each captioned with its room and the time of your first round from GO; the plan at the lane's end;
//   ?t=T-b   each card beside its room's line: the run sheet's legs down the right (the leg's word, its time and par), the
//            leg's cards along its line at CARD_MIN; the plan at the lane's end on the left;
//   ?t=T-c   one card at a time under the scrubber, following the replay: two moments of the replay side by side (just after
//            your first round on 1a, in room 1, and on 3b, in room 3), each the plan at that time, the scrubber under it (a
//            segment a leg, the rounds as ticks, the play head) and the card of the stand last engaged at its full 200 px.
// The scrubber here is drawn by this module in the plan's colours (the game's is the page's DOM, housePlanEl).
import { paintHitcard, CARD_W, CARD_MIN } from '../../src/art/doll/hitcard.js';
import { pic, GAP } from '../portrait-lib/card.js';

export const LAYOUTS = Object.freeze(['T-a', 'T-b', 'T-c']), DEFAULT = 'T-a';
/** The plan's size (its frame at 16 px/m: the house's rooms, 30 × 14.3 m, and a 6 px margin, houseplan.js planFrame of lane.json, held by samples-portrait), the scrubber's height. */
export const PLAN_W = 492, PLAN_H = 240, SCRUB_H = 22, LABEL_H = 10, ROW_LABEL_W = 96;
const C = Object.freeze({ bg: 0x0e0f14, label: 0x9aa0ab, head: 0xd8dce4, seg: [0x23252f, 0x2d303b], tick: 0xe7b84a, fault: 0xe0533f, head2: 0xf6f4ee, edge: 0x3a3f4e });
/** Each layout's picture size (sample.json's pixel). */
export const SIZE = Object.freeze({
  'T-a': [GAP + 5 * (CARD_MIN + GAP), GAP + PLAN_H + GAP + LABEL_H + CARD_MIN + GAP],
  'T-b': [GAP + PLAN_W + GAP * 2 + ROW_LABEL_W + 2 * (CARD_MIN + GAP), GAP + 4 * (CARD_MIN + GAP)],
  'T-c': [GAP + 2 * (PLAN_W + GAP), GAP + LABEL_H + PLAN_H + GAP + SCRUB_H + GAP + CARD_W + GAP],
});
const s1 = (ms) => `${(ms / 1000).toFixed(1)} S`;
const roomOf = (leg) => (leg === 3 ? 'HALL' : `ROOM ${leg + 1}`);

/** The plan times a layout needs drawn (ms from GO): the lane's end, or T-c's two moments. */
export function planTimes(look, lane) {
  if (look !== 'T-c') return [lane.laneMs];
  const by = (st) => lane.cards.find(c => c.stand === st);
  return [by('1a'), by('3b')].filter(Boolean).map(c => c.firstMs + 600);
}

/** The picture (see the header): plans, the game's plan pixels at planTimes' times ([{ w, h, px }]). A Pic with .report. */
export function picture(look, lane, plans) {
  const L = LAYOUTS.includes(look) ? look : DEFAULT, [W, H] = SIZE[L], P = pic(W, H, C.bg), report = { frame: [W, H], layout: L, cards: [] };
  const plan = (img, x, y) => { for (let j = 0; j < img.h; j++) for (let i = 0; i < img.w; i++) P.put(x + i, y + j, img.px[j * img.w + i]); };
  const card = (c, x, y, size) => { const pm = paintHitcard({ ...c.model, size }); P.blit(pm, x, y); report.cards.push({ stand: c.stand, leg: c.leg, size: pm.w, marks: pm.marks.length, x, y }); };
  if (L === 'T-a') {
    plan(plans[0], GAP, GAP);
    P.write(GAP + PLAN_W + 8, GAP + 2, `THE PLAN AT THE LANE'S END · ${s1(lane.laneMs)}`, C.label);
    P.write(GAP + PLAN_W + 8, GAP + 12, 'UNDER IT, EACH STAND YOU ENGAGED', C.label);
    P.write(GAP + PLAN_W + 8, GAP + 20, 'AS IT TRULY WAS, IN ORDER', C.label);
    lane.cards.forEach((c, i) => {
      const x = GAP + i * (CARD_MIN + GAP), y = GAP + PLAN_H + GAP;
      P.write(x + 1, y + 2, `${roomOf(c.leg)} · ${c.stand.toUpperCase()} · ${s1(c.firstMs)}`, C.head);
      card(c, x, y + LABEL_H, CARD_MIN);
    });
  } else if (L === 'T-b') {
    plan(plans[0], GAP, GAP);
    const x0 = GAP + PLAN_W + GAP * 2;
    lane.debrief.legs.forEach((leg, k) => {
      const y = GAP + k * (CARD_MIN + GAP), cs = lane.cards.filter(c => c.leg === k), took = (leg.clearAtMs ?? lane.debrief.endAtMs) - leg.fromMs;
      P.fill(x0, y, W - x0 - GAP, CARD_MIN, 0x15161d);
      P.fill(x0, y, W - x0 - GAP, 1, C.edge);
      P.write(x0 + 4, y + 6, leg.word, C.head, 2);
      P.write(x0 + 4, y + 22, s1(took), C.label);
      if (Number.isFinite(leg.parMs)) P.write(x0 + 4, y + 30, `PAR ${s1(leg.parMs)}`, C.label);
      cs.forEach((c, i) => card(c, x0 + ROW_LABEL_W + i * (CARD_MIN + GAP), y, CARD_MIN));
    });
  } else {
    const times = planTimes(L, lane), span = lane.laneMs;
    times.forEach((t, m) => {
      const x = GAP + m * (PLAN_W + GAP), y = GAP + LABEL_H;
      const last = [...lane.cards].filter(c => c.firstMs <= t).sort((a, b) => b.firstMs - a.firstMs)[0];
      P.write(x + 1, y - 8, `THE REPLAY AT ${s1(t)} · THE LAST STAND ENGAGED, ${last ? last.stand.toUpperCase() : '-'}`, C.label);
      plan(plans[m], x, y);
      // (the scrubber: a segment a leg, the rounds as ticks, the play head)
      const sy = y + PLAN_H + GAP, sx = (ms) => x + Math.round((ms / span) * (PLAN_W - 1));
      lane.debrief.legs.forEach((leg, k) => { const a = sx(leg.fromMs - lane.debrief.goAtMs), b = sx(((leg.clearAtMs ?? lane.debrief.endAtMs) - lane.debrief.goAtMs)); P.fill(a, sy, Math.max(1, b - a), SCRUB_H, C.seg[k % 2]); P.write(a + 2, sy + 2, leg.word, C.label); });
      for (const e of lane.debrief.events) if (e.kind === 'round' && e.by === 'me') P.fill(sx(e.atMs - lane.debrief.goAtMs), sy + 12, 1, 8, C.tick);
      for (const e of lane.debrief.events) if (e.kind === 'fault') P.fill(sx(e.atMs - lane.debrief.goAtMs), sy + 12, 1, 8, C.fault);
      P.fill(sx(t), sy - 2, 1, SCRUB_H + 4, C.head2);
      if (last) card(last, x + Math.round((PLAN_W - CARD_W) / 2), sy + SCRUB_H + GAP, CARD_W);
    });
  }
  P.report = report;
  return P;
}
