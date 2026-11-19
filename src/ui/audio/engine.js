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
// recipe, gain and filter for the surface under the feet (places' surfaceAt), the place's gravity
// and air (src/sim/places/env.js envAt: the one helper for each, TECH §1.4). Nothing
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
// The 0.0.5 round's range (range.js, the build sheet §2.4): RANGE's recipes (the report, the action's
// clicks, the case's tick, the tower's chime) baked after the world's, and shot(kind, { delayS, gainDb,
// lowHz, pan, rate }) plays one on the world bus now or delayS later (the berm's slap-back); fact() hands
// the shot, step and say facts to it, and frame() lets it play the clicks and ticks the drawn clock has
// passed. createAudio({ looks }) gives it arms' kitLook (the ear defenders), from main.js.
//
// The 0.0.7 round's (range.js, the build sheet 0.0.7 §2.5 (d)): RANGE gains the crack, the strike's thump and the
// carrier's rattle, baked with the rest; the reports and echoes go through range.js's voices' limit on this
// context's clock (REPORT_VOICES at once), under the engine's own VOICES_MAX; fact() hears the 'pit' fact too.
//
// The 0.0.9 round's (bang.js, the build sheet 0.0.9 §2.3; VIEWS §11.2): CHAOS's recipes (the bang's report, the whine, the
// heart, the breath) baked after the range's; the world bus runs on through a second stage, the chaos's (a low-pass and a
// gain: felt's band and the deafness, chaos({ lowpassHz, gainDb }), eased), after the splash's muffle, so the two compose;
// three buses beside it straight to the master: the body's (your breath and heart), the ear's (the whine: in the head, so
// no muffle of the world takes it) and the voice's (a voice round the deafness, bang.js voiceRoute). bang(kind, opts) plays
// a CHAOS recipe on the world bus now or delayS later; loop(key, kind, bus, gainDb) holds a looping CHAOS voice on a bus at
// a level (null: faded out). fact() hands the 'fx' fact to it; frame(state, alpha, nowS, { splash, chaos }) the reading
// (main.js's supp.js suppNow), and caption() the deafness's caption once.
// 0.0.18 (blast.js, the build sheet 0.0.18 §11): the kit's bursts in the shoot house (a G-11's 'bang', a charge's 'blast') go to
// blast.js instead, on the same ops and recipe, through the combat EVA suit's gate; the bay's bangs stay bang.js's.
//
// The 0.0.10 round's (stress.js, the build sheet 0.0.10 §2.3; VIEWS §11.2, §11.3): STRESS's recipes (the air horn's blast, Breathe's
// box breath) baked after the chaos's; stress(kind, opts) plays one on the world bus now or delayS later, the blanks' reports are
// the range's 'report' through shot(); fact() hands the 'fx' facts of kind 'horn' and 'blank' to it, and frame(…, { breathing })
// holds the box breath on the body bus while Breathe runs, the band's quick breath held off then (bang.js).
//
// The 0.0.16 round's (gun.js, mix.js; the user, 2026-11-15: "guns should bang harder and closer to realistic ... steps are too
// loud"): two sounds, chosen once at createAudio by its sound option, else the page's URL (&sound=old: soundModeOf):
//   'new'  the default: the shot rebuilt (gun.js: the blast, the crack, the action, the space's answer, the electronic
//          protection), its voices on the gun bus straight into the splash's muffle (past the hall's send: they carry
//          their own space), baked after the steps (GUN_RATE_HZ for the dry parts, TAIL_RATE_HZ for the tails, a stage at a
//          time within BAKE_FRAME_MS); the steps STEP_TRIM_DB under and by the stance (steps.js stepTrimDb); and the master
//          mix.js MASTER: the compressor at −6 dBFS, ratio 20, 1 ms, its make-up taken back by a trim, then a soft clip
//          (a WaveShaper), so nothing clips however many shots;
//   'old'  v0.0.15's sound as it was, to hear the difference (the report recipe, the steps at their old level, MASTER_OLD).
// gun(voice) plays one of gun.js's voices ({ key, delayS, gainDb, lowHz, pan, rate }): range.js and stress.js ask for them.
//
// The 0.0.20 round's shot (the build sheet v0.0.20 item 2, §0 item 21): the new sound's shot is one of src/data/sounds.js
// SHOT_CANDIDATES, chosen per scene, not once: setShot(id) (main.js at each scene's start: the URL's &shot, else the To score
// pick, else A3 in the house's scenes (SHOT_SCENES), else A1; and the To score row live). A1's parts are baked at prepare as
// v0.0.17's were; another candidate's are baked under its own keys (gun.js gunBakes(id)) in the same BAKE_FRAME_MS slices
// when it is first asked, and the shot playing stays the one before until the new one's every part is whole (no silence, no
// hitch). A0 is &sound=old's report: the shot facts go to a second range presenter made without the gun handle (range.js's old
// path), everything else as before. stats.shot is the candidate playing, stats.shotWant the one asked.
//
// And the house speaks (the build sheet v0.0.20 item 7): house.js asks voice(text, { voice, register, set, atS, gainDb, lowHz,
// pan }) for a line said at atS on the audio clock (its speaker's queue is house.js's). A line is voice.js's render, baked
// once per set, speaker, register and text: the fixed lines (house.js fixedLines: the tower's PA lines, the team's calls) at the
// first key in BAKE_FRAME_MS slices after the sounds; any other line when it is first said, ahead of every other bake, at most
// one begun a frame (a long one goes on over the frames after), and played when whole, at its time or at once if its time has
// passed (stats.voices.late). The instructor, the #2 and a role-player on the world bus (the hall's reverb answers them); your
// own voice on the voice bus, dry, in your helmet. setVoice(set) (the To score page's Voice row; createAudio's voice, &voice=)
// changes the set: 'a' is v0.0.19's stand-ins, no voice baked.
//
// v0.0.21 (the build sheet §1 item 12; the perf lens's P7): BAKE_FRAME_MS was checked between parts, so a part rendered whole: the
// v0.0.18 release log's longest slice was 13.6 ms, and a 4 s loop's layer 5.2 ms at once. Every renderer now yields every
// BAKE_CHUNK_SAMPLES (4,096: synth.js renderSteps, gun.js's generators, voice.js lineGen; the same samples, held by the tests'
// digests), so a slice ends within BAKE_FRAME_MS and a chunk; stats.bake keeps its slices, the longest and the frame it fell
// in, and the tests hold it under BAKE_SLICE_MAX_MS 5 × k. The bake runs in frame(), which main.js calls after the view's draw.
// A templated line is queued like a part and spoken when whole: stats.voice.delayMaxMs is the longest wait between its asking and
// its sound. prebakeCallouts(texts) queues your number two's call-outs a lane's turners can draw (combat/two.js calloutLines: each
// face's word at each place, the closed set), behind the lines said, so at "Rifle, far left!" the line is already whole.
//
// stats: { state (the context's, or 'none'), started, baked (every sound rendered), steps, doors,
// dropped (past VOICES_MAX), late (foot-falls too late to play), voices, voicesMax, volume, muted,
// master (the master gain's target), sampleRate, last, prepareMs (the context's making, at boot),
// startMs (the gesture's start(): a resume), startedAt (when it ran, performance.now()) }.
import { hash01, hashInt } from '../../core/hash.js';
import { isHeld, TICK_MS } from '../../core/clock.js';
import { playerActor } from '../../core/ids.js';
import * as places from '../../sim/places/model.js';
import { envAt } from '../../sim/places/env.js';
import { airDb } from '../../sim/people/hearing.js';
import { STEPS, DOORS, WORLD, RANGE, CHAOS, STRESS, HOUSE, HALL, SUIT_SCUFF_DB, VOICES_MAX, MASTER_DEFAULT, ROLLOFF, PAN_FULL_M, WORLD_OPEN_HZ, LOOP_FADE_S } from '../../data/sounds.js';
import { renderSteps, BAKE_CHUNK_SAMPLES } from './synth.js';
import { createStepScheduler, stepVoice, lowpassHz, stepTrimDb } from './steps.js';
import { createWorld } from './world.js';
import { createRange } from './range.js';
import { createBang } from './bang.js';
import { createBlast, BLAST_RECIPES } from './blast.js';
import { createStress } from './stress.js';
import { createHouse, fixedLines, registerOf } from './house.js';
import { lineGen } from './voice.js';
import { VOICE_SET, VOICE_DEFAULT, VOICE_RATE_HZ } from '../../data/voices.js';
import { createMarking } from './marking.js';
import { gunBakes, shotKey, GUN_RATE_HZ, TAIL_RATE_HZ } from './gun.js';
import { SHOT_CANDIDATES, SHOT_DEFAULT } from '../../data/sounds.js';
import { MASTER, MASTER_OLD, makeupDb, clipCurve, CLIP_PRE } from './mix.js';
import { readParams } from '../../core/debug.js';

/** The limiter's knee on the master (dBFS). */
export const LIMIT_DB = -3;
/** The most of a frame the sounds' rendering may take after the first key (ms): no part begun past it. */
export const BAKE_FRAME_MS = 3;
/** The longest a bake's slice may take (ms × the machine's k: the tests' bound, v0.0.21): BAKE_FRAME_MS and one chunk of BAKE_CHUNK_SAMPLES. */
export const BAKE_SLICE_MAX_MS = 5;
/** Every renderer yields every this many samples (synth.js's, v0.0.21). */
export { BAKE_CHUNK_SAMPLES };
const dbToK = (db) => 10 ** (db / 20);
/** The sound a page asks for (v0.0.16): 'old' with &sound=old in its query, else 'new'; read by the game's one reader of the URL (core/debug.js readParams), main.js passing it to createAudio. */
export function soundModeOf(search = globalThis.location?.search ?? '') {
  try { return readParams(String(search ?? '')).sound === 'old' ? 'old' : 'new'; } catch { return 'new'; }
}
const clamp01 = (v) => Math.min(1, Math.max(0, Number(v)));

/** The audio presenter (see the header). profile: { volume, muted } (the saved profile's audio); looks: { kitLook } (arms' readers, for the range). */
/**
 * The hall's impulse response (0.0.12; HALL: RT60 0.6 s, early reflections off panels 2 to 5 m away): { left, right } Float32Arrays at
 * sampleRate, lenS long: each early reflection a click at its path's delay (there and back at 343 m/s) at HALL.earlyDb less its path's
 * spreading, then a diffuse tail of hashed noise decaying by 60 dB over rt60S, low-passed by a one-pole at HALL.lowpassHz, the two
 * channels decorrelated by their seeds. Pure, deterministic: no Math.random (the hash's own noise).
 */
export function hallImpulse(sampleRate = 48000, hall = HALL) {
  const n = Math.max(1, Math.round(hall.lenS * sampleRate)), out = { left: new Float32Array(n), right: new Float32Array(n) };
  const k = Math.exp(-6.907755 / (hall.rt60S * sampleRate)), a = Math.exp(-2 * Math.PI * hall.lowpassHz / sampleRate);
  for (const [ch, buf] of [['l', out.left], ['r', out.right]]) {
    let env = 1, y = 0;
    for (let i = 0; i < n; i++) { const x = (hash01('hall', ch, i) * 2 - 1) * env; y = (1 - a) * x + a * y; buf[i] = y * 0.35; env *= k; }
    for (const [j, m] of hall.earlyM.entries()) {
      const at = Math.round((2 * m / 343) * sampleRate) + (ch === 'r' ? j * 7 : 0);
      if (at < n) buf[at] += 10 ** (hall.earlyDb / 20) / m * (j % 2 ? -1 : 1);
    }
  }
  return out;
}
// (the impulse as an AudioBuffer of the context)
function hallBuffer(ctx) {
  const r = hallImpulse(ctx.sampleRate), b = ctx.createBuffer(2, r.left.length, ctx.sampleRate);
  b.getChannelData(0).set(r.left); b.getChannelData(1).set(r.right);
  return b;
}

export function createAudio({ profile = null, looks = {}, sound = null, shot = null, voice = null, AudioContextClass = globalThis.AudioContext ?? globalThis.webkitAudioContext } = {}) {
  const mode = sound === 'old' || sound === 'new' ? sound : soundModeOf();
  // (0.0.20: the shot asked and the one playing (see the header); the parts each candidate still lacks, by id)
  let shotWant = SHOT_CANDIDATES[shot] ? shot : SHOT_DEFAULT, shotPlay = SHOT_DEFAULT;
  const shotLeft = new Map();
  let gunBus = null, trim = null, clipper = null;
  let ctx = null, master = null, world = null, limiter = null, worldLp = null, duckGain = null, uiBus = null, hallIn = null, hallConv = null;
  let chaosLp = null, chaosGain = null, bodyBus = null, earBus = null, voiceBus = null, chaosSig = '';
  let volume = Number.isFinite(profile?.volume) ? clamp01(profile.volume) : MASTER_DEFAULT, muted = !!profile?.muted;
  const buffers = { step: {}, door: {}, world: {}, range: {}, chaos: {}, stress: {}, house: {}, gun: {} };
  const loops = new Map();                                         // (key → a looping voice: { src, g, lp, kind })
  let duckSig = '';
  const steps = createStepScheduler();
  let voices = 0;
  let voiceSet = VOICE_SET[voice] ? voice : VOICE_DEFAULT;
  const stats = { bake: { slices: 0, longestMs: 0, sumMs: 0 }, voice: { set: voiceSet, baked: 0, cached: 0, played: 0, late: 0, waiting: 0, bakeMs: 0, delayMaxMs: 0, prebaked: 0 }, sound: mode, shot: mode === 'old' ? 'old' : shotPlay, shotWant: mode === 'old' ? 'old' : shotWant, guns: 0, gunVoices: 0, lastGun: null, state: 'none', started: false, baked: false, steps: 0, doors: 0, dropped: 0, late: 0, voices: 0, voicesMax: 0, volume, muted, master: 0, sampleRate: 0, last: null, prepareMs: null, startMs: null, startedAt: null };
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
  // (whose turn a frame is while lines baked ahead and sounds both wait: they alternate, bakeSome)
  let bakeTurn = false;
  function bakeSome() {
    const t0 = perfNow();
    // (a step begun only where the last one's length still fits the frame's budget, so a slice ends near BAKE_FRAME_MS)
    let stepMs = 0;
    const room = () => perfNow() - t0 + stepMs < BAKE_FRAME_MS;
    // (0.0.20: a line said is baked first, one begun a frame at most)
    let begun = 0;
    // (the v0.0.22 integration: lines baked ahead (the fixed lines, the call-outs: queued at the back) and the sounds take the frames
    // in turn while both wait, so v0.0.22's 91 more fixed lines of the house (house.js fixedLines) never starve a foot-fall or a report
    // at the first key (audio-browser's walk heard nothing on the merged tree) and the tower's lines, first of them, are ready as
    // before; a line said still goes first, every frame)
    const soundsDue = !!baking || toBake.length > 0, aheadTurn = !soundsDue || (bakeTurn = !bakeTurn);
    const voiceTurn = () => (voiceBaking ? !voiceBaking.ahead || aheadTurn : voiceQueue.length > 0 && (!voiceQueue[0].ahead || aheadTurn));
    while (voiceTurn() && room()) {
      if (!voiceBaking) { if (begun++) break; const e = voiceQueue.shift(); voiceBaking = { ...e, it: lineGen(e.text, { voice: e.voice, register: e.register, set: e.set, sampleRate: Math.min(ctx.sampleRate, VOICE_RATE_HZ) }), t: 0 }; }
      const t1 = perfNow(), r = voiceBaking.it.next();
      stepMs = perfNow() - t1;
      stats.voice.bakeMs += stepMs;
      if (!r.done) continue;
      const sr = Math.min(ctx.sampleRate, VOICE_RATE_HZ), b = ctx.createBuffer(1, Math.max(1, r.value.length), sr);
      b.copyToChannel(r.value, 0);
      voiceBufs.set(voiceBaking.key, b); stats.voice.baked++; trimVoices();
      for (const at of voiceWaiting.get(voiceBaking.key) ?? []) { if (Number.isFinite(at.askedMs)) stats.voice.delayMaxMs = Math.max(stats.voice.delayMaxMs, perfNow() - at.askedMs); playVoice(b, at); }
      voiceWaiting.delete(voiceBaking.key); stats.voice.waiting = voiceWaiting.size;
      voiceBaking = null;
    }
    while ((baking || toBake.length) && room()) {
      if (!baking) {
        const e = toBake.shift();
        if (e.gun) {
          // (0.0.16: a gun's part, gun.js's generator: the dry at GUN_RATE_HZ, a tail { left, right } at TAIL_RATE_HZ)
          const sr = Math.min(ctx.sampleRate, GUN_RATE_HZ), tr = Math.min(ctx.sampleRate, TAIL_RATE_HZ);
          baking = { into: buffers.gun, kind: e.gun.key, sr, tr, it: e.gun.steps(e.v, sr, tr), shot: e.shot ?? null };
        } else {
          const [into, kind, recipe, v] = e, sr = recipe.rateHz ? Math.min(ctx.sampleRate, recipe.rateHz) : ctx.sampleRate;
          baking = { into, kind, sr, it: renderSteps(recipe, { sampleRate: sr, name: kind, variant: v }) };
        }
      }
      const t2 = perfNow(), r = baking.it.next();
      stepMs = perfNow() - t2;
      if (!r.done) continue;
      const st = r.value?.left ? r.value : null, b = st ? ctx.createBuffer(2, st.left.length, baking.tr) : ctx.createBuffer(1, r.value.length, baking.sr);
      if (st) { b.copyToChannel(st.left, 0); b.copyToChannel(st.right, 1); } else b.copyToChannel(r.value, 0);
      (baking.into[baking.kind] ??= []).push(b);
      // (0.0.20: a candidate's last part whole: it plays from now if it is the one asked)
      if (baking.shot && shotLeft.has(baking.shot)) { const left = shotLeft.get(baking.shot) - 1; shotLeft.set(baking.shot, left); if (!left && shotWant === baking.shot) setPlaying(baking.shot); }
      baking = null;
    }
    stats.baked = !toBake.length && !baking;
    stats.voice.queued = voiceQueue.length;
    // (the slice's length, the bound the tests hold)
    const ms = perfNow() - t0;
    stats.bake.slices++; stats.bake.sumMs += ms;
    if (ms > stats.bake.longestMs) { stats.bake.longestMs = ms; stats.bake.longestAt = stats.bake.slices; }
  }

  /** The context and the graph made, suspended until start(): at boot, behind the title (see the header). Safe to call again. */
  function prepare() {
    if (!AudioContextClass) { stats.state = 'unavailable'; return null; }
    if (!ctx) {
      const t0 = perfNow();
      ctx = new AudioContextClass({ latencyHint: 'interactive' });
      limiter = ctx.createDynamicsCompressor();
      // (0.0.16: the new master limits earlier and faster, then a trim takes back its make-up and a soft clip holds full scale: mix.js MASTER)
      const M = mode === 'old' ? MASTER_OLD : MASTER;
      limiter.threshold.value = mode === 'old' ? LIMIT_DB : M.thresholdDb; limiter.knee.value = M.kneeDb; limiter.ratio.value = M.ratio; limiter.attack.value = M.attackS; limiter.release.value = M.releaseS;
      master = ctx.createGain(); world = ctx.createGain();
      // (the world through the splash's muffle: a low-pass, open at WORLD_OPEN_HZ, and a duck gain; the UI bus beside it)
      worldLp = ctx.createBiquadFilter(); worldLp.type = 'lowpass'; worldLp.frequency.value = WORLD_OPEN_HZ; worldLp.Q.value = Math.SQRT1_2;
      duckGain = ctx.createGain(); uiBus = ctx.createGain();
      // (0.0.9: the chaos's stage after the splash's muffle; the body's, the ear's and the voice's buses beside the world's)
      chaosLp = ctx.createBiquadFilter(); chaosLp.type = 'lowpass'; chaosLp.frequency.value = WORLD_OPEN_HZ; chaosLp.Q.value = Math.SQRT1_2;
      chaosGain = ctx.createGain(); bodyBus = ctx.createGain(); earBus = ctx.createGain(); voiceBus = ctx.createGain();
      world.connect(worldLp); worldLp.connect(duckGain); duckGain.connect(chaosLp); chaosLp.connect(chaosGain); chaosGain.connect(master); uiBus.connect(master);
      // (0.0.12: the hall's reverb, a send from the world bus through a convolver over hallImpulse's response, into the splash's muffle
      // with the dry; its send shut (0) until the house asks for it, eased)
      try {
        hallIn = ctx.createGain(); hallIn.gain.value = 0; hallConv = ctx.createConvolver(); hallConv.normalize = false; hallConv.buffer = hallBuffer(ctx);
        world.connect(hallIn); hallIn.connect(hallConv); hallConv.connect(duckGain);
      } catch (e) { stats.hallError = String(e?.message ?? e); hallIn = null; hallConv = null; }
      bodyBus.connect(master); earBus.connect(master); voiceBus.connect(master);
      master.connect(limiter);
      if (mode === 'old') limiter.connect(ctx.destination);
      else {
        trim = ctx.createGain(); trim.gain.value = dbToK(-makeupDb(MASTER));
        const pre = ctx.createGain(); pre.gain.value = CLIP_PRE;
        // (no oversampling (the fixer's of 0.0.16): the curve is smooth below its knee, and the oversampler's filters, which mix.js's
        // offline model has not, could overshoot past the curve's 0.97 on the gun's 40 µs rise: the model is then the whole path)
        clipper = ctx.createWaveShaper(); clipper.curve = clipCurve(); clipper.oversample = 'none';
        limiter.connect(trim); trim.connect(pre); pre.connect(clipper); clipper.connect(ctx.destination);
        // (the guns' bus: into the splash's muffle with the world's dry, past the hall's send)
        gunBus = ctx.createGain(); gunBus.connect(worldLp);
      }
      for (const [table, into] of [[STEPS, buffers.step], [DOORS, buffers.door]]) for (const [kind, recipe] of Object.entries(table)) for (let v = 0; v < (recipe.variants ?? 1); v++) toBake.push([into, kind, recipe, v]);
      if (mode !== 'old') { queueShot('A1'); if (shotWant !== 'A1') queueShot(shotWant); }
      queueFixedVoices();
      for (const [table, into] of [[WORLD, buffers.world], [RANGE, buffers.range], [CHAOS, buffers.chaos], [BLAST_RECIPES, buffers.chaos], [STRESS, buffers.stress], [HOUSE, buffers.house]]) for (const [kind, recipe] of Object.entries(table)) for (let v = 0; v < (recipe.variants ?? 1); v++) toBake.push([into, kind, recipe, v]);
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

  // (where the player stands: the place's gravity and air (env.js envAt), and the rolloff's kind, a ground's or a floor's)
  function here(state) {
    const live = state.places?.live, area = live ? places.areaOf(live.area) : null, a = playerActor(state), E = envAt(state, null, a?.x ?? 0, a?.z ?? 0);
    return { area, kind: area?.kind === 'ground' ? 'ground' : 'floor', gG: E.gravity.gG, pKpa: E.air.pKpa };
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
  // ---- 0.0.20: the shot's candidates (see the header) ----
  function setPlaying(id) { shotPlay = id; stats.shot = id; }
  // (a candidate's parts put on the bake list once; A0 has none: it is the old report)
  function queueShot(id) {
    if (shotLeft.has(id)) return;
    const list = gunBakes(id);
    let n = 0;
    for (const g of list) for (let v = 0; v < g.variants; v++) { toBake.push({ gun: g, v, shot: id }); n++; }
    shotLeft.set(id, n);
    if (!n) { if (shotWant === id) setPlaying(id); }
  }
  /** The shot candidate a scene plays from now (src/data/sounds.js SHOT_CANDIDATES; an unknown id is the default's): the one before plays until its parts are whole. */
  function setShot(id) {
    if (mode === 'old') return 'old';
    shotWant = SHOT_CANDIDATES[id] ? id : SHOT_DEFAULT; stats.shotWant = shotWant;
    if (!ctx) return shotWant;                                       // (prepare() queues it)
    if (!shotLeft.has(shotWant)) queueShot(shotWant);
    if (shotLeft.get(shotWant) === 0) setPlaying(shotWant);
    return shotWant;
  }
  // ---- 0.0.20: the house's voices (see the header) ----
  const voiceBufs = new Map(), voiceWaiting = new Map(), voiceQueue = [], voiceFixed = new Set(), voiceFixedKeys = new Set();
  let voiceBaking = null;
  const voiceKey = (text, o) => `${o.set}|${o.voice}|${o.register}|${text}`;
  /** VOICE_CACHE lines kept past the fixed ones (the oldest dropped first: a Map keeps its order; the fixed never: v0.0.20's fixer). */
  const VOICE_CACHE = 160;
  // (past VOICE_CACHE unfixed lines the oldest unfixed one goes; a fixed line (the PA's, the team's calls) is kept for the session:
  // v0.0.20's fixer, the code review: the trim deleted in insertion order, the fixed lines first, at 280 lines, not the 160 said)
  function trimVoices() {
    let n = 0;
    for (const k of voiceBufs.keys()) if (!voiceFixedKeys.has(k)) n++;
    for (const k of [...voiceBufs.keys()]) { if (n <= VOICE_CACHE) break; if (voiceFixedKeys.has(k)) continue; voiceBufs.delete(k); n--; }
    stats.voice.cached = voiceBufs.size; stats.voice.fixed = voiceBufs.size - n;
  }
  function playVoice(b, { atS, gainDb, lowHz, pan, own }) {
    const now = ctx.currentTime, late = atS < now - 0.02;
    if (late) stats.voice.late++;
    const ok = play(b, { atS: Math.max(now, atS), gainDb, lowHz: lowHz ?? WORLD_OPEN_HZ, pan: own ? 0 : pan ?? 0, bus: own ? voiceBus : world });
    if (ok) stats.voice.played++;
    return ok;
  }
  function wantVoice(text, o, front = true) {
    const key = voiceKey(text, o);
    // (a line said while it waits baked ahead goes to the front, as a line said first (the v0.0.22 integration))
    if (front && voiceWaiting.has(key)) { const i = voiceQueue.findIndex(q => q.key === key); if (i > 0 || voiceQueue[i]?.ahead) { const [q] = voiceQueue.splice(i, 1); delete q.ahead; voiceQueue.unshift(q); } }
    if (front && voiceBaking?.key === key) delete voiceBaking.ahead;
    if (voiceBufs.has(key) || voiceWaiting.has(key) || voiceBaking?.key === key) return key;
    voiceWaiting.set(key, []);
    const e = { key, text, voice: o.voice, register: o.register, set: o.set, ...(front ? {} : { ahead: true }) };
    if (front) voiceQueue.unshift(e); else voiceQueue.push(e);
    return key;
  }
  function queueFixedVoices() {
    if (!VOICE_SET[voiceSet]?.words || voiceFixed.has(voiceSet)) return;
    voiceFixed.add(voiceSet);
    for (const L of fixedLines()) voiceFixedKeys.add(wantVoice(L.text, { ...L, set: voiceSet }, false));
  }
  /** A line said (house.js): played at atS on the audio clock once baked (see the header); false off the context or with V-a. */
  function voiceLine(text, { voice: who = 'pa', register = 'plain', set = voiceSet, atS = 0, gainDb = 0, lowHz = WORLD_OPEN_HZ, pan = 0 } = {}) {
    if (!running() || !VOICE_SET[set]?.words || !Number.isFinite(gainDb)) return false;
    const o = { voice: who, register, set }, key = wantVoice(text, o), at = { atS, gainDb, lowHz, pan, own: who === 'me', askedMs: perfNow() };
    const b = voiceBufs.get(key);
    if (b) {
      // (a line said again goes to the back of the cache's order; past VOICE_CACHE the oldest unfixed one goes)
      voiceBufs.delete(key); voiceBufs.set(key, b);
      return playVoice(b, at);
    }
    voiceWaiting.get(key)?.push(at); stats.voice.waiting = voiceWaiting.size;
    return true;
  }
  /**
   * Your number two's call-outs baked ahead (see the header): texts (combat/two.js calloutLines) in his voice and the
   * contact call's register (house.js registerOf), behind every line said; the count newly queued. Nothing with V-a or no context.
   */
  function prebakeCallouts(texts = []) {
    if (!ctx || !VOICE_SET[voiceSet]?.words) return 0;
    let n = 0;
    for (const text of texts) {
      const o = { voice: 'two', register: registerOf({ call: 'contact', text }, 'two'), set: voiceSet }, key = voiceKey(text, o);
      if (voiceBufs.has(key) || voiceWaiting.has(key) || voiceBaking?.key === key) continue;
      wantVoice(text, o, false); n++;
    }
    stats.voice.prebaked += n;
    return n;
  }
  /** Whether a call-out of his is baked (the tests'). */
  const calloutBaked = (text) => voiceBufs.has(voiceKey(text, { voice: 'two', register: registerOf({ call: 'contact', text }, 'two'), set: voiceSet }));
  /** The voice set from now (voices.js VOICE_SETS: the To score page's row); its fixed lines baked. */
  function setVoice(id) {
    voiceSet = VOICE_SET[id] ? id : VOICE_DEFAULT; stats.voice.set = voiceSet;
    houseSounds.setVoice(voiceSet);
    if (ctx) queueFixedVoices();
    return voiceSet;
  }
  // ---- 0.0.16: a gun's voice (gun.js's { key, delayS, gainDb, lowHz, pan, rate }) on the gun bus, now or delayS later ----
  function gunVoice(v0) {
    if (!running() || !gunBus || !v0) return false;
    // (0.0.20: the candidate playing's part, A1's (as built) where it has none)
    const alt = shotPlay !== 'A1' && shotPlay !== 'A0' ? shotKey(v0.key, shotPlay) : null, v = alt && buffers.gun[alt]?.length ? { ...v0, key: alt } : v0;
    const set = buffers.gun[v.key];
    if (!set?.length || !Number.isFinite(v.gainDb)) return false;
    const n = (stats.gunVoices = stats.gunVoices + 1);
    const ok = play(set[hashInt(set.length, 'gun', v.key, n)], { atS: ctx.currentTime + Math.max(0, v.delayS ?? 0), gainDb: v.gainDb, lowHz: v.lowHz ?? WORLD_OPEN_HZ, pan: v.pan ?? 0, rate: (v.rate ?? 1) * (1 + (hash01('gun-rate', v.key, n) - 0.5) * 0.03), bus: gunBus });
    if (ok) stats.lastGun = { key: v.key, gainDb: Math.round(v.gainDb * 10) / 10, lowpassHz: Math.round(v.lowHz ?? WORLD_OPEN_HZ), delayS: Math.round((v.delayS ?? 0) * 1000) / 1000 };
    return ok;
  }
  const gunHandle = mode === 'old' ? null : { play: gunVoice, ready: (key) => !!buffers.gun[key]?.length };
  // ---- the range's sounds (range.js asks for them): a RANGE recipe now, or delayS later on the audio clock ----
  const rangeOps = {
    shot(kind, { delayS = 0, gainDb = 0, lowHz = WORLD_OPEN_HZ, pan = 0, rate = 1 } = {}) {
      if (!running()) return false;
      const set = buffers.range[kind];
      if (!set?.length) return false;
      const n = (stats.rangeShots = (stats.rangeShots ?? 0) + 1);
      const ok = play(set[hashInt(set.length, 'range', kind, n)], { atS: ctx.currentTime + Math.max(0, delayS), gainDb, lowHz, pan, rate: rate * (1 + (hash01('range-rate', kind, n) - 0.5) * 0.04) });
      if (ok) stats.last = { what: kind, gainDb: Math.round(gainDb * 10) / 10, lowpassHz: Math.round(lowHz), delayS: Math.round(delayS * 1000) / 1000 };
      return ok;
    },
  };
  // ---- 0.0.9: the bang and the chaos (bang.js asks for them) ----
  const busOf = (name) => (name === 'body' ? bodyBus : name === 'ear' ? earBus : name === 'voice' ? voiceBus : world);
  const chaosLoops = new Map();                                    // (key → { src, g, kind, bus })
  const bangOps = {
    /** A CHAOS recipe on the world bus now or delayS later: { delayS, gainDb, lowHz, pan, rate }. */
    bang(kind, { delayS = 0, gainDb = 0, lowHz = WORLD_OPEN_HZ, pan = 0, rate = 1, bus = 'world' } = {}) {
      if (!running()) return false;
      const set = buffers.chaos[kind];
      if (!set?.length) return false;
      const n = (stats.bangShots = (stats.bangShots ?? 0) + 1);
      return play(set[hashInt(set.length, 'chaos', kind, n)], { atS: ctx.currentTime + Math.max(0, delayS), gainDb, lowHz, pan, rate, bus: busOf(bus) });
    },
    /** The chaos's stage on the world bus: { lowpassHz, gainDb } (bang.js chaosMix's world), eased; written only when it changes. */
    chaos({ lowpassHz: hz = WORLD_OPEN_HZ, gainDb = 0 } = {}) {
      if (!ctx || !chaosLp) return;
      const sig = `${Math.round(hz)}|${gainDb.toFixed(1)}`;
      if (sig === chaosSig) return;
      chaosSig = sig;
      const t = ctx.currentTime;
      chaosLp.frequency.setTargetAtTime(hz, t, 0.08);
      chaosGain.gain.setTargetAtTime(dbToK(gainDb), t, 0.08);
      stats.chaos = { lowpassHz: Math.round(hz), gainDb: Math.round(gainDb * 10) / 10 };
    },
    /** A looping CHAOS voice on a bus ('body', 'ear', 'voice', else the world's) at gainDb, or faded out (null). */
    loop(key, kind, bus, gainDb) {
      const L = chaosLoops.get(key);
      if (gainDb === null || gainDb === undefined || !Number.isFinite(gainDb)) {
        if (!L || !ctx) return false;
        chaosLoops.delete(key);
        const t = ctx.currentTime;
        L.g.gain.cancelScheduledValues(t); L.g.gain.setTargetAtTime(0, t, LOOP_FADE_S / 3);
        try { L.src.stop(t + LOOP_FADE_S * 2); } catch { /* (already stopped) */ }
        stats.loopsChaos = chaosLoops.size;
        return true;
      }
      if (!running()) return false;
      const k = dbToK(gainDb), t = ctx.currentTime;
      if (L) { if (Math.abs((L.db ?? 0) - gainDb) > 0.05) { L.g.gain.setTargetAtTime(k, t, 0.15); L.db = gainDb; } return true; }
      // (0.0.10: a STRESS loop too, Breathe's box breath)
      const set = buffers.chaos[kind] ?? buffers.stress[kind];
      if (!set?.length || voices >= VOICES_MAX) { if (set?.length) stats.dropped++; return false; }
      const src = ctx.createBufferSource(), g = ctx.createGain();
      src.buffer = set[0]; src.loop = true;
      g.gain.setValueAtTime(0, t); g.gain.setTargetAtTime(k, t, LOOP_FADE_S / 3);
      src.connect(g); g.connect(busOf(bus));
      src.start(t);
      voices++; stats.voices = voices; stats.voicesMax = Math.max(stats.voicesMax, voices);
      src.onended = () => { voices--; stats.voices = voices; src.disconnect(); g.disconnect(); };
      chaosLoops.set(key, { src, g, kind, bus, db: gainDb });
      stats.loopsChaos = chaosLoops.size;
      return true;
    },
  };
  const bangSounds = createBang(bangOps, { looks });
  stats.bang = bangSounds.stats;
  // (0.0.18: the kit's bursts in the shoot house, through the suit (blast.js), on the bang's own ops and recipe)
  const blastSounds = createBlast(bangOps, { looks });
  stats.blast = blastSounds.stats;
  // ---- 0.0.10: the din (stress.js asks for them): a STRESS recipe on the world bus, the blanks' reports through the range's ----
  const stressOps = {
    stress(kind, { delayS = 0, gainDb = 0, lowHz = WORLD_OPEN_HZ, pan = 0, rate = 1 } = {}) {
      if (!running()) return false;
      const set = buffers.stress[kind];
      if (!set?.length) return false;
      const n = (stats.stressShots = (stats.stressShots ?? 0) + 1);
      return play(set[hashInt(set.length, 'stress', kind, n)], { atS: ctx.currentTime + Math.max(0, delayS), gainDb, lowHz, pan, rate });
    },
    shot: (kind, o) => rangeOps.shot(kind, o),
    loop: (key, kind, bus, gainDb) => bangOps.loop(key, kind, bus, gainDb),
  };
  const stressSounds = createStress(stressOps, { looks, gun: gunHandle });
  stats.stress = stressSounds.stats;
  // ---- 0.0.12: the shoot house (house.js asks for them): a HOUSE recipe on the world bus now or delayS later; the hall's send on or off ----
  const houseOps = {
    house(kind, { delayS = 0, gainDb = 0, lowHz = WORLD_OPEN_HZ, pan = 0, rate = 1 } = {}) {
      if (!running()) return false;
      const set = buffers.house[kind];
      if (!set?.length) return false;
      const n = (stats.houseShots = (stats.houseShots ?? 0) + 1);
      return play(set[hashInt(set.length, 'house', kind, n)], { atS: ctx.currentTime + Math.max(0, delayS), gainDb, lowHz, pan, rate });
    },
    // (0.0.20: a line said, and the audio clock the speakers' queues run on)
    voice: (text, o) => voiceLine(text, o),
    now: () => (ctx ? ctx.currentTime : 0),
    hall(on) {
      stats.hallOn = !!on;
      if (!ctx || !hallIn) return;
      const want = on ? 10 ** (HALL.sendDb / 20) : 0;
      hallIn.gain.setTargetAtTime(want, ctx.currentTime, 0.05);
    },
  };
  const houseSounds = createHouse(houseOps, { voice: voiceSet });
  stats.house = houseSounds.stats;
  // (v0.0.19: a marking round's strike on a body, the slap, on the house's 'paint' fact: marking.js)
  const markingSounds = createMarking(rangeOps);
  stats.marking = markingSounds.stats;
  // (the voices' limit counts on the audio clock, where the reports will sound)
  const rangeSounds = createRange(rangeOps, { looks, clock: () => (ctx ? ctx.currentTime : 0), gun: gunHandle });
  stats.range = rangeSounds.stats;
  // (0.0.20: A0, &sound=old's report, through a range presenter without the gun handle: the shot facts alone go to it)
  const rangeOld = gunHandle ? createRange(rangeOps, { looks, clock: () => (ctx ? ctx.currentTime : 0), gun: null }) : null;
  stats.rangeOld = rangeOld?.stats ?? null;

  let lastState = null;
  /** A frame: the foot-falls the player's walk has reached, played where the drawn feet fall; the world's sounds; the splash's muffle. */
  function frame(state, alpha = 0, nowS = 0, { splash = null, chaos = null, breathing = false } = {}) {
    // (and a line said once the sounds are all baked: v0.0.20's fixer, a line not among the fixed ones waited for ever once toBake
    // was empty, since only this call bakes; v0.0.21: a call-out baked ahead is queued the same way)
    if (toBake.length || baking || voiceBaking || voiceQueue.length) bakeSome();
    // (0.0.9: the chaos's mix by the reading now; nothing of it in a splash (the splash's muffle has the world))
    // (0.0.10: Breathe's box breath in place of the band's quick one while it runs)
    if (running()) { try { bangSounds.frame(state, splash ? null : chaos, { breathing: !splash && breathing }); } catch (e) { stats.bangError = String(e?.message ?? e); } }
    if (running()) { try { stressSounds.frame(state, { breathing: !splash && breathing }); } catch (e) { stats.stressError = String(e?.message ?? e); } }
    if (running()) { try { worldSounds.frame(state, { splash, nowS }); } catch (e) { stats.worldError = String(e?.message ?? e); } }
    if (running() && !splash) { try { rangeSounds.frame(state, { alpha }); rangeOld?.frame(state, { alpha }); } catch (e) { stats.rangeError = String(e?.message ?? e); } }
    if (running()) { try { houseSounds.frame(splash ? null : state); } catch (e) { stats.houseError = String(e?.message ?? e); } }
    // (0.0.19: the kit's small sounds off the house's devices: the pin, the lever, the floor, the shock tube (blast.js frame))
    if (running()) { try { blastSounds.frame(splash ? null : state); } catch (e) { stats.blastError = String(e?.message ?? e); } }
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
    // (what the feet are on: the place's, never a quiet concrete. model.js surfaceAt throws for a ground with no surface, and
    // the error goes to the frame's caller; null only with no live area, where nothing walks)
    const surface = places.surfaceAt(state, a.x, a.z);
    if (!surface) return;
    // (0.0.16: the new sound's steps well under the shots, by the stance: steps.js stepTrimDb)
    const trimDb = stepTrimDb(a.moveStance, mode);
    for (const f of falls) {
      const voice0 = stepVoice(surface, f.gait, { gG: h.gG, pKpa: h.pKpa }), voice = trimDb ? { ...voice0, gainDb: voice0.gainDb + trimDb } : voice0, set = buffers.step[voice.kind];
      if (!set?.length || !Number.isFinite(voice.gainDb)) continue;                      // (no weight or no air: no airborne step)
      const atS = ctx.currentTime + Math.max(0, f.atS - nowS);
      const jitterDb = (hash01('step-db', f.n) - 0.5) * 3, rate = 1 + (hash01('step-rate', f.n) - 0.5) * 0.08;
      if (play(set[hashInt(set.length, 'step', f.n)], { atS, gainDb: voice.gainDb + jitterDb, lowHz: voice.lowpassHz, rate, pan: f.n % 2 ? 0.05 : -0.05 })) {
        stats.steps++;
        // (0.0.12: the combat EVA suit's sole scuffs under the built step, a heavier body's)
        const sc = a.outfit === 'combatSuit' ? buffers.house.suitScuff : null;
        if (sc?.length && play(sc[hashInt(sc.length, 'scuff', f.n)], { atS, gainDb: voice.gainDb + SUIT_SCUFF_DB + jitterDb, lowHz: voice.lowpassHz, rate, pan: f.n % 2 ? 0.05 : -0.05 })) stats.scuffs = (stats.scuffs ?? 0) + 1;
        stats.last = { what: 'step', surface, kind: voice.kind, gainDb: voice.gainDb, trimDb, stance: a.moveStance ?? 'relaxed', lowpassHz: voice.lowpassHz, gait: f.gait, aheadS: Math.round((atS - ctx.currentTime) * 1000) / 1000 };
      }
    }
  }

  /** A door's leaf moving (the door fact): its sound where it is, if it is in your area. */
  function door(fact, state = null) {
    if (!running() || !fact || !state) return false;
    // (0.0.12: in the shoot house a door the drill opens is heard by its verb: a push, a pull, a kick)
    if (fact.how && houseSounds.door(fact, state)) return true;
    const me = playerActor(state), h = here(state);
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
    /** A bus fact the world's and the range's sounds hear (the flush's body-event, reveille's bugle; the shot, a step, the tower's say): fact(type, payload, state). */
    fact(type, payload, state) {
      if (!running()) return false;
      const w = worldSounds.fact(type, payload, state);
      // (0.0.12: the house's facts; the instructor's 'say' and the drill's 'bundle' heard by the house as well as the range)
      const hs = type === 'house' || type === 'bundle' || type === 'say' ? houseSounds.fact(type, payload, state) : false;
      if (type === 'house' && payload?.phase === 'paint') markingSounds.fact(type, payload, state);
      if (type === 'house' || type === 'bundle') return hs || w;
      // (0.0.9: a bang's report; 0.0.10: the horn and a blank)
      if (type === 'fx') return (payload?.kind === 'horn' || payload?.kind === 'blank' ? stressSounds.fact(type, payload, state) : blastSounds.ours(type, payload, state) ? blastSounds.fact(type, payload, state) : bangSounds.fact(type, payload, state)) || w;
      // (0.0.19: a breach round's strike at the leaf beside the R-7's own report, which stays the range's)
      const bs = type === 'shot' && blastSounds.ours(type, payload, state) ? blastSounds.fact(type, payload, state) : false;
      // (0.0.20: A0's shot through the old report)
      if (type === 'shot' && shotPlay === 'A0' && rangeOld) return rangeOld.fact(type, payload, state) || bs || w;
      return rangeSounds.fact(type, payload, state) || bs || w;
    },
    /** The deafness's caption once a deafness ('[a high whine]'), else null (0.0.9). */
    caption() { return bangSounds.caption(); },
    /** The 0.0.9 presenter (bang.js), for the tests. */
    get bang() { return bangSounds; },
    /** The 0.0.10 presenter (stress.js), for the tests. */
    get stress() { return stressSounds; },
    /** The 0.0.12 presenter (house.js), for the tests. */
    get house() { return houseSounds; },
    /** The sound this engine plays: 'new' or 'old' (&sound=old, v0.0.16). */
    get sound() { return mode; },
    setShot, setVoice, prebakeCallouts, calloutBaked,
    /** A line said on the house's voice (house.js's way, for the tests: v0.0.20's fixer). */
    voiceLine,
    /** The voice set playing (0.0.20). */
    get voiceSet() { return voiceSet; },
    /** The shot candidate playing ('old' with &sound=old) (0.0.20). */
    get shot() { return mode === 'old' ? 'old' : shotPlay; },
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
    dispose() { try { ctx?.close(); } catch { /* (already closed) */ } ctx = null; hallIn = hallConv = null; gunBus = trim = clipper = null; master = world = limiter = worldLp = duckGain = uiBus = chaosLp = chaosGain = bodyBus = earBus = voiceBus = null; loops.clear(); chaosLoops.clear(); stats.state = 'closed'; },
  };
}
