// OLYMPUS sim: the drill instructor's rules at Base Melas, the first playable's instinct (SKILLS §14.4; the build sheet 0.0.4 §2.2.8).
//
// Each rule is { id, voice: 'di', tone, short, when(state, me, ms) → ctx | null, text: { 1: [≥ 4
// lines] } (tier 1 this round: no skill tiers yet), humour?, act(ctx) → string | null, reach: null }.
// when() reads only what the character knows: the body as felt (BODY's stagesOf, its bands), the
// wrist's clock, where they stand and what they wear. The acts are what is at hand (the sheet §8,
// item 12): 'rise' (up from the rack), 'dress:utilities' (at your own rack's foot or your locker),
// 'activity:<id>' (the activity of the fixture you stand at); a line that sends you somewhere says
// where, and T then does nothing. The rules, most pressing first:
//   wound         by the wound  (0.0.7) the body's wound line in BODY §23.2's order (cues.js woundLine): an artery
//                         or a hard bleed and shock urgent, a bleed warn, the pain a note; its words are the line
//   anchor        urgent  (v0.0.24's step 5; AW§4.1 items 4 and 5; COMBAT §14.8) under 0.05 G with a gun up and nothing
//                         holding the body (footing.js footingOf 'float'), where the place gives an anchor: "Anchor before
//                         you fire." and T takes the best one (footing.js anchorOffers: the wedge, the boots on steel, the
//                         lanyard, the hold; the act 'anchor:<row>', shooting.js anchorAction); where none is in reach a
//                         note with no act, "No footing: nothing in reach to hold.", so a drill that cannot move says
//                         why out of the mode as its struck rows do in it (never a silent stall: AW's 4.0 m in 500 s);
//                         drifting past a hold, "Drifting. L to grab the hold." (no step takes a hold on the move: the
//                         grab's). It reads saved state only and never waits out a repeat (repeatMs 0): what it said
//                         before a load is runtime memory, so a save made through a burn carries on to the same line
//                         and the same T (the review of v0.0.24's A to C: after a load the note took the line from
//                         "Rifle back." for its three seconds, and T's presses differed)
//   aft           urgent  (v0.0.25, "Hold to hold"; COMBAT §14.8's feet aft; the build sheet v0.0.25 item 10) while a burn's warning
//                         is out or its change coming in (places/gravity.js bracePending) in a live operation's lane (op.js
//                         opLive: the Wreck's; a ship's own burn, Testudo's, keeps its scene's line) and the body stands on the deckhead
//                         or floats: "Feet aft." and T takes the face's row to the deck (shooting.js faceRows 'face:aft', the act
//                         'anchor:face:aft'); on the deck nothing (the boots on the deck are feet aft). Saved state only, no repeat
//                         wait (repeatMs 0), as 'anchor'. With more than AFT_DEFER_MS to the onset and a man you know of up and
//                         facing within AFT_THREAT_M, the man first: the line is the room's (the honest raider on 48213 went feet
//                         aft the instant the 1MC spoke, the hold's men waiting 1.5 s, 3b's par missed). Booted on the deck at a
//                         deck hatch with AFT_HOLD_MS or less to the onset (its leg's way in a deck hatch, not yet entered),
//                         "Feet aft. Hold on the deck for the burn." and T takes the Wait: the transit, the plant and the face back
//                         are longer than that (the review of C and D: the corporal by T on 1074 went through 8.3 s before the onset
//                         and hung on the hold's deckhead at it, not feet aft)
//   alarm         urgent  a drill open and you not mustered (or mustered and gone from your rack):
//                         up, utilities, the foot of your rack (T rises you, then dresses you at your
//                         rack); past the count, the words say you missed it, never its time
//                         (the review of v0.0.4: "The count is at 02:40" read at 02:41)
//   lead          note    lying down in sight before a sleep or a nap (time's lead): "Into the rack."
//                         (a move key takes it back; the review of v0.0.5's rack)
//   need-bladder  warn    the bladder at need, or could go at your rack after 21:00
//   need-bowel    warn    the bowel at need
//   need-thirst   warn    thirsty (T: a drink at a tap or a machine)
//   need-hunger   warn    hungry (T: a bar at the mail room's machine)
//   need-sleep    warn    exhausted at any hour, or tired after taps (T: sleep at your rack); tired
//                         from 21:00 to taps it is a note, not a warning: you will sleep tonight
//   need-dirt     warn    unwashed, from 05:00 to 21:50 (T: a shower at a stall)
//   woke          note    lying awake in the rack (T: up); between taps and reveille, back to sleep
//                         (T: sleep until reveille, in the berth) or, the bladder at need, the head
//   rack          note    21:50 to 22:00 and away from your rack
//   hands         note    (0.0.6) the hands dirty or past (HANDS' band 2, dirt 40) and a sink at hand
//                         (T: wash hands there), or within HANDS_NAG_MS 120 s of the head or a stall
//                         wherever you are, the words sending you to the basins (no act): the user,
//                         2026-11-06, "using the head shouldn't wash our hands"; quiet in a drill, on the
//                         range, lying or busy
//   stubble       note    stubble over 20 hours on a face that grows it, from 05:00 to 21:50 (T: shave
//                         at a sink, the single action since 0.0.6)
//   situation     calm    the next thing, when nothing else applies (in a drill: stand fast at your
//                         rack until the stand-down, T standing fast; by day free time, until the
//                         Plan of the Day and its board exist)
// The hair's rule (haircut, src/sim/skills/instinct/groom.js) is the hair role's, merged after these by
// src/sim/skills/instinct.js.
// The needs speak to a marine on their feet: lying awake, the line is to get up (woke), and in a drill
// the klaxon's line says it (alarm). While a drill is open nothing sends you from your rack (the
// integrator's call for 0.0.4: mustered at 02:35 the DI had said "Shave. Head A has mirrors."): the
// needs, the stubble and taps keep quiet, the bladder and the bowel but at urgent, and the calm line
// is to stand fast until the stand-down. On the range (0.0.5: a session, open or ended, src/sim/scenarios/
// handling.js rangeNow) the same holds: the needs speak at urgent only, the grooming and taps lines keep
// quiet, and the calm line is the range's (instinct/range.js). An operation off the range (combat/op.js opLive:
// state.cqb open where you stand) counts as the range here: the barracks' free time is never said mid-clear, and its calm
// line never stands over the drill's silence (the review of 2026-11-16: "Nothing on fire. Enjoy it while it lasts." through
// an operation, the private by T left with no act). doAct(state, bus, ctx, act) does an act,
// the instinct's T and nothing else; 'stop:<step>' acts go to the step panel (shooting.js chooseStep).
// Pure but doAct.
import { dayClock } from '../../../core/calendar.js';
import { playerActor, playerId } from '../../../core/ids.js';
import { siteDayOf } from '../../jobs.js';
import { routineOf, siteAt } from '../../places/env.js';
import { bodyOf, isAsleep } from '../../body/body.js';
import { stagesOf, hasBeard, woundLine } from '../../body/cues.js';
import { alertNow, mustered, musterOf, rackFootOf } from '../../time/alerts.js';
import { activitiesAt, startActivity, ownOf, spotOf, nextReveilleMs } from '../../time/activities.js';
import { HANDS_NAG_MS } from '../../../data/activities.js';
import { riseActor, outfitOf } from '../../people/place.js';
import { transPlaying } from '../../time/doing.js';
import { rangeNow } from '../../scenarios/handling.js';
import { kdAct } from '../../scenarios/range.js';
import { opLive, opOf } from '../../combat/op.js';
import { chooseStep, enterStop } from '../../arms/shooting.js';
import { stepOfAct } from './range.js';
import { anchorAction, faceRows } from '../../arms/shooting.js';
import { hatchOf } from '../../places/hatch.js';
import { bracePending, gravNow } from '../../places/gravity.js';
import { facingOf } from '../../arms/turners.js';
import { gravityAt } from '../../places/env.js';
import { footingOf, anchorOffers, driftingNow } from '../../body/footing.js';
import { holdNear } from '../../places/model.js';
import { GAIT_G, FOOTING } from '../../../data/body/needs.js';
import { handGunOf } from '../../arms/kit.js';

/** Feet aft waits for the man in front of you while the onset is further off than this (ms): a pair (1.85 s at the corporal) and the face (1.45 s), with room. */
export const AFT_DEFER_MS = 5_000;
/** How near a man you know of, up and facing, holds feet aft back (m): the compartment's, never the other deck's. */
export const AFT_THREAT_M = 12;
/** Booted on the deck at a deck hatch, the transit waits for the burn with the onset this near (ms): the honest tier one's transit, plant and face back, 10.35 s on 48213, with room. */
export const AFT_HOLD_MS = 12_000;
// (a transit through a deck hatch ahead: the lane's leg a deck hatch's (places/hatch.js) not yet entered; read from the operation's
// record, never the panel's rows (stepsOf, twice a tick under the warning, made the Wreck's busiest tick 2.8 ms))
const transitAhead = (state) => { const H = opOf(state), L = H?.rooms?.[H.cur]; return !!L && L.state !== 'entered' && L.state !== 'clear' && L.state !== 'passed' && hatchOf(state, L.door)?.kind === 'deck'; };
// (a threat or the armoured you know of (taken in: contact.js's known), standing, facing, within AFT_THREAT_M)
const threatKnownUp = (state, me, ms) => { const known = state.mind?.contact?.known ?? {};
  return (state.armoury?.range?.turners ?? []).some(t => (t.face === 'threat' || t.face === 'armoured') && known[t.key] !== undefined && (t.stoppedAtMs ?? null) === null
    && facingOf(t, ms) >= 0.5 && Math.hypot(t.x - me.x, t.z - me.z) <= AFT_THREAT_M); };

// (BODY's band ladders, so a rule names the band it fires at and reads the stage by its place in the ladder)
const LADDERS = Object.freeze({
  bladder: ['empty', 'could-go', 'need', 'urgent', 'bursting'],
  bowel: ['empty', 'could-go', 'need', 'urgent', 'desperate'],
  thirst: ['fine', 'thirsty', 'dry', 'parched', 'dehydrated', 'severe', 'collapse'],
  hunger: ['fed', 'peckish', 'hungry', 'very-hungry', 'weak', 'faint', 'starving'],
  hygiene: ['fresh', 'clean', 'grubby', 'unwashed', 'rank', 'filthy'],
  fatigue: ['fine', 'tired', 'exhausted', 'ragged', 'lost'],
  hands: ['clean', 'used', 'dirty', 'grimy'],
});
const norm = (b) => String(b ?? '').toLowerCase().replace(/[\s_]+/g, '-');
/** Whether a stage of a ledger is at a band or past it (by its name in BODY's ladder, else its index). */
export function atLeast(stages, ledger, band) {
  const st = stages?.[ledger];
  if (!st) return false;
  const L = LADDERS[ledger], want = L.indexOf(band), at = L.indexOf(norm(st.band));
  if (at >= 0) return at >= want;
  return (st.i ?? 0) >= want;
}

// (what the character feels and knows now: kept for the tick, every rule reads the same)
let memo = { state: null, ms: NaN, v: null };
function know(state, me, ms) {
  if (memo.state === state && memo.ms === ms) return memo.v;
  const pid = playerId(state), lon = siteDayOf(state), body = bodyOf(state, pid);   // (the site's day key: v0.0.24's stage 0)
  const stages = body ? stagesOf(body, ms, lon) : null;
  const c = dayClock(ms, lon), h = c.timeslip ? 24 + c.slipMs / 3_600_000 : c.civilMs / 3_600_000;
  const at = activitiesAt(state, me.x, me.z).filter(a => a.free);
  const m = musterOf(state, pid);
  const atRack = !!m && state.places?.live?.area === m.area && Math.hypot(me.x - m.x, me.z - m.z) <= 0.6;
  const nearRack = !!m && state.places?.live?.area === m.area && Math.hypot(me.x - m.x, me.z - m.z) <= 2;
  const own = ownOf(state);
  const atLocker = !!own.lockerId && at.some(a => a.fixtureId === own.lockerId);
  const R = routineOf(siteAt(state));
  const v = { pid, body, stages, h, R, at, atRack, nearRack, atLocker, posture: me.posture ?? 'stand', moving: transPlaying(me, ms), outfit: outfitOf(me),
    busy: !!state.skip || !!state.time?.doing, asleep: isAsleep(state, pid, ms), drill: state.time?.drills?.open ?? null, range: onRange(state) || opLive(state) };
  memo = { state, ms, v };
  return v;
}
// (a range session, open or ended: the needs keep quiet below urgent, the calm line is the range's: 0.0.5;
// once the line is clear the range's rules fall quiet too, so nothing speaks over the end card; v0.0.21: an operation
// off the range, op.js opLive, is read as one in know(), see the header)
const onRange = (state) => !!rangeNow(state);
const atFixture = (k, ...ids) => k.at.find(a => ids.includes(a.id)) ?? null;
const actAt = (k, ...ids) => { const a = atFixture(k, ...ids); return a ? `activity:${a.id}` : null; };
const hm = (h) => { const H = Math.floor(h) % 24, M = Math.floor((h - Math.floor(h)) * 60); return `${String(H).padStart(2, '0')}:${String(M).padStart(2, '0')}`; };
// (grooming is a day's business: the DI does not send you to the basins in the night. The day is the site's Plan of the
// Day (env.js routineOf, src/data/pod.js ROUTINES): from GROOM_EARLY_H before a working day's reveille to TAPS_WARN_H
// before taps, Melas's 05:00 to 21:50 as before; the holidays' later reveille does not move it)
const GROOM_EARLY_H = 0.5, TAPS_WARN_H = 10 / 60;
const dayH = (k) => k.h >= k.R.reveilleH - GROOM_EARLY_H && k.h < k.R.tapsH - TAPS_WARN_H;
// (the head or a stall ended within HANDS_NAG_MS: the log's last activity record says which, and when)
const fromHead = (state, ms) => {
  const log = state.log ?? [];
  for (let i = log.length - 1; i >= 0 && ms - log[i].atMs <= HANDS_NAG_MS; i--) if (log[i].kind === 'activity') return log[i].activity === 'urinate' || log[i].activity === 'bowel';
  return false;
};
// (the player's arrival at the open drill, if not since gone from it)
const arrivedAt = (state, al) => (state.time.attend ?? []).some(a => a.drill === al.drill && a.dueMs === al.dueMs && !Number.isFinite(a.leftMs));

/** The DI's rules (see the header), most pressing first. */
export const BASE_RULES = Object.freeze([
  {
    // (0.0.7: a wound first, in BODY §23.2's order (cues.js woundLine): an artery or a hard bleed urgent, shock, a bleed, the pain)
    id: 'wound', voice: 'di', tone: (ctx) => ctx.tone, short: 'Wound', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms), w = k.body ? woundLine(k.body, ms) : null;
      return w ? { k, tone: w.tone, said: w.text } : null;
    },
    text: { 1: ['{said}'] },
  },
  {
    // (ROADMAP "anywhere" step 5: a gun up while floating, an anchor in reach (see the header); gravity read first, so Mars and the Wheel pay a lookup)
    id: 'anchor', voice: 'di', tone: (ctx) => (ctx.step ? 'urgent' : 'note'), short: (ctx) => (ctx.step ? 'Anchor' : 'No footing'), reach: null, repeatMs: 0,
    when(state, me, ms) {
      void ms;
      if (!state.places?.live?.area || gravityAt(state, null, me.x, me.z).gG >= GAIT_G.FLOAT_BELOW_G) return null;
      // (on the void range while a station's command stands, the next step is instinct/void.js's, never "Anchor before you
      // fire" on the way to it (the user's report of 2026-11-19: the course said what to be, never what to press))
      const RA = state.armoury?.range;
      // (nor "grab the hold" on station five's standby and string, whose round is the floating one)
      if (RA?.course === 'anchors' && !RA.end && (RA.anchors?.phase === 'move' || (RA.anchors?.stations?.[RA.anchors.st]?.id === 'floating' && (RA.anchors.phase === 'standby' || RA.anchors.phase === 'string')))) return null;
      const pid = playerId(state), posture = state.people?.[pid]?.kit?.carry?.posture;
      const up = !!handGunOf(state, pid) || posture === 'lowReady' || posture === 'highReady' || posture === 'aimed';
      if (!up || footingOf(state, pid).mode !== 'float') return null;
      const best = anchorOffers(state, pid).find(o => o.ok);
      if (best) return { step: best.step, variant: best.kind, busy: !!state.skip || !!state.time?.doing };
      return { step: null, variant: driftingNow(state, pid) && holdNear(state, me.x, me.z, FOOTING.REACH_M) ? 'drift' : 'none' };
    },
    act: (ctx) => (ctx.busy || !ctx.step ? null : `anchor:${ctx.step}`),
    text: {
      1: ['Anchor before you fire.'],
      braced: ['Anchor before you fire. Wedge yourself across.', 'Anchor before you fire. Back on one face, boots on the other.'],
      boots: ['Anchor before you fire. Lock your boots.', 'Anchor before you fire. Boots down on the plate.'],
      tether: ['Anchor before you fire. Clip in.', 'Anchor before you fire. Lanyard on the pad-eye.'],
      handhold: ['Anchor before you fire. Take the hold.', 'Anchor before you fire. A hand on the hold.'],
      none: ['No footing: nothing in reach to hold.', 'No footing here. Nothing in reach to hold.'],
      drift: ['Drifting. L to grab the hold.', 'Drifting: L to grab the hold as you pass.'],
    },
  },
  {
    // (a burn's warning out, the body on the deckhead or floating: feet aft (see the header); the warning read first, so no
    // shipped scene without a profile reads more than a lookup)
    id: 'aft', voice: 'di', tone: (ctx) => (ctx.step ? 'urgent' : 'note'), short: 'Feet aft', reach: null, repeatMs: 0,
    when(state, me, ms) {
      void ms;
      if (!state.places?.live?.area || !bracePending(state) || !opLive(state)) return null;
      const pid = playerId(state), on = me.onFace === 'deckhead' || footingOf(state, pid).mode === 'float';
      // (booted on the deck at a deck hatch, the onset near: hold there (see the header); a man up and facing is the room's first)
      if (!on && me.anchor === 'boots' && me.onFace !== 'deckhead' && (gravNow(state)?.leftMs ?? 0) <= AFT_HOLD_MS && state.stop?.mode === 'stop' && transitAhead(state) && !threatKnownUp(state, me, state.clock.ms)) {
        return { step: state.stop.phase === 'choose' ? 'wait' : null, variant: 'hold', busy: !!state.skip || !!state.time?.doing };
      }
      if (!on || me.faceTo === 'deck') return null;
      if ((gravNow(state)?.leftMs ?? 0) > AFT_DEFER_MS && threatKnownUp(state, me, state.clock.ms)) return null;
      const row = faceRows(state, pid).find(r => r.id === 'face:aft');
      // (busy while a step of yours acts in stop motion (the hold's clearing bundle): the face change is taken once it ends, so T's
      // keycap is lit only when it can act; v0.0.25's fixer, the play review's 81 T presses on a lit "Feet aft." that did nothing)
      const acting = state.stop?.mode === 'stop' && state.stop.phase === 'act' && !!state.stop.doing && state.stop.doing.kind !== 'wait';
      return { step: row && !row.off ? row.id : null, variant: row && !row.off ? 1 : 'none', busy: !!state.skip || !!state.time?.doing || acting };
    },
    act: (ctx) => (ctx.busy || !ctx.step ? null : ctx.variant === 'hold' ? `stop:${ctx.step}` : `anchor:${ctx.step}`),
    text: {
      1: ['Feet aft.', 'Feet aft. Boots on the deck.'],
      hold: ['Feet aft. Hold on the deck for the burn.', 'Feet aft: stay on the deck, through after the burn.'],
      none: ['Feet aft. Get a hand on a hold.', 'Feet aft: nothing to put your boots on from here. Take a hold.'],
    },
  },
  {
    id: 'alarm', voice: 'di', tone: 'urgent', short: 'Klaxon', reach: null,
    when(state, me, ms) {
      const al = alertNow(state, ms);
      if (!al || mustered(state, playerId(state), ms)) return null;
      const k = know(state, me, ms);
      // (mustered once: quiet while you stay by your rack; gone from it, the klaxon's line again)
      if (arrivedAt(state, al) && k.nearRack) return null;
      // (while the rise plays the line still says up: the words and T's act change together once you stand)
      const variant = k.posture !== 'stand' || k.moving ? 'up' : k.outfit !== 'utilities' ? 'dress' : 'rack';
      // (past the count its time is no news: you missed it)
      if (al.phase === 'counted') return { variant: variant === 'up' ? 'up' : 'late', k, due: hm(k.h - (ms - al.dueMs) / 3_600_000) };
      return { variant, k, due: hm(k.h + (al.dueMs - ms) / 3_600_000) };
    },
    act(ctx) {
      const k = ctx.k;
      if (k.busy || k.moving) return null;
      if (k.posture !== 'stand') return 'rise';
      if (k.outfit !== 'utilities' && (k.atRack || k.atLocker)) return 'dress:utilities';
      return null;
    },
    text: {
      1: ['Klaxon. Up, utilities, the foot of your rack. Five minutes.'],
      up: ['Klaxon. Up, utilities, the foot of your rack. Five minutes.', 'That is the alert. Out of the rack. Now.', 'Alert drill. On your feet, marine.', 'Klaxon means now, not in a minute. Up.'],
      dress: ['Utilities. Boots. The count is at {due}.', 'Get dressed. Utilities, at your rack, before {due}.', 'PT kit is not the uniform of the day. Utilities.', 'Dress. The squad leader counts at {due}.'],
      rack: ['The foot of your rack. The count is at {due}.', 'Back to your rack. Stand at its foot.', 'Your place is the foot of your rack. Get there.', 'The count is at {due}. Be at your rack for it.'],
      late: ['You missed the count. Utilities, your rack, now.', 'The count was at {due}. The squad leader saw.', 'Late for the count. Your rack, before it gets worse.', 'The count went without you. Get to your rack.'],
    },
  },
  {
    id: 'lead', voice: 'di', tone: 'note', short: 'Rack', reach: null,
    // (lying down in sight before a sleep or a nap, time's lead: what you are doing while it plays; a move key takes it back)
    when(state, me, ms) { return state.time?.lead && !state.skip ? { k: know(state, me, ms) } : null; },
    act: () => null,
    text: { 1: ['Into the rack.', 'Into the rack. Lie down.', 'Rack. Lie down.', 'In you get.'] },
  },
  {
    id: 'need-bladder', voice: 'di', tone: 'warn', short: 'Head', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (k.busy || k.posture !== 'stand' || ((k.drill || k.range) && !atLeast(k.stages, 'bladder', 'urgent'))) return null;
      if (atLeast(k.stages, 'bladder', 'need')) return { k, variant: actAt(k, 'urinate') ? 'here' : 'go' };
      if (atLeast(k.stages, 'bladder', 'could-go') && k.nearRack && k.h >= k.R.tapsH - 1 && k.h < 24.7) return { k, variant: actAt(k, 'urinate') ? 'here' : 'night' };
      return null;
    },
    act: (ctx) => actAt(ctx.k, 'urinate'),
    text: {
      1: ['You need the head.'],
      go: ['Your bladder has opinions. The head is across the hall.', 'Find a urinal before your bladder finds one for you.', 'The head, across the hall. Go now, not at the count.', 'You need the head. Head A, across the hall.'],
      night: ['The head before the rack. You will thank yourself at two.', 'Empty the tank before lights out.', 'Nobody climbs out of a rack at two for fun. The head, now.', 'Head first, rack second. The order matters.'],
      here: ['A free urinal. Use it.', 'There it is. Go.', 'You are standing at the answer.', 'The head. A minute and change.'],
    },
  },
  {
    id: 'need-bowel', voice: 'di', tone: 'warn', short: 'Stall', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (k.busy || k.posture !== 'stand' || !atLeast(k.stages, 'bowel', 'need') || ((k.drill || k.range) && !atLeast(k.stages, 'bowel', 'urgent'))) return null;
      return { k, variant: actAt(k, 'bowel') ? 'here' : 'go' };
    },
    act: (ctx) => actAt(ctx.k, 'bowel'),
    text: {
      1: ['A stall, soon.'],
      go: ['A stall, soon. Head A, the steel doors on the right.', 'That is not going to wait for the weekend. The head.', 'Find a stall. Dignity is cheaper than an accident.', 'Your gut has made its decision. The head.'],
      here: ['A free stall. Take it.', 'There is a stall. Use it.', 'Six minutes behind a steel door. Go.', 'Sit down before you have to.'],
    },
  },
  {
    id: 'need-thirst', voice: 'di', tone: 'warn', short: 'Drink', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (k.busy || k.drill || k.range || k.posture !== 'stand' || !atLeast(k.stages, 'thirst', 'thirsty')) return null;
      return { k, variant: actAt(k, 'drink') ? 'here' : 'go' };
    },
    act: (ctx) => actAt(ctx.k, 'drink'),
    text: {
      1: ['Drink.'],
      go: ['Drink. There are taps in the head and a machine in the lounge.', 'You are drying out. A tap, the head, across the hall.', 'Water. Mars takes it out of you even indoors.', 'Thirsty marines make stupid mistakes. Find a tap.'],
      here: ['Drink. Half a litre.', 'A tap. Drink from it.', 'Water, right there. Drink.', 'Fill up while you are standing at it.'],
    },
  },
  {
    id: 'need-hunger', voice: 'di', tone: 'warn', short: 'Eat', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (k.busy || k.drill || k.range || k.posture !== 'stand' || !atLeast(k.stages, 'hunger', 'hungry')) return null;
      return { k, variant: actAt(k, 'snack') ? 'here' : 'go' };
    },
    act: (ctx) => actAt(ctx.k, 'snack'),
    text: {
      1: ['Eat something.'],
      go: ['The mail room\'s machine has bars.', 'Eat something. The machine in the mail room, by the lobby.', 'Hungry marines are slow marines. The mail room has a machine.', 'Your stomach is louder than you think. Bars, the mail room.'],
      here: ['A bar. Eat it.', 'Two hundred and fifty kilocalories of something. Take it.', 'The machine works. Eat.', 'Eat now. Chow is a long way off.'],
    },
  },
  {
    id: 'need-sleep', voice: 'di', short: 'Rack', reach: null,
    // (ordinary tiredness before taps is a note, the evening's; a warning is for exhaustion, or tired past taps)
    tone: (ctx) => (ctx?.evening ? 'note' : 'warn'),
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (k.busy || k.drill || k.range || k.posture === 'lie') return null;
      const tired = atLeast(k.stages, 'fatigue', 'tired') && (k.h >= k.R.tapsH - 1 || k.h < 4), exhausted = atLeast(k.stages, 'fatigue', 'exhausted');
      if (!tired && !exhausted) return null;
      const evening = !exhausted && k.h >= k.R.tapsH - 1 && k.h < k.R.tapsH;
      return { k, evening, variant: actAt(k, 'sleep') ? 'here' : evening ? 'evening' : 'go' };
    },
    act: (ctx) => actAt(ctx.k, 'sleep'),
    text: {
      1: ['Sleep.'],
      evening: ['Taps at 22:00. You will sleep tonight.', 'Tired. Taps is at 22:00, and the rack will keep.', 'The day is catching up with you. Taps at 22:00.', 'Yawning already. Taps soon enough.'],
      go: ['You are running on fumes. Your rack.', 'Tired. The rack is in the bay, where you left it.', 'Sleep is ammunition. Go and get some.', 'Your eyes are closing on their own. Your rack.'],
      here: ['Your rack. Get in it.', 'Lie down before you fall down.', 'The rack. Now.', 'Sleep. That is an order from your own body.'],
    },
  },
  {
    id: 'need-dirt', voice: 'di', tone: 'warn', short: 'Shower', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (k.busy || k.drill || k.range || k.posture !== 'stand' || !dayH(k) || !atLeast(k.stages, 'hygiene', 'unwashed')) return null;
      return { k, variant: actAt(k, 'shower') ? 'here' : 'go' };
    },
    act: (ctx) => actAt(ctx.k, 'shower'),
    text: {
      1: ['A shower.'],
      go: ['You smell like the track. The showers, Head A.', 'Unwashed. Your squad has noticed. Head A has showers.', 'Dust and sweat. Three minutes of water fixes it.', 'A shower. Head A, across the hall.'],
      here: ['A free stall. Three minutes of water.', 'Shower. Now, while it is free.', 'There is the water. Use your three minutes.', 'Get under it.'],
    },
  },
  {
    id: 'woke', voice: 'di', tone: 'note', short: 'Up', reach: null,
    when(state, me, ms) {
      // (the user's score of test-burn: never to a body strapped in (test-burn's rack: its straps hold him, riseActor refuses, Unstrap is R's))
      if (me?.strapped) return null;
      const k = know(state, me, ms);
      if (k.busy || k.moving || k.posture !== 'lie' || k.asleep || state.time?.drills?.open) return null;
      // (between taps and reveille: back to sleep, or the head first)
      const rev = nextReveilleMs(state, ms), left = rev - ms;
      const night = (k.h >= k.R.tapsH || k.h < 12) && left > 20 * 60_000 && left < 9 * 3_600_000;
      if (!night) return { k };
      if (atLeast(k.stages, 'bladder', 'need')) return { k, variant: 'head', night: true };
      return { k, variant: 'back', night: true, rev: hm(k.h + left / 3_600_000) };
    },
    act: (ctx) => (ctx.variant === 'back' ? 'sleep:reveille' : 'rise'),
    text: {
      1: ['Awake. On your feet.', 'Eyes open means feet on the deck.', 'You are awake. Act like it.', 'Up. The rack will still be here tonight.'],
      head: ['The head, then back in the rack.', 'Up, the head, and straight back. Quietly.', 'Your bladder woke you. The head, then the rack.', 'Head A and back. The squad is asleep.'],
      back: ['Back to sleep. Reveille is at {rev}.', 'Night still. Close your eyes. Reveille is at {rev}.', 'Nothing doing. Sleep till reveille, {rev}.', 'Back to sleep. The klaxon will tell you if it is otherwise.'],
    },
  },
  {
    id: 'rack', voice: 'di', tone: 'note', short: 'Taps', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (k.busy || k.drill || k.range || k.nearRack || !(k.h >= k.R.tapsH - TAPS_WARN_H && k.h < k.R.tapsH)) return null;
      return { k };
    },
    act: () => null,
    text: { 1: ['Lights out in ten. The rack is the one place nobody yells at you.', 'Taps at 22:00. Be in your rack for it.', 'Ten minutes to lights out. Your rack, in the bay.', 'Taps soon. Head to your rack.'] },
    humour: ['Taps at 22:00. Your rack misses you.'],
  },
  {
    id: 'hands', voice: 'di', tone: 'note', short: 'Hands', reach: null,
    // (dirty hands at a sink: wash them, T; just out of the head or a stall: the basins, wherever you stand)
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (k.busy || k.drill || k.range || k.asleep || k.posture !== 'stand' || !atLeast(k.stages, 'hands', 'dirty')) return null;
      if (actAt(k, 'wash-hands')) return { k, variant: 'here' };
      return fromHead(state, ms) ? { k, variant: 'go' } : null;
    },
    act: (ctx) => (ctx.variant === 'here' ? actAt(ctx.k, 'wash-hands') : null),
    text: {
      1: ['Wash your hands.'],
      here: ['Wash your hands.', 'Soap and water. Thirty seconds.', 'Hands. Wash them before you touch anything else.', 'A basin, soap, your hands. Now.'],
      go: ['The basins. Wash your hands.', 'Hands. The basins are by the door.', 'You came out of the head. Wash your hands.', 'Basins first. Your hands know where they have been.'],
    },
  },
  {
    id: 'stubble', voice: 'di', tone: 'note', short: 'Shave', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (k.busy || k.drill || k.range || k.posture !== 'stand' || !dayH(k) || !k.body || !hasBeard(k.body) || !((k.body.hygiene?.stubbleH ?? 0) > 20)) return null;
      return { k, variant: actAt(k, 'shave') ? 'here' : 'go' };
    },
    act: (ctx) => actAt(ctx.k, 'shave'),
    text: {
      1: ['Shave.'],
      go: ['That face has not met a razor since yesterday. The basins, Head A.', 'Stubble. The inspection will find it before you do.', 'Shave. Head A has mirrors.', 'A razor, a basin, five minutes. Find them.'],
      here: ['Shave. The razor will not use itself.', 'A basin and a mirror. Shave.', 'Foam, razor, cold water. Go.', 'Get the stubble off while you are here.'],
    },
  },
  {
    id: 'situation', voice: 'di', tone: 'calm', reach: null,
    short: (ctx) => (ctx.variant === 'drill' ? 'Stand fast' : ctx.variant === 'evening' ? 'Taps 22:00' : ctx.variant === 'night' ? 'Sleep' : 'Free time'),
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (k.busy || k.range) return null;
      if (k.drill) return { k, variant: 'drill', noHumour: true, end: hm(k.h + (k.drill.endMs - ms) / 3_600_000) };
      const variant = k.h >= 18 && k.h < k.R.tapsH ? 'evening' : k.h >= k.R.tapsH || k.h < k.R.reveilleH ? 'night' : 'day';
      return { k, variant };
    },
    // (in a drill, standing at your rack: T stands fast there until the stand-down)
    act: (ctx) => (ctx.variant === 'drill' && ctx.k.atRack && ctx.k.posture === 'stand' && !ctx.k.moving && ctx.k.outfit === 'utilities' ? 'standfast' : null),
    text: {
      1: ['Free time. Spend it like it costs something.'],
      evening: ['Taps at 22:00.', 'Free time till taps. Spend it like it costs something. It does.', 'Evening. The showers are free, the head is across the hall.', 'Taps at 22:00. Reveille at 05:30.'],
      night: ['Reveille at 05:30. Sleep while you can.', 'Lights out. Your rack is where you should be.', 'Night. The fire watch is awake so you do not have to be.', 'Sleep. Reveille comes either way.'],
      drill: ['Stand fast at the foot of your rack. Stand-down at {end}.', 'You are counted. Stay where you are until {end}.', 'At your rack, eyes front. The stand-down is at {end}.', 'Nobody leaves the bay until the stand-down, {end}.'],
      day: ['Free time. Spend it like it costs something.', 'Nothing on fire. Enjoy it while it lasts.', 'Squared away is a habit, not a mood.', 'Quiet hours are for the head, the showers and your kit.'],
    },
    humour: ['Nothing on fire. Enjoy it while it lasts.', 'Quiet. The Corps hates quiet.'],
  },
]);

/** Do an instinct's act (T): 'rise', 'dress:utilities', 'activity:<id>', 'standfast', 'sleep:reveille' (in your berth), 'stop:<step>' (a step of the panel: the range's rules), 'stop:enter' (G), 'kd:<id>' (the KD's police, turn-in, declaration) and 'anchor:<row>' (v0.0.24: an anchor's row or the boots' lock, shooting.js anchorAction). Returns whether it was done. */
export function doAct(state, bus, ctx, act) {
  const me = playerActor(state);
  if (!me || !act) return false;
  if (act === 'rise') return !!riseActor(state, me, state.clock.ms);
  if (act === 'stop:enter') return enterStop(state, bus, { via: 'ready' }).ok;
  if (act.startsWith('kd:')) return !!kdAct(state, bus, act.slice(3), ctx).ok;
  if (act.startsWith('anchor:')) return !!anchorAction(state, bus, act.slice(7)).ok;
  if (act.startsWith('stop:')) { const s = stepOfAct(act); return !!s && chooseStep(state, bus, { step: s.step, tempo: s.tempo, target: s.target }, ctx).ok; }
  if (act === 'standfast') return startActivity(state, bus, ctx, { id: 'standfast' }).ok;
  if (act === 'sleep:reveille') {
    const foot = rackFootOf(ownOf(state).seatId);
    return !!foot && startActivity(state, bus, ctx, { id: 'sleep', spotId: foot.id, args: { until: 'reveille' } }).ok;
  }
  if (act.startsWith('dress:')) {
    const to = act.slice(6), own = ownOf(state);
    const at = activitiesAt(state, me.x, me.z).find(a => a.id === 'dress' && a.free && (a.fixtureId === own.rackId || a.fixtureId === own.lockerId));
    if (!at) return false;
    return startActivity(state, bus, ctx, { id: 'dress', spotId: at.spotId, args: { to } }).ok;
  }
  if (act.startsWith('activity:')) {
    const id = act.slice(9);
    const at = activitiesAt(state, me.x, me.z).find(a => a.id === id && a.free);
    if (!at || !spotOf(state, at.spotId)) return false;
    // (T is the page's key, as R is: a sleep or a nap from your rack's foot lies you down in sight first, time's lead)
    return startActivity(state, bus, ctx, { id, spotId: at.spotId, lead: true }).ok;
  }
  return false;
}
