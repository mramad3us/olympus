// body-energy: energy and hunger (BODY §3, §25; the build sheet 0.0.4 §5.1). The basal rate of the
// reference man and woman; the reference sol's burn at Mars's 0.38 G, at 1 G and on Europa (BODY
// §3.2: 2,770, 3,280 and 2,570 kcal, ±3%), with the ruck's felt MET; the hunger stages' clock times
// through a training sol with and without its meals, beside tradecraft's hours-since-a-meal ladder
// (never past peckish with them: BODY §3.4, "a standard sol has no penalty-minutes from hunger");
// hours from a 900 kcal meal to hungry at rest, walking and at PT; the sols of fasting to weak, faint
// spells and starving; and a night's sleep moving the gut and the reserve (the user, 2026-10-28:
// "when sleeping, the hunger meter is frozen that's a bug").
import { assert, near, fmt } from './helpers.mjs';
import { templateBody, runSols, weekOf, MELAS_LON, stageTimes, lastReveille, STAGE_TEST, MELAS_PLACE } from './bots/sol.mjs';
import { START_MS } from '../src/data/setting/calendar.js';
import { marsTimeText } from '../src/core/calendar.js';
import { HOUR_MS } from '../src/core/clock.js';
import { bmrKcalH, metGOf, TRADECRAFT_HUNGER_H, massOf, bmrKcalH as bmr } from '../src/sim/body/energy.js';
import { HUNGER } from '../src/data/body/needs.js';
import { bodyAdvance, rowSeg } from '../src/sim/body/body.js';
import { copy } from '../src/sim/body/record.js';

const T = (ms) => marsTimeText(ms, MELAS_LON);
const REV = lastReveille(START_MS, MELAS_LON);                      // (Monday Sol 590, 05:30)
const sol0 = () => weekOf(REV, MELAS_LON, 1).slice(0, 2);
const kcalOf = (b) => b.energy.gutKcal + b.energy.reserveKcal;

export default [
  STAGE_TEST,
  {
    name: 'the basal rate of the reference man and woman is BODY §3.1\'s: 1,763 and 1,392 kcal a day',
    fn() {
      const man = bmrKcalH({ massKg: 75, heightM: 1.78, ageY: 21, sex: 'm' }) * 24, woman = bmrKcalH({ massKg: 62, heightM: 1.66, ageY: 21, sex: 'f' }) * 24;
      const tmpl = templateBody(REV);
      console.log(`      man 75 kg, 178 cm, 21: ${fmt(man, 0)} kcal/24 h (${fmt(man / 24, 1)} kcal/h); woman 62 kg, 166 cm, 21: ${fmt(woman, 0)} kcal/24 h; the m-adult template (1.78 m, medium, ${fmt(massOf(tmpl), 1)} kg): ${fmt(bmr({ massKg: massOf(tmpl), heightM: 1.78, ageY: 21, sex: 'm' }) * 24, 0)}`);
      near(man, 1763, 1, 'man:');
      near(woman, 1392, 1, 'woman:');
    },
  },
  {
    name: 'the reference sol burns 2,770 kcal at 0.38 G, 3,280 at 1 G and 2,570 at 0.134 G, each within 3% (BODY §3.2); the ruck\'s felt MET 4.8 at 1 G and 3.4 on Mars',
    fn() {
      const want = { 0.38: 2770, 1: 3280, 0.134: 2570 }, got = {};
      for (const gG of [0.38, 1, 0.134]) {
        const b = templateBody(REV), e0 = kcalOf(b), sols = sol0();
        const r = runSols({ body: b, sols, gG, untilMs: sols[1].reveilleMs });
        const eaten = r.acts.filter(a => a.act === 'eat').reduce((s, a) => s + a.kcal, 0);
        got[gG] = e0 + eaten - kcalOf(b);
      }
      const ruck1 = metGOf(3.7, 'walk', 1, 30, 75), ruckM = metGOf(3.7, 'walk', 0.38, 30, 75);
      console.log(`      the range sol (05:30 to 05:30, 24.66 h): ${Object.entries(got).map(([g, k]) => `${g} G ${fmt(k, 0)} kcal (BODY ${want[g]}, ${fmt((k / want[g] - 1) * 100, 1)}%)`).join('; ')}`);
      console.log(`      a ruck march at 4.8 km/h under 30 kg: ${fmt(ruck1, 2)} MET at 1 G, ${fmt(ruckM, 2)} on Mars (BODY 4.8, 3.4)`);
      for (const g of Object.keys(want)) assert(Math.abs(got[g] / want[g] - 1) <= 0.03, JSON.stringify({ g, got: got[g], want: want[g] }));
      near(ruck1, 4.8, 0.1, 'ruck 1 G:'); near(ruckM, 3.4, 0.1, 'ruck Mars:');
    },
  },
  {
    name: 'hunger\'s stages through a training sol: never past peckish with its meals; without them hungry, then very hungry, by the clock (tradecraft\'s ladder beside)',
    fn() {
      const fed = runSols({ body: templateBody(REV), sols: sol0(), untilMs: sol0()[1].reveilleMs });
      const fast = runSols({ body: templateBody(REV), sols: sol0(), untilMs: sol0()[1].reveilleMs, drop: { eat: true } });
      const line = (r) => (stageTimes(r.crossed).hunger ?? []).map(x => `${x.band} ${T(x.atMs)}`).join(', ') || 'fed all sol';
      console.log(`      with its meals (900, 900, 1,000 kcal at 07:05, 11:45, 17:25): ${line(fed)}`);
      console.log(`      without them: ${line(fast)}; the reserve at the next reveille ${fmt(fast.body.energy.reserveKcal, 0)} kcal`);
      console.log(`      tradecraft's ladder (hours since a meal): hungry ${TRADECRAFT_HUNGER_H.HUNGRY_H} h, starving ${TRADECRAFT_HUNGER_H.STARVING_H}, weak ${TRADECRAFT_HUNGER_H.WEAK_H}, faint ${TRADECRAFT_HUNGER_H.FAINT_H}, dead ${TRADECRAFT_HUNGER_H.DIE_H}; BODY's: hungry 4 h after the gut empties (or −1,500 kcal), very hungry 10 h (or −3,000), weak −13,000, faint −20,000, starving −40,000`);
      const worst = Math.max(0, ...fed.crossed.filter(c => c.ledger === 'hunger').map(c => c.toI));
      assert(worst <= 1, `the fed sol went past peckish: ${HUNGER[worst].id}`);
      const st = stageTimes(fast.crossed).hunger ?? [];
      assert(st.some(x => x.band === 'hungry') && st.some(x => x.band === 'very-hungry'), JSON.stringify(st));
    },
  },
  {
    name: 'from a 900 kcal meal to hungry: hours at rest, walking about and at PT on Mars; and the sols of fasting to weak, faint spells and starving',
    fn() {
      const rows = [];
      for (const [what, met, kind] of [['at rest', 1.5, 'still'], ['walking about', 3.0, 'walk'], ['at PT', 8.0, 'run']]) {
        const b = templateBody(REV);
        b.energy.gutKcal = 900; b.energy.reserveKcal = 0; b.energy.emptyH = 0;
        const seg = rowSeg({ met, kind, out: false }, MELAS_LON, massOf(b), false, MELAS_PLACE);
        let t = REV, empty = null, hungry = null;
        for (let k = 0; k < 24 && hungry === null; k++) {
          const r = bodyAdvance(b, seg, t, t + HOUR_MS);
          for (const c of r.crossed) if (c.ledger === 'hunger' && c.to === 'peckish' && empty === null) empty = c.atMs; else if (c.ledger === 'hunger' && c.to === 'hungry' && hungry === null) hungry = c.atMs;
          t += HOUR_MS;
        }
        rows.push(`${what}: empty after ${fmt((empty - REV) / HOUR_MS, 2)} h, hungry after ${fmt((hungry - REV) / HOUR_MS, 2)} h`);
        if (what === 'at rest') near((empty - REV) / HOUR_MS, 900 / (120 + 0.8 * bmrKcalH({ massKg: massOf(b), heightM: 1.78, ageY: 21, sex: 'm' }) * 1.5), 0.01, 'the gut empties at its closed form:');
      }
      console.log(`      a 900 kcal breakfast (BODY §3.3: lasts 4.6 h at rest, 3.3 walking on Mars, 2.4 through PT): ${rows.join('; ')}`);
      // (a fast at a resting sol's burn, closed form, the reserve's lines)
      const b = templateBody(REV), daily = bmrKcalH({ massKg: massOf(b), heightM: 1.78, ageY: 21, sex: 'm' }) * 1.45 * 24.66;
      console.log(`      a fast at about ${fmt(daily, 0)} kcal a sol (a resting sol): weak at ${fmt(13000 / daily, 1)} sols, faint spells at ${fmt(20000 / daily, 1)}, starving at ${fmt(40000 / daily, 1)}, BODY's death line (−100,000) at ${fmt(100000 / daily, 1)} (no death this round)`);
    },
  },
  {
    name: 'a night\'s sleep moves the gut and the reserve: the body burns and absorbs asleep, and the empty gut counts the night at a quarter (the user, 2026-10-28)',
    fn() {
      const sols = sol0(), b = templateBody(REV);
      const tapsMs = runSols({ body: b, sols, untilMs: sols[0].reveilleMs + Math.round(16.5 * HOUR_MS) }).toMs;
      const at22 = copy(b);
      runSols({ body: b, sols, fromMs: tapsMs, untilMs: sols[1].reveilleMs });
      console.log(`      at ${T(tapsMs)}: gut ${fmt(at22.energy.gutKcal, 0)} kcal, reserve ${fmt(at22.energy.reserveKcal, 0)}, emptyH ${fmt(at22.energy.emptyH, 2)}; at reveille ${T(sols[1].reveilleMs)}: gut ${fmt(b.energy.gutKcal, 0)}, reserve ${fmt(b.energy.reserveKcal, 0)}, emptyH ${fmt(b.energy.emptyH, 2)} (the gut emptied at ${T(b.energy.emptySinceMs)}, ${fmt((sols[1].reveilleMs - b.energy.emptySinceMs) / HOUR_MS, 2)} h before)`);
      assert(b.energy.gutKcal < at22.energy.gutKcal && b.energy.reserveKcal !== at22.energy.reserveKcal, 'the night moved nothing');
      const nightH = (sols[1].reveilleMs - b.energy.emptySinceMs) / HOUR_MS;
      assert(b.energy.emptyH > 0 && b.energy.emptyH < nightH * 0.6, JSON.stringify({ emptyH: b.energy.emptyH, nightH }));
    },
  },
];
