// OLYMPUS: the game in the browser. Wires the engine core (src/core) and the sim (src/sim) to the page:
// the loop, the keys and the mouse, the saves, the pixel stage and the game view, the HUD, the cards,
// the sound, the title, the bench and the debug handle.
//
// The loop (src/core/loop.js): real time accumulates and the sim steps in fixed 50 ms ticks while
// nothing pauses it (Space, an open card, a hidden tab, an area's cut); the picture draws every frame
// between the last two ticks. One game second per real second; time moves faster only through an
// activity that takes time (a skip: R twice waits fifteen minutes where no door is at hand), and in debug
// mode through $ (an hour) and ^ (fifteen minutes), AZERTY's labels of the codes BracketRight and
// BracketLeft (] and [ on QWERTY), queued as the actions debug:skip:<ms> (the honesty mark is the
// sim's) and listed on the keys card in debug mode. The sim is src/sim/game.js createSim(): its
// twelve fast layers and its slow layer registered on the loop; this file holds no game rules.
//
// A new career (the title's New career, then Standard or Ironman) starts the barracks scenario at
// START_MS, Monday, Sol 590 of MY 211, 12:39:34 Melas time (CONTRACTS §2, §3): the player in Echo
// Company's barracks at the foot of their rack in bay-2-1, the 1st Squad at their racks. ?play=
// sandbox is still v0.0.2's test rooms; ?play=barracks&hour=23&seed=48213 the barracks at 23:00, and
// &area=<id>&at=<x>,<z>&face=<f> a start elsewhere (a shot of the street at dawn: &area=melas.ground
// &at=522,224).
//
// Areas (PLACES's portals, the build sheet 0.0.3 §2.1, §2.4). Launching a state (new, loaded or
// imported: launch()) sets the loop's state at once, so the debug handle's start(json) then step(n)
// acts on it, and holds the pause reason 'cut' while the view builds the live area (at most
// CUT_MAX_MS, then what is ready shows) and the player's figure. When the sim moves the player
// through a portal it emits area-enter, and the same cut is held while view.setArea() shows the new
// area (from the view's cache at once when it was prepared; a ground's chunks round where you stand
// built before the cut lifts, so none pops in). After each cut the areas the live
// area's portals and stairs lead to are prepared one at a time while play runs (view.prepare: the
// ground and both of Echo's floors stay built), so the next door is a cut of a frame or two.
//
// The picture (src/render): the stage (stage.js, three.js, the area's palette), the game view
// (view.js: the live area built by the paint worker, the people from state.actors, the camera that
// follows you), the paint worker (painter.js, src/art/worker.js) and the upload queue (uploads.js).
// The shader programs are compiled at boot behind the title (warm.js).
//
// The HUD (src/ui/hud, VIEWS §7): DOM over the canvas in VIEWS §7.5's reserved rectangles (layout.js,
// --ui by the window): the wrist terminal's watch top right (watch.js: Melas time large, the weekday
// and the sol, UTC on its second line, the place), the log's last lines top left (toasts.js), the
// instinct's line bottom centre with R's offer (offer.js: "R open the door" when a door is in reach,
// else "R wait 15 min", and "R again: wait 15 min" for HAND_AGAIN_MS after a first R there), "? keys" bottom right, PAUSED at the top centre. A card (Esc the menu, ?
// the keys, J the log, the bench's result) pauses and hides the HUD under it.
//
// The sound (src/ui/audio, VIEWS §11): the context is made at boot, suspended (it plays nothing before
// the first key or click: the browsers' autoplay rule), and the first key or click resumes it; then footsteps on the surface under the feet at the gait's foot-falls, and the
// doors' leaves from the sim's door facts, all synthesised by code. The master volume and mute are in
// the Esc menu and kept in the saved profile (store.js updateProfile: read and written in one transaction).
//
// Saves (TECH §7.4, TIME §13): the sim emits autosave { why } (a skip's end, the sol's start, five
// minutes of live play, an area change, the content edge); one write a frame at most, after the
// frame's ticks; a 'live' or a 'day' one waits for a quiet frame (one tick owed at most, nothing
// held) up to QUIET_WAIT_MS (TECH §7.4: the day slot at the first quiet frame after local 00:00);
// the rest (a skip's end, an area change, the edge) write at once, behind their splash or cut. A new
// career (or an imported file) is written as it launches. On leaving the page and on hiding the tab
// the write is store.autosaveSync's (no read first, every put issued at once and committed, so it
// lands as the page goes); on quitting to the title the ordinary one. ?nostore=1 neither reads nor writes the saves (shots, benches, agents' smoke runs). The menu exports and
// imports save files, and writes a bug report (store.js reportOf: the last autosave as the anchor, or
// the state launched from (new, loaded or imported) before the first; the errors, the renderer, the
// engine, the state now).
//
// The bench (ROADMAP §4.6, TECH §13.4): ?bench=squadbay-night (or ?bench=1) runs src/data/bench.js's
// scene with no saves (src/ui/cards/bench.js): the squad bay at 23:00, its keys held for 20 s, then a
// card with the frame times, draw calls, uploads, the renderer and the screen, and Copy results;
// window.__bench holds the same.
//
// For tests and shots, URL parameters skip the title (src/core/debug.js readParams):
// ?play=sandbox|barracks&seed=<n>&hour=<h>[&mode=ironman][&debug=1][&area=<id>&at=<x>,<z>&face=<f>];
// &ppm=16|24 (the density, 16 by default, the user's pick: src/render/scale.js; 24 a test density);
// &mood=<name> (else the view's by the hour); &fog=1 (the samples'
// test fog); &nostore=1; &perf=1 (the GL counters and the GPU's time by pass, in window.__report).
// window.__olympus is the debug handle; window.__ready turns true once READY_FRAMES frames are drawn
// with nothing pending (the warm-up, the area, the uploads, the player's sheet, the worker), or at
// READY_LIMIT_MS with window.__report.pending saying what still waited.
import { createBus } from './core/bus.js';
import { createLoop } from './core/loop.js';
import { createInput } from './core/input.js';
import { fromJSON, toJSON } from './core/state.js';
import * as store from './core/store.js';
import { createDebugHandle, installDebug, readParams } from './core/debug.js';
import { MIN_MS, HOUR_MS, durationText } from './core/clock.js';
import { utcClockText } from './core/calendar.js';
import { playerActor, setIdsCheck } from './core/ids.js';
import { solText, marsClock } from './sim/time/dates.js';
import { createSim, newGame as freshGame, SCENARIOS } from './sim/game.js';
import { WAIT_MS } from './sim/time/domain.js';
import { areaOf, lonOf } from './sim/places/model.js';
import { lightLevel } from './sim/places/light.js';
import { sunAt } from './sim/places/sun.js';
import { handOffer } from './sim/places/hand.js';
import { eyeOf, sightMask, canSee } from './sim/people/perception.js';
import { BARRACKS } from './sim/scenarios/barracks.js';
import { BENCH_SCENES, BENCH_DEFAULT } from './data/bench.js';
import { createBoot } from './ui/boot.js';
import { applyScale } from './ui/hud/layout.js';
import { createWatch } from './ui/hud/watch.js';
import { createToasts } from './ui/hud/toasts.js';
import { createOffer } from './ui/hud/offer.js';
import { keysRows } from './ui/cards/keys.js';
import { logLines } from './ui/cards/log.js';
import { runBench, benchResult, benchCard } from './ui/cards/bench.js';
import { createAudio } from './ui/audio/engine.js';
import { createStage } from './render/stage.js';
import { createView, CUT_MAX_MS, FOG_CELLS } from './render/view.js';
import { FOG_CELL_M } from './render/fog.js';
import { createPainter } from './render/painter.js';
import { createUploads } from './render/uploads.js';
import { instrumentGL } from './render/stats.js';
import { PX_PER_M } from './render/scale.js';

/** Frames drawn with nothing pending before the page says it is ready; the longest it waits (TECH §13.3). */
export const READY_FRAMES = 3, READY_LIMIT_MS = 10_000;
/** The debug skips, by physical key: ^ and $ on AZERTY ([ and ] on QWERTY), fifteen minutes and an hour. */
const DEBUG_SKIPS = Object.freeze([['BracketLeft', 15 * MIN_MS], ['BracketRight', HOUR_MS]]);
/** How long a 'live' autosave waits for a quiet frame (TECH §7.4). */
export const QUIET_WAIT_MS = 10_000;
/** R's wait asks twice: a second R within this long of the first sends it (ms; places' hand.js says why). */
export const HAND_AGAIN_MS = 2000;
/** The sound's settings are written this long after the last change (ms: a slider sends many). */
export const PROFILE_WRITE_MS = 300;
/** The first ticks after a load: every one lost means the save is damaged (store.js RECOVER_TICKS). */
const RECOVER_TICKS = store.RECOVER_TICKS ?? 20;
const WHY_RANK = { live: 0, skip: 1, area: 1, launch: 1, day: 2, edge: 3 };

const VERSION = (await fetch('VERSION', { cache: 'no-store' }).then(r => (r.ok ? r.text() : '?')).catch(() => '?')).trim() || '?';
store.setVersion(VERSION);
const params = readParams();
const readLocal = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const benchName = params.bench ? (params.bench === '1' ? BENCH_DEFAULT : params.bench) : null;
const settings = {
  debug: params.debug || readLocal('olympus.debug') === '1',
  nostore: !!params.nostore || !!benchName, perf: !!params.perf, fog: !!params.fog,
  mood: params.mood || null,
};
// (debug mode: an id map's cached sorted order checked against a fresh sort every 64th call, TECH §2.3.1)
if (settings.debug) setIdsCheck(64);

// ---- the page ----
const el = (tag, props = {}, ...kids) => { const n = Object.assign(document.createElement(tag), props); n.append(...kids.filter(Boolean)); return n; };
applyScale();
const banner = el('div', { className: 'banner', hidden: true });
const keysHint = el('div', { className: 'keyshint' });
const hud = el('div', { id: 'hud', hidden: true });
const frameEl = el('div', { id: 'frame' });
document.body.append(frameEl);

// ---- the stage, the view and the painting ----
const stage = createStage({ parent: frameEl, palette: 'mars' });
frameEl.append(hud);
const watch = createWatch(hud);
hud.append(banner);
const gl = stage.renderer.getContext();
window.__renderer = stage.stats.gpu;
const counters = settings.perf || settings.debug || benchName ? instrumentGL(gl) : null;
const painter = createPainter();
const uploads = createUploads();
const view = createView({ stage, painter, uploads });
if (settings.mood) view.setMood(settings.mood);
if (settings.fog) view.setFog(true);
view.warm();

// ---- the engine ----
const bus = createBus({ onError: (e, type) => broke(e, `a listener of '${type}'`) });
let loop = null, sim = null;
// (the game owns Tab, Space and the move keys only in play with no card up: on the title they move focus and press buttons)
const input = createInput({ accept: (action) => !!loop?.state && !loop.paused && (action !== 'hand' || handKey()), swallow: () => !!loop?.state && !boot?.card && !boot?.page });
// (R: a door at hand goes at once; the wait asks for a second R within HAND_AGAIN_MS, "R again: wait 15
// min", so R a step short of a door, or just past one, never waits by accident. Either goes as what the
// offer said when the key went down, { want }, and the sim drops it if the offer has changed kind by its
// tick: places' hand.js. Returns false: the act is queued here, with its want)
let handArmedAt = null;
function handKey() {
  let o = null;
  try { o = handOffer(loop.state); } catch { o = null; }
  if (!o) return false;
  const now = performance.now();
  if (o.verb !== 'wait') { handArmedAt = null; input.queue({ act: 'hand', args: { want: 'door' } }); return false; }
  if (handArmedAt !== null && now - handArmedAt <= HAND_AGAIN_MS) { handArmedAt = null; input.queue({ act: 'hand', args: { want: 'wait' } }); return false; }
  handArmedAt = now;
  return false;
}
const fitInput = () => input.setStage(stage.canvas, stage.W, stage.H);
fitInput();
addEventListener('resize', fitInput);
// (every error is told; sim.noteError writes only a tick's or a skip's into the state: a render's never touches it, TECH §3.7)
loop = createLoop({ render, poll: () => input.snapshot(), bus, onError: (e, where) => { try { sim?.noteError(loop.state, e, where); } catch { /* (an error note that fails mustn't stop the game) */ } broke(e, where); } });
sim = createSim({ loop, bus });
const offer = createOffer(hud, { label: (a) => input.label(a) });
hud.append(keysHint);
keysHint.append(el('kbd', { textContent: input.label('help') }), ' keys');

// ---- the sound: made at boot, suspended; nothing plays before the first key or click ----
const audio = createAudio({ profile: null });
// (the context's construction opens the device synchronously, over 200 ms: paid here behind the title, never on the first key)
try { audio.prepare(); } catch (e) { console.warn('the sound was not prepared', e); }
// (the saved volume and mute; ?nostore=1 neither reads nor writes the database, so a bench or a shot opens none)
if (!settings.nostore) {
  store.getProfile().then((p) => {
    if (p?.audio) { audio.setVolume(p.audio.volume ?? audio.volume); audio.setMuted(!!p.audio.muted); }
  }).catch(() => {});
}
const wake = () => { audio.start(); removeEventListener('keydown', wake, true); removeEventListener('pointerdown', wake, true); };
addEventListener('keydown', wake, true);
addEventListener('pointerdown', wake, true);
let profileTimer = null;
function keepSound() {
  if (settings.nostore) return;
  clearTimeout(profileTimer);
  profileTimer = setTimeout(() => {
    store.updateProfile(p => ({ ...p, audio: { volume: audio.volume, muted: audio.muted } })).catch(e => console.warn('the sound settings were not saved', e));
  }, PROFILE_WRITE_MS);
}

const releases = new Map();                                          // (a pause reason held for each open card)
const boot = createBoot({ cb: {
  newCareer: (mode) => launch(newGame({ mode })),
  continueFrom: (slot) => continueFrom(slot),
  loadFile: async () => {
    const text = await store.importFile();
    if (!text) return;
    try { launch(store.markImported(fromJSON(text))); } catch (e) { toast(`That file won't load: ${e.message}.`, 'bad'); }
  },
  saveFile: () => { if (loop.state) toast(`Saved to ${store.exportFile(loop.state)}.`); },
  report: () => reportProblem(),
  resume: () => loop.pause(false, 'player'),
  quit: () => quitToTitle(),
  overlay: (name, open) => {
    if (open) releases.set(name, loop.pauseFor(`overlay:${name}`));
    else { releases.get(name)?.(); releases.delete(name); }
    // (a card shows alone: the HUD and the toasts hidden under it at once, VIEWS §7.5; the frame keeps them so)
    hud.hidden = !!open || !loop.state;
    toasts.el.hidden = !!open;
  },
  keysRows: () => keysRows({
    label: (a) => input.label(a),
    // (R's words in this build, from the sim's own number)
    says: { hand: `what's at hand: a door, else wait ${durationText(WAIT_MS)} (R twice)` },
    extra: settings.debug ? DEBUG_SKIPS.map(([code, ms]) => [input.label(code), `debug: ${durationText(ms)} pass (marks the save)`]) : [],
  }),
  logLines: () => logLines(loop.state, { lonEDeg: lonAt(loop.state) }),
  sound: () => ({ volume: audio.volume, muted: audio.muted }),
  volume: (v) => { audio.setVolume(v); keepSound(); },
  mute: (on) => { audio.setMuted(on); keepSound(); },
} });
const toasts = createToasts(document.body);

function randomSeed() { return crypto.getRandomValues(new Uint32Array(1))[0]; }

/**
 * A new career's state: { seed, mode, scenario ('barracks', a career's; 'sandbox' the test rooms), hour (the Mars
 * local hour at the live site to start at), at ({ area, x, z, face }: somewhere else than the scenario's start) }.
 */
function newGame({ seed = randomSeed(), mode = 'standard', scenario = 'barracks', hour = null, at = null } = {}) {
  if (!SCENARIOS[scenario]) throw new Error(`no scenario '${scenario}'`);
  return freshGame({ seed, mode, scenario, hour, at, version: VERSION });
}
/** The URL's start somewhere else (&area=, &at=, &face=), or null: an area alone starts at its spawn. */
function atParam(scenario) {
  const areaId = params.area ?? (params.at && scenario === 'barracks' ? BARRACKS.area : null);
  if (!areaId) return null;
  const spawn = areaOf(areaId)?.spawn ?? null, [x, z] = params.at ?? (spawn ? [spawn.x, spawn.z] : [null, null]);
  if (x === null) return null;
  return { area: areaId, x, z, face: params.face ?? spawn?.face ?? 'down' };
}

// ---- launching: the state at once, the area behind a cut ----
let cutHeld = 0, launched = null, anchor = null;                    // (anchor: the report's, { json, seq })
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const liveArea = (s) => { const id = s?.places?.live?.area; try { return id ? areaOf(id) : null; } catch { return null; } };
// (where the player stands: a ground's chunks are built round it before the cut lifts)
const meAt = (s) => { const a = s ? playerActor(s) : null; return a ? { x: a.x, z: a.z } : null; };

/** Hold the cut while work runs (at most CUT_MAX_MS): resolves with the cut's real ms once it lifts. */
function holdCut(work, what) {
  const release = loop.pauseFor('cut');
  cutHeld++;
  const t0 = performance.now();
  return Promise.race([work, sleep(CUT_MAX_MS)])
    .catch((e) => broke(e, 'the area'))
    .then(() => {
      release(); cutHeld--;
      const ms = Math.round(performance.now() - t0);
      report.cutMs = ms;
      report.cuts.push({ area: what, ms });
      if (report.cuts.length > 16) report.cuts.shift();
      return ms;
    });
}

/** Play a state from here (new, loaded or imported). Resolves with it once its area shows (or the cut gives up). */
function launch(s, { from = null } = {}) {
  boot.closeCard();
  boot.hideTitle();
  input.clear();
  toasts.clear();
  loop.setState(s);
  loop.pause(false, 'player');
  hud.hidden = false;
  launched = { from, ticks: loop.stats.ticks, lost: loop.stats.lostTicks, checked: false };
  anchor = { json: toJSON(s), seq: s.clock.seq ?? null };            // (the state played from is the report's first anchor, until an autosave)
  // (a new career, or an imported file, is saved at once, so a reload's Continue finds it: v0.0.3's
  // first build wrote nothing until the first autosave, five minutes of play or a door away)
  if (!from) autosaveNow('launch');
  const area = liveArea(s);
  if (!area) return Promise.resolve(s);
  return holdCut(Promise.all([view.setArea(area, meAt(s)), view.prepareOwn(s)]), area.id).then(() => { prepareAround(area); return s; });
}

// (the sim moved the player into another area: the cut while the view shows it and paints the people met
// there for the first time, so nobody pops in once it lifts; then its neighbours prepared). The fact comes
// in the tick's player layer, before the actors layer makes the new area's people (people's syncActors),
// so their figures are asked for once the tick is over (a microtask: after the frame's ticks)
bus.on('area-enter', ({ area: id } = {}) => {
  const area = areaOf(id);
  if (!area || !loop.state) return;
  // (a move within the area shown, a debug go: nothing to cut to, and a cut would wait behind the areas being prepared)
  if (view.area?.id === id) return;
  const people = Promise.resolve().then(() => (loop.state ? view.prepareOwn(loop.state) : null));
  holdCut(Promise.all([view.setArea(area, meAt(loop.state)), people]), area.id).then(() => prepareAround(area));
});

// (the areas a portal or a stair leads to from here, built into the view's cache one at a time while play runs)
let preparing = Promise.resolve();
function prepareAround(area) {
  const next = new Set();
  for (const p of area.portals ?? []) if (p.to?.area) next.add(p.to.area);
  for (const l of area.links ?? []) for (const st of l.stops ?? []) if (st.area) next.add(st.area);
  next.delete(area.id);
  for (const id of [...next].sort()) {
    const a = areaOf(id);
    if (a && view.prepare) preparing = preparing.then(() => view.prepare(a)).catch((e) => console.warn(`view: '${id}' was not prepared`, e));
  }
  return preparing;
}

async function continueFrom(slot) {
  try { await launch(await store.load(slot), { from: slot }); }
  catch (e) {
    if (e?.code === 'damaged') {
      try { const { state, from } = await store.recover(slot); toast(`That save is damaged: ${from} instead.`, 'warn'); await launch(state, { from }); return; }
      catch (e2) { toast(`That save is damaged, and nothing stands in for it (${e2.message}).`, 'bad'); return; }
    }
    toast(e?.code === 'missing' ? 'That save is gone.' : `That save won't load: ${e?.message}.`, 'bad');
  }
}

async function quitToTitle() {
  await autosaveNow('live');
  loop.setState(null);
  await showTitle();
}

async function showTitle() {
  hud.hidden = true;
  let saves = [];
  if (!settings.nostore) { try { saves = await store.list(); } catch (e) { console.warn('the save list did not load', e); } }
  boot.showTitle({ version: VERSION, saves });
}

// ---- saves ----
const lonAt = (s) => { try { return lonOf(s); } catch { return 0; } };
/** The line a save shows in the lists: 'Standard · Sol 590 MY 211 · 12:44 · 02:24Z · Echo Company barracks, ground floor'. */
function about(s) {
  const lon = lonAt(s), c = marsClock(s.clock.ms, lon), pad = (n) => String(n).padStart(2, '0');
  return [s.meta.mode === 'ironman' ? 'Ironman' : 'Standard', `Sol ${c.solOfYear} MY ${c.my}`, `${pad(c.hour)}:${pad(c.minute)}`, `${utcClockText(s.clock.ms)}Z`, liveArea(s)?.name ?? '?'].join(' · ');
}
let saving = null, due = null;
async function autosaveNow(why = 'live') {
  const s = loop.state;
  if (!s) return null;
  anchor = { json: toJSON(s), seq: s.clock.seq ?? null };            // (the report's anchor: the last autosave, written or not)
  if (settings.nostore) return null;
  if (saving) await saving;                                          // (one write at a time)
  saving = store.autosave(s, about(s), { why }).catch(e => { console.warn('autosave failed', e); return null; }).finally(() => { saving = null; });
  return saving;
}
bus.on('autosave', ({ why = 'live' } = {}) => {
  if (!due || (WHY_RANK[why] ?? 1) > (WHY_RANK[due.why] ?? 1)) due = { why, at: due?.at ?? performance.now() };
});
// (after the frame's ticks: one write a frame at most; a live one waits for a quiet frame)
// (a 'live' or 'day' one waits for a quiet frame: TECH §7.4 writes the day slot "at the first quiet frame after local 00:00")
const WAITS_QUIET = new Set(['live', 'day']);
function autosaveDue(info) {
  if (!due || !loop.state || saving) return;
  const quiet = (info.ticks ?? 0) <= 1 && !info.held;
  if (!WAITS_QUIET.has(due.why) || quiet || performance.now() - due.at >= QUIET_WAIT_MS) { const why = due.why; due = null; autosaveNow(why); }
}
// (what is said: the sim's log records and lines, and the page's own, as toasts)
// (a debug skip says so in its own log line, '[debug] skipped 1 h', the honesty mark's: its end gives no
// second toast, so six $ presses on a morning walk are six lines, not twelve)
let debugSkip = false;
bus.on('log', ({ entry } = {}) => { if (entry?.kind === 'debug' && /skipped/.test(entry.text ?? '')) debugSkip = true; if (entry?.text) toast(entry.text, entry.tone); });
bus.on('line', ({ text, kind = '' }) => toast(text, kind));
bus.on('skip-end', (e) => {
  if (debugSkip) { debugSkip = false; return; }
  if (e.toMs > e.fromMs) toast(`${durationText(e.toMs - e.fromMs)} pass (${e.minutes ?? Math.floor((e.toMs - e.fromMs) / MIN_MS)} minutes stepped).`);
});
bus.on('door', (f) => { try { audio.door(f, loop.state); } catch (e) { broke(e, 'the sound'); } });

/** The bug report (store.js reportOf, TECH §7.6), the menu's and the debug handle's alike: the anchor, the errors, the stats, the renderer, the engine, the screen, the density. */
async function buildReport() {
  const s = loop.state;
  if (!s) return null;
  // (the sim's errors are in the state; the page's (a render's, a listener's) only in told: both go)
  const pageErrors = [...told].map(m => String(m).split('\n')[0]).filter(m => !(s.meta.errors ?? []).some(e => e.endsWith(`: ${m}`)));
  return store.reportOf(s, {
    anchor: anchor?.json ?? null, anchorSeq: anchor?.seq ?? null, errors: [...(s.meta.errors ?? []), ...pageErrors.map(m => `page: ${m}`)],
    stats: { view: view.stats, loop: { ...loop.stats }, sim: { ...sim.stats }, painter: painter.stats, uploads: uploads.stats, audio: { ...audio.stats } },
    renderer: stage.stats.gpu, screen: { w: innerWidth, h: innerHeight, dpr: devicePixelRatio, picture: [stage.W, stage.H] }, ppm: PX_PER_M,
    engine: await store.engineInfo().catch(() => null),
  });
}
async function reportProblem() {
  const r = await buildReport();
  if (r) toast(`Report written to ${store.exportReport(r)}: send it with what you saw.`);
}

// ---- what is said: lines at the top left, 16 s of play each, three at most (src/ui/hud/toasts.js) ----
const TONES = { '': 'note', note: 'note', warn: 'warn', bad: 'bad', urgent: 'urgent', calm: 'calm' };
function toast(text, kind = '') { return toasts.push(text, TONES[kind] ?? 'note'); }
// (an error in a tick, a frame or a listener: told once, the game carries on; Esc, then Report a problem)
const told = new Set();
function broke(e, where = 'tick') {
  console.error(`OLYMPUS: ${where} broke`, e);
  if (told.has(e?.message)) return;
  told.add(e?.message);
  toast(`Something in the game broke (${e?.message}). It carries on; Esc, then Report a problem, to send it.`, 'bad');
}

// ---- the keys ----
input.onAction((action, kind) => {
  if (!loop.state) { if (action === 'menu') boot.back(); return; }  // (the title's pages: Esc goes back)
  if (boot.card) {                                                   // (a card is open: its keys)
    const own = (action === 'help' && boot.card === 'keys') || (action === 'log' && boot.card === 'log');
    if (action === 'menu' || own) { const was = boot.card; boot.closeCard(); if (was === 'menu') loop.pause(false, 'player'); }
    else if (kind === 'digit') boot.digit(Number(action.slice(6)));
    return;
  }
  if (action === 'pause') loop.togglePause('player');
  else if (action === 'menu') boot.openMenu();
  else if (action === 'help') boot.openKeys();
  else if (action === 'log') boot.openLog();
});
addEventListener('keydown', (e) => {                                 // (debug mode: the clock moves on, through the sim)
  if (!settings.debug || !loop.state || loop.paused || e.repeat) return;
  for (const [code, ms] of DEBUG_SKIPS) if (e.code === code) input.queue(`debug:skip:${ms}`);
});
// (leaving the page: written at once, with no read first, so it lands as the page goes: store.autosaveSync)
function leaveSave() {
  const s = loop.state;
  if (!s) return;
  anchor = { json: toJSON(s), seq: s.clock.seq ?? null };
  if (settings.nostore) return;
  try { store.autosaveSync(s, about(s), { why: 'live' }); } catch (e) { console.warn('the autosave on leaving failed', e); }
}
addEventListener('pagehide', leaveSave);
document.addEventListener('visibilitychange', () => { if (document.hidden && loop.state) { loop.pause(true, 'player'); leaveSave(); } });

// ---- a frame: the picture, the sound, the HUD, the saves, whether the page is ready ----
const report = { version: VERSION, ppm: PX_PER_M, renderer: stage.stats.gpu, view: view.stats, pending: [], cutMs: null, cuts: [], gl: null, frame: null, painter: painter.stats, uploads: uploads.stats, audio: audio.stats, hud: null };
window.__report = report;
window.__ready = false;
const bootT0 = performance.now();
let quietFrames = 0, lastFrameT = null, benchLead = null;
function render(alpha, s, info) {
  const t = performance.now(), dtMs = lastFrameT === null ? 0 : t - lastFrameT;
  lastFrameT = t;
  const lon = s ? lonAt(s) : 0;
  view.frame(alpha, s, { ...info, lonEDeg: lon, cut: cutHeld > 0 });
  // (the frame's main-thread work: its ticks and the view; the frame clock itself is the browser's)
  report.frame = { ticks: info.ticks ?? 0, tickMs: (info.ticks ?? 0) * (loop.stats.tickMs ?? 0), viewMs: view.stats.viewMs };
  counters && (report.gl = { last: counters.frame(), max: counters.max, total: { bytes: counters.total.bytes, uploads: counters.total.uploads, links: counters.total.links, compiles: counters.total.compiles } });
  const uiT0 = performance.now();
  if (s) { try { audio.frame(s, alpha, t / 1000); } catch (e) { broke(e, 'the sound'); } }
  autosaveDue(info);
  if (s && launched && !launched.checked && loop.stats.ticks - launched.ticks >= RECOVER_TICKS) {
    launched.checked = true;
    if (launched.from && loop.stats.lostTicks - launched.lost >= RECOVER_TICKS) { const from = launched.from; launched = null; recoverBroken(from); }
  }
  // (the page is ready once a few frames have gone with nothing pending)
  if (!window.__ready) {
    const idle = view.idle && !cutHeld;
    quietFrames = idle ? quietFrames + 1 : 0;
    report.pending = view.pending.concat(cutHeld ? ['cut'] : []);
    if (quietFrames >= READY_FRAMES || performance.now() - bootT0 >= READY_LIMIT_MS) window.__ready = true;
  }
  // (the toasts' 16 s run while the game does: not under a card, not paused; on the title, always)
  toasts.frame(dtMs, !s || (!info.paused && !boot.card));
  toasts.el.hidden = !!boot.card;
  if (!s) return;
  // (a card shows alone: the HUD is hidden under it, VIEWS §7.5)
  hud.hidden = !!boot.card;
  if (hud.hidden) return;
  const faces = watch.update(s);
  const showBanner = info.paused && !cutHeld;
  banner.hidden = !showBanner;
  if (showBanner) {
    const text = `PAUSED|${input.label('pause')} to carry on`;
    if (banner.dataset.text !== text) { banner.dataset.text = text; const [a, b] = text.split('|'); banner.replaceChildren(a, el('small', { textContent: b })); }
  }
  let hand = null;
  try { hand = info.paused || cutHeld ? null : handOffer(s); } catch (e) { broke(e, 'the offer'); }
  // (R pressed once where it would wait: the line asks for it again, for HAND_AGAIN_MS)
  if (handArmedAt !== null && (performance.now() - handArmedAt > HAND_AGAIN_MS || hand?.verb !== 'wait')) handArmedAt = null;
  if (hand?.verb === 'wait' && handArmedAt !== null) hand = { ...hand, label: `again: ${hand.label}` };
  const lead = benchLead ?? (info.held && !s.skip ? 'Time stands still: a digit to choose.' : null);
  const line = offer.update({ lead, offer: hand });
  report.hud = { watch: faces, offer: line, toasts: toasts.lines };
  // (the HUD's and the sound's share of the frame: CONTRACTS §7's UI DOM budget is 1 ms)
  report.frame.uiMs = performance.now() - uiT0;
}
// (every one of a loaded save's first ticks lost: it is damaged; what stands in for it is loaded)
async function recoverBroken(slot) {
  try { const { state, from } = await store.recover(slot); toast(`That save is damaged: ${from} instead.`, 'warn'); await launch(state, { from }); }
  catch (e) { toast(`That save is damaged, and nothing stands in for it (${e.message}).`, 'bad'); }
}

// ---- the bench: a scene for a fixed time, its numbers on a card to copy ----
async function bench(name) {
  const scene = BENCH_SCENES[name];
  if (!scene || !SCENARIOS[scene.play]) { toast(`No bench scene '${name}': the title instead.`, 'warn'); await showTitle(); return null; }
  await launch(newGame({ seed: scene.seed, scenario: scene.play, hour: scene.hour, at: scene.at }));
  while (!window.__ready) await sleep(50);
  const me = () => { const a = playerActor(loop.state); return a ? { x: a.x, z: a.z } : null; };
  const run = await runBench({
    scene, keys: input.keys, where: me,
    sample: () => ({ calls: view.stats.calls, triangles: view.stats.triangles, programs: view.stats.programs, viewMs: view.stats.viewMs, ticks: report.frame?.ticks ?? 0, tickMs: report.frame?.tickMs ?? 0, bytes: report.gl?.last?.bytes ?? 0 }),
    onLeft: (left) => { benchLead = `Bench: ${name}, ${left} s left`; },
  });
  benchLead = null;
  const result = benchResult(run, {
    name, version: VERSION, ppm: PX_PER_M, renderer: stage.stats.gpu, dpr: devicePixelRatio, window: [innerWidth, innerHeight], picture: [stage.W, stage.H], threads: navigator.hardwareConcurrency ?? null,
  });
  window.__bench = result;
  boot.openCard('bench', benchCard(result, { onCopy: copyText, onAgain: () => location.reload() }));
  return result;
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* (no clipboard permission: the old way) */ }
  try {
    const ta = el('textarea', { value: text });
    document.body.append(ta); ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch { return false; }
}

// ---- the debug handle, and the way in ----
const nameOf = (p) => (typeof p?.name === 'string' ? p.name : p?.name ? [p.name.given, p.name.nick ? `'${p.name.nick}'` : null, p.name.family].filter(Boolean).join(' ') : null);
const handleMore = {
  /** The live area's id. */
  get area() { return loop.state?.places?.live?.area ?? null; },
  /** A debug move (debug:go, marking the save): to (x, z) in an area, facing face. */
  go(area, x, z, face = null) { return this.act(`debug:go:${area}:${x}:${z}${face ? `:${face}` : ''}`); },
  /** A door opened or closed by the places' door action. */
  door(id, to) { return this.act({ act: 'door', args: { id, to } }); },
  /** Each actor of the live area: who, where, posture, outfit, and whether you see them. */
  actors() {
    const s = loop.state, me = s ? playerActor(s) : null;
    if (!s) return [];
    return (s.actors?.list ?? []).map(a => {
      let seen = a === me;
      if (!seen && me) { try { seen = canSee(s, me, a); } catch { seen = null; } }
      return { id: a.id, who: a.who, name: nameOf(s.people?.[a.who]), x: a.x, z: a.z, y: a.y ?? 0, face: a.face, gait: a.gait, posture: a.posture ?? 'stand', outfit: a.outfit ?? 'utilities', curtain: !!a.curtain, spotId: a.spotId ?? null, seen };
    });
  },
  /** The light at (x, z) in the live area now (places' lightLevel). */
  light(x, z) { const s = loop.state; return s ? lightLevel(s, x, z, s.clock.ms) : null; },
  /** The sun at the live site now (sunAt). */
  sun() { const s = loop.state; return s?.places?.live ? sunAt(s.places.live.site, s.clock.ms) : null; },
  /** People's sight mask for the player now, over the view's fog window (or the area round you): { x0, z0, nx, nz, cellM, vis: [] }. */
  sightMask(win = null) {
    const s = loop.state, me = s ? playerActor(s) : null;
    if (!me) return null;
    const f = win ?? view.fog ?? null, cellM = f?.cellM ?? FOG_CELL_M;
    const x0 = f?.x0 ?? Math.floor((me.x - 24) / cellM) * cellM, z0 = f?.z0 ?? Math.floor((me.z - 16) / cellM) * cellM;
    const nx = f?.nx ?? FOG_CELLS[0], nz = f?.nz ?? FOG_CELLS[1];
    const mask = sightMask(s, eyeOf(s, me), { x0, z0, nx, nz, cellM, vis: new Float32Array(nx * nz) });
    return { x0: mask.x0, z0: mask.z0, nx: mask.nx, nz: mask.nz, cellM: mask.cellM ?? cellM, vis: Array.from(mask.vis) };
  },
  /** R's offer now (places' handOffer). */
  offer() { const s = loop.state; return s ? handOffer(s) : null; },
  /** The sound's numbers (src/ui/audio/engine.js stats), and its master gain as the graph has it. */
  get audio() { return { ...audio.stats, masterGain: audio.masterGain, contextState: audio.context?.state ?? 'none' }; },
  /** The HUD's lines now: the watch's faces, the instinct's line, the toasts. */
  get hud() { return report.hud; },
};
installDebug(createDebugHandle({ loop, sim, start: launch, newGame, version: VERSION, store, bus, about, view, solText, report: buildReport, queue: (a) => input.queue(a), more: handleMore }));
loop.start();
if (benchName) await bench(benchName).catch((e) => broke(e, 'the bench'));
else if (params.play) {
  if (SCENARIOS[params.play]) launch(newGame({ seed: params.seed ?? 1, scenario: params.play, mode: params.mode, hour: params.hour, at: atParam(params.play) }));
  else { toast(`No scenario '${params.play}': the title instead.`, 'warn'); await showTitle(); }
} else await showTitle();
