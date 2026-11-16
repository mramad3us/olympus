// OLYMPUS tests: the shoot house's runs kept in the browser, bests and GOs, the next sheet up, the weak room (the build sheet v0.0.20 §1 item 20; card C5).
//
// cards/house-runs.js is pure over a storage (a Map-backed one here, as ui-scores hands score.js): localStorage['olympus.house'] =
// { v: 1, runs: [...] }, the last HOUSE_RUNS_MAX, a bad record started afresh; bestsOf by sheet on a scene and a loadout; after a GO
// "Again as" leads with the next sheet up (againOrder); after a NO-GO the weak room's setup (weakRoomOf).
import { assert } from './helpers.mjs';
import { HOUSE_RUNS_KEY, HOUSE_RUNS_MAX, readRuns, keepRun, bestsOf, bestWords, nextUp, againOrder, weakRoomOf } from '../src/ui/cards/house-runs.js';

const store = () => { const m = new Map(); return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) }; };
const SHEETS = ['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone'];

export default [
  {
    name: 'runs kept as { v: 1, runs }, newest last, at most HOUSE_RUNS_MAX; a bad record started afresh; bests and GOs per sheet, by scene and loadout, in the picker\'s words',
    fn() {
      const s = store();
      keepRun(s, { scene: 'test-shoothouse', sheet: 'private', seed: 1, laneMs: 71800, go: false, why: ['pars'] }, { atIso: 'a' });
      keepRun(s, { scene: 'test-shoothouse', sheet: 'private', seed: 2, laneMs: 73100, go: true }, { atIso: 'b' });
      keepRun(s, { scene: 'test-shoothouse', sheet: 'private', seed: 3, laneMs: 69900, go: true, loadout: 'flash' }, { atIso: 'c' });
      keepRun(s, { scene: 'test-shoothouse-live', sheet: 'private', seed: 3, laneMs: 50000, go: true }, { atIso: 'd' });
      const all = bestsOf(readRuns(s).runs, { scene: 'test-shoothouse' }), std = bestsOf(readRuns(s).runs, { scene: 'test-shoothouse', loadout: 'standard' });
      console.log(`      every loadout: ${JSON.stringify(all.private)} "${bestWords(all.private)}"; standard: ${JSON.stringify(std.private)}; none for the tier one: ${bestWords(all.tierone)}`);
      assert(all.private.n === 3 && all.private.bestMs === 69900 && all.private.gos === 2 && std.private.n === 2 && std.private.bestMs === 71800 && bestWords(all.private) === 'best 69.9 s · 2 GO' && bestWords(all.tierone) === null, JSON.stringify({ all, std }));
      for (let i = 0; i < HOUSE_RUNS_MAX + 7; i++) keepRun(s, { scene: 'test-shoothouse', sheet: 'cpl', seed: i, laneMs: 60000 + i, go: i % 2 === 0 }, { atIso: 'x' });
      const r = readRuns(s);
      s.setItem(HOUSE_RUNS_KEY, '{broken');
      console.log(`      after ${HOUSE_RUNS_MAX + 11}: ${r.runs.length} kept, the last seed ${r.runs.at(-1).seed}; a broken record reads ${JSON.stringify(readRuns(s))}`);
      assert(r.runs.length === HOUSE_RUNS_MAX && r.runs.at(-1).seed === HOUSE_RUNS_MAX + 6 && readRuns(s).runs.length === 0, 'the cap and the fresh start');
    },
  },
  {
    name: 'after a GO "Again as" leads with the next sheet up, after a NO-GO as it was; the weak room after a NO-GO is the setup of the leg with the worst row (none for room 1, the lane\'s own start)',
    fn() {
      const again = ['recruit', 'cpl', 'sgt', 'raider', 'tierone'].map(tier => ({ tier }));
      const go = againOrder(again, { go: true, played: 'private', sheets: SHEETS }).map(a => a.tier), nogo = againOrder(again, { go: false, played: 'private', sheets: SHEETS }).map(a => a.tier);
      const legs = [{ state: 'clear', faults: [], parMissed: 0, ms: 9000, parMs: 9000 }, { state: 'clear', faults: [{ kind: 'corner' }], parMissed: 1, ms: 20000, parMs: 17500 }, { state: 'clear', faults: [], parMissed: 0, ms: 10000, parMs: 15000 }, { state: 'clear', faults: [], parMissed: 0, ms: 9000, parMs: 11000 }];
      const w = weakRoomOf(legs), none = weakRoomOf(legs.map(L => ({ ...L, faults: [], parMissed: 0, ms: 1 })));
      console.log(`      a GO as the private: ${go.join(', ')}; a NO-GO: ${nogo.join(', ')}; the next up from the tier one ${nextUp(SHEETS, 'tierone')}; the weak room ${JSON.stringify(w)}; a clean lane's ${JSON.stringify(none)}`);
      assert(go[0] === 'cpl' && nogo[0] === 'recruit' && nextUp(SHEETS, 'tierone') === null && w.setup === 'room:2' && w.word === 'room 2' && none === null, JSON.stringify({ go, nogo, w, none }));
    },
  },
];
