// OLYMPUS ui: the shoot house run's log, kept from GO for the end card's "Export the run" (the build sheet v0.0.20 §1 item 25; card C7).
//
// A run is replayed in node (tests/replay-run.mjs) by loading the save taken at GO and stepping the sim once for every tick the
// page's loop ran from there, with the input that tick received where it held anything and none between. So the log is kept per
// tick, never per poll: the loop polls once a frame, and a frame runs one tick live but up to FF_TICKS_FRAME (40) in a fast-forward
// (the hot wash's, between the lane's end and the range's) on the skip's own input, the poll's skip commands on its first tick only
// (src/core/loop.js ffFrame). A log counted on the polls lost those ticks and stopped the replay short (the C and D review of
// 2026-11-16: 84 inputs over 1,141 calls for a lane of 1,896 ticks). The log is the loop's first fast layer, run while time stands
// still too (stop motion's presses are ticks with the clock held), so it sees each tick's own input and the state as the last tick
// left it: n counts the ticks from GO, never the clock's tick or ms (CLAUDE.md, the runner and the bots: a log keyed on the clock
// loses the presses made while it stands). It must be made before the sim registers its layers (createRunLog checks).
//
// What is logged of an input is what the sim reads (simInput): the keys and the acts. The mouse is never logged: nothing under
// src/sim reads it (a click reaches the sim as an act), and the snapshot always carries it as an object, so a log that kept it held
// every poll as an input and filled RUN_INPUTS_MAX in 20 minutes of stop motion. At the first tick that finds the range ended, the
// save's and the run sheet's digests are taken as they stood, before the scene's end and the card move the clock on; a lane the page
// ticks no more after its end (the card pauses it at once) is digested at the export, as it stands. Page memory only; off the house
// nothing is kept.
import { toJSON } from '../core/state.js';
import { digest } from '../core/hash.js';
import { runSheetOf } from '../sim/scenarios/shoothouse.js';

/** At most this many inputs a run; a fuller log is not offered for export. */
export const RUN_INPUTS_MAX = 24_000;
/** The page's runtime settings the sim reads, never saved: kept beside the log and put back by the replay. */
export const RUN_RUNTIME = Object.freeze(['$cycle', '$panel', '$aid', '$look']);

/** The part of a tick's input the sim reads: the keys and the acts (never the mouse: nothing in src/sim reads it). */
export function simInput(i) {
  if (!i) return null;
  const out = {};
  if (i.mx) out.mx = i.mx;
  if (i.mz) out.mz = i.mz;
  if (i.run) out.run = true;
  if (i.stroll) out.stroll = true;
  if (i.look) out.look = i.look;
  if (i.act?.length) out.act = JSON.parse(JSON.stringify(i.act));
  return out;
}
/** Whether a tick's input holds nothing the sim reads (the mouse is not looked at). */
export const isEmptyInput = (i) => !i || (!i.mx && !i.mz && !i.run && !i.stroll && !i.look && !(i.act?.length));

/** A run's digests as the export carries them: the run sheet's (its JSON) and the save's. */
export const sheetHashOf = (state) => digest(JSON.stringify(runSheetOf(state)));
export const saveDigestOf = (state) => digest(toJSON(state));

/**
 * The log on a loop: registers its fast layer (first, while held) and returns { of(state) → the record or null }. The record:
 * { state, atGo (the save at GO, toJSON), goAtMs, n (ticks from GO), endN, inputs: [{ n, input }], runtime, full, endDigest, endSheet }.
 */
export function createRunLog(loop, { onError = () => {} } = {}) {
  if (loop.layers.some(L => L.layer === 'fast')) throw new Error('the run log is the loop\'s first fast layer: make it before the sim');
  let rec = null;
  // (the state as the last tick left it: the loop counts the tick in clock.seq before its first layer runs, so a save taken here is
  // put back one tick in seq, or a replay from it counts that tick twice and a lane with no tick after its end exports a save one
  // seq ahead of the replay's)
  const asLeft = (s, fn) => { s.clock.seq -= 1; try { return fn(); } finally { s.clock.seq += 1; } };
  function layer(s, input) {
    try {
      const R = s?.armoury?.range, H = R?.course === 'house' ? R.house : null;
      if (!H || H.goAtMs === null || H.goAtMs === undefined) { if (rec && rec.state !== s) rec = null; return; }
      if (!rec || rec.state !== s) {
        try { rec = { state: s, atGo: asLeft(s, () => toJSON(s)), goAtMs: H.goAtMs, n: 0, endN: 0, inputs: [], runtime: Object.fromEntries(RUN_RUNTIME.map(k => [k, s[k] ?? null])), full: false }; }
        catch (e) { onError(e, 'the run log'); rec = { state: s, atGo: null, n: 0, endN: 0, inputs: [], full: true }; }
      }
      if (!R.end) {
        if (!rec.full && !isEmptyInput(input)) { rec.inputs.push({ n: rec.n, input: simInput(input) }); if (rec.inputs.length >= RUN_INPUTS_MAX) rec.full = true; }
        rec.n++;
        rec.endN = rec.n;
      } else if (!rec.endDigest && rec.atGo) {
        // (the lane's end: its save and run sheet as the last tick left them)
        rec.endDigest = asLeft(s, () => saveDigestOf(s));
        rec.endSheet = sheetHashOf(s);
      }
    } catch (e) { onError(e, 'the run log'); }   // (the log never costs the tick it watches)
  }
  loop.register('fast', layer, { name: 'run-log', whileHeld: true });
  return {
    /** The run's log for a state, or null (none kept, the log full, or no save at GO). */
    of: (s) => (rec && rec.state === s && rec.atGo && !rec.full ? rec : null),
    get rec() { return rec; },
  };
}
