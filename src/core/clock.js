// OLYMPUS core: game time.
//
// Game time is whole milliseconds since LONGHAUL's epoch, 2351-03-22 08:00:00 UTC (LONGHAUL
// js/core/clock.js; DESIGN.md, Setting: "OLYMPUS starts in 2351, on LONGHAUL's timeline"), held in
// state.clock.ms. Whole milliseconds, so a tick adds exactly and a long career never drifts. The
// calendars (UTC, the Mars Sol Date, the Mars local clock and year) are derived from it, never
// stored: src/core/calendar.js.
//
// The sim steps at TICK_MS = 50 (20 Hz), one game second per real second, with no speed controls
// (DESIGN.md, Time; the user, 2026-11-05: "1:1 real time while you act. Activities skip time").
// Time moves faster only through an activity that takes time, which calls the loop's skip()
// (src/core/loop.js): the clock jumps, and the world gets outcomes for the gap.
//
// state.clock is { ms, tick, holds }:
//   ms     game time, as above.
//   tick   how many 20 Hz ticks have been lived (a skip moves ms, not tick), for staggering work
//          across ticks by an id's hash (tradecraft: followers re-route every 10 ticks).
//   holds  why time stands still, as a list of reasons ('shoot', 'talk', 'cqc'), kept in the save:
//          the sim asks for a hold when the game waits on the player's choice (stop motion in
//          shooting and CQC; time standing still while you talk), and releases it when they've
//          chosen. While any hold is up the loop still ticks (so the choice reaches the sim) but the
//          clock doesn't move and no layer but the ones marked whileHeld runs. The player's own pause
//          (Space, an open overlay) is something else: it's the loop's, runtime only, and stops ticks.

export const SEC_MS = 1000;
export const MIN_MS = 60 * SEC_MS;
export const HOUR_MS = 60 * MIN_MS;
export const DAY_MS = 24 * HOUR_MS;                                // an Earth day: the UTC calendar's
export const SOL_MS = 88_775_244;                                  // a mean Mars solar day, 24 h 39 m 35.244 s (DESIGN.md, Setting)
export const TICK_MS = 50;                                         // the sim's step: 20 a second
export const TICKS_PER_SEC = SEC_MS / TICK_MS;

/** The epoch as a UTC date: game time 0. */
export const EPOCH_UTC = Object.freeze({ year: 2351, month: 3, day: 22, hour: 8, minute: 0, second: 0 });

/** A fresh clock at a game time (0, the epoch, by default), rounded down to the tick grid. */
export function newClock(startMs = 0) {
  return { ms: onTick(startMs), tick: 0, holds: [] };
}

/** A time rounded down to a whole tick, so the clock always sits on the 50 ms grid. */
export const onTick = (ms) => Math.floor(ms / TICK_MS) * TICK_MS;

/** A length rounded up to a whole number of ticks (a skip of 1 ms is a tick). */
export const wholeTicks = (ms) => Math.ceil(ms / TICK_MS) * TICK_MS;

/** How many multiples of everyMs lie in (fromMs, toMs]: the boundaries a step from one to the other crosses. */
export const crossings = (fromMs, toMs, everyMs) => Math.floor(toMs / everyMs) - Math.floor(fromMs / everyMs);

// ---- holds: time standing still while the game waits on the player ----

/** Ask for time to stand still for a reason (once per reason). */
export function holdTime(state, reason) {
  const holds = (state.clock.holds ??= []);
  if (!holds.includes(reason)) holds.push(reason);
}

/** Let time go on for a reason (the others, if any, still hold it). */
export function releaseTime(state, reason) {
  const holds = state.clock.holds;
  const i = holds ? holds.indexOf(reason) : -1;
  if (i >= 0) holds.splice(i, 1);
}

/** Whether time stands still (for any reason, or for this one). */
export const isHeld = (state, reason) => (reason ? !!state.clock.holds?.includes(reason) : !!state.clock.holds?.length);

// ---- lengths in words ----

/**
 * A length of time in words, rounded to the unit shown first (LONGHAUL's formatDuration: 59.6 min
 * is '1 h', not '0 h 60 min'): '40 s', '12 min', '3 h 20 min', '2 d 4 h'. Earth units: a sol is
 * named as such where it's meant (calendar.js).
 */
export function durationText(ms) {
  if (!Number.isFinite(ms)) return 'forever';
  if (ms < 0) return `-${durationText(-ms)}`;
  if (ms < 0.5 * SEC_MS) return '0 s';
  if (ms < 59.5 * SEC_MS) return `${Math.round(ms / SEC_MS)} s`;
  if (ms < 59.5 * MIN_MS) return `${Math.round(ms / MIN_MS)} min`;
  if (ms < DAY_MS - 30 * MIN_MS) {
    const min = Math.round(ms / MIN_MS), h = Math.floor(min / 60), m = min % 60;
    return m ? `${h} h ${m} min` : `${h} h`;
  }
  const hours = Math.round(ms / HOUR_MS), d = Math.floor(hours / 24), h = hours % 24;
  return h ? `${d} d ${h} h` : `${d} d`;
}
