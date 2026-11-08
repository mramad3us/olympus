// What the stage reads of the arms (src/sim/arms/look.js; VIEWS §3.4, §4.4; WEAPONS §2.8; the build sheet 0.0.5 §2.1, §5.1): gunLook for every posture, stance and action frame, a case's flight at Mars' gravity from each stance, rangeLook's holes the paper's own, and nothing written by any of it.
import { assert, fmt, near } from './helpers.mjs';
import { armsWorld, LANE } from './arms-world.mjs';
import { digest } from '../src/core/hash.js';
import { toJSON } from '../src/core/state.js';
import { gunLook, kitLook, rangeLook, caseAt, ejectCase, caseGMs2, CASE_G_STEP_MS2, ACTION_FRAMES, CARRY_RIGS, FLASH_MS, KICK_MS, PORT_H_M } from '../src/sim/arms/look.js';
import { presetEnv } from '../src/sim/places/env.js';
import { q } from '../src/core/num.js';

// (a case's gravity on the Melas valley floor, as look.js caseGMs2 reads it there: the preset's at CASE_G_STEP_MS2)
const G_MS2 = q(presetEnv('melas-ground').gravity.gMs2, CASE_G_STEP_MS2);
import { holeOf } from '../src/sim/arms/paper.js';
import { faceRad } from '../src/sim/arms/carry.js';
import { createGame } from './game.mjs';
import { kdBot } from './bots/kd.mjs';
import { kdNow } from '../src/sim/scenarios/range.js';
import { KD_RANGE } from '../src/data/places/range.js';

// (a step under way, as the shot role's stop motion keeps it: state.stop.doing, read by its stepNow)
function doing(W, action, k = 0.5) {
  const ms = W.state.clock.ms, len = 1000;
  W.state.stop = { mode: 'stop', who: W.pid, gun: W.gunId, phase: 'act', pick: null, aim: null, queue: [], keep: {},
    doing: { who: W.pid, step: action, kind: 'single', tempo: 'normal', list: [action], subs: [], i: 0, fromMs: ms - k * len, subFromMs: ms - k * len, untilMs: ms + (1 - k) * len } };
}

export default [
  {
    name: 'gunLook for every posture × stance (the art\'s rig, the muzzle\'s tip) and every action\'s frame, a list walked by the sub-step\'s share',
    fn() {
      const rows = [];
      for (const posture of Object.keys(CARRY_RIGS)) {
        const cells = [];
        for (const stance of ['stand', 'kneel', 'prone']) {
          const W = armsWorld({ posture, stance: stance === 'stand' ? null : stance });
          const g = gunLook(W.state, W.actor);
          assert(g.carry === CARRY_RIGS[posture] && g.stance === stance && g.muzzle && g.model === 'r7', `${posture} ${stance}: ${JSON.stringify(g)}`);
          cells.push(`${stance} ${g.carry} muzzle (${fmt(g.muzzle.x - W.actor.x, 2)}, ${fmt(g.muzzle.y, 2)}, ${fmt(g.muzzle.z - W.actor.z, 2)})`);
        }
        rows.push(`${posture.padEnd(10)} ${cells.join(' · ')}`);
      }
      console.log(`      ${rows.join('\n      ')}`);
      const frames = [];
      for (const action of Object.keys(ACTION_FRAMES)) {
        const W = armsWorld({});
        const ks = Array.isArray(ACTION_FRAMES[action]) ? [0.05, 0.25, 0.4, 0.6, 0.75, 0.95] : [0.5];
        const got = ks.map(k => { doing(W, action, k); return gunLook(W.state, W.actor).action?.frame; });
        frames.push(`${action} ${got.join('/')}`);
        if (Array.isArray(ACTION_FRAMES[action])) assert(got.join() === ACTION_FRAMES[action].join(), `${action} walks its frames: ${got}`);
        else assert(got[0] === ACTION_FRAMES[action], `${action}: ${got[0]}`);
      }
      console.log(`      frames: ${frames.join(', ')}`);
      // (the flash and the kick on game time: a shot at ms, read 30, 100 and 200 ms after)
      const W = armsWorld({ posture: 'aimed' }), ms = W.state.clock.ms;
      W.state.armoury.range = { lane: LANE, hot: true, shots: [{ id: 'sh1', atMs: ms, lane: LANE, string: 0, hole: null, score: 0, v: false }], brass: [] };
      const fk = [30, 100, 200].map(dt => { const g = gunLook(W.state, W.actor, ms + dt); return `${dt} ms flash ${g.flash} kick ${g.kick}`; });
      console.log(`      after a shot: ${fk.join('; ')} (FLASH_MS ${FLASH_MS}, KICK_MS ${KICK_MS})`);
      assert(gunLook(W.state, W.actor, ms + 30).flash > 0 && gunLook(W.state, W.actor, ms + 100).flash === 0 && gunLook(W.state, W.actor, ms + 100).kick > 0 && gunLook(W.state, W.actor, ms + 200).kick === 0, 'flash within 70 ms, kick within 140');
      const k = kitLook(W.state, W.pid);
      console.log(`      kitLook: ${JSON.stringify(k)}`);
      assert(k.ears && k.carrier && k.pouches.map(p => p.n).join() === '2,1,0', 'ears, the carrier, two and one and none');
    },
  },
  {
    name: 'a case\'s flight at 0.38 G (WEAPONS §2.8): 0.87 s and 3.5 m from a standing port, 0.37 s and 1.5 m prone, horizontal at 4 m/s, 60° to the right of the bore, resting where it lands',
    fn() {
      const lines = [];
      // (the place's gravity at the case's resolution is v0.0.10's 3.727 m/s² on Mars: ROADMAP "anywhere"'s step 1 changes no case)
      console.log(`      the case's gravity on the valley floor: ${G_MS2} m/s² (the preset's ${presetEnv('melas-ground').gravity.gMs2} at ${CASE_G_STEP_MS2})`);
      assert(G_MS2 === 3.727, `the case's gravity on Mars: ${G_MS2}`);
      for (const stance of ['stand', 'kneel', 'prone']) {
        let tMin = Infinity, tMax = 0, dMin = Infinity, dMax = 0;
        for (let i = 0; i < 200; i++) {
          const rec = ejectCase({ model: 'r7' }, { x: 1100, z: 292.5, headRad: 0, stance }, { atMs: 1_000_000, kind: 'case', key: `k${i}`, gMs2: G_MS2 });
          const t = (rec.landMs - rec.atMs) / 1000, d = Math.hypot(rec.at[0] - rec.x0, rec.at[1] - rec.z0);
          tMin = Math.min(tMin, t); tMax = Math.max(tMax, t); dMin = Math.min(dMin, d); dMax = Math.max(dMax, d);
          const right = Math.atan2(rec.v[2], rec.v[0]) * 180 / Math.PI;
          assert(right >= 40 - 1e-6 && right <= 80 + 1e-6 && rec.v[1] === 0, `60° ± 20° to the right, level: ${right}`);
        }
        const one = ejectCase({ model: 'r7' }, { x: 1100, z: 292.5, headRad: 0, stance }, { atMs: 0, kind: 'case', key: 'k0', gMs2: G_MS2 });
        const path = [0, 250, 500, one.landMs, one.landMs + 1000].map(ms => { const c = caseAt(one, ms, G_MS2); return `${ms} ms (${fmt(c.x, 2)}, ${fmt(c.y, 2)}, ${fmt(c.z, 2)})${c.rest ? ' at rest' : ''}`; });
        lines.push(`${stance}: from ${PORT_H_M[stance]} m, ${fmt(tMin, 3)} to ${fmt(tMax, 3)} s, ${fmt(dMin, 2)} to ${fmt(dMax, 2)} m; ${path.join(', ')}`);
        const tWant = Math.sqrt(2 * PORT_H_M[stance] / G_MS2);
        near(tMin, tWant, 0.001, `${stance} time`);
        if (stance === 'stand') { near(tMin, 0.87, 0.01, 'standing 0.87 s'); near((dMin + dMax) / 2, 3.5, 0.3, 'standing 3.5 m'); assert(dMin >= 3.2 && dMax <= 3.8, `standing ±0.3: ${dMin} to ${dMax}`); }
        if (stance === 'prone') { near(tMin, 0.37, 0.01, 'prone 0.37 s'); near((dMin + dMax) / 2, 1.5, 0.2, 'prone 1.5 m'); assert(dMin >= 1.3 && dMax <= 1.7, `prone ±0.2: ${dMin} to ${dMax}`); }
      }
      console.log(`      ${lines.join('\n      ')}`);
      // (the sheet's own sample: kneeling at (1100, 292.5) facing east, the case from the port at (1100.30, 0.95, 292.62))
      const s = ejectCase({ model: 'r7' }, { x: 1100, z: 292.5, face: 'right', stance: 'kneel' }, { atMs: 23520060130, kind: 'case', key: 'sample', gMs2: G_MS2 });
      console.log(`      the sheet's kneeling sample: from (${s.x0}, ${s.y0}, ${s.z0}) at ${fmt(Math.hypot(...s.v), 2)} m/s, lands ${s.landMs - s.atMs} ms on at (${s.at.map(v => fmt(v, 2)).join(', ')})`);
      assert(s.x0 === 1100.3 && s.z0 === 292.62 && s.y0 === 0.95 && s.landMs - s.atMs === 714, `the port and the fall as the sheet's sample: ${JSON.stringify(s)}`);
      const thrown = ejectCase({ model: 'r7' }, { x: 0, z: 0, yawRad: faceRad('right'), stance: 'stand', hand: true }, { atMs: 0, kind: 'dummy', key: 'd', gMs2: G_MS2 });
      console.log(`      the dummy thrown by a hand on the charging handle: ${fmt(Math.hypot(thrown.at[0] - thrown.x0, thrown.at[1] - thrown.z0), 2)} m`);
    },
  },
  {
    name: 'rangeLook\'s holes are paper.js\'s (the shot role\'s holeOf, stored on the session), numbered in their string; brass and the magazines lying; and nothing any look reads is written (the digest unchanged)',
    fn() {
      const W = armsWorld({ posture: 'aimed' }), { state } = W, ms = state.clock.ms;
      const rolls = [{ margin: 14, nat: 0 }, { margin: 6, nat: 0 }, { margin: 2, nat: 0 }, { margin: -2, nat: 0 }, { margin: -8, nat: 0 }, { margin: 3, nat: 0 }];
      const shots = rolls.map((roll, i) => { const id = `sh${i + 1}`, h = holeOf('card25', roll, id); return { id, atMs: ms - 6000 + i * 1000, lane: LANE, string: i < 5 ? 0 : 1, hole: h.at, score: h.score, v: h.v }; });
      const brass = [ejectCase({ model: 'r7' }, { x: W.actor.x, z: W.actor.z, headRad: 0, stance: 'stand' }, { atMs: ms - 300, kind: 'case', key: 'b1', gMs2: caseGMs2(state) }),
        ejectCase({ model: 'r7' }, { x: W.actor.x, z: W.actor.z, headRad: 0, stance: 'stand', hand: true }, { atMs: ms - 2000, kind: 'dummy', key: 'b2', gMs2: caseGMs2(state) })];
      state.armoury.range = { lane: LANE, hot: true, shots, brass };
      const before = digest(toJSON(state));
      const look = rangeLook(state, ms);
      for (let t = 0; t < 200; t++) { gunLook(state, W.actor, ms + t * 7); kitLook(state, W.pid); rangeLook(state, ms + t * 7); }
      const after = digest(toJSON(state));
      const mine = look.lanes.find(l => l.mine);
      console.log(`      lane ${mine.lane}'s holes: ${mine.holes.map(h => `#${h.n} (${h.xCm}, ${h.yCm}) ${h.score}${h.v ? 'V' : ''}`).join(', ')}; the other lanes ${look.lanes.filter(l => !l.mine).map(l => l.holes.length).join(',')}`);
      console.log(`      brass: ${look.brass.map(b => `${b.kind} (${fmt(b.x, 2)}, ${fmt(b.y, 2)}, ${fmt(b.z, 2)})${b.rest ? ' at rest' : ' in flight'}`).join(', ')}; hot ${look.hot}; digest ${before} → ${after}`);
      const want = shots.filter(s => s.hole).map(s => s.hole.join());
      assert(JSON.stringify(mine.holes.map(h => [h.xCm, h.yCm].join())) === JSON.stringify(want), 'the holes are paper.js\'s');
      assert(mine.holes.map(h => h.n).join() === '1,2,3,4,1', `numbered in their string: ${mine.holes.map(h => h.n)}`);
      assert(look.brass.length === 2 && look.brass[0].rest === false && look.brass[1].rest === true, 'a case in flight, the dummy at rest');
      assert(before === after, 'nothing written');
    },
  },
  {
    name: 'rangeLook.kd (0.0.7) on test-range\'s 300 m line: the twenty faces with how far each is up (continuous through a mark), the flags\' heading and lift, the relay\'s fires, the cases flying and on their tiles, the dust in the berm; a gunner\'s rifle aimed at its own face',
    fn() {
      const g = createGame({ scenario: 'test-range', seed: 7, setup: 'confirm' }), bot = kdBot(), s = g.state;
      let maxJump = 0, prev = null, seenFire = 0, seenDust = 0, ups = new Set(), gunnerAim = null;
      for (let n = 0; n < 20 * 90 && kdNow(s).cmd !== 'clear'; n++) {
        g.step(1, bot);
        const L = rangeLook(s, s.clock.ms).kd, own = L.faces[s.armoury.range.kdLane - 1];
        if (prev !== null) maxJump = Math.max(maxJump, Math.abs(own.up - prev));
        prev = own.up; ups.add(Math.round(own.up * 10) / 10);
        seenFire = Math.max(seenFire, L.fires.length); seenDust = Math.max(seenDust, L.dust.length);
        const G = s.armoury.range.relay[0], a = s.actors.list.find(x => x.who === G.pid);
        if (!gunnerAim && a) { const look = gunLook(s, a, s.clock.ms); if (look?.aim) gunnerAim = { aim: look.aim, carry: look.carry }; }
      }
      const L = rangeLook(s, s.clock.ms).kd;
      console.log(`      the line ${L.line} m; ${L.faces.length} faces, yours went through ${[...ups].sort().join(', ')} (the biggest step a tick ${fmt(maxJump, 3)}); ${L.flags.length} flags, e.g. ${JSON.stringify(L.flags[2])}; fires up to ${seenFire} at once; dust up to ${seenDust}; ${L.tiles.length} tiles of cases (${L.tiles.reduce((t, x) => t + x.n, 0)}); a gunner ${JSON.stringify(gunnerAim)}`);
      assert(L.faces.length === 20 && L.flags.length === KD_RANGE.kd.flags.length && L.flags.length === 26, 'every face and flag (twenty-six: twelve on the sides, a row of four 18 m downrange of each line and two more down the middle, 0.0.8)');
      assert(ups.has(0) && ups.has(1) && maxJump <= 0.05, `a face goes down and up continuously (${maxJump} a tick)`);
      assert(seenFire >= 2 && L.tiles.length > 0, 'the relay\'s fires and cases');
      assert(gunnerAim && gunnerAim.carry === 'aim' && gunnerAim.aim.x === 1600, `a gunner aims at its own face: ${JSON.stringify(gunnerAim)}`);
    },
  },
];
