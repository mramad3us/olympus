// test-range, "The line at 300 m" (src/sim/scenarios/range.js; ROADMAP §4.2's 0.0.7 row; the build sheet 0.0.7 §5.3): the KD bot drives the whole course by its actions, from the brief to "The line is clear.", and the setups enter it part-way.
import { assert, fmt, machine } from './helpers.mjs';
import { createGame } from './game.mjs';
import { kdBot } from './bots/kd.mjs';
import { kdNow, ZERO_GROUPS_MAX, forceNd } from '../src/sim/scenarios/range.js';
import { rangeNow } from '../src/sim/scenarios/handling.js';
import { SEQ_KD } from '../src/data/courses.js';
import { checkIds } from './ids-check.mjs';

/** Play test-range with the KD bot to its card: { g, K, ticks, livedMs, gameMs, cmds, marks, calls, s200 } (cmds: [{ cmd, atMs }]). */
export function playRange({ seed = 48213, setup = null, bot = kdBot(), maxTicks = 20 * 60 * 30 } = {}) {
  const g = createGame({ scenario: 'test-range', seed, setup }), s = g.state, t0 = s.clock.ms, cmds = [], marks = [], calls = [];
  let ticks = 0, seen = 0, livedMs = 0, s200 = null;
  for (; ticks < maxTicks; ticks++) {
    const before = s.clock.ms;
    g.step(1, bot);
    if (s.clock.ms - before <= 50) livedMs += s.clock.ms - before;
    const ev = g.bus.events;
    for (; seen < ev.length; seen++) {
      const [type, d] = ev[seen];
      if (type === 'range' && d.phase === 'cmd') cmds.push({ cmd: d.cmd, atMs: s.clock.ms, line: d.line ?? null });
      if (type === 'range' && d.phase === 'call') calls.push({ atMs: s.clock.ms, line: d.line, call: d.call });
      if (type === 'pit' && (d.phase === 'disk' || d.phase === 'flag') && d.lane === s.armoury.range.kdLane) marks.push({ atMs: d.atMs, phase: d.phase, value: d.value ?? null });
      if (type === 'range' && d.phase === 'cmd' && d.cmd === 'fire' && s.armoury.range.string === 's200') s200 = { fromMs: s.clock.ms };
      if (type === 'range' && d.phase === 'cmd' && d.cmd === 'cease' && s200 && !s200.toMs) s200.toMs = s.clock.ms;
    }
    if (kdNow(s).end) break;
  }
  g.clearFacts();
  return { g, K: kdNow(s), ticks, livedMs, gameMs: s.clock.ms - t0, cmds, marks, calls, s200, t0 };
}

export default [
  {
    name: 'the KD bot drives test-range by its actions on seeds 48213, 7 and 99 from the brief to the score card with no fault: the zero in at most four groups and written down, the confirm\'s marks, the 200 m string inside its 60 s with its change, the coach\'s dummy cleared, every case policed, the rounds turned in, the declaration true, every item held once',
    fn() {
      const k = machine().k, t = performance.now();
      for (const seed of [48213, 7, 99]) {
        const { g, K, ticks, livedMs, gameMs, cmds, marks, calls, s200 } = playRange({ seed });
        const s = g.state, R = s.armoury.range;
        const gun = s.items[s.people[s.player.id].kit.worn.sling];
        console.log(`      seed ${seed}: ${K.summary}`);
        console.log(`        ${fmt(gameMs / 60000, 1)} game minutes (${fmt(livedMs / 1000, 0)} s lived, the rest behind the splashes), ${ticks} ticks, ${cmds.length} commands`);
        console.log(`        the zero: ${K.groups.length} group${K.groups.length === 1 ? '' : 's'} ${K.groups.map(x => `[${x.centreCm ? x.centreCm.map(v => fmt(v, 1)).join(', ') : 'none'} → ${x.ok ? 'zeroed' : x.call ? `${x.call.elev} up, ${x.call.wind} right` : 'no call'}]`).join(' ')}; the rifle's zero ${JSON.stringify(gun.zero ?? { elev: 0, wind: 0 })}, the turrets ${JSON.stringify(gun.sight ?? {})}, believed ${JSON.stringify(gun.belief?.zero ?? null)}`);
        console.log(`        the confirm's marks ${marks.filter(m => m.atMs < (s200?.fromMs ?? Infinity)).map(m => (m.phase === 'flag' ? 'miss' : m.value)).join(', ') || 'none'}; the coach's calls ${calls.map(c => `${c.line} m ${c.call?.crossMs !== null && c.call?.crossMs !== undefined ? `wind ${fmt(c.call.crossMs, 1)} m/s hold ${c.call.holdMil?.[0]}` : ''}${c.call?.clicks ? ` clicks ${c.call.clicks.elev}/${c.call.clicks.wind}` : ''}`).join('; ')}`);
        console.log(`        the 200 m string: ${s200?.toMs ? `${fmt((s200.toMs - s200.fromMs) / 1000, 1)} s` : 'not fired'}, ${K.strings.filter(x => x.id === 's200').map(x => `${x.score} of ${x.of}, ${x.shots} shots, ${x.v} V`).join('')}; the dummy (${R.dummy.stage}, round ${R.dummy.round}) ${R.dummy.cleared ? 'cleared' : 'not met'}`);
        console.log(`        brass fired ${K.brass.fired}, policed ${K.brass.policed}, left ${K.brass.left}; rounds turned in ${K.rounds.turnedIn}, held ${K.rounds.held}; declared ${JSON.stringify(K.declared && { ok: K.declared.ok, brass: K.declared.brass, rounds: K.declared.rounds })}`);
        console.log(`        the relay: ${K.relay.map(r => `${r.name} ${r.score}/${r.of}`).join(', ')}; relay 2's confirm ${(K.relay2 ?? []).map(r => `${r.score}/${r.of}`).join(', ')}`);
        assert(K.end?.phase === 'clear' && rangeNow(s).summary === K.summary, `seed ${seed}: the card ${JSON.stringify(K.end)}`);
        assert(!R.faults.length, `seed ${seed}: faults ${JSON.stringify(R.faults)}`);
        assert(K.groups.length >= 1 && K.groups.length <= ZERO_GROUPS_MAX && gun.belief?.zero, `seed ${seed}: the zero in ${K.groups.length} groups, written down ${JSON.stringify(gun.belief?.zero)}`);
        assert(marks.length >= 1, `seed ${seed}: the pits marked the confirm`);
        assert(s200?.toMs && s200.toMs - s200.fromMs <= 61_000, `seed ${seed}: the 200 m string inside its minute`);
        assert(R.dummy.cleared, `seed ${seed}: the dummy cleared by its steps`);
        // (the relay zeroes and dials its dope from the zero it believes, and the zero card is not scored: every gunner's 300 m
        // and 200 m strings out of 75, at least 40% of the points (the integrator's, 0.0.7: the dope threw the zero away and
        // the zero's groups were counted, 4 of 105). A gunner zeroes in as many groups as you do: one wild round in a single
        // group leaves a weak shot ten clicks off (seed 7's PFC Fraser, 34 of 75)
        assert(K.relay.every(r => r.of === 75 && r.score >= 0.4 * r.of), `seed ${seed}: the relay ${JSON.stringify(K.relay.map(r => [r.score, r.of]))}`);
        assert(K.brass.policed === K.brass.fired && K.brass.left === 0, `seed ${seed}: brass ${JSON.stringify(K.brass)}`);
        assert(K.declared?.ok && K.rounds.held === 0, `seed ${seed}: the declaration ${JSON.stringify(K.declared)}`);
        assert(cmds.map(c => c.cmd).filter(c => c === 'end').length === 1, 'one end');
        const ids = checkIds(JSON.parse(g.save()), g.sim.domains);
        console.log(`        ids: ${ids.checked} checked, ${ids.invalid.length} invalid, ${ids.dangling.length} dangling`);
        assert(!ids.invalid.length && !ids.dangling.length, JSON.stringify({ invalid: ids.invalid.slice(0, 5), dangling: ids.dangling.slice(0, 5) }));
      }
      const ms = performance.now() - t;
      console.log(`      three courses in ${fmt(ms, 0)} ms (machine k ${fmt(k, 2)})`);
    },
  },
  {
    name: 'the setups enter the course part-way: confirm at the 300 m line zeroed at the tower\'s prone, s200 at the 200 m line at the dope, far mid-string with the relay firing; each reaches the card',
    fn() {
      for (const setup of ['confirm', 's200', 'far']) {
        const g0 = createGame({ scenario: 'test-range', seed: 48213, setup }), K0 = kdNow(g0.state);
        const { K, gameMs } = playRange({ seed: 48213, setup });
        console.log(`      ${setup}: starts at ${K0.line} m, ${K0.cmd ?? 'nothing said'} (next ${g0.state.armoury.range.next?.id ?? '-'}), the zero ${K0.zeroed ? 'known' : 'to do'}; ends after ${fmt(gameMs / 60000, 1)} game minutes: ${K.summary}`);
        assert(K0.line === (setup === 's200' ? 200 : 300) && K0.zeroed, `${setup}: where it starts`);
        assert(K.end?.phase === 'clear', `${setup}: the card ${JSON.stringify(K.end)}`);
      }
      const seqIds = SEQ_KD.map(c => c.id);
      console.log(`      the tower's course: ${seqIds.length} commands, ${seqIds.join(' · ')}`);
    },
  },
  {
    name: 'a save made mid-confirm on the 300 m line loads and carries on byte for byte: the relay, the pits and the brass are plain data',
    fn() {
      const g = createGame({ scenario: 'test-range', seed: 7, setup: 'confirm' }), bot = kdBot();
      for (let n = 0; n < 20 * 40 && kdNow(g.state).cmd !== 'fire'; n++) g.step(1, bot);
      g.step(20 * 6, bot);
      const save = g.save(), h = createGame({ scenario: 'test-range', seed: 7, setup: 'confirm' });
      h.load(save);
      g.step(20 * 20, bot); h.step(20 * 20, bot);
      const K = kdNow(g.state);
      console.log(`      saved at ${K.cmd} with ${g.state.armoury.range.shots.length} shots on the session; 20 s later ${g.digest()} and ${h.digest()}`);
      assert(g.digest() === h.digest(), 'the save carries on byte for byte');
    },
  },
  {
    name: 'a save made anywhere along test-range loads and carries on byte for byte: in stop motion at the zero, behind the walk\'s splash, while the pits mark the confirm, behind the pits\' splash, mid-way through the 200 m string, and with a casualty of an ND on the line (the integrator\'s, 0.0.7)',
    fn() {
      const t0 = performance.now();
      // (the moments: the first that holds after the last taken, in course order)
      const at = [
        ['stop motion at the zero', (s, K) => K.stage === 'zero' && K.hot && s.stop?.phase === 'choose'],
        ['the walk\'s splash', (s, K) => !!s.skip && K.cmd === 'walk'],
        ['the pits marking at 300 m', (s, K) => K.line === 300 && ['down', 'spot', 'up', 'disk', 'mark'].includes(K.pits?.[K.kdLane]?.phase)],
        ['the pits\' splash', (s, K) => !!s.skip && K.cmd === 'pits'],
        ['the 200 m string', (s, K) => K.line === 200 && K.hot && (K.strings.at(-1)?.holes?.length ?? 0) >= 3],
      ];
      const g = createGame({ scenario: 'test-range', seed: 99 }), bot = kdBot(), rows = [];
      let k = 0;
      for (let n = 0; n < 20 * 60 * 40 && k < at.length && !kdNow(g.state).end; n++) {
        // (a splash's moment: the tick that begins it left open, and the skip moved to its middle, as a save in the page's splash)
        // (a fast-forward (an activity past LIVE_MAX_MS 10 s, the 200 m police) ticked to its end as the page's ffFrame does:
        // tickOpen ticks nothing under a skip, so a loop of it alone would stand there)
        if (g.state.skip?.engine === 'ff') g.step(1, bot);
        else if (at[k][0].includes('splash')) {
          g.tickOpen(bot);
          const sk = g.state.skip;
          if (sk && sk.engine !== 'ff') g.advance(sk.fromMs + Math.round((sk.toMs - sk.fromMs) / 2 / 50) * 50);
        } else g.step(1, bot);
        if (g.state.skip && !at[k][0].includes('splash')) g.step(1, bot);
        const K = kdNow(g.state);
        if (!at[k][1](g.state, K)) continue;
        const save = g.save(), h = createGame({ scenario: 'test-range', seed: 99 });
        h.load(save);
        // (the bot's memory is on the actor, so both carry on alike)
        g.step(20 * 30, bot); h.step(20 * 30, bot);
        rows.push(`${at[k][0]} (${K.cmd}, ${(save.length / 1024).toFixed(0)} KB): ${g.digest() === h.digest() ? 'byte for byte' : 'DIVERGED'}`);
        assert(g.digest() === h.digest(), `${at[k][0]}: the save diverged`);
        k++;
      }
      // (a casualty: an ND forced into the neighbour on the 300 m line, saved while the corpsman works, and after)
      const c = createGame({ scenario: 'test-range', seed: 7, setup: 'confirm' }), cb = kdBot();
      for (let n = 0; n < 20 * 120 && kdNow(c.state).cmd !== 'fire'; n++) c.step(1, cb);
      const me = c.state.actors.list.find(a => a.id === c.state.player.actor), R = c.state.armoury.range;
      const near = R.relay.map(G => c.state.actors.list.find(a => a.who === G.pid)).sort((a, b) => Math.hypot(a.x - me.x, a.z - me.z) - Math.hypot(b.x - me.x, b.z - me.z))[0];
      const nd = forceNd(c.state, c.bus, { toward: near.who });
      for (const [what, phase] of [['the corpsman running', 'down'], ['the corpsman at work', 'care'], ['the casualty\'s splash', 'evac']]) {
        if (phase === 'down') c.step(20, cb);
        for (let n = 0; n < 20 * 120 && (kdNow(c.state).casualty?.phase !== phase || (phase === 'evac' && !c.state.skip)); n++) {
          if (phase === 'evac' && c.state.skip?.engine !== 'ff') { c.tickOpen(cb); const sk = c.state.skip; if (sk && sk.engine !== 'ff') c.advance(sk.fromMs + Math.round((sk.toMs - sk.fromMs) / 2 / 50) * 50); }
          else c.step(1, cb);
        }
        const save = c.save(), h = createGame({ scenario: 'test-range', seed: 7, setup: 'confirm' });
        h.load(save);
        const was = `${kdNow(c.state).casualty?.phase}${c.state.skip ? ', mid-splash' : ''}`;
        // (5 s on: within the corpsman's run and his 20 s of care, so the next moment is still ahead)
        c.step(20 * 5, cb); h.step(20 * 5, cb);
        rows.push(`${what} (${nd?.grade}, saved at ${was}): ${c.digest() === h.digest() ? 'byte for byte' : 'DIVERGED'}`);
        assert(c.digest() === h.digest(), `${what}: the save diverged`);
      }
      for (const r of rows) console.log(`      ${r}`);
      console.log(`      ${rows.length} saves in ${fmt((performance.now() - t0) / 1000, 1)} s`);
      assert(k === at.length, `the moments reached: ${k} of ${at.length}`);
    },
  },
];
