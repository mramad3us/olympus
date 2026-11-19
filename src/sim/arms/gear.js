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
//                                                each device pouch on the carrier's left, right or back face (the loadout's
//                                                `at`), slot the pouch's own order among that face's device pouches as the kit
//                                                lists them, its device's look devices.js DEVICES[model].look; an emptied pouch
//                                                stays at its slot with model, shape and colour null (the hunt of v0.0.18: an
//                                                emptied pouch vanished and the full one below it was drawn in its place)
//     painted: false,                            true only on standGear's painted men
//     mask:    null | 'fof',                     v0.0.19: the force-on-force mask (kit.worn.mask: the role-players' issue 'opfor-fof')
//     hands:   null | 'up',                      v0.0.19: the hands up and empty (actor.hands: a role-player who gave up)
//     device:  null | { model, shape, colour } } the device in the hands (devices.js handDeviceOf: a G-11 drawn from its pouch,
//                                                the halligan or the ram held, a charge on its way to the door), its look
//                                                DEVICES[model].look; its state (a pin pulled, a fuse burning) is not in it
//                                                (the hunt of v0.0.18: the record had no place for it, so every doll drew the
//                                                hands empty while the pouch it came from was drawn emptied)
// It holds no count, load, chamber, selector or stoppage ("we only know what we know": a magazine in the well can be seen, the
// rounds in it cannot), and gear.test holds the whitelist. `by` is the viewer: everything in the record is seen from the front
// this round, so it is the same for every viewer; the parameter is there so the target view's call is already right when
// perception filters gear (distance, darkness, cover).
// v0.0.19 (the build sheet 0.0.19 §1 L-look; COMBAT §7.11): the first live men wear a force-on-force mask over the face and,
// when one gives up, show their hands. Both are seen from the front as plainly as the carrier is, so they are in the record;
// both are null for everyone else, and gearKey adds them only when set, so every v0.0.18 key is the same string; the device
// in the hands the same way.
// The places are coarse on purpose (front, back, ready; holster, ready), so a live man's doll repaints only when his gear
// changes as drawn: gearKey is the caches' key and changes with nothing else. They map from arms' guns.js vocabulary by the
// lead's agreement test, never by import: hands → ready, hanging and slungFront → front, slungBack → back, holster → holster.
// v0.0.23 (the build sheet v0.0.23 item 1; the user's note of 2026-11-17: "the portrait of the NPC holding a gun does not display
// the gun they are holding"): the board's painted man holds his gun where the stage paints it, at the ready (W1: the rifle across
// the body, the pistol between the fists), never hanging from the hand at the crop's foot; 'hand' is gone from standGear (the art's
// boardGear keeps it for "Bang"'s boards as the user starred them, src/art/doll/portrait.js BANG_BOARD_HOLD).
// standGear(face, holds) is the board's painted man (bay and house): a threat in utilities bare-headed with tan skin, a
// no-shoot the same with light skin, the armoured face in the carrier and helmet with the rifle (or the P-12 when the stand
// holds a pistol: the house draws the armoured stand's hand as any threat's), holds 'unseen' (the
// armoured face's too) or the 'unknown' face empty-handed. gearToFigure(gear) maps a record to the world figure's fields (view.js armsOf's: carry, mag,
// ears, carrier, pistol), held equal to look.js's gunLook and kitLook by test; the world figure is not switched to it yet.
// Pure.
import { CONTAINERS, pouchesOf, handGunOf, pistolOf, handMagOf, containersOf } from './kit.js';
import { DEVICES, DEVICE_STATES, devicesOf, handDeviceOf } from './devices.js';
import { MODELS, isLong } from './models.js';
import { loadoutOf, ISSUE } from './loadout.js';

/** The gear record's keys, the only ones it has (see the header). */
export const GEAR_KEYS = Object.freeze(['outfit', 'suit', 'carrier', 'ears', 'rifle', 'pistol', 'thigh', 'held', 'devices', 'painted', 'mask', 'hands', 'device']);
/** The faces off the front a worn device is drawn on (the front's pouches are the magazines'). */
const DEVICE_FACES = Object.freeze(['left', 'right', 'back']);
/** The mask's word in the record (any item in the worn 'mask' slot is the force-on-force mask this round). */
export const MASK_FOF = 'fof';
/** The rifle's place on the figure by the carry's posture (kit.carry.posture). */
export const RIFLE_PLACES = Object.freeze({ slungFront: 'front', slungBack: 'back', lowReady: 'ready', highReady: 'ready', aimed: 'ready' });
/** The world figure's rig by the gear's rifle place (look.js CARRY_RIGS' coarse reading: low, high and aim are all 'ready'). */
const FIGURE_CARRY = Object.freeze({ front: 'front', back: 'slung', ready: 'ready', hand: 'ready' });   // ('hand': a v0.0.22 record's, read the same)

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
  // (the device pouches off the front, each at its own slot on its face as the kit lists them, full or emptied: a slot is the
  // pouch's, never the order of the pouches that still hold something, so an emptied pouch keeps its place on the doll)
  const slots = {}, devices = [];
  for (const c of kit ? containersOf(state, pid) : []) {
    const rec = items[c], face = rec?.at;
    if (!DEVICE_FACES.includes(face) || !(CONTAINERS[rec.model]?.fits ?? []).some(k => DEVICE_STATES[k])) continue;
    (slots[face] ??= []).push(c);
  }
  const filled = new Set();
  for (const d of kit ? devicesOf(state, pid) : []) {
    if (d.where === 'hand' || !DEVICE_FACES.includes(d.where.face)) continue;
    const slot = (slots[d.where.face] ?? []).indexOf(d.where.pouchId);
    if (slot < 0) continue;
    const L = DEVICES[d.model]?.look ?? {};
    filled.add(d.where.pouchId);
    devices.push({ face: d.where.face, slot, model: d.model, shape: L.shape ?? 'can', colour: L.colour ?? 'olive' });
  }
  for (const [face, S] of Object.entries(slots)) S.forEach((c, slot) => { if (!filled.has(c)) devices.push({ face, slot, model: null, shape: null, colour: null }); });
  devices.sort((a, b) => DEVICE_FACES.indexOf(a.face) - DEVICE_FACES.indexOf(b.face) || a.slot - b.slot);
  // (the device in the hands, its look; v0.0.19: the mask in its worn slot; the hands up, the actor's own flag, only with nothing in them)
  const hd = kit ? handDeviceOf(state, pid) : null, HL = hd ? DEVICES[hd.model]?.look ?? {} : null;
  const device = hd ? { model: hd.model, shape: HL.shape ?? 'can', colour: HL.colour ?? 'olive' } : null;
  const mask = worn.mask && items[worn.mask] ? MASK_FOF : null;
  const hands = actor?.hands === true && !inHand && !held && !device ? 'up' : null;
  return { outfit: actor?.outfit ?? 'utilities', suit, carrier, ears, rifle, pistol, thigh, held, devices, painted: false, mask, hands, device };
}

/**
 * The gear a loadout puts on a marine (the build sheet v0.0.20 item 23; user.md U-7, "a loadout screen where the marine draws and
 * carries them", the user, 2026-11-15): base, the gear record of the same marine on the standard loadout (gearOf on the lane's
 * fill), with the devices the code's faces carry, each pouch on its face in the code's order, its look devices.js DEVICES[model].look,
 * as gearOf reads them off a kit that applyLoadout filled. Pure: the screen's scratch copy, never the state; null for a code refused.
 */
export function gearOfLoadout(code, base = null) {
  const spec = loadoutOf(code);
  if (spec.error || !base) return null;
  const devices = [];
  for (const face of DEVICE_FACES) (spec[face] ?? []).forEach((place, slot) => {
    for (const model of ISSUE[place]?.items ?? []) {
      if (!DEVICES[model]) continue;
      const L = DEVICES[model].look ?? {};
      devices.push({ face, slot, model, shape: L.shape ?? 'can', colour: L.colour ?? 'olive' });
    }
  });
  return { ...base, devices };
}

/** A short stable string of everything the doll draws of a gear record, and nothing else: the caches' key. */
export function gearKey(g) {
  if (!g) return '-';
  const c = g.carrier ? `${g.carrier.model}:${g.carrier.pouches.map(q => `${q.key}${q.mags}/${q.holds}`).join(',')}` : '';
  const s = g.suit ? `${g.suit.model}:${g.suit.colour ?? ''}:${g.suit.helm ? `${g.suit.helm.id ?? g.suit.helm}/${g.suit.helm.faction ?? ''}` : ''}` : '';
  const r = g.rifle ? `${g.rifle.model}:${g.rifle.finish ?? ''}:${g.rifle.place}:${g.rifle.mag ? 1 : 0}` : '';
  const p = g.pistol ? `${g.pistol.model}:${g.pistol.place}:${g.pistol.mag ? 1 : 0}` : '';
  const t = g.thigh ? `${g.thigh.mags}/${g.thigh.holds}` : '';
  const d = (g.devices ?? []).map(x => `${x.face}${x.slot}:${x.model ?? ''}`).join(',');
  // (v0.0.19: the mask and the hands only when set, so every key without them is v0.0.18's string; the device in the hands the same)
  return [g.outfit, s, c, g.ears ?? '', r, p, t, g.held ?? '', g.painted ? 'P' : '', ...(d ? [d] : [])].join('|') + (g.mask ? `|m:${g.mask}` : '') + (g.hands ? `|h:${g.hands}` : '') + (g.device ? `|d:${g.device.model}` : '');
}

/** The board's painted man for a stand's face and what it holds (see the header). */
export function standGear(face = 'threat', holds = 'rifle') {
  const base = { outfit: 'utilities', suit: null, carrier: null, ears: null, rifle: null, pistol: null, thigh: null, held: null, devices: [], painted: true, mask: null, hands: null, device: null };
  // (the armoured face changes the body; its hand holds what the stand's draw gives, a pistol too: the hunt of v0.0.18)
  if (face === 'armoured') return { ...base, outfit: 'carrier', carrier: { model: 'pc-m3', pouches: [] }, rifle: holds === 'unseen' || holds === 'pistol' ? null : { model: 'r7', finish: null, place: 'ready', mag: true }, pistol: holds === 'pistol' ? { model: 'p12', place: 'ready', mag: true } : null };
  if (face === 'unknown' || holds === 'unseen' || holds === null || holds === undefined) return base;
  if (holds === 'rifle') return { ...base, rifle: { model: 'r7', finish: null, place: 'ready', mag: true } };
  if (holds === 'pistol') return { ...base, pistol: { model: 'p12', place: 'ready', mag: true } };
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
