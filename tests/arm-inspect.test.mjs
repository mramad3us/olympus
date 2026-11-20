// OLYMPUS tests: the inspection at the turn-in, F177's turn-in half (the build sheet v0.0.28 item 13, §6 B, §8; WEAPONS §10.3).
//
// On armoury-world's turn-in setup (cleaned, at the barrel): the turn-backs end by the third, taken with the fault 'dirty' (TURNBACK_MAX), each
// sending the rifle back to the table for "Clean it again" at the three tempos (RECLEAN's rows); a lost firing pin retaining pin (the gun's
// fault 'pin') found, the chit's splash and the fault 'part'; the magazines counted at the turn-in, one left on the line counted short,
// recorded lost with its place (armoury.js reportLost) and the fault 'lost'; the serial read at the window by the record. The armourer's
// verdict is upkeep.js inspect (A's): the rifle made filthy before each look, so each look finds it. The review of v0.0.28 B's: a loaded
// magazine dropped on the lane by the panel (G, Drop it) is the NCO's find at the declaration, booked lost with its round, never his
// short count ("My count, and you signed for it", the fault 'count'); a magazine left and a turn-back: one lost entry and one fault 'lost'
// over the two looks (a booked magazine counted short again, never booked again); the card's bench the decision at the table, never the re-clean;
// one round back is "One round back."
import { assert } from './helpers.mjs';
import { armGame, armOf, act, untilCmd, toStation } from './armoury-world.mjs';
import { armouryNow, armouryOf, TURNBACK_MAX } from '../src/sim/scenarios/armoury-day.js';
import { move } from '../src/sim/arms/kit.js';
import { armouryBot } from './bots/armoury.mjs';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { stepAct } from './bots/lib.mjs';

// (the barrel, then the window: the rifle handed in, the look to its verdict)
function turnIn(g) {
  untilCmd(g, 'barrel'); toStation(g); act(g, 'barrel');
  untilCmd(g, 'handIn'); toStation(g); act(g, 'handIn');
  for (let t = 0; t < 400 && armouryNow(g.state).busy; t++) g.step(1);
}

export default [
  {
    name: 'F177: the turn-backs end by the third, taken with the fault \'dirty\'; each sends the rifle back to the table for Clean it again',
    fn() {
      const g = armGame({ tier: 'recruit', setup: 'turnin' }), A = armOf(g), R = armouryOf(g.state), gun = () => g.state.items[A.gunId];
      const seen = [];
      for (let k = 0; k < TURNBACK_MAX; k++) {
        gun().foul = 0.4; gun().dust = 0.3;
        turnIn(g);
        seen.push(A.inspections.at(-1)?.verdict);
        if (A.passed) break;
        untilCmd(g, 'clean'); toStation(g);
        const rows = armouryNow(g.state).rows.map(r => r.label);
        if (k === 0) console.log(`      the table again: ${rows.join(' | ')}`);
        act(g, armouryNow(g.state).rows.find(r => r.tempo === 'normal').id);
      }
      untilCmd(g, 'signIn'); toStation(g); act(g, 'signIn');
      for (let t = 0; t < 400 && !R.end; t++) g.step(1);
      console.log(`      verdicts ${seen.join(', ')}; turn-backs ${A.turnBacks}; faults ${JSON.stringify(R.faults.map(f => f.rule))}; the end ${R.end?.phase}`);
      assert(seen.length === TURNBACK_MAX && seen.every(v => v === 'again') && A.turnBacks === TURNBACK_MAX && R.faults.some(f => f.rule === 'dirty') && R.end?.phase === 'clear', JSON.stringify({ seen, turnBacks: A.turnBacks, faults: R.faults }));
    },
  },
  {
    name: 'F177, F182: the lost pin found, its chit and the fault \'part\'; a magazine left on the line counted short at the turn-in, reported lost with its place, the fault \'lost\'',
    fn() {
      const g = armGame({ tier: 'private', setup: 'turnin' }), A = armOf(g), R = armouryOf(g.state), pid = g.state.player.id;
      g.state.items[A.gunId].fault = 'pin';
      const left = A.mags[2];
      move(g.state, left, { ground: { area: 'melas.ground', x: 1100, z: 286 } });
      turnIn(g);
      for (let t = 0; t < 400 && (armouryNow(g.state).busy || g.state.skip); t++) g.step(1);
      const lost = g.state.armoury.lost ?? [], said = g.facts('say').map(f => f.text);
      console.log(`      verdict ${A.inspections.at(-1)?.verdict}; the pin's fault ${g.state.items[A.gunId].fault ?? 'cleared'}; lost ${JSON.stringify(lost)}; faults ${JSON.stringify(R.faults.map(f => f.rule))}; "${said.filter(t => /magazines|pin|chit/i.test(t)).join('" / "')}"`);
      assert(A.inspections.at(-1)?.verdict === 'pin' && R.faults.some(f => f.rule === 'part') && !g.state.items[A.gunId].fault, JSON.stringify({ v: A.inspections, faults: R.faults }));
      assert(lost.some(l => l.itemId === left) && R.faults.some(f => f.rule === 'lost') && said.some(t => /two magazines|count two/i.test(t)), JSON.stringify({ lost, said: said.slice(-6) }));
      void pid;
    },
  },
  {
    name: 'F173, F182: a loaded magazine dropped on the lane is booked lost at the declaration with its round, never the NCO\'s short count (no shakedown, no fault \'count\'); the round counted once; "One round back." (the review of v0.0.28 B)',
    fn() {
      const g = armGame({ setup: 'lane' }), A = armOf(g), R = armouryOf(g.state), say0 = g.facts('say').length;
      untilCmd(g, 'lane');
      const mag = g.state.items[A.given ?? A.gunId].mag, n0 = g.state.items[mag]?.n ?? 0;
      // (G, then the panel's Drop it, then X: the magazine and its rounds left on the lane's ground)
      g.step(1, { act: ['ready'] });
      for (let t = 0; t < 400 && !(g.state.stop?.phase === 'choose' && !g.state.stop?.doing); t++) g.step(1);
      const drop = stepsOf(g.state).find(s => s.id === 'magOut:drop' && !s.off);
      g.step(1, { act: [stepAct(drop.id, 'normal')] });
      for (let t = 0; t < 400 && !(g.state.stop?.phase === 'choose' && !g.state.stop?.doing); t++) g.step(1);
      g.step(1, { act: [stepAct('leave')] });
      // (the honest marine to the canopy: the declaration and the shakedown's splash, if any, behind him; the turn-in's count of a booked
      // magazine is the next case's)
      untilCmd(g, 'clean', armouryBot());
      const line = g.state.armoury.ammoIssues.find(a => a.id === R.issueId), lost = g.state.armoury.lost ?? [], said = g.facts('say').slice(say0).map(f => f.text);
      const faults = R.faults.map(f => f.rule), counted = (line.fired ?? 0) + (line.back ?? 0) + lost.reduce((t, l) => t + (l.rounds ?? 0), 0);
      console.log(`      the magazine dropped with ${n0}; at the canopy: faults ${JSON.stringify(faults)}; lost ${JSON.stringify(lost.map(l => [l.itemId, l.where, l.rounds ?? 0]))}; the line n ${line.n}, fired ${line.fired}, back ${line.back}, found ${line.found ?? 0}: ${counted} of ${line.n} counted`);
      console.log(`      "${said.filter(t => /back|magazine|count|Nobody|sheet/i.test(t)).join('" / "')}"`);
      assert(n0 > 0 && drop && !R.end, JSON.stringify({ n0, drop: !!drop, end: R.end }));
      assert(!faults.includes('count') && !said.some(t => /Nobody leaves|Count what you sign for/.test(t)) && !line.found, JSON.stringify({ faults, said }));
      assert(lost.length === 1 && lost[0].itemId === mag && lost[0].rounds === n0 && faults.filter(f => f === 'lost').length === 1 && counted === line.n, JSON.stringify({ lost, faults, counted, line }));
      assert(said.some(t => /^One (round )?back( to me)?\. Noted\.$/.test(t)) && !said.some(t => /One rounds/.test(t)), JSON.stringify(said));
    },
  },
  {
    name: 'F182: a magazine left on the line and a turn-back: the two looks count it short, one lost entry and one fault \'lost\'; the card\'s bench is the decision at the table, never the re-clean (the review of v0.0.28 B)',
    fn() {
      const g = armGame({ tier: 'private', setup: 'turnin' }), A = armOf(g), R = armouryOf(g.state), gun = () => g.state.items[A.gunId];
      const left = A.mags[2];
      move(g.state, left, { ground: { area: 'melas.ground', x: 1100, z: 286 } });
      gun().foul = 0.4; gun().dust = 0.3;
      turnIn(g);
      const first = A.inspections.at(-1)?.verdict;
      untilCmd(g, 'clean'); toStation(g);
      act(g, armouryNow(g.state).rows.find(r => r.tempo === 'normal').id);
      turnIn(g);
      untilCmd(g, 'signIn'); toStation(g); act(g, 'signIn');
      for (let t = 0; t < 400 && !R.end; t++) g.step(1);
      const lost = (g.state.armoury.lost ?? []).filter(l => l.itemId === left), faults = R.faults.map(f => f.rule), card = armouryNow(g.state).card.summary;
      const min = (ms) => Math.max(1, Math.round(ms / 60000)), [c0, c1] = A.cleans;
      console.log(`      the looks ${A.inspections.map(v => v.verdict).join(', ')}; lost entries for the magazine ${lost.length}; faults ${JSON.stringify(faults)}; the cleans ${A.cleans.map(c => `${c.tempo} ${min(c.ms)} min`).join(', ')}; the card "${card}"`);
      assert(first === 'again' && A.inspections.length === 2 && lost.length === 1 && faults.filter(f => f === 'lost').length === 1, JSON.stringify({ v: A.inspections, lost, faults }));
      assert(c0 && c1 && min(c0.ms) !== min(c1.ms) && card.includes(`${c0.tempo}, ${min(c0.ms)} min`) && !card.includes(`${c1.tempo}, ${min(c1.ms)} min`) && /passed after one turn-back/.test(card), JSON.stringify({ card, cleans: A.cleans }));
    },
  },
];
