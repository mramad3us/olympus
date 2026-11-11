// OLYMPUS art: the candidate walk cycles of rework 1 (the animation designer's part 9), as frame sets for the gallery only.
//
// The user, 2026-11-11: "saying that the walking about is goofy is an understatement, the animation is really not there
// yet." The designer's proposal puts three honest answers to the chibi's problem (legs of 0.25 m from hip to ankle at a
// human's speed) beside today's cycle, to be scored animated before any is wired into the game (samples/walk). Nothing
// in the game imports this module: the candidates are drawn by the figure art's own composer (compose.js composeFrame
// with a pose given outright), so a scored candidate becomes poses.js's frames with no new drawing code.
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
import { poseOf, STEP_M } from './poses.js';
import { composeFrame } from './compose.js';

/** The body's numbers this module solves with, px at 16 px/m (body.js CHIBI: hip joint 6, thigh 2.2, shin 1.8, boot 2 tall, heel 1.2 behind the ankle, toe 3.8 ahead). */
const PX = 16, HIP = 6, THIGH = 2.2, SHIN = 1.8, FOOT_H = 2, HEEL = 1.2, TOE = 3.8;
const ABD = 0.02;

/** The bands a candidate draws: the Combat glide at the low ready and Assault aimed. */
export const CYCLE_BANDS = Object.freeze({
  glide: Object.freeze({ label: 'Combat glide, low ready', carry: 'low', stance: 'combat', lean: 0.10 }),
  assault: Object.freeze({ label: 'Assault, aimed', carry: 'aim', stance: 'assault', lean: 0.15 }),
});

// A key: plant [x px (the flat ankle from the pelvis), pitch rad], swing [x px (the ankle), clearance px (its lowest end over the
// floor), pitch] (at Contact the swing is the trailing foot, still down: only its pitch is read), drop (the pelvis below
// standing, px), sway (px toward the stance leg, front and back). Keys run right foot planted; the cycle's second half mirrors.
const k = (plant, swing, drop, sway = 0) => ({ plant, swing, drop, sway });

/** The candidates (see the header): per band, the keys of one step, the planted travel S (px) and the frames a step. */
export const CANDIDATES = Object.freeze({
  W0: Object.freeze({
    id: 'W0', label: 'W0, v0.0.12 as built', short: 'as built',
    about: 'The reference: the glide is the stroll\'s four frames at 0.12 m a frame, Assault the run\'s four at 0.45, both at the low ready.',
    builtin: { glide: { frame: 'stroll', stepM: STEP_M.stroll }, assault: { frame: 'run', stepM: STEP_M.run } },
  }),
  A: Object.freeze({
    id: 'A', label: 'A, eight frames, planted', short: 'eight, planted',
    about: 'Eight frames, flat feet with a small heel strike, short exact steps (4 px glide, 5 px Assault); the pelvis 1 px down on Down.',
    bands: {
      glide: { S: 4, fps: 4, keys: [
        k([2, 0.2], [-2, 0, -0.15], 1),
        k([1, 0], [-2.5, 1, -0.5], 2, 1),
        k([0, 0], [0, 1, 0], 1),
        k([-1, 0], [1.5, 1, 0.15], 1),
      ] },
      assault: { S: 5, fps: 4, keys: [
        k([2, 0.2], [-3, 0, -0.25], 1),
        k([1, 0], [-3, 1, -0.55], 2, 1),
        k([-1, 0], [0, 1, 0], 1),
        k([-2, -0.15], [1.5, 1, 0.15], 1),
      ] },
    },
  }),
  B: Object.freeze({
    id: 'B', label: 'B, eight frames, rolling', short: 'eight, rolling',
    about: 'Eight frames, the boot rolling heel to toe, longer steps (6 px glide, 7 px Assault); the pelvis held flat (the turret).',
    bands: {
      glide: { S: 6, fps: 4, keys: [
        k([3, 0.35], [-3, 0, -0.3], 1),
        k([2, 0], [-3, 1, -0.6], 1, 1),
        k([0, 0], [0, 1, 0], 1, 1),
        k([-1, -0.3], [2, 1, 0.2], 1),
      ] },
      assault: { S: 7, fps: 4, keys: [
        k([3, 0.35], [-4, 0, -0.35], 1),
        k([2, 0], [-3.5, 1, -0.65], 1, 1),
        k([0, 0], [0, 1, 0], 1, 1),
        k([-2, -0.35], [2, 1, 0.2], 1),
      ] },
    },
  }),
  C: Object.freeze({
    id: 'C', label: 'C, six frames, bold', short: 'six, bold',
    about: 'Six frames, three bold keys a step (5 px glide, 6 px Assault): the knee up and the body down a pixel at the passing, the heel up at the push.',
    bands: {
      glide: { S: 5, fps: 3, keys: [
        k([2, 0.3], [-3, 0, -0.3], 1),
        k([0, 0], [-0.5, 1, -0.2], 2, 1),
        k([-2, -0.25], [1.5, 1, 0.2], 1),
      ] },
      assault: { S: 6, fps: 3, keys: [
        k([3, 0.3], [-3, 0, -0.35], 1),
        k([1, 0], [-1, 1, -0.2], 2, 1),
        k([-1, -0.3], [2, 1, 0.2], 1),
      ] },
    },
  }),
});
export const CANDIDATE_IDS = Object.freeze(Object.keys(CANDIDATES));

/** A candidate band's frames a cycle (two steps), and the metres of one step (the planted travel, 1 G: no flight under Froude 0.5). */
export function cycleOf(cid, band) {
  const C = CANDIDATES[cid];
  if (C.builtin) return { frames: 4, framesPerStep: 2, stepM: C.builtin[band].stepM * 2, builtin: true };
  const b = C.bands[band];
  return { frames: 2 * b.fps, framesPerStep: b.fps, stepM: b.S / PX, S: b.S, builtin: false };
}

/** The ankle of a planted foot whose flat ankle is x px from the pelvis, tipped psi on its heel (toes up) or its toe (heel up): [x, z] px. */
function plantedAnkle(x, psi) {
  if (!psi) return [x, FOOT_H];
  const c = Math.cos(psi), s = Math.sin(psi);
  if (psi > 0) { const heel = x - HEEL; return [heel + HEEL * c - FOOT_H * s, FOOT_H * c + HEEL * s]; }
  const toe = x + TOE;
  return [toe - TOE * c - FOOT_H * s, -TOE * s + FOOT_H * c];
}
/** The ankle of a swing foot [x, clearance, pitch]: its lowest end (the heel tipped up, the toe tipped down) clearance px over the floor: [x, z] px. */
function swingAnkle([x, clear, psi]) {
  const c = Math.cos(psi), s = Math.sin(psi);
  return [x, clear + FOOT_H * c + (psi >= 0 ? HEEL * s : -TOE * s)];
}
/** Two-bone IK in the leg's plane: a target (forward, up px from the hip) to [hip, knee] angles (poses.js legs), and whether it reached. */
function legTo(tf, tu) {
  const d0 = Math.hypot(tf, tu), d = Math.min(d0, THIGH + SHIN - 1e-3), alpha = Math.atan2(tf, -tu);
  const beta = Math.acos(Math.max(-1, Math.min(1, (THIGH * THIGH + d * d - SHIN * SHIN) / (2 * THIGH * d))));
  const phi = alpha + beta, kx = THIGH * Math.sin(phi), kz = -THIGH * Math.cos(phi);
  const ax = tf * d / (d0 || 1), az = tu * d / (d0 || 1);
  const sigma = Math.atan2(ax - kx, -(az - kz));
  return { leg: [phi, phi - sigma, ABD], reached: d0 <= THIGH + SHIN && d0 >= Math.abs(THIGH - SHIN) + 0.2 };
}

/**
 * Frame k of a candidate's band as a pose (compose.js's, given outright) with what the sample measures: { pose, planted ('r' or
 * 'l', the foot the frame stands on), plantX (its flat ankle, px from the pelvis), key (0 Contact ...), step (0 or 1), drop, reached }.
 * W0's frames are the game's own (poses.js poseOf), the planted foot read from the drawing.
 */
export function cyclePose(cid, band, frameK) {
  const C = CANDIDATES[cid], B = CYCLE_BANDS[band];
  if (C.builtin) {
    const name = `${C.builtin[band].frame}${frameK % 4}`;
    return { pose: poseOf(name, { weapon: 'rifle', carry: 'low' }), name, builtin: true, key: frameK % 2, step: frameK >= 2 ? 1 : 0 };
  }
  const b = C.bands[band], n = b.fps, step = Math.floor(frameK / n) % 2, key = frameK % n, K = b.keys[key];
  const h = HIP - K.drop;
  const pa = plantedAnkle(K.plant[0], K.plant[1]);
  // (at Contact the trailing foot is still on the floor, where its own stance left it: S px behind the new one, on its toe if tipped)
  const sa = key === 0 ? plantedAnkle(K.plant[0] - b.S, K.swing[2]) : swingAnkle(K.swing);
  const p = legTo(pa[0], pa[1] - h), sw = legTo(sa[0], sa[1] - h);
  const planted = step ? 'l' : 'r', swing = step ? 'r' : 'l';
  const pose = {
    stance: 'stand', lean: B.lean, farShade: true,
    legs: { [planted]: p.leg, [swing]: sw.leg },
    feet: { [planted]: K.plant[1], [swing]: K.swing[2] },
    sway: K.sway ? (planted === 'r' ? -K.sway : K.sway) : 0,
    rig: B.carry === 'aim' ? { mode: 'aim', gun: 'rifle', turn: 0, kick: 0 } : { mode: 'low' },
  };
  return { pose, name: `${cid}.${band}${frameK}`, builtin: false, planted, plantX: K.plant[0], key, step, drop: K.drop, reached: p.reached && sw.reached };
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
