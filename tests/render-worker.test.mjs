// OLYMPUS tests: the paint worker (src/art/worker.js through src/render/painter.js), in a real browser. Heavy.
//
// TECH §11.2: the worker is cosmetic, and its outputs are pure, so the same job run in the worker and
// on the main thread gives the same bytes. In a page on this agent's port (a plain document, no game
// booted), the 'sheet' job (three looks' gait bands, both figures at both densities) and the 'area' job
// (the places role's TEST_AREA, src/data/places/testroom.js, at both densities) run through a painter
// with its worker and through one with none (the main thread's generators, WORKER_FALLBACK_MS a frame),
// and their digests (FNV-1a over the meta's canonical JSON, timings left out, and every buffer's bytes)
// are compared. Prints ms each way per job, the bytes, and the worker's start-up. And the one number the
// jobs hold for a module that imports three (a lamp's height, src/render/lights.js LAMP_Y_M) is pinned
// to it here, in the page, where three loads.
import { assert, fmt } from './helpers.mjs';
import { withGame } from './browser.mjs';

export default [
  {
    name: 'the sheet and area jobs give the same bytes in the paint worker and on the main thread, at 16 and 24 px/m',
    heavy: true,
    timeoutMs: 180000,
    async fn() {
      await withGame(async (page) => {
        // (a plain page of this origin with the game's import map, so a module that imports three loads)
        await page.setContent('<!doctype html><script type="importmap">{ "imports": { "three": "/vendor/three/build/three.module.js" } }</script><body></body>');
        const r = await page.evaluate(async () => {
          const { createPainter } = await import('/src/render/painter.js');
          const { TEST_AREA } = await import('/src/data/places/testroom.js');
          const lampY = { jobs: (await import('/src/art/jobs.js')).LAMP_Y_M, lights: (await import('/src/render/lights.js')).LAMP_Y_M };
          const canon = (v) => (Array.isArray(v) ? `[${v.map(canon).join(',')}]` : v && typeof v === 'object'
            ? `{${Object.keys(v).filter(k => k !== 'ms').sort().map(k => `${JSON.stringify(k)}:${canon(v[k])}`).join(',')}}` : JSON.stringify(v));
          const fnv = (h, bytes) => { for (let i = 0; i < bytes.length; i++) { h ^= bytes[i]; h = Math.imul(h, 16777619) >>> 0; } return h; };
          const digestOf = ({ meta, buffers }) => {
            let h = fnv(2166136261, new TextEncoder().encode(canon(meta)));
            for (const b of buffers) h = fnv(h, new Uint8Array(b));
            return h.toString(16).padStart(8, '0');
          };
          const t0 = performance.now();
          const worker = createPainter({ workers: 1 }), main = createPainter({ workers: 0 });
          // (the main painter's jobs go a frame's share at a time, as in the game without a worker)
          let stepping = true;
          const pump = () => { if (!stepping) return; main.step(); requestAnimationFrame(pump); };
          requestAnimationFrame(pump);
          await worker.run('sheet', { look: {}, band: 'gait', ppm: 16 }, { priority: 'own' });
          const startMs = performance.now() - t0;
          const looks = [
            { outfit: 'utilities', skin: 'tan', hair: { style: 'lowReg', color: 'dark' }, seed: 21 },
            { outfit: 'pt', skin: 'brown', hair: { style: 'bun', color: 'black' }, seed: 11 },
            { outfit: 'nco', skin: 'light', hair: { style: 'short', color: 'auburn' }, rank: 'sgt', seed: 26 },
          ];
          const jobs = [];
          for (const ppm of [16, 24]) {
            for (const look of looks) jobs.push({ job: 'sheet', args: { look, band: 'gait', ppm }, label: `sheet chibi ${look.outfit} ${ppm}` });
            jobs.push({ job: 'area', args: { area: TEST_AREA, ppm, partBase: 1000 }, label: `area test.rooms ${ppm}` });
          }
          const out = [];
          for (const j of jobs) {
            const a0 = performance.now(), A = await worker.run(j.job, j.args, { priority: 'area' }), aMs = performance.now() - a0;
            const b0 = performance.now(), B = await main.run(j.job, j.args, { priority: 'area' }), bMs = performance.now() - b0;
            const bytes = A.buffers.reduce((s, b) => s + b.byteLength, 0);
            out.push({ label: j.label, worker: digestOf(A), main: digestOf(B), workerMs: aMs, mainMs: bMs, bytes,
              stats: j.job === 'area' ? A.meta.stats : { rect: A.meta.rect } });
          }
          stepping = false;
          const modes = { worker: worker.mode, main: main.mode };
          worker.dispose(); main.dispose();
          return { startMs, out, modes, lampY, workerStats: worker.stats.byJob, mainStats: main.stats.byJob };
        });
        console.log(`      painters: ${r.modes.worker} and ${r.modes.main}; the worker's first job (its modules loaded) after ${fmt(r.startMs, 0)} ms`);
        for (const o of r.out) {
          const extra = o.stats.rect ? `${o.stats.rect.w}×${o.stats.rect.h} px` : `${o.stats.boxes} boxes, ${o.stats.quads} quads, ${o.stats.pages} page, ${fmt(o.stats.atlasBytes / 1024, 0)} KB atlas`;
          console.log(`      ${o.label}: worker ${fmt(o.workerMs, 0)} ms, main ${fmt(o.mainMs, 0)} ms (a frame's 4 ms at a time); ${fmt(o.bytes / 1024, 0)} KB, ${extra}; ${o.worker === o.main ? `digest ${o.worker} both ways` : `DIFFERENT ${o.worker} / ${o.main}`}`);
        }
        console.log(`      a lamp's height when it gives none: ${r.lampY.jobs} m in the jobs, ${r.lampY.lights} m in lights.js`);
        assert(r.lampY.jobs === r.lampY.lights, JSON.stringify(r.lampY));
        assert(r.modes.worker === 'worker' && r.modes.main === 'main', JSON.stringify(r.modes));
        const bad = r.out.filter(o => o.worker !== o.main);
        assert(!bad.length, `worker and main thread differ: ${bad.map(o => o.label).join(', ')}`);
      }, { at: '/VERSION', ready: 'true', timeoutMs: 60000 });
    },
  },
];
