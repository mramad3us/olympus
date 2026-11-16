// OLYMPUS skills: a clean room counted toward the drill family's rung (COMBAT §25.3.2; the build sheet v0.0.21 §1 item 24; done lens D10).
//
// A drill family's rung (room, passage, hatch, void: COMBAT §25.3.1) is earned by clean repetitions: practised (2) after
// REPS_PRACTISED 20, drilled (3) after REPS_DRILLED 60 in all (templates.js holds both numbers, the one place they live);
// fluent (4) is a school's floor at graduation only, never counted here. A clean repetition is judged by its scene (the shoot
// house's shoothouse.js cleanRoomOf: a room cleared with no fault called); this module only counts what it is told. Each
// teacher teaches only so far (SKILLS §6.3's upTo, in kind: TEACHER_UP_TO): the unit's drills to 2, the shoot house's cadre,
// the boarding course and the AIC to 3, the ITC to 4; a repetition never lifts a rung past its teacher's reach. Field
// repetitions (a room cleared in an operation) count FIELD_REP_K 2 each, at most FIELD_REPS_SOL 5 of them a sol (SOL_MS from
// the clock), and teach to FIELD_UP_TO 3. A rung never goes down (rust is deferred: COMBAT §25.3.2).
//
// The record is the sheet's drills[family] (templates.js drillsOf): { rung, reps, field?: { sol, n } }. A test sheet never moves
// (ROADMAP §2.1, scenes never write a career): testSheet's record carries inoc.fixed, drillsRecord's fixed; on either, drillRep
// writes nothing and returns the rung as it is; nor on a person with no sheet (the roster rolls none yet: PEOPLE's careers
// arrive with the join). Nothing in a scene calls drillRep yet: the MOUT day's join will (COMBAT
// §25.10.1). drillRep(state, pid, family, { clean, teacher, field }) → the rung after the repetition. Pure but for its one write
// on the person's sheet.
import { SOL_MS } from '../../core/clock.js';
import { REPS_PRACTISED, REPS_DRILLED, drillsOf, rungOf } from './templates.js';

export { REPS_PRACTISED, REPS_DRILLED };
/** A field repetition's weight, the most of them counted a sol, and the rung they teach to (COMBAT §25.3.2). */
export const FIELD_REP_K = 2, FIELD_REPS_SOL = 5, FIELD_UP_TO = 3;
/** Each teacher's reach (SKILLS §6.3's upTo, in kind; COMBAT §25.3.2): the rung its repetitions can lift a sheet to. */
export const TEACHER_UP_TO = Object.freeze({ unit: 2, cadre: 3, boarding: 3, aic: 3, itc: 4 });

/** The rung a count of clean repetitions earns (0 below practised: the count alone never teaches rung 1, a lesson does). */
export const rungOfReps = (reps) => (reps >= REPS_DRILLED ? 3 : reps >= REPS_PRACTISED ? 2 : 0);

/** Whether a person's sheet is fixed (a test sheet's, or a record written fixed): drillRep never moves it. */
export function fixedSheet(state, pid, family = 'room') {
  const p = state?.people?.[pid];
  return !!(p?.skills?.inoc?.fixed || drillsOf(state, pid, family)?.fixed);
}

/**
 * One repetition of a drill family (see the header): clean (the scene's judge), teacher (TEACHER_UP_TO's key; 'unit' if unknown),
 * field (an operation's room: FIELD_REP_K, at most FIELD_REPS_SOL a sol, to FIELD_UP_TO). Returns the rung after it.
 */
export function drillRep(state, pid, family = 'room', { clean = false, teacher = 'unit', field = false } = {}) {
  const now = rungOf(state, pid, family), p = state?.people?.[pid];
  if (!p?.skills || !clean || fixedSheet(state, pid, family)) return now;
  const rec = (p.skills.drills ??= {})[family] ??= { rung: now };
  let add = 1;
  if (field) {
    const sol = Math.floor((state.clock?.ms ?? 0) / SOL_MS), F = rec.field?.sol === sol ? rec.field : (rec.field = { sol, n: 0 });
    if (F.n >= FIELD_REPS_SOL) return now;
    F.n++;
    add = FIELD_REP_K;
  }
  rec.reps = (rec.reps ?? 0) + add;
  const upTo = field ? FIELD_UP_TO : TEACHER_UP_TO[teacher] ?? TEACHER_UP_TO.unit;
  rec.rung = Math.max(now, Math.min(upTo, rungOfReps(rec.reps)));
  return rec.rung;
}
