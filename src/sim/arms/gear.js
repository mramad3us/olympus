// OLYMPUS arms: the gear record, what a person visibly wears and carries, the one reader between the kit and every figure that draws it (VIEWS §4.2, §4.3, §7.7; CONTRACTS, "The gear record"; the build sheet 0.0.18 §2.2).
//
// The user's asks of 2026-11-15 (DESIGN.md's log): "the I and C menu preview of the character should show the currently worn
// gear", and "when we start fighting real NPCs, they will have to be rendered in the target preview as we see them, meaning
// with their gear". One record feeds both, so the inventory's doll, the sheet's and the target view cannot disagree.
//
// gearOf(state, pid, { by }) reads the kit through kit.js's exported readers only (pouchesOf, handGunOf, pistolOf, handMagOf,
// CONTAINERS), never state.items' holders by hand, and returns what can be seen of the person from the front at close range:
//   { outfit,                                    the actor's outfit (actors.list[].outfit)
//     suit:    null | { model, colour, helm },   the worn suit (kit.worn.suit), its helm CONTAINERS[model].helm or null
//     carrier: null | { model, pouches: [{ key, holds, mags }] },   the carrier's magazine pouches in reach order (p1, p2, dump),
//                                                the pistol pouch not among them; mags the number of magazines in it
//     ears:    null | 'cups',                    ear defenders, in the head slot (ears-m1) or their own (ed1)
//     rifle:   null | { model, finish, place, mag },   the slung gun; place RIFLE_PLACES[kit.carry.posture], 'front' while a
//                                                pistol is in the hand (look.js gunLook draws it hanging there with the P-12 out)
//     pistol:  null | { model, place, mag },     'holster' while in kit.worn.holster, 'ready' in the hand
//     thigh:   null | { holds, mags },           the pistol pouch below the holster
//     held:    null | 'mag' | 'phone',           the free hand: a magazine (handMagOf)
//     devices: [{ face, slot, model, shape, colour }],   the kit's devices worn off the front (v0.0.18, the fixer's: the play
//                                                review found the I card's doll with two G-11s the standard kit's to the pixel):
//                                                each in its pouch on the carrier's left, right or back face (the loadout's
//                                                `at`), slot its pouch's order on that face, its look devices.js DEVICES[model].look
//     painted: false }                           true only on standGear's painted men
// It holds no count, load, chamber, selector or stoppage ("we only know what we know": a magazine in the well can be seen, the
// rounds in it cannot), and gear.test holds the whitelist. `by` is the viewer: everything in the record is seen from the front
// this round, so it is the same for every viewer; the parameter is there so the target view's call is already right when
// perception filters gear (distance, darkness, cover).
// The places are coarse on purpose (front, back, ready; holster, ready), so a live man's doll repaints only when his gear
// changes as drawn: gearKey is the caches' key and changes with nothing else. They map from arms' guns.js vocabulary by the
// lead's agreement test, never by import: hands → ready, hanging and slungFront → front, slungBack → back, holster → holster.
// 'hand' is standGear's alone, the painted man on a board holding what the stand's face holds.
// standGear(face, holds) is the board's painted man (bay and house): a threat in utilities bare-headed with tan skin, a
// no-shoot the same with light skin, the armoured face in the carrier and helmet with the rifle, holds 'unseen' (the
// armoured face's too) or the 'unknown' face empty-handed. gearToFigure(gear) maps a record to the world figure's fields (view.js armsOf's: carry, mag,
// ears, carrier, pistol), held equal to look.js's gunLook and kitLook by test; the world figure is not switched to it yet.
// Pure.
import { CONTAINERS, pouchesOf, handGunOf, pistolOf, handMagOf } from './kit.js';
import { DEVICES, devicesOf } from './devices.js';
import { MODELS, isLong } from './models.js';

/** The gear record's keys, the only ones it has (see the header). */
export const GEAR_KEYS = Object.freeze(['outfit', 'suit', 'carrier', 'ears', 'rifle', 'pistol', 'thigh', 'held', 'devices', 'painted']);
/** The faces off the front a worn device is drawn on (the front's pouches are the magazines'). */
const DEVICE_FACES = Object.freeze(['left', 'right', 'back']);
/** The rifle's place on the figure by the carry's posture (kit.carry.posture). */
export const RIFLE_PLACES = Object.freeze({ slungFront: 'front', slungBack: 'back', lowReady: 'ready', highReady: 'ready', aimed: 'ready' });
/** The world figure's rig by the gear's rifle place (look.js CARRY_RIGS' coarse reading: low, high and aim are all 'ready'). */
const FIGURE_CARRY = Object.freeze({ front: 'front', back: 'slung', ready: 'ready', hand: 'ready' });

const actorFor = (state, pid) => state.actors?.list?.find?.(a => a.who === pid) ?? null;

/** What a person visibly wears and carries (see the header), or null with neither a kit nor an actor. */
export function gearOf(state, pid, { by = pid } = {}) {
  void by;
  const p = state.people?.[pid], kit = p?.kit, actor = actorFor(state, pid);
  if (!kit && !actor) return null;
  const items = state.items ?? {}, worn = kit?.worn ?? {};
  const suitRec = worn.suit ? items[worn.suit] : null, S = suitRec ? CONTAINERS[suitRec.model] : null;
  const suit = suitRec ? { model: suitRec.model, colour: S?.colour ?? null, helm: S?.helm ?? null } : null;
  const pouches = kit ? pouchesOf(state, pid) : [];
  const carrierRec = worn.carrier ? items[worn.carrier] : null;
  const carrier = carrierRec ? { model: carrierRec.model, pouches: pouches.filter(q => q.key !== 'pp' && (carrierRec.holds ?? []).includes(q.id)).map(q => ({ key: q.key, holds: q.holds, mags: q.mags.length })) } : null;
  const headRec = worn.head ? items[worn.head] : null, earsRec = worn.ears ? items[worn.ears] : null;
  const ears = CONTAINERS[headRec?.model]?.type === 'ears' || CONTAINERS[earsRec?.model]?.type === 'ears' ? 'cups' : null;
  const inHand = kit ? handGunOf(state, pid) : null, pistolId = kit ? pistolOf(state, pid) : null;
  const rifleRec = worn.sling ? items[worn.sling] : null;
  const handPistol = inHand && !isLong(MODELS[items[inHand]?.model]);
  const rifle = rifleRec ? { model: rifleRec.model, finish: rifleRec.finish ?? null, place: handPistol ? 'front' : RIFLE_PLACES[kit.carry?.posture ?? 'slungFront'] ?? 'front', mag: !!rifleRec.mag } : null;
  const pistolRec = pistolId ? items[pistolId] : null;
  const pistol = pistolRec ? { model: pistolRec.model, place: worn.holster === pistolId ? 'holster' : 'ready', mag: !!pistolRec.mag } : null;
  const pp = pouches.find(q => q.key === 'pp') ?? null;
  const thigh = pp ? { holds: pp.holds, mags: pp.mags.length } : null;
  const held = kit && handMagOf(state, pid) ? 'mag' : null;
  // (the devices in pouches off the front, each pouch's slot its order on its face as the kit lists them)
  const slots = {}, devices = [];
  for (const d of kit ? devicesOf(state, pid) : []) {
    if (d.where === 'hand' || !DEVICE_FACES.includes(d.where.face)) continue;
    const S = (slots[d.where.face] ??= []);
    if (!S.includes(d.where.pouchId)) S.push(d.where.pouchId);
    const L = DEVICES[d.model]?.look ?? {};
    devices.push({ face: d.where.face, slot: S.indexOf(d.where.pouchId), model: d.model, shape: L.shape ?? 'can', colour: L.colour ?? 'olive' });
  }
  return { outfit: actor?.outfit ?? 'utilities', suit, carrier, ears, rifle, pistol, thigh, held, devices, painted: false };
}

/** A short stable string of everything the doll draws of a gear record, and nothing else: the caches' key. */
export function gearKey(g) {
  if (!g) return '-';
  const c = g.carrier ? `${g.carrier.model}:${g.carrier.pouches.map(q => `${q.key}${q.mags}/${q.holds}`).join(',')}` : '';
  const s = g.suit ? `${g.suit.model}:${g.suit.colour ?? ''}:${g.suit.helm ? `${g.suit.helm.id ?? g.suit.helm}/${g.suit.helm.faction ?? ''}` : ''}` : '';
  const r = g.rifle ? `${g.rifle.model}:${g.rifle.finish ?? ''}:${g.rifle.place}:${g.rifle.mag ? 1 : 0}` : '';
  const p = g.pistol ? `${g.pistol.model}:${g.pistol.place}:${g.pistol.mag ? 1 : 0}` : '';
  const t = g.thigh ? `${g.thigh.mags}/${g.thigh.holds}` : '';
  const d = (g.devices ?? []).map(x => `${x.face}${x.slot}:${x.model}`).join(',');
  return [g.outfit, s, c, g.ears ?? '', r, p, t, g.held ?? '', g.painted ? 'P' : '', ...(d ? [d] : [])].join('|');
}

/** The board's painted man for a stand's face and what it holds (see the header). */
export function standGear(face = 'threat', holds = 'rifle') {
  const base = { outfit: 'utilities', suit: null, carrier: null, ears: null, rifle: null, pistol: null, thigh: null, held: null, devices: [], painted: true };
  if (face === 'armoured') return { ...base, outfit: 'carrier', carrier: { model: 'pc-m3', pouches: [] }, rifle: holds === 'unseen' ? null : { model: 'r7', finish: null, place: 'hand', mag: true } };
  if (face === 'unknown' || holds === 'unseen' || holds === null || holds === undefined) return base;
  if (holds === 'rifle') return { ...base, rifle: { model: 'r7', finish: null, place: 'hand', mag: true } };
  if (holds === 'pistol') return { ...base, pistol: { model: 'p12', place: 'hand', mag: true } };
  if (holds === 'phone') return { ...base, held: 'phone' };
  return base;
}

/** A gear record as the world figure's fields (view.js armsOf's): { weapon, carry, magOut, ears, carrier, pistol }. */
export function gearToFigure(g) {
  if (!g) return null;
  return {
    weapon: g.rifle?.model ?? null, carry: g.rifle ? FIGURE_CARRY[g.rifle.place] ?? 'front' : null, magOut: g.rifle ? !g.rifle.mag : false,
    ears: g.ears === 'cups', carrier: !!g.carrier, pistol: g.pistol && g.pistol.place !== 'holster' ? g.pistol.model : null,
  };
}
