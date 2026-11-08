// OLYMPUS render: the hands of the area's clocks, drawn from places' wallClockAt, so they agree with the watch.
//
// A wall clock (src/art/kit/structure.js wallClock) is built into the area's batch with a blank dial,
// and the area job reports each dial as the builder snapped it (its box, which side it faces). Here
// every dial of the live area gets a quad a millimetre proud of it, all of them one mesh and one draw,
// reading a small atlas of HANDS_CELLS cells (one an s × s dial: structure.js dialPx, 9 px at both
// densities, bigger than life at 16 px/m so the two hands read). Each frame
// the clocks ask places' wallClockAt(fixture, ms, where) (src/sim/places/clocks.js, the watch's own
// helper: env.js timeAt on the live site's clock, the sol at Melas, UTC on a ship; ROADMAP
// "anywhere"'s step 3), and a dial whose hour or minute changed has its cell repainted
// (structure.js paintHands: the hands as whole pixels, the rest a hole) and the atlas sent again (a few
// kilobytes, once a game minute). Through the timeslip the Melas face reads 24:00 with its hands at 12
// (wallClockAt's slip). The hands are lit as the wall they hang on (the patched toon material: the room's
// fill and the pools), write no part of their own (so no outline inks a nine-pixel face) and are seen
// through like the wall when the figure stands behind them.
// stats: [{ id, faces: [{ hour, minute, slip }] }], the faces as last drawn.
import * as THREE from 'three';
import * as CLOCKS from '../sim/places/clocks.js';
import { olyMaterial, RAMP } from './materials.js';
import { paintHands, dialPx } from '../art/kit/structure.js';
import { paint } from '../art/paint.js';

/** Dials the atlas holds (a live area's clocks: Echo's floor has a clock a bay and the duty desk's two). */
export const HANDS_CELLS = 64;
const COLS = 8;

// (a clock's faces: places' wallClockAt on the live site's clock, or on Mars's at a longitude where no site is live)
const facesOf = (fx, ms, where) => CLOCKS.wallClockAt(fx, ms, where).faces;

/** The clocks of the live area: { group, setClocks(list, ppm), frame(state, lonEDeg), stats, dispose() }. */
export function createClocks() {
  let s = 5, data = null, tex = null, mesh = null, list = [], shown = [];
  const group = new THREE.Group();
  group.name = 'clocks';
  // (made with a map from the start, so the program warmed at boot is the one the hands draw with)
  const blank = new THREE.DataTexture(new Uint8Array(4), 1, 1); blank.needsUpdate = true;
  const material = olyMaterial(new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: RAMP, alphaTest: 0.5, map: blank }), { noId: true, see: true });
  material.transparent = true; material.depthWrite = false;

  /** The live area's clocks: [{ id, fixture, dials: [{ which, box, nx, nz }] }] (the area job's meta.clocks). */
  function setClocks(clocks, ppm) {
    if (mesh) { mesh.geometry.dispose(); mesh.removeFromParent(); mesh = null; }
    list = []; shown = [];
    s = dialPx(ppm);
    const W = COLS * s, H = Math.ceil(HANDS_CELLS / COLS) * s;
    if (!tex || tex.image.width !== W) {
      tex?.dispose();
      data = new Uint8Array(W * H * 4);
      tex = new THREE.DataTexture(data, W, H);
      tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.colorSpace = THREE.SRGBColorSpace; tex.flipY = false;
      material.map = tex; material.needsUpdate = true;
    }
    data.fill(0);
    const pos = [], uv = [], nor = [], idx = [];
    let cell = 0;
    for (const c of clocks ?? []) {
      const faces = [];
      for (const d of c.dials ?? []) {
        if (cell >= HANDS_CELLS) break;
        const b = d.box, [nx, nz] = d.n ?? [0, d.which === 'back' ? -1 : 1], e = 0.002;
        // (the quad on the dial's outward face, its texel (0, 0) at the top-left as seen from outside)
        let corners;
        if (nz > 0) corners = [[b.x0, b.y1, b.z1 + e], [b.x1, b.y1, b.z1 + e], [b.x1, b.y0, b.z1 + e], [b.x0, b.y0, b.z1 + e]];
        else if (nz < 0) corners = [[b.x1, b.y1, b.z0 - e], [b.x0, b.y1, b.z0 - e], [b.x0, b.y0, b.z0 - e], [b.x1, b.y0, b.z0 - e]];
        else if (nx > 0) corners = [[b.x1 + e, b.y1, b.z1], [b.x1 + e, b.y1, b.z0], [b.x1 + e, b.y0, b.z0], [b.x1 + e, b.y0, b.z1]];
        else corners = [[b.x0 - e, b.y1, b.z0], [b.x0 - e, b.y1, b.z1], [b.x0 - e, b.y0, b.z1], [b.x0 - e, b.y0, b.z0]];
        const v0 = pos.length / 3, cx = (cell % COLS) * s, cy = Math.floor(cell / COLS) * s;
        for (const p of corners) pos.push(...p);
        for (const [u, v] of [[0, 0], [1, 0], [1, 1], [0, 1]]) uv.push((cx + u * s) / W, (cy + v * s) / H);
        for (let k = 0; k < 4; k++) nor.push(nx, 0, nz || (nx ? 0 : 1));
        idx.push(v0, v0 + 3, v0 + 2, v0, v0 + 2, v0 + 1);
        faces.push({ which: d.which, cell, hour: -1, minute: -1 });
        cell++;
      }
      list.push({ id: c.id, fixture: c.fixture ?? { id: c.id, faces: c.faces ?? ['melas'] }, faces });
    }
    if (!pos.length) return;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    mesh = new THREE.Mesh(g, material);
    mesh.name = 'clock-hands'; mesh.renderOrder = 1; mesh.castShadow = false; mesh.receiveShadow = false;
    mesh.userData.noId = true;
    group.add(mesh);
  }

  /** Each frame: the faces now; a dial whose time moved repainted. Returns the faces (stats). */
  function frame(state, lonEDeg = 0) {
    if (!list.length || !state) return shown;
    const ms = state.clock.ms, where = state.places?.live?.site ?? lonEDeg;
    let dirty = false;
    shown = list.map(c => {
      const faces = facesOf(c.fixture, ms, where);
      c.faces.forEach((f, i) => {
        const t = faces[i] ?? faces[0];
        if (!t || (t.hour === f.hour && t.minute === f.minute && !!t.slip === !!f.slip)) return;
        f.hour = t.hour; f.minute = t.minute; f.slip = !!t.slip;
        const W = COLS * s, cx = (f.cell % COLS) * s, cy = Math.floor(f.cell / COLS) * s;
        const pm = paint(s, s, (px) => paintHands(px, 0, 0, s, t.hourDeg, t.minuteDeg));
        for (let j = 0; j < s; j++) data.set(new Uint8Array(pm.data.buffer, j * s * 4, s * 4), ((cy + j) * W + cx) * 4);
        dirty = true;
      });
      return { id: c.id, faces: c.faces.map((f, i) => ({ face: (faces[i] ?? faces[0])?.face ?? null, hour: f.hour, minute: f.minute, slip: f.slip })) };
    });
    if (dirty) tex.needsUpdate = true;
    return shown;
  }

  return {
    group, setClocks, frame, material,
    get stats() { return shown; },
    dispose() { mesh?.geometry.dispose(); tex?.dispose(); material.dispose(); group.removeFromParent(); },
  };
}
