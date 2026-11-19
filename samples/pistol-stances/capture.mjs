// OLYMPUS sample tool: capture the stage's own picture of you with the P-12 out today, for the pistol stances' sample.
//
//   node samples/pistol-stances/capture.mjs [--port 8237] [--out samples/pistol-stances]
//
// The user, 2026-11-17: "Holding the sidearm with the rifle dangling should be redrawn, sidearm should have the same stances
// (low ready, high ready, aimed, etc) as the rifle". This script shows what the stage draws today: it opens the game
// (test-shoothouse on seed 48213, nothing stored), loads tests/saves/v0.0.17-house-pistol.json.gz (the sergeant after
// Transition, the P-12 at the ready, the R-7 hanging on its sling: a save made by v0.0.17's own code), pauses, hides the HUD,
// shoots the stage at twice its size (brought back to its own pixels, every 2 × 2 block checked) and writes:
//   today.png    the stage's picture round you, CROP_PX square at 16 px/m (the save's moment, as the game draws it now);
//   today.json   what the view asked for (view.stats.arms: the carry, the frame the gait asked, 'draw' or 'pistolAim') and
//                what it drew: the frame actually drawn when no stance sheet holds it (render/figures.js's stand-in, the
//                rifle's carry frame: the rifle slung in front, the hands empty, no pistol), counted by the figures' stats.
// The game is served by tools/serve.py on the port given (an agent's, 8230 to 8239; never 8200, 8201 or 8212), started and stopped here.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const PORT = Number(opt('--port', 8237)), OUT = path.resolve(ROOT, opt('--out', 'samples/pistol-stances'));
if ([8200, 8201, 8212].includes(PORT)) throw new Error('never the play copy\'s, the dev tree\'s or the gallery\'s port');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const W = 640, H = 360, K = 2, CROP_PX = 64;

const server = spawn('python3', [path.join(ROOT, 'tools/serve.py'), String(PORT), ROOT], { stdio: 'ignore' });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function up() { for (let i = 0; i < 50; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/VERSION`)).ok) return; } catch {} await sleep(100); } throw new Error('no server'); }

/** The picture at its own pixels from a shot at K times (each K × K block one colour: the count of blocks that are not). */
async function native(page) {
  const png = await page.screenshot({ type: 'png' });
  return page.evaluate(async ({ b64, W, H, K }) => {
    const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode();
    const c = new OffscreenCanvas(img.width, img.height), g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, img.width, img.height).data, out = new OffscreenCanvas(W, H), og = out.getContext('2d'), od = og.createImageData(W, H);
    let bad = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = ((y * K) * img.width + x * K) * 4, o = (y * W + x) * 4;
      for (let j = 0; j < K; j++) for (let k = 0; k < K; k++) { const q = (((y * K) + j) * img.width + x * K + k) * 4; if (d[q] !== d[i] || d[q + 1] !== d[i + 1] || d[q + 2] !== d[i + 2]) bad++; }
      od.data.set([d[i], d[i + 1], d[i + 2], 255], o);
    }
    og.putImageData(od, 0, 0);
    const blob = await out.convertToBlob({ type: 'image/png' }), buf = new Uint8Array(await blob.arrayBuffer());
    let s = ''; for (const v of buf) s += String.fromCharCode(v);
    return { b64: btoa(s), bad };
  }, { b64: png.toString('base64'), W, H, K });
}

try {
  await up();
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: W * K, height: H * K } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`http://127.0.0.1:${PORT}/?play=test-shoothouse&setup=go&seed=48213&nostore=1`, { waitUntil: 'load' });
  await page.waitForFunction('window.__ready === true', null, { timeout: 90000 });
  const json = gunzipSync(readFileSync(path.join(ROOT, 'tests/saves/v0.0.17-house-pistol.json.gz'))).toString();
  await page.evaluate(async (j) => { await __olympus.load(j); __olympus.pause(true); }, json);
  await sleep(2500);
  await page.addStyleTag({ content: 'body * { visibility: hidden !important; } canvas.oly-stage { visibility: visible !important; }' });
  await page.evaluate(() => { const cs = [...document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height); cs[0].classList.add('oly-stage'); });
  await sleep(500);
  const shot = await native(page);
  if (shot.bad) throw new Error(`${shot.bad} pixels not whole 2 × 2 blocks`);
  const info = await page.evaluate(() => {
    const G = __olympus, s = G.state, me = s.actors.list.find(a => a.id === s.player.actor), at = G.screenOf(me.x, 0, me.z), st = G.report?.stats ?? null;
    return { arms: G.view.arms, you: { x: me.x, z: me.z, face: me.face }, at: [Math.round(at.x), Math.round(at.y)], stanceFallback: G.view.figures?.stanceFallback ?? null, posture: s.people[s.player.id]?.kit?.carry?.posture ?? null, stats: st };
  });
  // (the crop round you: your feet's point on the picture a little below its middle)
  const crop = await page.evaluate(async ({ b64, at, C }) => {
    const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode();
    const c = new OffscreenCanvas(C, C), g = c.getContext('2d');
    g.drawImage(img, at[0] - C / 2, at[1] - Math.round(C * 0.7), C, C, 0, 0, C, C);
    const blob = await c.convertToBlob({ type: 'image/png' }), buf = new Uint8Array(await blob.arrayBuffer());
    let s = ''; for (const v of buf) s += String.fromCharCode(v);
    return btoa(s);
  }, { b64: shot.b64, at: info.at, C: CROP_PX });
  writeFileSync(path.join(OUT, 'today.png'), Buffer.from(crop, 'base64'));
  const out = { about: 'Made by capture.mjs (see its header): the save v0.0.17-house-pistol loaded in today\'s game, what the view asked for and where you stand on the picture.', save: 'tests/saves/v0.0.17-house-pistol.json.gz', crop: CROP_PX, posture: info.posture, arms: info.arms, you: info.you, at: info.at };
  writeFileSync(path.join(OUT, 'today.json'), JSON.stringify(out, null, 1) + '\n');
  console.log('today: the view asked', JSON.stringify(info.arms), 'posture', info.posture, 'at', info.at);
  await browser.close();
  if (errors.length) { console.log('page errors:\n  ' + errors.join('\n  ')); process.exitCode = 1; }
} finally { server.kill(); }
