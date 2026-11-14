// OLYMPUS sample: the stack's figures in the black combat EVA suit, today's look and five ways to read two marines apart, moving, in the shoot house.
//
// The v0.0.14 reviews: "You and your #2 merge into one blob on the walk" and "In the black suit the legs barely read". The suit
// stays black (the Corps' armour is black, DESIGN.md's log); these are five ways to keep two men and their legs apart at 16 px/m,
// each beside today's look:
//   S0  today's look as v0.0.14 draws it (the reference);
//   S1  a lit edge: each leg, boot and the far arm takes a pixel of cool grey along its edge toward the light (the upper left);
//   S2  a visor per man: yours the issue's smoked blue, your #2's gold;
//   S3  the Navy's red tape on your #2: a band round his helmet, on his shoulders and, side on, his near upper arm;
//   S4  a 1 px gap of the floor's tone: where one man's figure lies over the other's, the one under is cut back a pixel round
//       him in the hall floor's colour (a rule of the post pass's outline, emulated here; today two men touching at one depth
//       get a line of ink between them, as dark as the suit);
//   S5  a cast shadow per body: each man's legs laid flat on the floor away from the light, hard-edged, in place of today's
//       soft round blob (which, 0.84 m across, merges into one under two men 0.65 m apart).
// S1 to S3 are the figure code's own (src/art/figures: a look's `mark`, which no look of the game carries); S4 and S5 are drawn
// by this page, as the stage's post pass and its blobs would draw them.
//
// The scene is the game's own picture: samples/house-stack-figures/backdrop.png, test-shoothouse at 10:00 on seed 48213, the
// hall at room 1's door with the house's light, its floor, the fog of awareness, the post pass and the Mars palette, shot by
// capture.mjs with the stack moved out of it. Over it this page draws the stack as the stage does: each man's frame composed and
// shaded by the game's figure code (the walk cycle B's Combat glide at the low ready from src/art/figures/walk.js, side on with
// the plant lock, and the stack's beat when still), lit by the tint the view gives a figure there (scene.json, places' light
// through the exposure), each pixel then through the post pass's steps as src/render/post.js has them: encoded (pow 1 / 2.2),
// the outline (another part far behind: × 0.12; near behind: × 0.4; two people at one depth: the later's pixel × 0.12), the
// grade, the snap to the Mars palette. The blob under each man is the stage's (an ink ellipse 0.84 × 0.5 m at 0.4).
//
// The moment, 8.7 s, looped: you and your #2 on the start mark at the hall's east end, 0.65 m apart; the glide (1.23 m/s, the
// body's at 1 G) to the stack on room 1's door, one behind the other along the hall (one depth: the blob of the review); then
// your #2 crosses in front of you to the door's far side (a man passing in front of the other, 0.65 m nearer the camera).
// ?c=S0..S5 picks the candidate; ?set=pair (the default) draws it twice, the walk up and the pass, each looping its own part of
// the moment; ?set=all draws the six side by side on the whole moment; ?set=check draws today's look at GO beside the game's
// own picture of GO (go.png, from capture.mjs --go), so the sample's drawing can be checked against the game's.
// Live (the gallery's O, ?hud=1 or ?live=1) it runs: Space stops and starts it, S slows it to a quarter, ← and → step a tick
// (50 ms) while stopped, R starts again. Shot (no hud), it is still at each tile's telling moment.
// window.__report: the frame, the candidates, the moments; window.__ready once drawn.
import { composeFrame } from '../../src/art/figures/compose.js';
import { shade } from '../../src/art/figures/shade.js';
import { wear, coloursOf } from '../../src/art/figures/outfits.js';
import { cyclePose, cycleAt, beatPose, bandSpec } from '../../src/art/figures/walk.js';
import { text } from '../../src/art/font.js';
import { PALETTES, nearest } from '../../src/art/palette.js';
import { linear } from '../../src/art/tone.js';
import { gaitSpeeds } from '../../src/sim/body/motion.js';

const params = new URLSearchParams(location.search);
const SETS = ['pair', 'all', 'check'], set = SETS.includes(params.get('set')) ? params.get('set') : 'pair';
const live = params.get('hud') === '1' || params.get('live') === '1';
const PPM = 16, INK = 0x14151c, LABEL = 0x9aa0ab, HEAD = 0xd8dce4, BG = 0x0e0f14;

/** The candidates (see the header): the marks each man's look carries, and the page's own rules. */
const GOLD = 0xb08a3a, NAVY_RED = 0xc8453c, RIM = 0x80868f;
export const CANDIDATES = Object.freeze({
  S0: { id: 'S0', name: 'S0 TODAY (V0.0.14)', short: 'S0 TODAY', marks: [null, null] },
  S1: { id: 'S1', name: 'S1 A LIT EDGE ON THE LEGS AND THE FAR ARM', short: 'S1 A LIT EDGE', marks: [{ rim: RIM }, { rim: RIM }] },
  S2: { id: 'S2', name: 'S2 A VISOR PER MAN: YOURS BLUE, YOUR #2\'S GOLD', short: 'S2 A VISOR PER MAN', marks: [null, { visor: GOLD }] },
  S3: { id: 'S3', name: 'S3 THE NAVY\'S RED TAPE ON YOUR #2', short: 'S3 RED TAPE ON YOUR #2', marks: [null, { tape: NAVY_RED }] },
  S4: { id: 'S4', name: 'S4 A PIXEL OF THE FLOOR\'S TONE BETWEEN THEM', short: 'S4 A GAP OF FLOOR TONE', marks: [null, null], gap: true },
  S5: { id: 'S5', name: 'S5 A CAST SHADOW UNDER EACH MAN', short: 'S5 A CAST SHADOW EACH', marks: [null, null], shadow: true },
});
const IDS = Object.keys(CANDIDATES);
const cid = CANDIDATES[params.get('c')] ? params.get('c') : 'S0';

// ---------- the scene: the game's picture and its numbers ----------
const SCENE = await (await fetch('./scene.json')).json();
const loadImg = async (src) => { const im = new Image(); im.src = src; await im.decode(); const c = new OffscreenCanvas(im.width, im.height), g = c.getContext('2d'); g.drawImage(im, 0, 0); return { w: im.width, h: im.height, d: g.getImageData(0, 0, im.width, im.height).data }; };
const BACK = await loadImg('./backdrop.png');
const GOPIC = set === 'check' ? await loadImg('./go.png') : null;
const [FW, FH] = SCENE.frame, CAM = SCENE.camera;
/** World (x, z) on the ground to the backdrop's pixel (the stage's camera: (x, z − y) at 16 px/m about the picture's centre). */
const colOf = (x, cam = CAM) => Math.round((x - cam.x) * PPM) + FW / 2, rowOf = (z, cam = CAM) => Math.round((z - cam.z) * PPM) + FH / 2;
/** The tile: the hall from x 26 to 36 m, the rows from room 1's wall to the hall's south wall. */
const TILE = Object.freeze({ x: colOf(26), y: 96, w: 160, h: 100 }), TW = TILE.w, TH = TILE.h;
const backAt = (X, Y) => { const i = (Y * BACK.w + X) * 4; return (BACK.d[i] << 16) | (BACK.d[i + 1] << 8) | BACK.d[i + 2]; };

// ---------- the post pass's steps (src/render/post.js), per pixel ----------
const SNAP = new Map();
const snap = (c) => { let v = SNAP.get(c); if (v === undefined) { v = nearest(c, PALETTES.mars); SNAP.set(c, v); } return v; };
const srgbLin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const enc = (v) => Math.max(0, v) ** (1 / 2.2);
/** A linear colour through the encode, the outline's factor, the grade and the snap: a picture colour. */
function post(lin, edge = 1) {
  const c = lin.map(v => Math.min(1, enc(v)) * edge);
  const l = 0.30 * c[0] + 0.59 * c[1] + 0.11 * c[2], k = [1.05, 1.0, 0.9], sh = Math.max(0, 0.35 - l), add = [0.03, -0.01, 0.05];
  const o = c.map((v, j) => Math.max(0, Math.min(1, (v + (l - v) * 0.18) * k[j] + sh * add[j])));
  return snap((Math.round(o[0] * 255) << 16) | (Math.round(o[1] * 255) << 8) | Math.round(o[2] * 255));
}
/** A picture colour taken back to (nearly) linear, for what is laid over it before the snap (a blob, a shadow). */
const decode = (c) => [(c >> 16) & 255, (c >> 8) & 255, c & 255].map(v => (v / 255) ** 2.2);
const INK_LIN = linear(INK);
/** S5's cast shadow: how high up the body it takes (m), its lean per px of height (x, y), its strength. */
const SHADOW_UP_M = 0.5, SHADOW_K = Object.freeze([0.8, 0.3]), SHADOW_A = 0.6;

// ---------- the figures: the game's frames for each man's look ----------
const lookOf = (mark, seed) => wear({ outfit: 'combatSuit', weapon: 'rifle', carry: 'low', carrier: true, seed, model: 'r7', ...(mark ? { mark } : {}) });
const FRAMES = new Map();
/** A frame ('walk:<k>' the glide's frame k, 'stack' the beat) of a look facing dir: { px: [[x, y, colour, glows]], ax, ay, h, w }. */
function frameOf(look, lookKey, name, dir) {
  const key = `${lookKey}|${name}|${dir}`;
  let f = FRAMES.get(key);
  if (!f) {
    const pose = name === 'stack' ? beatPose('stack', { weapon: 'rifle', carry: 'low', cycle: 'B' }) : cyclePose('B', 'combat', Number(name.split(':')[1]), { weapon: 'rifle', carry: 'low' });
    const fr = composeFrame(look, dir, 'idle0', { ppm: PPM, pose }), pm = shade(fr.cells, coloursOf(fr.look, PPM)), px = [];
    for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) {
      const v = pm.data[y * pm.w + x], a = v >>> 24;
      if (a < 128) continue;
      px.push([x, y, ((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff), a >= 248 && a <= 254]);
    }
    f = { px, ax: fr.ax, ay: fr.ay, w: pm.w, h: pm.h };
    FRAMES.set(key, f);
  }
  return f;
}

// ---------- the moment: where each man is at t ----------
const SPEED = gaitSpeeds({ gG: 1, gait: 'combat' }).walkMs, STEP_M = bandSpec('B', 'combat').S / PPM;
const START = [[33.88, 13.2], [34.53, 13.2]], STACK = [[29.95, 12.45], [30.6, 12.45]];
const CROSS = [[30.6, 12.45], [29.7, 13.1], [28.7, 13.1], [27.8, 12.45]];
const HOLD0 = 0.6, len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const WALK_S = len(START[0], STACK[0]) / SPEED, PAUSE_S = 0.9, CROSS_M = len(CROSS[0], CROSS[1]) + len(CROSS[1], CROSS[2]) + len(CROSS[2], CROSS[3]);
const T_WALK = HOLD0, T_STACK = HOLD0 + WALK_S, T_CROSS = T_STACK + PAUSE_S, T_CROSSED = T_CROSS + CROSS_M / SPEED, LOOP_S = T_CROSSED + 1.2;
/** The two tiles' parts of the moment (pair): the walk up (to the stack) and the pass (the cross). */
const PARTS = Object.freeze({ walk: [0, T_STACK + 0.5], pass: [T_STACK, LOOP_S], all: [0, LOOP_S] });
/** Each tile's telling moment, shot still: the walk half way, your #2 straight in front of you. */
const STILL = Object.freeze({ walk: T_WALK + WALK_S * 0.55, pass: T_CROSS + (len(CROSS[0], CROSS[1]) + 0.55) / SPEED, all: T_CROSS + (len(CROSS[0], CROSS[1]) + 0.55) / SPEED });
/** Along a polyline by metres: [x, z]. */
function along(pts, m) {
  for (let i = 1; i < pts.length; i++) { const L = len(pts[i - 1], pts[i]); if (m <= L || i === pts.length - 1) { const k = Math.min(1, m / L); return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k]; } m -= L; }
  return pts.at(-1);
}
/** Man i (0 you, 1 your #2) at t s: { x, z, face, frame, walked } (frame 'walk:k' with the plant lock's lag applied, or 'stack'). */
function manAt(i, t) {
  let pos, walked = null;
  if (t < T_WALK) pos = START[i];
  else if (t < T_STACK) { walked = (t - T_WALK) * SPEED; pos = along([START[i], STACK[i]], walked); }
  else if (i === 0 || t < T_CROSS) pos = STACK[i];
  else if (t < T_CROSSED) { walked = (t - T_CROSS) * SPEED; pos = along(CROSS, walked); }
  else pos = CROSS.at(-1);
  if (walked === null) return { x: pos[0], z: pos[1], face: 'left', frame: 'stack' };
  // (the plant lock, as src/render/gait-view.js draws it side on: the card held where its key began, lagPx behind the sim's
  // place along the facing, so the planted boot never slides)
  const at = cycleAt({ cycle: 'B', band: 'combat', gp: walked / STEP_M, stepM: STEP_M });
  return { x: pos[0] + at.lagPx / PPM, z: pos[1], face: 'left', frame: `walk:${at.frame}` };
}

// ---------- drawing a tile ----------
const W = { pair: 4 + TW + 6 + TW + 4, all: 4 + 3 * TW + 2 * 6 + 4, check: 4 + TW + 6 + TW + 4 }[set];
const H = { pair: 14 + 8 + TH + 12, all: 12 + 2 * (8 + TH) + 6 + 12, check: 14 + 8 + TH + 12 }[set];
const buf = new Uint32Array(W * H);
const abgr = (c) => 0xff000000 | ((c & 0xff) << 16) | (c & 0xff00) | ((c >>> 16) & 0xff);
const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) buf[y * W + x] = abgr(c); };
const fill = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, c); };
const say = (x, y, s, c = LABEL) => text((X, Y, w, h, col) => fill(X, Y, w, h, col), x, y, s, c);

const LOOKS = new Map();
const lookFor = (c, i) => { const k = `${c}|${i}`; if (!LOOKS.has(k)) LOOKS.set(k, lookOf(CANDIDATES[c].marks[i], 3 + i)); return LOOKS.get(k); };
const tintAt = (x, z) => {
  const T = SCENE.tints, i = Math.max(0, Math.min(T.nx - 1, Math.round((x - T.x0) / T.stepM))), j = Math.max(0, Math.min(T.nz - 1, Math.round((z - T.z0) / T.stepM)));
  return T.rgb[j * T.nx + i];
};

/**
 * The stack drawn over the game's picture in a tile: men [{ x, z, face, frame }] (index = the instance order, you first), the
 * candidate c, the picture's camera cam and its pixels pic. Returns the tile's colours (tw × th).
 */
function renderTile(men, c, { cam = CAM, pic = BACK, rect = TILE } = {}) {
  const C = CANDIDATES[c], tw = rect.w, th = rect.h, N = tw * th;
  const base = new Int32Array(N), top = new Int8Array(N).fill(-1), col = new Int32Array(N), glow = new Uint8Array(N), hAbove = new Float32Array(N);
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) { const i = ((rect.y + y) * pic.w + rect.x + x) * 4; base[y * tw + x] = (pic.d[i] << 16) | (pic.d[i + 1] << 8) | pic.d[i + 2]; }
  const cols = (x) => Math.round((x - cam.x) * PPM) + FW / 2 - rect.x, rows = (z) => Math.round((z - cam.z) * PPM) + FH / 2 - rect.y;
  // (the floor's tone under each man, before anything is laid on it: S4's gap is drawn in it)
  const floorTone = men.map(m => { const X = cols(m.x), Y = rows(m.z) - 1; return base[Math.max(0, Math.min(th - 1, Y)) * tw + Math.max(0, Math.min(tw - 1, X + 6))]; });
  // (on the floor, under the cards: today's blob, an ink ellipse 0.42 × 0.252 m at 0.4 (src/render/figures.js); or S5's cast
  // shadow in its place: each man's lower body (the pixels up to SHADOW_UP_M over his soles) laid flat on the floor away from
  // the light, the upper left (SHADOW_K px along x and down the picture per px of height), hard-edged at SHADOW_A, so each
  // man's legs throw their own shadow, scissoring as he walks)
  const lay = base.slice(), darken = (i, a) => { lay[i] = post(decode(lay[i]).map((v, j) => v * (1 - a) + INK_LIN[j] * a), 1); };
  const order = men.map((m, i) => ({ m, i, f: frameOf(lookFor(c, i), `${c}|${i}`, m.frame, m.face) })).sort((a, b) => a.m.z - b.m.z || a.i - b.i);
  for (const { m, f } of order) {
    if (C.shadow) {
      const X = cols(m.x) - f.ax, Y = rows(m.z) - f.ay, sole = Y + f.ay, hit = new Set();
      for (const [px, py] of f.px) {
        const h = sole - (Y + py) - 0.5;
        if (h > SHADOW_UP_M * PPM || h < -1) continue;
        const x = Math.round(X + px + Math.max(0, h) * SHADOW_K[0]), y = Math.round(sole - 0.5 + Math.max(0, h) * SHADOW_K[1]);
        if (x >= 0 && y >= 0 && x < tw && y < th) hit.add(y * tw + x);
      }
      for (const i of hit) darken(i, SHADOW_A);
      continue;
    }
    const cx = (Math.round(m.x * PPM) / PPM - cam.x) * PPM + FW / 2 - rect.x, cz = (Math.round(m.z * PPM) / PPM - cam.z) * PPM + FH / 2 - rect.y;
    const rx = 0.42 * PPM, rz = 0.252 * PPM;
    for (let y = Math.floor(cz - rz - 1); y <= Math.ceil(cz + rz + 1); y++) for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
      if (x < 0 || y < 0 || x >= tw || y >= th) continue;
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cz) / rz;
      if (dx * dx + dy * dy <= 1) darken(y * tw + x, 0.4);
    }
  }
  // (the cards, far to near (the card plane z + its rows below the anchor); at one depth in the instance order, as one
  // instanced draw lays them: the later over the earlier)
  const zc = [];
  for (const { m, i, f } of order) {
    const X = cols(m.x) - f.ax, Y = rows(m.z) - f.ay, bottom = Y + f.h;
    zc[i] = m.z + (f.h - f.ay) / PPM;
    for (const [px, py, v, g] of f.px) {
      const x = X + px, y = Y + py;
      if (x < 0 || y < 0 || x >= tw || y >= th) continue;
      const k = y * tw + x;
      top[k] = i; col[k] = v; glow[k] = g ? 1 : 0; hAbove[k] = (bottom - y - 0.5) / PPM;
    }
  }
  // (the post pass over the cards: the outline's four neighbours, then the grade and the snap; S4's gap)
  const out = new Int32Array(N);
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
    const k = y * tw + x, i = top[k];
    if (i < 0) { out[k] = lay[k]; continue; }
    let edge = 1, gap = false;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const X = x + dx, Y = y + dy;
      if (X < 0 || Y < 0 || X >= tw || Y >= th) continue;
      const j = top[Y * tw + X];
      if (j === i) continue;
      // (how much farther the neighbour lies, metres along the view: the ground there, or the other man's card)
      const behind = j < 0 ? Math.SQRT2 * hAbove[k] : Math.SQRT2 * (zc[i] - zc[j]);
      if (behind > 0.35) edge = Math.min(edge, 0.12);
      else if (behind > 0.02) edge = Math.min(edge, 0.4);
      else if (j >= 0 && Math.abs(behind) <= 0.02 && i > j) edge = Math.min(edge, 0.12);
      // (S4: this man's pixel next to the man laid over him: cut back to the floor's tone)
      if (C.gap && j >= 0 && (zc[j] > zc[i] + 1e-6 || (Math.abs(zc[j] - zc[i]) <= 1e-6 && j > i))) gap = true;
    }
    if (gap) { out[k] = floorTone[i]; continue; }
    const v = col[k], s = [(v >> 16) & 255, (v >> 8) & 255, v & 255].map(q => srgbLin(q / 255));
    const t = glow[k] ? [1, 1, 1] : tintAt(men[i].x, men[i].z);
    out[k] = post(s.map((q, j) => q * t[j]), edge);
  }
  return out;
}
function blitTile(tile, x0, y0, rect = TILE) { for (let y = 0; y < rect.h; y++) for (let x = 0; x < rect.w; x++) put(x0 + x, y0 + y, tile[y * rect.w + x]); }
const menAt = (t) => [manAt(0, t), manAt(1, t)];
/** The time a tile shows: its part of the moment looped on the running clock, or its still. */
const tileT = (part, tS) => (live ? PARTS[part][0] + (tS % (PARTS[part][1] - PARTS[part][0])) : STILL[part]);

let tS = 0, running = live, slow = false;
function draw() {
  buf.fill(abgr(BG));
  if (set === 'pair') {
    say(4, 3, CANDIDATES[cid].name, HEAD);
    say(4, 15, 'THE WALK UP: ONE BEHIND THE OTHER'); say(4 + TW + 6, 15, 'THE PASS: YOUR #2 CROSSES IN FRONT');
    blitTile(renderTile(menAt(tileT('walk', tS)), cid), 4, 22);
    blitTile(renderTile(menAt(tileT('pass', tS)), cid), 4 + TW + 6, 22);
  } else if (set === 'all') {
    say(4, 2, 'THE SIX ON ONE CLOCK: THE WALK UP, THEN YOUR #2 CROSSING IN FRONT', HEAD);
    IDS.forEach((c, n) => {
      const x = 4 + (n % 3) * (TW + 6), y = 12 + Math.floor(n / 3) * (8 + TH + 6);
      say(x, y, CANDIDATES[c].short);
      blitTile(renderTile(menAt(tileT('all', tS)), c), x, y + 8);
    });
  } else {
    // (today's look at GO drawn by this page over the empty hall, beside the game's own picture of GO: the same camera
    // offset, so the two tiles show the same metres)
    say(4, 3, 'THE CHECK: TODAY\'S LOOK AT GO, THIS PAGE\'S DRAWING AND THE GAME\'S', HEAD);
    const goCam = SCENE.cameraAtGo, shift = Math.round((goCam.x - CAM.x) * PPM), rectGo = { ...TILE, x: TILE.x - shift + Math.round((32 - 30.5) * PPM) };
    const rectBack = { ...rectGo, x: rectGo.x + shift };
    say(4, 15, 'DRAWN BY THIS PAGE'); say(4 + TW + 6, 15, 'THE GAME (GO.PNG)');
    const men = SCENE.actorsAtGo.filter(a => a.id !== 'a3').map(a => ({ x: a.x, z: a.z, face: a.face, frame: 'stack' }));
    blitTile(renderTile(men, 'S0', { rect: rectBack }), 4, 22, rectBack);
    for (let y = 0; y < rectGo.h; y++) for (let x = 0; x < rectGo.w; x++) { const i = ((rectGo.y + y) * GOPIC.w + rectGo.x + x) * 4; put(4 + TW + 6 + x, 22 + y, (GOPIC.d[i] << 16) | (GOPIC.d[i + 1] << 8) | GOPIC.d[i + 2]); }
  }
  if (live) say(4, H - 8, `SPACE ${running ? 'STOP' : 'RUN'}   S ${slow ? 'FULL SPEED' : 'SLOW 1/4'}   ${running ? '' : '<- -> A TICK   '}R AGAIN   ${tS.toFixed(2)} S`);
  else if (set !== 'check') say(4, H - 8, 'STILL HERE: O IN THE GALLERY RUNS IT, MOVING');
  const cv = document.getElementById('pic'), g = cv.getContext('2d'), img = g.createImageData(W, H);
  new Uint32Array(img.data.buffer).set(buf);
  g.putImageData(img, 0, 0);
}

// ---------- the page ----------
const cv = document.getElementById('pic');
cv.width = W; cv.height = H;
function fit() { const k = Math.max(1, Math.floor(Math.min(innerWidth / W, innerHeight / H))); cv.style.width = `${W * k}px`; cv.style.height = `${H * k}px`; }
fit();
addEventListener('resize', fit);
draw();
if (live) {
  addEventListener('keydown', (e) => {
    if (e.code === 'Space') { running = !running; e.preventDefault(); }
    else if (e.code === 'KeyS') slow = !slow;
    else if (e.code === 'KeyR') tS = 0;
    else if (e.code === 'ArrowRight' && !running) tS += 0.05;
    else if (e.code === 'ArrowLeft' && !running) tS = Math.max(0, tS - 0.05);
    else return;
    draw();
  });
  let then = performance.now();
  const tick = (now) => {
    const dt = Math.max(0, Math.min(0.1, (now - then) / 1000)); then = Math.max(then, now);
    if (running) { tS += dt * (slow ? 0.25 : 1); draw(); }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
window.__report = {
  frame: [W, H], set, candidate: set === 'pair' ? cid : null, live, snapped: 'mars',
  moment: { loopS: +LOOP_S.toFixed(2), walkUpS: +WALK_S.toFixed(2), crossS: +(T_CROSSED - T_CROSS).toFixed(2), speedMs: +SPEED.toFixed(2), stepM: STEP_M, still: STILL },
  candidates: Object.fromEntries(IDS.map(c => [c, CANDIDATES[c].name])),
};
requestAnimationFrame(() => requestAnimationFrame(() => { window.__ready = true; }));
