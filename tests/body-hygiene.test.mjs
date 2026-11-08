// body-hygiene: grime, the shower's water minutes, wet hair and stubble (BODY §6, §25; the build sheet
// 0.0.4 §5.1). Grime over the reference sol; a shower's water minutes leave exactly 30, 8, 2, 1 and 0
// (BODY §6's rule); the sols to unwashed, rank and filthy without a shower; hair wet for 20 minutes;
// the stubble's lines (it shows from 12 h, fails an inspection over 20 h) and a shave.
import { assert, near, fmt } from './helpers.mjs';
import { templateBody, runSols, weekOf, MELAS_LON, stageTimes, lastReveille, STAGE_TEST } from './bots/sol.mjs';
import { START_MS } from '../src/data/setting/calendar.js';
import { marsTimeText } from '../src/core/calendar.js';
import { HOUR_MS, MIN_MS } from '../src/core/clock.js';
import { HYGIENE, GRIME_BANDS } from '../src/data/body/needs.js';
import { washLeft, washBody, groomBody, stubbleIndex, grimeIndex } from '../src/sim/body/hygiene.js';
import { cuesOf, stagesOf } from '../src/sim/body/cues.js';

const T = (ms) => marsTimeText(ms, MELAS_LON);
const REV = lastReveille(START_MS, MELAS_LON);

export default [
  STAGE_TEST,
  {
    name: 'grime over the reference sol: the shower after PT, the range outdoors, the night',
    fn() {
      const b = templateBody(REV), sols = weekOf(REV, MELAS_LON, 1).slice(0, 2), marks = [];
      runSols({ body: b, sols, untilMs: sols[1].reveilleMs, onSpan: (span, body) => { if (/PT|shower|water|dried|range: walking|classes|evening chow|rack/.test(span.row.what)) marks.push(`${T(span.fromMs)} ${fmt(body.hygiene.grime, 1)}`); } });
      console.log(`      ${marks.join(', ')}; ${T(sols[1].reveilleMs)} ${fmt(b.hygiene.grime, 1)} (${GRIME_BANDS[grimeIndex(b.hygiene.grime)].id}); 1.2 an hour awake, 0.5 asleep, +1.5 outdoors, +1 over MET 5`);
      near(b.hygiene.grime, 32, 1.5, 'reveille\'s grime against the template:');
    },
  },
  {
    name: 'a shower\'s water minutes leave exactly 30, 8, 2, 1 and 0 of any grime above them (BODY §6), and the cold one stresses where the warm one calms',
    fn() {
      const left = [1, 2, 3, 4, 5].map(w => washLeft(90, w));
      const part = [0.5, 1.5, 2.5].map(w => `${w} min ${washLeft(90, w)}`);
      const b = templateBody(REV); b.hygiene.grime = 58; b.stress.v = 20;
      washBody(b, { waterMin: 3 }, REV);
      const c = templateBody(REV); c.stress.v = 20; washBody(c, { waterMin: 3, cold: true }, REV);
      console.log(`      from 90: ${left.map((v, i) => `${i + 1} min → ${v}`).join(', ')}; cut short: ${part.join(', ')}; the test scene's 58 after Melas's 3 min: ${b.hygiene.grime}; stress 20 → ${b.stress.v} warm, ${c.stress.v} cold`);
      assert(JSON.stringify(left) === JSON.stringify([30, 8, 2, 1, 0]), JSON.stringify(left));
      assert(washLeft(5, 1) === 5, 'water never dirties');
      assert(b.hygiene.grime === 2 && b.stress.v === 10 && c.stress.v === 23, JSON.stringify({ g: b.hygiene.grime, s: b.stress.v, cold: c.stress.v }));
    },
  },
  {
    name: 'without a shower: the sols to grubby, unwashed, rank and filthy on the reference sol',
    fn() {
      const b = templateBody(REV), r = runSols({ body: b, sols: weekOf(REV, MELAS_LON, 1), drop: { wash: true } });
      const st = stageTimes(r.crossed).hygiene ?? [];
      console.log(`      from ${templateBody(REV).hygiene.grime} at Monday's reveille: ${st.map(x => `${x.band} at +${fmt((x.atMs - REV) / HOUR_MS / 24.66, 2)} sols (${T(x.atMs)})`).join(', ')}; ${fmt(b.hygiene.grime, 1)} after the week`);
      assert(['grubby', 'unwashed', 'rank'].every(k => st.some(x => x.band === k)), JSON.stringify(st));
    },
  },
  {
    name: 'hair wet 20 minutes after the water, the cue fading over them; stubble shows from 12 h and fails over 20 h; a shave clears it, face and hands take a tenth of the grime',
    fn() {
      const b = templateBody(REV); b.hygiene.grime = 40;
      washBody(b, { waterMin: 3 }, REV);
      const wet = [0, 10, 19, 20, 21].map(m => `${m} min ${fmt(cuesOf(b, REV + m * MIN_MS, MELAS_LON).wetK, 2)}`);
      const words = stagesOf(b, REV, MELAS_LON).hygiene.words;
      b.hygiene.stubbleH = 21; b.hygiene.grime = 30;
      const st = [6, 12, 20, 21].map(h => `${h} h ${['smooth', 'shadow', 'stubble'][stubbleIndex(h)]}`);
      groomBody(b, { shave: true, face: true, teeth: true }, REV);
      console.log(`      wet hair: ${wet.join(', ')} (WET_HAIR_MS ${HYGIENE.WET_HAIR_MS / MIN_MS} min); "${words}"; stubble: ${st.join(', ')}; shaved and washed at the basin: stubble ${b.hygiene.stubbleH} h, grime 30 → ${fmt(b.hygiene.grime, 1)}`);
      assert(cuesOf(b, REV, MELAS_LON).wetK === 1 && cuesOf(b, REV + 20 * MIN_MS, MELAS_LON).wetK === 0, 'wet for 20 minutes');
      near(cuesOf(b, REV + 10 * MIN_MS, MELAS_LON).wetK, 0.5, 1e-9, 'half dry at 10 minutes:');
      assert(b.hygiene.stubbleH === 0 && Math.abs(b.hygiene.grime - 27) < 1e-9, JSON.stringify(b.hygiene));
    },
  },
];
