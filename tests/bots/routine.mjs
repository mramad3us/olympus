// OLYMPUS bots: the routine's primitives and drivers, a marine's evening and night played as the player plays them (the build sheet 0.0.4 §5.2; TECH §13.2).
//
// Built on tests/bots/lib.mjs's toolkit (goTo, plan, waitUntil, runBot), so a driver is a plan of
// primitives, each pressing only what a player can press and keeping its memory as plain data on the
// player's actor (me.bot), so a save carries the routine on. The primitives:
//   press(act)           an action pressed once ('hand', { act: 'instinct', args }, a debug key)
//   hand(want, more)     R as the page sends it: { act: 'hand', args: { want, ... } } for the offer
//                        handOffer names now (want 'activity', 'rise', 'door', 'resume', 'wait'), and
//                        nothing if the offer is not of that kind (fails 'no-offer'); an activity's
//                        with lead, as the page's (a sleep from the rack's foot: you lie down in
//                        sight first, then it begins)
//   instinctT(chip)      T as the page sends it: the instinct's line shown now ({ act: 'instinct', args:
//                        { id, act } }, or the chip's with chip), failing 'no-act' when it offers nothing
//   until(pred, ms)      lib's waitUntil, named for the timelines
//   choose(id, args)     R held and a digit: an activity from the offer's choices ({ act: 'hand', args:
//                        { want, id, args, late } })
//   heedLine()           walk where the instinct's line (or its chip) sends you (HEED_SPOTS: Head A's
//                        fixtures, the mail room's machine) and T there: the DI's scripted morning
//   pause(ms)            stand still for ms of game time
// and the drivers the moments run:
//   showerRoutine({ stall })   to Head A's stall from the rack's foot, R at it: the shower skipped
//                              behind its splash (the game runs the outcome skip to its end at once)
//   nightRoutine()             R at the rack's foot (sleep until reveille), then on the klaxon T (up)
//                              and T (utilities at the rack), and wait for the count
//   dawdleRoutine({ stall })   the same night, but at the klaxon up, out to the showers and R there:
//                              the late card's "do it anyway", then back to the rack, dressed, late
import { goTo, plan, waitUntil } from './lib.mjs';
import { handOffer } from '../../src/sim/places/hand.js';
import { instinctNow } from '../../src/sim/skills/instinct.js';

/** An action pressed once: done on the tick after. */
export function press(act, name = null) {
  return {
    name: name ?? `press ${typeof act === 'string' ? act : act.act}`,
    start() { return { pressed: false }; },
    step(state, me, m) {
      if (m.pressed) return { done: true };
      m.pressed = true;
      return { input: { act: [act] } };
    },
  };
}

/** R as the page sends it, for the offer of a kind (see the header). */
export function hand(want, more = {}) {
  return {
    name: `R ${want}${more.id ? ` ${more.id}` : ''}${more.late ? ` (${more.late})` : ''}`,
    start() { return { pressed: false }; },
    step(state, me, m) {
      if (m.pressed) return { done: true };
      const o = handOffer(state);
      const kind = { open: 'door', close: 'door' }[o?.verb] ?? o?.verb;
      if (!o || kind !== want) return { fail: `no-offer (${o?.verb ?? 'none'})` };
      m.pressed = true; m.label = o.label;
      // (the page sends an activity's R with lead: a sleep from the rack's foot lies you down in sight first)
      return { input: { act: [{ act: 'hand', args: { want, ...(want === 'activity' ? { lead: true } : {}), ...more } }] } };
    },
  };
}

/** R held and a choice: the activity id with its args from the offer's choices, late as the late card answers. */
export const choose = (id, args = {}, late = null) => hand('activity', { id, args, ...(late ? { late } : {}) });

/** T as the page sends it: the line's act (or the chip's), failing when it offers none. */
export function instinctT(chip = false) {
  return {
    name: chip ? 'T held (the chip)' : 'T',
    start() { return { pressed: false }; },
    step(state, me, m) {
      if (m.pressed) return { done: true };
      const it = instinctNow(state), l = chip ? it.chip : it.line;
      if (!l?.act) return { fail: `no-act (${l?.id ?? 'no line'})` };
      m.pressed = true; m.id = l.id; m.act = l.act; m.text = l.text;
      return { input: { act: [{ act: 'instinct', args: { id: l.id, act: l.act, ...(chip ? { chip: true } : {}) } }] } };
    },
  };
}

/** Where the DI's lines send you in Head A this round: a rule id → the spot whose activity T then does. */
export const HEED_SPOTS = Object.freeze({
  'need-bladder': 'f:e1:head-2a:urinal-1#1', 'need-bowel': 'f:e1:head-2a:stall-1#1', 'need-thirst': 'f:e1:head-2a:sinks-1#3',
  'need-dirt': 'f:e1:head-2a:shower-1#1', stubble: 'f:e1:head-2a:sinks-1#2', 'need-hunger': 'f:e1:mail:vending-1#1',
});

/**
 * Heed the line: walk where the instinct's line (or its chip, when the line names no place this knows)
 * sends you, then T there once its act names the fixture's activity, and wait for it to be done. Done
 * at once when neither names a need; fails when the walk does or T never offers the act.
 */
export function heedLine({ spots = HEED_SPOTS } = {}) {
  return {
    name: 'heed the line',
    start(state) {
      const it = instinctNow(state), l = [it.line, it.chip].find(x => x && spots[x.id]) ?? null;
      return { id: l?.id ?? null, spot: l ? spots[l.id] : null, walk: null, phase: l ? 'walk' : 'done', waited: 0 };
    },
    step(state, me, m) {
      if (m.phase === 'done') return { done: true };
      if (m.phase === 'walk') {
        const prim = goTo(m.spot);
        m.walk ??= prim.start(state, me);
        const r = prim.step(state, me, m.walk);
        if (r.input) return r;
        if (r.fail) return { fail: `to ${m.spot}: ${r.fail}` };
        m.phase = 'T';
      }
      if (m.phase === 'T') {
        const it = instinctNow(state), l = [it.line, it.chip].find(x => x?.id === m.id && x.act?.startsWith('activity:'));
        if (!l) { if (++m.waited > 20 * 10) return { fail: `T never offered ${m.id} at ${m.spot}` }; return { input: {} }; }
        m.phase = 'busy'; m.act = l.act;
        return { input: { act: [{ act: 'instinct', args: { id: l.id, act: l.act, ...(l === it.chip ? { chip: true } : {}) } }] } };
      }
      if (state.skip || state.time?.doing) return { input: {} };
      return { done: true };
    },
  };
}

/** Stand still for ms of game time. */
export function pause(ms) {
  return {
    name: `pause ${ms / 1000} s`,
    start(state) { return { untilMs: state.clock.ms + ms }; },
    step(state, me, m) { return state.clock.ms >= m.untilMs ? { done: true } : { input: {} }; },
  };
}

/** Wait until pred(state), or fail 'timeout' after ms of game time. */
export const until = (pred, ms, name = 'until') => ({ ...waitUntil(pred, ms), name });

/** The shower stall the moment uses (Head A's second, free at 19:30). */
export const STALL = 'f:e1:head-2a:shower-2#1';
/** The player's rack's foot in 1st Squad's bay (the lower berth of rack n1). */
export const RACK_FOOT = 'f:e1:bay-2-1:rack-n1#1';
const drillOpen = (s) => !!s.time?.drills?.open;
const standing = (s) => { const me = s.actors.list.find(a => a.id === s.player.actor); return (me?.posture ?? 'stand') === 'stand' && !(me?.trans && s.clock.ms < me.trans.fromMs + me.trans.ms); };

/** The shower: out of the bay to the stall, R at it (see the header). */
export function showerRoutine({ stall = STALL } = {}) {
  return plan([goTo(stall), hand('activity')]);
}

/** The night: R at the rack, then T, T at the klaxon, and the count (see the header). */
export function nightRoutine() {
  return plan([
    hand('activity'),                                                       // (sleep until reveille)
    until(drillOpen, 12 * 3_600_000, 'the klaxon'),
    until((s) => !!instinctNow(s).line?.act, 30_000, 'the line'),
    instinctT(),                                                            // (up)
    until((s) => standing(s) && instinctNow(s).line?.act === 'dress:utilities', 30_000, 'standing'),
    instinctT(),                                                            // (utilities, at the rack)
    until((s) => (s.time.attend ?? []).length > 0, 15 * 60_000, 'mustered'),
    until((s) => !drillOpen(s), 40 * 60_000, 'the stand-down'),
  ]);
}

/** The dawdle: the klaxon, up, to the showers and a shower anyway, back, dressed (see the header). */
export function dawdleRoutine({ stall = STALL } = {}) {
  return plan([
    hand('activity'),
    until(drillOpen, 12 * 3_600_000, 'the klaxon'),
    until((s) => !!instinctNow(s).line?.act, 30_000, 'the line'),
    instinctT(),
    until(standing, 30_000, 'standing'),
    goTo(stall),
    choose('shower', {}, 'accepted'),                                       // (the late card: "do it anyway")
    goTo(RACK_FOOT),
    hand('activity', { id: 'dress', args: { to: 'utilities' } }),
    until((s) => (s.time.attend ?? []).length > 0, 15 * 60_000, 'mustered'),
  ]);
}
