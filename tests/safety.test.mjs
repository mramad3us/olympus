// Range safety in full on the KD (src/sim/scenarios/range.js safety(), over handling.js rangeRules and carry.js rangeSafety; tradecraft's scenarios/range.js safety() ported; WEAPONS §6.4, §6.6; the build sheet 0.0.7 §2.3, §5.3): each violation forced once on the 300 m line and the line's answer.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { kdBot } from './bots/kd.mjs';
import { stepAct } from './bots/lib.mjs';
import { kdNow, forceNd } from '../src/sim/scenarios/range.js';
import { SEQ_KD } from '../src/data/courses.js';

// (the confirm setup, played by the KD bot to a command, then the test's own hands)
function at(cmd, { seed = 48213, setup = 'confirm' } = {}) {
  const g = createGame({ scenario: 'test-range', seed, setup }), bot = kdBot();
  for (let n = 0; n < 20 * 120 && kdNow(g.state).cmd !== cmd; n++) g.step(1, bot);
  g.clearFacts();
  return g;
}
const answers = (g) => g.facts('range').filter(d => ['fault', 'stopped', 'casualty', 'closed'].includes(d.phase)).map(d => `${d.phase}${d.rule ? `:${d.rule}` : ''}${d.kind ? `/${d.kind}` : ''}`);
const said = (g) => g.facts('say').map(d => d.text);
const choose = (g, step, tempo = 'normal', target = null) => g.step(1, { act: [stepAct(step, tempo, target)] });
// (until time stands still for a choice, or n ticks)
const settle = (g, n = 400) => { for (let k = 0; k < n && !(g.state.stop?.phase === 'choose'); k++) g.step(1); };
// (out of the mode, so time runs and the rules layer watches: X while choosing)
const leave = (g) => { settle(g); if (g.state.stop?.mode === 'stop') choose(g, 'leave'); };

export default [
  {
    name: 'each violation of range safety forced once on the KD\'s 300 m line gets the line\'s answer: uprange, aimed at a person, another lane\'s face aimed (a warning) then fired at (the stop), forward of the line while hot (the stop), a shot on a cold line (a warning) and a second (the stop), acting ahead of the tower, the finger on while moving, off safe on a cold line',
    fn() {
      const rows = [];
      // (uprange: the rifle in hand turned back up the range)
      { const g = at('fire'); leave(g); g.state.people[g.state.player.id].kit.carry.posture = 'lowReady'; g.me().face = 'left'; g.step(2); rows.push(['uprange', answers(g), kdNow(g.state).end?.phase]); }
      // (aimed at a person: the coach in the sights)
      { const g = at('fire'); settle(g); const coach = g.state.actors.list.find(a => a.who === g.state.armoury.range.coachId); choose(g, 'aim', 'normal', coach.id); g.step(40); rows.push(['person', answers(g), kdNow(g.state).end?.phase]); }
      // (another lane's face: aimed, a warning; fired at, the stop)
      { const g = at('fire'); settle(g); const R = g.state.armoury.range, other = `face:${R.kdLane + 1}`;
        choose(g, 'aim', 'normal', other); settle(g); const warned = answers(g).slice();
        if ((g.state.items[g.state.people[g.state.player.id].kit.worn.sling].mode ?? 'safe') === 'safe') { choose(g, 'selector:semi'); settle(g); }
        choose(g, 'fire'); g.step(40); rows.push(['lane', answers(g), kdNow(g.state).end?.phase, warned]); }
      // (forward of the line while hot)
      { const g = at('fire'); leave(g); g.me().x += 4; g.step(2); rows.push(['forward', answers(g), kdNow(g.state).end?.phase]); }
      // (a shot on a cold line, then a second)
      { const g = createGame({ scenario: 'test-range', seed: 48213, setup: 'far' }), R = g.state.armoury.range;
        R.hot = false;
        choose(g, 'fire'); settle(g); g.step(2); const first = answers(g).slice(); settle(g); choose(g, 'fire'); settle(g); g.step(2); rows.push(['cold', answers(g), kdNow(g.state).end?.phase, first]); }
      // (acting ahead: MAKE READY at the tower's LOAD)
      { const g = at('load'); settle(g); choose(g, 'macro:load'); for (let k = 0; k < 400 && g.state.stop?.doing?.kind !== 'wait'; k++) g.step(1); choose(g, 'macro:ready'); g.step(5); rows.push(['ahead', answers(g), kdNow(g.state).end?.phase]); }
      // (the finger on while moving: a stance changed with the finger in the guard)
      { const g = at('fire'); settle(g); g.state.people[g.state.player.id].kit.carry.finger = 'on'; choose(g, 'stance:kneel'); g.step(5); rows.push(['finger', answers(g), kdNow(g.state).end?.phase]); }
      // (off safe on a cold line, past the grace)
      { const g = at('clear', { setup: 's200' }); g.step(1);
        const gun = g.state.items[g.state.people[g.state.player.id].kit.worn.sling]; g.state.people[g.state.player.id].kit.carry.posture = 'lowReady'; gun.mode = 'semi';
        const cmd = g.state.armoury.range.cmd; cmd.id = 'police'; cmd.i = SEQ_KD.findIndex(c => c.id === 'police' && c.stage === 's200'); cmd.atMs -= 10_000;
        leave(g); g.state.people[g.state.player.id].kit.carry.posture = 'lowReady'; gun.mode = 'semi';
        g.step(2); rows.push(['coldSafe', answers(g), kdNow(g.state).end?.phase]); }
      for (const [rule, a, end, before] of rows) console.log(`      ${rule.padEnd(9)} → ${a.join(', ') || 'nothing'}${before ? ` (first: ${before.join(', ') || 'nothing'})` : ''}${end ? `; the scene ${end}` : ''}`);
      const r = Object.fromEntries(rows.map(([k, a, e, b]) => [k, { a, e, b }]));
      assert(r.uprange.a.includes('fault:uprange/stop') && r.uprange.e === 'stopped', 'uprange: the stop');
      assert(r.person.a.includes('fault:person/stop') && r.person.e === 'stopped', 'aimed at a person: the stop');
      assert(r.lane.b.includes('fault:lane/warn') && r.lane.a.includes('fault:lane/stop'), 'another lane: the warning, then the stop');
      assert(r.forward.a.includes('fault:forward/stop') && r.forward.e === 'stopped', 'forward while hot: the stop');
      assert(r.cold.b?.includes('fault:cold/warn') && r.cold.a.includes('fault:cold/stop'), 'a cold line: the warning, then the stop');
      assert(r.ahead.a.includes('fault:ahead/warn'), 'acting ahead: the warning');
      assert(r.finger.a.includes('fault:finger/warn'), 'the finger moving: the warning');
      assert(r.coldSafe.a.includes('fault:coldSafe/warn'), 'off safe on a cold line: the warning');
    },
  },
  {
    name: 'a negligent discharge of each grade on the KD gets the line\'s answer: ND-1 into the berm and ND-2 past it stop you as v0.0.5\'s did; a gunner\'s ND is the RO\'s CEASE FIRE and his rifle taken; ND-4 through the coach and ND-5 through his head are the casualty: CEASE FIRE, the corpsman, the outcome splash, the range closed, and the card with the incident',
    fn() {
      const out = [];
      const play = (g) => { const bot = kdBot(); for (let n = 0; n < 20 * 60 * 40 && !kdNow(g.state).end; n++) g.step(1, bot); return kdNow(g.state); };
      const cases = [
        // (between lanes, so the pullers in the pits are not on the line: penetrate.js reads a body's span from the ground, not the pits' floor)
        ['ND-1', (g) => forceNd(g.state, g.bus, { toward: { x: 1620, z: g.me().z + 2.5 }, y: 1.0 })],
        ['ND-2', (g) => forceNd(g.state, g.bus, { toward: { x: 1700, z: g.me().z }, y: 20 })],
        ['gunner', (g) => forceNd(g.state, g.bus, { pid: g.state.armoury.range.relay[0].pid, toward: { x: 1620, z: g.state.actors.list.find(a => a.who === g.state.armoury.range.relay[0].pid).z + 2.5 }, y: 1.0 })],
        ['ND-4', (g) => forceNd(g.state, g.bus, { toward: g.state.armoury.range.coachId })],
        // (through the coach's head as he stands: BODY's head kill is a chance (HEAD_KILL 0.6 × w), so the seeds are tried in turn)
        ['ND-5', (g) => forceNd(g.state, g.bus, { toward: g.state.armoury.range.coachId, y: 1.62 }), [48213, 7, 99, 1, 2, 3]],
      ];
      for (const [k, fire, seeds = [48213]] of cases) {
        let g, nd;
        for (const seed of seeds) { g = at('fire', { seed }); nd = fire(g); if (k !== 'ND-5' || g.state.armoury.range.casualty?.grade === 'ND-5') break; }
        const early = answers(g).slice(), K = play(g);
        out.push({ k, nd: nd?.grade, into: nd?.into, hits: (nd?.hits ?? []).map(h => `${h.onId} ${h.part}`), early, end: K.end?.phase, summary: K.summary, incident: K.incident, cas: K.casualty, words: said(g).filter(t => /CEASE FIRE!|Corpsman|closed/i.test(t)).slice(0, 3) });
      }
      for (const o of out) console.log(`      ${o.k.padEnd(6)} graded ${o.nd} into ${o.into}${o.hits.length ? `, hit ${o.hits.join(', ')}` : ''} → ${o.early.join(', ') || 'nothing'}; ${o.words.join(' / ')}; the card: ${o.summary}${o.incident ? ` | ${o.incident}` : ''}${o.cas ? ` (${o.cas.grade}, ${o.cas.outcome})` : ''}`);
      const by = Object.fromEntries(out.map(o => [o.k, o]));
      assert(by['ND-1'].nd === 'ND-1' && by['ND-1'].end === 'stopped', `ND-1: ${JSON.stringify(by['ND-1'])}`);
      assert(['ND-2', 'ND-3'].includes(by['ND-2'].nd) && by['ND-2'].end === 'stopped', `ND-2: ${JSON.stringify(by['ND-2'])}`);
      assert(by.gunner.end === 'clear' && by.gunner.words.some(t => /CEASE FIRE/.test(t)), `a gunner's: ${JSON.stringify(by.gunner)}`);
      assert(by['ND-4'].nd === 'ND-4' && by['ND-4'].cas?.phase === 'outcome' && by['ND-4'].end === 'clear' && /Range closed/.test(by['ND-4'].incident ?? ''), `ND-4: ${JSON.stringify(by['ND-4'])}`);
      assert(by['ND-5'].cas?.grade === 'ND-5' && by['ND-5'].cas.outcome === 'dead' && by['ND-5'].end === 'clear', `ND-5: ${JSON.stringify(by['ND-5'])}`);
    },
  },
];
