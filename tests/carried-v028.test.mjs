// OLYMPUS tests: carried-v028, what v0.0.28's carried stage owed (the lead's calls and the user's reports of 2026-11-20, .run/v028/USER-REPORTS.md).
//
// F157's key (the lead's call of 2026-11-20: "Fix the KEY, not the threshold"). F157 ("every choice met" over the boarding's honest lanes)
// was skipped at v0.0.27's release, red on "never met: give": the security table said 'surrender', the track recorded that and the state
// 'hands', and nothing ever said 'give'. One choice, one name: the table's pinned disaster is 'give' (opfor.js CHOICE_TABLE, choiceOf), the
// card words it GAVE UP, and collarLane (tests/bots/collar.mjs) reads a holdout's hands up as his give, once a man, the hauler's crew's hands
// up to a challenge apart as 'crew hands'. The irregulars' table (the pirates' and the smugglers') has no give by design (the cell doctrine);
// theirs comes through the challenge, which ends a freeze or a cover. Each case fails without its half of the fix.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { collarLane } from './bots/collar.mjs';
import { CHOICE_TABLE, CHOICE_TABLES } from '../src/sim/scenarios/opfor.js';
import { runSheetOf } from '../src/sim/scenarios/shoothouse.js';

export default [
  {
    name: 'F157\'s key: the security table\'s pinned disaster is a give, named \'give\' as the card and the gauge name it; no table says \'surrender\'',
    fn() {
      const words = new Set(Object.values(CHOICE_TABLES).filter(Boolean).flatMap(t => Object.values(t).flatMap(r => Object.values(r))));
      assert(CHOICE_TABLE[3].disaster === 'give' && !words.has('surrender') && words.has('give'), JSON.stringify({ pinned: CHOICE_TABLE[3], words: [...words] }));
      console.log(`      the tables' words: ${[...words].join(', ')} (pinned, a disaster: ${CHOICE_TABLE[3].disaster})`);
    },
  },
  {
    name: 'F157\'s key: on the boarding a holdout who puts his hands up (the challenge ending his freeze or cover) is met as \'give\', once a man, and the crew\'s hands up as \'crew hands\', apart (pirates, the private by the keys, seed 3222)',
    fn() {
      const r = collarLane(createGame, { tier: 'private', seed: 3222, bot: 'honest', holdouts: 'pirates' }), s = r.game.state, R = s.armoury.range;
      const armedHands = R.turners.filter(T => T.live && !T.live.unarmed && (R.house.boarding.track?.[T.stand] ?? []).some(e => e.st === 'hands')).map(T => T.stand);
      const crewHands = R.turners.filter(T => T.live?.unarmed && (R.house.boarding.track?.[T.stand] ?? []).some(e => e.st === 'hands')).map(T => T.stand);
      console.log(`      ${r.end} in ${r.laneS} s; the holdouts with their hands up ${armedHands.join(', ') || 'none'}, the crew ${crewHands.join(', ') || 'none'}; the gauge's keys ${JSON.stringify(r.track)}`);
      assert(armedHands.length && r.track.give === armedHands.length, JSON.stringify({ armedHands, track: r.track }));
      assert(crewHands.length && r.track['crew hands'] === crewHands.length && r.track.hands === undefined, JSON.stringify({ crewHands, track: r.track }));
      // (the card names the give in the men's own word: GAVE UP, never SURRENDER or GIVE)
      const sheet = JSON.stringify(runSheetOf(s));
      assert(!/SURRENDER|\bGIVE AT\b/.test(sheet), sheet.slice(0, 400));
    },
  },
];
