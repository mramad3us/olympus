// OLYMPUS places: the places domain, as game.js composes it (TECH §2.5, the build sheet 0.0.2 §2.1).
//
// A domain descriptor names what PLACES owns in the state and what it adds to the tick: the
// top-level key `places` (TECH §6.1; the built `sites` key renamed, correction 2), its id-keyed map
// (places.sites, keyed by site id: kind 'place') and the id fields not named id, *Id, *Ids or who
// (the live site and area, each queued request's area), which TECH §2.3.1's validator walk reads;
// init, the ??= fill that newGame runs and upgradeState runs again on load (model.js initPlaces);
// and two fast-layer contributors in TECH §3.1's order: `player` (layer 2, move.js playerStep: the
// player walks the live area's grid) and `paths` (layer 9, nav.js pathsStep: path requests served
// within PATH_SOLVES_TICK 6 and PATH_NODES_TICK 8,000 node expansions, delivered on a tick fixed by
// their cost). No slow contributor, job, action or upgrade of its own this round: zones' air at 1 Hz
// and the minute's environment come with PLACES §3 (0.1), doors on R with VIEWS's R (0.0.4).
import { initPlaces } from './model.js';
import { playerStep } from './move.js';
import { pathsStep } from './nav.js';

/** The places domain's descriptor (TECH §2.5). */
export const placesDomain = Object.freeze({
  name: 'places',
  owner: 'PLACES',
  keys: Object.freeze(['places']),
  idMaps: Object.freeze({ 'places.sites': 'place' }),
  idFields: Object.freeze({ 'places.live.site': 'place', 'places.live.area': 'place', 'places.nav.queue[].area': 'place' }),
  init: initPlaces,
  fast: Object.freeze({ player: playerStep, paths: pathsStep }),
  slow: Object.freeze([]),
  jobs: Object.freeze({}),
  actions: Object.freeze({}),
  upgrades: Object.freeze([]),
});
