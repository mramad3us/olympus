// OLYMPUS tests: the sounds' bake in slices (the build sheet v0.0.21 §1 item 12, §6 D: audio-gun's engine case, a file of its own for its CPU budget; the perf lens's P7).
//
// engine.js bakes every sound and gun part over the frames, BAKE_FRAME_MS (3 ms) a frame. Until v0.0.21 the check ran between
// parts and a part rendered whole: v0.0.18's release log printed a 13.6 ms slice, and a 4 s loop's layer (STRESS.breathBox) took 5.2
// ms at once. Every renderer now yields every BAKE_CHUNK_SAMPLES (synth.js renderSteps, gun.js's generators; their samples the
// same, held by audio-gun's A1 digest), and a step is begun only where the last one's length still fits the frame. Here, on
// audio-gun's stand-in context (engineOn): every slice under BAKE_SLICE_MAX_MS × k (the lesser longest of two whole bakes, the
// machine's factor read around them, as F60's tick is), a gun part's steps a chunk. v0.0.24 retired its lines' half (your #2's
// call-outs baked ahead of GO, v0.0.21's): no line is voiced, the voice synthesis is gone (the user, 2026-11-19: "forget voice
// synthesis, no voices.").
// Its bound is a wall clock's, so the file runs first and alone (tests/run.mjs: a file that reads machineK(), the CPU-time
// ceilings' rule): pooled beside another worker it read that worker's load (the review of 2026-11-16: 8.76 ms in the whole quick
// suite at JOBS=2, 3.8 to 4.2 ms alone). The run's factor is printed beside the bake's.
import { assert, fmt, machineNow, machineK } from './helpers.mjs';
import { BAKE_FRAME_MS, BAKE_SLICE_MAX_MS, BAKE_CHUNK_SAMPLES } from '../src/ui/audio/engine.js';
import { gunBakes, GUN_RATE_HZ, TAIL_RATE_HZ } from '../src/ui/audio/gun.js';
import { engineOn } from './audio-gun.test.mjs';

export default [
  {
    name: 'the bake in slices (v0.0.21): every slice of the engine\'s bake under BAKE_SLICE_MAX_MS 5 ms × k (v0.0.18\'s release log: 13.6 ms; a 4 s loop\'s layer 5.2 ms at once before the chunks), a step of every renderer a chunk (BAKE_CHUNK_SAMPLES) (v0.0.24: no line to bake, the voices gone)',
    fn() {
      // (the slice's own length, the noise of a shared machine removed as F60's tick is (stage 0's tick-costs.mjs): the lesser longest
      // of two whole bakes, held to the bound × the machine's factor read just before and just after them, the slower)
      const k0 = machineNow().k, N0 = engineOn('new'), N1 = engineOn('new'), k = Math.max(k0, machineNow().k);
      const N = N0.audio.stats.bake.longestMs <= N1.audio.stats.bake.longestMs ? N0 : N1, B = N.audio.stats.bake, other = (N === N0 ? N1 : N0).audio.stats.bake.longestMs;
      // (each step of every gun part between its yields: the chunk's cost, its 99.9th percentile (a lone one past it the runtime's own pause))
      const steps = [];
      for (const b of gunBakes('A3').slice(0, 2)) { const it = b.steps(0, GUN_RATE_HZ, TAIL_RATE_HZ); let r, t = performance.now(); do { r = it.next(); const n = performance.now(); steps.push(n - t); t = n; } while (!r.done); }
      steps.sort((a, b) => a - b);
      const p999 = steps[Math.min(steps.length - 1, Math.floor(steps.length * 0.999))];
      console.log(`      the sounds: ${N.frames} frames, ${B.slices} slices, the longest ${fmt(B.longestMs, 2)} ms (slice ${B.longestAt}; the other bake's ${fmt(other, 2)} ms), the frame's longest ${fmt(N.worstMs, 2)} ms, the mean ${fmt(B.sumMs / Math.max(1, B.slices), 2)} ms; A3's ${steps.length} steps (a chunk ${BAKE_CHUNK_SAMPLES} samples) at the 99.9th percentile ${fmt(p999, 2)} ms; the bound ${BAKE_SLICE_MAX_MS} ms × k ${fmt(k, 2)} (the run's machineK() ${fmt(machineK(), 2)}; BAKE_FRAME_MS ${BAKE_FRAME_MS})`);
      assert(B.longestMs <= BAKE_SLICE_MAX_MS * k, JSON.stringify({ longest: B.longestMs, other, frame: N.worstMs, k }));
      assert(p999 <= (BAKE_SLICE_MAX_MS - BAKE_FRAME_MS) * k, JSON.stringify({ p999, k }));
    },
  },
];
