// OLYMPUS sample: helmets. Today's sealed helmet and the candidates (regular, elite, the factions' trim, the OPA's), on the walking stack in the shoot house's light and on the card.
//
// The user, 2026-11-15: "The helmet design is pretty goofy, I was thinking slicker design like this [a closed black combat helmet,
// a wraparound visor over a lit orange face shield, a moulded jaw and breathing piece] for regular units and even slicker for elite
// units with no visor, replaced by thin slits for the eyes or red dots depending on the elite units (martian get red outlines on
// their gear, UN get blue), if OPA get elite units, they'll get more rugged looking gear like [a cut ballistic helmet with side
// rails over a full-face mask with two round side filters] modernized." The candidates are the game's own figure code
// (src/art/figures/helmets.js, behind a look's helm, which no look of the game carries) and the doll's (src/art/doll/helmets.js):
//   S0      today's look, v0.0.12's sealed helmet (the light vac suit's dome, its visor brow to chin): the reference;
//   R1-R4   regular: a closed shell that hugs the head, a wraparound visor lit faintly from inside, a moulded jaw;
//   E1-E4   elite: sleeker, no visor, thin slits or dots lit in the faction's colour (red with none);
//   O1-O3   OPA: a cut ballistic helmet with rails over a full-face mask, two round side filters, their own worn colours;
//   &f=mars or &f=un: the faction's trim, thin lines on the helmet, the plates and the shoulders' seams.
// Each view (?c=<id>[&f=<faction>]): on the left the stack walking up the hall to room 1's door, you and your #2 both in the
// candidate (the game's picture of the hall at 10:00 on seed 48213 from samples/house-stack-figures, its light as a figure's tint,
// the post pass's outline, grade and snap to the Mars palette, as that sample draws it); in the middle the four facings at the
// door in that light, twice size (still: the stack's beat; live: walking, the glide's cycle); on the right the card's doll (the
// inventory and character card's figure, at the card's own scale against the stage, unlit as the card draws it).
// ?set=lineup&fam=regular|elite|opa|all: every candidate of a family side on and from the front, twice size, in the house light,
// with its doll's head and shoulders.
// Live (the gallery's O, ?hud=1 or ?live=1) it runs: Space stops and starts it, S slows it to a quarter, ← and → step a tick
// (50 ms) while stopped, R starts again. Shot (no hud), it is still at the walk's telling moment.
// window.__report: the frame, the candidate, the moment; window.__ready once drawn.
import { composeFrame } from '../../src/art/figures/compose.js';
import { shade } from '../../src/art/figures/shade.js';
import { wear, coloursOf } from '../../src/art/figures/outfits.js';
import { HELMS, HELM_IDS } from '../../src/art/figures/helmets.js';
import { doll } from '../../src/art/doll/doll.js';
import { cyclePose, cycleAt, beatPose, bandSpec } from '../../src/art/figures/walk.js';
import { text } from '../../src/art/font.js';
import { PALETTES, nearest } from '../../src/art/palette.js';
import { linear } from '../../src/art/tone.js';
import { gaitSpeeds } from '../../src/sim/body/motion.js';

const params = new URLSearchParams(location.search);
const set = params.get('set') === 'lineup' ? 'lineup' : 'one';
const live = params.get('hud') === '1' || params.get('live') === '1';
const PPM = 16, INK = 0x14151c, LABEL = 0x9aa0ab, HEAD = 0xd8dce4, BG = 0x0e0f14;
const FACTION = ['mars', 'un'].includes(params.get('f')) ? params.get('f') : null;
const IDS = ['S0', ...HELM_IDS];
const cid = IDS.includes(params.get('c')) ? params.get('c') : 'R1';
const FAMS = { regular: HELM_IDS.filter(i => HELMS[i].family === 'regular'), elite: HELM_IDS.filter(i => HELMS[i].family === 'elite'), opa: HELM_IDS.filter(i => HELMS[i].family === 'opa') };
const fam = FAMS[params.get('fam')] ? params.get('fam') : 'all';
const nameOf = (c) => (c === 'S0' ? 'S0 TODAY: V0.0.12\'S SEALED HELMET' : HELMS[c].name.toUpperCase().replace(/[^A-Z0-9 :,.'-]/g, ' '));
const FNAME = { mars: 'MARS RED TRIM', un: 'UN BLUE TRIM' };
/** The faction named in a title: none for the OPA, who take no faction's trim (helmets.js helmOf). */
const trimSaid = (opa) => (FACTION && !opa ? `, ${FNAME[FACTION]}` : '');

// ---------- the scene: the game's picture of the hall and its light ----------
const SCENE = await (await fetch('./scene.json')).json();
const loadImg = async (src) => { const im = new Image(); im.src = src; await im.decode(); const c = new OffscreenCanvas(im.width, im.height), g = c.getContext('2d'); g.drawImage(im, 0, 0); return { w: im.width, h: im.height, d: g.getImageData(0, 0, im.width, im.height).data }; };
const BACK = await loadImg('./backdrop.png');
const [FW, FH] = SCENE.frame, CAM = SCENE.camera;
const colOf = (x) => Math.round((x - CAM.x) * PPM) + FW / 2;
/** The hall tile: x 26 to 36 m, from room 1's wall to the hall's south wall (house-stack-figures' TILE). */
const TILE = Object.freeze({ x: colOf(26), y: 96, w: 160, h: 100 });

// ---------- the post pass's steps (src/render/post.js), per pixel (as samples/house-stack-figures) ----------
const SNAP = new Map();
const snap = (c) => { let v = SNAP.get(c); if (v === undefined) { v = nearest(c, PALETTES.mars); SNAP.set(c, v); } return v; };
const srgbLin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const enc = (v) => Math.max(0, v) ** (1 / 2.2);
function post(lin, edge = 1) {
  const c = lin.map(v => Math.min(1, enc(v)) * edge);
  const l = 0.30 * c[0] + 0.59 * c[1] + 0.11 * c[2], k = [1.05, 1.0, 0.9], sh = Math.max(0, 0.35 - l), add = [0.03, -0.01, 0.05];
  const o = c.map((v, j) => Math.max(0, Math.min(1, (v + (l - v) * 0.18) * k[j] + sh * add[j])));
  return snap((Math.round(o[0] * 255) << 16) | (Math.round(o[1] * 255) << 8) | Math.round(o[2] * 255));
}
const decode = (c) => [(c >> 16) & 255, (c >> 8) & 255, c & 255].map(v => (v / 255) ** 2.2);
const INK_LIN = linear(INK);

// ---------- the figures: the game's frames for a candidate's look ----------
const lookOf = (c, seed) => wear({ outfit: 'combatSuit', weapon: 'rifle', carry: 'low', carrier: true, seed, model: 'r7', ...(c === 'S0' ? {} : { helm: { id: c, faction: FACTION } }) });
const LOOKS = new Map(), FRAMES = new Map();
const lookFor = (c, i) => { const k = `${c}|${i}`; if (!LOOKS.has(k)) LOOKS.set(k, lookOf(c, 3 + i)); return LOOKS.get(k); };
/** A frame ('walk:<k>' the glide's frame k, 'stack' the beat) of candidate c's man i facing dir: { px: [[x, y, colour, glows]], ax, ay, w, h }. */
function frameOf(c, i, name, dir) {
  const key = `${c}|${i}|${name}|${dir}`;
  let f = FRAMES.get(key);
  if (!f) {
    const pose = name === 'stack' ? beatPose('stack', { weapon: 'rifle', carry: 'low', cycle: 'B' }) : cyclePose('B', 'combat', Number(name.split(':')[1]), { weapon: 'rifle', carry: 'low' });
    const fr = composeFrame(lookFor(c, i), dir, 'idle0', { ppm: PPM, pose }), pm = shade(fr.cells, coloursOf(fr.look, PPM)), px = [];
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

// ---------- the moment: the stack's walk up the hall (house-stack-figures' walk up) ----------
const SPEED = gaitSpeeds({ gG: 1, gait: 'combat' }).walkMs, STEP_M = bandSpec('B', 'combat').S / PPM;
const START = [[33.88, 13.2], [34.53, 13.2]], STACK = [[29.95, 12.45], [30.6, 12.45]];
const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const HOLD0 = 0.6, WALK_S = len(START[0], STACK[0]) / SPEED, LOOP_S = HOLD0 + WALK_S + 1.2, STILL_S = HOLD0 + WALK_S * 0.55;
/** Man i (0 you, 1 your #2) at t s: { x, z, face, frame }. */
function manAt(i, t) {
  if (t < HOLD0) return { x: START[i][0], z: START[i][1], face: 'left', frame: 'stack' };
  const walked = (t - HOLD0) * SPEED;
  if (walked >= len(START[i], STACK[i])) return { x: STACK[i][0], z: STACK[i][1], face: 'left', frame: 'stack' };
  const k = walked / len(START[i], STACK[i]), at = cycleAt({ cycle: 'B', band: 'combat', gp: walked / STEP_M, stepM: STEP_M });
  return { x: START[i][0] + (STACK[i][0] - START[i][0]) * k + at.lagPx / PPM, z: START[i][1] + (STACK[i][1] - START[i][1]) * k, face: 'left', frame: `walk:${at.frame}` };
}
const tintAt = (x, z) => {
  const T = SCENE.tints, i = Math.max(0, Math.min(T.nx - 1, Math.round((x - T.x0) / T.stepM))), j = Math.max(0, Math.min(T.nz - 1, Math.round((z - T.z0) / T.stepM)));
  return T.rgb[j * T.nx + i];
};

/**
 * Men [{ c, i, x, z, face, frame }] drawn over the game's picture in a rect of it (house-stack-figures' renderTile: the blob,
 * the cards far to near, the post pass's outline over them, the tint at each man's place, the glows unlit). Returns the colours.
 */
function renderTile(men, rect) {
  const tw = rect.w, th = rect.h, N = tw * th;
  const base = new Int32Array(N), top = new Int8Array(N).fill(-1), col = new Int32Array(N), glow = new Uint8Array(N), hAbove = new Float32Array(N);
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) { const i = ((rect.y + y) * BACK.w + rect.x + x) * 4; base[y * tw + x] = (BACK.d[i] << 16) | (BACK.d[i + 1] << 8) | BACK.d[i + 2]; }
  const cols = (x) => Math.round((x - CAM.x) * PPM) + FW / 2 - rect.x, rows = (z) => Math.round((z - CAM.z) * PPM) + FH / 2 - rect.y;
  const lay = base.slice(), darken = (i, a) => { lay[i] = post(decode(lay[i]).map((v, j) => v * (1 - a) + INK_LIN[j] * a), 1); };
  const order = men.map((m, n) => ({ m, n, f: frameOf(m.c, m.i, m.frame, m.face) })).sort((a, b) => a.m.z - b.m.z || a.n - b.n);
  for (const { m } of order) {
    const cx = (Math.round(m.x * PPM) / PPM - CAM.x) * PPM + FW / 2 - rect.x, cz = (Math.round(m.z * PPM) / PPM - CAM.z) * PPM + FH / 2 - rect.y;
    const rx = 0.42 * PPM, rz = 0.252 * PPM;
    for (let y = Math.floor(cz - rz - 1); y <= Math.ceil(cz + rz + 1); y++) for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
      if (x < 0 || y < 0 || x >= tw || y >= th) continue;
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cz) / rz;
      if (dx * dx + dy * dy <= 1) darken(y * tw + x, 0.4);
    }
  }
  const zc = [];
  for (const { m, n, f } of order) {
    const X = cols(m.x) - f.ax, Y = rows(m.z) - f.ay, bottom = Y + f.h;
    zc[n] = m.z + (f.h - f.ay) / PPM;
    for (const [px, py, v, g] of f.px) {
      const x = X + px, y = Y + py;
      if (x < 0 || y < 0 || x >= tw || y >= th) continue;
      const k = y * tw + x;
      top[k] = n; col[k] = v; glow[k] = g ? 1 : 0; hAbove[k] = (bottom - y - 0.5) / PPM;
    }
  }
  const out = new Int32Array(N);
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
    const k = y * tw + x, i = top[k];
    if (i < 0) { out[k] = lay[k]; continue; }
    let edge = 1;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const X = x + dx, Y = y + dy;
      if (X < 0 || Y < 0 || X >= tw || Y >= th) continue;
      const j = top[Y * tw + X];
      if (j === i) continue;
      const behind = j < 0 ? Math.SQRT2 * hAbove[k] : Math.SQRT2 * (zc[i] - zc[j]);
      if (behind > 0.35) edge = Math.min(edge, 0.12);
      else if (behind > 0.02) edge = Math.min(edge, 0.4);
      else if (j >= 0 && Math.abs(behind) <= 0.02 && i > j) edge = Math.min(edge, 0.12);
    }
    const v = col[k], s = [(v >> 16) & 255, (v >> 8) & 255, v & 255].map(q => srgbLin(q / 255));
    const t = glow[k] ? [1, 1, 1] : tintAt(men[i].x, men[i].z);
    out[k] = post(s.map((q, j) => q * t[j]), edge);
  }
  return out;
}

/** The doll for a candidate (the card's figure), and its colours as 0xRRGGBB. */
const DOLLS = new Map();
function dollOf(c) {
  if (!DOLLS.has(c)) {
    const look = c === 'S0' ? { outfit: 'vac' } : { outfit: 'combatSuit', carrier: true, helm: { id: c, faction: FACTION } };
    const d = doll({ look, hand: 'rifle' });
    DOLLS.set(c, { w: d.w, h: d.h, at: (x, y) => { const v = d.data[y * d.w + x]; return ((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff); } });
  }
  return DOLLS.get(c);
}

// ---------- the page's picture ----------
const FACE_SPOT = Object.freeze({ x: 30.6, z: 12.45 }), FCELL = Object.freeze({ w: 32, h: 34 }), DIRS = Object.freeze(['down', 'right', 'left', 'up']);
/** A figure alone at the door in the house's light, in a 32 × 34 rect of the picture round it. */
const faceRect = () => ({ x: colOf(FACE_SPOT.x) - 16, y: Math.round((FACE_SPOT.z - CAM.z) * PPM) + FH / 2 - 30, w: FCELL.w, h: FCELL.h });
const LINE = set === 'lineup' ? (fam === 'all' ? HELM_IDS : FAMS[fam]) : null;
const DOLL_W = 64, DOLL_H = 70;                    // (the lineup's doll: head and shoulders)
const W = set === 'one' ? 4 + TILE.w + 6 + 2 * (FCELL.w * 2 + 2) + 4 + 64 + 4 : 4 + LINE.length * (FCELL.w * 2 + 4) + 4;
const H = set === 'one' ? 24 + 2 * (FCELL.h * 2 + 10) + 12 : 24 + FCELL.h * 2 + 10 + FCELL.h * 2 + 10 + DOLL_H + 12 + 12;
const buf = new Uint32Array(W * H);
const abgr = (c) => 0xff000000 | ((c & 0xff) << 16) | (c & 0xff00) | ((c >>> 16) & 0xff);
const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) buf[y * W + x] = abgr(c); };
const fill = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, c); };
const say = (x, y, s, c = LABEL) => text((X, Y, w, h, col) => fill(X, Y, w, h, col), x, y, s, c);
const blit = (tile, x0, y0, rect, k = 1) => { for (let y = 0; y < rect.h * k; y++) for (let x = 0; x < rect.w * k; x++) put(x0 + x, y0 + y, tile[Math.floor(y / k) * rect.w + Math.floor(x / k)]); };
/** The frame a facing shows at t: walking (live) or the stack's beat (still). */
const facingFrame = (t) => (live ? `walk:${cycleAt({ cycle: 'B', band: 'combat', gp: t * SPEED / STEP_M, stepM: STEP_M }).frame}` : 'stack');
const facing = (c, dir, t) => renderTile([{ c, i: 0, x: FACE_SPOT.x, z: FACE_SPOT.z, face: dir, frame: facingFrame(t) }], faceRect());

let tS = 0, running = live, slow = false;
function draw() {
  buf.fill(abgr(BG));
  if (set === 'one') {
    say(4, 3, nameOf(cid) + trimSaid(cid !== 'S0' && HELMS[cid].family === 'opa'), HEAD);
    say(4, 14, 'THE WALK UP, IN THE HOUSE\'S LIGHT');
    const t = live ? tS % LOOP_S : STILL_S;
    blit(renderTile([{ c: cid, i: 0, ...manAt(0, t) }, { c: cid, i: 1, ...manAt(1, t) }], TILE), 4, 22, TILE);
    const fx = 4 + TILE.w + 6;
    say(fx, 14, live ? 'WALKING, X2' : 'AT THE DOOR, X2');
    DIRS.forEach((d, n) => blit(facing(cid, d, tS), fx + (n % 2) * (FCELL.w * 2 + 2), 22 + Math.floor(n / 2) * (FCELL.h * 2 + 10), faceRect(), 2));
    const dx = fx + 2 * (FCELL.w * 2 + 2) + 4, D = dollOf(cid);
    say(dx, 14, 'THE CARD');
    for (let y = 0; y < D.h; y++) for (let x = 0; x < D.w; x++) put(dx + x, 22 + y, D.at(x, y));
  } else {
    say(4, 3, `THE ${fam === 'all' ? 'CANDIDATES' : fam.toUpperCase() + ' CANDIDATES'}${trimSaid(fam === 'opa')}: FRONT, SIDE ON, THE CARD`, HEAD);
    LINE.forEach((c, n) => {
      const x = 4 + n * (FCELL.w * 2 + 4);
      say(x, 14, c);
      blit(facing(c, 'down', tS), x, 22, faceRect(), 2);
      blit(facing(c, 'left', tS), x, 22 + FCELL.h * 2 + 10, faceRect(), 2);
      const D = dollOf(c), y0 = 22 + 2 * (FCELL.h * 2 + 10);
      for (let y = 0; y < DOLL_H; y++) for (let X = 0; X < DOLL_W; X++) put(x + X, y0 + y, D.at(X, y + 4));
    });
  }
  if (live) say(4, H - 8, `SPACE ${running ? 'STOP' : 'RUN'}   S ${slow ? 'FULL SPEED' : 'SLOW 1/4'}   ${running ? '' : '<- -> A TICK   '}R AGAIN   ${tS.toFixed(2)} S`);
  else say(4, H - 8, 'STILL HERE: O IN THE GALLERY RUNS IT, WALKING');
  const cv = document.getElementById('pic'), g = cv.getContext('2d'), img = g.createImageData(W, H);
  new Uint32Array(img.data.buffer).set(buf);
  g.putImageData(img, 0, 0);
}

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
  frame: [W, H], set, candidate: set === 'one' ? cid : null, faction: FACTION, family: set === 'lineup' ? fam : null, live, snapped: 'mars',
  moment: { loopS: +LOOP_S.toFixed(2), walkUpS: +WALK_S.toFixed(2), speedMs: +SPEED.toFixed(2), stepM: STEP_M, stillS: +STILL_S.toFixed(2) },
  candidates: Object.fromEntries(IDS.map(c => [c, nameOf(c)])),
};
requestAnimationFrame(() => requestAnimationFrame(() => { window.__ready = true; }));
