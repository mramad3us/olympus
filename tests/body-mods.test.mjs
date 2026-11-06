// body-mods: the body in every roll (BODY §22, SKILLS §5.4; the build sheet 0.0.4 §5.1). Every band's
// modifiers on each key (BODY §22's shorthand: mind, body, hands, eyes, social, all), each landing on
// its keys only; the bladder and the bowel at most −3 between them; the smell only within its range;
// needMods and bodyMods kept apart by src (each cause counted once by a roll that calls both);
// tradecraft's stress numbers beside the port's; capacityOf's gates.
import { assert } from './helpers.mjs';
import { templateBody, lastReveille, MELAS_LON, fixtureState, STAGE_TEST } from './bots/sol.mjs';
import { START_MS } from '../src/data/setting/calendar.js';
import { bodyMods, needMods, capacityOf, usesOf } from '../src/sim/body/mods.js';
import { TRADECRAFT_STRESS } from '../src/sim/body/stress.js';
import { msAtMarsTime } from '../src/core/calendar.js';

const REV = lastReveille(START_MS, MELAS_LON);
const NOON = msAtMarsTime(REV, 12, 0, MELAS_LON);
const KEYS = ['mind', 'body', 'hands', 'eyes', 'social', 'all'];
// (a body at noon, rested and fed, changed by f)
function at(f, ms = NOON) {
  const b = templateBody(REV);
  b.atMs = ms; b.energy.gutKcal = 400; b.sleep.pressureH = 6; b.stress.v = 0; b.bladder.ml = 100; b.bowel.g = 60; b.hygiene.grime = 10;
  f(b);
  return fixtureState(b, ms);
}
const all = (state, key, ctx) => [...bodyMods(state, 'p1', key, ctx), ...needMods(state, 'p1', key, ctx)];
const sum = (list) => list.reduce((s, m) => s + m.v, 0);

const CASES = [
  ['fine', () => {}],
  ['hungry (emptyH 5)', b => { b.energy.gutKcal = 0; b.energy.emptyH = 5; }],
  ['weak (reserve −14,000)', b => { b.energy.gutKcal = 0; b.energy.reserveKcal = -14000; }],
  ['dry (2.5%)', b => { b.water.balanceL = -1.9; }],
  ['parched (4.5%)', b => { b.water.balanceL = -3.4; }],
  ['bladder need (420 mL)', b => { b.bladder.ml = 420; }],
  ['bladder urgent (600 mL)', b => { b.bladder.ml = 600; }],
  ['bladder bursting and bowel desperate', b => { b.bladder.ml = 720; b.bowel.g = 470; }],
  ['tired (pressure 17 at noon)', b => { b.sleep.pressureH = 17; }],
  ['exhausted (pressure 27)', b => { b.sleep.pressureH = 27; }],
  ['just woken (inertia −3)', b => { b.sleep.inertia = { v: -3, untilMs: NOON + 60_000 }; }],
  ['on edge (stress 55)', b => { b.stress.v = 55; }],
  ['frayed (stress 80)', b => { b.stress.v = 80; }],
  ['unwashed (grime 60)', b => { b.hygiene.grime = 60; }],
  ['rank (grime 75), 3 m from the one it is aimed at', b => { b.hygiene.grime = 75; }, { targetM: 3 }],
  ['winded (stamina 20)', b => { b.stamina = 20; }],
  ['blown', b => { b.stamina = 0; b.blown = true; }],
  ['shivering (core 35.8)', b => { b.thermal.coreC = 35.8; }],
  ['low morale (25)', b => { b.morale.v = 25; }],
];

export default [
  STAGE_TEST,
  {
    name: 'every band\'s modifiers on each key, each on its keys only; the bladder and the bowel at most −3 between them; the smell within its range only (BODY §22)',
    fn() {
      const table = {};
      for (const [what, f, ctx] of CASES) {
        const st = at(f), row = KEYS.map(k => sum(all(st, k, ctx ?? {})));
        table[what] = row;
        const causes = all(st, 'all', ctx ?? {}).map(m => `${m.why} ${m.v} (${m.src})`).join(', ');
        console.log(`      ${what.padEnd(48)} ${KEYS.map((k, i) => `${k} ${row[i]}`).join(', ')}${causes ? `  [${causes}]` : ''}`);
      }
      const eq = (what, want) => assert(JSON.stringify(table[what]) === JSON.stringify(want), `${what}: ${JSON.stringify(table[what])} against ${JSON.stringify(want)}`);
      eq('fine', [0, 0, 0, 0, 0, 0]);
      eq('hungry (emptyH 5)', [-1, -1, -1, -1, -1, -1]);
      eq('bladder need (420 mL)', [-1, 0, 0, 0, 0, -1]);
      eq('bladder bursting and bowel desperate', [-3, -3, -3, -3, -3, -3]);
      eq('on edge (stress 55)', [0, 0, 0, -1, -1, -1]);
      eq('frayed (stress 80)', [0, 0, -1, -2, -2, -3]);
      eq('unwashed (grime 60)', [0, 0, 0, 0, -1, -1]);
      eq('rank (grime 75), 3 m from the one it is aimed at', [0, 0, 0, 0, 0, 0]);
      eq('parched (4.5%)', [-2, -3, -2, -2, -2, -3]);
      eq('winded (stamina 20)', [0, -2, -2, 0, 0, -2]);
      console.log(`      tradecraft's stress: on edge ${TRADECRAFT_STRESS.ON_EDGE} (${TRADECRAFT_STRESS.ON_EDGE_MOD} to ${TRADECRAFT_STRESS.SKILLS}), frayed ${TRADECRAFT_STRESS.FRAYED} (${TRADECRAFT_STRESS.FRAYED_MOD}), calm ${TRADECRAFT_STRESS.CALM_PER_MIN}/min, ${TRADECRAFT_STRESS.SIT_CALM_PER_MIN}/min seated or indoors; the port: the same lines and rates on SKILLS's uses (eyes and face; frayed adds −1 to hands and arms)`);
      console.log(`      the keys as uses: ${KEYS.map(k => `${k} ${JSON.stringify(usesOf(k))}`).join(', ')}`);
    },
  },
  {
    name: 'needMods and bodyMods are kept apart by src (need: and body:), so a roll that calls both counts each cause once; capacityOf\'s gates',
    fn() {
      for (const [what, f, ctx] of CASES) {
        const st = at(f);
        for (const m of bodyMods(st, 'p1', 'all', ctx ?? {})) assert(m.src.startsWith('body:'), `${what}: ${JSON.stringify(m)}`);
        for (const m of needMods(st, 'p1', 'all', ctx ?? {})) assert(m.src.startsWith('need:'), `${what}: ${JSON.stringify(m)}`);
      }
      const blown = capacityOf(at(b => { b.stamina = 0; b.blown = true; }), 'p1'), fine = capacityOf(at(() => {}), 'p1'), weak = capacityOf(at(b => { b.energy.gutKcal = 0; b.energy.reserveKcal = -14000; }), 'p1');
      const cold = capacityOf(at(b => { b.thermal.coreC = 34.5; }), 'p1');
      console.log(`      capacity: fine ${JSON.stringify(fine)}; blown run ${blown.runOk}; weak from hunger sprint ${weak.sprintOk}; hypothermic walk ×${cold.walkK}`);
      assert(fine.runOk && fine.sprintOk && fine.canStand && !blown.runOk && !weak.sprintOk && cold.walkK === 0.85, 'capacity');
    },
  },
];
