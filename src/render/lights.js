// OLYMPUS render: the light rig. A sky fill, a sun, and ten lamp-pool slots, fed by a mood.
//
// What the stage is lit by never changes in kind, only in numbers, so no shader is rebuilt mid-play
// (three compiles a program per count of lights):
//   - a hemisphere light, the sky's fill (sky colour above, the ground's bounce below);
//   - a directional "sun" from the upper left, a little in front (tradecraft's: sprites are shaded that
//     way, so it never swings round), casting hard pixel shadows (BasicShadowMap). Its height follows the
//     sun's (setElevation(deg): places' sunAt, VIEWS §2.7: "Height, colour and strength move"), in whole
//     degrees from SUN_MIN_ELEV_DEG (a lower sun's shadows would outrun the shadow camera), so the shadow
//     map is redrawn once a degree and not every frame of a dawn; its azimuth on screen never moves. It follows the camera
//     in steps of SHADOW_STEP (an even number of shadow texels, about 2 m), its frustum a step wider, so
//     a shadow texel covers the same ground on the same grid wherever it stands: shadows never shimmer
//     and the map is redrawn only when the step changes or the area does (tradecraft view.js: the
//     shadow pass had been two thirds of its draw calls);
//   - LAMP_SLOTS (10) pairs of spotlights with no falloff, a core of radius r and a ring to 1.5 r,
//     moved each frame to the lit lamps nearest the camera (tradecraft's lamp slots: "so the scene's
//     light count never changes"). A pool is two cones of even light with hard edges, "as pixel art
//     draws a pool of light, not a smooth falloff the palette would band".
// Lamps are the area's data: { x, z, y = LAMP_Y_M, r = 2, color, core = 0.5, ring = 0.2, kind }, kind
// 'ceiling', 'emergency' or 'desk'; the mood says how strongly each kind shines (src/render/moods.js).
// lightAt() gives a sprite the same light the scene puts where it stands.
import * as THREE from 'three';
import { moodOf, pickLamps, lampColour, lightAt as lightAtOf } from './moods.js';

export const LAMP_SLOTS = 10;
/** A ceiling lamp's height (tradecraft's LAMP_Y: under a 2.8 m ceiling). */
export const LAMP_Y_M = 2.7;
export const SHADOW_MAP_PX = 2048, SHADOW_HALF_M = 26, SUN_BACK_M = 90, SHADOW_FAR_M = 220;
/** The sun's direction of travel: from the upper left, a little in front (tradecraft's (−8, 15, 5) toward the target). */
export const SUN_DIR = Object.freeze([8, -15, -5]);
/** The art's sun height (tradecraft's direction: 57.8°), and the lowest the key light's direction goes (degrees). */
export const SUN_ART_ELEV_DEG = 57.8, SUN_MIN_ELEV_DEG = 10;

export function createLights(scene) {
  const hemi = new THREE.HemisphereLight(0xdde6ff, 0x9a8a78, 0.6 * Math.PI);
  const sun = new THREE.DirectionalLight(0xfff2dc, 0.79 * Math.PI);
  sun.castShadow = true;
  sun.shadow.mapSize.set(SHADOW_MAP_PX, SHADOW_MAP_PX);
  Object.assign(sun.shadow.camera, { left: -SHADOW_HALF_M, right: SHADOW_HALF_M, top: SHADOW_HALF_M, bottom: -SHADOW_HALF_M, near: 1, far: SHADOW_FAR_M });
  sun.shadow.bias = -0.0008;
  scene.add(hemi, sun, sun.target);

  // The shadow camera's basis and step (see the header), remade when the sun's height changes.
  const dir = new THREE.Vector3(...SUN_DIR).normalize();
  const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
  const up = new THREE.Vector3().crossVectors(right, dir).normalize();
  const flat = new THREE.Vector2(SUN_DIR[0], SUN_DIR[2]).normalize();
  let elevDeg = SUN_ART_ELEV_DEG;
  /** The key light's height (degrees, from places' sunAt), in whole degrees from SUN_MIN_ELEV_DEG; true when it moved (the shadows redrawn). */
  function setElevation(deg) {
    const e = Math.max(SUN_MIN_ELEV_DEG, Math.min(85, Math.round(deg)));
    if (e === elevDeg) return false;
    elevDeg = e;
    const r = e * Math.PI / 180;
    dir.set(flat.x * Math.cos(r), -Math.sin(r), flat.y * Math.cos(r)).normalize();
    right.crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
    up.crossVectors(right, dir).normalize();
    su = null; sv = null;
    return true;
  }
  const sc = sun.shadow.camera, texel = (sc.right - sc.left) / sun.shadow.mapSize.x;
  const SHADOW_STEP = 2 * Math.round(1 / texel) * texel;
  { const h = sc.right + SHADOW_STEP / 2, n = Math.round(2 * h / texel); Object.assign(sc, { left: -h, right: h, top: h, bottom: -h }); sc.updateProjectionMatrix(); sun.shadow.mapSize.set(n, n); }

  const slots = Array.from({ length: LAMP_SLOTS }, () => [0, 1].map(() => {
    const spot = new THREE.SpotLight(0xffffff, 0, 0, Math.PI / 4, 0, 0);
    scene.add(spot, spot.target);
    return spot;
  }));

  let mood = moodOf('day'), lamps = [], su = null, sv = null;
  const aim = new THREE.Vector3(), col = new THREE.Color();

  /** Copy a mood's numbers into the lights. */
  function apply(m) {
    mood = moodOf(m);
    hemi.color.setHex(mood.sky); hemi.groundColor.setHex(mood.ground); hemi.intensity = mood.skyK * Math.PI;
    sun.color.setHex(mood.sun); sun.intensity = mood.sunK * Math.PI;
    sun.shadow.intensity = mood.shadow;
    return mood;
  }
  /** The area's lamps (data, see the header). */
  function setLamps(list) { lamps = list ?? []; }

  /** Each frame: the slots to the lit lamps nearest (x, z); the sun to its step. Returns true when the shadow map must be redrawn. */
  function update(x, z) {
    const near = pickLamps(lamps, x, z, mood, LAMP_SLOTS);
    slots.forEach((pair, i) => {
      const p = near[i];
      pair.forEach((spot, k) => {
        if (!p) { spot.intensity = 0; return; }
        const l = p.lamp, y = l.y ?? LAMP_Y_M, r = (l.r ?? 2) * (k ? 1.5 : 1);
        spot.intensity = (k ? l.ring ?? 0.2 : l.core ?? 0.5) * Math.PI * p.k;
        spot.color.copy(col.setHex(lampColour(mood, l)));
        spot.angle = Math.min(1.5, Math.atan(r / Math.max(0.1, y - (l.floorY ?? 0))));
        spot.position.set(l.x, y, l.z); spot.target.position.set(l.x, 0, l.z);
      });
    });
    aim.set(x, 0, z);
    const u = Math.round(aim.dot(right) / SHADOW_STEP) * SHADOW_STEP, v = Math.round(aim.dot(up) / SHADOW_STEP) * SHADOW_STEP, w = aim.dot(dir);
    const moved = u !== su || v !== sv;
    su = u; sv = v;
    aim.copy(right).multiplyScalar(u).addScaledVector(up, v).addScaledVector(dir, w);
    sun.target.position.copy(aim);
    sun.position.copy(aim).addScaledVector(dir, -SUN_BACK_M);
    return moved;
  }

  return {
    hemi, sun, slots, apply, setLamps, update, setElevation, get elevDeg() { return elevDeg; },
    get mood() { return mood; }, get lamps() { return lamps; },
    /** The light a sprite standing at (x, z) takes (linear RGB): the mood's tint and the pools it stands in, plus `extra`. */
    lightAt: (x, z, extra = null) => lightAtOf(mood, lamps, x, z, extra),
    dispose() { sun.shadow.map?.dispose(); },
  };
}
