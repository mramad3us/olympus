// The score card's line and what it keeps (quick): src/ui/cards/score.js over a Map-backed storage (the build
// sheet 0.0.4 §5.4's ui-scores; ROADMAP §2.2). Held: "Copy my scores" gives exactly ROADMAP §2.2's one
// line, "OLYMPUS v0.0.4 · test-shower · seed 48213 · splash 85 · vignette 70 · pace 60 · ★ no · note: …",
// the aspects in the scene's order and snapped to steps of 5 within 0 to 100, the note on one line (an
// empty one "none"); every score kept in localStorage['olympus.scores'] as { v: 1, scores: [{ scene,
// version, seed, aspects, star, note, atIso }] }, newest last, at most SCORES_MAX; a stored value that
// does not parse starts afresh; the last score of a scene is what the card opens with. And a scene's end
// rule (cards/tests.js endsScene): the shower's or the dressing's end, the drill's stand-down, not a
// shower cut short. Prints the lines and the stored record.
import { assert } from './helpers.mjs';
import { scoreLine, keepScore, readScores, lastScore, snapScore, SCORES_KEY, SCORES_MAX } from '../src/ui/cards/score.js';
import { endsScene, GOAL_S } from '../src/ui/cards/tests.js';

const store = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), map: m }; };

export default [
  {
    name: 'the line is ROADMAP §2.2\'s exactly: OLYMPUS v0.0.4 · test-shower · seed 48213 · splash 85 · vignette 70 · pace 60 · ★ no · note: …',
    fn() {
      const a = scoreLine({ version: '0.0.4', scene: 'test-shower', seed: 48213, aspects: [['splash', 85], ['vignette', 70], ['pace', 60]], star: false, note: 'the steam is good,\nthe watch too fast' });
      const b = scoreLine({ version: '0.0.4', scene: 'test-night', seed: 7, aspects: { night: 72, klaxon: 101, drill: -3 }, star: true, note: '   ' });
      console.log(`      ${a}\n      ${b}`);
      assert(a === 'OLYMPUS v0.0.4 · test-shower · seed 48213 · splash 85 · vignette 70 · pace 60 · ★ no · note: the steam is good, the watch too fast', a);
      assert(b === 'OLYMPUS v0.0.4 · test-night · seed 7 · night 70 · klaxon 100 · drill 0 · ★ yes · note: none', b);
      assert(snapScore(72) === 70 && snapScore(73) === 75 && snapScore('x') === 0, 'snapScore');
    },
  },
  {
    name: 'every score kept in localStorage[\'olympus.scores\'] as { v: 1, scores: [{ scene, version, seed, aspects, star, note, atIso }] }, newest last, at most SCORES_MAX; a bad stored value starts afresh',
    fn() {
      const s = store();
      const r1 = keepScore(s, { scene: 'test-shower', version: '0.0.4', seed: 48213, aspects: [['splash', 85], ['vignette', 70], ['pace', 60]], star: false, note: 'n' }, { atIso: '2026-11-06T12:00:00.000Z' });
      keepScore(s, { scene: 'test-night', version: '0.0.4', seed: 48213, aspects: [['night', 50], ['klaxon', 90], ['drill', 65]], star: true }, { atIso: '2026-11-06T12:05:00.000Z' });
      const all = JSON.parse(s.map.get(SCORES_KEY));
      console.log(`      stored: ${s.map.get(SCORES_KEY).length} bytes; the first: ${JSON.stringify(all.scores[0])}`);
      assert(all.v === 1 && all.scores.length === 2 && JSON.stringify(all.scores[0]) === JSON.stringify(r1), JSON.stringify(all));
      assert(JSON.stringify(Object.keys(r1)) === JSON.stringify(['scene', 'version', 'seed', 'aspects', 'star', 'note', 'atIso']) && r1.aspects.splash === 85, JSON.stringify(r1));
      assert(lastScore(s, 'test-night').aspects.klaxon === 90 && lastScore(s, 'test-x') === null, 'the last score');
      for (let i = 0; i < SCORES_MAX + 5; i++) keepScore(s, { scene: 'test-shower', version: '0.0.4', seed: i, aspects: [['splash', 50]] }, { atIso: 'x' });
      const capped = readScores(s);
      assert(capped.scores.length === SCORES_MAX && capped.scores.at(-1).seed === SCORES_MAX + 4, `capped at ${capped.scores.length}`);
      s.setItem(SCORES_KEY, '{not json');
      assert(readScores(s).scores.length === 0 && readScores(null).scores.length === 0, 'a bad value starts afresh');
      console.log(`      ${SCORES_MAX + 7} kept, ${capped.scores.length} stay (SCORES_MAX), newest last; a bad value reads as none`);
    },
  },
  {
    name: 'a scene ends on its endOn fact: the shower\'s or the dressing\'s end (not a shower cut short), the drill\'s stand-down; its goal shows 8 s',
    fn() {
      const shower = { fact: 'activity', phase: 'end', activity: ['shower', 'dress'] }, night = { fact: 'alert', phase: 'stand-down' };
      const cases = [
        [shower, 'activity', { phase: 'end', activity: 'shower', fraction: 1 }, true],
        [shower, 'activity', { phase: 'end', activity: 'shower', fraction: 0.2, by: 'player' }, false],
        [shower, 'activity', { phase: 'start', activity: 'shower' }, false],
        [shower, 'activity', { phase: 'end', activity: 'dress', fraction: 1 }, true],
        // (the 0.0.6 round's single actions at the sink end nothing; a shower done whole inside a chain still ends the scene)
        [shower, 'activity', { phase: 'end', activity: 'wash-hands', fraction: 1 }, false],
        [shower, 'activity', { phase: 'end', activity: 'shave', fraction: 1, chain: { i: 1, n: 3 } }, false],
        [shower, 'activity', { phase: 'end', activity: 'shower', fraction: 1, chain: { i: 0, n: 2 } }, true],
        [night, 'alert', { phase: 'sound' }, false],
        [night, 'alert', { phase: 'stand-down' }, true],
      ];
      for (const [endOn, type, payload, want] of cases) assert(endsScene(endOn, type, payload) === want, JSON.stringify({ endOn, type, payload }));
      console.log(`      ${cases.length} facts read as the scenes' ends say; the goal line ${GOAL_S} s`);
      assert(GOAL_S === 8, 'GOAL_S');
    },
  },
];
