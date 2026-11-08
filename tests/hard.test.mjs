// Hardening, the offset: experience, inoculation, the nerve axis and the body's toll (COMBAT §5.6; SKILLS §6.8; BODY §9.3; the build sheet 0.0.9 §2.1, §5.1, §8 items 13, 14, 16).
//
// The user (2026-11-07): "with "hardening" (can name it differently) being an offset to it", answered the same day with
// the name Hardening, its words "from green to unshakeable" and the tier one at 95. Printed from the code: COMBAT §5.6's
// T1 from TEST_SHEETS on a scene's player (hardParts) and from the NPC templates, T16 (the toll on a tier one, from his
// body's own record), hardWord at each boundary, inocOf's words; noteExposure counted and refused as SKILLS §6.8 says.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { TEST_SHEETS, TIERS } from '../src/sim/skills/templates.js';
import { SOL_MS } from '../src/core/clock.js';
import { hardParts, hardOf, hardFrom, hardWord, inocOf, noteExposure, feltFrom, HARD_K, HARD_WORDS, INOC_OF_TIER, INOC_CAP, INOC_PER_SOL } from '../src/sim/combat/supp.js';

const WANT = Object.freeze({ recruit: 7, private: 17, cpl: 36, sgt: 45, raider: 75, tierone: 95 });
// (COMBAT §5.6's T1 templates, SKILLS §11.1's middles with an inoculation by tier)
const TEMPLATES = [['civilian, Mars', 'civilian', 0, 0], ['ice miner, Europa', 'spacer', 25, 0], ['insurgent cell member', 'soldier', 11, 0], ['insurgent veteran', 'soldier', 32, 3],
  ['pirate, clan boarder', 'criminal', 32, 3], ['corporate security', 'cop', 22, 3], ['MSS tactical', 'cop', 45, 12], ['UN Marine, line', 'soldier', 26, 8], ['recon marine', 'soldier', 56, 18], ['enemy special forces', 'soldier', 80, 22]];

export default [
  {
    name: 'hard: COMBAT §5.6\'s T1 from the code: the test sheets at 7, 17, 36, 45, 75 and 95 (experience round(WF × 0.75) + the row\'s inoculation), the templates by their class, hardening monotonic in Warfighting within every class',
    fn() {
      const got = {};
      for (const tier of Object.keys(TEST_SHEETS)) {
        const g = createGame({ scenario: 'test-pairs', seed: 48213, tier }), s = g.state, pid = s.player.id, p = hardParts(s, pid), t = TEST_SHEETS[tier];
        got[tier] = p.H;
        console.log(`      ${t.label} (WF ${t.wf}): experience ${p.exp} + inoculation ${p.inoc} (${s.people[pid].skills.inoc?.fixed ? 'fixed' : 'read'}) + axis ${p.axis} − toll ${p.toll.reduce((a, x) => a + x.v, 0)} = H ${p.H}, ${hardWord(p.H)}; the most that reaches him ${feltFrom(120, p.H)}; ${inocOf(s, pid).words}`);
      }
      for (const [id, cls, wf, inoc] of TEMPLATES) console.log(`      ${id} (${cls}, WF ${wf}, inoculation ${inoc}): H ${hardFrom({ wf, cls, inoc })}`);
      console.log(`      the rank tiers' middles (SKILLS §11.1, INOC_OF_TIER): ${Object.entries(TIERS).map(([k, t]) => `${k} ${hardFrom({ wf: Math.round((t.wf[0] + t.wf[1]) / 2), inoc: INOC_OF_TIER[k] ?? 0 })}`).join(', ')}`);
      const notMono = [];
      for (const cls of Object.keys(HARD_K)) for (let wf = 1; wf <= 100; wf++) if (hardFrom({ wf, cls, inoc: 6 }) < hardFrom({ wf: wf - 1, cls, inoc: 6 })) notMono.push(`${cls} ${wf}`);
      assert(JSON.stringify(got) === JSON.stringify(WANT), JSON.stringify({ got, WANT }));
      assert(!notMono.length, notMono.join(', '));
    },
  },
  {
    name: 'hard: the body takes hardening back (T16, BODY §9.3): a tier one exhausted, then frayed, then at very low morale reads H 85, 80, 75 from his own record, and three bangs reach him at felt 20, 25, 30; the toll at most 25',
    fn() {
      const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'tierone' }), s = g.state, pid = s.player.id, b = s.people[pid].body;
      const rows = [['rested', () => {}], ['exhausted', () => { b.sleep.pressureH = 30; }], ['and frayed', () => { b.stress.v = 90; }], ['and morale very low', () => { b.morale = { v: 5 }; }]];
      const Hs = [];
      for (const [k, f] of rows) { f(); const p = hardParts(s, pid); Hs.push(p.H); console.log(`      ${k}: toll ${p.toll.map(t => `${t.why} ${t.v}`).join(', ') || 'none'}, H ${p.H}; three bangs (pool 105): felt ${feltFrom(105, p.H)}`); }
      console.log(`      the cap: a toll of 40 counts 25 (H ${hardFrom({ wf: 93, inoc: 25, toll: 40 })}: felt ${feltFrom(105, hardFrom({ wf: 93, inoc: 25, toll: 40 }))} under three bangs, COMBAT §5.6's T16 "felt 35, under fire, −4")`);
      assert(Hs.join() === '95,85,80,75' && hardFrom({ wf: 93, inoc: 25, toll: 40 }) === 70, Hs.join());
    },
  },
  {
    name: 'hard: hardening in words at each boundary (the user\'s answer to question 16, "shown in words from green to unshakeable"), and inocOf\'s "inoculation 6 of 10: as far as unit training goes"',
    fn() {
      const at = [0, 19, 20, 39, 40, 59, 60, 79, 80, 100].map(H => `${H} ${hardWord(H)}`);
      console.log(`      ${at.join(' · ')}; the words' floors ${HARD_WORDS.map(([w, f]) => `${w} ${f}`).join(', ')}`);
      const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'private' }), s = g.state, pid = s.player.id;
      const w = inocOf(s, pid);
      console.log(`      the private: ${w.words} (fixed ${w.fixed}, cap ${w.cap}, ${w.teacher}); hardening ${hardOf(s, pid)}`);
      assert(at.join() === '0 green,19 green,20 settled,39 settled,40 steady,59 steady,60 hardened,79 hardened,80 unshakeable,100 unshakeable', at.join());
      assert(w.words === 'inoculation 6 of 10: as far as unit training goes' && w.fixed, JSON.stringify(w));
    },
  },
  {
    name: 'hard: noteExposure (SKILLS §6.8): never on a fixed counter (a test sheet), never from a real fight (no teacher), not under felt 20; +1 an exposure, at most 4 a sol, never past its teacher\'s cap; a new sol counts again',
    fn() {
      const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'private' }), s = g.state, pid = s.player.id, t0 = s.clock.ms;
      const fixed = noteExposure(s, pid, { feltPeak: 80, teacher: 'unit', atMs: t0 });
      const before = JSON.stringify(s.people[pid].skills.inoc);
      // (a career sheet: the counter not fixed)
      s.people[pid].skills.inoc = { pts: 6, n: 0, sol: 0 };
      const fight = noteExposure(s, pid, { feltPeak: 80, teacher: null, atMs: t0 }), low = noteExposure(s, pid, { feltPeak: 19, teacher: 'unit', atMs: t0 });
      const day = [];
      for (let i = 0; i < 6; i++) day.push(noteExposure(s, pid, { feltPeak: 60, teacher: 'unit', atMs: t0 + i * 1000 }));
      const next = [];
      for (let i = 0; i < 3; i++) next.push(noteExposure(s, pid, { feltPeak: 60, teacher: 'unit', atMs: t0 + SOL_MS + i * 1000 }));
      const boot = noteExposure(s, pid, { feltPeak: 60, teacher: 'boot', atMs: t0 + 2 * SOL_MS });
      console.log(`      a test sheet: ${fixed.counted ? 'COUNTED' : `refused (${fixed.why})`}, its counter ${before}; a real fight: ${fight.why}; felt 19: ${low.why}`);
      console.log(`      one sol, six exposures at unit training: ${day.map(d => (d.counted ? `+1 → ${d.pts}` : d.why)).join(', ')}; the next sol: ${next.map(d => (d.counted ? `+1 → ${d.pts}` : d.why)).join(', ')}; boot camp after: ${boot.why}; the counter ${JSON.stringify(s.people[pid].skills.inoc)}`);
      assert(!fixed.counted && fixed.why === 'test sheet' && before === JSON.stringify({ pts: 6, n: 0, sol: 0, fixed: true }), JSON.stringify(fixed));
      assert(!fight.counted && !low.counted, JSON.stringify({ fight, low }));
      assert(day.filter(d => d.counted).length === INOC_PER_SOL && day[3].pts === 10 && !day[4].counted, JSON.stringify(day));
      assert(next.every(d => !d.counted) && s.people[pid].skills.inoc.pts === INOC_CAP.unit && !boot.counted, JSON.stringify({ next, inoc: s.people[pid].skills.inoc }));
    },
  },
];
