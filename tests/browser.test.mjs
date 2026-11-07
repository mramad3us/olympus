// The game in a real browser (heavy: a server and headless Chrome, through tests/browser.mjs on the
// browser tests' port, 8223 or OLYMPUS_TEST_PORT's, so its saves never touch the player's). It boots from the title with no
// error and puts its handle on window (window.__olympus: DESIGN.md, Stack, "Debug handle"); and a
// game saved, run on, loaded and run on again with the same inputs comes out byte for byte the
// same, in the real browser build (tradecraft's determinism check, ported as it is).
//
// Both start from the title page, the user's first sight, and wait for the handle rather than for
// window.__ready: the title need not draw the stage. A career is begun through the handle's
// newGame, not a URL scenario, so the test doesn't hang on a scenario's name.
//
// (0.0.3) The user's walk in the page: tests/walk-moment2.mjs's bot imported into the page (the
// server serves the tree, so the page's modules are the game's own) and driven through the handle
// on a career made by its newGame at the barracks' 23:00, seed 48213 (behind ?play=barracks&hour=23&
// seed=48213), the bay at 23:00 to the north fence and back, saved at
// ticks along it; each save started again through the handle (main.js's launch: the cut, the view
// set on the save's area) and the walk carried on to the end. Every one ends with the straight run's
// digest, and that digest is node's for the same seed, hour and version (tests/game.mjs): the page
// and a node replay are one game.
//
// (0.0.4) A real v0.0.3 save (tests/saves/, made by v0.0.3's own code inside R's wait: game-upgrade's)
// started in the page: its splash picks up from the save's clock and plays out on real frames, with
// no error, the body filled in; and a save made in the middle of a splash (a 45-minute nap at the
// rack's foot, saved while the time-lapse runs), started again, carries on byte for byte with the
// game that went on from it.
//
// (0.0.5) test-handling in the page, driven by tests/bots/range.mjs through the handle from the brief to
// "The line is clear.": saves made in stop motion (while choosing, mid-step in a Corps command, at the
// reflex card the set stoppage brings, in a chained wait), each started again and played on to the end,
// end on the straight run's digest, and that digest is node's for the same seed and version.
//
// (0.0.7) test-range in the page, driven by tests/bots/kd.mjs through the handle from the brief to the card: each splash
// (the walk, the pits) moved to its middle and then finished, as the page's splash would; saves made in stop motion at
// the zero, mid-step, in the middle of the walk's splash, while the pits mark the confirm and in the 200 m string, each
// started again and played on to the end, end on the straight run's digest, and that digest is node's.
//
// (0.0.8) test-pairs in the page, the private and the tier one on seed 48213, driven by tests/bots/pairs.mjs through the
// handle from the brief to the card: saves made in the middle of a take-in (the window open, every key refused), at a
// contact's pause in stop motion, in the middle of a shot row between its rounds, during the dry RELOAD and in a Top up
// between strings, each started again and played on to the end, end on the straight run's digest, and that digest is node's.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { assert, fmt, root } from './helpers.mjs';
import { withGame, frameMs } from './browser.mjs';
import { createGame } from './game.mjs';
import { runBot } from './bots/lib.mjs';
import { WALK_START, walkBot } from './walk-moment2.mjs';
import { rangeBot } from './bots/range.mjs';
import { kdBot } from './bots/kd.mjs';
import { kdNow } from '../src/sim/scenarios/range.js';
import { pairsBot } from './bots/pairs.mjs';
import { pairsNow } from '../src/sim/scenarios/pairs.js';

/** Where the page's walk is saved: a tick in each part of it (game-walk's quick ticks, a few). */
const PAGE_SAVES = Object.freeze([57, 290, 1007, 1009, 2300, 2379, 14916, 20140]);

const HANDLE = "typeof window.__olympus === 'object' && window.__olympus !== null";
const V003_MIDWAIT = () => gunzipSync(readFileSync(`${root}/tests/saves/v0.0.3-barracks-midwait.json.gz`)).toString('utf8');
const SETTLE_MS = 1000;            // (time for a late error at start to show before we read the page)

export default [
  {
    name: 'the game boots from the title with no errors, and window.__olympus answers',
    heavy: true,
    async fn() {
      await withGame(async (page) => {
        await page.waitForTimeout(SETTLE_MS);
        const seen = await page.evaluate(async () => {
          const h = window.__olympus, s = h.state;
          return {
            keys: Object.keys(h).sort(),
            methods: ['step', 'start', 'newGame', 'save', 'skip', 'pause'].filter(k => typeof h[k] === 'function'),
            version: h.version ?? null,
            file: (await (await fetch('VERSION')).text()).trim(),
            state: s && typeof s === 'object' ? Object.keys(s).slice(0, 16) : null,
            ready: window.__ready === true,
            renderer: window.__renderer || '',
            title: document.title,
          };
        });
        const frames = await frameMs(page, 60);
        console.log(`      "${seen.title}" v${seen.version} (VERSION ${seen.file}); __ready ${seen.ready}; ${seen.renderer || 'no renderer reported'}`);
        console.log(`      __olympus: ${seen.keys.join(', ')}`);
        console.log(`      state: ${seen.state ? seen.state.join(', ') : 'none yet (the title)'}; frames ${fmt(frames.medianMs)} ms median, ${fmt(frames.p95Ms)} ms p95`);
        assert(seen.methods.length === 6, `the handle lacks ${['step', 'start', 'newGame', 'save', 'skip', 'pause'].filter(k => !seen.methods.includes(k)).join(', ')}`);
        assert(seen.version === seen.file, `the game says v${seen.version}, VERSION says ${seen.file}`);
      }, { ready: HANDLE });
    },
  },
  {
    name: 'a game saved, run 400 ticks, loaded and run the same 400 again is the same game byte for byte',
    heavy: true,
    async fn() {
      await withGame(async (page) => {
        const r = await page.evaluate(async () => {
          const h = window.__olympus;
          await h.newGame({ seed: 4 });
          h.pause(true);
          const json = h.save();
          h.step(400, { mx: -1 });
          const a = h.save();
          const started = h.start(json);
          h.pause(true);                                  // (before any await: no frame runs a tick of its own)
          await started;
          h.pause(true);
          h.step(400, { mx: -1 });
          const b = h.save();
          return { same: a === b, moved: a !== json, kb: json.length / 1024, at: a.length / 1024 };
        });
        console.log(`      save ${fmt(r.kb)} KB, ${fmt(r.at)} KB after 400 ticks (20 s of game time); loaded and run again: ${r.same ? 'identical' : 'DIFFERENT'}`);
        assert(r.moved, '400 ticks changed nothing in the save');
        assert(r.same, 'a loaded save carried on differently');
      }, { ready: HANDLE });
    },
  },
  {
    name: 'the user\'s walk in the page (the bay at 23:00 to the north fence and back): a save made anywhere on it, started again, carries on byte for byte, and the page\'s game is node\'s',
    heavy: true,
    timeoutMs: 240_000,
    async fn() {
      const version = readFileSync(`${root}/VERSION`, 'utf8').trim();
      const n = createGame({ ...WALK_START, version }), nr = runBot(n, walkBot(), { maxTicks: 60_000 });
      assert(nr.done, `node's walk did not end: ${nr.reason}`);
      const nodeDigest = n.digest(), nodeTick = n.state.clock.tick;
      await withGame(async (page) => {
        const r = await page.evaluate(async ({ saveAt, maxTicks, start }) => {
          const h = window.__olympus;
          const { walkBot: bot } = await import('/tests/walk-moment2.mjs');
          const { digest } = await import('/src/core/hash.js');
          const { playerActor } = await import('/src/core/ids.js');
          // (a fresh career made while paused, so the walk starts on node's state: the URL's game has lived a few ticks by now)
          h.pause(true);
          const fresh = h.newGame(start);
          h.pause(true);
          await fresh;
          h.pause(true);
          // (tests/game.mjs's step, through the handle: a skip a tick begins is run to its end before the next)
          const finish = () => { for (let k = 0; h.state.skip && h.state.skip.kind !== 'ff' && k < 1e6; k++) if (h.sim.advanceSkip(h.state, Infinity, { over: () => false })?.done) break; };
          const status = () => playerActor(h.state)?.bot?.plan?.status ?? 'running';
          const walk = (b, onTick = () => {}) => {
            let ticks = 0;
            while (status() === 'running' && ticks < maxTicks) {
              finish();
              const s = h.state, me = playerActor(s);
              h.step(1, b(s, me, (me.bot ??= {})));
              finish(); ticks++; onTick(ticks);
            }
            return ticks;
          };
          const t0 = performance.now(), saves = [];
          const ticks = walk(bot(), (t) => { if (saveAt.includes(h.state.clock.tick) && status() === 'running') saves.push({ tick: h.state.clock.tick, area: h.state.places.live.area, json: h.save() }); });
          const A = { digest: digest(h.save()), tick: h.state.clock.tick, area: h.state.places.live.area, status: status(), ms: performance.now() - t0, ticks };
          const back = [];
          for (const sv of saves) {
            const started = h.start(sv.json);
            h.pause(true);                                  // (before any await: no frame runs a tick of its own)
            await started;
            h.pause(true);
            const t1 = performance.now();
            walk(bot());
            back.push({ tick: sv.tick, area: sv.area, kb: sv.json.length / 1024, end: h.state.clock.tick, digest: digest(h.save()), status: status(), ms: performance.now() - t1, view: h.view?.area?.id ?? null });
          }
          return { A, back };
        }, { saveAt: PAGE_SAVES, maxTicks: 60_000, start: { ...WALK_START } });
        console.log(`      node: tick ${nodeTick}, digest ${nodeDigest}; the page straight through: tick ${r.A.tick} in ${r.A.area}, ${r.A.status}, digest ${r.A.digest} (${fmt(r.A.ms, 0)} ms, ${fmt(r.A.ms * 1000 / r.A.ticks, 1)} µs a tick)`);
        for (const b of r.back) console.log(`        saved at tick ${String(b.tick).padStart(5)} in ${b.area} (${fmt(b.kb, 0)} KB), started again: tick ${b.end}, ${b.status}, ${b.digest === r.A.digest ? 'the same digest' : `DIGEST ${b.digest}`} (${fmt(b.ms, 0)} ms)`);
        assert(r.A.status === 'done' && r.A.tick === nodeTick && r.A.digest === nodeDigest, JSON.stringify({ page: r.A, nodeTick, nodeDigest }));
        assert(r.back.length === PAGE_SAVES.length, `${r.back.length} saves of ${PAGE_SAVES.length}`);
        const bad = r.back.filter(b => b.status !== 'done' || b.end !== r.A.tick || b.digest !== r.A.digest);
        assert(!bad.length, JSON.stringify(bad.slice(0, 3)));
      }, { query: 'play=barracks&hour=23&seed=48213&nostore=1', timeoutMs: 60_000 });
    },
  },
  {
    name: 'a v0.0.3 save started in the page plays its splash out with no error, the body filled in; a save made mid-splash, started again, carries on byte for byte',
    heavy: true,
    timeoutMs: 180_000,
    async fn() {
      await withGame(async (page) => {
        const r = await page.evaluate(async ({ old }) => {
          const h = window.__olympus, sleep = (ms) => new Promise(res => setTimeout(res, ms));
          const { handOffer } = await import('/src/sim/places/hand.js');
          const waitFor = async (cond, ms) => { const t0 = performance.now(); while (!cond() && performance.now() - t0 < ms) await sleep(50); return cond(); };
          // (1) the v0.0.3 save, inside its wait: the splash picks up and plays out on real frames
          const t0 = performance.now();
          await h.start(old);
          const atLoad = { skip: !!h.state.skip, mask: h.state.skip?.mask ?? null, v: h.state.people[h.state.player.id].body?.v, splash: h.splash()?.phase ?? null };
          const out = await waitFor(() => !h.state.skip && !h.splash(), 30_000);
          const after = { out, s: (performance.now() - t0) / 1000, clock: h.state.clock.ms, body: !!h.body()?.stages, flags: Object.keys(h.state.flags).filter(k => k.startsWith('mig:')) };
          // (2) a fresh game at the rack's foot at 19:30: R's nap, saved while its time-lapse runs
          await h.newGame({ scenario: 'barracks', seed: 48213, hour: 19.5 });
          await sleep(300);
          const o = handOffer(h.state);
          h.activity(o.id, o.spotId, o.args ?? {});
          await waitFor(() => h.state.skip && h.splash()?.phase === 'lapse' && h.state.clock.ms - h.state.skip.fromMs > 10 * 60_000, 20_000);
          h.pause(true);
          const mid = { phase: h.splash()?.phase, minutes: (h.state.clock.ms - h.state.skip.fromMs) / 60_000, of: (h.state.skip.toMs - h.state.skip.fromMs) / 60_000, json: h.save() };
          const finish = () => { for (let k = 0; h.state.skip && k < 1e6; k++) if (h.sim.advanceSkip(h.state, Infinity, { over: () => false })?.done) break; };
          finish(); h.step(400, { mx: 1 });
          const a = h.save();
          const started = h.start(mid.json);
          h.pause(true);
          await started;
          h.pause(true);
          const resumed = { skip: !!h.state.skip, splash: h.splash()?.phase ?? null };
          finish(); h.step(400, { mx: 1 });
          const b = h.save();
          h.pause(false);
          return { atLoad, after, mid: { phase: mid.phase, minutes: mid.minutes, of: mid.of, kb: mid.json.length / 1024 }, resumed, same: a === b, offer: o.label };
        }, { old: V003_MIDWAIT() });
        console.log(`      the v0.0.3 save inside its wait: skip ${r.atLoad.skip} (mask ${r.atLoad.mask}), the body v ${r.atLoad.v}, the splash ${r.atLoad.splash}; played out in ${fmt(r.after.s, 2)} s, the body read, flags ${r.after.flags.join(', ')}`);
        console.log(`      R at 19:30: "${r.offer}"; saved in the ${r.mid.phase} at minute ${fmt(r.mid.minutes, 1)} of ${fmt(r.mid.of, 0)} (${fmt(r.mid.kb, 0)} KB); started again: skip ${r.resumed.skip}, the splash ${r.resumed.splash}; finished and 400 ticks on: ${r.same ? 'byte for byte' : 'DIFFERENT'}`);
        assert(r.atLoad.skip && r.atLoad.mask === 'D' && r.atLoad.v === 2 && r.after.out && r.after.body, JSON.stringify(r));
        assert(r.mid.phase === 'lapse' && r.resumed.skip && r.same, JSON.stringify(r));
      }, { query: 'play=barracks&hour=19.5&seed=48213&nostore=1', timeoutMs: 60_000 });
    },
  },
  {
    name: 'test-handling in the page, the range bot from the brief to "The line is clear.": saves made in stop motion (choosing, mid-step, at the reflex card, in a chained wait), started again, carry on byte for byte, and the page\'s game is node\'s',
    heavy: true,
    timeoutMs: 240_000,
    async fn() {
      const version = readFileSync(`${root}/VERSION`, 'utf8').trim(), start = { scenario: 'test-handling', seed: 48213 };
      const n = createGame({ ...start, version }), bot = rangeBot();
      for (let t = 0; t < 20_000 && !n.me().bot?.done; t++) n.step(1, bot);
      assert(n.state.armoury.range.end?.phase === 'clear', JSON.stringify(n.state.armoury.range.end));
      const nodeDigest = n.digest(), nodeTick = n.state.clock.tick;
      await withGame(async (page) => {
        const r = await page.evaluate(async ({ start, maxTicks }) => {
          const h = window.__olympus;
          const { rangeBot: mk } = await import('/tests/bots/range.mjs');
          const { digest } = await import('/src/core/hash.js');
          const { playerActor } = await import('/src/core/ids.js');
          // (a fresh game made while paused, so the run starts on node's state: the URL's game has lived a few ticks by now)
          h.pause(true);
          const fresh = h.newGame(start);
          h.pause(true);
          await fresh;
          h.pause(true);
          const done = () => !!playerActor(h.state)?.bot?.done;
          const play = (onTick = () => {}) => { const b = mk(); let t = 0; for (; t < maxTicks && !done(); t++) { const s = h.state, me = playerActor(s); h.step(1, b(s, me, (me.bot ??= {}))); onTick(); } return t; };
          const saves = [], want = new Set(['choosing', 'mid-step', 'reflex', 'chained wait']);
          const ticks = play(() => {
            const S = h.state.stop, R = h.state.armoury.range;
            const at = !S || R?.end ? null : S.reflex ? 'reflex' : S.phase === 'choose' && R.cmd?.id === 'fire' ? 'choosing'
              : S.doing?.kind === 'command' && S.doing.i > 0 ? 'mid-step' : S.doing?.chain ? 'chained wait' : null;
            if (at && want.has(at)) { want.delete(at); saves.push({ at, tick: h.state.clock.tick, held: [...(h.state.clock.holds ?? [])], json: h.save() }); }
          });
          const A = { digest: digest(h.save()), tick: h.state.clock.tick, ticks, end: h.state.armoury.range?.end ?? null };
          const back = [];
          for (const sv of saves) {
            const started = h.start(sv.json);
            h.pause(true);                                  // (before any await: no frame runs a tick of its own)
            await started;
            h.pause(true);
            play();
            back.push({ at: sv.at, tick: sv.tick, held: sv.held, kb: sv.json.length / 1024, end: h.state.clock.tick, digest: digest(h.save()) });
          }
          h.pause(false);
          return { A, back };
        }, { start, maxTicks: 20_000 });
        console.log(`      node: tick ${nodeTick}, digest ${nodeDigest}; the page straight through: tick ${r.A.tick} (${r.A.ticks} ticks), ${JSON.stringify(r.A.end)}, digest ${r.A.digest}`);
        for (const b of r.back) console.log(`        saved ${b.at} at tick ${b.tick} (${fmt(b.kb, 0)} KB, holding ${b.held.join(', ') || 'nothing'}), started again: tick ${b.end}, ${b.digest === r.A.digest ? 'the same digest' : `DIGEST ${b.digest}`}`);
        assert(r.A.end?.phase === 'clear' && r.A.tick === nodeTick && r.A.digest === nodeDigest, JSON.stringify({ page: r.A, nodeTick, nodeDigest }));
        assert(r.back.length === 4, `${r.back.length} saves of 4: ${r.back.map(b => b.at).join(', ')}`);
        const bad = r.back.filter(b => b.end !== r.A.tick || b.digest !== r.A.digest);
        assert(!bad.length, JSON.stringify(bad));
      }, { query: 'play=test-handling&seed=48213&nostore=1', timeoutMs: 60_000 });
    },
  },
  {
    name: 'test-range in the page, the KD bot from the brief to the card: saves made in stop motion at the zero, mid-step, in the middle of the walk\'s splash, while the pits mark the confirm and in the 200 m string, started again, carry on byte for byte, and the page\'s game is node\'s',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      const version = readFileSync(`${root}/VERSION`, 'utf8').trim(), start = { scenario: 'test-range', seed: 48213 };
      // (node: each splash opened, moved to its middle, then finished, as the page's run below does; a fast-forward (the
      // 200 m police, 9 cases at 1.2 s, past LIVE_MAX_MS 10 s) ticked on its own input to its end, as the page's ffFrame
      // does: the loops ticked only outside a skip, so both stood at tick 5244 from v0.0.7 (the tower fixer's, 0.0.7))
      const n = createGame({ ...start, version }), nb = kdBot();
      for (let t = 0; t < 30_000 && !kdNow(n.state)?.end; t++) {
        // (an 'ff' skip (v0.0.7's policing of the brass, run fast) is the loop's ticks with no keys, as the page runs it: the
        // loop before stood still on it, the clock never moving, and never reached the card (the integrator's of v0.0.8))
        if (n.state.skip?.engine === 'ff') { n.step(1); continue; }
        n.tickOpen(nb);
        const sk = n.state.skip;
        if (sk && sk.engine !== 'ff') { n.advance(sk.fromMs + Math.round((sk.toMs - sk.fromMs) / 2 / 50) * 50); for (let k = 0; n.state.skip && k < 1e5; k++) n.advance(); }
      }
      const nodeDigest = n.digest(), nodeTick = n.state.clock.tick;
      await withGame(async (page) => {
        const r = await page.evaluate(async ({ start, maxTicks }) => {
          const h = window.__olympus;
          const { kdBot: mk } = await import('/tests/bots/kd.mjs');
          const { kdNow: K } = await import('/src/sim/scenarios/range.js');
          const { digest } = await import('/src/core/hash.js');
          const { playerActor } = await import('/src/core/ids.js');
          h.pause(true);
          const fresh = h.newGame(start);
          h.pause(true);
          await fresh;
          h.pause(true);
          const done = () => !!K(h.state)?.end;
          const NB = { over: () => false };
          // (a splash: to its middle (onMid there), then to its end)
          const splash = (onMid) => {
            const sk = h.state.skip;
            if (!sk || sk.engine === 'ff') return;
            h.sim.advanceSkip(h.state, sk.fromMs + Math.round((sk.toMs - sk.fromMs) / 2 / 50) * 50, NB);
            onMid?.();
            for (let k = 0; h.state.skip && k < 1e5; k++) if (h.sim.advanceSkip(h.state, Infinity, NB)?.done) break;
          };
          const play = (onTick = () => {}, onMid = null) => { const b = mk(); let t = 0; for (; t < maxTicks && !done(); t++) { const s = h.state, me = playerActor(s); if (!s.skip) h.step(1, b(s, me, (me.bot ??= {}))); else if (s.skip.engine === 'ff') h.sim.ffTick(s); splash(onMid); onTick(); } return t; };
          const saves = [], want = new Set(['choosing at the zero', 'mid-step', 'mid-splash', 'the pits marking', 'the 200 m string']);
          const take = (at) => { if (want.has(at)) { want.delete(at); saves.push({ at, tick: h.state.clock.tick, json: h.save() }); } };
          const ticks = play(() => {
            const S = h.state.stop, k = K(h.state);
            if (!k || k.end) return;
            if (S?.phase === 'choose' && k.stage === 'zero' && k.hot) take('choosing at the zero');
            if (S?.doing?.kind === 'command' && S.doing.i > 0) take('mid-step');
            if (k.line === 300 && ['down', 'spot', 'up'].includes(k.pits?.[k.kdLane]?.phase)) take('the pits marking');
            if (k.line === 200 && k.hot && (k.strings.at(-1)?.holes?.length ?? 0) >= 3) take('the 200 m string');
          }, () => take('mid-splash'));
          const A = { digest: digest(h.save()), tick: h.state.clock.tick, ticks, end: K(h.state)?.end ?? null, summary: K(h.state)?.summary ?? null };
          const back = [];
          for (const sv of saves) {
            const started = h.start(sv.json);
            h.pause(true);
            await started;
            h.pause(true);
            // (a save made mid-splash starts inside it: its second half first)
            if (h.state.skip && h.state.skip.engine !== 'ff') for (let k = 0; h.state.skip && k < 1e5; k++) if (h.sim.advanceSkip(h.state, Infinity, NB)?.done) break;
            play();
            back.push({ at: sv.at, tick: sv.tick, kb: sv.json.length / 1024, end: h.state.clock.tick, digest: digest(h.save()) });
          }
          h.pause(false);
          return { A, back };
        }, { start, maxTicks: 30_000 });
        console.log(`      node: tick ${nodeTick}, digest ${nodeDigest}; the page straight through: tick ${r.A.tick} (${r.A.ticks} ticks), ${r.A.summary}, digest ${r.A.digest}`);
        for (const b of r.back) console.log(`        saved ${b.at} at tick ${b.tick} (${fmt(b.kb, 0)} KB), started again: tick ${b.end}, ${b.digest === r.A.digest ? 'the same digest' : `DIGEST ${b.digest}`}`);
        assert(r.A.end?.phase === 'clear' && r.A.tick === nodeTick && r.A.digest === nodeDigest, JSON.stringify({ page: r.A, nodeTick, nodeDigest }));
        assert(r.back.length === 5, `${r.back.length} saves of 5: ${r.back.map(b => b.at).join(', ')}`);
        const bad = r.back.filter(b => b.end !== r.A.tick || b.digest !== r.A.digest);
        assert(!bad.length, JSON.stringify(bad));
      }, { query: 'play=test-range&seed=48213&nostore=1', timeoutMs: 60_000 });
    },
  },
  {
    name: 'test-pairs in the page, the pairs bot from the brief to the card as the private and the tier one: saves made in the middle of a take-in, at a contact\'s pause, between a shot row\'s rounds, in the dry RELOAD and in a Top up between strings, started again, carry on byte for byte, and the page\'s game is node\'s',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      const version = readFileSync(`${root}/VERSION`, 'utf8').trim();
      for (const tier of ['private', 'tierone']) {
        const start = { scenario: 'test-pairs', seed: 48213, tier };
        const n = createGame({ ...start, version }), nb = pairsBot();
        for (let t = 0; t < 30_000 && !pairsNow(n.state)?.end; t++) n.step(1, nb);
        const nodeDigest = n.digest(), nodeTick = n.state.clock.tick;
        await withGame(async (page) => {
          const r = await page.evaluate(async ({ start, maxTicks }) => {
            const h = window.__olympus;
            const { pairsBot: mk } = await import('/tests/bots/pairs.mjs');
            const { pairsNow: P } = await import('/src/sim/scenarios/pairs.js');
            const { digest } = await import('/src/core/hash.js');
            const { playerActor } = await import('/src/core/ids.js');
            h.pause(true);
            const fresh = h.newGame(start);
            h.pause(true);
            await fresh;
            h.pause(true);
            const done = () => !!P(h.state)?.end;
            const play = (onTick = () => {}) => { const b = mk(); let t = 0; for (; t < maxTicks && !done(); t++) { const s = h.state, me = playerActor(s); if (s.skip?.engine === 'ff') h.sim.ffTick(s); else h.step(1, b(s, me, (me.bot ??= {}))); onTick(); } return t; };
            const saves = [], want = new Set(['mid-take-in', 'at the pause', 'between a row\'s rounds', 'in the dry RELOAD', 'in a Top up between strings']);
            const take = (at) => { if (want.has(at)) { want.delete(at); saves.push({ at, tick: h.state.clock.tick, json: h.save() }); } };
            const ticks = play(() => {
              const s = h.state, S = s.stop, c = s.mind?.contact, p = P(s);
              if (!p || p.end) return;
              if (c?.pending && s.clock.ms >= c.pending.seenMs + 100) take('mid-take-in');
              if (S?.via === 'contact' && S.phase === 'choose' && c?.last?.atMs === s.clock.ms) take('at the pause');
              if (S?.doing?.kind === 'shot' && S.doing.i > 0) take('between a row\'s rounds');
              if (S?.doing?.step === 'macro:reload:speed' && S.doing.i > 0) take('in the dry RELOAD');
              if (S?.doing?.step === 'macro:reload:tactical' && S.doing.i > 0) take('in a Top up between strings');
            });
            const A = { digest: digest(h.save()), tick: h.state.clock.tick, ticks, summary: P(h.state)?.summary ?? null, end: !!P(h.state)?.end };
            const back = [];
            for (const sv of saves) {
              const started = h.start(sv.json);
              h.pause(true);
              await started;
              h.pause(true);
              play();
              back.push({ at: sv.at, tick: sv.tick, kb: sv.json.length / 1024, end: h.state.clock.tick, digest: digest(h.save()) });
            }
            h.pause(false);
            return { A, back };
          }, { start, maxTicks: 30_000 });
          console.log(`      ${tier}: node tick ${nodeTick}, digest ${nodeDigest}; the page straight through: tick ${r.A.tick} (${r.A.ticks} ticks), ${r.A.summary}, digest ${r.A.digest}`);
          for (const b of r.back) console.log(`        saved ${b.at} at tick ${b.tick} (${fmt(b.kb, 0)} KB), started again: tick ${b.end}, ${b.digest === r.A.digest ? 'the same digest' : `DIGEST ${b.digest}`}`);
          assert(r.A.end && r.A.tick === nodeTick && r.A.digest === nodeDigest, JSON.stringify({ tier, page: r.A, nodeTick, nodeDigest }));
          assert(r.back.length === 5, `${tier}: ${r.back.length} saves of 5: ${r.back.map(b => b.at).join(', ')}`);
          const bad = r.back.filter(b => b.end !== r.A.tick || b.digest !== r.A.digest);
          assert(!bad.length, JSON.stringify(bad));
        }, { query: `play=test-pairs&seed=48213&tier=${tier}&nostore=1`, timeoutMs: 60_000 });
      }
    },
  },
];
