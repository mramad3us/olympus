// OLYMPUS art: the candidate walk cycles of rework 1 (the animation designer's part 9), as frame sets for the walk sample (samples/walk).
//
// The user, 2026-11-11: "saying that the walking about is goofy is an understatement, the animation is really not there
// yet." The designer's proposal puts three honest answers to the chibi's problem (legs of 0.25 m from hip to ankle at a
// human's speed) beside v0.0.12's cycle, to be scored animated (samples/walk). From the rework's R8 the keys, the IK and the
// poses are the game's own (src/art/figures/walk.js: the three candidates behind the look's `cycle`, B by default); this
// module only puts them in the sample's terms (two bands, a frame index, the W0 reference from poses.js legacyPose), so the
// sample draws exactly what the game draws. Nothing in the game imports it.
//
// The model. A key gives each foot as a TARGET, not as joint angles, and the legs are solved to it by two-bone IK
// (thigh 0.1375 m, shin 0.1125 m, as the arms already are):
//   - the planted foot by where its ankle would be flat on the floor, x px from the pelvis's ground point (a whole
//     pixel, so every frame moves it a whole number of pixels: the plant lock's travel, baked), and its pitch: toes up
//     (a heel strike, turning on the heel) or heel up (the roll off, turning on the toe), so the boot's material point
//     on the floor never moves however it tips, and a card placed by it never slides;
//   - the swing foot by its ankle's x, the clearance of its lowest end over the floor (px) and its pitch, in the air;
//   - the pelvis by its drop below standing (px), the knees taking it: the bob is chosen, not a by-product.
// A step is framesPerStep keys, right foot planted first; the second step is the first with the legs swapped (never the
// rifle: it stays in the right hand), and the far leg is drawn a shade darker (the pose's farShade), so the two halves
// are different pictures. In the front and back views the shoulders sway a pixel toward the stance leg (sway) and the
// swing foot lifts, so the step reads from the camera's own axis.
// The candidates (the proposal's §9, numbers its §3.3; my calls where it left a choice, noted):
//   - W0: v0.0.12 as built, the reference: the glide is the stroll's four frames (STEP_M 0.12), Assault the run's four
//     (0.45), both at the low ready (the game draws an aimed walk low: the auditors' bug);
//   - A "Eight, planted": eight frames, flat feet with a small heel strike, planted travel 4 px in the glide and 5 in
//     Assault; the pelvis 1 px down on Down in both (the proposal's "0 to 1" in Combat taken as 1, my call);
//   - B "Eight, rolling": eight frames, the boot rolling heel to toe (a heel strike of 0.35 rad, flat, the heel off), so
//     the body travels further over each foot: 6 px in the glide, 7 in Assault; the pelvis held flat in both (the
//     turret: the head and the muzzle on one row);
//   - C "Six, bold": six frames, three keys a step (a wide contact, the passing with the knee up and the body down a
//     pixel, the push-off with the heel up): 5 px in the glide, 6 in Assault; the body bobs a pixel in both.
// The carries: the glide (Combat) at the low ready, Assault aimed (the shoot-on-move gait), the rifle in both hands on the
// composer's own rigs. Leans: the glide 0.10, Assault 0.15 (the proposal's §4). Pure: no DOM, no three.js.
import { STEP_M, legacyPose } from './poses.js';
import { composeFrame } from './compose.js';
import { CYCLE_KEYS, keyLegs, bandSpec } from './walk.js';

const PX = 16;

/** The bands a candidate draws: the Combat glide at the low ready and Assault aimed (the sim's 'combat' and 'assault'). */
export const CYCLE_BANDS = Object.freeze({
  glide: Object.freeze({ label: 'Combat glide, low ready', carry: 'low', stance: 'combat', lean: 0.10, band: 'combat' }),
  assault: Object.freeze({ label: 'Assault, aimed', carry: 'aim', stance: 'assault', lean: 0.15, band: 'assault' }),
});

/** The candidates (see the header): per band, the keys of one step, the planted travel S (px) and the frames a step (walk.js CYCLE_KEYS). */
const bandsOf = (id) => ({ glide: { S: CYCLE_KEYS[id].glide.S, fps: CYCLE_KEYS[id].glide.keys.length, keys: CYCLE_KEYS[id].glide.keys }, assault: { S: CYCLE_KEYS[id].assault.S, fps: CYCLE_KEYS[id].assault.keys.length, keys: CYCLE_KEYS[id].assault.keys } });
export const CANDIDATES = Object.freeze({
  W0: Object.freeze({
    id: 'W0', label: 'W0, v0.0.12 as built', short: 'as built',
    about: 'The reference: the glide is the stroll\'s four frames at 0.12 m a frame, Assault the run\'s four at 0.45, both at the low ready.',
    builtin: { glide: { frame: 'stroll', stepM: STEP_M.stroll }, assault: { frame: 'run', stepM: STEP_M.run } },
  }),
  A: Object.freeze({ id: 'A', label: 'A, eight frames, planted', short: 'eight, planted', about: 'Eight frames, flat feet with a small heel strike, short exact steps (4 px glide, 5 px Assault); the pelvis 1 px down on Down.', bands: bandsOf('A') }),
  B: Object.freeze({ id: 'B', label: 'B, eight frames, rolling', short: 'eight, rolling', about: 'Eight frames, the boot rolling heel to toe, longer steps (6 px glide, 7 px Assault); the pelvis held flat (the turret).', bands: bandsOf('B') }),
  C: Object.freeze({ id: 'C', label: 'C, six frames, bold', short: 'six, bold', about: 'Six frames, three bold keys a step (5 px glide, 6 px Assault): the knee up and the body down a pixel at the passing, the heel up at the push.', bands: bandsOf('C') }),
});
export const CANDIDATE_IDS = Object.freeze(Object.keys(CANDIDATES));

/** A candidate band's frames a cycle (two steps), and the metres of one step (the planted travel, 1 G: no flight under Froude 0.5). */
export function cycleOf(cid, band) {
  const C = CANDIDATES[cid];
  if (C.builtin) return { frames: 4, framesPerStep: 2, stepM: C.builtin[band].stepM * 2, builtin: true };
  const b = C.bands[band];
  return { frames: 2 * b.fps, framesPerStep: b.fps, stepM: b.S / PX, S: b.S, builtin: false };
}

/**
 * Frame k of a candidate's band as a pose (compose.js's, given outright) with what the sample measures: { pose, planted ('r' or
 * 'l', the foot the frame stands on), plantX (its flat ankle, px from the pelvis), key (0 Contact ...), step (0 or 1), drop, reached }.
 * W0's frames are v0.0.12's (poses.js legacyPose).
 */
export function cyclePose(cid, band, frameK) {
  const C = CANDIDATES[cid], B = CYCLE_BANDS[band];
  if (C.builtin) {
    const g = C.builtin[band].frame, name = `${g}${frameK % 4}`;
    return { pose: legacyPose(g, frameK % 4, { weapon: 'rifle', carry: 'low' }), name, builtin: true, key: frameK % 2, step: frameK >= 2 ? 1 : 0 };
  }
  const sp = bandSpec(cid, B.band), n = sp.n, step = Math.floor(frameK / n) % 2, key = frameK % n, K = sp.keys[key];
  const L = keyLegs(cid, B.band, key, step);
  const pose = {
    stance: 'stand', lean: B.lean, farShade: true, legs: L.legs, feet: L.feet, sway: L.sway,
    rig: B.carry === 'aim' ? { mode: 'aim', gun: 'rifle', turn: 0, kick: 0 } : { mode: 'low' },
  };
  return { pose, name: `${cid}.${band}${frameK}`, builtin: false, planted: L.planted, plantX: K.plant[0], key, step, drop: K.drop, reached: L.reached };
}

/** Frame k of a candidate's band composed for a look (outfits.js wear()) facing dir: composeFrame's frame with the feet reported, plus cyclePose's facts. */
export function cycleFrame(look, dir, cid, band, frameK, { ppm = PX } = {}) {
  const cp = cyclePose(cid, band, frameK);
  // (the sway is for the front and back: side on it would only move the body a fraction of a pixel up the picture, SIDE_K's)
  if (cp.pose.sway && (dir === 'right' || dir === 'left')) cp.pose = { ...cp.pose, sway: 0 };
  const L = { ...look, carry: CYCLE_BANDS[band].carry === 'aim' ? 'low' : CYCLE_BANDS[band].carry };
  const fr = composeFrame(L, dir, cp.name, { ppm, pose: cp.pose });
  return { ...fr, cycle: cp };
}
