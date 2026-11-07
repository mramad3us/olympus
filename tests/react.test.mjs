// The take-in, the one helper of how long a marine takes to take in what he has just seen (src/sim/combat/react.js; COMBAT §25.4.2 to §25.4.4; the build sheet 0.0.8 §4, §5.1).
//
// The bay's table (the build sheet's §4) and COMBAT §25.4.3's two tables are printed from the code and held exactly;
// the floors (0.15 s alert, 0.25 s a true surprise: COMBAT §25.16 question 12's default, "All good defaults", the
// user, 2026-11-07), the tier one's one tick only where expected ("sub .1s for tier 1 operator vs maybe 0.8+ for
// recruit", the user, 2026-11-07), a natural 1 at most ×1.5 where a 2 passes, monotonic in Warfighting, whole ticks.
// Then lived: on the bay at 1:1, each test sheet's turner seen 100 ms into its turn and the pause on the tick
// seenMs + the take-in, the window's k closing linearly.
import { assert, fmt } from './helpers.mjs';
import { takeInOf, coreMs, ticks, severalK, lightK, bodyK, goMs, takeInWords, expectOf, EXPECT, EXPECT_ORDER, NOTICE_K, ALERT_FLOOR_MS, SURPRISE_FLOOR_MS, SECTOR_HALF_DEG, VIGIL_MS } from '../src/sim/combat/react.js';
import { grade } from '../src/sim/skills/checks.js';
import { TEST_SHEETS } from '../src/sim/skills/templates.js';
import { contactNow } from '../src/sim/combat/contact.js';
import { bayGame, turn, runTo, LANE, laneZ, TURNER_X } from './contact-world.mjs';

// (the build sheet's §4 bay table: core, sector, alert, alert 2, sector 2, sector 3, sector a miss, alert a miss, area, surprise)
const BAY = {
  recruit: [649, 650, 1300, 1500, 750, 800, 950, 1950, 950, 1950],
  private: [536, 550, 1050, 1250, 600, 650, 800, 1600, 800, 1600],
  cpl: [335, 350, 650, 750, 400, 400, 500, 1000, 500, 1000],
  sgt: [250, 250, 500, 550, 300, 300, 350, 750, 350, 750],
  raider: [93, 100, 200, 200, 100, 100, 150, 300, 150, 300],
  tierone: [33, 50, 150, 150, 50, 50, 50, 150, 50, 250],
};
const bayRow = (wf) => [Math.round(coreMs(wf)), ...[['sector'], ['alert'], ['alert', 2], ['sector', 2], ['sector', 3], ['sector', 1, 'miss'], ['alert', 1, 'miss'], ['area'], ['surprise']]
  .map(([expect, n = 1, g = 'pass']) => takeInOf({ wf, expect, n, grade: g }).ms)];

// (COMBAT §25.4.3's first table: the tier, WF, AWR; passed then the mean over the Awareness die, at 4 m, lit, rested, Combat)
const TIERS = [['boot recruit', 6, 2], ['private', 15, 6], ['lance corporal', 27, 9], ['corporal', 34, 11], ['sergeant', 44, 14], ['staff sergeant', 52, 17], ['recon', 56, 24],
  ['Raider at the ITC floor', 65, 27], ['Raider, five years', 70, 30], ['tier one at its floor', 86, 35], ['tier one, middle', 93, 40]];
const C1 = {   // [sector, mean], [room, mean], [alert, mean], [surprise, mean], a room natural 1
  'boot recruit': [650, 695, 950, 1075, 1300, 1463, 1950, 2188, 1450], private: [550, 563, 800, 820, 1050, 1078, 1600, 1640, 1200],
  'lance corporal': [400, 410, 600, 615, 800, 820, 1200, 1230, 900], corporal: [350, 358, 500, 513, 650, 668, 1000, 1025, 750],
  sergeant: [250, 255, 350, 360, 500, 513, 750, 768, 550], 'staff sergeant': [200, 205, 300, 308, 400, 408, 550, 565, 450],
  recon: [150, 155, 250, 255, 350, 358, 500, 513, 350], 'Raider at the ITC floor': [100, 103, 150, 155, 250, 255, 350, 358, 250],
  'Raider, five years': [100, 103, 150, 153, 200, 205, 300, 305, 200], 'tier one at its floor': [50, 50, 50, 53, 150, 150, 250, 250, 100],
  'tier one, middle': [50, 50, 50, 53, 150, 150, 250, 250, 100],
};
// (the mean over the d20 of a notice check at 4 m: DC 8, −2 in his sector)
const meanOver = (wf, awr, expect) => {
  const dc = 8 + Math.round(4 / 10) + (expect === 'sector' ? -2 : 0);
  let sum = 0;
  for (let r = 1; r <= 20; r++) { const nat = r === 20 ? 20 : r === 1 ? 1 : 0; sum += takeInOf({ wf, expect, grade: grade(r + awr - dc, nat) }).ms; }
  return Math.round(sum / 20);
};
// (COMBAT §25.4.3's factors table: the case and its inputs; the columns private a room, Raider (5 y) his sector and a room, tier one his sector and a room)
const COLS = [[15, 'area'], [70, 'sector'], [70, 'area'], [93, 'sector'], [93, 'area']];
const FACTORS = [
  ['as above', {}, [800, 100, 150, 50, 50]], ['who ×1.5', { whoK: 1.5 }, [1200, 150, 200, 50, 100]], ['two ×1.15', { n: 2 }, [900, 100, 150, 50, 50]],
  ['four ×1.30', { n: 4 }, [1050, 100, 200, 50, 50]], ['Relaxed ×1.25', { stanceK: 1.25 }, [1000, 100, 150, 50, 50]], ['Assault ×1.1', { stanceK: 1.1 }, [900, 100, 150, 50, 50]],
  ['dim ×1.13', { lightK: lightK(0.405) }, [900, 100, 150, 50, 50]], ['dark ×1.30', { lightK: lightK(0.15) }, [1050, 100, 200, 50, 50]],
  ['tired ×1.06', { bodyK: bodyK([{ v: -1 }]) }, [850, 100, 150, 50, 50]], ['exhausted ×1.18', { bodyK: bodyK([{ v: -3 }]) }, [950, 100, 150, 50, 50]],
  ['band 1 +200', { band: 1 }, [1000, 300, 350, 250, 250]], ['band 3 +600', { band: 3 }, [1400, 700, 750, 650, 650]], ['behind ×1.3', { behindK: 1.3 }, [1050, 100, 200, 50, 50]],
];

export default [
  {
    name: 'the bay\'s table (the build sheet §4) from the code, exactly: the recruit 650 in his sector and 1,300 alert, the private 550 and 1,050, the tier one 50 and 150; "sub .1s for tier 1 operator vs maybe 0.8+ for recruit" (the user, 2026-11-07)',
    fn() {
      console.log('      sheet (WF)       core  sector  alert  alert2  sector2  sector3  sec-miss  alert-miss  area  surprise');
      const bad = [];
      for (const [tier, want] of Object.entries(BAY)) {
        const wf = TEST_SHEETS[tier].wf, got = bayRow(wf);
        console.log(`      ${`${tier} (${wf})`.padEnd(16)} ${got.map((v, i) => String(v).padStart([5, 7, 7, 8, 9, 9, 10, 12, 6, 10][i])).join('')}`);
        if (got.join() !== want.join()) bad.push(`${tier}: ${got.join()} against ${want.join()}`);
      }
      console.log(`      severalK 2 ${fmt(severalK(2), 3)}, 3 ${fmt(severalK(3), 3)}, 4 ${fmt(severalK(4), 3)}; goMs: the private ${goMs(15)}, the recruit ${goMs(6)}, the tier one ${goMs(93)}`);
      assert(!bad.length, bad.join('\n'));
      assert(takeInWords(550) === '0.55' && takeInWords(50) === '0.05' && takeInWords(1250) === '1.25', 'the formatter');
      assert(goMs(15) === 235 && goMs(93) === 157 && goMs(6) === 244 && goMs(200) === 150, 'the body\'s go');
    },
  },
  {
    name: 'COMBAT §25.4.3\'s two tables from the code, exactly: by tier and expectation, passed and the mean over the die (at 4 m: the private 800 in a room, 1,200 on a natural 1); and every factor (who, several, stance, light, the body, suppression, behind)',
    fn() {
      console.log('      tier                     WF  core   sector      room        alert       surprise    room nat 1');
      const bad = [];
      for (const [name, wf, awr] of TIERS) {
        const order = ['sector', 'area', 'alert', 'surprise'];
        const row = order.flatMap(e => [takeInOf({ wf, expect: e }).ms, meanOver(wf, awr, e)]);
        const nat1 = takeInOf({ wf, expect: 'area', grade: grade(1 + awr - 8, 1) }).ms;
        console.log(`      ${name.padEnd(24)} ${String(wf).padStart(3)} ${String(Math.round(coreMs(wf))).padStart(5)}  ${order.map((e, i) => `${row[2 * i]} / ${row[2 * i + 1]}`.padEnd(12)).join('')}${nat1}`);
        const got = [...row, nat1].join(), want = C1[name].join();
        if (got !== want) bad.push(`${name}: ${got} against ${want}`);
      }
      console.log('      case               private room  Raider sector  Raider room  tier one sector  tier one room');
      for (const [why, o, want] of FACTORS) {
        const got = COLS.map(([wf, expect]) => takeInOf({ wf, expect, ...o }).ms);
        console.log(`      ${why.padEnd(18)} ${got.map((v, i) => String(v).padStart([12, 15, 13, 17, 15][i])).join('')}`);
        if (got.join() !== want.join()) bad.push(`${why}: ${got.join()} against ${want.join()}`);
      }
      console.log(`      lightK dim ${fmt(lightK(0.405), 2)} dark ${fmt(lightK(0.15), 2)}; bodyK tired ${fmt(bodyK([{ v: -1 }]), 2)} exhausted ${fmt(bodyK([{ v: -3 }]), 2)}`);
      assert(!bad.length, bad.join('\n'));
      assert(takeInOf({ wf: 15, expect: 'area' }).ms === 800 && takeInOf({ wf: 15, expect: 'area', grade: 'miss' }).ms === 1200, 'the private in a room');
      const t1 = ['sector', 'area', 'alert', 'surprise'].map(e => takeInOf({ wf: 93, expect: e }).ms);
      assert(t1.join() === '50,50,150,250', `the tier one: ${t1}`);
    },
  },
  {
    name: 'the floors hold for everyone and every roll (no surprise under 250 ms, no alert under 150); a natural 1 never costs more than ×1.5 where a 2 passes; monotonic in Warfighting; every result whole ticks, 50 the least; the parts name every term',
    fn() {
      let checked = 0, minSurprise = Infinity, minAlert = Infinity, nat1Worst = 0, monoBad = [], tickBad = [];
      for (const g of Object.keys(NOTICE_K)) for (const e of EXPECT_ORDER) {
        let prev = Infinity;
        for (let wf = 0; wf <= 100; wf++) {
          const { ms } = takeInOf({ wf, expect: e, grade: g });
          checked++;
          if (e === 'surprise') minSurprise = Math.min(minSurprise, ms);
          if (e === 'alert') minAlert = Math.min(minAlert, ms);
          if (ms > prev) monoBad.push(`${g} ${e} WF ${wf}: ${ms} after ${prev}`);
          if (ms % 50 || ms < 50) tickBad.push(`${g} ${e} WF ${wf}: ${ms}`);
          prev = ms;
        }
      }
      // (a natural 1 where a 2 would pass: every Awareness 0 to 46 against every DC 5 to 20)
      for (let awr = 0; awr <= 46; awr++) for (let dc = 5; dc <= 20; dc++) if (2 + awr >= dc) nat1Worst = Math.max(nat1Worst, NOTICE_K[grade(1 + awr - dc, 1)]);
      console.log(`      ${checked} cases (6 grades × 4 expectations × WF 0 to 100): the least surprise ${minSurprise} ms (floor ${SURPRISE_FLOOR_MS}), the least alert ${minAlert} ms (floor ${ALERT_FLOOR_MS}); a natural 1 where a 2 passes costs at most ×${nat1Worst}`);
      console.log(`      EXPECT ${EXPECT_ORDER.map(e => `${e} ×${EXPECT[e].k}${EXPECT[e].floorMs ? ` (≥ ${EXPECT[e].floorMs})` : ''}`).join(', ')}; NOTICE_K ${Object.entries(NOTICE_K).map(([g, k]) => `${g} ×${k}`).join(', ')}; ticks(24) ${ticks(24)}, ticks(76) ${ticks(76)}`);
      assert(minSurprise >= 250 && minAlert >= 150 && nat1Worst <= 1.5, JSON.stringify({ minSurprise, minAlert, nat1Worst }));
      assert(!monoBad.length && !tickBad.length, [...monoBad, ...tickBad].slice(0, 5).join('\n'));
      const t = takeInOf({ wf: 15, expect: 'alert', grade: 'miss', n: 2, whoK: 1.5, band: 1, behindK: 1.3 });
      console.log(`      the private, alert, a miss, two, hands unseen, behind, band 1: ${t.ms} ms from ${t.rawMs}: ${t.parts.map(p => `${p.why} ${p.k !== undefined ? `×${p.k}` : `${p.ms} ms`}`).join(', ')}`);
      assert(t.parts.length === 7 && t.parts[0].why === 'Warfighting 15' && t.parts[0].ms === 536, JSON.stringify(t.parts));
    },
  },
  {
    name: 'lived at 1:1 on the bay, each test sheet: the turner seen 100 ms into its turn, the window\'s k closing linearly, the pause on the tick seenMs + the take-in (in his sector at 7 m, and alert on the next lane)',
    fn() {
      const bad = [];
      for (const tier of Object.keys(TEST_SHEETS)) for (const [lane, want] of [[LANE, 'sector'], [LANE + 1, 'alert']]) {
        const { g, t0 } = bayGame({ tier });
        turn(g, [lane], t0);
        const ks = [];
        runTo(g, s => { const c = contactNow(s); if (c?.pending) ks.push(c.pending.k); return !!c?.last; });
        const s = g.state, c = contactNow(s).last, wf = TEST_SHEETS[tier].wf;
        const formula = takeInOf({ wf, expect: c.expect, grade: c.grade, n: 1 }).ms;
        const linear = ks.every((k, i) => i === 0 || Math.abs(k - ks[i - 1] - 50 / c.ms) < 1e-9 || k === 1);
        const row = { tier, lane, expect: c.expect, grade: c.grade, seen: c.seenMs - t0, pause: s.clock.ms - c.seenMs, ms: c.ms, formula, held: s.clock.holds.join(), via: s.stop?.via, pick: s.stop?.pick };
        console.log(`      ${tier.padEnd(8)} lane ${lane} (${c.expect.padEnd(6)}, ${c.grade.padEnd(5)}): seen at +${row.seen} ms, the pause ${row.pause} ms later (${takeInWords(row.pause)} s; the formula ${formula}), held [${row.held}], via ${row.via}, the bracket on ${row.pick}; k ${ks.map(k => fmt(k, 2)).join(' ')}`);
        if (row.seen !== 100 || row.pause !== c.ms || c.ms !== formula || c.expect !== want || row.held !== 'stop' || row.via !== 'contact' || row.pick !== `turner:${lane}` || !linear || g.errors.length) bad.push(JSON.stringify(row));
      }
      assert(!bad.length, bad.join('\n'));
    },
  },
  {
    name: 'the expectation on the bay (the build sheet §8 item 5): within 20° of the muzzle at the ready on a course of fire your sector (your lane from 7 m, the next lanes 16.7° off from 10 m), beyond it alert (23.2° from 7 m); the sector held 30 s after the latest cue; slung, no sector; the course over, a surprise; aimed, a sector anywhere',
    fn() {
      const rows = [], bad = [];
      const at = (lane) => ({ x: TURNER_X, z: laneZ(lane) });
      const ask = (why, setup, lane, want) => {
        const { state: s, pid, R } = bayGame({ line: setup.line ?? 7 });
        setup.fn?.(s, R, pid);
        const got = expectOf(s, pid, at(lane), s.clock.ms), me = s.actors.list.find(a => a.who === pid);
        const off = Math.abs(Math.atan2(at(lane).z - me.z, at(lane).x - me.x)) * 180 / Math.PI;
        rows.push(`${why}: lane ${lane} ${fmt(off, 1)}° off, ${got}`);
        if (got !== want) bad.push(`${why}: ${got} (want ${want})`);
      };
      ask('7 m, low ready', {}, LANE, 'sector');
      ask('7 m, low ready', {}, LANE + 1, 'alert');
      ask('10 m, low ready', { line: 10 }, LANE + 1, 'sector');
      ask('10 m, low ready', { line: 10 }, LANE + 2, 'alert');
      ask('7 m, the last cue 31 s ago', { fn: (s, R) => { R.cmd = { id: 'standby', i: 0, atMs: s.clock.ms - VIGIL_MS - 1000 }; } }, LANE, 'alert');
      ask('7 m, a cue noted now', { fn: (s, R) => { R.cmd = { id: 'standby', i: 0, atMs: s.clock.ms - VIGIL_MS - 1000 }; R.cueAtMs = s.clock.ms; } }, LANE, 'sector');
      ask('7 m, slung', { fn: (s, R, pid) => { s.people[pid].kit.carry.posture = 'slungFront'; } }, LANE, 'alert');
      ask('7 m, the course over', { fn: (s, R) => { R.end = 'clear'; } }, LANE, 'surprise');
      ask('7 m, aimed, the course over', { fn: (s, R, pid) => { R.end = 'clear'; s.people[pid].kit.carry.posture = 'aimed'; } }, LANE, 'sector');
      console.log(`      SECTOR_HALF_DEG ${SECTOR_HALF_DEG}, VIGIL_MS ${VIGIL_MS}:`);
      for (const r of rows) console.log(`        ${r}`);
      assert(!bad.length, bad.join('\n'));
    },
  },
];
