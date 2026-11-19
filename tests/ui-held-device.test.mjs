// OLYMPUS tests: the device in the hands on the stage, in the page (the build sheet v0.0.22 §1 item 17, §6 D; the residuals lens's R3; kit-10 of the v0.0.18 hunt). Heavy: a browser.
//
// The hunt's lane (the tier one on the full loadout, 1489397426, the honest kit bot) played in node to 13,350 ms after GO, the
// G-11 armed in your right hand on the restack, saved; and the same tick with the G-11 put back in a pouch, saved. Each loaded in the
// page and paused: with the G-11 the stage draws its card (view.held: one drawn, your frame the held band's heldCan) and the pixels
// round you differ from the pouched tick's, where no card is drawn. Then the lane played in the page from GO, a tick a frame by the
// same bot to GO + 40 s (the G-11, the halligan, the second G-11): every tick with a device in your hand has its card drawn or the
// body hiding it whole (view.held), no held card baked after GO (late 0: the strip baked behind the brief's cut), and no upload of
// the held band (stanceHeld) after GO + 1 s, nor any upload of the frame over UPLOAD_MID_KB that is the held band's. Fails without the
// held cards.
import { assert } from './helpers.mjs';
import { withGame } from './browser.mjs';
import { createGame } from './game.mjs';
import { runHouse } from './bots/house.mjs';
import { houseKitBot } from './bots/kit.mjs';
import { handDeviceOf, setSt } from '../src/sim/arms/devices.js';
import { move, containersOf } from '../src/sim/arms/kit.js';
import { UPLOAD_MID_KB } from '../src/data/bench.js';

const LANE = 'play=test-shoothouse&setup=go&seed=1489397426&tier=tierone&loadout=full&nostore=1', AT_MS = 13350;
function saves() {
  const g = createGame({ scenario: 'test-shoothouse', seed: 1489397426, tier: 'tierone', setup: 'go', loadout: 'full' }), pid = g.state.player.id, go = g.state.armoury.range.house.goAtMs;
  let held = null;
  runHouse(g, houseKitBot({ use: 'both', base: 'honest' }), { maxMs: 30_000, each: (game) => { if (!held && game.state.clock.ms - go === AT_MS) held = game.save(); } });
  const h2 = createGame({ scenario: 'test-shoothouse', seed: 1489397426, tier: 'tierone', setup: 'go', loadout: 'full' });
  h2.load(held);
  const s = h2.state, h = handDeviceOf(s, pid);
  let into = null;
  for (const c of containersOf(s, pid)) { try { move(s, h.id, { container: c }); into = c; break; } catch { /* (a pouch that does not take it) */ } }
  if (into) setSt(s, h.id, 'pouched');
  const a = s.actors.list.find(x => x.who === pid);
  return { held, pouched: h2.save(), model: h.model, into, at: { x: a.x, z: a.z } };
}

export default [
  {
    name: 'the G-11 in your hand on the stage (heavy): its card drawn at 13,350 ms of the hunt\'s lane, the pixels round you not the pouched tick\'s; the lane played to GO + 40 s with every device in hand drawn, nothing baked after GO and no held band uploaded after GO + 1 s',
    heavy: true,
    timeoutMs: 600_000,
    async fn() {
      const port = Number(process.env.OLYMPUS_TEST_PORT) || undefined, S = saves(), rows = [];
      assert(S.into && S.model === 'g11', JSON.stringify({ into: S.into, model: S.model }));
      await withGame(async (page, errors, game) => {
        await game.open(LANE);
        await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
        const shot = async (json) => {
          await page.evaluate((j) => { window.__olympus.load(j); window.__olympus.pause(true); }, json);
          await page.waitForTimeout(1500);
          const v = await page.evaluate(() => ({ held: window.__olympus.view?.held ?? null, cam: { ...window.__olympus.view.camera } }));
          // (the stage's picture round you, from a screenshot (a WebGL canvas is not read back), decoded in the page)
          const box = await page.evaluate(({ x, z, cam }) => {
            const cv = [...document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height)[0], r = cv.getBoundingClientRect(), k = r.width / 640;
            return { x: Math.round(r.left + ((x - cam.x) * 16 + 320 - 24) * k), y: Math.round(r.top + ((z - cam.z) * 16 + 180 - 40) * k), w: Math.round(48 * k), h: Math.round(48 * k) };
          }, { x: S.at.x, z: S.at.z, cam: v.cam });
          const png = await page.screenshot({ type: 'png', clip: { x: box.x, y: box.y, width: box.w, height: box.h } });
          const px = await page.evaluate(async (b64) => { const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode(); const c = new OffscreenCanvas(img.width, img.height), g2 = c.getContext('2d'); g2.drawImage(img, 0, 0); return [...g2.getImageData(0, 0, img.width, img.height).data]; }, png.toString('base64'));
          return { ...v, px };
        };
        const A = await shot(S.held), B = await shot(S.pouched);
        let diff = 0; for (let i = 0; i < A.px.length; i += 4) if (A.px[i] !== B.px[i] || A.px[i + 1] !== B.px[i + 1] || A.px[i + 2] !== B.px[i + 2]) diff++;
        rows.push(`13,350 ms: in hand ${JSON.stringify(A.held?.who)} drawn ${A.held?.drawn}, strip ${JSON.stringify(A.held?.strip?.shapes)} (${A.held?.strip?.cards} cards, baked in ${A.held?.strip?.bakeMs} ms); pouched drawn ${B.held?.drawn}; ${diff} of ${A.px.length / 4} pixels round you differ`);
        assert(A.held?.drawn >= 1 && A.held.who.some(w => w.shape === 'can' && w.frame === 'heldCan') && B.held?.drawn === 0 && diff > 0, JSON.stringify({ A: A.held, B: B.held, diff }));
        // (the lane in the page, a tick a frame)
        await game.open(LANE);
        await page.waitForFunction(() => window.__ready === true && window.__olympus.state?.armoury?.range?.house?.goAtMs !== null, null, { timeout: 60000 });
        const r = await page.evaluate(async () => {
          const O = window.__olympus, { houseKitBot: kb } = await import('/tests/bots/kit.mjs'), { handDeviceOf: hd } = await import('/src/sim/arms/devices.js'), bot = kb({ use: 'both', base: 'honest' }), mem = {};
          const go = O.state.armoury.range.house.goAtMs, out = { frames: 0, handFrames: 0, drawn: 0, hidden: 0, missing: [], late: 0, uploads: [], maxHeldKB: 0 };
          O.pause(true);
          await new Promise((done) => {
            const tick = () => {
              const s = O.state, me = s.actors.list.find(a => a.id === s.player.actor);
              if (s.armoury.range.end || s.clock.ms - go > 40_000) return done();
              if (s.skip?.engine === 'ff') { O.step(1); O.sim.ffCheck(s); } else O.step(1, bot(s, me, mem));
              requestAnimationFrame(() => {
                const v = O.view, t = s.clock.ms - go, h = hd(s, s.player.id), mine = v?.held?.who?.find(w => w.id === me.id);
                out.frames++;
                if (h) { out.handFrames++; if (mine && v.held.drawn > 0) out.drawn++; else if (mine) out.hidden++; else if (out.missing.length < 5) out.missing.push({ t, model: h.model }); }
                out.late = v?.held?.late ?? 0;
                const u = v?.uploads;
                if (u?.key && /stanceHeld/.test(u.key)) { out.uploads.push({ t, key: u.key, kb: Math.round(u.bytes / 1024) }); if (t > 1000) out.maxHeldKB = Math.max(out.maxHeldKB, u.bytes / 1024); }
                tick();
              });
            };
            tick();
          });
          O.pause(false);
          return out;
        });
        rows.push(`the lane to GO + 40 s, a tick a frame: ${r.frames} frames, ${r.handFrames} with a device in your hand (${r.drawn} drawn, ${r.hidden} hidden by the body), missing ${JSON.stringify(r.missing)}; baked after GO ${r.late}; the held band's uploads ${JSON.stringify(r.uploads)} (after GO + 1 s at most ${r.maxHeldKB.toFixed(0)} KB, the bound ${UPLOAD_MID_KB})`);
        for (const x of rows) console.log(`      ${x}`);
        assert(r.handFrames > 50 && !r.missing.length && r.late === 0 && !r.uploads.some(u => u.t > 1000), JSON.stringify(r));
        assert(!errors.length, errors.join(' | '));
      }, { port });
    },
  },
];
