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
// 0.0.8 (the build sheet 0.0.8 §2.6, §8 item 26; COMBAT §25.4): the contact's two layers, src/sim/combat/contact.js:
// 'look' the detector (a turner newly seen opens the take-in's window or joins it; lived ticks only) and 'input' the
// window's end (the pause on its tick, which runs while time stands still). Neither writes anything where the range
// session has no turners, so a gunless game, test-handling and test-range are unchanged.
// 0.0.9 (the build sheet 0.0.9 §2.1; COMBAT §5.7): the startle's end runs first in 'input' (src/sim/combat/supp.js
// suppInput: the stop hold let go inside a startle, the 'startle' fact 'end' and the log at its end), then the contact's,
// so a pause that waited for a startle comes on the tick it ends. It writes nothing where nobody has a combat block.
import { fillDomain } from '../../core/state.js';
import { contactLook, contactInput } from '../combat/contact.js';
import { suppInput } from '../combat/supp.js';
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

/** The fast layer 'input' (see the header): the startle's, then the contact's. */
function peopleInput(state, input, bus, ctx) {
  suppInput(state, input, bus, ctx);
  contactInput(state, input, bus, ctx);
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
  fast: Object.freeze({ input: peopleInput, actors: actorsStep, look: contactLook, offers: instinctStep }),
  slow: Object.freeze([Object.freeze({ name: 'people:place', step: placeSlowStep, steady: () => true })]),
  jobs: Object.freeze({}),
  actions: Object.freeze({ people: noop, instinct: instinctAction }),
  upgrades: Object.freeze([['people:cuts', upgradeCuts]]),
});
