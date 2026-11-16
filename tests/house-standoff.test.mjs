// OLYMPUS tests: a charge's safe points never in another door's doorway (the review of v0.0.21's A and B, its first finding; F28 on drawn houses).
//
// breach.js safePointsOf puts #1 on the latch side's wall at the charge's stand-off (SC-1 2.20 m, BC-1 3.18 m at the Wheel's air)
// and the #2 STACK_BEHIND_M 0.65 m further along. On the house as set no lane door's points fall in another door's doorway; on a
// drawn house the door upstream may stand 3 to 5 m along the same wall, open once cleared, and a point in its no-stop funnel (zones.js,
// FUNNEL_M 0.5 deep, FUNNEL_SIDE_M 0.3 past each jamb) is one the no-stop rule (move.js) carries you out of, back to the stack, while
// the drill's restack waits: the corporal on drawn seed 17 (En245pk.Ks200po.Cs165lc, the cut loadout) took room 3's BC-1 at 182.2 kPa
// 1.3 m off it. Over drawn seeds 1 to 100, 25 points (SC-1 6, BC-1 19) on 19 seeds sat in such a funnel. The fix: such a point goes on
// along the wall past that funnel by SAFE_PAST_M 0.15 m, farther from the charge, so never less safe.
import { assert, fmt } from './helpers.mjs';
import { createGame, withHouse } from './game.mjs';
import { safePointsOf, SAFE_PAST_M } from '../src/sim/combat/breach.js';
import { lanePlanOf } from '../src/sim/combat/room.js';
import { assembleHouse, drawnCodeOf } from '../src/sim/scenes/assemble.js';
import { zonesOf, inZone } from '../src/sim/places/zones.js';
import { BREACH_SAFE_KPA } from '../src/sim/arms/blast.js';
import { kitLanes, kitGaugeOf } from './flawless-kit.mjs';

/** The seeds the geometry case reads (the review's 1 to 100, and as many again). */
const SEEDS = 200;

// (the cut lanes on drawn seed 17 by the honest kit bot, F28 read on them (flawless-kit.mjs kitGaugeOf))
function cutLane(sheets) {
  const recs = withHouse({ draw: 'drawn' }, () => kitLanes({ sheets, seeds: [17], uses: ['cut'], print: false }));
  const F28 = kitGaugeOf(recs).find(r => r.id === 'F28');
  console.log(`      ${recs.map(r => `${r.tier} ${r.end} ${fmt(r.laneS, 1)} s, blasts ${r.blast.map(b => `${b.door.split(':').at(-1)} you ${fmt(b.me, 1)} #2 ${fmt(b.two, 1)} staff ${fmt(b.rest, 1)}`).join('; ')}`).join(' | ')}`);
  console.log(`      F28 ${F28.met ? 'MET' : 'MISSED'}: ${F28.value}`);
  assert(recs.every(r => r.done && !r.err) && F28.met, JSON.stringify({ ends: recs.map(r => [r.tier, r.end, r.err ?? null]), F28: F28.value }));
}

export default [
  {
    name: 'on 200 drawn houses and the set, no lane door\'s SC-1 or BC-1 safe point (either edge) lies in another door\'s no-stop funnel (the review: 25 on seeds 1 to 100)',
    fn() {
      let doors = 0, points = 0, moved = 0, worst = 0;
      const bad = [];
      // (one game on the set for its state (the Wheel's air, the env); each drawn house assembled from its seed's code and read on it,
      // its area as the live one: safePointsOf reads the plan's door, the area's rooms and the air there, nothing of the lane's)
      const s0 = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'cpl', loadout: 'full' }).state;
      for (let seed = 0; seed <= SEEDS; seed++) {
        const L = seed ? assembleHouse(drawnCodeOf(seed)).plans : lanePlanOf(s0), s = { ...s0, places: { ...s0.places, live: { ...s0.places.live, area: L.area } } };
        const funnels = zonesOf(L.area).filter(Z => Z.kind === 'funnel');
        for (const k of L.order.filter(k => k !== 'hall')) {
          doors++;
          const P = L.plans[k];
          for (const model of ['sc1', 'bc1']) for (const edge of ['latch', 'hinge']) {
            const sp = safePointsOf(s, P, model, { edge });
            if (!sp) continue;
            points += 2;
            const base = Math.hypot(sp.one[0] - sp.charge[0], sp.one[1] - sp.charge[1]);
            if (base > sp.standoffM + 0.1) moved++;
            worst = Math.max(worst, sp.kPa.one, sp.kPa.two);
            for (const p of [sp.one, sp.two]) {
              const Z = funnels.find(Z => Z.door !== P.door && inZone(Z, p[0], p[1]));
              if (Z) bad.push(`${seed} ${seed ? drawnCodeOf(seed).split('|')[0] : 'A'} ${k} ${model} ${edge} ${JSON.stringify(p)} in ${Z.door}`);
            }
          }
        }
      }
      console.log(`      ${doors} lane doors (the set and ${SEEDS} drawn houses), ${points} safe points: in another door's funnel ${bad.length}; moved past one by SAFE_PAST_M ${SAFE_PAST_M} m ${moved} charges' points; the most at a safe point ${fmt(worst, 1)} kPa (limit ${BREACH_SAFE_KPA})`);
      if (bad.length) console.log(`      ${bad.slice(0, 4).join('\n      ')}`);
      assert(!bad.length && worst <= BREACH_SAFE_KPA, JSON.stringify({ bad: bad.slice(0, 6), worst }));
    },
  },
  {
    name: 'the cut on drawn seed 17 (room 3\'s BC-1 3.2 m from room 2\'s open door) by the honest kit bot, the corporal: to the card, F28 met (the review: you at 182.2 kPa)',
    timeoutMs: 120_000,
    fn() { cutLane(['cpl']); },
  },
  {
    name: 'the same by the sergeant and the Raider: every lane to its card, F28 met (the review: the three sheets on seed 17 at 182.2 kPa)',
    heavy: true,
    timeoutMs: 300_000,
    fn() { cutLane(['sgt', 'raider']); },
  },
];
