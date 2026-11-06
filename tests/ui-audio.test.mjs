// The footsteps' pure half and the synthesiser, in node (quick): src/ui/audio/steps.js and synth.js.
//
// The build sheet 0.0.3 §5.4: footfalls() over 100 m walked, run and strolled at BODY's Mars speeds
// (1.14, 2.69 and 0.75 m/s), the stride counted as move.js counts it (rounded to 0.1 mm, wrapping at
// STRIDE_WRAP_M), a foot-fall at each half of the drawn gait's cycle (0.32 m walking and strolling,
// 0.9 m running); stepVoice() by surface; the gain law against Earth (the foot's weight at 0.38 G,
// 10 log10(0.38) = −4.2 dB, VIEWS §11.3; the air's PEOPLE §7.3 law at Melas's 65.9 kPa, −1.9 dB;
// −6.1 dB in all) and VIEWS §11.2's low-pass, 8 kHz × 65.9 / 101.3 = 5,204 Hz; the scheduler fed by
// a simulated loop (50 ms ticks, frames of 4, 16.7 and 33 ms, the view's alpha) schedules every
// foot-fall once and only once, each at the moment the drawn foot reaches it (within a frame when it
// fell inside a frame already drawn), and nothing while paused, held or skipping, nor a burst after.
// And every recipe of src/data/sounds.js rendered and measured (peak, RMS, centroid, decay: VIEWS
// §11.5's numbers), the same samples twice, its variants different.
import { assert, near, fmt } from './helpers.mjs';
import { footfalls, stepVoice, createStepScheduler, weightDb, lowpassHz, HALF_CYCLE_M } from '../src/ui/audio/steps.js';
import { render, measure } from '../src/ui/audio/synth.js';
import { STEPS, DOORS, AIR_KPA, LOOKAHEAD_S } from '../src/data/sounds.js';
import { airDb } from '../src/sim/people/hearing.js';
import { STRIDE_WRAP_M } from '../src/data/body/gait.js';

const TICK_S = 0.05;
const q = (v) => Math.round(v * 10000) / 10000;                  // (move.js's POS_STEP_M rounding)
const advance = (stride, m) => q((stride + m) % STRIDE_WRAP_M);

/**
 * A loop in miniature: real time in frames of frameS (a list cycled), 50 ms ticks from an accumulator,
 * the stride advancing speed × 50 ms a tick while walking, the scheduler fed each frame as main.js
 * feeds it. plan: [{ s, speed, gait, live = true }] legs of real seconds. Returns what was scheduled
 * and what should have been: every half-cycle threshold the stride crossed while live, with the real
 * moment the view draws it (the tick's start plus its place in the step, as alpha runs).
 */
function simulate({ frames, plan, start = 0 }) {
  const sch = createStepScheduler();
  let t = 0, acc = 0, stride = start, step = 0, gait = 'idle', fi = 0, legEnd = 0, li = -1, leg = null;
  let tickStartS = 0, unwrapped = start;
  const got = [], want = [];
  const total = plan.reduce((a, l) => a + l.s, 0);
  while (t < total) {
    const dt = frames[fi++ % frames.length] / 1000;
    t += dt; acc += dt;
    while (t >= legEnd && li < plan.length - 1) { li++; leg = plan[li]; legEnd += leg.s; }
    while (acc >= TICK_S - 1e-12) {
      acc -= TICK_S;
      const m = leg.speed > 0 ? leg.speed * TICK_S : 0, prev = unwrapped;
      step = m; gait = m > 0 ? leg.gait : 'idle';
      stride = m > 0 ? advance(stride, m) : stride;
      unwrapped = m > 0 ? q(prev + m) : prev;
      tickStartS = t - acc;
      if (m > 0 && leg.live !== false) {
        const half = HALF_CYCLE_M[leg.gait];
        for (let k = Math.floor(prev / half + 1e-7) + 1; k <= Math.floor(unwrapped / half + 1e-7); k++) want.push({ n: k, gait: leg.gait, drawnS: tickStartS + ((k * half - prev) / m) * TICK_S });
      }
    }
    const alpha = acc / TICK_S;
    for (const f of sch.frame({ strideM: stride, stepM: step, gait, alpha, nowS: t, tickS: TICK_S, live: leg.live !== false })) got.push({ ...f, frameS: t });
  }
  return { got, want, stats: sch.stats };
}

function compare(got, want) {
  const seen = new Map();
  let dupes = 0;
  for (const g of got) { if (seen.has(`${g.n}`)) dupes++; seen.set(`${g.n}`, g); }
  const missing = want.filter(w => !seen.has(`${w.n}`)).length, extra = got.filter(g => !want.some(w => w.n === g.n)).length;
  let early = 0, late = 0;
  for (const w of want) { const g = seen.get(`${w.n}`); if (!g) continue; const d = g.atS - w.drawnS; early = Math.min(early, d); late = Math.max(late, d); }
  return { dupes, missing, extra, earlyMs: early * 1000, lateMs: late * 1000 };
}

export default [
  {
    name: 'footfalls over 100 m: a foot-fall each half of the drawn gait cycle, 0.32 m walking and strolling, 0.9 m running, across the stride\'s wrap',
    fn() {
      const rows = [];
      for (const [gait, speed] of [['walk', 1.14], ['run', 2.69], ['stroll', 0.75]]) {
        // (started 30 m short of the wrap, so the 100 m cross it)
        let stride = q(STRIDE_WRAP_M - 30), walked = 0, n = 0, ticks = 0;
        while (walked < 100 - 1e-9) {
          const m = Math.min(speed * TICK_S, 100 - walked), prev = stride;
          stride = advance(stride, m); walked = q(walked + m); ticks++;
          n += footfalls(prev, stride, gait).length;
        }
        const perM = n / 100, perS = n / (ticks * TICK_S);
        rows.push({ gait, speed, n, perM, perS });
        console.log(`      ${gait.padEnd(6)} at ${fmt(speed, 2)} m/s: ${n} foot-falls in 100 m (${ticks} ticks): ${fmt(perM, 3)} a metre, ${fmt(perS, 2)} a second`);
        near(n, 100 / HALF_CYCLE_M[gait], 1, `${gait}:`);
      }
      near(rows[0].perS, 1.14 / 0.32, 0.05, 'the walk\'s rate');
      near(rows[1].perS, 2.69 / 0.9, 0.05, 'the run\'s rate');
      // (the fractions are in (0, 1] and ordered: from 0.3 m to 1.0 m the feet fall at 0.32, 0.64 and 0.96 m)
      const f = footfalls(0.3, 1.0, 'walk');
      assert(f.length === 3 && f[0] > 0 && f[2] <= 1 && f[0] < f[1] && f[1] < f[2], JSON.stringify(f));
      near(f[1], (0.64 - 0.3) / 0.7, 1e-9, 'the second fraction');
      assert(footfalls(1, 1, 'walk').length === 0 && footfalls(0, 5, 'idle').length === 0, 'standing still or idle: none');
      assert(footfalls(201.5, 0.1, 'walk').length === 1, `across the wrap: ${JSON.stringify(footfalls(201.5, 0.1, 'walk'))}`);
    },
  },
  {
    name: 'stepVoice: tile and vinyl tick, concrete, paving and stairs slap, regolith crunches; −4.2 dB of weight and −1.9 dB of air, −6.1 dB walking at Melas, low-passed at 5,204 Hz',
    fn() {
      const kinds = {};
      for (const s of ['tile', 'vinyl', 'concrete', 'paving', 'stairs', 'regolith', 'something-new']) kinds[s] = stepVoice(s, 'walk').kind;
      console.log(`      surfaces: ${Object.entries(kinds).map(([s, k]) => `${s} → ${k}`).join(', ')}`);
      assert(kinds.tile === 'tile' && kinds.vinyl === 'tile' && kinds.concrete === 'concrete' && kinds.paving === 'concrete' && kinds.stairs === 'concrete' && kinds.regolith === 'regolith' && kinds['something-new'] === 'concrete', JSON.stringify(kinds));
      const v = stepVoice('tile', 'walk', { gG: 0.38, pKpa: AIR_KPA.ground }), inside = stepVoice('tile', 'walk', { gG: 0.38, pKpa: AIR_KPA.floor });
      console.log(`      against Earth's 0 dB: weight ${fmt(v.weightDb, 2)} dB (0.38 G), air ${fmt(v.airDb, 2)} dB (${AIR_KPA.ground} kPa), total ${fmt(v.gainDb, 2)} dB walking; low-pass ${v.lowpassHz} Hz (${inside.lowpassHz} Hz in a building's ${AIR_KPA.floor} kPa, ${fmt(inside.gainDb, 2)} dB)`);
      console.log(`      by gait at Melas: ${['stroll', 'walk', 'run'].map(g => `${g} ${fmt(stepVoice('concrete', g).gainDb, 1)} dB`).join(', ')}; on Earth (1 G, 101.3 kPa) a walk is ${fmt(stepVoice('concrete', 'walk', { gG: 1, pKpa: 101.3 }).gainDb, 1)} dB at ${lowpassHz(101.3)} Hz`);
      near(weightDb(0.38), -4.2, 0.01, 'the weight');
      near(airDb(65.9), -1.9, 0.05, 'the air');
      near(v.gainDb, -6.1, 0.05, 'the total');
      assert(v.lowpassHz === 5204, `low-pass ${v.lowpassHz}`);
      assert(stepVoice('concrete', 'walk', { gG: 1, pKpa: 101.3 }).gainDb === 0, 'Earth is the reference');
      assert(stepVoice('tile', 'run').gainDb > v.gainDb && stepVoice('tile', 'stroll').gainDb < v.gainDb, 'a run strikes harder, a stroll softer');
    },
  },
  {
    name: 'the scheduler fed frames of 4, 16.7 and 33 ms schedules every foot-fall once, none twice and none missed, where the drawn foot falls',
    fn() {
      const plan = [{ s: 0.5, speed: 0 }, { s: 6, speed: 1.14, gait: 'walk' }, { s: 4, speed: 2.69, gait: 'run' }, { s: 4, speed: 0.75, gait: 'stroll' }, { s: 1, speed: 0 }, { s: 5, speed: 1.14, gait: 'walk' }];
      for (const frames of [[4], [16.7], [33], [4, 33, 16.7, 9, 25]]) {
        const { got, want, stats } = simulate({ frames, plan, start: q(STRIDE_WRAP_M - 8) });
        const c = compare(got, want);
        console.log(`      frames of ${frames.join(', ')} ms: ${want.length} foot-falls crossed, ${got.length} scheduled; ${c.dupes} twice, ${c.missing} missed, ${c.extra} not taken; timing against the drawn foot ${fmt(c.earlyMs, 1)} to +${fmt(c.lateMs, 1)} ms; late dropped ${stats.dropped}`);
        assert(!c.dupes && !c.missing && !c.extra, JSON.stringify(c));
        // (a foot-fall is never ahead of the drawn foot; it is late only by the part of a frame already drawn)
        assert(c.earlyMs > -0.5 && c.lateMs < Math.max(...frames) + 0.5, JSON.stringify(c));
      }
    },
  },
  {
    name: 'the scheduler schedules nothing while paused, held or skipping, and no burst after one',
    fn() {
      // (paused: frames with no ticks; held: ticks that move nothing; a skip: the stride jumps while not live)
      const sch = createStepScheduler();
      let stride = 10, t = 0, n = 0;
      const feed = (o) => { n += sch.frame({ strideM: stride, stepM: 0, gait: 'walk', alpha: 0.5, nowS: t, tickS: TICK_S, ...o }).length; t += 0.0167; };
      feed({});
      for (let i = 0; i < 120; i++) feed({ live: false });              // (paused 2 s)
      const paused = n;
      for (let i = 0; i < 120; i++) feed({});                           // (held: ticks run, nothing moves)
      const held = n - paused;
      for (let i = 0; i < 60; i++) { stride = q(stride + 0.06); feed({ live: false, stepM: 0.06 }); }   // (a skip walked 3.6 m with nobody live)
      const skipping = n - paused - held;
      stride = q(stride + 0.057); feed({ stepM: 0.057, gait: 'walk' });  // (live again: one tick's step)
      const after = n - paused - held - skipping;
      // (a jump of the stride, a load: a new start, not a burst of 30 steps)
      stride = q(stride + 9.6); feed({ stepM: 0.057 });
      const jump = n - paused - held - skipping - after;
      console.log(`      paused 2 s: ${paused}; held 2 s: ${held}; a skip that walked 3.6 m: ${skipping}; the tick after it: ${after}; a 9.6 m jump of the stride: ${jump} (resyncs ${sch.stats.resyncs})`);
      assert(paused === 0 && held === 0 && skipping === 0 && after <= 1 && jump === 0, JSON.stringify({ paused, held, skipping, after, jump }));
      assert(LOOKAHEAD_S === 0.1, `LOOKAHEAD_S ${LOOKAHEAD_S}`);
    },
  },
  {
    name: 'every sound is rendered by code from its recipe: its peak at its level, the same samples twice, its variants different (VIEWS §11.5\'s numbers)',
    fn() {
      const sr = 48000;
      for (const [table, label] of [[STEPS, 'step'], [DOORS, 'door']]) {
        for (const [kind, recipe] of Object.entries(table)) {
          const t0 = performance.now();
          const a = render(recipe, { sampleRate: sr, name: kind, variant: 0 }), ms = performance.now() - t0;
          const b = render(recipe, { sampleRate: sr, name: kind, variant: 0 }), c = render(recipe, { sampleRate: sr, name: kind, variant: 1 });
          const m = measure(a, sr);
          const same = a.every((v, i) => v === b[i]), differs = a.some((v, i) => v !== c[i]), finite = a.every(Number.isFinite);
          console.log(`      ${label} ${kind.padEnd(8)}: ${fmt(m.durS * 1000, 0)} ms, peak ${fmt(m.peakDb, 1)} dBFS, RMS ${fmt(m.rmsDb, 1)} dBFS, centroid ${fmt(m.centroidHz, 0)} Hz, decay to −30 dB ${fmt(m.decayS * 1000, 1)} ms; rendered in ${fmt(ms, 2)} ms; ${recipe.variants} variants`);
          near(m.peakDb, recipe.levelDb, 0.1, `${kind}'s peak`);
          assert(same && differs && finite, JSON.stringify({ kind, same, differs, finite }));
          assert(Math.abs(a[a.length - 1]) < 1e-6, `${kind} ends on silence`);
        }
      }
      // (the surfaces sound apart: tile brightest, regolith darkest)
      const cen = (k) => measure(render(STEPS[k], { sampleRate: sr, name: k }), sr).centroidHz;
      assert(cen('tile') > cen('concrete') && cen('concrete') > cen('regolith'), JSON.stringify({ tile: cen('tile'), concrete: cen('concrete'), regolith: cen('regolith') }));
    },
  },
];
