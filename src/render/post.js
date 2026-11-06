// OLYMPUS render: the post pass. Outlines, the fog of awareness, the grade, the palette, the blit.
//
// tradecraft's composite (src/art/pixelart.js), in its order, over the picture the scene pass drew
// into two attachments (colour, HalfFloat; part IDs, RGBA8; src/render/materials.js) and a depth texture:
//   0. the eye (0.0.5, setEye(gain, rod, cone, glare): BODY's eyes, src/sim/body/eyes.js eyeView, the
//      number perception's reach reads too): the linear colour times the eye's gain against v0.0.4's
//      exposure (under 1 just in from a lit place, over 1 dark-adapted, and a glare's bloom when the
//      lights come on). Two gains: the rods' (gain) for what the rods see of a pixel, and the cones'
//      (cone, at their plateau 1.07 when fully dark-adapted) for the rest, mixed in log by the rods' share
//      of the pixel, how dim it is (its brightest channel from CONE_LO up over a band at least as wide as
//      the two gains' ratio, so a brighter pixel never shows darker) times its scotopic over its photopic
//      luminance (a red, which the rods hardly see, 0.16), so a lamp's lit pool and the fire watch's red
//      stay near v0.0.4's brightness while the dim surfaces lighten (the review of v0.0.5's eyes: one
//      gain took the red pool to 1.61 times its value, toward salmon; two, 1.27 times, eyes-browser);
//      and, by the rods' share of
//      vision rod, the dim pixels' colour toward what the rods see:
//      their scotopic grey (SCOTOPIC_RGB, the rods' sensitivity to the sRGB primaries, from Larson,
//      Rushmeier and Piatko 1997's scotopic luminance, normalised to white: a red reads darker than a
//      blue-green of one luma) tinted ROD_TINT a little toward blue-green, at most ROD_MIX 0.5 of the
//      way; a pixel whose brightest channel is over CONE_LO 0.10 to CONE_HI 0.24 before the gain (a
//      lamp's lit pool, a lit doorway) keeps its colour, as the cones see it, so the fire watch's red
//      stays red. In a glare (glare over 0: the lights on over a dark-adapted eye, the field over the
//      eye's adapted level) a pixel the gain takes past white washes toward white by the excess rather
//      than saturating channel by channel; else the clamp is v0.0.4's. What the fog dims (step 2, the
//      place as remembered) takes the cones' gain only under 1: a dark-adapted eye sees farther and
//      lighter, it does not light the rooms behind the walls. Four uniforms and a score of operations a
//      pixel; gain 1, cone 1, rod 0 and glare 0 leave the picture exactly as it was;
//   1. the colour at the pixel, gamma-encoded (tradecraft's pow(1/2.2), the look the user approved;
//      `gamma: 'srgb'` takes the exact curve instead);
//   2. the fog of awareness: the world under the pixel rebuilt from depth (invVP), looked up on a
//      ground mask (red: seen 1 … unseen 0; green: felt, not seen), a surface above the ground taking
//      the mask half a metre south of it per metre up (a façade reads as the ground at its foot: the
//      user, tradecraft 2026-11-03, "the flickering shadows on the buildings"), dithered against a 4 × 4
//      Bayer matrix: unseen is dimmed, greyer, a little cold (dimK), felt is a cold pale tint;
//   3. the outline, over the four neighbours: another part more than 0.35 m behind, or a depth jump of
//      0.6 m, inks this pixel to 0.12 (a silhouette); another part 0.02–0.35 m behind, to 0.4 (a line
//      between touching parts). Metric thresholds: a pixel up the ground or down a wall is 0.044 m
//      further at 16 px/m and 0.029 m at 24, both over 0.02. Part IDs compare exactly (three bytes);
//      a pixel the see-through dither kept (ID alpha 0.5) draws no line, or every hole would ink it;
//   3b. the figure through a mass (VIEWS §2.10, 0.0.3): a pixel the see-through dither kept (ID alpha
//      0.5) with two or more of its four neighbours showing the people's part through the holes lies over
//      the figure behind it, and is inked SILHOUETTE_K (60%) toward the ink, so the figure's silhouette
//      reads through the checkerboard;
//   4. the grade (tradecraft's fine look, grade 1): 18% toward grey, light a touch warmer, shadows
//      under luma 0.35 toward violet;
//   5. the palette snap. tradecraft looped over up to 128 colours per pixel (padded to 128 because
//      three uploads a uniform array at its declared size). Here the four palette colours nearest each
//      cell of a 64-level colour cube are baked once per palette on the GPU (bake(): a 512 × 512 pass,
//      the palette in a small texture, the same metric: src/art/palette.js) and each pixel reads its
//      cell with one texelFetch and measures itself against those four: the loop's answer bar
//      near-ties, at a thirtieth of the work. `snap: 'loop'` keeps tradecraft's loop, 'off' none.
// Then the blit: the finished picture onto the canvas at any scale, sharp-bilinear (each picture pixel
// a solid square, the one screen pixel an edge falls inside blending the two; nearest-neighbour would
// make some pixels a screen pixel wider and they would crawl as the camera moves). A crop (setCrop: the
// splash's zoom, VIEWS §2.4: "a crop of the picture, still rendered at zoom 1, blitted larger through
// the same sharp-bilinear filter") shows a rectangle of the picture over the whole canvas, its pixels
// that many times larger; any size, so the zoom eases continuously (src/render/splash.js).
// Every read is a texelFetch at the pixel's own texel: the post pass never filters.
import * as THREE from 'three';
import { LUT_LEVELS, LUT_TILES, lutSize } from '../art/palette.js';

/** How far a kept pixel over the figure behind a mass goes toward the ink (VIEWS §2.10: its silhouette at 60%). */
export const SILHOUETTE_K = 0.6;
/** The rods' sensitivity to the linear sRGB primaries, normalised to white (see the header), their grey's tint, how far a pixel goes to it at rod 1, and the band of brightness over which the cones take a pixel back. */
export const SCOTOPIC_RGB = Object.freeze([0.033, 0.766, 0.202]), ROD_TINT = Object.freeze([0.88, 1.0, 1.08]), ROD_MIX = 0.5, CONE_LO = 0.10, CONE_HI = 0.24;
/** The people's part (src/render/cards.js PEOPLE_PART) as the ID pass writes it: three bytes. */
const PEOPLE_ID = [0xa5, 0xa5, 0xa5].map(b => b / 255);

const QUAD_VERT = `out vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const POST_FRAG = /* glsl */`
  precision highp float; precision highp int; precision highp sampler2D;
  in vec2 vUv; out vec4 outColor;
  uniform sampler2D tColor, tDepth, tId, tFog, tLut, tPal;
  uniform vec2 res; uniform float near, far, outline, grade, fogOn, dimK, srgb, eyeGain, eyeCone, eyeRod, eyeGlare;
  uniform vec4 fogBox; uniform mat4 invVP; uniform vec3 peoplePart;
  uniform int lutN, lutTiles, palCount, snapMode;
  float lin(float d) { return near + d * (far - near); }
  // A 4 × 4 ordered dither: the threshold for this pixel.
  float bayer(vec2 p) {
    int i = int(mod(p.x, 4.0)) + 4 * int(mod(p.y, 4.0));
    float m[16] = float[16](0., 8., 2., 10., 12., 4., 14., 6., 3., 11., 1., 9., 15., 7., 13., 5.);
    return (m[i] + 0.5) / 16.0;
  }
  // Unseen: darker, greyer, a little cold, as a memory of the place; at night much darker (dimK).
  vec3 dim(vec3 c) { float l = dot(c, vec3(0.30, 0.59, 0.11)); return mix(vec3(l), c, 0.3) * dimK + vec3(0.010, 0.016, 0.032) * dimK / 0.48; }
  // Felt, not seen: the place as the mind has it, cold and pale.
  vec3 feltTint(vec3 c) { float l = dot(c, vec3(0.30, 0.59, 0.11)); return mix(c, vec3(0.60, 0.72, 0.95) * (l * 0.9 + 0.12), 0.72); }
  vec3 encode(vec3 c) {
    if (srgb < 0.5) return pow(c, vec3(1.0 / 2.2));
    return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
  }
  float dist(vec3 a, vec3 b) { vec3 d = a - b; return dot(d * d, vec3(0.30, 0.59, 0.11)) + 0.25 * dot(d, d); }
  vec3 snapLoop(vec3 c) {
    vec3 best = texelFetch(tPal, ivec2(0, 0), 0).rgb; float bd = 1e9;
    for (int i = 0; i < 1024; i++) { if (i >= palCount) break; vec3 p = texelFetch(tPal, ivec2(i, 0), 0).rgb; float e = dist(c, p); if (e < bd) { bd = e; best = p; } }
    return best;
  }
  // (the cell's four nearest palette colours, measured exactly: src/art/palette.js)
  vec3 snapLut(vec3 c) {
    ivec3 q = ivec3(floor(c * float(lutN - 1) + 0.5));
    ivec4 k = ivec4(texelFetch(tLut, ivec2(q.r + lutN * (q.b % lutTiles), q.g + lutN * (q.b / lutTiles)), 0) * 255.0 + 0.5);
    vec3 best = texelFetch(tPal, ivec2(k.x, 0), 0).rgb; float bd = dist(c, best);
    for (int j = 1; j < 4; j++) { vec3 p = texelFetch(tPal, ivec2(k[j], 0), 0).rgb; float e = dist(c, p); if (e < bd) { bd = e; best = p; } }
    return best;
  }
  void main() {
    ivec2 ip = ivec2(gl_FragCoord.xy), mx = ivec2(res) - 1;
    vec3 eyeC = texelFetch(tColor, ip, 0).rgb, eye0 = eyeC;
    float eyeX = max(eyeC.r, max(eyeC.g, eyeC.b)), eyeS = dot(eyeC, vec3(${SCOTOPIC_RGB.map(v => v.toFixed(3)).join(', ')}));
    if (eyeRod > 0.0) {
      // (the rods' grey for the dim pixels, a lamp's pool kept in colour by the cones)
      float w = eyeRod * ${ROD_MIX.toFixed(2)} * (1.0 - smoothstep(${CONE_LO.toFixed(2)}, ${CONE_HI.toFixed(2)}, eyeX));
      eyeC = mix(eyeC, vec3(eyeS) * vec3(${ROD_TINT.map(v => v.toFixed(2)).join(', ')}), w);
    }
    // (the gain: the rods' for what they see of the pixel, the dim and the blue-green, the cones' for the
    // rest, a lamp's pool and a red light; mixed in log over a band of brightness wide enough that a
    // brighter pixel never shows darker)
    float eyeK = 0.0;
    if (eyeGain > eyeCone) {
      float hi = max(${CONE_HI.toFixed(2)}, ${CONE_LO.toFixed(2)} * eyeGain / eyeCone);
      float dim = 1.0 - clamp(log(max(eyeX, 1e-6) / ${CONE_LO.toFixed(2)}) / log(hi / ${CONE_LO.toFixed(2)}), 0.0, 1.0);
      eyeK = dim * clamp(eyeS / max(dot(eye0, vec3(0.2126, 0.7152, 0.0722)), 1e-6), 0.0, 1.0);
    }
    vec3 eyeG = eyeC * (eyeCone * pow(eyeGain / eyeCone, eyeK));
    // (over-exposed in a glare: washed toward white by the excess, not saturated channel by channel; else v0.0.4's clamp)
    float eyeM = max(eyeG.r, max(eyeG.g, eyeG.b));
    if (eyeGlare > 0.0 && eyeM > 1.0) eyeG = mix(eyeG / eyeM, vec3(1.0), (1.0 - 1.0 / eyeM) * min(1.0, eyeGlare));
    vec3 col = encode(clamp(eyeG, 0.0, 1.0));
    float raw = texelFetch(tDepth, ip, 0).r, d = lin(raw);
    vec2 uv = (vec2(ip) + 0.5) / res;
    vec4 w4 = invVP * vec4(uv * 2.0 - 1.0, raw * 2.0 - 1.0, 1.0);
    vec3 wp = w4.xyz / w4.w;
    if (fogOn > 0.5 && raw < 0.99999) {
      vec2 fp = wp.xz + vec2(0.0, clamp(wp.y, 0.0, 1.0) * 0.5);
      vec2 fv = texture(tFog, (fp - fogBox.xy) / fogBox.zw).rg;
      if (fv.r < bayer(gl_FragCoord.xy)) col = dim(encode(clamp(eyeC * min(eyeCone, 1.0), 0.0, 1.0)));   // (the memory: darker to a light-adapted eye, never lit by a dark-adapted one)
      else if (fv.g > bayer(gl_FragCoord.xy + vec2(2.0, 1.0))) col = feltTint(col);
    }
    vec4 id = texelFetch(tId, ip, 0);
    if (outline > 0.5 && !(id.a > 0.25 && id.a < 0.75)) {
      float edge = 1.0;
      ivec2 o[4] = ivec2[4](ivec2(1, 0), ivec2(-1, 0), ivec2(0, 1), ivec2(0, -1));
      for (int i = 0; i < 4; i++) {
        ivec2 q = clamp(ip + o[i], ivec2(0), mx);
        float dn = lin(texelFetch(tDepth, q, 0).r);
        vec3 idn = texelFetch(tId, q, 0).rgb;
        // (another part behind this pixel, or a big depth jump: this pixel is the nearer part's edge)
        bool other = any(greaterThan(abs(idn - id.rgb), vec3(0.5 / 255.0)));
        if ((other && dn > d + 0.35) || dn > d + 0.6) edge = min(edge, 0.12);
        else if (other && dn > d + 0.02) edge = min(edge, 0.4);
      }
      col *= edge;
    } else if (id.a > 0.25 && id.a < 0.75) {
      // (kept by the see-through dither: over the figure behind, its silhouette inked through the holes)
      int n = 0;
      ivec2 o[4] = ivec2[4](ivec2(1, 0), ivec2(-1, 0), ivec2(0, 1), ivec2(0, -1));
      for (int i = 0; i < 4; i++) { vec3 idn = texelFetch(tId, clamp(ip + o[i], ivec2(0), mx), 0).rgb; if (all(lessThan(abs(idn - peoplePart), vec3(0.5 / 255.0)))) n++; }
      if (n >= 2) col = mix(col, vec3(0.08, 0.08, 0.11), ${SILHOUETTE_K.toFixed(2)});
    }
    if (grade > 0.0) {
      float l = dot(col, vec3(0.30, 0.59, 0.11));
      col = mix(col, vec3(l), 0.18 * grade) * mix(vec3(1.0), vec3(1.05, 1.0, 0.9), grade);
      col += grade * max(0.0, 0.35 - l) * vec3(0.03, -0.01, 0.05);
    }
    col = clamp(col, 0.0, 1.0);
    if (snapMode == 0) col = snapLut(col); else if (snapMode == 1) col = snapLoop(col);
    outColor = vec4(col, 1.0);
  }`;

const BAKE_FRAG = /* glsl */`
  precision highp float; precision highp int; precision highp sampler2D;
  out vec4 outColor;
  uniform sampler2D tPal; uniform int palCount, lutN, lutTiles;
  float dist(vec3 a, vec3 b) { vec3 d = a - b; return dot(d * d, vec3(0.30, 0.59, 0.11)) + 0.25 * dot(d, d); }
  void main() {
    ivec2 t = ivec2(gl_FragCoord.xy);
    int bi = t.x / lutN + lutTiles * (t.y / lutN);
    vec3 c = vec3(float(t.x % lutN), float(t.y % lutN), float(bi)) / float(lutN - 1);
    // (the four nearest, nearest first, a tie to the lower index: an insertion as the CPU twin's nearestK())
    float d[4] = float[4](1e9, 1e9, 1e9, 1e9); int ix[4] = int[4](0, 0, 0, 0);
    for (int i = 0; i < 256; i++) {
      if (i >= palCount) break;
      float e = dist(c, texelFetch(tPal, ivec2(i, 0), 0).rgb);
      if (!(e < d[3])) continue;
      int j = 3;
      while (j > 0 && e < d[j - 1]) { d[j] = d[j - 1]; ix[j] = ix[j - 1]; j--; }
      d[j] = e; ix[j] = i;
    }
    outColor = vec4(float(ix[0]), float(ix[1]), float(ix[2]), float(ix[3])) / 255.0;
  }`;

const BLIT_FRAG = /* glsl */`
  precision highp float;
  in vec2 vUv; out vec4 outColor;
  uniform sampler2D tPic; uniform vec2 res, scale; uniform vec4 crop;
  void main() {
    vec2 t = crop.xy + vUv * crop.zw, c = fract(t) - 0.5, edge = 0.5 - 0.5 / max(scale, vec2(1.0));
    vec2 f = (c - clamp(c, -edge, edge)) * scale + 0.5;
    outColor = texture(tPic, (floor(t) + f) / res);
  }`;

const SNAP = { lut: 0, loop: 1, off: 2 };
const quad = (frag, uniforms) => new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
  glslVersion: THREE.GLSL3, depthTest: false, depthWrite: false, uniforms, vertexShader: QUAD_VERT, fragmentShader: frag,
}));

/** The palette as a palCount × 1 texture of its sRGB bytes (read raw: no colour conversion). */
function paletteTexture(palette) {
  const d = new Uint8Array(palette.length * 4);
  palette.forEach((c, i) => { d[i * 4] = (c >> 16) & 255; d[i * 4 + 1] = (c >> 8) & 255; d[i * 4 + 2] = c & 255; d[i * 4 + 3] = 255; });
  const t = new THREE.DataTexture(d, palette.length, 1);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
}

/**
 * The stage's targets and passes for a picture W × H: rt (the scene pass: colour, part IDs, depth),
 * the composite into rtOut, the blit to the canvas. { palette, outline, grade, gamma: '2.2' | 'srgb',
 * snap: 'lut' | 'loop' | 'off', near, far }.
 */
export function createPost(renderer, W, H, { palette, outline = true, grade = 1, gamma = '2.2', snap = 'lut', near = 1, far = 200 } = {}) {
  const rt = new THREE.WebGLRenderTarget(W, H, { count: 2, type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
    depthTexture: new THREE.DepthTexture(W, H) });
  rt.textures[1].type = THREE.UnsignedByteType;                      // (the part IDs: three bytes and a flag, exact)
  rt.textures[1].name = 'partIds';
  const rtOut = new THREE.WebGLRenderTarget(W, H, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false });
  const [LW, LH] = lutSize(LUT_LEVELS, LUT_TILES);
  const rtLut = new THREE.WebGLRenderTarget(LW, LH, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false });
  let pal = paletteTexture(palette);

  const U = {
    tColor: { value: rt.textures[0] }, tId: { value: rt.textures[1] }, tDepth: { value: rt.depthTexture },
    tLut: { value: rtLut.texture }, tPal: { value: pal }, palCount: { value: palette.length },
    lutN: { value: LUT_LEVELS }, lutTiles: { value: LUT_TILES }, snapMode: { value: SNAP[snap] ?? 0 },
    res: { value: new THREE.Vector2(W, H) }, near: { value: near }, far: { value: far },
    outline: { value: outline ? 1 : 0 }, grade: { value: grade }, srgb: { value: gamma === 'srgb' ? 1 : 0 },
    tFog: { value: null }, fogOn: { value: 0 }, fogBox: { value: new THREE.Vector4(0, 0, 1, 1) }, dimK: { value: 0.48 }, eyeGain: { value: 1 }, eyeCone: { value: 1 }, eyeRod: { value: 0 }, eyeGlare: { value: 0 },
    invVP: { value: new THREE.Matrix4() }, peoplePart: { value: new THREE.Vector3(...PEOPLE_ID) },
  };
  const post = new THREE.Scene(), out = new THREE.Scene(), bakeScene = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const composite = quad(POST_FRAG, U);
  post.add(composite);
  const BU = { tPal: U.tPal, palCount: U.palCount, lutN: U.lutN, lutTiles: U.lutTiles };
  const baker = quad(BAKE_FRAG, BU);
  bakeScene.add(baker);
  const blit = quad(BLIT_FRAG, { tPic: { value: rtOut.texture }, res: { value: new THREE.Vector2(W, H) }, scale: { value: new THREE.Vector2(1, 1) }, crop: { value: new THREE.Vector4(0, 0, W, H) } });
  let pw = W, ph = H, ow = W, oh = H, cropped = null;
  const fitBlit = () => {
    const B = blit.material.uniforms, c = cropped ?? [0, 0, pw, ph];
    B.crop.value.set(c[0], c[1], c[2], c[3]);
    B.scale.value.set(ow / c[2], oh / c[3]);
  };
  out.add(blit);

  /** Bake the palette's lookup (once per palette: a 512 × 512 pass, no upload but the palette's few bytes). */
  function bake(palette2 = null) {
    if (palette2) { pal.dispose(); pal = paletteTexture(palette2); U.tPal.value = pal; U.palCount.value = palette2.length; }
    renderer.setRenderTarget(rtLut);
    renderer.render(bakeScene, cam);
    renderer.setRenderTarget(null);
  }
  /** The composite, after the scene pass (camera: the scene's, for the fog's world positions). */
  function compose(camera) {
    U.invVP.value.multiplyMatrices(camera.matrixWorld, camera.projectionMatrixInverse);
    renderer.setRenderTarget(rtOut);
    renderer.render(post, cam);
  }
  function present() {
    renderer.setRenderTarget(null);
    renderer.render(out, cam);
  }
  function size(w, h, outW, outH) {
    for (const t of [rt, rtOut]) t.setSize(w, h);
    U.res.value.set(w, h);
    blit.material.uniforms.res.value.set(w, h);
    pw = w; ph = h; ow = outW; oh = outH; cropped = null;
    fitBlit();
  }
  /** Show a rectangle of the picture (x, y from its bottom-left, w × h, in picture pixels) over the whole canvas; null: all of it. */
  function setCrop(x = null, y = 0, w = pw, h = ph) {
    cropped = x === null ? null : [x, y, Math.max(1, w), Math.max(1, h)];
    fitBlit();
  }
  const setFog = (tex, x0 = 0, z0 = 0, w = 1, h = 1, dimK = 0.48) => { U.tFog.value = tex; U.fogOn.value = tex ? 1 : 0; U.fogBox.value.set(x0, z0, w, h); U.dimK.value = dimK; };
  /** The eye (see the header, step 0): its gain against v0.0.4's exposure (the rods'), the cones' (never over it), the rods' share of vision, 0 to 1, and the glare, log units over the adapted level (0 at rest). */
  const setEye = (gain = 1, rod = 0, cone = gain, glare = 0) => {
    U.eyeGain.value = Number.isFinite(gain) ? gain : 1;
    U.eyeCone.value = Number.isFinite(cone) ? Math.min(cone, U.eyeGain.value) : U.eyeGain.value;
    U.eyeRod.value = Math.max(0, Math.min(1, rod || 0)); U.eyeGlare.value = Math.max(0, glare || 0);
  };
  function dispose() {
    for (const t of [rt, rtOut, rtLut]) t.dispose();
    rt.depthTexture.dispose(); pal.dispose();
    for (const m of [composite, baker, blit]) { m.geometry.dispose(); m.material.dispose(); }
  }
  return { rt, rtOut, rtLut, U, bake, compose, present, size, setFog, setEye, setCrop, dispose,
    get crop() { return cropped; },
    setSnap: (s) => { U.snapMode.value = SNAP[s] ?? 0; }, setGamma: (g) => { U.srgb.value = g === 'srgb' ? 1 : 0; } };
}
