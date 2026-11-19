// OLYMPUS tests: the truth cards, each man and stand you engaged as he truly was at your first round (the build sheet v0.0.24 item 19, its F119 read as F122; the overhaul's O-17).
//
// The house writes, once, at your first round at a man or a stand (hit or miss), what he truly was then (shoothouse.js truthAt: T.atFirst
// = { ms, how, gun, pose, facing, aimAt, face, holds, read }: a role-player's Seen record from your eye, a board what its stand holds,
// and read the take-in's belief you acted on), and the end card draws them in a row under the plan (truth-cards' T-a, the default),
// in the order engaged (house.js truthRows). The oracle is a replay: from a save made at the end of the tick before the capture, a
// fresh game loads it and computes the record (seen.js seenOf, the cover off) before stepping the tick, then steps it: the capture it
// writes equals the oracle and the first run's to the byte, and a later round never rewrites it. A save made by v0.0.23's own code
// (the keys private at room 2's first contact) has none: nothing is engaged until a round is fired after the load. On v0.0.23 there
// was no capture and no row. Prints each capture and the rows.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';
import { assert, root } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseHonestBot, houseBot, runHouse } from './bots/house.mjs';
import { seenOf, standSeen } from '../src/sim/people/seen.js';
import { seenFace } from '../src/sim/arms/engage.js';
import { truthRows } from '../src/ui/cards/house.js';
import { truthAgrees, LOOKS_ENFORCED } from './flawless-looks.mjs';

const LANES = [{ tier: 'tierone', seed: 48213 }, { tier: 'sgt', seed: 48213, opfor: 'live:fight,fight' }], HEAVY_LANES = [{ tier: 'tierone', seed: 48213, opfor: 'live:hide,give' }, { tier: 'private', seed: 4028068471, bot: 'keys' }];
const botOf = (L) => (L.bot === 'keys' ? houseBot({ mode: 'keys' }) : houseHonestBot());
const optsOf = (L) => ({ scenario: 'test-shoothouse', seed: L.seed, tier: L.tier, setup: 'go', ...(L.opfor ? { opfor: L.opfor } : {}) });
const caps = (s) => new Map(s.armoury.range.turners.filter(T => T.atFirst).map(T => [T.key, JSON.stringify(T.atFirst)]));
// (the oracle on a state before the tick: a role-player's record from your eye, a board's stand)
function oracle(s, T) {
  const read = seenFace(s, T.key), me = s.player.id;
  if (T.live?.who) { const r = seenOf(s, T.live.who, { by: me, fresh: true, keep: false }); return { how: r.hold.how, pose: r.pose, facing: r.facing, aimAt: r.aimAt ?? null, face: T.face, holds: T.holds, read: { face: read.face, holds: read.holds } }; }
  const b = standSeen(T.face, T.holds);
  return { how: b.hold.how, pose: 'stand', facing: 'front', aimAt: null, face: T.face, holds: T.holds, read: { face: read.face, holds: read.holds } };
}

// (one lane: its captures against the replay's oracle, never rewritten, the end card's rows (see the header))
function laneTruth(L, bad) {
  {
        // (the first run: the tick each capture appears, and never rewritten after)
        const g = createGame(optsOf(L)), at = new Map(), first = new Map();
        let tick = 0;
        runHouse(g, botOf(L), { each(game) {
          tick++;
          for (const [k, v] of caps(game.state)) { if (!first.has(k)) { first.set(k, v); at.set(k, tick); } else if (first.get(k) !== v) bad.push(`${L.opfor ?? 'set'} ${k}: rewritten at tick ${tick}`); }
        } });
        // (the replay: a save at the end of the tick before each capture, loaded fresh, the oracle before its tick)
        const ticks = [...new Set(at.values())].sort((a, b) => a - b), r = createGame(optsOf(L)), bot = botOf(L);
        let n = 0;
        const rows = [];
        for (const N of ticks) {
          while (n < N - 1) { r.step(1, bot); r.clearFacts?.(); n++; }
          const json = r.save(), h = createGame(optsOf(L)), hs = h.load(json), keys = [...at].filter(([, t]) => t === N).map(([k]) => k);
          const want = new Map(keys.map(k => [k, oracle(hs, hs.armoury.range.turners.find(T => T.key === k))]));
          h.step(1, botOf(L)); h.clearFacts?.();
          for (const k of keys) {
            const T = h.state.armoury.range.turners.find(x => x.key === k), v = truthAgrees(T.atFirst, want.get(k));
            const same = JSON.stringify(T.atFirst) === first.get(k) && JSON.stringify(T.atFirst.read) === JSON.stringify(want.get(k).read);
            rows.push(`${T.stand}${T.live ? '*' : ''} tick ${N}: ${T.atFirst.how} ${T.atFirst.pose} ${T.atFirst.facing}${T.atFirst.aimAt ? ` aimed ${T.atFirst.aimAt}` : ''}, read ${T.atFirst.read.holds}; ${v.ok ? 'the oracle\'s' : v.why}${same ? '' : '; NOT the first run\'s'}`);
            if (!v.ok || !same) bad.push(`${L.opfor ?? 'set'} ${T.stand}: ${v.why ?? 'the replay differs'}`);
          }
        }
        const tr = truthRows(g.state);
        console.log(`      ${L.tier} ${L.seed} ${L.opfor ?? 'as set'}: ${first.size} engaged; the end card's rows ${tr.map(x => `${x.stand} ${(x.firstMs / 1000).toFixed(1)} s ${x.words}`).join(', ')}`);
        for (const x of rows) console.log(`        ${x}`);
        const ordered = tr.every((x, i) => i === 0 || tr[i - 1].firstMs <= x.firstMs);
        if (tr.length !== first.size || !ordered || !first.size) bad.push(`${L.opfor ?? 'set'}: ${tr.length} rows for ${first.size} engaged, ordered ${ordered}`);
        }
}

export default [
  {
    name: 'F122 the truth cards: each stand\'s capture at your first round equals the record a replay from a save before it computes, written once and never rewritten; the end card\'s rows one a stand engaged, in order; on the tier one\'s lane as set and two live lanes',
    fn() {
      const bad = [];
      for (const L of LANES) laneTruth(L, bad);
      assert(!bad.length && LOOKS_ENFORCED.has('F122'), bad.join('; '));
    },
  },
  {
    name: 'F122 the truth cards on two more lanes: the tier one\'s live:hide,give (2a captured kneeling) and the keys private\'s lane as set on 4028068471 (the seed of your score of 2026-11-17) (heavy: the quick file\'s CPU budget)',
    heavy: true,
    fn() {
      const bad = [];
      for (const L of HEAVY_LANES) laneTruth(L, bad);
      assert(!bad.length && LOOKS_ENFORCED.has('F122'), bad.join('; '));
    },
  },
  {
    name: 'a v0.0.23 save (the keys private at room 2\'s first contact) has no capture: nothing engaged, no row, until a round is fired after the load; then that stand\'s alone',
    fn() {
      const json = gunzipSync(readFileSync(path.join(root, 'tests', 'saves', 'v0.0.23-house-room2.json.gz'))).toString('utf8');
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213 }), s = g.load(json), bot = houseBot({ mode: 'keys' });
      const before = s.armoury.range.turners.filter(T => T.atFirst).length, rows0 = truthRows(s).length, shots0 = s.armoury.range.shots.length;
      let n = 0, early = 0;
      while (n++ < 4000 && s.armoury.range.shots.length === shots0) { g.step(1, bot); g.clearFacts?.(); if (s.armoury.range.shots.length === shots0 && s.armoury.range.turners.some(T => T.atFirst)) early++; }
      const shot = s.armoury.range.shots.at(-1), after = s.armoury.range.turners.filter(T => T.atFirst);
      console.log(`      loaded: ${before} captures, ${rows0} rows; the first round after the load at +${n} ticks on ${shot?.key ?? 'nothing'}: ${after.map(T => T.stand).join(', ')} captured; early ${early}`);
      assert(before === 0 && rows0 === 0 && early === 0 && after.length === 1 && after[0].key === shot.key, JSON.stringify({ before, rows0, early, after: after.map(T => T.key), shot: shot?.key }));
    },
  },
];
