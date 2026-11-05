// OLYMPUS render: upright cards, the way a sprite stands in the 3D stage.
//
// A person, a tree, a small prop drawn as pixel art is a card: an upright plane facing the camera
// (+z), its painting mapped one texel a screen pixel (a card h metres tall shows h · PX_PER_M pixels,
// as a wall does), its foot on the ground at (x, z), its left edge on the pixel grid. Sprites are
// shaded in their drawing (light from the upper left), so the card is not lit by the scene: it is
// tinted by the light where it stands (tradecraft's crowd: aTint from lightAt(), the same number the
// dice read), its holes alpha-tested away. It writes its part ID like every stage material (one part
// for all people by default, PEOPLE_PART, as tradecraft's crowd did, "so a building's sill drew a line
// through heads" no longer), and a card in front of the figure the stage sees through to is dithered.
// A blob of shadow lies under it (an ink ellipse, 0.4 opaque, no part), not a sun shadow: tradecraft
// PIPELINE 2026-10-25, "sun shadows under people read as smears: use a blob".
// This is the single-card form for props and the stage sample's figure; a crowd is one instanced
// draw of the same idea (tradecraft's src/render/crowd.js, to be ported with the sprites), and its
// shaders take FRAG_DECL and olySee() from src/render/materials.js the same way this one does.
import * as THREE from 'three';
import { PX_PER_M } from './scale.js';
import { FRAG_DECL, SHARED, olyMaterial } from './materials.js';
import { toTexture } from './textures.js';

/** The part number every person's card shares (outlines between people come from depth, and their own ink). */
export const PEOPLE_PART = 0xa5a5a5;
const INK = 0x14151c;

/**
 * A card for a painting (Pixmap) at (x, z): { group, card, blob, place(x, z), setTint([r, g, b]), dispose }.
 * opts: part (PEOPLE_PART), blob (true), see (dithered in front of the figure: true), ox (the painting's
 * column over the foot; its middle by default), ppm.
 */
export function createCard(pm, { x = 0, z = 0, part = PEOPLE_PART, blob = true, see = true, ox = null, ppm = PX_PER_M } = {}) {
  const tex = toTexture(pm, { flipY: false });
  const w = pm.w / ppm, h = pm.h / ppm, foot = ox ?? Math.floor(pm.w / 2);
  const geo = new THREE.PlaneGeometry(w, h);
  geo.translate(w / 2 - foot / ppm, h / 2, 0);                      // (the foot column over the origin, the bottom on the ground)
  geo.setAttribute('aPart', new THREE.Float32BufferAttribute(new Float32Array(4).fill(part), 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { ...SHARED, map: { value: tex }, tint: { value: new THREE.Vector3(1, 1, 1) }, size: { value: new THREE.Vector2(pm.w, pm.h) } },
    defines: see ? { OLY_SEE: '' } : {},
    vertexShader: /* glsl */`
      attribute float aPart;
      flat varying float vOlyPart;
      varying vec3 vOlyWorld;
      varying vec2 vPx;
      uniform vec2 size;
      void main() {
        vOlyPart = aPart;
        vOlyWorld = (modelMatrix * vec4(position, 1.0)).xyz;
        vPx = vec2(uv.x, 1.0 - uv.y) * size;                         // (in the painting's pixels, row 0 at its top)
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */`
      ${FRAG_DECL}
      uniform sampler2D map; uniform vec3 tint; uniform vec2 size;
      varying vec2 vPx;
      void main() {
        #ifdef OLY_SEE
          olySee(vOlyWorld);
        #endif
        vec4 c = texture2D(map, (floor(vPx) + 0.5) / size);
        if (c.a < 0.5) discard;
        gl_FragColor = vec4(c.rgb * tint, 1.0);
        pc_fragId = olyId(vOlyPart, olyFlag);
      }`,
  });
  material.userData.oly = { card: true };
  const card = new THREE.Mesh(geo, material);
  card.userData.part = part;
  card.castShadow = false; card.receiveShadow = false;
  const group = new THREE.Group();
  group.add(card);
  let shadow = null;
  if (blob) {
    const bm = olyMaterial(new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: 0.4, depthWrite: false }), { noId: true, see: false });
    shadow = new THREE.Mesh(new THREE.CircleGeometry(Math.max(0.3, w * 0.42), 20).rotateX(-Math.PI / 2).scale(1, 1, 0.6), bm);
    shadow.position.y = 0.01;
    shadow.renderOrder = 1;
    group.add(shadow);
  }
  const snap = (v) => Math.round(v * ppm) / ppm;
  function place(x2, z2) { card.position.set(snap(x2), 0, snap(z2)); shadow?.position.set(snap(x2), 0.01, snap(z2)); }
  place(x, z);
  function dispose() { geo.dispose(); material.dispose(); tex.dispose(); if (shadow) { shadow.geometry.dispose(); shadow.material.dispose(); } group.removeFromParent(); }
  group.userData.dispose = dispose;                                  // (an area frees it so: src/render/batch.js)
  return {
    group, card, blob: shadow, texture: tex, place, dispose,
    setTint: (t) => material.uniforms.tint.value.set(t[0], t[1], t[2]),
    get x() { return card.position.x; }, get z() { return card.position.z; }, heightM: h, widthM: w,
  };
}
