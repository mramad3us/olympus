// OLYMPUS tests: a bare state aboard the Patient Mule at 0 G for the boarding round's suites (the build sheet v0.0.27 §2 step 7, §3.0; shared by A, B and C).
//
// boardingWorld(opts) is the live lane's fill at GO as test-shoothouse makes it with its two role-players (opfor 'live': your sheet,
// your #2 on his, both issued and made ready; the cadre's two men drawn and made by opfor.js fillOpfor), then carried aboard the hauler:
// the player's place made the hauler's (src/sim/places/model.js enterSite: the site 'belt-mule', coasting at 0 G, its plate), the two
// men moved to the posts of one compartment (src/data/places/hauler.js HAULER_POSTS: cabin 2's 4a on the deck and 4b on its deckhead by
// default, the bunk room's 3a and 3b with `room: 'bunks'`), their turners re-staked there (stand, room, place, name by HAULER_ROLES),
// every board of house 1 struck from the turners, you and Four (your #2) at that compartment's hatch on its stack (the plan its hatch
// derives: src/sim/combat/derive.js, every offered hatch open), every one of the four on mag boots, locked (tests/void-world.mjs bootUp;
// the deckhead man on his face: footing.js setOnFace), and the operation's record written as the boarding's: R.house.ship 'hauler',
// R.house.boarding (its record: { v, type, code, holes, counts, track, side, collar, fallback, end }), the live ledger's rule 'real'
// (would.js newLedger('real'): realOf true), R.load 'frangible'; your and Four's magazines and chambers frangible, the men's ball.
// It is a world for calling the round's own functions on (A's brain, B's strikes, holes, throws and aid, C's holders): the lane's tick
// reads the ship's plans, which are D's (src/data/places/hauler-plans.js, its merge), so stepping it with g.step waits for D; a role
// that must step a lane before then steps the house's live lane (tests/opfor-world.mjs) with its own record's fields. Options:
// { seed (48213), tier ('sgt'), type ('pirates' | 'smugglers': the record's type only; the men's kit is B's issue), men (1 or 2: one
// leaves the second man off the deck, his post on the Wheel and his turner struck), room ('cabin-2' | 'bunks'), you, four (false: left
// at the Wheel, off the deck) }. Returns { g, s, R, H, pid, twoPid, men: [{ T, pid, actor() }], me(), two(), plan, post(stand) }.
import { createGame } from './game.mjs';
import { bootUp } from './void-world.mjs';
import { enterSite } from '../src/sim/places/model.js';
import { setPost } from '../src/sim/people/staff.js';
import { syncActors } from '../src/sim/people/place.js';
import { setOnFace, setAnchor } from '../src/sim/body/footing.js';
import { derivePlan, geoOf } from '../src/sim/combat/derive.js';
import { sectorOf } from '../src/sim/combat/room.js';
import { newLedger, realOf } from '../src/sim/combat/would.js';
import { ownerOf } from '../src/sim/arms/kit.js';
import { HAULER, HAULER_ID, HAULER_SITE, HAULER_HATCHES, HAULER_POSTS } from '../src/data/places/hauler.js';
import { HAULER_ROLES } from '../src/data/courses.js';

/** The compartments a world can hold two men in, and their posts (HAULER_POSTS' stands). */
export const BOARDING_ROOMS = Object.freeze({ 'cabin-2': Object.freeze(['4a', '4b']), bunks: Object.freeze(['3a', '3b']) });
/** The boarding record's fresh shape (the sheet's §0 item 1). */
export const boardingRecord = (type = 'pirates') => ({ v: 1, type, code: type, holes: [], counts: {}, track: {}, side: null, collar: null, fallback: null, end: null });

const actorOf = (s, pid) => s.actors?.list?.find(a => a.who === pid) ?? null;
const place = (a, [x, z], face = null) => { a.x = x; a.z = z; a.$px = x; a.$pz = z; delete a.path; if (face) a.face = face; };
// (the plan one hatch derives, its area and its parts' rects as the lane reads it)
function planOfHatch(id) {
  const open = HAULER_HATCHES.filter(h => h.offered !== false).map(h => h.id), P = derivePlan(geoOf(HAULER_ID, id, [HAULER_HATCHES.find(h => h.id === id).rooms[1]]), { open });
  return { ...P, area: HAULER_ID, rects: P.parts.map(r => HAULER.rooms.find(x => x.id === r).rect) };
}
// (a person's guns and magazines to one load: every gun and magazine kit.js ownerOf gives him, the chamber with the gun)
function loadAll(s, pid, load) {
  for (const [id, it] of Object.entries(s.items)) {
    if ((it.type !== 'gun' && it.type !== 'mag') || ownerOf(s, id) !== pid) continue;
    it.load = load;
    if (it.type === 'gun' && it.belief?.load) it.belief.load = load;
    if (it.type === 'mag' && it.belief?.kind) it.belief.kind = load;
  }
}

/** The world (see the header). */
export function boardingWorld({ seed = 48213, tier = 'sgt', type = 'pirates', men = 2, room = 'cabin-2', you = true, four = true } = {}) {
  const stands = BOARDING_ROOMS[room];
  if (!stands) throw new Error(`boardingWorld: no room '${room}' (${Object.keys(BOARDING_ROOMS).join(', ')})`);
  if (men !== 1 && men !== 2) throw new Error(`boardingWorld: men ${men} (1 or 2)`);
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'go', opfor: 'live' });
  const s = g.state, R = s.armoury.range, H = R.house, pid = s.player.id, twoPid = H.twoPid;
  const live = R.turners.filter(T => T.live), hatchId = `o:mu:d2:${room}`, plan = planOfHatch(hatchId);
  // (the boarding's record, the ship's, the ledger's rule 'real')
  H.ship = 'hauler'; H.boarding = boardingRecord(type); H.live.would = newLedger('real'); R.load = 'frangible'; R.area = HAULER_ID;
  delete s.$rooms;
  // (aboard: the hauler's site and its one area; the actors made again there from the posts)
  enterSite(s, HAULER_SITE, HAULER_ID);
  const kept = live.slice(0, men), off = live.slice(men);
  kept.forEach((T, i) => {
    const P = HAULER_POSTS.find(p => p.stand === stands[i]), who = T.live.who;
    Object.assign(T, { stand: P.stand, room: P.room, x: P.at[0], z: P.at[1], y: P.onFace === 'deckhead' ? 1.05 : 1.35, name: HAULER_ROLES[P.stand].name, slot: sectorOf(plan, ...P.at) ?? 1 });
    T.live.card = 'fight';
    setPost(s, who, { area: HAULER_ID, x: P.at[0], z: P.at[1], face: 'down', outfit: 'utilities' });
  });
  for (const T of off) setPost(s, T.live.who, { area: 'melas.wheel.s4', x: 0, z: 0, face: 'down' });
  R.turners = kept;
  const [s1, s2] = plan.stack;
  if (four && twoPid) setPost(s, twoPid, { key: 'house-two', area: HAULER_ID, x: s2[0], z: s2[1], face: 'up', outfit: 'combatSuit' });
  else if (twoPid) setPost(s, twoPid, { key: 'house-two', area: 'melas.wheel.s4', x: 0, z: 0, face: 'down', outfit: 'combatSuit' });
  syncActors(s);
  const me = actorOf(s, pid);
  if (you) place(me, s1, 'up');
  // (every one of the four on mag boots, locked; the deckhead man planted on it)
  for (const who of [you ? pid : null, four ? twoPid : null, ...kept.map(T => T.live.who)].filter(Boolean)) bootUp(s, who, { lock: true });
  for (const T of kept) {
    const P = HAULER_POSTS.find(p => p.stand === T.stand), a = actorOf(s, T.live.who);
    place(a, P.at);
    if (P.onFace === 'deckhead') { setOnFace(s, T.live.who, 'deckhead'); setAnchor(s, T.live.who, 'boots'); }
  }
  // (the loads: your and Four's frangible, the men's ball)
  for (const who of [pid, twoPid].filter(Boolean)) loadAll(s, who, 'frangible');
  for (const T of kept) loadAll(s, T.live.who, 'ball');
  if (!realOf(s)) throw new Error('boardingWorld: the ledger is not real');
  return {
    g, s, R, H, pid, twoPid: four ? twoPid : null, plan,
    men: kept.map(T => ({ T, pid: T.live.who, actor: () => actorOf(s, T.live.who) })),
    me: () => actorOf(s, pid), two: () => (four && twoPid ? actorOf(s, twoPid) : null),
    post: (stand) => HAULER_POSTS.find(p => p.stand === stand) ?? null,
  };
}
