// OLYMPUS tests: the casualty's care (F164's B half): your tourniquet offered exactly while aid.js tourniquetOf finds a limb, its five parts cut by a cue, the limb's bleeds stopped and cared 'tourniquet' with its cost; the same two functions on scripted NPC records; the corpsman's card equal to careOf and casualtyOutcome (v0.0.27's build sheet §6 B, items 9 and 15, FT§7; src/sim/body/aid.js, src/sim/combat/contact.js).
//
// The row's offer is read on the live lane (tests/game.mjs, "Stack and clear, live" at GO) with the ledger made 'real' (the boarding's
// switch, would.js realOf) and your body scripted, 300 wounds; the cue is a take-in's window opened under a running tourniquet. The NPCs'
// records are plain body records; boardingCare runs on tests/boarding-world.mjs with your arm, Four's thigh and a pirate's chest wounded
// by would.js's real strikes. Each case fails without its fix: with no realRows the row is never offered; with no cut it runs its five
// parts through the window; with applyTourniquet off the limb's rule the corpsman's care differs.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { boardingWorld } from './boarding-world.mjs';
import { newLedger, wouldHave, strikeOf } from '../src/sim/combat/would.js';
import { tourniquetOf, applyTourniquet, boardingCare, TQ_MS, TQ_PARTS, CARE_EACH_MS, CARE_OUTCOME } from '../src/sim/body/aid.js';
import { careOf, casualtyOutcome, woundMods, EVAC_MIN, HARD_BLEED_PM } from '../src/sim/body/wounds.js';
import { contactRows, realRows } from '../src/sim/combat/contact.js';
import { enterStop, stepsOf, chooseStep } from '../src/sim/arms/shooting.js';
import { noteContact } from '../src/sim/people/mind.js';
import { stream, next, range, pick } from '../src/core/rng.js';
import { BODY_V } from '../src/sim/body/record.js';
import { BODY_TMPL } from '../src/data/people/looks.js';
import { MIN_MS } from '../src/core/clock.js';

const PARTS = ['armL', 'armR', 'legL', 'legR', 'torso', 'head'];
// (a scripted wound record: one to three injuries of any part, rate, artery, cared, bleeding or stopped, internal or not)
function scripted(r, ms) {
  const injuries = Array.from({ length: 1 + Math.floor(next(r) * 3) }, () => {
    const part = pick(r, PARTS), artery = next(r) < 0.15, internal = part === 'torso' && next(r) < 0.3;
    return { part, kind: 'cut', name: `a gunshot wound in the ${part}`, ms: ms - 1000, until: ms + 3_600_000, bleed: next(r) < 0.8 ? ms + 600_000 : ms - 10, rate: Math.round(range(r, 0.2, 12) * 100) / 100,
      ...(artery ? { artery: true } : {}), ...(internal ? { internal: true } : {}), ...(next(r) < 0.15 ? { cared: 'dressing' } : {}), deep: true, gunshot: true };
  });
  return { v: BODY_V, tmpl: BODY_TMPL.m, fitness: 14, injuries, blood: 100, bloodMs: ms - 1000 };
}
// (an artery in the left arm and a cut beside it, bleeding from a second before ms)
const armWound = (ms0) => ({ v: BODY_V, tmpl: BODY_TMPL.m, fitness: 14, blood: 100, bloodMs: ms0 - 1000, injuries: [
  { part: 'armL', kind: 'cut', name: 'a bullet through an artery in the left arm', ms: ms0 - 1000, until: ms0 + 3_600_000, bleed: ms0 + 3_600_000, rate: 8, artery: true, deep: true, gunshot: true },
  { part: 'armL', kind: 'cut', name: 'a cut in the left forearm', ms: ms0 - 1000, until: ms0 + 3_600_000, bleed: ms0 + 3_600_000, rate: 1.2 }] });
const liveLane = () => {
  const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go', opfor: 'live' }), s = g.state;
  s.armoury.range.house.live.would = newLedger('real');
  if (s.stop?.mode !== 'stop') enterStop(s, g.bus, { via: 'ready' });
  return { g, s };
};

export default [
  {
    name: 'the row "Tourniquet" is offered exactly while tourniquetOf finds a limb (300 scripted wounds on your body, a real ledger): a limb bleeding 4 %/min or more or an artery, not cared, not internal; never on a \'wound\' lane',
    fn() {
      const { g, s } = liveLane(), pid = s.player.id, ms = s.clock.ms, r = stream(48213, 'collar-aid', 'offer');
      let agree = 0, offered = 0, wanted = 0;
      const bad = [];
      for (let i = 0; i < 300; i++) {
        s.people[pid].body = scripted(r, ms);
        const want = !!tourniquetOf(s.people[pid].body, ms), has = contactRows(s).some(x => x.id === 'contact:tourniquet');
        if (want === has) agree++; else bad.push(i);
        offered += has ? 1 : 0; wanted += want ? 1 : 0;
      }
      // (the panel's own read, on the last: the row there with its five parts and 25 s)
      s.people[pid].body = { v: BODY_V, tmpl: BODY_TMPL.m, fitness: 14, injuries: [{ part: 'armL', kind: 'cut', name: 'a gunshot wound in the left arm', ms: ms - 1000, until: ms + 3_600_000, bleed: ms + 600_000, rate: 6, deep: true, gunshot: true }], blood: 100, bloodMs: ms - 1000 };
      const row = stepsOf(s).find(x => x.id === 'contact:tourniquet');
      s.armoury.range.house.live.would = newLedger('wound');
      const onWound = realRows(s).length + contactRows(s).filter(x => x.id === 'contact:tourniquet').length;
      console.log(`      300 wounds: the row offered ${offered}, tourniquetOf ${wanted}, agreeing ${agree}; the panel's row ${row?.label} ${fmt((row?.ms ?? 0) / 1000)} s in ${row?.list?.length} parts (HARD_BLEED_PM ${HARD_BLEED_PM}); on a 'wound' lane ${onWound} rows`);
      assert(agree === 300 && wanted > 30 && wanted < 270, JSON.stringify({ agree, wanted, bad: bad.slice(0, 5) }));
      assert(row && row.ms === TQ_MS && row.list.length === TQ_PARTS && onWound === 0, JSON.stringify(row));
      void g;
    },
  },
  {
    name: 'the tourniquet done in five parts of 5 s stops the limb\'s bleeds and costs the hand −6 on Weapon handling, and is offered no more',
    heavy: true,
    fn() {
      const { g, s } = liveLane(), pid = s.player.id, ms0 = s.clock.ms;
      s.people[pid].body = armWound(ms0);
      const before = woundMods(s.people[pid].body, 'hands', ms0, { skill: 'weapons' }).reduce((a, m) => a + m.v, 0);
      assert(chooseStep(s, g.bus, { step: 'contact:tourniquet' }).ok, 'chosen');
      let n = 0;
      while (s.stop?.doing && n < 1000) { g.step(1); n++; }
      const body = s.people[pid].body, at = s.clock.ms, after = woundMods(body, 'hands', at, { skill: 'weapons' });
      console.log(`      done in ${fmt((n * 50) / 1000, 2)} s: ${body.injuries.map(i => `${i.name}: ${i.cared ?? 'not cared'}, bleeding ${i.bleed > at}`).join('; ')}; Weapon handling ${before} before, ${after.reduce((a, m) => a + m.v, 0)} after (${after.map(m => `${m.why} ${m.v}`).join(', ')}); offered again ${contactRows(s).some(x => x.id === 'contact:tourniquet')}`);
      assert(n * 50 >= TQ_MS && n * 50 <= TQ_MS + 100 && body.injuries.every(i => i.cared === 'tourniquet' && !(i.bleed > at)), JSON.stringify(body.injuries));
      assert(after.some(m => m.v === -6 && /tourniquet/.test(m.why)) && !contactRows(s).some(x => x.id === 'contact:tourniquet'), JSON.stringify(after));
    },
  },
  {
    name: 'the tourniquet cut by a cue: a take-in\'s window opened in its second part ends it at that part\'s end, the limb not cared, the row offered again',
    fn() {
      // (cut: a fresh wound, the tourniquet begun, a take-in's window opened in its second part)
      const { g: g2, s: s2 } = liveLane(), pid2 = s2.player.id;
      s2.people[pid2].body = armWound(s2.clock.ms);
      assert(chooseStep(s2, g2.bus, { step: 'contact:tourniquet' }).ok, 'chosen again');
      g2.step(130);
      const T = s2.armoury.range.turners.find(t => t.live), t1 = s2.clock.ms;
      noteContact(s2, { pending: { id: 99, ids: [T.key], seenMs: t1, untilMs: t1 + 400, ms: 400, expect: null, n: 1, grade: null, roll: null, parts: [], rangeM: 3, whoK: 1, armed: false, goMs: 235, mx: 0, mz: 0, run: false } });
      let m = 0, parts = 0;
      while (s2.stop?.doing?.step === 'contact:tourniquet' && m < 1000) { parts = s2.stop.doing.subs.length; g2.step(1); m++; }
      const b2 = s2.people[pid2].body;
      console.log(`      cut by a window opened at ${fmt((t1 - (t1 - 130 * 50)) / 1000, 1)} s: ended after ${parts} of ${TQ_PARTS} parts, at ${fmt(((130 + m) * 50) / 1000, 2)} s; cared ${b2.injuries.filter(i => i.cared).length}; offered again ${realRows(s2).some(x => x.id === 'contact:tourniquet')}`);
      assert(parts === 2 && !b2.injuries.some(i => i.cared) && realRows(s2).some(x => x.id === 'contact:tourniquet'), JSON.stringify({ parts, cared: b2.injuries.map(i => i.cared) }));
    },
  },
  {
    name: 'tourniquetOf and applyTourniquet on scripted NPC records: the worst limb (an artery first, then the rate), none for the torso, the head, a stopped bleed, a dressing\'s or the inside\'s; on, every bleed of that limb stopped at the moment and cared \'tourniquet\', nothing else touched',
    fn() {
      const ms = 1_000_000, inj = (part, rate, o = {}) => ({ part, kind: 'cut', name: `${part} ${rate}`, ms: ms - 5000, until: ms + 3_600_000, bleed: ms + 600_000, rate, deep: true, gunshot: true, ...o });
      const cases = [
        { name: 'a thigh at 6 and an arm artery at 5', injuries: [inj('legR', 6), inj('armL', 5, { artery: true })], want: 'armL 5' },
        { name: 'two arms, 4.5 and 7', injuries: [inj('armL', 4.5), inj('armR', 7)], want: 'armR 7' },
        { name: 'an arm at 3.9', injuries: [inj('armL', 3.9)], want: null },
        { name: 'the torso at 9', injuries: [inj('torso', 9)], want: null },
        { name: 'a thigh stopped', injuries: [inj('legL', 9, { bleed: ms - 1 })], want: null },
        { name: 'a thigh dressed', injuries: [inj('legL', 9, { cared: 'dressing' })], want: null },
        { name: 'the head at 12', injuries: [inj('head', 12)], want: null },
      ];
      const got = cases.map(c => { const rec = { v: BODY_V, tmpl: BODY_TMPL.m, fitness: 12, injuries: c.injuries, blood: 100, bloodMs: ms - 5000 }; return { ...c, rec, t: tourniquetOf(rec, ms) }; });
      const first = got[0], done = applyTourniquet(first.rec, first.t, ms), leg = first.rec.injuries.find(i => i.part === 'legR');
      console.log(`      ${got.map(c => `${c.name}: ${c.t?.name ?? 'none'}`).join('; ')}; on: ${done.length} stopped (${done.map(i => i.name).join(', ')}), the thigh ${leg.cared ?? 'untouched'}, blood anchored at ${first.rec.bloodMs === ms}`);
      assert(got.every(c => (c.t?.name ?? null) === c.want), JSON.stringify(got.map(c => [c.name, c.t?.name ?? null, c.want])));
      assert(done.length === 1 && done[0].cared === 'tourniquet' && done[0].bleed === ms && !leg.cared && leg.bleed > ms && first.rec.bloodMs === ms && tourniquetOf(first.rec, ms)?.part === 'legR', JSON.stringify(first.rec));
    },
  },
  {
    name: 'the corpsman\'s card (boardingCare): ours first, then theirs, two minutes each from the end, every outcome careOf then casualtyOutcome over 12 minutes on a copy, the bodies untouched',
    fn() {
      const w = boardingWorld({ room: 'cabin-2' }), s = w.s, man = w.men[0], gun = s.people[w.pid].kit.worn.sling, pgun = s.people[man.pid].kit.worn.sling, t0 = s.clock.ms;
      const hit = (on, by, g, id, part, zone, load) => wouldHave(s, strikeOf(s, { id, gun: g, atMs: t0, fired: true, load, part, zone, roll: { margin: 4 }, flight: { rangeM: 4 } }, { on, by }), null);
      // (a pirate's round in your arm, two in Four's thigh, your pair in the pirate's chest; his training carrier off: a holdout wears none)
      delete s.people[man.pid].kit.worn.carrier;
      hit(w.pid, man.T.key, pgun, 'ca1', 'arms', 'A', 'ball');
      hit(w.twoPid, man.T.key, pgun, 'ca2', 'legs', 'A', 'ball'); hit(w.twoPid, man.T.key, pgun, 'ca3', 'legs', 'A', 'ball');
      hit(man.pid, 'me', gun, 'ca4', 'torso', 'A', 'frangible'); hit(man.pid, 'me', gun, 'ca5', 'torso', 'A', 'frangible');
      const end = t0 + 3 * MIN_MS, snap = JSON.stringify(Object.fromEntries([w.pid, w.twoPid, man.pid].map(p => [p, s.people[p].body])));
      const card = boardingCare(s, end);
      const want = card.map(c => {
        const body = JSON.parse(JSON.stringify(s.people[c.pid].body));
        if (body.dead && body.dead.ms <= end) return 'killed';
        careOf(body, c.fromMs, { tier: 'corpsman' });
        return CARE_OUTCOME[casualtyOutcome(body, { fromMs: c.fromMs, evacMs: EVAC_MIN * MIN_MS }).outcome];
      });
      console.log(`      ${card.map(c => `#${c.n} ${c.side} ${c.pid === w.pid ? 'you' : c.pid === w.twoPid ? 'Four' : 'the pirate'}: ${c.where}, care ${c.care.join('+') || 'none'} at end + ${(c.fromMs - end) / 60_000} min, ${c.outcome} (${c.words})`).join('; ')}`);
      assert(card.length === 3 && card[0].pid === w.pid && card[1].pid === w.twoPid && card[2].pid === man.pid && card.map(c => c.side).join() === 'ours,ours,theirs', JSON.stringify(card.map(c => [c.pid, c.side])));
      assert(card.every((c, i) => c.fromMs === end + (i + 1) * CARE_EACH_MS) && card.every((c, i) => c.outcome === want[i]), JSON.stringify({ card: card.map(c => c.outcome), want }));
      assert(JSON.stringify(Object.fromEntries([w.pid, w.twoPid, man.pid].map(p => [p, s.people[p].body]))) === snap, 'the bodies untouched');
    },
  },
];
