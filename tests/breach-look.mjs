// OLYMPUS tests: one map of a role-player's state to what is shown of him (the build sheet v0.0.26 item 6, §3.3, F143), shared by
// breach-look (node) and ui-breach (the page imports it: src and this file only, nothing of node).
//
// Item 6's map, in its precedence: down (or ruled out sitting: his actor's posture) → the stage's sit, the card's sit, DOWN; giving (the rifle lowered,
// then on the floor, hands up) → HANDS UP; shocked (his combat block's startle, stun or flash-blindness after now: supp.js startled,
// blockOf), not down or giving → the stage's daze (daze0 or daze1, dazeKneel0 or dazeKneel1 on his knee), the card's daze or
// dazeKneel, DAZED; frozen (st 'freeze') → the stage's cower, the card's cower, COWERING; else the rest. mapOf(state, T, ms) reads
// each side by its own reader, never the others':
//   oracle  the sim, here: his live record's st and give, and the shock from supp.js directly (not men.js liveStateOf, which the
//           plaque's side reads, so a wrong liveStateOf disagrees);
//   stage   the frame the view draws him in, by the view's own precedence (render/view.js's figure loop: his hands up with no gun
//           record, sitting (people/figure.js figureOf's posture, the person's, as the view reads it), else poses.js rifleFrame of look.js gunLook, with the daze's sway): standing still, as he is when shocked;
//   look    the stage's role-players' look, opfor.js opforLook's frame (A's map: 'daze' before 'cower');
//   card    the Seen record's pose and hold (seen.js seenOf: what the target card draws);
//   plaque  the word an identification writes now (ui/plaque.js STATE_WORDS of men.js liveStateOf, contact.js identify's).
// classOf* turn each into one of 'down', 'hands', 'dazed', 'cowering' or 'other'; agree(m) holds the shock's two classes exactly
// across all five, both ways (the new map's rows), and a man down drawn, carded and named down (one way: a man ruled out standing is
// carded and named down as v0.0.19 built it, not this round's); the give is not held here (the drop's lowered rifle is the stage's
// own frame, v0.0.19's), only printed.
import { gunLook } from '../src/sim/arms/look.js';
import { rifleFrame, dazeSway } from '../src/art/figures/poses.js';
import { seenOf } from '../src/sim/people/seen.js';
import { figureOf } from '../src/sim/people/figure.js';
import { liveStateOf } from '../src/sim/combat/men.js';
import { startled, blockOf } from '../src/sim/combat/supp.js';
import { opforLook } from '../src/sim/scenarios/opfor.js';
import { STATE_WORDS } from '../src/ui/plaque.js';

/** The sim's class of a live man at ms (see the header). */
export function oracleOf(state, T, ms) {
  const L = T.live, c = blockOf(state, L.who);
  const shocked = startled(state, L.who, ms) || (!!c && ((c.blindUntilMs ?? 0) > ms || (c.stunUntilMs ?? 0) > ms));
  if (L.st === 'down' || (L.st === 'out' && (state.actors.list.find(x => x.who === L.who)?.posture ?? 'stand') === 'sit')) return 'down';
  if (L.give || L.st === 'hands') return 'hands';
  if (shocked) return 'dazed';
  if (L.st === 'freeze') return 'cowering';
  return 'other';
}
/** The frame the view draws a standing man in (see the header), its sway at ms (still: "reduce flashes"). */
export function stageFrameOf(state, a, ms, { still = false } = {}) {
  const gl = state.people?.[a.who]?.kit ? gunLook(state, a, ms) : null;
  if (a.hands === true && !gl) return a.stance === 'kneel' ? 'handsKneel' : 'handsUp';
  if ((figureOf(state, a, ms).posture ?? 'stand') === 'sit') return 'sit';
  return dazeSway(gl ? rifleFrame(gl).frame : null, ms, still);
}
export const classOfStage = (f) => (/^daze(Kneel)?[01]$/.test(f ?? '') ? 'dazed' : f === 'cower' ? 'cowering' : f === 'sit' || f === 'sitLow' ? 'down' : f === 'handsUp' || f === 'handsKneel' ? 'hands' : 'other');
export const classOfLook = (f) => (f === 'daze' ? 'dazed' : f === 'cower' ? 'cowering' : f === 'sit' ? 'down' : f === 'hands' || f === 'kneel' || f === 'drop' ? 'hands' : 'other');
export const classOfCard = (r) => (!r ? 'other' : r.pose === 'daze' || r.pose === 'dazeKneel' ? 'dazed' : r.pose === 'cower' ? 'cowering' : r.pose === 'sit' ? 'down' : r.hold?.how === 'up' || r.frame === 'drop' ? 'hands' : 'other');
export const classOfWord = (w) => ({ DAZED: 'dazed', COWERING: 'cowering', DOWN: 'down', 'HANDS UP': 'hands' }[w] ?? 'other');

/** Every side of one live man at ms (see the header): { key, ms, oracle, stage, look, card, plaque, frames: { stage, look, pose, how, word } }. */
export function mapOf(state, T, ms = state.clock.ms, { still = false, looks = null } = {}) {
  const a = state.actors.list.find(x => x.who === T.live.who);
  const f = stageFrameOf(state, a, ms, { still }), lk = (looks ?? opforLook(state, ms)).find(m => m.key === T.key) ?? null;
  const rec = seenOf(state, T.live.who, { ms }), word = STATE_WORDS[liveStateOf(state, T, ms)] ?? null;
  return { key: T.key, ms, oracle: oracleOf(state, T, ms), stage: classOfStage(f), look: classOfLook(lk?.frame), card: classOfCard(rec), plaque: classOfWord(word),
    frames: { stage: f, look: lk?.frame ?? null, pose: rec?.pose ?? null, how: rec?.hold?.how ?? null, word } };
}
/** Whether the sides agree (see the header): the shock's classes across all five, down across the four that draw it. */
export function agree(m) {
  for (const k of ['dazed', 'cowering']) { const on = [m.oracle, m.stage, m.look, m.card, m.plaque].map(c => c === k); if (on.some(Boolean) && !on.every(Boolean)) return false; }
  return m.oracle !== 'down' || (m.stage === 'down' && m.card === 'down' && m.plaque === 'down');
}
