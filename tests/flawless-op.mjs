// OLYMPUS tests: F72, the drill, the team and the breach off the range session (the build sheet v0.0.21 §1 item 21, §8; the done lens's J1 to J3).
//
// The hand-off's gauge: where a team meets a room plan with no range session (tests/cqb-world.mjs: house 1's area, an operation
// open, src/sim/combat/op.js openOp), the drill runs as on the lane and the gauges' library (tests/cqb-gauges.mjs) holds it:
//   F72  off the range session, F1 (no wall paths), F2 (never through each other), F7 (every hot spot covered at "Clear!"),
//        F26 (nobody in a door's swing while it moves) and F47 (no round through a teammate) held on every lane; every drill row
//        offered at the stack, pressed, moves a beat within ROW_RUN_MS (or its variant, for a variant row); the #2 in on his cue
//        (within TWO_CUE_MS of it, every room, never out: F25's) and on his own man (each threat's first round his owner's,
//        team.js ownerOf, or his while he covers you: F9's); from the review of 2026-11-16, the private's and the boot recruit's
//        operations too (by T and the keys the DI's walk line names: below rung 2 the walk in is the keys'), no line of the
//        barracks' DI ("Nothing on fire.") and no line without words. Enforced.
// opLane({ tier, seed, … }) plays one operation off the range by opTBot (T as the page sends it, the shot a line names on a man of
// your own corner, nothing else: the honest bot's rules, tests/bots/house.mjs houseHonestBot, which reads the lane's view and so
// cannot run here), turning each turner at its own trigger as the house would (a door's: its door open plus its gap; the hall's
// zone: the hall entered plus its gap; GO's: the operation's start plus its gap), to every leg clear or OP_LANE_MAX_MS.
// rowsRun(world) presses every drill row the panel offers at the stack, each on the world as it stands (a save loaded before
// each), and steps ROW_RUN_MS. opGauge(lanes, rows) is the F72 row, printed by flawless.mjs printGauge.
import { cqbWorld, OP_WEAPONS } from './cqb-world.mjs';
import { createGame } from './game.mjs';
import { watch } from './cqb-gauges.mjs';
import { BODY_GAP_M, TWO_CUE_MS, s2 } from './flawless.mjs';
import { stepAct, pressToward } from './bots/lib.mjs';
import { doorNow } from '../src/sim/combat/bundle.js';
import { pastThreshold } from '../src/sim/combat/room.js';
import { openingState } from '../src/sim/places/model.js';
import { opLive, opOf } from '../src/sim/combat/op.js';
import { ownerOf } from '../src/sim/combat/team.js';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { BASE_RULES } from '../src/sim/skills/instinct/base.js';
import { GROOM_RULES } from '../src/sim/skills/instinct/groom.js';
import { contactNow } from '../src/sim/combat/contact.js';
import { facingOf, turnTo } from '../src/sim/arms/turners.js';
import { THREAT_FACES } from '../src/sim/combat/two.js';
import { TICK_MS } from '../src/core/clock.js';

/** F72 fails its suite (the build sheet v0.0.21 §8: at once). */
export const OP_ENFORCED = Object.freeze(new Set(['F72']));
/** A drill row pressed must move a beat within this (ms; the build sheet §6: "within 1 s"). */
export const ROW_RUN_MS = 1000;
/** An operation off the range given at most this to every leg clear (ms; the lane's own LANE_MAX_S 60 s, doubled for T's pauses). */
export const OP_LANE_MAX_MS = 120_000;
/** The opTBot's: a T refused this often at one ms, or a stop with no act this many ticks, is a dead end (tests/bots/house.mjs REFUSED_N, DEAD_TICKS). */
export const OP_REFUSED_N = 3, OP_DEAD_TICKS = 3;
/** The keys player (opTBot's keys) stops walking within this of the place the walk line names (m; tests/bots/house.mjs POINT_M's reading: the floor's mark reached). */
export const WALK_AT_M = 0.2;
/** The lines that name a shot and leave it to the player (tests/bots/house.mjs SHOT_LINES), and those that name the pair. */
const SHOT_LINES = new Set(['cqb-contact', 'cqb-still-up', 'cqb-hostage', 'cqb-rp-fire']), PAIR_LINES = new Set(['cqb-contact', 'cqb-rp-fire']);
const isShotRow = (x) => x.kind === 'shot' || /^shot:/.test(String(x.id));

/** The keys a walk line names ("Walk it in: Z.", "Keep moving. S and D to your point."), as { mx, mz }, else null (AZERTY's labels, instinct/cqb.js keysOf: D east, Q west, S south, Z north). */
export function keysIn(text) {
  const m = /\b([ZQSD])(?: and ([ZQSD]))?\b/.exec(String(text ?? ''));
  if (!m) return null;
  const v = { mx: 0, mz: 0 }, of = { D: ['mx', 1], Q: ['mx', -1], S: ['mz', 1], Z: ['mz', -1] };
  for (const k of [m[1], m[2]]) if (k) v[of[k][0]] = of[k][1];
  return v;
}

/**
 * T as the page sends it off the range (see the header): its memory on the actor (mem.T, mem.shots, mem.waits, mem.dead, and
 * mem.walked, the ticks walked by the keys). keys: out of stop motion, at the DI's walk line with no act (cqb-walk, "Walk it in:
 * Q and Z.": below rung 2 the walk in through an open door is the player's keys, instinct/cqb.js cqb-go and cqb-walk), the
 * keys toward the place it names, the floor's mark (your point once the door is open or you are in, else your stack, as the
 * line reads it), to within WALK_AT_M, then nothing until the next line: the private's and the boot recruit's way in, as a
 * player reads the line and the floor.
 */
export function opTBot({ keys = false } = {}) {
  return (state, me, mem) => {
    mem.T ??= 0; mem.shots ??= 0; mem.waits ??= 0; mem.dead ??= {};
    if (state.skip || contactNow(state)?.pending) return {};
    const S = state.stop, now = state.clock.ms, line = instinctNow(state).line, two = opOf(state)?.twoPid ?? null;
    const dead = (kind) => { const k = `${now}|${kind}`; if (mem.deadAt === k) return; mem.deadAt = k; mem.dead[kind] = (mem.dead[kind] ?? 0) + 1; };
    const tryT = () => {
      if (!line?.act) return null;
      const k = `${now}|${line.id}|${line.act}`;
      mem.tn = mem.tAt === k ? (mem.tn ?? 0) + 1 : 0; mem.tAt = k;
      if (mem.tn >= OP_REFUSED_N) { dead(`refused:${line.id}`); return null; }
      mem.T++;
      return { act: [{ act: 'instinct', args: { id: line.id, act: line.act } }] };
    };
    if (S?.reflex) { const t = tryT(); if (t) return t; dead(`reflex:${line?.id ?? 'no line'}`); return { act: [stepAct(`reflex:${S.reflex.options.find(o => !o.off)?.key ?? 'none'}`)] }; }
    const choosing = S?.mode === 'stop' && S.phase === 'choose';
    if (choosing && line && !line.act && SHOT_LINES.has(line.id)) {
      const T = (opOf(state)?.turners ?? []).find(t => t.key === S.pick), mine = T && (!two || (ownerOf(state, T) ?? 1) === 1);
      if (T && T.stoppedAtMs === null && facingOf(T, now) >= 0.5 && mine && mem.shotAt !== now) {
        const rows = stepsOf(state).filter(x => (isShotRow(x) || x.id === 'fire') && !x.off && (x.target ?? T.key) === T.key);
        const named = line.variant === 'press' ? rows.find(x => x.id === 'fire') : PAIR_LINES.has(line.id) ? rows.find(x => /^shot:pair/.test(x.id)) ?? rows.find(isShotRow) : rows.find(x => /head/.test(x.id)) ?? rows.find(isShotRow);
        if (named) { mem.shotAt = now; mem.shots++; return { act: [stepAct(named.id, 'normal', T.key)] }; }
      }
      if (T && !mine) dead(`his man named:${line.id}`);
    }
    const t = tryT();
    if (t) { delete mem.walk; return t; }
    if (!S && keys) {
      if (line?.id === 'cqb-walk' && keysIn(line.text)) {
        const P = doorNow(state, me.who)?.plan ?? null, open = !P?.door || openingState(state, P.door) === 'open';
        // (to your point by your path through the door (the plan's, the floor's marks), else to your stack)
        const path = P && (pastThreshold(P, me.x, me.z) || open) ? P.paths?.[1] ?? (P.points?.[0] ? [P.stack[0], P.points[0]] : null) : P?.stack?.[0] ? [P.stack[0]] : null;
        mem.walk = path ? { path: path.map(p => [p[0], p[1]]), k: 0 } : null;
      }
      const w = mem.walk;
      if (w) {
        // (a mark passed or reached is not walked back to: the next one along)
        while (w.k < w.path.length - 1) { const [ax, az] = w.path[w.k], [bx, bz] = w.path[w.k + 1]; if (Math.hypot(me.x - ax, me.z - az) <= WALK_AT_M || (me.x - ax) * (bx - ax) + (me.z - az) * (bz - az) > 0) w.k += 1; else break; }
        const p = w.path[w.k];
        if (w.k < w.path.length - 1 || Math.hypot(p[0] - me.x, p[1] - me.z) > WALK_AT_M) { mem.walked = (mem.walked ?? 0) + 1; return pressToward(me, p); }
      }
      delete mem.walk;
    }
    if (!choosing) return {};
    mem.nl = mem.nlAt === now ? (mem.nl ?? 0) + 1 : 0; mem.nlAt = now;
    if (mem.nl < OP_DEAD_TICKS) return {};
    dead(line ? `no act:${line.id}` : 'no line');
    if (stepsOf(state).some(x => x.id === 'wait' && !x.off)) { mem.waits++; return { act: [stepAct('wait')] }; }
    return {};
  };
}

/** The barracks' DI (instinct/base.js and groom.js: the needs, the grooming, free time): never a line in an operation (the review of 2026-11-16: "Nothing on fire. Enjoy it while it lasts." through the clear). */
// (v0.0.25's stage 0, C5: the void's two rules are an operation's, never the barracks': 'anchor' ("Anchor before you fire.", v0.0.24
// A's) is said in an operation at 0 G, and 'aft' ("Feet aft", B's rule of this round, after it) under a ship's burn, the Wreck's
// first operation among them; the set is built from every BASE_RULES id, so each is left out by name, 'aft' before it exists)
/** The ids of BASE_RULES that are an operation's own (see above), never a barracks line. */
export const VOID_LINES = Object.freeze(new Set(['anchor', 'aft']));
export const BARRACKS_LINES = Object.freeze(new Set([...BASE_RULES, ...GROOM_RULES].map(r => r.id).filter(id => !VOID_LINES.has(id))));

const legOfStand = (stand) => (stand === 'H' ? 3 : Number(stand?.[0]) - 1);
// (each turner turned at its own trigger as the house turns it (shoothouse.js triggers): the leg's door open, the hall entered, the start)
function turnDue(state) {
  const H = opOf(state), legs = H ? [...H.rooms, H.hall] : [];
  for (const T of H?.turners ?? []) {
    if (T.turnAtMs !== null || T.stoppedAtMs !== null) continue;
    const L = legs[legOfStand(T.stand)], k = T.trigger?.kind, gap = T.trigger?.gapMs ?? 0;
    const from = k === 'door' ? L?.openAtMs ?? null : k === 'zone' ? L?.enteredAtMs ?? null : k === 'go' ? H.goAtMs : null;
    if (Number.isFinite(from)) turnTo(T, from + gap);
  }
}

/**
 * One operation off the range (see the header): { tier, seed, two, keys, done, ms, legs, team, watch (the library's records),
 * engaged ([{ stand, owner, by, covered }]), lines ({ barracks, empty }: the ticks a barracks' line, or a line with no words,
 * stood, by rule id), mem (the bot's), err }. keys: opTBot's (the private's and the recruit's way in); draw: cqbWorld's (the
 * house drawn from the seed, its own plans).
 */
export function opLane({ tier = 'sgt', seed = 48213, two = true, loadout = null, keys = false, draw = null, maxMs = OP_LANE_MAX_MS } = {}) {
  const w = cqbWorld({ tier, seed, two, rooms: null, loadout, draw }), g = w.g, s0 = g.state, t0 = s0.clock.ms;
  const team = { me: w.pid, two: w.twoPid }, W = watch(g, { team, plans: w.plans });
  const bot = opTBot({ keys }), firstBy = {}, lines = { barracks: {}, empty: {} };
  let prev = t0, err = null, doneAt = null;
  g.clearFacts?.();
  try {
    while (g.state.clock.ms - t0 < maxMs) {
      turnDue(g.state);
      g.step(1, bot);
      const st = g.state, now = st.clock.ms, facts = { house: g.facts('house'), op: g.facts('op'), shot: g.facts('shot') };
      W.tick(g, { now, dt: now - prev, on: opLive(st), facts });
      for (const f of facts.shot) if (f.fired && f.target) firstBy[f.target] ??= f.who === team.me ? 'me' : f.who === team.two ? 'two' : 'other';
      prev = now;
      g.clearFacts?.();
      const ln = instinctNow(st).line;
      if (ln && BARRACKS_LINES.has(ln.id)) lines.barracks[ln.id] = (lines.barracks[ln.id] ?? 0) + 1;
      if (ln && !String(ln.text ?? '').trim()) lines.empty[ln.id] = (lines.empty[ln.id] ?? 0) + 1;
      const H = opOf(st), all = H && [...H.rooms, H.hall].every(L => L.state === 'clear');
      if (all && doneAt === null) doneAt = now;
      if (doneAt !== null && (!st.stop || now - doneAt >= 2000)) break;
    }
  } catch (e) { err = String(e?.message ?? e).slice(0, 300); }
  const st = g.state, H = opOf(st), me = st.actors.list.find(a => a.who === w.pid);
  const engaged = (H?.turners ?? []).filter(T => THREAT_FACES.includes(T.face)).map(T => ({ stand: T.stand, owner: ownerOf(st, T) ?? 1, by: firstBy[T.key] ?? null, up: T.stoppedAtMs === null, covered: (H.two?.covered ?? []).includes(T.key) }));
  return { tier, seed, two, keys, draw, area: w.op.area, lines, done: doneAt !== null && !err, ms: st.clock.ms - t0, legs: H ? [...H.rooms, H.hall].map(L => L.state) : [], team, watch: W.result(), engaged, mem: me?.bot ?? {}, err };
}

/** A save point waits while the T player's next press reads the line on the page (a line with an act, or any line at a choice or out of the mode): the line is runtime (instinct.js $instinct), so a load forgets it for one tick, on the lane as off it (the house's T bot on sergeant 48213 at ticks 150 and 349 of the lane), and the two games would differ by the player, not the game (ticks). */
export const SAVE_WAIT_TICKS = 40;
const pressNext = (st) => { const l = instinctNow(st).line, S = st.stop; return !!l && (!!l.act || !S || (S.mode === 'stop' && S.phase === 'choose')); };

/**
 * Saves through one operation off the range (see opLane; the review of 2026-11-16: 5 of 45 points apart): every `every` ticks
 * (moved on while pressNext), the game saved, loaded into a second game, and both run `after` ticks on by the same bot (its
 * memory on the actor), the turners turned at their triggers in each, then the two saves compared: { points: [{ tick, same }], apart }.
 */
export function opSaves({ tier = 'sgt', seed = 48213, keys = false, every = 100, after = 120, maxTicks = 2400 } = {}) {
  const w = cqbWorld({ tier, seed, rooms: null }), g = w.g, bot = opTBot({ keys }), points = [];
  const run = (x, b) => { turnDue(x.state); x.step(1, b); };
  let t = 0;
  const done = (st) => { const H = opOf(st); return !H || [...H.rooms, H.hall].every(L => L.state === 'clear'); };
  while (t < maxTicks && !done(g.state)) {
    run(g, bot); t++;
    if (t % every) continue;
    let k = 0;
    while (pressNext(g.state) && k++ < SAVE_WAIT_TICKS) { run(g, bot); t++; }
    const json = g.save(), g2 = createGame({ scenario: 'test-shoothouse', seed, tier, domains: { weapons: OP_WEAPONS } }), bot2 = opTBot({ keys });
    g2.load(json);
    for (let i = 0; i < after; i++) { run(g, bot); run(g2, bot2); }
    t += after;
    points.push({ tick: t - after, same: g.save() === g2.save() });
  }
  return { tier, seed, keys, points, apart: points.filter(p => !p.same).map(p => p.tick) };
}

/**
 * Every drill row the panel offers at the world's stack (not struck), pressed on the world as it stands (a save loaded before
 * each), stepped ROW_RUN_MS: { rows: [{ id, ok, why, ran }], dead: [ids] }; a row ran when a beat of its doing began (or the
 * doing ended at once), its variant changed (a variant row), or a single of it began.
 */
export function rowsRun(world) {
  const g = world.g, save = g.save(), out = [];
  const offered = stepsOf(g.state).filter(r => !r.off && /^(drill|door|watch|look|move|call|mark):/.test(String(r.id)));
  for (const r of offered) {
    g.load(save);
    const v0 = JSON.stringify(g.state.stop?.variant ?? null), at0 = g.state.clock.ms;
    g.step(1, { act: [stepAct(r.id)] });
    let ran = false;
    for (let i = 0; i * TICK_MS < ROW_RUN_MS && !ran; i++) {
      const S = g.state.stop, d = S?.doing;
      ran = (r.kind === 'variant' && JSON.stringify(S?.variant ?? null) !== v0) || !!d?.beats?.some(b => b.st === 'run' || b.st === 'done') || (!!d && !d.beats && d.step === r.id)
        || (S?.phase === 'choose' && g.state.clock.ms > at0 && !d && r.kind !== 'variant');
      if (!ran) g.step(1, {});
    }
    out.push({ id: r.id, kind: r.kind, ran });
  }
  g.load(save);
  return { rows: out, dead: out.filter(x => !x.ran).map(x => x.id) };
}

/** F72 over the lanes and the rows (see the header): a flawless.mjs gauge row. */
export function opGauge(lanes, rows) {
  const notDone = lanes.filter(l => !l.done), wall = lanes.reduce((a, l) => a + l.watch.walls.over, 0), worst = Math.max(0, ...lanes.map(l => l.watch.walls.worstM));
  const withTwo = lanes.filter(l => l.two), gapMin = Math.min(Infinity, ...withTwo.map(l => l.watch.bodies.minM)), gapUnder = withTwo.reduce((a, l) => a + l.watch.bodies.underMs, 0);
  const unc = lanes.reduce((a, l) => a + l.watch.corners.uncovered, 0), clears = lanes.reduce((a, l) => a + l.watch.corners.clears, 0);
  const swing = lanes.reduce((a, l) => a + l.watch.swings.me + l.watch.swings.two, 0), masked = lanes.flatMap(l => l.watch.lines.masked), shots = lanes.reduce((a, l) => a + l.watch.lines.shots, 0);
  // (the cue is judged on the T lanes, as F25 on the lane; on the keys lanes it is printed with the T player's dead ends: at the
  // private's no-shoot "Hands. No weapon." has no act, so T's fallback Wait stands in the doorway and holds his #2 out, 17 s on
  // 48213 room 2, a dead end of the lane's DI as much as the operation's (the review of 2026-11-16, reported for cqb-noshoot))
  const cuedAll = withTwo.flatMap(l => Object.entries(l.watch.entry).filter(([, E]) => E.cueMs !== null).map(([door, E]) => ({ door, lagMs: E.inMs === null ? null : E.inMs - E.cueMs, out: E.out, l })));
  const cued = cuedAll.filter(c => !c.l.keys), byKeys = cuedAll.filter(c => c.l.keys);
  const late = cued.filter(c => c.out || c.lagMs === null || c.lagMs > TWO_CUE_MS);
  const eng = withTwo.flatMap(l => l.engaged.filter(e => e.by !== null)), wrong = eng.filter(e => !(e.by === (e.owner === 1 ? 'me' : 'two') || (e.by === 'two' && e.covered)));
  const deadRows = rows.flatMap(r => r.dead), nRows = rows.reduce((a, r) => a + r.rows.length, 0);
  // (the DI's lines (v0.0.21's review): none of the barracks' in an operation, none without words)
  const sum = (key) => { const o = {}; for (const l of lanes) for (const [id, n] of Object.entries(l.lines?.[key] ?? {})) o[id] = (o[id] ?? 0) + n; return o; };
  const barracks = sum('barracks'), empty = sum('empty'), nB = Object.values(barracks).reduce((a, n) => a + n, 0), nE = Object.values(empty).reduce((a, n) => a + n, 0);
  const met = nB === 0 && nE === 0 && !notDone.length && wall === 0 && gapMin >= BODY_GAP_M && gapUnder === 0 && unc === 0 && clears > 0 && swing === 0 && !masked.length && cued.length > 0 && !late.length && eng.length > 0 && !wrong.length && !deadRows.length;
  const value = `${lanes.length} operations off the range (${lanes.filter(l => l.keys).length} by T and the keys the line names, ${lanes.filter(l => l.draw).length} on a drawn house${lanes.filter(l => l.draw).map(l => ` ${l.area}`).join('')}; ${lanes.length - notDone.length} to every leg clear${notDone.length ? `; not: ${notDone.map(l => `${l.tier} ${l.seed}${l.err ? ` (${l.err.slice(0, 60)})` : ` [${l.legs.join(',')}]`}`).join('; ')}` : ''}); F1 ${wall} body-ticks over, worst ${s2(worst * 100)} cm; F2 least ${s2(gapMin)} m, ${s2(gapUnder / 1000)} s under; F7 ${clears} clears, ${unc} hot spots uncovered; F26 ${s2(swing / 1000)} s in a swing; F47 ${shots} rounds, ${masked.length} through the other; the #2 cued ${cued.length} rooms, late or out ${late.length}${late.length ? ` (${late.slice(0, 3).map(c => `${c.l.tier} ${c.l.seed} ${c.door}: ${c.out ? 'OUT' : `${s2((c.lagMs ?? -1000) / 1000)} s`}`).join('; ')})` : ''}, the longest ${s2(Math.max(0, ...cued.map(c => c.lagMs ?? 0)) / 1000)} s${byKeys.length ? ` (by the keys, printed: ${byKeys.map(c => `${c.l.tier} ${c.l.seed} ${c.door.replace(/^o:w4:/, '')} ${c.out ? 'OUT' : `${s2((c.lagMs ?? -1000) / 1000)} s`}`).join(', ')}; their dead ends ${JSON.stringify(Object.assign({}, ...lanes.filter(l => l.keys).map(l => Object.fromEntries(Object.entries(l.mem.dead ?? {}).map(([k, n]) => [`${l.tier} ${l.seed} ${k}`, n])))))})` : ''}; men taken ${eng.length}, by the wrong marine ${wrong.length}${wrong.length ? ` (${wrong.slice(0, 3).map(e => `${e.stand} his ${e.owner}, by ${e.by}`).join('; ')})` : ''}; drill rows pressed ${nRows}, dead ${deadRows.length}${deadRows.length ? ` (${deadRows.slice(0, 4).join(', ')})` : ''}; the barracks' lines ${nB} ticks${nB ? ` ${JSON.stringify(barracks)}` : ''}, lines with no words ${nE} ticks${nE ? ` ${JSON.stringify(empty)}` : ''}`;
  return { id: 'F72', name: 'the drill, the team and the breach off the range', met, value, target: `every lane to every leg clear; F1, F2, F7, F26, F47 held; every offered drill row runs within ${ROW_RUN_MS / 1000} s; the #2 in within ${TWO_CUE_MS / 1000} s of his cue, on his own man; no barracks' line and none without words` };
}
