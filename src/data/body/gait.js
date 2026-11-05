// OLYMPUS data: the stride's ring, the one number the sim's walk and the view's frames share.
//
// The sim counts the metres an actor walks in actor.strideM (src/sim/places/move.js), and the view
// picks a walk, run or bound frame from it (src/art/figures/poses.js gaitFrame: one frame per STEP_M,
// 0.16, 0.45 and 0.7 m, four frames a cycle, so the cycles are 0.64, 1.8 and 2.8 m). The count wraps
// at STRIDE_WRAP_M 201.6 m, which each of those cycles divides (315, 112 and 72 of them: my call), so a
// wrap never jumps a frame. It is here, in data, because both sides read it: the sim may not import
// the view's modules, nor the view the sim's movement (TECH §2.2), and one quantity has one number
// (the hub: one shared helper). tests/places-move checks the divisions.

/** The ring the metres walked wrap at (metres). */
export const STRIDE_WRAP_M = 201.6;
