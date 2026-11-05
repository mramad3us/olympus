// OLYMPUS core: rounding a number to the resolution of its quantity, before it is saved or compared.
//
// Chrome's V8 and node's are different versions, and the standard lets engines differ in the last
// bit of Math.exp, Math.log, Math.pow and the trigonometric functions (TECH §8.1, rule 11). A
// transcendental result that went straight into the save would then differ between the page and a
// node replay by an ulp, and the digests would part. So every such result is rounded to its
// quantity's resolution first (1e-4 m for a position, 1 Pa, 0.1 mm, 1e-6 rad: each owner names its
// own in its module header), and an ulp's difference almost never survives the rounding.
//
// q(x, step): for a step of 1 or less, k = round(1 / step) and the result is round(x × k) / k, so
// q(0.1 + 0.2, 0.1) is exactly 0.3 (dividing by k, not multiplying by step, gives the nearest double
// to the decimal); for a step over 1, round(x / step) × step. Negative zero becomes zero, since the
// canonical save writes -0 as 0 and a value must read the same before and after a load.

/** x rounded to the nearest multiple of step (see the header). */
export function q(x, step) {
  if (!(step > 0)) throw new Error(`q(): a step must be a positive number, not ${step}`);
  let r;
  if (step <= 1) { const k = Math.round(1 / step); r = Math.round(x * k) / k; }
  else r = Math.round(x / step) * step;
  return r === 0 ? 0 : r;                                          // (-0 becomes 0)
}
