// OLYMPUS data: the Patient Mule, a Belt ice hauler's crew deck 2, the place of "Away the boarding party" (ROADMAP §4.2's 0.0.7g; PLACES §5.1, §8; the build sheet v0.0.27 §0 items 2, 7, 31, 32, §3.0, item 3; SH§2, SH§3).
//
// The Patient Mule is a Belt ice hauler (LONGHAUL's `ice-hauler`, PLACES §8's setting 5: four crew decks of 12 × 10 m at the bow, a
// 1.2 km spine of ice blocks behind them), coasting at 0 G with its crew struck to the corvette's hail and mustered on deck 1 under
// the master; deck 2, the berths, did not answer. One deck is built this round (the sheet's §0 item 2: the narrowest fight that
// plays), in the Wreck's model and form (src/data/places/wreck.js's header is the contract): frozen literals, no seed, every room on
// the 0.1 m grid, the deck in its own deck frame (x starboard, z ventral, from its dorsal-port inner corner; y off the deck) at the
// origin of the area's plan, 2.4 m clear (PLACES §5.1's rule for every hull but the corvette's 2.2 m), every face steel a mag boot holds
// on (PLACES §2.7's `plateGrid`). Deck 2 holds:
//   the lock     the port M crew collar's lock, the four's start and the fall back's end, its inner hatch in its starboard bulkhead (an x
//                line: ship-parts.js's builder with axis 'z'), dogged: the override's (the scene's beat undogs it; never offered to the
//                lane's planner); its outer hatch is the collar's side and not modelled (my call);
//   the passage  1.5 m wide athwart the deck from the lock to the damage-control locker at its starboard end, the trunk's scuttle
//                to deck 3 in its deck at its middle, dogged and never offered (no transit this round; its twin to deck 1 is the
//                deckhead's paint);
//   cabin 1      the mates' cabin, dorsal of the passage at its port end: a boxed berth pair along the dorsal hull, a locker;
//   cabin 2      the master's cabin, dorsal at its starboard end: a boxed berth pair, the locker column, the desk's place;
//   the bunks    the hands' bunk room, ventral of the passage its whole length: three boxed berth pairs on the ventral hull, the head's
//                stalls at its port end;
//   the voids    the water tank and the air plant either side of the lock, solid machinery behind the hull's bulkheads: no room, no door.
// Every opening is a hatch (a door with a hatch's leaf, ship-parts.js hatch): 0.8 m, four dogs, its middle on the hold rule's lattice
// (0.75 m + 1.5 m k) along its wall, hinged so the stack stands on its latch side, opening into the compartment; the lock's coaming
// 0.3 m and dogged, the cabins' and the bunk room's 0.15 m (a lower step, my call) and undogged (the crew struck: closed, not dogged).
// The walls' kinds (§0 item 7, HAULER_WALLS): the hull (the area's outer edge, the deck and deckhead plates) mild steel 6 mm, a row of
// src/sim/arms/penetrate.js WALLS by `pressureDoor`; the bulkheads (the lock's and the voids') aluminium 8 mm (`bulkhead`); the cabins'
// and the bunk room's walls honeycomb 25 mm (`cabin`); the head's stalls aluminium 2 mm (`partition`): each kind a built row, no new
// material (holes.js maps a kind to its row; nothing reads them before B's round).
// Every standing fixture stops a walker and hides every layer of PEOPLE's sight grid (sightH 1.6 m and over: src/sim/places/sight.js),
// so one nav grid and one sight grid serve a body on the deck and one inverted on the deckhead (the Wreck's rule); the berth boxes stand
// deck to deckhead in the picture too (berthBox, 2.4 m). The scene's posts are stands in the house's form, the leg's number then a
// letter, the leg the stand's first digit (shoothouse.js standsOf, two.js legOf, opfor.js legIndex: §0 item 31), each with a role in
// src/data/courses.js HAULER_ROLES: HAULER_POSTS the armed men's (1a the barricade in the passage; 2a cabin 1's, the smugglers' only; 3a
// and 3b the bunk room's; 4a cabin 2's; 4b on cabin 2's deckhead by its hatch), HAULER_CREW the hauler's unarmed crew's (2c, 2d the
// pirates' two shut in cabin 1; 3c, 3d, 4c the smugglers' hiding places); who stands at one is drawn (A's drawBoarding) and generated
// (src/data/people/posts.js 'belt-mule:holdout-n' and 'belt-mule:crew-n' in the draw's order: §0 item 32). HAULER_HOLDERS are the
// boarding team's #1 and #2 in the passage (C's holders.js), HAULER_START the four in the lock on locked boots. Nothing reaches any of
// it until D's scene: v0.0.27's stage 0 wrote it unreachable (no scene entry), and D owns this file after.

import { hatch } from './ship-parts.js';

const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };
const r2 = (v) => Math.round(v * 100) / 100;

/** The area's id, its code (the ids' prefix) and its site. */
export const HAULER_ID = 'mule.crew', HAULER_CODE = 'mu', HAULER_SITE = 'belt-mule';
/** The ship's name on the card and in the brief. */
export const HAULER_NAME = 'the Patient Mule';
/** A crew deck's inside, metres, its deckhead (clear height) and the deck pitch, deck to deck (PLACES §5.1, §8). */
export const HAULER_DECK_M = Object.freeze([12, 10]), HAULER_CEILING_M = 2.4, HAULER_PITCH_M = 3.0;
/** A compartment's hatch coaming (m): the lock's (the Wreck's 0.3) and a cabin's (my call). */
export const LOCK_COAMING_M = 0.3, CABIN_COAMING_M = 0.15;

/** The decks built (§0 item 2: deck 2 alone), its origin in the area's plan and its rect there. */
export const HAULER_DECKS = deepFreeze({
  2: { n: 2, name: 'the berths', origin: [0, 0], rect: [0, 0, HAULER_DECK_M[0], HAULER_DECK_M[1]] },
});
const at = (n, x, z) => [r2(x + HAULER_DECKS[n].origin[0]), r2(z + HAULER_DECKS[n].origin[1])];
const rectAt = (n, [x0, z0, x1, z1]) => [...at(n, x0, z0), ...at(n, x1, z1)];

// (the floor: the hull's steel deck plate in 1.5 m panels with the hold rule's pad-eyes, as the Wreck's)
const FLOOR_2 = Object.freeze({ kind: 'deckPlate', color: 0x5a5f63, seed: 51, plateM: 1.5, rings: false, metres: 3, padEyeM: 3, padEyeAtM: 0.75 });

// The rooms, in the deck's frame: [key, kind, name, rect]
const D2 = [
  ['lock', 'lock', 'Deck 2, the lock', [0, 3.5, 2.5, 6.0]],
  ['passage', 'passage', 'Deck 2, the passage', [2.5, 4.0, 12, 5.5]],
  ['cabin-1', 'cabin', 'Deck 2, cabin 1', [2.5, 0, 7.0, 4.0]],
  ['cabin-2', 'cabin', 'Deck 2, cabin 2', [7.0, 0, 12, 4.0]],
  ['bunks', 'bunkroom', 'Deck 2, the bunk room', [2.5, 5.5, 12, 10]],
];
const roomId = (n, key) => `${HAULER_CODE}.d${n}.${key}`;
const zoneId = (n) => `${HAULER_CODE}.z.d${n}`;
const ROOMS = D2.map(([key, kind, name, rect]) => ({ id: roomId(2, key), kind, name, deck: 2, rect: rectAt(2, rect), ceilingM: HAULER_CEILING_M, zone: zoneId(2), surface: 'plateGrid', floor: { ...FLOOR_2 } }));

// (a bulkhead hatch of deck n (see the header): on a z line (axis 'x', the line's z) or an x line (axis 'z', the line's x), its middle
// along the line, its rooms [worked from, into] by key; ship-parts.js's builder)
function bulkheadHatch(n, key, axis, line, mid, rooms, hinge, { coamingM = CABIN_COAMING_M, dogged = false, offered = true } = {}) {
  const half = 0.4, wall = axis === 'x' ? at(n, 0, line)[1] : at(n, line, 0)[0];
  const ends = axis === 'x' ? [at(n, mid - half, 0)[0], at(n, mid + half, 0)[0]] : [at(n, 0, mid - half)[1], at(n, 0, mid + half)[1]];
  return hatch(`o:${HAULER_CODE}:d${n}:${key}`, wall, ends, rooms.map(k => roomId(n, k)), { axis, hinge, coamingM, dogged, offered });
}

/** The bulkhead hatches (see the header): the lock's inner hatch (dogged, the override's, never offered), the cabins' and the bunk room's. */
export const HAULER_HATCHES = deepFreeze([
  // (the lock's inner hatch, in its starboard bulkhead (x 2.5), worked from the lock, opening into the passage; hinged at its dorsal end,
  // so its leaf sweeps the passage's dorsal half and the four stack on its ventral side in the lock)
  bulkheadHatch(2, 'lock', 'z', 2.5, 4.75, ['lock', 'passage'], 'a', { coamingM: LOCK_COAMING_M, dogged: true, offered: false }),
  // (cabin 1's, in the passage's dorsal bulkhead amidships of its port half; hinged at its starboard end, the stack to port of it, the
  // way from the lock: v0.0.27 D's, so the pair out of the lock stacks you first and Four short of you, never passing you in the 1.5 m
  // passage (at x 3.75 hinged to port, the stack stood to starboard, past your way in, and the two of you held each other there: the
  // private by the keys on 48213, cabin 1 passed by its due); the holders stand starboard of the stack, 0.9 m and more off it)
  bulkheadHatch(2, 'cabin-1', 'x', 4.0, 5.25, ['passage', 'cabin-1'], 'b'),
  // (the bunk room's, in the passage's ventral bulkhead; hinged at its starboard end, the stack to port of it, the way from cabin 1)
  bulkheadHatch(2, 'bunks', 'x', 5.5, 8.25, ['passage', 'bunks'], 'b'),
  // (cabin 2's, in the passage's dorsal bulkhead toward its starboard end; hinged at its starboard end, the stack to port of it, the way
  // from the bunk room's hatch: v0.0.27 D's, so your number two, behind you out of the bunk room, stacks short of you and never has to
  // pass you in the 1.5 m passage (hinged to port, his stack point lay 0.65 m past yours, and the two of you held each other there
  // for good: the honest sergeant on 48213, cabin 2 passed by its due))
  bulkheadHatch(2, 'cabin-2', 'x', 4.0, 9.75, ['passage', 'cabin-2'], 'b'),
]);

/** The walls' kinds by run (§0 item 7; see the header): { kind, run } where run names the edge (rooms either side, 'hull' its outer edge). */
export const HAULER_WALLS = deepFreeze([
  { kind: 'hull', run: 'the area\'s outer edge, the deck and the deckhead plates' },
  { kind: 'bulkhead', run: 'the lock\'s walls and the voids\' (the water tank\'s and the air plant\'s)' },
  { kind: 'cabin', run: 'cabin 1\'s, cabin 2\'s and the bunk room\'s walls to the passage and each other' },
  { kind: 'partition', run: 'the head\'s stalls' },
]);
/** Each wall kind's row of src/sim/arms/penetrate.js WALLS (built rows: the hull as pressureDoor, mild steel 6 mm). */
export const HAULER_WALL_ROWS = deepFreeze({ hull: 'pressureDoor', bulkhead: 'bulkhead', cabin: 'cabin', partition: 'partition' });

// (a fixture spec in a deck's frame: id, kind, make, x, z, face, room, seed, and what else the kit reads)
const fx = (n, key, kind, make, x, z, face, room, seed, more = {}) => { const [ax, az] = at(n, x, z); return { id: `f:${HAULER_CODE}:d${n}:${key}`, kind, make, x: ax, z: az, face, room: roomId(n, room), seed, ...more }; };
/** The lamps' height under the deckhead, metres. */
const LAMP_Y_M = r2(HAULER_CEILING_M - 0.1);
// (a speaker of the hauler's 1MC under a compartment's deckhead: where the intercom's bubbles are drawn)
const speaker = (n, room, x, z) => fx(n, `speaker-${room}`, 'speaker', 'onemc', x, z, 'down', room, 61, { y: LAMP_Y_M });
/** The trunk's point on every crew deck (deck frame): its scuttles, dogged this round. */
export const TRUNK_AT = Object.freeze([6.75, 4.75]);

/** The fixtures (see the header): the lock's panel, the trunk's dogged scuttle, the berth boxes, the lockers, the head, the speakers. */
const FIXTURES = [
  // (the lock's override panel, on its dorsal bulkhead beside the inner hatch: amber while the lock cycles, green at its end (E's look))
  fx(2, 'lock-panel', 'lockPanel', 'amber', 2.0, 3.53, 'down', 'lock', 7, { y: 1.4 }),
  // (the trunk's scuttle in the passage's deck, to deck 3, dogged and never offered (no transit this round). Its twin in the deckhead, to
  // deck 1, stands at the same point, where the validator's overlap rule (one piece a footprint) refuses a second fixture: it is the
  // deckhead's paint, E's to draw, not a fixture (my call, v0.0.27's stage 0))
  fx(2, 'scuttle-deck', 'scuttle', 'deck', ...TRUNK_AT, 'down', 'passage', 3, { mount: 'deck', dogged: true, offered: false }),
  // (the damage-control locker at the passage's starboard end, against the starboard hull, facing the lock: the barricade's)
  fx(2, 'dc-locker', 'wallLocker', 'tier', 11.8, 4.75, 'left', 'passage', 11, { w: 1.0, d: 0.4 }),
  // (cabin 1: its berth pair along the dorsal hull at its port end, a locker by cabin 2's bulkhead)
  fx(2, 'berths-c1', 'berthBox', 'belt', 3.6, 0.45, 'down', 'cabin-1', 21),
  fx(2, 'locker-c1', 'wallLocker', 'single', 6.2, 0.275, 'down', 'cabin-1', 12),
  // (cabin 2: its berth pair along the dorsal hull at its starboard end, the locker column standing off the hull by the desk's place)
  fx(2, 'berths-c2', 'berthBox', 'belt', 11.0, 0.45, 'down', 'cabin-2', 22),
  // (its back to the dorsal hull (v0.0.27 D's: standing 0.45 m off it, it left a pocket behind it no point of the room sees, a hot spot
  // nobody could cover and no far walk reaches: "Corner! You never looked." on every honest lane of cabin 2))
  fx(2, 'column-c2', 'wallLocker', 'single', 8.75, 0.3, 'down', 'cabin-2', 13, { w: 0.8, d: 0.6 }),
  // (the bunk room: three berth pairs on the ventral hull, the head's toilet and shower stalls at its port end)
  fx(2, 'berths-b1', 'berthBox', 'belt', 4.0, 9.55, 'up', 'bunks', 23),
  fx(2, 'berths-b2', 'berthBox', 'belt', 7.0, 9.55, 'up', 'bunks', 24),
  fx(2, 'berths-b3', 'berthBox', 'belt', 10.0, 9.55, 'up', 'bunks', 25),
  fx(2, 'head-toilet', 'toiletStall', 'steel', 3.35, 6.08, 'right', 'bunks', 31),
  fx(2, 'head-shower', 'showerStall', 'steel', 3.1, 7.1, 'right', 'bunks', 32),
  // (the hauler's 1MC: one speaker on every compartment's deckhead)
  speaker(2, 'lock', 1.25, 4.75), speaker(2, 'passage', 5.25, 4.75), speaker(2, 'cabin-1', 4.75, 2.0), speaker(2, 'cabin-2', 9.5, 2.0), speaker(2, 'bunks', 7.25, 7.75),
];

/** The area `mule.crew` (see the header): deck 2 of the Patient Mule, its own site's air and gravity (coasting: 0 G), no sky. */
export const HAULER = deepFreeze({
  id: HAULER_ID, site: HAULER_SITE, kind: 'deck', code: HAULER_CODE, name: 'The Patient Mule', short: 'The Patient Mule', originM: [0, 0, 0],
  boundsM: { x0: 0, z0: 0, x1: HAULER_DECK_M[0], z1: HAULER_DECK_M[1] }, sky: 'none', surface: 'plateGrid',
  decks: [2].map(n => ({ n, rect: [...HAULER_DECKS[n].rect] })),
  spawn: { x: 1.4, z: 4.75, face: 'right' },
  rooms: ROOMS,
  openings: [...HAULER_HATCHES],
  fixtures: FIXTURES,
  zones: [{ id: zoneId(2), rooms: ROOMS.map(r => r.id) }],
  portals: [],
  // (the faces' holds as a rule (PLACES §2.7's plateGrid; the sim's holdNear): a rung every 1.5 m on every face, a pad-eye every 3 m in the deck)
  holds: { gridM: 1.5, padEyeM: 3, faces: true },
  speakers: FIXTURES.filter(f => f.kind === 'speaker').map(f => ({ room: f.room, x: f.x, y: f.y, z: f.z })),
  look: {
    // (the Belter palette: src/render/view.js applies a palette only once src/art/palette.js PALETTES has it, so this name waits for E's)
    palette: 'belt',
    finish: { kind: 'bulkhead', c1: 0x707578, c2: 0x4c5154, outside: 0x2a2c2e, floor: 'deck', floorColor: 0x5a5f63 },
    decor: [],
    // (the bulkheads stand to the deckhead, 2.4 m: src/sim/places/plan.js wallsOf)
    wallsToCeiling: true,
    // (nine working lamps on the ship's power, under the deckhead at LAMP_Y_M 2.3 m: the lock, two in the passage, one in each cabin,
    // three in the bunk room and one over the head)
    lamps: [
      [1.25, 4.75, 1.4], [5.0, 4.75, 1.8], [9.5, 4.75, 1.8], [4.75, 2.0, 2.0], [9.5, 2.0, 2.0],
      [5.0, 7.75, 2.2], [7.75, 7.75, 2.2], [10.5, 7.75, 2.2], [3.07, 8.8, 1.2],
    ].map(([x, z, r]) => ({ x: at(2, x, z)[0], z: at(2, x, z)[1], y: LAMP_Y_M, r })),
  },
});

// ---- the posts, the crew's spots, the holders and the start (see the header; §0 item 31's table) ----

// (a man's height on his face for a stand's y: a standing man's middle, 1.35 m as a board's, and the same from the deckhead)
const DECK_Y_M = 1.35, HEAD_Y_M = r2(HAULER_CEILING_M - DECK_Y_M);
const toward = (from, to) => Math.round(Math.atan2(to[1] - from[1], to[0] - from[0]) * 1e4) / 1e4;
const LOCK_HATCH = `o:${HAULER_CODE}:d2:lock`, HATCH = (key) => `o:${HAULER_CODE}:d2:${key}`;
// (each compartment's threshold, its hatch's middle on its line: where a man laid on it aims)
const THRESHOLD = Object.freeze({ lock: [2.5, 4.75], 'cabin-1': [5.25, 4.0], bunks: [8.25, 5.5], 'cabin-2': [9.75, 4.0] });

/**
 * The armed men's posts (§0 item 31; see the header): stand, room (its leg's compartment), at (deck frame), onFace, anchor (boots, as
 * every man aboard), door (the hatch of his leg: his cue when its leaf moves, opfor.js's), holds (what he covers), hide (his one dash's
 * end, cover by COMBAT §7.11), refuge (his flight's end inside his own compartment, at most FLEE_MAX_M 6 m), aimAt (where his weapon is
 * laid once turned: inside his threshold), eyes (where he looks waiting), tags. Each point passes tests/opfor-world.mjs spotCheck against
 * the plan its hatch derives (tests/hauler-place.test.mjs; the passage's, which no deriver makes, by the walls' and the swings' rules).
 */
export const HAULER_POSTS = deepFreeze([
  { stand: '1a', room: roomId(2, 'passage'), at: [11.0, 5.0], onFace: 'deck', anchor: 'boots', door: LOCK_HATCH, holds: LOCK_HATCH,
    hide: [11.2, 4.45], refuge: [11.2, 4.45], aimAt: [3.3, 4.75], eyes: [2.5, 4.75], tags: ['barricade'] },
  { stand: '2a', room: roomId(2, 'cabin-1'), at: [6.2, 1.5], onFace: 'deck', anchor: 'boots', door: HATCH('cabin-1'), holds: HATCH('cabin-1'),
    hide: [6.6, 1.0], refuge: [3.5, 2.0], aimAt: [5.25, 3.3], eyes: THRESHOLD['cabin-1'], tags: [] },
  { stand: '3a', room: roomId(2, 'bunks'), at: [8.9, 8.7], onFace: 'deck', anchor: 'boots', door: HATCH('bunks'), holds: HATCH('bunks'),
    hide: [8.5, 9.4], refuge: [11.4, 8.4], aimAt: [8.25, 6.2], eyes: THRESHOLD.bunks, tags: [] },
  { stand: '3b', room: roomId(2, 'bunks'), at: [4.9, 8.0], onFace: 'deck', anchor: 'boots', door: HATCH('bunks'), holds: HATCH('bunks'),
    hide: [3.9, 8.6], refuge: [5.5, 9.0], aimAt: [7.6, 6.2], eyes: THRESHOLD.bunks, tags: ['ambush'] },
  { stand: '4a', room: roomId(2, 'cabin-2'), at: [8.6, 1.7], onFace: 'deck', anchor: 'boots', door: HATCH('cabin-2'), holds: HATCH('cabin-2'),
    hide: [7.9, 0.8], refuge: [10.0, 1.4], aimAt: [9.75, 3.3], eyes: THRESHOLD['cabin-2'], tags: [] },
  { stand: '4b', room: roomId(2, 'cabin-2'), at: [10.9, 2.7], onFace: 'deckhead', anchor: 'boots', door: HATCH('cabin-2'), holds: HATCH('cabin-2'),
    hide: [11.3, 2.0], refuge: [11.3, 2.0], aimAt: [9.75, 3.3], eyes: THRESHOLD['cabin-2'], tags: ['ambush'] },
]);
/** The unarmed crew's spots (see the header): the pirates' two in cabin 1's far corner, the smugglers' hiding places. */
export const HAULER_CREW = deepFreeze([
  { stand: '2c', room: roomId(2, 'cabin-1'), at: [3.1, 1.5], onFace: 'deck', anchor: 'boots', door: HATCH('cabin-1'), eyes: THRESHOLD['cabin-1'] },
  { stand: '2d', room: roomId(2, 'cabin-1'), at: [3.3, 2.5], onFace: 'deck', anchor: 'boots', door: HATCH('cabin-1'), eyes: THRESHOLD['cabin-1'] },
  { stand: '3c', room: roomId(2, 'bunks'), at: [5.5, 9.2], onFace: 'deck', anchor: 'boots', door: HATCH('bunks'), eyes: THRESHOLD.bunks },
  { stand: '3d', room: roomId(2, 'bunks'), at: [10.8, 8.8], onFace: 'deck', anchor: 'boots', door: HATCH('bunks'), eyes: THRESHOLD.bunks },
  { stand: '4c', room: roomId(2, 'cabin-2'), at: [11.4, 1.5], onFace: 'deck', anchor: 'boots', door: HATCH('cabin-2'), eyes: THRESHOLD['cabin-2'] },
]);
/**
 * Every post and crew spot as a stand of the ship's set, in the house's form (src/sim/scenes/assemble.js shipSpec reads it as the Wreck's
 * set A): stand, room, at, y (his middle on his face), onFace, faceRad (toward where he looks).
 */
export const HAULER_SET = deepFreeze([...HAULER_POSTS, ...HAULER_CREW].map(p => ({
  stand: p.stand, room: p.room, at: [...p.at], y: p.onFace === 'deckhead' ? HEAD_Y_M : DECK_Y_M, ...(p.onFace !== 'deck' ? { onFace: p.onFace } : {}),
  faceRad: toward(p.at, p.aimAt ?? p.eyes),
})).sort((a, b) => (a.stand < b.stand ? -1 : 1)));
/**
 * The boarding team's holders (§3.0; FT§6, C's holders.js): #1 the team leader on the passage's deck, #2 the automatic rifleman on its
 * deckhead behind him, each 0.9 m and more from every stack point of cabin 1's hatch and out of the lock's inner hatch's swing
 * (tests/hauler-place.test.mjs), each
 * a 30° half sector down the passage (HOLD_SECTOR_DEG, C's), his post the person's (src/data/people/posts.js).
 */
export const HAULER_HOLDERS = deepFreeze([
  { n: 1, post: 'belt-mule:board-tl', at: [5.65, 5.15], onFace: 'deck', aimAt: [11.0, 4.9], sectorDeg: 30 },
  { n: 2, post: 'belt-mule:board-ar', at: [4.95, 5.15], onFace: 'deckhead', aimAt: [11.0, 4.6], sectorDeg: 30 },
]);
/** The four's start (§3.0; SH§3.6): in the lock on locked boots, stacked on the inner hatch's latch side; #3 you, #4 your buddy (Four). */
export const HAULER_START = deepFreeze([
  { n: 1, at: [2.05, 5.5], face: 'right' }, { n: 2, at: [1.4, 5.5], face: 'right' },
  { n: 3, at: [2.05, 4.1], face: 'right' }, { n: 4, at: [1.4, 4.1], face: 'right' },
]);
/** What the lane reads of the hauler (the Wreck's WRECK_SPOTS' shape): your start and your #2's (Four's), the speakers, the deck's plaque. */
export const HAULER_SPOTS = deepFreeze({
  area: HAULER_ID,
  start: { x: HAULER_START[2].at[0], z: HAULER_START[2].at[1], face: HAULER_START[2].face },
  two: { x: HAULER_START[3].at[0], z: HAULER_START[3].at[1], face: HAULER_START[3].face },
  speakers: HAULER.speakers,
  plaques: [{ deck: 2, x: at(2, 6.75, 4.1)[0], z: 4.1, text: 'DECK 2 · BERTHS' }],
});
