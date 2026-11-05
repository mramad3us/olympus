// OLYMPUS data: the calendar's definitions and the start (SETTING §1.3, §3.7, §3.8), as plain frozen data.
//
// SETTING owns the calendar's definitions and the start date; TIME does the arithmetic with them
// (src/core/calendar.js, and TIME's src/sim/time/dates.js when it binds the two); TECH owns only
// the form (correction 11: SETTING's tables live in src/data/setting/). This round carries only
// what the skeleton needs, as SETTING §3.8 writes it: the start (Monday, Sol 590 of MY 211, 12:40
// Melas time, the arrival after the noon meal) and the one site, Base Melas on the floor of Melas
// Chasma at 10.5° S, 287.2° E, 4,500 m below the datum (PLACES §4.1 owns the site; this is its
// record for the clocks). START_MS is the start as game time: 2351-12-19 02:20:00 UTC, 271.76 days
// after LONGHAUL's epoch (SETTING §3.7, CONTRACTS §2), when the Melas clock reads 12:39:34.335;
// 12:40 falls 25.7 s (25.665 s) later (CONTRACTS §3). The year's origin (LS_EPOCH_DEG, MARS_YEAR_MS,
// MY_AT_EPOCH, MY_SOL1_MSD), the civil months and the week (WEEK_OFFSET too) are §3.8's as it writes
// them; TIME's src/sim/time/dates.js binds them to core's arithmetic (src/core/calendar.js yearsOf).

/** Ls at the epoch, degrees: the real mean Ls, so the season and LONGHAUL's planet angle agree (SETTING §3.2). */
export const LS_EPOCH_DEG = 174.0;
/** LONGHAUL's Mars orbital period, 687.1885 days (SETTING §3.2). */
export const MARS_YEAR_MS = 59_373_085_632;
/** The Mars Year at the epoch (Clancy et al. 2000: MY 1 began 1955-04-11; SETTING §3.3). */
export const MY_AT_EPOCH = 211;
/** Sol 1 of each Mars Year as an Airy-0 sol number; later years floor(MSD at each Ls 0 instant) (SETTING §3.3). */
export const MY_SOL1_MSD = Object.freeze({ 211: 169315 });
/** The Republic's civil months (SETTING §3.4): 24 of 28 sols, months 6, 12 and 18 of 27, the last whatever ends the year. */
export const MONTHS = Object.freeze(['Thaw', 'Runoff', 'Furrow', 'Seedfall', 'Sprout', 'Rain', 'Greening', 'Bloom',
  'Longlight', 'Ripening', 'Harvest', 'Gleaning', 'Threshing', 'Dustrise', 'Gale', 'Frostfall',
  'Lamplight', 'Mending', 'Icecap', 'Deepcold', 'Hearth', 'Patience', 'Reckoning', 'Vigil']);
export const MONTH_SOLS = Object.freeze([28, 28, 28, 28, 28, 27, 28, 28, 28, 28, 28, 27, 28, 28, 28, 28, 28, 27, 28, 28, 28, 28, 28, null]);
/** The week's sols, Monday first; MSD 0 was a Monday (SETTING §3.4). */
export const WEEKDAYS = Object.freeze(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
export const WEEK_OFFSET = 0;

/** The start (SETTING §3.7): the local sol index at Melas, the civil time and the site. */
export const START = Object.freeze({ solIndex: 169904, civil: '12:40', site: 'melas' });

/** The sites the clocks know: latitude and east longitude in degrees, altitude in metres (SETTING §3.8). */
export const SITES = Object.freeze({
  melas: Object.freeze({ latDeg: -10.5, lonEDeg: 287.2, altitudeM: -4500 }),
});

/** The start as game time: 2351-12-19 02:20:00 UTC (SETTING §3.7). */
export const START_MS = 23_480_400_000;
