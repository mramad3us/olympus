// OLYMPUS data: the parts every ship's deck is built of, the bulkhead hatch first (v0.0.27's stage 0, its build sheet §1 stage 0, §3.0; PLACES §5.1).
//
// A bulkhead hatch is the house's door dressed as a hatch: an opening of kind 'door' with a hatch's leaf (`leaf: 'hatch'`), half a
// second to open or shut, its coaming and its dogs; locked while dogged (`lock`, which src/sim/combat/bundle.js lockedOf reads and
// src/sim/combat/op.js breakOpening undogs; src/sim/places/hatch.js hatchOf reads 'dogged' off it), opening into the compartment
// (`swing.into` 1, rooms[1]), hinged at its low end ('a') or its high end ('b') so the stack stands on its latch side. It lies on a
// line of its deck: a z line (axis 'x', `at` the line's z, a and b its two ends along x) or, from v0.0.27, an x line (axis 'z', `at`
// the line's x, a and b along z: the hauler's lock, whose inner hatch stands in its starboard bulkhead). The Wreck's eight were built
// by a private builder in wreck.js on z lines only; both ships now call this one, the Wreck's passing no axis, so its records are the
// same objects to the key and the byte (tests/ship-seam.test.mjs). Every field but the line, the ends and the rooms is an option:
// the coaming (0.3 m, the Wreck's; the hauler's cabins 0.15 m), the dogs (4), whether it is dogged at the template (true: `lock`), and
// whether the lane's planner may offer it (false for a hatch dogged for good, or one only a scene's own beat opens).
// This module is the builder alone and imports nothing, so a ship's data (wreck.js, hauler.js) and the registry over them
// (ships.js, which re-exports it) never meet in an import cycle. Data only.

/** A bulkhead hatch's width, its coaming and its dogs, by default (the Wreck's: the play lens of v0.0.25 §5). */
export const HATCH_W_M = 0.8, COAMING_M = 0.3, HATCH_DOGS = 4;

/**
 * A bulkhead hatch (see the header): id, the line it stands on (`wall`, a z for axis 'x', an x for axis 'z'), its two ends along
 * that line [a, b], its rooms [the side it is worked from, the compartment]; options { axis = 'x', hinge = 'a', coamingM, dogs,
 * dogged = true, offered = true }. The record's keys are in the Wreck's order, so a call with its arguments is its old record.
 */
export function hatch(id, wall, [a, b], rooms, { axis = 'x', hinge = 'a', coamingM = COAMING_M, dogs = HATCH_DOGS, dogged = true, offered = true } = {}) {
  return {
    id, kind: 'door', leaf: 'hatch', openS: 0.5, closeS: 0.5,
    axis, at: wall, a, b, rooms: [...rooms], state: 'closed', swing: { hinge, into: 1 },
    lock: dogged, dogs, coamingM, ...(offered ? {} : { offered: false }),
  };
}
