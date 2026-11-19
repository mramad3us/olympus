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
// 0.0.5 adds the rifle's handling (the build sheet 0.0.5 §2.3 (b), VIEWS §3.4's weapon frames), in three
// bands of their own, a POOL apart on the atlas (src/art/figures/atlas.js) so a look that never handles
// a rifle costs none of them: rifle (standing: the low and high ready, slung front and on the back held
// still, the rifle raised from the sling or slung again, the charging handle, the bolt released, the
// press check), rifleKneel (the same kneeling, with the magazine out and in) and rifleProne (prone: the
// rifle rested forward, slung across the back, the charging handle, the release, the press check, the
// magazine out and in, the rifle propped on the elbows for the hands to work under it); the aims and the
// fires stay in arms. rifleFrame() turns the arms role's gunLook (src/sim/arms/look.js: carry, stance,
// action, aim, kick, flash) into the frame to draw, on the sim's clock, as gunPose() does for an actor.
// 0.0.7 (the build sheet 0.0.7 §2.4 (c), (d); WEAPONS §7.3, BODY §27): the sitting position with the R-7 on the
// KD's 200 m line, in a base-pool band of its own, seated (sitAim, sitFire, sitLow, sitCharge, sitMagout: the
// seat on the ground, the knees up and apart, the elbows on them; laid after float on the base sheet's last
// shelf, so the sheet keeps its 512 × 752 and its 40 looks at 16 px/m), its handling drawn there (a magazine
// in or out is sitMagout, the charging handle, the release and a press check sitCharge); a casualty lying on
// the back, a knee up and a hand at the wound (hurt, in lie); the corpsman kneeling at work over them (aid, in
// rest: on the right knee, both hands forward and down).
// A look's cues change its frames, not only its colours: tired (BODY's fatigue, VIEWS §7.3: the head down
// a pixel, the arms swinging half as far, a touch more lean) is a flag poseOf() reads.
// How a weapon is carried through the gait (slung, patrol, high ready) is the look's (outfits.js
// wear(): carry), so a squad walking with slung rifles shares one sheet, and a carry changed is a new
// sheet (src/render/figures.js paints two a frame at most).
//
// Frames follow the sim, never a clock of their own (tradecraft's rule): gaitFrame() turns a gait and
// the distance walked into a frame (STEP_M a frame, so feet never slide), and gunPose() (tradecraft's
// crowd.js) reads an actor's aim and last shot on the sim's clock, so stop motion holds every frame.
// The shoot house rework's R8 (VIEWS §3.10; the user, 2026-11-11: "the animation is really not there yet"): the walk and
// the run are the chosen candidate's cycle (src/art/figures/walk.js: the look's `cycle`, B until the user's score), eight
// frames a cycle chosen by the gait phase gp (walkFrame), the planted foot held by the view's plant lock; the stroll's four
// frames go (the stroll is the walk band at its speed), so the base sheet keeps its 512 × 752: 'gait' holds idle 2, walk 8,
// bound 4, look and glance, 'move' run 8 and the stairs. The STANCE pool (STANCE_BANDS, a sheet a carry that only an armed
// mover in a stance gets: atlas.js, src/render/figures.js) holds the Combat glide and Assault's eight each, their flight, the
// side-step, start, plant, the stack and its breath, the #2's tap, the door's hand, the kick, the kneel half way, the shot
// on the move and the pistol (VIEWS §3.10.7). The v0.0.12 walk, stroll and run poses survive as legacyPose() for the walk
// sample's W0 only.
// v0.0.19 (the build sheet 0.0.19 §1 L-look; opfor §2.6; COMBAT §7.11): a role-player who gives up drops his rifle and puts his
// hands up, and kneels when challenged: handsUp and handsKneel, the hands raised empty, palms out, at the place the user scores
// (HANDS_POSES: H1 at the shoulders, the default, H2 by the face; samples/opfor-look). They are carry-free (no rig: the rifle is
// on the floor), so they sit at the end of the arms band, whose shelf has room for them: the base sheet keeps its 512 × 752 at
// 16 px/m (1128 at 24), and handsFrame(stance) names the one to draw. A man down is drawn sitting where he is with his rifle low
// (the seated band's sitLow: the actor's stance 'sit', rifleFrame's), not a new frame.
// v0.0.22 (its build sheet §1 item 17; the residuals lens's R3; VIEWS §3.10): a device in the hands. The held band (BANDS.stanceHeld,
// HELD_BAND) is the stance pool's last, painted only in a stance sheet of the slung-in-front carry ('front', the hands-full rule's
// rifle), beside the shots on their shelf, so the stance sheet keeps its 512 × 432 at 16 px/m: the G-11 held at the chest and its pin,
// the throw's two frames, the halligan carried and the pry's two, the ram carried and its swing's two, the strip carried and placed
// (templates.js HELD_POSES: the arms by the rig's IK where the defaults of samples/held-devices hold them, over the stack's legs). Its
// frames carry no device: the device is a card over the figure (atlas.js heldStrip). heldFrameOf(held, beat) names the frame a body
// standing with a device draws (look.js heldLook and beatOf's device beats); walking, it draws its walk, the card at its fist.
// v0.0.23 (the user's note of 2026-11-17: "Graphics : Holding the sidearm with the rifle dangling should be redrawn, sidearm should
// have the same stances (low ready, high ready, aimed, etc) as the rifle"): THE P-12'S STANCES. With the pistol out the stage drew
// the rifle slung in front and empty hands (the stance pool's 'draw' and 'pistolAim' are in no sheet a pistol's look has: its carry
// is 'front', and the view falls back to the carry's frame), so the sidearm was never seen. The pistol band (BANDS.pistol, in the
// rifle's pool beside its handling: carry-free, painted with the rifle bands before GO, so a pistol's look draws them from any of its
// sheets) holds the P-12 as the rifle's are held: pistolLow (the low ready, the muzzle down before the belly), pistolHigh (the high
// ready, the muzzle up at the chest), pistolAimed and pistolFire (both arms out, its kick), pistolHolster (the right hand at the
// holstered grip: the draw and the holster), pistolCheck (the admin: the press check, the slide racked, the clearing, the support
// hand on the slide), pistolMag (the magazine out and in, the support hand at the well), pistolWalk0 to 3 (the low ready on the
// move) and pistolAimWalk0 to 3 (aimed on the move, the turret's arms over the same legs), each walk four keys across the whole of the
// combat glide's cycle, both steps (the contact and the passing of each: the review of 2026-11-18 found the first four keys drawn
// from the first step only, the second step held on one frame, and the aimed walk one standing frame sliding over the floor); the
// band is held to fifteen frames so the rifle pool's sheet keeps three across a 4096 atlas at 16 px/m and two at 24 (atlas.js
// RIFLE_SHEET_W_M), which is why a walk is four keys a cycle and not the glide's eight; each with the R-7 hanging on its sling (the rig's `hang`, compose.js: across the chest, muzzle
// down, under the arms, never through them), swinging with the walk's stride (compose.js HANG_SWING_K, a pendulum from the sling).
// pistolFrameOf(pistol, action, kick) names the frame standing from gunLook's pistol posture and action frame, pistolWalkOf(pistol,
// walkAt, n) walking; rifleFrame() draws it whenever the P-12 is the gun carried. The rifle's own frames are as before.
// v0.0.24 (v0.0.23's play review, finding 7: the high-ready pistol walked drawn at the low ready): THE P-12'S HIGH-READY WALK,
// pistolHighWalk0 to 3 (the high ready's arms over the same four keys of legs). Four more frames in the pistol band would not fit:
// the rifle pool's sheet is 1360 px at 16 px/m, three across a 4096 atlas with 16 px to spare (2040 and two across at 24), so
// one frame more takes the rifle sheets from 6 to 4 at 16 px/m and the base sheets from 15 to 10 at 24. They are a band of the stance
// pool instead (BANDS.stancePistol, PISTOL_HIGH_BAND), on the shots' shelf beside fireMove (which had 384 px free at 16 px/m, the
// stance sheet's 512 × 576 unchanged, in its base slot as before), painted only in the high carry's stance sheet, which every armed
// mover has before GO (view.js), so no sheet is added and no slot taken: base 40 and 15, rifle 6 and 6 at 16 and 24 px/m, before and
// after. The view draws them for a mover in a stance (pistolWalkOf's sheet), from that sheet; anywhere else, and while it paints, the
// low ready's walk as before. The stance pool's 'draw' and 'pistolAim' are gone from the sheet (nothing in the game asked them since
// the pistol band; walk.js beatPose keeps the two poses, which three sample pages draw: p12-draw, pistol-stances, portrait-pose).
// v0.0.26 ("Bang, then go", its build sheet items 6 and 8, §3.3, §10, §11 risk 1): A MAN IN THE BANG. A role-player the bang
// startles, stuns or blinds is drawn dazed for exactly as long as the sim's block says (daze0, daze1: hunched, the support hand to
// the eyes, the rifle hanging muzzle down at the strong-side hip, samples/breach-poses D-a until the user scores; its sway, the
// upper body a pixel down at DAZE_SWAY_HZ 1.5 Hz on the game's clock, daze1, held on daze0 under "reduce flashes"; kneeling, the
// same upper body over the kneel's legs, dazeKneel0 and dazeKneel1, my call: a man dazed at his hide stays on his knee), and one
// frozen is drawn cowering (cower: crouched on both soles, the arms over the head, the rifle hanging slung across the chest, C-a).
// The sheet's first plan, carry-free frames at the arms band's end as handsUp is, does not fit: the arms band is 480 px of the
// base sheet's 512 at 16 px/m (its prone cells 48 wide side on), so two cells more would widen every base sheet to 544 and lose
// a column of the atlas's looks. They are a band of the stance pool instead (BANDS.stanceShock, SHOCK_BAND: §11 risk 1's
// fallback, a band of their own), on the shots' shelf beside the P-12's high walk (352 of its 512 px at 16 px/m, 528 of 768 at
// 24), painted only in the low carry's stance sheet (SHOCK_CARRY) and only for the role-players (view.js prepareOwn, behind the
// brief's cut), so the stance sheet keeps its 512 × 576 and no slot is added. Each frame draws the rifle itself by its rig
// (the hip's hang, slung in front), the hands put by `reach` (compose.js's IK, as the held devices' candidates are): the
// candidates' rows are the sample's, DAZE_POSES and COWER_POSES, the pick DAZE_POSE and COWER_POSE (a score is one constant).
// shockFrameOf(gl) names the frame from look.js gunLook's action ('daze' or 'cower', from men.js liveStateOf), dazeSway(frame,
// ms, still) its sway.
// Pure: no DOM, no three.js.
import { cyclePose, beatPose, bandSpec, cycleAt, cycleOfLook, RUN_FPS } from './walk.js';
import { HELD_POSES } from './templates.js';
import { stageTurnOf } from '../../data/faces.js';

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
  gait: Object.freeze([...range('idle', 2), ...range('walk', 8), ...range('bound', 4), 'look', 'glance']),
  move: Object.freeze([...range('run', 8), ...range('stairsUp', 4), ...range('stairsDown', 4)]),
  arms: Object.freeze(['aim', 'aimhi', 'aimlo', 'fire', 'firehi', 'firelo', 'kneel', 'kneelfire', 'magout', 'magin', 'prone', 'pronefire', 'handsUp', 'handsKneel']),
  rest: Object.freeze(['sit', 'sitUp', 'standUp', 'climb', 'lieDown', 'dress0', 'dress1', 'basin', 'brush', 'shave', 'aid']),
  lie: Object.freeze(['couch', 'sleep', 'hurt']),
  float: Object.freeze(['float0', 'float1', ...Array.from({ length: 7 }, (_, i) => `tumble${i + 1}`)]),
  seated: Object.freeze(['sitAim', 'sitFire', 'sitLow', 'sitCharge', 'sitMagout']),
  rifle: Object.freeze(['lowReady', 'highReady', 'slungFront', 'slungBack', 'raise', 'charge', 'release', 'pressCheck']),
  rifleKneel: Object.freeze(['kneelLow', 'kneelHigh', 'kneelFront', 'kneelSlung', 'kneelCharge', 'kneelRelease', 'kneelCheck', 'kneelMagout', 'kneelMagin']),
  rifleProne: Object.freeze(['proneLow', 'proneSlung', 'proneCharge', 'proneRelease', 'proneCheck', 'proneMagout', 'proneMagin']),
  // (R8: the stance pool, in the look's carry (low, high, aimed): the glide and Assault, then the beats, then the shots)
  stanceWalk: Object.freeze([...range('glide', 8), ...range('assault', 8)]),
  stanceBeats: Object.freeze(['flight0', 'flight1', 'sideR0', 'sideR1', 'sideL0', 'sideL1', 'start', 'plant', 'kneelGoing', 'stack', 'stackB', 'stackTap', 'doorHand', 'kick0', 'kick1', 'kick2']),
  stanceShots: Object.freeze(['fireMove0', 'fireMove1']),
  // (the P-12's high-ready walk, on the shots' shelf: see the header)
  stancePistol: Object.freeze(range('pistolHighWalk', 4)),
  // (a role-player dazed (with its sway, standing and kneeling) and cowering, on the same shelf: see the header)
  stanceShock: Object.freeze(['daze0', 'daze1', 'dazeKneel0', 'dazeKneel1', 'cower']),
  // (a device in the hands, in the slung-in-front carry's stance sheet only: see the header)
  stanceHeld: Object.freeze(Object.keys(HELD_POSES)),
  // (the P-12's stances with the R-7 hanging on its sling, the rifle's pool: see the header)
  pistol: Object.freeze(['pistolLow', 'pistolHigh', 'pistolAimed', 'pistolFire', 'pistolHolster', 'pistolCheck', 'pistolMag', ...range('pistolWalk', 4), ...range('pistolAimWalk', 4)]),
});
/** The bands painted in the rifle's pool of the atlas (atlas.js sheetLayout's pools): only a look that handles a rifle needs them. */
export const RIFLE_BANDS = Object.freeze(['rifle', 'rifleKneel', 'rifleProne', 'pistol']);
/** The P-12's walks (the low ready and aimed): their keys across the whole of the combat glide's cycle, both steps (see the header). */
export const PISTOL_WALK_N = 4;
/** The glide's frame (0 .. 2n − 1: step × n + key) that a pistol walk's key k draws: the first frame of its share of the cycle. */
export const pistolWalkKey = (k, n) => Math.min(2 * n - 1, Math.ceil(k * 2 * n / PISTOL_WALK_N));
/**
 * The frame of a body walking with the P-12 out (gait-view.js, from the walk's place in its cycle: walkFrame's step and key, a
 * cycle of 2n frames, n the band's keys a step; the flight read as its step's last key): its share of the whole cycle to one of
 * PISTOL_WALK_N keys, so both steps are drawn in order; aimed, the aimed walk (the turret's arms over the same legs); else the low
 * ready's, the R-7 swinging on its sling.
 */
export function pistolWalkOf(pistol, walkAt, n = 4, { sheet = false } = {}) {
  if (!pistol) return null;
  const nn = Math.max(1, n);
  let f;
  if (Number.isFinite(walkAt?.step) && Number.isFinite(walkAt?.j)) f = (walkAt.step % 2) * nn + Math.min(nn - 1, walkAt.j);
  else f = Math.min(2 * nn - 1, Number(/(\d+)$/.exec(walkAt?.frame ?? '')?.[1] ?? 0));
  const k = Math.min(PISTOL_WALK_N - 1, Math.floor(f * PISTOL_WALK_N / (2 * nn)));
  return `${pistol.posture === 'aimed' ? 'pistolAimWalk' : pistol.posture === 'highReady' && sheet ? 'pistolHighWalk' : 'pistolWalk'}${k}`;
}
/** The P-12's frames (see the header): by its posture, its action's frame and its kick. */
export const PISTOL_FRAMES = Object.freeze(BANDS.pistol);
const PISTOL_POSTURE = Object.freeze({ lowReady: 'pistolLow', highReady: 'pistolHigh', aimed: 'pistolAimed' });
const PISTOL_ACTION = Object.freeze({ raise: 'pistolHolster', sling: 'pistolHolster', check: 'pistolCheck', charge: 'pistolCheck', release: 'pistolCheck', magout: 'pistolMag', magin: 'pistolMag', aim: 'pistolAimed', fire: 'pistolFire' });
/** The frame of a body with the P-12 out (gunLook's pistol { posture }, its action frame (look.js ACTION_FRAMES' name, a list walked by k) and kick). */
export function pistolFrameOf(pistol, action = null, kick = 0) {
  if (!pistol) return null;
  if (kick > 0) return 'pistolFire';
  const act = action?.frame ?? action, list = Array.isArray(act) ? act : act ? [act] : [];
  const f = list.length ? list[Math.min(list.length - 1, Math.max(0, Math.floor((action?.k ?? 0) * list.length)))] : null;
  // (the play review's eighth finding: 'raise' with the P-12 already out is a change of its posture (V, low to high
  // ready), drawn as the posture it goes to, never the holster's frame: a dip to the thigh at every press; the draw itself is
  // 'raise' with the pistol still in the holster, gunLook giving no pistol, so the rifle's frames draw it)
  const fa = f === 'raise' ? null : f;
  return (fa && PISTOL_ACTION[fa]) ?? PISTOL_POSTURE[pistol.posture] ?? 'pistolLow';
}
/** The stance pool's bands (R8: a sheet a carry, for an armed mover in a stance, in a base slot of its own: atlas.js, src/render/figures.js). */
export const STANCE_BANDS = Object.freeze(['stanceWalk', 'stanceBeats', 'stanceShots', 'stancePistol', 'stanceShock', 'stanceHeld']);
/** The P-12's high-ready walk's band (v0.0.24: see the header), painted only in the high carry's stance sheet, which every armed mover has before GO. */
export const PISTOL_HIGH_BAND = 'stancePistol', PISTOL_HIGH_CARRY = 'high';
/** The held band: painted only in the slung-in-front carry's stance sheet (HELD_CARRY), the others' stance sheets leave it out. */
export const HELD_BAND = 'stanceHeld', HELD_CARRY = 'front';
/** The shock's band (v0.0.26: see the header), painted only in the low carry's stance sheet of a role-player, which view.js draws it from. */
export const SHOCK_BAND = 'stanceShock', SHOCK_CARRY = 'low';
/** The daze's sway (VIEWS §3.4: the upper body a pixel down and up again, game time; none under "reduce flashes"). */
export const DAZE_SWAY_HZ = 1.5;
/** The frame of a role-player in the shock (gunLook's action frame 'daze' or 'cower', from men.js liveStateOf), by his stance: or null. */
export function shockFrameOf(gl) {
  const act = gl?.action?.frame;
  if (act === 'daze') return gl.stance === 'kneel' ? 'dazeKneel0' : 'daze0';
  if (act === 'cower') return 'cower';
  return null;
}
/** A daze frame at its sway's phase at game ms (the second half of each cycle a pixel down); held still, or any other frame, as given. */
export function dazeSway(frame, ms, still = false) {
  if (still || !/^daze(Kneel)?0$/.test(frame ?? '') || !Number.isFinite(ms)) return frame;
  const ph = ((ms / 1000) * DAZE_SWAY_HZ) % 1;
  return ph >= 0.5 ? frame.replace(/0$/, '1') : frame;
}
/** The frame a body standing with a device draws: held look.js heldLook's { shape }, beat beatOf's device beat ({ kind, k, model }) or null. */
/**
 * v0.0.24 (the user, 2026-11-19: "Use the ones that make sense depending on how far we're throwing"): a throw under THROW_NEAR_M is
 * wound up at the hip and bowled round the jamb (G2, T3), one over THROW_FAR_M cocked at the shoulder and thrown overarm (G3, T2),
 * the rest today's lob from the chest (G1, T1); the distance is the thrown grenade's flight (look.js heldLook's throwM), known once
 * the throw is solved at its beat's start, so the hold before it stays at the chest (my numbers: a room's near corner through its
 * door is 2 to 3 m, its far wall 4 to 6 m).
 */
export const THROW_NEAR_M = 3, THROW_FAR_M = 8;
/** The throw's frames' infix by distance (see above): 'Near', '' (today's) or 'Far'; '' with no distance. */
export const throwClassOf = (m) => (!Number.isFinite(m) ? '' : m < THROW_NEAR_M ? 'Near' : m > THROW_FAR_M ? 'Far' : '');
export function heldFrameOf(held, beat = null) {
  if (!held) return null;
  const sh = held.shape, k = beat?.k ?? 0;
  if (sh === 'can' || sh === 'egg') {
    if (beat?.kind === 'throw') { const c = throwClassOf(held.throwM); return `heldThrow${c}${k < 0.5 ? 0 : 1}`; }
    if (beat?.kind === 'arm') return k >= 0.75 ? 'heldPin' : 'heldCan';
    return 'heldCan';
  }
  if (sh === 'bar') return beat?.kind === 'force' ? (Math.floor(k * 6) % 2 ? 'heldForce1' : 'heldForce0') : 'heldBar';
  if (sh === 'ram') return beat?.kind === 'force' ? (k < 0.5 ? 'heldSwing0' : 'heldSwing1') : 'heldRam';
  if (sh === 'strip') return beat?.kind === 'place' ? 'heldPlace' : 'heldStrip';
  return null;
}
/** The carries a stance sheet is painted in (a slung or front-slung rifle walks on the base sheet's Relaxed frames). */
export const STANCE_CARRIES = Object.freeze(['low', 'high', 'aim']);
/** Which pool of the atlas each band is painted in: 'base' (every look's sheet), 'rifle' or 'stance'. */
export const POOL_OF = Object.freeze(Object.fromEntries(Object.keys(BANDS).map(b => [b, RIFLE_BANDS.includes(b) ? 'rifle' : STANCE_BANDS.includes(b) ? 'stance' : 'base'])));
/** The berth's transitions as poseAt names them (the time role's src/sim/people/place.js), and the frames they draw: 'lie' is the berth's painting, 'stand' the idle, 'walk' the gait's walk by the metres walked (the steps between a lower berth's edge and its foot). */
export const TRANSITION_FRAMES = Object.freeze({ lie: null, sitUp: 'sitUp', sit: 'sit', climb: 'climb', standUp: 'standUp', walk: null, stand: null, lieDown: 'lieDown', dress: 'dress0' });
export const BAND_KEYS = Object.freeze(Object.keys(BANDS));
export const FRAMES = Object.freeze(Object.values(BANDS).flat());
export const BAND_OF = Object.freeze(Object.fromEntries(Object.entries(BANDS).flatMap(([b, fs]) => fs.map(f => [f, b]))));
export const GUN_FRAMES = Object.freeze(['aim', 'aimhi', 'aimlo', 'fire', 'firehi', 'firelo']);
/** Lying frames: a long cell seen side on, the long cell stood up seen end on. */
const LYING = new Set(['prone', 'pronefire', 'sleep', 'couch', 'hurt', ...BANDS.rifleProne]);
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

// (v0.0.12's walk, run and stroll above and below: the walk sample's W0 only, through legacyPose; the game draws walk.js's cycles)
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
// (0.0.7) Sitting to shoot (WEAPONS §7.3): the seat on the ground, the knees drawn up and apart, the body forward over
// them, the elbows on the knees; a casualty on the back, the right knee up, a hand at the wound; the corpsman on his
// right knee, both hands forward and down at work.
const SEATED = { stance: 'sit', ground: 'pelvis', lean: 0.36, legs: { r: [1.95, 1.55, 0.3], l: [1.95, 1.55, 0.3] } };
const HURT = { stance: 'supine', legs: { r: [0.7, 1.3, 0.08], l: [0.06, 0.12, 0.05] }, arms: { r: [0.9, 1.6, 0.2], l: [0.15, 0.3, 0.5] }, rig: null };
const AID = { ...KNEEL, lean: 0.55, arms: { r: [1.05, 0.35, 0.12], l: [1.0, 0.45, 0.14] }, rig: null };
/** The hands up's arms by the look scored ([shoulder, elbow, abduction] each side): H1 at the shoulders (the default), H2 by the face. */
export const HANDS_POSES = Object.freeze({
  H1: Object.freeze({ r: Object.freeze([0.45, 2.45, 0.5]), l: Object.freeze([0.45, 2.45, 0.5]) }),
  H2: Object.freeze({ r: Object.freeze([1.05, 2.15, 0.6]), l: Object.freeze([1.05, 2.15, 0.6]) }),
});
export const HANDS_POSE = 'H1';
/** The hands up's pose for a look of HANDS_POSES (the samples draw each; the game's frames are HANDS_POSE's), kneeling or standing. */
export function handsPose(id = HANDS_POSE, kneel = false) {
  const arms = HANDS_POSES[id] ?? HANDS_POSES[HANDS_POSE];
  return kneel ? { ...KNEEL, lean: 0.02, arms: { r: [...arms.r], l: [...arms.l] }, rig: null } : { ...STAND_EASY, legs: STAND, arms: { r: [...arms.r], l: [...arms.l] }, rig: null };
}
/** The frame of a man with his hands up, by his stance: kneeling (challenged) or standing. */
export const handsFrame = (stance) => (stance === 'kneel' ? 'handsKneel' : 'handsUp');

// (the daze and the cower, the sample's candidates' stage rows written outright (samples/breach-poses/poses.js, held equal
// by tests/samples-breach): a pose in the figure engine's terms, the rifle by its rig, the free hands by `reach`)
const HUNCH_LEGS = Object.freeze({ r: Object.freeze([0.3, 0.55, 0.08]), l: Object.freeze([0.18, 0.4, 0.07]) });
const CROUCH_LEGS = Object.freeze({ r: Object.freeze([1.85, 2.45, 0.14]), l: Object.freeze([1.85, 2.45, 0.14]) });
/** The daze's candidates (D: startled, stunned or flash-blind): D-a the default, D-b the head turned away. */
export const DAZE_POSES = Object.freeze({
  'D-a': Object.freeze({ lean: 0.38, headDrop: 1, legs: HUNCH_LEGS, rig: Object.freeze({ mode: 'hip', gun: 'rifle' }), reach: Object.freeze({ r: Object.freeze([0.06, -0.15, -0.33]), l: Object.freeze([0.15, 0.0, 0.27]) }) }),
  'D-b': Object.freeze({ lean: 0.32, head: 'turn', headDrop: 1, legs: HUNCH_LEGS, rig: Object.freeze({ mode: 'low', gun: 'rifle', oneHand: true }), reach: Object.freeze({ l: Object.freeze([0.17, -0.08, 0.25]) }) }),
});
/** The cower's candidates (C: frozen): C-a the default, crouched, the arms over the head; C-b down in the corner. */
export const COWER_POSES = Object.freeze({
  'C-a': Object.freeze({ lean: 0.55, headDrop: 2, legs: CROUCH_LEGS, rig: Object.freeze({ mode: 'front', gun: 'rifle' }), reach: Object.freeze({ r: Object.freeze([0.02, -0.16, 0.3]), l: Object.freeze([0.02, 0.16, 0.3]) }) }),
  'C-b': Object.freeze({ stance: 'sit', ground: 'pelvis', lean: 0.42, head: 'turn', headDrop: 2, legs: Object.freeze({ r: Object.freeze([1.9, 2.1, 0.2]), l: Object.freeze([1.9, 2.1, 0.2]) }), rig: Object.freeze({ mode: 'lap', gun: 'rifle' }), reach: Object.freeze({ r: Object.freeze([0.24, -0.1, -0.18]), l: Object.freeze([0.24, 0.1, -0.18]) }) }),
});
/** The picks the game draws until the user scores samples/breach-poses (its defaults). */
export const DAZE_POSE = 'D-a', COWER_POSE = 'C-a';
/**
 * The shock band's pose of a frame (see the header), as a given pose is composed (compose.js composeFrame's `given`: the sample's
 * own way, so the game's frame is the sample's pixel for pixel), or null: daze0 and daze1 the pick standing, its sway a pixel down;
 * dazeKneel0 and dazeKneel1 its upper body over the kneel's legs; cower the cower's pick.
 */
export function shockPose(frame, { daze = DAZE_POSE, cower = COWER_POSE } = {}) {
  const m = /^(daze|dazeKneel)([01])$/.exec(frame ?? '');
  const base = { stance: 'stand', lean: 0, bob: 0, lift: 0, roll: 0 };
  if (m) {
    const D = DAZE_POSES[daze] ?? DAZE_POSES[DAZE_POSE];
    return m[1] === 'dazeKneel' ? { ...base, ...D, stance: KNEEL.stance, legs: KNEEL.legs, bob: Number(m[2]) } : { ...base, ...D, bob: Number(m[2]) };
  }
  if (frame === 'cower') return { ...base, ...(COWER_POSES[cower] ?? COWER_POSES[COWER_POSE]) };
  return null;
}

// The rifle's held frames (0.0.5): a stance's body (SHOOT's feet standing, KNEEL, PRONE's) and the rig's
// mode (compose.js rigOf: 'low', 'high', 'front' slung across the chest hands off, 'slung' on the back,
// 'raise' both hands bringing it off the sling, 'charge' the right hand at the charging handle, 'release'
// the left at the bolt catch, 'check' the left at the port and the eyes on it, 'magout' and 'magin',
// 'proneRest' the rifle rested forward off the shoulder). Prone, the hands work with the rifle propped on
// the elbows (rig.prone), so its magazine well is clear of the ground.
const STAND_EASY = { lean: 0.03, legs: { r: [-0.08, 0.06, 0.05], l: [0.1, 0.1, 0.05] } };
const PRONE_BODY = { stance: 'prone', legs: { r: [0, 0.05, 0.16], l: [0, 0.3, 0.12] } };
const HELD_RIFLE = Object.freeze({
  lowReady: [STAND_EASY, 'low'], highReady: [STAND_EASY, 'high'], slungFront: [STAND_EASY, 'front'], slungBack: [STAND_EASY, 'slung'],
  raise: [STAND_EASY, 'raise'], charge: [SHOOT, 'charge'], release: [SHOOT, 'release'], pressCheck: [SHOOT, 'check'],
  kneelLow: [KNEEL, 'low'], kneelHigh: [KNEEL, 'high'], kneelFront: [KNEEL, 'front'], kneelSlung: [KNEEL, 'slung'],
  kneelCharge: [KNEEL, 'charge'], kneelRelease: [KNEEL, 'release'], kneelCheck: [KNEEL, 'check'], kneelMagout: [KNEEL, 'magout'], kneelMagin: [KNEEL, 'magin'],
  proneLow: [PRONE_BODY, 'proneRest'], proneSlung: [PRONE_BODY, 'slung'], proneCharge: [PRONE_BODY, 'charge'], proneRelease: [PRONE_BODY, 'release'],
  proneCheck: [PRONE_BODY, 'check'], proneMagout: [PRONE_BODY, 'magout'], proneMagin: [PRONE_BODY, 'magin'],
});

/** The P-12's frames' bodies and rigs: [body, the rig's mode, kick]; its stance a shooter's for the aim and the fire. */
const PISTOL_HELD = Object.freeze({
  pistolLow: [STAND_EASY, 'low', 0], pistolHigh: [STAND_EASY, 'high', 0], pistolAimed: [SHOOT, 'aim', 0], pistolFire: [SHOOT, 'aim', 1],
  pistolHolster: [STAND_EASY, 'holster', 0], pistolCheck: [SHOOT, 'check', 0], pistolMag: [SHOOT, 'magout', 0],
});
/** The seated frames' rigs: [mode, kick]. */
const SEATED_RIG = Object.freeze({ sitAim: ['aim', 0], sitFire: ['aim', 1], sitLow: ['low', 0], sitCharge: ['charge', 0], sitMagout: ['magout', 0] });

/** A gun's rig through the gait frames, by carry: the hands' mode (compose.js RIGS). */
const CARRY_RIG = { low: 'low', high: 'high', slung: 'slung', front: 'front' };

/**
 * The pose of a frame for a look's weapon and carry (see the header). Plain data, a new object each call.
 * weapon: 'rifle' | 'pistol' | null; carry: 'low' | 'high' | 'slung' | null; tired: BODY's fatigue cue
 * (the head down a pixel, the arms' swing halved, a touch more lean).
 */
export function poseOf(frame, { weapon = null, carry = null, tired = false, cycle = null } = {}) {
  const p = basePose(frame, { weapon, carry, cycle });
  if (!tired || p.stance !== 'stand' || p.rig?.mode === 'aim') return p;
  const half = (a) => (a ? [a[0] * 0.5, a[1], a[2]] : a);
  return { ...p, lean: p.lean + 0.05, headDrop: (p.headDrop ?? 0) + 1, arms: p.arms === HANG ? p.arms : { r: half(p.arms.r), l: half(p.arms.l) } };
}
/** v0.0.12's walk, stroll and run frames (four a cycle) for the walk sample's W0 reference: { legs, arms, lean, lift, rig }. */
export function legacyPose(gait, k, { weapon = null, carry = null } = {}) {
  const gaitRig = weapon ? { mode: CARRY_RIG[carry] ?? 'low' } : null;
  const two = gait === 'run' ? [RUN0, RUN1] : gait === 'stroll' ? [STROLL0, STROLL1] : [WALK0, WALK1];
  let p = { ...(k % 2 ? two[1] : two[0]), rig: gaitRig };
  if (k % 4 >= 2) p = flip(p);
  return { stance: 'stand', lean: 0, bob: 0, lift: 0, roll: 0, arms: HANG, ...p };
}
/** The carry a stance sheet's frames hold (its look's: 'aim', 'high' or 'low'). */
const stanceCarry = (carry) => (carry === 'aim' || carry === 'high' ? carry : 'low');
function basePose(frame, { weapon = null, carry = null, cycle = null } = {}) {
  const gaitRig = weapon ? { mode: CARRY_RIG[carry] ?? 'low' } : null;
  const m = /^([a-zA-Z]+?)(\d)$/.exec(frame), name = m ? m[1] : frame, k = m ? Number(m[2]) : 0;
  const cy = cycleOfLook({ cycle });
  const beat = beatPose(frame, { weapon: weapon ?? 'rifle', carry: stanceCarry(carry), cycle: cy });
  if (beat) return { stance: 'stand', lean: 0, bob: 0, lift: 0, roll: 0, arms: HANG, ...beat };
  // (the held band, over the stack's legs, the rifle slung in front, the hands put where the device is held)
  // (the shock band's frames, written outright as the sample composes them)
  const sh = shockPose(frame);
  if (sh) return sh;
  const H = HELD_POSES[frame];
  if (H) { const st = beatPose('stack', { weapon: 'rifle', carry: 'low', cycle: cy }); return { stance: 'stand', lean: 0, bob: 0, lift: 0, roll: 0, arms: HANG, ...st, lean: H.lean ?? st.lean, rig: { mode: 'front', gun: 'rifle' }, reach: { r: H.reach.r ?? null, l: H.reach.l ?? null } }; }
  let p;
  switch (name) {
    case 'idle': p = { legs: STAND, arms: HANG, bob: k === 1 ? 1 : 0, rig: gaitRig }; break;
    // (R8: the candidate's cycles by name, walk.js; the stance sheet's in its carry (an aimed walk is shouldered: the turret))
    case 'walk': p = cyclePose(cy, 'walk', k, { weapon, carry: weapon ? CARRY_RIG[carry] ?? 'low' : null }); break;
    case 'run': p = cyclePose(cy, 'run', k, { weapon, carry: weapon ? CARRY_RIG[carry] ?? 'low' : null }); break;
    case 'glide': p = cyclePose(cy, 'combat', k, { weapon: weapon ?? 'rifle', carry: stanceCarry(carry) }); break;
    case 'assault': p = cyclePose(cy, 'assault', k, { weapon: weapon ?? 'rifle', carry: stanceCarry(carry) }); break;
    case 'flight': p = cyclePose(cy, 'combat', k * bandSpec(cy, 'combat').fps, { weapon: weapon ?? 'rifle', carry: stanceCarry(carry), flight: true }); break;
    // (the P-12 on the move, at the low ready or aimed, the combat glide's legs at PISTOL_WALK_N keys of its whole cycle
    // (pistolWalkKey: both steps), the R-7 hanging on its sling and swinging with the stride (stride: compose.js's front rig,
    // HANG_SWING_K); aimed, the turret's lean and the pistol's aimed rig, as pistolAimed stands)
    // (pistolHighWalk the high ready's, the muzzle up at the chest as pistolHigh stands, over the same legs)
    case 'pistolWalk': case 'pistolAimWalk': case 'pistolHighWalk': {
      const aim = name === 'pistolAimWalk', mode = aim ? 'aim' : name === 'pistolHighWalk' ? 'high' : 'low', kk = pistolWalkKey(k, bandSpec(cy, 'combat').n);
      p = { ...cyclePose(cy, 'combat', kk, { weapon: 'rifle', carry: mode }), rig: { mode, gun: 'pistol', turn: 0, kick: 0, hold: true, hang: 'front', p12: true }, stride: true };
      break;
    }
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
    case 'aid': p = { ...AID }; break;
    case 'handsUp': case 'handsKneel': p = handsPose(HANDS_POSE, name === 'handsKneel'); break;
    case 'hurt': p = { ...HURT }; break;
    case 'bound': p = { ...BOUND[k], rig: gaitRig }; break;
    case 'float': p = { ...(k ? FLOAT1 : FLOAT0), rig: gaitRig && gaitRig.mode === 'slung' ? gaitRig : weapon ? { mode: 'low' } : null }; break;
    case 'tumble': p = { ...FLOAT0, roll: k * Math.PI / 4, rig: gaitRig && gaitRig.mode === 'slung' ? gaitRig : weapon ? { mode: 'low' } : null }; break;
    default: p = null;
  }
  if (!p && SEATED_RIG[frame]) {
    const [mode, kick] = SEATED_RIG[frame];
    p = { ...SEATED, rig: { mode, gun: weapon ?? 'rifle', turn: 0, kick, kneel: true, hold: true } };
  }
  if (!p && PISTOL_HELD[frame]) {
    // (the P-12 in the hands, standing as the rifle's handling stands, the R-7 hanging on its sling (the rig's hang))
    const [body, mode, kick] = PISTOL_HELD[frame];
    p = { ...body, ...(mode === 'check' ? { headDrop: 1 } : {}), rig: { mode, gun: 'pistol', turn: 0, kick, hold: true, hang: 'front', p12: true } };
  }
  if (!p && HELD_RIFLE[frame]) {
    const [body, mode] = HELD_RIFLE[frame];
    const prone = body === PRONE_BODY, hold = !['front', 'slung'].includes(mode);
    p = { ...body, ...(mode === 'check' ? { headDrop: 1 } : {}), rig: { mode, gun: 'rifle', ...(prone ? { prone: true } : {}), ...(body === KNEEL ? { kneel: true } : {}), hold } };
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
export function gaitFrame(gait, { stride = 0, tS = 0, phase = 0, gp = null, stepM = 0, cycle = null } = {}) {
  // (R8: the walk and the run by the gait phase (walkFrame); with none given, by the metres walked in the band's own steps)
  if (gait === 'walk' || gait === 'stroll' || gait === 'run') return walkFrame(gait === 'run' ? 'run' : 'walk', { gp: Number.isFinite(gp) ? gp : null, stride, stepM, cycle }).frame;
  if (gait === 'stairsUp' || gait === 'stairsDown') return `${gait}${mod(Math.floor(stride / STEP_M.stairs), 4)}`;
  if (gait === 'bound') return `bound${mod(Math.floor(stride / STEP_M.bound), 4)}`;
  if (gait === 'float') return `float${mod(Math.floor(tS * 1 + phase), 2)}`;                 // (1 fps: VIEWS.md 3.4)
  if (FRAMES.includes(gait)) return gait;
  return `idle${mod(Math.floor(tS * 2 + phase), 2)}`;
}

/** The frame names a drawn band's cycle uses (R8): the base sheet's walk and run, the stance sheet's glide and Assault. */
const CYCLE_NAME = Object.freeze({ walk: 'walk', run: 'run', combat: 'glide', assault: 'assault' });
/**
 * The frame of a walk-type or run band for a gait phase (VIEWS §3.10.2): band 'walk' (Relaxed: the base sheet), 'run', 'combat'
 * or 'assault' (the stance sheet); gp the phase (steps; else stride / stepM), stepM the sim's step (src/sim/body/loco.js
 * stepMOf), back walking backwards, cycle the candidate. Returns walk.js cycleAt's { step, j, flight, u, lagPx } with frame (the
 * name: a walk-type band's flight is the run's flight frame on the base sheet, `flight<step>` on the stance sheet).
 */
export function walkFrame(band, { gp = null, stride = 0, stepM = 0, back = false, cycle = null } = {}) {
  const cy = cycleOfLook({ cycle }), sp = bandSpec(cy, band);
  const sm = stepM > 0 ? stepM : sp.S / 16;
  const g = Number.isFinite(gp) ? gp : (stride / sm) % 2;
  const at = cycleAt({ cycle: cy, band, gp: g, stepM: sm, back });
  const name = CYCLE_NAME[band] ?? 'walk';
  let frame;
  if (at.flight) frame = band === 'run' || band === 'walk' ? `run${at.step * RUN_FPS + RUN_FPS - 1}` : `flight${at.step}`;
  else frame = `${name}${at.frame}`;
  return { ...at, frame };
}

/** The tumble frame nearest a roll angle (radians): float0 or tumble1..7, 45° apart (VIEWS.md 3.4). */
export function tumbleFrame(rollRad) {
  const k = mod(Math.round(rollRad / (Math.PI / 4)), 8);
  return k ? `tumble${k}` : 'float0';
}

/**
 * v0.0.25 (the build sheet items 7 and 8, §3.4; PC§3.2): the standing card of a body or a board on a face, as the stage draws it:
 * { cardFacing, quarter, flip } for a face (src/data/faces.js ON_FACES; absent the deck) and a facing (the sim's four words: the plan
 * heading of a body on the deck or the deckhead, 'down' a board's front to the camera). The card is the facing's own, drawn as
 * samples/wreck-faces draws every candidate (src/data/faces.js STAGE_TURNS): on the deck and the ventral bulkhead upright; on the
 * deckhead and the dorsal bulkhead flipped top to bottom about the feet, head down, the facing kept (a man walking east on the
 * deckhead drawn nose east); on starboard and port a quarter turn (counter-clockwise, clockwise), the feet to the face. One instance
 * matrix, no new cell (render/figures.js). FACE_CARDS holds all 24 rows, frozen (wreck-look pins them whole).
 */
export const FACE_CARDS = Object.freeze(Object.fromEntries(['deck', 'deckhead', 'port', 'starboard', 'dorsal', 'ventral'].map(face => [face, Object.freeze(Object.fromEntries(['up', 'down', 'left', 'right'].map(facing => {
  const t = stageTurnOf(face);
  return [facing, Object.freeze({ cardFacing: facing, quarter: t.quarter, flip: t.flip })];
})))])));
/** A face's row of FACE_CARDS (see above): unknown faces and facings read as the deck's and 'down'. */
export const faceCard = (face, facing) => (FACE_CARDS[face] ?? FACE_CARDS.deck)[facing] ?? (FACE_CARDS[face] ?? FACE_CARDS.deck).down;

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

// ---------- the rifle in hand: the arms role's gunLook as a frame (0.0.5) ----------

/** The held frame for a carry and a stance (gunLook's carry: 'front' | 'slung' | 'low' | 'high'; stance 'stand' | 'kneel' | 'prone'). */
const CARRY_FRAME = Object.freeze({
  stand: { front: 'slungFront', slung: 'slungBack', low: 'lowReady', high: 'highReady' },
  kneel: { front: 'kneelFront', slung: 'kneelSlung', low: 'kneelLow', high: 'kneelHigh' },
  prone: { front: 'proneSlung', slung: 'proneSlung', low: 'proneLow', high: 'proneLow' },
  sit: { front: 'sitLow', slung: 'sitLow', low: 'sitLow', high: 'sitLow' },
});
/** An action's frame (gunLook.action.frame: look.js ACTION_FRAMES) for a stance; 'aim' and 'fire' are the arms band's. */
const ACTION_FRAME = Object.freeze({
  stand: { raise: 'raise', sling: 'raise', charge: 'charge', release: 'release', check: 'pressCheck', magout: 'magout', magin: 'magin' },
  kneel: { raise: 'kneelLow', sling: 'kneelLow', charge: 'kneelCharge', release: 'kneelRelease', check: 'kneelCheck', magout: 'kneelMagout', magin: 'kneelMagin' },
  prone: { raise: 'proneLow', sling: 'proneLow', charge: 'proneCharge', release: 'proneRelease', check: 'proneCheck', magout: 'proneMagout', magin: 'proneMagin' },
  sit: { raise: 'sitLow', sling: 'sitLow', charge: 'sitCharge', release: 'sitCharge', check: 'sitCharge', magout: 'sitMagout', magin: 'sitMagout' },
});
const AIM_OF = { stand: 'aim', kneel: 'kneel', prone: 'prone', sit: 'sitAim' }, FIRE_OF = { stand: 'fire', kneel: 'kneelfire', prone: 'pronefire', sit: 'sitFire' };

/**
 * The frame a rifle in hand is drawn in (the arms role's gunLook: { carry: 'front' | 'slung' | 'low' |
 * 'high' | 'aim', stance, aim: { x, z, ms } | null, action: { frame, k } | null, kick, flash }), for a
 * body at (x, z) facing `face`, at game time ms: { frame, flash }. A kick shows the stance's fire frame,
 * an action its frame (a list walked by k), an aim the stance's aim (standing, turned up or down the
 * picture by turnOf, held lower its first RAISE_MS), else the carry's held frame. Pure.
 */
export function rifleFrame(gl, { face = 'right', x = 0, z = 0, ms = 0 } = {}) {
  if (!gl) return { frame: null, flash: false };
  const stance = CARRY_FRAME[gl.stance] ? gl.stance : 'stand', flash = !!gl.flash;
  // (the P-12 out, standing: its own stances (see the header); kneeling or prone, the stance's own frames as before)
  // (a role-player dazed or cowering, whatever his carry (see the header))
  const shock = shockFrameOf(gl);
  if (shock) return { frame: shock, flash };
  if (gl.pistol && stance === 'stand') return { frame: pistolFrameOf(gl.pistol, gl.action, gl.kick), flash };
  const aimed = (kick) => {
    if (stance !== 'stand') return kick ? FIRE_OF[stance] : AIM_OF[stance];
    const a = gl.aim, dx = a ? a.x - x : 0, dz = a ? a.z - z : 0;
    const to = Math.hypot(dx, dz) > 0.05 ? Math.atan2(dz, dx) : HEAD[face] ?? 0;
    let turn = turnOf(face, to);
    const up = a ? ms - a.ms : Infinity;
    if (!kick && (face === 'left' || face === 'right') && up >= 0 && up < RAISE_MS && turn >= 0) turn--;
    return `${kick ? 'fire' : 'aim'}${turn > 0 ? 'hi' : turn < 0 ? 'lo' : ''}`;
  };
  if (gl.kick) return { frame: aimed(true), flash };
  const act = gl.action?.frame;
  if (act) {
    const list = Array.isArray(act) ? act : [act];
    const f = list[Math.min(list.length - 1, Math.max(0, Math.floor((gl.action.k ?? 0) * list.length)))];
    if (f === 'aim' || f === 'fire') return { frame: aimed(false), flash };
    const fr = ACTION_FRAME[stance][f];
    if (fr) return { frame: fr, flash };
  }
  if (gl.carry === 'aim') return { frame: aimed(false), flash };
  return { frame: CARRY_FRAME[stance][gl.carry] ?? CARRY_FRAME[stance].low, flash };
}
/**
 * The carry a look's gait frames are painted with, for a gunLook's carry. An aim walks at the high ready until the aimed bands
 * exist (VIEWS §3.10.1, the rework's R2): never the low ready, a muzzle drawn down that the sim holds level (v0.0.12 drew 333
 * aimed ticks of a lane at the low ready: half of the user's "goes low ready … but we still get flagged"). GAIT_CARRIES are
 * every carry a walk is drawn in, the stance pool's carries the view paints before GO.
 */
export const gaitCarryOf = (carry) => (carry === 'aim' ? 'high' : !carry ? 'low' : carry);
export const GAIT_CARRIES = Object.freeze(['front', 'slung', 'low', 'high']);
/** The bands whose frames a look's gait carry never changes (the rifle's handling, the aim, sitting, lying: their rigs are their own), so a figure's are drawn the same from the sheet of its look with any carry (tests/house-bodies paints them to hold it). */
export const CARRY_FREE_BANDS = Object.freeze(['arms', 'lie', 'seated', ...RIFLE_BANDS]);
