// OLYMPUS sample tool: capture the shoot house's hall at room 1's door as the game draws it, without people, for the stack's figures sample.
//
//   node samples/house-stack-figures/capture.mjs [--port 8231] [--out samples/house-stack-figures]
//
// The sample (samples/house-stack-figures) draws the stack over the game's own picture of the hall: this script opens the game
// (test-shoothouse at GO on seed 48213, 10:00, the house's lights and floor, the fog of awareness, the post pass and the Mars
// palette, all as built), moves you and your #2 17 m west along the hall facing east (in the state, the clock paused, so the
// hall's east end is in front of you and seen, not remembered), lets the camera settle with the clock paused, hides the HUD and shoots the
// picture at twice its size, which it brings back to its own pixels (every 2 × 2 block checked to be one colour). It writes:
//   backdrop.png   the stage's picture (640 × 360 at 16 px/m), the hall empty of the stack;
//   scene.json     where the picture's camera stood (world metres at the picture's centre), the light each spot of the hall
//                  takes as a figure's tint (the view's own sum: places' lightLevel through the exposure in its light's colour,
//                  src/render/lighting.js tintAt), on a 0.25 m grid over the stretch the stack walks, and the stack's marks;
//   go.png         (with --go) the same moment with the stack at GO, as the game shows it: the reference the sample's own
//                  drawing of today's look is checked against (the sample's set=check, the gallery's S-h).
// The game is served by tools/serve.py on the port given (an agent's, 8230 to 8239; never 8200 or 8201), started here and stopped.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const PORT = Number(opt('--port', 8231)), OUT = path.resolve(ROOT, opt('--out', 'samples/house-stack-figures')), GO = args.includes('--go');
if ([8200, 8201].includes(PORT)) throw new Error('never the play copy\'s or the dev tree\'s port');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const W = 640, H = 360, K = 2;

const server = spawn('python3', [path.join(ROOT, 'tools/serve.py'), String(PORT), ROOT], { stdio: 'ignore' });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function up() { for (let i = 0; i < 50; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/VERSION`)).ok) return; } catch {} await sleep(100); } throw new Error('no server'); }

/** The picture at its own pixels from a shot at K times (each K × K block one colour, or it throws). */
async function native(page) {
  const png = await page.screenshot({ type: 'png' });
  // (decoded in the page: no image library in node)
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
  await page.goto(`http://127.0.0.1:${PORT}/?play=test-shoothouse&setup=go&seed=48213&nostore=1`, { waitUntil: 'load' });
  await page.waitForFunction('window.__ready === true', null, { timeout: 60000 });
  await page.evaluate(() => __olympus.pause(true));
  await sleep(800);
  // (the HUD hidden: everything but the canvas and its ancestors)
  await page.addStyleTag({ content: 'body * { visibility: hidden !important; } canvas.oly-stage { visibility: visible !important; }' });
  await page.evaluate(() => { const cs = [...document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height); cs[0].classList.add('oly-stage'); });
  await sleep(300);
  if (GO) { const a = await native(page); writeFileSync(path.join(OUT, 'go.png'), Buffer.from(a.b64, 'base64')); console.log('go.png, blocks off', a.bad); }
  const before = await page.evaluate(() => ({ actors: __olympus.actors(), camera: __olympus.view.camera }));
  const you = before.actors[0] && before.actors.find(a => a.seen === true && a.x > 33 && a.x < 34);
  // (you and your #2 moved well west, facing east: the hall's east end in front of you)
  await page.evaluate(() => {
    const s = __olympus.state;
    for (const a of s.actors.list) if (a.x > 33 && a.x < 36 && Math.abs(a.z - 13.2) < 0.5) { a.x = a.x - 17; a.face = 'right'; }
    __olympus.step(1);
  });
  await sleep(2500);
  const after = await page.evaluate(() => ({ actors: __olympus.actors(), camera: __olympus.view.camera, ms: __olympus.state.clock.ms }));
  const shot = await native(page);
  writeFileSync(path.join(OUT, 'backdrop.png'), Buffer.from(shot.b64, 'base64'));
  // (the light a figure takes over the stretch the stack walks: lighting.js tintAt, its sum made here from the same pure parts)
  const tints = await page.evaluate(async () => {
    const LM = await import('/src/render/light-maps.js'), LIGHT = await import('/src/sim/places/light.js'), PLAN = await import('/src/sim/places/plan.js');
    const TONE = await import('/src/art/tone.js'), WHEEL = await import('/src/data/places/wheel.js');
    const s = __olympus.state, ms = s.clock.ms, area = WHEEL.WHEEL_S4, plan = PLAN.planOf(area), lamps = LIGHT.lampsOf(s, area.id, ms) ?? [];
    const out = { x0: 24, z0: 11.5, stepM: 0.25, nx: 57, nz: 13, rgb: [] };
    for (let j = 0; j < out.nz; j++) for (let i = 0; i < out.nx; i++) {
      const x = out.x0 + i * out.stepM, z = out.z0 + j * out.stepM;
      const L = LIGHT.lightLevel(s, x, z, ms, area.id), pool = LM.poolAt(lamps, x, z), r = PLAN.roomAt(plan, x, z);
      const base = TONE.linear(LM.FILL_COLOURS[r ? LIGHT.lightingOf(s, area.id, r.id, ms) : 'day'] ?? LM.FILL_COLOURS.day);
      out.rgb.push(LM.tintOf(L, base, pool).map(v => Math.round(v * 1e4) / 1e4));
    }
    return out;
  });
  const scene = {
    about: 'Made by capture.mjs: the camera of backdrop.png (the ground at the picture\'s centre, metres), the figures\' tint over the hall (linear, row-major in z then x), the stack\'s marks.',
    frame: [W, H], ppm: 16, camera: after.camera, clockMs: after.ms, tints,
    actorsAtGo: before.actors.filter(a => a.x > 30).map(a => ({ id: a.id, x: a.x, z: a.z, face: a.face })), cameraAtGo: before.camera,
    blocksOff: shot.bad,
  };
  writeFileSync(path.join(OUT, 'scene.json'), JSON.stringify(scene, null, 1) + '\n');
  console.log('backdrop.png, blocks off', shot.bad, 'camera', JSON.stringify(after.camera), 'at GO', JSON.stringify(before.camera), 'you', JSON.stringify(you));
  console.log('actors after', JSON.stringify(after.actors.map(a => [a.id, a.x, a.z])));
  if (errors.length) console.log('page errors', errors);
  await browser.close();
} finally { server.kill(); }
