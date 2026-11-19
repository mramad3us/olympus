// OLYMPUS tests: the reading recruit through every door (v0.0.23, its build sheet item 10, carried FH-1; F92 and F93, heavy).
//
// tests/bots/reader.mjs readerBot is the honest bot (T and the shot the line names) that also walks the keys the instructor names
// out of stop motion, READ_MS after each new line: a new player who does what the drill instructor says. On v0.0.22's words it
// cleared 12 of 36 rooms on the carried lens's 12 lanes (every room 2 and 3 passed at its open door, "D and S" and "Z" walking into
// the wall beside the doorway), on FH-1's path words without the refresh key 29, with both 36. Here the boot recruit and the private
// on 20 set seeds (48213 and 1 to 19), 10 drawn houses (seeds 101 to 110) and 10 eight-room houses (201 to 210): every lane to its
// card, F92 (no room passed at its open door) and F93 (the line never more than a tick behind the legs), the rooms cleared, the walk-in
// times by room (the door open to the threshold crossed) and the verdicts printed. Its floor is its first measure, never loosened.
import { assert } from './helpers.mjs';
import { readerLane, readerGauges } from './flawless-carried.mjs';

const SET = [48213, ...Array.from({ length: 19 }, (_, i) => i + 1)];
const DRAWN = Array.from({ length: 10 }, (_, i) => 101 + i), EIGHT = Array.from({ length: 10 }, (_, i) => 201 + i);
const pct = (xs, p) => { const a = xs.filter(Number.isFinite).sort((x, y) => x - y); return a.length ? a[Math.min(a.length - 1, Math.floor(p * a.length))] : null; };

export default [
  {
    name: 'the reading recruit and private walk through every door by the instructor\'s words on 40 lanes each (20 set, 10 drawn, 10 eight-room): every lane to its card, F92 no room passed at its open door, F93 the line never more than a tick behind the legs (v0.0.22: 12 of 36 rooms on 12 lanes) (heavy)',
    heavy: true,
    timeoutMs: 900_000,
    fn() {
      const recs = [];
      for (const tier of ['recruit', 'private']) {
        for (const seed of SET) recs.push(readerLane({ tier, seed }));
        for (const seed of DRAWN) recs.push(readerLane({ tier, seed, fill: { draw: 'drawn' } }));
        for (const seed of EIGHT) recs.push(readerLane({ tier, seed, fill: { rooms: 'all' } }));
      }
      for (const tier of ['recruit', 'private']) {
        const mine = recs.filter(r => r.cell.includes(`/${tier}/`)), legs = mine.flatMap(r => r.legs);
        const byRoom = [0, 1, 2].map(k => mine.map(r => r.legs[k]?.walkInS).filter(Number.isFinite));
        const verdicts = mine.reduce((o, r) => { const v = String(r.verdict ?? 'none').replace(/^(That is a |GO\.?|NO-GO[.:]?\s*)/, (m) => (/NO-GO/.test(m) ? 'NO-GO ' : 'GO')).trim(); o[v] = (o[v] ?? 0) + 1; return o; }, {});
        console.log(`      ${tier}: ${mine.length} lanes, ${legs.filter(L => L.state === 'clear').length} of ${legs.length} rooms cleared, passed ${legs.filter(L => L.state === 'passed').map(L => L.why).join(', ') || 'none'}; walk-in (door open to the threshold) by room, median/p95 s: ${byRoom.map((xs, k) => `${k + 1} ${pct(xs, 0.5)?.toFixed(2)}/${pct(xs, 0.95)?.toFixed(2)}`).join(', ')}`);
        console.log(`        verdicts ${Object.entries(verdicts).map(([v, n]) => `${v} ${n}`).join('; ')}`);
      }
      const G = readerGauges(recs);
      for (const g of G) { console.log(`      ${g.id} ${g.name}: ${g.met ? 'MET' : 'NOT MET'}, ${g.value}`); for (const b of g.bad.slice(0, 6)) console.log(`        ${b}`); }
      assert(G.every(g => g.met), G.filter(g => !g.met).map(g => `${g.id}: ${g.bad.slice(0, 6).join(' | ')}`).join(' || '));
    },
  },
];
