// OLYMPUS bots: the stress bot, a shooter who drives test-stress ("Bang") by its actions to the score card, and its fuzz bot (the build sheet 0.0.10 §2.2, §5.2).
//
// stressBot() is the pairs bot (tests/bots/pairs.mjs: the course runs on test-pairs' engine, so the coach's commands, the
// take-in, the rows, the RELOAD on the empty, the short magazine and the lull are the same) with one habit more: Breathe
// where the DI offers it. It reads the DI's rules as they fire (instinct.js firedNow) and, when stress-breathe fires, presses T
// for it ({ act: 'instinct', args: { id, act } }), at most once in OFFER_AGAIN_MS of its own (saved) memory, as the DI offers it
// once a minute (it fires only with felt 20 or more and nothing facing him, out of the mode as a live step that keeps the turn
// armed, or in it by its digit). And in the mode with the bolt locked
// back, no RELOAD and no bolt release in the panel (on a string or between them; not at UNLOAD, SHOW CLEAR: a count lost
// or miscounted, or the full magazines at his feet, where the panel's RELOAD wants a count of 0 and one in a pouch) it drops
// the magazine, as pairs-reload's "Empty. Drop it." says, the pairs bot getting
// a fresh one in after (its fumble's path: the reach, at his feet too, the seat, the bolt home); and for the press check
// the pairs bot asks of a bolt locked back, which the hands refuse with the clock still, the bolt home or the magazine out. Options for the dead-end
// hunt (stress-nodead): breathe false (never), noFire (on the live string the panel's Wait, never a shot), noReload (no
// RELOAD, keep the empty or Top up while string 5 runs: Wait, then X), ignoreShort (the coach's one-round magazine never put in: X out of the mode at his "short").
//
// stressFuzzBot({ seed }) hunts the scene's dead ends (the sheet's §5.2): the stress bot between strings (so the coach's
// standbys come: the fuzz alone rarely stands ready long enough for one), Breathing on one seed in four, and the pairs fuzz
// bot from each string's noise or turn to its end (random legal steps, the mode entered and left, walks off the point,
// idling, never reloading on odd seeds; keys mashed through every startle), with Breathe spammed out of the mode on even
// seeds (the action 'breathe' pressed now and then, refused or not) and the mode entered in the armed standby before and
// after the noise by its dice. Its dice are hashes of its seed and a count (mem.n). Its
// memory is plain data on the actor (me.bot), so it saves and loads with the game.
import { pairsBot, pairsFuzzBot } from './pairs.mjs';
import { stepAct } from './lib.mjs';
import { stepsOf } from '../../src/sim/arms/shooting.js';
import { instinctNow, firedNow } from '../../src/sim/skills/instinct.js';
import { OFFER_AGAIN_MS } from '../../src/sim/skills/instinct/pairs.js';
import { hashInt } from '../../src/core/hash.js';
import { RELOAD_STRING } from '../../src/sim/scenarios/stress.js';

const isShot = (a) => typeof a === 'object' && /^(shot:|fire$)/.test(a?.args?.step ?? '');
const isReload = (a) => typeof a === 'object' && /^macro:reload:/.test(a?.args?.step ?? '');
// (the DI's readiness lines the bot heeds when the pairs bot would wait, and how long it waits idle first (ms))
const DI_READY = new Set(['pairs-ready', 'pairs-cmd', 'pairs-short']), DI_IDLE_MS = 4000;
const choosing = (state) => state.stop?.mode === 'stop' && (state.stop.phase === 'choose' || state.stop.doing?.kind === 'wait');

/** The stress bot (see the header). */
export function stressBot({ breathe = true, noFire = false, noReload = false, ignoreShort = false } = {}) {
  const base = pairsBot();
  return (state, me, mem) => {
    const R = state.armoury?.range, s = R?.str;
    mem.breathed ??= 0;
    // (Breathe where the DI offers it: its line or its chip, once a line (see the header))
    // (the rule as it fires (firedNow), gated by the bot's own once a minute, not by the line shown: the DI's memory of the lines
    // gone is the page's (state.$instinct, never saved), so a bot reading it pressed T again after a load where the straight run
    // did not (the fixer's of 0.0.10, as the din's later turn put a save inside that minute))
    if (breathe && R?.stress && !state.skip && state.clock.ms - (mem.breathedAtMs ?? -Infinity) >= OFFER_AGAIN_MS) {
      const l = firedNow(state).find(x => x.id === 'stress-breathe' && x.act);
      if (l) { mem.breathedAtMs = state.clock.ms; mem.breathed += 1; return { act: [{ act: 'instinct', args: { id: l.id, act: l.act } }] }; }
    }
    const live = !!s && !s.done && s.turnedMs !== null;
    // (the bolt locked back with no RELOAD in the panel (see the header): the magazine dropped)
    const S = state.stop, gun = state.items?.[state.people?.[state.player?.id]?.kit?.worn?.sling], b = gun?.belief ?? {};
    if (!(noReload && live) && S?.mode === 'stop' && S.phase === 'choose' && !S.reflex && b.locked && gun.mag && R?.cmd?.id !== 'clear') {
      const steps = stepsOf(state), has = (id) => steps.some(x => x.id === id && !x.off);
      if (!has('macro:reload:speed') && !has('macro:reload:retain') && !has('release') && has('magOut:drop')) return { act: [stepAct('magOut:drop', 'normal', null)] };
    }
    // (a press check the hands refused with the clock still ("The bolt is back: look in instead": the belief still unsure of
    // the chamber, so the pairs bot asks it again): the bolt home (its release, else Charge), else the magazine out and the
    // pairs bot's path after (seen on the recruit, seed 2024, after a negligent discharge))
    const last = mem.base?.log?.at(-1);
    const refused = last?.step === 'pressCheck' && last.atMs === state.clock.ms && S?.mode === 'stop' && S.phase === 'choose';
    const out = refused ? null : base(state, me, (mem.base ??= {}));
    const a = out?.act?.[0];
    if (refused) {
      const alt = ['release', 'charge', 'magOut:drop'].find(id => stepsOf(state).some(x => x.id === id && !x.off));
      if (alt) return { act: [stepAct(alt, 'normal', null)] };
      return base(state, me, mem.base);
    }
    // (the DI heeded where the pairs bot would leave the line waiting (a belief the truth does not match: a round believed
    // up the coach sees is not, after a fumble): in the mode its readiness line's step for X, out of it its G after 4 s idle)
    const di = instinctNow(state).line, ready = di && DI_READY.has(di.id) && di.act && !live;
    if (!live && S?.mode === 'stop' && S.phase === 'choose' && a?.args?.step === 'leave') {
      // (in the mode the rule read now: the line settles on the next due tick)
      const l = firedNow(state).find(x => DI_READY.has(x.id) && x.act?.startsWith('stop:') && x.act !== 'stop:enter');
      // (its step chosen as the panel's key would, by its row; T does the same since v0.0.10's stepOfAct fix, which read
      // 'stop:reach@ground' as the step 'reach' at the tempo 'ground' before)
      if (l) { const m = /^stop:([^>]*?)(?:@(normal|rushed|careful))?(?:>(.*))?$/.exec(l.act); return { act: [stepAct(m[1], m[2] ?? 'normal', m[3] ?? null)] }; }
    }
    if (ready && !state.stop && !a && di.act === 'stop:enter') {
      mem.idleAt ??= state.clock.ms;
      if (state.clock.ms - mem.idleAt >= DI_IDLE_MS) { mem.idleAt = state.clock.ms; return { act: [{ act: 'instinct', args: { id: di.id, act: di.act } }] }; }
    } else delete mem.idleAt;
    // (the hunt's wrong ways: never a shot, no reload on string 5, the short one ignored: the panel's Wait, or X)
    const hold = () => (choosing(state) ? { act: [stepAct(state.stop.doing?.kind === 'wait' ? 'leave' : 'wait', 'normal', null)] } : {});
    if (noFire && live && isShot(a)) return hold();
    if (noReload && live && s.k === RELOAD_STRING && isReload(a)) return hold();
    if (ignoreShort && R?.cmd?.id === 'short' && R.wantMag) {
      if (a === 'ready') return {};
      if (state.stop?.mode === 'stop' && state.stop.phase === 'choose') return { act: [stepAct('leave', 'normal', null)] };
    }
    return out;
  };
}

/** The fuzz shooter on test-stress (see the header). */
export function stressFuzzBot({ seed = 1 } = {}) {
  const fuzz = pairsFuzzBot({ seed }), calm = stressBot({ breathe: seed % 4 === 1 });
  return (state, me, mem) => {
    mem.n ??= 0; mem.spam ??= 0; mem.g ??= 0;
    const R = state.armoury?.range, s = R?.str, die = (k) => hashInt(k, 'stress-fuzz', seed, mem.n++);
    if (!R || R.end) return fuzz(state, me, (mem.fuzz ??= {}));
    // (Breathe spammed out of the mode on even seeds: pressed now and then whatever the offer)
    if (seed % 2 === 0 && !state.stop && die(12) === 0) { mem.spam += 1; return { act: ['breathe'] }; }
    // (in an armed standby, out of the mode: G by the dice, before or after the noise)
    const armed = !!s && !s.done && s.turnedMs === null && s.turnAtMs !== null;
    if (armed && !state.stop && mem.g < 3 && die(60) === 0) { mem.g += 1; return { act: ['ready'] }; }
    // (the fuzz from the string's noise or its turn to its end; the calm shooter between strings, so the coach's standbys come)
    const noisy = !!s && !s.done && (s.turnedMs !== null || (R.stress?.plan ?? []).some(e => e.k === s.k && (e.done || e.on)));
    return noisy ? fuzz(state, me, (mem.fuzz ??= {})) : calm(state, me, (mem.calm ??= {}));
  };
}
