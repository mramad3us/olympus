// OLYMPUS sim: the log, the record of what happened, newest last, at most LOG_MAX records.
//
// state.log is the game's record of rolls, what the character notices and what happens (TECH §6.5),
// and the bus hears each record as it is written ('log' { entry }), so the presenter can show it
// and the J log can page through it. A record is
//     { seq, atMs, kind, tone, text?, roll?, who?, area?, … }
// seq is the last record's plus one (1 for the first), so a record is named by its seq even after
// the oldest have gone; atMs is the game time it was written. A roll stores no text (SKILLS's
// rollText() renders it, its wording by hash), other records a short text or a { line, args } key.
// Fields at their defaults are left out (TECH §6.6, rule 1). The oldest records are dropped from the
// front past LOG_MAX (1,500: about 300 KB at 196 B a roll, two or three busy sols); what lasts beyond
// them is the career's record and people's memories.
//
// Adapted from tradecraft v0.2.0-rc3 src/sim/log.js (27 lines): its say() kept as logEntry(); its
// ms became atMs on state.clock, a seq was added, the cap went from 500 to 1,500, and the XP hook
// (xp.fromRoll) and the speech balloons (speak(), PEOPLE's 'say' fact) are left to their owners.

export const LOG_MAX = 1500;

/** Write a record to the log ({ kind, tone = 'note', text, … }) and tell the bus. Returns the record. */
export function logEntry(state, bus, { kind, tone = 'note', ...rest }) {
  if (typeof kind !== 'string') throw new Error(`logEntry(): a record needs a kind (${JSON.stringify(rest)})`);
  const log = (state.log ??= []);
  const entry = { seq: (log.length ? log[log.length - 1].seq : 0) + 1, atMs: state.clock.ms, kind, tone, ...rest };
  log.push(entry);
  if (log.length > LOG_MAX) log.splice(0, log.length - LOG_MAX);
  bus?.emit('log', { entry });
  return entry;
}
