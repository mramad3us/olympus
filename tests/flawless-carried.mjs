// OLYMPUS tests: the carried fixes' gauges, F92 to F96 (v0.0.23, its build sheet §8; carried.md §4's Fc1 to Fc5): the first hour through the door, the words that keep their meaning, Again's brief, the goal line whole.
//
//   F92 (Fc1) the walk in by the words: on the reading recruit's lanes (tests/bots/reader.mjs readerBot: the honest bot that also
//       walks the keys the instructor names; the recruit and the private on the set, drawn and eight-room houses), no room passed
//       with passWhy 'door' (open, never crossed). v0.0.22's words walked the recruit into the wall at rooms 2 and 3: 12 of 36 rooms
//       cleared on the carried lens's 12 lanes. Heavy (house-reader's sweep).
//   F93 (Fc2) the line follows the legs: on those lanes, below rung 2 out of stop motion, the instinct's walk-in key ($instinct.walkKey,
//       instinct.js) is never more than one tick behind cqb.js walkInKey (equal to this tick's or the last's): the words change the tick
//       your leg does. Read by readerLane's watch.
//   F94 (Fc3, with DW) the words keep their meaning: no instructor's line (HOUSE_CHIEF.brief, .one.muzzle) tells the #2 or a man crossing
//       him "high ready" or "muzzle up"; on every live lane LOAD comes after both sterile looks and no "frangible" or "not your wounds" is
//       said from the fill to the card; every door row's label names its action and its spot (bundle.js hotLabel: "Watch: …", "Look: …")
//       and the row says what it does (steps.js hotPurposeOf: "aim in", "check"; the review of 2026-11-18 moved it off the label, whose
//       second half the tile's two lines cut).
//   F95 (Fc4) Again's brief: LOAD within AGAIN_LOAD_MAX_MS 9 s of the fill on every turner lane given `again`.
//   F96 (Fc5) the rule never clipped: the goal toast whole and every PA line paged at 1280 × 720 and 1600 × 900 (ui-goal-clamp, the page).
// Each gauge is a row { id, name, met, value, target, bad }; CARRIED_ENFORCED the ones enforced (F96 by its case, house-done's home).
// F15 and F21 are flawless.mjs's, printed before and after FH-1 by house-reader (the keys bot reads no words, so they hold).
import { createGame } from './game.mjs';
import { readerBot } from './bots/reader.mjs';
import { runHouse } from './bots/house.mjs';
import { walkInKey } from '../src/sim/skills/instinct/cqb.js';
import { hotLabel } from '../src/sim/combat/bundle.js';
import { hotPurposeOf } from '../src/ui/hud/steps.js';
import { HOUSE_CHIEF } from '../src/data/courses.js';
import { rungOf } from '../src/sim/skills/templates.js';
import { runSheetOf } from '../src/sim/scenarios/shoothouse.js';

/** The gauges this file enforces (house-done.mjs reads a set whose name ends ENFORCED). */
export const CARRIED_ENFORCED = Object.freeze(['F92', 'F93', 'F94', 'F95']);
/** Again's LOAD at most this long after the fill (ms; FH-5: 6,100 measured). */
export const AGAIN_LOAD_MAX_MS = 9_000;
/** The words an instructor's line about the #2 or a man crossing him never says (DC2). */
export const WRONG_FOR_TWO = /high ready|muzzles? up/i;
/** The frangible lane's words, never said on a live lane from the fill to the card (DC3). */
export const FRANGIBLE_WORDS = /frangible|not your wounds/i;

/**
 * One lane by the reading recruit (F92, F93): { cell, done, legs: [{ room, state, why, walkInS }], cleared, rooms, passedDoor, lag,
 * keys, verdict }. walkInS a room's door open to its threshold crossed (s), null when never crossed; lag the ticks the instinct's
 * walk-in key was neither this tick's walkInKey nor the last's (F93), keys the ticks a walk-in key was live.
 */
export function readerLane({ tier, seed, fill = {} }) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, ...fill }), s = g.state, pid = s.player.id;
  let last = '', lag = 0, keys = 0;
  const each = () => {
    if (s.skip) { last = ''; return; }
    const k = walkInKey(s), seen = s.$instinct?.walkKey ?? '';
    if (k) keys++;
    if (!s.stop && rungOf(s, pid, 'room') < 2 && seen !== k && seen !== last) lag++;
    last = k;
  };
  const r = runHouse(g, readerBot(), { maxMs: 30 * 60_000, each });
  const H = s.armoury.range.house;
  const legs = H.rooms.map(L => ({ room: L.room, state: L.state, why: L.passWhy ?? null, walkInS: Number.isFinite(L.openAtMs) && Number.isFinite(L.enteredAtMs) ? (L.enteredAtMs - L.openAtMs) / 1000 : null }));
  const verdict = runSheetOf(s).verdict?.words ?? null;
  return { cell: `reader/${tier}/${seed}${fill.draw ? '/drawn' : fill.rooms ? '/eight' : ''}`, done: r.done, legs, cleared: legs.filter(L => L.state === 'clear').length, rooms: legs.length, passedDoor: legs.filter(L => L.why === 'door').length, lag, keys, verdict };
}

/** F92 and F93 over reader lanes. */
export function readerGauges(recs) {
  const door = recs.filter(r => r.passedDoor).map(r => `${r.cell}: ${r.legs.filter(L => L.why === 'door').map(L => L.room).join(', ')} passed at the door`);
  const notDone = recs.filter(r => !r.done).map(r => `${r.cell} not to the card`);
  const lag = recs.filter(r => r.lag).map(r => `${r.cell}: ${r.lag} ticks behind`);
  const cleared = recs.reduce((a, r) => a + r.cleared, 0), rooms = recs.reduce((a, r) => a + r.rooms, 0);
  return [
    { id: 'F92', name: 'the walk in by the words', met: !door.length && !notDone.length, value: `${recs.length} lanes, ${cleared} of ${rooms} rooms cleared, ${door.length} lanes with a room passed at its open door, ${notDone.length} not to the card`, target: 'no room passed with passWhy \'door\'; every lane to its card', bad: [...notDone, ...door] },
    { id: 'F93', name: 'the line follows the legs', met: !lag.length, value: `${recs.reduce((a, r) => a + r.keys, 0)} ticks with a walk-in key, ${recs.reduce((a, r) => a + r.lag, 0)} more than a tick behind`, target: 'the instinct\'s walk-in key this tick\'s or the last\'s, every tick', bad: lag },
  ];
}

/** F94's words half (pure): the instructor's lines about the #2, and the door rows' labels over a sample of hot spots. */
export function wordsGauge() {
  const lines = [...HOUSE_CHIEF.brief, ...HOUSE_CHIEF.one.muzzle].filter(t => WRONG_FOR_TWO.test(t));
  const rows = [['watch', { why: 'corner' }, 'the near right corner'], ['look', { why: 'corner' }, 'the far left corner'], ['watch', { why: 'behind the door' }, 'behind the door'], ['look', { why: 'behind the door' }, 'behind the door'], ['look', { why: 'far leg' }, 'the far leg']]
    .map(([k, h, n]) => [k, n, hotLabel(k, h, n)]).filter(([k, , l]) => !(k === 'watch' ? /^Watch: \S/ : /^Look: \S/).test(l) || !hotPurposeOf({ id: `${k}:x` }));
  return { lines, rows };
}

/** F94 over live lanes ({ cell, loadMs, sterileDone: [ms…] of both looks, frangible: [texts] }) and the words; F95 over Again lanes ({ cell, loadMs }). */
export function carriedWordsGauges({ live = [], again = [] } = {}) {
  const w = wordsGauge();
  const early = live.filter(r => r.sterileDone.length < 2 || r.sterileDone.some(ms => ms > r.loadMs)).map(r => `${r.cell}: LOAD at ${r.loadMs} ms, the looks ${r.sterileDone.join(', ') || 'none'}`);
  const fr = live.filter(r => r.frangible.length).map(r => `${r.cell}: "${r.frangible[0]}"`);
  const slow = again.filter(r => !(r.loadMs <= AGAIN_LOAD_MAX_MS)).map(r => `${r.cell}: LOAD at ${r.loadMs} ms`);
  const max = again.reduce((a, r) => Math.max(a, r.loadMs ?? Infinity), 0);
  return [
    { id: 'F94', name: 'the words keep their meaning', met: !w.lines.length && !w.rows.length && !early.length && !fr.length, value: `${w.lines.length} instructor's lines wrong for the #2; ${w.rows.length} door rows not naming their action; ${live.length} live lanes, ${early.length} with LOAD before both sterile looks, ${fr.length} with a frangible word`, target: 'none of each', bad: [...w.lines, ...w.rows.map(r => r.join(' ')), ...early, ...fr] },
    { id: 'F95', name: 'Again\'s brief', met: !slow.length && again.length > 0, value: `${again.length} turner lanes given again, LOAD at most ${max} ms after the fill`, target: `LOAD within AGAIN_LOAD_MAX_MS ${AGAIN_LOAD_MAX_MS} ms`, bad: slow },
  ];
}

/**
 * A lane from the fill to LOAD, its words watched (F94, F95): { cell, loadMs, sterileDone, frangible, g }; `toEnd` plays it on to the card
 * by the honest bot (tests/flawless.mjs botOf), the words watched to the end.
 */
export function loadLane({ tier = 'recruit', seed, opfor = null, again = false, fill = {}, toEnd = null }) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, ...(opfor ? { opfor } : {}), ...(again ? { again: true } : {}), ...fill }), s = g.state, t0 = s.clock.ms, said = [];
  g.bus.on?.('say', (f) => { if (f.text) said.push(String(f.text)); });
  let loadMs = null;
  for (let i = 0; i < 2400 && loadMs === null; i++) { g.step(1); if (s.armoury.range.cmd?.id === 'load') loadMs = s.clock.ms - t0; }
  if (toEnd) runHouse(g, toEnd, { maxMs: 30 * 60_000 });
  const S = s.armoury.range.house.sterile;
  return { cell: `${tier}/${seed}${opfor ? `/${opfor}` : ''}${again ? '/again' : ''}${fill.draw ? '/drawn' : ''}`, loadMs, sterileDone: S ? Object.values(S.done).map(ms => ms - t0) : [], frangible: opfor ? said.filter(t => FRANGIBLE_WORDS.test(t)) : [], said, g, done: !!s.armoury.range.end };
}
