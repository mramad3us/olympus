// OLYMPUS audio: a voice made by code, a line of words spoken by a formant synthesiser (the build sheet v0.0.20 item 7; feel.md FL-3; VIEWS §11).
//
// The house's lines were text with five vowel glides for stand-ins (src/data/sounds.js HOUSE's paGo, paStop, paStandby,
// shoutClear, whisperReady): 55 of 237 lines over six lanes made a sound. This module speaks every line, with no recording
// and no Math.random: a classic cascade formant synthesiser (Klatt's, 1980, cut to what a range officer and a stack need).
//   spell     a word to phonemes by src/data/voices.js LEXICON, else by its endings (MORPH), a number by core/speech.js's
//             rule, a lone capital by its letter's name, and only then letter by letter (counted: the lexicon test fails on it).
//   plan      a line to a timeline of segments, timed to core/speech.js spokenMs: SPOKEN_LEAD_MS of breath, then each token
//             of spokenWords its share of SPOKEN_WORD_MS a word, by its phonemes' natural lengths, less the pauses its
//             punctuation takes (PAUSE_K); a word squeezed or stretched at most 0.55 to 1.6 times, the rest of its slot
//             silence. So the voice, the tower's wait (shoothouse.js R.paUntilMs) and the speaker's mark never part.
//   source    a glottal pulse (Rosenberg's, its open quotient 0.6: a rise over 40% of the period, a fall over 20%, shut
//             for the rest; its derivative, the lips' radiation folded in), at the speaker's pitch falling PROSODY.decline
//             over the line, a stressed vowel up PROSODY.accent and a command word (written in capitals: "LOAD", "GO") up
//             PROSODY.command and PROSODY.commandDb louder; aspiration noise for an H and a voiceless stop's release.
//   tract     three formants cascaded (two-pole resonators, Klatt's form), F4 and F5 fixed over them, each tracked to its
//             phoneme's target by a one-pole of FORMANT_TAU_MS (12 ms: a transition about 40 ms long, as FL-3 asks);
//             a nasal's first formant damped wider; a fricative's or a burst's noise through its own band in parallel.
//   path      the speaker's (voices.js VOICES): the PA's horn band and its drive, the #2's helmet speaker's band, your own
//             helmet's low shelf; then the line's register level (REGISTER_DB: a shout, plain, a whisper).
// A shout raises the pitch PROSODY.shoutHz and the first formant PROSODY.shoutF1; V-d's effort adds breath (PROSODY.breathDb)
// to its voiced sounds; a whisper has no voicing, its sonorants all breath. The noise is the game's sfc32 on a stream named
// for the line, its speaker, its register and its set (src/core/rng.js stream): one line is the same samples everywhere.
// lineGen is the render a stage at a time (a word a yield), so the engine bakes a line within its BAKE_FRAME_MS a frame.
//
// Pure: spell, linePlan, lineGen, renderLine and the constants; engine.js bakes and plays, house.js decides what is said by whom.
import { stream, next } from '../../core/rng.js';
import { spokenMs, spokenWords, SPOKEN_LEAD_MS, SPOKEN_WORD_MS } from '../../core/speech.js';
import { biquad, BAKE_CHUNK_SAMPLES } from './synth.js';
import { LEXICON, MORPH, LETTERS, PHONES, VOICES, VOICE_SET, REGISTER_DB, PROSODY, PAUSE_K, VOICE_RATE_HZ } from '../../data/voices.js';

/** A formant's track toward its target (ms, a one-pole's time constant). */
export const FORMANT_TAU_MS = 12;
/** An amplitude's track (ms): fast, so a stop's closure and burst are crisp. */
export const AMP_TAU_MS = 3;
/** The fixed fourth and fifth formants (Hz) and every formant's bandwidth (Hz: F1 to F5). */
export const F45_HZ = Object.freeze([3300, 3850]);
export const BW_HZ = Object.freeze([70, 90, 140, 220, 280]);
/** A word's squeeze and stretch against its natural length (×). */
export const WORD_K = Object.freeze([0.55, 1.6]);
/** The samples a parameter block holds (the coefficients recomputed each block). */
const BLOCK = 16;
const TAU = 2 * Math.PI;
const dbToK = (db) => 10 ** (db / 20);
const VOWELS = new Set(Object.entries(PHONES).filter(([, p]) => p.kind === 'vowel').map(([k]) => k));
const isVowel = (ph) => VOWELS.has(ph.replace(/\d$/, ''));
const bare = (ph) => ph.replace(/\d$/, '');

// ---- spelling ----
const VOICELESS = new Set(['P', 'T', 'K', 'F', 'TH', 'S', 'SH', 'CH', 'HH']);
const HISS = new Set(['S', 'Z', 'SH', 'ZH', 'CH', 'JH']);
function ending(ph, sound) {
  const last = bare(ph[ph.length - 1] ?? '');
  if (sound === 's') return HISS.has(last) ? ['IH', 'Z'] : VOICELESS.has(last) ? ['S'] : ['Z'];
  if (sound === 'd') return last === 'T' || last === 'D' ? ['IH', 'D'] : VOICELESS.has(last) ? ['T'] : ['D'];
  if (sound === 'ing') return ['IH', 'NG'];
  if (sound === 'er') return ['ER'];
  if (sound === 'ers') return ['ER', 'Z'];
  return [];
}
// (letter by letter, the last resort: a vowel letter as its short vowel, a consonant as its sound)
const RULE = Object.freeze({ a: 'AE', b: 'B', c: 'K', d: 'D', e: 'EH', f: 'F', g: 'G', h: 'HH', i: 'IH', j: 'JH', k: 'K', l: 'L', m: 'M', n: 'N', o: 'AA', p: 'P', q: 'K', r: 'R', s: 'S', t: 'T', u: 'AH', v: 'V', w: 'W', x: 'K S', y: 'Y', z: 'Z' });
/**
 * A word as said (see the header): { ph: [phonemes], how: 'lexicon' | 'morph' | 'letter' | 'rule' | 'none' }. word is a token's
 * letters ("door's", "Lane", "A"); its case matters only for a lone capital.
 */
export function spell(word) {
  const w0 = String(word ?? '').replace(/[^A-Za-z']/g, '').replace(/^'+|'+$/g, '');
  if (!w0) return { ph: [], how: 'none' };
  if (/^[A-Z]$/.test(w0) && w0 !== 'I') return { ph: LETTERS[w0].split(' '), how: 'letter' };
  const w = w0.toLowerCase();
  if (LEXICON[w]) return { ph: [...LEXICON[w]], how: 'lexicon' };
  for (const [end, put, sound] of MORPH) {
    if (!w.endsWith(end) || w.length <= end.length + 1) continue;
    let base = w.slice(0, -end.length) + put;
    // (a doubled last consonant: "stopped", "sitting", "fragged")
    if (!LEXICON[base] && !put && /([b-df-hj-np-tv-z])\1$/.test(base)) base = base.slice(0, -1);
    if (LEXICON[base]) return { ph: [...LEXICON[base], ...ending(LEXICON[base], sound)], how: 'morph' };
  }
  return { ph: [...w].flatMap(c => (RULE[c] ? RULE[c].split(' ') : [])), how: 'rule' };
}
/** A token of spokenWords as said: its words (a hyphen parts two), each spelt: [{ word, ph, how }]. */
export function spellToken(tok) {
  return String(tok).split(/[-/]/).filter(x => /[A-Za-z]/.test(x)).map(x => ({ word: x.replace(/[^A-Za-z']/g, ''), ...spell(x) }));
}

// ---- the plan ----
// (a phoneme's natural length (ms) as the plan counts it)
function natMs(ph) {
  const p = PHONES[bare(ph)];
  if (!p) return 0;
  if (p.kind === 'stop') return p.closeMs + 10 + p.aspMs;
  if (p.kind === 'affr') return p.closeMs + p.ms;
  return p.ms;
}
const isCommand = (tok) => /^[A-Z]{2,}[.,!?:;]*$/.test(tok);
/**
 * A line's timeline (see the header): { ms (spokenMs), leadMs, words: [{ tok, fromMs, toMs, ph, how, command }], segs: [{ ph,
 * fromMs, toMs, kind, part, accent, command }] }. Its length is spokenMs(text) exactly.
 */
export function linePlan(text) {
  const toks = spokenWords(text), ms = spokenMs(text);
  if (!toks.length) return { ms: 0, leadMs: 0, words: [], segs: [] };
  const words = toks.map(tok => {
    const parts = spellToken(tok), ph = parts.flatMap(p => p.ph), how = parts.some(p => p.how === 'rule') ? 'rule' : parts.length ? parts[0].how : 'none';
    const punct = /[.,;:!?]+$/.exec(tok)?.[0]?.slice(-1) ?? null;
    return { tok, ph, how, command: isCommand(tok), nat: ph.reduce((a, x) => a + natMs(x), 0), punct, vowels: ph.filter(isVowel).length };
  });
  const budget = SPOKEN_WORD_MS * toks.length;
  const pauses = words.map((w, i) => (i < words.length - 1 && w.punct ? (PAUSE_K[w.punct] ?? 0) * SPOKEN_WORD_MS : 0));
  const left = budget - pauses.reduce((a, b) => a + b, 0), natAll = words.reduce((a, w) => a + Math.max(1, w.nat), 0);
  let t = SPOKEN_LEAD_MS;
  const segs = [];
  for (const [i, w] of words.entries()) {
    const slot = (left * Math.max(1, w.nat)) / natAll, k = Math.min(WORD_K[1], Math.max(WORD_K[0], slot / Math.max(1, w.nat)));
    w.fromMs = t;
    let at = t;
    for (const [j, ph] of w.ph.entries()) {
      const p = PHONES[bare(ph)];
      if (!p) continue;
      // (a stressed vowel: marked 1, or the only vowel of the word)
      const accent = isVowel(ph) && (/1$/.test(ph) || w.vowels === 1);
      const nextPh = w.ph[j + 1] ?? words[i + 1]?.ph?.[0] ?? null;
      const push = (part, dMs) => { segs.push({ ph: bare(ph), part, fromMs: at, toMs: at + dMs, accent, command: w.command, next: nextPh ? bare(nextPh) : null }); at += dMs; };
      if (p.kind === 'stop') { push('close', p.closeMs * k); push('burst', 10); if (p.aspMs) push('asp', p.aspMs * k); }
      else if (p.kind === 'affr') { push('close', p.closeMs * k); push('fric', p.ms * k); }
      else push('main', p.ms * k);
    }
    w.toMs = at;
    t += slot + pauses[i];
  }
  // (rounding: the timeline never past the line's length)
  const end = ms;
  for (const s of segs) { s.fromMs = Math.min(end, s.fromMs); s.toMs = Math.min(end, s.toMs); }
  return { ms, leadMs: SPOKEN_LEAD_MS, words: words.map(({ tok, fromMs, toMs, ph, how, command }) => ({ tok, fromMs, toMs, ph, how, command })), segs: segs.filter(s => s.toMs > s.fromMs) };
}

// ---- the render ----
// (a segment's targets: formants [F1, F2, F3], voicing, aspiration, frication and its band [Hz, Q], the nasal's damping)
function targetOf(seg, u, prevF) {
  const p = PHONES[seg.ph], nextP = seg.next ? PHONES[seg.next] : null;
  const fOf = (q) => (q?.f ? [...q.f] : null);
  const nextF = fOf(nextP) ?? prevF;
  const T = { f: prevF, av: 0, ah: 0, af: 0, band: null, nasal: false };
  if (p.kind === 'vowel') { T.f = p.to && u > 0.45 ? p.f.map((f, i) => f + (p.to[i] - f) * Math.min(1, (u - 0.45) / 0.55)) : [...p.f]; T.av = 1; }
  else if (p.kind === 'nasal') { T.f = [...p.f]; T.av = 0.5; T.nasal = true; }
  else if (p.kind === 'liquid' || p.kind === 'glide') { T.f = [...p.f]; T.av = 0.8; }
  else if (p.kind === 'asp') { T.f = nextF; T.ah = dbToK(p.db) * 4; }
  else if (p.kind === 'fric') { T.f = [prevF[0], p.locus, prevF[2]]; T.av = p.voiced ? 0.3 : 0; T.af = dbToK(p.db); T.band = p.band; }
  else if (p.kind === 'stop' || p.kind === 'affr') {
    if (seg.part === 'close') { T.f = [Math.min(prevF[0], 300), p.locus, prevF[2]]; T.av = p.voiced ? 0.1 : 0; }
    else if (seg.part === 'burst') { T.f = nextF; T.af = dbToK(p.burstDb ?? p.db); T.band = p.burst ?? p.band; T.av = p.voiced ? 0.3 : 0; }
    else if (seg.part === 'asp') { T.f = nextF; T.ah = 0.35; }
    else { T.f = [prevF[0], p.locus, prevF[2]]; T.av = p.voiced ? 0.3 : 0; T.af = dbToK(p.db); T.band = p.band; }
  }
  return T;
}
// (a two-pole resonator's coefficients, Klatt's form: unity gain at 0 Hz)
function reso(f, bw, sr) {
  const c = -Math.exp(-TAU * bw / sr), b = 2 * Math.exp(-Math.PI * bw / sr) * Math.cos(TAU * f / sr);
  return { a: 1 - b - c, b, c };
}
/** A pass over a line's samples is cut in chunks of this many, a yield between (the bake's budget): synth.js BAKE_CHUNK_SAMPLES (8,192 before, the same samples). */
const CHUNK = BAKE_CHUNK_SAMPLES;
// (a biquad over a buffer in place, a chunk a yield)
function* filterSteps(buf, k) {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i0 = 0; i0 < buf.length; i0 += CHUNK) {
    for (let i = i0; i < Math.min(buf.length, i0 + CHUNK); i++) { const x = buf[i], y = k.b0 * x + k.b1 * x1 + k.b2 * x2 - k.a1 * y1 - k.a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; buf[i] = y; }
    yield 'filter';
  }
  return buf;
}
// (a function of each sample in place, a chunk a yield)
function* mapSteps(buf, fn) { for (let i0 = 0; i0 < buf.length; i0 += CHUNK) { for (let i = i0; i < Math.min(buf.length, i0 + CHUNK); i++) buf[i] = fn(buf[i], i); yield 'map'; } return buf; }
const peakOf = (buf) => { let p = 0; for (let i = 0; i < buf.length; i++) p = Math.max(p, Math.abs(buf[i])); return p; };

/** A line said: a Float32Array at sampleRate, spokenMs(text) long, its peak its register's level (see the header). */
export function renderLine(text, opts = {}) { const it = lineGen(text, opts); for (;;) { const r = it.next(); if (r.done) return r.value; } }
/**
 * A line said a stage at a time (a generator returning its samples). voice: 'pa' | 'two' | 'me' | 'man' (voices.js VOICES);
 * register: 'shout' | 'plain' | 'whisper'; set: 'b' | 'c' | 'd' (voices.js VOICE_SET; 'a' renders as 'c', since V-a is no voice);
 * hz: the pitch, for the tests (else the voice's); plan: a timeline of linePlan's shape to say instead (the tests' held vowels).
 */
export function* lineGen(text, { voice = 'pa', register = 'plain', set = 'c', sampleRate = VOICE_RATE_HZ, hz = null, plan: given = null } = {}) {
  const sr = sampleRate, Vx = VOICES[voice] ?? VOICES.pa, S = VOICE_SET[set]?.words ? VOICE_SET[set] : VOICE_SET.c;
  const plan = given ?? linePlan(text), n = Math.max(1, Math.round(plan.ms * sr / 1000)), out = new Float32Array(n);
  if (!plan.segs.length) return out;
  const r = stream('voice', voice, register, set, String(text));
  const shout = register === 'shout', whisper = register === 'whisper', effort = shout && S.effort;
  const f0 = (hz ?? Vx.hz) * (shout ? 1 + PROSODY.shoutHz : 1), lenS = plan.ms / 1000;
  // (the tracks: formants and amplitudes, smoothed per block)
  let F = [500, 1500, 2500], AV = 0, AH = 0, AF = 0, ACC = 1, GAIN = 1;
  const kF = 1 - Math.exp(-BLOCK / sr / (FORMANT_TAU_MS / 1000)), kA = 1 - Math.exp(-BLOCK / sr / (AMP_TAU_MS / 1000));
  // (the resonators' state: F1 to F5 cascaded, the fricative's band in parallel)
  const y1 = new Float64Array(5), y2 = new Float64Array(5);
  let fx1 = 0, fx2 = 0, fy1 = 0, fy2 = 0, fk = null, band = null;
  let phase = 0, gPrev = 0, si = 0, prevF = [500, 1500, 2500];
  const segs = plan.segs;
  for (let i0 = 0; i0 < n; i0 += BLOCK) {
    const tMs = (i0 / sr) * 1000;
    while (si < segs.length - 1 && segs[si].toMs <= tMs) { prevF = F.slice(); si++; }
    const seg = segs[si], inSeg = tMs >= seg.fromMs && tMs < seg.toMs, u = inSeg ? (tMs - seg.fromMs) / Math.max(1, seg.toMs - seg.fromMs) : 0;
    const T = inSeg ? targetOf(seg, u, prevF) : { f: F, av: 0, ah: 0, af: 0, band: null, nasal: false };
    const tf = T.f ?? F;
    for (let j = 0; j < 3; j++) F[j] += (tf[j] * (j === 0 && shout ? 1 + PROSODY.shoutF1 : 1) - F[j]) * kF;
    let av = T.av, ah = T.ah;
    if (whisper) { ah = Math.max(ah, av * 0.6); av = 0; }
    if (effort && av > 0.5) ah += 0.12 * dbToK(PROSODY.breathDb);
    AV += (av - AV) * kA; AH += (ah - AH) * kA; AF += (T.af - AF) * kA;
    const accent = inSeg && seg.accent ? 1 + PROSODY.accent : 1, cmd = inSeg && seg.command;
    ACC += ((accent * (cmd ? 1 + PROSODY.command : 1)) - ACC) * kF;
    GAIN += ((cmd ? dbToK(PROSODY.commandDb) : 1) - GAIN) * kF;
    if (T.band && T.band !== band) { band = T.band; fk = biquad('bandpass', band[0], band[1], sr); }
    const R = [...F.map((f, j) => reso(f, BW_HZ[j] * (j === 0 && T.nasal ? 2.2 : 1), sr)), reso(F45_HZ[0], BW_HZ[3], sr), reso(F45_HZ[1], BW_HZ[4], sr)];
    const pitch = f0 * (1 + PROSODY.decline / 2 - (PROSODY.decline * tMs) / 1000 / Math.max(0.2, lenS)) * ACC;
    for (let i = i0; i < Math.min(n, i0 + BLOCK); i++) {
      // (the glottal pulse: Rosenberg's, its derivative; a hair of vibrato from the dice)
      const t = i / sr, fNow = pitch * (1 + 0.006 * Math.sin(TAU * 5.3 * t));
      phase += fNow / sr; if (phase >= 1) phase -= 1;
      const g = phase < 0.4 ? 0.5 * (1 - Math.cos(Math.PI * phase / 0.4)) : phase < 0.6 ? Math.cos(Math.PI * (phase - 0.4) / 0.4) : 0;
      const dg = (g - gPrev) * (sr / (fNow * 4)); gPrev = g;
      const nz = next(r) * 2 - 1;
      let x = AV * dg + AH * nz * 0.5;
      for (let j = 0; j < 5; j++) { const y = R[j].a * x + R[j].b * y1[j] + R[j].c * y2[j]; y2[j] = y1[j]; y1[j] = y; x = y; }
      // (the noise's own band, in parallel: a hiss, a burst)
      let fr = 0;
      if (fk && AF > 1e-4) { const xn = nz * AF; fr = fk.b0 * xn + fk.b1 * fx1 + fk.b2 * fx2 - fk.a1 * fy1 - fk.a2 * fy2; fx2 = fx1; fx1 = xn; fy2 = fy1; fy1 = fr; }
      out[i] = (x + fr * 3) * GAIN;
    }
    if (i0 % 512 === 0) yield 'block';
  }
  // (the DC's out, then the speaker's path: its band, its drive, its shelf)
  let xp = 0, yh = 0;
  const aHp = Math.exp(-TAU * 60 / sr);
  // (each pass in chunks, so a long line's path never takes a frame's budget at once)
  yield* mapSteps(out, (v) => { yh = aHp * (yh + v - xp); xp = v; return yh; });
  let p = peakOf(out);
  if (p > 0) yield* mapSteps(out, (v) => v / p);
  if (S.paths) {
    if (Vx.band) {
      yield* filterSteps(out, biquad('highpass', Vx.band[0], Math.SQRT1_2, sr));
      yield* filterSteps(out, biquad('lowpass', Vx.band[1], Math.SQRT1_2, sr));
      yield* filterSteps(out, biquad('highpass', Vx.band[0], Math.SQRT1_2, sr));
    }
    if (Vx.drive > 1) { p = peakOf(out); const d = Vx.drive, k = Math.tanh(d); if (p > 0) yield* mapSteps(out, (v) => Math.tanh((d * v) / p) / k); }
    if (Vx.shelf) { const lo = yield* filterSteps(Float32Array.from(out), biquad('lowpass', 300, Math.SQRT1_2, sr)), k = dbToK(Vx.shelf) - 1; yield* mapSteps(out, (v, i) => v + lo[i] * k); }
  }
  // (its level: the register's peak, the speaker's trim; 4 ms faded at each end)
  p = peakOf(out);
  yield 'peak';
  const level = dbToK((REGISTER_DB[register] ?? REGISTER_DB.plain) + (Vx.db ?? 0)), fade = Math.min(n >> 1, Math.round(0.004 * sr)), g = p > 0 ? level / p : 0;
  yield* mapSteps(out, (v) => v * g);
  for (let i = 0; i < fade; i++) { out[i] *= i / fade; out[n - 1 - i] *= i / fade; }
  return out;
}
