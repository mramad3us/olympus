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
//   goTo(target, { cls, openDoors = true, area })   target { x, z } or a spot id ('f:t1:rack:01#1').
//                           Asks places/nav.js for a path on the live area's grid from where it
//                           stands (a pure query: the grid is the state's runtime cache; a ground's
//                           window round the walker), then presses toward each point in turn. 8 keys
//                           make 8 directions, so to follow a leg at any angle it chooses, of the two
//                           key directions either side of the leg, the one that keeps it nearer the
//                           leg's line (a Bresenham walk, so its track stays within a step of the
//                           pulled path). Where the way is only through closed doors (the path
//                           'blocked' on the state's grid and found on the area's all-open grid,
//                           nav.js openNavOf: the request queue's 'locked') and openDoors holds, it
//                           walks the open grid's path and presses R (act 'hand') when handOffer names
//                           one of the doors that path crosses, turning to face it first when the
//                           offer does not (the build sheet 0.0.3 §2.1). Arrived within ARRIVE_M of
//                           the target, or of the path's end where the target's own cell is not free;
//                           done at once when the live area changes from `area` (it crossed a portal);
//                           with no progress for REPLAN_S it asks again from where it stands; after
//                           BOT_STUCK_S 10 s without progress it fails 'stuck' (or with the path's
//                           reason: 'blocked', 'cap', 'locked').
//   crossTo({ area, x, z }, { cls })   the legs of places/portals.js routeAcross from where it stands,
//                           a goTo each to the portal's crossing point (done when the area changes),
//                           the last to the goal: a list of primitives to put in a plan.
//   waitUntil(pred, ms)     no input until pred(state), or fails 'timeout'.
//   plan([…], { keepGoing }) the primitives in sequence (a bot); with keepGoing a failure is logged and
//                           the next primitive starts (a tour of every spot).
//   pressToward(me, p, o)   the keys toward p, tracking the line from o when given.
//   runBot(game, bot, { maxTicks }) → { ticks, done, reason, log } on tests/game.mjs's createGame.
//   stepAct(step, tempo, target)   a stop-motion step as the hud sends it (0.0.5): { act: 'stop', args }.
//   waitStill()             a primitive: no input until stop motion stands still for a choice (or no
//                           step plays), or fails 'timeout'.
import { navOf, openNavOf, path, centreOf, CLASSES } from '../../src/sim/places/nav.js';
import { PLAYER_CLS } from '../../src/sim/places/move.js';
import { WALK_MS } from '../mars-gaits.mjs';
import { areaOf } from '../../src/sim/places/model.js';
import { spotsOfArea } from '../../src/sim/places/fixtures.js';
import { handOffer, DOOR_REACH_M } from '../../src/sim/places/hand.js';
import { routeAcross } from '../../src/sim/places/portals.js';
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
// (the closed doors an open grid's path crosses: their leaves within the class radius of its cells)
function doorsOn(grid, open, cells) {
  const out = [], r = CLASSES[grid.cls];
  for (const l of grid.leaves) {
    if (!l.closed) continue;
    const R = { x0: l.rect.x0 - r, z0: l.rect.z0 - r, x1: l.rect.x1 + r, z1: l.rect.z1 + r };
    if (cells.some(c => { const [x, z] = centreOf(open, c); return x >= R.x0 && x <= R.x1 && z >= R.z0 && z <= R.z1; })) out.push({ id: l.id, x: (l.rect.x0 + l.rect.x1) / 2, z: (l.rect.z0 + l.rect.z1) / 2 });
  }
  return out;
}
// (a path from where me stands, into the primitive's memory: through closed doors where only they stand in the way)
function plot(state, me, m) {
  const area = state.places.live.area, grid = navOf(state, area, m.cls, me.x, me.z);
  let r = path(grid, [me.x, me.z], [m.tx, m.tz]);
  m.plans++;
  if (r.fail === 'blocked' && m.openDoors) {
    const open = openNavOf(area, m.cls), o = open && path(open, [me.x, me.z], [m.tx, m.tz]);
    if (o && !o.fail) { m.expanded += r.expanded; r = o; m.doors = doorsOn(grid, open, o.cells); }
  }
  if (r.fail) { m.fail = r.fail; return; }
  m.pts = r.pts; m.k = 1; m.ox = me.x; m.oz = me.z; m.end = r.pts[r.pts.length - 1]; m.best = Math.min(m.best, r.lengthM);
  if (m.lengthM === null) m.lengthM = r.lengthM;
  m.expanded += r.expanded;
}

/** Walk to a point or a spot on the live area (see the header). */
export function goTo(target, { cls = PLAYER_CLS, arriveM = ARRIVE_M, openDoors = true, area = null } = {}) {
  return {
    name: `goTo ${typeof target === 'string' ? target : JSON.stringify(target)}`,
    start(state, me) {
      const t = resolve(state, target);
      const m = { cls, openDoors, area: area ?? state.places?.live?.area ?? null, tx: t?.x ?? null, tz: t?.z ?? null, pts: null, k: 1, ox: me.x, oz: me.z, end: null, lengthM: null, plans: 0, expanded: 0, ticks: 0, best: Infinity, bestTick: 0, doors: [], pressed: [], fail: t ? null : 'no-target' };
      if (t && state.places?.live?.area === m.area) plot(state, me, m);
      return m;
    },
    step(state, me, m) {
      if (state.places?.live?.area !== m.area) return { done: true };   // (through a portal: the next leg is another primitive's)
      if (m.fail) return { fail: m.fail };
      m.ticks++;
      const de = dist(me.x, me.z, m.end[0], m.end[1]);
      if (de <= arriveM) return { done: true };
      // (a closed door on the way: R when it is at hand, else turn to face it)
      for (const d of m.doors) {
        if (m.pressed.includes(d.id) || dist(me.x, me.z, d.x, d.z) > DOOR_REACH_M) continue;
        const off = handOffer(state);
        if (off?.target === d.id && off.verb === 'open') { m.pressed.push(d.id); return { input: { act: ['hand'] } }; }
        if (off?.target === d.id && off.verb === 'close') { m.pressed.push(d.id); continue; }
        return { input: pressToward(me, [d.x, d.z]) };
      }
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

/** A bot that runs primitives in sequence; its progress and the end's reason live in mem.plan (keepGoing: a failure is logged and the plan goes on). */
export function plan(steps, { keepGoing = false } = {}) {
  return (state, me, mem) => {
    const P = (mem.plan ??= { k: 0, m: null, status: 'running', why: null, log: [], fails: 0 });
    while (P.status === 'running' && P.k < steps.length) {
      const prim = steps[P.k];
      if (!P.m) P.m = prim.start(state, me) ?? {};
      const r = prim.step(state, me, P.m);
      if (r.input) return r.input;
      const rec = { k: P.k, name: prim.name, at: state.clock.tick, area: state.places?.live?.area ?? null, x: me.x, z: me.z, lengthM: P.m.lengthM ?? null, ticks: P.m.ticks ?? null, plans: P.m.plans ?? null, doors: P.m.pressed?.length ?? 0 };
      if (r.fail) {
        P.log.push({ ...rec, fail: r.fail }); P.fails++;
        if (!keepGoing) { P.status = 'failed'; P.why = `${prim.name}: ${r.fail}`; return {}; }
      } else P.log.push({ ...rec, done: true });
      P.k++; P.m = null;
    }
    if (P.status === 'running') P.status = P.fails ? 'failed' : 'done';
    if (P.fails && !P.why) P.why = `${P.fails} failed`;
    return {};
  };
}

/**
 * Walk to a point in any area through the portals (see the header): one primitive, its legs routed
 * at its start (routeAcross), a goTo each, kept as plain data in its memory. A leg that ends at a
 * portal never arrives by distance: it is done when the area changes.
 */
export function crossTo(to, { cls = PLAYER_CLS, arriveM = ARRIVE_M } = {}) {
  const legPrim = (leg, last) => goTo(leg.to, { cls, area: leg.area, arriveM: last ? arriveM : 0 });
  return {
    name: `crossTo ${to.area} ${JSON.stringify([to.x, to.z])}`,
    start(state, me) {
      const legs = routeAcross({ area: state.places.live.area, x: me.x, z: me.z }, to);
      return { legs: legs ? legs.map(l => ({ area: l.area, to: l.to, portal: l.portal?.id ?? null })) : null, i: 0, m: null, lengthM: 0, ticks: 0, plans: 0, pressed: [], fail: legs ? null : 'no-route' };
    },
    step(state, me, M) {
      if (M.fail) return { fail: M.fail };
      while (M.i < M.legs.length) {
        const prim = legPrim(M.legs[M.i], M.i === M.legs.length - 1);
        if (!M.m) M.m = prim.start(state, me);
        const r = prim.step(state, me, M.m);
        if (r.input) return r;
        if (r.fail) return { fail: `leg ${M.i + 1} (${M.legs[M.i].area}${M.legs[M.i].portal ? ` to ${M.legs[M.i].portal}` : ''}): ${r.fail}` };
        M.lengthM += M.m.lengthM ?? 0; M.ticks += M.m.ticks; M.plans += M.m.plans; M.pressed.push(...M.m.pressed);
        M.i++; M.m = null;
      }
      return { done: true };
    },
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

/** A stop-motion step as the hud sends it (the 0.0.5 build sheet §2.4): { act: 'stop', args: { step, tempo, target } }. */
export const stepAct = (step, tempo = 'normal', target = null) => ({ act: 'stop', args: { step, tempo, ...(target ? { target } : {}) } });

/** Wait, pressing nothing, until stop motion stands still for a choice or no step plays (0.0.5), or timeoutMs of game time. */
export function waitStill(timeoutMs = 60_000) {
  return {
    name: 'waitStill',
    start(state) { return { untilMs: state.clock.ms + timeoutMs }; },
    step(state, me, m) {
      const S = state.stop;
      if (!S || !S.doing || S.phase === 'choose') return { done: true };
      if (state.clock.ms >= m.untilMs) return { fail: 'timeout' };
      return { input: {} };
    },
  };
}
