// OLYMPUS tests: the walk cycles as the game draws them (the shoot house rework's stage R8; VIEWS §3.10.2 to §3.10.9; BODY §16.8).
//
// The user, scoring v0.0.12 (2026-11-11): "saying that the walking about is goofy is an understatement, the animation is really
// not there yet." In node, the art and the view's gait (src/art/figures/walk.js, poses.js, src/render/gait-view.js), each
// printing its numbers:
//   - the key sets are the sim's steps (src/data/body/gait.js STEP_PX), each key's planted travel whole pixels, the keys at most
//     2 px apart (3 in the run), every key reached by the legs but C's passing (the sample's own finding);
//   - no slip (item 1): side on, every candidate's band composed frame by frame, the planted foot's contact pixel held where it
//     landed through its stance when the card is placed by the plant lock (walk.js cycleAt's lag);
//   - the turret (item 3): the aimed bands' muzzle row over the cycle side on (B 0 px);
//   - the cadence (item 6): the bands at 1 G, on Mars and on Europa, steps a second and the band; Careful slower-legged than
//     Fast at 1 G, the 1 G run in 3.0 to 4.0 steps a second;
//   - the facing (item 4): the yaw dithering about 45° never flips the facing; a 180° turn shows the middle facing; a facing is
//     held 250 ms unless the yaw swings 100°; the legs by the travel's angle (forward, the band reversed backwards, the side-step);
//   - the beats: start and plant, the stack's breath held in stop motion, the door, the kick and the tap read from the corporal's
//     lane (src/sim/arms/look.js beatOf), the kneel half way (the stance step's frames);
//   - the stance pool (VIEWS §3.10.8): its sheet within a base slot at 16 and 24 px/m, every frame drawn in every carry and
//     facing, the aimed walk shouldered (v0.0.13 drew it at the high ready), the shot on the move with its flash;
//   - the flag (VIEWS §3.10.4): a look with cycle A or C paints other walk frames than B's, keyed apart, and the sim counts the
//     phase in the flag's steps (state.$cycle, never saved).
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseTBot } from './bots/house.mjs';
import { CYCLE_KEYS, BAND_KEYS, bandSpec, cycleAt, keyLegs, CYCLE_IDS, flightLiftM } from '../src/art/figures/walk.js';
import { poseOf, walkFrame, BANDS, STANCE_BANDS, POOL_OF } from '../src/art/figures/poses.js';
import { composeFrame } from '../src/art/figures/compose.js';
import { sheetLayout, paintFrame, paintBand, shapeKey, flashStrip } from '../src/art/figures/atlas.js';
import { wear } from '../src/art/figures/outfits.js';
import { createGaitView, faceFor, travelKind, FACE_AXIS } from '../src/render/gait-view.js';
import { STEP_PX, STEP_PPM, CYCLE, LOPE_VZ_MS } from '../src/data/body/gait.js';
import { stepMOf, locoStep } from '../src/sim/body/loco.js';
import { gaitSpeeds } from '../src/sim/body/motion.js';
import { beatOf, gunLook } from '../src/sim/arms/look.js';

const LOOK = { outfit: 'utilities', weapon: 'rifle', seed: 3 };
const D2R = Math.PI / 180;
/** The planted foot's point on the floor side on (cell px), where its heel lies flat: the heel on a heel strike or flat, on the roll off the toe less the boot's length (it turns on the toe). */
const FOOT_PX = 5;
const contactX = (fr, side, psi, sgn) => (psi < 0 ? fr.feet[side].toe[0] - sgn * FOOT_PX : fr.feet[side].heel[0]);

export default [
  {
    name: 'the key sets are the sim\'s steps (gait.js STEP_PX): whole pixels a key, at most 2 px between keys (3 in the run), the legs reaching every key but C\'s passing',
    fn() {
      const rows = [];
      for (const c of CYCLE_IDS) for (const band of ['walk', 'combat', 'assault', 'run']) {
        const sp = bandSpec(c, band), gaps = [...sp.starts.slice(1), sp.S].map((v, i) => v - sp.starts[i]);
        const reached = sp.keys.map((_, j) => keyLegs(c, band, j, 0).reached);
        rows.push(`${c} ${band} S ${sp.S} (${BAND_KEYS[c][band]}) keys at ${sp.starts.join(', ')} gaps ${gaps.join(', ')} reached ${reached.map(r => (r ? 'y' : 'n')).join('')}`);
        assert(sp.S === STEP_PX[c][band], `${c} ${band}: S ${sp.S} against STEP_PX ${STEP_PX[c][band]}`);
        assert(sp.starts.every(Number.isInteger) && gaps.every(g => g > 0 && g <= (band === 'run' ? 3 : 2)), `${c} ${band} gaps ${gaps}`);
        assert(reached.every((r, j) => r || (c === 'C' && j === 1)), `${c} ${band} reached ${reached}`);
      }
      console.log(`      ${rows.join('\n      ')}`);
    },
  },
  {
    name: 'no slip side on (VIEWS §3.10.9 item 1): every candidate\'s walk, glide and Assault composed frame by frame, the card placed by the plant lock, the planted foot\'s contact pixel held where it landed through its stance',
    fn() {
      const rows = [];
      let worst = 0;
      for (const c of CYCLE_IDS) for (const band of ['walk', 'combat', 'assault']) for (const dir of ['right', 'left']) {
        const sp = bandSpec(c, band), sgn = dir === 'right' ? 1 : -1, L = wear({ ...LOOK, carry: band === 'walk' ? 'slung' : 'low', cycle: c });
        let slip = 0;
        for (const step of [0, 1]) {
          const side = step ? 'l' : 'r', xs = [];
          for (let j = 0; j < sp.n; j++) {
            const name = band === 'walk' ? `walk${step * sp.n + j}` : `${band === 'combat' ? 'glide' : 'assault'}${step * sp.n + j}`;
            const pose = poseOf(name, { weapon: 'rifle', carry: L.carry, cycle: c });
            const fr = composeFrame(L, dir, name, { pose });
            // (the card at the key's start along the travel (the plant lock): the contact in the world's pixels)
            xs.push(sgn * sp.starts[j] + contactX(fr, side, sp.keys[j].plant[1], sgn) - fr.ax);
          }
          slip = Math.max(slip, Math.max(...xs) - Math.min(...xs));
        }
        worst = Math.max(worst, slip);
        rows.push(`${c} ${band} ${dir} ${fmt(slip, 2)}`);
      }
      console.log(`      the planted foot's contact pixel over its stance, its range (px): ${rows.join(', ')}; worst ${fmt(worst, 2)} (v0.0.12's cycle slid 4.7 px a step in the glide, 7.3 in Assault)`);
      assert(worst <= 0.01, `worst ${worst}`);
    },
  },
  {
    name: 'the turret (item 3): the aimed glide and Assault keep the muzzle on one pixel row side on over the cycle in B (A and C printed), and an aimed walk is drawn shouldered, never at the high ready v0.0.13 drew it at',
    fn() {
      const rows = [];
      for (const c of CYCLE_IDS) for (const band of ['glide', 'assault']) {
        const sp = bandSpec(c, band === 'glide' ? 'combat' : 'assault'), L = wear({ ...LOOK, carry: 'aim', cycle: c, sheet: 'stance' });
        const ys = Array.from({ length: 2 * sp.n }, (_, k) => composeFrame(L, 'right', `${band}${k}`).muzzle?.[1] ?? null);
        const range = Math.max(...ys) - Math.min(...ys);
        rows.push(`${c} ${band} ${fmt(range, 0)} px`);
        assert(ys.every(y => y !== null), `${c} ${band}: a muzzle in every frame`);
        if (c === 'B') assert(range === 0, `B ${band}: ${ys}`);
      }
      const rig = poseOf('glide3', { weapon: 'rifle', carry: 'aim' }).rig, low = poseOf('glide3', { weapon: 'rifle', carry: 'low' }).rig;
      console.log(`      the muzzle row's range over the aimed cycle: ${rows.join(', ')}; the aimed glide's rig ${rig.mode}, the low ready's ${low.mode}`);
      assert(rig.mode === 'aim' && low.mode === 'low', JSON.stringify({ rig, low }));
    },
  },
  {
    name: 'the cadence (item 6): each band at 1 G, on Mars and on Europa, steps a second and the band; Careful slower-legged than Fast at 1 G (v0.0.12 had it inverted, 5.1 against 2.26), the 1 G run in 3.0 to 4.0 steps a second through flight',
    fn() {
      const rows = [], at = {};
      for (const [place, gG] of [['1 G', 1], ['Mars', 0.38], ['Europa', 0.134]]) {
        const gMs2 = gG * 9.80665;
        for (const [label, gait, stance, kind] of [['Relaxed walk', 'walk', null, 'relaxed'], ['Careful', 'walk', 'combat', 'combat'], ['Fast', 'walk', 'assault', 'assault'], ['run', 'run', null, 'relaxed']]) {
          const G = gaitSpeeds({ gG, gait: kind }), v = gait === 'run' ? G.runMs : G.walkMs;
          const s = stepMOf({ gait, stance, vMs: v, gMs2 }), sps = v / s.stepM;
          at[`${place}|${label}`] = sps;
          rows.push(`${place} ${label} ${fmt(v, 2)} m/s: ${s.band}${s.flight ? `, flight ${fmt(s.flight * 1000, 0)} ms, ${fmt(flightLiftM(0.5, gait === 'run' ? 0.9 : LOPE_VZ_MS, gMs2) * 16, 1)} px` : ''}, step ${fmt(s.stepM, 2)} m, ${fmt(sps, 2)} steps/s`);
        }
      }
      console.log(`      ${rows.join('\n      ')}`);
      assert(at['1 G|Careful'] < at['1 G|Fast'], `1 G: Careful ${at['1 G|Careful']} against Fast ${at['1 G|Fast']}`);
      assert(at['1 G|run'] >= 3 && at['1 G|run'] <= 4, `the 1 G run ${at['1 G|run']}`);
      assert(at['Mars|run'] < at['1 G|run'] * 0.7, 'Mars runs at about half Earth\'s cadence');
    },
  },
  {
    name: 'the plant lock (VIEWS §3.10.2): within a key the drawn card stands still as the sim walks on, the lag never over the key\'s gap; backwards the frames run the other way; the flight lifts the card by the ballistic height from the sim\'s gravity',
    fn() {
      const sp = bandSpec('B', 'combat'), stepM = sp.S / STEP_PPM;
      let worstMove = 0, worstLag = 0, lastFrame = null, lastCard = null;
      for (let i = 0; i <= 400; i++) {
        const gp = i / 200, simPx = gp * sp.S, at = cycleAt({ cycle: 'B', band: 'combat', gp, stepM });
        const card = simPx - at.lagPx;
        if (lastFrame === at.frame) worstMove = Math.max(worstMove, Math.abs(card - lastCard));
        worstLag = Math.max(worstLag, at.lagPx);
        lastFrame = at.frame; lastCard = card;
      }
      const fwd = [0.1, 0.4, 0.6, 0.9].map(g => walkFrame('combat', { gp: g, stepM }).frame), back = [0.1, 0.4, 0.6, 0.9].map(g => walkFrame('combat', { gp: g, stepM, back: true }).frame);
      const lope = cycleAt({ cycle: 'B', band: 'assault', gp: 0.95, stepM: 7 / 16 + 1.6 * 0.268 }), lift = flightLiftM(0.5, LOPE_VZ_MS, 3.7265);
      console.log(`      B's glide over two steps: the card moved ${fmt(worstMove, 3)} px within a key, the lag at most ${fmt(worstLag, 2)} px; forward ${fwd.join(' ')}, backwards ${back.join(' ')}; Mars's lope at 0.95 of a step ${lope.flight ? `in flight, ${fmt(lope.u, 2)} of it` : 'on the ground'}, the apex ${fmt(lift * 16, 2)} px`);
      assert(worstMove < 1e-9 && worstLag <= 2, JSON.stringify({ worstMove, worstLag }));
      const idx = (fs) => fs.map(f => Number(f.replace(/^\D+/, '')));
      assert(idx(fwd).every((v, i, a) => !i || v > a[i - 1]) && idx(back).every((v, i, a) => !i || v < a[i - 1]), `forward ${fwd} / backwards ${back}`);
      assert(lope.flight && lift > 0 && lift * 16 < 1, JSON.stringify({ lope, lift }));
    },
  },
  {
    name: 'the facing (item 4): by the body\'s yaw with 55° of hysteresis, the yaw dithering about 45° never flips it (v0.0.12: 28 changes a lane, 8 within 250 ms), a 180° turn shows the middle facing, a change held 250 ms unless the yaw swings 100°, a turn on the spot pivoting on a step; the legs by the travel\'s angle to it',
    fn() {
      const G = createGaitView(), base = { free: true, turnsByYaw: true, walking: false, simFace: 'right', sheet: true };
      let changes = 0, f0 = null;
      for (let i = 0; i < 100; i++) { const r = G.draw({ ...base, id: 'd', ms: i * 50, tickMs: i * 50, yawRad: (45 + (i % 2 ? 6 : -6)) * D2R }); if (f0 && r.face !== f0) changes++; f0 = r.face; }
      const H = createGaitView(), seen = [];
      for (let i = 0; i <= 16; i++) { const r = H.draw({ ...base, id: 't', ms: i * 50, tickMs: i * 50, yawRad: Math.min(Math.PI, i * Math.PI / 16) }); if (seen.at(-1) !== r.face) seen.push(r.face); }
      const K = createGaitView();
      K.draw({ ...base, id: 'h', ms: 0, tickMs: 0, yawRad: 0 });
      const a = K.draw({ ...base, id: 'h', ms: 50, tickMs: 50, yawRad: 60 * D2R }).face, b = K.draw({ ...base, id: 'h', ms: 100, tickMs: 100, yawRad: 0 }).face, c = K.draw({ ...base, id: 'h', ms: 400, tickMs: 400, yawRad: 0 }).face;
      const P = createGaitView(), pv = [0, 50, 100, 150, 200, 250].map((ms, i) => P.draw({ ...base, id: 'p', ms, tickMs: ms, yawRad: Math.min(Math.PI / 2, i * Math.PI / 6) }).frame ?? '-');
      const kinds = [0, 30, 90, 150, 180].map(d => travelKind('right', d * D2R));
      console.log(`      the yaw at 45° ± 6° for 100 ticks: ${changes} changes (facing ${f0}); a turn of 180° in 0.8 s shows ${seen.join(' → ')}; turned 60° then back at once: ${a}, held ${b}, then ${c}; travel at 0, 30, 90, 150, 180° to a body facing right: ${kinds.join(', ')}; faceFor(right, 50°) ${faceFor('right', 50 * D2R)}, faceFor(right, 60°) ${faceFor('right', 60 * D2R)}; a quarter turn on the spot in 0.15 s: ${pv.join(' ')}`);
      assert(changes === 0 && seen.join() === 'right,down,left' && a === 'down' && b === 'down' && c === 'right', JSON.stringify({ changes, seen, a, b, c }));
      assert(pv.filter(f => f.startsWith('glide')).length >= 2 && pv.at(-1) === '-', pv.join());
      assert(kinds.join() === 'fwd,fwd,side,back,back' && faceFor('right', 50 * D2R) === 'right' && faceFor('right', 60 * D2R) === 'down' && FACE_AXIS.up === -Math.PI / 2, kinds.join());
    },
  },
  {
    name: 'the beats (VIEWS §3.10.7): start over the first 0.1 m, plant while braking and just after a stop, the side-step across the facing, the shot on the move; the stack\'s breath on game time, held in stop motion; the kneel half way; the pistol drawn and aimed',
    fn() {
      const G = createGaitView(), w = { id: 'm', free: true, turnsByYaw: true, simFace: 'right', yawRad: 0, sheet: true, band: 'combat', stepM: 0.375, cycle: 'B', gMs2: 9.81, travelRad: 0 };
      const seq = [];
      const walkAt = (i, v, extra = {}) => G.draw({ ...w, ms: i * 50, tickMs: i * 50, walking: v > 0, vMs: v, stride: i * 0.06, gp: i * 0.16, ...extra });
      seq.push(walkAt(0, 0).frame ?? '-', walkAt(1, 1.2).frame, walkAt(2, 1.2).frame, walkAt(3, 1.23).frame, walkAt(4, 1.23).frame, walkAt(5, 0.6).frame, walkAt(6, 0).frame, walkAt(9, 0).frame ?? '-');
      const side = G.draw({ ...w, ms: 600, tickMs: 600, walking: true, vMs: 1, stride: 1, gp: 1, travelRad: Math.PI / 2 }).frame;
      const shot = G.draw({ ...w, ms: 650, tickMs: 650, walking: true, vMs: 1.2, stride: 1.1, gp: 1.2, kick: true, aimed: true }).frame;
      const st = (ms) => G.draw({ ...w, id: 's', ms, tickMs: ms, walking: false, beat: { kind: 'stack', k: 0, slot: 1 } }).frame;
      const breath = Array.from({ length: 16 }, (_, i) => st(10_000 + i * 500)), held = [st(20_000), st(20_000), st(20_000)];
      const kneel = G.draw({ ...w, id: 'k', ms: 0, tickMs: 0, walking: false, action: 'kneelGoing' }).frame, pistol = G.draw({ ...w, id: 'p', ms: 0, tickMs: 0, walking: false, pistol: { posture: 'aimed' } }).frame;
      const kick = [0.1, 0.5, 0.9].map(k => G.draw({ ...w, id: 'q', ms: k * 1000, tickMs: k * 1000, walking: false, beat: { kind: 'kick', k } }).frame);
      console.log(`      from a standstill: ${seq.join(' ')}; across the facing ${side}; a shot on the move ${shot}; at the stack every 0.5 s: ${breath.join(' ')}; held: ${held.join(' ')}; the kneel ${kneel}; the pistol ${pistol}; the kick ${kick.join(' ')}`);
      assert(seq[1] === 'start' && seq[3].startsWith('glide') && seq[5] === 'plant' && seq[6] === 'plant' && seq[7] === '-', seq.join());
      assert(side.startsWith('sideR') && shot.startsWith('fireMove') && breath.includes('stack') && breath.includes('stackB') && new Set(held).size === 1, JSON.stringify({ side, shot, breath, held }));
      assert(kneel === 'kneelGoing' && pistol === 'pistolAim' && kick.join() === 'kick0,kick1,kick2', JSON.stringify({ kneel, pistol, kick }));
    },
  },
  {
    name: 'the beats read from the drill (look.js beatOf): the corporal\'s lane by T shows you at the stack and on the door, and your #2\'s tap on your shoulder at the squeeze, on the sim\'s beats',
    timeoutMs: 120_000,
    async fn() {
      const g = await createGame({ scenario: 'test-shoothouse', seed: 48213, setup: 'go', tier: 'cpl' }), bot = houseTBot(), seen = {};
      for (let i = 0; i < 1200; i++) {
        const s = g.state, me = s.actors.list.find(a => a.id === s.player.actor), H = s.armoury.range.house;
        g.step(1, bot(s, me, (me.bot ??= {})));
        for (const [who, pid] of [['you', s.player.id], ['your #2', H.twoPid]]) { const b = beatOf(s, pid, s.clock.ms); if (b) seen[`${who} ${b.kind}`] = (seen[`${who} ${b.kind}`] ?? 0) + 1; }
        if (i === 600) assert(gunLook(s, me, s.clock.ms) && 'beat' in gunLook(s, me, s.clock.ms), 'the house\'s gunLook carries the beat');
      }
      console.log(`      ticks in each beat: ${Object.entries(seen).map(([k, n]) => `${k} ${n}`).join(', ')}`);
      assert(seen['you stack'] > 0 && seen['you door'] > 0 && seen['your #2 tap'] > 0, JSON.stringify(seen));
    },
  },
  {
    name: 'the stance pool (VIEWS §3.10.8): its sheet within a base slot at 16 and 24 px/m, every frame drawn in every carry and facing; the shot on the move has its flash in the strip; the stroll\'s frames gone and the base sheet still 512 × 752',
    fn() {
      const rows = [];
      for (const ppm of [16, 24]) {
        const lay = sheetLayout(ppm), st = lay.pools.stance;
        rows.push(`${ppm} px/m: the stance sheet ${st.w} × ${st.h} in a base slot of ${lay.w} × ${lay.h}`);
        assert(st.w <= lay.w && st.h <= lay.h && lay.w === 32 * ppm && lay.h === (ppm === 16 ? 752 : 1128), JSON.stringify(st));
      }
      let blank = 0, n = 0;
      for (const carry of ['low', 'high', 'aim']) for (const band of STANCE_BANDS) {
        const b = paintBand({ ...LOOK, carry, sheet: 'stance' }, band, { ppm: 16 }), lay = sheetLayout(16);
        for (const f of BANDS[band]) for (const d of ['down', 'up', 'right', 'left']) {
          const c = lay.cells.get(`${f}|${d}`); n++;
          let px = 0;
          for (let y = c.y - b.rect.y; y < c.y - b.rect.y + c.h; y++) for (let x = c.x - b.rect.x; x < c.x - b.rect.x + c.w; x++) if ((b.pm.data[y * b.rect.w + x] >>> 24) >= 128) px++;
          if (px < 60) blank++;
        }
      }
      const strip = flashStrip(16), fm = ['right', 'left', 'down', 'up'].filter(d => strip.index.has(`rifle|${d}|fireMove0`));
      console.log(`      ${rows.join('; ')}; ${n} stance cells painted (3 carries), ${blank} blank; the shot on the move's flash facing ${fm.join(', ')}; pools ${[...new Set(STANCE_BANDS.map(b => POOL_OF[b]))]}`);
      assert(!blank && fm.length === 4 && !BANDS.move.some(f => f.startsWith('stroll')), JSON.stringify({ blank, fm }));
    },
  },
  {
    name: 'the flag (VIEWS §3.10.4: &cycle=A|B|C, B until the user\'s score): a look with A or C paints other walk frames than B\'s, keyed apart; the sim counts the drawn phase in the flag\'s steps ($gp, runtime) and the saved gp always in B\'s, so a save made with the flag replays with B\'s bytes (the code review of 2026-11-13)',
    async fn() {
      const sig = (pm) => { let h = 2166136261; for (const v of pm.data) { h ^= v; h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); };
      const sigs = CYCLE_IDS.map(c => sig(paintFrame({ ...LOOK, carry: 'low', sheet: 'stance', cycle: c }, 'right', 'glide1').pm));
      const keys = CYCLE_IDS.map(c => shapeKey(wear({ ...LOOK, cycle: c })));
      const gps = {}, saved0 = {};
      const g = await createGame({ scenario: 'test-shoothouse', seed: 48213, setup: 'go' });
      for (const c of [null, 'A', 'C']) {
        const a = { who: null, x: 10, z: 10, gp: 0, moveStance: 'combat' };
        if (c) g.state.$cycle = c; else delete g.state.$cycle;
        a.x = 10.1; locoStep(a, 10, 10, { state: g.state, pid: null, gait: 'walk', stance: 'combat', vMs: 1.23 });
        gps[c ?? CYCLE] = c ? a.$gp : a.gp;
        saved0[c ?? CYCLE] = a.gp;
      }
      g.state.$cycle = 'A';
      const saved = JSON.stringify(g.save ? g.save() : {});
      console.log(`      glide1 side on by candidate: ${CYCLE_IDS.map((c, i) => `${c} ${sigs[i]}`).join(', ')}; the gait phase for 0.1 m of the glide: ${Object.entries(gps).map(([c, v]) => `${c} ${fmt(v, 4)}`).join(', ')} (steps of 4, 6 and 5 px: ${CYCLE_KEYS.A.glide.S}, ${CYCLE_KEYS.B.glide.S}, ${CYCLE_KEYS.C.glide.S}); the default ${CYCLE}`);
      assert(new Set(sigs).size === 3 && new Set(keys).size === 3 && CYCLE === 'B', JSON.stringify({ sigs, keys }));
      assert(Math.abs(gps.A - 0.4) < 1e-4 && Math.abs(gps.B - 0.1 / 0.375) < 1e-4 && Math.abs(gps.C - 0.32) < 1e-4, JSON.stringify(gps));
      assert(!saved.includes('"$cycle"'), 'the flag never saved');
      // (the saved phase is B's whatever the page plays)
      console.log(`      the saved gp by the cycle played: ${Object.entries(saved0).map(([c, v]) => `${c} ${fmt(v, 4)}`).join(', ')}`);
      assert(Object.values(saved0).every(v => Math.abs(v - 0.1 / 0.375) < 1e-4), JSON.stringify(saved0));
    },
  },
];
