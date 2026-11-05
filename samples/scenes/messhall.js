// OLYMPUS scenes sample: Base Melas's mess hall at the noon meal. The galley, the two serving lines, the dining room.
//
// PLACES §4.5 sets the hall (66 × 34 m, one storey, its west door facing the barracks): the galley along
// the north wall (ranges, kettles, combi ovens, prep tables, the bakery corner, hand sinks); two serving
// lines along the galley wall, Line 1 at x 8–20 and Line 2 at x 22–34, each a tray start, six serving
// segments and drinks, servers behind them and customers sliding trays along the front; the dining room
// of eight-seat tables in rows with 1.5 m aisles; the entry with its hand-wash basins and the headcount
// desk at x 6.5, z 16.5. This scene is the hall's western 40 m and its northern 22 m (my framing: the
// game's frame is 40 × 22.5 m), in the hall's own frame (x east, z south from the north wall).
//
// Steam rises over the hot wells, the kettles and the ranges (src/render/weather.js puffs; VIEWS §2.8:
// "steam: showers, galleys, laundries"); the serving line's heat lamps glow. The moods: noon (the
// overheads by day), evening.
import { buildCutaway } from '../../src/render/cutaway.js';
import { place } from '../../src/art/kit/index.js';
import { tex } from '../../src/art/kit/kit.js';
import { tile, paintedSteel } from '../../src/art/materials/index.js';
import { louvres } from '../../src/art/kit/common.js';
import { tone } from '../../src/art/tone.js';
import { reveille, evening } from './moods.js';

const FINISH = { kind: 'block', c1: 0xe1ccc0, c2: 0x3c5d84, outside: 0xa78c77, floor: 'slab', floorColor: 0xb7b0a8 };
const noon = { ...reveille, name: 'noon', sky: 0xf4f0e6, tint: [1, 0.98, 0.95], lamps: { ...reveille.lamps, ceiling: 0.3 } };
const hoodFace = tex('galleyhood', (px, w, h, ppm) => { paintedSteel(px, 0, 0, w, h, { c: 0xa5b5b6, ppm, seed: 3 }); for (let x = 2; x < w - 4; x += Math.round(0.6 * ppm)) { px(x, 2, Math.round(0.5 * ppm), h - 4, 0x87959d); louvres(px, x + 1, 3, Math.round(0.5 * ppm) - 2, h - 6, 0x87959d, 2); } px(0, h - 1, w, 1, tone(0xa5b5b6, -0.2)); });
const ovenFace = tex('combioven', (px, w, h, ppm) => { paintedSteel(px, 0, 0, w, h, { c: 0xa5b5b6, ppm, seed: 4 }); const m = Math.round(0.08 * ppm); px(m, m, w - 2 * m - Math.round(0.2 * ppm), h - 2 * m, 0x31292a); px(m + 1, m + 1, w - 2 * m - Math.round(0.2 * ppm) - 2, Math.round((h - 2 * m) * 0.35), 0x565b67); for (let y = m + 3; y < h - m - 2; y += Math.max(2, Math.round(0.12 * ppm))) px(m + 2, y, w - 2 * m - Math.round(0.2 * ppm) - 4, 1, 0x7c736b); px(w - m - Math.round(0.14 * ppm), m + 2, Math.round(0.1 * ppm), Math.round(0.14 * ppm), 0x1d2b46); px(w - m - Math.round(0.14 * ppm) + 1, m + 3, 1, 1, 0x9fe0b0, 7); });

export const mess = {
  name: 'mess', title: 'Base Melas, the mess hall at noon', palette: 'mars', mood: 'noon',
  moods: { noon, evening },
  views: { full: { x: 20, z: 8.4, zoom: 1 }, close: { x: 14.5, z: 8.6, zoom: 2 } },
  build(area, { ppm }) {
    const rooms = [{ x0: 0, z0: 0, x1: 40, z1: 9.0 }, { x0: 0, z0: 9.0, x1: 7.7, z1: 22 }, { x0: 7.7, z0: 9.0, x1: 40, z1: 22 }];
    const gap = (axis, at, a, b) => ({ axis, at, a, b, kind: 'gap' });
    const plan = {
      x0: 0, z0: 0, x1: 40, z1: 22, rooms,
      openings: [gap('x', 9.0, 8.0, 20.0), gap('x', 9.0, 22.0, 34.0), gap('z', 7.7, 12.0, 14.0), gap('z', 7.7, 17.0, 19.0), gap('z', 0, 14.0, 20.0)],
      decor: [{ kind: 'emergency', x: 6 }, { kind: 'emergency', x: 26 }, { kind: 'clock', x: 21.0, y: 2.3, w: 0.35, h: 0.35 }, { kind: 'stencil', x: 21, y: 1.9, text: 'GALLEY' }, { kind: 'sign', x: 3.6, y: 1.55, w: 1.6, h: 0.4, text: 'WASH HANDS', color: 0x27694b }],
      lamps: [...[5, 13, 21, 29, 37].flatMap(x => [{ x, z: 4.5, r: 2.4 }, { x, z: 12.5, r: 2.4 }, { x, z: 18.5, r: 2.6 }])],
    };
    buildCutaway(area, plan, { finish: FINISH, strips: false, battle: false });
    area.ground({ x0: 0, z0: 0, x1: 40, z1: 9.0, lift: 0.001, top: tile('ceramic', { metres: 1.2, ppm, c: 0x8f5a48, tileM: 0.3, seed: 6, grout: 0x7f5245 }) });
    area.ground({ x0: 0, z0: 9.0, x1: 40, z1: 22, lift: 0.001, top: tile('vinyl', { metres: 2.4, ppm, c: 0xc4ac97, tileM: 0.3, seed: 8 }) });
    area.ground({ x0: 7.7, z0: 9.0, x1: 40, z1: 10.0, lift: 0.0015, top: tile('rubberMat', { metres: 1, ppm, c: 0x565b67, kind: 'rib', seed: 3 }) });
    // (the galley: ranges under the hood on the north wall, kettles, combi ovens, prep tables, the bakery corner's rack)
    for (let i = 0; i < 4; i++) place(area, { kind: 'galleyUnit', make: 'range', x: 10.0 + i * 1.85 + 0.9, z: 0.45, w: 1.8, d: 0.9, seed: 10 + i });
    { const p = area.part(); area.box({ x0: 9.8, x1: 17.4, z0: 0, z1: 1.1, y0: 2.05, y1: 2.65, part: p, faces: { front: hoodFace, bottom: 0x87959d, top: 0x87959d, sides: 0x87959d } }); }
    for (let i = 0; i < 2; i++) place(area, { kind: 'galleyUnit', make: 'kettle', x: 19.4 + i * 1.6, z: 1.1, seed: 20 + i });
    for (let i = 0; i < 2; i++) { const p = area.part(); area.box({ x0: 23.5 + i * 1.1, x1: 24.5 + i * 1.1, z0: 0.1, z1: 1.0, y0: 0, y1: 1.9, part: p, faces: { front: ovenFace, top: 0xa5b5b6, sides: 0x87959d } }); }
    for (let i = 0; i < 4; i++) place(area, { kind: 'galleyUnit', make: 'prep', x: 11.0 + i * 3.6, z: 4.6, w: 1.8, d: 0.8, seed: 30 + i });
    for (let i = 0; i < 3; i++) place(area, { kind: 'sinkRow', make: 'trough', x: 28.2 + i * 2.2, z: 0.35, w: 1.2, d: 0.6, seed: 40 + i, look: { mirror: false } });
    place(area, { kind: 'rifleRack', make: 'cabinet', x: 35.2, z: 0.3, w: 1.6, d: 0.5, seed: 44, look: { empty: true } });
    for (let i = 0; i < 2; i++) place(area, { kind: 'wallLocker', make: 'mesh', x: 37.4 + i * 0.6, z: 0.3, seed: 45 + i, look: { colour: 'grey', open: true } });
    place(area, { kind: 'galleyUnit', make: 'prep', x: 3.5, z: 1.0, w: 2.4, d: 0.9, seed: 50 });
    place(area, { kind: 'galleyUnit', make: 'prep', x: 3.5, z: 5.0, w: 2.4, d: 0.9, seed: 51 });
    // (the serving lines: a tray start, four hot segments, a cold one; the drinks)
    for (const [x0, n] of [[8.0, 4], [22.0, 4]]) {
      place(area, { kind: 'servingLine', make: 'start', x: x0 + 0.6, z: 10.6, w: 1.2, seed: x0 });
      for (let i = 0; i < n; i++) place(area, { kind: 'servingLine', make: 'steam', x: x0 + 1.2 + i * 2.2 + 1.1, z: 10.6, w: 2.2, seed: x0 + i * 3 });
      place(area, { kind: 'servingLine', make: 'cold', x: x0 + 1.2 + n * 2.2 + 0.4, z: 10.6, w: 0.8, seed: x0 + 9 });
    }
    for (let i = 0; i < 3; i++) place(area, { kind: 'waterFountain', make: 'cooler', x: 36.0 + i * 0.6, z: 10.4, seed: 60 + i });
    // (the dining room: eight-seat tables in rows, trays on some; the entry's basins and the headcount desk)
    for (let row = 0; row < 2; row++) for (let i = 0; i < 9; i++) {
      const x = 9.6 + i * 3.35, z = 15.0 + row * 4.4, s = row * 9 + i;
      place(area, { kind: 'messTable', make: 'bench', x, z, seed: 70 + s, look: { trays: [6, 3, 0, 8, 4, 2, 7, 0, 5][(i + row * 4) % 9], state: s % 3 === 0 ? 'half' : 'full' } });
    }
    place(area, { kind: 'sinkRow', make: 'trough', x: 3.4, z: 9.4, w: 3.6, d: 0.55, seed: 80, look: { mirror: false } });
    place(area, { kind: 'desk', make: 'steel', x: 6.3, z: 16.5, face: 'left', w: 1.2, d: 0.6, seed: 81, look: { screen: true } });
    place(area, { kind: 'chair', make: 'office', x: 6.9, z: 16.5, face: 'left', seed: 81 });
    place(area, { kind: 'bin', make: 'bin', x: 1.0, z: 21.4, seed: 82 }); place(area, { kind: 'bin', make: 'bin', x: 39.4, z: 21.4, seed: 83 });
    const figures = [
      { x: 11.0, z: 9.6, dress: 'cook', seed: 1 }, { x: 15.4, z: 9.6, dress: 'cook', seed: 2 }, { x: 26.0, z: 9.6, dress: 'cook', seed: 3 }, { x: 13.0, z: 4.0, dress: 'cook', facing: 'up', seed: 4 },
      { x: 9.6, z: 12.0, dress: 'utilities', facing: 'up', seed: 5 }, { x: 12.2, z: 12.0, dress: 'utilities', facing: 'up', seed: 6 }, { x: 14.6, z: 12.0, dress: 'pt', facing: 'up', seed: 7 }, { x: 24.4, z: 12.0, dress: 'utilities', facing: 'up', seed: 8 },
      { x: 6.4, z: 15.6, dress: 'utilities', seed: 9 },
    ];
    const puffs = [...[0, 1, 2, 3].flatMap(i => [{ x: 8.0 + 1.2 + i * 2.2 + 1.1, y: 1.3, z: 10.4, r: 0.8, k: 0.55 }]), { x: 20.2, y: 1.4, z: 1.2, r: 1.1, k: 0.7 }, { x: 13.7, y: 1.6, z: 0.6, r: 1.6, k: 0.45 }, { x: 22 + 1.2 + 1.1, y: 1.3, z: 10.4, r: 0.8, k: 0.5 }, { x: 22 + 1.2 + 3.3, y: 1.3, z: 10.4, r: 0.8, k: 0.5 }];
    return { figures, weather: (m, t) => ({ puffs, steamColour: 0xe8eef6, timeS: t }) };
  },
};
