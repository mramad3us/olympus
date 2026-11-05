// OLYMPUS: the game in the browser. Wires the engine core (src/core) to the page: the loop, the
// keys and the mouse, the saves, the title and the debug handle.
//
// The loop (src/core/loop.js): real time accumulates and the sim steps in fixed 50 ms ticks while
// nothing pauses it (Space, an open card, a hidden tab); the picture draws every frame between the
// last two ticks. One game second per real second; time moves faster only through an activity that
// takes time (the loop's skip), and in debug mode through ] (an hour) and [ (fifteen minutes).
//
// This round has no sim and no stage yet (other hands build them; the lead joins them here). So
// the game runs one placeholder scenario, 'sandbox': a figure on a 1 m grid, walked with Z Q S D at
// tradecraft's paces, with G holding time still until a digit is pressed (the stop-motion hook), and
// R passing fifteen minutes (a skip). The picture is a plain 2D canvas at the stage's default size
// (960 × 540 at 24 px/m, copied from src/render/scale.js rather than imported, so nothing here
// depends on the renderer); the HUD is a wrist terminal with the three clock faces. All of that is
// scaffolding, marked "stub" below, and goes when the sim and the stage arrive.
//
// Saves: the autosave layer reports every 30 game minutes on the bus ('autosave'), and the save is
// written after the frame's ticks, once however many were crossed (a skip of eight hours crosses
// sixteen); also on leaving the page, on hiding the tab and on quitting to the title. An Ironman
// career autosaves to its one slot. The menu exports and imports save files.
//
// For tests and shots, URL parameters skip the title: ?play=<scenario>&seed=<n>&hour=<h>
// [&mode=ironman][&debug=1], hour being the Mars local hour at the base (src/core/debug.js).
// window.__olympus is the debug handle; window.__ready turns true after the third frame drawn.
import { createBus } from './core/bus.js';
import { createLoop } from './core/loop.js';
import { createInput } from './core/input.js';
import { newState, fromJSON } from './core/state.js';
import * as store from './core/store.js';
import { createDebugHandle, installDebug, readParams } from './core/debug.js';
import { TICK_MS, MIN_MS, HOUR_MS, SEC_MS, holdTime, releaseTime, durationText } from './core/clock.js';
import { solText, marsDateText, utcText, marsClock, msAtMarsTime } from './core/calendar.js';
import { hash01 } from './core/hash.js';
import { createBoot } from './ui/boot.js';

const VERSION = (await fetch('VERSION', { cache: 'no-store' }).then(r => (r.ok ? r.text() : '?')).catch(() => '?')).trim() || '?';
store.setVersion(VERSION);
const params = readParams();
const readLocal = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const settings = { debug: params.debug || readLocal('olympus.debug') === '1' };

// ---- stub: the placeholder world (goes when the sim and the stage arrive) ----
const STAGE_RES = [960, 540], STAGE_PX_PER_M = 24;                  // (src/render/scale.js's default density, copied)
const STAGE_MAX_PX = [48 * STAGE_PX_PER_M, Math.round(26.875 * STAGE_PX_PER_M)];   // (and its widest and tallest: 48 × 26.9 m)
const BASE_LON_E_DEG = -72;                                          // (Melas Chasma lies near 10° S, 72° W; SETTING.md places the base)
const WALK_MS = 1.45, RUN_MS = 3.6, STROLL_MS = 0.95;                // (tradecraft's paces, sim/game.js, until BODY.md's)
const WAIT_MS = 15 * MIN_MS;                                         // (R in the sandbox: a skip)
const AUTOSAVE_MS = 30 * MIN_MS;

/** The scenarios a new game can start in: each fills a fresh state. */
const SCENARIOS = {
  sandbox(s) {
    s.player = { name: 'Private (stub)', x: 0, z: 0 };
    s.sites.sandbox = { lonEDeg: BASE_LON_E_DEG };
  },
};

// The sandbox's tick: walk, hold time for a choice, let time pass. (The real one is src/sim's.)
function sandboxStep(s, input, bus, ctx) {
  const p = s.player;
  p.$px = p.x; p.$pz = p.z;
  if (ctx.held) {
    const pick = input.act.find(a => a.startsWith('digit:'));
    if (pick) { releaseTime(s, 'ready'); bus.emit('line', { text: `Choice ${pick.slice(6)}: time runs again.` }); }
    return;
  }
  if (input.act.includes('ready')) { holdTime(s, 'ready'); bus.emit('line', { text: 'Weapon ready: time stands still until you choose (a digit).' }); return; }
  if (input.act.includes('hand')) {
    const r = ctx.skip(WAIT_MS, { what: 'wait' });
    bus.emit('line', { text: `${durationText(r.elapsedMs)} pass (${r.minutes} minutes stepped${r.stopped === 'done' ? '' : `, stopped: ${r.reason}`}).` });
  }
  const n = Math.hypot(input.mx, input.mz);
  if (n) {
    const speedMs = input.run ? RUN_MS : input.stroll ? STROLL_MS : WALK_MS, stepM = (speedMs * TICK_MS) / 1000 / n;
    p.x += input.mx * stepM;
    p.z += input.mz * stepM;
  }
}

// ---- the page ----
const el = (tag, props = {}, ...kids) => { const n = Object.assign(document.createElement(tag), props); n.append(...kids.filter(Boolean)); return n; };
const canvas = el('canvas', { id: 'stage', width: STAGE_RES[0], height: STAGE_RES[1] });
const g = canvas.getContext('2d');
const watch = el('div', { className: 'watch' },
  el('div', { className: 'time' }, el('span', { className: 't' }), el('span', { className: 'slip', textContent: 'TIMESLIP', hidden: true })),
  el('div', { className: 'date' }), el('div', { className: 'utc' }), el('div', { className: 'place' }));
const banner = el('div', { className: 'banner', hidden: true });
const hint = el('div', { className: 'hint' });
const hud = el('div', { id: 'hud', hidden: true }, watch, banner, hint);
const frameEl = el('div', { id: 'frame' }, canvas, hud);
const toasts = el('div', { className: 'toasts' });
document.body.append(frameEl);

// ---- the engine ----
const bus = createBus({ onError: (e, type) => broke(e, `a listener of '${type}'`) });
let loop = null;
const input = createInput({ accept: () => !!loop?.state && !loop.paused });
// (the picture grows on the window's longer side, up to 48 × 26.9 m, so a pixel stays square, as the
// stage's will; the mouse is read in its pixels)
function fitStage() {
  const even = (v) => 2 * Math.round(v / 2), aspect = innerWidth / innerHeight;
  const w = Math.min(STAGE_MAX_PX[0], Math.max(STAGE_RES[0], even(STAGE_RES[1] * aspect)));
  const h = Math.min(STAGE_MAX_PX[1], Math.max(STAGE_RES[1], even(STAGE_RES[0] / aspect)));
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  input.setStage(canvas, canvas.width, canvas.height);
}
fitStage();
addEventListener('resize', fitStage);
loop = createLoop({ step: sandboxStep, render, poll: () => input.snapshot(), bus, onError: broke });
loop.register('autosave', (s, b) => b.emit('autosave', { atMs: s.clock.ms }), AUTOSAVE_MS);

const releases = new Map();                                          // (a pause reason held for each open card)
const boot = createBoot({ cb: {
  newCareer: (mode) => launch(newGame({ mode })),
  continueFrom: (slot) => store.load(slot).then(s => (s ? launch(s) : toast('That save is gone.'))).catch(e => toast(`That save won't load: ${e.message}.`, 'bad')),
  loadFile: async () => {
    const text = await store.importFile();
    if (!text) return;
    try { launch(fromJSON(text)); } catch (e) { toast(`That file won't load: ${e.message}.`, 'bad'); }
  },
  saveFile: () => { if (loop.state) toast(`Saved to ${store.exportFile(loop.state)}.`); },
  resume: () => loop.pause(false, 'player'),
  quit: () => quitToTitle(),
  overlay: (name, open) => {
    if (open) releases.set(name, loop.pauseFor(`overlay:${name}`));
    else { releases.get(name)?.(); releases.delete(name); }
  },
  label: (a) => input.label(a),
} });
document.body.append(toasts);

function randomSeed() { return crypto.getRandomValues(new Uint32Array(1))[0]; }

/** A new career's state: { seed, mode, scenario, hour (the Mars local hour at the base to start at) }. */
function newGame({ seed = randomSeed(), mode = 'standard', scenario = 'sandbox', hour = null } = {}) {
  const fill = SCENARIOS[scenario];
  if (!fill) throw new Error(`no scenario '${scenario}'`);
  const s = newState(seed, { version: VERSION, mode, scenario });
  if (hour !== null) {
    const h = Math.max(0, Math.min(24, Math.floor(hour))), m = Math.min(h === 24 ? 39 : 59, Math.round((hour - Math.floor(hour)) * 60));
    s.clock.ms = s.meta.createdMs = msAtMarsTime(s.clock.ms, h, m, BASE_LON_E_DEG);
  }
  fill(s);
  return s;
}

/** Play a state from here (new, loaded or imported). */
function launch(s) {
  boot.closeCard();
  boot.hideTitle();
  input.clear();
  loop.setState(s);
  loop.pause(false, 'player');
  hud.hidden = false;
  return s;
}

async function quitToTitle() {
  await autosave();
  loop.setState(null);
  await showTitle();
}

async function showTitle() {
  hud.hidden = true;
  let saves = [];
  try { saves = await store.list(); } catch (e) { console.warn('the save list did not load', e); }
  boot.showTitle({ version: VERSION, saves });
}

const about = (s) => `${s.meta.mode === 'ironman' ? 'Ironman' : 'Standard'} career · ${marsDateText(s.clock.ms, BASE_LON_E_DEG)} · ${utcText(s.clock.ms)}`;
let saving = null;
async function autosave() {
  const s = loop.state;
  if (!s) return;
  if (saving) await saving;                                          // (one write at a time)
  saving = store.save(store.autoSlotOf(s), s, about(s)).catch(e => console.warn('autosave failed', e)).finally(() => { saving = null; });
  return saving;
}
let autosaveDue = false;
bus.on('autosave', () => { autosaveDue = true; });
bus.on('line', ({ text }) => toast(text));

// ---- what is said: lines at the top left, 16 s each, three at most (tradecraft's) ----
function toast(text, kind = '') {
  const t = el('div', { className: `toast ${kind}`, textContent: text });
  toasts.prepend(t);
  while (toasts.children.length > 3) toasts.lastChild.remove();
  setTimeout(() => { t.classList.add('gone'); setTimeout(() => t.remove(), 1300); }, 16 * SEC_MS);
}
// (an error in a tick, a frame or a listener: told once, the game carries on; Esc → Save to a file, to report it)
const told = new Set();
function broke(e, where = 'tick') {
  console.error(`OLYMPUS: ${where} broke`, e);
  if (told.has(e?.message)) return;
  told.add(e?.message);
  toast(`Something in the game broke (${e?.message}). It carries on; Esc, then Save to a file, to report it.`, 'bad');
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
addEventListener('keydown', (e) => {                                 // (debug mode: the clock moves on)
  if (!settings.debug || !loop.state || loop.paused || e.repeat) return;
  if (e.code === 'BracketRight') loop.skip(HOUR_MS, { what: 'debug' });
  if (e.code === 'BracketLeft') loop.skip(15 * MIN_MS, { what: 'debug' });
});
addEventListener('pagehide', () => { autosave(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && loop.state) { loop.pause(true, 'player'); autosave(); } });

// ---- the picture (stub: the stage replaces it) ----
let drawn = 0;
const put = (node, text) => { if (node.textContent !== text) node.textContent = text; };
function render(alpha, s, info) {
  if (++drawn === 3) window.__ready = true;
  if (autosaveDue && s && !loop.skipping) { autosaveDue = false; autosave(); }
  if (!s) return;
  drawSandbox(alpha, s);
  const ms = s.clock.ms, c = marsClock(ms, BASE_LON_E_DEG);
  put(watch.querySelector('.t'), solText(ms, BASE_LON_E_DEG, { flag: false }));
  watch.querySelector('.slip').hidden = !c.timeslip;
  put(watch.querySelector('.date'), marsDateText(ms, BASE_LON_E_DEG));
  put(watch.querySelector('.utc'), utcText(ms));
  put(watch.querySelector('.place'), 'Base Melas (stub)');
  const showBanner = !boot.card && (info.paused || info.held);
  banner.hidden = !showBanner;
  if (showBanner) {
    const text = info.paused ? `PAUSED|${input.label('pause')} to carry on` : `TIME STANDS STILL|a digit to choose`;
    if (banner.dataset.text !== text) { banner.dataset.text = text; const [a, b] = text.split('|'); banner.replaceChildren(a, el('small', { textContent: b })); }
  }
  put(hint, `${input.label('help')} keys · ${input.label('menu')} menu`);
}

function drawSandbox(alpha, s) {
  const p = s.player, W = canvas.width, H = canvas.height, k = STAGE_PX_PER_M;
  const px = (p.$px ?? p.x) + (p.x - (p.$px ?? p.x)) * alpha, pz = (p.$pz ?? p.z) + (p.z - (p.$pz ?? p.z)) * alpha;
  g.imageSmoothingEnabled = false;
  g.fillStyle = '#15171d'; g.fillRect(0, 0, W, H);
  // (the metre grid, every fifth line brighter, fixed to the ground: the camera follows the figure)
  const x0 = Math.floor(px - W / 2 / k) - 1, z0 = Math.floor(pz - H / 2 / k) - 1;
  for (let i = x0; i <= x0 + W / k + 2; i++) { const sx = Math.round(W / 2 + (i - px) * k); g.fillStyle = i % 5 ? '#1c1f27' : '#262a35'; g.fillRect(sx, 0, 1, H); }
  for (let j = z0; j <= z0 + H / k + 2; j++) { const sy = Math.round(H / 2 + (j - pz) * k); g.fillStyle = j % 5 ? '#1c1f27' : '#262a35'; g.fillRect(0, sy, W, 1); }
  // (posts every 5 m, some missing: chosen by hash, so walking shows on the ground)
  for (let i = Math.ceil(x0 / 5) * 5; i <= x0 + W / k + 2; i += 5) for (let j = Math.ceil(z0 / 5) * 5; j <= z0 + H / k + 2; j += 5) {
    if (hash01('post', i, j) < 0.6) continue;
    const sx = Math.round(W / 2 + (i - px) * k), sy = Math.round(H / 2 + (j - pz) * k);
    g.fillStyle = '#3a3f4d'; g.fillRect(sx - 3, sy - 12, 6, 12); g.fillStyle = '#4c5262'; g.fillRect(sx - 3, sy - 12, 6, 2);
  }
  // (the figure: a brass marine of a few rects, 1.8 m tall)
  const cx = W / 2, cy = H / 2;
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(cx - 8, cy - 2, 16, 4);
  g.fillStyle = '#5b6340'; g.fillRect(cx - 7, cy - 30, 14, 28);
  g.fillStyle = '#e7b84a'; g.fillRect(cx - 5, cy - 42, 10, 11);
  g.fillStyle = '#3f452c'; g.fillRect(cx - 7, cy - 16, 14, 3);
  g.fillStyle = '#6a7182'; g.font = '12px ui-monospace, Menlo, monospace';
  g.fillText(`stage placeholder · ${px.toFixed(1)}, ${pz.toFixed(1)} m`, 12, H - 12);
}

// ---- the debug handle, and the way in ----
installDebug(createDebugHandle({ loop, start: launch, newGame, version: VERSION, store, bus, about }));
loop.start();
if (params.play) {
  if (SCENARIOS[params.play]) launch(newGame({ seed: params.seed ?? 1, scenario: params.play, mode: params.mode, hour: params.hour }));
  else { toast(`No scenario '${params.play}': the title instead.`, 'warn'); await showTitle(); }
} else await showTitle();
