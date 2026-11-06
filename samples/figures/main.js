// OLYMPUS figures sample: the chibi as sheets, in a lineup on the stage, and the close figure.
//
// Three views (?view=):
//   - sheets (default): every frame of every outfit in all four facings, as the render's sheets hold them
//     (src/art/figures/atlas.js paintSheet()), at one density: ?ppm=16|24, ?outfits=a,b (outfits.js OUTFITS; "name:weapon:carry" for a weapon and a carry, e.g.
//     utilities:rifle:slung), ?scale=N (the integer scale; 2 by default at 16 px/m, 1 at 24).
//   - lineup: the chibi (the user's pick, 2026-11-06: VIEWS §2.3; the soldier, B, survives only as the
//     gallery's PNGs and their scores) on a concrete floor in the stage at ?ppm, standing in every outfit and doing
//     things (walking with the rifle low, running in PT kit, the high ready, an aimed shot with its flash,
//     kneeling, a magazine out, prone, sitting with the rifle slung, a vac suit floating, a couch, the rack),
//     drawn by src/render/figures.js in one instanced draw; ?mood=, ?zoom=, ?t= (seconds: a still moment
//     for a shot), ?hud=0.
//   - doll: the close figure (src/art/doll/), a marine in utilities and in the vac suit with the load-bearing
//     gear's slots marked, and wounded with dressings; ?scale=.
// window.__ready turns true when the view is drawn; window.__report holds its numbers (sheet sizes and
// paint times; the atlas's uploads, bytes and milliseconds; draw calls).
import { PX_PER_M } from '../../src/render/scale.js';
import { OUTFITS, OUTFIT_LABELS } from '../../src/art/figures/outfits.js';
import { CHIBI } from '../../src/art/figures/body.js';
import { sheetLayout, paintSheet, flashStrip } from '../../src/art/figures/atlas.js';

const q = new URLSearchParams(location.search);
const view = q.get('view') ?? 'sheets';
const report = { view, ppm: PX_PER_M };
window.__report = report; window.__ready = false;
const hud = document.getElementById('hud');
if (q.get('hud') === '0' || view !== 'lineup') hud.classList.add('off');

/** A Pixmap (src/art/paint.js words) on a canvas at an integer scale, on a ground colour. */
function canvasOf(pm, scale, ground = 0x9a948a) {
  const cv = document.createElement('canvas');
  cv.width = pm.w; cv.height = pm.h; cv.className = 'px';
  cv.style.width = `${pm.w * scale}px`; cv.style.height = `${pm.h * scale}px`;
  const g = cv.getContext('2d'), img = g.createImageData(pm.w, pm.h), d = img.data;
  for (let i = 0; i < pm.w * pm.h; i++) {
    const v = pm.data[i], on = v >>> 24 >= 128;
    d[i * 4] = on ? v & 255 : (ground >> 16) & 255; d[i * 4 + 1] = on ? (v >>> 8) & 255 : (ground >> 8) & 255; d[i * 4 + 2] = on ? (v >>> 16) & 255 : ground & 255; d[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return cv;
}
const lookOf = (s) => { const [outfit, weapon, carry] = s.split(':'); return { outfit, weapon: weapon === 'none' ? null : weapon ?? 'rifle', carry: carry ?? 'low', skin: outfit === 'pt' ? 'brown' : 'tan', seed: 3 }; };

// ---------- sheets ----------
function sheets() {
  const scale = Number(q.get('scale') ?? (PX_PER_M >= 20 ? 1 : 2));
  const list = (q.get('outfits') ?? OUTFITS.join(',')).split(',');
  const root = document.getElementById('sheets'), lay = sheetLayout(PX_PER_M);
  root.innerHTML = `<h1>OLYMPUS · FIGURES · ${CHIBI.label} · ${PX_PER_M} px/m</h1>
    <p class="note">Each sheet holds a look's every frame in its four facings (rows: down, up, right, left), in bands: the gait (idle, walk, run, the low-g bound), the arms (aim, aim high and low, fire, kneeling aim and fire, magazine out and in, prone aim and fire), rest (sitting, a crash couch, the rack) and float (two drifting frames, seven tumbles). The sheet is ${lay.w} × ${lay.h} px; the render sends it a band at a time.</p>`;
  report.sheet = [lay.w, lay.h]; report.bands = lay.bands; report.paintMs = {};
  for (const s of list) {
    const look = lookOf(s), name = s.split(':')[0];
    const pm = paintSheet(look, { ppm: PX_PER_M });
    report.paintMs[s] = +pm.ms.toFixed(1);
    const h = document.createElement('h2');
    h.innerHTML = `<b>${OUTFIT_LABELS[name] ?? name}</b> · ${look.weapon ?? 'unarmed'}${look.weapon ? `, carried ${look.carry}` : ''} · painted in ${pm.ms.toFixed(1)} ms`;
    root.append(h, canvasOf(pm, scale));
  }
  const fs = flashStrip(PX_PER_M);
  report.flashStrip = [fs.pm.w, fs.pm.h, fs.count];
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__ready = true; }));
}

// ---------- the lineup on the stage ----------
async function lineup() {
  document.body.classList.add('stage');
  document.getElementById('sheets').remove();
  const { createStage } = await import('../../src/render/stage.js');
  const { createArea } = await import('../../src/render/batch.js');
  const { createFigures, FLASH_LIT_M, FLASH_LIGHT } = await import('../../src/render/figures.js');
  const { tile } = await import('../../src/art/tiles.js');
  const { bodyOf } = await import('../../src/art/figures/body.js');
  const { MOOD_KEYS } = await import('../../src/render/moods.js');
  const zoom = Number(q.get('zoom') ?? 1), moodParam = q.get('mood') ?? 'day';
  const mood = /^\d$/.test(moodParam) ? [...MOOD_KEYS, 'ship'][Number(moodParam) - 1] : moodParam;
  const stage = createStage({ palette: q.get('palette') ?? 'tradecraft', mood, zoom });
  const area = createArea({ name: 'lineup' });
  area.ground({ x0: -14, z0: -8, x1: 34, z1: 22, top: tile('concrete', { metres: 2 }) });
  area.ground({ x0: -14, z0: 5.6, x1: 34, z1: 5.7, top: 0xb9862e, lift: 0.002 });   // (a painted line behind the rows)
  const BENCH = 0x7a6a52;
  // (a stool for the sitter, as high as its seat; a rack for the sleeper)
  {
    const B = bodyOf(PX_PER_M), z = 4.2;
    area.box({ x: 15.3, z, w: 0.5, d: 0.42, h: B.seatM, faces: { sides: BENCH, top: 0x8f7d62 } });
    area.box({ x: 20.7, z: z - 0.05, w: 2.1, d: 0.85, h: 0.42, faces: { sides: 0x5f6a58, top: 0x9aa48e } });
  }
  area.lamp({ x: 6, z: 4, r: 3 }); area.lamp({ x: 16, z: 8, r: 3 });
  area.buildNow();
  area.upload(stage.renderer);
  stage.setArea(area);
  const figs = createFigures({ renderer: stage.renderer });
  area.add(figs.group);

  // The people: a row standing (every outfit, three carries) and a row doing things.
  const STAND = [...OUTFITS.map(o => `${o}:none`), 'utilities:rifle:slung', 'carrier:rifle:high', 'utilities:pistol:low'];
  // (x: metres along the row; the prone and the rack's sleeper take a long cell, so more room)
  const ACT = [
    { x: 0, look: 'utilities:rifle:low', gait: 'walk', face: 'right', move: 1.4 },
    { x: 1.8, look: 'pt:none', gait: 'run', face: 'right', move: 3.4 },
    { x: 3.6, look: 'carrier:rifle:high', gait: 'walk', face: 'down', move: 1.2 },
    { x: 5.4, look: 'carrier:rifle:low', frame: 'fire', face: 'right', flash: true },
    { x: 7.4, look: 'utilities:rifle:low', frame: 'kneel', face: 'right' },
    { x: 9.2, look: 'nco:rifle:low', frame: 'magout', face: 'right' },
    { x: 11.3, look: 'carrier:rifle:low', frame: 'prone', face: 'right' },
    { x: 14.2, look: 'utilities:rifle:slung', frame: 'sit', face: 'right', dz: 0.26 },
    { x: 16.0, look: 'vac:rifle:slung', frame: 'float0', face: 'right', y: 0.9 },
    { x: 19.5, look: 'vacOpen:none', frame: 'sleep', face: 'right', dz: -0.05, y: 0.42 },
  ];
  const tFixed = q.has('t') ? Number(q.get('t')) : null;
  // (?budget=1: nobody is "own", so everyone comes in within the render's budget, a band or two a frame:
  // the report keeps the most any frame uploaded and painted, and how many frames it took)
  const budgeted = q.get('budget') === '1';
  let maxUploads = 0, maxPaintMs = 0, maxBytes = 0, framesToAll = null, steadyUploads = 0;
  const t0 = performance.now();
  const rows = (z0) => {
    const out = [];
    STAND.forEach((s, i) => out.push({ key: `chibi|${s}`, look: lookOf(s), x: 1 + i * 1.7, z: z0, face: 'down', gait: 'idle', phase: i * 0.37 }));
    ACT.forEach((a) => out.push({ ...a, key: `chibi|${a.look}`, look: lookOf(a.look), x: 1.2 + a.x, z: z0 + 2.2 + (a.dz ?? 0), y: a.y ?? 0 }));
    return out;
  };
  const people = rows(2.0);
  const cx = 10.2, cz = 3.4;
  let last = performance.now(), frames = 0;
  window.__figures = figs; window.__stage = stage;
  function loop(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    const tS = tFixed ?? (now - t0) / 1000;
    const list = people.map(p => {
      const tint = stage.lightAt(p.x, p.z);
      // (the flash lights who's near: FLASH_LIT_M)
      const firing = people.find(o => o.flash && Math.hypot(o.x - p.x, o.z - p.z) < FLASH_LIT_M);
      const flashOn = firing && (tFixed !== null || Math.floor(tS * 4) % 4 === 0);
      return { ...p, stride: (p.move ?? 0) * tS, tS, tint: flashOn ? tint.map((v, j) => Math.max(v, FLASH_LIGHT[j] * 0.8)) : tint, flash: p.flash && flashOn, own: !budgeted && frames < 2 };
    });
    figs.update(list);
    stage.follow(cx, cz, dt);
    stage.setFocus(null);
    stage.render();
    frames++;
    const s = stage.stats, A = figs.stats;
    const upl = A.lastFrame.uploads;
    maxUploads = Math.max(maxUploads, upl); maxBytes = Math.max(maxBytes, A.lastFrame.bytes); maxPaintMs = Math.max(maxPaintMs, A.lastFrame.paintMs);
    if (framesToAll === null && A.deferred + A.fallback === 0 && frames > 1) framesToAll = frames;
    else if (framesToAll !== null) steadyUploads += upl;
    Object.assign(report, {
      frame: [s.w, s.h], zoom, mood, calls: { ...s.calls }, cpuMs: +s.cpuMs.toFixed(2),
      atlas: { px: A.atlasPx, sheet: A.sheet, slots: A.slots, used: A.used },
      uploads: A.uploads, uploadKB: Math.round(A.uploadBytes / 1024), uploadMs: +A.uploadMs.toFixed(2),
      paintMs: +A.paintMs.toFixed(1), drawn: A.drawn, deferred: A.deferred, fallback: A.fallback,
      perUpload: A.uploads ? { kB: +(A.uploadBytes / 1024 / A.uploads).toFixed(0), ms: +(A.uploadMs / A.uploads).toFixed(3) } : null,
      budget: { budgeted, maxUploadsPerFrame: maxUploads, maxKBPerFrame: Math.round(maxBytes / 1024), maxPaintMsPerFrame: +maxPaintMs.toFixed(2), framesToAll, steadyUploads, frames },
    });
    if (q.get('hud') !== '0') hud.innerHTML = [
      `<b>OLYMPUS</b> figures · ${PX_PER_M} px/m · ${s.w}×${s.h}${zoom > 1 ? ` (zoom ${zoom})` : ''} · mood ${mood}`,
      `${CHIBI.label} · drawn ${report.drawn}, waiting ${report.deferred}`,
      `draw calls ${s.calls.total} (scene ${s.calls.scene}, post ${s.calls.post}) · cpu ${s.cpuMs.toFixed(2)} ms`,
      `atlas ${A.atlasPx}² · sheet ${A.sheet.join('×')} (${A.slots} slots) · uploads ${report.uploads}, ${report.uploadKB} KB, ${report.uploadMs} ms · painted ${report.paintMs} ms`,
    ].join('\n');
    // (ready once everyone is drawn and nothing waits)
    if (!window.__ready && report.deferred === 0 && report.fallback === 0 && frames > 3) requestAnimationFrame(() => { window.__ready = true; });
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

// ---------- the close figure ----------
async function doll() {
  const { doll: dollOf, DOLL_SCALE } = await import('../../src/art/doll/doll.js');
  const scale = Number(q.get('scale') ?? 3), S = Number(q.get('s') ?? DOLL_SCALE);
  const root = document.getElementById('sheets');
  root.innerHTML = `<h1>OLYMPUS · THE CLOSE FIGURE · ${PX_PER_M} px/m · doll scale ${S}</h1>
    <p class="note">The doll (tradecraft's, ported): drawn at double the picture's density, a marine in utilities and in the light vac suit, the load-bearing gear's slots marked (free: a seam; in use: gold; showing: rust), and wounded, with dressings, a tourniquet and a splint.</p>`;
  const row = document.createElement('div'); row.className = 'doll-row'; root.append(row);
  const CASES = [
    ['Utilities, the cover, a rifle in hand', { look: { outfit: 'utilities', skin: 'tan' }, hand: 'rifle' }],
    ['Plate carrier: the slots marked', { look: { outfit: 'carrier', skin: 'brown' }, marks: { carrier: ['used', 'used', 'free'], belt: ['used', 'free'], trousers: ['free', 'shows'] } }],
    ['Light vac suit, sealed', { look: { outfit: 'vac', skin: 'light' }, marks: { belt: ['used', 'free'] } }],
    ['Light vac suit, helmet off', { look: { outfit: 'vacOpen', skin: 'dark' } }],
    ['Wounded in utilities: a dressing, a tourniquet, a splint', { look: { outfit: 'utilities', skin: 'light', head: null }, wounds: {
      wounds: [{ n: 1, part: 'torso', kind: 'hole', bleed: 2 }, { n: 2, part: 'armR', kind: 'hole', bleed: 1, dressed: 'bandage' }, { n: 3, part: 'legL', kind: 'gash', bleed: 3 },
        { n: 4, part: 'head', kind: 'graze', bleed: 1 }, { n: 5, part: 'legR', kind: 'break' }, { n: 6, part: 'torso', kind: 'stopped', plate: false }],
      tourniquets: ['legL'], splints: ['legR'] } }],
    ['Wounded in the vac suit: a breach patched', { look: { outfit: 'vacOpen', skin: 'tan' }, wounds: { wounds: [{ n: 1, part: 'armL', kind: 'cut', bleed: 1, dressed: 'bandage' }, { n: 2, part: 'torso', kind: 'stopped', plate: true }, { n: 3, part: 'head', kind: 'bruise' }] } }],
  ];
  report.dolls = [];
  for (const [label, opts] of CASES) {
    const t0 = performance.now();
    const pm = dollOf({ ...opts, scale: S });
    report.dolls.push({ label, w: pm.w, h: pm.h, ms: +(performance.now() - t0).toFixed(1), spots: pm.spots?.length ?? 0 });
    const f = document.createElement('figure'), cap = document.createElement('figcaption');
    cap.textContent = `${label} · ${pm.w} × ${pm.h}`;
    f.append(canvasOf(pm, scale, 0x383c4a), cap); row.append(f);
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__ready = true; }));
}

if (view === 'lineup') lineup(); else if (view === 'doll') doll(); else sheets();
