// OLYMPUS core: the calendars, derived from game time (state.clock.ms), never stored.
//
// Three faces of the one time (DESIGN.md, Time: "Three clock faces, all derived from the one game
// time"): UTC (ship time, the Navy's, orders and pay), the Mars Sol Date with a Mars local clock and
// year (life on Mars), and the body clock (BODY.md's, not here).
//
// UTC. Game time 0 is 2351-03-22 08:00:00 UTC (clock.js EPOCH_UTC), a Thursday. The date comes from
// Howard Hinnant's civil-date algorithms (as in tradecraft's clock.js): pure integer arithmetic on
// the proleptic Gregorian calendar, no Date object, the same in every browser and in node, valid
// for hundreds of thousands of years either side. No leap seconds: game UTC is a uniform scale
// (the real one may have gained a few by 2351; nobody aboard a troopship would notice).
//
// The Mars Sol Date (MSD) is the count of mean Mars solar days, the standard one of Allison and
// McEwen (2000, Planetary and Space Science 48, 215-235), as NASA GISS's Mars24 uses it:
//     MSD = (JD_TT - 2405522.0028779) / 1.0274912517
// JD_TT is the Julian Date in Terrestrial Time. TT - UTC is taken as a constant 69.184 s: 37 leap
// seconds (TAI - UTC since 2017) plus TT - TAI's fixed 32.184 s. Leap seconds after 2017 can't be
// known (and may be abolished), so the offset is frozen there (TIME §2.3); it moves the Mars clock
// by about a minute at most against any real future one.
//     The game's sol is SOL_MS = 88,775,244 ms (DESIGN.md, Setting), the 1.0274912517 d of the
// formula to the millisecond (88,775,244.147 ms). The game counts sols in that whole number from
// TIME §2.3's integer anchor, MSD_EPOCH_MS = 15,059,764,595,616 ms of MSD at the epoch (the formula's
// MSD 169,639.2363 times SOL_MS, within a millisecond): msd(ms) = (ms + MSD_EPOCH_MS) / SOL_MS. So
// the local clock is exact integer arithmetic (a sol starts on a whole millisecond, and the
// timeslip's edges are exact), and the game's MSD runs 0.147 ms a sol ahead of the formula's: 2.6 s
// over a fifty-year career, 5 s a century. msdTrue(ms) is the formula itself, for checks.
//     Mars24's worked example A: at 2000-01-06 00:00:00 UTC (TT - UTC then 64.184 s) the MSD is
// 44795.99976 and Coordinated Mars Time 23.99424 h; at 2000-01-06 00:00 TT it is 44795.99904. The
// tests check both, and the epoch: MSD 169639.2363 at 2351-03-22 08:00 UTC.
//
// The Mars local civil clock (TIME §2.4; DESIGN.md, Time: "a 24-hour clock with the 39 m 35 s
// timeslip after midnight (KSR's convention)"). A site keeps the mean solar time of its own
// meridian, its east longitude taken in [0, 360) and turned into whole milliseconds of a sol
// (lonMs: Melas, 287.2 deg E, is 70,822,917 ms). The clock runs in Earth seconds, 00:00:00 to
// 23:59:59, then stops at 24:00 for the slip, SLIP_MS = 2,375,244 ms (39 m 35.244 s), and starts
// again at 00:00 as the sol number turns over. The slip is centred on mean solar midnight: civil
// 00:00 is half a slip (HALF_SLIP_MS 1,187,622 ms) after mean midnight, so the sun crosses the
// meridian at civil 12:00 exactly and the slip straddles the dead of night. It belongs to the sol
// that is ending ("Sol 590 · 24:00 +12" is twelve minutes into the slip at the end of Sol 590):
//     local    = ms + MSD_EPOCH_MS + lonMs(lonE)          ms since local MSD 0, mean midnight
//     solIndex = floor((local - HALF_SLIP_MS) / SOL_MS)   the absolute local sol count
//     into     = local - HALF_SLIP_MS - solIndex * SOL_MS from civil 00:00 (msOfSol)
//     inSlip   = into >= DAY_MS; the face reads 24:00 through it, slipMs = into - DAY_MS
// Measured at Melas: the epoch is solIndex 169,640, civil 00:30:38; START_MS (2351-12-19 02:20 UTC)
// is solIndex 169,904, 12:39:34.335, and 12:40 falls 25.7 s (25.665 s) later (TIME §2.4, CONTRACTS §3).
//     The week is seven sols counted from MSD 0, a Monday, shifted by SETTING's WEEK_OFFSET where
// its years are given (yearsOf carries it; 0 today): weekday = (solIndex + WEEK_OFFSET) mod 7, 0 =
// Monday (SETTING §3.4). weekdayOfSol is the one helper: the watch's marsClock, dates.js's names and
// the weekly jobs all read it, so a changed offset moves them together.
//
// The Mars year (TIME §2.5, SETTING §3.3) needs SETTING's definitions, which live in
// src/data/setting/calendar.js, and src/core imports only src/core: so the functions that need
// them take them as a parameter, years = yearsOf({ LS_EPOCH_DEG, MARS_YEAR_MS, MY_AT_EPOCH,
// MY_SOL1_MSD }), and TIME's src/sim/time/dates.js binds the two (TIME §1). The Mars year turns at
// Ls 0 on LONGHAUL's circular orbit, Ls advancing uniformly from LS_EPOCH_DEG at the epoch over
// MARS_YEAR_MS; year k begins at MY_START_MS + (k - MY_AT_EPOCH) * MARS_YEAR_MS (MY_START_MS =
// -round(LS_EPOCH_DEG / 360 * MARS_YEAR_MS), when MY 211 began), and Sol 1 of year k is the Airy-0
// sol holding that instant, MY_SOL1_MSD[k] where SETTING writes it, else floor(msd(that instant)).
// A site's solIndex is compared against the same boundaries, so a date is the same sol number
// planet-wide: my is the largest k whose Sol 1 is at or before solIndex, solOfYear = solIndex - Sol 1
// + 1. Years hold 668 or 669 sols (MY 211 to 216: 669, 669, 669, 669, 668, 669).
import { SEC_MS, MIN_MS, HOUR_MS, DAY_MS, SOL_MS, EPOCH_UTC } from './clock.js';

export const TT_MINUS_UTC_S = 69.184;                              // 37 s of leap seconds (2017) + 32.184 s
export const MSD_JD_TT_0 = 2405522.0028779;                        // Allison and McEwen (2000)
export const SOL_D = 1.0274912517;                                 // a mean sol in Earth days
export const SLIP_MS = SOL_MS - DAY_MS;                            // 2,375,244 ms: 39 m 35.244 s (TIME §1)
export const TIMESLIP_MS = SLIP_MS;                                // (the 0.0.1 name)
export const HALF_SLIP_MS = SLIP_MS / 2;                           // 1,187,622 ms: civil 00:00 after mean midnight
export const MSD_EPOCH_MS = 15_059_764_595_616;                    // MSD at the epoch, in ms of SOL_MS (TIME §1, §2.3)
export const MY_LABEL = 'MY';                                      // what the year is called on screen

export const WEEKDAYS = Object.freeze(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
export const MONTHS = Object.freeze(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']);

// ---- UTC ----

/** Days since 1970-01-01 of a proleptic Gregorian date (month 1-12). Hinnant's days_from_civil. */
export function daysFromCivil(y, m, d) {
  y -= m <= 2 ? 1 : 0;
  const era = Math.floor(y / 400), yoe = y - era * 400;
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

/** [year, month 1-12, day] of a count of days since 1970-01-01. Hinnant's civil_from_days. */
export function civilFromDays(z) {
  z += 719468;
  const era = Math.floor(z / 146097), doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1, m = mp + (mp < 10 ? 3 : -9);
  return [era * 400 + yoe + (m <= 2 ? 1 : 0), m, d];
}

/** Unix time (ms since 1970-01-01 00:00 UTC) of game time 0. */
export const UNIX_MS_AT_EPOCH = daysFromCivil(EPOCH_UTC.year, EPOCH_UTC.month, EPOCH_UTC.day) * DAY_MS
  + EPOCH_UTC.hour * HOUR_MS + EPOCH_UTC.minute * MIN_MS + EPOCH_UTC.second * SEC_MS;

/** Game time of a UTC date and time (month 1-12). Before the epoch it is negative. */
export const gameMsOfUtc = (y, mo, d, hh = 0, mi = 0, ss = 0, msec = 0) =>
  daysFromCivil(y, mo, d) * DAY_MS + hh * HOUR_MS + mi * MIN_MS + ss * SEC_MS + msec - UNIX_MS_AT_EPOCH;

/** The UTC calendar at a game time: { year, month 1-12, day, weekday 0 (Monday)-6, doy 1-366, hour, minute, second, msec }. */
export function utc(ms) {
  const u = ms + UNIX_MS_AT_EPOCH;
  const days = Math.floor(u / DAY_MS), inDay = u - days * DAY_MS;
  const [year, month, day] = civilFromDays(days);
  return {
    year, month, day,
    weekday: ((days + 3) % 7 + 7) % 7,                             // (1970-01-01 was a Thursday)
    doy: days - daysFromCivil(year, 1, 1) + 1,
    hour: Math.floor(inDay / HOUR_MS), minute: Math.floor(inDay / MIN_MS) % 60,
    second: Math.floor(inDay / SEC_MS) % 60, msec: inDay % SEC_MS,
  };
}

/** Whether a year is a Gregorian leap year. */
export const isLeapYear = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

// ---- Julian dates and the Mars Sol Date ----

/** The Julian Date (UTC) of a game time. */
export const jdUtc = (ms) => (ms + UNIX_MS_AT_EPOCH) / DAY_MS + 2440587.5;
/** The Julian Date in Terrestrial Time of a game time (TT - UTC held at TT_MINUS_UTC_S). */
export const jdTT = (ms) => jdUtc(ms) + TT_MINUS_UTC_S / 86400;
/** The Mars Sol Date of a Julian Date in TT: Allison and McEwen's relation, as it stands. */
export const msdOfJdTT = (jd) => (jd - MSD_JD_TT_0) / SOL_D;

/** The game's MSD at game time 0 (MSD_EPOCH_MS in sols). */
export const MSD_AT_EPOCH = MSD_EPOCH_MS / SOL_MS;

/** The game's Mars Sol Date: sols of SOL_MS from the integer anchor (see the header). */
export const msd = (ms) => (ms + MSD_EPOCH_MS) / SOL_MS;
/** The formula's Mars Sol Date, for checks: drifts 0.147 ms a sol from msd(). */
export const msdTrue = (ms) => msdOfJdTT(jdTT(ms));
/** Coordinated Mars Time (mean solar time at the prime meridian, Airy-0), in hours 0-24. */
export const mtcHours = (ms) => marsClock(ms, 0).lmstH;

// ---- local sols, in whole milliseconds ----

/** An east longitude as whole milliseconds of a sol, the longitude taken in [0, 360) (TIME §2.4). */
export function lonMs(lonEDeg) {
  const l = ((lonEDeg % 360) + 360) % 360;
  return Math.round((l / 360) * SOL_MS);
}

/** The local sol (TIME's solIndex) and the ms into it from civil 00:00 (msOfSol), at a game time. */
export function localSol(ms, lonEDeg = 0) {
  const t = ms + MSD_EPOCH_MS + lonMs(lonEDeg) - HALF_SLIP_MS, k = Math.floor(t / SOL_MS);
  return { sol: k, msOfSol: t - k * SOL_MS };
}

/** The game time at which the local sol holding ms began (civil 00:00). */
export const solStartMs = (ms, lonEDeg = 0) => ms - localSol(ms, lonEDeg).msOfSol;

/**
 * The Mars local clock at a game time and east longitude (TIME §2.4):
 * { sol (solIndex), msOfSol (from civil 00:00), civilMs, hour 0-24, minute, second, timeslip, slipMs,
 *   lmstH, meanSolarFrac, weekday 0 (Monday)-6 }, and with SETTING's years (yearsOf) also
 * { my, solOfYear, solsInYear, lsDeg }. hour:minute:second is the face: 24:00:00 through the slip.
 */
export function marsClock(ms, lonEDeg = 0, years = null) {
  const { sol, msOfSol } = localSol(ms, lonEDeg);
  const timeslip = msOfSol >= DAY_MS, civilMs = timeslip ? DAY_MS : msOfSol;
  const meanSolarFrac = ((msOfSol + HALF_SLIP_MS) % SOL_MS) / SOL_MS;
  const c = {
    sol, msOfSol, civilMs,
    hour: Math.floor(civilMs / HOUR_MS), minute: Math.floor(civilMs / MIN_MS) % 60, second: Math.floor(civilMs / SEC_MS) % 60,
    timeslip, slipMs: timeslip ? msOfSol - DAY_MS : 0,
    lmstH: meanSolarFrac * 24, meanSolarFrac,
    weekday: weekdayOfSol(sol, years),
  };
  return years ? Object.assign(c, yearOfSol(sol, years), { lsDeg: lsDeg(ms, years) }) : c;
}

/** A local sol's weekday, 0 (Monday) to 6: its number plus SETTING's WEEK_OFFSET (years.weekOffset, 0 without years), mod 7. */
export const weekdayOfSol = (sol, years = null) => (((sol + (years?.weekOffset ?? 0)) % 7) + 7) % 7;

/** The first game time at or after fromMs when the local clock reads hour:minute (hour 0-24; 24:mm is mm minutes into the slip). */
export function msAtMarsTime(fromMs, hour, minute = 0, lonEDeg = 0) {
  const into = hour * HOUR_MS + minute * MIN_MS;
  if (!(into >= 0 && into < SOL_MS)) throw new Error(`no ${hour}:${minute} on a Mars clock`);
  let t = solStartMs(fromMs, lonEDeg) + into;
  if (t < fromMs) t += SOL_MS;
  return t;
}

// ---- the Mars year and the season (SETTING's definitions as a parameter) ----

/**
 * SETTING's year definitions (src/data/setting/calendar.js) in the form the arithmetic takes:
 * { myAtEpoch, startMs (when that year began), yearMs, lsEpochDeg, sol1: { <my>: Airy-0 sol }, weekOffset }.
 */
export function yearsOf({ LS_EPOCH_DEG, MARS_YEAR_MS, MY_AT_EPOCH, MY_SOL1_MSD = {}, WEEK_OFFSET = 0 }) {
  return Object.freeze({
    myAtEpoch: MY_AT_EPOCH, startMs: -Math.round((LS_EPOCH_DEG / 360) * MARS_YEAR_MS), yearMs: MARS_YEAR_MS,
    lsEpochDeg: LS_EPOCH_DEG, sol1: Object.freeze({ ...MY_SOL1_MSD }), weekOffset: WEEK_OFFSET,
  });
}

/** When Mars Year k began (Ls 0), in game time. */
export const myStartMs = (years, k) => years.startMs + (k - years.myAtEpoch) * years.yearMs;
/** Sol 1 of Mars Year k: SETTING's number where it writes one, else the Airy-0 sol holding Ls 0. */
export const sol1Of = (years, k) => years.sol1[k] ?? Math.floor(msd(myStartMs(years, k)));

/** The Mars year of a local sol (solIndex): { my, solOfYear 1-669, solsInYear 668 | 669 }. */
export function yearOfSol(sol, years) {
  let k = years.myAtEpoch + Math.floor((sol - sol1Of(years, years.myAtEpoch)) / (years.yearMs / SOL_MS));
  while (sol1Of(years, k) > sol) k--;
  while (sol1Of(years, k + 1) <= sol) k++;
  const first = sol1Of(years, k);
  return { my: k, solOfYear: sol - first + 1, solsInYear: sol1Of(years, k + 1) - first };
}

/** The Mars year and sol of year at a game time and east longitude. */
export const marsYear = (ms, lonEDeg, years) => yearOfSol(localSol(ms, lonEDeg).sol, years);

/** The areocentric solar longitude Ls in degrees [0, 360): uniform on LONGHAUL's circular orbit (TIME §2.5). */
export const lsDeg = (ms, years) => ((((years.lsEpochDeg + (360 * ms) / years.yearMs) % 360) + 360) % 360);

// ---- in words ----

const pad2 = (n) => String(n).padStart(2, '0');

/** '06:12' on the Mars local clock ('24:00' through the slip). */
export function marsTimeText(ms, lonEDeg = 0) {
  const c = marsClock(ms, lonEDeg);
  return `${pad2(c.hour)}:${pad2(c.minute)}`;
}

/**
 * 'Sol 590 · 12:40' (the sol of the Mars year: years needed), 'Sol 590 · 24:00 +12' twelve minutes
 * into the slip (TIME §3.1), with ' TIMESLIP' after it unless flag is false.
 */
export function solText(ms, lonEDeg, years, { flag = true } = {}) {
  const c = marsClock(ms, lonEDeg, years);
  const slip = c.timeslip ? ` +${Math.floor(c.slipMs / MIN_MS)}` : '';
  return `Sol ${c.solOfYear} · ${pad2(c.hour)}:${pad2(c.minute)}${slip}${flag && c.timeslip ? ' TIMESLIP' : ''}`;
}

/** 'MY 211 Sol 590'. */
export function marsDateText(ms, lonEDeg, years) {
  const y = marsYear(ms, lonEDeg, years);
  return `${MY_LABEL} ${y.my} Sol ${y.solOfYear}`;
}

/** 'Thu 22 Mar 2351 08:00 UTC'. */
export function utcText(ms) {
  const c = utc(ms);
  return `${WEEKDAYS[c.weekday].slice(0, 3)} ${c.day} ${MONTHS[c.month - 1].slice(0, 3)} ${c.year} ${pad2(c.hour)}:${pad2(c.minute)} UTC`;
}

/** '08:00' UTC. */
export function utcClockText(ms) {
  const c = utc(ms);
  return `${pad2(c.hour)}:${pad2(c.minute)}`;
}

/** '2351-03-22T08:00:00Z': for logs and file names. */
export function isoText(ms) {
  const c = utc(ms);
  return `${String(c.year).padStart(4, '0')}-${pad2(c.month)}-${pad2(c.day)}T${pad2(c.hour)}:${pad2(c.minute)}:${pad2(c.second)}Z`;
}
