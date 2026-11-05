// OLYMPUS scenes sample: a deck of an MCRN frigate. The marine deck of a Hellas-class, under normal, battle and emergency light.
//
// PLACES §5.3 sets the Hellas-class frigate (LONGHAUL's mcrn-frigate: 120 × 19 × 17 m, decks 17.4 × 15.4 m
// inside) and its deck 5, the marine detachment's: berthing (six three-high columns, curtains and pan
// lockers), the gunnery sergeant's cabin, a ready room (16 seats; here crash couches, as COMBAT has the
// detachment strapped in at general quarters: my call), the passage with the main trunk's hatch and its
// ladder, the arms cage (16 rifles, 8 pistols, ready-use lockers, a Dutch door), the suit room (16 suit
// stands, the leak-check port), a head, and the keel railgun's armoured tube standing through the deck
// ("on every deck plan it is a great steel cylinder at the bottom of the screen"). PLACES §5.1: every deck
// carries handholds along every wall, a damage-control locker, a deck plaque, a UTC clock and emergency
// lamps every 4 m. Screen-up is the ship's dorsal side (VIEWS §2.9); the view looks down the thrust axis.
// My calls for the sample: a short corridor from the passage north to the hull with the trunk's ladder
// well in it and the deck's emergency airlock at its end, the escape trunk's dogged door in the berthing.
//
// The moods are the stage's ship states (src/render/moods.js, after LONGHAUL's room cameras): normal
// (cool-white panels), battle stations (panels at a third, red strips, red light), emergency (panels at a
// tenth, amber emergency lamps, floor strips), and ship's night.
import { buildCutaway } from '../../src/render/cutaway.js';
import { place } from '../../src/art/kit/index.js';
import { tex } from '../../src/art/kit/kit.js';
import { tile, paintedSteel } from '../../src/art/materials/index.js';
import { screenFace } from '../../src/art/kit/common.js';
import { fontFor } from '../../src/art/kit/type.js';
import { tone } from '../../src/art/tone.js';
import { ship, battle, emergency, shipNight } from './moods.js';

const BULKHEAD = { kind: 'bulkhead', c1: 0x88959a, c2: 0x4c5f5e, outside: 0x3e424d, floor: 'deck', floorColor: 0x657974 };
const KEEL = 0x565b67;

/** The keel railgun's tube standing through the deck: a cylinder's front, banded, stencilled. */
const keelFace = tex('keeltube', (px, w, h, ppm) => {
  for (let i = 0; i < w; i++) { const t = (i + 0.5) / w, l = Math.cos((t - 0.38) * Math.PI) * 0.12 - 0.06; px(i, 0, 1, h, tone(KEEL, l)); }
  for (let y = Math.round(0.4 * ppm); y < h; y += Math.round(0.7 * ppm)) { px(0, y, w, 1, tone(KEEL, -0.12)); px(0, y + 1, w, 1, tone(KEEL, 0.06)); }
  const f = fontFor(ppm), s = 'KEEP CLEAR';
  for (let i = 0; i < w; i += Math.max(4, Math.round(0.3 * ppm))) px(i, h - Math.round(0.5 * ppm), Math.max(2, Math.round(0.15 * ppm)), Math.max(2, Math.round(0.08 * ppm)), 0xd0ac5e);
  if (f.width(s) < w - 2) f.stencil(px, Math.floor((w - f.width(s)) / 2), Math.round(1.1 * ppm), s, 0xd0ac5e);
});
const wallScreen = tex('readyscreen', (px, w, h, ppm) => {
  px(0, 0, w, h, 0x282b34);
  screenFace(px, 2, 2, w - 4, h - 4, { kind: 'graph', seed: 4 });
  const f = fontFor(ppm), s = 'THREAT BOARD'; if (f.width(s) < w - 8) f.text(px, 4, 4, s, 0x9fe0b0, 7);
  for (let k = 0; k < 6; k++) { const x = 6 + ((k * 37) % (w - 12)), y = 6 + f.h + ((k * 23) % Math.max(1, h - 14 - f.h)); px(x, y, 2, 2, k % 3 ? 0xb45150 : 0x669f93, 7); }
});
const planTable = tex('plantable', (px, w, h, ppm) => {
  paintedSteel(px, 0, 0, w, h, { c: 0x3e424d, ppm, seed: 6 });
  screenFace(px, 2, 2, w - 4, h - 4, { kind: 'text', seed: 9, c: 0x1d2b46, lit: 0x86bdbc });
  for (let k = 0; k < 4; k++) px(4 + k * Math.round(w / 5), Math.round(h / 2), 2, 2, 0xe7b84a, 7);
});

export const deck = {
  name: 'deck', title: 'MCRN frigate (Hellas class), deck 5, the marines', palette: 'ship', mood: 'normal',
  moods: { normal: ship, battle, emergency, night: shipNight },
  views: { full: { x: 8.7, z: 6.6, zoom: 1 }, close: { x: 10.4, z: 3.4, zoom: 2 }, aft: { x: 8.7, z: 10.4, zoom: 2 } },
  build(area, { ppm, mood }) {
    const rooms = [
      { x0: 0, z0: 0, x1: 8.0, z1: 6.0 }, { x0: 8.0, z0: 0, x1: 10.4, z1: 6.0 }, { x0: 10.4, z0: 0, x1: 17.4, z1: 6.0 },
      { x0: 0, z0: 6.0, x1: 4.0, z1: 9.0 }, { x0: 4.0, z0: 6.0, x1: 17.4, z1: 8.0 },
      { x0: 0, z0: 9.0, x1: 4.0, z1: 15.4 }, { x0: 4.0, z0: 8.0, x1: 10.4, z1: 12.6 }, { x0: 10.4, z0: 8.0, x1: 15.0, z1: 12.6 }, { x0: 15.0, z0: 8.0, x1: 17.4, z1: 12.6 },
      { x0: 4.0, z0: 12.6, x1: 17.4, z1: 15.4 },
    ];
    const gap = (axis, at, a, b) => ({ axis, at, a, b, kind: 'gap' });
    const plan = {
      x0: 0, z0: 0, x1: 17.4, z1: 15.4, rooms,
      openings: [gap('x', 6.0, 5.0, 5.9), gap('x', 6.0, 8.3, 10.1), gap('x', 6.0, 11.2, 12.1), gap('z', 4.0, 6.5, 7.4),
        gap('x', 8.0, 6.2, 7.1), gap('x', 8.0, 12.1, 13.0), gap('x', 8.0, 15.7, 16.5), gap('z', 4.0, 9.6, 10.4), gap('x', 12.6, 6.6, 7.5), gap('x', 12.6, 15.6, 16.4)],
      decor: [
        { kind: 'emergency', x: 1.8 }, { kind: 'emergency', x: 5.8 }, { kind: 'emergency', x: 12.0 }, { kind: 'emergency', x: 16.0 },
        { kind: 'clock', x: 15.0, y: 2.25, w: 0.3, h: 0.3 },
        { kind: 'stencil', x: 4.0, y: 2.5, text: 'BERTHING 5-1' }, { kind: 'stencil', x: 13.9, y: 2.5, text: 'READY ROOM' },
      ],
      lamps: [
        { x: 2.5, z: 3.6, r: 2.1, color: 0xe8eef6 }, { x: 6.0, z: 3.6, r: 2.1 }, { x: 9.2, z: 3.0, r: 1.8 }, { x: 12.2, z: 3.0, r: 2.2 }, { x: 15.6, z: 3.0, r: 2.2 },
        { x: 6.5, z: 7.0, r: 1.6 }, { x: 11.5, z: 7.0, r: 1.6 }, { x: 15.5, z: 7.0, r: 1.6 }, { x: 2.0, z: 7.5, r: 1.6 },
        { x: 7.2, z: 10.3, r: 2.0 }, { x: 12.7, z: 10.3, r: 2.0 }, { x: 2.0, z: 12.2, r: 2.0 }, { x: 10.7, z: 14.0, r: 2.0 },
      ],
    };
    buildCutaway(area, plan, { deck: true, finish: BULKHEAD });
    const deckTile = tile('deckPlate', { metres: 2, ppm, c: 0x657974, plateM: 1.0, kind: 'grip', seed: 3 });
    for (const r of rooms) area.ground({ ...r, lift: 0.001, top: r === rooms[5] ? tile('deckPlate', { metres: 2, ppm, c: 0x6d757f, plateM: 0.5, kind: 'smooth', seed: 4 }) : deckTile });
    area.ground({ x0: 4.0, z0: 6.25, x1: 17.4, z1: 7.75, lift: 0.0015, top: tile('deckPlate', { metres: 2, ppm, c: 0x4c5f5e, plateM: 1.0, kind: 'grating', seed: 5 }) });
    // (on the hull wall: conduit along its top, handholds every metre, the deck's plaque, the escape trunk's door, the airlock at the corridor's end)
    place(area, { kind: 'conduit', make: 'pipes', x: 4.0, z: 0.1, y: 2.25, w: 7.6, d: 0.2, seed: 1 });
    place(area, { kind: 'conduit', make: 'cables', x: 13.9, z: 0.1, y: 2.3, w: 6.6, d: 0.2, seed: 2 });
    for (let x = 0.8; x < 17; x += 1.0) if (x < 7.0 || x > 11.0) place(area, { kind: 'handhold', make: 'bar', x, z: 0.05, y: 1.95, seed: x * 10 | 0 });
    place(area, { kind: 'sign', make: 'plaque', x: 13.9, z: 0.015, y: 1.5, look: { text: 'DECK 5', sub: 'MARINES', style: 'deck', icon: 'helmet' } });
    place(area, { kind: 'pressureDoor', make: 'dogged', x: 7.35, z: 0.15, w: 1.2, d: 0.3, seed: 2, look: { label: 'ESCAPE' } });
    place(area, { kind: 'airlockDoor', make: 'inner', x: 9.2, z: 0.17, w: 2.2, d: 0.34, seed: 3, look: { state: mood === 'battle' ? 'cycling' : 'ready', label: 'LOCK 5' } });
    // (the berthing: six three-high columns, heads to the hull, curtains drawn on some; the gunny's cabin)
    for (let i = 0; i < 6; i++) place(area, { kind: 'rack3', make: 'grey', x: 0.6 + i * 0.95 + 0.4, z: 1.0, face: 'down', seed: 100 + i, look: { made: i % 3 !== 1, blanket: 'grey', boots: i % 2 === 0 } });
    place(area, { kind: 'hatch', make: 'escape', x: 6.9, z: 4.6, seed: 4 });
    place(area, { kind: 'footlocker', make: 'polymer', x: 1.1, z: 4.9, seed: 5 }); place(area, { kind: 'footlocker', make: 'polymer', x: 3.0, z: 4.9, seed: 6 });
    place(area, { kind: 'rack1', make: 'grey', x: 0.55, z: 7.5, face: 'right', seed: 7, look: { made: true, blanket: 'grey' } });
    place(area, { kind: 'desk', make: 'steel', x: 3.1, z: 6.45, face: 'down', w: 1.0, d: 0.6, seed: 8, look: { screen: true } });
    // (the corridor to the hull: the main trunk's ladder well, a beacon by it)
    place(area, { kind: 'ladderWell', make: 'trunk', x: 9.2, z: 3.4, seed: 9 });
    place(area, { kind: 'emergencyLight', make: 'beacon', x: 10.2, z: 2.0, y: 2.3, seed: 1 });
    // (the ready room: crash couches in two rows, the threat board's repeater on the hull wall, the planning table)
    for (let row = 0; row < 2; row++) for (let i = 0; i < 6; i++) place(area, { kind: 'crashCouch', make: row === 0 && i === 0 ? 'station' : 'troop', x: 10.9 + i * 1.05, z: 1.2 + row * 2.6 + 0.4, seed: 200 + row * 6 + i, look: { harness: !(row === 1 && i === 3) } });
    { const p = area.part(); area.box({ x0: 10.6, x1: 12.4, z0: 0, z1: 0.06, y0: 1.2, y1: 2.15, part: p, faces: { front: wallScreen, sides: 0x282b34, top: 0x282b34 } }); }
    // (the passage: the damage-control locker, an extinguisher, handholds along the cut walls' tops)
    place(area, { kind: 'wallLocker', make: 'single', x: 16.9, z: 7.0, face: 'left', seed: 10, look: { colour: 0xb45150, n: 'DC' } });
    place(area, { kind: 'bin', make: 'extinguisher', x: 4.4, z: 6.15, seed: 2 });
    // (the suit room: suit stands round its walls, the leak-check port)
    for (let i = 0; i < 5; i++) place(area, { kind: 'suitLocker', make: i === 4 ? 'locker' : 'open', x: 4.6 + i * 0.95 + 0.45, z: 8.4, face: 'down', seed: 300 + i, look: { suit: i % 3 === 2 ? 'navy' : 'marine', empty: i === 1 && mood === 'battle' } });
    for (let i = 0; i < 5; i++) place(area, { kind: 'suitLocker', make: 'rack', x: 4.6 + i * 0.95 + 0.45, z: 12.2, face: 'up', seed: 310 + i, look: { suit: 'marine' } });
    // (the arms cage: rifles on pegs, a cabinet, ready-use ammunition lockers)
    place(area, { kind: 'rifleRack', make: 'pegs', x: 12.0, z: 8.3, face: 'down', w: 1.3, seed: 11, look: { n: 5 } });
    place(area, { kind: 'rifleRack', make: 'upright', x: 13.9, z: 8.5, face: 'down', w: 1.6, seed: 12 });
    place(area, { kind: 'rifleRack', make: 'cabinet', x: 14.7, z: 11.0, face: 'left', w: 1.2, seed: 13 });
    for (let i = 0; i < 3; i++) place(area, { kind: 'footlocker', make: 'steel', x: 11.0 + i * 0.85, z: 12.2, face: 'up', seed: 14 + i, look: { n: 'AMMO' } });
    // (the head: two toilets, two showers, three basins)
    for (let i = 0; i < 2; i++) place(area, { kind: 'toiletStall', make: 'ship', x: 0.5 + i * 0.95, z: 14.65, face: 'up', seed: 20 + i, look: { end: i === 1, door: 'closed' } });
    for (let i = 0; i < 2; i++) place(area, { kind: 'showerStall', make: 'curtain', x: 2.45 + i * 0.95, z: 14.9, face: 'up', seed: 22 + i, look: { end: i === 1, colour: 'grey', curtain: 'closed' } });
    place(area, { kind: 'sinkRow', make: 'trough', x: 2.0, z: 9.6, w: 1.8, d: 0.5, face: 'down', seed: 24, look: { mirror: false } });
    // (the keel space: the railgun's tube through the deck, stores lashed down)
    { const p = area.part(); area.box({ x0: 8.0, x1: 9.4, z0: 12.8, z1: 14.2, y0: 0, y1: 2.8, part: p, faces: { front: keelFace, sides: tone(KEEL, -0.1), top: tex('keeltop', (px, w, h) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const d = Math.hypot((i + 0.5) / w - 0.5, (j + 0.5) / h - 0.5); px(i, j, 1, 1, d > 0.5 ? null : d > 0.42 ? tone(KEEL, 0.05) : tone(KEEL, -0.12)); } }) } }); }
    for (let i = 0; i < 4; i++) place(area, { kind: 'footlocker', make: 'polymer', x: 12.0 + (i % 2) * 0.85, z: 13.5 + Math.floor(i / 2) * 0.5, seed: 30 + i });
    place(area, { kind: 'conduit', make: 'duct', x: 13.6, z: 15.2, y: 0.3, w: 6.6, d: 0.3, face: 'up', seed: 3 });
    const suited = mood === 'battle' || mood === 'emergency';
    return {
      figures: [{ x: 9.8, z: 7.0, dress: suited ? 'suit' : 'navy', seed: 3 }, { x: 6.0, z: 9.7, dress: suited ? 'suit' : 'utilities', facing: 'up', seed: 5 }, { x: 13.2, z: 5.3, dress: 'utilities', seed: 9 }, { x: 15.5, z: 9.5, dress: suited ? 'suit' : 'navy', seed: 12 }],
    };
  },
};
