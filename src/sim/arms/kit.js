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
// meant kind is the session's load (meantLoad: the course's, 'ball'). topUpGains() (the hunt of v0.0.18) is whether a Top up
// can change the magazine in by that rule: every Top up offered asks it.
// 0.0.7 (the build sheet 0.0.7 §2.3, §3.1): test-range's 'range-kd' issue (the zero's four magazines of three, the ear
// defenders 'ed1' worn in their own slot, kit.worn.ears: SLOTS gains 'ears', last, so the other templates' items and
// ids are as before; earsOn reads it), and discard(), the coach taking a magazine back at the turn-in.
// 0.0.8 (the build sheet 0.0.8 §2.3): test-pairs' 'range-pairs' issue: the R-7 slung front, a carrier of three magazine
// pouches (no dump pouch), ear defenders in their own slot, magazines of 10, 10 and 2 (the scene puts one in each
// pouch: chest pouches 1, 2 and 3, the two-round one third, as the coach names it).
// 0.0.12 (the build sheet 0.0.12 §2.1, §4, §8 items 11, 12, 15; WEAPONS §3, §8.3; BODY §17.3): the combat EVA suit as
// worn kit, 'ces-1', in its own slot (kit.worn.suit: SLOTS gains 'suit' before 'ears', so 'ears' stays last and no
// other template's items or ids move): black (the Corps' armour colour, no red), 16 kg, its visor down (flash
// filtered: supp.js protOf reads a worn item of type 'suit' as { visor: true, ears: 'suit' }, EARPRO_K ×0.6, never
// deafened), worn unpressurised in the Wheel's air, so no glove or bulk penalty (WEAPONS §3: the gloves' penalty
// "worn down"). test-shoothouse's issue 'house-cqb': the suit, the plate carrier with two magazine pouches and a dump
// pouch, the R-7 slung, three magazines of 10 frangible (the house's load: the scene sets the instructor's dummy in
// the first, the one a LOAD takes first, by `sets`), at low ready; no ear defenders (the suit filters). Every worn
// thing now has its massKg (my calls but the suit's, the sheet's; the carrier's 4.0 kg is WEAPONS §8.3's soft panel,
// its plates not in for training, and from v0.0.20 rated so: its `armour` 'carrierTraining', penetrate.js ARMOUR, the soft
// panel over 0.85 of the torso, read by the live lane's would-have, combat/would.js), and kitMassKg(state, pid) is what a person carries: the worn items, what they
// hold, the rifle and its optic, the magazines and their rounds (6.5×40's case, powder and bullet by the load:
// src/sim/arms/calibres.js), 25.7 kg in 'house-cqb' (BODY §16.2's 25 kg of kit, the push and the brake's r).
// 2026-11-13 (the shoot house's rework R6, COMBAT §25.19.6; WEAPONS §3.2's note): the sidearm. issueSidearm(state, pid, spec) gives a
// person the P-12 in a thigh holster on the right (kit.worn.holster: the gun itself, worn as the rifle is on its sling) with a
// HAD-17 of ten frangible seated (Condition 3: the armourer's issue, the chamber empty, on safe; MAKE READY racks it) and a
// spare in the pistol pouch on the thigh (kit.worn.thigh, 'pouch-p12', holding the P-12's family only: `fams`). Its ids come
// after every other item of the fill, so a sheet without it keeps its ids, and SLOTS gains 'holster' and 'thigh' after 'ears'.
// handGunOf(state, pid) is a gun held in a hand (the P-12 drawn: kit.hands[0], the strong hand), which is then the gun the
// person uses (shooting.js gunOn) and carries (carry.js carryOf: kit.carry.posture is that gun's while it is out, the rifle
// hanging); pistolOf the P-12 carried, holstered or drawn. The pistol pouch is keyed 'pp' ("the pistol pouch"), never one of
// the chest's numbered pouches, and a rifle magazine coming out is never put in it (pouchFor).
// v0.0.19 (the build sheet v0.0.19 §1 L-opfor, §5; COMBAT §25.18; src/sim/scenarios/opfor.js): the live lane's kit. The force-on-
// force mask ('fof-mask', 0.6 kg, my call) is worn in its own slot, kit.worn.mask, which only a mask takes and a mask takes only
// (canHold); it is in WORN_SLOTS (SLOTS and 'mask', last), which the issue, the I card and what a person carries walk, while SLOTS
// itself stands as it was so every kit's other ids stand. Two issues: 'opfor-fof', the role-players' (utilities, the carrier
// with two magazine pouches, the mask, the R-7 slung with two HAD-30s of ten marking rounds: the scene seats the first and racks
// it, Condition 1 at low ready), and 'house-fof', the marines' on the live lane ('house-cqb' with marking in place of frangible,
// the instructor's dummy riding as built); FOF_SIDEARM is its P-12's issue, two HAD-17s of ten marking. Marking is a load of
// calibres.js (never a range's issue).
// v0.0.24 (the anywhere round's step 5, rebased by stage 0 from the parked stash of 2026-11-11; BODY §16.6; COMBAT §14.8): the
// mag boots, 'mb-1', magnetic overboots of 2.4 kg (my call), worn in their own slot, kit.worn.boots: WORN_SLOTS gains 'boots'
// after 'mask' (never SLOTS, which the I card's carrier walk reads), so no shipped kit's items or ids move; wear(state, pid,
// model) puts one worn thing on. Their magnets are the footing's (src/sim/body/footing.js: the actor's anchor 'boots', locked
// and released as steps, src/sim/arms/shooting.js bootsRow), and they hold only on a ferrous face (PLACES §2.7).
import { nextId, put } from '../../core/ids.js';
import { q } from '../../core/num.js';
import { areaOf } from '../places/model.js';
import { FAMILIES, MODELS, OPTICS, famCap, isLong } from './models.js';
import { CALIBRES, loadOf } from './calibres.js';
import { newGun, newMag, beliefOf } from './firearms.js';
import { DEVICES } from './devicetable.js';

/**
 * Containers and worn things (my calls on their words and sizes): model → { type, word, slot?, holds?,
 * fits?, dump?, armour? (a carrier's penetrate.js ARMOUR kind) }. The reach the I card shows (VIEWS §8.3) is the sim's own time for a magazine in
 * (firearms.js actionMs 'magIn', the caller's: kitView's magInS), from any pouch alike, so the card and
 * the step panel show one number (the parity review's: the card had shown 1.4 s and a dump pouch's 2.0 s
 * the game charged nowhere, against the panel's 1.6 s).
 */
export const CONTAINERS = Object.freeze({
  // (v0.0.18: its four faces (loadout.js): `holds` is the front's count, every kit before took the front alone; a pouch whose
  // record says `at` rides that face, at most faces[at] of them (canHold))
  // (`armour`, the kind of penetrate.js ARMOUR it is worn as, its plates out for training (the header's 4.0 kg), read by the
  // live lane's would-have (combat/would.js); a data field, no item or id moves)
  'pc-m3': Object.freeze({ type: 'carrier', word: 'plate carrier', slot: 'carrier', holds: 3, fits: Object.freeze(['pouch']), massKg: 4.0, faces: Object.freeze({ front: 3, left: 2, right: 2, back: 1 }), armour: 'carrierTraining' }),
  'pouch-mag2': Object.freeze({ type: 'pouch', word: 'magazine pouch', holds: 2, fits: Object.freeze(['mag']), massKg: 0.15 }),
  'pouch-dump': Object.freeze({ type: 'pouch', word: 'dump pouch', holds: 4, fits: Object.freeze(['mag']), dump: true, massKg: 0.2 }),
  'ears-m1': Object.freeze({ type: 'ears', word: 'ear defenders', slot: 'head', massKg: 0.35 }),
  // (0.0.7: the KD's ear defenders, worn in their own slot, kit.worn.ears (the build sheet 0.0.7 §3.1, §8 item 18))
  ed1: Object.freeze({ type: 'ears', word: 'ear defenders', slot: 'ears', massKg: 0.35 }),
  // (0.0.12: the combat EVA suit, worn unpressurised with its visor down (see the header))
  'ces-1': Object.freeze({ type: 'suit', word: 'combat EVA suit', slot: 'suit', visor: true, massKg: 16, colour: 'black' }),
  // (the rework's R6: the P-12's spare on the thigh, below the holster (see the header))
  'pouch-p12': Object.freeze({ type: 'pouch', word: 'pistol magazine pouch', slot: 'thigh', holds: 2, fits: Object.freeze(['mag']), fams: Object.freeze(['had17']), pistol: true, massKg: 0.1 }),
  // (v0.0.18, the loadout (WEAPONS §12.7): a grenade's pouch, a charge's with its firing device, a tool's scabbard on the back)
  'pouch-gren': Object.freeze({ type: 'pouch', word: 'grenade pouch', holds: 1, fits: Object.freeze(['grenade']), massKg: 0.08 }),
  'pouch-charge': Object.freeze({ type: 'pouch', word: 'charge pouch', holds: 2, fits: Object.freeze(['charge', 'initiator']), massKg: 0.15 }),
  'scab-tool': Object.freeze({ type: 'pouch', word: 'tool scabbard', holds: 1, fits: Object.freeze(['tool']), massKg: 0.3 }),
  // (v0.0.19: the force-on-force mask, worn in its own slot by the live lane's role-players (see the header))
  'fof-mask': Object.freeze({ type: 'mask', word: 'force-on-force mask', slot: 'mask', massKg: 0.6 }),
  // (the anywhere round's step 5: the mag boots, magnetic overboots worn in their own slot, kit.worn.boots (see the header))
  'mb-1': Object.freeze({ type: 'boots', word: 'mag boots', slot: 'boots', massKg: 2.4 }),
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
  // (0.0.7, test-range's issue (the build sheet 0.0.7 §2.3, §8 item 24): the R-7 (its zero drawn by the scene, the SO-4
  // at 1x), the carrier and its pouches, ear defenders in their own slot, the zero's four magazines of three; the 300 m
  // and the 200 m lines' magazines are issued at the line, behind the splash)
  'range-kd': Object.freeze({
    worn: Object.freeze({ carrier: 'pc-m3', sling: 'r7', ears: 'ed1' }),
    carrier: Object.freeze(['pouch-mag2', 'pouch-mag2', 'pouch-dump']),
    mags: Object.freeze([Object.freeze(['had30', 3]), Object.freeze(['had30', 3]), Object.freeze(['had30', 3]), Object.freeze(['had30', 3])]),
    cond: 0.93, posture: 'slungFront',
  }),
  // (0.0.8, test-pairs' issue (see the header))
  'range-pairs': Object.freeze({
    worn: Object.freeze({ carrier: 'pc-m3', sling: 'r7', ears: 'ed1' }),
    carrier: Object.freeze(['pouch-mag2', 'pouch-mag2', 'pouch-mag2']),
    mags: Object.freeze([Object.freeze(['had30', 10]), Object.freeze(['had30', 10]), Object.freeze(['had30', 2])]),
    cond: 0.93, posture: 'slungFront',
  }),
  // (0.0.12, test-shoothouse's issue (see the header): the suit, no ear defenders, three magazines of 10 frangible, low ready)
  'house-cqb': Object.freeze({
    worn: Object.freeze({ suit: 'ces-1', carrier: 'pc-m3', sling: 'r7' }),
    carrier: Object.freeze(['pouch-mag2', 'pouch-mag2', 'pouch-dump']),
    mags: Object.freeze([Object.freeze(['had30', 10, 'frangible']), Object.freeze(['had30', 10, 'frangible']), Object.freeze(['had30', 10, 'frangible'])]),
    cond: 0.93, posture: 'lowReady',
  }),
  // (v0.0.19, the live lane (see the header): the role-players' issue, two magazines of ten marking, the mask in its slot)
  'opfor-fof': Object.freeze({
    worn: Object.freeze({ carrier: 'pc-m3', sling: 'r7', mask: 'fof-mask' }),
    carrier: Object.freeze(['pouch-mag2', 'pouch-mag2']),
    mags: Object.freeze([Object.freeze(['had30', 10, 'marking']), Object.freeze(['had30', 10, 'marking'])]),
    cond: 0.93, posture: 'lowReady',
  }),
  // (v0.0.19: the marines' issue on the live lane, 'house-cqb' with marking rounds in place of frangible)
  'house-fof': Object.freeze({
    worn: Object.freeze({ suit: 'ces-1', carrier: 'pc-m3', sling: 'r7' }),
    carrier: Object.freeze(['pouch-mag2', 'pouch-mag2', 'pouch-dump']),
    mags: Object.freeze([Object.freeze(['had30', 10, 'marking']), Object.freeze(['had30', 10, 'marking']), Object.freeze(['had30', 10, 'marking'])]),
    cond: 0.93, posture: 'lowReady',
  }),
});
/** The P-12's issue on the live lane (v0.0.19; kit.js issueSidearm's spec): two HAD-17s of ten marking. */
export const FOF_SIDEARM = Object.freeze({ model: 'p12', mags: Object.freeze([Object.freeze(['had17', 10, 'marking']), Object.freeze(['had17', 10, 'marking'])]) });
/** A magazine at your feet is within this of you (m): where a dropped one lands (firearms.js atFeet: 0.25 to 0.45 m ahead) with room to spare. */
export const FEET_M = 1.2;
/** The pouches' names by their key (pouchesOf): the chest's magazine pouches in reach order, the dump pouch, the ground. */
export const PLACE_WORDS = Object.freeze({ p1: 'chest pouch 1', p2: 'chest pouch 2', p3: 'chest pouch 3', p4: 'chest pouch 4', dump: 'the dump pouch', pp: 'the pistol pouch', ground: 'at your feet' });

/** The worn slots, in the order a kit is walked (0.0.12's 'suit' before 'ears', so the other kits' ids stand; the rework's R6 the sidearm's holster and thigh pouch after them). */
export const SLOTS = Object.freeze(['carrier', 'head', 'sling', 'suit', 'ears', 'holster', 'thigh']);
/** Every worn slot in walking order: SLOTS, then v0.0.19's 'mask' (the live lane's role-players) and v0.0.24's 'boots' (the mag boots; see the header), so no other kit's ids move. */
export const WORN_SLOTS = Object.freeze([...SLOTS, 'mask', 'boots']);
/** Whether a person wears ear defenders in their own slot (0.0.7: the KD's; the sound is heard through them). */
export const earsOn = (state, pid) => !!state.people?.[pid]?.kit?.worn?.ears;

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
    // (v0.0.19: the mask's slot takes a mask, and a mask goes nowhere else worn)
    if ((to.slot === 'mask') !== (item.type === 'mask')) return to.slot === 'mask' ? `${to.pid}'s mask slot takes no ${item.type}` : `a mask is worn in its own slot, not ${to.slot}`;
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
    if (C.fams && !C.fams.includes(item.fam)) return `${C.word} takes no ${item.fam ?? item.type}`;
    // (a carrier's faces (v0.0.18): a pouch riding a face counts against that face, the front's against `holds` as before)
    if (C.faces) {
      const at = item.at ?? 'front', n = (c.holds ?? []).filter(id => id !== itemId && (state.items[id]?.at ?? 'front') === at).length;
      if (!Object.hasOwn(C.faces, at)) return `${C.word} has no ${at} face`;
      return n >= (at === 'front' ? C.holds : C.faces[at]) ? `the ${at === 'front' ? 'front' : at === 'back' ? 'back' : `${at} side`} holds ${at === 'front' ? C.holds : C.faces[at]}` : null;
    }
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

/**
 * An item taken off the game (w): out of its holder and out of state.items, with what it holds (a magazine handed
 * back to the coach at the KD's turn-in, 0.0.7). Returns whether it was there.
 */
export function discard(state, itemId) {
  const rec = state.items?.[itemId];
  if (!rec) return false;
  for (const c of [...(rec.holds ?? [])]) discard(state, c);
  if (rec.type === 'gun' && rec.mag) discard(state, rec.mag);
  const idx = index(state);
  detach(state, itemId, idx[itemId] ?? null);
  delete idx[itemId];
  delete state.items[itemId];
  return true;
}

// ---- the issue ----

/**
 * Give a person a template's kit: the items made (ids in a fixed order: the slung gun, the carrier,
 * its pouches, the magazines, the other worn things), worn and filled, and person.kit written. sets:
 * { <the magazine's place, 1 to 3>: { n, kind } } (the coach's set stoppage); finish: the squad's
 * finish (src/data/finishes.js; one kit per squad, WEAPONS §3.10: a squad's issue is materialised with
 * one finish, none the Corps' black). Returns { gunId, magIds, containerIds, wornIds }.
 */
export function materialise(state, pid, tmplId, { sets = {}, finish = null } = {}) {
  const T = KIT_TEMPLATES[tmplId], p = state.people?.[pid];
  if (!T) throw new Error(`kit.materialise(): no template '${tmplId}'`);
  if (!p) throw new Error(`kit.materialise(): no person ${pid}`);
  p.kit = { tmpl: tmplId, carry: { posture: T.posture } };
  const mk = (model) => { const id = nextId(state, 'i'); put(state, state.items, id, { type: CONTAINERS[model].type, model }); return id; };
  const gunId = T.worn.sling ? newGun(state, { model: T.worn.sling, byId: pid, cond: T.cond, finish }) : null;
  const carrierId = T.worn.carrier ? mk(T.worn.carrier) : null;
  const pouchIds = carrierId ? T.carrier.map(mk) : [];
  const magIds = T.mags.map(([fam, n, load = 'ball'], i) => newMag(state, { fam, n, load, set: sets[i + 1] ?? null, told: true, toldKind: !T.unkinded }));
  const wornIds = [];
  for (const slot of WORN_SLOTS) {
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

/**
 * The sidearm issued (w; see the header): spec { model, mags: [[family, rounds, load]…], cond }: the gun in kit.worn.holster with
 * the first magazine seated (Condition 3, on safe, believed so, its count told), the rest in the thigh's pistol pouch. Its ids
 * after everything else of the fill. Returns { gunId, magIds, pouchId }.
 */
export function issueSidearm(state, pid, { model = 'p12', mags = [['had17', 10, 'frangible'], ['had17', 10, 'frangible']], cond = 0.93 } = {}) {
  if (!state.people?.[pid]?.kit) throw new Error(`kit.issueSidearm(): ${pid} has no kit`);
  const gunId = newGun(state, { model, byId: pid, cond });
  const pouchId = nextId(state, 'i');
  put(state, state.items, pouchId, { type: 'pouch', model: 'pouch-p12' });
  const magIds = mags.map(([fam, n, load = 'ball']) => newMag(state, { fam, n, load, told: true }));
  move(state, gunId, { pid, slot: 'holster' });
  move(state, pouchId, { pid, slot: 'thigh' });
  if (magIds[0]) {
    move(state, magIds[0], { gun: gunId });
    const g = state.items[gunId], m = state.items[magIds[0]];
    g.belief = { chamber: 'empty', count: m.n, ...(m.belief?.kind ? { load: m.belief.kind } : {}), ...(m.n < famCap(m.fam) ? { fullN: m.n } : {}) };
    delete m.belief;
  }
  for (const id of magIds.slice(1)) move(state, id, { container: pouchId });
  return { gunId, magIds, pouchId };
}
/** The gun a person holds in a hand (the P-12 drawn), or null: then the gun they use (see the header). */
export function handGunOf(state, pid) {
  for (const id of state.people?.[pid]?.kit?.hands ?? []) if (id && state.items?.[id]?.type === 'gun') return id;
  return null;
}
/** The pistol a person carries, holstered or in hand, or null. */
export function pistolOf(state, pid) {
  const k = state.people?.[pid]?.kit;
  if (!k) return null;
  if (k.worn?.holster) return k.worn.holster;
  const h = handGunOf(state, pid);
  return h && !isLong(MODELS[state.items[h]?.model]) ? h : null;
}
/**
 * A worn thing put on a person (v0.0.24's step 5: the mag boots for a scene or a test; any CONTAINERS row with a slot): the item made and
 * moved into its slot. Throws for a model with no slot or a slot already taken. Returns the item's id.
 */
export function wear(state, pid, model) {
  const C = CONTAINERS[model];
  if (!C?.slot) throw new Error(`kit.wear(): '${model}' is not worn`);
  const id = nextId(state, 'i');
  put(state, state.items, id, { type: C.type, model });
  move(state, id, { pid, slot: C.slot });
  return id;
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

// ---- what a person carries ----

/** A round's mass, grams: its calibre's case and powder and its load's bullet (a dummy or a blank: the case and a ball bullet, no powder). */
export function roundMassG(cal, load = 'ball') {
  const C = CALIBRES[cal];
  if (!C) throw new Error(`kit.roundMassG(): no calibre '${cal}'`);
  const L = loadOf(cal, load), ball = loadOf(cal, 'ball');
  return C.caseG + (L?.massG !== undefined ? C.propG + L.massG : ball?.massG ?? 0);
}
/** A magazine's mass, grams: its family's empty mass and its rounds (the set round counted as one of its kind). */
export function magMassG(mag) {
  const F = FAMILIES[mag?.fam];
  if (!F) return 0;
  return F.emptyG + (mag.n ?? 0) * roundMassG(F.cal, mag.load ?? 'ball');
}
// (an item's own mass and what it holds, kilograms: a gun with its optic and the magazine in it, a container with its contents)
function itemKg(state, id, depth = 0) {
  const rec = state.items?.[id];
  if (!rec || depth > 6) return 0;
  if (rec.type === 'mag') return magMassG(rec) / 1000;
  // (a device's own mass (v0.0.18: devices.js DEVICES); a worn thing's, the mask's too (v0.0.19), its CONTAINERS massKg below)
  if (DEVICES[rec.model] && rec.type === DEVICES[rec.model].kind) return DEVICES[rec.model].massKg;
  if (rec.type === 'gun') {
    const M = MODELS[rec.model];
    return (M?.massKg ?? 0) + (OPTICS[M?.optic]?.massG ?? 0) / 1000 + (rec.mag ? itemKg(state, rec.mag, depth + 1) : 0);
  }
  return (CONTAINERS[rec.model]?.massKg ?? 0) + (rec.holds ?? []).reduce((n, c) => n + itemKg(state, c, depth + 1), 0);
}
/** What a person carries, kilograms to 0.01 (see the header): the worn items with what they hold, the rifle, the magazines in the hands. */
export function kitMassKg(state, pid) {
  const kit = state.people?.[pid]?.kit;
  if (!kit) return 0;
  let kg = 0;
  for (const slot of WORN_SLOTS) if (kit.worn?.[slot]) kg += itemKg(state, kit.worn[slot]);
  for (const id of kit.hands ?? []) if (id) kg += itemKg(state, id);
  return q(kg, 0.01);
}

/** A magazine's believed rounds: its own belief's n (unknown: null). */
export const believedN = (mag) => (mag?.belief && mag.belief.n !== undefined ? mag.belief.n : null);
/** A magazine's bucket as its holder believes it: '0' counted empty or felt so, '?' unknown, else '+' (plan.js's abstraction; pickMag's ground reach). */
export const magBucket = (m) => (believedN(m) === 0 || m?.belief?.feel === 'none' ? '0' : believedN(m) === null && !m?.belief?.feel ? '?' : '+');
/** The buckets best first: rounds believed, unknown, believed empty. */
export const BUCKET_RANK = Object.freeze({ '+': 0, '?': 1, '0': 2 });
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
// (the rule on two magazines' records, without the order given: below 0 when a ranks first)
const byRule = (a, b, load) => emptyOf(a) - emptyOf(b) || tierOf(a, load) - tierOf(b, load) || nRank(b) - nRank(a);
/** Item ids sorted by the drills' rule for a kind (see the header), stable in the order given. */
export function rankOf(state, ids, { load = null } = {}) {
  return ids.map((id, i) => ({ id, i, m: state.items[id] })).sort((a, b) => byRule(a.m, b.m, load) || a.i - b.i).map(e => e.id);
}

/**
 * Whether a Top up can change the magazine in, the one rule for every Top up offered (drills.js macrosFor's, plan.js gunRows'
 * sidearm row, bundle.js's reorg): the magazine in, as the stow will leave it (its count and kind the gun's belief, as
 * firearms.js moveCount writes them), against the pouched magazines of the gun's families by the reach's own rule (pickMag
 * 'rule', the meant load): a gain only where the one the reach would take ranks strictly above it and is fuller, or of a
 * better kind than a kind known in (one empty in: any not believed empty). A magazine of the gun's families in a hand, not
 * believed empty, is a change (the seat takes it), and so is the session's named magazine in a pouch (R.wantMag: Top up
 * reaches for its pouch, specials.js). Before (the hunt of v0.0.18 and its review), the reach took the fullest straight back
 * where the fullest was already in, or where the only other was of a count unknown (ranked between an empty and one): the
 * stow and the reach, 3 s for nothing, and the row offered again for ever, on the rifle and on the P-12 in the shoot house.
 */
export function topUpGains(state, pid, gunId, b = beliefOf(state, gunId)) {
  const g = state.items?.[gunId];
  if (!g || !b || b.mag !== 'in' || !g.mag) return false;
  const fams = MODELS[g.model]?.fams ?? null, ok = (id) => state.items[id]?.type === 'mag' && (!fams || fams.includes(state.items[id].fam));
  const h = handMagOf(state, pid);
  if (h && ok(h.id) && believedN(state.items[h.id]) !== 0 && state.items[h.id]?.belief?.feel !== 'none') return true;
  const pouches = pouchesOf(state, pid), want = state.armoury?.range?.wantMag ?? null;
  if (want && g.mag !== want && pouches.some(p => !p.dump && p.mags.includes(want))) return true;
  const belief = {};
  if (typeof b.count === 'number') { belief.n = b.count; if (b.countApprox) belief.approx = true; }
  if (b.magLoad) belief.kind = b.magLoad;
  const stowed = { ...state.items[g.mag], belief }, load = meantLoad(state);
  // (the one the reach takes: the first of the pouched by the rule, where it ranks above the stowed one)
  let best = null;
  for (const p of pouches) for (const id of p.mags) if (ok(id) && (!best || byRule(state.items[id], best, load) < 0)) best = state.items[id];
  if (!best || byRule(best, stowed, load) >= 0) return false;
  // (a change is a gain where it is fuller, or of a kind better than one known in. Not for a kind in not known alone: the
  // range's fills seat a magazine with its kind unsaid (handling.js, pairs.js, shoothouse.js), and a ten of ball known for a
  // ten of a kind unknown, or a four for a five, is 3 s for nothing the shooter would want)
  return emptyOf(stowed) > emptyOf(best) || nRank(best) > nRank(stowed) || (!!b.magLoad && tierOf(best, load) < tierOf(stowed, load));
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
    const key = C.dump ? 'dump' : C.pistol ? 'pp' : `p${++k}`, mags = [...(state.items[c].holds ?? [])];
    if ((C.dump || C.pistol) && out.some(p => p.key === key)) continue;
    out.push({ key, id: c, word: PLACE_WORDS[key] ?? C.word, dump: !!C.dump, holds: C.holds, mags, room: C.holds - mags.length, ...(C.fams ? { fams: C.fams } : {}) });
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
 * pouch's front, from 'ground' the best believed at your feet (magBucket: rounds, unknown, then felt empty), the nearest of those, by 'rule' the first of every pouch's by the drills' rule
 * (sparesOf without the hand). Returns { id, from: key } or null.
 */
export function pickMag(state, pid, { from = 'rule', fams = null, load = meantLoad(state) } = {}) {
  const ok = (id) => state.items[id]?.type === 'mag' && (!fams || fams.includes(state.items[id].fam));
  // (from the ground the best believed first, then the nearest: the planner's abstraction keeps the best bucket at the feet (plan.js
  // absOf), and the reach taking the nearest seated the P-12 magazine just dropped and felt empty four times running while a full one
  // lay 0.15 m further (the hunt of v0.0.20, breach-7))
  if (from === 'ground') { const l = atFeetOf(state, pid).filter(x => ok(x.id)).sort((a, b) => BUCKET_RANK[magBucket(state.items[a.id])] - BUCKET_RANK[magBucket(state.items[b.id])])[0]; return l ? { id: l.id, from } : null; }
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

/**
 * Where a magazine coming out goes to be pouched: with its family, the first pouch made for that family with room (the P-12's
 * HAD-17 back to the thigh's pistol pouch; v0.0.17 skipped every pouch with fams and put it in a rifle's chest pouch); then the
 * first magazine pouch with room, in reach order, else the dump pouch, else null. fam null, or a rifle's, is v0.0.17's rule.
 */
export function pouchFor(state, pid, fam = null) {
  if (fam) for (const c of containersOf(state, pid)) {
    const C = CONTAINERS[state.items[c].model];
    if (!C.dump && C.fams?.includes(fam) && C.fits?.includes('mag') && (state.items[c].holds ?? []).length < C.holds) return c;
  }
  for (const c of containersOf(state, pid)) {
    const C = CONTAINERS[state.items[c].model];
    if (!C.dump && !C.fams && C.fits?.includes('mag') && (state.items[c].holds ?? []).length < C.holds) return c;
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
 * load, feel, reachS }] }], hand: a magazine in the hand or null, held: [the other things in the hands, a gun or a device],
 * feet: [items], sling: { gunId, posture ('hanging' while another gun is in the hand) } }, believed counts and
 * kinds only (holds: the container's capacity; reachS the caller's magInS, the sim's time for a magazine in from
 * a pouch, 0 when none is given; the feet's groundS, a pickup's and the seat's).
 */
export function kitView(state, pid, { magInS = null, groundS = null, devReachS = null } = {}) {
  const reach = Number.isFinite(magInS) ? magInS : 0, ground = Number.isFinite(groundS) ? groundS : 0;
  const kit = state.people?.[pid]?.kit;
  if (!kit) return { groups: [], hand: null, held: [], feet: [], sling: null };
  const worn = [];
  for (const slot of WORN_SLOTS) {
    const id = kit.worn?.[slot];
    if (id && slot !== 'sling') worn.push({ id, kind: state.items[id]?.type, word: wordOf(state.items[id]), n: null, approx: false, reachS: 0 });
  }
  const groups = worn.length ? [{ id: 'worn', word: 'worn', items: worn }] : [];
  for (const p of pouchesOf(state, pid)) groups.push({ id: p.id, key: p.key, word: p.word, holds: p.holds, reachS: reach, items: p.mags.map(id => magBelief(id, state.items[id], reach)) });
  // (v0.0.18: the device pouches as groups by the carrier's face, each item its word and its reach (the caller's devReachS(model,
  // face), the sim's deviceMs), so the I card and the loadout screen show one number)
  for (const c of containersOf(state, pid)) {
    const rec = state.items[c], C = CONTAINERS[rec.model];
    if (!C?.fits || C.fits.includes('mag') || C.fits.includes('pouch')) continue;
    const face = rec.at ?? 'front';
    groups.push({ id: c, key: `dev:${face}`, word: `${C.word}, ${face === 'back' ? 'on the back' : face === 'front' ? 'front' : `${face} side`}`, holds: C.holds, face, reachS: 0,
      items: (rec.holds ?? []).map(id => { const d = state.items[id], D = DEVICES[d?.model]; const s = typeof devReachS === 'function' ? devReachS(d?.model, face) : 0; return { id, kind: d?.type, word: D?.word ?? d?.model, model: d?.model, n: null, approx: false, load: null, feel: null, st: d?.st ?? null, massKg: D?.massKg ?? 0, reachS: s }; }) });
  }
  const h = handMagOf(state, pid), hg = handGunOf(state, pid);
  // (the hunt of v0.0.18: what else is in the hands, a gun (the P-12 drawn) or a device (a G-11, the halligan, a charge),
  // listed as held, since it has left the slot or the pouch the card lists; and the rifle's carry is the hand gun's while another
  // gun is out (the header), so the sling's word is then 'hanging', as guns.js gunPlaceOf reads it)
  const held = (kit.hands ?? []).filter(id => id && state.items[id] && state.items[id].type !== 'mag').map(id => {
    const r = state.items[id], D = DEVICES[r.model];
    return { id, kind: r.type, word: D?.word ?? wordOf(r), model: r.model, n: null, approx: false, load: null, feel: null, reachS: 0 };
  });
  return {
    groups, hand: h ? magBelief(h.id, state.items[h.id], 0) : null, held, feet: atFeetOf(state, pid).map(l => magBelief(l.id, state.items[l.id], ground)),
    sling: kit.worn?.sling ? { gunId: kit.worn.sling, posture: hg && hg !== kit.worn.sling ? 'hanging' : kit.carry?.posture ?? 'slungFront' } : null,
  };
}

// ---- the magazine in against the spares (specials.js's reloads by purpose, bundle.js's Top up on the way; moved here in the rework's R4) ----

/**
 * Whether the magazine in the gun is believed at half or less of its own load (an unknown count is not): half the count it
 * went in with when that was short of its family's capacity (the gun's belief fullN, firearms.js's seat), else half the
 * capacity. gun: the gun's record (state.items[id]). v0.0.12 read half the capacity always, so a thirty loaded with ten read
 * "half or less" from its first round, and Top up held the panel's head for the whole lane (the panel audit of 2026-11-11;
 * COMBAT §25.19.4's no-dead-end rules; the shoot house's rework R1, 2026-11-12).
 */
export function halfOrLess(b, gun = null) {
  const full = gun?.belief?.fullN ?? famCap(b?.magFam);
  return !!b && b.mag === 'in' && typeof b.count === 'number' && full > 0 && b.count <= full / 2;
}

/** Whether a spare believed fuller than the magazine in is at hand (its count known and above the gun's believed count). */
export function fullerAtHand(state, pid, gunId, b = beliefOf(state, gunId)) {
  const fams = MODELS[state.items?.[gunId]?.model ?? 'r7']?.fams ?? null, n = typeof b?.count === 'number' ? b.count : Infinity;
  return sparesOf(state, pid, null).some(id => (!fams || fams.includes(state.items[id]?.fam)) && (believedN(state.items[id]) ?? -1) > n);
}
