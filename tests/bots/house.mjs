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
// v0.0.19 ("Stack and clear, live"): SHOT_LINES gains cqb-rp-fire (a role-player firing on you: the pair it names), and the keys
// bot covers a role-player down or with his hands up that its pause took in (Challenge him first for the hands, then Cover him, the
// contact's hold), as the instinct's cqb-rp-down and cqb-rp-hands tell T to; on the turner lane none of it is reached.
//
// houseFuzzBot({ seed }) hunts the scene's dead ends (the sheet's §5.3): random legal rows (never a shot row, the dummy never
// cleared, "Clear!" never called), X and the keys at random through windows, T's bundles and Backspace at random, a doorway
// stood in; its dice are hashes of its seed and its count of decisions (mem.n). Every run must reach the card (the user,
// 2026-11-07: "a scene never dead-ends").
//
// v0.0.26 ("Bang, then go", its build sheet §6 B): the house bot reads the scene's two new words as the player does: a man read COWERING
// (the identification's state, contact.js's, or the Challenge row the panel offers on him) is challenged once before any round, as the
// DI's "He's done. Challenge him." says (a round at him is lawful all the same: the honest and T bots follow the line); a man read DAZED
// is shot as any armed man, as "He's dazed. Now." says (SHOT_LINES and PAIR_LINES hold cqb-rp-dazed). After room 1's "Clear!", with the
// search offered (R.house.bangGo.offer), the keys bot walks to the nearest man accounted for (contact.js searchableOf) until he is within
// SEARCH_M and presses "Search him" once a man (mem.searchedKeys); T's bots search only where T offers it, in reach.
// v0.0.26 ("Bang, then go", its build sheet §6 B, F138): breachFuzzBot({ seed }) hunts the scene's dead ends: the late stack's kit bot
// (tests/bots/kit.mjs houseKitBot's `late`, 3 to 6 s after the bang, by the seed; the bang thrown where it is issued) up to room 1's
// threshold, then the house's fuzz bot with three things more and one less: a man with his hands up searched where the row is offered
// ('contact:search'), a round at a man with his hands up once (a shot row on him: F39 catches it as the fault 'surrendered'), never a
// challenge ('contact:challenge' dropped from its choices); its dice its own stream ('breach-fuzz'), so no house fuzz lane moves.
// v0.0.21 (its build sheet's item 6): at MAKE READY and Standby the house bot answers the holstered P-12's round still owed
// (sidearm.js pistolOwed: its part of the rifle's MAKE READY fumbled) by its own row, "P-12: MAKE READY", as the instructor's nudge
// names it, and a P-12 that row left in the hand (a part fumbled after the draw) by its Carry on, else Rifle up; before, it read the
// rifle alone and sat through the tower's move-on (the fumble net's p12-unready lanes: five of six sheets on seed 1 had the
// instructor rack it). houseBot({ p12: false }) is the rifle alone, as before (house-pistol's run without it).
import { houseNow } from '../../src/sim/scenarios/shoothouse.js';
import { stepsOf, targetOf } from '../../src/sim/arms/shooting.js';
import { beliefOf } from '../../src/sim/arms/firearms.js';
import { contactNow, searchableOf, SEARCH_M } from '../../src/sim/combat/contact.js';
import { lanePlanOf, pastThreshold, inFunnel } from '../../src/sim/combat/room.js';
import { cornerOf, TWO_WAIT_MS, insideOf } from '../../src/sim/combat/bundle.js';
import { clipped } from '../../src/sim/combat/route.js';
import { parseHouse } from '../../src/sim/scenes/assemble.js';
import { rungOf } from '../../src/sim/skills/templates.js';
import { instinctNow } from '../../src/sim/skills/instinct.js';
import { pistolOwed, drawn as drawnPistol } from '../../src/sim/arms/sidearm.js';
import { stepAct, pressToward } from './lib.mjs';
// (v0.0.26: the late stack's kit bot for breachFuzzBot, read at call time: kit.mjs imports this file)
import * as KIT from './kit.mjs';
import { onFaceOf, bootsLocked, footingOf } from '../../src/sim/body/footing.js';
import { bracePending, gravNow } from '../../src/sim/places/gravity.js';
import { hashInt } from '../../src/core/hash.js';
import { TICK_MS } from '../../src/core/clock.js';

/** A decision repeated this many times with the clock still is a stall: the bot throws. */
export const STALL_N = 100;
/** Within this of a point the walk is done (m). */
export const POINT_M = 0.15;
/** A leg whose door was found open is stacked on first from farther than this off its stack (m; my call, v0.0.21). */
export const OPEN_STACK_M = 1.0;
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
  const order = (a, b) => (a.owner ?? a.slot ?? 1) - (b.owner ?? b.slot ?? 1) || Math.hypot(a.x - me.x, a.z - me.z) - Math.hypot(b.x - me.x, b.z - me.z) || a.key.localeCompare(b.key);
  return { armed: up.filter(T => ARMED.has(ident[T.key])).sort(order), unseen: up.filter(T => ident[T.key] === 'unseen').sort(order) };
}
const ARMED = new Set(['rifle', 'pistol']);
// (v0.0.21, the build sheet §1 item 13: houseNow read once a tick by every bot of a lane, keyed by the state, its clock's seq and
// ms; a WeakMap, so nothing reaches the actor's saved memory. The view is the same object for each reader of that tick)
const HN = new WeakMap();
function houseView(state) {
  const c = state.clock, m = HN.get(state);
  if (m && m.seq === c.seq && m.ms === c.ms && m.tick === c.tick) return m.N;
  const N = houseNow(state);
  HN.set(state, { seq: c.seq, ms: c.ms, tick: c.tick, N });
  return N;
}

/** The house bot (see the header). */
export function houseBot({ mode = 'keys', humanStartMs = 300, watch = false, lineK = 1, p12 = true } = {}) {
  return (state, me, mem) => {
    mem.log ??= []; mem.presses ??= 0;
    const N = houseView(state);
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
    // (v0.0.26, "Bang, then go": the search after room 1's "Clear!", by the keys (see the header))
    const sr = lane && mode === 'keys' ? searchStep(state, me, mem) : null;
    if (sr) return sr.step ? choose(sr.step, 'normal', sr.target) : sr;
    // ---- out of stop motion ----
    if (!S) {
      // (v0.0.25, the Wreck: the tug's warning on the deckhead, G for the face's row (feet aft), whatever the walk)
      if (lane && wreckOf(state) && aftDue(state) && onFaceOf(state, pid) === 'deckhead') { mem.walk = null; return press(mem, now, { act: ['ready'] }); }
      if (lane && mem.walk) return walk(state, me, mem, now, humanStartMs);
      if (lane) { mem.walk = null; return press(mem, now, { act: ['ready'] }); }
      // (before GO: still on the mark; G for a command's work)
      // (v0.0.21, the build sheet's item 6: the holstered P-12's round owed too (sidearm.js pistolOwed: its part of MAKE READY fumbled),
      // which the tower waits on; before, the bot read the rifle alone and sat through the move-on, the net's p12-unready lanes)
      const settled = b?.mode === 'safe' && finger !== 'on' && posture(state) === 'lowReady' && b?.chamber === 'live' && b?.mag === 'in';
      // (v0.0.22, FL22-1: at SHOW CLEAR, not where the DI's line says to wait with nothing to press ("Your number two is still on it.
      // Wait.": your guns passed, his clear the scene's to skip), as a player who reads it)
      // (the B and C review of 2026-11-16: the lines that say so exactly, the tower's command's 'two' (instinct/range.js range-cmd)
      // and range-wait ("Done. Wait for the next command."), not any line without an act: "A question mark is not a condition. Check
      // it." asks you to check the gun, G as the bot pressed before v0.0.22; and nothing on the first tick after a load, where the instinct has not run (its line runtime, $instinct, never saved):
      // the bot read no line there and pressed G where the unbroken run read the Wait and pressed nothing, so a save in the
      // house-showclear tail carried on apart in the bot's gAtMs and presses, and after a load the instinct, settled afresh, put up
      // the tower's line where the unbroken run kept the question mark's, and the bot pressed G on one and not the other)
      if (cmd === 'clear' && state.$instinct === undefined) return state.armoury?.range?.shown ? {} : press(mem, now, { act: ['ready'] });
      const line = cmd === 'clear' ? instinctNow(state)?.line ?? null : null, waitTwo = line?.id === 'range-wait' || (line?.id === 'range-cmd' && line.variant === 'two');
      const want = (cmd === 'load' && b?.mag !== 'in') || (cmd === 'ready' && !settled) || (cmd === 'clear' && !waitTwo) || (cmd === 'stop' && (b?.mode !== 'safe' || finger === 'on'))
        || (p12 && (cmd === 'ready' || cmd === 'standby') && (pistolOwed(state, pid) || !!drawnPistol(state, pid)));
      return want ? press(mem, now, { act: ['ready'] }) : {};
    }
    if (S.reflex) return choose(`reflex:${S.reflex.why === 'click' ? 'ia' : 'look'}`);
    if (S.mode !== 'stop') return {};
    if (S.phase !== 'choose' && S.doing?.kind !== 'wait') return {};
    const steps = stepsOf(state), has = (id) => steps.some(s => s.id === id && !s.off), row = (pred) => steps.find(s => !s.off && pred(s)) ?? null;
    if (b?.stoppage === 'double' && has('macro:remedial')) return choose('macro:remedial');
    if (b?.stoppage && has('macro:ia')) return choose('macro:ia');
    // (v0.0.22, its build sheet's item 18 (FL22-8): at SHOW CLEAR too, where the DI's line says "Rifle up." (the rifle swung onto its
    // sling in the macro, a fumble), as a player reads it, then UNLOAD, SHOW CLEAR again where the DI's line names it (below); before,
    // the bot pressed Wait until the instructor's take at the move-on (the boot recruit on seed 1 live: the swing 2.55 s into the
    // macro, the take 60 s after the command))
    if (['slungFront', 'slungBack'].includes(posture(state)) && has('up') && (cmd !== 'clear' || instinctNow(state)?.line?.act === 'stop:up')) return choose('up');
    // (v0.0.20, the build sheet's item 12: by the keys, "Coming out!" before leaving a room called clear: the single, DRILL_IN 6,
    // once a room (a stack row after it says nothing more: bundle.js's `out` kind, once a room))
    if (lane && mode === 'keys' && has('call:out') && !(mem.out ??= {})[legI]) { mem.out[legI] = now; return choose('call:out'); }
    // (the P-12 out (a Transition pressed on the card, every sheet from 2026-11-15): Rifle up where the DI's line says "Rifle up."
    // (cqb-rifle-up), as a player reads it; the tower's Stop and SHOW CLEAR want it holstered)
    if (has('weapon:rifle-up') && instinctNow(state)?.line?.act === 'stop:weapon:rifle-up') return choose('weapon:rifle-up');
    // ---- before GO and after the lane: the instructor's commands ----
    if (!lane) {
      const waiting = S.doing?.kind === 'wait';
      if (cmd === 'load' && b?.mag !== 'in' && has('macro:load')) return choose('macro:load');
      // (no magazine in and LOAD not offered, the pouches' fumbled to the floor: the one at the feet, by its reach and its seat, as the
      // instructor's "a magazine in." asks (the hunt of v0.0.18's pistol-6: the bot waited, and the tower went to GO with the rifle
      // empty and the P-12 unchambered))
      if ((cmd === 'load' || cmd === 'ready') && b?.mag !== 'in') { const r = ['seat', 'reach@ground', 'macro:reload:speed'].find(has); if (r) return choose(r); }
      if (cmd === 'ready' && b?.chamber !== 'live' && has('macro:ready')) return choose('macro:ready');
      // (v0.0.21: the holstered P-12's own MAKE READY where its round is still owed, the rifle's done (sidearm.js weaponRows: "P-12: MAKE
      // READY", as the instructor's nudge and the DI's line name it))
      // (p12 false: the rifle alone, as v0.0.20's bot read it (house-pistol's run without the fix))
      if (p12 && (cmd === 'ready' || cmd === 'standby') && pistolOwed(state, pid) && has('weapon:other:macro:ready') && mem.p12ReadyAt !== now) { mem.p12ReadyAt = now; return choose('weapon:other:macro:ready'); }
      // (and that row halted with the P-12 still in the hand (a fumbled part after its draw): its Carry on, else Rifle up, which holsters it)
      if (p12 && (cmd === 'ready' || cmd === 'standby') && drawnPistol(state, pid) && mem.p12OutAt !== now) { const r = ['queue', 'weapon:rifle-up'].find(has); if (r) { mem.p12OutAt = now; return choose(r); } }
      if (cmd === 'clear') {
        if (has('queue')) return choose('queue');
        // (UNLOAD, SHOW CLEAR once at the command: the instructor's next follows the show)
        // (v0.0.22, item 18: and again where the DI's line names it after a halt, a swing onto the sling put right (the macro plans
        // from what the card believes, so what is already clear is not done twice), once a pause)
        const again = instinctNow(state)?.line?.act === 'stop:macro:clear' && mem.clearAgainAt !== now;
        if (has('macro:clear') && (mem.clearAt !== N.cmdAtMs || again)) { mem.clearAt = N.cmdAtMs; if (again) mem.clearAgainAt = now; return choose('macro:clear'); }
        // (the rifle's done and the holstered P-12 still loaded (a fumble halted the macro short of it): its own row, as the
        // instructor names it (sidearm.js pistolClearOwed; the hunt of v0.0.18's pistol-2))
        if (has('weapon:pistol-clear') && mem.pistolClearAt !== now) { mem.pistolClearAt = now; return choose('weapon:pistol-clear'); }
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
    // (v0.0.25, the Wreck: dry on the far side of the deck hatch, on the coaming's hold: the plant first, the reload on the face (the
    // review of C and D: the recruit by the keys on 1074 reloaded hanging in the hatch, "Out of the hatch!"), as below)
    const coaming = lane && wreckOf(state) && me.anchor === 'handhold' && onFaceOf(state, pid) === 'deck' && Number.isFinite(me.floatY) && !me.faceTo;
    if (coaming && (b?.locked || b?.chamber === 'empty')) { const f = aftDue(state) ? 'face:aft' : 'face:deckhead'; if (has(f)) return choose(f); }
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
    // (v0.0.25, the Wreck: a man of your #2's sector left to him once he is through the deck hatch and up in the hold with you: the
    // swing onto him crossed your #2 planted beside the scuttle, "Muzzle!" (the review of C and D: the recruit by the keys on 48213,
    // from the hold's 3b to 3a across him, once the brace brought him through on your heels); the house's lanes as ever)
    const twoIn = wreckOf(state) && plan?.hatch && N.two?.pid ? state.actors.list.find(x => x.who === N.two.pid) : null;
    const his = (T) => (T.owner ?? T.slot ?? 1) === 2 && !!twoIn && insideOf(plan, twoIn.x, twoIn.z) && footingOf(state, N.two.pid).mode !== 'float';
    const threats = seen.armed.filter(T => !his(T));
    if (last && threats.length) {
      const want = threats[0].key;
      if (S.pick !== want) return choose(`pick=${want}`);
      const pick = S.pick, T = N.turners.find(t => t.key === pick);
      // (v0.0.26: a man read COWERING, or offered Challenge as one (contact.js's row on a man seen cowering), challenged once before a round)
      const cower = T?.live && (last.state?.[pick] === 'cowering' || steps.some(s => s.id === 'contact:challenge' && !s.off && s.target === pick && s.lead));
      if (cower && has('contact:challenge') && !(mem.challenged ?? []).includes(`cower:${pick}`)) { (mem.challenged ??= []).push(`cower:${pick}`); return choose('contact:challenge'); }
      const rows = steps.filter(isShotRow).filter(s => (s.target ?? pick) === pick);
      const open = T?.face === 'hostage' ? rows.find(s => !s.off && /head/.test(s.id)) : rows.find(s => !s.off);
      if (open) return choose(open.id, 'normal', pick);
      if (b?.mode === 'safe' && has('selector:semi')) return choose('selector:semi');
      if (S.aim?.key !== pick && has('aim')) return choose('aim', 'normal', pick);
      if (T?.face !== 'hostage' && has('fire')) return choose('fire', 'normal');
      if (T?.face === 'hostage') { const h = rows.find(s => /head/.test(s.id)); if (h && !h.off) return choose(h.id, 'normal', pick); }
    }
    // (v0.0.25, the Wreck: through the deck hatch on the coaming's hold (no grip), the shots done: boots onto the far face before anything
    // else, never a walk or an X off the hold in free fall)
    if (lane && wreckOf(state) && me.anchor === 'handhold' && onFaceOf(state, pid) === 'deck' && Number.isFinite(me.floatY) && !me.faceTo) {
      const f = aftDue(state) ? 'face:aft' : 'face:deckhead';
      if (has(f)) return choose(f);
    }
    // (v0.0.19, the live lane: a role-player taken in at this pause, down or with his hands up as you identified him, nobody covering
    // him (the scene's view: houseNow's covered, the instructor's out): his hands up, Challenge him once; then Cover him, the contact's
    // hold on him, once a man a pause, as a marine who knows a man down is still armed)
    const cov = last ? N.turners.find(T => T.live && !T.out && !T.covered && (T.down || mem.ident?.[T.key] === 'hands') && last.ids?.includes(T.key)) : null;
    if (cov && !(mem.covers ??= []).includes(`${last.id}:${cov.key}`)) {
      if (S.pick !== cov.key && targetOf(state, cov.key, pid)) return choose(`pick=${cov.key}`);
      if (S.pick === cov.key) {
        if (!cov.down && has('contact:challenge') && !(mem.challenged ?? []).includes(`${last.id}:${cov.key}`)) { (mem.challenged ??= []).push(`${last.id}:${cov.key}`); return choose('contact:challenge'); }
        mem.covers.push(`${last.id}:${cov.key}`);
        if (has('contact:hold')) return choose('contact:hold');
      } else mem.covers.push(`${last.id}:${cov.key}`);
    }
    // (a hot spot past a bend still unseen once in the room: walked toward by the keys (see the looks below))
    const farW = inside && plan ? (plan.hot ?? []).find(h => h.why === 'far leg' && !L.corners?.by?.[h.id] && !(mem.walked ?? []).includes(`${legI}:${h.id}`)) : null;
    if (farW && mode === 'keys' && (mem.looked?.[legI] ?? []).includes(farW.id)) {
      (mem.walked ??= []).push(`${legI}:${farW.id}`);
      mem.walk = { leg: legI, fromMs: now, path: farPathOf(plan, me, farW), k: 1, lineK: 1, untilCovered: farW.id, stopM: plan.far?.words ? 0 : 2.0 };
      return choose('leave');
    }
    // (the threats down: muzzle up before anything moves you or your eyes past your number two)
    if (last && !threats.length && posture(state) === 'aimed' && has('posture:highReady') && mem.upAfter !== last.id) { mem.upAfter = last.id; return choose('posture:highReady'); }
    // (a hand-back answered by its row (an inner door held, as the line says); a halted bundle carried on)
    const inner = row(s => s.id.startsWith('door:hold>'));
    if (inner && (inside || S?.carry?.why === 'door-unplanned')) return choose(inner.id);
    if (has('drill:carry') && mode === 'T') return choose('drill:carry');
    if (!L || !plan) return choose('leave');
    // (v0.0.25, the Wreck (one branch, the lane's `ship`): its face's rows as a player reads them, by the keys and by T alike: feet aft under
    // the tug's warning ("Feet aft", the deck's row), off the deckhead to the deck where the leg's door is on the deck, onto the far face
    // after a transit that left you on the coaming's hold; never a push-off)
    if (lane && wreckOf(state)) {
      const face = onFaceOf(state, pid);
      if (aftDue(state) && face === 'deckhead' && has('face:aft')) return choose('face:aft');
      // (by the keys, feet aft due and you booted on the deck: no transit, no face change, nothing that takes the boots off the deck
      // until the burn is complete; the wait (the review of C and D: the keys went through the trunk 4.25 s before the onset and hung
      // one-handed from the hold's coaming at it, "NOT FEET AFT" on the card once the onset judges it)
      if (mode === 'keys' && aftDue(state) && face === 'deck' && bootsLocked(state, pid)) { if (S.doing?.kind === 'wait') return {}; if (has('wait')) return choose('wait'); }
      if (face === 'deckhead' && !plan.hatch && !inside && has('face:deck')) return choose('face:deck');
    }
    const rung = rungOf(state, pid, 'room');
    // (by T: the bundle the line would run (the instinct's act where it offers a drill row, else the panel's lead bundle))
    if (mode === 'T' && rung >= 2) {
      const it = instinctNow(state), act = it.line?.act ?? '';
      const tAct = /^stop:drill:/.test(act) ? act.slice(5) : null;
      const lead = tAct && has(tAct) ? tAct : row(s => s.kind === 'bundle' && s.bundle && !s.struck && s.id.startsWith('drill:') && s.id !== 'drill:carry')?.id ?? null;
      if (lead) { mem.T = (mem.T ?? 0) + 1; return choose(lead); }
    }
    // ---- step by step (and by T where no bundle applies) ----
    // (v0.0.25: a deck hatch's leg (the Wreck's hold) has no door in the plane: its scuttle is the door the rows name)
    const door = plan.door ?? plan.hatch ?? null, opened = !door || L.state === 'open' || L.state === 'entered' || !steps.some(s => s.id.startsWith(`door:`) && s.id.endsWith(`>${door}`) && !s.id.startsWith('door:hold') && !s.id.startsWith('door:through'));
    // (v0.0.25: the Wreck's "Stack on the hatch", the void's single, where the house's is not offered)
    const stackRow = row(s => s.id.startsWith('drill:stack:up>')) ?? row(s => s.id.startsWith('drill:void:stack>'));
    // (v0.0.21, A's finding 3: a door found open at the fill (a drawn house) has its leg 'open' at GO, and the bot walked the room's
    // path from where it stood, in straight presses, into a wall (the keys private on drawn seeds 2, 3, 6 and 8: room 3 and the hall
    // passed on the stall); off its stack (OPEN_STACK_M), it stacks first, as at a shut door. On the set a leg turns 'open' only by
    // the bot's own hand at the stack, so no set lane moves)
    // (a door's leg only: the hall's is 'open' from GO and has its own walk, move:hallEnd)
    // (v0.0.21's integration: a door found open at the fill only (the drawn code's 'o', as the fill opens it: shoothouse.js
    // testShoothouse), never one the bot opened itself: a pull door opened from the stack leaves you more than OPEN_STACK_M off it
    // on the set too, and the bot went back to stack, the #2 cued late (the private by the keys on 1222, room 3 7.15 s on his heels;
    // house-heels and house-flawless-live's F25))
    const offStack = !!plan.door && !!plan.stack?.[0] && foundOpen(state, legI) && Math.hypot(me.x - plan.stack[0][0], me.z - plan.stack[0][1]) > OPEN_STACK_M;
    if ((L.state === 'ahead' || (L.state === 'open' && offStack)) && stackRow && !inside) return choose(stackRow.id);
    if (!opened) {
      // (v0.0.25: a hatch's dogs first, then its swing: a bulkhead hatch pushed or pulled, the deck hatch lifted ('door:hatch'))
      const d = row(s => /^door:undog>/.test(s.id)) ?? row(s => /^door:(push|pull|hatch)>/.test(s.id)) ?? row(s => s.id.startsWith('door:kick>'));
      if (d) return choose(d.id);
    }
    // (v0.0.25: the deck hatch open, through it head first (no walk in the plane goes through a deck))
    if (!inside && plan.hatch && has(`door:through>${plan.hatch}`)) return choose(`door:through>${plan.hatch}`);
    if (!inside && door && !plan.hatch) {
      // (Watch #1's corner before X, when the bot's player does)
      const c = cornerOf(plan, 1);
      if (watch && c && has(`watch:${c.id}`) && mem.watched !== `${legI}`) { mem.watched = `${legI}`; return choose(`watch:${c.id}`); }
      // (X and the keys in: the human's own start, then the plan's path to #1's point)
      mem.walk = { leg: legI, fromMs: now, path: (plan.paths?.[1] ?? [plan.stack[0], plan.points[0]]).map(p => [...p]), k: 1, lineK };
      return choose('leave');
    }
    if (!inside && !plan.door && !plan.hatch) {
      if (has('move:hallEnd') && Math.hypot(me.x - plan.points[0][0], me.z - plan.points[0][1]) > POINT_M) return choose('move:hallEnd');
    }
    // (a walk toward the far leg cut by a contact goes on once the shots are done, never back to the point first: a human keeps
    // going where he was going (2026-11-13, the rework's R8b: the far leg left unseen on 2 of 200 keys lanes))
    if (mode === 'keys' && mem.walk?.untilCovered && mem.walk.leg === legI && !L.corners?.by?.[mem.walk.untilCovered] && !(seen.armed.length || seen.unseen.length)) return choose('leave');
    // (v0.0.22 A: at a far walk's end in a room of its own, its hot spot still uncovered (the keys' four-way face 27 degrees off the back
    // room's middle on seed 2): one look more, from there, as the look before the walk)
    const farEnd = plan?.far?.words ? (plan.hot ?? []).find(h => h.id === plan.far.hot && !L.corners?.by?.[h.id] && (mem.walked ?? []).includes(`${legI}:${h.id}`)) : null;
    if (farEnd && inside && !mem.walk && has(`look:${farEnd.id}`) && !(mem.lookedEnd ??= []).includes(`${legI}:${farEnd.id}`)) { mem.lookedEnd.push(`${legI}:${farEnd.id}`); return choose(`look:${farEnd.id}`); }
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
      mem.walk = { leg: legI, fromMs: now, path: farPathOf(plan, me, far), k: 1, lineK: 1, untilCovered: far.id, stopM: plan.far?.words ? 0 : 2.0 };
      return choose('leave');
    }
    if (has('call:clear')) return choose('call:clear');
    return has('wait') && S.doing?.kind !== 'wait' ? choose('wait') : {};
  };
}

// (whether leg k's door was found open at the fill: a drawn house's code says so ('o'), the set never)
// (v0.0.25: whether the lane is the Wreck's: its operation record's `ship`)
const wreckOf = (state) => state.armoury?.range?.house?.ship === 'wreck';
// (v0.0.25: feet aft due, as a player reads the 1MC's count: the warning out with AFT_DUE_MS or less to the onset, time enough for the
// face's 1.5 s and a pause's work; earlier, the threats in front of you first (the honest bot shot the hold's men 1.5 s late, its feet aft
// the moment the warning sounded, the raider's 3b par missed on 48213))
const AFT_DUE_MS = 10_000;
const aftDue = (state) => bracePending(state) && (gravNow(state)?.leftMs ?? 0) <= AFT_DUE_MS;
const foundOpen = (state, k) => { const code = state.armoury?.range?.house?.draw?.code; return !!code && parseHouse(code)?.rooms?.[k]?.state === 'open'; };
// (whether the walker's circle goes straight from where he stands to a point, the walls as they stand: route.js clipped)
const straightTo = (state, me, p) => { const c = clipped(state, [me.x, me.z], p); return Math.hypot(c[0] - p[0], c[1] - p[1]) < 1e-3; };
// (a key or an act pressed, counted, at most every half second for G)
function press(mem, now, input) {
  if (input.act?.[0] === 'ready') { if (mem.gAtMs !== undefined && now - mem.gAtMs < 500) return {}; mem.gAtMs = now; }
  mem.presses++;
  return input;
}

// (v0.0.22 A: a far walk into a room of its own (the plan's far.words: the twin's back room, past an inner doorway) is walked by the
// plan's own path, through the doorway, to its end and 0.4 m on toward the far hot spot, so the eyes end on the room walked into (a
// straight press at the back room's middle runs into the wall between the rooms: the keys private and recruit on every eight-room
// lane with the twin, passed by the stall at 90 s); the ell's far leg, seen round its bend, is walked toward as before)
function farPathOf(plan, me, h) {
  if (!(plan?.far?.words && plan.far.hot === h.id)) return [[me.x, me.z], [h.x, h.z]];
  const end = plan.far.path.at(-1), d = Math.hypot(h.x - end[0], h.z - end[1]) || 1;
  return [[me.x, me.z], ...plan.far.path.slice(1).map(p => [...p]), [end[0] + (h.x - end[0]) * 0.4 / d, end[1] + (h.z - end[1]) * 0.4 / d]];
}

// (the walk in by the keys: nothing for the human's start, then toward each point of the path in turn; lineK > 1 runs the last leg long)
// (the search after room 1's "Clear!" on "Bang, then go" (see the header): out of stop motion and toward the man until within SEARCH_M less
// a margin, then into it and "Search him"; null where no search is offered or wanted, else an input or { step, target })
function searchStep(state, me, mem) {
  const H = state.armoury?.range?.house;
  if (!H?.bangGo?.offer || H.end) return null;
  const T = searchableOf(state, state.player.id, state.clock.ms, { reach: false }).find(t => !(mem.searchedKeys ?? []).includes(t.key));
  if (!T) return null;
  const a = state.actors.list.find(x => x.who === T.live.who) ?? T, S = state.stop;
  if (Math.hypot(a.x - me.x, a.z - me.z) > SEARCH_M - 0.3) {
    if (S) return S.doing ? {} : { step: 'leave', target: null };
    return pressToward(me, [a.x, a.z]);
  }
  if (!S) return { act: ['ready'] };
  if (S.doing) return {};
  const row = stepsOf(state).find(x => x.id === 'contact:search' && !x.off);
  if (!row) return null;
  (mem.searchedKeys ??= []).push(T.key);
  return { step: row.id, target: row.target ?? null };
}

function walk(state, me, mem, now, humanStartMs) {
  const w = mem.walk;
  if (now - w.fromMs < humanStartMs) return {};
  // (a walk toward a hot spot ends once it is covered, or stopM short of it)
  if (w.untilCovered) {
    const N = houseView(state), L = N?.legs?.[N.cur], h = w.path.at(-1);
    if (!L || L.corners?.by?.[w.untilCovered] || Math.hypot(me.x - h[0], me.z - h[1]) <= (w.stopM ?? 1)) { mem.walk = null; return { act: ['ready'] }; }
  }
  // (a point already passed is not walked back to (a human's eye: past it along the next leg), as when the game carried him on
  // through a doorway while the keys were not his (the rework's R8b: places/move.js throughOf))
  // (v0.0.21: and only where the walker can go straight on to the next (route.js clipped, its circle against the walls): on a drawn
  // house's room south of the hall, a cross entry's point down through the door and then west was skipped from just inside the
  // north wall's line, and the straight press to the next pinned him on the door's west jamb (the keys private on seed 2, room 3
  // passed at 90 s))
  while (w.k < w.path.length - 1) {
    const [ax, az] = w.path[w.k], [bx, bz] = w.path[w.k + 1];
    // (v0.0.21's integration: on a drawn house only, B's case; on the set the guard held the keys bot on a passed point in a doorway,
    // 51 funnel faults on house-flawless-keys' lanes (F4), where v0.0.20's walk skipped it)
    if ((me.x - ax) * (bx - ax) + (me.z - az) * (bz - az) > 0 && (!state.armoury?.range?.house?.draw || straightTo(state, me, w.path[w.k + 1]))) w.k += 1; else break;
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
    const N = houseView(state);
    if (!N || N.rangeEnd) { mem.done = true; return {}; }
    if (N.goAtMs === null || N.end) return calm(state, me, (mem.calm ??= {}));
    if (state.skip || contactNow(state)?.pending) return {};
    const S = state.stop, now = state.clock.ms, it = instinctNow(state), line = it.line;
    if (S?.reflex) return { act: [stepAct(`reflex:${S.reflex.why === 'click' ? 'ia' : 'look'}`)] };
    // (the line names the shot and leaves it to him (no act): the row it names on the bracketed man of his own corner)
    if (S?.mode === 'stop' && S.phase === 'choose' && namesShot(line)) {
      const T = N.turners.find(t => t.key === S.pick);
      if (T && !T.down && T.facingK >= 0.5 && (T.owner ?? T.slot ?? 1) === 1 && mem.shotAt !== now) {
        // (the line's Press on the one round left: the Fire row, the shot rows all struck "one left" (2026-11-11))
        const rows = stepsOf(state).filter(x => (isShotRow(x) || (line.variant === 'press' && x.id === 'fire')) && !x.off && (x.target ?? T.key) === T.key);
        const r = PAIR_LINES.has(line.id) ? rows[0] : rows.find(x => /head/.test(x.id)) ?? rows[0];
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
// (v0.0.26: and cqb-rp-dazed, "He's dazed. Now.", on "Bang, then go": a dazed man of yours, the pair it names, no act)
// (v0.0.27, "Away the boarding party" (its build sheet §1 D, §11 risk 14, §14 item 25): the round's act-less urgent lines, cqb-rp-blind
// "Firing blind. Get on him.", cqb-rp-flee "He's running. Hold." and cqb-passage "Nobody on the passage. Watch your back.": without them
// the honest and T bots read a line with no act and stall, as v0.0.26's T bots did on cqb-rp-dazed; each the pair on a man of yours up
// and facing, none on a man turned away or of your number two's (namesShot's and the shot's own guards))
export const SHOT_LINES = Object.freeze(new Set(['cqb-contact', 'cqb-still-up', 'cqb-hostage', 'cqb-rp-fire', 'cqb-rp-dazed', 'cqb-rp-blind', 'cqb-rp-flee', 'cqb-passage']));
// (the lines that name the pair: the contact's, and a role-player firing on you (v0.0.19, cqb-rp-fire); the others name the head)
const PAIR_LINES = new Set(['cqb-contact', 'cqb-rp-fire', 'cqb-rp-dazed', 'cqb-rp-blind', 'cqb-rp-flee', 'cqb-passage']);
// (v0.0.21, the review of A and B: the contact's line names a shot on the bracketed man only in its press, row and aim variants (each
// read off the man bracketed); 'his', 'move', 'hands' and 'safe' name none, and a line of theirs with no act is a gap of the game's,
// never a shot: the honest bot fired a pair at a no-shoot under "That one's his. Carry on." (act-less while the closet's question
// stood; the sergeant on drawn seed 10), an F8 fault that hid an F11 dead end)
const NAMES_SHOT = new Set(['press', 'row', 'aim']);
/** Whether a line with no act names a shot on the bracketed man (see above). */
export const namesShot = (line) => !!line && !line.act && SHOT_LINES.has(line.id) && (line.id !== 'cqb-contact' || NAMES_SHOT.has(line.variant));
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
    const N = houseView(state);
    if (!N || N.rangeEnd) { mem.done = true; return {}; }
    if (state.skip || contactNow(state)?.pending) return {};
    // (the live lane's casualty beat: nothing to press, every act refused, the lane's end 2 s on (men.js casualtyOn))
    if (N.live?.casualty && !N.end) return {};
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
      // (an answer shown struck (Transition "not carried", a man with no pistol: never the rank's from 2026-11-15) is not offered: the card's first)
      const opts = S.reflex.options, o = (answer !== null ? opts.find(x => x.key === answer && !x.off) : null) ?? opts[0];
      if (answer !== null && !opts.some(x => x.key === answer && !x.off)) { mem.notOffered ??= {}; mem.notOffered[answer] = (mem.notOffered[answer] ?? 0) + 1; }
      if (answer === null) dead(`reflex:${line?.id ?? 'no line'}`);
      (mem.cards ??= []).push({ atMs: now, keys: opts.map(x => x.key), chose: o.key });
      if (mem.cards.length > 20) mem.cards.splice(0, mem.cards.length - 20);
      return press(stepAct(`reflex:${o.key}`));
    }
    const choosing = S?.mode === 'stop' && S.phase === 'choose';
    // (the line names the shot and leaves it to him: the row it names on the bracketed man, his own)
    if (choosing && namesShot(line)) {
      const T = N.turners.find(t => t.key === S.pick), mine = T && (!N.two?.pid || (T.owner ?? T.slot ?? 1) === 1);
      if (T && !T.down && T.facingK >= 0.5 && mine && mem.shotAt !== now) {
        const rows = stepsOf(state).filter(x => (isShotRow(x) || x.id === 'fire') && !x.off && (x.target ?? T.key) === T.key);
        const named = line.variant === 'press' ? rows.find(x => x.id === 'fire')
          : PAIR_LINES.has(line.id) ? rows.find(x => /^shot:pair/.test(x.id)) ?? rows.find(isShotRow)
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
    const N = houseView(state);
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
    // (v0.0.19: never the team's orders (TEAM 2 to 4): its own fuzz presses them (tests/bots/team.mjs teamFuzzBot), so this one's dice stay v0.0.18's)
    // (v0.0.20: nor "Coming out!" by itself (bundle.js singleRows, item 12): offered in every cleared room, it would reshuffle every
    // fuzz lane's dice; the stack rows say it themselves)
    // (v0.0.25, the Wreck's void (its own dice, so no house lane's move): now and then a shot row offered on a man, whatever holds you,
    // so a round goes off floating once the dice have let the boots go (F126's fuzz half), and the boots let go more often than the
    // rows' weights would (Release your boots, then the keys push you off: the open middle's, F127's))
    if (wreckOf(state)) {
      const wd = (k) => hashInt(k, 'wreck-fuzz', seed, mem.wn = (mem.wn ?? 0) + 1);
      const shot = stepsOf(state).find(st => !st.off && isShotRow(st));
      if (shot && wd(4) === 0) { count('wreck:shot'); return { act: [stepAct(shot.id, 'normal', shot.target ?? null)] }; }
      const rel = stepsOf(state).find(st => !st.off && st.id === 'boots:release');
      if (rel && wd(12) === 0) { count('wreck:release'); return { act: [stepAct(rel.id)] }; }
    }
    const steps = stepsOf(state).filter(st => !st.off && !isShotRow(st) && !['fire', 'macro:ia', 'macro:remedial', 'call:clear', 'call:out'].includes(st.id) && !String(st.id).startsWith('reflex:') && !String(st.id).startsWith('drill:team:'));
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
/** The breach fuzz's hold after the bang (ms): 3 to 6 s by its seed (see the header). */
export const BREACH_FUZZ_LATE_MS = Object.freeze([3000, 6000]);
export function breachFuzzBot({ seed = 1 } = {}) {
  const late = BREACH_FUZZ_LATE_MS[0] + hashInt(BREACH_FUZZ_LATE_MS[1] - BREACH_FUZZ_LATE_MS[0] + 1, 'breach-fuzz-late', seed);
  const inner = houseFuzzBot({ seed });
  // (the approach and the late entry: the kit bot by its sheet's walk, imported late so kit.mjs, which imports this file, is whole)
  let approach = null;
  return (state, me, mem) => {
    const H = state.armoury?.range?.house, L = H?.rooms?.[0], S = state.stop, now = state.clock.ms;
    mem.late ??= late;
    if (H && H.goAtMs !== null && !H.end && L && L.enteredAtMs === null) {
      approach ??= KIT.houseKitBot({ use: 'flash', base: rungOf(state, state.player.id, 'room') >= 2 ? 'T' : 'keys', late });
      return approach(state, me, (mem.approach ??= {}));
    }
    if (H && H.goAtMs !== null && !H.end && S?.mode === 'stop' && S.phase === 'choose' && !S.reflex && !S.doing) {
      const die = (k) => hashInt(k, 'breach-fuzz', seed, mem.bn = (mem.bn ?? 0) + 1), rows = stepsOf(state).filter(x => !x.off);
      const hands = (H.live ? state.armoury.range.turners : []).filter(T => T.live?.st === 'hands' && !T.live.give);
      const search = rows.find(x => x.id === 'contact:search');
      if (search && die(2) === 0) { mem.searched = (mem.searched ?? 0) + 1; return { act: [stepAct(search.id, 'normal', search.target ?? null)] }; }
      const shot = !mem.handsShot ? rows.find(x => isShotRow(x) && hands.some(T => T.key === (x.target ?? S.pick))) : null;
      if (shot) { mem.handsShot = now; return { act: [stepAct(shot.id, 'normal', shot.target ?? null)] }; }
    }
    const r = inner(state, me, mem);
    // (never a challenge: the fuzz's choice of it taken back, the time left to run)
    if (r?.act?.some(a => a?.args?.step === 'contact:challenge')) { mem.noChallenge = (mem.noChallenge ?? 0) + 1; return {}; }
    return r;
  };
}

export function runHouse(game, bot, { maxMs = 30 * 60_000, maxTicks = Math.round(maxMs / TICK_MS) * 2, each = null } = {}) {
  const s0 = game.state.clock.ms;
  let ticks = 0;
  // (v0.0.21: the range's end read where it is, not through houseNow, which built every leg's view a tick to say it)
  while (!game.state.armoury?.range?.end && game.state.clock.ms - s0 < maxMs && ticks < maxTicks) {
    game.step(1, bot);
    each?.(game);
    game.clearFacts?.();
    ticks++;
  }
  const me = game.state.actors.list.find(a => a.who === game.state.player.id);
  return { ticks, ms: game.state.clock.ms - s0, done: !!game.state.armoury?.range?.end, mem: me?.bot ?? {} };
}
export { TICK_MS };
