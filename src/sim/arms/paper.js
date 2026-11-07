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
//
// 0.0.7, faces in real units (WEAPONS §11.1, §11.4; the build sheet 0.0.7 §2.1, §8 items 2 and 3). The 25 m
// card keeps v0.0.5's hole by the margin and its hash (test-handling's holes, scores and words byte for byte:
// the user scored it 100/100/100). The new papers place a hole where the round goes, in centimetres: the
// 25 m zeroing card (zero25: 30 × 30 cm, a 1 cm grid, the aim box at its centre and the BZO's mark
// ZERO25_MARK_CM under it, where a zeroed rifle strikes at 25 m; its rings 1 cm, so a group is the size a
// zero can be read from), and the Corps' KD faces A (kdA, 100 ×
// 100 cm, rings of 7.5 cm, the black 15 cm across the radius, targetDC −11) and B (kdB, 120 × 120, rings
// of 11.25, targetDC −13): each ring's edge at 0.5, 1, 2, 3 and 4 ring widths (V, 5, 4, 3, 2), so the
// 2-ring's edge is WEAPONS §11.1's bias radius (30 and 45 cm). faceHole(): the roll decides the group's
// spread as tradecraft's does (the margin's band, KD_RINGS', in ring widths, its angle and radius by the
// hash; a miss, natural 1 or under the edge's margin, MISS_BAND 4 to 6 widths out), then the round's
// offset from the point of aim (shot.js poiOf: the zero, the path, the wind, the hold) moves it in
// centimetres, and the ring is scored where it lands (ringAt): so a wrong zero or a wrong wind call is
// seen on the paper and costs the score, never the roll (the build sheet §8 item 2). faceOdds() is the
// plaque's figure on a face: the d20's twenty faces, each band on a fixed 8 × 32 quadrature, moved by the
// believed offset; cached. groupOf() and callOf() are the coach's: a group's centre and the clicks that
// move it onto the mark (a low group dials up; y is down on paper); poolOf() every group since the first as
// one, each hole moved by the clicks dialled since (a coach's best read of a zero).
//
// 0.0.8, the man-target (COMBAT §25.10.3, §25.6.3; the build sheet 0.0.8 §2.2, §8 item 15): the turners' face, a
// man's silhouette 46 × 76 cm, its torso 46 × 56 cm under a head of 8 cm radius, its A zone 16 × 28 cm on the upper
// chest (PAPERS.man; centres in cm from the face's centre, y down). A turner is a man-target, so its DC is a
// person's by the part (shot.js dcOf: torso 0, head +6), not a paper's, and where the round lands is the roll's
// quality, as a shoot house scores it (COMBAT §25.6.3): manHole() puts a torso round at a margin of A_MARGIN 4 or
// more (SKILLS §5.6's "good") in the A zone, a pass in the C zone (the torso outside A), a head round that passes in
// the head; a failed roll is past him into the berm. The place inside its zone by hash of the world's seed and the
// shot's id, as holeOf's, never the dice.
// Pure.
import { hash01 } from '../../core/hash.js';
import { CLICK_MRAD, ZERO25_MARK_CM } from './ballistics.js';

/** The paper targets (WEAPONS §11.1; the build sheet §2.2): word, DC term, size (cm, w × h), ring width (cm). */
export const PAPERS = Object.freeze({
  card25: Object.freeze({ word: 'the 25 m card', targetDC: 6, sizeCm: Object.freeze([30, 30]), ringCm: 2.5 }),
  // (0.0.7: the zero card and the KD faces, holes in real units: see the header)
  // (the zero card's rings 1 cm, not the 25 m card's 2.5 (my call, against the build sheet's 2.5): 0.4 mrad a ring width,
  // near the KD faces' 0.25 at 300 m; at 2.5 cm (1 mrad) a three-round group's centre wanders ±1.7 cm, seven clicks,
  // 21 cm at 300 m, and no coach could zero a rifle with it: the zero suite prints both)
  zero25: Object.freeze({ word: 'the 25 m zeroing card', targetDC: 6, sizeCm: Object.freeze([30, 30]), ringCm: 1.0, kind: 'zero', markCm: Object.freeze([0, -ZERO25_MARK_CM]), gridCm: 1 }),
  kdA: Object.freeze({ word: 'the A target', targetDC: -11, sizeCm: Object.freeze([100, 100]), ringCm: 7.5, kind: 'kd', biasRadiusCm: 30, blackCm: 15 }),
  kdB: Object.freeze({ word: 'the B target', targetDC: -13, sizeCm: Object.freeze([120, 120]), ringCm: 11.25, kind: 'kd', biasRadiusCm: 45, blackCm: 22.5 }),
  // (0.0.8: the turners' man-target (see the header); no targetDC: its DC is the part's; centres the zones' middles, cm)
  man: Object.freeze({ word: 'the man-target', kind: 'man', sizeCm: Object.freeze([46, 76]),
    zones: Object.freeze({ A: Object.freeze([16, 28]), torso: Object.freeze([46, 56]), head: Object.freeze({ r: 8, at: Object.freeze([0, -30]) }) }),
    centres: Object.freeze({ A: Object.freeze([0, 0]), torso: Object.freeze([0, 10]) }) }),
});
/** The papers whose holes are placed in real units (faceHole), not by the margin alone (holeOf); the man-target is neither. */
export const isFace = (paperId) => !!PAPERS[paperId]?.kind && PAPERS[paperId].kind !== 'man';
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
/** A miss's band on a face (ring widths from the point the round was going to): a natural 1, or a margin under the edge's. */
export const MISS_BAND = Object.freeze([4, 6]);
/** The rings by radius on a face, in ring widths: each ring's outer edge (best first), and their words. */
export const RING_EDGES = Object.freeze([
  Object.freeze({ to: 0.5, score: 5, v: true, band: 'v', word: 'a V, dead centre' }), Object.freeze({ to: 1, score: 5, band: '5', word: 'a 5' }),
  Object.freeze({ to: 2, score: 4, band: '4', word: 'a 4' }), Object.freeze({ to: 3, score: 3, band: '3', word: 'a 3' }), Object.freeze({ to: 4, score: 2, band: '2', word: 'a 2, on the edge' }),
]);
/** The plaque's quadrature: radii and angles per d20 face (the build sheet §2.1). */
export const ODDS_RADII = 8, ODDS_ANGLES = 32;

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

// ---- 0.0.7: faces in real units (see the header) ----

const r2 = (v) => Math.round(v * 100) / 100;
/** A point's offset as [x, y] cm on the paper (x right, y down) from [x, y] or { elevCm (+ up), windCm (+ right) }. */
export const poiXY = (p) => (!p ? [0, 0] : Array.isArray(p) ? p : [p.windCm ?? 0, -(p.elevCm ?? 0)]);

/** The ring a point on a face scores (radius from its centre in ring widths: see RING_EDGES): { score, v, band, word }. */
export function ringAt(paperId, [x, y]) {
  const P = PAPERS[paperId] ?? PAPERS.kdA, r = Math.hypot(x, y) / P.ringCm;
  const ring = RING_EDGES.find(q => r <= q.to);
  return ring ? { score: ring.score, v: !!ring.v, band: ring.band, word: ring.word } : { score: 0, v: false, band: null, word: 'outside the scoring rings' };
}
const onPaperAt = (P, [x, y]) => Math.abs(x) <= P.sizeCm[0] / 2 && Math.abs(y) <= P.sizeCm[1] / 2;
// (the spread's band in ring widths for a margin: KD_RINGS' band, or MISS_BAND)
const bandOf = (margin, nat) => { const ring = ringOf(margin, nat); return ring ? BANDS[ring.band] : MISS_BAND; };

/**
 * Where a round lands on a face (see the header): { at: [xCm, yCm] | null (off the paper), score, v, onPaper,
 * band, word, spreadCm }. aimCm the point of aim on the face (its centre: [0, 0]); poiCm the strike's offset from
 * it (poiOf's { elevCm, windCm } or [x, y]); roll the Marksmanship roll ({ margin, nat }); the spread's angle and
 * radius by hash of the world's seed and the shot's id, as holeOf's.
 */
export function faceHole(paperId, { aimCm = [0, 0], poiCm = null, roll = null, shotId = '', seed = 0 } = {}) {
  const P = PAPERS[paperId] ?? PAPERS.kdA, [lo, hi] = roll ? bandOf(roll.margin, roll.nat) : MISS_BAND;
  const t = hash01('hole', seed, shotId, 'angle') * Math.PI * 2, d = (lo + hash01('hole', seed, shotId, 'radius') * (hi - lo)) * P.ringCm;
  const [px, py] = poiXY(poiCm), x = aimCm[0] + px + Math.cos(t) * d, y = aimCm[1] + py + Math.sin(t) * d;
  const on = onPaperAt(P, [x, y]), ring = on ? ringAt(paperId, [x, y]) : { score: 0, v: false, band: null, word: MISS_WORD };
  return { at: on ? [r2(x), r2(y)] : null, score: ring.score, v: ring.v, onPaper: on, band: ring.band, word: on && !ring.score ? 'on the paper, outside the rings' : ring.word, spreadCm: r2(d) };
}

const ODDS = new Map();
const zeroRings = () => ({ v: 0, 5: 0, 4: 0, 3: 0, 2: 0, miss: 0 });
/**
 * The plaque's odds on a face (see the header): { score: P(a 2 or better), five: P(a 5 or better), rings: { v, 5, 4,
 * 3, 2, miss } } for a shooter of value against dc with mods, the strike believed at poiCm from the point of aim
 * (aimCm, the centre by default). Cached on (paper, value + Σmods − dc, the offset to 0.5 cm).
 */
export function faceOdds(paperId, { value = 10, dc = 20, mods = [], poiCm = null, aimCm = [0, 0] } = {}) {
  const P = PAPERS[paperId] ?? PAPERS.kdA, net = value + (typeof mods === 'number' ? mods : (mods ?? []).reduce((t, m) => t + (m?.v ?? 0), 0)) - dc;
  const [px0, py0] = poiXY(poiCm), px = Math.round((aimCm[0] + px0) * 2) / 2, py = Math.round((aimCm[1] + py0) * 2) / 2;
  const key = `${paperId}|${net}|${px}|${py}`, had = ODDS.get(key);
  if (had) return had;
  const rings = zeroRings();
  for (let f = 1; f <= 20; f++) {
    const [lo, hi] = bandOf(f + net, f === 20 ? 20 : f === 1 ? 1 : 0);
    for (let i = 0; i < ODDS_RADII; i++) {
      const d = (lo + (i + 0.5) / ODDS_RADII * (hi - lo)) * P.ringCm;
      for (let j = 0; j < ODDS_ANGLES; j++) {
        const t = (j + 0.5) / ODDS_ANGLES * Math.PI * 2, at = [px + Math.cos(t) * d, py + Math.sin(t) * d];
        const ring = onPaperAt(P, at) ? ringAt(paperId, at) : null;
        rings[ring?.score ? (ring.v ? 'v' : ring.score) : 'miss'] += 1;
      }
    }
  }
  const n = 20 * ODDS_RADII * ODDS_ANGLES;
  for (const k of Object.keys(rings)) rings[k] /= n;
  const out = Object.freeze({ score: 1 - rings.miss, five: rings.v + rings[5], rings: Object.freeze(rings) });
  if (ODDS.size > 20_000) ODDS.clear();
  ODDS.set(key, out);
  return out;
}

/** A group's holes ({ at } each; misses off the paper left out): { n, centreCm: [x, y] | null, spreadCm }. */
export function groupOf(holes = []) {
  const on = holes.filter(h => h?.at);
  if (!on.length) return { n: 0, centreCm: null, spreadCm: 0 };
  const cx = on.reduce((t, h) => t + h.at[0], 0) / on.length, cy = on.reduce((t, h) => t + h.at[1], 0) / on.length;
  let spread = 0;
  for (let i = 0; i < on.length; i++) for (let j = i + 1; j < on.length; j++) spread = Math.max(spread, Math.hypot(on[i].at[0] - on[j].at[0], on[i].at[1] - on[j].at[1]));
  return { n: on.length, centreCm: [r2(cx), r2(cy)], spreadCm: r2(spread) };
}

/**
 * The coach's pooled group (the zero suite's: four groups in nine of ten rifles where a group read alone takes more): every
 * hole since the first group ({ at, sight: { elev, wind } } each, the turrets it was fired at), moved by the clicks dialled
 * since, as one group at the turrets' present setting; groupOf()'s answer.
 */
export function poolOf(holes = [], sight = { elev: 0, wind: 0 }, rangeM = 25) {
  const k = cmPerClick(rangeM);
  return groupOf(holes.map(h => (h?.at ? { at: [h.at[0] + (sight.wind - (h.sight?.wind ?? 0)) * k, h.at[1] - (sight.elev - (h.sight?.elev ?? 0)) * k] } : h)));
}

const NUMS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen', 'twenty'];
const numWord = (n) => NUMS[n] ?? String(n);
const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);
/** Clicks in the coach's words: 'Ten up, four left.' ('Leave it.' at none). */
export function clickWords({ elev = 0, wind = 0 }) {
  const parts = [];
  if (elev) parts.push(`${numWord(Math.abs(elev))} ${elev > 0 ? 'up' : 'down'}`);
  if (wind) parts.push(`${numWord(Math.abs(wind))} ${wind > 0 ? 'right' : 'left'}`);
  return parts.length ? `${cap(parts.join(', '))}.` : 'Leave it.';
}
/** The centimetres a click moves the strike at a range (CLICK_MRAD × d / 10). */
export const cmPerClick = (rangeM) => CLICK_MRAD * rangeM / 10;
/**
 * The coach's call on a group (WEAPONS §11.4): the clicks that move its centre onto the target point (the zero card's
 * mark, a face's centre): { elev (+ up), wind (+ right), words }. y is down: a low group dials up.
 */
export function callOf(paperId, centreCm, rangeM, { targetCm = PAPERS[paperId]?.markCm ?? [0, 0] } = {}) {
  if (!centreCm) return { elev: 0, wind: 0, words: 'Nothing on the paper to call.' };
  const k = cmPerClick(rangeM), dx = centreCm[0] - targetCm[0], dy = centreCm[1] - targetCm[1];
  const elev = Math.round(dy / k) || 0, wind = Math.round(-dx / k) || 0;
  return { elev, wind, words: clickWords({ elev, wind }) };
}

// ---- 0.0.8: the man-target (see the header) ----

/** The margin a torso round needs for the A zone, and a head round for a steel head plate to fall (SKILLS §5.6's "good"). */
export const A_MARGIN = 4;
/** A man-target's zones' words. */
export const MAN_WORDS = Object.freeze({ A: 'in the A zone', C: 'in the C zone', head: 'in the head', miss: 'past him, into the berm' });
// (whether a point lies in a box of [w, h] centred at c)
const inBox = ([x, y], [w, h], [cx, cy]) => Math.abs(x - cx) <= w / 2 && Math.abs(y - cy) <= h / 2;
/** The zone a torso or head round earns by its roll: 'A', 'C', 'head' or null (past him). */
export function manZone(part, roll) {
  if (!roll?.ok) return null;
  if (part === 'head') return 'head';
  return roll.margin >= A_MARGIN && roll.nat !== 1 ? 'A' : 'C';
}
/**
 * Where a round lands on the man-target (see the header): { at: [xCm, yCm] | null, zone: 'A' | 'C' | 'head' | null, word }.
 * face: the turner's face ('threat', 'noshoot', 'armoured'): the same silhouette, the words alike.
 */
export function manHole(face, part, roll, shotId, seed = 0) {
  const P = PAPERS.man, Z = P.zones, zone = manZone(part, roll), h = (k, i = 0) => hash01('hole', seed, shotId, k, i);
  if (!zone) return { at: null, zone: null, word: MAN_WORDS.miss };
  let at;
  if (zone === 'head') {
    const t = h('angle') * Math.PI * 2, d = Math.sqrt(h('radius')) * Z.head.r;
    at = [Z.head.at[0] + Math.cos(t) * d, Z.head.at[1] + Math.sin(t) * d];
  } else if (zone === 'A') {
    at = [P.centres.A[0] + (h('x') - 0.5) * Z.A[0], P.centres.A[1] + (h('y') - 0.5) * Z.A[1]];
  } else {
    // (the C zone: the torso outside A, by tries of the hash; never in A, a last try pushed out to the side)
    for (let i = 0; i < 8 && !at; i++) {
      const p = [P.centres.torso[0] + (h('x', i) - 0.5) * Z.torso[0], P.centres.torso[1] + (h('y', i) - 0.5) * Z.torso[1]];
      if (!inBox(p, Z.A, P.centres.A)) at = p;
    }
    if (!at) { const s = h('side') < 0.5 ? -1 : 1; at = [P.centres.A[0] + s * (Z.A[0] / 2 + h('x', 9) * (Z.torso[0] - Z.A[0]) / 2), P.centres.torso[1] + (h('y', 9) - 0.5) * Z.torso[1]]; }
  }
  return { at: [r1(at[0]), r1(at[1])], zone, word: MAN_WORDS[zone] };
}
