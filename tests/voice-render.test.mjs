// OLYMPUS tests: the voice made by code, measured without anyone listening (src/ui/audio/voice.js; the build sheet v0.0.20 item 7; VIEWS §11.5's way).
//
// A vowel held, its steady 60 ms analysed by linear prediction (the autocorrelation method, order 12 at 8 kHz, the roots of
// the predictor: the textbook way to read formants off a spectrum), has its F1 and F2 within 12% of voices.js PHONES' table
// (Peterson and Barney's men). The tract is read on the vowel whispered, the source breath: a voiced vowel's harmonics pull a
// predictor's low root toward themselves (at 110 Hz the IY's 270 Hz F1 reads 225, the second harmonic's), so its numbers are
// printed beside, not judged. A line lasts core/speech.js spokenMs exactly (the tower's wait, the voice and the marks agree)
// and that is under its text's hold (handling.js durOf); its peak is its register's level; two renders are one; the bake
// advances in steps far under engine.js BAKE_FRAME_MS. Every number printed.
import { assert, fmt, machineK } from './helpers.mjs';
import { renderLine, lineGen, linePlan } from '../src/ui/audio/voice.js';
import { biquad } from '../src/ui/audio/synth.js';
import { PHONES, REGISTER_DB, VOICES, VOICE_RATE_HZ } from '../src/data/voices.js';
import { spokenMs } from '../src/core/speech.js';
import { BAKE_FRAME_MS } from '../src/ui/audio/engine.js';
import { SAY_MS, SAY_WORD_MS } from '../src/sim/scenarios/handling.js';
import { houseLines } from './voice-lexicon.test.mjs';

const SR = VOICE_RATE_HZ;
/** The formants of a stretch of samples at SR (see the header): [Hz…] ascending, bandwidths under 600 Hz. */
function formantsOf(x0, order = 12) {
  const k = biquad('lowpass', 3500, Math.SQRT1_2, SR), f = new Float64Array(x0.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x0.length; i++) { const x = x0[i], y = k.b0 * x + k.b1 * x1 + k.b2 * x2 - k.a1 * y1 - k.a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; f[i] = y; }
  const x = []; for (let i = 0; i < f.length; i += 3) x.push(f[i]);
  const sr = SR / 3, n = x.length, w = x.map((v, i) => (v - (i ? 0.63 * x[i - 1] : 0)) * (0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (n - 1))));
  const r = []; for (let j = 0; j <= order; j++) { let s = 0; for (let i = j; i < n; i++) s += w[i] * w[i - j]; r.push(s); }
  let a = [1], e = r[0];
  for (let i = 1; i <= order; i++) { let acc = r[i]; for (let j = 1; j < i; j++) acc += a[j] * r[i - j]; const kk = -acc / e, na = a.slice(); for (let j = 1; j < i; j++) na[j] = a[j] + kk * a[i - j]; na[i] = kk; a = na; e *= 1 - kk * kk; }
  // (the predictor's roots, Durand and Kerner's iteration)
  const mul = (p, q) => [p[0] * q[0] - p[1] * q[1], p[0] * q[1] + p[1] * q[0]], sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
  const div = (p, q) => { const d = q[0] * q[0] + q[1] * q[1]; return [(p[0] * q[0] + p[1] * q[1]) / d, (p[1] * q[0] - p[0] * q[1]) / d]; };
  const ev = (z) => { let v = [1, 0]; for (let j = 1; j <= order; j++) v = [v[0] * z[0] - v[1] * z[1] + a[j], v[0] * z[1] + v[1] * z[0]]; return v; };
  let roots = Array.from({ length: order }, (_, i) => [0.9 * Math.cos((2 * Math.PI * i) / order + 0.3), 0.9 * Math.sin((2 * Math.PI * i) / order + 0.3)]);
  for (let it = 0; it < 400; it++) roots = roots.map((z, i) => { let d = [1, 0]; roots.forEach((q, j) => { if (j !== i) d = mul(d, sub(z, q)); }); return sub(z, div(ev(z), d)); });
  return roots.filter(z => z[1] > 0).map(z => ({ f: (Math.atan2(z[1], z[0]) * sr) / (2 * Math.PI), bw: (-Math.log(Math.hypot(z[0], z[1])) * sr) / Math.PI })).filter(q => q.f > 150 && q.bw < 600).map(q => q.f).sort((p, q) => p - q);
}
const held = (ph) => ({ ms: 600, leadMs: 0, words: [], segs: [{ ph, part: 'main', fromMs: 50, toMs: 550, accent: false, command: false, next: null }] });
const peakDb = (x) => { let p = 0; for (const v of x) p = Math.max(p, Math.abs(v)); return 20 * Math.log10(p); };

export default [
  {
    name: 'a vowel held has its F1 and F2 within 12% of the table (whispered, read by linear prediction off its steady 60 ms; voiced at the PA\'s 110 Hz printed beside): IY IH EH AE AH AA AO UH UW ER',
    fn() {
      const rows = [], bad = [];
      for (const v of ['IY', 'IH', 'EH', 'AE', 'AH', 'AA', 'AO', 'UH', 'UW', 'ER']) {
        const mid = (x) => x.slice(Math.round(0.27 * SR), Math.round(0.33 * SR));
        const w = formantsOf(mid(renderLine('', { plan: held(v), voice: 'pa', set: 'b', register: 'whisper' })));
        const vo = formantsOf(mid(renderLine('', { plan: held(v), voice: 'pa', set: 'b', hz: 110 })));
        const [t1, t2] = PHONES[v].f, e1 = Math.abs(w[0] - t1) / t1, e2 = Math.abs(w[1] - t2) / t2;
        rows.push(`${v} ${t1}/${t2} → ${Math.round(w[0])}/${Math.round(w[1])} (${fmt(100 * e1, 0)}%, ${fmt(100 * e2, 0)}%; voiced ${Math.round(vo[0])}/${Math.round(vo[1])})`);
        if (!(e1 <= 0.12 && e2 <= 0.12)) bad.push(v);
      }
      console.log(`      ${rows.join('; ')}`);
      assert(!bad.length, `off the table: ${bad.join(', ')}`);
    },
  },
  {
    name: 'a line lasts spokenMs exactly, under its text\'s hold (handling.js durOf: 3.5 s and 0.33 s a word); its peak its register\'s level through its speaker\'s path; two renders are one, two lines differ; the bake\'s steps (their 99.9th percentile) under BAKE_FRAME_MS',
    fn() {
      const lines = houseLines(), out = [], bad = [];
      let worstStepMs = 0, worstLine = '', totalMs = 0, audioS = 0;
      const steps = [];
      // (every line's plan is its spokenMs; one line in five rendered whole, every speaker and register among them: the quick file's CPU)
      const planBad = lines.filter(t => linePlan(t).ms !== spokenMs(t) || linePlan(t).segs.some(x => x.toMs > spokenMs(t)));
      if (planBad.length) bad.push({ plans: planBad.slice(0, 3) });
      for (const [i, t] of lines.entries()) {
        if (i % 5) continue;
        const voice = ['pa', 'two', 'me', 'man'][(i / 5) % 4], register = ['plain', 'shout', 'whisper'][(i / 5) % 3];
        const it = lineGen(t, { voice, register });
        let r, last = performance.now(), t0 = last;
        do { r = it.next(); const now = performance.now(); steps.push(now - last); if (now - last > worstStepMs) { worstStepMs = now - last; worstLine = t; } last = now; } while (!r.done);
        totalMs += performance.now() - t0;
        const x = r.value, lenMs = (x.length / SR) * 1000, hold = SAY_MS + SAY_WORD_MS * t.split(/\s+/).filter(Boolean).length, want = REGISTER_DB[register] + VOICES[voice].db;
        audioS += x.length / SR;
        if (Math.abs(lenMs - spokenMs(t)) > 1000 / SR || !(lenMs < hold) || Math.abs(peakDb(x) - want) > 0.01) bad.push({ t: t.slice(0, 40), lenMs, ms: spokenMs(t), hold, peak: peakDb(x), want });
        if (i < 15) out.push(`"${t.slice(0, 32)}…" ${voice}/${register} ${fmt(lenMs / 1000, 2)} s (spoken ${fmt(spokenMs(t) / 1000, 2)}, held ${fmt(hold / 1000, 2)}), peak ${fmt(peakDb(x))} dBFS`);
      }
      const a = renderLine('Room clear!', { voice: 'me', register: 'shout' }), b = renderLine('Room clear!', { voice: 'me', register: 'shout' }), c = renderLine('Hall clear!', { voice: 'me', register: 'shout' });
      const same = a.length === b.length && a.every((v, i) => v === b[i]), differ = a.some((v, i) => v !== c[i]);
      const plan = linePlan('Practice rounds. With a magazine of ten, LOAD.');
      // (the steps' 99.9th percentile is the bake's: a lone step past it is the runtime's own pause (a collection, a tier-up), which no slicing can help)
      steps.sort((p, q) => p - q);
      const p999 = steps[Math.min(steps.length - 1, Math.floor(steps.length * 0.999))], p50 = steps[steps.length >> 1];
      console.log(`      ${out.join('; ')}`);
      console.log(`      ${lines.length} lines planned to their spokenMs, ${Math.ceil(lines.length / 5)} rendered: ${fmt(audioS, 1)} s of speech in ${fmt(totalMs, 0)} ms (${fmt((1000 * audioS) / Math.max(1, totalMs), 0)}× real time); ${steps.length} bake steps, median ${fmt(p50, 3)} ms, 99.9th percentile ${fmt(p999, 2)} ms, the longest ${fmt(worstStepMs, 2)} ms ("${worstLine.slice(0, 30)}…") against BAKE_FRAME_MS ${BAKE_FRAME_MS} × k ${fmt(machineK(), 2)}; the same twice ${same}, two lines differ ${differ}; LOAD's words at ${plan.words.map(w => `${w.tok} ${fmt(w.fromMs / 1000, 2)}`).join(', ')} s`);
      assert(!bad.length, JSON.stringify(bad.slice(0, 4)));
      assert(same && differ && p999 < BAKE_FRAME_MS * machineK(), JSON.stringify({ same, differ, p999, worstStepMs }));
    },
  },
];
