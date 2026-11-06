// OLYMPUS sim: paper targets on the range, where a round lands on the card and what it scores (WEAPONS §11.1, §11.3; the build sheet 0.0.5 §2.2, §8 items 5 and 21).
//
// A paper target is aimed at as anyone is (src/sim/arms/shooting.js targetsOf: 'paper:<lane>'), its DC
// the card's own targetDC (PAPERS: the 25 m card at +6, tradecraft's bull's "precise work") in place
// of a person's part. Where the round goes is the roll's: the ring by the margin over the DC
// (KD_RINGS, WEAPONS §11.1's rings: a 5 at margin 9 or more, a V, the tie-breaker, at 13; a 4 at 5 to
// 8; a 3 at 1 to 4; a 2, the card's edge, at −3 to 0; below that off the paper and into the berm),
// a natural 20 at least a 2 and a natural 1 a miss whatever the sum. Inside its ring the hole's place
// is a hash of the world's seed and the shot's id (holeOf: hash('hole', seed, shotId), so each career's
// card has its own pattern, as tradecraft's took the seed; the angle and the radius within the ring's
// band, BANDS in ring widths of the card's ringCm), never the dice (WEAPONS §7.11: nothing cosmetic
// moves a roll), so the hole the stage inks, the PAPER inset and the roll in the log agree.
// scoreOf(holes) is a string's or a course's: shots, hits (on the paper), the score out of 5 a shot,
// the Vs, and the group's extreme spread in cm (the two holes furthest apart, as a coach measures).
// Adapted from tradecraft v0.2.0-rc3 src/sim/paper.js (RINGS by the margin, BANDS, group(), the hole's
// place off the dice), its club rings re-cut to the Corps' KD scoring. This module goes into 0.0.7's
// qual.js (WEAPONS §15) with the A and B targets.
// Pure.
import { hash01 } from '../../core/hash.js';

/** The paper targets (WEAPONS §11.1; the build sheet §2.2): word, DC term, size (cm, w × h), ring width (cm). */
export const PAPERS = Object.freeze({
  card25: Object.freeze({ word: 'the 25 m card', targetDC: 6, sizeCm: Object.freeze([30, 30]), ringCm: 2.5 }),
});
/** The rings by the roll's margin, best first (WEAPONS §11.1); below the last, a miss. */
export const KD_RINGS = Object.freeze([
  Object.freeze({ from: 13, score: 5, v: true, band: 'v', word: 'a V, dead centre' }),
  Object.freeze({ from: 9, score: 5, band: '5', word: 'a 5' }),
  Object.freeze({ from: 5, score: 4, band: '4', word: 'a 4' }),
  Object.freeze({ from: 1, score: 3, band: '3', word: 'a 3' }),
  Object.freeze({ from: -3, score: 2, band: '2', word: 'a 2, on the edge' }),
]);
/** Each ring's radius band in ring widths (the V half the 5's). */
export const BANDS = Object.freeze({ v: Object.freeze([0, 0.5]), 5: Object.freeze([0.5, 1]), 4: Object.freeze([1, 2]), 3: Object.freeze([2, 3]), 2: Object.freeze([3, 4]) });
/** A round off the paper. */
export const MISS_WORD = 'off the paper, into the berm';

/** The ring a roll's margin earns (KD_RINGS' record), or null for a miss (see the header). */
export function ringOf(margin, nat = 0) {
  if (nat === 1) return null;
  const ring = KD_RINGS.find(q => margin >= q.from) ?? null;
  return ring ?? (nat === 20 ? KD_RINGS[KD_RINGS.length - 1] : null);
}

const r1 = (v) => Math.round(v * 10) / 10;
/**
 * Where a round lands on a paper (see the header): { at: [xCm, yCm] | null, score, v, word }, at in cm
 * from the card's centre, x right and y down as the stage draws the card; null for a miss.
 */
export function holeOf(paperId, roll, shotId, seed = 0) {
  const P = PAPERS[paperId] ?? PAPERS.card25;
  const ring = roll ? ringOf(roll.margin, roll.nat) : null;
  if (!ring) return { at: null, score: 0, v: false, word: MISS_WORD };
  const [lo, hi] = BANDS[ring.band];
  const t = hash01('hole', seed, shotId, 'angle') * Math.PI * 2, d = (lo + hash01('hole', seed, shotId, 'radius') * (hi - lo)) * P.ringCm;
  return { at: [r1(Math.cos(t) * d), r1(Math.sin(t) * d)], score: ring.score, v: !!ring.v, word: ring.word };
}

/** A string's or a course's holes ({ at, score, v }…) scored: { shots, hits, score, of, v, groupCm }. */
export function scoreOf(holes = []) {
  const hits = holes.filter(h => h.at);
  let spread = 0;
  for (let i = 0; i < hits.length; i++) for (let j = i + 1; j < hits.length; j++) spread = Math.max(spread, Math.hypot(hits[i].at[0] - hits[j].at[0], hits[i].at[1] - hits[j].at[1]));
  return { shots: holes.length, hits: hits.length, score: holes.reduce((t, h) => t + (h.score ?? 0), 0), of: 5 * holes.length, v: hits.filter(h => h.v).length, groupCm: r1(spread) };
}

/** A string's score in words: '17 of 25, 1 V, four on the paper'. */
export function scoreWords(s) {
  const NUM = ['none', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  const on = s.hits === s.shots ? `all ${NUM[s.shots] ?? s.shots} on the paper` : s.hits ? `${NUM[s.hits] ?? s.hits} of ${NUM[s.shots] ?? s.shots} on the paper` : 'nothing on the paper';
  return `${s.score} of ${s.of}${s.v ? `, ${s.v} V` : ''}, ${on}`;
}
