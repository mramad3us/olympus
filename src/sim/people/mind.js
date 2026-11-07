// OLYMPUS people: the accessors of the mind, what a person knows, holds in mind and is taking in (TECH §6.1; PEOPLE §8.8; the build sheet 0.0.8 §2.1, §3.1, §8 item 26).
//
// state.mind is PEOPLE's key (TECH §6.1: { seen, felt, heard, known, map }, filled empty by the people domain).
// Its parts are written and read only through these accessors, so a part's shape has one owner and a save
// carries only what was written: noteMind(state, part, rec) sets a part, mindOf(state, part) reads it (null
// when absent). The contact (COMBAT §25.4.8) is the first part with its own pair: contactOf(state) is
// state.mind.contact or null; noteContact(state, patch) creates it on its first use only ({ n, known,
// pending, last }) and merges the patch, so a game with no contact (a gunless one, test-handling, test-range)
// never has the key and its saves stay byte for byte. Two callers write state.mind.contact, both through noteContact:
// src/sim/combat/contact.js (a sighting, the window, the pause) and src/sim/scenarios/pairs.js (a string's turners
// forgotten at its Standby).
// Pure but noteMind and noteContact, which write the mind.

/** A part of the mind, or null. */
export function mindOf(state, part) { return state?.mind?.[part] ?? null; }

/** Set a part of the mind (the record as given). Returns it. */
export function noteMind(state, part, rec) {
  (state.mind ??= {})[part] = rec;
  return rec;
}

/** The player's contact record (COMBAT §25.4.8: { n, known, pending, last }), or null before the first. */
export function contactOf(state) { return state?.mind?.contact ?? null; }

/** The contact record created on its first use and the patch merged into it. Returns the record. */
export function noteContact(state, patch = {}) {
  const m = (state.mind ??= {});
  const c = (m.contact ??= { n: 0, known: {}, pending: null, last: null });
  Object.assign(c, patch);
  return c;
}
