// OLYMPUS tests: the shoot house's acceptance list checked (the build sheet v0.0.21 §1 item 20; done lens D1).
//
// tests/house-done.mjs DONE is what "perfected" means, as a list the user signs: their verdict, their complaints each closed by a
// test, the gauges, never a dead end, the ladder, the moments, the saves, the performance, the scored scenes, the hand-off and this
// round's drawn house. This file resolves every row (each referenced test file loaded and its case matched, each gauge enforced in its
// file, each moment's recipe and each sample's sample.json found) and prints the list: WIRED by the machine (the check there and
// enforced), OPEN (a gauge the last heavy run left red, house-done.mjs OPEN_GAUGES, and every row naming it, with its numbers), USER
// with what waits on the user, LATER with the release it was cut to. A row the machine cannot find (a test renamed, a gauge taken
// out of its ENFORCED, a moment's recipe gone) fails it: the list never claims a check that is gone, and never counts a red gauge as
// met (the review of 2026-11-16: "MET 194" took in F70, F71 and F73, red in their heavy suites). Before v0.0.21 there was no list
// (done.md §2 finding 1).
import { assert } from './helpers.mjs';
import { ALL, DONE, GAUGE_ROWS, GAUGE_LAST, OPEN_GAUGES, resolveRow } from './house-done.mjs';

const GROUPS = Object.freeze({ A: 'the user\'s verdict', B: 'the user\'s complaints', C: 'the gauges', D: 'never a dead end', E: 'the ladder and the verdict', F: 'the moments', G: 'saves and replay', H: 'performance', I: 'the scored scenes', J: 'the hand-off', K: 'docs', L: 'the drawn house' });

export default [
  {
    name: 'the acceptance list resolves: every referenced test file and case found, every gauge F1 to F73 enforced in its file, every moment\'s recipe and every sample\'s sample.json there; it prints WIRED, OPEN (a gauge the last heavy run left red, and every row naming it, never counted met), USER (pending the user\'s word) and LATER (fails on any gap: a renamed test, a gauge out of its ENFORCED)',
    timeoutMs: 120_000,
    async fn() {
      const ids = ALL.map(r => r.id), dup = ids.filter((x, i) => ids.indexOf(x) !== i);
      assert(!dup.length && GAUGE_ROWS.length === GAUGE_LAST && DONE.every(r => r.group && r.what && r.check?.kind && r.check?.ref), JSON.stringify({ dup }));
      const res = [];
      for (const row of ALL) res.push(await resolveRow(row));
      const by = (st) => res.filter(r => r.status === st);
      for (const [g, name] of Object.entries(GROUPS)) {
        const mine = res.filter(r => r.row.group === g);
        if (!mine.length) continue;
        const n = (st) => mine.filter(r => r.status === st).length;
        console.log(`      ${g}. ${name}: ${mine.length} rows, WIRED ${n('WIRED')}${n('OPEN') ? `, OPEN ${n('OPEN')}` : ''}, USER ${n('USER')}${n('ANSWERED') ? `, ANSWERED ${n('ANSWERED')}` : ''}, LATER ${n('LATER')}${n('GAP') ? `, GAP ${n('GAP')}` : ''}`);
      }
      for (const r of by('OPEN')) console.log(`      OPEN  ${r.row.id} ${r.row.what}: ${r.why}`);
      for (const r of by('USER')) console.log(`      USER  ${r.row.id} ${r.row.what}: ${r.why}${r.row.words ? ` (the user, ${r.row.words.date}: "${r.row.words.text}")` : ''}`);
      for (const r of by('LATER')) console.log(`      LATER ${r.row.id} ${r.row.what}: ${r.why}`);
      for (const r of by('GAP')) console.log(`      GAP   ${r.row.id} ${r.row.what}${r.row.by ? ` (${r.row.by})` : ''}: ${r.why}`);
      console.log(`      ${res.length} rows: WIRED ${by('WIRED').length} (the check there and enforced; met is the suites' run), OPEN ${by('OPEN').length} (${Object.keys(OPEN_GAUGES).join(', ')} red at the last heavy run), USER ${by('USER').length}, ANSWERED ${by('ANSWERED').length}, LATER ${by('LATER').length}, GAP ${by('GAP').length}`);
      assert(!by('GAP').length, by('GAP').map(r => `${r.row.id}: ${r.why}`).join('; '));
      // (no row says met, and every row naming an open gauge is OPEN: its group C row and the list's own (E5, F7, H1 today))
      const naming = (id) => res.filter(r => r.row.check?.kind === 'gauge' && r.row.check.ref === id);
      const wrong = Object.keys(OPEN_GAUGES).flatMap(id => naming(id).filter(r => r.status !== 'OPEN').map(r => `${r.row.id} ${r.status}`));
      assert(!res.some(r => r.status === 'MET') && !wrong.length && Object.keys(OPEN_GAUGES).every(id => naming(id).length > 0), JSON.stringify({ wrong }));
    },
  },
];
