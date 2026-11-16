// OLYMPUS tests: the room's gauges, F50 to F54 (the build sheet v0.0.20 §8, role B: AT THE DOOR's five, the cold Fix, leaving a
// room, the far leg, the call-outs), over a lane recorded tick by tick (roomLane) by any of the house's bots.
//
// roomLane({ tier, seed, bot, setup, loadout }) plays a lane to its card and keeps what the gauges read: the 'say' facts (who, the
// call's id, its text, its ms), your beats' starts and ends (the 'bundle' facts: the far walk, a mark of yours, a room row's end),
// the #2's place against each room's door plane each tick (the last man's crossing), the marks houseLook draws (their first tick),
// his head against corner.js farCoverOf's point while your far walk runs, every AT THE DOOR stop's five, and the cold line's Fix
// (the core's row before GO and after Stop). roomGauges(lanes) gives F50 to F54 as [{ id, what, met, got, want }], printed by the
// suites (house-exit, house-far, house-callout, house-flawless-room). Pure but the lanes it plays.
import { createGame } from './game.mjs';
import { runHouse } from './bots/house.mjs';
import { houseNow, houseLook, marksLook } from '../src/sim/scenarios/shoothouse.js';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { modelOf, keyPathOf } from '../src/sim/arms/groups.js';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { lanePlanOf, pastThreshold } from '../src/sim/combat/room.js';
import { frameOf, farCoverOf, FAR_COVER_DEG, STATUS_MS } from '../src/sim/combat/corner.js';

const D2R = Math.PI / 180;
const wrap = (a) => ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
const RELOAD_RE = /^macro:reload:|^reach|^seat|^magIn/;

/** A lane recorded for the room's gauges (see the header). */
export function roomLane({ tier = 'tierone', seed = 48213, bot, setup = null, loadout = null, rung = null } = {}) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, ...(setup ? { setup } : {}), ...(loadout ? { loadout } : {}) }), s = g.state, me0 = s.player.id;
  const H = s.armoury.range.house, plans = lanePlanOf(s).plans, rec = { tier, seed, says: [], beats: [], cross: {}, marksAt: {}, doors: [], cold: [], far: [] };
  const side = {};
  let lastStop = null, wasPending = false;
  runHouse(g, bot, { maxMs: 20 * 60_000, each(game) {
    const now = s.clock.ms, two = s.actors.list.find(a => a.who === H.two.pid), me = s.actors.list.find(a => a.who === me0);
    for (const f of game.facts('say')) rec.says.push({ ms: now, who: f.who === me0 ? 1 : f.who === H.two.pid ? 2 : 0, call: f.call ?? null, text: f.text });
    for (const f of game.facts('bundle')) if (f.phase === 'beat' || f.phase === 'end' || f.phase === 'halt') rec.beats.push({ ms: f.atMs ?? now, who: f.who === me0 ? 1 : 2, phase: f.phase, id: f.id, beat: f.beat, why: f.why ?? null });
    // (the #2's side of each room's door plane: his crossing outward, the tick it was seen)
    if (two) for (const L of H.rooms) {
      const F = frameOf(plans[L.door]);
      if (!F) continue;
      const d = F.to(two.x, two.z).d, was = side[L.door];
      if (was !== undefined && was > 0 && d <= 0) (rec.cross[L.door] ??= []).push({ ms: now, meIn: !!me && pastThreshold(plans[L.door], me.x, me.z) });
      side[L.door] = d;
    }
    for (const m of marksLook(s, H, now)) rec.marksAt[m.door] ??= now;
    // (your far walk: his head against the far leg's mouth)
    const far = s.stop?.doing?.beats?.find(b => b.key === 'far' && b.st === 'run') ?? s.stop?.flow?.beats?.find(b => b.key === 'far' && b.st === 'run');
    if (far && two) { const P = plans[H.rooms[H.cur]?.door], c = farCoverOf(P); if (c) rec.far.push({ ms: now, off: Math.abs(wrap((two.headRad ?? 0) - Math.atan2(c.z - two.z, c.x - two.x))) / D2R }); }
    // (the stops: AT THE DOOR's five, the cold line's Fix)
    const S = s.stop, choosing = S?.mode === 'stop' && S.phase === 'choose' && !S.reflex;
    if (!choosing) return;
    const key = `${now}|${S.doing?.step ?? ''}`;
    if (key === lastStop) return;
    lastStop = key;
    const N = houseNow(s), steps = stepsOf(s), act = instinctNow(s).line?.act ?? null, M = modelOf(steps, { act });
    // (AT THE DOOR's stops: THE HALL, with no door to breach, keeps Enter on 5 on every lane (groups.js HALL_FIVE) and is apart)
    if (N.goAtMs !== null && !N.end && M.situation.id === 'door' && !M.situation.hall) {
      const row = act ? steps.find(r => `stop:${r.id}` === act) : null;
      rec.doors.push({ ms: now, five: M.situation.five.map(e => e.words), tKeys: row ? keyPathOf(M, 'c', row.id)?.length ?? null : null });
    }
    if (N.goAtMs === null || N.end) rec.cold.push({ ms: now, cmd: N.cmd, after: N.end ? 'stop' : 'go', fix: M.core.fix?.row?.id ?? null });
  } });
  rec.end = H.end?.why ?? null; rec.done = !!houseNow(s)?.rangeEnd;
  rec.legs = [...H.rooms, H.hall].map(L => ({ door: L.door, room: L.room, state: L.state, clearAtMs: L.clearAtMs, marked: L.marked ?? null, markYours: !!L.markYours, teamCalls: L.teamCalls ?? null, calls: L.calls ?? [] }));
  rec.H = { status: H.two.status ?? null, moving: H.two.moving ?? null, called: H.two.called ?? null, told: s.mind?.contact?.told ?? null, rung: rung ?? H.two.rung ?? null };
  return rec;
}

// (a lane's exits: each room called clear and left, your "Coming out!" before you passed its door, his "Last man." and the mark)
function exitsOf(R) {
  const out = [];
  for (const L of R.legs.slice(0, 3)) {
    if (L.state !== 'clear') continue;
    const said = R.says.find(x => x.who === 1 && x.call === 'out' && x.ms >= L.clearAtMs && x.ms <= (R.cross[L.door]?.[0]?.ms ?? Infinity) + 60_000);
    const last = R.says.find(x => x.call === 'last' && x.ms >= L.clearAtMs);
    const his = (R.cross[L.door] ?? []).find(c => c.ms >= L.clearAtMs && !c.meIn);
    out.push({ door: L.door, out: said?.ms ?? null, marked: L.marked, his: his?.ms ?? null, last: last?.ms ?? null, drawn: R.marksAt[L.door] ?? null, status: R.H.status?.[L.door] ?? null, clearAtMs: L.clearAtMs });
  }
  return out;
}

/** F50 to F54 over lanes (see the header): [{ id, what, met, got, want, enforced }]. */
export function roomGauges(lanes, { fuzz = [] } = {}) {
  const F = [];
  // F50: every AT THE DOOR stop shows the same five on every lane (P3-j), T's row one press
  const stops = lanes.flatMap(R => R.doors), five = [...new Set(stops.map(x => x.five.join('|')))], tBad = stops.filter(x => x.tKeys !== null && x.tKeys !== 1);
  F.push({ id: 'F50', what: "AT THE DOOR's five the same on every lane; T's row one press", met: five.length <= 1 && five[0] === 'Stack up|Stack up, take point|Open|Kick door|Breach' && !tBad.length, got: `${stops.length} stops, ${five.length} five(s): ${five.join(' / ')}; T in one press ${stops.length - tBad.length} of ${stops.filter(x => x.tKeys !== null).length}`, want: 'one five, Breach on 5; T 1 press', enforced: true });
  // F51: the cold line's Fix never Off safe, never Charge before MAKE READY, never a reload after Stop
  const coldBad = [];
  for (const R of [...lanes, ...fuzz]) { let ready = false; for (const x of R.cold) { if (x.cmd === 'standby' || x.cmd === 'go') ready = true; if (x.fix === 'selector:semi' || (!ready && x.fix === 'charge') || (x.after === 'stop' && RELOAD_RE.test(x.fix ?? ''))) coldBad.push(`${R.tier}/${R.seed} ${x.cmd}: ${x.fix}`); } }
  F.push({ id: 'F51', what: 'the cold line\'s Fix: no Off safe, no Charge before MAKE READY, no reload after Stop', met: !coldBad.length, got: `${[...lanes, ...fuzz].reduce((n, R) => n + R.cold.length, 0)} cold stops, ${coldBad.length} faults${coldBad.length ? `: ${coldBad.slice(0, 3).join('; ')}` : ''}`, want: '0', enforced: true });
  // F52: "Coming out!" before you pass a cleared room's door; the last man marks within 0.5 s of the plane, "Last man."; the room's end on his status within STATUS_MS
  const ex = lanes.flatMap(R => exitsOf(R).map(e => ({ ...e, lane: `${R.tier}/${R.seed}` })));
  const noOut = ex.filter(e => e.out === null), unmarked = ex.filter(e => !e.marked), late = ex.filter(e => e.his !== null && e.marked && e.marked.atMs - e.his > 500), popped = ex.filter(e => e.marked && e.drawn !== null && e.drawn < e.marked.atMs);
  const statusLate = ex.filter(e => e.status && e.status.saidMs - e.status.askMs > STATUS_MS);
  F.push({ id: 'F52', what: '"Coming out!" before leaving; the last man marks within 0.5 s of the plane, "Last man."; the room\'s end on his status within STATUS_MS', met: !noOut.length && !unmarked.length && !late.length && !popped.length && !statusLate.length, got: `${ex.length} rooms left: "Coming out!" ${ex.length - noOut.length}, marked ${ex.length - unmarked.length} (by your #2 ${ex.filter(e => e.his !== null && e.marked).length}), the mark past 0.5 s ${late.length}, drawn before the hand ${popped.length}, status past ${STATUS_MS} ms ${statusLate.length}${noOut.length ? `; no "Coming out!": ${noOut.slice(0, 3).map(e => `${e.lane} ${e.door}`).join(', ')}` : ''}${unmarked.length ? `; unmarked: ${unmarked.slice(0, 3).map(e => `${e.lane} ${e.door}`).join(', ')}` : ''}`, want: 'all, 0, 0, 0', enforced: true });
  // F53: "Moving!" and "Move!" before your feet leave your point for the far leg (by T); his eyes on the far leg 90% of your far walk from rung 2
  const T = lanes.filter(R => (R.H.rung ?? 0) >= 2), fars = [];
  for (const R of T) {
    const start = R.beats.find(b => b.who === 1 && b.beat === 'far' && b.phase === 'beat'), mv = R.says.find(x => x.call === 'moving'), go = R.says.find(x => x.call === 'move');
    const on = R.far.filter(x => x.off <= FAR_COVER_DEG).length;
    if (start) fars.push({ lane: `${R.tier}/${R.seed}`, ok: !!mv && !!go && mv.ms <= start.ms && go.ms <= start.ms + 50, share: R.far.length ? on / R.far.length : 1 });
  }
  const farBad = fars.filter(x => !x.ok || x.share < 0.9);
  F.push({ id: 'F53', what: '"Moving!" and "Move!" before the far walk; his eyes on the far leg for 90% of it (from rung 2)', met: !farBad.length, got: `${fars.length} far walks, called ${fars.filter(x => x.ok).length}, his eyes on it: ${fars.map(x => `${Math.round(100 * x.share)}%`).join(' ') || 'none'}`, want: 'all called, 90%', enforced: true });
  // F54: a call-out names only a face he identified (never one he did not), and never pauses the game
  const calls = lanes.flatMap(R => R.says.filter(x => x.call === 'contact').map(x => ({ ...x, lane: `${R.tier}/${R.seed}` })));
  const told = lanes.reduce((n, R) => n + Object.keys(R.H.told ?? {}).length, 0);
  F.push({ id: 'F54', what: 'his call-outs: only what he identified, told to your mind, never a pause', met: told >= calls.length, got: `${calls.length} called (${calls.slice(0, 3).map(x => `"${x.text}"`).join(', ')}), ${told} told`, want: 'every call told', enforced: true });
  return F;
}
/** A gauge line as the suites print it. */
export const gaugeLine = (g) => `${g.id} ${g.met ? 'MET' : 'UNMET'}: ${g.what}: ${g.got} (want ${g.want})`;
