// The wrist terminal's watch agrees with the wall clocks (quick): ROADMAP §4.4's moment 2, "the wall clock
// and the watch agree", proved on their two helpers rather than on pixels. src/ui/hud/watch.js
// watchFaces(state) and places' src/sim/places/clocks.js wallClockAt(fixture, ms, lonEDeg) read the
// same dates.js marsClock (build sheet 0.0.3 §2.1, §2.4), so on 1,000 random times across a Mars year
// and through every minute of one timeslip they give the same hour and minute ('HH:MM', '24:00' in
// the slip, its hands at 12) and the same slip flag. Until places' clocks.js exists, the comparison
// is against a local fixture of its contract (marsClock's face, built here) and the test says so;
// once it exists the real module is used. Also: the start's faces (Monday, Sol 590 · MY 211, 12:39,
// 'Wed 19 Dec 2351 02:20 UTC') and the slip's badge minutes. The 0.0.4 round's (the build sheet §5.4):
// the splash's clock plaque reads the same helper at the time shown (watchFaces(state, { ms })), so a
// plaque at 02:30 and the watch at 02:30 agree through the slip; and the body strip folded into the
// watch shows only the glyphs whose band has left fine (hud/strip.js foldedOf), in the strip's order,
// none when all is well, each glyph's pixels filled from the bottom to its band (glyphCells).
import { assert } from './helpers.mjs';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { root } from './helpers.mjs';
import { watchFaces } from '../src/ui/hud/watch.js';
import { foldedOf, glyphCells, GLYPHS, STRIP_ORDER, movedOf } from '../src/ui/hud/strip.js';
import { marsClock } from '../src/sim/time/dates.js';
import { stream, next } from '../src/core/rng.js';
import { START_MS } from '../src/data/setting/calendar.js';
import { SOL_MS, MIN_MS } from '../src/core/clock.js';
import { solStartMs } from '../src/core/calendar.js';

const MELAS_LON = 287.2;
const pad2 = (n) => String(n).padStart(2, '0');
// (a state the watch reads: the clock and the live place)
const stateAt = (ms) => ({ clock: { ms }, places: { live: { site: 'melas', area: 'melas.echo.1' } }, actors: { list: [] }, player: {} });

/** places' wallClockAt if it is there, else a fixture of its contract (the sheet's §2.1): { fn, real }. */
async function wallClock() {
  if (existsSync(path.join(root, 'src/sim/places/clocks.js'))) {
    const m = await import('../src/sim/places/clocks.js');
    if (typeof m.wallClockAt === 'function') return { fn: m.wallClockAt, real: true };
  }
  return {
    real: false,
    fn: (fixture, ms, lonEDeg) => {
      const c = marsClock(ms, lonEDeg), hour = c.timeslip ? 24 : c.hour, minute = c.timeslip ? 0 : c.minute;
      return { faces: [{ face: 'melas', hour, minute, slip: c.timeslip, text: `${pad2(hour)}:${pad2(minute)}` }] };
    },
  };
}

export default [
  {
    name: 'the watch and a wall clock read the same Melas time on 1,000 random times and through the timeslip (moment 2: "the wall clock and the watch agree")',
    async fn() {
      const { fn, real } = await wallClock();
      const fixture = { id: 'f:test:clock', kind: 'wallClock', faces: ['melas'] };
      const r = stream('ui-watch', 1);
      const times = Array.from({ length: 1000 }, () => START_MS + Math.floor(next(r) * 669 * SOL_MS));
      // (every minute of the slip after the start's sol, and the minute either side of it)
      const slip0 = solStartMs(START_MS, MELAS_LON) + SOL_MS - 2_375_244 - MIN_MS;
      for (let t = slip0; t < slip0 + 2_375_244 + 2 * MIN_MS; t += MIN_MS / 2) times.push(t);
      let bad = [], slipSeen = 0;
      for (const ms of times) {
        const w = watchFaces(stateAt(ms), { lonEDeg: MELAS_LON });
        const face = fn(fixture, ms, MELAS_LON).faces.find(f => f.face === 'melas');
        const text = face.text ?? `${pad2(face.hour)}:${pad2(face.minute)}`;
        if (w.slip) slipSeen++;
        if (text !== w.time || !!face.slip !== w.slip) bad.push({ ms, watch: w.time, wall: text, slip: [w.slip, face.slip] });
      }
      console.log(`      ${times.length} times compared against ${real ? "places' clocks.js wallClockAt" : "a local fixture of wallClockAt's contract (places' clocks.js not there yet)"}: ${bad.length} disagree; ${slipSeen} in the timeslip (24:00 on both)`);
      assert(!bad.length, JSON.stringify(bad.slice(0, 5)));
      assert(slipSeen >= 70, `the slip was crossed (${slipSeen} samples in it)`);
    },
  },
  {
    name: 'the watch at the start: 12:39 on Monday, Sol 590 · MY 211, Wed 19 Dec 2351 02:20 UTC on its second line; in the slip 24:00 with the minutes into it',
    fn() {
      const w = watchFaces(stateAt(START_MS), { lonEDeg: MELAS_LON });
      console.log(`      ${w.time} · ${w.weekday} · ${w.sol} · ${w.utc}`);
      assert(w.time === '12:39' && w.weekday === 'Monday' && w.sol === 'Sol 590 · MY 211' && w.utc === 'Wed 19 Dec 2351 02:20 UTC' && !w.slip, JSON.stringify(w));
      const w40 = watchFaces(stateAt(START_MS + 25_665), { lonEDeg: MELAS_LON });
      assert(w40.time === '12:40', `25.665 s later: ${w40.time}`);
      const slipStart = solStartMs(START_MS, MELAS_LON) + 86_400_000;
      const s12 = watchFaces(stateAt(slipStart + 12 * MIN_MS + 5000), { lonEDeg: MELAS_LON });
      console.log(`      12 min into the slip: ${s12.time} TIMESLIP +${s12.slipMin} (${s12.weekday}, ${s12.sol})`);
      assert(s12.slip && s12.time === '24:00' && s12.slipMin === 12, JSON.stringify(s12));
    },
  },
  {
    name: 'the splash\'s plaque reads the watch\'s helper at the time shown: the same faces as the watch at that time, the slip included',
    fn() {
      const base = stateAt(START_MS);
      let bad = 0;
      const slip = solStartMs(START_MS, MELAS_LON) + 86_400_000 + 5 * MIN_MS;
      for (const ms of [START_MS, START_MS + 3_600_000, slip, START_MS + 13 * 3_600_000]) {
        const a = watchFaces(base, { lonEDeg: MELAS_LON, ms }), b = watchFaces(stateAt(ms), { lonEDeg: MELAS_LON });
        if (a.time !== b.time || a.slip !== b.slip || a.slipMin !== b.slipMin || a.sol !== b.sol) bad++;
      }
      const p = watchFaces(base, { lonEDeg: MELAS_LON, ms: slip });
      console.log(`      4 times shown against the watch at them: ${bad} disagree; in the slip the plaque reads ${p.slip ? `24:00 +${p.slipMin}` : p.time}`);
      assert(!bad && p.slip && p.slipMin === 5, JSON.stringify(p));
    },
  },
  {
    name: 'the body strip folded into the watch: only the glyphs whose band has left fine, in the strip\'s order, none when all is well; a glyph filled from the bottom to its band',
    fn() {
      const fine = STRIP_ORDER.map(n => ({ need: n, band: 'fine', fill: 0, tone: 'fine' }));
      const some = fine.map(e => (e.need === 'grime' ? { ...e, band: 'unwashed', fill: 3, tone: 'warn' } : e.need === 'water' ? { ...e, band: 'thirsty', fill: 1, tone: 'warn' } : e.need === 'food' ? { ...e, band: 'clean', fill: 1, tone: 'fine' } : e));
      const f0 = foldedOf(fine), f1 = foldedOf(some.slice().reverse());
      console.log(`      all fine: ${f0.length} glyphs; thirsty and unwashed (and a fill-1 fine band): ${f1.map(e => `${e.need} ${e.band}`).join(', ')}`);
      assert(f0.length === 0 && f1.map(e => e.need).join() === 'water,grime', JSON.stringify(f1));
      const rows = (cells) => Array.from({ length: 5 }, (_, y) => Array.from(cells.slice(y * 5, y * 5 + 5)).join('')).join(' ');
      console.log(`      the drop at fill 0: ${rows(glyphCells('water', 0))}; at fill 2: ${rows(glyphCells('water', 2))}; at fill 5: ${rows(glyphCells('water', 5))}`);
      const c2 = glyphCells('water', 2);
      for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
        const ink = GLYPHS.water[y][x] === '1', v = c2[y * 5 + x];
        assert(ink ? v === (y >= 3 ? 2 : 1) : v === 0, `the drop's pixel ${x},${y}: ${v}`);
      }
      const m = movedOf({ strip: some }, fine);
      assert(m.map(x => x.need).join() === 'water,food,grime', JSON.stringify(m.map(x => x.need)));
    },
  },
];
