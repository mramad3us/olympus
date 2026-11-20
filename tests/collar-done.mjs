// OLYMPUS tests: v0.0.27's gauges as data, frozen at stage 0 (the build sheet v0.0.27 §0 item 26, §2 step 9, §8), the lead's.
//
// v0.0.26 ended at F149 (tests/house-done.mjs GAUGE_LAST 149, GAUGE_ROUNDS' last row { from: 138, to: 149, v: 'v0.0.26' }; checked on its
// integrated snapshot a49eac55: no gauge past F149), so the sheet's numbers stand as written: "Away the boarding party" and the carried
// items are F150 to F169, house-done's group R. COLLAR_GAUGES is that table, one row a gauge: { F, what, files (their homes under tests/:
// the suites that enforce it, the roles' new suites, so not there at stage 0), owner (the role or roles), when ('at once', or the ship
// rule it waits on) }. tests/house-done.mjs keeps GAUGE_LAST at 149 through the round (its rows are contiguous; GAUGE_ROUNDS already
// names F150 to F169 v0.0.27's) and the lead raises it to 169 at E's merge, the round's last, with every row homed in GAUGE_HOMES and
// GAUGE_WHAT; until then this was the one list of the round's gauges, and from E's merge (done by the integration, 2026-11-19) it is a
// filter of house-done's rows (as tests/breach-done.mjs is for v0.0.26), never a second list of the same gauges. Pure data.

/** The round's first and last gauge (the sheet's, unshifted: v0.0.26 took none past F149). */
export const COLLAR_FIRST = 150, COLLAR_LAST = 169;

import { GAUGE_HOMES, GAUGE_WHAT } from './house-done.mjs';

/** v0.0.27's gauges, F150 to F169 (see the header; the sheet's §8, its thresholds there): house-done's rows, filtered (homed at E's merge). */
export const COLLAR_GAUGES = Object.freeze(GAUGE_HOMES.filter(h => h.from >= COLLAR_FIRST && h.to <= COLLAR_LAST).map(h => Object.freeze({
  F: `F${h.from}`, what: GAUGE_WHAT[`F${h.from}`], files: Object.freeze((h.files ?? h.file).split(', ')), owner: h.owner ?? h.role, when: h.when ?? 'at once',
})));
