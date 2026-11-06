// Stop motion (src/sim/arms/shooting.js; TIME §4.3, COMBAT §3, WEAPONS §7.1): the clock stands while you choose, each step lives its formula's ticks, the sub-steps in order, the interrupts, the tempos, the taps, the saves.
// The timing tests drop the range session (armoury.range) so no chained wait runs after a step: the
// steps alone, at Weapon handling, Marksmanship and Fitness 10 (pace 1.0007).
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { stepAct } from './bots/lib.mjs';
import { rangeBot } from './bots/range.mjs';
import { stepsOf, stopNow, enterStop } from '../src/sim/arms/shooting.js';
import { actionMs } from '../src/sim/arms/firearms.js';
import { rollerOf } from '../src/sim/combat/roll.js';
import { aimMsOf, pullMsOf, heldOf } from '../src/sim/arms/shot.js';
import { digest } from '../src/core/hash.js';
import { MACROS } from '../src/sim/arms/drills.js';
import { SEQ } from '../src/data/courses.js';
import { post } from '../src/core/queue.js';
import { TICK_MS } from '../src/core/clock.js';

const T = 20;
// (the scene at the line, its player at value 10 in the three skills; session: keep the range's (the tower, the chained wait) or drop it)
function game({ seed = 48213, setup = null, session = false, wh = 10, mrk = 10 } = {}) {
  const g = createGame({ scenario: 'test-handling', seed, hour: 9, setup });
  const s = g.state, p = s.people[s.player.id];
  p.skills = { cls: 'soldier', os: 0, skills: { ...p.skills.skills, marksmanship: [mrk, 0], weapons: [wh, 0], fitness: [10, 0] } };
  g.lane = s.armoury.range.lane;
  if (!session) { s.armoury.range = null; s.events = s.events.filter(e => e.kind !== 'range-cmd'); }
  if (!s.stop) enterStop(s, g.bus, { via: 'shoot' });
  s.stop.pick = `paper:${g.lane}`;
  return g;
}
// (one step chosen and played to its end: its lived ms, its formula's ms, whether the clock then stands)
function run(g, step, tempo = 'normal', target = null) {
  const n0 = g.facts('step').length, t0 = g.state.clock.ms;
  g.step(1, { act: [stepAct(step, tempo, target)] });
  for (let n = 0; g.state.stop?.mode === 'stop' && g.state.stop.phase === 'act' && g.state.stop.doing?.kind !== 'wait' && n < 4000; n++) g.step(1);
  const t1 = g.state.clock.ms;
  g.step(T);
  const facts = g.facts('step').slice(n0), subs = facts.filter(f => f.phase === 'sub');
  const formula = subs.reduce((a, f) => a + (f.toMs - f.fromMs), 0);
  return { lived: t1 - t0, formula, still: g.state.clock.ms === t1 && g.state.clock.holds.includes('stop'), subs: subs.map(f => f.action), ok: subs.map(f => f.ok), facts };
}

export default [
  {
    name: 'time stands still while you choose: 600 ticks in choose with no input move neither the clock nor the save',
    fn() {
      // (the save but the tick counter, clock.seq, which counts every tick the loop runs, held or not)
      const still = (g) => { const j = JSON.parse(g.save()); delete j.clock.seq; return digest(JSON.stringify(j)); };
      const g = game({ setup: 'hot' }), t = g.state.clock.ms, d = still(g), seq = g.state.clock.seq;
      g.step(600);
      console.log(`      600 ticks in choose: the clock ${g.state.clock.ms - t} ms on, the save (but clock.seq, ${seq} → ${g.state.clock.seq}) ${still(g) === d ? 'the same' : 'CHANGED'}, holds [${g.state.clock.holds}]`);
      assert(g.state.clock.ms === t && still(g) === d && g.state.clock.holds.join() === 'stop', JSON.stringify(g.state.clock));
    },
  },
  {
    name: 'each step lives ceil(Σ ms / TICK_MS) ticks and the clock stands exactly at its end: the rifle up, LOAD 2,450 ms, MAKE READY 3,150, the aim 900, the hold to +4 1,350, Fire 400, UNLOAD (5,001 ms of formula, 5,050 lived) at value 10; the sub-steps rolled in order and logged',
    fn() {
      const g = game(), rows = [];
      const up = run(g, 'up'); rows.push(['up', up]);
      const load = run(g, 'macro:load'); rows.push(['LOAD', load]);
      const ready = run(g, 'macro:ready'); rows.push(['MAKE READY', ready]);
      const lane = g.state.stop.pick;
      const aim = run(g, 'aim', 'normal', lane); rows.push(['aim', aim]);
      const hold = run(g, 'hold'); rows.push(['hold', hold]);
      const semi = run(g, 'selector:semi'); rows.push(['off safe', semi]);
      const fire = run(g, 'fire'); rows.push(['Fire', fire]);
      const unload = run(g, 'macro:unload'); rows.push(['UNLOAD', unload]);
      for (const [k, r] of rows) console.log(`      ${k.padEnd(10)} ${String(r.formula).padStart(5)} ms of formula, lived ${String(r.lived).padStart(5)} (${r.lived / TICK_MS} ticks)${r.still ? ', then still' : ', NOT still'}: ${r.subs.join(', ')}`);
      for (const [k, r] of rows) assert(r.still && r.lived === Math.ceil(r.formula / TICK_MS) * TICK_MS, `${k}: ${JSON.stringify(r)}`);
      // (the clean times, no fumble's ×1.6 in them: what the panel shows and what a step lives when every roll passes)
      const s = g.state, pid = s.player.id, roller = rollerOf(s, pid), gun = s.items[s.stop.gun];
      const sum = (subs) => subs.reduce((a, x) => a + actionMs(roller, gun, x, { tempo: 'normal' }), 0), lived = (ms) => Math.ceil(ms / TICK_MS) * TICK_MS;
      const card = { key: `paper:${g.lane}`, x: 1125, z: g.me().z, dM: 25 };
      s.people[pid].kit.carry.posture = 'lowReady';
      const clean = { LOAD: sum(MACROS.load.subs), 'MAKE READY': sum(MACROS.ready.subs), aim: aimMsOf(s, pid, s.stop.gun, card), hold: Math.ceil(4 / 3 * 1000), Fire: pullMsOf(s, pid, s.stop.gun).ms, UNLOAD: sum(MACROS.unload.subs) };
      console.log(`      clean: ${Object.entries(clean).map(([k, v]) => `${k} ${v} ms, lived ${lived(v)}`).join('; ')} (the sheet's UNLOAD 5,000: its seven sub-steps rounded to whole ms make 5,001, one tick more)`);
      assert(lived(clean.LOAD) === 2450 && lived(clean['MAKE READY']) === 3150 && lived(clean.aim) === 900 && lived(clean.hold) === 1350 && lived(clean.Fire) === 400 && lived(clean.UNLOAD) === 5050, JSON.stringify(clean));
      assert(aim.lived === 900 && hold.lived === 1350 && fire.lived === 400, JSON.stringify(rows.map(([k, r]) => [k, r.lived])));
      void heldOf;
      assert(load.subs.join() === MACROS.load.subs.join() && ready.subs.join() === MACROS.ready.subs.join(), 'the sub-steps in order');
      const logged = g.state.log.filter(e => e.kind === 'roll' && e.step && e.who === g.state.player.id).map(e => e.step);
      const want = [...MACROS.load.subs, ...MACROS.ready.subs].filter(a => a !== 'finger');
      assert(want.every((a, i) => logged.includes(a)) && logged.indexOf('magIn') < logged.indexOf('charge'), `logged: ${logged.join(', ')}`);
      console.log(`      the rolls logged in order: ${logged.join(', ')}`);
    },
  },
  {
    name: 'a macro that halts on a failure not routine leaves its rest in the panel first ("carry on"); rushed is ×0.6 and never routine, careful ×1.5 and +2; Fire held is the hold to +4 and the pull, the roll at +4',
    fn() {
      // (a recruit's MAKE READY until one halts: Weapon handling 1, the charge at DC 8)
      let g = null, r = null;
      for (let seed = 1; seed < 80 && !r; seed++) {
        g = game({ seed, wh: 1 }); run(g, 'up'); run(g, 'macro:load'); r = run(g, 'macro:ready');
        const inHand = !String(g.state.people[g.state.player.id].kit.carry.posture).startsWith('slung');
        if (!r.facts.some(f => f.phase === 'halt') || !inHand || !stopNow(g.state).queue.length) r = null;
      }
      assert(r, 'no recruit\'s MAKE READY halted in 40 worlds');
      const queue = stopNow(g.state).queue, first = stepsOf(g.state).find(s => s.kind === 'command');
      console.log(`      a recruit's MAKE READY halted after ${r.subs.join(', ')}: the queue ${queue.join(', ')}; the panel's first command "${first.label}"`);
      assert(queue.length && first.id === 'queue' && first.subs.map(x => x.id).join() === queue.join(), JSON.stringify({ queue, first }));
      // (the tempos at value 10)
      const h = game(); run(h, 'up');
      const hr = rollerOf(h.state, h.state.player.id), hg = h.state.items[h.state.stop.gun];
      // (a sub-step's time: its tempo's clean time, or ×1.6 of it when the roll missed)
      const subMs = (r, action) => { const f = r.facts.find(x => x.phase === 'sub' && x.action === action); return f.toMs - f.fromMs; };
      const fits = (ms, clean) => Math.abs(ms - clean) <= 1 || Math.abs(ms - Math.round(clean * 1.6)) <= 1;
      const rushed = run(h, 'macro:load', 'rushed');
      const magIn = h.state.log.filter(e => e.kind === 'roll' && e.step === 'magIn').at(-1).roll;
      const careful = run(h, 'macro:ready', 'careful');
      const press = h.state.log.filter(e => e.kind === 'roll' && e.step === 'pressCheck').at(-1).roll;
      const mi = { got: subMs(rushed, 'magIn'), normal: actionMs(hr, hg, 'magIn'), rushed: actionMs(hr, hg, 'magIn', { tempo: 'rushed' }) };
      const pc = { got: subMs(careful, 'pressCheck'), normal: actionMs(hr, hg, 'pressCheck'), careful: actionMs(hr, hg, 'pressCheck', { tempo: 'careful' }) };
      console.log(`      LOAD rushed lived ${rushed.lived} ms: the magazine in ${mi.got} ms (normal ${mi.normal}, rushed ${mi.rushed}), its roll ${magIn.tempo}, ${magIn.routine ? 'routine' : 'not routine'}, ${magIn.mods.map(m => `${m.v} ${m.why}`).join(', ')}`);
      console.log(`      MAKE READY careful lived ${careful.lived} ms: the press check ${pc.got} ms (normal ${pc.normal}, careful ${pc.careful}), its roll ${press.tempo}, ${press.mods.map(m => `+${m.v} ${m.why}`).join(', ')}`);
      assert(fits(mi.got, mi.rushed) && Math.abs(mi.rushed - mi.normal * 0.6) <= 1 && magIn.tempo === 'rushed' && !magIn.routine && magIn.mods.some(m => m.v === -3 && m.src === 'tempo'), JSON.stringify({ mi, magIn }));
      assert(fits(pc.got, pc.careful) && Math.abs(pc.careful - pc.normal * 1.5) <= 1 && press.tempo === 'careful' && press.mods.some(m => m.v === 2 && m.src === 'tempo'), JSON.stringify({ pc, press }));
      run(h, 'aim', 'normal', h.state.stop.pick); run(h, 'selector:semi');
      const held = run(h, 'fire', 'careful');
      const shot = h.state.log.filter(e => e.kind === 'roll' && e.step === 'fire').at(-1).roll;
      console.log(`      Fire held lived ${held.lived} ms (${held.subs.join(' then ')}): ${shot.mods.map(m => `${m.v > 0 ? '+' : ''}${m.v} ${m.why}`).join(', ')}`);
      assert(held.subs.join() === 'hold,fire' && shot.mods.some(m => m.why === 'the aim held' && m.v === 4), JSON.stringify(shot.mods));
    },
  },
  {
    name: 'a tap inside the recovery fires a follow-up at the same aim (a double from Marksmanship 8, no third below 18); X leaves only while choosing; a live step out of the mode holds nothing',
    fn() {
      const g = game({ setup: 'hot', mrk: 10 }), s = g.state;
      run(g, 'selector:semi');
      const n0 = g.facts('shot').length;
      g.step(1, { act: [stepAct('fire')] }); g.step(2); g.step(1, { act: [stepAct('fire')] }); g.step(1); g.step(1, { act: [stepAct('fire')] });
      for (let n = 0; s.stop.phase === 'act' && n < 200; n++) g.step(1);
      const shots = g.facts('shot').slice(n0), tap = g.state.log.filter(e => e.kind === 'roll' && e.step === 'fire').at(-1).roll;
      console.log(`      Fire, then Fire 150 ms later, then a third: ${shots.length} shots, ${shots.map(x => x.atMs - shots[0].atMs).join(' and ')} ms apart; the follow-up's roll: ${tap.mods.map(m => `${m.v} ${m.why}`).join(', ')}`);
      assert(shots.length === 2 && tap.mods.some(m => m.why === 'the muzzle still up from the last'), JSON.stringify(shots));
      // (X: refused mid-step, taken while choosing)
      g.step(1, { act: [stepAct('macro:cease')] });
      g.step(1, { act: ['shoot'] });
      const midStep = !!s.stop;
      for (let n = 0; s.stop?.phase === 'act' && n < 200; n++) g.step(1);
      g.step(1, { act: ['shoot'] });
      console.log(`      X during CEASE FIRE: ${midStep ? 'still in the mode' : 'LEFT'}; X while choosing: ${g.state.stop ? 'STILL IN' : 'out'}, holds [${g.state.clock.holds}]`);
      assert(midStep && !g.state.stop && !g.state.clock.holds.length, 'X');
      // (a live step: W out of the mode, the clock running every tick)
      const t0 = g.state.clock.ms, st0 = g.me().stance;
      g.step(1, { act: ['stance:up'] });
      let held = 0, live = 0;
      for (let n = 0; g.state.stop && n < 100; n++) { if (g.state.clock.holds.length) held++; if (g.state.stop?.mode === 'live') live++; g.step(1); }
      console.log(`      A out of the mode from ${st0}: a live step of ${g.state.clock.ms - t0} ms (${live} ticks live, ${held} held), now ${g.me().stance ?? 'standing'}, state.stop ${JSON.stringify(g.state.stop)}`);
      assert(held === 0 && live > 0 && g.state.stop === null && g.me().stance === 'kneel', 'the live step');
    },
  },
  {
    name: 'the tower\'s command ends the chained wait at its tick; a CEASE FIRE cuts a step at its sub-step\'s end; the instinct speaks every tone under \'stop\', only urgent lines under v0.0.4\'s \'ready\'',
    fn() {
      // (the chained wait: each step that leaves the line ready for the tower's command waits on its next, cut at that command's tick)
      const g = game({ session: true }), lines = [];
      g.step(T * 2);
      for (const step of ['up', 'stance:prone', 'macro:load']) {
        g.step(1, { act: [stepAct(step)] });
        for (let n = 0; g.state.stop.doing?.kind !== 'wait' && g.state.stop.phase === 'act' && n < 400; n++) g.step(1);
        const chainAt = g.state.clock.ms, cmd0 = g.state.armoury.range.cmd.id, chained = g.state.stop.doing?.kind === 'wait';
        for (let n = 0; g.state.stop.phase === 'act' && n < 20 * 30; n++) g.step(1);
        const cut = g.facts('step').filter(f => f.phase === 'cut').at(-1), R = g.state.armoury.range;
        lines.push(`${step} ended at ${chainAt} on "${cmd0}"${chained ? ', chained' : ', NOT chained'}; the tower's "${R.cmd.id}" at ${R.cmd.atMs} cut the wait (${cut.text}), the clock standing at ${g.state.clock.ms === R.cmd.atMs ? 'its tick' : g.state.clock.ms}`);
        assert(chained && g.state.stop.phase === 'choose' && g.state.clock.ms === R.cmd.atMs && cut.text === R.cmd.id, JSON.stringify({ step, cmd: R.cmd, ms: g.state.clock.ms }));
      }
      for (const l of lines) console.log(`      ${l}`);
      // (CEASE FIRE mid-UNLOAD: posted for the second sub-step's middle, the step cut at that sub-step's end)
      const s = g.state, i = SEQ.findIndex(c => c.id === 'cease');
      g.step(1, { act: [stepAct('macro:unload')] });
      const d = s.stop.doing;
      for (let n = 0; d.i < 1 && n < 200; n++) g.step(1);
      const atMs = Math.ceil((d.subFromMs + 200) / 1000) * 1000 < d.untilMs ? Math.ceil((d.subFromMs + 200) / 1000) * 1000 : null;
      if (atMs) {
        post(s, { atMs, prio: 2, kind: 'range-cmd', src: 'arms:range', payload: { cmd: 'cease', i } });
        const subEnd = d.untilMs;
        for (let n = 0; s.stop?.phase === 'act' && n < 400; n++) g.step(1);
        const c = g.facts('step').filter(f => f.phase === 'cut').at(-1);
        console.log(`      CEASE FIRE at ${atMs} during ${d.list[1]} (to ${subEnd}): the step cut at ${c.toMs === subEnd ? 'that sub-step\'s end' : c.toMs}, the rest not done (${d.subs.map(x => x.action).join(', ')} of ${d.list.length})`);
        assert(c.step === 'macro:unload' && c.toMs === subEnd && d.subs.length === 2 && s.clock.ms === Math.ceil(subEnd / TICK_MS) * TICK_MS, JSON.stringify({ c, subs: d.subs.length }));
      } else console.log('      (no whole second fell inside the sub-step: the cut not tried on this seed)');
      // (the instinct in stop motion speaks below urgent; under 'ready' in a gunless barracks only urgent lines)
      const inst = g.state.$instinct;
      const b = createGame({ scenario: 'barracks', seed: 48213, hour: 9 });
      b.step(T * 2); b.step(1, { act: ['ready'] }); b.step(T * 3);
      const bl = b.state.$instinct?.line;
      console.log(`      under 'stop': "${inst?.lead ?? ''} ${inst?.line?.text ?? '(no line)'}" (${inst?.line?.tone}); under 'ready': ${bl ? `"${bl.text}" (${bl.tone})` : 'no line'}`);
      assert(inst?.line && inst.line.tone !== 'urgent' && inst.lead === 'Time stands still.' && (!bl || bl.tone === 'urgent'), JSON.stringify({ inst: inst?.line, bl }));
    },
  },
  {
    name: 'a save made while choosing and one made mid-step load in a fresh game and carry on byte for byte with the range bot to the line\'s end',
    fn() {
      const play = (g, n) => { const bot = rangeBot(); for (let k = 0; k < n && !g.me().bot?.done; k++) g.step(1, bot); };
      const a = createGame({ scenario: 'test-handling', seed: 7, hour: 9 });
      const saves = [];
      const bot = rangeBot();
      for (let k = 0; k < 2500 && saves.length < 2; k++) {
        a.step(1, bot);
        const S = a.state.stop;
        if (!saves.length && S?.phase === 'choose' && a.state.armoury.range.cmd?.id === 'fire') saves.push({ at: 'choosing', json: a.save() });
        if (saves.length === 1 && S?.phase === 'act' && S.doing?.kind === 'command' && S.doing.i > 0) saves.push({ at: `mid-step (${S.doing.step}, sub ${S.doing.i})`, json: a.save() });
      }
      play(a, 6000);
      const end = a.save();
      for (const sv of saves) {
        const b = createGame({ scenario: 'test-handling', seed: 7, hour: 9 });
        b.load(sv.json); play(b, 6000);
        console.log(`      saved ${sv.at}: carried on to ${b.state.armoury.range.end?.phase ?? 'no end'} ${b.save() === end ? 'byte for byte' : 'DIFFERENT'}`);
        assert(b.save() === end, sv.at);
      }
      assert(saves.length === 2, `${saves.length} saves made`);
    },
  },
];
