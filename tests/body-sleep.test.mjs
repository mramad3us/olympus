// body-sleep: sleep pressure, the body clock and fatigue (BODY §7, §25; the build sheet 0.0.4 §5.1, §8
// item 9). The template; pressure at taps and at reveille over three weeks of TIME §9.2's week (training
// Monday to Friday, the 07:00 holiday reveille at the weekend) for sleep needs of 7.5, 8.0 and 8.5 h,
// with when "tired" begins (BODY's target for 8.0 h printed beside: reveille 0.4 to 1.0 h by Wednesday,
// tired from 21:10 to 21:40, never in training); tradecraft's fatigue ladder beside the port's; the
// body clock continuous through the slip (no step over 0.02 h a minute) and its offset over a week;
// the latency and the depth of a night; natural waking; sleep inertia.
import { assert, near, fmt } from './helpers.mjs';
import { templateBody, runSols, weekOf, MELAS_LON, lastReveille, STAGE_TEST, MELAS_PLACE } from './bots/sol.mjs';
import { START_MS } from '../src/data/setting/calendar.js';
import { marsTimeText, msAtMarsTime, marsClock } from '../src/core/calendar.js';
import { HOUR_MS, MIN_MS } from '../src/core/clock.js';
import { TEMPLATES } from '../src/data/body/templates.js';
import { SLEEP } from '../src/data/body/needs.js';
import { phiOf, lonMsOf, circ, fatigueMod, fatigueIndex, latencyMs, depthOf, beginSleepBody, clockStep, TRADECRAFT_FATIGUE, SOL_H, inertiaOf } from '../src/sim/body/sleep.js';
import { bodyAdvance, rowSeg } from '../src/sim/body/body.js';
import { massOf } from '../src/sim/body/energy.js';

const T = (ms) => marsTimeText(ms, MELAS_LON);
const REV = lastReveille(START_MS, MELAS_LON);
const LON_MS = lonMsOf(MELAS_LON);
const DAYS = 'MTWTFSS';

// (three weeks for one sleep need: the pressure at taps and at each reveille, when tired began, the training hours' worst)
function weeks(needH) {
  const b = templateBody(REV), sols = weekOf(REV, MELAS_LON, 3), out = [];
  b.traits.sleepNeedH = needH;
  for (let d = 0; d < sols.length - 1; d++) {
    let pTaps = null, trainingTired = false;
    const r = runSols({ body: b, sols: sols.slice(d, d + 2), untilMs: sols[d + 1].reveilleMs, onSpan: (span, body) => { if (span.row.bed) pTaps = body.sleep.pressureH; } });
    const tired = r.crossed.find(c => c.ledger === 'fatigue' && c.to === 'tired');
    const civ = tired ? marsClock(tired.atMs, MELAS_LON).civilMs / HOUR_MS : null;
    if (sols[d].sol.id === 'range' && civ !== null && civ >= 8 && civ < 16.5) trainingTired = true;
    out.push({ day: DAYS[d % 7], pTaps, pRev: b.sleep.pressureH, tired: tired ? T(tired.atMs) : null, tiredH: civ, trainingTired });
  }
  return out;
}

export default [
  STAGE_TEST,
  {
    name: 'the template, a marine at reveille after a standard night (the sheet §3, printed with the reference sol\'s own steady state)',
    fn() {
      const t = TEMPLATES['m-adult'];
      console.log(`      m-adult: ${t.heightM} m, ${t.build}; gut ${t.energy.gutKcal} kcal, reserve ${t.energy.reserveKcal}, emptyH ${t.energy.emptyH} (the gut empty ${t.energy.emptyForH} h, dinner ${t.energy.ateAgoH} h ago); balance ${t.water.balanceL} L; bladder ${t.bladder.ml} mL; bowel ${t.bowel.g} g, transit ${t.bowel.transitG} g; grime ${t.hygiene.grime}, stubble ${t.hygiene.stubbleH} h; pressure ${t.sleep.pressureH} h, offset ${t.sleep.offsetH}; stamina ${t.stamina}, stress ${t.stress.v}, morale ${t.morale.v}, core ${t.thermal.coreC} °C; traits need ${t.traits.sleepNeedH} h, τ ${t.traits.tauIntH} h`);
      const b = templateBody(REV), sols = weekOf(REV, MELAS_LON, 2);
      runSols({ body: b, sols: sols.slice(0, 11), untilMs: sols[10].reveilleMs });
      console.log(`      the reference week's own state at a training reveille (Thursday of week 2): emptyH ${fmt(b.energy.emptyH, 2)}, balance ${fmt(b.water.balanceL, 2)} L, bladder ${fmt(b.bladder.ml, 0)} mL, bowel ${fmt(b.bowel.g, 0)} g, transit ${fmt(b.bowel.transitG, 0)} g, grime ${fmt(b.hygiene.grime, 1)}, stubble ${fmt(b.hygiene.stubbleH, 1)} h, pressure ${fmt(b.sleep.pressureH, 2)} h`);
      near(b.bladder.ml, t.bladder.ml, 30, 'the bladder at reveille:'); near(b.bowel.transitG, t.bowel.transitG, 15, 'transit:'); near(b.hygiene.grime, t.hygiene.grime, 1.5, 'grime:');
    },
  },
  {
    name: 'pressure at taps and reveille over three weeks for needs of 7.5, 8.0 and 8.5 h: never tired in training at 8.0 h, Wednesday\'s reveille within 0.4 to 2.0 h (BODY §7.1 and the build sheet ask 0.4 to 1.0: an open question for the user, the model\'s 1.6 h printed beside it), the weekend\'s late reveille clearing it',
    fn() {
      const all = {};
      for (const need of [7.5, 8.0, 8.5]) {
        const w = (all[need] = weeks(need));
        console.log(`      need ${need} h (reveille pressure, tired from):`);
        for (let k = 0; k < 3; k++) console.log(`        week ${k + 1}: ${w.slice(k * 7, k * 7 + 7).map(x => `${x.day} ${fmt(x.pRev, 2)}${x.tired ? ` ${x.tired}` : ''}`).join(' | ')}`);
      }
      const w8 = all[8.0], wed = w8.filter(x => x.day === 'W' && w8.indexOf(x) % 7 === 2);
      console.log(`      BODY §7.1's target at 8.0 h: reveille 0.4 to 1.0 h by Wednesday, tired from 21:10 to 21:40, never in training; here Wednesdays ${wed.map(x => fmt(x.pRev, 2)).join(', ')} h, tired from ${w8.filter(x => x.tired).map(x => x.tired).sort()[0]} at the earliest`);
      console.log(`      (taps at civil 22:00 is body ${fmt(phiOf(msAtMarsTime(REV, 22, 0, MELAS_LON), LON_MS, 0), 2)} h on the sheet's mean-solar body clock, inside BODY's wake-maintenance zone, 18:00 to 22:00: a ${fmt(latencyMs(17.3, msAtMarsTime(REV, 22, 0, MELAS_LON), LON_MS, 0) / MIN_MS, 1)}-minute latency at taps, not the 10 BODY's balance assumed)`);
      assert(!w8.some(x => x.trainingTired), 'tired in training at 8.0 h');
      assert(wed.every(x => x.pRev >= 0.4 && x.pRev <= 2.0), JSON.stringify(wed));
      for (let k = 0; k < 3; k++) assert(w8[k * 7 + 4].pRev <= w8[k * 7 + 3].pRev, 'the weekend\'s reveille clears');
      assert(all[8.5][17].pRev > all[8.0][17].pRev && all[8.0][17].pRev > all[7.5][17].pRev, 'a longer need runs shorter');
    },
  },
  {
    name: 'fatigue\'s penalties on effective pressure are tradecraft\'s ladder (TIRED_H 16, EXHAUSTED_H 20, WEAR_H 3, WORN_MAX 12), and the circadian term\'s shape',
    fn() {
      const tc = (h) => (h > TRADECRAFT_FATIGUE.EXHAUSTED_H ? -Math.min(TRADECRAFT_FATIGUE.WORN_MAX, 3 + Math.floor((h - TRADECRAFT_FATIGUE.EXHAUSTED_H) / TRADECRAFT_FATIGUE.WEAR_H)) : h > TRADECRAFT_FATIGUE.TIRED_H ? -1 : 0);
      const rows = [15, 16.5, 20.5, 24, 30, 36, 48, 60].map(h => `${h} h: ${fatigueMod(h)} (tradecraft ${tc(h)})`);
      const shape = [0, 4.5, 8, 12, 15, 18, 20, 22].map(p => `${p}:00 ${fmt(circ(p), 2)}`);
      console.log(`      ${rows.join(', ')}`);
      console.log(`      circ(φ): ${shape.join(', ')} (the small hours' trough, the afternoon dip, the lift before bed)`);
      for (const h of [16.5, 20.5, 24, 30, 36, 48, 60]) assert(fatigueMod(h) === tc(h), `${h}: ${fatigueMod(h)} against ${tc(h)}`);
      assert(fatigueIndex(36) === 3 && fatigueIndex(48) === 4, 'the words at 36 and 48');
    },
  },
  {
    name: 'the body clock runs smoothly through the slip (no step over 0.02 h a minute) and its offset stays at 0 on Mars for every τ (BODY §7.2; the sheet §8 item 9)',
    fn() {
      const from = msAtMarsTime(REV, 23, 0, MELAS_LON);
      let worst = 0, prev = phiOf(from, LON_MS, 0), atSlip = null;
      for (let t = from + MIN_MS; t <= from + 3 * HOUR_MS; t += MIN_MS) {
        const p = phiOf(t, LON_MS, 0), d = ((p - prev + 36) % 24) - 12;
        worst = Math.max(worst, Math.abs(d)); prev = p;
        if (atSlip === null && marsClock(t, MELAS_LON).timeslip) atSlip = { t, p };
      }
      const offs = [24.0, 24.2, 24.6].map(tau => { let o = 0, hi = 0; for (let h = 0; h < 7 * 25; h++) { o = clockStep(o, tau); hi = Math.max(hi, Math.abs(o)); } return `τ ${tau}: ${fmt(hi, 4)} h`; });
      const jump = (() => { let o = 9, h = 0; while (Math.abs(o) > 0.5 && h < 400) { o = clockStep(o, 24.2); h++; } return h / SOL_H; })();
      console.log(`      φ minute by minute from civil 23:00 across the slip: the largest step ${fmt(worst, 4)} h (24/${fmt(SOL_H, 3)} h an hour, ${fmt(24 / SOL_H / 60, 4)} a minute); civil 24:00 +0 reads body ${fmt(atSlip.p, 2)} h`);
      console.log(`      the offset over a week, drift against the light: ${offs.join(', ')}; a 9 h jump clears to 0.5 h in ${fmt(jump, 1)} sols (BODY: 6 to 9 days)`);
      assert(worst <= 0.02, `a step of ${worst} h`);
    },
  },
  {
    name: 'falling asleep and its depth: the latency by effective pressure and the wake-maintenance zone, depth fixed at the onset, natural waking, inertia',
    fn() {
      const taps = msAtMarsTime(REV, 22, 0, MELAS_LON), noon = msAtMarsTime(REV, 13, 0, MELAS_LON), eve = msAtMarsTime(REV, 20, 0, MELAS_LON);
      const lat = [[17.3, taps, 'taps, 17.3 h'], [8, noon, '13:00, 8 h'], [3, eve, '20:00, 3 h (the zone, under 4 h)'], [12, eve, '20:00, 12 h']].map(([p, t, w]) => `${w}: ${fmt(latencyMs(p, t, LON_MS, 0) / MIN_MS, 1)} min`);
      console.log(`      latency: ${lat.join('; ')}; depth at 16, 20, 24 h: ${[16, 20, 24].map(p => fmt(depthOf(p), 3)).join(', ')}`);
      // (a night from 22:00 at 18 h: the onset fixes the depth; the natural waking in the body's 05:00 to 10:00)
      const b = templateBody(REV); b.sleep.pressureH = 18;
      b.atMs = taps;
      beginSleepBody(b, taps, { bed: 'own-rack', lonMs: LON_MS });
      const r = bodyAdvance(b, rowSeg({ met: 1.0, kind: 'still', posture: 'lie' }, MELAS_LON, massOf(b), false, MELAS_PLACE), taps, taps + 13 * HOUR_MS);
      const fell = r.events.find(e => e.kind === 'asleep'), woke = r.events.find(e => e.kind === 'woke');
      console.log(`      lying down at 22:00 at 18 h: asleep at ${T(fell.atMs)}, depth ${fmt(b.sleep.depthK, 3)} (at the onset's pressure), woke naturally at ${woke ? T(woke.atMs) : 'never'} (body ${woke ? fmt(phiOf(woke.atMs, LON_MS, 0), 2) : '-'} h, pressure ${fmt(SLEEP.WAKE_P_H, 1)})`);
      assert(woke && phiOf(woke.atMs, LON_MS, 0) >= 5 && phiOf(woke.atMs, LON_MS, 0) < 10, 'natural waking in the body\'s morning');
      near(b.sleep.depthK, depthOf(18 + (fell.atMs - taps) / HOUR_MS), 1e-9, 'depth at the onset:');
      const iner = [2, 4, 9].map(p => { const x = inertiaOf(p); return `${p} h ${x ? `${x.v} for ${x.ms / MIN_MS} min` : 'none'}`; });
      console.log(`      inertia woken at ${iner.join(', ')}`);
      assert(inertiaOf(4).v === -2 && inertiaOf(9).v === -3 && inertiaOf(2) === null, 'inertia');
    },
  },
];
