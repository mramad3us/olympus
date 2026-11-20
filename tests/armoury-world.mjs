// OLYMPUS tests: "The window and the canopy"'s world for the quick suites, the scene at its stations on its own setups (the build sheet v0.0.28 §1 B).
//
// armGame({ seed, tier, setup, hour }) is tests/game.mjs's createGame on test-armoury (setup null the window, 'issue' at the ammunition
// point drawn and signed, 'lane' after the relay, 'canopy' at the canopy after the declaration, 'turnin' at the barrel cleaned; hour a
// start other than the scene's 07:50, so a canopy reached at its clock's hour reads the day's minutes). untilCmd(game, key, bot, maxTicks)
// steps until the standing command is key (armoury-day.js armouryNow's cmd) and nothing of the scene's runs; act(game, id) presses R with
// that row (R held's pick) for one tick and steps until the act and its effects are done. dieAs(game, face) scripts the next roll's d20
// (state.$armDie, runtime); awareOf sets the player's Awareness for a case that needs a sheet's value; seedWith(pred) the first seed from
// 1 that meets a draw (the slip, the short count, the relay's air). honestLane() is the private by the keys on 48213 to the card, played
// once a process and read by armoury-flow, arm-words and arm-save alike (the round's quick budget: one lane, not three, where the runner
// gives the three files one worker): its card, its faults, the lines said each with whether the speaker stood there, the standing lines at
// each command with their press words on AZERTY and QWERTY, the save at each of LANE_POINTS and the save's digest CARRY_TICKS after it.
import { createGame } from './game.mjs';
import { armouryNow, armouryOf } from '../src/sim/scenarios/armoury-day.js';
import { stream, next, weighted } from '../src/core/rng.js';
import { valueOf } from '../src/sim/skills/templates.js';
import { armouryBot, runArmoury } from './bots/armoury.mjs';
import { armouryPressOf } from '../src/sim/scenarios/armoury-day.js';
import { standingCmd } from '../src/sim/scenarios/handling.js';
import { ARM_PRESS } from '../src/data/courses.js';
import { AREA_DUST, SLIP_W, SHORT_W } from '../src/sim/scenarios/armoury-day.js';

/** The scene at a setup (see the header). */
export function armGame({ seed = 48213, tier = 'private', setup = null, hour = null } = {}) {
  return createGame({ scenario: 'test-armoury', seed, tier, ...(setup ? { setup } : {}), ...(hour !== null ? { hour } : {}) });
}
/** Step until the standing command is key and the scene is idle (see the header). Returns the ticks stepped; throws after maxTicks. */
export function untilCmd(game, key, bot = {}, maxTicks = 12_000) {
  for (let t = 0; t < maxTicks; t++) {
    const N = armouryNow(game.state);
    if (N.cmd === key && !N.next && !N.busy && !game.state.skip) return t;
    game.step(1, bot);
  }
  throw new Error(`untilCmd: no '${key}' in ${maxTicks} ticks (at ${armouryNow(game.state).cmd})`);
}
/** Stand the player on the standing command's station (its spot), as a walk there would leave them. */
export function toStation(game) {
  const st = armouryNow(game.state).spot, me = game.me();
  if (st) { me.x = st.x; me.z = st.z; me.face = st.face ?? me.face; me.$px = me.x; me.$pz = me.z; }
  return st;
}
/** Press R with a row and step until the scene is idle again. Returns the act's { ok, why } as the rows had it. */
export function act(game, id, maxTicks = 4000) {
  const before = armouryNow(game.state).rows.find(r => r.id === id) ?? null;
  game.step(1, { act: [{ act: 'hand', args: { id } }] });
  for (let t = 0; t < maxTicks; t++) { const N = armouryNow(game.state); if (!N.busy && !game.state.skip) break; game.step(1); }
  return { ok: !!before && !before.struck, why: before?.why ?? 'not offered' };
}
/** Script the next roll's d20 (see the header). */
export const dieAs = (game, face) => { game.state.$armDie = face; };
/** Set the player's Awareness own value (the sheet's base, no background), for a case that needs a reader who can miss. Returns the value read. */
export function awareOf(game, base) {
  const p = game.state.people[game.state.player.id];
  p.skills.skills.awareness = [base, 0];
  return valueOf(game.state, game.state.player.id, 'awareness');
}
/** The session's record. */
export const armOf = (game) => armouryOf(game.state).arm;
/** The first seed from `from` whose draws meet pred({ slip, short, air }) (see the header). */
export function seedWith(pred, from = 1, to = 4000) {
  for (let s = from; s < to; s++) {
    const slip = next(stream(s, 'arm:slip')) < SLIP_W, short = next(stream(s, 'arm:short')) < SHORT_W;
    const air = weighted(stream(s, 'arm:relay'), Object.entries(AREA_DUST).map(([k, v]) => [k, v.w]));
    if (pred({ slip, short, air })) return s;
  }
  throw new Error('seedWith: none');
}

/** The save points the lane keeps (arm-save's): the first tick each is met. */
export const LANE_POINTS = Object.freeze({
  window: (N) => N.cmd === 'window' && N.acts.length > 0,
  signed: (N) => N.cmd === 'fallIn',
  check: (N) => N.cmd === 'serials' && N.acts.includes('call'),
  ammo: (N) => N.cmd === 'issue' && N.acts.includes('count'),
  lane: (N) => N.cmd === 'lane',
  police: (N, s) => N.cmd === 'police' && s.time?.doing?.activity === 'police-brass',
  declare: (N) => N.cmd === 'declare',
  table: (N) => N.cmd === 'clean' && N.at,
  barrel: (N) => N.cmd === 'barrel',
  turnBack: (N, s) => s.armoury.range.arm?.turnBacks > 0 && N.cmd === 'clean',
});
/** The quick save checks' carry-on: half a minute of play past a save, held to the lane's save at that tick. */
export const CARRY_TICKS = 600;
const LANES = new Map();
/** A lane played once a process, read by several suites (see the header): { game, out, at, saves, after, said, stood, D }. */
export function laneMemo({ seed = 48213, tier = 'private', bot = {} } = {}) {
  const key = JSON.stringify([seed, tier, bot]);
  if (LANES.has(key)) return LANES.get(key);
  const g = armGame({ seed, tier }), b = armouryBot(bot), at = new Map(), saves = new Map(), after = new Map(), said = [], stood = new Map();
  let t = 0;
  for (; t < 20 * 60 * 15; t++) {
    const N = armouryNow(g.state);
    if (!N || N.end) break;
    for (const [k, f] of Object.entries(LANE_POINTS)) if (!at.has(k) && f(N, g.state)) { at.set(k, t); saves.set(k, g.save()); }
    for (const [k, tp] of at) if (tp + CARRY_TICKS === t) after.set(k, g.digest());
    // (a standing command, once on its station and once off it: its line and its press words on both layouts)
    // (the serial check read twice on its station: while the rank calls, its wait, and at your name, its key (the fixer of v0.0.28's play
    // review, finding 3))
    const c = standingCmd(g.state), A = armouryOf(g.state).arm, wait = N.cmd === 'serials' && !A.check?.you && !A.called, sk = `${N.cmd}|${N.at}${wait ? '|wait' : ''}`;
    if (c && ARM_PRESS[N.cmd] && !stood.has(sk)) stood.set(sk, { cmd: N.cmd, at: N.at, wait, text: c.text, azerty: armouryPressOf(g.state, N.cmd, { layout: 'azerty' }), qwerty: armouryPressOf(g.state, N.cmd, { layout: 'qwerty' }) });
    const before = g.facts('say').length;
    g.step(1, b);
    for (const f of g.facts('say').slice(before)) said.push({ ...f, there: (g.state.actors?.list ?? []).some(a => a.who === f.who), person: !!g.state.people[f.who] });
  }
  const out = runArmoury(g, b, { maxTicks: 1 });
  const rec = { game: g, out: { ...out, ticks: t }, at, saves, after, said, stood, D: g.digest() };
  LANES.set(key, rec);
  return rec;
}
