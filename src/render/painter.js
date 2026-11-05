// OLYMPUS render: the painter. Jobs for the paint worker, in priority order, or on the main thread when there is none.
//
// TECH §11.2. createPainter() starts the paint worker (src/art/worker.js, a module worker), two when
// navigator.hardwareConcurrency is 8 or more (my call there), and hands it jobs (src/art/jobs.js:
// 'sheet', a band of a person's frames; 'area', a places area laid out, painted, packed and made into
// vertex arrays) in priority order: the player's own sheet first, then the people in view, then the
// next area, then what is built ahead (PRIORITY). Each worker takes one job at a time, so a job
// queued behind an area waits at most for that area. run(job, args, { priority }) gives a promise of
// { meta, buffers, jobMs, waitMs }, the buffers transferred back, not copied: jobMs is the job's own
// time from its dispatch to its answer, waitMs its time in the queue before (a worker still loading
// its modules at boot is waited for there, so a cost read from jobMs is the job's, not the boot's).
//
// The worker is cosmetic and its outputs are pure (the same bytes either way), so nothing here touches
// determinism. If new Worker throws, or every worker reports an error (a module that did not load),
// the main thread runs the jobs instead, as generators within WORKER_FALLBACK_MS (4 ms) a frame:
// step() is called once a frame (view.js), and does nothing while workers are working. runNow() runs a
// job on the main thread at once, whatever the queue: the player's own figure is never put off (TECH
// §9.4: "composed on the main thread at once if the worker is busy").
//
// idle (nothing queued, nothing out) and pending (how many) feed the page's __ready: a shot never
// catches a half-painted frame. The density goes to the worker in its script's URL (?ppm=), so the art
// modules' defaults agree with the page's (src/render/scale.js reads location.search).
import { PX_PER_M } from './scale.js';
import { jobSteps, runJob, WORKER_FALLBACK_MS } from '../art/jobs.js';

/** Job priorities, most urgent first. */
export const PRIORITY = Object.freeze({ own: 0, visible: 1, area: 2, ahead: 3, sky: 4 });
/** Workers to start: 2 on a machine of 8 threads or more, else 1. */
export const workersFor = (threads = globalThis.navigator?.hardwareConcurrency ?? 4) => (threads >= 8 ? 2 : 1);

/**
 * A painter: { run(job, args, { priority }) → Promise<{ meta, buffers }>, runNow(job, args), step() (the
 * main thread's share of a frame), idle, pending, mode ('worker' | 'main' | 'starting'), stats, dispose() }.
 * opts: workers (how many; 0 runs everything on the main thread), url (the worker script), ppm, budgetMs, now.
 */
export function createPainter({ workers = workersFor(), url = new URL('../art/worker.js', import.meta.url), ppm = PX_PER_M, budgetMs = WORKER_FALLBACK_MS, now = () => performance.now() } = {}) {
  const queue = [], out = new Map(), pool = [];
  let seq = 0, mainJob = null, disposed = false;
  const stats = { workers: 0, jobs: 0, done: 0, failed: 0, mainJobs: 0, mainMs: 0, workerMs: 0, byJob: {}, errors: [] };
  const note = (job, ms, where) => {
    const b = stats.byJob[job] ??= { n: 0, ms: 0, maxMs: 0, main: 0 };
    b.n++; b.ms += ms; b.maxMs = Math.max(b.maxMs, ms); if (where === 'main') b.main++;
  };

  // ---- the workers ----
  function startWorker(i) {
    let w;
    try {
      const u = new URL(url);
      u.searchParams.set('ppm', String(ppm));
      w = new Worker(u, { type: 'module', name: `olympus-paint-${i + 1}` });
    } catch (e) { stats.errors.push(`new Worker: ${e?.message ?? e}`); return null; }
    const W = { w, ready: false, dead: false, busy: null };
    w.onmessage = (e) => {
      const { id, ok, meta, buffers, error } = e.data ?? {};
      if (id === 'ping') { W.ready = true; dispatch(); return; }
      const j = out.get(id);
      if (!j) return;
      out.delete(id); W.busy = null;
      const ms = now() - j.t0;
      if (ok) { stats.done++; stats.workerMs += ms; note(j.job, ms, 'worker'); j.resolve({ meta, buffers, jobMs: ms, waitMs: j.t0 - j.queuedMs }); }
      else { stats.failed++; stats.errors.push(`${j.job}: ${error}`); j.reject(new Error(`paint job '${j.job}' failed in the worker: ${error}`)); }
      dispatch();
    };
    // (a module that does not load, or an error thrown outside a job: this worker is done; its job goes back to the queue)
    w.onerror = (e) => {
      e.preventDefault?.();
      stats.errors.push(`worker error: ${e.message ?? 'unknown'}`);
      W.dead = true; W.ready = false;
      if (W.busy) { const j = out.get(W.busy); out.delete(W.busy); W.busy = null; if (j) enqueue(j); }
      try { w.terminate(); } catch { /* (gone already) */ }
      dispatch();
    };
    w.postMessage({ id: 'ping', job: 'ping' });
    return W;
  }
  for (let i = 0; i < workers; i++) { const W = startWorker(i); if (W) pool.push(W); }
  stats.workers = pool.length;
  const live = () => pool.filter(W => !W.dead);

  function enqueue(j) {
    // (by priority, then the order asked: a stable insert)
    let k = queue.length;
    while (k > 0 && (queue[k - 1].prio > j.prio)) k--;
    queue.splice(k, 0, j);
  }
  function dispatch() {
    if (disposed) return;
    for (const W of pool) {
      if (!queue.length) return;
      if (W.dead || !W.ready || W.busy) continue;
      const j = queue.shift();
      j.t0 = now();
      W.busy = j.id; out.set(j.id, j);
      W.w.postMessage({ id: j.id, job: j.job, args: j.args });
    }
  }

  // ---- the main thread's share (no worker) ----
  function step() {
    if (live().length || disposed) return 0;
    const t0 = now();
    while (now() - t0 < budgetMs) {
      if (!mainJob) {
        const j = queue.shift();
        if (!j) break;
        mainJob = { j, gen: jobSteps(j.job, j.args), ms: 0 };
      }
      const s0 = now();
      let r;
      try { r = mainJob.gen.next(); } catch (e) { const { j } = mainJob; mainJob = null; stats.failed++; stats.errors.push(`${j.job}: ${e.message}`); j.reject(e); continue; }
      mainJob.ms += now() - s0;
      if (r.done) {
        const { j, ms } = mainJob; mainJob = null;
        stats.done++; stats.mainJobs++; stats.mainMs += ms; note(j.job, ms, 'main');
        j.resolve({ ...r.value, jobMs: ms, waitMs: 0 });
      }
    }
    return now() - t0;
  }

  return {
    PRIORITY,
    /** Paint something: a promise of { meta, buffers }. priority: a PRIORITY name or number. */
    run(job, args, { priority = 'area' } = {}) {
      return new Promise((resolve, reject) => {
        const j = { id: ++seq, job, args, prio: typeof priority === 'number' ? priority : PRIORITY[priority] ?? PRIORITY.area, resolve, reject, t0: 0, queuedMs: now() };
        stats.jobs++;
        enqueue(j);
        dispatch();
      });
    },
    /** A job on the main thread now (the player's own figure when it cannot wait). */
    runNow(job, args) {
      const t0 = now(), r = runJob(job, args), ms = now() - t0;
      stats.jobs++; stats.done++; stats.mainJobs++; stats.mainMs += ms; note(job, ms, 'main');
      return r;
    },
    step,
    get idle() { return !queue.length && !out.size && !mainJob; },
    get pending() { return queue.length + out.size + (mainJob ? 1 : 0); },
    /** 'worker' (a worker answers), 'starting' (workers started, none answered yet), 'main' (none: the main thread paints). */
    get mode() { const L = live(); return !L.length ? 'main' : L.some(W => W.ready) ? 'worker' : 'starting'; },
    stats,
    dispose() {
      disposed = true;
      for (const W of pool) try { W.w.terminate(); } catch { /* (gone already) */ }
      for (const j of [...queue, ...out.values()]) j.reject(new Error('the painter was disposed'));
      queue.length = 0; out.clear(); mainJob = null;
    },
  };
}
