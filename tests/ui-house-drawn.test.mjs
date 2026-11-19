// OLYMPUS tests: the drawn house in the page (the build sheet v0.0.21 §1 items 1 and 2, §0 item 48, §6; house lens H10): three drawn layouts built and drawn with no warning.
//
// For three codes (the user's seed's; seed 2's, a pull door south of the hall and one found open; the corner room last), ?play=test-shoothouse&house=<code>: the
// stage builds the drawn area (render/view.js build, the worker given the area record whole, so the paint job never looks a `~` id
// up itself: a lookup there would be an error, and the page's errors fail the test) within AREA_BUILD_MS 250 (view.js warns past it:
// any console warning fails the case), the area built is the drawn one, the house's stands built from its spec (render/range.js
// buildHouse, built again for each new spec), the doors' arcs drawn (a pull door's leaf in the hall among them), and the corner
// aid's mark at the drawn plan's point once the boot recruit stands on his stack. Heavy (a browser, its own port: OLYMPUS_TEST_PORT).
// v0.0.22 (its build sheet §0 item 42, §6 A): layout B (by &layout=B: the long room, the offset room, the room with its back room),
// layout C (&layout=C: the small room, the narrow room, the L) and a house drawn from all eight rooms holding the twin (&house=, seed 2's
// draw: the twin as room 2), each as the three above, and the leaves drawn exactly the area's hinged doors' (zones.js arcsOf: the
// twin's 1.2 m inner doorway drawn with no leaf).
import { assert } from './helpers.mjs';
import { withGame } from './browser.mjs';
import { drawnCodeOf, parseHouse } from '../src/sim/scenes/assemble.js';

// (v0.0.22: the named layouts by their URL (&layout=), and an eight-room code holding the twin)
const CODES = Object.freeze([drawnCodeOf(48213), 'Ks280lc.En250lc.Cs220po', 'Es280pc.Cn250pc.Kn160pc', 'layout=B', 'layout=C', drawnCodeOf(2, { rooms: 'all' })]);

export default [
  {
    name: 'six drawn layouts in the page (v0.0.21\'s three, layouts B and C, an eight-room house with the twin): each area built (the drawn one, under AREA_BUILD_MS: no console warning), its stands and its doors\' arcs drawn (a pull door\'s among them), the corner aid at the drawn point on the stack, no page error',
    heavy: true,
    timeoutMs: 600_000,
    async fn() {
      const port = Number(process.env.OLYMPUS_TEST_PORT) || undefined, rows = [], bad = [];
      await withGame(async (page, errors, game) => {
        const warns = [];
        page.on('console', m => { if (m.type() === 'warning' || m.type() === 'warn') warns.push(m.text()); });
        for (const code of CODES) {
          warns.length = 0;
          await game.open(`play=test-shoothouse&tier=recruit&seed=48213&setup=go&nostore=1&${code.startsWith('layout=') ? code : `house=${encodeURIComponent(code)}`}`);
          await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.course === 'house', null, { timeout: 60000 });
          // (the boot recruit by the keys to room 1's stack, time held by hand (no frames in between), then the page's frames drawn)
          await page.evaluate(async () => {
            const O = window.__olympus, { houseBot } = await import('/tests/bots/house.mjs'), bot = houseBot({ mode: 'keys' }), mem = {};
            O.pause(true);
            for (let n = 0; n < 4000; n++) { const s = O.state, L = s.armoury.range.house.rooms[0]; if (L.stackAtMs !== null) break; const me = s.actors.list.find(a => a.id === s.player.actor); if (s.skip?.engine === 'ff') { O.step(1); O.sim.ffCheck(s); } else O.step(1, bot(s, me, mem)); }
            O.pause(false);
          });
          await page.waitForTimeout(1500);
          const v = await page.evaluate(() => {
            const O = window.__olympus, s = O.state, H = s.armoury.range.house, hl = O.house()?.look ?? null, V = window.__report?.view ?? {};
            const marks = hl?.aid?.marks ?? [];
            return { live: s.places.live.area, code: H.draw?.code ?? null, area: V.area ?? null, house: V.range?.house ?? null, marks: marks.map(m => ({ slot: m.slot, point: m.point })), stacked: H.rooms[0].stackAtMs !== null };
          });
          const pts = await page.evaluate(async () => { const { lanePlanOf } = await import('/src/sim/combat/room.js'); const L = lanePlanOf(window.__olympus.state); return L.plans[L.order[0]].points; });
          // (v0.0.22: the stage's leaves by opening (__olympus.leaves): every lane door has one, no leafless doorway of a room has one (the
          // twin's inner doorway, the ell's leg))
          const doors = await page.evaluate(async () => {
            const { areaOf } = await import('/src/sim/places/model.js'), O = window.__olympus, a = O.state.places.live.area, leafs = new Set((O.leaves?.() ?? []).map(l => l.opening));
            const rooms = (areaOf(a)?.openings ?? []).filter(o => o.kind === 'doorway' && /:r\d-/.test(o.id)), lane = O.state.armoury.range.house.rooms.map(L => L.door);
            return { leafs: leafs.size, laneLeafed: lane.filter(id => leafs.has(id)).length, lane: lane.length, doorways: rooms.map(o => o.id), leafedDoorways: rooms.filter(o => leafs.has(o.id)).length };
          });
          const mark1 = v.marks.find(m => m.slot === 1)?.point ?? null, at = mark1 && Math.hypot(mark1[0] - pts[0][0], mark1[1] - pts[0][1]);
          const pulls = parseHouse(v.code).rooms.filter(R => R.how === 'pull').length;
          rows.push(`${code}: ${v.code}: live ${v.live}, built ${v.area?.id} in ${Math.round(v.area?.buildMs ?? -1)} ms; stands ${v.house?.stands}, arcs ${v.house?.leaves} (${pulls} pull); leaves ${doors.leafs}, the lane doors leafed ${doors.laneLeafed} of ${doors.lane}, the rooms' doorways ${doors.doorways.length} (${doors.doorways.map(x => x.split(':').pop()).join(', ') || 'none'}) leafed ${doors.leafedDoorways}, aid ${v.house?.aid}; the stack ${v.stacked}, #1's mark ${JSON.stringify(mark1)} against the plan's ${JSON.stringify(pts[0])}; warnings ${warns.length}`);
          if (v.area?.id !== v.live || !v.code || warns.length || !v.stacked || !(at < 0.01) || !(v.house?.leaves > 0) || doors.laneLeafed !== doors.lane || doors.leafedDoorways) bad.push(code);
        }
      }, { port });
      for (const r of rows) console.log(`      ${r}`);
      assert(!bad.length, `off: ${bad.join(', ')}`);
    },
  },
];
