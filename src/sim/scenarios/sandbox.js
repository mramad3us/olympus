// OLYMPUS scenarios: the sandbox, a free walk in the test rooms (ROADMAP §4.1, 0.0.3: "a free walk in
// a test room with the samples' figure").
//
// The scenario's fill, run by newGame after every domain's init (TECH §2.5, the build sheet §2.1):
// the player as an ordinary person (TECH §2.3.1: their id is whatever p<n> the counter gives, here
// p1, never an alias; the person put into people through core/ids.js so the map's sorted ids hold),
// their actor a1 on the live area at the test rooms' spawn, facing as the spawn says, idle, and the
// test site entered (places.live = { site: 'test', area: 'test.rooms' }). The person carries a look
// for the view (VIEWS's wear() spec: utilities, a low regulation cut since 0.0.6; the seed picks what
// the look leaves open) and the sandbox's name; a test world has no career (career: null, ROADMAP §2.1), so nothing
// else of a person exists yet.
//
// A save from 0.0.1 is a sandbox state without a player (its `sites.sandbox` carried nothing, and
// core's upgrade moves sites to places once): the upgrade 'sandbox:0.0.1' makes its player record
// again (0.0.1's was { name, x, z }, its stub walk's) and fills it with sandbox(), keeping its meta,
// clock and dice, so an old save lands at the spawn and plays on.
import { nextId, put } from '../../core/ids.js';
import { addUpgrade, emptyDomain } from '../../core/state.js';
import { TEST_AREA } from '../../data/places/testroom.js';
import { enterSite } from '../places/model.js';
import { STARTS } from '../../data/scenes.js';

/** Where the sandbox plays (its site its start's host, src/data/scenes.js STARTS). */
export const SANDBOX = Object.freeze({ site: STARTS.sandbox.host.site, area: 'test.rooms' });
/** The sandbox player's look (a wear() spec) and name. */
export const SANDBOX_PLAYER = Object.freeze({
  name: 'Private (sandbox)',
  look: Object.freeze({ outfit: 'utilities', skin: 'tan', hair: Object.freeze({ style: 'lowReg', color: 'dark' }), seed: 21 }),
});

/** Fill a new state with the sandbox: the player p1, their actor a1 at the spawn, the test rooms live. */
export function sandbox(state) {
  state.people ??= {};
  state.actors ??= { list: [] };
  state.actors.list ??= [];
  state.player ??= {};
  const pid = nextId(state, 'p'), aid = nextId(state, 'a');
  const look = JSON.parse(JSON.stringify(SANDBOX_PLAYER.look));
  put(state, state.people, pid, { id: pid, name: SANDBOX_PLAYER.name, look });
  const { x, z, face } = TEST_AREA.spawn;
  state.actors.list.push({ id: aid, who: pid, x, z, face, gait: 'idle', strideM: 0 });
  Object.assign(state.player, { id: pid, actor: aid, waypoint: state.player.waypoint ?? null, presets: state.player.presets ?? {}, keeps: state.player.keeps ?? {} });
  enterSite(state, SANDBOX.site, SANDBOX.area);
  return state;
}

// (a 0.0.1 sandbox save has no player: fill it again, keeping meta, clock and dice. Its player record
// was 0.0.1's stub walk, { name, x, z }, so it is made again as TECH §6.1's, not merged into: its old
// x and z would contradict where the actor stands)
addUpgrade('sandbox:0.0.1', (s) => {
  if (s.meta?.scenario !== 'sandbox' || s.player?.id) return;
  s.player = emptyDomain('player');
  sandbox(s);
});
