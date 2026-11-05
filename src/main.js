// OLYMPUS: the game in the browser. Wires the engine core (src/core) and the sim (src/sim) to the page:
// the loop, the keys and the mouse, the saves, the pixel stage and the game view, the title and the
// debug handle.
//
// The loop (src/core/loop.js): real time accumulates and the sim steps in fixed 50 ms ticks while
// nothing pauses it (Space, an open card, a hidden tab, an area's cut); the picture draws every frame
// between the last two ticks. One game second per real second; time moves faster only through an
// activity that takes time (a skip: R waits fifteen minutes this round), and in debug mode through $
// (an hour) and ^ (fifteen minutes), AZERTY's labels of the codes BracketRight and BracketLeft (] and
// [ on QWERTY), queued as the actions debug:skip:<ms> (the honesty mark is the sim's) and listed on
// the keys card in debug mode. The sim is src/sim/game.js createSim(): its twelve fast layers and its slow layer registered
// on the loop; this file holds no game rules.
//
// The picture (src/render): the stage (stage.js, three.js, the area's palette), the game view
// (view.js: the live area built by the paint worker, the people from state.actors, the camera that
// follows you), the paint worker (painter.js, src/art/worker.js) and the upload queue (uploads.js).
// The shader programs are compiled at boot behind the title (warm.js). The HUD is DOM over the canvas:
// the wrist terminal with its three clocks at the live site's longitude (places' lonOf) and the live
// area's name, the banner when paused or held, the hint line, toasts.
//
// Launching a state (new, loaded or imported: launch()) sets the loop's state at once, so the debug
// handle's start(json) then step(n) acts on it, and holds the pause reason 'cut' while the view builds
// the live area (at most CUT_MAX_MS, then what is ready shows) and the player's figure.
//
// Saves (TECH §7.4, TIME §13): the sim emits autosave { why } (a skip's end, the sol's start, five
// minutes of live play, an area change, the content edge); one write a frame at most, after the
// frame's ticks; a 'live' or a 'day' one waits for a quiet frame (one tick owed at most, nothing
// held) up to QUIET_WAIT_MS (TECH §7.4: the day slot at the first quiet frame after local 00:00);
// the rest (a skip's end, an area change, the edge) write at once, behind their splash or cut. Also on leaving the page, on hiding the tab and on quitting to
// the title. ?nostore=1 writes nothing (shots, benches, agents' smoke runs). The menu exports and
// imports save files, and writes a bug report (store.js reportOf: the last autosave as the anchor, or
// the state launched from (new, loaded or imported) before the first; the errors, the renderer, the
// engine, the state now).
//
// For tests and shots, URL parameters skip the title (src/core/debug.js readParams):
// ?play=sandbox&seed=<n>&hour=<h>[&mode=ironman][&debug=1]; &prop=chibi|soldier (the figures, chibi until
// the look is scored); &ppm=16|24 (the density, 24 by default: src/render/scale.js); &mood=<name> (else
// day 06:00 to 18:59 Melas time, night otherwise); &fog=1 (the samples' test fog); &nostore=1;
// &perf=1 (the GL counters and the GPU's time by pass, in window.__report). window.__olympus is the
// debug handle; window.__ready turns true once READY_FRAMES frames are drawn with nothing pending
// (the warm-up, the area, the uploads, the player's sheet, the worker), or at READY_LIMIT_MS with
// window.__report.pending saying what still waited.
import { createBus } from './core/bus.js';
import { createLoop } from './core/loop.js';
import { createInput } from './core/input.js';
import { fromJSON, toJSON } from './core/state.js';
import * as store from './core/store.js';
import { createDebugHandle, installDebug, readParams } from './core/debug.js';
import { MIN_MS, HOUR_MS, SEC_MS, durationText } from './core/clock.js';
import { utcText, utcClockText } from './core/calendar.js';
import { solText, marsDateText, marsClock } from './sim/time/dates.js';
import { setIdsCheck } from './core/ids.js';
import { createSim, newGame as freshGame, SCENARIOS } from './sim/game.js';
import { WAIT_MS } from './sim/time/domain.js';
import { areaOf, lonOf } from './sim/places/model.js';
import { createBoot } from './ui/boot.js';
import { createStage } from './render/stage.js';
import { createView, CUT_MAX_MS } from './render/view.js';
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
/** The first ticks after a load: every one lost means the save is damaged (store.js RECOVER_TICKS). */
const RECOVER_TICKS = store.RECOVER_TICKS ?? 20;
const WHY_RANK = { live: 0, skip: 1, area: 1, day: 2, edge: 3 };

const VERSION = (await fetch('VERSION', { cache: 'no-store' }).then(r => (r.ok ? r.text() : '?')).catch(() => '?')).trim() || '?';
store.setVersion(VERSION);
const params = readParams();
const readLocal = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const settings = {
  debug: params.debug || readLocal('olympus.debug') === '1',
  nostore: !!params.nostore, perf: !!params.perf, fog: !!params.fog,
  prop: params.prop === 'soldier' ? 'soldier' : 'chibi',
  mood: params.mood || null,
};
// (debug mode: an id map's cached sorted order checked against a fresh sort every 64th call, TECH §2.3.1)
if (settings.debug) setIdsCheck(64);

// ---- the page ----
const el = (tag, props = {}, ...kids) => { const n = Object.assign(document.createElement(tag), props); n.append(...kids.filter(Boolean)); return n; };
const watch = el('div', { className: 'watch' },
  el('div', { className: 'time' }, el('span', { className: 't' }), el('span', { className: 'slip', textContent: 'TIMESLIP', hidden: true })),
  el('div', { className: 'date' }), el('div', { className: 'utc' }), el('div', { className: 'place' }));
const banner = el('div', { className: 'banner', hidden: true });
const hint = el('div', { className: 'hint' });
const hud = el('div', { id: 'hud', hidden: true }, watch, banner, hint);
const frameEl = el('div', { id: 'frame' });
const toasts = el('div', { className: 'toasts' });
document.body.append(frameEl);

// ---- the stage, the view and the painting ----
const stage = createStage({ parent: frameEl, palette: 'mars' });
frameEl.append(hud);
const gl = stage.renderer.getContext();
window.__renderer = stage.stats.gpu;
const counters = settings.perf || settings.debug ? instrumentGL(gl) : null;
const painter = createPainter();
const uploads = createUploads();
const view = createView({ stage, prop: settings.prop, painter, uploads });
if (settings.mood) view.setMood(settings.mood);
if (settings.fog) view.setFog(true);
view.warm();

// ---- the engine ----
const bus = createBus({ onError: (e, type) => broke(e, `a listener of '${type}'`) });
let loop = null, sim = null;
// (the game owns Tab, Space and the move keys only in play with no card up: on the title they move focus and press buttons)
const input = createInput({ accept: () => !!loop?.state && !loop.paused, swallow: () => !!loop?.state && !boot?.card && !boot?.page });
const fitInput = () => input.setStage(stage.canvas, stage.W, stage.H);
fitInput();
addEventListener('resize', fitInput);
// (every error is told; sim.noteError writes only a tick's or a skip's into the state: a render's never touches it, TECH §3.7)
loop = createLoop({ render, poll: () => input.snapshot(), bus, onError: (e, where) => { try { sim?.noteError(loop.state, e, where); } catch { /* (an error note that fails mustn't stop the game) */ } broke(e, where); } });
sim = createSim({ loop, bus });

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
  },
  label: (a) => input.label(a),
  // (R's words in this build, from the sim's own number: it waits until VIEWS's R arrives at 0.0.4)
  says: () => ({ hand: `wait ${durationText(WAIT_MS)} (what is at hand, from 0.0.4)` }),
  keysExtra: () => (settings.debug ? DEBUG_SKIPS.map(([code, ms]) => [input.label(code), `debug: ${durationText(ms)} pass (marks the save)`]) : []),
} });
document.body.append(toasts);

function randomSeed() { return crypto.getRandomValues(new Uint32Array(1))[0]; }

/** A new career's state: { seed, mode, scenario, hour (the Mars local hour at the live site to start at) }. */
function newGame({ seed = randomSeed(), mode = 'standard', scenario = 'sandbox', hour = null } = {}) {
  if (!SCENARIOS[scenario]) throw new Error(`no scenario '${scenario}'`);
  return freshGame({ seed, mode, scenario, hour, version: VERSION });
}

// ---- launching: the state at once, the area behind a cut ----
let cutHeld = 0, launched = null, anchor = null;                    // (anchor: the report's, { json, seq })
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const liveArea = (s) => { const id = s?.places?.live?.area; try { return id ? areaOf(id) : null; } catch { return null; } };

/** Play a state from here (new, loaded or imported). Resolves with it once its area shows (or the cut gives up). */
function launch(s, { from = null } = {}) {
  boot.closeCard();
  boot.hideTitle();
  input.clear();
  loop.setState(s);
  loop.pause(false, 'player');
  hud.hidden = false;
  launched = { from, ticks: loop.stats.ticks, lost: loop.stats.lostTicks, checked: false };
  anchor = { json: toJSON(s), seq: s.clock.seq ?? null };            // (the state played from is the report's first anchor, until an autosave)
  const area = liveArea(s);
  if (!area) return Promise.resolve(s);
  const release = loop.pauseFor('cut');
  cutHeld++;
  const t0 = performance.now();
  const work = Promise.all([view.setArea(area), view.prepareOwn(s)]);
  return Promise.race([work, sleep(CUT_MAX_MS)])
    .catch((e) => broke(e, 'the area'))
    .then(() => {
      release(); cutHeld--;
      report.cutMs = Math.round(performance.now() - t0);
      return s;
    });
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
/** The line a save shows in the lists: 'Standard · Sol 590 MY 211 · 12:44 · 02:24Z · Test rooms'. */
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
bus.on('line', ({ text, kind = '' }) => toast(text, kind));
bus.on('skip-end', (e) => { if (e.toMs > e.fromMs) toast(`${durationText(e.toMs - e.fromMs)} pass (${e.minutes ?? Math.floor((e.toMs - e.fromMs) / MIN_MS)} minutes stepped).`); });

/** The bug report (store.js reportOf, TECH §7.6), the menu's and the debug handle's alike: the anchor, the errors, the stats, the renderer, the engine, the screen, the density. */
async function buildReport() {
  const s = loop.state;
  if (!s) return null;
  // (the sim's errors are in the state; the page's (a render's, a listener's) only in told: both go)
  const pageErrors = [...told].map(m => String(m).split('\n')[0]).filter(m => !(s.meta.errors ?? []).some(e => e.endsWith(`: ${m}`)));
  return store.reportOf(s, {
    anchor: anchor?.json ?? null, anchorSeq: anchor?.seq ?? null, errors: [...(s.meta.errors ?? []), ...pageErrors.map(m => `page: ${m}`)],
    stats: { view: view.stats, loop: { ...loop.stats }, sim: { ...sim.stats }, painter: painter.stats, uploads: uploads.stats },
    renderer: stage.stats.gpu, screen: { w: innerWidth, h: innerHeight, dpr: devicePixelRatio, picture: [stage.W, stage.H] }, ppm: PX_PER_M,
    engine: await store.engineInfo().catch(() => null),
  });
}
async function reportProblem() {
  const r = await buildReport();
  if (r) toast(`Report written to ${store.exportReport(r)}: send it with what you saw.`);
}

// ---- what is said: lines at the top left, 16 s each, three at most (tradecraft's) ----
function toast(text, kind = '') {
  const t = el('div', { className: `toast ${kind}`, textContent: text });
  toasts.prepend(t);
  while (toasts.children.length > 3) toasts.lastChild.remove();
  setTimeout(() => { t.classList.add('gone'); setTimeout(() => t.remove(), 1300); }, 16 * SEC_MS);
}
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
    if (action === 'menu' || (action === 'help' && boot.card === 'keys')) { const was = boot.card; boot.closeCard(); if (was === 'menu') loop.pause(false, 'player'); }
    else if (kind === 'digit') boot.digit(Number(action.slice(6)));
    return;
  }
  if (action === 'pause') loop.togglePause('player');
  else if (action === 'menu') boot.openMenu();
  else if (action === 'help') boot.openKeys();
});
addEventListener('keydown', (e) => {                                 // (debug mode: the clock moves on, through the sim)
  if (!settings.debug || !loop.state || loop.paused || e.repeat) return;
  for (const [code, ms] of DEBUG_SKIPS) if (e.code === code) input.queue(`debug:skip:${ms}`);
});
addEventListener('pagehide', () => { autosaveNow('live'); });
document.addEventListener('visibilitychange', () => { if (document.hidden && loop.state) { loop.pause(true, 'player'); autosaveNow('live'); } });

// ---- a frame: the picture, the HUD, the saves, whether the page is ready ----
const report = { version: VERSION, ppm: PX_PER_M, prop: settings.prop, renderer: stage.stats.gpu, view: view.stats, pending: [], cutMs: null, gl: null, frame: null, painter: painter.stats, uploads: uploads.stats };
window.__report = report;
window.__ready = false;
const bootT0 = performance.now();
let quietFrames = 0;
const put = (node, text) => { if (node.textContent !== text) node.textContent = text; };
function render(alpha, s, info) {
  const lon = s ? lonAt(s) : 0;
  view.frame(alpha, s, { ...info, lonEDeg: lon, cut: cutHeld > 0 });
  // (the frame's main-thread work: its ticks and the view; the frame clock itself is the browser's)
  report.frame = { ticks: info.ticks ?? 0, tickMs: (info.ticks ?? 0) * (loop.stats.tickMs ?? 0), viewMs: view.stats.viewMs };
  counters && (report.gl = { last: counters.frame(), max: counters.max, total: { bytes: counters.total.bytes, uploads: counters.total.uploads, links: counters.total.links, compiles: counters.total.compiles } });
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
  if (!s) return;
  const ms = s.clock.ms, c = marsClock(ms, lon);
  put(watch.querySelector('.t'), solText(ms, lon, { flag: false }));
  watch.querySelector('.slip').hidden = !c.timeslip;
  put(watch.querySelector('.date'), marsDateText(ms, lon));
  put(watch.querySelector('.utc'), utcText(ms));
  put(watch.querySelector('.place'), view.area?.name ?? liveArea(s)?.name ?? '');
  const showBanner = !boot.card && (info.paused || info.held) && !cutHeld;
  banner.hidden = !showBanner;
  if (showBanner) {
    const text = info.paused ? `PAUSED|${input.label('pause')} to carry on` : `TIME STANDS STILL|a digit to choose`;
    if (banner.dataset.text !== text) { banner.dataset.text = text; const [a, b] = text.split('|'); banner.replaceChildren(a, el('small', { textContent: b })); }
  }
  put(hint, `${input.label('help')} keys · ${input.label('menu')} menu`);
}
// (every one of a loaded save's first ticks lost: it is damaged; what stands in for it is loaded)
async function recoverBroken(slot) {
  try { const { state, from } = await store.recover(slot); toast(`That save is damaged: ${from} instead.`, 'warn'); await launch(state, { from }); }
  catch (e) { toast(`That save is damaged, and nothing stands in for it (${e.message}).`, 'bad'); }
}

// ---- the debug handle, and the way in ----
installDebug(createDebugHandle({ loop, sim, start: launch, newGame, version: VERSION, store, bus, about, view, solText, report: buildReport }));
loop.start();
if (params.play) {
  if (SCENARIOS[params.play]) launch(newGame({ seed: params.seed ?? 1, scenario: params.play, mode: params.mode, hour: params.hour }));
  else { toast(`No scenario '${params.play}': the title instead.`, 'warn'); await showTitle(); }
} else await showTitle();
