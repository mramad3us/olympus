// "Again as …" on test-stress (src/sim/scenarios/stress.js againAsStress, drawStress, planNoise; the build sheet 0.0.10 §5.2, §2.2): one seed as each of the five sheets draws the same lane, the same turners with the same faces, the same noise plans (the din's blanks and horn, the call and its bang, the bangs, at the same times from their arming) and the same second turner on string 5; only the sheet differs; scenes never write a career.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { stressBot } from './bots/stress.mjs';
import { pairsNow } from '../src/sim/scenarios/pairs.js';
import { againAsStress, drawStress, recOf, RELOAD_STRING } from '../src/sim/scenarios/stress.js';
import { TEST_SHEETS } from '../src/sim/skills/templates.js';
import { newGame } from '../src/sim/game.js';
import { SCENES } from '../src/data/scenes.js';

/** The sheets the picker offers (scenes.js). */
const SHEETS = SCENES['test-stress'].sheets;

// (a course played to its card: what turned at each standby, the noise planned for each string (attempt 0, its times from the
// arming), the second turner)
function drawsOf(seed, tier) {
  const g = createGame({ scenario: 'test-stress', seed, tier }), s = g.state, bot = stressBot(), turns = [], plans = {};
  for (let n = 0; n < 20 * 60 * 30 && !pairsNow(s).end; n++) {
    g.step(1, bot);
    for (const [type, d] of g.bus.events) {
      const R = s.armoury.range;
      if (type === 'range' && d.phase === 'turn') turns.push({ k: R.str.k, keys: [...R.str.keys], faces: R.str.keys.map(key => R.turners.find(t => t.key === key)?.holds ?? null), second: R.str.second ?? null });
    }
    // (each string's plan as made at its first arming, once)
    const R = s.armoury.range;
    for (const rec of R.stress.strs) if (rec.attempt === 0 && rec.plannedAtMs !== null && !plans[rec.k]) plans[rec.k] = R.stress.plan.filter(e => e.k === rec.k).map(e => `${e.kind}+${e.atMs - rec.plannedAtMs}${e.x !== undefined ? `@${e.x},${e.z}` : ''}`);
    g.clearFacts();
  }
  return { g, s, lane: s.armoury.range.lane, turns, plans, sheet: s.people[s.player.id].skills };
}

export default [
  {
    name: 'one seed as each sheet: the same lane, the same turners and what they hold, the same noise plans at the same times and places from their arming, the same second turner on string 5; againAsStress keeps the scene and the seed; the scene writes no career (no save slot: a scene saves nothing)',
    heavy: true,   // (a whole-course or many-roll run: out of the quick suite, which is held to 60 s; it runs in the full suite and every release)
    timeoutMs: 600_000,
    fn() {
      const seed = 48213, runs = SHEETS.map(tier => ({ tier, ...drawsOf(seed, tier) }));
      const ref = JSON.stringify({ lane: runs[0].lane, turns: runs[0].turns, plans: runs[0].plans });
      for (const r of runs) {
        console.log(`      seed ${seed} as ${TEST_SHEETS[r.tier].label}: lane ${r.lane}; turns ${r.turns.map(t => `${t.k + 1}: ${t.keys.map((k, i) => `${k.split(':')[1]} ${t.faces[i]}`).join(', ')}`).join(' · ')}; second ${r.turns.find(t => t.k === RELOAD_STRING)?.second ?? '-'}`);
        console.log(`        noise: ${Object.entries(r.plans).map(([k, p]) => `${Number(k) + 1}: ${p.length} events, ${p.slice(0, 3).join(' ')}${p.length > 3 ? ' …' : ''}`).join('; ')}`);
        assert(JSON.stringify({ lane: r.lane, turns: r.turns, plans: r.plans }) === ref, `as ${r.tier}: not the same draws`);
      }
      const d = drawStress(seed, runs[0].lane);
      assert(runs[0].turns.every(t => JSON.stringify(t.keys) === JSON.stringify(d[t.k].keys) && t.second === d[t.k].second), `the game's turners are drawStress's ${JSON.stringify(d)}`);
      const s = runs[0].s, a = againAsStress(s, 'tierone'), b = againAsStress(s, 'nobody'), fresh = newGame({ seed, scenario: 'test-stress' });
      console.log(`      again as the tier one: ${JSON.stringify(a)}; as an unknown sheet: ${JSON.stringify(b)}`);
      assert(a.scenario === 'test-stress' && a.seed === seed && a.tier === 'tierone' && a.setup === null && b.tier === 'recruit', JSON.stringify({ a, b }));
      const keys = ['career', 'careers', 'memorial'];
      assert(keys.every(k => JSON.stringify(s[k]) === JSON.stringify(fresh[k])), 'a career written');
      assert(recOf(s.armoury.range, RELOAD_STRING)?.turned2, 'string 5\'s second turner turned');
    },
  },
];
