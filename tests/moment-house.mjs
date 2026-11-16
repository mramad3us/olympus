// OLYMPUS tests: the shoot house's six acceptance moments, their recipes and their timeline (the build sheet v0.0.21 §1 item 19; done lens D3; ROADMAP §2.3).
//
// A moment is a named stretch of play the user would recognise, played start to end by its bot in node and its beats shown in the
// page (ROADMAP §2.3's two parts). The house had none (tests/moment-*.test.mjs were the shower, the night and the basin). These are a
// test scene's moments, honestly: the career's fixtures arrive with the join at the MOUT morning (COMBAT §25.10.1). All six on the
// house as set (draw: 'set', §0 item 41: "room 2's pull door" and room 2's hinges are the set's):
//   house-steps  "Step by step, as a private"  the private on 48213 from the brief by the keys (the Watch below rung 2)
//   house-clean  "Clean, as tier one"          the tier one on 48213 from the brief by T
//   house-jam    "The jam in room 2"           the sergeant on 1037 from setup room:2, the honest bot answering the card with
//                                               Transition (1037: the first set seed of flawless.mjs's whose dummy clicks in room 2)
//   house-bang   "Bang, then go"               the sergeant on 48213 from GO on the flash loadout, the kit's honest bot
//   house-cut    "Through the hinges"          the sergeant on 48213 from GO on the cut loadout, the kit's honest bot
//   house-man    "A man, not a stand"          the sergeant on 48213 from GO on the live lane (&opfor=live), the honest bot
// Each recipe: { id, title, start: { scenario, tier, seed, setup, loadout, opfor, draw }, bot(), key (the one real key the page part
// presses at its first stop, by code), holds(game, rec) → { ok, words } (what must be true at its card), prints }. playMoment(m)
// plays one to its card in node and keeps ROADMAP §2.3's timeline: the lived seconds (the clock from the start to the card), the
// stops (each time the clock stands still: a pause the player decides in), the modelled real minutes (lived plus THINK_S 6 s a
// stop plus each skip's splash, its real seconds by TIME §6.2's model: the hot wash's 90 s behind a 1.15 s splash, never lived),
// the decisions a real minute, the dead air (each gap over DEAD_AIR_GAP_S 15 s of lived time with nothing new: no word said or
// being said, a line counted to its spoken end, no stop) and the longest gap; and saves each beat (the start, GO, each room entered, the first stop after GO, the card) to
// .run/moments/house-<id>/. Pure but the beats' files.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { root } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse, houseHonestBot, houseKeysBot, houseTBot, stoppageBot } from './bots/house.mjs';
import { houseKitBot } from './bots/kit.mjs';
import { THINK_S, DEAD_AIR_GAP_S } from './flawless-done.mjs';
import { houseNow, houseVerdict, runSheetOf, iaBookOf, HANDS_K } from '../src/sim/scenarios/shoothouse.js';
import { BANG_LATE_MS } from '../src/sim/combat/burst.js';
import { splashPlan } from '../src/sim/time/splash.js';

export const MOMENTS_DIR = path.join(root, '.run', 'moments');
const legsOf = (H) => [...H.rooms, H.hall];
const s2 = (v) => (Number.isFinite(v) ? v.toFixed(2) : '-');

/** The six (see the header). */
export const MOMENTS = Object.freeze([
  { id: 'house-steps', title: 'Step by step, as a private', start: { scenario: 'test-shoothouse', tier: 'private', seed: 48213, setup: null, draw: 'set' }, bot: () => houseKeysBot({ watch: true }), key: 'KeyT',
    holds(g) {
      const s = g.state, H = s.armoury.range.house, N = houseNow(s), missed = N.contacts.filter(c => c.by === 'me' && c.parMet === false), uncaused = missed.filter(c => !c.cause);
      const late = legsOf(H).filter(L => L.door !== 'hall' && Number.isFinite(L.heelsMs) && L.heelsMs > 3000);
      return { ok: !!H.end && H.end.why !== 'time' && !uncaused.length && !late.length, words: `the card (${H.end?.why}); presses a room ${legsOf(H).map(L => L.presses).join(', ')}; take-ins ${N.contacts.filter(c => c.by === 'me').map(c => s2(c.takeInMs / 1000)).join(', ')} s; pars missed ${missed.length}, each named by its cause (${missed.map(c => c.cause).join(', ') || 'none'}); the #2 on your heels within 3 s in every room (${legsOf(H).map(L => s2(L.heelsMs / 1000)).join(', ')} s)` };
    } },
  { id: 'house-clean', title: 'Clean, as tier one', start: { scenario: 'test-shoothouse', tier: 'tierone', seed: 48213, setup: null, draw: 'set' }, bot: () => houseTBot(), key: 'KeyT',
    holds(g, rec) {
      const s = g.state, H = s.armoury.range.house, rs = runSheetOf(s), v = houseVerdict(s);
      return { ok: v.go === true && rs.one.key === 'clean' && rec.goStops <= 14, words: `"${rs.verdict?.words}" and "${rs.one.text}" (${rs.one.key}); stops after GO ${rec.goStops}; room 1 ${s2(legsOf(H)[0].clearAtMs !== null ? (legsOf(H)[0].clearAtMs - legsOf(H)[0].fromMs) / 1000 : null)} s; the lane ${s2((H.end.atMs - H.goAtMs) / 1000)} s` };
    } },
  { id: 'house-jam', title: 'The jam in room 2', start: { scenario: 'test-shoothouse', tier: 'sgt', seed: 1037, setup: 'room:2', draw: 'set' }, bot: () => stoppageBot({ answer: 'transition' }), key: 'KeyT',
    holds(g, rec) {
      const s = g.state, H = s.armoury.range.house, d = H.dummy, clear = d.clearedAtMs !== null ? d.clearedAtMs - d.clickAtMs : null, ia = iaBookOf(s, H);
      return { ok: rec.clickLeg === 1 && clear !== null && clear <= HANDS_K * ia && !!H.end && H.end.why !== 'time', words: `the click in ${['room 1', 'room 2', 'room 3', 'the hall'][rec.clickLeg] ?? 'no room'}, the round ${d.round} of ${d.n}; cleared ${s2(clear / 1000)} s after (the immediate action's book ${s2(ia / 1000)} s × ${HANDS_K}); the card (${H.end?.why}), the verdict ${houseVerdict(s).go ? 'GO' : 'NO-GO'}` };
    } },
  { id: 'house-bang', title: 'Bang, then go', start: { scenario: 'test-shoothouse', tier: 'sgt', seed: 48213, setup: 'go', loadout: 'flash', draw: 'set' }, bot: () => houseKitBot({ use: 'flash' }), key: 'KeyT',
    holds(g) {
      const s = g.state, H = s.armoury.range.house, bangs = legsOf(H).filter(L => Number.isFinite(L.bangMs)), blast = legsOf(H).flatMap(L => L.faults.filter(f => f.kind === 'blast'));
      return { ok: bangs.length > 0 && bangs.every(L => L.bangMs <= BANG_LATE_MS) && !blast.length && !!H.end, words: `bangs ${bangs.length}: the bang to entry ${bangs.map(L => `${L.room} ${s2(L.bangMs / 1000)} s`).join(', ')} (at most ${BANG_LATE_MS / 1000} s); the stack in the blast ${blast.length}; marks ${legsOf(H).flatMap(L => L.kit ?? []).join('; ') || 'none'}` };
    } },
  { id: 'house-cut', title: 'Through the hinges', start: { scenario: 'test-shoothouse', tier: 'sgt', seed: 48213, setup: 'go', loadout: 'cut', draw: 'set' }, bot: () => houseKitBot({ use: 'cut' }), key: 'KeyT',
    holds(g) {
      const s = g.state, H = s.armoury.range.house, marks = legsOf(H).flatMap(L => L.kit ?? []), blast = legsOf(H).flatMap(L => L.faults.filter(f => f.kind === 'blast'));
      return { ok: !blast.length && !!H.end && H.end.why !== 'time', words: `the card (${H.end?.why}); the stack in the blast ${blast.length}; marks ${marks.join('; ') || 'none'}; the verdict ${houseVerdict(s).go ? 'GO' : 'NO-GO'}` };
    } },
  { id: 'house-man', title: 'A man, not a stand', start: { scenario: 'test-shoothouse', tier: 'sgt', seed: 48213, setup: 'go', opfor: 'live', draw: 'set' }, bot: () => houseHonestBot(), key: 'KeyT',
    holds(g) {
      const s = g.state, H = s.armoury.range.house, N = houseNow(s), men = N.turners.filter(T => T.live), loose = men.filter(T => !T.down && !T.out && !T.covered);
      return { ok: !!H.live && men.length > 0 && !!H.end && (H.end.why === 'casualty' || !loose.length), words: `${men.length} role-players: ${men.map(T => `${T.stand} ${T.down ? 'down' : T.out ? 'out' : T.covered ? 'covered' : 'loose'}`).join(', ')}; the card (${H.end?.why}); ${N.live?.casualty ? `a casualty on ${N.live.casualty.who === s.player.id ? 'you' : 'your #2'}` : 'no casualty'}` };
    } },
]);

/** A moment's recipe by id. */
export const momentOf = (id) => MOMENTS.find(m => m.id === id) ?? null;

/** Play a moment to its card in node (see the header): { m, done, cpuMs, livedS, stops, goStops, realMin, decisionsMin, deadAirS, deadShare, longestS, clickLeg, beats, held }. */
export function playMoment(m, { save = true } = {}) {
  const t0 = performance.now(), dir = path.join(MOMENTS_DIR, m.id), beats = [];
  if (save) mkdirSync(dir, { recursive: true });
  const st = m.start, g = createGame({ scenario: st.scenario, seed: st.seed, tier: st.tier, ...(st.setup ? { setup: st.setup } : {}), ...(st.loadout ? { loadout: st.loadout } : {}), ...(st.opfor ? { opfor: st.opfor } : {}), draw: st.draw ?? 'set' });
  const beat = (name) => { beats.push(name); if (save) writeFileSync(path.join(dir, `${String(beats.length - 1).padStart(2, '0')}-${name}.json`), g.save()); };
  beat('start');
  const s = g.state, H = s.armoury.range.house, bot = m.bot();
  // (lived: the clock's ms outside a skip; the gaps on that lived clock, a word new at its start and busy to its spoken end)
  let lastMs = s.clock.ms, livedMs = 0, splashS = 0, stops = 0, goStops = 0, held = false, lastNew = 0, busyTo = 0, deadMs = 0, longestMs = 0, firstStop = false, clickLeg = null, clickBeat = false;
  const entered = new Set();
  const news = (at, until = at) => { const from = Math.max(lastNew, busyTo), gap = at - from; if (gap > longestMs) longestMs = gap; if (gap > DEAD_AIR_GAP_S * 1000) deadMs += gap; lastNew = at; busyTo = Math.max(busyTo, until); };
  const run = runHouse(g, bot, { maxMs: 15 * 60_000, each: (game) => {
    const now = game.state.clock.ms, h = game.state.armoury.range.house, still = now === lastMs;
    for (const f of game.facts('skip-start')) splashS += splashPlan(f).totalS ?? 0;
    if (!game.state.skip) livedMs += now - lastMs;
    if (still && !held) { stops++; if (h.goAtMs !== null) goStops++; news(livedMs); if (h.goAtMs !== null && !firstStop) { firstStop = true; beat('first-stop'); } if (clickLeg !== null && !clickBeat) { clickBeat = true; beat('click'); } }
    held = still; lastMs = now;
    for (const f of game.facts('say')) news(livedMs, livedMs + (f.durMs ?? 0));
    if (h.goAtMs !== null && !beats.includes('go')) beat('go');
    for (const [k, L] of legsOf(h).entries()) if (L.state !== 'ahead' && L.fromMs !== null && !entered.has(k) && k === h.cur && ['entered', 'clear'].includes(L.state)) { entered.add(k); beat(`${['room-1', 'room-2', 'room-3', 'hall'][k]}`); }
    if (clickLeg === null && h.dummy.clickAtMs !== null) clickLeg = h.cur;
  } });
  news(livedMs);
  beat('card');
  const livedS = livedMs / 1000, realMin = (livedS + THINK_S * stops + splashS) / 60;
  return { m, g, done: run.done, cpuMs: performance.now() - t0, livedS, splashS, stops, goStops, realMin, decisionsMin: realMin > 0 ? stops / realMin : 0, deadAirS: deadMs / 1000, deadShare: realMin > 0 ? deadMs / 1000 / (realMin * 60) : 0, longestS: longestMs / 1000, clickLeg, beats, dir, end: H.end?.why ?? null };
}
/** A played moment's pace for F71 (flawless-done.mjs paceRow): { id, tier, livedS, stops, realMin, deadShare }. */
export const paceOf = (r) => ({ id: r.m.id, tier: r.m.start.tier, livedS: r.livedS, stops: r.stops, realMin: r.realMin, deadShare: r.deadShare });
/** ROADMAP §2.3's timeline line of a played moment. */
export const timelineOf = (r) => `${r.m.id} "${r.m.title}" (${r.m.start.tier} ${r.m.start.seed}${r.m.start.setup ? ` ${r.m.start.setup}` : ' from the brief'}${r.m.start.loadout ? ` ${r.m.start.loadout}` : ''}${r.m.start.opfor ? ` ${r.m.start.opfor}` : ''}): ${r.livedS.toFixed(1)} s lived, ${r.splashS.toFixed(2)} s of splash, ${r.stops} stops (${r.goStops} after GO), ${r.realMin.toFixed(2)} real min at ${THINK_S} s a stop, ${r.decisionsMin.toFixed(1)} decisions a real minute, dead air ${(100 * r.deadShare).toFixed(0)}% (${r.deadAirS.toFixed(1)} s), the longest gap ${r.longestS.toFixed(1)} s; ${r.beats.length} beats, ${(r.cpuMs / 1000).toFixed(1)} s of compute`;
