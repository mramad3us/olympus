// The clock and the sky by site (ROADMAP "anywhere", step 3; TECH §1.4; PLACES §1.2, §3.9, §3.16; CONTRACTS §21):
// env.js localTime(site, ms) is the one clock helper, and the light, the watch, the log, the wall clocks and the jobs'
// local@ and week@ slots read it, so a ship keeps UTC and Melas the sol.
//   - env-clock: a ship's local@20:00 lands at 20:00:00 UTC every 24 h, Melas's at 20:00:00 on the sol every
//     24 h 39 min 35.244 s, over three days, and neither drifts the other's 39.6 minutes a day; a ship's week@ falls on
//     UTC's weekday; a game's own day jobs (autosaveDay local@00:00, solDirector local@20:00) stay on the sol;
//   - the faces agree on a ship: the watch, a wall clock's local face, the log's stamp and UTC read one time; and at
//     Melas they read v0.0.10's (the watch at a longitude against the watch by site, on 2,000 random times);
//   - the lighting by the site's regime: Melas's base hours from its Plan of the Day (05:30 or 07:00, 18:00, 22:00:
//     v0.0.10's rule, on 2,000 random times), a ship's 06:00 to 22:00 UTC;
//   - the sky by site: Mars's open air at Melas, `none` under a roof (cls) and on a ship (no sun, level 0);
//   - no quiet Melas: an unknown site, a site off Mars asked for a longitude (lonOf, lonOfSite), a clock not built, a
//     sky with no rows, a site with no Plan of the Day or water, and the sun off Mars all throw.
//   - off Mars (v0.0.24's stage 0, its build sheet §2 step 4; F119, the anywhere note's V19): the readers of the body's clock,
//     its sleep, an activity's hour and the routine's days take the site's day key (jobs.js siteDayOf), so a body ticks a sol at
//     Phobos and aboard Testudo, skips and a sleep included, with no throw, its sleep pressure and body clock printed against
//     Melas's, and a save made asleep there carries on byte for byte; the two sites are tests/site-hooks.mjs's stand-ins until
//     D's records land (then D's). On Melas the day functions are the Mars ones, call for call: dayClock is marsClock, localDay
//     localSol, msAtDayTime msAtMarsTime, dayPhaseOf the activities' old hour, on 2,000 random times each.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { stream, int } from '../src/core/rng.js';
import { SOL_MS, DAY_MS, HOUR_MS, MIN_MS } from '../src/core/clock.js';
import { utc, marsClock, yearsOf, localSol, msAtMarsTime, dayClock, localDay, msAtDayTime, dayLenOf, UTC_DAY } from '../src/core/calendar.js';
import { register } from 'node:module';
import { SITES_QUERY, STAND_INS } from './site-hooks.mjs';
import * as SETTING from '../src/data/setting/calendar.js';
import { ROUTINES } from '../src/data/pod.js';
import { LIGHT_REGIMES } from '../src/data/places/env.js';
import { localTime, timeAt, msAtLocal, skyOf, lonOfSite, routineOf, waterOf, clockOf, siteAt } from '../src/sim/places/env.js';
import { lonOf, siteOf } from '../src/sim/places/model.js';
import { nextOccurrence, siteDayOf, dayPhaseOf } from '../src/sim/jobs.js';
import { clockLighting, skyAt, NO_SKY } from '../src/sim/places/light.js';
import { sunAt } from '../src/sim/places/sun.js';
import { wallClockAt } from '../src/sim/places/clocks.js';
import { watchFaces } from '../src/ui/hud/watch.js';
import { logStamp } from '../src/ui/cards/log.js';

const START_MS = SETTING.START_MS, MELAS_LON = SETTING.SITES.melas.lonEDeg, YEARS = yearsOf(SETTING);
const throws = (fn) => { try { fn(); return null; } catch (e) { return e.message; } };
const pad2 = (n) => String(n).padStart(2, '0');
const hms = (t) => `${pad2(t.hour)}:${pad2(t.minute)}:${pad2(t.second)}${t.timeslip ? ` +${Math.floor(t.slipMs / MIN_MS)}` : ''}`;

// (a hull of the test's own, not in the registry: no ship site is authored yet (step 4 hosts the shoot house in the
// Wheel at Melas); its record is what PLACES §1.2 asks of a ship)
const SHIP = Object.freeze({
  id: 'test-hull', kind: 'ship', template: 'test-hull@1', name: 'a test hull under thrust', body: 'none', clock: 'utc',
  outside: Object.freeze({ kind: 'vacuum', air: 'vacuum' }), inside: Object.freeze({ air: 'martian-indoor' }),
  gravity: Object.freeze({ regime: 'thrust', gG: 1, down: Object.freeze([0, -1, 0]) }), lighting: 'ship', water: 'ship', routine: null, palette: null, areas: Object.freeze([]),
});
const MELAS = siteOf('melas');

// (v0.0.10's lighting rule, as light.js held it: Melas civil time by SETTING's years, TIMES' hours)
function v10Lighting(ms) {
  const c = marsClock(ms, MELAS_LON, YEARS);
  if (c.timeslip) return 'lightsOut';
  const h = c.civilMs / HOUR_MS, rev = [5, 6].includes(c.weekday) ? 7.0 : 5.5;
  return h < rev || h >= 22.0 ? 'lightsOut' : h < 18.0 ? 'day' : 'evening';
}

// (v0.0.24's stage 0: the game loaded a second time with the two off-Mars sites in its registry, tests/site-hooks.mjs; once)
const SITES_REG = Symbol.for('olympus.sites.registered');
async function sitesCopy() {
  if (!globalThis[SITES_REG]) { register('./site-hooks.mjs', import.meta.url); globalThis[SITES_REG] = true; }
  const at = (p) => import(`${new URL(p, import.meta.url).href}?${SITES_QUERY}`);
  const [game, body, sleep, jobs, model] = await Promise.all([at('./game.mjs'), at('../src/sim/body/body.js'), at('../src/sim/body/sleep.js'), at('../src/sim/jobs.js'), at('../src/sim/places/model.js')]);
  return { createGame: game.createGame, ...body, phiOf: sleep.phiOf, lonMsOf: sleep.lonMsOf, siteDayOf: jobs.siteDayOf, dayPhaseOf: jobs.dayPhaseOf, siteOf: model.siteOf };
}
/** The off-Mars sites F119 ticks, and Melas for the comparison. */
const SOL_SITES = Object.freeze([null, 'phobos-void', 'mcrn-testudo']);
// (a body's sol at a site: the barracks on 48213 at 21:00 Melas, the live site set to it, then 100 ticks, two hours' wait, down
// in the rack (sleepBegin), eight hours' skip, up (sleepEnd), waits to 25 h, 100 ticks; the body's sleep and clock read after each)
function solAt(C, site) {
  const g = C.createGame({ scenario: 'barracks', seed: 48213, hour: 21 });
  if (site) g.state.places.live.site = site;
  const s = g.state, pid = s.player.id, t0 = s.clock.ms, rows = [];
  const look = (what) => {
    const b = C.bodyOf(s, pid), day = C.siteDayOf(s), ph = C.dayPhaseOf(s, s.clock.ms);
    rows.push({ what, h: ph.hour, dayLenMs: ph.dayLenMs, pH: b.sleep.pressureH, offH: b.sleep.offsetH, phi: C.phiOf(s.clock.ms, C.lonMsOf(day), b.sleep.offsetH), asleep: C.isAsleep(s, pid, s.clock.ms), day });
  };
  g.step(100, {}); look('start');
  g.skipNow({ activity: 'wait', planMs: 2 * HOUR_MS, mask: 'D' }); look('waited 2 h');
  C.sleepBegin(s, pid, s.clock.ms, { bed: 'own-rack' }); look('down');
  g.skipNow({ activity: 'wait', planMs: 8 * HOUR_MS, mask: 'D' }); look('asleep');
  const saved = g.save(), atSave = s.clock.ms;
  C.sleepEnd(s, pid, s.clock.ms, { by: 'player' }); look('up');
  let skips = 0;
  while (s.clock.ms < t0 + 25 * HOUR_MS && skips < 12) { g.skipNow({ activity: 'wait', planMs: t0 + 25 * HOUR_MS - s.clock.ms, mask: 'D' }); skips++; }
  g.step(100, {}); look('a sol on');
  return { g, rows, livedH: (s.clock.ms - t0) / HOUR_MS, skips, errors: g.errors.length, saved, atSave, pod: s.time?.pod ?? null, day: C.siteDayOf(s) };
}

export default [
  {
    name: 'env-clock: a ship\'s local@20:00 lands on 20:00:00 UTC every 24 h and Melas\'s on the sol\'s 20:00:00 every 24 h 39 m 35 s, over three days, and neither drifts',
    fn() {
      const ship = [], melas = [];
      let a = START_MS, b = START_MS;
      for (let k = 0; k < 3; k++) {
        a = nextOccurrence('local@20:00', a, { site: SHIP }); ship.push(a);
        b = nextOccurrence('local@20:00', b, { site: 'melas' }); melas.push(b);
      }
      const sT = ship.map(t => localTime(SHIP, t)), mT = melas.map(t => localTime('melas', t)), u = ship.map(t => utc(t));
      const gaps = (xs) => xs.slice(1).map((t, i) => t - xs[i]);
      console.log(`      ship (UTC): ${ship.map((t, i) => `${sT[i].dateLabel} ${hms(sT[i])}`).join(', ')}; gaps ${gaps(ship).map(g => fmt(g / HOUR_MS, 4)).join(', ')} h`);
      console.log(`      Melas (sol): ${melas.map((t, i) => `${mT[i].dateLabel} ${hms(mT[i])}`).join(', ')}; gaps ${gaps(melas).map(g => fmt(g / HOUR_MS, 4)).join(', ')} h`);
      console.log(`      the sol runs ${fmt((SOL_MS - DAY_MS) / MIN_MS, 3)} min longer than the day: Melas's 20:00 comes ${fmt((ship[0] - melas[0]) / MIN_MS, 1)} min before the ship's on the first day and ${fmt((ship[2] - melas[2]) / MIN_MS, 1)} on the third, each clock true to its own`);
      assert(sT.every((t, i) => t.face === 'utc' && t.hour === 20 && t.minute === 0 && t.second === 0 && u[i].hour === 20 && u[i].minute === 0 && u[i].second === 0 && u[i].msec === 0), JSON.stringify(sT.map(hms)));
      assert(gaps(ship).every(g => g === DAY_MS), `ship gaps ${gaps(ship)}`);
      assert(mT.every(t => t.face === 'mars-local' && t.hour === 20 && t.minute === 0 && t.second === 0 && !t.timeslip), JSON.stringify(mT.map(hms)));
      assert(gaps(melas).every(g => Math.abs(g - SOL_MS) <= 1000), `Melas gaps ${gaps(melas)}`);
      // (the legacy form, Mars at a longitude, is the site's to the millisecond)
      let c = START_MS; const legacy = [];
      for (let k = 0; k < 3; k++) { c = nextOccurrence('local@20:00', c, { lonEDeg: MELAS_LON }); legacy.push(c); }
      assert(legacy.every((t, i) => t === melas[i]), JSON.stringify({ legacy, melas }));
      // (24:mm is the slip's on a sol and no time on a UTC day)
      const slip = nextOccurrence('local@24:10', START_MS, { site: 'melas' }), st = localTime('melas', slip);
      assert(st.timeslip && Math.floor(st.slipMs / MIN_MS) === 10, hms(st));
      assert(/no 24:10 on a utc clock/.test(throws(() => nextOccurrence('local@24:10', START_MS, { site: SHIP })) ?? ''), 'a UTC day has no 24:10');
      // (a ship's week@ on UTC's week)
      const wk = nextOccurrence('week@Sunday/09:00', START_MS, { site: SHIP }), wt = localTime(SHIP, wk), wu = utc(wk);
      const wm = nextOccurrence('week@Sunday/09:00', START_MS, { site: 'melas' }), wmt = localTime('melas', wm);
      console.log(`      week@Sunday/09:00: the ship's ${wt.weekdayName} ${wt.dateLabel} ${hms(wt)} UTC; Melas's ${wmt.weekdayName} ${wmt.dateLabel} ${hms(wmt)}`);
      assert(wt.weekdayName === 'Sunday' && wu.weekday === 6 && wt.hour === 9 && wt.minute === 0 && wk - START_MS <= 7 * DAY_MS, JSON.stringify({ wt: hms(wt), wu }));
      assert(wmt.weekdayName === 'Sunday' && wmt.hour === 9 && wmt.minute === 0, hms(wmt));
    },
  },
  {
    name: 'env-clock: a game\'s day jobs at Melas stay on the sol (autosaveDay at 00:00:00, solDirector at 20:00:00), three sols running, posted on the live site\'s clock',
    fn() {
      const g = createGame({ scenario: 'sandbox', seed: 3 });
      const evOf = (job) => g.state.events.find(ev => !ev.dead && ev.payload?.job === job);
      const seen = { autosaveDay: [], solDirector: [] };
      for (let k = 0; k < 3; k++) {
        for (const job of Object.keys(seen)) seen[job].push(evOf(job).atMs);
        const next = Math.max(evOf('autosaveDay').atMs, evOf('solDirector').atMs);
        g.skipNow({ activity: 'idle', planMs: next - g.state.clock.ms + 1000, mask: 'D' });
      }
      const site = siteAt(g.state);
      const rows = Object.entries(seen).map(([job, ts]) => `${job} ${ts.map(t => { const c = localTime(site, t); return `${c.dateLabel} ${hms(c)}`; }).join(', ')}`);
      console.log(`      ${site.id} keeps '${clockOf(site)}': ${rows.join('; ')}`);
      for (const [job, ts] of Object.entries(seen)) {
        const want = job === 'autosaveDay' ? 0 : 20;
        assert(ts.every(t => { const c = localTime(site, t); return c.face === 'mars-local' && c.hour === want && c.minute === 0 && c.second === 0 && !c.timeslip; }), `${job}: ${ts.map(t => hms(localTime(site, t)))}`);
        assert(ts.slice(1).every((t, i) => Math.abs(t - ts[i] - SOL_MS) <= 1000), `${job} gaps ${ts.slice(1).map((t, i) => t - ts[i])}`);
      }
    },
  },
  {
    name: 'env-clock: the watch, a wall clock\'s local face, the log\'s stamp and UTC read one time on a ship, and the watch by site reads v0.0.10\'s at Melas on 2,000 random times',
    fn() {
      const r = stream(48213, 'test:env-clock', 1), fx = { faces: ['melas', 'utc'] };
      let shipBad = 0, melasBad = 0, sample = null;
      for (let k = 0; k < 2000; k++) {
        const ms = START_MS + int(r, 40 * SOL_MS), st = { clock: { ms }, places: { live: null } };
        const w = watchFaces(st, { site: SHIP }), [loc, u] = wallClockAt(fx, ms, SHIP).faces, stamp = logStamp(ms, SHIP), c = utc(ms);
        const hhmm = `${pad2(c.hour)}:${pad2(c.minute)}`;
        if (w.time !== hhmm || loc.text !== hhmm || u.text !== hhmm || !stamp.endsWith(`${hhmm}:${pad2(c.second)}`) || w.slip || w.face !== 'utc') shipBad++;
        sample ??= { ms, watch: `${w.weekday} · ${w.sol} ${w.time}`, wall: `${loc.text}/${u.text}`, stamp, utc: w.utc };
        // (Melas: the watch by site against the watch at Melas's longitude, as v0.0.10 read it; the wall clock's and the log's the same)
        const a = watchFaces(st, { site: 'melas' }), b = watchFaces(st, { lonEDeg: MELAS_LON }), m = marsClock(ms, MELAS_LON, YEARS);
        const want = { time: `${pad2(m.hour)}:${pad2(m.minute)}`, sol: `Sol ${m.solOfYear} · MY ${m.my}`, weekday: SETTING.WEEKDAYS[m.weekday], slip: m.timeslip };
        const wall = wallClockAt({ faces: ['melas'] }, ms, 'melas').faces[0], wantStamp = m.timeslip ? `S${m.solOfYear} 24:00 +${Math.floor(m.slipMs / MIN_MS)}` : `S${m.solOfYear} ${want.time}:${pad2(m.second)}`;
        if (JSON.stringify(a) !== JSON.stringify(b) || a.time !== want.time || a.sol !== want.sol || a.weekday !== want.weekday || a.slip !== want.slip
          || wall.text !== (m.timeslip ? '24:00' : want.time) || logStamp(ms, 'melas') !== wantStamp || logStamp(ms, MELAS_LON) !== wantStamp) melasBad++;
      }
      console.log(`      on a ship: ${JSON.stringify(sample)}; disagreements ${shipBad} of 2,000; at Melas, by site against v0.0.10's longitude: ${melasBad} of 2,000`);
      assert(shipBad === 0 && melasBad === 0, JSON.stringify({ shipBad, melasBad }));
    },
  },
  {
    name: 'env-clock: the lights follow the site\'s regime: Melas\'s base hours from its Plan of the Day as v0.0.10 on 2,000 random times, a ship\'s 06:00 to 22:00 UTC',
    fn() {
      const r = stream(48213, 'test:env-clock', 2);
      let melasBad = 0, shipBad = 0;
      const counts = { day: 0, evening: 0, lightsOut: 0 };
      for (let k = 0; k < 2000; k++) {
        const ms = START_MS + int(r, 40 * SOL_MS), got = clockLighting('melas', ms);
        if (got !== v10Lighting(ms)) melasBad++;
        const s = clockLighting(SHIP, ms), h = utc(ms).hour;
        counts[s]++;
        if (s !== (h >= 6 && h < 22 ? 'day' : 'lightsOut')) shipBad++;
      }
      // (the flips to the second on a ship's day)
      const d0 = msAtLocal(SHIP, START_MS, 0, 0), flips = [[6, 0], [22, 0]].map(([h, m]) => { const t = msAtLocal(SHIP, d0, h, m); return `${pad2(h)}:${pad2(m)} ${clockLighting(SHIP, t - 1)} → ${clockLighting(SHIP, t)}`; });
      const R = routineOf('melas'), H = LIGHT_REGIMES.base.hours;
      console.log(`      Melas: reveille ${R.reveilleH} h (${R.reveilleHolidayH} h on its holidays ${R.holidays.join(', ')}), evening ${H.eveningH} h, taps ${R.tapsH} h; against v0.0.10's rule ${melasBad} of 2,000 differ`);
      console.log(`      the ship (UTC): ${flips.join(', ')}; ${counts.day} day, ${counts.evening} evening, ${counts.lightsOut} lights out of 2,000; wrong ${shipBad}`);
      assert(melasBad === 0 && shipBad === 0 && counts.evening === 0, JSON.stringify({ melasBad, shipBad, counts }));
      assert(flips[0] === '06:00 lightsOut → day' && flips[1] === '22:00 day → lightsOut', flips.join());
      assert(ROUTINES.melas === R && waterOf('melas') === 'melas' && waterOf(SHIP) === 'ship', 'the site records name their Plan of the Day and water');
    },
  },
  {
    name: 'env-clock: the sky by site: Mars\'s open air at Melas, none under a roof and none on a ship (no sun, level 0)',
    fn() {
      const out = skyOf(null, 'melas'), ground = skyOf(null, 'melas', 'melas.ground'), floor = skyOf(null, 'melas', 'melas.echo.1'), ship = skyOf(null, SHIP), test = skyOf(null, 'test', 'test.rooms');
      const noon = msAtLocal('melas', START_MS, 12, 0), k = skyAt('melas', noon), sk = skyAt(SHIP, noon);
      console.log(`      Melas ${out.cls} (sun: ${out.sunBody}), its ground ${ground.cls}, Echo's floor ${floor.cls} (outside ${floor.outside}), the test rooms ${test.cls}; the ship ${ship.cls} (sun: ${ship.sunBody}); at Melas's noon the open air's level ${k.level}, the ship's ${sk.level}`);
      assert(out.cls === 'mars-air' && out.sunBody === 'mars' && ground.cls === 'mars-air' && floor.cls === 'none' && floor.outside === 'mars-air', JSON.stringify({ out, ground, floor }));
      assert(ship.cls === 'none' && ship.outside === 'none' && ship.sunBody === null && sk === NO_SKY && sk.level === 0 && k.level > 0.5, JSON.stringify({ ship, sk, k: k.level }));
      assert(clockLighting(SHIP, msAtLocal(SHIP, START_MS, 12, 0)) === 'day', 'a ship\'s noon UTC is day');
    },
  },
  {
    name: 'env-clock: no quiet Melas: an unknown site, a longitude off Mars, a clock not built, a sky with no rows, a site with no Plan of the Day or water, and the sun off Mars throw',
    fn() {
      const EARTH = Object.freeze({ ...SHIP, id: 'test-town', kind: 'town', body: 'earth', clock: 'earth-local', lighting: 'town', routine: null });
      const EARTH_UTC = Object.freeze({ ...EARTH, id: 'test-town-utc', clock: 'utc' });
      const cases = {
        'localTime of an unknown site': () => localTime('nowhere', START_MS),
        'lonOf with an unknown live site': () => lonOf({ places: { live: { site: 'nowhere', area: null } } }),
        'lonOfSite of a ship': () => lonOfSite(SHIP),
        'lonOfSite of an Earth town': () => lonOfSite(EARTH_UTC),
        'an Earth clock (not built)': () => localTime(EARTH, START_MS),
        'msAtLocal on a clock not built': () => msAtLocal(EARTH, START_MS, 8, 0),
        'the sky of an Earth town (no rows)': () => skyAt(EARTH_UTC, START_MS),
        'a town\'s lighting (no hours)': () => clockLighting(EARTH_UTC, START_MS),
        'a ship\'s Plan of the Day (none yet)': () => routineOf(SHIP),
        'a site with no water': () => waterOf({ ...SHIP, water: undefined }),
        'the sun over a site not on Mars': () => sunAt('test-hull', START_MS),
        'the sun over an unknown site': () => sunAt('nowhere', START_MS),
        'a site with no clock': () => clockOf({ ...SHIP, clock: undefined }),
      };
      const got = Object.entries(cases).map(([what, fn]) => [what, throws(fn)]);
      for (const [what, msg] of got) console.log(`      ${what}: ${msg ? `throws (${msg.slice(0, 90)})` : 'DID NOT THROW'}`);
      assert(got.every(([, msg]) => msg), got.filter(([, m]) => !m).map(([w]) => w).join(', '));
      // (and what still reads: Melas's and the test rooms' longitude, the start site's before any is live)
      const lons = [lonOf({ places: { live: { site: 'melas', area: 'melas.ground' } } }), lonOf({ places: { live: { site: 'test', area: 'test.rooms' } } }), lonOf({ places: { live: null } }), lonOfSite('melas'), timeAt(MELAS_LON, START_MS).face];
      console.log(`      still read: ${lons.join(', ')}`);
      assert(lons[0] === MELAS_LON && lons[1] === MELAS_LON && lons[2] === MELAS_LON && lons[3] === MELAS_LON && lons[4] === 'mars-local', JSON.stringify(lons));
    },
  },  {
    name: 'env-clock (F119): off Mars a body ticks a sol at Phobos and aboard Testudo, skips and a sleep included, with no throw; its sleep pressure and body clock printed against Melas\'s; a save made asleep there carries on byte for byte',
    async fn() {
      const C = await sitesCopy(), out = {}, bad = [];
      for (const id of SOL_SITES.slice(1)) {
        const rec = C.siteOf(id), stand = STAND_INS.find(x => x.id === id);
        console.log(`      ${id}: ${rec?.template === stand.template ? 'the stand-in (tests/site-hooks.mjs)' : `D's record (${rec?.template})`}, clock ${rec?.clock}, routine ${rec?.routine}`);
        if (!rec) bad.push(`${id}: not in the copy's registry`);
      }
      for (const site of SOL_SITES) {
        let r;
        try { r = solAt(C, site); } catch (e) { bad.push(`${site ?? 'melas'}: threw ${String(e?.stack ?? e).split('\n').slice(0, 3).join(' | ')}`); continue; }
        out[site ?? 'melas'] = r;
        const fmtH = (h) => `${pad2(Math.floor(h))}:${pad2(Math.floor((h % 1) * 60))}`;
        console.log(`      ${site ?? 'melas'} (day key ${r.day}): ${fmt(r.livedH, 2)} h lived in ${r.skips + 3} skips, errors ${r.errors}; the night ${r.pod ? `taps ${fmtH(C.dayPhaseOf(r.g.state, r.pod.tapsMs).hour)}, reveille ${fmtH(C.dayPhaseOf(r.g.state, r.pod.reveilleMs).hour)}` : 'none'}`);
        for (const w of r.rows) console.log(`        ${w.what.padEnd(10)} ${fmtH(w.h)} on a ${fmt(w.dayLenMs / HOUR_MS, 2)} h day: pressure ${fmt(w.pH, 2)} h, body clock offset ${fmt(w.offH, 3)} h, φ ${fmt(w.phi, 2)}, ${w.asleep ? 'asleep' : 'awake'}`);
        if (r.errors) bad.push(`${site ?? 'melas'}: ${r.errors} lost ticks: ${r.g.errors.slice(0, 2).join(' | ')}`);
        if (!(r.livedH >= 25)) bad.push(`${site ?? 'melas'}: only ${r.livedH} h lived`);
        if (!r.rows.every(w => [w.h, w.pH, w.offH, w.phi].every(Number.isFinite))) bad.push(`${site ?? 'melas'}: a reading not finite ${JSON.stringify(r.rows)}`);
        const asleep = r.rows.find(w => w.what === 'asleep'), down = r.rows.find(w => w.what === 'down');
        if (!asleep?.asleep || !(asleep.pH < down.pH)) bad.push(`${site ?? 'melas'}: the sleep did not recover the pressure ${JSON.stringify({ down, asleep })}`);
        if (site && (r.day !== UTC_DAY || r.rows.some(w => w.dayLenMs !== DAY_MS))) bad.push(`${site}: not on the UTC day ${JSON.stringify({ day: r.day, len: r.rows.map(w => w.dayLenMs) })}`);
        if (!site && (r.day !== MELAS_LON || r.rows.some(w => w.dayLenMs !== SOL_MS))) bad.push(`melas: not on the sol at its longitude ${JSON.stringify({ day: r.day })}`);
        if (site) {
          // (the save made asleep there, loaded in a fresh game of the copy: both carry on, 200 ticks and two hours, to one digest)
          const A = C.createGame({ scenario: 'barracks', seed: 48213, hour: 21 }), B = C.createGame({ scenario: 'barracks', seed: 48213, hour: 21 });
          A.load(r.saved); B.load(r.saved);
          for (const x of [A, B]) { x.step(200, {}); x.skipNow({ activity: 'wait', planMs: 2 * HOUR_MS, mask: 'D' }); }
          const da = A.digest(), db = B.digest(), first = A.digest();
          console.log(`        its save at ${fmtH(C.dayPhaseOf(A.state, r.atSave).hour)} UTC, asleep: loaded twice and carried on 200 ticks and 2 h: ${da} and ${db}, errors ${A.errors.length} and ${B.errors.length}`);
          if (da !== db || first !== da || A.errors.length || B.errors.length) bad.push(`${site}: the save did not carry on byte for byte ${JSON.stringify({ da, db })}`);
        }
      }
      const m = out.melas, p = out['phobos-void'];
      if (m && p) console.log(`      against Melas: the pressure after the sleep ${fmt(p.rows.find(w => w.what === 'asleep').pH, 2)} h at Phobos, ${fmt(m.rows.find(w => w.what === 'asleep').pH, 2)} h at Melas (the same ms: ${fmt(p.rows.find(w => w.what === 'down').h, 2)} UTC against ${fmt(m.rows.find(w => w.what === 'down').h, 2)} on the sol)`);
      assert(!bad.length, bad.join('\n'));
    },
  },
  {
    name: 'env-clock (F119): on Mars the day functions are the Mars ones, call for call (dayClock, localDay, msAtDayTime, dayPhaseOf\'s hour against marsClock, localSol, msAtMarsTime and the activities\' old hour, 2,000 random times); on UTC they are UTC\'s',
    fn() {
      const r = stream(48213, 'test:env-clock:day'), bad = [];
      const g = createGame({ scenario: 'barracks', seed: 48213 }), s = g.state, lon = siteDayOf(s);
      let n = 0;
      for (let i = 0; i < 2000; i++) {
        const ms = START_MS + int(r, 3_000_000_000) * 7 + int(r, 1000), h = int(r, 24), mi = int(r, 60);
        const mc = marsClock(ms, MELAS_LON), dc = dayClock(ms, lon);
        const oldHour = mc.timeslip ? 24 : mc.civilMs / 3_600_000;
        if (JSON.stringify(mc) !== JSON.stringify(dc)) bad.push(`dayClock ${ms}`);
        if (JSON.stringify(localSol(ms, MELAS_LON)) !== JSON.stringify(localDay(ms, lon))) bad.push(`localDay ${ms}`);
        if (msAtMarsTime(ms, h, mi, MELAS_LON) !== msAtDayTime(ms, h, mi, lon)) bad.push(`msAtDayTime ${ms}`);
        if (dayPhaseOf(s, ms).hour !== oldHour) bad.push(`dayPhaseOf ${ms}`);
        // (UTC's: the hour and the day's length from utc())
        const u = utc(ms), du = dayClock(ms, UTC_DAY), at = msAtDayTime(ms, h, mi, UTC_DAY), ua = utc(at);
        if (du.hour !== u.hour || du.minute !== u.minute || du.weekday !== u.weekday || du.timeslip) bad.push(`utc ${ms}`);
        if (ua.hour !== h || ua.minute !== mi || at < ms || at - ms >= DAY_MS) bad.push(`utc time ${ms} ${h}:${mi}`);
        n++;
      }
      console.log(`      ${n} times on Melas's day key ${lon} (a ${fmt(dayLenOf(lon) / HOUR_MS, 3)} h sol) and on UTC (${fmt(dayLenOf(UTC_DAY) / HOUR_MS, 0)} h): ${bad.length} differences${bad.length ? `: ${bad.slice(0, 5).join(', ')}` : ''}`);
      assert(lon === MELAS_LON && !bad.length, JSON.stringify({ lon, bad: bad.slice(0, 10) }));
    },
  },
];
