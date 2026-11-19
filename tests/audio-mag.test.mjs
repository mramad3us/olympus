// OLYMPUS tests: audio-mag, the mag boots' clank (the build sheet v0.0.24 §6 A; AW§4.1 item 1; BODY §16.6; samples/void-look's K group).
//
// A foot-fall's sound is src/ui/audio/steps.js stepVoice(surface, gait, { gG, pKpa, boots }): its weight 10 log10(gG), its air
// (people/hearing.js airDb), its gait. In free fall a bare foot weighs nothing and is silent (−Infinity: no airborne step), and
// from v0.0.24 a mag boot locked on a ferrous face (the engine passes boots: footing.js bootsLocked) strikes with at least
// MAG_STEP_G 0.3 G of weight and is heard as src/data/sounds.js STEPS.mag, the magnet's clank (a short ring over the plate's thud),
// whatever the plate's own step. Printed: the clank's gain on the void's plate and the Wheel's deck at 0 G in the Martian indoor
// air (−7.09 dB, the level void-look's K-a was shot at: its default until scored), at 1 G (the boots' weight no floor), the bare
// foot at 0 G, the boots on a non-ferrous floor (the floor's own step), and the recipe rendered by the game's synthesiser (its peak
// the recipe's −10 dB, four variants, the engine baking every STEPS row); the sample's recipe and gain are the game's.
import { assert, near, fmt } from './helpers.mjs';
import { stepVoice, weightDb } from '../src/ui/audio/steps.js';
import { render, measure } from '../src/ui/audio/synth.js';
import { STEPS, MAG_STEP, MAG_STEP_G, SURFACE_STEP } from '../src/data/sounds.js';
import { SURFACES } from '../src/data/places/env.js';
import { airDb } from '../src/sim/people/hearing.js';
import { RECIPES, clankDb, DEFAULTS } from '../samples/void-look/sounds.js';

/** The Martian indoor standard (kPa: src/data/places/env.js AIRS 'martian-indoor', the berth's and Well A's air). */
const PKPA = 66;

export default [
  {
    name: 'audio-mag: a mag boot locked on steel clanks at −7.09 dB at 0 G (MAG_STEP_G 0.3 G of weight through 66 kPa), where a bare foot at 0 G is silent; at 1 G it strikes at 1 G\'s weight; on a floor that is not ferrous the boots are the floor\'s own step',
    fn() {
      const v = (surface, gG, boots) => stepVoice(surface, 'walk', { gG, pKpa: PKPA, boots });
      const out = {
        plateGrid0: v('plateGrid', 0, true), deckPlate0: v('deckPlate', 0, true), bare0: v('plateGrid', 0, false),
        plateGrid1: v('plateGrid', 1, true), bare1: v('plateGrid', 1, false), concrete0: v('concrete', 0, true), concrete1: v('concrete', 1, true),
      };
      for (const [k, x] of Object.entries(out)) console.log(`      ${k.padEnd(11)} ${x.kind.padEnd(9)} ${Number.isFinite(x.gainDb) ? `${fmt(x.gainDb, 2)} dB` : 'silent'} (weight ${x.weightDb}, air ${x.airDb})`);
      const want = Math.round((weightDb(MAG_STEP_G) + airDb(PKPA)) * 100) / 100;
      assert(out.plateGrid0.kind === MAG_STEP && out.deckPlate0.kind === MAG_STEP && out.plateGrid0.gainDb === -7.09 && want === -7.09, JSON.stringify({ out, want }));
      assert(!Number.isFinite(out.bare0.gainDb) && out.bare0.kind === SURFACE_STEP.plateGrid, 'a bare foot at 0 G weighs nothing');
      assert(out.plateGrid1.kind === MAG_STEP && out.plateGrid1.gainDb === out.bare1.gainDb, 'at 1 G the boots strike at the body\'s weight');
      assert(out.concrete1.kind === SURFACE_STEP.concrete && out.concrete1.gainDb === v('concrete', 1, false).gainDb && !Number.isFinite(out.concrete0.gainDb), 'off steel the boots are the floor\'s step');
      assert(Object.keys(SURFACES).every(id => SURFACE_STEP[id] === SURFACES[id].step), 'every surface has its step');
    },
  },
  {
    name: 'audio-mag: STEPS.mag rendered by the game\'s synthesiser, its peak the recipe\'s −10 dB in each of four variants, a ring over a thud; samples/void-look\'s K-a is the game\'s recipe at the game\'s gain (its default until scored)',
    fn() {
      const R = STEPS.mag, ms = [];
      for (let i = 0; i < R.variants; i++) ms.push(measure(render(R, { sampleRate: 48000, name: 'audio-mag', variant: i })));
      for (const [i, m] of ms.entries()) console.log(`      variant ${i}: peak ${fmt(m.peakDb, 2)} dB, rms ${fmt(m.rmsDb, 2)} dB, centroid ${Math.round(m.centroidHz)} Hz, ${fmt(m.durS * 1000, 0)} ms, decay ${fmt(m.decayS * 1000, 1)} ms`);
      const same = JSON.stringify(RECIPES.mag.layers) === JSON.stringify(R.layers) && RECIPES.mag.levelDb === R.levelDb && RECIPES.mag.durS === R.durS;
      console.log(`      void-look's ${DEFAULTS.clank}: its recipe the game's ${same ? 'to the byte' : 'DIFFERS'}, its gain ${clankDb(DEFAULTS.clank)} dB against stepVoice's ${stepVoice('plateGrid', 'walk', { gG: 0, pKpa: PKPA, boots: true }).gainDb} dB`);
      assert(R.variants === 4 && ms.every(m => Math.abs(m.peakDb - R.levelDb) < 0.01) && ms.every(m => m.centroidHz > 300), JSON.stringify(ms));
      near(ms[0].durS, R.durS, 0.002, 'the clank\'s length:');
      assert(same && clankDb(DEFAULTS.clank) === stepVoice('plateGrid', 'walk', { gG: 0, pKpa: PKPA, boots: true }).gainDb, 'the sample is the game\'s');
    },
  },
];
