// OLYMPUS tests: F89 to F91, F98 and F99, the portraits (the build sheet v0.0.23 §8; the lead's F numbers for the user's fourth note of 2026-11-17).
//
// The user, 2026-11-17: "the portrait of the NPC holding a gun does not display the gun they are holding, the portraits need to be
// more dynamic and show us what we would be seeing, including what they are holding"; and, after the sheet: "Graphics : Holding the
// sidearm with the rifle dangling should be redrawn, sidearm should have the same stances (low ready, high ready, aimed, etc) as the
// rifle". The gauges, each a pure function its runners call and print:
//   F89 the gun reads (gunReads): a card with a gun in the hands has at least GUN_PX_MIN pixels of it (scaled by the band's px a
//       metre) in the hold's tones on a board (PORTRAIT_HOLD), its own on a man, and GUN_IN_CROP_K of it inside the figure's rows;
//   F90 the card shows what you see (cardAgrees): its subject is seenOf's record, never empty hands where the stage (stageHolds,
//       written here from the stage's own readers: look.js gunLook and the view's hands-up rule, devices.js handDeviceOf, never
//       seen.js) draws a gun, never front on for a man turned past FACING_BACK_RAD from your eye (the stage's heading), and
//       two different (how, pose, facing) two different dolls; and (v0.0.23's fixer, the code review's second finding: the oracle
//       read the truth, so a card showing a man behind a wall passed) out of your sight never a record he took there: the card's
//       record is the one of the last tick his spot was in your sight (stageSees: perception's visibility, the stage's own test,
//       render/memory.js recall's), and no card of a man never in sight (cardSeen);
//   F91 the card's cost (cardCost): no frame paints more than one new doll; every doll painted after GO in warm()'s set or a back or
//       side variant of one; a posed doll at most POSED_DOLL_MS × k; no texture upload from a card (src/ui/hud/hitcard.js puts a
//       2D canvas's pixels, never three.js);
//   F98 the P-12's stances drawn (p12Stances): low ready, high ready, aimed, at the holster and the admin each a distinct frame on the
//       stage's figure (poses.js's pistol band), the doll (worn.js holdGear's places) and the card, the pistol's pixels in the hands;
//       the rifle's own frames byte for byte as before (RIFLE_FRAMES_GOLDEN, pinned on the base tree);
//   F99 the slung R-7 while the pistol is up (rifleHang): on its sling across the chest, muzzle down, in every pistol stance and
//       facing, no rifle pixel over an arm's (the frame composed with the hang and without it: every arm cell of the one without is
//       the same cell with it), and its hang moving with the walk (the slung-in-front carry's walk frames' rifle cells differ
//       through the cycle).
// All enforced from C's merge (PORTRAIT_ENFORCED).
import { gearOf } from '../src/sim/arms/gear.js';
import { gunLook } from '../src/sim/arms/look.js';
import { handDeviceOf } from '../src/sim/arms/devices.js';
import { eyeOf, visibility } from '../src/sim/people/perception.js';
import { PORTRAIT_HOLD } from '../src/art/doll/portrait.js';

/** The gauges this file enforces (from C's merge: the build sheet v0.0.23 §8 and the lead's F98, F99). */
export const PORTRAIT_ENFORCED = Object.freeze(new Set(['F89', 'F90', 'F91', 'F98', 'F99']));
/** F89's floor: the gun's pixels on the card at the near band (by the band's px a metre), and the share of it inside the figure's rows. */
export const GUN_PX_MIN = 12, GUN_IN_CROP_K = 0.9;
/** F91's ceiling: a posed doll's paint, ms × the machine's factor (P§4: 3.1 ms measured, foreground). */
export const POSED_DOLL_MS = 4;
/** F90's back: a man turned past this from your eye is drawn from behind (seen.js FACING_BACK_RAD's value, written here: the oracle never reads seen.js). */
export const ORACLE_BACK_RAD = 3 * Math.PI / 4;

const hexOf = (v) => ((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff);
/** A card's pixels in the hold's tones. */
// (v0.0.28: the gun in a tone of its own, G2's own colours from the user's star of 2026-11-20, or G1's ink: the card counts them, gun.toned)
export function holdTonePx(card) { if (Number.isFinite(card.gun?.toned)) return card.gun.toned; let n = 0; for (const v of card.data) { const c = hexOf(v); if (c === PORTRAIT_HOLD.ink || c === PORTRAIT_HOLD.lit) n++; } return n; }

/** F89 for one card (paintHitcard's output): { ok, px, inCrop, all, min, k }. board: tones counted; a man: the held pixels in the crop. */
export function gunReads(card, { board = true } = {}) {
  const min = GUN_PX_MIN * (card.pxPerM ?? 96) / 96, px = board ? holdTonePx(card) : card.gun?.inCrop ?? 0;
  const k = card.gun?.all ? card.gun.inCrop / card.gun.all : 0;
  return { ok: px >= min && k >= GUN_IN_CROP_K, px, inCrop: card.gun?.inCrop ?? 0, all: card.gun?.all ?? 0, min: Math.round(min * 10) / 10, k: Math.round(k * 1000) / 1000 };
}

const wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const HEAD = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
/**
 * The stage's oracle (never seen.js): what the stage draws in a person's hands ('gun' | 'device' | 'up' | 'none') and how far he is
 * turned from the viewer (radians, his heading against the line to you), by the view's own rule (src/render/view.js's people loop:
 * a man's hands up when the actor's flag is set and gunLook has no gun for him; else the gun by gunLook's carry, the P-12 out; a
 * device in a hand by devices.js handDeviceOf, as look.js heldLook draws it).
 */
export function stageHolds(state, pid, by = state.player?.id) {
  const a = state.actors.list.find(x => x.who === pid), me = state.actors.list.find(x => x.who === by);
  const gl = a && state.people?.[pid]?.kit ? gunLook(state, a, state.clock.ms) : null;
  let holds = 'none';
  if (handDeviceOf(state, pid)) holds = 'device';
  else if (a?.hands === true && !gl) holds = 'up';
  else if (gl && (gl.pistol || ['low', 'high', 'aim'].includes(gl.carry))) holds = 'gun';
  const head = Number.isFinite(a?.headRad) ? a.headRad : HEAD[a?.face] ?? 0;
  const turned = a && me && a !== me ? Math.abs(wrap(head - Math.atan2(me.z - a.z, me.x - a.x))) : 0;
  return { holds, turned, gear: gearOf(state, pid) };
}

/** F90 for one shown card: { ok, why } given the card's model and the oracle. */
export function cardAgrees(m, oracle, { facingOn = true } = {}) {
  const rec = m?.subject?.rec;
  if (!rec) return { ok: false, why: 'no record' };
  if (oracle.holds === 'gun' && (rec.hold?.how === 'empty' || rec.hold?.how === 'rifle-slung')) return { ok: false, why: `empty hands where the stage draws a gun (${rec.hold?.how})` };
  if (oracle.holds === 'up' && rec.hold?.how !== 'up') return { ok: false, why: `the hands not up (${rec.hold?.how})` };
  if (facingOn && oracle.turned > ORACLE_BACK_RAD + 1e-6 && rec.facing === 'front') return { ok: false, why: `front on, turned ${Math.round(oracle.turned * 180 / Math.PI)}°` };
  return { ok: true, why: null };
}

/** Whether the stage sees a person's spot from your eye now (perception's visibility above 0: the fog's and memory.js recall's test). */
export function stageSees(state, pid, by = state.player?.id) {
  const a = state.actors.list.find(x => x.who === pid), me = state.actors.list.find(x => x.who === by);
  if (!a || !me) return false;
  return visibility(state, eyeOf(state, me), a.x, a.z, state.clock.ms) > 0;
}
/**
 * F90's sight clause over a lane (see the header): a watcher of one man; each(m, inSight, truthKey) per tick with the card's model
 * (or null), whether the stage sees him and seenOf's key now; { ok, why } per tick, and counts.
 */
export function cardSeen() {
  const out = { ticks: 0, hidden: 0, hiddenShown: 0, lastKey: null };
  return {
    out,
    each(m, inSight, truthKey) {
      out.ticks++;
      const key = m?.subject?.rec?.key ?? null;
      if (inSight) { out.lastKey = truthKey; return key === null || key === truthKey ? { ok: true } : { ok: false, why: `in sight, the card ${key} not seenOf's ${truthKey}` }; }
      out.hidden++;
      if (key === null) return { ok: true };
      out.hiddenShown++;
      if (out.lastKey === null) return { ok: false, why: `out of sight and never seen, yet a card ${key}` };
      return key === out.lastKey ? { ok: true } : { ok: false, why: `out of sight, the card ${key} not as last seen ${out.lastKey}` };
    },
  };
}

/** F91's watcher over a lane's frames: each(newDolls) per frame; end() → { ok, frames, most, painted }. */
export function cardCost() {
  const out = { frames: 0, most: 0, painted: 0 };
  return { each(n) { out.frames++; out.painted += n; out.most = Math.max(out.most, n); }, end() { return { ok: out.most <= 1, ...out }; } };
}

/** F98's and F99's lines, as the runners print them. */
export const f98Line = (r) => `F98 ${r.ok ? 'MET' : 'OPEN'}: the stage's ${r.stage.distinct} of ${r.stage.n} P-12 frames distinct, the pistol drawn in ${r.stage.pistol}; the doll's ${r.doll.distinct} of ${r.doll.n} stances distinct, ${r.doll.held} with the pistol's pixels in the hands; the card's ${r.card.distinct} of ${r.card.n}; the rifle's frames ${r.rifle}`;
export const f99Line = (r) => `F99 ${r.ok ? 'MET' : 'OPEN'}: the R-7 hanging in ${r.hung} of ${r.n} pistol frames and facings, muzzle down in ${r.down}, ${r.overArms} rifle pixels over an arm; the doll's ${r.dollOver} over an arm; the slung walk's ${r.walkDistinct} distinct rifle pictures over ${r.walkN} frames`;
