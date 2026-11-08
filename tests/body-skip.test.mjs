// body-skip: lived against skipped, and the advance's exact composition (BODY §2.6, §25; TIME §5.5; the
// build sheet 0.0.4 §5.1, §8 item 8). A shower, a night, a 15-minute wait and the whole reference sol,
// advanced tick by tick (50 ms, that tick's load, stamina stepped as the fast layer steps it) against
// skipped (a call a segment) and against the same split at 1,000 random whole seconds: composition to
// 1e-9 relative; lived against skipped within BODY §25's and TIME §5.5's tolerances (energy and water 1%,
// 5 kcal, 0.01 L; the bladder 5 mL, the bowel 1 g, grime 0.5, pressure 0.05 h, stamina 0.5; 0.0.6's hands 0.5
// and hair 0.01 h, the build sheet 0.0.6 §5.2). Both bodies
// and their differences printed. nextCrossings against stepping second by second: equal, to the
// second. And in the game: fifteen minutes lived at 20 Hz (the fast layer's live mix, synced each
// minute) against the same fifteen minutes stepped by the slow layer as an outcome skip steps them;
// and a save taken mid-minute carries on byte for byte.
import { assert, fmt } from './helpers.mjs';
import { templateBody, runSols, weekOf, MELAS_LON, lastReveille, STAGE_TEST, MELAS_PLACE } from './bots/sol.mjs';
import { createGame } from './game.mjs';
import { START_MS } from '../src/data/setting/calendar.js';
import { marsTimeText, msAtMarsTime } from '../src/core/calendar.js';
import { HOUR_MS, MIN_MS, SEC_MS, TICK_MS } from '../src/core/clock.js';
import { popDue } from '../src/core/queue.js';
import { playerId } from '../src/core/ids.js';
import { bodyAdvance, rowSeg, nextCrossings, ceilSec, bodyOf, bodySync, solPlan, LEDGERS } from '../src/sim/body/body.js';
import { REFERENCE_SOL } from '../src/data/body/sol.js';
import { massOf } from '../src/sim/body/energy.js';
import { stagesOf } from '../src/sim/body/cues.js';
import { copy } from '../src/sim/body/record.js';

const T = (ms) => marsTimeText(ms, MELAS_LON);
const REV = lastReveille(START_MS, MELAS_LON);
const SOLS = () => weekOf(REV, MELAS_LON, 1).slice(0, 2);
const PLAN = solPlan(REFERENCE_SOL, REV, MELAS_LON);
const at = (what) => PLAN.find(s => s.row.what === what).fromMs;

// (the ledgers compared, their tolerances lived against skipped, and a scale for the relative check)
const LEDGER = [
  ['gut kcal', b => b.energy.gutKcal, 5, 1000], ['reserve kcal', b => b.energy.reserveKcal, 5, 1000], ['emptyH', b => b.energy.emptyH, 0.01, 1],
  ['gut L', b => b.water.gutL, 0.01, 1], ['balance L', b => b.water.balanceL, 0.01, 1], ['bladder mL', b => b.bladder.ml, 5, 100], ['bowel g', b => b.bowel.g, 1, 100],
  ['transit g', b => b.bowel.transitG, 1, 100], ['grime', b => b.hygiene.grime, 0.5, 10], ['stubble h', b => b.hygiene.stubbleH, 0.01, 1],
  ['pressure h', b => b.sleep.pressureH, 0.05, 1], ['core °C', b => b.thermal.coreC, 0.05, 1], ['stamina', b => b.stamina, 0.5, 10], ['stress', b => b.stress.v, 0.5, 10],
  // (0.0.6: the hands' dirt, grime's tolerance, and the hair's hours since the cut, the stubble's: the build sheet 0.0.6 §5.2)
  ['hands', b => b.hands.dirt, 0.5, 10], ['hair h', b => b.hair.h, 0.01, 1],
];
const diffs = (a, b) => LEDGER.map(([k, f, tol, scale]) => ({ k, a: f(a), b: f(b), d: Math.abs(f(a) - f(b)), tol, rel: Math.abs(f(a) - f(b)) / Math.max(scale, Math.abs(f(a))) }));
const show = (ds) => ds.map(x => `${x.k} ${fmt(x.a, 3)}/${fmt(x.b, 3)}`).join(', ');

// (a scene: from a body at a time over a span of the reference sol, three ways)
function scene(name, fromMs, untilMs, prep = null) {
  const start = templateBody(REV), sols = SOLS();
  runSols({ body: start, sols, untilMs: fromMs });
  prep?.(start);
  const run = (mode) => { const b = copy(start), t0 = performance.now(); runSols({ body: b, sols, fromMs, untilMs, mode, splits: 1000, seed: 7 }); return { b, ms: performance.now() - t0 }; };
  return { name, fromMs, untilMs, skip: run('skip'), split: run('split'), tick: run('tick') };
}

export default [
  STAGE_TEST,
  {
    name: 'a shower, a night and a 15-minute wait: one call a segment equals the same split at 1,000 random seconds to 1e-9, and ticked at 20 Hz within BODY §25\'s tolerances',
    fn() {
      const shower = at('into the shower'), taps = at('the rack'), wait = at('the evening');
      const scenes = [
        scene('a shower (06:50 to 07:00: in, the water, dried and dressed)', shower, shower + 10 * MIN_MS),
        scene('a night (22:00 to 05:30, the slip inside it)', taps, SOLS()[1].reveilleMs),
        scene('a 15-minute wait (18:05, seated in the evening)', wait, wait + 15 * MIN_MS),
      ];
      for (const s of scenes) {
        const comp = diffs(s.skip.b, s.split.b), live = diffs(s.skip.b, s.tick.b);
        const worstRel = Math.max(...comp.map(x => x.rel)), over = live.filter(x => !(x.d <= x.tol));
        console.log(`      ${s.name}: ${fmt((s.untilMs - s.fromMs) / MIN_MS, 1)} min; skipped ${fmt(s.skip.ms, 1)} ms, split ${fmt(s.split.ms, 1)} ms, ticked ${fmt(s.tick.ms, 0)} ms (${Math.round((s.untilMs - s.fromMs) / TICK_MS)} ticks)`);
        console.log(`        skipped/ticked: ${show(live)}`);
        console.log(`        the split's worst relative difference ${worstRel.toExponential(2)}; lived against skipped, the largest: ${live.slice().sort((a, b) => b.d / b.tol - a.d / a.tol).slice(0, 3).map(x => `${x.k} ${x.d.toExponential(2)} (tolerance ${x.tol})`).join(', ')}`);
        assert(worstRel <= 1e-9, `${s.name}: composition ${JSON.stringify(comp.filter(x => x.rel > 1e-9))}`);
        assert(!over.length, `${s.name}: lived against skipped ${JSON.stringify(over)}`);
      }
    },
  },
  {
    name: 'the whole reference sol, one call a segment against 1,000 random whole-second splits: every ledger equal to 1e-9, the crossings at the same times',
    fn() {
      const sols = SOLS(), run = (mode) => { const b = templateBody(REV); const r = runSols({ body: b, sols, untilMs: sols[1].reveilleMs, mode, splits: 1000, seed: 11 }); return { b, r }; };
      const a = run('skip'), s = run('split');
      const ds = diffs(a.b, s.b), worst = Math.max(...ds.map(x => x.rel));
      const ca = a.r.crossed.map(c => `${c.ledger}:${c.to}@${ceilSec(c.atMs)}`), cs = s.r.crossed.map(c => `${c.ledger}:${c.to}@${ceilSec(c.atMs)}`);
      console.log(`      24.66 h, ${a.r.crossed.length} crossings: the worst relative difference ${worst.toExponential(2)}; the crossings ${JSON.stringify(ca) === JSON.stringify(cs) ? 'the same, to the second' : 'differ'}; offset ${a.b.sleep.offsetH}/${s.b.sleep.offsetH}`);
      assert(worst <= 1e-9, JSON.stringify(ds.filter(x => x.rel > 1e-9)));
      assert(JSON.stringify(ca) === JSON.stringify(cs), JSON.stringify({ ca, cs }));
    },
  },
  {
    name: 'the whole reference sol lived tick by tick (1.78 million ticks) against skipped a segment at a time, within BODY §25\'s tolerances',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      const sols = SOLS(), run = (mode) => { const b = templateBody(REV), t0 = performance.now(); runSols({ body: b, sols, untilMs: sols[1].reveilleMs, mode }); return { b, ms: performance.now() - t0 }; };
      const a = run('skip'), t = run('tick'), ds = diffs(a.b, t.b), over = ds.filter(x => !(x.d <= x.tol));
      console.log(`      skipped ${fmt(a.ms, 0)} ms, ticked ${fmt(t.ms / 1000, 1)} s (${fmt(t.ms * 1000 / ((sols[1].reveilleMs - REV) / TICK_MS), 2)} µs a tick)`);
      console.log(`      skipped/ticked: ${show(ds)}`);
      assert(!over.length, JSON.stringify(over));
    },
  },
  {
    name: 'nextCrossings equals stepping second by second, to the second, over 8 hours from the career\'s start (idle in the bay)',
    fn() {
      const start = templateBody(REV), sols = SOLS(), t0 = ceilSec(msAtMarsTime(REV, 12, 40, MELAS_LON));
      runSols({ body: start, sols, untilMs: t0 });
      start.bladder.ml = 150; start.water.balanceL = 0.4;                // (a bladder and a thirst that move inside the 8 hours)
      const seg = rowSeg({ met: 1.5, kind: 'still' }, MELAS_LON, massOf(start), false, MELAS_PLACE), until = t0 + 8 * HOUR_MS;
      const tc = performance.now(), predicted = nextCrossings(start, seg, t0, { untilMs: until }), predMs = performance.now() - tc;
      const b = copy(start), stepped = [];
      let prev = stagesOf(b, t0, MELAS_LON);
      for (let t = t0; t < until; t += SEC_MS) {
        const r = bodyAdvance(b, seg, t, t + SEC_MS);
        for (const e of r.events) if (e.kind === 'asleep' || e.kind === 'woke') stepped.push(`sleep:${e.kind}@${ceilSec(e.atMs)}`);
        const now = stagesOf(b, t + SEC_MS, MELAS_LON);
        for (const k of ['hunger', 'thirst', 'bladder', 'bowel', 'hygiene', 'fatigue', 'stubble', 'stamina', 'stress', 'hands']) {
          if (now[k].i === prev[k].i) continue;
          const up = now[k].i > prev[k].i, bands = LEDGERS.find(l => l.key === k).bands;
          for (let i = prev[k].i + (up ? 1 : -1); up ? i <= now[k].i : i >= now[k].i; i += up ? 1 : -1) stepped.push(`${k}:${bands[i].id}@${t + SEC_MS}`);
        }
        prev = now;
      }
      const pred = predicted.filter(c => c.ledger !== 'bladder' || c.band !== 'wake').map(c => `${c.ledger === 'hygiene' ? 'hygiene' : c.ledger}:${c.band}@${c.atMs}`);
      console.log(`      ${pred.length} crossings predicted in ${fmt(predMs, 1)} ms: ${predicted.map(c => `${c.ledger} ${c.band} ${T(c.atMs)}${c.interrupt ? ' (interrupts)' : ''}`).join(', ')}`);
      console.log(`      stepping second by second found ${stepped.length}: ${JSON.stringify(pred) === JSON.stringify(stepped) ? 'the same, each to the second' : JSON.stringify(stepped)}`);
      assert(JSON.stringify(pred) === JSON.stringify(stepped), JSON.stringify({ pred, stepped }));
    },
  },
  {
    name: 'in the game: fifteen minutes lived at 20 Hz against the same fifteen stepped by the slow layer as an outcome skip steps them, and a save mid-minute carries on byte for byte',
    fn() {
      const make = () => createGame({ scenario: 'barracks', seed: 48213, hour: 19.5 });
      const L = make(), S = make(), pid = playerId(L.state), t0 = L.state.clock.ms, span = 15 * MIN_MS;
      const tl = performance.now();
      L.step(span / TICK_MS);
      const liveMs = performance.now() - tl, st = S.state, ts = performance.now();
      for (let t = st.clock.ms; t < t0 + span;) {
        const nextEv = (st.events ?? []).filter(e => !e.dead && e.atMs > t).reduce((m, e) => Math.min(m, e.atMs), Infinity);
        const t1 = Math.min(t0 + span, Math.floor(t / MIN_MS) * MIN_MS + MIN_MS, nextEv);
        st.clock.ms = t1;
        S.sim.slowStep(st, S.bus, t, t1, { skipping: true });
        for (const ev of popDue(st, t1)) S.sim.dispatch(st, S.bus, ev);
        t = t1;
      }
      const skipMs = performance.now() - ts;
      bodySync(L.state, pid, L.state.clock.ms, L.bus);                   // (the lived body's last part-minute, still in its mix)
      const a = bodyOf(L.state, pid), b = bodyOf(st, pid), ds = diffs(a, b), over = ds.filter(x => !(x.d <= x.tol));
      console.log(`      the barracks at 19:30, the player idle: lived ${fmt(liveMs, 0)} ms (${span / TICK_MS} ticks), stepped ${fmt(skipMs, 1)} ms; lived/stepped: ${show(ds)}`);
      assert(!over.length, JSON.stringify(over));
      // (a save mid-minute: the live mix and the held rate point travel with it)
      const g = make();
      g.step(20 * 37 + 7, { mx: 1 });
      const json = g.save(), h = JSON.parse(json).people[pid].body.held;
      g.step(20 * 90, { mx: -1 });
      const end = g.save();
      const g2 = make(); g2.load(json); g2.step(20 * 90, { mx: -1 });
      console.log(`      saved at +${(20 * 37 + 7) * TICK_MS / SEC_MS} s mid-minute with ${h?.ms ?? 0} ms in the live mix (${h?.cur?.metG ?? '-'} MET); carried on 90 s: ${end === g2.save() ? 'byte for byte' : 'differs'}`);
      assert(end === g2.save(), 'a save mid-minute carries on byte for byte');
    },
  },
  {
    name: 'the upgrade body:v2: a v0.0.3 save\'s bodies become v2 and its player gets the start body at the save\'s clock (flag mig:body-v2); a new save loads unchanged',
    fn() {
      const g = createGame({ scenario: 'barracks', seed: 48213, hour: 15 }), pid = playerId(g.state), json = g.save();
      const fresh = createGame({ scenario: 'barracks', seed: 48213, hour: 15 });
      fresh.load(json);
      const same = fresh.save() === json && !fresh.state.flags['mig:body-v2'];
      // (a v0.0.3 save: the roster's v1 bodies, the player's with no ledgers)
      const old = JSON.parse(json);
      for (const p of Object.values(old.people)) { const b = p.body; p.body = { v: 1, tmpl: b.tmpl, heightM: b.heightM, build: b.build }; }
      old.events = old.events.filter(e => !String(e.src).startsWith('body'));
      const up = createGame({ scenario: 'barracks', seed: 48213, hour: 15 });
      up.load(JSON.stringify(old));
      const b = up.state.people[pid].body, vs = new Set(Object.values(up.state.people).map(p => p.body.v));
      const posted = up.state.events.filter(e => !e.dead && e.src === `body:${pid}`).length;
      console.log(`      a new save reloaded: ${same ? 'unchanged, no flag' : 'changed'}; a v0.0.3 save: versions ${[...vs].join(', ')}, the player's body from ${T(b.atMs)} (${JSON.stringify(b).length} B), flag ${up.state.flags['mig:body-v2']}, ${posted} crossing posted`);
      assert(same, 'a new save moved on load');
      assert(vs.size === 1 && vs.has(2) && b.atMs === up.state.clock.ms && up.state.flags['mig:body-v2'] === true && posted === 1, JSON.stringify({ vs: [...vs], atMs: b.atMs, posted }));
    },
  },
];
