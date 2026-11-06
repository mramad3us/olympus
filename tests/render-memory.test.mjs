// render-memory: the view's memory of people out of sight (src/render/memory.js, VIEWS §2.11), driven
// on the headless barracks through 22:00 exactly as view.js frames it: each tick, every actor but the
// player drawn as remembered when perception's visibility is 0 both where it stands and where it was
// last drawn, else as it is (and remembered). The sim changes a pose only where the player sees
// neither spot (people's place.js), so without the memory every change it makes would be drawn in the
// fog's dimmed cells, where the screen still shows the figure; with it a drawn figure changes only on a
// tick the player sees its old or new spot (a reveal, at the fog's edge as it lifts). People-poses
// holds the sim's side; this holds the picture's (the user's carried-over taste: nothing pops in or
// out of view).
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { createMemory } from '../src/render/memory.js';
import { eyeOf, visibility } from '../src/sim/people/perception.js';
import { playerActor } from '../src/core/ids.js';
import { areaOf } from '../src/sim/places/model.js';

const poseKey = (a) => `${a.posture ?? 'stand'}|${a.x}|${a.z}|${a.y ?? 0}|${a.spotId ?? ''}|${a.outfit ?? 'utilities'}|${!!a.curtain}`;
const aisleZ = () => { const f = (id) => areaOf('melas.echo.1').fixtures.find(x => x.id === id); return (f('f:e1:bay-2-1:footlocker-n2').z + f('f:e1:bay-2-1:footlocker-s0').z) / 2; };

export default [
  {
    name: 'the view\'s memory through 22:00: a squadmate the player sees neither where they are nor where they were drawn stays drawn as last seen, so the sim\'s changes out of sight never show in the fog\'s dim; they show only where the player looks (VIEWS §2.11)',
    fn() {
      const g = createGame({ scenario: 'barracks', seed: 48213, hour: 21 + 59 / 60 });
      const s = g.state, me = playerActor(s), z = aisleZ();
      const door = areaOf('melas.echo.1').openings.find(o => o.id === 'o:e1:bay-2-1');
      // (where the player stands and faces by tick: in the aisle facing the north racks for a minute, through
      // taps; at the bay door facing the hall, the racks behind beyond the awareness radius; back in the
      // aisle looking north, south, west and east, so every rack comes into sight again)
      const at = (t) => (t < 1200 ? [54.8, z, 'up'] : t < 1400 ? [(door.a + door.b) / 2, door.at - 0.45, 'down'] : [54.8, z, ['up', 'down', 'left', 'right'][Math.floor((t - 1400) / 100)]]);
      const memory = createMemory(), drawn = new Map(), simKey = new Map();
      let simChanges = 0, simChangesDim = 0, drawnChanges = 0, drawnDim = 0, reveals = 0, remembered = 0;
      for (let t = 0; t < 1800; t++) {
        const [x, zz, face] = at(t);
        if (me.x !== x || me.z !== zz) Object.assign(me, { x, z: zz, $px: x, $pz: zz });
        me.face = face;
        g.step(1);
        memory.begin(s, s.places.live.area);
        const eye = eyeOf(s, me), inSight = (x, zz) => visibility(s, eye, x, zz, s.clock.ms) > 0;
        for (const a of s.actors.list) {
          if (a === me) continue;
          const k = poseKey(a), was = memory.recall(a.id, a.x, a.z, inSight);
          // (the sim's own change, and whether the player could see either spot: it may change only when not)
          const pk = simKey.get(a.id);
          if (pk && pk.k !== k) { simChanges++; if (!inSight(pk.x, pk.z) && !inSight(a.x, a.z)) simChangesDim++; }
          simKey.set(a.id, { k, x: a.x, z: a.z });
          const now = was ?? { k, x: a.x, z: a.z };
          if (was) remembered++; else memory.keep(a.id, a.x, a.z, now);
          const before = drawn.get(a.id);
          if (before && before.k !== now.k) {
            drawnChanges++;
            if (inSight(before.x, before.z) || inSight(now.x, now.z)) reveals++; else drawnDim++;
          }
          drawn.set(a.id, now);
        }
      }
      const lying = [...drawn.values()].filter(d => d.k.startsWith('lie|')).length;
      console.log(`      1,800 ticks from 21:59 (60 s facing the north racks through taps, 10 s at the bay door facing the hall, 20 s looking round from the aisle): the sim changed ${simChanges} poses, ${simChangesDim} of them where the player saw neither spot (all of them: without the memory each would show in the fog's dim)`);
      console.log(`      drawn: ${drawnChanges} changes, ${reveals} where the player looked (a reveal), ${drawnDim} in the dim; ${remembered} actor-ticks drawn as remembered; at the end ${lying} of 13 drawn lying`);
      assert(simChanges > 0 && simChangesDim === simChanges, JSON.stringify({ simChanges, simChangesDim }));
      assert(drawnDim === 0, `${drawnDim} drawn changes in the fog's dim`);
      assert(drawnChanges === reveals && reveals > 0 && remembered > 0, JSON.stringify({ drawnChanges, reveals, remembered }));
      assert(lying === 12, `${lying} drawn lying at the end (the twelve squadmates; the fire watch sits)`);
    },
  },
  {
    name: 'the memory is forgotten with a new state, another area, and while a skip runs',
    fn() {
      const m = createMemory(), s1 = { skip: null }, s2 = { skip: null };
      m.begin(s1, 'a'); m.keep('a1', 0, 0, 'x');
      const out = () => false;
      const kept = m.recall('a1', 0, 0, out) === 'x';
      m.begin(s1, 'b'); const area = m.size;
      m.keep('a1', 0, 0, 'x'); m.begin(s2, 'b'); const state = m.size;
      m.keep('a1', 0, 0, 'x'); s2.skip = { kind: 'outcome' }; m.begin(s2, 'b'); const skip = m.size;
      m.keep('a1', 0, 0, 'x'); const seen = m.recall('a1', 0, 0, () => true);
      console.log(`      kept while out of sight: ${kept}; after another area ${area}, a new state ${state}, a skip ${skip} remembered; in sight: ${seen}`);
      assert(kept && area === 0 && state === 0 && skip === 0 && seen === null, JSON.stringify({ kept, area, state, skip, seen }));
    },
  },
];
