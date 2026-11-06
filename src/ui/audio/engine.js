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
// stats: { state (the context's, or 'none'), started, baked (every sound rendered), steps, doors,
// dropped (past VOICES_MAX), late (foot-falls too late to play), voices, voicesMax, volume, muted,
// master (the master gain's target), sampleRate, last, prepareMs (the context's making, at boot),
// startMs (the gesture's start(): a resume), startedAt (when it ran, performance.now()) }.
import { hash01, hashInt } from '../../core/hash.js';
import { isHeld, TICK_MS } from '../../core/clock.js';
import { playerActor } from '../../core/ids.js';
import * as places from '../../sim/places/model.js';
import { airDb } from '../../sim/people/hearing.js';
import { STEPS, DOORS, VOICES_MAX, MASTER_DEFAULT, AIR_KPA, ROLLOFF, PAN_FULL_M } from '../../data/sounds.js';
import { render } from './synth.js';
import { createStepScheduler, stepVoice, lowpassHz, MARS_G } from './steps.js';

/** The limiter's knee on the master (dBFS). */
export const LIMIT_DB = -3;
/** The most of a frame the sounds' rendering may take after the first key (ms). */
export const BAKE_FRAME_MS = 3;
const dbToK = (db) => 10 ** (db / 20);
const clamp01 = (v) => Math.min(1, Math.max(0, Number(v)));

/** The audio presenter (see the header). profile: { volume, muted } (the saved profile's audio). */
export function createAudio({ profile = null, AudioContextClass = globalThis.AudioContext ?? globalThis.webkitAudioContext } = {}) {
  let ctx = null, master = null, world = null, limiter = null;
  let volume = Number.isFinite(profile?.volume) ? clamp01(profile.volume) : MASTER_DEFAULT, muted = !!profile?.muted;
  const buffers = { step: {}, door: {} };
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
  const toBake = [];
  function bakeSome() {
    const t0 = globalThis.performance?.now?.() ?? 0;
    while (toBake.length && (globalThis.performance?.now?.() ?? 0) - t0 < BAKE_FRAME_MS) {
      const [into, kind, recipe, v] = toBake.shift(), sr = ctx.sampleRate;
      const samples = render(recipe, { sampleRate: sr, name: kind, variant: v }), b = ctx.createBuffer(1, samples.length, sr);
      b.copyToChannel(samples, 0);
      (into[kind] ??= []).push(b);
    }
    stats.baked = !toBake.length;
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
      world.connect(master); master.connect(limiter); limiter.connect(ctx.destination);
      for (const [table, into] of [[STEPS, buffers.step], [DOORS, buffers.door]]) for (const [kind, recipe] of Object.entries(table)) for (let v = 0; v < (recipe.variants ?? 1); v++) toBake.push([into, kind, recipe, v]);
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

  // (one voice: a buffer, at a time on the audio clock, through the air's low-pass, a gain and a pan)
  function play(buffer, { atS, gainDb, lowHz, rate = 1, pan = 0 }) {
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
    tail.connect(world);
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

  let lastState = null;
  /** A frame: the foot-falls the player's walk has reached, played where the drawn feet fall. */
  function frame(state, alpha = 0, nowS = 0) {
    if (toBake.length) bakeSome();
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
    dispose() { try { ctx?.close(); } catch { /* (already closed) */ } ctx = null; master = world = limiter = null; stats.state = 'closed'; },
  };
}
