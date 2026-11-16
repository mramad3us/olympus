// OLYMPUS core: the read scope's guard and counters (the build sheet v0.0.21 §1 item 13; perf lens P1).
//
// The busiest ticks of the house were the step panel built two to four times over one evaluation (the instinct's two
// rule sets, the row chosen, the page) and the body deep-copied from its template forty to a hundred times for one stop. The
// read scope is a runtime Map on the state, `state.$reads`, opened by the instinct around its evaluation and by stepsOf when
// none is open, closed in a `finally`; inside it stepsOf is built once per ms and bodyOf once per person and ms. Only two
// modules write `state.$reads` (src/sim/skills/instinct.js and src/sim/arms/shooting.js: a source scan in
// tests/syntax.test.mjs), and nothing inside a scope writes the state: the instinct's `when`, firedNow and the panel are reads.
//
// The scope hands one object to several readers, so a reader that writes into a body record or a panel row would change
// what the next reader sees. The guard: with READS_FREEZE (the environment's READS_FREEZE=1, set by tests/run.mjs for the
// quick suite; never in the page, which has no process) what the scope keeps is frozen (a body record deep, being a fresh
// copy; a panel's array and its rows one level, since a row may point into the state), so such a write throws at once
// (ES modules are strict). BUILT counts the panel's and the run sheet's builds (tests/reads-scope.test.mjs; the page's
// stop-motion counter). Pure but for the counters.

/** Whether the read scope freezes what it keeps (a test switch: READS_FREEZE=1 in node; false in the page). */
export const READS_FREEZE = globalThis.process?.env?.READS_FREEZE === '1';

/** The builds counted since the process started: { steps: the step panel, sheet: the house's run sheet }. */
export const BUILT = { steps: 0, sheet: 0 };

/** A plain record frozen through (arrays and plain objects; a fresh copy only: never a record of the state). */
export function freezeDeep(v) {
  if (v === null || typeof v !== 'object' || Object.isFrozen(v)) return v;
  Object.freeze(v);
  for (const k of Object.keys(v)) freezeDeep(v[k]);
  return v;
}

/** An array and its items frozen one level (a panel's rows: each row's own fields, never what a row points to). */
export function freezeRows(rows) {
  if (!Array.isArray(rows) || Object.isFrozen(rows)) return rows;
  for (const r of rows) if (r && typeof r === 'object') Object.freeze(r);
  return Object.freeze(rows);
}
