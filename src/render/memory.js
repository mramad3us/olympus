// OLYMPUS render: the view's memory of people out of sight (VIEWS §2.11: "people out of sight are drawn frozen where last seen").
//
// The view draws every actor of the live area and the fog dims what the player cannot see, so a
// figure in a fogged cell is still on the screen, darker. People change pose only where the player
// sees neither where they are nor where they go (src/sim/people/place.js, perception's visibility at
// 0), and without a memory the view would show that change in the dim: a squadmate jumping from
// their locker into their rack in the fog behind you. So the view remembers each actor as last
// drawn while in sight: an actor the player can see neither where it stands now nor where it was
// last drawn (visibility 0 at both, the fog's own function) is drawn as remembered; once either spot
// comes into sight it is drawn as it is again, and remembered anew. The change then shows only
// where the player looks, at the fog's edge as it lifts.
//
// The memory belongs to one state and one area: a new state (a load, a new career), another area
// (actors are made again behind the cut) or a skip (the people are where the time has put them, TIME
// §5.9) forgets it; the view forgets it for a skip only while a full splash's iris covers the picture
// (begin's skipping), and a brief splash's lapse, which never covers it, keeps it, so the squad drawn
// as last seen never jumps to where they are in one frame with the bay in view (the review of v0.0.5's
// rack: seven did on the dressing splash's first frame); they show as they are once looked at. It is the view's, never saved; PEOPLE's state.mind.seen and its ghosts (a
// person's last sighting kept in the save, forgotten past 70 m) come with sightings (0.0.10).
// Pure: no DOM, no three.js (node tests drive it on the headless game).

/**
 * A memory: { begin(state, areaId), recall(id, x, z, inSight), keep(id, x, z, value), forget(), size }.
 * inSight(x, z) → bool is the caller's (the view's: perception's visibility above 0).
 */
export function createMemory() {
  const seen = new Map();                                            // actor id → { x, z, value }
  let of = null;
  return {
    /** A frame begins: forgotten with a new state, another area, or while a skip runs (skipping: the caller's say, by default state.skip; the view's waits for a splash's iris to close). */
    begin(state, areaId, { skipping = !!state?.skip } = {}) {
      if (!of || of.state !== state || of.area !== areaId || skipping) { seen.clear(); of = { state, area: areaId }; }
    },
    /** What to draw for an actor at (x, z): its remembered value when neither spot is in sight, else null (draw it as it is, then keep it). */
    recall(id, x, z, inSight) {
      const was = seen.get(id);
      return was && !inSight(x, z) && !inSight(was.x, was.z) ? was.value : null;
    },
    /** Remember an actor as drawn now, standing at (x, z) in the sim. */
    keep(id, x, z, value) { seen.set(id, { x, z, value }); },
    /** Forget everyone. */
    forget() { seen.clear(); of = null; },
    get size() { return seen.size; },
  };
}
