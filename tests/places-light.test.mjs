// places-light: the light, from the one helper (src/sim/places/light.js), and the sun at Melas that
// it and the stage read (src/sim/places/sun.js), with the wall clocks (clocks.js) that the watch must
// agree with (the build sheet 0.0.3 §5.1; TIME §2.5; PLACES §3.9, §3.15; VIEWS §2.7; CONTRACTS §3, §4).
// It prints the bay's light through a day and a night, the head's, the company street's from before
// dawn to after dark, the sun every half hour through Sol 590, the sunrise and sunset over a flat and
// over the canyon's horizon at five seasons (for PLACES §3.15's reprint, CONTRACTS §19 item 11), the
// horizon round the compass, and what a call costs.
import { assert, near, fmt, machine } from './helpers.mjs';
import { lightLevel, lampsOf, skyAt, lightingOf, clockLighting } from '../src/sim/places/light.js';
import { sunAt, sunTimes, horizonAt } from '../src/sim/places/sun.js';
import { wallClockAt } from '../src/sim/places/clocks.js';
import { marsClock, lsDeg } from '../src/sim/time/dates.js';
import { solStartMs, marsTimeText } from '../src/core/calendar.js';
import { HOUR_MS, MIN_MS, SOL_MS } from '../src/core/clock.js';
import { START_MS, SITES, MARS_YEAR_MS, LS_EPOCH_DEG } from '../src/data/setting/calendar.js';
import { stream, int } from '../src/core/rng.js';

const LON = SITES.melas.lonEDeg, E1 = 'melas.echo.1', G = 'melas.ground', ST = {};
const SOL0 = solStartMs(START_MS, LON);                             // (Sol 590's civil 00:00, the start's sol)
const at = (h, m = 0, s = 0, sol = 0) => SOL0 + sol * SOL_MS + h * HOUR_MS + m * MIN_MS + s * 1000;
const hm = (ms) => marsTimeText(ms, LON);
const AISLE = [54.8, 3.95], RED = [59.3, 6.5], HEAD = [60.0, 13.5], STREET = [530, 224];
// (the first game time after the epoch at which Ls is a value)
const atLs = (ls) => Math.round((((ls - LS_EPOCH_DEG) % 360 + 360) % 360) / 360 * MARS_YEAR_MS);

export default [
  {
    name: 'the bay through a day and a night: 0.75 at 12:00, 0.65 at 21:00, the aisle at most 0.06 at 23:00 and the fire watch\'s red lamp at least 0.25 in its core; the head 0.65 at every hour (VIEWS §2.7, the sheet\'s §4)',
    fn() {
      const rows = [];
      for (const [label, ms] of [['12:00', at(12)], ['21:00', at(21)], ['23:00', at(23)], ['05:20', at(5, 20, 0, 1)], ['05:31', at(5, 31, 0, 1)]]) {
        const a = lightLevel(ST, ...AISLE, ms, E1), r = lightLevel(ST, ...RED, ms, E1), h = lightLevel(ST, ...HEAD, ms, E1);
        rows.push({ label, a, r, h, state: lightingOf(ST, E1, 'e1.bay-2-1', ms) });
      }
      for (const r of rows) console.log(`      ${r.label} (${r.state.padEnd(9)}): bay-2-1's aisle (${AISLE}) ${fmt(r.a, 4)}, the red lamp's core (${RED}) ${fmt(r.r, 4)}, head-2a ${fmt(r.h, 4)}`);
      const [noon, nine, eleven, early, morning] = rows;
      assert(noon.a === 0.75 && nine.a === 0.65 && eleven.a <= 0.06 && eleven.r >= 0.25, JSON.stringify(rows));
      assert(rows.every(r => r.h === 0.65), `the head: ${rows.map(r => r.h).join(', ')}`);
      assert(early.state === 'lightsOut' && morning.state === 'day' && morning.a === 0.75, JSON.stringify({ early, morning }));
    },
  },
  {
    name: 'the lamps flip exactly at taps, 22:00:00, and at reveille, 05:30:00 (07:00 on Saturday and Sunday), and lampsOf hands back the same array until a lamp changes',
    fn() {
      const flips = [];
      for (const [h, m, sol] of [[22, 0, 0], [5, 30, 1]]) {
        const t = at(h, m, 0, sol), before = lampsOf(ST, E1, t - 50), after = lampsOf(ST, E1, t);
        const red = (L) => L.find(l => l.kind === 'red').on, ceil = (L) => L.filter(l => l.kind === 'ceiling' && l.room === 'e1.bay-2-1').every(l => l.on);
        flips.push({ at: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`, before: `${clockLighting('melas', t - 50)} red ${red(before)} panels ${ceil(before)}`, after: `${clockLighting('melas', t)} red ${red(after)} panels ${ceil(after)}`, ok: red(before) !== red(after) && ceil(before) !== ceil(after) });
      }
      // (a Saturday's reveille: Sol 595 is a Saturday on SETTING's week)
      let sat = 0;
      while (marsClock(at(6, 0, 0, sat), LON).weekday !== 5) sat++;
      const weekend = [clockLighting('melas', at(6, 59, 59, sat)), clockLighting('melas', at(7, 0, 0, sat))];
      const same = lampsOf(ST, E1, at(23)) === lampsOf(ST, E1, at(23, 40)), differs = lampsOf(ST, E1, at(23)) !== lampsOf(ST, E1, at(12));
      for (const f of flips) console.log(`      ${f.at}: 50 ms before ${f.before}; at it ${f.after}`);
      console.log(`      Saturday (Sol ${marsClock(at(6, 0, 0, sat), LON).solOfYear}): 06:59:59 ${weekend[0]}, 07:00:00 ${weekend[1]}; lampsOf at 23:00 and 23:40 the same array ${same}, at 12:00 another ${differs}; ${lampsOf(ST, E1, at(23)).length} lamps on Echo's ground floor, ${lampsOf(ST, E1, at(23)).filter(l => l.on && l.r > 0).length} pools lit at 23:00`);
      assert(flips.every(f => f.ok), JSON.stringify(flips));
      assert(weekend[0] === 'lightsOut' && weekend[1] === 'day' && same && differs, JSON.stringify({ weekend, same, differs }));
    },
  },
  {
    name: 'the company street from before dawn to after dark: its level steps up as the canyon\'s wall uncovers the sun, and the street lamps light it at night',
    fn() {
      const ter = sunTimes('melas', at(12, 0, 0, 1)), flat = sunTimes('melas', at(12, 0, 0, 1), { terrain: false });
      const times = [['05:30', at(5, 30, 0, 1)], ['05:40', at(5, 40, 0, 1)], ['rise − 1 min', ter.riseMs - MIN_MS], ['the canyon\'s rise', ter.riseMs], ['rise + 1 min', ter.riseMs + MIN_MS],
        ['06:00', at(6, 0, 0, 1)], ['12:00', at(12, 0, 0, 1)], ['set − 1 min', ter.setMs - MIN_MS], ['set + 1 min', ter.setMs + MIN_MS], ['23:00', at(23, 0, 0, 1)]];
      const rows = times.map(([label, ms]) => { const s = sunAt('melas', ms), k = skyAt('melas', ms); return { label, t: hm(ms), level: lightLevel(ST, ...STREET, ms, G), sky: k.level, elev: s.elevDeg, hz: s.horizonDeg, eclipsed: s.eclipsed, sunK: k.sunK, shadow: k.shadow }; });
      const lamp = lightLevel(ST, 540, 220.6, at(23, 0, 0, 1), G), lampDay = lightLevel(ST, 540, 220.6, at(12, 0, 0, 1), G);
      for (const r of rows) console.log(`      ${r.label.padEnd(17)} ${r.t}: the street (${STREET}) ${fmt(r.level, 4)}; the sun ${fmt(r.elev, 3)}° over a horizon of ${fmt(r.hz, 3)}°${r.eclipsed ? ', hidden' : ''}; key light ${fmt(r.sunK, 3)}, shadows ${fmt(r.shadow, 2)}`);
      console.log(`      Sol 591: flat sunrise ${hm(flat.riseMs)}, the canyon's ${hm(ter.riseMs)} (${fmt((ter.riseMs - flat.riseMs) / MIN_MS, 1)} min later); under the Lines Walk's lamp at (540, 220.6), the nearest to the mark ${fmt(lamp, 4)} at 23:00, ${fmt(lampDay, 4)} at noon`);
      const before = rows[2], rise = rows[3];
      assert(before.eclipsed && !rise.eclipsed && rise.level > before.level + 0.05 && before.sunK === 0 && rise.sunK > 0, JSON.stringify({ before, rise }));
      assert(rows[6].level === 1 && rows[9].level <= 0.05 && lamp >= 0.45, JSON.stringify({ noon: rows[6], night: rows[9], lamp }));
    },
  },
  {
    name: 'the canyon\'s sunrise comes in over the minute and a half the disc takes to clear the wall, never in a frame: tick by tick the key light, the shadows and the street\'s level move by small steps (v0.0.3\'s review: 0 to 0.62 between two frames at 05:44)',
    fn() {
      const ter = sunTimes('melas', at(12, 0, 0, 1));
      let maxSun = 0, maxShadow = 0, maxLevel = 0, first = null, full = null, prev = null;
      for (let t = ter.riseMs - 2 * MIN_MS; t <= ter.riseMs + 2 * MIN_MS; t += 50) {
        const k = skyAt('melas', t), s = sunAt('melas', t), level = lightLevel(ST, ...STREET, t, G);
        if (first === null && s.visible > 0) first = t;
        if (full === null && s.visible >= 1) full = t;
        if (prev) { maxSun = Math.max(maxSun, Math.abs(k.sunK - prev.sunK)); maxShadow = Math.max(maxShadow, Math.abs(k.shadow - prev.shadow)); maxLevel = Math.max(maxLevel, Math.abs(level - prev.level)); }
        prev = { sunK: k.sunK, shadow: k.shadow, level };
      }
      const rampS = (full - first) / 1000;
      console.log(`      the disc from its first sliver at ${hm(first)} to whole at ${hm(full)}: ${fmt(rampS, 1)} s; the biggest step a 50 ms tick: key light ${fmt(maxSun, 4)}, shadows ${fmt(maxShadow, 4)}, the street's level ${fmt(maxLevel, 4)}`);
      assert(rampS >= 60 && rampS <= 150, `the disc cleared the wall in ${rampS} s`);
      assert(maxSun <= 0.002 && maxShadow <= 0.004 && maxLevel <= 0.002, JSON.stringify({ maxSun, maxShadow, maxLevel }));
    },
  },
  {
    name: 'the sun at Melas through Sol 590 and the seasons: the flat sunrise 05:37 and sunset 18:23 to a minute and noon at 83°, the canyon\'s sunrise 5 to 10 minutes later, the south wall 9.7° (TIME §2.5, CONTRACTS §3, PLACES §3.15)',
    fn() {
      const rows = [];
      for (let k = 0; k < 50; k++) { const ms = SOL0 + k * 30 * MIN_MS; if (ms - SOL0 >= SOL_MS) break; const s = sunAt('melas', ms); rows.push(`${hm(ms)} ${fmt(s.elevDeg, 1)}°/${fmt(s.azDeg, 0)}°${s.eclipsed ? '*' : ''}`); }
      console.log(`      Sol 590 every 30 min (elevation/azimuth, * hidden): ${rows.join(', ')}`);
      const seasons = [0, 90, 174, 270, 316.4].map(ls => {
        const ms = ls === 316.4 ? START_MS : atLs(ls), f = sunTimes('melas', ms, { terrain: false }), t = sunTimes('melas', ms);
        return { ls, lsAt: lsDeg(ms), f, t };
      });
      for (const s of seasons) console.log(`      Ls ${String(s.ls).padEnd(5)} (at ${fmt(s.lsAt, 1)}°): flat ${hm(s.f.riseMs)} to ${hm(s.f.setMs)}, ${fmt(s.f.dayH, 2)} h, noon ${fmt(s.f.noonElevDeg, 2)}°; the canyon's ${hm(s.t.riseMs)} to ${hm(s.t.setMs)}, ${fmt(s.t.dayH, 2)} h (${fmt((s.f.dayH - s.t.dayH) * 60, 0)} min shorter)`);
      const hz = [];
      for (let az = 0; az < 360; az += 10) hz.push(`${az}° ${fmt(horizonAt('melas', az), 2)}`);
      console.log(`      horizonAt every 10°: ${hz.join(', ')}`);
      const start = seasons.at(-1), fr = marsClock(start.f.riseMs, LON), fs = marsClock(start.f.setMs, LON);
      const riseMin = fr.hour * 60 + fr.minute + fr.second / 60, setMin = fs.hour * 60 + fs.minute + fs.second / 60;
      near(riseMin, 5 * 60 + 37, 1, 'the flat sunrise at the start (minutes):');
      near(setMin, 18 * 60 + 23, 1, 'the flat sunset at the start (minutes):');
      near(start.f.noonElevDeg, 83, 0.5, 'noon:');
      const later = (start.t.riseMs - start.f.riseMs) / MIN_MS;
      assert(later >= 5 && later <= 10, `the canyon's sunrise ${fmt(later, 1)} min after the flat one`);
      near(horizonAt('melas', 180), 9.7, 0.1, 'horizonAt(180):');
    },
  },
  {
    name: 'wall clocks agree with the watch\'s helpers on 1,000 random times (hour and minute), read 24:00 with their hands at 12 through the slip, and the duty desk\'s UTC face reads UTC',
    fn() {
      const r = stream('places-light', 'clocks'), bad = [], fx = { faces: ['melas', 'utc'] };
      let slips = 0;
      for (let k = 0; k < 1000; k++) {
        const ms = START_MS + int(r, 20 * SOL_MS), c = marsClock(ms, LON), [m, u] = wallClockAt(fx, ms, LON).faces;
        if (c.timeslip) { slips++; if (!(m.slip && m.text === '24:00' && m.hourDeg === 0 && m.minuteDeg === 0)) bad.push(`${ms}: ${JSON.stringify(m)}`); continue; }
        if (m.hour !== c.hour || m.minute !== c.minute || m.slip || m.minuteDeg !== c.minute * 6) bad.push(`${ms}: ${JSON.stringify(m)} vs ${c.hour}:${c.minute}`);
        if (u.slip) bad.push(`utc slipped at ${ms}`);
      }
      // (and a slip made sure of: the sol's last moment)
      const inSlip = wallClockAt(fx, SOL0 + SOL_MS - 1000, LON).faces[0];
      const sample = wallClockAt(fx, START_MS, LON).faces;
      console.log(`      1,000 times over 20 sols: ${bad.length} disagreeing, ${slips} in the slip; at the start the faces read ${sample.map(f => `${f.face} ${f.text} (hands ${fmt(f.hourDeg, 1)}°, ${f.minuteDeg}°)`).join(', ')}; the sol's last second ${inSlip.text}, slip ${inSlip.slip}`);
      assert(!bad.length && inSlip.slip && inSlip.text === '24:00', bad.slice(0, 5).join('\n'));
    },
  },
  {
    name: 'lightLevel costs at most 2 µs a call at p95 (indoors at night, the street at night, the street by day)',
    fn() {
      const r = stream('places-light', 'cost'), out = [];
      for (const [label, area, box, ms] of [['Echo at 23:00', E1, [1, 1, 83, 23], at(23)], ['the street at 23:00', G, [470, 200, 620, 330], at(23)], ['the street at noon', G, [470, 200, 620, 330], at(12)]]) {
        const pts = Array.from({ length: 2000 }, () => [box[0] + int(r, (box[2] - box[0]) * 100) / 100, box[1] + int(r, (box[3] - box[1]) * 100) / 100]);
        let sum = 0;
        for (const [x, z] of pts.slice(0, 200)) sum += lightLevel(ST, x, z, ms, area);  // (warm-up)
        const us = [];
        // (batches of 500 calls, so the timer's grain and a collector's pause do not read as a call's cost)
        for (let k = 0; k < 200; k++) { const t0 = performance.now(); for (let i = 0; i < 500; i++) { const [x, z] = pts[(k * 500 + i) % pts.length]; sum += lightLevel(ST, x, z, ms, area); } us.push((performance.now() - t0) * 1000 / 500); }
        us.sort((a, b) => a - b);
        out.push({ label, p50: us[Math.floor(us.length * 0.5)], p95: us[Math.floor(us.length * 0.95)], mean: sum / 100200 });
      }
      // (the ceiling in the foreground's terms: this process may run in macOS's background band, helpers.mjs machine())
      const M = machine();
      for (const o of out) console.log(`      ${o.label}: µs a call p50 ${fmt(o.p50, 3)}, p95 ${fmt(o.p95, 3)} (mean level ${fmt(o.mean, 3)}); the ceiling here 2 µs × ${fmt(M.k, 2)}`);
      assert(out.every(o => o.p95 <= 2 * M.k), JSON.stringify(out));
    },
  },
];
