// OLYMPUS tests: the team's bots for "Stack and clear" (v0.0.19, the build sheet v0.0.19 §6 and §8, the team's design §11): the keys bot that takes your number two's side of every room, the honest bot that orders his roles at the doors its kit allows, and the team's fuzz.
//
// sideBot() is tests/bots/house.mjs's keys bot (the recruit's and the private's walk) with one thing changed: its walk in by the
// keys at each door goes along the #2's path (the plan's paths[2]) to the #2's point, so it stands past the threshold on his side
// as his cue comes (FM 3-06.11 §3-29's case: he takes yours, team.js). Everything else is the keys bot's: the shots it has
// identified, the looks, "Clear!". In a room whose sides are swapped (R.house.two.side) the looks it would give the corner it no
// longer works are turned onto the one it now does (the hot spot nearer its point), so it clears what it stands on.
//
// teamTaskBot({ use: 'bang' | 'breach', base }) is the honest bot (base 'honest', T and the shot the line names) with one thing
// more, once at each lane door: stacked with your #2 on you and the door still shut, the TEAM row pressed, "#2, bang it" (use
// 'bang') or the first live "Breacher up: <way>" (use 'breach'), then T as the page sends it (cqb-task's entry on his work). At a
// door not yet stacked it presses the stack row the panel offers first (Stack up, take point), as a player who means to send his
// #2 in front. T never orders a task (COMBAT §25.5.6): the bot does, as a player would. Its memory says what it ordered
// (mem.tasks: [{ door, row, atMs }]).
//
// houseOwnerBot() is the honest bot reading whose man a stand is by team.js ownerOf (so a swapped room is played to its "Clear!").
//
// teamFuzzBot({ seed }) is the house's fuzz bot with the team's rows (TEAM 2 to 4) pressed in its place one time in TEAM_FUZZ_K,
// hunting the dead ends an order, a belay or a swap could leave, with As you were after his charge is placed one task in
// TEAM_FUZZ_BELAY_K (the dead end the review of 2026-11-16 found by hand). The memory is plain data on the actor (the bots' rule), so it saves.
import { houseHonestBot, houseKeysBot, houseFuzzBot, SHOT_LINES } from './house.mjs';
import { stepAct } from './lib.mjs';
import { stepsOf } from '../../src/sim/arms/shooting.js';
import { houseNow } from '../../src/sim/scenarios/shoothouse.js';
import { doorNow, STACK_NEAR_M } from '../../src/sim/combat/bundle.js';
import { lanePlanOf } from '../../src/sim/combat/room.js';
import { hashInt } from '../../src/core/hash.js';
import { ownerOf } from '../../src/sim/combat/team.js';
import { facingOf } from '../../src/sim/arms/turners.js';
import { instinctNow } from '../../src/sim/skills/instinct.js';

/** The side bot (see the header). */
export function sideBot(o = {}) {
  const inner = houseKeysBot(o);
  return (state, me, mem) => {
    const before = mem.walk ?? null, out = inner(state, me, mem);
    const N = houseNow(state), plan = N ? lanePlanOf(state).plans[N.legs[N.cur]?.door] : null;
    // (a fresh walk in along #1's path: along the #2's to his point instead)
    if (mem.walk && mem.walk !== before && !mem.walk.untilCovered && !mem.walk.side && plan?.paths?.[2] && plan.door) {
      // (from where you stand, past his stack point (the path's first, where he stands: the review of v0.0.19 found the walk
      // heading back to it, into him, and no side ever swapped), through the door to his point)
      mem.walk.path = [[me.x, me.z], ...plan.paths[2].slice(1).map(p => [...p])]; mem.walk.side = 2; mem.walk.k = 1;
      mem.sides = (mem.sides ?? 0) + 1;
    }
    // (Move to your point in a room whose sides are not yet swapped: the keys again, on to the #2's point, as a keys player keeps
    // walking where he was going (a pause in the doorway took his walk; the panel's point is #1's until the swap))
    const act = out?.act?.[0], step = act?.args?.step ?? '';
    const sw = state.armoury?.range?.house?.two?.side?.[plan?.door ?? ''] === 1;
    // (not once your #2 stands at his point: the walk would end on him, held by the body gap until the stall passed the leg (the
    // review of v0.0.19: 0.49 m from him from 15.05 s to the lane's end))
    const two = N?.twoPid ? state.actors?.list?.find(a => a.who === N.twoPid) : state.actors?.list?.find(a => a.who === state.armoury?.range?.house?.twoPid);
    const hisTaken = !!two && !!plan?.points?.[1] && Math.hypot(two.x - plan.points[1][0], two.z - plan.points[1][1]) < 1.0;
    if (step === 'move:point' && !sw && !hisTaken && plan?.door && plan.points?.[1]) {
      mem.walk = { leg: N.cur, fromMs: state.clock.ms, path: [[me.x, me.z], [...plan.points[1]]], k: 1, lineK: 1, side: 2 };
      return { act: [stepAct('leave')] };
    }
    if (sw && step.startsWith('look:') && plan?.points?.[1]) {
      const L = N.legs[N.cur], cov = L?.corners?.by ?? {}, near = (h, k) => Math.hypot(h.x - plan.points[k][0], h.z - plan.points[k][1]);
      const offered = new Set(stepsOf(state).filter(s => !s.off).map(s => s.id));
      const want = (plan.hot ?? []).find(h => !cov[h.id] && near(h, 1) < near(h, 0) && offered.has(`look:${h.id}`) && !(mem.sideLooked ?? []).includes(`${N.cur}:${h.id}`));
      if (want && step !== `look:${want.id}`) { (mem.sideLooked ??= []).push(`${N.cur}:${want.id}`); return { act: [stepAct(`look:${want.id}`)] }; }
    }
    return out;
  };
}

/**
 * The honest bot with "mine" read by team.js ownerOf instead of the stand's slot (houseNow gives the bots `slot` alone, so after a
 * swap the honest bot leaves the man it now owns to its #2 and waits: the review of 2026-11-16). The shot the line names on the
 * bracketed man you own, up and facing, is pressed as the honest bot presses it; everything else is the honest bot's. Its memory
 * counts the shots it took that way (mem.ownShots).
 */
export function houseOwnerBot(o = {}) {
  const inner = houseHonestBot(o);
  return (state, me, mem) => {
    const S = state.stop, now = state.clock.ms, line = S?.mode === 'stop' && S.phase === 'choose' && !S.reflex ? instinctNow(state).line : null;
    if (line && !line.act && SHOT_LINES.has(line.id) && mem.ownShotAt !== now) {
      const T = (state.armoury?.range?.turners ?? []).find(t => t.key === S.pick);
      if (T && (T.stoppedAtMs === null || T.stoppedAtMs === undefined) && facingOf(T, now) >= 0.5 && ownerOf(state, T) === 1 && (T.slot ?? 1) !== 1) {
        const rows = stepsOf(state).filter(x => (x.kind === 'shot' || String(x.id).startsWith('shot:') || x.id === 'fire') && !x.off && (x.target ?? T.key) === T.key);
        const named = line.variant === 'press' ? rows.find(x => x.id === 'fire') : line.id === 'cqb-contact' ? rows.find(x => /^shot:pair/.test(x.id)) ?? rows.find(x => x.id !== 'fire') : rows.find(x => /head/.test(x.id)) ?? rows.find(x => x.id !== 'fire');
        if (named) { mem.ownShotAt = now; mem.ownShots = (mem.ownShots ?? 0) + 1; return { act: [stepAct(named.id, 'normal', T.key)] }; }
      }
    }
    return inner(state, me, mem);
  };
}

/** The task bot (see the header). */
const rows0 = (state) => stepsOf(state);
export function teamTaskBot({ use = 'bang', base = 'honest' } = {}) {
  const inner = base === 'keys' ? houseKeysBot() : houseHonestBot();
  return (state, me, mem) => {
    mem.tasks ??= []; mem.teamDoors ??= {};
    const N = houseNow(state), S = state.stop;
    if (N && N.goAtMs !== null && !N.end && S?.mode === 'stop' && S.phase === 'choose' && !S.reflex) {
      const pid = state.player.id, here = doorNow(state, pid), door = here?.door ?? null;
      if (door && door !== 'hall' && !mem.teamDoors[door]) {
        const rows = stepsOf(state), live = (re) => rows.find(r => re.test(r.id) && !r.off);
        const re = use === 'bang' ? /^drill:team:bang>/ : /^drill:team:breach@/;
        const row = live(re);
        if (row) { mem.teamDoors[door] = true; mem.tasks.push({ door, row: row.id, atMs: state.clock.ms }); return { act: [stepAct(row.id)] }; }
        // (not yet stacked: the panel's stack row first, so the #2 is on you; once, then T)
        const s0 = here.plan?.stack?.[0], stacked = s0 && Math.hypot(me.x - s0[0], me.z - s0[1]) <= STACK_NEAR_M;
        const st = !stacked && (mem.stackAt ?? null) !== door ? live(/^drill:stack:(point|up)>/) : null;
        if (st) { mem.stackAt = door; return { act: [stepAct(st.id)] }; }
        // (stacked and the row still struck after a second (his kit lacks it, the door open): left to T)
        if (stacked && rows.some(r => re.test(r.id))) { mem.waitAt ??= {}; mem.waitAt[door] ??= state.clock.ms; if (state.clock.ms - mem.waitAt[door] > 3000) mem.teamDoors[door] = 'left'; else return rows.some(r => r.id === 'wait' && !r.off) ? { act: [stepAct('wait')] } : {}; }
      }
      // (his task under way on your word: the DI's task line is followed as it stands ("Cover it", then "Bang! Go."), whatever the
      // base bot would do on its own (the keys bot's own contact drill challenged through the doorway before the bang: the review
      // of v0.0.19)
      const line = instinctNow(state)?.line;
      if (base === 'keys' && line?.id === 'cqb-task' && typeof line.act === 'string' && line.act.startsWith('stop:')) {
        const id = line.act.slice(5);
        if (rows0(state).some(r => r.id === id && !r.off)) return { act: [stepAct(id)] };
      }
    }
    // (and while his bang is coming on your door, nothing of the base bot's own pressed under the Wait: it ends at the bang)
    const t = N?.two?.task ?? state.armoury?.range?.house?.two?.task;
    if (base === 'keys' && t?.kind === 'bang' && t.st === 'working' && S?.mode === 'stop' && S.phase !== 'choose' && S.doing?.kind === 'wait' && doorNow(state, state.player.id)?.door === t.door) return {};
    return inner(state, me, mem);
  };
}

/** The team's fuzz (see the header): the house fuzz bot with a team row pressed in its place one time in TEAM_FUZZ_K. */
export const TEAM_FUZZ_K = 3;
/** As you were pressed once his charge is placed, one task in this many (the fuzz's weighting of the belay after the place). */
export const TEAM_FUZZ_BELAY_K = 2;
export function teamFuzzBot({ seed = 1 } = {}) {
  const inner = houseFuzzBot({ seed });
  return (state, me, mem) => {
    mem.tn ??= 0;
    const S = state.stop, N = houseNow(state);
    if (N && N.goAtMs !== null && !N.end && S?.mode === 'stop' && S.phase === 'choose' && !S.reflex) {
      const rows = stepsOf(state).filter(r => !r.off && /^drill:team:|^team:cover$/.test(r.id));
      // (As you were with his charge on the door, once a task, one time in TEAM_FUZZ_BELAY_K: the dead end the review of 2026-11-16 found by hand)
      const t = state.armoury?.range?.house?.two?.task, belay = rows.find(r => /^drill:team:belay>/.test(r.id));
      if (belay && t?.how === 'charge' && t.done?.place !== undefined && !(mem.belayTried ?? []).includes(t.atMs)) {
        (mem.belayTried ??= []).push(t.atMs);
        if (hashInt(TEAM_FUZZ_BELAY_K, 'team-fuzz-belay', seed, t.atMs) === 0) { (mem.teamSteps ??= {})[`${belay.id} (placed)`] = (mem.teamSteps[`${belay.id} (placed)`] ?? 0) + 1; return { act: [stepAct(belay.id)] }; }
      }
      if (rows.length && hashInt(TEAM_FUZZ_K, 'team-fuzz', seed, mem.tn++) === 0) {
        const r = rows[hashInt(rows.length, 'team-fuzz-pick', seed, mem.tn++)];
        (mem.teamSteps ??= {})[r.id] = (mem.teamSteps[r.id] ?? 0) + 1;
        return { act: [stepAct(r.id)] };
      }
    }
    return inner(state, me, mem);
  };
}
