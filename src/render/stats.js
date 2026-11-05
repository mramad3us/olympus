// OLYMPUS render: what the GPU is asked to do, counted. GL call counters, per-pass GPU timers, the test readback.
//
// TECH §16.5. Three tools, each cheap enough to leave on where it is asked for:
//   - instrumentGL(gl) wraps the calls that send data or programs to the GPU (texImage2D,
//     texSubImage2D, texImage3D, texSubImage3D, texStorage2D, texStorage3D, bufferData,
//     bufferSubData, compileShader, linkProgram) and counts calls and bytes per frame, the bytes worked
//     out from the dimensions and the format (tradecraft's lesson, PIPELINE 2026-10-29: "count what
//     goes to the GPU ... and treat any big upload or mid-game compile as a Windows hitch"). Storage
//     made with no data (texStorage, a texImage with null pixels, a bufferData of a size) counts as
//     allocation, not upload. Only with ?perf=1, in debug mode or in tests (main.js decides).
//   - createPassTimer(gl) puts one EXT_disjoint_timer_query_webgl2 query round each pass of a frame
//     (begin(name) ends the one running and starts the next: queries cannot nest), reads them back
//     when the GPU has them (a frame or three late, never waiting), and keeps `last`: the latest
//     complete frame's milliseconds by pass. Where the browser offers no timer (Chrome often does not)
//     `available` is false and `last` stays null; a disjoint frame (the GPU clock jumped) is dropped.
//   - readBack(gl, ...): the one readPixels in the game, refused unless the test flag is up
//     (globalThis.__olympusTestReadback): TECH §9.10, readback stalls the pipeline (D3D11 most of
//     all), so play never does it; a test page may, to compare the CPU's light with the GPU's.

const GL = { RGBA: 0x1908, RGB: 0x1907, RG: 0x8227, RED: 0x1903, ALPHA: 0x1906, LUMINANCE: 0x1909, LUMINANCE_ALPHA: 0x190a,
  RGBA_INTEGER: 0x8d99, RGB_INTEGER: 0x8d98, RG_INTEGER: 0x8228, RED_INTEGER: 0x8d94, DEPTH_COMPONENT: 0x1902, DEPTH_STENCIL: 0x84f9 };
const COMPONENTS = new Map([[GL.RGBA, 4], [GL.RGB, 3], [GL.RG, 2], [GL.RED, 1], [GL.ALPHA, 1], [GL.LUMINANCE, 1], [GL.LUMINANCE_ALPHA, 2],
  [GL.RGBA_INTEGER, 4], [GL.RGB_INTEGER, 3], [GL.RG_INTEGER, 2], [GL.RED_INTEGER, 1], [GL.DEPTH_COMPONENT, 1], [GL.DEPTH_STENCIL, 1]]);
// (bytes a component, by type; the packed types are a whole texel: 2 or 4 bytes)
const TYPE_BYTES = new Map([[0x1401, 1], [0x1400, 1], [0x1403, 2], [0x1402, 2], [0x1405, 4], [0x1404, 4], [0x1406, 4], [0x140b, 2], [0x8d61, 2]]);
const PACKED = new Map([[0x8033, 2], [0x8034, 2], [0x8363, 2], [0x84fa, 4], [0x8c3b, 4], [0x8c3e, 4], [0x8368, 4], [0x8dad, 8]]);
// (bytes a texel by sized internal format, for texStorage: the common ones; anything else counted at 4)
const SIZED = new Map([[0x8229, 1], [0x822b, 2], [0x8051, 3], [0x8058, 4], [0x8c41, 3], [0x8c43, 4], [0x822d, 2], [0x822f, 4], [0x881a, 8],
  [0x822e, 4], [0x8230, 8], [0x8814, 16], [0x8815, 12], [0x81a5, 2], [0x81a6, 4], [0x8cac, 4], [0x88f0, 4], [0x8cad, 8], [0x8232, 1], [0x8238, 2], [0x8d7c, 4]]);

const texelBytes = (format, type) => PACKED.get(type) ?? (COMPONENTS.get(format) ?? 4) * (TYPE_BYTES.get(type) ?? 1);
// (the size of an image source handed to texImage: ImageData, a canvas, an ImageBitmap, a video)
const sourceSize = (s) => (s && typeof s === 'object' ? [s.width ?? s.videoWidth ?? 0, s.height ?? s.videoHeight ?? 0] : [0, 0]);
const isData = (v) => v !== null && v !== undefined && typeof v === 'object';

const zero = () => ({ calls: 0, uploads: 0, bytes: 0, allocBytes: 0, compiles: 0, links: 0, byCall: {} });

/**
 * Count what gl is asked to send: { frame() (close the frame: its counts become `last`, the running
 * total goes on), last, total, max (the most bytes and uploads in any one frame), dispose() }.
 */
export function instrumentGL(gl) {
  const saved = [];
  let cur = zero(), last = zero();
  const total = zero(), max = { bytes: 0, uploads: 0, links: 0, compiles: 0, frame: 0 };
  let frames = 0;
  const note = (name, bytes = 0, upload = true) => {
    for (const c of [cur, total]) {
      c.calls++; c.byCall[name] = (c.byCall[name] ?? 0) + 1;
      if (upload) { c.uploads++; c.bytes += bytes; } else c.allocBytes += bytes;
    }
  };
  const wrap = (name, count) => {
    const fn = gl[name];
    if (typeof fn !== 'function') return;
    saved.push([name, fn]);
    gl[name] = function (...a) {
      try { count(a); } catch { /* (a count that can't read its arguments never breaks the call) */ }
      return fn.apply(this, a);
    };
  };
  wrap('texImage2D', (a) => {
    if (a.length >= 9) { const [, , , w, h, , format, type, px] = a; note('texImage2D', w * h * texelBytes(format, type), isData(px)); }
    else { const [w, h] = sourceSize(a[5]); note('texImage2D', w * h * texelBytes(a[3], a[4])); }
  });
  wrap('texSubImage2D', (a) => {
    if (a.length >= 9) { const [, , , , w, h, format, type] = a; note('texSubImage2D', w * h * texelBytes(format, type)); }
    else { const [w, h] = sourceSize(a[6]); note('texSubImage2D', w * h * texelBytes(a[4], a[5])); }
  });
  wrap('texImage3D', (a) => { const [, , , w, h, d, , format, type, px] = a; note('texImage3D', w * h * d * texelBytes(format, type), isData(px)); });
  wrap('texSubImage3D', (a) => { const [, , , , , w, h, d, format, type] = a; note('texSubImage3D', w * h * d * texelBytes(format, type)); });
  wrap('texStorage2D', (a) => { const [, levels, fmt, w, h] = a; note('texStorage2D', w * h * (SIZED.get(fmt) ?? 4) * (levels > 1 ? 4 / 3 : 1), false); });
  wrap('texStorage3D', (a) => { const [, levels, fmt, w, h, d] = a; note('texStorage3D', w * h * d * (SIZED.get(fmt) ?? 4) * (levels > 1 ? 4 / 3 : 1), false); });
  wrap('bufferData', (a) => { const v = a[1]; if (typeof v === 'number') note('bufferData', v, false); else note('bufferData', v?.byteLength ?? 0); });
  wrap('bufferSubData', (a) => { const v = a[2]; const len = a.length >= 5 && a[4] ? a[4] * (v?.BYTES_PER_ELEMENT ?? 1) : v?.byteLength ?? 0; note('bufferSubData', len); });
  wrap('compileShader', () => { cur.compiles++; total.compiles++; });
  wrap('linkProgram', () => { cur.links++; total.links++; });
  return {
    /** Close a frame: its counts are `last`, the next frame starts at zero. */
    frame() {
      last = cur; cur = zero(); frames++;
      if (last.bytes > max.bytes) { max.bytes = last.bytes; max.frame = frames; }
      max.uploads = Math.max(max.uploads, last.uploads); max.links = Math.max(max.links, last.links); max.compiles = Math.max(max.compiles, last.compiles);
      return last;
    },
    get last() { return last; }, get current() { return cur; }, total, max, get frames() { return frames; },
    /** Start the maxima again (a test measuring from a moment on). */
    resetMax() { Object.assign(max, { bytes: 0, uploads: 0, links: 0, compiles: 0, frame: 0 }); },
    dispose() { for (const [name, fn] of saved) gl[name] = fn; saved.length = 0; },
  };
}

/** The passes a frame has, in order: their names as `last` reports them. */
export const PASSES = Object.freeze(['shadow', 'scene', 'post', 'blit']);
const QUERIES_KEPT = 8;                                                // (frames of queries in flight at most: older ones are dropped unread)

/**
 * GPU time per pass: { available, begin(name), end() (closes the frame), poll(), last ({ shadowMs,
 * sceneMs, postMs, blitMs } of the latest complete frame, or null), shadowLastMs (the last frame that
 * drew the shadow map) }.
 */
export function createPassTimer(gl) {
  const ext = gl?.getExtension?.('EXT_disjoint_timer_query_webgl2') ?? null;
  const frames = [];
  let cur = null, open = null, last = null, shadowLastMs = null;
  function close() { if (open) { gl.endQuery(ext.TIME_ELAPSED_EXT); open = null; } }
  return {
    available: !!ext,
    /** Time what follows as pass `name` (the pass running, if any, ends here). */
    begin(name) {
      if (!ext) return;
      if (!cur) cur = { passes: [] };
      if (open?.name === name) return;
      close();
      const q = gl.createQuery();
      gl.beginQuery(ext.TIME_ELAPSED_EXT, q);
      open = { name, q };
      cur.passes.push(open);
    },
    /** The frame's last pass ends; its queries wait for the GPU. */
    end() {
      if (!ext || !cur) return;
      close();
      frames.push(cur); cur = null;
      while (frames.length > QUERIES_KEPT) for (const p of frames.shift().passes) gl.deleteQuery(p.q);
      this.poll();
    },
    /** Read the frames the GPU has finished (oldest first), never waiting. */
    poll() {
      if (!ext) return last;
      while (frames.length) {
        const f = frames[0], ps = f.passes;
        if (!ps.every(p => gl.getQueryParameter(p.q, gl.QUERY_RESULT_AVAILABLE))) break;
        frames.shift();
        const disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT);
        const out = { shadowMs: 0, sceneMs: 0, postMs: 0, blitMs: 0 };
        for (const p of ps) { const ms = gl.getQueryParameter(p.q, gl.QUERY_RESULT) / 1e6; gl.deleteQuery(p.q); out[`${p.name}Ms`] = (out[`${p.name}Ms`] ?? 0) + ms; }
        if (disjoint) continue;
        if (ps.some(p => p.name === 'shadow')) shadowLastMs = out.shadowMs;
        last = out;
      }
      return last;
    },
    get last() { return last; },
    get shadowLastMs() { return shadowLastMs; },
  };
}

/**
 * Pixels read back from the bound framebuffer: RGBA bytes, rows from the bottom. Tests only (the
 * flag globalThis.__olympusTestReadback); in play it throws, as TECH §9.10 rules.
 */
export function readBack(gl, x, y, w, h) {
  if (!globalThis.__olympusTestReadback) throw new Error('readBack is for test pages only (TECH §9.10: no readback in play)');
  const out = new Uint8Array(w * h * 4);
  gl.readPixels(x, y, w, h, gl.RGBA, gl.UNSIGNED_BYTE, out);
  return out;
}
