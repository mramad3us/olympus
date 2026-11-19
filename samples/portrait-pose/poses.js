// OLYMPUS sample data: the portrait's poses and holds, as rows the game's doll draws (samples/portrait-pose; the build sheet v0.0.23 §0 item 26, items 4 and 5).
//
// The user's note of 2026-11-17: "the portraits need to be more dynamic and show us what we would be seeing, including what they are
// holding". Each candidate is a record as src/sim/people/seen.js seenOf gives it (its pose, its hold's how, where it aims) and, where a
// candidate is a new drawing, the bend or the place outright: the doll draws it with src/art/doll/doll.js doll({ ...dressOf(gear,
// person, { rec }), bend }) (POSE_BENDS' shape for a bend: the body set down `drop` reference rows, each leg's thigh and shin at a
// share, the legs over or under the body, `lean` a shear, `arms` the fists' places; worn.js holdGear's places for a hold's `place`).
// The game draws the defaults (the first of each group, portrait.js PORTRAIT_PICKS) until the user scores; a pick is one line of the
// table lifted into doll.js POSE_BENDS or portrait.js's places. Pure data.

/** A: a rifle aimed at you. A1 end on, the muzzle a ring of steel at the chest, the optic over it (the default); A2 canted a quarter turn, the rifle across the chest toward the viewer's right so its length shows. */
export const AIM = Object.freeze([
  Object.freeze({ id: 'A1', name: 'end on, the muzzle a ring at his chest', rec: Object.freeze({ pose: 'stand', hold: Object.freeze({ how: 'rifle-aim' }), aimAt: 'you' }) }),
  Object.freeze({ id: 'A2', name: 'canted, the rifle across his chest', rec: Object.freeze({ pose: 'stand', hold: Object.freeze({ how: 'rifle-aim', place: 'aimAway' }), aimAt: 'away' }) }),
]);
/** P: a pistol aimed at you. P1 both arms out, the slide end on (the default); P2 cupped at the chest, the muzzle at you. */
export const PISTOL = Object.freeze([
  Object.freeze({ id: 'P1', name: 'both arms out, the slide end on', rec: Object.freeze({ pose: 'stand', hold: Object.freeze({ how: 'pistol-aim' }), aimAt: 'you' }) }),
  Object.freeze({ id: 'P2', name: 'cupped at the chest', rec: Object.freeze({ pose: 'stand', hold: Object.freeze({ how: 'pistol-aim', place: 'cupped' }), aimAt: 'you' }) }),
]);
/** K: kneeling (one candidate, a check): K1 on the right knee, the left foot planted, aimed. */
export const KNEEL = Object.freeze([
  Object.freeze({ id: 'K1', name: 'on the right knee, aimed', rec: Object.freeze({ pose: 'kneel', hold: Object.freeze({ how: 'rifle-aim' }), aimAt: 'you' }) }),
]);
/** D: down, ruled out and sitting where he is. D1 sitting, the rifle across the knees (the default, as the stage's sitLow); D2 slumped on his side. */
export const DOWN = Object.freeze([
  Object.freeze({ id: 'D1', name: 'sitting, the rifle across his knees', rec: Object.freeze({ pose: 'sit', hold: Object.freeze({ how: 'rifle-low' }) }) }),
  Object.freeze({ id: 'D2', name: 'slumped on his side', rec: Object.freeze({ pose: 'sit', hold: Object.freeze({ how: 'rifle-low' }) }),
    bend: Object.freeze({ drop: 70, legsOver: true, lap: true, lean: 0.32, legs: Object.freeze({ r: Object.freeze([0, 0.75, 108]), l: Object.freeze([0, 0.6, 113]) }), arms: Object.freeze({ bendR: Object.freeze([16, 40]), bendL: Object.freeze([6, 44]) }) }) }),
]);
/** C: cowering (a check): C1 crouched, the fists at the head's sides. */
export const COWER = Object.freeze([
  Object.freeze({ id: 'C1', name: 'crouched, the fists at his head', rec: Object.freeze({ pose: 'cower', hold: Object.freeze({ how: 'empty' }) }) }),
]);
/** Y: you on the C card, as in a mirror (a check of the I and C cards; Y-p the prone the game draws, the default of its own question). */
export const YOU = Object.freeze([
  Object.freeze({ id: 'Y-k', name: 'kneeling, the rifle at the low ready', rec: Object.freeze({ pose: 'kneel', hold: Object.freeze({ how: 'rifle-low' }) }) }),
  Object.freeze({ id: 'Y-g', name: 'a G-11 in the fist', rec: Object.freeze({ pose: 'stand', hold: Object.freeze({ how: 'device' }) }), device: Object.freeze({ shape: 'can', colour: 'olive', model: 'g11' }) }),
  Object.freeze({ id: 'Y-12', name: 'the P-12 at the ready', rec: Object.freeze({ pose: 'stand', hold: Object.freeze({ how: 'pistol-ready' }) }) }),
  Object.freeze({ id: 'Y-p', name: 'prone, the head and shoulders behind the rifle, end on', rec: Object.freeze({ pose: 'prone', hold: Object.freeze({ how: 'rifle-aim' }), aimAt: 'you' }) }),
]);
/**
 * The P-12's stances (the user's note of 2026-11-17, after the sheet: "Holding the sidearm with the rifle dangling should be
 * redrawn, sidearm should have the same stances (low ready, high ready, aimed, etc) as the rifle"; the lead's names, sample
 * pistol-stances, E's): PS-a the low ready, PS-b the high ready, PS-c aimed, PS-d the hand at the holster, PS-e the admin (the
 * press check, the reload, the clearing); the stage's frame for each is poses.js's pistol band (PISTOL_FRAMES).
 */
export const PISTOL_STANCES = Object.freeze([
  Object.freeze({ id: 'PS-a', name: 'the low ready', rec: Object.freeze({ hold: Object.freeze({ how: 'pistol-ready' }) }), frame: 'pistolLow' }),
  Object.freeze({ id: 'PS-b', name: 'the high ready', rec: Object.freeze({ hold: Object.freeze({ how: 'pistol-high' }) }), frame: 'pistolHigh' }),
  Object.freeze({ id: 'PS-c', name: 'aimed', rec: Object.freeze({ hold: Object.freeze({ how: 'pistol-aim' }), aimAt: 'you' }), frame: 'pistolAimed' }),
  Object.freeze({ id: 'PS-d', name: 'the hand at the holster', rec: Object.freeze({ hold: Object.freeze({ how: 'pistol-draw' }) }), frame: 'pistolHolster' }),
  Object.freeze({ id: 'PS-e', name: 'the admin: the press check', rec: Object.freeze({ hold: Object.freeze({ how: 'pistol-check' }) }), frame: 'pistolCheck' }),
]);
/** The slung R-7 while the pistol is up (worn.js PISTOL_HANGS on the doll, compose.js's hang on the stage): RH1 across the chest, muzzle down (the default); RH2 on the strong-side hip; RH3 swung round to the back. */
export const RIFLE_HANGS = Object.freeze([
  Object.freeze({ id: 'RH1', name: 'across the chest, muzzle down', hang: 'RH1' }),
  Object.freeze({ id: 'RH2', name: 'on the strong-side hip', hang: 'RH2' }),
  Object.freeze({ id: 'RH3', name: 'swung round to the back', hang: 'RH3' }),
]);
/**
 * mag-boots' H (the anywhere round's: a body anchored): H-a the hand on a hold (the left arm up to a rail, the right on the rifle),
 * H-b the lanyard (a tether from the belt's left to an anchor below, drawn as a line of the strap's tone), H-c the wedge (a boot
 * under a rail, that knee bent): bends and lines the doll draws, E's pictures.
 */
export const ANCHORS = Object.freeze([
  Object.freeze({ id: 'H-a', name: 'the hand on a hold', rec: Object.freeze({ hold: Object.freeze({ how: 'rifle-low' }) }), arms: Object.freeze({ bendL: Object.freeze([10, 4]) }), rail: Object.freeze({ y: 2, x0: 36, x1: 56 }) }),
  Object.freeze({ id: 'H-b', name: 'the lanyard', rec: Object.freeze({ hold: Object.freeze({ how: 'rifle-low' }) }), line: Object.freeze({ from: [46, 60], to: [60, 132], colour: 0x2c2e38 }) }),
  Object.freeze({ id: 'H-c', name: 'the wedge', rec: Object.freeze({ hold: Object.freeze({ how: 'rifle-low' }) }),
    bend: Object.freeze({ drop: 6, legs: Object.freeze({ r: Object.freeze([1, 'fit']), l: Object.freeze([0.7, 'fit']) }) }), rail: Object.freeze({ y: 124, x0: 30, x1: 56 }) }),
]);
/** The groups as the sample shows them (the default of each first). */
export const GROUPS = Object.freeze({ A: AIM, P: PISTOL, K: KNEEL, D: DOWN, C: COWER, Y: YOU, PS: PISTOL_STANCES, RH: RIFLE_HANGS, H: ANCHORS });
