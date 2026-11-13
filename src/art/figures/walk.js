// OLYMPUS art: the walk cycles as the game draws them, three candidates behind one flag, and the close-quarters beats' poses (VIEWS §3.10; the shoot house rework's stage R8).
//
// The user, 2026-11-11: "saying that the walking about is goofy is an understatement, the animation is really not there
// yet." Rework 1's animation designer put three honest answers to the chibi's problem (legs of 0.25 m from hip to ankle
// at a human's speed) in the gallery (samples/walk: W-b "A, eight, planted", W-c "B, eight, rolling", W-d "C, six,
// bold"); this module is their keys made the game's frames. The candidate drawn is the look's `cycle` (outfits.js wear()
// passes it through; absent, src/data/body/gait.js CYCLE, B, VIEWS §3.10.4's default until the user's score), so the
// user's pick swaps in by one constant, and `&cycle=A|B|C` (src/core/debug.js) shows any of them in the game meanwhile.
//
// The model (VIEWS §3.10.2, §3.10.3). A key gives each foot as a TARGET, not as joint angles, and the legs are solved to it
// by two-bone IK (thigh 2.2 px, shin 1.8 px at 16 px/m, as compose.js draws them):
//   - the planted foot by its flat ankle's x in whole pixels from the pelvis's ground point, and its pitch (toes up: a
//     heel strike turning on the heel; heel up: the roll off, turning on the toe), so the boot's point on the floor never
//     moves however it tips;
//   - the swing foot by its ankle's x, the clearance of its lowest end over the floor (px) and its pitch;
//   - the pelvis by its drop below standing (px), the knees taking it: the bob is chosen, not a by-product.
// A step is the band's keys, right foot planted first; the second step mirrors the legs (never the rifle). Each key's
// planted foot is a whole number of pixels behind the last, so a card placed by the planted foot never slides: the plant
// lock (planted below) gives the view the lag of the drawn body behind the sim's, in the travel's direction, for the frame
// the gait phase gp (src/sim/body/loco.js) is in. The flight (BODY §16.8: a walk-type gait lopes from Froude 0.5, the run
// always flies) is one more key a step with both feet off, the card lifted by the ballistic height the view computes from
// the sim's speed and gravity, so a lope in stop motion hangs in the air.
//
// The bands as the sim counts them (src/sim/body/loco.js stepMOf: 'walk' Relaxed, 'combat' the glide, 'assault', 'run'),
// each drawn from one of a candidate's two key sets (BAND_KEYS: the source of src/data/body/gait.js STEP_PX, checked by
// tests/walk-cycle): the run keeps a candidate's Contact, Passing and Up (made the push-off) and adds the flight, four
// frames a step in every candidate (the stance of a run is two or three ticks: three keys keep the drawn body within 3 px).
// Where they are painted (VIEWS §3.10.8, my call: the third option, no new texture): the Relaxed walk and the run on every
// look's base sheet (src/art/figures/poses.js 'gait' and 'move'), the glide and Assault in the STANCE sheet, a sheet of its
// own a carry (low, high, aimed) that only an armed mover in a stance gets, in a base slot of the atlas (atlas.js pool
// 'stance', src/render/figures.js), with the beats of close quarters below (start, plant, the side-step, the stack and its
// breath, the #2's tap, the door's hand, the kick, the kneel, the shot on the move, the pistol). Pure: no DOM, no three.js.
import { CYCLE, STEP_PX } from '../../data/body/gait.js';

/** The body's numbers this module solves with, px at 16 px/m (body.js CHIBI: hip joint 6, thigh 2.2, shin 1.8, boot 2 tall, heel 1.2 behind the ankle, toe 3.8 ahead). */
export const KEY_PPM = 16;
const HIP = 6, THIGH = 2.2, SHIN = 1.8, FOOT_H = 2, HEEL = 1.2, TOE = 3.8;
const ABD = 0.02;
/** The candidates' ids, and the one drawn when a look names none. */
export const CYCLE_IDS = Object.freeze(['A', 'B', 'C']);
export const cycleOfLook = (L) => (CYCLE_IDS.includes(L?.cycle) ? L.cycle : CYCLE);

// A key: plant [x px (the flat ankle from the pelvis), pitch rad], swing [x px (the ankle), clearance px (its lowest end over the
// floor), pitch] (at Contact the swing is the trailing foot, still down: only its pitch is read), drop (the pelvis below standing,
// px), sway (px toward the stance leg, front and back). Keys run right foot planted; the cycle's second half mirrors.
const k = (plant, swing, drop, sway = 0) => Object.freeze({ plant: Object.freeze(plant), swing: Object.freeze(swing), drop, sway });

/** The candidates' key sets (rework 1's animation designer, the proposal's §9; the walk sample's): per set, the planted travel S (px) and the keys of one step. */
export const CYCLE_KEYS = Object.freeze({
  A: Object.freeze({
    glide: Object.freeze({ S: 4, keys: Object.freeze([k([2, 0.2], [-2, 0, -0.15], 1), k([1, 0], [-2.5, 1, -0.5], 2, 1), k([0, 0], [0, 1, 0], 1), k([-1, 0], [1.5, 1, 0.15], 1)]) }),
    assault: Object.freeze({ S: 5, keys: Object.freeze([k([2, 0.2], [-3, 0, -0.25], 1), k([1, 0], [-3, 1, -0.55], 2, 1), k([-1, 0], [0, 1, 0], 1), k([-2, -0.15], [1.5, 1, 0.15], 1)]) }),
  }),
  B: Object.freeze({
    glide: Object.freeze({ S: 6, keys: Object.freeze([k([3, 0.35], [-3, 0, -0.3], 1), k([2, 0], [-3, 1, -0.6], 1, 1), k([0, 0], [0, 1, 0], 1, 1), k([-1, -0.3], [2, 1, 0.2], 1)]) }),
    assault: Object.freeze({ S: 7, keys: Object.freeze([k([3, 0.35], [-4, 0, -0.35], 1), k([2, 0], [-3.5, 1, -0.65], 1, 1), k([0, 0], [0, 1, 0], 1, 1), k([-2, -0.35], [2, 1, 0.2], 1)]) }),
  }),
  C: Object.freeze({
    glide: Object.freeze({ S: 5, keys: Object.freeze([k([2, 0.3], [-3, 0, -0.3], 1), k([0, 0], [-0.5, 1, -0.2], 2, 1), k([-2, -0.25], [1.5, 1, 0.2], 1)]) }),
    assault: Object.freeze({ S: 6, keys: Object.freeze([k([3, 0.3], [-3, 0, -0.35], 1), k([1, 0], [-1, 1, -0.2], 2, 1), k([-1, -0.3], [2, 1, 0.2], 1)]) }),
  }),
});
/** Which key set each of the sim's bands is drawn with, per candidate (src/data/body/gait.js STEP_PX is these sets' S). */
export const BAND_KEYS = Object.freeze({
  A: Object.freeze({ walk: 'assault', combat: 'glide', assault: 'assault', run: 'assault' }),
  B: Object.freeze({ walk: 'glide', combat: 'glide', assault: 'assault', run: 'assault' }),
  C: Object.freeze({ walk: 'glide', combat: 'glide', assault: 'assault', run: 'glide' }),
});
/** Each band's body: lean (rad) and the bob it adds on Up (px, Relaxed's lift: negative is up, a no-op where the leg is straight). */
export const BAND_BODY = Object.freeze({ walk: { lean: 0.03 }, combat: { lean: 0.10 }, assault: { lean: 0.15 }, run: { lean: 0.2 } });
/** The frames a step of the run (Contact, Passing, Push-off, Flight) and the most frames a step of a walk-type band (the candidates' 4 or 3 keys). */
export const RUN_FPS = 4, WALK_CELLS = 8;

// ---------- the key sets of a band ----------

/**
 * A band's step for a candidate: { S (px), n (the stance keys a step), keys (n stance keys, then the flight key), starts (the
 * planted travel in px at which each stance key begins: plant0 − plant_j), fps (frames a step drawn: n for a walk-type band, 4
 * for the run, whose last is the flight) }.
 */
const specs = new Map();
export function bandSpec(cycle, band) {
  const cy = CYCLE_IDS.includes(cycle) ? cycle : CYCLE, key = `${cy}|${band}`;
  if (specs.has(key)) return specs.get(key);
  const set = CYCLE_KEYS[cy][BAND_KEYS[cy][band] ?? 'glide'];
  let stance = set.keys;
  // (the run: Contact, the Passing (the key whose plant is nearest under the hip), the Up made the push-off, its heel higher)
  if (band === 'run') {
    const n = stance.length, pass = n === 4 ? 2 : 1, up = stance[n - 1];
    stance = [stance[0], stance[pass], k([up.plant[0], Math.min(up.plant[1], -0.45)], [up.swing[0] + 1, up.swing[1] + 1, up.swing[2]], up.drop, up.sway)];
  }
  // (the flight: both feet off, the trailing foot (the one just left) kicked up behind, the leading one reaching; the knees bent)
  const last = stance[stance.length - 1];
  const flight = Object.freeze({ ...k([last.plant[0] - 1, -0.2], [last.swing[0], 1, 0.15], 1), flight: true, trail: [last.plant[0] - 1, 2, -0.2] });
  const starts = stance.map(K => stance[0].plant[0] - K.plant[0]);
  const out = Object.freeze({ cycle: cy, band, S: set.S, n: stance.length, keys: Object.freeze([...stance, flight]), starts: Object.freeze(starts), fps: band === 'run' ? RUN_FPS : stance.length });
  specs.set(key, out);
  return out;
}

// ---------- the plant lock: which key, and how far the drawn body lags the sim's ----------

/**
 * Where a body in a band is in its cycle (VIEWS §3.10.2): gp the gait phase (steps, src/sim/body/loco.js), stepM the step the
 * sim counted it in (stepMOf: S plus the metres flown), back true walking backwards (the band reversed: the phase run down).
 * Returns { step (0 right planted, 1 left), j (the key: 0 .. n − 1 a stance key, n the flight), flight (bool), u (the share
 * of the flight flown, 0 to 1), lagPx (px at 16 px/m: how far the drawn body is behind the sim's along the body's forward
 * axis, the planted foot held where it landed: the view draws the card that far back along the facing), frame (the band's frame index: step × fps + j, the flight the run's last of a step) }.
 */
export function cycleAt({ cycle = CYCLE, band = 'walk', gp = 0, stepM = 0, back = false } = {}) {
  const sp = bandSpec(cycle, band);
  let g = ((gp % 2) + 2) % 2;
  // (backwards: the same frames run the other way, so the phase is read down from the end of the cycle)
  if (back) g = (2 - g) % 2;
  const step = Math.floor(g) % 2, f = g - Math.floor(g);
  const stepPx = Math.max(sp.S, (stepM || sp.S / KEY_PPM) * KEY_PPM), travel = f * stepPx;
  if (travel >= sp.S - 1e-9 && stepPx > sp.S + 1e-6) {
    const u = Math.max(0, Math.min(1, (travel - sp.S) / (stepPx - sp.S)));
    return { step, j: sp.n, flight: true, u, lagPx: 0, frame: step * sp.fps + (band === 'run' ? RUN_FPS - 1 : sp.n) };
  }
  let j = 0;
  for (let i = 0; i < sp.n; i++) if (sp.starts[i] <= travel + 1e-9) j = i;
  // (the drawn body is where the key began; backwards, the phase run down, it is that far ahead of the sim along the travel)
  return { step, j, flight: false, u: 0, lagPx: travel - sp.starts[j], frame: step * sp.fps + j };
}
/** The flight's lift at its share u (m): the ballistic 4h·u(1 − u), h = vz² / 2g (BODY §16.8; VIEWS §3.10.3). */
export const flightLiftM = (u, vzMs, gMs2) => (vzMs > 0 && gMs2 > 0 ? 4 * (vzMs * vzMs / (2 * gMs2)) * u * (1 - u) : 0);

// ---------- the IK ----------

/** The ankle of a planted foot whose flat ankle is x px from the pelvis, tipped psi on its heel (toes up) or its toe (heel up): [x, z] px. */
function plantedAnkle(x, psi) {
  if (!psi) return [x, FOOT_H];
  const c = Math.cos(psi), s = Math.sin(psi);
  if (psi > 0) { const heel = x - HEEL; return [heel + HEEL * c - FOOT_H * s, FOOT_H * c + HEEL * s]; }
  const toe = x + TOE;
  return [toe - TOE * c - FOOT_H * s, -TOE * s + FOOT_H * c];
}
/** The ankle of a swing foot [x, clearance, pitch]: its lowest end clearance px over the floor: [x, z] px. */
function swingAnkle([x, clear, psi]) {
  const c = Math.cos(psi), s = Math.sin(psi);
  return [x, clear + FOOT_H * c + (psi >= 0 ? HEEL * s : -TOE * s)];
}
/** Two-bone IK in the leg's plane: a target (forward, up px from the hip) to [hip, knee, abduction] (poses.js legs), and whether it reached. */
export function legTo(tf, tu, abd = ABD) {
  const d0 = Math.hypot(tf, tu), d = Math.min(d0, THIGH + SHIN - 1e-3), alpha = Math.atan2(tf, -tu);
  const beta = Math.acos(Math.max(-1, Math.min(1, (THIGH * THIGH + d * d - SHIN * SHIN) / (2 * THIGH * d))));
  const phi = alpha + beta, kx = THIGH * Math.sin(phi), kz = -THIGH * Math.cos(phi);
  const ax = tf * d / (d0 || 1), az = tu * d / (d0 || 1);
  const sigma = Math.atan2(ax - kx, -(az - kz));
  return { leg: [phi, phi - sigma, abd], reached: d0 <= THIGH + SHIN && d0 >= Math.abs(THIGH - SHIN) + 0.2 };
}

/**
 * The legs of a band's key j for a step (0: the right foot planted): { legs, feet, sway, drop, lift (m: the pose raised so the
 * pelvis keeps its height in the flight), planted ('r' | 'l' | null in the flight), plantX (px), reached }.
 */
export function keyLegs(cycle, band, j, step = 0) {
  const sp = bandSpec(cycle, band), K = sp.keys[Math.min(j, sp.keys.length - 1)], h = HIP - K.drop;
  const planted = step ? 'l' : 'r', swing = step ? 'r' : 'l';
  let pa, sa, lift = 0;
  if (K.flight) {
    pa = swingAnkle(K.trail); sa = swingAnkle(K.swing);
    lift = Math.min(K.trail[1], K.swing[1]) / KEY_PPM;
  } else {
    pa = plantedAnkle(K.plant[0], K.plant[1]);
    // (at Contact the trailing foot is still on the floor, where its own stance left it: S px behind the new one, on its toe if tipped)
    sa = j === 0 ? plantedAnkle(K.plant[0] - sp.S, K.swing[2]) : swingAnkle(K.swing);
  }
  const p = legTo(pa[0], pa[1] - h), sw = legTo(sa[0], sa[1] - h);
  return {
    legs: { [planted]: p.leg, [swing]: sw.leg }, feet: { [planted]: K.flight ? K.trail[2] : K.plant[1], [swing]: K.swing[2] },
    sway: K.sway ? (planted === 'r' ? -K.sway : K.sway) : 0, drop: K.drop, lift,
    planted: K.flight ? null : planted, plantX: K.flight ? null : K.plant[0], reached: p.reached && sw.reached,
  };
}

// ---------- the poses ----------

// (free arms against the legs: each arm swings back as its own thigh swings forward, a Relaxed walk's and an unarmed run's)
const swingArms = (legs, k = 0.9, bend = 0.2) => ({ r: [-k * legs.r[0], bend, 0.07], l: [-k * legs.l[0], bend, 0.07] });

/** A rig for a carry (compose.js RIGS): 'low', 'high', 'aim' (shouldered, the turret), 'slung', 'front'; null with no weapon. */
export function rigOfCarry(carry, weapon, { kick = 0, oneHand = false } = {}) {
  if (!weapon) return null;
  if (carry === 'aim') return { mode: 'aim', gun: weapon, turn: 0, kick, ...(oneHand ? { oneHand } : {}) };
  return { mode: carry === 'high' || carry === 'slung' || carry === 'front' ? carry : 'low', ...(oneHand ? { oneHand } : {}) };
}

/**
 * The pose of a walk-type or run frame of a band (compose.js's, by name from poses.js): the band's key for frame index k (step ×
 * fps + j; for the walk-type bands of a 3-key candidate, the indices past its cycle repeat it), with the carry's rig, the band's
 * lean and arms swinging when no gun is in the hands (Relaxed, the rifle slung or none).
 */
export function cyclePose(cycle, band, kIdx, { weapon = null, carry = null, flight = false } = {}) {
  const sp = bandSpec(cycle, band), fps = sp.fps, n = 2 * fps;
  const kk = ((kIdx % n) + n) % n, step = Math.floor(kk / fps) % 2;
  const j = flight ? sp.n : band === 'run' && kk % fps === RUN_FPS - 1 ? sp.n : kk % fps;
  const L = keyLegs(cycle, band, j, step);
  const rig = rigOfCarry(carry, weapon);
  const held = rig && rig.mode !== 'slung' && rig.mode !== 'front';
  const lean = BAND_BODY[band]?.lean ?? 0.03;
  return {
    stance: 'stand', lean: carry === 'aim' ? Math.max(lean, band === 'assault' ? 0.16 : 0.12) : lean,
    legs: L.legs, feet: L.feet, sway: L.sway, lift: L.lift, farShade: true,
    ...(held ? {} : { arms: swingArms(L.legs, band === 'run' ? 1.2 : 0.9, band === 'run' ? 1.3 : 0.2) }), rig,
  };
}

// The beats of close quarters (VIEWS §3.10.7), legs by the same IK: each [plant r, plant l] as [x px, pitch] flat on the floor
// (or [x, clearance, pitch] lifted), the pelvis's drop, the lean.
function legsFlat(rx, lx, drop, { rPitch = 0, lPitch = 0, rLift = null, lLift = null, abd = null } = {}) {
  const h = HIP - drop;
  const a = (x, pitch, lift) => (lift === null ? plantedAnkle(x, pitch) : swingAnkle([x, lift, pitch]));
  const r = a(rx, rPitch, rLift), l = a(lx, lPitch, lLift);
  return { r: legTo(r[0], r[1] - h, abd?.r ?? ABD).leg, l: legTo(l[0], l[1] - h, abd?.l ?? ABD).leg, feet: { r: rPitch, l: lPitch } };
}
/** The beats' names, as the stance sheet holds them (poses.js BANDS.stanceBeats and stanceShots). */
export const BEAT_FRAMES = Object.freeze(['start', 'plant', 'kneelGoing', 'stack', 'stackB', 'stackTap', 'doorHand', 'kick0', 'kick1', 'kick2', 'sideR0', 'sideR1', 'sideL0', 'sideL1', 'fireMove0', 'fireMove1', 'draw', 'pistolAim']);

/** The pose of a beat for a carry (see the header and VIEWS §3.10.7); null for a name that is not one. */
export function beatPose(name, { weapon = 'rifle', carry = 'low', cycle = CYCLE } = {}) {
  const rig = (o = {}) => rigOfCarry(carry === 'front' || carry === 'slung' ? 'low' : carry, weapon, o);
  switch (name) {
    // (the first 0.1 m from a standstill: a lean in, the lead foot lifting; the plant at the point: the split stance, knees bent)
    case 'start': { const L = legsFlat(0, 1, 1, { lLift: 1, lPitch: 0.1 }); return { stance: 'stand', lean: 0.16, legs: { r: L.r, l: L.l }, feet: L.feet, rig: rig() }; }
    case 'plant': { const L = legsFlat(-2, 2, 1); return { stance: 'stand', lean: carry === 'aim' ? 0.12 : 0.10, legs: { r: L.r, l: L.l }, feet: L.feet, rig: rig() }; }
    // (half way to the knee: the left foot forward, the right knee half way down; the rest is the rifle's kneeling frames)
    case 'kneelGoing': { const L = legsFlat(-3, 3, 3, { rPitch: -0.9 }); return { stance: 'stand', lean: 0.08, legs: { r: L.r, l: L.l }, feet: L.feet, rig: rig() }; }
    // (the stack: crouched a pixel, bladed to the door, the knees bent; its exhale a pixel lower; the #2's tap, his support hand
    // forward on #1's shoulder, the rifle one-handed at the low ready)
    case 'stack': case 'stackB': { const L = legsFlat(-2, 2, 2); return { stance: 'stand', lean: 0.12, bob: name === 'stackB' ? 1 : 0, legs: { r: L.r, l: L.l }, feet: L.feet, rig: rig() }; }
    case 'stackTap': { const L = legsFlat(-2, 2, 2); return { stance: 'stand', lean: 0.14, legs: { r: L.r, l: L.l }, feet: L.feet, arms: { r: [0.3, 0.4, 0.07], l: [1.35, 0.15, 0.1] }, rig: rigOfCarry('low', weapon, { oneHand: true }) }; }
    // (the support hand at the handle, the rifle one-handed at the high ready)
    case 'doorHand': { const L = legsFlat(-1, 2, 1); return { stance: 'stand', lean: 0.1, legs: { r: L.r, l: L.l }, feet: L.feet, arms: { r: [0.3, 0.4, 0.07], l: [1.05, 0.25, 0.12] }, rig: rigOfCarry(carry === 'aim' ? 'aim' : 'high', weapon, { oneHand: true }) }; }
    // (the kick over its 1.2 s: chamber (the right knee up), strike (the heel out at the lock), recover)
    case 'kick0': { const L = legsFlat(1, -1, 1, { rLift: 3, rPitch: 0.1 }); return { stance: 'stand', lean: 0.06, legs: { r: L.r, l: L.l }, feet: { r: 0.1, l: 0 }, rig: rig() }; }
    case 'kick1': { const L = legsFlat(4, -1, 1, { rLift: 3, rPitch: 0.5 }); return { stance: 'stand', lean: -0.06, legs: { r: L.r, l: L.l }, feet: { r: 0.5, l: 0 }, rig: rig() }; }
    case 'kick2': { const L = legsFlat(2, -1, 1, { rLift: 1, rPitch: 0 }); return { stance: 'stand', lean: 0.04, legs: { r: L.r, l: L.l }, feet: { r: 0, l: 0 }, rig: rig() }; }
    // (the side-step, two keys a step and the feet never crossing: the lead foot out (abduction), then the trail foot in to it)
    case 'sideR0': case 'sideR1': case 'sideL0': case 'sideL1': {
      const lead = name[4] === 'R' ? 'r' : 'l', out = name.endsWith('0');
      const abd = { r: ABD, l: ABD };
      abd[lead] = out ? 0.55 : 0.18; abd[lead === 'r' ? 'l' : 'r'] = out ? 0.02 : -0.08;
      const L = legsFlat(0, 0, 1, { abd, ...(out ? { [`${lead}Lift`]: 1 } : {}) });
      return { stance: 'stand', lean: carry === 'aim' ? 0.12 : 0.1, legs: { r: L.r, l: L.l }, feet: L.feet, rig: rig() };
    }
    // (a shot on the move: the aimed glide's Passing with the kick, the legs never stopping (FM 3-06.11 §3-21c))
    case 'fireMove0': case 'fireMove1': {
      const sp = bandSpec(cycle, 'combat'), j = sp.n === 4 ? 2 : 1, L = keyLegs(cycle, 'combat', j, name.endsWith('1') ? 1 : 0);
      return { stance: 'stand', lean: 0.12, legs: L.legs, feet: L.feet, rig: { mode: 'aim', gun: weapon ?? 'rifle', turn: 0, kick: 1 } };
    }
    // (the transition (COMBAT §25.19.6): the hand at the holster, the pistol coming out; then the pistol aimed, two hands)
    case 'draw': { const L = legsFlat(-1, 2, 1); return { stance: 'stand', lean: 0.08, legs: { r: L.r, l: L.l }, feet: L.feet, rig: { mode: 'low', gun: 'pistol' } }; }
    case 'pistolAim': { const L = legsFlat(-2, 2, 1); return { stance: 'stand', lean: 0.1, legs: { r: L.r, l: L.l }, feet: L.feet, rig: { mode: 'aim', gun: 'pistol', turn: 0, kick: 0 } }; }
    default: return null;
  }
}
/** Step size check (tests): each sim band's S in this module's key sets, per candidate, against src/data/body/gait.js STEP_PX. */
export const stepPxOf = (cycle, band) => bandSpec(cycle, band).S;
export { STEP_PX };
