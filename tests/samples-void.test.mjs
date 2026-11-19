// OLYMPUS tests: the anywhere round's two look sets, made in v0.0.23 so v0.0.24 draws what the user scored (the build sheet
// v0.0.23 §1 item 8, §0 item 28, §6 E: samples-void). float-look (a floating body's height read from above: F-a to F-d, F-b the
// default) and mag-boots (the boots' B-a to B-c, B-b the default; its H group, a hand on a hold, the lanyard and the wedge, H-a the
// default, drawn at E2 on the portraits round's pose engine, C's ANCHORS table): each shot whole (tests/samples-check.mjs), its pictures drawn in node at the size
// sample.json says, and what each candidate claims in its picture's report: F-b's step of scale only off the deck by more than
// SCALE_FROM_M, the other looks never scaled; the boots redrawn only where the candidate puts them. Fails without the sets.
import path from 'node:path';
import { assert } from './helpers.mjs';
import { SAMPLES, checkSet, drawn } from './samples-check.mjs';

export default [
  {
    name: 'float-look: F-a to F-d shot whole, F-b the default (v0.0.24); F-b scales a body only off the deck by more than SCALE_FROM_M, the others never',
    async fn() {
      const { views } = checkSet('float-look', { groups: ['F'], views: 4, open: ['F-b'], builtIn: 'v0.0.24' });
      const { SCALE_FROM_M, SCALE_STEP_K, BODIES, ROWS } = await import(path.join(SAMPLES, 'float-look/float.js'));
      const lines = [];
      for (const v of views) {
        const P = await drawn('float-look/float.js', v), cells = P.report.cells;
        assert(cells.length === ROWS.reduce((a, [, k]) => a + (k > 1 ? 3 : BODIES.length), 0), JSON.stringify({ view: v.id, cells: cells.length }));
        for (const c of cells) {
          const want = v.id === 'F-b' && c.h > SCALE_FROM_M;
          assert(c.stepped === want, JSON.stringify({ view: v.id, cell: c, SCALE_FROM_M }));
        }
        lines.push(`${v.id} ${cells.filter(c => c.stepped).length} of ${cells.length} scaled`);
      }
      console.log(`      ${lines.join('; ')} (× ${SCALE_STEP_K} above ${SCALE_FROM_M} m)`);
    },
  },
  {
    name: 'mag-boots: B-a to B-c shot whole, B-b the default (v0.0.24); each draws today\'s figure beside the candidate',
    async fn() {
      const all = checkSet('mag-boots', { groups: ['B', 'H'], views: 6, open: ['B-b', 'H-a'], builtIn: 'v0.0.24' }), views = all.groups.find(g => g.id === 'B').views;
      const { LOOKS, DEFAULT } = await import(path.join(SAMPLES, 'mag-boots/boots.js'));
      assert(DEFAULT === 'B-b' && JSON.stringify([...LOOKS].sort()) === JSON.stringify(views.map(v => v.id).sort()), JSON.stringify({ LOOKS, DEFAULT }));
      const rows = [];
      for (const v of views) {
        const r = (await drawn('mag-boots/boots.js', v)).report, fig = Object.values(r.figure);
        // (the candidate's boots redrawn on the figure in every facing and on the doll)
        assert(r.look === v.id && fig.length === 4 && fig.every(n => n > 0) && r.doll > 0, JSON.stringify({ view: v.id, figure: r.figure, doll: r.doll }));
        rows.push([v.id, fig, r.doll]);
      }
      // (three candidates, three different redrawings)
      assert(new Set(rows.map(([, f, d]) => `${f.join(',')}|${d}`)).size === rows.length, JSON.stringify(rows));
      console.log(`      boot pixels redrawn (figure by facing; doll): ${rows.map(([id, f, d]) => `${id} ${f.join('/')}; ${d}`).join(' · ')}`);
    },
  },
  {
    name: 'mag-boots H: H-a to H-c shot whole, H-a the default (v0.0.24), C\'s anchors each a view; each candidate\'s anchor drawn on the doll and the figure',
    async fn() {
      const { groups } = checkSet('mag-boots', { groups: ['B', 'H'], views: 6, open: ['B-b', 'H-a'], builtIn: 'v0.0.24' }), views = groups.find(g => g.id === 'H').views;
      const { ANCHORS } = await import(path.join(SAMPLES, 'portrait-pose/poses.js'));
      const { LOOKS, DEFAULT } = await import(path.join(SAMPLES, 'mag-boots/anchors.js'));
      assert(DEFAULT === 'H-a' && JSON.stringify(ANCHORS.map(a => a.id)) === JSON.stringify(views.map(v => v.id)) && JSON.stringify(LOOKS) === JSON.stringify(views.map(v => v.id)), JSON.stringify({ table: ANCHORS.map(a => a.id), views: views.map(v => v.id), LOOKS }));
      const rows = [];
      for (const v of views) {
        const r = (await drawn('mag-boots/anchors.js', v)).report;
        // (the candidate changes the doll, and the figure is drawn in its four facings)
        assert(r.look === v.id && r.doll > 0 && Object.keys(r.figure).length === 4, JSON.stringify(r));
        rows.push(`${v.id} doll ${r.doll} px changed`);
      }
      console.log(`      ${rows.join(' · ')}`);
    },
  },
];
