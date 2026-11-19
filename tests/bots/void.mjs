// OLYMPUS bots: the void's two scenes driven by what the player sees: "Anchor before you fire" (test-anchors) to its card by the keys or by T, its fuzz bot, and "Secure for burn" (test-burn) with its fuzz bot (the build sheet v0.0.24 §1 D, §6; the anywhere note AW§6's bots).
//
// anchorsBot({ mode: 'keys' | 'T' }) is a bot for tests/game.mjs ((state, me, mem) → input). It reads only what a player has: the
// cadre's station (scenarios/anchors.js anchorsNow: which station, its mark, what it wants: the command said it), the footing as the
// G line says it (body/footing.js footingOf), the hold rule's pad-eyes on the deck (their lattice: 0.75 m + 3 m k both ways, as the
// floor shows them), the step panel (arms/shooting.js stepsOf), the take-in's record (combat/contact.js contactNow) and the weapon
// card (arms/firearms.js beliefOf), and presses what a player presses: the move keys (on locked boots the walk; floating, a push-off
// from rest along the keys' direction, Shift faster, Alt slower: body/freefall.js), L (the grab), G (the mode), one row a press
// while time stands still (lib.mjs stepAct: the boots, the anchors, Transition, Aim, Off safe, the shot), X (leave), and in 'T' mode
// T where the instinct offers an act (A's "Anchor before you fire." among them), the keys otherwise.
// Its plan, a station at a time:
//   boots         the boots locked, the keys to the line;
//   floating moves the boots released; at rest, a push along the one of the eight directions whose run passes nearest a pad-eye
//                 that leads on to the mark (a breadth-first search over the lattice, a run's tube 0.5 m wide), Shift on a run of 6 m
//                 or more; drifting, the grab (L) once the run's end is within reach, or at a face it met; then the next run;
//   at the mark   the station's anchor by its row (Clip in, Take the hold, Wedge: A's), the pistol by Transition, the floating station
//                 a push off the mark into the open; then G and Wait for the turner;
//   the string    the turner taken in, Aim, Off safe, then the shot row (or Fire) until the string's rounds; X after it;
//   the drift     the grab once a hold is in reach (the first pad-eye the drift passes in the deck).
// A stoppage felt: IMMEDIATE ACTION. A rifle swung onto its sling by a fumble: Up. It throws on a decision repeated STALL_N times with
// the clock still. Its memory (me.bot) is plain data, so it saves and loads with the game.
// voidFuzzBot({ seed }) hunts the course's dead ends: random legal rows (the boots, the anchors, Transition and Rifle up among them,
// never a shot), the move keys and L at random, G and X, T now and then; its dice hashes of its seed and its count. Every run must reach
// the card.
// burnBot() secures for the burn as a careful marine does: the boots locked on the deck, the three items stowed at the locker by R
// (the scene's hand hook: places/hand.js), then, once the 1MC calls the burn, to the rack's foot and strapped in by R. burnLazyBot()
// pushes off the deck once and floats there, as a marine who does nothing about it (the thrown body's case); burnBootsBot() rides it all on
// his mag boots, never strapped in (v0.0.25's burn polish: the manoeuvre tears his boots off). burnFuzzBot({ seed })
// presses R, the keys, L, the boots and T at random. Both answer the surprise's card (time held on it: the ship's profile's) as a
// player answers it, burnBot with a grab where offered, the fuzz at random. runVoid(game, bot) runs either to its end.
import { anchorsNow } from '../../src/sim/scenarios/anchors.js';
import { burnNow, burnOffer } from '../../src/sim/scenarios/burn.js';
import { gravCardOf } from '../../src/sim/places/gravity.js';
import { stepsOf } from '../../src/sim/arms/shooting.js';
import { beliefOf } from '../../src/sim/arms/firearms.js';
import { turnerTargets } from '../../src/sim/arms/turners.js';
import { contactNow } from '../../src/sim/combat/contact.js';
import { footingOf } from '../../src/sim/body/footing.js';
import { navOf, isFree } from '../../src/sim/places/nav.js';
import { holdNear } from '../../src/sim/places/model.js';
import { handOffer } from '../../src/sim/places/hand.js';
import { instinctNow } from '../../src/sim/skills/instinct.js';
import { hashInt } from '../../src/core/hash.js';
import { valueOf } from '../../src/sim/skills/templates.js';
import { BERTH_SPOTS } from '../../src/data/places/testudo.js';
import { stepAct, pressToward } from './lib.mjs';

/** A decision repeated this many times with the clock still is a stall: the bot throws. */
export const STALL_N = 100;
/** The hold rule's lattice (src/sim/places/model.js holdNear's pad-eyes: 0.75 m + 3 m k both ways), the grab's reach as the bot judges it, a run's tube, metres. */
export const LATTICE = Object.freeze({ at: 0.75, step: 3 }), REACH_M = 0.7, TUBE_M = 0.5;
/** A push from rest along a run this long or longer is Shift's (the faster push), metres; a body slower than this is at rest, m/s; at the mark within this (the pad-eye in the hand's reach), metres. */
export const FAST_RUN_M = 2.5, REST_MS = 0.02, AT_MARK_M = 0.75;
/** A marine whose Zero-g is under this pushes in hops of at most HOP_M (one diagonal of the lattice), metres. */
export const SURE_ZEROG = 4, HOP_M = 4.3;
const DIRS = Object.freeze([[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]].map(([x, z]) => { const n = Math.hypot(x, z); return Object.freeze({ mx: x, mz: z, ux: x / n, uz: z / n }); }));
const posture = (state) => state.people[state.player.id]?.kit?.carry?.posture ?? 'slungFront';
const speed = (me) => Math.hypot(me?.v?.[0] ?? 0, me?.v?.[1] ?? 0);
const isShotRow = (st) => !!st && (st.kind === 'shot' || /^(shot|pair|double|hammer|head|control)/.test(String(st.id)));

// ---- the lattice: the pad-eyes a floating body can stop at, and the runs between them ----

// (every pad-eye of the live area the walker's grid leaves free, as [x, z])
function nodesOf(state) {
  const area = state.places.live.area, g = navOf(state, area, 'C0'), out = [];
  for (let x = LATTICE.at; x < g.x0 + g.nx * g.cellM; x += LATTICE.step) for (let z = LATTICE.at; z < g.z0 + g.nz * g.cellM; z += LATTICE.step) if (isFree(g, x, z)) out.push([x, z]);
  return { g, nodes: out };
}
// (a straight run free on the grid, sampled every 0.2 m)
function clear(g, a, b) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / 0.2));
  for (let i = 1; i <= n; i++) { const t = i / n; if (!isFree(g, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)) return false; }
  return true;
}
const key = (p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
// (the lattice's distance to the goal from every node: a breadth-first search over the eight directions, each step a run between
// two nodes; kept a goal and an area, the grid being the area's static one)
const COSTS = new Map();
function costsTo(state, goal) {
  const ck = `${state.places.live.area}|${key(goal)}`;
  if (COSTS.has(ck)) return COSTS.get(ck);
  const { g, nodes } = nodesOf(state), all = [...nodes, goal], at = new Map(all.map(p => [key(p), p])), cost = new Map([[key(goal), 0]]), queue = [goal];
  while (queue.length) {
    const p = queue.shift(), c = cost.get(key(p));
    for (const d of DIRS) for (let k = 1; k <= 14; k++) {
      const q = [p[0] - d.mx * LATTICE.step * k, p[1] - d.mz * LATTICE.step * k], qk = key(q);
      if (!at.has(qk)) { if (!isFree(g, q[0], q[1])) break; continue; }
      if (!clear(g, q, p)) break;
      const nc = c + Math.hypot(q[0] - p[0], q[1] - p[1]) + 1;
      if (!cost.has(qk) || cost.get(qk) > nc) { cost.set(qk, nc); queue.push(q); }
    }
  }
  const out = { g, cost, list: [...cost.keys()].map(k => [at.get(k), cost.get(k)]) };
  COSTS.set(ck, out);
  return out;
}
/**
 * The push to make from where a body rests toward a goal (see the header): { mx, mz, to: [x, z], runM } for the best of the eight
 * directions whose run passes within TUBE_M of a node with a way on to the goal, or null where none does.
 */
export function pushToward(state, me, goal, tube = TUBE_M, capM = Infinity) {
  const { g, list } = costsTo(state, goal), cands = [];
  for (const d of DIRS) for (const [p, cost] of list) {
    const dx = p[0] - me.x, dz = p[1] - me.z, along = dx * d.ux + dz * d.uz, off = Math.abs(dx * d.uz - dz * d.ux);
    if (along < 0.3 || along > capM || off > tube) continue;
    cands.push({ c: along + off * 4 + cost, mx: d.mx, mz: d.mz, to: p, runM: along });
  }
  cands.sort((a, b) => a.c - b.c);
  return cands.find(x => clear(g, [me.x, me.z], x.to)) ?? null;
}

// ---- test-anchors ----

/** The anchors bot (see the header). */
export function anchorsBot({ mode = 'keys' } = {}) {
  return (state, me, mem) => {
    mem.log ??= [];
    const N = anchorsNow(state);
    if (!N || N.end) { mem.done = true; return {}; }
    if (state.skip || contactNow(state)?.pending) return {};
    const S = state.stop, pid = state.player.id, st = N.station, now = state.clock.ms;
    const choose = (step, tempo = 'normal', target = null) => {
      const k = `${now}|${step}|${target ?? ''}`;
      mem.same = mem.lastKey === k ? (mem.same ?? 0) + 1 : 0; mem.lastKey = k;
      if (mem.same >= STALL_N) throw new Error(`anchors bot: '${step}' chosen ${STALL_N} times at ${now} (station ${st?.n}, ${N.phase}; offered ${stepsOf(state).filter(x => !x.off).map(x => x.id).join(', ')})`);
      mem.log.push({ atMs: now, step, st: st?.n ?? null, phase: N.phase }); if (mem.log.length > 300) mem.log.splice(0, mem.log.length - 300);
      return { act: [stepAct(step, tempo, target)] };
    };
    const F = footingOf(state, pid);
    // (a row of the panel wanted out of the mode (the boots, an anchor): G, then the row in the mode (inMode), then X)
    const viaMode = (id) => { mem.want = { id, atMs: now }; if (mem.gAtMs !== undefined && now - mem.gAtMs < 400) return {}; mem.gAtMs = now; return { act: ['ready'] }; };
    mem.viaMode = true;
    // (T: the instinct's act where it offers one (A's "Anchor before you fire." first), as the page sends it)
    if (mode === 'T' && !S) {
      const I = instinctNow?.(state), line = I?.line;
      if (line?.act && line.act !== mem.lastT) { mem.lastT = line.act; return { act: [{ act: 'instinct', args: { id: line.id, act: line.act } }] }; }
    }
    if (S?.reflex) return choose(`reflex:${S.reflex.options?.find(o => /ia|tap/.test(o.key))?.key ?? S.reflex.options?.[0]?.key ?? 'ia'}`);
    if (S && S.mode === 'stop') return inMode(state, me, mem, N, choose);
    if (!st) return {};
    // (the string and its standby: G, the mode, and its Wait there)
    if (N.phase === 'standby' || N.phase === 'string') { if (mem.gAtMs !== undefined && now - mem.gAtMs < 400) return {}; mem.gAtMs = now; return { act: ['ready'] }; }
    // (the floating string's drift: the first hold the body passes within reach, a pad-eye in the deck as the floor shows them)
    if (N.phase === 'drift') return F.anchor === 'floating' && mem.grabAtMs !== now && (speed(me) < REST_MS || holdNear(state, me.x, me.z, REACH_M)) ? grabNow(mem, now) : {};
    if (N.phase !== 'move') return {};
    return moveTo(state, me, mem, st, F, viaMode, now);
  };
}
// (L, at most once a tick)
function grabNow(mem, now) { mem.grabAtMs = now; return { act: ['grab'] }; }
// (drifting: the grab at the run's end, nearest it (within 0.2 m, or the drift past its closest); a run gone wide (the drift past its
// closest out of reach of it), the first hold in reach on the way, the pad-eyes on the floor; or where the body has met a face)
function grabNear(state, me, mem, now) {
  const to = mem.run?.to;
  if (me.push) return {};
  if (to) {
    const d = Math.hypot(me.x - to[0], me.z - to[1]), best = mem.run.best ?? Infinity;
    mem.run.best = Math.min(best, d);
    if (d <= 0.2 || (d > best + 0.02 && best <= REACH_M)) return grabNow(mem, now);
    if (d > best + 0.02 && best > REACH_M && holdNear(state, me.x, me.z, REACH_M)) return grabNow(mem, now);
  }
  if (speed(me) < REST_MS) return grabNow(mem, now);
  return {};
}

// (out of the mode, the station's move (see the header); choose: a row by way of the mode)
function moveTo(state, me, mem, st, F, choose, now) {
  const dM = Math.hypot(me.x - st.mark[0], me.z - st.mark[1]);
  if (st.want === 'magBoots') {
    if (F.hold !== 'boots') return choose('boots:lock');
    return dM > 0.25 ? pressToward(me, st.mark) : {};
  }
  if (F.hold === 'boots') return choose('boots:release');
  const atMark = dM <= AT_MARK_M, held = ['handhold', 'tether', 'braced'].includes(F.hold);
  if (atMark && st.want !== 'floating') {
    if (speed(me) > REST_MS && !held) return grabNow(mem, now);
    if (held && F.hold !== st.hold) return choose('anchor:letgo');
    if (!held) return choose(st.hold === 'tether' ? 'anchor:clip' : st.hold === 'braced' ? 'anchor:wedge' : 'anchor:hold');
    // (the gun the station wants not in the hands (the P-12 for station three, the R-7 after it): the mode, for Transition or Rifle up)
    if (!st.ready?.gun) { if (mem.gAtMs !== undefined && now - mem.gAtMs < 400) return {}; mem.gAtMs = now; return { act: ['ready'] }; }
    return {};
  }
  if (atMark && st.want === 'floating') {
    // (the floating station: stopped at the mark by a grab, then off it into the open, south, the walk's push)
    if (speed(me) > REST_MS && !held) return me.push ? {} : grabNow(mem, now);
    if (!held && mem.offMark !== st.n) return grabNow(mem, now);
    mem.offMark = st.n;
    mem.run = { to: [st.mark[0], st.mark[1] + 12] };
    return { mx: 0, mz: 1 };
  }
  // (drifting: the grab at the run's end; at rest: the next run, letting go of a hold by the push itself)
  if (speed(me) > REST_MS) return grabNear(state, me, mem, now);
  if (held && F.hold !== 'handhold') return choose('anchor:letgo');
  // (no run in the tube from here (a push that missed left you off the lattice, at a face): the widest the grab reaches, else the keys
  // toward the mark with the mark as the run's end)
  // (a marine short of Zero-g pushes in hops, a node at a time: a push he misses goes off by 5° a point, and a long run so far wide)
  const capM = valueOf(state, state.player.id, 'zerog') >= SURE_ZEROG ? Infinity : HOP_M;
  const p = pushToward(state, me, st.mark, TUBE_M, capM) ?? pushToward(state, me, st.mark, REACH_M, capM) ?? pushToward(state, me, st.mark, REACH_M);
  if (!p) { mem.noPush = (mem.noPush ?? 0) + 1; mem.run = { to: [...st.mark] }; return pressToward(me, st.mark); }
  mem.run = { to: p.to, runM: p.runM };
  return { mx: p.mx, mz: p.mz, ...(p.runM >= FAST_RUN_M && capM === Infinity ? { run: true } : {}) };
}

// (in the mode: the string, the pistol's Transition, the waits; X once nothing is wanted here)
function inMode(state, me, mem, N, choose) {
  const S = state.stop, st = N.station, pid = state.player.id;
  if (S.phase !== 'choose' && S.doing?.kind !== 'wait') return {};
  const steps = stepsOf(state), has = (id) => steps.some(x => x.id === id && !x.off);
  const gunId = S.gun, b = gunId ? beliefOf(state, gunId) : {};
  // (the row G was pressed for (the boots, an anchor), once and fresh (a second's), and still wanted (a letting go only while the hold
  // is not the station's); then X)
  if (mem.want) {
    const w = mem.want; delete mem.want;
    const F = footingOf(state, pid), still = state.clock.ms - (w.atMs ?? 0) <= 1000 && !(w.id === 'anchor:letgo' && F.hold === st?.hold);
    if (still && has(w.id)) return choose(w.id);
  }
  if (b.stoppage && has('macro:ia')) return choose('macro:ia');
  if (['slungFront', 'slungBack'].includes(posture(state)) && has('up') && st?.gun !== 'pistol') return choose('up');
  if (st?.gun === 'pistol' && has('weapon:transition')) return choose('weapon:transition');
  if (st?.gun === 'rifle' && has('weapon:rifle-up')) return choose('weapon:rifle-up');
  if (N.phase === 'standby') return S.doing?.kind === 'wait' ? {} : has('wait') ? choose('wait') : {};
  if (N.phase === 'string') {
    // (the station's turner facing you, as the picture shows it: shot at whether the take-in paused on it or not (at 20 m in the well's
    // light it may not: the detector's own sight))
    const T = turnerTargets(state, state.clock.ms).find(t => t.lane === st.lane && t.facingK >= 0.5 && !t.down);
    if (!T) return S.doing?.kind === 'wait' ? {} : has('wait') ? choose('wait') : {};
    if (S.pick !== T.key && has(`pick=${T.key}`)) return choose(`pick=${T.key}`);
    const rows = steps.filter(isShotRow).filter(x => (x.target ?? S.pick) === T.key), open = rows.find(x => !x.off);
    if (open) return choose(open.id, 'normal', T.key);
    if (b.mode === 'safe' && has('selector:semi')) return choose('selector:semi');
    if (S.aim?.key !== T.key && has('aim')) return choose('aim', 'normal', T.key);
    if (has('fire')) return choose('fire');
    return has('wait') ? choose('wait') : {};
  }
  // (the move, the drift, the gap: out of the mode (X, which cuts a chained wait too), but the pistol's station waits there for its
  // standby)
  if (N.phase === 'move' && st?.ready?.ok) return S.doing?.kind === 'wait' ? {} : has('wait') ? choose('wait') : {};
  if (mem.xAtMs === state.clock.ms) return {};
  mem.xAtMs = state.clock.ms;
  return { act: ['shoot'] };
}


/** The fuzz bot for test-anchors (see the header). */
export function voidFuzzBot({ seed = 1 } = {}) {
  return (state, me, mem) => {
    mem.n ??= 0; mem.steps ??= {};
    const N = anchorsNow(state);
    if (!N || N.end) { mem.done = true; return {}; }
    if (state.skip) return {};
    const die = (k) => hashInt(k, 'void-fuzz', seed, mem.n++), count = (id) => { mem.steps[id] = (mem.steps[id] ?? 0) + 1; };
    if (contactNow(state)?.pending) { count('mash'); return { mx: die(3) - 1, mz: die(3) - 1 }; }
    const S = state.stop, now = state.clock.ms;
    if (!S) {
      if (mem.walk) { if (now >= mem.walk.untilMs) { delete mem.walk; return {}; } return { mx: mem.walk.mx, mz: mem.walk.mz, ...(mem.walk.run ? { run: true } : {}) }; }
      if (mem.outUntil === undefined) mem.outUntil = now + die(2000);
      if (now < mem.outUntil) return {};
      delete mem.outUntil;
      const r = die(10);
      if (r < 5) { count('walk'); mem.walk = { untilMs: now + 200 + die(2500), mx: die(3) - 1, mz: die(3) - 1, run: die(4) === 0 }; return {}; }
      if (r < 7) { count('grab'); return { act: ['grab'] }; }
      if (r < 8) { count('T'); return { act: ['instinct'] }; }
      const live = ['boots:lock', 'boots:release', 'anchor:hold', 'anchor:clip', 'anchor:wedge', 'anchor:letgo'][die(6)];
      count(live);
      return die(2) ? { act: [stepAct(live)] } : { act: ['ready'] };
    }
    if (S.reflex) { const o = S.reflex.options[die(S.reflex.options.length)]; count(`reflex:${o.key}`); return { act: [stepAct(`reflex:${o.key}`)] }; }
    if (S.mode !== 'stop') return {};
    if (S.phase !== 'choose' && !(S.doing?.kind === 'wait' && die(10) === 0)) return {};
    const steps = stepsOf(state).filter(x => !x.off && !isShotRow(x) && x.id !== 'fire' && !String(x.id).startsWith('reflex:'));
    if (!steps.length) return {};
    const w = steps.map(x => (x.id === 'leave' ? 3 : 1));
    let roll = die(w.reduce((a, c) => a + c, 0)), k = 0;
    while (roll >= w[k]) roll -= w[k++];
    count(steps[k].id);
    return { act: [stepAct(steps[k].id)] };
  };
}

// ---- test-burn ----

// (the surprise's card held on the ship's profile (places/gravity.js gravCardOf), answered as the page sends a digit: a bot's choice of
// its options, a grab first where it offers one)
function cardAnswer(state, pick) {
  const card = gravCardOf(state);
  if (!card?.options?.length) return null;
  const o = pick(card.options);
  return { act: [{ act: 'grav', args: { card: o.key } }] };
}

/** The burn bot (see the header). */
export function burnBot() {
  return (state, me, mem) => {
    const B = burnNow(state);
    if (!B || B.end) { mem.done = true; return {}; }
    const c = cardAnswer(state, (os) => os.find(o => o.key === 'grab') ?? os.find(o => o.key === 'feet') ?? os[0]);
    if (c) return c;
    if (state.skip || state.stop) return state.stop?.mode === 'stop' ? { act: [stepAct('leave')] } : {};
    const pid = state.player.id, F = footingOf(state, pid), now = state.clock.ms;
    // (R where the scene offers an act: never at its struck plate, "Stand by for the burn", where R does nothing)
    const R = () => { const o = handOffer(state); if (o?.verb === 'scene' && !burnOffer(state)?.off && mem.rAtMs !== now) { mem.rAtMs = now; return { act: ['hand'] }; } return null; };
    if (B.doing) return {};
    if (B.strapped) return {};
    // (on the deck: the boots locked first (R, the berth's), the walk on them)
    if (F.hold !== 'boots' && !B.strapped) return R() ?? {};
    // (stowed, the boots hold it at the locker until the 1MC calls the burn: then to the rack's foot and strapped in)
    const goal = B.left || !B.warn ? BERTH_SPOTS.locker.spot : BERTH_SPOTS.rack.foot;
    if (Math.hypot(me.x - goal[0], me.z - goal[1]) > 0.25) return pressToward(me, goal);
    // (at the locker: stow, one an R; at the rack's foot: strap in once the 1MC calls the burn, or at once with all stowed)
    if (B.left) return R() ?? {};
    if (B.warn) return R() ?? {};
    return {};
  };
}

/**
 * The booted marine for test-burn (v0.0.25's burn polish): the burn bot's way on his mag boots but never strapped in, his three items
 * stowed and his boots locked at the locker through the whole profile, so the warned 3 G manoeuvre tears them off the deck; the
 * surprise's card answered with a grab where offered, his boots locked again by R once he is still.
 */
export function burnBootsBot() {
  return (state, me, mem) => {
    const B = burnNow(state);
    if (!B || B.end) { mem.done = true; return {}; }
    const c = cardAnswer(state, (os) => os.find(o => o.key === 'grab') ?? os[0]);
    if (c) return c;
    if (state.skip || state.stop || B.doing) return {};
    const now = state.clock.ms;
    const R = () => { const o = handOffer(state); if (o?.verb === 'scene' && !burnOffer(state)?.off && burnOffer(state)?.id !== 'strap' && mem.rAtMs !== now) { mem.rAtMs = now; return { act: ['hand'] }; } return null; };
    if (footingOf(state, state.player.id).hold !== 'boots') return R() ?? {};
    const goal = BERTH_SPOTS.locker.spot;
    if (Math.hypot(me.x - goal[0], me.z - goal[1]) > 0.25) return pressToward(me, goal);
    return B.left ? R() ?? {} : {};
  };
}

/** The lazy marine for test-burn (see the header): one push off the deck, the slowest, then nothing. */
export function burnLazyBot() {
  return (state, me, mem) => {
    if (mem.pushed) return {};
    mem.pushed = true;
    return { mx: 1, mz: 0, stroll: true };
  };
}

/** The fuzz bot for test-burn (see the header). */
export function burnFuzzBot({ seed = 1 } = {}) {
  return (state, me, mem) => {
    mem.n ??= 0; mem.steps ??= {};
    const B = burnNow(state);
    if (!B || B.end) { mem.done = true; return {}; }
    if (state.skip) return {};
    const die = (k) => hashInt(k, 'burn-fuzz', seed, mem.n++), count = (id) => { mem.steps[id] = (mem.steps[id] ?? 0) + 1; }, now = state.clock.ms;
    const c = cardAnswer(state, (os) => os[die(os.length)]);
    if (c) { count('card'); return c; }
    if (state.stop?.reflex) { const o = state.stop.reflex.options[die(state.stop.reflex.options.length)]; count('reflex'); return { act: [stepAct(`reflex:${o.key}`)] }; }
    if (state.stop?.mode === 'stop') { count('leave'); return { act: [stepAct('leave')] }; }
    if (mem.walk) { if (now >= mem.walk.untilMs) { delete mem.walk; return {}; } return { mx: mem.walk.mx, mz: mem.walk.mz }; }
    if (mem.outUntil === undefined) mem.outUntil = now + die(1500);
    if (now < mem.outUntil) return {};
    delete mem.outUntil;
    const r = die(12);
    if (r < 5) { count('walk'); mem.walk = { untilMs: now + 200 + die(2000), mx: die(3) - 1, mz: die(3) - 1 }; return {}; }
    if (r < 8) { count('R'); return { act: ['hand'] }; }
    if (r < 9) { count('grab'); return { act: ['grab'] }; }
    if (r < 10) { count('T'); return { act: ['instinct'] }; }
    count('R');
    return { act: ['hand'] };
  };
}

/** Runs a void scene's bot to its end (or maxTicks): { ticks, done }. view: anchorsNow or burnNow. */
export function runVoid(game, bot, { view = anchorsNow, maxTicks = 20 * 60 * 15 } = {}) {
  let n = 0;
  for (; n < maxTicks && !view(game.state)?.end; n++) game.step(1, bot);
  return { ticks: n, done: !!view(game.state)?.end };
}
