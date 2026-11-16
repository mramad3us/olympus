// OLYMPUS tests: the closet by Shoot the lock (kit2 §2.6, §6 tests 31 and 34 as the build sheet 0.0.19 §6 replaces it): the R-7 on its lock from room 2 on a breaching lane, the lane to its card; and the standard loadout's rows v0.0.18's to the byte at every pause of the honest bot's lane, the closet included (§0 item 16: Shoot the lock on breaching lanes only).
//
// The goldens of the second case were recorded on the base tree (v0.0.18's snapshot with stage 0: the scratch worktree of
// .run/v019/base.tree, the same walk), so a row added or moved on the standard lane fails it.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse, houseHonestBot } from './bots/house.mjs';
import { houseKitBot } from './bots/kit.mjs';
import { goldenDigest } from './golden.mjs';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { runSheetOf } from '../src/sim/scenarios/shoothouse.js';
import { openingState } from '../src/sim/places/model.js';
import { beliefOf } from '../src/sim/arms/firearms.js';

/** The standard lane's rows at every pause, by sheet and seed: [pauses, pauses with a closet row, digest] (the base tree's). */
export const STANDARD_ROWS = Object.freeze({ 'private/48213': [20, 0, '17e68730c8d01b'], 'tierone/48213': [15, 3, '1a4ac722085660'], 'sgt/1037': [18, 7, '1e909843bca3b0'] });

export default [
  {
    name: 'the closet by Shoot the lock to the card: the sergeant on the breach loadout, from room 2, the lock defeated by the R-7\'s rounds (each from the magazine, never a miss on the paper), the closet cleared, the lane to its card',
    timeoutMs: 120_000,
    fn() {
      const out = [];
      for (const seed of [48213, 1, 2]) {
        const g = createGame({ scenario: 'test-shoothouse', seed, tier: 'sgt', setup: 'go', loadout: 'breach' }), s = g.state, H = s.armoury.range.house;
        const r = runHouse(g, houseKitBot({ use: 'shoot' }), { maxMs: 10 * 60_000 });
        const b = H.breach?.['o:w4:closet'], rounds = s.armoury.range.shots.filter(x => x.row === 'shoot:door');
        out.push({ seed, done: r.done, end: H.end?.why, b, rounds: rounds.map(x => `${x.id} ${x.grade} ${x.pitchDeg}°`), open: openingState(s, 'o:w4:closet'), miss: H.rooms[1].zones.miss ?? 0, row: runSheetOf(s).rows.find(x => x.room === 'w4.r2')?.words });
      }
      for (const o of out) console.log(`      ${o.seed}: ${o.done ? 'to the card' : 'NOT done'} (${o.end}); the closet ${o.open}, ${JSON.stringify(o.b)}; rounds ${o.rounds.join(', ')}; room 2's misses ${o.miss} (its men's)\n        ${o.row}`);
      // (room 2's misses are the shooter's at its men, never the breach's rounds: ballistic's own case holds that)
      assert(out.every(o => o.done && o.end === 'clear' && o.open === 'open' && o.b && o.rounds.length === o.b.rounds) && out.some(o => Object.values(o.b.points).every(x => x === 1)), JSON.stringify(out));
    },
  },
  {
    name: 'the standard loadout\'s rows are v0.0.18\'s to the byte at every pause of the honest bot\'s lane, the closet included (the private and the tier one on 48213, the sergeant on 1037): no Shoot the lock, no five, no new variant',
    timeoutMs: 120_000,
    fn() {
      const out = {}, bad = [];
      for (const key of Object.keys(STANDARD_ROWS)) {
        const [tier, seed] = key.split('/'), g = createGame({ scenario: 'test-shoothouse', seed: Number(seed), tier, setup: 'go' }), inner = houseHonestBot(), seen = [];
        let closet = 0;
        runHouse(g, (state, me, mem) => { const S = state.stop; if (S?.mode === 'stop' && S.phase === 'choose' && !S.reflex) { const rows = stepsOf(state).map(r => [r.id, r.label, r.off ?? null, r.ms ?? null]); if (rows.some(r => /closet/.test(r[0]))) closet++; seen.push(rows); } return inner(state, me, mem); }, { maxMs: 10 * 60_000 });
        out[key] = [seen.length, closet, goldenDigest(seen)];
        if (JSON.stringify(out[key]) !== JSON.stringify(STANDARD_ROWS[key])) bad.push(`${key}: ${JSON.stringify(out[key])} against ${JSON.stringify(STANDARD_ROWS[key])}`);
      }
      console.log(`      ${Object.entries(out).map(([k, v]) => `${k}: ${v[0]} pauses, ${v[1]} with a closet row, digest ${v[2]}`).join('; ')}`);
      assert(!bad.length, bad.join(' | '));
    },
  },
  // (the review of v0.0.19's K, finding 5: on seed 1037 the first round at the closet's lock is the dummy's click; "Shoot the lock"
  // stayed live, and each of five more presses fired nothing, R.house.breach's rounds 0, till T opened the door)
  {
    name: 'a click on the dummy at the closet\'s lock strikes "Shoot the lock" "a stoppage" while the stoppage is believed (the arrow to Fix), and once IMMEDIATE ACTION clears it the rounds open the lock (seed 1037, the sergeant: the review of v0.0.19\'s K, five presses that fired nothing)',
    timeoutMs: 120_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 1037, tier: 'sgt', setup: 'go', loadout: 'breach' }), s = g.state, H = s.armoury.range.house, inner = houseKitBot({ use: 'shoot' });
      let presses = 0, liveInStoppage = 0, struckSeen = 0;
      runHouse(g, (st, me, mem) => {
        const S = st.stop;
        if (S?.mode === 'stop' && S.phase === 'choose' && !S.reflex) {
          const row = stepsOf(st).find(r => r.id === 'door:shoot>o:w4:closet'), b = beliefOf(st, st.people[st.player.id].kit.worn.sling);
          if (row && b?.stoppage) { if (row.off) struckSeen++; else liveInStoppage++; }
        }
        const r = inner(st, me, mem);
        if (r?.act?.[0]?.args?.step === 'door:shoot>o:w4:closet') presses++;
        return r;
      }, { maxMs: 10 * 60_000 });
      const B = H.breach?.['o:w4:closet'] ?? null, d = H.dummy;
      console.log(`      the dummy clicked ${d.clickAtMs !== null}, cleared ${d.clearedAtMs !== null}; pauses with the stoppage believed: Shoot the lock struck ${struckSeen}, live ${liveInStoppage}; presses ${presses}; the closet ${JSON.stringify(B)}; the lane ${H.end?.why}`);
      assert(d.clickAtMs !== null && struckSeen >= 1 && liveInStoppage === 0, JSON.stringify({ d, struckSeen, liveInStoppage }));
      assert(B && B.rounds >= 1 && B.points.lock >= 1 && presses < 6 && H.end?.why === 'clear', JSON.stringify({ B, presses, end: H.end }));
    },
  },
];
