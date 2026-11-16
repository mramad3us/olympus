// OLYMPUS tests: the team's gauges over the lanes (v0.0.19, the build sheet v0.0.19 §6 and §8; heavy): F34 to F37 (tests/flawless-team.mjs) on three seeds (the user's 1489397426, 48213, 1037), and F1 to F26 (tests/flawless.mjs, untouched) on the honest and keys bots with your #2's P-12 on (~two:p12), every sheet, the same three seeds, every criterion printed against its threshold.
import { assert } from './helpers.mjs';
import { flawlessLane, gaugeOf, keysGauge, printGauge, failing, T_SHEETS, ENFORCED } from './flawless.mjs';
import { f34, f35, f36, f37, teamFailing, TEAM_ENFORCED } from './flawless-team.mjs';

const SEEDS = Object.freeze([1489397426, 48213, 1037]);

// (the team's fuzz (F11's and F14's measures over the team's rows; the build sheet v0.0.19 §8: "T's sideBot and fuzz with swaps"):
// seeds 48001 to 48008 × the flash, breach and full loadouts × the four T sheets, the fuzz seed the lane's)
const FUZZ_SEEDS = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8]), FUZZ_LOADOUTS = Object.freeze(['flash', 'breach', 'full']);

export default [
  {
    name: 'the team\'s fuzz (tests/bots/team.mjs teamFuzzBot: the team\'s rows pressed among the house fuzz\'s, As you were after his charge is placed weighted in) reaches the card on every lane, never throws, and leaves no device live, placed or in your #2\'s hands at the card (F11, F14 and F29\'s measures; the review of 2026-11-16: no suite ran it)',
    heavy: true,
    timeoutMs: 600_000,
    async fn() {
      const { createGame } = await import('./game.mjs');
      const { runHouse } = await import('./bots/house.mjs');
      const { teamFuzzBot } = await import('./bots/team.mjs');
      const { liveDevices, handDeviceOf } = await import('../src/sim/arms/devices.js');
      const out = [];
      for (const loadout of FUZZ_LOADOUTS) for (const tier of T_SHEETS) for (const seed of FUZZ_SEEDS) {
        let rec;
        try {
          const g = createGame({ scenario: 'test-shoothouse', seed: 48000 + seed, tier, loadout }), s = g.state, H = s.armoury.range.house;
          let belays = 0, swaps = 0, last = null;
          const r = runHouse(g, teamFuzzBot({ seed }), { maxMs: 30 * 60_000, each: () => { const t = H.two?.task, k = t ? `${t.atMs}:${t.st}` : null; if (k !== last && t?.st === 'belayed' && t.done?.place !== undefined) belays++; last = k; swaps = Math.max(swaps, Object.keys(H.two?.side ?? {}).length); } });
          const placed = Object.values(s.items).filter(it => it.type === 'charge' && (it.st === 'placed' || it.st === 'primed')).length;
          rec = { loadout, tier, seed, done: r.done, s: r.ms / 1000, belays, swaps, live: (liveDevices(s) ?? []).length, held: handDeviceOf(s, H.two.pid) ? 1 : 0, mine: handDeviceOf(s, s.player.id)?.id ?? null, placed, steps: Object.values(r.mem.teamSteps ?? {}).reduce((a, b) => a + b, 0) };
        } catch (e) { rec = { loadout, tier, seed, err: String(e.message).slice(0, 200) }; }
        out.push(rec);
      }
      const bad = out.filter(r => r.err || !r.done || r.live || r.held || r.placed);
      const by = (k) => FUZZ_LOADOUTS.map(l => `${l} ${out.filter(r => r.loadout === l && r[k]).length}`).join(', ');
      // (a device of yours still in your hand at the card is printed, not enforced here: the lane's end leaves the fuzz no row for it
      // (bundle.js deviceRows are the lane's singles), the snapshot's, reported to the lead in .run/v019/T-lead-edits.md)
      const mine = out.filter(r => r.mine).map(r => `${r.loadout} ${r.tier} ${r.seed} ${r.mine}`);
      console.log(`      ${out.length} lanes: to the card ${out.filter(r => r.done).length}, threw ${out.filter(r => r.err).length}; lane mean ${(out.filter(r => r.s).reduce((a, r) => a + r.s, 0) / Math.max(1, out.filter(r => r.s).length)).toFixed(1)} s; team presses ${out.reduce((a, r) => a + (r.steps ?? 0), 0)}; As you were after his place on ${by('belays')} lanes; swapped on ${by('swaps')} lanes; at the card live ${out.reduce((a, r) => a + (r.live ?? 0), 0)}, in his hands ${out.reduce((a, r) => a + (r.held ?? 0), 0)}, placed ${out.reduce((a, r) => a + (r.placed ?? 0), 0)}; in yours ${mine.length}${mine.length ? ` (${mine.join(', ')})` : ''}`);
      for (const r of bad.slice(0, 6)) console.log(`      not met: ${JSON.stringify(r)}`);
      assert(!bad.length && out.some(r => r.belays), JSON.stringify(bad.slice(0, 6)));
    },
  },
  {
    name: 'F34 to F37, the team\'s gauges, on three seeds: his P-12 at the tower, the other side, the team\'s words, his tasks (enforced at once; the build sheet v0.0.19 §8)',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      const [w, lanes] = f36(SEEDS), rows = [f34(SEEDS), f35(SEEDS, lanes), w, f37(SEEDS)];
      printGauge(`the team's gauges (enforced: ${[...TEAM_ENFORCED].join(', ')})`, rows.map(r => ({ ...r, id: r.id })));
      const f = teamFailing(rows);
      assert(!f.length, f.join(' | '));
    },
  },
  {
    name: 'F1 to F26 hold with your #2\'s P-12 on (~two:p12): the honest bot on every T sheet and the keys bot on the recruit and the private, three seeds, every criterion the lanes measure printed (tests/flawless.mjs untouched)',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      const recs = [...T_SHEETS.flatMap(tier => SEEDS.map(seed => flawlessLane({ tier, seed, bot: 'honest', loadout: 'standard~two:p12' }))), ...['recruit', 'private'].flatMap(tier => SEEDS.map(seed => flawlessLane({ tier, seed, bot: 'keys', loadout: 'standard~two:p12' })))];
      const rows = [...gaugeOf(recs), keysGauge(recs)];
      printGauge(`the gauges over ${recs.length} lanes with ~two:p12 (ENFORCED: ${[...ENFORCED].join(', ')})`, rows);
      assert(recs.every(r => !r.err), JSON.stringify(recs.filter(r => r.err).map(r => [r.tier, r.seed, r.err])));
      const f = failing(rows);
      assert(!f.length, f.join(' | '));
    },
  },
];
