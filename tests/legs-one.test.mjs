// OLYMPUS tests: legs-one, F103 (the build sheet v0.0.24 §2 step 2, §8's F100 shifted by three: the anywhere note's V3), one legs helper.
//
// BODY §16.2's legs (the push and the brake against the grip μ g, with the kit on the body) were computed by three readers before
// v0.0.24's stage 0: places/move.js legsHere (the keys' free walk), combat/bundle.js legsOf (the bundles' moves, the #2, the
// role-players) and arms/loadout.js loadoutView (the kit screen), each with its own fallback μ of 0.6 and bundle.js's with a
// 25 kg load when the kit could not be weighed. They are one now: body/motion.js legsAt(state, pid, x, z), the felt gravity and
// the floor's μ from env.js gravityAt and surfaceAt (both required: a missing surface throws there), the load from kitMassKg,
// the Fitness the sheet's; the three keep their names and delegate. This file holds that:
//   - the scan: no module of src calls motion.js tractionOf but motion.js itself (comments and strings blanked; the name
//     `legsOf` is two things, combat/two.js's being the house's rooms and hall, so the scan is of tractionOf's calls only);
//   - the three readers give legsAt's numbers, to the bit, at Melas (the bay at 0.38 G), in the Wheel (house 1 at 1 G) and in
//     free fall (the house under &env=ship-coast, 0 G: no push, no brake, which A's footing gives a reason for), printed.
// A's half of F103 (v0.0.24's step 5, AW§4.1 item 1): on mag boots locked on a ferrous face legsAt's grip is μ (m g + 300 N) / m
// (footing.js bootsHoldN: one boot always locked as you walk), so at 0 G the legs push on the magnets alone, and every stance
// walks MAG_BOOTS.WALK_MS 0.5 m/s; the three readers agree on it. The sheet's 1.746 m/s² was the formula at 103.1 kg booted, the
// house's kit of v0.0.20 (25.7 kg); the kit has grown since (the #2's P-12 and its magazines, v0.0.20), so the house's marine on
// his boots weighs 104.27 kg and grips 1.726 m/s²: both printed, the formula held to the bit at the kit as it stands.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { assert, fmt, root } from './helpers.mjs';
import { createGame } from './game.mjs';
import { codeOnly } from './syntax.test.mjs';
import { legsAt } from '../src/sim/body/motion.js';
import { legsHere } from '../src/sim/places/move.js';
import { legsOf } from '../src/sim/combat/bundle.js';
import { loadoutView } from '../src/sim/arms/loadout.js';
import { playerActor } from '../src/core/ids.js';
import { kitMassKg } from '../src/sim/arms/kit.js';
import { MAG_BOOTS } from '../src/data/body/needs.js';
import { coastHouse, steelDeck, bootUp } from './void-world.mjs';

/** The legs helper's one home. */
export const LEGS_HOME = 'src/sim/body/motion.js';
const CALL = /(?<![\w$.])tractionOf\s*\(/g;

const walk = (dir) => readdirSync(dir).flatMap(n => { const f = path.join(dir, n); return statSync(f).isDirectory() ? walk(f) : f.endsWith('.js') ? [f] : []; });

/** The places legsAt is read at: the bay, house 1 at 1 G, house 1 in free fall. */
const PLACES = Object.freeze([
  ['Melas, the bay (0.38 G)', { scenario: 'test-handling' }],
  ['the Wheel, house 1 (1 G)', { scenario: 'test-shoothouse', tier: 'private', setup: 'go' }],
  ['free fall, house 1 under &env=ship-coast (0 G)', { scenario: 'test-shoothouse', tier: 'private', setup: 'go', env: 'ship-coast' }],
]);

export default [
  {
    name: 'legs-one (F103): no module of src calls tractionOf but body/motion.js, the legs helper\'s home (one quantity, one helper)',
    fn() {
      const files = walk(path.join(root, 'src')), hits = [];
      let home = 0;
      for (const f of files) {
        const r = path.relative(root, f).split(path.sep).join('/'), code = codeOnly(readFileSync(f, 'utf8'));
        const n = [...code.matchAll(CALL)].length;
        if (r === LEGS_HOME) home = n;
        else if (n) hits.push(`${r}: ${n}`);
      }
      // (the probe: the pattern finds a call, not a name in a word or a property)
      const probe = [['tractionOf({ gMs2 }); x.tractionOf(1); mytractionOf(2); tractionOf (3)', 2]].map(([t, want]) => ({ want, got: [...t.matchAll(CALL)].length }));
      console.log(`      ${files.length} modules; tractionOf called ${home} time(s) in ${LEGS_HOME}, elsewhere: ${hits.join(', ') || 'none'}; the probe ${probe.map(p => `${p.got}/${p.want}`).join(', ')}`);
      assert(probe.every(p => p.got === p.want), JSON.stringify(probe));
      assert(home >= 1 && !hits.length, hits.join('\n'));
    },
  },
  {
    name: 'legs-one (F103): legsHere, bundle.js legsOf and the kit screen\'s push and brake are legsAt\'s, to the bit, at Melas, in the Wheel and in free fall; legsAt\'s numbers printed',
    fn() {
      const bad = [];
      for (const [what, o] of PLACES) {
        const g = createGame({ seed: 48213, ...o }), s = g.state, me = playerActor(s), pid = me.who;
        const L = legsAt(s, pid, me.x, me.z), H = legsHere(s, pid, me.x, me.z), B = legsOf(s, pid), V = loadoutView(s, pid).push;
        const same = (a, b) => a.pushMs2 === b.pushMs2 && a.brakeMs2 === b.brakeMs2;
        const r2 = (v) => Math.round(v * 100) / 100;
        if (!same(L, H) || L.gripMs2 !== H.gripMs2) bad.push(`${what}: legsHere ${JSON.stringify(H)}`);
        if (!same(L, B) || L.gG !== B.gG || JSON.stringify(L.walk) !== JSON.stringify(B.walk)) bad.push(`${what}: legsOf ${JSON.stringify(B)}`);
        if (V.pushMs2 !== r2(L.pushMs2) || V.brakeMs2 !== r2(L.brakeMs2)) bad.push(`${what}: loadoutView ${JSON.stringify(V)}`);
        console.log(`      ${what} (${s.places.live.area}): ${fmt(L.gG, 2)} G, μ ${fmt(L.mu, 2)}; push ${fmt(L.pushMs2, 3)}, brake ${fmt(L.brakeMs2, 3)}, grip ${fmt(L.gripMs2, 3)} m/s²; walks relaxed ${fmt(L.walk.relaxed, 2)}, combat ${fmt(L.walk.combat, 2)}, assault ${fmt(L.walk.assault, 2)} m/s; the kit screen ${fmt(V.pushMs2, 2)} and ${fmt(V.brakeMs2, 2)}`);
      }
      assert(!bad.length, bad.join('\n'));
    },
  },
  {
    name: 'legs-one (F103, A\'s half): on mag boots locked on steel at 0 G legsAt\'s grip is μ (m g + 300 N) / m, the push the magnets give, every stance walks 0.5 m/s, and legsHere, legsOf and the kit screen agree; unlocked, nothing',
    fn() {
      const { s, pid } = coastHouse({}), me = playerActor(s);
      steelDeck(s);
      bootUp(s, pid, { lock: false });
      const loose = legsAt(s, pid, me.x, me.z);
      bootUp(s, pid, { lock: true });
      const L = legsAt(s, pid, me.x, me.z), H = legsHere(s, pid, me.x, me.z), B = legsOf(s, pid), V = loadoutView(s, pid).push;
      const kg = 75 + kitMassKg(s, pid), want = L.mu * MAG_BOOTS.HOLD_N / kg, at103 = 0.6 * MAG_BOOTS.HOLD_N / 103.1;
      console.log(`      unlocked: grip ${fmt(loose.gripMs2, 3)}, push ${fmt(loose.pushMs2, 3)} m/s²; locked on ${s.places.live.env.surface} (μ ${L.mu}) at ${fmt(kg, 2)} kg booted: grip ${fmt(L.gripMs2, 3)} (the formula ${fmt(want, 3)}), push ${fmt(L.pushMs2, 3)}, brake ${fmt(L.brakeMs2, 3)} m/s²; walks ${JSON.stringify(L.walk)}; at the sheet\'s 103.1 kg the formula gives ${fmt(at103, 3)} m/s²`);
      assert(loose.gripMs2 === 0 && loose.pushMs2 === 0, JSON.stringify(loose));
      assert(Math.abs(L.gripMs2 - want) < 1e-12 && L.pushMs2 === Math.min(L.gripMs2, L.pushMs2) && L.pushMs2 > 0 && L.brakeMs2 > 0, JSON.stringify({ L, want }));
      assert(Object.values(L.walk).every(v => v === MAG_BOOTS.WALK_MS), JSON.stringify(L.walk));
      assert(H.gripMs2 === L.gripMs2 && H.pushMs2 === L.pushMs2 && B.pushMs2 === L.pushMs2 && JSON.stringify(B.walk) === JSON.stringify(L.walk) && V.pushMs2 === Math.round(L.pushMs2 * 100) / 100, JSON.stringify({ H, B, V }));
      assert(Math.round(at103 * 1000) / 1000 === 1.746, `${at103}`);
    },
  },
];
