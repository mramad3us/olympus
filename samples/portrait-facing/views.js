// OLYMPUS sample data: a man turned on the portrait, and the card's renderer, as rows the game's code draws (samples/portrait-facing; the build sheet v0.0.23 §0 item 26, item 4).
//
// The portrait is drawn from your eye (src/sim/people/seen.js seenOf's facing: front within FACING_FRONT_RAD of you, back beyond
// FACING_BACK_RAD, left or right between). F is how a man turned is drawn, the doll's facing (src/art/doll/doll.js doll({ facing })):
// F1 from behind (A's src/art/doll/back.js: the back of the head or helmet, the carrier's back panel, the rifle on the back whole,
// no hands; the default for 'back'), F2 in profile (a candidate drawing: the head turned its most, the body narrower about its
// middle, doll.js PROFILE_K), F3 front on with the head and the gun's line turned (the default for a side until F2 is scored). R is
// the card's body for a man with no marks on him: R1 the doll (the default, the card the user starred), R2 the stage's figure drawn
// finer (src/art/figures/compose.js composeFrame at stage.ppm), R3 the stage's own cell blown up stage.k times, nearest. R2 and R3
// cannot carry the marks at life size (the chibi's head spans 1.0 to 1.75 m), so they would be for an unmarked man only. Pure data.

/** F: a man turned. */
export const FACING = Object.freeze([
  Object.freeze({ id: 'F1', name: 'from behind', rec: Object.freeze({ facing: 'back', hold: Object.freeze({ how: 'rifle-low' }) }) }),
  Object.freeze({ id: 'F2', name: 'in profile', rec: Object.freeze({ facing: 'profile', hold: Object.freeze({ how: 'rifle-aim' }), aimAt: 'away' }) }),
  Object.freeze({ id: 'F3', name: 'front on, his head turned', rec: Object.freeze({ facing: 'right', hold: Object.freeze({ how: 'rifle-aim' }), aimAt: 'away' }) }),
]);
/** R: the card's renderer for a man with no marks on him. */
export const RENDERER = Object.freeze([
  Object.freeze({ id: 'R1', name: 'the doll', doll: true }),
  Object.freeze({ id: 'R2', name: "the stage's figure, finer", stage: Object.freeze({ ppm: 48, frame: 'aim', dir: 'down' }) }),
  Object.freeze({ id: 'R3', name: "the stage's own cell, ×4", stage: Object.freeze({ ppm: 16, k: 4, frame: 'aim', dir: 'down' }) }),
]);
/** The groups as the sample shows them (the default of each first). */
export const GROUPS = Object.freeze({ F: FACING, R: RENDERER });
