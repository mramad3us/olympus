// OLYMPUS tests: the shoot house's gauges on the kit's lanes (COMBAT §25.19.8, §25.20; the build sheet 0.0.18 §5.3): F1 to F26 as tests/flawless.mjs measures them, F15 against KIT_LANE_MAX_S, and F27 to F29 of the kit's own.
//
// A kit lane is tests/flawless.mjs flawlessLane with a loadout ('flash' or 'breach') and the kit bot (tests/bots/kit.mjs: the
// honest bot, or the keys bot below rung 2, with the kit's row once a door), its record read as the bot it wraps ('honest' or
// 'keys'), so gaugeOf holds it to the criteria it holds the honest lanes to, with two of them read the kit's own way, both
// declared here and on the gauge's rows. F15 is read against KIT_LANE_MAX_S 120 in place of LANE_MAX_S 60: three charges add
// their place, the walk back, the prime and the count (about 30 to 40 s a lane), so the lane's own band is the kit's (the build
// sheet's §4; LANE_MAX_S untouched). F6 on a charge's leg is re-read (below): the build sheet names F15 alone, so this second
// re-reading is the lead's to keep, or to move into flawless.mjs's own exception (FEET_ROWS) so that one gauge reads every lane
// (the review of 2026-11-16: read as gaugeOf reads it, F6 fails at the safe point on 18 of the 54 rung-3 rooms). The kit's own:
//   F27  BANG TO ENTRY: from each flash's burst to #1 past that room's threshold, at most BANG_LATE_MS 2 s from the corporal up
//        (COMBAT §25.18.2's window; the keys' walk below rung 2 printed)
//   F28  nobody in the house over BREACH_SAFE_KPA 27.6 at a charge's fire: the stack (the safe points, breach.js safePointsOf),
//        the instructor on the catwalk and the range staff (from the fixer of v0.0.18; the stack alone before)
//   F29  no device live or held at the lane's end: nothing burning, nothing primed, no hand holding one (devices.js), no charge
//        left on a door for the instructor to make safe ("CHARGE LEFT ON THE DOOR", shoothouse.js chargesLeft)
// v0.0.19 (D2, the build sheet 0.0.19 §8): the uses 'frag', 'conc', 'cut', 'shoot' and 'mixed' on their loadouts (shoot on
// 'breach'), the kit bot made by a factory (tests/flawless.mjs botOf takes one), and four criteria more; F27 and F29 widened:
//   F27  every grenade kind: a frag's or a concussion's burst to #1 past that room's threshold read as a flash's is
//   F29  a charge left placed included (a BC-1 as an SC-1)
//   F30  no man of the stack in any burst's read: no ball, λ under practice.js FRAG_SAFE_LAMBDA 0.05, under BREACH_SAFE_KPA 27.6
//   F31  no 'fragged' or 'concussed' fault on the honest kit bot (it frags and concusses only where the brief said hostiles only)
//   F32  a ballistic breach strikes no stand past the leaf at a pass, and every point opens or hands back within
//        BALLISTIC_MAX_ROUNDS 4 rounds
//   F33  from the Sergeant up, a G-9P or G-13P bursts within FRAG_SIT_MS 2,500 ms of landing (cooked)
// F6 on a charge's leg is watched from #1 back on his stack after the blast (the drill waits at the safe point through the count;
// kitLane, the same speeds and distances as flawless.mjs's watch). The kit's fuzz (kitFuzzBot) is printed: its lanes done, their dead ends and the kit rows it pressed.
import { flawlessLane, gaugeOf, ENFORCED, SHEETS, flawlessSeeds, mean, quantile, s1, s2, top, tally, STACK_LEAVE_M, STILL_MS, POINT_AT_M } from './flawless.mjs';
import { lanePlanOf } from '../src/sim/combat/room.js';
import { playerActor } from '../src/core/ids.js';
import { houseNow, drawStands } from '../src/sim/scenarios/shoothouse.js';
import { BANG_LATE_MS } from '../src/sim/combat/burst.js';
import { BREACH_SAFE_KPA } from '../src/sim/arms/blast.js';
import { DEVICES, liveDevices, handDeviceOf } from '../src/sim/arms/devices.js';
import { RUNG_OF_TIER } from '../src/sim/skills/templates.js';
import { createGame } from './game.mjs';
import { runHouse } from './bots/house.mjs';
import { kitFuzzBot, houseKitBot } from './bots/kit.mjs';
import { stackClean, FRAG_SIT_MS, FRAG_SAFE_LAMBDA } from '../src/sim/combat/practice.js';
import { BALLISTIC_MAX_ROUNDS } from '../src/sim/combat/ballistic.js';

/** The kit's lane time ceiling (s; F15 for kit lanes only, the build sheet's §4). */
export const KIT_LANE_MAX_S = 120;
/** The kit's criteria, enforced from v0.0.18. */
export const KIT_ENFORCED = Object.freeze(new Set(['F27', 'F28', 'F29', 'F30', 'F31', 'F32', 'F33']));
/** The first n seeds of flawlessSeeds' order whose room 1 is hostiles only (both its stands threats by the stands' own draw), where the brief allows a frag (v0.0.19). */
export function fragSeeds(n = 2) {
  const out = [];
  for (const seed of flawlessSeeds(200)) { const d = drawStands(seed); if (['1a', '1b'].every(k => d[k].face !== 'noshoot' && d[k].face !== 'hostage')) out.push(seed); if (out.length >= n) break; }
  return out;
}
/** D2's uses (v0.0.19) and the loadout each plays on. */
export const KIT2_USES = Object.freeze(['frag', 'conc', 'cut', 'mixed', 'shoot']);
export const LOADOUT_OF_USE = Object.freeze({ frag: 'frag', conc: 'conc', cut: 'cut', mixed: 'mixed', shoot: 'breach', flash: 'flash', breach: 'breach' });

/** One kit lane (see the header): flawlessLane's record read as its base bot, with the kit's own numbers (bangMs, kPa, left). */
export function kitLane({ tier, seed, use }) {
  const keys = (RUNG_OF_TIER[tier] ?? 0) < 2, end = { s: null }, feet = {}, prevAt = { xz: null, ms: null };
  // (F6 on a charge's leg (see the header): the stack waits at the safe point through the count by the drill (FM 3-06.11), so the
  // feet are watched from #1 back on his stack after the blast to his point, as tests/flawless.mjs watches every other leg from
  // his stack: v under STILL_MS 0.3 m/s past STACK_LEAVE_M of it counted)
  const more = (game) => {
    const st = game.state, H = st.armoury.range.house, me = playerActor(st), now = st.clock.ms;
    end.s = st;
    const v = prevAt.xz && now > prevAt.ms ? Math.hypot(me.x - prevAt.xz[0], me.z - prevAt.xz[1]) / ((now - prevAt.ms) / 1000) : null;
    prevAt.xz = [me.x, me.z]; prevAt.ms = now;
    const L = [...H.rooms, H.hall][H.cur], P = L ? lanePlanOf(st).plans[L.door] : null;
    if (!P?.door || !(H.bursts ?? []).some(b => b.door === P.door) || v === null) return;
    const f = (feet[H.cur] ??= { st: 'safe', minV: Infinity, underMs: 0 }), dS = Math.hypot(me.x - P.stack[0][0], me.z - P.stack[0][1]);
    if (f.st === 'safe' && dS <= STACK_LEAVE_M) f.st = 'stack';
    else if (f.st === 'stack' && dS > STACK_LEAVE_M) f.st = 'flow';
    if (f.st === 'flow') {
      if (Math.hypot(me.x - P.points[0][0], me.z - P.points[0][1]) <= POINT_AT_M) f.st = 'done';
      else { f.minV = Math.min(f.minV, v); if (v < STILL_MS) f.underMs += now - (f.atMs ?? now); }
    }
    f.atMs = now;
  };
  // (v0.0.19: D2's uses by a factory of the kit bot, on their own loadouts)
  const d2 = KIT2_USES.includes(use), base = keys ? 'keys' : 'honest';
  const rec = flawlessLane({ tier, seed, bot: d2 ? () => houseKitBot({ use, base }) : `kit:${use}${keys ? ':keys' : ''}`, loadout: LOADOUT_OF_USE[use] ?? use, more });
  for (const [k, f] of Object.entries(feet)) { rec.feet.legs[k] = { st: f.st, minV: Number.isFinite(f.minV) ? Math.round(f.minV * 1000) / 1000 : null, underMs: f.underMs }; (rec.feetCharge ??= []).push(Number(k)); }
  const s = end.s, H = s?.armoury?.range?.house;
  rec.kitBot = rec.bot; rec.bot = keys ? 'keys' : 'honest'; rec.kit = use;
  rec.bangMs = H ? [...H.rooms, H.hall].map(L => L.bangMs ?? null) : [];
  // (everyone in the house besides the stack too: the instructor and the range staff, never a stand (the play review of v0.0.18: the
  // SSgt on the catwalk read 103.5 kPa from room 1's charge, the gauge reading only the stack))
  rec.blast = (H?.bursts ?? []).filter(b => b.door).map(b => ({ door: b.door, me: b.kPa?.[s.player.id] ?? 0, two: b.kPa?.[H.twoPid] ?? 0,
    rest: Math.max(0, ...Object.entries(b.kPa ?? {}).filter(([k]) => k !== s.player.id && k !== H.twoPid && !k.startsWith('turner:')).map(([, v]) => v)) }));
  rec.left = s ? [...liveDevices(s).map(d => `${d.model} ${d.st}`), ...[s.player.id, H?.twoPid].filter(Boolean).map(p => handDeviceOf(s, p)).filter(Boolean).map(d => `${d.model} in the hand`),
    ...[...H.rooms, H.hall].flatMap(L => L.faults.filter(f => f.kind === 'charge').map(() => `a charge left on ${L.door}`))] : ['no state'];
  rec.bursts = (H?.bursts ?? []).map(b => b.model);
  // (v0.0.19: each grenade's entry after its burst, the reads' stack, the faults D2 judges, the breach rounds, the floor's time)
  const legs = H ? [...H.rooms, H.hall] : [];
  rec.grenEntry = legs.map(L => { const B = (H.bursts ?? []).filter(b => b.thrown === L.door && !b.atFeet && DEVICES[b.model]?.kind === 'grenade' && b.atMs <= (L.enteredAtMs ?? Infinity)).at(-1); return B && Number.isFinite(L.enteredAtMs) ? { ms: L.enteredAtMs - B.atMs, model: B.model } : null; });
  rec.reads = (H?.bursts ?? []).filter(b => b.read).map(b => ({ model: b.model, room: b.read.room, me: b.read.stack?.me ?? null, two: b.read.stack?.two ?? null, satMs: b.read.satMs ?? null, fragged: b.read.fragged, concussed: b.read.concussed.length }));
  rec.d2faults = legs.flatMap(L => L.faults.filter(f => ['fragged', 'concussed', 'burst', 'exposed', 'through'].includes(f.kind)).map(f => f.kind));
  rec.breach = Object.entries(H?.breach ?? {}).filter(([, b]) => b.how === 'lock' || b.how === 'hinge').map(([door, b]) => ({ door, rounds: b.rounds, most: b.most ?? 0, tries: { ...(b.tries ?? {}) }, open: Object.values(b.points).every(x => x === 1) }));
  rec.breachStruck = (s?.armoury?.range?.turners ?? []).flatMap(T => (T.hits ?? []).filter(h => h.via === 'door').map(h => ({ stand: T.stand, shotId: h.shotId })));
  rec.breachPass = (s ? g2shots(s) : []);
  return rec;
}

// (a breach round's grade and its strike by its shot id, from the log the session kept (R.shots' rows) and the stands' hits)
function g2shots(s) {
  const hits = new Map((s.armoury.range.turners ?? []).flatMap(T => (T.hits ?? []).filter(h => h.via === 'door').map(h => [h.shotId, T.stand])));
  return (s.armoury.range.shots ?? []).filter(x => x.row === 'shoot:door').map(x => ({ id: x.id, struck: hits.get(x.id) ?? null, grade: x.grade ?? null }));
}

/** The kit's lanes: every sheet, `seeds`, both loadouts. */
export function kitLanes({ sheets = SHEETS, seeds = flawlessSeeds(3), uses = ['flash', 'breach'], print = true } = {}) {
  const recs = [];
  for (const use of uses) for (const tier of sheets) {
    const mine = seeds.map(seed => kitLane({ tier, seed, use }));
    recs.push(...mine);
    if (print) {
      const xs = mine.map(r => r.laneS).filter(Number.isFinite);
      console.log(`      ${use} ${tier.padEnd(8)} ${mine.length} lanes (${mine[0].kitBot}): mean ${s1(mean(xs))} s, max ${s1(xs.length ? Math.max(...xs) : null)}; ends ${top(tally(mine.map(r => r.err ? 'throw' : r.end ?? 'none')))}; bursts ${top(tally(mine.flatMap(r => r.bursts)))}; dead ends ${s2(mean(mine.map(r => Object.values(r.mem?.dead ?? {}).reduce((a, b) => a + b, 0))))} a lane`);
    }
  }
  return recs;
}

/** The kit's gauge: gaugeOf's rows with F15 read against KIT_LANE_MAX_S, then F27 to F29. */
export function kitGaugeOf(recs0) {
  // (v0.0.19: the shoot lanes are F32's (and the fuzz's): the closet opened by a shot is a room more to clear, its stops the
  // drill's, never read against F1 to F29 (kit2 §6 test 38: the frag, conc, cut and mixed loadouts); declared on the rows)
  const shootRecs = recs0.filter(r => r.kit === 'shoot'), recs = recs0.filter(r => r.kit !== 'shoot');
  const charged = recs.reduce((n, r) => n + (r.feetCharge?.length ?? 0), 0);
  const rows = gaugeOf(recs).map(r => {
    if (r.id === 'F6') return { ...r, value: `${r.value}; of them ${charged} a charge's, re-read from #1 back on his stack after the blast (declared: not the build sheet's)` };
    if (r.id !== 'F15') return r;
    const xs = recs.filter(x => x.bot === 'honest' && x.rung >= 2).map(x => x.laneS).filter(Number.isFinite), max = xs.length ? Math.max(...xs) : null;
    return { ...r, name: 'lane time (the kit\'s lanes, honest)', met: xs.length > 0 && max <= KIT_LANE_MAX_S, value: `mean ${s1(mean(xs))} s, p95 ${s1(quantile(xs, 0.95))}, max ${s1(max)}`, target: `max ${KIT_LANE_MAX_S} s (KIT_LANE_MAX_S; LANE_MAX_S untouched)` };
  });
  // (v0.0.19: every grenade kind, F27 widened: a flash's by its leg's bangMs as built, a frag's or a concussion's by its entry after the burst)
  const flashR = recs.filter(r => r.kit === 'flash' || r.kit === 'mixed'), d2R = recs.filter(r => ['frag', 'conc', 'mixed'].includes(r.kit));
  const d2ms = (r) => (r.grenEntry ?? []).filter(e => e && !DEVICES[e.model]?.flash).map(e => e.ms);
  const up = [...flashR.filter(r => r.rung >= 2).flatMap(r => r.bangMs.filter(Number.isFinite).map(ms => ({ ms, r }))), ...d2R.filter(r => r.rung >= 2).flatMap(r => d2ms(r).map(ms => ({ ms, r })))];
  const low = [...flashR.filter(r => r.rung < 2).flatMap(r => r.bangMs.filter(Number.isFinite)), ...d2R.filter(r => r.rung < 2).flatMap(d2ms)];
  const worst = up.reduce((a, x) => (!a || x.ms > a.ms ? x : a), null);
  rows.push({ id: 'F27', name: 'BANG TO ENTRY from the corporal up (every grenade kind)', met: up.length > 0 && up.every(x => x.ms <= BANG_LATE_MS), value: `${up.length} entries on a bang: mean ${s2(mean(up.map(x => x.ms)) / 1000)} s, worst ${s2((worst?.ms ?? 0) / 1000)} s (${worst?.r.tier} ${worst?.r.seed}); below rung 2 by the keys ${low.length}: mean ${s2(mean(low) / 1000)} s, worst ${s2(Math.max(0, ...low) / 1000)} s`, target: `${BANG_LATE_MS / 1000} s or less` });
  const blasts = recs.flatMap(r => r.blast.map(b => ({ ...b, r }))), over = blasts.filter(b => b.me > BREACH_SAFE_KPA || b.two > BREACH_SAFE_KPA || (b.rest ?? 0) > BREACH_SAFE_KPA);
  rows.push({ id: 'F28', name: 'nobody in the house in the blast', met: blasts.length > 0 && !over.length, value: `${blasts.length} charges fired: you at most ${s1(Math.max(0, ...blasts.map(b => b.me)))} kPa, your #2 ${s1(Math.max(0, ...blasts.map(b => b.two)))} kPa, anyone else ${s1(Math.max(0, ...blasts.map(b => b.rest ?? 0)))} kPa; over ${over.length}${over.length ? ` (${over.slice(0, 3).map(b => `${b.r.tier} ${b.r.seed} ${b.door}`).join(', ')})` : ''}`, target: `${BREACH_SAFE_KPA} kPa or less` });
  const left = recs.filter(r => r.left.length);
  rows.push({ id: 'F29', name: 'no device live or held at the lane\'s end (a charge left placed included)', met: !left.length, value: `${left.length} of ${recs.length} lanes${left.length ? `: ${left.slice(0, 3).map(r => `${r.tier} ${r.seed} ${r.left.join(', ')}`).join('; ')}` : ''}`, target: 'none' });
  return [...rows, ...kit2Rows(recs, shootRecs)];
}
/** D2's criteria (v0.0.19; see the header): F30 to F33's rows over the kit's lanes (each met vacuously where its kit was not played). */
export function kit2Rows(recs, shootRecs = []) {
  const rows = [], reads = recs.flatMap(r => (r.reads ?? []).map(x => ({ ...x, r })));
  const dirty = reads.filter(x => !stackClean(x.me) || !stackClean(x.two));
  const worst = (k) => Math.max(0, ...reads.map(x => x[k]?.kPa ?? 0));
  rows.push({ id: 'F30', name: 'no man of the stack in any burst\'s read', met: !dirty.length, value: `${reads.length} reads: balls on the stack ${reads.reduce((n, x) => n + (x.me?.n ?? 0) + (x.two?.n ?? 0), 0)}, λ at most ${s2(Math.max(0, ...reads.flatMap(x => [x.me?.lam ?? 0, x.two?.lam ?? 0])))}, you at most ${s1(worst('me'))} kPa, your #2 ${s1(worst('two'))} kPa; dirty ${dirty.length}${dirty.length ? ` (${dirty.slice(0, 3).map(x => `${x.r.kit} ${x.r.tier} ${x.r.seed} ${x.room}`).join(', ')})` : ''}`, target: `n 0, λ under ${FRAG_SAFE_LAMBDA}, under ${BREACH_SAFE_KPA} kPa` });
  const honest = recs.filter(r => r.bot === 'honest'), bad = honest.filter(r => (r.d2faults ?? []).some(k => k === 'fragged' || k === 'concussed'));
  rows.push({ id: 'F31', name: 'no frag or concussion fault on the honest kit bot', met: !bad.length, value: `${honest.length} honest lanes, ${reads.filter(x => x.r.bot === 'honest').length} practice bursts: fragged ${honest.reduce((n, r) => n + (r.d2faults ?? []).filter(k => k === 'fragged').length, 0)}, concussed ${honest.reduce((n, r) => n + (r.d2faults ?? []).filter(k => k === 'concussed').length, 0)}${bad.length ? ` (${bad.slice(0, 3).map(r => `${r.kit} ${r.tier} ${r.seed}`).join(', ')})` : ''}; D2's other faults ${top(tally(honest.flatMap(r => (r.d2faults ?? []).filter(k => k !== 'fragged' && k !== 'concussed'))))}`, target: 'none' });
  const all = [...recs, ...shootRecs], br = all.flatMap(r => (r.breach ?? []).map(b => ({ ...b, r }))), long = br.filter(b => b.most > BALLISTIC_MAX_ROUNDS), passStruck = all.flatMap(r => (r.breachPass ?? []).filter(x => x.struck && ['pass', 'good', 'superb'].includes(x.grade)));
  rows.push({ id: 'F32', name: 'a ballistic breach strikes no stand at a pass; every point opens or hands back within 4 rounds', met: !long.length && !passStruck.length, value: `${br.length} doors shot over ${shootRecs.length} shoot lanes (read for F32 alone), ${br.reduce((n, b) => n + b.rounds, 0)} rounds (${br.filter(b => b.open).length} opened by them); a point past ${BALLISTIC_MAX_ROUNDS} rounds in one press ${long.length} (the most ${Math.max(0, ...br.map(b => b.most))}; again after a hand-back ${br.filter(b => Object.values(b.tries).some(n => n > BALLISTIC_MAX_ROUNDS)).length}); stands struck ${all.reduce((n, r) => n + (r.breachStruck?.length ?? 0), 0)}, at a pass ${passStruck.length}`, target: `0 struck at a pass; ${BALLISTIC_MAX_ROUNDS} rounds a point at most` });
  const sat = reads.filter(x => x.r.rung >= 3 && Number.isFinite(x.satMs)), over = sat.filter(x => x.satMs > FRAG_SIT_MS);
  rows.push({ id: 'F33', name: 'from the Sergeant up a practice grenade bursts within 2.5 s of landing', met: !over.length, value: `${sat.length} bursts: on the floor mean ${s2(mean(sat.map(x => x.satMs)) / 1000)} s, max ${s2(Math.max(0, ...sat.map(x => x.satMs)) / 1000)} s; over ${over.length}${over.length ? ` (${over.slice(0, 3).map(x => `${x.r.kit} ${x.r.tier} ${x.r.seed} ${x.satMs}`).join(', ')})` : ''}`, target: `${FRAG_SIT_MS / 1000} s or less` });
  return rows;
}
/** The kit's criteria failing: F1 to F26 where ENFORCED, F27 to F33 where KIT_ENFORCED. */
export const kitFailing = (rows) => rows.filter(r => (ENFORCED.has(r.id) || KIT_ENFORCED.has(r.id)) && !r.met).map(r => `${r.id} ${r.name}: ${r.value}`);

/** The kit's fuzz, printed (see the header): [{ tier, seed, use, done, end, laneS, kitSteps, errors, left (burning), lying (live on the floor or a door), marked (charges left and made safe), bursts }]. */
export function kitFuzz({ sheets = ['recruit', 'cpl', 'tierone'], seeds = [1, 2], uses = ['flash', 'breach'], maxMs = 12 * 60_000 } = {}) {
  const out = [];
  for (const use of uses) for (const tier of sheets) for (const seed of seeds) {
    const g = createGame({ scenario: 'test-shoothouse', seed: 48213 + seed, tier, setup: 'go', loadout: use });
    const r = runHouse(g, kitFuzzBot({ seed }), { maxMs }), H = g.state.armoury.range.house;
    out.push({ tier, seed, use, done: r.done, end: H.end?.why ?? null, laneS: H.goAtMs !== null ? ((H.end?.atMs ?? g.state.clock.ms) - H.goAtMs) / 1000 : null, kitSteps: r.mem.kitSteps ?? {}, errors: g.errors.length, left: liveDevices(g.state).filter(d => d.kind === 'grenade' || Number.isFinite(g.state.items[d.id]?.fuseAtMs)).length, lying: liveDevices(g.state).length, marked: [...H.rooms, H.hall].reduce((n, L) => n + L.faults.filter(f => f.kind === 'charge').length, 0), bursts: (H.bursts ?? []).length, DEVICES: Object.keys(DEVICES).length });
  }
  return out;
}
export { houseNow };
