// OLYMPUS render: the far window. A round inset at the frame's edge on a far point you aim at, bracket or look at: the stage again, there.
//
// VIEWS §2.4 and TECH §9.9 (the build sheet 0.0.7 §2.4 (a), §8 items 20 and 25). Marines qualify at 200 to 500 m
// and the frame reaches 20 m east-west of its centre: when the player aims at, brackets or looks (E held) at a
// point in sight outside the frame, the hud's placer (src/ui/hud/layout.js placeFar) puts a disc on the frame's
// edge along the bearing, clear of every HUD rectangle, and main.js hands it to the view (view.setFar), which
// draws it here:
//   - THE CAMERA: a second orthographic camera of the stage's (src/render/camera.js), the same 45° and the same
//     density, centred on the far point (its height too: a point at height y shows where the ground at z − y
//     does), into a target pair of 2 × FAR_R_PX square (colour, part IDs and depth: a post.js createPost of its
//     own, sharing the stage's palette lookup), rendered after the stage's own composite and before its blit
//     (the stage's post.compose wrapped: attach()), so the window goes through the same post program: the same
//     outlines, the eye, the grade and the palette snap;
//   - ITS GROUND: the stage's chunks are built round the camera only (REACH_M), so the window keeps chunks of
//     its own round the far point (the paint worker's 'chunk' job, the same as chunks.js asks, through the
//     frame's upload queue): the chunks under the window and those holding a piece that reaches into it (a
//     piece is drawn whole by the chunk its middle is in: the KD's 100 m parapet and pits). They are drawn
//     only by the window's camera, the stage's own chunks hidden for its pass. prebuild() asks for a list
//     ahead (the KD's target line at the range's entry, TECH §9.9); a far point's own come first;
//   - THE FOG: its own FAR_FOG_N 24 × 24 cells of 0.5 m round the point (render/fog.js), filled by the view
//     from perception's visibility where perception reaches (its SIGHT_M + LIGHT_M, about 54 m by day) and
//     beyond it by the open air's light (farReachM: a daylight eye sees FAR_LOAD_M 600 m on the open valley
//     floor; at night the light's share of it), times the optic's OPTIC_FOG_K (4 at the SO-4's 4×: the optic
//     lifts the fog inside the window). My call: perception.js stops at 54 m, which the range's 300 m outruns;
//   - OPENING: never a pop. It opens only once every chunk under the point is up (ready), then dissolves in
//     over FAR_DISSOLVE_S 0.2 s through a 4 × 4 Bayer threshold, and out the same way when the point goes;
//   - THE FRAME: a 1 px ink ring and a 3 px bezel (a tick on it along the true bearing, when the placer slid
//     the disc off it); with the SO-4 up, its reticle: the crosswires through the hold (the reticle drawn
//     offset by the hold, so the point held is where the wires cross), 0.5 mrad ticks along them at the face's
//     scale (KD faces are drawn FACE_K times life size: a mil at 300 m is 0.3 m, 9.6 px at 16 px/m), and the
//     optic's field (OPTIC_FIELD_DEG: 6.5° at 4×) where it is narrower than the window, black beyond.
// What it costs (TECH §9.9: +3 ms GPU, +60 draw calls at most): the window's scene pass over its few chunks,
// the people and the range's pixels, its post pass on 158 × 158 pixels, and one composite quad.
// The pure parts (the sizes, the field, the fog's box and law, the dissolve, a world point to the window's
// pixel, the hud's CSS disc to the picture's) are exported for the tests in node.
// far.js imports nothing of three.js: the stage's modules it draws with (the camera, the post, the fog's mask, the
// batch, the materials' patch) are handed to createFar by the view (gpu), so the tests load the pure parts in node.
import { RES } from './scale.js';
import { indexGround, pieceOf, chunkAt, chunkRect, CHUNK_M } from '../art/terrain/base.js';
import { runJob } from '../art/jobs.js';

/** The window's radius, a share of the picture's height at the density: 79 px at 640 × 360, 119 at 960 × 540 (VIEWS §2.4). */
export const FAR_R_K = 0.22, FAR_R_PX = Math.round(FAR_R_K * RES[1]);
/** The dissolve in and out, seconds of real time; the farthest point the window opens on, metres (VIEWS §2.4). */
export const FAR_DISSOLVE_S = 0.2, FAR_LOAD_M = 600;
/** The window's fog: cells a side and their size, metres (VIEWS §2.4). */
export const FAR_FOG_N = 24, FAR_FOG_CELL_M = 0.5;
/** The optic's lift of the fog (perception's reach times this) and its field, degrees across, by the SO-4's lever (WEAPONS §3.5; 6.5° at 4×, my call). */
export const OPTIC_FOG_K = Object.freeze({ 1: 1, 4: 4 }), OPTIC_FIELD_DEG = Object.freeze({ 1: 0, 4: 6.5 });
/** The ring, the bezel and the bearing's tick, pixels (VIEWS §2.4). */
export const FAR_RING_PX = 1, FAR_BEZEL_PX = 3, FAR_TICK_PX = 3;
/** Perception's reach, past which the window's fog is the open air's law (perception.js SIGHT_M + LIGHT_M + REACH_SOFT_M). */
export const NEAR_REACH_M = 54;
/** The window's chunks kept at most (the KD's target line is 8: its parapet's and pits' too). */
export const FAR_CHUNKS_MAX = 12;
/** The far point's chunks are asked of the worker ahead of everything but your own figure. */
const PRIORITY = 'own';

// ---------- the pure parts ----------

/** The optic's field radius in the window, pixels at the far point's range (Infinity with none: the window's own 4.9 m). */
export function farFieldPx(rangeM, optic = 1, ppm = 16) {
  const deg = OPTIC_FIELD_DEG[optic] ?? 0;
  return deg > 0 ? Math.max(4, rangeM * Math.tan(deg / 2 * Math.PI / 180) * ppm) : Infinity;
}
/** The window's fog cells round a point: { x0, z0, nx, nz, cellM }, the box snapped to the cells' grid. */
export function farFogBox(x, z) {
  const half = FAR_FOG_N * FAR_FOG_CELL_M / 2;
  return { x0: Math.floor((x - half) / FAR_FOG_CELL_M) * FAR_FOG_CELL_M, z0: Math.floor((z - half) / FAR_FOG_CELL_M) * FAR_FOG_CELL_M, nx: FAR_FOG_N, nz: FAR_FOG_N, cellM: FAR_FOG_CELL_M };
}
/** How far the open air lets an eye see (metres) in a light level L (places' lightLevel, 1 in daylight) with the eye's lightK and the optic: FAR_LOAD_M by day. */
export function farReachM(L, lightK = 1, optic = 1) {
  const Le = Math.max(0, Math.min(1, L * lightK));
  return Math.min(FAR_LOAD_M, Math.max(10, FAR_LOAD_M * Le) * (OPTIC_FOG_K[optic] ?? 1));
}
/**
 * The window's fog values (a Float32Array of nx × nz, 0 unseen to 1 seen): perception's visibility (vis(x, z))
 * within NEAR_REACH_M of the eye, the open air's reach beyond it (light(x, z): places' level there), softened over
 * the last 5% of it; the optic's factor on both (a cell perception leaves dark within its reach is lifted only by
 * the optic's reach, never through a wall: a blocked line stays dark, linePass(x, z) says so where given).
 */
export function farFogCells(box, eye, { vis, light, optic = 1, linePass = null }) {
  const out = new Float32Array(box.nx * box.nz), K = OPTIC_FOG_K[optic] ?? 1;
  for (let j = 0; j < box.nz; j++) for (let i = 0; i < box.nx; i++) {
    const x = box.x0 + (i + 0.5) * box.cellM, z = box.z0 + (j + 0.5) * box.cellM, d = Math.hypot(x - eye.x, z - eye.z);
    let v;
    if (d < NEAR_REACH_M && K === 1) v = vis(x, z);
    else if (linePass && !linePass(x, z)) v = 0;
    else { const R = farReachM(light(x, z), eye.lightK ?? 1, optic); v = Math.max(0, Math.min(1, (R - d) / (0.05 * R))); if (d < NEAR_REACH_M) v = Math.max(v, vis(x, z)); }
    out[j * box.nx + i] = v;
  }
  return out;
}
/** The dissolve: alpha after dtS seconds toward open (1) or shut (0); it opens only when ready. */
export function dissolveStep(alpha, dtS, open, ready = true) {
  const step = (dtS > 0 ? dtS : 0) / FAR_DISSOLVE_S;
  return open && ready ? Math.min(1, alpha + step) : Math.max(0, alpha - step);
}
/** A world point (x, y, z) in the window centred on (cx, cy, cz): [dx, dy] pixels from its centre (x right, y down). */
export function farPixelOf(c, x, y, z, ppm = 16) {
  return [(x - c.x) * ppm, ((z - y) - (c.z - c.y)) * ppm];
}
/**
 * The hud's disc (cx, cy, rCss: CSS pixels of the window) in the picture's pixels: { cx, cy, r } (from its top-left),
 * given the canvas's rectangle on the page { left, top, width, height } and the picture W × H; r capped at FAR_R_PX.
 */
export function pictOfCss(d, rect, W, H) {
  const sx = W / Math.max(1, rect.width), sy = H / Math.max(1, rect.height);
  return { cx: Math.round((d.cx - rect.left) * sx), cy: Math.round((d.cy - rect.top) * sy), r: Math.max(8, Math.min(FAR_R_PX, Math.round((d.rCss ?? FAR_R_PX / sx) * sx))) };
}
/** The chunks the window needs round (x, z), with a window of rM metres: [[cx, cz]] (its own ground, and its tall things' south up to tallM). */
export function farChunks(x, z, rM, { tallM = 10, pieces = [], sizes = {} } = {}) {
  const r = { x0: x - rM - 1, x1: x + rM + 1, z0: z - rM - 1, z1: z + rM + tallM };
  const keys = new Map();
  const [ax, az] = chunkAt(r.x0, r.z0), [bx, bz] = chunkAt(r.x1, r.z1);
  for (let cz = az; cz <= bz; cz++) for (let cx = ax; cx <= bx; cx++) keys.set(`${cx},${cz}`, [cx, cz]);
  // (a piece that reaches into the window is drawn by the chunk its middle is in)
  for (const p of pieces) {
    const k = sizes[p.kind], W = p.w ?? k?.w ?? 0, D = p.d ?? k?.d ?? 0, side = p.face === 'left' || p.face === 'right', hw = (side ? D : W) / 2, hd = (side ? W : D) / 2;
    if (p.x + hw < r.x0 || p.x - hw > r.x1 || p.z + hd < r.z0 || p.z - hd > r.z1) continue;
    const [cx, cz] = chunkAt(p.x, p.z);
    keys.set(`${cx},${cz}`, [cx, cz]);
  }
  return [...keys.values()];
}

// ---------- the window on the stage ----------

const COMPOSITE_FRAG = /* glsl */`
  precision highp float; precision highp int; precision highp sampler2D;
  out vec4 outColor;
  uniform sampler2D tFar; uniform vec2 corner; uniform float R, alpha, field, ring, bezel, tickRad, tickOn, reticle, milPx;
  uniform vec2 hold; uniform vec3 inkC, bezelC, bezelL, bezelD, wireC, wireL, blackC;
  float bayer(vec2 p) {
    int i = int(mod(p.x, 4.0)) + 4 * int(mod(p.y, 4.0));
    float m[16] = float[16](0., 8., 2., 10., 12., 4., 14., 6., 3., 11., 1., 9., 15., 7., 13., 5.);
    return (m[i] + 0.5) / 16.0;
  }
  void main() {
    vec2 q = floor(gl_FragCoord.xy) - corner;            // (the window's texel, from its bottom-left)
    vec2 p = q + 0.5 - vec2(R);                           // (from its centre, y up)
    float d = length(p);
    if (d > R + ring + bezel || alpha <= bayer(gl_FragCoord.xy)) discard;
    vec3 c;
    if (d > R + ring) {
      // (the bezel: lit on its top, dark on its bottom; the bearing's tick across it)
      float a = atan(p.y, p.x), t = abs(mod(a - tickRad + 3.14159265, 6.2831853) - 3.14159265) * d;
      c = p.y > R * 0.35 ? bezelL : p.y < -R * 0.35 ? bezelD : bezelC;
      if (tickOn > 0.5 && t < 1.0) c = inkC;
    } else if (d > R) c = inkC;
    else if (d > field) c = blackC;                       // (outside the optic's field: the scope's tube)
    else {
      c = texelFetch(tFar, ivec2(q), 0).rgb;
      if (reticle > 0.5) {
        // (the crosswires through the hold, a gap at their middle; 0.5 mrad ticks along them, longer each mil)
        vec2 w = q + 0.5 - vec2(R) - hold;
        float ax = abs(w.x), ay = abs(w.y), wire = 0.0;
        if ((ax < 0.5 && ay > 1.5) || (ay < 0.5 && ax > 1.5)) wire = 1.0;
        float h = milPx * 0.5;
        if (h >= 2.0) {
          float tx = abs(mod(w.x + h * 0.5, h) - h * 0.5), ty = abs(mod(w.y + h * 0.5, h) - h * 0.5);
          bool major = abs(mod(w.x + milPx * 0.5, milPx) - milPx * 0.5) < 0.5, majorY = abs(mod(w.y + milPx * 0.5, milPx) - milPx * 0.5) < 0.5;
          if (tx < 0.5 && ay < (major ? 2.0 : 1.0) && ax < 6.0 * milPx) wire = 1.0;
          if (ty < 0.5 && ax < (majorY ? 2.0 : 1.0) && ay < 6.0 * milPx) wire = 1.0;
        }
        if (wire > 0.5) c = dot(c, vec3(0.30, 0.59, 0.11)) < 0.3 ? wireL : wireC;
      }
    }
    outColor = vec4(c, 1.0);
  }`;
const QUAD_VERT = `void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const ZERO4 = new Float32Array(4);

/**
 * The far window on a stage: { attach(), setGround(area), prebuild(points), set(view | null), frame(dtS), setFog(vis,
 * box, dimK), state, stats, group, warm(), dispose() }. opts: painter (the paint worker; none: the chunks are laid
 * here, whole), uploads (the frame's queue), ppm, chunksGroup (the stage's own chunks, hidden for the window's pass).
 * set(view): { x, y, z, rangeM, cx, cy, r (picture pixels, from the top-left), optic, hold: [xMil, yMil], tickRad, key, faceK }.
 * gpu: { createCamera, createPost, createFogMask, areaFromJob, reserveParts, partsPerChunk, ensurePart, olyMaterial, isOly }.
 */
export function createFar(stage, gpu, { painter = null, uploads = null, ppm = stage.ppm, chunksGroup = null } = {}) {
  const THREE = stage.THREE, renderer = stage.renderer, gl = renderer.getContext();
  const { createCamera, createPost, createFogMask, areaFromJob, reserveParts, partsPerChunk, ensurePart, olyMaterial, isOly } = gpu;
  const R = FAR_R_PX, S = 2 * R;
  const cam = createCamera(S, S, { ppm, near: stage.camera.near, far: stage.camera.far });
  // (the window's post: the stage's program on its own small targets, the palette's lookup shared, never baked again)
  let farPost = null;
  const group = new THREE.Group();
  group.name = 'far';
  group.visible = false;
  stage.scene.add(group);
  // (palette colours as the picture holds them after its snap, so the composite writes the palette's own bytes)
  const C3 = (h) => new THREE.Vector3(((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255);
  const U = {
    tFar: { value: null }, corner: { value: new THREE.Vector2(0, 0) }, R: { value: R }, alpha: { value: 0 }, field: { value: R + 1 },
    ring: { value: FAR_RING_PX }, bezel: { value: FAR_BEZEL_PX }, tickRad: { value: 0 }, tickOn: { value: 0 }, reticle: { value: 0 }, milPx: { value: 9.6 },
    hold: { value: new THREE.Vector2(0, 0) },
    inkC: { value: C3(0x14151c) }, bezelC: { value: C3(0x7c736b) }, bezelL: { value: C3(0xb7b0a8) }, bezelD: { value: C3(0x49403e) },
    wireC: { value: C3(0x1a1214) }, wireL: { value: C3(0xdad0bc) }, blackC: { value: C3(0x14151c) },
  };
  const comp = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, depthTest: false, depthWrite: false, uniforms: U, vertexShader: QUAD_VERT, fragmentShader: COMPOSITE_FRAG }));
  comp.frustumCulled = false;
  const compScene = new THREE.Scene(), quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  compScene.add(comp);

  // ---------- its chunks ----------
  let ground = null, index = null, massBase = 0, fencePart = 0, pieceSizes = {};
  const chunks = new Map();                                         // key → { cx, cz, state, built, promise, usedAt }
  let frameNo = 0;
  const stats = { open: false, alpha: 0, ready: false, chunks: 0, building: 0, drawn: 0, calls: 0, ms: 0, key: null, rangeM: null, r: R, fogMs: 0 };
  function setGround(area, sizes = {}) {
    if (ground === area) return;
    for (const c of chunks.values()) drop(c);
    chunks.clear();
    ground = area; pieceSizes = sizes;
    index = area ? indexGround(area) : null;
    massBase = area ? reserveParts((area.massing?.length ?? 0) + 2) : 0;
    fencePart = massBase + (area?.massing?.length ?? 0);
  }
  function drop(c) {
    if (c.built) { c.built.dispose(); c.built = null; }
    if (uploads && c.state === 'queued') uploads.cancel(`far:${c.key}`);
    c.state = 'gone';
  }
  function ask(cx, cz, priority = PRIORITY) {
    const key = `${cx},${cz}`;
    let c = chunks.get(key);
    if (c) { c.usedAt = frameNo; return c; }
    if (!index || cx < index.cx0 || cx > index.cx1 || cz < index.cz0 || cz > index.cz1) return null;
    c = { key, cx, cz, state: 'asked', built: null, usedAt: frameNo, g: ground };
    chunks.set(key, c);
    const args = { piece: pieceOf(ground, index, cx, cz), ppm, partBase: reserveParts(partsPerChunk), massBase, fencePart };
    c.promise = (painter ? painter.run('chunk', args, { priority }) : Promise.resolve(runJob('chunk', args))).then((r) => {
      if (c.state !== 'asked' || c.g !== ground) return;
      c.built = areaFromJob(r, { name: `far:${key}` });
      const bytes = c.built.atlas.bytes + (r.meta.stats.vertices ?? 0) * 17 * 4;
      const show = () => {
        if (c.state !== 'queued') return;
        c.built.upload(renderer); c.built.atlas.release();
        for (const m of c.built.meshes) { m.castShadow = false; }
        group.add(c.built.group);
        c.built.group.traverse(o => { if (o.isMesh) { ensurePart(o); for (const m of [o.material].flat()) if (m && !isOly(m)) olyMaterial(m, { see: false }); } });
        c.state = 'shown';
      };
      c.state = 'queued';
      if (uploads) uploads.queue({ key: `far:${key}`, bytes, run: show }); else show();
    }, (e) => { console.warn(`far: chunk ${key} did not build`, e); chunks.delete(key); });
    return c;
  }
  // (the oldest unused chunks dropped past FAR_CHUNKS_MAX; those wanted now never)
  function trim(want) {
    if (chunks.size <= FAR_CHUNKS_MAX) return;
    const old = [...chunks.values()].filter(c => !want.has(c.key)).sort((a, b) => a.usedAt - b.usedAt);
    while (chunks.size > FAR_CHUNKS_MAX && old.length) { const c = old.shift(); drop(c); chunks.delete(c.key); }
  }
  /** Ask for the chunks round each of a list of points ({ x, z }) ahead, at a lower priority (the KD's target line at the range's entry). */
  function prebuild(points) {
    if (!ground) return 0;
    let n = 0;
    for (const p of points) for (const [cx, cz] of farChunks(p.x, p.z, R / ppm, { pieces: ground.pieces ?? [], sizes: pieceSizes })) if (!chunks.has(`${cx},${cz}`) && ask(cx, cz, 'area')) n++;
    return n;
  }

  // ---------- the view, the dissolve, the pass ----------
  let view = null, shown = null, alpha = 0, ready = false, fogMask = null;
  /** The far point and its disc (see above), or null to close it. */
  function set(v) { view = v && Number.isFinite(v.x) && Number.isFinite(v.z) && (v.rangeM ?? 0) <= FAR_LOAD_M ? v : null; }
  /** The window's fog: values from farFogCells over box, the night's dimming. */
  function setFog(vis, box, dimK = 0.48, dtS = Infinity) {
    farPost ??= makePost();
    fogMask ??= createFogMask({ nx: box.nx, nz: box.nz, cellM: box.cellM });
    fogMask.place(box.x0, box.z0);
    fogMask.setSeen(vis);
    fogMask.ease(dtS);
    const [tex, x0, z0, w, h] = fogMask.upload();
    farPost.setFog(tex, x0, z0, w, h, dimK);
  }
  /** A frame's step (dtS: real seconds): the chunks under the point asked for and the dissolve stepped. Returns the state. */
  function frame(dtS) {
    frameNo++;
    if (view) {
      const want = farChunks(view.x, view.z - (view.y ?? 0), R / ppm, { pieces: ground?.pieces ?? [], sizes: pieceSizes });
      const keys = new Set(want.map(([cx, cz]) => `${cx},${cz}`));
      let all = !!ground;
      for (const [cx, cz] of want) { const c = ask(cx, cz); if (c) all = all && c.state === 'shown'; }   // (none: outside the ground, nothing to build)
      trim(keys);
      // (the same point followed (its disc, its hold); a new one taken once its chunks are up, the old one dissolving out meanwhile)
      if (shown && shown.key === view.key) shown = view;
      else if (all && alpha <= 0) shown = view;
      ready = all;
    } else ready = false;
    alpha = dissolveStep(alpha, dtS, !!view && (shown?.key === view?.key), ready);
    if (alpha <= 0 && !view) shown = null;
    let building = 0, n = 0;
    for (const c of chunks.values()) { n++; if (c.state !== 'shown') building++; }
    stats.pending = [...chunks.values()].filter(c => c.state !== 'shown').map(c => `${c.key}:${c.state}`);
    Object.assign(stats, { open: alpha > 0 && !!shown, alpha: Math.round(alpha * 1000) / 1000, ready, chunks: n, building, key: shown?.key ?? null, rangeM: shown?.rangeM ?? null });
    return stats;
  }
  // (the window's pass, inside the stage's composite: its scene, its post, its disc over the picture)
  function draw() {
    if (!(alpha > 0) || !shown) { stats.drawn = 0; return; }
    const t0 = performance.now(), W = stage.W, H = stage.H, v = shown;
    farPost ??= makePost();
    // (the stage's eye, grade and snap on the window's post too)
    const M = stage.post.U, F = farPost.U;
    for (const k of ['eyeGain', 'eyeCone', 'eyeRod', 'eyeGlare', 'grade', 'outline', 'srgb', 'snapMode', 'palCount', 'dimK']) F[k].value = M[k].value;
    F.tPal.value = M.tPal.value; F.tLut.value = M.tLut.value;
    if (!fogMask) F.fogOn.value = 0;
    cam.look(v.x, v.z, v.y ?? 0);
    const was = renderer.getRenderTarget(), callsBefore = renderer.info.render.calls;
    const mainChunks = chunksGroup ? chunksGroup.visible : null;
    if (chunksGroup) chunksGroup.visible = false;
    group.visible = true;
    renderer.setRenderTarget(farPost.rt);
    renderer.clear(true, true, false);
    gl.clearBufferfv(gl.COLOR, 1, ZERO4);
    renderer.render(stage.scene, cam.camera);
    group.visible = false;
    if (chunksGroup) chunksGroup.visible = mainChunks;
    farPost.compose(cam.camera);
    // (the disc over the picture, before the blit)
    const cx = Math.round(v.cx ?? W - R - 8), cy = Math.round(v.cy ?? H / 2), r = Math.max(8, Math.min(R, Math.round(v.r ?? R)));
    U.tFar.value = farPost.rtOut.texture;
    U.corner.value.set(cx - R, (H - cy) - R);
    U.R.value = R; U.alpha.value = alpha;
    // (a disc smaller than the window's target: the hud's, at a picture smaller than the density's own: the field cut to it)
    const fieldPx = Math.min(farFieldPx(v.rangeM ?? 0, v.optic ?? 1, ppm), r);
    U.field.value = Number.isFinite(fieldPx) ? fieldPx : R + 1;
    U.reticle.value = (v.optic ?? 1) > 1 ? 1 : 0;
    U.milPx.value = (v.rangeM ?? 300) / 1000 * (v.faceK ?? 1) * ppm;
    const hold = v.hold ?? [0, 0];
    U.hold.value.set(Math.round((hold[0] ?? 0) * U.milPx.value), Math.round((hold[1] ?? 0) * U.milPx.value));
    U.tickOn.value = Number.isFinite(v.tickRad) ? 1 : 0; U.tickRad.value = Number.isFinite(v.tickRad) ? -v.tickRad : 0;
    renderer.setRenderTarget(stage.post.rtOut);
    renderer.render(compScene, quadCam);
    renderer.setRenderTarget(was);
    stats.drawn = 1; stats.calls = renderer.info.render.calls - callsBefore; stats.ms = performance.now() - t0;
    stats.centre = [cx, cy]; stats.rPict = r;
  }
  function makePost() {
    const p = createPost(renderer, S, S, { palette: [0x14151c], near: stage.camera.near, far: stage.camera.far });
    p.rtLut.dispose();                                              // (the stage's lookup is read instead: tLut each pass)
    return p;
  }
  /** Wrap the stage's composite so the window is drawn into the picture after it and before the blit. */
  function attach() {
    const post = stage.post;
    if (post.$far) return;
    const compose0 = post.compose;
    post.compose = (camera) => { compose0(camera); draw(); };
    post.$far = true;
  }
  /** Compile the composite's program (and the window's post's, the stage's own) at boot. */
  function warm() {
    farPost ??= makePost();
    try { renderer.compile(compScene, quadCam); } catch (e) { console.warn('far: warm-up', e); }
  }
  return {
    attach, setGround, prebuild, set, frame, setFog, warm, group, stats, R,
    /** What the view's farState() reports. */
    get state() { return { open: alpha > 0 && !!shown, alpha, ready, rPict: stats.rPict ?? R, centrePict: stats.centre ?? null }; },
    get view() { return shown; },
    dispose() {
      for (const c of chunks.values()) drop(c);
      chunks.clear();
      farPost?.dispose(); fogMask?.dispose();
      comp.geometry.dispose(); comp.material.dispose();
      group.removeFromParent();
    },
  };
}
export { CHUNK_M, chunkRect };
