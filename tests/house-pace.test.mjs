// OLYMPUS tests: the tower waits on the instructor's voice (the build sheet v0.0.20 item 7, §0 item 32; feel.md FL-3; F59's third clause).
//
// The house's instructor says the brief on the PA (35 words, 10.75 s spoken) and, the same tick, his own 27 words after it
// (8.35 s): one speaker, so his lines chain (shoothouse.js R.paUntilMs: max(the chain, now) + core/speech.js spokenMs(text), for
// his PA lines and his speech outside the lane). The tower's next command waits for the chain's end (shoothouse.js houseSecond:
// the tower keeps its second while he talks), for every command posted outside the lane: LOAD, MAKE READY, Standby, UNLOAD
// SHOW CLEAR, the hot wash and the end (never GO, posted at its drawn time, nor Stop, which comes when the lane is done). In
// v0.0.19 LOAD came at 3.1 s, cutting the brief at its tenth word. The quick case plays one lane (the private by the keys on
// 48213, from the fill) and holds that no held command starts inside the chain and that the text the chain timed is the 'say'
// fact's own; it fails without the wait. The heavy case plays 20 seeds a sheet from the fill twice, with the wait and with the
// chain zeroed every tick (the stage-0 tree's tower, to the byte: the chain is read nowhere else), and holds the lane from GO
// within chance of it (the mean lane a sheet within 2%, every fault's rate within 5 points), printed side by side: GO moves
// about 20 s and the dice keyed by absolute ms move with it (§0 item 30), so the lanes cannot be byte for byte.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseBot, runHouse } from './bots/house.mjs';
import { spokenMs } from '../src/core/speech.js';
import { TICK_MS } from '../src/core/clock.js';

// (the commands the wait holds: those posted after a command outside the lane; GO and Stop are not)
const HELD = new Set(['load', 'ready', 'standby', 'clear', 'wash', 'end']);
const modeOf = (tier) => (tier === 'recruit' || tier === 'private' ? 'keys' : 'T');
const factsOf = (game) => (game.bus.events ?? []).map(e => (Array.isArray(e) ? { type: e[0], p: e[1] } : { type: e.type, p: e.payload ?? e.data ?? e }));

/**
 * One lane from the fill, the tower's says and the chain watched: { cmds: [{ id, atMs, chainMs }], says, bad: [], laneS, faults, end }.
 * zero: the chain zeroed every tick (the tower as it was).
 */
function paceLane({ tier, seed, zero = false }) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier });
  const R0 = g.state.armoury.range, coach = R0.coachId, ro = R0.roId, t0 = g.state.clock.ms;
  const out = { cmds: [], says: 0, bad: [], timed: 0 };
  let chain = 0;
  const each = (game) => {
    // (each runs after the tick: its facts were emitted at the tick's own ms, a tick before the clock now)
    const R = game.state.armoury.range, now = game.state.clock.ms - TICK_MS;
    for (const { type, p } of factsOf(game)) {
      if (type === 'range' && p.phase === 'cmd') out.cmds.push({ id: p.cmd, atMs: now - t0, chainMs: Math.max(0, chain - t0) });
      if (type !== 'say' || (p.who !== coach && p.who !== ro)) continue;
      out.says++;
    }
    // (the chain as the state has it at the tick's end; a line timed: the text the chain grew by is a line said this tick)
    const was = chain;
    chain = R.paUntilMs ?? 0;
    if (chain !== was && !zero) {
      const said = factsOf(game).filter(f => f.type === 'say' && (f.p.who === coach || f.p.who === ro)).map(f => f.p.text);
      let c = was;
      for (const t of said) c = Math.max(c, now) + spokenMs(t);
      // (a line said inside the tick at its event's own ms, up to a tick after its start)
      if (chain - c < 0 || chain - c > TICK_MS) out.bad.push({ atMs: now, want: c, got: chain, said });
      else out.timed += said.length;
    }
    if (zero) { R.paUntilMs = 0; chain = 0; }
  };
  runHouse(g, houseBot({ mode: modeOf(tier) }), { each, maxMs: 600_000 });
  const H = g.state.armoury.range.house, faults = {};
  for (const L of H.legs ?? []) for (const f of L.faults ?? []) faults[f.kind] = (faults[f.kind] ?? 0) + 1;
  out.laneS = H.goAtMs !== null && H.end ? (H.end.atMs - H.goAtMs) / 1000 : null;
  out.goS = H.goAtMs !== null ? (H.goAtMs - t0) / 1000 : null;
  out.faults = faults; out.end = H.end?.why ?? null;
  return out;
}

export default [
  {
    name: 'the tower never cuts the instructor (the build sheet v0.0.20 §0 item 32): the private by the keys on 48213 from the fill, no held command (all but GO and Stop) starts inside his chained line, and the text the chain timed is the \'say\' fact\'s own (in v0.0.19 LOAD came 3.1 s in, inside the brief\'s 19.1 s)',
    fn() {
      const r = paceLane({ tier: 'private', seed: 48213 });
      const held = r.cmds.filter(c => HELD.has(c.id)), cut = held.filter(c => c.atMs < c.chainMs);
      console.log(`      ${r.cmds.map(c => `${c.id} ${fmt(c.atMs / 1000, 2)} s${HELD.has(c.id) ? ` (chain to ${fmt(c.chainMs / 1000, 2)})` : ''}`).join(', ')}`);
      console.log(`      the instructor's lines ${r.says}, timed into the chain ${r.timed}, a chain not the text's ${r.bad.length}; GO at ${fmt(r.goS, 2)} s, the lane ${fmt(r.laneS, 2)} s, ${r.end}`);
      assert(held.length >= 6 && r.cmds.some(c => c.id === 'go') && r.cmds.some(c => c.id === 'stop'), JSON.stringify(r.cmds));
      assert(!cut.length, `cut: ${JSON.stringify(cut)}`);
      assert(!r.bad.length && r.timed >= 6, JSON.stringify(r.bad.slice(0, 3)));
      const load = r.cmds.find(c => c.id === 'load');
      assert(load.atMs >= 19_150, `LOAD at ${load.atMs}`);
    },
  },
  {
    name: 'the wait moves the lane from GO by chance only: 20 seeds a sheet from the fill, with the wait and with the chain zeroed (the stage-0 tree\'s tower), the mean lane a sheet within 2% and every fault\'s rate within 5 points, printed side by side',
    heavy: true,
    timeoutMs: 30 * 60_000,
    fn() {
      const seeds = Array.from({ length: 20 }, (_, i) => 1000 + 37 * i), bad = [];
      for (const tier of ['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone']) {
        const on = seeds.map(seed => paceLane({ tier, seed })), off = seeds.map(seed => paceLane({ tier, seed, zero: true }));
        const mean = (xs) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length), lane = (rs) => mean(rs.map(r => r.laneS).filter(Number.isFinite));
        const kinds = [...new Set([...on, ...off].flatMap(r => Object.keys(r.faults)))].sort();
        const rate = (rs, k) => (100 * rs.filter(r => r.faults[k]).length) / rs.length;
        const dLane = (100 * (lane(on) - lane(off))) / lane(off), worst = kinds.map(k => [k, rate(on, k) - rate(off, k)]).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0] ?? ['none', 0];
        console.log(`      ${tier.padEnd(8)} lane ${fmt(lane(on), 2)} s with the wait, ${fmt(lane(off), 2)} without (${dLane >= 0 ? '+' : ''}${fmt(dLane, 2)}%); GO ${fmt(mean(on.map(r => r.goS)), 1)} s against ${fmt(mean(off.map(r => r.goS)), 1)}; faults ${kinds.map(k => `${k} ${fmt(rate(on, k), 0)}/${fmt(rate(off, k), 0)}%`).join(', ') || 'none'}; to the card ${on.filter(r => r.end).length}/${off.filter(r => r.end).length}; the worst rate ${worst[0]} ${fmt(worst[1], 0)} points`);
        if (Math.abs(dLane) > 2 || Math.abs(worst[1]) > 5 || on.some(r => !r.end)) bad.push({ tier, dLane, worst });
      }
      assert(!bad.length, JSON.stringify(bad));
    },
  },
];
