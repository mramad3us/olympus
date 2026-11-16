// OLYMPUS tests: the instructor's verdict, GO or NO-GO against the sheet's standard (the build sheet v0.0.20 §1 item 20; card C5).
//
// shoothouse.js houseVerdict reads the run sheet's own record: every threat down, no no-shoot or hostage hit, no muzzle and no
// safety stop, at most STANDARD_PARS pars missed outside the click, the lane within its par (H.laneParMs), no room passed; a set-up
// lane is never a GO. It leads the card's line ("GO", "NO-GO: THE HOSTAGE"), is said last in the hot wash ("GO." / "NO-GO: the
// hostage."), and is null before the lane's end. One sheet on one seed a lane, from GO.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseHonestBot, houseBot, runHouse } from './bots/house.mjs';
import { houseVerdict, verdictWords, runSheetOf, hotWashOf, houseOf, STANDS } from '../src/sim/scenarios/shoothouse.js';
import { ownerOf } from '../src/sim/combat/team.js';
import { STANDARD_PARS, VERDICT_WHY, HOUSE_CHIEF } from '../src/data/courses.js';

const lane = (tier, seed, setup = 'go') => { const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup }); const before = houseVerdict(g.state); runHouse(g, houseHonestBot()); return { g, s: g.state, H: houseOf(g.state), before }; };

export default [
  {
    name: 'the honest tier one is a GO on 101 and 103, the verdict leading the card and said last in the hot wash; before the lane\'s end there is none',
    fn() {
      for (const seed of [101, 103]) {
        const { s, before } = lane('tierone', seed), v = houseVerdict(s), rs = runSheetOf(s), hw = hotWashOf(s);
        console.log(`      ${seed}: ${JSON.stringify({ go: v.go, why: v.why, missed: v.missed, laneMs: v.laneMs, laneParMs: v.laneParMs })}; before GO's lane: ${before.go}; "${rs.card.split(' · ').slice(0, 2).join(' · ')}"; the wash ends "${hw.lines.at(-1)}"`);
        assert(before.go === null && v.go === true && /^GO · /.test(rs.card) && HOUSE_CHIEF.verdict.go.includes(hw.lines.at(-1)), JSON.stringify({ v, card: rs.card, last: hw.lines.at(-1) }));
      }
    },
  },
  {
    name: 'NO-GO with the hostage hit (its first reason named in his words), with pars missed past STANDARD_PARS, and on a set-up lane whatever else',
    fn() {
      const { s, H } = lane('tierone', 101);
      H.rooms[2].faults.push({ kind: 'hostage', atMs: H.rooms[2].clearAtMs });
      const a = houseVerdict(s), aw = verdictWords(s, a), card = runSheetOf(s).card;
      H.rooms[2].faults.pop();
      const misses = [...H.rooms, H.hall].flatMap(L => L.contacts.filter(c => c.parMet !== null && c.by === 'me')).slice(0, STANDARD_PARS + 1);
      for (const c of misses) c.parMet = false;
      const b = houseVerdict(s);
      for (const c of misses) c.parMet = true;
      const up = lane('tierone', 101, 'room:3'), c = houseVerdict(up.s);
      console.log(`      the hostage: ${a.go} ${a.why.join(', ')} "${aw}" (${card.split(' · ')[0]}); ${misses.length} pars missed: ${b.go} ${b.why.join(', ')}; set up from room 3: ${c.go} ${c.why.join(', ')}`);
      assert(a.go === false && a.why[0] === 'hostage' && aw.includes(VERDICT_WHY.hostage) && /^NO-GO: THE HOSTAGE/.test(card), JSON.stringify({ a, aw, card }));
      assert(b.go === false && b.why.includes('pars') && c.go === false && c.why[0] === 'setup', JSON.stringify({ b, c }));
    },
  },
  {
    name: 'a par your #2 missed on a man of his never counts against you: one of yours and one of his missed is still within STANDARD_PARS (fails with his counted: the C and D review of 2026-11-16, the sergeant by T on 1489397426 NO-GO for his 3a)',
    fn() {
      // (the tier one on 101: 1a yours, 1b his, each sighted first by its owner; both pars forced missed)
      const { s, H } = lane('tierone', 101), L = H.rooms[0], own = (c) => ownerOf(s, { slot: STANDS[c.stand]?.slot ?? 1, room: L.room });
      const mine = L.contacts.find(c => c.stand === '1a' && c.by === 'me'), his = L.contacts.find(c => c.stand === '1b' && c.by !== 'me' && c.parMet !== null);
      const was = [mine?.parMet, his?.parMet];
      mine.parMet = false; his.parMet = false;
      const v = houseVerdict(s);
      [mine.parMet, his.parMet] = was;
      // (the review's lane: the sergeant by T's bundles on 1489397426, a GO with only his own 2a missed)
      const g = createGame({ scenario: 'test-shoothouse', seed: 1489397426, tier: 'sgt', setup: 'go' });
      runHouse(g, houseBot({ mode: 'T' }));
      const sg = houseOf(g.state), w = houseVerdict(g.state);
      const misses = [...sg.rooms, sg.hall].flatMap(M => M.contacts.filter(c => c.parMet === false).map(c => `${c.stand}:${c.by}:owner ${ownerOf(g.state, { slot: STANDS[c.stand]?.slot ?? 1, room: M.room })}`));
      console.log(`      tier one 101, 1a (owner ${own(mine)}) and 1b (owner ${own(his)}, by ${his.by}) missed: ${v.go ? 'GO' : 'NO-GO'} ${v.why.join(', ') || '-'}, missed ${v.missed} of STANDARD_PARS ${STANDARD_PARS}`);
      console.log(`      the sergeant by T on 1489397426: ${w.go ? 'GO' : 'NO-GO'} ${w.why.join(', ') || '-'}, missed ${w.missed}, the misses ${JSON.stringify(misses)}`);
      assert(own(mine) === 1 && own(his) === 2 && v.missed === 1 && v.go === true, JSON.stringify({ v, owners: [own(mine), own(his)] }));
      assert(w.go === true && w.missed <= STANDARD_PARS, JSON.stringify({ w, misses }));
    },
  },
  {
    name: 'the NO-GO\'s reason opens its sentence with a capital in both of his forms, for every reason ("NO-GO. Too many pars missed.", never "NO-GO. too many": the C and D review of 2026-11-16)',
    fn() {
      // (verdictWords reads only the seed of a state: the two forms drawn over seeds, each reason in each)
      const seen = {}, bad = [];
      for (let seed = 1; seed <= 64; seed++) for (const why of Object.keys(VERDICT_WHY)) {
        const w = verdictWords({ meta: { seed } }, { go: false, why: [why] }), form = w.startsWith('NO-GO:') ? 'colon' : 'stop';
        seen[form] = (seen[form] ?? 0) + 1;
        if (/[.!?]\s+[a-z]/.test(w) || !w.endsWith('.')) bad.push(w);
        if (why === 'pars') seen[`pars ${form}`] ??= w;
      }
      console.log(`      ${JSON.stringify(seen)}; lower case after a full stop: ${bad.length}${bad.length ? ` ("${bad[0]}")` : ''}`);
      assert(seen.colon > 0 && seen.stop > 0 && bad.length === 0, JSON.stringify({ seen, bad: bad.slice(0, 3) }));
    },
  },
];
