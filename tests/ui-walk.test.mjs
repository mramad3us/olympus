// OLYMPUS tests: the walk as the page draws it in the shoot house (the rework's stage R8; VIEWS §3.10.9's acceptance). Heavy, a browser file.
//
// The user, scoring v0.0.12 (2026-11-11): "saying that the walking about is goofy is an understatement, the animation is really
// not there yet." In the page at 16 px/m (1280 × 720), the tier one's lane on 48213 run by T a tick a frame from GO, and for
// every frame you and your #2 as the figures drew you (view.stats.figures: the frame drawn, the gait's facts):
//   - every mover: a cycle's or a beat's frame on every moving tick (never the idle), the stance sheet's own frame drawn and
//     never its stand-in after GO (VIEWS §3.10.9 items 4 and 7: nothing undrawn);
//   - the muzzle drawn is the muzzle held: walking, the drawn carry is the sim's posture (aimed walks shouldered, v0.0.12 drew
//     333 aimed ticks of a lane at the low ready), item 5;
//   - no facing change within 250 ms of the last unless the body's yaw moved over 100° (item 4: v0.0.12 changed your facing 28
//     times a lane, 8 within 250 ms);
//   - the plant lock: side on, the card within 0.13 m (2 px) of the sim's place, the lag printed;
//   - the cadence: steps a second in each band, Careful's under Fast's (item 6);
//   - the beats seen (start, plant, the stack, the door, the side-step, the shot on the move), the frames times printed, and a
//     frame strip of your walk and a shot of the stack saved for a look (.run/rework2/r8/shots/).
// The `&cycle=A` and `&cycle=C` flags draw the other candidates (VIEWS §3.10.4), each the same machinery: a shorter lane each.
import { assert, fmt, root } from './helpers.mjs';
import { withGame, BROWSER_TEST_PORT } from './browser.mjs';
import fs from 'node:fs';
import path from 'node:path';

const QUERY = 'play=test-shoothouse&setup=go&tier=tierone&seed=48213&nostore=1';
const SHOTS = path.join(root, '.run', 'rework2', 'r8', 'shots');

// (the lane in the page by T, a tick a frame, the figures' facts collected each frame; strip: frames to crop the walk at)
async function laneInPage(page, { frames = 900 } = {}) {
  return page.evaluate(async ({ frames, strip }) => {
    const O = window.__olympus, bot = (await import('/tests/bots/house.mjs')).houseTBot();
    O.pause(true);
    const out = { frames: 0, remembered: 0, err: null, moving: { me: 0, two: 0 }, idleMoving: [], standIn: 0, standInAt: [], deferred: 0, carryBad: [], carryOk: 0,
      faceChanges: 0, quick: [], lagSide: [], beats: {}, bands: {}, frames2: {}, cadence: {}, dts: [],
      starts: { n: 0, drawn: 0, other: 0, missed: [] }, stops: { n: 0, drawn: 0, other: 0, missed: [] } };
    const last = {};
    let t = performance.now();
    const t0 = t;
    const POSTURE = { aimed: 'aim', lowReady: 'low', highReady: 'high' };
    await new Promise(res => {
      // (the picture drawn in a frame is the state stepped before it: the figures read now are compared with that tick's snapshot)
      let prev = null;
      const snap = (s, a) => (a ? { id: a.id, x: a.x, z: a.z, moved: Math.hypot(a.x - (a.$px ?? a.x), a.z - (a.$pz ?? a.z)) > 1e-6, vMs: Math.hypot(a.x - (a.$px ?? a.x), a.z - (a.$pz ?? a.z)) / 0.05, posture: s.people?.[a.who]?.kit?.carry?.posture ?? null, yaw: a.bodyRad ?? 0, gp: a.gp ?? 0 } : null);
      const tick = () => {
        const s = O.state, me = s.actors.list.find(a => a.id === s.player.actor), H = s.armoury.range.house;
        const figs = window.__report?.view?.figures ?? [], v = window.__report?.view ?? {};
        // (a frame whose step lived no tick (time standing still in stop motion: the choice's pause) moved nobody: nothing to read
        // of a start or a stop there (the rework's R9, 2026-11-13: under a loaded machine the page stepped once inside the pause after
        // a shot on the move, and the body read 2.03, 0.00, 2.03 m/s, a "stop" that never braked))
        if (prev?.held) { out.held = (out.held ?? 0) + 1; }
        else if (prev) {
          out.frames++;
          if (v.deferred > 0) out.deferred++;
          for (const [who, A] of Object.entries(prev.who)) {
            if (!A) continue;
            const f = figs.find(x => x.id === A.id);
            // (a figure out of your sight is drawn as last seen, src/render/memory.js: not this tick's)
            if (!f) continue;
            if (f.remembered) { out.remembered++; continue; }
            const L = (last[who] ??= { face: f.face, faceMs: prev.ms, yaw: A.yaw, gp: A.gp, band: null });
            if (f.face !== L.face) {
              out.faceChanges++;
              const dYaw = Math.abs((A.yaw - L.yaw + 3 * Math.PI) % (2 * Math.PI) - Math.PI) * 180 / Math.PI;
              if (prev.ms - L.faceMs < 250 && dYaw <= 100) out.quick.push({ who, ms: prev.ms, from: L.face, to: f.face, dYaw: Math.round(dYaw) });
              L.face = f.face; L.faceMs = prev.ms; L.yaw = A.yaw;
            }
            if (f.gv?.beat) out.beats[f.gv.beat] = (out.beats[f.gv.beat] ?? 0) + 1;
            // (every start and every stop (VIEWS §3.10.9 item 2): a move from a standstill opens on `start`; a stop from 0.8 m/s or more
            // shows `plant` in its braking or just after, unless another beat of the sim's (the door, the kick, the tap, a step's frame) holds
            // the body then; in a stance band, the sheet's)
            const OTHER = /^(door|kick|tap|pistol|kneel|fireMove|side|pivot)$/;
            L.recent = [...(L.recent ?? []).slice(-7), { beat: f.gv?.beat ?? null, vMs: A.vMs, band: f.gv?.band ?? null }];
            if (A.moved && !L.wasMoving && f.gv?.band && f.gv.band !== 'run' && f.gv.band !== 'walk') {
              out.starts.n++;
              if (f.gv.beat === 'start') out.starts.drawn++; else if (OTHER.test(f.gv.beat ?? '')) out.starts.other++; else if (out.starts.missed.length < 6) out.starts.missed.push({ who, ms: prev.ms, drawn: f.drawn, beat: f.gv.beat });
            }
            if (!A.moved && L.wasMoving) {
              const peak = Math.max(...L.recent.slice(0, -1).map(r => r.vMs)), band = L.recent.findLast(r => r.band)?.band;
              if (peak >= 0.8 && (band === 'combat' || band === 'assault')) L.stopOpen = { ms: prev.ms, n: 0, seen: L.recent.some(r => r.beat === 'plant'), other: false };
            }
            if (L.stopOpen) {
              const S = L.stopOpen;
              if (f.gv?.beat === 'plant') S.seen = true; else if (OTHER.test(f.gv?.beat ?? '')) S.other = true;
              if (++S.n >= 3 || A.moved) {
                out.stops.n++;
                if (S.seen) out.stops.drawn++; else if (S.other) out.stops.other++; else if (out.stops.missed.length < 6) out.stops.missed.push({ who, ms: S.ms, recent: L.recent.map(r => `${r.beat ?? '-'}@${r.vMs.toFixed(2)}`).join(' ') });
                L.stopOpen = null;
              }
            }
            L.wasMoving = A.moved;
            if (A.moved) {
              out.moving[who]++;
              if (/^idle/.test(f.drawn ?? '')) out.idleMoving.push({ who, ms: prev.ms, frame: f.frame, drawn: f.drawn });
              if (f.drawn !== f.frame && f.frame) { out.standIn++; if (out.standInAt.length < 6) out.standInAt.push({ who, ms: prev.ms, frame: f.frame, drawn: f.drawn }); }
              const key = `${who} ${f.gv?.band ?? '-'} ${f.gv?.carry ?? '-'}`;
              out.bands[key] = (out.bands[key] ?? 0) + 1;
              const name = (f.drawn ?? '').replace(/\d+$/, '');
              out.frames2[name] = (out.frames2[name] ?? 0) + 1;
              // (the carry drawn: a stance frame's sheet holds the sim's posture)
              const want = POSTURE[A.posture];
              if (want && f.gv && /^(glide|assault|flight|side|start|plant|fireMove)/.test(f.drawn ?? '')) {
                if (f.gv.carry === want) out.carryOk++; else if (out.carryBad.length < 10) out.carryBad.push({ who, ms: prev.ms, drawn: f.drawn, carry: f.gv.carry, posture: A.posture });
              }
              if (f.gv && (f.face === 'right' || f.face === 'left') && f.gv.kind !== 'side' && !f.gv.lift && /^(glide|assault|walk|run)/.test(f.drawn ?? '')) out.lagSide.push(f.gv.offM);
              // (the cadence: the gait phase's steps a second of game time while walking in a band's cycle)
              if (f.gv?.band && f.gv.beat === null) {
                const c = (out.cadence[f.gv.band] ??= { steps: 0, ms: 0 });
                const dgp = ((A.gp - L.gp) % 2 + 2) % 2;
                if (L.band === f.gv.band && dgp < 0.9) { c.steps += dgp; c.ms += 50; }
              }
              L.band = f.gv?.band ?? null;
            } else L.band = null;
            L.gp = A.gp;
          }
        }
        const ms0 = s.clock.ms;
        if (s.skip?.engine === 'ff') O.sim.ffTick(s); else O.step(1, bot(s, me, (me.bot ??= {})));
        const now = performance.now(); out.dts.push(now - t); t = now;
        const two = s.actors.list.find(a => a.who === H?.twoPid);
        prev = { ms: s.clock.ms, held: s.clock.ms === ms0, who: { me: snap(s, me), two: snap(s, two) } };
        if (out.frames < frames && !O.scene?.ended && performance.now() - t0 < 200_000) requestAnimationFrame(f); else res();
      };
      const f = () => { try { tick(); } catch (e) { out.err = String(e?.stack ?? e); res(); } };
      requestAnimationFrame(f);
    });
    O.pause(false);
    const d = out.dts.slice(5).sort((a, b) => a - b);
    out.median = d[Math.floor(d.length / 2)]; out.p95 = d[Math.floor(d.length * 0.95)]; delete out.dts;
    const lag = out.lagSide.sort((a, b) => a - b);
    out.lag = { n: lag.length, median: lag[Math.floor(lag.length / 2)] ?? 0, max: lag.at(-1) ?? 0 }; delete out.lagSide;
    return out;
  }, { frames });
}

export default [
  {
    name: 'the walk in the shoot house (VIEWS §3.10.9, the rework\'s R8): the tier one\'s lane by T, a tick a frame: every moving tick of you and your #2 drawn in a cycle\'s or a beat\'s frame from the stance sheet itself (never the idle, never a stand-in), the carry drawn the sim\'s posture, no facing dither within 250 ms, the card within 2 px of the sim side on (the plant lock\'s offset); the cadence and the beats printed',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      await withGame(async (page) => {
        await page.waitForFunction(() => window.__ready && window.__olympus.state.stop?.phase === 'choose', null, { timeout: 60000 });
        const r = await laneInPage(page, { frames: 900 });
        const cad = Object.entries(r.cadence).map(([b, c]) => `${b} ${fmt(c.ms ? c.steps / (c.ms / 1000) : 0, 2)} steps/s over ${fmt(c.ms / 1000, 1)} s`).join(', ');
        console.log(`      ${r.frames} frames (a figure drawn as last seen, out of your sight, ${r.remembered} times: not counted); moving ticks: you ${r.moving.me}, your #2 ${r.moving.two}; drawn idle while moving ${r.idleMoving.length}${r.idleMoving.length ? ` (${JSON.stringify(r.idleMoving.slice(0, 3))})` : ''}; a stand-in for a stance frame ${r.standIn}${r.standIn ? ` ${JSON.stringify(r.standInAt)}` : ''}; frames with a figure deferred ${r.deferred}`);
        console.log(`      the carry drawn the posture held: ${r.carryOk} ticks right, ${r.carryBad.length} wrong${r.carryBad.length ? ` ${JSON.stringify(r.carryBad.slice(0, 4))}` : ''}`);
        console.log(`      facing changes ${r.faceChanges}, within 250 ms of the last with the yaw under 100° ${r.quick.length}${r.quick.length ? ` ${JSON.stringify(r.quick.slice(0, 4))}` : ''}; side on, the plant lock\'s offset from the sim\'s place: median ${fmt(r.lag.median * 16, 2)} px, max ${fmt(r.lag.max * 16, 2)} px over ${r.lag.n} ticks`);
        console.log(`      bands walked (who, band, carry: ticks): ${Object.entries(r.bands).map(([k, n]) => `${k} ${n}`).join(', ')}`);
        console.log(`      frames drawn moving: ${Object.entries(r.frames2).map(([k, n]) => `${k} ${n}`).join(', ')}; beats seen (frames): ${Object.entries(r.beats).map(([k, n]) => `${k} ${n}`).join(', ')}`);
        console.log(`      cadence: ${cad}; frames median ${fmt(r.median, 1)} ms, p95 ${fmt(r.p95, 1)} ms; frames that lived no tick ${r.held ?? 0}`);
        console.log(`      starts from a standstill in a stance band ${r.starts.n}: on 'start' ${r.starts.drawn}, held by another beat ${r.starts.other}, missed ${r.starts.missed.length}${r.starts.missed.length ? ` ${JSON.stringify(r.starts.missed)}` : ''}; stops from 0.8 m/s or more ${r.stops.n}: 'plant' drawn ${r.stops.drawn}, held by another beat ${r.stops.other}, missed ${r.stops.missed.length}${r.stops.missed.length ? ` ${JSON.stringify(r.stops.missed)}` : ''}`);
        assert(!r.err, r.err);
        assert(r.frames >= 600 && r.moving.me > 100 && r.moving.two > 100, JSON.stringify(r.moving));
        assert(!r.idleMoving.length && !r.standIn && !r.deferred, JSON.stringify({ idle: r.idleMoving.slice(0, 3), standIn: r.standInAt, deferred: r.deferred }));
        assert(!r.carryBad.length && r.carryOk > 100, JSON.stringify(r.carryBad));
        assert(!r.quick.length, JSON.stringify(r.quick));
        assert(r.lag.max * 16 <= 2.01, JSON.stringify(r.lag));
        const c = r.cadence, sps = (b) => (c[b]?.ms ? c[b].steps / (c[b].ms / 1000) : null);
        if (sps('combat') !== null && sps('assault') !== null) assert(sps('combat') < sps('assault'), `Careful's cadence under Fast's: ${cad}`);
        // (the tier one flows from the stack to the door without standing (COMBAT §25.19.3): the stack and the door are the slower sheets', tests/walk-cycle's)
        assert(r.starts.n > 0 && !r.starts.missed.length && r.stops.n > 0 && !r.stops.missed.length, JSON.stringify({ starts: r.starts, stops: r.stops }));
        assert(r.beats.start > 0 && r.beats.plant > 0 && r.beats.side > 0 && r.beats.tap > 0, JSON.stringify(r.beats));
      }, { port: BROWSER_TEST_PORT, query: QUERY, viewport: { width: 1280, height: 720 }, timeoutMs: 60000 });
    },
  },
  {
    name: 'a frame strip and the stack for a look (VIEWS §3.10, the rework\'s R8): your walk from GO cropped every 2 ticks for 24 frames, side on to the stack, and you and your #2 at the stack, in B and in the flags\' A and C; each candidate draws with no stand-in',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      fs.mkdirSync(SHOTS, { recursive: true });
      const rows = [];
      for (const cyc of ['B', 'A', 'C']) {
        await withGame(async (page) => {
          await page.waitForFunction(() => window.__ready && window.__olympus.state.stop?.phase === 'choose', null, { timeout: 60000 });
          // (the strip: one tick a frame, a screenshot cropped round you every second frame while you walk to the stack)
          const crops = [];
          await page.evaluate(() => window.__olympus.pause(true));
          const bot = await page.evaluateHandle(async () => (await import('/tests/bots/house.mjs')).houseTBot());
          let walked = 0, n = 0;
          while (crops.length < 24 && n < 400) {
            n++;
            const at = await page.evaluate(async (b) => {
              const O = window.__olympus, s = O.state, me = s.actors.list.find(a => a.id === s.player.actor);
              O.step(1, b(s, me, (me.bot ??= {})));
              await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
              const f = (window.__report?.view?.figures ?? []).find(x => x.id === me.id), p = O.project(f?.x ?? me.x, 0, f?.z ?? me.z);
              return { moved: Math.hypot(me.x - (me.$px ?? me.x), me.z - (me.$pz ?? me.z)) > 1e-6, p, frame: f?.drawn ?? null, face: f?.face ?? null, standIn: !!f && f.frame !== f.drawn && !!f.frame };
            }, bot);
            if (!at.moved) continue;
            walked++;
            if (walked % 2) continue;
            const file = path.join(SHOTS, `strip-${cyc}-${String(crops.length).padStart(2, '0')}.png`);
            await page.screenshot({ path: file, clip: { x: Math.max(0, at.p.x * 2 - 64), y: Math.max(0, at.p.y * 2 - 92), width: 128, height: 112 } });
            crops.push(at);
          }
          await page.evaluate(() => window.__olympus.pause(false));
          await page.screenshot({ path: path.join(SHOTS, `stack-${cyc}.png`) });
          rows.push(`${cyc}: ${crops.length} crops, frames ${crops.map(c => `${c.frame}/${c.face?.[0]}`).join(' ')}; stand-ins ${crops.filter(c => c.standIn).length}`);
          assert(crops.length >= 12 && !crops.some(c => c.standIn), JSON.stringify(crops.slice(0, 4)));
        }, { port: BROWSER_TEST_PORT, query: `${QUERY}${cyc === 'B' ? '' : `&cycle=${cyc}`}`, viewport: { width: 1280, height: 720 }, timeoutMs: 60000 });
      }
      console.log(`      ${rows.join('\n      ')}\n      shots in ${path.relative(root, SHOTS)}`);
    },
  },
];
