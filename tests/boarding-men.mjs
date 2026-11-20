// OLYMPUS tests: the boarding's defenders on the hauler's deck for A's suites (v0.0.27, "Away the boarding party": its build sheet §1 A, §6 A; collar-choice, collar-blind, collar-side, carried-v027).
//
// boardingMen(opts) stands on tests/boarding-world.mjs (stage 0's: the live lane's fill carried aboard the Patient Mule at 0 G, the
// record R.house.ship 'hauler' and R.house.boarding written, the ledger 'real', you and Four on the compartment's stack on locked boots)
// and puts the boarding's own men in place of its two role-players, as the scene's fill will (D's testShoothouse hauler branch): the
// role-players' actors struck off the stage, a turner record for each stand of the draw (src/sim/scenarios/opfor.js drawBoarding on the
// seed and the holdouts given, or `stands` forced: the record's code then names exactly those, opfor.js boardingCode's), and opfor.js
// fillOpfor called with the record in place, so every man is drawn (staff.js), sheeted, issued and booted by the fill itself.
// Until D's plans merge the lane cannot be stepped (the house's tick reads them), so the world runs its own small loop over the real
// functions, in the tick's order: tick() moves the clock one TICK_MS, runs opfor.js opforTick (the men's brains, the side) and then
// body/domain.js woundsFast (the bodies' stance, the bleed), as the actors and bodyFast layers do. Its verbs: shoot(stand, opts) a round of
// yours or Four's on a man, the strike written on his record as shoothouse.js houseShot writes it (T.hits) and handed to opfor.js
// opforHit with the bus (the would-have's real branch, B's: on the man's own body); press(stand, pts) points on his pool (supp.js
// addSupp, a 'roomShot'); man(stand) his turner, actor(stand) his actor, run(ms) the loop that long. Options: { seed (48213), tier ('sgt'),
// holdouts ('pirates' | 'smugglers' | null: the seed's), stands (forced: [stand, …], armed and crew as the stand's data says), room
// ('cabin-2' | 'bunks': where you and Four stack), four }. Returns { g, s, R, H, bus, facts, men, tick, run, shoot, press, man, actor }.
import { TICK_MS } from '../src/core/clock.js';
import { boardingWorld } from './boarding-world.mjs';
import { fillOpfor, opforTick, opforHit, drawBoarding, boardingCode } from '../src/sim/scenarios/opfor.js';
import { woundsFast } from '../src/sim/body/domain.js';
import { addSupp } from '../src/sim/combat/supp.js';
import { HAULER_POSTS, HAULER_CREW } from '../src/data/places/hauler.js';
import { HAULER_ROLES } from '../src/data/courses.js';

const ALL = [...HAULER_POSTS, ...HAULER_CREW];
/** The world (see the header). */
export function boardingMen({ seed = 48213, tier = 'sgt', holdouts = null, stands = null, room = 'cabin-2', four = true } = {}) {
  const w = boardingWorld({ seed, tier, room, four });
  const { g, s, R, H } = w, facts = [], bus = { emit: (k, f) => facts.push([k, f]) };
  // (the role-players off the stage)
  const old = new Set(w.men.map(m => m.pid));
  s.actors.list = s.actors.list.filter(a => !old.has(a.who));
  // (the draw: the seed's, or a forced one written as the record's code; opfor.js reads the draw from the record's code and the seed)
  const type = holdouts ?? drawBoarding(seed).type;
  const draw = drawBoarding(seed, { holdouts: stands ? boardingCode(type, stands.filter(st => HAULER_POSTS.some(p => p.stand === st)), stands.filter(st => HAULER_CREW.some(p => p.stand === st))) : type });
  if (stands && Object.keys(draw.stands).sort().join() !== [...stands].sort().join()) throw new Error(`boardingMen: ${type} cannot stand ${stands.join(', ')}`);
  H.boarding.type = draw.type; H.boarding.code = draw.code;
  R.turners = Object.keys(draw.stands).sort().map(stand => {
    const P = ALL.find(p => p.stand === stand);
    return { key: `t:${stand}`, lane: 'M', room: P.room, stand, name: HAULER_ROLES[stand].name, slot: 1, x: P.at[0], z: P.at[1], y: 1.35, face: HAULER_ROLES[stand].face, holds: 'rifle',
      trigger: { kind: 'go', on: null, gapMs: 0 }, turnAtMs: H.goAtMs ?? null, awayAtMs: null, hits: [], stoppedAtMs: null };
  });
  delete H.live;
  fillOpfor(s, H);
  const man = (stand) => R.turners.find(T => T.stand === stand) ?? null;
  const actor = (stand) => { const T = man(stand); return T ? s.actors.list.find(a => a.who === T.live.who) ?? null : null; };
  const tick = () => { s.clock.ms += TICK_MS; opforTick(s, bus, R, H, s.clock.ms); woundsFast(s, null); };
  const run = (ms) => { const n = Math.round(ms / TICK_MS); for (let i = 0; i < n; i++) tick(); };
  let shotN = 0;
  // (a round of a marine's on a man: the strike on his record as houseShot writes it, then opforHit with the bus)
  const shoot = (stand, { zone = 'A', part = 'torso', margin = 4, rangeM = 4, who = w.pid, gunOf = null } = {}) => {
    const T = man(stand), id = `sh:t${++shotN}`, gun = gunOf ?? Object.values(s.items).find(it => it.type === 'gun' && it.model === 'r7')?.id;
    const shot = { id, fired: true, who, atMs: s.clock.ms, part, zone, roll: { margin }, flight: { rangeM }, gun, load: 'frangible' };
    T.hits.push({ shotId: id, by: who === w.pid ? 'me' : 'two', part, zone, atMs: s.clock.ms });
    return opforHit(s, bus, T, shot, s.clock.ms);
  };
  const press = (stand, pts) => { const T = man(stand); addSupp(s, bus, T.live.who, { id: `press:${stand}:${s.clock.ms}`, kind: 'roomShot', pts, atMs: s.clock.ms, why: 'a test' }); };
  return { ...w, bus, facts, draw, man, actor, tick, run, shoot, press, men: R.turners };
}
