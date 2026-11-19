// OLYMPUS tests: the gallery's rated sets at the bottom, folded, and "Copy my picks" giving only what is new (the user,
// 2026-11-19: "please in the future, place the already rated picks in a hidden drop down section at the bottom"; DESIGN.md's
// log, the user's gallery picks: "Copy my picks" gives only the picks made since the last copy, the earlier ones counted in one
// line). samples/to-score.js ratedSets lists the sets with no "open" (the rated ones: the lead writes "scored" where "open"
// stood), newSince keeps only the stars, scores and notes added or changed since the copy this browser remembers; the page
// (samples/index.html) draws the waiting sets first and the rated ones in a closed <details> at the bottom. Quick: the pure
// part and the real index (the nine sets the user scored on 2026-11-19 rated, none of them open); heavy: the page in Chrome.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { assert, root } from './helpers.mjs';
import { indexEntry, readSamples } from '../tools/gallery.mjs';
import { ratedSets, newSince, toScore } from '../samples/to-score.js';
import { withGame, BROWSER_TEST_PORT } from './browser.mjs';

const views = (...ids) => [{ id: 'G', title: 'g', about: '', sets: null, views: ids.map(id => ({ id, name: `${id}: a view`, query: '' })) }];
/** The sets the user scored on 2026-11-19 (DESIGN.md's log; their paste): each must be rated, with what they picked. */
const SCORED_2026_11_19 = ['helmets', 'held-devices', 'opfor-look', 'marks', 'p12-card', 'p12-draw', 'walk', 'house-light', 'wcard2'];

export default [
  {
    name: 'ratedSets lists every set with no "open", in the index\'s order, with its "scored" carried by indexEntry; the open ones are toScore\'s',
    fn() {
      const index = { samples: [
        indexEntry('waiting', { title: 'W', open: { default: ['W1'], since: '2026-11-17', decides: 'w', builtIn: 'v0.0.24' } }, views('W1', 'W2')),
        indexEntry('old', { title: 'Old' }, views('O1')),
        indexEntry('rated', { title: 'R', scored: { on: '2026-11-19', picks: ['R2'] } }, views('R1', 'R2', 'R3')),
      ] };
      const r = ratedSets(index), w = toScore(index);
      assert(JSON.stringify(r.map(x => x.id)) === '["old","rated"]' && JSON.stringify(w.map(x => x.id)) === '["waiting"]', JSON.stringify({ r, w }));
      assert(r[1].views === 3 && r[1].scored?.picks?.[0] === 'R2' && r[0].scored === null, JSON.stringify(r));
      console.log(`      rated: ${r.map(x => `${x.id} (${x.views} views${x.scored ? `, scored ${x.scored.on}: ${x.scored.picks.join(', ')}` : ''})`).join('; ')}; waiting: ${w.map(x => x.id).join(', ')}`);
    },
  },
  {
    name: 'newSince keeps only the stars, scores and notes added or changed since the last copy, and counts the earlier ones',
    fn() {
      const first = { picks: ['a/A1', 'a/A2'], scores: { 'a/A1': 90, 'b/B1': 40 }, notes: { 'a/A': 'good' } };
      const all = newSince(first, null);
      assert(all.picks.length === 2 && Object.keys(all.scores).length === 2 && all.notes['a/A'] === 'good' && all.earlier === 0, JSON.stringify(all));
      // (copied; then one score changed, one star added, one note added, one star removed: only those three, four earlier)
      const later = { picks: ['a/A1', 'c/C1'], scores: { 'a/A1': 90, 'b/B1': 55 }, notes: { 'a/A': 'good', 'c/C': 'new' } };
      const d = newSince(later, first);
      assert(JSON.stringify(d.picks) === '["c/C1"]' && JSON.stringify(d.scores) === '{"b/B1":55}' && JSON.stringify(d.notes) === '{"c/C":"new"}', JSON.stringify(d));
      assert(d.earlier === 2, JSON.stringify(d));
      const none = newSince(later, later);
      assert(!none.picks.length && !Object.keys(none.scores).length && !Object.keys(none.notes).length && none.earlier === 5, JSON.stringify(none));
      console.log(`      first copy: ${all.picks.length} stars, ${Object.keys(all.scores).length} scores, 1 note; the next: ${d.picks.length} star, ${Object.keys(d.scores).length} score, ${Object.keys(d.notes).length} note new, ${d.earlier} earlier; copied again with nothing new: ${none.earlier} earlier`);
    },
  },
  {
    name: 'the real index: the nine sets the user scored on 2026-11-19 are rated (no "open", their picks in "scored"), as their sample.json say; the page imports ratedSets and newSince',
    fn() {
      const index = JSON.parse(readFileSync(path.join(root, 'samples/index.json'), 'utf8'));
      const byFolder = new Map(readSamples().map(x => [x.folder, x.sample]));
      const rated = new Map(ratedSets(index).map(r => [r.id, r]));
      for (const id of SCORED_2026_11_19) {
        const r = rated.get(id), s = byFolder.get(id);
        assert(r && r.scored?.on === '2026-11-19' && r.scored.picks.length > 0 && !s.open && JSON.stringify(s.scored) === JSON.stringify(r.scored), JSON.stringify({ id, r, s: s?.scored ?? null, open: s?.open ?? null }));
        const ids = new Set(index.samples.find(x => x.id === id).groups.flatMap(g => g.views.map(v => v.id)));
        assert(r.scored.picks.every(p => ids.has(p)), JSON.stringify({ id, picks: r.scored.picks }));
      }
      const html = readFileSync(path.join(root, 'samples/index.html'), 'utf8');
      assert(/import \{[^}]*ratedSets[^}]*newSince[^}]*\} from '\.\/to-score\.js'/.test(html) && html.includes("below.className = 'rated'"), 'samples/index.html does not fold the rated sets');
      console.log(`      ${rated.size} rated sets (${SCORED_2026_11_19.length} scored on 2026-11-19), ${toScore(index).length} waiting`);
    },
  },
  {
    name: 'the gallery in Chrome: the waiting sets on top, the rated ones in a closed section at the bottom; a second copy gives only the new pick and counts the earlier ones',
    heavy: true,
    async fn() {
      await withGame(async (page, errors) => {
        const g = await page.evaluate(() => {
          const det = document.getElementById('rated'), kids = [...document.getElementById('list').children];
          return { ...window.__gallery, open: det?.open ?? null, last: kids.at(-1)?.id, inside: det ? det.querySelectorAll('.sample').length : 0, firstSample: document.querySelector('#list > .sample')?.id };
        });
        assert(g.rated.length >= 9 && g.waiting.length > 0 && g.open === false && g.last === 'rated' && g.inside === g.rated.length && g.firstSample === `s-${g.waiting[0]}`, JSON.stringify(g));
        // (two stars, copied; then a third: the next copy has the third alone and the earlier two counted)
        const keys = await page.evaluate(() => [...document.querySelectorAll('figure .star')].slice(0, 3).map((b, i) => { if (i < 2) b.click(); return i; }));
        await page.click('#copy');
        const first = await page.evaluate(() => window.__picksText());
        await page.evaluate(() => document.querySelectorAll('figure .star')[2].click());
        const second = await page.evaluate(() => window.__picksText());
        const stars = (t) => t.split('\n').filter(l => l.startsWith('★')).length;
        assert(/^No new picks since your last copy \(2 earlier/.test(first) && stars(second) === 1 && /2 earlier picks and notes already copied, not repeated/.test(second), JSON.stringify({ first, second, keys }));
        assert(!errors.length, JSON.stringify(errors));
        console.log(`      ${g.waiting.length} waiting on top (first ${g.waiting[0]}), ${g.rated.length} rated in the closed section; after the copy "${first}"; the next copy: ${stars(second)} star, "${second.split('\n').at(-1)}"`);
      }, { port: BROWSER_TEST_PORT, at: '/samples/index.html', ready: 'window.__ready === true', init: () => { try { localStorage.clear(); } catch {} } });
    },
  },
];
