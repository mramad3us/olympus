// OLYMPUS tests: walking the barracks and the base by keys, area to area, nothing popping (heavy).
//
// The build sheet 0.0.3 §5.3 and ROADMAP §4.4's moment 2: from 1st Squad's bay at 05:40, out by keys
// (R, what's at hand, at every closed door: the bay's, the stair's, the vestibule's two), up 2nd
// Platoon's east stair and down again, west along the hallways to the core, through the lobby and the
// dust vestibule, out of the front door onto Echo's company street, then round the barracks' west end
// to the north fence. Every portal is crossed by its band (the area records' own: places' data), every
// step by physical keys (tests/stage-drive.mjs walkTo). Prints each area change's cut (main.js's) and
// build, the chunks built and their main-thread work a frame, the lamps in the table, the frames walked,
// the see-through's fades; holds every cut at most CUT_MAX_MS (1 s), the chunks' main-thread work at most
// CHUNK_FRAME_MS (3 ms) a frame, no chunk first drawn inside the frame, no pool left out of the lamp
// table (so none appears or vanishes as the camera moves), the key light off whenever the canyon wall
// hides the sun (places' sunAt `eclipsed`), the player never left hidden by a mass (whenever something
// stands between the camera and them for longer than the dissolve, it is dissolved round them), no error.
import { assert, fmt, machine } from './helpers.mjs';
import { withGame } from './browser.mjs';
import { startSampling, stopSampling, walkTo, crossPortal, me, framesLine, pct } from './stage-drive.mjs';
import { areaOf } from '../src/sim/places/model.js';

// (the view's numbers, from src/render/view.js and chunks.js, which import three and so stay in the browser)
const CUT_MAX_MS = 1000, SEE_DISSOLVE_S = 0.25, CHUNK_FRAME_MS = 3;

const portalOf = (areaId, id) => (areaOf(areaId)?.portals ?? []).find(p => p.id === id);

export default [
  {
    name: 'out of the bay at 05:40 by keys, up the east stair and down, out of the front door and round to the north fence: every cut under a second, no chunk popping, nobody hidden (the build sheet 0.0.3 §5.3)',
    heavy: true,
    timeoutMs: 480000,
    async fn() {
      await withGame(async (page, errors) => {
        const log = [];
        const say = (l) => log.push(l);
        await page.waitForTimeout(800);
        await startSampling(page);
        const legs = [];
        const leg = async (what, p) => { const t0 = Date.now(), r = await p; legs.push({ what, ok: r.ok !== false, ms: Date.now() - t0, at: r.at, doors: r.doors ?? 0 }); assert(r.ok !== false, `${what}: stopped at ${JSON.stringify(r.at)} (${JSON.stringify(r.offer ?? null)})`); return r; };
        // (the bay, its door, the hallway east, the stair's door)
        await leg('to the aisle', walkTo(page, 52.075, 3.95, { log: say }));
        await leg('along the aisle to the door', walkTo(page, 57.7, 3.95, { log: say }));
        await leg('through the bay door (R)', walkTo(page, 57.7, 8.8, { zFirst: true, log: say }));
        await leg('east along hall-2', walkTo(page, 83.1, 8.8, { run: true, log: say }));
        await leg('into the stair (R)', walkTo(page, 83.1, 11.2, { zFirst: true, log: say }));
        await leg('to the flight', walkTo(page, 80.95, 12.6, { log: say }));
        await leg('up the east stair', crossPortal(page, portalOf('melas.echo.1', 'l:echo:stair-e'), { log: say }));
        await page.waitForTimeout(700);
        await leg('down the east stair', crossPortal(page, portalOf('melas.echo.2', 'l:echo:stair-e'), { log: say }));
        await page.waitForTimeout(700);
        await leg('out of the stair', walkTo(page, 83.1, 8.8, { log: say }));
        await leg('west along the hallways to the core', walkTo(page, 43.6, 8.8, { run: true, log: say }));
        await leg('through the lobby, east of the duty desk', walkTo(page, 43.6, 20.3, { zFirst: true, log: say }));
        await leg('to the vestibule\'s door', walkTo(page, 42, 20.3, { log: say }));
        await leg('through the vestibule\'s inner door (R)', walkTo(page, 42, 22.4, { zFirst: true, log: say }));
        await leg('out of the front door (R)', crossPortal(page, portalOf('melas.echo.1', 'o:e1:front'), { log: say }));
        await page.waitForTimeout(700);
        // (the street, the gap between Echo's west end and the armoury, north to the fence)
        await leg('onto the company street', walkTo(page, 522, 222, { zFirst: true, log: say }));
        await leg('west to Echo\'s west end', walkTo(page, 478, 222, { run: true, log: say }));
        await leg('north to the fence', walkTo(page, 478, 4, { run: true, zFirst: true, maxMs: 120000, log: say }));
        const frames = await stopSampling(page);
        const end = await me(page);
        const R = await page.evaluate(() => ({ cuts: window.__report.cuts ?? [], view: window.__report.view, sun: window.__olympus.sun?.() ?? null }));
        for (const l of legs) console.log(`      ${l.what}: ${fmt(l.ms / 1000, 1)} s to (${fmt(l.at.x, 2)}, ${fmt(l.at.z, 2)}) in ${l.at.area}${l.doors ? `, ${l.doors} door${l.doors > 1 ? 's' : ''} opened` : ''}`);
        for (const l of log) console.log(`        ${l}`);
        // (what the frames say)
        const areas = [...new Set(frames.map(f => f.area))], chunkF = frames.filter(f => f.chunks), maxChunkMs = Math.max(0, ...chunkF.map(f => f.chunks.mainMs ?? 0));
        const popped = Math.max(0, ...chunkF.map(f => f.chunks.popped ?? 0)), built = Math.max(0, ...chunkF.map(f => f.chunks.built ?? 0));
        const overflow = Math.max(0, ...frames.map(f => f.lamps?.overflow ?? 0)), tables = [...new Set(frames.map(f => `${f.area}: ${f.lamps?.table}`))];
        const lit = frames.filter(f => f.light?.eclipsed && f.light.sunK > 0).length, eclipsed = frames.filter(f => f.light?.eclipsed).length;
        let hiddenFor = 0, leftHidden = 0, hiddenFrames = 0, areaWas = null;
        for (const f of frames) { if (f.area !== areaWas) { hiddenFor = 0; areaWas = f.area; } if (f.see?.hidden) { hiddenFor += f.dt / 1000; hiddenFrames++; if (hiddenFor > SEE_DISSOLVE_S + 0.1 && f.see.k < 0.99) leftHidden++; } else hiddenFor = 0; }
        console.log(`      ${frames.length} frames walked through ${areas.join(' → ')}: ${framesLine(frames.map(f => f.dt))}; draw calls ${Math.max(...frames.map(f => f.calls))} at most`);
        console.log(`      cuts: ${R.cuts.map(c => `${c.area} ${fmt(c.ms, 0)} ms`).join(', ')}; the last area's build ${fmt(R.view.area?.buildMs ?? 0, 0)} ms`);
        console.log(`      chunks: ${built} built at most, ${R.view.chunks?.dropped ?? 0} dropped, ${popped} first drawn in the frame; their main-thread work at most ${fmt(maxChunkMs, 2)} ms a frame (p95 ${fmt(pct(chunkF.map(f => f.chunks.mainMs ?? 0), 0.95), 2)} ms)`);
        console.log(`      lamps in the table: ${tables.join(', ')}; ${overflow} left out of a cell; the key light on in ${lit} of ${eclipsed} frames while the sun was behind the wall (the sun now ${R.sun ? `${fmt(R.sun.elevDeg, 2)}°, ${R.sun.eclipsed ? 'eclipsed' : 'clear'}` : '?'})`);
        console.log(`      the see-through: ${hiddenFrames} frames with something between the camera and you, ${leftHidden} of them left undissolved past ${SEE_DISSOLVE_S} s; at the end (${fmt(end.x, 2)}, ${fmt(end.z, 2)}) in ${end.area}`);
        // (the longest frame with what it did, so a hitch that recurs is caught with its cause: v0.0.3's review saw one of 83 ms on the ground, not reproduced)
        const worst = frames.reduce((w, f) => (f.dt > (w?.dt ?? -1) ? f : w), null), fogPrev = frames[frames.indexOf(worst) - 1]?.fog?.recomputes ?? 0;
        if (worst) console.log(`      the longest frame: ${fmt(worst.dt, 1)} ms in ${worst.area}${worst.held ? ' (a cut held)' : ''}: ${worst.ticks} ticks (${fmt(worst.tickMs, 2)} ms), the view ${fmt(worst.viewMs, 2)} ms; chunks ${JSON.stringify(worst.chunks ? { built: worst.chunks.built, building: worst.chunks.building, mainMs: worst.chunks.mainMs } : null)}; uploads ${JSON.stringify(worst.uploads)}; fog recomputed ${worst.fog ? worst.fog.recomputes - fogPrev : '?'} (${fmt(worst.fog?.ms ?? 0, 2)} ms)`);
        const held = frames.filter(f => f.held).length;
        console.log(`      frames held behind a cut (the last picture kept, nothing drawn): ${held}`);
        // (every cut through a portal or a stair within the second; the launch's, which paints the whole
        // squad behind it, at most the second main.js holds it for, and one frame)
        const [launch, ...moves] = R.cuts;
        assert(R.cuts.length >= 4 && moves.every(c => c.ms <= CUT_MAX_MS) && launch.ms <= CUT_MAX_MS + 34, `cuts ${JSON.stringify(R.cuts)}`);
        // (a CPU-time ceiling in the foreground's terms: Chrome started from a shell in macOS's background band runs in it too, helpers.mjs machine())
        const M = machine();
        console.log(`      the ceilings here: × ${fmt(M.k, 2)}; the chunks' worst frame in the foreground's terms ${fmt(maxChunkMs / M.k, 2)} ms (limit ${CHUNK_FRAME_MS + 1})`);
        assert(maxChunkMs <= (CHUNK_FRAME_MS + 1) * M.k, `the chunks took ${fmt(maxChunkMs, 2)} ms of a frame (limit ${CHUNK_FRAME_MS + 1} × ${fmt(M.k, 2)})`);
        assert(popped === 0, `${popped} chunks first drawn inside the frame`);
        assert(overflow === 0, `${overflow} pools left out of the lamp table`);
        assert(lit === 0, `the key light on in ${lit} frames while the sun was behind the wall`);
        assert(leftHidden === 0, `${leftHidden} frames left you hidden`);
        assert(end.area === 'melas.ground' && end.z < 8, `ended at ${JSON.stringify(end)}`);
        assert(!errors.length, errors.join('\n'));
      }, { query: 'play=barracks&hour=5.67&seed=48213&nostore=1&perf=1', viewport: { width: 1600, height: 900 }, timeoutMs: 60000 });
    },
  },
];
