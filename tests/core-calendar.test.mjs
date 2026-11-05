// The calendars (src/core/calendar.js, bound to SETTING's definitions by src/sim/time/dates.js): UTC
// from game time without the Date object, the Mars Sol Date against known values, the Mars local
// clock with its slip centred on mean midnight (TIME §2.4), and the Mars year and the season against
// SETTING §3.8's test vectors.
import { assert, near, fmt } from './helpers.mjs';
import { seedRng, next } from '../src/core/rng.js';
import { SOL_MS, DAY_MS, HOUR_MS, MIN_MS, SEC_MS } from '../src/core/clock.js';
import {
  utc, gameMsOfUtc, isLeapYear, UNIX_MS_AT_EPOCH, jdUtc, msdOfJdTT, msd, msdTrue, MSD_AT_EPOCH, MSD_EPOCH_MS, mtcHours,
  marsClock, localSol, solStartMs, msAtMarsTime, TIMESLIP_MS, HALF_SLIP_MS, lonMs,
  utcText, isoText, utcClockText, marsTimeText, yearsOf, weekdayOfSol, WEEKDAYS,
} from '../src/core/calendar.js';
import { YEARS, marsLocal, solText, marsDateText, civilDate, weekdayName, weekdayOf, sol1 } from '../src/sim/time/dates.js';
import { START, START_MS, SITES } from '../src/data/setting/calendar.js';
import * as SETTING from '../src/data/setting/calendar.js';

const YEAR_MS = 365.2425 * DAY_MS;
const clockText = (c) => `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}:${String(c.second).padStart(2, '0')}`;

export default [
  {
    name: 'UTC: game time 0 is 2351-03-22 08:00:00 UTC, a Thursday',
    fn() {
      const c = utc(0);
      assert(c.year === 2351 && c.month === 3 && c.day === 22 && c.hour === 8 && c.minute === 0 && c.second === 0 && c.msec === 0, JSON.stringify(c));
      assert(c.weekday === 3, `weekday ${c.weekday} (0 is Monday)`);
      assert(gameMsOfUtc(2351, 3, 22, 8) === 0, 'gameMsOfUtc of the epoch is not 0');
      assert(UNIX_MS_AT_EPOCH === Date.UTC(2351, 2, 22, 8), 'the epoch\'s Unix time differs from Date\'s');
      assert(utcText(0) === 'Thu 22 Mar 2351 08:00 UTC', utcText(0));
      assert(isoText(0) === '2351-03-22T08:00:00Z' && utcClockText(0) === '08:00', isoText(0));
      assert(c.doy === 31 + 28 + 22, `day of year ${c.doy}`);
      console.log(`      ${utcText(0)}; Unix ms ${UNIX_MS_AT_EPOCH}; day ${c.doy} of 2351`);
    },
  },
  {
    name: 'UTC: 20,000 times across 1600-3000 agree with Date, to the millisecond and the weekday',
    fn() {
      const r = seedRng(1600);
      const from = gameMsOfUtc(1600, 1, 1), to = gameMsOfUtc(3000, 1, 1);
      let bad = 0, firstBad = '';
      for (let i = 0; i < 20000; i++) {
        const ms = Math.floor(from + next(r) * (to - from));
        const c = utc(ms), d = new Date(ms + UNIX_MS_AT_EPOCH);
        const ok = c.year === d.getUTCFullYear() && c.month === d.getUTCMonth() + 1 && c.day === d.getUTCDate() && c.hour === d.getUTCHours()
          && c.minute === d.getUTCMinutes() && c.second === d.getUTCSeconds() && c.msec === d.getUTCMilliseconds() && c.weekday === (d.getUTCDay() + 6) % 7
          && gameMsOfUtc(c.year, c.month, c.day, c.hour, c.minute, c.second, c.msec) === ms;
        if (!ok && !bad++) firstBad = `${ms}: ${JSON.stringify(c)} vs ${d.toISOString()}`;
      }
      assert(!bad, `${bad} disagree, first ${firstBad}`);
      console.log(`      20000 random times from 1600 to 3000: all equal to Date's, and back`);
    },
  },
  {
    name: 'UTC: leap years and year ends (2351 common, 2352 leap, 2400 leap, 2100 and 2500 common)',
    fn() {
      assert(!isLeapYear(2351) && isLeapYear(2352) && isLeapYear(2400) && !isLeapYear(2100) && !isLeapYear(2500) && isLeapYear(2000), 'isLeapYear');
      const feb29 = utc(gameMsOfUtc(2352, 2, 29, 12));
      assert(feb29.month === 2 && feb29.day === 29 && feb29.doy === 60, `2352-02-29: ${JSON.stringify(feb29)}`);
      const after = utc(gameMsOfUtc(2352, 2, 29) + DAY_MS);
      assert(after.month === 3 && after.day === 1, '2352-02-29 + 1 day');
      const not = utc(gameMsOfUtc(2500, 2, 28) + DAY_MS);
      assert(not.month === 3 && not.day === 1, `2500-02-28 + 1 day is ${not.month}-${not.day}`);
      assert(utc(gameMsOfUtc(2400, 2, 28) + DAY_MS).day === 29, '2400 has a 29 February');
      assert(utc(gameMsOfUtc(2351, 12, 31)).doy === 365 && utc(gameMsOfUtc(2352, 12, 31)).doy === 366, 'days in 2351 and 2352');
      const eve = gameMsOfUtc(2351, 12, 31, 23, 59, 59, 999);
      const a = utc(eve), b = utc(eve + 1);
      assert(a.year === 2351 && a.month === 12 && a.day === 31 && a.hour === 23 && b.year === 2352 && b.month === 1 && b.day === 1 && b.hour === 0 && b.msec === 0, 'the year\'s last millisecond');
      assert(utcText(eve + 1) === 'Tue 1 Jan 2352 00:00 UTC', utcText(eve + 1));
      const span = (gameMsOfUtc(2352, 1, 1) - gameMsOfUtc(2351, 1, 1)) / DAY_MS, span2 = (gameMsOfUtc(2353, 1, 1) - gameMsOfUtc(2352, 1, 1)) / DAY_MS;
      assert(span === 365 && span2 === 366, `${span} and ${span2} days`);
      console.log(`      2351 has ${span} days, 2352 ${span2}; 2352-02-29 is day ${feb29.doy}; 2351's last ms → ${utcText(eve + 1)}`);
    },
  },
  {
    name: 'MSD: Mars24\'s worked example (2000-01-06 00:00 UTC, MSD 44795.99976, MTC 23.99424 h) and 00:00 TT (44795.99904)',
    fn() {
      // (Allison and McEwen's relation as it stands, fed the Julian date in TT with the TT - UTC of
      // 2000, 64.184 s: 32 leap seconds then plus 32.184. The brief's "MSD 44795.9998 at 2000-01-06
      // 00:00" is this value to four places: it holds at 00:00 UTC; at 00:00 TT it is 44795.9990.)
      const t = gameMsOfUtc(2000, 1, 6);
      near(jdUtc(t), 2451549.5, 1e-9, 'JD of 2000-01-06 00:00 UTC');
      const atUtc = msdOfJdTT(jdUtc(t) + 64.184 / 86400), atTT = msdOfJdTT(2451549.5);
      near(atUtc, 44795.99976, 0.000005, 'MSD at 2000-01-06 00:00 UTC');
      near(+atUtc.toFixed(4), 44795.9998, 1e-9, 'the brief\'s value, to four places');
      near(atTT, 44795.99904, 0.000005, 'MSD at 2000-01-06 00:00 TT');
      near(((atUtc % 1) + 1) % 1 * 24, 23.99424, 0.0001, 'MTC at 2000-01-06 00:00 UTC (hours)');
      // (and the game's own constant TT - UTC of 69.184 s, which is 2017's, puts the same moment 5 s later)
      near(msdTrue(t), atUtc + 5 / 86400 / 1.0274912517, 1e-8, 'msdTrue with 69.184 s');
      console.log(`      2000-01-06 00:00 UTC: MSD ${fmt(atUtc, 5)}, MTC ${fmt((atUtc % 1) * 24, 5)} h; 00:00 TT: ${fmt(atTT, 5)}; with OLYMPUS's TT - UTC 69.184 s: ${fmt(msdTrue(t), 5)}`);
    },
  },
  {
    name: 'MSD: the epoch (169639.2363), Perseverance\'s landing on its sol 0 in the afternoon, and the game\'s drift from the formula',
    fn() {
      near(MSD_AT_EPOCH, 169639.23631, 0.00001, 'MSD at 2351-03-22 08:00 UTC');
      // (TIME §1's integer anchor is the formula's MSD at the epoch in ms of SOL_MS, within a millisecond)
      assert(msd(0) === MSD_AT_EPOCH && MSD_EPOCH_MS === 15_059_764_595_616 && Math.abs(msdTrue(0) * SOL_MS - MSD_EPOCH_MS) < 1,
        `the anchor ${MSD_EPOCH_MS} against the formula's ${msdTrue(0) * SOL_MS}`);
      near(msd(SOL_MS) - msd(0), 1, 1e-9, 'one SOL_MS is one sol');
      // Perseverance touched down at Jezero (77.45° E) on 2021-02-18, 20:55 UTC as received on Earth,
      // so about 20:44 UTC at Mars (11 min of light time): taken as 20:43:49. Its landing sol is Mars
      // 2020's sol 0; it should fall on local MSD 52304, in the afternoon (the tolerances allow
      // minutes of error in the time taken).
      const t = gameMsOfUtc(2021, 2, 18, 20, 43, 49);
      const c = marsClock(t, 77.4509), lmstTrue = (((msdTrue(t) + 77.4509 / 360) % 1) * 24);
      assert(c.sol === 52304, `Perseverance's landing on local MSD ${c.sol}`);
      assert(lmstTrue > 15 && lmstTrue < 16.5, `LMST ${lmstTrue}`);
      // (the game's sol is 0.147 ms shorter than the formula's: over a 50-year career, under 3 s)
      const fifty = 50 * YEAR_MS, driftS = (msd(fifty) - msdTrue(fifty)) * 1.0274912517 * 86400;
      assert(Math.abs(driftS) < 3, `drift over 50 years ${driftS} s`);
      const back = (msd(-351 * YEAR_MS) - msdTrue(-351 * YEAR_MS)) * 1.0274912517 * 86400;
      const hm = (h) => `${Math.floor(h)}:${String(Math.floor((h % 1) * 60)).padStart(2, '0')}`;
      console.log(`      epoch MSD ${fmt(MSD_AT_EPOCH, 5)} (MTC ${fmt(mtcHours(0), 3)} h); Perseverance: local MSD ${c.sol}, LMST ${hm(lmstTrue)} (${fmt(lmstTrue, 3)} h)`);
      console.log(`      the game's MSD runs ${fmt(driftS, 2)} s from the formula's over 50 years, ${fmt(back, 1)} s at 2000`);
    },
  },
  {
    name: 'LMST: local time is the prime meridian\'s plus longitude / 15 h, and a local sol is 88,775,244 ms',
    fn() {
      const r = seedRng(77);
      let worst = 0;
      for (let i = 0; i < 2000; i++) {
        const ms = Math.floor((next(r) - 0.5) * 100 * YEAR_MS), lon = (next(r) - 0.5) * 360;
        const want = (((mtcHours(ms) + lon / 15) % 24) + 24) % 24, got = marsClock(ms, lon).lmstH;
        const d = Math.min(Math.abs(want - got), 24 - Math.abs(want - got));
        worst = Math.max(worst, d);
      }
      assert(worst < 1e-6, `LMST off by ${worst} h`);
      for (const lon of [-72, 0, 77.4509, 137.44, 180]) {
        const s = solStartMs(12345678, lon), a = localSol(s, lon), b = localSol(s + SOL_MS, lon);
        assert(a.msOfSol === 0 && b.msOfSol === 0 && b.sol === a.sol + 1, `sol length at ${lon}° E`);
      }
      const e = marsClock(5e9, 180), w = marsClock(5e9, -180);
      assert(e.sol === w.sol && e.msOfSol === w.msOfSol, '180° E and 180° W disagree');
      assert(lonMs(287.2) === 70_822_917 && lonMs(-72.8) === lonMs(287.2), `Melas ${lonMs(287.2)} ms (TIME §1: 70,822,917)`);
      assert(marsClock(5e9, 360 - 72).sol === marsClock(5e9, -72).sol, '288° E and 72° W disagree');
      console.log(`      2000 random times and longitudes: LMST within ${worst.toExponential(1)} h of MTC + lon/15; 180° E = 180° W`);
    },
  },
  {
    name: 'the slip (TIME §2.4): 00:00 to 23:59 in Earth seconds, then 24:00 for 39 m 35.244 s centred on mean midnight, then the next sol at 00:00; noon is mean noon',
    fn() {
      assert(TIMESLIP_MS === 39 * MIN_MS + 35244 && HALF_SLIP_MS * 2 === TIMESLIP_MS, `timeslip ${TIMESLIP_MS} ms`);
      for (const lon of [287.2, 0, 77.4509]) {
        const s = solStartMs(gameMsOfUtc(2351, 4, 1), lon), sol = localSol(s, lon).sol;
        const at = (dt) => marsClock(s + dt, lon);
        const c0 = at(0), cDay = at(DAY_MS - 1), cSlip = at(DAY_MS), cLast = at(SOL_MS - 1), cNext = at(SOL_MS);
        assert(clockText(c0) === '00:00:00' && !c0.timeslip && c0.sol === sol, `midnight ${clockText(c0)}`);
        assert(clockText(cDay) === '23:59:59' && !cDay.timeslip, `last ms before the slip ${clockText(cDay)}`);
        assert(clockText(cSlip) === '24:00:00' && cSlip.timeslip && cSlip.sol === sol && cSlip.slipMs === 0, `first ms of the slip ${clockText(cSlip)}`);
        assert(clockText(cLast) === '24:00:00' && cLast.timeslip && cLast.slipMs === TIMESLIP_MS - 1 && cLast.sol === sol, `last ms of the sol ${clockText(cLast)}`);
        assert(clockText(cNext) === '00:00:00' && !cNext.timeslip && cNext.sol === sol + 1, `next sol ${clockText(cNext)} sol ${cNext.sol}`);
        near(at(12 * HOUR_MS).lmstH, 12, 1e-6, 'civil noon is mean solar noon');
        near(at(DAY_MS + HALF_SLIP_MS).meanSolarFrac, 0, 1e-9, 'the slip\'s middle is mean midnight');
      }
      const s = solStartMs(0, 0);
      assert(solText(s + DAY_MS + 12 * MIN_MS, 0).endsWith('· 24:00 +12 TIMESLIP'), solText(s + DAY_MS + 12 * MIN_MS, 0));
      assert(!solText(s + DAY_MS + 12 * MIN_MS, 0, { flag: false }).includes('TIMESLIP'), 'flag: false');
      assert(marsTimeText(s + DAY_MS + 39 * MIN_MS, 0) === '24:00', marsTimeText(s + DAY_MS + 39 * MIN_MS, 0));
      console.log(`      at three longitudes: 00:00:00, 23:59:59, 24:00:00 TIMESLIP through the slip, next sol 00:00:00; civil 12:00 is mean noon; '${solText(s + DAY_MS + 12 * MIN_MS, 0)}'`);
    },
  },
  {
    name: 'msAtMarsTime: the next moment the local clock shows an hour, the timeslip\'s included',
    fn() {
      const r = seedRng(3);
      for (let i = 0; i < 500; i++) {
        const from = Math.floor(next(r) * 10 * YEAR_MS), h = Math.floor(next(r) * 25), m = h === 24 ? Math.floor(next(r) * 39) : Math.floor(next(r) * 60);
        const t = msAtMarsTime(from, h, m, 287.2), c = marsClock(t, 287.2);
        const face = h < 24 ? c.hour === h && c.minute === m && c.second === 0 : c.timeslip && c.slipMs === m * MIN_MS;
        assert(t >= from && t - from < SOL_MS && face && c.msOfSol === h * HOUR_MS + m * MIN_MS, `${h}:${m} from ${from}: ${clockText(c)} at ${t}`);
      }
      let threw = false; try { msAtMarsTime(0, 24, 40); } catch { threw = true; }
      assert(threw, '24:40 is not on a Mars clock');
      const six = msAtMarsTime(0, 6, 0, 287.2);
      console.log(`      500 random hours found; first 06:00 at Melas after the epoch: game ms ${six} (${utcText(six)}), ${solText(six, 287.2)}`);
    },
  },
  {
    name: 'SETTING §3.8\'s vectors: the epoch is Sol 326 MY 211 at 00:30:38 Melas, a Wednesday, 19 Gleaning, Ls 174; the start Sol 590 at 12:39:34, a Monday, 5 Patience, Ls 316.4; 12:40 at +25.665 s; one weekday helper',
    fn() {
      const lon = SITES.melas.lonEDeg;
      const e = marsLocal(0, lon), st = marsLocal(START_MS, lon), at = (c) => `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}:${String(c.second).padStart(2, '0')}`;
      near(msd(0), 169639.237, 0.001, 'MSD at the epoch (SETTING writes it to three places)');
      assert(e.solIndex === 169640 && e.solOfYear === 326 && e.my === 211 && at(e) === '00:30:38' && weekdayName(e.solIndex) === 'Wednesday', JSON.stringify(e));
      assert(civilDate(e.solIndex).text === '19 Gleaning 211' && Math.abs(e.lsDeg - 174) < 1e-9, `${civilDate(e.solIndex).text}, Ls ${e.lsDeg}`);
      assert(st.solIndex === START.solIndex && st.solOfYear === 590 && st.my === 211 && at(st) === '12:39:34' && weekdayName(st.solIndex) === 'Monday', JSON.stringify(st));
      assert(civilDate(st.solIndex).text === '5 Patience 211' && Math.abs(st.lsDeg - 316.4) < 0.05, `${civilDate(st.solIndex).text}, Ls ${st.lsDeg}`);
      assert(utcText(START_MS) === 'Wed 19 Dec 2351 02:20 UTC', utcText(START_MS));
      // (12:40 falls 25.7 s (25.665 s) after the start: CONTRACTS §3)
      const forty = msAtMarsTime(START_MS, 12, 40, lon);
      near((forty - START_MS) / 1000, 25.665, 0.0005, '12:40 after the start, s');
      // (one weekday helper: the watch's clock, the names and the weekly jobs read weekdayOfSol, which takes SETTING's WEEK_OFFSET)
      const shifted = yearsOf({ ...SETTING, WEEK_OFFSET: 3 });
      assert(st.weekday === weekdayOf(st.solIndex) && marsClock(START_MS, lon, shifted).weekday === (st.weekday + 3) % 7 && weekdayOfSol(st.solIndex) === st.weekday && Object.isFrozen(WEEKDAYS), `weekday ${st.weekday}, shifted ${marsClock(START_MS, lon, shifted).weekday}`);
      assert(solText(START_MS, lon, { flag: false }) === 'Sol 590 · 12:39' && solText(forty, lon) === 'Sol 590 · 12:40' && marsDateText(START_MS, lon) === 'MY 211 Sol 590', solText(START_MS, lon));
      // (the year table: Sol 1 of MY 212 is MSD 169,984, a Thursday; MY 211 to 216 hold 669, 669, 669, 669, 668, 669 sols)
      const firsts = [211, 212, 213, 214, 215, 216, 217].map(sol1), lengths = firsts.slice(1).map((f, i) => f - firsts[i]);
      assert(firsts[1] === 169984 && weekdayName(firsts[1]) === 'Thursday' && lengths.join() === '669,669,669,669,668,669', `${firsts}; ${lengths}`);
      // (walk sol by sol over 20 years from the epoch: the sol of the year runs 1, 2, … and turns to 1 on each Sol 1)
      let s = solStartMs(0, lon), prev = marsLocal(s, lon), turns = 0;
      for (let k = 0; k < 20 * 670; k++) {
        s += SOL_MS;
        const y = marsLocal(s, lon);
        if (y.my !== prev.my) { turns++; assert(y.my === prev.my + 1 && y.solOfYear === 1 && y.solIndex === sol1(y.my), `turn ${prev.my} sol ${prev.solOfYear} → ${y.my} sol ${y.solOfYear}`); }
        else assert(y.solOfYear === prev.solOfYear + 1, `sol ${prev.solOfYear} → ${y.solOfYear}`);
        prev = y;
      }
      // (the next New Year at Melas: MY 212 Sol 1, 2352-03-09 18:27 UTC at Melas midnight, SETTING §3.7)
      const ny = solStartMs(START_MS + (firsts[1] - st.solIndex) * SOL_MS, lon), nyc = marsLocal(ny, lon);
      assert(nyc.my === 212 && nyc.solOfYear === 1 && weekdayName(nyc.solIndex) === 'Thursday' && utcText(ny).endsWith('9 Mar 2352 18:27 UTC'), `${utcText(ny)} ${JSON.stringify(nyc)}`);
      console.log(`      epoch: MSD ${fmt(msd(0), 3)}, solIndex ${e.solIndex}, Sol ${e.solOfYear} MY ${e.my}, ${at(e)}, ${weekdayName(e.solIndex)}, ${civilDate(e.solIndex).text}, Ls ${fmt(e.lsDeg, 1)}`);
      console.log(`      start: ${utcText(START_MS)}, solIndex ${st.solIndex}, Sol ${st.solOfYear} MY ${st.my}, ${at(st)}, ${weekdayName(st.solIndex)}, ${civilDate(st.solIndex).text}, Ls ${fmt(st.lsDeg, 1)}; 12:40 at +${fmt((forty - START_MS) / 1000, 3)} s; WEEK_OFFSET 3 would make it a ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][marsClock(START_MS, lon, shifted).weekday]} on the watch`);
      console.log(`      Sol 1 of MY 211 to 217: ${firsts.join(', ')} (lengths ${lengths.join(', ')}); MY 212's New Year at Melas: ${weekdayName(nyc.solIndex)}, ${utcText(ny)}; ${turns} year turns walked`);
    },
  },
  {
    name: 'formatters: the brief\'s three faces',
    fn() {
      const t = gameMsOfUtc(2351, 3, 22, 8) + 3 * SOL_MS + 7 * HOUR_MS + 5 * SEC_MS;
      const a = solText(t, 287.2), b = marsDateText(t, 287.2), c = utcText(t);
      assert(/^Sol \d{1,3} · \d\d:\d\d( \+\d\d? TIMESLIP)?$/.test(a), a);
      assert(/^MY \d+ Sol \d{1,3}$/.test(b), b);
      assert(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) \d{1,2} [A-Z][a-z]{2} \d{4} \d\d:\d\d UTC$/.test(c), c);
      console.log(`      three sols and 7 h on: '${a}', '${b}', '${c}'`);
    },
  },
];
