// OLYMPUS sim: the check, the one roll of the game, and the record every log line and plaque reads (SKILLS §5; the build sheet 0.0.5 §2.2).
//
// A check is a d20 plus a skill's value plus named modifiers, against a difficulty (DC): a natural 20
// always succeeds, a natural 1 always fails, else it succeeds when the total reaches the DC (halved,
// rounded up, by a hook spent: SKILLS §5.7). An opposed roll is both sides' d20s, the higher total
// winning, ties to the first side (the caller puts the player first), naturals deciding nothing
// ("if naturals won outright, every contest would fail at least one time in ten whatever the
// skills": tradecraft). The dice are tradecraft's draw bit for bit (d20 = 1 + int(r, 20) on the
// caller's stream), so the same stream gives the same rolls there and here.
//
// Modifiers are { why, v, src }, v a whole number never 0, listed in SRC_ORDER (task, env, gear, body,
// need, people, help, tempo, retry; a src 'body:thermal' sorts as body), the same list on the plaque
// and in the roll (SKILLS §5.3: tradecraft's quirk 1, the plaque that left the body out, fixed). The
// way of working is a modifier of its own (TEMPO, SKILLS §5.9): rushed ×0.6 time −3, careful ×1.5 +2,
// taken steady ×2 +3 (pressure none only, the d20 still rolled and its naturals counting), appended
// after the owner's.
//
// Routine work (SKILLS §5.1): a check is routine for the roller when it is procedure (handling, bench
// and armoury work, the habit of carry: work whose failure the owner prices in time), at pressure
// none or evaluated, not rushed, and the value plus every modifier but the tempo's reaches the DC +
// ROUTINE_AT (0): they would make it without the die. A routine natural 1 is still a miss (grade
// 'miss'), and the owner charges its time and nothing else. A shot, a noticing roll and an opposed
// roll are never procedure. At danger and fire nothing is routine.
//
// The record is SKILLS §15.2's, plain data stored in the log as it is: { kind: 'check', skill, value,
// roll, mods, total, nat, dc, dcParts, hook, tempo, steady, routine, pressure, ok, margin, grade, by,
// them, hidden, verb } (dc0 the DC before a hook halved it). grade(margin, nat) is SKILLS §5.6's one
// vocabulary: disaster ≤ −10, bad −9 to −6, miss −5 to −1 (or a natural 1 that would have been better),
// pass 0 to 3 (a natural 20 that would have failed), good 4 to 9, superb ≥ 10. oddsOf(value, dc, mods)
// is the one odds helper: clamp((21 − (dc − value − Σmods)) / 20, 0.05, 0.95).
// checkText(r) is the log's line, checkShort(r) the top-left's: "Weapon handling check: 5 + 10 − 1
// (dusk) = 14 against 12, success." (tradecraft's own words, kept); a routine roll ends ": routine,
// done." or ", a natural 1: routine, it only cost time."; a roll taken steady reads "Weapon handling,
// taken steady: …"; dcParts, the DC's own terms, follow the DC in brackets ("against 19 (the 25 m card
// 6, 25 m 7, base 6)"); an owner's verb replaces the ending ("a 4", "off the paper": never "made",
// tradecraft's rule). Ported from tradecraft v0.2.0-rc3 src/sim/checks.js (79 lines): check, opposed,
// won, checkText, checkShort, DC kept; body and need modifiers come in the caller's list
// (src/sim/combat/roll.js: skills never import body, TECH correction 8).
// Pure.
import { d20 } from '../../core/rng.js';
import { skillName } from './skills.js';

/** SKILLS §5.2's ladder, tradecraft's table unchanged. */
export const DC = Object.freeze({ easy: 10, average: 15, hard: 20, veryHard: 25, expert: 30, elite: 40 });
/** A check is routine when value + Σmods (tempo left out) reaches the DC plus this (SKILLS §5.1). */
export const ROUTINE_AT = 0;
/** The order modifiers are listed in (SKILLS §5.3). */
export const SRC_ORDER = Object.freeze(['task', 'env', 'gear', 'body', 'need', 'people', 'help', 'tempo', 'retry']);
/** The ways of working (SKILLS §5.9): the time's factor and the roll's modifier. */
export const TEMPO = Object.freeze({
  rushed: Object.freeze({ timeK: 0.6, v: -3, why: 'rushed' }), normal: Object.freeze({ timeK: 1, v: 0, why: null }),
  careful: Object.freeze({ timeK: 1.5, v: 2, why: 'careful' }), steady: Object.freeze({ timeK: 2, v: 3, why: 'steady' }),
});
/** The pressures a roll is made under (SKILLS §5.9), calmest first. */
export const PRESSURES = Object.freeze(['none', 'evaluated', 'danger', 'fire']);

const srcRank = (m) => { const i = SRC_ORDER.indexOf(String(m?.src ?? 'task').split(':')[0]); return i < 0 ? 0 : i; };
/** A modifier list as a roll keeps it: the zeros dropped, in SRC_ORDER (stable within a source). */
export function sortMods(mods = []) {
  return mods.filter(m => m && m.v).map((m, i) => ({ m, i })).sort((a, b) => srcRank(a.m) - srcRank(b.m) || a.i - b.i).map(o => o.m);
}
const sumOf = (mods) => (typeof mods === 'number' ? mods : (mods ?? []).reduce((a, m) => a + (m?.v ?? 0), 0));
const halve = (x) => Math.ceil(x / 2);

/** SKILLS §5.6's grade of a margin (see the header). */
export function grade(margin, nat = 0) {
  if (nat === 20 && margin < 0) return 'pass';
  if (nat === 1) return margin >= -5 ? 'miss' : margin <= -10 ? 'disaster' : 'bad';
  return margin <= -10 ? 'disaster' : margin <= -6 ? 'bad' : margin < 0 ? 'miss' : margin <= 3 ? 'pass' : margin <= 9 ? 'good' : 'superb';
}
/** Whether a grade is a success (pass, good, superb). */
export const passed = (g) => g === 'pass' || g === 'good' || g === 'superb';

/** The odds of a check (see the header); mods a list or a sum. */
export const oddsOf = (value, dc, mods = []) => Math.max(0.05, Math.min(0.95, (21 - (dc - value - sumOf(mods))) / 20));

/** Whether a check would be routine for its roller (see the header), before the die. */
export function isRoutine({ value, dc, mods = [], tempo = 'normal', pressure = 'none', procedure = false }) {
  if (!procedure || tempo === 'rushed' || (pressure !== 'none' && pressure !== 'evaluated')) return false;
  return value + sumOf((mods ?? []).filter(m => String(m?.src ?? '').split(':')[0] !== 'tempo')) >= dc + ROUTINE_AT;
}

/** One check (see the header). Returns SKILLS §15.2's record. */
export function check(rng, { skill, value, dc, mods = [], tempo = 'normal', pressure = 'none', procedure = false, hook = false, by = null, dcParts = null, verb = null, them = false, hidden = false }) {
  const T = TEMPO[tempo] ?? TEMPO.normal;
  const list = sortMods(mods);
  if (T.v) list.push({ why: T.why, v: T.v, src: 'tempo' });
  const roll = d20(rng);
  const total = roll + value + sumOf(list);
  const nat = roll === 20 ? 20 : roll === 1 ? 1 : 0;
  const against = hook ? halve(dc) : dc;
  const ok = nat === 20 ? true : nat === 1 ? false : total >= against;
  const routine = isRoutine({ value, dc: against, mods: list, tempo, pressure, procedure });
  const margin = total - against;
  const r = { kind: 'check', skill, value, roll, mods: list, total, nat, dc: against, dcParts: dcParts ?? null, hook: !!hook, tempo, steady: tempo === 'steady', routine,
    pressure, ok, margin, grade: grade(margin, nat), by, them: !!them, hidden: !!hidden, verb: verb ?? null };
  if (hook) r.dc0 = dc;
  return r;
}

// (one side of an opposed roll)
function side(rng, { skill, value, mods = [], by = null }) {
  const list = sortMods(mods), roll = d20(rng);
  return { skill, value, roll, mods: list, total: roll + value + sumOf(list), nat: roll === 20 ? 20 : roll === 1 ? 1 : 0, by };
}

/**
 * An opposed roll (see the header): ok when the first side wins, ties its. them: the first side is
 * someone else's, rolled against the player, so won() reads it the right way round.
 */
export function opposed(rng, ours, theirs, { hook = false, them = false, hidden = false } = {}) {
  const a = side(rng, ours), b = side(rng, theirs);
  if (hook) { b.raw = b.total; b.total = halve(b.total); }
  const ok = a.total >= b.total, margin = a.total - b.total;
  return { kind: 'opposed', ours: a, theirs: b, hook: !!hook, ok, margin, grade: grade(margin, 0), them: !!them, hidden: !!hidden };
}
/** Whether a roll went the player's way: a check made, an opposed roll won by their side. */
export const won = (r) => (r.kind === 'opposed' && r.them ? !r.ok : r.ok);

// ---- the words ----

const sumText = (s) => [s.roll, s.value, ...s.mods.map(m => `${m.v < 0 ? '− ' + -m.v : m.v} (${m.why})`)].join(' + ').replace(/\+ − /g, '− ')
  + (s.raw !== undefined ? ` = ${s.raw}, halved by leverage to ${s.total}` : ` = ${s.total}`);
const natural = (n) => (n === 20 ? ', a natural 20' : n === 1 ? ', a natural 1' : '');
const natShort = (n) => (n === 20 ? ' (a natural 20)' : n === 1 ? ' (a natural 1)' : '');
/** A DC's parts in words: 'the 25 m card 6, 25 m 7, base 6'. */
export const partsText = (parts) => (parts ?? []).map(p => `${p.why} ${p.v}`).join(', ');

/** The log's line for a roll (see the header). */
export function checkText(r) {
  if (r.kind === 'check') {
    const head = `${skillName(r.skill)}${r.steady ? ', taken steady' : ' check'}: ${sumText(r)} against ${r.hook && r.dc0 !== undefined ? `${r.dc0}, halved by leverage to ${r.dc}` : r.dc}${r.dcParts?.length ? ` (${partsText(r.dcParts)})` : ''}`;
    if (r.verb) return `${head}${natural(r.nat)}, ${r.verb}.`;
    if (r.steady && r.ok) return `${head}${natural(r.nat)}, done.`;
    if (r.routine) return r.ok ? `${head}${natural(r.nat)}: routine, done.` : `${head}${natural(r.nat)}: routine, it only cost time.`;
    if (r.steady) return `${head}${natural(r.nat)}, failure.`;
    return `${head}${natural(r.nat)}, ${r.ok ? 'success' : 'failure'}.`;
  }
  return `${skillName(r.ours.skill)} against ${skillName(r.theirs.skill)}: ${sumText(r.ours)}${natural(r.ours.nat)}, against ${sumText(r.theirs)}${natural(r.theirs.nat)}. ${won(r) ? 'You win' : 'They win'}.`;
}

/** A roll in brief, for the line at the top left: 'Weapon handling 22 against 9 · passed', 'Marksmanship 27 against 19 · a 5'. */
export function checkShort(r) {
  if (r.kind === 'check') {
    const end = r.verb ?? (r.routine ? (r.ok ? 'routine' : 'routine, slow') : r.ok ? 'passed' : 'failed');
    return `${skillName(r.skill)} ${r.total} against ${r.dc}${natShort(r.nat)} · ${end}`;
  }
  return `${skillName(r.ours.skill)} ${r.ours.total}${natShort(r.ours.nat)} against ${skillName(r.theirs.skill)} ${r.theirs.total}${natShort(r.theirs.nat)} · ${won(r) ? 'you win' : 'they win'}`;
}
