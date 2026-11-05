// OLYMPUS render: the weather in the air. Dust storm haze, blowing dust, steam patches, over the stage's picture.
//
// tradecraft drew its weather in the composite (src/art/pixelart.js, the post shader's "weather in the
// air"): a haze by distance from the eyes, Bayer-dithered (a smooth one bands into rings under the
// palette, PIPELINE 2026-10-27), thick where the fog of awareness says unseen ("in a fog what you can't
// see is fog, not the dark"); falls in screen pixels pinned to the world, so they don't slide as the
// camera pans; dust as rain's streaks turned on their side. Its Cairo dust (docs/research/shots/
// tradecraft-walk-cairo-dust.png: the visible cone clear, everything else veiled toward the dust's
// colour, sideways streaks) is VIEWS §2.7's model for a Martian storm, and VIEWS §2.8 adds steam: "a
// local haze patch: white-blue, radial, Bayer-dithered, strength from the appliance or vent".
//
// OLYMPUS's stage (src/render/stage.js) has no weather in its composite, so this module adds one pass
// after it without changing the stage: createWeather(stage) wraps the stage's post.compose, and after
// the composite has written the finished picture (rtOut: graded and snapped to the palette) it copies
// that picture on the GPU (copyTextureToTexture: a copyTexSubImage2D, no draw call), draws one quad that
// reads it with the scene's depth (the world under each pixel, through the composite's own invVP) and
// the fog mask, lays the air over it, and snaps the result to the palette again with the stage's own
// lookup (the same four-candidate snap, src/render/post.js), so every pixel is still a palette colour.
// One draw call more a frame while there is weather; none when there is none (the pass is skipped).
// The haze's colour gets the stage's grade first, so it lands where tradecraft's did (its haze was mixed
// before the grade).
//
// What it draws (set(), plain numbers, from the sim's weather and light: PLACES §3.15 gives τ, VIEWS §2.7
// turns τ into haze, sight and falls; dustOf(tau) here is that table until the sim's light module owns it):
//   - haze: k (0..1) toward a colour by distance from the eye. The distance is 3D from the eye at head
//     height (my call; tradecraft's was along the ground), so the upper part of a cliff is further
//     than its foot and fades first; it reaches full at `farM` (the sight cap, at most MAX_FAR_M);
//   - dust falls: tradecraft's sideways streaks, two layers, at DUST_PX_S scaled with the density
//     (VIEWS: "speeds scale with PX_PER_M"), slanted by the wind;
//   - blowing dust: a low drift on the ground (y under 0.4 m), dithered bands of the dust's colour
//     carried along the wind in world metres, so it streams past what stands still;
//   - steam: up to MAX_PUFFS puffs { x, y, z, r, k }, each a radial patch in the picture round where its
//     centre projects, dithered, its wisps rising (the noise scrolls up at STEAM_RISE_PX_S).
// Nothing falls or hazes indoors unless asked: steam is a puff, a storm is outdoors. three.js comes from
// the stage it is given (stage.THREE), so the module itself imports nothing of the GPU's and its tables
// (dustOf) load in node.
import { PX_PER_M } from './scale.js';
import { rgbOf } from '../art/tone.js';

export const MAX_PUFFS = 12;
/** The haze's reach is capped at this (tradecraft's min(60, sight)). */
export const MAX_FAR_M = 60;
/** Dust streaks' speed on screen at 16 px/m (tradecraft's 140 px/s), and steam's rise. */
export const DUST_PX_S = 140, STEAM_RISE_PX_S = 9;
/** The eye's height for the haze's distance, metres. */
export const EYE_Y_M = 1.6;

/**
 * VIEWS §2.7's dust storms by optical depth τ: { sunK, skyK (multipliers), skyToward (0..1 toward
 * 0xb07656), shadow, haze, farM (the sight cap), dust (falls 0..1) }, interpolated between its rows.
 */
export const DUST_ROWS = Object.freeze([
  { tau: 0.5, sunK: 1.0, skyK: 1.0, skyToward: 0, shadow: 1.0, haze: 0.05, farM: Infinity, dust: 0 },
  { tau: 1, sunK: 0.6, skyK: 1.15, skyToward: 0.3, shadow: 0.7, haze: 0.25, farM: 2000, dust: 0 },
  { tau: 3, sunK: 0.15, skyK: 0.9, skyToward: 0.7, shadow: 0.15, haze: 0.55, farM: 150, dust: 0.5 },
  { tau: 6, sunK: 0.01, skyK: 0.6, skyToward: 0.9, shadow: 0, haze: 0.75, farM: 40, dust: 1.0 },
  { tau: 10, sunK: 0, skyK: 0.35, skyToward: 1.0, shadow: 0, haze: 0.85, farM: 15, dust: 1.0 },
]);
export const DUST_SKY = 0xb07656;
export function dustOf(tau) {
  const R = DUST_ROWS;
  if (tau <= R[0].tau) return { ...R[0], tau };
  for (let i = 1; i < R.length; i++) if (tau <= R[i].tau) {
    const a = R[i - 1], b = R[i], k = (tau - a.tau) / (b.tau - a.tau), L = (p, q) => p + (q - p) * k;
    // (the sight cap falls off like 1/τ (PLACES §3.15 V = 3.9 H / τ), so it is interpolated in its logarithm)
    const far = !isFinite(a.farM) ? b.farM * (b.tau / tau) : Math.exp(L(Math.log(a.farM), Math.log(b.farM)));
    return { tau, sunK: L(a.sunK, b.sunK), skyK: L(a.skyK, b.skyK), skyToward: L(a.skyToward, b.skyToward), shadow: L(a.shadow, b.shadow), haze: L(a.haze, b.haze), farM: far, dust: L(a.dust, b.dust) };
  }
  return { ...R[R.length - 1], tau };
}

const FRAG = /* glsl */`
  precision highp float; precision highp int; precision highp sampler2D;
  out vec4 outColor;
  uniform sampler2D tPic, tDepth, tFog, tLut, tPal;
  uniform vec2 res; uniform float near, far, fogOn, grade, t, ppmK, eyeY;
  uniform vec4 fogBox, haze, dust; uniform mat4 invVP;
  uniform vec3 hazeCol, dustCol, steamCol; uniform vec2 camPx, wind; uniform float drift;
  uniform int lutN, lutTiles, palCount, snapMode, nPuffs;
  uniform vec4 puffs[${MAX_PUFFS}];
  float bayer(vec2 p) {
    int i = int(mod(p.x, 4.0)) + 4 * int(mod(p.y, 4.0));
    float m[16] = float[16](0., 8., 2., 10., 12., 4., 14., 6., 3., 11., 1., 9., 15., 7., 13., 5.);
    return (m[i] + 0.5) / 16.0;
  }
  float wxh(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
  float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(wxh(i), wxh(i + vec2(1, 0)), f.x), mix(wxh(i + vec2(0, 1)), wxh(i + vec2(1, 1)), f.x), f.y); }
  // tradecraft's streaks: a streak of len px in cells of cw × ch, one cell in 1/dens holding one, moving v px a second.
  float streaks(vec2 p, float tt, float slant, vec2 cell, float len, float v, float dens, float seed) {
    vec2 q = vec2(p.x - slant * p.y, p.y - tt * v);
    float col = floor(q.x / cell.x);
    q.y += wxh(vec2(col, seed)) * cell.y * 13.0;
    float row = floor(q.y / cell.y);
    if (wxh(vec2(col, row) + seed) > dens) return 0.0;
    if (floor(q.x - col * cell.x) != floor(wxh(vec2(row, col) + seed * 1.7) * (cell.x - 1.0))) return 0.0;
    float y = q.y - row * cell.y, y0 = floor(wxh(vec2(col * 1.3, row) + seed * 2.1) * (cell.y - len));
    return y >= y0 && y < y0 + len ? 1.0 - 0.5 * (y - y0) / len : 0.0;
  }
  vec3 graded(vec3 c) {
    if (grade <= 0.0) return c;
    float l = dot(c, vec3(0.30, 0.59, 0.11));
    c = mix(c, vec3(l), 0.18 * grade) * mix(vec3(1.0), vec3(1.05, 1.0, 0.9), grade);
    return c + grade * max(0.0, 0.35 - l) * vec3(0.03, -0.01, 0.05);
  }
  float dist(vec3 a, vec3 b) { vec3 d = a - b; return dot(d * d, vec3(0.30, 0.59, 0.11)) + 0.25 * dot(d, d); }
  vec3 snapLut(vec3 c) {
    ivec3 q = ivec3(floor(c * float(lutN - 1) + 0.5));
    ivec4 k = ivec4(texelFetch(tLut, ivec2(q.r + lutN * (q.b % lutTiles), q.g + lutN * (q.b / lutTiles)), 0) * 255.0 + 0.5);
    vec3 best = texelFetch(tPal, ivec2(k.x, 0), 0).rgb; float bd = dist(c, best);
    for (int j = 1; j < 4; j++) { vec3 p = texelFetch(tPal, ivec2(k[j], 0), 0).rgb; float e = dist(c, p); if (e < bd) { bd = e; best = p; } }
    return best;
  }
  vec3 snapLoop(vec3 c) {
    vec3 best = texelFetch(tPal, ivec2(0, 0), 0).rgb; float bd = 1e9;
    for (int i = 0; i < 256; i++) { if (i >= palCount) break; vec3 p = texelFetch(tPal, ivec2(i, 0), 0).rgb; float e = dist(c, p); if (e < bd) { bd = e; best = p; } }
    return best;
  }
  void main() {
    ivec2 ip = ivec2(gl_FragCoord.xy);
    vec3 col = texelFetch(tPic, ip, 0).rgb;
    float raw = texelFetch(tDepth, ip, 0).r;
    vec2 uv = (vec2(ip) + 0.5) / res;
    vec4 w4 = invVP * vec4(uv * 2.0 - 1.0, raw * 2.0 - 1.0, 1.0);
    vec3 wp = w4.xyz / w4.w;
    bool ground = raw < 0.99999;
    float b = bayer(gl_FragCoord.xy);
    bool unseen = false;
    if (fogOn > 0.5 && ground) {
      vec2 fp = wp.xz + vec2(0.0, clamp(wp.y, 0.0, 1.0) * 0.5);
      unseen = texture(tFog, (fp - fogBox.xy) / fogBox.zw).r < b;
    }
    // (the screen pixel pinned to the world: picture pixels from its top-left, plus the camera's offset in pixels)
    vec2 p = vec2(floor(gl_FragCoord.x), floor(res.y - gl_FragCoord.y)) + camPx;
    if (haze.x > 0.0) {
      float d = ground ? distance(wp, vec3(haze.z, eyeY, haze.w)) : 1e3;
      float f = haze.x * (smoothstep(haze.y * 0.3, haze.y, d) * 0.88 + 0.12);
      if (unseen) f = max(f, haze.x * 0.8);
      // (the haze is not even: it billows, slowly, in world metres along the wind)
      f *= 0.85 + 0.3 * vnoise(wp.xz * 0.12 - wind * t * 0.05);
      col = mix(col, graded(hazeCol), clamp(f + (b - 0.5) * 0.16, 0.0, 1.0));
    }
    if (drift > 0.0 && ground && wp.y < 0.4) {
      // (dust streaming along the ground: noise stretched a dozen times along the wind and carried by it, thin bands, dithered)
      vec2 along = wind, across = vec2(-wind.y, wind.x);
      vec2 q2 = vec2(dot(wp.xz, along) * 0.35 - t * 3.5, dot(wp.xz, across) * 6.0);
      float n = vnoise(q2) * 0.65 + vnoise(q2 * vec2(2.3, 1.7) + 9.0) * 0.35;
      float a = smoothstep(1.0 - 0.45 * drift, 1.0 - 0.15 * drift, n) * (1.0 - wp.y / 0.4);
      if (a > b) col = mix(col, graded(dustCol), 0.35);
    }
    if (dust.x > 0.0) {
      float sp = dust.w * ppmK, dir = dust.z;
      float a = max(streaks(p.yx, t, dust.y, vec2(5.0, 30.0) * ppmK, 3.0 * ppmK, sp * dir, 0.1 + 0.5 * dust.x, 5.0),
                    0.7 * streaks(p.yx + 17.0, t, dust.y * 0.8, vec2(4.0, 22.0) * ppmK, 2.0 * ppmK, sp * 0.7 * dir, 0.08 + 0.45 * dust.x, 6.0));
      col = mix(col, graded(dustCol), 0.5 * a);
    }
    for (int i = 0; i < ${MAX_PUFFS}; i++) {
      if (i >= nPuffs) break;
      vec4 P = puffs[i];
      vec2 dd = (gl_FragCoord.xy - P.xy) / P.z;
      float r2 = dot(dd, dd);
      if (r2 >= 1.0) continue;
      vec2 q = vec2(gl_FragCoord.x, res.y - gl_FragCoord.y) + camPx;
      float n = vnoise(vec2(q.x / (5.0 * ppmK), (q.y + t * ${STEAM_RISE_PX_S.toFixed(1)} * ppmK) / (4.0 * ppmK)) + float(i) * 7.3) * 0.65 + vnoise(vec2(q.x, q.y + t * 14.0 * ppmK) / (2.0 * ppmK) + float(i)) * 0.35;
      float a = P.w * (1.0 - r2) * smoothstep(0.3, 0.75, n);
      // (two levels, dithered: a pixel-art mist rather than a smooth fog the palette would band)
      float lvl = a + (b - 0.5) * 0.5;
      if (lvl > 0.55) col = mix(col, graded(steamCol), 0.6); else if (lvl > 0.25) col = mix(col, graded(steamCol), 0.3);
    }
    col = clamp(col, 0.0, 1.0);
    if (snapMode == 0) col = snapLut(col); else if (snapMode == 1) col = snapLoop(col);
    outColor = vec4(col, 1.0);
  }`;

const hexVec = (hex, v) => v.set(...rgbOf(hex));

/**
 * Weather on a stage: { set(o), clear(), dispose(), active, stats }. set's o (all optional): haze 0..1,
 * hazeColour (hex), farM, eye [x, z], dust 0..1 (falls), dustColour, wind [x, z] (its direction, unit,
 * screen x is world x), slant (streaks' lean), drift 0..1 (blowing dust on the ground), puffs [{ x, y, z,
 * r, k }] (steam), steamColour, timeS (the sim's clock, seconds: what falls moves with it).
 */
export function createWeather(stage) {
  // (three.js from the stage: this module has no import of its own, so its table and numbers load in node for the tests)
  const { renderer, post, cam, THREE } = stage;
  const ppm = stage.ppm ?? PX_PER_M;
  let W = 0, H = 0;
  const rt = new THREE.WebGLRenderTarget(2, 2, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false });
  const PU = post.U;
  const U = {
    tPic: { value: rt.texture }, tDepth: PU.tDepth, tFog: PU.tFog, fogOn: PU.fogOn, fogBox: PU.fogBox, invVP: PU.invVP, near: PU.near, far: PU.far,
    tLut: PU.tLut, tPal: PU.tPal, palCount: PU.palCount, lutN: PU.lutN, lutTiles: PU.lutTiles, snapMode: PU.snapMode, grade: PU.grade, res: PU.res,
    t: { value: 0 }, ppmK: { value: ppm / 16 }, eyeY: { value: EYE_Y_M },
    haze: { value: new THREE.Vector4(0, 40, 0, 0) }, hazeCol: { value: new THREE.Vector3() },
    dust: { value: new THREE.Vector4(0, 0.15, 1, DUST_PX_S) }, dustCol: { value: new THREE.Vector3() }, drift: { value: 0 },
    wind: { value: new THREE.Vector2(1, 0) }, camPx: { value: new THREE.Vector2() },
    puffs: { value: Array.from({ length: MAX_PUFFS }, () => new THREE.Vector4()) }, nPuffs: { value: 0 }, steamCol: { value: new THREE.Vector3(0.86, 0.9, 0.92) },
  };
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3, depthTest: false, depthWrite: false, uniforms: U,
    vertexShader: 'void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }', fragmentShader: FRAG,
  }));
  const scene = new THREE.Scene(), qcam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  scene.add(quad);
  let state = null, puffs = [];
  const stats = { drawn: 0, puffs: 0 };

  function size() {
    if (stage.W === W && stage.H === H) return;
    W = stage.W; H = stage.H;
    rt.setSize(W, H);
    renderer.initRenderTarget(rt);
  }
  const compose0 = post.compose;
  post.compose = function weathered(camera) {
    compose0.call(post, camera);
    if (!state) return;
    size();
    // (the frame's numbers: the camera's offset in pixels pins what falls to the world; the puffs project to the picture)
    U.camPx.value.set(Math.round(cam.at.x * ppm), Math.round(cam.at.z * ppm));
    U.nPuffs.value = Math.min(MAX_PUFFS, puffs.length);
    for (let i = 0; i < U.nPuffs.value; i++) {
      const p = puffs[i], [sx, sy] = cam.project(p.x, p.y ?? 1.5, p.z);
      U.puffs.value[i].set(sx, H - sy, Math.max(2, (p.r ?? 0.8) * ppm), p.k ?? 0.7);
    }
    stats.puffs = U.nPuffs.value;
    renderer.copyTextureToTexture(post.rtOut.texture, rt.texture);
    renderer.setRenderTarget(post.rtOut);
    renderer.render(scene, qcam);
    stats.drawn++;
  };

  /** What the air holds now (see the header); null or {} clears it. */
  function set(o) {
    if (!o || (!o.haze && !o.dust && !o.drift && !(o.puffs?.length))) { state = null; puffs = []; return; }
    state = o;
    const far = Math.min(MAX_FAR_M, o.farM ?? MAX_FAR_M), eye = o.eye ?? [cam.at.x, cam.at.z];
    U.haze.value.set(o.haze ?? 0, far, eye[0], eye[1]);
    hexVec(o.hazeColour ?? DUST_SKY, U.hazeCol.value);
    const wind = o.wind ?? [1, 0], wl = Math.hypot(wind[0], wind[1]) || 1;
    U.wind.value.set(wind[0] / wl, wind[1] / wl);
    U.dust.value.set(o.dust ?? 0, o.slant ?? 0.15, Math.sign(wind[0] || 1), DUST_PX_S);
    hexVec(o.dustColour ?? 0xc18064, U.dustCol.value);
    U.drift.value = o.drift ?? 0;
    if (o.steamColour !== undefined) hexVec(o.steamColour, U.steamCol.value);
    if (o.timeS !== undefined) U.t.value = o.timeS % 600;    // (falls loop every 10 minutes: tradecraft's FALL_LOOP_MS, small numbers for the GPU)
    puffs = o.puffs ?? [];
  }
  /** Move the air's clock on (seconds), when the caller doesn't set timeS itself. */
  function tick(dtS) { U.t.value = (U.t.value + dtS) % 600; }
  function dispose() { post.compose = compose0; rt.dispose(); quad.geometry.dispose(); quad.material.dispose(); }
  return { set, tick, clear: () => set(null), dispose, stats, uniforms: U, get active() { return !!state; } };
}
