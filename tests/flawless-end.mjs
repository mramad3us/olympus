// OLYMPUS tests: the lane's end and the drawn live lane's gauges, F80 to F82 (the build sheet v0.0.22 §8): the lane ends as it is ended (SHOW CLEAR to the instructor's eye, the tail behind the splash, no lane word after it, one "Clear!" a man a leg), and "Stack and clear, live" on a drawn house as on the set.
//
// endLane({ tier, seed, bot, opfor, fill }) plays one lane of test-shoothouse from the fill (the brief, LOAD, MAKE READY, GO, the
// rooms, the casualty's cease fire or the hall, Stop, UNLOAD, SHOW CLEAR, the hot wash) to the range's end with tests/bots/house.mjs
// runHouse, and watches every tick (endWatch) for what F82 reads:
//   - each "Clear." the instructor says to you after Stop (the show's look, the coach's take) and each "Number two, clear.", with his
//     eye's distance to that marine's chest then (his eye at the catwalk's height, the chest CHEST_Y_M over the floor: shoothouse.js
//     chiefSees' own measure), against SHOW_CLEAR_M;
//   - the tail: from your guns passed (the look at you done, R.house.show.done) to the tower's "The lane is clear." (the wash), in
//     modelled real time: a lived tick TICK_MS, a run of skipped ticks (a fast-forward, an activity behind the brief splash) one frame,
//     FRAME_MS; and the stop-motion pauses that opened inside it (a choose phase begun);
//   - the lane's words after its end (R.house.end): a dummy's praise (HOUSE_CHIEF.dummy), "The lane is clear." on a lane not ended
//     'clear' (a lane 'passed' is one whose last leg the stall or the due passed: the B and C review of 2026-11-16), your #2's "Clear!" or "Up." between a marine's "I'm hit!" and the cease fire, "Keep working." in the
//     KEEP_WORKING_MS before a CEASE FIRE, and "Man down!" from the other marine at a casualty;
//   - your #2's "Clear!" a leg (the leg current when the tick began: his echo is said in the tick his leg ends).
// endGaugeOf(recs) gives F82's row: every clear in reach, every tail at most TAIL_REAL_MAX_MS with no pause in it, no lane word after
// the end, at most one "Clear!" of his a leg; enforced on every honest, keys and T lane (the fuzz printed: endGaugeOf({ printOnly })).
// F80 and F81 (the drawn live lanes: F38 to F43 as on the set through tests/flawless-live.mjs liveLane with the house's options, every
// post passing tests/opfor-world.mjs spotCheck at the fill, F44's bands; the race by post) are liveDrawnGaugeOf's.
import { createGame } from './game.mjs';
import { houseBot, houseHonestBot, houseFuzzBot, runHouse } from './bots/house.mjs';
import { HOUSE_CHIEF, COURSES } from '../src/data/courses.js';
import { SHOW_CLEAR_M, CHEST_Y_M } from '../src/sim/scenarios/shoothouse.js';
import { TICK_MS } from '../src/core/clock.js';
import { spotOf } from '../src/sim/scenarios/opfor.js';
import { spotCheck } from './opfor-world.mjs';
// (tests/flawless-live.mjs, F80's, loaded by its async helpers only: the quick files that read the lane's end load none of it)
const LIVE = () => import('./flawless-live.mjs');

/** The tail's ceiling in modelled real time (ms; the build sheet's §5, FL22-1's "after"). */
export const TAIL_REAL_MAX_MS = 1500;
/** A skipped run's modelled real time: one frame at 60 Hz (ms). */
export const FRAME_MS = 1000 / 60;
/** No "Keep working." this long before a CEASE FIRE (ms; FL22-2's measure). */
export const KEEP_WORKING_MS = 2500;
/** F81: no chunk's post where the role-player fires first on more than this share of the honest sergeant's drawn lanes. */
export const LIVE_FIRST_MAX = 0.50;

const ME_CLEAR = /^(Good\. )?Clear\.( Good\.)?$/;
const TWO_CLEAR = new Set(HOUSE_CHIEF.twoClear);
const DUMMY = new Set(HOUSE_CHIEF.dummy);
const CEASE = new Set([...HOUSE_CHIEF.casualty, ...HOUSE_CHIEF.twoDown]);
const HIT = new Set(COURSES.house.opfor.hit), MAN_DOWN = new Set(COURSES.house.opfor.manDown);
const LANE_CLEAR = /^The lane is clear\./;

/** A bot by name: 'keys' and 'T' the house bot's modes, 'honest' the flawless bot, 'fuzz' the fuzz bot on the seed. */
export function endBotOf(bot, seed) {
  if (bot === 'keys') return houseBot({ mode: 'keys' });
  if (bot === 'T') return houseBot({ mode: 'T' });
  if (bot === 'fuzz') return houseFuzzBot({ seed });
  return houseHonestBot();
}

/** The watcher (see the header): each(game) after every tick; rec() the lane's record. */
export function endWatch(game) {
  const s0 = game.state, pid = s0.player.id, H0 = s0.armoury.range.house, twoPid = H0.twoPid, chief = H0.chiefPid;
  const A = (p) => (p ? game.state.actors.list.find(a => a.who === p) ?? null : null);
  const eyeTo = (p) => { const c = A(chief), m = A(p); return c && m ? Math.hypot(c.x - m.x, (c.y ?? 0) - (m.y ?? 0) - CHEST_Y_M, c.z - m.z) : null; };
  const out = { clears: [], tail: null, after: [], twoClears: {}, keepWorking: [], cease: null, hits: [], manDown: [], twoInCasualty: [], paintSaid: [], wash: null, words: [] };
  let cur = H0.cur ?? 0, stopped = false, passedMs = null, washMs = null, real = 0, skipping = false, choosing = false, pauses = 0, lastKeep = [];
  const each = (game) => {
    const st = game.state, R = st.armoury.range, H = R.house, now = st.clock.ms;
    const skip = !!st.skip || !!st.time?.doing, ch = st.stop?.mode === 'stop' && st.stop.phase === 'choose';
    if (R.cmd?.id === 'stop') stopped = true;
    for (const [type, e] of game.bus.events) {
      if (type !== 'say') continue;
      const text = String(e.text ?? '');
      if (e.who === chief && stopped && ME_CLEAR.test(text)) out.clears.push({ who: 'me', text, atMs: now, dM: eyeTo(pid) });
      if (e.who === chief && TWO_CLEAR.has(text)) out.clears.push({ who: 'two', text, atMs: now, dM: eyeTo(twoPid) });
      if (e.who === chief && H.end && DUMMY.has(text)) out.after.push({ what: 'dummy', text, atMs: now });
      if (e.who === chief && LANE_CLEAR.test(text) && H.end?.why !== 'clear') out.after.push({ what: 'lane clear', text, atMs: now, why: H.end?.why ?? null });
      if (e.who === chief && /Keep working\.$/.test(text)) { lastKeep.push(now); out.paintSaid.push({ atMs: now, text }); }
      if (e.who === chief && e.kind === 'pa' && out.wash === null && /^(The lane is clear|Weapons clear|Guns are clear)/.test(text)) out.wash = text;
      if (H.goAtMs !== null) out.words.push({ who: e.who === pid ? 'me' : e.who === twoPid ? 'two' : e.who === chief ? 'chief' : 'man', text, atMs: now });
      if (e.who === chief && CEASE.has(text)) { out.cease = now; for (const t of lastKeep) if (now - t <= KEEP_WORKING_MS) out.keepWorking.push(now - t); }
      if (HIT.has(text)) out.hits.push({ who: e.who === pid ? 'me' : 'two', atMs: now });
      if (MAN_DOWN.has(text)) out.manDown.push({ who: e.who === pid ? 'me' : 'two', atMs: now });
      if (e.who === twoPid && (text === 'Clear!' || text === 'Up.') && out.hits.length && out.cease === null) out.twoInCasualty.push({ text, atMs: now });
      if (e.who === twoPid && text === 'Clear!' && H.goAtMs !== null) out.twoClears[cur] = (out.twoClears[cur] ?? 0) + 1;
    }
    // (the tail, from your guns passed to the wash: a lived tick TICK_MS, a run of skipped ticks one frame; the pauses opened in it)
    if (passedMs === null && H.show?.done?.[pid] !== undefined) passedMs = H.show.done[pid];
    if (passedMs !== null && washMs === null) {
      if (R.cmd?.id === 'wash') washMs = now;
      else {
        if (skip) { if (!skipping) real += FRAME_MS; } else real += TICK_MS;
        // (the choose your own step's end opens on the tick your guns pass is that step's, not a pause in the tail)
        if (ch && !choosing && now > passedMs) pauses++;
      }
    }
    skipping = skip; choosing = ch;
    cur = H.cur ?? cur;
  };
  const rec = () => {
    const H = game.state.armoury.range.house;
    out.tail = passedMs === null ? null : { realMs: Math.round(real), gameMs: washMs === null ? null : washMs - passedMs, pauses, washed: washMs !== null };
    out.end = H.end?.why ?? null;
    out.strikes = (H.live?.struck ?? []).map(x => ({ who: x.who === pid ? 'me' : 'two', atMs: x.atMs }));
    out.goAtMs = H.goAtMs;
    out.casualty = H.live?.casualty ? { who: H.live.casualty.who === pid ? 'me' : 'two' } : null;
    return out;
  };
  return { each, rec };
}

/** One lane watched from the fill to the range's end: { cell, done, end, ...endWatch's record }. */
export function endLane({ tier, seed, bot = 'T', opfor = null, setup = null, fill = {}, maxMs = 30 * 60_000 }) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, ...(opfor ? { opfor } : {}), ...(setup ? { setup } : {}), ...fill });
  const w = endWatch(g);
  let err = null, r = null;
  try { r = runHouse(g, endBotOf(bot, seed), { each: w.each, maxMs }); } catch (e) { err = String(e?.message ?? e).slice(0, 200); }
  return { cell: `${bot}/${tier}/${seed}${opfor ? `/${opfor}` : ''}${setup ? `@${setup}` : ''}`, bot, tier, seed, opfor, done: !!r?.done, err, tick: g.state.clock.tick, ...w.rec(), $state: g.state };
}

const r2 = (x) => (Number.isFinite(x) ? Math.round(x * 100) / 100 : x);
/** F82's row over lane records (see the header); printOnly for the fuzz's. */
export function endGaugeOf(recs, { printOnly = false } = {}) {
  const far = recs.flatMap(r => r.clears.filter(c => !(c.dM <= SHOW_CLEAR_M)).map(c => `${r.cell} ${c.who} ${r2(c.dM)} m`));
  const tails = recs.filter(r => r.tail), long = tails.filter(r => !r.tail.washed || r.tail.realMs > TAIL_REAL_MAX_MS || r.tail.pauses > 0).map(r => `${r.cell} ${r.tail.realMs} ms real, ${r.tail.pauses} pauses${r.tail.washed ? '' : ', never washed'}`);
  const words = recs.flatMap(r => [...r.after.map(a => `${r.cell} ${a.what}`), ...r.twoInCasualty.map(a => `${r.cell} his ${a.text} in the casualty`), ...r.keepWorking.map(ms => `${r.cell} "Keep working." ${ms} ms before the cease fire`),
    ...(r.casualty && !r.manDown.some(m => m.who !== r.casualty.who) ? [`${r.cell} no "Man down!"`] : [])]);
  const twice = recs.flatMap(r => Object.entries(r.twoClears).filter(([, n]) => n > 1).map(([k, n]) => `${r.cell} leg ${k}: ${n}`));
  const notDone = recs.filter(r => !r.done || r.err).map(r => `${r.cell}${r.err ? ` ${r.err}` : ''}`);
  const real = tails.map(r => r.tail.realMs).sort((a, b) => a - b), dMs = recs.flatMap(r => r.clears.map(c => c.dM)).filter(Number.isFinite).sort((a, b) => a - b);
  const met = !notDone.length && !far.length && !long.length && !words.length && !twice.length;
  return {
    id: 'F82', name: 'the lane ends as it is ended', met: printOnly ? true : met, printOnly,
    value: `${recs.length} lanes (${notDone.length} not to the card); ${dMs.length} clears, the eye at most ${r2(dMs.at(-1))} m (median ${r2(dMs[Math.floor(dMs.length / 2)])}), ${far.length} out of reach; tails ${tails.length}, real median ${real[Math.floor(real.length / 2)] ?? '-'} ms, max ${real.at(-1) ?? '-'} ms, ${long.length} over or with a pause; lane words after the end ${words.length} ("Keep working." in the KEEP_WORKING_MS before a cease fire ${recs.reduce((n, r) => n + r.keepWorking.length, 0)}); his "Clear!" twice in a leg ${twice.length}`,
    target: `every "Clear." within SHOW_CLEAR_M ${SHOW_CLEAR_M} m; tail at most TAIL_REAL_MAX_MS ${TAIL_REAL_MAX_MS} ms real, no pause; no lane word after the end; one "Clear!" a man a leg`,
    bad: [...notDone.map(x => `not done ${x}`), ...far, ...long, ...words, ...twice],
  };
}

// ---- F80 and F81: "Stack and clear, live" on a drawn house (the build sheet v0.0.22 item 15, G5) ----

/** F80's drawn slice: each sheet on these seeds, all eight rooms drawn from (rooms 'all'), the live lane's honest bot (the keys' below rung 2). */
export const DRAWN_LIVE_SEEDS = Object.freeze([31, 67, 103, 139, 175, 211, 247]);

/** One drawn live lane for F80: tests/flawless-live.mjs liveLane with the house's options, and its posts checked at the fill (spotCheck among the lane's own stands). */
export async function liveDrawnLane({ tier, seed, rooms = 'all', layout = null, opfor = 'live' }) {
  const { liveLane } = await LIVE();
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'go', opfor, ...(layout ? { layout } : { rooms }) }), s = g.state;
  const posts = s.armoury.range.turners.filter(T => T.live).map(T => {
    const S = spotOf(s, T), a = spotCheck(s, T.stand, S.start, { spot: S }), b = spotCheck(s, T.stand, S.hide, { spot: S, slot0: a.slot });
    return { stand: T.stand, ok: a.ok && b.ok, why: [...a.why, ...b.why] };
  });
  const rec = liveLane({ tier, seed, opfor, ...(layout ? { layout } : { rooms }) });
  return { ...rec, code: s.armoury.range.house.draw?.code ?? null, posts };
}
/** F80's row over drawn live lanes (see the header): F38 to F43 as liveGaugeOf reads them on the set, every post valid at the fill, F44's bands. */
export async function liveDrawnGaugeOf(recs) {
  const { liveGaugeOf } = await LIVE();
  const rows = liveGaugeOf(recs).filter(r => ['F38', 'F39', 'F40', 'F41', 'F42', 'F43', 'F44'].includes(r.id));
  const drawn = recs.filter(r => r.code), postsBad = recs.flatMap(r => r.posts.filter(p => !p.ok).map(p => `${r.code} ${p.stand}: ${p.why.join(', ')}`));
  const open = rows.filter(r => !r.met), notDone = recs.filter(r => r.err || !r.done);
  return {
    id: 'F80', name: 'the drawn live lanes as the set\'s', met: !open.length && !postsBad.length && !notDone.length && drawn.length === recs.length && recs.every(r => r.posts.length === 2),
    value: `${recs.length} lanes (${drawn.length} drawn, ${notDone.length} not to the card); ${rows.map(r => `${r.id} ${r.met ? 'MET' : 'OPEN'}`).join(', ')}; posts ${recs.reduce((n, r) => n + r.posts.length, 0)}, ${postsBad.length} off${postsBad.length ? ` (${postsBad.slice(0, 3).join('; ')})` : ''}`,
    target: 'F38 to F43 met, every post valid at the fill, F44\'s bands', rows,
  };
}
/** F81's race by post over endLane records of drawn live lanes (the honest sergeant's): by the chunk standing in the post's lane room, the share of its men who fired before the stack's first round on them; printed, enforced at the measure (a post too strong is a finding for the post). */
export function raceByPostOf(recs) {
  const by = {};
  for (const r of recs) {
    const s = r.$state, code = s.armoury.range.house.draw?.code;
    if (!code) continue;
    const rooms = code.split('|')[0].split('.');
    for (const T of s.armoury.range.turners.filter(x => x.live)) {
      const chunk = rooms[Number(T.stand[0]) - 1]?.[0] ?? '?', o = (by[chunk] ??= { n: 0, first: 0 });
      if (!Number.isFinite(T.live.firstAtMs)) { o.n++; continue; }
      o.n++;
      if (!Number.isFinite(T.firstAtMs) || T.live.firstAtMs < T.firstAtMs) o.first++;
    }
  }
  const worst = Object.entries(by).map(([c, o]) => [c, o.n ? o.first / o.n : 0]).sort((a, b) => b[1] - a[1]);
  return {
    id: 'F81', name: 'the race by post', met: worst.every(([, k]) => k <= LIVE_FIRST_MAX), printOnly: true,
    value: Object.entries(by).sort().map(([c, o]) => `${c} ${o.first}/${o.n} (${Math.round(o.n ? o.first / o.n * 100 : 0)}%)`).join(', '),
    target: `no post's role-player first on more than LIVE_FIRST_MAX ${LIVE_FIRST_MAX * 100}% (printed; enforced at the measure)`,
  };
}
