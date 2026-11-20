// OLYMPUS tests: upkeep and the books in a save (the build sheet v0.0.28 §6 A, F179's gun half): a fouled, dusty rifle with a warm barrel and a lost pin, the records signed out and a magazine reported lost, saved and loaded byte for byte with ids-check clean; a clean saved half-way carried on to the same gun; v0.0.27's saves load with nothing written.
//
// Every field upkeep and the books write is plain data on the gun, in state.armoury.guns, state.armoury.lost and the clean's
// time.doing.args (its gunId): a save carries them as they are and a load reads them back with no upgrade (the fields are additive and
// absent by default, so a save made before them loads inert). The sandbox with the range's rifle materialised on the player and the
// gate set is the fixture, as tests/upkeep-clean.test.mjs's.
import { assert } from './helpers.mjs';
import { createGame, stepBudget } from './game.mjs';
import { sheetFor } from './arms-world.mjs';
import { checkIds } from './ids-check.mjs';
import { kdBot } from './bots/kd.mjs';
import { UPKEEP_FIELDS } from './upkeep-gate.test.mjs';
import { materialise, move } from '../src/sim/arms/kit.js';
import { roundFired, dustOver } from '../src/sim/arms/upkeep.js';
import { bookGun, signOut, reportLost } from '../src/sim/arms/armoury.js';
import { startActivity } from '../src/sim/time/activities.js';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';
import { root } from './helpers.mjs';

// (the sandbox, the rifle on the player, the gate set: a game)
function bench(wh = 42) {
  const g = createGame({ scenario: 'sandbox', seed: 48213 }), s = g.state, pid = s.player.id, kit = materialise(s, pid, 'range-fam');
  s.people[pid].skills = sheetFor({ weapons: wh, marksmanship: 10, awareness: 10, fitness: 12 });
  s.armoury.upkeep = true;
  return { g, s, pid, gunId: kit.gunId, magIds: kit.magIds };
}
const fieldsOf = (s) => Object.values(s.items ?? {}).flatMap(it => UPKEEP_FIELDS.filter(k => it && k in it).map(k => `${it.type}.${k}`));

export default [
  {
    name: 'F179 (the gun\'s half): a fouled, dusty rifle with a warm barrel and its pin lost, its record signed out and a magazine reported lost, saves and loads byte for byte, ids-check clean (the records\' people and items named), and carries on the same',
    fn() {
      const a = bench(), s = a.s, gun = s.items[a.gunId], air = { air: 'mars-melas', airC: -10 };
      for (let k = 0; k < 6; k++) roundFired(gun, { ms: s.clock.ms - (6 - k) * 2000, air });
      // (40 minutes prone in a breeze, the port open: the range's issue rifle has GUN_DEFAULTS' wet lube, so 0.12 × 1.5)
      dustOver(gun, { minutes: 40, airDust: 0.5, exposure: 'open', prone: true, mags: a.magIds.map(id => s.items[id]) });
      gun.fault = 'pin';
      bookGun(s, a.gunId, { assignedId: a.pid }); signOut(s, a.gunId, a.pid, a.pid);
      const me = a.g.me(); move(s, a.magIds[2], { ground: { area: s.places.live.area, x: me.x + 30, z: me.z } });
      reportLost(s, a.g.bus, a.magIds[2], { by: a.pid, where: 'the sandbox, 30 m east' });
      const json = a.g.save(), ids = checkIds(JSON.parse(json), a.g.sim.domains);
      const b = createGame({ scenario: 'sandbox', seed: 48213 }); b.load(json);
      const again = b.save();
      a.g.step(40); b.step(40);
      console.log(`      the rifle saved: ${JSON.stringify({ foul: gun.foul, dust: gun.dust, barrelC: gun.barrelC, heatMs: gun.heatMs, fault: gun.fault, lube: gun.lube })}; the record ${JSON.stringify(s.armoury.guns[a.gunId])}`);
      console.log(`      the lost: ${JSON.stringify(s.armoury.lost)}; ${json.length} bytes, loaded and saved again ${again === json ? 'byte for byte' : 'DIFFERENT'}; ids ${ids.checked} checked, ${ids.invalid.length} invalid, ${ids.dangling.length} dangling; 40 ticks on: ${a.g.digest() === b.digest() ? 'the same' : 'DIFFERENT'}`);
      assert(again === json && !ids.invalid.length && !ids.dangling.length && a.g.digest() === b.digest(), JSON.stringify({ invalid: ids.invalid.slice(0, 3), dangling: ids.dangling.slice(0, 3) }));
      assert(gun.foul === 0.0072 && gun.dust === 0.18 && gun.fault === 'pin' && s.armoury.lost.length === 1 && s.armoury.guns[a.gunId].loc === 'out', JSON.stringify(gun));
    },
  },
  {
    name: 'F179 (the gun\'s half): a clean saved behind its splash, half-way (the rifle on the mat), loads and carries on to the same roll, gun, clock and save as the clean never saved',
    fn() {
      const run = (cut) => {
        const a = bench(10); Object.assign(a.s.items[a.gunId], { foul: 0.03, dust: 0.05, cleans: 1, lube: 'dry' });
        const r = startActivity(a.s, a.g.bus, { sim: a.g.sim }, { id: 'clean-rifle', args: { tempo: 'normal' } });
        let g = a.g, half = null;
        if (cut) { g.advance(Infinity, stepBudget(12)); half = { doing: g.state.time.doing?.activity, atMin: (g.state.clock.ms - g.state.time.doing.fromMs) / 60_000 }; const json = g.save(); g = createGame({ scenario: 'sandbox', seed: 48213 }); g.load(json); }
        g.step(1);
        const gun = g.state.items[a.gunId];
        return { start: r, half, digest: g.digest(), gun: JSON.stringify(Object.fromEntries(Object.entries(gun).sort(([x], [y]) => (x < y ? -1 : 1)))), ms: g.state.clock.ms };
      };
      const straight = run(false), saved = run(true);
      console.log(`      a ${straight.start.durMs / 60_000} min clean (${straight.start.kind}): straight ${straight.digest}; saved behind its splash ${saved.half.atMin.toFixed(1)} min in (${saved.half.doing}), loaded and carried on ${saved.digest}; the gun ${saved.gun}`);
      assert(saved.half.doing === 'clean-rifle' && saved.half.atMin > 0 && straight.digest === saved.digest && straight.gun === saved.gun && JSON.parse(saved.gun).cleans === 2 && straight.ms === saved.ms, JSON.stringify({ straight, saved }));
    },
  },
  {
    name: 'F179 (the gun\'s half): v0.0.27\'s KD save (made by its own code) loads with no gate and no upkeep field, saves again byte for byte, and its course carries on with none written',
    fn() {
      const json = gunzipSync(readFileSync(path.join(root, 'tests', 'saves', 'v0.0.27-range-kd.json.gz'))).toString('utf8');
      const g = createGame({ scenario: 'test-range', seed: 48213 }), s = g.load(json), again = g.save();
      const b = kdBot(); g.step(100, b);
      console.log(`      v0.0.27-range-kd: ${json.length} bytes, saved again ${again === json ? 'byte for byte' : 'DIFFERENT'}; the gate ${s.armoury.upkeep ?? 'absent'}, upkeep fields at load ${fieldsOf(JSON.parse(json)).length}, after 100 ticks of the KD bot ${fieldsOf(g.state).length}`);
      assert(again === json && s.armoury.upkeep === undefined && !fieldsOf(g.state).length && !g.errors.length, JSON.stringify(fieldsOf(g.state)));
    },
  },
];
