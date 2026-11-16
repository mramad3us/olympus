// OLYMPUS tests: v0.0.17's handling offers, frozen, on the planner's abstraction (the build sheet 0.0.18 §5.1 tests 1 and 3).
//
// A copy of v0.0.17's drills.js macrosFor predicates (the reloads, MAKE READY, LOAD, IMMEDIATE and REMEDIAL ACTION), its canDo
// singles that lift a struck shot (the bolt release, the charge, the press check, Off safe) and its Fix (groups.js fixOf over
// panel.js REMEDY, then IMMEDIATE ACTION, Off safe, the reload slot), read off a plan.js Abs, with drills.js subsOf for the
// sub-steps as v0.0.17 ran them (subsOf is unchanged for the R-7). The plan-walk suite runs it beside the planner: where v0.0.17
// offered a reload its path is the planner's but for the named improvements, and its Fix had no way on the in-0 state.
import { subsOf } from '../src/sim/arms/drills.js';

const rounds = (x) => x === '+' || x === '?';
/** The belief subsOf and the predicates read, from an Abs (the count '+' as five, '?' unknown). */
export const beliefOfAbs = (a) => ({ model: a.model, mag: a.mag, count: a.mag === 'in' ? (a.n === '0' ? 0 : a.n === '+' ? 5 : null) : null, chamber: a.ch, locked: a.lk, stoppage: a.st, mode: a.mode, cocked: a.ck, hand: a.hand ? {} : null });

/** v0.0.17's macrosFor ids for an Abs (no observer, no course that tops up from the spout, no house Stop). */
export function legacyMacros(a) {
  const b = beliefOfAbs(a), withRounds = [a.hand, ...a.pool].some(rounds), ids = [];
  if (b.stoppage === 'double') ids.push('remedial');
  else if (b.stoppage) ids.push('ia');
  if (b.mag === 'out' && withRounds && b.chamber !== 'live') ids.push('load');
  else if (b.mag === 'out' && withRounds && b.chamber === 'live' && !b.stoppage) ids.push('reload:tactical');
  if (b.mag === 'out' && withRounds && b.chamber !== 'live' && !b.stoppage) ids.push('reload:speed');
  if (b.mag === 'in' && b.chamber === 'empty' && !b.locked && b.count !== 0 && !b.stoppage) ids.push('ready');
  if (b.mag === 'in' && b.locked && b.count === 0 && withRounds) ids.push('reload:speed', 'reload:retain');
  else if (b.mag === 'in' && b.count !== 0 && withRounds && !b.stoppage) ids.push('reload:tactical');
  return ids;
}
/** v0.0.17's sub-steps for a macro on an Abs. */
export const legacySubs = (id, a) => subsOf(id, beliefOfAbs(a));
/** v0.0.17's canDo singles that lift a struck shot, on an Abs (a hand at the gun: not slung). */
export function legacySingles(a) {
  const b = beliefOfAbs(a), out = [], round = ['live', 'dud', 'case'].includes(b.chamber), hammerDown = !b.cocked && a.model === 'r7';
  if (b.stoppage) return out;
  if (b.chamber === '?' && !b.locked) out.push('pressCheck');
  if (b.locked && b.mag === 'in' && b.count !== 0) out.push('release');
  if (hammerDown || ((b.chamber === 'empty' || b.chamber === '?') && b.mag === 'in' && b.count !== 0) || (round && b.mag !== 'in')) out.push('charge');
  if (b.mode === 'safe') out.push('selector:semi');
  return out;
}
// (v0.0.17's REMEDY: a struck shot's reason, its singles in order)
const REMEDY = Object.freeze({ 'on safe': ['selector:semi'], 'a stoppage': ['macro:ia'], 'chamber empty': ['macro:ready', 'macro:reload:speed', 'release', 'charge'] });
/** v0.0.17's Fix on an Abs in the hands: a row id, or null where it said "nothing offered now" (or "Nothing to fix": the gun can fire). */
export function legacyFix(a) {
  if (a.carry === 'slung' || a.carry === 'holster') return 'up';
  const offered = new Set([...legacyMacros(a).map(id => `macro:${id}`), ...legacySingles(a)]);
  const off = a.mode === 'safe' ? 'on safe' : a.ch === 'empty' ? 'chamber empty' : (a.st || a.ch === 'dud' || a.ch === 'case') ? 'a stoppage' : null;
  if (off) for (const id of REMEDY[off]) if (offered.has(id)) return id;
  for (const id of ['macro:ia', 'macro:remedial']) if (offered.has(id)) return id;
  if (offered.has('selector:semi')) return 'selector:semi';
  for (const id of ['macro:reload:speed', 'macro:reload:tactical', 'macro:reload:retain']) if (offered.has(id)) return id;
  return null;
}
