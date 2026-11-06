// OLYMPUS render: a ground's chunks, streamed round the camera, so none is ever first drawn in the picture.
//
// TECH §9.3 (and tradecraft's town.js, a reference: its generator in budget). A ground (an area of kind
// 'ground': Base Melas's 1,080 × 780 m) is drawn in CHUNK_M (32 m) squares (src/art/terrain/base.js),
// each built by the paint worker's 'chunk' job (src/art/jobs.js: laid, painted, packed into its page and
// made into vertex arrays off the main thread) from the few records that reach into it (pieceOf, a few
// kilobytes sent), made into meshes here (batch.js areaFromJob) and sent up through the frame's upload
// queue (src/render/uploads.js: its page and its geometry within UPLOAD_BYTES_FRAME), then added to the
// scene. Every chunk within REACH_M (56 m, twice the view's half-diagonal) of the camera is built,
// nearest and ahead of the walk first; a chunk beyond DROP_M (96 m) is freed. So a chunk is built at
// least 28 m before it can be in the picture (at a run's 2.69 m/s, ten seconds of warning), and the
// main thread's share of it (meshes, uploads) is held to CHUNK_FRAME_MS (3 ms) a frame. Behind an area's
// cut, ensure(x, z) builds the ring round the arrival whole (TECH §9.7: whole uploads are allowed there).
// stats: { built (in the scene), building (asked, not yet up), dropped, popped (chunks first drawn while
// in the frame: the test holds it at 0), mainMs (this frame), maxMainMs, bytes (this frame) }.
import { areaFromJob, reserveParts } from './batch.js';
import { indexGround, pieceOf, chunkAt, chunkRect, CHUNK_M } from '../art/terrain/base.js';
import { runJob } from '../art/jobs.js';

export { CHUNK_M };
/** Chunks are built within this of the camera, and dropped beyond that (metres; TECH §9.3). */
export const REACH_M = 56, DROP_M = 96;
/** The main thread's work on chunks a frame, at most (ms; TECH §9.3). */
export const CHUNK_FRAME_MS = 3;
/** Chunk jobs asked of the worker at once (so a turn of the walk reorders what is still to come). */
export const CHUNKS_IN_FLIGHT = 4;
/** Parts a chunk job numbers for itself (its fixtures, its boulders: a few hundred at most). */
export const PARTS_PER_CHUNK = 1024;
const now = () => performance.now();
const keyOf = (cx, cz) => `${cx},${cz}`;
// (the distance from a point to a chunk's square)
const distTo = (x, z, r) => Math.hypot(Math.max(r.x0 - x, 0, x - r.x1), Math.max(r.z0 - z, 0, z - r.z1));

/**
 * The chunks of the live ground: { group, setGround(ground), frame(view) → stats, ensure(x, z) → Promise,
 * clear(), idle, pending, stats, dispose() }. opts: renderer, painter (none: the jobs run here, whole),
 * uploads (none: sent at once), ppm. view: { x, z (the camera), dx, dz (the walk's heading), frame: { x0,
 * z0, x1, z1 } (the ground the picture covers, its tall things' feet included) }.
 */
export function createChunks({ THREE, renderer, painter = null, uploads = null, ppm }) {
  const group = new THREE.Group();
  group.name = 'chunks';
  let ground = null, index = null, massBase = 0, fencePart = 0;
  const chunks = new Map();                                          // key → { cx, cz, rect, state: 'asked' | 'made' | 'queued' | 'shown', built, result }
  const stats = { built: 0, building: 0, dropped: 0, popped: 0, mainMs: 0, maxMainMs: 0, bytes: 0, jobs: 0, firstShown: [] };
  let lastFrame = null;

  function clear() {
    for (const c of chunks.values()) drop(c);
    chunks.clear();
    stats.built = 0; stats.building = 0;
  }
  function setGround(g) {
    if (ground === g) return;
    clear();
    ground = g;
    index = g ? indexGround(g) : null;
    massBase = g ? reserveParts((g.massing?.length ?? 0) + 2) : 0;
    fencePart = massBase + (g?.massing?.length ?? 0);
  }
  function drop(c) {
    if (c.built) { c.built.dispose(); c.built = null; }
    if (uploads && c.state === 'queued') uploads.cancel(`chunk:${c.key}`);
    c.state = 'gone';
  }
  const argsOf = (cx, cz) => ({ piece: pieceOf(ground, index, cx, cz), ppm, partBase: reserveParts(PARTS_PER_CHUNK), massBase, fencePart });
  function ask(cx, cz, priority = 'ahead') {
    const key = keyOf(cx, cz);
    if (chunks.has(key)) return chunks.get(key);
    const c = { key, cx, cz, rect: chunkRect(cx, cz), state: 'asked', built: null, result: null, g: ground };
    chunks.set(key, c);
    stats.jobs++;
    const args = argsOf(cx, cz);
    c.promise = (painter ? painter.run('chunk', args, { priority }) : Promise.resolve(runJob('chunk', args))).then((r) => {
      if (c.state !== 'asked' || c.g !== ground) return;
      c.result = r; c.state = 'got';
    }, (e) => { console.warn(`chunks: chunk ${key} did not build`, e); chunks.delete(key); });
    return c;
  }
  // (a chunk's meshes made from its job, and its page and geometry sent: whole, or through the frame's queue)
  function make(c) {
    c.built = areaFromJob(c.result, { name: `chunk:${c.key}` });
    c.bytes = c.built.atlas.bytes + (c.result.meta.stats.vertices ?? 0) * 17 * 4;
    c.result = null; c.state = 'made';
  }
  function show(c) {
    c.built.upload(renderer);
    c.built.atlas.release();
    group.add(c.built.group);
    c.state = 'shown'; stats.built++;
    // (a chunk first drawn inside the frame popped into view: the test holds this at none)
    const f = lastFrame?.frame;
    if (f && c.rect.x0 < f.x1 && c.rect.x1 > f.x0 && c.rect.z0 < f.z1 && c.rect.z1 > f.z0) { stats.popped++; stats.firstShown.push(c.key); }
  }

  /** The chunks within REACH_M of (x, z): [cx, cz, distance], nearest first, those ahead of the walk before those behind. */
  function wanted(x, z, dx = 0, dz = 0) {
    const out = [], [ax, az] = chunkAt(x - REACH_M, z - REACH_M), [bx, bz] = chunkAt(x + REACH_M, z + REACH_M);
    for (let cz = Math.max(index.cz0, az); cz <= Math.min(index.cz1, bz); cz++) for (let cx = Math.max(index.cx0, ax); cx <= Math.min(index.cx1, bx); cx++) {
      const r = chunkRect(cx, cz), d = distTo(x, z, r);
      if (d > REACH_M) continue;
      const ahead = (r.x0 + CHUNK_M / 2 - x) * dx + (r.z0 + CHUNK_M / 2 - z) * dz;
      out.push([cx, cz, d - (ahead > 0 ? 8 : 0)]);
    }
    return out.sort((p, q) => p[2] - q[2]);
  }

  /** A frame: ask for what is wanted, make and send what came back within the budget, drop what is far. */
  function frame(view) {
    lastFrame = view;
    const t0 = now();
    stats.bytes = 0;
    if (!ground) return stats;
    const want = wanted(view.x, view.z, view.dx ?? 0, view.dz ?? 0);
    let flying = 0;
    for (const c of chunks.values()) if (c.state === 'asked') flying++;
    for (const [cx, cz] of want) { if (flying >= CHUNKS_IN_FLIGHT) break; if (!chunks.has(keyOf(cx, cz))) { ask(cx, cz); flying++; } }
    // (what came back: meshes made and sent, within the frame's budget; one at least, so none waits for ever)
    let first = true;
    for (const [cx, cz] of want) {
      const c = chunks.get(keyOf(cx, cz));
      if (!c || (c.state !== 'got' && c.state !== 'made')) continue;
      if (!first && now() - t0 >= CHUNK_FRAME_MS) break;
      first = false;
      if (c.state === 'got') make(c);
      if (uploads) {
        c.state = 'queued';
        uploads.queue({ key: `chunk:${c.key}`, bytes: c.bytes, run: () => { if (c.state === 'queued') { show(c); stats.bytes += c.bytes; } } });
      } else show(c);
    }
    // (far ones freed)
    for (const [k, c] of chunks) if (distTo(view.x, view.z, c.rect) > DROP_M) { if (c.state === 'shown') stats.built--; drop(c); chunks.delete(k); stats.dropped++; }
    let building = 0;
    for (const c of chunks.values()) if (c.state !== 'shown') building++;
    stats.building = building;
    stats.mainMs = now() - t0; stats.maxMainMs = Math.max(stats.maxMainMs, stats.mainMs);
    return stats;
  }

  /** Every chunk within REACH_M of (x, z) built and in the scene: whole, behind a cut. Resolves with the count. */
  async function ensure(x, z) {
    if (!ground) return 0;
    const want = wanted(x, z);
    const list = want.map(([cx, cz]) => ask(cx, cz, 'area'));
    await Promise.all(list.map(c => c.promise));
    for (const c of list) {
      if (c.state === 'got') make(c);
      if (c.state === 'queued') uploads?.cancel(`chunk:${c.key}`);
      if (c.state === 'made' || c.state === 'queued') { const f = lastFrame; lastFrame = null; show(c); lastFrame = f; }
    }
    return list.length;
  }

  return {
    group, setGround, frame, ensure, clear, stats,
    get ground() { return ground; },
    get idle() { for (const c of chunks.values()) if (c.state !== 'shown') return false; return true; },
    /** Chunks the picture is waiting on: those in the frame (plus a margin) not yet shown. */
    pendingIn(f, marginM = 4) {
      let n = 0;
      if (!ground || !f) return 0;
      const [ax, az] = chunkAt(f.x0 - marginM, f.z0 - marginM), [bx, bz] = chunkAt(f.x1 + marginM, f.z1 + marginM);
      for (let cz = Math.max(index.cz0, az); cz <= Math.min(index.cz1, bz); cz++) for (let cx = Math.max(index.cx0, ax); cx <= Math.min(index.cx1, bx); cx++) if (chunks.get(keyOf(cx, cz))?.state !== 'shown') n++;
      return n;
    },
    dispose() { clear(); group.removeFromParent(); },
  };
}
