// OLYMPUS sample tool: capture the drawn shoot house as the game draws it, today's and with the unknown house's rule, for its sample.
//
//   node samples/house-unknown/capture.mjs [--port 8237] [--out samples/house-unknown]
//
// The sample (samples/house-unknown) draws the three candidates for a house you have not seen over the game's own picture of
// the drawn lane (DESIGN.md, 2026-11-17: "we see what is in the rooms before entering them, this should not be the case when
// we start generating procedurally"). This script opens the game (test-shoothouse on a house drawn from seed 48213, &draw=drawn,
// at 10:00, nothing stored), at two moments: GO (&setup=go: you and your #2 at the start mark, every room ahead) and after
// room 1 (&setup=room:2: room 1 cleared as the tier one's plan clears it, the stack on room 2's door). At each it opens the
// game twice: once with the unknown house's ship switch off (src/render/known.js UNKNOWN_HIDDEN served false: today's picture,
// v0.0.22's rule), once as the game ships it (the switch on: B's known cells and post.js step 2a, the picture the player sees,
// U1). Each time it pauses the clock, lets the picture settle, hides the HUD and shoots the stage at twice its size, brought
// back to its own pixels (every 2 × 2 block checked one colour), and reads from the game what the sample needs:
//   go.png, room1.png   the stage's picture (640 × 360 at 16 px/m), today's: every room drawn, dimmed by the fog where unseen;
//   go-u1.png, room1-u1.png  the same moment as the game draws it (U1): each pixel whose own world spot falls on a cell never
//                       in sight UNKNOWN_C, the catwalk, the booth, the outer walls and the walls' faces toward what you see drawn
//                       (the review of 2026-11-18: E1's own mask, cut before B's code, drew the catwalk, the booth and the hall's
//                       north wall black where the game draws them; the sample now takes the game's own pixels);
//   scene.json          per moment: the camera (the ground at the picture's centre, metres) and the projection checked
//                       against the view's own screenOf at the footprint's corners; the house's footprint (HOUSE1's rect,
//                       fixed), the catwalk's line, the lane's rooms (the drawn area's cqb rooms, closet and booth, rects), the
//                       legs' states (a room whose leg reached 'entered' is known whole, B's rebuild rule), where you and your
//                       #2 stand, the start mark (the hall walked from it to you), and your sight now over the footprint, a
//                       bit a 0.25 m cell (people's sightMask, the fog's own source), as hex rows.
// The two captures of a moment differ only where the game paints UNKNOWN_C (the switch changes nothing else): unknown.js
// unknownOf reads the sample's unknown pixels from them, and tests/samples-portrait holds the two to agree elsewhere. The game
// is served by tools/serve.py on the port given (an agent's, 8230 to 8239; never 8200 or 8201), started and stopped here.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const PORT = Number(opt('--port', 8237)), OUT = path.resolve(ROOT, opt('--out', 'samples/house-unknown'));
if ([8200, 8201, 8212].includes(PORT)) throw new Error('never the play copy\'s, the dev tree\'s or the gallery\'s port');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const W = 640, H = 360, K = 2, CELL_M = 0.25;
const MOMENTS = [['go', 'go'], ['room1', 'room:2']];

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

const scene = { about: 'Made by capture.mjs (see its header): per moment the game\'s known cells (fogKnown, the view\'s stats), the camera, the footprint, the catwalk, the rooms, the legs, you, your #2, the start mark and your sight now over the footprint (a bit a cell, hex rows, x then z).', frame: [W, H], ppm: 16, cellM: CELL_M, moments: {} };
try {
  await up();
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: W * K, height: H * K } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  // (today's picture: known.js served with its ship switch off, nothing else changed)
  let switchOff = false, served = 0;
  await page.route('**/src/render/known.js', async (route) => {
    const res = await route.fetch(), body = await res.text();
    if (!switchOff) return route.fulfill({ response: res, body });
    const off = body.replace('UNKNOWN_HIDDEN = true', 'UNKNOWN_HIDDEN = false');
    if (off === body) throw new Error('known.js: no UNKNOWN_HIDDEN = true to switch off');
    served++;
    return route.fulfill({ response: res, body: off });
  });
  for (const [name, setup] of MOMENTS) for (const look of ['today', 'u1']) {
    switchOff = look === 'today';
    await page.goto(`http://127.0.0.1:${PORT}/?play=test-shoothouse&draw=drawn&setup=${encodeURIComponent(setup)}&seed=48213&hour=10&nostore=1`, { waitUntil: 'load' });
    await page.waitForFunction('window.__ready === true', null, { timeout: 90000 });
    await page.evaluate(() => __olympus.pause(true));
    await sleep(1500);
    await page.addStyleTag({ content: 'body * { visibility: hidden !important; } canvas.oly-stage { visibility: visible !important; }' });
    await page.evaluate(() => { const cs = [...document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height); cs[0].classList.add('oly-stage'); });
    await sleep(400);
    const shot = await native(page);
    if (shot.bad) throw new Error(`${name} ${look}: ${shot.bad} pixels not whole 2 × 2 blocks`);
    writeFileSync(path.join(OUT, `${name}${look === 'u1' ? '-u1' : ''}.png`), Buffer.from(shot.b64, 'base64'));
    const fogKnown = await page.evaluate(() => window.__report?.view?.fog?.known ?? null);
    if (look === 'today') { if (fogKnown) throw new Error(`${name}: today's picture made known cells ${JSON.stringify(fogKnown)}`); continue; }
    if (!fogKnown) throw new Error(`${name}: the game's picture made no known cells (not a drawn lane?)`);
    const m = await page.evaluate(async ({ CELL_M }) => {
      const G = __olympus, s = G.state, M = await import('/src/sim/places/model.js'), A = await import('/src/sim/scenes/assemble.js');
      const spec = A.houseSpecOf(s), area = M.areaOf(s.places.live.area), Hh = s.armoury.range.house, [x0, z0, x1, z1] = spec.rect;
      const nx = Math.round((x1 - x0) / CELL_M), nz = Math.round((z1 - z0) / CELL_M), sm = G.sightMask(), rows = [];
      for (let j = 0; j < nz; j++) {
        let bits = '';
        for (let i = 0; i < nx; i++) {
          const x = x0 + (i + 0.5) * CELL_M, z = z0 + (j + 0.5) * CELL_M, a = Math.floor((x - sm.x0) / sm.cellM), b = Math.floor((z - sm.z0) / sm.cellM);
          bits += a >= 0 && b >= 0 && a < sm.nx && b < sm.nz && sm.vis[b * sm.nx + a] > 0 ? '1' : '0';
        }
        let hex = ''; for (let k = 0; k < bits.length; k += 4) hex += parseInt(bits.slice(k, k + 4).padEnd(4, '0'), 2).toString(16);
        rows.push(hex);
      }
      const acts = G.actors(), me = acts.find(a => a.id === s.player.actor), two = acts.find(a => a.who === Hh.twoPid);
      const check = [[x0, z0], [x1, z0], [x0, z1], [x1, z1]].map(([x, z]) => ({ x, z, px: G.screenOf(x, 0, z) }));
      return {
        camera: G.view.camera, res: G.view.res, rect: spec.rect, hall: spec.hall.rect, axisZ: spec.hall.axisZ, catwalk: spec.catwalk, start: spec.start,
        rooms: (area.rooms ?? []).filter(r => ['cqbRoom', 'closet', 'booth', 'hall'].includes(r.kind)).map(r => ({ id: r.id.split('.').pop(), kind: r.kind, rect: r.rect })),
        legs: [...Hh.rooms, Hh.hall].map(L => ({ room: String(L.room).split('.').pop(), state: L.state })),
        you: { x: me.x, z: me.z, face: me.face }, two: two ? { x: two.x, z: two.z } : null, code: Hh.draw?.code ?? null,
        sight: { nx, nz, rows }, check,
      };
    }, { CELL_M });
    scene.moments[name] = { setup, ...m, fogKnown };
    console.log(name, 'camera', JSON.stringify(m.camera), 'seen cells', m.sight.rows.join('').split('').reduce((a, h) => a + parseInt(h, 16).toString(2).split('1').length - 1, 0), 'legs', m.legs.map(l => `${l.room}:${l.state}`).join(' '));
  }
  if (served !== MOMENTS.length) throw new Error(`known.js served with its switch off ${served} times, not ${MOMENTS.length}`);
  writeFileSync(path.join(OUT, 'scene.json'), JSON.stringify(scene, null, 1) + '\n');
  await browser.close();
  if (errors.length) { console.log('page errors:\n  ' + errors.join('\n  ')); process.exitCode = 1; }
} finally { server.kill(); }
