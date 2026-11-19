// OLYMPUS tests: a bare state on the Wreck at Phobos with the team booted, for the round's suites (the build sheet v0.0.25 §1 A; src/data/places/wreck.js).
//
// wreckWorld(opts) is the shoot house's fill at GO as test-shoothouse makes it (your sheet, your #2 on his, both issued and made
// ready), then carried aboard the Wreck: the range session taken away whole (no tower, no lane: the lane on the Wreck is its own
// scenario's, test-zerocqb), the player's place made the Wreck's (src/sim/places/model.js enterSite: the School's site, its micro
// gravity, the area's plate), you at WRECK_SPOTS.start on deck 5's passage and your #2's post moved to WRECK_SPOTS.two, so the
// actors list is made again on the Wreck (src/sim/people/place.js syncActors: the instructor's post is the Wheel's, so he stays
// behind). With `boots` both wear mag boots, locked where `lock` (tests/void-world.mjs bootUp: footing.js setAnchor 'boots'), so the
// legs walk at BODY §16.6's 0.5 m/s. The actors' ids, once made here, are the world's for good: nothing aboard re-makes them (one
// area: src/sim/places/hatch.js crossHatch moves bodies between the decks without an area change).
// atTrunk(w, { open }) puts the pair round deck 5's scuttle (the hold's plan's stack points, src/data/places/wreck-plans.js), and
// with `open` undogs and opens the trunk (hatch.js setHatch), as the lane's beats would.
// The world's memory is plain data on the actors and the state, so a save carries it.
import { createGame } from './game.mjs';
import { enterSite } from '../src/sim/places/model.js';
import { setPost } from '../src/sim/people/staff.js';
import { syncActors } from '../src/sim/people/place.js';
import { setHatch } from '../src/sim/places/hatch.js';
import { setAnchor } from '../src/sim/body/footing.js';
import { WRECK, WRECK_SPOTS, WRECK_TRUNK } from '../src/data/places/wreck.js';
import { WRECK_PLANS } from '../src/data/places/wreck-plans.js';
import { bootUp } from './void-world.mjs';

/** The actor of a person (or null). */
export const actorOfPid = (s, pid) => s.actors?.list?.find(a => a.who === pid) ?? null;

/**
 * The world (see the header). opts: { seed (48213), tier ('sgt'), two (true: your #2 aboard; false: left behind on the Wheel),
 * boots (true), lock (true) }. Returns { g, s, pid, twoPid, me(), two(), boots: { [pid]: locked } }.
 */
export function wreckWorld({ seed = 48213, tier = 'sgt', two = true, boots = true, lock = true } = {}) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'go' });
  const s = g.state, pid = s.player.id, twoPid = two ? s.armoury.range.house.twoPid : null;
  delete s.armoury.range;
  enterSite(s, WRECK.site, WRECK.id);
  const me = actorOfPid(s, pid);
  me.x = WRECK_SPOTS.start.x; me.z = WRECK_SPOTS.start.z; me.face = WRECK_SPOTS.start.face; me.$px = me.x; me.$pz = me.z; delete me.path;
  if (twoPid) setPost(s, twoPid, { key: 'house-two', area: WRECK.id, x: WRECK_SPOTS.two.x, z: WRECK_SPOTS.two.z, face: WRECK_SPOTS.two.face, outfit: 'combatSuit' });
  syncActors(s);
  const locked = {};
  if (boots) for (const p of [pid, ...(twoPid ? [twoPid] : [])]) locked[p] = bootUp(s, p, { lock }).locked;
  return { g, s, pid, twoPid, me: () => actorOfPid(s, pid), two: () => (twoPid ? actorOfPid(s, twoPid) : null), boots: locked };
}

/** The pair round deck 5's scuttle (see the header), the trunk undogged and opened where `open`. Returns the world. */
export function atTrunk(w, { open = true } = {}) {
  const [one, two] = WRECK_PLANS.plans[WRECK_TRUNK.id].stack;
  const place = (a, [x, z]) => { if (!a) return; a.x = x; a.z = z; a.$px = x; a.$pz = z; delete a.path; if (a.anchor === 'boots') setAnchor(w.s, a.who, 'boots'); };
  place(w.me(), one); place(w.two(), two);
  if (open) { setHatch(w.s, WRECK_TRUNK.id, 'shut'); setHatch(w.s, WRECK_TRUNK.id, 'open'); }
  return w;
}
