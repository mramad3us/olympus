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
//
// 0.0.8 (the build sheet 0.0.8 §2.1, §4, §8 item 23; COMBAT §25.3.2, §25.10.3): the tiers gain SKILLS §11.1's boot
// recruit (week 6), recon, Raider and tier-one rows (recruit, recon, raider, tierone: rollSheet on them for NPCs
// later; the existing tiers' draws do not move, each tier drawing on its own record). TEST_SHEETS are the test
// scenes' fixed sheets (test-pairs' picker: boot recruit, private, sergeant, Raider, tier one; the corporal by URL
// only), each a Warfighting and the values COMBAT §25.4.3 and §25.6.2 name for Marksmanship, Weapon handling,
// Awareness and Fitness, the nearest a sheet can hold (a base and its background points times Warfighting's
// weight, the higher on a tie), the other skills at their tier's middle; testSheet(tier) solves the bases so
// value() gives those numbers exactly (a background point only past BASE_MAX: the tier one's 42 is 20 + 2 under
// Warfighting 93), with the drill families' rungs written on it (person.skills.drills: room and passage).
// RUNG_OF_TIER is COMBAT §25.3.2's rung of each tier, written nowhere for NPCs; rungOf(state, pid, family) reads
// the sheet's rung where one is written (a test sheet), else the rank's tier's. Scenes never write a career:
// testSheet is written on the scene's player only (the scene's fill).
// Pure.
import { stream, int, intIn } from '../../core/rng.js';
import { SKILLS, SKILL_KEYS, BASE_MAX, BG_MAX, OWN_MAX, value } from './skills.js';

// (SKILLS §11.1's values, [lo, hi] by skill, at the tier's Warfighting range; the four the table leaves out added)
const T = (wf, v) => ({ wf, v: { comms: [1, 4], tech: [1, 4], demolitions: [1, 4], driving: [1, 4], ...v } });
const VALUES = {
  private: T([13, 17], { marksmanship: [9, 11], weapons: [9, 11], cqc: [7, 8], fieldcraft: [9, 11], awareness: [6, 7], tactics: [3, 3], leadership: [0, 0], social: [2, 4], medicine: [4, 4], eva: [6, 7], zerog: [4, 4], fitness: [11, 13] }),
  lcpl: T([22, 32], { marksmanship: [11, 15], weapons: [11, 15], cqc: [8, 11], fieldcraft: [11, 15], awareness: [7, 11], tactics: [4, 6], leadership: [1, 4], social: [2, 4], medicine: [4, 7], eva: [7, 9], zerog: [4, 8], fitness: [12, 14] }),
  cpl: T([28, 40], { marksmanship: [13, 17], weapons: [13, 17], cqc: [10, 13], fieldcraft: [13, 17], awareness: [9, 13], tactics: [6, 9], leadership: [6, 10], social: [2, 4], medicine: [6, 8], eva: [8, 11], zerog: [6, 10], fitness: [12, 15] }),
  sgt: T([38, 50], { marksmanship: [15, 21], weapons: [17, 21], cqc: [12, 17], fieldcraft: [15, 21], awareness: [12, 17], tactics: [10, 15], leadership: [11, 16], social: [3, 7], medicine: [7, 10], eva: [10, 13], zerog: [7, 11], fitness: [13, 16] }),
  ssgt: T([45, 60], { marksmanship: [17, 24], weapons: [19, 24], cqc: [14, 19], fieldcraft: [17, 22], awareness: [15, 19], tactics: [14, 19], leadership: [15, 20], social: [4, 8], medicine: [7, 11], eva: [10, 14], zerog: [9, 13], fitness: [12, 15] }),
  lt: T([15, 25], { marksmanship: [9, 11], weapons: [9, 11], cqc: [7, 10], fieldcraft: [8, 11], awareness: [7, 10], tactics: [9, 12], leadership: [9, 12], social: [4, 7], medicine: [4, 6], eva: [6, 8], zerog: [4, 7], fitness: [12, 15] }),
  // (0.0.8: SKILLS §11.1's boot recruit (week 6), recon, Raider and tier-one rows)
  recruit: T([4, 8], { marksmanship: [3, 5], weapons: [3, 5], cqc: [2, 4], fieldcraft: [2, 3], awareness: [1, 3], tactics: [0, 0], leadership: [0, 0], social: [0, 0], medicine: [1, 2], eva: [2, 4], zerog: [0, 2], fitness: [7, 10] }),
  recon: T([48, 65], { marksmanship: [21, 26], weapons: [21, 26], cqc: [18, 23], fieldcraft: [24, 30], awareness: [21, 26], tactics: [14, 20], leadership: [9, 15], social: [4, 8], medicine: [11, 14], eva: [15, 20], zerog: [14, 19], fitness: [16, 19] }),
  raider: T([66, 85], { marksmanship: [28, 35], weapons: [28, 35], cqc: [24, 30], fieldcraft: [28, 35], awareness: [27, 33], tactics: [20, 27], leadership: [14, 21], social: [7, 12], medicine: [14, 17], eva: [20, 24], zerog: [19, 24], fitness: [18, 21] }),
  tierone: T([86, 100], { marksmanship: [37, 46], weapons: [37, 46], cqc: [32, 40], fieldcraft: [37, 46], awareness: [35, 44], tactics: [27, 34], leadership: [18, 26], social: [9, 14], medicine: [16, 20], eva: [24, 30], zerog: [24, 30], fitness: [20, 23] }),
};
VALUES.gysgt = VALUES.ssgt;                                       // (SKILLS §11.1's one row: Staff or Gunnery Sergeant)

/** A value range at a Warfighting range as the base range it comes from (see the header). */
export function basesOf([vlo, vhi], wf, [wlo, whi]) {
  const lo = Math.max(0, Math.min(BASE_MAX, Math.round(vlo / (1 + wf * whi / 100))));
  const hi = Math.max(lo, Math.min(BASE_MAX, Math.round(vhi / (1 + wf * wlo / 100))));
  return [lo, hi];
}

const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };
/** The tiers (SKILLS §11.1): { wf: [lo, hi], base: { <skill>: [lo, hi] } } for private, lcpl, cpl, sgt, ssgt, gysgt, lt and (0.0.8) recruit, recon, raider, tierone. */
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

// ---- 0.0.8: the test sheets and the drill families' rungs (see the header) ----

/** COMBAT §25.3.2's rung of each tier in a drill family (0 untrained to 4 fluent), the same in every family for NPCs. */
export const RUNG_OF_TIER = Object.freeze({ recruit: 0, private: 1, lcpl: 2, cpl: 2, sgt: 3, ssgt: 3, gysgt: 3, lt: 1, recon: 3, raider: 4, tierone: 4 });
/** The drill families (COMBAT §25.3.1); a test sheet writes room and passage. */
export const DRILL_FAMILIES = Object.freeze(['room', 'passage', 'hatch', 'void']);

// (a test sheet's row: its tier (the other skills at the tier's middle), its label, Warfighting, the named values, its rung, on the picker or by URL only)
const TS = (tier, label, wf, named, rung, picker) => ({ tier, label, wf, named, rung, picker });
const SHEET_ROWS = [
  TS('recruit', 'Boot recruit', 6, { marksmanship: 4, weapons: 4, awareness: 2, fitness: 8 }, 0, true),
  TS('private', 'Private', 15, { marksmanship: 10, weapons: 10, awareness: 6, fitness: 12 }, 1, true),
  TS('cpl', 'Corporal', 34, { marksmanship: 15, weapons: 15, awareness: 11, fitness: 13 }, 2, false),
  TS('sgt', 'Sergeant', 44, { marksmanship: 19, weapons: 19, awareness: 14, fitness: 14 }, 3, true),
  TS('raider', 'Raider, five years', 70, { marksmanship: 31, weapons: 31, awareness: 31, fitness: 19 }, 4, true),
  TS('tierone', 'Tier one', 93, { marksmanship: 42, weapons: 42, awareness: 41, fitness: 21 }, 4, true),
];

/**
 * The own points (base + background, at most OWN_MAX) whose value at a Warfighting is nearest a wanted value, the
 * higher on a tie (the build sheet's §8 item 23), as [base, bg]: the base first to BASE_MAX, then background points.
 */
export function solveOwn(k, want, wf) {
  const sheet = { cls: 'soldier', os: wf, skills: {} };
  let best = null;
  for (let o = 0; o <= Math.min(OWN_MAX, BASE_MAX + BG_MAX); o++) {
    sheet.skills[k] = [Math.min(BASE_MAX, o), Math.max(0, o - BASE_MAX)];
    const v = value(sheet, k), d = Math.abs(v - want);
    if (!best || d < best.d || (d === best.d && v > best.v)) best = { o, v, d };
  }
  return [Math.min(BASE_MAX, best.o), Math.max(0, best.o - BASE_MAX)];
}
// (a tier's middle value of a skill, the table's (lo + hi) / 2 rounded)
const middleOf = (tier, k) => { const r = VALUES[tier]?.v[k] ?? [0, 0]; return Math.round((r[0] + r[1]) / 2); };

/** The test sheets (see the header): { [tier]: { label, wf, values: { <skill>: value }, rung, picker } }, values as value() reads them. */
export const TEST_SHEETS = deepFreeze(Object.fromEntries(SHEET_ROWS.map(r => {
  const sheet = { cls: 'soldier', os: r.wf, skills: {} };
  for (const k of SKILL_KEYS) sheet.skills[k] = solveOwn(k, r.named[k] ?? middleOf(r.tier, k), r.wf);
  const values = Object.fromEntries(SKILL_KEYS.map(k => [k, value(sheet, k)]));
  return [r.tier, { label: r.label, wf: r.wf, values, rung: r.rung, picker: r.picker, skills: sheet.skills }];
})));
/** The tiers on the test scenes' picker, in its order (the corporal by URL only). */
export const PICKER_TIERS = Object.freeze(SHEET_ROWS.filter(r => r.picker).map(r => r.tier));

/** A test sheet to write on a scene's player (see the header): { cls, os, skills: { k: [base, bg] }, drills: { room: { rung }, passage: { rung } } }; an unknown tier is the private's. */
export function testSheet(tier = 'private') {
  const t = TEST_SHEETS[tier] ?? TEST_SHEETS.private;
  return { cls: 'soldier', os: t.wf, skills: Object.fromEntries(SKILL_KEYS.map(k => [k, [...t.skills[k]]])), drills: { room: { rung: t.rung }, passage: { rung: t.rung } } };
}

/** A person's rung in a drill family (see the header): the sheet's where written, else the rank's tier's (0 to 4). */
export function rungOf(state, pid, family = 'room') {
  const p = state?.people?.[pid];
  const r = p?.skills?.drills?.[family]?.rung;
  if (Number.isInteger(r)) return r;
  return RUNG_OF_TIER[tierOfRank(p?.service?.rank)] ?? 1;
}
