// OLYMPUS tests: the portraits in the page (heavy, a browser file; the build sheet v0.0.23 items 1, 2 and 4, §6 C).
//
// The user's note of 2026-11-17, scoring "Stack and clear" on seed 4028068471: "the portrait of the NPC holding a gun does not
// display the gun they are holding". The portraits lens kept three saves of v0.0.20 at the pauses the user saw (tests/saves/portrait/:
// none-2a-5, room 2's 2a armoured with a pistol; none-3b-7, room 3's hostage card, the hostile with a rifle; live-2a-5, the live
// lane's 2a with his rifle). Each is loaded in the page and the hit card's own canvas read: the two boards' cards hold at least
// GUN_PX_MIN pixels in the board's dark ink (PORTRAIT_HOLD; v0.0.22: 0), and the live man's card is his Seen record's (the
// rifle in his hands as the stage draws it, never the empty hands v0.0.22's liveGear drew while unread). No page errors.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';
import { assert, root } from './helpers.mjs';
import { withGame } from './browser.mjs';
import { PORTRAIT_HOLD } from '../src/art/doll/portrait.js';
import { GUN_PX_MIN } from './flawless-portrait.mjs';

const save = (n) => gunzipSync(readFileSync(path.join(root, 'tests/saves/portrait', `${n}.json.gz`))).toString('utf8');

export default [
  {
    name: 'the user\'s saves of seed 4028068471 in the page: 2a\'s card (armoured, a pistol) and the hostage card\'s hostile hold the gun in the board\'s ink (v0.0.22: 0 pixels), the live 2a\'s card is his record, the rifle in his hands aimed at you; no page errors',
    heavy: true,
    timeoutMs: 180000,
    async fn() {
      await withGame(async (page, errors, game) => {
        await page.setViewportSize({ width: 1600, height: 900 });
        await game.open('play=test-shoothouse&seed=4028068471&nostore=1');
        await page.waitForFunction(() => window.__ready, null, { timeout: 60000 });
        const rows = [], out = {};
        for (const n of ['none-2a-5', 'none-3b-7', 'live-2a-5']) {
          await page.evaluate((j) => window.__olympus.load(j), save(n));
          await page.waitForFunction(() => { const hc = document.querySelector('.hitcard'); return hc && !hc.hidden && hc.dataset.key; }, null, { timeout: 20000 });
          await page.evaluate(() => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(res)))));
          const got = await page.evaluate(async (tones) => {
            const hc = document.querySelector('.hitcard'), cv = hc.querySelector('canvas'), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
            let ink = 0; for (let i = 0; i < d.length; i += 4) { const c = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2]; if (tones.includes(c)) ink++; }
            const s = window.__olympus.state, { engagedOf, liveRecOf } = await import('/src/sim/arms/engage.js'), { seenOf } = await import('/src/sim/people/seen.js');
            const e = engagedOf(s), T = (s.armoury.range.turners ?? []).find(t => t.key === hc.dataset.key), who = T?.live?.who ?? null;
            const rec = who && liveRecOf(s, who) ? seenOf(s, who) : null;
            return { key: hc.dataset.key, text: hc.dataset.text, w: cv.width, ink, engaged: e?.key ?? null, live: !!who, hold: rec?.hold?.how ?? null, aimAt: rec?.aimAt ?? null, pose: rec?.pose ?? null };
          }, [PORTRAIT_HOLD.ink, PORTRAIT_HOLD.lit]);
          out[n] = got;
          rows.push(`${n}: the card on ${got.key} ('${got.text}', ${got.w} px wide), ${got.ink} pixels in the board's ink${got.live ? `; the live man's record: ${got.hold} ${got.pose}${got.aimAt ? ` aimed ${got.aimAt}` : ''}` : ''}`);
        }
        for (const r of rows) console.log(`      ${r}`);
        for (const n of ['none-2a-5', 'none-3b-7']) assert(out[n].ink >= GUN_PX_MIN * out[n].w / 200, `${n}: ${out[n].ink} ink pixels`);
        const L = out['live-2a-5'];
        assert(L.live && L.hold === 'rifle-aim' && L.aimAt === 'you' && L.ink === 0, JSON.stringify(L));
        assert(!errors.length, errors.join('\n'));
      }, { viewport: { width: 1600, height: 900 } });
    },
  },
];
