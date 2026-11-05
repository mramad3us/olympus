// OLYMPUS render: the stage's materials, patched to write part IDs in the same pass as colour.
//
// tradecraft drew its scene twice a frame: once in colour, once more with every mesh's material
// swapped for a flat colour hashed from its part, so the post pass could ink a line where one part
// meets another (src/art/pixelart.js render()). That doubled every draw call. Here the scene is drawn
// once into a target with two colour attachments (WebGL2 multiple render targets, three's
// WebGLRenderTarget with count 2): every material the stage uses is a three.js material patched by
// olyMaterial() so its fragment shader also writes `pc_fragId` at location 1:
//   - rgb: the part ID (a vertex attribute aPart, a whole number; flat so it never interpolates),
//     three bytes, so the post pass compares IDs exactly;
//   - alpha: 1 for a part, 0.5 for a pixel kept by the see-through dither (the post pass draws no
//     outline from it), 0 for nothing.
// Blending runs on both attachments with the same factors, so a material with no part (noId: a blob
// shadow, a lamp's spill, a thin rail tradecraft kept out of its ID pass) writes alpha 0 there and is
// drawn blended: SRC_ALPHA × 0 + ONE_MINUS_SRC_ALPHA × dst leaves the ID under it as it was, exactly
// what tradecraft's "hidden from the ID pass" did. noId therefore forces `transparent`.
//
// The same patch carries what every lit surface needs from the stage, through uniforms shared by
// reference (SHARED, set by the stage each frame, one program for all as tradecraft's weather patch):
//   - see-through (uSee): a figure (the player) at x, z, half-width, height. A fragment in front of
//     it hides it exactly when it lies south of the figure's feet (z > figure z) and on the figure's
//     part of the screen: within its half-width in x and, as the camera sees a point at height y and
//     z where the ground at z − y lies, with z − y between the figure's feet and its head. Those
//     fragments are dropped in a checkerboard (every other screen pixel), as pixel art shows what is
//     behind, and the ones kept are flagged for the post pass. The floor never qualifies (y = 0).
//   - glow classes (uGlowK[8], src/art/paint.js GLOW): a surface of class k shows k's strength of its
//     own painted colour unlit (a lamp's lens, a strip, a screen) and the rest lit; the mood sets them.
//   - the area's strip light (uGlowMap over uGlowBox): a low-resolution map of where the floor strips'
//     and battle strips' light falls (src/render/batch.js bakes it), added to the light on whatever
//     stands there, as hard-edged bands (a core and a ring, as pixel art draws a lamp's pool): floor strips' on
//     the floor and the walls' feet (under 0.6 m), battle strips' on the floor near them and on the band of
//     wall they run along (0.55–1.95 m: the strips are at 1.3 m on north walls and 0.8 m on cut walls).
// The batch material (batchMaterial()) is the same toon material reading an area's atlas: each vertex
// carries its face's atlas region and its texel position (repeating faces wrap inside the region), so
// every box of an area, each with its own painted faces, is one material and one draw call.
//
// The toon light is tradecraft's: a two-band ramp (RAMP), so with the stage's calibrated hemisphere and
// sun (src/render/lights.js) a face toward the camera shows its painted colour, a top a little more,
// a face turned from the sun 0.69 of it.
import * as THREE from 'three';
import { GLOW_CLASSES } from '../art/paint.js';

/** Uniforms every patched material shares by reference; the stage sets their values. */
export const SHARED = {
  uSee: { value: new THREE.Vector4(0, 0, 0, 0) },                    // the figure seen through to: x, z, half-width, height (w 0: off)
  uGlowK: { value: new Float32Array(GLOW_CLASSES) },                 // each glow class's strength, 0..1 (the mood's)
  uGlowMap: { value: null },                                          // the area's strip-light map (null: none)
  uGlowBox: { value: new THREE.Vector4(0, 0, 0, 0) },                // its x0, z0, width, depth in metres (z 0: none)
  uStripLight: { value: new THREE.Color(0, 0, 0) },                   // floor strips' spill, linear colour × strength
  uBattleLight: { value: new THREE.Color(0, 0, 0) },                  // battle strips' spill
};
SHARED.uGlowK.value[1] = 1;

// Two light bands (tradecraft's RAMP): lit (fronts and tops, which the sky fill tells apart) and turned from the sun.
export const RAMP = (() => {
  const v = [0.55, 0.55, 1.0, 1.0, 1.0].map(x => Math.round(x * 255));
  const t = new THREE.DataTexture(new Uint8Array(v.flatMap(x => [x, x, x, 255])), v.length, 1);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();

const VERT_DECL = /* glsl */`
  attribute float aPart;
  flat varying float vOlyPart;
  varying vec3 vOlyWorld;
  #ifdef OLY_BATCH
    attribute vec2 aTexel;
    attribute vec4 aRegion;
    attribute float aGlow;
    varying vec2 vOlyTexel;
    flat varying vec4 vOlyRegion;
    flat varying float vOlyGlow;
  #endif`;
const VERT_MAIN = /* glsl */`
  vOlyPart = aPart;
  {
    vec4 olyW = vec4(transformed, 1.0);
    #ifdef USE_INSTANCING
      olyW = instanceMatrix * olyW;
    #endif
    vOlyWorld = (modelMatrix * olyW).xyz;
  }
  #ifdef OLY_BATCH
    vOlyTexel = aTexel; vOlyRegion = aRegion; vOlyGlow = aGlow;
  #endif`;

/** GLSL for any stage fragment shader: the ID output and the shared uniforms (custom shaders include it too). */
export const FRAG_DECL = /* glsl */`
  layout(location = 1) out highp vec4 pc_fragId;
  flat varying float vOlyPart;
  varying vec3 vOlyWorld;
  uniform vec4 uSee;
  uniform float uGlowK[${GLOW_CLASSES}];
  uniform sampler2D uGlowMap;
  uniform vec4 uGlowBox;
  uniform vec3 uStripLight, uBattleLight;
  float olyFlag = 1.0;
  // The part ID as three bytes, and the flag (1 a part, 0.5 kept by the see-through dither).
  vec4 olyId(float id, float flag) { return vec4(mod(id, 256.0), mod(floor(id / 256.0), 256.0), floor(id / 65536.0), 255.0 * flag) / 255.0; }
  // Does the fragment at world p hide the figure (uSee)? Then drop every other pixel of it.
  void olySee(vec3 p) {
    if (uSee.w <= 0.0 || p.y < 0.05 || p.z <= uSee.y + 0.02 || abs(p.x - uSee.x) > uSee.z) return;
    float zg = p.z - p.y;
    if (zg < uSee.y - uSee.w || zg > uSee.y + 0.1) return;
    if (mod(floor(gl_FragCoord.x) + floor(gl_FragCoord.y), 2.0) < 0.5) discard;
    olyFlag = 0.5;
  }`;
const FRAG_BATCH_DECL = /* glsl */`
  uniform sampler2D uAtlas;
  uniform vec2 uAtlasSize;
  varying vec2 vOlyTexel;
  flat varying vec4 vOlyRegion;
  flat varying float vOlyGlow;`;
const FRAG_MAT_DECL = /* glsl */`
  uniform float uOlyGlow;`;

function patch(shader, material) {
  const o = material.userData.oly;
  Object.assign(shader.uniforms, SHARED, o.uniforms);
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>\n${VERT_DECL}`)
    .replace('#include <project_vertex>', `#include <project_vertex>\n${VERT_MAIN}`);
  let f = shader.fragmentShader
    .replace('#include <common>', `#include <common>\n${FRAG_DECL}\n${o.batch ? FRAG_BATCH_DECL : FRAG_MAT_DECL}`)
    .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
      float olyGlowClass = 0.0;
      #ifdef OLY_SEE
        olySee(vOlyWorld);
      #endif`);
  if (o.batch) {
    // (the face's texel, wrapped inside its region: a repeating tile repeats, a painted face maps one texel a pixel)
    f = f.replace('#include <map_fragment>', `#include <map_fragment>
      {
        vec2 olyT = vOlyRegion.xy + mod(vOlyTexel, vOlyRegion.zw);
        vec4 olyTex = texture2D(uAtlas, (floor(olyT) + 0.5) / uAtlasSize);
        if (olyTex.a < 0.5) discard;
        float olyA = floor(olyTex.a * 255.0 + 0.5);
        olyGlowClass = olyA >= 248.0 ? max(vOlyGlow, 255.0 - olyA) : vOlyGlow;
        diffuseColor.rgb *= olyTex.rgb;
      }`);
  } else {
    f = f.replace('#include <map_fragment>', `#include <map_fragment>
      olyGlowClass = uOlyGlow;
      #ifdef USE_MAP
        { float olyA = floor(sampledDiffuseColor.a * 255.0 + 0.5); if (olyA >= 248.0) olyGlowClass = max(olyGlowClass, 255.0 - olyA); }
      #endif`);
  }
  // (a glowing surface: its painted colour unlit, by its class's strength)
  f = f.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      {
        float olyK = clamp(uGlowK[int(olyGlowClass + 0.5)], 0.0, 1.0);
        totalEmissiveRadiance += diffuseColor.rgb * olyK;
        diffuseColor.rgb *= 1.0 - olyK;
      }`);
  // (the strip light: floor strips light the floor and the walls' feet; battle strips the walls and the floor near them)
  f = f.replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
      if (uGlowBox.z > 0.0) {
        vec2 olyQ = (vOlyWorld.xz - uGlowBox.xy) / uGlowBox.zw;
        if (olyQ.x >= 0.0 && olyQ.y >= 0.0 && olyQ.x < 1.0 && olyQ.y < 1.0) {
          vec3 olyG = texture2D(uGlowMap, olyQ).rgb;
          // (floor strips: the floor and the walls' feet; battle strips: the floor near them and the band of wall they run along, 0.55–1.95 m)
          float olyBand = vOlyWorld.y < 0.05 || (vOlyWorld.y > 0.55 && vOlyWorld.y < 1.95) ? 1.0 : 0.0;
          reflectedLight.indirectDiffuse += diffuseColor.rgb * (olyG.r * uStripLight * step(vOlyWorld.y, 0.6) + olyG.g * uBattleLight * olyBand);
        }
      }`);
  f = f.replace('#include <dithering_fragment>', `#include <dithering_fragment>
      #ifdef OLY_NO_ID
        pc_fragId = vec4(0.0);
      #else
        pc_fragId = olyId(vOlyPart, olyFlag);
      #endif`);
  shader.fragmentShader = f;
}

/**
 * Patch a three.js material for the stage (once; returns it): { see: drawn see-through in front of
 * the figure, noId: no part (forces transparent, see the header), glow: its glow class (a whole
 * material's: a lamp's lens), batch: an area's atlas material (batchMaterial()) }.
 */
export function olyMaterial(material, { see = true, noId = false, glow = 0, batch = false, uniforms = {} } = {}) {
  if (material.userData.oly) return material;
  material.userData.oly = { batch, uniforms: batch ? uniforms : { uOlyGlow: { value: glow }, ...uniforms } };
  material.defines = { ...(material.defines ?? {}), ...(see ? { OLY_SEE: '' } : {}), ...(noId ? { OLY_NO_ID: '' } : {}), ...(batch ? { OLY_BATCH: '' } : {}) };
  if (noId) material.transparent = true;
  material.onBeforeCompile = function onBeforeCompile(shader) { patch(shader, this); };   // (three calls it on the material: `this`)
  material.customProgramCacheKey = () => 'oly3';
  material.needsUpdate = true;
  return material;
}
/** Is this material patched for the stage? */
export const isOly = (m) => !!m?.userData?.oly;

const flats = new Map();
/** A toon material: a flat colour (shared by colour), or a texture (its own). */
export function toon(color, map = null, opts = {}) {
  if (map) return olyMaterial(new THREE.MeshToonMaterial({ color: 0xffffff, map, gradientMap: RAMP }), opts);
  const key = `${color}|${JSON.stringify(opts)}`;
  if (!flats.has(key)) flats.set(key, olyMaterial(new THREE.MeshToonMaterial({ color, gradientMap: RAMP }), opts));
  return flats.get(key);
}
/** An unlit material (shown as painted, whatever the light). */
export function unlit(color, map = null, opts = {}) {
  return olyMaterial(new THREE.MeshBasicMaterial({ color: map ? 0xffffff : color, map }), opts);
}

/**
 * An area's material: the toon material reading `atlas` (a texture of atlasW × atlasH texels) through
 * each vertex's region and texel (src/render/batch-math.js), vertex colours multiplying (flat faces
 * use the atlas's white texel and their colour), glow classes per vertex and per texel.
 */
export function batchMaterial(atlas, atlasW, atlasH, { see = true } = {}) {
  const m = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: RAMP, vertexColors: true });
  return olyMaterial(m, { see, batch: true, uniforms: { uAtlas: { value: atlas }, uAtlasSize: { value: new THREE.Vector2(atlasW, atlasH) } } });
}

/** Give a mesh's geometry its part attribute if it has none (every vertex `part`). */
export function ensurePart(mesh, part = mesh.userData.part ?? 0) {
  const g = mesh.geometry;
  if (!g || g.attributes.aPart) return;
  const n = g.attributes.position.count;
  g.setAttribute('aPart', new THREE.Float32BufferAttribute(new Float32Array(n).fill(part), 1));
}
/** Set a mesh's part (its geometry's attribute, made or refilled). */
export function setPart(mesh, part) {
  mesh.userData.part = part;
  const a = mesh.geometry?.attributes.aPart;
  if (a) { a.array.fill(part); a.needsUpdate = true; } else if (mesh.geometry) ensurePart(mesh, part);
}
