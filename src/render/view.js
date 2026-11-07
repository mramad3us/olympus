// OLYMPUS render: the game view. The live area on the stage, its people, the camera that follows you; a frame in order.
//
// TECH §9.11 (tradecraft's src/render/view.js order, rewritten around OLYMPUS's sim: research
// tradecraft-art-render.md §9). The view reads the state and never writes it.
//
// The areas. An area is a floor (a building's storey: rooms, openings, fixtures, its look) or a ground
// (a base's outdoors: the massing, the surfaces, the fence). setArea(area) makes one live; prepare(area)
// builds it into the cache without showing it (AREA_CACHE 3: the ground and both of Echo's floors), so
// going through a door or up a stair costs nothing once main.js has prepared the areas round you.
//   - A floor is the paint worker's 'area' job (src/art/jobs.js: the cutaway of planOf(), the rooms'
//     floors, the fixtures by the kit, each door's leaf a moving piece, each wall clock's dials),
//     made into meshes by batch.js areaFromJob() and sent up whole behind main.js's cut (TECH §9.3, at
//     most CUT_MAX_MS). Its cost, held to AREA_BUILD_MS 250 ms, is the job's own time from its dispatch
//     and the main thread's meshes and upload (waitMs, the wait for a worker still starting, apart).
//   - A ground is its chunks (src/render/chunks.js): behind the cut the ring round where you arrive is
//     built whole; then they stream round the camera within REACH_M, never first drawn in the picture.
// Between two floors of one building with both built (a stair), there is no cut: the floor you leave
// dissolves outward from the stair as the next dissolves in, a radial Bayer wipe over STAIR_DISSOLVE_S
// 0.4 s, the stair and you at the same pixels throughout (VIEWS §2.9: the stops of a stair share x, z).
//
// A frame (frame(alpha, state, info)), in §9.11's order, what of it exists. While an area's cut is
// held (info.cut), or the sim stands in another area than the one shown (the frame after a portal's
// fact, before setArea has the new one up), nothing is drawn and the last picture holds: only the
// upload queue drains, so the figures the cut waits for come up (stats.held counts those frames). The
// first frame after shows the new area with its people, its camera snapped and its fog exact (9);
//   2b. the eye (0.0.5): the player's adapted eye, BODY's eyes through people's eyeViewOf (the same
//      number perception's reach reads), on the post pass as its gains against v0.0.4's exposure (the
//      rods' and the cones'), the rods' share of vision and the glare (src/render/post.js setEye), eased
//      over EYE_EASE_S 0.15 s of real time so a tick's step or the lids opening never jumps a frame
//      (snapped on a new state); 1 and 0 under a held mood (the samples', a debug look), while the eyes
//      are shut and with a night-vision device on (the device's picture). A splash holds the eye as it
//      was when the splash began, through its lapse, beat and strip, and eases to the live eye over its
//      zoom out (the review of v0.0.5's eyes: the night's lapse pulsed 0.88, 1.13, 1.0 within a second
//      of real time as the eyes adapted in the berth before the lids closed). view.stats.eye: { gain,
//      coneGain, rod, glare, a, held, shown };
//   2. the light (src/render/lighting.js): outdoors the Mars sky's row at the sun's elevation from places'
//      skyAt (the key light off in the canyon's shade, `eclipsed`, and coming in with the disc's share
//      over the wall, `visible`), indoors each room's fill through the
//      room map and the night lights' glow at lights out, and everywhere lampsOf's static pools in the
//      tiled lamp table (the fire watch's red lamp, the night lights, the street lamps, the floods);
//      setMood(name) holds one of moods.js's presets instead (the samples', a debug look);
//   3. where everyone is between the last two ticks: from actor.$px, $pz to x, z by alpha, never glided
//      across a jump of more than JUMP_M 1.5 m (tradecraft; the user, 2026-11-04: "NPCs streak accross the
//      screen when they spawn"), the stride the same way; how each is drawn from people's figureOf
//      (src/sim/people/figure.js: the look in its outfit, standing by its gait, sitting lifted to its
//      seat, lying in its berth by its head, a curtain drawn): a sleeper is the berth's quad, not a card
//      (figures.js, bedding.js: the look round's L5). While time stands still (info.held) everyone is
//      drawn where the sim has them, so stop motion stands still on screen. The memory (memory.js,
//      VIEWS §2.11: "people out of sight are drawn frozen where last seen"): someone the player can see
//      neither where they are nor where they were last drawn (perception's visibility, the fog's own
//      function, 0 at both) is drawn as last seen, so a pose people change out of sight (the sim
//      changes one only there: src/sim/people/place.js) never shows in the fog's dimmed cells either;
//   4. the camera (VIEWS §2.4): on you, leaning where you go, LEAD_WALK_M [1.0, 2.5] walking or strolling
//      and LEAD_RUN_M [1.5, 3.5] running, eased over LEAD_S 0.35 s; per axis an area that fits the frame
//      with FIT_SPARE_M to spare holds the camera on its middle, a larger one is followed, clamped so the
//      frame stays within its bounds plus CLAMP_PAD_M. The lead is snapped to the pixel grid before it is
//      added, so a settled lead holds the figure on one screen pixel;
//   5. builds within budget: the ground's chunks ahead (chunks.js), the paint jobs' main-thread share;
//   6. the moving pieces: every door's leaf at places' leafAt (props.js); the clocks' hands at places'
//      wallClockAt (clocks.js), agreeing with the watch;
//   8. sprite tints: exposure(places' lightLevel) in the colour of the light there (lighting.js tintAt);
//   9. the fog of awareness: people's sightMask (src/sim/people/perception.js, the one function perception
//      uses) over FOG_CELLS of 0.25 m round the camera (the sight grid's lattice), recomputed when the eyes move FOG_MOVE_M or turn
//      FOG_TURN_DEG, a door's leaf moves, the area changes, and once a game second; eased and dithered by
//      fog.js and the post pass (VIEWS §2.11), its eased values moving with their cells when the window
//      does, and snapped (no easing) on a new area, so the old area's shape never shows on the new one.
//      view.fog is the last recompute's wanted values;
//  10. see-through (VIEWS §2.10): a mass, a wall or a fixture standing between the camera and you
//      dissolves round you over SEE_DISSOLVE_S 0.25 s both ways (materials.js: the checkerboard, a roof
//      taken away, your silhouette inked through it by the post pass); behind a mass taller than
//      TALL_MASS_M 3.2 m for longer than that, the ground's geometry above 1 m is cut over a disc of
//      SEE_WIDE_M 3.5 m round you (materials.js uSeeWide), so you see where you walk, not only yourself;
//      a roof over you (an open shed you stand under) is lifted the same way;
//  11. the people: one instanced draw (src/render/figures.js), yours never deferred; the berths;
//  12. the upload queue drained (src/render/uploads.js: 1 MB and 2 ms a frame, yours first);
//  13. stage.render(); 15. stats.
// 0.0.4 (the build sheet §2.3), the splash and the people's transitions:
//   - info.splash (the hud's splash frame, src/ui/hud/splash.js; null outside one): the light is the time
//     shown (shownMs: "light is a pure function of time, so a night's sleep shows the squad bay go dark,
//     the exit signs, dawn at the windows, reveille's overheads", VIEWS §5.1); the fog inside the iris
//     is lifted while it is closed (the vignette is shown as seen, even to a sleeper: my call), back to
//     the eyes' own as it opens; the vignette's pieces stand at the fixture (src/render/vignettes.js);
//     the zoom, the iris, the ring and the beat are src/render/splash.js's pass over the picture;
//   - every figure is people's figureOf(state, actor, ms) at ms = clock.ms + alpha × TICK_MS, so a rise
//     from a berth plays between ticks frame by frame: lying is the berth's drawing (the player's own
//     too, now that the player lies down), breathing at BREATH_HZ, its curtain closing over CURTAIN_MS
//     after the sleeper lies; sitUp and lieDown the berth thrown back with the upper body's card on the
//     mattress at its head, moving to the rack's edge over the last SIT_SLIDE_K of sitting up (smoothly:
//     figureOf's upK and edge), so the sit frame follows on where it ends (the review of v0.0.5's rack:
//     a 1.04 m hop in one frame at every rise and lie-down); sit on the rack's edge; climb down an
//     upper berth's side at its height;
//     standUp; dressing two frames in turn; an activity's part its own frame (the toothbrush, the razor,
//     the basin, undressing and dressing); a transition's frames at its own places, never glided
//     (fig.k under 1: figureOf's x and z), everything else between the ticks as before;
//   - the body's cues on the figure (VIEWS §7.3): the wet head after a wash, the tired walk; a look the
//     cues change is painted by the worker while the old one is still drawn, so your own figure never
//     waits on the main thread for wet hair;
//   - inside: in a shower stall you are drawn in it facing its head with the steam before you, through
//     the dress part too, stepping out to the stall's spot over its last 15% (the review of v0.0.4: in
//     the dress part you had stood at the spot, behind the stall, a ghost through its dither); in any
//     other fixture (a toilet stall) you are hidden behind it, the vignette's boots under the partition.
//     While the iris closes on a shower stall, the stall and the floor to its spot are cut down to
//     CUT_H_M as the interior cutaway cuts walls (the lift's uniforms, by the iris's inkK, so it
//     dissolves in and out with it) and the see-through's dither is let go: you, the steam cover and the
//     wet head read whole, never a checkered shape (the integrator's shots m3-03, m3-04);
//   - the alert's beacon in hall-2 (people's alertNow): lit, a red pool, while the horn sounds; the bay
//     stays dark.
// 0.0.5 (the build sheet 0.0.5 §2.3), the rifle and the range:
//   - a figure with a rifle (the arms role's gunLook, src/sim/arms/look.js: the stage reads the arms only
//     there) is drawn in its rifle's frame when it is not walking (poses.js rifleFrame: the carry and the
//     stance held, an action's frame, the aim turned to the bracketed target, the kick and the flash on
//     game time, so stop motion freezes them), its look carrying the rifle (its gait's carry the one it last
//     walked with: a squad walking with slung rifles shares a sheet, and a change of posture in stop motion
//     changes no sheet), the magazine out of the well when gunLook says so, and kitLook's ear defenders and
//     plate carrier; the range staff in their dress (outfits.js rangeStaff), the range officer's headset by
//     his post; a person posted on a height (the RO on the tower's deck at 6.0 m) drawn there, the blob on
//     the deck. A muzzle's flash lights whoever stands within FLASH_LIT_M of it (VIEWS §3.6);
//   - the camera's weapon lead (camera.js aimLead) toward rangeLook's pick, and your own shot's shake;
//   - the range in play (src/render/range.js: the holes in the cards, the red flag, the brass, your shot's
//     flash star and blast dust) and things lying (src/render/decals.js: a dropped magazine), from rangeLook
//     at the moment drawn. The arms' effects (the rifle's frames, the flash, the kick, the shake, the range)
//     are drawn at the positions' own time, between the last two ticks (fxMs = ms − TICK_MS + alpha ×
//     TICK_MS), so a shot stamped at its tick's start shows its whole flash (the runtime review of v0.0.5);
//   - worldAt(xPx, yPx): the ground under a pixel of the picture, for the hud's mouse.
// 0.0.7 (the build sheet 0.0.7 §2.4, §8 items 20 and 25):
//   - THE FAR WINDOW (src/render/far.js; VIEWS §2.4, TECH §9.9): setFar(point | null) each frame from main.js
//     (the ballistics role's farPointOf placed by the hud's placeFar: the point, its range, the disc's centre
//     and radius in the window's CSS pixels, the optic's lever, the hold); the view turns the disc into the
//     picture's pixels, centres a KD face's window on the face as drawn (its centre as it stands up, FACE_K
//     times life size: the reticle's mils at the face's scale), fills the window's own fog (far.js
//     farFogCells: perception's visibility near, the open air's light beyond, the optic's lift) once a game
//     second or when the point moves or the scale changes, and steps its chunks, its dissolve and the lever's
//     scale. 0.0.8: the scale is the lever's, 16 px/m at 4× and 4 at 1×, eased over OPTIC_S
//     (sim/arms/look.js, handed to far.js); the fog's box at the window's scale (far.fogMag), its lift mixed
//     by the scale while the lever eases (far.lens, in 1/32 steps, so the night's fog moves with the
//     picture); the range layer culled to the window's ground at its scale (far.radiusM). The window itself
//     is drawn inside the stage's composite. farState() says whether it is open, how far dissolved, whether
//     its ground is built, and where it sits in the picture. The KD's target line is asked for ahead the
//     first time the range's KD look is seen (prebuild: TECH §9.9's "the range area pre-builds its target
//     line at entry");
//   - the KD in play (src/render/range.js): its faces on their carriers, the disks, the flags, the relay's fire,
//     brass and berm dust, culled to the frame and the far window;
//   - the stances the range sets (people's figure.js): a casualty lying where they fell ('hurt', a card, not a
//     berth), the corpsman kneeling at work ('aid', unarmed), sitting with the R-7 (poses.js's seated frames, by
//     the rifle's frame); someone below the ground (the pits' detail on its floor) drawn at their height, so the
//     ground hides them as the parapet hides them from the line;
//   - BLOOD (src/render/decals.js createBlood, src/render/blood.js): the body role's bloodLook (src/sim/body/blood.js)
//     on the ground and the wounds' marks on the figures, at the moment drawn.
// 0.0.8 (the build sheet 0.0.8 §2.4): the pairs pad in play: rangeLook's pairs (the turners as they stand, their faces, holes
// and the armoured face's plate) drawn by the range layer (src/render/range.js: each face as wide as it has turned, at the
// moment drawn, so a turn plays over its real 0.3 s and never jumps; the steel's spark in the blast's draw); the stands and
// the painted lines are the ground's kit pieces.
// idle and pending say what still waits (an area's build, the chunks in the picture, uploads, a sheet,
// the worker, the warm-up), so main.js sets window.__ready only once nothing does. stats: the last
// frame's draw calls, triangles, programs, CPU ms, uploads, people drawn and put off (people: { drawn,
// lying, remembered: drawn as last seen }), the clocks' faces as drawn, the lamps (table: pools in the table, slots: dynamic ones in use),
// the chunks ({ built, building, popped, mainMs }), the area ({ id, buildMs, cutMs }), the see-through
// and the fog, the camera and where your figure was drawn, the GPU by pass where there is a timer.
import * as FIGURE from '../sim/people/figure.js';
import * as PERCEPTION from '../sim/people/perception.js';
import * as ALERTS from '../sim/time/alerts.js';
import { TICK_MS } from '../core/clock.js';
import { createSplash, CURTAIN_MS } from './splash.js';
import { createVignettes } from './vignettes.js';
import { vignetteItems, insideSpot, BEACON_Y_M } from './vignette-items.js';
import { BAND_OF } from '../art/figures/poses.js';
import { BREATH_HZ } from '../art/figures/bedding.js';
import { createFigures } from './figures.js';
import { areaFromJob, reserveParts } from './batch.js';
import { createFogMask, FOG_CELL_M } from './fog.js';
import { MOODS } from './moods.js';
import { LEAD_S } from './camera.js';
import { PX_PER_M } from './scale.js';
import { warmUp } from './warm.js';
import { WALL_H_M, OUTER_T_M, CUT_H_M, wallsOf, wallRect } from './walls.js';
import { createLighting } from './lighting.js';
import { createClocks } from './clocks.js';
import { createMemory } from './memory.js';
import { createChunks } from './chunks.js';
import { swingProps } from './props.js';
import { SHARED } from './materials.js';
import { PALETTES } from '../art/palette.js';
import { runJob } from '../art/jobs.js';
import { FOOTPRINTS } from '../art/kit/index.js';
import { BERTH_M } from '../art/figures/bedding.js';
import { RACK_DECKS, BERTH_TOP_M, rackBlanket } from '../art/kit/quarters.js';
import { hash01 } from '../core/hash.js';
import { playerActor } from '../core/ids.js';
import { STRIDE_WRAP_M } from '../data/body/gait.js';
import { planOf } from '../sim/places/plan.js';
import * as ARMS from '../sim/arms/look.js';
import { rifleFrame, gaitCarryOf, RIFLE_BANDS } from '../art/figures/poses.js';
import { FLASH_LIT_M, FLASH_LIGHT } from './figures.js';
import { createRange } from './range.js';
import { createDecals } from './decals.js';
import { aimLead, fxMsOf, SHOT_SHAKE_PX, SHOT_SHAKE_MS, FAR_LEAD_M } from './lead.js';
import { KD_RANGE, RANGE_KINDS } from '../data/places/range.js';
import { createFar, farFogBox, farFogCells, pictOfCss, FAR_R_PX, FAR_LENS_STEPS } from './far.js';
import { createCamera } from './camera.js';
import { createPost } from './post.js';
import { reserveParts as reserveParts2 } from './batch.js';
import { ensurePart, olyMaterial, isOly } from './materials.js';
import { PARTS_PER_CHUNK } from './chunks.js';
import { createBlood } from './decals.js';
import { kdFaceAt } from './range-items.js';
import { FACE_K } from '../art/kit/range.js';
import { lightLevel } from '../sim/places/light.js';
import * as BLOOD from '../sim/body/blood.js';

/** The pieces' sizes the far window reads to find a long piece reaching into it (the range's kinds and the kit's). */
const FAR_SIZES = Object.freeze({ ...RANGE_KINDS, ...FOOTPRINTS });
/** How long the picture takes to follow the eye's gain and its rods' share, seconds of real time (an ease, not the eye's own time: that is the sim's). */
export const EYE_EASE_S = 0.15;
/** People are put where they are, not glided, across a jump longer than this in a tick (metres). */
export const JUMP_M = 1.5;
/** The share of sitting up (the last of it) over which the sitter on the mattress moves from the berth's head to its edge, where the sit frame follows on. */
export const SIT_SLIDE_K = 0.6;
/** The camera's lean where you go, east-west and north-south (metres): walking or strolling, and running (VIEWS §2.4). */
export const LEAD_WALK_M = Object.freeze([1.0, 2.5]), LEAD_RUN_M = Object.freeze([1.5, 3.5]);
/** An area that fits the frame with this much to spare on each side holds the camera still (metres). */
export const FIT_SPARE_M = 1;
/** A larger area is followed, the frame kept within its bounds plus this (metres). */
export const CLAMP_PAD_M = 2;
/** An area's paint, build and upload behind its cut: the budget (TECH §9.3), and the cut's longest hold (ms). */
export const AREA_BUILD_MS = 250, CUT_MAX_MS = 1000;
/** Areas kept built: the ground and both of Echo's floors. */
export const AREA_CACHE = 3;
/** The see-through's dissolve (VIEWS §2.10) and the stair's wipe (VIEWS §2.9), seconds. */
export const SEE_DISSOLVE_S = 0.25, STAIR_DISSOLVE_S = 0.4;
/** The fog's recompute: when the eyes move this far or turn this much (VIEWS §2.11). */
export const FOG_MOVE_M = 0.25, FOG_TURN_DEG = 3;
/** The fog's cells round the camera: 48 × 32 m at FOG_CELL_M 0.25 m (the widest frame, 48 × 26.9 m, and a lead). */
export const FOG_CELLS = Object.freeze([192, 128]);
/** The protected rectangle's margin round your figure (VIEWS §2.10: 6 px), pixels; your figure's height and width for it, metres. */
export const SEE_MARGIN_PX = 6, SEE_FIGURE_M = Object.freeze([0.8, 1.9]);
/** The wide see-through (materials.js uSeeWide): a mass taller than TALL_MASS_M hiding you for longer than SEE_DISSOLVE_S cuts the area's geometry over a disc of SEE_WIDE_M round you (metres). */
export const TALL_MASS_M = 3.2, SEE_WIDE_M = 3.5;
/** A roof over you is lifted above this (metres): an open shed's roof, not the walls you stand among. */
export const LIFT_FROM_M = 2.2;
/** The test fog's shape: near (m), cone half-angle (rad), reach (m); the samples' look/main.js. */
export const TEST_FOG = Object.freeze({ nearM: 2.5, cone: 0.8, reachM: 14 });
const FACE = { right: [1, 0], left: [-1, 0], down: [0, 1], up: [0, -1] };
const GAIT = { run: 'run', walk: 'walk', stroll: 'stroll', bound: 'bound', idle: 'idle' };
/** A dressing figure's two frames, each held this long (game ms: a shirt over the head, a leg into the trousers). */
export const DRESS_FRAME_MS = 900;
/** An activity's part, the frame it shows (the sink's: 0.0.6's hands washed as the face is, the clippers in the razor's frame; undressing and dressing); anything else is the gait's. */
const PART_FRAME = Object.freeze({ teeth: 'brush', shave: 'shave', face: 'basin', hands: 'basin', clip: 'shave', in: 'dress', dress: 'dress', 'turn-in': 'dress' });
/** The beacon's red pool (the stage's dynamic lamp slots: a lamp of kind 'beacon', VIEWS §2.7's hard-edged pool). */
export const BEACON_LAMP = Object.freeze({ y: 2.4, r: 2.2, color: 0xff4a3a, core: 0.55, ring: 0.22, kind: 'beacon' });
const HEAD_OF_FACE = { down: 'n', up: 's', right: 'w', left: 'e' };
const now = () => performance.now();

/**
 * Where the camera looks along one axis: { c, held }. focus and lead in metres; lo, hi the area's
 * bounds on screen; viewM the frame's span on that axis.
 */
export function cameraAxis(focus, lead, lo, hi, viewM) {
  if (hi - lo + 2 * FIT_SPARE_M <= viewM) return { c: (lo + hi) / 2, held: true };
  const a = lo - CLAMP_PAD_M + viewM / 2, b = hi + CLAMP_PAD_M - viewM / 2;
  return { c: Math.max(a, Math.min(b, focus + lead)), held: false };
}

/**
 * Whether a box { x0, x1, z0, z1, h } stands between the camera and a figure at (x, z) of half-width
 * hw and height H: some of it south of the figure's feet, across the figure's columns, and on its rows
 * of the picture (a point at height y and depth z shows where the ground at z − y does).
 */
export function occludes(b, x, z, hw, H) {
  if (b.x1 <= x - hw || b.x0 >= x + hw || b.z1 <= z + 0.02 || b.h <= 0.05) return false;
  const z0 = Math.max(b.z0, z + 0.02);
  return z0 - b.h < z && b.z1 > z - H;
}

/** What may stand between the camera and you in an area: [{ x0, x1, z0, z1, h }] (the walls, the fixtures, the massing, the fence). */
export function occludersOf(area) {
  const out = [];
  if (area.kind === 'ground') {
    for (const m of area.massing ?? []) for (const r of m.rects) out.push({ x0: r[0], z0: r[1], x1: r[2], z1: r[3], h: m.heightM ?? 3.4 });
    if (area.fence) { const [x0, z0, x1, z1] = area.fence.rect, h = area.fence.heightM ?? 3; out.push({ x0, x1, z0: z1 - 0.05, z1: z1 + 0.05, h }, { x0, x1, z0: z0 - 0.05, z1: z0 + 0.05, h }); }
  } else if (area.rooms?.length) {
    for (const w of wallsOf(planOf(area))) { const r = wallRect(w); out.push({ ...r, h: w.h }); }
  }
  for (const f of [...(area.fixtures ?? []), ...(area.pieces ?? [])]) {
    const fp = FOOTPRINTS[f.kind] ?? RANGE_KINDS[f.kind];
    if (!fp || (f.h ?? fp.h) < 0.5) continue;
    const W = f.w ?? fp.w, D = f.d ?? fp.d, side = f.face === 'left' || f.face === 'right', w = (side ? D : W) / 2, d = (side ? W : D) / 2;
    out.push({ x0: f.x - w, x1: f.x + w, z0: f.z - d, z1: f.z + d, h: (f.y ?? 0) + (f.h ?? fp.h) });
  }
  return out;
}

/**
 * The view: { setArea(area, at?) → Promise<info>, prepare(area, at?) → Promise<info>, frame(alpha, state,
 * info), warm(), prepareOwn(state), idle, pending, fog, stats, setMood(name | null), setFog(on), figures,
 * dispose() }. opts: stage, painter (src/render/painter.js; none: the jobs run
 * here, whole), uploads, ppm.
 */
export function createView({ stage, painter = null, uploads = null, ppm = PX_PER_M } = {}) {
  const THREE = stage.THREE;
  const figures = createFigures({ renderer: stage.renderer, ppm, painter, uploads });
  const lighting = createLighting(stage), clocks = createClocks();
  const chunks = createChunks({ THREE, renderer: stage.renderer, painter, uploads, ppm });
  const splash = createSplash(stage), vignettes = createVignettes(stage, { ppm });
  const rangeLayer = createRange(stage, { ppm }), decals = createDecals(stage, { ppm });
  const blood = createBlood(stage, { ppm });
  stage.scene.add(figures.group, clocks.group, vignettes.group, rangeLayer.group, decals.group, blood.group);
  // (the far window: its own camera, post, fog and chunks; drawn inside the stage's composite, before the blit)
  const far = createFar(stage, { createCamera, createPost, createFogMask, areaFromJob, reserveParts: reserveParts2, partsPerChunk: PARTS_PER_CHUNK, ensurePart, olyMaterial, isOly },
    { painter, uploads, ppm, chunksGroup: chunks.group, opticS: ARMS.OPTIC_S ?? 0.5 });
  far.attach();
  let farWant = null, farFogAt = null, kdPrebuilt = false;
  const cache = new Map();                                           // area id → { id, kind, area, built, info, bounds, palette, name, occluders, racks, fixtures }
  let live = null, chain = Promise.resolve(), building = 0, warmed = false, warming = null;
  let heldMood = null, palette = null, fogOn = true, testFog = false, fog = null, fogAt = null, fogWant = null;
  let lastState = null, wipe = null, seeK = 0, liftK = 0, liftRect = null, propsSig = '', tallS = 0, wideK = 0, vigCut = null;
  const lead = [0, 0];
  let lastT = null, snapNext = true, realS = 0, ownLook = null, eyeShown = null, eyeState = null, eyeHeld = null;
  const looks = new Map();                                           // person id → { look, key }
  const memory = createMemory();                                     // (each actor as last drawn in sight)
  const waitingSheets = new Set();
  const stats = {
    calls: 0, triangles: 0, programs: 0, cpuMs: 0, viewMs: 0, uploads: { n: 0, bytes: 0 }, people: { drawn: 0, lying: 0 }, deferred: 0, ppm, splash: null, vignette: null, beacon: null,
    res: [stage.W, stage.H], camera: { x: 0, z: 0 }, gpu: null, mood: null, area: null, build: null, frames: 0, you: null,
    clocks: [], lamps: { table: 0, slots: 0 }, chunks: { built: 0, building: 0, popped: 0, mainMs: 0 }, see: { k: 0, lift: 0 }, fog: { recomputes: 0, ms: 0, source: null },
    arms: null, range: null, far: null, blood: null,
  };
  // (for the tests, off the printed report: every figure as last drawn, with its tint; the fog's last wanted mask)
  let drawnNow = [];
  Object.defineProperty(stats, 'figures', { get: () => drawnNow, enumerable: false });
  Object.defineProperty(stats, 'fogMask', { get: () => fogWant, enumerable: false });

  // ---------- the areas ----------
  function boundsOf(area) {
    const b = area.boundsM ?? { x0: 0, z0: 0, x1: 0, z1: 0 };
    if (area.kind === 'ground') return { x0: b.x0, x1: b.x1, z0: b.z0 - 8, z1: b.z1 };      // (the tallest roofs stand up to 8 m over their line)
    return { x0: b.x0 - OUTER_T_M, x1: b.x1 + OUTER_T_M, z0: b.z0 - OUTER_T_M - WALL_H_M, z1: b.z1 + OUTER_T_M };
  }
  const racksOf = (area) => new Map((area.fixtures ?? []).filter(f => RACK_DECKS[f.kind]).map(f => [f.id, f]));
  // (the floors of one building frame the camera alike: a floor's bounds on screen joined with every floor a
  // stair links it to that the view has seen, so the stair, and you on it, keep their pixels from floor to
  // floor, VIEWS §2.9; Echo's first floor, its lobby block's 6 m shorter, framed as its ground floor is)
  const seenBounds = new Map();
  function cameraBounds(c) {
    if (c.kind !== 'floor') return c.bounds;
    const b = { ...c.bounds };
    for (const l of c.area.links ?? []) for (const st of l.stops ?? []) {
      const o = st.area !== c.id ? seenBounds.get(st.area) : null;
      if (o) { b.x0 = Math.min(b.x0, o.x0); b.x1 = Math.max(b.x1, o.x1); b.z0 = Math.min(b.z0, o.z0); b.z1 = Math.max(b.z1, o.z1); }
    }
    return b;
  }
  async function build(area, priority = 'area') {
    const t0 = now();
    const entry = { id: area.id, kind: area.kind === 'ground' ? 'ground' : 'floor', area, built: null, info: null, bounds: boundsOf(area), palette: area.look?.palette ?? null, name: area.name ?? area.id, occluders: occludersOf(area), racks: racksOf(area),
      fixtures: new Map((area.fixtures ?? []).map(f => [f.id, f])) };
    seenBounds.set(area.id, entry.bounds);
    if (entry.kind === 'ground') {
      entry.info = { buildMs: 0, jobMs: 0, mainMs: 0, waitMs: 0, wallMs: now() - t0, boxes: 0, drawCalls: 0, where: painter ? painter.mode : 'main', chunks: true };
      return entry;
    }
    const partBase = reserveParts(), args = { area, ppm, partBase };
    const result = painter ? await painter.run('area', args, { priority }) : runJob('area', args);
    const t1 = now();
    const built = areaFromJob(result, { name: area.id });
    built.upload(stage.renderer);                                    // (whole: behind the cut, TECH §9.7)
    built.atlas.release();
    const jobMs = result.jobMs ?? t1 - t0, mainMs = now() - t1;
    entry.built = built;
    entry.info = {
      buildMs: jobMs + mainMs, jobMs, mainMs, waitMs: result.waitMs ?? 0, wallMs: now() - t0, paintMs: result.meta.ms.paint, boxes: result.meta.stats.boxes, drawCalls: result.meta.stats.drawCalls,
      atlasKB: Math.round(result.meta.stats.atlasBytes / 1024), quads: result.meta.stats.quads, fixtures: result.meta.fixtures, parts: result.meta.parts, leaves: result.meta.leaves ?? 0, clocks: result.meta.clocks?.length ?? 0,
      where: painter ? painter.mode : 'main',
    };
    if (entry.info.buildMs > AREA_BUILD_MS) console.warn(`view: area '${area.id}' took ${entry.info.buildMs.toFixed(0)} ms to build (budget ${AREA_BUILD_MS} ms; ${entry.info.waitMs.toFixed(0)} ms more waiting for a worker)`);
    return entry;
  }
  function remember(entry) {
    cache.delete(entry.id); cache.set(entry.id, entry);              // (most recent last)
    for (const [id, old] of cache) if (cache.size > AREA_CACHE && old !== live && id !== entry.id) { old.built?.dispose(); cache.delete(id); }
  }
  // (behind a cut the area goes first, before the figures' bands: priority 'own'; prepared ahead, 'area')
  async function cached(area, priority = 'area') {
    let c = cache.get(area.id);
    if (!c) { building++; try { c = await build(area, priority); } finally { building--; } }
    remember(c);
    return c;
  }
  // (where you are in the last state the view was given, if that state's live area is this one)
  function arrival(area) {
    const s = lastState, a = s ? playerActor(s) : null;
    if (a && s.places?.live?.area === area.id) return { x: a.x, z: a.z };
    return area.spawn ? { x: area.spawn.x, z: area.spawn.z } : { x: (area.boundsM.x0 + area.boundsM.x1) / 2, z: (area.boundsM.z0 + area.boundsM.z1) / 2 };
  }
  function show(c, { dissolveFrom = null } = {}) {
    const was = live;
    live = c;
    lighting.setArea(c.area);
    if (c.kind === 'ground') { chunks.setGround(c.area); stage.setArea({ group: chunks.group, lamps: [], glowMap: null, glowBox: null }); }
    else stage.setArea(c.built);
    stage.lights.setLamps([]);                                       // (the static pools are the lamp table's; the ten slots wait for moving lights)
    clocks.setClocks(c.built?.clocks ?? [], ppm);
    if (c.palette && c.palette !== palette && PALETTES[c.palette]) { stage.setPalette(c.palette); palette = c.palette; }
    fogAt = null; propsSig = ''; seeK = 0; liftK = 0; tallS = 0; wideK = 0;
    if (dissolveFrom?.built && c.built) {
      // (the stair's wipe: the floor left on the stage too, going outward from the stair while this one comes in)
      stage.scene.add(dissolveFrom.built.group);
      wipe = { from: dissolveFrom, to: c, t: 0, x: dissolveFrom.at.x, z: dissolveFrom.at.z, R: Math.hypot(stage.W, stage.H) / ppm / 2 + 2 };
    } else { if (wipe) endWipe(); snapNext = true; }
    void was;
    stats.area = { id: c.id, buildMs: c.info.buildMs, cutMs: c.cutMs ?? null }; stats.build = c.info;
  }
  function endWipe() {
    if (!wipe) return;
    for (const m of wipe.from.built?.mats ?? []) m.userData.oly?.uniforms?.uWipe?.value.set(0, 0, 0, 0);
    for (const m of wipe.to.built?.mats ?? []) m.userData.oly?.uniforms?.uWipe?.value.set(0, 0, 0, 0);
    if (wipe.from !== live) wipe.from.built?.group.removeFromParent();
    wipe = null;
  }
  // (two floors of one building, the next built, one stair apart: the wipe, not the cut)
  const stairBetween = (a, b) => a && b && a.kind === 'floor' && b.kind === 'floor' && a.area.site === b.area.site && a.area.level !== b.area.level
    && (a.area.links ?? []).some(l => l.kind === 'stairs' && l.stops?.some(s => s.area === b.id));

  /** Make an area live: built (or from the cache) and on the stage; a ground's chunks round `at` (you, else its spawn) built first. Resolves with its build's numbers. */
  function setArea(area, at = null) {
    const run = async () => {
      const t0 = now();
      if (live?.id === area.id) return live.info;
      const prev = live, c = await cached(area, 'own');
      if (c.kind === 'ground') { chunks.setGround(area); const p = at ?? arrival(area); await chunks.ensure(p.x, p.z); }
      c.cutMs = now() - t0;
      const me = lastState ? playerActor(lastState) : null;
      show(c, { dissolveFrom: stairBetween(prev, c) && me ? { ...prev, at: { x: me.x, z: me.z } } : null });
      return c.info;
    };
    chain = chain.then(run, run);
    return chain;
  }
  /** Build an area into the cache without showing it (a ground: the chunks round where its portals from the live area arrive). */
  function prepare(area, at = null) {
    const run = async () => {
      const c = await cached(area);
      if (c.kind === 'ground') {
        if (chunks.ground !== area) { if (live?.kind === 'ground') return c.info; chunks.setGround(area); }
        const to = at ? [at] : (live?.area.portals ?? []).filter(p => p.to?.area === area.id).map(p => p.to);
        for (const p of to) await chunks.ensure(p.x, p.z);
      }
      return c.info;
    };
    chain = chain.then(run, run);
    return chain;
  }

  // ---------- the people ----------
  const keys = new WeakMap();
  const keyOf = (look) => { if (!look) return 'look:{}'; let k = keys.get(look); if (!k) keys.set(look, (k = `look:${JSON.stringify(look)}`)); return k; };
  function lookOf(look, who) {
    let e = looks.get(who);
    if (!e || e.look !== look) { e = { look, key: keyOf(look) }; looks.set(who, e); }
    return e;
  }
  // (your own look: a new one (a cue, an outfit) is shown once the worker has painted its gait, the last one
  // drawn meanwhile, so your figure never waits on the main thread; without a worker, at once)
  function ownLookOf(look) {
    if (!ownLook || ownLook.state !== lastState) { ownLook = { state: lastState, want: look, shown: look, asked: false }; return look; }
    if (ownLook.want !== look) { ownLook.want = look; ownLook.asked = false; }
    if (ownLook.shown === look) return look;
    const key = keyOf(look);
    if (!painter || figures.ready(key, 'gait')) { ownLook.shown = look; return look; }
    if (!ownLook.asked) {
      ownLook.asked = true;
      const o = ownLook;
      figures.prepare(key, look, { bands: ['gait'], own: true }).then(() => { if (o.want === look) o.shown = look; }, () => { o.shown = look; });
    }
    return ownLook.shown;
  }
  // (how an actor is drawn at ms: people's figureOf, else 0.0.2's look and the actor's own fields)
  function figureOf(state, a, ms = state.clock.ms) {
    if (typeof FIGURE.figureOf === 'function') { const f = FIGURE.figureOf(state, a, ms); if (f) return f; }
    return { look: state.people?.[a.who]?.look ?? null, posture: a.posture ?? 'stand', y: a.y ?? 0, face: a.face ?? 'down', head: a.head ?? null, curtain: !!a.curtain, gait: a.gait, strideM: a.strideM ?? 0 };
  }
  // (a look with the body's cues it shows, and a woman's towel at the chest: one object per look and cue, so the caches key on it)
  const cued = new WeakMap();
  function lookWith(look, fig, sex) {
    if (!look) return look;
    const wet = (fig.cues?.wetK ?? 0) > 0, tired = (fig.cues?.tiredK ?? 0) >= 0.5, f = look.outfit === 'towel' && sex === 'f';
    if (!wet && !tired && !f) return look;
    let m = cued.get(look);
    if (!m) cued.set(look, (m = new Map()));
    const k = `${wet ? 'w' : ''}${tired ? 't' : ''}${f ? 'f' : ''}`;
    let o = m.get(k);
    if (!o) m.set(k, (o = Object.freeze({ ...look, ...(wet ? { wet: true } : {}), ...(tired ? { tired: true } : {}), ...(f ? { sex: 'f' } : {}) })));
    return o;
  }
  // (a look with a rifle in hand and the kit worn: the gait's carry, the magazine out, ear defenders, the
  // carrier, a headset; one object per look and variant, so the caches key on it)
  const armed = new WeakMap();
  function armedLook(look, v) {
    if (!look) return look;
    let m = armed.get(look);
    if (!m) armed.set(look, (m = new Map()));
    const k = `${v.weapon ?? '-'}|${v.carry ?? '-'}|${v.magOut ? 1 : 0}|${v.ears ? 1 : 0}|${v.carrier ? 1 : 0}|${v.headset ? 1 : 0}`;
    let o = m.get(k);
    if (!o) m.set(k, (o = Object.freeze({ ...look, ...(v.weapon ? { weapon: v.weapon, carry: v.carry } : {}), ...(v.magOut ? { magOut: true } : {}), ...(v.ears ? { ears: true } : {}), ...(v.carrier ? { carrier: true } : {}), ...(v.headset ? { headset: true } : {}) })));
    return o;
  }
  // (the carry a figure's gait frames are painted with: the one it last walked with, so standing still in
  // stop motion, a change of posture changes no sheet)
  const gaitCarry = new Map();
  const RO_POST = /(^|:)kd-ro$/;
  /** What an actor carries and wears, as the figure draws it: { gl (gunLook or null), look (armed), kit }. */
  function armsOf(state, a, look, msA, walking) {
    const person = state.people?.[a.who] ?? null;
    const gl = typeof ARMS.gunLook === 'function' && person?.kit ? ARMS.gunLook(state, a, msA) : null;
    const kit = gl || person?.kit ? (typeof ARMS.kitLook === 'function' ? ARMS.kitLook(state, a.who) : null) : null;
    let carry = null;
    if (gl) {
      if (walking || !gaitCarry.has(a.id)) gaitCarry.set(a.id, gaitCarryOf(gl.carry));
      carry = gaitCarry.get(a.id);
    }
    const headset = !!person?.post && RO_POST.test(person.post.key ?? '');
    if (!gl && !kit?.ears && !kit?.carrier && !headset) return { gl: null, look, kit };
    const v = { weapon: gl ? 'rifle' : null, carry, magOut: gl ? gl.mag === false : false, ears: !!kit?.ears, carrier: !!kit?.carrier, headset };
    // (the twin: the same look with the magazine the other way, whose sheet the figures draw while this one's band paints)
    return { gl, kit, look: armedLook(look, v), twin: gl ? armedLook(look, { ...v, magOut: !v.magOut }) : null };
  }

  // (a figure's frame from its transition (people's poseAt) or its activity's part, else null: the gait's;
  // msA the clock dressing's two frames turn on: the game's in play, the view's own in a splash, where a
  // time-lapse would turn them every frame)
  function frameOf(fig, msA) {
    const tf = fig.frame, part = fig.activity?.part ?? null;
    if (tf === 'sit' || tf === 'climb' || tf === 'standUp') return tf;
    if (tf === 'dress') return `dress${Math.floor(msA / DRESS_FRAME_MS) % 2}`;
    const pf = part ? PART_FRAME[part] : null;
    if (pf === 'dress') return `dress${Math.floor(msA / DRESS_FRAME_MS) % 2}`;
    return pf ?? null;
  }
  // (on a flight of stairs: walking up it toward its face, or down)
  function stairsOf(a, x, z) {
    if (!live || (a.gait !== 'walk' && a.gait !== 'stroll')) return null;
    for (const f of live.area.fixtures ?? []) {
      if (f.kind !== 'stairs') continue;
      const fp = FOOTPRINTS.stairs, side = f.face === 'left' || f.face === 'right', hw = (side ? fp.d : fp.w) / 2, hd = (side ? fp.w : fp.d) / 2;
      if (Math.abs(x - f.x) > hw || Math.abs(z - f.z) > hd) continue;
      const dx = a.x - (a.$px ?? a.x), dz = a.z - (a.$pz ?? a.z), up = { up: -dz, down: dz, left: -dx, right: dx }[f.face] ?? 0;
      return up >= 0 ? 'stairsUp' : 'stairsDown';
    }
    return null;
  }
  // (a sleeper's berth: its rack, its deck, the blanket the rack's maker gave it. The berth is the pose
  // shown's (figureOf's spotId: a rising sleeper's own until they leave it), never the end state's, which
  // a call has already moved to the rack's foot (the review of v0.0.4: the upper berth's sleepers drawn
  // in the lower one, hidden, from the klaxon's first frame); a seat that is no berth (the foot's #1)
  // takes the deck nearest the figure's height)
  function berthOf(a, fig, person, { msA = 0, up = false, breathS = msA / 1000 } = {}) {
    const seat = fig.spotId ?? a.spotId ?? null, [fid, n] = seat ? seat.split('#') : [null, null], rack = fid ? live.racks.get(fid) : null;
    const decks = rack ? RACK_DECKS[rack.kind] : null;
    let deck = null;
    if (decks && Number(n) >= 2) deck = decks[Math.max(0, Math.min(decks.length - 1, Number(n) - 2))];
    else if (decks) deck = decks.reduce((b, d) => (Math.abs(d + BERTH_TOP_M - (fig.y ?? 0)) < Math.abs(b + BERTH_TOP_M - (fig.y ?? 0)) ? d : b), decks[0]);
    const head = fig.head ?? HEAD_OF_FACE[fig.face] ?? 'n', look = fig.look ?? {};
    const seed = Math.floor(hash01('berth', a.who ?? a.id) * 1000);
    // (breathing: the blanket's two frames at BREATH_HZ, each sleeper on a phase of their own, on the game's
    // clock in play and the view's own in a splash (a night's time-lapse would flicker); the curtain closing
    // over CURTAIN_MS once the sleeper is down, where the lying down was seen to end)
    const breath = up ? 0 : Math.floor(breathS * BREATH_HZ * 2 + seed / 97) % 2;
    const downAt = a.trans && a.trans.kind === 'down' ? a.trans.fromMs + a.trans.ms : null;
    const curtainK = fig.curtain && downAt !== null && msA - downAt < CURTAIN_MS ? Math.max(0, (msA - downAt) / CURTAIN_MS) : null;
    return {
      x: rack ? rack.x : a.x, z: rack ? rack.z : a.z, rack, head,
      lie: { y: deck !== null ? deck + BERTH_TOP_M + 0.005 : (fig.y ?? 0) + 0.12, head, blanket: rack ? rackBlanket(rack) : 'olive', skin: look.skin ?? 'tan', hair: look.hair ?? { style: 'lowReg', color: 'dark' },
        curtain: fig.curtain && !up ? (rack?.look?.curtain ?? 'olive') : null, curtainK, breath, up, seed, who: person ?? a.who },
    };
  }
  // (a body up on its mattress, sitUp or lieDown: its upper half's card on the berth at the head's end, facing its foot)
  const FACE_OF_HEAD = { n: 'down', s: 'up', e: 'left', w: 'right' };
  function sitterOn(b, frame) {
    const along = BERTH_M[1] / 2 - 0.42, d = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] }[b.head] ?? [0, -1];
    return { x: b.x + d[0] * along, z: b.z + d[1] * along, y: b.lie.y, frame, face: FACE_OF_HEAD[b.head] ?? 'down' };
  }

  // ---------- the fog of awareness ----------
  function fogFrame(state, you, dtS, light, lift = null) {
    if (!fogOn || !you || !state) { stage.setFog(null); return; }
    fog ??= createFogMask({ nx: FOG_CELLS[0], nz: FOG_CELLS[1] });
    const me = playerActor(state), real = !testFog && typeof PERCEPTION.sightMask === 'function' && typeof PERCEPTION.eyeOf === 'function';
    if (!real && !testFog) { stage.setFog(null); return; }
    const eye = real ? PERCEPTION.eyeOf(state, me) : { x: you.x, z: you.z, headRad: Math.atan2(...(FACE[you.face] ?? FACE.down).slice().reverse()) };
    const sec = Math.floor(state.clock.ms / 1000);
    const turned = fogAt && Math.abs((((eye.headRad ?? 0) - fogAt.head) * 180 / Math.PI + 540) % 360 - 180) >= FOG_TURN_DEG;
    // (a new area, or the first fog: shown as it is at once, never the old area's shape eased out over the new: v0.0.3's review)
    const snap = !fogAt || live.id !== fogAt.area, liftSig = lift ? `${lift.x},${lift.z}` : '';
    if (snap || Math.hypot(eye.x - fogAt.x, eye.z - fogAt.z) >= FOG_MOVE_M || turned || sec !== fogAt.sec || propsSig !== fogAt.props || liftSig !== fogAt.lift) {
      const t0 = now(), cam = stage.cam.at;
      fog.place(cam.x - FOG_CELLS[0] * FOG_CELL_M / 2, cam.z - FOG_CELLS[1] * FOG_CELL_M / 2);
      const [x0, z0] = fog.box;
      if (real) {
        const mask = { x0, z0, nx: FOG_CELLS[0], nz: FOG_CELLS[1], cellM: FOG_CELL_M, vis: new Float32Array(FOG_CELLS[0] * FOG_CELLS[1]) };
        PERCEPTION.sightMask(state, eye, mask);
        // (a splash's iris, closed: the vignette inside it shown as seen; my call)
        if (lift) for (let j = 0; j < mask.nz; j++) for (let i = 0; i < mask.nx; i++) if (Math.hypot(x0 + (i + 0.5) * FOG_CELL_M - lift.x, z0 + (j + 0.5) * FOG_CELL_M - lift.z) < lift.r) mask.vis[j * mask.nx + i] = 1;
        fog.setSeen(mask.vis);
        fogWant = { x0, z0, nx: mask.nx, nz: mask.nz, cellM: FOG_CELL_M, vis: mask.vis, ms: state.clock.ms, eye: { x: eye.x, z: eye.z, headRad: eye.headRad } };
      } else {
        const [fx, fz] = FACE[you.face] ?? FACE.down, sh = TEST_FOG;
        fog.fill((x, z) => {
          const dx = x - you.x, dz = z - you.z, d = Math.hypot(dx, dz);
          const ahead = d > 0 && Math.acos(Math.max(-1, Math.min(1, (dx * fx + dz * fz) / d))) < sh.cone;
          return [d < sh.nearM || (d < sh.reachM && ahead) ? 1 : 0, 0];
        });
        fogWant = null;
      }
      fogAt = { x: eye.x, z: eye.z, head: eye.headRad ?? 0, sec, props: propsSig, area: live.id, lift: liftSig };
      stats.fog.recomputes++; stats.fog.ms = now() - t0; stats.fog.source = real ? 'sightMask' : 'test';
    }
    fog.ease(snap ? Infinity : dtS || Infinity);
    const [tex, x0, z0, w, h] = fog.upload();
    stage.setFog(tex, x0, z0, w, h, light?.dimK ?? stage.mood.dimK);
  }

  // ---------- see-through and the lifted roof ----------
  function seeFrame(you, dtS) {
    if (!you || !live) { SHARED.uSeeK.value = 0; SHARED.uLiftY.value.y = 0; SHARED.uSeeWide.value.w = 0; tallS = 0; wideK = 0; return; }
    const hw = SEE_FIGURE_M[0] / 2 + SEE_MARGIN_PX / ppm, H = SEE_FIGURE_M[1];
    const hidden = live.occluders.some(b => occludes(b, you.x, you.z, hw, H));
    const step = dtS > 0 ? dtS / SEE_DISSOLVE_S : 1;
    seeK = Math.max(0, Math.min(1, seeK + (hidden ? step : -step)));
    // (the vignette's cut stands in for the see-through while the iris is closed on a stall)
    const cutK = vigCut?.k ?? 0;
    SHARED.uSeeK.value = seeK * (1 - cutK);
    if (cutK > 0) {
      const r = vigCut.rect;
      SHARED.uLift.value.set(r[0], r[1], r[2], r[3]); SHARED.uLiftY.value.set(CUT_H_M, cutK);
      SHARED.uSeeWide.value.w = 0;
      stats.see = { k: seeK * (1 - cutK), lift: 0, hidden, wide: 0, cut: cutK };
      return;
    }
    // (behind a tall mass for longer than the dissolve: the wide see-through, a disc round you; the figure's box for a glimpse)
    const tall = live.kind === 'ground' && live.occluders.some(b => b.h > TALL_MASS_M && occludes(b, you.x, you.z, hw, H));
    tallS = tall ? tallS + (dtS || 0) : 0;
    wideK = Math.max(0, Math.min(1, wideK + (tallS > SEE_DISSOLVE_S ? step : -step)));
    SHARED.uSeeWide.value.set(you.x, you.z, SEE_WIDE_M, wideK);
    // (a roof over you: the massing rect you stand in, on a ground: an open shed's)
    let over = null;
    if (live.kind === 'ground') for (const m of live.area.massing ?? []) for (const r of m.rects) if (you.x > r[0] && you.x < r[2] && you.z > r[1] && you.z < r[3]) over = r;
    if (over) liftRect = over;
    liftK = Math.max(0, Math.min(1, liftK + (over ? step : -step)));
    if (liftRect) SHARED.uLift.value.set(liftRect[0] - 0.3, liftRect[1] - 0.3, liftRect[2] + 0.3, liftRect[3] + 0.3);
    SHARED.uLiftY.value.set(LIFT_FROM_M, liftK);
    if (!liftK) liftRect = null;
    stats.see = { k: seeK, lift: liftK, hidden, wide: wideK };
  }

  // ---------- the eye ----------
  // (the player's eye on the post pass: see the header, 2b)
  function eyeFrame(state, dtS, sp = null) {
    const me = state ? playerActor(state) : null;
    const v = !heldMood && me && state.places?.live?.area && typeof PERCEPTION.eyeViewOf === 'function' ? PERCEPTION.eyeViewOf(state, me) : null;
    let want = { g: Math.log(v?.gain ?? 1), c: Math.log(v?.coneGain ?? v?.gain ?? 1), rod: v?.rod ?? 0, glare: v?.glare ?? 0 };
    const fresh = !eyeShown || eyeState !== state || !(dtS > 0);
    // (a splash holds the eye as it began, through the lapse, the beat and the strip, and eases to the
    // live eye over its zoom out: the night's lapse never pulses with the eyes' minutes before the lids close)
    if (sp && !fresh) {
      eyeHeld ??= { ...eyeShown };
      if (sp.phase !== 'out') want = eyeHeld;
      else { const o = Math.max(0, Math.min(1, sp.k ?? 0)), w = o * o * (3 - 2 * o); want = { g: eyeHeld.g + (want.g - eyeHeld.g) * w, c: eyeHeld.c + (want.c - eyeHeld.c) * w, rod: eyeHeld.rod + (want.rod - eyeHeld.rod) * w, glare: eyeHeld.glare + (want.glare - eyeHeld.glare) * w }; }
    } else eyeHeld = null;                                           // (no splash, or a new state: nothing held)
    if (fresh) eyeShown = { ...want };
    else {
      const k = sp ? 1 : 1 - Math.exp(-dtS / EYE_EASE_S);
      for (const key of ['g', 'c', 'rod', 'glare']) eyeShown[key] += (want[key] - eyeShown[key]) * k;
    }
    eyeState = state;
    stage.post?.setEye?.(Math.exp(eyeShown.g), eyeShown.rod, Math.exp(eyeShown.c), eyeShown.glare);
    stats.eye = { gain: v?.gain ?? 1, coneGain: v?.coneGain ?? v?.gain ?? 1, rod: v?.rod ?? 0, glare: v?.glare ?? 0, a: v?.a ?? null, lightK: v?.lightK ?? 1, shut: !!v?.shut, nv: !!v?.nv, held: !!eyeHeld,
      shown: { gain: Math.round(Math.exp(eyeShown.g) * 1e4) / 1e4, coneGain: Math.round(Math.exp(eyeShown.c) * 1e4) / 1e4, rod: Math.round(eyeShown.rod * 1e4) / 1e4, glare: Math.round(eyeShown.glare * 1e4) / 1e4 } };
  }

  // ---------- the stair's wipe ----------
  function wipeFrame(dtS) {
    if (!wipe) return;
    wipe.t += dtS || 0;
    const k = Math.min(1, wipe.t / STAIR_DISSOLVE_S), r = k * wipe.R;
    for (const m of wipe.from.built?.mats ?? []) m.userData.oly?.uniforms?.uWipe?.value.set(wipe.x, wipe.z, r, -1);
    for (const m of wipe.to.built?.mats ?? []) m.userData.oly?.uniforms?.uWipe?.value.set(wipe.x, wipe.z, r, 1);
    if (k >= 1) endWipe();
  }

  // ---------- the far window ----------
  // (its point in the picture: the hud's disc from CSS pixels, a KD face's centred on the face as drawn standing up;
  // its fog once a game second or when the point moves; its chunks and its dissolve stepped. Returns its view or null)
  function farFrame(state, rl, area, dtS, light) {
    if (live.kind === 'ground') {
      far.setGround(area, FAR_SIZES);
      if (rl?.kd && !kdPrebuilt) {
        kdPrebuilt = true;
        far.prebuild((rl.kd.faces ?? []).filter((f, i, a) => i % 3 === 0 || i === a.length - 1).map(f => ({ x: f.x, z: f.z - (f.upY ?? 1.9) })));
      }
    }
    let v = null;
    const w = farWant;
    if (w && live.kind === 'ground' && Number.isFinite(w.x)) {
      const lane = /^face:(\d+)$/.exec(w.key ?? '')?.[1], face = lane && rl?.kd ? rl.kd.faces?.find(f => String(f.lane) === lane) : null;
      const c = face ? (() => { const fa = kdFaceAt({ ...face, up: 1 }, ppm); return { x: fa.x0 + fa.n / ppm / 2, y: fa.cy, z: fa.z, faceK: FACE_K }; })() : { x: w.x, y: w.y ?? 0, z: w.z, faceK: 1 };
      const css = stage.canvas.style, rect = { left: parseFloat(css.left) || 0, top: parseFloat(css.top) || 0, width: parseFloat(css.width) || stage.W, height: parseFloat(css.height) || stage.H };
      const d = Number.isFinite(w.cx) ? pictOfCss({ cx: w.cx, cy: w.cy, rCss: w.rCss }, rect, stage.W, stage.H) : { cx: stage.W - FAR_R_PX - 6, cy: Math.round(stage.H / 2), r: FAR_R_PX };
      const h0 = w.hold ?? state.stop?.hold ?? null, hold = Array.isArray(h0) ? h0 : h0 ? [h0.xMil ?? 0, h0.yMil ?? 0] : [0, 0];
      v = { key: w.key ?? `${w.x},${w.z}`, ...c, rangeM: w.rangeM ?? 0, cx: d.cx, cy: d.cy, r: d.r, optic: w.optic ?? 1, hold, tickRad: w.tickRad };
    }
    far.set(v);
    const fs = far.frame(dtS);
    // (the window's fog: perception's near, the open air's far, the optic's lift; a new box or a game second)
    const shownV = far.view;
    if (shownV && state) {
      // (the lift mixed by the window's scale while the lever eases, in 1/32 steps: the fog moves with the picture, 0.0.8)
      const lens = Math.round(far.lens * FAR_LENS_STEPS) / FAR_LENS_STEPS;
      const ms = state.clock.ms, me = playerActor(state), sec = Math.floor(ms / 1000), fogMag = far.fogMag, sig = `${shownV.key}|${lens}|${fogMag}|${sec}`;
      if (sig !== farFogAt && me && typeof PERCEPTION.eyeOf === 'function') {
        farFogAt = sig;
        const eye = PERCEPTION.eyeOf(state, me), box = farFogBox(shownV.x, shownV.z - shownV.y, fogMag);
        const vis = farFogCells(box, eye, { vis: (x, z) => PERCEPTION.visibility(state, eye, x, z, ms), light: (x, z) => lightLevel(state, x, z, ms, live.id), optic: shownV.optic, lens });
        far.setFog(vis, box, light?.dimK ?? stage.mood.dimK);
      }
    }
    stats.far = { ...fs, want: !!w };
    return shownV;
  }

  // ---------- a frame ----------
  /** Draw the state between its last two ticks. info: { lonEDeg (the live site's longitude), cut (an area's cut is held), paused, held }. */
  function frame(alpha, state, info = {}) {
    const t0 = now();
    const dtS = lastT === null ? 0 : Math.min(0.1, (t0 - lastT) / 1000);
    lastT = t0; realS += dtS;
    if (state) lastState = state;
    painter?.step();                                                 // (5: the main thread's share, when there is no worker)
    let you = null, light = null;
    const people = [];
    waitingSheets.clear();
    // (an area's cut: the last picture held, nothing drawn, while the sim stands in another area than
    // the view shows or the cut waits for the figures; the uploads still go, so the figures the cut waits
    // for come up. v0.0.3's review: a frame of the old floor at the new area's coordinates, then the
    // street without the player)
    if (state && live && (info.cut || (state.places?.live?.area ?? null) !== live.id)) {
      const up = uploads ? uploads.drain() : { n: 0, bytes: 0, ms: 0 };
      stats.held = (stats.held ?? 0) + 1;
      Object.assign(stats, { viewMs: now() - t0, uploads: { n: up.n, bytes: up.bytes }, frames: stats.frames + 1, holding: true });
      return;
    }
    stats.holding = false;
    const sp = state ? info.splash ?? null : null;
    let fogLift = null, vigItems = [], vigRed = 0;
    if (state && live) {
      const area = live.area, ms = state.clock.ms;
      // 2. the light (in a splash, the light of the time shown: shownMs, never past the sim's clock)
      const lightMs = sp && Number.isFinite(sp.shownMs) ? Math.min(ms, sp.shownMs) : ms;
      light = lighting.frame(state, area, { ms: lightMs, lonEDeg: info.lonEDeg ?? 0, siteId: area.site, heldMood });
      stats.mood = heldMood ?? lighting.stats.rig;
      // 2b. the eye
      eyeFrame(state, dtS, sp);
      // 3. where everyone is between the last two ticks, and how each is drawn at that moment
      const k = info.held ? 1 : alpha;
      const me = playerActor(state), meId = me?.id ?? null, tS = ms / 1000 + k * 0.05, msA = ms + k * TICK_MS, breathS = sp ? realS : msA / 1000, frameMs = breathS * 1000;
      // (the arms' effects on the positions' own time, between the last two ticks: a shot is stamped at its tick's
      // start and the clock is a tick past it by the first frame drawn, so on msA its flash's strong part fell in
      // a tick never drawn (the runtime review's: no flash in any frame of a tapped Fire); held, the clock itself)
      const fxMs = fxMsOf(ms, k, TICK_MS);
      // (the memory: forgotten with a new state, another area, or a skip, the last only while a full
      // splash's iris covers the picture (or no splash shows it), never in sight of the bay: a brief
      // splash's lapse keeps it, so a squadmate drawn as last seen stays so until looked at; the review
      // of v0.0.5's rack, seven jumping in the dressing splash's first frame)
      memory.begin(state, live.id, { skipping: !!state.skip && (!sp || (sp.form === 'full' && (sp.inkK ?? 0) >= 0.999)) });
      const flashes = [];
      let ownGun = null;
      const rl = typeof ARMS.rangeLook === 'function' && live.id === KD_RANGE.area ? ARMS.rangeLook(state, fxMs) : null;
      const eye = me && typeof PERCEPTION.eyeOf === 'function' && typeof PERCEPTION.visibility === 'function' ? PERCEPTION.eyeOf(state, me) : null;
      const inSight = (x, z) => PERCEPTION.visibility(state, eye, x, z, ms) > 0;
      for (const a of state.actors?.list ?? []) {
        const was = a.id !== meId && eye ? memory.recall(a.id, a.x, a.z, inSight) : null;
        if (was) { people.push({ ...was, tS, dx: 0, dz: 0, remembered: true }); continue; }
        const fig = figureOf(state, a, msA), own = a.id === meId;
        // (a transition plays at its own places (figureOf's x and z, k under 1), never glided; everything else between the ticks)
        const moving = typeof fig.k === 'number' && fig.k < 1 && Number.isFinite(fig.x);
        const px = a.$px ?? a.x, pz = a.$pz ?? a.z, step = Math.hypot(a.x - px, a.z - pz), jump = step > JUMP_M;
        let x = moving ? fig.x : jump ? a.x : px + (a.x - px) * k, z = moving ? fig.z : jump ? a.z : pz + (a.z - pz) * k;
        let stride = (fig.strideM ?? a.strideM ?? 0) - (jump || moving ? 0 : (1 - k) * step);
        if (stride < 0) stride += STRIDE_WRAP_M;
        const person = state.people?.[a.who] ?? null;
        let look0 = lookWith(fig.look, fig, person?.sex);
        let face = fig.face ?? a.face ?? 'down', hidden = false;
        // (inside a fixture: in a shower stall, drawn in it facing its head (the steam before you); in any other, hidden behind it)
        const inside = fig.inside ? live.fixtures.get(fig.inside) ?? null : null;
        if (inside) {
          const spot = insideSpot(inside);
          if (spot) {
            // (the dress part's last 15%: stepping out of the stall to its spot, at the time-lapse's pace)
            const out = fig.activity?.part === 'dress' ? Math.max(0, Math.min(1, ((fig.activity.k ?? 0) - 0.85) / 0.15)) : 0, o = out * out * (3 - 2 * out);
            x = spot.x + (x - spot.x) * o; z = spot.z + (z - spot.z) * o; face = o < 0.5 ? spot.face : face;
          } else hidden = true;
        }
        // (a rifle in hand, the kit worn: the look that draws them, and the rifle's frame when not walking)
        const walking0 = GAIT[fig.gait ?? a.gait] !== undefined && (fig.gait ?? a.gait ?? 'idle') !== 'idle' && step > 1e-6;
        const arms = armsOf(state, a, look0, fxMs, walking0);
        look0 = arms.look;
        const rf = arms.gl && !walking0 ? rifleFrame(arms.gl, { face, x, z, ms: fxMs }) : null;
        if (arms.gl?.flash > 0 && arms.gl.muzzle) flashes.push({ x: arms.gl.muzzle.x, z: arms.gl.muzzle.z, k: arms.gl.flash });
        if (own && arms.gl) { ownGun = arms.gl; }
        // (your own look changed by a cue (wet hair, the tired walk): the worker paints it while the last one is drawn)
        if (own) look0 = ownLookOf(look0);
        const { look, key } = lookOf(look0, a.who);
        const gait = stairsOf(a, x, z) ?? GAIT[fig.gait ?? a.gait] ?? 'idle';
        const p = { key, look: look ?? {}, x, z, face, gait, stride, tS, phase: hash01('phase', a.id) * 2, own, id: a.id, dx: a.x - px, dz: a.z - pz, fig: fig.frame ?? null };
        if (arms.twin && !own) p.twin = lookOf(arms.twin, `${a.who}:twin`).key;
        const tf = fig.frame;
        if (tf === 'hurt') {
          // (a casualty lying where they fell: the lie band's card on the ground, never a berth)
          p.frame = 'hurt';
        } else if (tf === 'sitUp' || tf === 'lieDown') {
          // (up on the mattress: the berth thrown back to the waist, the upper body's card at its head)
          const b = berthOf(a, fig, a.who, { msA, up: true, breathS }), st = sitterOn(b, tf);
          // (to the edge over the last SIT_SLIDE_K of sitting up, smoothly: where the sit frame takes over)
          const edge = Number.isFinite(fig.edgeX) && Number.isFinite(fig.edgeZ) && Number.isFinite(fig.upK);
          const u = edge ? Math.max(0, Math.min(1, (fig.upK - (1 - SIT_SLIDE_K)) / SIT_SLIDE_K)) : 0, w = u * u * (3 - 2 * u);
          people.push({ ...p, ...b, lie: b.lie, x: b.x, z: b.z, card: false, id: `${a.id}:berth` });
          Object.assign(p, { x: edge ? st.x + (fig.edgeX - st.x) * w : st.x, z: edge ? st.z + (fig.edgeZ - st.z) * w : st.z, frame: st.frame, face: st.face, y: st.y, seat: st.y, noBlob: true });
        } else if (tf === 'lie' || (fig.posture === 'lie' && !frameOf(fig, frameMs))) Object.assign(p, berthOf(a, fig, a.who, { msA, breathS }));
        else {
          const f = frameOf(fig, frameMs);
          if (f === 'sit' || (!f && fig.posture === 'sit')) { p.frame = 'sit'; p.y = Math.max(0, (fig.y ?? 0.45) - figures.layout.body.seatM); p.seat = p.y; }
          else if (f === 'climb') { p.frame = 'climb'; p.y = Math.max(0, fig.y ?? 0); p.seat = 0; }
          else if (f) p.frame = f;
          else if (rf?.frame) { p.frame = rf.frame; p.flash = !!rf.flash; }
          else if (tf === 'aid') p.frame = 'aid';                     // (the corpsman kneeling at work, unarmed)
          // (below the ground: the pits' detail on their floor, drawn at their height, so the ground hides them)
          if ((fig.y ?? 0) < -0.05 && !p.frame) { p.y = fig.y; p.seat = fig.y; p.floorY = fig.y; }
          // (standing on a height: the range officer on the tower's deck; the blob on the deck under them)
          if (!p.y && (fig.posture ?? 'stand') === 'stand' && (fig.y ?? 0) > 0.05) { p.y = fig.y; p.seat = fig.y; p.floorY = fig.y; }
        }
        if (hidden) p.hidden = true;
        if (!hidden) people.push(p);
        if (own) you = p;
        else if (eye) memory.keep(a.id, a.x, a.z, p);
      }
      // (the splash's vignette at its fixture; the alert's beacon in the hall while a drill is open)
      vigCut = null;
      if (sp && sp.vignette) {
        const f = sp.fixtureId ? live.fixtures.get(sp.fixtureId) ?? null : null;
        vigItems = vignetteItems({ sp, fixture: f, you, tS: realS, ppm });
        stats.vignette = { name: sp.vignette, fixture: sp.fixtureId ?? null, part: sp.part ?? null, items: vigItems.length };
        // (a shower stall in a closing iris: the stall and the floor to its spot cut down, by the iris's ink, so
        // you read whole in it and on its spot after, at the strip; never a neighbour's partition)
        if (f && f.kind === 'showerStall' && sp.form === 'full' && (sp.inkK ?? 0) > 0) {
          const fp = FOOTPRINTS.showerStall, side = f.face === 'left' || f.face === 'right', hw = (side ? fp.d : fp.w) / 2 + 0.05, hd = (side ? fp.w : fp.d) / 2 + 0.05;
          const me = playerActor(state), mx = me?.x ?? f.x, mz = me?.z ?? f.z;
          vigCut = { rect: [Math.min(f.x - hw, mx - 0.35), Math.min(f.z - hd, mz - 0.4), Math.max(f.x + hw, mx + 0.35), Math.max(f.z + hd, mz + 0.1)], k: Math.max(0, Math.min(1, sp.inkK)) };
        }
      } else stats.vignette = null;
      const alert = typeof ALERTS.alertNow === 'function' ? ALERTS.alertNow(state, msA) : null;
      if (alert && alert.horn?.area === live.id) {
        vigItems.push({ name: 'beacon', opts: { on: alert.hornOn ? 1 : 0 }, x: alert.horn.x, y: BEACON_Y_M, z: alert.horn.z });
        stage.lights.setLamps(alert.hornOn ? [{ ...BEACON_LAMP, x: alert.horn.x, z: alert.horn.z }] : []);
        stats.beacon = { on: !!alert.hornOn, phase: alert.phase };
      } else { if (stats.beacon) stage.lights.setLamps([]); stats.beacon = null; }
      if (sp?.phase === 'beat' && (sp.interrupt?.kind === 'alert' || sp.interrupt?.letter === 'A')) vigRed = Math.sin(Math.PI * ((sp.k ?? 0) * 2 % 1)) * 0.8;
      // (the iris's inside, shown as seen while it is closed: its centre and radius for the fog)
      if (sp && sp.form === 'full' && sp.centre && (sp.inkK ?? 0) > 0.5 && sp.phase !== 'out') fogLift = { x: sp.centre.x, z: sp.centre.z, r: (Number.isFinite(sp.irisM) ? sp.irisM : 3.5) + 1.5 };
      // 4. the camera
      const cw = stage.W / ppm, ch = stage.H / ppm, b = cameraBounds(live);
      if (you && !wipe) {
        const n = Math.hypot(you.dx, you.dz), L = you.gait === 'run' ? LEAD_RUN_M : LEAD_WALK_M;
        // (the weapon mode's lead toward the bracketed target, else the walk's)
        const pick = ownGun ? rl?.pick ?? null : null;
        const pickFar = !!pick && (Math.abs(pick.x - you.x) > cw || Math.abs(pick.z - you.z) > ch);
        const want0 = pick ? aimLead(you, pick, [cw / 2, ch / 2], { k: ARMS.AIM_LEAD_K ?? 0.55, edgeM: ARMS.EDGE_KEEP_M ?? 2.5, ...(pickFar ? { maxM: FAR_LEAD_M } : {}) })
          : you.gait !== 'idle' && n > 1e-6 ? [you.dx / n * L[0], you.dz / n * L[1]] : [0, 0];
        if (snapNext) { lead[0] = want0[0]; lead[1] = want0[1]; }
        else { const kk = 1 - Math.exp(-dtS / LEAD_S); lead[0] += (want0[0] - lead[0]) * kk; lead[1] += (want0[1] - lead[1]) * kk; }
        // (the lead snapped to the pixel grid before it is added: the camera and the figure, each snapped,
        // then keep one offset, where an eased lead between pixels flipped the figure a pixel each frame)
        const lx = Math.round(lead[0] * ppm) / ppm, lz = Math.round(lead[1] * ppm) / ppm;
        const ax = cameraAxis(you.x, lx, b.x0, b.x1, cw), az = cameraAxis(you.z, lz, b.z0, b.z1, ch);
        // (your own shot: the picture kicked back along the bore a pixel, for SHOT_SHAKE_MS of game time)
        const since = ownGun?.shotMs !== null && ownGun?.shotMs !== undefined ? fxMs - ownGun.shotMs : Infinity;
        const kick = since >= 0 && since < SHOT_SHAKE_MS ? SHOT_SHAKE_PX / ppm : 0, back = FACE[you.face] ?? [1, 0];
        stage.look(ax.c - back[0] * kick, az.c - back[1] * kick);
        stats.arms = ownGun ? { carry: ownGun.carry, stance: ownGun.stance, frame: you.frame ?? null, flash: ownGun.flash, kick: ownGun.kick, shake: !!kick, pick } : null;
        snapNext = false;
      }
      // 5. the ground's chunks round the camera
      if (live.kind === 'ground') {
        const cam = stage.cam.at, n = you ? Math.hypot(you.dx, you.dz) : 0;
        const view = { x: cam.x, z: cam.z, dx: n > 1e-6 ? you.dx / n : 0, dz: n > 1e-6 ? you.dz / n : 0, frame: { x0: cam.x - cw / 2, x1: cam.x + cw / 2, z0: cam.z - ch / 2, z1: cam.z + ch / 2 + 8 } };
        const cs = chunks.frame(view);
        stats.chunks = { built: cs.built, building: cs.building, popped: cs.popped, mainMs: cs.mainMs, maxMainMs: cs.maxMainMs, dropped: cs.dropped, bytes: cs.bytes, inFrame: chunks.pendingIn(view.frame) };
      }
      // 6. the moving pieces and the clocks
      if (live.built) {
        swingProps(live.built, state, area, ms);
        propsSig = live.built.props.map(p => p.group.rotation.y.toFixed(3)).join();
      }
      stats.clocks = clocks.frame(state, info.lonEDeg ?? 0);
      // 8. tints where each stands: places' level through the eye's exposure
      const beacon = stats.beacon?.on ? stage.lights.lamps[0] : null;
      const tintAt = (x, z) => {
        const t = heldMood ? stage.lightAt(x, z) : lighting.tintAt(state, x, z, lightMs);
        if (!beacon) return t;
        const d = Math.hypot(x - beacon.x, z - beacon.z), kk = d < beacon.r ? beacon.core + beacon.ring : d < beacon.r * 1.5 ? beacon.ring : 0;
        return kk ? [t[0] + 1.0 * kk, t[1] + 0.07 * kk, t[2] + 0.04 * kk] : t;
      };
      // (a muzzle's flash lights whoever is within FLASH_LIT_M of it, falling off with the distance: VIEWS §3.6)
      for (const p of people) {
        p.tint = tintAt(p.x, p.z);
        for (const f of flashes) { const d = Math.hypot(p.x - f.x, p.z - f.z); if (d < FLASH_LIT_M) { const kk = (1 - d / FLASH_LIT_M) * f.k; p.tint = p.tint.map((v, i) => v + FLASH_LIGHT[i] * kk); } }
      }
      // (the range in play and what lies on the ground: rangeLook at the moment drawn)
      // (the far window's point this frame: the view's frame of it, and its rect for the range's culling)
      const farView = farFrame(state, rl, area, dtS, light);
      const camAt = stage.cam.at, views = [{ x0: camAt.x - cw / 2, x1: camAt.x + cw / 2, z0: camAt.z - ch / 2, z1: camAt.z + ch / 2 + 8 }];
      if (farView) { const m = far.radiusM; views.push({ x0: farView.x - m, x1: farView.x + m, z0: farView.z - farView.y - m, z1: farView.z - farView.y + m + 8 }); }
      stats.range = rl ? rangeLayer.update(rl, { kd: KD_RANGE, ms: fxMs, tintOf: tintAt, views }) : (rangeLayer.update(null), null);
      // (blood on the ground, and the wounds' marks on the figures drawn)
      const bl = typeof BLOOD.bloodLook === 'function' ? BLOOD.bloodLook(state, live.id, fxMs) : null;
      stats.blood = blood.update(bl, { ms: fxMs, figures: people.filter(q => !q.remembered).map(q => ({ id: q.id, x: q.x, z: q.z, face: q.face, lie: q.frame === 'hurt' || !!q.lie, kneel: /kneel|aid/.test(q.frame ?? '') })), tintOf: tintAt });
      const ds = decals.update(rl?.lying ?? [], tintAt);
      stats.lying = rl ? { items: ds.items, pixels: ds.pixels } : null;
      vignettes.update(vigItems, tintAt, vigRed);
      // 9. the fog; 10. what stands between the camera and you
      fogFrame(state, you, dtS, light, fogLift);
      seeFrame(you, dtS);
      wipeFrame(dtS);
    }
    // 11. the people (an empty update off the stage, so nothing old stays drawn). Behind a cut, only those
    // whose frames are up: the player's own is on its way from the worker
    figures.update(info.cut ? people.filter(p => p.lie || figures.ready(p.key, bandOf(p))) : people);
    for (const p of people) if (!p.lie && !figures.ready(p.key, bandOf(p))) waitingSheets.add(p.key);
    drawnNow = people.map(p => ({ id: p.id, x: p.x, z: p.z, y: p.y ?? 0, lie: !!p.lie, sit: p.frame === 'sit', frame: p.lie ? (p.lie.up ? 'berthUp' : 'berth') : p.frame ?? p.gait, face: p.face, fig: p.fig ?? null,
      curtain: !!p.lie?.curtain, own: p.own, tint: p.tint, remembered: !!p.remembered, key: p.key }));
    // 12b. the splash's pass and the zoom's crop (src/render/splash.js), set before the picture
    const it = splash.set(sp, { dimK: light?.dimK ?? stage.mood.dimK });
    stats.splash = sp ? { phase: sp.phase, form: sp.form, k: sp.k, inkK: sp.inkK ?? null, zoom: it.zoom, iris: it.iris ? it.iris.R : null, ring: it.ring ? it.ring.R : null, beat: it.beat?.kind ?? null, crop: splash.stats.crop, shownMs: sp.shownMs,
      passes: splash.stats.drawn, lift: !!fogLift, centre: sp.centre ?? null } : null;
    // 12. the upload queue
    const up = uploads ? uploads.drain() : { n: 0, bytes: 0, ms: 0 };
    // 13. the picture
    stage.setFocus(you ? { x: you.x, z: you.z, h: SEE_FIGURE_M[1], w: SEE_FIGURE_M[0] + 2 * SEE_MARGIN_PX / ppm - 0.3 } : null);
    stage.render();
    // 15. stats
    const s = stage.stats;
    Object.assign(stats, {
      calls: s.calls.total, triangles: s.triangles, programs: s.programs, cpuMs: s.cpuMs, viewMs: now() - t0,
      uploads: uploads ? { n: up.n, bytes: up.bytes } : { n: figures.stats.lastFrame.uploads, bytes: figures.stats.lastFrame.bytes },
      people: { drawn: figures.stats.drawn, lying: figures.stats.lying ?? 0, remembered: people.reduce((n, p) => n + (p.remembered ? 1 : 0), 0) }, deferred: figures.stats.deferred + figures.stats.fallback,
      lamps: { table: lighting.stats.table, slots: stage.lights.slots.filter(p => p[0].intensity > 0).length, overflow: lighting.stats.overflow, fills: lighting.stats.fills },
      res: [stage.W, stage.H], camera: { x: stage.cam.at.x, z: stage.cam.at.z }, gpu: s.passes, frames: stats.frames + 1,
      you: you ? { x: you.x, z: you.z, stride: you.stride, gait: you.gait } : null, light,
    });
  }
  // (a figure's band: its frame's, or its gait's (a stroll and the stairs are the move band's))
  const bandOf = (p) => BAND_OF[p.frame ?? (p.gait === 'stroll' || p.gait?.startsWith('stairs') ? `${p.gait}0` : p.gait)] ?? 'gait';

  /** Every actor's figure painted and sent behind a cut (the paint worker: the player's first, priority 'own'): resolves once they are up. */
  function prepareOwn(state) {
    lastState = state;
    const meId = playerActor(state)?.id ?? null, jobs = [], twins = [];
    for (const a of state.actors?.list ?? []) {
      const fig = figureOf(state, a), person = state.people?.[a.who] ?? null, own = a.id === meId;
      // (a rifle in hand: its look and the magazine-out one, with the arms and rifle bands, so a change of
      // posture or a magazine out in stop motion never paints on the main thread)
      const arms = armsOf(state, a, lookWith(fig.look, fig, person?.sex), state.clock.ms, false);
      if (arms.gl) {
        // (0.0.7: the seated band too, sitting with the R-7 at 200 m, so a figure never stands while it paints)
        const rifleBands = ['gait', 'arms', 'seated', ...RIFLE_BANDS, ...(own ? ['move'] : [])];
        // (the look as held first, everyone's, then the twins: rifle sheets are taken while free (8 at 16 px/m), so the
        // relay's figures in sight have theirs and a twin waits for a sheet another look leaves)
        for (const magOut of arms.gl.mag === false ? [true, false] : [false, true]) {
          const L = armedLook(lookWith(fig.look, fig, person?.sex), { weapon: 'rifle', carry: gaitCarry.get(a.id), magOut, ears: !!arms.kit?.ears, carrier: !!arms.kit?.carrier, headset: false });
          const { key: k2 } = lookOf(L, `${a.who}${magOut ? ':magout' : ''}`);
          (magOut === (arms.gl.mag === false) ? jobs : twins).push(() => figures.prepare(k2, L, { bands: rifleBands, own }));
        }
        if (own) ownLook = { state, want: arms.look, shown: arms.look, asked: false };
        continue;
      }
      if (arms.look !== lookWith(fig.look, fig, person?.sex)) { const { key: k3 } = lookOf(arms.look, a.who); jobs.push(figures.prepare(k3, arms.look, { bands: ['gait'], own })); continue; }
      const { look, key } = lookOf(fig.look, a.who);
      if (fig.posture === 'lie' && fig.frame !== 'sitUp' && fig.frame !== 'lieDown') { if (a.id === meId) jobs.push(figures.prepare(key, look ?? {}, { bands: ['gait', 'rest'], own: true })); continue; }   // (a sleeper is a berth; yours may rise)
      // (yours with the move band too: a stroll or a stair never paints on the main thread)
      const bands = [...(fig.posture === 'sit' || fig.posture === 'lie' ? ['gait', 'rest'] : ['gait']), ...(a.id === meId ? ['move'] : [])];
      jobs.push(figures.prepare(key, look ?? {}, { bands, own: a.id === meId }));
    }
    return Promise.all([...jobs, ...twins].map(j => (typeof j === 'function' ? j() : j)));
  }

  /** Compile the stage's programs (warm.js): once, at boot. */
  function warm() {
    warming ??= warmUp(stage, { figures, extra: [clocks.material], instanced: [vignettes.group.children[0], vignettes.group.children[1], rangeLayer.pixels.mesh, decals.pixels.mesh, blood.pixels.mesh, blood.marks.mesh] }).then((r) => { far.warm(); warmed = true; stats.warm = { programs: r.programs, compiled: r.compiled, ms: Math.round(r.ms) }; return r; },
      (e) => { warmed = true; console.warn('view: the warm-up failed', e); return null; });
    return warming;
  }

  const pendingList = () => {
    const out = [];
    if (!warmed) out.push('warm');
    if (building) out.push('area');
    if (live?.kind === 'ground' && stats.chunks.inFrame) out.push('chunks');
    if (uploads?.pending) out.push('uploads');
    for (const k of waitingSheets) out.push(`sheet:${k}`);
    if (painter && !painter.idle) out.push('worker');
    if (wipe) out.push('wipe');
    return out;
  };

  return {
    setArea, prepare, frame, warm, prepareOwn, figures, lighting, clocks, chunks, splash, vignettes, range: rangeLayer, decals, blood, far,
    /**
     * The far window's point each frame (main.js, from the ballistics role's farPointOf placed by the hud's placeFar), or
     * null: { key, x, y, z, rangeM, cx, cy, rCss (the disc in the window's CSS pixels), optic (1 | 4), hold?: [xMil, yMil],
     * tickRad? (the bearing's tick, when the placer slid the disc) }.
     */
    setFar(p) { farWant = p ?? null; },
    /** The far window as drawn: { open, alpha (0..1, the dissolve), ready (its ground built), rPict, centrePict ([x, y] picture pixels) }. */
    farState() { return far.state; },
    /** Hold a mood by name (MOODS), or null to follow places' light. */
    setMood(name) { heldMood = name && MOODS[name] ? name : null; },
    /** The fog of awareness on or off (on by default: perception's; with no perception, the samples' test fog when asked). */
    setFog(on) { fogOn = !!on; testFog = !!on && typeof PERCEPTION.sightMask !== 'function'; fogAt = null; if (!fogOn) stage.setFog(null); },
    /** The fog's last recompute: the wanted values (before easing) people's sightMask gave, { x0, z0, nx, nz, cellM, vis } (null: none). */
    get fog() { return fogWant; },
    /** The live area's name, and its build's numbers. */
    get area() { return live ? { id: live.id, name: live.name, kind: live.kind, info: live.info } : null; },
    /** The ground under a pixel of the picture (xPx, yPx from its top-left, the stage's W × H): { x, z } (the hud's mouse). */
    worldAt(xPx, yPx) { const [x, z] = stage.cam.ground(xPx, yPx, 0); return { x, z }; },
    get idle() { return pendingList().length === 0; },
    get pending() { return pendingList(); },
    stats,
    dispose() {
      endWipe();
      for (const c of cache.values()) c.built?.dispose();
      cache.clear(); live = null;
      figures.dispose(); fog?.dispose(); clocks.dispose(); chunks.dispose(); lighting.dispose(); vignettes.dispose(); splash.dispose(); rangeLayer.dispose(); decals.dispose(); blood.dispose(); far.dispose();
    },
  };
}
