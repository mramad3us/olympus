// OLYMPUS tests: the debrief says why (the build sheet v0.0.20 §1 item 4; card C1): a cause on every missed par, the instructor's dummy set apart.
//
// v0.0.19's card told the honest tier one "He fired first. Set a Watch on your corner before you go" on lanes where his rifle was up
// and the instructor's dummy clicked (54 of 59 missed pars from the corporal up were the dummy's leg: card.md §0 item 1). Now a par
// whose window held the dummy's click is judged on its time less the click's (shoothouse.js clickIn: from the click to the first
// round, the press that clicked being the round that would have been first): met within it, the run sheet says "OPERATOR MET (CLICK
// 1.66)", the card leaves the room out of FIRED FIRST, and the one thing is never the Watch for it. A missed par carries its cause
// (parCauseOf: gun, unready, eyes, hands, feet) and the one thing scores the cause ('par:<cause>'); a stoppage of your own is 'gun',
// never the click. Each lane is one sheet on one seed from GO (under a second of CPU), the honest bot (T and the line's shot).
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseHonestBot, runHouse } from './bots/house.mjs';
import { runSheetOf, houseOf, parCauseOf, clickIn, parOf, iaBookOf, PAR_CAUSES, EYES_K, HANDS_K } from '../src/sim/scenarios/shoothouse.js';
import { gunOn } from '../src/sim/arms/shooting.js';
import { playerId } from '../src/core/ids.js';
import { HOUSE_CHIEF } from '../src/data/courses.js';
import { barParts, barSpan } from '../src/ui/cards/house.js';
import { hotWashOf, casualtyCause } from '../src/sim/scenarios/shoothouse.js';
// (tests/flawless-end.mjs's endLane, loaded by the heavy cases only: the quick file's CPU stays its own)
const endLaneOf = async () => (await import('./flawless-end.mjs')).endLane;

const lane = (tier, seed, setup = 'go') => { const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup }); const r = runHouse(g, houseHonestBot()); return { g, r, s: g.state, H: houseOf(g.state), rs: runSheetOf(g.state) }; };
// (a lane run once for the quick cases that read it (the B and C review of 2026-11-16: the file at 2.9 to 3.4 s of CPU against its
// quick budget, QUICK_FILE_CPU_S 3 s × k; the tier one on 101 and on 48213 each run twice). A case that changes what it reads puts
// it back before it returns, so the next reader has the lane as played)
const LANES = new Map();
const laneOnce = (tier, seed) => { const k = `${tier}/${seed}`; if (!LANES.has(k)) LANES.set(k, lane(tier, seed)); return LANES.get(k); };
const WATCH = /Watch on your corner/;

export default [
  {
    name: 'a par missed only by the instructor\'s dummy is met within the click: "OPERATOR MET (CLICK …)" on its row, no FIRED FIRST on the card, and the one thing is not the Watch (the tier one on 105, 2a on the click; v0.0.19 said "OPERATOR MISSED", "FIRED FIRST ON YOU: ROOM 2" and the Watch)',
    fn() {
      const { r, s, H, rs } = lane('tierone', 105);
      const k = H.rooms[1].contacts.find(c => c.stand === '2a' && c.by === 'me');
      console.log(`      2a: seen ${k.seenMs - H.goAtMs} ms from GO, the click ${H.dummy.clickAtMs - k.seenMs} ms after, cleared ${H.dummy.clearedAtMs - H.dummy.clickAtMs} ms, first round ${k.firstAtMs - k.seenMs} ms; met ${k.parMet}, cause ${k.cause}, the click's cost ${k.click} ms (par ${parOf(r ? undefined : null, null, H).base} ms)`);
      console.log(`      ${rs.rows[1].words}`);
      console.log(`      ${rs.card}`);
      console.log(`      one thing: ${rs.one.key}: ${rs.one.text}`);
      const bars = hotWashOf(s).bars, b = bars.find(x => x.key === k.key), p = barParts(b, barSpan(bars));
      console.log(`      the hot wash's bar: ${JSON.stringify(b)}; its click segment ${JSON.stringify(p.click)}, late ${p.late}`);
      assert(r.done && k.parMet === true && k.cause === 'click' && k.click > 0 && p.click && !p.late, JSON.stringify({ k, b, p }));
      assert(/OPERATOR MET \(CLICK \d\.\d\d\)/.test(rs.rows[1].words) && !/FIRED FIRST/.test(rs.card) && !WATCH.test(rs.one.text) && rs.one.key !== 'par:click', JSON.stringify({ row: rs.rows[1].words, card: rs.card, one: rs.one }));
    },
  },
  {
    name: 'the honest tier one\'s lane with no fault called and no par missed outside the click is "clean", and the dummy cleared at his own pace is no lesson (seeds 101 to 104; v0.0.19: clean on 0 of 20)',
    fn() {
      const out = [101, 102, 103, 104].map(seed => { const { H, rs } = laneOnce('tierone', seed); return { seed, one: rs.one.key, dummy: H.dummy.clickAtMs === null ? null : H.dummy.clearedAtMs - H.dummy.clickAtMs, ia: H.iaBookMs ?? null, clicks: [...H.rooms, H.hall].flatMap(L => L.contacts.filter(c => c.click).map(c => `${c.stand}:${c.parMet ? 'met' : 'missed'}:${c.click}`)) }; });
      for (const o of out) console.log(`      ${o.seed}: ${o.one}; the dummy cleared in ${o.dummy} ms against HANDS_K ${HANDS_K} × ${o.ia} ms; the click on ${o.clicks.join(', ') || 'no par'}`);
      assert(out.every(o => o.one === 'clean'), JSON.stringify(out));
    },
  },
  {
    name: 'a stoppage of your own is the cause \'gun\', never the click; the dummy\'s set stoppage is not yours; with neither the larger excess of eyes and hands names it (parCauseOf on a lane\'s own contact)',
    fn() {
      const { s, H } = laneOnce('tierone', 48213);
      const L = H.rooms[0], c = L.contacts.find(x => x.by === 'me' && x.stand === '1a'), T = s.armoury.range.turners.find(t => t.key === c.key), from = c.seenMs;
      const R = s.armoury.range, keep = R.stoppage, d0 = { ...H.dummy };
      R.stoppage = { atMs: from + 200, kind: 'stovepipe', set: false, cleared: true };
      H.dummy.clickAtMs = null; H.dummy.clearedAtMs = null;
      const own = parCauseOf(s, H, L, c, T, from, from + 2500, from + 2500), ownClick = clickIn(H, from, from + 2500);
      R.stoppage = { atMs: from + 200, kind: 'dud', set: true, cleared: true };
      H.dummy.clickAtMs = from + 200; H.dummy.clearedAtMs = from + 700;
      const set = parCauseOf(s, H, L, c, T, from, from + 2500, from + 2500), setClick = clickIn(H, from, from + 2500);
      R.stoppage = keep; Object.assign(H.dummy, d0);
      const slow = parCauseOf(s, H, L, { ...c, carry: 'aimed', takeInMs: 40, pauseAtMs: from + 40 }, T, from, from + 4000, from + 4000);
      const blind = parCauseOf(s, H, L, { ...c, carry: 'aimed', takeInMs: 3000, pauseAtMs: from + 3000 }, T, from, from + 3400, from + 3400);
      const down = parCauseOf(s, H, L, { ...c, carry: 'lowReady' }, T, from, from + 4000, from + 4000);
      console.log(`      your stoppage: ${own} (click ${ownClick} ms); the dummy's: ${set} (click ${setClick} ms); hands slow: ${slow}; seen late: ${blind}; low ready at the sighting: ${down}; EYES_K ${EYES_K}, HANDS_K ${HANDS_K}; causes ${PAR_CAUSES.join(', ')}`);
      assert(own === 'gun' && ownClick === 0 && set !== 'gun' && setClick === 2300 && slow === 'hands' && blind === 'eyes' && down === 'unready', JSON.stringify({ own, ownClick, set, setClick, slow, blind, down }));
    },
  },
  {
    name: 'the one thing scores a missed par by its cause, each its own advice in HOUSE_CHIEF.one, and v0.0.19 K\'s fault keys keep their weights over it (a frag into a family beats a par missed)',
    fn() {
      const { s, H } = laneOnce('tierone', 48213);
      const c = H.rooms[0].contacts.find(x => x.by === 'me' && x.stand === '1a');
      const was = { parMet: c.parMet, cause: c.cause }, faults = H.rooms[0].faults.length;
      Object.assign(c, { parMet: false, cause: 'hands' });
      const a = runSheetOf(s).one;
      H.rooms[0].faults.push({ kind: 'fragged', atMs: c.seenMs });
      const b = runSheetOf(s).one;
      Object.assign(c, was); H.rooms[0].faults.length = faults;
      const keys = PAR_CAUSES.filter(k => k !== 'click').map(k => `par:${k}`);
      console.log(`      a par missed on hands: ${a.key} "${a.text}"; with a frag into a family: ${b.key}; the lines ${keys.map(k => `${k} ${HOUSE_CHIEF.one[k]?.length ?? 0}`).join(', ')}`);
      assert(a.key === 'par:hands' && HOUSE_CHIEF.one['par:hands'].includes(a.text) && b.key === 'fragged' && keys.every(k => HOUSE_CHIEF.one[k]?.length >= 2), JSON.stringify({ a, b }));
    },
  },
  {
    name: 'the immediate action\'s book is the fill\'s after a save is loaded, whatever gun is in hand then (fails with it kept under a $ key, stripped from the save: the C and D review of 2026-11-16)',
    fn() {
      const { g, s, H, rs } = laneOnce('tierone', 101), fill = iaBookOf(s, H);
      const g2 = createGame({ scenario: 'test-shoothouse', seed: 101, tier: 'tierone' }), s2 = g2.load(g.save()), H2 = houseOf(s2);
      const loaded = iaBookOf(s2, H2), one2 = runSheetOf(s2).one;
      // (the gun in hand gone from the loaded state: a book recomputed from the hands would read 0, as one from the P-12 would read its own)
      const gid = gunOn(s2, playerId(s2)), item = s2.items[gid];
      delete s2.items[gid];
      const handless = iaBookOf(s2, H2);
      s2.items[gid] = item;
      console.log(`      tier one 101: the book at the fill ${fill} ms, after a load ${loaded} ms, with no gun in hand ${handless} ms; the one thing ${rs.one.key} (${rs.one.score}), after the load ${one2.key} (${one2.score})`);
      assert(fill > 0 && loaded === fill && handless === fill && one2.key === rs.one.key && one2.score === rs.one.score, JSON.stringify({ fill, loaded, handless, one: [rs.one, one2] }));
    },
  },
  // (v0.0.22, its build sheet's item 5 (FL22-5): the casualty's lesson by its cause, shoothouse.js casualtyCause, as a missed par's is)
  {
    name: 'the casualty\'s lesson names what killed you (heavy: house-cause is at its quick budget): the sergeant by T on 48213 live (live:fight,hide) at GO, clicked with the man inside TRANSITION_NEAR_M and the P-12 holstered, hears the click\'s ("the pistol, not the tap-rack"); the boot recruit by the keys on 48213 live by its record (unseen or slow); a strike of yours before his fatal one makes it \'fought\' (before: "Paint on the stack ends it. See him first, shoot first." for every casualty)',
    heavy: true,
    timeoutMs: 120_000,
    async fn() {
      const endLane = await endLaneOf();
      const sg = endLane({ tier: 'sgt', seed: 48213, bot: 'T', opfor: 'live:fight,hide', setup: 'go' }), rc = endLane({ tier: 'recruit', seed: 48213, bot: 'keys', opfor: 'live', setup: 'go' });
      const one = (r) => runSheetOf(r.$state).one, cause = (r) => casualtyCause(r.$state, houseOf(r.$state));
      for (const r of [sg, rc]) console.log(`      ${r.cell}: ${r.end}; cause ${cause(r)}; the one thing ${one(r)?.key}: "${one(r)?.text}"`);
      // (a hand-made 'fought': the recruit's own record with a round of yours on the man that killed him, before his fatal strike)
      const s = rc.$state, H = houseOf(s), K = H.live.casualty, T = s.armoury.range.turners.find(x => x.key === K.by);
      const was = T.hits;
      T.hits = [...was, { shotId: 'x-test', part: 'torso', zone: 'A', ring: false, through: false, at: null, atMs: K.atMs - 500, by: 'me' }];
      const fought = casualtyCause(s, H), foughtOne = runSheetOf(s).one;
      T.hits = was;
      console.log(`      the recruit's record with a hit of yours 0.5 s before the fatal strike: ${fought}; "${foughtOne?.text}"`);
      assert(sg.end === 'casualty' && cause(sg) === 'click' && one(sg).key === 'casualty:click' && HOUSE_CHIEF.one['casualty:click'].includes(one(sg).text), JSON.stringify(one(sg)));
      assert(rc.end === 'casualty' && ['unseen', 'slow'].includes(cause(rc)) && one(rc).key === (cause(rc) === 'slow' ? 'casualty' : 'casualty:unseen'), JSON.stringify([cause(rc), one(rc)]));
      assert(fought === 'fought' && foughtOne.key === 'casualty:fought', JSON.stringify([fought, foughtOne]));
    },
  },
  {
    name: 'the casualty\'s causes over 8 seeds × the six sheets × the keys and T on the live lane (heavy): each casualty lane\'s one thing its cause\'s, none \'slow\' where the run sheet says YOURS … BEFORE HIS (the feel lens: 7 before)',
    heavy: true,
    timeoutMs: 900_000,
    async fn() {
      const endLane = await endLaneOf(), recs = [];
      for (const tier of ['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone']) for (const bot of ['keys', 'T']) for (const seed of [48213, 1, 2, 3, 4, 5, 6, 7]) recs.push(endLane({ tier, seed, bot, opfor: 'live' }));
      const cas = recs.filter(r => r.end === 'casualty'), counts = {}, bad = [];
      for (const r of cas) {
        const c = casualtyCause(r.$state, houseOf(r.$state)), rs = runSheetOf(r.$state);
        counts[c] = (counts[c] ?? 0) + 1;
        if (c === 'slow' && rs.rows.some(x => /YOURS [0-9.]+ S BEFORE HIS/.test(x.words))) bad.push(`${r.cell} slow with YOURS BEFORE HIS`);
        if (rs.one.key !== (c === 'slow' ? 'casualty' : `casualty:${c}`)) bad.push(`${r.cell} the one thing ${rs.one.key} for ${c}`);
      }
      console.log(`      ${recs.length} lanes, ${cas.length} casualties; causes ${JSON.stringify(counts)}; slow where yours came first ${bad.filter(b => /YOURS/.test(b)).length}`);
      assert(!bad.length, bad.join(' | '));
    },
  },
];
