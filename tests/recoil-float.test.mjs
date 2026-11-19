// OLYMPUS tests: recoil while floating (WEAPONS §7.8; ROADMAP "anywhere" step 7; the build sheet v0.0.24 §6 B; F110):
// src/sim/body/freefall.js recoilFloat and its call in shot.js resolveShot, on the shoot house's sergeant under ship-coast (0 G).
//   - J / m and J × 0.45 / I a round for the R-7 (ball, frangible) and the P-12 (ball, frangible), I = 17 kg·m² × m / 95 kg, at the
//     sheet's kit and with mag boots worn; 30 rounds on automatic, floating, printed against WEAPONS §7.8's table;
//   - what each anchor keeps (shot.js ANCHORS): floating all of the push and the spin, the body drifting back along the bore and
//     tumbling; mag boots none of the push and a tenth of the spin, a hand on a hold a fifth and a third, braced and planted
//     nothing, and no anchored body drifts;
//   - a round fired floating through resolveShot moves the shooter and records `recoil`; at Mars the same shot's record has no
//     such field and the shooter stands;
//   - the aim lost once the tumble has turned the muzzle past the arms' arc (shot.js AIM: 30° + 2° a point of Weapon handling).
import { assert, near, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { FREEFALL } from '../src/data/body/needs.js';
import { recoilFloat, floatStep, massOf, inertiaOf, aimArcRadOf } from '../src/sim/body/freefall.js';
import { impulseNs } from '../src/sim/arms/calibres.js';
import { v0Of } from '../src/sim/arms/ballistics.js';
import { MODELS } from '../src/sim/arms/models.js';
import { ANCHORS, resolveShot } from '../src/sim/arms/shot.js';
import { gunOn } from '../src/sim/arms/shooting.js';
import { wear } from '../src/sim/arms/kit.js';
import { navOf } from '../src/sim/places/nav.js';
import { movingOf, rowPlan } from '../src/sim/arms/specials.js';
import { turnerTargets } from '../src/sim/arms/turners.js';

const R2D = 180 / Math.PI;
const house = (env = 'ship-coast', setup = 'contact') => {
  const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', env, setup }), s = g.state, pid = s.player.id;
  return { g, s, pid, me: s.actors.list.find(x => x.id === s.player.actor) };
};
const keep = (row) => ({ keepPush: ANCHORS[row].keepPush, keepSpin: ANCHORS[row].keepSpin, row });

export default [
  {
    name: 'a round\'s push J / m and spin J × 0.45 / I (F110; WEAPONS §7.8): impulseNs 8.47, 7.05 and 3.19 N·s; the R-7 and the P-12 at the sergeant\'s kit and in mag boots, each round and 30 on automatic floating, I = 17 × m / 95',
    fn() {
      const H = house(), { s, pid } = H, rows = [];
      const j = { ball: impulseNs('6.5x40r', 'ball', 790), fr: impulseNs('6.5x40r', 'frangible', 790), p12: impulseNs('9x21r', 'ball', 390) };
      rows.push(`impulseNs at the reference speeds: 6.5×40 ball ${fmt(j.ball, 2)}, frangible ${fmt(j.fr, 2)}, 9×21 ball ${fmt(j.p12, 2)} N·s`);
      near(j.ball, 8.47, 0.005, '6.5×40 ball:'); near(j.fr, 7.05, 0.005, 'frangible:'); near(j.p12, 3.19, 0.005, '9×21 ball:');
      for (const boots of [false, true]) {
        if (boots) wear(s, pid, 'mb-1');
        const m = massOf(s, pid), I = inertiaOf(m);
        for (const [model, load] of [['r7', 'ball'], ['r7', 'frangible'], ['p12', 'ball'], ['p12', 'frangible']]) {
          const M = MODELS[model], J = impulseNs(M.cal, load, v0Of(M.cal, load, M.barrelMm));
          const r = recoilFloat(s, pid, { model, load, dirRad: 0, keep: { keepPush: 1, keepSpin: 1, row: 'test' } });
          near(r.dvMs, J / m, 1e-5, `${model} ${load}: J / m`); near(r.spinRads, J * FREEFALL.RECOIL.LEVER_M / I, 1e-6, `${model} ${load}: J × 0.45 / I`);
          rows.push(`${boots ? 'booted ' : ''}${fmt(m, 1)} kg (I ${fmt(I, 2)} kg·m²): ${model} ${load} ${fmt(J, 2)} N·s, ${fmt(r.dvMs * 100, 2)} cm/s and ${fmt(r.spinRads * R2D, 1)}°/s a round; 30 on automatic ${fmt(30 * r.dvMs, 2)} m/s, ${fmt(30 * r.spinRads * R2D, 0)}°/s`);
        }
      }
      // (30 rounds floating, through the body: the drift and the tumble summed on the actor)
      const F = house(), a = F.me;
      for (let k = 0; k < 30; k++) recoilFloat(F.s, F.pid, { model: 'r7', load: 'ball', dirRad: 0, keep: keep('floating') });
      rows.push(`30 R-7 ball rounds fired east floating: the shooter drifts ${JSON.stringify(a.v)} m/s and tumbles ${fmt(a.tumble * R2D, 0)}°/s at ${a.floatY} m`);
      for (const r of rows) console.log(`      ${r}`);
      const one = impulseNs('6.5x40r', 'ball', v0Of('6.5x40r', 'ball', 460)) / massOf(F.s, F.pid);
      assert(a.v[0] < 0 && Math.abs(a.v[1]) < 1e-9 && Math.abs(-a.v[0] - 30 * one) < 0.016 && a.floatY === FREEFALL.FLOAT_Y_M, JSON.stringify({ v: a.v, one }));
    },
  },
  {
    name: 'what each anchor keeps (F110; WEAPONS §7.8): floating all of the push and the spin (the body drifts back along the bore and tumbles); mag boots none of the push and a tenth of the spin; a hand on a hold a fifth and a third; braced and planted nothing; and no anchored body drifts',
    fn() {
      const rows = [];
      for (const row of ['floating', 'magBoots', 'handhold', 'braced', 'planted']) {
        const H = house(), a = H.me, r = recoilFloat(H.s, H.pid, { model: 'r7', load: 'frangible', dirRad: Math.PI / 2, keep: keep(row) });
        rows.push(`${row.padEnd(8)} ${r ? `kept ${fmt(r.keptMs * 100, 2)} cm/s of ${fmt(r.dvMs * 100, 2)}, ${fmt(r.keptRads * R2D, 2)}°/s of ${fmt(r.spinRads * R2D, 2)}; the body ${r.moved ? `drifts ${JSON.stringify(a.v)} m/s and tumbles ${fmt(a.tumble, 4)} rad/s` : 'held'}` : 'keeps nothing (no record)'}`);
        if (row === 'floating') assert(r.moved && a.v[1] < 0 && near(r.keptMs, r.dvMs, 1e-9) === undefined && r.keptRads === r.spinRads, JSON.stringify(r));
        else assert(!a.v && !a.tumble, `${row}: the body moved ${JSON.stringify({ v: a.v, tumble: a.tumble })}`);
        if (row === 'magBoots') { assert(r.keptMs === 0, JSON.stringify(r)); near(r.keptRads, r.spinRads / 10, 1e-6, 'the boots keep a tenth of the spin:'); }
        if (row === 'handhold') { near(r.keptMs, r.dvMs / 5, 1e-5, 'a hold keeps a fifth of the push:'); near(r.keptRads, r.spinRads / 3, 1e-6, 'and a third of the spin:'); }
        if (row === 'braced' || row === 'planted') assert(r === null, `${row}: ${JSON.stringify(r)}`);
      }
      for (const r of rows) console.log(`      ${r}`);
    },
  },
  {
    name: 'a round fired floating through resolveShot pushes the shooter back along the bore, tumbles him and records `recoil`; at Mars the same round leaves him standing, its record without the field (F110)',
    fn() {
      const out = {};
      for (const env of [null, 'ship-coast']) {
        const H = house(env), { s, pid, me } = H, gunId = gunOn(s, pid);
        s.items[gunId].mode = 'semi';
        const dir = me.headRad ?? 0;
        const { shot } = resolveShot(s, null, { pid, gunId, target: { key: 'test', kind: 'paper', paper: 'b27', x: me.x + 10 * Math.cos(dir), z: me.z + 10 * Math.sin(dir), dM: 10 }, log: false });
        out[env ?? 'mars'] = { fired: shot.fired, recoil: shot.recoil ?? null, keys: Object.keys(shot).join(','), v: me.v ?? null, tumble: me.tumble ?? null, dir: shot.dirRad };
      }
      for (const [k, v] of Object.entries(out)) console.log(`      ${k}: ${JSON.stringify(v)}`);
      const M = out.mars, C = out['ship-coast'];
      assert(M.fired && !M.recoil && !M.v && !M.tumble && !M.keys.includes('recoil'), JSON.stringify(M));
      const back = C.v ? (C.v[0] * Math.cos(C.dir) + C.v[1] * Math.sin(C.dir)) : 0;
      assert(C.fired && C.recoil?.row === 'floating' && back < 0 && Math.abs(Math.hypot(...C.v) - C.recoil.keptMs) < 0.002 && C.tumble === C.recoil.keptRads, JSON.stringify(C));
    },
  },
  {
    name: 'the aim is lost once the tumble has turned the muzzle past the arms\' arc since it was settled (F110; WEAPONS §7.8: 30° + 2° a point of Weapon handling, at most 100°), never before; a body still keeps it',
    fn() {
      const H = house('ship-coast', 'go'), { s, pid, me } = H, grid = navOf(s, s.places.live.area, 'C0', me.x, me.z), arc = aimArcRadOf(s, pid);
      s.stop.aim = { key: 'test', settledMs: s.clock.ms };
      me.floatY = 1; me.tumble = 0.4;
      let lostAt = null, prev = 0;
      for (let t = 0; t < 200 && !lostAt; t++) {
        s.clock.ms += 50;
        prev = me.tumbleRad ?? 0;
        floatStep(s, me, { mx: 0, mz: 0 }, grid, pid, 0.05);
        if (!s.stop.aim) lostAt = { t, before: prev };
      }
      // (a body with no tumble: the aim held 200 ticks)
      const K = house('ship-coast', 'go');
      K.s.stop.aim = { key: 'test', settledMs: K.s.clock.ms }; K.me.floatY = 1;
      for (let t = 0; t < 200; t++) { K.s.clock.ms += 50; floatStep(K.s, K.me, { mx: 0, mz: 0 }, grid, K.pid, 0.05); }
      console.log(`      the arc at Weapon handling ${Math.round((arc * R2D - 30) / 2)}: ${fmt(arc * R2D, 0)}°; tumbling at 0.4 rad/s the aim lost at tick ${lostAt?.t} (${fmt(lostAt?.before * R2D, 1)}° turned the tick before, ${fmt((me.tumbleRad ?? 0) * R2D, 1)}° at the loss); no tumble: ${K.s.stop.aim ? 'held 200 ticks' : 'lost'}`);
      assert(lostAt && me.tumbleRad - 0.02 > arc && lostAt.before - 0.02 <= arc && K.s.stop.aim, JSON.stringify({ lostAt, arc, rad: me.tumbleRad }));
    },
  },
  {
    name: 'a drifting marine\'s rounds are floating ones, never "moving on": his drift in the Combat stance is no walk, so his shot rows plan no moving-on twin and no brake to plant (at 0 G the brake is 0, and the planted row\'s brake never ended: the coast lane\'s hang of this round)',
    fn() {
      const H = house('ship-coast', 'go'), { s, pid, me } = H, T = s.armoury.range.turners[0];
      me.moveStance = 'combat'; me.v = [0.6, 0]; me.floatY = 1;
      const mv = movingOf(s, pid), target = { ...(turnerTargets(s, s.clock.ms).find(t => t.key === T.key) ?? { key: T.key, kind: 'turner', x: T.x, z: T.z, face: T.face }), dM: 6 };
      assert(mv === null, `a floating drift read as a walk: ${JSON.stringify(mv)}`);
      const plan = rowPlan(s, pid, 'shot:pair', target, { gunId: gunOn(s, pid), way: 'planted' });
      // (the same marine walking at 1 G: his planted row brakes first, a finite part)
      const W = house(null, 'go'), wm = W.me;
      wm.moveStance = 'combat'; wm.v = [1.2, 0];
      const wmv = movingOf(W.s, W.pid), wplan = rowPlan(W.s, W.pid, 'shot:pair', target, { gunId: gunOn(W.s, W.pid), way: 'planted' });
      console.log(`      floating at 0.6 m/s: moving ${JSON.stringify(mv)}, the pair ${plan.ms} ms (${plan.parts.map(p => p.k).join(', ')}); walking at 1 G at 1.2 m/s: moving ${JSON.stringify(wmv)}, the planted pair ${wplan.ms} ms (${wplan.parts.map(p => `${p.k} ${p.ms}`).join(', ')})`);
      assert(Number.isFinite(plan.ms) && !plan.parts.some(p => p.k === 'brake') && wmv && wplan.parts[0].k === 'brake' && Number.isFinite(wplan.ms), JSON.stringify({ plan: plan.ms, w: wplan.ms }));
    },
  },
];
