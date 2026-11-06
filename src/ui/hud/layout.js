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
  RADIO: Object.freeze({ w: 720, h: 52, anchor: 'bottom-centre', on: 'INSTINCT', onIn: Object.freeze({ weapon: 'STEPS', 'weapon-paused': 'STEPS' }) }),
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
