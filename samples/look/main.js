// OLYMPUS look samples: a scene of the kit with the real figures in it, for the user to score the whole look.
//
// The pieces were sampled apart: the stage (samples/stage/), the figures in a lineup on a bare floor
// (samples/figures/), the kit's scenes with stand-in cards for scale (samples/scenes/). This page puts
// them together, as the game will: a scene's area (samples/scenes/*.js build(): one batch draw), its
// mood and weather, and its people drawn by the figures' renderer (src/render/figures.js: one instanced
// draw for everyone, their cards lit by stage.lightAt where they stand), placed by cast.js. One page is
// one candidate: ?ppm=16|24 (src/render/scale.js, read once at load) and ?prop=chibi|soldier; the
// gallery (samples/index.html, built by tools/gallery.mjs from sample.json) shows the four of a scene
// side by side, numbered L1-a to L5-d.
//
// URL parameters: scene=bay|head|mess|chasm|deck (cast.js CASTS), ppm=16|24, prop=chibi|soldier,
// mood=<a mood of the scene> (otherwise the cast's), t=<seconds> (freeze the moment: walkers mid-stride,
// the dust and the steam where they are then; without it the page runs), zoom, x, z (the camera, else
// the cast's), palette (else the scene's), weather=0, fog=0|1 (else the scene's say), see=0, hud=1.
// Keys: H the overlay; D the other density, P the other figures (each a reload: the density is read
// once); M the next mood; Space freeze or run; W weather. window.__ready turns true once everyone is
// drawn and three frames are on screen; window.__report holds the numbers (draw calls, people, looks,
// the atlas's uploads and painting) for tools/shot.mjs and tools/gallery.mjs to print and keep.
import { createStage } from '../../src/render/stage.js';
import { createArea } from '../../src/render/batch.js';
import { createFogMask } from '../../src/render/fog.js';
import { createWeather } from '../../src/render/weather.js';
import { createFigures } from '../../src/render/figures.js';
import { bodyOf, PROPORTIONS } from '../../src/art/figures/body.js';
import { PALETTES } from '../../src/art/palette.js';
import { PX_PER_M } from '../../src/render/scale.js';
import { SCENES } from '../scenes/scenes.js';
import { CASTS, LOOKS, placeAt } from './cast.js';

const q = new URLSearchParams(location.search);
const castName = CASTS[q.get('scene')] ? q.get('scene') : 'bay';
const C = CASTS[castName], S = SCENES[C.scene];
const prop = PROPORTIONS[q.get('prop')] ? q.get('prop') : 'chibi';
const moodNames = Object.keys(S.moods);
const moodName = S.moods[q.get('mood')] ? q.get('mood') : C.mood;
const zoom = Number(q.get('zoom') ?? C.camera.zoom ?? 1);
const camX = Number(q.get('x') ?? C.camera.x), camZ = Number(q.get('z') ?? C.camera.z);
const paletteName = PALETTES[q.get('palette')] ? q.get('palette') : S.palette ?? 'mars';
let frozenS = q.has('t') ? Number(q.get('t')) : null, weatherOn = q.get('weather') !== '0';
const seeOn = q.get('see') !== '0';
const hud = document.getElementById('hud');
if (q.get('hud') === '1') hud.classList.remove('off');

const stage = createStage({ palette: PALETTES[paletteName], zoom, mood: S.moods[moodName] });
const weather = createWeather(stage);

// The scene's area, built whole at load (a load is allowed its milliseconds).
const t0 = performance.now();
const area = createArea({ name: castName });
const built = S.build(area, { ppm: PX_PER_M, mood: moodName, view: 'full' });
const st = area.buildNow();
area.upload(stage.renderer);
stage.setArea(area);
const buildMs = performance.now() - t0;
stage.look(camX, camZ);

// The people: one renderer, the candidate's. Everyone is "own" (painted at once, whatever the budget):
// a sample shows the finished picture; the budget's own numbers are the figures sample's (?budget=1).
const figs = createFigures({ renderer: stage.renderer, prop });
area.add(figs.group);
const B = bodyOf(prop, PX_PER_M);
const youAt = Math.max(0, C.people.findIndex(p => p.you));

// The fog of awareness round you, where the scene asks for it (the storm): near, and a cone ahead.
const fog = createFogMask();
const fogOn = q.has('fog') ? q.get('fog') === '1' : !!built.fog?.(moodName);
const FACE = { right: [1, 0], left: [-1, 0], down: [0, 1], up: [0, -1] };
function fogUpdate(you) {
  if (!fogOn || !you) { stage.setFog(null); return; }
  const sh = built.fogShape ?? { cone: 0.8, reachM: 14, nearM: 2.5 }, [fx, fz] = FACE[you.face] ?? FACE.up;
  fog.place(you.x - 24, you.z - 32);
  fog.fill((x, z) => {
    const dx = x - you.x, dz = z - you.z, d = Math.hypot(dx, dz);
    const ahead = d > 0 && Math.acos(Math.max(-1, Math.min(1, (dx * fx + dz * fz) / d))) < sh.cone;
    return [d < sh.nearM || (d < sh.reachM && ahead) ? 1 : 0, 0];
  });
  fog.ease();
  const [tex, x0, z0, w, h] = fog.upload();
  stage.setFog(tex, x0, z0, w, h, stage.mood.dimK);
}

const report = {
  scene: castName, ppm: PX_PER_M, prop, mood: moodName, zoom, palette: paletteName, t: frozenS,
  frame: null, calls: null, cpuMs: 0, people: C.people.length, looks: new Set(C.people.map(p => p.look)).size,
  drawn: 0, deferred: 0, area: { boxes: st.boxes, drawCalls: st.drawCalls, atlasKB: Math.round(st.atlasBytes / 1024), buildMs: +buildMs.toFixed(1) },
  figures: null, fog: fogOn, weather: null,
};
window.__stage = stage; window.__figures = figs; window.__report = report; window.__ready = false;

let clockS = 0, frames = 0, last = performance.now();
function frame() {
  const tS = frozenS ?? clockS;
  const people = C.people.map((p) => {
    const at = placeAt(p, tS, B.seatM);
    return { key: p.look, look: LOOKS[p.look], ...at, tint: stage.lightAt(at.x, at.z), own: true };
  });
  figs.update(people);
  const you = people[youAt];
  const lying = you && ['sleep', 'couch', 'prone'].includes(you.frame);
  stage.setFocus(seeOn && you ? { x: you.x, z: you.z, h: lying ? 0.9 : you.frame === 'sit' ? 1.3 : 1.8, w: 0.8 } : null);
  if (frames === 0 || frozenS === null) fogUpdate(you);
  let w = weatherOn && built.weather ? built.weather(moodName, tS + 12) : null;
  if (w) {
    w = { ...w };
    if (w.eye && you) w.eye = [you.x, you.z];                       // (the haze is measured from your eyes)
    if (w.puffs && C.steam) w.puffs = w.puffs.map(C.steam).filter(Boolean);   // (the cast's say over the steam)
  }
  weather.set(w);
  stage.render();
}

const held = new Set();
function reloadWith(changes) {
  const n = new URLSearchParams(location.search);
  for (const [k, v] of Object.entries(changes)) n.set(k, v);
  location.search = n.toString();
}
addEventListener('keydown', (e) => {
  if (held.has(e.code)) return;
  held.add(e.code);
  if (e.code === 'KeyH') hud.classList.toggle('off');
  else if (e.code === 'KeyD') reloadWith({ ppm: PX_PER_M === 16 ? 24 : 16 });
  else if (e.code === 'KeyP') reloadWith({ prop: prop === 'chibi' ? 'soldier' : 'chibi' });
  else if (e.code === 'KeyM') reloadWith({ mood: moodNames[(moodNames.indexOf(moodName) + 1) % moodNames.length] });
  else if (e.code === 'Space') { frozenS = frozenS === null ? clockS : null; e.preventDefault(); }
  else if (e.code === 'KeyW') weatherOn = !weatherOn;
});
addEventListener('keyup', (e) => held.delete(e.code));

function loop(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  clockS += dt;
  frame();
  frames++;
  const s = stage.stats, F = figs.stats;
  Object.assign(report, {
    frame: [s.w, s.h], calls: { ...s.calls }, cpuMs: +s.cpuMs.toFixed(2), drawn: F.drawn, deferred: F.deferred + F.fallback,
    figures: { slots: F.slots, used: F.used, uploads: F.uploads, uploadKB: Math.round(F.uploadBytes / 1024), paintMs: +F.paintMs.toFixed(1), sheet: F.sheet },
    weather: weather.active ? { puffs: weather.stats.puffs } : null, t: frozenS,
  });
  if (!hud.classList.contains('off') && (frames < 5 || frames % 15 === 0)) {
    hud.innerHTML = [
      `<b>OLYMPUS</b> look · <b>${S.title}</b> · ${PX_PER_M} px/m · ${s.w}×${s.h}${zoom > 1 ? ` (zoom ${zoom})` : ''} · palette ${paletteName}`,
      `figures <b>${PROPORTIONS[prop].label}</b> · ${F.drawn} drawn of ${C.people.length}, ${report.looks} looks · mood <b>${moodName}</b>${frozenS !== null ? ` · frozen at ${frozenS.toFixed(2)} s` : ''}`,
      `draw calls ${s.calls.total} (scene ${s.calls.scene}, post ${s.calls.post}) · cpu ${s.cpuMs.toFixed(2)} ms · area ${st.boxes} boxes, built ${buildMs.toFixed(0)} ms · atlas ${F.uploads} bands, ${report.figures.uploadKB} KB, painted ${report.figures.paintMs} ms`,
      `H overlay · D density · P figures · M mood · Space freeze · W weather`,
    ].join('\n');
  }
  if (!window.__ready && frames >= 3 && report.deferred === 0 && F.drawn === C.people.length) requestAnimationFrame(() => { window.__ready = true; });
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
