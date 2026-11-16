// OLYMPUS tests: the live lane for the role-players' suites (opfor-brain, opfor-fire): test-shoothouse with stands 2a and 3a made role-players by src/sim/scenarios/opfor.js, run by the house's own hooks once they exist, else by this fixture's (the build sheet v0.0.19 §1: "test against your own stub of another role's module until that role merges").
//
// liveGame(opts) makes the real headless game of test-shoothouse on a seed, a sheet and a setup ('room:2' by default: room 1
// cleared, you and your #2 stacked on room 2's pull door, GO given) with &opfor= (opts.opfor, 'live' by default). Where the house
// already fills and ticks the role-players (shoothouse.js's live hooks, the house role's: R.house.live there at the fill) the game
// is returned as it is (hooked: true). Until then (hooked: false) it is made with the weapons domain's actors layer wrapped, so
// that after the house's own actors (the #2, the instructor) each lived tick on the house course, GO given and the lane not over:
//   1. every hit on a role-player's record (T.hits, which shoothouse.js houseShot writes as for any stand) is handed to opfor.js
//      opforHit, with the shot as its record names it ({ id: shotId, fired, who: you or your #2, atMs }), each tick (opforHit
//      counts a round once, by the shots its record has taken, so a save made between two ticks carries on exactly);
//   2. opfor.js opforTick runs, as the house's actors layer will run it after twoTick (the build sheet §3.3's tick order).
// and fillOpfor is called on the filled game, its people, kits and items the last of the fill as the house's will be. What the
// house role adds and this fixture does not (the 'casualty' lane end, the clear gate's live reasons, houseShot's live branch
// keeping him from the turn-away): the suites that read them say so in a printed note when hooked is false.
// runTo(g, pred, input, max) steps until pred(state); liveOf(g) the house's R.house.live; rp(g, stand) a role-player's record.
import { createGame } from './game.mjs';
import { weaponsDomain } from '../src/sim/arms/domain.js';
import { fillOpfor, opforTick, opforHit } from '../src/sim/scenarios/opfor.js';

const houseOfS = (s) => (s.armoury?.range?.course === 'house' ? s.armoury.range.house ?? null : null);

// (the weapons domain with the role-players' two hooks after the house's actors (see the header))
function hookedWeapons() {
  const actors = (s, i, b, c) => {
    weaponsDomain.fast.actors(s, i, b, c);
    const R = s.armoury?.range, H = houseOfS(s);
    if (!H?.live || R.end || s.skip || H.goAtMs === null) return;
    // (opforHit counts a round once, by its record's shots taken, so every hit is handed every tick and a save carries on exactly)
    for (const T of R.turners) if (T.live) for (const h of T.hits) opforHit(s, b, T, { id: h.shotId, fired: true, who: h.by === 'two' ? H.twoPid : s.player.id, atMs: h.atMs });
    opforTick(s, b, R, H, s.clock.ms);
  };
  return Object.freeze({ ...weaponsDomain, fast: Object.freeze({ ...weaponsDomain.fast, actors }) });
}

let HOOKED = null;
/** Whether the house fills the role-players itself (its live hooks merged): asked once a process, of a game made with &opfor=live. */
export function houseHooked() { return (HOOKED ??= !!houseOfS(createGame({ scenario: 'test-shoothouse', seed: 1, opfor: 'live' }).state)?.live); }

/** The fixture (see the header): { g, s, R, H, hooked, fill, again } (again: a game made as this one, for a save to be loaded into). opts: { seed, tier, setup, opfor, loadout, strict }. */
export function liveGame({ seed = 48213, tier = 'sgt', setup = 'room:2', opfor = 'live', loadout = null, strict = true } = {}) {
  const base = { scenario: 'test-shoothouse', seed, tier, setup, strict, ...(loadout ? { loadout } : {}) };
  if (houseHooked()) { const g0 = createGame({ ...base, opfor }), s = g0.state; return { g: g0, s, R: s.armoury.range, H: houseOfS(s), hooked: true, fill: null, again: () => createGame({ ...base, opfor }) }; }
  const domains = { weapons: hookedWeapons() }, g = createGame({ ...base, domains }), s = g.state, H = houseOfS(s);
  const fill = fillOpfor(s, H, opfor);
  return { g, s, R: s.armoury.range, H, hooked: false, fill, again: () => createGame({ ...base, domains }) };
}

/** Step until pred(state) (checked after each tick), at most max ticks; the input a snapshot or a bot. Returns the ticks stepped. */
export function runTo(g, pred, input = {}, max = 2000) {
  let n = 0;
  while (n < max && !pred(g.state)) { g.step(1, input); n++; }
  return n;
}
/** The house's live record. */
export const liveOf = (g) => houseOfS(g.state)?.live ?? null;
/** A role-player's turner record by his stand ('2a' or '3a'). */
export const rp = (g, stand) => g.state.armoury.range.turners.find(T => T.stand === stand && T.live) ?? null;
/** A role-player's actor. */
export const rpActor = (g, stand) => { const T = rp(g, stand); return T ? g.state.actors.list.find(a => a.who === T.live.who) ?? null : null; };
