// OLYMPUS tests: the Wreck's lanes watched, the gauges' homes of "Hold to hold" (v0.0.25; its build sheet §6 C, §8: F125, F126, F131, F133, F134, F136).
//
// A Wreck lane is the house's lane on the Wreck (scenario 'test-zerocqb'), run by the house's bots (tests/bots/house.mjs): the honest
// T player on the T sheets (the corporal to the tier one), the keys bot on the boot recruit and the private, the fuzz bot for the dead
// ends. wreckLane({ tier, seed, bot, setup, maxMs }) plays one to the card and watches each tick (wreckWatch), its record:
//   done, why, laneS             the card reached, the lane's end ('clear', 'passed', 'time', 'dry'), its time from GO (s)
//   rounds [{ who, anchor, recoil }]  every round of yours and your #2's with the anchor it was fired from (shoothouse.js houseShot
//                                writes it on R.shots, roundAnchor) and its recoil record (freefall.js recoilFloat's, or null)
//   floatMine, floatFaults       your rounds fired floating, and the lane's 'float' faults
//   firstAnchors                 the first round's anchor of each compartment (the card's), and the card's rows
//   tug { warnS, onsetS, endS, aftS: { me, two }, notAft, atOnset: { me, two } }   the yard tug's moments from GO and each marine's
//                                feet aft; atOnset each marine's footing read at the onset's tick ('deck' booted on the deck, else
//                                the face and the anchor), so feet aft is judged where the pull finds him, not at the warning
//   stuck                        ticks a floating marine had nothing to push from on any of 8 bearings (freefall.js pushFrom null)
//   between                      ticks a marine of the lane stood in the 60 m between the decks (no deck of the area)
//   apartAtEnd                   you and your #2 on different decks at the lane's end (printed: a leg the stall passed may leave one
//                                behind the trunk; a marine left in the trunk itself is `between`)
//   braceAtEnd                   a marine still in his #2's grip at the lane's end (a brace never let go)
//   says [{ who, speaker, kind }] every 'say' fact (the sim's half of F136), cadreNoActor the cadre's lines said while he had no actor and
//                                cadreUnplaced those of them said in a compartment with no 1MC speaker to place their bubble at
// The dead-end rule (F125): to the card, by the lane's due (585 s), never 'time', and stuck, between and braceAtEnd all 0.
import { createGame } from './game.mjs';
import { houseHonestBot, houseKeysBot, houseFuzzBot, runHouse } from './bots/house.mjs';
import { LANE_MAX_MS, LANE_KEEP_MS } from '../src/sim/scenarios/shoothouse.js';
import { footingOf } from '../src/sim/body/footing.js';
import { pushFrom } from '../src/sim/body/freefall.js';
import { navOf } from '../src/sim/places/nav.js';
import { PLAYER_CLS } from '../src/sim/places/move.js';
import { roomOf } from '../src/sim/places/model.js';
import { WRECK, WRECK_DECKS } from '../src/data/places/wreck.js';

/** The Wreck's sheets, the picker's order with the corporal. */
export const WRECK_SHEETS = Object.freeze(['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone']);
/** The T sheets (rung 2 and up): the honest bot presses T there; below, the keys bot is the player. */
export const T_SHEETS = Object.freeze(['cpl', 'sgt', 'raider', 'tierone']);
/** The seeds of a sheet's lanes: 48213, then the flawless suites' own (1000 + 37 i). */
export const wreckSeeds = (n) => Array.from({ length: n }, (_, i) => (i === 0 ? 48213 : 1000 + 37 * i));
/** The lane's due: no leg is passed later than this from GO (ms): the house's, 585 s. */
export const DUE_MS = LANE_MAX_MS - LANE_KEEP_MS;

// (the honest player of a sheet: T from rung 2, the keys below)
export function wreckBot(kind, tier, seed) {
  if (kind === 'fuzz') return houseFuzzBot({ seed });
  if (kind === 'keys' || (kind === 'honest' && !T_SHEETS.includes(tier))) return houseKeysBot();
  return houseHonestBot();
}
// (a deck of the area for a point, or null in the 60 m between: WRECK_DECKS' rects, the walls' 0.5 m round them)
const deckOf = (x, z) => { for (const d of Object.values(WRECK_DECKS)) { const [x0, z0, x1, z1] = d.rect; if (x >= x0 - 0.5 && x <= x1 + 0.5 && z >= z0 - 0.5 && z <= z1 + 0.5) return d.n; } return null; };
const BEARINGS = Array.from({ length: 8 }, (_, i) => [Math.cos(i * Math.PI / 4), Math.sin(i * Math.PI / 4)]);

/** A watch of one Wreck lane (see the header): each(game) after each tick, result() the record. */
export function wreckWatch(g) {
  const s0 = g.state, pid = s0.player.id, H0 = s0.armoury.range.house, twoPid = H0.twoPid, chiefPid = H0.chiefPid;
  const rec = { stuck: 0, between: 0, says: [], cadreNoActor: 0, cadreUnplaced: 0, atOnset: null };
  const each = (game) => {
    const st = game.state, H = st.armoury.range.house, lane = H.goAtMs !== null && !H.end;
    for (const f of game.facts('say')) {
      rec.says.push({ who: f.who ?? null, speaker: f.speaker ?? null, kind: f.kind ?? null });
      if (f.who && f.who === chiefPid && !st.actors.list.some(a => a.who === chiefPid)) {
        rec.cadreNoActor++;
        const me = st.actors.list.find(a => a.who === pid), room = me ? roomOf(WRECK.id, me.x, me.z) : null;
        if (!room || !WRECK.speakers.some(sp => sp.room === room.id)) rec.cadreUnplaced++;
      }
    }
    if (!lane) return;
    // (each marine's footing at the tug's onset, its first tick: booted on the deck, else where he is and on what)
    if (H.tug?.onsetAtMs !== null && H.tug?.onsetAtMs !== undefined && !rec.atOnset) {
      const at = (who) => { const a = who ? st.actors.list.find(x => x.who === who) : null; if (!a) return null; const f = footingOf(st, who); return a.anchor === 'boots' && (a.onFace ?? 'deck') === 'deck' ? 'deck' : `${a.onFace ?? 'deck'}/${f.anchor ?? f.mode}`; };
      rec.atOnset = { me: at(pid), two: at(twoPid) };
    }
    for (const who of [pid, twoPid]) {
      const a = who ? st.actors.list.find(x => x.who === who) : null;
      if (!a) continue;
      if (deckOf(a.x, a.z) === null) rec.between++;
      if (footingOf(st, who).mode === 'float') {
        const grid = navOf(st, st.places.live.area, PLAYER_CLS, a.x, a.z);
        if (!BEARINGS.some(([ux, uz]) => pushFrom(st, a, grid, ux, uz))) rec.stuck++;
      }
    }
  };
  const result = () => {
    const st = g.state, R = st.armoury.range, H = R.house, s = (ms) => (Number.isFinite(ms) ? Math.round((ms - H.goAtMs) / 10) / 100 : null);
    const me = st.actors.list.find(a => a.who === pid), two = twoPid ? st.actors.list.find(a => a.who === twoPid) : null;
    const T0 = H.tug ?? null;
    return {
      ...rec, done: !!R.end, why: H.end?.why ?? null, laneS: H.end ? s(H.end.atMs) : null, legs: H.rooms.map(L => L.state),
      rounds: (R.shots ?? []).map(x => ({ who: 'me', anchor: x.anchor ?? null, kick: x.kick ?? null })),
      floatLegs: H.rooms.map(L => ({ rounds: L.floatRounds ?? 0, faulted: L.faults.some(f => f.kind === 'float') })),
      twoFloat: H.two?.floatRounds ?? 0, floatMine: H.floatRounds ?? 0, floatFaults: H.rooms.reduce((n, L) => n + L.faults.filter(f => f.kind === 'float').length, 0),
      firstAnchors: H.rooms.map(L => L.firstAnchor ?? null),
      tug: T0 ? { warnS: s(T0.warnAtMs), onsetS: s(T0.onsetAtMs), endS: s(T0.endAtMs), aftS: { me: T0.aft?.[pid] !== undefined ? s(T0.aft[pid]) : null, two: twoPid && T0.aft?.[twoPid] !== undefined ? s(T0.aft[twoPid]) : null },
        aftFaults: H.rooms.reduce((n, L) => n + L.faults.filter(f => f.kind === 'aft').length, 0), twoNotAft: H.two?.notAft ?? 0, atOnset: rec.atOnset } : null,
      apartAtEnd: !!(me && two && deckOf(me.x, me.z) !== deckOf(two.x, two.z)),
      braceAtEnd: [me, two].filter(a => a?.anchor === 'buddy').length,
      faults: H.rooms.flatMap(L => L.faults.map(f => f.kind)),
    };
  };
  return { each, result };
}

/** One Wreck lane to the card, watched (see the header): { g, rec }. */
export function wreckLane({ tier, seed = 48213, bot = 'honest', setup = 'go', maxMs = 15 * 60_000, each = null }) {
  const g = createGame({ scenario: 'test-zerocqb', seed, tier, ...(setup ? { setup } : {}) }), W = wreckWatch(g);
  const r = runHouse(g, wreckBot(bot, tier, seed), { maxMs, each: (game) => { W.each(game); each?.(game); } });
  const rec = W.result();
  return { g, rec: { tier, seed, bot, ...rec, ticks: r.ticks, dead: Object.keys(r.mem?.dead ?? {}), errors: g.errors.length } };
}

/** A lane's dead ends (F125): the reasons it is one, [] for none. */
export function deadEnds(rec) {
  const out = [];
  if (!rec.done) out.push('no card');
  if (rec.why === 'time') out.push('the lane ran out its time');
  if (Number.isFinite(rec.laneS) && rec.laneS * 1000 > DUE_MS) out.push(`past the due (${rec.laneS} s)`);
  if (rec.stuck) out.push(`floating with nothing to push from ${rec.stuck} ticks`);
  if (rec.between) out.push(`between the decks ${rec.between} ticks`);
  if (rec.braceAtEnd) out.push('a brace never let go');
  if (rec.errors) out.push(`${rec.errors} errors`);
  return out;
}

/** A lane's line for a test's print: "sgt 48213 honest: clear 83.20 s cccc, onset 60.00 s, feet aft 0.00/1.50, floating 0". */
export const laneLine = (r) => `${r.tier} ${r.seed} ${r.bot}: ${r.why ?? 'none'} ${r.laneS ?? '-'} s ${r.legs.map(x => x[0]).join('')}, onset ${r.tug?.onsetS ?? '-'} s, feet aft ${r.tug?.aftS?.me ?? '-'}/${r.tug?.aftS?.two ?? '-'}, floating ${r.floatMine}${deadEnds(r).length ? `, DEAD: ${deadEnds(r).join('; ')}` : ''}`;
