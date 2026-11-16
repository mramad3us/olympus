// OLYMPUS tests: the bodies and the line's gauges, F45 to F49 (v0.0.20, the build sheet v0.0.20 §8; A's items 1, 3, 8, 9 and 19); F1 to F44 are tests/flawless.mjs's, flawless-kit.mjs's, flawless-team.mjs's and flawless-live.mjs's, untouched.
//
//   F45  no walk of yours held by a body over PIN_END_MS 2 s (the beat's whole hold, places/move.js); Backspace (drill:stop) on a held
//        walk ends it by the next tick. Every bot, enforced (the fuzz's longest was 269.85 s before v0.0.19's give-way)
//   F46  your #2 held by you: his walk held by your body while you stand outside a doorway is held no more than TWO_PIN_MS and a tick
//        (routed round you, or ended where he stands); held on his cue, or by you standing in a doorway, where no way is, "Coming in!"
//        TWO_BLOCK_SAY_MS after his hold's start and again every TWO_BLOCK_REPEAT_MS, and the DI's cqb-two-out firing from
//        TWO_OUT_LINE_MS while you are inside or in that doorway. Every bot,
//        enforced (the fuzz's hold times printed)
//   F47  no round of either of you whose line (carry.js lineMasked, from the muzzle's tip to the man's aim point) passes within
//        MASK_R_M of the other's body. Every bot, enforced
//   F48  below rung 3, on his heels, your #2 past his threshold within TWO_HEELS_MS 2 s of you, every room (drill.md D2's F41): the
//        keys bot on the boot recruit and the private and the honest bot on the corporal, enforced; the fuzz's printed
//   F49  in the hall your #2 never more than HALL_LEAD_M ahead of you along its axis (the honest bot, every T sheet), and your lead
//        over HALL_PAIR_M bringing the DI's cqb-pair within 0.5 s (the keys bot: the rule's own firing; the line shows at the
//        instinct's next settle). Enforced
// Each returns { id, name, met, value, target } as flawless.mjs's rows, printed by its printGauge.
import { flawlessLane, botOf, flawlessSeeds, SHEETS, T_SHEETS } from './flawless.mjs';
import { PIN_END_MS } from '../src/sim/places/move.js';
import { moveNow } from '../src/sim/combat/stepper.js';
import { TWO_PIN_MS, TWO_BLOCK_SAY_MS, TWO_BLOCK_REPEAT_MS, TWO_OUT_LINE_MS, HALL_LEAD_M, HALL_PAIR_M, BODY_GAP_M, hallLead } from '../src/sim/combat/bundle.js';
import { lineMasked, lineFromOf, MASK_R_M } from '../src/sim/arms/carry.js';
import { lanePlanOf, pastThreshold } from '../src/sim/combat/room.js';
import { liveZoneAt } from '../src/sim/places/zones.js';
import { RUNG_OF_TIER } from '../src/sim/skills/templates.js';
import * as CQB from '../src/sim/skills/instinct/cqb.js';

/** The bodies' gauges, enforced (the build sheet v0.0.20 §8). */
export const BODIES_ENFORCED = Object.freeze(new Set(['F45', 'F46', 'F47', 'F48', 'F49']));
/** F48's bound: you past your threshold to your #2 past his, every room on his heels (ms; drill.md D2's F41). */
export const TWO_HEELS_MS = 2000;
/** F49's: the DI's cqb-pair within this of your lead passing HALL_PAIR_M (ms). */
export const PAIR_LINE_MS = 500;

const s2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : '-');
const row = (id, name, met, value, target) => ({ id, name, met: !!met, value, target });
const ruleOf = (id) => Object.values(CQB).find(v => Array.isArray(v) && v.some(r => r?.id === 'cqb-walk'))?.find(r => r.id === id) ?? null;

/**
 * One lane watched for F45 to F49 (flawlessLane's, its `more` hook, the bot wrapped to see its presses): { tier, seed, bot, done,
 * held (the longest walk of yours held, ms), stops (Backspace on a held walk, and how many of those left it held a tick on), gapRuns
 * (his walk held by you standing outside a doorway past TWO_PIN_MS + a tick with no way round tried), blocks ({ calls, bad }),
 * twoOut (holds past TWO_OUT_LINE_MS with you inside and cqb-two-out silent), masked (rounds through the other), heels (ms a room),
 * hall (his greatest lead along the hall's axis), pair ({ over, late }) }.
 */
export function bodiesLane({ tier, seed, bot = 'honest', setup = 'go', loadout = null }) {
  const R = { tier, seed, bot, done: false, held: 0, stops: { n: 0, bad: 0 }, gapRuns: 0, gapMaxMs: 0, rounds: 0, blocks: { n: 0, calls: 0, bad: [] }, twoOut: 0, shots: 0, masked: [], heels: [], hall: -Infinity, pair: { over: 0, late: 0 }, mirror: 0, pins: [] };
  const last = { input: null };
  const wrap = ({ seed: sd, answer }) => { const b = botOf(bot, { seed: sd, answer }); return (state, me, mem) => { const i = b(state, me, mem); last.input = i; return i; }; };
  const twoOut = ruleOf('cqb-two-out'), pairRule = ruleOf('cqb-pair');
  let lane = null, stopOn = null, blk = null, pairFrom = null;
  const inSeen = new Set();
  const rec = flawlessLane({ tier, seed, bot: wrap, setup, ...(loadout ? { loadout } : {}), more: (game, ctx) => {
    const s = game.state, H = s.armoury.range.house, now = s.clock.ms, pid = s.player.id;
    lane ??= lanePlanOf(s);
    const me = s.actors.list.find(a => a.who === pid), two = s.actors.list.find(a => a.who === H.twoPid), area = s.places?.live?.area;
    // ---- F45 ----
    const mv = moveNow(s, pid);
    if (mv?.held) R.held = Math.max(R.held, mv.held);
    if (stopOn) { R.stops.n++; if (mv && mv === stopOn && mv.heldAtMs === now) R.stops.bad++; stopOn = null; }
    if (mv?.held && mv.heldAtMs === now && (last.input?.act ?? []).includes('drill:stop')) stopOn = mv;
    // ---- F46 ----
    const W = H.two, G = W?.gap;
    // (as the build sheet words it (§8): "outside a funnel, at most TWO_PIN_MS + his routed walk": every tick of a hold past TWO_PIN_MS and
    // a tick with you standing outside a doorway, a way round tried or not (the review of 2026-11-16: a route tried once passed the
    // gauge, and he stood 43.5 s behind you); in a doorway, the calls and the DI's line (blocks, twoOut below))
    const inDoor = !!me && !!area && !!liveZoneAt(s, area, me.x, me.z);
    if (G?.runMs > TWO_PIN_MS + 50 && me && !inDoor && Math.hypot(me.v?.[0] ?? 0, me.v?.[1] ?? 0) < 0.05 && !moveNow(s, pid)) R.gapRuns++;
    if (G?.runMs) R.gapMaxMs = Math.max(R.gapMaxMs, G.runMs);
    R.rounds = W?.rounds?.n ?? 0;
    const B = W?.block;
    if (B && (!blk || blk.fromMs !== B.fromMs)) { blk = { fromMs: B.fromMs, calls: [] }; R.blocks.n++; }
    if (!B) blk = null;
    for (const f of game.facts('say')) if (blk && f.who === H.twoPid && f.call === 'coming') { blk.calls.push(now - blk.fromMs); R.blocks.calls++; const k = blk.calls.length, want = TWO_BLOCK_SAY_MS + (k - 1) * TWO_BLOCK_REPEAT_MS; if (Math.abs(blk.calls[k - 1] - want) > 50) R.blocks.bad.push(`${blk.calls[k - 1]} ms, call ${k}`); }
    if (B && twoOut && now - B.fromMs >= TWO_OUT_LINE_MS + 50 && ctx.onLane) {
      const L = [...H.rooms, H.hall][H.cur], P = L ? lane.plans[L.door] : null;
      if (P && me && (pastThreshold(P, me.x, me.z) || B.gap) && !twoOut.when(s, me, now)) R.twoOut++;
    }
    // (his walk held by you standing in a doorway past TWO_BLOCK_SAY_MS and a tick with no "Coming in!" record at all (blocks counts
    // the cadence of those there are))
    if (G?.runMs > TWO_BLOCK_SAY_MS + 50 && inDoor && Math.hypot(me.v?.[0] ?? 0, me.v?.[1] ?? 0) < 0.05 && !moveNow(s, pid) && !B && !W?.doing?.task) R.silent = (R.silent ?? 0) + 1;
    // ---- F47 ----
    for (const f of game.facts('shot')) {
      if (!f.fired || !f.target || (f.who !== pid && f.who !== H.twoPid)) continue;
      const T = s.armoury.range.turners.find(t => t.key === f.target), shooter = f.who === pid ? me : two, other = f.who === pid ? two : me;
      if (!T || !shooter || !other) continue;
      R.shots++;
      const to = { x: T.x, y: T.y ?? 1.35, z: T.z };
      if (lineMasked(lineFromOf(s, f.who, shooter, to), to, [{ x: other.x, z: other.z, stance: other.stance ?? 'stand' }])) R.masked.push(`${f.who === pid ? 'you' : 'he'} on ${T.stand} at ${now - (H.goAtMs ?? 0)} ms`);
    }
    // ---- F48 ----
    for (const L of H.rooms) {
      const P = lane.plans[L.door];
      if (!two || !P || inSeen.has(L.door) || !Number.isFinite(L.enteredAtMs) || L.setup) continue;
      if (pastThreshold(P, two.x, two.z)) { inSeen.add(L.door); R.heels.push({ door: L.door, ms: now - L.enteredAtMs, heels: W?.heels?.door === L.door }); }
    }
    // ---- F49 ----
    const lead = hallLead(s);
    if (lead !== null && me && two && pastThreshold(lane.plans.hall, two.x, two.z)) R.hall = Math.max(R.hall, -lead);
    if (lead !== null && lead > HALL_PAIR_M) { pairFrom ??= now; if (now - pairFrom >= PAIR_LINE_MS && pairRule && !pairRule.when(s, me, now) && !R.pair.$late) { R.pair.late++; R.pair.$late = true; } }
    else { if (pairFrom !== null) R.pair.over++; pairFrom = null; R.pair.$late = false; }
    R.mirror = H.mirror?.n ?? 0;
  } });
  R.done = rec.done;
  delete R.pair.$late;
  return R;
}

/** The five rows over lanes (bodiesLane's): honest and keys lanes enforce F48 and F49; every lane F45 to F47. */
export function bodiesGauge(lanes) {
  const hk = lanes.filter(l => l.bot !== 'fuzz'), fz = lanes.filter(l => l.bot === 'fuzz');
  const heldMax = Math.max(0, ...lanes.map(l => l.held)), overHeld = lanes.filter(l => l.held > PIN_END_MS), stopsBad = lanes.reduce((a, l) => a + l.stops.bad, 0), stopsN = lanes.reduce((a, l) => a + l.stops.n, 0);
  const silent = lanes.reduce((a, l) => a + (l.silent ?? 0), 0), gapRuns = lanes.reduce((a, l) => a + l.gapRuns, 0), blocks = lanes.reduce((a, l) => a + l.blocks.n, 0), calls = lanes.reduce((a, l) => a + l.blocks.calls, 0), badCalls = lanes.flatMap(l => l.blocks.bad.map(b => `${l.tier} ${l.seed} ${l.bot}: ${b}`)), twoOut = lanes.reduce((a, l) => a + l.twoOut, 0);
  const shots = lanes.reduce((a, l) => a + l.shots, 0), masked = lanes.flatMap(l => l.masked.map(m => `${l.tier} ${l.seed} ${l.bot}: ${m}`));
  const below3 = hk.filter(l => (RUNG_OF_TIER[l.tier] ?? 0) < 3), heels = below3.flatMap(l => l.heels.filter(h => h.heels)), late = heels.filter(h => h.ms > TWO_HEELS_MS), fzHeels = fz.flatMap(l => l.heels.filter(h => h.heels).map(h => h.ms));
  const honestT = hk.filter(l => l.bot === 'honest' && T_SHEETS.includes(l.tier)), hallMax = Math.max(-Infinity, ...honestT.map(l => l.hall)), keys = hk.filter(l => l.bot === 'keys');
  const pairOver = keys.reduce((a, l) => a + l.pair.over, 0), pairLate = keys.reduce((a, l) => a + l.pair.late, 0);
  const notCard = lanes.filter(l => !l.done);
  return [
    row('F45', 'no walk held by a body over 2 s', !overHeld.length && !stopsBad, `${lanes.length} lanes (honest ${hk.filter(l => l.bot === 'honest').length}, keys ${keys.length}, fuzz ${fz.length}): the longest walk held ${s2(heldMax / 1000)} s (honest and keys ${s2(Math.max(0, ...hk.map(l => l.held)) / 1000)} s); over ${PIN_END_MS / 1000} s ${overHeld.length}; Backspace on a held walk ${stopsN}, still held a tick on ${stopsBad}; to the card ${lanes.length - notCard.length}/${lanes.length}`, `none over ${PIN_END_MS / 1000} s; Backspace ends it by the next tick`),
    row('F46', 'your #2 held by you: round, then the calls and the DI', !gapRuns && !badCalls.length && !twoOut && !silent, `his walk held by you standing outside a doorway past ${TWO_PIN_MS / 1000} s: ${gapRuns} ticks; in a doorway with no call ${silent} ticks (his longest hold ${s2(Math.max(0, ...lanes.map(l => l.gapMaxMs)) / 1000)} s; the fuzz's ${s2(Math.max(0, ...fz.map(l => l.gapMaxMs)) / 1000)} s; routed round ${lanes.reduce((a, l) => a + l.rounds, 0)} times); held on his cue ${blocks} times, "Coming in!" ${calls}, off its cadence ${badCalls.length}${badCalls.length ? ` (${badCalls.slice(0, 3).join('; ')})` : ''}; cqb-two-out silent past ${TWO_OUT_LINE_MS / 1000} s with you inside ${twoOut} ticks`, `routed by ${TWO_PIN_MS / 1000} s; "Coming in!" at ${TWO_BLOCK_SAY_MS / 1000} s then every ${TWO_BLOCK_REPEAT_MS / 1000} s; cqb-two-out from ${TWO_OUT_LINE_MS / 1000} s`),
    row('F47', 'no round through a teammate', shots > 0 && !masked.length, `${shots} rounds of yours and his; within ${MASK_R_M} m of the other's body ${masked.length}${masked.length ? ` (${masked.slice(0, 3).join('; ')})` : ''}; the crossing rule's mirror held a move ${lanes.reduce((a, l) => a + l.mirror, 0)} times (honest and keys ${hk.reduce((a, l) => a + l.mirror, 0)})`, '0'),
    row('F48', 'your #2 on your heels', heels.length > 0 && !late.length, `below rung 3 (honest and keys, ${below3.length} lanes): ${heels.length} rooms on his heels, you in to him in p50 ${s2([...heels].sort((a, b) => a.ms - b.ms)[heels.length >> 1]?.ms / 1000)} s, max ${s2(Math.max(0, ...heels.map(h => h.ms)) / 1000)} s, over ${TWO_HEELS_MS / 1000} s ${late.length}; the fuzz's max ${s2(Math.max(0, ...fzHeels) / 1000)} s (printed)`, `within ${TWO_HEELS_MS / 1000} s, every room`),
    row('F49', 'the pair in the hall', hallMax <= HALL_LEAD_M + 1e-6 && !pairLate, `the honest bot on ${honestT.length} T lanes: his greatest lead along the hall ${s2(hallMax)} m; the keys bot: your lead over ${HALL_PAIR_M} m ${pairOver} times, cqb-pair not firing by ${PAIR_LINE_MS / 1000} s ${pairLate}`, `at most ${HALL_LEAD_M} m ahead; cqb-pair within ${PAIR_LINE_MS / 1000} s`),
  ];
}

/** The lanes the heavy gauge file runs (seeds × the honest bot on every T sheet and the corporal, the keys bot on the recruit and the private, the fuzz on every sheet). */
export function bodiesLanes(nSeeds = 3, fuzzSeeds = 3) {
  const seeds = flawlessSeeds(nSeeds), out = [];
  for (const seed of seeds) {
    for (const tier of T_SHEETS) out.push(bodiesLane({ tier, seed, bot: 'honest' }));
    for (const tier of ['recruit', 'private']) out.push(bodiesLane({ tier, seed, bot: 'keys' }));
  }
  for (const seed of flawlessSeeds(fuzzSeeds)) for (const tier of SHEETS) out.push(bodiesLane({ tier, seed, bot: 'fuzz' }));
  return out;
}

/** The bodies' criteria enforced and not met. */
export const bodiesFailing = (rows) => rows.filter(r => BODIES_ENFORCED.has(r.id) && !r.met).map(r => `${r.id} ${r.name}: ${r.value}`);
export { BODY_GAP_M };
