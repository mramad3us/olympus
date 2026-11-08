// The hit card's marks on a turner (src/sim/arms/marks.js hitMarks; VIEWS §4.2, §7.7; COMBAT §25.18.4; the build sheet 0.0.10 §5.2, §8 items 15 to 17): the user's answer to VIEWS question 22, "with the same logic we represent the shooting range targets, drawn with impact points drawn as well", belief while the string runs and truth from its end; every round marked once, in order.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { stressBot } from './bots/stress.mjs';
import { hitMarks, callK, calledAt, AIM_CM, CALL_MRK, CALL_K_MIN, CALL_BLUR_CM, MISS_CALL_CM } from '../src/sim/arms/marks.js';
import { pairsNow, stringEnd } from '../src/sim/scenarios/pairs.js';
import { recOf } from '../src/sim/scenarios/stress.js';

// (a test-stress game on string k's standby, its string turned by hand and three rounds scripted at its turner: a Pair to the
// chest (A, then C), a third high in the head's zone, a miss; the records as pairs.js pairsShot writes them)
function scripted({ tier = 'recruit', seed = 48213, k = 0 } = {}) {
  const g = createGame({ scenario: 'test-stress', seed, tier, setup: `standby:${k}` }), s = g.state, R = s.armoury.range, str = R.str, key = str.keys[0];
  const T = R.turners.find(t => t.key === key), now = s.clock.ms;
  T.turnAtMs = now; str.turnAtMs = now; str.turnedMs = now; R.hot = true;
  const shots = [
    { id: 'i900', dt: 1000, part: 'torso', zone: 'A', at: [3.2, -4.1], row: 'shot:pair' },
    { id: 'i901', dt: 1500, part: 'torso', zone: 'C', at: [-14.5, 9.8], row: 'shot:pair' },
    { id: 'i902', dt: 2300, part: 'head', zone: 'head', at: [1.5, -27.0], row: 'shot:head' },
    { id: 'i903', dt: 3000, part: 'torso', zone: null, at: null, row: null },
  ];
  for (const x of shots) {
    if (x.zone) T.hits.push({ shotId: x.id, part: x.part, zone: x.zone, ring: false, through: false, at: x.at, atMs: now + x.dt });
    str.shots.push({ id: x.id, atMs: now + x.dt, fired: true, key, part: x.part, zone: x.zone, ring: false, noshoot: false, ...(x.row ? { row: x.row, rowN: 2, rowI: 0 } : {}) });
  }
  return { g, s, R, str, key, T, shots };
}
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

export default [
  {
    name: 'belief while the string runs: every round marked once in order, its called point and whether it was seen (the three on the face filled, the miss hollow), no hole and no zone; truth from its end: the holes the records\' and their zones, the miss off the figure; the words and the line ("never dead")',
    fn() {
      const { g, s, key, shots, T } = scripted();
      const b = hitMarks(s, key);
      console.log(`      belief: ${b.words}; ${b.marks.map(m => `${m.n} ${m.seen ? 'seen' : 'unseen'} at [${m.called.join(', ')}]`).join('; ')}`);
      assert(b.phase === 'belief' && b.marks.length === 4 && b.marks.map(m => m.n).join() === '1,2,3,4' && b.marks.map(m => m.shotId).join() === shots.map(x => x.id).join(), JSON.stringify(b));
      assert(b.marks.every(m => m.hole === null && m.zone === null) && b.marks.map(m => m.seen).join() === 'true,true,true,false', JSON.stringify(b.marks));
      assert(b.words === 'PAIR, TO THE HEAD, FIRE · 3 SEEN' && b.line === null, b.words);
      T.stoppedAtMs = s.clock.ms + 1500;
      stringEnd(s, g.bus, 'stopped');
      const t = hitMarks(s, key);
      console.log(`      truth: ${t.words}; ${t.marks.map(m => `${m.n} ${m.zone ?? 'miss'} hole ${m.hole ? `[${m.hole.join(', ')}]` : 'none'} (called [${m.called.join(', ')}])`).join('; ')}; "${t.line}"`);
      assert(t.phase === 'truth' && t.marks.every((m, i) => JSON.stringify(m.hole) === JSON.stringify(shots[i].at) && m.zone === shots[i].zone), JSON.stringify(t.marks));
      assert(t.marks[3].hole === null && t.marks[3].zone === null, 'the miss is never on the figure in truth');
      assert(t.words === 'PAIR, TO THE HEAD, FIRE · A · C · HEAD · MISS' && t.line === 'Two in the chest, one in the head, one wide. He went down.' && !/dead/i.test(t.line), `${t.words} | ${t.line}`);
      // (asked in belief after the end: the same calls, nothing more)
      const b2 = hitMarks(s, key, { phase: 'belief' });
      assert(b2.marks.every((m, i) => m.hole === null && JSON.stringify(m.called) === JSON.stringify(t.marks[i].called)), 'belief asked after the end');
    },
  },
  {
    name: 'the called point moves from the aim toward the hole with Marksmanship (CALL_K = clamp(MRK / 40, 0.2, 1)): the boot recruit calls near his aim, the tier one his hole; printed for MRK 6, 15 and 42; the blur is a hash, never the dice',
    fn() {
      const hole = [-14.5, 9.8], aim = AIM_CM.torso, out = [];
      for (const mrk of [6, 15, 42]) {
        const k = callK(mrk), c = calledAt({ aim, hole, k, seed: 48213, shotId: 'i901' });
        out.push({ mrk, k, toAim: dist(c, aim), toHole: dist(c, hole) });
      }
      console.log(`      CALL_MRK ${CALL_MRK}, CALL_K_MIN ${CALL_K_MIN}, CALL_BLUR_CM ${CALL_BLUR_CM}, MISS_CALL_CM ${MISS_CALL_CM}; a hole ${fmt(dist(hole, aim), 1)} cm off the aim: ${out.map(o => `MRK ${o.mrk}: k ${fmt(o.k, 3)}, the call ${fmt(o.toHole, 1)} cm from the hole, ${fmt(o.toAim, 1)} from the aim`).join('; ')}`);
      assert(out[0].toHole > out[1].toHole && out[1].toHole > out[2].toHole && out[2].toHole < 0.1, JSON.stringify(out));
      // (the scene's sheets: the recruit's and the tier one's calls of the same scripted string)
      const r = hitMarks(scripted({ tier: 'recruit' }).s, scripted().key), o = hitMarks(scripted({ tier: 'tierone' }).s, scripted().key);
      const err = (h) => h.marks.slice(0, 3).map((m, i) => dist(m.called, [[3.2, -4.1], [-14.5, 9.8], [1.5, -27.0]][i]));
      console.log(`      the recruit's calls off the holes ${err(r).map(v => fmt(v, 1)).join(', ')} cm; the tier one's ${err(o).map(v => fmt(v, 1)).join(', ')} cm`);
      assert(err(o).every((v, i) => v <= err(r)[i]), 'the tier one calls his rounds closer');
    },
  },
  {
    name: 'the marks the same after a save and load, mid-string (belief) and after it (truth); the whole course\'s strings each give their truth from their records (holes as the turners\' hits had them)',
    fn() {
      const { g, s, key, T } = scripted();
      const before = JSON.stringify(hitMarks(s, key));
      const h = createGame({ scenario: 'test-stress', seed: 48213, tier: 'recruit', setup: 'standby:0' });
      h.load(g.save());
      assert(JSON.stringify(hitMarks(h.state, key)) === before, 'belief after a load');
      T.stoppedAtMs = s.clock.ms + 1500;
      stringEnd(s, g.bus, 'stopped');
      const truth = JSON.stringify(hitMarks(s, key));
      h.load(g.save());
      assert(JSON.stringify(hitMarks(h.state, key)) === truth, 'truth after a load');
      console.log(`      belief and truth the same after a load (${before.length} and ${truth.length} characters)`);
      // (the bot's whole course: each string's truth, every round fired at a turner marked, holes the hits')
      const c = createGame({ scenario: 'test-stress', seed: 7, tier: 'private' }), cs = c.state, bot = stressBot();
      for (let n = 0; n < 20 * 60 * 30 && !pairsNow(cs).end; n++) { c.step(1, bot); c.clearFacts(); }
      for (const rec of cs.armoury.range.stress.strs) {
        const keys = [...new Set(rec.holes.map(x => x.key))];
        for (const k2 of keys) {
          const m = hitMarks(cs, k2, { k: rec.k });
          console.log(`      string ${rec.k + 1}, ${k2}: ${m.words}; "${m.line}"`);
          assert(m.phase === 'truth' && m.marks.length === rec.holes.filter(x => x.key === k2).length && m.marks.every(x => (x.zone ? !!x.hole : x.hole === null)), JSON.stringify(m));
        }
        assert(recOf(cs.armoury.range, rec.k) === rec, 'recOf');
      }
    },
  },
];
