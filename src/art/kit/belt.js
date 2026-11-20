// OLYMPUS art: the Patient Mule's pieces, a Belter's boxed berth pair and the lock's override panel (the build sheet v0.0.27 item 16, §1 E; SH§8.1; PLACES §8, §9.2).
//
// "Away the boarding party" is fought on deck 2 of a Belt ice hauler (src/data/places/hauler.js): a crew deck 2.4 m clear, every
// standing piece deck to deckhead so one grid serves a body on either face. Its two new pieces, each its catalogue's size
// (src/sim/places/fixtures.js, pinned equal to FOOTPRINTS by places-validate), in the look of samples/hauler-deck's I-a until the
// user scores (BELT_LOOK: Belt grey, patched panels, the union's red trim, hand-painted names):
//   berthBox   two berths boxed in a frame from the deck to the deckhead, 2.0 × 0.9 m, open on the room's side: each berth a dark
//              opening behind a curtain drawn part of the way across (its cloth a faded colour of the hauler's crew by the piece's
//              seed), the berth's owner's name hand-painted above it in the stencils' cream, a red stripe along the frame's top; the
//              makes are the frame's: 'belt' (Belt grey), 'patched' (the same with panels a step lighter or darker, by hash), 'bare'
//              (bare steel, the run-cold look of I-c)
//   lockPanel  the lock's override panel on its bulkhead beside the inner hatch, 0.3 × 0.4 m: a grey plate, its screen lit and its
//              lamp, amber while the lock cycles ('amber'), green when it is done ('green'); the lamp the stage lights live over it
//              is the view's (render/view.js: the panel's lamp, amber, green or red by the collar's record), so the batch, drawn
//              once, never changes mid-lane
// Not sampled (the build sheet §10: the lock's panel is my call; the berth boxes are I's, scored as the deck). Pure.
import { tex } from './kit.js';
import { C, bevel, cloth, folds } from './common.js';
import { tone, hash3 } from '../tone.js';
import { GLOW } from '../paint.js';

/** The deck's look until the user scores samples/hauler-deck (I-a's colours: the frame, its top, the trim, the stencils' paint). */
export const BELT_LOOK = Object.freeze({ frame: 0x7a7e80, top: 0x8a8e90, bare: 0x6a7480, trim: 0x9a2a24, paint: 0xd8d0b0, inside: 0x1e2026 });
/** The curtains' faded colours (a crew's own, by the piece's seed: my calls). */
export const CURTAINS = Object.freeze([0x6e8a86, 0xa08a5a, 0x8a6a72, 0x6a7a92]);
/** A berth's opening (metres off the deck, bottom and top) and the frame's inset either side of it; the curtain's share drawn across. */
const BERTHS_M = Object.freeze([[0.25, 1.05], [1.3, 2.1]]), INSET_M = 0.1, CURTAIN_K = 0.55;

// (the frame's colour by make, and a panel's tone by hash for 'patched')
const frameOf = (make) => (make === 'bare' ? BELT_LOOK.bare : BELT_LOOK.frame);
const front = (make, seed) => tex(`belt:berth:${make}:${seed % 4}`, (px, w, h, ppm) => {
  const F = frameOf(make), u = ppm / 16, m = (v) => Math.round(v * ppm), cur = CURTAINS[seed % CURTAINS.length];
  px(0, 0, w, h, F);
  // (patched: the frame in panels 0.6 m square, a few a step lighter or darker)
  if (make === 'patched') for (let j = 0; j < h; j += m(0.6)) for (let i = 0; i < w; i += m(0.6)) { const r = hash3(i, j, seed) % 5; if (r < 2) px(i, j, m(0.6), m(0.6), tone(F, r ? 0.05 : -0.06)); }
  bevel(px, 0, 0, w, h, F, 1.1);
  // (the union's red along the top)
  if (make !== 'bare') px(0, 0, w, Math.max(1, Math.round(u)), BELT_LOOK.trim);
  for (const [b, t] of BERTHS_M) {
    const x0 = m(INSET_M), x1 = w - m(INSET_M), y0 = h - m(t), y1 = h - m(b), ow = x1 - x0, oh = y1 - y0;
    // (the berth's inside, dark, its mattress's edge a lit line at the bottom)
    px(x0, y0, ow, oh, BELT_LOOK.inside);
    px(x0, y1 - Math.max(1, Math.round(u)), ow, Math.max(1, Math.round(u)), tone(BELT_LOOK.inside, 0.25));
    // (the curtain, drawn from the berth's head part of the way across, its folds)
    const cw = Math.max(2, Math.round(ow * CURTAIN_K));
    cloth(px, x0, y0, cw, oh, cur, { seed: seed + b * 10, u });
    folds(px, x0, y0, cw, oh, cur, { n: 3, seed: seed + 3, vertical: true });
    px(x0 + cw, y0, 1, oh, tone(cur, -0.18));
    // (the owner's name hand-painted above the berth: a few strokes of cream)
    const ny = y0 - Math.max(2, Math.round(2 * u)), nw = Math.max(3, Math.round(ow * (0.25 + (hash3(seed, b * 100, 5) % 20) / 100)));
    for (let i = 0; i < nw; i++) if (hash3(seed, i, b * 7) % 4) px(x0 + 1 + i, ny, 1, 1, BELT_LOOK.paint);
  }
});
const topOf = (make) => tex(`belt:berthtop:${make}`, (px, w, h) => { const F = make === 'bare' ? BELT_LOOK.bare : BELT_LOOK.top; px(0, 0, w, h, F); bevel(px, 0, 0, w, h, F, 1.1); });
/** A Belter's boxed berth pair (see the header): one box of the footprint, deck to deckhead, its berths on the room's side. */
export function berthBox(k, o) {
  const { W, D, H, seed } = o, make = o.make ?? 'belt';
  k.comp();
  k.box({ x: 0, z: 0, w: W, d: D, h: H, faces: { front: front(make, seed), back: tone(frameOf(make), -0.08), sides: tone(frameOf(make), -0.12), top: topOf(make) } });
}

/** The panel's colours: its plate, the screen and lamp by make. */
const PLATE = 0x5a5f63, LIT = Object.freeze({ amber: 0xffa23a, green: 0x4ab84a });
const panelFace = (make) => tex(`belt:panel:${make}`, (px, w, h, ppm) => {
  const L = LIT[make] ?? LIT.amber, s = Math.max(1, Math.round(ppm / 16));
  px(0, 0, w, h, PLATE);
  bevel(px, 0, 0, w, h, PLATE, 1.2);
  // (the screen across the top half, lit, a row of dark text on it; the lamp under it; a keypad's dots below)
  const sx = s, sy = s, sw = Math.max(2, w - 2 * s), sh = Math.max(2, Math.round(h * 0.4));
  px(sx, sy, sw, sh, tone(L, -0.25), GLOW.ALWAYS);
  for (let i = sx + 1; i < sx + sw - 1; i += 2) px(i, sy + Math.floor(sh / 2), 1, 1, L, GLOW.ALWAYS);
  px(Math.floor(w / 2) - s, sy + sh + s, 2 * s, s, L, GLOW.ALWAYS);
  for (let j = sy + sh + 3 * s; j < h - s; j += 2 * s) for (let i = 2 * s; i < w - 2 * s; i += 2 * s) px(i, j, s, s, C.steelD);
});
/** The lock's override panel (see the header): a plate on its bulkhead, its screen and lamp lit by make. */
export function lockPanel(k, o) {
  const { W, D, H } = o, make = o.make ?? 'amber';
  k.comp();
  k.box({ x: 0, z: 0, w: W, d: D, h: H, faces: { front: panelFace(make), top: PLATE, sides: tone(PLATE, -0.15) } });
}
