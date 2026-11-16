// OLYMPUS sample: a device in the hands on the stage's figure: the G-11 held and thrown, the halligan, the ram and the charge, carried and used.
//
// The hunt of v0.0.18 (kit-10): with a G-11 armed in your hand, the halligan at a pry or a charge being placed, the stage's figure
// draws both fists empty and the rifle slung, and the grenade appears from nowhere on its flight's first frame. The candidates
// are held.js's (see its header); every picture is the game's own figure code (src/art/figures: composeFrame and shade), the
// marine in the black combat EVA suit with the plate carrier (the shoot house's), on the house's slab floor at 16 px/m, snapped
// to the Mars palette as the stage's post pass snaps them (?snap=0 raw). The device is drawn by compose.js's sample hooks (a
// given pose's `reach` and `device`), which no frame of the game uses.
// ?set= picks the picture:
//   hold     (?g=G1|G2|G3) the G-11 from the pouch to the throw;  bar (?b=B1|B2|B3) the halligan;  ram (?r=R1|R2);
//   charge   (?c=C1|C2): each the four facings at 16 px/m, the figure side on three times larger (the door's leaf in front of
//            it at the pry, the swing and the placing), the device alone at 16 px/m and larger, and the loop's phases with the
//            one running lit; the still is the candidate's carry (the G-11's: held);
//   all      (?what=g|b|r|c) the candidates of a group side on three times larger on one clock, and each facing you and away;
//   throw    (?t=T1|T2|T3) the throw at room 1's door in the shoot house: the game's picture of the hall (the backdrop of
//            samples/house-stack-figures: test-shoothouse at 10:00 on seed 48213, the house's light and floor, the post pass),
//            you on the wall beside the door and your #2 behind you, drawn over it as that sample draws the stack (lit by the
//            tint the view gives a figure there, then encoded, graded and snapped as src/render/post.js does); on the left the
//            throw (the can in the hand), on the right the flight, drawn by the game's own bang pixels (src/render/range-items.js
//            bangBodyPixels and bangFlashPixels, as the bangs layer draws a G-11: the arc from the hand at its release to the
//            floor, the flash at the fuse, 1.5 s after the release; past room 1's wall it is left out, as the stage's depth test
//            hides it), and below the throw's frames side on twice as large, facing
//            the door as you do and the other way (the throwing arm near). One quantity: the can is in the hand up to the release and
//            in the air from it, never both, never neither;
//   check    the hunt's lane (the tier one's full kit on seed 1489397426, the honest kit bot) at its three moments: the
//            stage's own picture (check.png, made by capture.mjs), this page's drawing of today's figure (the fists empty, the
//            rifle slung in front) and of the defaults (G1, B1) in the same facing. Not scored: it shows the figure is the game's.
// Live (the gallery's O, or ?hud=1) it runs: Space stops and starts it, S slows it to a quarter, R starts it again; shot by the
// gallery (a webdriver) it holds still at the set's telling moment; ?t=<s> (with no candidate letter) holds it at that time.
// window.__report: the frame, the set, the candidate, the loop's phases, the device's pixels at the still; window.__ready once drawn.
import { composeFrame } from '../../src/art/figures/compose.js';
import { shade } from '../../src/art/figures/shade.js';
import { wear, coloursOf } from '../../src/art/figures/outfits.js';
import { beatPose } from '../../src/art/figures/walk.js';
import { text } from '../../src/art/font.js';
import { PALETTES, nearest } from '../../src/art/palette.js';
import { bangBodyPixels, bangFlashPixels } from '../../src/render/range-items.js';
import { DEVICES } from '../../src/sim/arms/devicetable.js';
import { DEV_COL, isDevice, SETS, THROWS, HOLDS, AT_LEAF, specOf, poseFor, phaseAt, loopS, stillT } from './held.js';

const params = new URLSearchParams(location.search);
const SET_IDS = ['hold', 'bar', 'ram', 'charge', 'all', 'throw', 'check'];
const set = SET_IDS.includes(params.get('set')) ? params.get('set') : 'hold';
const live = params.get('hud') === '1' || params.get('live') === '1' || !navigator.webdriver;
const PPM = 16, CW = 40, CH = 44;
const BG = 0x0e0f14, FLOOR = 0x8a8a86, LEAF = 0x5c606a, LABEL = 0x9aa0ab, HEAD = 0xd8dce4, LIT = 0xe7b84a, INK = 0x14151c;
/** The pictures' sizes (sample.json's pixel). */
export const SIZE = Object.freeze({ hold: [320, 184], bar: [320, 184], ram: [320, 184], charge: [320, 184], all: [420, 196], throw: [334, 222], check: [500, 246] });
const [W, H] = SIZE[set];
const WHAT = { g: 'hold', b: 'bar', r: 'ram', c: 'charge' };
const group = set === 'all' ? WHAT[params.get('what')] ?? 'hold' : set === 'throw' || set === 'check' ? 'hold' : set;
const S = SETS[group];
const cand = S.cands[params.get(S.param)] ? params.get(S.param) : S.def;
const tId = THROWS[params.get('t')] ? params.get('t') : 'T1';

// ---------- the picture: a buffer of whole pixels ----------
const buf = new Uint32Array(W * H);
const abgr = (c) => 0xff000000 | ((c & 0xff) << 16) | (c & 0xff00) | ((c >>> 16) & 0xff);
const SNAPPED = new Map(), snapOn = params.get('snap') !== '0';
const snap = (c) => { if (!snapOn) return c; if (!SNAPPED.has(c)) SNAPPED.set(c, nearest(c, PALETTES.mars)); return SNAPPED.get(c); };
const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) buf[y * W + x] = abgr(c); };
const fill = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, c); };
const say = (x, y, s, c = LABEL) => text((X, Y, w, h, col) => fill(X, Y, w, h, col), x, y, s, c);

// ---------- the frames, composed once each ----------
const look = wear({ outfit: 'combatSuit', carrier: true, weapon: 'rifle', carry: 'low', seed: 3, model: 'r7' });
const col = { ...coloursOf(look, PPM), ...DEV_COL };
const STACK = beatPose('stack', { weapon: 'rifle', carry: 'low' });
const FR = new Map();
/** A frame (a spec, keyed) facing dir: { px: [[x, y, colour, device]], ax, ay, w, h, hands }. */
function frameOf(key, spec, dir) {
  const k = `${key}|${dir}`;
  let f = FR.get(k);
  if (!f) {
    const fr = composeFrame(look, dir, 'idle0', { ppm: PPM, pose: poseFor(spec ?? {}, STACK) }), pm = shade(fr.cells, col), px = [];
    for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) {
      const v = pm.data[y * pm.w + x];
      if ((v >>> 24) >= 128) px.push([x, y, ((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff), isDevice(fr.cells[y][x]?.ch)]);
    }
    f = { px, ax: fr.ax, ay: fr.ay, w: pm.w, h: pm.h, hands: fr.hands ?? null, cells: fr.cells };
    FR.set(k, f);
  }
  return f;
}
/** Today's figure: the stage's (the fists empty, the rifle slung in front, no hand put anywhere). */
const TODAY = Object.freeze({});
const frameFor = (grp, c, frame, dir, t = tId) => frameOf(`${grp}|${c}|${frame}|${t}`, specOf(grp, c, frame, t), dir);

/** A frame drawn k times larger, its anchor at (x, y), clipped to a box; snapped. */
function blit(f, x, y, k = 1, clip = null) {
  for (const [a, b, c] of f.px) {
    const X = x + (a - f.ax) * k, Y = y + (b - f.ay) * k;
    for (let j = 0; j < k; j++) for (let i = 0; i < k; i++) {
      const px = X + i, py = Y + j;
      if (clip && (px < clip[0] || py < clip[1] || px >= clip[0] + clip[2] || py >= clip[1] + clip[3])) continue;
      put(px, py, snap(c));
    }
  }
}
/** The door's leaf in front of a side-on figure (F metres ahead, 2.0 m tall), k times larger, behind the figure's pixels. */
function leaf(x, y, k, F, clip) {
  const X = x + Math.round(F * PPM) * k, top = y - Math.round(2.0 * PPM) * k;
  for (let py = Math.max(top, clip[1]); py < y; py++) for (let i = 0; i < 2 * k; i++) if (X + i < clip[0] + clip[2]) put(X + i, py, snap(i < k ? 0x6a6e78 : LEAF));
}
/** The figure of a group's candidate at t in a cell (x, y, w, h) on the floor, k times larger. */
function figure(grp, c, dir, t, x, y, w, h, k = 1) {
  const SS = SETS[grp], p = phaseAt(SS.phases, t), f = frameFor(grp, c, p.frame, dir);
  fill(x, y, w, h, snap(FLOOR));
  const ax = x + Math.floor(w / 2) - (k > 1 ? Math.round(0.15 * PPM * k) : 0), ay = y + h - 3 * k, box = [x, y, w, h];
  if (k > 1 && dir === 'right' && SS.leaf && AT_LEAF.has(p.frame)) leaf(ax, ay, k, SS.leaf, box);
  blit(f, ax, ay, k, box);
  return { p, f };
}
/** The device alone (the candidate's still frame facing you, its parts only: compose.js's device.only), shaded as the figure is, at (x, y), k times larger. */
function alone(grp, c, frame, x, y, w, h, kMax) {
  const f = frameOf(`${grp}|${c}|${frame}|only`, { ...specOf(grp, c, frame), only: true }, 'down'), cells = f.cells, keep = [];
  for (let j = 0; j < cells.length; j++) for (let i = 0; i < cells[j].length; i++) if (isDevice(cells[j][i]?.ch)) keep.push([i, j, cells[j][i]]);
  if (!keep.length) return 0;
  const xs = keep.map(q => q[0]), ys = keep.map(q => q[1]), a0 = Math.min(...xs), b0 = Math.min(...ys), gw = Math.max(...xs) - a0 + 3, gh = Math.max(...ys) - b0 + 3;
  const grid = Array.from({ length: gh }, () => Array(gw).fill(null));
  for (const [i, j, c0] of keep) grid[j - b0 + 1][i - a0 + 1] = c0;
  const pm = shade(grid, col), k = Math.max(1, Math.min(kMax, Math.floor(Math.min((w - 2) / pm.w, (h - 2) / pm.h))));
  fill(x, y, w, h, snap(FLOOR));
  const ox = x + Math.floor((w - pm.w * k) / 2), oy = y + Math.floor((h - pm.h * k) / 2);
  for (let j = 0; j < pm.h; j++) for (let i = 0; i < pm.w; i++) { const v = pm.data[j * pm.w + i]; if ((v >>> 24) >= 128) fill(ox + i * k, oy + j * k, k, k, snap(((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff))); }
  return k;
}

// ---------- the sets ----------
const STILL = Object.freeze({ hold: 'HELD', bar: 'CARRIED', ram: 'CARRIED', charge: 'CARRIED' });
const atT = params.has('t') && !THROWS[params.get('t')] ? Number(params.get('t')) || 0 : null;
let tS = atT ?? (live ? 0 : stillT(S.phases, STILL[group])), running = live && atT === null, slow = false;
const DIRS = [['right', 'RIGHT'], ['left', 'LEFT'], ['down', 'AT YOU'], ['up', 'AWAY']];
const DEVICE_WORD = { hold: DEVICES.g11.word, bar: DEVICES.hal.word, ram: DEVICES.ram.word, charge: DEVICES.sc1.word };
let report = {};

function drawOne() {
  const C = S.cands[cand], p = phaseAt(S.phases, tS);
  say(4, 2, C.name, HEAD);
  DIRS.forEach(([dir, label], i) => { say(4 + i * (CW + 2) + 1, 10, label); figure(group, cand, dir, tS, 4 + i * (CW + 2), 17, CW, CH); });
  say(4, 64, 'SIDE ON X3');
  const { f } = figure(group, cand, 'right', tS, 4, 71, 166, 102, 3);
  const still = group === 'hold' ? 'hold' : 'carry';
  say(178, 10, '16 PX/M'); alone(group, cand, still, 178, 17, 30, 44, 1);
  const k = alone(group, cand, still, 212, 17, 104, 44, 6); say(212, 10, `X${k}  ${DEVICE_WORD[group].toUpperCase()}`.slice(0, 26));
  let y = 66;
  S.phases.forEach(([label, s], i) => { say(178, y, label, i === p.i ? LIT : LABEL); say(286, y, `${s.toFixed(2)}`, i === p.i ? LIT : LABEL); y += 7; });
  say(178, y + 2, `${(tS % loopS(S.phases)).toFixed(2)} / ${loopS(S.phases).toFixed(1)} S`, HEAD);
  report = { phase: p.label, devicePx: f.px.filter(q => q[3]).length };
}
function drawAll() {
  const p = phaseAt(S.phases, tS), ids = Object.keys(S.cands), cw = Math.floor((W - 8) / ids.length) - 2;
  say(4, 2, `THE ${ids.length} ON ONE CLOCK: ${p.label}`, HEAD);
  const px = {};
  ids.forEach((c, i) => {
    const x = 4 + i * (cw + 2);
    say(x + 1, 10, S.cands[c].short);
    px[c] = figure(group, c, 'right', tS, x, 17, cw, 120, 3).f.px.filter(q => q[3]).length;
    figure(group, c, 'down', tS, x, 139, Math.floor(cw / 2) - 1, CH);
    figure(group, c, 'up', tS, x + Math.floor(cw / 2) + 1, 139, Math.floor(cw / 2) - 1, CH);
  });
  report = { phase: p.label, devicePx: px };
}

// ---------- the throw at room 1's door (set=throw): the game's hall and the stack over it ----------
let SCENE = null, BACK = null;
if (set === 'throw') {
  SCENE = await (await fetch('../house-stack-figures/scene.json')).json();
  const im = new Image(); im.src = '../house-stack-figures/backdrop.png'; await im.decode();
  const c = new OffscreenCanvas(im.width, im.height), g = c.getContext('2d'); g.drawImage(im, 0, 0);
  BACK = { w: im.width, h: im.height, d: g.getImageData(0, 0, im.width, im.height).data };
}
/** The stack at room 1's door (house-stack-figures' STACK: you on the wall east of the door, your #2 behind you), facing west. */
const YOU = Object.freeze([29.95, 12.45]), TWO = Object.freeze([30.6, 12.45]);
/** Where the can lands in room 1, through the door (threshold 29.0, 11.7), and the G-11's fuse from the release (ms). */
const LAND = Object.freeze([28.0, 9.7]), FUSE_MS = DEVICES.g11.fuseMs, WALL_Z = 11.7;
/** The throw's loop: held at the door, the throw's two frames, then the flight to the flash, the follow-through, the rifle up. */
const TPH = Object.freeze([['HELD AT THE DOOR', 0.8, 'hold'], ['THROW', 0.35, 'throw0'], ['RELEASE', 0.35, 'throw1'], ['FLIGHT', FUSE_MS / 1000, 'after'], ['BANG', 0.6, 'after'], ['RIFLE UP', 1.0, 'raise'], ['READY', 0.5, 'ready']]);
const REL_S = 0.8 + 0.7, TILE = Object.freeze({ w: 160, h: 100 });
/** Each tile's part of the loop and its still: the throw (the can in the hand) and the flight (0.25 s after the release). */
const TPARTS = Object.freeze({ throw: [0, REL_S + 0.2], flight: [REL_S - 0.2, REL_S + FUSE_MS / 1000 + 0.6] });
const TSTILL = Object.freeze({ throw: 0.8 + 0.175, flight: REL_S + 0.25 });
const srgbLin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const enc = (v) => Math.max(0, v) ** (1 / 2.2);
/** A linear colour through the post pass's encode and grade (src/render/post.js), then the snap. */
function post(lin) {
  const c = lin.map(v => Math.min(1, enc(v)));
  const l = 0.30 * c[0] + 0.59 * c[1] + 0.11 * c[2], k = [1.05, 1.0, 0.9], sh = Math.max(0, 0.35 - l), add = [0.03, -0.01, 0.05];
  const o = c.map((v, j) => Math.max(0, Math.min(1, (v + (l - v) * 0.18) * k[j] + sh * add[j])));
  return snap((Math.round(o[0] * 255) << 16) | (Math.round(o[1] * 255) << 8) | Math.round(o[2] * 255));
}
const tintAt = (x, z) => {
  const T = SCENE.tints, i = Math.max(0, Math.min(T.nx - 1, Math.round((x - T.x0) / T.stepM))), j = Math.max(0, Math.min(T.nz - 1, Math.round((z - T.z0) / T.stepM)));
  return T.rgb[j * T.nx + i];
};
/** The throw's tile at t: the hall (x 25.5 to 35.5 m, room 1 above), you and your #2, the can in the air, the flash. */
function throwTile(t, x0, y0) {
  const cam = SCENE.camera, [FW, FH] = SCENE.frame, rx = Math.round((25.5 - cam.x) * PPM) + FW / 2, ry = 70;
  const at = (x, z, y = 0) => [Math.floor((x - cam.x) * PPM + FW / 2) - rx, Math.floor((z - y - cam.z) * PPM + FH / 2) - ry];
  for (let y = 0; y < TILE.h; y++) for (let x = 0; x < TILE.w; x++) { const i = ((ry + y) * BACK.w + rx + x) * 4; put(x0 + x, y0 + y, (BACK.d[i] << 16) | (BACK.d[i + 1] << 8) | BACK.d[i + 2]); }
  const p = phaseAt(TPH, t), ms = t * 1000, relMs = REL_S * 1000;
  // (the figures, far to near: your #2 at the stack, then you in the throw's frame; lit by the view's tint there, post-passed)
  const spec = p.frame === 'hold' ? HOLDS.G1.hold : specOf('hold', 'G1', p.frame, tId);
  const men = [[TWO, frameOf('two|stack', { rig: 'low' }, 'left')], [YOU, frameOf(`throw|${tId}|${p.frame}`, spec, 'left')]];
  let devicePx = 0;
  for (const [[mx, mz], f] of men) {
    const [X, Y] = at(mx, mz), tint = tintAt(mx, mz);
    for (const [a, b, c, dev] of f.px) {
      const px = X + a - f.ax, py = Y + b - f.ay;
      if (px < 0 || py < 0 || px >= TILE.w || py >= TILE.h) continue;
      if (dev && f === men[1][1]) devicePx++;
      const s = [(c >> 16) & 255, (c >> 8) & 255, c & 255].map(q => srgbLin(q / 255));
      put(x0 + px, y0 + py, post(s.map((q, j) => q * tint[j])));
    }
  }
  // (the can in flight from the release, the bangs layer's G-11: from your hand's place to where it lands, at the fuse its flash;
  // past room 1's wall (its line at z WALL_Z) the stage's depth test hides it behind the wall, so this page leaves it out there)
  const b = { id: 'g11', x: LAND[0], z: LAND[1], fromX: YOU[0] - 0.3, fromZ: YOU[1] - 0.1, throwAtMs: relMs, atMs: relMs + FUSE_MS };
  const flying = ms >= relMs && ms < relMs + FUSE_MS;
  let airPx = 0;
  for (const q of [...bangBodyPixels(b, ms, PPM), ...bangFlashPixels(b, ms, PPM)]) {
    if (q.z < WALL_Z) continue;
    const [px, py] = at(q.x, q.z, q.flat ? 0 : q.y);
    if (px >= 0 && py >= 0 && px < TILE.w && py < TILE.h) { put(x0 + px, y0 + py, snap(q.c)); airPx++; }
  }
  return { phase: p.label, held: !!spec.dev, devicePx, flying, airPx };
}
function drawThrow() {
  const T = THROWS[tId];
  say(4, 3, T.name, HEAD);
  say(4, 15, 'THE THROW: THE CAN IN THE HAND'); say(4 + TILE.w + 6, 15, 'THE FLIGHT: THE HAND EMPTY');
  const tt = (part) => (live ? TPARTS[part][0] + (tS % (TPARTS[part][1] - TPARTS[part][0])) : TSTILL[part]);
  const a = throwTile(tt('throw'), 4, 22), b = throwTile(tt('flight'), 4 + TILE.w + 6, 22);
  // (the throw side on twice as large: the throw's two frames and the follow-through, each facing the door as you do (west: the
  // throwing arm on the far side, the room's) and facing east (the arm on the near side), so the arm's motion can be judged)
  const y = 22 + TILE.h + 4, cw = Math.floor((W - 8 - 2 * 4) / 3), half = Math.floor(cw / 2);
  [['THROW', 'throw0'], ['RELEASE', 'throw1'], ['FOLLOW-THROUGH', 'after']].forEach(([label, frame], i) => {
    const x = 4 + i * (cw + 4), box = [x, y + 7, cw, 78];
    say(x, y, `X2 ${label}`); fill(x, y + 7, cw, 78, snap(FLOOR));
    blit(frameOf(`throw|${tId}|${frame}`, specOf('hold', 'G1', frame, tId), 'left'), x + Math.floor(half / 2) + 6, y + 7 + 78 - 6, 2, box);
    blit(frameOf(`throw|${tId}|${frame}`, specOf('hold', 'G1', frame, tId), 'right'), x + half + Math.floor(half / 2) - 6, y + 7 + 78 - 6, 2, box);
  });
  // (one quantity: the can drawn in the hand or in the air, never both, never neither)
  report = { throw: a, flight: b, oneQuantity: a.held !== a.flying && b.held !== b.flying };
}

// ---------- the check (set=check) ----------
let CHECK = null, CPIC = null;
if (set === 'check') {
  CHECK = await (await fetch('./check.json')).json();
  const im = new Image(); im.src = './check.png'; await im.decode();
  const c = new OffscreenCanvas(im.width, im.height), g = c.getContext('2d'); g.drawImage(im, 0, 0);
  CPIC = { w: im.width, h: im.height, d: g.getImageData(0, 0, im.width, im.height).data };
}
/** The defaults' frame at a moment: the G-11 armed at the pin's beat (the pin), else held (G1); the halligan at the force beat (the pry), else carried (B1). */
function defaultsAt(m) {
  if (m.device.model === 'hal') return m.beat?.startsWith('force') ? ['bar', 'B1', 'force0'] : ['bar', 'B1', 'carry'];
  if (m.device.model === 'ram') return m.beat?.startsWith('force') ? ['ram', 'R1', 'swing1'] : ['ram', 'R1', 'carry'];
  if (m.device.model === 'sc1' || m.device.model === 'bc1') return ['charge', 'C1', 'carry'];
  return m.beat?.startsWith('arm') ? ['hold', 'G1', 'pin'] : ['hold', 'G1', 'hold'];
}
const FRAME_WORD = Object.freeze({ hold: 'HELD', pin: 'AT THE PIN', force0: 'AT THE PRY', carry: 'CARRIED', swing1: 'THE STRIKE' });
function drawCheck() {
  const [cw, ch, foot] = CHECK.crop, colX = [132, 132 + cw + 4, 132 + 2 * (cw + 4)];
  say(4, 2, 'THE CHECK: THE HUNT\'S LANE, THE STAGE TODAY BESIDE THIS PAGE\'S DRAWING', HEAD);
  say(colX[0], 12, 'THE GAME, V0.0.19'); say(colX[1], 12, 'THIS PAGE: TODAY'); say(colX[2], 12, 'THE DEFAULTS');
  const rows = [];
  CHECK.moments.forEach((m, n) => {
    const y = 20 + n * (ch + 3);
    say(4, y + 2, `${m.ms.toLocaleString('en-GB')} MS AFTER GO`, HEAD);
    say(4, y + 10, `${m.device.model === 'hal' ? 'THE HALLIGAN' : m.device.model.toUpperCase()} ${m.device.st.toUpperCase()}`);
    say(4, y + 18, `BEAT: ${(m.beat ?? 'none').toUpperCase()}`);
    say(4, y + 26, `FACING ${m.face.toUpperCase()}`);
    // (the stage's own crop, and its floor's tone under your feet for this page's two)
    for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) { const q = ((n * ch + j) * cw + i) * 4; put(colX[0] + i, y + j, (CPIC.d[q] << 16) | (CPIC.d[q + 1] << 8) | CPIC.d[q + 2]); }
    const [grp, c, frame] = defaultsAt(m), today = frameOf('today', TODAY, m.face), def = frameFor(grp, c, frame, m.face);
    for (const [k, f] of [[1, today], [2, def]]) { fill(colX[k], y, cw, ch, snap(FLOOR)); blit(f, colX[k] + cw / 2, y + ch - foot, 1, [colX[k], y, cw, ch]); }
    say(4, y + 36, `DEFAULT: ${c} ${FRAME_WORD[frame] ?? frame.toUpperCase()}`, LIT);
    rows.push({ ms: m.ms, device: m.device, today: today.px.filter(q => q[3]).length, defaults: def.px.filter(q => q[3]).length, frame: `${c}:${frame}` });
  });
  report = { rows };
}

// ---------- the page ----------
function keysLine() {
  if (set === 'check') return;
  say(4, H - 7, running ? `SPACE STOP   S ${slow ? 'FULL SPEED' : 'SLOW 1/4'}   R AGAIN` : live ? 'SPACE RUN   R AGAIN' : 'STILL FOR THE SHOT: OPEN IT WITH O TO SEE IT MOVE');
}
const cv = document.getElementById('pic'), g = cv.getContext('2d');
cv.width = W; cv.height = H;
function draw() {
  buf.fill(abgr(BG));
  if (set === 'all') drawAll(); else if (set === 'throw') drawThrow(); else if (set === 'check') drawCheck(); else drawOne();
  keysLine();
  const img = g.createImageData(W, H);
  new Uint32Array(img.data.buffer).set(buf);
  g.putImageData(img, 0, 0);
}
function fit() { const k = Math.max(1, Math.floor(Math.min(innerWidth / W, innerHeight / H))); cv.style.width = `${W * k}px`; cv.style.height = `${H * k}px`; }
fit();
addEventListener('resize', fit);
draw();
if (live && set !== 'check') {
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
  requestAnimationFrame(tick);
}
window.__report = { frame: [W, H], set, group, candidate: set === 'throw' ? tId : set === 'check' ? null : cand, live, snapped: snapOn ? 'mars' : null, loopS: set === 'throw' ? loopS(TPH) : loopS(S.phases), ...report };
requestAnimationFrame(() => requestAnimationFrame(() => { window.__ready = true; }));
