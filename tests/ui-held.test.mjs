// OLYMPUS tests: the page quiet in stop motion (the build sheet v0.0.21 §1 item 11, §6 D; the perf lens's P6). Heavy: a browser file.
//
// clock.seq counts every tick, held or not, and the page keyed its once-a-tick reads on it (main.js readSim, houseRead and eight
// more), so while you thought in stop motion the step panel, the belief, the targets and the plaque were rebuilt twenty times a
// second though nothing changed (a held tick runs only the input and offers layers). From v0.0.21 a read is keyed on the input
// sent while the clock is held (main.js readKey, inputSeq), so a pause rebuilds nothing until a key is pressed. The panel's builds
// are counted by core/reads.js BUILT.steps (stage 0's), read through window.__olympus.perf.steps: the private at GO in stop
// motion, 3 s with no key, at most HELD_BUILDS_MAX (60 before: one a tick); one input that moves no clock (the brackets' step, as
// D sends it), one build more.
import { assert } from './helpers.mjs';
import { withGame } from './browser.mjs';

/** Builds of the panel allowed over HELD_S of stop motion with no key (the build sheet §6: at most 2). */
export const HELD_BUILDS_MAX = 2, HELD_S = 3;

export default [
  {
    name: 'in stop motion the page rebuilds nothing while you think: the private at GO, 3 s with no key, at most 2 panel builds (one a tick, 60, on v0.0.20\'s page); one input (the brackets\' step), one or two builds more, the clock still held',
    heavy: true,
    timeoutMs: 240000,
    async fn() {
      await withGame(async (page, errors) => {
        await page.waitForFunction(() => window.__ready && window.__olympus.state?.stop?.mode === 'stop' && !!window.__olympus.perf, null, { timeout: 60000 });
        await page.waitForTimeout(1500);
        const at = () => page.evaluate(() => ({ ...window.__olympus.perf, ms: window.__olympus.state.clock.ms, seq: window.__olympus.state.clock.seq, held: (window.__olympus.state.clock.holds ?? []).join(','), pick: window.__olympus.state.stop?.pick ?? null }));
        const a = await at();
        await page.waitForTimeout(HELD_S * 1000);
        const b = await at();
        // (the brackets' step, as D sends it where there is a man in sight: an input that moves no clock; here nobody is in sight, so it changes nothing but the input sent)
        await page.evaluate(() => window.__olympus.act({ act: 'stop', args: { step: 'pick:+1' } }));
        await page.waitForTimeout(800);
        const c = await at();
        const quiet = b.steps - a.steps, key = c.steps - b.steps, ticks = b.seq - a.seq;
        console.log(`      held ${HELD_S} s with no key: ${ticks} ticks (seq ${a.seq} → ${b.seq}), the clock ${a.ms === b.ms ? 'still' : `moved ${b.ms - a.ms} ms`} (holds ${b.held}); the panel built ${quiet} times (at most ${HELD_BUILDS_MAX}), the run sheet ${b.sheet - a.sheet}; one input (the brackets' step): the input sent ${b.inputSeq} → ${c.inputSeq}, the pick ${b.pick} → ${c.pick}, the panel built ${key} more, the clock ${c.ms === b.ms ? 'still' : `moved ${c.ms - b.ms} ms`}`);
        assert(ticks >= 30 && a.ms === b.ms && b.held, JSON.stringify({ a, b }));
        assert(quiet <= HELD_BUILDS_MAX, JSON.stringify({ quiet, a, b }));
        assert(c.inputSeq > b.inputSeq && key >= 1 && key <= HELD_BUILDS_MAX && c.ms === b.ms, JSON.stringify({ key, b, c }));
        assert(!errors.length, errors.join('\n'));
      }, { query: 'play=test-shoothouse&seed=48213&tier=private&setup=go&nostore=1', timeoutMs: 120000 });
    },
  },
];
