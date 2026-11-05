// OLYMPUS core: the one source of randomness.
//
// sfc32 (Chris Doty-Humphrey's small fast counter generator): four 32-bit words of state, kept in
// the game state as plain data, so a save carries the dice exactly where they were and a test can
// seed them. Everything random in the sim draws through these helpers. Nothing in src/sim or
// src/core calls Math.random. Ported from tradecraft (src/sim/rng.js) unchanged in its maths, so
// the same seed gives the same rolls there and here.
//
// Streams. The saved dice are state.rng, a table of named streams: state.rng.main is the game's
// own dice, and a system may keep its own (rngOf(state, 'people'), rngOf(state, 'world')), made on
// first use from the game's seed and the name. A system on its own stream doesn't shift anyone
// else's rolls when its number of draws changes (LONGHAUL's research note: "per-system streams so
// NPC lives don't reshuffle on code changes"). Things generated from a seed of their own (a room
// from its site and index, a passer-by from theirs) must come out the same whatever was rolled
// before: stream(...seeds) makes a fresh, unsaved state from any mix of numbers and strings.
// Cosmetic choices take no dice at all: hash.js hash01() and hashPick().
//
// One caveat for replays across browsers: next(), int(), range(), pick(), chance(), d20(),
// weighted() and shuffle() use only integer maths and one division, which IEEE doubles do the same
// everywhere. normal() uses Math.log, Math.sqrt and Math.cos; the standard lets engines differ in
// the last bit of log and cos, so a value drawn from normal() can differ in its 16th digit between
// Chrome and Firefox. Round it (to a millimetre, a tenth of a degree) before it decides anything.
import { hash } from './hash.js';

export { hash };

/** A fresh sfc32 state for a seed: four words from splitmix32, then a few draws thrown away. */
export function seedRng(seed) {
  let s = seed >>> 0;
  const split = () => {
    s = (s + 0x9e3779b9) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b) >>> 0;
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35) >>> 0;
    return (z ^ (z >>> 16)) >>> 0;
  };
  const r = [split(), split(), split(), split()];
  for (let i = 0; i < 12; i++) next(r);                            // (the first draws of a fresh state are the least mixed)
  return r;
}

/** A stream of its own, from any mix of numbers and strings (not saved: made again from the same seeds). */
export const stream = (...seeds) => seedRng(hash(...seeds));

/**
 * A named stream saved in the state (state.rng[name]), made on first use from the game's seed and
 * the name. 'main' is the game's own dice.
 */
export function rngOf(state, name = 'main') {
  const table = (state.rng ??= {});
  return (table[name] ??= name === 'main' ? seedRng(state.meta.seed) : stream(state.meta.seed, 'rng', name));
}

/** The next number in [0, 1), advancing r (an sfc32 state: [a, b, c, d]). */
export function next(r) {
  let [a, b, c, d] = r;
  const t = (((a + b) >>> 0) + d) >>> 0;
  d = (d + 1) >>> 0;
  a = b ^ (b >>> 9);
  b = (c + (c << 3)) >>> 0;
  c = ((c << 21) | (c >>> 11)) >>> 0;
  c = (c + t) >>> 0;
  r[0] = a >>> 0; r[1] = b; r[2] = c; r[3] = d;
  return t / 4294967296;
}

/** A whole number 0 … n-1. */
export const int = (r, n) => Math.floor(next(r) * n);
/** A whole number lo … hi, both included. */
export const intIn = (r, lo, hi) => lo + int(r, hi - lo + 1);
/** A number in [a, b). */
export const range = (r, a, b) => a + next(r) * (b - a);
/** An item of a list. */
export const pick = (r, arr) => arr[int(r, arr.length)];
/** True with probability p. */
export const chance = (r, p) => next(r) < p;
/** A twenty-sided die: 1 … 20 (tradecraft's checks: d20 + skill + named modifiers against a DC). */
export const d20 = (r) => 1 + int(r, 20);

/** An item from [[item, weight]…], by weight. */
export function weighted(r, pairs) {
  let total = 0;
  for (const [, w] of pairs) total += w;
  let x = next(r) * total;
  for (const [item, w] of pairs) if ((x -= w) < 0) return item;
  return pairs[pairs.length - 1][0];
}

/** A list shuffled in place (Fisher-Yates), and returned. */
export function shuffle(r, arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = int(r, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** A normal deviate (Box-Muller, always two draws). See the header: round it before it decides anything. */
export function normal(r, mean = 0, sd = 1) {
  const u1 = 1 - next(r), u2 = next(r);                            // (u1 in (0, 1]: log(0) never happens)
  return mean + sd * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
