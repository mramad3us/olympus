// OLYMPUS tests: ui-unknown, the stage's knowledge in the page (the build sheet v0.0.23 items 6 and 7, §6 B, F87's and F88's page halves; the user, 2026-11-17: "we see what is in the rooms before entering them, this should not be the case when we start generating procedurally"). Heavy, a browser file.
//
// In the page at 16 px/m (1280 × 720, the picture 640 × 360):
//   - the drawn lane 48213 at GO: every sampled floor point of the three rooms is UNKNOWN_C (black, U1) in the picture, the
//     hall's floor where you stand is not; played on by the honest tier one a tick a frame (the page's own bots), room 1 is
//     drawn once you have looked into it while rooms 2 and 3 stay black, and every send of the known cells after GO + 1 s under
//     UPLOAD_MID_KB (2,240 B: the bits; &perf=1's GL counters print the frames' bytes with and without a send);
//   - a load at room 2's stack (setup=room:2): room 1, cleared, drawn whole from its first frame (the rebuild from the legs);
//   - the set house at GO is v0.0.22's picture to the byte (its digest on the stage-0 tree, this Mac's GPU): a familiar place
//     sends no known cells and the post pass's unknown term leaves it untouched;
//   - the people (F87's page half): on "Stack and clear, live" 48213 at GO the stage draws neither role-player (view.stats.figures
//     names neither, view.stats.people.hidden 2, and the scene pass's part IDs where they stand hold no person's part); a save made
//     in node as room 2 is entered, loaded in the page, draws 2a (in sight) and not 3a.
// Fails without the fix (v0.0.22 drew the rooms dimmed and both men at GO).
import { assert, root } from './helpers.mjs';
import { withGame, frameMs } from './browser.mjs';
import { createGame } from './game.mjs';
import { houseHonestBot, runHouse } from './bots/house.mjs';
import { areaOf } from '../src/sim/places/model.js';
import { houseSpecOf } from '../src/sim/scenes/assemble.js';
import { UNKNOWN_C } from '../src/render/known.js';
import { UPLOAD_MID_KB } from '../src/data/bench.js';
import fs from 'node:fs';
import path from 'node:path';

const fmt = (o) => JSON.stringify(o);
const PORT = Number(process.env.OLYMPUS_TEST_PORT) || undefined;
const DRAWN = 'play=test-shoothouse&draw=drawn&seed=48213&tier=tierone&setup=go&nostore=1&perf=1';
const SET = 'play=test-shoothouse&setup=go&tier=tierone&seed=48213&nostore=1';
const LIVE = 'play=test-shoothouse-live&seed=48213&tier=tierone&setup=go&nostore=1';
/** The set house's picture at GO (tier one, 48213), FNV-1a over its RGB bytes, as the stage-0 tree (v0.0.22's code) draws it on this Mac (Metal): recorded 2026-11-17 by B on .run/v023/base.tree, twice, the same. */
// (re-recorded by the v0.0.24 integration: v0.0.24 F's picks of 2026-11-19 on the stage's figures, the Corps' helmet drawn as R3 and
// the combat EVA suit's gloves grey (helmets.js HELMET_DRAWN_AS, outfits.js COMBAT_SUIT.glove), move the set house's picture at GO;
// the after-E tree (7a9590f4, before F) still draws 92134a63, so F's looks are the whole cause; the bubbles are the HUD's, not the stage's)
const SET_GO_DIGEST = 'c55647e6';
const SHOTS = path.join(root, '.run', 'v023', 'b-shots');

// (the drawn lane's three rooms in node: each leg's rects, sampled at a 0.5 m grid inside a 0.4 m margin)
function roomPoints(o) {
  const g = createGame({ scenario: 'test-shoothouse', seed: 48213, ...o }), s = g.state, A = areaOf(houseSpecOf(s).area);
  return s.armoury.range.house.rooms.map(L => {
    const pts = [];
    for (const r of A.rooms.filter(x => x.id === L.room || x.id === `${L.room}-far`)) for (let x = r.rect[0] + 0.4; x <= r.rect[2] - 0.4; x += 0.5) for (let z = r.rect[1] + 0.4; z <= r.rect[3] - 0.4; z += 0.5) pts.push([x, z]);
    return { room: L.room.split('.').pop(), pts };
  });
}
// (in the page: each room's points as the picture shows them, black (UNKNOWN_C exactly) or not, counted only where the scene
// pass drew the room's floor (the part ID most of its points show: the catwalk, a wall or a door drawn over a point is not the
// floor); points off the picture left out)
const readRooms = (rooms, unk) => {
  const O = window.__olympus, px = O.pixels(0, 0, 4000, 4000), c = [(unk >> 16) & 255, (unk >> 8) & 255, unk & 255];
  return rooms.map(R => {
    const at = [];
    for (const [x, z] of R.pts) {
      const p = O.project(x, 0, z), xi = Math.round(p.x), yi = Math.round(p.y);
      if (xi < 0 || yi < 0 || xi >= px.w || yi >= px.h) continue;
      at.push({ id: px.ids[yi][xi], q: px.picture[yi][xi] });
    }
    const count = new Map();
    for (const a of at) count.set(a.id, (count.get(a.id) ?? 0) + 1);
    const floor = [...count.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const on = at.filter(a => a.id === floor);
    return { room: R.room, n: on.length, of: at.length, black: on.filter(a => a.q[0] === c[0] && a.q[1] === c[1] && a.q[2] === c[2]).length };
  });
};
// (the frame times over 120 frames, paused, and the post pass's GPU time where the browser has a timer: the cost of the unknown's
// term (the build sheet v0.0.23 §10, "B prints the frame times"; the user's bench cards judge it on Windows))
const cost = async (page) => ({ ...(await frameMs(page)), timer: await page.evaluate(() => window.__report.stage.timer ? { postMs: window.__report.stage.passes?.postMs ?? null, gpuMs: window.__report.stage.gpuMs } : null) });
const costLine = (c) => `median ${c.medianMs.toFixed(1)} ms, p95 ${c.p95Ms.toFixed(1)} ms over ${c.frames} frames; ${c.timer ? `the post pass ${c.timer.postMs?.toFixed(2)} ms of ${c.timer.gpuMs?.toFixed(2)} ms on the GPU` : 'no GPU timer in this browser'}`;
const frames = (page, n) => page.evaluate((k) => new Promise(r => { let i = 0; const f = () => (++i < k ? requestAnimationFrame(f) : r()); requestAnimationFrame(f); }), n);

export default [
  {
    name: 'the drawn lane 48213 in the page: at GO the rooms black (UNKNOWN_C) and the hall drawn; played on, room 1 drawn once looked into and rooms 2 and 3 still black; every frame that sent the known cells after GO + 1 s under UPLOAD_MID_KB; a load at room 2\'s stack draws room 1 whole',
    heavy: true,
    timeoutMs: 600_000,
    async fn() {
      const rooms = roomPoints({ draw: 'drawn' }), rows = [];
      await withGame(async (page, errors, game) => {
        await page.waitForFunction(() => window.__ready && window.__olympus.state.stop?.phase === 'choose', null, { timeout: 60000 });
        await frames(page, 30);
        await page.evaluate(`window.__readRooms = ${readRooms.toString()}`);
        const go = await page.evaluate(({ rooms, unk }) => {
          const O = window.__olympus, s = O.state, me = s.actors.list.find(a => a.id === s.player.actor), O2 = window.__report.view;
          const hall = (() => { const p = O.project(me.x - 1.5, 0, me.z), q = O.pixels(Math.round(p.x), Math.round(p.y), Math.round(p.x) + 1, Math.round(p.y) + 1).picture[0][0]; return q; })();
          return { rooms: window.__readRooms(rooms, unk), hall, known: O2.fog?.known ?? null };
        }, { rooms, unk: UNKNOWN_C });
        const goCost = await cost(page);
        rows.push(`at GO, paused, the unknown's term on: ${costLine(goCost)}`);
        rows.push(`at GO: ${go.rooms.map(r => `${r.room} ${r.black}/${r.n} black`).join(', ')}; the hall's floor 1.5 m west of you ${fmt(go.hall)}; the known cells ${fmt(go.known)}`);
        fs.mkdirSync(SHOTS, { recursive: true });
        await page.screenshot({ path: path.join(SHOTS, 'drawn-go.png') });
        assert(go.rooms.every(r => r.n > 0 && r.black === r.n) && go.hall.some(v => v !== 0) && go.known?.cells > 0, fmt(go));
        // (played on by the honest tier one, a tick a frame, to room 1 entered and 3 s more; the known sends and the frame's GL bytes)
        const run = await page.evaluate(async ({ rooms, unk }) => {
          const O = window.__olympus, { houseHonestBot } = await import('/tests/bots/house.mjs'), bot = houseHonestBot(), mem = {};
          const s0 = O.state, go = s0.armoury.range.house.goAtMs, out = { frames: 0, sends: 0, maxSendFrameKB: 0, maxSendKB: 0, maxOtherFrameKB: 0, enteredAt: null };
          O.pause(true);
          await new Promise((done) => {
            const tick = () => {
              const s = O.state, me = s.actors.list.find(a => a.id === s.player.actor), L = s.armoury.range.house.rooms[0];
              if (s.armoury.range.end || s.clock.ms - go > 90_000 || (out.enteredAt !== null && s.clock.ms - out.enteredAt > 3000)) return done();
              if (L.state === 'entered' || L.state === 'clear') out.enteredAt ??= s.clock.ms;
              if (s.skip?.engine === 'ff') { O.step(1); O.sim.ffCheck(s); } else O.step(1, bot(s, me, mem));
              requestAnimationFrame(() => {
                out.frames++;
                const k = window.__report.view.fog?.known, bytes = window.__report?.gl?.last?.bytes ?? 0;
                if (O.state.clock.ms - go > 1000) {
                  if (k?.sent) { out.sends++; out.maxSendKB = Math.max(out.maxSendKB, k.sent / 1024); out.maxSendFrameKB = Math.max(out.maxSendFrameKB, bytes / 1024); }
                  else out.maxOtherFrameKB = Math.max(out.maxOtherFrameKB, bytes / 1024);
                }
                tick();
              });
            };
            tick();
          });
          return { ...out, rooms: window.__readRooms(rooms, unk), t: O.state.clock.ms - go, known: window.__report.view.fog?.known ?? null };
        }, { rooms, unk: UNKNOWN_C });
        await page.screenshot({ path: path.join(SHOTS, 'drawn-room1.png') });
        rows.push(`played on to GO + ${(run.t / 1000).toFixed(1)} s (room 1 entered at ${run.enteredAt !== null ? 'its tick' : 'NEVER'}), ${run.frames} frames: ${run.rooms.map(r => `${r.room} ${r.black}/${r.n} black`).join(', ')}; the known cells ${fmt(run.known)}; ${run.sends} sends after GO + 1 s, at most ${run.maxSendKB.toFixed(1)} KB each (UPLOAD_MID_KB ${UPLOAD_MID_KB}); the GL bytes of their frames at most ${run.maxSendFrameKB.toFixed(1)} KB, of the frames without one ${run.maxOtherFrameKB.toFixed(1)} KB (the fog's eased mask, 48 KB, and the figures' bands: the upload queue's bound is UPLOAD_MID_KB's, not GL's)`);
        const [r1, r2, r3] = run.rooms;
        assert(run.enteredAt !== null && r1.black < r1.n * 0.2 && r2.black === r2.n && r3.black === r3.n, fmt(run.rooms));
        assert(run.sends > 0 && run.maxSendKB <= UPLOAD_MID_KB && run.maxSendKB < 4, fmt(run));
        // (a load at room 2's stack: room 1 cleared before it, drawn whole from the load's first frame)
        await game.open(DRAWN.replace('setup=go', 'setup=room:2'));
        await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
        await frames(page, 20);
        await page.evaluate(`window.__readRooms = ${readRooms.toString()}`);
        const st = await page.evaluate(({ rooms, unk }) => ({ rooms: window.__readRooms(rooms, unk), legs: window.__olympus.state.armoury.range.house.rooms.map(L => L.state) }), { rooms, unk: UNKNOWN_C });
        await page.screenshot({ path: path.join(SHOTS, 'drawn-room2-setup.png') });
        rows.push(`setup=room:2 (legs ${st.legs.join(', ')}): ${st.rooms.map(r => `${r.room} ${r.black}/${r.n} black`).join(', ')}`);
        for (const x of rows) console.log(`      ${x}`);
        assert(st.rooms[0].black === 0 && st.rooms[2].black === st.rooms[2].n, fmt(st));
        assert(!errors.length, errors.join(' | '));
      }, { port: PORT, query: DRAWN, viewport: { width: 1280, height: 720 }, timeoutMs: 60000 });
    },
  },
  {
    name: 'a familiar place draws as v0.0.22 did: the set house at GO (tier one, 48213) is its picture to the byte (the stage-0 tree\'s digest), no known cells made',
    heavy: true,
    timeoutMs: 180_000,
    async fn() {
      await withGame(async (page, errors) => {
        await page.waitForFunction(() => window.__ready && window.__olympus.state.stop?.phase === 'choose', null, { timeout: 60000 });
        await frames(page, 40);
        const d = await page.evaluate(() => {
          const O = window.__olympus, px = O.pixels(0, 0, 4000, 4000);
          let h = 2166136261 >>> 0;
          for (const row of px.picture) for (const c of row) for (const v of c) { h ^= v; h = Math.imul(h, 16777619) >>> 0; }
          return { digest: h.toString(16), size: [px.w, px.h], known: window.__report.view.fog?.known ?? null };
        });
        const c = await cost(page);
        console.log(`      the set house at GO: ${d.size.join(' × ')}, digest ${d.digest} (the stage-0 tree's ${SET_GO_DIGEST}); known cells ${fmt(d.known)}`);
        console.log(`      its frames, paused, the unknown's term off: ${costLine(c)}`);
        assert(d.digest === SET_GO_DIGEST && d.known === null, fmt(d));
        assert(!errors.length, errors.join(' | '));
      }, { port: PORT, query: SET, viewport: { width: 1280, height: 720 }, timeoutMs: 60000 });
    },
  },
  {
    name: 'F87 in the page: on the live lane 48213 at GO the stage draws neither role-player (the figures, people.hidden 2, no person\'s part where they stand); a save as room 2 is entered, loaded, draws 2a and not 3a',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      // (the save, in node: the tier one's lane to room 2's entry)
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', opfor: 'live' });
      let json = null;
      runHouse(g, houseHonestBot(), { maxTicks: 4000, each: (gg) => { if (!json && gg.state.armoury.range.house.rooms[1].state === 'entered') json = gg.save(); } });
      assert(json, 'room 2 entered');
      await withGame(async (page, errors) => {
        await page.waitForFunction(() => window.__ready && window.__olympus.state.stop?.phase === 'choose', null, { timeout: 60000 });
        await frames(page, 30);
        const read = () => page.evaluate(() => {
          const O = window.__olympus, s = O.state, men = s.armoury.range.turners.filter(T => T.live), figs = window.__report.view.figures ?? [];
          const people = (id) => (id & 0xffff) === 0xa5a5 && (id >> 16) >= 0xa5 && (id >> 16) < 0xa5 + 7;
          return {
            hidden: window.__report.view.people?.hidden ?? null, drawn: figs.length,
            men: men.map(T => {
              const a = s.actors.list.find(x => x.who === T.live.who), p = O.project(a.x, 0.9, a.z), x = Math.round(p.x), y = Math.round(p.y);
              const ids = O.pixels(x - 3, y - 3, x + 4, y + 4).ids.flat();
              return { stand: T.stand, drawn: figs.some(f => f.id === a.id), personPx: ids.filter(people).length, at: [a.x, a.z], px: [x, y] };
            }),
          };
        });
        const atGo = await read();
        await page.screenshot({ path: path.join(SHOTS, 'live-go.png') });
        await page.evaluate((j) => { window.__olympus.load(j); window.__olympus.pause(true); }, json);
        await frames(page, 30);
        const loaded = await read();
        await page.screenshot({ path: path.join(SHOTS, 'live-room2-load.png') });
        console.log(`      at GO: hidden ${atGo.hidden}, ${atGo.drawn} figures drawn; ${atGo.men.map(m => `${m.stand} ${m.drawn ? 'DRAWN' : 'not drawn'}, ${m.personPx} person pixels at his place`).join('; ')}`);
        console.log(`      the save at room 2's entry, loaded: hidden ${loaded.hidden}; ${loaded.men.map(m => `${m.stand} ${m.drawn ? 'drawn' : 'not drawn'}, ${m.personPx} person pixels`).join('; ')}`);
        assert(atGo.hidden === 2 && atGo.men.every(m => !m.drawn && m.personPx === 0), fmt(atGo));
        const m2 = loaded.men.find(m => m.stand === '2a'), m3 = loaded.men.find(m => m.stand === '3a');
        assert(m2.drawn && !m3.drawn && loaded.hidden === 1, fmt(loaded));
        assert(!errors.length, errors.join(' | '));
      }, { port: PORT, query: LIVE, viewport: { width: 1280, height: 720 }, timeoutMs: 60000 });
    },
  },
];
