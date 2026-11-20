// OLYMPUS art: from the gear record to the close figure's arguments, and the dressed dolls' cache (VIEWS §4.2, §4.3, §7.7; the build sheet 0.0.18 §2.2).
//
// dressOf(gear, { look, sex, body, wounds }) turns src/sim/arms/gear.js's record (what a person visibly wears and carries) into
// doll.js doll()'s arguments: the person's own look (skin, hair, rank) with the outfit the gear says, and a DollGear for the
// pieces worn.js draws ({ rifle, pistol, carrier, thigh, ears, held, devices, device }). When the gear adds nothing the doll does not already
// draw, the arguments are exactly v0.0.17's: a board's painted man holding a rifle is { look, sex, hand: 'rifle' } with no gear,
// so the hit card's four B goldens cannot move. With a suit the look's head: null is dropped, because lookFor's indoor rule
// (src/sim/people/figure.js) is a cover's and the suit's sealed helmet stays on under the Wheel's roof; the suit's helm
// (kit.js CONTAINERS 'ces-1' helm, once the user scores v0.0.17's helmet samples) goes on as look.helm.
// dressedDoll(gear, person, scale) paints the doll once for a key of everything it draws (dressOf's arguments: the look, the
// sex, the DollGear, the wounds; the scale; the body's cues rounded to 0.1 so sweat creeping up does not repaint it each frame;
// art reads no sim module, so the key is the arguments', which change exactly when the sim's gearKey does) and keeps the last
// DOLL_LRU of them, so the I and C cards and the target view share one painting. Pure but the cache.
// v0.0.23 (the build sheet v0.0.23 §3.3, items 1 to 5; the user's note of 2026-11-17: "the portraits need to be more dynamic and
// show us what we would be seeing, including what they are holding"): dressOf takes the Seen record (`rec`, src/sim/people/seen.js
// seenOf's, as plain data: art reads no sim) and passes its hold, pose and facing to the doll, so the dressed doll is the man as you
// see him (doll.js POSE_BENDS, worn.js holdGear); a record standing front on with no hold is the doll as before, to its key. A board's
// painted man holds his gun where the stage paints it (W1: gear.js standGear's 'ready'), the 'hand' place kept for "Bang"'s boards.
// The LRU holds 48 (P§4: the warm set's poses and the I and C cards; about 64 KB a doll at the near band, 3 MB at most); v0.0.26, 56:
// the live lane's warm set (46 dolls) and the daze's standing and kneeling holds, two a man at two bands ("Bang, then go"), 54.
// v0.0.27, 96: the house's warm set gains blind fire and the 0 G down (62 dolls), and "Away the boarding party" warms its men at the
// near band only, four armed men's twelve holds and two aimed away, two crewmen's five and your #2's six (72, the pirates' draw; the
// smugglers' 63), with room for the I and C cards; about 6 MB at the near band at most.
import { doll, DOLL_SCALE } from './doll.js';

/** The dressed dolls kept (my call: the house's faces, the #2, you and a few changes of gear; v0.0.23: 48, the poses' warm set). */
export const DOLL_LRU = 96;
/** The record's fields the doll draws (the rest of seenOf's record is the card's words or the band): a record with none of them set is the plain doll. */
const posed = (rec) => !!rec && ((rec.pose && rec.pose !== 'stand') || (rec.facing && rec.facing !== 'front') || !!rec.hold?.how);
const CUES = Object.freeze(['wetK', 'grimeK', 'sweatK', 'stubbleK', 'tiredK', 'bladderK', 'hungerK', 'handsK']);
const CACHE = new Map();
let PAINTS = 0;

/** The doll's arguments for a gear record and a person (see the header). */
export function dressOf(gear, { look = {}, sex = 'm', body = null, wounds = null } = {}, { rec = null } = {}) {
  const L = { ...(look ?? {}) }, args = { look: L, sex };
  if (body) args.body = body;
  if (wounds) args.wounds = wounds;
  // (the record's pose, facing and hold, only when it is not the plain standing front-on doll, so every key before is the same string)
  if (posed(rec)) {
    if (rec.pose && rec.pose !== 'stand') args.pose = rec.pose;
    if (rec.facing && rec.facing !== 'front') args.facing = rec.facing;
    if (rec.hold?.how) args.hold = { how: rec.hold.how, ...(rec.aimAt ? { aimAt: rec.aimAt } : {}), ...(rec.hold.place ? { place: rec.hold.place } : {}), ...(rec.hold.act ? { act: rec.hold.act } : {}) };
    if (rec.hang) args.hang = rec.hang;
  }
  if (!gear) return args;
  if (gear.painted) {
    // (the board's painted man: the look the board gives him, what his face holds; v0.0.23: a gun at the ready (W1) is drawn by the
    // gear's place, 'hand' as before)
    if (gear.rifle?.place === 'hand') args.hand = 'rifle';
    const extra = {};
    if (gear.rifle && gear.rifle.place !== 'hand') extra.rifle = { model: gear.rifle.model, finish: gear.rifle.finish ?? null, place: gear.rifle.place, mag: !!gear.rifle.mag };
    if (gear.pistol) extra.pistol = { model: gear.pistol.model, place: gear.pistol.place, mag: !!gear.pistol.mag };
    if (gear.held) extra.held = gear.held;
    // (painted: a pistol in a painted hand has no holster on the thigh)
    if (Object.keys(extra).length) args.gear = { ...extra, painted: true };
    return args;
  }
  // (nothing the doll does not already draw: v0.0.17's arguments, the outfit the gear's)
  const adds = gear.suit || gear.carrier || gear.rifle || gear.pistol || gear.thigh || gear.ears || gear.held || gear.devices?.length || gear.mask || gear.hands || gear.device || gear.boots || gear.anchor;
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
    // (the device in the hands, only when there is one, so every other doll's arguments are as before)
    ...(gear.device ? { device: { shape: gear.device.shape, colour: gear.device.colour } } : {}),
    // (v0.0.19: the force-on-force mask and the hands up, worn.js's, only when set: every other doll's arguments as before)
    ...(gear.mask ? { mask: gear.mask } : {}), ...(gear.hands ? { hands: gear.hands } : {}),
    // (the mag boots and the anchor (the gear record's, A's), only when set: every other doll's arguments as before)
    ...(gear.boots ? { boots: gear.boots } : {}), ...(gear.anchor ? { anchor: gear.anchor } : {}),
  };
  return args;
}

// (the cache's key: dressOf's arguments but the body, whose cues count to 0.1)
const cuesKey = (body) => (body ? CUES.map(k => Math.round((body[k] ?? 0) * 10)).join(',') + (body.handsWhy ?? '') : '');
const keyOf = (gear, person, scale, rec = null) => { const { body, ...rest } = dressOf(gear, { ...person, body: null }, { rec }); void body; return `${JSON.stringify(rest)}|${scale}|${cuesKey(person.body)}`; };
/** The dressed doll's cache key (portrait.js portraitKey's: the record's drawn fields, the person's look, the scale). */
export const dollKey = keyOf;

/** The dressed doll (doll.js's Pixmap) for a gear record, a person ({ look, sex, body, wounds }) and a scale, cached (see the header); rec: the Seen record. */
export function dressedDoll(gear, person = {}, scale = DOLL_SCALE, rec = null) {
  const key = keyOf(gear, person, scale, rec), hit = CACHE.get(key);
  if (hit) { CACHE.delete(key); CACHE.set(key, hit); return hit; }
  const pm = doll({ ...dressOf(gear, person, { rec }), scale });
  PAINTS++;
  CACHE.set(key, pm);
  while (CACHE.size > DOLL_LRU) CACHE.delete(CACHE.keys().next().value);
  return pm;
}
/** Whether a dressed doll is painted already (the target view paints at most one new doll a frame). */
export const dressedReady = (gear, person = {}, scale = DOLL_SCALE, rec = null) => CACHE.has(keyOf(gear, person, scale, rec));
/** The dressed dolls painted since the module loaded, an LRU's evictions never hiding one (the tests': F91, one new doll a frame). */
export const dollPaints = () => PAINTS;
/** The dressed dolls' keys kept, oldest first (the tests': F91, every doll painted after GO in the warm set or a variant of one). */
export const dollKeys = () => [...CACHE.keys()];
/** The dressed dolls painted and kept (the tests'). */
export const dollCount = () => CACHE.size;
/** The cache emptied (tests only). */
export function clearDolls() { CACHE.clear(); }
