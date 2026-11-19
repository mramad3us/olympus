// OLYMPUS body: the footing, what holds a body where it stands, and what the ground does to the hands (ROADMAP "anywhere" step 5; BODY §16.6, §22; WEAPONS §7.3, §7.8; COMBAT §14.8; PLACES §2.7, §3.11; CONTRACTS §21).
//
// The user's rule of 2026-11-08: "Try keeping rifles looking like rifles even zero G stuff, let's say we use
// footing to hold recoil". A gun's form never changes with the gravity; what changes is what takes its push,
// and that is the footing. footingOf(state, pid) is the one helper: the gravity where the person's actor stands
// (src/sim/places/env.js gravityAt), the surface under the feet (env.js surfaceAt: PLACES §2.7's row, its
// `ferrous` and `grip`) where the gravity does not hold the feet by itself, the mag boots worn (the kit's 'boots'
// slot, src/sim/arms/kit.js 'mb-1') and the anchor the actor has taken. It returns
//     { mode, anchor, hold, gG, regime, surface, ferrous, grip, oneHand, placed }
// mode     CONTRACTS §21's footing mode: 'walk' (0.3 G and up), 'heavy' (BODY §14.1's band, motion.js
//          gaitModeOf), 'bound' (0.05 to 0.3 G, the boots or not: the run is still the bound), and under 0.05 G
//          'magWalk' (boots locked on a ferrous face),
//          'handhold' (a hold or a lanyard), 'braced' (the wedge, or a teammate's brace) or 'float'; 'couched' at any
//          gravity where couchedOf(state, pid) says so (step 6's: a couch or a strapped rack, or past COUCH_G;
//          src/sim/places/profile.js couchedOf, gravity's light half), anchor 'braced' (the couch takes the push), hold 'couch'.
// anchor   WEAPONS §7.8's row, which src/sim/arms/shot.js anchorOf turns into the recovery's and the climb's
//          factors: 'planted' at 0.3 G and up whatever the stance (friction or structure takes the push), and in
//          low g when braced; 'light' standing, kneeling or prone on the deck in low g (my call: friction is μ m g whatever
//          the posture, so kneeling skates as standing does; the table names standing), never a body off the deck hanging
//          by a hand or a lanyard there, which is 'handhold' (v0.0.25's review of C and D); 'magBoots' (boots locked
//          on a ferrous face, in free fall or low g), 'handhold' (a hold, one hand; a lanyard, both hands on the
//          gun: COMBAT §14.8), 'braced' (the wedge, a teammate's brace) and 'floating'.
// hold     what holds: 'feet' (the gravity), 'boots', 'handhold', 'tether', 'braced', 'buddy' or 'none'.
// surface  the SURFACES id under the feet, read only below 0.3 G (null above it: the gravity holds the feet on any
//          floor, so a shipped scene at Mars or the Wheel never reads it), with its ferrous and grip.
// oneHand  a hold taken with one hand (a two-handed gun in the other: WEAPONS §7.8's −4, the shot's).
// placed   false for a person with no actor on the live area: no footing to judge, read as planted.
// **At Mars and the Wheel nothing changes**: at 0.38 G and 1 G every body is planted, the rows' factors are 1 and
// no modifier is added, so every shipped scene plays as v0.0.12 does.
//
// The anchor an actor has taken (PEOPLE §2.4) is plain data on the actor, absent by default (the gravity's: feet in
// gravity, none floating), so no save made before it changes: actor.anchor 'boots' | 'handhold' | 'tether' |
// 'braced' | 'buddy', actor.anchorRef (a buddy's person id; the holds are a rule, never fixtures, so a hold needs no
// id: model.js holdNear finds it again from anchorAt) and actor.anchorAt [x, z] (where a hold, a lanyard or a wedge was
// taken: it holds there, and a body moved more than FOOTING.SLIP_M off it has let go; the boots walk with you).
// setAnchor(state, pid, kind, { ref }) → { ok, why } takes one, checked where the sim can check it (the boots worn and
// a ferrous plate under them; a hold or a pad-eye within FOOTING.REACH_M by the area's rule, or a surface whose grip
// is one, PLACES §2.7's 'handholds' or 'loops'; the wedge across a passage of FOOTING.WEDGE_M; a buddy an actor
// within FOOTING.BUDDY_M), or with kind null lets go of it (v0.0.24 as built: see below). A buddy's brace
// holds while the teammate is himself held (planted, boots, a hold or braced: his own footing, never through a
// second buddy). Mag boots are worn kit and their magnets a step each way (src/sim/arms/shooting.js bootsRow:
// MAG_BOOTS.LOCK_MS 400 and UNLOCK_MS 300 ms); while locked under 0.05 G the walk is BODY §16.6's 0.5 m/s with no
// run (magGaits) and the grip μ (m g + 300 N) (bootsHoldN, read by body/motion.js legsAt, the one legs helper).
//
// footingMods(state, pid, skill, zerog) is BODY §22's gravity regime row, which the roller adds to every roll
// (src/sim/combat/roll.js): in free fall a roll whose uses meet arms, legs or torso takes −6 floating, −2 on a
// hold, boots or a lanyard, 0 braced ("anchoring", WEAPONS §7.3: the shot reads it here, with the rest of the
// roller's list); a roll of the hands alone (Weapon handling: hands, eyes) takes BODY §16.6's −2 when nothing holds
// the feet or a lanyard the body ("no foot restraint"); in low g, 0.05 to 0.2 G, Close combat, Fieldcraft and
// Fitness take −2. Each is worn down by Zero-g (SKILLS §5.13 mitigated(base, Zero-g, 24, 0.15)); Zero-g's and EVA's
// own rolls take none (my call: they are the skills of the regime). One entry, src 'env', absent where it is 0.
//
// groundSoilOf(state, area, x, z) is what kneeling or lying on the ground leaves on the hands (BODY §6's hands,
// 0.0.6's regolith): out of doors, the area's own ground (model.js groundSurfaceOf: Melas's regolith under its
// paving too, the dust settled on it), HANDS.REGOLITH × the row's dust, rounded to 0.1, its soilWord the cause
// ('regolith', 'frost', 'soil', 'dust'); indoors none (my call: a floor, a deck and a hall are swept; a ship's
// grease waits for the hands' work on its fittings). Melas's ground is regolith at dust 1, so it is v0.0.6's
// +15 'regolith' exactly.
// v0.0.24's step 5, as built on the stash (the build sheet v0.0.24 §1 A, §3.1; AW§4.1 items 1 to 5): the holds are the area's
// rule (src/sim/places/model.js holdNear), so setAnchor's hold and lanyard need one within FOOTING.REACH_M 0.8 m ('handhold' any
// hold or pad-eye, 'tether' a pad-eye), and the wedge ('braced' with no buddy) a passage of FOOTING.WEDGE_M 0.8 to 1.2 m across
// the body's place (model.js passageAt). anchorOffers(state, pid) is what the place gives a floating body, best first by COMBAT
// §14.8's table (the wedge ×1.1, the boots ×1.2, the lanyard and the hold ×1.6): the panel's rows (src/sim/arms/shooting.js
// anchorRows, bootsRow) and the instinct's "Anchor before you fire." read it. noFootingWhy(state, pid) is why a move cannot start
// where the legs have nothing to push on (under 0.05 G, not on locked boots): "no footing: lock your boots" on a ferrous face
// with boots worn, "no footing: push off from the hold" while a hold, a lanyard or a wedge holds you (step 7's push-off), else
// "no footing: take a hold" (src/sim/combat/bundle.js moveStruck strikes the drill's moves with it: AW's 4.0 m in 500 s on
// ship-coast, never again silent). gearAnchorOf(state, pid) is what a viewer sees of the anchor (the gear record's `anchor`:
// 'hold' a hand on a rail, 'lanyard' the strap clipped short, 'wedge' back and feet across, 'buddy', 'boots' locked), and
// anchorHoldOf(state, pid) the hold a hand is on (the figure's and the doll's hand, by the same arithmetic). At 0.3 G and up the
// footing is one frozen record a gravity (PLANTED), so the roller and the pull pay a lookup there.
// The review of v0.0.24's A to C: an anchor is taken by a step only from rest. Under 0.05 G a body moving over what it touches
// faster than FOOTING.REST_MS (a drift, or a push-off under way) locks no boots ("no deck under the boots"), and takes no hold, no
// lanyard and no wedge by a step ("drifting: grab a hold (L)"): only the grab (L, v0.0.24 B's freefall.js grab) takes a hold on
// the move, through its speed's bands, and stops the body before it writes the anchor; and boots lock on nothing while the body is
// lifted off the deck (B's free-fall height actor.floatY over FOOTING.OFF_DECK_Y_M). An anchor taken under 0.05 G stops what is
// left of the body's motion (its drift under REST_MS, its tumble, the aim's tumble record), and the boots put it on the deck
// (floatY cleared: a body at a standing man's height has its soles on the plate). noFootingWhy names Let go first where a
// lanyard, a wedge or a buddy holds you (the keys push off a hand's hold only), and the grab while you drift.
// Pure but its writers of the actor: setAnchor, and from v0.0.25 setOnFace and lockOnFace (the face a body stands on, below). The
// view imports this module (render/view.js, main.js; tests/syntax.test.mjs SIM_FOR_VIEW) for its reads alone (onFaceOf,
// bodySpanOf, footingOf), never a writer, which the view must not call (v0.0.25's fixer, the code review: the widening is on purpose).
// v0.0.25, "Hold to hold" (its build sheet §1 B, §3.2, §5; PL§5, PL§7; COMBAT §14.8's six faces): **the face a body stands on**.
// actor.onFace is absent on the deck and 'deckhead' on the deckhead (people stand on these two this round; boards on all six; never
// actor.face, which is the facing, move.js faceOf's): onFaceOf(state, pid) reads it, setOnFace(state, pid, onFace) is its one writer
// (the plant, the face's rows), and on the deckhead the body's free-fall height actor.floatY is the room's ceiling less
// FREEFALL.FLOAT_Y_M (1.2 m under the Wreck's 2.2 m), actor.y untouched (the floor). bodySpanOf(state, a) is the body's height span,
// the one helper for the sim (penetrate.js, burst.js), the figure, the bubble and the card: arms/carry.js SPAN_M[stance] over its floor
// on the deck ([0, 1.75] standing), lifted by its float over FLOAT_Y_M while it floats, mirrored from the ceiling on the deckhead
// ([0.45, 2.2] standing, head down: spanFrameOf's `inv`). Both faces overlap by 1.30 m, so one nav grid, one sight grid and one
// collision serve them. On the deckhead booted the footing is 'magWalk' at any gravity under 0.3 G (never 'bound': the g pulls him
// off the face, the boots hold him on it), and the boots lock there where the body is within OFF_DECK_Y_M of the deckhead (the height
// measured from the face locked on: bootsLockWhy), keeping floatY at the ceiling less FLOAT_Y_M. A buddy's brace may be taken across a
// deck hatch (setAnchor's `via`, actor.anchorVia: the hatch's id): his reach is then measured to the scuttle he holds you through (his
// gap to its end on his deck: buddyGapM), while you are in its trunk, so your #2 on the deck above holds your harness while you hang
// through the scuttle 60 m off in the plan (the Wreck's two decks are one area), and the grip goes with you through the transit (no SLIP_M). A face being
// changed is actor.faceTo (the face the boots go to, plain data, saved; faceChangeOf), written by the face's rows and beats, cleared at
// the lock. Every shipped scene's actors carry neither field, so nothing they read moves.
// The review of v0.0.25's E, A and B: a body is on a face only while it stands there. The faces are a decked area's (the area's
// `decks`, the Wreck's; facesHere): elsewhere setOnFace refuses the deckhead and the rows offer none, so Testudo's 2.4 m berth keeps
// its scene. A face change ends on lockOnFace(state, pid, onFace), which checks the lock against the face it goes to (the boots worn,
// steel there, no drift) before it writes the face, so a body that pushed off or drifts keeps the face it had and nothing is
// recorded standing in mid-air. Any anchor but the boots taken on the deckhead with no face being changed (the boots released, a
// hold, a push-off's let go) leaves the face (setOnFace(state, pid, null): onFace cleared, floatY kept, the body floating where it
// was). At BOUND_BELOW_G 0.3 G and over the magnets no longer hold a man on the deckhead (600 N against his weight, the header's
// band): his footing there is the float's, nothing holding him. A bulkhead hatch's head (the bulkhead over its opening, a leaf
// 'hatch' door's strip, plan.js leafRect) stands in the way of a body on the deckhead, whose span reaches the deckhead:
// hatchHeadGapM(state, x, z) is the gap to the nearest, which move.js keeps a deckhead walker out of (headStop) and the face rows
// strike the deckhead's row within.
import { playerActor } from '../../core/ids.js';
import { q } from '../../core/num.js';
import { FOOTING, MAG_BOOTS, GAIT_G, HANDS, FREEFALL, VOID, GRAV_BODY } from '../../data/body/needs.js';
import { SURFACES } from '../../data/places/env.js';
import { gravityAt, surfaceAt, liveEnvOf } from '../places/env.js';
import { areaOf, groundSurfaceOf, holdNear, passageAt, roomOf } from '../places/model.js';
import { SKILLS, mitigated } from '../skills/skills.js';
import { valueOf } from '../skills/templates.js';
import { gaitModeOf } from './motion.js';
import { couchedOf } from '../places/profile.js';
import { SPAN_M } from '../arms/carry.js';
import { hatchOf, HATCH_REACH_M } from '../places/hatch.js';
import { leafRect } from '../places/plan.js';

/** The anchors an actor can take (PEOPLE §2.4, with COMBAT §14.8's wedge and buddy brace). */
export const ANCHOR_KINDS = Object.freeze(['boots', 'handhold', 'tether', 'braced', 'buddy']);
/** The grips a hold or a lanyard can be taken on where an area has no holds' rule (PLACES §2.7's `grip`: model.js holdNear reads them). */
export const HOLD_GRIPS = Object.freeze(new Set(['handholds', 'loops']));
/** The gear record's word for each anchor (src/sim/arms/gear.js `anchor`: what a viewer sees of it). */
export const ANCHOR_SEEN = Object.freeze({ boots: 'boots', handhold: 'hold', tether: 'lanyard', braced: 'wedge', buddy: 'buddy' });

const actorOf = (state, pid) => { const me = playerActor(state); return me?.who === pid ? me : state.actors?.list?.find(a => a.who === pid) ?? null; };
const UNPLACED = Object.freeze({ mode: 'walk', anchor: 'planted', hold: 'feet', gG: null, regime: null, surface: null, ferrous: null, grip: null, oneHand: false, placed: false });
// (places/profile.js couchedOf(state, pid) → bool (gravity.js's, kept in its light half so footing.js loads no free-fall module):
// strapped in, or at COUCH_G and over, or under 0.05 G lying in a rack or seated (restsOn))
// (the planted footing, one frozen record a gravity record: env.js's are frozen and cached, so the key holds while the place does)
const PLANTED = new WeakMap();
const plantedOf = (g) => { let r = PLANTED.get(g); if (!r) PLANTED.set(g, (r = Object.freeze({ mode: gaitModeOf(g.gG), anchor: 'planted', hold: 'feet', gG: g.gG, regime: g.regime, surface: null, ferrous: null, grip: null, oneHand: false, placed: true }))); return r; };

/** The mag boots a person wears (the kit's 'boots' slot, an item of type 'boots'), or null. */
export function bootsOf(state, pid) {
  const id = state.people?.[pid]?.kit?.worn?.boots, it = id ? state.items?.[id] : null;
  return it?.type === 'boots' ? it : null;
}
/** Whether a person's mag boots are locked (the actor's anchor 'boots'), whatever is under them. */
export const bootsLocked = (state, pid) => actorOf(state, pid)?.anchor === 'boots' && !!bootsOf(state, pid);

// (a body in free fall on the move (see the header): drifting over REST_MS, or a push-off under way; lifted off the deck)
const driftMs = (a) => Math.hypot(a.v?.[0] ?? 0, a.v?.[1] ?? 0);
const floatG = (state, a) => gravityAt(state, null, a.x, a.z).gG < GAIT_G.FLOAT_BELOW_G;
const drifting = (state, a) => floatG(state, a) && (!!a.push || driftMs(a) > FOOTING.REST_MS);
// (off the face the body would lock on: its centre over OFF_DECK_Y_M from the deck, or from the deckhead on it (v0.0.25; see the header))
const offDeck = (state, a) => (a.onFace === 'deckhead' ? (ceilingAt(state, a.x, a.z) ?? Infinity) - (a.floatY ?? 0) > FOOTING.OFF_DECK_Y_M : a.floatY > FOOTING.OFF_DECK_Y_M);
/** Why a person's mag boots cannot lock where they are (see the header): 'no steel underfoot', 'no deck under the boots', or null. */
export function bootsLockWhy(state, pid) {
  const a = actorOf(state, pid);
  if (!a || !state?.places?.live?.area) return 'no deck under the boots';
  if (!surfaceAt(state, null, a.x, a.z).ferrous) return 'no steel underfoot';
  // (nor while a push across the deck over the boots' limit acts: they would tear off again at once (gravity.js throwOne's rule, the
  // fixer of v0.0.25's play review: a marine torn off by the 3 G jink locked them again against the bulkhead and rode the rest of it))
  if ((liveEnvOf(state)?.profile?.lat ?? 0) > GRAV_BODY.BOOTS_SHEAR_G) return BOOTS_SHEAR_WHY;
  return offDeck(state, a) || drifting(state, a) ? 'no deck under the boots' : null;
}
/** Why the boots will not lock under a push across the deck over GRAV_BODY.BOOTS_SHEAR_G (bootsLockWhy). */
export const BOOTS_SHEAR_WHY = 'the deck is pulling away sideways: the boots will not hold';
/** Whether a person drifts now (see the header): under 0.05 G, moving over REST_MS or pushing off. */
export function driftingNow(state, pid) {
  const a = actorOf(state, pid);
  return !!a && !!state?.places?.live?.area && drifting(state, a);
}
/** The reason an anchor's step is refused while drifting (see the header). */
export const DRIFT_WHY = 'drifting: grab a hold (L)';
// (an anchor taken under 0.05 G stops what is left of the body's motion (see the header); the boots put it on the deck)
function stilled(state, a, kind) {
  if (kind === 'boots' && a.onFace !== 'deckhead') delete a.floatY;
  else if (kind === 'boots') a.floatY = deckheadY(state, a);
  if (!floatG(state, a)) return;
  delete a.v; delete a.push; delete a.tumble; delete a.tumbleRad; delete a.aimFrom;
}

// (an anchor still where it was taken: the body moved off it has let it go (see the header))
const stillAt = (a) => Array.isArray(a.anchorAt) && Math.hypot(a.x - a.anchorAt[0], a.z - a.anchorAt[1]) <= FOOTING.SLIP_M + 1e-9;

// (what holds the actor now, the record checked against the place: 'boots' | 'handhold' | 'tether' | 'braced' | 'buddy' | null)
function heldBy(state, pid, a, s, depth) {
  const k = a.anchor;
  if (!k) return null;
  if (k === 'boots') return bootsOf(state, pid) && s.ferrous ? 'boots' : null;
  // (a brace across a hatch goes with you through the transit (v0.0.25; see the header): his reach measured through the hatch)
  if (!(k === 'buddy' && a.anchorVia) && !stillAt(a)) return null;
  if (k === 'buddy') {
    if (depth > 0) return null;
    const b = actorOf(state, a.anchorRef);
    if (!b || buddyGapM(state, a, b, a.anchorVia) > FOOTING.BUDDY_M + 1e-9) return null;
    const F = footingAt(state, a.anchorRef, b, depth + 1);
    return F.anchor === 'floating' || F.anchor === 'light' ? null : 'buddy';
  }
  return k;
}

function footingAt(state, pid, a, depth) {
  const g = gravityAt(state, null, a.x, a.z);
  const gG = g.gG;
  if (couchedOf(state, pid)) return Object.freeze({ mode: 'couched', anchor: 'braced', hold: 'couch', gG, regime: g.regime, surface: null, ferrous: null, grip: null, oneHand: false, placed: true });
  // (from BOUND_BELOW_G the magnets hold no man on the deckhead: nothing holds him there (see the header))
  if (gG >= GAIT_G.BOUND_BELOW_G && a.onFace === 'deckhead') return Object.freeze({ mode: 'float', anchor: 'floating', hold: 'none', gG, regime: g.regime, surface: null, ferrous: null, grip: null, oneHand: false, placed: true });
  if (gG >= GAIT_G.BOUND_BELOW_G) return plantedOf(g);
  const s = surfaceAt(state, null, a.x, a.z), held = heldBy(state, pid, a, s, depth);
  const base = { gG, regime: g.regime, surface: s.id, ferrous: s.ferrous, grip: s.grip, oneHand: false, placed: true };
  if (gG >= GAIT_G.FLOAT_BELOW_G) {
    // (booted on the deckhead the boots hold him on the face the g pulls him off: 'magWalk', never 'bound' (see the header))
    if (held === 'boots' && a.onFace === 'deckhead') return Object.freeze({ ...base, mode: 'magWalk', anchor: 'magBoots', hold: 'boots' });
    // (off the deck (floatY set) with a hand on a hold or a tether, he hangs by it: 'light' is a body standing on the deck (the
    // review of C and D: hanging one-handed from the hold's coaming under the tug, the private's pair was booked 'light', standing,
    // and rolled as standing, not one-handed −4))
    if ((held === 'handhold' || held === 'tether') && Number.isFinite(a.floatY)) return Object.freeze({ ...base, mode: 'handhold', anchor: 'handhold', hold: held, oneHand: held === 'handhold' });
    const anchor = held === 'braced' || held === 'buddy' ? 'planted' : held === 'boots' ? 'magBoots' : 'light';
    return Object.freeze({ ...base, mode: 'bound', anchor, hold: held === 'boots' || held === 'braced' || held === 'buddy' ? held : 'feet' });
  }
  if (held === 'braced' || held === 'buddy') return Object.freeze({ ...base, mode: 'braced', anchor: 'braced', hold: held });
  if (held === 'boots') return Object.freeze({ ...base, mode: 'magWalk', anchor: 'magBoots', hold: 'boots' });
  if (held === 'tether') return Object.freeze({ ...base, mode: 'handhold', anchor: 'handhold', hold: 'tether' });
  if (held === 'handhold') return Object.freeze({ ...base, mode: 'handhold', anchor: 'handhold', hold: 'handhold', oneHand: true });
  return Object.freeze({ ...base, mode: 'float', anchor: 'floating', hold: 'none' });
}

/** A person's footing now (see the header): { mode, anchor, hold, gG, regime, surface, ferrous, grip, oneHand, placed }. */
export function footingOf(state, pid) {
  const a = actorOf(state, pid);
  if (!a || !state?.places?.live?.area) return UNPLACED;
  return footingAt(state, pid, a, 0);
}

/**
 * Take an anchor, or let go of it with kind null (see the header). Writes actor.anchor, anchorRef and anchorAt.
 * Returns { ok, why }: why 'no mag boots on', 'no ferrous plate underfoot', 'no deck under the boots', DRIFT_WHY, 'nothing to
 * hold here', 'no one to brace you' or 'no such anchor' when the place or the kit refuses it (nothing written).
 */
export function setAnchor(state, pid, kind, { ref = null, via = null } = {}) {
  const a = actorOf(state, pid);
  if (!a) return { ok: false, why: 'no actor' };
  if (!kind) { delete a.anchor; delete a.anchorRef; delete a.anchorAt; delete a.anchorVia; offDeckhead(state, pid, a); return { ok: true, why: null }; }
  if (!ANCHOR_KINDS.includes(kind)) return { ok: false, why: 'no such anchor' };
  if (kind === 'boots') {
    if (!bootsOf(state, pid)) return { ok: false, why: 'no mag boots on' };
    if (!surfaceAt(state, null, a.x, a.z).ferrous) return { ok: false, why: 'no ferrous plate underfoot' };
    if ((liveEnvOf(state)?.profile?.lat ?? 0) > GRAV_BODY.BOOTS_SHEAR_G) return { ok: false, why: BOOTS_SHEAR_WHY };
    if (offDeck(state, a) || drifting(state, a)) return { ok: false, why: 'no deck under the boots' };
  } else if ((kind === 'handhold' || kind === 'tether' || kind === 'braced') && drifting(state, a)) {
    return { ok: false, why: DRIFT_WHY };
  } else if (kind === 'handhold' || kind === 'tether') {
    // (a hold or a pad-eye in reach (model.js holdNear: the area's rule, else the grip underfoot); a lanyard clips to a pad-eye)
    if (!holdNear(state, a.x, a.z, FOOTING.REACH_M, { kind: kind === 'tether' ? 'padEye' : null })) return { ok: false, why: kind === 'tether' ? 'no pad-eye in reach' : 'nothing to hold here' };
  } else if (kind === 'braced') {
    if (!wedgeFits(state, a.x, a.z)) return { ok: false, why: 'no passage to wedge across' };
  } else if (kind === 'buddy') {
    const b = actorOf(state, ref);
    if (!b || ref === pid || buddyGapM(state, a, b, via) > FOOTING.BUDDY_M + 1e-9) return { ok: false, why: 'no one to brace you' };
  }
  a.anchor = kind;
  if (kind === 'buddy') a.anchorRef = ref; else delete a.anchorRef;
  if (kind === 'buddy' && via) a.anchorVia = via; else delete a.anchorVia;
  if (kind === 'boots') delete a.anchorAt; else a.anchorAt = [q(a.x, 0.001), q(a.z, 0.001)];
  if (kind !== 'boots') offDeckhead(state, pid, a);
  stilled(state, a, kind);
  return { ok: true, why: null };
}
// (off the boots on the deckhead with no face being changed, the body leaves the face (see the header))
function offDeckhead(state, pid, a) { if (a.onFace === 'deckhead' && !a.faceTo) setOnFace(state, pid, null); }

/** The mag boots' extra hold on the floor, N (BODY §16.6: one boot always locked as you walk), 0 unless they are locked and holding on a ferrous face. */
export function bootsHoldN(state, pid, x, z) {
  // (the boots' slot read first: every mover's legs ask, and nobody shipped wears them)
  if (!state.people?.[pid]?.kit?.worn?.boots) return 0;
  return bootsLocked(state, pid) && state.places?.live?.area && surfaceAt(state, null, x, z).ferrous ? MAG_BOOTS.HOLD_N : 0;
}

/** The gaits on locked mag boots (BODY §16.6): the walk MAG_BOOTS.WALK_MS (the stroll no faster), no run or sprint, mode 'magWalk'. g: motion.js gaitsOf's. */
export function magGaits(g) {
  const w = MAG_BOOTS.WALK_MS;
  return { ...g, strollMs: Math.min(g.strollMs, w), walkMs: w, runMs: w, sprintMs: w, runOk: false, sprintOk: false, mode: 'magWalk' };
}

/** BODY §22's gravity regime row on a roll of skill (see the header), zerog the roller's Zero-g (null: the person's, read when it matters): [] or one { why, v, src: 'env' }. */
export function footingMods(state, pid, skill, zerog = null) {
  if (FOOTING.OWN_SKILLS.includes(skill)) return NONE;
  const F = footingOf(state, pid);
  if (!F.placed || F.gG === null || F.gG >= FOOTING.LOWG_BELOW_G) return NONE;
  const M = FOOTING.MOD, uses = SKILLS[skill]?.uses ?? ['all'];
  let base = 0, why = null;
  if (F.gG >= GAIT_G.FLOAT_BELOW_G) {
    if (FOOTING.LOWG_SKILLS.includes(skill)) { base = M.lowG; why = 'low g'; }
  } else if (uses.includes('all') || uses.some(u => FOOTING.FREE_USES.includes(u))) {
    if (F.anchor === 'floating') { base = M.floating; why = 'free fall, unanchored'; }
    else if (F.anchor === 'magBoots' || F.anchor === 'handhold') { base = M.anchored; why = F.hold === 'boots' ? 'free fall, on mag boots' : F.hold === 'tether' ? 'free fall, on a lanyard' : 'free fall, a hand on a hold'; }
    else { base = M.braced; why = 'free fall, braced'; }
  } else if (uses.includes('hands') && (F.anchor === 'floating' || F.oneHand)) { base = M.work; why = 'free fall, no foot restraint'; }
  if (!base) return NONE;
  const zg = zerog ?? valueOf(state, pid, 'zerog'), v = mitigated(base, zg, FOOTING.ZEROG_FULL_AT, FOOTING.ZEROG_KEEP);
  return v ? [{ why: zg > 0 ? `${why} (Zero-g ${zg})` : why, v, src: 'env' }] : NONE;
}
// (no entry: one frozen empty list, the roller spreads it into its own)
const NONE = Object.freeze([]);

/** What kneeling or lying at a point leaves on the hands (see the header): { k, why } or null indoors. */
export function groundSoilOf(state, area, x, z) {
  const a = areaOf(area);
  if (a?.kind !== 'ground') return null;
  const id = groundSurfaceOf(area), row = SURFACES[id];
  if (!row) throw new Error(`footing: the ground '${area}' names no known surface ('${id}')`);
  const k = Math.round(HANDS.REGOLITH * row.dust * 10) / 10;
  return k > 0 ? { k, why: row.soilWord } : null;
}

// ---- the anchors the place gives, and why a move cannot start (v0.0.24's step 5; see the header) ----

/** Whether a wedge fits across the body's place (model.js passageAt): a passage FOOTING.WEDGE_M wide. */
export function wedgeFits(state, x, z) {
  const p = passageAt(state, x, z), [lo, hi] = FOOTING.WEDGE_M;
  return !!p && p.widthM >= lo - 1e-9 && p.widthM <= hi + 1e-9;
}
/**
 * The anchors a floating body can take where it is, best first by COMBAT §14.8's table (see the header): [{ kind, step, ok, why }],
 * kind setAnchor's, step the panel's row ('anchor:wedge', 'boots:lock', 'anchor:clip', 'anchor:hold'), ok whether the place and
 * the kit allow it now, why the reason when not. [] where the body does not float (at 0.05 G and up, or held already).
 */
export function anchorOffers(state, pid) {
  const a = actorOf(state, pid);
  if (!a || !state?.places?.live?.area) return [];
  const F = footingAt(state, pid, a, 0);
  if (F.mode !== 'float') return [];
  const out = [], moving = drifting(state, a);
  // (drifting, no step takes an anchor (see the header): the wedge, the lanyard and the hold are the grab's, the boots the deck's)
  const by = (ok, why) => (moving ? { ok: false, why: DRIFT_WHY } : { ok, why });
  out.push({ kind: 'braced', step: 'anchor:wedge', ...by(wedgeFits(state, a.x, a.z), 'no passage 0.8 to 1.2 m wide') });
  if (bootsOf(state, pid)) { const why = bootsLockWhy(state, pid); out.push({ kind: 'boots', step: 'boots:lock', ok: !why, why: why ?? 'no steel underfoot' }); }
  out.push({ kind: 'tether', step: 'anchor:clip', ...by(!!holdNear(state, a.x, a.z, FOOTING.REACH_M, { kind: 'padEye' }), 'no pad-eye in reach') });
  out.push({ kind: 'handhold', step: 'anchor:hold', ...by(!!holdNear(state, a.x, a.z, FOOTING.REACH_M), 'nothing to hold in reach') });
  return out.map(o => (o.ok ? { ...o, why: null } : o));
}
/**
 * Why a move cannot start here (see the header), or null where the legs can push: under 0.05 G a body walks only on locked mag
 * boots (magWalk); everywhere else the gravity holds the feet (a bound or a walk).
 */
export function noFootingWhy(state, pid) {
  const a = actorOf(state, pid);
  if (!a || !state?.places?.live?.area) return null;
  const F = footingAt(state, pid, a, 0);
  if (F.gG === null || F.gG >= GAIT_G.FLOAT_BELOW_G || F.mode === 'magWalk' || F.mode === 'couched') return null;
  if (bootsOf(state, pid) && !bootsLockWhy(state, pid)) return 'no footing: lock your boots';
  if (F.hold === 'handhold') return 'no footing: push off from the hold';
  if (F.mode === 'handhold' || F.mode === 'braced') return 'no footing: let go to push off';
  if (drifting(state, a)) return 'no footing: drifting, grab a hold (L)';
  return 'no footing: take a hold';
}
/** What a viewer sees of a person's anchor (see the header): null | 'hold' | 'lanyard' | 'wedge' | 'buddy' | 'boots'; the record checked against the place as the footing checks it, at any gravity. */
export function gearAnchorOf(state, pid) {
  const a = actorOf(state, pid), k = a?.anchor;
  // (the user's score of test-burn: strapped into a rack or a couch (profile.js setStrapped) shows as the harness, whatever else holds)
  if (a?.strapped) return 'straps';
  if (!k) return null;
  if (k === 'boots') return bootsOf(state, pid) ? 'boots' : null;
  if (!(k === 'buddy' && a.anchorVia) && !stillAt(a)) return null;
  if (k === 'buddy') { const b = actorOf(state, a.anchorRef); if (!b || buddyGapM(state, a, b, a.anchorVia) > FOOTING.BUDDY_M + 1e-9) return null; }
  return ANCHOR_SEEN[k] ?? null;
}
/** The hold a person's hand is on (a hold or a lanyard taken and still held): { x, z, kind } by model.js holdNear's arithmetic, or null. */
export function anchorHoldOf(state, pid) {
  const a = actorOf(state, pid), k = a?.anchor;
  if ((k !== 'handhold' && k !== 'tether') || !stillAt(a)) return null;
  return holdNear(state, a.anchorAt[0], a.anchorAt[1], FOOTING.REACH_M, { kind: k === 'tether' ? 'padEye' : null });
}

// ---- v0.0.25, the face a body stands on (see the header) ----

/** The faces a person may stand on this round (COMBAT §14.8: the deck and the deckhead; the boards' six are arms/turners.js'). */
export const PEOPLE_FACES = Object.freeze(['deck', 'deckhead']);
/** The ceiling over a point of the live area (m): its room's ceilingM, or null where the room names none (every shipped indoor area but Echo's, Well A's and the Wreck's). */
export function ceilingAt(state, x, z) {
  const r = roomOf(state?.places?.live?.area, x, z);
  return Number.isFinite(r?.ceilingM) ? r.ceilingM : null;
}
// (a body's free-fall height on the deckhead: the ceiling less a standing man's centre, to the millimetre)
const deckheadY = (state, a) => q((ceilingAt(state, a.x, a.z) ?? 0) - FREEFALL.FLOAT_Y_M, 0.001);
/** The face a person stands on (see the header): 'deck' (actor.onFace absent) or 'deckhead'. */
export const onFaceOf = (state, pid) => actorOf(state, pid)?.onFace ?? 'deck';
/** Whether the live area has faces a person may stand on but the deck (see the header): a decked area's (its `decks`, the Wreck's). */
export const facesHere = (state) => !!areaOf(state?.places?.live?.area)?.decks?.length;
/**
 * The face a person stands on, written (see the header; the field's one writer): 'deckhead' sets actor.onFace and floatY at the
 * ceiling less FLOAT_Y_M; 'deck' clears both (the soles on the plate); null leaves the face for free fall (onFace cleared, floatY
 * kept: the body floats where it was). The deckhead is refused off a decked area ('no deckhead here') and where there is no deckhead
 * in reach (no ceiling, or one over VOID.PUSH_LOW_CEIL_M: a taller compartment keeps the float's height only). Returns { ok, why }.
 * The anchor is the caller's (lockOnFace takes both).
 */
export function setOnFace(state, pid, onFace) {
  const a = actorOf(state, pid);
  if (!a) return { ok: false, why: 'no actor' };
  if (onFace === null) { delete a.onFace; return { ok: true, why: null }; }
  if (!PEOPLE_FACES.includes(onFace)) return { ok: false, why: 'no such face' };
  if (onFace === 'deck') { delete a.onFace; delete a.floatY; return { ok: true, why: null }; }
  if (!facesHere(state)) return { ok: false, why: 'no deckhead here' };
  const c = ceilingAt(state, a.x, a.z);
  if (c === null || c > VOID.PUSH_LOW_CEIL_M + 1e-9) return { ok: false, why: 'no deckhead in reach' };
  a.onFace = onFace;
  a.floatY = deckheadY(state, a);
  return { ok: true, why: null };
}
/**
 * A face change's end (see the header): the boots locked on the face they go to, checked first (worn, steel there, no drift: the
 * reasons setAnchor gives), the face written only then (setOnFace) and the boots locked on it. Refused, nothing is written: the body
 * keeps the face it had. Returns { ok, why }.
 */
export function lockOnFace(state, pid, onFace) {
  const a = actorOf(state, pid);
  if (!a) return { ok: false, why: 'no actor' };
  if (!bootsOf(state, pid)) return { ok: false, why: 'no mag boots on' };
  if (!surfaceAt(state, null, a.x, a.z).ferrous) return { ok: false, why: 'no ferrous plate underfoot' };
  if (drifting(state, a)) return { ok: false, why: 'no deck under the boots' };
  const was = { onFace: a.onFace, floatY: a.floatY }, f = setOnFace(state, pid, onFace);
  if (!f.ok) return f;
  const r = setAnchor(state, pid, 'boots');
  // (refused all the same: the face put back as it was, nothing recorded standing where the boots hold nothing)
  if (!r.ok) for (const k of ['onFace', 'floatY']) { if (was[k] === undefined) delete a[k]; else a[k] = was[k]; }
  return r;
}
// (a bulkhead hatch's head (see the header): the strips of a decked area's hatch leaves, kept by area record)
const HEADS = new WeakMap();
const headsOf = (area) => { let r = HEADS.get(area); if (!r) HEADS.set(area, (r = (area?.openings ?? []).filter(o => o.leaf === 'hatch').map(leafRect))); return r; };
/** The gap from a point to the nearest bulkhead hatch's head of the live area (m; see the header), Infinity where it has none. */
export function hatchHeadGapM(state, x, z) {
  const area = areaOf(state?.places?.live?.area);
  if (!area?.decks?.length) return Infinity;
  let gap = Infinity;
  for (const R of headsOf(area)) gap = Math.min(gap, Math.hypot(Math.max(R.x0 - x, 0, x - R.x1), Math.max(R.z0 - z, 0, z - R.z1)));
  return gap;
}
/**
 * A body's vertical frame (see the header): { base, span, inv }, its span SPAN_M[stance] from `base` (m over the deck), `inv` head
 * down. On the deck base is the floor it stands on (actor.y), lifted by its float over FLOAT_Y_M while it floats; on the deckhead the
 * ceiling less the span's top. The deck's arithmetic is the hit model's and the blast's as built (base actor.y + 0).
 */
export function spanFrameOf(state, a) {
  const span = SPAN_M[a?.stance ?? 'stand'] ?? SPAN_M.stand;
  if (a?.onFace === 'deckhead') {
    const c = ceilingAt(state, a.x, a.z) ?? (a.floatY ?? FREEFALL.FLOAT_Y_M) + FREEFALL.FLOAT_Y_M;
    return { base: c - span[1], span, inv: true };
  }
  const lift = Number.isFinite(a?.floatY) ? a.floatY - FREEFALL.FLOAT_Y_M : 0;
  return { base: (a?.y ?? 0) + lift, span, inv: false };
}
/** A body's height span (m over the deck), [y0M, y1M]: the one helper (see the header). */
export function bodySpanOf(state, a) {
  const F = spanFrameOf(state, a);
  return [F.base + F.span[0], F.base + F.span[1]];
}
/** The face a person's boots are going to while a face is changed (actor.faceTo: the rows' and the beats'), or null. */
export const faceChangeOf = (state, pid) => { const a = actorOf(state, pid); return a?.faceTo ? { from: a.onFace ?? 'deck', to: a.faceTo } : null; };
/** A body in a deck hatch's trunk is within this of one of its ends' centres, metres: places/hatch.js HATCH_REACH_M, the transit's own reach (one figure; v0.0.25's review). */
export const TRUNK_REACH_M = HATCH_REACH_M;
/**
 * Two bodies' gap in the plan (m), the brace's reach (see the header): with no hatch named, the plan's; through a deck hatch (via its
 * id), the holder's reach to the scuttle he holds you through, his gap to its end on his deck (your harness is in the scuttle, your
 * body past it on the other face), while you are in the trunk (within TRUNK_REACH_M of its other end); Infinity out of it.
 */
export function buddyGapM(state, a, b, via = null) {
  const d0 = Math.hypot(b.x - a.x, b.z - a.z), h = via ? hatchOf(state, via) : null;
  if (!h?.far) return d0;
  const ends = [h.at, h.far.at], dist = (p, e) => Math.hypot(p.x - e[0], p.z - e[1]);
  const eb = dist(b, ends[0]) <= dist(b, ends[1]) ? 0 : 1, ea = 1 - eb;
  if (dist(a, ends[ea]) > TRUNK_REACH_M + 1e-9 && dist(a, ends[eb]) > TRUNK_REACH_M + 1e-9) return Infinity;
  return Math.min(d0, dist(b, ends[eb]));
}
