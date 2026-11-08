// The relay (src/sim/arms/gunner.js; tradecraft's armed.js gunner() ported; the build sheet 0.0.7 §2.3, §5.3): generated marines firing their own strings beside you on the tower's commands, through the same shot model, with their own rolls.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { kdBot } from './bots/kd.mjs';
import { kdNow, kdPoint } from '../src/sim/scenarios/range.js';
import { skipString } from '../src/sim/arms/gunner.js';
import { rollerOf } from '../src/sim/combat/roll.js';
import { KD_RANGE } from '../src/data/places/range.js';

// (a relay watched from a setup to the end of its line's string: per gunner the command-to-done times, the shots and scores, the faults)
function watch({ seed, setup, until = 'clear' }) {
  const g = createGame({ scenario: 'test-range', seed, setup }), s = g.state, R = s.armoury.range, bot = kdBot();
  const out = { readyMs: {}, shots: [], cold: 0, forward: 0, unsafe: 0, stops: 0, nds: 0, strings: {} };
  const doneAt = {};
  let cmdI = R.cmd?.i ?? -1, cmdAt = s.clock.ms, ceaseAt = null, seen = 0;
  for (let n = 0; n < 20 * 60 * 10; n++) {
    g.step(1, bot);
    const now = s.clock.ms, K = kdNow(s);
    if (R.cmd && R.cmd.i !== cmdI) { cmdI = R.cmd.i; cmdAt = now; if (R.cmd.id === 'cease') ceaseAt = now; for (const G of R.relay) delete doneAt[G.pid]; }
    for (const G of R.relay) {
      if (G.done && !G.sub && doneAt[G.pid] === undefined && G.i === cmdI) {
        doneAt[G.pid] = now;
        const wh = rollerOf(s, G.pid).value('weapons');
        (out.readyMs[R.cmd.id] ??= []).push({ wh, ms: now - cmdAt });
      }
      const a = s.actors.list.find(x => x.who === G.pid), P = (R.line ?? 25) === 25 ? KD_RANGE.bay.lanes.find(l => l.lane === G.bay) : KD_RANGE.kd.lanes[G.lane - 1].points[R.line];
      if (R.hot && a && a.x > P.box[2]) out.forward++;
    }
    // (on safe once CEASE FIRE's sub-steps are done: by the RO's next command after it)
    if (ceaseAt && R.cmd?.id !== 'cease' && R.cmd?.id !== 'fire') {
      for (const G of R.relay) if (!G.out && (s.items[G.gunId].mode ?? 'safe') !== 'safe') out.unsafe++;
      ceaseAt = null;
    }
    for (const [type, d] of g.bus.events.slice(seen)) {
      if (type === 'shot' && d.who !== s.player.id && d.fired) { out.shots.push({ who: d.who, hot: R.hot, line: R.line, hole: d.hole }); if (!R.hot) out.cold++; }
      if (type === 'shot' && d.who !== s.player.id && !d.fired) out.stops++;
      if (type === 'nd' && d.who !== s.player.id) out.nds++;
    }
    seen = g.bus.events.length;
    if (K.cmd === until || K.end) break;
  }
  // (left: rounds still in its magazines and chamber, so a misfire's round (a dud cleared) is no string cut short)
  for (const G of R.relay) { const gun = s.items[G.gunId], left = G.magIds.reduce((t, id) => t + (s.items[id]?.n ?? 0), 0) + (gun.mag && !G.magIds.includes(gun.mag) ? s.items[gun.mag]?.n ?? 0 : 0) + (gun.chamber === 'live' ? 1 : 0);
    out.strings[G.pid] = { mrk: rollerOf(s, G.pid).value('marksmanship'), wh: rollerOf(s, G.pid).value('weapons'), score: G.score, of: G.of, fired: G.fired, left, out: !!G.out, limit: R.limitHit === R.strings.length - 1 }; }
  return { g, out };
}

export default [
  {
    name: 'the relay fires the confirm at 300 m and the rapid string at 200 m beside you on 12 seeds: each gunner answers every command (its time by Weapon handling), on safe after CEASE FIRE, never a shot on a cold line, never forward of the line while hot, every string fired to its end',
    heavy: true,   // (a whole-course or many-roll run: out of the quick suite, which is held to 60 s; it runs in the full suite and every release)
    fn() {
      const by = { 300: [], 200: [] }, ready = {}, tot = { cold: 0, forward: 0, unsafe: 0, stops: 0, nds: 0, shots: 0 }, short = [];
      let limited = 0, misfired = 0;
      for (let seed = 1; seed <= 12; seed++) for (const [setup, line, rounds] of [['confirm', 300, 5], ['s200', 200, 10]]) {
        const { out } = watch({ seed, setup });
        for (const [k, v] of Object.entries(out.readyMs)) (ready[k] ??= []).push(...v);
        for (const [pid, r] of Object.entries(out.strings)) {
          by[line].push(r);
          // (a string's end is its last round, or the tower's CEASE FIRE at its time limit)
          if (!r.out && r.fired < rounds && r.left > 0 && !r.limit) short.push(`${seed} ${setup} ${pid} fired ${r.fired} of ${rounds}, ${r.left} left`);
          if (r.fired < rounds && !r.left && !r.out && !r.limit) misfired++;
          if (r.limit) limited++;
        }
        for (const k of ['cold', 'forward', 'unsafe', 'stops', 'nds']) tot[k] += out[k];
        tot.shots += out.shots.length;
      }
      const med = (a) => { const b = [...a].sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)] : 0; };
      for (const [cmd, v] of Object.entries(ready)) {
        const lo = v.filter(x => x.wh < 10).map(x => x.ms), hi = v.filter(x => x.wh >= 10).map(x => x.ms);
        console.log(`      ${cmd.padEnd(7)} to done: median ${fmt(med(v.map(x => x.ms)) / 1000, 1)} s (WH < 10: ${fmt(med(lo) / 1000, 1)} s over ${lo.length}; WH ≥ 10: ${fmt(med(hi) / 1000, 1)} s over ${hi.length})`);
      }
      for (const line of [300, 200]) {
        const bands = [[0, 8], [8, 11], [11, 14], [14, 30]];
        console.log(`      ${line} m: ${bands.map(([a, b]) => { const r = by[line].filter(x => x.mrk >= a && x.mrk < b); const sc = r.reduce((t, x) => t + x.score, 0), of = r.reduce((t, x) => t + x.of, 0); return `MRK ${a}–${b - 1}: ${r.length} shooters, ${of ? fmt(100 * sc / of, 0) : '-'}% of the points`; }).join('; ')}`);
      }
      console.log(`      ${tot.shots} shots by the relay; ${tot.stops} pulls that did not fire; ${tot.nds} NDs; on a cold line ${tot.cold}; forward while hot ${tot.forward} ticks; off safe after CEASE FIRE ${tot.unsafe}; strings short ${short.length}; ended by the time limit ${limited}; a round short by a misfire ${misfired}`);
      assert(!tot.cold, `the relay fired on a cold line ${tot.cold} times`);
      assert(!tot.forward, `the relay forward of the line while hot ${tot.forward} ticks`);
      assert(!tot.unsafe, `off safe after CEASE FIRE ${tot.unsafe}`);
      assert(!short.length, short.slice(0, 5).join('; '));
    },
  },
  {
    name: 'relay 2\'s confirm behind the pits\' splash is rolled shot by shot at its start\'s modifiers (gunner.js skipString): its rates by Marksmanship over 3,000 strings of five',
    fn() {
      const g = createGame({ scenario: 'test-range', seed: 48213 }), s = g.state, R = s.armoury.range;
      const rows = {};
      for (let k = 0; k < 500; k++) for (const pid of R.relay2) {
        const mrk = rollerOf(s, pid).value('marksmanship'), r = skipString(s, pid, { line: 300, paper: 'kdA', rounds: 5, position: 'prone', key: `t${k}` });
        const row = (rows[mrk] ??= { n: 0, score: 0, of: 0, v: 0 });
        row.n++; row.score += r.score; row.of += r.of; row.v += r.v;
      }
      console.log(`      ${Object.entries(rows).map(([m, r]) => `MRK ${m}: ${fmt(r.score / r.n, 1)} of 25 a string, ${fmt(r.v / r.n, 2)} V (${r.n})`).join('; ')}`);
      const means = Object.entries(rows).map(([m, r]) => [Number(m), r.score / r.n]).sort((a, b) => a[0] - b[0]);
      assert(means.every(([, v]) => v > 5 && v <= 25), JSON.stringify(means));
      for (let i = 1; i < means.length; i++) assert(means[i][1] >= means[i - 1][1] - 1.5, `better shooters score at least as well: ${JSON.stringify(means)}`);
    },
  },
];
