// OLYMPUS render: the upload queue. One budget a frame for everything sent to the GPU while the world is on screen.
//
// TECH §9.7: every texture is allocated once at its final size behind a cut (an area's pages, the
// people's atlas), and whatever fills it in mid-play (a person's band of frames, a repainted sign, a
// chunk's geometry) goes through this one queue, drained once a frame (view.js, after the sprite
// tints and before stage.render()) within UPLOAD_BYTES_FRAME (1 MB) and UPLOAD_FRAME_MS (2 ms). The
// rule comes from tradecraft on Windows (2026-10-29, the user: "each time I turn it staggers almost a
// second", one big texture re-sent), and VIEWS §14's "no upload over 1 MB in a frame".
//
// A job is { key, bytes, run, own }: run() does the sending (a copyTextureToTexture into its
// rectangle, a bufferSubData), bytes what it sends. The drain takes the player's own jobs first (own:
// the player's figure is never put off), then the rest in the order queued. It stops before a job that
// would carry the frame past the byte budget, and after any job once the frame's milliseconds are
// spent; but the first job of a frame always runs, so a job bigger than the budget (a 1.5 MB band)
// goes alone in a frame of its own rather than never. An own job runs whatever the budget (my call:
// the player's figure is a quarter to half a megabyte, and it is the one thing never deferred). A key
// queued again replaces the job still waiting under it, so a sign repainted twice is sent once.
//
// The clock is injected (now(), performance.now() by default), so the test drives a fake one. No
// three.js here: what a job sends is its own business.

/** Bytes the queue sends in a frame at most (a job alone in its frame may be bigger). */
export const UPLOAD_BYTES_FRAME = 1_048_576;
/** Milliseconds of sending a frame at most (checked after each job). */
export const UPLOAD_FRAME_MS = 2;

/**
 * A queue: { queue(job), drain() → { n, bytes, ms }, pending (jobs waiting), bytesWaiting, has(key),
 * cancel(key), stats }. opts: bytesPerFrame, msPerFrame, now.
 */
export function createUploads({ bytesPerFrame = UPLOAD_BYTES_FRAME, msPerFrame = UPLOAD_FRAME_MS, now = () => globalThis.performance?.now?.() ?? 0 } = {}) {
  const own = [], rest = [], byKey = new Map();
  const stats = { n: 0, bytes: 0, ms: 0, frames: 0, maxBytes: 0, maxMs: 0, maxN: 0, alone: 0, last: { n: 0, bytes: 0, ms: 0 } };

  function remove(job) {
    const list = job.own ? own : rest, i = list.indexOf(job);
    if (i >= 0) list.splice(i, 1);
    byKey.delete(job.key);
  }

  return {
    /** Queue a job: { key, bytes, run, own = false }. A job waiting under the same key is replaced. */
    queue({ key, bytes = 0, run, own: isOwn = false }) {
      if (typeof run !== 'function') throw new Error(`uploads: job '${key}' has nothing to run`);
      const old = byKey.get(key);
      if (old) remove(old);
      const job = { key, bytes: Math.max(0, bytes), run, own: !!isOwn };
      (job.own ? own : rest).push(job);
      byKey.set(key, job);
      return job;
    },
    /** Send what the frame's budget allows. Returns { n, bytes, ms } for this frame. */
    drain() {
      const t0 = now();
      let n = 0, bytes = 0, alone = false;
      for (const list of [own, rest]) {
        while (list.length) {
          const job = list[0];
          if (!job.own && n > 0 && (bytes + job.bytes > bytesPerFrame || now() - t0 >= msPerFrame)) break;
          list.shift(); byKey.delete(job.key);
          job.run();
          n++; bytes += job.bytes;
          if (!job.own && job.bytes > bytesPerFrame) { alone = true; break; }   // (over the budget: alone in its frame)
        }
        if (alone || (list === rest && list.length)) break;
      }
      const ms = now() - t0;
      stats.frames++; stats.n += n; stats.bytes += bytes; stats.ms += ms;
      if (alone) stats.alone++;
      stats.maxBytes = Math.max(stats.maxBytes, bytes); stats.maxMs = Math.max(stats.maxMs, ms); stats.maxN = Math.max(stats.maxN, n);
      stats.last = { n, bytes, ms };
      return stats.last;
    },
    /** Whether a job is waiting under a key. */
    has: (key) => byKey.has(key),
    /** Drop a waiting job (its texture went away first). */
    cancel(key) { const j = byKey.get(key); if (j) remove(j); return !!j; },
    get pending() { return own.length + rest.length; },
    get bytesWaiting() { let b = 0; for (const j of own) b += j.bytes; for (const j of rest) b += j.bytes; return b; },
    stats,
  };
}
