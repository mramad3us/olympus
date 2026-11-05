// OLYMPUS sim: the dates, core's calendar arithmetic bound to SETTING's definitions (TIME §1).
//
// src/core/calendar.js does the arithmetic (UTC, the Mars Sol Date, the local civil clock with its
// slip centred on mean midnight, the year from Sol 1 boundaries, Ls) and takes SETTING's year
// definitions as a parameter, because src/core imports only src/core. This module binds them once
// (YEARS, from src/data/setting/calendar.js) and is what the watch, the save lines, the debug
// handle's event list and the papers call: one quantity, one helper (TIME §1, TECH §2.2's "the
// watch calls calendar.js"). The face's formats are TIME §3.1's: 'Sol 590 · 12:40' on the watch, its
// second line 'MY 211 Sol 590', 'Sol 590 · 24:00 +12' in the slip; the civil date '5 Patience 211'
// (SETTING §3.4) is the Republic's, for letters and the news.
//
// marsLocal(ms, lonE) is TIME §1's record: { solIndex, solOfYear, my, weekday, inSlip, slipMs, hour,
// minute, second, civilMs, meanSolarFrac, lsDeg }, at the start at Melas: solIndex 169,904, Sol 590
// MY 211, a Monday, 12:39:34, Ls 316.4 (SETTING §3.7).
import { marsClock as clockOf, yearsOf, solText as solTextOf, marsDateText as dateTextOf, lsDeg as lsOf, yearOfSol, sol1Of, weekdayOfSol } from '../../core/calendar.js';
import * as SETTING from '../../data/setting/calendar.js';

/** SETTING's year definitions, in the form core's arithmetic takes. */
export const YEARS = yearsOf(SETTING);

/** The Mars local clock with the year and the season (core's marsClock, SETTING's years). */
export const marsClock = (ms, lonEDeg) => clockOf(ms, lonEDeg, YEARS);

/** TIME §1's record of the Mars local time at a game time and east longitude. */
export function marsLocal(ms, lonEDeg) {
  const c = marsClock(ms, lonEDeg);
  return { solIndex: c.sol, solOfYear: c.solOfYear, my: c.my, weekday: c.weekday, inSlip: c.timeslip, slipMs: c.slipMs,
    hour: c.hour, minute: c.minute, second: c.second, civilMs: c.civilMs, meanSolarFrac: c.meanSolarFrac, lsDeg: c.lsDeg };
}

/** 'Sol 590 · 12:40' ('Sol 590 · 24:00 +12' in the slip, ' TIMESLIP' after unless flag is false). */
export const solText = (ms, lonEDeg, opts) => solTextOf(ms, lonEDeg, YEARS, opts);
/** 'MY 211 Sol 590'. */
export const marsDateText = (ms, lonEDeg) => dateTextOf(ms, lonEDeg, YEARS);
/** Ls in degrees at a game time. */
export const lsDeg = (ms) => lsOf(ms, YEARS);
/** A local sol's weekday, 0 (Monday) to 6, on SETTING's week (core's weekdayOfSol with its WEEK_OFFSET): the watch's and the weekly jobs' one helper. */
export const weekdayOf = (solIndex) => weekdayOfSol(solIndex, YEARS);
/** The weekday's name of a local sol (SETTING's week). */
export const weekdayName = (solIndex) => SETTING.WEEKDAYS[weekdayOf(solIndex)];
/** Sol 1 of Mars Year k, an Airy-0 sol number. */
export const sol1 = (k) => sol1Of(YEARS, k);

/** The civil date of a sol of the year (SETTING §3.4): { month 1-24, name, day, text: '5 Patience 211' }. */
export function civilDate(solIndex) {
  const { my, solOfYear } = yearOfSol(solIndex, YEARS);
  let day = solOfYear, m = 0;
  while (m < 23 && day > SETTING.MONTH_SOLS[m]) { day -= SETTING.MONTH_SOLS[m]; m++; }
  return { month: m + 1, name: SETTING.MONTHS[m], day, text: `${day} ${SETTING.MONTHS[m]} ${my}` };
}
