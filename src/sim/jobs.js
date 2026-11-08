// OLYMPUS sim: recurring jobs, events that post their successor, merged from every domain by name.
//
// Hourly and daily work is not a layer of the loop: it is events in the one queue (TECH §3.5, §4.3;
// TIME §11.3), which live play dispatches in the tick whose clock reaches them and a skip in the
// step that reaches them. A job is an event of kind 'job' whose payload names it ({ job, every });
// dispatch() runs its handler, then posts its next occurrence. Jobs are referenced by name, so the
// save holds plain data; a name that disappears in a later version is dropped on load with its
// events (ensureJobs, run by the composition root as an upgrade), and a game posts every recurring
// job at newGame, so each has exactly one live occurrence at all times (TECH §4.3).
//
// The every grammar (TECH §4.3; the slot table is TIME §11.3's, CONTRACTS §5):
//   hour@:MMZ              every UTC hour at minute MM
//   day@HH:MMZ             every UTC day at HH:MM
//   local@HH:MM            every local day at that time on the live site's clock (places' env.js
//                          localTime and msAtLocal; the start site's, SETTING §3.7, before any site is
//                          live): a sol at Melas, the timeslip in it (local@24:10 is ten minutes into
//                          it), and a UTC day on a ship (ROADMAP "anywhere"'s step 3: env-clock)
//   week@<weekday>/HH:MM   weekly, on the site's week: at Melas SETTING's, the local sol's weekday by
//                          its number plus WEEK_OFFSET mod 7, Monday 0 (MSD 0 was a Monday, SETTING
//                          §3.4), the watch's own helper; on UTC the calendar's
//   every@<ms>             an absolute period from the career's start (meta.createdMs until CAREER
//                          keeps its own): fitness weeks, rust's periods
// nextOccurrence(every, afterMs, { site, lonEDeg, originMs }) gives the first whole second strictly after
// afterMs at which the slot falls: a local time is rounded up to its second, so local@00:00 falls on
// the sol's 00:00 just after the slip, never in it. UTC hours and days fall on whole seconds as they
// are (game time 0 is 08:00:00 UTC). `site` (an id or a record) names the clock local@ and week@ are
// read on; without it, Mars's at lonEDeg (the tests' form). postJob always gives the live site.
//
// createJobs(domains) merges the domains' tables: each descriptor's jobs { <name>: { every?, prio?,
// src?, payload?, run(state, bus, ev) } } (a job without every runs only when posted by hand) and
// events { <kind>: fn(state, bus, ev) } for events of other kinds (a hazard, a need crossing). A name
// or kind given twice throws. A job's src defaults to '<domain>:<name in kebab-case>' (time's
// autosaveDay is 'time:autosave-day').
import { post, cancel } from '../core/queue.js';
import { SEC_MS, MIN_MS, HOUR_MS, DAY_MS } from '../core/clock.js';
import { UNIX_MS_AT_EPOCH, WEEKDAYS, msAtMarsTime } from '../core/calendar.js';
import { lonOf } from './places/model.js';
import { siteAt, msAtLocal, timeAt, marsTime } from './places/env.js';

const ceilSec = (ms) => Math.ceil(ms / SEC_MS) * SEC_MS;
// (game time of a UTC midnight, modulo a day: the epoch is 08:00 UTC, so midnights fall at -8 h mod 24 h)
const UTC_DAY_OFFSET_MS = ((UNIX_MS_AT_EPOCH % DAY_MS) + DAY_MS) % DAY_MS;
const two = (s) => Number(s);

const parsed = new Map();                                          // (a memo of parseEvery: every → its form)
/** Forget the memo (TECH §2.3: a sim module's caches go between games). */
export function resetCaches() { parsed.clear(); }

/** The form of an every string: { kind: 'hour' | 'day' | 'local' | 'week' | 'every', … }. Throws on a bad one. */
export function parseEvery(every) {
  let p = parsed.get(every);
  if (p) return p;
  let m;
  const bad = (why) => { throw new Error(`a job's every '${every}' ${why} (TECH §4.3: hour@:MMZ, day@HH:MMZ, local@HH:MM, week@<weekday>/HH:MM, every@<ms>)`); };
  const clock = (h, mi, maxH) => { if (h > maxH || mi > 59 || (h === 24 && mi > 39)) bad('is not a time on that clock'); };
  if ((m = /^hour@:(\d\d)Z$/.exec(every))) { p = { kind: 'hour', minute: two(m[1]) }; clock(0, p.minute, 23); }
  else if ((m = /^day@(\d\d):(\d\d)Z$/.exec(every))) { p = { kind: 'day', hour: two(m[1]), minute: two(m[2]) }; clock(p.hour, p.minute, 23); }
  else if ((m = /^local@(\d\d):(\d\d)$/.exec(every))) { p = { kind: 'local', hour: two(m[1]), minute: two(m[2]) }; clock(p.hour, p.minute, 24); }
  else if ((m = /^week@([A-Z][a-z]+)\/(\d\d):(\d\d)$/.exec(every))) {
    const wd = WEEKDAYS.indexOf(m[1]);
    if (wd < 0) bad(`names no weekday (${WEEKDAYS.join(', ')})`);
    p = { kind: 'week', weekday: wd, hour: two(m[2]), minute: two(m[3]) }; clock(p.hour, p.minute, 24);
  } else if ((m = /^every@(\d+)$/.exec(every))) { p = { kind: 'every', periodMs: Number(m[1]) }; if (!(p.periodMs >= SEC_MS) || p.periodMs % SEC_MS) bad('is not a whole number of seconds'); }
  else bad('is not in the grammar');
  p = Object.freeze(p);
  parsed.set(every, p);
  return p;
}

/** The first whole second strictly after afterMs at which an every slot falls (see the header). */
export function nextOccurrence(every, afterMs, { site = null, lonEDeg = 0, originMs = 0 } = {}) {
  const p = parseEvery(every);
  // (the clock local@ and week@ read: the site's, or Mars's at lonEDeg)
  const at = (from) => (site !== null ? msAtLocal(site, from, p.hour, p.minute) : msAtMarsTime(from, p.hour, p.minute, lonEDeg));
  const weekdayAt = (t) => (site !== null ? timeAt(site, t) : marsTime(t, lonEDeg)).weekday;
  switch (p.kind) {
    case 'hour': {
      let t = Math.floor(afterMs / HOUR_MS) * HOUR_MS + p.minute * MIN_MS;
      if (t <= afterMs) t += HOUR_MS;
      return t;
    }
    case 'day': {
      let t = Math.floor((afterMs + UTC_DAY_OFFSET_MS) / DAY_MS) * DAY_MS - UTC_DAY_OFFSET_MS + p.hour * HOUR_MS + p.minute * MIN_MS;
      if (t <= afterMs) t += DAY_MS;
      return t;
    }
    case 'local': return ceilSec(at(afterMs + 1));
    case 'week': {
      let from = afterMs + 1;
      for (let k = 0; k < 8; k++) {
        const t = at(from);
        if (weekdayAt(t) === p.weekday) return ceilSec(t);
        from = t + 1;
      }
      throw new Error(`no ${every} in eight local days after ${afterMs}`);
    }
    case 'every': {
      const k = Math.floor((afterMs - originMs) / p.periodMs) + 1;
      return ceilSec(originMs + k * p.periodMs);
    }
  }
  throw new Error(`no such every kind: ${p.kind}`);
}

const kebab = (name) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/**
 * The jobs of a game, merged from its domains (each { name, jobs?, events? }): { handlers: name →
 * run, jobs: name → { job, every, prio, src, payload }, recurring: [those with every], events: kind → fn }.
 */
export function createJobs(domains) {
  const handlers = {}, jobs = {}, recurring = [], events = {};
  for (const d of domains) {
    for (const [name, j] of Object.entries(d.jobs ?? {})) {
      if (handlers[name]) throw new Error(`the job '${name}' is registered twice (by '${jobs[name].domain}' and by '${d.name}')`);
      if (typeof j.run !== 'function') throw new Error(`the job '${name}' of '${d.name}' has no run()`);
      if (j.every) parseEvery(j.every);
      handlers[name] = j.run;
      jobs[name] = Object.freeze({ job: name, every: j.every ?? null, prio: j.prio ?? 5, src: j.src ?? `${d.name}:${kebab(name)}`, payload: j.payload ?? null, domain: d.name });
      if (j.every) recurring.push(jobs[name]);
    }
    for (const [kind, fn] of Object.entries(d.events ?? {})) {
      if (kind === 'job') throw new Error(`'${d.name}' registers a handler for 'job' events: jobs go in its jobs table`);
      if (events[kind]) throw new Error(`events of kind '${kind}' are handled twice (the second by '${d.name}')`);
      events[kind] = fn;
    }
  }
  return Object.freeze({ handlers: Object.freeze(handlers), jobs: Object.freeze(jobs), recurring: Object.freeze(recurring), events: Object.freeze(events) });
}

/** The live site's east longitude, or the start site's before any site is live (places' lonOf: throws off Mars). */
export function siteLonEDeg(state) {
  return lonOf(state);
}

/** Post a job's next occurrence after afterMs (the clock by default): { job, every, src, prio = 5, payload }. Returns its id. */
export function postJob(state, { job, every, src, prio = 5, payload = null }, afterMs = state.clock.ms) {
  const atMs = nextOccurrence(every, afterMs, { site: siteAt(state), originMs: state.meta.createdMs ?? 0 });
  return post(state, { atMs, prio, kind: 'job', src, payload: { ...(payload ?? {}), job, every } });
}

/** Post every recurring job's first occurrence (newGame). */
export function postJobs(state, jobs) {
  for (const j of jobs.recurring) postJob(state, j);
}

/**
 * On load: drop the events of jobs no longer registered, and post any recurring job that has no
 * live occurrence (a save from before it existed). Returns { dropped, posted }.
 */
export function ensureJobs(state, jobs) {
  const live = new Set(), gone = [];
  for (const ev of state.events ?? []) {
    if (ev.dead || ev.kind !== 'job') continue;
    if (jobs.handlers[ev.payload?.job]) live.add(ev.payload.job);
    else gone.push([ev.src, ev.payload?.job]);
  }
  let dropped = 0;                                                   // (cancelled after the walk: a cancel may compact the heap)
  for (const [src, name] of gone) dropped += cancel(state, src, (e) => e.kind === 'job' && e.payload?.job === name);
  let posted = 0;
  for (const j of jobs.recurring) if (!live.has(j.job)) { postJob(state, j); posted++; }
  return { dropped, posted };
}

/**
 * Dispatch an event: a job's handler, then its successor (posted even if the handler throws, so a
 * bug costs one run, not the job); another kind's handler. Returns whether anything handled it.
 */
export function dispatch(state, bus, ev, jobs) {
  if (ev.kind === 'job') {
    const name = ev.payload?.job, run = jobs.handlers[name];
    if (!run) return false;                                          // (a job gone from the game: it ends here)
    try { run(state, bus, ev); }
    finally {
      if (ev.payload.every) {
        const { job, every, ...payload } = ev.payload;
        postJob(state, { job, every, src: ev.src, prio: ev.prio, payload: Object.keys(payload).length ? payload : null }, ev.atMs);
      }
    }
    return true;
  }
  const fn = jobs.events[ev.kind];
  if (!fn) return false;
  fn(state, bus, ev);
  return true;
}
