// OLYMPUS stage sample: a plain test room on the pixel stage, at 16 or 24 px/m.
//
// A 12 × 8 m concrete room (a base building's: painted block walls, cast slab floor) with a door in
// its north wall, a few boxes of different painted materials (src/../samples/stage/kit.js), two
// ceiling lamps, the emergency lighting every room has (floor strips, a battle strip, two emergency
// lamps), and a placeholder figure on an upright card, rendered by src/render/stage.js. Keys 1–6 pick
// the lighting moods (day, dusk, night, battle red, emergency amber, blackout with floor strips; 7 the
// ship's normal light), and the picture's corner prints its draw calls and milliseconds a frame.
//
// URL parameters (all optional): ppm=16|24 (src/render/scale.js), mood=1..7 or a name, palette=
// tradecraft|mars|ship|europa, deck=1 (the same plan as a ship's deck), fog=1 (the fog of awareness
// round the figure), see=0 (no see-through), stress=N (N more boxes, for the draw calls), snap=lut|loop|off,
// gamma=2.2|srgb, zoom=2 (a closer picture), fx, fz (the figure's spot), hud=0, bench=1 (time 120
// frames each way and report). The arrow keys move the figure; F fog, S see-through, P palette,
// L snap mode, O outlines, D deck, R rebuild the area (dispose and build: the leak check), B bench.
// window.__stage is the stage; window.__ready turns true after three frames; window.__report holds the
// numbers (for the screenshot script).
import { createStage } from '../../src/render/stage.js';
import { createArea } from '../../src/render/batch.js';
import { buildCutaway } from '../../src/render/cutaway.js';
import { createCard } from '../../src/render/cards.js';
import { createFogMask } from '../../src/render/fog.js';
import { MOOD_KEYS, MOODS } from '../../src/render/moods.js';
import { PALETTES } from '../../src/art/palette.js';
import { PX_PER_M } from '../../src/render/scale.js';
import { furnish, marine } from './kit.js';

const q = new URLSearchParams(location.search);
const num = (k, d) => (q.has(k) ? Number(q.get(k)) : d);
const moodParam = q.get('mood') ?? '1';
let moodName = /^\d$/.test(moodParam) ? [...MOOD_KEYS, 'ship'][Number(moodParam) - 1] ?? 'day' : moodParam;
let paletteName = q.get('palette') ?? 'tradecraft', deck = q.get('deck') === '1', fogOn = q.get('fog') === '1', seeOn = q.get('see') !== '0';
let snap = q.get('snap') ?? 'lut', outline = true;
const stress = num('stress', 0), zoom = num('zoom', 1);
const hud = document.getElementById('hud');
if (q.get('hud') === '0') hud.classList.add('off');

const stage = createStage({ palette: PALETTES[paletteName], snap, gamma: q.get('gamma') ?? '2.2', zoom, mood: moodName });

// The room: a plan (tradecraft's shape: rooms, openings, what hangs on the north wall), cut away.
const PLAN = {
  x0: 0, z0: 0, x1: 12, z1: 8,
  rooms: [{ x0: 0, z0: 0, x1: 12, z1: 8 }],
  openings: [{ axis: 'x', at: 0, a: 5.4, b: 6.6, kind: 'door', label: '1-04' }],
  decor: [
    { kind: 'emergency', x: 2.5 }, { kind: 'emergency', x: 9.0 },
    { kind: 'sign', x: 4.2, y: 1.55, w: 1.4, h: 0.4, text: 'MCRN', color: 0x9e3c36 },
    { kind: 'board', x: 8.0, y: 1.2, w: 1.2, h: 0.8 },
    { kind: 'clock', x: 10.6, y: 2.25, w: 0.3, h: 0.3 },
    { kind: 'stencil', x: 1.9, y: 1.55, text: 'ARMOURY 2' },
  ],
  lamps: [{ x: 3.4, z: 4.2, r: 2.0 }, { x: 8.6, z: 4.2, r: 2.0 }],
};

let area = null, figure = null, fx = num('fx', 6.75), fz = num('fz', 5.5);
function build() {
  const t0 = performance.now();
  if (area) { area.dispose(); figure = null; }
  area = createArea({ name: deck ? 'test-deck' : 'test-room' });
  buildCutaway(area, PLAN, { deck });
  furnish(area, { stress });
  figure = createCard(marine(PX_PER_M), { x: fx, z: fz });
  area.add(figure.group);
  area.buildNow();
  const tb = performance.now();
  area.upload(stage.renderer);                                       // (at load: all of it now)
  stage.setArea(area);
  build.ms = { build: tb - t0, upload: performance.now() - tb };
}
build();

const fog = createFogMask();
function fogUpdate() {
  if (!fogOn) { stage.setFog(null); return; }
  // (a stand-in for the sim's perception: what is near, and a cone toward the camera, the way the figure faces)
  fog.place(fx - 24, fz - 32);
  fog.fill((x, z) => {
    const dx = x - fx, dz = z - fz, d = Math.hypot(dx, dz);
    const inRoom = x > PLAN.x0 - 0.3 && x < PLAN.x1 + 0.3 && z > PLAN.z0 - 0.4 && z < PLAN.z1 + 0.4;
    const cone = d < 7.5 && dz > 0 && Math.abs(Math.atan2(dx, dz)) < 0.75;
    return [inRoom && (d < 2.2 || cone) ? 1 : 0, 0];
  });
  fog.ease();
  const [t, x0, z0, w, h] = fog.upload();
  stage.setFog(t, x0, z0, w, h, stage.mood.dimK);
}

function setMood(name) { moodName = name; stage.setMood(name); fogUpdate(); }

// Keys (by physical key, as the game reads them).
const held = new Set();
addEventListener('keydown', (e) => {
  held.add(e.code);
  const d = e.code.match(/^Digit([1-7])$/);
  if (d) setMood([...MOOD_KEYS, 'ship'][Number(d[1]) - 1]);
  else if (e.code === 'KeyF') { fogOn = !fogOn; fogUpdate(); }
  else if (e.code === 'KeyS') seeOn = !seeOn;
  else if (e.code === 'KeyP') { const k = Object.keys(PALETTES); paletteName = k[(k.indexOf(paletteName) + 1) % k.length]; stage.setPalette(paletteName); }
  else if (e.code === 'KeyL') { snap = { lut: 'loop', loop: 'off', off: 'lut' }[snap]; stage.setSnap(snap); }
  else if (e.code === 'KeyO') { outline = !outline; stage.post.U.outline.value = outline ? 1 : 0; }
  else if (e.code === 'KeyD') { deck = !deck; build(); }
  else if (e.code === 'KeyR') build();
  else if (e.code === 'KeyB') report.bench = bench();
});
addEventListener('keyup', (e) => held.delete(e.code));

/** Time n frames forced to finish (a 1-pixel read waits for the GPU): ms a frame, CPU and GPU together. */
function bench(n = 120) {
  const gl = stage.renderer.getContext(), px = new Uint8Array(4), out = {};
  for (const s of ['lut', 'loop']) {
    stage.setSnap(s);
    stage.render(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const t0 = performance.now();
    for (let i = 0; i < n; i++) stage.render();
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    out[s] = (performance.now() - t0) / n;
  }
  stage.setSnap(snap);
  return out;
}

const report = { ppm: PX_PER_M, frame: null, mood: null, calls: null, triangles: 0, cpuMs: 0, frameMs: 0, area: null, build: null, bench: null };
window.__stage = stage; window.__report = report; window.__ready = false;
window.__olympusStage = { setMood, build, bench, get area() { return area; }, get figure() { return figure; } };

let last = performance.now(), frames = 0, frameMs = 16.7, hudAt = 0;
function loop(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  frameMs += ((now - last) - frameMs) * 0.1;
  last = now;
  // (the figure walks: 1.4 m/s; the camera leans where it goes, as the game's eye-lead will)
  const vx = (held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0), vz = (held.has('ArrowDown') ? 1 : 0) - (held.has('ArrowUp') ? 1 : 0);
  if (vx || vz) { fx = Math.max(0.3, Math.min(11.7, fx + vx * 1.4 * dt)); fz = Math.max(0.6, Math.min(7.6, fz + vz * 1.4 * dt)); figure.place(fx, fz); fogUpdate(); }
  stage.setLead(vx * 0.8, vz * 1.6);
  stage.follow(6, 3.1, dt);                                           // (the room held still in the picture, as tradecraft's flats: its middle)
  figure.setTint(stage.lightAt(figure.x, figure.z));
  stage.setFocus(seeOn ? { x: figure.x, z: figure.z, h: figure.heightM, w: 0.8 } : null);   // (the body's width: the card's painting is wider, its arms and outline)
  stage.render();
  frames++;
  if (now - hudAt > 250 || frames < 4) {
    hudAt = now;
    const s = stage.stats, a = area.stats, P = area.atlas.pages[0];
    Object.assign(report, { frame: [s.w, s.h], mood: moodName, calls: { ...s.calls }, triangles: s.triangles, cpuMs: +s.cpuMs.toFixed(2), frameMs: +frameMs.toFixed(1), gpuMs: s.gpuMs,
      area: { boxes: a.boxes, quads: a.quads, drawCalls: a.drawCalls, atlas: area.atlas.pages.map(p => `${p.w}x${p.h}`), atlasKB: Math.round(a.atlasBytes / 1024), glowMapKB: Math.round(a.glowMapBytes / 1024), paintMs: +a.paintMs.toFixed(1) },
      build: { ms: +build.ms.build.toFixed(1), uploadMs: +build.ms.upload.toFixed(1) }, palette: paletteName, snap, programs: s.programs, textures: s.textures, gpu: s.gpu });
    hud.innerHTML = [
      `<b>OLYMPUS</b> pixel stage · ${PX_PER_M} px/m · ${s.w}×${s.h}${zoom > 1 ? ` (zoom ${zoom})` : ''} · palette ${paletteName} (${PALETTES[paletteName].length}) · snap ${snap}${deck ? ' · deck' : ''}`,
      `mood <b>${[...MOOD_KEYS, 'ship'].indexOf(moodName) + 1} ${moodName}</b> · draw calls ${s.calls.total} (scene ${s.calls.scene}${s.shadowDrawn ? ' with shadow map' : ''}, post ${s.calls.post}) · ${s.triangles.toLocaleString('en')} triangles`,
      `area: ${a.boxes} boxes, ${a.quads} quads → ${a.drawCalls} batch draw · atlas ${P.w}×${P.h} · built in ${build.ms.build.toFixed(0)} ms`,
      `cpu ${s.cpuMs.toFixed(2)} ms/frame · frame ${frameMs.toFixed(1)} ms${s.gpuMs !== null ? ` · gpu ${s.gpuMs.toFixed(2)} ms` : ''}${report.bench ? ` · bench lut ${report.bench.lut.toFixed(2)} / loop ${report.bench.loop.toFixed(2)} ms` : ''}`,
      `1–6 mood (7 ship) · F fog · S see-through · P palette · L snap · O outline · D deck · R rebuild · B bench · arrows move`,
    ].join('\n');
  }
  if (frames === 3) {
    if (q.get('bench') === '1') report.bench = bench();
    requestAnimationFrame(() => { window.__ready = true; });
  }
  requestAnimationFrame(loop);
}
fogUpdate();
requestAnimationFrame(loop);
