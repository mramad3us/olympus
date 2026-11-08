// OLYMPUS data: the reference sols, a marine's day on the Plan of the Day as the body lives it (BODY §3.2's range sol on TIME §9.2's times; the build sheet 0.0.4 §8 item 10).
//
// REFERENCE_SOL is BODY §3.2's range sol: PT in a 15 kg vest, the range all morning, classes all
// afternoon, rifle cleaning, three meals at the mess, an hour and twenty minutes of walking about, the
// evening seated; HOLIDAY_SOL is TIME §9.2's Saturday and Sunday (reveille 07:00, brunch and dinner,
// the day free). Each is a list of rows from reveille: { at: 'HH:MM', what, met, kind, … } runs from its
// time to the next row's (the last, the rack, to the next sol's reveille, whatever that sol is), at its
// MET at 1 G and its kind (BODY §3.1's gravity scaling), with loadKg carried, out (outdoors), the
// outfit; and what is done at its start: eat { kcal, waterL, food }, drink (litres), head (a void from
// HEAD_VOID_FROM_ML 300 mL, between could-go and need; 'always' at reveille and before the rack,
// whatever the bladder holds), stall (the bowel when it could go, and a void), wash (water minutes), groom
// { teeth, shave, face, hands }, bed (lying down to sleep: the next reveille ends it). Times run forward
// through the slip: a row after 24:00 is on the next sol. 0.0.6: a head that voids soils the hands
// (HANDS.HEAD), a stall that moves the bowel (HANDS.STALL), a meal (HANDS.FOOD); the reference marine
// washes them after every head and stall that has basins (groom.hands: the range's portable heads have
// none), at the basins at reveille and at 21:45 and before noon chow, and the shower's water takes them
// too, so a career starts with the hands of the day's last wash (body-hands prints them).
//
// Each sol names the site it is lived at (`site`: Base Melas's, so its rows breathe the valley's air out
// of doors and the Martian indoor standard in, under Mars's gravity, read through src/sim/places/env.js
// bodyPlaceOf: TECH §1.4, nothing in the body holds a place's number). The body uses it twice: startBody (src/sim/body/body.js) advances the template, a marine at
// reveille after a standard night, along REFERENCE_SOL to the hour a game starts (the sheet §8, item
// 10), and the body tests live it tick by tick and skip it a segment at a time (tests/bots/sol.mjs).
// The numbers it must give are BODY's: 2,770 kcal at 0.38 G, 3,280 at 1 G, 2,570 at 0.134 G (±3%);
// 2.0 L drunk with the meals, level within 0.3 L, in 4 to 6 voids; hunger never past peckish; the
// sleep balance of §7.1. A head comes every two hours or so (the range's portable heads, the breaks
// between classes), as a garrison's day lets the bladder go before it bites (BODY §5.3). The walking
// legs total 79 minutes, the loads (the vest, the range's rifle and
// rig) and the seated METs are tuned within BODY §3.2's ranges to those totals (my calls; body-energy
// prints them).
const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };

const walk = (at, what = 'walking about', more = {}) => ({ at, what, met: 3.0, kind: 'walk', out: true, ...more });
// (0.0.6: a marine washes after the head or a stall where it has basins: the barracks', the mess's; the range's portable heads have none)
const HANDS_WASHED = Object.freeze({ hands: true });
const still = (at, what, met, more = {}) => ({ at, what, met, kind: 'still', ...more });

/** BODY §3.2's range sol on TIME §9.2's training sol (see the header). */
export const REFERENCE_SOL = deepFreeze({
  id: 'range', site: 'melas', reveille: '05:30', taps: '22:00',
  rows: [
    still('05:30', 'the head and the basin', 1.8, { head: 'always', groom: { teeth: true, shave: true, face: true, hands: true } }),
    { at: '05:45', what: 'PT: a run and calisthenics in a 15 kg vest', met: 8.0, kind: 'run', loadKg: 15, out: true, outfit: 'sweats' },
    walk('06:45', 'back from the track', { outfit: 'sweats' }),
    still('06:50', 'into the shower', 1.8, { head: true, outfit: 'towel' }),
    still('06:51', 'the water', 2.0, { outfit: 'towel', wet: true }),
    still('06:54', 'dried and dressed', 2.0, { wash: 3, outfit: 'towel' }),
    walk('07:00', 'to the mess'),
    still('07:05', 'breakfast', 1.5, { eat: { kcal: 900, waterL: 0.5, food: 'mess' } }),
    still('07:30', 'a stall', 1.5, { stall: true, groom: HANDS_WASHED }),
    walk('07:36', 'to formation'),
    still('07:45', 'formation', 1.8, { out: true }),
    { at: '08:00', what: 'the range: walking, prone, kneeling, with the rifle and the rig', met: 2.2, kind: 'walk', loadKg: 10, out: true },
    { at: '09:30', what: 'the range, a canteen', met: 2.2, kind: 'walk', loadKg: 10, out: true, drink: 0.5 },
    { at: '10:45', what: 'the range, the portable heads', met: 2.2, kind: 'walk', loadKg: 10, out: true, head: true },
    walk('11:30', 'back from the range'),
    still('11:40', 'washing up', 1.8, { groom: { hands: true } }),
    still('11:45', 'noon chow', 1.5, { eat: { kcal: 900, waterL: 0.5, food: 'mess' } }),
    walk('12:15', 'to formation'),
    still('12:25', 'formation', 1.8, { out: true }),
    still('12:45', 'classes', 1.3),
    walk('13:00', 'a break, the head', { out: false, head: true, groom: HANDS_WASHED }),
    still('13:05', 'classes', 1.3),
    walk('15:20', 'a break, the head', { out: false, head: true, groom: HANDS_WASHED }),
    still('15:25', 'classes', 1.3),
    still('16:30', 'the head', 1.8, { head: true, groom: HANDS_WASHED }),
    still('16:35', 'maintenance: rifle cleaning', 1.8),
    walk('17:15', 'to the mess'),
    still('17:25', 'evening chow', 1.5, { eat: { kcal: 1000, waterL: 0.5, food: 'mess' } }),
    walk('17:55', 'back to the barracks'),
    still('18:05', 'the head, the evening', 1.4, { head: true, groom: HANDS_WASHED }),
    still('18:30', 'mail call', 1.8),
    still('18:40', 'the evening', 1.4),
    still('19:15', 'the head, the evening', 1.4, { head: true, groom: HANDS_WASHED }),
    walk('20:00', 'walking about, the head', { out: false, head: true, groom: HANDS_WASHED }),
    still('20:10', 'the evening', 1.4),
    still('21:00', 'the head, the evening', 1.4, { head: true, groom: HANDS_WASHED }),
    still('21:45', 'the head, the basin, PT kit', 2.0, { head: 'always', groom: { teeth: true, hands: true } }),
    still('22:00', 'the rack', 1.0, { posture: 'lie', bed: 'own-rack', outfit: 'pt' }),
  ],
});

/** TIME §9.2's holiday routine, Saturday and Sunday (see the header). */
export const HOLIDAY_SOL = deepFreeze({
  id: 'holiday', site: 'melas', reveille: '07:00', taps: '22:00',
  rows: [
    still('07:00', 'the head and the basin', 1.8, { head: 'always', groom: { teeth: true, shave: true, face: true, hands: true } }),
    still('07:15', 'the bay, a slow morning', 1.4),
    walk('07:50', 'to the mess'),
    still('08:00', 'brunch', 1.5, { eat: { kcal: 1200, waterL: 0.5, food: 'mess' } }),
    still('09:00', 'a stall', 1.5, { stall: true, groom: HANDS_WASHED }),
    walk('09:06', 'back to the barracks'),
    still('09:16', 'the bay', 1.4),
    walk('12:00', 'walking about, the head', { head: true, groom: HANDS_WASHED }),
    still('12:30', 'the bay', 1.4),
    still('14:00', 'the bay, a drink', 1.4, { drink: 0.5, head: true, groom: HANDS_WASHED }),
    still('15:30', 'into the shower', 1.8, { head: true, outfit: 'towel' }),
    still('15:31', 'the water', 2.0, { outfit: 'towel', wet: true }),
    still('15:34', 'dried and dressed', 2.0, { wash: 3, outfit: 'towel' }),
    still('15:40', 'the bay', 1.4),
    walk('16:50', 'the head, to the mess', { head: true, groom: HANDS_WASHED }),
    still('17:00', 'dinner', 1.5, { eat: { kcal: 1100, waterL: 0.5, food: 'mess' } }),
    walk('17:30', 'back to the barracks'),
    still('17:40', 'the head, the evening', 1.4, { head: true, groom: HANDS_WASHED }),
    still('18:40', 'the head, the evening', 1.4, { head: true, groom: HANDS_WASHED }),
    still('19:30', 'the evening, a drink', 1.4, { drink: 0.5, head: true, groom: HANDS_WASHED }),
    still('20:45', 'the head, the evening', 1.4, { head: true, groom: HANDS_WASHED }),
    still('21:45', 'the head, the basin, PT kit', 2.0, { head: 'always', groom: { teeth: true, hands: true } }),
    still('22:00', 'the rack', 1.0, { posture: 'lie', bed: 'own-rack', outfit: 'pt' }),
  ],
});

/** The sols by routine: a training sol Monday to Friday, the holiday Saturday and Sunday (TIME §9.2's week). */
export const SOL_BY_ROUTINE = deepFreeze({ training: REFERENCE_SOL, holiday: HOLIDAY_SOL });
/** A void at a head when the bladder holds at least this (my call: between BODY §5.1's could-go and need, so a garrison sol makes BODY §4.2's 4 to 6 voids), mL; at a stall, sitting anyway, from could-go. */
export const HEAD_VOID_FROM_ML = 300, STALL_VOID_FROM_ML = 200;
