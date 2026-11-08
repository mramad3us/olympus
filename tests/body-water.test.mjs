// body-water: water and thirst (BODY §4, §25; the build sheet 0.0.4 §5.1). The training sol's ledger:
// drunk, food and metabolic water, insensible losses, stool, urine and its voids, the end balance
// (BODY §4.2: 2.0 L drunk with the meals, level, 4 to 6 voids), sol by sol over a week from the
// template; thirst's stage times without drinking (the meals eaten dry); a drink's absorption with τ
// 20 min; the night's kidneys at half rate.
import { assert, near, fmt } from './helpers.mjs';
import { templateBody, runSols, weekOf, MELAS_LON, stageTimes, lastReveille, STAGE_TEST, MELAS_PLACE } from './bots/sol.mjs';
import { START_MS } from '../src/data/setting/calendar.js';
import { marsTimeText } from '../src/core/calendar.js';
import { HOUR_MS, MIN_MS } from '../src/core/clock.js';
import { WATER, THIRST } from '../src/data/body/needs.js';
import { bodyAdvance, rowSeg } from '../src/sim/body/body.js';
import { massOf } from '../src/sim/body/energy.js';
import { drinkBody, waterRates, kidneyNight, thirstPct } from '../src/sim/body/water.js';

const T = (ms) => marsTimeText(ms, MELAS_LON);
const REV = lastReveille(START_MS, MELAS_LON);
const kcalOf = (b) => b.energy.gutKcal + b.energy.reserveKcal;

// (one sol's water ledger, L)
function ledgerOf(b, r) {
  const drunk = r.acts.reduce((s, a) => s + (a.act === 'eat' ? a.waterL : a.act === 'drink' ? a.waterL : 0), 0);
  const eaten = r.acts.filter(a => a.act === 'eat');
  const kcal = eaten.reduce((s, a) => s + a.kcal, 0), food = eaten.reduce((s, a) => s + a.foodWaterL, 0);
  return { drunk, food, kcal, voids: r.acts.filter(a => a.act === 'void'), stoolG: r.acts.filter(a => a.act === 'bowel').reduce((s, a) => s + a.g, 0) };
}

export default [
  STAGE_TEST,
  {
    name: 'the training sol\'s water ledger: 2.0 L drunk with the meals, level within 0.3 L sol by sol, in 4 to 6 voids (BODY §4.2)',
    fn() {
      const b = templateBody(REV), sols = weekOf(REV, MELAS_LON, 1);
      const rows = [];
      for (let d = 0; d < 7; d++) {
        const bal0 = b.water.balanceL, gut0 = b.water.gutL, bl0 = b.bladder.ml, k0 = kcalOf(b);
        const r = runSols({ body: b, sols: sols.slice(d, d + 2), untilMs: sols[d + 1]?.reveilleMs ?? Infinity });
        const L = ledgerOf(b, r), burned = k0 + L.kcal - kcalOf(b), metab = WATER.METABOLIC_L_PER_KCAL * burned;
        const urine = L.voids.reduce((s, v) => s + v.ml, 0) / 1000 + (b.bladder.ml - bl0) / 1000, stool = L.stoolG * WATER.STOOL_L_PER_G;
        const ins = L.drunk + L.food + metab - urine - stool - (b.water.balanceL - bal0) - (b.water.gutL - gut0);
        rows.push({ sol: sols[d].sol.id, drunk: L.drunk, food: L.food, metab, ins, stool, urine, voids: L.voids, bal0, bal1: b.water.balanceL });
      }
      for (const x of rows) console.log(`      ${x.sol.padEnd(7)} drunk ${fmt(x.drunk, 2)} L, in food ${fmt(x.food, 2)}, metabolic ${fmt(x.metab, 2)}; insensible ${fmt(x.ins, 2)}, stool ${fmt(x.stool, 2)}, urine ${fmt(x.urine, 2)} in ${x.voids.length} voids (${x.voids.map(v => `${T(v.atMs)} ${fmt(v.ml, 0)}`).join(', ')}); balance ${fmt(x.bal0, 2)} → ${fmt(x.bal1, 2)} L`);
      console.log(`      BODY §4.2's training sol: drunk 2.0, in food 0.9, metabolic 0.36; insensible 1.0, stool 0.1, urine 2.1 in 4 to 5 voids; level`);
      for (const x of rows) {
        assert(Math.abs(x.bal1 - x.bal0) <= 0.3, JSON.stringify(x));
        if (x.sol === 'range') { assert(Math.abs(x.drunk - 2.0) < 1e-9, `drunk ${x.drunk}`); assert(x.voids.length >= 4 && x.voids.length <= 6, `${x.voids.length} voids`); }
      }
    },
  },
  {
    name: 'thirst\'s stage times without water: eating the meals dry it creeps (food water nearly covers the losses), without food or water dehydrated comes inside a week',
    fn() {
      const sols = weekOf(REV, MELAS_LON, 1);
      const dry = (sol) => ({ ...sol, rows: sol.rows.map(r => (r.eat ? { ...r, eat: { ...r.eat, waterL: 0 } } : r)) });
      const a = templateBody(REV), ra = runSols({ body: a, sols: sols.map(s => ({ ...s, sol: dry(s.sol) })), drop: { drink: true } });
      const b = templateBody(REV), rb = runSols({ body: b, sols, drop: { drink: true, eat: true } });
      const line = (r) => (stageTimes(r.crossed).thirst ?? []).map(x => `${x.band} +${fmt((x.atMs - REV) / HOUR_MS, 1)} h`).join(', ') || 'never thirsty';
      console.log(`      from ${fmt(templateBody(REV).water.balanceL, 2)} L at Monday's reveille, the meals eaten dry: ${line(ra)}; after the week ${fmt(thirstPct(a.water.balanceL, massOf(a)), 1)}% of mass`);
      console.log(`      no food, no water: ${line(rb)}; after the week ${fmt(thirstPct(b.water.balanceL, massOf(b)), 1)}%`);
      console.log(`      thirst's lines (BODY §4.3): ${THIRST.slice(1).map(x => `${x.id} ${x.pct}%`).join(', ')} (${fmt(massOf(b) / 100, 2)} L a point at ${fmt(massOf(templateBody(REV)), 1)} kg)`);
      const st = stageTimes(rb.crossed).thirst ?? [];
      assert(['thirsty', 'dry', 'parched', 'dehydrated'].every(k => st.some(x => x.band === k)), JSON.stringify(st));
      assert(st.find(x => x.band === 'dehydrated').atMs - REV < 7 * 24.66 * HOUR_MS, 'dehydrated after a week');
    },
  },
  {
    name: 'a drink absorbs with τ 20 min (63% in the first 20), and the kidneys run at half their base by the body\'s night (BODY §4.1, §4.2)',
    fn() {
      const b = templateBody(REV);
      b.water.gutL = 0; drinkBody(b, 0.5);
      const seg = rowSeg({ met: 1.5, kind: 'still' }, MELAS_LON, massOf(b), false, MELAS_PLACE);
      bodyAdvance(b, seg, REV, REV + 20 * MIN_MS);
      const day = waterRates(-0.1, 100, 1.5, 0, kidneyNight(14)), night = waterRates(-0.1, 100, 1.5, 0, kidneyNight(2)), low = waterRates(-0.6, 100, 1.5, 0, false), wet = waterRates(0.6, 100, 1.5, 0, false);
      console.log(`      0.5 L drunk: ${fmt(b.water.gutL, 3)} L still in the gut after 20 min (e^−1 of it: ${fmt(0.5 * Math.exp(-1), 3)}); urine at a −0.1 L balance ${fmt(day.urineL * 1000, 1)} mL/h by day, ${fmt(night.urineL * 1000, 1)} by night, ${fmt(low.urineL * 1000, 1)} at −0.6 L, ${fmt(wet.urineL * 1000, 0)} at +0.6 L; insensible at rest ${fmt(day.insL * 1000, 1)} mL/h indoors`);
      near(b.water.gutL, 0.5 * Math.exp(-1), 1e-9, 'the gut\'s water at 20 min:');
      near(night.urineL, day.urineL / 2, 1e-12, 'night urine:');
      near(low.urineL, 0.018, 1e-12, 'concentrated urine:');
    },
  },
];
