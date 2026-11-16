// OLYMPUS arms: the grenades, the door charges, their initiators and the breaching tools as items, their states and the actions between them (WEAPONS §12.1, §12.2; COMBAT §11, §25.20; the build sheet 0.0.18 §2.3).
//
// Every device is an item in state.items with one holder (kit.js), like a magazine: a grenade { type: 'grenade', model,
// fuseMs, st?, fuseAtMs?, byId?, flight? }, a charge { type: 'charge', model, st?, door?, side?, tubeId? }, a tool
// { type: 'tool', model, st? } and an initiator { type: 'initiator', model, st? }. Its state is the plain field `st`,
// saved without its default (absent is the kind's first state: a grenade or a charge 'pouched', a tool 'stowed', an
// initiator 'pouched'). A grenade thrown or a charge placed is held { ground: { area, x, z } } at once, so every item is
// held exactly once with no new holder kind; one burst is taken off the game (kit.discard) and goes on the scene's record.
// A device's door is `door`, never `doorId` (the save's id walk reads every `…Id` as an entity: the build sheet's §0 item 15).
//
// DEVICES is the catalogue as data (D1 issues g11, sc1, fd1, hal and ram; g9, g9p, g13, g13p and g12 are data only, never
// issued this round). DEVICE_ACTIONS are firearms.js ACTIONS-shaped records (a label, base seconds at value 10, a DC, the
// skill they roll, whether the pace scales them), and deviceMs(roller, act, { face }) times one: base × FACE_K[face] for a
// reach (the carrier's front 1.0, its sides 1.15, the back 1.25: my calls) × paceOf(the skill's value) unless unpaced. So a
// G-11 from a side pouch is 1.2 × 1.15 = 1.38 s at Weapon handling 10, and with the rifle let hang (ACTIONS.hang, 0.3 s) and
// the pin (0.5 s), all paced, then the throw's 0.7 s unpaced, the grenade is in the air 2.88 s after the decision at 10, 3.51 s
// at the boot recruit's 4 and 1.69 s at the tier one's 42 (throwChainMs).
//
// DEVICE_EDGES is the moves between states as a table for a planner to search (D2: plan.js does not search devices this
// round, the build sheet's §8 item 10), and wayOut(kind, st) is this module's own check that from every state a hand can be
// emptied and the rifle brought up (repin, stow, throw, drop or fire), so a hand is never left full and stuck.
// The belief: a fuse's exact length and a misfiring shock tube are the only hidden facts. deviceBelief(state, id) gives a
// grenade's fuse believed at its nominal (the G-11's 1,500 ms exactly; a G-9's 4,000) and a primed charge believed good.
// devicesOf(state, pid) lists what a person carries, in reach order: [{ id, kind, model, st, where }].
// v0.0.19 (D2, the build sheet 0.0.19 §3.1, §5): the G-9P and G-13P practice grenades and the BC-1 hinge-side cutting charge are
// issued (BC-1: 0.30 kg TNT, 0.8 kg, placed in PLACE_S 8.0 at Demolitions DC 12, on a pull door's hinges or a push door's latch).
// Each device says its call (`call`: "Bang out!", "Frag out!", "Concussion out!", "Breaching!"), one string the throw and the
// breach read. A cooking grenade's count is a Weapon handling check, COOK_DC 6, unpaced (cookCount): at a pass the count's
// nominal × U(0.95, 1.05), a miss runs late × 1.25, a disaster freezes the hand COOK_FREEZE_MS 0.5 s more (my call: kit2's 1.0 s
// with the throw's 0.7 s after it reached the fuse); 'gren:cook:1' and 'gren:cook:2' are planned only where the believed fuse less
// the cook less the throw's RELEASE_MS 700 keeps COOK_MARGIN_MS, so a 2 s cook (3.70 s at worst, the throw's release counted)
// never bursts in the hand against the 4.0 s least fuse. D2_EDGES are the planner's
// moves beyond D1's (devplan.js): the cook, "Throw it clear", a charge unprimed or recovered, a believed misfire primed again
// by its striker re-cocked or a fresh FD-1. DEVICE_STATES gain a charge's 'misfire' and an initiator's 'fired', appended, so
// absent is still the kind's first state. MISFIRE_WAIT_MS 30,000 (to check) is how long a man waits before he walks up to a
// charge that did not fire.
// Pure.
import { paceOf } from '../skills/skills.js';
import { check } from '../skills/checks.js';
import { stream, range, next } from '../../core/rng.js';
import { containersOf, holderOf } from './kit.js';

const fz = (o) => Object.freeze(o);

/** The device states by kind (an item's `st`; absent is the first). */
export const DEVICE_STATES = fz({
  grenade: fz(['pouched', 'held', 'armed', 'live', 'gone']),
  charge: fz(['pouched', 'held', 'placed', 'primed', 'gone', 'misfire']),
  tool: fz(['stowed', 'held', 'gone']),
  initiator: fz(['pouched', 'fitted', 'fired']),
});

// (the catalogue: devicetable.js, a leaf, re-exported here for every caller)
export { DEVICES } from './devicetable.js';
import { DEVICES } from './devicetable.js';

/** The reach's factor by the carrier's face (my calls: the front at hand, the sides a turn of the wrist, the back an arm over the shoulder). */
export const FACE_K = fz({ front: 1.0, left: 1.15, right: 1.15, back: 1.25 });
/** The carrier's faces, in the order the screen and the code walk them. */
export const FACES = fz(['front', 'left', 'right', 'back']);

const A = (label, s, dc, o = {}) => fz({ label, s, dc, skill: 'weapons', paced: true, reach: false, ...o });
/** The actions (see the header): id → { label, s (base seconds at value 10), dc (null: no roll), skill, paced, reach (× FACE_K), hands }. */
export const DEVICE_ACTIONS = fz({
  'gren:reach': A('Grenade from the pouch', 1.2, 6, { reach: true, hands: 'strong' }),
  'gren:pin': A('Pull the pin', 0.5, 8, { hands: 'both' }),
  'gren:repin': A('Pin back in', 1.5, 10, { hands: 'both' }),
  'gren:cook': A('Let the lever go', 0, null, { paced: false }),
  'gren:throw': A('Throw', 0.7, null, { skill: 'marksmanship', paced: false, hands: 'strong' }),
  'gren:stow': A('Back in the pouch', 1.2, 5, { reach: true }),
  'charge:reach': A('Charge from the pouch', 1.2, 6, { reach: true }),
  'charge:place': A('Place the charge', 6.0, 10, { skill: 'demolitions', hands: 'both' }),
  'charge:prime': A('Prime it', 1.0, 6, { hands: 'support' }),
  'charge:fire': A('Fire', 0.2, null, { paced: false, hands: 'support' }),
  'tool:reach': A('Halligan off your back', 1.2, 6, { reach: true }),
  'tool:force': A('Force it', 3.0, null, { skill: 'fitness', paced: false, hands: 'both' }),
  'tool:drop': A('Let it go', 0.3, null, { paced: false }),
  // (a tool let go at a door picked up off the floor and hung on the back again: the reach's own motion twice, down and up (my call))
  'tool:pickup': A('Pick it up, on your back', 2.4, 6, { reach: true }),
  // (v0.0.19, D2 (see the header): the count unpaced, its check apart (cookCount); "Throw it clear" unaimed; the charge's ways back)
  'gren:cook:1': A('Cook one', 1.0, null, { paced: false }),
  'gren:cook:2': A('Cook two', 2.0, null, { paced: false }),
  'gren:clear': A('Throw it clear', 0.5, null, { skill: 'marksmanship', paced: false, hands: 'strong' }),
  'charge:unprime': A('Unprime', 0.8, 5, { hands: 'support' }),
  'charge:recover': A('Recover the charge', 2.0, 8, { skill: 'demolitions', hands: 'both' }),
  'charge:recock': A('Prime again', 1.5, 6, { hands: 'support' }),
  'charge:refit': A('A fresh FD-1', 1.0, 6, { reach: true, hands: 'support' }),
});
/** The cook's count (see the header): its check's DC, the planned margin left on the believed fuse (ms), a disaster's freeze (ms), how long a man waits on a misfire (ms; to check). */
export const COOK_DC = 6, COOK_MARGIN_MS = 1000, COOK_FREEZE_MS = 500, MISFIRE_WAIT_MS = 30_000;
/** The throw's release after the count (ms): the throw's whole 0.7 s, the grenade leaving the hand at its end (bundle.js's throw). */
export const RELEASE_MS = 700;
/**
 * A cook's count held (see the header): { ms, grade } for a count of wantMs at Weapon handling wh, its roll from r (a stream):
 * pass × U(0.95, 1.05), miss × 1.25, disaster + COOK_FREEZE_MS.
 */
export function cookCount(r, wh, wantMs, { tempo = 'normal', by = null } = {}) {
  const c = check(r, { skill: 'weapons', value: wh ?? 10, dc: COOK_DC, pressure: 'evaluated', tempo, by, verb: null });
  const u = next(r), grade = c.grade === 'disaster' ? 'disaster' : c.ok ? 'pass' : 'miss';
  const ms = grade === 'pass' ? wantMs * (0.95 + 0.1 * u) : grade === 'miss' ? wantMs * 1.25 : wantMs * 1.25 + COOK_FREEZE_MS;
  return { ms: Math.round(ms), grade, roll: c };
}
/** Whether a cook of cookMs may be planned on a grenade of a model (see the header): the believed fuse − the cook − the release keeps COOK_MARGIN_MS. */
export const cookOk = (model, cookMs) => !!DEVICES[model]?.cook && (fuseBelieved(model) ?? 0) - cookMs - RELEASE_MS >= COOK_MARGIN_MS;
/** The rifle let hang on its sling and brought back up (firearms.js ACTIONS.hang and .up's base seconds, read as theirs). */
export const HANG_S = 0.3, UP_S = 1.0;

/**
 * The moves between states (see the header), for a planner (D2): { act, kind, from (a state or a list), to, need?, goal?, only? }.
 * `need`: the hands ('strong' / 'support' free), the rifle ('hang'), the place ('latch' at the door's latch edge, 'safe' at a
 * safe point) and an initiator; `goal` what the edge achieves ('thrown', 'door open').
 */
export const DEVICE_EDGES = fz([
  fz({ act: 'gren:reach', kind: 'grenade', from: 'pouched', to: 'held', need: fz({ strong: 'free', rifle: 'hang' }) }),
  fz({ act: 'gren:pin', kind: 'grenade', from: 'held', to: 'armed', need: fz({ support: 'free' }) }),
  fz({ act: 'gren:repin', kind: 'grenade', from: 'armed', to: 'held' }),
  fz({ act: 'gren:cook', kind: 'grenade', from: 'armed', to: 'live', only: 'cook' }),
  fz({ act: 'gren:throw', kind: 'grenade', from: fz(['armed', 'live']), to: 'gone', goal: 'thrown' }),
  fz({ act: 'gren:stow', kind: 'grenade', from: 'held', to: 'pouched' }),
  fz({ act: 'charge:reach', kind: 'charge', from: 'pouched', to: 'held', need: fz({ strong: 'free', rifle: 'hang' }) }),
  fz({ act: 'charge:place', kind: 'charge', from: 'held', to: 'placed', need: fz({ at: 'latch' }) }),
  fz({ act: 'charge:prime', kind: 'charge', from: 'placed', to: 'primed', need: fz({ at: 'safe', initiator: true }) }),
  fz({ act: 'charge:fire', kind: 'charge', from: 'primed', to: 'gone', goal: 'door open' }),
  fz({ act: 'tool:reach', kind: 'tool', from: 'stowed', to: 'held', need: fz({ strong: 'free', support: 'free', rifle: 'hang' }) }),
  fz({ act: 'tool:force', kind: 'tool', from: 'held', to: 'held', goal: 'door open', need: fz({ at: 'latch' }) }),
  fz({ act: 'tool:drop', kind: 'tool', from: 'held', to: 'gone' }),
]);
/**
 * D2's moves (see the header), the planner's beyond DEVICE_EDGES (devplan.js): the same shape, `cook` the believed ms the
 * count takes off the fuse, `wait` a misfire's MISFIRE_WAIT_MS before the charge is approached.
 */
export const D2_EDGES = fz([
  fz({ act: 'gren:cook:1', kind: 'grenade', from: 'armed', to: 'live', only: 'cook', cook: 1000 }),
  fz({ act: 'gren:cook:2', kind: 'grenade', from: 'armed', to: 'live', only: 'cook', cook: 2000 }),
  fz({ act: 'gren:clear', kind: 'grenade', from: fz(['armed', 'live']), to: 'gone', goal: 'clear' }),
  fz({ act: 'charge:unprime', kind: 'charge', from: 'primed', to: 'placed', need: fz({ at: 'safe' }) }),
  fz({ act: 'charge:recover', kind: 'charge', from: 'placed', to: 'held', need: fz({ at: 'latch', strong: 'free' }) }),
  fz({ act: 'charge:recock', kind: 'charge', from: 'misfire', to: 'primed', need: fz({ at: 'safe' }) }),
  fz({ act: 'charge:refit', kind: 'charge', from: 'misfire', to: 'primed', need: fz({ at: 'safe', initiator: true }) }),
]);
// (the states in which a device is in a hand)
const IN_HAND = fz({ grenade: fz(['held', 'armed', 'live']), charge: fz(['held']), tool: fz(['held']), initiator: fz([]) });
/** Whether a device in a state fills a hand. */
export const inHand = (kind, st) => (IN_HAND[kind] ?? []).includes(st);

/**
 * From a state, the edges that lead in the fewest moves to a state with the hands empty (or the device gone), the rifle then
 * free to come up: [act…], [] when the hands are already empty, null when there is no way out (a dead end: the test's failure).
 * A cooked grenade's only way out is the throw; an armed one's the repin or the throw (my call: never a cook to be rid of it).
 */
export function wayOut(kind, st, D = null) {
  const seen = new Set([st]), queue = [[st, []]];
  while (queue.length) {
    const [s, path] = queue.shift();
    if (!inHand(kind, s)) return path;
    for (const e of DEVICE_EDGES) {
      if (e.kind !== kind || !(Array.isArray(e.from) ? e.from.includes(s) : e.from === s)) continue;
      if (e.only === 'cook' && !(D?.cook)) continue;
      if (seen.has(e.to) && e.to !== 'gone') continue;
      seen.add(e.to);
      queue.push([e.to, [...path, e.act]]);
    }
  }
  return null;
}

/** An action's time (ms) for a roller (see the header): base × FACE_K[face] for a reach × paceOf(the skill's value) unless unpaced; s0 overrides the base (a tool's own force). */
export function deviceMs(roller, act, { face = 'front', s0 = null, tempo = 'normal' } = {}) {
  const a = DEVICE_ACTIONS[act];
  if (!a) throw new Error(`devices.deviceMs(): no action '${act}'`);
  const base = (s0 ?? a.s) * (a.reach ? FACE_K[face] ?? 1 : 1);
  const p = a.paced ? paceOf(roller?.value?.(a.skill) ?? 10) : 1;
  return Math.round(base * p * (tempo === 'rushed' ? 0.6 : 1) * (roller?.timeK ?? 1) * 1000);
}
/**
 * The throw's chain at a Weapon handling (ms): the rifle let hang, a grenade reached from a face, the pin, all paced, then the
 * throw unpaced: { hangMs, reachMs, pinMs, throwMs, airMs (the decision to the grenade in the air), upMs (the rifle back up) }.
 */
export function throwChainMs(wh, { face = 'left' } = {}) {
  const p = paceOf(wh), hangMs = Math.round(HANG_S * p * 1000), reachMs = Math.round(DEVICE_ACTIONS['gren:reach'].s * FACE_K[face] * p * 1000), pinMs = Math.round(DEVICE_ACTIONS['gren:pin'].s * p * 1000);
  const throwMs = Math.round(DEVICE_ACTIONS['gren:throw'].s * 1000);
  return { hangMs, reachMs, pinMs, throwMs, airMs: Math.round((HANG_S + DEVICE_ACTIONS['gren:reach'].s * FACE_K[face] + DEVICE_ACTIONS['gren:pin'].s) * p * 1000) + throwMs, upMs: Math.round(UP_S * p * 1000) };
}

/** A grenade's own fuse (ms): the model's flat one, or drawn from its stream (the item id) between its bounds. */
export function fuseOf(seed, model, itemId) {
  const D = DEVICES[model];
  if (!D || D.kind !== 'grenade') throw new Error(`devices.fuseOf(): no grenade '${model}'`);
  if (Number.isFinite(D.fuseMs)) return D.fuseMs;
  return Math.round(range(stream(seed, 'arms:fuse', itemId), D.fuse[0], D.fuse[1]));
}
/** A grenade's fuse as its holder believes it (ms): the nominal, the flat fuse or the bottom of the band. */
export const fuseBelieved = (model) => { const D = DEVICES[model]; return Number.isFinite(D?.fuseMs) ? D.fuseMs : D?.fuse?.[0] ?? null; };

// (the state with its default: absent is the kind's first)
const stOf = (rec) => rec?.st ?? DEVICE_STATES[rec?.type]?.[0] ?? null;
const isDevice = (rec) => !!rec && !!DEVICE_STATES[rec.type] && !!DEVICES[rec.model];

/** A device's truth: { id, kind, model, st, fuseMs?, fuseAtMs?, door?, side?, tubeId?, flight? }, or null for anything else. */
export function deviceOf(state, itemId) {
  const rec = state.items?.[itemId];
  if (!isDevice(rec)) return null;
  const out = { id: itemId, kind: rec.type, model: rec.model, st: stOf(rec) };
  for (const k of ['fuseMs', 'fuseAtMs', 'door', 'side', 'tubeId', 'flight', 'byId']) if (rec[k] !== undefined) out[k] = rec[k];
  return out;
}
/** A device as its holder believes it (see the header): the fuse at its nominal, a primed charge good. */
export function deviceBelief(state, itemId) {
  const t = deviceOf(state, itemId);
  if (!t) return null;
  if (t.kind === 'grenade') t.fuseMs = fuseBelieved(t.model);
  if (t.kind === 'charge' && t.st === 'primed') t.good = true;
  return t;
}
/** The face of the carrier a pouch rides ('front' when its record says none). */
export const faceOf = (state, pouchId) => state.items?.[pouchId]?.at ?? 'front';

/** What a person carries of devices, in reach order: [{ id, kind, model, st, where: { face, pouchId } | 'hand' | 'back' }]. */
export function devicesOf(state, pid) {
  const out = [], kit = state.people?.[pid]?.kit;
  if (!kit) return out;
  (kit.hands ?? []).forEach((id) => { const rec = id ? state.items[id] : null; if (isDevice(rec)) out.push({ id, kind: rec.type, model: rec.model, st: stOf(rec), where: 'hand' }); });
  for (const c of containersOf(state, pid)) for (const id of state.items[c].holds ?? []) {
    const rec = state.items[id];
    if (isDevice(rec)) out.push({ id, kind: rec.type, model: rec.model, st: stOf(rec), where: { face: faceOf(state, c), pouchId: c } });
  }
  return out;
}
/** The first device of a model a person can reach from a pouch (devicesOf's order), or null: { id, face, pouchId }. */
export function pouchedOf(state, pid, model) {
  const d = devicesOf(state, pid).find(x => x.model === model && x.where !== 'hand' && (x.st === 'pouched' || x.st === 'stowed'));
  return d ? { id: d.id, face: d.where.face, pouchId: d.where.pouchId } : null;
}
/** The device in a person's hands, or null: { id, kind, model, st, hand }. */
export function handDeviceOf(state, pid) {
  const hands = state.people?.[pid]?.kit?.hands ?? [];
  for (let h = 0; h < hands.length; h++) { const rec = hands[h] ? state.items[hands[h]] : null; if (isDevice(rec)) return { id: hands[h], kind: rec.type, model: rec.model, st: stOf(rec), hand: h }; }
  return null;
}
/** Every device lying on the live area that is still live: grenades thrown and burning, charges placed, primed or a believed misfire: [{ id, kind, model, st, x, z }]. */
export function liveDevices(state) {
  const out = [];
  for (const site of Object.values(state.places?.sites ?? {})) for (const l of site?.items ?? []) {
    const rec = state.items?.[l.id];
    if (!isDevice(rec)) continue;
    const st = stOf(rec);
    if ((rec.type === 'grenade' && st === 'live') || (rec.type === 'charge' && (st === 'placed' || st === 'primed' || st === 'misfire'))) out.push({ id: l.id, kind: rec.type, model: rec.model, st, x: l.x, z: l.z, area: l.area });
  }
  return out;
}
/** Whether an item is held now by anyone or lies anywhere (a device's holder: kit.js holderOf). */
export const heldOf = (state, itemId) => holderOf(state, itemId);
/** A device's state written (w), its default dropped (the save holds it without). */
export function setSt(state, itemId, st) {
  const rec = state.items[itemId];
  if (st === DEVICE_STATES[rec.type][0]) delete rec.st; else rec.st = st;
}
