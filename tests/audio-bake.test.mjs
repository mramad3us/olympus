// OLYMPUS tests: the sounds' bake in slices (the build sheet v0.0.21 §1 item 12, §6 D: voice-render's and audio-gun's engine case, a file of its own for their CPU budgets; the perf lens's P7).
//
// engine.js bakes every sound, gun part and line over the frames, BAKE_FRAME_MS (3 ms) a frame. Until v0.0.21 the check ran between
// parts and a part rendered whole: v0.0.18's release log printed a 13.6 ms slice, and a 4 s loop's layer (STRESS.breathBox) took 5.2
// ms at once. Every renderer now yields every BAKE_CHUNK_SAMPLES (synth.js renderSteps, gun.js's generators, voice.js lineGen; their
// samples the same, held by audio-gun's A1 digest), and a step is begun only where the last one's length still fits the frame. And a
// line queued once the sounds were whole was never baked (the frame baked only while a sound was left): every templated line said
// after the first key's bake, "Rifle, far left!" among them, waited for ever. Here, on audio-gun's stand-in context (engineOn): every
// slice under BAKE_SLICE_MAX_MS × k (the lesser longest of two whole bakes, the machine's factor read around them, as F60's tick is),
// your #2's call-outs (combat/two.js calloutLines) queued after the sounds and baked within a few frames, a gun part's steps a chunk.
// It fails without the fix: the engine had no prebakeCallouts, and the lines never baked.
// Its bound is a wall clock's, so the file runs first and alone (tests/run.mjs: a file that reads machineK(), the CPU-time
// ceilings' rule): pooled beside another worker it read that worker's load (the review of 2026-11-16: 8.76 ms in the whole quick
// suite at JOBS=2, 3.8 to 4.2 ms alone). The run's factor is printed beside the bake's.
import { assert, fmt, machineNow, machineK } from './helpers.mjs';
import { BAKE_FRAME_MS, BAKE_SLICE_MAX_MS, BAKE_CHUNK_SAMPLES } from '../src/ui/audio/engine.js';
import { gunBakes, GUN_RATE_HZ, TAIL_RATE_HZ } from '../src/ui/audio/gun.js';
import { calloutLines } from '../src/sim/combat/two.js';
import { createGame } from './game.mjs';
import { engineOn } from './audio-gun.test.mjs';

export default [
  {
    name: 'the bake in slices (v0.0.21): every slice of the engine\'s bake under BAKE_SLICE_MAX_MS 5 ms × k (v0.0.18\'s release log: 13.6 ms; a 4 s loop\'s layer 5.2 ms at once before the chunks), a step of every renderer a chunk (BAKE_CHUNK_SAMPLES), a line queued once the sounds are whole baked (v0.0.20: never), your #2\'s call-outs baked ahead of GO',
    fn() {
      // (the slice's own length, the noise of a shared machine removed as F60's tick is (stage 0's tick-costs.mjs): the lesser longest
      // of two whole bakes, held to the bound × the machine's factor read just before and just after them, the slower)
      const k0 = machineNow().k, N0 = engineOn('new'), N1 = engineOn('new'), k = Math.max(k0, machineNow().k);
      const N = N0.audio.stats.bake.longestMs <= N1.audio.stats.bake.longestMs ? N0 : N1, B = N.audio.stats.bake, other = (N === N0 ? N1 : N0).audio.stats.bake.longestMs;
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, setup: 'go' }), lines = calloutLines(g.state.armoury.range.turners);
      const queued = N.audio.prebakeCallouts(lines);
      let frames = 0, worst = 0;
      while (lines.some(t => !N.audio.calloutBaked(t)) && frames < 3000) { const t0 = performance.now(); N.audio.frame(null); worst = Math.max(worst, performance.now() - t0); frames++; }
      const all = lines.every(t => N.audio.calloutBaked(t));
      // (each step of every gun part between its yields: the chunk's cost, its 99.9th percentile (a lone one past it the runtime's own pause))
      const steps = [];
      for (const b of gunBakes('A3').slice(0, 2)) { const it = b.steps(0, GUN_RATE_HZ, TAIL_RATE_HZ); let r, t = performance.now(); do { r = it.next(); const n = performance.now(); steps.push(n - t); t = n; } while (!r.done); }
      steps.sort((a, b) => a - b);
      const p999 = steps[Math.min(steps.length - 1, Math.floor(steps.length * 0.999))];
      console.log(`      the sounds: ${N.frames} frames, ${B.slices} slices, the longest ${fmt(B.longestMs, 2)} ms (slice ${B.longestAt}; the other bake's ${fmt(other, 2)} ms), the frame's longest ${fmt(N.worstMs, 2)} ms, the mean ${fmt(B.sumMs / Math.max(1, B.slices), 2)} ms; the call-outs: ${lines.length} lines (${lines.slice(0, 3).join(' ')} …), ${queued} queued after the sounds, all baked ${all} in ${frames} frames, the frame's longest ${fmt(worst, 2)} ms; A3's ${steps.length} steps (a chunk ${BAKE_CHUNK_SAMPLES} samples) at the 99.9th percentile ${fmt(p999, 2)} ms; the bound ${BAKE_SLICE_MAX_MS} ms × k ${fmt(k, 2)} (the run's machineK() ${fmt(machineK(), 2)}; BAKE_FRAME_MS ${BAKE_FRAME_MS})`);
      assert(all && queued === lines.length && lines.length >= 27, JSON.stringify({ all, queued, n: lines.length, frames }));
      assert(B.longestMs <= BAKE_SLICE_MAX_MS * k && worst <= BAKE_SLICE_MAX_MS * k, JSON.stringify({ longest: B.longestMs, other, worst, frame: N.worstMs, k }));
      assert(p999 <= (BAKE_SLICE_MAX_MS - BAKE_FRAME_MS) * k, JSON.stringify({ p999, k }));
    },
  },
];
