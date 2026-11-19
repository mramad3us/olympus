// test-anchors, "Anchor before you fire" (src/sim/scenarios/anchors.js; src/data/places/phobos.js; the anywhere note AW§5; the build sheet v0.0.24 §1 D, §6, §8 F114 and F117, its numbers read three higher): the void range as authored, the course by the bot to its card on every sheet by what the player sees, each station's numbers, and Well A's busiest tick.
import { assert, fmt, machineK, TICK_BUDGET_MS } from './helpers.mjs';
import { createGame } from './game.mjs';
import { anchorsBot, runVoid, LATTICE } from './bots/void.mjs';
import { anchorsNow, STATIONS, ANCHORS_SETUPS } from '../src/sim/scenarios/anchors.js';
import { VOID_RANGE, WELL_A, PLATES, PASSAGE } from '../src/data/places/phobos.js';
import { SCENES } from '../src/data/scenes.js';
import { COURSES } from '../src/data/courses.js';
import { ANCHORS } from '../src/sim/arms/shot.js';
import { gravityAt, localTime } from '../src/sim/places/env.js';
import { footingOf } from '../src/sim/body/footing.js';
import { navOf, isFree } from '../src/sim/places/nav.js';
import { passageAt } from '../src/sim/places/model.js';
import { FOOTING } from '../src/data/body/needs.js';
import { checkIds } from './ids-check.mjs';
import { anchorsSaid } from '../src/ui/cards/anchors.js';

/** The sheets the picker offers (the scene's), the quick seeds. */
export const SHEETS = Object.freeze(SCENES['test-anchors'].sheets), SEEDS = Object.freeze([48213, 7]);
const C = COURSES.anchors;

/** One course by a bot to its card: { g, N, ticks, done, ids, mem }. */
export function anchorsRun({ seed = 48213, tier = 'private', setup = null, bot = anchorsBot(), maxTicks = 20 * 60 * 15 } = {}) {
  const g = createGame({ scenario: 'test-anchors', seed, tier, ...(setup ? { setup } : {}) });
  const r = runVoid(g, bot, { maxTicks });
  return { g, N: anchorsNow(g.state), ...r, ids: checkIds(JSON.parse(g.save()), g.sim.domains), mem: g.me()?.bot ?? {} };
}
const ms = (v) => (Number.isFinite(v) ? `${fmt(v / 1000, 1)} s` : '-');

export default [
  {
    name: 'scene-anchors: Well A as authored: 40 × 40 m at 0.0006 G on UTC, every station\'s mark a pad-eye of the hold rule free on the grid, each turner at its station\'s distance facing its mark, the plates\' passage 1.2 m wide, the wedge measured across it',
    fn() {
      const g = createGame({ scenario: 'test-anchors', seed: 48213 }), s = g.state, me = g.me();
      const G = gravityAt(s, null, me.x, me.z), t = localTime(s.places.live.site, s.clock.ms), grid = navOf(s, WELL_A.id, 'C0');
      console.log(`      ${WELL_A.name}: ${WELL_A.boundsM.x1} × ${WELL_A.boundsM.z1} m, ${G.gG} G (${G.regime}), the clock ${t.face} ${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}, the site ${s.places.live.site}`);
      assert(G.gG === 0.0006 && t.face === 'utc' && t.hour === 10, JSON.stringify({ G, t: { face: t.face, hour: t.hour } }));
      const bad = [];
      for (const st of STATIONS) {
        const T = VOID_RANGE.turners.find(x => x.lane === st.lane), d = Math.hypot(T.x - st.mark[0], T.z - st.mark[1]);
        const onLattice = [0, 1].every(i => Math.abs(((st.mark[i] - LATTICE.at) / LATTICE.step) - Math.round((st.mark[i] - LATTICE.at) / LATTICE.step)) < 1e-9);
        const aim = st.id === 'floating' ? [st.mark[0], 4.0] : st.mark, want = Math.atan2(aim[1] - T.z, aim[0] - T.x), off = Math.abs(Math.atan2(Math.sin(want - T.faceRad), Math.cos(want - T.faceRad)));
        console.log(`      station ${st.n} ${st.id.padEnd(8)} mark (${st.mark.join(', ')}) ${onLattice ? 'a pad-eye' : 'OFF THE LATTICE'}, free ${isFree(grid, ...st.mark)}; its turner ${fmt(d, 2)} m off (the station's ${st.dM} m), facing it within ${fmt(off * 180 / Math.PI, 1)}°; wants ${st.want}${st.gun === 'pistol' ? ', the P-12' : ''}, ${st.rounds} round${st.rounds === 1 ? '' : 's'}`);
        if (!onLattice || !isFree(grid, ...st.mark)) bad.push(`station ${st.n}'s mark`);
        if (st.id !== 'floating' && Math.abs(d - st.dM) > 0.75) bad.push(`station ${st.n}'s turner at ${fmt(d, 2)} m`);
        if (off > 0.01) bad.push(`station ${st.n}'s turner faces ${fmt(off, 3)} rad off`);
      }
      // (the passage between the plates, across z at the wedge's mark: free inside, blocked a body's half-width beyond each face)
      const across = PASSAGE[3] - PASSAGE[1], w = STATIONS.find(x => x.id === 'wedge').mark;
      console.log(`      the plates ${JSON.stringify(PLATES)}, the passage ${fmt(across, 2)} m across; the wedge's mark free ${isFree(grid, ...w)}, the plates' insides blocked ${PLATES.every(p => !isFree(grid, (p[0] + p[2]) / 2, (p[1] + p[3]) / 2))}`);
      const pa = passageAt(s, ...w);
      console.log(`      the wedge's measure at its mark (model.js passageAt): ${pa.widthM} m across ${pa.axis} (FOOTING.WEDGE_M ${FOOTING.WEDGE_M.join(' to ')})`);
      if (Math.abs(across - 1.2) > 1e-9 || !PLATES.every(p => !isFree(grid, (p[0] + p[2]) / 2, (p[1] + p[3]) / 2)) || !(pa.widthM >= FOOTING.WEDGE_M[0] && pa.widthM <= FOOTING.WEDGE_M[1])) bad.push('the passage');
      // (the start: boots worn and locked on the deck, the R-7 and the P-12 Condition 1 on safe, the cadre booted at his post)
      const F = footingOf(s, s.player.id), R = s.armoury.range, cadre = s.actors.list.find(a => a.who === R.coachId);
      const rifle = s.items[R.anchors.rifle], pistol = s.items[R.anchors.pistol];
      console.log(`      the start (${me.x}, ${me.z}) ${F.mode} (${F.hold}); the rifle ${rifle.mode}, chamber ${rifle.chamber ?? rifle.ch ?? JSON.stringify(rifle.belief)}; the P-12 ${pistol.mode}; the cadre at (${cadre?.x}, ${cadre?.z}) ${footingOf(s, R.coachId).mode}`);
      if (F.hold !== 'boots' || footingOf(s, R.coachId).hold !== 'boots' || rifle.mode !== 'safe' || pistol.mode !== 'safe') bad.push('the start');
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'scene-anchors: station one by the keys bot on 48213 as the private: boots locked, the walk to the line, two rounds fired on mag boots, the recovery the planted one × the boots\' row (WEAPONS §7.8, 1.2), nothing pushed',
    fn() {
      const g = createGame({ scenario: 'test-anchors', seed: 48213, tier: 'private' }), bot = anchorsBot();
      let n = 0;
      for (; n < 20 * 120 && anchorsNow(g.state).stations[0].end === null; n++) g.step(1, bot);
      const s1 = anchorsNow(g.state).stations[0];
      console.log(`      ${n} ticks: ${s1.end}, ${s1.hits} of ${s1.of} hits, ${ms(s1.timeMs)} (the move ${ms(s1.moveMs)}), fired ${s1.anchors.join(', ')}, recovery ${s1.recoverMs} ms against ${s1.plantedMs} planted (×${fmt(s1.recoverMs / s1.plantedMs, 2)}, the row's ×${ANCHORS.magBoots.recover}), the push kept ${s1.pushMs} m/s`);
      console.log(`      the card: ${anchorsSaid(anchorsNow(g.state)).slice(0, 2).join(' / ')}`);
      assert(s1.end === 'fired' && s1.rounds === 2 && s1.anchors.length === 1 && s1.anchors[0] === 'magBoots', JSON.stringify(s1));
      assert(Math.abs(s1.recoverMs / s1.plantedMs - ANCHORS.magBoots.recover) < 0.02 && s1.pushMs === 0, JSON.stringify(s1));
    },
  },
  {
    name: 'scene-anchors (F114): the course to its card by the keys bot on every sheet on 48213, each station fired from the anchor it wants, none passed; the setups\' commands where they say',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      const bad = [];
      for (const tier of SHEETS) {
        const r = anchorsRun({ tier });
        const st = r.N.stations, line = st.map(x => `${x.n}:${x.end ?? '-'}${x.anchors.length ? `(${x.anchors.join('+')})` : ''} ${x.hits}/${x.of} ${ms(x.timeMs)}`).join(' · ');
        console.log(`      ${tier.padEnd(8)} ${r.done ? 'to the card' : 'NOT DONE'} in ${r.ticks} ticks: ${line}`);
        if (!r.done) bad.push(`${tier}: not done (${r.N.phase} at station ${r.N.st + 1})`);
        for (const x of st) {
          const want = STATIONS[x.n - 1].want;
          if (x.end !== 'fired') bad.push(`${tier} station ${x.n}: ${x.end}`);
          else if (!x.anchors.includes(want)) bad.push(`${tier} station ${x.n}: fired from ${x.anchors.join(', ')}, not ${want}`);
        }
        if (r.ids.invalid.length || r.ids.dangling.length) bad.push(`${tier}: ids ${JSON.stringify(r.ids.invalid.slice(0, 2))}`);
      }
      for (const setup of ANCHORS_SETUPS) {
        const g = createGame({ scenario: 'test-anchors', seed: 48213, setup }), k = ANCHORS_SETUPS.indexOf(setup);
        g.step(30, {});
        const N = anchorsNow(g.state);
        console.log(`      setup ${setup}: station ${N.st + 1} at ${N.phase}, before it ${N.stations.slice(0, k).map(x => x.end).join(', ') || 'none'}`);
        if (N.st !== k || N.phase !== 'move' || N.stations.slice(0, k).some(x => x.end !== 'setup')) bad.push(`setup ${setup}`);
      }
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'scene-anchors (F117): Well A\'s busiest tick, the course by the keys bot on 48213, each tick the least of three runs, under 2 ms × the machine\'s factor',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      const k = machineK(), runs = [];
      const once = () => {
        const g = createGame({ scenario: 'test-anchors', seed: 48213, tier: 'private' }), bot = anchorsBot(), xs = [];
        let botMs = 0;
        const timed = (s, me, mem) => { const t = performance.now(); const r = bot(s, me, mem); botMs += performance.now() - t; return r; };
        for (let n = 0; n < 20 * 60 * 15 && !anchorsNow(g.state).end; n++) { botMs = 0; const t0 = performance.now(); g.step(1, timed); xs.push(performance.now() - t0 - botMs); }
        return xs;
      };
      once();
      for (let i = 0; i < 3; i++) runs.push(once());
      const n = Math.min(...runs.map(r => r.length)), mins = Array.from({ length: n }, (_, i) => Math.min(...runs.map(r => r[i])));
      const max = Math.max(...mins), p95 = [...mins].sort((a, b) => a - b)[Math.floor(0.95 * n)];
      console.log(`      ${n} ticks (runs ${runs.map(r => r.length).join(', ')}): busiest ${fmt(max, 2)} ms, p95 ${fmt(p95, 3)} ms, against ${fmt(TICK_BUDGET_MS * k, 2)} (k ${fmt(k, 2)})`);
      assert(runs.every(r => r.length === n), 'the runs differ in length: not deterministic');
      assert(max <= TICK_BUDGET_MS * k, JSON.stringify({ max, k }));
    },
  },
];
