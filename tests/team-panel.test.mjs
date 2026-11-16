// OLYMPUS tests: the panel's TEAM group (v0.0.19, the team's track T4; groups.js MAPS.TEAM): Cover me 1, "#2, bang it" 2, "Breacher up" 3 (its first live way; the others TEAM's third level), "As you were" 4, 5 empty, Challenge 6, Engage 7, 8 and 9 kept for On me and Hold that door. AT THE DOOR's five and STOPPAGE's five are unchanged, so nothing new overlaps; the keys are physical codes, labelled for AZERTY.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { lanePlanOf } from '../src/sim/combat/room.js';
import { MAPS, SITUATIONS, modelOf, keysFor } from '../src/sim/arms/groups.js';

const actor = (s, pid) => s.actors.list.find(a => a.who === pid);

export default [
  {
    name: 'TEAM holds Cover me 1, "#2, bang it" 2, "Breacher up" 3, "As you were" 4, Challenge 6, Engage 7; at room 2 on the full loadout, stacked with your #2, "#2, bang it" and "Breacher up: pry" take 2 and 3 live, their keys in layouts A, B and C; AT THE DOOR\'s and STOPPAGE\'s fives as v0.0.18 drew them',
    fn() {
      const words = MAPS.TEAM.map(x => x?.words ?? null);
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'cpl', setup: 'room:2', loadout: 'full' }), s = g.state, H = s.armoury.range.house, P = lanePlanOf(s).plans['o:w4:r2'];
      const me = actor(s, s.player.id), two = actor(s, H.two.pid); me.x = P.stack[0][0]; me.z = P.stack[0][1]; two.x = P.stack[1][0]; two.z = P.stack[1][1];
      const steps = stepsOf(s), M = modelOf(steps), T = M.groups.TEAM.slots, at = (k) => T[k]?.row ? `${T[k].row.id}${T[k].row.off ? ` (${T[k].row.off})` : ''}` : '-';
      const keys = Object.fromEntries(['a', 'b', 'c'].map(L => [L.toUpperCase(), keysFor(steps, T[2]?.row?.id ?? '', { layout: L })?.text ?? null]));
      console.log(`      TEAM's words: ${words.map((w, k) => `${k} ${w ?? '-'}`).join(' · ')}`);
      console.log(`      at room 2 stacked (full): 2 ${at(2)}, 3 ${at(3)}, 4 ${at(4)}; "#2, bang it" by the keys A ${keys.A}, B ${keys.B}, C ${keys.C}`);
      console.log(`      AT THE DOOR ${JSON.stringify(SITUATIONS.door.five)}; STOPPAGE ${JSON.stringify(SITUATIONS.stoppage.five)}`);
      assert(words[1] === 'Cover me' && words[2] === '#2, bang it' && words[3] === 'Breacher up' && words[4] === 'As you were' && words[5] === null && words[6] === 'Challenge' && /^Engage/.test(words[7]) && words[8] === null && words[9] === null, JSON.stringify(words));
      assert(/^drill:team:bang>/.test(T[2]?.row?.id ?? '') && !T[2].row.off && /^drill:team:breach@pry>/.test(T[3]?.row?.id ?? '') && !T[3].row.off, JSON.stringify({ 2: at(2), 3: at(3) }));
      assert(Object.values(keys).every(k => k && k.length), JSON.stringify(keys));
      // (v0.0.20, the build sheet's item 5: AT THE DOOR's five is P3 as drawn on every lane, Breach (DRILL 5) on 5)
      assert(JSON.stringify(SITUATIONS.door.five) === JSON.stringify([['DRILL', 1], ['DRILL', 2], ['DRILL', 3], ['DRILL', 4], ['DRILL', 5]]) && JSON.stringify(SITUATIONS.stoppage.five) === JSON.stringify([['GUN', 2], ['GUN', 3], ['GUN', 4], { id: 'macro:remedial', words: 'REMEDIAL' }, ['TEAM', 1]]), 'the fives unchanged');
    },
  },
];
