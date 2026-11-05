// The game in a real browser (heavy: a server and headless Chrome, through tests/browser.mjs on the
// browser tests' port, 8223 or OLYMPUS_TEST_PORT's, so its saves never touch the player's). It boots from the title with no
// error and puts its handle on window (window.__olympus: DESIGN.md, Stack, "Debug handle"); and a
// game saved, run on, loaded and run on again with the same inputs comes out byte for byte the
// same, in the real browser build (tradecraft's determinism check, ported as it is).
//
// Both start from the title page, the user's first sight, and wait for the handle rather than for
// window.__ready: the title need not draw the stage. A career is begun through the handle's
// newGame, not a URL scenario, so the test doesn't hang on a scenario's name.
import { assert, fmt } from './helpers.mjs';
import { withGame, frameMs } from './browser.mjs';

const HANDLE = "typeof window.__olympus === 'object' && window.__olympus !== null";
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
];
