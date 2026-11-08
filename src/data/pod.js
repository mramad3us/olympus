// OLYMPUS data: the night's Plan of the Day at Base Melas, as far as this round lives it: taps, reveille and the weekly alert drill (TIME §9.2, §9.5; the build sheet 0.0.4 §2.2.4).
//
// The Plan of the Day is the site's (PLACES §1.2: a site record's `routine` names a row of ROUTINES,
// ROADMAP "anywhere"'s step 3): Melas's taps at 22:00, reveille at 05:30 on a training sol and 07:00
// on Saturday and Sunday, the holiday routine (TIME §9.2's week), its hours on the site's own clock.
// The base's lamps read the same row (src/sim/places/light.js, by the site's lighting regime), so the
// bay's lights and the calls agree to the second; src/data/places/sky.js TIMES is a view of it. The alert drill is the
// standby's weekly unannounced drill (TIME §9.2, CAREER §5.2) and an A interrupt (TIME §7.1's "base
// alert"; the sheet §8, item 3): which night of the week, and which minute of it, are drawn from the
// world's seed (the user, 2026-11-05: "events and world politics, assignments, opportunities, mission
// details are all procedural"), inside ALERT_DRILL's window, 00:30 to 04:30, so the slip (24:00 to
// 24:39:35) lies inside the night and the squad is asleep (TIME §9.2's 22:00 to 05:00 cut: the
// sheet §8, item 2). The drill musters the squad at their racks' feet in utilities (the sheet §8,
// item 4: nobody leaves the bay this round, so nobody pops): the count is due 5 minutes after the
// klaxon (the review of v0.0.4, my call: at 10 the scramble had no tension; with the hurried dress,
// src/data/activities.js DRESS_HURRY_K, up and dressed takes under three minutes, the head still fits
// and a stall or a shower makes you late), the stand-down 30 minutes after it; the klaxon sounds for 45 s from a horn in hall-2 of
// Echo's first floor, which the stage draws as a red beacon and the audio sounds from (the sheet §8,
// item 23; my calls). The lateness classes are TIME §9.5's, from the due time: an alarm has no early
// class, and a marine not mustered by the stand-down has missed it (the sheet §8, item 5).
const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };

/**
 * The Plans of the Day by id (a site's `routine`): reveilleH on a working day, reveilleHolidayH on a
 * holiday, tapsH, decimal hours on the site's clock; holidays the weekdays of the holiday routine
 * (Monday 0: Saturday and Sunday).
 */
export const ROUTINES = deepFreeze({
  melas: { word: 'Base Melas\'s Plan of the Day', reveilleH: 5.5, reveilleHolidayH: 7.0, tapsH: 22.0, holidays: [5, 6] },
});

/** Reveille on a training sol at Melas, civil hours (CONTRACTS §4): ROUTINES.melas's. */
export const REVEILLE_H = ROUTINES.melas.reveilleH;
/** Reveille on Saturday and Sunday at Melas, the holiday routine (TIME §9.2). */
export const REVEILLE_HOLIDAY_H = ROUTINES.melas.reveilleHolidayH;
/** Taps at Melas: lights out (TIME §9.2). */
export const TAPS_H = ROUTINES.melas.tapsH;
/** The squad stands at their racks' feet in PT kit this long after reveille, until the muster (05:40: TIME §9.2), ms. */
export const REVEILLE_STAND_MS = 600_000;

/** The weekly alert drill (see the header): one a standby week, between fromH and toH, its count due and stand-down after the klaxon. */
export const ALERT_DRILL = Object.freeze({
  perWeek: 1, fromH: 0.5, toH: 4.5, dueMs: 300_000, endMs: 1_800_000, klaxonMs: 45_000,
  horn: Object.freeze({ area: 'melas.echo.1', x: 57.7, z: 8.8 }),
});
/** The klaxon's whoop: on and off by this period while it sounds (the audio's cycle, the beacon's), ms. */
export const KLAXON_CYCLE_MS = 1_500;
/** Mustered: standing this close to one's rack's foot (TIME §9.5's arrival, cut to a rack), metres. */
export const MUSTER_M = 0.6;

/** TIME §9.5's classes by lateness after the due time: [up to ms, class], in order; past the last, or never, 'missed'. */
export const LATE_CLASSES = Object.freeze([[0, 'on-time'], [120_000, 'late-minor'], [600_000, 'late'], [1_800_000, 'very-late']].map(r => Object.freeze(r)));

/** The night's lines (TIME §8.8's voice). */
export const POD_LINES = Object.freeze({
  taps: 'Taps. Lights out.',
  reveille: 'Reveille. Lights.',
  alert: 'Klaxon. Alert drill: utilities, the foot of your rack.',
  count: 'The squad leader counts the bay.',
  standDown: 'Stand down.',
});
