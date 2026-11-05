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
