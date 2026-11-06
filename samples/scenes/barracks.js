// OLYMPUS scenes sample: Echo Company's barracks at Base Melas. The squad bays at reveille and at night; the head.
//
// PLACES §4.4 sets the building: the east wing's ground floor (2nd Platoon, the player's) is three squad
// bays of 11.6 × 7.3 m on the north side of a 2.4 m hallway, and across it the platoon office, the HQ
// rack room, two heads, the laundry, the cleaning locker, the lounge and the east stair. The bays are
// layout A ("my default"): four units along the north wall, each a two-high rack (heads to the wall),
// two wall lockers beside it and a footlocker at its foot; three units along the south wall heads to it;
// the squad leader's single rack in the north-east corner; the door on the south wall; a study table
// with four stools in the south-east corner; an aisle of 2.3 m between the footlockers. Small deep
// windows, two a bay, on the north wall. The frame here is the wing's: x east from its west end, z south
// from its north wall (the building's frame less 49 m and 0.3 m).
//
// The scene adds, my calls for the look sample: the fire watch's post at the hallway's west end (a desk
// with the logbook and its lamp, a locked arms cabinet: PLACES keeps rifles in the battalion armoury,
// so a cabinet here is for the sample's sake), night lights at the foot of the hallway's wall every 6 m
// (VIEWS: "night lights at floor level every 6 m (amber, r 0.8 m)"), the heads lit at lights out.
// The moods: reveille (the overheads on before the sky is light), evening, lights out.
//
// The head is its own scene, built as its own area so its north wall stands full height (the cutaway
// cuts every other wall to 1 m, and a mirror over a basin wants a wall): head-2a's 7.6 × 7.7 m, its door
// on the north wall to the hallway, five shower stalls along it with their curtains and steam (VIEWS
// §2.8), the drying area's bench in front of them, an island of five basins under a mirror partition
// (the room's walls being cut, the mirrors stand on the island: my call), four toilet stalls on the east
// wall, two urinals, the mop bucket and the wet-floor sign of a head mid-morning.
import { buildCutaway } from '../../src/render/cutaway.js';
import { place } from '../../src/art/kit/index.js';
import { tile } from '../../src/art/materials/index.js';
import { reveille, evening, lightsOut } from './moods.js';

const BLOCK = { kind: 'block', c1: 0xd9d1b7, c2: 0x737949, outside: 0xa78c77, floor: 'slab', floorColor: 0xc4ac97 };
// (2.4 m tiles: a 1.2 m one showed its broken joints as a motif repeating every 1.2 m)
const vinylTile = (ppm, c = 0xc4ac97, seed = 3) => tile('vinyl', { metres: 2.4, ppm, c, tileM: 0.3, seed });
const ceramicTile = (ppm) => tile('ceramic', { metres: 1.2, ppm, c: 0xc7d5d0, tileM: 0.3, seed: 5, grout: 0xa5b5b6 });

/** Bay layout A (PLACES §4.4) at x offset bx: units along the north and south walls; returns the racks' spots. */
function bayLayout(area, bx, { make = 'steel', seed = 1, night = false, lockerColour = 'olive', footMake = 'wood' } = {}) {
  const racks = [];
  // (the north row: four units, heads to the north wall)
  for (let k = 0; k < 4; k++) {
    const x = bx + 0.15 + 2.45 * k, s = seed * 31 + k;
    const made = night ? false : (s % 3 !== 0);
    place(area, { kind: 'rack2', make, x: x + 0.475, z: 1.025, face: 'down', seed: s, look: { made, madeUpper: night ? false : s % 4 !== 1, sleeper: night } });
    for (let l = 0; l < 2; l++) place(area, { kind: 'wallLocker', make: s % 5 === 0 ? 'tier' : 'single', x: x + 0.95 + 0.3 + 0.6 * l, z: 0.275, face: 'down', seed: s * 2 + l, look: { colour: lockerColour, n: 210 + k * 2 + l + seed * 20, open: !night && (s * 2 + l) % 7 === 3 } });
    place(area, { kind: 'footlocker', make: footMake, x: x + 0.475, z: 2.275, face: 'down', seed: s, look: { n: 210 + k + seed * 20, open: !night && s % 6 === 2 } });
    racks.push([x + 0.475, 1.025]);
  }
  // (the squad leader's corner: a single rack along the east wall, two lockers south of it)
  place(area, { kind: 'rack1', make, x: bx + 11.6 - 0.5, z: 1.025, face: 'down', seed: seed * 7 + 5, look: { made: !night } });
  for (let l = 0; l < 2; l++) place(area, { kind: 'wallLocker', make: 'single', x: bx + 11.6 - 0.3, z: 2.55 + 0.6 * l, face: 'left', seed: seed * 9 + l, look: { colour: lockerColour, n: 200 + seed * 20 + l } });
  // (the south row: three units, heads to the south wall: we see the lockers' and footlockers' backs)
  for (let k = 0; k < 3; k++) {
    const x = bx + 0.15 + 2.45 * k, s = seed * 37 + k + 11;
    place(area, { kind: 'rack2', make, x: x + 0.475, z: 7.3 - 1.025, face: 'up', seed: s, look: { made: night ? false : s % 3 !== 0, madeUpper: night ? false : s % 4 !== 1, sleeper: night } });
    for (let l = 0; l < 2; l++) place(area, { kind: 'wallLocker', make: 'single', x: x + 0.95 + 0.3 + 0.6 * l, z: 7.3 - 0.275, face: 'up', seed: s * 2 + l, look: { colour: lockerColour, n: 220 + k * 2 + l + seed * 20 } });
    place(area, { kind: 'footlocker', make: footMake, x: x + 0.475, z: 7.3 - 2.275, face: 'up', seed: s, look: { n: 220 + k + seed * 20 } });
    racks.push([x + 0.475, 7.3 - 1.025]);
  }
  // (the study table in the south-east corner, its four stools)
  place(area, { kind: 'studyTable', x: bx + 10.3, z: 6.35, seed });
  for (const [dx, dz] of [[-0.45, -0.62], [0.45, -0.62], [-0.45, 0.6], [0.45, 0.6]]) place(area, { kind: 'stool', make: 'round', x: bx + 10.3 + dx, z: 6.35 + dz, seed: seed + dx * 10 });
  // (on the north wall: the windows over the racks, the notice board with the Plan of the Day over the squad leader's rack)
  for (const k of [0, 2]) place(area, { kind: 'window', make: 'deep', x: bx + 0.15 + 2.45 * k + 0.475, z: 0.02, y: 1.78, w: 0.8, h: 0.62, look: { sky: night ? 'night' : 'dawn' } });
  place(area, { kind: 'board', make: 'notice', x: bx + 10.75, z: 0.02, y: 1.05, w: 1.2, h: 0.8, seed });
  return racks;
}

export const bay = {
  name: 'bay', title: 'Base Melas, Echo Company, the squad bays', palette: 'mars', mood: 'reveille',
  moods: { reveille, evening, lightsOut },
  views: { full: { x: 17.4, z: 7.3, zoom: 1 }, close: { x: 6.2, z: 2.9, zoom: 2 }, hall: { x: 8, z: 9.5, zoom: 2 } },
  build(area, { ppm, mood }) {
    const night = mood === 'lightsOut';
    const rooms = [
      { x0: 0, z0: 0, x1: 11.6, z1: 7.3, finish: BLOCK }, { x0: 11.6, z0: 0, x1: 23.2, z1: 7.3, finish: BLOCK }, { x0: 23.2, z0: 0, x1: 34.7, z1: 7.3, finish: BLOCK },
      { x0: 0, z0: 7.3, x1: 34.7, z1: 9.7 },
      { x0: 0, z0: 9.7, x1: 4, z1: 17.4 }, { x0: 4, z0: 9.7, x1: 8, z1: 17.4 }, { x0: 8, z0: 9.7, x1: 15.6, z1: 17.4 }, { x0: 15.6, z0: 9.7, x1: 20, z1: 17.4 },
      { x0: 20, z0: 9.7, x1: 23.6, z1: 17.4 }, { x0: 23.6, z0: 9.7, x1: 25.6, z1: 17.4 }, { x0: 25.6, z0: 9.7, x1: 31, z1: 17.4 }, { x0: 31, z0: 9.7, x1: 34.7, z1: 17.4 },
    ];
    const gap = (axis, at, a, b) => ({ axis, at, a, b, kind: 'gap' });
    const plan = {
      x0: 0, z0: 0, x1: 34.7, z1: 17.4, rooms,
      openings: [gap('x', 7.3, 8.2, 9.2), gap('x', 7.3, 19.8, 20.8), gap('x', 7.3, 31.4, 32.4), gap('z', 0, 7.3, 9.7),
        gap('x', 9.7, 1.5, 2.4), gap('x', 9.7, 5.5, 6.4), gap('x', 9.7, 8.5, 9.4), gap('x', 9.7, 16.0, 16.9), gap('x', 9.7, 21.0, 21.9), gap('x', 9.7, 24.0, 24.8), gap('x', 9.7, 27.0, 28.6), gap('x', 9.7, 32.0, 33.2)],
      decor: [
        ...[0, 11.6, 23.2].flatMap((bx, i) => [
          { kind: 'clock', x: bx + 5.9, y: 2.3, w: 0.3, h: 0.3 }, { kind: 'emergency', x: bx + 4.6 }, { kind: 'emergency', x: bx + 9.8 },
          // (clear of the window at bx + 5.5 and the notice board at bx + 10.75: the whole-glyph stencil is 2.2 m wide, and under the window it read '1 QUAD')
          { kind: 'stencil', x: bx + 8.1, y: 1.95, text: ['1ST SQUAD', '2ND SQUAD', '3RD SQUAD'][i] },
        ]),
      ],
      lamps: [
        ...[0, 11.6, 23.2].flatMap(bx => [{ x: bx + 3.4, z: 3.65, r: 2.2 }, { x: bx + 8.2, z: 3.65, r: 2.2 }]),
        ...[3, 9, 15, 21, 27, 33].map(x => ({ x, z: 8.5, r: 1.6 })),
        { x: 2, z: 13.5, r: 2 }, { x: 6, z: 13.5, r: 2 }, { x: 11.8, z: 12.5, r: 2, kind: 'head' }, { x: 11.8, z: 15.5, r: 2, kind: 'head' }, { x: 17.8, z: 13.5, r: 2, kind: 'head' },
        { x: 21.8, z: 13.5, r: 2 }, { x: 28.3, z: 13.5, r: 2.2 }, { x: 32.8, z: 13.5, r: 2 },
      ],
    };
    buildCutaway(area, plan, { finish: BLOCK, strips: false, battle: false });
    // (the floors: vinyl tile in the bays and the hallway, a darker band down the hallway's sides; ceramic in the heads; sealed concrete in the stair and the closet)
    for (const r of rooms.slice(0, 3)) area.ground({ ...r, lift: 0.001, top: vinylTile(ppm) });
    area.ground({ x0: 0, z0: 7.3, x1: 34.7, z1: 9.7, lift: 0.001, top: vinylTile(ppm, 0x9c917a, 9) });
    area.ground({ x0: 0, z0: 7.6, x1: 34.7, z1: 9.4, lift: 0.0015, top: vinylTile(ppm, 0xc4ac97, 4) });
    for (const r of [rooms[6], rooms[7]]) area.ground({ ...r, lift: 0.001, top: ceramicTile(ppm) });
    for (const r of [rooms[4], rooms[5], rooms[8], rooms[10]]) area.ground({ ...r, lift: 0.001, top: vinylTile(ppm, 0xb7b0a8, 6) });
    for (const r of [rooms[9], rooms[11]]) area.ground({ ...r, lift: 0.001, top: tile('concrete', { metres: 2, ppm, c: 0x999189, seed: 8 }) });
    // (the bays)
    bayLayout(area, 0, { make: 'steel', seed: 1, night, lockerColour: 'olive', footMake: 'wood' });
    bayLayout(area, 11.6, { make: 'grey', seed: 2, night, lockerColour: 'grey', footMake: 'steel' });
    bayLayout(area, 23.2, { make: 'modular', seed: 3, night, lockerColour: 'tan', footMake: 'polymer' });
    // (the fire watch's post at the hallway's west end, the arms cabinet beside it; night lights along the hallway)
    place(area, { kind: 'desk', make: 'steel', x: 1.8, z: 8.35, face: 'down', seed: 4, look: { screen: true } });
    place(area, { kind: 'chair', make: 'office', x: 1.8, z: 7.75, face: 'down', seed: 4 });
    place(area, { kind: 'rifleRack', make: 'cabinet', x: 3.6, z: 7.55, w: 1.1, d: 0.42, face: 'down', seed: 5 });
    area.lamp({ x: 1.6, z: 8.6, y: 1.1, r: 1.0, core: 0.5, ring: 0.18, kind: 'desk', color: 0xffd9a0 });
    for (const x of [6, 12, 18, 24, 30]) place(area, { kind: 'emergencyLight', make: 'night', x, z: 7.33, y: 0.22, seed: x });
    place(area, { kind: 'bin', make: 'extinguisher', x: 14.5, z: 7.4, seed: 1 });
    place(area, { kind: 'bin', make: 'extinguisher', x: 29.5, z: 7.4, seed: 2 });
    // (across the hallway: the platoon office, the HQ rack room, the heads, the laundry, the closet, the lounge, the stair)
    place(area, { kind: 'desk', make: 'steel', x: 2, z: 11.6, seed: 11 }); place(area, { kind: 'chair', make: 'office', x: 2, z: 11.0, seed: 11 });
    place(area, { kind: 'desk', make: 'wood', x: 2, z: 14.9, seed: 12 }); place(area, { kind: 'chair', make: 'office', x: 2, z: 14.3, seed: 12 });
    place(area, { kind: 'wallLocker', make: 'tier', x: 3.6, z: 16.9, face: 'up', seed: 13, look: { colour: 'grey' } });
    place(area, { kind: 'rack2', make: 'grey', x: 4.65, z: 12.2, seed: 14, look: { made: !night, sleeper: night } }); place(area, { kind: 'rack2', make: 'grey', x: 7.35, z: 12.2, seed: 15, look: { made: true } });
    for (let l = 0; l < 4; l++) place(area, { kind: 'wallLocker', make: 'single', x: 4.3 + 0.6 * l + (l > 1 ? 0.8 : 0), z: 16.9, face: 'up', seed: 16 + l, look: { colour: 'grey' } });
    // (head A: showers along its east part, stalls on its east wall, basins on an island; head B the same, smaller)
    for (let i = 0; i < 5; i++) place(area, { kind: 'showerStall', make: 'curtain', x: 8.6 + i * 0.95 + 0.475, z: 16.9, face: 'up', seed: 20 + i, look: { curtain: i % 2 ? 'closed' : 'open', end: i === 4, colour: 'white' } });
    for (let i = 0; i < 4; i++) place(area, { kind: 'toiletStall', make: 'laminate', x: 15.6 - 0.75, z: 10.2 + i * 0.95 + 0.475, face: 'left', seed: 30 + i, look: { door: i === 1 ? 'open' : 'closed', occupied: i === 2, end: i === 3 } });
    place(area, { kind: 'sinkRow', make: 'counter', x: 11.2, z: 12.4, w: 3.0, d: 0.6, face: 'down', seed: 40, look: { mirror: false } });
    for (let i = 0; i < 3; i++) place(area, { kind: 'showerStall', make: 'curtain', x: 15.9 + i * 0.95 + 0.475, z: 16.9, face: 'up', seed: 44 + i, look: { curtain: 'open', end: i === 2, colour: 'blue' } });
    place(area, { kind: 'sinkRow', make: 'trough', x: 17.8, z: 12.0, w: 1.8, face: 'down', seed: 47, look: { mirror: false } });
    // (the laundry, the closet, the lounge)
    for (let i = 0; i < 3; i++) place(area, { kind: 'washer', make: 'stack', x: 20.5 + i * 0.68, z: 10.1, face: 'down', seed: 50 + i });
    place(area, { kind: 'tableSmall', make: 'folding', x: 22.2, z: 13.8, seed: 53 });
    place(area, { kind: 'bin', make: 'mop', x: 24.2, z: 11.0, seed: 3 }); place(area, { kind: 'bin', make: 'bin', x: 25.0, z: 11.0, seed: 4 });
    place(area, { kind: 'wallLocker', make: 'single', x: 24.6, z: 16.9, face: 'up', seed: 55, look: { colour: 'grey' } });
    place(area, { kind: 'sofa', make: 'vinyl', x: 28.0, z: 10.6, seed: 56 }); place(area, { kind: 'sofa', make: 'cloth', x: 28.0, z: 16.7, face: 'up', seed: 57 });
    place(area, { kind: 'tableSmall', make: 'steel', x: 28.3, z: 13.6, seed: 58 });
    for (const [dx, dz] of [[-0.8, 0], [0.8, 0]]) place(area, { kind: 'chair', make: 'folding', x: 28.3 + dx, z: 13.6 + dz, face: dx < 0 ? 'right' : 'left', seed: 59 });
    place(area, { kind: 'vending', make: 'snack', x: 30.5, z: 13.0, face: 'left', seed: 60 }); place(area, { kind: 'vending', make: 'drink', x: 30.5, z: 14.0, face: 'left', seed: 61 });
    stair(area, 31.2, 34.5, 10.2, 17.2);
    const figures = night
      ? [{ x: 9.6, z: 8.7, dress: 'watch', seed: 3 }, { x: 1.8, z: 7.95, dress: 'utilities', seed: 8 }]
      : [{ x: 6.4, z: 3.6, dress: 'pt', seed: 2 }, { x: 3.0, z: 4.1, dress: 'utilities', seed: 5 }, { x: 15.8, z: 3.8, dress: 'pt', seed: 7 }, { x: 1.8, z: 7.95, dress: 'utilities', seed: 8 }, { x: 10.4, z: 9.0, dress: 'towel', facing: 'up', seed: 9 }];
    return { figures, weather: (m, t) => (m === 'lightsOut' ? null : { puffs: [0, 2, 4].map(i => ({ x: 9.1 + i * 0.95, y: 1.6, z: 16.6, r: 0.75, k: 0.6 })), timeS: t }) };
  },
};

/** The east stair: treads climbing north from the hallway's far side, a handrail on its open side (my drawing). */
function stair(area, x0, x1, z0, z1) {
  const n = 12, run = (z1 - z0) / n, part = area.part();
  for (let i = 0; i < n; i++) {
    const zz = z1 - (i + 1) * run, y = (i + 1) * 0.2;
    area.box({ x0, x1, z0: zz, z1: zz + run, y0: 0, y1: y, part, faces: { top: 0x9c917a, front: 0x6e5256, sides: 0x523b42 } });
  }
  area.box({ x0: x0 - 0.04, x1: x0, z0: z0, z1: z1, y0: 0.9, y1: 0.95, faces: { sides: 0x31292a } });
}

export const head = {
  name: 'head', title: 'Base Melas, Echo Company, the head', palette: 'mars', mood: 'evening',
  moods: { evening, reveille, lightsOut },
  views: { close: { x: 3.9, z: 3.2, zoom: 2 }, full: { x: 3.9, z: 4.5, zoom: 1 } },
  build(area, { ppm, mood }) {
    const finish = { kind: 'block', c1: 0xc7d5d0, c2: 0x5d9db1, outside: 0xa78c77, floor: 'tiles', floorColor: 0xc7d5d0 };
    const plan = {
      x0: 0, z0: 0, x1: 7.6, z1: 7.7, rooms: [{ x0: 0, z0: 0, x1: 7.6, z1: 7.7, finish }],
      openings: [{ axis: 'x', at: 0, a: 0.35, b: 1.25, kind: 'door', label: 'HEAD' }],
      decor: [{ kind: 'emergency', x: 6.8 }, { kind: 'stencil', x: 4.0, y: 2.35, text: 'HEAD 2A' }, { kind: 'clock', x: 6.9, y: 2.3, w: 0.3, h: 0.3 }],
      lamps: [{ x: 2.2, z: 2.0, r: 2.2, kind: 'head' }, { x: 5.6, z: 2.0, r: 2.2, kind: 'head' }, { x: 3.4, z: 5.6, r: 2.4, kind: 'head' }],
    };
    buildCutaway(area, plan, { finish, strips: false, battle: false });
    area.ground({ x0: 0, z0: 0, x1: 7.6, z1: 7.7, lift: 0.001, top: ceramicTile(ppm) });
      // (five shower stalls along the north wall, curtains drawn on the ones in use, steam over them)
    const using = [0, 2, 3];
    for (let i = 0; i < 5; i++) place(area, { kind: 'showerStall', make: 'curtain', x: 1.6 + i * 0.95 + 0.475, z: 0.5, face: 'down', seed: 70 + i, look: { curtain: using.includes(i) ? 'closed' : i === 1 ? 'half' : 'open', end: i === 4, colour: ['white', 'blue', 'white', 'grey', 'white'][i], wet: true } });
    // (the drying area: a bench; the urinals on the east wall's north end; the stalls down the east wall)
    area.box({ x0: 2.1, x1: 5.9, z0: 1.85, z1: 2.15, y0: 0.42, y1: 0.46, faces: { top: 0xa78c77, front: 0x8c6d59, sides: 0x8c6d59 } });
    for (const x of [2.3, 5.7]) area.box({ x0: x - 0.03, x1: x + 0.03, z0: 1.9, z1: 2.1, y0: 0, y1: 0.42, faces: { sides: 0x7c736b } });
    for (let i = 0; i < 2; i++) place(area, { kind: 'urinal', make: 'wall', x: 7.6 - 0.2, z: 1.0 + i * 0.7, face: 'left', seed: 80 + i });
    // (the stalls along the south wall, doors to the north: we look over the cut wall into them, as the cutaway shows a room)
    for (let i = 0; i < 4; i++) place(area, { kind: 'toiletStall', make: 'steel', x: 3.4 + i * 0.95 + 0.475, z: 7.7 - 0.75, face: 'up', seed: 82 + i, look: { door: i === 3 ? 'open' : 'closed', occupied: i === 1, end: i === 3 } });
    // (the island: five basins under a mirror partition, fogged with the showers' steam)
    place(area, { kind: 'sinkRow', make: 'counter', x: 3.3, z: 4.6, w: 3.0, d: 0.6, face: 'down', seed: 90, look: { fog: mood !== 'reveille' } });
    // (a head mid-routine: the mop bucket, the bin, a wet-floor sign, a fountain by the door)
    place(area, { kind: 'bin', make: 'mop', x: 1.0, z: 6.9, seed: 5 });
    place(area, { kind: 'washer', make: 'washer', x: 7.2, z: 4.6, face: 'left', seed: 9, look: { running: true } });
    place(area, { kind: 'bin', make: 'bin', x: 0.4, z: 4.4, seed: 6 });
    place(area, { kind: 'waterFountain', make: 'bottle', x: 0.35, z: 2.2, face: 'right', seed: 7 });
    place(area, { kind: 'sign', make: 'stencil', x: 2.0, z: 6.3, look: { text: 'WET FLOOR', floor: true, colour: 0xd0ac5e } });
    return {
      figures: [{ x: 2.6, z: 5.35, dress: 'towel', facing: 'up', seed: 11 }, { x: 4.3, z: 5.4, dress: 'towel', facing: 'up', seed: 12 }, { x: 0.9, z: 1.9, dress: 'pt', seed: 13 }],
      weather: (m, t) => ({ puffs: [...using.map(i => ({ x: 2.075 + i * 0.95, y: 1.9, z: 0.6, r: 0.9, k: 0.85 })), { x: 3.3, y: 1.5, z: 4.0, r: 1.4, k: 0.35 }], steamColour: 0xdfe8f6, timeS: t }),
    };
  },
};
