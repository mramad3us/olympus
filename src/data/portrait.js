// OLYMPUS data: the names of what a portrait draws of a person, one list read by the sim's record and the art alike (VIEWS §4.4, §7.7; the build sheet v0.0.23 §0 items 14 and 17, §3.1).
//
// The user, 2026-11-17: "the portrait of the NPC holding a gun does not display the gun they are holding, the portraits need to be
// more dynamic and show us what we would be seeing, including what they are holding". src/sim/people/seen.js seenOf is the one
// record of what you see of a person (his hold, his pose, his facing), and the doll (src/art/doll/*) draws it; art reads no sim
// module (tests/syntax.test.mjs MAY_IMPORT), so the words both sides use live here, in data:
//   HOLD_HOWS   how the hands hold what they hold: the rifle at the low ready, the high ready or aimed, hanging on its sling in
//               front ('rifle-slung', the hands free), the P-12 at the low ready, the high ready or aimed (the user's note of
//               2026-11-17: "sidearm should have the same stances (low ready, high ready, aimed, etc) as the rifle": 'pistol-high' is
//               the pistol's own high ready, no longer folded into 'pistol-ready'), a device, a phone, a magazine, the hands up, empty;
//   POSES       the body: standing, kneeling, sitting, cowering (crouched and frozen), prone;
//   FACINGS     the body's facing as the viewer's eye sees it: front, back, or turned to the viewer's left or right;
//   FRAME_SEEN  the stage's frame of a person (the role-players' frames as src/sim/scenarios/opfor.js opforLook names them, with
//               'prone' for a shooter down on the line) to the record's pose and hold: a field absent is read from the body (pose:
//               the actor's stance and posture) or the carry (how: CARRY_HOW). Corrected from the build sheet's table where the stage
//               draws otherwise (the record agrees with the stage, F85): a man aiming from the knee is drawn kneeling ('aim' takes its
//               pose from the body, not 'stand'), and a man giving up holds his rifle lowered until it drops (look.js withLive: "through
//               the give's GIVE_DROP_MS before it the rifle is in his hands, lowered to low ready"), so 'drop' takes the carry, not 'up';
//   CARRY_HOW   look.js gunLook's carry (CARRY_RIGS: front, slung, low, high, aim) and, with the P-12 out, 'pistol:' and its posture,
//               to the hold;
//   PISTOL_ACTS gunLook's action frame while the P-12 is in the hands (or coming out of the holster) to the pistol's act the card
//               draws: the draw, the holster, the press check, the reload, the clearing (the user's note of 2026-11-17: "at the holster
//               and its admin"); a frame not named is no act (the aim, the posture's own raise);
//   PORTRAIT_BANDS  the card's range bands (metres), the record's band: art/doll/hitcard.js HIT_BANDS' maxM, held equal by the seen
//               suite (one quantity: the sim cannot import the art's table).
// v0.0.24 (the build sheet v0.0.24 §3.5, items 16 and 18; the portraits lens P§3.3): the card in his light and behind the jamb, and
// a hand on a hold. The record's light (seen.js lightOf: lightLevel and spectrumAt at his feet) is quantised to LIGHT_Q and its key
// is 'full' from LIGHT_FULL_K up, so the card repaints only when the picture changes; the art lights the figure by level over
// LIGHT_FULL_K, never below LIGHT_FLOOR_K (samples/portrait-light L1, the default: "lit by his place, never below 30%"; LIGHT_FULL_K
// is the house's lit rooms' 0.75, measured, the sample's LIGHT_REF, so the lit rooms and "Bang" (1.0) are drawn byte for byte; the
// build sheet's 0.85 would have darkened every lit room by 12%: my call). The cover (seen.js coverOf, the page's) is the share of
// his width hidden from the viewer's left and right, in quarters (COVER_Q). 'hold' joins HOLD_HOWS: a hand on a rail or a pad-eye,
// the gun in the other (the gear record's anchor, src/sim/arms/gear.js's, A's).
// v0.0.26 (the build sheet items 6 and 8, §3.3; "Bang, then go"): a role-player dazed (startled, stunned or flash-blind) is the
// stage's frame 'daze' (or 'dazeKneel' on his knee), the pose 'daze' or 'dazeKneel' (doll.js POSE_BENDS: samples/breach-poses D-a's
// card, hunched, the support hand to the eyes) and the rifle at the low ready in his firing hand, whatever his carry; a frozen one is
// 'cower', the pose 'cower' (C1) with his hands empty over his head, the rifle hanging on its sling across his chest (C-a's card),
// whatever his stance: the frame's hold is FRAME_SEEN's how, so the card draws what the stage draws.
// v0.0.27 (its build sheet item 16, §3.5, §10; "Away the boarding party"): an irregular firing blind is the stage's frame 'blind', the
// pose 'blind' (doll.js POSE_BENDS: samples/board-poses B-a's card, down behind his cover on his knee, the rifle up over it) with the
// rifle at the high ready; a man down in free fall is 'downFree', the pose 'downFree' (Z-a's card, slack from his locked boots, the
// arms adrift) with his hands empty, the rifle on its sling in front.
// Pure data.

/** How the hands hold (see the header). */
export const HOLD_HOWS = Object.freeze(['rifle-low', 'rifle-high', 'rifle-aim', 'rifle-slung', 'pistol-ready', 'pistol-high', 'pistol-aim', 'device', 'phone', 'mag', 'up', 'empty', 'hold']);
/** The body's poses (see the header); 'prone' is drawn at portrait-pose's Y-p behind the art's PORTRAIT_POSES. */
export const POSES = Object.freeze(['stand', 'kneel', 'sit', 'cower', 'prone', 'daze', 'dazeKneel', 'blind', 'downFree']);
/** The facings, as the viewer's eye sees the man (see the header). */
export const FACINGS = Object.freeze(['front', 'back', 'left', 'right']);
/** The stage's frames to the record (see the header): a field absent is read from the body or the carry. */
export const FRAME_SEEN = Object.freeze({
  stand: Object.freeze({}), aim: Object.freeze({}), run: Object.freeze({}), crouch: Object.freeze({ pose: 'kneel' }),
  cower: Object.freeze({ pose: 'cower', how: 'empty' }), drop: Object.freeze({}), hands: Object.freeze({ pose: 'stand', how: 'up' }),
  kneel: Object.freeze({ pose: 'kneel', how: 'up' }), sit: Object.freeze({ pose: 'sit' }), prone: Object.freeze({ pose: 'prone' }),
  daze: Object.freeze({ pose: 'daze', how: 'rifle-low' }), dazeKneel: Object.freeze({ pose: 'dazeKneel', how: 'rifle-low' }),
  blind: Object.freeze({ pose: 'blind', how: 'rifle-high' }), downFree: Object.freeze({ pose: 'downFree', how: 'empty' }),
});
/** gunLook's carry (and the P-12's posture while it is out) to the hold (see the header). */
export const CARRY_HOW = Object.freeze({
  front: 'rifle-slung', slung: 'empty', low: 'rifle-low', high: 'rifle-high', aim: 'rifle-aim',
  'pistol:lowReady': 'pistol-ready', 'pistol:highReady': 'pistol-high', 'pistol:aimed': 'pistol-aim',
});
/** The holds with both hands on the gun (the record's left hand holds what the right does). */
export const TWO_HANDED = Object.freeze(new Set(['rifle-low', 'rifle-high', 'rifle-aim', 'pistol-ready', 'pistol-high', 'pistol-aim']));
/** The pistol's acts, by gunLook's action frame (see the header); the draw is read from 'raise' with the P-12 still holstered. */
export const PISTOL_ACTS = Object.freeze({ sling: 'holster', check: 'check', magout: 'reload', magin: 'reload', charge: 'clear', release: 'clear' });
/** Every act a record can name. */
export const PISTOL_ACT_NAMES = Object.freeze(['draw', 'holster', 'check', 'reload', 'clear']);
/** The card's range bands (see the header): near up to 10 m, mid up to 25 m, far beyond. */
export const PORTRAIT_BANDS = Object.freeze([Object.freeze({ id: 'near', maxM: 10 }), Object.freeze({ id: 'mid', maxM: 25 }), Object.freeze({ id: 'far', maxM: Infinity })]);
/** A range's band id (metres; none or not a number, the near band's). */
export const portraitBand = (rangeM) => (Number.isFinite(rangeM) ? PORTRAIT_BANDS.find(b => rangeM <= b.maxM).id : 'near');

/** The light at which the card is drawn as lit (the house's lit rooms, 0.75: see the header), the floor it is never drawn below, the record's step. */
export const LIGHT_FULL_K = 0.75, LIGHT_FLOOR_K = 0.3, LIGHT_Q = 0.05;
/** A level as the card draws it: the figure's light, LIGHT_FLOOR_K to 1 (1 from LIGHT_FULL_K up; none, 1). */
export const lightK = (level) => (Number.isFinite(level) ? Math.max(LIGHT_FLOOR_K, Math.min(1, level / LIGHT_FULL_K)) : 1);
/** The cover's step (a share of his width hidden from a side). */
export const COVER_Q = 0.25;
