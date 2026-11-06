// places-portals: moving between areas through portals, and doors turned by R (the build sheet 0.0.3
// §2.1, §5.1; PLACES §1.6, §1.9, §2.5). Each of Echo's portals is walked both ways through the
// movement layer (the player's keys, not a teleport): the front door and the east and west exits to the
// ground and back in, the three stairs up and down. A crossing is one 'area-leave' and one 'area-enter'
// with the portal's id, one autosave { why: 'area' }, the actor at the portal's arrival. Then the doors:
// bay-2-1's door closed blocks a path (the request answered 'locked'), R from the hallway opens it, its
// leaf frees its cells openS later and blocks at once on closing, and a walker caught in the leaf is
// settled out; the ground's reveal at the front door is blocked while o:e1:front is closed; handOffer
// names the door in reach, the wait elsewhere, and nothing behind the player. And a save made mid-walk
// and loaded crosses on the same tick as the run that was never saved (the digests equal).
//
// The game is a barracks game where people's scenario exists, else the sandbox moved into Echo's bay
// (tests/bots/walker.mjs melasGame: a local fixture until people's role lands, the round's rule).
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { melasGame } from './bots/walker.mjs';
import { areaOf, setOpening, openingState, leafClosed } from '../src/sim/places/model.js';
import { navOf, cellOf, requestPath, chunkGrid, CHUNK_M, CLASSES } from '../src/sim/places/nav.js';
import { moveTo } from '../src/sim/places/portals.js';
import { handOffer, DOOR_REACH_M } from '../src/sim/places/hand.js';
import { leafAt } from '../src/sim/places/doors.js';
import { standOk } from '../src/sim/places/collide.js';
import { STEP_M, PORTAL_DEPTH_M } from '../src/sim/places/plan.js';

const KEY = { s: { mz: 1 }, n: { mz: -1 }, e: { mx: 1 }, w: { mx: -1 } };
const BACK = { s: 'n', n: 's', e: 'w', w: 'e' };
const FACE = { s: 'down', n: 'up', e: 'right', w: 'left' };
// (put the player at a point of an area, facing a way, with no facts heard)
function put(g, area, x, z, face) {
  if (g.state.places.live.area !== area) moveTo(g.state, g.me().id, { area, x, z, face }, null, { why: 'test' });
  Object.assign(g.me(), { x, z, face, $px: x, $pz: z });
  g.clearFacts();
}
// (press one way until the live area changes, at most maxTicks: the tick it changed, where the actor stood then)
function walkOut(g, dir, maxTicks = 200) {
  const from = g.state.places.live.area;
  for (let t = 1; t <= maxTicks; t++) {
    g.step(1, KEY[dir]);
    if (g.state.places.live.area !== from) return { ticks: t, at: [g.me().x, g.me().z], area: g.state.places.live.area };
  }
  return { ticks: null, at: [g.me().x, g.me().z], area: from };
}
const facts = (g) => ({ leave: g.facts('area-leave'), enter: g.facts('area-enter'), saves: g.facts('autosave').filter(a => a.why === 'area'), logs: g.facts('log').filter(l => l.entry.kind === 'place') });

export default [
  {
    name: 'every portal of Echo, both ways, walked through the movement layer: one area-leave and one area-enter with its id, one autosave { why: "area" }, the actor at its arrival',
    fn() {
      const g = melasGame(createGame, { seed: 48213, hour: 12 });
      for (const id of ['o:e1:front', 'o:e1:vestibule', 'o:e1:east-exit', 'o:e1:vest-e', 'o:e1:west-exit', 'o:e1:vest-w']) setOpening(g.state, id, 'open');
      const floor1 = areaOf('melas.echo.1'), rows = [], bad = [];
      for (const p of floor1.portals) {
        const back = areaOf(p.to.area).portals.find(q => q.to.area === floor1.id && q.via === p.via);
        // (on floor 1 at the return's arrival, facing out; walk out, then back in)
        put(g, floor1.id, back.to.x, back.to.z, FACE[p.band.out]);
        const out = walkOut(g, p.band.out), f1 = facts(g);
        const okOut = out.area === p.to.area && f1.leave.length === 1 && f1.enter.length === 1 && f1.enter[0].portal === p.id && f1.leave[0].portal === p.id && f1.saves.length === 1 && f1.logs.length === 1;
        g.clearFacts();
        // (the arrival: placed at `to` on the crossing tick, then the keys' step after it is next tick's)
        const at = [out.at[0], out.at[1]], gap = Math.sqrt((at[0] - p.to.x) ** 2 + (at[1] - p.to.z) ** 2);
        const inn = walkOut(g, back.band.out), f2 = facts(g);
        const okIn = inn.area === floor1.id && f2.leave.length === 1 && f2.enter.length === 1 && f2.enter[0].portal === back.id && f2.saves.length === 1;
        rows.push(`${p.id.padEnd(18)} out ${String(out.ticks).padStart(3)} ticks to ${p.to.area} (${fmt(at[0], 2)}, ${fmt(at[1], 2)}), ${fmt(gap, 3)} m from its arrival; back by ${back.id} in ${String(inn.ticks).padStart(3)} ticks to (${fmt(inn.at[0], 2)}, ${fmt(inn.at[1], 2)})`);
        if (!okOut || !okIn || gap > 1e-9) bad.push(`${p.id}: ${JSON.stringify({ out, f1: { leave: f1.leave.length, enter: f1.enter, saves: f1.saves.length }, gap, inn, f2: { leave: f2.leave.length, enter: f2.enter, saves: f2.saves.length } })}`);
      }
      for (const r of rows) console.log(`      ${r}`);
      console.log(`      a portal fires ${STEP_M} to ${STEP_M + PORTAL_DEPTH_M} m past its band; the log says "${g.state.log.filter(l => l.kind === 'place').at(-1)?.text}"`);
      assert(rows.length === 6 && !bad.length, bad.join('\n'));
    },
  },
  {
    name: 'bay-2-1\'s door: closed it blocks (the path answered "locked"); R from the hallway opens it; its leaf frees its cells openS later and blocks at once on closing; a walker in the leaf is settled out',
    fn() {
      const g = melasGame(createGame, { seed: 48213, hour: 12 });
      const D = 'o:e1:bay-2-1', o = areaOf('melas.echo.1').openings.find(x => x.id === D), mid = [(o.a + o.b) / 2, o.at];
      const grid = () => navOf(g.state, 'melas.echo.1', 'C0'), leafCell = () => grid().cost[cellOf(grid(), mid[0], mid[1])];
      // (closed: a path from the bay to the hallway is 'locked')
      requestPath(g.state, { who: g.me().id, area: 'melas.echo.1', cls: 'C0', from: [52.075, 3.3], to: [57.7, 8.8] });
      g.step(3);
      const answer = g.facts('path-done').at(-1);
      // (R from the hallway, facing it)
      put(g, 'melas.echo.1', mid[0], 8.6, 'up');
      const offer = handOffer(g.state), t0 = g.state.clock.ms;
      g.step(1, { act: ['hand'] });
      const door = g.facts('door').at(-1), freedAt = [];
      // (the tick a step runs is at the clock before it: the leaf is freed by the tick at t0 + openS)
      for (let t = 0; t < 40 && !freedAt.length; t++) { const before = g.state.clock.ms; g.step(1); if (leafCell() !== 255) freedAt.push(before - t0); }
      const fracs = [0, 500, 1000].map(dt => leafAt(g.state, D, t0 + dt));
      const offer2 = handOffer(g.state);
      // (closing blocks at once; a walker standing in the leaf is put out on the next tick)
      put(g, 'melas.echo.1', mid[0], mid[1], 'up');
      g.step(1, { act: [{ act: 'door', args: { id: D, to: 'closed' } }] });
      const blockedNow = leafCell() === 255, out = [g.me().x, g.me().z], settled = standOk(grid(), out[0], out[1]) && Math.abs(out[1] - mid[1]) > 0.27;
      console.log(`      closed: the request from the bay to the hallway answered '${answer?.reason}'`);
      console.log(`      from the hallway facing it, R offers "${offer?.label}" (${offer?.target}); pressed: the door fact ${JSON.stringify(door)}`);
      console.log(`      its cells free ${freedAt[0]} ms after R (openS ${o.openS} s); the leaf at 0, 0.5 and 1.0 s open ${fracs.map(f => fmt(f, 2)).join(', ')}; then R offers "${offer2?.label}"`);
      console.log(`      closed on a walker in it: blocked at once ${blockedNow}, the walker put out to (${fmt(out[0], 3)}, ${fmt(out[1], 3)}), standing clear ${settled}`);
      assert(answer?.reason === 'locked', JSON.stringify(answer));
      assert(offer?.verb === 'open' && offer.target === D && door?.id === D && door.state === 'open' && door.area === 'melas.echo.1', JSON.stringify({ offer, door }));
      assert(freedAt[0] === o.openS * 1000 && fracs[0] === 0 && fracs[1] === 0.5 && fracs[2] === 1 && offer2?.verb === 'close', JSON.stringify({ freedAt, fracs, offer2 }));
      assert(blockedNow && settled && openingState(g.state, D) === 'closed', JSON.stringify({ blockedNow, out, settled }));
    },
  },
  {
    name: 'the ground\'s reveal at the front door is blocked while o:e1:front is closed and free while it is open, one leaf read on both sides; R on the ground opens it too, and its door fact is the street\'s (heard there)',
    fn() {
      const g = melasGame(createGame, { seed: 48213, hour: 12 });
      put(g, 'melas.ground', 522, 215.2, 'up');
      const cell = () => { const w = navOf(g.state, 'melas.ground', 'C0', 522, 215); return w.cost[cellOf(w, 522, 213.5)]; };
      const shut = cell(), offer = handOffer(g.state);
      g.clearFacts();
      g.step(1, { act: ['hand'] });
      const doorFacts = g.facts('door');
      g.step(30);
      const open = cell(), inside = openingState(g.state, 'o:e1:front'), cross = walkOut(g, 'n', 60);
      console.log(`      the reveal's middle (522, 213.5) on the ground: shut cost ${shut}, after R "${offer?.label}" and 1.5 s cost ${open}; the floor's o:e1:front reads '${inside}'; walked north: into ${cross.area} in ${cross.ticks} ticks`);
      console.log(`      the door facts of R on the street: ${JSON.stringify(doorFacts.map(f => ({ area: f.area, x: f.x, z: f.z, state: f.state })))} (heard in the live area, where it stands on the street)`);
      assert(shut === 255 && open !== 255 && offer?.target === 'o:e1:front' && inside === 'open' && cross.area === 'melas.echo.1', JSON.stringify({ shut, open, offer, inside, cross }));
      // (v0.0.3's review: the fact named the floor, and the audio, hearing only the live area, dropped it)
      assert(doorFacts.length === 1 && doorFacts[0].area === 'melas.ground' && Math.abs(doorFacts[0].x - 522) < 1 && Math.abs(doorFacts[0].z - 214) < 0.5, JSON.stringify(doorFacts));
    },
  },
  {
    name: 'handOffer names the nearest door in reach in the player\'s facing half-plane, the wait elsewhere, nothing behind the player, and null while time stands still',
    fn() {
      const g = melasGame(createGame, { seed: 48213, hour: 12 });
      const rows = [], at = (x, z, face) => { put(g, 'melas.echo.1', x, z, face); const o = handOffer(g.state); rows.push(`(${x}, ${z}) facing ${face}: ${o ? `${o.verb} ${o.target ?? ''}`.trim() : 'null'}`); return o; };
      const a = at(57.7, 8.6, 'up'), b = at(57.7, 8.6, 'down'), c = at(65.6, 9.0, 'down'), d = at(52.075, 3.3, 'down'), e = at(57.7, 7.6, 'down');
      g.step(1, { act: ['ready'] });
      const held = handOffer(g.state);
      g.step(1, { act: ['digit:1'] });
      for (const r of rows) console.log(`      ${r}`);
      console.log(`      while time stands still: ${held}; reach ${DOOR_REACH_M} m`);
      assert(a?.target === 'o:e1:bay-2-1' && a.verb === 'open', JSON.stringify(a));
      assert(b?.verb === 'wait' || (b?.target && b.target !== 'o:e1:bay-2-1'), `behind the player: ${JSON.stringify(b)}`);
      assert(c?.target === 'o:e1:head-2b', JSON.stringify(c));
      assert(d?.verb === 'wait' && d.label === 'wait 15 min', JSON.stringify(d));
      assert(e?.target === 'o:e1:bay-2-1', `standing in the doorway: ${JSON.stringify(e)}`);
      assert(held === null, String(held));
      // (the page's R carries what its offer said: a want that no longer matches the offer's kind does nothing)
      put(g, 'melas.echo.1', 52.075, 3.3, 'down');
      g.clearFacts();
      g.step(1, { act: [{ act: 'hand', args: { want: 'door' } }] });
      const noWait = g.facts('skip-start').length;
      put(g, 'melas.echo.1', 57.7, 8.6, 'up');
      const before = openingState(g.state, 'o:e1:bay-2-1');
      g.step(1, { act: [{ act: 'hand', args: { want: 'wait' } }] });
      const noDoor = openingState(g.state, 'o:e1:bay-2-1') === before && g.facts('skip-start').length === 0;
      put(g, 'melas.echo.1', 52.075, 3.3, 'down');
      g.step(1, { act: [{ act: 'hand', args: { want: 'wait' } }] });
      const waited = g.facts('skip-start').length;
      console.log(`      R with a want: 'door' where the offer is the wait: ${noWait} skips; 'wait' at the bay door: door ${before} → ${openingState(g.state, 'o:e1:bay-2-1')}, no skip ${noDoor}; 'wait' where it waits: ${waited} skip`);
      assert(noWait === 0 && noDoor && waited === 1, JSON.stringify({ noWait, noDoor, waited }));
    },
  },
  {
    name: 'a save made mid-walk and loaded crosses the front door on the same tick, and ends with the same digest',
    fn() {
      const run = (saveAt) => {
        let g = melasGame(createGame, { seed: 48213, hour: 12 });
        for (const id of ['o:e1:front', 'o:e1:vestibule']) setOpening(g.state, id, 'open');
        put(g, 'melas.echo.1', 42.0, 21.6, 'down');
        let crossed = null;
        for (let t = 1; t <= 120; t++) {
          if (t === saveAt) { const json = g.save(); g = createGame({ scenario: g.state.meta.scenario, seed: 48213 }); g.load(json); }
          g.step(1, { mz: 1 });
          if (crossed === null && g.state.places.live.area === 'melas.ground') crossed = g.state.clock.tick;
        }
        return { crossed, digest: g.digest(), at: [g.me().x, g.me().z] };
      };
      const plain = run(null), saved = run(30);
      console.log(`      unsaved: onto the ground on tick ${plain.crossed}, ends at (${fmt(plain.at[0], 3)}, ${fmt(plain.at[1], 3)}), ${plain.digest}; saved at tick 30 and loaded: tick ${saved.crossed}, ${saved.digest}`);
      assert(plain.crossed !== null && plain.crossed === saved.crossed && plain.digest === saved.digest, JSON.stringify({ plain, saved }));
    },
  },
  {
    name: 'a door turned while no built ground chunk holds its reveal: the chunk built after it reads the door as it is, and the walk out matches a loaded copy\'s tick for tick (v0.0.3\'s review: the shared leaf record kept the old state)',
    fn() {
      const D = 'o:e1:east-exit', G = 'melas.ground';
      // (on the ground far north of Echo, so its chunks and the shared leaf records are built with no chunk at the east exit's reveal)
      let g = createGame({ scenario: 'barracks', seed: 48213, hour: 12 });
      put(g, G, 500, 20, 'down');
      g.step(5);
      const built = Object.keys(g.state.$places?.chunks?.[G] ?? {}).length > 0, recs = g.state.$places?.leaves?.[G] ?? {};
      const before = Object.fromEntries(Object.entries(recs).map(([cls, m]) => [cls, m.get(D)?.closed]));
      // (back inside at the exit, its door opened by the door action and left to swing open)
      put(g, 'melas.echo.1', 82.0, 17.0, 'down');
      g.step(1, { act: [{ act: 'door', args: { id: D, to: 'open' } }] });
      g.step(40);
      const after = Object.fromEntries(Object.entries(recs).map(([cls, m]) => [cls, m.get(D)?.closed]));
      const json = g.save(), h = createGame({ scenario: 'barracks', seed: 48213 });
      h.load(json);
      // (the reveal's chunk built now in both: the same cells)
      const ci = Math.floor(562 / CHUNK_M), cj = Math.floor(208.5 / CHUNK_M), area = areaOf(G);
      const ca = chunkGrid(g.state, area, ci, cj, 'C0'), cb = chunkGrid(h.state, area, ci, cj, 'C0');
      let differ = 0;
      for (let k = 0; k < ca.cost.length; k++) if (ca.cost[k] !== cb.cost[k]) differ++;
      // (both walk out of the exit and on south for 3 s)
      const walk = (x) => { const w = walkOut(x, 's', 80); x.step(60, KEY.s); return { ...w, end: [x.me().x, x.me().z], digest: x.digest() }; };
      const a = walk(g), b = walk(h);
      console.log(`      chunks built on the ground first: ${built}; ${D}'s shared record closed before ${JSON.stringify(before)}, after the door opened ${JSON.stringify(after)} (leafClosed ${leafClosed(g.state, D)})`);
      console.log(`      the reveal's chunk (${ci}, ${cj}) built after: ${differ} cells differ from the loaded copy's; walked out: unsaved onto ${a.area} in ${a.ticks} ticks, ends (${fmt(a.end[0], 2)}, ${fmt(a.end[1], 2)}) ${a.digest}; loaded ${b.area} in ${b.ticks}, (${fmt(b.end[0], 2)}, ${fmt(b.end[1], 2)}) ${b.digest}`);
      assert(built && Object.keys(before).length > 0 && Object.values(before).every(c => c === true), JSON.stringify({ built, before }));
      assert(Object.values(after).every(c => c === false), JSON.stringify(after));
      assert(differ === 0 && a.area === G && a.digest === b.digest, JSON.stringify({ differ, a, b }));
      assert(a.end[1] > 210, `stuck at the reveal: ${JSON.stringify(a.end)}`);
    },
  },
];
