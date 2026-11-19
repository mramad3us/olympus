// OLYMPUS tests: the house's gauges on the Wreck's lanes (v0.0.25, "Hold to hold"; its build sheet §8 F132, quick: one lane a bot).
//
// F132 reads the house's F1, F2, F6, F7, F9, F10, F13, F14, F15, F17, F24, F25 and F26 on the Wreck through tests/flawless.mjs' own
// functions (flawlessLane with the fill's scenario 'test-zerocqb', gaugeOf), so each is the house's criterion to the letter. Held here
// (WRECK_ENFORCED) are the ones the Wreck meets on this tree; WRECK_OPEN names the others with what each is, measured, and whose it
// is, printed every run: a gauge leaves WRECK_OPEN when the Wreck meets it, never by a target moved. F15's lane time is printed against
// the steel copy's 107.55 s (the sheet's §8), the house's 46 s mean being three rooms and a hall on one deck.
import { assert } from './helpers.mjs';
import { flawlessLane, gaugeOf, printGauge } from './flawless.mjs';

/** The house's gauges held on the Wreck (F132). */
export const WRECK_GAUGES = Object.freeze(['F1', 'F2', 'F6', 'F7', 'F9', 'F10', 'F13', 'F14', 'F15', 'F17', 'F24', 'F25', 'F26']);
/** Of them, those still open on the Wreck at this tree, each with its cause and its owner (the handoff's, measured on 48213). */
export const WRECK_OPEN = Object.freeze({
  // (the review of C and D: the hold's two corners behind the cargo were no hot spot a look could cover, every lane's corner fault, now
  // dead space; F13 met on all 18 lanes since (14 stops at most on the tier one's), so out of this list)
  F7: 'cell 5\'s r2:c2 on the raider by T on 48213 and 1074 (2 of 18 lanes): your "Clear!" after a Transition, your #2 not yet in his entry (F25, B\'s two.js)',
  F15: 'the Wreck\'s 4 compartments on two decks, 67.1 s mean on the tier one (the house\'s 46 s mean is 3 rooms and a hall; the steel copy\'s 107.55 s)',
  F17: 'your #2 stacked 1.78 m behind you on the hatches\' stack points, over 1.5 m (A\'s plans, B\'s two.js)',
  F24: 'a stop that names no row (the feet aft\'s pause), and T\'s row past page 1 once',
  F25: 'your #2 over his threshold 3.8 to 4.9 s after his cue at the bulkhead hatches (the undog and the coaming; B\'s two.js, F129)',
});
const WRECK_ENFORCED = WRECK_GAUGES.filter(id => !WRECK_OPEN[id]);

/** The Wreck's gauge rows for some lanes (WRECK_GAUGES only). */
export function wreckGauges(lanes) {
  const recs = lanes.map(L => flawlessLane({ ...L, fill: { scenario: 'test-zerocqb' } }));
  return { recs, rows: gaugeOf(recs).filter(r => WRECK_GAUGES.includes(r.id)) };
}
/** Print and hold them: every enforced gauge met, and every open one printed with its cause. */
export function holdWreck(head, lanes) {
  const { recs, rows } = wreckGauges(lanes);
  printGauge(head, rows);
  for (const [id, why] of Object.entries(WRECK_OPEN)) console.log(`      ${id} open on the Wreck: ${why}${rows.find(r => r.id === id)?.met ? ' (MET on these lanes: take it out of WRECK_OPEN)' : ''}`);
  const bad = rows.filter(r => WRECK_ENFORCED.includes(r.id) && !r.met).map(r => `${r.id}: ${r.value}`);
  assert(!bad.length, bad.join(' | '));
  return { recs, rows };
}

export default [
  {
    name: 'F132 (quick): the house\'s F1, F2, F6, F9, F10, F13, F14 and F26 met on the Wreck by the tier one by T and the private by the keys on 48213; F7, F15, F17, F24 and F25 printed open with their causes',
    timeoutMs: 120_000,
    fn() {
      const { recs } = holdWreck('F132 on the Wreck, 48213 (tier one T, private keys)', [{ tier: 'tierone', seed: 48213, bot: 'honest' }, { tier: 'private', seed: 48213, bot: 'keys' }]);
      console.log(`      lanes ${recs.map(r => `${r.tier} ${r.laneS} s`).join(', ')} (the steel copy's 107.55 s)`);
      assert(recs.every(r => r.done), 'every lane to its card');
    },
  },
];
