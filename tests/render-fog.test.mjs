// OLYMPUS tests: the fog of awareness is perception's own sight, cell for cell (heavy).
//
// The hub and VIEWS §2.11: "the same visibility function draws the fog and decides the dice". The view
// (src/render/view.js) asks people's sightMask (src/sim/people/perception.js) for its fog's cells round
// the camera and keeps the last answer (stats.fogMask: the box, the values, the game time and the eyes it
// was asked at). Here, in three scenes (the bay at 23:00, 2nd Platoon's hallway at 12:00, the company
// street at noon), the game is paused, the page's state is taken to node (its JSON, as a save), and
// people's sightMask is asked again there over the same box at the same time from the same eyes: every
// cell must agree (to 1e-6: Chrome's V8 and node's may round a transcendental a hair apart, TECH
// correction 24). Prints the cells compared, the mismatches, the seen cells and the view's recompute ms.
import { assert, fmt } from './helpers.mjs';
import { withGame } from './browser.mjs';
import { fromJSON } from '../src/core/state.js';
import { playerActor } from '../src/core/ids.js';
import { eyeOf, sightMask } from '../src/sim/people/perception.js';

const SCENES = [
  ['the bay at 23:00', 'play=barracks&hour=23&seed=48213'],
  ['2nd Platoon\'s hallway at 12:00', 'play=barracks&hour=12&seed=48213&area=melas.echo.1&at=57.7,8.8&face=right'],
  ['the company street at noon', 'play=barracks&hour=12&seed=48213&area=melas.ground&at=530,224&face=up'],
];

export default [
  {
    name: 'the fog is people\'s sightMask, cell for cell: the bay at 23:00, the hallway at noon, the street at noon (VIEWS §2.11: one function draws the fog and decides the dice)',
    heavy: true,
    timeoutMs: 180000,
    async fn() {
      await withGame(async (page, errors, game) => {
        for (const [what, q] of SCENES) {
          await game.open(`${q}&nostore=1`);
          await page.waitForTimeout(1200);
          await page.keyboard.press('Space');                           // (paused: the clock and the eyes hold)
          await page.waitForTimeout(400);
          const got = await page.evaluate(() => {
            const v = window.__report.view, m = v.fogMask;
            return { json: JSON.stringify(window.__olympus.state), mask: m ? { x0: m.x0, z0: m.z0, nx: m.nx, nz: m.nz, cellM: m.cellM, ms: m.ms, eye: m.eye, vis: Array.from(m.vis) } : null, fog: v.fog, area: v.area?.id };
          });
          assert(got.mask, `${what}: the view has no fog mask (${JSON.stringify(got.fog)})`);
          const s = fromJSON(got.json), me = playerActor(s);
          s.clock.ms = got.mask.ms;
          const eye = eyeOf(s, me);
          const mine = sightMask(s, eye, { x0: got.mask.x0, z0: got.mask.z0, nx: got.mask.nx, nz: got.mask.nz, cellM: got.mask.cellM, vis: new Float32Array(got.mask.nx * got.mask.nz) });
          let bad = 0, seen = 0, first = null;
          for (let k = 0; k < mine.vis.length; k++) {
            if (got.mask.vis[k] > 0.5) seen++;
            if (Math.abs(mine.vis[k] - got.mask.vis[k]) > 1e-6) { bad++; first ??= { k, page: got.mask.vis[k], node: mine.vis[k] }; }
          }
          console.log(`      ${what} (${got.area}): ${mine.vis.length} cells compared (${got.mask.nx} × ${got.mask.nz} from ${got.mask.x0}, ${got.mask.z0}), ${bad} mismatches, ${seen} seen; the eyes at (${fmt(eye.x, 2)}, ${fmt(eye.z, 2)}) as the page had them (${fmt(got.mask.eye.x, 2)}, ${fmt(got.mask.eye.z, 2)}); the view's recompute ${fmt(got.fog.ms, 2)} ms, ${got.fog.recomputes} recomputes`);
          assert(!bad, `${what}: ${bad} cells differ (first ${JSON.stringify(first)})`);
          assert(Math.abs(eye.x - got.mask.eye.x) < 1e-9 && Math.abs(eye.z - got.mask.eye.z) < 1e-9, `${what}: the eyes moved`);
          assert(!errors.length, errors.join('\n'));
        }
      }, { query: `${SCENES[0][1]}&nostore=1`, timeoutMs: 60000 });
    },
  },
];
