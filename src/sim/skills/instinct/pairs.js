// OLYMPUS sim: the drill instructor's rules on test-pairs' bay, what to do next between the turns and at the pause (SKILLS §14; COMBAT §25.8.3's lines that fit a range; the build sheet 0.0.8 §2.3).
//
// The DI's voice in your head, as on the tower's line (instinct/range.js): dry, second person, one idea; the coach is a
// person beside you who gives the commands and reads his timer (src/sim/scenarios/pairs.js), so these say what the
// training says. Each rule is SKILLS §14.2's { id, voice: 'di', tone, short, when(state, me, ms) → ctx | null, text,
// act(ctx) → string | null, reach: null }; when() reads only what the character knows: the coach's command as heard,
// the rifle as believed (firearms.js beliefOf), the finger and the posture as felt, the take-in's record once paused
// (contact.js contactNow's last: what he identified, never the face's truth), the turners as seen (facing, down), the
// panel. All are silent while a take-in's window is open (instinct.js gives none then: the window's silence, COMBAT
// §25.4.5), T is never the shot ("T aims and goes off safe but never takes the shot", v0.0.5's; COMBAT §25.2), and an act
// is offered only when its step is in the panel now. The act at the pause goes by the drills' rung (templates.js rungOf,
// COMBAT §25.8.1): below rung 2 Off safe is its own step and comes first, from rung 2 the row's aim takes the safe off.
// Most pressing first within a tone:
//   pairs-still-up   urgent  "He's still up" (specials.js stillUp: a torso round rang on a plate, or two in the torso, and
//                            he stands): aim at him if not aimed ("He's still up. Head."); listed first, so at the steel's
//                            ring this is the line, not pairs-contact's "press" (the design review of v0.0.8)
//   pairs-contact    urgent  at the pause, the bracketed a threat still up: the rifle up if it is slung (a fumble), "Back
//                            on your point first" off it (no act), off safe (below rung 2, nothing fired at him yet), aim
//                            at him, then "Press." with no act (the shot is the player's); one torso hit and still
//                            standing: "Again. Chest." (no act); the bracketed down and another threat he identified still
//                            up: its lane named, no act (T never picks a target: the brackets are the player's, COMBAT §25.2)
//   pairs-live-out   urgent  out of stop motion with a threat of the string facing and standing (X at the pause): "He's
//                            still there. G, and take him." (enter the mode)
//   pairs-noshoot    warn    the bracketed identified with empty hands or a phone: Hold him ("Hands. No weapon. Don't.")
//                            when he is the last one up; with a threat he identified still up, "Not him", that one named,
//                            no act (the design review: Hold him for 2.35 s with two rifles up was the wrong drill)
//   pairs-unknown    warn    the bracketed not identified ("Can't see his hands."): Challenge
//   pairs-reload     warn    the bolt believed locked on an empty with rounds left: RELOAD
//   pairs-short      warn    the coach's short magazine named and not in: Top up with it
//   pairs-cmd        warn    the coach's LOAD, MAKE READY or UNLOAD, SHOW CLEAR not done yet: its macro (out of the mode,
//                            the rifle up first); the range's own range-cmd keeps quiet on this course (instinct.js)
//   pairs-reset      warn    the string done and you in stop motion: on safe, then X
//   pairs-ready      warn    a standby to come and the line not ready: what is lacking (pairs.js pairsWant): a magazine
//                            in, a round up, on safe, low ready, X out, back on the point (out of the mode with work to
//                            do in it: G first)
//   pairs-topup      note    a lull (contact.js lullOf), the magazine believed at half or less, a fuller one at hand: Top up
//   pairs-wait       calm    the turn armed: nothing ("Wait for it.")
// Pure.
import { playerId } from '../../../core/ids.js';
import { beliefOf } from '../../arms/firearms.js';
import { stepsOf, gunOn } from '../../arms/shooting.js';
import { pouchesOf, believedN } from '../../arms/kit.js';
import { rangeOf, lineReady, roundsLeft } from '../../scenarios/handling.js';
import { HALF_N, pairsWant, onPoint } from '../../scenarios/pairs.js';
import { stillUp } from '../../arms/specials.js';
import { SEQ_PAIRS } from '../../../data/courses.js';
import { facingOf, turnerKey } from '../../arms/turners.js';
import { contactNow, lullOf } from '../../combat/contact.js';
import { rungOf } from '../templates.js';

/** The pairs rules may speak again as soon as they fire again (the range's rule: each turn new advice). */
export const PAIRS_REPEAT_MS = 0;
const NOSHOOT = new Set(['hands', 'phone']);
const LANE_WORD = Object.freeze(['', 'lane one', 'lane two', 'lane three', 'lane four', 'lane five', 'lane six']);
const HOLD_WORD = Object.freeze({ rifle: 'Rifle', pistol: 'Pistol' });
// (the commands whose readiness is the shooter's own: low ready, on safe, out of it)
const READY_CMDS = new Set(['ready', 'stop', 'move10', 'short', 'lull']);

// (what the character knows on the bay now, kept for the tick and the step, as instinct/range.js keeps its own)
let memo = { state: null, key: null, v: null };
function know(state, me, ms) {
  const S0 = state.stop, R = rangeOf(state);
  const L0 = contactNow(state, ms)?.last ?? null;
  const c0 = state.people?.[playerId(state)]?.kit?.carry, me0 = state.actors?.list?.find(a => a.id === state.player?.actor);
  const key = `${ms}|${state.clock.tick ?? ''}|${c0?.posture ?? ''}|${c0?.finger ?? ''}|${me0 ? `${me0.x}|${me0.z}` : ''}|${S0 ? `${S0.mode}|${S0.phase}|${S0.doing?.step ?? ''}|${S0.doing?.i ?? ''}|${S0.pick ?? ''}|${S0.aim?.key ?? ''}` : ''}|${R?.cmd?.i ?? ''}|${R?.str?.done ?? ''}|${L0 ? `${L0.id}|${JSON.stringify(L0.ident ?? null)}` : ''}`;
  if (memo.state === state && memo.key === key) return memo.v;
  let v = null;
  if (R && R.course === 'pairs' && !R.end) {
    const pid = playerId(state), gunId = gunOn(state, pid), carry = state.people[pid]?.kit?.carry ?? {};
    const b = gunId ? beliefOf(state, gunId) : null, S = state.stop;
    const choosing = S?.mode === 'stop' && (S.phase === 'choose' || S.doing?.kind === 'wait');
    const steps = choosing ? stepsOf(state, ms) : [];
    const offered = (id) => steps.find(s => s.id === id && !s.off) ?? null;
    const str = R.str, live = !!str && str.turnedMs !== null && !str.done;
    const last = contactNow(state, ms)?.last ?? null;
    const pick = S?.pick ?? null, T = pick ? (R.turners ?? []).find(t => t.key === pick) ?? null : null;
    const atPause = live && !!last && last.seenMs >= str.turnedMs && S?.mode === 'stop';
    const firedAt = atPause && pick ? str.shots.some(x => x.key === pick && x.atMs >= last.atMs) : false;
    // (the threats of the string facing and standing, as seen: none he identified as a no-shoot)
    const up = live ? str.keys.map(key => (R.turners ?? []).find(t => t.key === key)).filter(t => t && facingOf(t, ms) >= 0.5 && t.stoppedAtMs === null && !NOSHOOT.has(last?.ident?.[t.key])) : [];
    v = { R, pid, gunId, b, S, up, posture: carry.posture ?? 'slungFront', finger: carry.finger ?? 'off', inMode: S?.mode === 'stop', choosing, busy: !!S?.doing && S.doing.kind !== 'wait',
      steps, offered, cmd: R.cmd?.id ?? null, live, str, last, pick, T, facing: T ? facingOf(T, ms) : 0, atPause, firedAt, ident: last?.ident?.[pick] ?? null,
      rung: rungOf(state, pid, 'room'), own: turnerKey(R.lane), lane: T?.lane ?? null, want: pairsWant(state) };
  }
  memo = { state, key, v };
  return v;
}
const actIf = (k, step, target = null) => (k.choosing && k.offered(step) ? `stop:${step}${target ? `>${target}` : ''}` : null);
const reloadRow = (k) => k.steps.find(s => /^macro:reload:(speed|retain)$/.test(s.id) && !s.off) ?? null;
const topUpRow = (k) => k.steps.find(s => s.id === 'macro:reload:tactical' && !s.off) ?? null;
// (the bracketed one still standing and facing: a decision to make about him)
const standing = (k) => !!k.T && k.facing >= 0.5 && k.T.stoppedAtMs === null;

/** The DI's pairs rules (see the header), most pressing first within a tone. */
export const PAIRS_RULES = Object.freeze([
  {
    id: 'pairs-still-up', voice: 'di', repeatMs: PAIRS_REPEAT_MS, tone: 'urgent', short: 'Head', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k || !k.atPause || k.busy || !standing(k) || !stillUp(state, k.pick)) return null;
      return { k };
    },
    act: (ctx) => (ctx.k.S.aim?.key !== ctx.k.pick ? actIf(ctx.k, 'aim', ctx.k.pick) : null),
    text: { 1: ["He's still up. Head.", 'Still standing. Go to the head.', 'It rang and he is up. Head.', 'Plate. Head.'] },
  },
  {
    id: 'pairs-contact', voice: 'di', repeatMs: PAIRS_REPEAT_MS, tone: 'urgent', reach: null,
    short: (ctx) => ({ safe: 'Off safe', next: 'Next', nextUnseen: 'Next', press: 'Press', again: 'Again', up: 'Rifle up', point: 'Your point' }[ctx.variant] ?? 'Aim'),
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k || !k.atPause || k.busy) return null;
      // (the bracketed one down: the next threat he saw, still up, named for the player's brackets)
      if (!standing(k) && k.T) {
        const next = k.str.keys.map(key => k.R.turners.find(t => t.key === key)).find(t => t && t.key !== k.pick && facingOf(t, ms) >= 0.5 && t.stoppedAtMs === null && !NOSHOOT.has(k.last.ident?.[t.key]));
        if (!next) return null;
        const id = k.last.ident?.[next.key], where = next.key === k.own ? 'your lane' : LANE_WORD[next.lane];
        return { k, variant: HOLD_WORD[id] ? 'next' : 'nextUnseen', what: HOLD_WORD[id] ?? 'Someone', thing: id, where, Where: where.replace(/^\w/, c => c.toUpperCase()) };
      }
      if (!standing(k) || !HOLD_WORD[k.ident]) return null;
      // (he's still up: pairs-still-up's line, never "press" over the steel's ring)
      if (stillUp(state, k.pick)) return null;
      const aimed = k.S.aim?.key === k.pick;
      // (a fumble slung the rifle: up first, the only row it offers (the runtime review of v0.0.8))
      if (k.posture === 'slungFront' || k.posture === 'slungBack') return { k, variant: 'up', what: HOLD_WORD[k.ident] };
      // (off the point: no shot from there; the brackets and the safe wait (the design review of v0.0.8))
      if (!onPoint(state)) return { k, variant: 'point', what: HOLD_WORD[k.ident] };
      // (below rung 2 the safe is its own step, first; from rung 2 the row's aim does both: the aim alone)
      const words = { what: HOLD_WORD[k.ident], thing: k.ident, where: k.pick === k.own ? 'your lane' : LANE_WORD[k.lane] };
      // (nothing fired at him yet: the safe, then the aim; once rounds have gone at him, the aim and the press only)
      if (k.rung < 2 && k.b?.mode === 'safe' && !k.firedAt) return { k, variant: 'safe', ...words };
      // (on him and off safe: the shot is the player's, so the line says so and offers nothing)
      const able = k.b?.chamber === 'live' && !k.b.locked && !k.b.stoppage && k.b.mode !== 'safe';
      // (one torso hit on him and still standing: another to the chest, not the head (paper needs two))
      const hit = k.T.hits.some(h => h.part === 'torso' && h.zone && h.atMs >= k.last.atMs);
      if (aimed) return able ? { k, variant: hit ? 'again' : 'press', ...words } : null;
      return { k, variant: 'aim', ...words };
    },
    act: (ctx) => (['next', 'nextUnseen', 'press', 'again', 'point'].includes(ctx.variant) ? null : ctx.variant === 'up' ? actIf(ctx.k, 'up') : ctx.variant === 'safe' ? actIf(ctx.k, 'selector:semi') : actIf(ctx.k, 'aim', ctx.k.pick)),
    text: {
      1: ['{what}, {where}. Aim. Then press.'],
      safe: ['{what}, {where}. Off safe. Aim. Then press.', '{what}, {where}. Thumb it off safe, then get on him.', 'That is a {thing}. Off safe first.', '{what}, {where}. Safe off, sights on, then your shots.'],
      aim: ['{what}, {where}. Aim. Then press.', '{what}, {where}. Get on him.', 'That is a {thing}. Sights on him.', '{what}, {where}. On him, then your pair.'],
      press: ['On him. Your shots: press.', 'Sights on the {thing}. Press.', 'You are on him. Now press.', 'Press. Do not wait for him.'],
      again: ['Again. Chest.', 'One in him. Again, the chest.', 'He took one. Again.', 'Chest again. Press.'],
      up: ['Rifle up.', 'Get the rifle up. {what} in front of you.', 'Rifle up, now.', 'Up. Then the safe.'],
      point: ['Back on your point first.', 'Not from there. Back on your point.', 'Your point first. Then him.', 'Off your point. Back on it.'],
      nextUnseen: ['Down. {Where}: his hands, you have not seen them.', 'One down. {Where} still up. What is in his hands?', 'Down. Bracket {where}: you do not know him yet.', 'Next, {where}. Hands not seen.'],
      next: ['He is down. Next: the {thing}, {where}.', 'Down. Now {where}: a {thing}.', 'One down. Bracket the {thing}, {where}.', 'Next one. {what}, {where}.'],
    },
  },
  {
    id: 'pairs-live-out', voice: 'di', repeatMs: PAIRS_REPEAT_MS, tone: 'urgent', short: 'G', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      // (X at the pause leaves him live with a man still facing: nothing was said for 20 s (the design review of v0.0.8))
      if (!k || k.inMode || !k.live || !k.last || k.last.seenMs < k.str.turnedMs || !k.up.length) return null;
      return { k };
    },
    act: () => 'stop:enter',
    text: { 1: ["He's still there. G, and take him.", 'Still facing you. G. Take him.', 'He is still up. G, then your shots.', 'Not done. G.'] },
  },
  {
    id: 'pairs-noshoot', voice: 'di', repeatMs: PAIRS_REPEAT_MS, tone: 'warn', short: 'Hold', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k || !k.atPause || k.busy || !standing(k) || !NOSHOOT.has(k.ident)) return null;
      // (a threat he identified still up: not this one; name that one, the brackets are the player's (no act))
      const other = k.up.find(t => t.key !== k.pick && HOLD_WORD[k.last.ident?.[t.key]]);
      if (other) { const where = other.key === k.own ? 'your lane' : LANE_WORD[other.lane]; return { k, variant: 'other', what: HOLD_WORD[k.last.ident[other.key]], where }; }
      return { k, variant: k.ident };
    },
    act: (ctx) => (ctx.variant === 'other' ? null : actIf(ctx.k, 'contact:hold')),
    text: {
      1: ["Hands. No weapon. Don't."],
      hands: ["Hands. No weapon. Don't.", 'Empty hands. Not him.', 'Nothing in his hands. Hold.', "Hands, no weapon. Don't you dare."],
      phone: ["A phone. No weapon. Don't.", 'That is a phone. Hold.', 'Phone, not a pistol. Not him.', "A phone. Don't."],
      other: ['Not him. {what}, {where}: bracket him (Q, D).', 'Not that one. The {what}, {where}.', 'No weapon on him. {what}, {where}: bracket him.', 'Leave him. {what}, {where}.'],
    },
  },
  {
    id: 'pairs-unknown', voice: 'di', repeatMs: PAIRS_REPEAT_MS, tone: 'warn', short: 'Challenge', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k || !k.atPause || k.busy || !standing(k) || k.ident !== 'unseen') return null;
      return { k };
    },
    act: (ctx) => actIf(ctx.k, 'contact:challenge'),
    text: { 1: ["Can't see his hands. Challenge him.", 'Hands not seen. Challenge.', 'What is in his hands? Make him show you.', 'You do not know yet. Challenge.'] },
  },
  {
    id: 'pairs-reload', voice: 'di', repeatMs: PAIRS_REPEAT_MS, tone: 'warn', short: 'Reload', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k || !k.b || k.busy || !k.b.locked || k.b.count !== 0 || roundsLeft(state) === 0) return null;
      return { k };
    },
    act: (ctx) => { const r = reloadRow(ctx.k); return r ? actIf(ctx.k, r.id) : null; },
    text: { 1: ['Empty. Reload.', 'Bolt locked. RELOAD.', 'Dry. Fresh magazine, bolt home.', 'Empty gun. Reload it now.'] },
  },
  {
    id: 'pairs-short', voice: 'di', repeatMs: PAIRS_REPEAT_MS, tone: 'warn', short: 'Short one', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k || k.busy || k.cmd !== 'short' || !k.R.wantMag || state.items[k.gunId]?.mag === k.R.wantMag) return null;
      return { k };
    },
    act: (ctx) => (!ctx.k.inMode ? 'stop:enter' : topUpRow(ctx.k) ? actIf(ctx.k, 'macro:reload:tactical') : null),
    text: { 1: ['Top up with the short one.', 'The two-round magazine. Top up with it.', 'The coach wants the short one in. Top up.', 'Short magazine in. Top up.'] },
  },
  {
    id: 'pairs-cmd', voice: 'di', repeatMs: PAIRS_REPEAT_MS, tone: 'warn', reach: null,
    short: (ctx) => ({ load: 'Load', ready: 'Make ready', clear: 'Show clear' }[ctx.variant]),
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k || !k.b || k.busy || !['load', 'ready', 'clear'].includes(k.cmd) || lineReady(state, k.cmd)) return null;
      if (k.cmd === 'load' && k.b.mag === 'in') return null;
      if (k.cmd === 'ready' && (k.b.chamber === 'live' || k.b.mag !== 'in')) return null;
      return { k, variant: k.cmd, step: { load: 'macro:load', ready: 'macro:ready', clear: 'macro:clear' }[k.cmd] };
    },
    act: (ctx) => (!ctx.k.inMode ? 'stop:enter' : actIf(ctx.k, ctx.step)),
    text: {
      1: ['The coach said LOAD.'],
      load: ['The coach said LOAD.', 'A magazine of ten. LOAD.', 'LOAD. The coach is waiting.', 'Magazine in: LOAD.'],
      ready: ['MAKE READY. A round up, on safe.', 'The coach said MAKE READY.', 'Charge it, check it: MAKE READY.', 'MAKE READY, then low ready.'],
      clear: ['UNLOAD, SHOW CLEAR to the coach.', 'Show him an empty chamber.', 'The coach said UNLOAD, SHOW CLEAR.', 'Clear it and show him.'],
    },
  },
  {
    id: 'pairs-reset', voice: 'di', repeatMs: PAIRS_REPEAT_MS, tone: 'warn', short: 'Safe, out', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k || !k.inMode || k.busy || !k.str?.done || k.cmd !== 'standby') return null;
      return { k, variant: k.b?.mode !== 'safe' || k.finger === 'on' ? 'safe' : 'out' };
    },
    act: (ctx) => (ctx.variant === 'safe' ? actIf(ctx.k, 'macro:cease') ?? actIf(ctx.k, 'selector:safe') : actIf(ctx.k, 'leave')),
    text: { 1: ['Done. Safe. Out of it.'], safe: ['Done. Safe. Out of it.', 'String over. On safe.', 'Finger off, on safe. Then out of it.', 'Safe it, then X.'],
      out: ['On safe. Now out of it: X.', 'Out of it. Wait for the coach.', 'Done. X, and stand easy at low ready.', 'Out of the mode. The coach runs the next one.'] },
  },
  {
    id: 'pairs-ready', voice: 'di', repeatMs: PAIRS_REPEAT_MS, tone: 'warn', reach: null,
    short: (ctx) => ({ safe: 'Safe', low: 'Low ready', out: 'Out of it', outCmd: 'Out of it', up: 'Rifle up', mag: 'Magazine', chamber: 'Make ready', check: 'Press check', point: 'Your point' }[ctx.variant] ?? 'Ready'),
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k || k.busy || k.live) return null;
      // (in a standby, before the turn: the turn only comes to a shooter ready, out of it, on his point (pairs.js))
      const waiting = k.cmd === 'standby' && !!k.str && !k.str.done && k.str.turnedMs === null;
      if (!waiting) {
        if (!READY_CMDS.has(k.cmd) || lineReady(state, k.cmd)) return null;
        if (k.cmd === 'short' && k.R.wantMag && state.items[k.gunId]?.mag !== k.R.wantMag) return null;
        // (MAKE READY not done yet: pairs-cmd's)
        if (k.cmd === 'ready' && k.b?.mag === 'in' && k.b.chamber !== 'live') return null;
        const def = SEQ_PAIRS[k.R.cmd.i];
        if (!def || !['pairsReady', 'shortReady', 'toppedUp'].includes(def.ready)) return null;
      }
      // (what is lacking, in the order it is put right (pairs.js pairsWant; the design review of v0.0.8: with the magazine
      // lost in a fumble the DI said nothing and the coach nagged about the safe); out of the mode, the work in it is G first)
      const want = k.want;
      if (!want || want === 'still') return null;
      if (!k.inMode && (want === 'safe' || want === 'low')) return { k, variant: 'up' };
      // (not sure what is in the chamber (a discharge, a fumble): a press check before anything else)
      if (want === 'chamber' && k.b?.chamber === '?') return { k, variant: 'check' };
      return { k, variant: want === 'out' && !waiting ? 'outCmd' : want };
    },
    act: (ctx) => {
      const k = ctx.k;
      if (ctx.variant === 'up') return 'stop:enter';
      if (ctx.variant === 'point') return null;
      if (!k.inMode && (ctx.variant === 'mag' || ctx.variant === 'chamber' || ctx.variant === 'check')) return 'stop:enter';
      if (ctx.variant === 'check') return actIf(k, 'pressCheck');
      if (ctx.variant === 'mag') return actIf(k, 'queue') ?? actIf(k, 'macro:load') ?? actIf(k, 'seat') ?? (k.steps.find(st => /^reach@p\d$/.test(st.id) && !st.off) ? actIf(k, k.steps.find(st => /^reach@p\d$/.test(st.id) && !st.off).id) : actIf(k, 'reach@ground'));
      if (ctx.variant === 'chamber') return actIf(k, 'macro:ready') ?? actIf(k, 'charge');
      if (ctx.variant === 'safe') return actIf(k, 'macro:cease') ?? actIf(k, 'selector:safe');
      if (ctx.variant === 'low') return actIf(k, 'posture:lowReady') ?? actIf(k, 'up');
      return actIf(k, 'leave');
    },
    text: {
      1: ['Low ready, on safe. Out of it: X. Let it come.'],
      up: ['Rifle up: low ready, on safe. Then let it come.', 'Get the rifle up and safe. Low ready.', 'Low ready, on safe. Then wait out of it.', 'Rifle in your hands, on safe, muzzle downrange.'],
      mag: ['No magazine in. Reach for one.', 'Your magazine is out. Get one in.', 'Magazine. Reach, seat it, tug it.', 'Nothing in the well. A magazine in.'],
      check: ['Not sure what is up the spout. Press check.', 'Press check: is there one in?', 'Look in the chamber before anything.', 'A press check. Know your rifle.'],
      chamber: ['Nothing up the spout. MAKE READY.', 'Chamber a round: MAKE READY.', 'Empty chamber. Charge it.', 'A round up, then on safe.'],
      safe: ['On safe. Finger off.', 'Safe it before you wait.', 'Finger off, on safe. Then low ready.', 'On safe. You wait on safe.'],
      low: ['Low ready. Muzzle downrange, below his feet.', 'Rifle down to low ready.', 'Low ready, where you can see over it.', 'Low ready. Let it come.'],
      out: ['Low ready, on safe. Out of it: X. Let it come.', 'Out of it: X. The turn only comes when you are out.', 'X. Wait for it standing, not in the mode.', 'Out of the mode. Let it come.'],
      outCmd: ['On safe, low ready. Now out of it: X.', 'Out of it: X. The coach is waiting.', 'X, and stand easy at low ready.', 'Out of the mode, low ready.'],
      point: ['Back on your point. Walk it, muzzle downrange.', 'Off your point. Back on it.', 'Your point is behind you. Walk back to it.', 'On your point first. The turn waits for you.'],
    },
  },
  {
    id: 'pairs-topup', voice: 'di', repeatMs: PAIRS_REPEAT_MS, tone: 'note', short: 'Top up', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k || !k.b || k.busy || k.live || k.b.mag !== 'in' || !Number.isFinite(k.b.count) || k.b.count > HALF_N || k.b.chamber !== 'live') return null;
      // (not in a standby still to turn: going into the mode there puts the turn off; between strings, the coach's commands)
      if (k.cmd === 'short' || (k.cmd === 'standby' && k.str && !k.str.done) || !lullOf(state, k.pid, ms)) return null;
      // (the coach's short magazine, seated for string 4: it stays in until that string is fired)
      if (state.items[k.gunId]?.mag === k.R.mags?.short && !k.R.strs.some(x => x.k === 4)) return null;
      const fuller = pouchesOf(state, k.pid).flatMap(p => p.mags).some(id => (believedN(state.items[id]) ?? 0) > k.b.count);
      if (!fuller) return null;
      if (k.inMode && !topUpRow(k)) return null;
      return { k, n: k.b.count };
    },
    act: (ctx) => (!ctx.k.inMode ? 'stop:enter' : actIf(ctx.k, 'macro:reload:tactical')),
    text: { 1: ['Lull. Top up.', 'Quiet now. Top up while you can.', '{n} left in it. Top up.', 'A lull is for a fuller magazine. Top up.'] },
  },
  {
    id: 'pairs-wait', voice: 'di', repeatMs: PAIRS_REPEAT_MS, tone: 'calm', short: 'Wait', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k || k.inMode || !k.str || k.str.done || k.str.turnedMs !== null || k.str.turnAtMs === null) return null;
      return { k, noHumour: true };
    },
    act: () => null,
    text: { 1: ['Wait for it.', 'Let it come.', 'Eyes downrange. Wait for it.', 'Breathe. It turns when it turns.'] },
  },
]);
