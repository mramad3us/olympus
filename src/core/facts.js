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
// skip passed. The 0.0.3 sheet adds door (PLACES: a door turned by a hand, doors.js).
// The 0.0.4 sheet (§2.5) adds TIME's activity, alert, reveille and late, widens skip-start and
// skip-interrupt, gives skip-end its outcome, and writes BODY's three payloads out.
// The 0.0.5 sheet (§2.5) adds WEAPONS' stop-mode, step, shot, muzzle, nd and range, and COMBAT's
// reflex; say gains its kinds 'pa' (the tower) and 'speech' (the coach), fx its flash, and roll is
// told after each logged roll with the roller (who).

const fact = (owner, payload) => Object.freeze({ owner, payload });

/** Every bus fact: name → { owner, payload } (a one-line description of the payload). */
export const FACTS = Object.freeze({
  hold: fact('TECH', '{ held, holds }: time stands still (or runs again) for the sim\'s reasons'),
  'skip-start': fact('TIME', '{ id, activity, kind, engine, fromMs, toMs, where, posture, mask, spotId, vignette, stoppable, chunkMs }'),
  'skip-frame': fact('TIME', '{ id, atMs, ticker: [new lines], frame: sample | null }, once per frame of a skip'),
  'skip-interrupt': fact('TIME', '{ id, atMs, by, prio, letter, kind, line, reflex }'),
  'skip-end': fact('TIME', '{ id, activity, fromMs, toMs, planned, interrupted, by, outcome: { body: { before, after }, look: { outfit, wet }, chunk: { offerMs } | null, lines, failedRoll, activity, held }, papers, minutes }'),
  activity: fact('TIME', "{ phase: 'start' | 'end', activity, who, spotId, fromMs, toMs, mode: 'live' | 'ff' | 'outcome', fraction, by, outcome }"),
  alert: fact('TIME', "{ drill, kind: 'drill', phase: 'sound' | 'count' | 'stand-down', atMs, dueMs, endMs, horn: { area, x, z }, here?, of? (the count: present of the squad) }"),
  reveille: fact('TIME', '{ atMs, area, holiday }'),
  late: fact('TIME', "{ who, block, dueMs, arrivedMs, lateMs, class: 'on-time' | 'late-minor' | 'late' | 'very-late' | 'missed' | 'left', leftMs? }"),
  skip: fact('TECH', 'the legacy loop.skip report: { what, fromMs, toMs, requestedMs, elapsedMs, minutes, stopped, reason }'),
  autosave: fact('TIME, CAREER (ask), TECH (writes)', "{ why: 'skip' | 'day' | 'live' | 'area' | 'edge' | 'combat' | 'death' }"),
  log: fact('TECH', '{ entry }: a record appended to state.log'),
  line: fact('TECH', '{ text, kind? }: a short line for the player (a toast until the presenter)'),
  roll: fact('SKILLS', '{ roll, who } (SKILLS §15.2\'s record, after it is logged; who the roller)'),
  say: fact('PEOPLE', "{ who, text, kind: 'speech' | 'radio' | 'bark' | 'pa', durMs }: 'pa' the range tower's, 'speech' a person beside you"),
  'area-enter': fact('PLACES', '{ site, area, from, portal }'),
  'area-leave': fact('PLACES', '{ site, area, from, portal }'),
  'chunk-in': fact('PLACES', '{ site, area, i, j }'),
  'chunk-out': fact('PLACES', '{ site, area, i, j }'),
  'path-done': fact('PLACES', '{ reqId, who, ok, lengthM, reason }: a path request answered'),
  door: fact('PLACES', "{ id, area, x, z, state: 'open' | 'closed', kind, who }: a door turned (x, z its middle in its area's frame)"),
  sound: fact('VIEWS (audio), PEOPLE (hearing)', '{ kind, x, y, z, area, db, src }'),
  fx: fact('WEAPONS, COMBAT, PLACES', "{ kind: 'flash' | …, x, y, z, atMs, dir, size }: a muzzle flash, an impact, sparks, steam"),
  'stop-mode': fact('WEAPONS', "{ phase: 'enter' | 'leave', who, gun, via: 'ready' | 'shoot' | null, why }: stop motion entered or left"),
  step: fact('WEAPONS', "{ phase: 'start' | 'sub' | 'halt' | 'cut' | 'end', who, step, i, action, fromMs, toMs, ok, grade, routine, mishap, text, brass?: [{ kind, landMs, at }] }: a stop-motion or live step and its sub-steps ('sub' as each begins, rolled; brass what it threw out of the port)"),
  shot: fact('WEAPONS', '{ id, who, gun, atMs, fired, why, stoppage, set, muzzle: { x, y, z }, dirRad, target, lane, hole: { at, score, v } | null, brass: { kind, landMs, at } | null, logSeq }: a trigger pulled'),
  muzzle: fact('WEAPONS', "{ who, at, kind: 'near' | 'flag' | 'point', posture, atMs }: a muzzle swept over someone"),
  nd: fact('WEAPONS', '{ who, gun, grade, into, nearId, atMs, during }: a negligent discharge'),
  range: fact('WEAPONS', "{ phase: 'cmd' | 'fault' | 'string' | 'clear' | 'stopped', cmd, hot, rule, kind: 'warn' | 'stop', text, n, score, of, v, why, hits?, shots?, list?: [{ score, v, hit }] }: the range session (hits, shots and list on a string's score, list its shots in order, a miss as score 0)"),
  reflex: fact('COMBAT', "{ phase: 'offer' | 'chosen' | 'kept', why, title, options, key }: a reflex card"),
  papers: fact('TIME, CAREER', '{ papers: [ … ] }'),
  'body-stage': fact('BODY', '{ who, ledger, from, to, tone, words, atMs }'),
  'body-event': fact('BODY', "{ who, kind: 'void' | 'bowel' | 'accident' | 'asleep' | 'woke' | 'wash' | 'groom' | 'drink' | 'eat', atMs, amount }"),
  'body-interrupt': fact('BODY', '{ who, ledger, band, atMs }: a crossing event dispatched'),
  'body-dead': fact('BODY', 'BODY §2.4'),
  broke: fact('TECH', '{ where, message }: a lost tick or a failed listener'),
});

/** Whether a name is a registered fact. */
export const isFact = (name) => Object.prototype.hasOwnProperty.call(FACTS, name);
