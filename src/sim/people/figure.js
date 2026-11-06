// OLYMPUS people: figureOf, what the stage reads to draw anyone: their look in the outfit of the moment, their posture and where it sits (the 0.0.3 build sheet §2.2).
//
// figureOf(state, actor) → { look, posture, y, face, head, curtain, gait, strideM }. look is a wear()
// spec (src/art/figures/outfits.js): the person's own look ({ skin, hair: { style, color }, seed },
// drawn by the roster) with the outfit the actor wears now (PT kit in the rack, utilities by day: the
// sheet §8, item 21) and head: null indoors (covers come off under a roof, the Corps' custom), so the
// view never rebuilds a look by hand. The same look object comes back for the same person, outfit
// and roof until the person's look changes (a memo keyed by the look record), so the view's caches
// can key on it. posture is 'stand', 'sit' or 'lie'; y the height of the seat or berth the body is on
// (the view lifts the sit frame to it, lays the sleep frame on the berth); head the direction the
// head lies ('n', 's', 'e', 'w': the berth's seat's, from places' seatOf), null unless lying;
// curtain whether the rack's curtain is drawn over a sleeper (the view draws it and hides who is
// behind); gait and strideM the walker's (the player's own, else idle). A person without the
// roster's record (the sandbox's player: a look and a name) draws as before: their look as it is,
// standing.
// Pure.
import { seatOf } from '../places/fixtures.js';
import { areaOf } from '../places/model.js';

const memo = new WeakMap();                                        // (a person's look record → Map(variant → the frozen wear() spec))
const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };

/** The wear() spec for a person's look in an outfit, under a roof or not: the same object while the look is unchanged. */
export function lookFor(look, outfit = 'utilities', indoors = false) {
  if (!look) return null;
  let m = memo.get(look);
  if (!m) memo.set(look, (m = new Map()));
  const key = `${outfit}|${indoors ? 1 : 0}`;
  let spec = m.get(key);
  if (!spec) {
    spec = { outfit, skin: look.skin, hair: { style: look.hair?.style, color: look.hair?.color }, seed: look.seed };
    if (indoors) spec.head = null;
    m.set(key, (spec = deepFreeze(spec)));
  }
  return spec;
}

/** Whether the live area has a roof (a floor of a building, a deck): covers off. */
export const indoorsNow = (state) => areaOf(state.places?.live?.area)?.kind === 'floor';

/** What the stage draws for an actor (see the header). */
export function figureOf(state, actor) {
  const person = actor?.who ? state.people?.[actor.who] : null;
  const gait = actor?.gait ?? 'idle', strideM = actor?.strideM ?? 0, face = actor?.face ?? 'down';
  if (!person?.service) return { look: person?.look ?? {}, posture: 'stand', y: 0, face, head: null, curtain: false, gait, strideM };
  const isPlayer = actor.id === state.player?.actor;
  const posture = isPlayer ? 'stand' : actor.posture ?? 'stand';
  const head = posture === 'lie' && actor.spotId ? seatOf(actor.spotId)?.head ?? null : null;
  return {
    look: lookFor(person.look, actor.outfit ?? 'utilities', indoorsNow(state)),
    posture, y: isPlayer ? 0 : actor.y ?? 0, face, head, curtain: !!actor.curtain,
    gait: isPlayer ? gait : 'idle', strideM: isPlayer ? strideM : 0,
  };
}
