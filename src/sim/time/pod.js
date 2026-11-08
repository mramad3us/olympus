// OLYMPUS sim: the night, taps, reveille and the weekly alert drill, posted into the queue each evening and handled when they come (TIME §9.2, §9.5, §7.1; the build sheet 0.0.4 §2.2.4).
//
// nightOf(state, ms) is the night beginning on the local sol of ms, or the one in progress (before
// that sol's reveille it is the night that began the sol before): { sol, tapsMs, reveilleMs, holiday },
// by the live site's Plan of the Day (its record's `routine`, src/data/pod.js ROUTINES; env.js
// routineOf: ROADMAP "anywhere"'s step 3): at Melas taps at 22:00 on its sol, reveille on the next at
// 05:30, or 07:00 when that morning is a Saturday or a Sunday (holiday). The night is still counted in
// sols at the site's longitude (siteLonEDeg throws off Mars: a ship's night waits for its routine). A clock time lands on its first whole second at or
// after it (jobs.js's rule, so the watch reads it: tonight's 02:30 is 02:30:00.091).
// drillOfWeek(seed, week, lonEDeg, firstNight) draws the week's alert drill from the world's seed (the
// user, 2026-11-05: what happens in the places is procedural): r = stream(seed, 'time:alert-drill',
// week), the night int(r, 7) after the week's Monday (Monday night 0) and the minute int(r, 241) after
// 00:30, so it sounds between 00:30 and 04:30 of the next sol, the slip inside the night (the sheet §8,
// item 2). In the career's first week (firstNight, the night of the sol it began on, in that week) the
// night is one of its first two, firstNight + int(r, 2) (my call, the review of v0.0.4: CAREER §5.2's
// first-night spike, still drawn, the opening always gets its jolt). Weeks are absolute: week =
// floor((sol − weekday) / 7), SETTING's week, Monday first.
// postNight(state, fromMs) cancels src 'time:night' and posts what of the night lies after fromMs:
// taps (prio 5, ambient: 'Taps. Lights out.'), reveille (prio 2, an O event: kind 'reveille') and,
// when the week's drill falls on this night, the drill (prio 1, an A event: kind 'alert'). A test
// scene's forced drill (time.drills.forced, a game ms; debug:drill:<ms>) replaces the draw when it
// lies between fromMs and the night's reveille. time.pod records what was posted. The time domain's
// job solDirector (local@20:00, CONTRACTS §5) calls it each evening; a new game's start() and the
// upgrade of a v0.0.3 save call it too, so a game begun at 23:00 has its reveille. Nothing is posted
// without a roster (the sandbox keeps v0.0.3's quiet queue, so the determinism suite's skips are not
// stopped by a drill: the sheet §8, item 26).
// The handlers (the time domain's events): reveille logs "Reveille. Lights.", tells the bus
// 'reveille' and calls the squad (people/place.js squadCall); alert opens time.drills.open, posts the
// count at its due time and the stand-down at its end (prio 2, O events: TIME §7.1's "a muster you
// are due at", so a skip begun in the drill lands at the count and at the stand-down, for their beat:
// the review of v0.0.4; src 'time:alert'), tells 'alert' { phase: 'sound' } and calls the squad up;
// alert-count counts the player present only if they stand mustered at its second (an arrival
// recorded earlier is not enough: the review of v0.0.4, mustered and gone to the showers, the count
// had said 13 of 13), logs the squad leader's count ("Sgt Okafor counts the bay: 12 of 13 at their
// racks.") and tells { phase: 'count' }; alert-end tells { phase: 'stand-down' }, calls the squad
// back down, writes 'missed' for a player who never mustered and moves the record to
// time.drills.last. A player who had mustered and is gone from the rack at the count or the
// stand-down has their arrival marked left (leftMs, the log, the 'late' fact's class 'left'); one gone
// at the count and back before the stand-down arrives again, late. The muster (TIME §9.5):
// musterCheck runs on whole seconds while a drill is open; the first second the player stands
// mustered (alerts.js), the arrival goes into time.attend (the last ATTEND_MAX), the log and the
// 'late' fact, its class by lateClass from the due time (TIME §9.5's: on-time to 0, late-minor to 2
// min, late to 10, very-late to 30, else missed). Lateness is kept in time.attend until PEOPLE's
// discipline reads it (the sheet §8, item 19).
import { post, cancel } from '../../core/queue.js';
import { SEC_MS, MIN_MS, HOUR_MS, SOL_MS } from '../../core/clock.js';
import { localSol, lonMs, HALF_SLIP_MS, MSD_EPOCH_MS } from '../../core/calendar.js';
import { stream, int } from '../../core/rng.js';
import { playerId } from '../../core/ids.js';
import { siteLonEDeg } from '../jobs.js';
import { siteAt, routineOf } from '../places/env.js';
import { weekdayOf } from './dates.js';
import { logEntry } from '../log.js';
import { hasRoster, squadCall, placed } from '../people/place.js';
import { mustered } from './alerts.js';
import { ALERT_DRILL, LATE_CLASSES, POD_LINES } from '../../data/pod.js';

/** The events of the night share this source (postNight cancels it); the open drill's count and stand-down theirs. */
export const NIGHT_SRC = 'time:night', ALERT_SRC = 'time:alert';
/** time.attend keeps the last this many arrivals. */
export const ATTEND_MAX = 50;

const ceilSec = (ms) => Math.ceil(ms / SEC_MS) * SEC_MS;
/** The game ms at which a local sol begins (civil 00:00) at an east longitude. */
export const solStartOf = (sol, lonEDeg) => sol * SOL_MS - MSD_EPOCH_MS - lonMs(lonEDeg) + HALF_SLIP_MS;
/** The first whole second at or after a local sol's civil hour (decimal hours; 24 and over run into the slip). */
export const atLocal = (sol, hour, lonEDeg) => ceilSec(solStartOf(sol, lonEDeg) + Math.round(hour * HOUR_MS));
/** Whether a sol's morning keeps a routine's holiday hours (Melas's: Saturday and Sunday, SETTING's week, Monday 0). */
export const holidayOf = (sol, R) => R.holidays.includes(weekdayOf(sol));
/** Reveille's hour on the morning of a sol by a routine (ROUTINES' row): at Melas 07:00 on Saturday and Sunday, else 05:30. */
export const reveilleH = (sol, R) => (holidayOf(sol, R) ? R.reveilleHolidayH : R.reveilleH);
/** The absolute week of a local sol (SETTING's week, Monday first). */
export const weekOf = (sol) => Math.floor((sol - weekdayOf(sol)) / 7);
/** The Monday of an absolute week. */
export const mondayOf = (week) => { let s = week * 7; while (weekdayOf(s) !== 0) s++; return s; };

/** The night beginning on the local sol of ms, or the one in progress (see the header). */
export function nightOf(state, ms = state.clock.ms) {
  const lon = siteLonEDeg(state), R = routineOf(siteAt(state));
  let sol = localSol(ms, lon).sol;
  if (ms < atLocal(sol, reveilleH(sol, R), lon)) sol -= 1;
  const morning = sol + 1;
  return { sol, tapsMs: atLocal(sol, R.tapsH, lon), reveilleMs: atLocal(morning, reveilleH(morning, R), lon), holiday: holidayOf(morning, R) };
}

/** The week's alert drill: { drill: the sol it sounds on, night: the sol its night began, atMs } (see the header). */
export function drillOfWeek(seed, week, lonEDeg, firstNight = null) {
  const r = stream(seed, 'time:alert-drill', week), mon = mondayOf(week);
  const first = Number.isFinite(firstNight) && firstNight >= mon && firstNight < mon + 7;
  const n = first ? firstNight - mon + int(r, Math.min(2, mon + 7 - firstNight)) : int(r, 7);
  const minute = int(r, Math.round((ALERT_DRILL.toH - ALERT_DRILL.fromH) * 60) + 1);
  const night = mon + n, drill = night + 1;
  return { drill, night, atMs: ceilSec(solStartOf(drill, lonEDeg) + Math.round(ALERT_DRILL.fromH * HOUR_MS) + minute * MIN_MS) };
}

/** The drill of a night, if one: the forced one where it lies in it, else the week's draw where it falls on it. */
export function drillOfNight(state, night, fromMs) {
  const lon = siteLonEDeg(state), forced = state.time?.drills?.forced;
  if (Number.isFinite(forced) && forced > fromMs && forced <= night.reveilleMs) {
    const at = ceilSec(forced);
    return { drill: localSol(at, lon).sol, night: night.sol, atMs: at, forced: true };
  }
  const d = drillOfWeek(state.meta.seed, weekOf(night.sol), lon, firstNightOf(state));
  return d.night === night.sol ? d : null;
}

/** The night of the sol the career began on (its first), or null. */
export function firstNightOf(state) {
  const at = state?.meta?.createdMs;
  return Number.isFinite(at) ? nightOf(state, at).sol : null;
}

/** Post the night's events after fromMs (see the header). Returns time.pod, or null without a roster. */
export function postNight(state, fromMs = state.clock.ms) {
  if (!hasRoster(state)) return null;
  cancel(state, NIGHT_SRC);
  const n = nightOf(state, fromMs), d = drillOfNight(state, n, fromMs);
  const area = state.places?.live?.area ?? undefined;
  if (n.tapsMs > fromMs) post(state, { atMs: n.tapsMs, prio: 5, kind: 'taps', src: NIGHT_SRC, line: POD_LINES.taps });
  if (n.reveilleMs > fromMs) post(state, { atMs: n.reveilleMs, prio: 2, kind: 'reveille', src: NIGHT_SRC, area, line: POD_LINES.reveille, payload: { holiday: n.holiday } });
  if (d && d.atMs > fromMs) post(state, { atMs: d.atMs, prio: 1, kind: 'alert', src: NIGHT_SRC, area, line: POD_LINES.alert, tone: 'urgent', payload: { drill: d.drill } });
  state.time.pod = { sol: n.sol, tapsMs: n.tapsMs, reveilleMs: n.reveilleMs, drillMs: d && d.atMs > fromMs ? d.atMs : null };
  return state.time.pod;
}

/** TIME §9.5's class of an arrival lateMs after the due time (null or Infinity: never came). */
export function lateClass(lateMs) {
  if (lateMs === null || lateMs === undefined || !Number.isFinite(lateMs)) return 'missed';
  for (const [upTo, cls] of LATE_CLASSES) if (lateMs <= upTo) return cls;
  return 'missed';
}

/** The night's record in time, filled where missing (init, upgrade). */
export function fillPod(t) {
  t.pod ??= {};
  t.drills ??= {};
  t.attend ??= [];
  t.prefs ??= {};
  return t;
}

// ---- the handlers ----

const nameOf = (p) => (p ? `${p.service?.rank ? p.service.rank + ' ' : ''}${p.name?.family ?? p.name?.given ?? p.id}` : 'The squad leader');

export function onTaps(state, bus, ev) {
  logEntry(state, bus, { kind: 'pod', tone: 'note', text: ev.line ?? POD_LINES.taps });
}

export function onReveille(state, bus, ev) {
  logEntry(state, bus, { kind: 'pod', tone: 'note', text: ev.line ?? POD_LINES.reveille });
  bus.emit('reveille', { atMs: ev.atMs, area: ev.area ?? state.places?.live?.area ?? null, holiday: !!ev.payload?.holiday });
  squadCall(state, 'reveille', ev.atMs);
}

export function onAlert(state, bus, ev) {
  const atMs = ev.atMs, d = { drill: ev.payload?.drill ?? localSol(atMs, siteLonEDeg(state)).sol, atMs, dueMs: atMs + ALERT_DRILL.dueMs, endMs: atMs + ALERT_DRILL.endMs, counted: false };
  fillPod(state.time);
  state.time.drills.open = d;
  post(state, { atMs: d.dueMs, prio: 2, kind: 'alert-count', src: ALERT_SRC, line: POD_LINES.count, payload: { drill: d.drill } });
  post(state, { atMs: d.endMs, prio: 2, kind: 'alert-end', src: ALERT_SRC, line: POD_LINES.standDown, payload: { drill: d.drill } });
  logEntry(state, bus, { kind: 'pod', tone: 'urgent', text: ev.line ?? POD_LINES.alert });
  bus.emit('alert', { drill: d.drill, kind: 'drill', phase: 'sound', atMs, dueMs: d.dueMs, endMs: d.endMs, horn: ALERT_DRILL.horn });
  squadCall(state, 'alert', atMs);
}

// (the player's arrival at this drill, if they came and have not left since)
const arrivalOf = (state, d) => (state.time.attend ?? []).find(a => a.block === 'drill' && a.drill === d.drill && a.dueMs === d.dueMs && !Number.isFinite(a.leftMs)) ?? null;

// (an arrival marked left: gone from the rack at the count or the stand-down)
function markLeft(state, bus, d, rec, atMs, at) {
  rec.leftMs = atMs;
  logEntry(state, bus, { kind: 'late', tone: 'warn', text: at === 'count' ? 'Not at your rack for the count. The squad leader saw the empty rack.' : 'Gone from your rack before the stand-down. It was noticed.' });
  bus.emit('late', { who: rec.who, block: 'drill', dueMs: d.dueMs, arrivedMs: rec.arrivedMs, lateMs: rec.lateMs, class: 'left', leftMs: atMs });
}

export function onAlertCount(state, bus, ev) {
  const d = state.time.drills?.open;
  if (!d) return;
  d.counted = true;
  const me = playerId(state), squad = placed(state).filter(id => state.people[id]?.service?.unitId === state.people[me]?.service?.unitId);
  const unit = state.units?.[state.people[me]?.service?.unitId], sl = unit?.billets?.sl ? state.people[unit.billets.sl] : null;
  // (the player counts only standing mustered at this second: an arrival earlier is not enough)
  const atRack = mustered(state, me, ev.atMs), arrived = arrivalOf(state, d);
  if (atRack && !arrived) recordArrival(state, bus, d, ev.atMs);
  else if (!atRack && arrived) markLeft(state, bus, d, arrived, ev.atMs, 'count');
  const here = squad.filter(id => id !== me).length + (atRack ? 1 : 0);
  logEntry(state, bus, { kind: 'pod', tone: here === squad.length ? 'note' : 'warn', text: `${nameOf(sl)} counts the bay: ${here} of ${squad.length} at their racks.` });
  bus.emit('alert', { drill: d.drill, kind: 'drill', phase: 'count', atMs: ev.atMs, dueMs: d.dueMs, endMs: d.endMs, horn: ALERT_DRILL.horn, here, of: squad.length });
}

export function onAlertEnd(state, bus, ev) {
  const d = state.time.drills?.open;
  if (!d) return;
  bus.emit('alert', { drill: d.drill, kind: 'drill', phase: 'stand-down', atMs: ev.atMs, dueMs: d.dueMs, endMs: d.endMs, horn: ALERT_DRILL.horn });
  logEntry(state, bus, { kind: 'pod', tone: 'note', text: 'Stand down. Back in your racks.' });
  const arrived = arrivalOf(state, d);
  if (!arrived) recordArrival(state, bus, d, null);
  else if (!mustered(state, playerId(state), ev.atMs)) markLeft(state, bus, d, arrived, ev.atMs, 'stand-down');
  state.time.drills.last = { ...d };
  delete state.time.drills.open;
  squadCall(state, 'stand-down', ev.atMs);
}

// (an arrival, or a never-came at the stand-down: time.attend, the log, the 'late' fact)
function recordArrival(state, bus, d, arrivedMs) {
  const who = playerId(state), lateMs = arrivedMs === null ? null : arrivedMs - d.dueMs, cls = lateClass(lateMs);
  const rec = { block: 'drill', drill: d.drill, who, dueMs: d.dueMs, arrivedMs, lateMs, class: cls };
  const list = (state.time.attend ??= []);
  list.push(rec);
  if (list.length > ATTEND_MAX) list.splice(0, list.length - ATTEND_MAX);
  const words = { 'on-time': 'At your rack in time for the count.', 'late-minor': 'At your rack, a shade late for the count.', late: 'At your rack, late for the count. It was noticed.', 'very-late': 'At your rack, very late. The squad leader wrote it down.', missed: 'You missed the count.' }[cls];
  logEntry(state, bus, { kind: 'late', tone: cls === 'on-time' ? 'note' : 'warn', text: words });
  bus.emit('late', { who, block: 'drill', dueMs: d.dueMs, arrivedMs, lateMs, class: cls });
  return rec;
}

/** On a whole second while a drill is open: the player's arrival, the first second they stand mustered (see the header). */
export function musterCheck(state, bus) {
  const d = state.time?.drills?.open;
  if (!d || state.clock.ms < d.atMs || arrivalOf(state, d)) return null;
  if (!mustered(state, playerId(state), state.clock.ms)) return null;
  return recordArrival(state, bus, d, state.clock.ms);
}
