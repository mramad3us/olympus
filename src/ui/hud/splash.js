// OLYMPUS hud: the splash's controller and its interface, time passing in an activity shown on the stage itself (TIME §6, VIEWS §5).
//
// The brief: "taking a shower will take a chunk of time forward on the clock" (the user, 2026-11-05);
// DESIGN.md: "The splash is the stage itself, zoomed close on you at the appliance, with the action's
// vignette and a clock running fast. It is skippable to its end, and it is interruptible by events".
// TIME owns the behaviour and its numbers (src/sim/time/splash.js: splashPlan, lapseS, ease,
// targetAt, interruptTimes); the stage draws to the frame this module builds; this module drives it in
// real time and draws the splash's own HUD (the build sheet 0.0.4 §2.4).
//
// The controller (createSplashControl, pure: real seconds in, a frame out; the ui-splash test feeds it
// frames of 4, 16.7 and 33 ms with a model of the outcome engine):
//   start(skipStart, ctx)  on 'skip-start', at once (a bus listener, so the loop's first outcome frame
//                          never runs the whole skip): the plan, the phase 'in' (full) or 'lapse'
//                          (brief), and the sim's target held at fromMs;
//   frame(dtS, sim)        each frame, after the loop's: the phases advance by the frame's real
//                          seconds (0 while a card is open: Esc's menu pauses the splash, TIME §6.4),
//                          and it returns { view, target, pause }: the splash frame for the view, the
//                          sim's next target (loop.skipTarget) and whether the loop must hold the pause
//                          reason 'splash' (from skip-end to the end of the zoom out: no game time
//                          passes under the beat and the strip, the build sheet §8 item 13);
//   lines, interrupt, end  'skip-frame''s ticker lines, 'skip-interrupt', 'skip-end' (its outcome).
// The phases (TIME §6.2, §6.5): in (SPLASH_IN_S 0.4 s: the zoom from 1 to SPLASH_ZOOM 3 and the iris
// closing; the clock does not move yet), lapse (lapseS(m): the shown clock fromMs + ease(t / lapse) ×
// gap, never past the sim's clock, "the clock waits for the sim, never the reverse"; a fast-forward's
// lapse is the engine's own pace, its clock shown as it goes), then, ended, either strip (SPLASH_HOLD_S
// 0.8 s full, BRIEF_HOLD_S 0.4 brief, CHUNK_OFFER_S 1.2 while it offers another chunk) or, on an
// interrupt, decel (the shown clock eases to the interrupt's second over DECEL_S 0.35 s) and beat
// (BEAT_S 0.6: the vignette shows the cause, the plaque names it), then out (SPLASH_OUT_S 0.5, 0.25 for
// a danger; a brief splash has none). An interrupt that falls on the plan's own end (sleep until
// reveille, stopped by reveille: skip-end's toMs at its planned) is no surprise: the lapse runs to it,
// no decel, the beat, then the strip, then out, so a night's outcome is always shown (the review of
// v0.0.4: what eight hours did to the body was only in the log). A phase that ends mid-frame hands the rest of the frame to the
// next, so a 10-minute shower takes 0.4 + 2.59 + 0.8 + 0.5 = 4.29 s however the frames fall. A player's
// "stop here" lands through the strip with the partial outcome (TIME §6.4: "landing as an interrupt by
// the player (no reflex)").
//
// The controls (TIME §6.4, VIEWS §5.3; main.js routes the keys): toEnd() (Space, Enter, a click: the
// target becomes toMs and the shown clock snaps there over WHIRR_S 0.25 s; on the strip it closes it;
// in the beat it goes to the zoom out), stop() (Backspace: true where the activity is stoppable and the
// skip still runs, and main.js queues 'skip:stop'), chunk() (T while the strip offers "carry on (15
// min)" for CHUNK_OFFER_S: true, and main.js lets the loop run and queues 'skip:chunk'; the next skip
// continues zoomed, without the zoom out). A chunk asked during the lapse is the engine's own
// (skip:chunk as a skip command: toMs moves on), and the lapse runs on over the new gap.
//
// The splash frame (main.js gives it the view as info.splash): { id, activity, vignette, form, engine,
// phase, k, zoom, irisM, inkK, centre, fixtureId, spotId, fromMs, toMs, shownMs, vk, part, interrupt,
// ticker, outcome }: centre the middle of the player and the spot; inkK how far the iris has closed;
// vk the share of the gap shown; part the activity's part at shownMs (from time.doing's parts, kept at
// the start, so the strip and the zoom out still know it once the activity has closed).
//
// The HUD in a splash (createSplashHud, VIEWS §7.5's splash state: CLOCK, RADIO and INSTINCT, the rest
// hidden): the clock plaque in CLOCK (the wrist face at shownMs, the slip as '24:00 +12', and on an
// interrupt a plaque by its kind: ALARM, REVEILLE, the body's band word), the outcome strip in RADIO
// (each need that moved, before, a one-pixel arrow, after, the look glyph, "carry on (15 min) · T"),
// the ticker in INSTINCT (a line per TICKER_GAP_S 0.8 s; the rest are in the log; a line shown goes
// after TICKER_HOLD_GAPS of those with nothing after it, and at the strip, so 'Water off.' does not sit
// under the result) with the splash's keycaps (Space to the end, Backspace stop here where it may, Esc
// the menu).
import * as T from '../../sim/time/splash.js';
import { MIN_MS } from '../../core/clock.js';
import { playerActor } from '../../core/ids.js';
import { areaOf } from '../../sim/places/model.js';
import { spotsOf } from '../../sim/places/fixtures.js';
import { watchFaces } from './watch.js';
import { glyphEl, movedOf, glyphFor, wordsFor, OUTCOME_SCALE } from './strip.js';

/** The ticker keeps at most this many lines waiting; older ones are only in the log. */
export const TICKER_QUEUE_MAX = 3;
/** After T takes another chunk, the strip waits this long for its skip to begin, then zooms out all the same (real s, my call). */
export const CHUNK_WAIT_S = 1.0;
/** A ticker line shown goes after this many TICKER_GAP_S with nothing after it (my call). */
export const TICKER_HOLD_GAPS = 3;
const smooth = (k) => { const t = Math.max(0, Math.min(1, k)); return t * t * (3 - 2 * t); };
/** The splash's phases, in order (TIME §6.2, §6.5). */
export const PHASES = Object.freeze(['in', 'lapse', 'decel', 'beat', 'strip', 'out']);

/** The plaque an interrupt names itself with (VIEWS §5.3: "ALARM", a name, the body's band word). */
export function plaqueOf(ev) {
  if (!ev) return null;
  if (ev.kind === 'alert' || ev.letter === 'A') return 'ALARM';
  if (ev.kind === 'reveille') return 'REVEILLE';
  if (ev.kind === 'alert-count') return 'THE COUNT';
  if (ev.kind === 'alert-end') return 'STAND DOWN';
  if (ev.letter === 'B' || ev.kind === 'body') return String(ev.band ?? ev.payload?.band ?? 'your body').toUpperCase();
  if (ev.letter === 'D') return 'DANGER';
  if (ev.letter === 'S') return 'AT THE DOOR';
  if (ev.letter === 'O') return 'ORDERS';
  return ev.kind ? String(ev.kind).toUpperCase() : null;
}

/**
 * Where a splash looks, from the state at its start: { centre: { x, z }, fixtureId, spotId, parts,
 * vignette }. The centre is the middle of the player and the spot (VIEWS §5.1); parts time.doing's
 * [{ part, toMs }] with its fromMs.
 */
export function splashContext(state, skipStart = {}) {
  const me = state ? playerActor(state) : null, d = state?.time?.doing ?? null;
  const spotId = skipStart.spotId ?? d?.spotId ?? null;
  const fixtureId = spotId && spotId.includes('#') ? spotId.slice(0, spotId.lastIndexOf('#')) : null;
  let spot = null;
  if (fixtureId) {
    const area = areaOf(state?.places?.live?.area), fx = area?.fixtures?.find(f => f.id === fixtureId);
    spot = fx ? spotsOf(fx).find(p => p.id === spotId) ?? null : null;
  }
  const centre = me && spot ? { x: (me.x + spot.x) / 2, z: (me.z + spot.z) / 2 } : me ? { x: me.x, z: me.z } : spot ? { x: spot.x, z: spot.z } : { x: 0, z: 0 };
  return { centre, fixtureId, spotId, parts: d ? { fromMs: d.fromMs, list: (d.parts ?? []).map(p => ({ part: p.part, toMs: p.toMs })) } : null, vignette: skipStart.vignette ?? null };
}

/** The part of a splash's activity at ms, from the parts kept at its start, or null. */
export function partAt(parts, ms) {
  const list = parts?.list ?? [];
  if (!list.length) return null;
  let i = 0;
  while (i < list.length - 1 && ms >= list[i].toMs) i++;
  return list[i].part ?? null;
}

/**
 * The controller (see the header). timing: TIME's module (src/sim/time/splash.js) or a fixture of it;
 * short: VIEWS's "short splashes"; shortFor(skipStart): a short time-lapse for this one (main.js: the
 * debug skips, so six $ presses are not six full splashes: my call).
 */
export function createSplashControl({ timing = T, short = false, shortFor = () => false } = {}) {
  let sp = null, seq = 0;

  function plan(e) { return timing.splashPlan(e, { short: short || !!shortFor(e) }); }

  function start(e, ctx = {}) {
    const p = plan(e);
    // (a chunk taken at the strip, or a skip begun while the last one still shows: no zoom in again)
    const zoomed = !!sp && sp.plan.form === 'full' && p.form === 'full' && (sp.chunkTaken || sp.phase === 'strip' || sp.phase === 'out');
    const ticker = sp?.ticker ?? { queue: [], shown: null, shownS: 0 };
    sp = {
      n: ++seq, id: e.id, e, plan: p, phase: p.inS > 0 && !zoomed ? 'in' : 'lapse', t: 0, lapseT: 0,
      fromMs: e.fromMs, toMs: e.toMs, segFrom: e.fromMs, shownMs: e.fromMs, whirr: null, ended: null, interrupt: null,
      decelFrom: null, chunkTaken: false, waits: false, ticker, ctx, outS: p.outS, holdS: p.holdS, done: false,
    };
    return sp;
  }

  // (the ticker: a line per TICKER_GAP_S, the newest few waiting)
  function lines(list = []) {
    if (!sp) return;
    for (const l of list) if (l?.text) sp.ticker.queue.push({ text: l.text, tone: l.tone ?? 'note' });
    while (sp.ticker.queue.length > TICKER_QUEUE_MAX) sp.ticker.queue.shift();
  }

  function interrupt(ev) {
    if (!sp || (ev.id && sp.id && ev.id !== sp.id)) return;
    sp.interrupt = { atMs: ev.atMs, prio: ev.prio ?? null, letter: ev.letter ?? null, kind: ev.kind ?? null, line: ev.line ?? null, by: ev.by ?? null, band: ev.band ?? ev.payload?.band ?? null, reflex: ev.reflex ?? null, plaque: plaqueOf(ev) };
    // (the interrupt's line jumps the ticker's queue)
    if (ev.line) { sp.ticker.queue = [{ text: ev.line, tone: ev.prio !== null && ev.prio <= 1 ? 'urgent' : 'warn' }]; sp.ticker.shown = null; }
  }

  function end(ev) {
    if (!sp || (ev.id && sp.id && ev.id !== sp.id)) return;
    // (an interrupt on the plan's own end, with no reflex: the beat, then the strip)
    const planEnd = !!sp.interrupt && Number.isFinite(ev.planned) && ev.toMs >= ev.planned && !sp.interrupt.reflex;
    sp.ended = { toMs: ev.toMs, by: ev.by ?? null, interrupted: !!ev.interrupted, outcome: ev.outcome ?? null, planEnd };
    sp.waits = !!timing.stripWaits?.(ev.outcome);
    if (sp.interrupt) {
      const it = timing.interruptTimes(sp.interrupt.prio);
      sp.decelS = planEnd ? 0 : it.decelS; sp.beatS = it.beatS; sp.outS = sp.plan.form === 'full' ? (planEnd ? sp.plan.outS : it.outS) : 0;
    }
    // (a chunk offered: the strip holds for the offer, skip-end's offerMs, else TIME's CHUNK_OFFER_S)
    if (ev.outcome?.chunk) sp.offerS = Number.isFinite(ev.outcome.chunk.offerMs) ? ev.outcome.chunk.offerMs / 1000 : timing.CHUNK_OFFER_S;
    if (sp.offerS && sp.holdS < sp.offerS) sp.holdS = sp.offerS;
  }

  // (the shown clock in the lapse at lapseT, capped by the sim's clock and never going back)
  function shownIn(clockMs) {
    if (sp.plan.engine === 'ff') return Math.max(sp.shownMs, Math.min(clockMs, sp.toMs));
    let ms;
    if (sp.whirr) ms = sp.whirr.fromMs + (sp.toMs - sp.whirr.fromMs) * Math.min(1, (sp.lapseT - sp.whirr.atS) / timing.WHIRR_S);
    else ms = sp.segFrom + timing.ease(sp.plan.lapseS > 0 ? sp.lapseT / sp.plan.lapseS : 1) * (sp.toMs - sp.segFrom);
    return Math.max(sp.shownMs, Math.min(ms, clockMs, sp.toMs));
  }
  const lapseOver = () => sp.plan.engine === 'ff' || (sp.whirr ? sp.lapseT - sp.whirr.atS >= timing.WHIRR_S : sp.lapseT >= sp.plan.lapseS);

  /**
   * A frame: dtS real seconds (0 when frozen), sim = { clockMs, skipToMs } (the sim's clock now; the
   * running skip's toMs, which a chunk moves on). Returns { view, target, pause } or null with no splash.
   */
  function frame(dtS, { clockMs, skipToMs = null } = {}) {
    if (!sp) return null;
    let left = Math.max(0, dtS);
    // (a chunk asked during the lapse: the engine's toMs moved on, and the lapse runs on over the new gap)
    if (!sp.ended && skipToMs !== null && skipToMs > sp.toMs) {
      sp.segFrom = sp.shownMs; sp.toMs = skipToMs;
      sp.plan = plan({ ...sp.e, fromMs: sp.segFrom, toMs: skipToMs });
      sp.lapseT = 0; sp.whirr = null;
    }
    for (let guard = 0; guard < 8; guard++) {
      if (sp.phase === 'in') {
        const need = sp.plan.inS - sp.t;
        if (left < need) { sp.t += left; left = 0; break; }
        left -= need; sp.phase = 'lapse'; sp.t = 0;
        continue;
      }
      if (sp.phase === 'lapse') {
        if (!sp.ended) { sp.lapseT += left; left = 0; sp.shownMs = shownIn(clockMs); break; }
        // (ended: the lapse runs to its end, then the strip, or the interrupt's deceleration; one on the
        // plan's own end lets the lapse finish, and goes to its beat with no deceleration)
        if (sp.interrupt && !sp.ended.planEnd) { sp.phase = 'decel'; sp.t = 0; sp.decelFrom = sp.shownMs; continue; }
        if (sp.interrupt && sp.ended.planEnd && sp.plan.engine !== 'ff') {
          const before = sp.lapseT;
          sp.lapseT += left;
          sp.shownMs = shownIn(Math.max(clockMs, sp.ended.toMs));
          if (!lapseOver()) { left = 0; break; }
          const endS = sp.whirr ? sp.whirr.atS + timing.WHIRR_S : sp.plan.lapseS;
          left = Math.max(0, sp.lapseT - Math.max(before, endS));
          sp.shownMs = sp.interrupt.atMs; sp.phase = 'beat'; sp.t = 0;
          continue;
        }
        if (sp.interrupt) { sp.shownMs = sp.interrupt.atMs; sp.phase = 'beat'; sp.t = 0; continue; }
        if (sp.ended.interrupted) { sp.shownMs = Math.max(sp.shownMs, sp.ended.toMs); sp.phase = 'strip'; sp.t = 0; continue; }
        const before = sp.lapseT;
        sp.lapseT += left;
        sp.shownMs = shownIn(Math.max(clockMs, sp.ended.toMs));
        if (!lapseOver()) { left = 0; break; }
        // (the rest of the frame past the lapse's end goes to the strip)
        const endS = sp.plan.engine === 'ff' ? before : sp.whirr ? sp.whirr.atS + timing.WHIRR_S : sp.plan.lapseS;
        left = Math.max(0, sp.lapseT - Math.max(before, endS));
        sp.shownMs = sp.ended.toMs; sp.phase = 'strip'; sp.t = 0;
        continue;
      }
      if (sp.phase === 'decel') {
        const need = sp.decelS - sp.t;
        if (left < need) { sp.t += left; left = 0; }
        else { left -= need; sp.t = sp.decelS; }
        sp.shownMs = sp.decelFrom + (sp.interrupt.atMs - sp.decelFrom) * (1 - (1 - sp.t / sp.decelS) ** 2);
        if (sp.t < sp.decelS) break;
        sp.shownMs = sp.interrupt.atMs; sp.phase = 'beat'; sp.t = 0;
        continue;
      }
      if (sp.phase === 'beat' || sp.phase === 'strip') {
        const len = sp.phase === 'beat' ? sp.beatS : sp.chunkTaken ? sp.holdS + CHUNK_WAIT_S : sp.holdS;
        if (sp.phase === 'strip' && sp.waits) { sp.t += left; left = 0; break; }
        const need = len - sp.t;
        if (left < need) { sp.t += left; left = 0; break; }
        left -= need; sp.t = 0;
        sp.phase = sp.phase === 'beat' && sp.ended?.planEnd && sp.ended.outcome ? 'strip' : 'out';
        continue;
      }
      if (sp.phase === 'out') {
        const need = sp.outS - sp.t;
        if (left < need) { sp.t += left; left = 0; break; }
        sp.done = true;
        break;
      }
    }
    tickerStep(dtS);
    // (the pause from the landing to the end of the zoom out; let go while a chunk taken at the strip waits for its tick)
    const out = { view: viewOf(), target: targetOf(), pause: !!sp.ended && !sp.done && !sp.chunkTaken, phase: sp.phase, done: sp.done };
    if (sp.done) sp = null;
    return out;
  }

  function tickerStep(dtS) {
    const tk = sp.ticker;
    tk.shownS += Math.max(0, dtS);
    if ((!tk.shown || tk.shownS >= timing.TICKER_GAP_S) && tk.queue.length) { tk.shown = tk.queue.shift(); tk.shownS = 0; }
    // (a line with nothing after it goes after a few gaps, and at the strip: the result stands alone)
    else if (tk.shown && (tk.shownS >= TICKER_HOLD_GAPS * timing.TICKER_GAP_S || (sp.phase === 'strip' && tk.shown.tone !== 'urgent' && !sp.interrupt))) tk.shown = null;
  }

  // (the sim's target: fromMs while zooming in, the ease's minute through the lapse, toMs after "to the end")
  function targetOf() {
    if (sp.ended || sp.plan.engine === 'ff') return null;
    if (sp.phase === 'in') return sp.fromMs;
    if (sp.whirr) return sp.toMs;
    return timing.targetAt(sp.plan, sp.segFrom, sp.toMs, sp.lapseT);
  }

  function viewOf() {
    const full = sp.plan.form === 'full', Z = timing.SPLASH_ZOOM;
    const len = { in: sp.plan.inS, decel: sp.decelS, beat: sp.beatS, strip: sp.holdS, out: sp.outS }[sp.phase];
    const k = sp.phase === 'lapse' ? (sp.plan.lapseS > 0 ? Math.min(1, sp.lapseT / sp.plan.lapseS) : 1) : len > 0 ? Math.min(1, sp.t / len) : 1;
    const closing = sp.phase === 'in' ? smooth(k) : sp.phase === 'out' || sp.done ? 1 - smooth(sp.done ? 1 : k) : 1;
    const gap = Math.max(1, sp.toMs - sp.fromMs);
    const ctx = sp.ctx ?? {};
    return {
      id: sp.id, activity: sp.e.activity ?? null, vignette: ctx.vignette ?? sp.e.vignette ?? null, form: sp.plan.form, engine: sp.plan.engine,
      phase: sp.phase, k, zoom: full ? 1 + (Z - 1) * closing : 1, irisM: full ? timing.SPLASH_IRIS_M : Infinity, inkK: closing,
      centre: ctx.centre ?? null, fixtureId: ctx.fixtureId ?? null, spotId: ctx.spotId ?? sp.e.spotId ?? null,
      fromMs: sp.fromMs, toMs: sp.toMs, shownMs: sp.shownMs, vk: Math.max(0, Math.min(1, (sp.shownMs - sp.fromMs) / gap)),
      part: partAt(ctx.parts, sp.shownMs) ?? sp.e.posture ?? null,
      interrupt: sp.interrupt && (sp.phase === 'decel' || sp.phase === 'beat' || sp.phase === 'strip' || sp.phase === 'out') ? sp.interrupt : null,
      planEnd: !!sp.ended?.planEnd,
      ticker: sp.ticker.shown, outcome: sp.ended?.outcome ?? null,
      stoppable: sp.e.stoppable !== false && !sp.ended, chunkOffer: chunkOffered() ? (sp.e.chunkMs || null) : null,
    };
  }

  const chunkOffered = () => !!sp && sp.phase === 'strip' && !!sp.ended?.outcome?.chunk && !sp.chunkTaken && sp.t < (sp.offerS ?? timing.CHUNK_OFFER_S);

  return {
    start, lines, interrupt, end, frame,
    /** Space, Enter, a click: the rest at once (the clock snaps over WHIRR_S), or the strip closed, or the beat cut to the zoom out. Returns whether it did anything. */
    toEnd() {
      if (!sp) return false;
      if ((sp.phase === 'in' || sp.phase === 'lapse') && !sp.ended && sp.plan.engine !== 'ff' && !sp.whirr) {
        if (sp.phase === 'in') { sp.phase = 'lapse'; sp.t = 0; }
        sp.whirr = { atS: sp.lapseT, fromMs: sp.shownMs };
        return true;
      }
      if (sp.phase === 'lapse' && sp.ended && !sp.whirr && sp.plan.engine !== 'ff') { sp.whirr = { atS: sp.lapseT, fromMs: sp.shownMs }; return true; }
      if (sp.phase === 'strip' || sp.phase === 'beat' || sp.phase === 'decel') { sp.phase = 'out'; sp.t = 0; if (sp.interrupt) sp.shownMs = sp.interrupt.atMs; return true; }
      return false;
    },
    /** Backspace: whether 'skip:stop' should go (the activity stoppable, the skip still running). */
    stop() { return !!sp && !sp.ended && sp.e.stoppable !== false && (sp.phase === 'in' || sp.phase === 'lapse'); },
    /** T on the strip's "carry on": whether 'skip:chunk' should go; the splash then waits zoomed for the next chunk. */
    chunk() {
      if (!chunkOffered()) return false;
      sp.chunkTaken = true;                                      // (held on the strip, up to CHUNK_WAIT_S more, for the next chunk's skip-start)
      return true;
    },
    /** Whether T during the lapse asks the engine for another chunk (the skip is chunked and still runs). */
    chunkable() { return !!sp && !sp.ended && (sp.e.chunkMs ?? 0) > 0; },
    /** A splash is showing. */
    get active() { return !!sp; },
    get phase() { return sp?.phase ?? null; },
    get plan() { return sp?.plan ?? null; },
    /** The running splash's numbers (the debug handle's splash()). */
    get info() { return sp ? { id: sp.id, activity: sp.e.activity, plan: sp.plan, phase: sp.phase, t: sp.t, lapseT: sp.lapseT, shownMs: sp.shownMs, fromMs: sp.fromMs, toMs: sp.toMs, ended: sp.ended, interrupt: sp.interrupt, chunkTaken: sp.chunkTaken } : null; },
    /** Forget the splash (a load, the title). */
    clear() { sp = null; },
  };
}

// ---- the splash's HUD ----

/** The outcome strip's items: [{ kind: 'need', need, before, after } | { kind: 'look', glyph, words } | { kind: 'chunk', min }]. */
export function outcomeItems(outcome, { chunkOffer = null } = {}) {
  const items = [];
  if (outcome?.body) for (const m of movedOf(outcome.body.before, outcome.body.after)) items.push({ kind: 'need', need: m.need, before: m.before, after: m.after });
  const look = outcome?.look;
  if (look?.wet) items.push({ kind: 'look', glyph: 'wet', words: 'Hair wet.' });
  if (look?.outfit && look.outfit !== 'utilities') items.push({ kind: 'look', glyph: look.outfit === 'towel' ? 'towel' : look.outfit === 'pt' ? 'pt' : 'utilities', words: { towel: 'In a towel.', pt: 'In PT kit.' }[look.outfit] ?? `In ${look.outfit}.` });
  else if (look?.outfit === 'utilities' && look.changed) items.push({ kind: 'look', glyph: 'utilities', words: 'In utilities.' });
  if (chunkOffer) items.push({ kind: 'chunk', min: Math.round(chunkOffer / MIN_MS) });
  return items;
}

/**
 * The splash's own HUD in hud: { update(frame, { state, lonEDeg, label }) → { clock, plaque, ticker, strip } }.
 * Hidden when frame is null.
 */
export function createSplashHud(hud, { label = (a) => a } = {}) {
  const doc = globalThis.document;
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(doc.createElement(tag), props); n.append(...kids); return n; };
  const clock = el('div', { className: 'splash-clock' }), time = el('div', { className: 't' }), sub = el('div', { className: 'sub' });
  clock.append(time, sub);
  const radio = el('div', { className: 'radio outcome' });
  const ticker = el('div', { className: 'instinct ticker' });
  clock.hidden = radio.hidden = ticker.hidden = true;
  hud.append(clock, radio, ticker);
  const put = (node, text) => { if (node.textContent !== text) node.textContent = text; };
  let stripSig = null, tickSig = null;
  const kbd = (k) => el('kbd', { textContent: k });

  function update(f, { state = null, lonEDeg = null } = {}) {
    const on = !!f;
    clock.hidden = !on; ticker.hidden = !on;
    if (!on) { radio.hidden = true; stripSig = tickSig = null; return null; }
    // (the clock plaque: the wrist face at the time shown, the slip as '24:00 +12'; on an interrupt its plaque)
    const faces = state ? watchFaces(state, { lonEDeg, ms: f.shownMs }) : null;
    const t = faces ? (faces.slip ? `24:00 +${faces.slipMin}` : faces.time) : '';
    put(time, t);
    const plaque = f.interrupt?.plaque ?? null;
    put(sub, plaque ?? (faces ? `${faces.weekday} · ${faces.sol}` : ''));
    clock.classList.toggle('alarm', !!plaque && (f.interrupt.prio ?? 9) <= 1);
    clock.classList.toggle('plaque', !!plaque);
    // (the outcome strip, on the strip and the zoom out after it)
    const showStrip = (f.phase === 'strip' || (f.phase === 'out' && (!f.interrupt || f.planEnd))) && !!f.outcome;
    const items = showStrip ? outcomeItems(f.outcome, { chunkOffer: f.chunkOffer }) : [];
    const sig = JSON.stringify(items.map(i => [i.kind, i.need ?? i.glyph ?? i.min, i.before?.fill, i.after?.fill, i.before?.tone, i.after?.tone]));
    if (sig !== stripSig) {
      stripSig = sig;
      radio.replaceChildren(...items.map(i => {
        if (i.kind === 'need') return el('span', { className: 'moved', title: `${wordsFor(i.before)} → ${wordsFor(i.after)}` },
          glyphEl({ name: glyphFor(i.before), fill: i.before.fill ?? 0, tone: i.before.tone, scale: OUTCOME_SCALE }),
          glyphEl({ name: 'arrow', fill: 5, tone: 'fine', scale: OUTCOME_SCALE / 2, border: false }),
          glyphEl({ name: glyphFor(i.after), fill: i.after.fill ?? 0, tone: i.after.tone, scale: OUTCOME_SCALE }));
        if (i.kind === 'look') return el('span', { className: 'look', title: i.words }, glyphEl({ name: i.glyph, fill: 5, tone: 'fine', scale: OUTCOME_SCALE }));
        return el('span', { className: 'carry' }, `carry on (${i.min} min) · `, kbd(label('instinct')));
      }));
    }
    radio.hidden = !items.length;
    // (the ticker, and the splash's keycaps: to the end, stop here where it may, the menu)
    const tk = f.ticker?.text ?? '';
    const tsig = `${tk}|${f.stoppable}|${f.phase}|${f.ticker?.tone ?? ''}`;
    if (tsig !== tickSig) {
      tickSig = tsig;
      const kids = [];
      if (tk) kids.push(el('span', { className: `line ${f.ticker.tone ?? 'note'}` }, tk));
      const keys = el('span', { className: 'chip keys' }, kbd(label('pause')), ' to the end');
      if (f.stoppable && (f.phase === 'in' || f.phase === 'lapse')) keys.append(' · ', kbd('Backspace'), ' stop here');
      keys.append(' · ', kbd(label('menu')), ' menu');
      kids.push(keys);
      ticker.replaceChildren(...kids);
    }
    return { clock: t, plaque, ticker: tk, strip: items.map(i => (i.kind === 'need' ? `${i.need} ${i.before.fill}→${i.after.fill}` : i.kind === 'look' ? i.glyph : `carry on ${i.min}`)) };
  }
  return { update, els: { clock, radio, ticker } };
}
