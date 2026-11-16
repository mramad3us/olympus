// OLYMPUS arms: the planner over devices, the shortest honest way from a grenade, a charge or a tool as its holder believes it to a goal (WEAPONS §12.1, §12.2; COMBAT §25.20; the build sheet 0.0.19 §3.1, §0 item 21).
//
// v0.0.18's plan.js searches the gun; this searches what the hands hold besides it, so a grenade in the hand is never a dead end
// and the rifle's Fix starts by freeing the hands (plan.js guard 0, handsPath). It reads the belief only (a fuse at its nominal,
// devices.js fuseBelieved, never the drawn fuseMs; a primed charge believed good, a misfire only once the record says one), so
// the planner knows what the holder knows.
//
// **The state** (DevAbs, devAbsOf) is the device abstracted to what a path depends on: { kind, model, st, face (the carrier's
// face its pouch rides, the reach's factor), hand (null or 'strong': the device in the strong hand), rifle ('ready', 'hang' or
// 'slung'), cook (0, 1000 or 2000: the believed ms the count has taken off the fuse), at ('far', 'stack', 'latch', 'hinge' or
// 'safe': the holder against the plan's door, given by the caller: devplan.js imports nothing of combat/'s geometry), fd
// ('none', 'carried' or 'fitted': the FD-1), mis (a misfire believed) }. devKey is its key, a string.
//
// **A step** (stepDev) is an edge of devices.js DEVICE_EDGES or D2_EDGES whose `from` holds and whose needs are met (the strong
// hand free of the rifle for a reach, the support hand for a pin, the place, an FD-1), plus the rifle's own two ('hang' and
// 'up', firearms.js ACTIONS' 0.3 s and 1.0 s: 'up' only with the hands empty) and the walks between the door's places
// ('move:latch', 'move:safe', MOVE_MS each, my call: a planner's nominal, the drill's own walk times its real one).
//
// **The search** (devPlan) is a Dijkstra on a binary heap, as plan.js's: the cost devices.js deviceMs at the base pace
// (Weapon handling 10, DEV_ROLLER) × 64 plus the act's DEV_RANK, so equal times fall to the doctrine's order; at most DEV_POPS
// pops; the memo (DEV_PLANS, by goal and key) runtime only, cleared past DEV_PLANS_MAX. **The guards come first** (kit2 §2.2):
//   D1  a live grenade (its lever gone) offers only 'gren:throw' (to the row's aim) and 'gren:clear' ("Throw it clear"): never
//       the rifle, the pouch or the pin;
//   D2  'clear' never throws an armed grenade (the pin back in, then the pouch), a tool is let go, a held charge goes back in
//       its pouch, a placed one stays (the lane's end recovers it: F29);
//   D3  a believed misfire: 'charge:recock' or 'charge:refit' at the safe point; approaching the charge ('charge:recover', a
//       walk to the latch) waits MISFIRE_WAIT_MS from the misfire, struck "wait 30 s" with its count (never a dead end).
// **The goals** (DEV_GOALS): 'thrown' (a grenade gone at the row's aim), 'placed' (a charge on the door), 'fired' (the door
// open by a charge), 'clear' (no device in the hands and the rifle up).
//
// handsPath(state, pid) is guard 0's: the way from what the hands hold now to the hands empty (the device's acts only: the
// rifle's 'up' is the gun's plan's first step), its ms by the holder's own pace, its row named by devNameOf; null when the
// hands hold no device. devNameOf(path, model, goal) names a path for the panel: the bundle rows keep D1's ids, a single is
// 'dev:<act>:<item>' (devPlanFor), and the words by model ("Flash it", "Frag it", "Concuss it", "Cook 2, frag it", "Throw it",
// "Throw it clear", "Pin back in", "Pin in, pouch, rifle up", "Prime it", "Fire", "Prime again", "Unprime"), one frozen table.
// devReachable(seeds) walks every state the hands can reach (the devplan suite's: each must have a plan to its goal and to
// 'clear', or an honest none).
// Pure.
import { DEVICES, DEVICE_EDGES, D2_EDGES, DEVICE_STATES, DEVICE_ACTIONS, FACES, deviceMs, handDeviceOf, devicesOf, cookOk, inHand, HANG_S, UP_S } from './devices.js';
import { SLUNG } from './carry.js';
import { fixedRoller, rollerOf } from '../combat/roll.js';
import { paceOf } from '../skills/skills.js';

/** The goals (see the header). */
export const DEV_GOALS = Object.freeze(['thrown', 'placed', 'fired', 'clear']);
/** A search's cap (pops) and the memo's size before it is cleared. */
export const DEV_POPS = 200, DEV_PLANS_MAX = 1024;
/** The pace a plan is costed at (Weapon handling 10, the base), as plan.js BASE_ROLLER. */
export const DEV_ROLLER = fixedRoller({ weapons: 10, awareness: 14, marksmanship: 10, fitness: 13, demolitions: 10 });
/** A walk between the door's places in the plan (ms; my call, the drill's own walk times the real one). */
export const MOVE_MS = 2000;
/** Ties broken by the doctrine's order (lower first). */
export const DEV_RANK = Object.freeze({ 'gren:repin': 0, 'gren:stow': 1, 'charge:stow': 1, 'tool:drop': 1, 'charge:unprime': 1, 'gren:throw': 2, 'gren:clear': 3, hang: 4, up: 5,
  'gren:reach': 6, 'gren:pin': 7, 'gren:cook:1': 8, 'gren:cook:2': 9, 'charge:reach': 6, 'charge:place': 7, 'charge:prime': 8, 'charge:fire': 9, 'charge:recock': 8, 'charge:refit': 9,
  'charge:recover': 10, 'move:latch': 11, 'move:safe': 11, 'tool:reach': 6, 'tool:force': 7 });
/** The words of a path by model and act (see the header): one table, renamed in one place. */
export const DEV_WORDS = Object.freeze({
  flash: 'Flash it', frag: 'Frag it', conc: 'Concuss it', cook2frag: 'Cook 2, frag it', cook2conc: 'Cook 2, concuss it', throw: 'Throw it', clear: 'Throw it clear',
  repin: 'Pin back in', pouch: 'Pin in, pouch, rifle up', stow: 'Back in the pouch', drop: 'Let it go', prime: 'Prime it', fire: 'Fire', recock: 'Prime again',
  refit: 'Prime again: a fresh FD-1', unprime: 'Unprime', recover: 'Recover the charge', place: 'Place the charge', wait: 'wait 30 s',
});

const fz = (o) => Object.freeze(o);
// (D1's bare 'gren:cook' is replaced by D2's counted cooks: a planned cook is always a count)
const ACTS = [...DEVICE_EDGES.filter(e => e.act !== 'gren:cook'), ...D2_EDGES];
const STOW = fz({ act: 'charge:stow', kind: 'charge', from: 'held', to: 'pouched' });
const EDGES = [...ACTS, STOW];

/**
 * A device as its holder believes it, abstracted (see the header): a frozen DevAbs, or null for no device. at: the holder's place
 * against the plan's door (the caller's); misAtMs: when the misfire was felt (D3's wait), from the record.
 */
export function devAbsOf(state, pid, itemId, { at = 'far' } = {}) {
  // (the record's plain fields only: its kind, model, state, the count's want and its tube; never its drawn fuseMs or a misfire's
  // truth, which the belief does not hold (the devplan suite reads the record through a Proxy that throws on them))
  const rec = state.items?.[itemId], kind = rec?.type, model = rec?.model;
  if (!rec || !DEVICE_STATES[kind] || !DEVICES[model]) return null;
  const st = rec.st ?? DEVICE_STATES[kind][0];
  const kit = state.people?.[pid]?.kit, hand = (kit?.hands ?? []).includes(itemId) ? 'strong' : null, post = kit?.carry?.posture ?? 'slungFront';
  const list = devicesOf(state, pid), where = list.find(d => d.id === itemId)?.where, face = where && typeof where === 'object' ? where.face : 'front';
  const fd = kind !== 'charge' ? 'none' : rec.tubeId && state.items[rec.tubeId] ? 'fitted' : list.some(d => d.model === 'fd1' && d.st === 'pouched') ? 'carried' : 'none';
  // (a cook believed: the count's want off the fuse)
  const cook = kind === 'grenade' && st === 'live' ? (rec.cook?.wantMs ?? 0) : 0;
  const rifle = hand ? 'hang' : SLUNG.has(post) ? (post === 'slungBack' ? 'slung' : 'hang') : 'ready';
  return fz({ kind, model, st, face: FACES.includes(face) ? face : 'front', hand, rifle, cook, at, fd, mis: st === 'misfire', ...(Number.isFinite(rec.misAtMs) ? { misAtMs: rec.misAtMs } : {}) });
}
/** A DevAbs's key (see the header). */
export const devKey = (a) => `${a.kind}|${a.model}|${a.st}|${a.face}|${a.hand ?? '-'}|${a.rifle}|${a.cook}|${a.at}|${a.fd}|${a.mis ? 'm' : '-'}`;

const fromOk = (e, st) => (Array.isArray(e.from) ? e.from.includes(st) : e.from === st);
// (whether an edge's needs hold on a state)
function needsOk(a, e) {
  const n = e.need ?? {};
  if (n.strong === 'free' && (a.hand || a.rifle === 'ready')) return false;
  if (n.support === 'free' && a.rifle === 'ready' && !a.hand) return false;
  if (n.rifle === 'hang' && a.rifle === 'ready') return false;
  if (n.at === 'latch' && a.at !== 'latch' && a.at !== 'hinge') return false;
  if (n.at === 'safe' && a.at !== 'safe') return false;
  if (n.initiator && a.fd === 'none') return false;
  // (a fresh FD-1 for a misfire: one carried, the fitted one spent)
  if (e.act === 'charge:refit' && a.fd !== 'carried') return false;
  return true;
}
/**
 * One step on a DevAbs (see the header): the state after act, or null where it may not be taken. The rifle's 'hang' and 'up',
 * the walks 'move:latch' and 'move:safe', and every device edge; guards D1 to D3 are the search's (allowed), not the step's.
 */
export function stepDev(a, act) {
  if (!a) return null;
  if (act === 'hang') return a.rifle === 'ready' ? fz({ ...a, rifle: 'hang' }) : null;
  if (act === 'up') return a.rifle !== 'ready' && !a.hand ? fz({ ...a, rifle: 'ready' }) : null;
  if (act === 'move:latch') return a.at !== 'latch' && a.at !== 'hinge' ? fz({ ...a, at: DEVICES[a.model]?.side === 'hinge' ? 'hinge' : 'latch' }) : null;
  if (act === 'move:safe') return a.at !== 'safe' ? fz({ ...a, at: 'safe' }) : null;
  const e = EDGES.find(x => x.act === act && x.kind === a.kind && fromOk(x, a.st));
  if (!e || !needsOk(a, e)) return null;
  if (e.only === 'cook' && !(DEVICES[a.model]?.cook && cookOk(a.model, e.cook ?? 0))) return null;
  const to = e.to, hand = inHand(a.kind, to) ? 'strong' : null;
  const out = { ...a, st: to, hand };
  if (e.cook) out.cook = e.cook;
  if (to === 'gone' || to === 'pouched' || to === 'stowed') out.cook = 0;
  if (act === 'charge:prime') out.fd = 'fitted';
  if (act === 'charge:unprime') out.fd = 'carried';
  if (act === 'charge:recock' || act === 'charge:refit') out.mis = false;
  if (act === 'gren:reach' || act === 'charge:reach' || act === 'tool:reach') out.rifle = 'hang';
  return fz(out);
}
// (an act's cost at the base pace: its ms × 64 + its rank)
function costOf(a, act) {
  if (act === 'hang') return Math.round(HANG_S * 1000) * 64 + DEV_RANK.hang;
  if (act === 'up') return Math.round(UP_S * 1000) * 64 + DEV_RANK.up;
  if (act === 'move:latch' || act === 'move:safe') return MOVE_MS * 64 + DEV_RANK[act];
  const D = DEVICES[a.model], s0 = act === 'charge:place' ? D?.placeS ?? null : null;
  const key = act === 'charge:stow' ? 'gren:stow' : act;
  return deviceMs(DEV_ROLLER, key, { face: a.face, s0 }) * 64 + (DEV_RANK[act] ?? 12);
}
/** An act's time (ms) for a roller (the holder's own pace, or the base). */
export function devActMs(roller, a, act) {
  if (act === 'hang') return Math.round(HANG_S * 1000 * paceOf(roller?.value?.('weapons') ?? 10));
  if (act === 'up') return Math.round(UP_S * 1000 * paceOf(roller?.value?.('weapons') ?? 10));
  if (act === 'move:latch' || act === 'move:safe') return MOVE_MS;
  const D = DEVICES[a.model], s0 = act === 'charge:place' ? D?.placeS ?? null : null;
  return deviceMs(roller, act === 'charge:stow' ? 'gren:stow' : act, { face: a.face, s0 });
}

// (the acts a goal's search may take from a state: the guards first (see the header))
function allowed(a, goal) {
  const acts = ['hang', 'up', 'move:latch', 'move:safe', ...EDGES.map(e => e.act)];
  // (D1: a live grenade's only ways are its throw and its throw clear)
  if (a.kind === 'grenade' && a.st === 'live') return goal === 'clear' ? ['gren:clear'] : ['gren:throw'];
  let out = [...new Set(acts)];
  // (D2: the way to empty hands never throws an armed grenade, never cooks, never forces a door, never places or fires a charge)
  if (goal === 'clear') out = out.filter(x => !['gren:throw', 'gren:clear', 'gren:cook:1', 'gren:cook:2', 'gren:pin', 'gren:reach', 'tool:force', 'tool:reach', 'charge:reach', 'charge:place', 'charge:prime', 'charge:fire', 'move:latch'].includes(x));
  if (goal === 'thrown') out = out.filter(x => x !== 'gren:clear');
  // (D3: a believed misfire's charge is not walked up to before MISFIRE_WAIT_MS: the planner primes it again from where it is)
  if (a.mis) out = out.filter(x => x !== 'charge:recover' && x !== 'move:latch');
  return out;
}
// (a goal met)
function met(a, goal) {
  if (goal === 'thrown') return a.kind === 'grenade' && a.st === 'gone';
  if (goal === 'placed') return a.kind === 'charge' && (a.st === 'placed' || a.st === 'primed');
  if (goal === 'fired') return a.kind === 'charge' && a.st === 'gone';
  if (goal === 'clear') return !a.hand && a.rifle === 'ready';
  return false;
}

let PLANS = new Map(), stats = { hits: 0, misses: 0, pops: 0, maxPops: 0 };
/** The memo's counters (the devplan suite's: pops under DEV_POPS). */
export const devPlanStats = () => ({ ...stats, size: PLANS.size });
/** The memo cleared (the suite's, between its cases). */
export function clearDevPlans() { PLANS = new Map(); stats = { hits: 0, misses: 0, pops: 0, maxPops: 0 }; }

// (the heap's order: cost, then the path's rank string)
const less = (x, y) => x.c < y.c || (x.c === y.c && x.k < y.k);
function hpush(h, e) { h.push(e); let i = h.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (less(h[p], h[i])) break; [h[p], h[i]] = [h[i], h[p]]; i = p; } }
function hpop(h) {
  const top = h[0], last = h.pop();
  if (h.length) { h[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < h.length && less(h[l], h[m])) m = l; if (r < h.length && less(h[r], h[m])) m = r; if (m === i) break; [h[m], h[i]] = [h[i], h[m]]; i = m; } }
  return top;
}

/** A DevAbs's plan to a goal (see the header): { goal, path: [act…] | null, costMs, none? }, memoised by goal and key. */
export function devPlan(a, goal) {
  if (!a) return { goal, path: null, costMs: 0, none: 'no device' };
  const key = `${goal}#${devKey(a)}`;
  if (PLANS.has(key)) { stats.hits++; return PLANS.get(key); }
  stats.misses++;
  if (PLANS.size >= DEV_PLANS_MAX) PLANS = new Map();
  const out = search(a, goal);
  PLANS.set(key, Object.freeze(out));
  return out;
}
function search(a0, goal) {
  if (met(a0, goal)) return { goal, path: [], costMs: 0 };
  if ((goal === 'placed' || goal === 'fired') && a0.kind !== 'charge') return { goal, path: null, costMs: 0, none: 'not a charge' };
  if (goal === 'thrown' && a0.kind !== 'grenade') return { goal, path: null, costMs: 0, none: 'not a grenade' };
  const h = [{ c: 0, k: '', a: a0, path: [] }], best = new Map([[devKey(a0), 0]]);
  let pops = 0;
  while (h.length && pops < DEV_POPS) {
    const n = hpop(h);
    pops++;
    if (met(n.a, goal)) { note(pops); return { goal, path: n.path, costMs: Math.round(n.c / 64) }; }
    for (const act of allowed(n.a, goal)) {
      const b = stepDev(n.a, act);
      if (!b) continue;
      const c = n.c + costOf(n.a, act), k = devKey(b);
      if (best.has(k) && best.get(k) <= c) continue;
      best.set(k, c);
      hpush(h, { c, k: n.k + String.fromCharCode(65 + (DEV_RANK[act] ?? 12)), a: b, path: [...n.path, act] });
    }
  }
  note(pops);
  return { goal, path: null, costMs: 0, none: a0.mis && (goal === 'clear') ? DEV_WORDS.wait : 'no way' };
}
const note = (pops) => { stats.pops += pops; stats.maxPops = Math.max(stats.maxPops, pops); };

/** A path's row (see the header): { id, label }, the singles 'dev:<act>' (the item's id added by devPlanFor), the bundle rows D1's ids. */
export function devNameOf(path, model, goal = null) {
  if (!path?.length) return { id: null, label: null };
  const D = DEVICES[model] ?? {}, as = D.flash ? 'flash' : D.as === 'g9' || D.frag ? 'frag' : D.as === 'g13' || model === 'g13' ? 'conc' : null;
  const first = path.find(x => x !== 'hang' && x !== 'up') ?? path[0];
  if (goal === 'thrown' && path.includes('gren:reach')) {
    const cooked = path.includes('gren:cook:2') || path.includes('gren:cook:1');
    return { id: `drill:door:${as ?? 'flash'}`, label: cooked && as !== 'flash' ? DEV_WORDS[`cook2${as}`] : DEV_WORDS[as ?? 'flash'] };
  }
  if ((goal === 'placed' || goal === 'fired') && path.includes('charge:reach')) return { id: 'drill:door:breach', label: D.side === 'hinge' ? 'Cut it' : 'Breach (explosive)' };
  if (first === 'gren:repin') return { id: 'dev:repin', label: path.includes('gren:stow') && path.includes('up') ? DEV_WORDS.pouch : DEV_WORDS.repin };
  const word = { 'gren:throw': DEV_WORDS.throw, 'gren:clear': DEV_WORDS.clear, 'gren:stow': DEV_WORDS.stow, 'charge:stow': DEV_WORDS.stow, 'tool:drop': DEV_WORDS.drop, 'charge:prime': DEV_WORDS.prime, 'charge:fire': DEV_WORDS.fire,
    'charge:recock': DEV_WORDS.recock, 'charge:refit': DEV_WORDS.refit, 'charge:unprime': DEV_WORDS.unprime, 'charge:recover': DEV_WORDS.recover, 'charge:place': DEV_WORDS.place, 'gren:cook:2': DEV_WORDS[`cook2${as}`] ?? DEV_WORDS.throw }[first];
  // (the singles keep D1's deviceRows ids where a row exists: Throw it, Pin back in, Back in the pouch, Let it go)
  const id = { 'gren:throw': 'dev:throw', 'gren:repin': 'dev:repin', 'gren:stow': 'dev:stow', 'charge:stow': 'dev:stow', 'tool:drop': 'dev:drop', 'gren:clear': 'dev:gren:clear' }[first] ?? `dev:${first}`;
  return { id, label: word ?? DEVICE_ACTIONS[first]?.label ?? first };
}

/** A device's plan for a person (see the header): devPlan's with { id, label } and ms at the holder's own pace. */
export function devPlanFor(state, pid, itemId, goal, { at = 'far' } = {}) {
  const a = devAbsOf(state, pid, itemId, { at });
  const p = devPlan(a, goal);
  if (!p.path) return { ...p, id: null, label: null, ms: 0 };
  const roller = rollerOf(state, pid);
  let c = a, ms = 0;
  for (const x of p.path) { ms += devActMs(roller, c, x); c = stepDev(c, x) ?? c; }
  const n = devNameOf(p.path, a.model, goal);
  return { ...p, id: n.id, label: n.label, ms };
}

/**
 * Guard 0's way out of the hands (see the header): { path (the device's acts, the rifle's left to the gun's plan), ms, label, id,
 * dev } or null when the hands hold no device; a misfire's or any device's honest none as { path: null, why }.
 */
export function handsPath(state, pid) {
  const h = handDeviceOf(state, pid);
  if (!h) return null;
  const p = devPlanFor(state, pid, h.id, 'clear');
  if (!p.path) return { path: null, why: p.none ?? 'no way', ms: 0, label: null, id: null, dev: h.id };
  const path = p.path.filter(x => x !== 'up' && x !== 'hang'), a = devAbsOf(state, pid, h.id), roller = rollerOf(state, pid);
  let c = a, ms = 0;
  for (const x of path) { ms += devActMs(roller, c, x); c = stepDev(c, x) ?? c; }
  const n = devNameOf(path, h.model, 'clear');
  return { path, ms, label: n.label, id: n.id, dev: h.id };
}

/**
 * Every DevAbs the hands can reach from the seeds (the devplan suite's walk): every model issued or data, every rifle carry and
 * face, every edge from each. Returns [DevAbs].
 */
export function devReachable(seeds = devSeeds()) {
  const seen = new Map(), q = [];
  const add = (a) => { const k = devKey(a); if (!seen.has(k)) { seen.set(k, a); q.push(a); } };
  for (const s of seeds) add(fz({ ...s }));
  const acts = ['hang', 'up', 'move:latch', 'move:safe', ...new Set(EDGES.map(e => e.act))];
  while (q.length) { const a = q.shift(); for (const x of acts) { const b = stepDev(a, x); if (b) add(b); } }
  return [...seen.values()];
}
/** The walk's seeds (see devReachable): every model of the catalogue, pouched or stowed, each face, each carry of the rifle, each place. */
export function devSeeds() {
  const out = [];
  for (const [model, D] of Object.entries(DEVICES)) {
    if (D.kind === 'initiator') continue;
    const st0 = DEVICE_STATES[D.kind][0];
    for (const face of FACES) for (const rifle of ['ready', 'hang', 'slung']) for (const at of ['far', 'latch', 'safe'])
      out.push({ kind: D.kind, model, st: st0, face, hand: null, rifle, cook: 0, at, fd: D.kind === 'charge' ? 'carried' : 'none', mis: false });
    if (D.kind === 'charge') for (const at of ['safe', 'latch']) out.push({ kind: 'charge', model, st: 'misfire', face: 'right', hand: null, rifle: 'ready', cook: 0, at, fd: 'fitted', mis: true });
  }
  return out;
}
