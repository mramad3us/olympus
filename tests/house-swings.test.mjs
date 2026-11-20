// OLYMPUS tests: the drawn house's doors, push or pull with the latch toward you (the build sheet v0.0.21 §1 item 2, §6; house lens H4; F62's doors; the user, 2026-11-15: "doors should have a direction they open (pull or push) and it should affect our options for entry").
//
// Each lane door is drawn push or pull (SWING_W 50/50) and hinged at its downrange (west) end, so its latch and its stack face the
// team as it comes: a hinge drawn freely put the stack beyond the door and stalled every lane for 361.5 s (the house lens §0 item 5).
// Quick: over seeds 1 to 40 every lane position meets a push and a pull; on four drawn lanes (F62's doors, tests/flawless-drawn-a.mjs)
// every door is hinged west, its stack uprange, Kick struck at a pull ("opens toward you") and live at a push, and "Read the door"
// says the drawn leaf ("Pull door, hinge right." south of the hall). Heavy: the honest tier one on 40 drawn seeds, F1, F3, F4, F25
// and F26 met (tests/flawless.mjs, as on the set). F3 is judged here on each lane's own area (drawnF3: flawless.mjs flawlessPaths
// builds the set's lane for its grid, so a drawn lane's seen paths read the set's walls there: the outside edit in .run/v021/a.md).
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { f62Doors } from './flawless-drawn-a.mjs';
import { flawlessLane, gaugeOf } from './flawless.mjs';
import { drawHouse, parseHouse, drawnCodeOf, assembleHouse } from '../src/sim/scenes/assemble.js';
import { openNavOf, clearLine as navClear } from '../src/sim/places/nav.js';
import { standOk } from '../src/sim/places/collide.js';

// (four seeds whose lanes hold both swings and both sides between them: 1, 2, 4 and 48213)
// (a blocked cell's cost on the nav grid: flawless.mjs's NAV_BLOCKED, nav.js's BLOCKED)
const NAV_BLOCKED = 255;
const QUICK_SEEDS = Object.freeze([1, 2, 4, 48213]);

// (F3 on a drawn lane's own grid (see the header): every authored path and far walk of each seed's house and every move path the
// lane saw, leg by leg clear on its C0 grid with the doors open, a first leg from a body against a wall judged by the walker's rule,
// as flawless.mjs flawlessPaths does on the set)
function drawnF3(recs) {
  const out = { legs: 0, cut: [], wallStart: 0 };
  for (const r of recs) {
    const A = assembleHouse(drawnCodeOf(r.seed)), G = openNavOf(A.area.id, 'C0');
    const blocked = (x, z) => { const i = Math.floor((x - G.x0) / G.cellM), j = Math.floor((z - G.z0) / G.cellM); return i < 0 || j < 0 || i >= G.nx || j >= G.nz || G.cost[j * G.nx + i] === NAV_BLOCKED; };
    const check = (what, path, seen) => {
      for (let i = 1; i < path.length; i++) {
        out.legs++;
        const a = path[i - 1], b = path[i];
        if (navClear(G, a[0], a[1], b[0], b[1])) continue;
        const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.01));
        let walker = false;
        for (let k = 0; k <= n && !walker; k++) walker = !standOk(G, a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n);
        if (seen && i === 1 && blocked(a[0], a[1]) && standOk(G, a[0], a[1]) && !walker) { out.wallStart++; continue; }
        out.cut.push(`${r.seed} ${what} ${JSON.stringify(a)}→${JSON.stringify(b)}${walker ? ' (the walker too)' : ''}`);
      }
    };
    for (const k of A.plans.order) { const P = A.plans.plans[k]; for (const [slot, path] of Object.entries(P.paths)) check(`${k} paths[${slot}]`, path, false); if (P.far) check(`${k} far`, P.far.path, false); }
    for (const v of r.paths?.values() ?? []) check(`${v.who} ${String(v.step).replace(/>.*$/, '')}`, v.path, true);
  }
  return out;
}

export default [
  {
    name: 'over seeds 1 to 40 every lane position meets a push and a pull; on four drawn lanes every door hinged west (downrange), its stack uprange, Kick struck at a pull and live at a push, "Read the door" the drawn leaf\'s words (F62\'s doors)',
    fn() {
      const met = [new Set(), new Set(), new Set()];
      for (let seed = 1; seed <= 40; seed++) parseHouse(drawHouse(seed)).rooms.forEach((R, k) => met[k].add(R.how));
      const lanes = QUICK_SEEDS.map(seed => { const g = createGame({ scenario: 'test-shoothouse', seed, tier: 'private', draw: 'drawn' }); return { seed, code: g.state.armoury.range.house.draw.code, F: f62Doors(g.state) }; });
      for (const l of lanes) console.log(`      ${l.seed} ${l.code}: ${l.F.doors.map(d => `${d.door} ${d.how} hinge ${d.hinge} "${d.words}" Kick ${d.kick ?? '(open)'}${d.locked ? ' locked' : ''}${d.stack ? '' : ' STACK DOWNRANGE'}`).join('; ')}`);
      const both = met.every(s => s.has('push') && s.has('pull')), bad = lanes.flatMap(l => l.F.bad.map(b => `${l.seed}: ${b}`)), kinds = new Set(lanes.flatMap(l => l.F.doors.map(d => `${d.how}/${d.hinge}`)));
      console.log(`      seeds 1 to 40: room 1 ${[...met[0]].join(' and ')}, room 2 ${[...met[1]].join(' and ')}, room 3 ${[...met[2]].join(' and ')}; the four lanes' doors ${[...kinds].join(', ')}; off ${bad.length}${bad.length ? `: ${bad.join('; ')}` : ''}`);
      assert(both && !bad.length && kinds.size === 4, JSON.stringify({ both, bad, kinds: [...kinds] }));
    },
  },
  {
    name: 'your #2 never held inside a doorway: the honest tier one on drawn seed 23, room 1\'s mouth on your heels and room 3\'s door out to the hall, not a still tick in a live zone (the build sheet v0.0.28 item 21, F4\'s #2 clause; three ticks of 50 ms before the hold looked ahead)',
    fn() {
      const r = flawlessLane({ tier: 'tierone', seed: 23, fill: { draw: 'drawn' } });
      console.log(`      drawn seed 23, the honest tier one: to the card ${r.done}, the lane ${r.laneS?.toFixed(1)} s; your #2 still in a live zone ${(r.door.twoMs / 1000).toFixed(2)} s, longest ${(r.door.twoLongestMs / 1000).toFixed(2)} s at once (0.15 s and 0.05 s before the fix: 8.70 s at room 1's mouth, 38.40 and 38.50 s at room 3's door)`);
      assert(r.done && r.door.twoMs === 0, JSON.stringify({ done: r.done, twoMs: r.door.twoMs, longest: r.door.twoLongestMs }));
    },
  },
  {
    name: '(heavy) the honest tier one on 40 drawn seeds: F1, F3, F4, F25 and F26 met as on the set',
    heavy: true,
    timeoutMs: 15 * 60_000,
    fn() {
      const recs = Array.from({ length: 40 }, (_, i) => flawlessLane({ tier: 'tierone', seed: i + 1, fill: { draw: 'drawn' } }));
      const f3 = drawnF3(recs), rows = gaugeOf(recs).filter(r => ['F1', 'F4', 'F25', 'F26'].includes(r.id));
      rows.splice(1, 0, { id: 'F3', name: 'paths walkable (each lane on its own area)', met: !f3.cut.length, value: `${f3.cut.length} of ${f3.legs} legs not clear on the lane's C0 grid; first legs from a body against a wall, by the walker ${f3.wallStart}${f3.cut.length ? ` (${f3.cut.slice(0, 3).join('; ')})` : ''}` });
      for (const r of rows) console.log(`      ${r.id} ${r.met ? 'MET' : 'MISSED'} ${r.name}: ${r.value}`);
      console.log(`      ${recs.length} lanes, ${recs.filter(r => r.done).length} to the card; the lane ${Math.min(...recs.map(r => r.laneS ?? Infinity)).toFixed(1)} to ${Math.max(...recs.map(r => r.laneS ?? 0)).toFixed(1)} s`);
      assert(rows.length === 5 && rows.every(r => r.met), JSON.stringify(rows.filter(r => !r.met)));
    },
  },
];
