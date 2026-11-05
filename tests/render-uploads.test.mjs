// OLYMPUS tests: the upload queue (src/render/uploads.js), on a fake clock. Quick: no GPU.
//
// TECH §9.7 and VIEWS §14 ("no upload over 1 MB in a frame"): everything sent mid-play goes through
// one queue drained within UPLOAD_BYTES_FRAME (1 MB) and UPLOAD_FRAME_MS (2 ms) a frame, the player's
// own first, a job bigger than the budget alone in its frame. The jobs here only advance the fake
// clock and count their bytes; the numbers printed are the frames a backlog takes and the bytes and
// milliseconds of each.
import { assert, fmt } from './helpers.mjs';
import { createUploads, UPLOAD_BYTES_FRAME, UPLOAD_FRAME_MS } from '../src/render/uploads.js';

const KB = 1024, MB = 1024 * KB;
/** A fake clock and jobs that take msEach of it. */
function rig(msEach = 0.3) {
  let t = 0;
  const ran = [];
  const q = createUploads({ now: () => t });
  const job = (key, bytes, own = false, ms = msEach) => q.queue({ key, bytes, own, run: () => { t += ms; ran.push(key); } });
  return { q, job, ran, advance: (ms) => { t += ms; } };
}

export default [
  {
    name: 'a 4 MB backlog drains at most 1 MB and 2 ms a frame on a fake clock, the player\'s own first',
    fn() {
      const { q, job, ran } = rig(0.3);
      for (let i = 0; i < 13; i++) job(`band:${i}`, 256 * KB);
      job('own:gait', 512 * KB, true); job('own:arms', 256 * KB, true);       // (queued last, sent first)
      const total = q.bytesWaiting, frames = [];
      while (q.pending) {
        const before = ran.length, f = q.drain();
        frames.push({ ...f, keys: ran.slice(before) });
        assert(frames.length < 50, 'the queue never drained');
      }
      console.log(`      ${fmt(total / MB, 2)} MB in ${frames.length} frames: ${frames.map(f => `${f.n} jobs ${fmt(f.bytes / KB, 0)} KB ${fmt(f.ms, 1)} ms`).join('; ')}`);
      assert(total === 4 * MB, `the backlog is ${total} bytes`);
      assert(frames[0].keys[0] === 'own:gait' && frames[0].keys[1] === 'own:arms', `the player's first: ${frames[0].keys.join(', ')}`);
      for (const f of frames) {
        assert(f.bytes <= UPLOAD_BYTES_FRAME, `a frame sent ${f.bytes} bytes`);
        // (the clock is read after each job: none starts once the frame's 2 ms are spent)
        assert(f.ms - 0.3 < UPLOAD_FRAME_MS, `a job started ${fmt(f.ms - 0.3, 2)} ms into its frame`);
      }
      assert(frames.length === 4, `${frames.length} frames for 4 MB`);
    },
  },
  {
    name: 'the milliseconds bind too: slow jobs stop a frame before its megabyte',
    fn() {
      const { q, job } = rig(0.9);
      for (let i = 0; i < 12; i++) job(`band:${i}`, 64 * KB);
      const per = [];
      while (q.pending) per.push(q.drain());
      console.log(`      12 jobs of 64 KB at 0.9 ms each: ${per.map(f => f.n).join(', ')} a frame (${per.map(f => fmt(f.ms, 1)).join(', ')} ms)`);
      assert(per.every(f => f.n <= 3) && per[0].n === 3, `jobs a frame: ${per.map(f => f.n)}`);
    },
  },
  {
    name: 'a 1.5 MB job runs alone in its frame, and the jobs after it wait for the next',
    fn() {
      const { q, job, ran } = rig(0.2);
      job('small:a', 200 * KB); job('big', 1.5 * MB); job('small:b', 200 * KB);
      const f1 = q.drain(), r1 = ran.slice();
      const f2 = q.drain(), r2 = ran.slice(r1.length);
      const f3 = q.drain(), r3 = ran.slice(r1.length + r2.length);
      console.log(`      frame 1: ${r1.join(', ')} (${fmt(f1.bytes / KB, 0)} KB); frame 2: ${r2.join(', ')} (${fmt(f2.bytes / KB, 0)} KB); frame 3: ${r3.join(', ')} (${fmt(f3.bytes / KB, 0)} KB); alone ${q.stats.alone}`);
      assert(r1.join() === 'small:a' && r2.join() === 'big' && r3.join() === 'small:b', JSON.stringify({ r1, r2, r3 }));
      assert(q.stats.alone === 1 && f2.bytes === 1.5 * MB, JSON.stringify(q.stats));
    },
  },
  {
    name: 'a key queued again replaces the job waiting under it, and a cancelled job never runs',
    fn() {
      const { q, job, ran } = rig(0.1);
      job('sign', 10 * KB); job('sign', 12 * KB); job('band:1', 300 * KB); job('band:2', 300 * KB);
      assert(q.pending === 3 && q.bytesWaiting === 612 * KB, `${q.pending} waiting, ${q.bytesWaiting} bytes`);
      assert(q.cancel('band:1') && !q.cancel('band:9'), 'cancel');
      q.drain();
      console.log(`      queued sign twice and two bands, cancelled one: ran ${ran.join(', ')}`);
      assert(ran.join() === 'sign,band:2' && !q.pending, ran.join());
    },
  },
];
