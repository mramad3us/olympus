// OLYMPUS people: the people domain, as game.js composes it (TECH §2.5; the 0.0.3 build sheet §2.2), in place of the skeleton's stub.
//
// PEOPLE owns eight of the state's keys (TECH §6.1): player { id, actor, waypoint, presets, keeps },
// people (the id-keyed map of persons, kind 'p'), units (the unit tree and its billets, kind 'unit'),
// happenings, actors { list, area } (the bodies on the live area, and the area they were made for:
// the actors layer's mark, saved so a load carries on with the same actors), mind, talk and names
// (the registry of full names: src/sim/people/names.js). Its id fields beyond those walked by name
// (who, *Id: berthId, spotId, unitId, parentId) are the player's two pointers and the actors' area.
// init fills each key at its empty default (??=: newGame runs it, a load runs it again). It adds to the
// tick the actors layer (TECH §3.1 layer 3: place.js actorsStep, the placed people's poses, changed
// only out of the player's sight) and one slow contributor, 'people:place' (steady, so it never holds a
// skip to minute steps: in a skip it puts every actor at its whereIs at each step's end, TIME §5.9).
// Its actions are still stubs (people: talk and orders, 0.0.10; instinct: the instinct line's
// choices, 0.0.5), routed and doing nothing, as the skeleton's were.
import { fillDomain } from '../../core/state.js';
import { actorsStep, placeSlowStep } from './place.js';

const KEYS = Object.freeze(['player', 'people', 'units', 'happenings', 'actors', 'mind', 'talk', 'names']);
const noop = () => {};

/** The people domain's fill (??=): every key at its empty default, kept where set. */
export function initPeople(state) {
  for (const k of KEYS) fillDomain(state, k);
  state.actors.list ??= [];
  return state;
}

/** The people domain's descriptor (TECH §2.5). */
export const peopleDomain = Object.freeze({
  name: 'people',
  owner: 'PEOPLE',
  keys: KEYS,
  idMaps: Object.freeze({ people: 'p', units: 'unit' }),
  idFields: Object.freeze({ 'player.id': 'p', 'player.actor': 'a', 'actors.area': 'place' }),
  init: initPeople,
  fast: Object.freeze({ actors: actorsStep }),
  slow: Object.freeze([Object.freeze({ name: 'people:place', step: placeSlowStep, steady: () => true })]),
  jobs: Object.freeze({}),
  actions: Object.freeze({ people: noop, instinct: noop }),
  upgrades: Object.freeze([]),
});
