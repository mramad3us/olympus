// OLYMPUS tests: the live lane's paint, its card and its saves, the hunt of v0.0.20's seven findings of the paint hunter (.run/hunt-v020/findings.md: paint-owed, frag-down, arm-card, par-met-first, gap-zero, bleed-shock, save-gait), each case failing without its fix.
//
// The quick cases build the state each finding needs on a fresh fill (a strike, a frag's read, a wound in shock) and read the
// instructor's words, the run sheet and the card; the save at a pause plays the keys bot to its second stop-motion pause and back.
// The heavy cases play the hunt's own lanes from the fill to the card (the corporal's keys lane on seed 1, the sergeant's by T on
// 48213 with live:hide,fight, the sergeant's keys lane on seed 1, the kit fuzz's frag lane on 13, the corporal's fuzz lane on 31)
// and hold the words, the rows and the card the finding names. Each prints what it measures.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseKeysBot, houseTBot, houseFuzzBot, runHouse } from './bots/house.mjs';
import { kitFuzzBot } from './bots/kit.mjs';
import { runSheetOf, houseNow, legWords, houseRules, paintSays } from '../src/sim/scenarios/shoothouse.js';
import { readsTick } from '../src/sim/scenarios/house-kit.js';
import { ruleOut } from '../src/sim/scenarios/opfor.js';
import { wouldTick, wouldHave, fatalOf, downAtOf, LATE_WHY } from '../src/sim/combat/would.js';
import { houseGrid } from '../src/ui/cards/house.js';
import { HOUSE_CHIEF } from '../src/data/courses.js';

const live = (o = {}) => createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', opfor: 'live:fight,fight', ...o });
const houseOf = (g) => g.state.armoury.range.house;
const manOf = (g, stand) => g.state.armoury.range.turners.find(T => T.live && T.stand === stand);
const said = (g) => g.facts('say').map(f => f.text);
const sec = (g, ms) => ((ms - (houseOf(g).goAtMs ?? 0)) / 1000).toFixed(2);

export default [
  {
    name: 'paint-owed: a strike\'s call owed through a take-in is never said once the casualty has opened or the lane ended ("Paint, chest. Keep working." 50 ms after "I\'m hit! I\'m hit!" on v0.0.20), and paintSays says nothing then; a line owed after it is said in its place',
    fn() {
      const g = live(), s = g.state, H = houseOf(g), pid = s.player.id;
      g.clearFacts();
      // (owed as paintSays owes it while a window runs, then the casualty opened before the window closed)
      H.owed.push({ text: 'Paint, chest. Keep working.', kind: 'paint' }, 'Number two, move up.');
      H.live.casualty = { who: pid, by: null, atMs: s.clock.ms, endAtMs: null, why: 'chest', shotId: null };
      houseRules(s, null, g.bus);
      const a = said(g);
      g.clearFacts();
      paintSays(s, g.bus, 'Paint, head. Keep working.');
      const b = said(g);
      // (and with no casualty, the call is said as before)
      H.live.casualty = null;
      paintSays(s, g.bus, 'Paint, chest. Keep working.');
      const c = said(g);
      console.log(`      owed then the casualty: said ${JSON.stringify(a)}; paintSays at the casualty ${JSON.stringify(b)}, owed ${H.owed.length}; with none ${JSON.stringify(c)}`);
      assert(a.length === 1 && a[0] === 'Number two, move up.' && !b.length && H.owed.length === 0 && c.length === 1 && /Keep working/.test(c[0]), JSON.stringify({ a, b, c, owed: H.owed }));
    },
  },
  {
    name: 'frag-down: a role-player a practice frag\'s read rules out \'down\' counts DOWN on the LIVE row and the card, one it reads \'wounded\' WOUNDED, beside "FRAG IN ROOM 2: 2A DOWN" (v0.0.20: "LIVE: 0 DOWN", "2 ROLE-PLAYERS · 0 DOWN")',
    fn() {
      const out = {};
      for (const read of ['down', 'wounded']) {
        const g = live({ loadout: 'frag' }), s = g.state, R = s.armoury.range, H = houseOf(g), T = manOf(g, '2a');
        H.goAtMs = s.clock.ms; H.cur = 1; H.rooms[1].state = 'entered'; H.rooms[1].fromMs = s.clock.ms;
        (H.bursts ??= []).push({ id: 'i-test-burst', model: 'g9p', thrown: H.rooms[1].door, atMs: s.clock.ms, read: { applied: false, as: 'g9', room: T.room, atMs: s.clock.ms,
          stands: { [T.key]: { stand: T.stand, face: T.face, out: read, n: read === 'down' ? 6 : 1, kPa: 20, stunMs: 0 } }, stack: {}, concussed: [], noncombatants: [], fragged: false, exposed: null, uncookedMs: 0 } });
        readsTick(s, g.bus, R, H, s.clock.ms);
        const rs = runSheetOf(s), row = rs.rows.find(r => /^ROOM 2/.test(r.words))?.words ?? '';
        out[read] = { fragOut: T.live.fragOut, outWhy: T.live.outWhy, row, card: /\d+ ROLE-PLAYERS · [^·]+/.exec(rs.card)?.[0] };
      }
      console.log(`      ${JSON.stringify(out)}`);
      assert(out.down.fragOut === 'down' && /LIVE: 1 DOWN/.test(out.down.row) && /FRAG IN ROOM 2: 2A DOWN/.test(out.down.row) && /2 ROLE-PLAYERS · 1 DOWN/.test(out.down.card), JSON.stringify(out.down));
      assert(out.wounded.fragOut === 'wounded' && /LIVE: 0 DOWN, 1 WOUNDED/.test(out.wounded.row) && /2A WOUNDED/.test(out.wounded.row) && /0 DOWN, 1 WOUNDED/.test(out.wounded.card) && !/FIGHTING ON/.test(out.wounded.card), JSON.stringify(out.wounded));
    },
  },
  {
    name: 'arm-card: a strike the would-have drew onto the arm in front of the carrier counts LIMB on the card, where the instructor said "left arm" (v0.0.20: "PAINT ON YOU: 2 TORSO" beside "WOUNDED, CHEST AND LEFT ARM"); a v0.0.19 lane\'s count keeps the strike\'s part',
    fn() {
      const g = live(), s = g.state, H = houseOf(g), pid = s.player.id, LV = H.live, T = manOf(g, '2a');
      LV.struck = [{ who: pid, by: T.key, shotId: 'i-s1', part: 'torso', zone: 'A', atMs: s.clock.ms }, { who: pid, by: T.key, shotId: 'i-s2', part: 'torso', zone: 'A', atMs: s.clock.ms + 400 }];
      LV.would.log = [{ shotId: 'i-s1', on: pid, by: T.key, atMs: s.clock.ms, part: 'torso', zone: 'A', layer: 'soft', fatal: false, why: null, where: 'chest', w: 1.6 },
        { shotId: 'i-s2', on: pid, by: T.key, atMs: s.clock.ms + 400, part: 'armL', zone: 'A', layer: 'bare', fatal: false, why: null, where: 'left arm', w: 1.6 }];
      const card = runSheetOf(s).card, paint = /PAINT ON YOU: [^·]+/.exec(card)?.[0];
      LV.would.rule = 'count'; for (const e of LV.would.log) { e.layer = null; e.part = 'torso'; }
      const count = /PAINT ON YOU: [^·]+/.exec(runSheetOf(s).card)?.[0];
      console.log(`      the would-have's chest and left arm: "${paint}"; a v0.0.19 count: "${count}"`);
      assert(paint?.trim() === 'PAINT ON YOU: 1 TORSO, 1 LIMB' && count?.trim() === 'PAINT ON YOU: 2 TORSO', JSON.stringify({ paint, count, card }));
    },
  },
  {
    name: 'par-met-first: on the live lane a room whose man fired his first round before yours is on the card\'s FIRED FIRST ON YOU and the session grid\'s FIRED FIRST, the par met or not (v0.0.20: left off, the line built from the missed pars alone)',
    fn() {
      const g = live(), s = g.state, H = houseOf(g), T = manOf(g, '2a');
      H.goAtMs = s.clock.ms - 20_000; T.live.firstAtMs = s.clock.ms - 5_000; T.firstAtMs = s.clock.ms - 4_890;
      const card = runSheetOf(s).card, V = houseNow(s).legs[1];
      const grid = houseGrid([{ label: 'SGT', legs: [{ ...V, word: 'ROOM 2', ms: 13_000, parMs: 21_000, state: 'clear', parMissed: 0, faults: [] }] }]).rows[0].cells[0].text;
      console.log(`      room 2 gap ${V.live?.gapMs} ms; card "${/FIRED FIRST ON YOU: [^·]+/.exec(card)?.[0] ?? '(none)'}"; grid "${grid}"`);
      assert(V.live?.gapMs === 110 && /FIRED FIRST ON YOU: ROOM 2/.test(card) && /FIRED FIRST/.test(grid), JSON.stringify({ gap: V.live, card, grid }));
    },
  },
  {
    name: 'gap-zero: his first round and yours on the one tick read "FIRST ROUNDS TOGETHER", never "YOURS 0.00 S BEFORE HIS"; either side of it the gap is said as before',
    fn() {
      const g = live(), s = g.state, H = houseOf(g), V = houseNow(s).legs[1];
      const words = (gapMs) => legWords({ ...V, live: { n: 1, down: 0, gave: 0, paint: 0, paintTwo: 0, paintWould: null, paintTwoWould: null, gapMs } }, H);
      const w = [0, 50, -50].map(words).map(t => t.split(' · ').filter(x => /ROUND|BEFORE/.test(x)).join(' · '));
      console.log(`      0 ms: "${w[0]}"; +50 ms: "${w[1]}"; -50 ms: "${w[2]}"`);
      assert(w[0] === 'FIRST ROUNDS TOGETHER' && w[1] === 'HIS FIRST ROUND 0.05 S BEFORE YOURS' && w[2] === 'YOURS 0.05 S BEFORE HIS', JSON.stringify(w));
    },
  },
  {
    name: 'bleed-shock: a wound rated not fatal whose would-have blood falls into shock is judged at that tick (would.js wouldTick): its strike fatal, downAtMs the tick, the casualty from it with the instructor\'s ruling, never "I\'m hit!" again; a body above shock stays a wound',
    fn() {
      const g = live(), s = g.state, H = houseOf(g), pid = s.player.id, W = H.live.would, t0 = s.clock.ms;
      W.log = [{ shotId: 'i-s1', on: pid, by: manOf(g, '3a').key, atMs: t0, part: 'torso', zone: 'A', layer: 'soft', fatal: false, why: null, where: 'chest', w: 1.6 }];
      H.live.struck = [{ who: pid, by: manOf(g, '3a').key, shotId: 'i-s1', part: 'torso', zone: 'A', atMs: t0 }];
      // (a body at 70.5% losing 1% a minute: in shock 30 s later)
      W.bodies[pid] = { blood: 70.5, bloodMs: t0, bleedK: 1, injuries: [{ part: 'torso', kind: 'gunshot', gunshot: true, bleed: t0 + 3_600_000, rate: 1, ms: t0 }], parts: { torso: 4 } };
      const before = wouldTick(s, t0 + 20_000), f0 = fatalOf(s, pid);
      const at = wouldTick(s, t0 + 40_000), f = fatalOf(s, pid);
      console.log(`      at +20 s ${JSON.stringify(before)} (fatal ${!!f0}); at +40 s ${JSON.stringify(at)}: ${f?.why}, down at +${(downAtOf(f) - t0) / 1000} s, the strike at +${(f?.atMs - t0) / 1000} s`);
      assert(!before.length && !f0 && at.length === 1 && at[0] === pid && f?.why === LATE_WHY.shock && f.downAtMs === t0 + 40_000 && f.atMs === t0, JSON.stringify({ before, at, f }));
      // (on a lane under way: the casualty opens on the next lived tick, from the tick he fell, with the instructor's ruling, and the
      // lane ends CASUALTY_MS after it; the card names the shock and when, the one thing its own lesson)
      const g2 = live(), s2 = g2.state, H2 = houseOf(g2), me = s2.player.id, bot = houseKeysBot();
      while (!(H2.goAtMs !== null && s2.clock.ms >= H2.goAtMs + 1_000 && !s2.clock.holds?.length)) g2.step(1, bot);
      const by = manOf(g2, '3a').key, t1 = s2.clock.ms;
      H2.live.struck.push({ who: me, by, shotId: 'i-s9', part: 'legs', zone: 'A', atMs: t1 });
      wouldHave(s2, { on: me, by, shotId: 'i-s9', atMs: t1, part: 'legs', zone: 'A', margin: 6, rangeM: 5, gunId: null });
      const body = H2.live.would.bodies[me], e = H2.live.would.log.find(x => x.shotId === 'i-s9');
      e.fatal = false; e.why = null;
      Object.assign(body, { blood: 70.01, bloodMs: t1 });
      for (const i of body.injuries) if (i.gunshot) { i.bleed = t1 + 3_600_000; i.rate = 2; }
      g2.clearFacts();
      let first = null;
      while (!H2.end && s2.clock.ms < t1 + 30_000) { g2.step(1, bot); for (const t of said(g2)) (first ??= []).push(t); g2.clearFacts(); }
      const K = H2.live.casualty, rs = runSheetOf(s2);
      console.log(`      the lane: casualty ${JSON.stringify(K)}; end ${H2.end?.why} at +${((H2.end?.atMs ?? 0) - t1) / 1000} s; said ${JSON.stringify(first)}`);
      console.log(`      card: ${/FATAL[^·]+/.exec(rs.card)?.[0]}; the one thing ${rs.one.key}: "${rs.one.text}"`);
      assert(K?.late === true && K.why === 'shock' && K.atMs > t1 && H2.end?.why === 'casualty' && !first?.some(t => /I'm hit/.test(t)) && first?.some(t => HOUSE_CHIEF.bled.includes(t))
        && /FATAL: SHOCK FROM THE BLOOD LOST \d+\.\d S AFTER THE 1ST STRIKE ON YOU/.test(rs.card) && rs.one.key === 'casualty:bled', JSON.stringify({ K, end: H2.end, first, card: rs.card, one: rs.one }));
    },
  },
  // (the keys bot to a stop-motion pause it reached on the move (its nth such, the tween start not where the body stands), saved,
  // loaded into a fresh game and both played on by the same bot, their digests compared at the checks)
  ...[['live', { opfor: 'live:fight,fight' }, 1, false], ['standard', { tier: 'recruit' }, 2, true]].map(([lane, opts, nth, heavy]) => ({
    name: `save-gait${heavy ? ' (heavy)' : ''}: a save made at a stop-motion pause right after a walk carries on byte for byte, on the ${lane} lane (v0.0.20: the gait walk against idle one tick after the load, the tween start $px runtime and kept through the hold)`,
    heavy,
    fn() {
      const o = { scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', ...opts }, g = createGame(o), b = houseKeysBot();
      let n = 0, last = null;
      for (let i = 0; i < 40_000 && n < nth; i++) {
        g.step(1, b); g.clearFacts();
        const st = g.state, H = houseOf(g), p = st.stop?.mode === 'stop' && st.stop.phase === 'choose' && H.goAtMs !== null ? st.clock.ms : null;
        const me = st.actors.list.find(a => a.who === st.player.id);
        if (p !== null && p !== last && me.$px !== undefined && me.$px !== me.x) n++;
        last = p;
      }
      const g2 = createGame(o); g2.load(g.save());
      const b2 = houseKeysBot(), CHECKS = new Set([1, 2, 3, 5, 10, 20, 50, 100, 200, 400]), at = { tick: g.state.clock.tick, s: sec(g, g.state.clock.ms) };
      let apart = null, same = g.digest() === g2.digest();
      for (let i = 1; i <= 400 && apart === null; i++) {
        g.step(1, b); g2.step(1, b2); g.clearFacts(); g2.clearFacts();
        if (CHECKS.has(i) && g.digest() !== g2.digest()) apart = { i, gait: [g.state.actors.list[0].gait, g2.state.actors.list[0].gait] };
      }
      console.log(`      saved at tick ${at.tick} (GO + ${at.s} s, the pause after a walk, ${n} of ${nth}); the digest after the load ${same ? 'the same' : 'APART'}; ${apart ? `apart ${apart.i} ticks on ${JSON.stringify(apart.gait)}` : 'the same at every check to 400 ticks'}`);
      assert(n === nth && same && apart === null, JSON.stringify({ n, at, apart }));
    },
  })),
  {
    name: 'paint-owed, the hunt\'s lane (heavy): the corporal\'s keys lane on seed 1, live: no "Keep working." after "I\'m hit!" (v0.0.20: "Paint, chest. Keep working." at 22.90 s, 50 ms after it)',
    heavy: true,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 1, tier: 'cpl', opfor: 'live' }), H = houseOf(g), ev = [];
      runHouse(g, houseKeysBot(), { maxMs: 10 * 60_000, each: (x) => { for (const t of said(x)) if (/paint|hit|CEASE|Cease/i.test(t)) ev.push(`${sec(x, x.state.clock.ms)} ${t}`); } });
      const hit = ev.findIndex(e => /I'm hit/.test(e)), late = ev.findIndex((e, i) => i > hit && /Keep working/.test(e));
      console.log(`      end ${H.end?.why} at ${sec(g, H.end?.atMs)} s; ${JSON.stringify(ev)}`);
      assert(H.end?.why === 'casualty' && hit >= 0 && late < 0, JSON.stringify(ev));
    },
  },
  {
    name: 'arm-card and gap-zero, the hunt\'s lane (heavy): the sergeant by T on seed 43, live:hide,fight: the arm\'s strike LIMB on the card beside "left arm", and a room\'s rounds on the one tick "FIRST ROUNDS TOGETHER"',
    heavy: true,
    fn() {
      // (re-pointed from 48213 to seed 43 at v0.0.23's integration: v0.0.23 D's sterile check (DC3, the instructor's look on the floor
      // before LOAD, 140 ticks more from the fill to GO) moves the live lane on 48213: it now ends a casualty at 22.75 s with one torso
      // strike and no arm. Seed 43 is the only one of seeds 1 to 200 whose sergeant by T takes an arm strike ("Paint, left arm. Keep
      // working.", "1 TORSO, 1 LIMB") on a lane that also has rounds on one tick; the assertions are unchanged)
      const g = createGame({ scenario: 'test-shoothouse', seed: 43, tier: 'sgt', opfor: 'live:hide,fight' }), s = g.state, H = houseOf(g), pid = s.player.id, words = [];
      runHouse(g, houseTBot(), { maxMs: 10 * 60_000, each: (x) => { for (const t of said(x)) if (/paint/i.test(t)) words.push(t); } });
      const rs = runSheetOf(s), mine = H.live.would.log.filter(e => e.on === pid), arms = mine.filter(e => /^arm/.test(e.part)).length;
      const paint = /PAINT ON YOU: [^·]+/.exec(rs.card)?.[0]?.trim(), rows = rs.rows.map(r => r.words).filter(w => /LIVE/.test(w));
      console.log(`      said ${JSON.stringify(words)}; the would-have's ${mine.map(e => e.part).join(', ')}; card "${paint}"`);
      for (const r of rows) console.log(`      ${r}`);
      assert(arms >= 1 && new RegExp(`${arms} LIMB`).test(paint) && words.some(t => /left arm/.test(t)), JSON.stringify({ paint, mine }));
      assert(!rows.some(r => /0\.00 S BEFORE/.test(r)) && rows.some(r => /FIRST ROUNDS TOGETHER/.test(r)), JSON.stringify(rows));
    },
  },
  {
    name: 'par-met-first, the hunt\'s lane (heavy): the sergeant\'s keys lane on seed 1, live: the man who fired first and killed you puts room 2 on FIRED FIRST ON YOU, beside "HIS FIRST ROUND 0.11 S BEFORE YOURS"',
    heavy: true,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 1, tier: 'sgt', opfor: 'live' }), H = houseOf(g);
      runHouse(g, houseKeysBot(), { maxMs: 10 * 60_000 });
      const rs = runSheetOf(g.state), row = rs.rows.find(r => /^ROOM 2/.test(r.words))?.words ?? '';
      console.log(`      end ${H.end?.why} at ${sec(g, H.end?.atMs)} s; ${row}; card "${/FIRED FIRST ON YOU: [^·]+/.exec(rs.card)?.[0] ?? '(none)'}"`);
      assert(/HIS FIRST ROUND/.test(row) && /FIRED FIRST ON YOU: [^·]*ROOM 2/.test(rs.card), JSON.stringify({ row, card: rs.card }));
    },
  },
  {
    name: 'frag-down, the hunt\'s lane (heavy): the kit fuzz on the frag loadout, sergeant, seed 13, live: 2a ruled out by the frag\'s read counts DOWN on the row and the card, as "FRAG IN ROOM 2: 2A DOWN" says',
    heavy: true,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 13, tier: 'sgt', loadout: 'frag', opfor: 'live' }), H = houseOf(g);
      runHouse(g, kitFuzzBot({ seed: 13 }), { maxMs: 12 * 60_000 });
      const men = g.state.armoury.range.turners.filter(T => T.live), rs = runSheetOf(g.state), row = rs.rows.find(r => /^ROOM 2/.test(r.words))?.words ?? '';
      const fragged = men.filter(T => T.live.fragOut === 'down').length;
      console.log(`      end ${H.end?.why}; men ${men.map(T => `${T.stand} ${T.live.st}/${T.live.outWhy}/${T.live.fragOut ?? '-'}`).join(', ')}; ${/LIVE: [^·]+/.exec(row)?.[0]} · ${/FRAG IN [^·]+/.exec(row)?.[0]}; card "${/\d+ ROLE-PLAYERS · [^·]+/.exec(rs.card)?.[0]}"`);
      assert(fragged >= 1 && new RegExp(`LIVE: ${fragged} DOWN`).test(row) && new RegExp(`ROLE-PLAYERS · ${fragged} DOWN`).test(rs.card), JSON.stringify({ row, card: rs.card }));
    },
  },
  {
    // (re-pointed by v0.0.22's fixer from seed 31 to seed 48: the fixer's one "Clear!" of your #2's a room (bundle.js twoClearSaid,
    // CLEAR_WAIT_MS) moves his call on 31 from 79.40 s to 78.90 s, and the fuzz lane after it no longer bleeds: a fatal chest strike at
    // 326.45 s ends it first. Seed 48 is the corporal's first fuzz lane of 1 to 80 that bleeds into shock on the fixed tree (the
    // sergeant's 5, 26, 40, 47, 60, 64 and 79 do too), and with wouldTick undone it runs to the card "WOUNDED, CHEST", clear, at 355.15 s)
    name: 'bleed-shock, the hunt\'s lane (heavy): the corporal\'s fuzz lane on seed 48, live: the chest wound rated not fatal at 81.15 s bleeds him into shock inside the lane at 271.05 s, and the casualty opens then (without wouldTick: the lane run on to its card at 355.15 s, "WOUNDED, CHEST"; on seed 31, v0.0.20 ran on to 480.05 s)',
    heavy: true,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48, tier: 'cpl', opfor: 'live' }), s = g.state, H = houseOf(g), pid = s.player.id;
      runHouse(g, houseFuzzBot({ seed: 48 }), { maxMs: 12 * 60_000 });
      const f = fatalOf(s, pid), rs = runSheetOf(s);
      console.log(`      end ${H.end?.why} at ${sec(g, H.end?.atMs)} s; the strike at ${sec(g, f?.atMs)} s, down ${f?.why} at ${sec(g, downAtOf(f))} s; ${/FATAL[^·]+/.exec(rs.card)?.[0]}; the one thing ${rs.one.key}`);
      assert(H.end?.why === 'casualty' && H.live.casualty?.late && f?.why === 'shock' && Number.isFinite(f.downAtMs) && /WOULD HAVE BEEN: FATAL/.test(rs.card) && !/WOUNDED, CHEST/.test(rs.card), JSON.stringify({ end: H.end, f, card: rs.card }));
    },
  },
];