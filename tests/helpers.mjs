// OLYMPUS test helpers: the few every test file needs, and nothing about the game. Tests print the
// numbers that matter (balance, timings, counts) with fmt, so a run is read, not just counted; the
// assertions carry their evidence in the message. Drivers for the game itself (bots, a range
// shooter, a recruit's day) live in modules of their own beside this one, as tradecraft's do.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// The repository's root, whatever the caller's working directory.
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function assert(cond, msg = 'assertion failed') {
  if (!cond) throw new Error(msg);
}

// Written as !(... <= tol), so a NaN fails it too.
export function near(actual, expected, tol, msg = '') {
  if (!(Math.abs(actual - expected) <= tol)) {
    throw new Error(`${msg} expected ${expected} ± ${tol}, got ${actual}`);
  }
}

export const fmt = (n, d = 1) => Number(n).toFixed(d);

// ---- the machine's speed (0.0.3) ----
// A CPU-time ceiling (CONTRACTS §7's budgets, an A* bench's p95) is the game's on the user's Mac in a
// foreground browser. On macOS a test run from a terminal that sits behind another app (a game in
// front) is in the darwin background band, on the efficiency cores, where the same work takes 3.5 to
// 4 times as long, and it cannot leave the band from inside (tests/run.mjs says so at the start).
// machineK() is how much slower this process runs than that foreground: the best of three runs of a
// fixed loop against REF_LOOP_MS, its time measured in a foreground terminal on the user's Mac (an
// Apple M5 Pro, 2026-11-06: 101 to 114 ms for three times the loop), at least 1. A ceiling × machineK()
// still fails a solve that has grown slower, on any machine; on a quiet foreground one it is the
// ceiling itself.
/** The reference loop's time in a foreground terminal on the user's Mac (ms). */
export const REF_LOOP_MS = 33.7;
let machineKMemo = null;
function refLoop() { let s = 0; for (let i = 0; i < 1e8; i++) s += i & 7; return s; }
/** How much slower this process runs than the user's Mac in the foreground (≥ 1), measured once: { k, ms }. */
export function machine() {
  if (machineKMemo) return machineKMemo;
  let best = Infinity;
  for (let r = 0; r < 3; r++) { const t = performance.now(); refLoop(); best = Math.min(best, performance.now() - t); }
  machineKMemo = Object.freeze({ k: Math.max(1, best / REF_LOOP_MS), ms: best });
  return machineKMemo;
}
/** machine().k: a CPU-time ceiling's factor here. */
export const machineK = () => machine().k;
