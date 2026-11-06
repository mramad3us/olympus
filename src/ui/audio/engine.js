// OLYMPUS audio: the engine, WebAudio's graph and the sounds the frame and the bus ask for.
//
// The presenter's ear (VIEWS §11.1: "the sim decides, audio presents"): it reads the state each frame
// and hears facts from the bus, and never writes either. createAudio({ profile }) makes nothing until
// prepare(), which main.js calls at boot behind the title: it creates the context and the graph,
// suspended (the browsers' autoplay rule: an AudioContext made before a gesture starts suspended, and
// plays nothing). start(), on the first key or click, only resumes it, which is asynchronous: the
// context's construction opens the audio device synchronously, 219 to 233 ms measured on the first
// key in v0.0.3's first build (the review: the first step stuttered), so it is paid behind the title
// now (start() still makes the context itself if prepare() never ran). stats.startMs is how long the
// gesture's start() took. The sounds, every recipe of src/data/sounds.js rendered by synth.js into
// AudioBuffers, each kind in its variants, are rendered over the frames after, BAKE_FRAME_MS (3 ms) of
// each at most. The
// graph is VIEWS §11.2's, cut to what plays this round: the world bus into the master (the profile's
// volume, squared so the slider's middle sounds like the middle: my call; 0 when muted), then a
// limiter (a compressor at −3 dBFS, ratio 20), then the speakers.
//
// A voice is a buffer source at a rate jittered by hash (±4%, so a run of steps is not one sample
// again and again), through a low-pass at the air's corner and a gain, panned for a sound not your
// own, onto the world bus; at most VOICES_MAX (48) at once, a sound past that dropped and counted.
//
// frame(state, alpha, nowS) (every frame, after the view): the player's actor's stride, gait and
// step through the footsteps' scheduler (steps.js), each foot-fall played at its moment on the
// audio clock (its offset from the frame's real time nowS, a tick ahead at most), with stepVoice's
// recipe, gain and filter for the surface under the feet (places' surfaceAt), the site's gravity
// (its record's gravity.gG) and the air (src/data/sounds.js AIR_KPA by the area's kind). Nothing
// plays while time stands still, while a skip runs, or before start(). door(fact) (the places' door
// fact { id, area, x, z, state, kind }) plays the leaf opening or closing where it is: inverse
// distance from 1 m with the area's rolloff (1.5 indoors, 1 outdoors, VIEWS §11.2), panned by its
// offset east or west of you, through the same air.
//
// The 0.0.4 round's world (world.js, the build sheet §2.4): the world bus runs through a low-pass and
// a duck gain before the master, so a splash muffles the world (duck({ lowpassHz, gainDb }), eased with
// setTargetAtTime), and a UI bus beside it carries the splash's watch tick, unmuffled. loopOn(key,
// kind, opts) and loopOff(key) hold a looping voice (the shower's water, the tap) faded in and out
// over LOOP_FADE_S; oneShot(kind, opts) plays the flush, the klaxon's whoop, the bugle on the world
// bus, uiShot(kind) the tick on the UI bus. fact(type, payload, state) hands the bus's facts to the
// world (the flush, reveille's bugle). The world's recipes are rendered at their own rate (WORLD_RATE_HZ,
// 24 kHz: Melas's air takes everything over 5.2 kHz anyway), after the steps' and the doors'.
//
// stats: { state (the context's, or 'none'), started, baked (every sound rendered), steps, doors,
// dropped (past VOICES_MAX), late (foot-falls too late to play), voices, voicesMax, volume, muted,
// master (the master gain's target), sampleRate, last, prepareMs (the context's making, at boot),
// startMs (the gesture's start(): a resume), startedAt (when it ran, performance.now()) }.
import { hash01, hashInt } from '../../core/hash.js';
import { isHeld, TICK_MS } from '../../core/clock.js';
import { playerActor } from '../../core/ids.js';
import * as places from '../../sim/places/model.js';
import { airDb } from '../../sim/people/hearing.js';
import { STEPS, DOORS, WORLD, VOICES_MAX, MASTER_DEFAULT, AIR_KPA, ROLLOFF, PAN_FULL_M, WORLD_OPEN_HZ, LOOP_FADE_S } from '../../data/sounds.js';
import { renderSteps } from './synth.js';
import { createStepScheduler, stepVoice, lowpassHz, MARS_G } from './steps.js';
import { createWorld } from './world.js';

/** The limiter's knee on the master (dBFS). */
export const LIMIT_DB = -3;
/** The most of a frame the sounds' rendering may take after the first key (ms). */
export const BAKE_FRAME_MS = 3;
const dbToK = (db) => 10 ** (db / 20);
const clamp01 = (v) => Math.min(1, Math.max(0, Number(v)));

/** The audio presenter (see the header). profile: { volume, muted } (the saved profile's audio). */
export function createAudio({ profile = null, AudioContextClass = globalThis.AudioContext ?? globalThis.webkitAudioContext } = {}) {
  let ctx = null, master = null, world = null, limiter = null, worldLp = null, duckGain = null, uiBus = null;
  let volume = Number.isFinite(profile?.volume) ? clamp01(profile.volume) : MASTER_DEFAULT, muted = !!profile?.muted;
  const buffers = { step: {}, door: {}, world: {} };
  const loops = new Map();                                         // (key → a looping voice: { src, g, lp, kind })
  let duckSig = '';
  const steps = createStepScheduler();
  let voices = 0;
  const stats = { state: 'none', started: false, baked: false, steps: 0, doors: 0, dropped: 0, late: 0, voices: 0, voicesMax: 0, volume, muted, master: 0, sampleRate: 0, last: null, prepareMs: null, startMs: null, startedAt: null };
  const perfNow = () => globalThis.performance?.now?.() ?? 0;

  const gainOf = () => (muted ? 0 : volume * volume);
  function applyMaster() {
    stats.volume = volume; stats.muted = muted; stats.master = gainOf();
    if (!master) return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(gainOf(), ctx.currentTime);
  }

  // (the sounds rendered a few at a time, BAKE_FRAME_MS of a frame at most, so the first key never
  // hitches the picture; a foot-fall before its surface is ready is left silent)
  // (a recipe is rendered a layer at a time, renderSteps: one taking longer than a frame's budget goes on the next frame)
  const toBake = [];
  let baking = null;
  function bakeSome() {
    const t0 = perfNow();
    while ((baking || toBake.length) && perfNow() - t0 < BAKE_FRAME_MS) {
      if (!baking) {
        const [into, kind, recipe, v] = toBake.shift(), sr = recipe.rateHz ? Math.min(ctx.sampleRate, recipe.rateHz) : ctx.sampleRate;
        baking = { into, kind, sr, it: renderSteps(recipe, { sampleRate: sr, name: kind, variant: v }) };
      }
      const r = baking.it.next();
      if (!r.done) continue;
      const b = ctx.createBuffer(1, r.value.length, baking.sr);
      b.copyToChannel(r.value, 0);
      (baking.into[baking.kind] ??= []).push(b);
      baking = null;
    }
    stats.baked = !toBake.length && !baking;
  }

  /** The context and the graph made, suspended until start(): at boot, behind the title (see the header). Safe to call again. */
  function prepare() {
    if (!AudioContextClass) { stats.state = 'unavailable'; return null; }
    if (!ctx) {
      const t0 = perfNow();
      ctx = new AudioContextClass({ latencyHint: 'interactive' });
      limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = LIMIT_DB; limiter.knee.value = 0; limiter.ratio.value = 20; limiter.attack.value = 0.003; limiter.release.value = 0.12;
      master = ctx.createGain(); world = ctx.createGain();
      // (the world through the splash's muffle: a low-pass, open at WORLD_OPEN_HZ, and a duck gain; the UI bus beside it)
      worldLp = ctx.createBiquadFilter(); worldLp.type = 'lowpass'; worldLp.frequency.value = WORLD_OPEN_HZ; worldLp.Q.value = Math.SQRT1_2;
      duckGain = ctx.createGain(); uiBus = ctx.createGain();
      world.connect(worldLp); worldLp.connect(duckGain); duckGain.connect(master); uiBus.connect(master);
      master.connect(limiter); limiter.connect(ctx.destination);
      for (const [table, into] of [[STEPS, buffers.step], [DOORS, buffers.door], [WORLD, buffers.world]]) for (const [kind, recipe] of Object.entries(table)) for (let v = 0; v < (recipe.variants ?? 1); v++) toBake.push([into, kind, recipe, v]);
      applyMaster();
      stats.sampleRate = ctx.sampleRate; stats.prepareMs = perfNow() - t0;
      ctx.onstatechange = () => { stats.state = ctx.state; };
    }
    stats.state = ctx.state;
    return ctx;
  }

  /** The context resumed: on the first key or click (autoplay). Made here only if prepare() never ran. Safe to call again. */
  function start() {
    const t0 = perfNow();
    if (!prepare()) return null;
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    if (!stats.started) { stats.started = true; stats.startMs = perfNow() - t0; stats.startedAt = t0; }
    stats.state = ctx.state;
    return ctx;
  }
  const running = () => !!ctx && ctx.state === 'running';

  // (one voice: a buffer, at a time on the audio clock, through the air's low-pass, a gain and a pan, onto a bus)
  function play(buffer, { atS, gainDb, lowHz, rate = 1, pan = 0, bus = null }) {
    if (voices >= VOICES_MAX) { stats.dropped++; return false; }
    const src = ctx.createBufferSource();
    src.buffer = buffer; src.playbackRate.value = rate;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = lowHz; lp.Q.value = Math.SQRT1_2;
    const g = ctx.createGain();
    g.gain.value = dbToK(gainDb);
    src.connect(lp); lp.connect(g);
    let tail = g;
    if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p); tail = p; }
    tail.connect(bus ?? world);
    voices++; stats.voices = voices; stats.voicesMax = Math.max(stats.voicesMax, voices);
    src.onended = () => { voices--; stats.voices = voices; src.disconnect(); lp.disconnect(); g.disconnect(); if (tail !== g) tail.disconnect(); };
    src.start(Math.max(ctx.currentTime, atS));
    return true;
  }

  // (where the player stands: the site's gravity and the air of the area's kind)
  function here(state) {
    const live = state.places?.live, area = live ? places.areaOf(live.area) : null, site = live ? places.siteOf(live.site) : null;
    const kind = area?.kind === 'ground' ? 'ground' : area ? 'floor' : 'default';
    return { area, kind, gG: site?.gravity?.gG ?? MARS_G, pKpa: AIR_KPA[kind] ?? AIR_KPA.default };
  }

  // ---- the world's loops and one-shots (world.js asks for them) ----
  const worldOps = {
    /** A looping voice on (or its level moved): key, kind (WORLD's), { gainDb, lowHz, pan }. */
    loopOn(key, kind, { gainDb = 0, lowHz = WORLD_OPEN_HZ, pan = 0 } = {}) {
      if (!running()) return false;
      const t = ctx.currentTime, k = dbToK(gainDb);
      let L = loops.get(key);
      if (L) { L.g.gain.setTargetAtTime(k, t, LOOP_FADE_S / 3); return true; }
      const set = buffers.world[kind];
      if (!set?.length || voices >= VOICES_MAX) { if (set?.length) stats.dropped++; return false; }
      const src = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = set[0]; src.loop = true;
      lp.type = 'lowpass'; lp.frequency.value = lowHz; lp.Q.value = Math.SQRT1_2;
      g.gain.setValueAtTime(0, t); g.gain.setTargetAtTime(k, t, LOOP_FADE_S / 3);
      src.connect(lp); lp.connect(g);
      let tail = g;
      if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p); tail = p; }
      tail.connect(world);
      src.start(t);
      voices++; stats.voices = voices; stats.voicesMax = Math.max(stats.voicesMax, voices);
      src.onended = () => { voices--; stats.voices = voices; src.disconnect(); lp.disconnect(); g.disconnect(); if (tail !== g) tail.disconnect(); };
      loops.set(key, { src, g, lp, kind });
      stats.loops = loops.size;
      return true;
    },
    /** A looping voice faded out and stopped. */
    loopOff(key) {
      const L = loops.get(key);
      if (!L) return false;
      loops.delete(key);
      stats.loops = loops.size;
      if (!ctx) return false;
      const t = ctx.currentTime;
      L.g.gain.cancelScheduledValues(t); L.g.gain.setTargetAtTime(0, t, LOOP_FADE_S / 3);
      try { L.src.stop(t + LOOP_FADE_S * 2); } catch { /* (already stopped) */ }
      return true;
    },
    /** A world sound once, now: kind (WORLD's), { gainDb, lowHz, pan }. */
    oneShot(kind, { gainDb = 0, lowHz = WORLD_OPEN_HZ, pan = 0 } = {}) {
      if (!running()) return false;
      const set = buffers.world[kind];
      if (!set?.length) return false;
      const ok = play(set[hashInt(set.length, 'world', kind, stats.oneShots ?? 0)], { atS: ctx.currentTime, gainDb, lowHz, pan });
      if (ok) { stats.oneShots = (stats.oneShots ?? 0) + 1; stats.last = { what: kind, gainDb: Math.round(gainDb * 10) / 10, lowpassHz: Math.round(lowHz) }; }
      return ok;
    },
    /** A UI sound once, now, on the UI bus (the splash's tick: never muffled). */
    uiShot(kind) {
      if (!running()) return false;
      const set = buffers.world[kind];
      if (!set?.length) return false;
      return play(set[hashInt(set.length, 'ui', kind, stats.uiShots = (stats.uiShots ?? 0) + 1)], { atS: ctx.currentTime, gainDb: 0, lowHz: WORLD_OPEN_HZ, bus: uiBus });
    },
    /** The world's muffle: { lowpassHz, gainDb } (duckOf's), eased; written only when it changes. */
    duck({ lowpassHz: hz = WORLD_OPEN_HZ, gainDb = 0 } = {}) {
      if (!ctx || !worldLp) return;
      const sig = `${Math.round(hz)}|${gainDb.toFixed(2)}`;
      if (sig === duckSig) return;
      duckSig = sig;
      const t = ctx.currentTime;
      worldLp.frequency.setTargetAtTime(hz, t, 0.03);
      duckGain.gain.setTargetAtTime(dbToK(gainDb), t, 0.03);
      stats.duck = { lowpassHz: Math.round(hz), gainDb: Math.round(gainDb * 10) / 10 };
    },
  };
  const worldSounds = createWorld(worldOps);
  stats.world = worldSounds.stats;

  let lastState = null;
  /** A frame: the foot-falls the player's walk has reached, played where the drawn feet fall; the world's sounds; the splash's muffle. */
  function frame(state, alpha = 0, nowS = 0, { splash = null } = {}) {
    if (toBake.length || baking) bakeSome();
    if (running()) { try { worldSounds.frame(state, { splash, nowS }); } catch (e) { stats.worldError = String(e?.message ?? e); } }
    const a = state ? playerActor(state) : null;
    // (another state, a load or a new career: the feet start afresh, never a burst of the strides between)
    if (state !== lastState) { steps.reset(); lastState = state; }
    if (!a) { steps.reset(); return; }
    const live = running() && !isHeld(state) && !state.skip;
    const stepM = Math.hypot(a.x - (a.$px ?? a.x), a.z - (a.$pz ?? a.z));
    const falls = steps.frame({ strideM: a.strideM ?? 0, stepM, gait: a.gait ?? 'idle', alpha, nowS, tickS: TICK_MS / 1000, live });
    stats.late = steps.stats.dropped;
    if (!falls.length) return;
    const h = here(state);
    let surface = 'concrete';
    try { surface = places.surfaceAt?.(state, a.x, a.z) ?? surface; } catch { /* (no surface known here: concrete) */ }
    for (const f of falls) {
      const voice = stepVoice(surface, f.gait, { gG: h.gG, pKpa: h.pKpa }), set = buffers.step[voice.kind];
      if (!set?.length) continue;
      const atS = ctx.currentTime + Math.max(0, f.atS - nowS);
      const jitterDb = (hash01('step-db', f.n) - 0.5) * 3, rate = 1 + (hash01('step-rate', f.n) - 0.5) * 0.08;
      if (play(set[hashInt(set.length, 'step', f.n)], { atS, gainDb: voice.gainDb + jitterDb, lowHz: voice.lowpassHz, rate, pan: f.n % 2 ? 0.05 : -0.05 })) {
        stats.steps++;
        stats.last = { what: 'step', surface, kind: voice.kind, gainDb: voice.gainDb, lowpassHz: voice.lowpassHz, gait: f.gait, aheadS: Math.round((atS - ctx.currentTime) * 1000) / 1000 };
      }
    }
  }

  /** A door's leaf moving (the door fact): its sound where it is, if it is in your area. */
  function door(fact, state = null) {
    if (!running() || !fact) return false;
    const me = state ? playerActor(state) : null, h = state ? here(state) : { kind: 'default', pKpa: AIR_KPA.default };
    if (state && fact.area && state.places?.live?.area && fact.area !== state.places.live.area) return false;
    const dx = me && Number.isFinite(fact.x) ? fact.x - me.x : 0, dz = me && Number.isFinite(fact.z) ? fact.z - me.z : 0, d = Math.hypot(dx, dz);
    const roll = ROLLOFF[h.kind] ?? ROLLOFF.default, distK = 1 / (1 + roll * Math.max(0, d - 1));
    const set = buffers.door[fact.state === 'closed' ? 'close' : 'open'];
    if (!set?.length) return false;
    const gainDb = airDb(h.pKpa) + 20 * Math.log10(distK), rate = fact.kind === 'extDoor' ? 0.86 : 1;
    const ok = play(set[hashInt(set.length, 'door', fact.id ?? '', state?.clock?.ms ?? 0)], { atS: ctx.currentTime, gainDb, lowHz: lowpassHz(h.pKpa), rate, pan: dx / PAN_FULL_M });
    if (ok) { stats.doors++; stats.last = { what: 'door', id: fact.id, state: fact.state, gainDb: Math.round(gainDb * 10) / 10, distM: Math.round(d * 100) / 100 }; }
    return ok;
  }

  return {
    prepare, start, frame, door,
    /** A bus fact the world's sounds hear (the flush's body-event, reveille's bugle): fact(type, payload, state). */
    fact(type, payload, state) { return running() ? worldSounds.fact(type, payload, state) : false; },
    /** The master volume, 0 to 1. */
    setVolume(v) { volume = clamp01(v); applyMaster(); },
    /** Mute, or not. */
    setMuted(on) { muted = !!on; applyMaster(); },
    get volume() { return volume; },
    get muted() { return muted; },
    get context() { return ctx; },
    /** The master gain's value now (0 when muted), as the graph has it. */
    get masterGain() { return master ? master.gain.value : gainOf(); },
    stats,
    dispose() { try { ctx?.close(); } catch { /* (already closed) */ } ctx = null; master = world = limiter = worldLp = duckGain = uiBus = null; loops.clear(); stats.state = 'closed'; },
  };
}
