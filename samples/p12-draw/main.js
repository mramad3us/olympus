// OLYMPUS sample: the P-12 on the figure at 16 px/m, moving: holstered, drawn from the thigh, aimed, fired twice, holstered again.
//
// The P-12 (WEAPONS §3.2, built in v0.0.14) rides a thigh holster on the right and comes out on the Transition: pistol (COMBAT
// §25.19.6; the draw 1.1 s, the holster 1.3 s, WEAPONS §5.2's base times). Each design of src/art/pistols.js has a figure
// template (seven pixels along, the 0.42 m compose.js draws a chibi's pistol: body.js pistolM); the game draws templates.js
// GUNS.pistol for every pistol until the user's pick wires one through, so this page swaps the design's template into
// GUNS.pistol while it composes its own frames and puts it back after (its stations are GUNS.pistol's scaled to its length,
// so every hand holds it where it held the old one). Nothing else is the sample's: the figure is the game's composeFrame and
// shade (src/art/figures/), the marine in the black combat EVA suit with its carrier (the shoot house's sergeant), the legs
// of walk.js's 'draw' and 'pistolAim' beats, the rigs compose.js already has for a pistol ('slung' is the holster, 'low', 'aim'
// with its turn and kick), the flash the game's (templates.js flashCells), at 1 G on the shoot house's slab floor, snapped to
// the Mars palette as the stage's post pass snaps them (?snap=0 raw).
// The loop, 5.2 s, timed to WEAPONS' base times: holstered 0.8 s; the draw, 1.1 s (the grip at the holster 0.2, the pistol
// clear of it one-handed 0.35, the press out 0.25, the sights 0.3); two shots 0.4 s apart, each its kick 140 ms and its flash
// 70 ms (poses.js KICK_MS, FLASH_MS); the aim held 0.6 s; the scan at the low ready 0.5 s; the holster, 1.3 s (the pistol to
// the holster's mouth 0.6, seated 0.4, the hand off 0.3); holstered 0.4 s.
// ?look=util draws the marine in utilities with the carrier (the range's look), where the black suit hides the holster's
// line and the pistol against the legs. ?set= picks the picture:
//   draw   one design (?d=p12a|p12b|p12c|p12d): the four facings at 16 px/m, the figure side on three times larger, the
//          pistol's template alone at 16 px/m and six times larger, and the loop's phases with the one running lit;
//   all    the four designs side by side, side on three times larger, on one clock, and each facing you and away at 1×.
// The page runs by itself (the moving sample: DESIGN.md, 2026-11-12, "a sample of anything that moves is shown moving");
// Space stops and starts it, S slows it to a quarter, R starts it again. Shot by the gallery (a webdriver, without the
// gallery's ?hud=1), it holds still at the aim between the two shots, so the shot is the same each time; ?t=<s>
// holds it still at that moment of the loop.
// window.__report: the frame, the loop's phases; window.__ready once drawn.
import { composeFrame } from '../../src/art/figures/compose.js';
import { shade } from '../../src/art/figures/shade.js';
import { wear, coloursOf } from '../../src/art/figures/outfits.js';
import { GUNS, shapeAt, flashCells } from '../../src/art/figures/templates.js';
import { beatPose } from '../../src/art/figures/walk.js';
import { text } from '../../src/art/font.js';
import { PALETTES, nearest } from '../../src/art/palette.js';
import { PISTOL_DESIGNS, PISTOL_DESIGN_IDS } from '../../src/art/pistols.js';

const params = new URLSearchParams(location.search), set = params.get('set') === 'all' ? 'all' : 'draw';
const id = PISTOL_DESIGNS[params.get('d')] ? params.get('d') : 'p12a';
const atT = params.has('t') ? Number(params.get('t')) || 0 : null, still = atT !== null || (navigator.webdriver && params.get('hud') !== '1');
const PPM = 16, CW = 40, CH = 44;
const BG = 0x0e0f14, FLOOR = 0x8a8a86, LABEL = 0x9aa0ab, HEAD = 0xd8dce4, LIT = 0xe7b84a;
/** The pictures' sizes (sample.json's pixel). */
export const SIZE = Object.freeze({ draw: [320, 184], all: [420, 196] });
const [W, H] = SIZE[set];

// ---------- the loop (see the header): [label, seconds, frame] ----------
const PHASES = Object.freeze([
  ['HOLSTERED', 0.8, 'hol'], ['GRIP', 0.2, 'grip'], ['CLEAR', 0.35, 'clear'], ['PRESS OUT', 0.25, 'press'], ['AIM', 0.3, 'aim'],
  ['FIRE', 0.14, 'fire'], ['AIM', 0.26, 'aim'], ['FIRE', 0.14, 'fire'], ['AIM', 0.6, 'aim'], ['SCAN', 0.5, 'ready'],
  ['HOLSTER', 0.6, 'clear'], ['SEAT', 0.4, 'grip'], ['HAND OFF', 0.3, 'hol'], ['HOLSTERED', 0.4, 'hol'],
]);
const LOOP_S = PHASES.reduce((a, p) => a + p[1], 0);
/** The phase at t s: { i, label, frame, u (seconds into it) }. */
function phaseAt(t) {
  let s = ((t % LOOP_S) + LOOP_S) % LOOP_S;
  for (let i = 0; i < PHASES.length; i++) { if (s < PHASES[i][1]) return { i, label: PHASES[i][0], frame: PHASES[i][2], u: s }; s -= PHASES[i][1]; }
  return { i: 0, label: PHASES[0][0], frame: PHASES[0][2], u: 0 };
}
/** The still the gallery shoots: the aim between the two shots, the pistol clear of its flash. */
const STILL_T = PHASES.slice(0, 6).reduce((a, p) => a + p[1], 0) + 0.1;

// ---------- the picture: a buffer of whole pixels ----------
const buf = new Uint32Array(W * H);
const abgr = (c) => 0xff000000 | ((c & 0xff) << 16) | (c & 0xff00) | ((c >>> 16) & 0xff);
const SNAPPED = new Map(), snapOn = params.get('snap') !== '0';
const snap = (c) => { if (!snapOn) return c; if (!SNAPPED.has(c)) SNAPPED.set(c, nearest(c, PALETTES.mars)); return SNAPPED.get(c); };
const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) buf[y * W + x] = abgr(c); };
const fill = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, c); };
const say = (x, y, s, c = LABEL) => text((X, Y, w, h, col) => fill(X, Y, w, h, col), x, y, s, c);

// ---------- the frames, composed once each ----------
const lookId = params.get('look') === 'util' ? 'util' : 'suit';
const look = wear({ outfit: lookId === 'util' ? 'utilities' : 'combatSuit', carrier: true, weapon: 'pistol', carry: 'low', seed: 3, model: 'r7', skin: 'tan', hair: { style: 'highTight', color: 'dark' } }), col = coloursOf(look, PPM);
const BASE = Object.freeze({ draw: beatPose('draw', { weapon: 'pistol' }), aim: beatPose('pistolAim', { weapon: 'pistol' }) });
/** A loop frame's pose (see the header): the draw beat's legs until the press out, the aim beat's after; the rig and the arms by the frame. */
function poseOf(frame) {
  const legs = frame === 'hol' || frame === 'grip' || frame === 'clear' ? BASE.draw : BASE.aim;
  const P = { ...legs, rig: null, arms: undefined };
  switch (frame) {
    case 'hol': return { ...P, lean: 0.04, rig: { mode: 'slung', gun: 'pistol' }, arms: { r: [0.02, 0.14, 0.09], l: [0.02, 0.14, 0.07] } };
    case 'grip': return { ...P, lean: 0.06, rig: { mode: 'slung', gun: 'pistol' }, arms: { r: [-0.12, 0.12, 0.17], l: [0.5, 1.3, 0.1] } };
    case 'clear': return { ...P, rig: { mode: 'low', gun: 'pistol', oneHand: true }, arms: { r: [0, 0.1, 0.06], l: [0.55, 1.35, 0.1] } };
    case 'press': return { ...P, rig: { mode: 'aim', gun: 'pistol', turn: -0.7, kick: 0 } };
    case 'aim': return { ...P, rig: { mode: 'aim', gun: 'pistol', turn: 0, kick: 0 } };
    case 'fire': return { ...P, rig: { mode: 'aim', gun: 'pistol', turn: 0, kick: 1 } };
    case 'ready': return { ...P, rig: { mode: 'low', gun: 'pistol' } };
    default: return P;
  }
}
// (the design's template in GUNS.pistol's place while a frame is composed, then GUNS.pistol as it was: see the header)
const G = GUNS.pistol, ORIGINAL = { len: G.len, grip: G.grip, fore: G.fore, muzzle: G.muzzle, magwell: G.magwell, parts: G.parts, mag: G.mag };
function withFig(d, fn) {
  const f = PISTOL_DESIGNS[d].fig;
  Object.assign(G, { len: f.len, grip: f.grip, fore: f.fore, muzzle: f.muzzle, magwell: f.magwell, parts: f.parts, mag: f.mag });
  try { return fn(); } finally { Object.assign(G, ORIGINAL); }
}
const FR = new Map();
/** A frame of a design facing dir: { px: [[x, y, colour]], ax, ay, muzzle, flash }. */
function frameOf(d, dir, frame) {
  const key = `${d}|${dir}|${frame}`;
  let f = FR.get(key);
  if (!f) {
    const fr = withFig(d, () => composeFrame(look, dir, 'draw', { ppm: PPM, pose: poseOf(frame) })), pm = shade(fr.cells, col), px = [];
    for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) {
      const v = pm.data[y * pm.w + x];
      if ((v >>> 24) >= 128) px.push([x, y, snap(((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff))]);
    }
    f = { px, ax: fr.ax, ay: fr.ay, muzzle: fr.muzzle, flash: fr.flash };
    FR.set(key, f);
  }
  return f;
}
/** A frame drawn k times larger, its anchor at (x, y), with the flash when the phase is a shot's first 70 ms. */
function blitFrame(f, x, y, k, flash) {
  for (const [a, b, c] of f.px) fill(x + (a - f.ax) * k, y + (b - f.ay) * k, k, k, c);
  if (flash && f.muzzle && f.flash) for (const [a, b, c] of flashCells(f.flash.kind, f.muzzle[0], f.muzzle[1], f.flash.th ?? 0)) fill(x + (a - f.ax) * k, y + (b - f.ay) * k, k, k, snap(c));
}
/** The figure at time t in a cell (x, y, w, h) on the floor, k times larger. */
function figure(d, dir, t, x, y, w, h, k = 1) {
  const p = phaseAt(t), f = frameOf(d, dir, p.frame);
  fill(x, y, w, h, snap(FLOOR));
  blitFrame(f, x + Math.floor(w / 2), y + h - 3 * k, k, p.frame === 'fire' && p.u < 0.07);
}
/** The design's template alone, shaded as the figure is, at (x, y), k times larger. */
function alone(d, x, y, k) {
  const fig = PISTOL_DESIGNS[d].fig, cells = shapeAt('pistol', 7, 1, true, fig);
  const xs = cells.map(c => c[0]), ys = cells.map(c => c[1]), a0 = Math.min(...xs), b0 = Math.min(...ys);
  const w = Math.max(...xs) - a0 + 3, h = Math.max(...ys) - b0 + 3, grid = Array.from({ length: h }, () => Array(w).fill(null));
  for (const [a, b, ch] of cells) grid[b - b0 + 1][a - a0 + 1] = { ch, part: 1 };
  const pm = shade(grid, col);
  for (let j = 0; j < pm.h; j++) for (let i = 0; i < pm.w; i++) { const v = pm.data[j * pm.w + i]; if ((v >>> 24) >= 128) fill(x + i * k, y + j * k, k, k, snap(((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff))); }
}

// ---------- the pictures ----------
let tS = atT ?? (still ? STILL_T : 0), running = !still, slow = false;
const DIRS = [['right', 'RIGHT'], ['left', 'LEFT'], ['down', 'AT YOU'], ['up', 'AWAY']];
function drawOne() {
  const D = PISTOL_DESIGNS[id], p = phaseAt(tS);
  say(4, 2, `${id.toUpperCase()}  ${D.name.toUpperCase().split(':')[0]}`, HEAD);
  DIRS.forEach(([dir, label], i) => { say(4 + i * (CW + 2) + 1, 10, label); figure(id, dir, tS, 4 + i * (CW + 2), 17, CW, CH); });
  say(4, 64, 'SIDE ON X3');
  figure(id, 'right', tS, 4, 71, 166, 102, 3);
  // (the template alone, and the loop's phases with the one running lit)
  say(178, 10, '16 PX/M'); fill(178, 17, 30, 14, snap(FLOOR)); alone(id, 182, 19, 1);
  say(214, 10, 'X6'); fill(214, 17, 102, 44, snap(FLOOR)); alone(id, 220, 19, 6);
  let y = 66;
  PHASES.forEach(([label, s], i) => { say(178, y, `${label}`, i === p.i ? LIT : LABEL); say(238, y, `${s.toFixed(2)} S`, i === p.i ? LIT : LABEL); y += 7; });
  say(178, y + 2, `${(tS % LOOP_S).toFixed(2)} / ${LOOP_S.toFixed(1)} S`, HEAD);
}
function drawAll() {
  const p = phaseAt(tS);
  say(4, 2, `THE FOUR P-12 DESIGNS ON ONE CLOCK: ${p.label}`, HEAD);
  PISTOL_DESIGN_IDS.forEach((d, i) => {
    const x = 4 + i * 104;
    say(x + 1, 10, `${PISTOL_DESIGNS[d].short}  ${d.toUpperCase()}`);
    figure(d, 'right', tS, x, 17, 102, 120, 3);
    figure(d, 'down', tS, x, 139, 50, CH);
    figure(d, 'up', tS, x + 52, 139, 50, CH);
  });
}
function keysLine() {
  say(4, H - 7, running ? `SPACE STOP   S ${slow ? 'FULL SPEED' : 'SLOW 1/4'}   R AGAIN` : still ? 'STILL FOR THE SHOT: OPEN IT WITH O TO SEE IT MOVE' : 'SPACE RUN   R AGAIN');
}
const cv = document.getElementById('pic'), g = cv.getContext('2d');
cv.width = W; cv.height = H;
function draw() {
  buf.fill(abgr(BG));
  if (set === 'draw') drawOne(); else drawAll();
  keysLine();
  const img = g.createImageData(W, H);
  new Uint32Array(img.data.buffer).set(buf);
  g.putImageData(img, 0, 0);
}
function fit() {
  const k = Math.max(1, Math.floor(Math.min(innerWidth / W, innerHeight / H)));
  cv.style.width = `${W * k}px`; cv.style.height = `${H * k}px`;
}
fit();
addEventListener('resize', fit);
draw();
addEventListener('keydown', (e) => {
  if (e.code === 'Space') { running = !running; e.preventDefault(); }
  else if (e.code === 'KeyS') slow = !slow;
  else if (e.code === 'KeyR') tS = 0;
  else return;
  draw();
});
let then = performance.now();
const tick = (now) => {
  // (a frame's timestamp can come before the moment the loop started: never a step back in time)
  const dt = Math.max(0, Math.min(0.1, (now - then) / 1000)); then = Math.max(then, now);
  if (running) { tS += dt * (slow ? 0.25 : 1); draw(); }
  requestAnimationFrame(tick);
};
if (!still) requestAnimationFrame(tick);
window.__report = { frame: [W, H], set, look: lookId, drawing: set === 'draw' ? id : null, still, loopS: LOOP_S, phases: PHASES.map(([l, s, f]) => ({ label: l, s, frame: f })), snapped: snapOn ? 'mars' : null };
requestAnimationFrame(() => requestAnimationFrame(() => { window.__ready = true; }));
