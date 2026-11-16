// OLYMPUS tests: the hunt of v0.0.18's planner findings, off the shoot house (the bays and the tower's lines), each failing
// without its fix.
//
//   - planner-1: on a cold line with no command row current (PRONE, CEASE FIRE, the police call) Fix named RELOAD, and pressing
//     it drew "Wait for the tower" and the fault 'ahead', or chambered a round after the show clear (shooting.js markFix asks
//     handling.js lineCold now: the house's cold rule there);
//   - planner-2: a ready rifle at a standby read Fix "Top up", and Top up with the fullest magazine already in stowed it and
//     reached it back, for ever (markFix marks Fire 'already so' on the bays too; drills.js offers Top up only where a spare is
//     believed fuller);
//   - planner-3: with nothing aimed Fix ignored the gun ("Nothing to fix, already so" over an empty chamber, the planner's 'no
//     rounds' never shown), and on safe with no rounds anywhere it read Off safe, two presses with nothing to fire (groups.js
//     shows Fire's fixWhy over any remedy; markFix marks the planner's Charge on a hot line);
//   - planner-4: a rifle swung onto its sling with its bolt locked at a hot standby read "Nothing to fix" (markFix marks Up);
//   - the review of the fix: Top up was still a no-op with a spare of a count unknown (the reach ranks an unknown below the
//     magazine stowed), and the P-12's GUN ▸ Top up in the shoot house stowed the ten and reached it back for ever (kit.js
//     topUpGains, the one rule for drills.js macrosFor, plan.js gunRows and bundle.js's reorg).
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { stepAct } from './bots/lib.mjs';
import { kdBot } from './bots/kd.mjs';
import { rangeBot } from './bots/range.mjs';
import { pairsBot } from './bots/pairs.mjs';
import { stressBot } from './bots/stress.mjs';
import { beliefOf, gunField } from '../src/sim/arms/firearms.js';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { modelOf } from '../src/sim/arms/groups.js';
import { pouchesOf, believedN, topUpGains } from '../src/sim/arms/kit.js';
import { planFor } from '../src/sim/arms/plan.js';

const choosing = (s) => s.stop?.mode === 'stop' && s.stop.phase === 'choose' && !s.stop.reflex;
const fixOf = (s) => modelOf(stepsOf(s)).core.fix;
const faults = (s) => (s.armoury?.range?.faults ?? []).map(f => f.rule);
// (a row pressed as the page sends it, then time run to the next choose)
function press(g, row) {
  g.step(1, { act: [stepAct(row.id, 'normal', row.target ?? null)] });
  for (let n = 0; n < 2000 && !choosing(g.state); n++) g.step(1);
}
// (the gun, its magazine and the pouches, in short)
function gunWords(s) {
  const gun = s.items[s.stop.gun], b = beliefOf(s, s.stop.gun);
  return `chamber ${gun.chamber ?? 'empty'}${gun.locked ? ' locked' : ''}, ${gun.mag ? `${gun.mag} ${s.items[gun.mag].n}` : 'no magazine'}, ${gunField(gun, 'mode')}; believed ${b.chamber}/${b.count ?? '?'}; pouches ${pouchesOf(s, s.stop.who).map(p => `${p.key} [${p.mags.map(id => s.items[id].n).join(',')}]`).join(' ')}`;
}
// (a game started and stepped to its first choose, time standing)
function atFirstChoose(opts) {
  const g = createGame({ ...opts, strict: false });
  for (let i = 0; i < 4000 && !choosing(g.state); i++) g.step(1);
  return g;
}

export default [
  {
    name: 'on the tower\'s cold lines with no command row current, Fix never brings a round up: at PRONE (the KD course\'s confirm and test-handling\'s mixed course), at CEASE FIRE on a bolt locked over an empty and at the police call after the show clear, Fix is never RELOAD, Charge or the bolt release, and pressing it draws no "ahead" and chambers nothing (the hunt of v0.0.18: RELOAD there, "Wait for the tower. You do nothing before the command.")',
    timeoutMs: 120_000,
    fn() {
      const cases = [
        ['KD confirm, PRONE', { scenario: 'test-range', seed: 9001, setup: 'confirm' }, kdBot, 20],
        ['KD from the brief, CEASE FIRE', { scenario: 'test-range', seed: 9004 }, kdBot, 561],
        ['test-handling mixed, PRONE', { scenario: 'test-handling', seed: 9003, hour: 9, setup: 'mixed' }, rangeBot, 84],
        ['KD from the brief, the police call', { scenario: 'test-range', seed: 9004 }, kdBot, 1589],
      ];
      const bad = [];
      for (const [what, opts, bot, ticks] of cases) {
        const g = createGame({ ...opts, strict: false }), s = g.state;
        g.step(ticks, bot());
        const R = s.armoury.range, f = fixOf(s), p = planFor(s, s.stop.who, s.stop.gun, 'fire', { purpose: null });
        const f0 = faults(s).filter(r => r === 'ahead').length;
        let after = 'not pressed (a stand-in)';
        if (!choosing(s) || R.hot || R.course === 'pairs') { bad.push(`${what}: the state this case pins was not reached (${s.stop?.phase}, hot ${R.hot})`); continue; }
        if (/^(macro:reload|macro:ready|charge|release)/.test(f.row?.id ?? '')) bad.push(`${what}: Fix ${f.row.id}`);
        if (f.row && f.row.kind !== 'stand') {
          press(g, f.row);
          after = `pressed: ${gunWords(s)}`;
          if (faults(s).filter(r => r === 'ahead').length > f0) bad.push(`${what}: Fix drew 'ahead'`);
          if (s.items[s.stop.gun].chamber === 'live') bad.push(`${what}: Fix chambered a round`);
        }
        console.log(`      ${what}: the tower's ${R.cmd?.id}, hot ${R.hot}; ${gunWords(s)}; the planner's way ${p.path?.join(', ') ?? p.none}; Fix "${f.row?.label}" ${f.row?.off ? `(${f.row.off})` : ''}; ${after}`);
      }
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'a ready rifle at test-pairs\' standby is Fix "Nothing to fix, already so", never Top up; Top up with a fuller magazine at hand seats it, and with the fullest already in it is no longer offered (the hunt of v0.0.18: Fix read Top up at 106 pauses of 12 pairs runs, and each press stowed the ten and reached it back, 3 s for nothing)',
    fn() {
      const g = createGame({ scenario: 'test-pairs', seed: 9001, tier: 'private', strict: false }), s = g.state;
      g.step(306, pairsBot());
      const before = gunWords(s), f = fixOf(s), top = stepsOf(s).find(r => r.id === 'macro:reload:tactical' && !r.off);
      console.log(`      the standby (${s.armoury.range.cmd?.id}, hot ${s.armoury.range.hot}): ${before}; Fix "${f.row?.label}" (${f.row?.off ?? '-'}); Top up ${top ? 'offered' : 'not offered'}`);
      assert(choosing(s) && gunField(s.items[s.stop.gun], 'chamber') === 'live', `the state this test pins was not reached: ${before}`);
      assert(f.row?.id === 'core:fix' && f.row.off === 'already so' && f.badge?.t === 'done', JSON.stringify(f.row));
      assert(top, 'Top up is offered with a fuller magazine at hand (ten against nine)');
      press(g, top);
      const n1 = s.items[s.items[s.stop.gun].mag].n, f1 = fixOf(s), top1 = stepsOf(s).find(r => r.id === 'macro:reload:tactical');
      console.log(`      after Top up: ${gunWords(s)}; Fix "${f1.row?.label}" (${f1.row?.off ?? '-'}); Top up ${top1 ? 'still offered' : 'not offered'}`);
      assert(n1 === 10 && !top1 && f1.row?.off === 'already so', JSON.stringify({ n1, top1: top1?.id, fix: f1.row?.id }));
    },
  },
  {
    name: 'on test-handling\'s hot line, an empty chamber over a magazine of five with a four in the pouch and nothing aimed is Fix Charge, and Top up (a four for a five) is not offered: Fix pressed brings a round up (the hunt of v0.0.18: Fix was Top up, a press that changed nothing, for ever)',
    fn() {
      const g = atFirstChoose({ scenario: 'test-handling', seed: 9001, hour: 9, setup: 'hot' }), s = g.state, gun = s.items[s.stop.gun];
      s.items[gun.mag].n = 5; delete gun.chamber; gun.mode = 'semi';
      gun.belief = { ...(gun.belief ?? {}), chamber: 'empty', count: 5, mode: 'semi' };
      for (const p of pouchesOf(s, s.stop.who)) for (const id of p.mags) { s.items[id].n = 4; s.items[id].belief = { ...(s.items[id].belief ?? {}), n: 4 }; }
      s.stop.aim = null;
      const f = fixOf(s), rows = stepsOf(s), top = rows.find(r => r.id === 'macro:reload:tactical'), fire = rows.find(r => r.id === 'fire');
      console.log(`      ${gunWords(s)}; Fire "${fire?.off ?? 'live'}"; Fix "${f.row?.label}" (${f.row?.id}); Top up ${top ? 'offered' : 'not offered'}`);
      assert(f.row?.id === 'charge' && !top, JSON.stringify({ fix: f.row?.id, top: top?.id }));
      press(g, f.row);
      assert(s.items[s.stop.gun].chamber === 'live', `after Fix: ${gunWords(s)}`);
    },
  },
  {
    name: 'with nothing aimed Fix follows the gun on the KD course\'s hot line: an empty chamber over a magazine of one is Charge, never "Nothing to fix, already so"; with no round anywhere it is the struck Fix with the planner\'s reason, never "already so" (the hunt of v0.0.18)',
    fn() {
      const g = atFirstChoose({ scenario: 'test-range', seed: 9003, setup: 'far' }), s = g.state, gun = s.items[s.stop.gun];
      s.items[gun.mag].n = 1; delete gun.chamber;
      gun.belief = { ...(gun.belief ?? {}), chamber: 'empty', count: 1 };
      s.stop.aim = null;
      const a = fixOf(s), fireA = stepsOf(s).find(r => r.id === 'fire');
      console.log(`      ${gunWords(s)}; Fire "${fireA?.off ?? 'live'}"; Fix "${a.row?.label}" (${a.row?.off ?? '-'})`);
      assert(s.armoury.range.hot && a.row?.id === 'charge', JSON.stringify({ hot: s.armoury.range.hot, fix: a.row?.id, off: a.row?.off }));
      // (no round anywhere: the magazine out and every pouch empty)
      s.items[gun.mag].n = 0; gun.mag = null; delete gun.mag;
      gun.belief = { ...gun.belief, mag: 'out', count: null };
      for (const p of pouchesOf(s, s.stop.who)) for (const id of p.mags) { s.items[id].n = 0; s.items[id].belief = { ...(s.items[id].belief ?? {}), n: 0 }; }
      const b = fixOf(s), fireB = stepsOf(s).find(r => r.id === 'fire');
      console.log(`      no round anywhere: ${gunWords(s)}; Fire "${fireB?.off}" (the planner: ${fireB?.fixWhy ?? '-'}); Fix "${b.row?.label}" (${b.row?.off ?? '-'}), badge ${b.badge?.t}`);
      assert(b.row?.kind === 'stand' && /^(no rounds|one magazine a string)$/.test(String(b.row.off)) && b.badge?.t === 'none', JSON.stringify(b.row));
    },
  },
  {
    name: 'at CEASE FIRE on the KD course with no round anywhere, on safe, Fix is the struck Fix "no rounds", never Off safe on a rifle with nothing to fire (the hunt of v0.0.18: Off safe, then "no rounds", two presses for nothing)',
    fn() {
      const g = createGame({ scenario: 'test-range', seed: 9001, setup: 'confirm', strict: false }), s = g.state;
      g.step(1412, kdBot());
      const f = fixOf(s), fire = stepsOf(s).find(r => r.id === 'fire');
      console.log(`      the tower's ${s.armoury.range.cmd?.id}: ${gunWords(s)}; Fire "${fire?.off}" (the planner: ${fire?.fixWhy ?? '-'}); Fix "${f.row?.label}" (${f.row?.off ?? '-'})`);
      assert(choosing(s) && fire?.fixWhy === 'no rounds', `the state this test pins was not reached: ${JSON.stringify({ phase: s.stop?.phase, why: fire?.fixWhy })}`);
      assert(f.row?.kind === 'stand' && f.row.off === 'no rounds' && f.badge?.t === 'none', JSON.stringify(f.row));
    },
  },
  {
    name: 'on "Bang"\'s standby a rifle swung onto its sling with its bolt locked over a magazine of six is Fix Rifle up, never "Nothing to fix" (the hunt of v0.0.18: the boot recruit on seed 9012, the planner\'s way Up then the bolt release)',
    fn() {
      const g = createGame({ scenario: 'test-stress', seed: 9012, tier: 'recruit', strict: false }), s = g.state;
      g.step(2707, stressBot());
      const f = fixOf(s), p = planFor(s, s.stop.who, s.stop.gun, 'fire', { purpose: null }), carry = s.people[s.stop.who].kit.carry?.posture;
      console.log(`      the coach's ${s.armoury.range.cmd?.id}, hot ${s.armoury.range.hot}; ${carry}; ${gunWords(s)}; the planner's way ${p.path?.join(', ')}; Fix "${f.row?.label}"`);
      assert(choosing(s) && /^slung/.test(carry ?? '') && s.items[s.stop.gun].locked, `the state this test pins was not reached: ${carry}`);
      assert(f.row?.id === 'up', JSON.stringify(f.row));
    },
  },
  {
    name: 'Top up is never offered where the reach would take the magazine just stowed: on test-pairs\' standby after one Top up (ten in, nine and two in the pouches) the two\'s count made unknown (as a fumble or a drop leaves it) offers no Top up; with the count in unknown and a nine known at hand it is offered (the review of the hunt of v0.0.18\'s fix: three presses of 2.75 to 3.3 s each, nothing changed, the row offered after every one)',
    fn() {
      const g = createGame({ scenario: 'test-pairs', seed: 9001, tier: 'private', strict: false }), s = g.state;
      g.step(306, pairsBot());
      const top = () => stepsOf(s).find(r => r.id === 'macro:reload:tactical' && !r.off);
      assert(top(), `Top up is offered at the standby (ten against nine): ${gunWords(s)}`);
      press(g, top());
      const gun = s.items[s.stop.gun], two = pouchesOf(s, s.stop.who).flatMap(p => p.mags).find(id => s.items[id].n === 2);
      assert(s.items[gun.mag].n === 10 && two, `the state this test pins was not reached: ${gunWords(s)}`);
      delete s.items[two].belief.n;
      const t1 = top(), g1 = topUpGains(s, s.stop.who, s.stop.gun);
      console.log(`      ten in, the two's count unknown: ${gunWords(s)}; Top up ${t1 ? 'offered' : 'not offered'}; topUpGains ${g1}`);
      assert(!t1 && !g1, JSON.stringify({ top: t1?.id, gains: g1 }));
      // (the other way: the count in unknown ranks between an empty and one, so a nine known at hand is a real change)
      delete gun.belief.count;
      const t2 = top();
      console.log(`      the count in unknown, a nine known in a pouch: Top up ${t2 ? 'offered' : 'not offered'}`);
      assert(t2, `Top up with the count in unknown and a nine known at hand: ${gunWords(s)}`);
      const was = gun.mag;
      press(g, t2);
      assert(s.items[s.stop.gun].mag !== was && s.items[s.items[s.stop.gun].mag].n === 9, `Top up seated the nine: ${gunWords(s)}`);
    },
  },
  {
    name: 'in the shoot house the P-12\'s GUN ▸ "P-12: Top up" seats the ten for the nine once, then is no longer offered (the review of the hunt of v0.0.18\'s fix: the tier one on 48213 at the first choose, every press after the first stowed the ten and reached it back, 3 s, offered for ever)',
    fn() {
      const g = atFirstChoose({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go' }), s = g.state;
      const pid = s.player.id, holster = s.people[pid].kit.worn?.holster, p12 = s.items[holster];
      const words = () => `P-12 ${p12.mag}:${s.items[p12.mag]?.n}; ${pouchesOf(s, pid).map(p => `${p.key} [${p.mags.map(id => s.items[id].n).join(',')}]`).join(' ')}`;
      const row = () => stepsOf(s).find(r => r.id === 'weapon:other:topup' && !r.off);
      console.log(`      the first choose: ${words()}; the P-12's Top up ${row() ? `"${row().label}" ${row().ms} ms` : 'not offered'}`);
      assert(choosing(s) && p12 && s.items[p12.mag]?.n === 9 && row(), `the state this test pins was not reached: ${words()}`);
      press(g, row());
      const r1 = row();
      console.log(`      after one press: ${words()}; the P-12's Top up ${r1 ? 'still offered' : 'not offered'}`);
      assert(s.items[p12.mag]?.n === 10 && !r1, JSON.stringify({ n: s.items[p12.mag]?.n, row: r1?.id }));
    },
  },
  {
    name: 'Top up\'s one rule (kit.js topUpGains) by the kinds and the counts, on test-handling\'s hot line: a fuller spare gains, a ball four for a known tracer five gains, a four of ball for a five of a kind unsaid does not, a tracer ten for a five of a kind unsaid does not (the reach would take the five back), a spare of a count unknown for a known five does not, and the drills\' Top up and the rule agree on every one',
    fn() {
      const g = atFirstChoose({ scenario: 'test-handling', seed: 9001, hour: 9, setup: 'hot' }), s = g.state, gun = s.items[s.stop.gun];
      const spares = pouchesOf(s, s.stop.who).flatMap(p => p.mags);
      const cases = [
        ['a ball six at hand, five in', { count: 5 }, [{ n: 6, kind: 'ball' }, { n: 4, kind: 'ball' }], true],
        ['a ball four at hand, a tracer five in', { count: 5, load: 'tracer' }, [{ n: 4, kind: 'ball' }, { n: 4, kind: 'ball' }], true],
        ['a ball four at hand, five of a kind unsaid in', { count: 5 }, [{ n: 4, kind: 'ball' }, { n: 4, kind: 'ball' }], false],
        ['a tracer ten at hand, five of a kind unsaid in', { count: 5 }, [{ n: 10, kind: 'tracer' }, { n: 0, kind: 'ball' }], false],
        ['a count unknown at hand, five in', { count: 5 }, [{ kind: 'ball' }, { n: 2, kind: 'ball' }], false],
        ['a ball five at hand, the count in unknown', {}, [{ n: 5, kind: 'ball' }, { n: 2, kind: 'ball' }], true],
        ['a ball five at hand, the magazine in empty and one up the spout (Top up there the pairs course\'s only)', { count: 0 }, [{ n: 5, kind: 'ball' }, { n: 0, kind: 'ball' }], true],
      ];
      const bad = [];
      for (const [what, belief, mags, want] of cases) {
        gun.belief = { chamber: 'live', ...belief };
        spares.forEach((id, i) => { const m = mags[i] ?? { n: 0 }; s.items[id].n = m.n ?? 3; s.items[id].belief = { ...(m.n !== undefined ? { n: m.n } : {}), ...(m.kind ? { kind: m.kind } : {}) }; });
        const got = topUpGains(s, s.stop.who, s.stop.gun), offered = stepsOf(s).some(r => r.id === 'macro:reload:tactical');
        console.log(`      ${what}: topUpGains ${got}, Top up ${offered ? 'offered' : 'not offered'}`);
        if (got !== want || (offered !== want && belief.count !== 0)) bad.push({ what, got, offered, want });
      }
      assert(!bad.length, JSON.stringify(bad));
    },
  },
];
