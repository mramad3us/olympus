// OLYMPUS render: the post pass. Outlines, the fog of awareness, the grade, the palette, the blit.
//
// tradecraft's composite (src/art/pixelart.js), in its order, over the picture the scene pass drew
// into two attachments (colour, HalfFloat; part IDs, RGBA8; src/render/materials.js) and a depth texture:
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
// make some pixels a screen pixel wider and they would crawl as the camera moves).
// Every read is a texelFetch at the pixel's own texel: the post pass never filters.
import * as THREE from 'three';
import { LUT_LEVELS, LUT_TILES, lutSize } from '../art/palette.js';

/** How far a kept pixel over the figure behind a mass goes toward the ink (VIEWS §2.10: its silhouette at 60%). */
export const SILHOUETTE_K = 0.6;
/** The people's part (src/render/cards.js PEOPLE_PART) as the ID pass writes it: three bytes. */
const PEOPLE_ID = [0xa5, 0xa5, 0xa5].map(b => b / 255);

const QUAD_VERT = `out vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const POST_FRAG = /* glsl */`
  precision highp float; precision highp int; precision highp sampler2D;
  in vec2 vUv; out vec4 outColor;
  uniform sampler2D tColor, tDepth, tId, tFog, tLut, tPal;
  uniform vec2 res; uniform float near, far, outline, grade, fogOn, dimK, srgb;
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
    vec3 col = encode(clamp(texelFetch(tColor, ip, 0).rgb, 0.0, 1.0));
    float raw = texelFetch(tDepth, ip, 0).r, d = lin(raw);
    vec2 uv = (vec2(ip) + 0.5) / res;
    vec4 w4 = invVP * vec4(uv * 2.0 - 1.0, raw * 2.0 - 1.0, 1.0);
    vec3 wp = w4.xyz / w4.w;
    if (fogOn > 0.5 && raw < 0.99999) {
      vec2 fp = wp.xz + vec2(0.0, clamp(wp.y, 0.0, 1.0) * 0.5);
      vec2 fv = texture(tFog, (fp - fogBox.xy) / fogBox.zw).rg;
      if (fv.r < bayer(gl_FragCoord.xy)) col = dim(col);
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
  uniform sampler2D tPic; uniform vec2 res, scale;
  void main() {
    vec2 t = vUv * res, c = fract(t) - 0.5, edge = 0.5 - 0.5 / max(scale, vec2(1.0));
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
    tFog: { value: null }, fogOn: { value: 0 }, fogBox: { value: new THREE.Vector4(0, 0, 1, 1) }, dimK: { value: 0.48 },
    invVP: { value: new THREE.Matrix4() }, peoplePart: { value: new THREE.Vector3(...PEOPLE_ID) },
  };
  const post = new THREE.Scene(), out = new THREE.Scene(), bakeScene = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const composite = quad(POST_FRAG, U);
  post.add(composite);
  const BU = { tPal: U.tPal, palCount: U.palCount, lutN: U.lutN, lutTiles: U.lutTiles };
  const baker = quad(BAKE_FRAG, BU);
  bakeScene.add(baker);
  const blit = quad(BLIT_FRAG, { tPic: { value: rtOut.texture }, res: { value: new THREE.Vector2(W, H) }, scale: { value: new THREE.Vector2(1, 1) } });
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
    blit.material.uniforms.scale.value.set(outW / w, outH / h);
  }
  const setFog = (tex, x0 = 0, z0 = 0, w = 1, h = 1, dimK = 0.48) => { U.tFog.value = tex; U.fogOn.value = tex ? 1 : 0; U.fogBox.value.set(x0, z0, w, h); U.dimK.value = dimK; };
  function dispose() {
    for (const t of [rt, rtOut, rtLut]) t.dispose();
    rt.depthTexture.dispose(); pal.dispose();
    for (const m of [composite, baker, blit]) { m.geometry.dispose(); m.material.dispose(); }
  }
  return { rt, rtOut, rtLut, U, bake, compose, present, size, setFog, dispose,
    setSnap: (s) => { U.snapMode.value = SNAP[s] ?? 0; }, setGamma: (g) => { U.srgb.value = g === 'srgb' ? 1 : 0; } };
}
