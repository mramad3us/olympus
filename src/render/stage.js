// OLYMPUS render: the pixel stage. tradecraft's look (src/art/pixelart.js pixelStage), parametrised and faster.
//
// The close-up view (DESIGN.md, Space and scales): a small picture at PX_PER_M pixels a metre
// (src/render/scale.js: 16 px/m at 640 × 360 or 24 px/m at 960 × 540, by ?ppm=), drawn by three.js
// through an orthographic camera looking north and 45° down (src/render/camera.js), lit by a toon
// light calibrated so a face toward the camera shows its painted colour (src/render/lights.js,
// src/render/moods.js), outlined where parts meet and where depth jumps, dimmed where the character
// is not looking (the fog of awareness), every pixel snapped to the active palette, and shown at any
// window size sharp-bilinear (src/render/post.js). Detail is painted, not modelled (src/art/paint.js).
//
// A frame, in order (render()):
//   1. any mesh new to the scene gets a part attribute and its material the stage's patch
//      (src/render/materials.js: plain three.js meshes just work, outlined by their userData.part);
//   2. the lamp slots go to the lamps nearest the camera, the sun to its step; the shadow map is
//      redrawn only when that step changes or the area does;
//   3. the scene, once, into two attachments (colour and part IDs) and depth: where tradecraft drew
//      it twice (colour, then every mesh again in a flat ID colour), this draws it once (WebGL2 MRT);
//   4. the composite into the finished picture; 5. the blit to the canvas.
// An area's static boxes are one draw call (src/render/batch.js), so a room is a handful of calls a
// frame where tradecraft's furnished flat was 821.
//
// What the game sets (all plain values): look(x, z) or follow(x, z, dtS) and setLead(dx, dz) (the
// eye-lead hook); setMood(name | mood); setArea(area) (its group, lamps and strip-light map);
// setFocus({ x, z, h, w }) (the figure seen through to: things between it and the camera are drawn
// see-through); setFog(texture, x0, z0, w, h, dimK) (the fog of awareness, src/render/fog.js);
// setPalette(name | colours). stats holds the last frame's draw calls, triangles and milliseconds.
//
// The GPU's time by pass (TECH §16.5), where the browser offers EXT_disjoint_timer_query_webgl2
// (src/render/stats.js createPassTimer): a query round the shadow map (only in a frame that redraws
// it: three draws it inside render(), so its shadowMap.render is wrapped to time it), the scene, the
// composite (post) and the blit. stats.passes is the latest frame the GPU has answered for, { shadowMs
// (the last redraw's), sceneMs, postMs, blitMs }, or null where there is no timer (stats.timer false).
import * as THREE from 'three';
import { PX_PER_M, RES, RES_MAX, frameFor } from './scale.js';
import { createCamera } from './camera.js';
import { createLights } from './lights.js';
import { createPost } from './post.js';
import { SHARED, olyMaterial, ensurePart, isOly } from './materials.js';
import { glowKOf } from './moods.js';
import { PALETTES, TRADECRAFT } from '../art/palette.js';
import { createPassTimer } from './stats.js';

const ZERO4 = new Float32Array(4);

/**
 * A stage in `parent`: { palette (name or colours; tradecraft's by default), grade (1: tradecraft's
 * fine look), outline, snap ('lut' | 'loop' | 'off'), gamma ('2.2' | 'srgb'), autoFit (fill the
 * window, re-fitting on resize; false: call size()), zoom (a whole number: the picture that many
 * times fewer pixels, shown that much bigger: tradecraft's samples' close views), mood, background }.
 */
export function createStage({ parent = document.body, palette = TRADECRAFT, grade = 1, outline = true, snap = 'lut', gamma = '2.2', autoFit = true, zoom = 1, mood = 'day', background = 0x14151c } = {}) {
  const pal = typeof palette === 'string' ? PALETTES[palette] : palette;
  const res = [Math.round(RES[0] / zoom / 2) * 2, Math.round(RES[1] / zoom / 2) * 2], resMax = [Math.round(RES_MAX[0] / zoom / 2) * 2, Math.round(RES_MAX[1] / zoom / 2) * 2];
  let W = res[0], H = res[1];
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.autoClear = false;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.BasicShadowMap;                    // (hard-edged: pixel shadows)
  renderer.shadowMap.autoUpdate = false;
  renderer.info.autoReset = false;
  const canvas = renderer.domElement, gl = renderer.getContext();
  Object.assign(canvas.style, { position: 'absolute', display: 'block', imageRendering: 'pixelated' });
  parent.appendChild(canvas);
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const gpuName = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'webgl2';

  const scene = new THREE.Scene();
  const cam = createCamera(W, H);
  const camera = cam.camera;
  const lights = createLights(scene);
  const post = createPost(renderer, W, H, { palette: pal, outline, grade, gamma, snap, near: camera.near, far: camera.far });
  post.bake();

  let bg = new THREE.Color(background), area = null, shadowsDirty = true, focus = null, warned = false;
  const stats = { calls: { scene: 0, post: 0, total: 0 }, triangles: 0, cpuMs: 0, gpuMs: null, shadowDrawn: false, frames: 0, programs: 0, textures: 0, geometries: 0, w: W, h: H, ppm: PX_PER_M, gpu: gpuName };

  // (a GPU timer per pass where the browser offers one: EXT_disjoint_timer_query_webgl2; Chrome often does not)
  const passes = createPassTimer(gl);
  stats.timer = passes.available;
  stats.passes = null;
  const drawShadows = renderer.shadowMap.render.bind(renderer.shadowMap);
  renderer.shadowMap.render = (...a) => {
    if (!renderer.shadowMap.needsUpdate) return drawShadows(...a);
    passes.begin('shadow');
    drawShadows(...a);
    passes.begin('scene');
  };

  function setMood(m) {
    const md = lights.apply(m);
    SHARED.uGlowK.value.set(glowKOf(md));
    SHARED.uStripLight.value.setRGB(...md.stripLight);
    SHARED.uBattleLight.value.setRGB(...md.battleLight);
    bg = new THREE.Color(md.background);
    shadowsDirty = true;
    return md;
  }
  setMood(mood);

  /** Make an area the live one (its group in the scene, its lamps and strip light in use); the last is taken out, not freed. */
  function setArea(a) {
    if (area && area !== a) area.group.removeFromParent();
    area = a;
    if (a) {
      scene.add(a.group);
      lights.setLamps(a.lamps);
      SHARED.uGlowMap.value = a.glowMap;
      if (a.glowBox) SHARED.uGlowBox.value.set(...a.glowBox); else SHARED.uGlowBox.value.set(0, 0, 0, 0);
    } else { lights.setLamps([]); SHARED.uGlowMap.value = null; SHARED.uGlowBox.value.set(0, 0, 0, 0); }
    shadowsDirty = true;
  }
  /** The figure seen through to ({ x, z, h = 1.8, w = 0.9 } metres) or null. */
  function setFocus(f) {
    focus = f;
    if (f) SHARED.uSee.value.set(f.x, f.z, (f.w ?? 0.9) / 2 + 0.15, f.h ?? 1.8); else SHARED.uSee.value.set(0, 0, 0, 0);
  }

  // New meshes: a part attribute and the stage's material patch (once each).
  function prepare() {
    scene.traverseVisible(o => {
      if (o.isMesh) {
        ensurePart(o);
        for (const m of [o.material].flat()) if (m && !isOly(m)) olyMaterial(m, { noId: !!o.userData.noId, see: o.userData.see !== false });
      } else if ((o.isLine || o.isPoints || o.isSprite) && !warned) { warned = true; console.warn('stage: lines, points and sprites are not drawn with part IDs; use meshes'); }
    });
  }

  function render() {
    const t0 = performance.now();
    renderer.info.reset();
    prepare();
    if (lights.update(cam.at.x, cam.at.z) || shadowsDirty) { renderer.shadowMap.needsUpdate = true; shadowsDirty = false; stats.shadowDrawn = true; } else stats.shadowDrawn = false;
    passes.begin('scene');
    renderer.setRenderTarget(post.rt);
    renderer.setClearColor(bg, 1);
    renderer.clear(true, true, false);
    gl.clearBufferfv(gl.COLOR, 1, ZERO4);                            // (the part IDs: none)
    renderer.render(scene, camera);
    stats.calls.scene = renderer.info.render.calls; stats.triangles = renderer.info.render.triangles;
    passes.begin('post');
    post.compose(camera);
    passes.begin('blit');
    post.present();
    passes.end();
    const g = passes.last;
    if (g) {
      stats.passes = { shadowMs: passes.shadowLastMs ?? 0, sceneMs: g.sceneMs, postMs: g.postMs, blitMs: g.blitMs };
      stats.gpuMs = g.shadowMs + g.sceneMs + g.postMs + g.blitMs;
    }
    stats.calls.total = renderer.info.render.calls; stats.calls.post = stats.calls.total - stats.calls.scene;
    stats.programs = renderer.info.programs?.length ?? 0; stats.textures = renderer.info.memory.textures; stats.geometries = renderer.info.memory.geometries;
    stats.cpuMs = performance.now() - t0; stats.frames++;
  }

  /** The picture w × h pixels on a canvas of outW × outH device pixels (fit() works these out from the window). */
  function size(w, h, outW = w, outH = h) {
    W = w; H = h;
    cam.resize(W, H);
    cam.look(cam.at.x, cam.at.z, cam.at.y);
    post.size(W, H, outW, outH);
    renderer.setSize(outW, outH, false);
    stats.w = W; stats.h = H;
  }
  function fit() {
    const f = frameFor(innerWidth, innerHeight, devicePixelRatio || 1, { res, resMax });
    Object.assign(canvas.style, { width: `${f.cssW}px`, height: `${f.cssH}px`, left: `${f.left}px`, top: `${f.top}px` });
    size(f.w, f.h, f.outW, f.outH);
    return f;
  }
  if (autoFit) { fit(); addEventListener('resize', fit); }

  /** The finished picture's pixels (before the blit): RGBA bytes, rows from the bottom. */
  function readPicture() {
    const buf = new Uint8Array(W * H * 4);
    renderer.readRenderTargetPixels(post.rtOut, 0, 0, W, H, buf);
    return buf;
  }

  /** Done with it: its targets and its WebGL context given back at once (a browser keeps 16 or so). */
  function dispose() {
    if (autoFit) removeEventListener('resize', fit);
    post.dispose(); lights.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  }

  return {
    THREE, renderer, scene, camera, cam, lights, post, canvas, stats, passes, ppm: PX_PER_M,
    look: (x, z, y = 0) => cam.look(x, z, y), follow: cam.follow, setLead: cam.setLead,
    setMood, setArea, setFocus, render, size, fit, readPicture, dispose,
    setFog: post.setFog, setSnap: post.setSnap, setGamma: post.setGamma,
    setPalette(p) { post.bake(typeof p === 'string' ? PALETTES[p] : p); },
    /** The light a sprite at (x, z) takes (linear RGB): the mood's and the lamps', plus the area's strips. */
    lightAt(x, z) {
      const md = lights.mood, g = area?.glowAt ? area.glowAt(x, z) : [0, 0];
      return lights.lightAt(x, z, [0, 1, 2].map(j => g[0] * md.stripLight[j] + g[1] * md.battleLight[j]));
    },
    shadowsChanged() { shadowsDirty = true; },
    get W() { return W; }, get H() { return H; }, get area() { return area; }, get focus() { return focus; }, get mood() { return lights.mood; },
  };
}
