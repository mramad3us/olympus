// OLYMPUS render: the splash's vignettes on the stage. What each activity shows round its fixture, as cards.
//
// VIEWS §5.2 and the build sheet 0.0.4 §2.3 (b): the vignette is part of the stage, props and effects at
// its density seen at zoom 3, chosen by the splash's vignette and the activity's part at the time shown.
// vignetteItems() decides what stands where (src/render/vignette-items.js, pure: the tests read it),
// createVignettes(stage) draws it:
//   - shower (a stall): the bather stands in the stall facing its head (the view draws them there while
//     the activity's part says inside, the dress part too, the stall's front cut down while the iris is
//     closed), the steam between them and the camera from the shins to the
//     shoulders, so the wet hair shows above it and the feet below and the body is never drawn (VIEWS
//     §3.4), the steam rising over the partitions, the water falling from the head and the timer's lamp lit
//     while the water part runs, the towel over the partition until the dress part, then a thinner
//     cloud behind you while you dry and dress;
//   - sink: the tap running into the basin (the figure's own frames brush, shave and lean at it: poses.js);
//   - head (a urinal): your back at it, the figure's own frame; nothing more;
//   - stall (a toilet stall): the figure hidden inside, a pair of boots under the door and the OCCUPIED
//     slide red on it (the partitions hide the stall's inside from the camera, so its door is what shows;
//     a stall whose door faces east or west, edge-on, shows them on its south side instead);
//   - rack: the sleeper's own drawing (the berth: breathing, the curtain closing, src/art/figures/bedding.js)
//     and dressing at the foot in the turn-in (the figure's frames); nothing more here;
//   - locker: the locker open behind you while you dress;
//   - standby: the light changing (the view's light at the time shown); nothing more.
// And outside a splash, the alert's beacon in hall-2 while a drill is open (alertNow: lit while hornOn).
// Variety (the steam's pattern) comes from the vignette's seed, a hash of the activity and its sol
// (VIEWS §5.2), never the sim's dice; the animations (steam rising, water falling) run on the view's own
// real-time clock, since a fall of water drawn at the time-lapse's speed would be noise (my call).
// Every card dissolves by its fade (an ordered dither, the item's fade: the iris's inkK), so the
// pieces come and go with the zoom, never at zoom 1. The cards: two instanced draws from one small atlas the pieces are painted into the first time they
// are needed (src/art/kit/vignette.js), upright like the figures' cards and lit by the light where they
// stand: solid pieces write their own part (an outline round them), mist (steam, water) writes no part and
// no depth, so a cloud has no ink round it and what is behind it still outlines through it.
import { PX_PER_M } from './scale.js';
import { FRAG_DECL } from './materials.js';
import { piece } from '../art/kit/vignette.js';

export { vignetteItems, insideSpot, fixturePoint, faceToward, vignetteSeed, STEAM_FRONT_M, STEAM_COVER_M, STEAM_FPS, WATER_FPS, TAP_FPS, BEACON_Y_M } from './vignette-items.js';
/** The vignettes' atlas (texels square), the most cards a frame, and the part the solid ones write. */
export const VIG_ATLAS_PX = 1024, MAX_VIG_CARDS = 32, VIGNETTE_PART = 0xa5a5a7;

/**
 * The vignettes on a stage: { group, update(items, tintOf, red), stats, dispose }. items as vignetteItems()
 * gives them; tintOf(x, z) the light a card takes where it stands; red (0..1) the alert's beat, tinting
 * them as the beacon's light comes through.
 */
export function createVignettes(stage, { ppm = stage.ppm ?? PX_PER_M } = {}) {
  const THREE = stage.THREE, renderer = stage.renderer;
  const atlas = new THREE.DataTexture(null, VIG_ATLAS_PX, VIG_ATLAS_PX);
  atlas.magFilter = atlas.minFilter = THREE.NearestFilter; atlas.generateMipmaps = false; atlas.colorSpace = THREE.SRGBColorSpace; atlas.flipY = false;
  atlas.source.dataReady = false; atlas.needsUpdate = true;
  const cells = new Map();                                          // piece key → { x, y, w, h }
  let shelfX = 0, shelfY = 0, shelfH = 0;
  const stats = { cards: 0, mist: 0, painted: 0, full: 0 };
  const at = new THREE.Vector2();
  function cellOf(pm) {
    let c = cells.get(pm.key);
    if (c) return c;
    if (shelfX + pm.w > VIG_ATLAS_PX) { shelfX = 0; shelfY += shelfH; shelfH = 0; }
    if (shelfY + pm.h > VIG_ATLAS_PX) { stats.full++; cells.clear(); shelfX = 0; shelfY = 0; shelfH = 0; }   // (full: start again; a splash needs a few dozen)
    c = { x: shelfX, y: shelfY, w: pm.w, h: pm.h };
    shelfX += pm.w; shelfH = Math.max(shelfH, pm.h);
    const src = new THREE.DataTexture(new Uint8Array(pm.data.buffer), pm.w, pm.h);
    src.flipY = false;
    renderer.copyTextureToTexture(src, atlas, null, at.set(c.x, c.y));
    src.dispose();
    cells.set(pm.key, c);
    stats.painted++;
    return c;
  }
  const make = (mist) => {
    const geo = new THREE.PlaneGeometry(1, 1).translate(0.5, 0.5, 0);
    const aRect = new THREE.InstancedBufferAttribute(new Float32Array(MAX_VIG_CARDS * 4), 4), aTint = new THREE.InstancedBufferAttribute(new Float32Array(MAX_VIG_CARDS * 3), 3);
    const aFade = new THREE.InstancedBufferAttribute(new Float32Array(MAX_VIG_CARDS).fill(1), 1);
    geo.setAttribute('aRect', aRect); geo.setAttribute('aTint', aTint); geo.setAttribute('aFade', aFade);
    const material = new THREE.ShaderMaterial({
      uniforms: { atlas: { value: atlas }, size: { value: VIG_ATLAS_PX }, part: { value: mist ? 0 : VIGNETTE_PART } },
      transparent: mist, depthWrite: !mist,
      vertexShader: /* glsl */`
        attribute vec4 aRect; attribute vec3 aTint; attribute float aFade;
        varying vec2 vPx; varying vec3 vTint; varying vec3 vOlyWorld; flat varying float vOlyPart; varying float vFade;
        uniform float part;
        void main() {
          vPx = aRect.xy + vec2(uv.x, 1.0 - uv.y) * aRect.zw;
          vTint = aTint; vOlyPart = part; vFade = aFade;
          vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
          vOlyWorld = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
        }`,
      fragmentShader: /* glsl */`
        ${FRAG_DECL}
        uniform sampler2D atlas; uniform float size;
        varying vec2 vPx; varying vec3 vTint; varying float vFade;
        void main() {
          if (vFade < 1.0 && olyBayer() >= vFade) discard;             // (the fade: dissolved in and out with the iris)
          vec4 c = texture2D(atlas, (floor(vPx) + 0.5) / size);
          float a = floor(c.a * 255.0 + 0.5);
          if (a < 128.0) discard;
          gl_FragColor = vec4(a < 248.0 || a > 254.5 ? c.rgb * vTint : c.rgb, 1.0);
          pc_fragId = ${mist ? 'vec4(0.0)' : 'olyId(vOlyPart, olyFlag)'};
        }`,
    });
    material.userData.oly = { card: true, vignette: true };
    const mesh = new THREE.InstancedMesh(geo, material, MAX_VIG_CARDS);
    mesh.frustumCulled = false; mesh.count = 0; mesh.renderOrder = mist ? 3 : 0;
    mesh.userData.part = mist ? 0 : VIGNETTE_PART;
    if (mist) mesh.userData.noId = true;
    return { mesh, geo, material, aRect, aTint, aFade };
  };
  const solid = make(false), mist = make(true);
  const group = new THREE.Group();
  group.name = 'vignettes';
  group.add(solid.mesh, mist.mesh);
  const m4 = new THREE.Matrix4(), snap = (v) => Math.round(v * ppm) / ppm;

  /** Draw these items (see the header); none: nothing. */
  function update(items = [], tintOf = null, red = 0) {
    let ns = 0, nm = 0;
    for (const it of items) {
      const pm = piece(it.name, it.opts, ppm), c = cellOf(pm), B = pm.mist ? mist : solid, i = pm.mist ? nm : ns;
      if (i >= MAX_VIG_CARDS) continue;
      // (upright at its foot's depth, its left edge on the pixel grid, its bottom at y: on screen a row is where the ground at z − y is)
      m4.makeScale(pm.w / ppm, pm.h / ppm, 1).setPosition(snap(it.x - pm.w / ppm / 2), snap(it.y), snap(it.z));
      B.mesh.setMatrixAt(i, m4);
      B.aRect.setXYZW(i, c.x, c.y, c.w, c.h);
      // (lit by the light where it stands; mist by that light's strength only, not its colour, so steam stays white under a warm lamp)
      let t = tintOf ? tintOf(it.x, it.z) : [1, 1, 1];
      if (pm.mist) { const l = 0.30 * t[0] + 0.59 * t[1] + 0.11 * t[2]; t = [l, l, l]; }
      B.aTint.setXYZ(i, t[0] * (1 + 0.9 * red), t[1] * (1 - 0.55 * red), t[2] * (1 - 0.6 * red));
      B.aFade.setX(i, Number.isFinite(it.fade) ? it.fade : 1);
      if (pm.mist) nm++; else ns++;
    }
    for (const [B, n] of [[solid, ns], [mist, nm]]) {
      B.mesh.count = n;
      if (!n) continue;
      for (const a of [B.mesh.instanceMatrix, B.aRect, B.aTint, B.aFade]) { a.clearUpdateRanges(); a.addUpdateRange(0, n * a.itemSize); a.needsUpdate = true; }
    }
    stats.cards = ns + nm; stats.mist = nm;
    return ns + nm;
  }
  function dispose() {
    for (const B of [solid, mist]) { B.geo.dispose(); B.material.dispose(); }
    atlas.dispose(); group.removeFromParent();
  }
  return { group, update, stats, dispose, atlas, materials: [solid.material, mist.material] };
}
