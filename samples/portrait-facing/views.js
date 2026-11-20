// OLYMPUS sample data: a man turned on the portrait, and the card's renderer, as rows the game's code draws (samples/portrait-facing; the build sheet v0.0.23 §0 item 26, item 4).
//
// The portrait is drawn from your eye (src/sim/people/seen.js seenOf's facing: front within FACING_FRONT_RAD of you, back beyond
// FACING_BACK_RAD, left or right between). F is how a man turned is drawn, the doll's facing (src/art/doll/doll.js doll({ facing })):
// F1 from behind (A's src/art/doll/back.js: the back of the head or helmet, the carrier's back panel, the rifle on the back whole,
// no hands; the default for 'back'), F4 a true profile (src/art/doll/side.js, the default for a side from v0.0.28; F2, the front
// squeezed, and F3, the head turned, withdrawn that round). R is
// the card's body for a man with no marks on him: R1 the doll (the default, the card the user starred), R2 the stage's figure drawn
// finer (src/art/figures/compose.js composeFrame at stage.ppm), R3 the stage's own cell blown up stage.k times, nearest. R2 and R3
// cannot carry the marks at life size (the chibi's head spans 1.0 to 1.75 m), so they would be for an unmarked man only. Pure data.

/** F: a man turned. */
export const FACING = Object.freeze([
  Object.freeze({ id: 'F1', name: 'from behind', rec: Object.freeze({ facing: 'back', hold: Object.freeze({ how: 'rifle-low' }) }) }),
  // (F2, in profile (the front squeezed narrow), and F3, front on with the head turned, withdrawn in v0.0.28 on the judge's pass of
  // 2026-11-20: "the head turned right or profile cards are low effort and terrible", the user's words; still drawable by their picks,
  // F3 the TODAY of F4's picture)
  // (v0.0.28, the user's note of 2026-11-20, "low effort and terrible ... make an effort for quality": src/art/doll/side.js)
  Object.freeze({ id: 'F4', name: 'a true profile, drawn side on', rec: Object.freeze({ facing: 'right', hold: Object.freeze({ how: 'rifle-aim' }), aimAt: 'away' }), picks: Object.freeze({ side: 'F4' }) }),
]);
/** F4's other holds and poses side on (the card at the near band): his facing, the record, the words. */
export const F4_MORE = Object.freeze([
  Object.freeze({ words: 'LOW READY · LEFT', gear: 'rifle', rec: Object.freeze({ facing: 'left', hold: Object.freeze({ how: 'rifle-low' }) }) }),
  Object.freeze({ words: 'P-12 AIMED · LEFT', gear: 'pistol', rec: Object.freeze({ facing: 'left', hold: Object.freeze({ how: 'pistol-aim' }), aimAt: 'away' }) }),
  Object.freeze({ words: 'KNEELING · RIGHT', gear: 'rifle', rec: Object.freeze({ facing: 'right', pose: 'kneel', hold: Object.freeze({ how: 'rifle-aim' }), aimAt: 'away' }) }),
  Object.freeze({ words: 'HIGH READY · RIGHT', gear: 'rifle', rec: Object.freeze({ facing: 'right', hold: Object.freeze({ how: 'rifle-high' }) }) }),
]);
/** R: the card's renderer for a man with no marks on him. */
export const RENDERER = Object.freeze([
  Object.freeze({ id: 'R1', name: 'the doll', doll: true }),
  Object.freeze({ id: 'R2', name: "the stage's figure, finer", stage: Object.freeze({ ppm: 48, frame: 'aim', dir: 'down' }) }),
  Object.freeze({ id: 'R3', name: "the stage's own cell, ×4", stage: Object.freeze({ ppm: 16, k: 4, frame: 'aim', dir: 'down' }) }),
]);
/** The groups as the sample shows them (the default of each first). */
export const GROUPS = Object.freeze({ F: FACING, R: RENDERER });
