// OLYMPUS core: the registry of bus facts, every name the sim may emit, its owner and its payload.
//
// The sim reports facts on the bus and the UI decides how to show them (src/core/bus.js). So that
// the presenter, the tests and the sections agree on what a fact is called and carries, every name
// is listed here once (TECH §2.7, CONTRACTS §11), kebab-case (TECH correction 6: skip-start, never
// VIEWS's skip:start), with the section that owns it and a line on its payload. A section registers
// its facts here in the same change that first emits them. tests/syntax.test.mjs fails on an
// emit('<literal>') anywhere in src whose name is not registered, and lists the names registered
// but never emitted, so the table stays the truth in both directions.
//
// The 0.0.2 build sheet (§2.1) adds three to TECH's table: skip (the legacy loop.skip's report,
// kept for its tests), line (a short line for the player, a toast until the presenter exists) and
// path-done (PLACES: a path request answered); and skip-end's minutes, the whole game minutes the
// skip passed.

const fact = (owner, payload) => Object.freeze({ owner, payload });

/** Every bus fact: name → { owner, payload } (a one-line description of the payload). */
export const FACTS = Object.freeze({
  hold: fact('TECH', '{ held, holds }: time stands still (or runs again) for the sim\'s reasons'),
  'skip-start': fact('TIME', '{ id, activity, kind, fromMs, toMs, where, posture, mask }'),
  'skip-frame': fact('TIME', '{ id, atMs, ticker: [new lines], frame: sample | null }, once per frame of a skip'),
  'skip-interrupt': fact('TIME', '{ id, atMs, by, prio, line, reflex }'),
  'skip-end': fact('TIME', '{ id, activity, fromMs, toMs, planned, interrupted, by, outcome, papers, minutes }'),
  skip: fact('TECH', 'the legacy loop.skip report: { what, fromMs, toMs, requestedMs, elapsedMs, minutes, stopped, reason }'),
  autosave: fact('TIME, CAREER (ask), TECH (writes)', "{ why: 'skip' | 'day' | 'live' | 'area' | 'edge' | 'combat' | 'death' }"),
  log: fact('TECH', '{ entry }: a record appended to state.log'),
  line: fact('TECH', '{ text, kind? }: a short line for the player (a toast until the presenter)'),
  roll: fact('SKILLS', '{ roll } (SKILLS §15.2\'s record)'),
  say: fact('PEOPLE', "{ who, text, kind: 'speech' | 'radio' | 'bark' | 'pa', durMs }"),
  'area-enter': fact('PLACES', '{ site, area, from, portal }'),
  'area-leave': fact('PLACES', '{ site, area, from, portal }'),
  'chunk-in': fact('PLACES', '{ site, area, i, j }'),
  'chunk-out': fact('PLACES', '{ site, area, i, j }'),
  'path-done': fact('PLACES', '{ reqId, who, ok, lengthM, reason }: a path request answered'),
  sound: fact('VIEWS (audio), PEOPLE (hearing)', '{ kind, x, y, z, area, db, src }'),
  fx: fact('WEAPONS, COMBAT, PLACES', '{ kind, x, y, z, atMs, dir, size }: a muzzle flash, an impact, sparks, steam'),
  papers: fact('TIME, CAREER', '{ papers: [ … ] }'),
  'body-stage': fact('BODY', 'BODY §2.4'),
  'body-event': fact('BODY', 'BODY §2.4'),
  'body-interrupt': fact('BODY', 'BODY §2.4'),
  'body-dead': fact('BODY', 'BODY §2.4'),
  broke: fact('TECH', '{ where, message }: a lost tick or a failed listener'),
});

/** Whether a name is a registered fact. */
export const isFact = (name) => Object.prototype.hasOwnProperty.call(FACTS, name);
