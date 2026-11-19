// OLYMPUS tests: the DI's shorthand a new player can read (the build sheet v0.0.22 item 6, FL22-6, B's half): the stack, Dominate and
// the contact said in whole words, on the tier one by T on "Stack and clear, live", seed 1.
//
// Out of house-words (the B and C review of 2026-11-16): B's three cases there took it to 3.7 to 4.5 s of CPU against its quick budget,
// QUICK_FILE_CPU_S 3 s × k (1.3 s without them). The habit's toast and the twin's far walk share one lane in
// tests/house-twin-words.test.mjs. The case fails on the old words (.run/v022/b.md).
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseTBot, runHouse } from './bots/house.mjs';
import { instinctNow, RULES } from '../src/sim/skills/instinct.js';

export default [
  {
    // (v0.0.22 B, FL22-6: text only, every row id and act unchanged; the feel lens's counts over 96 lanes: "Point. Read it, tell your
    // two." 16, "Point. Sector." 45, "Rifle, the man in the near leg's far corner: your two's. Your corner." 7)
    name: 'the DI\'s shorthand reads for a new player: "You lead. Read the door, then tell your two.", "To your point. Then your sector." and "His man: the near leg\'s far corner. Yours: your corner." (the tier one by T on "Stack and clear, live", seed 1), never "Point. Read it, tell your two.", "Point. Sector." or "…: your two\'s. Your corner." (the build sheet v0.0.22 item 6, FL22-6: the words a new player could not read)',
    fn() {
      const R = (id) => RULES.find(r => r.id === id).text;
      const tables = { stack: R('cqb-stack').r1, dominate: R('cqb-dominate')[2], his: R('cqb-contact').his, hisNext: R('cqb-contact').hisNext, hisU: R('cqb-contact').hisU };
      const all = Object.values(tables).flat(), OLD = /^Point\. (Read it|Sector)|\{Hold\}, \{who\}: your two's|^\{Who\}: your two's/;
      const g = createGame({ scenario: 'test-shoothouse', seed: 1, tier: 'tierone', opfor: 'live' }), base = houseTBot(), said = new Map();
      runHouse(g, (state, me, mem) => { const L = instinctNow(state).line; if (L?.text) said.set(L.text, (said.get(L.text) ?? 0) + 1); return base(state, me, mem); }, { maxMs: 12 * 60_000 });
      const his = [...said.keys()].filter(t => /^His man: /.test(t)), stale = [...said.keys()].filter(t => /^Point\. (Read it|Sector)|: your two's\. Your corner\./.test(t));
      console.log(`      the tables: ${all.filter(t => /You lead|His man|To your point/.test(t)).map(t => `"${t}"`).join(', ')}; old shorthand left ${all.filter(t => OLD.test(t)).length}`);
      console.log(`      the lane's lines: ${his.map(t => `"${t}" × ${said.get(t)}`).join(', ') || 'no "His man"'}; the old shorthand said ${stale.length}`);
      assert(tables.stack.includes('You lead. Read the door, then tell your two.') && tables.dominate.includes('To your point. Then your sector.') && ['his', 'hisNext', 'hisU'].every(k => /^His man: \{where\}\./.test(tables[k][0])) && !all.some(t => OLD.test(t)), JSON.stringify(tables));
      assert(his.includes("His man: the near leg's far corner. Yours: your corner.") && !stale.length, JSON.stringify({ his, stale }));
    },
  },
];
