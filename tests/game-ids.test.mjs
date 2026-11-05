// Ids (src/core/ids.js; TECH §2.3.1, §2.3.2): one grammar per kind and its validator, the order
// (p9 before p10), the cached sorted ids of an id-keyed map kept by put and drop, and a sandbox save
// walked by tests/ids-check.mjs with nothing invalid or dangling.
import { assert, fmt } from './helpers.mjs';
import { ID_KINDS, COUNTED, isId, kindOf, numOf, cmpId, nextId, put, drop, ids, setIdsCheck, byDistanceThenId } from '../src/core/ids.js';
import { newState } from '../src/core/state.js';
import { stream, int } from '../src/core/rng.js';
import { checkIds } from './ids-check.mjs';
import { createGame } from './game.mjs';
import { scriptInput } from './game-dummy.mjs';

// (each kind: ids it must take, and near misses it must refuse)
const SAMPLES = {
  p: [['p1', 'p42', 'p233'], ['p0', 'p', 'p01', 'P1', 'p:player', 'me', 'p-1', 'p1a']],
  a: [['a1', 'a7'], ['a0', 'a', 'ai1']],
  i: [['i7', 'i9921'], ['i', 'i:9921', 'i0']],
  e: [['e1', 'e812'], ['e0', 'e', 'e1.5']],
  k: [['k1', 'k37'], ['k0', 'k']],
  n: [['n1', 'n8812'], ['n0']],
  h: [['h44'], ['h-redwater-1', 'h0']],
  fm: [['fm2'], ['fm', 'fm0']],
  fg: [['fg193'], ['fg']],
  od: [['od77'], ['od']],
  uf: [['uf412'], ['uf']],
  sh: [['sh812'], ['sh']],
  ob: [['ob5521'], ['ob']],
  sv: [['sv12'], ['sv']],
  ai: [['ai88'], ['ai']],
  pr: [['pr1', 'pr5531'], ['pr:5531', 'pr0', 'pr']],
  world: [['w-48213', 'w-48213-2', 'w-0', 'w-legacy'], ['w48213', 'w-', 'w-48213-0', 'w:48213']],
  career: [['c-48213-1', 'c-1-12'], ['c-48213', 'c-48213-0', 'c48213-1']],
  unit: [['2/4', '2/4-E', '2/4-E-2-1', '2/4-E-2-1-ft2', '2/4-E-hq', '2/4-E-weapons'], ['u-1-2-E-2-4', '1/2/E/2/4', 'E/2/1', '2/4-', '2/4-e-2']],
  spot: [['f:mess:t14#3', 'f:armoury:rack-e2#14', 'f:t1:rack:01#1'], ['fx:mess:t14:s3', 'f:mess:t14#', 'f:mess#3a']],
  fixture: [['f:e1:rack:07', 'f:t1:rack:01', 'f:mess:t14'], ['fx:mess:t14:s3', 'f:', 'f:E1:rack', 'f-e1-rack']],
  opening: [['o:e1:bay-2-1', 'o:t1:office', 'o:melas:gate-main', 'o:echo:front'], ['o:', 'p:echo:front', 'o:echo::front']],
  link: [['l:hellas:trunk', 'l:echo:stairs-up'], ['l:', 'l-hellas']],
  waypoint: [['w:echo:front', 'w:canopy', 'w:armoury:window'], ['w:', 'w-echo']],
  building: [['b:echo', 'b:mess'], ['b:', 'b-echo']],
  road: [['r:valley', 'r:echo-front'], ['r:', 'r7']],
  place: [['melas', 'melas.echo.1', 'e1.bay-2-1', 'e1.z.bay-2-1', 'test', 'test.rooms', 't1.z.hall'], ['Melas', 'melas..echo', '.melas', 'melas.', 'melas echo', 'melas.-a']],
};

export default [
  {
    name: 'each kind\'s validator takes TECH §2.3.1\'s forms and refuses near misses; kindOf names a string\'s kind',
    fn() {
      const kinds = Object.keys(ID_KINDS);
      assert(kinds.every(k => SAMPLES[k]), `kinds without samples: ${kinds.filter(k => !SAMPLES[k])}`);
      const bad = [];
      let good = 0, refused = 0;
      for (const [k, [yes, no]] of Object.entries(SAMPLES)) {
        for (const s of yes) { if (isId(k, s)) good++; else bad.push(`${k} refused ${s}`); }
        for (const s of no) { if (!isId(k, s)) refused++; else bad.push(`${k} took ${s}`); }
        if (!isId(k, ID_KINDS[k].example)) bad.push(`${k} refused its own example ${ID_KINDS[k].example}`);
      }
      // (kindOf: a counted id is its prefix's even where the place grammar would take it too)
      const want = { p42: 'p', pr5531: 'pr', fm2: 'fm', ai88: 'ai', a7: 'a', 'w-48213': 'world', 'c-48213-1': 'career', '2/4-E-2-1': 'unit',
        'f:mess:t14#3': 'spot', 'f:e1:rack:07': 'fixture', 'o:e1:bay-2-1': 'opening', 'w:echo:front': 'waypoint', 'b:echo': 'building',
        'r:valley': 'road', 'l:hellas:trunk': 'link', 'melas.echo.1': 'place', test: 'place', me: 'place', 'p:player': null, 'P1': null, '': null };
      for (const [s, k] of Object.entries(want)) if (kindOf(s) !== k) bad.push(`kindOf(${JSON.stringify(s)}) = ${kindOf(s)}, not ${k}`);
      assert(kindOf(42) === null && numOf('p42') === 42 && numOf('melas') === null, 'kindOf/numOf on odd input');
      let threw = false; try { isId('person', 'p1'); } catch { threw = true; }
      assert(threw, 'an unknown kind name was accepted');
      assert(!bad.length, bad.join('\n'));
      console.log(`      ${kinds.length} kinds (${COUNTED.length} counted: ${COUNTED.join(' ')}); ${good} good samples taken, ${refused} near misses refused`);
      console.log(`      kindOf: me → ${kindOf('me')} (the place grammar: an alias like it is caught by the walk, not the validator), p:player → ${kindOf('p:player')}`);
    },
  },
  {
    name: 'cmpId: kind, then number, then the rest, so p9 comes before p10; a total order',
    fn() {
      const list = ['p10', 'a2', 'p9', 'pr3', 'p1', 'e1000', 'e812', 'f:t1:rack:10', 'f:t1:rack:9', 'f:t1:rack:09', 'melas.echo.10', 'melas.echo.2', 'w-48213', 'a10', 'i7', 'p100'];
      const got = [...list].sort(cmpId);
      const want = ['a2', 'a10', 'e812', 'e1000', 'f:t1:rack:09', 'f:t1:rack:9', 'f:t1:rack:10', 'i7', 'melas.echo.2', 'melas.echo.10', 'p1', 'p9', 'p10', 'p100', 'pr3', 'w-48213'];
      assert(got.join() === want.join(), got.join(' '));
      // (total: antisymmetric and transitive over a random sample, and 0 only for equal strings)
      const r = stream('cmpId');
      const pool = Array.from({ length: 300 }, () => ['p', 'a', 'pr', 'f:t1:rack:', 'melas.', 'e'][int(r, 6)] + String(int(r, 40)).padStart(int(r, 3) + 1, '0'));
      let bad = 0;
      for (let i = 0; i < 3000; i++) {
        const a = pool[int(r, pool.length)], b = pool[int(r, pool.length)], c = pool[int(r, pool.length)];
        if (Math.sign(cmpId(a, b)) !== -Math.sign(cmpId(b, a))) bad++;
        if ((cmpId(a, b) === 0) !== (a === b)) bad++;
        if (cmpId(a, b) < 0 && cmpId(b, c) < 0 && !(cmpId(a, c) < 0)) bad++;
      }
      assert(bad === 0, `${bad} order violations`);
      const near = [{ id: 'a3', x: 1, z: 0 }, { id: 'a2', x: 0, z: 1 }, { id: 'a10', x: 3, z: 0 }].sort(byDistanceThenId(0, 0)).map(a => a.id);
      assert(near.join() === 'a2,a3,a10', `byDistanceThenId: ${near}`);
      console.log(`      ${got.join(' ')}`);
      console.log(`      3,000 random triples: antisymmetric, transitive, 0 only for equal strings; byDistanceThenId(0, 0): ${near.join(', ')}`);
    },
  },
  {
    name: 'ids(map) equals a fresh cmpId sort over 100,000 random puts and drops, and allocates nothing per call',
    fn() {
      const state = newState(1), map = {};
      const r = stream('ids-fuzz');
      let puts = 0, drops = 0, checks = 0, t = 0;
      const t0 = performance.now();
      for (let i = 0; i < 100_000; i++) {
        const id = `p${1 + int(r, 3000)}`;
        if (int(r, 3) < 2) { put(state, map, id, { id }); puts++; } else { drop(state, map, id); drops++; }
        if (i === 10) ids(map);                                    // (the cache built early, then kept by put and drop)
        if (i % 1000 === 999) {
          const fresh = Object.keys(map).sort(cmpId), cached = ids(map);
          assert(fresh.length === cached.length && fresh.every((x, k) => x === cached[k]), `op ${i}: the cached order differs`);
          checks++;
        }
      }
      const opMs = performance.now() - t0;
      const a = ids(map), b = ids(map);
      assert(a === b, 'ids(map) built a new array for an unchanged map');
      const n = 200_000;
      const t1 = performance.now();
      for (let i = 0; i < n; i++) t += ids(map).length;
      const nsPerCall = (performance.now() - t1) * 1e6 / n;
      assert(!Object.keys(map).includes('$ids') && !JSON.stringify(map).includes('$ids'), 'the cache shows in the map\'s keys or its JSON');
      // (a write that bypasses put is caught by the check mode)
      setIdsCheck(1);
      map.p99999 = { id: 'p99999' };
      let caught = false; try { ids(map); } catch { caught = true; }
      setIdsCheck(0);
      assert(caught, 'a write that bypassed put() was not caught in check mode');
      // (nextId: counters from 1, never reused)
      const s = newState(2);
      const got = [nextId(s, 'p'), nextId(s, 'p'), nextId(s, 'pr'), nextId(s, 'p')];
      assert(got.join() === 'p1,p2,pr1,p3' && s.meta.next.p === 4, got.join());
      let threw = false; try { nextId(s, 'x'); } catch { threw = true; }
      assert(threw, 'nextId took a prefix not in the table');
      console.log(`      ${puts} puts and ${drops} drops in ${fmt(opMs, 1)} ms (${fmt((puts + drops) / opMs, 0)} ops per ms), ${a.length} ids at the end, ${checks} checks against a fresh sort, all equal`);
      console.log(`      ids(map): ${fmt(nsPerCall, 1)} ns a call, the same array each time (${t > 0 ? 'read' : ''}); a write bypassing put caught; nextId ${got.join(', ')}`);
    },
  },
  {
    name: 'a sandbox save (a new game, 600 ticks of scripted input, R\'s wait) has every id valid and none dangling',
    fn() {
      const g = createGame({ seed: 1 });
      g.step(600, (state, me, mem) => scriptInput(state.clock.seq));
      const s = JSON.parse(g.save());
      const r = checkIds(s, g.sim.domains);
      assert(!r.invalid.length && !r.dangling.length, [...r.invalid, ...r.dangling].join('\n'));
      assert(r.byKind.p >= 2 && r.byKind.a >= 2 && r.byKind.place >= 3 && r.byKind.e >= 1, JSON.stringify(r.byKind));
      // (and the walk finds what is wrong: an alias for the player, an actor gone, a bad unit, a dangling area)
      const bad = JSON.parse(g.save());
      bad.player.id = 'me';
      bad.actors.list[0].who = 'p77';
      bad.units['u-1-2-E-2-4'] = { leaderId: 'p1' };
      bad.places.live.area = 'test.nowhere';
      const rb = checkIds(bad, g.sim.domains);
      assert(rb.invalid.length >= 2 && rb.dangling.length >= 2, JSON.stringify(rb));
      const skips = g.facts('skip-end').length;
      console.log(`      ${r.checked} ids checked, ${r.defined} records: ${Object.entries(r.byKind).map(([k, n]) => `${k} ${n}`).join(', ')}; ${skips} skip${skips === 1 ? '' : 's'} taken`);
      console.log(`      a broken save: ${rb.invalid.length} invalid (${rb.invalid.map(x => x.split(':')[0]).join(', ')}), ${rb.dangling.length} dangling (${rb.dangling.map(x => x.split(':')[0]).join(', ')})`);
    },
  },
];
