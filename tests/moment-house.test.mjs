// OLYMPUS tests: the shoot house's six acceptance moments, played in node and shown in the page (the build sheet v0.0.21 §1 item 19, F71; done lens D3; ROADMAP §2.3).
//
// The node part plays each moment of tests/moment-house.mjs to its card by its bot, holds what it must (its recipe's holds), prints
// ROADMAP §2.3's timeline (lived seconds, stops, modelled real minutes at THINK_S 6 s a stop, decisions a real minute, dead air over
// DEAD_AIR_GAP_S 15 s, the longest gap) and saves each beat to .run/moments/house-<id>/; each under 60 s of compute; F71 (flawless-
// done.mjs paceRow) holds the dead air under 20% and the private's and the tier one's real minutes in COMBAT §25.10.4's bands as
// rewritten from the measure. The page part loads each moment's first stop after GO (the jam's: its click) on its own port, shoots the
// frame into the beats' folder, and presses one real key by code (T: the instructor's line's act, the instinct's), checking that the
// press reached the sim (the stop moved: a doing begun, the phase or the clock changed). Before v0.0.21 the house had no moment
// (tests/moment-*.test.mjs were the shower, the night and the basin): done.md F1.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { assert } from './helpers.mjs';
import { withGame } from './browser.mjs';
import { MOMENTS, playMoment, paceOf, timelineOf } from './moment-house.mjs';
import { paceRow, printDone, doneFailing } from './flawless-done.mjs';

/** The most compute a moment's node part may take (ms; done.md item 3). */
export const MOMENT_CPU_MS = 60_000;

export default [
  {
    name: 'the house\'s six moments in node: each played to its card by its bot within 60 s of compute, each holding what it must ("Step by step, as a private", "Clean, as tier one", "The jam in room 2", "Bang, then go", "Through the hinges", "A man, not a stand"), its timeline printed and its beats saved; F71: dead air under 20%, the private\'s and the tier one\'s real minutes in their bands',
    heavy: true,
    timeoutMs: 20 * 60_000,
    fn() {
      const out = [], bad = [];
      for (const m of MOMENTS) {
        const r = playMoment(m), h = m.holds(r.g, r);
        console.log(`      ${timelineOf(r)}`);
        console.log(`        holds ${h.ok ? 'yes' : 'NO'}: ${h.words}`);
        out.push(r);
        if (!r.done || !h.ok || r.cpuMs > MOMENT_CPU_MS) bad.push(`${m.id}: ${!r.done ? 'no card' : !h.ok ? h.words : `${(r.cpuMs / 1000).toFixed(1)} s of compute`}`);
      }
      const row = paceRow(out.map(paceOf));
      printDone('the moments\' pace (F71)', [row]);
      assert(!bad.length && !doneFailing([row]).length, [...bad, ...doneFailing([row])].join(' | '));
    },
  },
  {
    name: 'the house\'s six moments in the page: each moment\'s first stop after GO (the jam\'s click) loaded on its own port with no page or console error, shot into its beats\' folder, and one real key pressed by code (T) reaching the sim as its act',
    heavy: true,
    timeoutMs: 15 * 60_000,
    async fn() {
      const port = Number(process.env.OLYMPUS_TEST_PORT) || undefined, rows = [];
      // (the beats from the node part's run, or made now)
      const beatOf = (m) => {
        const dir = path.join(path.dirname(new URL(import.meta.url).pathname), '..', '.run', 'moments', m.id);
        let files = [];
        try { files = readdirSync(dir); } catch { files = []; }
        // (the jam's beat its click's stop, the others' their first stop after GO)
        const want = m.id === 'house-jam' ? '-click.json' : '-first-stop.json';
        let f = files.find(x => x.endsWith(want));
        if (!f) { playMoment(m); files = readdirSync(dir); f = files.find(x => x.endsWith(want)); }
        return f ? { dir, json: readFileSync(path.join(dir, f), 'utf8'), name: f } : null;
      };
      await withGame(async (page, errors, game) => {
        for (const m of MOMENTS) {
          const b = beatOf(m);
          if (!b) { rows.push(`${m.id}: no stop after GO to show`); continue; }
          await game.open('nostore=1');
          await page.evaluate((json) => window.__olympus.start(json), b.json);
          await page.waitForFunction(() => window.__olympus.state?.armoury?.range?.course === 'house', null, { timeout: 30000 });
          await page.waitForTimeout(800);
          const shot = path.join(b.dir, b.name.replace(/\.json$/, '.png'));
          writeFileSync(shot, await page.screenshot());
          const look = () => page.evaluate(() => { const O = window.__olympus, st = O.stop?.(); return JSON.stringify({ ms: O.state.clock.ms, phase: st?.phase ?? null, doing: st?.doing?.step ?? O.state.stop?.doing?.step ?? null, carry: O.state.stop?.carry?.bundle ?? null, mode: O.state.stop?.mode ?? null }); });
          const act = await page.evaluate(() => { const l = window.__olympus.instinct?.(); return l?.line?.act ?? l?.act ?? null; });
          const before = await look();
          await page.keyboard.press(m.key);
          let after = before;
          for (let i = 0; i < 20 && after === before; i++) { await page.waitForTimeout(100); after = await look(); }
          rows.push(`${m.id}: ${b.name} shown (${path.basename(shot)}); T over the line's act ${JSON.stringify(act)}: ${before} → ${after}`);
          assert(after !== before, `${m.id}: the press did not reach the sim (${before})`);
        }
        for (const r of rows) console.log(`      ${r}`);
        assert(!errors.length, errors.join(' | '));
      }, { port });
    },
  },
];
