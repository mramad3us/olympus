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
// Since 0.0.4 the domain also carries the instinct (SKILLS §14, src/sim/skills/instinct.js: the
// people domain held its prefix): the fast layer 'offers' settles the instinct's line each second
// (instinctStep), and the action 'instinct' (T) does what the line offers (instinctAction). The
// action 'people' (talk and orders, 0.0.10) is still a stub, routed and doing nothing.
// Its one upgrade (0.0.6; the build sheet 0.0.6 §3.2): 'people:cuts' maps every look's cut that v0.0.5
// drew to a regulation cut (LEGACY_CUTS: crew to low regulation, a man's short to medium regulation,
// bald to the shaved head; a woman's as they are), drawing no thinning (v0.0.4's bald men are the shaved
// ones); the squad rule still holds, the map being one to one within a sex. Flag mig:people-cuts, set
// only where a look changed, so a new save loads unchanged.
import { fillDomain } from '../../core/state.js';
import { CUTS, LEGACY_CUTS } from '../../data/people/looks.js';
import { actorsStep, placeSlowStep } from './place.js';
import { instinctStep, instinctAction } from '../skills/instinct.js';

const KEYS = Object.freeze(['player', 'people', 'units', 'happenings', 'actors', 'mind', 'talk', 'names']);
const noop = () => {};

/** The upgrade 'people:cuts' (see the header): v0.0.5's cuts mapped to the regulation cuts. Returns how many looks changed. */
export function upgradeCuts(state) {
  let n = 0;
  for (const p of Object.values(state.people ?? {})) {
    const hair = p?.look?.hair, style = hair?.style, sex = p?.sex === 'f' ? 'f' : 'm';
    if (!hair || !style || CUTS[style]?.sex === sex) continue;
    const to = LEGACY_CUTS[sex]?.[style];
    if (!to) continue;
    p.look = { ...p.look, hair: { ...hair, style: to } };
    n++;
  }
  if (n) (state.flags ??= {})['mig:people-cuts'] = true;
  return n;
}

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
  fast: Object.freeze({ actors: actorsStep, offers: instinctStep }),
  slow: Object.freeze([Object.freeze({ name: 'people:place', step: placeSlowStep, steady: () => true })]),
  jobs: Object.freeze({}),
  actions: Object.freeze({ people: noop, instinct: instinctAction }),
  upgrades: Object.freeze([['people:cuts', upgradeCuts]]),
});
