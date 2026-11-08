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
// their cost). No slow contributor or job of its own this round: zones' air at 1 Hz and the minute's
// environment come with PLACES §3 (0.1).
//
// 0.0.3 (the build sheet 0.0.3 §2.1): the actions `hand` (R: what's at hand, a door within reach,
// else 0.0.2's fifteen-minute wait, which leaves TIME's domain) and `door` ({ act: 'door', args:
// { id, to } }, tests and the debug handle), hand.js's; the player layer now also frees door leaves,
// builds a ground's chunks ahead and crosses portals (move.js); and the upgrade 'places:no-site-seed'
// drops v0.0.2's per-site seed from an older save (the user, 2026-11-05: "game world is handcrafted":
// nothing of a place is rolled), marking flags['mig:no-site-seed'] where it dropped one, so a fresh
// state loads unchanged. A path request's `who` is walked by name (TECH §2.3.1), so idFields need not
// list places.nav.pending[].who.
// The environment foundation (ROADMAP "anywhere", step 1; PLACES §3.16): the upgrade 'places:env' (src/sim/places/env.js
// upgradeEnv) reads places.live.env, a scene's override of the site's environment, absent for the site's own: a null
// there is written as its absence, so every save made before it loads, and saves again, byte for byte.
import { initPlaces } from './model.js';
import { playerStep } from './move.js';
import { pathsStep } from './nav.js';
import { handAction, doorAction } from './hand.js';
import { upgradeEnv } from './env.js';

/** Drop v0.0.2's site seeds from an older save (see the header). */
export function dropSiteSeeds(state) {
  let dropped = 0;
  for (const rec of Object.values(state.places?.sites ?? {})) if (rec && 'seed' in rec) { delete rec.seed; dropped++; }
  if (dropped) (state.flags ??= {})['mig:no-site-seed'] = true;
  return dropped;
}

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
  actions: Object.freeze({ hand: handAction, door: doorAction }),
  upgrades: Object.freeze([['places:no-site-seed', dropSiteSeeds], ['places:env', upgradeEnv]]),
});
