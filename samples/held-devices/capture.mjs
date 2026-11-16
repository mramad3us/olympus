// OLYMPUS sample tool: capture the stage's own picture of you at the hunt's three ticks, for the held devices sample's check (K).
//
//   node samples/held-devices/capture.mjs [--port 8237] [--out samples/held-devices]
//
// The hunt of v0.0.18 (kit-10) named the lane: test-shoothouse at GO on seed 1489397426, the tier one on the full loadout, played
// by the honest kit bot (tests/bots/kit.mjs houseKitBot({ use: 'both', base: 'honest' })), and three moments in it, in ms after
// GO: 13,350 (the G-11 armed in your hand, on the restack), 28,850 (the halligan in both hands, the force beat), 33,400 (the
// second G-11 armed, the arm beat). This script plays that lane in node to each moment (the real sim, tests/game.mjs), checks
// the device is in your hand there (devices.js handDeviceOf), saves the game, loads each save in the page (tools/serve.py on the
// port given, an agent's, 8230 to 8239; never 8200 or 8201), pauses it, hides the HUD and shoots the stage at twice its size,
// brought back to its own pixels (every 2 × 2 block checked to be one colour). It writes:
//   check.png    the three moments' crops (CROP_W × CROP_H each, you at the middle, your soles CROP_FOOT rows up), stacked;
//   check.json   for each moment: the ms after GO, the device in your hand, your place and facing, the beat running, the
//                camera, and whether the crop was whole pixels.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGame } from '../../tests/game.mjs';
import { runHouse } from '../../tests/bots/house.mjs';
import { houseKitBot } from '../../tests/bots/kit.mjs';
import { handDeviceOf } from '../../src/sim/arms/devices.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const PORT = Number(opt('--port', 8237)), OUT = path.resolve(ROOT, opt('--out', 'samples/held-devices'));
if ([8200, 8201, 8212].includes(PORT)) throw new Error('never the play copy\'s, the dev tree\'s or the gallery\'s port');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
/** The lane and its moments (see the header). */
export const LANE = Object.freeze({ seed: 1489397426, tier: 'tierone', loadout: 'full', use: 'both', base: 'honest' });
export const MOMENTS_MS = Object.freeze([13350, 28850, 33400]);
/** The stage's picture (16 px/m) and each crop round you. */
const W = 640, H = 360, K = 2, CROP_W = 112, CROP_H = 72, CROP_FOOT = 12;

// ---------- the lane, in node ----------
const g = createGame({ scenario: 'test-shoothouse', seed: LANE.seed, tier: LANE.tier, setup: 'go', loadout: LANE.loadout });
const pid = g.state.player.id, goMs = g.state.armoury.range.house.goAtMs, saves = [];
let want = 0;
runHouse(g, houseKitBot({ use: LANE.use, base: LANE.base }), { maxMs: 60_000, each: (game) => {
  const s = game.state;
  if (want >= MOMENTS_MS.length || s.clock.ms - goMs !== MOMENTS_MS[want]) return;
  const h = handDeviceOf(s, pid), a = s.actors.list.find(x => x.who === pid), b = s.stop?.doing?.beats?.find(x => x.st === 'run');
  saves.push({ ms: MOMENTS_MS[want], device: h ? { model: h.model, st: h.st } : null, x: a.x, z: a.z, face: a.face, beat: b ? `${b.k}${b.key ? '/' + b.key : ''}` : null, json: game.save() });
  want++;
} });
if (saves.length !== MOMENTS_MS.length || saves.some(m => !m.device)) throw new Error(`the lane did not reach its moments with a device in hand: ${JSON.stringify(saves.map(({ json, ...m }) => m))}`);

// ---------- the page ----------
const server = spawn('python3', [path.join(ROOT, 'tools/serve.py'), String(PORT), ROOT], { stdio: 'ignore' });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function up() { for (let i = 0; i < 50; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/VERSION`)).ok) return; } catch {} await sleep(100); } throw new Error('no server'); }
/** The crop round (cx, cy) of the picture at its own pixels, from a shot at K times (each K × K block one colour, or counted). */
async function crop(page, cx, cy) {
  const png = await page.screenshot({ type: 'png' });
  return page.evaluate(async ({ b64, K, cx, cy, CW, CH }) => {
    const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode();
    const c = new OffscreenCanvas(img.width, img.height), g2 = c.getContext('2d'); g2.drawImage(img, 0, 0);
    const d = g2.getImageData(0, 0, img.width, img.height).data, out = [];
    let bad = 0;
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
      const X = cx + x, Y = cy + y, i = ((Y * K) * img.width + X * K) * 4;
      for (let j = 0; j < K; j++) for (let k = 0; k < K; k++) { const q = (((Y * K) + j) * img.width + X * K + k) * 4; if (d[q] !== d[i] || d[q + 1] !== d[i + 1] || d[q + 2] !== d[i + 2]) bad++; }
      out.push([d[i], d[i + 1], d[i + 2]]);
    }
    return { px: out, bad };
  }, { b64: png.toString('base64'), K, cx, cy, CW: CROP_W, CH: CROP_H });
}
try {
  await up();
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: W * K, height: H * K } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${PORT}/?play=test-shoothouse&setup=go&seed=${LANE.seed}&tier=${LANE.tier}&loadout=${LANE.loadout}&nostore=1`, { waitUntil: 'load' });
  await page.waitForFunction('window.__ready === true', null, { timeout: 60000 });
  await page.addStyleTag({ content: 'body * { visibility: hidden !important; } canvas.oly-stage { visibility: visible !important; }' });
  await page.evaluate(() => { const cs = [...document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height); cs[0].classList.add('oly-stage'); });
  const strip = new Uint8Array(CROP_W * CROP_H * MOMENTS_MS.length * 4), out = [];
  for (const [n, m] of saves.entries()) {
    await page.evaluate((j) => __olympus.load(j), m.json);
    await page.evaluate(() => __olympus.pause(true));
    await sleep(1500);
    const cam = await page.evaluate(() => ({ ...__olympus.view.camera }));
    const cx = Math.round((m.x - cam.x) * 16) + W / 2 - CROP_W / 2, cy = Math.round((m.z - cam.z) * 16) + H / 2 - (CROP_H - CROP_FOOT);
    const c = await crop(page, cx, cy);
    c.px.forEach(([r, gg, b], i) => strip.set([r, gg, b, 255], (n * CROP_W * CROP_H + i) * 4));
    const { json, ...rest } = m;
    out.push({ ...rest, camera: cam, crop: [cx, cy], blocksOff: c.bad });
    console.log(`${m.ms} ms: ${m.device.model} ${m.device.st}, ${m.beat}, you at ${m.x.toFixed(2)}, ${m.z.toFixed(2)} facing ${m.face}; camera ${JSON.stringify(cam)}; blocks off ${c.bad}`);
  }
  // (the strip written through the page's own encoder: no image library in node)
  const b64 = await page.evaluate(async ({ data, w, h }) => {
    const c = new OffscreenCanvas(w, h), g2 = c.getContext('2d'), im = g2.createImageData(w, h); im.data.set(data); g2.putImageData(im, 0, 0);
    const buf = new Uint8Array(await (await c.convertToBlob({ type: 'image/png' })).arrayBuffer());
    let s = ''; for (const v of buf) s += String.fromCharCode(v); return btoa(s);
  }, { data: [...strip], w: CROP_W, h: CROP_H * MOMENTS_MS.length });
  writeFileSync(path.join(OUT, 'check.png'), Buffer.from(b64, 'base64'));
  writeFileSync(path.join(OUT, 'check.json'), JSON.stringify({ about: 'Made by capture.mjs: the hunt\'s lane and moments, and the stage\'s crop round you at each (check.png, stacked).', lane: LANE, crop: [CROP_W, CROP_H, CROP_FOOT], moments: out }, null, 1) + '\n');
  if (errors.length) { console.log('page errors', errors); process.exitCode = 1; }
  await browser.close();
} finally { server.kill(); }
