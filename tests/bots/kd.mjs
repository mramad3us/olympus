// OLYMPUS bots: the KD bot, a shooter who drives test-range's course by its actions to the score card, and its fuzz bot (the build sheet 0.0.7 §2.3, §5.3).
//
// kdBot() is a bot for tests/game.mjs (state, me, mem) → input: it reads only what the player sees (the tower's
// command as heard and the scene's view: range.js kdNow; the weapon card: firearms.js beliefOf; the step panel:
// shooting.js stepsOf; the reflex card; its own stance and aim) and presses what a player presses: G to bring the
// rifle up, one step at a time as the hud sends it (lib.mjs stepAct), only while time stands still for a choice,
// and the range's own actions (kd:police, kd:turnIn, kd:declare, the domain's 'kd'). Its plan by the command:
//   prone, sit                     the stance (sitting by its own row), then LOAD at "sit"
//   LOAD, MAKE READY, RELOAD       the command's macro (RELOAD keeping nothing: the speed reload)
//   commence fire                  aim at its own card or face; on a KD line the coach's hold (hold:call);
//                                  off safe; then hold and fire (Fire held: the hold to +4) until the bolt locks
//                                  back, the second magazine seated in the 200 m string (the speed reload);
//                                  in slow fire the wait for its mark (wait:mark) before each next pull
//   CEASE FIRE                     the macro
//   read your groups               wait; "make your corrections": the coach's call dialled (sight:call)
//   optics to four power, dope     optic:4, sight:dope:<line>
//   UNLOAD, SHOW CLEAR             the macro, the coach looking into the chamber
//   police, turn in, declare       kd:police, kd:turnIn, kd:declare
//   the walks                      nothing: the splash carries it
// A stoppage felt or seen (the coach's dummy among them): "Tap, rack" on the card, then IMMEDIATE ACTION, or
// REMEDIAL ACTION on a double feed. Its memory (me.bot) is plain data, so it saves and loads with the game.
//
// fuzzBot({ seed }) hunts the scene's dead ends: random legal steps and range actions (Fire, the tower's marked
// command, the aim at its own target and the range actions weigh more: KD_FUZZ_W), never aiming at anything but
// its own target nor firing on a cold line (the range's stops are not dead ends); its dice hashes of its seed
// and its count of decisions (mem.n). Each run must reach the card: never a dead end (the user, 2026-11-07).
import { kdNow, kdActs } from '../../src/sim/scenarios/range.js';
import { stepsOf } from '../../src/sim/arms/shooting.js';
import { beliefOf } from '../../src/sim/arms/firearms.js';
import { stepAct } from './lib.mjs';
import { hashInt } from '../../src/core/hash.js';

const act = (id) => ({ act: [`kd:${id}`] });

/** The KD bot (see the header). */
export function kdBot() {
  return (state, me, mem) => {
    mem.n ??= 0;
    const K = kdNow(state);
    if (!K || K.end) { mem.done = true; return {}; }
    if (state.skip || state.time?.doing) return {};
    const S = state.stop, pid = state.player.id, gunId = state.people[pid]?.kit?.worn?.sling;
    const choose = (step, tempo = 'normal', target = null) => { mem.n++; mem.last = { atMs: state.clock.ms, step, cmd: K.cmd }; return { act: [stepAct(step, tempo, target)] }; };
    // (the range's own actions, in or out of the mode)
    const acts = kdActs(state);
    if (acts.length && (!S || S.phase === 'choose' || S.doing?.kind === 'wait') && (mem.actAt ?? -1) !== state.clock.ms) { mem.actAt = state.clock.ms; mem.n++; return act(acts[0].id.slice(3)); }
    if (!S) {
      if (!K.cmd || ['brief', 'walk', 'pits', 'police', 'turnIn', 'declare', 'group'].includes(K.cmd) || K.ready === 'always') return {};
      if (mem.gAtMs !== undefined && state.clock.ms - mem.gAtMs < 1000) return {};
      mem.gAtMs = state.clock.ms;
      return { act: ['ready'] };
    }
    if (S.reflex) return choose(`reflex:${S.reflex.why === 'click' ? 'ia' : 'look'}`);
    if (S.mode !== 'stop' || S.phase !== 'choose') return {};
    const b = beliefOf(state, gunId), stance = me.stance ?? 'stand';
    const steps = stepsOf(state), has = (id) => steps.some(s => s.id === id && !s.off);
    if (b.stoppage === 'double' && has('macro:remedial')) return choose('macro:remedial');
    if (b.stoppage && has('macro:ia')) return choose('macro:ia');
    const own = K.line === 25 ? `paper:${K.lane}` : `face:${K.kdLane}`;
    switch (K.cmd) {
      case 'prone': if (stance !== 'prone' && has('stance:prone')) return choose('stance:prone'); break;
      case 'sit': if (stance !== 'sit' && has('stance:sit')) return choose('stance:sit'); if (has('macro:load')) return choose('macro:load'); break;
      case 'load': if (has('macro:load')) return choose('macro:load'); break;
      case 'ready': if (has('macro:ready')) return choose('macro:ready'); break;
      case 'reload':
        if (b.locked && b.count === 0 && has('macro:reload:speed')) return choose('macro:reload:speed');
        if (has('macro:load')) return choose('macro:load');
        if (has('macro:ready')) return choose('macro:ready');
        break;
      case 'fire': {
        if (b.locked && b.count === 0) {
          if (K.stage === 's200' && has('macro:reload:speed')) return choose('macro:reload:speed');
          break;
        }
        if (S.aim?.key !== own) return choose('aim', 'normal', own);
        if (K.line !== 25 && has('hold:call') && mem.heldFor !== K.call?.atMs) { mem.heldFor = K.call?.atMs; return choose('hold:call'); }
        if (b.mode === 'safe' && has('selector:semi')) return choose('selector:semi');
        if (has('sight:call') && K.stage === 'confirm') return choose('sight:call');
        // (slow fire: the next pull after the mark, as a shooter on the line waits for the disk)
        if (has('wait:mark')) return choose('wait:mark');
        if (has('fire')) return choose('fire', 'careful');
        break;
      }
      case 'cease': if (has('macro:cease')) return choose('macro:cease'); break;
      case 'dial': if (has('sight:call')) return choose('sight:call'); break;
      case 'optic': if (has('optic:4')) return choose('optic:4'); break;
      case 'dope': if (has(`sight:dope:${K.line}`)) return choose(`sight:dope:${K.line}`); break;
      case 'clear': if (has('macro:clear')) return choose('macro:clear'); break;
      default: break;
    }
    if (has('wait') && (mem.waitAtMs ?? -1) !== state.clock.ms) { mem.waitAtMs = state.clock.ms; return choose('wait'); }
    return {};
  };
}

/** The longest the fuzz shooter stands out of the mode before it presses G (ms of game time). */
export const KD_FUZZ_OUT_MS = 20_000;
/** The fuzz shooter's weights against 1 for every other step (my calls). */
export const KD_FUZZ_W = Object.freeze({ fire: 12, cmd: 4, aim: 4, act: 6 });
/** The fuzz bot (see the header). */
export function kdFuzzBot({ seed = 1 } = {}) {
  return (state, me, mem) => {
    mem.n ??= 0; mem.steps ??= {};
    const K = kdNow(state);
    if (!K || K.end) { mem.done = true; return {}; }
    if (state.skip || state.time?.doing) return {};
    const S = state.stop, now = state.clock.ms, die = (k) => hashInt(k, 'kd-fuzz', seed, mem.n++);
    const count = (id) => { mem.steps[id] = (mem.steps[id] ?? 0) + 1; };
    const acts = kdActs(state);
    if (acts.length && die(KD_FUZZ_W.act + 2) < KD_FUZZ_W.act && (!S || S.phase === 'choose')) { count(acts[0].id); return { act: [acts[0].id] }; }
    if (!S) {
      if (mem.outUntil === undefined) mem.outUntil = now + die(KD_FUZZ_OUT_MS);
      if (now < mem.outUntil) return {};
      delete mem.outUntil;
      count('G');
      return { act: ['ready'] };
    }
    if (S.reflex) { const o = S.reflex.options[die(S.reflex.options.length)]; count(`reflex:${o.key}`); return { act: [{ act: 'stop', args: { step: `reflex:${o.key}`, tempo: 'normal', keep: die(2) === 1 } }] }; }
    if (S.mode !== 'stop') return {};
    if (S.phase !== 'choose' && !(S.doing?.kind === 'wait' && die(10) === 0)) return {};
    const own = K.line === 25 ? `paper:${K.lane}` : `face:${K.kdLane}`;
    const steps = stepsOf(state).filter(st => !st.off && st.id !== 'leave' && !(st.kind === 'fire' && !K.hot) && !(st.kind === 'aim' && st.target && st.target !== own));
    if (!steps.length) return {};
    const w = steps.map(x => (x.kind === 'fire' ? KD_FUZZ_W.fire : x.cmd ? KD_FUZZ_W.cmd : x.kind === 'aim' || (K.hot && x.id === 'selector:semi') ? KD_FUZZ_W.aim : 1));
    let roll = die(w.reduce((a, c) => a + c, 0)), k = 0;
    while (roll >= w[k]) roll -= w[k++];
    const st = steps[k];
    const tempos = ['normal', ...(Number.isFinite(st.rushMs) ? ['rushed'] : []), ...(Number.isFinite(st.carefulMs) ? ['careful'] : [])];
    count(st.id);
    return { act: [stepAct(st.id, tempos[die(tempos.length)], st.kind === 'aim' ? own : null)] };
  };
}
