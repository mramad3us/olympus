// OLYMPUS audio: the synthesiser, recipes of noise and tones rendered into samples by code (no WebAudio here).
//
// Every sound the game makes is made here, from src/data/sounds.js's recipes, with no file and no
// generation tool (VIEWS §11.1; the user, 2026-11-05). render(recipe, { sampleRate, variant }) turns a
// recipe into a Float32Array of mono samples: each layer (noise through a filter, a gliding tone,
// grains of filtered noise, a swept band of noise) is rendered on its own under its envelope (a
// linear attack, then an exponential decay with its 1/e time) from its delay, scaled to its peak,
// weighted by its db, and the layers summed; the sum is scaled so its peak is the recipe's levelDb
// (dBFS at 1 m, Earth's air and gravity), and its last 4 ms faded to silence so it never clicks.
// The filters are the audio cookbook's biquads (R. Bristow-Johnson): low-pass and high-pass with Q
// 0.707, band-pass of constant peak gain at the layer's Q; a sweep recomputes its band every 32
// samples along an exponential glide. Two pitched layers came with the 0.0.4 round (the build sheet
// §2.4's sounds): glide, a band-limited sawtooth (polyBLEP: no aliasing to speak of, and cheap: a
// few operations a sample) gliding from hz to toHz over durS under an attack and a release, then
// through its formant band-pass (the klaxon's whoop, 600 to 1,100 Hz); and notes, a melody of
// [hz, durS] notes on the same sawtooth with a scoop into each note, a vibrato and a brass formant (the
// bugle's reveille, VIEWS §11.3: "a sawtooth through a brass formant filter"). A recipe marked loop is
// rendered a crossfade longer than its durS and its tail crossfaded into its head (equal power over
// LOOP_XFADE_S), so it plays seamlessly on a looping source (the shower's water, the tap), and gets
// no fade at its end. renderSteps() is the same rendering a layer at a time (a generator), so the
// engine can spread a long recipe over several frames. The noise is white, from the game's own sfc32 dice on a
// stream named for the recipe, its variant and its layer (src/core/rng.js stream): the same sound
// is the same samples on every machine and every run, and Math.random is never called. The engine
// (engine.js) copies these samples into AudioBuffers at the first key or click and plays them
// through the air's filter and gain; the tests render them in node and measure them.
//
// measure(samples, sampleRate) gives what VIEWS §11.5 says a sound is checked by, without anyone
// listening: its peak and RMS in dBFS, its spectral centroid (a radix-2 FFT of the whole sound,
// zero-padded), its length, and its decay, the time from its peak to the last sample within 30 dB
// of it.
import { stream, next } from '../../core/rng.js';

/** The fade at a sound's end, so it never stops on a click (seconds). */
export const FADE_S = 0.004;
/** A loop's seam: its tail crossfaded into its head over this long (seconds). */
export const LOOP_XFADE_S = 0.12;
const TAU = 2 * Math.PI;
const dbToK = (db) => 10 ** (db / 20);

// ---- filters (RBJ's cookbook) ----

/** A biquad's coefficients, normalised: { b0, b1, b2, a1, a2 }. type 'lowpass' | 'highpass' | 'bandpass'. */
export function biquad(type, hz, q, sampleRate) {
  const f = Math.min(Math.max(hz, 10), sampleRate * 0.49), w = (TAU * f) / sampleRate, c = Math.cos(w), s = Math.sin(w);
  const alpha = s / (2 * (q > 0 ? q : Math.SQRT1_2));
  let b0, b1, b2;
  if (type === 'lowpass') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = (1 - c) / 2; }
  else if (type === 'highpass') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = (1 + c) / 2; }
  else { b0 = alpha; b1 = 0; b2 = -alpha; }
  const a0 = 1 + alpha;
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: (-2 * c) / a0, a2: (1 - alpha) / a0 };
}

// (a layer's filter, if it has one: [type, hz, q])
function filterOf(layer) {
  if (layer.bandpass) return ['bandpass', layer.bandpass[0], layer.bandpass[1]];
  if (layer.lowpass) return ['lowpass', layer.lowpass, Math.SQRT1_2];
  if (layer.highpass) return ['highpass', layer.highpass, Math.SQRT1_2];
  return null;
}

// (a biquad run over a buffer in place, direct form 1)
function filterInPlace(buf, k) {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < buf.length; i++) {
    const x = buf[i], y = k.b0 * x + k.b1 * x1 + k.b2 * x2 - k.a1 * y1 - k.a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y; buf[i] = y;
  }
}

const envAt = (t, attackS, decayS) => (t < 0 ? 0 : t < attackS ? t / attackS : Math.exp(-(t - attackS) / Math.max(1e-5, decayS)));

function normalise(buf) {
  let peak = 0;
  for (let i = 0; i < buf.length; i++) peak = Math.max(peak, Math.abs(buf[i]));
  if (peak > 0) for (let i = 0; i < buf.length; i++) buf[i] /= peak;
  return buf;
}

// ---- layers ----

function noiseLayer(layer, n, sr, r) {
  const buf = new Float32Array(n), d = layer.delayS ?? 0, f = filterOf(layer);
  for (let i = 0; i < n; i++) buf[i] = next(r) * 2 - 1;
  if (f) filterInPlace(buf, biquad(f[0], f[1], f[2], sr));
  for (let i = 0; i < n; i++) buf[i] *= envAt(i / sr - d, layer.attackS ?? 0.001, layer.decayS ?? 0.02);
  return buf;
}

function toneLayer(layer, n, sr) {
  const buf = new Float32Array(n), d = layer.delayS ?? 0, hz = layer.hz, to = layer.toHz ?? hz, decay = layer.decayS ?? 0.02;
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr - d;
    if (t < 0) continue;
    const f = to + (hz - to) * Math.exp(-t / decay);
    phase += (TAU * f) / sr;
    buf[i] = Math.sin(phase) * envAt(t, layer.attackS ?? 0.001, decay);
  }
  return buf;
}

function grainsLayer(layer, n, sr, r) {
  const buf = new Float32Array(n), f = filterOf(layer), d = layer.delayS ?? 0;
  const len = Math.max(8, Math.round((layer.decayS ?? 0.002) * 6 * sr));
  for (let g = 0; g < (layer.n ?? 8); g++) {
    const at = Math.round((d + next(r) * (layer.spreadS ?? 0.05)) * sr), amp = 0.4 + 0.6 * next(r);
    for (let i = 0; i < len && at + i < n; i++) buf[at + i] += (next(r) * 2 - 1) * amp * Math.exp(-i / sr / (layer.decayS ?? 0.002));
  }
  if (f) filterInPlace(buf, biquad(f[0], f[1], f[2], sr));
  return buf;
}

function sweepLayer(layer, n, sr, r) {
  const buf = new Float32Array(n), d = layer.delayS ?? 0, durS = layer.durS ?? 0.5, q = layer.q ?? 6;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0, k = null;
  for (let i = 0; i < n; i++) {
    const t = i / sr - d;
    if (i % 32 === 0) k = biquad('bandpass', layer.hz * (layer.toHz / layer.hz) ** Math.min(1, Math.max(0, t / durS)), q, sr);
    const x = next(r) * 2 - 1, y = k.b0 * x + k.b1 * x1 + k.b2 * x2 - k.a1 * y1 - k.a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    // (a hinge does not hiss: it sticks and slips, so the band is chopped at a rough rate)
    const chop = 0.55 + 0.45 * Math.sin(TAU * 31 * t + 2 * Math.sin(TAU * 7 * t));
    buf[i] = t < 0 || t > durS ? 0 : y * chop * envAt(t, layer.attackS ?? 0.05, layer.decayS ?? 0.3);
  }
  return buf;
}

// (a band-limited sawtooth's correction at a discontinuity: polyBLEP, phase t in [0, 1), increment dt)
function blep(t, dt) {
  if (t < dt) { const x = t / dt; return x + x - x * x - 1; }
  if (t > 1 - dt) { const x = (t - 1) / dt; return x * x + x + x + 1; }
  return 0;
}
const sawAt = (ph, dt) => 2 * ph - 1 - blep(ph, dt);

function glideLayer(layer, n, sr) {
  const buf = new Float32Array(n), d = layer.delayS ?? 0, durS = layer.durS ?? 1, hz = layer.hz, to = layer.toHz ?? hz;
  const att = layer.attackS ?? 0.02, rel = layer.releaseS ?? 0.06;
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr - d;
    if (t < 0 || t > durS) continue;
    const f = hz * (to / hz) ** (t / durS), dt = f / sr;
    ph += dt; if (ph >= 1) ph -= 1;
    const env = Math.min(1, t / att) * Math.min(1, Math.max(0, (durS - t) / rel));
    buf[i] = sawAt(ph, dt) * env;
  }
  if (layer.formant) filterInPlace(buf, biquad('bandpass', layer.formant[0], layer.formant[1], sr));
  if (layer.lowpass) filterInPlace(buf, biquad('lowpass', layer.lowpass, Math.SQRT1_2, sr));
  return buf;
}

function notesLayer(layer, n, sr) {
  const buf = new Float32Array(n), att = layer.attackS ?? 0.025, rel = layer.releaseS ?? 0.04, gap = layer.gapS ?? 0.015;
  const vibHz = layer.vibratoHz ?? 5.5, vibK = layer.vibratoK ?? 0.004, scoopK = layer.scoopK ?? 0.03;
  let at = layer.delayS ?? 0;
  for (const [hz, durS] of layer.notes ?? []) {
    const i0 = Math.round(at * sr), len = Math.round(durS * sr);
    let ph = 0;
    for (let i = 0; i < len && i0 + i < n; i++) {
      const t = i / sr, f = hz * (1 - scoopK * Math.exp(-t / 0.02)) * (1 + vibK * Math.sin(TAU * vibHz * t)), dt = f / sr;
      ph += dt; if (ph >= 1) ph -= 1;
      const env = Math.min(1, t / att) * Math.min(1, Math.max(0, (durS - t) / rel));
      buf[i0 + i] += sawAt(ph, dt) * env;
    }
    at += durS + gap;
  }
  if (layer.formant) filterInPlace(buf, biquad('bandpass', layer.formant[0], layer.formant[1], sr));
  if (layer.highpass) filterInPlace(buf, biquad('highpass', layer.highpass, Math.SQRT1_2, sr));
  if (layer.lowpass) filterInPlace(buf, biquad('lowpass', layer.lowpass, Math.SQRT1_2, sr));
  return buf;
}

const LAYERS = { noise: noiseLayer, tone: toneLayer, grains: grainsLayer, sweep: sweepLayer, glide: glideLayer, notes: notesLayer };

/**
 * A recipe rendered a layer at a time: a generator that yields after each layer (and before its
 * finish), and returns the samples render() gives. The engine advances it across frames within its
 * bake budget, so a long recipe (the flush's 3.2 s, the bugle's 3.9 s) never stalls one frame.
 */
export function* renderSteps(recipe, { sampleRate = 48000, name = 'sound', variant = 0 } = {}) {
  const n = Math.max(1, Math.round((recipe.durS ?? 0.1) * sampleRate));
  const xf = recipe.loop ? Math.min(n >> 1, Math.round(LOOP_XFADE_S * sampleRate)) : 0, total = n + xf;
  let out = new Float32Array(total);
  for (let li = 0; li < recipe.layers.length; li++) {
    const layer = recipe.layers[li], make = LAYERS[layer.kind];
    if (!make) throw new Error(`synth: no layer kind '${layer.kind}' in '${name}'`);
    const buf = normalise(make(layer, total, sampleRate, stream('sound', name, variant, li))), k = dbToK(layer.db ?? 0);
    for (let i = 0; i < total; i++) out[i] += buf[i] * k;
    yield li;
  }
  // (a loop: the tail past durS crossfaded into the head at equal power, so the end runs into the start)
  if (xf) {
    for (let i = 0; i < xf; i++) { const a = i / xf; out[i] = out[i] * Math.sqrt(a) + out[n + i] * Math.sqrt(1 - a); }
    out = out.slice(0, n);
  }
  normalise(out);
  const level = dbToK(recipe.levelDb ?? -12), fade = recipe.loop ? 0 : Math.min(n, Math.round(FADE_S * sampleRate));
  for (let i = 0; i < n; i++) out[i] *= level * (fade && i >= n - fade ? (n - 1 - i) / fade : 1);
  return out;
}

/**
 * A recipe (src/data/sounds.js) rendered: a Float32Array of mono samples at sampleRate, its peak the
 * recipe's levelDb. name and variant pick the noise's stream, so each variant is its own take.
 */
export function render(recipe, opts = {}) {
  const it = renderSteps(recipe, opts);
  for (;;) { const r = it.next(); if (r.done) return r.value; }
}

// ---- measuring ----

// (an in-place radix-2 FFT of re, im: length a power of two)
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -TAU / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2, tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
      }
    }
  }
}

/** A sound's numbers: { peakDb, rmsDb (dBFS), centroidHz, durS, decayS (peak to the last sample within 30 dB of it) }. */
export function measure(samples, sampleRate = 48000) {
  let peak = 0, at = 0, sum = 0;
  for (let i = 0; i < samples.length; i++) { const v = Math.abs(samples[i]); sum += v * v; if (v > peak) { peak = v; at = i; } }
  let last = at;
  const floor = peak * dbToK(-30);
  for (let i = samples.length - 1; i > at; i--) if (Math.abs(samples[i]) >= floor) { last = i; break; }
  let size = 1;
  while (size < samples.length) size <<= 1;
  const re = new Float64Array(size), im = new Float64Array(size);
  re.set(samples);
  fft(re, im);
  let wsum = 0, msum = 0;
  for (let k = 1; k < size / 2; k++) { const m = Math.hypot(re[k], im[k]); wsum += m * (k * sampleRate) / size; msum += m; }
  const db = (k) => (k > 0 ? 20 * Math.log10(k) : -Infinity);
  return { peakDb: db(peak), rmsDb: db(Math.sqrt(sum / Math.max(1, samples.length))), centroidHz: msum ? wsum / msum : 0, durS: samples.length / sampleRate, decayS: (last - at) / sampleRate };
}
