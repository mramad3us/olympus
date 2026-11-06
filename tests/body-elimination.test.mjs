// body-elimination: the bladder and the bowel (BODY §5, §25; the build sheet 0.0.4 §5.1). The bladder's
// peaks and voids over the reference sol and the night's bladder at 22:00 and 05:30; a litre drunk to
// need and urgent; the bowel's urges after breakfast; no wake on the reference night from 250 mL at
// taps; the accident at 850 mL, at its closed-form second; and the bursting hazard posted at the same
// second lived (the game ticked at 20 Hz) and skipped (the slow layer stepped a minute at a time, as an
// outcome skip steps it), drawn once from its own stream.
import { assert, near, fmt } from './helpers.mjs';
import { templateBody, runSols, weekOf, MELAS_LON, stageTimes, lastReveille, STAGE_TEST } from './bots/sol.mjs';
import { createGame } from './game.mjs';
import { START_MS } from '../src/data/setting/calendar.js';
import { marsTimeText } from '../src/core/calendar.js';
import { HOUR_MS, MIN_MS, SEC_MS } from '../src/core/clock.js';
import { popDue } from '../src/core/queue.js';
import { playerId } from '../src/core/ids.js';
import { BLADDER } from '../src/data/body/needs.js';
import { bodyAdvance, rowSeg, bodyOf, storeBody, solPlan } from '../src/sim/body/body.js';
import { REFERENCE_SOL } from '../src/data/body/sol.js';
import { massOf } from '../src/sim/body/energy.js';
import { drinkBody, waterRates, kidneyNight } from '../src/sim/body/water.js';
import { phiOf, lonMsOf } from '../src/sim/body/sleep.js';
import { copy } from '../src/sim/body/record.js';

const T = (ms) => marsTimeText(ms, MELAS_LON);
const REV = lastReveille(START_MS, MELAS_LON);

export default [
  STAGE_TEST,
  {
    name: 'the bladder over the reference sol: its peaks, the voids, the night\'s bladder at 22:00 and 05:30; the bowel\'s urges after breakfast',
    fn() {
      const b = templateBody(REV), sols = weekOf(REV, MELAS_LON, 1).slice(0, 2);
      const r = runSols({ body: b, sols, untilMs: sols[1].reveilleMs });
      const voids = r.acts.filter(a => a.act === 'void'), up = r.crossed.filter(c => c.ledger === 'bladder' && c.toI > c.fromI);
      console.log(`      voids (a head from 300 mL; reveille and the rack whatever it holds): ${voids.map(v => `${T(v.atMs)} ${fmt(v.ml, 0)} mL`).join(', ')}`);
      console.log(`      the bladder's bands rising: ${up.map(c => `${c.to} ${T(c.atMs)}`).join(', ')}`);
      const taps = solPlan(REFERENCE_SOL, REV, MELAS_LON).find(s => s.row.bed).fromMs;
      const b2 = templateBody(REV);
      runSols({ body: b2, sols, untilMs: taps });
      const at22 = b2.bladder.ml;
      runSols({ body: b2, sols, fromMs: taps, untilMs: sols[1].reveilleMs });
      console.log(`      the night: ${fmt(at22, 0)} mL at ${T(taps)} (after the 21:45 head), ${fmt(b2.bladder.ml, 0)} mL at ${T(sols[1].reveilleMs)}: ${fmt((b2.bladder.ml - at22) / ((sols[1].reveilleMs - taps) / HOUR_MS), 1)} mL/h`);
      const bowel = r.crossed.filter(c => c.ledger === 'bowel');
      console.log(`      the bowel: ${bowel.map(c => `${c.from}→${c.to} ${T(c.atMs)}`).join(', ') || 'no band crossed'}; relieved ${r.acts.filter(a => a.act === 'bowel').map(a => `${T(a.atMs)} ${fmt(a.g, 0)} g`).join(', ')} (the gastrocolic reflex 45 min after a 400 kcal meal, and the morning, lower every line by 150 g)`);
      assert(!up.some(c => c.toI >= 3), `the reference sol's bladder reached urgent: ${up.filter(c => c.toI >= 3).map(c => T(c.atMs))}`);
      assert(voids.length >= 4 && voids.length <= 6, `${voids.length} voids`);
    },
  },
  {
    name: 'a litre drunk at rest from an empty bladder and a level balance: the times to could-go, need and urgent',
    fn() {
      const b = templateBody(REV);
      b.bladder.ml = 0; b.water.balanceL = 0; b.water.gutL = 0; drinkBody(b, 1.0);
      const r = bodyAdvance(b, rowSeg({ met: 1.5, kind: 'still' }, MELAS_LON, massOf(b)), REV, REV + 4 * HOUR_MS);
      const st = stageTimes(r.crossed).bladder ?? [];
      console.log(`      ${st.map(x => `${x.band} after ${fmt((x.atMs - REV) / MIN_MS, 0)} min`).join(', ')}; ${fmt(b.bladder.ml, 0)} mL after 4 h`);
      assert(st.some(x => x.band === 'need'), JSON.stringify(st));
    },
  },
  {
    name: 'no wake on the reference night from 250 mL at taps; a bladder that would reach 450 mL asleep wakes the sleeper there (BODY §5.1, §23.3)',
    fn() {
      const sols = weekOf(REV, MELAS_LON, 1).slice(0, 2), taps = solPlan(REFERENCE_SOL, REV, MELAS_LON).find(s => s.row.bed).fromMs;
      const b = templateBody(REV);
      runSols({ body: b, sols, untilMs: taps });
      const c = copy(b);
      b.bladder.ml = 250;
      const r = runSols({ body: b, sols, fromMs: taps, untilMs: sols[1].reveilleMs });
      const wake = r.crossed.filter(x => x.ledger === 'bladder' && x.to === 'wake');
      console.log(`      from 250 mL at ${T(taps)}: ${fmt(b.bladder.ml, 0)} mL at ${T(sols[1].reveilleMs)}, ${wake.length} wake`);
      assert(!wake.length, JSON.stringify(wake));
      c.bladder.ml = 400;
      const r2 = runSols({ body: c, sols, fromMs: taps, untilMs: sols[1].reveilleMs });
      const w2 = r2.crossed.find(x => x.ledger === 'bladder' && x.to === 'wake');
      console.log(`      from 400 mL at taps: the bladder wakes the sleeper at ${w2 ? T(w2.atMs) : 'never'} (${w2 ? 'interrupting' : ''})`);
      assert(w2 && w2.interrupt, 'a sleeper\'s bladder at 450 mL interrupts');
    },
  },
  {
    name: 'the accident at 850 mL comes at its closed-form time: the bladder empties, grime +25, stress +10',
    fn() {
      const b = templateBody(REV);
      b.bladder.ml = 800; b.water.balanceL = 0.6; b.water.gutL = 0;
      const seg = rowSeg({ met: 1.5, kind: 'still' }, MELAS_LON, massOf(b)), g0 = b.hygiene.grime, start = copy(b);
      const r = bodyAdvance(b, seg, REV, REV + HOUR_MS);
      const acc = r.events.find(e => e.kind === 'accident');
      // (the closed form inside the accident's own minute cell: the kidneys' rate is held from the cell's start)
      const cellMs = Math.floor(acc.atMs / MIN_MS) * MIN_MS, c = copy(start);
      bodyAdvance(c, seg, REV, cellMs);
      const urineMlH = waterRates(c.water.balanceL, 0, 1.5, 0, kidneyNight(phiOf(cellMs, lonMsOf(MELAS_LON), 0))).urineL * 1000, want = cellMs + (BLADDER.ACCIDENT_ML - c.bladder.ml) / urineMlH * HOUR_MS;
      console.log(`      from 800 mL at +0.6 L: the accident at +${fmt((acc.atMs - REV) / SEC_MS, 2)} s, in the cell from +${fmt((cellMs - REV) / SEC_MS, 0)} s at ${fmt(c.bladder.ml, 1)} mL and ${fmt(urineMlH, 0)} mL/h (closed form +${fmt((want - REV) / SEC_MS, 2)} s); ${fmt(acc.amount, 1)} mL let go; grime ${fmt(g0, 1)} → ${fmt(b.hygiene.grime, 1)}`);
      near(acc.atMs, want, 1, 'the accident\'s time (ms):');
      near(acc.amount, BLADDER.ACCIDENT_ML, 1e-6, 'let go:');
      near(b.hygiene.grime - g0, 25 + (b.hygiene.grime - g0 - 25), 1e-9, 'grime:');
      assert(b.hygiene.grime - g0 >= 25, `grime +${b.hygiene.grime - g0}`);
      assert(r.crossed.some(c => c.ledger === 'bladder' && c.to === 'accident' && c.interrupt), 'the accident interrupts');
    },
  },
  {
    name: 'the bursting hazard is posted at the same second lived (ticked at 20 Hz) and skipped (the slow layer stepped a minute at a time), 3% a minute from the crossing',
    fn() {
      const setup = () => {
        const g = createGame({ scenario: 'sandbox', seed: 48213 }), pid = playerId(g.state);
        const body = bodyOf(g.state, pid);
        body.bladder.ml = 650; body.water.balanceL = 0.9; body.held = {};
        storeBody(g.state.people[pid], body);
        return { g, pid };
      };
      const hazardOf = (state) => (state.events ?? []).filter(e => !e.dead && e.kind === 'body-hazard');
      const crossOf = (state) => (state.events ?? []).filter(e => !e.dead && e.kind === 'body');
      // (lived: the game's own ticks)
      const L = setup(), t0 = L.g.state.clock.ms;
      L.g.step(20 * 60 * 6);
      // (skipped: the clock moved a minute at a time, the slow layer stepped, the due events dispatched, as the outcome engine does)
      const S = setup(), st = S.g.state;
      for (let t = st.clock.ms; t < t0 + 6 * MIN_MS;) {
        const t1 = Math.min(t0 + 6 * MIN_MS, Math.floor(t / MIN_MS) * MIN_MS + MIN_MS, ...crossOf(st).concat(hazardOf(st)).map(e => e.atMs).filter(a => a > t));
        st.clock.ms = t1;
        S.g.sim.slowStep(st, S.g.bus, t, t1, { skipping: true });
        for (const ev of popDue(st, t1)) S.g.sim.dispatch(st, S.g.bus, ev);
        t = t1;
      }
      const hl = hazardOf(L.g.state)[0], hs = hazardOf(st)[0];
      const accL = L.g.bus.events?.find?.(e => e.type === 'body-event' && e.payload?.kind === 'accident') ?? null;
      const crossSec = Number(hl?.payload?.key?.split(':')[1]);
      console.log(`      from 650 mL at a +0.9 L balance: bursting crossed at +${fmt((crossSec - t0) / SEC_MS, 0)} s; the hazard (drawn once at that second, 3% a minute) lived at +${hl ? fmt((hl.atMs - t0) / SEC_MS, 0) : '-'} s, skipped at +${hs ? fmt((hs.atMs - t0) / SEC_MS, 0) : '-'} s (key ${hl?.payload?.key})`);
      assert(hl && hs && hl.atMs === hs.atMs && hl.payload.key === hs.payload.key, JSON.stringify({ hl, hs }));
      assert(hl.atMs % SEC_MS === 0, 'on a whole second');
    },
  },
];
