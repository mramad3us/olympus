// OLYMPUS bots: the house bot, a marine who drives test-shoothouse to the card step by step by the keys (the recruit, the private) or by T's bundles (the corporal to the tier one), and its fuzz bot (the build sheet 0.0.12 §5.3).
//
// houseBot({ mode: 'keys' | 'T', humanStartMs, watch, lineK }) is a bot for tests/game.mjs (state, me, mem) → input. It
// reads only what the player sees (the instructor's command, the scene's view: shoothouse.js houseNow; the take-in's record
// once paused: contact.js contactNow's last, what the marine identified; the weapon card: firearms.js beliefOf; the step
// panel: shooting.js stepsOf; its own place) and presses what a player presses: G to bring the rifle up, X (the panel's
// 'leave'), the move keys out of stop motion, one row a press while time stands still (lib.mjs stepAct), T as the page
// sends it where the instinct offers a bundle (else the panel's lead bundle row, which is what T would do: COMBAT §25.8.1).
// Its plan:
//   before GO           LOAD and MAKE READY by their macros; on safe, low ready, out of the mode (X), still on the mark
//   GO, step by step    (keys) Stack on the door; Watch #1's corner when `watch`; the door's row (push, pull; kick when
//                       locked); X, then humanStartMs of nothing (the human's own start at 1:1), then the keys along the
//                       plan's path to #1's point, the line lineK long (a seeded 10% for the 100-seed run: a line pressed a
//                       little long); the pause: the identified threats shot (Off safe, Aim, then the first shot row open,
//                       else Fire), the hostage by To the head, a no-shoot held; then Move to your point, a Look at every
//                       hot spot not covered, "Clear!"; the hall by Move to the hall's end and "Clear!"
//   GO, by T            (rung 2) Stack and open, Enter, Dominate; (rung 3) Clear the room; (rung 4) Clear the house; at a
//                       pause the shots as above, then "Carry on"; a hand-back by its row (the inner door's "Hold it", a
//                       kick for a locked door); the singles where no bundle applies
//   Stop, UNLOAD        on safe; UNLOAD, SHOW CLEAR by its macro; the hot wash waited out
// A stoppage felt or seen (the instructor's dummy): IMMEDIATE ACTION. It throws on a decision repeated STALL_N times with
// the clock still (a stall, said at once). Its memory (me.bot) is plain data, so it saves and loads with the game; mem.log
// keeps each decision ({ atMs, step, cmd, leg }), mem.presses counts them.
//
// houseHonestBot() is COMBAT §25.19.8's honest player (the design's `houseTBot`, honest), the flawless suites' bot: T and the
// shot the line names, nothing else, every dead end written on its memory (see its own comment); houseTBot() stays the
// fixer's T player of 0.0.12 (a Wait where the line is quiet) for the suites that print its numbers. stoppageBot({ answer })
// is the honest bot with the reflex card's answer forced; houseKeysBot() the house bot's keys mode.
//
// houseFuzzBot({ seed }) hunts the scene's dead ends (the sheet's §5.3): random legal rows (never a shot row, the dummy never
// cleared, "Clear!" never called), X and the keys at random through windows, T's bundles and Backspace at random, a doorway
// stood in; its dice are hashes of its seed and its count of decisions (mem.n). Every run must reach the card (the user,
// 2026-11-07: "a scene never dead-ends").
import { houseNow } from '../../src/sim/scenarios/shoothouse.js';
import { stepsOf, targetOf } from '../../src/sim/arms/shooting.js';
import { beliefOf } from '../../src/sim/arms/firearms.js';
import { contactNow } from '../../src/sim/combat/contact.js';
import { lanePlanOf, pastThreshold, inFunnel } from '../../src/sim/combat/room.js';
import { cornerOf, TWO_WAIT_MS } from '../../src/sim/combat/bundle.js';
import { rungOf } from '../../src/sim/skills/templates.js';
import { instinctNow } from '../../src/sim/skills/instinct.js';
import { stepAct, pressToward } from './lib.mjs';
import { hashInt } from '../../src/core/hash.js';
import { TICK_MS } from '../../src/core/clock.js';

/** A decision repeated this many times with the clock still is a stall: the bot throws. */
export const STALL_N = 100;
/** Within this of a point the walk is done (m). */
export const POINT_M = 0.15;
const NOSHOOT = new Set(['hands', 'phone']);
const isShotRow = (st) => st.kind === 'shot' || String(st.id).startsWith('shot:');
const posture = (state) => state.people[state.player.id]?.kit?.carry?.posture ?? 'slungFront';

// (what the marine took in at the last pause, still facing and up: the weapons he identified (his own sector's first, the #2's
// after, nearest first), and the hands he could not see; never by the truth of a face)
function threatsOf(state, N, me, mem) {
  // (what each pause identified, kept: a man taken in at an earlier pause and still up is still a threat)
  const last = contactNow(state)?.last ?? null, ident = (mem.ident ??= {});
  for (const k of last?.ids ?? []) if (last.ident?.[k]) ident[k] = last.ident[k];
  // (only a man in the rifle's frame now (shooting.js targetOf: what the bracket can be put on): one taken in from the stack
  // and behind the jamb now cannot be bracketed, and 'pick=' on him looped with the clock still (2026-11-12, the lanes))
  const up = N.turners.filter(T => ident[T.key] !== undefined && T.facingK >= 0.5 && !T.down && targetOf(state, T.key, state.player.id));
  const order = (a, b) => (a.slot ?? 1) - (b.slot ?? 1) || Math.hypot(a.x - me.x, a.z - me.z) - Math.hypot(b.x - me.x, b.z - me.z) || a.key.localeCompare(b.key);
  return { armed: up.filter(T => ARMED.has(ident[T.key])).sort(order), unseen: up.filter(T => ident[T.key] === 'unseen').sort(order) };
}
const ARMED = new Set(['rifle', 'pistol']);

/** The house bot (see the header). */
export function houseBot({ mode = 'keys', humanStartMs = 300, watch = false, lineK = 1 } = {}) {
  return (state, me, mem) => {
    mem.log ??= []; mem.presses ??= 0;
    const N = houseNow(state);
    if (!N || N.rangeEnd) { mem.done = true; return {}; }
    if (state.skip || contactNow(state)?.pending) return {};
    const S = state.stop, pid = state.player.id, gunId = state.people[pid]?.kit?.worn?.sling, b = beliefOf(state, gunId), cmd = N.cmd, now = state.clock.ms;
    const legI = N.cur, L = N.legs[legI] ?? null, plan = L ? lanePlanOf(state).plans[L.door] : null;
    const lane = N.goAtMs !== null && !N.end;
    const choose = (step, tempo = 'normal', target = null) => {
      const key = `${now}|${step}|${target ?? ''}`;
      mem.same = mem.lastKey === key ? (mem.same ?? 0) + 1 : 0; mem.lastKey = key;
      if (mem.same >= STALL_N) throw new Error(`house bot: '${step}' chosen ${STALL_N} times at ${now} with the clock still (cmd ${cmd}, leg ${legI}; offered ${stepsOf(state).filter(x => !x.off).map(x => x.id).join(', ')})`);
      mem.log.push({ atMs: now, step, cmd, leg: legI }); if (mem.log.length > 400) mem.log.splice(0, mem.log.length - 400);
      mem.presses++;
      return { act: [stepAct(step, tempo, target)] };
    };
    const finger = state.people[pid]?.kit?.carry?.finger ?? 'off';
    const inside = !!plan && pastThreshold(plan, me.x, me.z);
    // ---- out of stop motion ----
    if (!S) {
      if (lane && mem.walk) return walk(state, me, mem, now, humanStartMs);
      if (lane) { mem.walk = null; return press(mem, now, { act: ['ready'] }); }
      // (before GO: still on the mark; G for a command's work)
      const settled = b?.mode === 'safe' && finger !== 'on' && posture(state) === 'lowReady' && b?.chamber === 'live' && b?.mag === 'in';
      const want = (cmd === 'load' && b?.mag !== 'in') || (cmd === 'ready' && !settled) || cmd === 'clear' || (cmd === 'stop' && (b?.mode !== 'safe' || finger === 'on'));
      return want ? press(mem, now, { act: ['ready'] }) : {};
    }
    if (S.reflex) return choose(`reflex:${S.reflex.why === 'click' ? 'ia' : 'look'}`);
    if (S.mode !== 'stop') return {};
    if (S.phase !== 'choose' && S.doing?.kind !== 'wait') return {};
    const steps = stepsOf(state), has = (id) => steps.some(s => s.id === id && !s.off), row = (pred) => steps.find(s => !s.off && pred(s)) ?? null;
    if (b?.stoppage === 'double' && has('macro:remedial')) return choose('macro:remedial');
    if (b?.stoppage && has('macro:ia')) return choose('macro:ia');
    if (['slungFront', 'slungBack'].includes(posture(state)) && has('up') && cmd !== 'clear') return choose('up');
    // ---- before GO and after the lane: the instructor's commands ----
    if (!lane) {
      const waiting = S.doing?.kind === 'wait';
      if (cmd === 'load' && b?.mag !== 'in' && has('macro:load')) return choose('macro:load');
      if (cmd === 'ready' && b?.chamber !== 'live' && has('macro:ready')) return choose('macro:ready');
      if (cmd === 'clear') {
        if (has('queue')) return choose('queue');
        // (UNLOAD, SHOW CLEAR once at the command: the instructor's next follows the show)
        if (has('macro:clear') && mem.clearAt !== N.cmdAtMs) { mem.clearAt = N.cmdAtMs; return choose('macro:clear'); }
        return waiting ? {} : has('wait') ? choose('wait') : {};
      }
      if (cmd === 'load' || cmd === 'brief') return waiting ? {} : has('wait') ? choose('wait') : {};
      if (b?.mode !== 'safe' && has('selector:safe')) return choose('selector:safe');
      if (finger === 'on' && has('finger')) return choose('finger');
      if (posture(state) !== 'lowReady' && has('posture:lowReady')) return choose('posture:lowReady');
      if (['end', 'wash'].includes(cmd) && waiting) return {};
      return choose('leave');
    }
    // ---- the lane ----
    // (dry with rounds left: RELOAD; an empty chamber: MAKE READY)
    if (b?.locked && b.count === 0) { const r = ['macro:reload:speed', 'macro:reload:retain'].find(has); if (r) return choose(r); }
    if (b?.chamber === 'empty' && b?.mag === 'in' && has('macro:ready')) return choose('macro:ready');
    // (Fire struck for an empty chamber: a RELOAD where one is offered, else the bolt home or a charge, each once a count)
    const fireRow = steps.find(x => x.id === 'fire');
    if (fireRow?.off === 'chamber empty') {
      // (after a RELOAD the bolt home (release) or a charge, never the RELOAD again: a Top up keeps the bolt where it was)
      const after = (mem.fixed ?? '').startsWith('macro:reload');
      const list = after ? ['release', 'charge'] : ['macro:reload:speed', 'macro:reload:retain', 'macro:reload:tactical', 'release', 'charge'];
      const r = list.find(id => has(id) && mem.fixed !== `${id}:${now}`);
      if (r) { mem.fixed = `${r}:${now}`; return choose(r); }
    }
    // (a pause on a person: the shots, never at a no-shoot; the hostage by the head)
    const last = contactNow(state)?.last ?? null;
    const seen = threatsOf(state, N, me, mem);
    // (hands not seen: Challenge, once a contact, as the panel leads with it)
    // (never a standing step in a doorway: the challenge waits until the feet are out of it, as a player who knows not to stop
    // there (the user, 2026-11-13: "soldiers need to stay fluidly moving"; the reach review's pause on the #2's man he cannot
    // yet see came in room 3's doorway for the recruit))
    const ask = plan && inFunnel(plan, me.x, me.z) ? null : seen.unseen.find(T => !(mem.challenged ?? []).includes(`${last?.id}:${T.key}`));
    if (last && ask && !seen.armed.length) {
      if (S.pick !== ask.key) return choose(`pick=${ask.key}`);
      (mem.challenged ??= []).push(`${last.id}:${ask.key}`);
      if (has('contact:challenge')) return choose('contact:challenge');
    }
    const threats = seen.armed;
    if (last && threats.length) {
      const want = threats[0].key;
      if (S.pick !== want) return choose(`pick=${want}`);
      const pick = S.pick, T = N.turners.find(t => t.key === pick);
      const rows = steps.filter(isShotRow).filter(s => (s.target ?? pick) === pick);
      const open = T?.face === 'hostage' ? rows.find(s => !s.off && /head/.test(s.id)) : rows.find(s => !s.off);
      if (open) return choose(open.id, 'normal', pick);
      if (b?.mode === 'safe' && has('selector:semi')) return choose('selector:semi');
      if (S.aim?.key !== pick && has('aim')) return choose('aim', 'normal', pick);
      if (T?.face !== 'hostage' && has('fire')) return choose('fire', 'normal');
      if (T?.face === 'hostage') { const h = rows.find(s => /head/.test(s.id)); if (h && !h.off) return choose(h.id, 'normal', pick); }
    }
    // (a hot spot past a bend still unseen once in the room: walked toward by the keys (see the looks below))
    const farW = inside && plan ? (plan.hot ?? []).find(h => h.why === 'far leg' && !L.corners?.by?.[h.id] && !(mem.walked ?? []).includes(`${legI}:${h.id}`)) : null;
    if (farW && mode === 'keys' && (mem.looked?.[legI] ?? []).includes(farW.id)) {
      (mem.walked ??= []).push(`${legI}:${farW.id}`);
      mem.walk = { leg: legI, fromMs: now, path: [[me.x, me.z], [farW.x, farW.z]], k: 1, lineK: 1, untilCovered: farW.id, stopM: 2.0 };
      return choose('leave');
    }
    // (the threats down: muzzle up before anything moves you or your eyes past your number two)
    if (last && !threats.length && posture(state) === 'aimed' && has('posture:highReady') && mem.upAfter !== last.id) { mem.upAfter = last.id; return choose('posture:highReady'); }
    // (a hand-back answered by its row (an inner door held, as the line says); a halted bundle carried on)
    const inner = row(s => s.id.startsWith('door:hold>'));
    if (inner && (inside || S?.carry?.why === 'door-unplanned')) return choose(inner.id);
    if (has('drill:carry') && mode === 'T') return choose('drill:carry');
    if (!L || !plan) return choose('leave');
    const rung = rungOf(state, pid, 'room');
    // (by T: the bundle the line would run (the instinct's act where it offers a drill row, else the panel's lead bundle))
    if (mode === 'T' && rung >= 2) {
      const it = instinctNow(state), act = it.line?.act ?? '';
      const tAct = /^stop:drill:/.test(act) ? act.slice(5) : null;
      const lead = tAct && has(tAct) ? tAct : row(s => s.kind === 'bundle' && s.bundle && !s.struck && s.id.startsWith('drill:') && s.id !== 'drill:carry')?.id ?? null;
      if (lead) { mem.T = (mem.T ?? 0) + 1; return choose(lead); }
    }
    // ---- step by step (and by T where no bundle applies) ----
    const door = plan.door, opened = !door || L.state === 'open' || L.state === 'entered' || !steps.some(s => s.id.startsWith(`door:`) && s.id.endsWith(`>${door}`) && !s.id.startsWith('door:hold'));
    const stackRow = row(s => s.id.startsWith('drill:stack:up>'));
    if (L.state === 'ahead' && stackRow && !inside) return choose(stackRow.id);
    if (!opened) {
      const d = row(s => /^door:(push|pull)>/.test(s.id)) ?? row(s => s.id.startsWith('door:kick>'));
      if (d) return choose(d.id);
    }
    if (!inside && door) {
      // (Watch #1's corner before X, when the bot's player does)
      const c = cornerOf(plan, 1);
      if (watch && c && has(`watch:${c.id}`) && mem.watched !== `${legI}`) { mem.watched = `${legI}`; return choose(`watch:${c.id}`); }
      // (X and the keys in: the human's own start, then the plan's path to #1's point)
      mem.walk = { leg: legI, fromMs: now, path: (plan.paths?.[1] ?? [plan.stack[0], plan.points[0]]).map(p => [...p]), k: 1, lineK };
      return choose('leave');
    }
    if (!inside && !door) {
      if (has('move:hallEnd') && Math.hypot(me.x - plan.points[0][0], me.z - plan.points[0][1]) > POINT_M) return choose('move:hallEnd');
    }
    // (a walk toward the far leg cut by a contact goes on once the shots are done, never back to the point first: a human keeps
    // going where he was going (2026-11-13, the rework's R8b: the far leg left unseen on 2 of 200 keys lanes))
    if (mode === 'keys' && mem.walk?.untilCovered && mem.walk.leg === legI && !L.corners?.by?.[mem.walk.untilCovered] && !(seen.armed.length || seen.unseen.length)) return choose('leave');
    if (inside && has('move:point')) return choose('move:point');
    // (every hot spot on your side neither of you has covered: a Look, once each; one still unseen past a bend walked
    // toward by the keys until it is; the #2's side his; then "Clear!")
    const covered = L.corners?.by ?? {}, tried = (mem.looked ??= {})[legI] ??= [];
    const mine = (h) => !plan.points?.[1] || Math.hypot(h.x - plan.points[0][0], h.z - plan.points[0][1]) <= Math.hypot(h.x - plan.points[1][0], h.z - plan.points[1][1]) || N.two?.pid === null;
    // (looks at high ready: never with the rifle shouldered across the #2)
    const look = (plan.hot ?? []).find(h => !covered[h.id] && mine(h) && !tried.includes(h.id) && has(`look:${h.id}`));
    if (look && posture(state) === 'aimed' && has('posture:highReady')) return choose('posture:highReady');
    if (look) { tried.push(look.id); return choose(`look:${look.id}`); }
    // (his side, once he is at his point and still has not covered it: a look of yours too)
    const twoA = state.actors.list.find(a => a.who === N.two?.pid), atPoint = twoA && plan.points?.[1] && Math.hypot(twoA.x - plan.points[1][0], twoA.z - plan.points[1][1]) <= 0.35;
    const theirs = atPoint ? (plan.hot ?? []).find(h => !covered[h.id] && !tried.includes(h.id) && has(`look:${h.id}`)) : null;
    if (theirs) { tried.push(theirs.id); return choose(`look:${theirs.id}`); }
    // (a hot spot still uncovered and the #2 not yet at his point: wait for him, a little (the wait cut by the next choice))
    if (inside && !atPoint && twoA && (plan.hot ?? []).some(h => !covered[h.id]) && (mem.waited ??= {})[legI] === undefined) { mem.waited[legI] = now; if (has('wait')) return choose('wait'); }
    if (S.doing?.kind === 'wait' && mem.waited?.[legI] !== undefined && now - mem.waited[legI] < TWO_WAIT_MS && !atPoint) return {};
    const far = (plan.hot ?? []).find(h => !covered[h.id] && h.why === 'far leg' && !(mem.walked ?? []).includes(`${legI}:${h.id}`));
    if (far && inside) {
      (mem.walked ??= []).push(`${legI}:${far.id}`);
      mem.walk = { leg: legI, fromMs: now, path: [[me.x, me.z], [far.x, far.z]], k: 1, lineK: 1, untilCovered: far.id, stopM: 2.0 };
      return choose('leave');
    }
    if (has('call:clear')) return choose('call:clear');
    return has('wait') && S.doing?.kind !== 'wait' ? choose('wait') : {};
  };
}

// (a key or an act pressed, counted, at most every half second for G)
function press(mem, now, input) {
  if (input.act?.[0] === 'ready') { if (mem.gAtMs !== undefined && now - mem.gAtMs < 500) return {}; mem.gAtMs = now; }
  mem.presses++;
  return input;
}

// (the walk in by the keys: nothing for the human's start, then toward each point of the path in turn; lineK > 1 runs the last leg long)
function walk(state, me, mem, now, humanStartMs) {
  const w = mem.walk;
  if (now - w.fromMs < humanStartMs) return {};
  // (a walk toward a hot spot ends once it is covered, or stopM short of it)
  if (w.untilCovered) {
    const N = houseNow(state), L = N?.legs?.[N.cur], h = w.path.at(-1);
    if (!L || L.corners?.by?.[w.untilCovered] || Math.hypot(me.x - h[0], me.z - h[1]) <= (w.stopM ?? 1)) { mem.walk = null; return { act: ['ready'] }; }
  }
  // (a point already passed is not walked back to (a human's eye: past it along the next leg), as when the game carried him on
  // through a doorway while the keys were not his (the rework's R8b: places/move.js throughOf))
  while (w.k < w.path.length - 1) {
    const [ax, az] = w.path[w.k], [bx, bz] = w.path[w.k + 1];
    if ((me.x - ax) * (bx - ax) + (me.z - az) * (bz - az) > 0) w.k += 1; else break;
  }
  while (w.k < w.path.length) {
    let p = w.path[w.k];
    if (w.k === w.path.length - 1 && w.lineK !== 1) { const o = w.path[w.k - 1]; p = [o[0] + (p[0] - o[0]) * w.lineK, o[1] + (p[1] - o[1]) * w.lineK]; }
    if (Math.hypot(me.x - p[0], me.z - p[1]) > POINT_M) return pressToward(me, p);
    w.k += 1;
  }
  mem.walk = null;
  return { act: ['ready'] };
}

/**
 * The T player (the fixer's of 0.0.12): before GO and after the lane the house bot's way; on the lane only T, as the page
 * sends it (the instinct's line and its act), and at a pause the shot the line names on a man of his own corner (slot 1),
 * the hands challenged where the line says, his #2's men left to him. It never presses a drill row itself, so a lane it
 * finishes is one T finishes. mem.T counts the presses of T, mem.refused the ones that did nothing.
 */
export function houseTBot() {
  const calm = houseBot({ mode: 'T' });
  return (state, me, mem) => {
    const N = houseNow(state);
    if (!N || N.rangeEnd) { mem.done = true; return {}; }
    if (N.goAtMs === null || N.end) return calm(state, me, (mem.calm ??= {}));
    if (state.skip || contactNow(state)?.pending) return {};
    const S = state.stop, now = state.clock.ms, it = instinctNow(state), line = it.line;
    if (S?.reflex) return { act: [stepAct(`reflex:${S.reflex.why === 'click' ? 'ia' : 'look'}`)] };
    // (the line names the shot and leaves it to him (no act): the row it names on the bracketed man of his own corner)
    if (S?.mode === 'stop' && S.phase === 'choose' && line && !line.act && ['cqb-contact', 'cqb-still-up', 'cqb-hostage'].includes(line.id)) {
      const T = N.turners.find(t => t.key === S.pick);
      if (T && !T.down && T.facingK >= 0.5 && (T.slot ?? 1) === 1 && mem.shotAt !== now) {
        // (the line's Press on the one round left: the Fire row, the shot rows all struck "one left" (2026-11-11))
        const rows = stepsOf(state).filter(x => (isShotRow(x) || (line.variant === 'press' && x.id === 'fire')) && !x.off && (x.target ?? T.key) === T.key);
        const r = line.id === 'cqb-contact' ? rows[0] : rows.find(x => /head/.test(x.id)) ?? rows[0];
        if (r) { mem.shotAt = now; (mem.shots ??= []).push({ atMs: now, row: r.id, key: T.key }); return { act: [stepAct(r.id, 'normal', T.key)] }; }
      }
    }
    if (line?.act) {
      const k = `${now}|${line.act}`;
      mem.tn = mem.tAt === k ? (mem.tn ?? 0) + 1 : 0; mem.tAt = k;
      if (mem.tn === 3) mem.refused = (mem.refused ?? 0) + 1;
      if (mem.tn >= 3) return {};
      mem.T = (mem.T ?? 0) + 1;
      return { act: ['instinct'] };
    }
    // (no line: G out of the mode; in it, a Wait once the line has had its ticks to come)
    if (!S) return press(mem, now, { act: ['ready'] });
    mem.nl = mem.nlAt === now ? (mem.nl ?? 0) + 1 : 0; mem.nlAt = now;
    if (S.mode === 'stop' && S.phase === 'choose' && mem.nl >= 3 && stepsOf(state).some(x => x.id === 'wait' && !x.off)) { mem.waits = (mem.waits ?? 0) + 1; return { act: [stepAct('wait')] }; }
    return {};
  };
}

/** The lines that name a shot and leave it to the player (no act): the honest bot takes the row they name on a man of his own. */
export const SHOT_LINES = Object.freeze(new Set(['cqb-contact', 'cqb-still-up', 'cqb-hostage']));
/** A T the game refuses this many times at one ms is a dead end (the act named, nothing done). */
export const REFUSED_N = 3;
/** Ticks of a stop with no act before the honest bot calls it a dead end (the line has its ticks to come, as on the page). */
export const DEAD_TICKS = 3;
/** The dead-end log kept on the bot's memory, per lane (entries). */
export const DEAD_LOG_N = 60;

/**
 * The honest T bot (COMBAT §25.19.8, the flawless suites' player; R9's gauge): T, as the page sends it (the line's id and act,
 * so T never does a line the player did not see), and, at a stop whose line names a shot and leaves it to him (no act), the
 * row it names on the bracketed man of his own corner (slot 1, or any man with no #2): "Pair." the pair, "Press." Fire,
 * "Head." the head. Nothing else: never a Wait, never a row of its own choosing, never G, never X.
 *
 * Where that leaves it nothing to press (a dead end: a stop whose line has no act and names no shot of his, a T the game
 * refuses REFUSED_N times, a reflex card whose line has no act, a shot named on the #2's man), it writes the dead end on its
 * memory (mem.dead by kind, mem.deadLog: { atMs, kind, leg, line }) and falls back so the measure goes on: on the lane a
 * Wait, else X; at a reflex card the card's first answer (or `answer`'s, the stoppage bot's); off the lane (before GO and
 * after it: the tower's commands) the calm house bot's press, counted in mem.hand. Out of stop motion on the lane with no
 * act it presses nothing (time runs, the scene's stall clock is the judge) and counts the ms in mem.outMs. mem.T counts
 * the presses of T, mem.shots the named shots, mem.presses every press. Its memory is plain data (me.bot), so a save holds it.
 */
export function houseHonestBot({ answer = null } = {}) {
  const calm = houseBot({ mode: 'T' });
  return (state, me, mem) => {
    mem.T ??= 0; mem.shots ??= 0; mem.presses ??= 0; mem.hand ??= 0; mem.waits ??= 0; mem.leaves ??= 0; mem.outMs ??= 0; mem.dead ??= {}; mem.deadLog ??= [];
    const N = houseNow(state);
    if (!N || N.rangeEnd) { mem.done = true; return {}; }
    if (state.skip || contactNow(state)?.pending) return {};
    const S = state.stop, now = state.clock.ms, line = instinctNow(state).line, lane = N.goAtMs !== null && !N.end;
    // (a dead end, once a stop: the kind, the leg, the line)
    const dead = (kind) => {
      const k = `${now}|${kind}`;
      if (mem.deadAt === k) return;
      mem.deadAt = k; mem.dead[kind] = (mem.dead[kind] ?? 0) + 1;
      mem.deadLog.push({ atMs: now, kind, leg: N.cur, line: line?.id ?? null, lane });
      if (mem.deadLog.length > DEAD_LOG_N) mem.deadLog.splice(0, mem.deadLog.length - DEAD_LOG_N);
    };
    const press = (act) => { mem.presses++; return { act: [act] }; };
    // (T as the page sends it; refused REFUSED_N times at one ms with one act: a dead end)
    const tryT = () => {
      if (!line?.act) return null;
      const k = `${now}|${line.id}|${line.act}`;
      mem.tn = mem.tAt === k ? (mem.tn ?? 0) + 1 : 0; mem.tAt = k;
      if (mem.tn >= REFUSED_N) { dead(`refused:${line.id}`); return null; }
      mem.T++;
      return press({ act: 'instinct', args: { id: line.id, act: line.act } });
    };
    // (the reflex card: T where the line answers it, else the card's first answer, or the one the stoppage bot forces)
    if (S?.reflex) {
      if (answer === null) { const t = tryT(); if (t) return t; }
      // (an answer shown struck (the rework's R6: Transition below the Sergeant, "not issued") is not offered: the card's first)
      const opts = S.reflex.options, o = (answer !== null ? opts.find(x => x.key === answer && !x.off) : null) ?? opts[0];
      if (answer !== null && !opts.some(x => x.key === answer && !x.off)) { mem.notOffered ??= {}; mem.notOffered[answer] = (mem.notOffered[answer] ?? 0) + 1; }
      if (answer === null) dead(`reflex:${line?.id ?? 'no line'}`);
      (mem.cards ??= []).push({ atMs: now, keys: opts.map(x => x.key), chose: o.key });
      if (mem.cards.length > 20) mem.cards.splice(0, mem.cards.length - 20);
      return press(stepAct(`reflex:${o.key}`));
    }
    const choosing = S?.mode === 'stop' && S.phase === 'choose';
    // (the line names the shot and leaves it to him: the row it names on the bracketed man, his own)
    if (choosing && line && !line.act && SHOT_LINES.has(line.id)) {
      const T = N.turners.find(t => t.key === S.pick), mine = T && (!N.two?.pid || (T.slot ?? 1) === 1);
      if (T && !T.down && T.facingK >= 0.5 && mine && mem.shotAt !== now) {
        const rows = stepsOf(state).filter(x => (isShotRow(x) || x.id === 'fire') && !x.off && (x.target ?? T.key) === T.key);
        const named = line.variant === 'press' ? rows.find(x => x.id === 'fire')
          : line.id === 'cqb-contact' ? rows.find(x => /^shot:pair/.test(x.id)) ?? rows.find(isShotRow)
            : rows.find(x => /head/.test(x.id)) ?? rows.find(isShotRow);
        if (named) { mem.shotAt = now; mem.shots++; return press(stepAct(named.id, 'normal', T.key)); }
      }
      if (T && !mine) dead(`his man named:${line.id}`);
    }
    const t = tryT();
    if (t) return t;
    // ---- nothing T or the line gives ----
    if (!lane) {
      // (before GO and after the lane: the tower's commands; what T does not do there, the calm bot does, counted; never
      // over a step running, which T may have started)
      if (S && !choosing) return {};
      const out = calm(state, me, (mem.calm ??= {}));
      if (out?.act?.length) { mem.hand++; (mem.handBy ??= {})[N.cmd ?? 'none'] = (mem.handBy[N.cmd ?? 'none'] ?? 0) + 1; if (choosing) dead(`off the lane:${N.cmd ?? 'none'}`); }
      return out ?? {};
    }
    if (!S) { mem.outMs += TICK_MS; return {}; }
    if (!choosing) return {};
    // (a stop with no act: its ticks to settle, then a dead end, and the fallback so the measure goes on)
    mem.nl = mem.nlAt === now ? (mem.nl ?? 0) + 1 : 0; mem.nlAt = now;
    if (mem.nl < DEAD_TICKS) return {};
    dead(line ? `no act:${line.id}` : 'no line');
    const offered = stepsOf(state);
    if (offered.some(x => x.id === 'wait' && !x.off)) { mem.waits++; return press(stepAct('wait')); }
    if (offered.some(x => x.id === 'leave' && !x.off)) { mem.leaves++; return press(stepAct('leave')); }
    return {};
  };
}

/** The stoppage bot (COMBAT §25.19.8 F20): the honest bot with the reflex card's answer forced to `answer` wherever the card offers it. */
export const stoppageBot = ({ answer }) => houseHonestBot({ answer });
/** The keys bot (the recruit and the private by the keys, COMBAT §25.19.8 F21): the house bot's keys mode. */
export const houseKeysBot = (o = {}) => houseBot({ mode: 'keys', ...o });

/** The fuzz bot's weights against 1 for every other row (my calls): a bundle, X, a door's row. */
export const HOUSE_FUZZ_W = Object.freeze({ bundle: 6, leave: 4, door: 3 });
/** The longest it stays out of the mode before it presses G (ms of game time). */
export const HOUSE_FUZZ_OUT_MS = 8_000;

/** The fuzz bot (see the header). */
export function houseFuzzBot({ seed = 1 } = {}) {
  const calm = houseBot({ mode: 'keys', humanStartMs: 300 });
  return (state, me, mem) => {
    mem.n ??= 0; mem.steps ??= {};
    const N = houseNow(state);
    if (!N || N.rangeEnd) { mem.done = true; return {}; }
    if (state.skip) return {};
    const now = state.clock.ms, die = (k) => hashInt(k, 'house-fuzz', seed, mem.n++);
    const count = (id) => { mem.steps[id] = (mem.steps[id] ?? 0) + 1; };
    // (before GO and after the lane: the calm bot, so the lane is reached and the card follows)
    if (N.goAtMs === null || N.end) return calm(state, me, (mem.calm ??= {}));
    // (in a window: keys mashed, every one refused by the act gate)
    if (contactNow(state)?.pending) { count('mash'); return die(3) === 0 ? { act: ['shoot'] } : { mx: die(3) - 1, mz: die(3) - 1 }; }
    const S = state.stop;
    if (!S) {
      if (mem.walk) {
        if (now >= mem.walk.untilMs) { delete mem.walk; return {}; }
        return { mx: mem.walk.mx, mz: mem.walk.mz };
      }
      if (mem.outUntil === undefined) mem.outUntil = now + die(HOUSE_FUZZ_OUT_MS);
      if (now < mem.outUntil) return {};
      delete mem.outUntil;
      if (die(3) !== 0) { count('walk'); mem.walk = { untilMs: now + 300 + die(3000), mx: die(3) - 1, mz: die(3) - 1 }; return {}; }
      count('G');
      return { act: ['ready'] };
    }
    if (S.reflex) { const o = S.reflex.options[die(S.reflex.options.length)]; count(`reflex:${o.key}`); return { act: [{ act: 'stop', args: { step: `reflex:${o.key}`, tempo: 'normal', keep: false } }] }; }
    if (S.mode !== 'stop') return {};
    // (Backspace now and then on a bundle running)
    if (S.doing?.beats && die(40) === 0) { count('backspace'); return { act: ['drill:stop'] }; }
    if (S.phase !== 'choose' && !(S.doing?.kind === 'wait' && die(10) === 0)) return {};
    // (never a shot, never IMMEDIATE ACTION (the dummy left), never "Clear!" (the stall must move it on))
    const steps = stepsOf(state).filter(st => !st.off && !isShotRow(st) && !['fire', 'macro:ia', 'macro:remedial', 'call:clear'].includes(st.id) && !String(st.id).startsWith('reflex:'));
    if (!steps.length) return {};
    const w = steps.map(x => (x.kind === 'bundle' ? HOUSE_FUZZ_W.bundle : x.id === 'leave' ? HOUSE_FUZZ_W.leave : x.kind === 'door' ? HOUSE_FUZZ_W.door : 1));
    let roll = die(w.reduce((a, c) => a + c, 0)), k = 0;
    while (roll >= w[k]) roll -= w[k++];
    const st = steps[k];
    count(st.id);
    return { act: [stepAct(st.id, 'normal', st.target ?? null)] };
  };
}

/** Run a bot on a game to its card or maxMs of game time (each(game) after every tick, before its facts are cleared): { ticks, ms, done, mem }. */
export function runHouse(game, bot, { maxMs = 30 * 60_000, maxTicks = Math.round(maxMs / TICK_MS) * 2, each = null } = {}) {
  const s0 = game.state.clock.ms;
  let ticks = 0;
  while (!houseNow(game.state)?.rangeEnd && game.state.clock.ms - s0 < maxMs && ticks < maxTicks) {
    game.step(1, bot);
    each?.(game);
    game.clearFacts?.();
    ticks++;
  }
  const me = game.state.actors.list.find(a => a.who === game.state.player.id);
  return { ticks, ms: game.state.clock.ms - s0, done: !!houseNow(game.state)?.rangeEnd, mem: me?.bot ?? {} };
}
export { TICK_MS };
