// What a marine carries and where every item is (src/sim/arms/kit.js; TECH §6.7; the build sheet 0.0.5 §5.1): every item held once by a real holder through an issue, a string's handling, a drop and a pickup; move the only writer of a holder and the holder index rebuilt equal after a load; the spares in reach order, the fullest believed first; a dropped magazine the same record picked up.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { assert } from './helpers.mjs';
import { armsWorld } from './arms-world.mjs';
import { checkIds, checkHolders } from './ids-check.mjs';
import { codeOnly } from './syntax.test.mjs';
import { root } from './helpers.mjs';
import { copyState, resetDomains, toJSON } from '../src/core/state.js';
import { move, holderOf, rebuildHolders, sparesOf, dumpOf, pouchFor, lyingOf, kitView, KIT_TEMPLATES } from '../src/sim/arms/kit.js';
import { doAction } from '../src/sim/arms/firearms.js';
import { runMacro } from '../src/sim/arms/drills.js';
import { createGame } from './game.mjs';
import { earsOn, SLOTS } from '../src/sim/arms/kit.js';

// (the weapons domain's declarations, as the build sheet's §2.6 gives them, for the id walk)
const ARMS_IDS = { idMaps: { items: 'i', 'armoury.guns': 'i', people: 'p', 'places.sites': 'place' }, idFields: { 'people{}.kit.worn{}': 'i', 'people{}.kit.hands[]': 'i', 'items{}.mag': 'i', 'items{}.holds[]': 'i', 'stop.gun': 'i', 'places.sites{}.items[].id': 'i', 'actors.area': 'place', 'player.id': 'p', 'player.actor': 'a' } };

export default [
  {
    name: 'every item held exactly once and every holder real, through the issue, a string\'s handling, a magazine dropped on the ground and one into the dump pouch',
    fn() {
      const W = armsWorld({ wh: 10 }), { state, bus, pid, gunId } = W;
      const counts = [];
      const walk = (when) => {
        const h = checkHolders(state), ids = checkIds(state, [ARMS_IDS]);
        counts.push(`${when}: ${h.items} items, ${h.holders} holders`);
        assert(!h.invalid.length && !ids.invalid.length && !ids.dangling.length, `${when}: ${JSON.stringify({ h: h.invalid, invalid: ids.invalid, dangling: ids.dangling })}`);
      };
      walk('issued');
      runMacro(state, bus, { macro: 'load', pid, gunId }); walk('loaded');
      runMacro(state, bus, { macro: 'ready', pid, gunId }); walk('made ready');
      doAction(state, bus, { pid, gunId, action: 'magOut:drop', force: { 'magOut:drop': 'pass' } }); walk('a magazine dropped');
      assert(lyingOf(state, 'melas.ground').length === 1, 'the magazine lies on the ground');
      runMacro(state, bus, { macro: 'load', pid, gunId }); walk('another in');
      doAction(state, bus, { pid, gunId, action: 'magOut:dump', force: { 'magOut:dump': 'pass' } }); walk('dumped');
      console.log(`      ${counts.join('; ')}`);
      // (a broken holding is found: an item in two places, and one in none)
      const B = armsWorld({}), s = B.state;
      s.items.i5.holds = ['i8'];                                    // (i8 in its own pouch and in the dump pouch too)
      delete s.people.p1.kit.worn.head;                             // (the ear defenders, worn by nobody)
      const bad = checkHolders(s);
      console.log(`      a broken holding: ${bad.invalid.join('; ')}`);
      assert(bad.invalid.some(x => x.includes('i9') && x.includes('held by nothing')) && bad.invalid.some(x => x.includes('i8') && x.includes('held 2 times')), 'an item held by nothing and one held twice are found');
    },
  },
  {
    name: 'move is the one writer of a holder (no other module in src writes a holder field), and the holder index is rebuilt equal after a save and a load',
    fn() {
      const W = armsWorld({ wh: 10 }), { state, bus, pid, gunId } = W;
      runMacro(state, bus, { macro: 'load', pid, gunId });
      doAction(state, bus, { pid, gunId, action: 'magOut:drop', force: { 'magOut:drop': 'pass' } });
      const before = JSON.stringify(Object.fromEntries(Object.entries(state.$items.holder).sort()));
      resetDomains();  // (a bare state: no game's domains on its load; a createGame earlier in the run leaves its registry)
      const loaded = copyState(state);
      assert(!loaded.$items, 'the index is runtime: not in the save');
      rebuildHolders(loaded);
      const after = JSON.stringify(Object.fromEntries(Object.entries(loaded.$items.holder).sort()));
      assert(before === after, `rebuilt equal:\n${before}\n${after}`);
      assert(toJSON(loaded) === toJSON(state), 'the save round-trips');
      // (a scan of src: a holder field written anywhere but kit.js)
      const files = [];
      const each = (dir) => readdirSync(dir).flatMap(f => { const p = path.join(dir, f); return statSync(p).isDirectory() ? each(p) : p.endsWith('.js') ? [p] : []; });
      const WRITES = [/\.mag\s*=(?!=)/, /\.holds\s*=(?!=)/, /\.holds\.(push|splice|unshift)\(/, /\.worn\.[a-z]+\s*=(?!=)/, /\.worn\[[^\]]+\]\s*=(?!=)/, /\.hands\[[^\]]+\]\s*=(?!=)/, /sites\[[^\]]+\]\.items\s*=(?!=)/, /\.items\.push\(/];
      const bad = [];
      for (const f of each(path.join(root, 'src'))) {
        const rel = path.relative(root, f);
        if (rel === 'src/sim/arms/kit.js') continue;
        const code = codeOnly(readFileSync(f, 'utf8'));
        code.split('\n').forEach((line, i) => { for (const re of WRITES) if (re.test(line)) bad.push(`${rel}:${i + 1}: ${line.trim()}`); });
        files.push(rel);
      }
      console.log(`      ${files.length} modules scanned for a holder written outside kit.js: ${bad.length ? bad.join('; ') : 'none'}`);
      assert(!bad.length, `holders written outside kit.js: ${bad.join('\n')}`);
    },
  },
  {
    name: 'the spares in reach order, the fullest believed first; the dump pouch takes the empties; a dropped magazine is the same record picked up',
    fn() {
      const W = armsWorld({ wh: 10 }), { state, bus, pid, gunId, magIds } = W;
      const [m1, m2, m3] = magIds;
      assert(JSON.stringify(sparesOf(state, pid, 'had30')) === JSON.stringify([m1, m2, m3]), `full: reach order ${sparesOf(state, pid, 'had30')}`);
      state.items[m1].belief = { n: 2 }; state.items[m2].belief = { n: 4, approx: true }; delete state.items[m3].belief;
      const order = sparesOf(state, pid, 'had30');
      console.log(`      believed 2, ≈4, unknown: ${order.join(', ')}; the dump pouch ${dumpOf(state, pid)}, a pouch with room ${pouchFor(state, pid)}`);
      assert(JSON.stringify(order) === JSON.stringify([m2, m1, m3]), 'the fullest believed first, unknown after the known');
      // (dropped and picked up: the same record)
      runMacro(state, bus, { macro: 'load', pid, gunId });
      const inGun = state.items[gunId].mag, rec = state.items[inGun];
      doAction(state, bus, { pid, gunId, action: 'magOut:drop', force: { 'magOut:drop': 'pass' } });
      const lying = lyingOf(state, 'melas.ground');
      assert(lying.length === 1 && lying[0].id === inGun && holderOf(state, inGun).ground, `lying: ${JSON.stringify(lying)}`);
      move(state, inGun, { container: dumpOf(state, pid) });
      assert(state.items[inGun] === rec && holderOf(state, inGun).container === dumpOf(state, pid) && !lyingOf(state, 'melas.ground').length, 'picked up into the dump pouch: the same record');
      const view = kitView(state, pid);
      console.log(`      I: ${view.groups.map(g => `${g.word}: ${g.items.map(i => `${i.word} ${i.n === null ? '?' : `${i.approx ? '≈' : ''}${i.n}`}`).join(', ') || 'empty'}`).join(' | ')}; sling ${JSON.stringify(view.sling)}`);
      assert(view.groups.every(g => g.items.every(i => !('truth' in i))) && view.sling.gunId === gunId, 'kitView: believed counts, the sling');
      // (the moves that are refused)
      const F = armsWorld({ wh: 10 });
      runMacro(F.state, F.bus, { macro: 'load', pid: F.pid, gunId: F.gunId });
      let refused = 0;
      for (const [id, to] of [[F.magIds[2], { gun: F.gunId }], [F.gunId, { container: 'i3' }], ['i9', { pid: F.pid, slot: 'carrier' }]]) { try { move(F.state, id, to); } catch { refused++; } }
      assert(refused === 3, 'a magazine into a loaded gun, a rifle into a pouch, a second carrier: refused');
      assert(KIT_TEMPLATES['range-fam'].mags.length === 3, 'the range\'s issue: three magazines');
    },
  },
  {
    name: 'test-range\'s issue (0.0.7): the range-kd kit, the R-7 with its zero drawn, the carrier, four magazines of three, ear defenders in their own slot (kit.worn.ears, SLOTS\' last, so the other kits\' ids stand); the relay drawn the same',
    fn() {
      const g = createGame({ scenario: 'test-range', seed: 48213 }), s = g.state, pid = s.player.id, kit = s.people[pid].kit;
      const T = KIT_TEMPLATES['range-kd'], gun = s.items[kit.worn.sling], ears = s.items[kit.worn.ears];
      const mags = Object.values(s.items).filter(i => i.type === 'mag' && (i.n === 3)).length;
      console.log(`      SLOTS ${SLOTS.join(', ')}; worn ${JSON.stringify(kit.worn)}; the rifle's zero ${JSON.stringify(gun.zero ?? null)}, turrets ${JSON.stringify(gun.sight ?? null)}, lever ${gun.optic ?? 1}; ears ${ears?.model}; earsOn ${earsOn(s, pid)}; magazines of three in the game ${mags}`);
      assert(SLOTS.at(-1) === 'ears' && T.worn.ears === 'ed1' && ears?.type === 'ears' && earsOn(s, pid), 'the ear defenders in their slot');
      assert(T.mags.length === 4 && T.mags.every(([f, n]) => f === 'had30' && n === 3), 'four magazines of three');
      assert(mags === 4 * 6, `the player and the five of the relay each four magazines of three: ${mags}`);
      const h = createGame({ scenario: 'test-handling', seed: 48213 });
      assert(!earsOn(h.state, h.state.player.id), 'test-handling\'s ear defenders stay where v0.0.6 put them (worn.head): no muffle');
    },
  },
];
