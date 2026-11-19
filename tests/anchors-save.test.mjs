// test-anchors' saves (the build sheet v0.0.24 §6, §8 F114, its numbers read three higher; heavy: ten courses, over a quick file's 3 s of CPU): a save made at nine points of the course (the brief, each station's command, the first string's turn, the floating string's drift, the gap before the end), loaded into a fresh game, carries on by the same bot to the card byte for byte as the course played straight.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { anchorsBot } from './bots/void.mjs';
import { anchorsNow } from '../src/sim/scenarios/anchors.js';
import { checkIds } from './ids-check.mjs';

/** The save points, each a test of the course's view and its own record: the first tick it holds is the point. */
export const POINTS = Object.freeze([
  ['the brief', (N) => N.phase === 'brief'],
  ...[1, 2, 3, 4, 5].map(n => [`station ${n}'s command`, (N) => N.phase === 'move' && N.st === n - 1]),
  ['station 1\'s turn', (N) => N.phase === 'string' && N.st === 0],
  ['the floating string\'s drift', (N) => N.phase === 'drift'],
  ['the gap before the end', (N) => N.phase === 'gap' && N.st === 5],
]);
const MAX = 20 * 60 * 15;

export default [
  {
    name: 'anchors-save (F114): nine save points on 48213 as the private, each loaded into a fresh game, carry on to the card byte for byte as the straight run',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      // (the straight run: the tick each point is first met, and the last tick's digest)
      const g0 = createGame({ scenario: 'test-anchors', seed: 48213, tier: 'private' }), bot0 = anchorsBot(), at = new Map();
      let n = 0;
      for (; n < MAX && !anchorsNow(g0.state).end; n++) {
        const N = anchorsNow(g0.state);
        for (const [name, test] of POINTS) if (!at.has(name) && test(N)) at.set(name, n);
        g0.step(1, bot0);
      }
      const T = n, D = g0.digest();
      console.log(`      straight: ${T} ticks to the card, digest ${D}; the points at ticks ${POINTS.map(([w]) => `${w} ${at.get(w) ?? '-'}`).join(', ')}`);
      const bad = [];
      for (const [name] of POINTS) {
        const tp = at.get(name);
        if (tp === undefined) { bad.push(`${name}: never met`); continue; }
        const a = createGame({ scenario: 'test-anchors', seed: 48213, tier: 'private' }), bot = anchorsBot();
        a.step(tp, bot);
        const json = a.save(), ids = checkIds(JSON.parse(json), a.sim.domains);
        const b = createGame({ scenario: 'test-anchors', seed: 48213, tier: 'private' });
        b.load(json);
        const again = b.save() === json;
        b.step(T - tp, anchorsBot());
        const d = b.digest(), end = !!anchorsNow(b.state).end;
        console.log(`      ${name} (tick ${tp}, ${json.length} bytes): saved again byte for byte ${again}, ids ${ids.invalid.length + ids.dangling.length ? 'BAD' : 'valid'}; carried on ${T - tp} ticks: ${d}${d === D ? '' : ' DIFFERS'}${end ? '' : ' (no card)'}`);
        if (!again || d !== D || !end || ids.invalid.length || ids.dangling.length) bad.push(name);
      }
      assert(!bad.length, bad.join('; '));
    },
  },
];
