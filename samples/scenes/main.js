// OLYMPUS scenes sample: the look samples of Base Melas, the valley floor and a frigate's deck, on the pixel stage.
//
// Each scene (barracks.js: the squad bay and the head; messhall.js; chasm.js: the valley floor; frigate.js:
// a frigate's marine deck; kitsheet.js: every kind and make of the kit) builds one area of the stage
// (src/render/batch.js: every static box in one draw call) from the kit (src/art/kit/), the materials
// (src/art/materials/), the terrain (src/art/terrain/) and the stage's cutaway (src/render/cutaway.js),
// puts placeholder figures in it on cards for scale (figure.js), and names its lighting moods
// (moods.js) and its weather (src/render/weather.js: a storm's haze and dust, steam over showers and pans).
//
// URL parameters: scene=bay|head|mess|chasm|deck|kit, ppm=16|24 (src/render/scale.js), mood=<name or
// 1..n>, view=<the scene's camera: full, close, ...>, zoom (otherwise the view's), palette=tradecraft|
// mars|ship|europa (otherwise the scene's), weather=0 (none), fog=1, see=0, hud=0, bench=1 (time the
// frame, CPU and GPU, and put it in the report), t=<seconds into the scene's clock> (what falls and rises).
// Keys: 1..9 the scene's moods, M the next, W weather, P palette, O outlines, F fog, B bench, arrows move
// the first figure. window.__report holds the numbers (draw calls, triangles, milliseconds, the area's
// size and build time) for tools/shot.mjs and samples/scenes/shoot.mjs; window.__ready turns true once
// the third frame is drawn.
import { createStage } from '../../src/render/stage.js';
import { createArea } from '../../src/render/batch.js';
import { createCard } from '../../src/render/cards.js';
import { createFogMask } from '../../src/render/fog.js';
import { createWeather } from '../../src/render/weather.js';
import { PALETTES } from '../../src/art/palette.js';
import { PX_PER_M } from '../../src/render/scale.js';
import { figure } from './figure.js';
import { SCENES } from './scenes.js';

const q = new URLSearchParams(location.search);
const sceneName = q.get('scene') ?? 'bay';
const S = SCENES[sceneName];
if (!S) throw new Error(`no scene '${sceneName}' (${Object.keys(SCENES).join(', ')})`);
const moodNames = Object.keys(S.moods);
const moodParam = q.get('mood') ?? S.mood ?? moodNames[0];
let moodName = /^\d+$/.test(moodParam) ? moodNames[Number(moodParam) - 1] ?? moodNames[0] : moodParam;
if (!S.moods[moodName]) moodName = moodNames[0];
const viewName = q.get('view') ?? S.view ?? Object.keys(S.views)[0], view = S.views[viewName] ?? Object.values(S.views)[0];
const zoom = Number(q.get('zoom') ?? view.zoom ?? 1);
let paletteName = q.get('palette') ?? S.palette ?? 'mars';
let weatherOn = q.get('weather') !== '0', fogOn = q.get('fog') === '1', seeOn = q.get('see') !== '0', outline = true;
const hud = document.getElementById('hud');
if (q.get('hud') === '0') hud.classList.add('off');

const stage = createStage({ palette: PALETTES[paletteName], zoom, mood: S.moods[moodName] });
const weather = createWeather(stage);
let clockS = Number(q.get('t') ?? 12);

// The scene's area: built whole at load (a load is allowed its milliseconds; mid-play areas build in budgeted steps).
const t0 = performance.now();
const area = createArea({ name: sceneName });
const built = S.build(area, { ppm: PX_PER_M, mood: moodName, view: viewName });
const cards = [];
for (const f of built.figures ?? []) {
  const card = createCard(figure(PX_PER_M, f), { x: f.x, z: f.z });
  area.add(card.group);
  // (the fire watch's red-lens torch: a pool that goes where they go, lit when the mood lights 'torch' lamps)
  const lamp = f.dress === 'watch' ? area.lamp({ x: f.x + 0.3, z: f.z + 0.9, y: 1.0, r: 1.5, core: 0.45, ring: 0.18, kind: 'torch', color: 0xff4a3a }) : null;
  cards.push({ card, spec: f, lamp });
}
const tb = performance.now();
const st = area.buildNow();
const tu = performance.now();
area.upload(stage.renderer);
stage.setArea(area);
const buildMs = { describe: tb - t0, build: tu - tb, upload: performance.now() - tu };

function setMood(name) {
  moodName = name;
  stage.setMood(S.moods[name]);
  if (built.fog && q.get('fog') === null) { fogOn = built.fog(name); fogUpdate(); }
}
stage.look(view.x, view.z);

// The fog of awareness round the first figure, if asked (a stand-in for the sim's perception: near, and a cone ahead).
const fog = createFogMask();
function fogUpdate() {
  if (!fogOn || !cards.length) { stage.setFog(null); return; }
  const f = cards[0].card;
  fog.place(f.x - 24, f.z - 32);
  const sh = built.fogShape ?? { cone: 0.8, reachM: 14, nearM: 2.5 };
  fog.fill((x, z) => { const dx = x - f.x, dz = z - f.z, d = Math.hypot(dx, dz); return [d < sh.nearM || (d < sh.reachM && dz < 0 && Math.abs(Math.atan2(dx, -dz)) < sh.cone) ? 1 : 0, 0]; });
  fog.ease();
  const [tex, x0, z0, w, h] = fog.upload();
  stage.setFog(tex, x0, z0, w, h, stage.mood.dimK);
}
setMood(moodName);
fogUpdate();

const report = { scene: sceneName, view: viewName, ppm: PX_PER_M, zoom, mood: moodName, palette: paletteName, frame: null, calls: null, triangles: 0, cpuMs: 0, gpuMs: null, frameMs: 0, area: null, build: null, bench: null, weather: null };
window.__stage = stage; window.__report = report; window.__ready = false;
window.__scenes = { setMood, area, weather, cards, built, bench };

/** n frames forced to finish (a one-pixel read waits for the GPU): ms a frame, CPU and GPU together. */
function bench(n = 120) {
  const gl = stage.renderer.getContext(), px = new Uint8Array(4);
  frame(0); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const a = performance.now();
  for (let i = 0; i < n; i++) frame(1 / 60);
  gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
  return +((performance.now() - a) / n).toFixed(3);
}

const held = new Set();
addEventListener('keydown', (e) => {
  held.add(e.code);
  const d = e.code.match(/^Digit([1-9])$/);
  if (d && moodNames[Number(d[1]) - 1]) setMood(moodNames[Number(d[1]) - 1]);
  else if (e.code === 'KeyM') setMood(moodNames[(moodNames.indexOf(moodName) + 1) % moodNames.length]);
  else if (e.code === 'KeyW') weatherOn = !weatherOn;
  else if (e.code === 'KeyF') { fogOn = !fogOn; fogUpdate(); }
  else if (e.code === 'KeyS') seeOn = !seeOn;
  else if (e.code === 'KeyO') { outline = !outline; stage.post.U.outline.value = outline ? 1 : 0; }
  else if (e.code === 'KeyP') { const k = Object.keys(PALETTES); paletteName = k[(k.indexOf(paletteName) + 1) % k.length]; stage.setPalette(paletteName); }
  else if (e.code === 'KeyB') report.bench = bench();
});
addEventListener('keyup', (e) => held.delete(e.code));

function frame(dt) {
  clockS += dt;
  const vx = (held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0), vz = (held.has('ArrowDown') ? 1 : 0) - (held.has('ArrowUp') ? 1 : 0);
  if ((vx || vz) && cards.length) { const c = cards[0].card; c.place(c.x + vx * 1.4 * dt, c.z + vz * 1.4 * dt); fogUpdate(); }
  for (const { card, lamp } of cards) if (lamp) { lamp.x = card.x + 0.3; lamp.z = card.z + 0.9; }
  for (const { card } of cards) card.setTint(stage.lightAt(card.x, card.z));
  const f = cards[0]?.card;
  stage.setFocus(seeOn && f ? { x: f.x, z: f.z, h: f.heightM, w: 0.8 } : null);
  weather.set(weatherOn && built.weather ? built.weather(moodName, clockS) : null);
  stage.render();
}

let last = performance.now(), frames = 0, frameMs = 16.7, hudAt = 0;
function loop(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  frameMs += ((now - last) - frameMs) * 0.1; last = now;
  frame(dt);
  frames++;
  if (now - hudAt > 250 || frames < 5) {
    hudAt = now;
    const s = stage.stats, P = area.atlas.pages;
    Object.assign(report, { mood: moodName, palette: paletteName, frame: [s.w, s.h], calls: { ...s.calls }, triangles: s.triangles, cpuMs: +s.cpuMs.toFixed(2), gpuMs: s.gpuMs === null ? null : +s.gpuMs.toFixed(3), frameMs: +frameMs.toFixed(1),
      area: { boxes: st.boxes, quads: st.quads, drawCalls: st.drawCalls, atlas: P.map(p => `${p.w}x${p.h}`), atlasKB: Math.round(st.atlasBytes / 1024), glowMapKB: Math.round(st.glowMapBytes / 1024), paintMs: +st.paintMs.toFixed(1), lamps: area.lamps.length, cards: cards.length },
      build: { describeMs: +buildMs.describe.toFixed(1), buildMs: +buildMs.build.toFixed(1), uploadMs: +buildMs.upload.toFixed(1) },
      weather: weather.active ? { puffs: weather.stats.puffs } : null, programs: s.programs, textures: s.textures, geometries: s.geometries, gpu: s.gpu });
    hud.innerHTML = [
      `<b>OLYMPUS</b> scenes · <b>${S.title}</b> · ${PX_PER_M} px/m · ${s.w}×${s.h}${zoom > 1 ? ` (zoom ${zoom})` : ''} · palette ${paletteName}`,
      `mood <b>${moodNames.indexOf(moodName) + 1} ${moodName}</b> of ${moodNames.length} · draw calls ${s.calls.total} (scene ${s.calls.scene}, post ${s.calls.post}) · ${s.triangles.toLocaleString('en')} triangles`,
      `area: ${st.boxes} boxes, ${st.quads} quads → ${st.drawCalls} batch draw · atlas ${P.map(p => `${p.w}×${p.h}`).join(', ')} (${Math.round(st.atlasBytes / 1024)} KB) · built ${buildMs.build.toFixed(0)} ms (painting ${st.paintMs.toFixed(0)}) · ${area.lamps.length} lamps · ${cards.length} figures`,
      `cpu ${s.cpuMs.toFixed(2)} ms/frame · frame ${frameMs.toFixed(1)} ms${s.gpuMs !== null ? ` · gpu ${s.gpuMs.toFixed(2)} ms` : ''}${report.bench ? ` · bench ${report.bench} ms` : ''}${weather.active ? ` · weather (${weather.stats.puffs} puffs)` : ''}`,
      `1–${moodNames.length} mood · M next · W weather · F fog · S see-through · P palette · O outline · B bench · arrows move`,
    ].join('\n');
  }
  if (frames === 3) {
    if (q.get('bench') === '1') report.bench = bench();
    requestAnimationFrame(() => { window.__ready = true; });
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
