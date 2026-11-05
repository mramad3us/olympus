// OLYMPUS bots: the toolkit bots are built from (TECH §13.2), so a bot is a plan of primitives, not ad hoc code.
//
// A bot is (state, me, mem) → input for one tick, pure: it reads the state and presses only what a
// player can press (moves by ZQSD, Shift, Alt, actions, digits), never writing the state. Its memory
// is plain data on its actor (me.bot, which tests/game.mjs hands it as mem), so it saves and loads
// with the game and a run carries on the same across a load (tradecraft tests/bots.mjs's rule).
//
// A primitive is { name, start(state, me) → memory, step(state, me, m) → { input } | { done } |
// { fail } }: start makes its memory (plain data), step plays one tick. plan([…]) runs primitives in
// sequence, keeping in mem.plan which one is running and its memory; a failure ends the plan with
// the primitive's reason, which runBot returns with the tick it came at, so a content change that
// breaks a bot says where.
//   goTo(target, { cls })   target { x, z } or a spot id ('f:t1:rack:01#1'). Asks places/nav.js for
//                           a path on the live area's grid from where it stands (a pure query: the
//                           grid is the state's runtime cache), then presses toward each point in
//                           turn. 8 keys make 8 directions, so to follow a leg at any angle it
//                           chooses, of the two key directions either side of the leg, the one that
//                           keeps it nearer the leg's line (a Bresenham walk, so its track stays within
//                           a step of the pulled path). Arrived within ARRIVE_M of the target, or of
//                           the path's end where the target's own cell is not free; with no progress
//                           for REPLAN_S it asks again from where it stands; after BOT_STUCK_S 10 s
//                           without progress it fails 'stuck' (or with the path's reason: 'blocked',
//                           'cap', 'locked'). The waypoint action (state.player.waypoint, as the mouse
//                           sets it) comes with 0.0.4; until then this is the toolkit's only walk.
//   waitUntil(pred, ms)     no input until pred(state), or fails 'timeout'.
//   plan([…])               the primitives in sequence (a bot).
//   pressToward(me, p, o)   the keys toward p, tracking the line from o when given.
//   runBot(game, bot, { maxTicks }) → { ticks, done, reason, log } on tests/game.mjs's createGame.
import { navOf, path } from '../../src/sim/places/nav.js';
import { PLAYER_CLS, WALK_MS } from '../../src/sim/places/move.js';
import { areaOf } from '../../src/sim/places/model.js';
import { spotsOfArea } from '../../src/sim/places/fixtures.js';
import { TICK_MS } from '../../src/core/clock.js';

/** A primitive with no progress this long fails (TECH §13.2). */
export const BOT_STUCK_S = 10;
/** Arrived within this of the target (metres). */
export const ARRIVE_M = 0.2;
/** A corner of the path is passed within this (metres). */
export const NEXT_M = 0.12;
/** No progress this long: ask for the path again from here (seconds). */
export const REPLAN_S = 2;
/** Progress is getting this much nearer the end (metres). */
const PROGRESS_M = 0.05;
const TICKS_S = 1000 / TICK_MS;

const D8 = Object.freeze([[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]].map(([x, z]) => { const n = Math.sqrt(x * x + z * z); return Object.freeze({ mx: x, mz: z, ux: x / n, uz: z / n }); }));
const dist = (ax, az, bx, bz) => Math.sqrt((ax - bx) * (ax - bx) + (az - bz) * (az - bz));

/**
 * The keys toward point p from where me stands: { mx, mz }. With an origin o, of the two key
 * directions either side of the line o → p, the one that leaves me nearer that line after a step.
 */
export function pressToward(me, p, o = null, stepM = WALK_MS * TICK_MS / 1000) {
  const dx = p[0] - me.x, dz = p[1] - me.z, d = Math.sqrt(dx * dx + dz * dz);
  if (d < 1e-6) return { mx: 0, mz: 0 };
  // (the line's direction: from the origin, unless it has drifted off the line by half a metre)
  let ox = me.x, oz = me.z, ux = dx / d, uz = dz / d;
  if (o) {
    const lx = p[0] - o[0], lz = p[1] - o[1], L = Math.sqrt(lx * lx + lz * lz);
    if (L > 1e-6) {
      const cross = Math.abs((me.x - o[0]) * (lz / L) - (me.z - o[1]) * (lx / L));
      if (cross < 0.5) { ox = o[0]; oz = o[1]; ux = lx / L; uz = lz / L; }
    }
  }
  const ranked = D8.map((c, i) => ({ c, i, dot: c.ux * ux + c.uz * uz })).sort((a, b) => b.dot - a.dot || a.i - b.i);
  const [a, b] = ranked;
  const err = (c) => Math.abs((me.x + c.ux * stepM - ox) * uz - (me.z + c.uz * stepM - oz) * ux);
  if (a.dot > 0.99999) return { mx: a.c.mx, mz: a.c.mz };
  const pick = err(a.c) <= err(b.c) ? a.c : b.c;
  return { mx: pick.mx, mz: pick.mz };
}

// (a target as a point: { x, z }, [x, z], or a spot id of the live area)
function resolve(state, target) {
  if (Array.isArray(target)) return { x: target[0], z: target[1], id: null };
  if (typeof target === 'string') {
    const area = areaOf(state.places?.live?.area), s = area && spotsOfArea(area).find(sp => sp.id === target);
    return s ? { x: s.x, z: s.z, id: s.id } : null;
  }
  return target ? { x: target.x, z: target.z, id: target.id ?? null } : null;
}
// (a path from where me stands, into the primitive's memory)
function plot(state, me, m) {
  const grid = navOf(state, state.places.live.area, m.cls);
  const r = path(grid, [me.x, me.z], [m.tx, m.tz]);
  m.plans++;
  if (r.fail) { m.fail = r.fail; return; }
  m.pts = r.pts; m.k = 1; m.ox = me.x; m.oz = me.z; m.end = r.pts[r.pts.length - 1]; m.best = Math.min(m.best, r.lengthM);
  if (m.lengthM === null) m.lengthM = r.lengthM;
  m.expanded += r.expanded;
}

/** Walk to a point or a spot on the live area (see the header). */
export function goTo(target, { cls = PLAYER_CLS, arriveM = ARRIVE_M } = {}) {
  return {
    name: `goTo ${typeof target === 'string' ? target : JSON.stringify(target)}`,
    start(state, me) {
      const t = resolve(state, target);
      const m = { cls, tx: t?.x ?? null, tz: t?.z ?? null, pts: null, k: 1, ox: me.x, oz: me.z, end: null, lengthM: null, plans: 0, expanded: 0, ticks: 0, best: Infinity, bestTick: 0, fail: t ? null : 'no-target' };
      if (t) plot(state, me, m);
      return m;
    },
    step(state, me, m) {
      if (m.fail) return { fail: m.fail };
      m.ticks++;
      const de = dist(me.x, me.z, m.end[0], m.end[1]);
      if (de <= arriveM) return { done: true };
      // (progress is the way left along the path, not the straight distance: a way out through a door first leads away)
      let left = dist(me.x, me.z, m.pts[m.k][0], m.pts[m.k][1]);
      for (let i = m.k; i + 1 < m.pts.length; i++) left += dist(m.pts[i][0], m.pts[i][1], m.pts[i + 1][0], m.pts[i + 1][1]);
      if (left < m.best - PROGRESS_M) { m.best = left; m.bestTick = m.ticks; }
      const still = m.ticks - m.bestTick;
      if (still > BOT_STUCK_S * TICKS_S) return { fail: 'stuck' };
      if (still > 0 && still % (REPLAN_S * TICKS_S) === 0) { plot(state, me, m); if (m.fail) return { fail: m.fail }; }
      while (m.k < m.pts.length - 1 && dist(me.x, me.z, m.pts[m.k][0], m.pts[m.k][1]) <= NEXT_M) { m.ox = m.pts[m.k][0]; m.oz = m.pts[m.k][1]; m.k++; }
      return { input: pressToward(me, m.pts[m.k], [m.ox, m.oz]) };
    },
  };
}

/** Wait, pressing nothing, until pred(state) or timeoutMs of game time. */
export function waitUntil(pred, timeoutMs) {
  return {
    name: 'waitUntil',
    start(state) { return { untilMs: state.clock.ms + timeoutMs }; },
    step(state, me, m) {
      if (pred(state)) return { done: true };
      if (state.clock.ms >= m.untilMs) return { fail: 'timeout' };
      return { input: {} };
    },
  };
}

/** A bot that runs primitives in sequence; its progress and the end's reason live in mem.plan. */
export function plan(steps) {
  return (state, me, mem) => {
    const P = (mem.plan ??= { k: 0, m: null, status: 'running', why: null, log: [] });
    while (P.status === 'running' && P.k < steps.length) {
      const prim = steps[P.k];
      if (!P.m) P.m = prim.start(state, me) ?? {};
      const r = prim.step(state, me, P.m);
      if (r.input) return r.input;
      if (r.fail) { P.status = 'failed'; P.why = `${prim.name}: ${r.fail}`; P.log.push({ k: P.k, name: prim.name, fail: r.fail, at: state.clock.tick }); return {}; }
      P.log.push({ k: P.k, name: prim.name, done: true, at: state.clock.tick, lengthM: P.m.lengthM ?? null, ticks: P.m.ticks ?? null, plans: P.m.plans ?? null });
      P.k++; P.m = null;
    }
    if (P.status === 'running') P.status = 'done';
    return {};
  };
}

/** Run a bot on a headless game until its plan ends or maxTicks: { ticks, done, reason, log }. */
export function runBot(game, bot, { maxTicks = 20 * 60 * 10 } = {}) {
  let ticks = 0;
  const status = () => game.me()?.bot?.plan?.status ?? 'running';
  while (ticks < maxTicks && status() === 'running') { game.step(1, bot); ticks++; }
  const P = game.me()?.bot?.plan;
  return { ticks, done: P?.status === 'done', reason: P?.status === 'done' ? null : P?.why ?? (ticks >= maxTicks ? 'maxTicks' : 'no plan'), log: P?.log ?? [] };
}
