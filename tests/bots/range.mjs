// OLYMPUS bots: the range bot, a shooter who drives test-handling's 25 m line by the keys, as a player would (the 0.0.5 build sheet §5.2's scene-handling).
//
// rangeBot({ faulty }) is a bot for tests/game.mjs (state, me, mem) → input: it reads only what the
// player sees (the tower's command as heard: handling.js rangeNow's cmd; the weapon card: firearms.js
// beliefOf; the step panel: shooting.js stepsOf; the reflex card; its own stance and aim) and presses
// only what a player presses: G to bring the rifle up, then one step at a time as the hud sends it
// (lib.mjs stepAct: { act: 'stop', args: { step, tempo, target } }), only while time stands still for a
// choice. Its plan, by the tower's command:
//   brief, a command done        wait (the panel's Wait, or nothing while the chained wait runs)
//   prone                         stance:prone
//   LOAD, MAKE READY              the command's macro
//   commence fire                 aim at its own card, off safe, then hold and fire (Fire held: the
//                                 hold to +4, then the pull), until the bolt locks back
//   CEASE FIRE                    the macro (finger off, safe)
//   kneeling / standing, RELOAD   the stance, then RELOAD keeping the empty (the dump pouch)
//   UNLOAD, SHOW CLEAR            the macro, the coach looking into the chamber
// A stoppage felt or seen: a click is answered "Tap, rack" on the card, a shot that did not cycle
// "Look at the port"; then IMMEDIATE ACTION, or REMEDIAL ACTION once a double feed is seen. faulty: the
// careless shooter of the build sheet: MAKE READY before the tower (a warning), then an aim at the coach
// (the stop). early: n (0.0.6, the user's run of 2026-11-07: "I shoot two prone, two kneeling and when I have to
// shoot standing, I don't have any mags left"; their save: four fired, the magazine changed, six more): in the
// first string, after n shots, the magazine changed by the singles (to the dump pouch, a reach, a magazine in: the
// seat's row marked "one magazine a string", its warn kept in mem.marked), then fire on. Its memory (me.bot) is plain data: the decisions it made ({ atMs, step, tempo, target,
// cmd }), so it saves and loads with the game.
//
// fuzzBot({ seed }) (0.0.6, the user's 2026-11-07: "when I have to shoot standing, I don't have any mags left"):
// a shooter who presses random legal keys, hunting the scene's dead ends. Out of the mode it stands a while
// (up to FUZZ_OUT_MS) and presses G; on a reflex card it answers at random (keeping the answer half the time);
// choosing, it takes any step the panel offers unstruck, at a random tempo where the step has one, and cuts the
// chained wait now and then (Fire, the tower's marked command, the aim and Off safe on a hot line weigh more:
// FUZZ_W); it never aims at
// anything but its own card nor fires on a cold line (the range's own
// stops, not dead ends, which the careless shooter above already pins). Its dice are hashes of its seed and its
// count of decisions (mem.n), so it saves and loads with the game; mem.log counts the steps it took.
import { rangeNow } from '../../src/sim/scenarios/handling.js';
import { stepsOf } from '../../src/sim/arms/shooting.js';
import { beliefOf } from '../../src/sim/arms/firearms.js';
import { stepAct } from './lib.mjs';
import { hashInt } from '../../src/core/hash.js';

/** A decision's modelled real time: a player reads the panel and presses a key (my call, the sheet's THINK_S). */
export const THINK_S = 6;

/** The range bot (see the header). */
export function rangeBot({ faulty = false, early = null } = {}) {
  return (state, me, mem) => {
    mem.log ??= [];
    const R = rangeNow(state);
    if (!R || R.end) { mem.done = true; return {}; }
    const S = state.stop, pid = state.player.id, gunId = state.people[pid]?.kit?.worn?.sling;
    const choose = (step, tempo = 'normal', target = null) => { mem.log.push({ atMs: state.clock.ms, step, tempo, target, cmd: R.cmd }); return { act: [stepAct(step, tempo, target)] }; };
    if (!S) {
      if (!R.cmd || R.cmd === 'brief' || mem.gAtMs !== undefined) return {};
      mem.gAtMs = state.clock.ms;
      mem.log.push({ atMs: state.clock.ms, step: 'G', tempo: 'normal', target: null, cmd: R.cmd });
      return { act: ['ready'] };
    }
    if (S.reflex) return choose(`reflex:${S.reflex.why === 'click' ? 'ia' : 'look'}`);
    if (S.mode !== 'stop') return {};
    const b = beliefOf(state, gunId), own = `paper:${R.lane}`, stance = me.stance ?? 'stand';
    // (the careless shooter: ahead of the tower, cutting the chained wait to do it, then the coach in the sights)
    if (faulty && (S.phase === 'choose' || S.doing?.kind === 'wait')) {
      if (R.cmd === 'load' && b.mag === 'in' && !mem.ahead) { mem.ahead = true; return choose('macro:ready'); }
      if (mem.ahead && !mem.coach && S.phase === 'choose') { mem.coach = true; const coach = state.actors.list.find(a => a.who === R.observerId); return choose('aim', 'normal', coach?.id ?? null); }
    }
    // (a step playing, the chained wait too: nothing)
    if (S.phase !== 'choose') return {};
    const steps = stepsOf(state), has = (id) => steps.some(s => s.id === id && !s.off);
    // (a stoppage: clear it by its steps)
    if (b.stoppage === 'double' && has('macro:remedial')) return choose('macro:remedial');
    if (b.stoppage && has('macro:ia')) return choose('macro:ia');
    switch (R.cmd) {
      case 'prone': if (stance !== 'prone' && has('stance:prone')) return choose('stance:prone'); break;
      case 'load': if (has('macro:load')) return choose('macro:load'); break;
      case 'ready': if (has('macro:ready')) return choose('macro:ready'); break;
      case 'fire': {
        // (the user's run: a magazine changed partway through the first string)
        if (early !== null && R.string === 0 && (mem.early ?? 0) < 3 && R.strings[0].shots >= early) {
          const want = ['magOut:dump', 'reach', 'seat'][mem.early ?? 0], st = steps.find(x => !x.off && (want === 'reach' ? x.id.startsWith('reach@p') : x.id === want));
          if (st) { mem.early = (mem.early ?? 0) + 1; if (want === 'seat') mem.marked = st.warn ?? null; return choose(st.id); }
        }
        if (b.locked && b.count === 0) break;
        if (S.aim?.key !== own) return choose('aim', 'normal', own);
        if (b.mode === 'safe' && has('selector:semi')) return choose('selector:semi');
        if (has('fire')) return choose('fire', 'careful');
        break;
      }
      case 'cease': if (has('macro:cease')) return choose('macro:cease'); break;
      case 'kneel': case 'stand': {
        const want = R.cmd === 'kneel' ? 'kneel' : 'stand';
        if (stance !== want && has(`stance:${want}`)) return choose(`stance:${want}`);
        if (b.locked && b.count === 0 && has('macro:reload:retain')) return choose('macro:reload:retain');
        if (b.locked && b.count === 0 && has('macro:reload:speed')) return choose('macro:reload:speed');
        break;
      }
      case 'clear': if (has('macro:clear')) return choose('macro:clear'); break;
      default: break;
    }
    if (has('wait') && (mem.waitAtMs ?? -1) !== state.clock.ms) { mem.waitAtMs = state.clock.ms; return choose('wait'); }
    return {};
  };
}

/** The longest a fuzz shooter stands out of the mode before it presses G (ms of game time). */
export const FUZZ_OUT_MS = 20_000;
/** The fuzz shooter's weights: Fire, the tower's marked command, and the aim (and Off safe on a hot line) against 1 for every other step (my calls). */
export const FUZZ_W = Object.freeze({ fire: 12, cmd: 4, aim: 4 });
/** The fuzz bot (see the header). */
export function fuzzBot({ seed = 1 } = {}) {
  return (state, me, mem) => {
    mem.n ??= 0; mem.steps ??= {};
    const R = rangeNow(state);
    if (!R || R.end) { mem.done = true; return {}; }
    const S = state.stop, now = state.clock.ms, die = (k) => hashInt(k, 'fuzz', seed, mem.n++);
    const choose = (step, tempo = 'normal', target = null) => { mem.steps[step] = (mem.steps[step] ?? 0) + 1; return { act: [stepAct(step, tempo, target)] }; };
    if (!S) {
      if (mem.outUntil === undefined) mem.outUntil = now + die(FUZZ_OUT_MS);
      if (now < mem.outUntil) return {};
      delete mem.outUntil;
      mem.steps.G = (mem.steps.G ?? 0) + 1;
      return { act: ['ready'] };
    }
    if (S.reflex) { const o = S.reflex.options[die(S.reflex.options.length)]; mem.steps[`reflex:${o.key}`] = (mem.steps[`reflex:${o.key}`] ?? 0) + 1; return { act: [{ act: 'stop', args: { step: `reflex:${o.key}`, tempo: 'normal', keep: die(2) === 1 } }] }; }
    if (S.mode !== 'stop') return {};
    if (S.phase !== 'choose' && !(S.doing?.kind === 'wait' && die(10) === 0)) return {};
    const own = `paper:${R.lane}`;
    const steps = stepsOf(state).filter(st => !st.off && !(st.kind === 'fire' && !R.hot) && !(st.kind === 'aim' && st.target && st.target !== own));
    if (!steps.length) return {};
    // (every legal step can come up; the tower's marked command, Fire and the aim at its own card weigh more, so its
    // strings are fired often enough to run its magazines dry)
    const w = steps.map(x => (x.kind === 'fire' ? FUZZ_W.fire : x.cmd ? FUZZ_W.cmd : x.kind === 'aim' || (R.hot && x.id === 'selector:semi') ? FUZZ_W.aim : 1));
    let roll = die(w.reduce((a, b) => a + b, 0)), k = 0;
    while (roll >= w[k]) roll -= w[k++];
    const st = steps[k];
    const tempos = ['normal', ...(Number.isFinite(st.rushMs) ? ['rushed'] : []), ...(Number.isFinite(st.carefulMs) ? ['careful'] : [])];
    return choose(st.id, tempos[die(tempos.length)], st.kind === 'aim' ? own : null);
  };
}
