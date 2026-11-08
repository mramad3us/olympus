// OLYMPUS render: the bangs on a stage. A training bang thrown, going off on the pad, its smoke (VIEWS §7.3; the build sheet 0.0.9 §2.3).
//
// The layer the view (view.js) draws the scene's bangs with, from rangeLook().pairs.bangs (the scene role's look.js),
// at the moment drawn (the arms' effects' fxMs): the pixels are range-items.js's (bangBodyPixels, bangFlashPixels,
// bangSmokePixels: their real size and time), here put on three instanced draws: the body and the smoke depth-tested
// among the pad's things, the flash its own draw after the figures (as the range's flash star: three.js draws the
// figures' cards in its transparent pass), so its white lies over the shooter's back; its pixels are light (decals.js's
// light flag), which the fog of awareness never dims: a flash behind you, out of your sight, still lights what you see. Each bang's flash shows on at least
// one frame (the first frame drawn at or after its atMs, even when that frame comes after BANG_FLASH_MS: a 30 ms flash
// between two frames of a slow machine would otherwise never be seen), and only once; its light pool (BANG_POOL_M 4 m)
// is a moving lamp of the stage's (lights.js; lighting.js MOVING_LAMPS' 'bang') over the frames the flash is drawn.
// The smoke has a draw of its own, written only when its picture changes: at most once a SMOKE_STEP_MS of game time (the
// sim's tick: under a pixel of growth or drift a step) and never while the clock stands (stop motion, a pause), so its
// thousands of pixels are not uploaded on every frame (the runtime review of v0.0.9: 453 KB a frame with the clock held,
// up to 558 KB at the bangs; the fixer's).
// update(list, { ms, tintOf, wind }) returns { bangs, flashing: [ids], lamps: [lamp], body, smoke, flash, pixels, smokeWrites }.
import { PX_PER_M } from './scale.js';
import { createPixels } from './decals.js';
import { bangBodyPixels, bangFlashPixels, bangSmokePixels, bangFlashOn, BANG_POOL_M, BANG_FLASH_MS, SMOKE_PX_MAX, BANG_SMOKE_MS } from './range-items.js';

/** The most bangs drawn at once, and the pixels of each draw. */
export const BANGS_MAX = 4, BANG_BODY_PIXELS = BANGS_MAX * 24, BANG_SMOKE_PIXELS = BANGS_MAX * SMOKE_PX_MAX, BANG_FLASH_PIXELS = 4800;
/** The smoke's picture is recomputed at most once a this many game ms (the sim's tick); figures within FIG_NEAR_M of a bang thin it. */
export const SMOKE_STEP_MS = 50, FIG_NEAR_M = 4;
/** The flash's light pool as a lamp (lights.js: its height, radius, colour, core and ring). */
export const BANG_LAMP = Object.freeze({ y: 1.6, r: BANG_POOL_M, color: 0xfff2d0, core: 1.1, ring: 0.3, kind: 'bang' });
/** A flash first drawn later than this after its moment is not drawn at all (game ms: a load, a skip). */
export const FLASH_LATE_MS = 500;

/** The bangs on a stage (see the header): { group, update, stats, dispose }. */
export function createBangs(stage, { ppm = stage.ppm ?? PX_PER_M } = {}) {
  const THREE = stage.THREE, px = createPixels(THREE, BANG_BODY_PIXELS, { ppm, order: 1 }), smokePx = createPixels(THREE, BANG_SMOKE_PIXELS, { ppm, order: 1 }), flash = createPixels(THREE, BANG_FLASH_PIXELS, { ppm, order: 3 });
  flash.mesh.material.transparent = true; flash.mesh.material.depthWrite = false;
  const group = new THREE.Group();
  group.name = 'bangs';
  group.add(px.mesh, smokePx.mesh, flash.mesh);
  const flashed = new Map();                                         // (a bang's id → the game ms its flash was first drawn)
  const stats = { bangs: 0, flashing: [], lamps: [], body: 0, smoke: 0, flash: 0, pixels: 0, smokeWrites: 0 };
  let smokeKey = '', smokeN = 0, lastKey = '';
  function update(list = [], { ms = 0, tintOf = null, wind = null, figures = [] } = {}) {
    const bangs = (list ?? []).filter(b => b && Number.isFinite(b.atMs)).slice(-BANGS_MAX);
    const tints = bangs.map(b => (tintOf ? tintOf(b.x, b.z) : [1, 1, 1]));
    // (the standing figures near a bang, to the pixel: the smoke thins over them)
    const near = bangs.length ? (figures ?? []).filter(f => bangs.some(b => Math.abs(f.x - b.x) < FIG_NEAR_M && Math.abs(f.z - b.z) < FIG_NEAR_M)).map(f => ({ x: Math.round(f.x * ppm) / ppm, z: Math.round(f.z * ppm) / ppm })) : [];
    const sig = `${bangs.map((b, i) => `${b.id ?? b.atMs}:${b.atMs}:${b.done ? 1 : 0}:${tints[i].map(v => v.toFixed(3)).join(',')}`).join('|')}|${wind?.speedMs ?? 0},${wind?.towardRad ?? 0}|${near.map(f => `${f.x},${f.z}`).join(';')}`;
    // (nothing moved: the clock held, the same bangs in the same light; nothing written, nothing uploaded)
    if (`${sig}|${ms}` === lastKey) return stats;
    lastKey = `${sig}|${ms}`;
    let n = 0, nf = 0, body = 0;
    const flashing = [], lamps = [];
    // (the smoke: its picture at the step's time, written only when the step, the bangs or their light change)
    const sk = `${sig}|${Math.floor(ms / SMOKE_STEP_MS)}`;
    if (sk !== smokeKey) {
      smokeKey = sk; smokeN = 0;
      const sms = Math.floor(ms / SMOKE_STEP_MS) * SMOKE_STEP_MS;
      bangs.forEach((b, i) => { if (sms - b.atMs < BANG_SMOKE_MS) for (const q of bangSmokePixels(b, sms, ppm, wind, { figures: near })) if (smokePx.set(smokeN, { x: q.x, y: q.y, z: q.z, color: q.c, tint: tints[i], noLine: true })) smokeN++; });
      smokePx.count(smokeN);
      stats.smokeWrites++;
    }
    for (const [i, b] of bangs.entries()) {
      const key = String(b.id ?? b.atMs);
      const tint = tints[i];
      for (const q of bangBodyPixels(b, ms, ppm)) if (px.set(n, { x: q.x, y: q.y, z: q.z, flat: q.flat, color: q.c, tint })) { n++; body++; }
      // (the flash: in its time, or the first frame after it once; never again)
      const first = flashed.get(key);
      const force = first === undefined && ms - b.atMs >= BANG_FLASH_MS && ms - b.atMs < FLASH_LATE_MS;
      if (bangFlashOn(b, ms, force) && (first === undefined || ms - first < BANG_FLASH_MS)) {
        if (first === undefined) flashed.set(key, ms);
        for (const q of bangFlashPixels(b, ms, ppm, { force: true })) if (flash.set(nf, { x: q.x, y: q.y, z: q.z, flat: q.flat, color: q.c, part: 0, light: true })) nf++;
        flashing.push(key);
        lamps.push({ ...BANG_LAMP, x: b.x, z: b.z });
      }
      // (a bang not yet gone off, a new run: its flash to come)
      if (ms < b.atMs) flashed.delete(key);
    }
    px.count(n); flash.count(nf);
    Object.assign(stats, { bangs: bangs.length, flashing, lamps, body, smoke: smokeN, flash: nf, pixels: n + smokeN + nf });
    return stats;
  }
  return { group, update, stats, pixels: px, smoke: smokePx, flash, dispose() { px.dispose(); smokePx.dispose(); flash.dispose(); group.removeFromParent(); } };
}
