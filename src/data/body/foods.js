// OLYMPUS data: what the body can eat and drink this round, and what each brings with it (BODY §3.5, §4.1, §5.2; the build sheet 0.0.4 §8 item 15).
//
// A food is its water per kilocalorie (eaten water, absorbed with drunk water from the gut, BODY §4.1)
// and the stool it makes per kilocalorie absorbed (BODY §5.2: mess food 0.06 g, field rations and bars
// 0.04, the classic field constipation). This round's player eats the mail room's machine bar (250
// kcal, 0.12 mL/kcal: BODY §3.5's snack bar with a ration's water) and drinks from the taps and the
// lounges' machines (0.5 L: a long drink, BODY §4.1); the mess hall's meals (900 to 1,100 kcal, 0.3
// mL/kcal, 0.5 L drunk with them) are the reference sol's (src/data/body/sol.js) until the mess is
// built at 0.0.9. intake(…, { food }) names one of these; 'snack' is the bar.
const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };

export const FOODS = deepFreeze({
  mess: { name: 'a mess meal', waterLPerKcal: 0.0003, stoolGPerKcal: 0.06 },
  snack: { name: 'a bar', kcal: 250, waterLPerKcal: 0.00012, stoolGPerKcal: 0.04 },
  bar: { name: 'a bar', kcal: 250, waterLPerKcal: 0.00012, stoolGPerKcal: 0.04 },
  ration: { name: 'a field ration', kcal: 1250, waterLPerKcal: 0.00012, stoolGPerKcal: 0.04 },
  water: { name: 'water', waterLPerKcal: 0, stoolGPerKcal: 0 },
});
/** A long drink, litres (BODY §4.1; TIME's DRINK_L). */
export const DRINK_L = 0.5;
