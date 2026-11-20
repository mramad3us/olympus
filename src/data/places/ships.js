// OLYMPUS data: the ships the shoot house's lane is played aboard, one row a ship (v0.0.27's stage 0, its build sheet §0 item 1, §1 stage 0, §2 step 3, §3.0; SH§4).
//
// v0.0.25 put the house's lane on a second set of authored data, the Wreck at Phobos, selected by one field of the operation
// record, R.house.ship (absent on every house lane: "absent means the house"), and tested that field against the Wreck's name at
// some sixty places in ten modules. A second ship ("Away the boarding party", the Belt hauler) would have doubled every one, so the
// field is now a key into this registry and each of those places reads the row instead. Each branch was one of three kinds:
//   data           what differs ship by ship: the area, the lane's letter, its decks and trunks, its plans, its legs' words, its
//                  sequence and words, the stands' roles and set, its spots, its setups, the card's names, the toast the page shows when
//                  the URL asks for a house option: read as shipOf(H).<field>.
//   void rules     what holds aboard any ship (the boots at MAKE READY, a round's anchor, a deck's "clear!", the float and hatch faults,
//                  the compartment's word): read as !!shipOf(H), as the readers of a truthy R.house.ship already were.
//   a ship's own   the Wreck's cadre in the Shed's gallery who comes aboard at Stop and its yard tug at GO: read off the row's
//                  `staff` ('cadre': the School's cadre; 'leader': the boarding team's own #1, the lane's chief) and `tug`.
// shipOf(H) takes the house's record (or a spec, which carries the same `ship`) and gives its row or null: "on a ship" is
// !!shipOf(H) (the page's src/ui/ship-words.js onShip(state) is a different, older reader of the same fact). The registry is data
// only: src/data imports nothing of src/sim, so a ship's spec in the house's shape is built from its row by
// src/sim/scenes/assemble.js shipSpec(id), memoised a ship. Every row is frozen; each field names its home:
//   id, name ('The Wreck', the paper's), card ('THE WRECK', the card's head), area (its one area's id), lane (the plans' letter: 'W'),
//   decks (n → { n, name, origin, rect }), trunks (its deck hatches, src/sim/places/hatch.js DECK_HATCHES gathers them), plans (its
//   authored plan set), legs (each leg's word, said, entry, deck: courses.js), seq (its sequence: courses.js), words (its chief's book
//   beside HOUSE_CHIEF), roles (stand → { face, trigger, name }: courses.js), set (its stands as authored), spots (start, your #2's,
//   the chief's way in, speakers, plaques), staff, chief (the post that draws the lane's chief, and where he waits), tug, setups
//   (setup → the leg it starts at), dropped (the page's one toast), goal (the picker's line, {who} your #2's name); v0.0.27's cardWords
//   (the boarding's card: courses.js COLLAR_CARD).
// The Wreck's row is v0.0.25's data to the byte (tests/ship-seam.test.mjs holds its pin cells, its scene's digest and a source scan:
// no literal of a ship's name is left outside this file, the ship's own data and the scene's entry).
import { WRECK, WRECK_DECKS, WRECK_TRUNK, WRECK_SET_A, WRECK_SPOTS } from './wreck.js';
import { WRECK_PLANS } from './wreck-plans.js';
import { SEQ_WRECK, WRECK_CHIEF, WRECK_LEGS, WRECK_ROLES, HAULER_ROLES, SEQ_COLLAR, COLLAR_LEADER, COLLAR_CARD, HAULER_LEGS } from '../courses.js';
import { HAULER_PLANS } from './hauler-plans.js';
import { HAULER, HAULER_DECKS, HAULER_SET, HAULER_SPOTS, HAULER_POSTS, HAULER_CREW, HAULER_HOLDERS, HAULER_START } from './hauler.js';

export { hatch, HATCH_W_M, COAMING_M, HATCH_DOGS } from './ship-parts.js';

const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object' && !Object.isFrozen(v)) deepFreeze(v); return Object.freeze(o); };

/** The ships by id (see the header). */
export const SHIPS = deepFreeze({
  wreck: {
    id: 'wreck', name: 'The Wreck', card: 'THE WRECK', area: WRECK.id, lane: 'W', decks: WRECK_DECKS, trunks: [WRECK_TRUNK], plans: WRECK_PLANS,
    legs: WRECK_LEGS, seq: SEQ_WRECK, words: WRECK_CHIEF, roles: WRECK_ROLES, set: WRECK_SET_A, spots: WRECK_SPOTS,
    // (the School's cadre, a staff sergeant of the Void Operations School, in the Shed's gallery: the void site's other area, so no actor of
    // his is made until Stop, when he comes aboard by the lock's inner hatch (shoothouse.js wreckCadre))
    staff: 'cadre', chief: { post: 'phobos-void:cadre', area: 'phobos.void.well-a', x: 0, z: 0, face: 'down' },
    // (the yard tug's pull at GO: its profile is the scene's, scenes.js's test-zerocqb `tug`)
    tug: true, scene: 'test-zerocqb',
    setups: { go: 0, trunk: 2, hold: 2, tug: 2 },
    dropped: 'The Wreck is shot as set, with the standard kit.',
    goal: 'The Wreck at Phobos, in free fall on mag boots, {who} your number two. On GO: the brig, the trunk, the hold. Anchor before you fire.',
  },
  // (the boarding round's stage 0: the Patient Mule's deck 2, "Away the boarding party" (its build sheet §0 items 1, 2, 31, 32, §3.0); D's: its plans
  // (hauler-plans.js: the passage the holders', cabin 1, the bunk room, cabin 2), legs, sequence and words (courses.js HAULER_LEGS,
  // SEQ_COLLAR, COLLAR_LEADER) and setups (at GO with the lock cycled; stacked on cabin 2 with the rest cleared; the fall back called).
  // Its chief is the boarding team's own leader (staff 'leader': the lane's chief drawn from his post, standing at #1's start; chiefWalk
  // none), no tug)
  hauler: {
    id: 'hauler', name: 'The Patient Mule', card: 'THE PATIENT MULE', area: HAULER.id, lane: 'M', decks: HAULER_DECKS, trunks: [], plans: HAULER_PLANS,
    legs: HAULER_LEGS, seq: SEQ_COLLAR, words: COLLAR_LEADER, roles: HAULER_ROLES, set: HAULER_SET, spots: HAULER_SPOTS, posts: HAULER_POSTS, crew: HAULER_CREW, holders: HAULER_HOLDERS,
    staff: 'leader', chief: { post: HAULER_HOLDERS[0].post, area: HAULER.id, x: HAULER_START[0].at[0], z: HAULER_START[0].at[1], face: HAULER_START[0].face },
    tug: null, scene: 'test-collar', cardWords: COLLAR_CARD,
    setups: { go: 0, cabin2: 3, fallback: 3 },
    dropped: 'The Patient Mule is boarded as set.',
    // (D's: the picker's line, three lines at most as the house's (ui-goal-clamp's 170 characters with the longest name): your number, Four's,
    // the way in and the one rule that matters most)
    goal: 'The Patient Mule, coasting; deck 2 never answered. You are three, {who} four: the lock, then the deck. The crew are not targets.',
  },
});

/** A house record's (or a spec's) ship: its SHIPS row, or null on the house (see the header). */
export const shipOf = (H) => (typeof H?.ship === 'string' && Object.hasOwn(SHIPS, H.ship) ? SHIPS[H.ship] : null);
/** The ship whose plans carry a lane letter ('W' the Wreck's), or null. */
export const shipOfLane = (lane) => Object.values(SHIPS).find(S => S.lane === lane) ?? null;
/** The ship whose area an id is, or null. */
export const shipOfArea = (areaId) => Object.values(SHIPS).find(S => S.area === areaId) ?? null;
/**
 * Which of a ship's decks a point of its plan is on: the deck whose origin is nearest along x, the first of two as near (the Wreck's
 * deck 5 before its 6, as v0.0.25's wreckDeckAt), or null for an id the registry lacks. The one test of which deck (scenes/assemble.js,
 * combat/two.js and bundle.js, the lane's rules).
 */
export function shipDeckAt(id, x) {
  let best = null, bestD = Infinity;
  for (const d of Object.values(shipOf({ ship: id })?.decks ?? {})) { const dx = Math.abs(x - d.origin[0]); if (dx < bestD) { best = d.n; bestD = dx; } }
  return best;
}
