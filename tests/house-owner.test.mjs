// OLYMPUS tests: whose man a target is, by where he stands (the build sheet v0.0.21 §1 item 8; house lens H3; §0 item 30): your man is the one in your sector of his room's plan, whatever the door's swing.
//
// Stage 0 wrote each stand's slot at the fill from room.js sectorOf on its leg's plan and read every owner through team.js ownerOf
// (STANDS' per-stand slot gone). The case here is the one that broke the old table: room 1 drawn as a pull door, the set's cast and
// places kept (`Cn290lc.Ks206lc.En175pc|ftnanth|p010101`). The centre's pull family is a hook, #1 to the far side: the sectors turn
// over, so 1a at (26.80, 8.25) is your #2's and 1b at (31.20, 8.25) yours, the reverse of the set. Before stage 0 the slot came from
// STANDS and the house lens measured F9 "wrong sector 6 of 30" and F10 "5 pars missed on 1a" there (house.md §0 item 6).
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { flawlessLane, gaugeOf } from './flawless.mjs';
import { ownerOf } from '../src/sim/combat/team.js';
import { sectorOf } from '../src/sim/combat/room.js';
import { planSetOf } from '../src/sim/scenes/assemble.js';

/** Room 1 a pull door, the set's cast and places (see the header). */
export const PULL_ONE = 'Cn290lc.Ks206lc.En175pc|ftnanth|p010101';

// (each stand's owner, its slot written at the fill, and the sector it stands in on its room's plan)
function owners(code) {
  const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go', ...(code ? { house: code } : {}) });
  const s = g.state, set = planSetOf(s), planOf = (room) => Object.values(set.plans).find(p => p.room === room || (p.parts ?? []).includes(room));
  return { entry: Object.values(set.plans)[0].entry, rows: s.armoury.range.turners.map(T => ({ stand: T.stand, slot: T.slot, sector: sectorOf(planOf(T.room), T.x, T.z), owner: ownerOf(s, T) })) };
}

export default [
  {
    name: 'room 1 a pull door (the centre\'s hook): 1a is your #2\'s and 1b yours, every stand\'s owner the sector it stands in on its room\'s plan; the honest tier one\'s F9 (every threat in its sector) and F10 (pars) met on three seeds',
    timeoutMs: 120_000,
    fn() {
      const set = owners(null), pull = owners(PULL_ONE);
      const line = (o) => `${o.entry}: ${o.rows.map(r => `${r.stand} ${r.owner}`).join(', ')}`;
      console.log(`      the set (room 1 ${line(set)}); room 1 a pull (${line(pull)})`);
      const by = Object.fromEntries(pull.rows.map(r => [r.stand, r]));
      assert(by['1a'].owner === 2 && by['1b'].owner === 1 && pull.rows.every(r => r.owner === r.sector && r.slot === r.sector), JSON.stringify(pull.rows));
      // (the honest tier one on three seeds: F9 and F10 over the lanes)
      const recs = [48213, 1489397426, 1037].map(seed => flawlessLane({ tier: 'tierone', seed, bot: 'honest', setup: 'go', fill: { house: PULL_ONE } }));
      const rows = gaugeOf(recs).filter(r => r.id === 'F9' || r.id === 'F10');
      for (const r of rows) console.log(`      ${r.id} ${r.met ? 'MET ' : 'OPEN'} ${r.name}: ${String(r.value).slice(0, 300)}`);
      console.log(`      the lanes: ${recs.map(r => `${r.seed} ${r.end} ${r.laneS} s`).join(', ')}`);
      assert(recs.every(r => r.done) && rows.every(r => r.met), rows.filter(r => !r.met).map(r => `${r.id}: ${r.value}`).join(' | '));
    },
  },
];
