// OLYMPUS tests: "Bang, then go"'s lanes for its suites (v0.0.26; its build sheet §6 B): one lane of the scene played to its card by a bot, with what the suites read of it.
//
// breachLane({ tier, seed, code, bot, late, setup, each }) makes the house's game with `breach` (shoothouse.js parseBreach's words,
// 'bang,held' and the like, or 'drawn') and plays it with runHouse: bot 'auto' is the sheet's honest player (COMBAT §25.19.8's: T and the
// shot the line names from the corporal up, the keys' walk below), the bang thrown at room 1's door by its row where the draw issued one
// (tests/bots/kit.mjs houseKitBot 'flash'), held `late` ms at the stack after it where given (F140's knob); 'fuzz' the scene's fuzz
// (tests/bots/house.mjs breachFuzzBot); 'keys' and 'T' the house bots as they are (no bang). Returns { g, rec } with rec = { tier, seed,
// code, bot, done, ticks, end (the lane's why), casualty, W (shoothouse.js bangWindowOf), track (R.house.bangGo.track), sheet (runSheetOf), wash (hotWashOf), says
// ([{ who, text, kind }] of every 'say' from the fill or GO), firstOf (each man's first round, game ms), yoursOf (the stack's first
// round on each man) }. setup 'go' starts at GO (the suites' default); null from the fill (the brief, LOAD, MAKE READY).
import { createGame } from './game.mjs';
import { houseKeysBot, houseHonestBot, houseTBot, breachFuzzBot, runHouse } from './bots/house.mjs';
import { houseKitBot } from './bots/kit.mjs';
import { bangWindowOf, runSheetOf, hotWashOf } from '../src/sim/scenarios/shoothouse.js';
import { RUNG_OF_TIER } from '../src/sim/skills/templates.js';

/** The scene's four draws, the URL's words. */
export const BREACH_DRAWS = Object.freeze(['bang,held', 'bang,loose', 'quiet,held', 'quiet,loose']);
/** The house's six sheets in the picker's order. */
export const BREACH_SHEETS = Object.freeze(['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone']);
const rungOf = (tier) => RUNG_OF_TIER[tier] ?? 0;

/** The bot a lane is played by (see the header). */
export function breachBot(bot, { tier, seed, code, late = null }) {
  if (typeof bot === 'function') return bot();
  const keys = rungOf(tier) < 2, bang = String(code).startsWith('bang');
  if (bot === 'fuzz') return breachFuzzBot({ seed });
  if (bot === 'keys') return houseKeysBot();
  if (bot === 'T') return houseTBot();
  if (bang || late !== null) return houseKitBot({ use: 'flash', base: keys ? 'keys' : 'honest', late });
  return keys ? houseKeysBot() : houseHonestBot();
}

/** One lane of "Bang, then go" (see the header). */
export function breachLane({ tier = 'sgt', seed = 48213, code = 'bang,held', bot = 'auto', late = null, setup = 'go', each = null, maxMs = 20 * 60_000 } = {}) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, breach: code, ...(setup ? { setup } : {}) });
  const says = [];
  const run = runHouse(g, breachBot(bot, { tier, seed, code, late }), { maxMs, each: (game) => { for (const f of game.facts('say')) says.push({ who: f.who ?? null, text: f.text, kind: f.kind ?? null, speaker: f.speaker ?? null }); each?.(game); } });
  const s = g.state, R = s.armoury.range, H = R.house, men = R.turners.filter(T => T.live);
  const rec = { tier, seed, code, bot: typeof bot === 'function' ? 'custom' : bot, late, done: run.done, ticks: run.ticks, mem: run.mem, end: H.end?.why ?? null, casualty: H.live?.casualty ?? null,
    W: bangWindowOf(s), track: structuredClone(H.bangGo?.track ?? {}), sheet: runSheetOf(s), wash: hotWashOf(s), says,
    firstOf: Object.fromEntries(men.map(T => [T.stand, T.live.firstAtMs ?? null])), yoursOf: Object.fromEntries(men.map(T => [T.stand, T.firstAtMs ?? null])) };
  return { g, rec };
}

/** A lane in one line for the prints: the sheet, the draw, the end, the bang to your entry, each man's end. */
export function breachLine(rec) {
  const W = rec.W, t0 = W?.bangAtMs ?? W?.doorAtMs, at = (ms) => (Number.isFinite(ms) && Number.isFinite(t0) ? ((ms - t0) / 1000).toFixed(2) : '-');
  const men = W ? Object.values(W.men).map(M => `${M.stand} ${M.downAtMs !== null ? `down ${at(M.downAtMs)}` : M.gaveAtMs !== null ? `gave ${at(M.gaveAtMs)}` : 'up'}`).join(', ') : '';
  return `${rec.bot} ${rec.tier} ${rec.seed} ${rec.code}${rec.late !== null ? ` late ${rec.late}` : ''}: ${rec.done ? rec.end : 'NOT DONE'}, ${rec.ticks} ticks, in at ${at(W?.inAtMs)} s; ${men}`;
}
