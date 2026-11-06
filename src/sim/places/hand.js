// OLYMPUS places: R, what's at hand (VIEWS's R; the build sheet 0.0.3 §2.1, §8 item 15; the 0.0.4 sheet §2.2.6).
//
// R does what is at hand, in this order (the 0.0.4 sheet §2.2.6):
//   rise      lying or sitting: get up (people/place.js riseActor);
//   activity  a free spot within SPOT_REACH_M 0.6 m whose use an activity takes (TIME's
//             activitiesAt): a shower stall the shower; a sink the basin (more: a drink); a urinal
//             the head, while the bladder holds more than URINATE_MIN_ML 50 mL; a toilet stall a stall
//             when the bowel could go, else the head; your own rack's foot, while a drill is open,
//             dressing into utilities when you are not in them, else standing fast until the
//             stand-down (TIME §7.3's stand-by: the review of v0.0.4, mustered, R had offered to lie
//             down); else sleep until reveille from 20:00 to 05:30, else a 45-minute nap (more: sleep
//             until reveille or +1, +2, +4, +8 h, naps of 20, 45 and 90 minutes, dressing). "Until
//             reveille" is offered only where it ends on it (not within its 20-minute least of
//             reveille, nor past its 12-hour most), and a sleep or a nap that reveille would cut is not
//             offered at all: the price is the one promise of what a skip costs. Your own locker
//             dressing into utilities from PT kit or a towel, else into PT kit (more: the other); a
//             machine a bar or a drink by its make. Another marine's rack or locker offers nothing;
//   door      the nearest door within DOOR_REACH_M 1.2 m of the player that a hand can turn, its
//             middle in the player's facing half-plane (or so close the player stands in it),
//             opened or closed; ties at one distance go by cmpId (TECH §2.3.1). On a ground the
//             doors are the masses' doors that name an opening; a gate is not a hand's to open;
//   resume    a cut shower within 2 m and 10 minutes ("finish your shower · 7 min", TIME §7.5); at
//             its own stall the stall's offer is the resume;
//   wait      else R's wait, fifteen minutes (TIME §7.3's stand-by, an outcome skip: reveille and the
//             klaxon stop it), which the page asks for twice.
// An offer carries its price (TIME §8.1): `${offer} · ${duration}, done ${HH:MM}`, with ', the count
// 02:35' while a drill is open, the late check (TIME §9.5: TIME's lateCheck, or null) and `more`, the
// other choices R held opens (the choices card); the slip's times as the watch shows them, '24:00 +12'.
// handOffer(state) is null while time stands still or a skip or an activity runs (TIME §5.3, check 1),
// or while one of the player's transitions plays (the rise from the rack, the step onto a spot), when
// R does nothing. In a drill, R's wait carries the late check too, so the page shows the late card.
//
// The places domain's actions (domain.js): `hand` (R) does what handOffer says, and `door`
// ({ act: 'door', args: { id, to } }: 'open' | 'closed', or the other way when to is left out) turns
// one door whatever the reach, for tests and the debug handle. The page sends R as { act: 'hand', args:
// { want: 'rise' | 'activity' | 'door' | 'resume' | 'wait', id?, args?, late? } }, what its offer said
// when the key went down, and the action does nothing where the offer has changed kind by the tick (a
// door the walk carried out of reach does not become a fifteen-minute wait, nor a wait a door); plain
// 'hand' (tests, bots, a replay) does what handOffer says. The page asks for the wait twice (R once
// arms it, "R again: wait 15 min", and a second R within HAND_AGAIN_MS sends it), so R pressed a step
// short of a door, or just after walking through one, never waits by accident (v0.0.3's review: in
// Ironman that cannot be taken back). An offer that is late opens the late card in the page, whose
// answers come back as { act: 'activity', args: { id, spotId, args, late: 'fit' | 'accepted' } }.
import { isHeld, durationText } from '../../core/clock.js';
import { playerActor, playerId, cmpId } from '../../core/ids.js';
import { marsClock } from '../../core/calendar.js';
import { liveArea, openingOf, openingState } from './model.js';
import { toggleDoor, turns } from './doors.js';
import { siteLonEDeg } from '../jobs.js';
import { WAIT_MS } from '../../data/activities.js';
import { activitiesAt, planOf, startActivity, resumeOf, defaultDressTo, lateCheck, nextReveilleMs } from '../time/activities.js';
import { activityOf, transPlaying } from '../time/doing.js';
import { riseActor, outfitOf } from '../people/place.js';
import { bodyOf } from '../body/body.js';
import { stagesOf } from '../body/cues.js';

/** How far a hand reaches for a door, metres (my call). */
export const DOOR_REACH_M = 1.2;
/** Standing this close to a door's middle, it is at hand whichever way one faces, metres (my call). */
export const IN_DOOR_M = 0.3;
/** Your rack offers sleep until reveille from SLEEP_FROM_H to SLEEP_TO_H, Melas time; a nap else (my calls). */
export const SLEEP_FROM_H = 20, SLEEP_TO_H = 5.5;
/** The head is offered while the bladder holds more than this, mL (my call: an empty bladder has nothing to give). */
export const URINATE_MIN_ML = 50;
const FACE = Object.freeze({ down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] });
const WAIT_OFFER = Object.freeze({ act: 'hand', verb: 'wait', target: null, label: `wait ${durationText(WAIT_MS)}`, id: 'wait', spotId: null, durMs: WAIT_MS });
const RISE_OFFER = Object.freeze({ act: 'hand', verb: 'rise', target: null, label: 'get up', id: null, spotId: null });

// (the doors of an area a hand can turn, with their middles: a floor's leaves, a ground's masses' doors naming an opening)
function doorsOf(area) {
  if (area.kind === 'ground') return (area.massing ?? []).flatMap(m => m.doors.filter(d => d.opening).map(d => ({ id: d.opening, x: (d.a + d.b) / 2, z: d.z })));
  return (area.openings ?? []).filter(turns).map(o => ({ id: o.id, x: o.axis === 'x' ? (o.a + o.b) / 2 : o.at, z: o.axis === 'x' ? o.at : (o.a + o.b) / 2 }));
}

// (the door at hand, or null)
function doorOffer(state, me, area) {
  const [fx, fz] = FACE[me.face] ?? FACE.down;
  let best = null, bestD = Infinity;
  for (const d of doorsOf(area)) {
    const dx = d.x - me.x, dz = d.z - me.z, dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > DOOR_REACH_M || (dist > IN_DOOR_M && dx * fx + dz * fz <= 0)) continue;
    if (dist < bestD || (dist === bestD && cmpId(d.id, best.id) < 0)) { best = d; bestD = dist; }
  }
  if (!best) return null;
  const open = openingState(state, openingOf(best.id)) === 'open';
  return Object.freeze({ act: 'hand', verb: open ? 'close' : 'open', target: best.id, label: open ? 'close the door' : 'open the door', id: null, spotId: null });
}

// (a clock time as the watch shows it: the slip as '24:00 +12', so one moment shows one number on every screen)
const hhmm = (ms, lon) => { const c = marsClock(ms, lon); return c.timeslip ? `24:00 +${Math.floor(c.slipMs / 60_000)}` : `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}`; };
const hourOf = (ms, lon) => { const c = marsClock(ms, lon); return c.timeslip ? 24 : c.civilMs / 3_600_000; };

/** An offer's words, TIME §8.1's price: 'shower · 10 min, done 19:41' (', the count 02:35' while a drill is open). */
export function priceOf(state, word, durMs) {
  const lon = siteLonEDeg(state), d = state.time?.drills?.open;
  const count = d && state.clock.ms < d.dueMs ? `, the count ${hhmm(d.dueMs, lon)}` : '';
  return `${word} · ${durationText(durMs)}, done ${hhmm(state.clock.ms + durMs, lon)}${count}`;
}

// (an activity as a choice: its plan, its words)
function choice(state, id, spotId, args = {}, word = null) {
  const p = planOf(state, id, { spotId, args });
  if (!p.ok) return null;
  return { id, spotId, args, label: priceOf(state, word ?? activityOf(id).offer, p.durMs), durMs: p.durMs, endMs: p.endMs, late: p.late, kind: p.kind };
}

// (what a spot offers first, and the rest R held shows)
function spotChoices(state, spot) {
  const lon = siteLonEDeg(state), h = hourOf(state.clock.ms, lon), me = playerActor(state);
  const at = (id) => spot.ids.includes(id);
  const list = [];
  const add = (...c) => { for (const x of c) if (x) list.push(x); };
  const sid = spot.spotId;
  if (at('shower')) add(choice(state, 'shower', sid));
  if (at('basin')) add(choice(state, 'basin', sid), choice(state, 'drink', sid));
  else if (at('drink') && !at('snack')) add(choice(state, 'drink', sid));
  if (at('snack')) add(choice(state, 'snack', sid));
  const body = at('bowel') || at('urinate') ? bodyOf(state, playerId(state)) : null;
  const pee = () => ((body?.bladder?.ml ?? 0) > URINATE_MIN_ML ? choice(state, 'urinate', sid) : null);
  if (at('bowel')) {
    const could = !!body && (stagesOf(body, state.clock.ms, lon)?.bowel?.i ?? 0) >= 1;
    add(...(could ? [choice(state, 'bowel', sid), pee()] : [pee(), choice(state, 'bowel', sid)]));
  } else if (at('urinate')) add(pee());
  if (at('sleep')) {
    const d = state.time?.drills?.open, inDrill = !!d && state.clock.ms < d.endMs;
    const night = h >= SLEEP_FROM_H || h < SLEEP_TO_H;
    const dress = choice(state, 'dress', sid, { to: defaultDressTo(state) }, `dress (${defaultDressTo(state) === 'pt' ? 'PT kit' : 'utilities'})`);
    // (a sleep or a nap is offered only where its price holds: reveille stops the night, so none runs past it,
    // and "until reveille" only where the plan ends on it)
    const rev = nextReveilleMs(state);
    const holds = (c) => (c && c.endMs <= rev ? c : null);
    const untilRev = choice(state, 'sleep', sid, { until: 'reveille' }, 'sleep until reveille');
    const sleeps = [untilRev && untilRev.endMs === rev ? untilRev : null,
      ...[1, 2, 4, 8].map(n => holds(choice(state, 'sleep', sid, { forMs: n * 3_600_000 }, 'sleep')))];   // (the price says how long: 'sleep · 1 h, done 23:40')
    const naps = [20, 45, 90].map(m => holds(choice(state, 'nap', sid, { min: m }, 'nap')));
    if (inDrill && outfitOf(me) !== 'utilities') add(dress, ...sleeps, ...naps);
    else if (inDrill) add(choice(state, 'standfast', null, {}, 'stand fast'), ...sleeps, ...naps);
    else if (night) add(sleeps[0], ...naps, ...sleeps.slice(1), dress);
    else add(naps[1], naps[0], naps[2], ...sleeps, dress);
  } else if (at('dress')) {
    const o = outfitOf(me), first = defaultDressTo(state), other = first === 'pt' ? 'utilities' : 'pt';
    add(choice(state, 'dress', sid, { to: first }, `dress (${first === 'pt' ? 'PT kit' : 'utilities'})`));
    if (other !== o) add(choice(state, 'dress', sid, { to: other }, `dress (${other === 'pt' ? 'PT kit' : 'utilities'})`));
  }
  return list.filter(c => !(c.id === 'dress' && c.durMs <= 0));
}

// (the nearest free spot at hand that offers something, its choices)
function activityOffer(state, me) {
  const at = activitiesAt(state, me.x, me.z).filter(a => a.free);
  if (!at.length) return null;
  const bySpot = new Map();
  for (const a of at) { if (!bySpot.has(a.spotId)) bySpot.set(a.spotId, { spotId: a.spotId, fixtureId: a.fixtureId, ids: [] }); bySpot.get(a.spotId).ids.push(a.id); }
  for (const spot of bySpot.values()) {
    const r = resumeOf(state);
    if (r && r.spotId === spot.spotId) {
      const c = choice(state, r.activity, r.spotId, { resume: resumeArgs(r) }, `finish your ${activityOf(r.activity).offer}`);
      if (c) return Object.freeze({ act: 'hand', verb: 'resume', target: spot.fixtureId, ...c, more: [] });
    }
    const list = spotChoices(state, spot);
    if (!list.length) continue;
    const [first, ...more] = list;
    return Object.freeze({ act: 'hand', verb: 'activity', target: spot.fixtureId, ...first, more: more.map(c => ({ id: c.id, spotId: c.spotId, args: c.args, label: c.label, durMs: c.durMs, late: c.late })) });
  }
  return null;
}

/** What R would do now (see the header): { act: 'hand', verb, target, id, spotId, label, durMs, endMs, late, more } | null. */
export function handOffer(state) {
  if (!state || state.skip || isHeld(state) || state.time?.doing) return null;
  const me = playerActor(state), area = liveArea(state);
  if (!me || !area) return WAIT_OFFER;
  if (transPlaying(me, state.clock.ms)) return null;
  if ((me.posture ?? 'stand') !== 'stand') return RISE_OFFER;
  const act = activityOffer(state, me);
  if (act) return act;
  const door = doorOffer(state, me, area);
  if (door) return door;
  const r = resumeOf(state);
  if (r) {
    const c = choice(state, r.activity, r.spotId, { resume: resumeArgs(r) }, `finish your ${activityOf(r.activity).offer}`);
    if (c) return Object.freeze({ act: 'hand', verb: 'resume', target: null, ...c, more: [] });
  }
  // (in a drill the wait is late like anything else that keeps you from the muster: the page shows the late card)
  const d = state.time?.drills?.open;
  if (d && state.clock.ms < d.endMs) { const late = lateCheck(state, 'wait', null, WAIT_MS); if (late) return Object.freeze({ ...WAIT_OFFER, late }); }
  return WAIT_OFFER;
}
// (a resume's args: what is left and the outfit worn into it)
const resumeArgs = (r) => ({ remainingMs: r.remainingMs, ...(r.outfit ? { outfit: r.outfit } : {}) });

const KIND_OF_VERB = Object.freeze({ open: 'door', close: 'door', rise: 'rise', activity: 'activity', resume: 'resume', wait: 'wait' });

/** The `hand` action (R): what handOffer says, unless the page's want names another kind (see the header). */
export function handAction(state, action, bus, ctx) {
  const offer = handOffer(state);
  if (!offer) return;
  const args = typeof action === 'object' ? action?.args ?? {} : {};
  const want = args.want ?? null, kind = KIND_OF_VERB[offer.verb];
  if (want && want !== kind) return;
  switch (offer.verb) {
    case 'rise': riseActor(state, playerActor(state), state.clock.ms); return;
    case 'wait': startActivity(state, bus, ctx, { id: 'wait' }); return;
    case 'open': case 'close': toggleDoor(state, offer.target, bus, { who: playerId(state) }); return;
    case 'resume': case 'activity': {
      // (a choice from R held: its id and args, if the spot still offers it; else the offer itself)
      let pick = offer;
      if (args.id && (args.id !== offer.id || JSON.stringify(args.args ?? {}) !== JSON.stringify(offer.args ?? {}))) {
        pick = (offer.more ?? []).find(c => c.id === args.id && JSON.stringify(c.args ?? {}) === JSON.stringify(args.args ?? {})) ?? null;
        if (!pick) return;
      }
      startActivity(state, bus, ctx, { id: pick.id, spotId: pick.spotId, args: pick.args ?? {}, late: args.late ?? null });
      return;
    }
    default: return;
  }
}

/** The `door` action ({ act: 'door', args: { id, to } }): one door turned, whatever the reach (tests, the debug handle). */
export function doorAction(state, action, bus) {
  const args = typeof action === 'object' ? action.args ?? {} : {};
  if (!args.id || state.skip || isHeld(state)) return;
  toggleDoor(state, args.id, bus, { who: playerId(state), to: args.to ?? null });
}

