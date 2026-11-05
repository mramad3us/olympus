// OLYMPUS art: the paint worker's entry. A module worker that runs src/art/jobs.js and sends the pixels back.
//
// TECH §11.2: one module worker (two on a machine of eight threads or more: src/render/painter.js
// decides), started at boot so its modules are loaded before the first area is wanted. The protocol is
// a message { id, job, args } answered by { id, ok, meta, buffers } (or { id, ok: false, error }), the
// buffers sent in the transfer list, so a 4 MB area page crosses without a copy. No SharedArrayBuffer
// (§11.3). The worker is cosmetic: it makes pixels and geometry for the stage only, the sim never
// waits on it, and its outputs are the same bytes the main thread's run of the same job gives.
//
// The density the art modules default to comes from this script's own URL (?ppm=, src/render/scale.js
// reads location.search, which in a worker is the script's): painter.js starts it with the page's.
// The jobs are given their ppm explicitly all the same. A first message { job: 'ping' } answers at once,
// so the page knows the worker's modules loaded.
import { runJob } from './jobs.js';

globalThis.onmessage = (e) => {
  const { id, job, args } = e.data ?? {};
  if (job === 'ping') { globalThis.postMessage({ id, ok: true, meta: { pong: true }, buffers: [] }); return; }
  try {
    const { meta, buffers } = runJob(job, args);
    globalThis.postMessage({ id, ok: true, meta, buffers }, buffers);
  } catch (err) {
    globalThis.postMessage({ id, ok: false, error: `${err?.message ?? err}`, stack: String(err?.stack ?? '').split('\n').slice(0, 4).join('\n') });
  }
};
