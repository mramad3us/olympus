// OLYMPUS tests: v0.0.25's gauges as data, frozen at stage 0 (the build sheet v0.0.25 §0 item 15, §2 step 5, §8), the lead's.
//
// v0.0.24 ended at F123 (tests/house-done.mjs GAUGE_LAST 123, its 375 rows; its sixth role's picks carry no gauge, so no F124),
// so the sheet's numbers stand as written: "Hold to hold" and the carried fixes are F124 to F137, house-done's group P.
// WRECK_GAUGES is that table, one row a gauge: { F, what, files (their homes under tests/: the suites or the flawless file that
// enforce it, most of them the roles' new suites, so not there at stage 0), owner (the role or roles), when ('at once', or the
// ship rule it waits on) }. tests/house-done.mjs keeps GAUGE_LAST at 123 through the round (its rows are contiguous) and D, the
// last merge, raises it to 137 with every row homed in GAUGE_HOMES and GAUGE_WHAT; until then this was the one list of the round's
// gauges, and from D's merge (done) it is a filter of house-done's rows (as tests/void-done.mjs is for v0.0.24), never a second
// list of the same gauges. Pure data.

/** The round's first and last gauge (the sheet's, unshifted: v0.0.24 took none past F123). */
export const WRECK_FIRST = 124, WRECK_LAST = 137;

import { GAUGE_HOMES, GAUGE_WHAT } from './house-done.mjs';

/** v0.0.25's gauges, F124 to F137 (see the header; the sheet's §8, its thresholds there): house-done's rows, filtered. */
export const WRECK_GAUGES = Object.freeze(GAUGE_HOMES.filter(h => h.from >= WRECK_FIRST && h.to <= WRECK_LAST).map(h => Object.freeze({
  F: `F${h.from}`, what: GAUGE_WHAT[`F${h.from}`], files: Object.freeze((h.files ?? h.file).split(', ')), owner: h.owner ?? h.role, when: h.when ?? 'at once',
})));
