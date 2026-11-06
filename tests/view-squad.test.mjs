// OLYMPUS tests: the squad getting up at the klaxon, drawn frame by frame, never a pop (heavy).
//
// The build sheet 0.0.4 §5.3: "view-squad (heavy). The klaxon's landing, 30 s watched. Prints each
// figure's frame per drawn frame. Holds no cell jump and no posture change without a transition frame;
// shots, looked at." PEOPLE §4.6 and the sheet §8 item 18: lived transitions play in sight (rise, lie
// down, sit, stand, dress), every other change unseen-only. ?play=test-night&seed=48213: R's sleep until
// reveille from the rack's foot, the drill forced to 02:30 stops it; from the landing every drawn frame's
// figures are read in the page (the view's stats.figures: each one's id, place, frame and berth) for 30 s
// while the squad rises at its calls (2 to 20 s after the klaxon), dresses and stands at its racks. A
// figure's frames fall in kinds: the berth (lying), up on the berth (sitUp, lieDown), off it (sit, climb,
// standUp), standing (the gait's), dressing; the test holds that every change of kind is one step of the
// rise or the lie down (berth ↔ up ↔ off ↔ standing ↔ dressing), never lying to standing in a frame, and
// that the figures drawn are the same set throughout (a berth's own drawing under a sitter excepted),
// and prints each figure's frames run by run, the most a figure moved in a frame of one kind, and how
// many rose. Shots of the bay at the landing, 8 s and 20 s on into OLYMPUS_SHOTS. Runs on OLYMPUS_TEST_PORT.
import { assert, fmt } from './helpers.mjs';
import { withGame } from './browser.mjs';
import { mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SHOTS = process.env.OLYMPUS_SHOTS ?? path.join(os.tmpdir(), 'olympus-shots');
const WATCH_MS = 30_000;
const KIND = (f) => (f.lie ? (f.frame === 'berthUp' ? 'up' : 'berth') : ['sitUp', 'lieDown'].includes(f.frame) ? 'up' : ['sit', 'climb', 'standUp'].includes(f.frame) ? 'off' : /^dress/.test(f.frame) ? 'dress' : 'stand');
/** The steps a rise and a lie down take, either way: a change of kind must be one of these. */
const STEPS = new Set(['berth>up', 'up>off', 'off>stand', 'stand>dress', 'dress>stand', 'off>off', 'up>berth', 'off>up', 'stand>off', 'dress>off', 'off>dress']);

export default [
  {
    name: 'the squad gets up at the klaxon in sight frame by frame: every change of posture a step of the rise (berth, up, off, standing, dressing), none lying to standing in a frame, nobody appearing or vanishing (PEOPLE §4.6; the build sheet 0.0.4 §8, item 18)',
    heavy: true,
    timeoutMs: 240000,
    async fn() {
      mkdirSync(SHOTS, { recursive: true });
      await withGame(async (page, errors) => {
        await page.evaluate(() => window.__olympus.activity('sleep', window.__olympus.offer()?.spotId ?? null, { until: 'reveille' }));
        await page.waitForFunction(() => !window.__report.view.splash && window.__report.view.beacon, null, { timeout: 30000 });
        const landed = await page.evaluate(() => window.__olympus.state.clock.ms);
        await page.screenshot({ path: path.join(SHOTS, 'squad-landing.png') });
        const watching = page.evaluate((MS) => new Promise(res => {
          const out = [], t0 = performance.now();
          const f = (t) => {
            const v = window.__report.view;
            out.push({ t: t - t0, ms: window.__olympus.state.clock.ms, figs: (v.figures ?? []).map(p => ({ id: p.id, x: p.x, z: p.z, y: p.y, lie: p.lie, frame: p.frame, own: p.own, remembered: p.remembered })) });
            if (t - t0 < MS) requestAnimationFrame(f); else res(out);
          };
          requestAnimationFrame(f);
        }), WATCH_MS);
        await page.waitForTimeout(8000);
        await page.screenshot({ path: path.join(SHOTS, 'squad-8s.png') });
        await page.waitForTimeout(12000);
        await page.screenshot({ path: path.join(SHOTS, 'squad-20s.png') });
        const frames = await watching;
        // (each figure's kinds and frames, run by run)
        const runs = new Map(), bad = [], ids0 = new Set(frames[0].figs.filter(f => !String(f.id).endsWith(':berth')).map(f => f.id));
        let maxStep = 0, appeared = 0, vanished = 0;
        for (let i = 0; i < frames.length; i++) {
          const ids = new Set(frames[i].figs.filter(f => !String(f.id).endsWith(':berth')).map(f => f.id));
          for (const id of ids) if (!ids0.has(id)) appeared++;
          for (const id of ids0) if (!ids.has(id)) vanished++;
          for (const f of frames[i].figs) {
            if (String(f.id).endsWith(':berth')) continue;
            const r = runs.get(f.id) ?? { list: [], last: null, own: f.own };
            const k = KIND(f), name = f.lie ? (f.frame === 'berthUp' ? 'berthUp' : 'berth') : f.frame;
            if (r.last) {
              if (r.last.k !== k && !STEPS.has(`${r.last.k}>${k}`)) bad.push(`${f.id} ${r.last.name} → ${name} at ${fmt(frames[i].t / 1000, 2)} s`);
              if (r.last.k === k && k !== 'berth') maxStep = Math.max(maxStep, Math.hypot(f.x - r.last.x, f.z - r.last.z));
            }
            const top = r.list.at(-1);
            if (top && top.name === name) top.n++; else r.list.push({ name, n: 1 });
            r.last = { k, name, x: f.x, z: f.z };
            runs.set(f.id, r);
          }
        }
        const rose = [...runs.values()].filter(r => r.list.some(x => x.name === 'sitUp') && r.list.some(x => !['berth', 'berthUp', 'sitUp', 'lieDown'].includes(x.name))).length;
        const remembered = new Set(frames.flatMap(fr => fr.figs.filter(f => f.remembered).map(f => f.id)));
        console.log(`      landed at ${landed}; ${frames.length} frames over ${fmt(frames.at(-1).t / 1000, 1)} s, ${ids0.size} figures; ${rose} rose from their berths in sight; ${remembered.size} drawn as last seen while out of your sight from the lower berth (the view's memory, VIEWS §2.11: they rise unseen and show standing once looked at); ${appeared} appearances and ${vanished} vanishings of a figure; the most a figure moved in a frame of one kind ${fmt(maxStep, 3)} m`);
        for (const [id, r] of runs) console.log(`      ${id}${r.own ? ' (you)' : ''}: ${r.list.map(x => `${x.name}×${x.n}`).join(' → ')}`);
        console.log(`      shots: squad-landing.png, squad-8s.png, squad-20s.png in ${SHOTS}`);
        assert(!bad.length, `posture changes without a transition frame: ${bad.slice(0, 8).join('; ')}`);
        assert(!appeared && !vanished, `${appeared} appeared, ${vanished} vanished`);
        assert(rose >= 1, 'someone rose in the 30 s');
        assert(maxStep <= 1.5, `a figure moved ${fmt(maxStep, 2)} m in a frame`);
        assert(!errors.length, errors.join('\n'));
      }, { query: 'play=test-night&seed=48213&nostore=1', viewport: { width: 1600, height: 900 }, timeoutMs: 60000 });
    },
  },
];
