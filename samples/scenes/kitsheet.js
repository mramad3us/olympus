// OLYMPUS scenes sample: the kit sheet. Every kind of the kit in every make, labelled, in one room.
//
// tradecraft's furniture was judged on a contact sheet (docs/research/shots/tradecraft-sample008-home.png:
// the pieces in a row on a floor, each named on a plate under it in the pixel font); this is OLYMPUS's.
// A long room cut away as the stage cuts every room (src/render/cutaway.js), the fixtures that hang on a
// wall (doors, windows, boards, signs, conduit, handholds, emergency lamps) along its north wall at their
// heights, the rest in rows on the floor in every make, a plate on the floor in front of each naming it.
import { buildCutaway } from '../../src/render/cutaway.js';
import { place, KINDS, FOOTPRINTS } from '../../src/art/kit/index.js';
import { tex } from '../../src/art/kit/kit.js';
import { plaque, plaqueSize } from '../../src/art/kit/type.js';
import { tile } from '../../src/art/materials/index.js';
import { reveille, evening, lightsOut, ship, battle, emergency } from './moods.js';

const WALL = { airlockDoor: 1.3, pressureDoor: 1.3, window: 1.2, board: 1.2, sign: 0.6, conduit: 2.0, handhold: 0.3, emergencyLight: 0.4 };
const AT = { window: 1.0, board: 1.1, sign: 1.8, conduit: 2.1, handhold: 1.2, emergencyLight: 2.2 };
const WALL_LOOK = { sign: [{ text: 'DECK 5', sub: 'MARINES', style: 'deck', icon: 'helmet' }, { text: 'NO ENTRY', style: 'danger' }, {}] };

/** A label plate lying on the floor at (x, z) (its centre), naming a piece in the density's alphabet. */
function label(area, x, z, text, ppm) {
  const [w, h] = plaqueSize({ text, ppm, pad: 1 });
  const painter = tex(`label:${text}`, (px, ww, hh, p) => plaque(px, 0, 0, { text, ppm: p, pad: 1, style: 'plate' }));
  area.ground({ x0: x - w / ppm / 2, z0: z, x1: x + w / ppm / 2, z1: z + h / ppm, top: painter, lift: 0.004 });
}

export const kit = {
  name: 'kit', title: 'the kit sheet', palette: 'mars', mood: 'day',
  moods: { day: reveille, evening, night: lightsOut, ship, battle, emergency },
  views: { full: { x: 19, z: 9.4, zoom: 1 }, full2: { x: 19, z: 29, zoom: 1 }, wall: { x: 10, z: 2.6, zoom: 2 }, wall2: { x: 29, z: 2.6, zoom: 2 }, left: { x: 10, z: 9.5, zoom: 2 }, right: { x: 29, z: 9.5, zoom: 2 }, rows: { x: 10, z: 19.5, zoom: 2 }, rows2: { x: 29, z: 19.5, zoom: 2 }, rows3: { x: 10, z: 29.5, zoom: 2 }, rows4: { x: 29, z: 29.5, zoom: 2 } },
  build(area, { ppm }) {
    const W = 38, D = 40;
    buildCutaway(area, { x0: 0, z0: 0, x1: W, z1: D, rooms: [{ x0: 0, z0: 0, x1: W, z1: D, floor: 'slab', floorColor: 0x9c917a }], lamps: [] }, { strips: false, battle: false });
    area.ground({ x0: 0, z0: 0, x1: W, z1: D, lift: 0.001, top: tile('concrete', { metres: 4, ppm, c: 0x999189, jointM: 2, seed: 7 }) });
    // (a piece's slot is as wide as its label, so the plates never run into each other)
    const slot = (kind, make, w) => Math.max(w, plaqueSize({ text: `${kind} ${make}`.toUpperCase(), ppm, pad: 1 })[0] / ppm) + 0.25;
    // (along the north wall: what hangs, one of each make)
    let x = 0.4;
    for (const kind of KINDS.filter(k => WALL[k])) for (const make of FOOTPRINTS[kind].makes) {
      const fp = FOOTPRINTS[kind], w = kind === 'airlockDoor' && make === 'vehicle' ? 4.6 : fp.w, sw = slot(kind, make, w);
      if (x + sw > W - 0.2) break;
      const look = WALL_LOOK[kind]?.[FOOTPRINTS[kind].makes.indexOf(make)] ?? {};
      place(area, { kind, make, x: x + sw / 2, z: fp.d / 2, y: AT[kind] ?? 0, look, seed: x * 10 | 0 });
      label(area, x + sw / 2, kind === 'airlockDoor' || kind === 'pressureDoor' ? 0.5 : 0.3, `${kind} ${make}`.toUpperCase(), ppm);
      x += sw;
    }
    // (on the floor: every kind in every make, in rows; a row stands as far south of the last as its tallest piece is tall,
    // since a box d deep and h tall covers d + h of the picture: the tall ones would stand over the labels before them)
    const items = KINDS.filter(k => !WALL[k]).flatMap(kind => FOOTPRINTS[kind].makes.map(make => ({ kind, make, w: FOOTPRINTS[kind].w, d: FOOTPRINTS[kind].d, h: FOOTPRINTS[kind].h, sw: slot(kind, make, FOOTPRINTS[kind].w) })));
    const rowsOf = [];
    for (const it of items) { const r = rowsOf[rowsOf.length - 1]; if (r && r.reduce((a, b) => a + b.sw, 0.4) + it.sw <= W - 0.2) r.push(it); else rowsOf.push([it]); }
    let z = 1.1;
    for (const row of rowsOf) {
      z += Math.max(...row.map(it => it.h)) * 0.85;
      let x = 0.4;
      const rowD = Math.max(...row.map(it => it.d));
      for (const { kind, make, d, sw } of row) {
        const i = FOOTPRINTS[kind].makes.indexOf(make);
        const look = kind.startsWith('rack') ? { made: i !== 1, sleeper: i === 2 } : kind === 'messTable' ? { trays: 6 } : kind === 'wallLocker' ? { open: make === 'mesh', colour: ['olive', 'grey', 'tan'][i] } : kind === 'hatch' ? { open: make === 'square' } : kind === 'toiletStall' ? { end: true, occupied: make === 'steel' } : kind === 'showerStall' ? { end: true, curtain: ['closed', 'half', 'open'][i] } : kind === 'rangeBooth' ? { end: true, n: i + 1 } : kind === 'footlocker' ? { open: make === 'steel' } : {};
        place(area, { kind, make, x: x + sw / 2, z: z + d / 2, look, seed: (x * 7 + z * 3) | 0 });
        label(area, x + sw / 2, z + rowD + 0.12, `${kind} ${make}`.toUpperCase(), ppm);
        x += sw;
      }
      z += rowD + 0.55;
    }
    area.lamp({ x: 9, z: 6, r: 3 }); area.lamp({ x: 28, z: 6, r: 3 }); area.lamp({ x: 9, z: 15, r: 3 }); area.lamp({ x: 28, z: 15, r: 3 });
    return { figures: [{ x: 37.4, z: 1.6, dress: 'utilities' }, { x: 36.8, z: 1.6, dress: 'suit' }] };
  },
};
