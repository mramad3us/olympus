// OLYMPUS render: everyone on the stage in one draw. Figures' cards from a GPU atlas filled a band at a time.
//
// tradecraft's crowd (src/render/crowd.js), ported to OLYMPUS's figures (src/art/figures/) and stage:
//   - THE ATLAS is one ATLAS_PX square texture allocated on the GPU and never sent whole (the user,
//     tradecraft 2026-10-29: "each time I turn it staggers almost a second", the cost of a big texture
//     re-sent). Each look (outfit, skin, hair, weapon, carry: a person's sheet) takes a slot the size of
//     its sheet (src/art/figures/atlas.js sheetLayout(): about 512 × 480 at 16 px/m, 768 × 720 at 24);
//     a full atlas reuses the slot whose look has gone unseen longest. A slot is filled a BAND at a time
//     (the gait first; the arms, rest and float bands the first time that person aims, sits or floats),
//     each band painted by a resumable job (atlas.js bandSteps()) and sent up alone into its rectangle
//     (renderer.copyTextureToTexture: one texSubImage2D of a quarter to half a megabyte).
//   - THE BUDGET: the painting shares BUDGET_MS a frame (VIEWS.md 3.7: 1.5 ms at 16 px/m, 3 at 24), and at
//     most SHEETS_PER_FRAME (2) bands go up a frame. Anyone whose band isn't ready is drawn in a band
//     already up (standing, idle) or, new, not yet: a frame or two on, still coming out of the dark.
//     Your own figure (own: true) is never put off.
//   - ONE DRAW: every person is an instance of one upright card (an InstancedMesh), per instance its
//     place (the matrix), its frame's rectangle in the atlas (aRect) and the light where it stands
//     (aTint: stage.lightAt(), the same number the dice read). The card writes the people's part ID
//     (src/render/cards.js PEOPLE_PART) through the stage's MRT and is seen through like any card in
//     front of the figure in focus (src/render/materials.js FRAG_DECL, olySee). A pixel whose alpha
//     carries a glow class (a helmet lamp, a suit's chest display, a dosimeter: shade.js) is drawn
//     unlit, as bright at night as by day.
//   - PLACING A CARD: each frame's cell has an anchor (the pixel over the sim's spot: the ground under
//     the body, or a floater's pelvis). The card stands upright in the plane a little nearer the camera
//     than the spot, as far as the cell has rows below its anchor, so its lowest rows stay above the
//     floor and the anchor still lands on the spot (on screen a card's row is where the ground at z − y
//     is). A seat, a bound's height or a float lifts it (y); the blob stays on the floor and shrinks
//     with the height (VIEWS.md 3.5: 1 / (1 + 0.6 h), opacity 0.4 down to 0.15). A body lying side on
//     has a long blob, one lying end on a deep one.
//   - FLASHES: a third instanced draw of cards from the flash strip (atlas.js flashStrip()), at the
//     muzzle, unlit, nudged along the camera's line (in front, or behind the head from behind), for
//     FLASH_MS; the caller lights whoever is within FLASH_LIT_M (poses.js gunPose() decides when).
// Frames follow the sim (poses.js gaitFrame(): walks by distance, idles at 2 fps by a person's phase).
import * as THREE from 'three';
import { PX_PER_M } from './scale.js';
import { FRAG_DECL } from './materials.js';
import { PEOPLE_PART } from './cards.js';
import { sheetLayout, bandSteps, flashStrip } from '../art/figures/atlas.js';
import { BAND_OF, gaitFrame } from '../art/figures/poses.js';
import { wear } from '../art/figures/outfits.js';

export const ATLAS_PX = 4096;
export const SHEETS_PER_FRAME = 2;
/** Milliseconds a frame for painting new bands (VIEWS.md 3.7). */
export const BUDGET_MS = PX_PER_M >= 20 ? 3.0 : 1.5;
export const MAX_PEOPLE = 160, MAX_FLASHES = 24;
/** Who a flash lights, and the most it lights them (tradecraft's: linear, a warm white). */
export const FLASH_LIT_M = 3, FLASH_LIGHT = Object.freeze([1.0, 0.85, 0.55]);
const INK = 0x14151c, TOWARD = new THREE.Vector3(0, Math.SQRT1_2, Math.SQRT1_2).multiplyScalar(0.15);

/**
 * The figures of the stage: { group (add it to the scene or an area), update(people), stats, atlas,
 * layout, dispose }. opts: renderer (required), prop ('chibi' | 'soldier'), ppm, atlasPx, budgetMs,
 * sheetsPerFrame, maxPeople.
 */
export function createFigures({ renderer, prop = 'chibi', ppm = PX_PER_M, atlasPx = ATLAS_PX, budgetMs = BUDGET_MS, sheetsPerFrame = SHEETS_PER_FRAME, maxPeople = MAX_PEOPLE } = {}) {
  const lay = sheetLayout(prop, ppm);
  const COLS = Math.floor(atlasPx / lay.w), ROWS = Math.floor(atlasPx / lay.h), SLOTS = COLS * ROWS;
  // (on the GPU only: storage made at its first use, nothing sent with it; rows top-down, as the sheets are painted)
  const atlas = new THREE.DataTexture(null, atlasPx, atlasPx);
  atlas.magFilter = atlas.minFilter = THREE.NearestFilter;
  atlas.generateMipmaps = false;
  atlas.colorSpace = THREE.SRGBColorSpace;
  atlas.flipY = false;
  atlas.source.dataReady = false;
  atlas.needsUpdate = true;
  const stats = { slots: SLOTS, used: 0, fallback: 0, uploads: 0, uploadBytes: 0, uploadMs: 0, paintMs: 0, bandsPainted: 0, drawn: 0, deferred: 0, lastFrame: { uploads: 0, bytes: 0, paintMs: 0, uploadMs: 0 }, atlasPx, sheet: [lay.w, lay.h] };

  // ---------- slots: look key → { slot, bands: Set, seen, job } ----------
  const slots = new Map(), free = Array.from({ length: SLOTS }, (_, i) => SLOTS - 1 - i);
  let frameNo = 0, uploadsLeft = 0, msLeft = 0;
  const at = new THREE.Vector2();
  function slotOf(key, look, own) {
    let s = slots.get(key);
    if (!s) {
      if (uploadsLeft <= 0 && !own) return null;
      let i = free.pop();
      if (i === undefined) {                                        // (full: the slot unseen longest, if not seen this frame)
        let worst = null;
        for (const [k, v] of slots) if (v.seen < frameNo && (!worst || v.seen < worst[1].seen)) worst = [k, v];
        if (!worst) return null;
        slots.delete(worst[0]); i = worst[1].slot;
      }
      s = { slot: i, look: look?.top ? look : wear(look), bands: new Set(), seen: frameNo, job: null, jobBand: null };
      slots.set(key, s);
      stats.used = slots.size;
    }
    s.seen = frameNo;
    return s;
  }
  /** Work on a slot's band within the frame's budget (own: to its end); true once it's up. */
  function ensureBand(s, band, own) {
    if (s.bands.has(band)) return true;
    if (s.ready) return false;                                     // (painted, waiting for a frame with an upload to spare)
    if (s.job && s.jobBand !== band) return false;                 // (one band at a time a slot)
    if (!s.job) { s.job = bandSteps(s.look, band, { prop, ppm }); s.jobBand = band; }
    for (;;) {
      if (!own && msLeft <= 0) return false;
      const t0 = performance.now(), r = s.job.next(), dt = performance.now() - t0;
      msLeft -= dt; stats.paintMs += dt; stats.lastFrame.paintMs += dt;
      if (r.done) {
        if (!own && uploadsLeft <= 0) { s.ready = r.value; s.job = null; s.jobBand = null; break; }
        upload(s, r.value); s.job = null; s.jobBand = null;
        return true;
      }
    }
    return false;
  }
  function upload(s, b) {
    const t0 = performance.now();
    const src = new THREE.DataTexture(new Uint8Array(b.pm.data.buffer), b.rect.w, b.rect.h);
    src.flipY = false;
    const ox = (s.slot % COLS) * lay.w + b.rect.x, oy = Math.floor(s.slot / COLS) * lay.h + b.rect.y;
    renderer.copyTextureToTexture(src, atlas, null, at.set(ox, oy));
    src.dispose();
    s.bands.add(b.band); s.ready = null;
    uploadsLeft--;
    const bytes = b.rect.w * b.rect.h * 4, ms = performance.now() - t0;
    stats.uploads++; stats.uploadBytes += bytes; stats.uploadMs += ms; stats.bandsPainted++;
    stats.lastFrame.uploads++; stats.lastFrame.bytes += bytes; stats.lastFrame.uploadMs += ms;
  }

  // ---------- the cards ----------
  const geo = new THREE.PlaneGeometry(1, 1).translate(0.5, 0.5, 0);
  const aRect = new THREE.InstancedBufferAttribute(new Float32Array(maxPeople * 4), 4);
  const aTint = new THREE.InstancedBufferAttribute(new Float32Array(maxPeople * 3), 3);
  geo.setAttribute('aRect', aRect); geo.setAttribute('aTint', aTint);
  const material = new THREE.ShaderMaterial({
    uniforms: { atlas: { value: atlas }, size: { value: atlasPx }, part: { value: PEOPLE_PART } },
    defines: { OLY_SEE: '' },
    vertexShader: /* glsl */`
      attribute vec4 aRect; attribute vec3 aTint;
      varying vec2 vPx; varying vec3 vTint; varying vec3 vOlyWorld; flat varying float vOlyPart;
      uniform float part;
      void main() {
        vPx = aRect.xy + vec2(uv.x, 1.0 - uv.y) * aRect.zw;          // (atlas pixels, rows top-down as painted)
        vTint = aTint; vOlyPart = part;
        vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
        vOlyWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      ${FRAG_DECL}
      uniform sampler2D atlas; uniform float size;
      varying vec2 vPx; varying vec3 vTint;
      void main() {
        olySee(vOlyWorld);
        vec4 c = texture2D(atlas, (floor(vPx) + 0.5) / size);
        float a = floor(c.a * 255.0 + 0.5);
        if (a < 128.0) discard;
        // (a glow class in the alpha: a lamp, a display, drawn unlit; the rest lit by where they stand)
        gl_FragColor = vec4(a < 248.0 || a > 254.5 ? c.rgb * vTint : c.rgb, 1.0);
        pc_fragId = olyId(vOlyPart, olyFlag);
      }`,
  });
  material.userData.oly = { card: true };
  const cards = new THREE.InstancedMesh(geo, material, maxPeople);
  cards.frustumCulled = false; cards.count = 0;
  cards.userData.part = PEOPLE_PART;

  // ---------- the blobs (an ink ellipse a person, opacity by height, long for a body lying down) ----------
  const bgeo = new THREE.CircleGeometry(0.42, 18).rotateX(-Math.PI / 2).scale(1, 1, 0.6);
  const aAlpha = new THREE.InstancedBufferAttribute(new Float32Array(maxPeople), 1);
  bgeo.setAttribute('aAlpha', aAlpha);
  const bmat = new THREE.ShaderMaterial({
    uniforms: { ink: { value: new THREE.Color(INK) } },
    transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      attribute float aAlpha; varying float vA; varying vec3 vOlyWorld; flat varying float vOlyPart;
      void main() { vA = aAlpha; vOlyPart = 0.0; vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0); vOlyWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      ${FRAG_DECL}
      uniform vec3 ink; varying float vA;
      void main() { gl_FragColor = vec4(ink, vA); pc_fragId = vec4(0.0); }`,
  });
  bmat.userData.oly = { blob: true };
  const blobs = new THREE.InstancedMesh(bgeo, bmat, maxPeople);
  blobs.frustumCulled = false; blobs.count = 0; blobs.renderOrder = 1;
  blobs.userData.noId = true;

  // ---------- the flashes ----------
  const strip = flashStrip(prop, ppm), FS = strip.size;
  const ftex = new THREE.DataTexture(new Uint8Array(strip.pm.data.buffer), strip.pm.w, strip.pm.h);
  ftex.magFilter = ftex.minFilter = THREE.NearestFilter; ftex.generateMipmaps = false; ftex.colorSpace = THREE.SRGBColorSpace; ftex.flipY = false; ftex.needsUpdate = true;
  const fgeo = new THREE.PlaneGeometry(1, 1).translate(0.5, 0.5, 0);
  const aSlot = new THREE.InstancedBufferAttribute(new Float32Array(MAX_FLASHES), 1);
  fgeo.setAttribute('aSlot', aSlot);
  const fmat = new THREE.ShaderMaterial({
    uniforms: { map: { value: ftex }, size: { value: new THREE.Vector2(strip.pm.w, strip.pm.h) }, fs: { value: FS } },
    transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      attribute float aSlot; uniform float fs; varying vec2 vPx; varying vec3 vOlyWorld; flat varying float vOlyPart;
      void main() { vPx = vec2(aSlot * fs + uv.x * fs, (1.0 - uv.y) * fs); vOlyPart = 0.0; vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0); vOlyWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      ${FRAG_DECL}
      uniform sampler2D map; uniform vec2 size; varying vec2 vPx;
      void main() { vec4 c = texture2D(map, (floor(vPx) + 0.5) / size); if (c.a < 0.5) discard; gl_FragColor = vec4(c.rgb, 1.0); pc_fragId = vec4(0.0); }`,
  });
  fmat.userData.oly = { flash: true };
  const flashes = new THREE.InstancedMesh(fgeo, fmat, MAX_FLASHES);
  flashes.frustumCulled = false; flashes.count = 0; flashes.renderOrder = 2;
  flashes.userData.noId = true;

  const group = new THREE.Group();
  group.name = 'figures';
  group.add(cards, blobs, flashes);

  const m4 = new THREE.Matrix4(), snap = (v) => Math.round(v * ppm) / ppm;
  /**
   * Draw these people: [{ key, look, x, z, y? (a lift: seat, bound, float, metres), face, frame? | gait,
   * stride, tS, phase, tint: [r, g, b], own?, flash? }]. key: their look's (people dressed alike may share
   * one). Returns how many were drawn.
   */
  function update(people) {
    frameNo++;
    uploadsLeft = sheetsPerFrame; msLeft = budgetMs;
    stats.lastFrame = { uploads: 0, bytes: 0, paintMs: 0, uploadMs: 0 };
    let i = 0, nf = 0;
    stats.deferred = 0; stats.fallback = 0;
    for (const p of people) {
      if (i >= maxPeople) break;
      const s = slotOf(p.key, p.look, p.own);
      if (!s) { stats.deferred++; continue; }
      if (s.ready && (uploadsLeft > 0 || p.own)) upload(s, s.ready);   // (a band painted last frame, its upload put off; yours never)
      let frame = p.frame ?? gaitFrame(p.gait ?? 'idle', p);
      const face = p.face ?? 'down';
      let band = BAND_OF[frame] ?? 'gait';
      if (!ensureBand(s, band, p.own)) {
        // (its band not up yet: standing in the gait's frames meanwhile, if those are; else not drawn yet)
        if (band !== 'gait' && (s.bands.has('gait') || ensureBand(s, 'gait', p.own))) { frame = 'idle0'; band = 'gait'; stats.fallback++; }
        else { stats.deferred++; continue; }
      }
      const c = lay.cells.get(`${frame}|${face}`) ?? lay.cells.get(`idle0|down`);
      const ox = (s.slot % COLS) * lay.w, oy = Math.floor(s.slot / COLS) * lay.h;
      // (see the header: the anchor's row on the spot; the card's lowest rows above the floor)
      const nb = (c.h - c.ay) / ppm, ys = p.y ?? 0, yb = snap(Math.max(0, ys - nb)), zc = snap(p.z - ys + yb + nb);
      const left = snap(p.x) - c.ax / ppm;
      m4.makeScale(c.w / ppm, c.h / ppm, 1).setPosition(left, yb, zc);
      cards.setMatrixAt(i, m4);
      aRect.setXYZW(i, ox + c.x, oy + c.y, c.w, c.h);
      const t = p.tint ?? [1, 1, 1];
      aTint.setXYZ(i, t[0], t[1], t[2]);
      // (the blob: under the body on the floor; long under a body lying side on, deep under one lying end on)
      const lift = c.kind === 'float' ? ys : Math.max(0, ys - (p.seat ?? 0));
      let bx = snap(p.x), bz = snap(p.z), sx = 1, sz = 1;
      if (c.kind === 'long') { bx = left + c.w / 2 / ppm; sx = 2.3; sz = 0.9; }
      else if (c.kind === 'tall') { bz = snap(p.z) - c.ay / 2 / ppm; sx = 0.95; sz = 3.2; }
      const k = 1 / (1 + 0.6 * lift);
      m4.makeScale(sx * k, 1, sz * k).setPosition(bx, 0.012, bz);
      blobs.setMatrixAt(i, m4);
      aAlpha.setX(i, Math.max(0.15, 0.4 - 0.083 * lift));
      // (the flash: its card over the muzzle, a little toward the camera, or behind the head from behind)
      const gun = s.look.weapon;
      if (p.flash && gun && nf < MAX_FLASHES) {
        const fl = strip.index.get(`${gun}|${face}|${frame}`);
        if (fl) {
          const fy = yb + (c.h - fl.oy - FS) / ppm;
          m4.makeScale(FS / ppm, FS / ppm, 1).setPosition(left + fl.ox / ppm, fy, zc);
          const kk = fl.behind ? -1 : 1;
          m4.elements[12] += TOWARD.x * kk; m4.elements[13] += TOWARD.y * kk; m4.elements[14] += TOWARD.z * kk;
          flashes.setMatrixAt(nf, m4);
          aSlot.setX(nf, fl.slot);
          nf++;
        }
      }
      i++;
    }
    cards.count = blobs.count = i; flashes.count = nf;
    cards.instanceMatrix.needsUpdate = blobs.instanceMatrix.needsUpdate = flashes.instanceMatrix.needsUpdate = true;
    aRect.needsUpdate = aTint.needsUpdate = aAlpha.needsUpdate = aSlot.needsUpdate = true;
    stats.drawn = i;
    return i;
  }

  /** Whether a look's band is on the GPU (for tests and warm-ups). */
  const ready = (key, band = 'gait') => !!slots.get(key)?.bands.has(band);
  /** Paint and send a look's bands now, whatever the budget (a load screen's warm-up). */
  function warm(key, look, bands = ['gait']) {
    const s = slotOf(key, look, true);
    for (const b of bands) { uploadsLeft = Math.max(uploadsLeft, 1); ensureBand(s, b, true); }
    return s;
  }
  function dispose() {
    geo.dispose(); material.dispose(); bgeo.dispose(); bmat.dispose(); fgeo.dispose(); fmat.dispose(); ftex.dispose(); atlas.dispose();
    group.removeFromParent();
  }
  group.userData.dispose = dispose;
  return { group, cards, blobs, flashes, update, warm, ready, stats, atlas, layout: lay, slots, dispose, COLS, ROWS, SLOTS };
}
