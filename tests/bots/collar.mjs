// OLYMPUS bots: the boarding bots, a marine who drives test-collar ("Away the boarding party", v0.0.27) to the card by what the player sees, and its fuzz bot (the build sheet v0.0.27 §1 D, FT§14).
//
// collarBot({ mode: 'T' | 'keys' }) is the house's honest bot (T, tests/bots/house.mjs houseHonestBot: the corporal to the tier one) or
// its keys bot (houseKeysBot: the recruit and the private) with what the boarding adds, each read as the player reads it:
//   the hold      the passage is the team's (hauler-plans.js PASSAGE, `hold`): from GO to the leader's send your pair holds in the lock,
//                 so in stop motion it takes the panel's Wait and out of it presses nothing (time runs; the send comes by the scene's
//                 own clock: shoothouse.js collarTick, at most PASSAGE_SEND_MAX_MS after GO), never the drill on a leg nobody of yours
//                 enters (the house's instinct reads a held leg as one to enter and leave again: G and X in turn, a press a tick);
//   the knock     down by your stance (body/domain.js woundsFast): nothing pressed while the knock runs; once it is over, a move key
//                 (the body's player rule: you rise by a move key), unless T has its own act for it, which it then takes;
//   the fall back the leader's (or the senior marine's) "Fall back to the lock!" (R.house.boarding.fallback): out of stop motion and the
//                 keys along a routed way (combat/route.js routed, every offered hatch and the lock's open) to the lock's middle, until
//                 the scene's end in the lock (or its wait's) comes;
//   your aid      the rows B's contact.js leads with on the one rule's 'real': "Tourniquet" while a limb bleeds hard, "Get up" once your
//                 knock is over, taken when offered (the honest player answers the wound's line, "Bleeding hard from the left arm: a
//                 tourniquet, now.", and "On your feet.").
// collarTBot() is the same over houseTBot (a human pressing T as the page sends it). collarFuzzBot({ seed }) is the house's fuzz bot
// (houseFuzzBot) with the boarding's dice of its own ('collar-fuzz', so no house fuzz lane moves): now and then G and a move key while
// your stance is down (nothing may begin: F163), a shot row on any man offered whatever he is doing (a round at a man down, with his
// hands up or unarmed is faulted 'protected': F155's fuzz half), the fall back's walk taken on half its seeds only (the other half stand
// where they are and are carried in the splash at its wait). Every run must reach the card (F153). Each bot's memory is plain data on the
// actor (me.bot), so a save holds it. runCollar(game, bot, opts) is the house's runHouse.
import { houseHonestBot, houseKeysBot, houseTBot, houseFuzzBot, runHouse } from './house.mjs';
import { stepAct, pressToward } from './lib.mjs';
import { stepsOf } from '../../src/sim/arms/shooting.js';
import { lanePlanOf } from '../../src/sim/combat/room.js';
import { routed } from '../../src/sim/combat/route.js';
import { openingOf, areaOf } from '../../src/sim/places/model.js';
import { downOf } from '../../src/sim/body/wounds.js';
import { instinctNow } from '../../src/sim/skills/instinct.js';
import { hashInt } from '../../src/core/hash.js';

/** Within this of the lock's middle the fall back's walk is done (m). */
export const LOCK_M = 0.6;
/** The fuzz's dice: a shot row offered on a man (1 in), G or a key while down (1 in). */
export const COLLAR_FUZZ_SHOT = 6, COLLAR_FUZZ_DOWN = 4;

const houseOfS = (s) => (s.armoury?.range?.course === 'house' ? s.armoury.range.house ?? null : null);
/** The boarding's record of a state, or null (R.house.boarding). */
export const boardingNow = (s) => houseOfS(s)?.boarding ?? null;
// (the lock's room and its middle: the room the first leg's key (the lock's inner hatch) is worked from)
function lockOf(s) {
  const P = lanePlanOf(s), o = openingOf(P.order[0]), id = o?.rooms?.[0] ?? null, A = areaOf(P.area), r = A?.rooms?.find(x => x.id === id)?.rect ?? null;
  return r ? { id, rect: r, mid: [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2] } : null;
}
const inRect = (r, x, z) => x >= r[0] && x <= r[2] && z >= r[1] && z <= r[3];
// (the passage held: GO given, the lane's first leg current and its plan a hold, the send not yet made)
function holding(s) {
  const H = houseOfS(s), B = H?.boarding;
  if (!B || H.goAtMs === null || H.end || H.cur !== 0 || B.fallback) return false;
  return !!lanePlanOf(s).plans[lanePlanOf(s).order[0]]?.hold;
}
// (your stance down: { down, over } (over: the knock run out, a move key gets you up))
function downNow(s, me) {
  if (me?.stance !== 'down') return null;
  const rec = s.people?.[s.player.id]?.body;
  return { over: !!rec && !downOf(rec, s.clock.ms, { knock: false }).down && !(rec.knock && rec.knock.untilMs > s.clock.ms) };
}
// (the fall back's walk: out of stop motion, then the keys along the routed way to the lock's middle; {} once there)
function fallBack(s, me, mem) {
  const L = lockOf(s);
  if (!L || inRect(L.rect, me.x, me.z) && Math.hypot(me.x - L.mid[0], me.z - L.mid[1]) <= LOCK_M) return {};
  const S = s.stop;
  if (S?.mode === 'stop') {
    if (S.phase !== 'choose' || S.reflex) return {};
    return stepsOf(s).some(x => x.id === 'leave' && !x.off) ? { act: [stepAct('leave')] } : {};
  }
  const now = s.clock.ms, key = `${Math.round(me.x * 10)},${Math.round(me.z * 10)}`;
  if (!mem.fb || mem.fb.stuckAt !== undefined && now - mem.fb.stuckAt > 2000) {
    // (round every other body on the deck, Four first: in the 1.5 m passage he stands on your way)
    const open = lanePlanOf(s).order, bodies = s.actors.list.filter(a => a.who !== s.player.id && (a.stance ?? null) !== 'lie').map(a => ({ x: a.x, z: a.z, rM: 0.2 }));
    const way = routed(s, [[me.x, me.z], L.mid], { area: lanePlanOf(s).area, open, bodies }) ?? routed(s, [[me.x, me.z], L.mid], { area: lanePlanOf(s).area, open });
    mem.fb = { path: way.map(p => [p[0], p[1]]), k: 1, at: key, atMs: now };
  }
  const F = mem.fb;
  if (F.at !== key) { F.at = key; F.atMs = now; delete F.stuckAt; } else if (now - F.atMs > 1000) F.stuckAt ??= now;
  while (F.k < F.path.length - 1 && Math.hypot(me.x - F.path[F.k][0], me.z - F.path[F.k][1]) <= 0.2) F.k += 1;
  const to = F.path[Math.min(F.k, F.path.length - 1)];
  // (held at the body gap by a man on your way (Four on his stack in the passage): a step off him to the side the way goes round, then on)
  const near = s.actors.list.find(a => a.who !== s.player.id && Math.hypot(a.x - me.x, a.z - me.z) < 0.56 && ((to[0] - me.x) * (a.x - me.x) + (to[1] - me.z) * (a.z - me.z)) > 0);
  if (near) { const vx = me.x - near.x, vz = me.z - near.z, n = Math.hypot(vx, vz) || 1; return pressToward(me, [me.x + vx / n * 0.4 + (to[0] - me.x) * 0.1, me.z + vz / n * 0.4 + (to[1] - me.z) * 0.1]); }
  return pressToward(me, to);
}
// (what the boarding adds over a house bot, or null to leave it to the base: see the header)
function boardingStep(s, me, mem, { fuzz = null } = {}) {
  const B = boardingNow(s), H = houseOfS(s);
  if (!B || !H || H.end || s.armoury?.range?.end || s.skip) return null;
  const S = s.stop, dn = downNow(s, me);
  if (dn) {
    mem.downTicks = (mem.downTicks ?? 0) + 1;
    if (fuzz && fuzz(COLLAR_FUZZ_DOWN) === 0) return fuzz(2) ? { act: ['ready'] } : { mx: 1, mz: 0 };
    if (!dn.over) return {};
    const line = instinctNow(s).line;
    if (line?.act) return { act: [{ act: 'instinct', args: { id: line.id, act: line.act } }] };
    mem.rose = (mem.rose ?? 0) + 1;
    // (at a contact's pause a move key is refused (the pause holds), so the row "Get up" (v0.0.27's carried stage: the private on 5205 with
    // the G-11s issued pressed a move key at the same pause 48,000 times, his knock over and T's line "Press." with no act)
    if (S?.mode === 'stop' && S.phase === 'choose' && !S.reflex && !S.doing && stepsOf(s).some(x => x.id === 'contact:up' && !x.off)) return { act: [stepAct('contact:up', 'normal')] };
    return { mx: 1, mz: 0 };
  }
  if (B.fallback && B.fallback.inAtMs === null && (!fuzz || mem.fbWalk !== false)) return fallBack(s, me, mem);
  // (the fuzz's other half stands where it is till the wait (see the header): out of stop motion, nothing pressed; with the drill's rows
  // gone at the call (the fixer of v0.0.27's play review) its dice found the lead row "Back to the lock" and walked it back at 24 s)
  if (B.fallback && B.fallback.inAtMs === null && fuzz) return S?.mode === 'stop' && S.phase === 'choose' && !S.reflex && stepsOf(s).some(x => x.id === 'leave' && !x.off) ? { act: [stepAct('leave')] } : {};
  // (your own aid and your feet, as the wound's line and "On your feet." ask (B's rows, leading the contact rows): the tourniquet while a
  // limb bleeds hard, "Get up" once the knock is over; the fuzz leaves them to its dice)
  if (!fuzz && S?.mode === 'stop' && S.phase === 'choose' && !S.reflex && !S.doing) {
    const aid = stepsOf(s).find(x => !x.off && (x.id === 'contact:tourniquet' || x.id === 'contact:up'));
    if (aid) { mem[aid.id === 'contact:up' ? 'ups' : 'tourniquets'] = (mem[aid.id === 'contact:up' ? 'ups' : 'tourniquets'] ?? 0) + 1; return { act: [stepAct(aid.id, 'normal', aid.target ?? null)] }; }
  }
  // (the wound's line with no act (instinct/base.js 'wound': a wound that wants no tourniquet) leads T's pick and names nothing to do: the
  // panel's lead drill row, what T gives where the instinct offers the drill (COMBAT §25.8.1), so the lane goes on as a player's would)
  const line = S?.mode === 'stop' && S.phase === 'choose' && !S.reflex && !S.doing ? instinctNow(s).line : null;
  // (the drill's rows first, then the contact's but its Hold, which takes no time and changes nothing: pressed for ever, it held the
  // sergeant's pirates lane on 1111 at one pause, 45,607 presses, once the lock's hatch opened to sight (the fix of D's review))
  if (line?.id === 'wound' && !line.act && !fuzz) {
    const rows = stepsOf(s).filter(x => !x.off);
    const row = rows.find(x => x.kind === 'bundle' || String(x.id).startsWith('drill:')) ?? rows.find(x => String(x.id).startsWith('contact:') && x.id !== 'contact:hold') ?? rows.find(x => x.id === 'wait');
    if (row) { mem.woundRows = (mem.woundRows ?? 0) + 1; return { act: [stepAct(row.id, 'normal', row.target ?? null)] }; }
  }
  if (holding(s)) {
    mem.holdTicks = (mem.holdTicks ?? 0) + 1;
    if (S?.mode === 'stop' && S.phase === 'choose' && !S.reflex && !S.doing) return stepsOf(s).some(x => x.id === 'wait' && !x.off) ? { act: [stepAct('wait')] } : {};
    if (!S || S.mode !== 'stop') return {};
  }
  return null;
}

/** The boarding bot (see the header): 'T' (the honest bot) or 'keys'. */
export function collarBot({ mode = 'T' } = {}) {
  const base = mode === 'keys' ? houseKeysBot() : houseHonestBot();
  return (state, me, mem) => boardingStep(state, me, (mem.collar ??= {})) ?? base(state, me, mem);
}
/** The boarding's T player (see the header): houseTBot with the boarding's steps. */
export function collarTBot() {
  const base = houseTBot();
  return (state, me, mem) => boardingStep(state, me, (mem.collar ??= {})) ?? base(state, me, mem);
}
/** The boarding's fuzz bot (see the header). */
export function collarFuzzBot({ seed = 1 } = {}) {
  const base = houseFuzzBot({ seed });
  return (state, me, mem) => {
    const C = (mem.collar ??= {}), fuzz = (k) => hashInt(k, 'collar-fuzz', seed, C.n = (C.n ?? 0) + 1);
    C.fbWalk ??= hashInt(2, 'collar-fuzz-fallback', seed) === 0;
    const own = boardingStep(state, me, C, { fuzz });
    if (own) return own;
    // (a shot row offered on a man, whoever he is and whatever he is doing: a round at a man who could not fight now and then)
    const S = state.stop, H = houseOfS(state);
    if (H?.boarding && H.goAtMs !== null && !H.end && S?.mode === 'stop' && S.phase === 'choose' && !S.reflex && !S.doing) {
      const shot = stepsOf(state).find(x => !x.off && (x.kind === 'shot' || String(x.id).startsWith('shot:')));
      if (shot && fuzz(COLLAR_FUZZ_SHOT) === 0) { C.shots = (C.shots ?? 0) + 1; return { act: [stepAct(shot.id, 'normal', shot.target ?? null)] }; }
    }
    return base(state, me, mem);
  };
}
/** A boarding bot by its kind and sheet: the honest player of the sheet (T from the corporal, the keys below), 'keys', 'T' (collarTBot), 'houseT' (the plain houseTBot: T alone, no hold, knock or walk of the bot's own; the review of D) or 'fuzz'. */
export function collarBotOf(kind, tier, seed = 1) {
  if (kind === 'fuzz') return collarFuzzBot({ seed });
  if (kind === 'houseT') return houseTBot();
  if (kind === 'T') return collarTBot();
  if (kind === 'keys' || (kind === 'honest' && (tier === 'recruit' || tier === 'private'))) return collarBot({ mode: 'keys' });
  return collarBot({ mode: 'T' });
}
/** Run a bot on the boarding to its card (tests/bots/house.mjs runHouse). */
export const runCollar = (game, bot, opts = {}) => runHouse(game, bot, { maxMs: 20 * 60_000, ...opts });
/**
 * One lane of the boarding from the fill (or a setup) to the card: { tier, seed, bot, holdouts, setup, done, end, laneS, ticks, legs (each
 * leg's state, H for held), type, track (the men's choices met: what → n; a holdout's hands up read 'give', the crew's 'crew hands'), dead (the honest bot's dead ends by kind), fallback, protected
 * (the 'protected' faults), game }. kind: collarBotOf's.
 */
export function collarLane(createGame, { tier = 'sgt', seed = 48213, bot = 'honest', holdouts = null, setup = null, each = null, maxMs = 20 * 60_000 } = {}) {
  const g = createGame({ scenario: 'test-collar', seed, tier, ...(holdouts ? { holdouts } : {}), ...(setup ? { setup } : {}) });
  const r = runCollar(g, collarBotOf(bot, tier, seed), { maxMs, each });
  const s = g.state, H = s.armoury.range.house, B = H.boarding, mem = r.mem ?? {};
  // (the track's keys as the gauge reads them (F157; the lead's call of 2026-11-20, v0.0.28: fix the key, not the threshold): a man's give is
  // one choice with one name, 'give', whether his table rolled it (the security table's, opfor.js CHOICE_TABLE) or a challenge ended his
  // freeze or cover (st 'hands' on an armed holdout), counted once a man; the hauler's crew, unarmed and cowering from the first tick,
  // putting their hands up to a challenge is 'crew hands', kept apart from a holdout's give)
  const met = {}, crew = new Set((s.armoury.range.turners ?? []).filter(T => T.live?.unarmed).map(T => T.stand));
  for (const [stand, list] of Object.entries(B.track ?? {})) {
    let gave = false;
    for (const e of list) {
      let k = e.what ?? e.st;
      if (k === 'hands') k = crew.has(stand) ? 'crew hands' : 'give';
      if (k === 'give') { if (gave) continue; gave = true; }
      if (k) met[k] = (met[k] ?? 0) + 1;
    }
  }
  return { tier, seed, bot, holdouts: holdouts ?? null, setup, done: r.done, end: B.end?.why ?? H.end?.why ?? null, laneS: H.goAtMs === null || !H.end ? null : Math.round((H.end.atMs - H.goAtMs) / 100) / 10,
    ticks: s.clock.tick, legs: H.rooms.map(L => (L.held ? 'H' : L.state[0])).join(''), type: B.type, track: met, dead: mem.dead ?? {}, fallback: !!B.fallback, protected: (B.protected ?? []).length, game: g };
}
