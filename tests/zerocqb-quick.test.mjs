// OLYMPUS tests: the house's gauges on the Wreck's lanes (v0.0.25, "Hold to hold"; its build sheet §8 F132, quick: one lane a bot).
//
// F132 reads the house's F1, F2, F6, F7, F9, F10, F13, F14, F15, F17, F24, F25 and F26 on the Wreck through tests/flawless.mjs' own
// functions (flawlessLane with the fill's scenario 'test-zerocqb', gaugeOf), so each is the house's criterion to the letter. Held here
// (WRECK_ENFORCED) are the ones the Wreck meets on this tree; WRECK_OPEN names the others with what each is, measured, and whose it
// is, printed every run: a gauge leaves WRECK_OPEN when the Wreck meets it, never by a target moved. F15's lane time is printed against
// the steel copy's 107.55 s (the sheet's §8), the house's 46 s mean being three rooms and a hall on one deck.
// v0.0.28's stage 0 (its build sheet §2 step 2; the hardening lens HD§2.5): F15 is read against its own sheet's target, a declared
// re-read as tests/flawless-drawn.mjs reads F15, F21 and F22 for drawn lanes, never a moved number: v0.0.25's §8 set the Wreck's lane
// time against the steel copy's 107.55 s (the sergeant by T on house 1 at 0 G in mag boots, env-noregress' STEEL_COPY), so the tier
// one's lanes on the Wreck are held to a mean and a max of WRECK_LANE_S, the house's 46 s (LANE_MEAN_S) printed beside it; F15 left
// WRECK_OPEN with it (met: 67.1 s on the v0.0.26 tag's lanes, HD§1 row 5).
import { assert } from './helpers.mjs';
import { flawlessLane, gaugeOf, printGauge, LANE_MEAN_S, LANE_MAX_S } from './flawless.mjs';

/** The Wreck's lane time (s): v0.0.25's §8 target for F15 on the Wreck, the steel copy's 107.55 s (see the header). */
export const WRECK_LANE_S = 107.55;

/** The house's gauges held on the Wreck (F132). */
export const WRECK_GAUGES = Object.freeze(['F1', 'F2', 'F6', 'F7', 'F9', 'F10', 'F13', 'F14', 'F15', 'F17', 'F24', 'F25', 'F26']);
/** Of them, those still open on the Wreck at this tree, each with its cause and its owner (the handoff's, measured on 48213). */
export const WRECK_OPEN = Object.freeze({
  // (the review of C and D: the hold's two corners behind the cargo were no hot spot a look could cover, every lane's corner fault, now
  // dead space; F13 met on all 18 lanes since (14 stops at most on the tier one's), so out of this list)
  F7: 'cell 5\'s r2:c2 on the raider by T on 48213 and 1074 (2 of 18 lanes): your "Clear!" after a Transition, your #2 not yet in his entry (F25, B\'s two.js)',
  F17: 'your #2 stacked 1.78 m behind you on the hatches\' stack points, over 1.5 m (A\'s plans, B\'s two.js)',
  // (v0.0.28's D (its build sheet item 24; HD§2.5): F24 out of this list, met on all 18 of zerocqb-flawless' lanes on v0.0.27's
  // integrated snapshot with stage 0, by instinct/base.js's aft line (in stop motion its act the panel's own row, stop:face:aft; the
  // none variant's Take the hold where one is in reach): every stop names a row (before, 9 of 201 named none, each "Feet aft." after
  // the hold's clear on the sergeant to the tier one). Its item 22, the house's leave aboard, is held out by the sheet's risk 6 (it
  // cost a hauler lane and F13 without an edit outside its files, and left F25 and F169 open): so F7, F17 and F25 stay here as they
  // were, measured on the same lanes (.run/v028/d.md, the review's fix))
  F25: 'your #2 over his threshold 3.8 to 4.9 s after his cue at the bulkhead hatches (the undog and the coaming; B\'s two.js, F129)',
});
const WRECK_ENFORCED = WRECK_GAUGES.filter(id => !WRECK_OPEN[id]);

/** F15 on the Wreck, read against its own sheet's target (see the header): the tier one's lanes, mean and max at most WRECK_LANE_S, the house's figures beside it. */
export function wreckF15(recs) {
  const xs = recs.filter(r => r.tier === 'tierone' && r.done && Number.isFinite(r.laneS)).map(r => r.laneS);
  const mean = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null, max = xs.length ? Math.max(...xs) : null;
  return { id: 'F15', name: 'lane time (the tier one), the Wreck\'s', met: xs.length > 0 && mean <= WRECK_LANE_S && max <= WRECK_LANE_S,
    value: `${xs.length} lanes: mean ${mean?.toFixed(1) ?? '-'} s, max ${max?.toFixed(1) ?? '-'} (the house's ${LANE_MEAN_S} s mean and ${LANE_MAX_S} s max are three rooms and a hall on one deck)`,
    target: `mean and max ${WRECK_LANE_S} s or less (the steel copy's, v0.0.25's §8)` };
}
/** The Wreck's gauge rows for some lanes (WRECK_GAUGES only; F15 read against the Wreck's own target, wreckF15). */
export function wreckGauges(lanes) {
  const recs = lanes.map(L => flawlessLane({ ...L, fill: { scenario: 'test-zerocqb' } }));
  return { recs, rows: gaugeOf(recs).filter(r => WRECK_GAUGES.includes(r.id)).map(r => (r.id === 'F15' ? { ...r, ...wreckF15(recs) } : r)) };
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
    name: 'F132 (quick): the house\'s F1, F2, F6, F9, F10, F13, F14, F24 and F26 met on the Wreck by the tier one by T and the private by the keys on 48213, and F15 against the Wreck\'s own 107.55 s (v0.0.28\'s stage 0; F24 from its D); F7, F17 and F25 printed open with their causes',
    timeoutMs: 120_000,
    fn() {
      const { recs } = holdWreck('F132 on the Wreck, 48213 (tier one T, private keys)', [{ tier: 'tierone', seed: 48213, bot: 'honest' }, { tier: 'private', seed: 48213, bot: 'keys' }]);
      console.log(`      lanes ${recs.map(r => `${r.tier} ${r.laneS} s`).join(', ')} (the steel copy's 107.55 s)`);
      assert(recs.every(r => r.done), 'every lane to its card');
    },
  },
];
