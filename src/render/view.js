// OLYMPUS render: the game view. The live area on the stage, its people, the camera that follows you; a frame in order.
//
// TECH §9.11, trimmed to what exists this round (tradecraft's src/render/view.js order, rewritten around
// OLYMPUS's sim: research tradecraft-art-render.md §9). The view reads the state and never writes it.
//
// The area. setArea(area) takes a places area (src/data/places: rooms, openings, fixtures, its look) and
// makes it live. Its building is the paint worker's 'area' job (src/art/jobs.js: the cutaway of planOf(),
// the rooms' floors, the fixtures by the kit's place(), painted, packed into pages and made into vertex
// arrays off the main thread), made into meshes by src/render/batch.js areaFromJob() and sent up whole:
// main.js holds a cut while it builds (TECH §9.3, at most CUT_MAX_MS), so a whole upload is allowed
// (§9.7). Its cost, held to AREA_BUILD_MS 250 ms, is the job's own time from its dispatch (painter.js
// jobMs) and the main thread's meshes and upload; the wait for a worker still starting at boot (a URL
// launch comes straight after createPainter) is waitMs, kept apart (0.0.2 counted it, and warned of
// 263 to 402 ms on every ?play= boot for a 45 to 64 ms job). Two areas stay built (AREA_CACHE), so going back through a door costs nothing. The area's
// look names its palette (stage.setPalette, once per change).
//
// A frame (frame(alpha, state, info)), in §9.11's order, what of it exists:
//   2. the mood: setMood(name) holds one; otherwise the hour at the live site (info.lonEDeg): `day`
//      06:00 to 18:59 Melas time, `night` otherwise (my call, the build sheet's);
//   3. where everyone is between the last two ticks: from actor.$px, $pz (the sim sets them before it
//      moves anyone) to x, z by alpha, never glided across a jump of more than JUMP_M 1.5 m (tradecraft;
//      the user, 2026-11-04: "NPCs streak accross the screen when they spawn"); the stride the same way.
//      While time stands still (info.held) everyone is drawn where the sim has them (alpha taken as 1),
//      so stop motion stands still on screen: the figure on its last frame, the camera's lead settled;
//   4. the camera (VIEWS §2.4): on you, leaning where you go, LEAD_WALK_M [1.0, 2.5] walking or
//      strolling and LEAD_RUN_M [1.5, 3.5] running (east-west, north-south: the frame is shorter north
//      to south), eased over LEAD_S 0.35 s; then per axis, an area that fits the frame with FIT_SPARE_M
//      1 m to spare on each side holds the camera on its middle, and a larger one is followed, clamped so
//      the frame stays within the area's bounds plus CLAMP_PAD_M 2 m. The area's bounds on screen
//      include its north wall standing above its line (WALL_H_M up, OUTER_T_M thick). The lead is
//      snapped to the pixel grid before it is added, and stage.look() snaps the result, so a settled
//      lead holds the figure on one screen pixel;
//   5. the main thread's share of the paint jobs if there is no worker (painter.step());
//   8. sprite tints: stage.lightAt(x, z) where each stands (until places/light.js lightLevel is real);
//   9. the fog hook: setFog(true) puts the samples' test fog round you (near 2.5 m, a cone of 0.8 rad
//      ahead to 14 m), off by default (perception's real fog is 0.0.4);
//  11. the people: state.actors.list drawn from state.people[actor.who].look (a wear() spec), face and
//      gait (run frames for 'run', walk frames for 'walk' and 'stroll', by the metres walked), one
//      instanced draw (src/render/figures.js), yours never deferred; the stage sees through to you;
//  12. the upload queue drained (src/render/uploads.js: 1 MB and 2 ms a frame, yours first);
//  13. stage.render(); 15. stats.
//
// idle and pending say what still waits (the area's build, uploads, a sheet, the worker, the warm-up),
// so main.js sets window.__ready only once nothing does. stats: the last frame's draw calls, triangles,
// programs linked, CPU ms (the stage's and the whole view's), uploads, people drawn and put off, the
// density and the picture, the camera, where the player's figure was drawn (you: x, z, stride, gait),
// the GPU by pass where there is a timer.
import { createFigures } from './figures.js';
import { areaFromJob, reserveParts } from './batch.js';
import { createFogMask } from './fog.js';
import { MOODS } from './moods.js';
import { LEAD_S } from './camera.js';
import { PX_PER_M } from './scale.js';
import { warmUp } from './warm.js';
import { WALL_H_M, OUTER_T_M } from './walls.js';
import { PALETTES } from '../art/palette.js';
import { runJob } from '../art/jobs.js';
import { marsClock } from '../core/calendar.js';
import { hash01 } from '../core/hash.js';
import { playerActor } from '../core/ids.js';
import { STRIDE_WRAP_M } from '../data/body/gait.js';

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
/** Areas kept built. */
export const AREA_CACHE = 2;
/** The mood by the hour when none is held: day from 06:00, night from 19:00, Melas time (my call). */
export const DAY_FROM_H = 6, NIGHT_FROM_H = 19;
/** The test fog's shape: near (m), cone half-angle (rad), reach (m); the samples' look/main.js. */
export const TEST_FOG = Object.freeze({ nearM: 2.5, cone: 0.8, reachM: 14 });
const FACE = { right: [1, 0], left: [-1, 0], down: [0, 1], up: [0, -1] };
const GAIT = { run: 'run', walk: 'walk', stroll: 'walk', bound: 'bound', idle: 'idle' };
const now = () => performance.now();

/** The mood by the hour at a longitude (no mood held). */
export function moodAt(ms, lonEDeg = 0) {
  const h = marsClock(ms, lonEDeg).hour;
  return h >= DAY_FROM_H && h < NIGHT_FROM_H ? 'day' : 'night';
}

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
 * The view: { setArea(area) → Promise<{ buildMs, boxes, drawCalls }>, frame(alpha, state, info), warm(),
 * idle, pending, stats, setMood(name | null), setFog(on), figures, dispose() }. opts: stage, prop
 * ('chibi' | 'soldier'), painter (src/render/painter.js; none: the jobs run here, whole), uploads.
 */
export function createView({ stage, prop = 'chibi', painter = null, uploads = null, ppm = PX_PER_M } = {}) {
  const figures = createFigures({ renderer: stage.renderer, prop, ppm, painter, uploads });
  stage.scene.add(figures.group);
  const cache = new Map();                                           // area id → { id, built, info, bounds, palette }
  let live = null, chain = Promise.resolve(), building = 0, warmed = false, warming = null;
  let heldMood = null, shownMood = null, palette = null, fogOn = false, fog = null, fogAt = null;
  const lead = [0, 0];
  let lastT = null, snapNext = true;
  const looks = new Map();                                           // person id → { look, key }
  const waitingSheets = new Set();
  const stats = {
    calls: 0, triangles: 0, programs: 0, cpuMs: 0, viewMs: 0, uploads: { n: 0, bytes: 0 }, people: 0, deferred: 0, ppm,
    res: [stage.W, stage.H], camera: { x: 0, z: 0 }, gpu: null, mood: null, area: null, build: null, frames: 0, you: null,
  };

  // ---------- the area ----------
  function boundsOf(area) {
    const b = area.boundsM ?? { x0: 0, z0: 0, x1: 0, z1: 0 };
    return { x0: b.x0 - OUTER_T_M, x1: b.x1 + OUTER_T_M, z0: b.z0 - OUTER_T_M - WALL_H_M, z1: b.z1 + OUTER_T_M };
  }
  async function build(area) {
    const t0 = now(), partBase = reserveParts();
    const args = { area, ppm, partBase };
    const result = painter ? await painter.run('area', args, { priority: 'area' }) : runJob('area', args);
    const t1 = now();
    const built = areaFromJob(result, { name: area.id });
    built.upload(stage.renderer);                                    // (whole: behind the cut, TECH §9.7)
    built.atlas.release();
    // (the build's cost is the job's own time from its dispatch and the meshes made and sent here; the
    // time it waited for a worker still loading at boot is kept apart, waitMs, and not held to the budget)
    const jobMs = result.jobMs ?? t1 - t0, mainMs = now() - t1;
    const info = {
      buildMs: jobMs + mainMs, jobMs, mainMs, waitMs: result.waitMs ?? 0, wallMs: now() - t0, paintMs: result.meta.ms.paint, boxes: result.meta.stats.boxes, drawCalls: result.meta.stats.drawCalls,
      atlasKB: Math.round(result.meta.stats.atlasBytes / 1024), quads: result.meta.stats.quads, fixtures: result.meta.fixtures, parts: result.meta.parts,
      where: painter ? painter.mode : 'main',
    };
    if (info.buildMs > AREA_BUILD_MS) console.warn(`view: area '${area.id}' took ${info.buildMs.toFixed(0)} ms to build (budget ${AREA_BUILD_MS} ms; ${info.waitMs.toFixed(0)} ms more waiting for a worker)`);
    return { id: area.id, built, info, bounds: boundsOf(area), palette: area.look?.palette ?? null, name: area.name ?? area.id };
  }
  function show(c) {
    live = c;
    stage.setArea(c.built);
    if (c.palette && c.palette !== palette && PALETTES[c.palette]) { stage.setPalette(c.palette); palette = c.palette; }
    snapNext = true;
    stats.area = c.id; stats.build = c.info;
  }
  /** Make a places area live: built (or from the cache) and on the stage. Resolves with its build's numbers. */
  function setArea(area) {
    const run = async () => {
      if (live?.id === area.id) return live.info;
      let c = cache.get(area.id);
      if (!c) {
        building++;
        try { c = await build(area); } finally { building--; }
        cache.set(area.id, c);
        // (the oldest beyond AREA_CACHE that is not live goes)
        for (const [id, old] of cache) if (cache.size > AREA_CACHE && old !== live && id !== area.id) { old.built.dispose(); cache.delete(id); }
      } else {
        cache.delete(area.id); cache.set(area.id, c);                // (most recent last)
      }
      show(c);
      return c.info;
    };
    chain = chain.then(run, run);
    return chain;
  }

  // ---------- the people ----------
  function lookOf(state, who) {
    const look = state.people?.[who]?.look ?? null;
    let e = looks.get(who);
    if (!e || e.look !== look) { e = { look, key: `look:${JSON.stringify(look ?? {})}` }; looks.set(who, e); }
    return e;
  }

  // ---------- the test fog ----------
  function fogFrame(you, dtS) {
    if (!fogOn || !you) { stage.setFog(null); return; }
    fog ??= createFogMask();
    const moved = !fogAt || Math.hypot(you.x - fogAt.x, you.z - fogAt.z) >= 0.25 || you.face !== fogAt.face;
    if (moved) {
      fogAt = { x: you.x, z: you.z, face: you.face };
      const [fx, fz] = FACE[you.face] ?? FACE.down, sh = TEST_FOG;
      fog.place(you.x - 24, you.z - 32);
      fog.fill((x, z) => {
        const dx = x - you.x, dz = z - you.z, d = Math.hypot(dx, dz);
        const ahead = d > 0 && Math.acos(Math.max(-1, Math.min(1, (dx * fx + dz * fz) / d))) < sh.cone;
        return [d < sh.nearM || (d < sh.reachM && ahead) ? 1 : 0, 0];
      });
    }
    fog.ease(dtS || Infinity);
    const [tex, x0, z0, w, h] = fog.upload();
    stage.setFog(tex, x0, z0, w, h, stage.mood.dimK);
  }

  // ---------- a frame ----------
  /** Draw the state between its last two ticks. info: { lonEDeg (the live site's longitude), cut (an area's cut is held), paused, held }. */
  function frame(alpha, state, info = {}) {
    const t0 = now();
    const dtS = lastT === null ? 0 : Math.min(0.1, (t0 - lastT) / 1000);
    lastT = t0;
    painter?.step();                                                 // (5: the main thread's share, when there is no worker)
    let you = null;
    const people = [];
    waitingSheets.clear();
    if (state && live) {
      // 2. the mood
      const want = heldMood ?? moodAt(state.clock.ms, info.lonEDeg ?? 0);
      if (want !== shownMood && MOODS[want]) { stage.setMood(MOODS[want]); shownMood = want; stats.mood = want; }
      // 3. where everyone is between the ticks; while time stands still, where the sim has them (the
      // loop still runs held ticks, so alpha keeps cycling, and $px is a step behind: drawn between
      // them, the figure, its stride and the camera sawtoothed by a step at 20 Hz)
      const k = info.held ? 1 : alpha;
      const meId = playerActor(state)?.id ?? null, tS = state.clock.ms / 1000 + k * 0.05;
      for (const a of state.actors?.list ?? []) {
        const px = a.$px ?? a.x, pz = a.$pz ?? a.z, step = Math.hypot(a.x - px, a.z - pz), jump = step > JUMP_M;
        const x = jump ? a.x : px + (a.x - px) * k, z = jump ? a.z : pz + (a.z - pz) * k;
        let stride = (a.strideM ?? 0) - (jump ? 0 : (1 - k) * step);
        if (stride < 0) stride += STRIDE_WRAP_M;
        const { look, key } = lookOf(state, a.who), own = a.id === meId;
        const p = { key, look: look ?? {}, x, z, face: a.face ?? 'down', gait: GAIT[a.gait] ?? 'idle', stride, tS, phase: hash01('phase', a.id) * 2, own, id: a.id, dx: a.x - px, dz: a.z - pz };
        people.push(p);
        if (own) you = p;
      }
      // 4. the camera
      const cw = stage.W / ppm, ch = stage.H / ppm, b = live.bounds;
      if (you) {
        const n = Math.hypot(you.dx, you.dz), L = you.gait === 'run' ? LEAD_RUN_M : LEAD_WALK_M;
        const want0 = you.gait !== 'idle' && n > 1e-6 ? [you.dx / n * L[0], you.dz / n * L[1]] : [0, 0];
        if (snapNext) { lead[0] = want0[0]; lead[1] = want0[1]; }
        else { const k = 1 - Math.exp(-dtS / LEAD_S); lead[0] += (want0[0] - lead[0]) * k; lead[1] += (want0[1] - lead[1]) * k; }
        // (the lead snapped to the pixel grid before it is added: the camera and the figure, each snapped,
        // then keep one offset, where an eased lead between pixels flipped the figure a pixel each frame)
        const lx = Math.round(lead[0] * ppm) / ppm, lz = Math.round(lead[1] * ppm) / ppm;
        const ax = cameraAxis(you.x, lx, b.x0, b.x1, cw), az = cameraAxis(you.z, lz, b.z0, b.z1, ch);
        stage.look(ax.c, az.c);
        snapNext = false;
      }
      // 8. tints where each stands
      for (const p of people) p.tint = stage.lightAt(p.x, p.z);
      // 9. the fog hook
      fogFrame(you, dtS);
    }
    // 11. the people (an empty update off the stage, so nothing old stays drawn). Behind a cut, only those
    // whose frames are up: the player's own is on its way from the worker, and painting it here as well
    // would cost the main thread the very work the cut is waiting for
    figures.update(info.cut ? people.filter(p => figures.ready(p.key, 'gait')) : people);
    for (const p of people) if (!figures.ready(p.key, 'gait')) waitingSheets.add(p.key);
    // 12. the upload queue
    const up = uploads ? uploads.drain() : { n: 0, bytes: 0, ms: 0 };
    // 13. the picture
    stage.setFocus(you ? { x: you.x, z: you.z, h: 1.8, w: 0.8 } : null);
    stage.render();
    // 15. stats
    const s = stage.stats;
    Object.assign(stats, {
      calls: s.calls.total, triangles: s.triangles, programs: s.programs, cpuMs: s.cpuMs, viewMs: now() - t0,
      uploads: uploads ? { n: up.n, bytes: up.bytes } : { n: figures.stats.lastFrame.uploads, bytes: figures.stats.lastFrame.bytes }, people: figures.stats.drawn, deferred: figures.stats.deferred + figures.stats.fallback,
      res: [stage.W, stage.H], camera: { x: stage.cam.at.x, z: stage.cam.at.z }, gpu: s.passes, frames: stats.frames + 1,
      you: you ? { x: you.x, z: you.z, stride: you.stride, gait: you.gait } : null,
    });
  }

  /** The player's figure painted and sent behind a cut (the paint worker, priority 'own'): resolves once it is up. */
  function prepareOwn(state) {
    const a = playerActor(state);
    if (!a) return Promise.resolve(null);
    const { look, key } = lookOf(state, a.who);
    return figures.prepare(key, look ?? {}, { bands: ['gait'], own: true });
  }

  /** Compile the stage's programs (warm.js): once, at boot. */
  function warm() {
    warming ??= warmUp(stage, { figures }).then((r) => { warmed = true; stats.warm = { programs: r.programs, compiled: r.compiled, ms: Math.round(r.ms) }; return r; },
      (e) => { warmed = true; console.warn('view: the warm-up failed', e); return null; });
    return warming;
  }

  const pendingList = () => {
    const out = [];
    if (!warmed) out.push('warm');
    if (building) out.push('area');
    if (uploads?.pending) out.push('uploads');
    for (const k of waitingSheets) out.push(`sheet:${k}`);
    if (painter && !painter.idle) out.push('worker');
    return out;
  };

  return {
    setArea, frame, warm, prepareOwn, figures,
    /** Hold a mood by name (MOODS), or null to follow the hour. */
    setMood(name) { heldMood = name && MOODS[name] ? name : null; },
    /** The test fog round you, on or off. */
    setFog(on) { fogOn = !!on; fogAt = null; if (!fogOn) stage.setFog(null); },
    /** The live area's name, and its build's numbers. */
    get area() { return live ? { id: live.id, name: live.name, info: live.info } : null; },
    get idle() { return pendingList().length === 0; },
    get pending() { return pendingList(); },
    stats,
    dispose() {
      for (const c of cache.values()) c.built.dispose();
      cache.clear(); live = null;
      figures.dispose(); fog?.dispose();
    },
  };
}
