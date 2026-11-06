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
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { assert, fmt, root } from './helpers.mjs';
import { withGame, frameMs } from './browser.mjs';
import { createGame } from './game.mjs';
import { runBot } from './bots/lib.mjs';
import { WALK_START, walkBot } from './walk-moment2.mjs';

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
];
