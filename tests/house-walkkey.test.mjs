// OLYMPUS tests: the walk-in line follows your legs the tick they change (v0.0.23, its build sheet item 10, carried FH-1's refresh key; COMBAT §25.10).
//
// instinct.js re-read its rules on the whole second, on an input act, or when the stop's key changed; walking is none of those. So
// on room 2 of lane A the words "Walk it in: Q to the door, S through it, then D." stood while the recruit held Q, and the leg
// "S through it" (0.4 m of the doorway's span at the Combat walk's 1.23 m/s, 0.33 s) was crossed between two whole seconds: the
// line read "D to the door …" with the marine past the doorway's west jamb (x 19.91 against 20.15, the carried lens's trace, 1.85 s
// late). From v0.0.23 cqb.js walkInKey (the door and the legs' keys where you stand, '' off the walk in) is part of the line's due: the
// line names the new leg the tick the legs change. The reading recruit (tests/bots/reader.mjs readerBot) on 48213 plays the lane to
// room 2's walk in; on that walk the first tick walkInKey's legs begin with S and the first tick the line says "S through it" are at
// most one tick apart. And walkInKey is '' everywhere else: before GO, in stop motion, on the bay, the pairs course and "Bang".
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { readerBot } from './bots/reader.mjs';
import { runHouse, TICK_MS } from './bots/house.mjs';
import { walkInKey } from '../src/sim/skills/instinct/cqb.js';
import { instinctNow } from '../src/sim/skills/instinct.js';

export default [
  {
    name: 'the walk-in line names the leg through the door within one tick of the legs changing, room 2 of lane A by the reading recruit on 48213 (without the refresh key 1.85 s late, the marine past the jamb)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'recruit' }), s = g.state;
      let legsAt = null, lineAt = null, keys = new Set(), firstLine = null;
      const each = () => {
        const H = s.armoury.range.house;
        if (!H || H.cur !== 1 || H.end) return;
        const k = walkInKey(s), me = g.me(), text = instinctNow(s).line?.text ?? '';
        if (k) { keys.add(k); firstLine ??= text; }
        if (legsAt === null && /\|S/.test(k)) legsAt = { tick: s.clock.tick, x: me.x, k };
        if (lineAt === null && /(?:^|[:.] )S through it/.test(text)) lineAt = { tick: s.clock.tick, x: me.x, text };
      };
      runHouse(g, readerBot(), { maxMs: 6 * 60_000, each });
      console.log(`      room 2's walk-in keys seen: ${[...keys].join(', ')}; the first walk-in line "${firstLine}"`);
      console.log(`      the legs to "S" at tick ${legsAt?.tick} (x ${legsAt?.x?.toFixed(2)}), the line "${lineAt?.text}" at tick ${lineAt?.tick} (x ${lineAt?.x?.toFixed(2)}): ${legsAt && lineAt ? `${(lineAt.tick - legsAt.tick) * TICK_MS} ms apart` : 'never'}`);
      assert(legsAt && lineAt && lineAt.tick - legsAt.tick <= 1 && lineAt.tick >= legsAt.tick, JSON.stringify({ legsAt, lineAt }));
    },
  },
  {
    name: 'walkInKey is empty off the house\'s walk in: before GO and in stop motion on the house, on the bay, on the pairs course and on "Bang"',
    fn() {
      const rows = [];
      const h = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'recruit' });
      h.step(40);
      rows.push(['the house before GO', walkInKey(h.state)]);
      const go = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'recruit', setup: 'go' });
      go.step(2);
      rows.push(['the house at GO, in stop motion', walkInKey(go.state)]);
      for (const [name, opts] of [['the bay', { scenario: 'test-handling', setup: 'bench' }], ['pairs', { scenario: 'test-pairs', setup: 'standby' }], ['"Bang"', { scenario: 'test-stress' }]]) {
        const g = createGame({ seed: 48213, ...opts });
        g.step(40);
        rows.push([name, walkInKey(g.state)]);
      }
      console.log(`      ${rows.map(([n, k]) => `${n} '${k}'`).join('; ')}`);
      assert(rows.every(([, k]) => k === ''), JSON.stringify(rows));
    },
  },
];
