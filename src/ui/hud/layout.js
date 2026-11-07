// OLYMPUS hud: the HUD's reserved rectangles and the interface's scale (VIEWS §7.5).
//
// The user complained of overlapping interface in tradecraft, and LONGHAUL's rule is that nothing
// floats over a display, so every HUD element owns a fixed rectangle, and no two of one state meet
// (VIEWS §7.5). Their sizes are VIEWS's in CSS pixels at --ui 1, from the window's edges with a 12 px
// margin, all scaled by --ui: TOASTS 460 × 84 top left (three log lines), WATCH 280 × 132 top right
// (the wrist terminal, with the body strip folded in), INSTINCT 720 × 44 bottom centre (the instinct's
// line and R's offer; in a splash the ticker and its keycaps), RADIO 720 × 52 stacked on INSTINCT,
// GAP_PX over it (the radio box; in a splash the outcome strip), CLOCK 260 × 72 top centre (the
// splash's clock plaque), KEYS 120 × 32 bottom right ("? keys"), PAUSED 240 × 48. VIEWS puts PAUSED at the centre; it sits here at
// the top centre, in the margin row between TOASTS and WATCH, which it clears at every window the
// test uses and where it covers the least of the picture and never the figure at its middle (my
// call, after 0.0.2's shot of PAUSED over the picture's top edge at 18% of the height). CLOCK takes
// the same top centre in a splash, where PAUSED never shows (the splash's own pause is not the
// player's: TIME §6.4, Esc opens the menu instead), so the two never share a state.
//
// STATES says which rectangles each state uses (VIEWS §7.5's per-state table, cut to this round's):
// walking TOASTS, WATCH, INSTINCT, RADIO, KEYS; paused the same and PAUSED; a splash CLOCK, RADIO and
// INSTINCT, everything else hidden. The test proves every pair of one state apart.
//
// The 0.0.5 round's weapon mode (the build sheet §2.4, VIEWS §7.5): STEPS, 720 × 148 on INSTINCT (the
// step panel, the weapon card's 180 × 148 at its left; while a reflex card waits the panel shrinks to its
// weapon card and the reflex card takes the rest of STEPS beside it), RADIO on STEPS
// instead of on INSTINCT (RECTS' onIn), and PAPER, 200 × 200 at the top centre (your card close, the
// sheet's §8 item 21), placed under PAUSED's slot (below), so the paused weapon mode keeps both apart
// with PAUSED where it always is (my call: VIEWS puts both at the top centre and says nothing of the
// pair). States weapon (TOASTS, WATCH, PAPER, INSTINCT, STEPS, RADIO, KEYS) and weapon-paused (the
// same and PAUSED). At the four window sizes the test uses (1024 × 768, 1280 × 600, 1600 × 900, 1920
// × 1080) PAPER's foot clears RADIO's top by 314, 146, 233 and 279 px, and TOASTS by 26, 154, 85 and
// 102 px (core-browser prints them).
//
// The 0.0.7 round's far window (VIEWS §2.4, the build sheet 0.0.7 §2.5, §8 item 20): a round inset at the
// frame's edge along the bearing to a far point (a KD face 300 m off: the frame reaches 20 m), drawn by the
// stage (render/far.js) where this module says, so the HUD's rectangles stay one module's. placeFar(w, h,
// state, { bearingRad, rCss }) puts its centre where the ray from the player along the bearing meets the
// frame, inset FAR_INSET_PX, the disc's ring and bezel counted; where that meets a rectangle of the state
// (or the label it carries under, over or beside it would), it slides along the edge to the nearest free
// place, and its tick (FAR_TICK_PX on its ring) still points along the true bearing; nowhere free, it is
// left off (hidden), never drawn over the HUD. The state 'weapon-far' is the weapon mode's with PAPER
// yielding: on the KD your face is in the window, so the inset of your card has nothing to show (the sheet's).
// --ui is tradecraft's fit(): clamp(s / 2, 0.85, 1.5), s the window's scale over a 640 × 360 picture
// widened to the window's shape up to 768 × 430 (render/scale.js frameFor at 16 px/m's frame), so it
// is the same at either density: 1.5 at 1920 × 1080, 1.13 at 1440 × 900, 0.85 at 1024 × 768 (VIEWS's
// table). rectsAt(w, h) gives every rectangle in window pixels, for the test that proves them apart
// and for anything placed round them later (VIEWS's labels pass); applyScale() sets --ui on the page.
import { frameFor } from '../../render/scale.js';

/** The rectangles at --ui 1 (CSS px): size and anchor (VIEWS §7.5). */
export const RECTS = Object.freeze({
  TOASTS: Object.freeze({ w: 460, h: 84, anchor: 'top-left' }),
  WATCH: Object.freeze({ w: 280, h: 132, anchor: 'top-right' }),
  INSTINCT: Object.freeze({ w: 720, h: 44, anchor: 'bottom-centre' }),
  RADIO: Object.freeze({ w: 720, h: 52, anchor: 'bottom-centre', on: 'INSTINCT', onIn: Object.freeze({ weapon: 'STEPS', 'weapon-paused': 'STEPS', 'weapon-far': 'STEPS', 'weapon-far-paused': 'STEPS' }) }),
  STEPS: Object.freeze({ w: 720, h: 148, anchor: 'bottom-centre', on: 'INSTINCT' }),
  KEYS: Object.freeze({ w: 120, h: 32, anchor: 'bottom-right' }),
  PAUSED: Object.freeze({ w: 240, h: 48, anchor: 'top-centre' }),
  CLOCK: Object.freeze({ w: 260, h: 72, anchor: 'top-centre' }),
  PAPER: Object.freeze({ w: 200, h: 200, anchor: 'top-centre', below: 'PAUSED' }),
});
/** The weapon card's share of STEPS, at its left (CSS px at --ui 1; VIEWS §4.4, §7.5). */
export const CARD_W = 180, CARD_H = 148;
/** The rectangles each state uses (VIEWS §7.5's per-state table, this round's states). */
export const STATES = Object.freeze({
  walking: Object.freeze(['TOASTS', 'WATCH', 'INSTINCT', 'RADIO', 'KEYS']),
  paused: Object.freeze(['TOASTS', 'WATCH', 'INSTINCT', 'RADIO', 'KEYS', 'PAUSED']),
  splash: Object.freeze(['CLOCK', 'RADIO', 'INSTINCT']),
  weapon: Object.freeze(['TOASTS', 'WATCH', 'PAPER', 'INSTINCT', 'STEPS', 'RADIO', 'KEYS']),
  'weapon-paused': Object.freeze(['TOASTS', 'WATCH', 'PAPER', 'INSTINCT', 'STEPS', 'RADIO', 'KEYS', 'PAUSED']),
  // (0.0.7: the far window open, PAPER yields to it; paused, PAUSED as always)
  'weapon-far': Object.freeze(['TOASTS', 'WATCH', 'INSTINCT', 'STEPS', 'RADIO', 'KEYS']),
  'weapon-far-paused': Object.freeze(['TOASTS', 'WATCH', 'INSTINCT', 'STEPS', 'RADIO', 'KEYS', 'PAUSED']),
});
/** The margin from the window's edges, and between stacked rectangles (CSS px at --ui 1). */
export const MARGIN_PX = 12, GAP_PX = 6;
/** --ui's range (tradecraft's fit()). */
export const UI_MIN = 0.85, UI_MAX = 1.5;
const BASE_RES = Object.freeze([640, 360]), BASE_MAX = Object.freeze([768, 430]);

/** --ui for a window of w × h CSS pixels: clamp(s / 2, 0.85, 1.5), to two decimals. */
export function uiScale(w, h) {
  const f = frameFor(w, h, 1, { res: BASE_RES, resMax: BASE_MAX });
  return Math.round(Math.max(UI_MIN, Math.min(UI_MAX, f.scale / 2)) * 100) / 100;
}

/**
 * Every rectangle at a window of w × h in a state: { ui, TOASTS: { x, y, w, h }, … } in window pixels (a
 * stacked one GAP_PX over the one it sits on, on, or in the state its onIn names; a top one below another
 * GAP_PX under it). The state moves only RADIO (on STEPS in the weapon mode).
 */
export function rectsAt(w, h, state = 'walking') {
  const ui = uiScale(w, h), m = MARGIN_PX * ui, out = { ui };
  const placeOne = (name) => {
    if (out[name]) return out[name];
    const r = RECTS[name], rw = r.w * ui, rh = r.h * ui;
    const x = r.anchor.endsWith('left') ? m : r.anchor.endsWith('right') ? w - m - rw : (w - rw) / 2;
    const onName = r.onIn?.[state] ?? r.on, under = onName ? placeOne(onName) : null, over = r.below ? placeOne(r.below) : null;
    const y = under ? under.y - GAP_PX * ui - rh : over ? over.y + over.h + GAP_PX * ui : r.anchor.startsWith('top') ? m : h - m - rh;
    return (out[name] = { x, y, w: rw, h: rh });
  };
  for (const name of Object.keys(RECTS)) placeOne(name);
  return out;
}

/** The pairs of a state's rectangles that meet at a window of w × h (none, VIEWS §7.5): ['A × B', …]. */
export function clashesAt(w, h, state = 'walking') {
  const r = rectsAt(w, h, state), names = STATES[state] ?? [], out = [];
  for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) if (overlaps(r[names[i]], r[names[j]])) out.push(`${names[i]} × ${names[j]}`);
  return out;
}

/** Whether two rectangles ({ x, y, w, h } or a DOMRect's left, top, width, height) share any area. */
export function overlaps(a, b) {
  const L = (r) => r.x ?? r.left, T = (r) => r.y ?? r.top, W = (r) => r.w ?? r.width, H = (r) => r.h ?? r.height;
  return L(a) < L(b) + W(b) && L(b) < L(a) + W(a) && T(a) < T(b) + H(b) && T(b) < T(a) + H(a);
}

/** Set --ui on the page for the window's size now (and on every resize when watch is true). Returns the scale. */
export function applyScale({ root = globalThis.document?.documentElement, watch = true } = {}) {
  const set = () => { const ui = uiScale(globalThis.innerWidth, globalThis.innerHeight); root?.style.setProperty('--ui', String(ui)); return ui; };
  if (watch) globalThis.addEventListener?.('resize', set);
  return set();
}

// ---- the far window's place (VIEWS §2.4; the build sheet 0.0.7 §2.5) ----
/** The far window's radius in picture pixels at 640 × 360 (0.22 × the picture's height: VIEWS §2.4's FAR_R_PX). */
export const FAR_R_PX = 79;
/** Its inset from the frame's edge, its ring (1 px of ink) and bezel (3 px), and its tick on the ring, in picture pixels. */
export const FAR_INSET_PX = 4, FAR_RING_PX = 1, FAR_BEZEL_PX = 3, FAR_TICK_PX = 3;
/** How finely the slide along the edge looks for a free place (CSS px). */
export const FAR_SLIDE_STEP_PX = 2;
/** The label's gap from the disc's bezel (CSS px at --ui 1). */
export const FAR_LABEL_GAP_PX = 4;

/**
 * The far window's place in a window of w × h CSS px for a state's rectangles: { cx, cy, r, R, tickRad, slid,
 * slidPx, label: { x, y, w, h, side } | null, hidden }. bearingRad the bearing from the player to the far point
 * in the picture (0 east, π/2 south: the screen's own axes); rCss the disc's radius (FAR_R_PX × the picture's
 * scale), k the picture's CSS px a picture pixel (for the inset, the ring and the bezel; rCss / FAR_R_PX by
 * default); frame the picture's box on the page ({ x, y, w, h }, the window by default); from the player's place
 * on the page (the frame's centre by default); label { w, h } the box of the window's plaque (CSS px), kept
 * free with the disc below it, above it, or beside it on the frame's side. Hidden when nowhere is free.
 */
export function placeFar(w, h, state = 'weapon-far', { bearingRad = 0, rCss = null, k = null, frame = null, from = null, label = null } = {}) {
  const ui = uiScale(w, h);
  const f0 = frame ?? { x: 0, y: 0, w, h };
  // (the frame inside the window: a letterboxed picture's box, never past the window's edge)
  const fx0 = Math.max(0, f0.x), fy0 = Math.max(0, f0.y), fx1 = Math.min(w, f0.x + f0.w), fy1 = Math.min(h, f0.y + f0.h);
  const kk = k ?? (rCss ? rCss / FAR_R_PX : frameFor(w, h, 1, { res: BASE_RES, resMax: BASE_MAX }).scale);
  const r = rCss ?? FAR_R_PX * kk, R = r + (FAR_RING_PX + FAR_BEZEL_PX) * kk, inset = FAR_INSET_PX * kk;
  // (what is kept free: the disc to its bezel and the tick past it, all round, since the tick goes wherever the bearing says)
  const RK = R + FAR_TICK_PX * kk;
  // (the rectangle the centre may stand in: the frame less the disc's outer radius and the inset)
  const ax = fx0 + RK + inset, ay = fy0 + RK + inset, bx = fx1 - RK - inset, by = fy1 - RK - inset;
  const hidden = { cx: null, cy: null, r, R, RK, tickRad: bearingRad, slid: false, slidPx: 0, label: null, hidden: true };
  if (bx < ax || by < ay) return hidden;
  const o = from ?? { x: (fx0 + fx1) / 2, y: (fy0 + fy1) / 2 };
  const ox = Math.max(ax, Math.min(bx, o.x)), oy = Math.max(ay, Math.min(by, o.y));
  // (where the ray from the player meets the centre's rectangle)
  const dx = Math.cos(bearingRad), dy = Math.sin(bearingRad);
  const tx = dx > 1e-9 ? (bx - ox) / dx : dx < -1e-9 ? (ax - ox) / dx : Infinity, ty = dy > 1e-9 ? (by - oy) / dy : dy < -1e-9 ? (ay - oy) / dy : Infinity;
  const t = Math.min(tx, ty), hx = ox + dx * t, hy = oy + dy * t;
  // (the centre's rectangle's edge as one loop: top left to right, right down, bottom right to left, left up)
  const W = bx - ax, Hh = by - ay, P = 2 * (W + Hh);
  const at = (s) => {
    s = ((s % P) + P) % P;
    if (s <= W) return [ax + s, ay];
    if (s <= W + Hh) return [bx, ay + (s - W)];
    if (s <= 2 * W + Hh) return [bx - (s - W - Hh), by];
    return [ax, by - (s - 2 * W - Hh)];
  };
  const sOf = (x, y) => {
    const e = 1e-6;
    if (Math.abs(y - ay) < e) return x - ax;
    if (Math.abs(x - bx) < e) return W + (y - ay);
    if (Math.abs(y - by) < e) return W + Hh + (bx - x);
    return 2 * W + Hh + (by - y);
  };
  const rects = rectsAt(w, h, state), names = STATES[state] ?? [];
  const blocks = names.map(n => rects[n]).filter(Boolean);
  const gap = FAR_LABEL_GAP_PX * ui;
  // (the label's place round a disc at (cx, cy): below, above, then beside it toward the frame's middle)
  const labelAt = (cx, cy, side) => {
    if (!label) return null;
    const lw = label.w, lh = label.h;
    if (side === 'below') return { x: cx - lw / 2, y: cy + RK + gap, w: lw, h: lh, side };
    if (side === 'above') return { x: cx - lw / 2, y: cy - RK - gap - lh, w: lw, h: lh, side };
    const right = cx < (fx0 + fx1) / 2;
    return { x: right ? cx + RK + gap : cx - RK - gap - lw, y: cy - lh / 2, w: lw, h: lh, side: right ? 'right' : 'left' };
  };
  const inFrame = (b) => b.x >= fx0 && b.y >= fy0 && b.x + b.w <= fx1 && b.y + b.h <= fy1;
  const free = (b) => !blocks.some(x => overlaps(b, x));
  const fits = (cx, cy) => {
    const disc = { x: cx - RK, y: cy - RK, w: 2 * RK, h: 2 * RK };
    if (!free(disc)) return null;
    if (!label) return { label: null };
    for (const side of ['below', 'above', 'beside']) {
      const L = labelAt(cx, cy, side);
      if (inFrame(L) && free(L) && !overlaps(L, disc)) return { label: L };
    }
    return null;
  };
  const s0 = sOf(hx, hy);
  for (let d = 0; d <= P / 2; d += FAR_SLIDE_STEP_PX) {
    for (const s of d ? [s0 - d, s0 + d] : [s0]) {
      const [cx, cy] = at(s), ok = fits(cx, cy);
      if (ok) return { cx, cy, r, R, RK, tickRad: bearingRad, slid: d > 0, slidPx: d, label: ok.label, hidden: false };
    }
  }
  return hidden;
}
/** The far window's tick: the ring's point along the true bearing and the tick's outer end (CSS px), FAR_TICK_PX long outward. */
export function farTick(p, k = 1) {
  if (!p || p.hidden) return null;
  const c = Math.cos(p.tickRad), s = Math.sin(p.tickRad);
  return { x0: p.cx + c * p.r, y0: p.cy + s * p.r, x1: p.cx + c * (p.R + FAR_TICK_PX * k), y1: p.cy + s * (p.R + FAR_TICK_PX * k) };
}
