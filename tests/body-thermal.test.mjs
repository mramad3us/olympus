// body-thermal: the core temperature, tradecraft's model begun (BODY §10.1; the build sheet 0.0.4 §5.1).
// Tradecraft's STAGES, time constants and CORE beside the port's (its numbers copied from tradecraft
// v0.2.0-rc3 src/sim/thermal.js: the sibling is read-only and not a dependency); the core over 8 h
// indoors (nothing moves: a core at 37 °C stays there) and an hour out at Melas's −10 °C in utilities,
// in the sweats on a dawn run (BODY §10.4: 36.9 °C after the hour) and in PT kit standing; the closed
// form against tradecraft's own minute-by-minute live(), and the closed form composed exactly.
import { assert, near, fmt } from './helpers.mjs';
import { templateBody, lastReveille, MELAS_LON, STAGE_TEST } from './bots/sol.mjs';
import { START_MS } from '../src/data/setting/calendar.js';
import { HOUR_MS } from '../src/core/clock.js';
import { CORE, STAGES, TAU_COLD, TAU_HEAT, TAU_IN, COLD_K, HEAT_K, RUN_C, CLO, warmthOf, settleTo, coreAfter, tradecraftLive, stageOf, TRADECRAFT_WARMTH } from '../src/sim/body/thermal.js';
import { bodyAdvance, rowSeg } from '../src/sim/body/body.js';
import { massOf } from '../src/sim/body/energy.js';

const REV = lastReveille(START_MS, MELAS_LON);
// (tradecraft's own, v0.2.0-rc3 src/sim/thermal.js, copied for the print)
const TRADECRAFT = Object.freeze({ CORE: 37, TAU_COLD: 60, TAU_HEAT: 45, TAU_IN: 30, COLD_K: 0.25, HEAT_K: 0.12, RUN_C: 1.2, STAGES: 'frozen <28, collapse <31, severe <33, hypothermia <35, shivering <36; cooked >42.5, stroke >41, exhaustion >39.5, hot >38' });

export default [
  STAGE_TEST,
  {
    name: 'tradecraft\'s stages, time constants and CORE beside the port\'s; the port moves heat stroke to its clinical 40 °C (BODY §10.1)',
    fn() {
      const port = STAGES.map(s => `${s.id} ${s.below !== undefined ? `<${s.below}` : `>${s.above}`}`).join(', ');
      console.log(`      tradecraft: CORE ${TRADECRAFT.CORE}, τ cold ${TRADECRAFT.TAU_COLD} min, heat ${TRADECRAFT.TAU_HEAT}, indoors ${TRADECRAFT.TAU_IN}; COLD_K ${TRADECRAFT.COLD_K}, HEAT_K ${TRADECRAFT.HEAT_K}, RUN_C ${TRADECRAFT.RUN_C}; ${TRADECRAFT.STAGES}`);
      console.log(`      the port:   CORE ${CORE}, τ cold ${TAU_COLD} min, heat ${TAU_HEAT}, indoors ${TAU_IN}; COLD_K ${COLD_K}, HEAT_K ${HEAT_K}, RUN_C ${RUN_C}; ${port}`);
      console.log(`      warmth (tradecraft's scale) from BODY §10.3's clo × 3.3: ${Object.entries(CLO).map(([o, c]) => `${o} ${c} clo → ${fmt(warmthOf(o), 2)}`).join(', ')} (tradecraft's: ${Object.entries(TRADECRAFT_WARMTH).map(([k, v]) => `${k} ${v}`).join(', ')})`);
      assert(CORE === TRADECRAFT.CORE && TAU_COLD === TRADECRAFT.TAU_COLD && TAU_IN === TRADECRAFT.TAU_IN && COLD_K === TRADECRAFT.COLD_K, 'the port keeps tradecraft\'s constants');
      assert(stageOf(40.2).id === 'stroke' && stageOf(35.5).id === 'shivering' && stageOf(37) === null, 'stages');
    },
  },
  {
    name: 'indoors nothing moves (8 h at 20 °C: 37.0 °C); an hour out at −10 °C: utilities hold, the sweats on a run finish at 36.9 (BODY §10.4), PT kit standing gets cold; the closed form against tradecraft\'s live()',
    fn() {
      const b = templateBody(REV), seg = rowSeg({ met: 1.5, kind: 'still' }, MELAS_LON, massOf(b));
      bodyAdvance(b, seg, REV, REV + 8 * HOUR_MS);
      const rows = [];
      for (const [what, outfit, met, kind] of [['utilities, walking', 'utilities', 3.0, 'walk'], ['the sweats, a PT run', 'sweats', 8.0, 'run'], ['PT kit, standing', 'pt', 1.8, 'still']]) {
        const c = templateBody(REV), s = rowSeg({ met, kind, out: true, outfit }, MELAS_LON, massOf(c));
        bodyAdvance(c, s, REV, REV + HOUR_MS);
        const st = settleTo({ outdoors: true, outfit }, kind === 'run' ? 1 : 0), tc = tradecraftLive(37, st.target, st.tauMin, 60);
        rows.push({ what, core: c.thermal.coreC, target: st.target, tau: st.tauMin, tc, stage: stageOf(c.thermal.coreC)?.id ?? 'fine' });
      }
      console.log(`      8 h indoors: ${fmt(b.thermal.coreC, 6)} °C`);
      for (const r of rows) console.log(`      1 h at −10 °C, ${r.what}: settling to ${fmt(r.target, 2)} °C with τ ${r.tau} min → ${fmt(r.core, 3)} °C (${r.stage}); tradecraft's minute-by-minute live() ${fmt(r.tc, 3)}`);
      assert(b.thermal.coreC === 37, `indoors moved: ${b.thermal.coreC}`);
      assert(rows[0].core > 36 && rows[2].core < 36, JSON.stringify(rows));
      near(rows[1].core, 36.9, 0.2, 'the sweats on a run (BODY §10.4):');
      for (const r of rows) near(r.core, r.tc, 0.01, `${r.what}, the closed form against live() (which rounds to 0.001 °C a minute):`);
      const a = coreAfter(coreAfter(37, 33, 60, 17), 33, 60, 43), one = coreAfter(37, 33, 60, 60);
      console.log(`      composed: 17 min then 43 min ${a}, 60 min at once ${one}`);
      near(a, one, 1e-12, 'composition:');
    },
  },
];
