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
// (the stop). Its memory (me.bot) is plain data: the decisions it made ({ atMs, step, tempo, target,
// cmd }), so it saves and loads with the game.
import { rangeNow } from '../../src/sim/scenarios/handling.js';
import { stepsOf } from '../../src/sim/arms/shooting.js';
import { beliefOf } from '../../src/sim/arms/firearms.js';
import { stepAct } from './lib.mjs';

/** A decision's modelled real time: a player reads the panel and presses a key (my call, the sheet's THINK_S). */
export const THINK_S = 6;

/** The range bot (see the header). */
export function rangeBot({ faulty = false } = {}) {
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
