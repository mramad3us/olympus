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
// idle and pending say what still waits (an area's build, the chunks in the picture, uploads, a sheet,
// the worker, the warm-up), so main.js sets window.__ready only once nothing does. stats: the last
// frame's draw calls, triangles, programs, CPU ms, uploads, people drawn and put off (people: { drawn,
// lying, remembered: drawn as last seen }), the clocks' faces as drawn, the lamps (table: pools in the table, slots: dynamic ones in use),
// the chunks ({ built, building, popped, mainMs }), the area ({ id, buildMs, cutMs }), the see-through
// and the fog, the camera and where your figure was drawn, the GPU by pass where there is a timer.
import * as FIGURE from '../sim/people/figure.js';
import * as PERCEPTION from '../sim/people/perception.js';
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
import { RACK_DECKS, BERTH_TOP_M, rackBlanket } from '../art/kit/quarters.js';
import { hash01 } from '../core/hash.js';
import { playerActor } from '../core/ids.js';
import { STRIDE_WRAP_M } from '../data/body/gait.js';
import { planOf } from '../sim/places/plan.js';

/** People are put where they are, not glided, across a jump longer than this in a tick (metres). */
export const JUMP_M = 1.5;
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
const GAIT = { run: 'run', walk: 'walk', stroll: 'walk', bound: 'bound', idle: 'idle' };
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
  for (const f of area.fixtures ?? []) {
    const fp = FOOTPRINTS[f.kind];
    if (!fp || fp.h < 0.5) continue;
    const side = f.face === 'left' || f.face === 'right', w = (side ? fp.d : fp.w) / 2, d = (side ? fp.w : fp.d) / 2;
    out.push({ x0: f.x - w, x1: f.x + w, z0: f.z - d, z1: f.z + d, h: (f.y ?? 0) + fp.h });
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
  stage.scene.add(figures.group, clocks.group);
  const cache = new Map();                                           // area id → { id, kind, area, built, info, bounds, palette, name, occluders, racks }
  let live = null, chain = Promise.resolve(), building = 0, warmed = false, warming = null;
  let heldMood = null, palette = null, fogOn = true, testFog = false, fog = null, fogAt = null, fogWant = null;
  let lastState = null, wipe = null, seeK = 0, liftK = 0, liftRect = null, propsSig = '', tallS = 0, wideK = 0;
  const lead = [0, 0];
  let lastT = null, snapNext = true;
  const looks = new Map();                                           // person id → { look, key }
  const memory = createMemory();                                     // (each actor as last drawn in sight)
  const waitingSheets = new Set();
  const stats = {
    calls: 0, triangles: 0, programs: 0, cpuMs: 0, viewMs: 0, uploads: { n: 0, bytes: 0 }, people: { drawn: 0, lying: 0 }, deferred: 0, ppm,
    res: [stage.W, stage.H], camera: { x: 0, z: 0 }, gpu: null, mood: null, area: null, build: null, frames: 0, you: null,
    clocks: [], lamps: { table: 0, slots: 0 }, chunks: { built: 0, building: 0, popped: 0, mainMs: 0 }, see: { k: 0, lift: 0 }, fog: { recomputes: 0, ms: 0, source: null },
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
    const entry = { id: area.id, kind: area.kind === 'ground' ? 'ground' : 'floor', area, built: null, info: null, bounds: boundsOf(area), palette: area.look?.palette ?? null, name: area.name ?? area.id, occluders: occludersOf(area), racks: racksOf(area) };
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
  function lookOf(look, who) {
    let e = looks.get(who);
    if (!e || e.look !== look) { e = { look, key: `look:${JSON.stringify(look ?? {})}` }; looks.set(who, e); }
    return e;
  }
  // (how an actor is drawn: people's figureOf, else 0.0.2's look and the actor's own fields)
  function figureOf(state, a) {
    if (typeof FIGURE.figureOf === 'function') { const f = FIGURE.figureOf(state, a); if (f) return f; }
    return { look: state.people?.[a.who]?.look ?? null, posture: a.posture ?? 'stand', y: a.y ?? 0, face: a.face ?? 'down', head: a.head ?? null, curtain: !!a.curtain, gait: a.gait, strideM: a.strideM ?? 0 };
  }
  // (a sleeper's berth: its rack, its deck by the seat's number, the blanket the rack's maker gave it)
  function berthOf(a, fig, person) {
    const seat = a.spotId ?? null, [fid, n] = seat ? seat.split('#') : [null, null], rack = fid ? live.racks.get(fid) : null;
    const decks = rack ? RACK_DECKS[rack.kind] : null, deck = decks ? decks[Math.max(0, Math.min(decks.length - 1, Number(n) - 2))] : null;
    const head = fig.head ?? HEAD_OF_FACE[fig.face] ?? 'n', look = fig.look ?? {};
    return {
      x: rack ? rack.x : a.x, z: rack ? rack.z : a.z,
      lie: { y: deck !== null ? deck + BERTH_TOP_M + 0.005 : (fig.y ?? 0) + 0.12, head, blanket: rack ? rackBlanket(rack) : 'olive', skin: look.skin ?? 'tan', hair: look.hair ?? { style: 'crew', color: 'dark' },
        curtain: fig.curtain ? (rack?.look?.curtain ?? 'olive') : null, seed: Math.floor(hash01('berth', a.who ?? a.id) * 1000), who: person ?? a.who },
    };
  }

  // ---------- the fog of awareness ----------
  function fogFrame(state, you, dtS, light) {
    if (!fogOn || !you || !state) { stage.setFog(null); return; }
    fog ??= createFogMask({ nx: FOG_CELLS[0], nz: FOG_CELLS[1] });
    const me = playerActor(state), real = !testFog && typeof PERCEPTION.sightMask === 'function' && typeof PERCEPTION.eyeOf === 'function';
    if (!real && !testFog) { stage.setFog(null); return; }
    const eye = real ? PERCEPTION.eyeOf(state, me) : { x: you.x, z: you.z, headRad: Math.atan2(...(FACE[you.face] ?? FACE.down).slice().reverse()) };
    const sec = Math.floor(state.clock.ms / 1000);
    const turned = fogAt && Math.abs((((eye.headRad ?? 0) - fogAt.head) * 180 / Math.PI + 540) % 360 - 180) >= FOG_TURN_DEG;
    // (a new area, or the first fog: shown as it is at once, never the old area's shape eased out over the new: v0.0.3's review)
    const snap = !fogAt || live.id !== fogAt.area;
    if (snap || Math.hypot(eye.x - fogAt.x, eye.z - fogAt.z) >= FOG_MOVE_M || turned || sec !== fogAt.sec || propsSig !== fogAt.props) {
      const t0 = now(), cam = stage.cam.at;
      fog.place(cam.x - FOG_CELLS[0] * FOG_CELL_M / 2, cam.z - FOG_CELLS[1] * FOG_CELL_M / 2);
      const [x0, z0] = fog.box;
      if (real) {
        const mask = { x0, z0, nx: FOG_CELLS[0], nz: FOG_CELLS[1], cellM: FOG_CELL_M, vis: new Float32Array(FOG_CELLS[0] * FOG_CELLS[1]) };
        PERCEPTION.sightMask(state, eye, mask);
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
      fogAt = { x: eye.x, z: eye.z, head: eye.headRad ?? 0, sec, props: propsSig, area: live.id };
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
    SHARED.uSeeK.value = seeK;
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

  // ---------- the stair's wipe ----------
  function wipeFrame(dtS) {
    if (!wipe) return;
    wipe.t += dtS || 0;
    const k = Math.min(1, wipe.t / STAIR_DISSOLVE_S), r = k * wipe.R;
    for (const m of wipe.from.built?.mats ?? []) m.userData.oly?.uniforms?.uWipe?.value.set(wipe.x, wipe.z, r, -1);
    for (const m of wipe.to.built?.mats ?? []) m.userData.oly?.uniforms?.uWipe?.value.set(wipe.x, wipe.z, r, 1);
    if (k >= 1) endWipe();
  }

  // ---------- a frame ----------
  /** Draw the state between its last two ticks. info: { lonEDeg (the live site's longitude), cut (an area's cut is held), paused, held }. */
  function frame(alpha, state, info = {}) {
    const t0 = now();
    const dtS = lastT === null ? 0 : Math.min(0.1, (t0 - lastT) / 1000);
    lastT = t0;
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
    if (state && live) {
      const area = live.area, ms = state.clock.ms;
      // 2. the light
      light = lighting.frame(state, area, { ms, lonEDeg: info.lonEDeg ?? 0, siteId: area.site, heldMood });
      stats.mood = heldMood ?? lighting.stats.rig;
      // 3. where everyone is between the ticks, and how each is drawn
      const k = info.held ? 1 : alpha;
      const me = playerActor(state), meId = me?.id ?? null, tS = ms / 1000 + k * 0.05;
      // (the memory: forgotten with a new state, another area, or a skip)
      memory.begin(state, live.id);
      const eye = me && typeof PERCEPTION.eyeOf === 'function' && typeof PERCEPTION.visibility === 'function' ? PERCEPTION.eyeOf(state, me) : null;
      const inSight = (x, z) => PERCEPTION.visibility(state, eye, x, z, ms) > 0;
      for (const a of state.actors?.list ?? []) {
        const was = a.id !== meId && eye ? memory.recall(a.id, a.x, a.z, inSight) : null;
        if (was) { people.push({ ...was, tS, dx: 0, dz: 0, remembered: true }); continue; }
        const px = a.$px ?? a.x, pz = a.$pz ?? a.z, step = Math.hypot(a.x - px, a.z - pz), jump = step > JUMP_M;
        const x = jump ? a.x : px + (a.x - px) * k, z = jump ? a.z : pz + (a.z - pz) * k;
        const fig = figureOf(state, a), own = a.id === meId;
        let stride = (fig.strideM ?? a.strideM ?? 0) - (jump ? 0 : (1 - k) * step);
        if (stride < 0) stride += STRIDE_WRAP_M;
        const { look, key } = lookOf(fig.look, a.who);
        const p = { key, look: look ?? {}, x, z, face: fig.face ?? a.face ?? 'down', gait: GAIT[fig.gait ?? a.gait] ?? 'idle', stride, tS, phase: hash01('phase', a.id) * 2, own, id: a.id, dx: a.x - px, dz: a.z - pz };
        if (fig.posture === 'sit') { p.frame = 'sit'; p.y = Math.max(0, (fig.y ?? 0.45) - figures.layout.body.seatM); p.seat = p.y; }
        else if (fig.posture === 'lie' && !own) Object.assign(p, berthOf(a, fig, a.who));
        people.push(p);
        if (own) you = p;
        else if (eye) memory.keep(a.id, a.x, a.z, p);
      }
      // 4. the camera
      const cw = stage.W / ppm, ch = stage.H / ppm, b = cameraBounds(live);
      if (you && !wipe) {
        const n = Math.hypot(you.dx, you.dz), L = you.gait === 'run' ? LEAD_RUN_M : LEAD_WALK_M;
        const want0 = you.gait !== 'idle' && n > 1e-6 ? [you.dx / n * L[0], you.dz / n * L[1]] : [0, 0];
        if (snapNext) { lead[0] = want0[0]; lead[1] = want0[1]; }
        else { const kk = 1 - Math.exp(-dtS / LEAD_S); lead[0] += (want0[0] - lead[0]) * kk; lead[1] += (want0[1] - lead[1]) * kk; }
        // (the lead snapped to the pixel grid before it is added: the camera and the figure, each snapped,
        // then keep one offset, where an eased lead between pixels flipped the figure a pixel each frame)
        const lx = Math.round(lead[0] * ppm) / ppm, lz = Math.round(lead[1] * ppm) / ppm;
        const ax = cameraAxis(you.x, lx, b.x0, b.x1, cw), az = cameraAxis(you.z, lz, b.z0, b.z1, ch);
        stage.look(ax.c, az.c);
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
      for (const p of people) p.tint = heldMood ? stage.lightAt(p.x, p.z) : lighting.tintAt(state, p.x, p.z, ms);
      // 9. the fog; 10. what stands between the camera and you
      fogFrame(state, you, dtS, light);
      seeFrame(you, dtS);
      wipeFrame(dtS);
    }
    // 11. the people (an empty update off the stage, so nothing old stays drawn). Behind a cut, only those
    // whose frames are up: the player's own is on its way from the worker
    figures.update(info.cut ? people.filter(p => p.lie || figures.ready(p.key, bandOf(p))) : people);
    for (const p of people) if (!p.lie && !figures.ready(p.key, bandOf(p))) waitingSheets.add(p.key);
    drawnNow = people.map(p => ({ id: p.id, x: p.x, z: p.z, lie: !!p.lie, sit: p.frame === 'sit', curtain: !!p.lie?.curtain, own: p.own, tint: p.tint, remembered: !!p.remembered }));
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
  const bandOf = (p) => (p.frame === 'sit' ? 'rest' : 'gait');

  /** Every actor's figure painted and sent behind a cut (the paint worker: the player's first, priority 'own'): resolves once they are up. */
  function prepareOwn(state) {
    lastState = state;
    const meId = playerActor(state)?.id ?? null, jobs = [];
    for (const a of state.actors?.list ?? []) {
      const fig = figureOf(state, a), { look, key } = lookOf(fig.look, a.who);
      if (fig.posture === 'lie' && a.id !== meId) continue;          // (a sleeper is a berth: nothing to paint ahead)
      const bands = fig.posture === 'sit' ? ['gait', 'rest'] : ['gait'];
      jobs.push(figures.prepare(key, look ?? {}, { bands, own: a.id === meId }));
    }
    return Promise.all(jobs);
  }

  /** Compile the stage's programs (warm.js): once, at boot. */
  function warm() {
    warming ??= warmUp(stage, { figures, extra: [clocks.material] }).then((r) => { warmed = true; stats.warm = { programs: r.programs, compiled: r.compiled, ms: Math.round(r.ms) }; return r; },
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
    setArea, prepare, frame, warm, prepareOwn, figures, lighting, clocks, chunks,
    /** Hold a mood by name (MOODS), or null to follow places' light. */
    setMood(name) { heldMood = name && MOODS[name] ? name : null; },
    /** The fog of awareness on or off (on by default: perception's; with no perception, the samples' test fog when asked). */
    setFog(on) { fogOn = !!on; testFog = !!on && typeof PERCEPTION.sightMask !== 'function'; fogAt = null; if (!fogOn) stage.setFog(null); },
    /** The fog's last recompute: the wanted values (before easing) people's sightMask gave, { x0, z0, nx, nz, cellM, vis } (null: none). */
    get fog() { return fogWant; },
    /** The live area's name, and its build's numbers. */
    get area() { return live ? { id: live.id, name: live.name, kind: live.kind, info: live.info } : null; },
    get idle() { return pendingList().length === 0; },
    get pending() { return pendingList(); },
    stats,
    dispose() {
      endWipe();
      for (const c of cache.values()) c.built?.dispose();
      cache.clear(); live = null;
      figures.dispose(); fog?.dispose(); clocks.dispose(); chunks.dispose(); lighting.dispose();
    },
  };
}
