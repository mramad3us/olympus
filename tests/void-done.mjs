// OLYMPUS tests: v0.0.24's gauges as data, frozen at stage 0 (the build sheet v0.0.24 §0 items 4 and 29, §2 step 8, §8), the lead's.
//
// The sheet numbered the round's gauges F97 to F120: the anywhere note's V0 to V19 as F97 to F116, in order, and the overhaul's
// four as F117 to F120. v0.0.23 then took F97 to F99 (the P-12's posture record, its stances, the slung rifle's hang: tests/
// house-done.mjs GAUGE_WHAT), so every number of the sheet from F97 up reads three higher here and in every role's code, test and
// handoff: the sheet's F97 is F100, its V(n) is F(n + 100), and the overhaul's are F120 to F123 (GAUGE_LAST 123 at E's merge).
// VOID_GAUGES is that table, one row a gauge: { F, V (the anywhere note's, null for the overhaul's), sheet (the sheet's number),
// what, file (its home under tests/: the suite or the flawless file that enforces it), owner (the role), when ('at once', or the
// ship rule it waits on) }. tests/house-done.mjs kept GAUGE_LAST at 99 through the round (its rows are contiguous) and E raised it
// to 123 with every row homed (E's merge): from then this is a filter of house-done's rows (GAUGE_HOMES' and GAUGE_WHAT's for F100
// to F123), never a second list of the same gauges; VOID_USER is the two scenes' USER rows of its list (group O, D's). Pure data.

/** The sheet's numbers read this many higher (v0.0.23 took F97 to F99). */
export const F_SHIFT = 3;
/** The round's first and last gauge, as shifted. */
export const VOID_FIRST = 100, VOID_LAST = 123;

import { GAUGE_HOMES, GAUGE_WHAT, DONE } from './house-done.mjs';

/** v0.0.24's gauges, F100 to F123 (see the header): house-done's rows, filtered. */
export const VOID_GAUGES = Object.freeze(GAUGE_HOMES.filter(h => h.from >= VOID_FIRST && h.to <= VOID_LAST).map(h => Object.freeze({
  F: `F${h.from}`, V: h.v === null || h.v === undefined ? null : `V${h.v}`, sheet: `F${h.from - F_SHIFT}`, what: GAUGE_WHAT[`F${h.from}`], file: h.files ?? h.file, owner: h.owner ?? h.role, when: h.when ?? 'at once',
})));
/** The two scenes' USER rows of the acceptance list (group O, D's: the user's word on "Anchor before you fire" and "Secure for burn"). */
export const VOID_USER = Object.freeze(DONE.filter(r => r.group === 'O' && r.check?.kind === 'user'));
