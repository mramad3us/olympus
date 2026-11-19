// OLYMPUS sample data: "A man in the bang", the role-player's daze and cower as candidates (samples/breach-poses; the build sheet
// v0.0.26 §10, items 6 and 8 of its items as built, §11 risk 1).
//
// "Bang, then go" (v0.0.26) puts two role-players in room 1 of the Wheel's house 1 and a G-11 through its door. A man the bang
// startles, stuns or blinds is DAZED; a man whose nerve fails freezes, COWERING. The stage has no frame for either today (a dazed
// man is drawn as whatever his record says he does, a frozen one kneeling), so these are the candidates, each a pose written
// outright in the figure engine's own terms (src/art/figures/poses.js's header: stance, legs and arms as [hip, knee, abduction] and
// [shoulder, elbow, abduction], lean, bob, head, headDrop; the rig, compose.js RIGS, for the rifle; `reach`, a free hand put on a
// point [forward, left, up] metres from the shoulders' middle by the rig's IK, as samples/held-devices' candidates do) and drawn by
// the game's own compose.js and shade.js, and the target card's bend for the same man (src/art/doll/doll.js POSE_BENDS' shape:
// `drop` reference rows, each leg's thigh and shin shares, `lean`, `arms` the fists' places [columns from the middle, a row]),
// drawn by the game's doll. The game builds the defaults (D-a, C-a) until the user scores; a pick is one row lifted into
// poses.js (the stage's frame) and doll.js POSE_BENDS (the card's). Pure data.
//
// The rifle: the rifle pool's atlas sheet is full (§11 risk 1), so the game's daze and cower are carry-free frames at the arms
// band's end (as handsUp is), the rifle drawn at the frame's hand point; the candidates here draw it with the figure's own rigs
// (the hip's hang, the low ready, slung in front, across the lap), which is where the game will put it.

// (the standing body of a man hunched by the bang: the knees a little bent, the torso forward; poses.js STAND_EASY's feet apart)
const HUNCH_LEGS = Object.freeze({ r: Object.freeze([0.3, 0.55, 0.08]), l: Object.freeze([0.18, 0.4, 0.07]) });
// (a deep crouch on both soles, the knees to the chest)
const CROUCH_LEGS = Object.freeze({ r: Object.freeze([1.85, 2.45, 0.14]), l: Object.freeze([1.85, 2.45, 0.14]) });

/** D: the daze (startled, stunned or flash-blind), each with its sway (VIEWS §3.4: 1 px down at 1.5 Hz, none under "reduce flashes"). */
export const DAZE = Object.freeze([
  Object.freeze({
    id: 'D-a', name: 'hunched, the support hand to the eyes, the rifle hanging muzzle down in the firing hand',
    stage: Object.freeze({ lean: 0.38, headDrop: 1, legs: HUNCH_LEGS, rig: Object.freeze({ mode: 'hip', gun: 'rifle' }), reach: Object.freeze({ r: Object.freeze([0.06, -0.15, -0.33]), l: Object.freeze([0.15, 0.0, 0.27]) }) }),
    card: Object.freeze({ hold: 'rifle-low', bend: Object.freeze({ drop: 5, legs: Object.freeze({ r: Object.freeze([0.95, 'fit']), l: Object.freeze([0.95, 'fit']) }), arms: Object.freeze({ bendL: Object.freeze([0.5, 15]) }) }) }),
  }),
  Object.freeze({
    id: 'D-b', name: 'hunched, the head turned away, the rifle at the low ready, the support forearm across the face',
    stage: Object.freeze({ lean: 0.32, head: 'turn', headDrop: 1, legs: HUNCH_LEGS, rig: Object.freeze({ mode: 'low', gun: 'rifle', oneHand: true }), reach: Object.freeze({ l: Object.freeze([0.17, -0.08, 0.25]) }) }),
    card: Object.freeze({ hold: 'rifle-low', facing: 'right', bend: Object.freeze({ drop: 5, legs: Object.freeze({ r: Object.freeze([0.95, 'fit']), l: Object.freeze([0.95, 'fit']) }), arms: Object.freeze({ bendL: Object.freeze([-2, 15]) }) }) }),
  }),
]);
/** C: the cower (frozen: COMBAT §7.11's freeze, read COWERING). */
export const COWER = Object.freeze([
  Object.freeze({
    id: 'C-a', name: 'crouched, the arms over the head, the rifle hugged to the chest, the card as C1',
    stage: Object.freeze({ lean: 0.55, headDrop: 2, legs: CROUCH_LEGS, rig: Object.freeze({ mode: 'front', gun: 'rifle' }), reach: Object.freeze({ r: Object.freeze([0.02, -0.16, 0.3]), l: Object.freeze([0.02, 0.16, 0.3]) }) }),
    card: Object.freeze({ hold: 'empty', front: true, pose: 'cower' }),
  }),
  Object.freeze({
    id: 'C-b', name: 'down into the corner, the back half turned, the rifle across the knees',
    stage: Object.freeze({ stance: 'sit', ground: 'pelvis', lean: 0.42, head: 'turn', headDrop: 2, legs: Object.freeze({ r: Object.freeze([1.9, 2.1, 0.2]), l: Object.freeze([1.9, 2.1, 0.2]) }), rig: Object.freeze({ mode: 'lap', gun: 'rifle' }), reach: Object.freeze({ r: Object.freeze([0.24, -0.1, -0.18]), l: Object.freeze([0.24, 0.1, -0.18]) }) }),
    card: Object.freeze({ hold: 'rifle-low', facing: 'left', bend: Object.freeze({ drop: 66, legsOver: true, lap: true, lean: 0.12, legs: Object.freeze({ r: Object.freeze([0, 0.9, 104]), l: Object.freeze([0, 0.9, 104]) }), arms: Object.freeze({ bendR: Object.freeze([10, 34]), bendL: Object.freeze([10, 34]) }) }) }),
  }),
]);
/** The groups as the sample shows them (the default of each first). */
export const GROUPS = Object.freeze({ D: DAZE, C: COWER });
export const DEFAULTS = Object.freeze({ D: 'D-a', C: 'C-a' });
