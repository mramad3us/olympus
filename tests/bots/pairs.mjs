// OLYMPUS bots: the pairs bot, a shooter who drives test-pairs by its actions to the score card, and its fuzz bot (the build sheet 0.0.8 §2.3, §5.3).
//
// pairsBot() is a bot for tests/game.mjs (state, me, mem) → input: it reads only what the player sees (the coach's
// command as heard and the scene's view: pairs.js pairsNow; the take-in's record once paused: contact.js contactNow's
// last, what the marine identified; the weapon card: firearms.js beliefOf; the step panel: shooting.js stepsOf; the
// reflex card; its own stance, posture and place) and presses what a player presses: G to bring the rifle up, X to
// leave the mode (the panel's 'leave'), the move keys to walk back to the 10 m line (the muzzle held downrange: the
// line's strafe), one step at a time as the hud sends it (lib.mjs stepAct), only while time stands still for a choice
// (or to cut a chained wait). Its plan by the coach's command:
//   LOAD, MAKE READY               the command's macro; then low ready, on safe, out of the mode (X)
//   Standby                        out of the mode, still, waiting for the turn
//   the pause (a turn taken in)    the threats it identified, nearest the muzzle first, never one identified with
//                                  empty hands or a phone (it brackets another); 'unseen' is challenged first; the
//                                  first shot row the panel offers unstruck (Pair, the failure drill, To the head after
//                                  "still up": the panel's order), "off safe first" and "aim first" done as their singles,
//                                  Fire where no row is open (the recruit's gates); dry with rounds left, RELOAD
//   the string over, Stop          on safe, low ready, out of the mode
//   Back to the ten                out of the mode, the keys to its 10 m point
//   the short one                  Top up with the named magazine (the row that reaches for its pouch; else by the
//                                  singles: the magazine to a pouch, the reach for the short one's pouch, seated)
//   Lull                           Top up when the magazine in is believed at half or less and a fuller one is at hand
//   UNLOAD, SHOW CLEAR             the macro, the coach looking into the chamber
// A stoppage felt or seen: "Tap, rack" on the card, then IMMEDIATE ACTION, or REMEDIAL ACTION on a double feed. A fumble
// put right first (the fixer's, 0.0.8, after the runtime review's recruit seeds that hung): the rifle swung onto its
// sling, "Rifle up"; the magazine out of the rifle (a Top up's dropped magazine), the rest of the drill ("Carry on"), else
// LOAD, else seated from the hand, else the reach for the fullest pouch. It throws on a decision repeated a hundred times
// with the clock standing still (a stall, said at once, never a test that hangs). Its memory (me.bot) is plain data, so it
// saves and loads with the game; mem.log keeps each decision ({ atMs, step, cmd }).
//
// pairsFuzzBot({ seed }) hunts the scene's dead ends (the build sheet §5.3): random legal steps (the shot rows and the
// contact's weigh more), aims at the no-shoot, never reloading (odd seeds), idling out of the mode for a random while,
// entering the mode in the standby, walking off the point now and then; its dice are hashes of its seed and its count
// of decisions (mem.n). Every run must reach the card (the user, 2026-11-07: "a scene never dead-ends").
import { pairsNow, HALF_N } from '../../src/sim/scenarios/pairs.js';
import { stepsOf } from '../../src/sim/arms/shooting.js';
import { beliefOf } from '../../src/sim/arms/firearms.js';
import { pouchesOf, believedN } from '../../src/sim/arms/kit.js';
import { contactNow } from '../../src/sim/combat/contact.js';
import { stepAct, pressToward } from './lib.mjs';
import { hashInt } from '../../src/core/hash.js';

/** Within this of the 10 m point the bot stands (m): inside its box with room. */
export const POINT_M = 0.12;
/** A decision repeated this many times with the clock still is a stall: the bot throws. */
export const STALL_N = 100;
// (the most rounds a pouch's magazines are believed to hold, for the reach (a pouch key from its step id 'reach@p2'))
const bestIn = (state, pid, id) => Math.max(-1, ...(pouchesOf(state, pid).find(p => p.key === id.slice(6))?.mags ?? []).map(m => believedN(state.items[m]) ?? 0));
const NOSHOOT = new Set(['hands', 'phone']);
const isShotRow = (st) => st.kind === 'shot' || String(st.id).startsWith('shot:');

// (what a decent shooter reads off the panel and the picture: the threats still facing in the string, nearest the muzzle first)
function threatsOf(state, P, me) {
  const last = contactNow(state)?.last ?? null, ident = last?.ident ?? {};
  const keys = new Set(P.str?.keys ?? []);
  return P.turners.filter(T => keys.has(T.key) && T.facingK >= 0.5 && !T.down && !NOSHOOT.has(ident[T.key]))
    .sort((a, b) => Math.abs(a.z - me.z) - Math.abs(b.z - me.z) || a.lane - b.lane);
}
const posture = (state) => state.people[state.player.id]?.kit?.carry?.posture ?? 'slungFront';

/** The pairs bot (see the header). */
export function pairsBot() {
  return (state, me, mem) => {
    mem.log ??= [];
    const P = pairsNow(state);
    if (!P || P.end) { mem.done = true; return {}; }
    if (state.skip || contactNow(state)?.pending) return {};
    const S = state.stop, pid = state.player.id, gunId = state.people[pid]?.kit?.worn?.sling, gun = state.items[gunId];
    const b = beliefOf(state, gunId), cmd = P.cmd, str = P.str;
    const choose = (step, tempo = 'normal', target = null) => {
      // (a stall: the same decision with the clock still, again and again)
      const key = `${state.clock.ms}|${step}|${target ?? ''}`;
      mem.same = mem.lastKey === key ? (mem.same ?? 0) + 1 : 0; mem.lastKey = key;
      if (mem.same >= STALL_N) throw new Error(`pairs bot: '${step}' chosen ${STALL_N} times at ${state.clock.ms} with the clock still (cmd ${cmd}; offered ${stepsOf(state).filter(x => !x.off).map(x => x.id).join(', ')})`);
      mem.log.push({ atMs: state.clock.ms, step, cmd }); if (mem.log.length > 400) mem.log.splice(0, mem.log.length - 400);
      return { act: [stepAct(step, tempo, target)] };
    };
    const live = !!str && str.turned && !str.done;
    const shortIn = gun?.mag === P.mags.short;
    const magN = b.mag === 'in' && Number.isFinite(b.count) ? b.count : null;
    const fuller = pouchesOf(state, pid).flatMap(p => p.mags).some(id => (believedN(state.items[id]) ?? 0) > (magN ?? 0));
    // (Top up between strings, the magazine in believed at half or less and a fuller one at hand: the lull's habit)
    const between = !!cmd && !['brief', 'load', 'ready', 'short', 'clear', 'end'].includes(cmd) && !live && !shortIn;
    const wantTopUp = between && magN !== null && magN <= HALF_N && fuller && b.chamber === 'live' && mem.noTopUp !== P.cmdI;
    const wantShort = cmd === 'short' && !shortIn && !!state.items[P.mags.short];
    // (in the mode for: the commands' macros, a reload, the safe and the low ready the coach wants before X)
    const finger = state.people[pid]?.kit?.carry?.finger ?? 'off';
    // (nothing left to load, as the bot believes it: the card's count 0 and every pouch believed empty)
    const none = (b.count === 0 || b.mag !== 'in') && b.chamber !== 'live' && !pouchesOf(state, pid).some(p => p.mags.some(id => (believedN(state.items[id]) ?? 1) > 0));
    const settled = b.mode === 'safe' && finger !== 'on' && (none || (posture(state) === 'lowReady' && b.chamber === 'live' && b.mag === 'in' && !b.locked));
    const wantMode = (cmd === 'load' && b.mag !== 'in') || cmd === 'clear' || wantShort || wantTopUp
      || (['ready', 'stop', 'move10', 'short', 'lull', 'standby'].includes(cmd) && !live && !settled);
    if (!S) {
      if (!cmd || cmd === 'brief' || cmd === 'end') return {};
      if (wantMode) {
        if (mem.gAtMs !== undefined && state.clock.ms - mem.gAtMs < 500) return {};
        mem.gAtMs = state.clock.ms;
        mem.log.push({ atMs: state.clock.ms, step: 'G', cmd });
        return { act: ['ready'] };
      }
      // (back to the 10 m point: the keys, the muzzle held downrange by the line's strafe)
      if (P.line === 10 && P.point && Math.hypot(me.x - P.point.fp.x, me.z - P.point.fp.z) > POINT_M) return pressToward(me, [P.point.fp.x, P.point.fp.z]);
      return {};
    }
    if (S.reflex) return choose(`reflex:${S.reflex.why === 'click' ? 'ia' : 'look'}`);
    if (S.mode !== 'stop') return {};
    // (a step under way: nothing; a chained wait is cut by the next choice)
    if (S.phase !== 'choose' && S.doing?.kind !== 'wait') return {};
    const steps = stepsOf(state), has = (id) => steps.some(s => s.id === id && !s.off), row = (id) => steps.find(s => s.id === id) ?? null;
    if (b.stoppage === 'double' && has('macro:remedial')) return choose('macro:remedial');
    if (b.stoppage && has('macro:ia')) return choose('macro:ia');
    // (a fumble put right first (see the header): the rifle up off its sling; the magazine back in)
    if (['slungFront', 'slungBack'].includes(posture(state)) && has('up') && cmd !== 'clear') return choose('up');
    if (b.mag === 'out' && !['clear', 'load', 'brief', 'end'].includes(cmd) && !(cmd === 'short' && wantShort)) {
      const reachP = steps.filter(x => /^reach@p\d$/.test(x.id) && !x.off).sort((a, z) => (bestIn(state, pid, z.id) - bestIn(state, pid, a.id)))[0];
      const fixMag = ['queue', 'macro:load', 'seat'].find(has) ?? reachP?.id ?? (has('reach@ground') ? 'reach@ground' : null);
      if (fixMag) return choose(fixMag);
    }
    // (the rifle back in Condition 1 whenever it is not, by what the panel offers: RELOAD on the empty, the bolt home on a
    // fresh magazine, MAKE READY on an empty chamber)
    const fix = () => {
      if (b.mag !== 'in' || cmd === 'clear' || cmd === 'load' || cmd === 'brief') return null;
      if (b.locked && b.count === 0) return ['macro:reload:speed', 'macro:reload:retain'].find(has) ?? null;
      if (b.locked && has('release')) return 'release';
      if (b.chamber === 'empty' && has('macro:ready')) return 'macro:ready';
      // (not sure what is in the chamber (a discharge, a fumble): a press check tells)
      if (b.chamber === '?' && has('pressCheck')) return 'pressCheck';
      return null;
    };
    if (live) {
      const threats = threatsOf(state, P, me), last = contactNow(state)?.last ?? null;
      if (!last || last.seenMs < (str.turnAtMs ?? 0)) return S.doing?.kind === 'wait' ? {} : has('wait') ? choose('wait') : {};
      // (dry with rounds left: RELOAD first, as the panel offers it; the bolt home, a round chambered)
      const f = fix();
      if (f) return choose(f);
      if (!threats.length) return has('wait') && S.doing?.kind !== 'wait' ? choose('wait') : {};
      const want = threats[0].key;
      if (S.pick !== want && !threats.some(t => t.key === S.pick)) return choose(`pick=${want}`);
      const pick = S.pick;
      // (hands not seen: Challenge first, as the panel leads with it)
      if (last.ident?.[pick] === 'unseen' && has('contact:challenge') && !(mem.challenged ?? []).includes(`${last.id}:${pick}`)) { (mem.challenged ??= []).push(`${last.id}:${pick}`); return choose('contact:challenge'); }
      const rows = steps.filter(isShotRow).filter(s => (s.target ?? pick) === pick);
      const open = rows.find(s => !s.off);
      if (open) return choose(open.id, 'normal', pick);
      const first = rows[0];
      if (first?.off === 'off safe first' || (b.mode === 'safe' && has('selector:semi'))) return choose('selector:semi');
      if (S.aim?.key !== pick) return choose('aim', 'normal', pick);
      if (has('fire')) return choose('fire', 'normal');
      return has('wait') ? choose('wait') : {};
    }
    // (a chained wait after a command answered: nothing until the next, but the walk out of the mode the coach wants)
    const waiting = S.doing?.kind === 'wait';
    if (waiting && (cmd === 'load' || cmd === 'clear' || cmd === 'brief')) return {};
    switch (cmd) {
      case 'load': if (b.mag !== 'in' && has('macro:load')) return choose('macro:load'); break;
      case 'ready': if (b.chamber !== 'live' && has('macro:ready')) return choose('macro:ready'); break;
      case 'short': {
        if (!wantShort) break;
        const key = pouchesOf(state, pid).find(p => p.mags.includes(P.mags.short))?.key;
        const top = row('macro:reload:tactical');
        if (top && !top.off && (top.subs ?? []).some(x => x.id === `reach@${key}`)) return choose('macro:reload:tactical');
        // (by the singles: the magazine in to a pouch, the reach for the short one's, seated)
        if (b.mag === 'in' && has('magOut:pouch')) return choose('magOut:pouch');
        if (key && has(`reach@${key}`)) return choose(`reach@${key}`);
        if (has('seat')) return choose('seat');
        break;
      }
      default: break;
    }
    const f = fix();
    if (f && !(waiting && f === 'macro:ready' && cmd === 'ready')) return choose(f);
    if (wantTopUp && has('macro:reload:tactical')) return choose('macro:reload:tactical');
    // (no Top up in the panel now (a magazine believed empty: the drills offer none): not asked again at this command)
    if (wantTopUp) mem.noTopUp = P.cmdI;
    switch (cmd) {
      case 'clear': if (has('macro:clear')) return choose('macro:clear'); return has('wait') && S.doing?.kind !== 'wait' ? choose('wait') : {};
      default: break;
    }
    // (the coach wants low ready, on safe, the finger off, out of it: CEASE FIRE's two singles in one)
    if ((b.mode !== 'safe' || finger === 'on') && has('macro:cease')) return choose('macro:cease');
    if (b.mode !== 'safe' && has('selector:safe')) return choose('selector:safe');
    if (finger === 'on' && has('finger')) return choose('finger');
    if (posture(state) !== 'lowReady' && has('posture:lowReady')) return choose('posture:lowReady');
    if (cmd === 'load' || cmd === 'brief') return has('wait') && S.doing?.kind !== 'wait' ? choose('wait') : {};
    return choose('leave');
  };
}

/** The fuzz shooter's weights against 1 for every other step (my calls): a shot row, the contact's rows, the aim, X. */
export const PAIRS_FUZZ_W = Object.freeze({ shot: 10, contact: 3, aim: 3, leave: 4, cmd: 3 });
/** The longest it stands out of the mode before it presses G, or walks (ms of game time). */
export const PAIRS_FUZZ_OUT_MS = 20_000;
/** The fuzz bot (see the header). */
export function pairsFuzzBot({ seed = 1 } = {}) {
  return (state, me, mem) => {
    mem.n ??= 0; mem.steps ??= {};
    const P = pairsNow(state);
    if (!P || P.end) { mem.done = true; return {}; }
    if (state.skip || contactNow(state)?.pending) return {};
    const S = state.stop, now = state.clock.ms, die = (k) => hashInt(k, 'pairs-fuzz', seed, mem.n++);
    const count = (id) => { mem.steps[id] = (mem.steps[id] ?? 0) + 1; };
    const noReload = seed % 2 === 1;
    if (!S) {
      // (a walk now and then: off the point, or back to it)
      // (a walk off the point and back the same way: out of the box a while, never long enough to stop the line)
      if (mem.walk) {
        if (now >= mem.walk.untilMs) {
          if (mem.walk.back) { delete mem.walk; return {}; }
          mem.walk = { untilMs: now + (mem.walk.untilMs - mem.walk.fromMs), fromMs: now, mx: -mem.walk.mx, mz: -mem.walk.mz, back: true };
        }
        return { mx: mem.walk.mx, mz: mem.walk.mz };
      }
      if (mem.outUntil === undefined) mem.outUntil = now + die(PAIRS_FUZZ_OUT_MS);
      if (now < mem.outUntil) return {};
      delete mem.outUntil;
      if (die(8) === 0) { count('walk'); mem.walk = { fromMs: now, untilMs: now + 200 + die(2000), mx: die(3) - 1, mz: die(3) - 1, back: false }; return {}; }
      count('G');
      return { act: ['ready'] };
    }
    if (S.reflex) { const o = S.reflex.options[die(S.reflex.options.length)]; count(`reflex:${o.key}`); return { act: [{ act: 'stop', args: { step: `reflex:${o.key}`, tempo: 'normal', keep: die(2) === 1 } }] }; }
    if (S.mode !== 'stop') return {};
    if (S.phase !== 'choose' && !(S.doing?.kind === 'wait' && die(10) === 0)) return {};
    const steps = stepsOf(state).filter(st => !st.off && !(noReload && /reload/.test(st.id)) && !(st.kind === 'aim' && st.target && !String(st.target).startsWith('turner:')) && !(st.kind === 'fire' && !P.hot));
    // (the brackets moved now and then, onto any turner: the no-shoot among them)
    if (P.turners.length && die(6) === 0) { const t = P.turners[die(P.turners.length)]; count('pick'); return { act: [stepAct(`pick=${t.key}`, 'normal', null)] }; }
    if (!steps.length) return {};
    const w = steps.map(x => (isShotRow(x) ? PAIRS_FUZZ_W.shot : String(x.id).startsWith('contact:') ? PAIRS_FUZZ_W.contact : x.kind === 'aim' ? PAIRS_FUZZ_W.aim : x.id === 'leave' ? PAIRS_FUZZ_W.leave : x.cmd ? PAIRS_FUZZ_W.cmd : 1));
    let roll = die(w.reduce((a, c) => a + c, 0)), k = 0;
    while (roll >= w[k]) roll -= w[k++];
    const st = steps[k];
    const tempos = ['normal', ...(Number.isFinite(st.rushMs) ? ['rushed'] : []), ...(Number.isFinite(st.carefulMs) ? ['careful'] : [])];
    count(st.id);
    return { act: [stepAct(st.id, tempos[die(tempos.length)], st.target ?? null)] };
  };
}
