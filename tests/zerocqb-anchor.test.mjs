// OLYMPUS tests: anchor before you fire on the Wreck (v0.0.25, "Hold to hold"; its build sheet §1 items 4 and 13, §8 F126; WEAPONS §7.8).
//
// The user, 2026-11-08: "Try keeping rifles looking like rifles even zero G stuff, let's say we use footing to hold recoil". Every round
// of the lane carries the anchor it was fired from (shoothouse.js houseShot through roundAnchor: the row the recoil was read on, the
// #2's grip named 'buddy'), the first round's on its compartment's row of the card ("FIRST ROUND MAG BOOTS"), and a round fired
// floating is the fault 'float' ("Anchor before you fire!"), once a compartment, its push and its spin recoilFloat's, kept whole on
// the body (floating keeps all of it: keptMs the round's dv, keptRads its spin). F126: no honest round floating; every first round's
// anchor on the card; every fuzz round fired floating faulted in its compartment, its kick recoilFloat's.
import { assert } from './helpers.mjs';
import { wreckLane, laneLine } from './flawless-wreck.mjs';
import { runSheetOf, ANCHOR_CARD } from '../src/sim/scenarios/shoothouse.js';

export default [
  {
    name: 'F126: no round of the honest sergeant by T on 48213 is fired floating, and each compartment\'s first round has its anchor on the card\'s row',
    fn() {
      const { g, rec } = wreckLane({ tier: 'sgt', bot: 'honest' }), rs = runSheetOf(g.state);
      const by = rec.rounds.reduce((o, r) => { o[r.anchor ?? 'none'] = (o[r.anchor ?? 'none'] ?? 0) + 1; return o; }, {});
      console.log(`      ${laneLine(rec)}`);
      console.log(`      your ${rec.rounds.length} rounds by anchor ${JSON.stringify(by)}; first rounds ${rec.firstAnchors.join(', ')}; the rows: ${rs.rows.map(r => r.words.split(' · ').filter(w => /FIRST ROUND/.test(w))[0] ?? '-').join(' | ')}`);
      assert(rec.rounds.length > 0 && rec.rounds.every(r => r.anchor && r.anchor !== 'floating') && rec.floatMine === 0 && rec.floatFaults === 0, JSON.stringify(by));
      assert(rs.rows.every((r, k) => !rec.firstAnchors[k] || r.words.includes(`FIRST ROUND ${ANCHOR_CARD[rec.firstAnchors[k]]}`)), rs.rows.map(r => r.words).join(' | '));
      assert(/FIRED FLOATING: NONE/.test(rs.card), rs.card);
    },
  },
  {
    name: 'F126: every round the fuzz fires floating (the tier one on 1111, its boots let go) is faulted \'float\' in its compartment, and its push and spin are recoilFloat\'s, kept whole on the body',
    heavy: true,
    fn() {
      const { g, rec } = wreckLane({ tier: 'tierone', seed: 1111, bot: 'fuzz' }), rs = runSheetOf(g.state);
      const floats = rec.rounds.filter(r => r.anchor === 'floating'), bad = floats.filter(r => !r.kick || !r.kick.moved || r.kick.keptMs !== r.kick.dvMs || r.kick.keptRads !== r.kick.spinRads);
      const legs = rec.floatLegs.map((L, k) => `${k + 1}: ${L.rounds} ${L.faulted ? 'faulted' : 'NOT faulted'}`);
      console.log(`      ${laneLine(rec)}`);
      console.log(`      rounds floating ${floats.length} (the card: ${/FIRED FLOATING: [^·]+/.exec(rs.card)?.[0] ?? '-'}); by compartment ${legs.join(', ')}; a kick ${floats[0]?.kick ? JSON.stringify(floats[0].kick) : '-'}; off recoilFloat ${bad.length}`);
      assert(floats.length > 0, 'the fuzz fired no round floating');
      assert(rec.floatLegs.every(L => !L.rounds || L.faulted) && !bad.length, JSON.stringify({ legs, bad: bad.slice(0, 2) }));
      assert(rs.card.includes(`FIRED FLOATING: ${rec.floatMine}`), rs.card);
    },
  },
];
