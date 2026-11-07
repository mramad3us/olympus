// OLYMPUS places: R, what's at hand: the quick action R tapped does, and the menu R held opens (VIEWS §10.1's R; TIME §8; the build sheet 0.0.6 §2.1).
//
// The user, 2026-11-06, after playing v0.0.4: "quick action needs to be the most obvious ... going to the
// basin, R should wash hands if hygiene is low enough, drink if we're thristy and shave if none of the
// above (use a priority thing and R is the most urgent), long pressing R should open the menu with all the
// possible interractions as single actions". So every spot offers single actions, never bundles (v0.0.4's
// basin did teeth, a shave and the face on one R, its words not saying so), R tapped does one of them,
// named with its time before you press, and R held lists them all.
//
// handMenu(state) is the menu R held opens: { title, spotId, fixtureId, quick, rows: [Row] }, its rows the
// nearest spot's single actions in ROWS' order (src/data/activities.js: the order one does them in, a
// chain's too), a resume first (a cut shower: "finish your shower · 7 min", TIME §7.5), the door at hand
// and R's wait last; with no spot, the door's row and the wait. A Row is { key, id, verb, spotId, words,
// args, durMs, label, late, off, choices, pick }: verb 'activity' | 'resume' | 'open' | 'close' | 'wait'
// (what R sends for it: places' `hand` wants), words its name ('wash hands'), label its price
// (priceOf: 'wash hands · 30 s', 'shave · 4 min, done 19:46'), late TIME §9.5's late check (a late row is
// not struck: it goes through the late card), off why it is struck (TIME's offOf: 'clean-shaven', 'buzzed
// today', 'nothing to give', 'already in PT kit', 'reveille comes first', 'the barber opens at 10:00',
// 'taken'; shown, never done). A row with a parameter carries its choices, one drop-down, never eight
// rows (the user's "lists that read"): sleep (until reveille, 1, 2, 4 or 8 h), a nap (20, 45 or 90 min),
// dressing (PT kit, utilities), the barber's cut (cutsFor: a thinning man's the shaved head only); each
// choice { key, words, args, durMs, label, late, off }, pick its default (until reveille, 45 min, the
// outfit defaultDressTo gives, your own cut), moved to the first not struck where it is; the row's own
// fields are its pick's. "Until reveille" is struck where its plan would not end on reveille ('reveille
// is over 12 h off': SLEEP_MAX_MS; v0.0.5's rule, my call on the words).
// handOffer(state) is R's quick action: { act: 'hand', verb, target, id, spotId, args, label, durMs,
// endMs, late, why, rows, more, struck }. At a spot it is the first [id, test] of PRIORITY whose row is
// not struck and whose test holds (why the test); at a spot with a PRIORITY where none holds, nothing is
// due and R goes on down its order to the door or the wait (the fixer's, 0.0.6: "R is the most urgent",
// so a sink with clean hands, no thirst and a clean face offers the wait, the menu the rest); at a spot
// with none the first row not struck in ROWS' order (why null); every row struck, R goes on down its
// order (the build sheet 0.0.6 §2.1). struck, where R is not the spot's own action, is the spot's first
// struck row as { words, off } ('use the head', 'nothing to give'), for the plate to say why:
//   rise      lying or sitting: get up (people/place.js riseActor);
//   activity  the nearest free spot within SPOT_REACH_M 0.6 m with a row not struck, its quick action:
//             a sink: wash hands when the hands are dirty (HANDS.WASH_AT_I: dirt 40), else drink when
//             thirsty (thirst's band 1), else shave where stubble shows (STUBBLE_SHOWS_H 12 h on a face
//             that grows a beard), else buzz your head when a shaved head is due (hairOf's band 2), else
//             nothing (the wait); a shower stall the shower (its resume first); a urinal the head while the
//             bladder holds more than URINATE_MIN_ML 50 mL; a toilet stall a stall when the bowel could
//             go, else the head over 50 mL, else nothing; your own rack's foot, while a drill is open, dressing into utilities
//             when you are not in them, else standing fast until the stand-down (TIME §7.3's stand-by);
//             else sleep until reveille from 20:00 to 05:30, else a 45-minute nap; your locker dressing
//             (defaultDressTo); a tap or a fountain a drink; a machine a bar or a drink by its make; the
//             barber's pole a haircut in your own cut, 10:00 to 20:00 (BARBER_H), struck while the cut is
//             fresh (hairOf's step 0: 'fresh from the barber'). A sleep or a nap that
//             reveille would cut is struck: the price is the one promise of what a skip costs;
//   door      the nearest door within DOOR_REACH_M 1.2 m of the player that a hand can turn, its
//             middle in the player's facing half-plane (or so close the player stands in it),
//             opened or closed; ties at one distance go by cmpId (TECH §2.3.1). On a ground the
//             doors are the masses' doors that name an opening; a gate is not a hand's to open;
//   resume    a cut shower within 2 m and 10 minutes ("finish your shower · 7 min", TIME §7.5);
//   wait      else R's wait, fifteen minutes (TIME §7.3's stand-by, an outcome skip: reveille and the
//             klaxon stop it), which the page asks for twice.
// rows is how many rows R held shows; more (v0.0.5's readers) every choice of the spot's other rows and
// the quick row's other choices, flattened, struck ones left out. An offer's label is TIME's priceOf
// (', done HH:MM' from DONE_FROM_MS 60 s; ', the count 02:35' while a drill's count is to come).
// handOffer and handMenu are null while time stands still or a skip or an activity runs (TIME §5.3, check
// 1), while stop motion is on (state.stop: the mode, or a lived V, A or W step: 0.0.5), on the range's
// firing line from the brief to the end (state.armoury.range: the tower runs it), or while one of the
// player's transitions plays (the rise from the rack, the step onto a spot), when R does nothing; lying,
// R gets you up and the menu is null. In a drill, R's wait carries the late check too, so the page shows
// the late card. titleOf(spot) names the menu: 'The sink', 'The shower', 'The head', 'Your rack', 'Your
// locker', 'The tap', 'The machine', 'The barber's', 'The door', 'Standing by'.
//
// The places domain's actions (domain.js): `hand` (R) does what handOffer says, and `door`
// ({ act: 'door', args: { id, to } }: 'open' | 'closed', or the other way when to is left out) turns
// one door whatever the reach, for tests and the debug handle. The page sends R as { act: 'hand', args:
// { want: 'rise' | 'activity' | 'door' | 'resume' | 'wait', id?, args?, late?, lead? } } (lead: a sleep
// or a nap from your rack's foot lies you down in sight first, src/sim/time/activities.js), what its offer said
// when the key went down, and the action does nothing where the offer has changed kind by the tick (a
// door the walk carried out of reach does not become a fifteen-minute wait, nor a wait a door); plain
// 'hand' (tests, bots, a replay) does what handOffer says; with an id, one of the offer's choices (more),
// if the spot still offers it. The page asks for the wait twice (R once arms it, "R again: wait 15 min",
// and a second R within HAND_AGAIN_MS sends it), so R pressed a step short of a door, or just after walking
// through one, never waits by accident (v0.0.3's review: in Ironman that cannot be taken back). R held's
// menu sends one row as the time domain's { act: 'activity', args: { id, spotId, args, lead } } (the wait
// too, as time's; a door's as `hand` with from 'menu' and its target, turned if it is still at hand whatever
// R tapped would do), two or more as one { act: 'chain', args: { spotId, steps } } (TIME's chain.js).
// An offer that is late opens the late card in the page, whose answers come back as { act: 'activity',
// args: { id, spotId, args, late: 'fit' | 'accepted' } }.
import { isHeld, durationText } from '../../core/clock.js';
import { playerActor, playerId, cmpId } from '../../core/ids.js';
import { marsClock } from '../../core/calendar.js';
import { liveArea, openingOf, openingState } from './model.js';
import { toggleDoor, turns } from './doors.js';
import { siteLonEDeg } from '../jobs.js';
import { WAIT_MS, ROWS, PRIORITY, NAP_MIN, STUBBLE_SHOWS_H, SLEEP_MAX_MS } from '../../data/activities.js';
import { HANDS } from '../../data/body/needs.js';
import { CUTS } from '../../data/people/looks.js';
import { activitiesAt, planOf, offOf, startActivity, resumeOf, defaultDressTo, lateCheck, nextReveilleMs, priceOf, actionWords, spotOf, URINATE_MIN_ML } from '../time/activities.js';
import { activityOf, transPlaying } from '../time/doing.js';
import { riseActor, outfitOf } from '../people/place.js';
import { bodyOf } from '../body/body.js';
import { stagesOf, hasBeard } from '../body/cues.js';
import { hairOf, cutsFor } from '../body/hair.js';

export { priceOf, URINATE_MIN_ML };
/** How far a hand reaches for a door, metres (my call). */
export const DOOR_REACH_M = 1.2;
/** Standing this close to a door's middle, it is at hand whichever way one faces, metres (my call). */
export const IN_DOOR_M = 0.3;
/** Your rack offers sleep until reveille from SLEEP_FROM_H to SLEEP_TO_H, Melas time; a nap else (my calls). */
export const SLEEP_FROM_H = 20, SLEEP_TO_H = 5.5;
/** The sleep's chosen lengths, hours, after "until reveille" (v0.0.4's R held). */
export const SLEEP_FOR_H = Object.freeze([1, 2, 4, 8]);
const FACE = Object.freeze({ down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] });
const WAIT_LABEL = `wait ${durationText(WAIT_MS)}`;
const WAIT_OFFER = Object.freeze({ act: 'hand', verb: 'wait', target: null, label: WAIT_LABEL, id: 'wait', spotId: null, args: {}, durMs: WAIT_MS, why: null, rows: 1, more: [] });
const RISE_OFFER = Object.freeze({ act: 'hand', verb: 'rise', target: null, label: 'get up', id: null, spotId: null, args: {}, why: null, rows: 0, more: [] });
const TITLES = Object.freeze({ wash: 'The sink', shower: 'The shower', urinate: 'The head', toilet: 'The head', sleep: 'Your rack', dress: 'Your locker', drink: 'The tap', buy: 'The machine', haircut: 'The barber\'s', door: 'The door' });

/** The menu's title for a spot (a spot, or its use): 'The sink', …; 'Standing by' with nothing at hand. */
export const titleOf = (spot) => TITLES[typeof spot === 'string' ? spot : spot?.use] ?? 'Standing by';

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
  return Object.freeze({ act: 'hand', verb: open ? 'close' : 'open', target: best.id, label: open ? 'close the door' : 'open the door', id: null, spotId: null, args: {}, why: null });
}

const hourOf = (ms, lon) => { const c = marsClock(ms, lon); return c.timeslip ? 24 : c.civilMs / 3_600_000; };

// ---- the rows ----

// (one choice of a row: its plan, its words, struck or late; rev the next reveille, read once a menu)
function choiceOf(state, sp, id, args, key, words, rev) {
  const p = planOf(state, id, { spotId: sp?.id ?? null, args });
  let off = offOf(state, id, activityOf(id).uses.length ? sp : null, args, { plan: p.ok ? p : null });
  if (!off && !p.ok) off = p.why;
  // (until reveille only where it ends on reveille: past SLEEP_MAX_MS of it, the plan would end before)
  if (!off && id === 'sleep' && key === 'reveille' && p.ok && p.endMs < rev) off = 'reveille is over 12 h off';
  const durMs = p.ok ? p.durMs : 0;
  return { key, words, args, durMs, label: priceOf(state, actionWords(state, id, args), durMs), late: p.ok ? p.late : null, off };
}

// (a row's choices and its default pick, or null for a row with none)
function choicesOf(state, sp, id, rev) {
  const me = playerActor(state);
  switch (id) {
    case 'sleep': return {
      list: [choiceOf(state, sp, id, { until: 'reveille' }, 'reveille', 'until reveille', rev),
        ...SLEEP_FOR_H.map(h => choiceOf(state, sp, id, { forMs: h * 3_600_000 }, `${h}h`, `${h} h`, rev))],
      pick: 0 };
    case 'nap': return { list: NAP_MIN.map(m => choiceOf(state, sp, id, { min: m }, `${m}min`, `${m} min`, rev)), pick: NAP_MIN.indexOf(45) };
    case 'dress': {
      const list = ['pt', 'utilities'].map(to => choiceOf(state, sp, id, { to }, to, to === 'pt' ? 'PT kit' : 'utilities', rev));
      return { list, pick: list.findIndex(c => c.key === defaultDressTo(state, outfitOf(me))) };
    }
    case 'haircut': {
      const p = state.people?.[playerId(state)], cuts = cutsFor(p), own = hairOf(state, playerId(state))?.cut;
      const list = cuts.map(cut => choiceOf(state, sp, id, { cut }, cut, CUTS[cut]?.word ?? cut, rev));
      return { list, pick: Math.max(0, cuts.indexOf(own)) };
    }
    default: return null;
  }
}

// (a spot's row for a single action: its choices folded into one drop-down, its fields its pick's)
function rowOf(state, sp, spot, id, rev) {
  const rec = activityOf(id), ch = choicesOf(state, sp, id, rev);
  const base = { key: id, id, verb: 'activity', spotId: spot.spotId, fixtureId: spot.fixtureId };
  if (!ch) {
    const c = choiceOf(state, sp, id, {}, id, actionWords(state, id, {}), rev);
    return { ...base, words: c.words, args: {}, durMs: c.durMs, label: c.label, late: c.late, off: c.off, choices: null, pick: null };
  }
  let pick = ch.pick >= 0 ? ch.pick : 0;
  if (ch.list[pick]?.off) { const free = ch.list.findIndex(c => !c.off); if (free >= 0) pick = free; }
  const c = ch.list[pick];
  return { ...base, words: rec.offer, args: c.args, durMs: c.durMs, label: c.label, late: c.late, off: c.off, choices: ch.list, pick };
}

// (the spots at hand with their single actions, nearest first, ties by id)
function spotsAt(state, me) {
  const bySpot = new Map();
  for (const a of activitiesAt(state, me.x, me.z)) {
    if (!bySpot.has(a.spotId)) bySpot.set(a.spotId, { spotId: a.spotId, fixtureId: a.fixtureId, use: a.use, free: a.free, ids: [] });
    bySpot.get(a.spotId).ids.push(a.id);
  }
  return [...bySpot.values()];
}

// (a resume's args: what is left and the outfit worn into it)
const resumeArgs = (r) => ({ remainingMs: r.remainingMs, ...(r.outfit ? { outfit: r.outfit } : {}) });
// (the resume's row: "finish your shower · 7 min")
function resumeRow(state, r) {
  const args = { resume: resumeArgs(r) }, p = planOf(state, r.activity, { spotId: r.spotId, args });
  if (!p.ok) return null;
  const words = actionWords(state, r.activity, args);
  return { key: 'resume', id: r.activity, verb: 'resume', spotId: r.spotId, fixtureId: r.spot?.fixture ?? null, words, args, durMs: p.durMs, label: priceOf(state, words, p.durMs), late: p.late, off: null, choices: null, pick: null };
}
const doorRow = (o) => ({ key: 'door', id: null, verb: o.verb, spotId: null, fixtureId: null, target: o.target, words: o.label, args: {}, durMs: 0, label: o.label, late: null, off: null, choices: null, pick: null });
const waitRow = (late) => ({ key: 'wait', id: 'wait', verb: 'wait', spotId: null, fixtureId: null, words: 'wait', args: {}, durMs: WAIT_MS, label: WAIT_LABEL, late, off: null, choices: null, pick: null });

// ---- R's priority (the user, 2026-11-06: "use a priority thing and R is the most urgent") ----

// (the priority tests of PRIORITY, by name: what the character feels, the clock on the wrist; row the row the test would pick)
const TESTS = Object.freeze({
  hands: (k) => (k.stages?.hands?.i ?? 0) >= HANDS.WASH_AT_I,
  thirst: (k) => (k.stages?.thirst?.i ?? 0) >= 1,
  stubble: (k) => !!k.body && hasBeard(k.body) && (k.body.hygiene?.stubbleH ?? 0) >= STUBBLE_SHOWS_H,
  haircut: (k) => k.hair?.cut === 'shaved' && (k.hair?.band?.i ?? 0) >= 2,
  bowel: (k) => (k.stages?.bowel?.i ?? 0) >= 1,
  bladder: (k) => (k.body?.bladder?.ml ?? 0) > URINATE_MIN_ML,
  drill: (k, row) => k.drill && (row.id !== 'dress' || row.args?.to === 'utilities'),
  night: (k) => k.h >= SLEEP_FROM_H || k.h < SLEEP_TO_H,
  day: (k) => !(k.h >= SLEEP_FROM_H || k.h < SLEEP_TO_H),
});
/** The priority tests' names (PRIORITY's second column), for the tests. */
export const PRIORITY_TESTS = Object.freeze(Object.keys(TESTS));

// (what the tests read, once a menu)
function knowOf(state) {
  const pid = playerId(state), body = bodyOf(state, pid), lon = siteLonEDeg(state), ms = state.clock.ms, d = state.time?.drills?.open;
  return { body, stages: body ? stagesOf(body, ms, lon) : null, hair: hairOf(state, pid, ms), h: hourOf(ms, lon), drill: !!d && ms < d.endMs };
}

// (a spot's quick row: the first PRIORITY test that holds on a row not struck; at a spot with a PRIORITY, none
// holding, nothing is due there and R is the wait (or the door at hand), the menu holding the rest (the user's
// "R is the most urgent": a plate that always shows a chore stops being read; the fixer's, 0.0.6, overruling
// the integrator's "always a real action" at a sink, and a stall's six minutes for nothing); a spot with no
// PRIORITY the first row not struck; null when all are)
function quickOf(state, spot, rows, k) {
  const pri = PRIORITY[spot.use === 'sleep' && k.drill ? 'drill' : spot.use];
  for (const [id, test] of pri ?? []) {
    const row = rows.find(r => r.id === id && r.verb === 'activity' && !r.off);
    if (row && TESTS[test](k, row)) return { row, why: test };
  }
  if (pri && rows.some(r => !r.off)) return { row: null, why: null, idle: true };
  const row = rows.find(r => !r.off);
  return row ? { row, why: null } : null;
}

// (why the spot's own action is not R's: its first struck row, PRIORITY's order first, as { words, off }, so the plate
// says it before R is held, "use the head: nothing to give"; null where R is the spot's own or nothing there is struck)
function struckOf(spot, rows, k) {
  if (!spot) return null;
  const order = (PRIORITY[spot.use === 'sleep' && k.drill ? 'drill' : spot.use] ?? []).map(([id]) => id);
  const own = rows.filter(r => r.verb === 'activity' && r.spotId === spot.spotId);
  const first = order.map(id => own.find(r => r.id === id && r.off)).find(Boolean) ?? own.find(r => r.off);
  return first ? { words: first.words, off: first.off } : null;
}

// (R and R held at once: the menu and its quick row, or a kind with no menu)
function menuOf(state) {
  if (!state || state.skip || isHeld(state) || state.time?.doing || state.stop || state.time?.lead) return { none: true };
  if (state.armoury?.range) return { none: true };
  const me = playerActor(state), area = liveArea(state);
  if (!me || !area) return { rows: [waitRow(null)], quick: { row: null, why: null }, wait: true, title: titleOf(null), spot: null };
  if (transPlaying(me, state.clock.ms)) return { none: true };
  if ((me.posture ?? 'stand') !== 'stand') return { rise: true };
  const k = knowOf(state), rev = nextReveilleMs(state), r = resumeOf(state);
  const door = doorOffer(state, me, area);
  // (the nearest free spot with a row not struck; else the nearest spot, its rows struck, so R held shows why)
  let spot = null, rows = [], quick = null;
  for (const s of spotsAt(state, me)) {
    const sp = spotOf(state, s.spotId);
    const list = s.ids.map(id => rowOf(state, sp, s, id, rev));
    const rs = r && r.spotId === s.spotId ? resumeRow(state, r) : null;
    if (rs) list.unshift(rs);
    const q = rs ? { row: rs, why: null } : s.free ? quickOf(state, s, list, k) : null;
    if (q) { spot = s; rows = list; quick = q.row ? q : null; break; }
    if (!spot) { spot = s; rows = list; }
  }
  if (!quick && r && !rows.some(x => x.verb === 'resume')) { const rs = resumeRow(state, r); if (rs) { rows = [rs, ...rows]; if (!door) quick = { row: rs, why: null }; } }
  if (door) rows = [...rows, doorRow(door)];
  // (in a drill the wait is late like anything else that keeps you from the muster: the page shows the late card)
  const late = k.drill ? lateCheck(state, 'wait', null, WAIT_MS) : null;
  rows = [...rows, waitRow(late)];
  if (!quick) quick = { row: door ? rows.find(x => x.key === 'door') : rows.find(x => x.verb === 'resume') ?? rows.at(-1), why: null };
  const struck = quick.row?.verb === 'activity' ? null : struckOf(spot, rows, k);
  return { rows, quick, spot, struck, title: titleOf(spot ?? (door ? 'door' : null)) };
}

/** The menu R held opens (see the header), or null. */
export function handMenu(state) {
  const m = menuOf(state);
  if (m.none || m.rise) return null;
  return { title: m.title, spotId: m.spot?.spotId ?? null, fixtureId: m.spot?.fixtureId ?? null, quick: m.quick.row?.key ?? 'wait', rows: m.rows };
}

/** What R would do now (see the header): { act: 'hand', verb, target, id, spotId, args, label, durMs, endMs, late, why, rows, more } | null. */
export function handOffer(state) {
  const m = menuOf(state);
  if (m.none) return null;
  if (m.rise) return RISE_OFFER;
  const q = m.quick.row;
  const struck = m.struck ?? null;
  if (!q || q.verb === 'wait') { const w = m.rows.at(-1); return Object.freeze({ ...WAIT_OFFER, ...(w?.late ? { late: w.late } : {}), rows: m.rows.length, struck }); }
  if (q.verb === 'open' || q.verb === 'close') return Object.freeze({ act: 'hand', verb: q.verb, target: q.target, label: q.label, id: null, spotId: null, args: {}, why: null, rows: m.rows.length, more: [], struck });
  // (the other choices, flattened, struck left out: v0.0.5's readers, the late card and the bots' R held)
  const more = [];
  for (const r of m.rows) {
    if (r.verb !== 'activity') continue;
    for (const c of r.choices ?? [{ ...r }]) {
      if (c.off || (r === q && JSON.stringify(c.args ?? {}) === JSON.stringify(q.args ?? {}))) continue;
      more.push({ id: r.id, spotId: r.spotId, args: c.args ?? {}, label: c.label, durMs: c.durMs, late: c.late ?? null });
    }
  }
  return Object.freeze({ act: 'hand', verb: q.verb, target: q.verb === 'resume' && !m.spot ? null : q.fixtureId ?? m.spot?.fixtureId ?? null, id: q.id, spotId: q.spotId, args: q.args ?? {},
    label: q.label, durMs: q.durMs, endMs: state.clock.ms + q.durMs, late: q.late ?? null, why: m.quick.why, rows: m.rows.length, more, struck });
}

const KIND_OF_VERB = Object.freeze({ open: 'door', close: 'door', rise: 'rise', activity: 'activity', resume: 'resume', wait: 'wait' });

/** The `hand` action (R): what handOffer says, unless the page's want names another kind (see the header). */
export function handAction(state, action, bus, ctx) {
  const offer = handOffer(state);
  if (!offer) return;
  const args = typeof action === 'object' ? action?.args ?? {} : {};
  const want = args.want ?? null, kind = KIND_OF_VERB[offer.verb];
  // (R held's door row: the door the menu showed, if it is still at hand, whatever R tapped would do; the fixer's, 0.0.6)
  if (want === 'door' && args.from === 'menu' && kind !== 'door') {
    const row = (menuOf(state).rows ?? []).find(r => r.key === 'door' && (!args.target || r.target === args.target));
    if (row) toggleDoor(state, row.target, bus, { who: playerId(state) });
    return;
  }
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
      startActivity(state, bus, ctx, { id: pick.id, spotId: pick.spotId, args: pick.args ?? {}, late: args.late ?? null, lead: !!args.lead });
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
