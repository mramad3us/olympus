// OLYMPUS tests: pars a sheet can meet, per stand, per room and per lane (the build sheet v0.0.20 §1 item 11; card C3; F56).
//
// A stand's par is the class's (PAR_MS by the picker or the sheet) plus its own allowances, each the formula the panel shows at the
// sheet (shoothouse.js parOf: 'head', the hostage card's careful head row less the pair; 'far', below rung 2 a man beyond IMMEDIATE_M
// of your point, the plant), said as a roll ("Par 3.00 + 0.65 (the head, past the hostage) = 3.65 s"); every reader of the class's
// par in the scene goes through parOf (a source scan). A room's par is its bundle's planned time from where the leg starts plus its
// men of yours' books, × ROOM_PAR_K, rounded up to ROOM_PAR_STEP_MS (roomParOf), written at the fill (L.parMs, H.laneParMs). The
// quick case reads the fill on every sheet; the heavy one is F56's (tests/flawless-card.mjs), run on its 40 seeds a sheet.
import { assert } from './helpers.mjs';
import { readFileSync } from 'node:fs';
import { createGame } from './game.mjs';
import { root } from './helpers.mjs';
import { houseOf, parOf, parWords, roomParOf, houseVerdict, PAR_MS } from '../src/sim/scenarios/shoothouse.js';
import { ROOM_PAR_K, ROOM_PAR_STEP_MS } from '../src/data/courses.js';
import { RUNG_OF_TIER } from '../src/sim/skills/templates.js';
import { parsGauge, PAR_SEEDS, PAR_PROBE_MS, ROOM_PROBE_K, cardLane } from './flawless-card.mjs';
import { codeOnly } from './syntax.test.mjs';

const SHEETS = ['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone'];

export default [
  {
    name: 'a stand\'s par is the class\'s plus its allowances, said as a sum (below rung 2 the hostage\'s head and a man met on the move), each room\'s and the lane\'s written at the fill, and every reader of H.parMs in the scene reads it through parOf',
    fn() {
      const rows = [];
      for (const tier of SHEETS) {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier }), s = g.state, H = houseOf(s), R = s.armoury.range;
        const p3b = parOf(s, R.turners.find(T => T.stand === '3b'), H), pH = parOf(s, R.turners.find(T => T.stand === 'H'), H), p1a = parOf(s, R.turners.find(T => T.stand === '1a'), H);
        const legs = [...H.rooms, H.hall].map(L => L.parMs), again = roomParOf(s, H.rooms[0].door, H);
        rows.push({ tier, rung: RUNG_OF_TIER[tier], base: H.parMs, p1a, p3b, pH, legs, lane: H.laneParMs, again });
        console.log(`      ${tier.padEnd(8)} 1a ${parWords(p1a)}; 3b ${parWords(p3b)}; H ${parWords(pH)}; rooms ${legs.map(ms => (ms / 1000).toFixed(1)).join(', ')} s, the lane ${(H.laneParMs / 1000).toFixed(1)} s (× ${ROOM_PAR_K.room[RUNG_OF_TIER[tier] >= 2 ? 1 : 0]} a room, × ${ROOM_PAR_K.hall[RUNG_OF_TIER[tier] >= 2 ? 1 : 0]} the hall)`);
      }
      assert(rows.every(r => r.p1a.ms === r.base && !r.p1a.parts.length && (r.rung < 2) === r.p3b.parts.some(p => p.why === 'head') && (r.rung >= 2 || r.p3b.ms > r.base)), JSON.stringify(rows.map(r => [r.tier, r.p1a, r.p3b])));
      assert(rows.every(r => (r.rung < 2) === r.pH.parts.some(p => p.why === 'far')), JSON.stringify(rows.map(r => [r.tier, r.pH])));
      assert(rows.every(r => r.legs.every(ms => ms > 0 && ms % ROOM_PAR_STEP_MS === 0) && r.lane === r.legs.reduce((a, b) => a + b, 0) && r.again === r.legs[0]), JSON.stringify(rows.map(r => [r.tier, r.legs, r.lane, r.again])));
      assert(/^Par 3\.00 \+ \d\.\d\d \(the head, past the hostage\) = \d\.\d\d s$/.test(parWords(rows[0].p3b)), parWords(rows[0].p3b));
      // (the source scan, on the code alone: H.parMs read in shoothouse.js only by parOf (and houseLook's timer, B's hunk); elsewhere in src only by house-kit.js's read of the throw's
      // exposure, which is the class's par for the thrower, not a stand's (a named exception, printed))
      const sh = codeOnly(readFileSync(`${root}/src/sim/scenarios/shoothouse.js`, 'utf8')), kit = codeOnly(readFileSync(`${root}/src/sim/scenarios/house-kit.js`, 'utf8'));
      const fnOf = (src, at) => { const head = src.slice(0, at).lastIndexOf('\nexport function '), head2 = src.slice(0, at).lastIndexOf('\nfunction '); const h = Math.max(head, head2); return /function (\w+)/.exec(src.slice(h, h + 80))?.[1] ?? '?'; };
      const reads = [...sh.matchAll(/\bH\??\.parMs\b/g)].map(m => fnOf(sh, m.index)), kits = [...kit.matchAll(/\bH\??\.parMs\b/g)].length;
      console.log(`      H.parMs read in shoothouse.js by ${reads.join(', ') || 'nothing'}; in house-kit.js ${kits} time(s) (the throw's exposure, the class's par); PAR_MS ${JSON.stringify(PAR_MS)}`);
      // (houseLook's timer is the room's B's hunk this round: the class's par for the stage's timer, a named exception, printed)
      assert(reads.includes('parOf') && reads.every(f => f === 'parOf' || f === 'houseLook'), JSON.stringify(reads));
    },
  },
  {
    name: 'the lane\'s par bites: the honest tier one and the private by the keys on 48213 run their lanes in at least 0.73 of their pars, ROOM_PAR_K fitted by the leg\'s kind (fails with C\'s first fit, one K a band set by the hall: 0.72 and 0.65 here, the verdict\'s lane clause out of reach, the C and D review of 2026-11-16)',
    fn() {
      const rows = ['tierone', 'private'].map(tier => { const s = cardLane(tier, 48213).state, H = houseOf(s), v = houseVerdict(s);
        return { tier, laneMs: v.laneMs, par: v.laneParMs, r: v.laneMs / v.laneParMs, legs: [...H.rooms, H.hall].map(L => `${((L.clearAtMs - L.fromMs) / 1000).toFixed(2)}/${(L.parMs / 1000).toFixed(1)}`), go: v.go }; });
      for (const r of rows) console.log(`      ${r.tier.padEnd(8)} the lane ${(r.laneMs / 1000).toFixed(1)} s of its par ${(r.par / 1000).toFixed(1)} s: ${r.r.toFixed(2)} (${ROOM_PROBE_K}× slower: ${(r.r * ROOM_PROBE_K).toFixed(2)}); legs ${r.legs.join(', ')}; ${r.go ? 'GO' : 'NO-GO'}; ROOM_PAR_K ${JSON.stringify(ROOM_PAR_K)}`);
      assert(rows.every(r => r.r >= 0.73 && r.r <= 1 && r.go), JSON.stringify(rows));
    },
  },
  {
    name: 'F56: each room\'s par met on at least 90% of the seeds by its sheet\'s bot (the keys bot with the Watch below rung 2, the honest bot from the corporal), enforced; each stand\'s par met outside the click on at least 85% and missed on at least 80% held PAR_PROBE_MS after each pause, and each room 1.25 times slower missing its par on at least 80%, printed (OPEN: the class\'s par is the sheet\'s, unchanged; a room\'s book is the user\'s question 11)',
    heavy: true,
    timeoutMs: 1_800_000,
    fn() {
      const g = parsGauge({ seeds: PAR_SEEDS });
      for (const line of g.lines) console.log(`      ${line}`);
      for (const r of g.rows) console.log(`      ${r.id} ${r.met ? 'MET' : 'NOT MET'}: ${r.value} (target ${r.target})`);
      console.log(`      PAR_PROBE_MS ${PAR_PROBE_MS}; ROOM_PAR_K ${JSON.stringify(ROOM_PAR_K)}; the stands' clauses OPEN: ${g.open.length}`);
      assert(g.met, g.fails.join('\n'));
    },
  },
];
