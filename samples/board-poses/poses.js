// OLYMPUS sample data: "A man in a real fight", blind fire and a man down at 0 G as candidates (samples/board-poses; the build sheet
// v0.0.27 §10, item 16; SH§8, FT§11).
//
// "Away the boarding party" (v0.0.27) puts armed men who are not role-players on the Patient Mule's deck 2 at 0 G, each on locked mag
// boots. An irregular in cover may fire blind (COMBAT §7.11: the rifle over his cover, his head below it, FIRING BLIND on the plaque),
// and a man hit hangs from his locked boots where he stood (DOWN, at 0 G: no floor to fall to). The stage has neither frame today (a
// man in cover is drawn kneeling at the low ready; a man down is drawn sitting where he is), so these are the candidates, each a pose
// written outright in the figure engine's own terms (src/art/figures/poses.js's header: stance, legs and arms as [hip, knee, abduction],
// lean, head, headDrop; the rig, compose.js RIGS, for the rifle; `reach`, a free hand put on a point [forward, left, up] metres from
// the shoulders' middle by the rig's IK) and drawn by the game's own compose.js and shade.js, and the target card's bend for the same
// man (src/art/doll/doll.js POSE_BENDS' shape: `drop` reference rows, each leg's thigh and shin shares, `lean`, `arms` the fists'
// places [columns from the middle, a row]), drawn by the game's doll. The game builds the defaults (B-a, Z-a) until the user scores; a
// pick is one row lifted into poses.js (the stage's new frames, a band of the stance pool beside BANDS.stanceShock, never the arms
// band: v0.0.26 C's departure 1) and doll.js POSE_BENDS (the card's). Pure data.

// (a kneel behind cover: the right knee down, the left foot planted, as poses.js's kneel; and a man hanging slack from his boots, the
// knees a little loose, the feet still on the face)
const KNEEL_LEGS = Object.freeze({ r: Object.freeze([1.35, 2.2, 0.1]), l: Object.freeze([1.55, 1.75, 0.12]) });
const SLACK_LEGS = Object.freeze({ r: Object.freeze([0.22, 0.42, 0.16]), l: Object.freeze([0.12, 0.3, 0.2]) });
const CURL_LEGS = Object.freeze({ r: Object.freeze([1.7, 2.35, 0.12]), l: Object.freeze([1.7, 2.35, 0.12]) });

/** B: blind fire (COMBAT §7.11's irregular: the rifle over or round his cover, his eyes down, no take-in). */
export const BLIND = Object.freeze([
  Object.freeze({
    id: 'B-a', name: 'down behind cover, the rifle up over it, the head below',
    stage: Object.freeze({ stance: 'kneel', lean: 0.42, headDrop: 2, legs: KNEEL_LEGS, rig: Object.freeze({ mode: 'high', gun: 'rifle' }), reach: Object.freeze({ r: Object.freeze([0.12, -0.1, 0.42]), l: Object.freeze([0.3, 0.02, 0.48]) }) }),
    card: Object.freeze({ hold: 'rifle-high', bend: Object.freeze({ drop: 31, legs: Object.freeze({ r: Object.freeze([1, 0]), l: Object.freeze([0.25, 'fit']) }), arms: Object.freeze({ bendR: Object.freeze([6, -6]), bendL: Object.freeze([2, -9]) }) }) }),
  }),
  Object.freeze({
    id: 'B-b', name: 'side on to the cover, the rifle round its edge in one hand, the body behind it',
    stage: Object.freeze({ lean: 0.18, head: 'turn', headDrop: 1, legs: Object.freeze({ r: Object.freeze([0.4, 0.7, 0.1]), l: Object.freeze([0.25, 0.5, 0.08]) }), rig: Object.freeze({ mode: 'low', gun: 'rifle', oneHand: true }), reach: Object.freeze({ l: Object.freeze([0.05, 0.22, 0.05]) }) }),
    card: Object.freeze({ hold: 'rifle-low', facing: 'right', bend: Object.freeze({ drop: 8, legs: Object.freeze({ r: Object.freeze([0.9, 'fit']), l: Object.freeze([0.9, 'fit']) }), arms: Object.freeze({ bendL: Object.freeze([3, 22]) }) }) }),
  }),
]);
/** Z: a man down at 0 G, hanging from his locked boots (no floor to fall to). */
export const DOWN_FREE = Object.freeze([
  Object.freeze({
    id: 'Z-a', name: 'slack from his locked boots, the arms adrift, the rifle on its sling',
    stage: Object.freeze({ lean: -0.12, headDrop: 2, legs: SLACK_LEGS, rig: Object.freeze({ mode: 'front', gun: 'rifle' }), reach: Object.freeze({ r: Object.freeze([0.18, -0.42, 0.06]), l: Object.freeze([0.2, 0.44, 0.1]) }) }),
    card: Object.freeze({ hold: 'empty', front: true, bend: Object.freeze({ drop: 4, legs: Object.freeze({ r: Object.freeze([0.95, 'fit']), l: Object.freeze([0.95, 'fit']) }), arms: Object.freeze({ bendR: Object.freeze([17, 30]), bendL: Object.freeze([17, 32]) }) }) }),
  }),
  Object.freeze({
    id: 'Z-b', name: 'curled, the knees up, still on his boots, the rifle across him',
    stage: Object.freeze({ lean: 0.62, headDrop: 2, legs: CURL_LEGS, rig: Object.freeze({ mode: 'front', gun: 'rifle' }), reach: Object.freeze({ r: Object.freeze([0.16, -0.08, -0.08]), l: Object.freeze([0.16, 0.08, -0.08]) }) }),
    card: Object.freeze({ hold: 'empty', front: true, pose: 'cower' }),
  }),
]);
/** The groups as the sample shows them (the default of each first). */
export const GROUPS = Object.freeze({ B: BLIND, Z: DOWN_FREE });
export const DEFAULTS = Object.freeze({ B: 'B-a', Z: 'Z-a' });
