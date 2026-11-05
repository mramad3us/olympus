// OLYMPUS scenes sample: outdoors on the floor of Melas Chasma. Regolith, rocks, a station of sintered brick, a scarp in the haze.
//
// The valley floor at about −4.5 km (DESIGN.md: 66 kPa, breathable; PLACES §3.15: the night wind off the
// south wall, the day's up the valley from the east, storms by optical depth τ). The station is my
// stand-in for the training areas' outbuildings (PLACES X8, the Talus): one storey of sintered regolith
// block (PLACES §3.14 blockWallIns), a parapet, its HVAC plant and dust filters on the flat roof
// (PLACES §4.4), a personnel door in a dust vestibule (PLACES §1.6: "always in a dust vestibule pair,
// 2.0 m apart, with an air curtain and a boot brush"), and a vehicle dust lock (the garage's 4 m door,
// PLACES §1.6 vehicleDoor), floodlights over both. A sinter-slab path to the door (PLACES §4.1), a rover's
// tracks out of the lock, boot prints, rocks, dust drifted at the walls' feet.
//
// The wall at the top of the frame is a south-facing scarp of the canyon floor's layered deposits (my
// call: the camera looks north, so a face shows only if it faces south and its foot is in the frame;
// src/art/terrain/scarp.js says why the canyon's own south wall, 10 km away and facing north, is never
// in this picture).
//
// The moods: a clear day (VIEWS §2.7, the sun above 20°), and a heavy dust storm (τ 6: the sun a hundredth,
// shadows gone, sight 40 m, dust falling; weather.js haze, falls and blowing dust; the floods on; the fog of
// awareness on, as tradecraft's Cairo dust showed it, the visible cone clear and the rest veiled).
import { layGround, slabPath, scatterRocks, boulder, drift, scarp } from '../../src/art/terrain/index.js';
import { place } from '../../src/art/kit/index.js';
import { tex } from '../../src/art/kit/kit.js';
import { sinteredBrick, paintedSteel, regolith, grimeFoot, streaks } from '../../src/art/materials/index.js';
import { tone, hash3 } from '../../src/art/tone.js';
import { plaque, plaqueSize } from '../../src/art/kit/type.js';
import { louvres } from '../../src/art/kit/common.js';
import { GLOW } from '../../src/art/paint.js';
import { marsDay, marsStorm } from './moods.js';
import { dustOf } from '../../src/render/weather.js';

const BRICK = 0x9a5d3e, CAP = 0xa78c77, ROOF = 0x7f735a;

/** The station's façade, painted to its face in world pixels: sintered block, a plinth, rust streaks from the parapet, grime at the foot. */
const facade = tex('station-facade', (px, w, h, ppm) => {
  sinteredBrick(px, 0, 0, w, h, { c: BRICK, ppm, seed: 4, wx: 0, wy: 0 });
  const cap = Math.max(2, Math.round(0.15 * ppm));
  px(0, 0, w, cap, CAP); px(0, cap - 1, w, 1, tone(CAP, -0.15)); px(0, 0, w, 1, tone(CAP, 0.06));
  streaks(px, 0, cap, w, h, BRICK, { ppm, lenM: 1.4, per: 0.18, dL: -0.05, seed: 3 });
  const plinth = Math.round(0.45 * ppm);
  px(0, h - plinth, w, plinth, tone(BRICK, -0.12)); px(0, h - plinth, w, 1, tone(BRICK, 0.02));
  grimeFoot(px, 0, 0, w, h, BRICK, { ppm, upM: 0.6, seed: 5, k: 1.4 });
});
const roofTop = tex('station-roof', (px, w, h, ppm) => {
  regolith(px, 0, 0, w, h, { c: ROOF, ppm, seed: 9, dust: 0.6, ripples: 0, pebbles: 2, basalt: ROOF });
  const cap = Math.max(2, Math.round(0.2 * ppm));
  px(0, 0, w, cap, CAP); px(0, h - cap, w, cap, CAP); px(0, 0, cap, h, CAP); px(w - cap, 0, cap, h, CAP);
  px(0, h - 1, w, 1, tone(CAP, 0.06));
});
const unitFace = tex('hvac-front', (px, w, h, ppm) => { paintedSteel(px, 0, 0, w, h, { c: 0xa5b5b6, ppm, seed: 2 }); louvres(px, 2, 2, w - 4, h - 4, 0xa5b5b6, Math.max(2, Math.round(ppm / 8))); grimeFoot(px, 0, 0, w, h, 0xa5b5b6, { ppm, upM: 0.3, seed: 3 }); });
const unitTop = tex('hvac-top', (px, w, h, ppm) => { paintedSteel(px, 0, 0, w, h, { c: 0xb7c4c4, ppm, seed: 3 }); const r = Math.min(w, h) * 0.32; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const d = Math.hypot(i - w / 2, j - h / 2); if (d < r) px(i, j, 1, 1, d > r - 1.5 ? 0x565b67 : (Math.floor(Math.atan2(j - h / 2, i - w / 2) * 3) & 1) ? 0x31292a : 0x49403e); } });
const filterFace = tex('dustfilter', (px, w, h, ppm) => { paintedSteel(px, 0, 0, w, h, { c: 0x87959d, ppm, seed: 5 }); for (let x = 2; x < w - 2; x += Math.max(3, Math.round(ppm / 5))) { px(x, 2, Math.max(2, Math.round(ppm / 8)), h - 4, 0xc18064); px(x, 2, 1, h - 4, tone(0xc18064, 0.06)); } });
const floodFace = tex('floodlamp', (px, w, h) => { px(0, 0, w, h, 0x31292a); px(1, 1, w - 2, h - 2, 0xf8e08a, GLOW.LAMP); });
const nameplate = (text) => tex(`nameplate:${text}`, (px, w, h, ppm) => plaque(px, 0, 0, { text, style: 'corps', icon: 'star', ppm }));

export const chasm = {
  name: 'chasm', title: 'Melas Chasma, the valley floor', palette: 'mars', mood: 'day',
  moods: { day: marsDay, storm: marsStorm(4), heavy: marsStorm(6) },
  views: { full: { x: 0, z: 1.2, zoom: 1 }, close: { x: -8.5, z: 3.6, zoom: 2 } },
  build(area, { ppm }) {
    // (the ground: 48 × 28 m in 12 m chunks, the rover's tracks out of the lock and away south-east, boot prints from the door)
    const tracks = [{ pts: [[-4.8, 7.4], [-4.6, 9.5], [-2.5, 11.5], [4, 12.5], [14, 13.5], [26, 14]], gaugeM: 1.9, widthM: 0.42 }, { pts: [[-5.2, 7.4], [-5.5, 10], [-9, 13], [-20, 14.5]], gaugeM: 1.9, widthM: 0.42, c: 0x8f5a48 }];
    const prints = [{ pts: [[-13.8, 9.0], [-13.6, 11], [-12.5, 13.5]], age: 0.2 }, { pts: [[-13.0, 8.9], [-11, 10.5], [-6.5, 12.2], [1.5, 12.9]], age: 0.7 }];
    layGround(area, { x0: -24, z0: -12, x1: 24, z1: 15, chunkM: 12, seed: 7, dust: 0.5, tracks, prints });
    // (the scarp at the top of the frame, its talus; rocks over the floor; the station)
    scarp(area, { x0: -24, x1: 24, z: -5.2, heightM: 26, talusM: 4.2, talusH: 1.5, seed: 3, boulders: 12 });
    const station = { x0: -19, x1: -1, z0: 1.2, z1: 6.6 };
    const garage = { x0: -8.6, x1: -1.0, z0: 0.6, z1: 7.2 };
    scatterRocks(area, { x0: -24, z0: -0.5, x1: 24, z1: 14.5, n: 26, seed: 11, minM: 0.18, maxM: 1.1, kind: (x, z) => (hash3(Math.round(x), Math.round(z)) % 4 ? 'basalt' : 'rust'),
      avoid: [{ x0: -20, x1: 0, z0: 0, z1: 9.5 }, { x0: -15.5, x1: -12, z0: 8, z1: 15 }, { x0: -7.5, x1: 2, z0: 7, z1: 15 }] });
    boulder(area, { x: 9.5, z: 3.2, sizeM: 1.9, kind: 'layered', seed: 41 }); boulder(area, { x: 11.2, z: 4.1, sizeM: 0.9, kind: 'layered', seed: 42 });
    // (the station: its block, a parapet, the roof's plant; the garage taller at its east end)
    const sPart = area.part();
    area.box({ ...station, y0: 0, y1: 4.0, part: sPart, faces: { front: facade, top: roofTop, sides: tone(BRICK, -0.1), back: tone(BRICK, -0.12) } });
    area.box({ ...garage, y0: 0, y1: 5.4, part: area.part(), faces: { front: facade, top: roofTop, sides: tone(BRICK, -0.1), back: tone(BRICK, -0.12) } });
    for (const [x, z] of [[-16.5, 2.6], [-13.6, 2.4]]) { const p = area.part(); area.box({ x, z, y: 4.0, w: 1.6, d: 1.2, h: 0.9, part: p, faces: { front: unitFace, top: unitTop, sides: 0x87959d } }); }
    { const p = area.part(); area.box({ x: -10.8, z: 2.4, y: 4.0, w: 2.6, d: 0.9, h: 0.7, part: p, faces: { front: filterFace, top: 0x87959d, sides: 0x6e7582 } }); }
    { const p = area.part(); area.box({ x: -18.2, z: 2.0, y: 4.0, w: 0.08, d: 0.08, h: 2.6, part: p, faces: { sides: 0x7c736b } }); area.box({ x: -18.2, z: 2.0, y: 6.5, w: 0.5, d: 0.08, h: 0.06, part: p, faces: { sides: 0x7c736b } }); }
    // (the personnel door's dust vestibule: a porch of the same block, the outer door on its front, a flood over it, the station's plate)
    const porch = { x0: -15.4, x1: -12.4, z0: 6.6, z1: 8.6 };
    area.box({ ...porch, y0: 0, y1: 3.0, part: area.part(), faces: { front: facade, top: roofTop, sides: tone(BRICK, -0.1) } });
    place(area, { kind: 'pressureDoor', make: 'sliding', x: -13.9, z: 8.6 + 0.12, w: 1.4, d: 0.24, seed: 3, look: { label: 'DUST LOCK' } });
    { const p = area.part(); area.box({ x: -13.9, z: 8.75, y: 2.6, w: 0.5, d: 0.3, h: 0.16, part: p, faces: { front: floodFace, bottom: floodFace, top: 0x31292a, sides: 0x31292a } }); }
    area.lamp({ x: -13.9, z: 10.0, y: 2.6, r: 2.2, core: 0.3, ring: 0.1, kind: 'flood', color: 0xfff0d8 });
    { const [pw, ph] = plaqueSize({ text: 'TALUS 3', icon: 'star', ppm }); area.box({ x0: -18.2, x1: -18.2 + pw / ppm, z0: 6.6, z1: 6.62, y0: 2.4, y1: 2.4 + ph / ppm, part: area.part(), faces: { front: nameplate('TALUS 3') }, only: ['front'] }); }
    // (the garage's vehicle dust lock, its floods; slit windows along the block)
    place(area, { kind: 'airlockDoor', make: 'vehicle', x: -4.8, z: 7.2 + 0.18, w: 4.6, d: 0.36, seed: 5, look: { state: 'ready' } });
    for (const x of [-7.6, -2.0]) { const p = area.part(); area.box({ x, z: 7.36, y: 4.95, w: 0.5, d: 0.3, h: 0.16, part: p, faces: { front: floodFace, bottom: floodFace, top: 0x31292a, sides: 0x31292a } }); area.lamp({ x, z: 8.8, y: 4.9, r: 2.4, core: 0.28, ring: 0.1, kind: 'flood', color: 0xfff0d8 }); }
    for (const x of [-17.6, -11, -10.2]) place(area, { kind: 'window', make: 'slit', x, z: 6.62, y: 1.9, w: 0.5, h: 0.35, look: { frame: CAP, sky: 'night' } });
    // (dust heaped in the lee: the porch's and the garage's west sides, along the façade's foot)
    drift(area, { x0: -19, x1: -15.4, z: 6.6, heightM: 0.28, reachM: 1.3, seed: 2 });
    drift(area, { x0: -12.4, x1: -8.6, z: 6.6, heightM: 0.22, reachM: 1.1, seed: 3 });
    drift(area, { x0: -1.0, x1: 1.6, z: 3.6, heightM: 0.3, reachM: 1.6, seed: 4 });
    // (the path of sinter slabs from the door south out of the frame, a weather mast, an O2 bottle rack by the garage)
    slabPath(area, { x0: -14.5, x1: -13.3, z0: 8.6, z1: 15, seed: 5 });
    { const p = area.part(); area.box({ x: 4.5, z: 8.0, w: 0.1, d: 0.1, h: 4.2, part: p, faces: { sides: 0x7c736b } }); area.box({ x: 4.5, z: 8.0, y: 4.2, w: 0.9, d: 0.06, h: 0.06, part: p, faces: { sides: 0x7c736b } }); area.box({ x: 4.9, z: 8.0, y: 4.26, w: 0.16, d: 0.16, h: 0.16, part: p, faces: { sides: 0xb45150, top: 0xb45150 } }); area.box({ x: 4.5, z: 8.0, y: 3.9, w: 0.14, d: 0.14, h: 0.12, part: p, faces: { front: tex('beacon-red', (px, w, h) => px(0, 0, w, h, 0xff4a3a, GLOW.ALWAYS)), sides: 0xff4a3a, top: 0xff4a3a } }); }
    { const p = area.part(); area.box({ x: 0.6, z: 6.4, w: 1.2, d: 0.5, h: 0.08, part: p, faces: { sides: 0x49403e } }); for (let i = 0; i < 4; i++) area.box({ x: 0.15 + i * 0.3, z: 6.4, y: 0.08, w: 0.22, d: 0.22, h: 1.3, part: area.part(), faces: { front: tex('o2bottle', (px, w, h, p2) => { px(0, 0, w, h, 0x538252); px(0, 0, 1, h, tone(0x538252, 0.08)); px(w - 1, 0, 1, h, tone(0x538252, -0.1)); px(0, 0, w, Math.max(2, Math.round(0.12 * p2)), 0xd6d0c9); }), top: 0x538252, sides: 0x37664f } }); }
    return {
      figures: [{ x: -6.6, z: 12.4, dress: 'utilities', facing: 'up', seed: 4 }, { x: -13.4, z: 10.6, dress: 'utilities', seed: 6 }, { x: 5.6, z: 9.2, dress: 'suit', seed: 7 }],
      fog: (m) => m !== 'day', fogShape: { cone: 1.15, reachM: 22, nearM: 3.5 },
      weather: (m, t) => {
        const d = m === 'heavy' ? dustOf(6) : m === 'storm' ? dustOf(4) : dustOf(0.5);
        return { haze: d.haze, hazeColour: m === 'day' ? 0xdba382 : 0xb07656, farM: d.farM, eye: [-6.6, 12.4], dust: d.dust, drift: m === 'heavy' ? 0.85 : m === 'storm' ? 0.6 : 0.08, wind: [-1, 0.15], slant: 0.12, dustColour: 0xc18064, timeS: t };
      },
    };
  },
};
