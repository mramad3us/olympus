// test-handling, "Show clear" (src/sim/scenarios/handling.js; ROADMAP §4.2's 0.0.6 row as v0.0.5): the range bot drives the whole scene by its keys, from the brief to "The line is clear."
import { assert, fmt, machine } from './helpers.mjs';
import { createGame } from './game.mjs';
import { rangeBot, THINK_S } from './bots/range.mjs';
import { rangeNow } from '../src/sim/scenarios/handling.js';
import { scoreOf } from '../src/sim/arms/paper.js';
import { TICK_MS } from '../src/core/clock.js';
import { checkIds } from './ids-check.mjs';

const hm = (ms, t0) => `+${fmt((ms - t0) / 1000, 2)} s`;
/** Play a scene with a bot to its end: { g, ticks, t0, steps: [{ step, startMs, endMs, formula, why }], cmds } */
export function playScene({ seed, faulty = false, maxTicks = 20 * 300 }) {
  const g = createGame({ scenario: 'test-handling', seed, hour: 9 }), s = g.state, bot = rangeBot({ faulty }), t0 = s.clock.ms;
  const steps = [], cmds = [];
  let open = null, seen = 0, ticks = 0;
  for (; ticks < maxTicks && !g.me().bot?.done; ticks++) {
    const at = s.clock.ms;                                         // (a step ends in a tick's input layer, at the clock the tick began with)
    g.step(1, bot);
    const ev = g.bus.events;
    for (; seen < ev.length; seen++) {
      const [type, d] = ev[seen];
      if (type === 'range' && d.phase === 'cmd') cmds.push({ cmd: d.cmd, atMs: at });
      if (type !== 'step' || d.step === 'wait') continue;
      if (d.phase === 'start') open = { step: d.step, startMs: d.fromMs, formula: 0 };
      else if (d.phase === 'sub' && open) open.formula += d.toMs - d.fromMs;
      else if (open && (d.phase === 'end' || d.phase === 'halt' || d.phase === 'cut')) { steps.push({ ...open, endMs: at, why: d.phase === 'end' ? d.text : d.phase }); open = null; }
    }
  }
  return { g, s, ticks, t0, steps, cmds };
}

export default [
  {
    name: 'the range bot drives the scene by its keys on seeds 48213 and 7, from the brief to "The line is clear." with no fault: the stoppage felt, looked at and cleared by its steps, each step its formula\'s time, the paper\'s score the sum of its holes, the issue\'s fired the shots',
    fn() {
      const k = machine().k, t = performance.now();
      for (const seed of [48213, 7]) {
        const { g, s, ticks, t0, steps, cmds } = playScene({ seed });
        const R = s.armoury.range, now = rangeNow(s), log = g.me().bot.log;
        const lived = (s.clock.ms - t0) / 1000;
        console.log(`      seed ${seed}: lane ${R.lane}; the set: a ${R.set.kind} in magazine ${R.set.mag}, its round ${6 - R.set.n} of 5; ${ticks} ticks`);
        console.log(`        the tower: ${cmds.map(c => `${c.cmd} ${hm(c.atMs, t0)}`).join(', ')}`);
        console.log(`        lived ${fmt(lived, 1)} s in ${log.length} decisions: modelled ${fmt((lived + THINK_S * log.length) / 60, 1)} real minutes at ${THINK_S} s a decision`);
        console.log(`        decisions: ${log.map(l => l.step + (l.tempo !== 'normal' ? `@${l.tempo}` : '')).join(' ')}`);
        const rolls = s.log.filter(e => e.kind === 'roll' && e.who === s.player.id && e.roll?.skill === 'weapons');
        const shots = s.log.filter(e => e.kind === 'roll' && e.step === 'fire');
        console.log(`        rolls: ${rolls.length} of Weapon handling (${fmt(100 * rolls.filter(e => e.roll.routine).length / rolls.length, 0)}% routine, ${rolls.filter(e => !e.roll.ok).length} missed, ${rolls.filter(e => !e.roll.ok && !e.roll.routine).length} with teeth), ${shots.length} of Marksmanship (${shots.filter(e => e.roll.ok).length} passed); the coach's look: ${s.log.filter(e => e.step === 'show').map(e => e.roll?.total + ' against ' + e.roll?.dc).join(', ')}`);
        now.strings.forEach((x, i) => console.log(`        string ${i + 1}: ${x.score} of ${x.of}, ${x.v} V, ${x.hits} of ${x.shots} on the paper, group ${x.groupCm} cm`));
        console.log(`        total ${now.summary.score} of ${now.summary.of}, ${now.summary.v} V; holes ${R.shots.map(h => h.hole ? `(${h.hole.join(', ')})${h.score}${h.v ? 'V' : ''}` : 'miss').join(' ')}`);
        const stopSay = s.log.filter(e => e.kind === 'say' && e.say === 'speech').map(e => e.text);
        console.log(`        the coach: ${stopSay.map(x => `"${x}"`).join(' ')}`);
        const sum = R.shots.reduce((a, h) => a + h.score, 0), issue = s.armoury.ammoIssues.find(a => a.id === R.issueId);
        const off = steps.filter(x => x.endMs - x.startMs !== Math.ceil(x.formula / TICK_MS) * TICK_MS);
        console.log(`        ${steps.length} steps, each lived its formula's ticks${off.length ? `: NOT ${off.map(x => x.step).join(', ')}` : ''}; faults ${R.faults.length}; the issue fired ${issue.fired} of ${issue.n}`);
        assert(R.end?.phase === 'clear' && !R.faults.length && !g.errors.length, JSON.stringify({ end: R.end, faults: R.faults }));
        assert(!off.length && sum === now.summary.score && now.summary.score === scoreOf(R.shots.map(h => ({ at: h.hole, score: h.score, v: h.v }))).score && issue.fired === R.shots.length, JSON.stringify({ off, sum, issue }));
        assert(R.stoppage?.cleared && (R.set.kind === 'stovepipe' ? R.shots.length === 15 : R.shots.length === 14), JSON.stringify({ stoppage: R.stoppage, shots: R.shots.length }));
        assert(lived >= 60 && lived <= 150 && log.length >= 28 && log.length <= 45, JSON.stringify({ lived, decisions: log.length }));
        const ids = checkIds(JSON.parse(g.save()), g.sim.domains);
        console.log(`        the save's ids: ${ids.checked} checked, ${ids.invalid.length} invalid, ${ids.dangling.length} dangling; ${ids.items} items, each held once`);
        assert(!ids.invalid.length && !ids.dangling.length, JSON.stringify(ids));
      }
      const ms = performance.now() - t;
      console.log(`      both scenes played in ${fmt(ms, 0)} ms (machine k ${fmt(k, 2)}: the quick suite's ceiling ${fmt(2000 * k, 0)} ms)`);
      assert(ms < 4000 * k, `${ms} ms`);
    },
  },
  {
    name: 'a set double on a magazine\'s 4th round strips its 5th and leaves the bolt locked on the empty magazine once cleared: the coach says what he set in that same string, before its CEASE FIRE (the code review\'s: counted cleared only on a round chambered, the line came a string late on seeds 91, 122 and 128, and never in the third magazine on 15, 23 and 73)',
    fn() {
      const out = [];
      for (const seed of [91, 15]) {
        const { g, s } = playScene({ seed });
        const R = s.armoury.range, ev = g.bus.events;
        const at = (pred) => ev.findIndex(([type, d]) => pred(type, d));
        const setLine = at((type, d) => type === 'say' && d.kind === 'speech' && /double|seated/i.test(d.text));
        const shot = at((type, d) => type === 'shot' && d.stoppage === 'double');
        const cease = ev.findIndex(([type, d], i) => i > shot && type === 'range' && d.phase === 'cmd' && d.cmd === 'cease');
        out.push(`seed ${seed}: the set ${JSON.stringify(R.set)}; the double at event ${shot}, the coach's line at ${setLine} ("${ev[setLine]?.[1]?.text}"), that string's CEASE FIRE at ${cease}; the end ${R.end?.phase}`);
        assert(R.set.kind === 'double' && R.set.n === 2 && R.stoppage?.cleared && shot >= 0 && setLine > shot && setLine < cease && R.end?.phase === 'clear', JSON.stringify({ seed, set: R.set, stoppage: R.stoppage, shot, setLine, cease, end: R.end }));
      }
      for (const l of out) console.log(`      ${l}`);
    },
  },
  {
    name: 'the careless shooter: MAKE READY before the tower is a warning, then an aim at the coach stops the line ("Cease fire! Cease fire!", range { phase: \'stopped\', why: \'person\' }), the mode left and the rifle slung',
    fn() {
      const { g, s, t0 } = playScene({ seed: 48213, faulty: true });
      const R = s.armoury.range, faults = g.facts('range').filter(f => f.phase === 'fault'), stopped = g.facts('range').find(f => f.phase === 'stopped');
      console.log(`      ${faults.map(f => `${f.kind} '${f.rule}' "${f.text}"`).join('; ')}; then ${JSON.stringify({ phase: stopped?.phase, why: stopped?.why })} at ${hm(R.end.atMs, t0)}; the mode ${s.stop ? 'STILL ON' : 'left'}, the rifle ${s.people[s.player.id].kit.carry.posture}`);
      assert(faults[0]?.rule === 'ahead' && faults[0].kind === 'warn' && stopped?.why === 'person' && R.end.phase === 'stopped' && !s.stop && s.people[s.player.id].kit.carry.posture === 'slungFront', JSON.stringify({ faults, stopped }));
    },
  },
];
