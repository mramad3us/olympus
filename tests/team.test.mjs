// OLYMPUS tests: the team (src/sim/combat/team.js): role kept apart from side, and team.js the one reader of "whose man" (the build sheet v0.0.19 §0 item 14, §2 step 2).
//
// Stage 0 (the lead) wrote the source scan and the words' check below; the team's track (T) owns this file after, and
// adds its own cases (team §11): the words read from TEAM_WORDS (v0.0.19's TWO_SAY, SAY and CALLS), ownership with and without
// a swap, and planBundle's side kept apart from its slot (the digest case is house-pin's, recorded on v0.0.18's tree).
//   - the scan: no ownership read of a turner's slot in src/sim outside team.js, room.js and corner.js (a read is
//     `.slot ===`, `.slot !==` or `.slot ??` on a turner: T, t, a.T, turnerOf(…), turners.find(…), and room.js
//     manPlace(…)'s side taken as an owner; a write, a copy and a test of presence (`!== undefined`) are allowed, and a
//     plan's sectors, a corner rule or a beat are not turners). It
//     failed on the snapshot of v0.0.18 with 17 reads (contact.js 5, bundle.js 3, instinct/cqb.js 5, shoothouse.js 4), each
//     of which now calls team.js ownerOf or roleAt;
//   - TEAM_WORDS holds bundle.js TWO_SAY's and sidearm.js CALLS' ids and words exactly (team.js writes them as data, so
//     that no module in the cycle reads another's binding at load: the build sheet's §0 item 12).
// (sidearm.js loaded first: on v0.0.18 bundle.js loaded first reaches sidearm.js before its own TWO_SAY, whose CALLS read it at
// load, a TDZ throw that left every later file of the runner's worker unloadable (the integration of v0.0.19, stage 0 on the tag))
import '../src/sim/arms/sidearm.js';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { assert, root } from './helpers.mjs';
import { TEAM_WORDS, ownerOf, roleAt, sideOf, membersOf } from '../src/sim/combat/team.js';
import { TWO_SAY, SAY, planBundle } from '../src/sim/combat/bundle.js';
import { lanePlanOf, doorOfRoom } from '../src/sim/combat/room.js';
import { createGame } from './game.mjs';
import { CALLS } from '../src/sim/arms/sidearm.js';

// (the files whose reads of a slot are the geometry or the side itself, never "whose man")
const ALLOWED = new Set(['src/sim/combat/team.js', 'src/sim/combat/room.js', 'src/sim/combat/corner.js']);
// (a read of a turner's slot that decides ownership: on T or t (a.T, u.T too), on turnerOf(…) or turners.find(…), or a side from room.js manPlace(…) taken as an owner)
// (v0.0.21, the build sheet §1 item 8: and STANDS[…].slot, v0.0.19's slotOfStand's form, which the scan missed: STANDS has no slot now)
const READ = /(?:(?<![\w$])[Tt]|\bmanPlace\([^()]*\)|\bturnerOf\([^()]*\)|\.turners\??\.find\([^()]*\)|\bSTANDS\[[^\]]*\])\??\.slot\s*(?:===|!==|\?\?)(?!\s*undefined)/;

function jsFiles(dir) {
  const out = [];
  for (const n of readdirSync(dir)) {
    const p = path.join(dir, n);
    if (statSync(p).isDirectory()) out.push(...jsFiles(p));
    else if (n.endsWith('.js')) out.push(p);
  }
  return out;
}
// (a line's code: comment lines and a line's trailing comment left out, strings kept)
const codeOf = (line) => (/^\s*(\/\/|\*|\/\*)/.test(line) ? '' : line.replace(/\s\/\/\s.*$/, ''));

export default [
  {
    name: 'no ownership read of a turner\'s slot in src/sim outside team.js, room.js and corner.js: every site asks team.js ownerOf or roleAt (stage 0, the build sheet v0.0.19 §0 item 14; 17 reads on the snapshot of v0.0.18)',
    fn() {
      const files = jsFiles(path.join(root, 'src/sim')).map(f => path.relative(root, f).split(path.sep).join('/')).sort();
      const bad = [], calls = {}, SITES = ['src/sim/combat/contact.js', 'src/sim/combat/bundle.js', 'src/sim/skills/instinct/cqb.js', 'src/sim/combat/two.js'];   // (v0.0.21: the #2's brain moved to combat/)
      for (const f of files) {
        if (ALLOWED.has(f)) continue;
        const lines = readFileSync(path.join(root, f), 'utf8').split('\n');
        lines.forEach((l, i) => {
          const c = codeOf(l);
          if (READ.test(c)) bad.push(`${f}:${i + 1}: ${c.trim().slice(0, 140)}`);
          const n = (c.match(/\b(ownerOf|roleAt|twoOwns)\(/g) ?? []).length;
          if (n && SITES.includes(f)) calls[f] = (calls[f] ?? 0) + n;
        });
      }
      console.log(`      ${files.length - ALLOWED.size} modules scanned; reads of a turner's slot outside team.js: ${bad.length}`);
      console.log(`      calls of ownerOf, roleAt and twoOwns by file: ${Object.entries(calls).map(([f, n]) => `${f.replace('src/sim/', '')} ${n}`).join(', ')}`);
      assert(!bad.length, bad.join('\n'));
      for (const f of SITES) assert(calls[f] > 0, `${f} asks team.js nothing: ${JSON.stringify(calls)}`);
    },
  },
  {
    name: 'TEAM_WORDS is the team\'s words in one table: bundle.js TWO_SAY and SAY and sidearm.js CALLS read from it, each id\'s words equal, "Covering!" yours too (call:covering); the team\'s own ids (the side call, the orders) beside them (v0.0.19, the build sheet §3.2)',
    fn() {
      const rows = [...Object.entries(TWO_SAY).map(([id, w]) => ({ id, w, from: 'TWO_SAY' })), ...Object.entries(CALLS).map(([id, w]) => ({ id, w, from: 'CALLS' })), ...Object.entries(SAY).map(([id, w]) => ({ id, w, from: 'SAY' }))];
      const bad = rows.filter(r => TEAM_WORDS[r.id]?.words !== r.w);
      const own = Object.keys(TEAM_WORDS).filter(id => !rows.some(r => r.id === id));
      console.log(`      ${rows.length} words read from it (TWO_SAY ${Object.keys(TWO_SAY).length}, CALLS ${Object.keys(CALLS).length}, SAY ${Object.keys(SAY).length}): ${rows.map(r => `${r.id} "${r.w}" by ${TEAM_WORDS[r.id]?.by}`).join(', ')}`);
      console.log(`      the team's own: ${own.map(id => `${id} ${JSON.stringify(TEAM_WORDS[id].words)} by ${TEAM_WORDS[id].by}`).join(', ')}`);
      assert(!bad.length, JSON.stringify(bad));
      assert(CALLS['call:covering'] === 'Covering!' && TEAM_WORDS['call:covering'].by === 1, JSON.stringify(CALLS));
      assert(['side', 'bangit', 'breacherup', 'belay'].every(id => own.includes(id)), JSON.stringify(own));
      const one = membersOf({ player: { id: 'p1' } }), two = membersOf({ player: { id: 'p1' }, armoury: { range: { house: { twoPid: 'p9', two: { pid: 'p9' } } } } });
      console.log(`      membersOf: alone ${JSON.stringify(one)}; with a #2 ${JSON.stringify(two.map(m => ({ role: m.role, pid: m.pid })))}`);
      assert(one.length === 1 && one[0].role === 1 && one[0].pid === 'p1' && two.length === 2 && two[1].role === 2 && two[1].pid === 'p9', JSON.stringify({ one, two }));
      assert(ownerOf(null, { slot: 2 }) === 2 && ownerOf(null, { slot: 1 }) === 1 && ownerOf(null, {}) === undefined && ownerOf(null, undefined) === undefined, 'ownerOf is T.slot as read where nothing is swapped');
    },
  },
  {
    name: 'with no side swapped, every stand\'s owner is its stand\'s slot, every room and the hall; after a swap at room 2 its stands change hands and no other room\'s do (team.js ownerOf, roleAt, sideOf: the one reader of "whose man", the build sheet v0.0.19 §0 item 14)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'cpl' }), s = g.state, R = s.armoury.range, H = R.house;
      const before = R.turners.map(T => ({ stand: T.stand, slot: T.slot, own: ownerOf(s, T), door: doorOfRoom(T.room) }));
      const doors = lanePlanOf(s).order, ident = doors.every(d => [1, 2].every(k => sideOf(s, d, k) === k && roleAt(s, d, k) === k));
      H.two.side = { 'o:w4:r2': 1 };
      const after = R.turners.map(T => ({ stand: T.stand, slot: T.slot, own: ownerOf(s, T), door: doorOfRoom(T.room) }));
      console.log(`      before: ${before.map(x => `${x.stand} ${x.slot}→${x.own}`).join(', ')}`);
      console.log(`      room 2 swapped: ${after.map(x => `${x.stand} ${x.slot}→${x.own}`).join(', ')}; sideOf room 2: you ${sideOf(s, 'o:w4:r2', 1)}, your #2 ${sideOf(s, 'o:w4:r2', 2)}`);
      assert(ident && before.every(x => x.own === x.slot), JSON.stringify(before));
      assert(after.every(x => (x.door === 'o:w4:r2' ? x.own === 3 - x.slot : x.own === x.slot)), JSON.stringify(after));
      assert(sideOf(s, 'o:w4:r2', 1) === 2 && sideOf(s, 'o:w4:r2', 2) === 1 && roleAt(s, 'o:w4:r2', 1) === 2 && sideOf(s, 'o:w4:r1', 1) === 1, 'the map and its inverse');
    },
  },
  {
    name: 'planBundle with side equal to slot is the plan with no side given (v0.0.18\'s: tests/house-pin.test.mjs holds its lanes to the tick), every door, row, rung and slot; with the other side the walk in ends on the other point, the approach still on his own stack (role kept apart from side)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go' }), s = g.state, L = lanePlanOf(s), two = s.armoury.range.house.two.pid;
      let n = 0, differ = 0;
      const rows = ['stack:up', 'stack:point', 'room:in', 'room:dominate', 'room:clear'];
      for (const door of L.order) for (const id of rows) for (const rung of [0, 1, 2, 3, 4]) for (const [pid, slot] of [[s.player.id, 1], [two, 2]]) {
        const a = planBundle(s, pid, id, { door, slot, rung, atMs: s.clock.ms }), b = planBundle(s, pid, id, { door, slot, side: slot, rung, atMs: s.clock.ms });
        n++;
        if (JSON.stringify(a) !== JSON.stringify(b)) differ++;
      }
      const P = L.plans['o:w4:r1'], own = planBundle(s, two, 'room:in', { door: 'o:w4:r1', slot: 2, rung: 4, atMs: s.clock.ms }), swapped = planBundle(s, two, 'room:in', { door: 'o:w4:r1', slot: 2, side: 1, rung: 4, atMs: s.clock.ms });
      const end = (p) => p.beats.find(b => b.key === 'enter')?.path?.at(-1);
      console.log(`      ${n} plans compared, ${differ} differ; the #2's room 1 entry ends at ${JSON.stringify(end(own))} (his point ${JSON.stringify(P.points[1])}), on the other side at ${JSON.stringify(end(swapped))} (yours ${JSON.stringify(P.points[0])}), its beats' side ${swapped.side}`);
      assert(differ === 0 && n === 200, JSON.stringify({ n, differ }));
      assert(Math.hypot(end(own)[0] - P.points[1][0], end(own)[1] - P.points[1][1]) < 0.05 && Math.hypot(end(swapped)[0] - P.points[0][0], end(swapped)[1] - P.points[0][1]) < 0.05 && swapped.side === 1 && own.side === undefined, JSON.stringify({ own: end(own), swapped: end(swapped) }));
    },
  },
];
