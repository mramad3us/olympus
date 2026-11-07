// OLYMPUS arms: what a marine carries, and where every item is (TECH §6.7; WEAPONS §6.2, §3.3; the build sheet 0.0.5 §2.1).
//
// One record per item, in one place: every item's record (a gun, a magazine, a pouch, the carrier,
// the ear defenders) is in state.items, wherever the item is, and its id is an ordinary counted
// item id (i<n>, CONTRACTS §10). Each item has exactly one holder, one of:
//   { pid, slot }            a person's kit.worn[slot] (carrier, head, sling): worn
//   { pid, hand: 0 | 1 }     a person's kit.hands[hand] (right, left): held
//   { container }            a container's holds list (a pouch's magazines, the carrier's pouches), in
//                            reach order, first first
//   { gun }                  a gun's mag (the magazine in it)
//   { ground: { area, x, z } } the site's lying list, places.sites.<site>.items: [{ id, area, x, z }]
// The contents ride with their container, so a pouch moved keeps its magazines (TECH §6.7, the
// reviewers' proposal changed for that reason). move(state, itemId, to) is the one function that
// changes a holder; everything else reads. The holder index (state.$items.holder: id → holder) is
// derived, runtime only, rebuilt lazily from the saved holders after a load, and kept by move, so a
// lookup never walks the state twice. A rifle stays kit.worn.sling whatever its posture: in hand is a
// posture (kit.carry.posture), not a holder (the build sheet's §3).
//
// The issue (KIT_TEMPLATES): this round's 'range-fam', the familiarisation fire's load: a plate carrier
// with two magazine pouches and a dump pouch, ear defenders, the R-7 slung front, three HAD-30s of five
// (two in the first pouch, one in the second: the range detail filled them and said so, so their counts
// start known). materialise() gives a template its items and the person their kit; the set stoppage
// (the coach's, procedural, the scene's stream) rides on a magazine as `set` (firearms.js feed()).
// kit.carry = { posture, finger, near } is the carry's own record (carry.js). Saved without defaults
// (TECH §6.6): hands absent while both are empty, finger absent while off, near absent while empty.
//
// sparesOf(state, pid, fam, { load }) lists the magazines of a family the person can reach, one held in the hand
// first (REMEDIAL ACTION's stripped magazine), then by the drills' rule (rankOf): the kind the gun is meant to
// fire first (believed so; then a kind not known; then another kind), the fullest believed within it, ties in
// reach order, one believed empty last of all (tradecraft's sparesFor, by the holder's belief: "we only know what we know"). kitView() is the
// I card's (VIEWS §8.3): believed counts and kinds only, each pouch by its name, its capacity and its reach (the
// sim's time for a magazine in from it, given by the caller), the magazine in the hand and those at your feet.
//
// 0.0.6, a magazine reached for (the user, 2026-11-07: "putting magazine in should be a "Reach for magazine"
// (or equivalent)"; WEAPONS §3.3, §5.2): the places a hand reaches into have names, pouchesOf's keys in reach
// order, 'p1', 'p2' (the chest's magazine pouches: "chest pouch 1", "chest pouch 2"), 'dump' (the dump pouch)
// and 'ground' (a magazine lying at your feet, within FEET_M: atFeetOf, nearest first). pickMag() is the
// magazine a reach takes: from a named pouch the one at its front (the order it holds them in; one put back
// goes in behind, so reaching again brings the next: the player's choice, not the rule's), from the ground the
// nearest, and by rule (a drill's reach) the first of every pouch's by the drills' rule, never the ground (a
// drill picks nothing up). handMagOf() is
// the magazine in a hand. A magazine's belief is { n?, approx?, kind?, feel? } (firearms.js): the kind the
// holder believes it holds, and the band its weight felt in the hand when the count is not known. The range's
// meant kind is the session's load (meantLoad: the course's, 'ball').
import { nextId, put } from '../../core/ids.js';
import { q } from '../../core/num.js';
import { areaOf } from '../places/model.js';
import { FAMILIES, MODELS } from './models.js';
import { newGun, newMag } from './firearms.js';

/**
 * Containers and worn things (my calls on their words and sizes): model → { type, word, slot?, holds?,
 * fits?, dump? }. The reach the I card shows (VIEWS §8.3) is the sim's own time for a magazine in
 * (firearms.js actionMs 'magIn', the caller's: kitView's magInS), from any pouch alike, so the card and
 * the step panel show one number (the parity review's: the card had shown 1.4 s and a dump pouch's 2.0 s
 * the game charged nowhere, against the panel's 1.6 s).
 */
export const CONTAINERS = Object.freeze({
  'pc-m3': Object.freeze({ type: 'carrier', word: 'plate carrier', slot: 'carrier', holds: 3, fits: Object.freeze(['pouch']) }),
  'pouch-mag2': Object.freeze({ type: 'pouch', word: 'magazine pouch', holds: 2, fits: Object.freeze(['mag']) }),
  'pouch-dump': Object.freeze({ type: 'pouch', word: 'dump pouch', holds: 4, fits: Object.freeze(['mag']), dump: true }),
  'ears-m1': Object.freeze({ type: 'ears', word: 'ear defenders', slot: 'head' }),
});

/** The issue templates: worn (slot → model), the carrier's pouches in reach order, the magazines ([family, rounds]) filling the pouches in order. */
export const KIT_TEMPLATES = Object.freeze({
  'range-fam': Object.freeze({
    worn: Object.freeze({ carrier: 'pc-m3', head: 'ears-m1', sling: 'r7' }),
    carrier: Object.freeze(['pouch-mag2', 'pouch-mag2', 'pouch-dump']),
    mags: Object.freeze([Object.freeze(['had30', 5]), Object.freeze(['had30', 5]), Object.freeze(['had30', 5])]),
    cond: 0.93, posture: 'slungFront',
  }),
  // (test-handling's setup 'mixed' (my call, the user's ask of 2026-11-07: "we may have different types of rounds in
  // inventory"): the familiarisation issue and a fourth magazine of five tracer, second in chest pouch 2; the detail
  // told the counts, not which one is the tracer (unkinded), so the choice is the hand's and the eye's)
  'range-mixed': Object.freeze({
    worn: Object.freeze({ carrier: 'pc-m3', head: 'ears-m1', sling: 'r7' }),
    carrier: Object.freeze(['pouch-mag2', 'pouch-mag2', 'pouch-dump']),
    mags: Object.freeze([Object.freeze(['had30', 5]), Object.freeze(['had30', 5]), Object.freeze(['had30', 5]), Object.freeze(['had30', 5, 'tracer'])]),
    unkinded: true, cond: 0.93, posture: 'slungFront',
  }),
});
/** A magazine at your feet is within this of you (m): where a dropped one lands (firearms.js atFeet: 0.25 to 0.45 m ahead) with room to spare. */
export const FEET_M = 1.2;
/** The pouches' names by their key (pouchesOf): the chest's magazine pouches in reach order, the dump pouch, the ground. */
export const PLACE_WORDS = Object.freeze({ p1: 'chest pouch 1', p2: 'chest pouch 2', p3: 'chest pouch 3', p4: 'chest pouch 4', dump: 'the dump pouch', ground: 'at your feet' });

/** The worn slots, in the order a kit is walked. */
export const SLOTS = Object.freeze(['carrier', 'head', 'sling']);

// ---- the holder index (runtime) ----

const rt = (state) => (state.$items ??= {});
const siteOfArea = (state, area) => areaOf(area)?.site ?? state.places?.live?.site ?? null;

/** The holder index rebuilt from the saved holders (kits, containers, guns, the sites' lying lists): id → holder. */
export function rebuildHolders(state) {
  const holder = {};
  for (const pid of Object.keys(state.people ?? {})) {
    const kit = state.people[pid]?.kit;
    if (!kit) continue;
    for (const [slot, id] of Object.entries(kit.worn ?? {})) if (id) holder[id] = { pid, slot };
    (kit.hands ?? []).forEach((id, hand) => { if (id) holder[id] = { pid, hand }; });
  }
  for (const [id, rec] of Object.entries(state.items ?? {})) {
    if (id.charCodeAt(0) === 36) continue;
    for (const c of rec?.holds ?? []) holder[c] = { container: id };
    if (rec?.type === 'gun' && rec.mag) holder[rec.mag] = { gun: id };
  }
  for (const site of Object.values(state.places?.sites ?? {})) {
    for (const l of site?.items ?? []) holder[l.id] = { ground: { area: l.area, x: l.x, z: l.z } };
  }
  rt(state).holder = holder;
  return holder;
}
const index = (state) => rt(state).holder ?? rebuildHolders(state);

/** An item's holder (see the header), or null when nothing holds it. */
export const holderOf = (state, itemId) => index(state)[itemId] ?? null;

/** The person an item is on, through its containers and its gun (a magazine in a slung rifle is on the rifle's wearer), or null. */
export function ownerOf(state, itemId) {
  let h = holderOf(state, itemId);
  for (let guard = 0; h && guard < 8; guard++) {
    if (h.pid) return h.pid;
    h = h.container ? holderOf(state, h.container) : h.gun ? holderOf(state, h.gun) : null;
  }
  return null;
}

// ---- move: the one writer of a holder ----

function detach(state, itemId, h) {
  if (!h) return;
  if (h.slot) { const k = state.people[h.pid].kit; delete k.worn[h.slot]; if (!Object.keys(k.worn).length) delete k.worn; }
  else if (h.hand !== undefined) {
    const k = state.people[h.pid].kit;
    k.hands[h.hand] = null;
    if (!k.hands.some(Boolean)) delete k.hands;
  } else if (h.container) {
    const c = state.items[h.container];
    c.holds = c.holds.filter(id => id !== itemId);
    if (!c.holds.length) delete c.holds;
  } else if (h.gun) delete state.items[h.gun].mag;
  else if (h.ground) {
    const site = state.places.sites[siteOfArea(state, h.ground.area)];
    site.items = site.items.filter(l => l.id !== itemId);
    if (!site.items.length) delete site.items;
  }
}

function canHold(state, itemId, to) {
  const item = state.items[itemId];
  if (to.slot) {
    const kit = state.people?.[to.pid]?.kit;
    if (!state.people?.[to.pid]) return `no person ${to.pid}`;
    const there = kit?.worn?.[to.slot];
    return there && there !== itemId ? `${to.pid}'s ${to.slot} is taken (${there})` : null;
  }
  if (to.hand !== undefined) {
    if (!state.people?.[to.pid]) return `no person ${to.pid}`;
    if (to.hand !== 0 && to.hand !== 1) return `no hand ${to.hand}`;
    const there = state.people[to.pid].kit?.hands?.[to.hand];
    return there && there !== itemId ? `${to.pid}'s hand ${to.hand} holds ${there}` : null;
  }
  if (to.container) {
    const c = state.items?.[to.container], C = CONTAINERS[c?.model];
    if (!c || !C?.holds) return `${to.container} holds nothing`;
    if (to.container === itemId) return 'an item cannot hold itself';
    if (C.fits && !C.fits.includes(item.type)) return `${C.word} takes no ${item.type}`;
    if ((c.holds ?? []).filter(id => id !== itemId).length >= C.holds) return `${C.word} is full`;
    return null;
  }
  if (to.gun) {
    const g = state.items?.[to.gun], M = MODELS[g?.model];
    if (!g || g.type !== 'gun') return `${to.gun} is not a gun`;
    if (item.type !== 'mag' || !(M?.fams ?? []).includes(item.fam)) return `${M?.short ?? 'it'} takes no ${item.fam ?? item.type}`;
    return g.mag && g.mag !== itemId ? `${M.short} has a magazine in` : null;
  }
  if (to.ground) return areaOf(to.ground.area) ? null : `no area ${to.ground.area}`;
  return `no such holder ${JSON.stringify(to)}`;
}

/**
 * Move an item to a holder (see the header): to is { pid, slot } | { pid, hand } | { container } |
 * { gun } | { ground: { area, x, z } }. Throws when the item is unknown or the holder can't take it.
 * Returns the new holder.
 */
export function move(state, itemId, to) {
  if (!state.items?.[itemId]) throw new Error(`kit.move(): no item ${itemId}`);
  const why = canHold(state, itemId, to);
  if (why) throw new Error(`kit.move(${itemId}): ${why}`);
  const idx = index(state);
  detach(state, itemId, idx[itemId] ?? null);
  let h;
  if (to.slot) { const k = (state.people[to.pid].kit ??= {}); (k.worn ??= {})[to.slot] = itemId; h = { pid: to.pid, slot: to.slot }; }
  else if (to.hand !== undefined) { const k = (state.people[to.pid].kit ??= {}); (k.hands ??= [null, null])[to.hand] = itemId; h = { pid: to.pid, hand: to.hand }; }
  else if (to.container) { const c = state.items[to.container]; (c.holds ??= []).push(itemId); h = { container: to.container }; }
  else if (to.gun) { state.items[to.gun].mag = itemId; h = { gun: to.gun }; }
  else {
    const g = { area: to.ground.area, x: q(to.ground.x, 0.001), z: q(to.ground.z, 0.001) };
    const site = state.places.sites[siteOfArea(state, g.area)];
    if (!site) throw new Error(`kit.move(${itemId}): the site of ${g.area} has no record`);
    (site.items ??= []).push({ id: itemId, ...g });
    h = { ground: g };
  }
  idx[itemId] = h;
  return h;
}

// ---- the issue ----

/**
 * Give a person a template's kit: the items made (ids in a fixed order: the slung gun, the carrier,
 * its pouches, the magazines, the other worn things), worn and filled, and person.kit written. sets:
 * { <the magazine's place, 1 to 3>: { n, kind } } (the coach's set stoppage). Returns { gunId, magIds,
 * containerIds, wornIds }.
 */
export function materialise(state, pid, tmplId, { sets = {} } = {}) {
  const T = KIT_TEMPLATES[tmplId], p = state.people?.[pid];
  if (!T) throw new Error(`kit.materialise(): no template '${tmplId}'`);
  if (!p) throw new Error(`kit.materialise(): no person ${pid}`);
  p.kit = { tmpl: tmplId, carry: { posture: T.posture } };
  const mk = (model) => { const id = nextId(state, 'i'); put(state, state.items, id, { type: CONTAINERS[model].type, model }); return id; };
  const gunId = T.worn.sling ? newGun(state, { model: T.worn.sling, byId: pid, cond: T.cond }) : null;
  const carrierId = T.worn.carrier ? mk(T.worn.carrier) : null;
  const pouchIds = carrierId ? T.carrier.map(mk) : [];
  const magIds = T.mags.map(([fam, n, load = 'ball'], i) => newMag(state, { fam, n, load, set: sets[i + 1] ?? null, told: true, toldKind: !T.unkinded }));
  const wornIds = [];
  for (const slot of SLOTS) {
    if (slot === 'sling' && gunId) move(state, gunId, { pid, slot });
    else if (slot === 'carrier' && carrierId) move(state, carrierId, { pid, slot });
    else if (T.worn[slot] && slot !== 'sling' && slot !== 'carrier') { const id = mk(T.worn[slot]); move(state, id, { pid, slot }); wornIds.push(id); }
  }
  for (const id of pouchIds) move(state, id, { container: carrierId });
  // (the magazines into the magazine pouches, in reach order, never the dump pouch)
  const mags = pouchIds.filter(id => !CONTAINERS[state.items[id].model].dump);
  let k = 0;
  for (const m of magIds) {
    while (k < mags.length && (state.items[mags[k]].holds ?? []).length >= CONTAINERS[state.items[mags[k]].model].holds) k++;
    if (k >= mags.length) throw new Error(`kit.materialise(): no pouch for ${m}`);
    move(state, m, { container: mags[k] });
  }
  return { gunId, magIds, containerIds: [carrierId, ...pouchIds].filter(Boolean), wornIds };
}

// ---- reading the kit ----

/** The person's containers in reach order: the worn ones, then what each holds that holds things (the carrier's pouches). */
export function containersOf(state, pid) {
  const out = [], kit = state.people?.[pid]?.kit;
  const walk = (id, depth) => {
    const rec = state.items?.[id];
    if (!rec || depth > 4) return;
    if (CONTAINERS[rec.model]?.holds) out.push(id);
    for (const c of rec.holds ?? []) if (CONTAINERS[state.items[c]?.model]?.holds) walk(c, depth + 1);
  };
  for (const slot of SLOTS) if (kit?.worn?.[slot]) walk(kit.worn[slot], 0);
  return out;
}

/** A magazine's believed rounds: its own belief's n (unknown: null). */
export const believedN = (mag) => (mag?.belief && mag.belief.n !== undefined ? mag.belief.n : null);
/** A magazine's believed kind of round ('ball', 'tracer'), or null when the holder does not know it. */
export const believedKind = (mag) => mag?.belief?.kind ?? null;
/** The kind the gun is meant to fire: the range session's load (the course's), else ball. */
export const meantLoad = (state) => state?.armoury?.range?.load ?? 'ball';

// (the drills' rule (see the header): one believed empty (counted 0, or felt so) last, whatever its kind (the
// arms role's play of setup 'mixed': a RELOAD keeping the empty reached for the empty it had just dumped, known ball
// over full ones of a kind not known); then the meant kind believed, a kind unknown, another kind; the fullest
// believed within it (an unknown count between empty and one); ties in the order given)
const emptyOf = (m) => (believedN(m) === 0 || m?.belief?.feel === 'none' ? 1 : 0);
const tierOf = (m, load) => { const k = believedKind(m); return !load || k === load ? 0 : k === null ? 1 : 2; };
const nRank = (m) => { const n = believedN(m); return n === null ? 0.5 : n; };
/** Item ids sorted by the drills' rule for a kind (see the header), stable in the order given. */
export function rankOf(state, ids, { load = null } = {}) {
  return ids.map((id, i) => ({ id, i, m: state.items[id] })).sort((a, b) => emptyOf(a.m) - emptyOf(b.m) || tierOf(a.m, load) - tierOf(b.m, load) || nRank(b.m) - nRank(a.m) || a.i - b.i).map(e => e.id);
}

/** The magazine in one of the person's hands: { id, hand } or null. */
export function handMagOf(state, pid) {
  const hands = state.people?.[pid]?.kit?.hands ?? [];
  for (let h = 0; h < hands.length; h++) if (hands[h] && state.items[hands[h]]?.type === 'mag') return { id: hands[h], hand: h };
  return null;
}

/**
 * The magazines of a family the person can reach (a hand's first, then in their pouches by the drills' rule
 * for load: see the header). fam null: any family. Unknown counts rank between an empty and one round.
 */
export function sparesOf(state, pid, fam, { load = null } = {}) {
  const hand = [], pouched = [];
  // (a magazine held in the hand first: REMEDIAL ACTION's, stripped off the double and kept to go back in)
  for (const id of state.people?.[pid]?.kit?.hands ?? []) {
    const m = id ? state.items[id] : null;
    if (m?.type === 'mag' && (!fam || m.fam === fam)) hand.push(id);
  }
  for (const c of containersOf(state, pid)) for (const id of state.items[c].holds ?? []) {
    const m = state.items[id];
    if (m?.type === 'mag' && (!fam || m.fam === fam)) pouched.push(id);
  }
  return [...hand, ...rankOf(state, pouched, { load })];
}

/** The person's magazine pouches in reach order, keyed (see the header): [{ key, id, word, dump, holds (capacity), mags: [ids], room }]. */
export function pouchesOf(state, pid) {
  const out = [];
  let k = 0;
  for (const c of containersOf(state, pid)) {
    const C = CONTAINERS[state.items[c].model];
    if (!C.fits?.includes('mag')) continue;
    const key = C.dump ? 'dump' : `p${++k}`, mags = [...(state.items[c].holds ?? [])];
    if (C.dump && out.some(p => p.key === 'dump')) continue;
    out.push({ key, id: c, word: PLACE_WORDS[key] ?? C.word, dump: !!C.dump, holds: C.holds, mags, room: C.holds - mags.length });
  }
  return out;
}
/** A pouch by its key ('p1', 'p2', 'dump'), or null. */
export const pouchOf = (state, pid, key) => pouchesOf(state, pid).find(p => p.key === key) ?? null;

/** The magazines lying at the person's feet (within FEET_M of their actor), nearest first: [{ id, x, z, dM }]. */
export function atFeetOf(state, pid) {
  const a = state.actors?.list?.find(x => x.who === pid), area = state.actors?.area ?? state.places?.live?.area;
  if (!a || !area) return [];
  return lyingOf(state, area).filter(l => state.items[l.id]?.type === 'mag').map(l => ({ ...l, dM: Math.hypot(l.x - a.x, l.z - a.z) }))
    .filter(l => l.dM <= FEET_M).sort((p, q2) => p.dM - q2.dM || (p.id < q2.id ? -1 : 1));
}

/**
 * The magazine a reach takes (see the header), of the gun's families: from 'p1', 'p2' or 'dump' the one at the
 * pouch's front, from 'ground' the nearest at your feet, by 'rule' the first of every pouch's by the drills' rule
 * (sparesOf without the hand). Returns { id, from: key } or null.
 */
export function pickMag(state, pid, { from = 'rule', fams = null, load = meantLoad(state) } = {}) {
  const ok = (id) => state.items[id]?.type === 'mag' && (!fams || fams.includes(state.items[id].fam));
  if (from === 'ground') { const l = atFeetOf(state, pid).find(x => ok(x.id)); return l ? { id: l.id, from } : null; }
  if (from === 'rule') {
    const all = pouchesOf(state, pid).flatMap(p => p.mags.filter(ok).map(id => ({ id, key: p.key })));
    const id = rankOf(state, all.map(e => e.id), { load })[0];
    return id ? { id, from: all.find(e => e.id === id).key } : null;
  }
  const p = pouchOf(state, pid, from), id = p ? p.mags.find(ok) ?? null : null;
  return id ? { id, from } : null;
}

/** The person's dump pouch with room, or null. */
export function dumpOf(state, pid) {
  for (const c of containersOf(state, pid)) {
    const C = CONTAINERS[state.items[c].model];
    if (C.dump && (state.items[c].holds ?? []).length < C.holds) return c;
  }
  return null;
}

/** Where a magazine coming out goes to be pouched: the first magazine pouch with room, in reach order, else the dump pouch, else null. */
export function pouchFor(state, pid) {
  for (const c of containersOf(state, pid)) {
    const C = CONTAINERS[state.items[c].model];
    if (!C.dump && C.fits?.includes('mag') && (state.items[c].holds ?? []).length < C.holds) return c;
  }
  return dumpOf(state, pid);
}

/** The items lying on an area: [{ id, x, z }] (the site's lying list). */
export function lyingOf(state, area) {
  const site = state.places?.sites?.[siteOfArea(state, area)];
  return (site?.items ?? []).filter(l => l.area === area).map(l => ({ id: l.id, x: l.x, z: l.z }));
}

const wordOf = (rec) => (rec?.type === 'mag' ? FAMILIES[rec.fam]?.word ?? 'a magazine' : rec?.type === 'gun' ? MODELS[rec.model]?.name ?? 'a gun' : CONTAINERS[rec?.model]?.word ?? rec?.type ?? '?');

// (a magazine as the holder believes it, for the I card and the weapon card: its count, its kind, its weight's band)
const magBelief = (id, m, reachS) => ({ id, kind: m?.type, word: wordOf(m), n: believedN(m), approx: !!m?.belief?.approx, load: believedKind(m), feel: m?.belief?.feel ?? null, reachS });

/**
 * The I card's view (VIEWS §8.3): { groups: [{ id, key, word, holds, reachS, items: [{ id, kind, word, n, approx,
 * load, feel, reachS }] }], hand: an item or null, feet: [items], sling: { gunId, posture } }, believed counts and
 * kinds only (holds: the container's capacity; reachS the caller's magInS, the sim's time for a magazine in from
 * a pouch, 0 when none is given; the feet's groundS, a pickup's and the seat's).
 */
export function kitView(state, pid, { magInS = null, groundS = null } = {}) {
  const reach = Number.isFinite(magInS) ? magInS : 0, ground = Number.isFinite(groundS) ? groundS : 0;
  const kit = state.people?.[pid]?.kit;
  if (!kit) return { groups: [], hand: null, feet: [], sling: null };
  const worn = [];
  for (const slot of SLOTS) {
    const id = kit.worn?.[slot];
    if (id && slot !== 'sling') worn.push({ id, kind: state.items[id]?.type, word: wordOf(state.items[id]), n: null, approx: false, reachS: 0 });
  }
  const groups = worn.length ? [{ id: 'worn', word: 'worn', items: worn }] : [];
  for (const p of pouchesOf(state, pid)) groups.push({ id: p.id, key: p.key, word: p.word, holds: p.holds, reachS: reach, items: p.mags.map(id => magBelief(id, state.items[id], reach)) });
  const h = handMagOf(state, pid);
  return {
    groups, hand: h ? magBelief(h.id, state.items[h.id], 0) : null, feet: atFeetOf(state, pid).map(l => magBelief(l.id, state.items[l.id], ground)),
    sling: kit.worn?.sling ? { gunId: kit.worn.sling, posture: kit.carry?.posture ?? 'slungFront' } : null,
  };
}
