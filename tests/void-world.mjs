// OLYMPUS tests: the drill in free fall, a steel copy of house 1 off the range (the build sheet v0.0.24 §1 A, §0 item 26; AW§6's V5, F105).
//
// The Wheel spins at 1 G and the house is its own, so the house in free fall is gauged on a copy, never a scene (AW risk 7):
// voidWorld(opts) is tests/cqb-world.mjs cqbWorld (house 1 at GO, handed off the range: an operation open on its area, src/sim/
// combat/op.js openOp, your #2 its team), with the live environment set to a coasting deck (&env=ship-coast's preset, 0 G, the
// Martian indoor air: src/sim/places/env.js setLiveEnv) and every floor of the area laid in the void's steel, SURFACES.plateGrid
// (the live environment's `surface`, which src/sim/places/model.js surfaceAt reads for every cell of the live area: v0.0.24's
// seam, absent on every shipped scene). With `boots` the team wears mag boots (src/sim/arms/kit.js wear 'mb-1') and with `lock`
// they are locked (src/sim/body/footing.js setAnchor 'boots'), so the legs push on the boots' grip μ (m g + 300 N) and walk at
// BODY §16.6's 0.5 m/s. coastHouse(opts) is the shoot house's lane itself under &env=ship-coast (the house's own concrete, no boots
// issued): the stall AW measured (4.0 m walked, every room "passed" at 500 s, nothing said), which footing.js noFootingWhy now says.
// The worlds' memory is plain data on the actors and the state, so a save carries them.
import { cqbWorld } from './cqb-world.mjs';
import { createGame } from './game.mjs';
import { setLiveEnv } from '../src/sim/places/env.js';
import { wear } from '../src/sim/arms/kit.js';
import { setAnchor } from '../src/sim/body/footing.js';

/** The void's preset and its steel (see the header). */
export const VOID_PRESET = 'ship-coast', VOID_SURFACE = 'plateGrid';

/** The live area laid in steel on a coasting deck (see the header): the live environment set, its deck the void's plate. */
export function steelDeck(state, { preset = VOID_PRESET, surface = VOID_SURFACE } = {}) {
  setLiveEnv(state, { preset });
  if (surface) state.places.live.env.surface = surface;
  return state.places.live.env;
}

/** Mag boots on a person, locked where `lock` (see the header): { id, locked }. */
export function bootUp(state, pid, { lock = true } = {}) {
  const id = state.people[pid].kit.worn.boots ?? wear(state, pid, 'mb-1');
  const r = lock ? setAnchor(state, pid, 'boots') : { ok: false };
  return { id, locked: r.ok };
}

/**
 * The steel copy of house 1 (see the header). opts: cqbWorld's ({ seed, tier, two, rooms }) and { boots (true), lock (true),
 * steel (true: the plate; false: the house's own concrete under 0 G) }. Returns cqbWorld's record and { boots: { [pid]: locked } }.
 */
export function voidWorld({ seed = 48213, tier = 'sgt', two = true, rooms = null, boots = true, lock = true, steel = true } = {}) {
  const w = cqbWorld({ seed, tier, two, rooms });
  steelDeck(w.s, { surface: steel ? VOID_SURFACE : null });
  const team = [w.pid, ...(w.twoPid ? [w.twoPid] : [])], locked = {};
  if (boots) for (const pid of team) locked[pid] = bootUp(w.s, pid, { lock }).locked;
  return { ...w, boots: locked };
}

/** The shoot house's lane under &env=ship-coast (see the header): the real fill, its kit as issued, no boots. */
export function coastHouse({ seed = 48213, tier = 'sgt', setup = 'go' } = {}) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup, env: VOID_PRESET });
  return { g, s: g.state, pid: g.state.player.id };
}
