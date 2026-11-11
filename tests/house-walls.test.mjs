// OLYMPUS tests: the shoot house's moves never put a body in a wall: the drill's moves and the #2's routed on the nav (src/sim/combat/route.js), held to the walker's own rule (the user, 2026-11-11: "Operators path through walls when automatic pathing").
//
// The rule a body is held to is the player's own walker's (src/sim/places/collide.js standOk): at the walker's clearance
// class C0 (0.27 m, move.js PLAYER_CLS), its circle clear of every wall and blocking fixture, its centre on the floor of a
// room. It is checked on the area's grid with every door open (a leaf mid-swing is the stage's timing, not a wall), for
// the player and the #2, every tick of a lane, by the house bot (keys below rung 2, T from it), the T player alone, and
// the fuzz bot. Before the fix (the bugs auditor of 2026-11-11) every run broke it, 13 to 20 sources a run, the body's
// centre 0.26 to 0.35 m into the clearance: the #2 through room 2's west wall at (20.01, 14.74), the recruit's stack on
// room 2 through room 1's south wall at (26.58, 12.00), the authored stack-to-threshold legs past every jamb.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseBot, houseTBot, houseFuzzBot, runHouse } from './bots/house.mjs';
import { houseNow, HOUSE_SHEETS } from '../src/sim/scenarios/shoothouse.js';
import { RUNG_OF_TIER } from '../src/sim/skills/templates.js';
import { lanePlanOf } from '../src/sim/combat/room.js';
import { openNavOf, CLASSES, clearLine } from '../src/sim/places/nav.js';
import { standOk } from '../src/sim/places/collide.js';
import { routed, ROUTE_CLS } from '../src/sim/combat/route.js';

const AREA = 'melas.wheel.s4';
// (how far a point stands inside the walker's clearance of the nearest blocker, m: 0 when clear)
function intoWall(G, x, z) {
  let worst = 0;
  for (const r of G.blockers) {
    const dx = x < r.x0 ? r.x0 - x : x > r.x1 ? x - r.x1 : 0, dz = z < r.z0 ? r.z0 - z : z > r.z1 ? z - r.z1 : 0;
    let d = Math.hypot(dx, dz);
    if (d === 0) d = -Math.min(x - r.x0, r.x1 - x, z - r.z0, r.z1 - z);
    worst = Math.max(worst, G.radiusM - d);
  }
  return worst;
}
// (the bot by its name and the sheet's rung)
const botOf = (kind, tier, seed) => (kind === 'T' ? houseTBot() : kind === 'fuzz' ? houseFuzzBot({ seed }) : houseBot({ mode: RUNG_OF_TIER[tier] < 2 ? 'keys' : 'T' }));

/** A lane run with every tick's bodies checked: { ticks, bad: [{ who, src, x, z, into, ms }], done }. */
export function wallRun({ tier, seed, kind = 'house', maxMs = 12 * 60_000 }) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'go' }), pid = g.state.player.id, G = openNavOf(AREA, 'C0'), bad = [];
  let ticks = 0;
  const r = runHouse(g, botOf(kind, tier, seed), { maxMs, each: (game) => {
    const s = game.state, H = s.armoury.range.house;
    ticks++;
    for (const who of [pid, H?.two?.pid]) {
      const a = who ? s.actors.list.find(x => x.who === who) : null;
      if (!a || standOk(G, a.x, a.z)) continue;
      const d = who === pid ? s.stop?.doing : H.two?.doing, mv = d?.beats?.find(b => b.st === 'run' && b.k === 'move');
      bad.push({ who: who === pid ? '#1' : '#2', src: d ? `${d.step}${mv ? `/${mv.key}` : ''}` : who === pid ? (s.stop?.feet ? 'feet' : 'keys') : 'idle', x: a.x, z: a.z, into: Math.round(intoWall(G, a.x, a.z) * 1000) / 1000, ms: s.clock.ms });
    }
  } });
  return { ticks, bad, done: r.done, card: houseNow(g.state)?.summary ?? '' };
}
// (the runs of seeds × sheets × bots: their totals and the first offences)
function wallRuns(seeds, kinds, sheets = HOUSE_SHEETS) {
  const out = { runs: 0, ticks: 0, bad: [], undone: [] };
  for (const kind of kinds) for (const tier of sheets) {
    if (kind === 'T' && RUNG_OF_TIER[tier] < 2) continue;
    for (const seed of seeds) {
      const r = wallRun({ tier, seed, kind });
      out.runs++; out.ticks += r.ticks;
      for (const b of r.bad) out.bad.push({ kind, tier, seed, ...b });
      if (!r.done) out.undone.push(`${kind} ${tier} ${seed}`);
    }
  }
  return out;
}
const said = (o) => `${o.runs} lanes, ${o.ticks} ticks, 2 bodies a tick: ${o.bad.length} ticks in a wall${o.bad.length ? ` (first ${JSON.stringify(o.bad.slice(0, 3))})` : ''}; lanes not to the card ${o.undone.length}`;

export default [
  {
    name: 'the plans\' authored points stand where the walker may, and every authored path routed is clear at C0 (the stack-to-threshold legs cut every jamb: routing goes round, keeping the plan\'s points)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'go' }), s = g.state, lane = lanePlanOf(s), G = openNavOf(lane.area, ROUTE_CLS), out = [], bad = [];
      let cut = 0, legs = 0;
      for (const door of lane.order) {
        const P = lane.plans[door];
        for (const p of [...P.stack, ...P.points, P.threshold, ...(P.far?.path ?? [])]) if (!standOk(G, p[0], p[1])) bad.push({ door, p });
        for (const path of [...Object.values(P.paths), ...(P.far ? [P.far.path] : [])]) {
          for (let i = 1; i < path.length; i++) { legs++; if (!clearLine(G, path[i - 1][0], path[i - 1][1], path[i][0], path[i][1])) cut++; }
          // (open: the plan's own door, as its bundle swings it before the feet reach it)
          const way = routed(s, path, { area: lane.area, open: [P.door].filter(Boolean) });
          for (const p of path) if (!way.some(w => w[0] === p[0] && w[1] === p[1])) bad.push({ door, lost: p });
          for (let i = 1; i < way.length; i++) {
            const L = Math.hypot(way[i][0] - way[i - 1][0], way[i][1] - way[i - 1][1]), n = Math.max(1, Math.ceil(L / 0.01));
            for (let k = 0; k <= n; k++) { const x = way[i - 1][0] + (way[i][0] - way[i - 1][0]) * k / n, z = way[i - 1][1] + (way[i][1] - way[i - 1][1]) * k / n; if (!standOk(G, x, z)) { bad.push({ door, at: [x, z], into: intoWall(G, x, z) }); break; } }
          }
          out.push(`${door === 'hall' ? 'hall' : door.split(':').at(-1)} ${path.length} → ${way.length} points`);
        }
      }
      console.log(`      C0 ${CLASSES.C0} m; the authored legs not clear on the grid: ${cut} of ${legs}; routed: ${out.join(', ')}`);
      assert(!bad.length && cut > 0, JSON.stringify({ bad: bad.slice(0, 4), cut }));
    },
  },
  {
    name: 'no body in a wall, every tick: the player and the #2 on seed 48213 and the user\'s 1489397426, every sheet by the house bot and from rung 2 by T alone, clear of every wall at the walker\'s 0.27 m (the user, 2026-11-11: "Operators path through walls when automatic pathing")',
    timeoutMs: 180_000,
    fn() {
      const o = wallRuns([48213, 1489397426], ['house', 'T']);
      console.log(`      ${said(o)}`);
      assert(!o.bad.length && !o.undone.length, JSON.stringify({ bad: o.bad.slice(0, 6), undone: o.undone }));
    },
  },
  {
    name: 'no body in a wall over 100 seeds and every sheet by the house bot, and 10 seeds of every sheet by the fuzz bot (its Dominate from the far leg once ended inside the wing\'s wall, outside every room)',
    heavy: true,
    timeoutMs: 20 * 60_000,
    fn() {
      const seeds = Array.from({ length: 100 }, (_, i) => i + 1);
      const o = wallRuns(seeds, ['house']), f = wallRuns(seeds.slice(0, 10), ['fuzz']);
      console.log(`      the house bot: ${said(o)}`);
      console.log(`      the fuzz bot: ${said(f)} (the fuzz bot need not finish)`);
      assert(!o.bad.length && !f.bad.length && !o.undone.length, JSON.stringify({ bad: [...o.bad, ...f.bad].slice(0, 6), undone: o.undone.slice(0, 6) }));
    },
  },
];
