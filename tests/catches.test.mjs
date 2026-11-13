// OLYMPUS tests: caught 1s and clean 20s, the mastery rule (SKILLS §5.1; decided 2026-11-11, the user's "good defaults"; built in the shoot house's rework R4, 2026-11-12).
//
// The user, 2026-11-11: "nat 1s are insanely frequent, much much more than nat 20s. Besides, there should be some kind of perk
// of high skilled operators preventing a nat 1 from making them miss, maybe they take 50% longer to shoot instead of missing
// altogether". A natural 1 is caught when the check is routine, or mastered (value MASTERY_MIN 15 or more, value + modifiers
// at the DC + MASTERY_AT 10 or more, not rushed, any pressure, never opposed): ok, graded by its margin, ×1.5 of its time. A
// natural 20 on procedure is clean, ×2/3. The rule's cells over 400 seeded rolls each, the round that leaves late, and (heavy)
// the shoot house's misses by sheet, the first table of SKILLS §5.1. Each fails on v0.0.13's tree, where every 1 failed.
import { assert, fmt } from './helpers.mjs';
import { stream } from '../src/core/rng.js';
import { check, opposed, isMastered, MASTERY_MIN, MASTERY_AT, CATCH_K, CLEAN_K } from '../src/sim/skills/checks.js';
import { createGame } from './game.mjs';
import { houseHonestBot, houseKeysBot, runHouse } from './bots/house.mjs';
import { pullMsOf } from '../src/sim/arms/shot.js';
import { flawlessSeeds } from './flawless.mjs';

// (400 rolls of a cell: how its natural 1s went)
function cell(o, n = 400, key = 'cell') {
  const r = stream('catches', key, JSON.stringify(o));
  let ones = 0, caught = 0, failed = 0, twenty = 0, clean = 0, bad = 0;
  for (let i = 0; i < n; i++) {
    const c = check(r, { skill: o.skill ?? 'marksmanship', value: o.value, dc: o.dc, mods: o.mods ?? [], tempo: o.tempo ?? 'normal', pressure: o.pressure ?? 'evaluated', procedure: !!o.procedure });
    if (c.nat === 1) { ones++; if (c.caught) caught++; else failed++; if (c.caught && (!c.ok || c.margin < 0)) bad++; }
    if (c.nat === 20) { twenty++; if (c.clean) clean++; }
  }
  return { ones, caught, failed, twenty, clean, bad };
}

export default [
  {
    name: 'the rule\'s two tests over 400 seeded rolls a cell (SKILLS §5.1): a routine 1 caught; a mastered 1 caught at any pressure (value 15, the DC + 10), never below value 15, never short of the margin, never rushed; a caught 1 always a success graded by its margin; a natural 20 on procedure clean, on a shot only shown; an opposed roll has no naturals',
    fn() {
      const cells = {
        'routine, the private\'s handling (WH 10 against 6)': { value: 10, dc: 6, procedure: true, skill: 'weapons', want: 'all' },
        'the private\'s shot (MRK 10 against 6, +8)': { value: 10, dc: 6, mods: [{ why: 'prone', v: 8, src: 'task' }], want: 'none' },
        'the corporal\'s shot at the margin (MRK 15 against 5)': { value: 15, dc: 5, want: 'all' },
        'the corporal one short (MRK 15 against 6)': { value: 15, dc: 6, want: 'none' },
        'value 14, any margin (against 0)': { value: 14, dc: 0, want: 'none' },
        'the tier one under fire, felt −4 (MRK 42 against 11)': { value: 42, dc: 11, mods: [{ why: 'under fire', v: -4, src: 'people', felt: 40 }], pressure: 'fire', want: 'all' },
        'the tier one rushed (MRK 42 against 11)': { value: 42, dc: 11, tempo: 'rushed', want: 'none' },
      };
      const bad = [];
      for (const [name, o] of Object.entries(cells)) {
        const c = cell(o, 400, name);
        console.log(`      ${name.padEnd(56)} 1s ${String(c.ones).padStart(2)}: caught ${c.caught}, failed ${c.failed} · 20s ${c.twenty}: clean ${c.clean}`);
        if (!c.ones) bad.push(`${name}: no natural 1 in 400`);
        if (o.want === 'all' && (c.failed || c.bad)) bad.push(`${name}: ${JSON.stringify(c)}`);
        if (o.want === 'none' && c.caught) bad.push(`${name}: caught ${c.caught}`);
        if (o.procedure ? c.clean !== c.twenty : c.clean) bad.push(`${name}: clean ${c.clean} of ${c.twenty}`);
      }
      const op = opposed(stream('catches', 'opp'), { skill: 'awareness', value: 40 }, { skill: 'fieldcraft', value: 0 });
      assert(!('caught' in op) && MASTERY_MIN === 15 && MASTERY_AT === 10 && CATCH_K === 0.5 && Math.abs(CLEAN_K - 1 / 3) < 1e-12 && isMastered({ value: 15, dc: 5 }) && !isMastered({ value: 15, dc: 5, tempo: 'rushed' }), 'the constants and the opposed roll');
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'a caught round is late, not certain (SKILLS §5.1): over ten lanes of the tier one by T every natural 1 on a round is caught, a \'catch\' part of CATCH_K × the single pull spliced in before it leaves (+0.13 s at Weapon handling 42), and none misses; the private by the keys never catches a round',
    timeoutMs: 180_000,
    fn() {
      const out = {};
      for (const [tier, bot] of [['tierone', houseHonestBot], ['private', houseKeysBot]]) {
        let rounds = 0, ones = 0, caught = 0, missed1 = 0, catches = [], pull = null;
        for (const seed of flawlessSeeds(10)) {
          const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'go' }), pid = g.state.player.id;
          g.bus.on?.('step', (f) => { if (f.phase === 'sub' && f.action === 'catch' && f.who === pid) catches.push(f.toMs - f.fromMs); });
          g.bus.on?.('roll', (f) => { if (f.who !== pid || f.roll?.skill !== 'marksmanship') return; rounds++; if (f.roll.nat === 1) { ones++; if (f.roll.caught) caught++; else missed1++; } });
          runHouse(g, bot(), { maxMs: 12 * 60_000 });
          pull ??= pullMsOf(g.state, pid, g.state.people[pid].kit.worn.sling, 1).ms;
        }
        out[tier] = { rounds, ones, caught, missed1, catches: catches.length, catchMs: [...new Set(catches)], want: Math.round(pull * CATCH_K) };
      }
      console.log(`      ${Object.entries(out).map(([t, o]) => `${t}: ${o.rounds} rounds, natural 1s ${o.ones} (caught ${o.caught}, missed ${o.missed1}), catch parts ${o.catches} of ${o.catchMs.join('/') || '-'} ms (CATCH_K × the pull ${o.want} ms)`).join('; ')}`);
      const T = out.tierone, P = out.private;
      assert(T.ones > 0 && T.caught === T.ones && T.catches === T.ones && T.catchMs.every(ms => Math.abs(ms - T.want) <= 50), JSON.stringify(T));
      assert(P.caught === 0, JSON.stringify(P));
    },
  },
  {
    name: 'the shoot house\'s misses by sheet under the mastery rule (SKILLS §5.1\'s first table, measured: the recruit and the private keep theirs, from the corporal the margin decides): 100 seeds a sheet, by the keys to the private and by T from the corporal, the rifle\'s rounds (the P-12\'s printed apart)',
    heavy: true,
    timeoutMs: 40 * 60_000,
    fn() {
      const rows = [];
      for (const tier of ['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone']) {
        let rounds = 0, missed = 0, ones = 0, caught = 0, pistol = 0, pistolMissed = 0;
        const bot = ['recruit', 'private'].includes(tier) ? houseKeysBot : houseHonestBot;
        for (const seed of flawlessSeeds(100)) {
          const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'go' }), pid = g.state.player.id;
          // (the rework's R6: a round of the P-12 drawn (the sergeant up, Transition) counted apart: the rule is the rifle's shot rows', and a
          // pistol's base DC is ten more (WEAPONS §7.2), so the Raider's margin there is short of mastery)
          const rifle = g.state.people[pid].kit.worn.sling;
          g.bus.on?.('roll', (f) => {
            if (f.who !== pid || f.roll?.skill !== 'marksmanship') return;
            if (g.state.stop?.gun && g.state.stop.gun !== rifle) { pistol++; if (!f.roll.ok) pistolMissed++; return; }
            rounds++; if (!f.roll.ok) missed++; if (f.roll.nat === 1) { ones++; if (f.roll.caught) caught++; }
          });
          runHouse(g, bot(), { maxMs: 12 * 60_000 });
        }
        rows.push({ tier, rounds, missed, pct: rounds ? 100 * missed / rounds : 0, ones, caught, pistol, pistolMissed });
      }
      for (const r of rows) console.log(`      ${r.tier.padEnd(8)} ${String(r.rounds).padStart(5)} rounds: missed ${fmt(r.pct, 1)}%, natural 1s ${r.ones}, caught ${r.caught}${r.pistol ? `; the P-12's ${r.pistol}, missed ${r.pistolMissed}` : ''}`);
      const at = (t) => rows.find(r => r.tier === t);
      assert(at('recruit').caught === 0 && at('private').caught === 0 && at('raider').missed === 0 && at('tierone').missed === 0, JSON.stringify(rows));
    },
  },
];
