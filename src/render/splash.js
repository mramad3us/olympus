// OLYMPUS render: the splash on the stage. The zoom, the iris to ink, the brief form's ring, the interrupt's beat.
//
// VIEWS §5.1 and TIME §6.1 to §6.3 and §6.5: "the splash is the stage itself, zoomed close on you at the
// appliance" (DESIGN.md). TIME owns the timeline and the hud drives it (src/ui/hud/splash.js); each frame
// main.js hands the view its splash frame (info.splash: { form, engine, phase, k, zoom, irisM, inkK,
// centre, interrupt, ... }), and this module draws that frame, holding no time of its own:
//   - the zoom (VIEWS §2.4: "a crop of the picture, still rendered at zoom 1, blitted larger through the
//     same sharp-bilinear filter, so it can ease continuously and the art stays square pixels at every
//     step"): cropOf() is the rectangle of the picture round the splash's centre (a metre up, where the
//     figure is), zoom times smaller, kept inside the picture, its corner on a whole pixel once the zoom
//     has settled; the stage's blit shows it (src/render/post.js setCrop);
//   - the iris (the full form, and a brief outcome skip: TIME §6.1, "everything beyond the iris goes to
//     ink before anything is recycled or placed"): every pixel whose ground lies further than R from the
//     centre goes to ink through the fog's dim, across an IRIS_EDGE_M 1.5 m Bayer edge (the inner half of
//     the edge dimmed, the outer inked, the threshold the stage's 4 × 4 dither), and nothing beyond it is
//     drawn at all, so the world can be recycled and placed behind it (TIME §6.3). R closes from beyond the
//     picture's corners to irisM as inkK goes from 0 to 1, and opens again over the zoom out;
//   - the ring (the brief form as a fast-forward: TIME §6.1, VIEWS §5.1): the stage beyond BRIEF_RING_M
//     6 m dimmed as the fog dims, over a RING_EDGE_M 1 m Bayer edge, the world inside it moving truly;
//   - the beat (TIME §6.5's 0.6 s, phase 'beat', by the interrupt's kind; VIEWS §5.3): an alert is the red
//     beacon's pulse through the curtain and the steam, twice in the beat, over everything inside the iris;
//     reveille the overheads coming on (the light already follows the time shown; this is the tubes'
//     flicker as they strike); the body's own crossing a pulse of the iris's edge in and out.
// The pass runs after the composite (and the weather's, when there is one: src/render/weather.js), reads
// the finished picture and the scene's depth (the world under each pixel through the composite's invVP),
// and snaps its result to the palette again with the stage's own lookup, so every pixel stays a palette
// colour. One draw call while a splash is drawn, none otherwise. The numbers it is set by come from
// irisOf(), pure, so the tests read the same radii the GPU draws.
import { PX_PER_M } from './scale.js';
import { INK } from '../art/palette.js';
import { rgbOf } from '../art/tone.js';

/** The full splash's zoom (VIEWS §2.4: "the splash zooms to 3"), the iris's Bayer edge, the brief ring's edge (the build sheet §4's stage row). */
export const SPLASH_ZOOM = 3, IRIS_EDGE_M = 1.5, RING_EDGE_M = 1;
/** The brief form's ring and the iris's radius where the frame gives none (TIME §6.1, VIEWS §5.1; the frame's ringM and irisM win). */
export const BRIEF_RING_M = 6, SPLASH_IRIS_M = 3.5;
/** How far beyond the picture's half-diagonal the open iris starts, metres (so the closing edge comes in from off the picture). */
export const IRIS_OPEN_PAD_M = 2;
/** The beat's pulses (an alert's red, twice in BEAT_S) and how red it goes; a body crossing's edge pulse, metres. */
export const BEAT_PULSES = 2, BEAT_RED_K = 0.7, BEAT_EDGE_M = 0.45;
/** A curtain closing after a sleeper lies down, ms (the build sheet §4, my call). */
export const CURTAIN_MS = 1_000;

const clamp01 = (k) => Math.max(0, Math.min(1, k));

/**
 * What a splash frame draws on the stage: { on, iris: { R, edge } | null, ring: { R, edge } | null, beat:
 * { kind: 'alert' | 'reveille' | 'body', k, pulse } | null, zoom }. viewM: the picture's span in metres
 * [w, h] (the open iris starts beyond its corners). R is where the edge begins; beyond R + edge, ink.
 */
export function irisOf(sp, viewM = [40, 22.5]) {
  if (!sp) return { on: false, iris: null, ring: null, beat: null, zoom: 1 };
  const far = Math.hypot(viewM[0], viewM[1]) / 2 + IRIS_OPEN_PAD_M, inkK = clamp01(sp.inkK ?? 1);
  const full = sp.form === 'full';
  // (the iris: the full form's, and a brief outcome skip's, TIME §6.1; a brief fast-forward has the ring)
  const irisM = Number.isFinite(sp.irisM) ? sp.irisM : full || sp.engine === 'outcome' ? SPLASH_IRIS_M : null;
  let iris = irisM !== null ? { R: irisM + (1 - inkK) * far, edge: IRIS_EDGE_M } : null;
  const ring = !full && sp.engine !== 'outcome' ? { R: (sp.ringM ?? BRIEF_RING_M) + (1 - inkK) * far, edge: RING_EDGE_M } : null;
  let beat = null;
  const kind = sp.interrupt?.kind ?? null, letter = sp.interrupt?.letter ?? null;
  if (sp.phase === 'beat' && sp.interrupt) {
    const k = clamp01(sp.k ?? 0);
    const b = kind === 'alert' || letter === 'A' ? 'alert' : kind === 'reveille' ? 'reveille' : kind === 'body' || letter === 'B' ? 'body' : null;
    if (b === 'alert') beat = { kind: b, k, pulse: Math.sin(Math.PI * clamp01(k * BEAT_PULSES % 1)) * BEAT_RED_K };
    else if (b === 'reveille') beat = { kind: b, k, pulse: k < 0.12 || (k >= 0.22 && k < 0.3) ? 0.45 : 1 };   // (the tubes strike: dark, on, dark, on)
    else if (b === 'body') { beat = { kind: b, k, pulse: Math.sin(Math.PI * k) }; if (iris) iris = { ...iris, R: iris.R - BEAT_EDGE_M * beat.pulse }; }
  }
  return { on: !!(iris || ring || beat), iris, ring, beat, zoom: Math.max(1, sp.zoom ?? 1) };
}

/**
 * The zoom's crop of a W × H picture round the picture point (px, py) (pixels from its top-left): { x, y,
 * w, h } from the top-left, zoom times smaller, kept inside the picture; its corner on a whole pixel once
 * the zoom has settled (settled: no fraction left to ease), so the zoomed picture holds still.
 */
export function cropOf(W, H, zoom, px, py, { settled = false } = {}) {
  const z = Math.max(1, zoom), w = W / z, h = H / z;
  let x = Math.max(0, Math.min(W - w, px - w / 2)), y = Math.max(0, Math.min(H - h, py - h / 2));
  if (settled) { x = Math.max(0, Math.min(Math.floor(W - w), Math.round(x))); y = Math.max(0, Math.min(Math.floor(H - h), Math.round(y))); }
  return { x, y, w, h };
}

const FRAG = /* glsl */`
  precision highp float; precision highp int; precision highp sampler2D;
  out vec4 outColor;
  uniform sampler2D tPic, tDepth, tLut, tPal;
  uniform vec2 res, centre; uniform mat4 invVP; uniform float dimK;
  uniform vec4 iris, ring, beat; uniform vec3 ink;
  uniform int lutN, lutTiles, palCount, snapMode;
  float bayer(vec2 p) {
    int i = int(mod(p.x, 4.0)) + 4 * int(mod(p.y, 4.0));
    float m[16] = float[16](0., 8., 2., 10., 12., 4., 14., 6., 3., 11., 1., 9., 15., 7., 13., 5.);
    return (m[i] + 0.5) / 16.0;
  }
  // (the fog's dim, src/render/post.js: darker, greyer, a little cold)
  vec3 dim(vec3 c) { float l = dot(c, vec3(0.30, 0.59, 0.11)); return mix(vec3(l), c, 0.3) * dimK + vec3(0.010, 0.016, 0.032) * dimK / 0.48; }
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
    // (the ground under the pixel, its distance from the splash's centre; the dark round a cutaway is beyond everything)
    float d = raw < 0.99999 ? distance(wp.xz, centre) : 1e4;
    float b = bayer(gl_FragCoord.xy);
    bool inside = true;
    if (iris.w > 0.5) {
      float t = (d - iris.x) / iris.y;
      if (t >= 1.0 || t > b) { col = ink; inside = false; }
      else if (t > 0.0 && t * 2.0 > b) col = dim(col);
    }
    if (ring.w > 0.5) {
      float t = (d - ring.x) / ring.y;
      if (t > b) { col = dim(col); inside = false; }
    }
    if (inside && beat.x > 0.5) {
      if (beat.x < 1.5) col = mix(col, vec3(max(col.r, 0.32) * 1.25 + 0.06, col.g * 0.42, col.b * 0.38), clamp(beat.y, 0.0, 1.0));   // (an alert: the beacon's red)
      else if (beat.x < 2.5) col *= beat.y;                                                                                            // (reveille: the tubes striking)
    }
    col = clamp(col, 0.0, 1.0);
    if (snapMode == 0) col = snapLut(col); else if (snapMode == 1) col = snapLoop(col);
    outColor = vec4(col, 1.0);
  }`;

const BEAT_CODE = { alert: 1, reveille: 2, body: 3 };

/**
 * The splash's pass on a stage: { set(sp, { dimK, centre }), clear(), stats, uniforms, dispose(), active }.
 * set(): a splash frame (or null) and the frame's dim (the fog's, lighting.frame's dimK); it sets the
 * pass's uniforms from irisOf() and the stage's crop from cropOf().
 */
export function createSplash(stage) {
  const { renderer, post, cam, THREE } = stage;
  const ppm = stage.ppm ?? PX_PER_M;
  let W = 0, H = 0, state = null;
  const rt = new THREE.WebGLRenderTarget(2, 2, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false });
  const PU = post.U;
  const U = {
    tPic: { value: rt.texture }, tDepth: PU.tDepth, invVP: PU.invVP, res: PU.res,
    tLut: PU.tLut, tPal: PU.tPal, palCount: PU.palCount, lutN: PU.lutN, lutTiles: PU.lutTiles, snapMode: PU.snapMode,
    centre: { value: new THREE.Vector2() }, dimK: { value: 0.48 },
    iris: { value: new THREE.Vector4(0, 1, 0, 0) }, ring: { value: new THREE.Vector4(0, 1, 0, 0) }, beat: { value: new THREE.Vector4() },
    ink: { value: new THREE.Vector3(...rgbOf(INK)) },
  };
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3, depthTest: false, depthWrite: false, uniforms: U,
    vertexShader: 'void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }', fragmentShader: FRAG,
  }));
  const scene = new THREE.Scene(), qcam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  scene.add(quad);
  const stats = { drawn: 0, iris: null, ring: null, beat: null, zoom: 1, crop: null };
  // (its program linked now, with the target it draws into bound (a program's key holds the output's colour
  // space), so the first splash links nothing in play: TECH §9.8, the warm-up's rule)
  { const was = renderer.getRenderTarget(); renderer.setRenderTarget(post.rtOut); renderer.compile(scene, qcam); renderer.setRenderTarget(was); }

  function size() {
    if (stage.W === W && stage.H === H) return;
    W = stage.W; H = stage.H;
    rt.setSize(W, H);
    renderer.initRenderTarget(rt);
  }
  const compose0 = post.compose;
  post.compose = function splashed(camera) {
    compose0.call(post, camera);
    if (!state?.on) return;
    size();
    renderer.copyTextureToTexture(post.rtOut.texture, rt.texture);
    renderer.setRenderTarget(post.rtOut);
    renderer.render(scene, qcam);
    stats.drawn++;
  };

  /** A frame's splash (or null), the fog's dim now, and the picture's span in metres. */
  function set(sp, { dimK = 0.48 } = {}) {
    const viewM = [stage.W / ppm, stage.H / ppm], it = irisOf(sp, viewM);
    state = it;
    stats.iris = it.iris; stats.ring = it.ring; stats.beat = it.beat; stats.zoom = it.zoom;
    if (!it.on && it.zoom <= 1) { post.setCrop(null); stats.crop = null; return it; }
    const c = sp.centre ?? { x: cam.at.x, z: cam.at.z };
    U.centre.value.set(c.x, c.z); U.dimK.value = dimK;
    if (it.iris) U.iris.value.set(it.iris.R, it.iris.edge, 0, 1); else U.iris.value.set(0, 1, 0, 0);
    if (it.ring) U.ring.value.set(it.ring.R, it.ring.edge, 0, 1); else U.ring.value.set(0, 1, 0, 0);
    if (it.beat) U.beat.value.set(BEAT_CODE[it.beat.kind] ?? 0, it.beat.pulse, it.beat.k, 0); else U.beat.value.set(0, 0, 0, 0);
    // (the crop round the centre a metre up, where the figure and the appliance are)
    if (it.zoom > 1) {
      const [px, py] = cam.project(c.x, 0.9, c.z);
      const cr = cropOf(stage.W, stage.H, it.zoom, px, py, { settled: it.zoom >= SPLASH_ZOOM - 1e-6 });
      post.setCrop(cr.x, stage.H - cr.y - cr.h, cr.w, cr.h);
      stats.crop = cr;
    } else { post.setCrop(null); stats.crop = null; }
    return it;
  }
  function clear() { state = null; post.setCrop(null); stats.iris = stats.ring = stats.beat = stats.crop = null; stats.zoom = 1; }
  function dispose() { post.compose = compose0; post.setCrop(null); rt.dispose(); quad.geometry.dispose(); quad.material.dispose(); }
  return { set, clear, dispose, stats, uniforms: U, material: quad.material, get active() { return !!state?.on; } };
}
