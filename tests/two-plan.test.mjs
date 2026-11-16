// OLYMPUS tests: your number two's stoppages through the planner (v0.0.19, the team's track T2; the build sheet's §0 item 20: house-two.js twoFixOf, plan.js planFor on his pid, his gun, 'fire').
//
// v0.0.18's twoDrillOf read the gun's truth (its jam, its magazine's count), so a double feed he had not felt went straight to
// REMEDIAL ACTION: the user's rule "we only know what we know" broken. From v0.0.19 he plans from what he believes, as your own
// rows are planned: a dead trigger is an IMMEDIATE ACTION first, and the truth's drill comes once he has seen it; his "Gun up!"
// waits on his belief (twoGunUp: fixReady), never the truth; and every believed state of his rifle gives him a way or an honest
// none (a none hands his man to you). Each case fails on v0.0.18's code (twoDrillOf is kept, printed beside, as the reference).
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse, houseHonestBot } from './bots/house.mjs';
import { twoFixOf, twoDrillOf, fixReady } from '../src/sim/scenarios/house-two.js';
import { beliefOf } from '../src/sim/arms/firearms.js';

const two = (s) => s.armoury.range.house.two;
const rifleOf = (s) => s.items[s.people[two(s).pid].kit.worn.sling];

export default [
  {
    name: 'his drill on a double feed he has not felt starts with IMMEDIATE ACTION (his belief: a dead trigger), where v0.0.18\'s started REMEDIAL (the truth\'s twoDrillOf); on his hands in the lane the IA first, then the REMEDIAL once the port shows it (fails without twoFixOf)',
    timeoutMs: 60_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'room:3' }), s = g.state, W = two(s), gun = rifleOf(s);
      gun.chamber = 'case'; gun.jam = 'double';
      const truth = twoDrillOf(s, gun);
      const drills = [];
      runHouse(g, houseHonestBot(), { maxMs: 40_000, each: () => { if (W.doing?.cmd === 'down' && drills.at(-1) !== W.doing.macro) drills.push(W.doing.macro); } });
      console.log(`      the truth's drill (v0.0.18) ${truth}; his drills in the lane ${drills.join(' then ')}; his rifle at the end: ${JSON.stringify({ jam: rifleOf(s).jam ?? null, chamber: rifleOf(s).chamber ?? null })}`);
      assert(truth === 'remedial' && drills[0] === 'ia' && drills.includes('remedial') && !rifleOf(s).jam, JSON.stringify({ truth, drills }));
    },
  },
  {
    name: 'his "Gun up!" waits on his belief, never the truth: a rifle he believes stopped is not ready whatever it is, and one he believes ready is (a gun that lies is found by his next shot, TWO_TRIES bounding it)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'room:3' }), s = g.state, W = two(s), gun = rifleOf(s);
      const ready0 = fixReady(twoFixOf(s, W));
      gun.belief = { ...(gun.belief ?? {}), stoppage: 'dead' };
      const believedStopped = twoFixOf(s, W);
      gun.belief = { ...gun.belief, stoppage: null }; delete gun.belief.stoppage; gun.chamber = 'case';
      const lies = twoFixOf(s, W);
      console.log(`      as issued: ready ${ready0}; believed dead (the gun working): ${believedStopped.id} (ready ${fixReady(believedStopped)}); the chamber a case he has not seen (believed live): ${lies.id ?? 'nothing to do'} (ready ${fixReady(lies)}), the truth's drill ${twoDrillOf(s, gun)}`);
      assert(ready0 && !fixReady(believedStopped) && /ia|remedial/.test(believedStopped.id ?? '') && fixReady(lies), JSON.stringify({ ready0, believedStopped: believedStopped.id, lies: lies.id }));
    },
  },
  {
    name: 'every believed state of his rifle on the lane\'s ways (the magazine in or out, its count, the chamber, a stoppage felt, the bolt locked) gives him a way or an honest none, never a dead end (printed by state)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'room:2' }), s = g.state, W = two(s), gun = rifleOf(s), base = JSON.stringify(gun.belief ?? {});
      const out = {};
      for (const mag of ['in', 'out']) for (const count of [0, 5, null]) for (const chamber of ['live', 'empty', 'case', '?']) for (const stoppage of [null, 'dead', 'click', 'case', 'double']) for (const locked of [false, true]) {
        gun.belief = { ...JSON.parse(base), mag, count, chamber, ...(stoppage ? { stoppage } : {}), ...(locked ? { locked: true } : {}) };
        if (!stoppage) delete gun.belief.stoppage;
        if (!locked) delete gun.belief.locked;
        const p = twoFixOf(s, W), k = p.none ? `none (${p.none})` : fixReady(p) ? 'ready' : p.subs?.length ? p.id : 'DEAD END';
        out[k] = (out[k] ?? 0) + 1;
      }
      gun.belief = JSON.parse(base);
      console.log(`      ${Object.values(out).reduce((a, b) => a + b, 0)} believed states: ${Object.entries(out).map(([k, n]) => `${k} ${n}`).join(', ')}`);
      assert(!out['DEAD END'], JSON.stringify(out));
    },
  },
];
