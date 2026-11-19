// OLYMPUS tests: the gallery's "To score" list (the build sheet v0.0.23 §1 item 8, §6 E: gallery-open). A set the user has not
// scored carries "open" in its sample.json; tools/gallery.mjs indexEntry copies it into samples/index.json as it is (and writes
// none for a set without it); samples/to-score.js toScore turns the index into the list samples/index.html draws first: a row an
// open set, its default's views named, the rounds that draw the picks in order (this round's first), the oldest first within a
// round. Checked with no DOM: indexEntry on made-up sets, toScore on a made-up index and on the real one (every sample.json's
// "open" in the index, every default a view of its set), and the page importing the list. Fails without the open field.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { assert, root } from './helpers.mjs';
import { indexEntry, readSamples } from '../tools/gallery.mjs';
import { toScore, toScoreText } from '../samples/to-score.js';

const views = (...ids) => [{ id: 'G', title: 'g', about: '', sets: null, views: ids.map(id => ({ id, name: `${id}: a view`, query: '' })) }];

export default [
  {
    name: 'indexEntry copies a set\'s open into the index as it is, and writes none for a set without it',
    fn() {
      const open = { default: ['A1'], since: '2026-11-17', decides: 'the thing', builtIn: 'v0.0.23' };
      const a = indexEntry('set-a', { title: 'A', about: 'a', pixel: true, open }, views('A1', 'A2'));
      const b = indexEntry('set-b', { title: 'B', about: 'b', pixel: true }, views('B1'));
      assert(JSON.stringify(a.open) === JSON.stringify(open) && a.id === 'set-a' && a.groups[0].views.length === 2, JSON.stringify(a));
      assert(!('open' in b) && b.id === 'set-b', JSON.stringify(b));
      console.log(`      with: open ${JSON.stringify(a.open.default)}; without: ${Object.keys(b).join(', ')}`);
    },
  },
  {
    name: 'toScore lists the open sets only, this round\'s first, then the oldest, its defaults named, a default naming no view flagged',
    fn() {
      const index = { samples: [
        indexEntry('late', { title: 'Late', open: { default: ['L1'], since: '2026-11-17', decides: 'l', builtIn: 'v0.0.24' } }, views('L1', 'L2')),
        indexEntry('old', { title: 'Old', open: { default: ['O2'], since: '2026-11-12', decides: 'o', builtIn: 'v0.0.24' } }, views('O1', 'O2', 'O3')),
        indexEntry('scored', { title: 'Scored' }, views('S1')),
        indexEntry('now', { title: 'Now', open: { default: ['N1', 'N9'], since: '2026-11-17', decides: 'n', builtIn: 'v0.0.23' } }, views('N1', 'N2')),
      ] };
      const rows = toScore(index);
      assert(JSON.stringify(rows.map(r => r.id)) === JSON.stringify(['now', 'old', 'late']), JSON.stringify(rows.map(r => r.id)));
      assert(JSON.stringify(rows[0].defaults.map(d => d.id)) === '["N1"]' && JSON.stringify(rows[0].missing) === '["N9"]' && rows[1].views === 3, JSON.stringify(rows));
      const text = toScoreText(rows);
      assert(text.split('\n').length === 3 && text.startsWith('now (2 views, since 2026-11-17, drawn in v0.0.23): default N1'), text);
      console.log(`      ${rows.length} rows of 4 sets: ${rows.map(r => `${r.id} (${r.builtIn}, ${r.since})`).join(', ')}; "${text.split('\n')[0]}"`);
    },
  },
  {
    name: 'the real index: every sample.json\'s open is in samples/index.json, every default a view of its set, the page drawing the list first',
    fn() {
      const index = JSON.parse(readFileSync(path.join(root, 'samples/index.json'), 'utf8')), byId = new Map(index.samples.map(s => [s.id, s]));
      const sets = readSamples(), open = sets.filter(x => x.sample.open);
      for (const { folder, sample } of sets) {
        const e = byId.get(folder);
        // (v0.0.23's fixer: a retired set (samples/voices, the user's "no voices" of 2026-11-19) is never in the index)
        if (sample.retired) { assert(!e, `${folder}: retired, yet in the index`); continue; }
        assert(e, `${folder}: not in the index`);
        assert(JSON.stringify(e.open ?? null) === JSON.stringify(sample.open ?? null), JSON.stringify({ folder, index: e.open ?? null, sample: sample.open ?? null }));
      }
      const rows = toScore(index);
      assert(rows.length === open.length && rows.every(r => r.missing.length === 0 && r.defaults.length > 0), JSON.stringify(rows.filter(r => r.missing.length || !r.defaults.length)));
      const html = readFileSync(path.join(root, 'samples/index.html'), 'utf8');
      assert(/import \{ toScore, toScoreText \} from '\.\/to-score\.js'/.test(html) && html.includes('id = \'to-score\''), 'samples/index.html does not draw the list');
      const now = rows.filter(r => r.builtIn === 'v0.0.23');
      console.log(`      ${rows.length} open sets of ${sets.length} (${now.length} drawn this round: ${now.map(r => `${r.id} ${r.defaults.map(d => d.id).join('/')}`).join(', ')}); ${rows.reduce((a, r) => a + r.views, 0)} views to score`);
    },
  },
];
