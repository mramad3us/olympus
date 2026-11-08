// "Three bangs", test-pairs&setup=bangs (src/sim/scenarios/pairs.js; ROADMAP §4.2's 0.0.7c row, its first patch, shipped as v0.0.9; COMBAT §5.8, §25.18.3; the build sheet 0.0.9 §5.2): the pairs bot by its actions through the banged string, each sheet against its own calm run on the same seed, and the whole course to the card. The user, 2026-11-07: "Tier one operator would have such hardening, that having three flashbangs go off right next to him would barely affect his ability to operate his weapon, where a recruit would likely be so supressed that they would be even likely to fail simple actions like thumbing safety off or reloading."
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { pairsBot } from './bots/pairs.mjs';
import { pairsNow, bangsNow, paperText, BANGS, BANG_FELT } from '../src/sim/scenarios/pairs.js';
import { feltOf, bandOf, hardOf } from '../src/sim/combat/supp.js';
import { takeInWords } from '../src/sim/combat/react.js';
import { TEST_SHEETS } from '../src/sim/skills/templates.js';
import { checkIds } from './ids-check.mjs';

/** The sheets of the anchor (the build sheet §5.2): the boot recruit and the tier one in the quick suite, every sheet heavy. */
export const ANCHOR = Object.freeze(['recruit', 'tierone']), SHEETS = Object.freeze(['recruit', 'private', 'sgt', 'raider', 'tierone']);
/** The tier one's first round after the turn may be this much over his calm run on the seed (ms; the sheet's §5.2), his freeze this long in all. */
export const TIERONE_OVER_MS = 50, TIERONE_FROZE_MS = 100;
const s2 = (ms) => (ms === null || ms === undefined ? '-' : takeInWords(ms));
const SUB_ACTIONS = new Set(['reach', 'seat', 'release', 'magOut:drop', 'magOut:pouch']);

/**
 * The banged string (string 0) played by the pairs bot to its paper, from setup (bangs:standby, or standby:0 calm): the
 * bangs (their times from the standby, the felt and band at each and at the turn), the freeze, the take-in, the Off safe
 * tries ({ ok, mishap }), the turn to the first round, the challenges made (ms: a failed identification is a die, calm or
 * not), the paper and its record. Played on a fresh game; the bot's decisions are its own (a stall throws).
 */
export function bangedString({ seed, tier, calm = false, maxTicks = 20 * 60 * 3 } = {}) {
  const g = createGame({ scenario: 'test-pairs', seed, tier, setup: calm ? 'standby:0' : 'bangs:standby' }), s = g.state, pid = s.player.id, bot = pairsBot();
  const t0 = s.clock.ms, bangs = [], offSafe = [];
  let turnMs = null, feltTurn = null, firstMs = null, ticks = 0, challengeMs = 0;
  for (; ticks < maxTicks && !s.armoury.range.strs.some(x => x.k === BANGS.string); ticks++) {
    g.step(1, bot);
    for (const [type, d] of g.bus.events) {
      if (type === 'fx' && d.kind === 'bang') { const f = feltOf(s, pid, d.atMs); bangs.push({ id: d.id, atMs: d.atMs - t0, felt: f, band: bandOf(f) }); }
      if (type === 'range' && d.phase === 'turn' && turnMs === null) { turnMs = s.armoury.range.str.turnedMs; feltTurn = feltOf(s, pid, turnMs); }
      if (type === 'step' && d.phase === 'sub' && d.action === 'selector:semi') offSafe.push({ ok: d.ok !== false, grade: d.grade, mishap: d.mishap ?? null, felt: feltOf(s, pid, d.fromMs) });
      if (type === 'shot' && d.fired && firstMs === null && turnMs !== null) firstMs = d.atMs;
      if (type === 'step' && d.phase === 'sub' && d.action === 'contact:challenge' && firstMs === null) challengeMs += d.toMs - d.fromMs;
    }
    g.clearFacts();
  }
  const R = s.armoury.range, rec = R.strs.find(x => x.k === BANGS.string), B = bangsNow(s);
  return { g, s, R, rec, B, bangs, offSafe, turnMs: turnMs === null ? null : turnMs - t0, feltTurn, turnToFirstMs: firstMs === null || turnMs === null ? null : firstMs - turnMs, challengeMs, ticks, H: hardOf(s, pid) };
}

// (the steps of a whole course from its facts: Off safe's tries; the RELOADs (speed or keep the empty) by step, a halted
// one's "Carry on" counted with it)
function stepCounts(events) {
  const off = { tries: 0, fails: 0, drops: 0 }, tries = [];
  let cur = null;
  for (const [type, d] of events) {
    if (type !== 'step') continue;
    if (d.phase === 'start') { cur = /^macro:reload:(speed|retain)$/.test(d.step) ? (tries.push({ fail: false, drop: false }), tries.at(-1)) : d.step === 'queue' ? cur : null; continue; }
    if (d.phase !== 'sub') continue;
    if (d.action === 'selector:semi') { off.tries++; if (d.ok === false) off.fails++; if (d.mishap === 'dropped') off.drops++; }
    if (cur && SUB_ACTIONS.has(d.action)) { if (d.ok === false) cur.fail = true; if (d.mishap === 'dropMag') cur.drop = true; }
  }
  return { off, reload: { tries: tries.length, fails: tries.filter(t => t.fail).length, drops: tries.filter(t => t.drop).length } };
}
const pct = (a, b) => (b ? `${Math.round(100 * a / b)}%` : '-');
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
const p95 = (xs) => { const v = [...xs].sort((a, b) => a - b); return v[Math.min(v.length - 1, Math.ceil(0.95 * v.length) - 1)] ?? null; };

// (a sheet over the seeds, banged and calm: its table lines and its numbers)
function sheetRuns(tier, seeds) {
  const runs = seeds.map(seed => ({ seed, bang: bangedString({ seed, tier }), calm: bangedString({ seed, tier, calm: true }) }));
  for (const r of runs) {
    const { bang: b, calm: c } = r;
    assert(b.rec?.paper && c.rec?.paper, `${tier} ${r.seed}: the banged string to its paper ${JSON.stringify({ bang: b.rec?.done, calm: c.rec?.done })}`);
    assert(b.rec.paper === paperText({ takeInMs: b.rec.takeInMs, pauseToFirstMs: b.rec.pauseToFirstMs, splitsMs: b.rec.splitsMs, zones: b.rec.zones, bangs: b.rec.bangs.n, frozeMs: b.rec.bangs.frozeMs, offSafe: b.rec.bangs.offSafe }), `${tier} ${r.seed}: the paper is the record's: ${b.rec.paper}`);
    assert(!c.rec.bangs && !/BANGS/.test(c.rec.paper), `${tier} ${r.seed}: the calm paper as built: ${c.rec.paper}`);
    // (one quantity, one number (the runtime review of v0.0.9): the card's first round is the paper's TURN TO PAUSE + PAUSE TO FIRST,
    // and its sum is the chaos less the hardening)
    const sum = b.rec.takeInMs + b.rec.pauseToFirstMs, said = /first round (\d+\.\d\d) s after you saw him/.exec(b.B.summary)?.[1];
    assert(said === (sum / 1000).toFixed(2), `${tier} ${r.seed}: the card says ${said} s, the paper sums to ${sum} ms: ${b.B.summary} | ${b.rec.paper}`);
    const m = /the chaos (\d+) − hardening (\d+) \(\w+\) = felt (\d+)/.exec(b.B.summary);
    assert(m && Number(m[1]) - Number(m[2]) === Number(m[3]) && Number(m[2]) === b.H && Number(m[3]) === b.B.feltPeak, `${tier} ${r.seed}: the sum ${m?.[0]}: ${b.B.summary}`);
    assert(b.bangs.length === BANGS.n && b.bangs.every((x, i) => i === 0 || x.atMs - b.bangs[i - 1].atMs === BANGS.gapMs), `${tier} ${r.seed}: three bangs ${BANGS.gapMs} ms apart ${JSON.stringify(b.bangs)}`);
    assert(b.turnMs === b.bangs.at(-1).atMs + BANGS.turnMs, `${tier} ${r.seed}: the turn ${BANGS.turnMs} ms after the third (${b.turnMs} against ${b.bangs.at(-1).atMs})`);
  }
  return runs;
}
function printSheet(tier, runs) {
  const L = TEST_SHEETS[tier].label, b0 = runs[0].bang;
  const tt = runs.map(r => r.bang.turnToFirstMs).filter(x => x !== null), ct = runs.map(r => r.calm.turnToFirstMs).filter(x => x !== null), bk = runs.map(r => r.bang.B.calm?.turnToFirstMs).filter(x => Number.isFinite(x));
  const off = runs.flatMap(r => r.bang.offSafe), offN = runs.filter(r => r.bang.offSafe.some(o => !o.ok)).length;
  console.log(`      ${L} (H ${b0.H}) on ${runs.length} seeds:`);
  for (const r of runs) {
    const b = r.bang, c = r.calm;
    console.log(`        seed ${r.seed}: bangs at +${b.bangs.map(x => s2(x.atMs)).join(', +')} s (felt ${b.bangs.map(x => `${x.felt} ${x.band}`).join(' → ')}), turn +${s2(b.turnMs)} s at felt ${b.feltTurn} (${bandOf(b.feltTurn)}); froze ${s2(b.B.frozeMs)} s; take-in ${s2(b.rec.takeInMs)} (calm ${s2(c.rec.takeInMs)}); Off safe ${b.offSafe.map(o => (o.ok ? '✓' : o.mishap === 'dropped' ? '✗sling' : '✗')).join(' ') || 'in the row'}; turn to first ${s2(b.turnToFirstMs)} s (calm ${s2(c.turnToFirstMs)}, by the book ${s2(b.B.calm?.turnToFirstMs)})${b.challengeMs || c.challengeMs ? `; challenged ${s2(b.challengeMs)} s, calm ${s2(c.challengeMs)} s` : ''}`);
  }
  console.log(`        paper (seed ${runs[0].seed}): ${b0.rec.paper}`);
  console.log(`        card (seed ${runs[0].seed}): ${b0.B.summary}`);
  console.log(`        turn to first round: mean ${s2(mean(tt))} s, p95 ${s2(p95(tt))} s; the calm runs ${s2(mean(ct))} s, p95 ${s2(p95(ct))} (×${fmt(mean(tt) / mean(ct), 2)}); calm by the book ${s2(mean(bk))} s (×${fmt(mean(tt) / mean(bk), 2)})`);
  console.log(`        Off safe: ${off.length} tries, ${off.filter(o => !o.ok).length} failed (${pct(off.filter(o => !o.ok).length, off.length)}), ${off.filter(o => o.mishap === 'dropped').length} onto the sling; failed at least once on ${offN} of ${runs.length} seeds (${pct(offN, runs.length)})`);
  return { tt, ct, bk, off, offN };
}

export default [
  {
    name: 'the banged string, the boot recruit and the tier one on 8 seeds each against their calm runs: three bangs 1 s apart and the turn 2 s after the third, at the same times for both; the tier one\'s first round within 0.05 s of his calm run and of the book on every seed (a challenge for a failed identification, a die calm or not, taken out of both) and frozen 0.1 s at most; the recruit\'s at least twice his calm by the book on average and his Off safe failing at least once on 40% of the seeds or more (COMBAT §5.8; the user, 2026-11-07)',
    fn() {
      const seeds = [48213, 7, 99, 1, 2, 3, 5, 11], by = {};
      for (const tier of ANCHOR) by[tier] = sheetRuns(tier, seeds);
      const res = Object.fromEntries(ANCHOR.map(t => [t, printSheet(t, by[t])]));
      // (the same bangs at the same times for every sheet on a seed: the plan from the seed alone)
      for (let i = 0; i < seeds.length; i++) {
        const a = by.recruit[i].bang, b = by.tierone[i].bang;
        assert(JSON.stringify(a.bangs.map(x => [x.id, x.atMs])) === JSON.stringify(b.bangs.map(x => [x.id, x.atMs])) && JSON.stringify(a.R.bangs.plan.map(x => [x.x, x.z])) === JSON.stringify(b.R.bangs.plan.map(x => [x.x, x.z])), `seed ${seeds[i]}: the bangs differ between the sheets`);
      }
      // (like with like: a challenge made because a die failed his identification, in either run, taken out of both)
      for (const r of by.tierone) {
        const b = r.bang.turnToFirstMs - r.bang.challengeMs, c = r.calm.turnToFirstMs - r.calm.challengeMs;
        assert(r.bang.turnToFirstMs !== null && r.calm.turnToFirstMs !== null && b <= c + TIERONE_OVER_MS && b <= r.bang.B.calm.turnToFirstMs + TIERONE_OVER_MS, `the tier one on seed ${r.seed}: ${b} ms (less his challenges) against calm ${c}, by the book ${r.bang.B.calm.turnToFirstMs}`);
        assert(r.bang.B.frozeMs <= TIERONE_FROZE_MS && r.bang.B.feltPeak <= 19, `the tier one on seed ${r.seed}: froze ${r.bang.B.frozeMs} ms, felt ${r.bang.B.feltPeak}`);
      }
      // (the recruit against his calm by the book, as the card gives it (the sheet's §8 item 20; COMBAT §5.8's T14 2.64 s))
      const R = res.recruit;
      assert(mean(R.tt) >= 2 * mean(R.bk), `the recruit: ${mean(R.tt)} ms mean against calm by the book ${mean(R.bk)}`);
      assert(R.offN / seeds.length >= 0.4, `the recruit's Off safe failed on ${R.offN} of ${seeds.length} seeds`);
      assert(by.recruit.every(r => r.bang.B.feltPeak >= 90 && r.bang.B.band === 'pinned'), 'the recruit pinned');
    },
  },
  {
    name: 'a save made between the bangs, inside the startle and at the turn loads and plays on byte for byte with the run that never saved (TECH: state is plain data; the plan, the freeze and the steps under the bangs in the session)',
    fn() {
      const play = (g, ticks) => { const bot = pairsBot(); for (let n = 0; n < ticks; n++) { g.step(1, bot); g.clearFacts(); } };
      const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'recruit', setup: 'bangs:standby' }), s = g.state, bot = pairsBot(), saves = [];
      let n = 0, turnAt = null;
      for (; n < 20 * 60 * 2 && !s.armoury.range.strs.length; n++) {
        g.step(1, bot);
        const R = s.armoury.range, done = R.bangs.plan.filter(b => b.done).length;
        if (done === 1 && saves.length === 0) saves.push({ at: n, why: 'after the first bang', json: g.save() });
        if (done === 2 && saves.length === 1 && s.clock.ms >= R.bangs.plan[1].atMs + 250) saves.push({ at: n, why: 'in the startle, after the second', json: g.save() });
        if (R.str.turnedMs !== null && turnAt === null) { turnAt = n; saves.push({ at: n, why: 'at the turn', json: g.save() }); }
        g.clearFacts();
      }
      play(g, 40);
      const end = n + 40, ref = g.digest();
      for (const sv of saves) {
        const h = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'recruit', setup: 'bangs:standby' });
        h.load(sv.json);
        play(h, end - sv.at - 1);
        const same = h.digest() === ref && h.state.clock.ms === s.clock.ms;
        console.log(`      saved ${sv.why} (tick ${sv.at}): ${same ? 'the same digest and tick' : 'DIFFERS'} at tick ${end} (${h.digest()})`);
        assert(same, `${sv.why}: ${h.digest()} at ${h.state.clock.ms} against ${ref} at ${s.clock.ms}`);
      }
      console.log(`      the paper: ${s.armoury.range.strs[0].paper}`);
    },
  },
  {
    name: 'the whole course banged on seed 48213, the boot recruit and the tier one: the card reached with no bot stall, the paper of every string the record\'s (the calm strings as built), the bangs\' card, every round counted, every item held once; prints Off safe and RELOAD tries, failures and drops over the course and under the bangs',
    fn() { for (const tier of ANCHOR) courseOf(tier); },
  },
  {
    name: 'the banged string, every sheet on 40 seeds against its calm runs (heavy): each sheet\'s turn to the first round, freeze, take-in and Off safe; the private between the recruit and the tier one',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      const seeds = Array.from({ length: 40 }, (_, i) => (i === 0 ? 48213 : 1000 + i)), out = {};
      for (const tier of SHEETS) out[tier] = printSheet(tier, sheetRuns(tier, seeds));
      const m = (t) => mean(out[t].tt) / mean(out[t].bk);
      console.log(`      turn to first over calm by the book: ${SHEETS.map(t => `${TEST_SHEETS[t].label} ×${fmt(m(t), 2)}`).join(', ')}`);
      assert(m('recruit') >= m('private') && m('private') >= m('tierone'), 'the private between the recruit and the tier one');
    },
  },
  {
    name: 'the whole course banged on seed 48213 for every sheet (heavy): the card and the counts',
    heavy: true,
    timeoutMs: 600_000,
    fn() { for (const tier of SHEETS) courseOf(tier); },
  },
];

// (the whole course: to the card, its numbers printed and checked)
function courseOf(tier, seed = 48213) {
  const g = createGame({ scenario: 'test-pairs', seed, tier, setup: 'bangs' }), s = g.state, bot = pairsBot(), events = [];
  let n = 0;
  for (; n < 20 * 60 * 30 && !pairsNow(s).end; n++) {
    g.step(1, bot);
    for (const e of g.bus.events) if (e[0] === 'step' && (e[1].phase === 'sub' || e[1].phase === 'start')) events.push(e);
    g.clearFacts();
  }
  const P = pairsNow(s), R = s.armoury.range, c = stepCounts(events), B = P.bangs, rd = P.card.gun.rounds;
  console.log(`      ${TEST_SHEETS[tier].label}, seed ${seed}: ${P.summary}`);
  console.log(`        ${B.summary}`);
  for (const x of P.strs) console.log(`        string ${x.k}: "${x.paper}", ${x.done}`);
  console.log(`        the course: Off safe ${c.off.tries} tries, ${c.off.fails} failed, ${c.off.drops} onto the sling; RELOAD ${c.reload.tries} tries, ${c.reload.fails} failed, ${c.reload.drops} dropped the magazine`);
  console.log(`        under the bangs (felt ${BANG_FELT} or more): Off safe ${B.steps.offSafe.tries} / ${B.steps.offSafe.fails} / ${B.steps.offSafe.drops}, RELOAD ${B.steps.reload.tries} / ${B.steps.reload.fails} / ${B.steps.reload.drops}; failed: ${B.steps.failed.map(f => `${f.label} ${f.grade}${f.mishap ? ` (${f.mishap})` : ''} at felt ${f.felt}`).join(', ') || 'none'}`);
  console.log(`        faults ${R.faults.map(f => f.rule).join(', ') || 'none'}; rounds ${JSON.stringify(rd)}; ${n} ticks`);
  assert(P.end?.phase === 'clear', `${tier}: the card ${JSON.stringify(P.end)}`);
  assert(P.strs.length === 5 && P.strs.every(x => x.paper === paperText({ takeInMs: x.takeInMs, pauseToFirstMs: x.pauseToFirstMs, splitsMs: x.splitsMs, zones: x.zones, ...(x.bangs ? { bangs: x.bangs.n, frozeMs: x.bangs.frozeMs, offSafe: x.bangs.offSafe } : {}) })), `${tier}: the papers ${JSON.stringify(P.strs.map(x => x.paper))}`);
  assert(P.strs[0].bangs?.n === BANGS.n && P.strs.slice(1).every(x => !x.bangs && !/BANGS/.test(x.paper)), `${tier}: the bangs on string 0 alone`);
  assert(rd.issued === rd.fired + rd.held, `${tier}: rounds issued ${rd.issued} = fired ${rd.fired} + held ${rd.held}`);
  assert(B.plan.length === BANGS.n && B.plan.every(b => b.done), `${tier}: the plan ${JSON.stringify(B.plan)}`);
  const ids = checkIds(JSON.parse(g.save()), g.sim.domains);
  assert(!ids.invalid.length && !ids.dangling.length, JSON.stringify({ invalid: ids.invalid.slice(0, 5), dangling: ids.dangling.slice(0, 5) }));
  return { P, c };
}
