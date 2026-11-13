// OLYMPUS data: the stride's ring and the gait phase's steps, the numbers the sim's walk and the view's frames share.
//
// The sim counts the metres an actor walks in actor.strideM (src/sim/places/move.js), and the view
// picks a walk, run or bound frame from it (src/art/figures/poses.js gaitFrame: one frame per STEP_M,
// 0.16, 0.45 and 0.7 m, four frames a cycle, so the cycles are 0.64, 1.8 and 2.8 m). The count wraps
// at STRIDE_WRAP_M 201.6 m, which each of those cycles divides (315, 112 and 72 of them: my call), so a
// wrap never jumps a frame. It is here, in data, because both sides read it: the sim may not import
// the view's modules, nor the view the sim's movement (TECH §2.2), and one quantity has one number
// (the hub: one shared helper). tests/places-move checks the divisions.
//
// The gait phase (BODY §16.8; VIEWS §3.10.2, the rework's stage R2): every mover's record carries `gp`, the steps
// taken, wrapping at GP_WRAP 2 (the right foot leading in [0, 1), the left in [1, 2)), advanced each tick by the
// metres moved over the step of the band in use (src/sim/body/loco.js stepMOf). A step is the walk cycle's planted
// travel S (STEP_PX, the candidates' feet as VIEWS §3.10.4 draws them at STEP_PPM 16 px/m) plus, in a gait with
// flight, the metres flown: at or above LOPE_FROUDE 0.5 (BODY §16.1's line, v² / (g × leg), the leg LEG_K 0.53 of
// the height) a walk-type gait lopes, taking off at LOPE_VZ_MS 0.5 m/s, and the run always flies, at RUN_VZ_MS
// 0.9 m/s; the flight is 2 vz / g, so the same legs skim on Earth, lope on Mars and bound on Europa with no constant
// a place (my calls, BODY §16.8). CYCLE names the candidate the game plays until the user's score (VIEWS §3.10.4's
// default, B); the others stay listed so the pick swaps in by one constant.

/** The ring the metres walked wrap at (metres). */
export const STRIDE_WRAP_M = 201.6;
/** The gait phase wraps at this many steps (two: a stride, right foot then left). */
export const GP_WRAP = 2;
/** The walk cycle in use (VIEWS §3.10.4: 'A', 'B' or 'C'; B until the user's score). */
export const CYCLE = 'B';
/** Each candidate's planted travel S a step, pixels at STEP_PPM, by band (walk: Relaxed; combat: the glide; assault; run). */
export const STEP_PX = Object.freeze({
  A: Object.freeze({ walk: 5, combat: 4, assault: 5, run: 5 }),
  B: Object.freeze({ walk: 6, combat: 6, assault: 7, run: 7 }),
  C: Object.freeze({ walk: 5, combat: 5, assault: 6, run: 5 }),
});
/** The density STEP_PX is drawn at (px/m). */
export const STEP_PPM = 16;
/** Flight (BODY §16.8): a walk-type gait lopes from this Froude number; the take-off speeds of the lope and the run (m/s); the leg's share of the height. */
export const LOPE_FROUDE = 0.5, LOPE_VZ_MS = 0.5, RUN_VZ_MS = 0.9, LEG_K = 0.53;
/** The height a leg is read from when the person's record gives none (m). */
export const REF_HEIGHT_M = 1.75;
/** The body's yaw turns 90° in TURN_OPERATOR_S at the fastest pace and TURN_RECRUIT_S at pace 1 (BODY §16.8; my calls). */
export const TURN_OPERATOR_S = 0.25, TURN_RECRUIT_S = 0.4;
