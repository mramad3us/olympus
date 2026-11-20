// OLYMPUS tests: the Esc menu's To score page with the rated rows folded at the bottom and "Copy my picks" giving only the new
// (v0.0.24 F; the user, 2026-11-19: "please in the future, place the already rated picks in a hidden drop down section at the
// bottom"; DESIGN.md's log: "Copy my picks" gives only the picks made since the last copy, the earlier ones counted in one line).
// src/ui/cards/topick.js: ratedRow (a row whose gallery set the user scored: ROW_SETS, RATED_SETS), picksText's `since` (the
// record's `copied`, written at each copy). Quick: the pure parts. Heavy: the page in Chrome, the rated rows in a closed section
// under the waiting ones, a second copy with nothing new saying so.
import { assert } from './helpers.mjs';
import { ROWS, ratedRow, RATED_SETS, ROW_SETS, picksText, picksOf, readPicks } from '../src/ui/cards/topick.js';
import { withGame, BROWSER_TEST_PORT } from './browser.mjs';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { root } from './helpers.mjs';

export default [
  {
    name: 'the rated rows are those whose set the user scored (the helmets, the walk, the room\'s mark; from 2026-11-20 the stack, the shot and the card\'s gun), every one of RATED_SETS scored or retired in samples; the waiting ones (the card\'s hands not read, aimed and pistol aimed, offering the redrawn A3, P3 and V3 first) and the corner aid stay on top; no voices\' row, waiting or rated (the user, 2026-11-19: "forget about voices, those are all terrible use text bubble only")',
    fn() {
      const rated = ROWS.filter(ratedRow).map(r => r.id), waiting = ROWS.filter(r => !ratedRow(r)).map(r => r.id);
      const S = (id) => { try { return JSON.parse(readFileSync(path.join(root, 'samples', id, 'sample.json'), 'utf8')); } catch { return null; } };
      const bad = RATED_SETS.filter(id => { const s = S(id); return !s || !!s.open || !(s.scored || s.retired); });
      console.log(`      rated: ${rated.join(', ')}; on top: ${waiting.join(', ')}; RATED_SETS ${RATED_SETS.join(', ')}${bad.length ? `; not scored: ${bad.join(', ')}` : ''}`);
      // (v0.0.28, the user's picks of 2026-11-20: the stack (S1 and S5 joined), the shot (A5) and the card's gun (G2) folded; was the three on top)
      assert(['helm', 'walk', 'jamb', 'stack', 'shot', 'card.gun'].every(id => rated.includes(id)) && ['card.unread', 'card.aim', 'card.pistol', 'aid', 'drawn'].every(id => waiting.includes(id)) && !bad.length, JSON.stringify({ rated, waiting, bad }));
      // (the card's rows: the game's pick first, the redrawn holds and the hidden hands; the hands not read are portrait-light's V, not portrait-gun's)
      const ids = Object.fromEntries(ROWS.filter(r => r.card).map(r => [r.id, r.ids.join(' ')]));
      console.log(`      the card's rows: ${JSON.stringify(ids)}; card.unread's set ${ROW_SETS['card.unread']}`);
      assert(ids['card.gun'] === 'G2 G1 G3' && ids['card.unread'] === 'V3 V1' && ids['card.aim'] === 'A3 A2' && ids['card.pistol'] === 'P3 P1' && ROW_SETS['card.unread'] === 'portrait-light', JSON.stringify({ ids, ROW_SETS }));
      assert(Object.values(ROW_SETS).every(id => S(id)), JSON.stringify(ROW_SETS));
      // (the fixer of F's review, 2026-11-19: the Voice row was only folded under "Already rated"; DESIGN.md's log drops it)
      const voiceRows = ROWS.filter(r => r.id === 'voice' || /voice/i.test(r.title)).map(r => r.title);
      console.log(`      a voices' row: ${voiceRows.length ? voiceRows.join(', ') : 'none'}; ROW_SETS' voice ${ROW_SETS.voice ?? 'none'}`);
      assert(!voiceRows.length && !('voice' in ROW_SETS) && !Object.values(ROW_SETS).includes('voices') && !RATED_SETS.includes('voices'), JSON.stringify({ voiceRows, ROW_SETS, RATED_SETS }));
    },
  },
  {
    name: '"Copy my picks" after a copy gives only what changed since, then the earlier ones counted; nothing new says so; read back by picksOf',
    fn() {
      const p = { v: 1, scores: { 'helm:R3': 90, 'shot:A5': 70 }, stars: ['helm:R3'], flags: {}, copied: null };
      const first = picksText(p, { since: p.copied });
      const copied = { scores: { ...p.scores }, stars: [...p.stars] };
      const p2 = { ...p, scores: { ...p.scores, 'stack:S2': 60 }, stars: [...p.stars, 'shot:A5'], copied };
      const second = picksText(p2, { since: copied }), none = picksText(p, { since: copied });
      console.log(`      first: ${first.split('\n').length - 1} lines; the second: ${second.split('\n').slice(1).join(' | ')}; again with nothing new: "${none}"; a fresh record's copied ${JSON.stringify(readPicks({ getItem: () => null }).copied)}`);
      assert(picksOf(first).picks.length === 2 && picksOf(second).picks.map(x => x.id).join() === 'A5,S2' && /1 earlier pick already copied/.test(second), JSON.stringify({ first, second }));
      assert(/^No new picks since your last copy \(2 earlier picks/.test(none) && picksText({ scores: {}, stars: [] }) === 'No picks yet.', none);
    },
  },
  {
    name: 'in the page: To score\'s rated rows in a closed "Already rated" section under the waiting rows; a copy, then a copy with nothing new says so',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      await withGame(async (page, errors, game) => {
        await page.setViewportSize({ width: 1600, height: 900 });
        await game.open('play=test-shoothouse&setup=go&tier=private&seed=48213&nostore=1');
        await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.course === 'house', null, { timeout: 60000 });
        await page.keyboard.press('Escape');
        await page.waitForSelector('.overlay .menu');
        await page.evaluate(() => [...document.querySelectorAll('.overlay .menu .item')].find(b => /To score/.test(b.innerText)).click());
        await page.waitForSelector('.overlay .topick');
        const shape = await page.evaluate(() => {
          const T = document.querySelector('.overlay .topick'), det = T.querySelector('details.topick-rated'), titles = (q) => [...q.querySelectorAll('.topick-row .title')].map(e => e.textContent);
          const top = [...T.querySelector(':scope > .topick-rows').children].map(e => e.querySelector('.title')?.textContent);
          return { open: det?.open ?? null, summary: det?.querySelector('summary')?.textContent, rated: det ? titles(det) : [], top, after: det ? det.compareDocumentPosition(T.querySelector(':scope > .topick-rows')) : 0 };
        });
        const copy = () => page.evaluate(() => { [...document.querySelectorAll('.overlay .topick .item')].find(b => b.textContent === 'Copy my picks').click(); return document.querySelector('.overlay .topick > .note:last-child')?.textContent ?? ''; });
        await page.evaluate(() => { const row = [...document.querySelectorAll('.overlay .topick .topick-row')].find(r => r.querySelector('.title').textContent === 'Aimed'); const sl = row.querySelector('input[type=range]'); sl.value = '80'; sl.dispatchEvent(new Event('input')); });
        const one = await copy(), two = await copy();
        console.log(`      on top: ${shape.top.join(', ')}; "${shape.summary}" (open ${shape.open}): ${shape.rated.join(', ')}; the first copy: "${one}"; the second: "${two}"`);
        // (compareDocumentPosition 2: the waiting rows precede the section)
        assert(shape.open === false && ['Helmets', 'The walk', 'The room\'s mark'].every(t => shape.rated.includes(t)) && !shape.rated.includes('The voices') && !shape.top.includes('The voices') && !shape.top.includes('Helmets') && !shape.top.includes('The shot') && shape.rated.includes('The shot') && shape.top.includes('Aimed') && shape.after === 2, JSON.stringify(shape));
        assert(/Copied/.test(one) && /^No new picks since your last copy/.test(two), JSON.stringify({ one, two }));
        assert(!errors.length, errors.join(' | '));
      }, { port: BROWSER_TEST_PORT });
    },
  },
];
