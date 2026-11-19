// OLYMPUS tests: samples-void-look, the void's places and sounds as a look set (the build sheet v0.0.24 §0 item 27, §13 question 13;
// stage 0's). Well A's steel deck and its holds and the ship's siren and the mag boots' clank were in no sample, so stage 0 made
// samples/void-look on the round's first day and D and A build at its defaults (P-a, H-a, S-a, K-a) until the user scores it. Held
// here: the set shot whole (tests/samples-check.mjs checkSet: its four groups, eight views, each at its own whole-pixel size, open with
// those defaults, built in v0.0.24), every view drawn in node at the size sample.json says, and what each candidate claims in its
// picture's report: the holds on the grid rule (a hold every GRID_M 1.5 m along the 10 m bulkhead, 7; a pad-eye every PAD_EYE_M 3 m in
// the deck, 8), the deck and the holds each view's own; the siren's pitch the candidate's (S-a's two tones within 2% of 960 and
// 770 Hz, S-b's glide from under 520 Hz to over 1,150 Hz); the clank at the level the boots measure (weightDb of MAG_STEP_G 0.3 G
// and the berth's air at 66 kPa, -7.09 dB) and K-b 3 dB under it, its peak 3 dB under K-a's. Fails without the set.
import { assert, fmt } from './helpers.mjs';
import { checkSet, drawn } from './samples-check.mjs';

export default [
  {
    name: 'void-look: P, H, S and K shot whole, P-a, H-a, S-a and K-a the defaults (v0.0.24); the holds on the grid rule, each view its own deck and holds',
    async fn() {
      const { views } = checkSet('void-look', { groups: ['P', 'H', 'S', 'K'], views: 8, open: ['P-a', 'H-a', 'S-a', 'K-a'], builtIn: 'v0.0.24' });
      const out = [];
      for (const v of views.filter(x => /^[PH]-/.test(x.id))) {
        const P = await drawn('void-look/deck.js', v), r = P.report;
        assert(r.view === v.id && (v.id.startsWith('P') ? r.deck === v.id && r.holds === 'H-a' : r.holds === v.id && r.deck === 'P-a'), JSON.stringify({ view: v.id, r }));
        assert(r.gridM === 1.5 && r.padEyeM === 3 && r.holdsDrawn === 7 && r.padEyes === 8, JSON.stringify(r));
        out.push(`${v.id} deck ${r.deck}, holds ${r.holds} (${r.holdsDrawn} on the bulkhead, ${r.padEyes} pad-eyes)`);
      }
      console.log(`      ${out.join('; ')}`);
    },
  },
  {
    name: 'void-look: the siren\'s pitch is each candidate\'s (S-a two tones, 960 and 770 Hz; S-b a whoop, 500 to 1,200 Hz), the clank at the boots\' -7.09 dB and K-b 3 dB under it',
    async fn() {
      const { views } = checkSet('void-look', { groups: ['P', 'H', 'S', 'K'], views: 8, open: ['P-a', 'H-a', 'S-a', 'K-a'], builtIn: 'v0.0.24' });
      const R = {};
      for (const v of views.filter(x => /^[SK]-/.test(x.id))) R[v.id] = (await drawn('void-look/sounds.js', v)).report;
      const near = (a, b, k) => Math.abs(a - b) <= b * k;
      console.log(`      S-a pitch ${R['S-a'].pitchHz.join(' to ')} Hz, peak ${fmt(R['S-a'].peakDb, 1)} dBFS; S-b ${R['S-b'].pitchHz.join(' to ')} Hz, peak ${fmt(R['S-b'].peakDb, 1)}; K-a ${R['K-a'].clankDb} dB, peak ${fmt(R['K-a'].peakDb, 2)}; K-b ${R['K-b'].clankDb} dB, peak ${fmt(R['K-b'].peakDb, 2)}`);
      assert(near(R['S-a'].pitchHz[0], 770, 0.02) && near(R['S-a'].pitchHz[1], 960, 0.02), JSON.stringify(R['S-a']));
      assert(R['S-b'].pitchHz[0] < 520 && R['S-b'].pitchHz[1] > 1150, JSON.stringify(R['S-b']));
      assert(R['K-a'].clankDb === -7.09 && R['K-b'].clankDb === -10.09 && Math.abs(R['K-a'].peakDb - R['K-b'].peakDb - 3) < 0.05, JSON.stringify({ a: R['K-a'], b: R['K-b'] }));
    },
  },
];
