// OLYMPUS tests: driving the game's page for the stage's browser tests (view-browser, view-areas, render-fog, render-bench).
//
// Helpers, not a test file: the frame clock of the headless browser, sampling every frame's numbers
// in the page, a burst of frames driven back to back and finished on the GPU, and a walker that steers
// the player by physical keys (KeyboardEvent.code, as the game reads them: KeyW, KeyA, KeyS, KeyD, the
// AZERTY player's Z Q S D) toward a point, pressing R (KeyR, what's at hand) when a closed door stops
// it, and crosses a portal by its band (places' area records: the band, the side that is out). The
// walker's memory is the page's state; nothing here writes it but the keys.
import { fmt } from './helpers.mjs';

export const pct = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : NaN; };

/** The browser's own frame clock: rAF intervals on a page that draws a 2D canvas every frame (median, p95, ms). */
export async function frameClock(page) {
  return page.evaluate(() => new Promise(res => {
    const c = Object.assign(document.createElement('canvas'), { width: 640, height: 360 }), g = c.getContext('2d');
    document.body.append(c);
    const ts = [];
    const f = (t) => {
      g.fillStyle = `hsl(${ts.length * 7 % 360} 40% 40%)`; g.fillRect(0, 0, 640, 360);
      ts.push(t);
      if (ts.length < 61) requestAnimationFrame(f); else { c.remove(); const d = ts.slice(1).map((t1, k) => t1 - ts[k]).sort((a, b) => a - b); res({ medianMs: d[d.length >> 1], p95Ms: d[Math.floor(d.length * 0.95)] }); }
    };
    requestAnimationFrame(f);
  }));
}

/** In the page: start sampling every frame (rAF); window.__sampling.stop() gives the samples. */
export function startSampling(page) {
  return page.evaluate(() => {
    const out = [];
    let last = null, on = true;
    const f = (t) => {
      if (!on) return;
      const r = window.__report, v = r.view, gl = r.gl?.last;
      if (last !== null) out.push({ dt: t - last, calls: v.calls, tris: v.triangles, viewMs: v.viewMs, cpuMs: v.cpuMs, workMs: (r.frame?.tickMs ?? 0) + (r.frame?.viewMs ?? 0), bytes: gl?.bytes ?? 0, links: gl?.links ?? 0,
        drawn: v.people?.drawn ?? 0, lying: v.people?.lying ?? 0, area: v.area?.id ?? null, chunks: v.chunks ? { ...v.chunks } : null, see: v.see ? { ...v.see } : null, light: v.light ? { ...v.light } : null, lamps: v.lamps ? { ...v.lamps } : null,
        uploads: v.uploads ? { ...v.uploads } : null, fog: v.fog ? { recomputes: v.fog.recomputes, ms: v.fog.ms } : null, held: !!v.holding, ticks: r.frame?.ticks ?? 0, tickMs: r.frame?.tickMs ?? 0 });
      last = t;
      requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
    window.__sampling = { stop: () => { on = false; return out; } };
  });
}
export const stopSampling = (page) => page.evaluate(() => window.__sampling.stop());

/** 40 frames driven back to back in the page, each finished on the GPU (gl.finish): { medianMs, p95Ms, viewMs }. */
export async function burst(page, n = 40) {
  return page.evaluate((N) => {
    const L = window.__olympus.loop, gl = document.querySelector('#frame canvas').getContext('webgl2'), out = [], views = [];
    let t = performance.now();
    for (let k = 0; k < N; k++) { const a = performance.now(); t += 1000 / 60; L.frame(t); gl.finish(); out.push(performance.now() - a); views.push(window.__report.view.viewMs); }
    const mid = (xs) => [...xs].sort((x, y) => x - y)[xs.length >> 1];
    out.sort((x, y) => x - y);
    return { medianMs: out[out.length >> 1], p95Ms: out[Math.floor(out.length * 0.95)], viewMs: mid(views) };
  }, n);
}

/** The player now: { x, z, face, area, gait }. */
export const me = (page) => page.evaluate(() => { const s = window.__olympus.state, a = s.actors.list.find(x => x.id === s.player.actor); return { x: a.x, z: a.z, face: a.face, gait: a.gait, area: s.places.live.area }; });

const KEYS = { e: 'KeyD', w: 'KeyA', s: 'KeyS', n: 'KeyW' };
async function hold(page, keys, ms) { for (const k of keys) await page.keyboard.down(k); await page.waitForTimeout(ms); for (const k of keys) await page.keyboard.up(k); }

/**
 * Walk the player to (x, z) by keys, one axis at a time (x first unless zFirst), pressing R when a
 * door's offer stands in the way. Returns { ok, at, ms, doors }. run: Shift held.
 */
export async function walkTo(page, x, z, { tolM = 0.2, maxMs = 30000, run = false, zFirst = false, log = null } = {}) {
  const t0 = Date.now();
  let doors = 0, stuck = 0, last = await me(page);
  const area0 = last.area;
  for (const axis of zFirst ? ['z', 'x'] : ['x', 'z']) {
    for (;;) {
      const p = await me(page);
      if (p.area !== area0) return { ok: true, at: p, ms: Date.now() - t0, doors, changed: true };
      const d = axis === 'x' ? x - p.x : z - p.z;
      if (Math.abs(d) <= tolM) break;
      if (Date.now() - t0 > maxMs) return { ok: false, at: p, ms: Date.now() - t0, doors };
      const key = axis === 'x' ? (d > 0 ? KEYS.e : KEYS.w) : (d > 0 ? KEYS.s : KEYS.n);
      const step = Math.min(400, Math.max(60, Math.abs(d) / (run ? 2.69 : 1.14) * 1000 * 0.8));
      await hold(page, run && Math.abs(d) > 2 ? ['ShiftLeft', key] : [key], step);
      const q = await me(page);
      if (Math.hypot(q.x - last.x, q.z - last.z) < 0.02) {
        // (stopped: a door in reach is opened by R, what's at hand; else a nudge across)
        const offer = await page.evaluate(() => window.__olympus.offer?.() ?? null);
        if (offer?.verb === 'open') { await page.keyboard.press('KeyR'); doors++; log?.(`R: ${offer.label} (${offer.target})`); await page.waitForTimeout(1400); stuck = 0; }
        else if (++stuck > 6) return { ok: false, at: q, ms: Date.now() - t0, doors, offer };
      } else stuck = 0;
      last = q;
    }
  }
  return { ok: true, at: await me(page), ms: Date.now() - t0, doors };
}

/** Cross a portal (an area record's: its band and its out side) by keys: to its middle inside, then out past it. Resolves once the area has changed. */
export async function crossPortal(page, portal, opts = {}) {
  const b = portal.band, mid = (b.a + b.b) / 2, out = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] }[b.out];
  const inside = b.axis === 'x' ? [mid, b.at - out[1] * 0.9] : [b.at - out[0] * 0.9, mid];
  const past = b.axis === 'x' ? [mid, b.at + out[1] * 1.0] : [b.at + out[0] * 1.0, mid];
  const from = (await me(page)).area;
  const r1 = await walkTo(page, inside[0], inside[1], { ...opts, zFirst: b.axis === 'z' });
  if (r1.changed) return { ...r1, from };
  const r2 = await walkTo(page, past[0], past[1], { ...opts, zFirst: b.axis === 'x', tolM: 0.1 });
  for (let k = 0; k < 40 && (await me(page)).area === from; k++) await page.waitForTimeout(50);
  const at = await me(page);
  return { ok: at.area !== from, from, at, doors: (r1.doors ?? 0) + (r2.doors ?? 0) };
}

/** A line about a run of frames: median, p95, p99 and the slow ones, ms. */
export function framesLine(dts) {
  return `median ${fmt(pct(dts, 0.5), 1)} ms, p95 ${fmt(pct(dts, 0.95), 1)} ms, p99 ${fmt(pct(dts, 0.99), 1)} ms, ${dts.filter(d => d > 25).length} over 25 ms of ${dts.length}`;
}
