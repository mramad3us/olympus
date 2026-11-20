// OLYMPUS bots: "The window and the canopy"'s bots, a marine who drives test-armoury by what the player sees to the end card, a marine who presses T, and the fuzz that hunts its dead ends (the build sheet v0.0.28 §1 B, AM§10).
//
// armouryBot({ tempo, read, count, far }) is a bot for tests/game.mjs (state, me, mem) → input: it reads only what the player sees (the
// scene's view, armoury-day.js armouryNow: the standing command, its station and ring, the rows at it; the DI's tempo, diTempoOf, as T
// would say it) and presses what a player presses: Z Q S D to the yellow ring (lib.mjs goTo's path, its memory plain data), R with the row
// R held picks ({ act: 'hand', args: { id } }), one press a moment. tempo: 'di' (the DI's), or 'rushed', 'normal', 'careful' at every clean;
// read and count: the two habits (false skips them: the faults' lanes); far: whether it walks to the far cases (false leaves them: the
// working party's lane); panel: the show clears at the window and on the lane by the step panel (G, then UNLOAD, SHOW CLEAR, then X), the
// other channel, R's once a command if the panel offers no row (the review of v0.0.28 B: the bots had never used it on the lane). Out of the
// mode it stays; in it, but for its own panel's row, it leaves with X.
// armouryTBot() is a human pressing T as the page sends it ({ act: 'instinct', args: { id, act } } for the line shown), walking only where
// the line names the keys (arm-walk, arm-brass: to the ring, or to the far cases), R where the line names no act (the clean's rows are T's).
// armouryFuzzBot({ seed }) hunts the scene's dead ends: random legal presses and walks (R and R held's rows at random, T now and then, G and
// the panel's rows, a walk out of the box, waits through the moves-on, the tempo at random), its dice hashes of its seed and its count
// (mem.n). runArmoury(game, bot, { maxTicks }) plays to the card: { ticks, done, card, faults, stuck } (stuck: the tick the scene stopped
// moving for STUCK_S of game time with no splash, no act and no command posted, or null).
import { armouryNow, diTempoOf, armouryOf } from '../../src/sim/scenarios/armoury-day.js';
import { instinctNow } from '../../src/sim/skills/instinct.js';
import { stepsOf } from '../../src/sim/arms/shooting.js';
import { goTo, stepAct, pressToward } from './lib.mjs';
import { hashInt } from '../../src/core/hash.js';

const R = (id) => ({ act: [{ act: 'hand', args: id ? { id } : {} }] });
// (a walk to a point, its primitive made again each tick from plain memory)
function walkTo(state, me, mem, x, z) {
  // (the last metre straight at it, so a spot beside a marine's is reached where the path's grid stops short)
  if (Math.hypot(x - me.x, z - me.z) < 1.0) { mem.walk = null; return Math.hypot(x - me.x, z - me.z) <= 0.15 ? null : pressToward(me, [x, z]); }
  const key = `${Math.round(x * 100)},${Math.round(z * 100)}`;
  if (mem.walk?.key !== key) { const p = goTo({ x, z }, { arriveM: 0.25 }); mem.walk = { key, x, z, m: p.start(state, me) }; }
  const out = goTo({ x: mem.walk.x, z: mem.walk.z }, { arriveM: 0.25 }).step(state, me, mem.walk.m);
  if (out.done || out.fail) { mem.walk = null; return out.fail ? { fail: out.fail } : null; }
  return out.input;
}
// (the row the honest marine presses at a station: the habits first, the DI's tempo at the table)
function rowOf(state, N, o) {
  const has = (id) => N.acts.includes(id);
  if (N.cmd === 'window') { if (o.read && has('read')) return 'read'; if (has('show')) return 'show'; if (has('sign')) return 'sign'; return null; }
  if (N.cmd === 'issue') { if (o.count && has('count')) return 'count'; if (has('sign20')) return 'sign20'; return null; }
  if (N.cmd === 'clean') {
    const t = o.tempo === 'di' ? diTempoOf(state) : o.tempo, A = armouryOf(state).arm, id = A.again ? `again${t[0].toUpperCase()}${t.slice(1)}` : t;
    return has(id) ? id : N.acts[0] ?? null;
  }
  return N.acts[0] ?? null;
}

/** The honest marine (see the header). */
export function armouryBot({ tempo = 'di', read = true, count = true, far = true, panel = false } = {}) {
  const o = { tempo, read, count, far, panel };
  return (state, me, mem) => {
    const N = armouryNow(state);
    if (!N || N.end) { mem.done = true; return {}; }
    if (state.skip || state.time?.doing) return {};
    const S = state.stop, now = state.clock.ms;
    if (S?.mode === 'stop') {
      if (S.phase !== 'choose' || S.doing) return {};
      if (mem.panel) { mem.panel = false; const f = stepsOf(state).find(x => x.id === 'macro:clear' && !x.off); if (f) return { act: [stepAct(f.id, 'normal')] }; }
      return { act: [stepAct('leave')] };
    }
    if (S) return {};
    if (N.busy || !N.cmd) return {};
    // (the far cases: walked to once those at the point are up)
    if (N.cmd === 'police' && !N.acts.includes('police')) { if (!o.far || !N.far) return {}; const t = farSpot(state, me); return t ? walkTo(state, me, mem, t.x, t.z) ?? {} : {}; }
    if (N.ring && !N.at) return walkTo(state, me, mem, N.spot.x, N.spot.z) ?? {};
    if (!N.acts.length) return {};
    const id = rowOf(state, N, o);
    if (!id || mem.rAtMs === now) return {};
    mem.rAtMs = now; mem.n = (mem.n ?? 0) + 1;
    // (the panel's channel: G, then its row in the mode (above), once a command)
    if (o.panel && id === 'show' && mem.panelAt !== N.cmdI) { mem.panelAt = N.cmdI; mem.panel = true; return { act: ['ready'] }; }
    return R(id);
  };
}
// (where the far cases lie: the middle of your tiles beyond the police's reach)
function farSpot(state, me) {
  const R0 = armouryOf(state);
  let n = 0, sx = 0, sz = 0;
  for (const [k, t] of Object.entries(R0.brassTiles ?? {})) { if (!t.mine) continue; const [i, j] = k.split(',').map(Number); n += t.mine; sx += (i + 0.5) * t.mine; sz += (j + 0.5) * t.mine; }
  return n ? { x: sx / n, z: sz / n } : null;
}

/** A marine pressing T (see the header). */
export function armouryTBot() {
  return (state, me, mem) => {
    const N = armouryNow(state);
    if (!N || N.end) { mem.done = true; return {}; }
    if (state.skip || state.time?.doing) return {};
    const S = state.stop, now = state.clock.ms;
    if (S?.mode === 'stop') return S.phase === 'choose' && !S.doing ? { act: [stepAct('leave')] } : {};
    if (S) return {};
    const line = instinctNow(state).line;
    if (line?.act && mem.tAtMs !== now) { mem.tAtMs = now; mem.n = (mem.n ?? 0) + 1; return { act: [{ act: 'instinct', args: { id: line.id, act: line.act } }] }; }
    // (the line names the keys to walk: to the ring, or to the far cases)
    if (line?.id === 'arm-brass') { const t = farSpot(state, me); if (t) return walkTo(state, me, mem, t.x, t.z) ?? {}; }
    if (line?.id === 'arm-walk' && N.spot) return walkTo(state, me, mem, N.spot.x, N.spot.z) ?? {};
    return {};
  };
}

/** The longest the fuzz marine stands before it does something (ms of game time), and its weights against 1 (my calls). */
export const ARM_FUZZ_OUT_MS = 12_000;
export const ARM_FUZZ_W = Object.freeze({ row: 8, walk: 4, T: 3, G: 1, wander: 1, wait: 3 });
/** The fuzz marine (see the header). */
export function armouryFuzzBot({ seed = 1 } = {}) {
  return (state, me, mem) => {
    mem.n ??= 0;
    const N = armouryNow(state);
    if (!N || N.end) { mem.done = true; return {}; }
    if (state.skip || state.time?.doing) return {};
    const S = state.stop, now = state.clock.ms, die = (k) => hashInt(k, 'arm-fuzz', seed, mem.n++);
    // (G with no rifle in reach holds time for a digit (v0.0.4's stub): a player presses one)
    if (state.clock.holds?.includes('ready')) return { act: ['digit:1'] };
    if (S?.mode === 'stop') {
      if (S.phase !== 'choose' || S.doing) return {};
      const steps = stepsOf(state).filter(s => !s.off && s.kind !== 'fire' && s.kind !== 'aim');
      if (!steps.length || die(3) === 0) return { act: [stepAct('leave')] };
      const st = steps[die(steps.length)];
      return { act: [stepAct(st.id, 'normal')] };
    }
    if (S) return {};
    // (a walk under way: kept to its end, or dropped now and then)
    if (mem.go) { const out = walkTo(state, me, mem, mem.go.x, mem.go.z); if (out && die(40)) return out; mem.go = null; }
    if (mem.until !== undefined && now < mem.until) return {};
    delete mem.until;
    const W = ARM_FUZZ_W, total = W.row + W.walk + W.T + W.G + W.wander + W.wait;
    let r = die(total);
    if ((r -= W.row) < 0) { const rows = N.rows; if (rows.length) { const x = rows[die(rows.length)]; return R(x.id); } return R(null); }
    if ((r -= W.walk) < 0) { if (N.spot) mem.go = { x: N.spot.x, z: N.spot.z }; else if (N.far) mem.go = farSpot(state, me); return {}; }
    if ((r -= W.T) < 0) return { act: ['instinct'] };
    if ((r -= W.G) < 0) return { act: ['ready'] };
    if ((r -= W.wander) < 0) { mem.go = { x: me.x + (die(41) - 20), z: me.z + (die(31) - 15) }; return {}; }
    mem.until = now + die(ARM_FUZZ_OUT_MS);
    return {};
  };
}

/** The ticks (as seconds of them) with nothing moving before a lane counts as stuck: a splash's skip moves the clock forty minutes in one tick, so the ticks are counted, not the clock (s). */
export const STUCK_S = 240;
/** Play a lane to the card (see the header). */
export function runArmoury(game, bot, { maxTicks = 20 * 60 * 30 } = {}) {
  let stuck = null, lastKey = null, lastAt = 0, t = 0;
  for (; t < maxTicks; t++) {
    const s = game.state, N = armouryNow(s);
    if (!N || N.end) break;
    const key = `${N.cmd}|${N.next}|${N.doing}|${N.busy}|${s.armoury.range.cmd?.atMs}|${N.acts.join()}|${s.armoury.range.arm.waitMs}`;
    if (key !== lastKey) { lastKey = key; lastAt = t; }
    else if (t - lastAt > STUCK_S * 20) { stuck = { tick: t, at: N.cmd, press: N.press }; break; }
    game.step(1, bot);
  }
  const N = armouryNow(game.state);
  return { ticks: t, done: !!N?.end, end: N?.end ?? null, card: N?.card ?? null, faults: N?.faults ?? [], stuck, N };
}
