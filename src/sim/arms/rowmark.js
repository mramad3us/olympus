// OLYMPUS arms: a planner's mark on a panel row (v0.0.18), in a leaf with no imports.
//
// The planner (plan.js) and the panel (shooting.js stepsOf, specials.js reloadRows) put their marks on the rows they hand the HUD:
// fix (the row the core's Fix names), fixWhy and fixNone (the reason Fix shows on its stand-in), path (a reload's planned
// sub-steps). A mark is kept out of the row's bytes (not enumerable): the HUD, groups.js and the stepper read it off the row
// itself, and every panel a test or a save digests stays v0.0.17's to the byte (supp's v0.0.8 pause). A copy of the row
// ({ ...row }) drops it, and the reader falls back to v0.0.17's rule. It lives here, not in plan.js, so specials.js can mark its
// rows without importing the planner that imports it (the review of v0.0.18: the sheet's "no cycle" did not hold).

/** Mark a row (w: fix, fixWhy, fixNone, path) without adding to its enumerable bytes; returns the row. */
export function markRow(row, key, value) {
  if (row) Object.defineProperty(row, key, { value, enumerable: false, configurable: true, writable: true });
  return row;
}
