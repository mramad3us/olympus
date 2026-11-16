// OLYMPUS tests: the team's gauges, F34 to F37 (v0.0.19, the build sheet v0.0.19 §8; the team's design §12), enforced at once; F1 to F26 are tests/flawless.mjs's, untouched.
//
//   F34  the #2's P-12 at the tower (~two:p12): his pistol's condition at the end of each tower macro of his (MAKE READY: holstered,
//        Condition 1 on safe; Stop: holstered on safe; SHOW CLEAR: holstered, no magazine, the chamber empty), the macro within its
//        sub-steps as he lived them + ADMIN_SLACK_MS (F18's bound: a fumble's cost is his dice, printed apart); every sheet, from the fill
//   F35  the other side: you placed past the threshold on his point at each door (as the keys walk in along his path leaves you),
//        he takes yours, past his threshold within TWO_CUE_MS of his cue, never within BODY_GAP_M of you on the way, and the
//        corner he now works covered by the leg's "Clear!"; on the honest and keys bots' lanes, swaps 0
//   F36  the team's words: no team call said by the wrong man (team.js TEAM_WORDS' `by`), each "Reloading!" of his closed by his
//        "Up.", each "Gun down!" of his closed by his "Gun up!" or his man handed to you (a failed drill), your "Clear!" before your
//        "Room clear!" in every room; the honest bot on every T sheet, the stoppage bot (Gun down) and his own stoppages (HIS_STOPS)
//   F37  the #2's tasks (tests/bots/team.mjs teamTaskBot: "#2, bang it" on the flash loadout, "Breacher up" on the breach): each
//        from his start to its end within its planned time + TASK_SLACK_MS (his dice apart, as F18's: a
//        failed roll's ×FAIL_K, the real fuse past the believed); no muzzle fault while he works; on his bang, your
//        threshold within 2 s of the burst (F27's bound); nobody of the stack over BREACH_SAFE_KPA at a burst (F28's); no device
//        live or held at the card (F29's); every lane to its card
// Each returns { id, name, met, value, target } as flawless.mjs's rows, printed by its printGauge.
import { createGame } from './game.mjs';
import { runHouse, houseHonestBot, houseKeysBot, stoppageBot } from './bots/house.mjs';
import { teamTaskBot } from './bots/team.mjs';
import { stepAct } from './bots/lib.mjs';
import { TWO_CUE_MS, ADMIN_SLACK_MS, BODY_GAP_M, T_SHEETS, SHEETS } from './flawless.mjs';
import { TEAM_WORDS } from '../src/sim/combat/team.js';
import { lanePlanOf, pastThreshold } from '../src/sim/combat/room.js';
import { cornerRuleOf } from '../src/sim/combat/corner.js';
import { setOpening } from '../src/sim/places/model.js';
import { gunField } from '../src/sim/arms/firearms.js';
import { liveDevices, handDeviceOf } from '../src/sim/arms/devices.js';
import { BREACH_SAFE_KPA } from '../src/sim/arms/blast.js';

/** The team's gauges, enforced at once (the build sheet v0.0.19 §8). */
export const TEAM_ENFORCED = Object.freeze(new Set(['F34', 'F35', 'F36', 'F37']));
/** A task's slack over its planned time (ms; as flawless.mjs ADMIN_SLACK_MS, my call). */
export const TASK_SLACK_MS = 500;
/** F37's bang to your entry (ms; F27's bound, v0.0.18's flawless-kit.mjs). */
export const BANG_TO_ENTRY_MS = 2000;

const s2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : '-');
const actor = (s, pid) => s.actors.list.find(a => a.who === pid);
const row = (id, name, met, value, target) => ({ id, name, met: !!met, value, target });
// (the grenades whose burst is a bang your entry follows)
const DEVICE_GRENADE = new Set(['g11', 'g9p', 'g13p']);

/** F34 (see the header): seeds × every sheet, from the fill, the keys below rung 2 and the honest bot from it. */
export function f34(seeds) {
  const bad = [], times = [], fumbles = [];
  let n = 0;
  for (const tier of SHEETS) for (const seed of seeds) {
    const g = createGame({ scenario: 'test-shoothouse', seed, tier, loadout: 'standard~two:p12' }), s = g.state, W = s.armoury.range.house.two, p = W.pistol;
    let cur = null;
    const c = () => { const P = s.items[p], k = s.people[W.pid].kit; return { h: k.worn?.holster === p, ch: gunField(P, 'chamber') ?? 'empty', mode: gunField(P, 'mode'), mag: !!P.mag }; };
    runHouse(g, ['recruit', 'private'].includes(tier) ? houseKeysBot() : houseHonestBot(), { maxMs: 12 * 60_000, each: () => {
      const d = W.doing;
      if (d && !d.beats && d.cmd && d.cmd !== 'down' && (!cur || cur.d !== d)) cur = { d, cmd: d.cmd, fromMs: d.fromMs, planMs: d.planMs };
      if (cur && W.doing !== cur.d) {
        // (the bound F18's: his macro's sub-steps as he lived them, a fumble's cost included (the dice are his), + ADMIN_SLACK_MS)
        const k = c(), lived = s.clock.ms - cur.fromMs, subs = (cur.d.subs ?? []).reduce((t, x) => t + (x.ms ?? 0), 0), halted = (cur.d.tries ?? 0) > 0;
        const ok = cur.cmd === 'ready' ? k.h && k.ch === 'live' && k.mode === 'safe' && k.mag : cur.cmd === 'stop' ? k.h && k.mode === 'safe' : cur.cmd === 'clear' ? k.h && !k.mag && k.ch === 'empty' && k.mode === 'safe' : true;
        if (['ready', 'stop', 'clear'].includes(cur.cmd)) { n++; times.push(lived - subs); fumbles.push(subs - cur.planMs); if (!ok || (!halted && lived > subs + ADMIN_SLACK_MS)) bad.push(`${tier} ${seed} ${cur.cmd}: ${JSON.stringify(k)} ${lived}/${subs} ms`); }
        cur = null;
      }
    } });
  }
  return row('F34', "the #2's P-12 at the tower", n > 0 && !bad.length, `${n} macros of his with the P-12 over ${SHEETS.length * seeds.length} lanes from the fill; past his sub-steps as lived by at most ${s2(Math.max(0, ...times) / 1000)} s (the fumbles' own cost apart: at most ${s2(Math.max(0, ...fumbles) / 1000)} s); not met ${bad.length}${bad.length ? `: ${bad.slice(0, 3).join('; ')}` : ''}`, `his pistol as the command wants it, within his macro + ${ADMIN_SLACK_MS / 1000} s`);
}

const LEGS = Object.freeze([['go', 'o:w4:r1'], ['room:2', 'o:w4:r2'], ['room:3', 'o:w4:r3'], ['hall', 'hall']]);
/** F35 (see the header): seeds × the keys sheets × every leg, you placed on his point; and the honest and keys lanes' swaps (recs from f36's runs). */
export function f35(seeds, lanes = []) {
  const bad = [], lags = [];
  let n = 0, least = Infinity;
  for (const tier of ['recruit', 'private']) for (const seed of seeds) for (const [setup, door] of LEGS) {
    const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup }), s = g.state, H = s.armoury.range.house, P = lanePlanOf(s).plans[door];
    const me = actor(s, s.player.id), two = actor(s, H.two.pid), put = (a, [x, z]) => { a.x = x; a.z = z; a.$px = x; a.$pz = z; const q = s.people[a.who]?.post; if (q) { q.x = x; q.z = z; } };
    if (P.door) { setOpening(s, P.door, 'open', { atMs: s.clock.ms }); H.doors[P.door] ??= s.clock.ms; }
    put(two, P.stack[1]); put(me, P.points[1]);
    g.step(1, { act: [stepAct('leave')] });
    const t0 = s.clock.ms, L = [...H.rooms, H.hall].find(x => x.door === door), corner = cornerRuleOf(P, 1)?.corner?.hot ?? null;
    let inMs = null, gap = Infinity;
    const bot = houseKeysBot();
    for (let i = 0; i < 4000 && L.state !== 'clear' && L.state !== 'passed'; i++) {
      g.step(1, inMs === null ? (s.stop ? { act: [stepAct('leave')] } : {}) : bot);
      g.clearFacts?.();
      if (inMs === null) { gap = Math.min(gap, Math.hypot(two.x - me.x, two.z - me.z)); if (pastThreshold(P, two.x, two.z)) inMs = s.clock.ms - t0; }
    }
    n++; least = Math.min(least, gap); if (inMs !== null) lags.push(inMs);
    const swapped = H.two.side?.[door] === 1, covered = !corner || !!L.covered?.[corner];
    if (!swapped || inMs === null || inMs > TWO_CUE_MS || gap < BODY_GAP_M || !covered) bad.push(`${tier} ${seed} ${door}: swapped ${swapped}, in ${inMs} ms, gap ${s2(gap)}, his corner ${covered}`);
  }
  const swaps = lanes.filter(l => l.swaps > 0);
  return row('F35', 'the other side', n > 0 && !bad.length && !swaps.length, `${n} doors placed on his point (the recruit and the private): taken ${n - bad.length}; past his threshold p50 ${s2(lags.sort((a, b) => a - b)[lags.length >> 1] / 1000)} s, max ${s2(Math.max(0, ...lags) / 1000)} s; the least gap on his way ${s2(least)} m${bad.length ? `; not met: ${bad.slice(0, 3).join('; ')}` : ''}; swaps on ${lanes.length} honest and keys lanes ${swaps.length}`, `he takes yours within ${TWO_CUE_MS / 1000} s, never within ${BODY_GAP_M} m, his corner covered; 0 swaps unasked`);
}

// (the roles a call's words may come from, by TEAM_WORDS' `by`: 0 either)
const ROLES = new Map();
for (const w of Object.values(TEAM_WORDS)) if (w.words) ROLES.set(w.words, new Set([...(ROLES.get(w.words) ?? []), ...(w.by ? [w.by] : [1, 2])]));
/** The #2's own rifle stopped at room 3's start, as house-two's stoppage case puts it (F36's runs): kind → put(his rifle, state). */
export const HIS_STOPS = Object.freeze({
  'his-stovepipe': (gun) => { gun.chamber = 'case'; },
  'his-double': (gun) => { gun.chamber = 'case'; gun.jam = 'double'; },
  'his-empty': (gun, s) => { s.items[gun.mag].n = 0; delete gun.chamber; },
});
/** F36 (see the header): seeds × every T sheet by the honest bot, the keys sheets by the keys bot, and the stoppage bot (Gun down) at the tier one. Returns [row, lanes]. */
export function f36(seeds) {
  const lanes = [], wrong = [], open = [];
  let calls = 0, rooms = 0;
  // (and his own rifle stopped at room 3 (house-two's three: a stovepipe, a double feed, an empty, whose IA turns into a speed reload),
  // the honest bot on: the review of 2026-11-16 found his "Gun down!" closed by a reload's "Up." there, which no lane above met)
  const runs = [...T_SHEETS.flatMap(tier => seeds.map(seed => [tier, seed, 'honest'])), ...['recruit', 'private'].flatMap(tier => seeds.map(seed => [tier, seed, 'keys'])), ...seeds.map(seed => ['tierone', seed, 'stoppage']), ...seeds.flatMap(seed => Object.keys(HIS_STOPS).map(k => ['tierone', seed, k]))];
  for (const [tier, seed, kind] of runs) {
    const his = HIS_STOPS[kind] ?? null, g = createGame({ scenario: 'test-shoothouse', seed, tier, ...(his ? { setup: 'room:3' } : {}) }), s = g.state, H = s.armoury.range.house, said = [];
    if (his) his(s.items[s.people[H.two.pid].kit.worn.sling], s);
    const r = runHouse(g, kind === 'keys' ? houseKeysBot() : kind === 'stoppage' ? stoppageBot({ answer: 'gundown' }) : houseHonestBot(), { maxMs: 12 * 60_000, each: (game) => { for (const f of game.facts('say')) { const who = f.who === s.player.id ? 1 : f.who === H.two.pid ? 2 : 0; if (who) said.push({ who, text: f.text, call: f.call ?? null, ms: s.clock.ms }); } } });
    lanes.push({ tier, seed, kind, done: r.done, swaps: Object.keys(H.two.side ?? {}).length });
    for (const c of said) if (ROLES.has(c.text)) { calls++; if (c.call !== 'side' && !ROLES.get(c.text).has(c.who)) wrong.push(`${tier} ${seed}: ${c.who} "${c.text}"`); }
    let reload = 0, down = 0;
    for (const c of said.filter(x => x.who === 2)) { if (c.text === 'Reloading!') reload = 1; if (c.text === 'Up.') reload = 0; if (c.text === 'Gun down!') down = 1; if (c.text === 'Gun up!') down = 0; }
    if (reload || (down && !H.two.down?.failed)) open.push(`${tier} ${seed} ${kind}: ${reload ? '"Reloading!"' : '"Gun down!"'} not closed`);
    const mine = said.filter(c => c.who === 1);
    for (const rc of mine.filter(c => c.text === 'Room clear!' || c.text === 'Hall clear!')) { rooms++; if (!mine.some(c => c.text === 'Clear!' && c.ms <= rc.ms)) open.push(`${tier} ${seed}: "Room clear!" with no "Clear!" before`); }
  }
  const notCard = lanes.filter(l => !l.done);
  return [row('F36', "the team's words", calls > 0 && !wrong.length && !open.length && !notCard.length, `${lanes.length} lanes (honest ${T_SHEETS.length}×${seeds.length}, keys 2×${seeds.length}, the stoppage bot ${seeds.length}, his own stoppage ${Object.keys(HIS_STOPS).length}×${seeds.length}): ${calls} team calls, by the wrong man ${wrong.length}${wrong.length ? ` (${wrong.slice(0, 3).join(', ')})` : ''}; not closed ${open.length}${open.length ? ` (${open.slice(0, 3).join(', ')})` : ''}; ${rooms} "Room clear!"; to the card ${lanes.length - notCard.length}/${lanes.length}`, 'by the man TEAM_WORDS names; each closed; "Clear!" first'), lanes];
}

/** F37 (see the header): seeds × the corporal, the sergeant and the tier one, "#2, bang it" (flash) and "Breacher up" (breach). */
export function f37(seeds) {
  const bad = [], over = [], b2e = [], kPas = [], diceMs = [];
  let tasks = 0, lanes = 0;
  for (const [use, loadout] of [['bang', 'flash'], ['breach', 'breach']]) for (const tier of ['cpl', 'sgt', 'tierone']) for (const seed of seeds) {
    const g = createGame({ scenario: 'test-shoothouse', seed, tier, loadout }), s = g.state, H = s.armoury.range.house, me = actor(s, s.player.id);
    let cur = null;
    const seen = new Set(), pend = {};
    const r = runHouse(g, teamTaskBot({ use }), { maxMs: 12 * 60_000, each: () => {
      const d = H.two.doing, t = H.two.task;
      if (d?.task && !cur) cur = { d, fromMs: d.fromMs, planEnd: d.untilPlanMs, door: d.door, kind: t?.kind, planned: Object.fromEntries(d.beats.map(b => [b.key, b.ms])) };
      if (cur && (!t || ['done', 'failed', 'belayed'].includes(t.st))) {
        // (the dice his, as F18 counts a fumble: a failed roll's ×FAIL_K and the real fuse past the believed one (the band's bottom), apart)
        const dice = cur.d.beats.reduce((x, b) => x + ((b.key === 'bang' || cur.d.subs.some(u => u.beat === b.key && u.ok === false)) ? Math.max(0, (b.ms ?? 0) - (cur.planned[b.key] ?? 0)) : 0), 0);
        tasks++; over.push(s.clock.ms - cur.planEnd - dice); diceMs.push(dice);
        if (t?.st !== 'done' || s.clock.ms - dice > cur.planEnd + TASK_SLACK_MS) bad.push(`${tier} ${seed} ${cur.door}: ${t?.st ?? 'gone'}, ${s.clock.ms - cur.planEnd - dice} ms over its plan (the dice ${dice} ms apart)`);
        const L = [...H.rooms, H.hall].find(x => x.door === cur.door);
        if ((L?.faults ?? []).some(f => f.kind === 'muzzle' && f.atMs >= cur.fromMs && f.atMs <= s.clock.ms)) bad.push(`${tier} ${seed} ${cur.door}: a muzzle fault while he worked`);
        cur = null;
      }
      for (const bu of H.bursts ?? []) if (!seen.has(bu.id)) {
        seen.add(bu.id); kPas.push(Math.max(bu.kPa?.[s.player.id] ?? 0, bu.kPa?.[H.two.pid] ?? 0));
        if ((bu.kPa?.[s.player.id] ?? 0) >= BREACH_SAFE_KPA || (bu.kPa?.[H.two.pid] ?? 0) >= BREACH_SAFE_KPA) bad.push(`${tier} ${seed}: a burst at ${bu.kPa?.[s.player.id]}/${bu.kPa?.[H.two.pid]} kPa on the stack`);
        // (a grenade's: your threshold of its room's door awaited, the bang to your entry)
        const door = [...H.rooms, H.hall].find(x => x.room === bu.room)?.door;
        if (DEVICE_GRENADE.has(bu.model) && door) pend[door] ??= bu.atMs;
      }
      for (const [door, atMs] of Object.entries(pend)) if (pastThreshold(lanePlanOf(s).plans[door], me.x, me.z)) { b2e.push(s.clock.ms - atMs); delete pend[door]; }
    } });
    lanes++;
    if (!r.done) bad.push(`${tier} ${seed} ${use}: not to the card`);
    if (liveDevices(s).length || handDeviceOf(s, s.player.id) || handDeviceOf(s, H.two.pid)) bad.push(`${tier} ${seed} ${use}: a device live or held at the card`);
  }
  const lateB = b2e.filter(ms => ms > BANG_TO_ENTRY_MS);
  return row('F37', "the #2's tasks", tasks > 0 && !bad.length && !lateB.length, `${tasks} tasks over ${lanes} lanes (bang and breach × the corporal, the sergeant, the tier one × ${seeds.length} seeds): over their plan at most ${s2(Math.max(0, ...over) / 1000)} s (the dice apart: at most ${s2(Math.max(0, ...diceMs) / 1000)} s); bang to your threshold p50 ${s2([...b2e].sort((a, b) => a - b)[b2e.length >> 1] / 1000)} s, max ${s2(Math.max(0, ...b2e) / 1000)} s (${lateB.length} over ${BANG_TO_ENTRY_MS / 1000} s); the stack's worst at a burst ${s2(Math.max(0, ...kPas))} kPa${bad.length ? `; not met: ${bad.slice(0, 3).join('; ')}` : ''}`, `within the plan + ${TASK_SLACK_MS / 1000} s; no muzzle fault; on the bang ≤ ${BANG_TO_ENTRY_MS / 1000} s; < ${BREACH_SAFE_KPA} kPa; nothing live at the card`);
}

/** The team's criteria enforced and not met. */
export const teamFailing = (rows) => rows.filter(r => TEAM_ENFORCED.has(r.id) && !r.met).map(r => `${r.id} ${r.name}: ${r.value}`);
