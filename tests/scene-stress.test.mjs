// test-stress, "Bang" (src/sim/scenarios/stress.js on pairs.js's engine; ROADMAP §4.2's 0.0.7c row, its second patch, shipped as v0.0.10; COMBAT §5, §25.18.3; the build sheet 0.0.10 §5.2): the stress bot by its actions through the five strings (calm, the din, a bang called, three bangs, three bangs and the RELOAD with a second turner), each sheet's chaos and hands by string. The user, 2026-11-07: "Tier one operator would have such hardening, that having three flashbangs go off right next to him would barely affect his ability to operate his weapon, where a recruit would likely be so supressed that they would be even likely to fail simple actions like thumbing safety off or reloading."
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { stressBot } from './bots/stress.mjs';
import { pairsNow, paperText } from '../src/sim/scenarios/pairs.js';
import { stressNow, recOf, NOISE_WORDS, RELOAD_STRING } from '../src/sim/scenarios/stress.js';
import { hardOf } from '../src/sim/combat/supp.js';
import { takeInWords } from '../src/sim/combat/react.js';
import { TEST_SHEETS } from '../src/sim/skills/templates.js';
import { checkIds } from './ids-check.mjs';

/** The quick suite's sheets (the anchor's two ends) and every sheet the picker offers, by hardening. */
export const ANCHOR = Object.freeze(['recruit', 'tierone']), SHEETS = Object.freeze(['recruit', 'private', 'sgt', 'raider', 'tierone']);
/** The quick seeds (8) and the heavy ones (40). */
export const SEEDS = Object.freeze([48213, 7, 99, 1, 2, 3, 5, 11]), SEEDS40 = Object.freeze(Array.from({ length: 40 }, (_, i) => (i === 0 ? 48213 : 2000 + i)));
/** The tier one's freeze in all on any string, at most (ms; COMBAT §5.8's anchor). */
export const TIERONE_FROZE_MS = 100;
const s2 = (ms) => (ms === null || ms === undefined ? '-' : takeInWords(ms));
const pct = (a, b) => (b ? `${Math.round(100 * a / b)}%` : '-');
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const sum = (xs) => xs.reduce((a, b) => a + b, 0);

/**
 * The whole course played by the stress bot to its card (a stall throws): the card (pairsNow, stressNow), the noise as it
 * went off ({ k, kind, ms } from the noise's plan, ms after it was made: the same for every sheet on a seed), the turns, the
 * faults, the id walk. bot: a bot for tests/game.mjs (the stress bot by default).
 */
export function courseRun({ seed, tier, bot = stressBot(), maxTicks = 20 * 60 * 30 } = {}) {
  const g = createGame({ scenario: 'test-stress', seed, tier }), s = g.state, noise = [];
  let n = 0;
  for (; n < maxTicks && !pairsNow(s).end; n++) {
    g.step(1, bot);
    for (const [type, d] of g.bus.events) {
      if (type !== 'fx' || !['horn', 'blank', 'bang'].includes(d.kind) || (d.kind === 'horn' && d.phase !== 'on')) continue;
      const k = Number(String(d.key ?? d.id).split(':')[1]), rec = recOf(s.armoury.range, k);
      noise.push({ k, kind: d.kind, ms: d.atMs - (rec?.plannedAtMs ?? d.atMs), attempt: rec?.attempt ?? 0 });
    }
    g.clearFacts();
  }
  const P = pairsNow(s), Z = stressNow(s), R = s.armoury.range;
  return { g, s, P, Z, R, noise, ticks: n, H: hardOf(s, s.player.id), faults: R.faults.map(f => f.rule), ids: checkIds(JSON.parse(g.save()), g.sim.domains), mem: g.me().bot ?? {} };
}

// (one run's checks, the same on every seed and sheet: the card, the papers the records', the rounds, the ids, no bot fault)
function checkRun(r, tag) {
  const { P, Z } = r, rd = P.card.gun.rounds;
  assert(P.end && ['clear', 'stopped'].includes(P.end.phase), `${tag}: the card ${JSON.stringify(P.end)}`);
  assert(!r.faults.includes('slow') && !r.faults.includes('point'), `${tag}: a fault of the bot's ${r.faults.join(', ')}`);
  for (const x of P.strs) {
    const p = paperText({ takeInMs: x.takeInMs, pauseToFirstMs: x.pauseToFirstMs, splitsMs: x.splitsMs, zones: x.zones, ...(x.stress ? { noise: x.stress.noise, blanks: x.stress.blanks, blanksPlan: x.stress.blanksPlan, bangs: x.stress.bangs, frozeMs: x.stress.frozeMs, offSafe: x.stress.offSafe, reload: x.stress.reload, secondMs: x.stress.secondMs } : {}) });
    assert(!x.paper || x.paper === p, `${tag} string ${x.k}: the paper "${x.paper}" is not the record's "${p}"`);
  }
  assert(rd.issued === rd.fired + rd.held, `${tag}: rounds issued ${rd.issued} = fired ${rd.fired} + held ${rd.held}`);
  assert(!r.ids.invalid.length && !r.ids.dangling.length, `${tag}: ${JSON.stringify({ invalid: r.ids.invalid.slice(0, 3), dangling: r.ids.dangling.slice(0, 3) })}`);
  assert(Z.strings.length === (P.end.phase === 'clear' ? 5 : Z.strings.length), `${tag}: five strings on the card`);
}

// (a string's line for the table)
function stringLine(x, rec) {
  const L = x.reload, off = rec?.offSafe ?? [];
  return `${x.k + 1} ${x.name.padEnd(6)} felt ${String(x.feltTurn ?? '-').padStart(2)} at the turn, peak ${String(x.feltPeak).padStart(2)} ${x.band}; froze ${s2(x.frozeMs)}; take-in ${s2(x.takeInMs)}; Off safe ${off.length ? off.map(ok => (ok ? '✓' : '✗')).join(' ') : 'in the aim'}`
    + `; fumbles ${x.fumbles.fails}/${x.fumbles.tries}${x.fumbles.drops ? ` (${x.fumbles.drops} drop)` : ''}${L ? `; RELOAD ${s2(L.ms)} s, ${L.tries} tries, ${L.fails} failed, ${L.drops} dropped` : ''}`
    + `; Breathe ${x.breathe.n}${x.breathe.n ? ` (${s2(x.breathe.ms)} s, shed ${fmt(x.breathe.shedPts, 1)})` : ''}; first round ${s2(x.turnToFirstMs)} s from the turn, ${s2(x.seenToFirstMs)} from the sighting (calm by the book ${s2(x.calmSeenToFirstMs)})`
    + `${x.second ? `; second take-in ${s2(x.second.takeInMs)}, first round ${s2(x.second.seenToFirstMs)}` : ''}; inoculation ${x.inoc?.would ? 'would count' : x.inoc?.why ?? '-'}`;
}

// (a sheet over the seeds: the runs, each checked, and the sums by string)
function sheetRuns(tier, seeds) {
  const runs = seeds.map(seed => ({ seed, ...courseRun({ seed, tier }) }));
  for (const r of runs) checkRun(r, `${tier} ${r.seed}`);
  const by = [0, 1, 2, 3, 4].map(k => {
    const xs = runs.map(r => r.Z.strings.find(x => x.k === k)).filter(Boolean);
    return { k, n: xs.length, tries: sum(xs.map(x => x.fumbles.tries)), fails: sum(xs.map(x => x.fumbles.fails)), drops: sum(xs.map(x => x.fumbles.drops)),
      rTries: sum(xs.map(x => x.reload?.tries ?? 0)), rFails: sum(xs.map(x => x.reload?.fails ?? 0)), rDrops: sum(xs.map(x => x.reload?.drops ?? 0)),
      first: xs.map(x => x.turnToFirstMs).filter(Number.isFinite), felt: xs.map(x => x.feltPeak), feltTurn: xs.map(x => x.feltTurn).filter(Number.isFinite),
      froze: xs.map(x => x.frozeMs), breathe: sum(xs.map(x => x.breathe.n)), shed: sum(xs.map(x => x.breathe.shedPts)) };
  });
  return { runs, by };
}
function printSheet(tier, { runs, by }, { every = false } = {}) {
  const r0 = runs[0];
  console.log(`      ${TEST_SHEETS[tier].label} (H ${r0.H}, ${r0.Z.word}) on ${runs.length} seeds:`);
  for (const b of by) {
    console.log(`        ${b.k + 1} ${NOISE_WORDS[r0.Z.strings[b.k]?.name ?? ''] ?? '-'}: felt at the turn ${fmt(mean(b.feltTurn), 1)}, peak ${fmt(mean(b.felt), 1)} (${Math.min(...b.felt)} to ${Math.max(...b.felt)}); froze ${s2(mean(b.froze))} s mean, ${s2(Math.max(...b.froze))} at most; fumbles ${b.fails}/${b.tries} (${pct(b.fails, b.tries)}), ${b.drops} drops`
      + `${b.rTries ? `; RELOAD ${b.rFails}/${b.rTries} tries failed (${pct(b.rFails, b.rTries)}), ${b.rDrops} dropped` : ''}; first round ${s2(mean(b.first))} s from the turn; Breathe ${b.breathe} (shed ${fmt(b.shed, 1)})`);
  }
  for (const r of every ? runs : runs.slice(0, 1)) {
    console.log(`        seed ${r.seed}: ${r.P.end.phase}${r.P.end.why ? ` (${r.P.end.why})` : ''}, ${r.ticks} ticks; faults ${r.faults.join(', ') || 'none'}; Breathe pressed ${r.mem.breathed ?? 0}`);
    const nz = (k) => r.noise.filter(e => e.k === k);
    for (const x of r.Z.strings) {
      const ev = nz(x.k), first = ev[0], kinds = [...new Set(ev.map(e => e.kind))];
      console.log(`          ${stringLine(x, recOf(r.R, x.k))}`);
      if (ev.length) console.log(`            noise: ${kinds.map(kd => `${ev.filter(e => e.kind === kd).length} ${kd}`).join(', ')} from +${s2(first.ms)} to +${s2(ev.at(-1).ms)} s after the arming (attempt ${first.attempt})`);
      console.log(`            paper: ${x.paper ?? '-'}`);
    }
    console.log(`          card: ${r.Z.summary}`);
    console.log(`          the course: ${r.P.summary}`);
  }
}
// (the noise as heard, by string, attempt 0: the same on a seed for every sheet, up to the string's end (the coach stops when
// it ends, so a quicker shooter hears the din's first blanks only: the one list then the other's beginning))
function sameNoise(a, b) {
  for (let k = 0; k < 5; k++) {
    const x = a.noise.filter(e => e.k === k && e.attempt === 0).map(e => `${e.kind}@${e.ms}`), y = b.noise.filter(e => e.k === k && e.attempt === 0).map(e => `${e.kind}@${e.ms}`);
    const n = Math.min(x.length, y.length);
    if (x.slice(0, n).join() !== y.slice(0, n).join()) return false;
  }
  return true;
}

// (the anchor's asserts on a sheet's sums (the sheet's §5.2): the recruit failing more under the noise, his RELOAD, his first round)
function recruitChecks(by, { reloadFail }) {
  const calm = by[0], noisy = by.slice(1), rate = (b) => (b.tries ? b.fails / b.tries : 0);
  const nT = sum(noisy.map(b => b.tries)), nF = sum(noisy.map(b => b.fails)), noisyRate = nT ? nF / nT : 0;
  console.log(`      the recruit's fumbles: calm ${calm.fails}/${calm.tries} (${pct(calm.fails, calm.tries)}), strings 2 to 5 ${nF}/${nT} (${pct(nF, nT)}); his RELOAD on string 5 ${by[4].rFails}/${by[4].rTries} (${pct(by[4].rFails, by[4].rTries)}); first round on strings 4 and 5 ×${fmt(mean(by[3].first) / mean(calm.first), 2)} and ×${fmt(mean(by[4].first) / mean(calm.first), 2)} calm's`);
  assert(noisyRate > 0 && noisyRate >= 1.5 * rate(calm), `the recruit fails more under the noise: ${noisyRate} against calm ${rate(calm)}`);
  assert(by[4].rTries && by[4].rFails / by[4].rTries >= reloadFail, `the recruit's RELOAD fails ${by[4].rFails} of ${by[4].rTries} tries (at least ${reloadFail})`);
  assert(mean(by[3].first) >= 1.5 * mean(calm.first) && mean(by[4].first) >= 1.5 * mean(calm.first), `his first round on strings 4 and 5: ${mean(by[3].first)}, ${mean(by[4].first)} against calm ${mean(calm.first)}`);
}
function tieroneChecks({ runs, by }) {
  for (const r of runs) for (const x of r.Z.strings) {
    assert(x.feltPeak === 0 && x.frozeMs <= TIERONE_FROZE_MS, `the tier one on seed ${r.seed} string ${x.k + 1}: felt ${x.feltPeak}, froze ${x.frozeMs} ms`);
    assert(x.fumbles.failed.every(f => f.felt === 0), `the tier one's fumbles at felt 0 (his calm dice): ${JSON.stringify(x.fumbles.failed)}`);
  }
  console.log(`      the tier one: felt 0 and frozen ${TIERONE_FROZE_MS / 1000} s at most on every string of every seed; his fumbles ${sum(by.map(b => b.fails))}/${sum(by.map(b => b.tries))}, RELOAD ${by[4].rFails}/${by[4].rTries}, every one rolled at felt 0 (calm's dice)`);
}

export default [
  {
    name: 'the stress bot by its actions, the boot recruit and the tier one on 8 seeds: every run to its card with no bot fault, the papers the records\', the noise at the same times for both on a seed; the tier one at felt 0 on every string (frozen 0.1 s at most); the recruit failing more on strings 2 to 5 than on the calm one (at least 1.5 ×), his RELOAD on string 5 failing 40% of its tries or more, his first round on strings 4 and 5 at least 1.5 × the calm one\'s (COMBAT §5; the user, 2026-11-07)',
    heavy: true,   // (a whole-course or many-roll run: out of the quick suite, which is held to 60 s; it runs in the full suite and every release)
    timeoutMs: 600_000,
    fn() {
      const out = Object.fromEntries(ANCHOR.map(t => [t, sheetRuns(t, SEEDS)]));
      for (const t of ANCHOR) printSheet(t, out[t]);
      for (let i = 0; i < SEEDS.length; i++) {
        const a = out.recruit.runs[i], b = out.tierone.runs[i];
        assert(sameNoise(a, b), `seed ${SEEDS[i]}: the noise differs between the sheets`);
        for (const x of a.Z.strings) { const y = b.Z.strings.find(z => z.k === x.k); assert(!y || x.feltPeak >= y.feltPeak, `seed ${SEEDS[i]} string ${x.k + 1}: felt rose with hardening (${x.feltPeak} < ${y?.feltPeak})`); }
      }
      recruitChecks(out.recruit.by, { reloadFail: 0.4 });
      tieroneChecks(out.tierone);
    },
  },
  {
    name: 'the whole course on seed 48213, the boot recruit and the tier one, every string printed: the noise\'s times, felt at the turn and its peak, the freeze, the take-in, Off safe and the RELOAD, Breathe, the first round against calm by the book, the second turner\'s take-in, the paper, the card, the inoculation\'s "would count"',
    fn() {
      for (const t of ANCHOR) {
        const r = { seed: 48213, ...courseRun({ seed: 48213, tier: t }) };
        checkRun(r, `${t} 48213`);
        printSheet(t, { runs: [r], by: [] }, { every: true });
        console.log(`        inoculation: ${JSON.stringify(r.Z.inoc)}; the session's record ${JSON.stringify(r.R.stress.inoc)}`);
        const s5 = r.Z.strings.find(x => x.k === RELOAD_STRING);
        assert(s5?.second && s5.reload && /RELOAD .* · SECOND /.test(s5.paper ?? ''), `${t}: string 5's RELOAD and second turner ${JSON.stringify(s5)}`);
        assert(r.Z.inoc.fixed && r.R.stress.inoc.every(x => !x.counted), `${t}: a test sheet's counter never moves ${JSON.stringify(r.R.stress.inoc)}`);
      }
    },
  },
  {
    name: 'every sheet on 40 seeds (heavy): each sheet\'s chaos and hands by string; felt never rising with hardening; the tier one at felt 0, his rolls calm\'s; the recruit\'s RELOAD on string 5 failing 55% of its tries or more',
    heavy: true,
    timeoutMs: 1_800_000,
    fn() {
      const out = Object.fromEntries(SHEETS.map(t => [t, sheetRuns(t, SEEDS40)]));
      for (const t of SHEETS) printSheet(t, out[t]);
      const order = [...SHEETS].sort((a, b) => out[a].runs[0].H - out[b].runs[0].H);
      for (let i = 0; i < SEEDS40.length; i++) {
        for (let j = 1; j < order.length; j++) {
          const lo = out[order[j - 1]].runs[i], hi = out[order[j]].runs[i];
          assert(sameNoise(lo, hi), `seed ${SEEDS40[i]}: the noise differs between ${order[j - 1]} and ${order[j]}`);
          for (const x of lo.Z.strings) { const y = hi.Z.strings.find(z => z.k === x.k); assert(!y || x.feltPeak >= y.feltPeak, `seed ${SEEDS40[i]} string ${x.k + 1}: ${order[j]} felt more than ${order[j - 1]}`); }
        }
      }
      console.log(`      the RELOAD on string 5 by sheet: ${SHEETS.map(t => `${TEST_SHEETS[t].label} ${out[t].by[4].rFails}/${out[t].by[4].rTries} (${pct(out[t].by[4].rFails, out[t].by[4].rTries)})`).join(', ')}`);
      recruitChecks(out.recruit.by, { reloadFail: 0.55 });
      tieroneChecks(out.tierone);
    },
  },
];
