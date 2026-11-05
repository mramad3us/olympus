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
// known (and may be abolished), so the offset is frozen there (my call); it moves the Mars clock
// by about a minute at most against any real future one.
//     The game's sol is SOL_MS = 88,775,244 ms (DESIGN.md, Setting), the 1.0274912517 d of the
// formula to the millisecond (88,775,244.147 ms). The game counts sols in that whole number from an
// anchor at the epoch, where its MSD equals the formula's exactly: msd(ms) = MSD at the epoch +
// ms / SOL_MS. So the local clock is exact integer arithmetic (a sol starts on a whole millisecond,
// and the timeslip's edges are exact), and the game's MSD runs 0.147 ms a sol ahead of the formula's:
// 2.6 s over a fifty-year career, 5 s a century. msdTrue(ms) is the formula itself, for checks.
//     Mars24's worked example A: at 2000-01-06 00:00:00 UTC (TT - UTC then 64.184 s) the MSD is
// 44795.99976 and Coordinated Mars Time 23.99424 h; at 2000-01-06 00:00 TT it is 44795.99904. The
// tests check both, and the epoch: MSD 169639.2363 at 2351-03-22 08:00 UTC.
//
// Local mean solar time at an east longitude L is the MSD shifted by L / 360 of a sol: a local sol
// begins at local mean midnight. Longitudes are taken in (-180, 180], so the local sol number is
// Coordinated Mars Time's sol give or take half a sol, like a date line (my call).
//
// The Mars local clock (DESIGN.md, Time: "a 24-hour clock with the 39 m 35 s timeslip after
// midnight (KSR's convention)"): the clock runs in Earth seconds from local mean midnight, so it
// reads 00:00 to 23:59 like any Earth clock, then for the last 39 m 35.244 s of the sol it reads
// 24:00 to 24:39 with a TIMESLIP flag, and the next sol starts at 00:00. Clock noon (12:00) is
// 19 m 47.6 s before mean solar noon; marsClock() gives lmstH, the true mean solar hour, as well.
//
// The Mars year follows Clancy et al. (2000, JGR 105, 9553): MY 1 began at Ls 0 on 1955-04-11.
// The anchor is taken as 1955-04-11 00:00 UTC (the paper gives the day; the hour is my call) and
// the mean year as SOLS_PER_MY = 668.5991 sols. Whole sols are dealt to years: sol 1 of a year is
// the first local sol to begin at or after its start, so years run 668 or 669 sols. 2351 falls in
// MY 211. The numbering lives in marsYear() alone, behind MY_LABEL, so the design (SETTING.md) can
// rename or offset it in one place.
import { SEC_MS, MIN_MS, HOUR_MS, DAY_MS, SOL_MS, EPOCH_UTC } from './clock.js';

export const TT_MINUS_UTC_S = 69.184;                              // 37 s of leap seconds (2017) + 32.184 s
export const MSD_JD_TT_0 = 2405522.0028779;                        // Allison and McEwen (2000)
export const SOL_D = 1.0274912517;                                 // a mean sol in Earth days
export const TIMESLIP_MS = SOL_MS - DAY_MS;                        // 2,375,244 ms: 39 m 35.244 s
export const SOLS_PER_MY = 668.5991;                               // a mean Mars year (Clancy et al. 2000 numbering)
export const MY_LABEL = 'MY';                                      // what the year is called on screen

export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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

/** The formula's MSD at game time 0, where the game's sol count is anchored. */
export const MSD_AT_EPOCH = msdOfJdTT(jdTT(0));

/** The game's Mars Sol Date: sols of SOL_MS since the anchor (see the header). */
export const msd = (ms) => MSD_AT_EPOCH + ms / SOL_MS;
/** The formula's Mars Sol Date, for checks: drifts 0.147 ms a sol from msd(). */
export const msdTrue = (ms) => msdOfJdTT(jdTT(ms));
/** Coordinated Mars Time (mean solar time at the prime meridian, Airy-0), in hours 0-24. */
export const mtcHours = (ms) => marsClock(ms, 0).lmstH;

// ---- local sols, in whole milliseconds ----

/** An east longitude in degrees, as a fraction of a sol in (-1/2, 1/2]. */
function lonShift(lonEDeg) {
  let l = ((lonEDeg % 360) + 360) % 360;
  if (l > 180) l -= 360;
  return l / 360;
}

// (per longitude: the local sol number at game time 0 and how far into it game time 0 falls, in ms;
// a base or two in a game, so the cache stays tiny)
const frames = new Map();
function frameOf(lonEDeg) {
  let f = frames.get(lonEDeg);
  if (!f) {
    const base = MSD_AT_EPOCH + lonShift(lonEDeg);
    let sol0 = Math.floor(base), phaseMs = Math.round((base - sol0) * SOL_MS);
    if (phaseMs >= SOL_MS) { sol0 += 1; phaseMs -= SOL_MS; }
    f = { sol0, phaseMs };
    if (frames.size < 64) frames.set(lonEDeg, f);
  }
  return f;
}

/** The local sol (a whole MSD at that longitude) and the ms into it, at a game time. */
export function localSol(ms, lonEDeg = 0) {
  const { sol0, phaseMs } = frameOf(lonEDeg);
  const t = ms + phaseMs, k = Math.floor(t / SOL_MS);
  return { sol: sol0 + k, msOfSol: t - k * SOL_MS };
}

/** The game time at which the local sol holding ms began (local mean midnight). */
export const solStartMs = (ms, lonEDeg = 0) => ms - localSol(ms, lonEDeg).msOfSol;

/**
 * The Mars local clock at a game time and east longitude:
 * { sol, msOfSol, hour 0-24, minute, second, timeslip, slipMs, lmstH, my, solOfYear, solsInYear }.
 * hour:minute is the clock face (24:00-24:39 in the timeslip); lmstH the mean solar hour, 0-24.
 */
export function marsClock(ms, lonEDeg = 0) {
  const { sol, msOfSol } = localSol(ms, lonEDeg);
  const timeslip = msOfSol >= DAY_MS;
  return {
    sol, msOfSol,
    hour: Math.floor(msOfSol / HOUR_MS), minute: Math.floor(msOfSol / MIN_MS) % 60, second: Math.floor(msOfSol / SEC_MS) % 60,
    timeslip, slipMs: timeslip ? msOfSol - DAY_MS : 0,
    lmstH: (msOfSol / SOL_MS) * 24,
    ...yearOfSol(sol, lonEDeg),
  };
}

/** The first game time at or after fromMs when the local clock reads hour:minute (hour 0-24, 24 in the timeslip). */
export function msAtMarsTime(fromMs, hour, minute = 0, lonEDeg = 0) {
  const into = hour * HOUR_MS + minute * MIN_MS;
  if (!(into >= 0 && into < SOL_MS)) throw new Error(`no ${hour}:${minute} on a Mars clock`);
  let t = solStartMs(fromMs, lonEDeg) + into;
  if (t < fromMs) t += SOL_MS;
  return t;
}

// ---- the Mars year ----

/** The MSD at which MY 1 began (1955-04-11 00:00 UTC), in the game's sol count. */
export const MY1_START_MSD = msd(gameMsOfUtc(1955, 4, 11));

// (the sol a year's first sol is: the first local sol to begin at or after its start)
function yearOfSol(sol, lonEDeg) {
  const base = MY1_START_MSD + lonShift(lonEDeg);
  const first = (n) => Math.ceil(base + (n - 1) * SOLS_PER_MY);
  let n = Math.floor((sol - base) / SOLS_PER_MY) + 1;
  while (first(n) > sol) n--;
  while (first(n + 1) <= sol) n++;
  return { my: n, solOfYear: sol - first(n) + 1, solsInYear: first(n + 1) - first(n) };
}

/** The Mars year and sol of year at a game time and east longitude: { my, solOfYear 1-669, solsInYear 668 | 669 }. */
export const marsYear = (ms, lonEDeg = 0) => yearOfSol(localSol(ms, lonEDeg).sol, lonEDeg);

// ---- in words ----

const pad2 = (n) => String(n).padStart(2, '0');

/** '06:12' on the Mars local clock ('24:12' in the timeslip). */
export function marsTimeText(ms, lonEDeg = 0) {
  const c = marsClock(ms, lonEDeg);
  return `${pad2(c.hour)}:${pad2(c.minute)}`;
}

/** 'Sol 214 · 06:12' (the sol of the Mars year), with ' TIMESLIP' after midnight unless flag is false. */
export function solText(ms, lonEDeg = 0, { flag = true } = {}) {
  const c = marsClock(ms, lonEDeg);
  return `Sol ${c.solOfYear} · ${pad2(c.hour)}:${pad2(c.minute)}${flag && c.timeslip ? ' TIMESLIP' : ''}`;
}

/** 'MY 211 Sol 214'. */
export function marsDateText(ms, lonEDeg = 0) {
  const y = marsYear(ms, lonEDeg);
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
