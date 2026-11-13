// OLYMPUS people: figureOf, what the stage reads to draw anyone: their look in the outfit of the moment, their pose frame by frame, where it sits, what they are doing and how their body looks (the 0.0.3 build sheet §2.2; the 0.0.4 sheet §2.2.7).
//
// figureOf(state, actor, ms) → { look, posture, frame, k, x, z, y, face, head, spotId, curtain, gait,
// strideM, outfit, inside, activity, cues, and upK, edgeX, edgeZ in a sitUp or lieDown frame: how far
// sat up and the berth's edge, poseAt's } (spotId the pose's shown: a rising sleeper's berth until
// they leave it, the view's berth to draw), ms the moment drawn (the view's clock.ms + alpha ×
// TICK_MS, so a transition plays between ticks). The pose is people's poseAt (src/sim/people/place.js):
// a transition (rising from a berth, lying down, sitting, standing, stepping onto a spot) drawn frame
// by frame ('lie', 'sitUp', 'sit', 'climb', 'standUp', 'walk', 'stand', 'dress', 'lieDown'), k its share,
// x, z and y where the body is at that frame (the actor's own fields hold the end of it), the outfit
// changing half-way through a dress. look is a wear() spec (src/art/figures/outfits.js): the person's
// own look ({ skin, hair: { style, color }, seed }, drawn by the roster) with the outfit worn at ms
// (PT kit in the rack, utilities by day, a towel in and out of the shower) and head: null indoors
// (covers come off under a roof, the Corps' custom), so the view never rebuilds a look by hand; the
// same look object comes back for the same person, outfit and roof until the person's look changes
// (a memo keyed by the look record), so the view's caches can key on it. head is the direction the
// head lies ('n', 's', 'e', 'w': the berth's seat's, from places' seatOf), null unless lying; curtain
// whether the rack's curtain is drawn over a sleeper (once any transition has played out: the view
// draws it and hides who is behind); gait and strideM the walker's (anyone's own out of a transition, from the rework's
// R2: the #2, the instructor and the range's coach walk as you do, where v0.0.12 forced 'idle' on every non-player with a
// service record; 'walk' and the metres walked through a transition's 'walk' frame, the steps between a lower berth's
// edge and its foot, so the view draws the gait's frames there and the feet never slide), with the rest of BODY §16.8's
// locomotion record (src/sim/body/loco.js): gp (the gait phase, steps), bodyRad (the body's yaw) and moveStance.
// For the player, inside is the fixture whose stall they stand in while an activity's part says so
// (the stage hides the figure behind it), activity { id, part, k } what they are doing (TIME's
// activityNow), and cues the body's cuesOf (wet, grime, sweat, tired, stubble, bladder, hunger,
// thirst: 0 to 1, for the wet head and the tired walk); everyone else's cues are zeros this round
// (their needs come at 0.0.9). A person without the roster's record (the sandbox's player: a look and
// a name) draws as before: their look as it is, standing.
// 0.0.6 (the build sheet 0.0.6 §2.2): the look carries the hair's drawn step (look.hair.step, 1 to 3,
// left out at 0, a fresh cut): the player's is the body's (src/sim/body/hair.js hairStepOf), anyone
// else's the actor's (actor.hair, which people's actors layer writes only out of the player's sight), or
// the closed form's while an actor has none; lookFor's memo is keyed by it too. The cues gain the hands
// (handsK, handsWhy: the doll's).
// 0.0.7 (the build sheet 0.0.7 §2.4, §2.7): the actor's stance the range sets is drawn: 'down' (a casualty lying
// where they fell: posture 'lie', frame 'hurt', on the ground, not a berth), 'kneel' for someone without a rifle
// (the corpsman at work: frame 'aid'; a rifle in hand is drawn by the arms' gunLook instead, the view's), and
// 'sit' passed on as stance for the rifle's seated frames. Nothing else of the figure changes.
// R8 (VIEWS §3.10.2): with the gait phase, what the view needs to read it, so it imports nothing of the body's: stepM (the
// step the phase is counted in this tick: src/sim/body/loco.js stepMOf at the tick's speed), gMs2 (the place's gravity, for
// the flight's lift) and cycle (the walk cycle played: the page's state.$cycle or the game's).
// Pure.
import { seatOf } from '../places/fixtures.js';
import { areaOf, lonOf } from '../places/model.js';
import { activityNow } from '../time/doing.js';
import { bodyOf } from '../body/body.js';
import { cuesOf } from '../body/cues.js';
import { poseAt } from './place.js';
import { hairStepOf } from '../body/hair.js';
import { gpOf, bodyRadOf, stepMOf, legMOf, cycleOf } from '../body/loco.js';
import { gravityAt } from '../places/env.js';
import { TICK_MS } from '../../core/clock.js';

const memo = new WeakMap();                                        // (a person's look record → Map(variant → the frozen wear() spec))
const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };
/** An NPC's body cues this round: none move (their needs come at 0.0.9). */
export const NO_CUES = Object.freeze({ wetK: 0, grimeK: 0, sweatK: 0, tiredK: 0, stubbleK: 0, bladderK: 0, hungerK: 0, thirstK: 0, handsK: 0, handsWhy: null });

/** The wear() spec for a person's look in an outfit, under a roof or not, at the hair's drawn step (0 to 3): the same object while the look is unchanged. */
export function lookFor(look, outfit = 'utilities', indoors = false, step = 0) {
  if (!look) return null;
  let m = memo.get(look);
  if (!m) memo.set(look, (m = new Map()));
  const st = Math.max(0, Math.min(3, Math.round(step || 0)));
  const key = `${outfit}|${indoors ? 1 : 0}|${st}`;
  let spec = m.get(key);
  if (!spec) {
    spec = { outfit, skin: look.skin, hair: { style: look.hair?.style, color: look.hair?.color, ...(st ? { step: st } : {}) }, seed: look.seed };
    if (indoors) spec.head = null;
    m.set(key, (spec = deepFreeze(spec)));
  }
  return spec;
}

/** Whether the live area has a roof (a floor of a building, a deck: the Wheel's, 0.0.12): covers off. */
export const ROOFED_KINDS = Object.freeze(new Set(['floor', 'deck']));
export const indoorsNow = (state) => ROOFED_KINDS.has(areaOf(state.places?.live?.area)?.kind);

// (the body's cues for the player, zeros where the body says nothing)
function cuesFor(state, pid, ms) {
  const b = bodyOf(state, pid);
  return b ? { ...NO_CUES, ...cuesOf(b, ms, lonOf(state)) } : NO_CUES;
}

/** The gait phase's step and the place's gravity for the view (see the header): { stepM, gMs2, vMs, cycle }. */
export function stepOf(state, a) {
  const dx = a.x - (a.$px ?? a.x), dz = a.z - (a.$pz ?? a.z), vMs = Math.hypot(dx, dz) / (TICK_MS / 1000);
  const gMs2 = gravityAt(state, null, a.x, a.z)?.gMs2 ?? 9.81, cycle = cycleOf(state);
  const gait = a.gait === 'run' || a.gait === 'bound' ? 'run' : 'walk';
  return { stepM: stepMOf({ gait, stance: a.moveStance ?? null, vMs, gMs2, legM: legMOf(state, a.who), cycle }).stepM, gMs2, vMs, cycle };
}

/** What the stage draws for an actor at ms (see the header). */
export function figureOf(state, actor, ms = state?.clock?.ms ?? 0) {
  const person = actor?.who ? state.people?.[actor.who] : null;
  const gait = actor?.gait ?? 'idle', strideM = actor?.strideM ?? 0, face = actor?.face ?? 'down';
  if (!person?.service) {
    return { look: person?.look ?? {}, posture: 'stand', frame: 'stand', k: 1, x: actor?.x ?? 0, z: actor?.z ?? 0, y: 0, face, head: null, spotId: actor?.spotId ?? null, curtain: false, gait, strideM, gp: gpOf(actor), bodyRad: bodyRadOf(actor),
      outfit: 'utilities', inside: null, activity: null, cues: NO_CUES };
  }
  const isPlayer = actor.id === state.player?.actor;
  const st = actor.stance ?? null;
  if (st === 'down' || st === 'kneel') {
    const base = figureOf(state, { ...actor, stance: null }, ms);
    return st === 'down' ? { ...base, posture: 'lie', frame: 'hurt', k: 1, x: actor.x, z: actor.z, y: 0, head: null, spotId: null, curtain: false, gait: 'idle', strideM: 0, stance: st }
      : { ...base, frame: base.frame === 'stand' || !base.frame ? 'aid' : base.frame, stance: st };
  }
  const headNow = (actor.posture ?? 'stand') === 'lie' && actor.spotId ? seatOf(actor.spotId)?.head ?? null : null;
  const p = poseAt(actor, ms, headNow);
  const still = p.k >= 1;
  const now = isPlayer ? activityNow(state, ms) : null;
  const step = isPlayer || !Number.isFinite(actor.hair) ? hairStepOf(state, actor.who, ms) : actor.hair;
  return {
    look: lookFor(person.look, p.outfit, indoorsNow(state), step),
    posture: p.posture, frame: p.frame, k: p.k, x: p.x, z: p.z, y: p.y, face: p.face, head: p.head, spotId: p.spotId ?? null,
    ...(p.upK !== undefined ? { upK: p.upK, edgeX: p.edgeX, edgeZ: p.edgeZ } : {}),
    curtain: !!actor.curtain && still,
    // (the steps between a lower berth's edge and its foot walk on the gait's frames, by the metres walked)
    gait: p.frame === 'walk' ? 'walk' : still ? gait : 'idle', strideM: p.frame === 'walk' ? p.walkM ?? 0 : strideM, outfit: p.outfit,
    gp: gpOf(actor, cycleOf(state)), bodyRad: bodyRadOf(actor), ...(actor.moveStance ? { moveStance: actor.moveStance } : {}), ...stepOf(state, actor),
    inside: now?.inside ? now.fixtureId : null,
    activity: now ? { id: now.id, part: now.part, k: now.k } : null,
    cues: isPlayer ? cuesFor(state, actor.who, ms) : NO_CUES,
    ...(st ? { stance: st } : {}),
  };
}
