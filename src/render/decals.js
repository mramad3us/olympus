// OLYMPUS render: things lying about. A dropped magazine, a round, a dummy, as pixels on the ground, in one instanced draw.
//
// TECH §12.3's home of tradecraft's src/render/items.js (95 lines, v0.2.0-rc3; VIEWS §2.12's decals):
// each kind a little template of pixels (SHAPES), drawn bigger than life the way pixel art draws a key or
// a knife on the ground, so it reads at PX_PER_M (a magazine 5 px long at 16 px/m, VIEWS §2.12's "4 px
// at A" with its baseplate), every one with an ink outline so it stands off the regolith; it lies along x
// or along z and either way round by a hash of its id, the same every frame and after a load. What
// changed from tradecraft: the kinds are the range's (the HAD-30 magazine, a live round, the orange
// dummy, a spent case); the pixels are lit by the light where they lie (aTint, the figures' rule: the
// same number the eye reads), not drawn unlit; and the instanced quads are the stage's (createPixels():
// the MRT's part ID, none here, so the outline pass inks round the lot as one shape), shared with the
// range's holes, flag and brass (src/render/range.js). Redrawn only when what lies changes.
// 0.0.7 (the build sheet 0.0.7 §2.4 (d)): blood. createBlood() draws the body role's bloodLook (src/sim/body/blood.js:
// the site's spatters and drips, the marks on each casualty) through src/render/blood.js's pixels (tradecraft's
// render/blood.js ported): the ground's flat, in one instanced draw redrawn when the list or the game minute changes
// (it darkens as it dries), the marks over the figures they are on, every frame (a casualty may be moved).
import { PX_PER_M } from './scale.js';
import { FRAG_DECL } from './materials.js';
import { decalPixels } from './range-items.js';
import { bloodPixels, markPixels, MAX_BLOOD_PIXELS } from './blood.js';
export { decalPixels, SHAPES } from './range-items.js';

/** The part IDs' flag (their alpha) a pixel of light writes (0.0.9: a bang's flash): the post pass draws it with no line and never dims it as unseen (post.js). */
export const LIGHT_FLAG = 0.9;
/** The most pixels the things lying take (a magazine is about 25 with its outline). */
export const MAX_DECAL_PIXELS = 1200;
/**
 * Instanced pixel quads on a stage: { mesh, set(i, { x, y, z, flat, color, tint, part }), count(n), dispose }.
 * A quad is 1/ppm square, upright facing the camera or lying flat (flat: true), its colour times the tint
 * (the light where it is), writing its part (0: none, so it is outlined with what it lies on).
 */
export function createPixels(THREE, max, { ppm = PX_PER_M, order = 1 } = {}) {
  const P = 1 / ppm, geo = new THREE.PlaneGeometry(P, P);
  // (aPart: the part a pixel writes; negative, none and no line round it, as the see-through dither's kept pixels)
  const aColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3), aTint = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3), aPart = new THREE.InstancedBufferAttribute(new Float32Array(max), 1);
  geo.setAttribute('aColor', aColor); geo.setAttribute('aTint', aTint); geo.setAttribute('aPart', aPart);
  const material = new THREE.ShaderMaterial({
    vertexShader: /* glsl */`
      attribute vec3 aColor; attribute vec3 aTint; attribute float aPart;
      varying vec3 vColor; varying vec3 vOlyWorld; flat varying float vOlyPart;
      void main() {
        vColor = aColor * aTint; vOlyPart = aPart;
        vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
        vOlyWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      ${FRAG_DECL}
      varying vec3 vColor;
      void main() { gl_FragColor = vec4(vColor, 1.0); pc_fragId = vOlyPart > 0.5 ? olyId(vOlyPart, olyFlag) : vOlyPart < -1.5 ? olyId(0.0, ${LIGHT_FLAG.toFixed(2)}) : vOlyPart < -0.5 ? olyId(0.0, 0.5) : vec4(0.0); }`,
  });
  material.userData.oly = { pixels: true };
  const mesh = new THREE.InstancedMesh(geo, material, max);
  mesh.frustumCulled = false; mesh.count = 0; mesh.renderOrder = order;
  const m4 = new THREE.Matrix4(), flatQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2), upQ = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1), pos = new THREE.Vector3();
  const rgb = (c) => [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255];
  return {
    mesh, max,
    /**
     * Pixel i: its centre (x, y, z, metres), flat on the ground or upright, its colour (0xrrggbb), the light's tint, its part (noLine:
     * none, and no line round it; light (0.0.9): light itself, a bang's flash: no line, and the fog of awareness never dims it, LIGHT_FLAG).
     */
    set(i, { x, y = 0, z, flat = false, color, tint = [1, 1, 1], part = 0, noLine = false, light = false }) {
      if (i >= max) return false;
      m4.compose(pos.set(x, y, z), flat ? flatQ : upQ, one);
      mesh.setMatrixAt(i, m4);
      const [r, g, b] = rgb(color);
      aColor.setXYZ(i, r, g, b); aTint.setXYZ(i, tint[0], tint[1], tint[2]); aPart.setX(i, light ? -2 : noLine ? -1 : part);
      return true;
    },
    count(n) {
      mesh.count = Math.min(n, max);
      for (const a of [mesh.instanceMatrix, aColor, aTint, aPart]) { a.clearUpdateRanges(); a.addUpdateRange(0, Math.max(1, mesh.count) * a.itemSize); a.needsUpdate = true; }
    },
    dispose() { geo.dispose(); material.dispose(); mesh.removeFromParent(); },
  };
}

/**
 * Things lying on a stage: { group, update(list, tintOf), stats, dispose }. list: [{ id, kind ('mag' |
 * 'round' | 'dummy' | 'case'), x, z }] (the arms role's rangeLook().lying, kitLook's dropped kit), redrawn
 * only when it changes; tintOf(x, z) the light there.
 */
export function createDecals(stage, { ppm = stage.ppm ?? PX_PER_M } = {}) {
  const THREE = stage.THREE, px = createPixels(THREE, MAX_DECAL_PIXELS, { ppm, order: 1 });
  const group = new THREE.Group();
  group.name = 'decals';
  group.add(px.mesh);
  const stats = { items: 0, pixels: 0, redrawn: 0 };
  let key = '', lastTint = '';
  function update(list = [], tintOf = null) {
    const k = list.map(it => `${it.id}:${it.kind}:${it.x},${it.z}`).join('|');
    // (redrawn when what lies changes, or the light on it does by a percent: the hour, a lamp)
    const t0 = tintOf && list.length ? tintOf(list[0].x, list[0].z).map(v => Math.round(v * 100)).join() : '';
    if (k === key && t0 === lastTint) return stats;
    key = k; lastTint = t0;
    let n = 0;
    for (const it of list) {
      const t = tintOf ? tintOf(it.x, it.z) : [1, 1, 1];
      for (const p of decalPixels(it, ppm)) if (px.set(n, { x: p.x, y: 0.012, z: p.z, flat: true, color: p.c, tint: t })) n++;
    }
    px.count(n);
    stats.items = list.length; stats.pixels = n; stats.redrawn++;
    return stats;
  }
  return { group, update, stats, pixels: px, dispose() { px.dispose(); group.removeFromParent(); } };
}

/**
 * Blood on a stage (see the header): { group, update(look, { ms, figures, tintOf }), stats, dispose }. look: bloodLook's
 * { decals, marks } or null; figures: the view's drawn people ({ id, x, z, face, lie, kneel }) the marks follow.
 */
export function createBlood(stage, { ppm = stage.ppm ?? PX_PER_M } = {}) {
  const THREE = stage.THREE, ground = createPixels(THREE, MAX_BLOOD_PIXELS, { ppm, order: 1 }), marks = createPixels(THREE, 120, { ppm, order: 3 });
  marks.mesh.material.transparent = true; marks.mesh.material.depthWrite = false;
  const group = new THREE.Group();
  group.name = 'blood';
  group.add(ground.mesh, marks.mesh);
  const stats = { decals: 0, pixels: 0, marks: 0, redrawn: 0 };
  let key = '';
  function update(look, { ms = 0, figures = [], tintOf = null } = {}) {
    const decals = look?.decals ?? [];
    let total = 0;
    for (const d of decals) total += d.n;                            // (a pool grows its n: the body's)
    const k = `${decals.length}:${total}:${decals.at(-1)?.seed ?? 0}:${decals[0]?.seed ?? 0}:${Math.floor(ms / 60000)}`;
    if (k !== key) {
      key = k;
      let n = 0;
      const t0 = decals.length && tintOf ? tintOf(decals[0].x, decals[0].z) : [1, 1, 1];
      for (const p of bloodPixels(decals, ms, ppm)) if (ground.set(n, { x: p.x, y: p.y, z: p.z, flat: true, color: p.c, tint: t0 })) n++;
      ground.count(n);
      stats.decals = decals.length; stats.pixels = n; stats.redrawn++;
    }
    let m = 0;
    const byId = look?.marks ?? {};
    for (const f of figures) {
      const list = byId[f.id];
      if (!list?.length) continue;
      for (const p of markPixels(f, list, ms, ppm)) if (marks.set(m, { x: p.x, y: p.y, z: p.z, color: p.c, tint: tintOf ? tintOf(f.x, f.z) : [1, 1, 1], part: 0, noLine: true })) m++;
    }
    marks.count(m);
    stats.marks = m;
    return stats;
  }
  return { group, update, stats, pixels: ground, marks, dispose() { ground.dispose(); marks.dispose(); group.removeFromParent(); } };
}
