// OLYMPUS sim: the hit card's marks on a turner, what the marine believes of his rounds while the string runs and what the coach's timer shows after it (VIEWS §4.2, §7.7; COMBAT §25.18.4; the build sheet 0.0.10 §2.2, §8 items 15 to 17).
//
// The user's answer to VIEWS question 22 (DESIGN.md's log): a person hit is shown as the range's targets are, the impact
// points drawn on a doll, belief first and truth after. hitMarks is the one helper of those marks (the card, the end card's
// row of small cards, the tests): it lives in the sim because belief is the sim's, and the art draws what it is given.
// Every round fired at a turner in a string is a mark, numbered in order from 1 (the string's records: pairs.js R.str's
// shots while it runs, stress.js's record's holes from its end; the turner's hits give where each struck).
//
// Belief (phase 'belief', while the string runs): the called point and whether it was seen. The called point is where the
// marine would call his round: from the aim toward where it struck, by his Marksmanship: called = aim + (hole − aim) ×
// CALL_K + blur, CALL_K = clamp(MRK / CALL_MRK, CALL_K_MIN, 1), so a novice calls his aim and an expert his hole; the blur a
// direction and a radius up to CALL_BLUR_CM × (1 − CALL_K) by hash (hash01(seed, 'call', shotId, …): cosmetic, never the
// dice). The aim is the aimed zone's centre (A [0, 0] on the man-target, or the head [0, −30] for a head row; cm from the A
// zone's centre, y down, paper.js PAPERS.man); a miss's hole for the call is the aim plus MISS_CALL_CM along a hash
// direction (where he thinks it went wide). A round that struck the face is seen (a puff on paper at 7 m), drawn filled at
// its called point; belief gives no hole and no zone. Truth (phase 'truth', from the string's end: the coach reads his
// timer, the debrief): every mark's hole and zone as the records have them (a miss: no hole, never on the figure), the
// called point beside it. words: belief 'PAIR · 2 SEEN', truth 'PAIR · A · C'; line (truth only): 'Two in the chest. He
// went down.' (never "dead": a paper man goes down). Pure.
import { hash01 } from '../../core/hash.js';
import { q } from '../../core/num.js';
import { playerId } from '../../core/ids.js';
import { value } from '../skills/skills.js';
import { rangeOf } from '../scenarios/handling.js';

/** The Marksmanship at which the call is the hole (CALL_K 1), the least share of the way a call moves, the blur at CALL_K 0 and a miss's call off the aim (cm). */
export const CALL_MRK = 40, CALL_K_MIN = 0.2, CALL_BLUR_CM = 8, MISS_CALL_CM = 30;
/** The aimed zones' centres on the man-target (cm from A's centre, y down: paper.js PAPERS.man). */
export const AIM_CM = Object.freeze({ torso: Object.freeze([0, 0]), head: Object.freeze([0, -30]) });
const ROW_WORDS = Object.freeze({ 'shot:pair': 'PAIR', 'shot:hammer': 'HAMMER', 'shot:triple': 'TRIPLE', 'shot:failure': 'FAILURE DRILL', 'shot:head': 'TO THE HEAD' });
const ZONE_WORDS = Object.freeze({ A: 'A', C: 'C', head: 'HEAD', ring: 'RING', headDown: 'HEAD DOWN' });
const COUNT = Object.freeze(['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six']);
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);

/** The share of the way from the aim to the hole a marine calls his round at Marksmanship mrk (see the header). */
export const callK = (mrk) => clamp((mrk ?? 0) / CALL_MRK, CALL_K_MIN, 1);

/**
 * A round's called point (pure; see the header): aim and hole [x, y] cm (hole null for a miss), k callK's, the seed and the
 * shot's id for the blur's hash. Returns [x, y] to 0.1 cm.
 */
export function calledAt({ aim, hole, k, seed, shotId }) {
  let h = hole;
  if (!h) { const a = 2 * Math.PI * hash01(seed, 'call', shotId, 'miss'); h = [aim[0] + MISS_CALL_CM * Math.cos(a), aim[1] + MISS_CALL_CM * Math.sin(a)]; }
  const b = 2 * Math.PI * hash01(seed, 'call', shotId, 'dir'), r = hash01(seed, 'call', shotId, 'r') * CALL_BLUR_CM * (1 - k);
  return [q(aim[0] + (h[0] - aim[0]) * k + r * Math.cos(b), 0.1), q(aim[1] + (h[1] - aim[1]) * k + r * Math.sin(b), 0.1)];
}

// (the rounds of string k at turner key, in order: [{ shotId, atMs, part, zone, at, row, ring }], and whether the string is over)
function roundsOf(R, key, k) {
  const s = R.str && R.str.k === k ? R.str : null;
  if (s && !s.done) {
    const T = (R.turners ?? []).find(t => t.key === key);
    return { over: false, T: T ? { key, face: T.face, holds: T.holds, down: Number.isFinite(T.stoppedAtMs) } : null, list: (s.shots ?? []).filter(x => x.fired && x.key === key).map(x => {
      const h = T?.hits.find(z => z.shotId === x.id) ?? null;
      return { shotId: x.id, atMs: x.atMs, part: x.part ?? 'torso', zone: x.zone ?? null, at: h?.at ?? null, row: x.row ?? null, ring: !!x.ring };
    }) };
  }
  const rec = (R.stress?.strs ?? []).find(x => x.k === k);
  if (!rec?.holes) return null;
  return { over: true, T: (rec.turners ?? []).find(t => t.key === key) ?? null, list: rec.holes.filter(h => h.key === key).map(h => ({ shotId: h.shotId, atMs: h.atMs, part: h.part ?? 'torso', zone: h.zone ?? null, at: h.at ?? null, row: h.row ?? null, ring: false })) };
}
// (the string asked for, else the current one, else the last ended)
function stringOf(R, k) {
  if (Number.isInteger(k)) return k;
  if (R.str && !R.str.done) return R.str.k;
  const ended = (R.stress?.strs ?? []).filter(x => x.holes);
  return ended.length ? ended.reduce((a, b) => (b.k > a.k ? b : a)).k : R.str?.k ?? null;
}
// (the truth's line: the rounds in the chest and the head, the misses, and whether he went down; never "dead")
function lineOf(marks, down) {
  const chest = marks.filter(m => m.zone === 'A' || m.zone === 'C').length, head = marks.filter(m => m.zone === 'head' || m.zone === 'headDown').length, miss = marks.filter(m => !m.zone).length;
  const parts = [chest ? `${COUNT[chest] ?? chest} in the chest` : null, head ? `${chest ? (COUNT[head] ?? head).toLowerCase() : COUNT[head] ?? head} in the head` : null].filter(Boolean);
  const hits = parts.length ? parts.join(', ') : 'Nothing on him';
  const wide = miss ? `, ${COUNT[miss]?.toLowerCase() ?? miss} wide` : '';
  return `${hits}${wide}. ${down ? 'He went down.' : 'He stayed up.'}`;
}

/**
 * The hit card's marks on turner key (see the header), or null with no rounds to show or off a range course: { key, k,
 * face, holds, phase, marks: [{ n, shotId, called: [x, y], seen, hole: [x, y] | null, zone, part }], words, line }. k: the
 * string (default the current, else the last ended); phase: 'belief' while it runs, 'truth' from its end, unless given.
 */
export function hitMarks(state, key, { k = null, phase = null } = {}) {
  const R = rangeOf(state);
  if (!R || R.course !== 'pairs') return null;
  const sk = stringOf(R, k);
  if (sk === null) return null;
  const got = roundsOf(R, key, sk);
  if (!got || !got.list.length) return null;
  const ph = phase ?? (got.over ? 'truth' : 'belief'), truth = ph === 'truth';
  const seed = state.meta.seed, sheet = state.people?.[playerId(state)]?.skills, kk = callK(sheet ? value(sheet, 'marksmanship') : 0);
  const marks = got.list.sort((a, b) => a.atMs - b.atMs || (a.shotId < b.shotId ? -1 : 1)).map((x, i) => {
    const aim = AIM_CM[x.part === 'head' ? 'head' : 'torso'], hole = x.zone && x.at ? [x.at[0], x.at[1]] : null;
    return { n: i + 1, shotId: x.shotId, called: calledAt({ aim, hole, k: kk, seed, shotId: x.shotId }), seen: !!x.zone,
      hole: truth ? hole : null, zone: truth ? x.zone : null, part: x.part };
  });
  const T = got.T;
  const rows = [...new Set(got.list.map(x => ROW_WORDS[x.row] ?? 'FIRE'))].join(', ');
  const words = truth ? [rows, ...marks.map(m => ZONE_WORDS[m.zone] ?? 'MISS')].join(' · ') : `${rows} · ${marks.filter(m => m.seen).length} SEEN`;
  return { key, k: sk, face: T?.face ?? null, holds: T?.holds ?? null, phase: ph, marks, words, line: truth ? lineOf(marks, !!T?.down) : null };
}
