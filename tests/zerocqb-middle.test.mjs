// OLYMPUS tests: hold to hold, F127 (v0.0.25, "Hold to hold"; its build sheet §6 B, §8, item 6; PL§5; BODY §16.6).
//
// On A's Wreck (tests/void-run.mjs), held and printed:
//   1. a floating body is never a dead end: on every free cell of both decks (0.25 m), floating at the deck's height (floatY 1.0) and
//      pushed off the deckhead (1.2), body/freefall.js pushFrom names something to push from along every one of eight bearings (the
//      deck or the deckhead in a compartment of PUSH_LOW_CEIL_M 2.4 m or less, where before a body off the deck with no face behind
//      had nothing);
//   2. the open middle (freefall.js openMiddleOf): floating with no hold and no bulkhead or fixture face within FREEFALL.REACH_M 0.8 m
//      in the plane, the deck and the deckhead never counted: the cells where it holds printed by compartment (the passage, 1.2 m wide,
//      none); never on locked boots or a hold;
//   3. a push-off across the hold's middle at the walk's 0.6 m/s: the open middle held for a stretch past OPEN_MS 1,000 ms, which the
//      lane faults 'open' (C's shoothouse.js houseFault, "Get on a face! Hold to hold."), and none for a body that walks the deck on
//      its boots (the honest lane's way).
import { assert } from './helpers.mjs';
import { wreckOp, runFor } from './void-run.mjs';
import { pushFrom, openMiddleOf, PUSH_LOW_CEIL_M, pushOff } from '../src/sim/body/freefall.js';
import { setAnchor, setOnFace } from '../src/sim/body/footing.js';
import { navOf } from '../src/sim/places/nav.js';
import { standOk } from '../src/sim/places/collide.js';
import { roomOf } from '../src/sim/places/model.js';
import { WRECK } from '../src/data/places/wreck.js';
import { FREEFALL } from '../src/data/body/needs.js';

/** The lane's open-middle fault's time (ms: the build sheet §5's OPEN_MS, shoothouse.js's, C's). */
const OPEN_MS = 1000;

// (every free cell of the Wreck's C0 grid: [x, z], the cell's centre)
function freeCells(s) {
  const g = navOf(s, WRECK.id, 'C0', 4.6, 3.6), out = [];
  for (let j = 0; j < g.nz; j++) for (let i = 0; i < g.nx; i++) {
    const x = g.x0 + (i + 0.5) * g.cellM, z = g.z0 + (j + 0.5) * g.cellM;
    if (standOk(g, x, z)) out.push([x, z]);
  }
  return { g, cells: out };
}

export default [
  {
    name: 'zerocqb-middle (F127): a floating body is never a dead end: on every free cell of both decks, at floatY 1.0 and 1.2, pushFrom names something to push from along all eight bearings',
    fn() {
      const w = wreckOp(), s = w.s, me = w.me(), { g, cells } = freeCells(s), from = {}, bad = [];
      setAnchor(s, w.pid, null);
      for (const fy of [1.0, 1.2]) for (const [x, z] of cells) {
        me.x = x; me.z = z; me.floatY = fy;
        for (let k = 0; k < 8; k++) { const h = k * Math.PI / 4, f = pushFrom(s, me, g, Math.cos(h), Math.sin(h)); from[f] = (from[f] ?? 0) + 1; if (!f && bad.length < 5) bad.push({ x, z, fy, k }); }
      }
      console.log(`      ${cells.length} free cells × 2 heights × 8 bearings: ${Object.entries(from).map(([k, n]) => `${k} ${n}`).join(', ')}; the ceiling ${PUSH_LOW_CEIL_M} m and under`);
      assert(!from.null && !bad.length, JSON.stringify(bad));
    },
  },
  {
    name: 'zerocqb-middle (F127): the open middle is floating with no hold and no bulkhead or fixture face within 0.8 m in the plane, the deck and the deckhead never counted: by compartment, none in the passage; never on boots or a hold',
    fn() {
      const w = wreckOp(), s = w.s, me = w.me(), { g, cells } = freeCells(s), by = {};
      setAnchor(s, w.pid, null);
      for (const [x, z] of cells) {
        me.x = x; me.z = z; me.floatY = 1.0;
        const r = roomOf(WRECK.id, x, z)?.id ?? '(none)', o = openMiddleOf(s, w.pid, g);
        const B = (by[r] ??= { cells: 0, open: 0 }); B.cells++; if (o) B.open++;
      }
      // (on his boots, and on a hold, in the hold's open middle: never)
      const mid = cells.find(([x, z]) => { me.x = x; me.z = z; return x > 60 && roomOf(WRECK.id, x, z)?.id === 'wk.d6.hold' && openMiddleOf(s, w.pid, g); });
      me.x = mid[0]; me.z = mid[1]; delete me.floatY; setAnchor(s, w.pid, 'boots');
      const booted = openMiddleOf(s, w.pid, g);
      setOnFace(s, w.pid, 'deckhead'); setAnchor(s, w.pid, 'boots');
      const upBooted = openMiddleOf(s, w.pid, g);
      console.log(`      ${Object.entries(by).map(([r, b]) => `${r} ${b.open}/${b.cells}`).join(', ')}; the hold's middle at (${mid.map(v => v.toFixed(2))}): booted ${booted}, booted on the deckhead ${upBooted}`);
      assert((by['wk.d5.passage']?.open ?? 0) === 0 && (by['wk.d6.hold']?.open ?? 0) > 0 && !booted && !upBooted, JSON.stringify(by));
    },
  },
  {
    name: 'zerocqb-middle (F127): a push-off across the hold\'s middle at 0.6 m/s holds the open middle past OPEN_MS (the lane\'s \'open\' fault); a body walking the deck on its boots never',
    fn() {
      const w = wreckOp(), s = w.s, me = w.me(), { g, cells } = freeCells(s);
      // (from the hold's dorsal side, a pad-eye's reach off the bulkhead, pushed ventral across the middle)
      const start = cells.filter(([x, z]) => x > 62 && x < 67 && z > 2.6 && z < 3.0 && !openMiddleOf(s, w.pid, g)).sort((a, b) => Math.abs(a[0] - 64.6) - Math.abs(b[0] - 64.6))[0] ?? [64.1, 2.75];
      me.x = start[0]; me.z = start[1]; setAnchor(s, w.pid, null); me.floatY = 1.0; me.locoMs = s.clock.ms;
      const push = pushOff(s, w.pid, [0, 1], FREEFALL.PUSH.SPEEDS_MS.walk, { bus: w.g.bus, grid: g });
      let run = 0, longest = 0;
      runFor(w, [], 160, () => { if (openMiddleOf(s, w.pid, g)) { run += 50; longest = Math.max(longest, run); } else run = 0; });
      // (the same crossing on locked boots, walked at 0.5 m/s by the keys)
      const B = wreckOp(), bme = B.me(); bme.x = start[0]; bme.z = start[1];
      let bOpen = 0;
      for (let i = 0; i < 160; i++) { B.g.step(1, { mz: 1 }); if (openMiddleOf(B.s, B.pid)) bOpen++; }
      console.log(`      pushed off at (${start.map(v => v.toFixed(2))}): ${JSON.stringify({ ok: push.ok, why: push.why })}, the open middle's longest stretch ${longest} ms (OPEN_MS ${OPEN_MS}), the body at (${me.x.toFixed(2)}, ${me.z.toFixed(2)}); walked on boots to (${bme.x.toFixed(2)}, ${bme.z.toFixed(2)}): open ${bOpen} ticks`);
      assert(push.ok && longest > OPEN_MS && bOpen === 0 && bme.z - start[1] > 2, JSON.stringify({ push, longest, bOpen, walked: bme.z - start[1] }));
    },
  },
];
