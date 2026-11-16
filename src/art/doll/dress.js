// OLYMPUS art: from the gear record to the close figure's arguments, and the dressed dolls' cache (VIEWS §4.2, §4.3, §7.7; the build sheet 0.0.18 §2.2).
//
// dressOf(gear, { look, sex, body, wounds }) turns src/sim/arms/gear.js's record (what a person visibly wears and carries) into
// doll.js doll()'s arguments: the person's own look (skin, hair, rank) with the outfit the gear says, and a DollGear for the
// pieces worn.js draws ({ rifle, pistol, carrier, thigh, ears, held }). When the gear adds nothing the doll does not already
// draw, the arguments are exactly v0.0.17's: a board's painted man holding a rifle is { look, sex, hand: 'rifle' } with no gear,
// so the hit card's four B goldens cannot move. With a suit the look's head: null is dropped, because lookFor's indoor rule
// (src/sim/people/figure.js) is a cover's and the suit's sealed helmet stays on under the Wheel's roof; the suit's helm
// (kit.js CONTAINERS 'ces-1' helm, once the user scores v0.0.17's helmet samples) goes on as look.helm.
// dressedDoll(gear, person, scale) paints the doll once for a key of everything it draws (dressOf's arguments: the look, the
// sex, the DollGear, the wounds; the scale; the body's cues rounded to 0.1 so sweat creeping up does not repaint it each frame;
// art reads no sim module, so the key is the arguments', which change exactly when the sim's gearKey does) and keeps the last
// DOLL_LRU of them, so the I and C cards and the target view share one painting. Pure but the cache.
import { doll, DOLL_SCALE } from './doll.js';

/** The dressed dolls kept (my call: the house's faces, the #2, you and a few changes of gear). */
export const DOLL_LRU = 24;
const CUES = Object.freeze(['wetK', 'grimeK', 'sweatK', 'stubbleK', 'tiredK', 'bladderK', 'hungerK', 'handsK']);
const CACHE = new Map();

/** The doll's arguments for a gear record and a person (see the header). */
export function dressOf(gear, { look = {}, sex = 'm', body = null, wounds = null } = {}) {
  const L = { ...(look ?? {}) }, args = { look: L, sex };
  if (body) args.body = body;
  if (wounds) args.wounds = wounds;
  if (!gear) return args;
  if (gear.painted) {
    // (the board's painted man: the look the board gives him, what his face holds)
    if (gear.rifle?.place === 'hand') args.hand = 'rifle';
    const extra = {};
    if (gear.pistol) extra.pistol = { model: gear.pistol.model, place: gear.pistol.place, mag: !!gear.pistol.mag };
    if (gear.held) extra.held = gear.held;
    // (painted: a pistol in a painted hand has no holster on the thigh)
    if (Object.keys(extra).length) args.gear = { ...extra, painted: true };
    return args;
  }
  // (nothing the doll does not already draw: v0.0.17's arguments, the outfit the gear's)
  const adds = gear.suit || gear.carrier || gear.rifle || gear.pistol || gear.thigh || gear.ears || gear.held || gear.devices?.length;
  L.outfit = gear.suit ? 'combatSuit' : gear.outfit ?? L.outfit ?? 'utilities';
  if (!adds) return args;
  if (gear.suit) {
    if (L.head === null) delete L.head;
    if (gear.suit.helm) L.helm = gear.suit.helm;
  }
  args.gear = {
    rifle: gear.rifle ? { model: gear.rifle.model, finish: gear.rifle.finish ?? null, place: gear.rifle.place, mag: !!gear.rifle.mag } : null,
    pistol: gear.pistol ? { model: gear.pistol.model, place: gear.pistol.place, mag: !!gear.pistol.mag } : null,
    carrier: gear.carrier ? { pouches: gear.carrier.pouches.map(p => ({ key: p.key, holds: p.holds, mags: p.mags })) } : null,
    thigh: gear.thigh ? { holds: gear.thigh.holds, mags: gear.thigh.mags } : null,
    ears: gear.ears, held: gear.held,
    // (v0.0.18, the fixer's: the devices worn off the front, only where there are any, so every doll without them keeps its key)
    ...(gear.devices?.length ? { devices: gear.devices.map(d => ({ face: d.face, slot: d.slot, shape: d.shape, colour: d.colour })) } : {}),
  };
  return args;
}

// (the cache's key: dressOf's arguments but the body, whose cues count to 0.1)
const cuesKey = (body) => (body ? CUES.map(k => Math.round((body[k] ?? 0) * 10)).join(',') + (body.handsWhy ?? '') : '');
const keyOf = (gear, person, scale) => { const { body, ...rest } = dressOf(gear, { ...person, body: null }); void body; return `${JSON.stringify(rest)}|${scale}|${cuesKey(person.body)}`; };

/** The dressed doll (doll.js's Pixmap) for a gear record, a person ({ look, sex, body, wounds }) and a scale, cached (see the header). */
export function dressedDoll(gear, person = {}, scale = DOLL_SCALE) {
  const key = keyOf(gear, person, scale), hit = CACHE.get(key);
  if (hit) { CACHE.delete(key); CACHE.set(key, hit); return hit; }
  const pm = doll({ ...dressOf(gear, person), scale });
  CACHE.set(key, pm);
  while (CACHE.size > DOLL_LRU) CACHE.delete(CACHE.keys().next().value);
  return pm;
}
/** Whether a dressed doll is painted already (the target view paints at most one new doll a frame). */
export const dressedReady = (gear, person = {}, scale = DOLL_SCALE) => CACHE.has(keyOf(gear, person, scale));
/** The dressed dolls painted and kept (the tests'). */
export const dollCount = () => CACHE.size;
/** The cache emptied (tests only). */
export function clearDolls() { CACHE.clear(); }
