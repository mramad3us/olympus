// OLYMPUS core: hashes, for seeds and for cosmetic choices.
//
// Two jobs, both deterministic and free of any state:
//
// 1. Seeds. A thing generated from a seed of its own (a site's room from the site's seed and the
//    room's index, a passer-by from theirs) takes its numbers from hash(...parts), so it comes out
//    the same whatever else was rolled before. rng.js stream(...parts) builds a dice stream on it.
// 2. Cosmetic choices. Which of three lines the instinct says, which poster hangs in the corridor,
//    which way a crowd extra looks: these must never move the game's dice, so they come from
//    hash01(...parts) or hashPick(list, ...parts), never from the rng (tradecraft's rule, acts.js
//    say1(): "the instinct mustn't move the game's rolls").
//
// hash() is tradecraft's FNV-1a over the parts' text (src/sim/rng.js), kept bit for bit so a seed
// recipe ported from there gives the same numbers here. A number part is written as its low and
// high 32-bit words, so 1 and 4294967297 differ; a fraction is cut to its whole part first, so
// pass whole numbers (an index, a sol, a millisecond), not metres.
//
// digest(text) is a 53-bit hash of a long string (cyrb53), printed as 14 hex digits: the golden
// hash of a generated site or a save, for tests that pin generation (tradecraft's PRINT_HASH idea).

/** A 32-bit hash of numbers and strings, for deriving seeds. */
export function hash(...parts) {
  let h = 0x811c9dc5;
  for (const p of parts) {
    const s = typeof p === 'number' ? String(p >>> 0) + '#' + String(Math.floor(p / 4294967296)) : String(p);
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
    h = Math.imul(h ^ 0x7c, 0x01000193);                          // (a separator, so ('ab','c') and ('a','bc') differ)
  }
  return h >>> 0;
}

/** A number in [0, 1) from a hash of the parts: a cosmetic choice that never touches the dice. */
export const hash01 = (...parts) => hash(...parts) / 4294967296;

/** A whole number 0 … n-1 from a hash of the parts. */
export const hashInt = (n, ...parts) => Math.floor(hash01(...parts) * n);

/** An item of a list, chosen by a hash of the parts (the same parts, the same item). */
export const hashPick = (list, ...parts) => list[hashInt(list.length, ...parts)];

/** A 53-bit hash of a string as 14 hex digits (cyrb53): golden hashes of saves and generated places. */
export function digest(text) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const n = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return n.toString(16).padStart(14, '0');
}
