// OLYMPUS tests: the twin's lane in words (the build sheet v0.0.22 item 6, FL22-6, B's half, and A's merge's finding 8): the habit's
// toast said as kept, and the twin's far walk named for its back room, on one lane of the private by the keys on layout B, 48213
// (room 3 the twin), run once at the first case that needs it and read by both.
//
// Out of house-words (the B and C review of 2026-11-16): B's three cases there took it to 3.7 to 4.5 s of CPU against its quick budget,
// QUICK_FILE_CPU_S 3 s × k (1.3 s without them); together in one new file they were still 2.7 to 3.2 s, so the shorthand's live lane
// is tests/house-shorthand.test.mjs and these two share this lane. Each case fails on the old words (.run/v022/b.md).
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseKeysBot, runHouse } from './bots/house.mjs';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { stepsOf } from '../src/sim/arms/shooting.js';

// (the private by the keys on layout B, 48213, run once: the far walk's rows and lines, and the game for the habit's records)
let twinLane = null;
const twin = () => {
  if (twinLane) return twinLane;
  const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', layout: 'B' }), base = houseKeysBot(), rows = new Set(), lines = new Set();
  const r = runHouse(g, (state, me, mem) => {
    const S = state.stop;
    if (S?.mode === 'stop' && S.phase === 'choose') for (const x of stepsOf(state)) if (x.id === 'move:far') rows.add(x.label);
    const L = instinctNow(state).line;
    if (L?.id === 'cqb-corner' && L.variant === 'far') lines.add(L.text);
    return base(state, me, mem);
  }, { maxMs: 30 * 60_000 });
  return (twinLane = { g, r, rows, lines });
};

export default [
  {
    // (v0.0.22 B, FL22-6: carry.js openApproach's `auto` result, the toast on the end card during SHOW CLEAR (the feel lens's pk-19);
    // read on the twin's lane, which keeps the habit as the set's lane on 48213 does: one record, "Muzzle kept off SSgt Martinez")
    name: 'the habit kept is said as kept: "Muzzle kept off SSgt Martinez (low ready): habit.", never "Muzzle past …: automatic.", which read as a safety breach on the end card (the private by the keys on layout B, 48213; the build sheet v0.0.22 item 6, FL22-6)',
    fn() {
      const { g, r } = twin();
      const habit = (g.state.log ?? []).filter(e => e.kind === 'habit' && e.who === g.state.player.id), auto = habit.filter(e => e.result === 'auto');
      console.log(`      the card ${r.done}; the habit's records ${habit.length}, automatic ${auto.length}: ${[...new Set(auto.map(e => e.text))].map(t => `"${t}"`).join(', ')}`);
      assert(r.done && auto.length > 0 && auto.every(e => /^Muzzle kept off .+ \(.+\): habit\.$/.test(e.text)) && !habit.some(e => /automatic/.test(e.text ?? '')), JSON.stringify(auto.slice(0, 3)));
    },
  },
  {
    // (v0.0.22 B, after A's merge (a.md's finding 8): the twin's far walk is its back room's; bundle.js move:far's label and cqb.js
    // cqb-corner's far line read the plan's `far.words`, "the far leg" where a plan names none)
    name: 'the twin\'s far walk says what it is: "Move: the back room" on the panel and "The back room. …" in the DI\'s line (the private by the keys on layout B, 48213, room 3 the twin), never "the far leg" there (the build sheet v0.0.22\'s "What the user must feel": "Move: the back room.")',
    fn() {
      const { g, rows, lines } = twin();
      console.log(`      the far walk's row ${[...rows].map(t => `"${t}"`).join(', ') || 'none'}; the DI ${[...lines].map(t => `"${t}"`).join(', ') || 'none'}; the lane ${g.state.armoury.range.house.end?.why}`);
      assert([...rows].includes('Move: the back room') && ![...rows].some(t => /far leg/.test(t)) && [...lines].some(t => /^The back room\b/.test(t)) && ![...lines].some(t => /far leg/.test(t)), JSON.stringify({ rows: [...rows], lines: [...lines] }));
    },
  },
];
