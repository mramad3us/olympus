// A skill's value, the one pace helper and the drawn sheets (src/sim/skills/skills.js, templates.js; SKILLS §3, §5.12, §11).
import { assert, fmt } from './helpers.mjs';
import { value, own, paceOf, mitigated, SKILLS, SKILL_KEYS, OWN_MAX } from '../src/sim/skills/skills.js';
import { TIERS, rollSheet, sheetOf, valueOf, tierOfRank } from '../src/sim/skills/templates.js';
import { createGame } from './game.mjs';
import { toJSON } from '../src/core/state.js';

export default [
  {
    name: 'value() is round(own × (1 + wf × os / 100)), own at most 23 (SKILLS §3\'s grid); paceOf is 1.60, 1.36, 1.23, 1.13, 1.00, 0.93, 0.84, 0.73, 0.64, 0.57 at 0, 3, 5, 7, 10, 12, 15, 20, 25, 30; mitigated wears a penalty down',
    fn() {
      const WFS = [0, 10, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      console.log(`      own \\ WF  ${WFS.map(w => String(w).padStart(3)).join(' ')}`);
      for (const o of [5, 8, 10, 12, 14, 16, 18, 20, 23]) console.log(`      ${String(o).padStart(9)}  ${WFS.map(w => String(value({ cls: 'soldier', os: w, skills: { marksmanship: [o, 0] } }, 'marksmanship')).padStart(3)).join(' ')}`);
      assert(value({ cls: 'soldier', os: 100, skills: { marksmanship: [20, 4] } }, 'marksmanship') === 46 && own({ skills: { weapons: [20, 4] } }, 'weapons') === OWN_MAX, 'the top is 46');
      assert(value({ cls: 'soldier', os: 50, skills: { fitness: [12, 0] } }, 'fitness') === 12 && value({ cls: 'civilian', os: 90, skills: { awareness: [6, 0] } }, 'awareness') === 6, 'fitness and civilians are their plain sums');
      const at = [0, 3, 5, 7, 10, 12, 15, 20, 25, 30, 46], want = [1.60, 1.36, 1.23, 1.13, 1.00, 0.93, 0.84, 0.73, 0.64, 0.57, 0.45];
      const got = at.map(v => Number(paceOf(v).toFixed(2)));
      console.log(`      paceOf: ${at.map((v, i) => `${v} ${fmt(got[i], 2)}`).join(', ')} (paceOf(10) = ${paceOf(10).toFixed(6)})`);
      assert(got.join() === want.join(), got.join());
      const m = [0, 5, 8, 10, 12, 15, 18, 20].map(v => `${mitigated(-4, v)}/${mitigated(-6, v)}`);
      console.log(`      mitigated −4 / −6 at 0, 5, 8, 10, 12, 15, 18, 20: ${m.join(', ')}`);
      assert(m.join() === '-4/-6,-3/-5,-3/-4,-2/-3,-2/-3,-1/-2,-1/-1,-1/-1', m.join());   // (SKILLS §5.13's two rows)
    },
  },
  {
    name: 'the tiers\' base ranges come from SKILLS §11.1\'s value ranges; the private tier over 1,000 seeds lands on the table\'s values, widened up by the rounding of the bases and the background points; sixteen skills, each with its uses',
    fn() {
      assert(SKILL_KEYS.length === 16 && SKILL_KEYS.every(k => SKILLS[k].uses.length && typeof SKILLS[k].wf === 'number'), 'sixteen skills');
      for (const t of ['private', 'lcpl', 'cpl', 'sgt', 'ssgt']) console.log(`      ${t.padEnd(7)} WF ${TIERS[t].wf.join('–')}: ${['marksmanship', 'weapons', 'awareness', 'fitness', 'cqc', 'fieldcraft'].map(k => `${k} ${TIERS[t].base[k].join('–')}`).join(', ')}`);
      assert(TIERS.private.base.marksmanship.join() === '8,10' && TIERS.private.base.weapons.join() === '8,10' && TIERS.private.base.awareness.join() === '5,6', 'the sheet\'s private bases');
      const keys = ['marksmanship', 'weapons', 'awareness', 'fitness'], seen = Object.fromEntries(keys.map(k => [k, {}]));
      let bgSkills = 0;
      for (let seed = 1; seed <= 1000; seed++) {
        const s = rollSheet(seed, 'p145', 'private');
        for (const k of keys) { const v = value(s, k); seen[k][v] = (seen[k][v] ?? 0) + 1; }
        bgSkills += Object.values(s.skills).filter(([, bg]) => bg > 0).length;
      }
      for (const k of keys) console.log(`      private ${k}: ${Object.entries(seen[k]).sort((a, b) => a[0] - b[0]).map(([v, n]) => `${v} ×${n}`).join(', ')}`);
      console.log(`      background points on ${fmt(bgSkills / 1000, 2)} skills a sheet (2 or 3, each 1 or 2)`);
      const range = (k) => { const vs = Object.keys(seen[k]).map(Number); return [Math.min(...vs), Math.max(...vs)]; };
      assert(range('marksmanship')[0] >= 8 && range('marksmanship')[1] <= 14 && range('awareness')[0] >= 5 && bgSkills / 1000 >= 2 && bgSkills / 1000 <= 3, JSON.stringify(seen));
      assert(tierOfRank('PFC') === 'private' && tierOfRank('Sgt') === 'sgt' && tierOfRank('GySgt') === 'gysgt' && tierOfRank('HPO2') === 'private', 'the ranks\' tiers');
    },
  },
  {
    name: 'sheetOf writes nothing and reads the same twice; the scene\'s player at 48213 has a written sheet, everyone else a lazy one by their rank',
    fn() {
      const g = createGame({ scenario: 'test-handling', seed: 48213, hour: 9 });
      const s = g.state, pid = s.player.id, before = toJSON(s);
      const someone = Object.keys(s.people).find(id => id !== pid && s.people[id].service?.rank === 'Sgt');
      const a = JSON.stringify(sheetOf(s, someone)), b = JSON.stringify(sheetOf(s, someone));
      assert(a === b && toJSON(s) === before && !s.people[someone].skills, 'a lazy sheet changed the state');
      const me = s.people[pid];
      console.log(`      the player ${pid}, ${me.service.rank}: os ${me.skills.os}; ${['marksmanship', 'weapons', 'awareness', 'fitness'].map(k => `${k} ${JSON.stringify(me.skills.skills[k])} = ${valueOf(s, pid, k)}`).join(', ')}`);
      console.log(`      a sergeant (${someone}), lazy: os ${sheetOf(s, someone).os}; ${['marksmanship', 'weapons', 'awareness'].map(k => `${k} ${valueOf(s, someone, k)}`).join(', ')}`);
      assert(me.skills.cls === 'soldier' && valueOf(s, pid, 'marksmanship') >= 8, JSON.stringify(me.skills));
    },
  },
];
