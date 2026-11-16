// OLYMPUS arms: the planner, the shortest honest way from the gun as its holder believes it to the gun ready, for any gun (WEAPONS §5.3; the build sheet 0.0.18 §2.1).
//
// The user, 2026-11-15: the handling options come from the gun's believed state, for any gun. Before this module each offer had
// its own hand-written condition over the belief (drills.js macrosFor, specials.js reloadRows, panel.js REMEDY, groups.js fixOf,
// firearms.js canDo), and between them one state was a dead end: a magazine believed empty in a closed, empty rifle, with full
// magazines in the pouches (MAKE READY needs rounds believed in, RELOAD a locked bolt, Top up rounds; Fix said "nothing offered
// now"). The planner searches instead, and the offers keep their predicates and take their paths from it.
//
// **The state** (Abs, absOf) is the belief abstracted to what a path depends on: the model; the carry (a rifle 'ready' or 'slung',
// hanging while the pistol is out counting as slung; a pistol in the 'hand' or in its 'holster'); the magazine in or out and its
// believed count as a bucket ('0' believed empty or felt so, '+' some, '?' unknown); the chamber, the bolt locked, the stoppage,
// the selector and the hammer as beliefOf gives them; a magazine in the hand of this gun's families (its bucket, or 'x' for a
// magazine of another gun's); the two best magazines a reach by rule would take (kit.js rankOf over every pouch, the dump's
// too, best first); the best at the feet; room in the dump pouch and in a pouch that takes this gun's magazine. It reads
// beliefOf and the kit's readers only, never the truth, so the planner knows what the holder knows. absKey is its key, a string.
//
// **A step** (stepAbs) is firearms.js act() itself, forced to pass, on a witness gun and magazines built from the belief alone (the
// truth the holder expects: an unknown count holds five, a click a dud in the chamber, a stoppage felt a case in the port, the
// hammer as it is felt), with
// a fixed rng re-seeded on every call and never state.rng, so no state is touched and a plan is the same wherever it is asked.
// The item moves doAction makes (firearms.js's magazine block) are mirrored on the abstraction in movesAbs, and the plan-walk
// suite holds that mirror equal to doAction on a real state. A table of effects would have been a second copy that drifts.
//
// **The search** (plan) is a Dijkstra on a binary heap over the planned edges, costed at the base pace (BASE_ROLLER, Weapon
// handling 10: actionMs × MS_K plus the action's RANK weighted by how early it comes, so equal times fall to the doctrine's order: the magazine out, the reach, the
// seat, the bolt), at most PLAN_POPS pops. The guards come first: a slung rifle comes up ('up'), a holstered pistol is drawn
// ('draw:thigh'), a stoppage gets only IMMEDIATE ACTION or, for a double feed, REMEDIAL ACTION (each one compound edge whose
// sub-steps are drills.js subsOf's), and a chamber unknown with no stoppage gets the look first (observe on a locked bolt, else
// a press check; marked sense, and the panel plans again from what the look shows). That last is v0.0.17's REMEDY for "chamber
// unknown" made a rule: a bolt let go onto a round left behind it by a fumbled lock back is a double feed (the user may prefer
// Charge at once: the build sheet's question 1). Never planned: auto, rack, magIn, clearDouble, the strip, the function check,
// the show, the port, the finger, the postures, the dial, the lever and the read. honestNone answers "no round believed
// anywhere" before any search, the slow case.
//
// **The goals:** 'fire' (the gun in the hands, a round believed chambered, the bolt home, no stoppage, off safe, with a magazine
// of rounds in where one is to be had: the chamber's plan then the selector last, as the thumb comes off safe on the target; a
// round behind a locked bolt over an empty magazine is RELOAD, never the empty dropped and the bolt let go to fire one), 'fed' (the reload slot's RELOAD: fire without the
// selector, with a magazine in not believed empty), 'retain' (fed, the magazine never dropped: RELOAD, keep the empty) and
// 'topup' (a magazine from the pouches or the hand seated, the bolt left as it was: Top up, the magazine in first to a pouch).
// nameOf names a path for the panel by the ids it already has (macro:reload:speed, retain, tactical, macro:ia, macro:remedial,
// and the singles), so every bot, the instinct and the gauges key on the same rows. planFor is the state's way in, its ms by
// the holder's own roller; readyPath and gunRows are the sidearm's (a gun's way to ready as if in the hands, and its rows).
//
// v0.0.19 (the build sheet 0.0.19 §3.1; kit2 §2.2), **guard 0, the hands first**: in planFor, for the goals fire, fed, retain
// and topup, a device in the hands (devplan.js handsPath: a grenade, a charge or a tool) puts its way out first, so a plan's
// `path` opens with the device's acts (the pin back in, the pouch, a tool let go; a live grenade's throw) and then the gun's;
// `subs`, what the hands run through firearms.js, stays the gun's alone, and `hands` carries the device's way. Fix's plan (no
// purpose) is named by the device's row (devplan.js devNameOf: "Pin back in" before the rifle's Charge or RELOAD); a reload's
// row keeps its purpose's name. With the hands empty nothing changes, so every lane without a device in hand is v0.0.18's.
// The memo (PLANS, keyed by the goal and the key) is runtime only and the search is a pure function of its key, so a hit and a
// miss give the same plan (the plan suite holds it); it is cleared past PLAN_MEMO_MAX. Pure.
import { act, actionMs, beliefOf, gunField, actionKey, pull, feel, ready as readyTruth } from './firearms.js';
import { pouchesOf, handMagOf, handGunOf, atFeetOf, dumpOf, believedN, rankOf, meantLoad } from './kit.js';
import { MODELS, modelOf, isLong } from './models.js';
import { SLUNG } from './carry.js';
import { fixedRoller, rollerOf } from '../combat/roll.js';
import { seedRng } from '../../core/rng.js';
import { subsOf } from './macros.js';
import { wordsOf } from './gunwords.js';
import { RELOAD_LABELS, MAG_IN_LABEL } from './specials.js';
import { handsPath, devNameOf } from './devplan.js';

/** The goals (see the header). */
export const GOALS = Object.freeze(['fire', 'fed', 'retain', 'topup']);
/** A search's cap (pops; my call: the worst seen uncapped was 1,200, every one a search that ends in no plan). */
export const PLAN_POPS = 600;
/** The memo's size before it is cleared (my call). */
export const PLAN_MEMO_MAX = 4096;
/** The witness's rng seed (any fixed integer). */
export const PLAN_SEED = 18;
/** The pace a plan is costed at (Weapon handling 10, the base): equal everywhere, so a plan is the same for every holder. */
export const BASE_ROLLER = fixedRoller({ weapons: 10, awareness: 14, marksmanship: 10, fitness: 13 });
/** The reload purposes by goal, and the goals by purpose (specials.js RELOAD_PURPOSE's words). */
export const GOAL_OF = Object.freeze({ speed: 'fed', retain: 'retain', tactical: 'topup' });
const PURPOSE_OF = Object.freeze({ fed: 'speed', retain: 'retain', topup: 'tactical' });

// ---- the abstraction ----

const N_OF = Object.freeze({ '0': 0, '+': 5, '?': 5 });
const BUCKET_RANK = Object.freeze({ '+': 0, '?': 1, '0': 2 });
const countBucket = (n) => (typeof n !== 'number' ? '?' : n === 0 ? '0' : '+');
/** A magazine's bucket as its holder believes it: '0' counted empty or felt so, '?' unknown, else '+'. */
export const magBucket = (m) => (believedN(m) === 0 || m?.belief?.feel === 'none' ? '0' : believedN(m) === null && !m?.belief?.feel ? '?' : '+');
const rounds = (x) => x === '+' || x === '?';

/**
 * The gun as its holder believes it, abstracted (see the header): a frozen Abs, or null. carry 'hands': as if the gun were in the
 * hands (the rifle ready, the pistol drawn), for a gun's way to ready before it is taken up.
 */
export function absOf(state, pid, gunId, { carry = null } = {}) {
  const g = state.items?.[gunId], kit = state.people?.[pid]?.kit, M = modelOf(g), b = beliefOf(state, gunId);
  if (!g || !kit || !M || !b) return null;
  const fams = M.fams ?? [], ok = (id) => fams.includes(state.items[id]?.fam);
  let c;
  if (isLong(M)) {
    const other = handGunOf(state, pid), posture = kit.carry?.posture ?? 'slungFront';
    c = (other && other !== gunId) || SLUNG.has(posture) ? 'slung' : 'ready';
  } else c = kit.worn?.holster === gunId ? 'holster' : 'hand';
  if (carry === 'hands') c = isLong(M) ? 'ready' : 'hand';
  const h = handMagOf(state, pid), hm = h ? state.items[h.id] : null;
  const pouches = pouchesOf(state, pid), ids = pouches.flatMap(p => p.mags).filter(ok);
  const pool = rankOf(state, ids, { load: meantLoad(state) }).slice(0, 2).map(id => magBucket(state.items[id]));
  // (the best magazine at the feet, as the abstraction keeps one (movesAbs): a reach there takes the nearest, and its weight says if it was another)
  const feet = atFeetOf(state, pid).filter(l => ok(l.id)).map(l => magBucket(state.items[l.id])).sort((x, y) => BUCKET_RANK[x] - BUCKET_RANK[y])[0] ?? null;
  const room = pouches.some(p => !p.dump && p.room > 0 && (!p.fams || p.fams.some(f => fams.includes(f))));
  return Object.freeze({
    model: g.model, carry: c, mag: b.mag === 'in' ? 'in' : 'out', n: b.mag === 'in' ? countBucket(b.count) : null,
    ch: b.chamber ?? '?', lk: !!b.locked, st: b.stoppage ?? null, mode: b.mode === '?' ? 'safe' : b.mode, ck: !!b.cocked,
    hand: hm ? (fams.includes(hm.fam) ? magBucket(hm) : 'x') : null, pool: Object.freeze(pool), ground: feet,
    dump: !!dumpOf(state, pid), room,
  });
}
/** An Abs's key (a string; the topup search's own flag after it). */
export const absKey = (a) => `${a.model}|${a.carry}|${a.mag}${a.n ?? '-'}|${a.ch}|${a.lk ? 'L' : '-'}|${a.st ?? '-'}|${a.mode}|${a.ck ? 'c' : '-'}|${a.hand ?? '-'}|${a.pool.join('') || '-'}|${a.ground ?? '-'}|${a.dump ? 'd' : '-'}${a.room ? 'r' : '-'}${a.sw ? '|sw' : ''}`;
/** Whether no round is believed anywhere: none chambered or unsure (a stoppage's not counted), the magazine in believed empty or out, nothing with rounds in the hand, the pouches or at the feet. */
export function honestNone(a) {
  // (a round in a stoppage's chamber is the drill's to clear, never one to fire: IMMEDIATE ACTION throws it out with no magazine under it)
  return !((a.ch === 'live' || a.ch === '?') && !a.st) && !(a.mag === 'in' && rounds(a.n)) && !rounds(a.hand) && !a.pool.some(rounds) && !rounds(a.ground);
}

// (the truth the holder expects, from the belief alone (see the header))
const magW = (fam, b) => ({ type: 'mag', fam, n: N_OF[b] ?? 5, ...(b === '?' ? {} : { belief: { n: N_OF[b] ?? 5 } }) });
function witnessOf(a) {
  const M = MODELS[a.model], fam = M.fams[0];
  // (the witness's own magazine named in the record as it is made: kit.move is the one writer of a real holder)
  const gun = { type: 'gun', model: a.model, cond: 0.93, ...(a.mag === 'in' ? { mag: 'w:in' } : {}) }, B = { chamber: a.ch };
  if (a.mode !== 'safe') gun.mode = a.mode;
  if (!a.ck) gun.cocked = false;
  if (a.lk) { gun.locked = true; B.locked = true; }
  if (a.st) B.stoppage = a.st;
  const ch = { live: 'live', dud: 'dud', case: 'case' }[a.ch];
  if (ch) gun.chamber = ch;
  if (a.st === 'double') { gun.jam = 'double'; gun.chamber = 'case'; }
  else if (a.st === 'case' || a.st === 'felt') gun.chamber = 'case';
  else if (a.st === 'click') gun.chamber = 'dud';
  let mag = null;
  if (a.mag === 'in') { mag = magW(fam, a.n); delete mag.belief; if (a.n !== '?') B.count = N_OF[a.n]; }
  gun.belief = B;
  return { gun, mag, fam };
}
const reAbs = (a, gun, o) => {
  const B = gun.belief ?? {}, mag = o.mag ?? a.mag;
  return { ...a, ...o, mag, n: mag === 'in' ? countBucket(typeof B.count === 'number' ? B.count : null) : null, ch: B.chamber ?? '?', lk: !!B.locked, st: B.stoppage ?? null,
    mode: gunField(gun, 'mode'), ck: !!gunField(gun, 'cocked') };
};
const sortPool = (pool) => pool.filter(Boolean).sort((x, y) => BUCKET_RANK[x] - BUCKET_RANK[y]).slice(0, 2);

/**
 * One action on the abstraction (see the header): act() forced to pass on the witness, then the item moves doAction makes
 * (movesAbs); null where act refuses or the action needs what the abstraction has not (no magazine to reach, no room).
 * grade: a test's other grade ('miss', 'disaster': the walk's), the moves of a fumble mirrored too.
 */
export function stepAbs(a, action, { grade = 'pass' } = {}) {
  const key = actionKey(action), place = action.includes('@') ? action.slice(action.indexOf('@') + 1) : null;
  const w = witnessOf(a), ctx = { pressure: 'evaluated', tempo: 'normal', posture: a.carry === 'slung' ? 'slungFront' : 'lowReady', force: { [action]: grade } };
  if (a.hand) ctx.held = { id: 'w:held', mag: a.hand === 'x' ? { type: 'mag', fam: '?', n: 5, belief: { n: 5 } } : magW(w.fam, a.hand), hand: 1 };
  if (key === 'reach') { const src = place === 'ground' ? a.ground : a.pool[0]; if (src) ctx.reach = { id: 'w:reach', mag: magW(w.fam, src), from: place ?? 'p1' }; }
  if (action === 'magIn') { const src = a.hand && a.hand !== 'x' ? a.hand : a.pool[0]; ctx.spares = src ? [{ id: 'w:spare', mag: magW(w.fam, src) }] : []; }
  if (key === 'stowMag' && a.room) ctx.to = 'w:pouch';
  if (key === 'dumpMag' && a.dump) ctx.to = 'w:dump';
  if (key === 'seat' && a.hand === 'x') return null;
  if (action === 'magOut:dump' && !a.dump && grade === 'pass') return null;
  if (action === 'magOut:pouch' && !a.room && !a.dump && grade === 'pass') return null;
  const r = act(seedRng(PLAN_SEED), BASE_ROLLER, w.gun, w.mag, action, ctx);
  if (r.refused) return null;
  return Object.freeze(movesAbs(a, r, { w, ctx, action, key, place }));
}
// (doAction's item block on the abstraction (firearms.js doAction, the magazines by kit.move): the plan-walk suite holds it equal)
function movesAbs(a, r, { w, ctx, action, key, place }) {
  let pool = [...a.pool], hand = a.hand, ground = a.ground, carry = a.carry, mag = a.mag;
  // (a magazine to the feet: the ground keeps the best one there, so a magazine of rounds is never lost to the abstraction)
  const out = (b) => { if (b && (ground === null || BUCKET_RANK[b] < BUCKET_RANK[ground])) ground = b; };
  if (r.magOut && a.mag === 'in') {
    const mb = r.unsureMag || !w.mag ? '?' : magBucket(w.mag);
    // (the strip into the other hand: a pistol's holder has none free with a magazine already held, and it falls)
    if (r.magOut === 'hand') { if (a.hand && !isLong(MODELS[a.model])) out(mb); else hand = mb; }
    else if (r.magOut === 'drop') out(mb);
    else if (r.magOut === 'dump') { if (a.dump || a.room) pool.push(mb); else out(mb); }
    else if (r.magOut === 'pouch') { if (a.room || a.dump) pool.push(mb); else out(mb); }
    mag = 'out';
  }
  if (r.magIn) {
    if (r.dropSpare) { if (action === 'magIn' && a.hand && a.hand !== 'x') { out(a.hand); hand = null; } else { out(pool[0]); pool = pool.slice(1); } }
    else { mag = 'in'; if (key === 'seat' || (action === 'magIn' && a.hand && a.hand !== 'x')) hand = null; else pool = pool.slice(1); }
  }
  if (r.reach) { if (place === 'ground') ground = null; else pool = pool.slice(1); hand = magBucket(ctx.reach.mag); }
  if (r.stowTo) { pool.push(hand); hand = null; }
  if (r.dropHeld && hand) { out(hand); hand = null; }
  if (r.posture) carry = SLUNG.has(r.posture) ? 'slung' : isLong(MODELS[a.model]) ? 'ready' : carry;
  if (key === 'draw:thigh') carry = 'hand';
  if (key === 'holster') carry = 'holster';
  return reAbs(a, w.gun, { pool: Object.freeze(sortPool(pool)), hand, ground, carry, mag });
}

// ---- the search ----

/** The planned edges, in RANK's order (the doctrine's at equal times: the magazine out, the reach, the seat, the bolt, then the rest). */
const PLANNED = Object.freeze(['magOut:drop', 'magOut:dump', 'magOut:pouch', 'reach', 'reach@ground', 'seat', 'charge', 'release', 'stowMag', 'dumpMag', 'dropMag', 'lockBack']);
const RANK = Object.freeze(Object.fromEntries([...PLANNED, 'ia', 'remedial', 'up', 'draw:thigh'].map((x, i) => [x, i])));
// (a step's cost: its base ms × MS_K, then its RANK weighted by how early it comes (RANK_DEPTH less its depth), so of two paths of
// the same actions and the same time the one with the doctrine's order wins (the rearrangement inequality): the magazine out before
// the reach for RELOAD, keep the empty, as the templates have it; MS_K keeps a millisecond above any sum of ranks)
const MS_K = 65536, RANK_DEPTH = 16;
const BANNED = Object.freeze({ retain: new Set(['magOut:drop', 'dropMag']), topup: new Set(['charge', 'release', 'lockBack', 'magOut:drop', 'dropMag']) });
const live = (a) => (a.carry === 'ready' || a.carry === 'hand') && a.ch === 'live' && !a.lk && !a.st;
const fed = (a) => live(a) && a.mag === 'in' && a.n !== '0';
const spares = (a) => rounds(a.hand) || a.pool.some(rounds) || rounds(a.ground);
const MET = Object.freeze({
  // (arm: fire's chamber, with a magazine of rounds in where one is to be had: never the last round fired off an empty dropped)
  live, arm: (a) => fed(a) || (live(a) && !spares(a)), fire: (a) => MET.arm(a) && a.mode !== 'safe',
  fed: (a) => live(a) && a.mag === 'in' && a.n !== '0', retain: (a) => live(a) && a.mag === 'in' && a.n !== '0',
  topup: (a) => !!a.sw && a.mag === 'in' && a.n !== '0',
});
// (the belief subsOf reads, from the abstraction: the compound edges' sub-steps as drills.js gives them)
const beliefLike = (a) => ({ model: a.model, mag: a.mag, chamber: a.ch, locked: a.lk, stoppage: a.st, cocked: a.ck, hand: a.hand ? {} : null, count: a.n === '0' ? 0 : a.n === '+' ? 5 : null });
const edgeMs = (a, x) => actionMs(BASE_ROLLER, { model: a.model }, x, { posture: a.carry === 'slung' ? 'slungFront' : 'lowReady' });
// (a compound edge: its sub-steps through stepAbs in order, a refused one skipped as the macro's runMacro would halt; its cost the sum)
function compound(a, id) {
  let c = a, ms = 0;
  for (const x of subsOf(id, beliefLike(a))) { const n = stepAbs(c, x); if (!n) continue; ms += edgeMs(c, x); c = n; }
  return { to: c, ms };
}
// (the edges out of a state for a goal, the guards first)
function edgesOf(a, goal) {
  if (a.carry === 'slung') return ['up'];
  if (a.carry === 'holster') return ['draw:thigh'];
  if (a.st) return [a.st === 'double' ? 'remedial' : 'ia'];
  const ban = BANNED[goal];
  return PLANNED.filter(x => {
    if (ban?.has(x)) return false;
    // (a magazine believed with rounds never comes out on the way to fire: only an empty one is changed (Top up's own comes out first))
    if (x.startsWith('magOut:')) return a.mag === 'in' && a.n === '0' && (x !== 'magOut:dump' || a.dump) && (x !== 'magOut:pouch' || a.room || a.dump);
    if (x === 'reach') return !a.hand && !!a.pool[0];
    if (x === 'reach@ground') return !a.hand && !!a.ground;
    if (x === 'seat') return !!a.hand && a.hand !== 'x' && a.mag === 'out';
    // (a bolt worked on a magazine believed empty chambers nothing believed: never a way to fire (and its '?' would read as rounds))
    if (x === 'charge' || x === 'release') return !(a.mag === 'in' && a.n === '0');
    if (x === 'stowMag') return !!a.hand && a.hand !== 'x' && a.room;
    if (x === 'dumpMag') return !!a.hand && a.hand !== 'x' && a.dump;
    if (x === 'dropMag') return !!a.hand;
    return true;
  });
}
// (a binary heap of [cost, seq, node])
function push(h, e) { h.push(e); let i = h.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (less(h[p], h[i])) break; [h[p], h[i]] = [h[i], h[p]]; i = p; } }
function pop(h) {
  const top = h[0], last = h.pop();
  if (h.length) { h[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < h.length && less(h[l], h[m])) m = l; if (r < h.length && less(h[r], h[m])) m = r; if (m === i) break; [h[m], h[i]] = [h[i], h[m]]; i = m; } }
  return top;
}
const less = (x, y) => x[0] < y[0] || (x[0] === y[0] && x[1] < y[1]);

const PLANS = new Map();
let stats = { hits: 0, misses: 0, pops: 0, maxPops: 0 };
/** The memo's counts since clearPlans (the plan suite's): { hits, misses, maxPops, size }. */
export const planStats = () => ({ ...stats, size: PLANS.size });
/** Empty the memo and its counts (tests only). */
export function clearPlans() { PLANS.clear(); stats = { hits: 0, misses: 0, pops: 0, maxPops: 0 }; }

/**
 * The shortest way from a state to a goal (see the header): { goal, path, costMs, sense?, none? }; path [] when the goal is met,
 * null with none ('no rounds', 'no room in a pouch', 'no plan') when there is no way. opts.look false: no look first on a chamber
 * unknown (the reload rows' own paths, v0.0.17's as run).
 */
export function plan(a, goal, { look = true } = {}) {
  if (!a) return { goal, path: null, costMs: 0, none: 'no gun' };
  const k = `${goal}|${look ? 1 : 0}|${absKey(a)}`;
  const memo = PLANS.get(k);
  if (memo) { stats.hits++; return memo; }
  stats.misses++;
  const p = Object.freeze(search(a, goal, look));
  if (PLANS.size >= PLAN_MEMO_MAX) PLANS.clear();
  PLANS.set(k, p);
  return p;
}
function search(a0, goal, look) {
  // (fire: the chamber's plan, then the selector last)
  if (goal === 'fire') {
    const p = search(a0, 'arm', look);
    if (p.none || a0.mode !== 'safe') return { ...p, goal };
    return { ...p, goal, path: [...p.path, 'selector:semi'], costMs: p.costMs + edgeMs(a0, 'selector:semi') };
  }
  if (goal !== 'topup' && MET[goal](a0)) return { goal, path: [], costMs: 0 };
  if (goal !== 'topup' && honestNone(a0)) return { goal, path: null, costMs: 0, none: 'no rounds' };
  // (the guards at the root: up or the draw, then the look on a chamber unknown with no stoppage)
  const pre = [];
  let a = a0, preMs = 0;
  while (a.carry === 'slung' || a.carry === 'holster') {
    const x = a.carry === 'slung' ? 'up' : 'draw:thigh', n = stepAbs(a, x);
    if (!n) return { goal, path: null, costMs: 0, none: 'no plan' };
    preMs += edgeMs(a, x); pre.push(x); a = n;
  }
  if (look && goal !== 'topup' && a.ch === '?' && !a.st) { const x = a.lk ? 'observe' : 'pressCheck'; return { goal, path: [...pre, x], costMs: preMs + edgeMs(a, x), sense: true }; }
  if (goal !== 'topup' && MET[goal](a)) return { goal, path: pre, costMs: preMs };
  // (Top up from a magazine in: that magazine to a pouch first, the bolt as it is)
  if (goal === 'topup') {
    if (!a.pool.some(rounds) && !rounds(a.hand)) return { goal, path: null, costMs: 0, none: 'no rounds' };
    if (a.mag === 'in') {
      if (!a.room && !a.dump) return { goal, path: null, costMs: 0, none: 'no room in a pouch' };
      const n = stepAbs(a, 'magOut:pouch');
      if (!n) return { goal, path: null, costMs: 0, none: 'no plan' };
      preMs += edgeMs(a, 'magOut:pouch'); pre.push('magOut:pouch'); a = n;
    }
  }
  if (goal === 'retain' && a.mag === 'in' && !a.dump && !a.room) return { goal, path: null, costMs: 0, none: 'no room in a pouch' };
  const start = { ...a, sw: false }, met = MET[goal];
  const dist = new Map([[absKey(start), 0]]), prev = new Map(), heap = [];
  let seq = 0, pops = 0;
  push(heap, [0, seq++, start, 0, 0]);
  while (heap.length) {
    const [d, , s, ms, depth] = pop(heap), key = absKey(s);
    if (d > dist.get(key)) continue;
    pops++;
    if (met(s)) {
      const path = [];
      for (let c = key; prev.has(c);) { const [p, x] = prev.get(c); path.unshift(x); c = p; }
      stats.maxPops = Math.max(stats.maxPops, pops);
      return { goal, path: [...pre, ...path], costMs: preMs + ms };
    }
    if (pops >= PLAN_POPS) break;
    for (const x of edgesOf(s, goal)) {
      let n, xm;
      if (x === 'ia' || x === 'remedial') ({ to: n, ms: xm } = compound(s, x));
      else { n = stepAbs(s, x); xm = n ? edgeMs(s, x) : 0; }
      if (!n) continue;
      const t = { ...n, sw: s.sw || x === 'seat' }, tk = absKey(t), nd = d + xm * MS_K + RANK[x] * Math.max(1, RANK_DEPTH - depth);
      if (nd < (dist.get(tk) ?? Infinity)) { dist.set(tk, nd); prev.set(tk, [key, x]); push(heap, [nd, seq++, t, ms + xm, depth + 1]); }
    }
  }
  stats.maxPops = Math.max(stats.maxPops, pops);
  return { goal, path: null, costMs: 0, none: 'no plan' };
}

/** A planner's mark on a panel row: rowmark.js's, re-exported for the callers of v0.0.18's first build. */
export { markRow } from './rowmark.js';

// ---- names, and the state's way in ----

/** The singles' words a plan may name (shooting.js LABELS's, the pistol's by gunwords.js). */
const SINGLE_WORDS = Object.freeze({ up: 'Rifle up', 'draw:thigh': 'Draw the pistol', charge: 'Charge', release: 'Bolt release', 'selector:semi': 'Off safe', pressCheck: 'Press check', observe: 'Look at the port', lockBack: 'Lock back', hang: 'Let it hang' });
const SEATS = new Set(['seat', 'magIn']);
/**
 * A plan's row in the panel's ids (see the header): { id, label }, or null with no path. purpose: the reload's ('speed',
 * 'retain', 'tactical') or null; model: the words' (gunwords.js).
 */
export function nameOf(p, purpose = null, model = null) {
  const path0 = p?.path;
  if (!path0?.length) return null;
  // (v0.0.19: a path that opens with a device's act is named by the device's way (guard 0; devplan.js devNameOf))
  if (/^(gren|charge|tool):/.test(path0[0]) && !purpose) return devNameOf(p.hands?.path ?? path0.filter(x => /^(gren|charge|tool):/.test(x)), p.hands?.model ?? null, 'clear');
  // (the selector the fire plan ends with names nothing: the chamber's way does)
  const path = path0.length > 1 && path0.at(-1) === 'selector:semi' ? path0.slice(0, -1) : path0;
  const single = (x) => ({ id: x, label: wordsOf(x, model) ?? SINGLE_WORDS[x] ?? x });
  if (path[0] === 'up' || path[0] === 'draw:thigh' || path[0] === 'hang') return single(path[0] === 'hang' ? 'draw:thigh' : path[0]);
  if (path.includes('remedial')) return { id: 'macro:remedial', label: 'REMEDIAL ACTION' };
  if (path.includes('ia')) return { id: 'macro:ia', label: 'IMMEDIATE ACTION' };
  if (p.sense) return single(path.at(-1));
  if (path.some(x => SEATS.has(x))) {
    // (a reload's row is named by its purpose; a plan with none (Fix's) by its shape)
    const tactical = { id: 'macro:reload:tactical', label: path.some(x => x.startsWith('magOut:')) ? RELOAD_LABELS.tactical : MAG_IN_LABEL };
    if (purpose === 'tactical') return tactical;
    if (purpose === 'retain') return { id: 'macro:reload:retain', label: RELOAD_LABELS.retain };
    if (purpose === 'speed') return { id: 'macro:reload:speed', label: RELOAD_LABELS.speed };
    if (path[0] === 'magOut:pouch') return tactical;
    if (path[0] === 'magOut:dump') return { id: 'macro:reload:retain', label: RELOAD_LABELS.retain };
    if (path[0] === 'magOut:drop' || path.at(-1) === 'charge' || path.at(-1) === 'release') return { id: 'macro:reload:speed', label: RELOAD_LABELS.speed };
    return { id: 'macro:reload:tactical', label: MAG_IN_LABEL };
  }
  return single(path[0]);
}

// (a plan's path as the steps run it: the compound edges as their sub-steps (the first by the belief itself, as drills.js offers
// it), a magazine put back to the first pouch with room for it, the rifle let hang before a holstered pistol is drawn)
function expand(state, pid, gunId, a, path) {
  const out = [], b = beliefOf(state, gunId);
  let c = a;
  for (let i = 0; i < path.length; i++) {
    const x = path[i];
    if (x === 'ia' || x === 'remedial') { out.push(...subsOf(x, i === 0 ? b : beliefLike(c))); c = compound(c, x).to; continue; }
    if (x === 'stowMag') {
      const fams = MODELS[a.model].fams, p = pouchesOf(state, pid).find(q => !q.dump && q.room > 0 && (!q.fams || q.fams.some(f => fams.includes(f))));
      out.push(p ? `stowMag@${p.key}` : 'stowMag');
    } else out.push(x);
    c = stepAbs(c, x) ?? c;
  }
  return out;
}

/**
 * The plan for a gun a person holds (see the header): plan()'s with { id, label } (nameOf), subs (the path as the steps run it)
 * and ms (the holder's own pace: rollerOf, the sub-steps' actionMs summed, the up from the back's own). opts: { carry ('hands':
 * as if in the hands), look, purpose }.
 */
export function planFor(state, pid, gunId, goal, { carry = null, look = true, purpose = PURPOSE_OF[goal] ?? null } = {}) {
  const a = absOf(state, pid, gunId, { carry });
  if (!a) return { goal, path: null, none: 'no gun', id: null, label: null, ms: 0, subs: null };
  const p = plan(a, goal, { look });
  if (!p.path) return { ...p, id: null, label: null, ms: 0, subs: null };
  let subs = expand(state, pid, gunId, a, p.path);
  // (a holstered pistol with the rifle up: the rifle let hang first (the house's Transition))
  if (a.carry === 'holster' && !SLUNG.has(state.people[pid].kit?.carry?.posture ?? 'slungFront')) subs = ['hang', ...subs];
  const roller = rollerOf(state, pid), g = state.items[gunId], posture = state.people[pid].kit?.carry?.posture ?? null;
  const rifle = state.people[pid].kit?.worn?.sling ? state.items[state.people[pid].kit.worn.sling] : g;
  const ms = subs.reduce((t, x) => t + actionMs(roller, x === 'hang' ? rifle : g, x, { tempo: 'normal', posture: x === 'up' ? posture : null }), 0);
  // (v0.0.19, guard 0 (see the header): the hands first, for the gun's goals)
  const H = GUARD0_GOALS.has(goal) ? handsPath(state, pid) : null;
  if (H?.path?.length) {
    const hands = { path: H.path, ms: H.ms, id: H.id, label: H.label, dev: H.dev, model: state.items[H.dev]?.model ?? null };
    const q = { ...p, path: [...H.path, ...p.path], hands };
    const name = nameOf(q, purpose, a.model) ?? (purpose ? nameOf(p, purpose, a.model) : null);
    return { ...q, id: (purpose ? nameOf(p, purpose, a.model)?.id : H.id) ?? name?.id ?? null, label: (purpose ? nameOf(p, purpose, a.model)?.label : H.label) ?? name?.label ?? null, ms: ms + H.ms, subs };
  }
  const name = nameOf(p, purpose, a.model);
  return { ...p, id: name?.id ?? null, label: name?.label ?? null, ms, subs };
}
/** The gun's goals guard 0 puts the hands first for (the build sheet 0.0.19 §3.1). */
export const GUARD0_GOALS = Object.freeze(new Set(['fire', 'fed', 'retain', 'topup']));

/**
 * A gun's way to ready as if in the hands (the sidearm's Rifle up: the build sheet 0.0.18 §2.1): { subs, ms, words } (subs []
 * when it is ready: a round believed chambered, no stoppage, the selector left out), or { subs: null, why } with no way.
 */
export function readyPath(state, pid, gunId) {
  const p = planFor(state, pid, gunId, 'fed', { carry: 'hands', purpose: null });
  if (!p.subs) return { subs: null, why: p.none ?? 'no plan' };
  return { subs: p.subs, ms: p.ms, words: p.subs.length ? p.label ?? '' : '', id: p.id };
}

/**
 * A gun's rows as if in the hands (the holstered P-12's, the sidearm's GUN ▸ rows): stepsOf's shape, [{ id, kind, label, ms, subs:
 * [{ id, label, ms }], purpose }]: Press check (the bolt home), Magazine check (a magazine in), Top up (a fuller one to hand), MAKE
 * READY (a magazine believed with rounds in, the chamber empty, the bolt home).
 */
export function gunRows(state, pid, gunId) {
  const b = beliefOf(state, gunId), g = state.items?.[gunId];
  if (!b || !g) return [];
  const roller = rollerOf(state, pid), model = g.model;
  const sub = (x) => ({ id: x, label: wordsOf(x, model) ?? SINGLE_WORDS[x] ?? x, ms: actionMs(roller, g, x, { tempo: 'normal' }) });
  const row = (id, kind, label, list, purpose) => { const subs = list.map(sub); return { id, kind, label, ms: subs.reduce((t, s) => t + s.ms, 0), subs, purpose }; };
  const out = [];
  if (!b.locked && !b.stoppage) out.push(row('pressCheck', 'single', 'Press check', ['pressCheck'], 'check'));
  if (b.mag === 'in') out.push(row('magCheck', 'single', 'Magazine check', ['magCheck'], 'check'));
  if (b.mag === 'in' && !b.stoppage) {
    const tp = planFor(state, pid, gunId, 'topup', { carry: 'hands' });
    if (tp.subs?.length) out.push(row('topup', 'command', RELOAD_LABELS.tactical, tp.subs, 'topup'));
  }
  if (b.mag === 'in' && b.chamber === 'empty' && !b.locked && b.count !== 0 && !b.stoppage) out.push(row('macro:ready', 'command', 'MAKE READY', subsOf('ready', b), 'admin'));
  return out;
}

// ---- the walk's enumerator (the plan-walk suite's) ----

/** The actions the hands can try in the walk: every one of canDo's but the turrets, the lever, the read, the show and the function check (the plan-walk suite's). */
const WALK = Object.freeze(['up', 'draw:thigh', 'stow', 'selector:safe', 'selector:semi', 'charge', 'release', 'lockBack', 'magOut:drop', 'magOut:dump', 'magOut:pouch', 'reach', 'reach@ground', 'seat',
  'lookMag', 'stowMag', 'dumpMag', 'dropMag', 'tap', 'pressCheck', 'magCheck', 'inspect', 'observe', 'clearDouble', 'rack', 'magOut:strip', 'magIn']);
// (a pull on the abstraction (the walk's): fired, the last round, a stovepipe, a double, a dud, each as feel() tells it)
function pulls(a) {
  if (a.mode === 'safe' || (a.carry !== 'ready' && a.carry !== 'hand')) return [];
  const outs = [];
  for (const kind of ['fire', 'last', 'stovepipe', 'double', 'dud']) {
    const { gun, mag } = witnessOf(a);
    if (kind === 'last') { if (!mag || a.n === '0') continue; mag.n = 0; }
    if (kind !== 'fire' && kind !== 'last') { if (!readyTruth(gun) || (kind === 'double' && !(mag?.n > 1))) continue; gun.set = kind; }
    const r = pull(seedRng(PLAN_SEED), gun, mag, {});
    gun.belief = feel(gun.belief, r, { wh: 10 });
    outs.push(Object.freeze(reAbs(a, gun, {})));
  }
  return outs;
}
/**
 * Every abstract state the hands reach from seeds (the plan-walk suite's enumerator): each action of the walk at each grade, and
 * the pulls. opts: { grades, models }. Returns [Abs].
 */
export function reachable(seeds, { grades = ['pass', 'miss', 'disaster'], models = ['r7', 'p12'] } = {}) {
  const seen = new Map(), q = [];
  for (const s of seeds) if (models.includes(s.model)) { const f = Object.freeze({ ...s }); if (!seen.has(absKey(f))) { seen.set(absKey(f), f); q.push(f); } }
  while (q.length) {
    const a = q.shift(), next = [];
    for (const x of WALK) for (const g of grades) { const n = safeStep(a, x, g); if (n) next.push(n); }
    next.push(...pulls(a));
    for (const n of next) { const k = absKey(n); if (!seen.has(k)) { seen.set(k, n); q.push(n); } }
  }
  return [...seen.values()];
}
// (a walk's step: the slung refusal doAction makes, the stow's sling on a long gun only; a pistol's draw from the holster alone)
function safeStep(a, x, grade) {
  if (a.carry === 'slung' && x !== 'up') return null;
  if (a.carry !== 'slung' && x === 'up') return null;
  if (a.carry === 'holster' && x !== 'draw:thigh') return null;
  if (a.carry !== 'holster' && x === 'draw:thigh') return null;
  if (x === 'stow' && !isLong(MODELS[a.model])) return null;
  return stepAbs(a, x, { grade });
}
