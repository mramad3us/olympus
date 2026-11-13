// OLYMPUS tests: the shoot house's rework R9 (COMBAT §25.19.8, made failing criteria): each cause found in the stages' code under a criterion that failed, pinned on the lane it failed on, each failing without its fix.
//
// The gauges (tests/flawless.mjs) are failing criteria from R9 (2026-11-13): every one of F1 to F24 is ENFORCED. Where one
// failed, the cause was found and fixed in the code, never by loosening the criterion; each fix is held here on the seed
// and sheet that showed it, by the honest bot (T and the shot the line names):
//   - the vigil: the house cues each leg (shoothouse.js endLeg, R.cueAtMs), so the muzzle at the ready holds its sector past
//     the 30 s after GO (react.js VIGIL_MS): the hall's man was taken 'area' and the Raider missed his operator par on him
//     on every seed (F10);
//   - the far leg's eyes (bundle.js, from rung 3) and the corporal's muzzle onto the corner he faces (below rung 3,
//     `muzzleTo`): the hostage card and room 1's off-corner man were taken 'area' and aimed with the mount (F10);
//   - a "Clear!" still waiting on the #2 yields to a contact's suspension (stepper.js owedCall) (F10, the corporal's hall);
//   - each man's own expectation for the aim (contact.js `expects`, shot.js sectorAim) and the bracket on the man identified
//     armed (contact.js armedPick) or still up (keptPick) (F10, F13);
//   - the #2's doorway counts as "with you" and a cleared room's men are no longer watched as his (contact.js twoWithYou,
//     hisTick) (F13);
//   - the #2's looks wait while his eyes are on a man or on your sector (bundle.js runSlot eyesOff, stepper.js pauseScans) (F7);
//   - a segment ending on a grid corner is clear when its cells are (nav.js clearLine) (F3).
import { assert } from './helpers.mjs';
import { flawlessLane } from './flawless.mjs';
import { createGame } from './game.mjs';
import { lanePlanOf } from '../src/sim/combat/room.js';
import { openNavOf, clearLine } from '../src/sim/places/nav.js';
import { ROUTE_CLS } from '../src/sim/combat/route.js';

// (a lane's man by stand: his contact of yours, the first round on him after the sighting, ms, and whether the par was met)
const manOf = (rec, stand) => rec.pars.missed.find(m => m.stand === stand && m.by === 'me' && !m.jam && !m.challenged && !m.missedRound) ?? null;

export default [
  {
    name: 'a segment ending exactly on a grid corner reads clear both ways when every cell it passes is free (nav.js clearLine; F3: room 3\'s point, (18.625, 11.375) to (18.5, 11.5), read false one way and true the other)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'go' }), G = openNavOf(lanePlanOf(g.state).area, ROUTE_CLS);
      const a = clearLine(G, 18.625, 11.375, 18.5, 11.5), b = clearLine(G, 18.5, 11.5, 18.625, 11.375);
      console.log(`      (18.625, 11.375) to (18.5, 11.5): ${a}; back: ${b}`);
      assert(a && b, JSON.stringify({ a, b }));
    },
  },
  {
    name: 'the pars the stages missed by their own code are met (F10): the Raider\'s hall man on the user\'s seed and 1037 (the leg\'s cue), the sergeant\'s hostage on 1037 (the far leg\'s eyes), the corporal\'s room 1 man on 1037 (his muzzle on his corner) and his hall man on 1074 (a waiting "Clear!" yields), the Raider\'s armoured man on 1629 (the armed man bracketed, aimed by his own expectation)',
    timeoutMs: 120_000,
    fn() {
      const bad = [];
      for (const [tier, seed, stand] of [['raider', 1489397426, 'H'], ['raider', 1037, 'H'], ['sgt', 1037, '3b'], ['cpl', 1037, '1a'], ['cpl', 1074, 'H'], ['raider', 1629, '2a']]) {
        const r = flawlessLane({ tier, seed }), m = manOf(r, stand);
        console.log(`      ${tier} ${seed} ${stand}: ${m ? 'missed' : 'met'}; pars missed in the lane ${r.pars.missed.length}`);
        if (m) bad.push(`${tier} ${seed} ${stand}`);
      }
      assert(!bad.length, bad.join(', '));
    },
  },
  {
    name: 'the tier one\'s lane on the user\'s seed stops at most 13 times, one press each, with no pause on room 1\'s no-shoot left to the #2 in his doorway (F13); and on 4145 and 2036 no corner is missed while his eyes were on your man or your sector (F7)',
    timeoutMs: 120_000,
    fn() {
      const r = flawlessLane({ tier: 'tierone', seed: 1489397426 }), room1 = r.stops.filter(s => s.leg === 0 && s.why === 'contact');
      console.log(`      1489397426: ${r.stops.length} stops (room 1's contacts ${room1.length}), presses ${r.stops.map(s => s.presses).join(' ')}`);
      assert(r.stops.length <= 13 && room1.length === 1 && r.stops.every(s => s.presses === 1), JSON.stringify(r.stops.map(s => [s.atS, s.why, s.line, s.presses])));
      for (const seed of [4145, 2036]) {
        const q = flawlessLane({ tier: 'tierone', seed });
        console.log(`      ${seed}: corner faults ${q.corners.faults}, hot spots uncovered at "Clear!" ${q.corners.uncovered}`);
        assert(!q.corners.faults && !q.corners.uncovered, JSON.stringify({ seed, corners: q.corners }));
      }
    },
  },
];
