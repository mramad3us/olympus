// OLYMPUS tests: a long session stays light (the build sheet v0.0.21 §1 item 15, §6 D; the perf lens's P9). Heavy: a browser file.
//
// The sim does not grow over ninety lanes (the perf lens's soak.mjs: 24.0 MB after the first, 29.7 at 90); the page had never been
// soaked. Twelve "Again"s in one page (the debug handle's newGame, the same launch the end card's Again makes: main.js launch),
// on varied seeds and sheets, "Stack and clear, live" every third (its role-players on the hit card), each played a few seconds
// by T, then a collection forced through the DevTools protocol (HeapProfiler.collectGarbage; Runtime.getHeapUsage for the heap,
// no Chrome flags needed) and the stage's textures and geometries (three's renderer.info, report.stage): from the third to the
// twelfth the heap grows at most SOAK_GROWTH_MB 8, the textures and geometries no more than SOAK_GL_SLACK (a band or a page
// in flight) from the first count with the caches of areas full (the third, or the second drawn house's), the hit card's board dolls bounded by their faces and the dressed dolls at most dress.js DOLL_LRU. Before v0.0.21 the
// hit card kept every man's doll and mask by his key, never let go (a new #2 a seed, three scales, about 36 KB each). Every
// second "Again" is on the house drawn from its seed (draw 'drawn'; "Stack and clear, live" forces the set, so the sixth and the
// twelfth are the set's): each code its own area, and the session's caches of them (scenes/assemble.js's layouts held, the
// generated areas registered in places/model.js, the view's areas built) hold at most HOUSE_REG_KEEP 2 drawn houses at every
// count, over four drawn (the review of 2026-11-16: until then every lane here was the set, so nothing held the caches).
import { assert, fmt } from './helpers.mjs';
import { withGame } from './browser.mjs';
import { DOLL_LRU } from '../src/art/doll/dress.js';
import { HOUSE_REG_KEEP } from '../src/sim/scenes/assemble.js';
import { GEN_MARK } from '../src/sim/places/model.js';

/** The heap's growth allowed from the third "Again" to the twelfth (MB; the build sheet §5). */
export const SOAK_GROWTH_MB = 8;
/** The textures and geometries allowed past the third's (a band or a page in flight at the count; my call). */
export const SOAK_GL_SLACK = 4;
const SHEETS = ['tierone', 'sgt', 'private', 'raider', 'cpl', 'recruit'];

export default [
  {
    name: 'a long session stays light: twelve "Again"s on varied seeds and sheets, live every third, drawn every second, from the third to the twelfth the heap grows at most 8 MB after a collection, the textures and geometries flat, the hit card\'s and the dressed dolls bounded (dress.js DOLL_LRU), at most HOUSE_REG_KEEP 2 drawn houses in every cache of areas',
    heavy: true,
    timeoutMs: 600000,
    async fn() {
      await withGame(async (page, errors) => {
        const cdp = await page.context().newCDPSession(page);
        const rows = [];
        for (let i = 1; i <= 12; i++) {
          const live = i % 3 === 0, drawn = i % 2 === 0 && !live, tier = SHEETS[i % SHEETS.length], seed = 48213 + 7919 * i;
          await page.evaluate(({ seed, tier, live, drawn }) => window.__olympus.newGame({ seed, scenario: 'test-shoothouse', scene: live ? 'test-shoothouse-live' : 'test-shoothouse', setup: 'go', tier, ...(live ? { opfor: 'live' } : {}), ...(drawn ? { draw: 'drawn' } : {}) }), { seed, tier, live, drawn });
          await page.waitForFunction(() => window.__olympus.state?.armoury?.range?.house && !(window.__report.pending ?? []).length, null, { timeout: 60000 });
          // (a few seconds of the lane by T: the rooms, the #2, the hit card's men where they turn)
          for (let k = 0; k < 6; k++) { await page.keyboard.press('KeyT'); await page.waitForTimeout(600); }
          await cdp.send('HeapProfiler.collectGarbage'); await cdp.send('HeapProfiler.collectGarbage');
          const heap = await cdp.send('Runtime.getHeapUsage');
          const r = await page.evaluate(() => ({ tex: window.__report.stage?.textures ?? null, geo: window.__report.stage?.geometries ?? null, area: window.__olympus.state?.armoury?.range?.area ?? null, code: window.__olympus.state?.armoury?.range?.house?.draw?.code ?? null, ...window.__olympus.perf }));
          const gen = (ids) => (ids ?? []).filter(id => String(id).includes(GEN_MARK));
          const caches = { layouts: gen(r.layouts).length, generated: gen(r.generated).length, view: r.viewAreas === null ? null : gen(r.viewAreas).length, viewAll: r.viewAreas?.length ?? null };
          rows.push({ i, tier, seed, live, drawn, mb: heap.usedSize / 1048576, ...r, caches });
          console.log(`      Again ${String(i).padStart(2)} (${tier}${live ? ', live' : ''}${drawn ? `, drawn ${r.code}` : ''}, ${seed}): heap ${fmt(heap.usedSize / 1048576, 1)} MB; textures ${r.tex}, geometries ${r.geo}; the hit card's boards ${r.hitDolls}, the dressed dolls ${r.dressed}; drawn houses held: layouts ${caches.layouts}, areas registered ${caches.generated}, the view's ${caches.view} of ${caches.viewAll} areas built`);
        }
        const third = rows[2], last = rows.at(-1), grew = last.mb - third.mb;
        // (the textures and geometries from the third "Again", or from the first whose caches of areas are full if later: a drawn house
        // held is an area built (the view's AREA_CACHE, the set and HOUSE_REG_KEEP drawn), so the fourth's second drawn house adds its
        // build once (38 to 44 geometries on the run of 2026-11-16) and nothing after; the slack is SOAK_GL_SLACK as before)
        const full = rows.find(r => r.i >= 3 && r.caches.view >= HOUSE_REG_KEEP) ?? third;
        console.log(`      from the third to the twelfth: the heap ${fmt(third.mb, 1)} → ${fmt(last.mb, 1)} MB (${grew >= 0 ? '+' : ''}${fmt(grew, 1)}, at most ${SOAK_GROWTH_MB}); textures ${third.tex} → ${last.tex}, geometries ${third.geo} → ${last.geo}; the dolls at most ${Math.max(...rows.map(r => r.dressed))} dressed (DOLL_LRU ${DOLL_LRU}), ${Math.max(...rows.map(r => r.hitDolls))} boards; the drawn houses: ${rows.filter(r => r.drawn).length} played (${new Set(rows.filter(r => r.drawn).map(r => r.area)).size} areas), at most ${Math.max(...rows.map(r => r.caches.layouts))} layouts held, ${Math.max(...rows.map(r => r.caches.generated))} areas registered, ${Math.max(...rows.map(r => r.caches.view ?? 0))} in the view's cache (HOUSE_REG_KEEP ${HOUSE_REG_KEEP})`);
        assert(rows.filter(r => r.drawn).every(r => r.code && String(r.area).includes(GEN_MARK)) && new Set(rows.filter(r => r.drawn).map(r => r.area)).size > HOUSE_REG_KEEP, JSON.stringify(rows.map(r => [r.i, r.drawn, r.area, r.code])));
        assert(rows.every(r => r.caches.layouts <= HOUSE_REG_KEEP && r.caches.generated <= HOUSE_REG_KEEP && r.caches.view !== null && r.caches.view <= HOUSE_REG_KEEP), JSON.stringify(rows.map(r => [r.i, r.caches])));
        assert(grew <= SOAK_GROWTH_MB, JSON.stringify(rows.map(r => [r.i, Math.round(r.mb * 10) / 10])));
        console.log(`      the textures and geometries from the ${full.i}th "Again" (its caches of areas full): ${full.tex} → ${last.tex}, ${full.geo} → ${last.geo} (at most +${SOAK_GL_SLACK})`);
        assert(last.tex <= full.tex + SOAK_GL_SLACK && last.geo <= full.geo + SOAK_GL_SLACK, JSON.stringify({ full, last }));
        assert(rows.every(r => r.dressed <= DOLL_LRU) && Math.max(...rows.map(r => r.hitDolls)) <= rows[2].hitDolls + 6, JSON.stringify(rows.map(r => [r.dressed, r.hitDolls])));
        assert(!errors.length, errors.join('\n'));
      }, { query: 'play=test-shoothouse&seed=48213&tier=tierone&setup=go&nostore=1', timeoutMs: 120000 });
    },
  },
];
