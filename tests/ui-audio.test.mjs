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
// The 0.0.4 round's (the build sheet §5.4, audio/world.js): the klaxon's level through 0, 1 and 2 walls
// (by the horn in hall-2, in bay-2-1 at your rack through its door, in Head A, two rooms off in the
// mail room; WALL_DB a wall and the low-pass halved), the splash's duck (the world at SPLASH_LP_HZ and
// SPLASH_DUCK_DB with the iris closed, open with it open, eased between), the watch's tick (a tick a
// shown minute, at most TICK_MAX_HZ: a 10-minute shower's 10 over its 2.6 s lapse, a night's steady
// 10 Hz), the world's recipes (the water and the tap looping seamlessly, the flush, the klaxon's whoop
// from 600 to 1,100 Hz, reveille's bugle, the tick) and which loop plays at which part.
// The 0.0.5 round's range (the build sheet §2.4, §5.4; audio/range.js): the R-7's report at the shooter in
// Melas's 65.9 kPa (airDb −1.9 dB, the muzzle 0.9 m off) with and without ear defenders (EARS_DB −25 dB and
// a 2 kHz low-pass), the berm's slap-back 12 dB under it 0.17 s later (2 × 28 m at 322 m/s), a neighbour's
// at 3 and 6 m; the action's clicks at their fractions of each sub-step on the game clock, a case's tick at
// its landMs as the clock passes it, the dry click of a dud, the tower's chime on a pa line; nothing new
// while time stands still, nothing a skip jumped over; and RANGE's recipes rendered and measured.
// The 0.0.7 round's (the build sheet 0.0.7 §5.5): the R-7 at distance in Melas air: the crack of your round leaving, the
// strike's thump back at its flight time plus its distance over the speed of sound (ballistics.js soundMsOf on the valley
// floor: 300 m, 0.42 + 0.93 = 1.35 s ±10 ms), a neighbour's report a sound's way late, the defenders on each (an impulse
// over their gate down 25 dB, a far strike under it untouched), the tower's speaker through their circuit, the KD's berm
// for the echo past the bay's, a carrier in the pits under the parapet; and twelve reports in 200 ms play at most six voices.
// The 0.0.6 round's (the build sheet 0.0.6 §2.3): the clippers' loop (a 120 Hz motor's hum through a 2 kHz band,
// seamless) while a shaved head is buzzed, the tap while the hands are washed, and the R menu's sounds (a tick, a
// latch and a lower latch, two rising notes, a close) rendered by code and played on the UI bus from the 'ui' fact.
// The 0.0.8 round's (the build sheet 0.0.8 §5.4 ui-audio, §8 item 24): the pairs pad's sounds on the game clock: a turner's
// motor from its turn and the clack of its stop TURN_MS later, at the stand; the coach's timer beeping once as the targets
// turn (however many); the steel ringing where the armoured face stands, a sound's way late; a Pair's two reports at its
// split (each round's formula time), a single Fire's as before; the recipes rendered with their bands where they belong.
import { assert, near, fmt } from './helpers.mjs';
import { footfalls, stepVoice, createStepScheduler, weightDb, lowpassHz, HALF_CYCLE_M } from '../src/ui/audio/steps.js';
import { render, measure } from '../src/ui/audio/synth.js';
import { STEPS, DOORS, WORLD, RANGE, AIR_KPA, LOOKAHEAD_S, WALL_DB, SPLASH_LP_HZ, SPLASH_DUCK_DB, TICK_MAX_HZ, KLAXON_HZ, WORLD_RATE_HZ, EARS_DB, EARS_LP_HZ, ECHO_DB, SOUND_SPEED_MS, REPORT_SOURCE_DB, ACTION_SOUNDS, UI_SOUNDS, CLIPPER_HZ } from '../src/data/sounds.js';
import { reportVoice, echoOf, caseVoice, chimeVoice, clickVoice, actionSoundsOf, createRange, createClickQueue, BERM_FACE_X, LATE_MS,
  crackVoice, strikeVoice, carrierVoice, throughEars, createReportLimiter, bermFor, KD_BERM_FACE_X, distLowpassHz } from '../src/ui/audio/range.js';
import { REPORT_VOICES, REPORT_MERGE_MS, EARS_GATE_DB, PARAPET_DB, CRACK_SOURCE_DB, IMPACT_SOURCE_DB, TURNER_SOURCE_DB, BEEP_SOURCE_DB, STEEL_SOURCE_DB } from '../src/data/sounds.js';
import { turnerVoice, beepVoice, ringVoice } from '../src/ui/audio/range.js';
import { soundMsOf, ENV_CLASSES, flightOf } from '../src/sim/arms/ballistics.js';
import { klaxonVoice, wallsBetween, duckOf, createTicker, loopsAt, createWorld } from '../src/ui/audio/world.js';
import { areaOf } from '../src/sim/places/model.js';
import { ALERT_DRILL } from '../src/data/pod.js';
import { lapseS, ease } from '../src/sim/time/splash.js';
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
  {
    name: 'the klaxon through the walls: loudest by the horn in hall-2, muffled in bay-2-1 at your rack through its door and in Head A (one wall, −10 dB, the low-pass halved), fainter two rooms off',
    fn() {
      const area = areaOf('melas.echo.1'), horn = ALERT_DRILL.horn;
      const at = [['hall-2, 2 m from the horn', { x: 55.7, z: 8.8 }], ['bay-2-1, your rack\'s foot', { x: 52.075, z: 3.3 }], ['Head A, at a shower stall', { x: 58.95, z: 16.4 }], ['the mail room', { x: 46, z: 22 }]];
      const got = at.map(([what, me]) => { const w = wallsBetween(area, horn, me); return { what, w, v: klaxonVoice({ horn, me, walls: w, pKpa: AIR_KPA.floor, kind: area.kind }) }; });
      for (const g of got) console.log(`      ${g.what}: ${fmt(g.v.distM, 1)} m, ${g.w} wall${g.w === 1 ? '' : 's'}: ${fmt(g.v.gainDb, 1)} dB against its recipe's peak, low-pass ${fmt(g.v.lowpassHz, 0)} Hz`);
      assert(got[0].w === 0 && got[1].w === 1 && got[2].w === 1 && got[3].w === 2, JSON.stringify(got.map(g => g.w)));
      assert(got[0].v.gainDb > got[1].v.gainDb && got[0].v.gainDb > got[2].v.gainDb && got[2].v.gainDb > got[3].v.gainDb, JSON.stringify(got.map(g => g.v.gainDb)));
      const same = klaxonVoice({ horn, me: at[1][1], walls: 0 }), thru = klaxonVoice({ horn, me: at[1][1], walls: 1 }), two = klaxonVoice({ horn, me: at[1][1], walls: 2 });
      near(same.gainDb - thru.gainDb, -WALL_DB, 1e-9, 'a wall');
      near(thru.gainDb - two.gainDb, -WALL_DB, 1e-9, 'a second wall');
      assert(Math.abs(thru.lowpassHz * 2 - same.lowpassHz) < 1e-9 && Math.abs(two.lowpassHz * 4 - same.lowpassHz) < 1e-9, 'the low-pass halved a wall');
      console.log(`      at your rack's spot through 0, 1, 2 walls: ${[same, thru, two].map(v => `${fmt(v.gainDb, 1)} dB at ${fmt(v.lowpassHz, 0)} Hz`).join(', ')}; the air ${fmt(airDb(AIR_KPA.floor), 2)} dB`);
    },
  },
  {
    name: 'the splash\'s duck: the world at 900 Hz and −9 dB with the iris closed, open at 20 kHz and 0 dB with it open, eased between, closed throughout a brief splash; the tick once a shown minute, at most 10 Hz',
    fn() {
      const rows = [null, { form: 'full', inkK: 0 }, { form: 'full', inkK: 0.5 }, { form: 'full', inkK: 1 }, { form: 'brief', inkK: 0 }].map(duckOf);
      console.log(`      ${rows.map(d => `k ${fmt(d.k, 1)}: ${fmt(d.lowpassHz, 0)} Hz, ${fmt(d.gainDb, 1)} dB`).join('; ')}`);
      assert(rows[0].gainDb === 0 && rows[0].lowpassHz === 20000 && Math.abs(rows[3].lowpassHz - SPLASH_LP_HZ) < 1e-6 && rows[3].gainDb === SPLASH_DUCK_DB && rows[4].k === 1, JSON.stringify(rows));
      assert(rows[2].lowpassHz < rows[1].lowpassHz && rows[2].lowpassHz > rows[3].lowpassHz, 'eased between');
      // (the shown clock of a 10-minute shower and of a night, at 60 fps, through the ticker)
      for (const [what, gapMin] of [['the shower', 10], ['the night', 494.6]]) {
        const tk = createTicker(), L = lapseS(gapMin), from = 23_505_105_700;
        let n = 0, last = null, minGap = Infinity;
        for (let t = 0; t <= L + 1e-9; t += 1 / 60) {
          const shown = from + ease(t / L) * gapMin * 60_000;
          if (tk.tick(shown, t)) { n++; if (last !== null) minGap = Math.min(minGap, t - last); last = t; }
        }
        console.log(`      ${what} (${gapMin} min over ${fmt(L, 2)} s): ${n} ticks, ${fmt(n / L, 1)} a second, at least ${fmt(minGap * 1000, 0)} ms apart`);
        assert(minGap >= 1 / TICK_MAX_HZ - 1e-6 && n <= Math.ceil(L * TICK_MAX_HZ) + 1, JSON.stringify({ n, minGap }));
        if (gapMin === 10) assert(n >= 9 && n <= 10, `a tick a minute: ${n}`);
      }
    },
  },
  {
    name: 'the world\'s sounds by code: the water and the tap loop seamlessly, the flush, the klaxon\'s whoop from 600 to 1,100 Hz, the bugle, the tick; the loops at their parts only',
    fn() {
      const sr = WORLD_RATE_HZ;
      for (const [kind, recipe] of Object.entries(WORLD)) {
        const rate = recipe.rateHz ?? 48000, t0 = performance.now();
        const a = render(recipe, { sampleRate: rate, name: kind, variant: 0 }), ms = performance.now() - t0;
        const b = render(recipe, { sampleRate: rate, name: kind, variant: 0 }), m = measure(a, rate);
        const same = a.every((v, i) => v === b[i]), finite = a.every(Number.isFinite);
        // (a loop's seam: the jump from its last sample to its first no bigger than a step inside it)
        let seam = '';
        if (recipe.loop) {
          let maxStep = 0;
          for (let i = 1; i < a.length; i++) maxStep = Math.max(maxStep, Math.abs(a[i] - a[i - 1]));
          const jump = Math.abs(a[0] - a[a.length - 1]);
          seam = `; the seam's jump ${fmt(jump * 1000, 2)} ‰ of full scale against the largest step inside ${fmt(maxStep * 1000, 2)}`;
          assert(jump <= maxStep * 1.01, `${kind}'s loop clicks at its seam`);
        } else assert(Math.abs(a[a.length - 1]) < 1e-6, `${kind} ends on silence`);
        console.log(`      ${kind.padEnd(6)}: ${fmt(m.durS * 1000, 0)} ms at ${rate} Hz, peak ${fmt(m.peakDb, 1)} dBFS, RMS ${fmt(m.rmsDb, 1)}, centroid ${fmt(m.centroidHz, 0)} Hz, decay ${fmt(m.decayS * 1000, 0)} ms; rendered in ${fmt(ms, 1)} ms${seam}`);
        near(m.peakDb, recipe.levelDb, 0.1, `${kind}'s peak`);
        assert(same && finite, JSON.stringify({ kind, same, finite }));
      }
      assert(sr === 24000 && KLAXON_HZ.join() === '600,1100', 'the world\'s rate and the klaxon\'s whoop');
      // (the klaxon's pitch rises through its whoop: the centroid of its first third under its last's)
      const k = render(WORLD.klaxon, { sampleRate: sr, name: 'klaxon' }), third = Math.floor(k.length / 3);
      const c0 = measure(k.slice(0, third), sr).centroidHz, c2 = measure(k.slice(2 * third), sr).centroidHz;
      console.log(`      the klaxon's centroid: ${fmt(c0, 0)} Hz in its first third, ${fmt(c2, 0)} Hz in its last`);
      assert(c2 > c0, 'the whoop rises');
      // (which loop at which part: time's activityNow over a doing record)
      const doing = (activity, spotId, parts) => ({ time: { doing: { activity, spotId, mode: 'outcome', fromMs: 0, toMs: parts.at(-1).toMs, parts } }, clock: { ms: 0 } });
      const sh = doing('shower', 'f:e1:head-2a:shower-2#1', [{ part: 'in', toMs: 60_000 }, { part: 'water', toMs: 240_000 }, { part: 'dress', toMs: 600_000 }]);
      const ba = doing('basin', 'f:e1:head-2a:sinks-1#1', [{ part: 'teeth', toMs: 120_000 }, { part: 'face', toMs: 180_000 }]);
      const rows = [[sh, 30_000], [sh, 100_000], [sh, 300_000], [ba, 60_000], [{ time: {}, clock: { ms: 0 } }, 0]].map(([st, ms]) => loopsAt(st, ms));
      console.log(`      the shower at 0:30, 1:40, 5:00: water ${rows.slice(0, 3).map(r => r.water).join(', ')}; the basin's teeth: tap ${rows[3].tap}; nothing under way: ${JSON.stringify(rows[4])}`);
      assert(!rows[0].water && rows[1].water && !rows[2].water && rows[3].tap && !rows[3].water && !rows[4].water && !rows[4].tap, JSON.stringify(rows));
    },
  },
  {
    name: 'the R-7\'s report at the shooter in 65.9 kPa: −1.9 dB of air, the muzzle 0.9 m off; ear defenders take it 25 dB down and low-pass it at 2 kHz; the berm\'s slap-back 12 dB under it 0.17 s later; a neighbour\'s at 3 and 6 m',
    fn() {
      const me = { x: 1100, z: 292.5 }, open = reportVoice({ me, mine: true, ears: false }), ears = reportVoice({ me, mine: true, ears: true });
      console.log(`      yours, no defenders: ${fmt(open.gainDb, 1)} dB over the recipe's peak at ${fmt(open.lowpassHz, 0)} Hz (source +${REPORT_SOURCE_DB}, the air ${fmt(airDb(65.9), 2)}); with them: ${fmt(ears.gainDb, 1)} dB at ${fmt(ears.lowpassHz, 0)} Hz`);
      console.log(`      the echo: ${fmt(ears.echo.gainDb, 1)} dB at ${fmt(ears.echo.lowpassHz, 0)} Hz, ${fmt(ears.echo.delayS * 1000, 1)} ms after (${fmt(ears.echo.pathM, 1)} m of path at ${SOUND_SPEED_MS} m/s to the berm's face at x ${BERM_FACE_X} and back)`);
      near(open.gainDb, REPORT_SOURCE_DB + airDb(65.9), 1e-9, 'the report at 0.9 m: no distance loss inside a metre');
      near(open.gainDb - ears.gainDb, -EARS_DB, 1e-9, 'the defenders');
      near(airDb(65.9), -1.87, 0.01, 'airDb(65.9)');
      assert(open.lowpassHz > 5000 && ears.lowpassHz === EARS_LP_HZ, `${open.lowpassHz} / ${ears.lowpassHz}`);
      near(ears.echo.gainDb - ears.gainDb, ECHO_DB, 1e-9, 'the echo under the report');
      near(ears.echo.delayS, 0.174, 0.002, 'the echo 2 × 28 m at 322 m/s');
      const n3 = reportVoice({ me, muzzle: { x: 1100.9, z: 295.5 }, mine: false, ears: true }), n6 = reportVoice({ me, muzzle: { x: 1100.9, z: 298.5 }, mine: false, ears: true });
      console.log(`      a neighbour 3 m off: ${fmt(n3.gainDb, 1)} dB (${fmt(n3.distM, 2)} m, pan ${fmt(n3.pan, 2)}); 6 m: ${fmt(n6.gainDb, 1)} dB; their echoes ${fmt(n3.echo.delayS * 1000, 0)} and ${fmt(n6.echo.delayS * 1000, 0)} ms after`);
      assert(n3.gainDb < ears.gainDb && n6.gainDb < n3.gainDb && n3.echo.delayS < ears.echo.delayS, JSON.stringify({ n3: n3.gainDb, n6: n6.gainDb }));
      const pa = chimeVoice({ me }), tick = caseVoice({ me, at: { x: 1101.73, z: 295.09 } });
      console.log(`      the tower's chime from its deck: ${fmt(pa.distM, 1)} m, ${fmt(pa.gainDb, 1)} dB, pan ${fmt(pa.pan, 2)}; a case landing 3.1 m off to the right: ${fmt(tick.gainDb, 1)} dB, pan ${fmt(tick.pan, 2)}`);
      assert(pa.distM > 20 && pa.pan < 0 && tick.pan > 0, JSON.stringify({ pa, tick }));
    },
  },
  {
    name: 'the range\'s sounds on the game clock: the clicks at their fractions of each sub-step (the magazine\'s seat at 0.8 of magIn, the handle at 0.35 and 0.9 of charge), a case\'s tick at its landMs, the dry click of a dud, the chime on a pa line; nothing new while time stands still, nothing a skip jumped over',
    fn() {
      const played = [];
      const engine = { shot: (kind, opts) => { played.push({ kind, ...opts }); return true; } };
      const range = createRange(engine, { looks: { kitLook: () => ({ ears: true }) } });
      const state = { player: { id: 'p145', actor: 'a1' }, actors: { list: [{ id: 'a1', who: 'p145', x: 1100, z: 292.5 }] }, clock: { ms: 1000, holds: [] } };
      const at = (ms, held = false, alpha = 0) => { state.clock.ms = ms; state.clock.holds = held ? ['stop'] : []; range.frame(state, { alpha }); return played.map(p => p.kind); };
      at(1000);
      // (LOAD's magIn from 1,400 to 3,010 ms; then a shot at 4,000 with its case landing at 4,870)
      range.fact('step', { phase: 'sub', who: 'p145', step: 'macro:load', i: 1, action: 'magIn', fromMs: 1400, toMs: 3010 }, state);
      range.fact('step', { phase: 'sub', who: 'p145', step: 'macro:load', i: 1, action: 'magIn', fromMs: 1400, toMs: 3010 }, state);   // (heard twice: scheduled once)
      const seatMs = 1400 + 0.8 * 1610;
      const before = at(seatMs - 60).length, stood = at(seatMs + 10, true, 0.9).length === before;
      const seat = at(seatMs + 10).slice(before);
      console.log(`      magIn 1,400 to 3,010 ms: the seat due at ${seatMs} ms; at ${seatMs - 60}: ${before} played; the clock standing a tick short with the frame 90% on: nothing; past it: ${seat.join(', ')}`);
      assert(before === 0 && seat.join() === 'magSeat', JSON.stringify(played));
      range.fact('shot', { who: 'p145', fired: true, muzzle: { x: 1100.9, y: 0.25, z: 292.5 }, brass: { kind: 'case', landMs: 4870, at: [1101.73, 295.09] } }, state);
      const shot = played.slice(-2);
      at(4800); const early = played.length;
      at(4870); const landed = played.at(-1);
      console.log(`      the shot: ${shot.map(p => `${p.kind} ${fmt(p.gainDb, 1)} dB ${fmt(p.lowHz, 0)} Hz${p.delayS ? ` +${fmt(p.delayS * 1000, 0)} ms` : ''}`).join(', ')}; the case: nothing at 4,800 ms, ${landed.kind} at 4,870 (${fmt(landed.gainDb, 1)} dB)`);
      assert(shot[0].kind === 'report' && shot[1].kind === 'report' && Math.abs(shot[1].delayS - 0.17) < 0.006 && early === played.length - 1 && landed.kind === 'caseTick', JSON.stringify(played.slice(-3)));
      // (charge: the pull at 0.35, the slam at 0.9; a skip jumps the clock past both: dropped, counted late)
      range.fact('step', { phase: 'start', who: 'p145', step: 'charge', i: 0, action: 'charge', fromMs: 5000, toMs: 5920 }, state);
      at(5000 + 0.35 * 920 + 1); at(5000 + 0.9 * 920 + 1);
      const charge = played.slice(-2).map(p => p.kind);
      range.fact('step', { phase: 'start', who: 'p145', step: 'charge', i: 0, action: 'charge', fromMs: 6000, toMs: 6920 }, state);
      const n0 = played.length; at(6000 + 920 + LATE_MS + 50);
      console.log(`      charge: ${charge.join(', ')}; jumped ${LATE_MS + 50} ms past a charge's end: ${played.length - n0} played, ${range.stats.queue.late} dropped`);
      assert(charge.join() === 'chargePull,chargeSlam' && played.length === n0 && range.stats.queue.late === 2, JSON.stringify({ charge, late: range.stats.queue.late }));
      range.fact('shot', { who: 'p145', fired: false, why: 'dud' }, state);
      range.fact('shot', { who: 'p145', fired: false, why: 'safety' }, state);
      range.fact('say', { who: 'p146', kind: 'pa', text: 'MAKE READY.' }, state);
      range.fact('say', { who: 'p147', kind: 'speech', text: 'Breathe out.' }, state);
      console.log(`      a dud's pull: ${played.at(-2).kind}; on safe: nothing; the tower's line: ${played.at(-1).kind}; the coach's: nothing`);
      assert(played.at(-2).kind === 'dryClick' && played.at(-1).kind === 'chime' && range.stats.dry === 1 && range.stats.chimes === 1, JSON.stringify(played.slice(-3)));
      // (every action the panel offers has its clicks, or none on purpose)
      const rows = ['magIn', 'charge', 'release', 'tap', 'selector:safe', 'magOut:drop', 'lockBack', 'pressCheck', 'clearDouble', 'observe'].map(a => `${a} ${actionSoundsOf(a).map(([k, f]) => `${k}@${f}`).join('+') || 'none'}`);
      console.log(`      ${rows.join('; ')}`);
      assert(actionSoundsOf('magOut:pouch') === ACTION_SOUNDS['magOut:*'] && actionSoundsOf('selector:semi')[0][1] === 0.6 && actionSoundsOf('observe').length === 0, 'the families');
    },
  },
  {
    name: 'the range\'s sounds by code (RANGE): the report, the action\'s clicks, the case\'s tick, the tower\'s chime: each at its level, the same samples twice, ending on silence; the report the loudest and the lowest, the selector the brightest click',
    fn() {
      const m = {};
      for (const [kind, recipe] of Object.entries(RANGE)) {
        const rate = recipe.rateHz ?? 48000, t0 = performance.now();
        const a = render(recipe, { sampleRate: rate, name: kind, variant: 0 }), ms = performance.now() - t0, b = render(recipe, { sampleRate: rate, name: kind, variant: 0 });
        m[kind] = measure(a, rate);
        console.log(`      ${kind.padEnd(10)}: ${fmt(m[kind].durS * 1000, 0)} ms at ${rate} Hz, peak ${fmt(m[kind].peakDb, 1)} dBFS, RMS ${fmt(m[kind].rmsDb, 1)}, centroid ${fmt(m[kind].centroidHz, 0)} Hz, decay ${fmt(m[kind].decayS * 1000, 0)} ms; rendered in ${fmt(ms, 1)} ms`);
        near(m[kind].peakDb, recipe.levelDb, 0.1, `${kind}'s peak`);
        assert(a.every((v, i) => v === b[i]) && a.every(Number.isFinite) && Math.abs(a[a.length - 1]) < 1e-6, `${kind}: the same twice, finite, silent at its end`);
      }
      const clicks = ['magSeat', 'chargeSlam', 'boltSlam', 'selector', 'dryClick'];
      assert(clicks.every(k => m.report.peakDb > m[k].peakDb) && m.selector.centroidHz > m.palm.centroidHz && m.report.decayS > m.chargeSlam.decayS, JSON.stringify(Object.fromEntries(Object.entries(m).map(([k, v]) => [k, [Math.round(v.peakDb), Math.round(v.centroidHz)]]))));
      const v = clickVoice();
      console.log(`      a click at the hands: ${fmt(v.gainDb, 1)} dB at ${fmt(v.lowpassHz, 0)} Hz (not muffled: the defenders pass what is not an impulse)`);
      const q = createClickQueue();
      q.add(300, 'b'); q.add(100, 'a'); q.add(200, 'c');
      assert(q.due(250).map(e => e.kind).join() === 'a,c' && q.size === 1, 'the queue in time order');
    },
  },
  {
    name: 'the 0.0.6 round\'s sounds: the clippers loop seamlessly while a shaved head is buzzed (its hum at 120 Hz, its centroid in the 2 kHz band), the tap while the hands are washed; the R menu\'s five on the UI bus from the \'ui\' fact, the check above the uncheck, never with no context',
    fn() {
      const doing = (activity, spotId, part) => ({ time: { doing: { activity, spotId, mode: 'outcome', fromMs: 0, toMs: 60_000, parts: [{ part, toMs: 60_000 }] } }, clock: { ms: 0 } });
      const clip = loopsAt(doing('clip', 'f:e1:head-2a:sinks-1#1', 'clip'), 10_000), hands = loopsAt(doing('wash-hands', 'f:e1:head-2a:sinks-1#1', 'hands'), 10_000), shave = loopsAt(doing('shave', 'f:e1:head-2a:sinks-1#1', 'shave'), 10_000);
      console.log(`      buzzing: ${JSON.stringify(clip)}; washing the hands: ${JSON.stringify(hands)}; shaving: ${JSON.stringify(shave)}`);
      assert(clip.clippers && !clip.water && hands.tap && !hands.clippers && shave.tap && !shave.clippers, JSON.stringify({ clip, hands, shave }));
      const c = render(WORLD.clippers, { sampleRate: WORLD_RATE_HZ, name: 'clippers' }), m = measure(c, WORLD_RATE_HZ);
      console.log(`      the clippers: ${fmt(m.durS * 1000, 0)} ms loop at ${CLIPPER_HZ} Hz, centroid ${fmt(m.centroidHz, 0)} Hz, peak ${fmt(m.peakDb, 1)} dBFS`);
      assert(CLIPPER_HZ === 120 && m.centroidHz > 800 && m.centroidHz < 3500 && WORLD.clippers.loop, JSON.stringify(m));
      const cen = (k) => measure(render(WORLD[k], { sampleRate: 48000, name: k }), 48000).centroidHz;
      const ui = Object.fromEntries(Object.entries(UI_SOUNDS).map(([kind, rec]) => [kind, { rec, durMs: Math.round(WORLD[rec].durS * 1000), centroidHz: Math.round(cen(rec)) }]));
      console.log(`      the menu's: ${Object.entries(ui).map(([k, v]) => `${k} (${v.rec}) ${v.durMs} ms, centroid ${v.centroidHz} Hz`).join('; ')}`);
      assert(Object.keys(UI_SOUNDS).join() === 'move,check,uncheck,confirm,close' && ui.move.durMs === 12 && ui.check.centroidHz > ui.uncheck.centroidHz, JSON.stringify(ui));
      // (the 'ui' fact through the world's presenter: on the UI bus, its kind's recipe, counted)
      const shots = [], world = createWorld({ uiShot: (k) => { shots.push(k); return true; }, oneShot: () => true, loopOn: () => true, loopOff: () => true, duck: () => {} });
      for (const kind of ['move', 'check', 'uncheck', 'confirm', 'close', 'nonsense']) world.fact('ui', { kind }, null);
      assert(shots.join() === 'uiMove,uiCheck,uiUncheck,uiConfirm,uiClose' && world.stats.ui === 5 && world.stats.lastUi === 'close', JSON.stringify({ shots, stats: world.stats }));
    },
  },
  {
    name: 'the R-7 at 300 m in Melas air: your report, the crack of your round leaving, the strike\'s thump 0.42 + 0.93 = 1.35 s later (±10 ms: its flight and 300 m at the valley\'s speed of sound); a neighbour 5 m off a sound\'s way late; the defenders take the impulses, not the far strike; the KD\'s berm for the echo',
    fn() {
      const env = ENV_CLASSES['mars-valley'], c = soundMsOf(env), fl = flightOf('r7', 'ball', env, 300);
      const me = { x: 1300, z: 334.5 };
      const sv = strikeVoice({ me, at: { x: 1600, z: 334.5 }, rangeM: 300, tofS: fl.tofS, soundMs: c, ears: true }), open = strikeVoice({ me, at: { x: 1600, z: 334.5 }, tofS: fl.tofS, soundMs: c });
      console.log(`      the valley's air: ${fmt(c, 1)} m/s; the round to 300 m: ${fmt(fl.tofS, 3)} s at ${fmt(fl.vMs, 0)} m/s, ${fl.supersonic ? 'supersonic' : 'subsonic'}; the strike back at ${fmt(sv.delayS, 3)} s (${fmt(sv.gainDb, 1)} dB at ${fmt(sv.lowpassHz, 0)} Hz with the defenders, ${fmt(open.gainDb, 1)} without)`);
      near(c, 322, 1.5, 'the speed of sound on the valley floor');
      near(sv.delayS, 1.35, 0.01, 'the strike 1.35 s after the shot');
      near(sv.delayS, fl.tofS + 300 / c, 1e-9, 'its flight plus its distance at c');
      assert(sv.gainDb === open.gainDb && sv.gainDb < EARS_GATE_DB, `the far strike passes the defenders' gate: ${sv.gainDb}`);
      const near5 = strikeVoice({ me, at: { x: 1305, z: 334.5 }, tofS: 0.007, soundMs: c, ears: true }), near5o = strikeVoice({ me, at: { x: 1305, z: 334.5 }, tofS: 0.007, soundMs: c });
      console.log(`      a strike 5 m off: ${fmt(near5o.gainDb, 1)} dB open, ${fmt(near5.gainDb, 1)} through the defenders (an impulse over their gate ${EARS_GATE_DB} dB: down to it at most, low-passed at ${near5.lowpassHz} Hz)`);
      assert(near5o.gainDb > EARS_GATE_DB && near5.gainDb === Math.max(EARS_GATE_DB, near5o.gainDb + EARS_DB) && near5.lowpassHz === EARS_LP_HZ, JSON.stringify({ near5, near5o }));
      const k0 = crackVoice({ supersonic: true }), k1 = crackVoice({ supersonic: true, ears: true }), sub = crackVoice({ supersonic: false });
      console.log(`      the crack leaving: ${fmt(k0.gainDb, 1)} dB open (source +${CRACK_SOURCE_DB}), ${fmt(k1.gainDb, 1)} through the defenders; a subsonic round: ${sub}`);
      assert(Math.abs(k0.gainDb - k1.gainDb + EARS_DB) < 1e-9 && sub === null && k0.gainDb < REPORT_SOURCE_DB, JSON.stringify({ k0, k1 }));
      const mine = reportVoice({ me, mine: true, ears: true, soundMs: c }), n5 = reportVoice({ me, muzzle: { x: 1300.9, z: 339.5 }, mine: false, ears: true, soundMs: c });
      console.log(`      your report ${fmt(mine.gainDb, 1)} dB at once; a neighbour 5 m off ${fmt(n5.gainDb, 1)} dB, ${fmt(n5.delayS * 1000, 1)} ms late, pan ${fmt(n5.pan, 2)}; the echo off the KD's berm (x ${KD_BERM_FACE_X}) ${fmt(mine.echo.delayS, 3)} s after (${fmt(mine.echo.pathM, 0)} m)`);
      near(n5.delayS, n5.distM / c, 1e-9, 'a neighbour a sound\'s way late');
      assert(mine.delayS === 0 && bermFor(1300) === KD_BERM_FACE_X && bermFor(1100) === BERM_FACE_X && Math.abs(mine.echo.pathM - 2 * (KD_BERM_FACE_X - 1300)) < 1e-9, JSON.stringify(mine.echo));
      const pa0 = chimeVoice({ me: { x: 1100, z: 292.5 } }), pa1 = chimeVoice({ me: { x: 1100, z: 292.5 }, ears: true });
      console.log(`      the tower's speaker: ${fmt(pa0.lowpassHz, 0)} Hz open, ${fmt(pa1.lowpassHz, 0)} Hz through the defenders' circuit, ${fmt(pa1.gainDb, 1)} dB both`);
      assert(pa1.lowpassHz === EARS_LP_HZ && pa1.gainDb === pa0.gainDb, JSON.stringify({ pa0, pa1 }));
      const car = carrierVoice({ me, at: { x: 1603.5, z: 334.5 }, soundMs: c, ears: true }), carIn = carrierVoice({ me: { x: 1605, z: 334.5 }, at: { x: 1603.5, z: 334.5 }, soundMs: c, ears: true, inPits: true });
      console.log(`      a carrier at 303.5 m under the parapet: ${fmt(car.gainDb, 1)} dB at ${fmt(car.lowpassHz, 0)} Hz, ${fmt(car.delayS, 2)} s late; in the pits beside it: ${fmt(carIn.gainDb, 1)} dB`);
      assert(car.gainDb < carIn.gainDb + PARAPET_DB && near1(car.delayS, 303.5 / c) && distLowpassHz(300) < distLowpassHz(40), JSON.stringify(car));
      const t = throughEars(-30, 4000, true);
      assert(t.gainDb === -30 && t.lowpassHz === 4000, 'a quiet sound passes the defenders untouched');
    },
  },
  {
    name: 'the relay never a wall of noise: twelve reports in 200 ms play at most six voices (two within 60 ms one), and a string\'s reports through createRange keep to the limit; your own report and echo always play on an empty line',
    fn() {
      const L = createReportLimiter();
      const verdicts = Array.from({ length: 12 }, (_, i) => L.admit(10 + i * (0.2 / 12)));
      console.log(`      12 reports 16.7 ms apart: ${verdicts.join(' ')}; played ${L.stats.played}, merged ${L.stats.merged}, refused ${L.stats.full}, the most at once ${L.stats.most} (limit ${REPORT_VOICES}, merge ${REPORT_MERGE_MS} ms)`);
      assert(L.stats.played <= REPORT_VOICES && L.stats.most <= REPORT_VOICES && L.stats.played >= 3, JSON.stringify(L.stats));
      const L2 = createReportLimiter(), spread = Array.from({ length: 12 }, (_, i) => L2.admit(20 + i * 0.07));
      console.log(`      12 reports 70 ms apart: played ${L2.stats.played}, refused ${L2.stats.full}, the most at once ${L2.stats.most}`);
      assert(L2.stats.most <= REPORT_VOICES && L2.stats.merged === 0 && spread.filter(v => v === 'play').length === L2.stats.played, JSON.stringify(L2.stats));
      // (through the presenter, on a fake engine and a clock that stands still: a relay of six firing together, twice, 100 ms apart)
      const played = [], engine = { shot: (kind, opts) => { played.push({ kind, ...opts }); return true; } };
      let nowS = 50;
      const range = createRange(engine, { looks: { kitLook: () => ({ ears: true }) }, clock: () => nowS });
      const state = { player: { id: 'p145', actor: 'a1' }, actors: { list: [{ id: 'a1', who: 'p145', x: 1300, z: 334.5 }] }, clock: { ms: 1000, holds: [] }, places: { live: { area: 'melas.ground' } } };
      for (let volley = 0; volley < 2; volley++) {
        for (let n = 0; n < 6; n++) range.fact('shot', { who: `p${150 + n}`, fired: true, muzzle: { x: 1300.9, z: 334.5 + (n - 2.5) * 5 }, face: { paper: 'kdA', lane: 7 + n, line: 300 }, flight: { rangeM: 300, tofS: 0.42, supersonic: true } }, state);
        nowS += 0.1;
      }
      const reports = played.filter(p => p.kind === 'report'), strikes = played.filter(p => p.kind === 'impact');
      console.log(`      two volleys of six: ${reports.length} reports and echoes played of 24 heard, ${range.stats.voices.merged} merged, ${range.stats.voices.full} refused; ${strikes.length} strikes; no crack (none was yours: ${played.filter(p => p.kind === 'crack').length})`);
      assert(range.stats.voices.most <= REPORT_VOICES && reports.length < 24 && played.every(p => p.kind !== 'crack'), JSON.stringify(range.stats.voices));
      // (your own shot on an empty line: the report, its echo, the crack, the strike)
      const p2 = [], r2 = createRange({ shot: (kind, opts) => { p2.push({ kind, ...opts }); return true; } }, { looks: { kitLook: () => ({ ears: true }) }, clock: () => 0 });
      r2.fact('shot', { who: 'p145', fired: true, muzzle: { x: 1300.9, z: 334.5 }, face: { paper: 'kdA', lane: 10, line: 300 }, flight: { rangeM: 300, tofS: 0.42, supersonic: true } }, state);
      console.log(`      your shot at 300 m: ${p2.map(p => `${p.kind}${p.delayS ? ` +${fmt(p.delayS, 3)} s` : ''}`).join(', ')}`);
      assert(p2.map(p => p.kind).join() === 'report,report,crack,impact' && Math.abs(p2[3].delayS - (0.42 + 300 / soundMsOf(ENV_CLASSES['mars-valley']))) < 0.02, JSON.stringify(p2));
      // (test-handling's card at 25 m, a shot with no face: the report and its echo only, as v0.0.6 played it)
      const p3 = [], r3 = createRange({ shot: (kind, opts) => { p3.push({ kind, ...opts }); return true; } }, { looks: { kitLook: () => ({ ears: true }) }, clock: () => 0 });
      r3.fact('shot', { who: 'p145', fired: true, muzzle: { x: 1100.9, z: 292.5 }, face: null, flight: { rangeM: 25, tofS: 0.03, supersonic: true } }, { ...state, actors: { list: [{ id: 'a1', who: 'p145', x: 1100, z: 292.5 }] } });
      assert(p3.map(p => p.kind).join() === 'report,report', JSON.stringify(p3));
    },
  },
  {
    name: 'the pairs pad on the game clock: a turner\'s motor from its turn and its clack TURN_MS later, at the stand; the timer\'s beep once as the targets turn; the steel\'s ring where the armoured face stands, a sound\'s way late; a Pair\'s two reports its split apart (each waiting its place in its tick), a single Fire\'s at once; nothing while time stands still',
    fn() {
      const played = [];
      const engine = { shot: (kind, opts) => { played.push({ kind, ...opts }); return true; } };
      // (the audio clock running with the game's here, as it does in play: the reports' voices count on it)
      let nowS = 0;
      const range = createRange(engine, { looks: { kitLook: () => ({ ears: true }) }, clock: () => nowS });
      const T2 = { key: 'turner:2', lane: 2, x: 1124, z: 286.5 }, T1 = { key: 'turner:1', lane: 1, x: 1124, z: 283.5 };
      const state = { player: { id: 'p145', actor: 'a1' }, actors: { list: [{ id: 'a1', who: 'p145', x: 1117, z: 286.5 }] }, clock: { ms: 1000, holds: [] }, armoury: { range: { course: 'pairs', turners: [T1, T2] } } };
      const at = (ms, held = false, alpha = 0) => { state.clock.ms = ms; nowS = ms / 1000; state.clock.holds = held ? ['stop'] : []; range.frame(state, { alpha }); return played.map(p => p.kind); };
      at(1000);
      // (string 1's two turners turn on one tick: two motors, two clacks, one beep)
      for (const t of [T1, T2]) range.fact('turner', { key: t.key, lane: t.lane, phase: 'turn', face: 'threat', atMs: 2000, toMs: 2300, why: 'standby', x: t.x, z: t.z }, state);
      const k0 = at(1990).length, atTurn = at(2000).slice(k0), mid = at(2200).length, atStop = at(2300).slice(mid);
      const motor = played.find(p => p.kind === 'turnerMotor'), beep = played.find(p => p.kind === 'timerBeep');
      console.log(`      the turn at 2,000 ms: ${atTurn.join(', ')}; at its stop, 2,300: ${atStop.join(', ')}; the motor ${fmt(motor.gainDb, 1)} dB +${fmt(motor.delayS * 1000, 0)} ms, the beep ${fmt(beep.gainDb, 1)} dB pan ${fmt(beep.pan, 2)}`);
      assert(atTurn.filter(k => k === 'turnerMotor').length === 2 && atTurn.filter(k => k === 'timerBeep').length === 1 && atStop.join() === 'turnerClack,turnerClack', JSON.stringify({ atTurn, atStop }));
      const v = turnerVoice({ me: { x: 1117, z: 286.5 }, at: T2 });
      assert(Math.abs(v.distM - 7) < 1e-9 && Math.abs(v.delayS - 7 / SOUND_SPEED_MS) < 1e-9 && beepVoice().pan < 0, JSON.stringify(v));
      // (the clock standing a tick short, the frame 90% on: nothing until it runs past the turn)
      range.fact('turner', { key: T2.key, phase: 'away', atMs: 5000, toMs: 5300, x: T2.x, z: T2.z }, state);
      const n1 = played.length; at(4990, true, 0.9); const stood = played.length === n1; at(5010); const away = played.slice(n1).map(p => p.kind);
      assert(stood && away.join() === 'turnerMotor' && !played.slice(n1).some(p => p.kind === 'timerBeep'), JSON.stringify({ stood, away }));
      // (a Pair: its rounds at their formula times, 8,350 and 8,745 ms, their facts on the ticks at or after them (8,350 and 8,750):
      // each report waits its round's place in its tick, drawn a tick behind, so they sound 395 ms apart, not the ticks' 400)
      const shot = (atMs, row, extra = {}) => range.fact('shot', { who: 'p145', fired: true, atMs, muzzle: { x: 1117.9, y: 1.4, z: 286.5 }, row, ...extra }, state);
      at(8350); const n2 = played.length; shot(8350, { id: 'shot:pair', n: 2, i: 0 }); const r1 = played.slice(n2).find(p => p.kind === 'report');
      at(8750); const n3 = played.length; shot(8745, { id: 'shot:pair', n: 2, i: 1 }); const r2 = played.slice(n3).find(p => p.kind === 'report');
      const heard = (8750 + r2.delayS * 1000) - (8350 + r1.delayS * 1000);
      console.log(`      a Pair at 8,350 and 8,745 ms, its facts on the ticks at 8,350 and 8,750: the reports wait ${fmt(r1.delayS * 1000, 0)} and ${fmt(r2.delayS * 1000, 0)} ms, heard ${fmt(heard, 0)} ms apart (the split 395); ${range.stats.rowShots} rows' rounds`);
      assert(Math.abs(heard - 395) < 0.5 && range.stats.rowShots === 2, JSON.stringify({ r1, r2, heard }));
      // (a single Fire, no row: at once, as test-handling's)
      at(9000); const n4 = played.length; shot(9000, null); const single = played.slice(n4);
      assert(single[0]?.kind === 'report' && single[0].delayS === 0, JSON.stringify(single));
      // (the steel: a round that rang on the armoured face at lane 2, its ring there a flight and a sound's way later; one through it rings not)
      at(9500); const n5 = played.length; shot(9500, null, { ring: true, through: false, target: 'turner:2', flight: { tofS: 0.009 } });
      const ring = played.slice(n5).find(p => p.kind === 'steelRing');
      at(10500); const n6 = played.length; shot(10500, null, { ring: true, through: true, target: 'turner:2' });
      const rv = ringVoice({ me: { x: 1117, z: 286.5 }, at: T2, tofS: 0.009, ears: true });
      console.log(`      the ring at 7 m: ${fmt(ring.gainDb, 1)} dB (${fmt(rv.gainDb, 1)}), ${fmt(ring.lowHz, 0)} Hz, +${fmt(ring.delayS * 1000, 1)} ms; through the plate: ${played.slice(n6).some(p => p.kind === 'steelRing') ? 'a ring' : 'no ring'}; sources ${TURNER_SOURCE_DB}, ${BEEP_SOURCE_DB}, ${STEEL_SOURCE_DB} dB`);
      assert(ring && Math.abs(ring.delayS - (0.009 + 7 / SOUND_SPEED_MS)) < 0.002 && !played.slice(n6).some(p => p.kind === 'steelRing'), JSON.stringify(ring));
      // (the recipes: the beep a 2.9 kHz tone, the ring's partials over a kilohertz, the clack a short knock)
      const sr = 24000, cen = (k) => measure(render(RANGE[k], { sampleRate: sr, name: k }), sr);
      const b = cen('timerBeep'), r = cen('steelRing'), c = cen('turnerClack'), m = cen('turnerMotor');
      console.log(`      the beep ${fmt(b.centroidHz, 0)} Hz (its 2.9 kHz and its third), ${fmt(b.decayS * 1000, 0)} ms to −30 dB; the ring ${fmt(r.centroidHz, 0)} Hz, ${fmt(r.decayS * 1000, 0)} ms; the clack ${fmt(c.centroidHz, 0)} Hz, ${fmt(c.decayS * 1000, 0)} ms; the motor ${fmt(m.centroidHz, 0)} Hz, ${fmt(m.decayS * 1000, 0)} ms`);
      assert(b.centroidHz > 2500 && b.centroidHz < 4500 && b.decayS >= 0.25 && r.centroidHz > 1200 && r.decayS > 5 * c.decayS && c.decayS < 0.1 && m.decayS >= 0.25, JSON.stringify({ b, r, c, m }));
    },
  },
];

function near1(a, b) { return Math.abs(a - b) < 1e-9; }
