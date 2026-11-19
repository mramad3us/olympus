// OLYMPUS tests: T names the key it will not press (v0.0.23, its build sheet item 12, carried FH-3; COMBAT §25.19.7), heavy: a browser.
//
// Below the corporal the drill instructor's line names the shot and leaves it to you ("You're on him. Press.": cqb-contact's press, its
// row Fire, no act). Before v0.0.23 the NEXT tile said "T: nothing now" beside that line, and a tapped T did nothing a new player could
// see (the first-hour lens: the recruit pressed T eleven times at room 1's contact). Now the NEXT tile names the key the row is on in the
// layout drawn ("6: yours. T never shoots."; steps.js nextWords), and a tapped T with no act pulses that row's tile STEP_PULSE_MS 600 ms
// (main.js instinctPress, steps.js pulse); the sim gets the same input as before ({ act: 'instinct' } with no act), so the clock and the
// tick stand and the save differs only by the press counted, as v0.0.22 counted it (the leg's presses, how.keys and pressAbout.person,
// one each, and the clock's sequence: F13's count), nothing of FH-3's.
// Here the boot recruit on 48213 from room 1's contact (setup=contact), T tapped to off safe and onto him, then at the line that leaves
// the press to you: layouts C and A. Fails without the hunks (NEXT "nothing", no pulse).
import { assert } from './helpers.mjs';
import { withGame } from './browser.mjs';
import { STEP_PULSE_MS } from '../src/ui/hud/steps.js';

export default [
  {
    name: 'at room 1\'s contact after Aim, the boot recruit on 48213: the line leaves the press to you, the NEXT tile reads "6: yours. T never shoots." (the key the Fire row is on, in layout C; its keys in A), a tapped T pulses the Fire tile for STEP_PULSE_MS, the clock and the tick standing and the save moved only by the press counted, as before (v0.0.23, FH-3; before: "T: nothing now" and nothing seen)',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      const port = Number(process.env.OLYMPUS_TEST_PORT) || undefined, rows = [], bad = [];
      await withGame(async (page, errors, game) => {
        await page.setViewportSize({ width: 1600, height: 900 });
        for (const panel of ['c', 'a']) {
          await game.open(`play=test-shoothouse&setup=contact&tier=recruit&seed=48213&nostore=1&panel=${panel}`);
          await page.waitForFunction(() => window.__ready && window.__olympus.stop()?.phase === 'choose' && !!window.__olympus.panel()?.where, null, { timeout: 60000 });
          await page.waitForTimeout(500);
          // (T tapped while the line has an act: off safe, then onto him; each to the next choice)
          const lineOf = () => page.evaluate(() => { const l = window.__olympus.instinct()?.line; return l ? { id: l.id, act: l.act ?? null, row: l.row ?? null, text: l.text } : null; });
          let line = await lineOf(), taps = 0;
          while (line?.act && taps < 6) {
            const tick = await page.evaluate(() => window.__olympus.state.clock.tick);
            await page.keyboard.press('KeyT'); taps++;
            await page.waitForFunction((t) => window.__olympus.state.clock.tick > t && window.__olympus.stop()?.phase === 'choose' && !window.__olympus.stop()?.doing, tick, { timeout: 30000 });
            await page.waitForTimeout(400);
            line = await lineOf();
          }
          const fireKeys = await page.evaluate((id) => window.__olympus.keysFor(id), line?.row ?? 'fire');
          const look = () => page.evaluate(() => {
            const s = window.__olympus.state, nx = document.querySelector('.steps .step.core.next');
            return { tick: s.clock.tick, ms: s.clock.ms, save: window.__olympus.save(), next: nx?.querySelector('.label .name')?.textContent ?? null, nextTitle: nx?.title ?? '', pulse: [...document.querySelectorAll('.steps .step.pulse')].map(e => e.dataset.step) };
          });
          const before = await look();
          await page.keyboard.press('KeyT');
          await page.waitForTimeout(120);
          const during = await look();
          await page.waitForTimeout(STEP_PULSE_MS + 300);
          const after = await look();
          const want = `${fireKeys.join(' › ')}: yours. T never shoots.`;
          // (what the tap changed in the save: the press counted, and nothing else)
          const changed = [], walk = (x, y, p) => { if (JSON.stringify(x) === JSON.stringify(y)) return; if (x && y && typeof x === 'object' && typeof y === 'object') { for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) walk(x[k], y[k], `${p}.${k}`); return; } changed.push(`${p} ${JSON.stringify(x)}→${JSON.stringify(y)}`); };
          walk(JSON.parse(before.save), JSON.parse(after.save), '');
          const counted = changed.every(c => /^\.armoury\.range\.house\.rooms\.\d+\.(presses|how\.keys|pressAbout\.person) (\d+)→(\d+)$/.test(c) || /^\.clock\.seq /.test(c)) && changed.filter(c => /presses/.test(c)).length === 1;
          rows.push(`panel ${panel.toUpperCase()}: ${taps} T to the line "${line?.text}" (${line?.id}, row ${line?.row}, act ${line?.act ?? 'none'}); NEXT "${before.next}" (want "${want}"); a tapped T: pulse on ${during.pulse.join(', ') || 'nothing'}, after ${STEP_PULSE_MS} ms ${after.pulse.join(', ') || 'nothing'}; tick ${before.tick} → ${after.tick}, ms ${before.ms} → ${after.ms}; the save: ${changed.join(', ') || 'the same'}`);
          if (!line || line.act || line.row !== 'fire') bad.push(`${panel}: the line ${JSON.stringify(line)}`);
          if (before.next !== want) bad.push(`${panel}: NEXT "${before.next}" not "${want}"`);
          if (!during.pulse.includes(line?.row) || during.pulse.some(x => x !== line?.row) || after.pulse.length) bad.push(`${panel}: pulse ${JSON.stringify({ during: during.pulse, after: after.pulse })}`);
          if (before.tick !== after.tick || before.ms !== after.ms || !counted) bad.push(`${panel}: the clock or the save moved: ${changed.join(', ')}`);
        }
      }, { port });
      for (const r of rows) console.log(`      ${r}`);
      assert(!bad.length, bad.join(' | '));
    },
  },
];
