// OLYMPUS tests: the card's cost (the build sheet v0.0.23 F91; P§4: a posed doll 3.1 ms measured, DOLL_LRU 48).
//
// The portraits paint a doll for each (gear, hold, pose, facing) a man shows, so the card's cost could grow with the poses. Held:
// a posed doll paints in at most POSED_DOLL_MS × k (every pose and hold at the near band, the cache bypassed); over the live lane
// (the tier one pressing T, 48213, live:hide,give, the target view's frame every tick after warm() at the load) no frame paints
// more than one new doll; every doll painted after the load is in warm()'s set or a back or side variant of one; the distinct dolls
// at most DOLL_LRU; and the card never uploads a texture (src/ui/hud/hitcard.js puts a 2D canvas's pixels and imports no three.js).
// Prints the paint times, the warm set's size and time, and the dolls made during the lane.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { assert, fmt, machineK, root } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseBot, runHouse } from './bots/house.mjs';
import { createTargetView } from '../src/ui/hud/target.js';
import { hitMarks } from '../src/sim/arms/marks.js';
import { playerActor } from '../src/core/ids.js';
import { doll } from '../src/art/doll/doll.js';
import { dressOf, dollPaints, dollKeys, DOLL_LRU } from '../src/art/doll/dress.js';
import { seenOf } from '../src/sim/people/seen.js';
import { POSES } from '../src/data/portrait.js';
import { POSED_DOLL_MS, PORTRAIT_ENFORCED } from './flawless-portrait.mjs';

const fakeCard = () => { const c = { m: null, update(m) { c.m = m; return m?.words ?? ''; }, get text() { return c.m?.words ?? ''; } }; return c; };
const meAt = (s) => { const a = playerActor(s); return a ? { x: a.x, z: a.z } : null; };
// (a variant's key read as its front-on key: the facing field taken out of the doll's arguments)
const frontOf = (key) => key.replace(/,"facing":"(back|left|right)"/, '');

export default [
  {
    name: 'F91 a posed doll paints in at most POSED_DOLL_MS × k: every pose and hold at the near band, the cache bypassed (P§4: 3.1 ms measured)',
    fn() {
      const k = machineK(), g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go', opfor: 'live:fight,fight' }), s = g.state;
      const who = s.armoury.range.turners.find(t => t.live?.who).live.who, base = seenOf(s, who), times = [];
      const person = { look: s.people[who].look, sex: s.people[who].sex };
      for (let rep = 0; rep < 2; rep++) for (const pose of POSES) for (const how of ['rifle-low', 'rifle-aim', 'rifle-high', 'up', 'empty']) for (const facing of ['front', 'back', 'right']) {
        const rec = { ...base, pose, facing, hold: { ...base.hold, how }, aimAt: how === 'rifle-aim' ? 'you' : null }, args = dressOf(rec.gear, person, { rec });
        const t0 = performance.now(); doll({ ...args, scale: 96 / 72 }); const dt = performance.now() - t0;
        if (rep) times.push(dt);
      }
      times.sort((a, b) => a - b);
      const med = times[times.length >> 1], p95 = times[Math.floor(times.length * 0.95)], max = times.at(-1);
      console.log(`      ${times.length} posed dolls: median ${fmt(med, 2)} ms, 95th percentile ${fmt(p95, 2)} ms, the worst ${fmt(max, 2)} ms, against ${fmt(POSED_DOLL_MS * k, 2)} (k ${fmt(k, 2)})`);
      assert(p95 <= POSED_DOLL_MS * k && PORTRAIT_ENFORCED.has('F91'), `${fmt(p95, 2)} ms`);
    },
  },
  {
    name: 'F91 over the live lane (the tier one pressing T, 48213, live:hide,give) no frame paints more than one new doll, every doll after the load in warm()\'s set or a back or side variant of one, at most DOLL_LRU distinct; the card uploads no texture',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go', opfor: 'live:hide,give' });
      const card = fakeCard(), view = createTargetView({ card, readers: { marksOf: (st, key, k, ph) => hitMarks(st, key, { k, phase: ph }), meAt, known: new Map() } });
      const seen = { sig: null, t: -Infinity, stop: false, shown: null };
      const p0 = dollPaints(), t0 = performance.now(); view.warm(g.state); const warmMs = performance.now() - t0, warmN = dollPaints() - p0;
      const warm = new Set(dollKeys()), all = new Set(warm), after = [], stray = [];
      let frames = 0, most = 0, now = 0, cards = 0;
      runHouse(g, houseBot({ mode: 'T' }), { each(game) {
        now += 50; frames++;
        const n0 = dollPaints();
        view.frame(game.state, { seen, inStop: game.state.stop?.mode === 'stop', ui: 1, now });
        if (card.m?.subject?.kind === 'man') cards++;
        const made = dollPaints() - n0;
        most = Math.max(most, made);
        if (made) for (const key of dollKeys()) if (!all.has(key)) { all.add(key); after.push(key); if (!warm.has(key) && !warm.has(frontOf(key))) stray.push(key); }
      } });
      const src = readFileSync(path.join(root, 'src/ui/hud/hitcard.js'), 'utf8'), three = /from ['"][^'"]*three/.test(src) || /texImage2D|CanvasTexture|needsUpdate/.test(src);
      console.log(`      warm() ${warmN} dolls in ${fmt(warmMs, 1)} ms at the load; ${frames} frames, ${cards} with a man's card; ${after.length} dolls made after the load (at most ${most} in a frame), ${stray.length} outside the warm set and its variants; ${all.size} distinct (DOLL_LRU ${DOLL_LRU}); the card's texture uploads: ${three ? 'some' : 'none'}`);
      for (const k of stray.slice(0, 3)) console.log(`      stray: ${k.slice(0, 200)}`);
      assert(most <= 1 && !stray.length && !three, JSON.stringify({ most, stray: stray.length, three }));
      assert(all.size <= DOLL_LRU || after.length + warmN <= DOLL_LRU, `${all.size} distinct dolls`);
    },
  },
];
