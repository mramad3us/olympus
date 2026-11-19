// OLYMPUS tests: the Tests list opens on the scene you played last, else "Stack and clear" (v0.0.23, its build sheet item 15, carried FH-6).
//
// The title's Tests list opened on its first row, "Ten minutes under the shower", three Enters away from the shoot house a returning
// player came back for (the first-hour lens). From v0.0.23 boot.js showTests focuses tests.js testsFocus(scenes, last): the scene
// played last if it is still listed (olympus.tests.last, written on a pick), else the pilot TESTS_PILOT, else the first. Pure.
import { assert } from './helpers.mjs';
import { testsFocus, TESTS_PILOT, TESTS_LAST_KEY } from '../src/ui/cards/tests.js';
import { SCENES, SCENE_IDS } from '../src/data/scenes.js';

export default [
  {
    name: 'the Tests list focuses the scene played last, else "Stack and clear" (none played, or a stale id), never the shower first (the first-hour lens)',
    fn() {
      const scenes = (SCENE_IDS ?? Object.keys(SCENES)).map(id => SCENES[id]).filter(Boolean);
      const rows = [
        ['none played', testsFocus(scenes, null)],
        ['a stale id', testsFocus(scenes, 'test-gone')],
        ['"Bang" last', testsFocus(scenes, 'test-stress')],
        ['the live house last', testsFocus(scenes, 'test-shoothouse-live')],
        ['ids alone, the pilot absent', testsFocus(['test-shower', 'test-night'], null)],
        ['nothing listed', testsFocus([], 'test-stress')],
      ];
      console.log(`      the list's first row "${scenes[0]?.title}"; ${rows.map(([w, f]) => `${w}: ${f}`).join('; ')}; kept as ${TESTS_LAST_KEY}`);
      assert(scenes[0]?.id !== TESTS_PILOT && scenes.some(s => s.id === TESTS_PILOT), JSON.stringify(scenes.map(s => s.id)));
      assert(rows[0][1] === TESTS_PILOT && rows[1][1] === TESTS_PILOT && rows[2][1] === 'test-stress' && rows[3][1] === (scenes.some(s => s.id === 'test-shoothouse-live') ? 'test-shoothouse-live' : TESTS_PILOT)
        && rows[4][1] === 'test-shower' && rows[5][1] === null, JSON.stringify(rows));
    },
  },
];
