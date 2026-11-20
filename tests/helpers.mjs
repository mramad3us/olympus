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

/** The sim's tick budget (ms; CLAUDE.md's rule of the code, "the sim stays under 2 ms a tick in the busiest area"): one place from v0.0.21 (was house-live-perf's), read by tick-costs.mjs and F60 (flawless-perf.mjs). */
export const TICK_BUDGET_MS = 2;

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
function refLoop(n = 1e8) { let s = 0; for (let i = 0; i < n; i++) s += i & 7; return s; }
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
/**
 * The machine's factor measured now, not once (v0.0.21, the busiest tick's test: tests/tick-costs.mjs): a shared machine grows
 * slower and faster while a suite runs, so a timing held to a ceiling × k reads k just before and just after its own work; at
 * least machineK(), the process's first measure. { k, ms }.
 */
export function machineNow() {
  let best = Infinity;
  for (let r = 0; r < 3; r++) { const t = performance.now(); refLoop(); best = Math.min(best, performance.now() - t); }
  return { k: Math.max(machineK(), best / REF_LOOP_MS), ms: best };
}

// ---- the runner's honest lines (v0.0.28's stage 0, its build sheet §2 step 3; the hardening lens HD§3) ----
// A quick file's CPU was held to its ceiling × the factor measured once, in the runner's own process, before the pool: three workers
// beside other workflows' load ran each file 7 to 15% slower in CPU (the same files: 342.6 s of CPU at two workers, 399.0 s at three,
// the same hour's load), so the line was red on the neighbours, measured where the work does not run. Now each worker times the
// reference loop before each file in CPU, as the file is measured (workerK: the best of three runs of a third of it, 33 ms in all on a
// quiet machine, so a stray collection after the last file does not read as load; never under 1) and the file's CPU is divided by
// that worker's own factor (cpuNormS); the file's ceiling and the quick suite's sum are judged on the normalised CPU against the
// ceilings themselves (QUICK_FILE_CPU_S, QUICK_SLOW, QUICK_CPU_S, untouched), both figures printed. On a quiet machine every factor is
// 1.00 and nothing changes: the line is held where it was set, the measure only made honest (a file 3% over is red as before). The
// wall limit is judged as the CPU lines are: only while the one-minute load at the run's start and its end is at most half the cores
// (wallJudged), else printed "not judged: the machine busy (load n)" (my call; the release's red at JOBS=7 was this and nothing else).
/**
 * This process's factor now, the best of three runs of a third of the reference loop timed in CPU (≥ 1): a worker's before each file
 * (see above). In CPU, not wall, as the file's own measure is: a core shared by time slices stretches the wall and leaves the CPU
 * (a probe with 30 spinning processes on 15 cores read 1.27 by the wall, 2.6 s of the file's CPU unchanged), while the efficiency
 * cores, where contention moves the work, stretch both. { k, ms } (ms the whole loop's CPU, scaled).
 */
export function workerK() {
  let best = Infinity;
  for (let r = 0; r < 3; r++) { const c = process.cpuUsage(); refLoop(1e8 / 3); const d = process.cpuUsage(c); best = Math.min(best, (d.user + d.system) / 1000); }
  const ms = best * 3;
  return { k: Math.max(1, ms / REF_LOOP_MS), ms };
}
/** A file's CPU normalised by the factor it ran at (s): cpuMs / 1000 / max(1, k). */
export const cpuNormS = (cpuMs, k) => cpuMs / 1000 / Math.max(1, Number(k) || 1);
/** Whether a normalised CPU (s) is over its ceiling (s): the ceilings are the foreground's, never scaled again. */
export const overCeiling = (normS, ceilingS) => normS > ceilingS;
/** Whether the wall limit is judged: the one-minute load at the start and at the end both at most half the cores. */
export const wallJudged = (loadStart, loadEnd, cores) => loadStart <= cores / 2 && loadEnd <= cores / 2;
