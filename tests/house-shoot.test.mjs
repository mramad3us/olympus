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

/** The standard lane's rows at every pause, by sheet and seed: [pauses, pauses with a closet row, digest] (the base tree's), your #2 without his P-12 ('~two:none'). */
// (v0.0.20, the build sheet's items 5, 12 and 17, re-pinned on purpose: the room's rows at the pauses moved, "Coming out!" offered inside
// a room called clear, the row times of the room rows with their calls, #1's mark gone to the last man; the tier one's 15 pauses kept,
// the sergeant on 1037 one fewer (18 to 17, 7 to 6 with a closet row): his lane moved with the far leg's wait. Was 'tierone/48213':
// [15, 3, '1a4ac722085660'], 'sgt/1037': [18, 7, '1e909843bca3b0'])
// (the hunt of v0.0.18: Top up no longer offered with a magazine of ten in and nothing fuller at hand, a swap of ten for ten: two
// of the tier one's pauses and one of the sergeant's; v0.0.19's digests were 1a4ac722085660 and 1e909843bca3b0)
// (v0.0.20's integration: both at once, the room's rows and the hunt's Top up; B's own digests were 0972977eda42b9 and 0d92f0f3147534)
// (v0.0.21's fixer, on purpose: X in the live lane is labelled "Go: the clock runs", never the range's "Stand easy" (the play review
// of 2026-11-16); that label alone moves every digest, the pauses and the closet's the same (checked by putting the old label back:
// the old digests to the byte). Was 'private/48213': [20, 0, '17e68730c8d01b'], 'tierone/48213': [15, 3, '1a6e7df86a9831'],
// 'sgt/1037': [17, 6, '14f67340608758'])
export const STANDARD_ROWS = Object.freeze({ 'private/48213': [20, 0, '0a6472b4704993'], 'tierone/48213': [15, 3, '1815c0034914ab'], 'sgt/1037': [17, 6, '0a197456b2d44c'] });
/** The same with his P-12, standard issue from v0.0.20 (the user's answer of 2026-11-16, "#2 has to have a sidearm"): his longer MAKE READY and SHOW CLEAR move the lane's ticks, so its pauses (re-recorded on v0.0.20's tree, PRINT_HASH=1). */
// (the tier one's one pause more, at 50.30 s: after his own SHOW CLEAR, the tower waiting on your #2's P-12 cleared; the admin rows
// of an empty rifle, every one of them v0.0.18's (macro:clear, macro:load, macro:reload:speed); the private and the sergeant the same)
// (v0.0.20's integration: on the merged tree, the room's rows and the hunt's Top up with his P-12; the asks' own on v0.0.19 were
// tierone [16, 3, '11d5e252c4cc67'] and sgt [18, 7, '1e909843bca3b0'])
// (v0.0.21's fixer: the same X label; was 'private/48213': [20, 0, '17e68730c8d01b'], 'tierone/48213': [18, 3, '15024d1bcce693'],
// 'sgt/1037': [20, 6, '15e26021ef9b6c'])
// (v0.0.22's C, FL22-1 (its build sheet item 1): the pauses after your own SHOW CLEAR while the tower waited on your #2's P-12 are gone,
// his clear and the instructor's look at it passing behind the brief splash: the tier one 18 → 16, the sergeant 20 → 18, every pause
// before them the same; the private's and every ~two:none lane's unchanged. Were 'tierone/48213': [18, 3, '15024d1bcce693'],
// 'sgt/1037': [20, 6, '15e26021ef9b6c'])
// (the v0.0.22 integration: both causes together, re-pinned on the merged tree)
export const STANDARD_ROWS_P12 = Object.freeze({ 'private/48213': [20, 0, '0a6472b4704993'], 'tierone/48213': [16, 3, '07e2baf92015f4'], 'sgt/1037': [18, 6, '1120da1a425954'] });

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
    name: 'the standard loadout\'s rows are v0.0.18\'s to the byte at every pause of the honest bot\'s lane, the closet included (the private and the tier one on 48213, the sergeant on 1037), your #2 without his P-12 (\'~two:none\'): no Shoot the lock, no five, no new variant; with it (v0.0.20\'s standard) the lane\'s own pins',
    timeoutMs: 180_000,
    fn() {
      const out = {}, bad = [];
      for (const [loadout, pins] of [['standard~two:none', STANDARD_ROWS], [null, STANDARD_ROWS_P12]]) for (const key of Object.keys(pins)) {
        const [tier, seed] = key.split('/'), g = createGame({ scenario: 'test-shoothouse', seed: Number(seed), tier, setup: 'go', ...(loadout ? { loadout } : {}) }), inner = houseHonestBot(), seen = [];
        let closet = 0;
        runHouse(g, (state, me, mem) => { const S = state.stop; if (S?.mode === 'stop' && S.phase === 'choose' && !S.reflex) { const rows = stepsOf(state).map(r => [r.id, r.label, r.off ?? null, r.ms ?? null]); if (rows.some(r => /closet/.test(r[0]))) closet++; seen.push(rows); } return inner(state, me, mem); }, { maxMs: 10 * 60_000 });
        const k = `${loadout ?? 'standard'} ${key}`;
        out[k] = [seen.length, closet, goldenDigest(seen)];
        if (JSON.stringify(out[k]) !== JSON.stringify(pins[key])) bad.push(`${k}: ${JSON.stringify(out[k])} against ${JSON.stringify(pins[key])}`);
      }
      console.log(`      ${Object.entries(out).map(([k, v]) => `${k}: ${v[0]} pauses, ${v[1]} with a closet row, digest ${v[2]}`).join('; ')}`);
      if (process.env.PRINT_HASH) console.log(`      STANDARD_ROWS_P12 = ${JSON.stringify(Object.fromEntries(Object.entries(out).filter(([k]) => k.startsWith('standard ')).map(([k, v]) => [k.slice(9), v])))}`);
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
