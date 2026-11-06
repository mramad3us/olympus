// OLYMPUS sim: the NPC skill tiers and the sheets drawn from them, for everyone who has no sheet written (SKILLS §10, §11; the build sheet 0.0.5 §2.2, §8 item 11).
//
// SKILLS §11.1's reference tiers give each skill's VALUE range at the tier's Warfighting range; a
// sheet stores bases, so each tier here holds its Warfighting range and, per skill, the base range
// that value range comes from: [round(lo / (1 + wf × WFhi/100)), round(hi / (1 + wf × WFlo/100))]
// (BASES_OF, applied to the table as SKILLS writes it). The private's marksmanship comes out [8, 10],
// weapon handling [8, 10], awareness [5, 6] (the build sheet's numbers), fitness [11, 13] (the table's,
// weight 0: the sheet's [10, 12] is one off, the table wins). Comms, tech, demolitions and driving are
// not in the table: 1 to 4 at every soldier tier (my call).
//
// rollSheet(seed, pid, tier) draws a persistent person's sheet on stream('people', seed, pid, 'skills')
// (SKILLS §11.2: the person's own dice, so nothing else's move): Warfighting first, then each skill's
// base in SKILL_KEYS order by intIn(lo, hi), then two or three skills drawn from the same stream get one
// or two background points (◆: the corporal who boxes, the private who was a mechanic). sheetOf(state,
// pid) is the sheet a roll reads: person.skills where it is written (the scene's player, SKILLS §15.1),
// else rollSheet by the rank's tier (RANK_TIER), drawn each time and written nowhere ("a lazy sheet,
// nothing written": a save never grows by a read). valueOf(state, pid, k) is skills.js value() on it.
// Pure.
import { stream, int, intIn } from '../../core/rng.js';
import { SKILLS, SKILL_KEYS, BASE_MAX, value } from './skills.js';

// (SKILLS §11.1's values, [lo, hi] by skill, at the tier's Warfighting range; the four the table leaves out added)
const T = (wf, v) => ({ wf, v: { comms: [1, 4], tech: [1, 4], demolitions: [1, 4], driving: [1, 4], ...v } });
const VALUES = {
  private: T([13, 17], { marksmanship: [9, 11], weapons: [9, 11], cqc: [7, 8], fieldcraft: [9, 11], awareness: [6, 7], tactics: [3, 3], leadership: [0, 0], social: [2, 4], medicine: [4, 4], eva: [6, 7], zerog: [4, 4], fitness: [11, 13] }),
  lcpl: T([22, 32], { marksmanship: [11, 15], weapons: [11, 15], cqc: [8, 11], fieldcraft: [11, 15], awareness: [7, 11], tactics: [4, 6], leadership: [1, 4], social: [2, 4], medicine: [4, 7], eva: [7, 9], zerog: [4, 8], fitness: [12, 14] }),
  cpl: T([28, 40], { marksmanship: [13, 17], weapons: [13, 17], cqc: [10, 13], fieldcraft: [13, 17], awareness: [9, 13], tactics: [6, 9], leadership: [6, 10], social: [2, 4], medicine: [6, 8], eva: [8, 11], zerog: [6, 10], fitness: [12, 15] }),
  sgt: T([38, 50], { marksmanship: [15, 21], weapons: [17, 21], cqc: [12, 17], fieldcraft: [15, 21], awareness: [12, 17], tactics: [10, 15], leadership: [11, 16], social: [3, 7], medicine: [7, 10], eva: [10, 13], zerog: [7, 11], fitness: [13, 16] }),
  ssgt: T([45, 60], { marksmanship: [17, 24], weapons: [19, 24], cqc: [14, 19], fieldcraft: [17, 22], awareness: [15, 19], tactics: [14, 19], leadership: [15, 20], social: [4, 8], medicine: [7, 11], eva: [10, 14], zerog: [9, 13], fitness: [12, 15] }),
  lt: T([15, 25], { marksmanship: [9, 11], weapons: [9, 11], cqc: [7, 10], fieldcraft: [8, 11], awareness: [7, 10], tactics: [9, 12], leadership: [9, 12], social: [4, 7], medicine: [4, 6], eva: [6, 8], zerog: [4, 7], fitness: [12, 15] }),
};
VALUES.gysgt = VALUES.ssgt;                                       // (SKILLS §11.1's one row: Staff or Gunnery Sergeant)

/** A value range at a Warfighting range as the base range it comes from (see the header). */
export function basesOf([vlo, vhi], wf, [wlo, whi]) {
  const lo = Math.max(0, Math.min(BASE_MAX, Math.round(vlo / (1 + wf * whi / 100))));
  const hi = Math.max(lo, Math.min(BASE_MAX, Math.round(vhi / (1 + wf * wlo / 100))));
  return [lo, hi];
}

const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };
/** The tiers (SKILLS §11.1): { wf: [lo, hi], base: { <skill>: [lo, hi] } } for private, lcpl, cpl, sgt, ssgt, gysgt and lt. */
export const TIERS = deepFreeze(Object.fromEntries(Object.entries(VALUES).map(([id, t]) => [id, {
  wf: t.wf, base: Object.fromEntries(SKILL_KEYS.map(k => [k, basesOf(t.v[k] ?? [0, 0], SKILLS[k].wf, t.wf)])),
}])));

/** Each rank's tier (a rank not listed reads as a private's: the Navy's corpsmen, by their own table later). */
export const RANK_TIER = Object.freeze({ Pvt: 'private', PFC: 'private', LCpl: 'lcpl', Cpl: 'cpl', Sgt: 'sgt', SSgt: 'ssgt', GySgt: 'gysgt',
  '1stSgt': 'gysgt', MSgt: 'gysgt', SgtMaj: 'gysgt', MGySgt: 'gysgt', '2ndLt': 'lt', '1stLt': 'lt', Capt: 'lt' });
export const tierOfRank = (rank) => RANK_TIER[rank] ?? 'private';

/** Background points: this many skills get them (lo, hi), each 1 or 2 (SKILLS §11.2). */
export const BG_SKILLS = Object.freeze([2, 3]), BG_POINTS = Object.freeze([1, 2]);

/** A sheet drawn for a person at a tier (see the header): { cls: 'soldier', os, skills: { k: [base, bg] } }. */
export function rollSheet(seed, pid, tier = 'private') {
  const t = TIERS[tier] ?? TIERS.private, r = stream('people', seed, pid, 'skills');
  const os = intIn(r, t.wf[0], t.wf[1]);
  const skills = {};
  for (const k of SKILL_KEYS) skills[k] = [intIn(r, t.base[k][0], t.base[k][1]), 0];
  const n = intIn(r, BG_SKILLS[0], BG_SKILLS[1]), left = [...SKILL_KEYS];
  for (let i = 0; i < n; i++) {
    const k = left.splice(int(r, left.length), 1)[0];
    skills[k][1] = intIn(r, BG_POINTS[0], BG_POINTS[1]);
  }
  return { cls: 'soldier', os, skills };
}

// (lazy sheets kept by their recipe: the same seed, person and tier always draw the same sheet, so keeping one moves nothing)
const LAZY_MAX = 512;
const lazy = new Map();
function lazySheet(seed, pid, tier) {
  const key = `${seed}|${pid}|${tier}`;
  let s = lazy.get(key);
  if (!s) {
    if (lazy.size >= LAZY_MAX) lazy.clear();
    lazy.set(key, (s = deepFreeze(rollSheet(seed, pid, tier))));
  }
  return s;
}

/** The sheet a roll reads for a person (see the header): their own, else a lazy one by their rank's tier. */
export function sheetOf(state, pid) {
  const p = state?.people?.[pid];
  if (!p) return null;
  if (p.skills) return p.skills;
  return lazySheet(state.meta.seed, pid, tierOfRank(p.service?.rank));
}

/** A person's value in a skill (skills.js value() on sheetOf). */
export const valueOf = (state, pid, k) => { const s = sheetOf(state, pid); return s ? value(s, k) : 0; };
