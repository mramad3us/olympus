// OLYMPUS sample: the walk cycles of rework 1, today's beside the designer's three, animated on the chibi in the combat EVA suit.
//
// The user, 2026-11-11, of v0.0.12's shoot house: "saying that the walking about is goofy is an understatement, the animation
// is really not there yet." The animation designer's proposal (rework 1, part 9) puts three walk cycles to be scored animated:
// A "eight, planted", B "eight, rolling", C "six, bold", beside W0, v0.0.12 as built. Every frame is drawn by the game's own
// figure code (src/art/figures/cycles.js, the candidates as poses for compose.js; W0 the game's own stroll and run frames,
// poses.js), on the chibi at 16 px/m in the black combat EVA suit with its carrier and the R-7, at 1 G, on the shoot house's
// slab floor, snapped to the Mars palette as the stage's post pass snaps them (?snap=0 raw). Two bands each: the Combat glide at
// the low ready (1.23 m/s) and Assault aimed (2.03 m/s), the speeds the body walks (src/sim/body/motion.js gaitSpeeds).
//
// How the frames follow the body, the proposal's §2, applied here and nowhere in the game yet: a candidate's frame comes from the
// metres walked, counted in its own steps (the planted travel S px), and side on its card is placed by the planted foot (the plant
// lock: each frame's travel is baked in whole pixels, so the boot on the floor never moves); seen from the front or behind the card
// follows the body (DEPTH_K draws the stride at 0.4 of its length there, so no lock can hold the foot: the slip is measured and
// shown). W0 is drawn as the game draws it: its frame from the metres walked over STEP_M, its card at the body's pixel.
//
// ?set= picks the picture:
//   cycle   one candidate (?c=W0|A|B|C): for each band its frames side on, from the front and from behind (the three-quarter
//           views of the stage's 45° camera), each row led by a treadmill (the figure walking in place over a floor that moves
//           under it: the camera on the body), then two lanes where it walks across the floor leaving its footprints (each foot's
//           prints its own row and shade, its sole where it lay flat: a clean dash is a foot that held, a smear one that slid), and the numbers: cadence, frames a second, slip,
//           the head's and the muzzle's rows;
//   lanes   the four side by side: the treadmills of every candidate in both bands and three facings, then a strip of each
//           walking side on, a picture every 1/12 s for a second, so the cadences compare on one clock.
// ?look=util draws them in utilities (the range's look) instead of the suit, whose black legs hide much of the stride.
// Live (the gallery's O, ?hud=1, or ?live=1) it runs: Space stops and starts time, S slows it to a quarter, F hides the prints,
// R starts again. Shot (no hud), it is still: the treadmills at their first frame, the lanes as a multiple exposure.
// window.__report: the frame, and every candidate's numbers; window.__ready once drawn.
import { CANDIDATES, CANDIDATE_IDS, CYCLE_BANDS, cycleOf, cycleFrame } from '../../src/art/figures/cycles.js';
import { STEP_M } from '../../src/art/figures/poses.js';
import { shade } from '../../src/art/figures/shade.js';
import { wear, coloursOf } from '../../src/art/figures/outfits.js';
import { text } from '../../src/art/font.js';
import { PALETTES, nearest } from '../../src/art/palette.js';
import { gaitSpeeds } from '../../src/sim/body/motion.js';

const params = new URLSearchParams(location.search), set = params.get('set') === 'lanes' ? 'lanes' : 'cycle';
const cid = CANDIDATES[params.get('c')] ? params.get('c') : 'B';
const live = params.get('hud') === '1' || params.get('live') === '1';
const PPM = 16, CW = 32, CH = 36;
/** The bands' speeds at 1 G (BODY §16.1 as built). */
const SPEED = { glide: gaitSpeeds({ gG: 1, gait: 'combat' }).walkMs, assault: gaitSpeeds({ gG: 1, gait: 'assault' }).walkMs };
const BANDS = ['glide', 'assault'], FACES = ['right', 'down', 'up'];
const BG = 0x0e0f14, FLOOR = 0x8a8a86, TICK = 0x6c6d6a, LABEL = 0x9aa0ab, HEAD = 0xd8dce4, PRINT = { r: 0xf0ece0, l: 0x2a2c33 };
/** The pictures' sizes (sample.json's pixel). */
export const SIZE = Object.freeze({ cycle: [304, 378], lanes: [428, 412] });
const [W, H] = SIZE[set];

// ---------- the picture: a buffer of whole pixels ----------
const buf = new Uint32Array(W * H);
const abgr = (c) => 0xff000000 | ((c & 0xff) << 16) | (c & 0xff00) | ((c >>> 16) & 0xff);
const SNAPPED = new Map(), snapOn = params.get('snap') !== '0';
const snap = (c) => { if (!snapOn) return c; if (!SNAPPED.has(c)) SNAPPED.set(c, nearest(c, PALETTES.mars)); return SNAPPED.get(c); };
let clip = null;                                                  // ([x0, y0, x1, y1]: a treadmill draws inside its cell only)
const put = (x, y, c) => { if (x < 0 || y < 0 || x >= W || y >= H) return; if (clip && (x < clip[0] || y < clip[1] || x >= clip[2] || y >= clip[3])) return; buf[y * W + x] = abgr(c); };
const fill = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, c); };
const say = (x, y, s, c = LABEL) => text((X, Y, w, h, col) => fill(X, Y, w, h, col), x, y, s, c);

// ---------- the frames, composed once ----------
const lookId = params.get('look') === 'util' ? 'util' : 'suit';
const look = wear({ outfit: lookId === 'util' ? 'utilities' : 'combatSuit', weapon: 'rifle', carry: 'low', carrier: true, seed: 3, model: 'r7' }), col = coloursOf(look, PPM);
const FR = new Map();
/** A frame of a candidate's band facing dir: { px: [[x, y, colour]], ax, ay, feet, muzzle, top, cycle }. */
function frameOf(c, band, dir, k) {
  const key = `${c}|${band}|${dir}|${k}`;
  let f = FR.get(key);
  if (!f) {
    const fr = cycleFrame(look, dir, c, band, k, { ppm: PPM }), pm = shade(fr.cells, col), px = [];
    let top = Infinity;
    for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) {
      const v = pm.data[y * pm.w + x];
      if ((v >>> 24) < 128) continue;
      px.push([x, y, snap(((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff))]);
      top = Math.min(top, y);
    }
    f = { px, ax: fr.ax, ay: fr.ay, feet: fr.feet, muzzle: fr.muzzle, top, cycle: fr.cycle };
    FR.set(key, f);
  }
  return f;
}
/** A frame drawn with its anchor at (x, y). */
function blitFrame(f, x, y) { for (const [px, py, c] of f.px) put(x - f.ax + px, y - f.ay + py, c); }

// ---------- which frame, and where, for metres walked (the proposal's §2; W0 as the game does it) ----------
/** { k, off (px along the travel from the start), lock } for a candidate's band, d metres walked, seen facing dir. */
function drawnAt(c, band, d, dir) {
  d = Math.max(0, d);
  const cy = cycleOf(c, band), simPx = d * PPM;
  if (cy.builtin) return { k: Math.floor(d / CANDIDATES.W0.builtin[band].stepM) % 4, off: Math.round(simPx), lock: false };
  const b = CANDIDATES[c].bands[band], step = Math.floor(simPx / b.S), frac = simPx - step * b.S;
  // (the key whose baked travel has been walked: the frame changes when the body reaches it, so the card is never ahead of the body)
  let j = 0;
  for (let i = 0; i < b.fps; i++) if (b.keys[0].plant[0] - b.keys[i].plant[0] <= frac + 1e-9) j = i;
  const k = (step % 2) * b.fps + j, baked = step * b.S + b.keys[0].plant[0] - b.keys[j].plant[0];
  const side = dir === 'right' || dir === 'left';
  return { k, off: side ? baked : Math.round(simPx), lock: side };
}

// ---------- the numbers: measured from the drawn frames ----------
/** Which of a frame's boot ends are on the floor, read side on (the pose is the same from every side): { r: { heel, toe }, l }. */
function groundedOf(c, band) {
  const cy = cycleOf(c, band), frames = Array.from({ length: cy.frames }, (_, k) => frameOf(c, band, 'right', k));
  const low = {};
  for (const s of ['r', 'l']) low[s] = Math.max(...frames.flatMap(f => [f.feet[s].heel[1], f.feet[s].toe[1]]));
  return frames.map(f => Object.fromEntries(['r', 'l'].map(s => [s, { heel: f.feet[s].heel[1] >= low[s] - 0.35, toe: f.feet[s].toe[1] >= low[s] - 0.35 }])));
}
/**
 * Slip seen facing dir over two cycles walked: the boot's point on the floor followed from frame to frame while it stays there,
 * its movement on the picture summed per stance (px). { meanPx, maxPx, stances }.
 */
function slipOf(c, band, dir) {
  const cy = cycleOf(c, band), G = groundedOf(c, band), axis = dir === 'right' ? [1, 0] : dir === 'left' ? [-1, 0] : dir === 'down' ? [0, 1] : [0, -1];
  const along = (p) => (axis[0] ? p[0] * axis[0] : p[1] * axis[1]);
  const total = 2 * cy.frames * (cy.stepM / cy.framesPerStep) * 1.0001;
  let last = null;
  const stance = { r: 0, l: 0 }, done = [];
  for (let d = 0; d <= total; d += 0.001) {
    const at = drawnAt(c, band, d, dir);
    if (last && last.k === at.k && last.off === at.off) continue;
    const f = frameOf(c, band, dir, at.k), g = G[at.k];
    for (const s of ['r', 'l']) {
      const pt = (end) => (g[s][end] ? at.off + along(f.feet[s][end]) : null);
      const now = { heel: pt('heel'), toe: pt('toe') };
      const was = last?.pts?.[s];
      if (now.heel === null && now.toe === null) { if (was) { done.push(stance[s]); stance[s] = 0; } continue; }
      if (was) {
        const end = now.heel !== null && was.heel !== null ? 'heel' : now.toe !== null && was.toe !== null ? 'toe' : null;
        if (end) stance[s] += Math.abs(now[end] - was[end]);
      }
    }
    last = { k: at.k, off: at.off, pts: Object.fromEntries(['r', 'l'].map(s => [s, (g[s].heel || g[s].toe) ? { heel: g[s].heel ? at.off + along(f.feet[s].heel) : null, toe: g[s].toe ? at.off + along(f.feet[s].toe) : null } : null])) };
  }
  const all = done.length ? done : [stance.r, stance.l];
  return { meanPx: all.reduce((a, b) => a + b, 0) / all.length, maxPx: Math.max(...all), stances: all.length };
}
/** Pixels that differ between frame k and the same key of the other step (k + half a cycle), averaged over k: the two halves told apart. */
function distinctOf(c, band, dir) {
  const cy = cycleOf(c, band), half = cy.frames / 2, pic = (f) => new Map(f.px.map(([x, y, col]) => [`${x - f.ax},${y - f.ay}`, col]));
  let sum = 0;
  for (let k = 0; k < half; k++) {
    const a = pic(frameOf(c, band, dir, k)), b = pic(frameOf(c, band, dir, k + half));
    for (const [p, v] of a) if (b.get(p) !== v) sum++;
    for (const p of b.keys()) if (!a.has(p)) sum++;
  }
  return sum / half;
}
const NUMBERS = {};
for (const c of CANDIDATE_IDS) {
  NUMBERS[c] = {};
  for (const band of BANDS) {
    const cy = cycleOf(c, band), v = SPEED[band], stepM = cy.stepM, cadence = v / stepM;
    const side = Array.from({ length: cy.frames }, (_, k) => frameOf(c, band, 'right', k));
    const rows = (xs) => Math.max(...xs) - Math.min(...xs);
    NUMBERS[c][band] = {
      speedMs: v, stepM: +stepM.toFixed(3), framesPerCycle: cy.frames, cadenceHz: +cadence.toFixed(2), fps: +(cadence * cy.framesPerStep).toFixed(1),
      slipSidePx: +slipOf(c, band, 'right').meanPx.toFixed(2), slipFrontPx: +slipOf(c, band, 'down').meanPx.toFixed(2), slipBackPx: +slipOf(c, band, 'up').meanPx.toFixed(2),
      headRowsPx: rows(side.map(f => f.top - f.ay)), muzzleRowsPx: rows(side.map(f => Math.round(f.muzzle[1] - f.ay))),
      distinctSidePx: Math.round(distinctOf(c, band, 'right')), distinctFrontPx: Math.round(distinctOf(c, band, 'down')),
    };
  }
}
// (W0's step is two of its frames: STEP_M a frame, kept for the record)
NUMBERS.W0.stepMPerFrame = { glide: STEP_M.stroll, assault: STEP_M.run };

// ---------- drawing ----------
const fmt = (v, n = 2) => Number(v).toFixed(n);
/** A floor patch with its moving marks: a treadmill (the camera on the body) or a lane. */
function floor(x, y, w, h) { fill(x, y, w, h, snap(FLOOR)); }
/** The figure of a candidate's band walking in place in a cell at (x, y), d metres walked: the floor's marks move under it. */
function treadmill(c, band, dir, x, y, d) {
  floor(x, y, CW, CH);
  clip = [x, y, x + CW, y + CH];
  const at = drawnAt(c, band, d, dir), sim = Math.round(d * PPM), wob = at.off - sim, f = frameOf(c, band, dir, at.k);
  const gx = x + CW / 2, gy = y + CH - 3;
  // (the marks: one every 8 px, moving against the travel by the body's own pixels)
  if (dir === 'right') for (let m = ((-sim % 8) + 8) % 8; m < CW; m += 8) { put(x + m, gy + 1, snap(TICK)); put(x + m, gy + 2, snap(TICK)); }
  else for (let m = (((dir === 'down' ? -sim : sim) % 8) + 8) % 8; m < CH; m += 8) { put(x + 1, y + m, snap(TICK)); put(x + CW - 2, y + m, snap(TICK)); }
  const ox = dir === 'right' ? wob : 0, oy = dir === 'down' ? wob : dir === 'up' ? -wob : 0;
  blitFrame(f, gx + ox, gy + oy);
  clip = null;
}
/** A lane: the band walked across w px from the left, the prints of the frames drawn on the way (up to d metres), the figure at each of `at` metres. */
function lane(c, band, x, y, w, h, dUpTo, at, prints) {
  floor(x, y, w, h);
  clip = [x, y, x + w, y + h];
  const gy = y + h - 6, x0 = x + 10, G = groundedOf(c, band);
  if (prints) {
    let last = null;
    for (let d = 0; d <= dUpTo; d += 0.004) {
      const a = drawnAt(c, band, d, 'right');
      if (last && last.k === a.k && last.off === a.off) continue;
      last = a;
      const f = frameOf(c, band, 'right', a.k);
      // (a foot flat on the floor prints its sole from heel to toe, one tipped on its heel or its toe that end's pixel; the right
      // foot's on the first row under the soles, the left's two below: a clean dash is a foot that held, a long smear one that slid)
      for (const s of ['r', 'l']) {
        const g = G[a.k][s], hx = x0 + a.off + f.feet[s].heel[0] - f.ax, tx = x0 + a.off + f.feet[s].toe[0] - f.ax, row = gy + (s === 'r' ? 2 : 4);
        if (g.heel && g.toe) for (let px = Math.round(Math.min(hx, tx)); px < Math.round(Math.max(hx, tx)); px++) put(px, row, snap(PRINT[s]));
        else if (g.heel) put(Math.floor(hx), row, snap(PRINT[s]));
        else if (g.toe) put(Math.floor(tx) - 1, row, snap(PRINT[s]));
      }
    }
  }
  for (const d of at) { const a = drawnAt(c, band, d, 'right'); blitFrame(frameOf(c, band, 'right', a.k), x0 + a.off, gy); }
  clip = null;
}

let tS = 0, running = live, slow = false, showPrints = true;
function draw() {
  buf.fill(abgr(BG));
  if (set === 'cycle') drawCycle(); else drawLanes();
  const cv = document.getElementById('pic'), g = cv.getContext('2d');
  const img = g.createImageData(W, H);
  new Uint32Array(img.data.buffer).set(buf);
  g.putImageData(img, 0, 0);
}
function keysLine(y) {
  if (live) say(4, y, `SPACE ${running ? 'STOP' : 'RUN'}   S ${slow ? 'FULL SPEED' : 'SLOW 1/4'}   F PRINTS ${showPrints ? 'OFF' : 'ON'}   R AGAIN   ${fmt(tS, 1)} S`);
  else say(4, y, 'STILL: O IN THE GALLERY RUNS IT');
}
function drawCycle() {
  const C = CANDIDATES[cid];
  say(4, 2, C.label.toUpperCase(), HEAD);
  let y = 10;
  for (const band of BANDS) {
    const N = NUMBERS[cid][band], B = CYCLE_BANDS[band], cy = cycleOf(cid, band);
    say(4, y, `${B.label.toUpperCase()}  ${fmt(N.speedMs)} M/S  STEP ${fmt(N.stepM)} M  ${fmt(N.cadenceHz, 1)} STEPS/S  ${fmt(N.fps, 0)} FPS`);
    say(4, y + 7, `SLIP SIDE ${fmt(N.slipSidePx, 1)} FRONT ${fmt(N.slipFrontPx, 1)} PX/STEP  HEAD ${N.headRowsPx}  MUZZLE ${N.muzzleRowsPx} PX`);
    y += 14;
    for (const dir of FACES) {
      treadmill(cid, band, dir, 4, y, SPEED[band] * tS);
      for (let k = 0; k < cy.frames; k++) {
        floor(44 + k * CW, y, CW - 1, CH);
        blitFrame(frameOf(cid, band, dir, k), 44 + k * CW + CW / 2, y + CH - 3);
      }
      y += CH + 1;
    }
  }
  y += 2;
  for (const band of BANDS) {
    say(4, y, `${CYCLE_BANDS[band].label.toUpperCase()}: ACROSS THE FLOOR, ${showPrints ? 'EACH FOOT\'S PRINTS' : 'NO PRINTS'}`);
    y += 7;
    const w = W - 8, spanM = (w - 30) / PPM;
    if (live) { const d = (SPEED[band] * tS) % spanM; lane(cid, band, 4, y, w, 40, d, [d], showPrints); }
    else { lane(cid, band, 4, y, w, 40, spanM, [0.3, 0.3 + spanM * 0.33, 0.3 + spanM * 0.66, spanM].map(v => Math.min(v, spanM)), true); }
    y += 42;
  }
  keysLine(H - 7);
}
function drawLanes() {
  say(4, 2, `THE FOUR AT 1 G${lookId === 'util' ? ' IN UTILITIES' : ''}: W0 AS BUILT, A EIGHT PLANTED, B EIGHT ROLLING, C SIX BOLD`, HEAD);
  const X0 = 44;
  CANDIDATE_IDS.forEach((c, i) => say(X0 + i * 3 * CW + 2, 10, `${c}  ${CANDIDATES[c].short.toUpperCase()}`));
  let y = 18;
  for (const band of BANDS) {
    say(4, y + 12, band === 'glide' ? 'GLIDE' : 'ASSAULT');
    say(4, y + 19, band === 'glide' ? 'LOW' : 'AIMED');
    CANDIDATE_IDS.forEach((c, i) => FACES.forEach((dir, j) => treadmill(c, band, dir, X0 + (i * 3 + j) * CW, y, SPEED[band] * tS)));
    y += CH + 1;
  }
  y += 3;
  say(4, y, 'SIDE ON, A PICTURE EVERY 1/12 S FOR A SECOND, THE FLOOR\'S MARKS MOVING UNDER THE BODY');
  y += 8;
  for (const band of BANDS) for (const c of CANDIDATE_IDS) {
    say(4, y + 12, c); say(4, y + 19, band === 'glide' ? 'GLIDE' : 'ASLT');
    const N = NUMBERS[c][band];
    say(4, y + 26, `${fmt(N.cadenceHz, 1)}`);
    for (let i = 0; i < 12; i++) treadmill(c, band, 'right', X0 + i * CW, y, SPEED[band] * (tS + i / 12));
    y += CH + 1;
  }
  keysLine(H - 7);
}

// ---------- the page ----------
const cv = document.getElementById('pic');
cv.width = W; cv.height = H;
function fit() {
  const k = Math.max(1, Math.floor(Math.min(innerWidth / W, innerHeight / H)));
  cv.style.width = `${W * k}px`; cv.style.height = `${H * k}px`;
}
fit();
addEventListener('resize', fit);
draw();
if (live) {
  addEventListener('keydown', (e) => {
    if (e.code === 'Space') { running = !running; e.preventDefault(); }
    else if (e.code === 'KeyS') slow = !slow;
    else if (e.code === 'KeyF') showPrints = !showPrints;
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
  requestAnimationFrame(tick);
}
window.__report = { frame: [W, H], set, look: lookId, candidate: set === 'cycle' ? cid : null, live, snapped: snapOn ? 'mars' : null, speeds: SPEED, numbers: NUMBERS };
requestAnimationFrame(() => requestAnimationFrame(() => { window.__ready = true; }));
