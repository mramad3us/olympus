// OLYMPUS tests: v0.0.28's gauges as data, frozen at stage 0 (the build sheet v0.0.28 §0 item 16, §0 item 24, §2 step 6, §8), the lead's.
//
// v0.0.27 ended at F169 (tests/house-done.mjs GAUGE_LAST 169, GAUGE_ROUNDS' last row { from: 150, to: 169, v: 'v0.0.27' }; checked on its
// integrated snapshot c805e72f: no gauge past F169), so the sheet's numbers stand as written: "The window and the canopy" is F170 to
// F188, house-done's group S (the armoury lens's F170 to F182, the upkeep lens's F183 to F186, the ground and the look's F187 and F188).
// ARMOURY_GAUGES is that table, one row a gauge: { F, what, files (their homes under tests/: the suites that enforce it, mostly the
// roles' new suites, so not there at stage 0), owner (the role or roles), when ('at once', or the ship rule it waits on) }.
// tests/house-done.mjs keeps GAUGE_LAST at 169 through the round (its rows are contiguous, v0.0.24 §0 item 29; GAUGE_ROUNDS already names
// F170 to F188 v0.0.28's) and the lead raises it to 188 at B's merge, the round's last, with every row homed in GAUGE_HOMES and
// GAUGE_WHAT; until then this was the one list of the round's gauges, and from B's merge (done by the integration, 2026-11-20) it is a
// filter of house-done's rows (as tests/collar-done.mjs is for v0.0.27), never a second list of the same gauges. The gauges the round closes (F4, F44 through F80, F73,
// F129, F132, F169) are numbered already: closed, never renumbered. Pure data.

/** The round's first and last gauge (the sheet's, unshifted: v0.0.27 took none past F169). */
export const ARMOURY_FIRST = 170, ARMOURY_LAST = 188;

import { GAUGE_HOMES, GAUGE_WHAT } from './house-done.mjs';

/** v0.0.28's gauges, F170 to F188 (see the header; the sheet's §8, its thresholds there): house-done's rows, filtered (homed at B's merge). */
export const ARMOURY_GAUGES = Object.freeze(GAUGE_HOMES.filter(h => h.from >= ARMOURY_FIRST && h.to <= ARMOURY_LAST).map(h => Object.freeze({
  F: `F${h.from}`, what: GAUGE_WHAT[`F${h.from}`], files: Object.freeze((h.files ?? h.file).split(', ')), owner: h.owner ?? h.role, when: h.when ?? 'at once',
})));
