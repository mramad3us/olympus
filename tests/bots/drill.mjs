// OLYMPUS tests: the drill's bot, room 1 of lane A by the keys or by T, the way COMBAT §25.5 and the build sheet 0.0.12 §4 time it (the drill role's, for enter-and-clear and the bundle suites).
//
// roomRun({ tier, mode, humanStartMs, watch, seed, shot }) plays room 1 in the drill's world (tests/drill-world.mjs:
// HOUSE1's start mark at 1 G, in stop motion at GO, the lane being cleared: state.mind.clearing), the man in the far left
// corner (stand 1a) facing from GO, and returns what happened, in game time from GO:
//   by the keys (mode 'keys', rungs 0 and 1: the private's way, §4's "by hand, keys in"): Stack on the door (its row), the
//   door's push, optionally Watch: the far left corner (watch), X, then after the human's own start (humanStartMs, 0.3 s)
//   the movement keys along #1's path (Z and Q toward the threshold, then Q toward the point: the keys steer for the
//   waypoints, the body's inertia in Combat its own), the window taking the keys, the pause; Off safe if needed, Aim, the
//   shot (Pair below rung 2); X and the keys on to the point after the human's start again; G (into the mode), a Look at
//   each hot spot not yet covered, "Clear!".
//   by T (mode 'T', rungs 2 to 4): the rung's lead bundle at the door (the panel's first bundle row: Stack and open, Clear
//   the room, Clear the house), the next group or the carry on, the shot at the pause (Hammer, moving on, where offered,
//   else Pair, moving on, else the plain rows), Dominate or the carry on to "Clear!".
// The man goes down after two torso hits or one to the head (the bay's paper sensor, set by the bot: the scene's own sensor
// is shoothouse.js's). Returns { tier, mode, roomMs, seenMs, pauseMs, takeInMs, expect, firstMs, presses, end: { down,
// clear, offPointM, covered }, floorOk, faults }.
import { drillWorld } from '../drill-world.mjs';
import { stepsOf } from '../../src/sim/arms/shooting.js';
import { contactNow } from '../../src/sim/combat/contact.js';
import { coveredNow, pastThreshold } from '../../src/sim/combat/room.js';
import { TICK_MS } from '../../src/core/clock.js';

const DOOR = 'o:w4:r1';

/** One room by the keys or by T (see the header). */
export function roomRun({ tier = 'private', mode = null, humanStartMs = 300, watch = false, seed = 48213, shot = null } = {}) {
  const w = drillWorld({ tier, seed });
  const { g, s, pid } = w;
  const t0 = s.clock.ms, plan = w.lane.plans[DOOR], T = w.T('1a');
  const rung = s.people[pid].skills.drills.room.rung, how = mode ?? (rung < 2 ? 'keys' : 'T');
  s.mind.clearing = { room: plan.room, fromMs: t0 };
  T.turnAtMs = t0 - 2000;
  const rec = { tier, mode: how, presses: 0, shots: [], clearAtMs: null, covered: new Set(), faults: [] };
  g.bus.on?.('shot', (f) => rec.shots.push({ atMs: f.atMs ?? s.clock.ms, part: f.part ?? null, hit: f.hit ?? f.zone ?? null }));
  g.bus.on?.('say', (f) => { if ((f.call === 'clear' || f.text === 'Clear!') && rec.clearAtMs === null) { rec.clearAtMs = s.clock.ms + (f.durMs ?? 0); rec.at = [w.me().x, w.me().z]; rec.coveredAt = [...rec.covered]; } });
  const me = () => w.me();
  // (a bundle flowing on to the next room: the room's end is where its next approach starts)
  g.bus.on?.('bundle', (f) => { if (f.phase === 'beat' && /^1:approach$/.test(f.beat ?? '') && !rec.next) { rec.next = [w.me().x, w.me().z]; rec.coveredNext = [...rec.covered]; } });
  const rows = () => stepsOf(s);
  const press = (id) => { rec.presses++; g.step(1, { act: [{ act: 'stop', args: { step: id } }] }); };
  const act = (a) => { rec.presses++; g.step(1, { act: [{ act: a }] }); };
  const choosing = () => s.stop?.mode === 'stop' && s.stop.phase === 'choose' && !s.stop.reflex;
  const tick = (input) => { g.step(1, input); for (const h of coveredNow(s, plan, me(), s.clock.ms)) rec.covered.add(h); senseDown(); };
  // (the paper's sensor: two torso hits or a head hit puts him down; the bot reads the rounds it fired at him)
  const senseDown = () => {
    if (T.stoppedAtMs !== null) return;
    const hits = (T.hits ?? []).length ? T.hits : null;
    const fired = rec.shots.filter(x => x.atMs >= t0);
    if ((hits && (hits.filter(h => h.part === 'torso' && (h.zone || h.ring)).length >= 2 || hits.some(h => h.part === 'head' && h.zone))) || (!hits && fired.length >= 2)) T.stoppedAtMs = s.clock.ms;
  };
  const runUntil = (cond, input = {}, max = 4000) => { for (let n = 0; n < max && !cond(); n++) tick(typeof input === 'function' ? input() : input); };
  // (the keys toward a waypoint: a key an axis, a deadband so the body is not dithered)
  const keysTo = (wp) => { const a = me(), dx = wp[0] - a.x, dz = wp[1] - a.z; return { mx: Math.abs(dx) > 0.08 ? Math.sign(dx) : 0, mz: Math.abs(dz) > 0.08 ? Math.sign(dz) : 0 }; };
  const path = plan.paths[1], point = plan.points[0];
  const atPause = () => choosing() && s.stop.via === 'contact' && T.stoppedAtMs === null && contactNow(s)?.last;
  const shotRow = () => {
    const r = rows().filter(x => x.kind === 'shot' && !x.off);
    const want = shot ? [shot] : ['shot:hammer@moving', 'shot:pair@moving', 'shot:hammer', 'shot:pair', 'shot:hammer@planted', 'shot:pair@planted'];
    for (const id of want) { const x = r.find(y => y.id === id); if (x) return x; }
    return r[0] ?? null;
  };
  if (how === 'keys') {
    press(rows().find(r => r.id.startsWith('drill:room:stack>')).id);
    runUntil(choosing);
    press(rows().find(r => r.id.startsWith('door:push>') || r.id.startsWith('door:pull>')).id);
    runUntil(choosing);
    if (watch) { press(rows().find(r => r.id === `watch:${plan.hot.find(h => h.id.endsWith(':fl')).id}`).id); runUntil(choosing); }
    act('shoot');                                                     // (X: the clock runs)
    for (let n = 0; n < Math.round(humanStartMs / TICK_MS); n++) tick({});
    // (the walk in: toward the threshold, then the point, until the window takes the keys and the pause comes)
    let wp = 1;
    runUntil(() => s.stop?.mode === 'stop', () => { const a = me(); if (wp < path.length - 1 && Math.hypot(path[wp][0] - a.x, path[wp][1] - a.z) < 0.25) wp++; return keysTo(path[wp]); }, 400);
    runUntil(() => atPause() || T.stoppedAtMs !== null);
    if (atPause()) {
      const off = rows().find(r => r.id === 'selector:semi' && !r.off && r.promoted);
      if (off) { press(off.id); runUntil(choosing); }
      const aim = rows().find(r => r.id === 'aim' && !r.off);
      if (aim) { press(aim.id); runUntil(choosing); }
      const r = shotRow();
      if (r) { press(r.id); runUntil(choosing); }
      // (below the Pair's gate (the boot recruit): Fire, twice)
      else for (let k = 0; k < 2 && T.stoppedAtMs === null; k++) { const f = rows().find(x => x.id === 'fire' && !x.off); if (!f) break; press(f.id); runUntil(choosing); }
    }
    act('shoot');
    for (let n = 0; n < Math.round(humanStartMs / TICK_MS); n++) tick({});
    runUntil(() => Math.hypot(point[0] - me().x, point[1] - me().z) < 0.12 && !me().v, () => ({ ...keysTo(point) }), 400);
    act('shoot');                                                     // (G: into the mode)
    runUntil(() => choosing(), {}, 40);
    for (const h of plan.hot) {
      if (rec.covered.has(h.id)) continue;
      const look = rows().find(r => r.id === `look:${h.id}`);
      if (look) { press(look.id); runUntil(choosing); }
    }
    const clear = rows().find(r => r.id === 'call:clear');
    if (clear) { press(clear.id); runUntil(choosing); }
  } else {
    let guard = 0;
    while (rec.clearAtMs === null && guard++ < 40) {
      runUntil(() => choosing() || rec.clearAtMs !== null);
      if (rec.clearAtMs !== null) break;
      if (atPause()) { const r = shotRow(); if (r) { press(r.id); continue; } }
      const list = rows(), carry = list.find(r => r.carry), bundle = list.find(r => r.kind === 'bundle' && !r.off && !r.single && r.door === DOOR && (r.lead || r.rung >= 2));
      const next = carry ?? bundle ?? list.find(r => r.id === 'call:clear');
      if (!next) break;
      press(next.id);
    }
    runUntil(() => (rec.clearAtMs !== null && choosing()) || !!rec.next, {}, 200);
  }
  const c = contactNow(s)?.last ?? null, at = rec.next ?? rec.at ?? [me().x, me().z], a = { x: at[0], z: at[1] };
  if (rec.coveredNext) rec.coveredAt = rec.coveredNext;
  const first = rec.shots.find(x => x.atMs >= (c?.seenMs ?? Infinity)) ?? null;
  return {
    tier, mode: how, w, roomMs: (rec.clearAtMs ?? s.clock.ms) - t0, seenMs: c ? c.seenMs - t0 : null, pauseMs: c ? c.atMs - t0 : null, takeInMs: c?.ms ?? null, expect: c?.expect ?? null,
    firstMs: first && c ? first.atMs - c.seenMs : null, presses: rec.presses, shots: rec.shots.length,
    end: { down: T.stoppedAtMs !== null, clear: rec.clearAtMs !== null, offPointM: Math.round(Math.hypot(point[0] - a.x, point[1] - a.z) * 100) / 100, covered: [...(rec.coveredAt ?? rec.covered)].sort(), inside: pastThreshold(plan, a.x, a.z) },
  };
}
