// OLYMPUS tests: v0.0.26's gauges as data, frozen at stage 0 (the build sheet v0.0.26 §0 item 22, §2 step 5, §8), the lead's.
//
// v0.0.25 ended at F137 (tests/house-done.mjs GAUGE_LAST 137, its 429 rows; checked on its integrated snapshot 10b699aa: no gauge
// past F137), so the sheet's numbers stand as written: "Bang, then go" and the carried fixes are F138 to F149, house-done's group Q.
// BREACH_GAUGES is that table, one row a gauge: { F, what, files (their homes under tests/: the suites that enforce it, the roles'
// new suites, so not there at stage 0), owner (the role or roles), when ('at once', or the ship rule it waits on) }.
// tests/house-done.mjs kept GAUGE_LAST at 137 through the round (its rows are contiguous; GAUGE_ROUNDS already named F138 to F149
// v0.0.26's) and C, the last merge, raised it to 149 with every row homed in GAUGE_HOMES and GAUGE_WHAT; until then this was the one
// list of the round's gauges, and from C's merge (done) it is a filter of house-done's rows (as tests/wreck-done.mjs is for v0.0.25),
// never a second list of the same gauges. Pure data.

/** The round's first and last gauge (the sheet's, unshifted: v0.0.25 took none past F137). */
export const BREACH_FIRST = 138, BREACH_LAST = 149;

import { GAUGE_HOMES, GAUGE_WHAT } from './house-done.mjs';

/** v0.0.26's gauges, F138 to F149 (see the header; the sheet's §8, its thresholds there): house-done's rows, filtered (homed at C's merge). */
export const BREACH_GAUGES = Object.freeze(GAUGE_HOMES.filter(h => h.from >= BREACH_FIRST && h.to <= BREACH_LAST).map(h => Object.freeze({
  F: `F${h.from}`, what: GAUGE_WHAT[`F${h.from}`], files: Object.freeze((h.files ?? h.file).split(', ')), owner: h.owner ?? h.role, when: h.when ?? 'at once',
})));
