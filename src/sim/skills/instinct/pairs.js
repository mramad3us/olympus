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
//   pairs-shaking    urgent  (0.0.9, "Three bangs") at the pause on a threat he identified, his felt suppressed or pinned
//                            (supp.js bandN 2 or 3: his hands shake), below rung 2, the rifle on safe: "Thumb it off."; after
//                            an Off safe that failed (the lever fumbled: R.bangs.offSafe since this pause) "Again. Thumb it
//                            off."; the rifle on its sling "Rifle up. Then thumb it off."; T Off safe (or the rifle up),
//                            never more: the DI does nothing for you but what T asks (SKILLS §14); listed first, so it is
//                            the line over pairs-contact's off safe while the chaos holds
//   pairs-still-up   urgent  "He's still up" (specials.js stillUp: a torso round rang on a plate, or two in the torso, and
//                            he stands): the line names To the head's key in the panel ("He's still up. To the head: 1."),
//                            or its key and why it is struck ("To the head (1): aim first."; the fix of 2026-11-07, the
//                            user's report: "am i supposed to aim for the head ? How do I do that ?": the DI said "Head."
//                            with no head row in the panel); struck, the step that lifts it named with its key too
//                            ("aim first. Aim at ...: 3.", "chamber unknown. Press check: 7."; on another page, 0) and
//                            the act that step (headFix: off safe, the aim, RELOAD, IMMEDIATE ACTION, a press check,
//                            MAKE READY or the bolt release or Charge); offered, the aim if not aimed; listed first, so at
//                            the steel's ring this is the line, not pairs-contact's "press" (the design review of v0.0.8)
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
//   pairs-unknown    warn    the bracketed not identified ("Can't see his hands."): Challenge; the rifle slung, up first;
//                            silent once he is still up or rounds have gone at him this pause (the shooting answered it)
//   pairs-reload     warn    the bolt believed locked on an empty with rounds left: RELOAD; where the panel has no RELOAD
//                            (nothing in the pouches), the single that gets a magazine in: seat, the empty out, the reach;
//                            (0.0.9) an empty magazine in with the bolt forward on an empty chamber: 'swap', Top up, else
//                            the magazine out (the fixer's: the bot and a player stood there, "no reload when dry")
//   pairs-short      warn    the coach's short magazine named and not in: Top up with it; where the panel has no Top up
//                            (no magazine in the rifle, one in the hand), the single it offers that gets the short one in
//                            (seat it, stow the other, the magazine out to a pouch, the reach for its pouch or at your
//                            feet), named (the fix of 2026-11-07: a line never calls for a row the panel lacks)
//   pairs-cmd        warn    the coach's LOAD, MAKE READY or UNLOAD, SHOW CLEAR not done yet: its macro (out of the mode,
//                            the rifle up first); in the mode with no such row, the rifle up if slung, MAKE READY on a
//                            bolt locked back the bolt release or Charge (chamberSingle), pairs-reload's on an empty, LOAD
//                            magSingle's (seat, the reach), or "dry" naming no row; the range's own range-cmd keeps quiet on this course (instinct.js)
//   pairs-reset      warn    the string done and you in stop motion: on safe, then X
//   pairs-ready      warn    a standby to come and the line not ready: what is lacking (pairs.js pairsWant): a magazine
//                            in, a round up, on safe, low ready, X out, back on the point (out of the mode with work to
//                            do in it: G first); at a choice in the mode the single the panel offers is the step named:
//                            the rifle up if slung, magSingle's for a magazine, a press check on a bolt forward, MAKE
//                            READY, else chamberSingle's, or "dry" naming no row (the verifier's sweep of 2026-11-07)
//   pairs-deaf       note    (0.0.9) deafened by the bangs (supp.js hearingOf), the first standby after them, its turn armed,
//                            out of the mode: "Ears ringing. Watch your lane." (nothing for T); once a run, by its string
//   pairs-topup      note    a lull (contact.js lullOf), the magazine believed at half or less (or its count not known:
//                            'unsure', 0.0.9's fixer), a fuller one at hand: Top up
//   pairs-froze      warn    (0.0.9) a startle ended (supp.js's block: startleUntilMs), for FROZE_SAY_MS 3 s or until a step
//                            or a contact's pause; never for a freeze under FROZE_SAY_MIN_MS 0.3 s, nor while a planned bang
//                            is still to join it (pairs.js bangDue):
//                            "You flinched. Everybody does. Your lane." after the first series (green or settled hardening;
//                            "Flinched. Your lane." steadier), "Flinched again. Your lane." after another;
//                            nothing for T
//   stress-breathe   warn    (0.0.10, test-stress) Breathe offered (supp.js breatheOffer: felt 20 or more, no window, not
//                            startled, not breathing) with no threat of the string standing (the standby, between strings,
//                            a pause with nobody up and the rifle in Condition 1: dry, the RELOAD first); out of the mode "Hands shaking. Breathe: T." (T Breathe, a live step:
//                            instinct.js), in it its keys ("Breathe: 5.", the panel's model in the layout played, groups.js
//                            keysFor: never a row the panel lacks; "Breathe: Tab › 1 › 8" where it is in the fan);
//                            suppressed or pinned "Bangs. Your hands are shaking. Breathe: T."; once a minute; never done but by T
//   pairs-wait       calm    the turn armed: nothing ("Wait for it."; on the stress course and "Three bangs" never naming Breathe, its own step)
// 0.0.10 (test-stress, the stress course on this bay: the build sheet 0.0.10 §2.2): pairs-shaking and pairs-froze read the
// stress course's record as they read "Three bangs"' (R.stress: the last Off safe, the last step, the session's freezes);
// pairs-ready reads the course's own sequence (handling.js seqOf); pairs-short names the one-round magazine there
// ({rounds}); after a failed RELOAD try on the stress course pairs-reload says "Again. RELOAD." ('again').
// All of them, these three too, are silent while he is startled (instinct.js firedNow: the startle takes the keys and the
// words, as the take-in's window does).
// Pure.
import { playerId } from '../../../core/ids.js';
import { beliefOf } from '../../arms/firearms.js';
import { stepsOf, gunOn } from '../../arms/shooting.js';
import { pouchesOf, believedN, handMagOf, atFeetOf } from '../../arms/kit.js';
import { rangeOf, lineReady, roundsLeft, seqOf } from '../../scenarios/handling.js';
import { HALF_N, pairsWant, onPoint } from '../../scenarios/pairs.js';
import { stillUp } from '../../arms/specials.js';
import { remedyOf } from '../../arms/panel.js';
import { keysFor, layoutIn } from '../../arms/groups.js';
import { facingOf, turnerKey } from '../../arms/turners.js';
import { contactNow, lullOf } from '../../combat/contact.js';
import { rungOf } from '../templates.js';
import { blockOf, feltOf, bandN, hearingOf, hardOf, hardWord, breatheOffer, STARTLE_JOIN_MS } from '../../combat/supp.js';
import { recOf, RELOAD_STRING } from '../../scenarios/stress.js';
import { BANGS, bangDue } from '../../scenarios/pairs.js';

/** The pairs rules may speak again as soon as they fire again (the range's rule: each turn new advice). */
export const PAIRS_REPEAT_MS = 0;
const NOSHOOT = new Set(['hands', 'phone']);
/** How long after a startle's end the DI's "You flinched." stands, unless a step comes first (ms; my call). */
export const FROZE_SAY_MS = 3000;
/** How long the DI waits before offering Breathe again (ms; the sheet 0.0.10 §2.2: once a minute). */
export const OFFER_AGAIN_MS = 60_000;
/** The shortest whole freeze the DI calls a flinch (ms; my call, the fixer of v0.0.9: the tier one's 0.05 s and the Raider's 0.15 s are not). */
export const FROZE_SAY_MIN_MS = 300;
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
  // (the rifle as believed in the key too: a belief that changes with the clock standing still (a set state, a load) is a new panel)
  const g0 = state.items?.[S0?.gun ?? gunOn(state, playerId(state))], b0 = g0?.belief ?? null;
  const key = `${ms}|${state.clock.tick ?? ''}|${c0?.posture ?? ''}|${c0?.finger ?? ''}|${me0 ? `${me0.x}|${me0.z}` : ''}|${g0 ? `${g0.mode}|${g0.mag ?? ''}|${b0?.chamber ?? ''}|${b0?.count ?? ''}|${b0?.locked ? 1 : 0}|${b0?.stoppage ?? ''}` : ''}|${S0 ? `${S0.mode}|${S0.phase}|${S0.doing?.step ?? ''}|${S0.doing?.i ?? ''}|${S0.pick ?? ''}|${S0.aim?.key ?? ''}` : ''}|${R?.cmd?.i ?? ''}|${R?.str?.done ?? ''}|${L0 ? `${L0.id}|${JSON.stringify(L0.ident ?? null)}` : ''}`;
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
const slungNow = (k) => k.posture === 'slungFront' || k.posture === 'slungBack';
// (a round up where MAKE READY is not in the panel (drills.js offers it only on a bolt forward): the bolt locked back on a
// magazine believed to hold rounds, the bolt release, else Charge; locked on an empty, pairs-reload's line while rounds are
// left (null here), else dry, no row to name; { variant, step } or null (the verifier's sweep of 2026-11-07: "Empty chamber.
// Charge it." and "MAKE READY" over a panel with neither, T doing nothing))
function chamberSingle(state, k) {
  if (k.b?.locked && k.b.count === 0) return roundsLeft(state) > 0 ? null : { variant: 'dry' };
  const id = ['release', 'charge'].find(x => k.offered(x));
  return id ? { variant: id, step: id } : roundsLeft(state) > 0 ? null : { variant: 'dry' };
}
// (a magazine in: the queue carried on, LOAD, seat the one in the hand, the reach for a pouch's, then the ground's)
const magSingle = (k) => ['queue', 'macro:load', 'seat'].find(x => k.offered(x)) ?? k.steps.find(st => /^reach@p\d$/.test(st.id) && !st.off)?.id ?? (k.offered('reach@ground') ? 'reach@ground' : null);
// (To the head's lines by the key it is on (a variant a key, so the words are picked again when the row moves): offered, struck)
const HEAD_LINES = Object.freeze(["He's still up. To the head: {key}.", 'Still standing. To the head: {key}.', 'It rang and he is up. To the head: {key}.', 'Plate. To the head: {key}.']);
const HEAD_STRUCK = Object.freeze(["He's still up. To the head ({key}): {off}.{then}", 'Still standing. To the head ({key}) is struck: {off}.{then}', 'It rang and he is up. To the head ({key}): {off}.{then}', 'Plate. To the head ({key}): {off}.{then}']);
// (the step that lifts To the head's strike, by its reason (specials.js shotRows): the aim, else panel.js remedyOf, the one
// the panel brings up beside the row (Off safe, RELOAD, IMMEDIATE ACTION, Press check, MAKE READY or the bolt release or
// Charge); null for the reach)
function headFix(k, off) {
  if (off === 'aim first') return k.steps.find(st => st.id === 'aim' && st.target === k.pick && !st.off) ?? null;
  return remedyOf(k.steps, off);
}
// (the bracketed one still standing and facing: a decision to make about him)
const standing = (k) => !!k.T && k.facing >= 0.5 && k.T.stoppedAtMs === null;
// (0.0.9: his hands shake (felt suppressed or pinned) with the safe his own step: pairs-shaking says the safe, and
// pairs-contact's own "Off safe" stands down, so the line and the chip never say it twice)
const shakes = (state, k, ms) => k.rung < 2 && k.b?.mode === 'safe' && bandN(feltOf(state, k.pid, ms)) >= 2;

/** The DI's pairs rules (see the header), most pressing first within a tone. */
export const PAIRS_RULES = Object.freeze([
  {
    id: 'pairs-shaking', voice: 'di', repeatMs: PAIRS_REPEAT_MS, tone: 'urgent', reach: null,
    short: (ctx) => (ctx.variant === 'up' ? 'Rifle up' : 'Off safe'),
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k || !k.atPause || k.busy || k.rung >= 2 || !standing(k) || !HOLD_WORD[k.ident] || k.b?.mode !== 'safe') return null;
      // (his hands shake: the felt suppressed or pinned, as the body feels it, never a number)
      if (!shakes(state, k, ms)) return null;
      if (k.posture === 'slungFront' || k.posture === 'slungBack') return { k, variant: 'up' };
      if (!onPoint(state)) return null;
      const o = k.R.bangs?.offSafe ?? k.R.stress?.offSafe;
      return { k, variant: o && !o.ok && o.atMs >= k.last.atMs ? 'again' : 'off' };
    },
    act: (ctx) => (ctx.variant === 'up' ? actIf(ctx.k, 'up') : actIf(ctx.k, 'selector:semi')),
    text: {
      1: ['Thumb it off.'],
      off: ['Thumb it off.', 'Safe. Thumb it off.', 'Your thumb. Off safe.', 'Thumb on the lever. Off.'],
      again: ['Again. Thumb it off.', 'Again. Off safe.', 'It slipped. Thumb it off.', 'Again. Push it off.'],
      up: ['Rifle up. Then thumb it off.', 'It swung. Rifle up, then the safe.', 'Rifle up. Then off safe.', 'Get it up. Then thumb it off.'],
    },
  },
  {
    id: 'pairs-still-up', voice: 'di', repeatMs: PAIRS_REPEAT_MS, tone: 'urgent', short: 'Head', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k || !k.atPause || k.busy || !standing(k) || !stillUp(state, k.pick)) return null;
      // (the panel's head row and its keys (groups.js keysFor: the hud's own model, in the layout played, the rework's R7); struck, its reason said)
      const L = layoutIn(state), keyOf = (rowId) => keysFor(k.steps, rowId, { layout: L }).text;
      const head = k.steps.find(st => st.id === 'shot:head' && st.target === k.pick) ?? null, key = head ? keyOf(head.id) : null;
      if (!head || !key) return { k, head };
      if (!head.off) return { k, head, key, off: null, variant: `head${key}`, words: 'head' };
      // (struck: the step that lifts it named with its key (another page: 0), so the line never leaves the player looking;
      // the variant carries the key, the reason and the remedy's key, so the words are picked again when any of them moves)
      const fix = headFix(k, head.off), fkey = fix ? keyOf(fix.id) : null;
      const then = !fix ? '' : fkey ? ` ${fix.label}: ${fkey}.` : ` ${fix.label}: T.`;
      return { k, head, key, off: head.off, fix: fix?.id ?? null, then, variant: `struck${key}|${head.off}|${fix?.id ?? ''}|${fkey ?? ''}`, words: 'struck' };
    },
    act: (ctx) => {
      const k = ctx.k;
      if (ctx.fix) return actIf(k, ctx.fix, ctx.fix === 'aim' ? k.pick : null);
      if (ctx.off) return null;
      return k.S.aim?.key !== k.pick ? actIf(k, 'aim', k.pick) : null;
    },
    text: { 1: ["He's still up. Head.", 'Still standing. Go to the head.', 'It rang and he is up. Head.', 'Plate. Head.'], head: HEAD_LINES, struck: HEAD_STRUCK },
  },
  {
    id: 'pairs-contact', voice: 'di', repeatMs: PAIRS_REPEAT_MS, tone: 'urgent', reach: null,
    short: (ctx) => ({ safe: 'Off safe', next: 'Next', nextUnseen: 'Next', press: 'Press', again: 'Again', up: 'Rifle up', point: 'Your point', pressKey: 'Press', againKey: 'Again' }[ctx.words ?? ctx.variant] ?? 'Aim'),
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k || !k.atPause || k.busy) return null;
      // (the bracketed one down: the next threat he saw, still up, named for the player's brackets)
      if (!standing(k) && k.T) {
        const next = k.str.keys.map(key => k.R.turners.find(t => t.key === key)).find(t => t && t.key !== k.pick && facingOf(t, ms) >= 0.5 && t.stoppedAtMs === null && !NOSHOOT.has(k.last.ident?.[t.key]));
        if (!next) return null;
        const id = k.last.ident?.[next.key], where = next.key === k.own ? 'your lane' : LANE_WORD[next.lane];
        return { k, variant: HOLD_WORD[id] ? 'next' : 'nextUnseen', what: HOLD_WORD[id] ?? 'Someone', thing: id, where, Where: where.replace(/^\w/, c => c.toUpperCase()), next: next.key };
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
      if (k.rung < 2 && k.b?.mode === 'safe' && !k.firedAt) return shakes(state, k, ms) ? null : { k, variant: 'safe', ...words };
      // (on him and off safe: the shot is the player's, so the line says so and offers nothing)
      const able = k.b?.chamber === 'live' && !k.b.locked && !k.b.stoppage && k.b.mode !== 'safe';
      // (one torso hit on him and still standing: another to the chest, not the head (paper needs two))
      const hit = k.T.hits.some(h => h.part === 'torso' && h.zone && h.atMs >= k.last.atMs);
      // (the press names its key on the panel drawn: the first shot row live on him, else Fire (the design review of 2026-11-13:
      // with the layouts' keys "On him. Your shots: press." named none, and the old 1 did nothing for the boot recruit))
      if (aimed && able) {
        const shot = k.steps.find(st => /^shot:/.test(st.id) && !st.off) ?? (k.offered('fire') ? { id: 'fire' } : null), key = shot ? keysFor(k.steps, shot.id, { layout: layoutIn(state) }).text : null;
        const v = hit ? 'again' : 'press';
        return key ? { k, variant: `${v}${key}`, words: `${v}Key`, key, ...words } : { k, variant: v, ...words };
      }
      if (aimed) return null;
      return { k, variant: 'aim', ...words };
    },
    // (the next man: T brackets and aims at him, the aim row moving the bracket (the design review of 2026-11-13: "He is down.
    // Next: the rifle, lane one." had no act since v0.0.8, and a Wait pressed for it cost a "string not engaged" fault))
    act: (ctx) => ((ctx.variant === 'next' || ctx.variant === 'nextUnseen') ? (ctx.k.choosing && ctx.k.steps?.some(st => st.id === 'aim') ? `stop:aim>${ctx.next}` : null)
      : ['press', 'again', 'point'].includes(ctx.variant) || /^(press|again)./.test(ctx.variant) ? null : ctx.variant === 'up' ? actIf(ctx.k, 'up') : ctx.variant === 'safe' ? actIf(ctx.k, 'selector:semi') : actIf(ctx.k, 'aim', ctx.k.pick)),
    text: {
      1: ['{what}, {where}. Aim. Then press.'],
      safe: ['{what}, {where}. Off safe. Aim. Then press.', '{what}, {where}. Thumb it off safe, then get on him.', 'That is a {thing}. Off safe first.', '{what}, {where}. Safe off, sights on, then your shots.'],
      aim: ['{what}, {where}. Aim. Then press.', '{what}, {where}. Get on him.', 'That is a {thing}. Sights on him.', '{what}, {where}. On him, then your pair.'],
      press: ['On him. Your shots: press.', 'Sights on the {thing}. Press.', 'You are on him. Now press.', 'Press. Do not wait for him.'],
      again: ['Again. Chest.', 'One in him. Again, the chest.', 'He took one. Again.', 'Chest again. Press.'],
      pressKey: ['On him. Your shots: {key}.', 'Sights on the {thing}. Press: {key}.', 'You are on him. Now press: {key}.', 'Press: {key}. Do not wait for him.'],
      againKey: ['Again. Chest: {key}.', 'One in him. Again, the chest: {key}.', 'He took one. Again: {key}.', 'Chest again. Press: {key}.'],
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
      // (still up, or rounds already put on him this pause: the take-in's question is answered by the shooting, and
      // "Challenge" under "To the head" is two drills at once (the verifier, 2026-11-07))
      if (k.firedAt || stillUp(state, k.pick)) return null;
      // (the rifle slung by a fumble: no Challenge in that panel, the rifle up first (the fix of 2026-11-07: never a line without its row))
      if (k.posture === 'slungFront' || k.posture === 'slungBack') return { k, variant: 'up' };
      return { k };
    },
    act: (ctx) => actIf(ctx.k, ctx.variant === 'up' ? 'up' : 'contact:challenge'),
    text: { 1: ["Can't see his hands. Challenge him.", 'Hands not seen. Challenge.', 'What is in his hands? Make him show you.', 'You do not know yet. Challenge.'],
      up: ["Rifle up. Then challenge him: you can't see his hands.", 'Get the rifle up. Hands not seen.', 'Rifle up first, then make him show you.', 'Up. Then challenge.'] },
  },
  {
    id: 'pairs-reload', voice: 'di', repeatMs: PAIRS_REPEAT_MS, tone: 'warn', short: 'Reload', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k || !k.b || k.busy || k.b.count !== 0 || roundsLeft(state) === 0) return null;
      // (0.0.9, the fixer's: an empty magazine in with the bolt forward on an empty chamber (the bolt let go on it): no RELOAD
      // in the panel, the bot and a player stood there; the step that swaps it, named (Top up, else the magazine out))
      if (!k.b.locked) {
        if (k.b.mag !== 'in' || k.b.chamber !== 'empty') return null;
        const swap = k.choosing ? ['macro:reload:tactical', 'magOut:pouch', 'magOut:drop'].find(id => k.steps.some(st => st.id === id && !st.off)) ?? null : null;
        return { k, variant: 'swap', step: swap };
      }
      // (0.0.10: on the stress course, after a failed RELOAD try on string 5: "Again. RELOAD.")
      const again = !!k.R.stress && k.str?.k === RELOAD_STRING && recOf(k.R, RELOAD_STRING)?.reload?.tries.at(-1) === false;
      if (!k.choosing || k.steps.some(st => /^macro:reload:(speed|retain)$/.test(st.id))) return again && (!k.choosing || reloadRow(k)) ? { k, variant: 'again' } : { k };
      // (no RELOAD in the panel (nothing in the pouches: the rounds left are in the hand or at your feet): the single that
      // gets a magazine in, named (the fix of 2026-11-07: never a line without its row))
      const has = (id) => k.steps.some(st => st.id === id && !st.off), hand = handMagOf(state, k.pid);
      if (hand && has('seat')) return { k, variant: 'seat', step: 'seat' };
      if (!hand && k.b.mag === 'in' && has('magOut:drop')) return { k, variant: 'drop', step: 'magOut:drop' };
      const reachP = k.steps.find(st => /^reach@p\d$/.test(st.id) && !st.off && (pouchesOf(state, k.pid).find(p => p.key === st.id.slice(6))?.mags ?? []).some(id => (believedN(state.items[id]) ?? 1) > 0));
      if (!hand && k.b.mag !== 'in' && (reachP || has('reach@ground'))) return { k, variant: reachP ? 'reach' : 'ground', step: reachP?.id ?? 'reach@ground' };
      return { k, variant: 'none' };
    },
    act: (ctx) => { if (ctx.step) return actIf(ctx.k, ctx.step); if (ctx.variant === 'swap') return null; const r = reloadRow(ctx.k); return r ? actIf(ctx.k, r.id) : null; },
    text: { 1: ['Empty. Reload.', 'Bolt locked. RELOAD.', 'Dry. Fresh magazine, bolt home.', 'Empty gun. Reload it now.'],
      again: ['Again. RELOAD.', 'Again. Fresh magazine, bolt home.', 'Again. RELOAD, slow is smooth.', 'Again. RELOAD. Seat it, tug it.'],
      swap: ['Empty magazine in, the bolt home on nothing. Out with it, a fresh one in.', 'That magazine is empty. Swap it.', 'Nothing in the chamber, nothing in the magazine. Fresh one.', 'Empty. Magazine out, a full one in, then make it ready.'],
      seat: ['Empty. Seat that magazine, then the bolt home.', 'Seat it. Then the bolt release.', 'In it goes: seat it.', 'Seat, tug, bolt home.'],
      drop: ['Empty. Drop it, then a fresh one.', 'Bolt locked on an empty. Magazine out.', 'Dry. Let the empty go.', 'Empty. Out with it.'],
      reach: ['Empty. Reach for a magazine.', 'Dry. A fresh one from your pouch.', 'Reach. Then seat it.', 'Empty. Your pouch: a magazine.'],
      ground: ['Empty. There is a magazine at your feet: reach for it.', 'Dry. Pick that one up off the ground.', 'At your feet: reach.', 'Empty. The ground: a magazine.'],
      none: ['Empty, and nothing in your pouches.', 'Dry. No magazine to hand.', 'Bolt locked. Nothing to reload with.', 'Empty. Nothing left to hand.'] },
  },
  {
    id: 'pairs-short', voice: 'di', repeatMs: PAIRS_REPEAT_MS, tone: 'warn', short: 'Short one', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k || k.busy || k.cmd !== 'short' || !k.R.wantMag || state.items[k.gunId]?.mag === k.R.wantMag) return null;
      // (the short one by its rounds: the pairs course's two, the stress course's one (0.0.10))
      const rounds = k.R.stress ? 'one-round' : 'two-round';
      if (!k.choosing || k.steps.some(st => st.id === 'macro:reload:tactical')) return { k, rounds };
      // (no Top up in the panel (no magazine in the rifle, one in the hand): the singles that get the short one in, the one
      // the panel offers named, never "Top up" with no such row (the fix of 2026-11-07: never a line without its row))
      const want = k.R.wantMag, hand = handMagOf(state, k.pid), pouch = pouchesOf(state, k.pid).find(p => p.mags.includes(want)) ?? null;
      const has = (id) => k.steps.some(st => st.id === id && !st.off);
      const stow = hand && hand.id !== want ? k.steps.find(st => /^stowMag@/.test(st.id) && !st.off) ?? null : null;
      if (hand?.id === want && has('seat')) return { k, variant: 'seat', step: 'seat', rounds };
      if (stow) return { k, variant: 'stow', step: stow.id, rounds };
      if (!hand && k.b?.mag === 'in' && has('magOut:pouch')) return { k, variant: 'out', step: 'magOut:pouch', rounds };
      if (!hand && pouch && has(`reach@${pouch.key}`)) return { k, variant: 'reach', step: `reach@${pouch.key}`, pouch: pouch.word, rounds };
      // (dropped: at your feet, the nearest there, so the reach brings that one)
      // (0.0.10: at your feet behind another, the reach brings the nearer first, stowed after (the 'stow' case), then this one)
      if (!hand && !pouch && atFeetOf(state, k.pid).some(m => m.id === want) && has('reach@ground')) return { k, variant: 'ground', step: 'reach@ground', rounds };
      return pouch ? { k, variant: 'want', pouch: pouch.word, rounds } : { k, variant: 'lost', rounds };
    },
    act: (ctx) => (!ctx.k.inMode ? 'stop:enter' : ctx.step ? actIf(ctx.k, ctx.step) : topUpRow(ctx.k) ? actIf(ctx.k, 'macro:reload:tactical') : null),
    text: {
      1: ['Top up with the short one.', 'The {rounds} magazine. Top up with it.', 'The coach wants the short one in. Top up.', 'Short magazine in. Top up.'],
      seat: ['The short one is in your hand. Seat it.', 'Seat the {rounds} magazine.', 'In it goes: seat it.', 'Seat it, then tug it.'],
      stow: ['Not that one. Stow it, then the short one.', 'Wrong magazine in your hand. Stow it.', 'That is not the short one. Into a pouch with it.', 'Stow it. The coach wants the {rounds} one.'],
      out: ['Magazine out to a pouch, then the short one.', 'That one out, into a pouch. Then the short one.', 'Out with it, into a pouch.', 'Pouch that magazine. The short one next.'],
      reach: ['The short one: reach for it, {pouch}.', 'The {rounds} magazine is in your {pouch}. Reach.', 'Reach: {pouch}.', 'Your {pouch}: the short one.'],
      want: ['The coach wants the short one in, from your {pouch}.', 'The {rounds} magazine, from your {pouch}.', 'Short one in. It is in your {pouch}.', 'The coach is waiting on the short one.'],
      ground: ['The short one is at your feet. Reach for it.', 'You dropped the {rounds} one. Pick it up.', 'At your feet: the short one. Reach.', 'Ground. The short one.'],
      lost: ['The coach wants the short one in. Where did it go?', 'The {rounds} magazine: find it.', 'The short one is not in your pouches.', 'The coach is waiting on the short one.'],
    },
  },
  {
    id: 'pairs-cmd', voice: 'di', repeatMs: PAIRS_REPEAT_MS, tone: 'warn', reach: null,
    short: (ctx) => ({ load: 'Load', ready: 'Make ready', clear: 'Show clear', raise: 'Rifle up', release: 'Bolt release', charge: 'Charge', dry: 'Dry' }[ctx.variant]),
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k || !k.b || k.busy || !['load', 'ready', 'clear'].includes(k.cmd) || lineReady(state, k.cmd)) return null;
      if (k.cmd === 'load' && k.b.mag === 'in') return null;
      if (k.cmd === 'ready' && (k.b.chamber === 'live' || k.b.mag !== 'in')) return null;
      const step = { load: 'macro:load', ready: 'macro:ready', clear: 'macro:clear' }[k.cmd];
      // (in the mode with no such row: the rifle up first if slung; MAKE READY on a bolt locked back, the single that puts a
      // round up, or pairs-reload's on an empty (the fix of 2026-11-07: never a line without its row))
      if (k.choosing && !k.offered(step)) {
        if (slungNow(k)) return { k, variant: 'raise', step: 'up' };
        if (k.cmd === 'ready') { const c = chamberSingle(state, k); return c ? { k, ...c } : null; }
        if (k.cmd === 'load') { const st = magSingle(k); return st ? { k, variant: 'load', step: st } : roundsLeft(state) > 0 ? null : { k, variant: 'dry' }; }
      }
      return { k, variant: k.cmd, step };
    },
    act: (ctx) => (!ctx.k.inMode ? 'stop:enter' : ctx.step ? actIf(ctx.k, ctx.step) : null),
    text: {
      1: ['The coach said LOAD.'],
      raise: ['Rifle up. Then what the coach said.', 'Get the rifle up first.', 'Rifle up, then his command.', 'Up. Then do it.'],
      release: ['MAKE READY: the bolt is locked back. Bolt release, a round up.', 'Bolt release: that puts one up.', 'The bolt is back on a loaded magazine. Release it.', 'Bolt home: release it. Then on safe.'],
      charge: ['MAKE READY: charge it.', 'Charge it. A round up.', 'Charging handle: one up.', 'Charge it, then on safe.'],
      dry: ['Dry, and nothing to load. Tell the coach.', 'Nothing left to load.', 'Dry. Nothing to put in it.', 'The coach wants rounds you do not have.'],
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
    short: (ctx) => ({ safe: 'Safe', low: 'Low ready', out: 'Out of it', outCmd: 'Out of it', up: 'Rifle up', mag: 'Magazine', chamber: 'Make ready', check: 'Press check', point: 'Your point', raise: 'Rifle up', release: 'Bolt release', charge: 'Charge', dry: 'Dry' }[ctx.variant] ?? 'Ready'),
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
        const def = seqOf(k.R)[k.R.cmd.i];
        if (!def || !['pairsReady', 'shortReady', 'toppedUp'].includes(def.ready)) return null;
      }
      // (what is lacking, in the order it is put right (pairs.js pairsWant; the design review of v0.0.8: with the magazine
      // lost in a fumble the DI said nothing and the coach nagged about the safe); out of the mode, the work in it is G first)
      const want = k.want;
      if (!want || want === 'still') return null;
      if (!k.inMode && (want === 'safe' || want === 'low')) return { k, variant: 'up' };
      // (at a choice in the mode, the single the panel offers named as the step (the fix of 2026-11-07: never a line without
      // its row): the rifle up first if slung; a magazine in by the first of magSingle's; not sure what is in the chamber (a
      // discharge, a fumble), a press check, which the panel offers only on a bolt forward; an empty chamber, MAKE READY, else
      // chamberSingle's (the bolt release, Charge, pairs-reload's on an empty, or dry))
      if (k.choosing && k.inMode && (want === 'mag' || want === 'chamber')) {
        if (slungNow(k)) return { k, variant: 'raise', step: 'up' };
        if (want === 'mag') { const st = magSingle(k); return st ? { k, variant: 'mag', step: st } : roundsLeft(state) > 0 ? { k, variant: 'mag' } : { k, variant: 'dry' }; }
        // (unsure, or sure of a round the coach says is not up (a fumble's belief: 0.0.10, the stress bot's recruit on seed
        // 2024 stood a minute believing it live): a press check tells)
        if ((k.b?.chamber === '?' || k.b?.chamber === 'live') && k.offered('pressCheck')) return { k, variant: 'check', step: 'pressCheck' };
        if (k.offered('macro:ready')) return { k, variant: 'chamber', step: 'macro:ready' };
        const c = chamberSingle(state, k);
        return c ? { k, ...c } : null;
      }
      // (not sure what is in the chamber (a discharge, a fumble): a press check before anything else)
      if (want === 'chamber' && k.b?.chamber === '?') return { k, variant: 'check' };
      return { k, variant: want === 'out' && !waiting ? 'outCmd' : want };
    },
    act: (ctx) => {
      const k = ctx.k;
      if (ctx.variant === 'up') return 'stop:enter';
      if (ctx.variant === 'point' || ctx.variant === 'dry') return null;
      if (ctx.step) return actIf(k, ctx.step);
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
      raise: ['Rifle up first. Then get it ready.', 'Get the rifle up. Then the rest.', 'Rifle up. You cannot load it slung.', 'Up first.'],
      release: ['Bolt locked back on a loaded magazine. Bolt release.', 'Release the bolt: a round up.', 'The bolt is back. Release it, then on safe.', 'Bolt home. That puts one up.'],
      charge: ['Empty chamber. Charge it.', 'Charge it: a round up.', 'Nothing up the spout. Charge it.', 'Charge it, then on safe.'],
      dry: ['Dry, and nothing to load.', 'No rounds left to hand. Tell the coach.', 'Empty, and nothing to put in it.', 'Dry. Nothing left.'],
    },
  },
  {
    id: 'pairs-froze', voice: 'di', repeatMs: PAIRS_REPEAT_MS, tone: 'warn', short: 'Your lane', reach: null,
    when(state, me, ms) {
      const R = rangeOf(state), B = R?.bangs ?? R?.stress;
      if (!B || R.course !== 'pairs' || R.end) return null;
      const b = blockOf(state, me.who), until = b?.startleUntilMs;
      if (!Number.isFinite(until) || ms < until || ms >= until + FROZE_SAY_MS || (B.lastStepMs ?? -Infinity) >= until) return null;
      // (a contact's pause since: the decision there is the line's, not the flinch)
      if (state.stop?.mode === 'stop' && (contactNow(state, ms)?.last?.atMs ?? -Infinity) >= until) return null;
      // (a flinch too short to call one: a tier one's tick or a Raider's 0.15 s is not "Everybody does"; and a bang still to
      // come that will join this freeze: the line waits for the series' end, said once (the reviews of v0.0.9))
      if ((b.startleMs ?? 0) < FROZE_SAY_MIN_MS || bangDue(state)) return null;
      // (the first series of the run, the freezes joined within STARTLE_JOIN_MS counting as one; "the first time" only
      // for a green or settled hardening, a steadier man told plainly)
      const f = B.froze;
      let j = f.length - 1;
      while (j > 0 && f[j].fromMs - f[j - 1].untilMs <= STARTLE_JOIN_MS) j--;
      if (j > 0) return { variant: 'again', noHumour: true };
      return { variant: ['green', 'settled'].includes(hardWord(hardOf(state, me.who, ms))) ? 'first' : 'steady', noHumour: true };
    },
    act: () => null,
    text: { 1: ['You flinched. Everybody does. Your lane.'],
      first: ['You flinched. Everybody does. Your lane.', 'You flinched. Everybody flinches. Eyes on your lane.', 'Flinched. Everybody does, the first time. Your lane.', 'That was a flinch. Everybody does it. Watch your lane.'],
      steady: ['Flinched. Your lane.', 'Shake it off. Your lane.', 'Flinch. Eyes downrange.', 'Back in it. Your lane.'],
      again: ['Flinched. Your lane.', 'Flinched again. Your lane.', 'Flinch. Eyes downrange.', 'Again. Your lane.'] },
  },
  {
    id: 'pairs-deaf', voice: 'di', repeatMs: PAIRS_REPEAT_MS, tone: 'note', short: 'Your lane', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      // (the first standby after the bangs, its turn armed: once a run, by its string)
      if (!k || !k.R.bangs || k.inMode || !k.str || k.str.done || k.str.turnedMs !== null || k.str.turnAtMs === null || k.str.k !== BANGS.string + 1) return null;
      if (!hearingOf(state, k.pid, ms).deaf) return null;
      return { k, noHumour: true };
    },
    act: () => null,
    text: { 1: ['Ears ringing. Watch your lane.', 'You will not hear him turn. Watch your lane.', 'Ringing ears. Your eyes do the work: your lane.', 'You cannot hear much. Watch your lane.'] },
  },
  {
    id: 'pairs-topup', voice: 'di', repeatMs: PAIRS_REPEAT_MS, tone: 'note', short: 'Top up', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      // (0.0.9, the fixer's: a count not known (a fumbled magazine) is not "above half": the lull waits on a Top up (pairs.js
      // toppedUp), so the DI says so, 'unsure', where it stood silent and the line faulted the shooter slow)
      const unsure = k?.b?.mag === 'in' && !Number.isFinite(k.b.count);
      if (!k || !k.b || k.busy || k.live || k.b.mag !== 'in' || (!unsure && k.b.count > HALF_N) || k.b.chamber !== 'live') return null;
      // (not in a standby still to turn: going into the mode there puts the turn off; between strings, the coach's commands)
      if (k.cmd === 'short' || (k.cmd === 'standby' && k.str && !k.str.done) || !lullOf(state, k.pid, ms)) return null;
      // (the coach's short magazine, seated for string 4: it stays in until that string is fired)
      if (state.items[k.gunId]?.mag === k.R.mags?.short && !k.R.strs.some(x => x.k === 4)) return null;
      const fuller = pouchesOf(state, k.pid).flatMap(p => p.mags).some(id => (believedN(state.items[id]) ?? 0) > (unsure ? 0 : k.b.count));
      if (!fuller) return null;
      if (k.inMode && !topUpRow(k)) return null;
      return unsure ? { k, variant: 'unsure' } : { k, n: k.b.count };
    },
    act: (ctx) => (!ctx.k.inMode ? 'stop:enter' : actIf(ctx.k, 'macro:reload:tactical')),
    text: { 1: ['Lull. Top up.', 'Quiet now. Top up while you can.', '{n} left in it. Top up.', 'A lull is for a fuller magazine. Top up.'],
      unsure: ['Not sure what is left in it. Top up.', 'Lull. You lost the count: Top up.', 'Count unknown. A fresh magazine, now.', 'You do not know what is in it. Top up.'] },
  },
  {
    id: 'stress-breathe', voice: 'di', repeatMs: OFFER_AGAIN_MS, tone: 'warn', short: 'Breathe', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      // (the stress course; never with a threat of the string standing, never over a step under way; on a live string only
      // with the rifle in Condition 1 (a dry rifle is pairs-reload's first: the RELOAD, then the breath))
      if (!k || !k.R.stress || k.busy || (k.live && (k.up.length || k.b?.chamber !== 'live' || k.b.locked || k.b.mag !== 'in'))) return null;
      const o = breatheOffer(state, k.pid, ms);
      if (!o.ok || o.up) return null;
      const hard = bandN(feltOf(state, k.pid, ms)) >= 2;
      if (!k.inMode) return { k, variant: hard ? 'shaking' : 'out', noHumour: true };
      // (in the mode, only where the panel has its row, by its key: the panel read now, since its Breathe row follows the felt,
      // which the memo's key does not carry)
      if (!k.choosing) return null;
      const steps = stepsOf(state, ms);
      if (!steps.some(st => st.id === 'breathe' && !st.off)) return null;
      const key = keysFor(steps, 'breathe', { layout: layoutIn(state) }).text;
      if (!key) return null;
      const words = hard ? 'keyShaking' : 'key';
      return { k, variant: `${words}${key}`, words, key, noHumour: true };
    },
    act: (ctx) => (ctx.k.inMode ? 'stop:breathe' : 'breathe'),
    text: {
      1: ['Hands shaking. Breathe: T.'],
      out: ['Hands shaking. Breathe: T.', 'Shaky hands. Breathe it down: T.', 'Your hands are going. Breathe: T.', 'Box breathing, now: T.'],
      shaking: ['Bangs. Your hands are shaking. Breathe: T.', 'That shook you. Breathe: T.', 'Hands shaking hard. Breathe it down: T.', 'In, hold, out, hold. Breathe: T.'],
      key: ['Breathe: {key}.', 'Hands shaking. Breathe: {key}.', 'Breathe it down: {key}.', 'In, hold, out, hold: {key}.'],
      keyShaking: ['Bangs. Your hands are shaking. Breathe: {key}.', 'That shook you. Breathe: {key}.', 'Hands shaking hard. Breathe: {key}.', 'Box it. Breathe: {key}.'],
    },
  },
  {
    id: 'pairs-wait', voice: 'di', repeatMs: PAIRS_REPEAT_MS, tone: 'calm', short: 'Wait', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k || k.inMode || !k.str || k.str.done || k.str.turnedMs !== null || k.str.turnAtMs === null) return null;
      // (where the chaos runs (the stress course, "Three bangs") Breathe is a step with its own row, so a wait line with no act
      // never names it (the design review of 0.0.10: "Breathe. It turns when it turns." at felt 0, where T did nothing))
      return k.R.stress || k.R.bangs ? { k, variant: 'stress', noHumour: true } : { k, noHumour: true };
    },
    act: () => null,
    text: { 1: ['Wait for it.', 'Let it come.', 'Eyes downrange. Wait for it.', 'Breathe. It turns when it turns.'],
      stress: ['Wait for it.', 'Let it come.', 'Eyes downrange. Wait for it.', 'Easy. It turns when it turns.'] },
  },
]);
