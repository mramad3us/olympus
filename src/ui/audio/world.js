// OLYMPUS audio: the world's sounds of the barracks' night and morning, and the splash's muffle and tick (VIEWS §11; the build sheet 0.0.4 §2.4).
//
// The presenter's ear again (VIEWS §11.1: "the sim decides, audio presents"): each frame it reads what
// the sim says is happening and asks the engine (engine.js) for loops and one-shots, all synthesised
// (src/data/sounds.js WORLD, rendered by synth.js):
//   the shower's water  a loop while time's activityNow says the shower's 'water' part runs (at the
//                       time the splash shows: the water runs through the lapse's middle minutes and
//                       stops at "Water off."), at the stall, faded in and out;
//   the tap             a loop while a basin's or the morning's teeth, shave or face part runs, and a
//                       drink at a sink or a hall's fountain;
//   the flush           a body-event 'void' or 'bowel' of yours where you stand in a head;
//   the klaxon          alertNow(state, ms).hornOn: a 1.5 s whoop at each of the horn's cycles, at the
//                       horn (hall-2, 57.7 m, 8.8 m), by the air's law (airDb, −1.9 dB at 66 kPa) and
//                       the distance's (inverse from 1 m, rolloff 1.5 indoors), then WALL_DB a wall and
//                       the low-pass halved a wall between the horn's room and yours: 0 in the same room,
//                       1 next door (a room the horn's opens onto), 2 beyond (wallsBetween);
//   reveille's bugle    the 'reveille' fact, the bay's speaker (heard in every room of the floor, my
//                       call: each room has its speaker);
//   the splash          the world bus low-passed to SPLASH_LP_HZ (900 Hz) and ducked SPLASH_DUCK_DB
//                       (−9 dB), eased with the iris (the splash frame's inkK; 1 throughout a brief
//                       one), and the watch ticking once a shown minute on the UI bus, which is not
//                       ducked, at most TICK_MAX_HZ (10 a second: a 10-minute shower ticks ten times in
//                       its 2.6 s, a night is a steady 10 Hz whirr).
// Nothing plays while the context is not running (the engine's own rule). The pure parts (klaxonVoice,
// wallsBetween, duckOf, the ticker's rule, loopsAt) are what the ui-audio test measures in node. The
// 0.0.5 round's range (the shot, the action's clicks, the brass, the tower's chime) is a presenter of its
// own beside this one (range.js), on the same world bus, so the splash's muffle takes it too.
// The 0.0.6 round's (the build sheet 0.0.6 §2.3): the tap runs while the hands are washed (the part 'hands'),
// the clippers' loop while a shaved head is buzzed (the part 'clip'), and the R menu's sounds (the 'ui' fact
// main.js hands on: { kind: 'move' | 'check' | 'uncheck' | 'confirm' | 'close' }, UI_SOUNDS' recipes) play on
// the UI bus, so a splash's muffle never takes them.
import { playerActor, playerId } from '../../core/ids.js';
import { MIN_MS } from '../../core/clock.js';
import { airDb } from '../../sim/people/hearing.js';
import { roomOf, areaOf } from '../../sim/places/model.js';
import { activityNow } from '../../sim/time/doing.js';
import { alertNow, KLAXON_CYCLE_MS } from '../../sim/time/alerts.js';
import { airAt } from '../../sim/places/env.js';
import { ROLLOFF, WALL_DB, KLAXON_SOURCE_DB, BUGLE_SOURCE_DB, SPLASH_LP_HZ, SPLASH_DUCK_DB, WORLD_OPEN_HZ, TICK_MAX_HZ, PAN_FULL_M, UI_SOUNDS } from '../../data/sounds.js';
import { lowpassHz } from './steps.js';

const TAP_PARTS = new Set(['teeth', 'shave', 'face', 'hands']);

/** Walls between two points of an area by their rooms: 0 the same room, 1 rooms an opening joins, 2 beyond (or no rooms). */
export function wallsBetween(area, a, b) {
  const A = typeof area === 'string' ? areaOf(area) : area;
  if (!A) return 2;
  const ra = roomOf(A, a.x, a.z), rb = roomOf(A, b.x, b.z);
  if (!ra || !rb) return ra === rb ? 0 : 2;
  if (ra.id === rb.id) return 0;
  return (A.openings ?? []).some(o => o.rooms?.includes(ra.id) && o.rooms?.includes(rb.id)) ? 1 : 2;
}

/**
 * The klaxon as you hear it: { gainDb, lowpassHz, distM, walls, pan } for the horn at horn { x, z },
 * you at me { x, z }, in an area of kind kind ('floor'), with walls between, in air of pKpa.
 */
export function klaxonVoice({ horn, me, walls = 0, pKpa, kind = 'floor' }) {
  const dx = horn.x - me.x, dz = horn.z - me.z, d = Math.hypot(dx, dz);
  const roll = ROLLOFF[kind] ?? ROLLOFF.default, distK = 1 / (1 + roll * Math.max(0, d - 1));
  const gainDb = KLAXON_SOURCE_DB + airDb(pKpa) + 20 * Math.log10(distK) + WALL_DB * walls;
  return { gainDb, lowpassHz: lowpassHz(pKpa) / 2 ** walls, distM: d, walls, pan: Math.max(-1, Math.min(1, dx / PAN_FULL_M)) };
}

/** The splash's muffle on the world: { k, lowpassHz, gainDb } for a splash frame (null: none). The corner eases exponentially. */
export function duckOf(splash) {
  const k = !splash ? 0 : splash.form === 'brief' ? 1 : Math.max(0, Math.min(1, splash.inkK ?? 0));
  return { k, lowpassHz: WORLD_OPEN_HZ * (SPLASH_LP_HZ / WORLD_OPEN_HZ) ** k, gainDb: SPLASH_DUCK_DB * k };
}

/** The watch's tick in a splash: tick(minute, nowS) → whether to tick now (a new shown minute, at most TICK_MAX_HZ). */
export function createTicker({ maxHz = TICK_MAX_HZ } = {}) {
  let lastMin = null, lastS = -Infinity;
  return {
    tick(shownMs, nowS) {
      const m = Math.floor(shownMs / MIN_MS);
      if (lastMin === null) { lastMin = m; return false; }
      if (m <= lastMin || nowS - lastS < 1 / maxHz - 1e-9) return false;
      lastMin = m; lastS = nowS;
      return true;
    },
    reset() { lastMin = null; lastS = -Infinity; },
  };
}

/** The loops that should play at ms: { water, tap, clippers } from the activity under way (time's activityNow). */
export function loopsAt(state, ms) {
  let a = null;
  try { a = activityNow(state, ms); } catch { a = null; }
  if (!a) return { water: false, tap: false, clippers: false };
  const atSink = /sink|fountain/.test(a.fixtureId ?? '') || /sink|fountain/.test(a.spotId ?? '');
  return { water: a.id === 'shower' && a.part === 'water', tap: TAP_PARTS.has(a.part) || (a.id === 'drink' && atSink), clippers: a.part === 'clip' };
}

/** The world's sounds over an engine (engine.js's world handle): { frame(state, { splash, nowS }), fact(type, payload, state), stats }. */
export function createWorld(engine) {
  const ticker = createTicker();
  const stats = { water: false, tap: false, clippers: false, flushes: 0, klaxons: 0, bugles: 0, ticks: 0, ui: 0, lastUi: null, duckK: 0, lastKlaxon: null, lastBugle: null };
  let lastCycle = null, lastDrill = null, lastSplashId = null;

  function frame(state, { splash = null, nowS = 0 } = {}) {
    const me = state ? playerActor(state) : null;
    const d = duckOf(splash);
    stats.duckK = d.k;
    engine.duck(d);
    if (!state || !me) { engine.loopOff('water'); engine.loopOff('tap'); engine.loopOff('clippers'); stats.water = stats.tap = stats.clippers = false; return; }
    // (the air of where you are, the place's (src/sim/places/env.js airAt): the loops, the tap and the klaxon play only indoors, where you are)
    const ms = splash ? splash.shownMs : state.clock.ms, pKpa = airAt(state, null, me.x, me.z).pKpa;
    // (the water and the tap: on while their part runs at the time shown)
    const on = loopsAt(state, ms);
    if (on.water) engine.loopOn('water', 'water', { gainDb: airDb(pKpa), lowHz: lowpassHz(pKpa) }); else engine.loopOff('water');
    if (on.tap) engine.loopOn('tap', 'tap', { gainDb: airDb(pKpa), lowHz: lowpassHz(pKpa) }); else engine.loopOff('tap');
    if (on.clippers) engine.loopOn('clippers', 'clippers', { gainDb: airDb(pKpa), lowHz: lowpassHz(pKpa) }); else engine.loopOff('clippers');
    stats.water = on.water; stats.tap = on.tap; stats.clippers = on.clippers;
    // (the klaxon: a whoop at each of the horn's cycles while it sounds, heard through the walls)
    let alert = null;
    try { alert = alertNow(state, ms); } catch { alert = null; }
    if (alert?.hornOn && alert.horn?.area === state.places?.live?.area) {
      const cycle = Math.floor((ms - alert.atMs) / KLAXON_CYCLE_MS);
      if (alert.drill !== lastDrill || cycle !== lastCycle) {
        lastDrill = alert.drill; lastCycle = cycle;
        const area = areaOf(alert.horn.area), walls = wallsBetween(area, alert.horn, me);
        const v = klaxonVoice({ horn: alert.horn, me, walls, pKpa, kind: area?.kind ?? 'floor' });
        if (engine.oneShot('klaxon', { gainDb: v.gainDb, lowHz: v.lowpassHz, pan: v.pan })) { stats.klaxons++; stats.lastKlaxon = { gainDb: Math.round(v.gainDb * 10) / 10, lowpassHz: Math.round(v.lowpassHz), walls, distM: Math.round(v.distM * 100) / 100 }; }
      }
    } else if (!alert) { lastCycle = null; }
    // (the splash's watch: a tick a shown minute, at most TICK_MAX_HZ)
    if (splash && (splash.phase === 'lapse' || splash.phase === 'decel')) {
      if (splash.id !== lastSplashId) { lastSplashId = splash.id; ticker.reset(); }
      if (ticker.tick(splash.shownMs, nowS) && engine.uiShot('tick')) stats.ticks++;
    } else if (!splash) { lastSplashId = null; ticker.reset(); }
  }

  function fact(type, payload, state) {
    // (the R menu's sounds, on the UI bus: a card is up and the world paused, so no state is needed)
    if (type === 'ui') {
      const kind = UI_SOUNDS[payload?.kind];
      const ok = !!kind && !!engine.uiShot(kind);
      if (ok) { stats.ui++; stats.lastUi = payload.kind; }
      return ok;
    }
    if (!state) return false;
    const me = playerActor(state);
    if (type === 'body-event' && (payload?.kind === 'void' || payload?.kind === 'bowel') && payload.who === playerId(state) && me) {
      const room = roomOf(state.places?.live?.area, me.x, me.z);
      if (!room || !/head/.test(room.id)) return false;
      const pKpa = airAt(state, null, me.x, me.z).pKpa, ok = engine.oneShot('flush', { gainDb: airDb(pKpa), lowHz: lowpassHz(pKpa) });
      if (ok) stats.flushes++;
      return ok;
    }
    if (type === 'reveille' && me && areaOf(state.places?.live?.area)?.kind === 'floor') {
      const pKpa = airAt(state, null, me.x, me.z).pKpa, ok = engine.oneShot('bugle', { gainDb: BUGLE_SOURCE_DB + airDb(pKpa), lowHz: lowpassHz(pKpa) });
      if (ok) { stats.bugles++; stats.lastBugle = { atMs: payload?.atMs ?? null }; }
      return ok;
    }
    return false;
  }

  return { frame, fact, stats };
}
