// OLYMPUS render: what a splash's vignette stands, and where. Pure: the tests read the same pieces the stage draws.
//
// VIEWS §5.2 and the build sheet 0.0.4 §2.3 (b); the drawing is src/render/vignettes.js's (its header
// says what each vignette shows). vignetteItems() turns a splash frame, the fixture and you into the
// pieces of src/art/kit/vignette.js to stand as cards: their names, their options (the animation's frame
// on the view's real-time clock, the steam's density by the activity's part, the seed a hash of the
// activity and its sol), their feet in the world and their fade (the iris's inkK in a full splash, so
// the pieces dissolve in as it closes and out as it opens, never there at zoom 1 and gone the next
// frame: the review of v0.0.4); insideSpot() is where you are drawn while the activity has you inside
// its fixture (in a shower stall, facing its head; elsewhere hidden).
// Pure: no DOM, no three.js.
import { VIGNETTE_PIECES } from '../art/kit/vignette.js';
import { FOOTPRINTS } from '../art/kit/index.js';
import { turn, FACINGS } from '../art/kit/kit.js';
import { hash01 } from '../core/hash.js';

/** How far the steam stands in front of the bather, toward the camera, and the heights it covers on them (metres: shins to shoulders, the chibi's shoulders at 0.875 m, so the whole wet head shows above it). */
export const STEAM_FRONT_M = 0.22, STEAM_COVER_M = Object.freeze([0.2, 1.0]);
/** The wisps rise behind the bather (further from the camera), so the head stands in front of them. */
export const WISPS_BACK_M = 0.3;
/** The bather steps out of the stall over the shower's last share of the gap from here (the dress part's last 15%: 0.85 of its 0.6, after 0.4), and the steam clears with them. */
export const STEP_OUT_VK = 0.91;
/** The animations' rates on the view's clock (frames a second): the steam's rise, the water's fall, a lamp's blink. */
export const STEAM_FPS = 3, WATER_FPS = 8, TAP_FPS = 6;
/** The alert's beacon: its place in hall-2 (the build sheet §8, item 23: the horn at (57.7, 8.8)) is the alert's; it hangs this high (metres). */
export const BEACON_Y_M = 2.35;

const SOL_MS = 88_775_244;
/** Where a point in a fixture's own frame lies in the world: [x, z]. */
export function fixturePoint(f, lx, lz) {
  const [dx, dz] = turn(lx, lz, FACINGS[f.face] ?? 0);
  return [f.x + dx, f.z + dz];
}
/** The facing a figure takes looking from a fixture's middle toward a point of its own frame (the shower's head, a toilet's bowl). */
export function faceToward(f, lx, lz) {
  const [x, z] = fixturePoint(f, lx, lz), dx = x - f.x, dz = z - f.z;
  return Math.abs(dx) > Math.abs(dz) ? (dx < 0 ? 'left' : 'right') : (dz < 0 ? 'up' : 'down');
}
/** The vignette's seed: a hash of its activity and its sol (VIEWS §5.2: cosmetic choices by hash). */
export const vignetteSeed = (sp) => Math.floor(hash01('vignette', sp?.activity ?? sp?.vignette ?? '-', Math.floor((sp?.fromMs ?? 0) / SOL_MS)) * 997);

/**
 * Where the player is drawn while a splash's activity has them inside its fixture (a shower stall: in it,
 * facing its head), or null (draw them as figureOf says: the toilet stall hides them instead, the view's
 * rule). f: the fixture record.
 */
export function insideSpot(f) {
  if (!f || f.kind !== 'showerStall') return null;
  const D = FOOTPRINTS.showerStall.d;
  return { x: f.x, z: f.z, face: faceToward(f, 0, -D / 2) };
}

/**
 * What a vignette stands this frame: [{ name, opts, x, y, z, fade }] (x, z the card's foot in the world, y its
 * bottom, metres). ctx: { sp (the splash frame: vignette, part, vk, phase, interrupt), fixture (its record),
 * you ({ x, z, face }), tS (the view's real seconds), ppm }.
 */
export function vignetteItems({ sp, fixture: f, you = null, tS = 0 } = {}) {
  if (!sp || !f) return [];
  const seed = vignetteSeed(sp), out = [], fp = FOOTPRINTS[f.kind] ?? { w: 1, d: 1, h: 1 };
  const part = sp.part ?? null, v = sp.vignette ?? null;
  const frameAt = (fps, n = 4) => Math.floor(tS * fps) % n;
  if (v === 'shower' && f.kind === 'showerStall') {
    const W = fp.w, D = fp.d, density = part === 'water' ? 1 : part === 'dress' ? 2 : 0;
    // (the steam in front of the bather: the stall's middle, toward the camera, so it covers shins to shoulders)
    const zc = f.z + STEAM_FRONT_M;
    // (in the water and before it, the steam you stand in; dressing, the water off, a thinner cloud behind you,
    // so the towel and the wet head show; it clears as you step out of the stall, over the dress part's last
    // share of the gap and gone by the strip, never standing between the camera and you on the stall's spot)
    const clear = sp.phase === 'strip' || sp.phase === 'out' ? 1 : part === 'dress' ? Math.max(0, Math.min(1, ((sp.vk ?? 0) - STEP_OUT_VK) / (1 - STEP_OUT_VK))) : 0;
    if (part === 'dress') out.push({ name: 'steam', opts: { frame: frameAt(STEAM_FPS), density, seed }, x: f.x, y: 0.1, z: f.z - WISPS_BACK_M, clear });
    else out.push({ name: 'steamCover', opts: { frame: frameAt(STEAM_FPS), density, seed }, x: f.x, y: STEAM_COVER_M[0] + STEAM_FRONT_M, z: zc });
    // (the steam rising over the partitions, behind you, thinner, its frames a step behind)
    out.push({ name: 'steam', opts: { frame: (frameAt(STEAM_FPS) + 2) % 4, density: density === 1 ? 0 : 2, seed: seed + 1 }, x: f.x, y: 1.25, z: f.z - WISPS_BACK_M, clear });
    if (part === 'water') {
      // (the water: from the head over you to the floor, in front of you, so it falls on your head and shoulders)
      const [hx] = fixturePoint(f, 0.1, -D / 2 + 0.12);
      out.push({ name: 'water', opts: { frame: frameAt(WATER_FPS), seed }, x: hx, y: 0.02, z: f.z + 0.1 });
    }
    const [tx, tz] = fixturePoint(f, -W / 2 + 0.08, 0.15);
    out.push({ name: 'timer', opts: { on: part === 'water' ? 1 : 0 }, x: tx, y: 1.4, z: tz });
    if (part !== 'dress') { const [ux, uz] = fixturePoint(f, W / 2 - 0.12, 0.1); out.push({ name: 'towelHung', opts: {}, x: ux, y: 1.45, z: uz }); }
  } else if (v === 'sink' && f.kind === 'sinkRow') {
    // (the tap over the basin you stand at: the nearest of the row's, running while you wash or rinse)
    if (part !== 'teeth' || (sp.vk ?? 0) > 0.6) {
      const n = Math.max(1, Math.round(fp.w / 0.6)), at = you ?? { x: f.x, z: f.z };
      let best = null;
      for (let i = 0; i < n; i++) { const [x, z] = fixturePoint(f, -fp.w / 2 + (i + 0.5) * fp.w / n, -fp.d / 2 + 0.1); const d = Math.hypot(x - at.x, z - at.z); if (!best || d < best.d) best = { x, z, d }; }
      out.push({ name: 'tap', opts: { frame: frameAt(TAP_FPS) }, x: best.x, y: 0.84, z: best.z });
    }
  } else if (v === 'stall' && f.kind === 'toiletStall') {
    // (the boots' toes under the door's gap, just outside it, and the slide on the door's face: the stall's
    // inside is hidden from the camera by its partitions, its door's foot and face are where they show)
    // A stall whose door faces east or west shows the camera its side: the boots under that side's
    // partition and the slide on its face, the south one, where they can be seen (the review of v0.0.4)
    const D = fp.d;
    if (f.face === 'left' || f.face === 'right') {
      const s = fp.w / 2;
      out.push({ name: 'boots', opts: {}, x: f.x, y: 0, z: f.z + s + 0.06 });
      out.push({ name: 'slide', opts: {}, x: f.x + (f.face === 'right' ? 1 : -1) * (D / 2 - 0.2), y: 0.92, z: f.z + s + 0.03 });
    } else {
      const [bx, bz] = fixturePoint(f, 0, D / 2 + 0.08);
      out.push({ name: 'boots', opts: {}, x: bx, y: 0, z: bz });
      const doorW = fp.w - 0.14, [sx, sz] = fixturePoint(f, doorW / 2 - 0.12, D / 2 + 0.04);
      out.push({ name: 'slide', opts: {}, x: sx, y: 0.92, z: sz });
    }
  } else if (v === 'locker' && f.kind === 'wallLocker') {
    const [lx, lz] = fixturePoint(f, 0, fp.d / 2 + 0.012);
    out.push({ name: 'lockerOpen', opts: { seed: Math.floor(hash01('locker', f.id) * 60) }, x: lx, y: 0, z: lz });
  }
  // (the fade: the iris's ink in a full splash, so nothing pops at zoom 1)
  const fade = sp.form === 'full' && Number.isFinite(sp.inkK) ? Math.max(0, Math.min(1, sp.inkK)) : 1;
  for (const it of out) { it.fade = fade * (1 - (it.clear ?? 0)); delete it.clear; }
  return out;
}
