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
// and the sol, UTC on its second line, the place, the body strip folded in: only the needs that have
// left fine, strip.js), the log's last lines top left (toasts.js), the instinct's line bottom centre
// (instinct.js: SKILLS' line with its tone and T's keycap, its chip on T held, then R's offer as a
// chip, offer.js: "R shower · 10 min, done 19:41", "R open the door", else "R wait 15 min", and "R
// again: wait 15 min" for HAND_AGAIN_MS after a first R there), "? keys" bottom right, PAUSED at the
// top centre. A card (Esc the menu, ? the keys, J the log, C PERSONNEL, R held the choices, the late
// card, a scene's end and score cards, the bench's result) pauses and hides the HUD under it.
//
// R and T are press keys (core/keys.js): tapped they act on the key going up, held 220 ms they act
// then (the build sheet 0.0.4 §2.4). R tapped sends what its offer said when the key went down (a door,
// an activity, getting up, the resume, the wait asked twice); held at an offer with more, the choices
// card (cards/choose.js); an offer that would make you late for a call opens the late card
// (cards/late.js: fit it in, do it anyway, not now) instead. T tapped sends the line shown when the key
// went down ({ act: 'instinct', args: { id, act } }: the sim does it only if that rule still fires),
// T held the chip's.
//
// The splash (src/ui/hud/splash.js; TIME §6, VIEWS §5): on 'skip-start' the controller plans the
// splash and holds the sim's target at its start; each frame it moves the target along TIME's ease
// (loop.skipTarget), gives the view the splash frame (info.splash: the zoom, the iris, the shown
// clock, the vignette's part) and from the landing to the end of the zoom out holds the pause reason
// 'splash' (PAUSED never shows for it). The splash's own HUD (CLOCK, the outcome strip in RADIO, the
// ticker in INSTINCT) shows alone. Its keys: Space, Enter or a click to the end; Backspace stop here
// (skip:stop); Esc the menu, which pauses it; T on the strip's "carry on" one more chunk (skip:chunk).
//
// Test scenes (ROADMAP §2.2; src/data/scenes.js): the title's Tests, or ?play=test-shower and
// ?play=test-night (&seed, &hour to override the scene's), start a scene with no saves; its goal shows
// in the toasts for GOAL_S, and once its endOn fact has come and the splash has played out, the end card
// (Again with the same seed or a new one, Score: the score card, "Copy my scores").
//
// The sound (src/ui/audio, VIEWS §11): the context is made at boot, suspended (it plays nothing before
// the first key or click: the browsers' autoplay rule), and the first key or click resumes it; then footsteps on the surface under the feet at the gait's foot-falls, and the
// doors' leaves from the sim's door facts, the shower's water and the tap while their parts run, the
// flush, the klaxon through the walls, reveille's bugle, the splash's muffle and its ticking watch
// (audio/world.js), all synthesised by code. The master volume and mute are in
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
// ?play=sandbox|barracks|test-shower|test-night&seed=<n>&hour=<h>[&mode=ironman][&debug=1][&area=<id>&at=<x>,<z>&face=<f>];
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
import * as splashTiming from './sim/time/splash.js';
import { ACTIVITIES } from './data/activities.js';
import { SCENES } from './data/scenes.js';
import { instinctNow } from './sim/skills/instinct.js';
import { bodyOf } from './sim/body/body.js';
import { stagesOf, stripOf, wordsOf, cuesOf } from './sim/body/cues.js';
import { lookFor, indoorsNow } from './sim/people/figure.js';
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
import { wantOf } from './ui/hud/offer.js';
import { createInstinct } from './ui/hud/instinct.js';
import { createSplashControl, createSplashHud, splashContext } from './ui/hud/splash.js';
import { keysRows } from './ui/cards/keys.js';
import { logLines } from './ui/cards/log.js';
import { runBench, benchResult, benchCard } from './ui/cards/bench.js';
import { chooseCard } from './ui/cards/choose.js';
import { lateCard } from './ui/cards/late.js';
import { sheetOf, sheetCard } from './ui/cards/sheet.js';
import { endCard } from './ui/cards/end.js';
import { scoreCard, readScores } from './ui/cards/score.js';
import { GOAL_S, END_HOLD_S, endsScene } from './ui/cards/tests.js';
import { createAudio } from './ui/audio/engine.js';
import { doll } from './art/doll/doll.js';
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
const input = createInput({ accept: () => !!loop?.state && !loop.paused && !splash?.active, swallow: () => !!loop?.state && !boot?.card && !boot?.page });
const fitInput = () => input.setStage(stage.canvas, stage.W, stage.H);
fitInput();
addEventListener('resize', fitInput);
// (every error is told; sim.noteError writes only a tick's or a skip's into the state: a render's never touches it, TECH §3.7)
loop = createLoop({ render, poll: () => input.snapshot(), bus, onError: (e, where) => { try { sim?.noteError(loop.state, e, where); } catch { /* (an error note that fails mustn't stop the game) */ } broke(e, where); } });
sim = createSim({ loop, bus });
const label = (a) => input.label(a);
const instinct = createInstinct(hud, { label });
const splashHud = createSplashHud(hud, { label });
// (the splash: TIME's timing driven in real time; the debug skips get the short time-lapse, so six $ presses are not six full splashes: my call)
const splash = createSplashControl({ timing: splashTiming, shortFor: (e) => e.activity === 'idle' });
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
    says: { hand: `what's at hand: an appliance, a door, else wait ${durationText(WAIT_MS)} (R twice); held: the choices` },
    extra: settings.debug ? DEBUG_SKIPS.map(([code, ms]) => [input.label(code), `debug: ${durationText(ms)} pass (marks the save)`]) : [],
  }),
  logLines: () => logLines(loop.state, { lonEDeg: lonAt(loop.state) }),
  scenes: () => Object.values(SCENES),
  playScene: (scene) => playScene(scene),
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

// ---- the test scenes: a goal on arrival, no saves, the end card once the scene's fact has come ----
let scene = null;                                                    // ({ rec: SCENES', seed, ended: false, shown: false } while a scene plays)
const sceneOf = (s) => (s?.meta?.scenario ? Object.values(SCENES).find(x => x.scenario === s.meta.scenario) ?? null : null);
/** Start a scene: a new game of its scenario, at its hour (or the URL's), with the seed given or a new one. */
function playScene(rec, { seed = randomSeed(), hour = null } = {}) {
  return launch(newGame({ seed, scenario: rec.scenario, hour: hour ?? rec.hour ?? null }));
}

/** Play a state from here (new, loaded or imported). Resolves with it once its area shows (or the cut gives up). */
function launch(s, { from = null } = {}) {
  boot.closeCard();
  boot.hideTitle();
  input.clear();
  toasts.clear();
  splash.clear(); splashPause(false);
  handArmedAt = null; handDown = null; tDown = null;
  loop.setState(s);
  loop.pause(false, 'player');
  hud.hidden = false;
  // (a state saved mid-skip: its splash picks up from the clock, over the gap left)
  if (s.skip) splash.start({ id: s.skip.id, activity: s.skip.activity, kind: s.skip.kind, engine: s.skip.engine, fromMs: s.clock.ms, toMs: s.skip.toMs, where: s.skip.where, posture: s.skip.posture, mask: s.skip.mask, spotId: s.skip.spotId ?? null, chunkMs: s.skip.chunkMs ?? 0 }, splashContext(s, s.skip));
  const rec = sceneOf(s);
  scene = rec ? { rec, seed: s.meta.seed, ended: false, shown: false } : null;
  if (rec?.goal) toasts.push(rec.goal, 'calm', { s: GOAL_S });
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
  splash.clear(); splashPause(false); scene = null;
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
  // (the slip as the watch shows it, '24:00 +24': one moment, one number on every screen)
  const hhmm = c.timeslip ? `24:00 +${Math.floor(c.slipMs / MIN_MS)}` : `${pad(c.hour)}:${pad(c.minute)}`;
  return [s.meta.mode === 'ironman' ? 'Ironman' : 'Standard', `Sol ${c.solOfYear} MY ${c.my}`, hhmm, `${utcClockText(s.clock.ms)}Z`, liveArea(s)?.name ?? '?'].join(' · ');
}
let saving = null, due = null;
async function autosaveNow(why = 'live') {
  const s = loop.state;
  if (!s) return null;
  anchor = { json: toJSON(s), seq: s.clock.seq ?? null };            // (the report's anchor: the last autosave, written or not)
  if (settings.nostore || sceneOf(s)) return null;                    // (a test scene saves nothing: the build sheet 0.0.4 §8, item 24)
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
// (in a skip, what the log says waits: the splash's ticker has shown it, so on landing only what came at
// its last second (the cause: the klaxon, reveille) and the activity's own line go up as toasts, not
// taps from four hours ago (the review of v0.0.4); a debug skip's idle line is its '[debug]' line's twin)
let debugSkip = false, heldLog = null;
bus.on('log', ({ entry } = {}) => {
  if (entry?.kind === 'debug' && /skipped/.test(entry.text ?? '')) debugSkip = true;
  if (!entry?.text) return;
  if (loop.state?.skip) { if (entry.kind === 'activity' && debugSkip) return; (heldLog ??= []).push(entry); return; }
  toast(entry.text, entry.tone);
});
bus.on('line', ({ text, kind = '' }) => toast(text, kind));
// (an activity's own log line says what passed; the plain skips, which have none, still say how long)
bus.on('skip-end', (e) => {
  const held = heldLog ?? [];
  heldLog = null;
  for (const entry of held) if (entry.kind === 'activity' || entry.kind === 'debug' || entry.atMs >= e.toMs) toast(entry.text, entry.tone);
  if (debugSkip) { debugSkip = false; return; }
  if (e.toMs > e.fromMs && (!e.activity || e.activity === 'idle' || !ACTIVITIES[e.activity])) toast(`${durationText(e.toMs - e.fromMs)} pass (${e.minutes ?? Math.floor((e.toMs - e.fromMs) / MIN_MS)} minutes stepped).`);
});
bus.on('door', (f) => { try { audio.door(f, loop.state); } catch (e) { broke(e, 'the sound'); } });
// (the splash hears TIME's facts at once: on skip-start the target is held at its start, so the loop's first outcome frame never runs the whole skip)
bus.on('skip-start', (e) => {
  const s = loop.state;
  splash.start(e, splashContext(s, e));
  loop.skipTarget(e.engine === 'ff' ? null : e.fromMs);
});
bus.on('skip-frame', (e) => splash.lines(e.ticker));
bus.on('skip-interrupt', (e) => splash.interrupt(e));
bus.on('skip-end', (e) => splash.end(e));
for (const type of ['body-event', 'reveille']) bus.on(type, (f) => { try { audio.fact(type, f, loop.state); } catch (e) { broke(e, 'the sound'); } });
// (a scene's end: its fact noted, the card once the splash has played out)
for (const type of ['activity', 'alert']) bus.on(type, (f) => { if (scene && !scene.ended && endsScene(scene.rec.endOn, type, f)) scene.ended = true; });

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
// (R: what its offer said when the key went down. A door, an activity, getting up, the resume go on the
// tap (the key going up under TAP_MS); the wait asks for a second R within HAND_AGAIN_MS, "R again: wait
// 15 min", so R a step short of a door, or just past one, never waits by accident. Held TAP_MS at an
// offer with more: the choices card. An offer that would make you late: the late card. The sim drops
// the action if the offer has changed kind by its tick: places' hand.js)
let handArmedAt = null, handDown = null, tDown = null;
const currentOffer = () => { try { return loop.state ? handOffer(loop.state) : null; } catch { return null; } };
const canAct = () => !!loop.state && !loop.paused && !splash.active;
function handPress(kind) {
  if (kind === 'down') { handDown = canAct() ? currentOffer() : null; return; }
  const o = handDown;
  handDown = null;
  if (!o || !canAct()) return;
  if (kind === 'held' && o.more?.length) { openChoices(o); return; }
  if (o.late) { openLate(o, o); return; }
  if (o.verb === 'wait') {
    const now = performance.now();
    if (handArmedAt !== null && now - handArmedAt <= HAND_AGAIN_MS) { handArmedAt = null; input.queue(wantOf(o)); }
    else handArmedAt = now;
    return;
  }
  handArmedAt = null;
  input.queue(wantOf(o));
}
// (T: the line shown when the key went down, tapped; its chip, held)
function instinctPress(kind) {
  if (kind === 'down') { tDown = canAct() ? instinctNow(loop.state) : null; return; }
  const seen = tDown;
  tDown = null;
  if (!canAct()) return;
  if (kind === 'tap') input.queue({ act: 'instinct', args: { id: seen?.line?.id ?? null, act: seen?.line?.act ?? null } });
  else if (kind === 'held' && seen?.chip) input.queue({ act: 'instinct', args: { id: seen.chip.id ?? null, act: seen.chip.act ?? null, chip: true } });
}
// (the splash's keys: Space, Enter or a click to the end; Backspace stop here; T on the strip's "carry on"; Esc the menu)
function splashKey(action, kind) {
  if (action === 'menu') { boot.openMenu(); return; }
  if (action === 'pause') { splash.toEnd(); return; }
  if (action === 'instinct' && kind === 'tap') {
    if (splash.chunk()) input.queue('skip:chunk');                  // (the strip's offer: the pause lets go for the tick that takes it)
    else if (splash.chunkable()) input.queue('skip:chunk');         // (during the lapse: the engine's own chunk)
  }
}
input.onAction((action, kind) => {
  if (!loop.state) { if (action === 'menu') boot.back(); return; }  // (the title's pages: Esc goes back)
  if (boot.card) {                                                   // (a card is open: its keys)
    const own = (action === 'help' && boot.card === 'keys') || (action === 'log' && boot.card === 'log') || (action === 'sheet' && boot.card === 'sheet');
    if (action === 'menu' || own) { const was = boot.card; boot.closeCard(); if (was === 'menu') loop.pause(false, 'player'); if (was === 'score' && scene?.ended) openEnd(); }
    else if (kind === 'digit') boot.digit(Number(action.slice(6)));
    return;
  }
  if (splash.active) { splashKey(action, kind); return; }
  if (action === 'pause') loop.togglePause('player');
  else if (action === 'menu') boot.openMenu();
  else if (action === 'help') boot.openKeys();
  else if (action === 'log') boot.openLog();
  else if (action === 'sheet') openSheet();
  else if (action === 'hand') handPress(kind);
  else if (action === 'instinct') instinctPress(kind);
});
// (in a splash: Enter to the end, Backspace stop here; on the strip any key unbound there closes it, never T or Backspace)
const SPLASH_OWN = new Set(['Space', 'KeyT', 'Backspace', 'Escape', 'Enter', 'NumpadEnter', 'ShiftLeft', 'ShiftRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight', 'ControlLeft', 'ControlRight']);
addEventListener('keydown', (e) => {
  if (!loop.state || !splash.active || boot.card || e.repeat || e.metaKey || e.ctrlKey) return;
  if (e.code === 'Enter' || e.code === 'NumpadEnter') { e.preventDefault(); splash.toEnd(); }
  else if (e.code === 'Backspace') { e.preventDefault(); if (splash.stop()) input.queue('skip:stop'); }
  else if (splash.phase === 'strip' && !SPLASH_OWN.has(e.code)) splash.toEnd();
});
frameEl.addEventListener('pointerdown', () => { if (loop.state && splash.active && !boot.card) splash.toEnd(); });
// (a scene ended, its last picture held: Enter ends it now)
addEventListener('keydown', (e) => {
  if (!loop.state || splash.active || boot.card || e.repeat || !scene?.ended || scene.shown) return;
  if (e.code === 'Enter' || e.code === 'NumpadEnter') { e.preventDefault(); scene.endNow = true; }
});

// ---- the cards of this round: PERSONNEL, the choices, the late card, a scene's end and score ----
const BODY = Object.freeze({ bodyOf, stagesOf, stripOf, wordsOf, cuesOf });
const clockText = (ms) => { const c = marsClock(ms, lonAt(loop.state)); return c.timeslip ? `24:00 +${Math.floor(c.slipMs / MIN_MS)}` : `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}`; };
function openSheet() {
  const s = loop.state, me = s ? playerActor(s) : null, p = s?.people?.[s.player?.id];
  if (!s) return;
  let sheet;
  try { sheet = sheetOf(s, { body: BODY, lonEDeg: lonAt(s), look: p?.look ? lookFor(p.look, me?.outfit ?? 'utilities', indoorsNow(s)) : null }); }
  catch (e) { broke(e, 'the character sheet'); return; }
  boot.openCard('sheet', sheetCard(sheet, { dollOf: (args) => doll(args) }));
}
function openChoices(o) {
  const { body, lines } = chooseCard({ offer: o, onPick: (m) => {
    boot.closeCard();
    if (m.late) { openLate(m, o); return; }
    input.queue({ act: 'activity', args: { id: m.id, spotId: m.spotId ?? o.spotId ?? null, args: m.args ?? {} } });
  } });
  boot.openCard('choose', body, lines);
}
// (what: the choice or the offer, its id, spotId, args, durMs, label and late; o the offer it came from)
function openLate(what, o) {
  const head = String(what.label ?? what.id ?? '').split(' · ')[0];
  const { body, lines } = lateCard({
    what: { label: head, durMs: what.durMs, min: ACTIVITIES[what.id]?.min ?? 0 }, late: what.late, nowMs: loop.state?.clock.ms ?? null, clockText,
    onAnswer: (answer) => {
      boot.closeCard();
      if (answer === 'fit' || answer === 'accepted') input.queue({ act: 'activity', args: { id: what.id, spotId: what.spotId ?? o?.spotId ?? null, args: what.args ?? {}, late: answer } });
    },
  });
  boot.openCard('late', body, lines);
}
function openEnd() {
  if (!scene) return;
  const { rec, seed } = scene;
  const { body, lines } = endCard({ scene: rec, seed, on: {
    again: (same) => playScene(rec, { seed: same ? seed : randomSeed(), hour: params.play === rec.scenario ? params.hour : null }),
    score: () => openScore(),
    title: () => quitToTitle(),
  } });
  boot.openCard('end', body, lines);
}
function openScore() {
  if (!scene) return;
  const { body, lines } = scoreCard({ scene: scene.rec, version: VERSION, seed: scene.seed, onCopy: copyText, onDone: () => openEnd() });
  boot.openCard('score', body, lines);
}

addEventListener('keydown', (e) => {                                 // (debug mode: the clock moves on, through the sim)
  if (!settings.debug || !loop.state || loop.paused || e.repeat) return;
  for (const [code, ms] of DEBUG_SKIPS) if (e.code === code) input.queue(`debug:skip:${ms}`);
});
// (leaving the page: written at once, with no read first, so it lands as the page goes: store.autosaveSync)
function leaveSave() {
  const s = loop.state;
  if (!s) return;
  anchor = { json: toJSON(s), seq: s.clock.seq ?? null };
  if (settings.nostore || sceneOf(s)) return;
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
// (the splash's pause, from the landing to the end of the zoom out; never shown as PAUSED)
let splashRelease = null;
function splashPause(on) {
  if (on && !splashRelease) splashRelease = loop.pauseFor('splash');
  else if (!on && splashRelease) { splashRelease(); splashRelease = null; }
}
// (the strip folded into the watch: BODY's stripOf, read once a game second, kept between)
let stripMemo = { key: null, strip: null };
function stripNow(s) {
  const key = `${s.meta?.seed}|${Math.floor(s.clock.ms / 1000)}|${s.clock.seq}`;
  if (stripMemo.key !== key) {
    let strip = null;
    try { const b = bodyOf(s, s.player?.id); strip = b ? stripOf(b, s.clock.ms) : null; } catch (e) { broke(e, 'the body strip'); }
    stripMemo = { key, strip };
  }
  return stripMemo.strip;
}
function render(alpha, s, info) {
  const t = performance.now(), dtMs = lastFrameT === null ? 0 : t - lastFrameT;
  lastFrameT = t;
  const lon = s ? lonAt(s) : 0;
  // (the splash first: its frame for the view, the sim's next target, its pause. Its real time stands
  // still while a card is up or the tab is hidden: Esc's menu pauses the splash, TIME §6.4)
  let sf = null;
  if (s && splash.active) {
    const frozen = !!boot.card || cutHeld > 0 || loop.pauseReasons.some(r => r !== 'splash');
    try { sf = splash.frame(frozen ? 0 : Math.min(dtMs, 250) / 1000, { clockMs: s.clock.ms, skipToMs: s.skip?.toMs ?? null }); }
    catch (e) { broke(e, 'the splash'); splash.clear(); }
    if (sf && s.skip && sf.target !== null) loop.skipTarget(sf.target);
    splashPause(!!sf?.pause);
  } else {
    splashPause(false);
    if (s?.skip) loop.skipTarget(null);                              // (a skip with no splash to pace it runs on to its end)
  }
  const shown = sf?.done ? null : sf?.view ?? null;
  view.frame(alpha, s, { ...info, lonEDeg: lon, cut: cutHeld > 0, splash: shown });
  // (the frame's main-thread work: its ticks and the view; the frame clock itself is the browser's)
  report.frame = { ticks: info.ticks ?? 0, tickMs: (info.ticks ?? 0) * (loop.stats.tickMs ?? 0), viewMs: view.stats.viewMs, splash: shown ? shown.phase : null };
  counters && (report.gl = { last: counters.frame(), max: counters.max, total: { bytes: counters.total.bytes, uploads: counters.total.uploads, links: counters.total.links, compiles: counters.total.compiles } });
  const uiT0 = performance.now();
  if (s) { try { audio.frame(s, alpha, t / 1000, { splash: shown }); } catch (e) { broke(e, 'the sound'); } }
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
  // (the toasts' 16 s run while the game does: not under a card, not paused, not in a splash; on the title, always)
  toasts.frame(dtMs, !s || (!info.paused && !boot.card && !shown));
  toasts.el.hidden = !!boot.card || !!shown;
  if (!s) return;
  // (a scene's end card, once its fact has come, the splash has played out and END_HOLD_S of live play
  // gone by after it (or Enter), so the scene's last picture is seen: you clean at 19:40, the squad back down)
  if (scene?.ended && !scene.shown && !shown && !boot.card && !cutHeld) {
    if (!info.paused) scene.heldS = (scene.heldS ?? 0) + dtMs / 1000;
    if (scene.heldS >= END_HOLD_S || scene.endNow) { scene.shown = true; openEnd(); }
  }
  // (a card shows alone: the HUD is hidden under it, VIEWS §7.5)
  hud.hidden = !!boot.card;
  if (hud.hidden) return;
  // (a splash: CLOCK, the outcome strip in RADIO, the ticker in INSTINCT; everything else hidden, VIEWS §7.5)
  const inSplash = !!shown;
  watch.el.hidden = inSplash; keysHint.hidden = inSplash;
  const splashText = splashHud.update(shown, { state: s, lonEDeg: lon });
  const faces = inSplash ? null : watch.update(s, { strip: stripNow(s) });
  const showBanner = !inSplash && !cutHeld && loop.pauseReasons.some(r => r !== 'splash' && r !== 'cut');
  banner.hidden = !showBanner;
  if (showBanner) {
    const text = `PAUSED|${input.label('pause')} to carry on`;
    if (banner.dataset.text !== text) { banner.dataset.text = text; const [a, b] = text.split('|'); banner.replaceChildren(a, el('small', { textContent: b })); }
  }
  let hand = null, now = null;
  if (!inSplash) {
    try { hand = info.paused || cutHeld ? null : handOffer(s); } catch (e) { broke(e, 'the offer'); }
    try { now = instinctNow(s); } catch (e) { broke(e, 'the instinct'); }
  }
  // (R pressed once where it would wait: the line asks for it again, for HAND_AGAIN_MS)
  if (handArmedAt !== null && (performance.now() - handArmedAt > HAND_AGAIN_MS || hand?.verb !== 'wait')) handArmedAt = null;
  const lead = benchLead ?? (info.held && !s.skip ? 'Time stands still: a digit to choose.' : scene?.ended && !scene.shown ? 'Enter: end the scene' : null);
  const line = instinct.update({ hidden: inSplash, lead, now, offer: hand, armed: handArmedAt !== null });
  report.hud = { watch: faces, offer: line, line, toasts: toasts.lines, splash: splashText };
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
  // (the scene's keys through the input, so a press key (R at the rack) reaches the page's listeners as a real one would)
  const run = await runBench({
    scene, keys: { down: (code) => input.key(code, true), up: (code) => input.key(code, false) }, where: me,
    sample: () => ({ calls: view.stats.calls, triangles: view.stats.triangles, programs: view.stats.programs, viewMs: view.stats.viewMs, ticks: report.frame?.ticks ?? 0, tickMs: report.frame?.tickMs ?? 0, bytes: report.gl?.last?.bytes ?? 0, splash: report.frame?.splash ?? null }),
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
  /** The HUD's lines now: the watch's faces, the instinct's line, the toasts, the splash's plaque, ticker and strip. */
  get hud() { return report.hud; },
  /** The test scene playing ({ id, seed, ended }), or null. */
  get scene() { return scene ? { id: scene.rec.id, seed: scene.seed, ended: scene.ended, shown: scene.shown } : null; },
  /** The audio's world (the water, the tap, the flush, the klaxon, the bugle, the splash's muffle and ticks). */
  get world() { return { ...audio.stats.world }; },
};
installDebug(createDebugHandle({
  loop, sim, start: launch, newGame, version: VERSION, store, bus, about, view, solText, report: buildReport, queue: (a) => input.queue(a), more: handleMore,
  body: (s) => {
    const b = bodyOf(s, s.player?.id), ms = s.clock.ms;
    return b ? { body: b, stages: stagesOf(b, ms, lonAt(s)), strip: stripOf(b, ms), words: wordsOf(b, ms), cues: cuesOf(b, ms) } : null;
  },
  instinct: (s) => ({ ...instinctNow(s), parts: instinct.parts }),
  splash: () => splash.info,
  scores: () => readScores(),
}));
loop.start();
if (benchName) await bench(benchName).catch((e) => broke(e, 'the bench'));
else if (params.play) {
  const rec = Object.values(SCENES).find(x => x.id === params.play || x.scenario === params.play);
  if (rec && SCENARIOS[rec.scenario]) playScene(rec, { seed: params.seed ?? 48213, hour: params.hour });
  else if (SCENARIOS[params.play]) launch(newGame({ seed: params.seed ?? 1, scenario: params.play, mode: params.mode, hour: params.hour, at: atParam(params.play) }));
  else { toast(`No scenario '${params.play}': the title instead.`, 'warn'); await showTitle(); }
} else await showTitle();
