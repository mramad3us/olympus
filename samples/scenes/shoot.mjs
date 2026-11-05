// OLYMPUS: shoot the scenes sample. Every scene at both densities in its moods, crisp PNGs, the numbers printed.
//
//   node samples/scenes/shoot.mjs [--port 8233] [--only <scene>[,<scene>]] [--out samples/scenes/shots] [--bench] [--list]
//
// It serves the repository itself (tools/serve.py on the port given, 127.0.0.1; an agent's port, never the
// play copy's 8200) unless something already answers there, drives the system Chrome headless on the GPU
// (ANGLE Metal) through playwright-core, opens each shot's URL, waits for window.__ready and shoots the
// page at 1920 × 1080: 24 px/m pictures are 960 × 540 at × 2 and 16 px/m ones 640 × 360 at × 3, so both
// are exact integer scales, pixel for pixel, and compare at the same size. The HUD is off in the shots.
// Page errors, console errors and failed requests fail the shot. Each shot's report (draw calls,
// triangles, CPU and GPU milliseconds, the area's boxes, atlas and build time, and with --bench the
// frame time forced to finish) is printed and written to shots/report.json.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2), opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const port = Number(opt('--port', '8233')), out = path.resolve(root, opt('--out', 'samples/scenes/shots')), only = opt('--only', null)?.split(','), bench = args.includes('--bench');
if ([8090, 8100, 8101, 8200, 8201].includes(port)) throw new Error(`port ${port} is not ours`);

/** The shots: [scene, view, mood, extra query]. Each is taken at 16 and 24 px/m. */
export const PLAN = [
  ['bay', 'full', 'reveille'], ['bay', 'close', 'reveille'], ['bay', 'full', 'lightsOut'], ['bay', 'close', 'lightsOut'],
  ['head', 'close', 'evening'], ['head', 'close', 'lightsOut'],
  ['mess', 'full', 'noon'], ['mess', 'close', 'noon'],
  ['chasm', 'full', 'day'], ['chasm', 'full', 'storm'], ['chasm', 'full', 'heavy'], ['chasm', 'close', 'day'], ['chasm', 'close', 'storm'],
  ['deck', 'full', 'normal'], ['deck', 'full', 'battle'], ['deck', 'full', 'emergency'], ['deck', 'close', 'normal'], ['deck', 'close', 'battle'], ['deck', 'close', 'emergency'],
  ['kit', 'full', 'day'], ['kit', 'full2', 'day'], ['kit', 'wall', 'day'], ['kit', 'wall2', 'day'], ['kit', 'left', 'day'], ['kit', 'right', 'day'], ['kit', 'rows', 'day'], ['kit', 'rows2', 'day'], ['kit', 'rows3', 'day'], ['kit', 'rows4', 'day'],
];

async function up() { try { const r = await fetch(`http://127.0.0.1:${port}/VERSION`); return r.ok; } catch { return false; } }
let server = null;
if (!(await up())) {
  server = spawn('python3', [path.join(root, 'tools/serve.py'), String(port), root], { stdio: 'ignore' });
  for (let i = 0; i < 50 && !(await up()); i++) await new Promise(r => setTimeout(r, 100));
}
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const results = [];
let failed = 0;
try {
  for (const [scene, view, mood, extra = ''] of PLAN) {
    if (only && !only.includes(scene)) continue;
    for (const ppm of [16, 24]) {
      const name = `${scene}-${view}-${mood}-ppm${ppm}`, url = `http://127.0.0.1:${port}/samples/scenes/?scene=${scene}&view=${view}&mood=${mood}&ppm=${ppm}&hud=0${bench ? '&bench=1' : ''}${extra}`;
      if (args.includes('--list')) { console.log(name, url); continue; }
      const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
      const errors = [];
      page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
      page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
      page.on('response', r => { if (r.status() >= 400) errors.push(`http ${r.status()}: ${r.url()}`); });
      try {
        await page.goto(url, { waitUntil: 'load', timeout: 60000 });
        await page.waitForFunction('window.__ready === true', null, { timeout: 60000 });
        await page.screenshot({ path: path.join(out, `${name}.png`) });
        const report = await page.evaluate(() => window.__report);
        results.push({ name, url, report, errors });
        const r = report;
        console.log(`${name}: calls ${r.calls.total} (scene ${r.calls.scene}, post ${r.calls.post}) · ${r.triangles} tris · cpu ${r.cpuMs} ms${r.gpuMs !== null ? ` · gpu ${r.gpuMs} ms` : ''}${r.bench ? ` · bench ${r.bench} ms` : ''} · ${r.area.boxes} boxes ${r.area.quads} quads · atlas ${r.area.atlas.join('+')} ${r.area.atlasKB} KB · build ${r.build.buildMs} ms (paint ${r.area.paintMs}) · upload ${r.build.uploadMs} ms${errors.length ? `\n  ${errors.join('\n  ')}` : ''}`);
        if (errors.length) failed++;
      } catch (e) {
        failed++;
        console.log(`${name}: FAILED ${e.message.split('\n')[0]}${errors.length ? `\n  ${errors.join('\n  ')}` : ''}`);
        results.push({ name, url, errors: [...errors, e.message.split('\n')[0]] });
      }
      await page.close();
    }
  }
} finally {
  await browser.close();
  if (server) server.kill();
}
if (!args.includes('--list')) writeFileSync(path.join(out, only ? `report-${only.join('-')}.json` : 'report.json'), JSON.stringify(results, null, 1));
if (failed) { console.log(`${failed} shots failed`); process.exitCode = 1; }
