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
//   - the room's fill (uRoomMap over uRoomBox, 0.0.3): a floor's rooms each lit by their own overheads
//     (PLACES's lighting classes: a bay dark at lights out while its head stays lit), a map of 0.25 m
//     cells holding the light each cell's room shows (src/render/lighting.js: the eye's adaptation of
//     places' lightLevel fill, in the fill's colour, × 2 to carry a value over 1), multiplying the sky
//     fill and the key light; outdoors it is off and the rig is the sky's;
//   - the static lamp pools (uLampTable, uLampGrid: TECH §9.6's tiled table, 0.0.3): up to four lamps a
//     4 m cell, each a hard-edged pool (a core to r, a ring to 1.5 r) in its colour, added to the light;
//     a surface y metres up reads both maps y × 0.5 m south of it (the fog's rule: a wall lit by the
//     room in front of it, a wall's foot by the pool at its foot). Ceiling lamps are no pools (the look
//     round's blotches, L1 and L3): they are the room's fill;
//   - the see-through's fade (uSeeK, 0..1 over SEE_DISSOLVE_S: VIEWS §2.10), the dither run by a 4 × 4
//     Bayer threshold so it dissolves in and out, never pops; a top above SEE_ROOF_M (a roof, an
//     awning) is hidden outright where the figure is behind it, the rest goes to the checkerboard;
//   - the wide see-through (uSeeWide: x, z, radius, fade; batch materials only, the area's own
//     geometry): behind a tall mass for longer than the see-through's dissolve, everything of the area
//     above CUT_H_M, south of the figure, whose spot on the ground (x, z − y: what it hides) lies within
//     SEE_WIDE_M of the figure, dissolved away with a dithered rim, as the interior cutaway cuts the
//     walls down: the ground, the fence and whatever stands round you show, not only your figure
//     (v0.0.3's review: behind Echo the player walked blind in a figure-sized box);
//   - the lift (uLift, uLiftY): a roof over the figure (an open shed it stands under) dissolved away
//     above uLiftY.x by the threshold uLiftY.y;
//   - the stair's wipe (uWipe, a batch material's own: x, z, radius, mode): one floor dissolving
//     outward from the stair as the other dissolves in, a radial Bayer wipe (VIEWS §2.9).
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
  uSeeK: { value: 1 },                                                // the see-through's fade, 0..1 (a Bayer threshold)
  uLift: { value: new THREE.Vector4(0, 0, 0, 0) },                   // a roof lifted over the figure: x0, z0, x1, z1 (x1 ≤ x0: none)
  uLiftY: { value: new THREE.Vector2(2.4, 0) },                       // its height, and its fade 0..1
  uSeeWide: { value: new THREE.Vector4(0, 0, 0, 0) },                 // the wide see-through behind a tall mass: x, z, radius, fade (w 0: off)
  uRoomMap: { value: null },                                          // a floor's rooms' fill (src/render/lighting.js), × 2
  uRoomBox: { value: new THREE.Vector4(0, 0, 0, 0) },                // its x0, z0, width, depth in metres (z 0: off)
  uRoomOut: { value: new THREE.Color(1, 1, 1) },                      // the fill outside its rooms (the dark round a cutaway)
  uLampTable: { value: null },                                        // the pools: two texels a lamp (x, z, r, core; colour, ring), 128 lamps a row
  uLampGrid: { value: null },                                         // four lamp numbers (index + 1) a cell
  uLampBox: { value: new THREE.Vector4(0, 0, 4, 0) },                // the grid's x0, z0, cell metres, on (w 0: no pools)
  uLampN: { value: new THREE.Vector2(0, 0) },                         // the grid's cells across and down
  uAmbientK: { value: 1 },                                            // outdoors, the sky's light as the eye sees it (a pool lights only what it adds to)
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
  varying float vOlyUp;
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
    vOlyUp = normalize((modelMatrix * vec4(objectNormal, 0.0)).xyz).y;
  }
  #ifdef OLY_BATCH
    vOlyTexel = aTexel; vOlyRegion = aRegion; vOlyGlow = aGlow;
  #endif`;

/** Above this a top hidden behind the figure is taken away, not dithered (a roof, an awning: VIEWS §2.10's "roofs are hidden"), metres. */
export const SEE_ROOF_M = 2.4;
/** The wide see-through: what is kept of the area's geometry under it (the cutaway's CUT_H_M), and its dithered rim, metres. */
export const SEE_WIDE_KEEP_M = 1.0, SEE_WIDE_EDGE_M = 1.0;
/** The stair's wipe: the width of its dithered edge, metres. */
export const WIPE_EDGE_M = 1.5;

/** GLSL for any stage fragment shader: the ID output and the shared uniforms (custom shaders include it too). */
export const FRAG_DECL = /* glsl */`
  layout(location = 1) out highp vec4 pc_fragId;
  flat varying float vOlyPart;
  varying vec3 vOlyWorld;
  uniform vec4 uSee; uniform float uSeeK;
  uniform vec4 uLift; uniform vec2 uLiftY;
  uniform vec4 uSeeWide;
  uniform float uGlowK[${GLOW_CLASSES}];
  uniform sampler2D uGlowMap;
  uniform vec4 uGlowBox;
  uniform vec3 uStripLight, uBattleLight;
  float olyFlag = 1.0;
  // The part ID as three bytes, and the flag (1 a part, 0.5 kept by the see-through dither).
  vec4 olyId(float id, float flag) { return vec4(mod(id, 256.0), mod(floor(id / 256.0), 256.0), floor(id / 65536.0), 255.0 * flag) / 255.0; }
  // A 4 × 4 ordered dither's threshold for this pixel, 0..1 (its cells under 0.5 are a checkerboard).
  float olyBayer() {
    int i = int(mod(gl_FragCoord.x, 4.0)) + 4 * int(mod(gl_FragCoord.y, 4.0));
    float m[16] = float[16](0., 8., 2., 10., 12., 4., 14., 6., 3., 11., 1., 9., 15., 7., 13., 5.);
    return (m[i] + 0.5) / 16.0;
  }
  // Does the fragment at world p (a face whose normal points up by up) hide the figure (uSee)? Then
  // dissolve it by the fade: a top over SEE_ROOF_M (a roof) hidden, the rest to the checkerboard.
  void olySee(vec3 p, float up) {
    if (uSee.w <= 0.0 || uSeeK <= 0.0 || p.y < 0.05 || p.z <= uSee.y + 0.02 || abs(p.x - uSee.x) > uSee.z) return;
    float zg = p.z - p.y;
    if (zg < uSee.y - uSee.w || zg > uSee.y + 0.1) return;
    float b = olyBayer(), k = (up > 0.5 && p.y > ${SEE_ROOF_M.toFixed(2)}) ? uSeeK : uSeeK * 0.5;
    if (b < k) discard;
    olyFlag = 0.5;
  }
  void olySee(vec3 p) { olySee(p, 0.0); }
  // The wide see-through (uSeeWide): the area's geometry above SEE_WIDE_KEEP_M and south of the figure,
  // where what it hides on the ground lies within the radius, dissolved by the fade, a dithered rim.
  void olySeeWide(vec3 p) {
    if (uSeeWide.w <= 0.0 || p.y <= ${SEE_WIDE_KEEP_M.toFixed(2)} || p.z <= uSeeWide.y + 0.02) return;
    float d = distance(vec2(p.x, p.z - p.y), uSeeWide.xy);
    float k = clamp((uSeeWide.z - d) / ${SEE_WIDE_EDGE_M.toFixed(2)} + 0.5, 0.0, 1.0) * uSeeWide.w;
    if (olyBayer() < k) discard;
  }
  // A roof lifted over the figure: everything in uLift's rectangle above uLiftY.x dissolved by uLiftY.y.
  void olyLift(vec3 p) {
    if (uLiftY.y <= 0.0 || uLift.z <= uLift.x || p.y < uLiftY.x) return;
    if (p.x < uLift.x || p.x > uLift.z || p.z < uLift.y || p.z > uLift.w) return;
    if (olyBayer() < uLiftY.y) discard;
  }`;
const FRAG_BATCH_DECL = /* glsl */`
  uniform sampler2D uAtlas;
  uniform vec2 uAtlasSize;
  uniform vec4 uWipe;
  varying vec2 vOlyTexel;
  flat varying vec4 vOlyRegion;
  flat varying float vOlyGlow;`;
// (what the patched three.js materials add to every fragment shader: the light maps, the face's up)
const FRAG_LIGHT_DECL = /* glsl */`
  varying float vOlyUp;
  uniform sampler2D uRoomMap, uLampTable, uLampGrid;
  uniform vec4 uRoomBox, uLampBox;
  uniform vec3 uRoomOut;
  uniform vec2 uLampN;
  uniform float uAmbientK;`;
const FRAG_MAT_DECL = /* glsl */`
  uniform float uOlyGlow;`;

function patch(shader, material) {
  const o = material.userData.oly;
  Object.assign(shader.uniforms, SHARED, o.uniforms);
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>\n${VERT_DECL}`)
    .replace('#include <project_vertex>', `#include <project_vertex>\n${VERT_MAIN}`);
  let f = shader.fragmentShader
    .replace('#include <common>', `#include <common>\n${FRAG_DECL}\n${FRAG_LIGHT_DECL}\n${o.batch ? FRAG_BATCH_DECL : FRAG_MAT_DECL}`)
    .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
      float olyGlowClass = 0.0;
      #ifdef OLY_SEE
        olySee(vOlyWorld, vOlyUp);
        ${o.batch ? 'olySeeWide(vOlyWorld);' : ''}
      #endif
      olyLift(vOlyWorld);
      ${o.batch ? `if (uWipe.w != 0.0) {
        // (the stair's wipe: inside the radius kept for the floor coming in, outside for the one going)
        float olyT = (distance(vOlyWorld.xz, uWipe.xy) - uWipe.z) / ${WIPE_EDGE_M.toFixed(2)} + olyBayer() - 0.5;
        if (uWipe.w > 0.0 ? olyT > 0.0 : olyT <= 0.0) discard;
      }` : ''}`);
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
  // (the room's fill multiplies the rig's light; the pools add theirs; then the strips)
  f = f.replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
      {
        vec2 olyQ = vOlyWorld.xz + vec2(0.0, clamp(vOlyWorld.y, 0.0, 3.0) * 0.5);
        float olyLit = uAmbientK;
        if (uRoomBox.z > 0.0) {
          vec2 olyR = (olyQ - uRoomBox.xy) / uRoomBox.zw;
          vec3 olyK = olyR.x >= 0.0 && olyR.y >= 0.0 && olyR.x < 1.0 && olyR.y < 1.0 ? texture2D(uRoomMap, olyR).rgb * 2.0 : uRoomOut;
          reflectedLight.directDiffuse *= olyK; reflectedLight.indirectDiffuse *= olyK;
          olyLit = dot(olyK, vec3(0.30, 0.59, 0.11));
        }
        if (uLampBox.w > 0.0) {
          vec2 olyC = floor((olyQ - uLampBox.xy) / uLampBox.z);
          if (olyC.x >= 0.0 && olyC.y >= 0.0 && olyC.x < uLampN.x && olyC.y < uLampN.y) {
            vec4 olyIds = texelFetch(uLampGrid, ivec2(olyC), 0);
            vec3 olyPool = vec3(0.0);
            for (int i = 0; i < 4; i++) {
              float id = olyIds[i];
              if (id < 0.5) break;
              int t = int(id + 0.5) - 1;
              ivec2 at = ivec2((t % 128) * 2, t / 128);
              vec4 la = texelFetch(uLampTable, at, 0), lb = texelFetch(uLampTable, at + ivec2(1, 0), 0);
              float d = distance(olyQ, la.xy);
              olyPool += lb.rgb * (d < la.z ? la.w + lb.w : d < 1.5 * la.z ? lb.w : 0.0);
            }
            // (a pool adds only up to the light a fully lit place shows, as places' lightLevel tops out at 1:
            // a desk lamp by day is no blotch on a lit floor)
            float olyP = dot(olyPool, vec3(0.30, 0.59, 0.11));
            olyPool *= clamp((1.0 - olyLit) / max(olyP, 1e-4), 0.0, 1.0);
            reflectedLight.indirectDiffuse += diffuseColor.rgb * olyPool;
          }
        }
      }
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
  return olyMaterial(m, { see, batch: true, uniforms: { uAtlas: { value: atlas }, uAtlasSize: { value: new THREE.Vector2(atlasW, atlasH) }, uWipe: { value: new THREE.Vector4(0, 0, 0, 0) } } });
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
