// OLYMPUS cards: the bench card, a fixed scene run for a fixed time in the user's own browser, and its result to copy.
//
// ROADMAP §4.6 brought the bench forward to 0.0.4's row (v0.0.3) because headless Chrome on the Mac
// hides what ANGLE over D3D11 does on Windows (tradecraft, 2026-10-29: "each time I turn it staggers
// almost a second"), and TECH §13.4 asks for a card the user runs and pastes back, as the gallery's
// "Copy my picks". ?bench=squadbay-night (or ?bench=1) starts BENCH_SCENES' scene (src/data/bench.js:
// the barracks at 23:00, seed 48213, the player in bay-2-1's aisle facing east), with no saves, lets
// it settle warmS seconds, then holds its keys for their times (D east 4 s, Q west 8 s, D east 4 s,
// then 4 s still: the same keys the stage's render-bench test drives), pressing them on the input's
// own key machine (input.keys), so no focus or real key is needed. Every frame of the 20 s is
// sampled after the game's own frame (a requestAnimationFrame queued after the loop's): its interval,
// the view's draw calls, triangles, programs and CPU, the GL counters' bytes sent that frame
// (render/stats.js instrumentGL), the ticks it ran and their time.
//
// The result (window.__bench, and the card): frame median, p95, p99 and max, frames over 25 ms
// (BENCH_SLOW_MS: CONTRACTS §7's p99 walking budget), draw calls and triangles at most, programs,
// uploads (the most bytes a frame), view CPU median and p95, the sim's mean ms a tick, the metres walked
// (so a run whose keys did nothing shows it), the renderer string (WEBGL_debug_renderer_info), the
// device pixel ratio, the window and the picture, hardwareConcurrency, the density and the version.
// benchText() is what Copy results puts on the clipboard: six plain lines to paste into the chat.
// A scene with a splash in it (src/data/bench.js's splash-sleep: R at your rack, the night's full
// splash, the build sheet 0.0.4 §2.3) also gives result.splash = { frames, medianMs, p95Ms, over25 },
// the frames drawn while the splash showed (each sample's splash: the phase, or null), and a seventh line.
import { BENCH_SLOW_MS } from '../../data/bench.js';

const pct = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : NaN; };
const r2 = (v) => (Number.isFinite(v) ? Math.round(v * 100) / 100 : null);

/**
 * Run a scene: { name, scene (BENCH_SCENES'), keys (input.keys: down(code, tMs), up(code, tMs)),
 * sample() (the frame's numbers: { calls, triangles, programs, viewMs, ticks, tickMs, bytes }),
 * where() (the player's { x, z }), onLeft(s) (the seconds left, once a second) }. Resolves with the frames.
 */
export function runBench({ scene, keys, sample, where = () => null, onLeft = () => {}, now = () => performance.now(), raf = (f) => requestAnimationFrame(f) }) {
  return new Promise((resolve) => {
    const legs = [], frames = [];
    let t = scene.warmS * 1000;
    for (const [code, ms] of scene.keys) { legs.push({ code, from: t, to: t + ms, down: false, up: false }); t += ms; }
    const endMs = t, t0 = now();
    let last = null, walked = 0, prevAt = null, leftS = null;
    // (the frame time is the gap between the timestamps rAF passes in, the frame clock's own, as
    // tests/stage-drive.mjs reads it: now() taken in a callback queued after the game's frame measured the
    // game's main-thread work as jitter, the review of v0.0.4: p95 18.8 ms on a Mac that dropped no frame)
    const f = (ts) => {
      const at = Number.isFinite(ts) ? ts : now();
      const el = now() - t0;
      for (const l of legs) {
        if (l.code && !l.down && el >= l.from) { keys.down(l.code, now()); l.down = true; }
        if (l.code && l.down && !l.up && el >= l.to) { keys.up(l.code, now()); l.up = true; }
      }
      if (el >= scene.warmS * 1000) {
        const s = sample(), here = where();
        if (last !== null) frames.push({ dt: at - last, ...s });
        if (here && prevAt) walked += Math.hypot(here.x - prevAt.x, here.z - prevAt.z);
        prevAt = here;
        last = at;
      }
      const left = Math.max(0, Math.ceil((endMs - el) / 1000));
      if (left !== leftS) { leftS = left; onLeft(left); }
      if (el < endMs) raf(f);
      else { for (const l of legs) if (l.code && l.down && !l.up) keys.up(l.code, now()); resolve({ frames, walkedM: walked }); }
    };
    raf(f);
  });
}

/** The result of a run: the numbers the card shows and window.__bench holds. env: { name, version, ppm, renderer, dpr, window, picture, threads }. */
export function benchResult({ frames, walkedM }, env) {
  const dts = frames.map(f => f.dt), views = frames.map(f => f.viewMs ?? 0);
  const ticks = frames.reduce((a, f) => a + (f.ticks ?? 0), 0), tickMs = frames.reduce((a, f) => a + (f.tickMs ?? 0), 0);
  const max = (k) => frames.reduce((m, f) => Math.max(m, f[k] ?? 0), 0);
  return {
    scene: env.name, version: env.version, ppm: env.ppm, seconds: r2(dts.reduce((a, b) => a + b, 0) / 1000), frames: frames.length,
    medianMs: r2(pct(dts, 0.5)), p95Ms: r2(pct(dts, 0.95)), p99Ms: r2(pct(dts, 0.99)), maxMs: r2(Math.max(0, ...dts)), over25: dts.filter(d => d > BENCH_SLOW_MS).length,
    drawCallsMax: max('calls'), trianglesMax: max('triangles'), programs: max('programs'), uploadsMaxBytes: max('bytes'),
    viewMedianMs: r2(pct(views, 0.5)), viewP95Ms: r2(pct(views, 0.95)), ticks, simMsPerTick: ticks ? Math.round((tickMs / ticks) * 1000) / 1000 : 0, walkedM: r2(walkedM),
    renderer: env.renderer ?? '?', dpr: env.dpr, window: env.window, picture: env.picture, threads: env.threads ?? null,
    splash: splashOf(frames),
  };
}

/** The frames drawn while a splash showed: { frames, medianMs, p95Ms, over25 }, or null with none. */
export function splashOf(frames) {
  const dts = frames.filter(f => f.splash).map(f => f.dt);
  if (!dts.length) return null;
  return { frames: dts.length, medianMs: r2(pct(dts, 0.5)), p95Ms: r2(pct(dts, 0.95)), over25: dts.filter(d => d > BENCH_SLOW_MS).length };
}

const kb = (bytes) => (bytes >= 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${bytes} B`);

/** What Copy results gives: plain lines to paste into the conversation. */
export function benchText(r) {
  return [
    `OLYMPUS v${r.version} bench: ${r.scene}, ${r.seconds} s, ${r.ppm} px/m`,
    `frames ${r.frames}: median ${r.medianMs} ms, p95 ${r.p95Ms} ms, p99 ${r.p99Ms} ms, max ${r.maxMs} ms; ${r.over25} over ${BENCH_SLOW_MS} ms`,
    `draw calls ${r.drawCallsMax} max, triangles ${r.trianglesMax.toLocaleString('en-GB')} max, programs ${r.programs}, uploads ${kb(r.uploadsMaxBytes)} a frame at most`,
    `view CPU ${r.viewMedianMs} ms median, ${r.viewP95Ms} ms p95; sim ${r.simMsPerTick} ms a tick over ${r.ticks} ticks; walked ${r.walkedM} m`,
    `renderer ${r.renderer}`,
    `window ${r.window?.[0]} x ${r.window?.[1]} CSS px at DPR ${r.dpr}, picture ${r.picture?.[0]} x ${r.picture?.[1]}; ${r.threads ?? '?'} threads`,
    ...(r.splash ? [`splash frames ${r.splash.frames}: median ${r.splash.medianMs} ms, p95 ${r.splash.p95Ms} ms; ${r.splash.over25} over ${BENCH_SLOW_MS} ms`] : []),
  ].join('\n');
}

/** The card's body: the result's table and Copy results (onCopy(text) → Promise<boolean>). */
export function benchCard(r, { onCopy, onAgain = null } = {}) {
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(document.createElement(tag), props); n.append(...kids.filter(k => k !== null && k !== undefined)); return n; };
  const rows = [
    ['scene', `${r.scene} · ${r.seconds} s · ${r.ppm} px/m · v${r.version}`],
    ['frames', `${r.frames}: median ${r.medianMs} ms · p95 ${r.p95Ms} · p99 ${r.p99Ms} · max ${r.maxMs}`],
    [`over ${BENCH_SLOW_MS} ms`, String(r.over25)],
    ['draw calls', `${r.drawCallsMax} max · triangles ${r.trianglesMax.toLocaleString('en-GB')} max · programs ${r.programs}`],
    ['uploads', `${kb(r.uploadsMaxBytes)} a frame at most`],
    ['view CPU', `${r.viewMedianMs} ms median · ${r.viewP95Ms} ms p95`],
    ['sim', `${r.simMsPerTick} ms a tick, mean of ${r.ticks}`],
    ['walked', `${r.walkedM} m`],
    ['renderer', r.renderer],
    ['screen', `${r.window?.[0]} × ${r.window?.[1]} CSS px · DPR ${r.dpr} · picture ${r.picture?.[0]} × ${r.picture?.[1]} · ${r.threads ?? '?'} threads`],
    ...(r.splash ? [['splash', `${r.splash.frames} frames: median ${r.splash.medianMs} ms · p95 ${r.splash.p95Ms} · ${r.splash.over25} over ${BENCH_SLOW_MS} ms`]] : []),
  ];
  const said = el('span', { className: 'copied', textContent: '' });
  const copy = el('button', { className: 'item lead copy', type: 'button', textContent: 'Copy results' });
  copy.onclick = async () => { const ok = await onCopy?.(benchText(r)); said.textContent = ok ? 'Copied: paste it into the conversation.' : 'Copy failed: select the text below.'; };
  return el('div', { className: 'glass bench' },
    el('h3', { textContent: 'Bench' }),
    el('div', { className: 'keylist benchlist' }, ...rows.flatMap(([k, v]) => [el('span', { className: 'k', textContent: k }), el('span', { className: 'v', textContent: v })])),
    el('div', { className: 'glass-list' }, copy, onAgain ? el('button', { className: 'item', type: 'button', textContent: 'Run it again', onclick: onAgain }) : null),
    said,
    el('textarea', { className: 'benchtext', readOnly: true, rows: r.splash ? 7 : 6, value: benchText(r) }),
    el('p', { className: 'note', textContent: 'Run it on the Mac and on Windows (play.cmd --dev, the same address) and paste each result back.' }));
}
