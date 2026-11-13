// OLYMPUS tests: test-shoothouse, "Stack and clear" (the build sheet 0.0.12 §5.3; COMBAT §25.10.4, §25.13): lane A of the Wheel's house 1 at 1 G, played to the card by the house bot (tests/bots/house.mjs) step by step by the keys (the boot recruit, the private) and by T's bundles (the corporal to the tier one).
//   - the reference room (setup 'ref': room 1 alone with its one man, no dummy, COMBAT §25.5.1): room 1 on 48213 for every
//     sheet beside the sheet's §4 table at 1 G to your own "Clear!" (§25.5.1 has no #2; the room's call waits on his sector,
//     printed beside it; the human's own start 0.3 s by the keys), its take-in and its first round
//     from the sighting; within 15% for the private and the tier one (the sheet's §6), and for every sheet whose §4 row the
//     drill reproduces (the corporal's three groups printed beside it);
//   - the lane on 48213, every sheet from GO (the private also from the brief, the instructor's sequence whole): each room's
//     time, the take-ins, the first rounds, the zones, the faults, the presses (about a person, about a door), the #2's
//     rounds, the lane's time and a real-minutes estimate; the tier one's lane at least 1.5 times as quick as the
//     private's (COMBAT §25.13); every take-in inside §25.4.3's band for its sheet; T never firing (every round of yours
//     leaves inside a shot row or Fire you chose); at rungs 3 and 4 the presses in a room with people at least the men of
//     your own corner seen + 1 (your #2's are his), half of them or more about a person or a door (the guard against press-T-to-win); the same end state by the
//     keys and by T: every threat down, every room and the hall cleared (none passed), every hot spot covered, no no-shoot
//     or hostage hit; the card's save passes the id walk (tests/ids-check.mjs);
//   - (heavy) 100 seeds: the private by the keys (a seeded human start of 0.3 to 0.8 s and a line up to 10% long), the
//     sergeant and the tier one by T: each room's mean, p5 and p95, the lane's, the faults and the cards reached; two runs
//     of a seed one digest.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseBot, runHouse } from './bots/house.mjs';
import { houseNow, runSheetOf, THREAT_FACES, STANDS } from '../src/sim/scenarios/shoothouse.js';
import { CALL_S, CALL_FLOW_S } from '../src/sim/combat/bundle.js';
import { takeInOf, takeInWords } from '../src/sim/combat/react.js';
import { TEST_SHEETS, RUNG_OF_TIER } from '../src/sim/skills/templates.js';
import { lanePlanOf } from '../src/sim/combat/room.js';
import { hashInt } from '../src/core/hash.js';
import { checkIds } from './ids-check.mjs';

/** The sheet's §4 table at 1 G (the reference room from 4 m down the hall): [room s, sighting to first round s, take-in s], by sheet. */
export const REF_1G = Object.freeze({ recruit: [15.33, 2.98, 0.95], private: [13.79, 2.00, 0.80], cpl: [8.82, 1.53, 0.50], sgt: [6.13, 0.56, 0.25], raider: [5.19, 0.37, 0.10], tierone: [4.98, 0.30, 0.05] });
/** The sheets the reference room is held to within REF_TOL (the corporal's printed beside its row: see the header). */
export const REF_HELD = Object.freeze(['recruit', 'private', 'sgt', 'raider', 'tierone']), REF_TOL = 0.15;
const SHEETS = Object.freeze(['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone']);
const modeOf = (tier) => (RUNG_OF_TIER[tier] < 2 ? 'keys' : 'T');
const s2 = (ms) => (ms === null || ms === undefined ? '-' : takeInWords(ms));

// (a take-in's band for a sheet: the fastest it can be (its sector, passed) to the slowest the lane can make it (a room it
// clears, a bad notice roll, two at once, a hostage's hidden hands, the dark, behind him): COMBAT §25.4.3's factors)
export function bandOf(tier) {
  const wf = TEST_SHEETS[tier].wf;
  return [takeInOf({ wf, expect: 'sector' }).ms, takeInOf({ wf, expect: 'area', grade: 'bad', n: 2, whoK: 1.5, lightK: 1.3, behindK: 1.3 }).ms];
}

/** One lane to its card (see the header): { g, N, sheet, r, shots: [{ atMs, step }], firstShots }. */
export function laneRun({ tier, seed = 48213, setup = 'go', mode = modeOf(tier), humanStartMs = 300, lineK = 1, par = null } = {}) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup, ...(par ? { par } : {}) });
  const pid = g.state.player.id, shots = [], ready = {};
  const r = runHouse(g, houseBot({ mode, humanStartMs, lineK }), {
    maxMs: 30 * 60_000,
    each: (game) => {
      for (const f of game.facts('shot')) if (f.who === pid && f.fired) shots.push({ atMs: f.atMs, step: game.state.stop?.doing?.step ?? null });
      // (your own "Clear!" ready: the first start of your call's beat in a leg, before it waits on your #2's sector)
      const cur = game.state.armoury.range.house?.cur ?? null;
      for (const f of game.facts('bundle')) if (f.who === pid && f.phase === 'beat' && /(^|:)clear$/.test(f.beat ?? '') && cur !== null) ready[cur] ??= f.atMs;
    },
  });
  return { g, N: houseNow(g.state), sheet: runSheetOf(g.state), r, shots, ready };
}

// (a leg's end state: its threats down, its state, its hot spots covered, no no-shoot or hostage hit)
function endState(run) {
  const { N } = run;
  return N.legs.map(V => {
    const threats = N.turners.filter(T => T.room && THREAT_FACES.includes(T.face) && legOfStand(T.stand) === V.k);
    return { state: V.state, down: threats.filter(T => T.down).length, of: threats.length, covered: V.corners.covered, hot: V.corners.of,
      wrong: (V.zones.noshoot ?? 0) + (V.zones.hostage ?? 0) + (V.twoZones.noshoot ?? 0) + (V.twoZones.hostage ?? 0) };
  });
}
const legOfStand = (stand) => (stand === 'H' ? 3 : Number(stand[0]) - 1);

export default [
  {
    name: 'the reference room (room 1 alone with its man, no dummy: COMBAT §25.5.1) on 48213, every sheet against the sheet\'s §4 table at 1 G: the private by the keys about 14 s, the tier one by T about 5 s, within 15% (the sheet\'s §6)',
    timeoutMs: 120_000,
    fn() {
      const bad = [];
      for (const tier of SHEETS) {
        const run = laneRun({ tier, setup: 'ref' }), V = run.N.legs[0], [roomS, firstS, inS] = REF_1G[tier];
        // (§25.5.1's room is #1's alone: the room to your own "Clear!" ready plus the call, held to §4; the room's "Clear!"
        // waits on your #2's sector too (bundle.js CLEAR_WAIT_MS: "a room is clear when every sector has been looked at",
        // COMBAT §21), printed beside it (the fixer's of 0.0.12))
        const callMs = (RUNG_OF_TIER[tier] >= 3 ? CALL_FLOW_S : CALL_S) * 1000, own = Number.isFinite(run.ready[0]) ? Math.min(V.ms, run.ready[0] - run.N.goAtMs + callMs) : V.ms;
        const ms = own, take = V.takeIns[0] ?? null, first = V.firsts[0] ?? null, dev = ms / 1000 / roomS - 1;
        const held = REF_HELD.includes(tier);
        console.log(`      ${tier.padEnd(8)} ${modeOf(tier).padEnd(4)} room 1 ${fmt(ms / 1000, 2)} s to your own "Clear!" (§4 ${roomS}, ${dev >= 0 ? '+' : ''}${fmt(dev * 100, 0)}%), ${fmt(V.ms / 1000, 2)} s with your #2's sector · take-in ${s2(take)} (§4 ${inS}) · first ${s2(first)} (§4 ${firstS}) · presses ${V.presses} · ${held ? 'held' : 'printed'}`);
        if (held && Math.abs(dev) > REF_TOL) bad.push(`${tier} ${fmt(ms / 1000, 2)} s against ${roomS}`);
        if (take !== null && Math.abs(take / 1000 - inS) > 0.05 + 1e-9 && held) bad.push(`${tier} take-in ${s2(take)} against ${inS}`);
      }
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'the lane on 48213, every sheet to the card: the rooms\' times, take-ins, first rounds, zones, faults and presses printed; the tier one\'s lane at least 1.5 times as quick as the private\'s; take-ins in their bands; T never firing; at rungs 3 and 4 the presses about people and doors; the same end state by the keys and by T',
    timeoutMs: 240_000,
    fn() {
      const runs = {}, bad = [];
      for (const tier of SHEETS) {
        const run = runs[tier] = laneRun({ tier });
        const { N, sheet, r } = run, rung = RUNG_OF_TIER[tier], band = bandOf(tier);
        const laneS = N.timerMs / 1000, realMin = (r.ms / 1000 + 30) / 60;
        console.log(`      ${TEST_SHEETS[tier].label} (rung ${rung}, ${modeOf(tier)}): the lane ${fmt(laneS, 1)} s, the card in ${fmt(r.ms / 1000, 1)} s of game time (about ${fmt(realMin, 1)} real minutes with the brief), ${r.ticks} ticks; the #2 ${N.two.name} fired ${N.two.fired}, hit ${N.two.hits}`);
        for (const row of sheet.rows) console.log(`        ${row.words}`);
        for (const V of N.legs) console.log(`          ${V.word.toLowerCase()}: presses ${V.presses} (person ${V.pressAbout.person}, door ${V.pressAbout.door}; keys ${V.how.keys}, bundles ${V.how.bundle}), seen ${V.seen}`);
        console.log(`        card: ${N.summary}`);
        console.log(`        the instructor: "${sheet.one.text}"`);
        if (N.rangeEnd?.phase !== 'clear' || N.end?.why !== 'clear') bad.push(`${tier}: ended ${JSON.stringify(N.rangeEnd)} ${JSON.stringify(N.end)}`);
        // (the card's save: every id of its kind and naming something, the house's people and the #2's rounds with them)
        const ids = checkIds(JSON.parse(run.g.save()), run.g.sim.domains);
        if (ids.invalid.length || ids.dangling.length) bad.push(`${tier}: ids ${JSON.stringify([...ids.invalid, ...ids.dangling].slice(0, 4))}`);
        for (const t of N.legs.flatMap(V => V.takeIns)) if (t < band[0] || t > band[1]) bad.push(`${tier}: take-in ${t} out of [${band}]`);
        // (T never fires: every round of yours left inside a shot row or Fire)
        const loose = run.shots.filter(x => !/^(shot:|fire$)/.test(x.step ?? ''));
        if (loose.length) bad.push(`${tier}: rounds outside a shot row ${JSON.stringify(loose)}`);
        if (rung >= 3) for (const V of N.legs) {
          if (!V.seen) continue;
          // (the men of your own corner you saw: your #2's are his to shoot, on the same mechanics (the fixer's of 0.0.12: he
          // fired 0 to 2 rounds in the lane before, so "seen" counted his men among yours))
          const own = new Set(V.contacts.filter(c => c.by === 'me' && (STANDS[c.stand]?.slot ?? 1) === 1).map(c => c.key)).size;
          // (2026-11-12, R3: no "Carry on" after a shot row now, so at rung 4, where the lane's bundle carries every room from
          // the last until R4 withdraws it, a room's presses are its own men's decisions alone: the +1 (the room's own press)
          // holds below it)
          if (V.presses < own + (rung >= 4 ? 0 : 1) || V.pressAbout.person + V.pressAbout.door < V.presses / 2) bad.push(`${tier} ${V.word}: ${V.presses} presses for ${own} of your own seen (${V.seen} in all), ${V.pressAbout.person} about a person, ${V.pressAbout.door} about a door`);
        }
      }
      const ratio = runs.private.N.timerMs / runs.tierone.N.timerMs;
      console.log(`      the private's lane ${fmt(runs.private.N.timerMs / 1000, 1)} s against the tier one's ${fmt(runs.tierone.N.timerMs / 1000, 1)} s: ${fmt(ratio, 2)} times (COMBAT §25.13: at least 1.5)`);
      if (ratio < 1.5) bad.push(`ratio ${fmt(ratio, 2)}`);
      const keys = endState(runs.private), T = endState(runs.tierone);
      console.log(`      the end state by the keys ${JSON.stringify(keys)}`);
      console.log(`      the end state by T        ${JSON.stringify(T)}`);
      const same = keys.every((k, i) => k.state === 'clear' && T[i].state === 'clear' && k.down === k.of && T[i].down === T[i].of && k.covered === k.hot && T[i].covered === T[i].hot && !k.wrong && !T[i].wrong);
      if (!same) bad.push('the end states differ');
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'the private from the brief: LOAD, MAKE READY, Standby, GO in stop motion with "Stack up" first, the lane, Stop, UNLOAD, SHOW CLEAR, the hot wash behind the brief splash and the card',
    timeoutMs: 120_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private' }), bot = houseBot({ mode: 'keys' }), cmds = [], go = { stop: null, first: null };
      const r = runHouse(g, bot, {
        maxMs: 30 * 60_000,
        each: (game) => {
          for (const f of game.facts('range')) if (f.phase === 'cmd') cmds.push(f.cmd);
          if (go.stop === null && game.facts('house').some(f => f.phase === 'go')) { go.stop = game.state.stop?.mode ?? null; go.first = (game.state.armoury.range.house.goAtMs === game.state.clock.ms); }
        },
      });
      const N = houseNow(g.state), H = g.state.armoury.range.house;
      console.log(`      the commands: ${cmds.join(' · ')}`);
      console.log(`      GO in ${go.stop} motion; the lane ${fmt(N.timerMs / 1000, 1)} s; the wash from ${H.wash ? fmt((H.wash.atMs - H.goAtMs) / 1000, 1) : '-'} s after GO for ${fmt(90, 0)} s; the card at ${fmt(r.ms / 1000, 1)} s of game time; ${N.summary}`);
      assert(JSON.stringify(cmds) === JSON.stringify(['brief', 'load', 'ready', 'standby', 'go', 'stop', 'clear', 'wash', 'end']), cmds.join());
      assert(go.stop === 'stop' && N.rangeEnd?.phase === 'clear' && H.wash && N.end?.why === 'clear', JSON.stringify({ go, end: N.rangeEnd, wash: H.wash }));
      assert(g.state.armoury.range.end.atMs - H.wash.atMs >= 90_000, `the wash ${g.state.armoury.range.end.atMs - H.wash.atMs} ms`);
    },
  },
  {
    name: 'a hundred seeds (heavy): the private by the keys with a seeded human start and a line up to 10% long, the sergeant and the tier one by T: each room\'s mean, p5 and p95, the lane\'s, every run to the card; two runs of a seed one digest',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      const plans = [['private', 'keys'], ['sgt', 'T'], ['tierone', 'T']], stats = {}, bad = [];
      const q = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * (s.length - 1) + 0.5))]; };
      for (const [tier, mode] of plans) {
        const st = stats[tier] = { legs: [[], [], [], []], lane: [], faults: {}, cards: 0, passed: 0 };
        for (let i = 0; i < 100; i++) {
          const seed = 1000 + i * 37;
          const humanStartMs = mode === 'keys' ? 300 + 50 * hashInt(11, 'house-test', seed) : 300, lineK = mode === 'keys' ? 1 + hashInt(11, 'house-line', seed) / 100 : 1;
          const { N } = laneRun({ tier, seed, mode, humanStartMs, lineK });
          if (N.rangeEnd?.phase === 'clear') st.cards++;
          N.legs.forEach((V, k) => { if (V.ms !== null) st.legs[k].push(V.ms / 1000); if (V.state === 'passed') st.passed++; });
          st.lane.push(N.timerMs / 1000);
          for (const f of N.faults) st.faults[f.kind] = (st.faults[f.kind] ?? 0) + 1;
        }
        const row = (xs) => `${fmt(xs.reduce((a, b) => a + b, 0) / xs.length, 2)} (${fmt(q(xs, 0.05), 2)} to ${fmt(q(xs, 0.95), 2)})`;
        console.log(`      ${tier.padEnd(8)} ${mode.padEnd(4)} cards ${st.cards}/100, passed legs ${st.passed}; lane ${row(st.lane)} s; ${st.legs.map((xs, k) => `${['r1', 'r2', 'r3', 'hall'][k]} ${row(xs)}`).join(' · ')}; faults ${JSON.stringify(st.faults)}`);
        if (st.cards !== 100) bad.push(`${tier}: ${st.cards} cards`);
      }
      const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length, ratio = mean(stats.private.lane) / mean(stats.tierone.lane);
      console.log(`      the private's mean lane over the tier one's: ${fmt(ratio, 2)} times`);
      if (ratio < 1.5) bad.push(`ratio ${fmt(ratio, 2)}`);
      // (two runs of a seed: one digest)
      const a = laneRun({ tier: 'sgt', seed: 4242 }).g.digest(), b = laneRun({ tier: 'sgt', seed: 4242 }).g.digest();
      console.log(`      seed 4242 twice: ${a} ${b}`);
      if (a !== b) bad.push('two runs of a seed differ');
      assert(!bad.length, bad.join('; '));
    },
  },
];
