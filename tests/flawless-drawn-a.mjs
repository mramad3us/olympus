// OLYMPUS tests: the drawn house's own gauges, F61 and F62 (the build sheet v0.0.21 §8; house lens H2, H4 to H6): the draw kept to its rules, and every drawn lane's doors and stands as the rules put them.
//
// F61 (static, the draws alone): over DRAW_SEEDS seeds, every drawn layout keeps every layout rule (scenes/assemble.js
//      layoutOk: inside the house, clear of the booth and each other, the doors' places and gaps, no stack in another door's
//      arc or funnel) and its cast every fair-lane rule (castFair) unless it fell to the chunks' set cast after DRAW_TRIES; and the
//      draw is the seed's alone: the same code whatever the sheet or the loadout (shoothouse.js drawnCodeFor is given neither,
//      and the fill of each sheet and loadout writes the same R.house.draw.code: the lanes checked by f61Fills).
// F62 (each drawn lane, a watcher): every lane door hinged at its downrange (west) end, its stack uprange of it (east of its
//      middle, #2 behind #1), Kick struck at a pull door with swing.js KICK_PULL_WHY and live at a push one (breach.js
//      entryOptions, the door closed), "Read the door"'s words the drawn leaf's (swing.js doorWordsOf: push or pull, the hinge left
//      seen from the hall north of it, right south of it), no locked pull door, and no stand turned before GO.
// ENFORCED: both, at once (the sheet's §8). The numbers print six spaces in.
import { parseHouse, drawHouse, drawCast, castFair, layoutOk, drawnCodeOf, DRAW_TRIES } from '../src/sim/scenes/assemble.js';
import { lanePlanOf } from '../src/sim/combat/room.js';
import { openingOf, openingState } from '../src/sim/places/model.js';
import { entryOptions } from '../src/sim/combat/breach.js';
import { doorWordsOf, KICK_PULL_WHY } from '../src/sim/places/swing.js';

/** The gauges this file enforces (the sheet's §8: both at once). */
export const ENFORCED = Object.freeze(['F61', 'F62']);
/** F61's seeds (the sheet's §6: house-fair's 1,000). */
export const DRAW_SEEDS = 1000;

/** F61 over seeds 1 to n (see the header): { seeds, layoutsBad, castsBad, fell, why: { [rule]: n }, lines }. */
export function f61(n = DRAW_SEEDS) {
  let layoutsBad = 0, castsBad = 0, fell = 0, tries = 0;
  const why = {}, bad = [];
  for (let seed = 1; seed <= n; seed++) {
    const L = drawHouse(seed), H = parseHouse(L), c = drawCast(seed, L);
    tries += c.tries;
    if (!layoutOk(H.rooms)) { layoutsBad++; bad.push(`${seed} ${L} layout`); }
    if (c.fell) { fell++; continue; }
    const f = castFair(H.rooms, c.faces, c.places);
    if (!f.ok) { castsBad++; why[f.why] = (why[f.why] ?? 0) + 1; bad.push(`${seed} ${L} ${f.why}`); }
  }
  return { seeds: n, layoutsBad, castsBad, fell, meanTries: tries / n, why, bad: bad.slice(0, 5),
    line: `F61 ${layoutsBad + castsBad ? 'MISSED' : 'MET'}: ${n} seeds drawn, ${layoutsBad} layouts off a rule, ${castsBad} casts unfair, ${fell} fell to the set cast after ${DRAW_TRIES} tries (mean ${(tries / n).toFixed(2)} tries)` };
}
/** F61's second half (see the header): each game's R.house.draw.code by its seed, the same for every sheet and loadout: { ok, codes }. */
export function f61Fills(games) {
  const bySeed = {};
  for (const g of games) (bySeed[g.state.meta.seed] ??= new Set()).add(g.state.armoury.range.house.draw?.code ?? null);
  const ok = Object.entries(bySeed).every(([seed, set]) => set.size === 1 && [...set][0] === drawnCodeOf(Number(seed)));
  return { ok, codes: Object.fromEntries(Object.entries(bySeed).map(([k, v]) => [k, [...v]])) };
}

/** F62's door checks on a drawn lane's state at its fill (see the header): { ok, doors: [{ door, how, hinge, words, kick, stack, locked }], bad }. */
export function f62Doors(state) {
  const H = state.armoury.range.house, code = parseHouse(H.draw?.code), plan = lanePlanOf(state), out = [], bad = [];
  code.rooms.forEach((R, k) => {
    const P = plan.plans[plan.order[k]], o = openingOf(P.door), mid = (o.a + o.b) / 2, sw = P.swing;
    const west = o.swing?.hinge === 'a', words = doorWordsOf(R.how, R.side === 'n' ? 'left' : 'right');
    const st = P.stack, uprange = st[0][0] > mid && st[1][0] > st[0][0];
    let kick = null;
    if (openingState(state, P.door) !== 'open') { const r = entryOptions(state, state.player.id, P, { rung: 0 }).find(x => x.id === 'kick'); kick = r ? (r.off ?? 'live') : 'none'; }
    const row = { door: `room ${k + 1}`, how: sw.how, hinge: sw.hinge, words: sw.words, kick, stack: uprange, locked: !!o.lock };
    out.push(row);
    if (!west) bad.push(`room ${k + 1}: hinged at its east end`);
    if (sw.how !== R.how) bad.push(`room ${k + 1}: ${sw.how}, drawn ${R.how}`);
    if (sw.words !== words) bad.push(`room ${k + 1}: read "${sw.words}", want "${words}"`);
    if (!uprange) bad.push(`room ${k + 1}: the stack not uprange (${JSON.stringify(st)} against ${mid})`);
    if (kick !== null && (R.how === 'pull' ? kick !== KICK_PULL_WHY : kick === KICK_PULL_WHY)) bad.push(`room ${k + 1}: Kick ${kick} on a ${R.how}`);
    if (o.lock && R.how === 'pull') bad.push(`room ${k + 1}: a locked pull door`);
  });
  return { ok: !bad.length, doors: out, bad };
}
/** F62's turn watcher (see the header): watch(game) → { tick(game), result() }: every turner's turn at or after GO. */
export function f62Turns() {
  const early = [];
  return {
    tick(game) {
      const R = game.state.armoury.range, H = R.house;
      for (const T of R.turners ?? []) if (T.turnAtMs !== null && (H.goAtMs === null || T.turnAtMs < H.goAtMs) && !early.includes(T.stand)) early.push(T.stand);
    },
    result() { return { ok: !early.length, early }; },
  };
}
