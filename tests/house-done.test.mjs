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
import { ALL, DONE, GAUGE_ROWS, GAUGE_LAST, GAUGE_ROUNDS, OPEN_GAUGES, resolveRow } from './house-done.mjs';
import { WRECK_GAUGES, WRECK_FIRST, WRECK_LAST } from './wreck-done.mjs';
import { BREACH_GAUGES, BREACH_FIRST, BREACH_LAST } from './breach-done.mjs';

const GROUPS = Object.freeze({ A: 'the user\'s verdict', B: 'the user\'s complaints', C: 'the gauges', D: 'never a dead end', E: 'the ladder and the verdict', F: 'the moments', G: 'saves and replay', H: 'performance', I: 'the scored scenes', J: 'the hand-off', K: 'docs', L: 'the drawn house', M: 'v0.0.22\'s rooms, lane\'s end, blast and page', N: 'v0.0.23\'s portraits, knowledge and carried fixes', O: 'v0.0.24\'s void, its scenes and the picks', P: 'v0.0.25\'s Wreck and the carried fixes', Q: 'v0.0.26\'s Bang, then go' });

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
  {
    name: 'every gauge\'s row names its own round (v0.0.24, carried from v0.0.23: every row with a role was labelled "v0.0.21" whatever its round, F74 to F99 among them, and the rest none): F1 v0.0.14, F25 v0.0.17, F45 v0.0.20, F61 v0.0.21 A, F74 v0.0.22 A, F85 v0.0.23 A, F100 v0.0.24 stage 0, and the rounds never go back as the numbers rise',
    fn() {
      const by = Object.fromEntries(GAUGE_ROWS.map(r => [r.id, r.by ?? null]));
      const want = { CF1: 'v0.0.14', CF24: 'v0.0.14', CF25: 'v0.0.17', CF27: 'v0.0.18', CF34: 'v0.0.19', CF45: 'v0.0.20', CF59: 'v0.0.20', CF61: 'v0.0.21 A', CF73: 'v0.0.21 D', CF74: 'v0.0.22 A', CF84: 'v0.0.22 D', CF85: 'v0.0.23 A', CF98: 'v0.0.23 C', CF100: 'v0.0.24 stage 0', CF123: 'v0.0.24 E' };
      const wrong = Object.entries(want).filter(([id, v]) => by[id] !== v).map(([id, v]) => ({ id, want: v, got: by[id] }));
      const rounds = GAUGE_ROWS.map(r => (r.by ?? '').split(' ')[0]), num = (v) => Number(v.split('.')[2]);
      const none = GAUGE_ROWS.filter(r => !/^v0\.0\.\d+( |$)/.test(r.by ?? '')).map(r => r.id);
      const back = rounds.flatMap((v, i) => (i && num(v) < num(rounds[i - 1]) ? [GAUGE_ROWS[i].id] : []));
      // (v0.0.26's stage 0: the rounds run to the last gauge homed or, while a round's gauges are frozen and not yet homed
      // (tests/breach-done.mjs), to that round's last: its row is there before its first gauge is)
      const covered = GAUGE_ROUNDS[0].from === 1 && GAUGE_ROUNDS.at(-1).to === Math.max(GAUGE_LAST, BREACH_LAST) && GAUGE_ROUNDS.every((r, i) => !i || r.from === GAUGE_ROUNDS[i - 1].to + 1);
      const counts = {};
      for (const v of rounds) counts[v] = (counts[v] ?? 0) + 1;
      console.log(`      ${GAUGE_ROWS.length} gauges by round: ${Object.entries(counts).map(([v, n]) => `${v} ${n}`).join(', ')}`);
      assert(!wrong.length && !none.length && !back.length && covered, JSON.stringify({ wrong, none, back, covered }));
    },
  },
  {
    name: 'v0.0.25\'s gauges frozen (its build sheet §2 step 5, §8): tests/wreck-done.mjs lists F124 to F137 in order, one row a gauge with its files, owner and when, and they follow house-done\'s last homed gauge (GAUGE_LAST 123 until the round\'s last merge homes them; then each must be a house-done row); group P is listed',
    fn() {
      const ns = WRECK_GAUGES.map(g => Number(g.F.slice(1))), rows = new Set(GAUGE_ROWS.map(r => r.id));
      const homed = ns.filter(n => rows.has(`CF${n}`));
      console.log(`      ${WRECK_GAUGES.length} gauges F${WRECK_FIRST} to F${WRECK_LAST}; GAUGE_LAST ${GAUGE_LAST}; homed in house-done ${homed.length}; owners ${[...new Set(WRECK_GAUGES.map(g => g.owner))].join(', ')}; group P ${GROUPS.P ? 'listed' : 'MISSING'}`);
      assert(ns.length === WRECK_LAST - WRECK_FIRST + 1 && ns.every((n, i) => n === WRECK_FIRST + i) && WRECK_GAUGES.every(g => g.what && g.files.length && g.owner && g.when), JSON.stringify(ns));
      // (v0.0.26's stage 0: homed once GAUGE_LAST reaches F137, whatever later rounds add after it)
      assert(GAUGE_LAST === WRECK_FIRST - 1 ? homed.length === 0 : GAUGE_LAST >= WRECK_LAST && homed.length === ns.length, JSON.stringify({ GAUGE_LAST, homed }));
      assert(!!GROUPS.P, 'group P');
    },
  },
  {
    name: 'v0.0.26\'s gauges frozen (its build sheet §2 step 5, §8): tests/breach-done.mjs lists F138 to F149 in order, one row a gauge with its files, owner and when, after house-done\'s last homed gauge (GAUGE_LAST 137 until C\'s merge homes them, then 149 and each a house-done row); GAUGE_ROUNDS names them v0.0.26\'s; group Q is listed with its anchors',
    fn() {
      const ns = BREACH_GAUGES.map(g => Number(g.F.slice(1))), rows = new Set(GAUGE_ROWS.map(r => r.id));
      const homed = ns.filter(n => rows.has(`CF${n}`)), round = GAUGE_ROUNDS.find(r => r.from === BREACH_FIRST);
      const qRows = DONE.filter(r => r.group === 'Q').map(r => r.id);
      console.log(`      ${BREACH_GAUGES.length} gauges F${BREACH_FIRST} to F${BREACH_LAST}; GAUGE_LAST ${GAUGE_LAST}; homed in house-done ${homed.length}; owners ${[...new Set(BREACH_GAUGES.map(g => g.owner))].join(', ')}; their round ${round ? `${round.v} F${round.from} to F${round.to}` : 'MISSING'}; group Q ${GROUPS.Q ? 'listed' : 'MISSING'}, its rows ${qRows.join(', ') || 'none'}`);
      assert(BREACH_FIRST === WRECK_LAST + 1 && ns.length === BREACH_LAST - BREACH_FIRST + 1 && ns.every((n, i) => n === BREACH_FIRST + i) && BREACH_GAUGES.every(g => g.what && g.files.length && g.owner && g.when), JSON.stringify(ns));
      assert(GAUGE_LAST === BREACH_FIRST - 1 ? homed.length === 0 : GAUGE_LAST >= BREACH_LAST && homed.length === ns.length, JSON.stringify({ GAUGE_LAST, homed }));
      assert(round?.to === BREACH_LAST && round.v === 'v0.0.26', JSON.stringify(round));
      assert(!!GROUPS.Q, 'group Q');
    },
  },
];
