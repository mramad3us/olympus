// OLYMPUS art: the figures' poses. Frames as joint angles, the gun timings, and which frame the sim's state shows.
//
// tradecraft's pose table (src/art/sprites.js POSES) gave each frame a bob, arm reaches and swings and
// leg shapes per view, so a new hat or coat animated in every frame for free. OLYMPUS keeps the idea
// and one step more: a frame is a small body pose in three dimensions (POSE below), the same for every
// facing and density, which the composer (compose.js) solves into joints, projects through
// the stage's camera and draws as parts. So a walk, an aim or a float is written once and comes out right
// seen from the front, the back and both sides, at 16 and 24 px/m, and the
// left view is a true left view, not the right one mirrored: a rifle stays in the right hand and its stock
// in the right shoulder whichever way the marine faces (VIEWS.md 3.2 asks for that).
//
// A pose (all angles in radians, in the body's own frame: forward, left, up):
//   - stance: how the body meets the ground: 'stand' (the soles on it), 'kneel' (the right knee down),
//     'sit' (on a seat at the shins' height: the game lifts the card to its seat), 'prone' and 'supine'
//     (lying face down or up), 'float' (no ground: the cell's middle);
//   - legs.r / legs.l: [hip, knee, abduction] (the thigh swung forward, the knee bent, the leg out);
//   - arms.r / arms.l: [shoulder, elbow, abduction], for arms a gun doesn't hold;
//   - rig: what the hands do with the weapon (compose.js RIGS): { mode, turn, kick };
//   - lean (the torso pitched forward), bob (the upper body down that many pixels: a breath), lift
//     (metres off the ground: a stride's flight), roll (a tumble: the whole figure turned in the picture),
//     eyes ('shut'), straps (a crash couch's harness);
//   - and, from 0.0.4: noLegs (the legs under a blanket: a body sitting up in its berth is its upper half,
//     the berth's painting holds the rest), ground 'pelvis' (the seat of the body on the ground, not its
//     soles: a body sitting up or lying back on a mattress), head ('turn' a quarter turn to the body's
//     right, as a look does; 'glance' the eyes aside), headDrop (the head down that many pixels: tired).
// The frames (FRAMES) come in bands (BANDS), painted when first needed, as tradecraft's crowd painted
// a new face's street frames first and the rest on demand: the gait (idle, walk, run, the low-g bound),
// the arms (aims, fires, kneeling and prone, the magazine out and in), rest (sitting: 0.0.3 split it
// from lie, a couch and a rack, so a squad sitting at its racks paints four cells a look, not twelve,
// behind the first cut; a sleeper in a rack is the berth's own drawing, src/art/figures/bedding.js),
// float (two drifting frames and seven more turns of the first, 45° apart: VIEWS.md 3.4's tumble).
// 0.0.4 adds the frames ROADMAP §4.6 held until the look was picked (16 px/m chibi, 2026-11-06):
//   - move: the stroll (four, by distance at STEP_M.stroll: a shorter stride, the arms barely swinging),
//     the stairs up and down (four each, by distance: the knee lifted high and the body forward going up,
//     the leading leg reaching and the body back going down), the look (the head a quarter turn to the
//     body's right) and the glance (the eyes aside);
//   - rest grows the berth's transitions (PEOPLE §4.6's rise and lie down, the poses' frames by the time
//     role's poseAt): sitUp (up on the mattress, the legs under the blanket: noLegs), standUp (half risen
//     off the rack's edge, the hands on the thighs), climb (down from an upper berth, the hands up on its
//     rail), lieDown (lying back on an elbow), with sit between them; and daily life: dress0 (a shirt
//     pulled over the head, both arms up), dress1 (a leg into the trousers, the knee up), basin (leaning
//     at a sink, the hands at the basin), brush (the toothbrush at the mouth, foam on it) and shave (the
//     razor at the jaw, foam along it): held names what the right hand holds, foam where it lies.
// A look's cues change its frames, not only its colours: tired (BODY's fatigue, VIEWS §7.3: the head down
// a pixel, the arms swinging half as far, a touch more lean) is a flag poseOf() reads.
// How a weapon is carried through the gait (slung, patrol, high ready) is the look's (outfits.js
// wear(): carry), so a squad walking with slung rifles shares one sheet, and a carry changed is a new
// sheet (src/render/figures.js paints two a frame at most).
//
// Frames follow the sim, never a clock of their own (tradecraft's rule): gaitFrame() turns a gait and
// the distance walked into a frame (STEP_M a frame, so feet never slide), and gunPose() (tradecraft's
// crowd.js) reads an actor's aim and last shot on the sim's clock, so stop motion holds every frame.
// Pure: no DOM, no three.js.

export const DIRS = Object.freeze(['down', 'up', 'right', 'left']);
export const FPS = 8;
/** Metres walked a frame, by gait: feet never slide (tradecraft's walk and run; a Martian bound of 2.8 m in four). */
export const STEP_M = Object.freeze({ walk: 0.16, run: 0.45, bound: 0.7, stroll: 0.12, stairs: 0.14 });

/** tradecraft's gun timings (crowd.js), game milliseconds. */
export const FLASH_MS = 70, KICK_MS = 140, AFTER_MS = 600, RAISE_MS = 120;
/** Radians off the facing past which an aim is drawn turned: side on (up or down the picture), from the front or behind (to its right or left). */
export const TURN_RAD = Object.freeze({ side: 0.2, front: 0.35 });
/** A turned aim, the kick's throw of the muzzle (tradecraft's AIM_TILT and KICK_TILT, radians). */
export const AIM_TILT = Object.freeze({ pistol: 0.42, rifle: 0.28 }), KICK_TILT = Object.freeze({ pistol: 0.3, rifle: 0.14 });

const range = (p, n) => Array.from({ length: n }, (_, i) => `${p}${i}`);
export const BANDS = Object.freeze({
  gait: Object.freeze([...range('idle', 2), ...range('walk', 4), ...range('run', 4), ...range('bound', 4)]),
  move: Object.freeze([...range('stroll', 4), ...range('stairsUp', 4), ...range('stairsDown', 4), 'look', 'glance']),
  arms: Object.freeze(['aim', 'aimhi', 'aimlo', 'fire', 'firehi', 'firelo', 'kneel', 'kneelfire', 'magout', 'magin', 'prone', 'pronefire']),
  rest: Object.freeze(['sit', 'sitUp', 'standUp', 'climb', 'lieDown', 'dress0', 'dress1', 'basin', 'brush', 'shave']),
  lie: Object.freeze(['couch', 'sleep']),
  float: Object.freeze(['float0', 'float1', ...Array.from({ length: 7 }, (_, i) => `tumble${i + 1}`)]),
});
/** The berth's transitions as poseAt names them (the time role's src/sim/people/place.js), and the frames they draw: 'lie' is the berth's painting, 'stand' the idle. */
export const TRANSITION_FRAMES = Object.freeze({ lie: null, sitUp: 'sitUp', sit: 'sit', climb: 'climb', standUp: 'standUp', stand: null, lieDown: 'lieDown', dress: 'dress0' });
export const BAND_KEYS = Object.freeze(Object.keys(BANDS));
export const FRAMES = Object.freeze(Object.values(BANDS).flat());
export const BAND_OF = Object.freeze(Object.fromEntries(Object.entries(BANDS).flatMap(([b, fs]) => fs.map(f => [f, b]))));
export const GUN_FRAMES = Object.freeze(['aim', 'aimhi', 'aimlo', 'fire', 'firehi', 'firelo']);
/** Lying frames: a long cell seen side on, the long cell stood up seen end on. */
const LYING = new Set(['prone', 'pronefire', 'sleep', 'couch']);
/** Which cell a frame takes, seen facing dir (body.js CELLS_M). */
export function cellKind(frame, dir) {
  if (BAND_OF[frame] === 'float') return 'float';
  if (LYING.has(frame)) return dir === 'right' || dir === 'left' ? 'long' : 'tall';
  return 'stand';
}

// ---------- the poses ----------

const STAND = { r: [0, 0.03, 0.03], l: [0, 0.03, 0.03] };
const HANG = { r: [0.02, 0.14, 0.07], l: [0.02, 0.14, 0.07] };
// (a frame's left and right swapped: the second half of a gait cycle)
const flip = (p) => ({ ...p, legs: { r: p.legs.l, l: p.legs.r }, arms: p.arms && { r: p.arms.l, l: p.arms.r } });

// The walk (tradecraft's four: a contact, the passing, the other contact, the other passing), the right
// leg reaching first; the arms swing against the legs. The run lifts off on its passing frames.
const WALK0 = { legs: { r: [0.36, 0.06, 0.02], l: [-0.34, 0.2, 0.02] }, arms: { r: [-0.34, 0.16, 0.07], l: [0.34, 0.3, 0.07] } };
const WALK1 = { legs: { r: [0.02, 0.05, 0.02], l: [0.3, 0.85, 0.02] }, arms: { r: [-0.04, 0.16, 0.07], l: [0.06, 0.2, 0.07] } };
const RUN0 = { lean: 0.2, legs: { r: [0.62, 0.28, 0.02], l: [-0.42, 1.45, 0.02] }, arms: { r: [-0.65, 1.45, 0.1], l: [0.7, 1.55, 0.1] } };
const RUN1 = { lean: 0.22, lift: 0.05, legs: { r: [-0.38, 0.35, 0.02], l: [0.95, 1.6, 0.02] }, arms: { r: [0.45, 1.5, 0.1], l: [-0.5, 1.4, 0.1] } };
// The low-g bound (Mars 0.38 g, Europa 0.13: BODY.md's lope): a push-off, the rise, the apex with the
// legs tucked, the landing with the knees bent to take it. In the air the card is lifted by the sim's
// height; the frame keeps its lowest point on the cell's ground.
const BOUND = [
  { lean: 0.32, legs: { r: [-0.4, 0.12, 0.03], l: [0.75, 1.15, 0.03] }, arms: { r: [0.75, 0.9, 0.12], l: [0.35, 0.7, 0.12] } },
  { lean: 0.2, legs: { r: [-0.55, 0.55, 0.03], l: [0.6, 0.55, 0.03] }, arms: { r: [0.55, 0.75, 0.2], l: [0.5, 0.7, 0.2] } },
  { lean: 0.1, legs: { r: [0.35, 1.15, 0.05], l: [0.55, 0.95, 0.05] }, arms: { r: [0.35, 0.5, 0.65], l: [0.35, 0.5, 0.65] } },
  { lean: -0.04, legs: { r: [0.18, 0.6, 0.04], l: [0.5, 0.42, 0.04] }, arms: { r: [0.6, 0.45, 0.25], l: [0.6, 0.45, 0.25] } },
];
// A shooter's stance: the support (left) foot forward, the right back, the weight a little forward.
const SHOOT = { lean: 0.06, legs: { r: [-0.2, 0.1, 0.05], l: [0.24, 0.16, 0.04] } };
// On the right knee: its thigh down, its shin back along the ground; the left foot planted ahead.
const KNEEL = { stance: 'kneel', lean: 0.05, legs: { r: [-0.05, 1.62, 0.04], l: [1.45, 1.5, 0.08] } };
// Zero g's neutral body posture (NASA's: arms floating forward and up, knees and hips bent).
const FLOAT0 = { stance: 'float', lean: 0.18, legs: { r: [0.5, 0.85, 0.12], l: [0.4, 0.75, 0.1] }, arms: { r: [0.75, 0.95, 0.4], l: [0.7, 0.9, 0.4] } };
const FLOAT1 = { stance: 'float', lean: 0.12, legs: { r: [0.35, 0.65, 0.1], l: [0.6, 1.0, 0.14] }, arms: { r: [0.9, 0.75, 0.35], l: [0.55, 1.05, 0.45] } };

// The stroll: the walk's cycle at two thirds of its reach, the arms nearly still (an easy pace in the bay).
const STROLL0 = { legs: { r: [0.24, 0.05, 0.02], l: [-0.22, 0.14, 0.02] }, arms: { r: [-0.14, 0.14, 0.07], l: [0.14, 0.22, 0.07] } };
const STROLL1 = { legs: { r: [0.02, 0.05, 0.02], l: [0.2, 0.55, 0.02] }, arms: { r: [-0.02, 0.14, 0.07], l: [0.03, 0.18, 0.07] } };
// The stairs: up, the leading knee lifted to the next tread and the body forward over it; down, the
// leading leg reaching for the tread below, the body held back and a little lower (one tread a frame).
const UP0 = { lean: 0.16, legs: { r: [0.9, 1.25, 0.03], l: [-0.18, 0.22, 0.02] }, arms: { r: [-0.32, 0.3, 0.07], l: [0.3, 0.5, 0.07] } };
const UP1 = { lean: 0.13, legs: { r: [0.45, 0.55, 0.02], l: [0.25, 1.05, 0.02] }, arms: { r: [-0.08, 0.2, 0.07], l: [0.1, 0.3, 0.07] } };
const DOWN0 = { lean: -0.06, bob: 1, legs: { r: [0.5, 0.08, 0.02], l: [-0.06, 0.62, 0.02] }, arms: { r: [-0.18, 0.25, 0.1], l: [0.2, 0.35, 0.1] } };
const DOWN1 = { lean: -0.04, legs: { r: [0.08, 0.12, 0.02], l: [0.2, 0.42, 0.02] }, arms: { r: [-0.04, 0.2, 0.1], l: [0.06, 0.25, 0.1] } };
// The berth's transitions: up on the mattress (the legs out along it, under the blanket), lying back on
// an elbow, half risen off the rack's edge, climbing down from the upper berth facing it.
const SIT_UP = { stance: 'sit', ground: 'pelvis', noLegs: true, lean: 0.08, legs: { r: [1.5, 0.05, 0.06], l: [1.5, 0.05, 0.06] }, arms: { r: [0.35, 0.5, 0.18], l: [0.35, 0.5, 0.18] } };
const LIE_DOWN = { stance: 'sit', ground: 'pelvis', noLegs: true, lean: -0.62, legs: { r: [1.5, 0.05, 0.06], l: [1.5, 0.05, 0.06] }, arms: { r: [-0.5, 1.3, 0.3], l: [-0.5, 1.3, 0.3] } };
const STAND_UP = { lean: 0.55, legs: { r: [1.0, 1.25, 0.1], l: [1.0, 1.25, 0.1] }, arms: { r: [0.75, 0.35, 0.12], l: [0.75, 0.35, 0.12] } };
const CLIMB = { lean: 0.04, legs: { r: [0.95, 1.35, 0.05], l: [0.02, 0.05, 0.03] }, arms: { r: [2.5, 0.45, 0.18], l: [2.3, 0.6, 0.18] } };
// Dressing: a shirt pulled over the head; a leg into the trousers, the weight on the other.
const DRESS0 = { lean: 0.02, legs: STAND, arms: { r: [2.75, 0.45, 0.28], l: [2.75, 0.45, 0.28] } };
const DRESS1 = { lean: 0.2, legs: { r: [0.02, 0.06, 0.04], l: [1.05, 1.55, 0.06] }, arms: { r: [0.6, 1.0, 0.14], l: [0.6, 1.0, 0.14] } };
// At a sink: leaning over the basin from the hips, the hands down at it; the toothbrush at the mouth;
// the razor along the jaw (the forearm folded up to the face: the chibi's short arm reaches the chin).
const BASIN = { lean: 0.45, legs: { r: [-0.06, 0.06, 0.05], l: [-0.06, 0.06, 0.05] }, arms: { r: [1.0, 0.55, 0.1], l: [0.9, 0.62, 0.1] } };
const BRUSH = { lean: 0.1, legs: STAND, arms: { r: [1.2, 1.9, 0.08], l: [0.25, 0.4, 0.07] }, held: 'brush', foam: 'mouth' };
const SHAVE = { lean: 0.08, legs: STAND, arms: { r: [1.05, 2.05, 0.16], l: [0.2, 0.35, 0.07] }, held: 'razor', foam: 'jaw' };

/** A gun's rig through the gait frames, by carry: the hands' mode (compose.js RIGS). */
const CARRY_RIG = { low: 'low', high: 'high', slung: 'slung' };

/**
 * The pose of a frame for a look's weapon and carry (see the header). Plain data, a new object each call.
 * weapon: 'rifle' | 'pistol' | null; carry: 'low' | 'high' | 'slung' | null; tired: BODY's fatigue cue
 * (the head down a pixel, the arms' swing halved, a touch more lean).
 */
export function poseOf(frame, { weapon = null, carry = null, tired = false } = {}) {
  const p = basePose(frame, { weapon, carry });
  if (!tired || p.stance !== 'stand' || p.rig?.mode === 'aim') return p;
  const half = (a) => (a ? [a[0] * 0.5, a[1], a[2]] : a);
  return { ...p, lean: p.lean + 0.05, headDrop: (p.headDrop ?? 0) + 1, arms: p.arms === HANG ? p.arms : { r: half(p.arms.r), l: half(p.arms.l) } };
}
function basePose(frame, { weapon = null, carry = null } = {}) {
  const gaitRig = weapon ? { mode: CARRY_RIG[carry] ?? 'low' } : null;
  const m = /^([a-zA-Z]+?)(\d)$/.exec(frame), name = m ? m[1] : frame, k = m ? Number(m[2]) : 0;
  let p;
  switch (name) {
    case 'idle': p = { legs: STAND, arms: HANG, bob: k === 1 ? 1 : 0, rig: gaitRig }; break;
    case 'walk': p = { ...(k % 2 ? WALK1 : WALK0), rig: gaitRig }; if (k >= 2) p = flip(p); break;
    case 'stroll': p = { ...(k % 2 ? STROLL1 : STROLL0), rig: gaitRig }; if (k >= 2) p = flip(p); break;
    case 'stairsUp': p = { ...(k % 2 ? UP1 : UP0), rig: gaitRig }; if (k >= 2) p = flip(p); break;
    case 'stairsDown': p = { ...(k % 2 ? DOWN1 : DOWN0), rig: gaitRig }; if (k >= 2) p = flip(p); break;
    case 'look': p = { legs: STAND, arms: HANG, head: 'turn', rig: gaitRig }; break;
    case 'glance': p = { legs: STAND, arms: HANG, head: 'glance', rig: gaitRig }; break;
    case 'sitUp': p = { ...SIT_UP, rig: null }; break;
    case 'lieDown': p = { ...LIE_DOWN, rig: null }; break;
    case 'standUp': p = { ...STAND_UP, rig: weapon && carry === 'slung' ? gaitRig : null }; break;
    case 'climb': p = { ...CLIMB, rig: weapon && carry === 'slung' ? gaitRig : null }; break;
    case 'dress': p = { ...(k ? DRESS1 : DRESS0), rig: null }; break;
    case 'basin': p = { ...BASIN, rig: null }; break;
    case 'brush': p = { ...BRUSH, rig: null }; break;
    case 'shave': p = { ...SHAVE, rig: null }; break;
    case 'run': p = { ...(k % 2 ? RUN1 : RUN0), rig: gaitRig }; if (k >= 2) p = flip(p); break;
    case 'bound': p = { ...BOUND[k], rig: gaitRig }; break;
    case 'float': p = { ...(k ? FLOAT1 : FLOAT0), rig: gaitRig && gaitRig.mode === 'slung' ? gaitRig : weapon ? { mode: 'low' } : null }; break;
    case 'tumble': p = { ...FLOAT0, roll: k * Math.PI / 4, rig: gaitRig && gaitRig.mode === 'slung' ? gaitRig : weapon ? { mode: 'low' } : null }; break;
    default: p = null;
  }
  if (!p) {
    const gun = weapon ?? 'rifle';                                   // (an aim with nothing in the hands draws the rifle's: a sheet is a look's)
    switch (frame) {
      case 'aim': case 'aimhi': case 'aimlo': case 'fire': case 'firehi': case 'firelo':
        p = { ...SHOOT, rig: { mode: 'aim', gun, turn: frame.endsWith('hi') ? 1 : frame.endsWith('lo') ? -1 : 0, kick: frame.startsWith('fire') ? 1 : 0 } };
        break;
      case 'kneel': case 'kneelfire': p = { ...KNEEL, rig: { mode: 'aim', gun, turn: 0, kick: frame === 'kneelfire' ? 1 : 0, kneel: true } }; break;
      case 'magout': case 'magin': p = { ...SHOOT, lean: 0.1, rig: { mode: frame, gun } }; break;
      case 'prone': case 'pronefire':
        p = { stance: 'prone', legs: { r: [0, 0.05, 0.16], l: [0, 0.3, 0.12] }, rig: { mode: 'prone', gun, kick: frame === 'pronefire' ? 1 : 0 } };
        break;
      case 'sit': p = { stance: 'sit', lean: -0.02, legs: { r: [1.52, 1.5, 0.12], l: [1.52, 1.5, 0.12] }, arms: { r: [0.62, 0.45, 0.06], l: [0.62, 0.45, 0.06] }, rig: weapon ? { mode: carry === 'slung' ? 'slung' : 'lap' } : null }; break;
      case 'couch': p = { stance: 'supine', legs: { r: [0.04, 0.05, 0.06], l: [0.04, 0.05, 0.06] }, arms: { r: [0.05, 0.12, 0.3], l: [0.05, 0.12, 0.3] }, straps: true, rig: null }; break;
      case 'sleep': p = { stance: 'supine', legs: { r: [0.04, 0.1, 0.03], l: [0.06, 0.18, 0.02] }, arms: { r: [0.35, 1.3, 0.12], l: [0.05, 0.15, 0.08] }, eyes: 'shut', rig: null }; break;
      default: throw new Error(`figures: no frame "${frame}"`);
    }
  }
  return { stance: 'stand', lean: 0, bob: 0, lift: 0, roll: 0, arms: HANG, ...p };
}

// ---------- which frame the sim's state shows ----------

const mod = (n, k) => ((n % k) + k) % k;
/**
 * A frame for a gait and the distance walked (stride, metres; tradecraft's crowd.js) or the time for
 * idling (tS seconds, 2 fps, a person's phase): walk, run and bound by distance, sit and the rest by name.
 */
export function gaitFrame(gait, { stride = 0, tS = 0, phase = 0 } = {}) {
  if (gait === 'walk') return `walk${mod(Math.floor(stride / STEP_M.walk), 4)}`;
  if (gait === 'stroll') return `stroll${mod(Math.floor(stride / STEP_M.stroll), 4)}`;
  if (gait === 'stairsUp' || gait === 'stairsDown') return `${gait}${mod(Math.floor(stride / STEP_M.stairs), 4)}`;
  if (gait === 'run') return `run${mod(Math.floor(stride / STEP_M.run), 4)}`;
  if (gait === 'bound') return `bound${mod(Math.floor(stride / STEP_M.bound), 4)}`;
  if (gait === 'float') return `float${mod(Math.floor(tS * 1 + phase), 2)}`;                 // (1 fps: VIEWS.md 3.4)
  if (FRAMES.includes(gait)) return gait;
  return `idle${mod(Math.floor(tS * 2 + phase), 2)}`;
}

/** The tumble frame nearest a roll angle (radians): float0 or tumble1..7, 45° apart (VIEWS.md 3.4). */
export function tumbleFrame(rollRad) {
  const k = mod(Math.round(rollRad / (Math.PI / 4)), 8);
  return k ? `tumble${k}` : 'float0';
}

const HEAD = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
/**
 * Which way an aim (to, radians: atan2(dz, dx)) is turned off the facing, as the picture shows it
 * (tradecraft's turnOf): side on, 1 up the picture, -1 down; from the front or behind, 1 to the
 * picture's right, -1 its left; 0 straight.
 */
export function turnOf(face, to) {
  const c = Math.cos(to), s = Math.sin(to);
  if (face === 'right' || face === 'left') { const r = Math.atan2(s, face === 'right' ? c : -c); return r < -TURN_RAD.side ? 1 : r > TURN_RAD.side ? -1 : 0; }
  const r = Math.atan2(c, face === 'up' ? -s : s);
  return r > TURN_RAD.front ? 1 : r < -TURN_RAD.front ? -1 : 0;
}

/**
 * How someone with a gun in hand is drawn at game time ms (tradecraft's gunPose): { frame, flash }, frame a
 * gun frame or null (not aiming: the gait's own, with the carry's rig); flash, the muzzle alight. Reads
 * a.$aim ({ x, z, ms }), a.$shot (ms), a.face, a.head, a.gait, a.stance ('kneel', 'prone') and where they stand.
 */
export function gunPose(a, ms) {
  const since = typeof a.$shot === 'number' ? ms - a.$shot : Infinity, fired = since >= 0 && since < AFTER_MS;
  const kick = since >= 0 && since < KICK_MS, flash = since >= 0 && since < FLASH_MS;
  if (!a.$aim && !fired) return { frame: null, flash: false };
  if (a.stance === 'prone') return { frame: kick ? 'pronefire' : 'prone', flash };
  if (a.stance === 'kneel') return { frame: kick ? 'kneelfire' : 'kneel', flash };
  if (!['idle', 'walk', 'run', undefined].includes(a.gait)) return { frame: null, flash: false };
  const face = HEAD[a.face] !== undefined ? a.face : 'down', dx = a.$aim ? a.$aim.x - a.x : 0, dz = a.$aim ? a.$aim.z - a.z : 0;
  const to = Math.hypot(dx, dz) > 0.05 ? Math.atan2(dz, dx) : a.head ?? HEAD[face];
  const up = a.$aim ? ms - a.$aim.ms : Infinity;
  let turn = turnOf(face, to);
  if (!kick && (face === 'left' || face === 'right') && up >= 0 && up < RAISE_MS && turn >= 0) turn--;   // (coming up from the carry)
  return { frame: `${kick ? 'fire' : 'aim'}${turn > 0 ? 'hi' : turn < 0 ? 'lo' : ''}`, flash };
}
