// OLYMPUS audio: the master's two graphs and an offline mixdown of what the engine plays, for the tests and the recordings (no WebAudio here).
//
// The engine (engine.js) ends its graph in one of two masters. MASTER_OLD is v0.0.15's, kept for the A/B (&sound=old): a
// compressor at −3 dBFS, ratio 20, hard knee, 3 ms attack and 120 ms release, then the speakers (which clip at full scale).
// MASTER is v0.0.16's (the user, 2026-11-15: "guns should bang harder"): the guns go into it over full scale, so it limits
// harder and earlier, a compressor at −6 dBFS, ratio 20, hard knee, 1 ms attack and 100 ms release; then a trim that takes
// back the compressor's own make-up gain (the browsers' DynamicsCompressor raises everything by (1 / its gain at full scale)
// to the power 0.6, +3.4 dB here: the trim keeps the quiet sounds where they were); then a soft clip (a WaveShaper's curve:
// linear to 0.7 of CLIP_LIMIT, then towards it by tanh), so nothing ever reaches full scale, a burst of open shots included.
//
// mixdown() renders voices as the engine plays them, offline and deterministic: each { samples (a Float32Array, or { left,
// right }), sampleRate, atS, gainDb, lowHz, pan, rate } resampled at its rate (linear), through WebAudio's low-pass (its Q in
// dB: 0.707 dB, a linear Q of 1.085), its gain, and the StereoPanner's equal-power law (a mono voice with no pan is sent to
// both speakers whole, as the engine connects it with no panner); master() then takes the sum through a master as the
// browser would (the compressor emulated: a 6 ms look-ahead, its gain eased by its attack and release; the soft clip
// exactly). The numbers it gives are the browser's within a dB or two: the tests read the balance (shots against steps, the
// open against the protected, nothing clipping) and the recordings are made by it.
import { biquad } from './synth.js';

/** v0.0.15's master (the A/B's old). */
export const MASTER_OLD = Object.freeze({ thresholdDb: -3, kneeDb: 0, ratio: 20, attackS: 0.003, releaseS: 0.12, trim: false, clip: false });
/** v0.0.16's master (see the header). */
export const MASTER = Object.freeze({ thresholdDb: -6, kneeDb: 0, ratio: 20, attackS: 0.001, releaseS: 0.1, trim: true, clip: true });
/** The soft clip's limit (full scale is 1). */
export const CLIP_LIMIT = 0.97;
/** The WaveShaper's input is scaled by this first, so its curve covers inputs to 1 / CLIP_PRE (4× full scale). */
export const CLIP_PRE = 0.25;
const dbToK = (db) => 10 ** (db / 20);

/** A compressor's make-up gain as the browsers apply it (dB): −0.6 × its curve's output at 0 dBFS (a hard knee). */
export function makeupDb(M) {
  const full = M.thresholdDb + (0 - M.thresholdDb) / M.ratio;
  return -0.6 * full;
}
/** The soft clip (see the header): x → its output, never past CLIP_LIMIT. */
export function softClip(x, lim = CLIP_LIMIT) {
  const a = Math.abs(x), knee = lim * 0.7;
  return a <= knee ? x : Math.sign(x) * (knee + (lim - knee) * Math.tanh((a - knee) / (lim - knee)));
}
/** The WaveShaper's curve for the soft clip over its scaled input (n points over −1 to 1). */
export function clipCurve(n = 4097) {
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) c[i] = softClip(((i / (n - 1)) * 2 - 1) / CLIP_PRE);
  return c;
}

// (WebAudio's low-pass: the cookbook's with Q in dB)
function lowpassInPlace(buf, hz, sr) {
  if (!(hz > 0) || hz >= sr * 0.49) return buf;
  const k = biquad('lowpass', hz, 10 ** (Math.SQRT1_2 / 20), sr);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < buf.length; i++) { const x = buf[i], y = k.b0 * x + k.b1 * x1 + k.b2 * x2 - k.a1 * y1 - k.a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; buf[i] = y; }
  return buf;
}
// (a channel resampled at rate onto the output's rate, from its start)
function resample(src, srcSr, rate, outSr, n) {
  const out = new Float32Array(n), step = (rate * srcSr) / outSr;
  for (let i = 0; i < n; i++) {
    const p = i * step, j = Math.floor(p);
    if (j + 1 >= src.length) { if (j < src.length) out[i] = src[j]; break; }
    out[i] = src[j] + (src[j + 1] - src[j]) * (p - j);
  }
  return out;
}

/** The voices summed as the engine plays them (see the header): { left, right } at sampleRate, durS long, before the master. */
export function mixdown(voices, { sampleRate = 48000, durS = 2 } = {}) {
  const N = Math.round(durS * sampleRate), L = new Float32Array(N), R = new Float32Array(N);
  for (const v of voices) {
    if (!Number.isFinite(v.gainDb)) continue;
    const st = v.samples.left ? v.samples : null, srcL = st ? st.left : v.samples, srcR = st ? st.right : null;
    const rate = v.rate ?? 1, len = Math.ceil((srcL.length / v.sampleRate / rate) * sampleRate) + 1, k = dbToK(v.gainDb);
    const a = lowpassInPlace(resample(srcL, v.sampleRate, rate, sampleRate, len), v.lowHz, sampleRate);
    const b = srcR ? lowpassInPlace(resample(srcR, v.sampleRate, rate, sampleRate, len), v.lowHz, sampleRate) : null;
    const pan = Math.max(-1, Math.min(1, v.pan ?? 0)), at = Math.round((v.atS ?? 0) * sampleRate);
    let gLL = 1, gRL = 0, gLR = 0, gRR = 1, gM = [1, 1];
    if (pan) {
      if (!b) { const x = (pan + 1) / 2; gM = [Math.cos(x * Math.PI / 2), Math.sin(x * Math.PI / 2)]; }
      else if (pan <= 0) { const x = pan + 1; gLL = 1; gLR = Math.cos(x * Math.PI / 2); gRR = Math.sin(x * Math.PI / 2); gRL = 0; }
      else { const x = pan; gLL = Math.cos(x * Math.PI / 2); gRL = Math.sin(x * Math.PI / 2); gRR = 1; gLR = 0; }
    }
    for (let i = 0; i < len && at + i < N; i++) {
      if (at + i < 0) continue;
      if (!b) { L[at + i] += a[i] * k * gM[0]; R[at + i] += a[i] * k * gM[1]; }
      else { L[at + i] += (a[i] * gLL + b[i] * gLR) * k; R[at + i] += (b[i] * gRR + a[i] * gRL) * k; }
    }
  }
  return { left: L, right: R };
}

/** A sum through a master (MASTER or MASTER_OLD) at a volume (the profile's, squared as the engine squares it): { left, right }. */
export function master({ left, right }, M = MASTER, { volume = 0.8, sampleRate = 48000 } = {}) {
  const n = left.length, g = volume * volume, look = Math.round(0.006 * sampleRate), L = new Float32Array(n), R = new Float32Array(n);
  const atk = 1 - Math.exp(-1 / (M.attackS * sampleRate)), rel = 1 - Math.exp(-1 / (M.releaseS * sampleRate));
  const make = dbToK(makeupDb(M)) * (M.trim ? dbToK(-makeupDb(M)) : 1);
  let gr = 0;
  for (let i = 0; i < n; i++) {
    const x = Math.max(Math.abs(left[i]), Math.abs(right[i])) * g, xDb = x > 0 ? 20 * Math.log10(x) : -200;
    const want = xDb > M.thresholdDb ? (M.thresholdDb + (xDb - M.thresholdDb) / M.ratio) - xDb : 0;
    gr += (want - gr) * (want < gr ? atk : rel);
    const j = i - look, k = dbToK(gr) * make * g;
    const l = j >= 0 ? left[j] * k : 0, r = j >= 0 ? right[j] * k : 0;
    L[i] = M.clip ? softClip(l) : Math.max(-1, Math.min(1, l)); R[i] = M.clip ? softClip(r) : Math.max(-1, Math.min(1, r));
  }
  return { left: L, right: R };
}

/** A stereo signal's numbers over [fromS, toS): { peakDb, rmsDb } (dBFS, the louder channel's peak, both channels' RMS). */
export function levels({ left, right }, { sampleRate = 48000, fromS = 0, toS = Infinity } = {}) {
  let p = 0, s = 0, n = 0;
  for (let i = Math.max(0, Math.round(fromS * sampleRate)); i < Math.min(left.length, toS * sampleRate); i++) { p = Math.max(p, Math.abs(left[i]), Math.abs(right[i])); s += left[i] * left[i] + right[i] * right[i]; n += 2; }
  const db = (v) => (v > 0 ? 20 * Math.log10(v) : -Infinity);
  return { peakDb: db(p), rmsDb: db(Math.sqrt(s / Math.max(1, n))) };
}

/** A stereo signal as a 16-bit PCM WAV file's bytes (a Uint8Array). */
export function wavBytes({ left, right }, sampleRate = 48000) {
  const n = left.length, buf = new ArrayBuffer(44 + n * 4), v = new DataView(buf);
  const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + n * 4, true); str(8, 'WAVE'); str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, n * 4, true);
  for (let i = 0; i < n; i++) {
    v.setInt16(44 + i * 4, Math.round(Math.max(-1, Math.min(1, left[i])) * 32767), true);
    v.setInt16(46 + i * 4, Math.round(Math.max(-1, Math.min(1, right[i])) * 32767), true);
  }
  return new Uint8Array(buf);
}
