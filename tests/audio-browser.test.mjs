// The sound in a real browser (heavy): src/ui/audio/engine.js in the page. One AudioContext is made at
// boot, suspended, and nothing plays before the first key (the browsers' autoplay rule: an AudioContext
// constructed is counted by an init script that wraps the constructor); KeyD resumes it, with no new
// context and the key's start() a resume of a millisecond or so (v0.0.3's review: the context made on
// the first key blocked it for 219 to 233 ms); two seconds of walking
// east along bay-2-1's aisle schedule the foot-falls steps.js footfalls() predicts from the stride
// before and after, within one; R at the bay door schedules the door's sound, and so does R at the front
// door from the street (v0.0.3's review: that fact named the floor and was dropped); mute in the menu sets
// the master gain to 0, and unmuting puts the volume back. The build sheet 0.0.3 §5.4. Prints the
// counts, the voice of the last step (its surface, gain against Earth and low-pass) and the
// context's state and sample rate. On OLYMPUS_TEST_PORT (8223 by default).
// The 0.0.4 round's (the build sheet §5.4, audio/world.js): the shower's water plays in its water part
// only (every frame of the splash sampled: the loop on exactly where the part shown is 'water'), the
// world muffled under the splash (the duck at its full depth mid-lapse, open again after), the watch's
// ticks; the flush at the urinal; the klaxon at the night's landing through bay-2-1's door (one wall);
// reveille's bugle when 05:30 stops R's wait.
import { assert, fmt } from './helpers.mjs';
import { withGame } from './browser.mjs';

const H = '__olympus';
// (every AudioContext the page constructs, counted before any of its modules runs)
function countContexts() {
  window.__contexts = 0;
  for (const name of ['AudioContext', 'webkitAudioContext']) {
    const C = window[name];
    if (!C) continue;
    window[name] = class extends C { constructor(...a) { super(...a); window.__contexts++; } };
  }
}
const me = (h) => { const s = window[h].state, a = s.actors.list.find(x => x.id === s.player.actor); return { x: a.x, z: a.z, strideM: a.strideM ?? 0, gait: a.gait }; };

export default [
  {
    name: 'one AudioContext made at boot and suspended, nothing started before the first key; KeyD resumes it in a millisecond or so; 2 s of walking schedule the foot-falls footfalls() predicts (±1); R at the bay door and at the front door from the street schedule the door; mute sets the master gain to 0',
    heavy: true,
    timeoutMs: 120000,
    async fn() {
      await withGame(async (page) => {
        const before = await page.evaluate((h) => ({ made: window.__contexts, audio: window[h].audio }), H);
        assert(before.made === 1 && before.audio.contextState === 'suspended' && !before.audio.started && before.audio.steps === 0, `before any key: ${JSON.stringify(before)}`);
        // (the first key: a tap of D wakes the sound)
        await page.keyboard.press('KeyD');
        await page.waitForFunction((h) => window[h].audio.contextState === 'running', H, { timeout: 5000 }).catch(() => {});
        const woke = await page.evaluate((h) => ({ made: window.__contexts, audio: window[h].audio }), H);
        assert(woke.made === 1 && woke.audio.contextState === 'running' && woke.audio.started && woke.audio.startMs < 20, `after KeyD: ${JSON.stringify(woke)}`);
        // (to the aisle's west end, facing east, then 2 s of D)
        await page.evaluate((h) => window[h].go(window[h].area, 50.0, 3.95, 'right'), H);
        await page.waitForTimeout(400);
        const a0 = await page.evaluate(me, H), n0 = await page.evaluate((h) => window[h].audio.steps, H);
        await page.keyboard.down('KeyD'); await page.waitForTimeout(2000); await page.keyboard.up('KeyD');
        await page.waitForTimeout(300);                                // (the last tick's foot-fall, a tick ahead at most)
        const a1 = await page.evaluate(me, H), got = await page.evaluate((h) => window[h].audio, H);
        const predicted = await page.evaluate(async ([s0, s1]) => (await import('/src/ui/audio/steps.js')).footfalls(s0, s1, 'walk').length, [a0.strideM, a1.strideM]);
        const steps = got.steps - n0;
        console.log(`      before any key: ${before.made} context, '${before.audio.contextState}' (made at boot in ${fmt(before.audio.prepareMs, 1)} ms); after KeyD: ${woke.made}, '${woke.audio.contextState}' at ${woke.audio.sampleRate} Hz, the key's start() ${fmt(woke.audio.startMs, 2)} ms; every sound rendered ${got.baked ? 'by the walk\'s end' : 'not yet'}`);
        assert(got.baked, 'every sound rendered by the end of the walk');
        console.log(`      walked ${fmt(Math.hypot(a1.x - a0.x, a1.z - a0.z), 2)} m east (stride ${fmt(a0.strideM, 2)} → ${fmt(a1.strideM, 2)} m): ${steps} foot-falls played, ${predicted} predicted; the last ${JSON.stringify(got.last)}; voices at most ${got.voicesMax}, dropped ${got.dropped}, late ${got.late}`);
        assert(Math.abs(steps - predicted) <= 1 && predicted >= 5, JSON.stringify({ steps, predicted, a0, a1 }));
        assert(got.last?.what === 'step' && Number.isFinite(got.last.gainDb) && got.last.lowpassHz > 5000 && got.last.lowpassHz < 5300, JSON.stringify(got.last));
        // (R at the bay door: the leaf's sound, where it is)
        // (the bay's own door: the door of the room the player stands in, from its room's side)
        const door = await page.evaluate(async (h) => {
          const m = await import('/src/sim/places/model.js'), area = m.areaOf(window[h].area), s = window[h].state, p = s.actors.list.find(x => x.id === s.player.actor);
          const room = m.roomOf(area.id, p.x, p.z), o = area.openings.find(x => x.kind === 'door' && x.rooms.includes(room.id));
          const mx = o.axis === 'x' ? (o.a + o.b) / 2 : o.at, mz = o.axis === 'x' ? o.at : (o.a + o.b) / 2, cx = (room.rect[0] + room.rect[2]) / 2, cz = (room.rect[1] + room.rect[3]) / 2;
          const side = o.axis === 'x' ? Math.sign(cz - mz) || -1 : Math.sign(cx - mx) || -1;
          return o.axis === 'x' ? { id: o.id, x: mx, z: mz + side * 0.6, face: side < 0 ? 'down' : 'up' } : { id: o.id, x: mx + side * 0.6, z: mz, face: side < 0 ? 'right' : 'left' };
        }, H);
        await page.evaluate(([h, d]) => window[h].go(window[h].area, d.x, d.z, d.face), [H, door]);
        await page.waitForTimeout(300);
        const d0 = await page.evaluate((h) => ({ doors: window[h].audio.doors, offer: window[h].offer() }), H);
        await page.keyboard.press('KeyR');
        await page.waitForFunction(([h, n]) => window[h].audio.doors > n, [H, d0.doors], { timeout: 3000 }).catch(() => {});
        const d1 = await page.evaluate((h) => window[h].audio, H);
        console.log(`      R at ${door.id} ('${d0.offer?.label}'): ${d1.doors - d0.doors} door sound, ${JSON.stringify(d1.last)}`);
        assert(d0.offer?.target === door.id && d1.doors === d0.doors + 1 && d1.last?.what === 'door' && d1.last.id === door.id, JSON.stringify({ d0, last: d1.last }));
        // (the front door from the street: its fact is the street's, so it sounds there)
        await page.evaluate((h) => window[h].go('melas.ground', 522, 215.2, 'up'), H);
        await page.waitForFunction((h) => window[h].area === 'melas.ground' && !window[h].loop.paused, H, { timeout: 15000 });
        await page.waitForTimeout(300);
        const f0 = await page.evaluate((h) => ({ doors: window[h].audio.doors, offer: window[h].offer() }), H);
        await page.keyboard.press('KeyR');
        await page.waitForFunction(([h, n]) => window[h].audio.doors > n, [H, f0.doors], { timeout: 3000 }).catch(() => {});
        const f1 = await page.evaluate((h) => window[h].audio, H);
        console.log(`      R at the front door from the street ('${f0.offer?.label}', ${f0.offer?.target}): ${f1.doors - f0.doors} door sound, ${JSON.stringify(f1.last)}`);
        assert(f0.offer?.target === 'o:e1:front' && f1.doors === f0.doors + 1 && f1.last?.id === 'o:e1:front', JSON.stringify({ f0, last: f1.last }));
        // (mute in the menu: the master gain at 0; unmuted, the volume's square again)
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => document.querySelector('.glass.menu .item.mute'));
        await page.keyboard.press('Digit6');
        await page.waitForTimeout(100);
        const muted = await page.evaluate((h) => window[h].audio, H);
        await page.keyboard.press('Digit6');
        await page.waitForTimeout(100);
        const back = await page.evaluate((h) => window[h].audio, H);
        await page.keyboard.press('Escape');
        console.log(`      mute: the master gain ${muted.masterGain} (muted ${muted.muted}); unmuted: ${fmt(back.masterGain, 3)} at volume ${back.volume}`);
        assert(muted.muted && muted.masterGain === 0 && !back.muted && Math.abs(back.masterGain - back.volume ** 2) < 1e-3, JSON.stringify({ muted, back }));
      }, { query: 'play=barracks&seed=48213&nostore=1', init: countContexts });
    },
  },
  {
    name: 'the world\'s sounds: the shower\'s water in its water part only, the world muffled under the splash and the watch ticking; the flush at the urinal; the klaxon at the night\'s landing through the bay\'s door; reveille\'s bugle when 05:30 stops the wait',
    heavy: true,
    timeoutMs: 240000,
    async fn() {
      await withGame(async (page, errors, game) => {
        const wakeAndGo = async (spotId) => {
          await page.mouse.click(5, 5);                                // (the first click: the sound wakes)
          await page.waitForFunction((h) => window[h].audio.contextState === 'running' && window[h].audio.baked, H, { timeout: 15000 });
          if (!spotId) return null;
          const p = await page.evaluate(async ([h, id]) => {
            const fx = await import('/src/sim/places/fixtures.js'), m = await import('/src/sim/places/model.js');
            const f = m.areaOf(window[h].area).fixtures.find(x => id.startsWith(`${x.id}#`));
            return fx.spotsOf(f).find(q => q.id === id);
          }, [H, spotId]);
          await page.evaluate(([h, q]) => window[h].go(window[h].area, q.x, q.z, q.face), [H, p]);
          await page.waitForTimeout(500);
          return p;
        };
        const sample = () => page.evaluate((h) => new Promise((resolve) => {
          const out = [], t0 = performance.now(); let started = false;
          const f = () => { const sp = window[h].splash(), w = window[h].world, a = window[h].audio; if (sp) { started = true; out.push({ phase: sp.phase, shownMs: sp.shownMs, water: w.water, duck: w.duckK, ticks: w.ticks, master: a.duck ?? null }); }
            if ((started && !sp) || performance.now() - t0 > 30000) resolve(out); else requestAnimationFrame(f); };
          requestAnimationFrame(f);
        }), H);
        // (the shower: every frame's water against the part shown)
        await page.goto(`${game.origin}/?play=test-shower&seed=48213&nostore=1`);
        await page.waitForFunction(() => window.__ready === true);
        await wakeAndGo('f:e1:head-2a:shower-2#1');
        const from = await page.evaluate((h) => window[h].state.clock.ms, H);
        const tl0 = sample();
        await page.keyboard.press('KeyR');
        const tl = await tl0;
        // (the parts from the shower's own record: in 1 min, water 3 min, dress 6)
        const partAt = (ms) => (ms - from < 60_000 ? 'in' : ms - from < 240_000 ? 'water' : 'dress');
        const bad = tl.filter(x => x.phase === 'lapse' && Math.abs(x.shownMs - from - 60_000) > 30_000 && Math.abs(x.shownMs - from - 240_000) > 30_000 && x.water !== (partAt(x.shownMs) === 'water'));
        const wet = tl.filter(x => x.water), duck = Math.max(...tl.map(x => x.duck)), ticks = tl.at(-1)?.ticks ?? 0;
        const w1 = await page.evaluate((h) => window[h].world, H);
        console.log(`      the shower: ${tl.length} frames, the water on in ${wet.length} (shown +${fmt((Math.min(...wet.map(x => x.shownMs)) - from) / 60000, 2)} to +${fmt((Math.max(...wet.map(x => x.shownMs)) - from) / 60000, 2)} min); frames whose water disagrees with the part (a minute's grace at the edges): ${bad.length}; the duck at most ${fmt(duck, 2)}, after ${w1.duckK}; ${ticks} ticks of the watch`);
        assert(wet.length > 0 && !bad.length && duck === 1 && w1.duckK === 0 && !w1.water && ticks >= 8, JSON.stringify({ wet: wet.length, bad: bad.slice(0, 3), duck, after: w1 }));
        // (the urinal: the head, a brief fast-forward, then the flush)
        await page.waitForFunction(() => document.querySelector('.glass.end'), null, { timeout: 10000 }).catch(() => {});
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        const f0 = await page.evaluate((h) => window[h].world.flushes, H);
        await wakeAndGo('f:e1:head-2a:urinal-1#1');
        const offer = await page.evaluate((h) => window[h].offer(), H);
        await page.keyboard.press('KeyR');
        await page.waitForFunction(([h, n]) => window[h].world.flushes > n, [H, f0], { timeout: 15000 }).catch(() => {});
        const fl = await page.evaluate((h) => ({ world: window[h].world, last: window[h].audio.last }), H);
        console.log(`      the urinal ('${offer?.label}'): ${fl.world.flushes - f0} flush; the last sound ${JSON.stringify(fl.last)}`);
        assert(fl.world.flushes === f0 + 1, JSON.stringify(fl));
        // (the night: the klaxon at the landing, through the bay's door)
        await page.goto(`${game.origin}/?play=test-night&seed=48213&nostore=1`);
        await page.waitForFunction(() => window.__ready === true);
        await wakeAndGo(null);
        await page.keyboard.press('KeyR');
        await page.waitForFunction((h) => window[h].world.klaxons > 0, H, { timeout: 40000 }).catch(() => {});
        const kl = await page.evaluate((h) => ({ world: window[h].world, ms: window[h].state.clock.ms }), H);
        console.log(`      the klaxon at ${kl.ms}: ${kl.world.klaxons} whoop(s), ${JSON.stringify(kl.world.lastKlaxon)}`);
        assert(kl.world.klaxons >= 1 && kl.world.lastKlaxon?.walls === 1 && kl.world.lastKlaxon.lowpassHz < 3000, JSON.stringify(kl.world));
        // (reveille: the wait from 05:20 stopped at 05:30, the bugle)
        await page.goto(`${game.origin}/?play=barracks&seed=48213&hour=5.33&nostore=1`);
        await page.waitForFunction(() => window.__ready === true);
        await wakeAndGo(null);
        await page.evaluate((h) => window[h].go(window[h].area, 54.8, 3.95, 'right'), H);
        await page.waitForTimeout(400);
        await page.keyboard.press('KeyR'); await page.waitForTimeout(150); await page.keyboard.press('KeyR');
        await page.waitForFunction((h) => window[h].world.bugles > 0, H, { timeout: 20000 }).catch(() => {});
        const bg = await page.evaluate((h) => ({ world: window[h].world, time: document.querySelector('.watch .t')?.textContent }), H);
        console.log(`      reveille: ${bg.world.bugles} bugle at ${bg.time}, ${JSON.stringify(bg.world.lastBugle)}`);
        assert(bg.world.bugles === 1, JSON.stringify(bg.world));
      }, { query: 'nostore=1' });
    },
  },
];
