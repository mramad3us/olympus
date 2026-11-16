// OLYMPUS tests: the kit's second slice in the ears (WEAPONS §12.5; the build sheet 0.0.19 §6 K-face, kit2 §2.9 and §6 test 36; src/ui/audio/blast.js), in node.
//
// kit2 §2.9: the practice grenades sound as practice, a pop and a puff, never the live twin's bang; everything through the
// suit's filters and never over its gate; one quantity, one number: a burst's level follows its peak overpressure at the
// listener (blast.js peakKPa), so in Mars' surface air a burst is about 40 dB down, and in vacuum there is no airborne voice,
// only the floor's thump within 5 m. A breach round is the R-7's shot (the range's, gun.js) plus a steel strike at the leaf.
// The pin, the lever, the floor's knock and the shock tube's snap are read off the sim's devices once a frame. Each fails
// without its part of blast.js: the practice recipes and their routing, thinDb, the vacuum's thump, the shot's strike, frame().
import { assert, fmt } from './helpers.mjs';
import { blastVoice, kitVoice, createBlast, sourceDb, thinDb, SUIT_GATE_DB, BLAST_RECIPES, BLAST_REF_KPA, THUMP_M, THUMP_LP_HZ, TUBE_SNAP_DB } from '../src/ui/audio/blast.js';
import { render, measure } from '../src/ui/audio/synth.js';
import { mixdown, master, levels, CLIP_LIMIT, MASTER } from '../src/ui/audio/mix.js';
import { CHAOS } from '../src/data/sounds.js';
import { AIRS } from '../src/data/places/env.js';
import { createGame } from './game.mjs';

const ROOM = AIRS['martian-indoor'], SOUND = 343, MARS_KPA = 0.6;
const SR = 24000;
const peakOf = (kind) => (BLAST_RECIPES[kind] ?? CHAOS[kind]).levelDb;
const samplesOf = (kind) => render(BLAST_RECIPES[kind] ?? CHAOS[kind], { sampleRate: SR, name: kind });
// (a fake engine: what the presenter asks for, in order)
const recorder = () => { const played = []; return { played, engine: { bang: (kind, o) => { played.push({ kind, ...o }); return true; } } }; };

export default [
  {
    name: 'a G-9P\'s spotting charge, a G-13P, the BC-1 and the shock tube\'s snap through the suit\'s filters stay at or under its gate and under the clip (kit2 §6 test 36): each voice\'s peak at the master\'s input no louder than the gated report\'s (the protect ceiling), the master\'s output never past CLIP_LIMIT; a practice grenade\'s burst plays the pop and the puff, never the bang',
    fn() {
      const me = { x: 0, z: 0 }, rows = [], bad = [];
      const ceiling = peakOf('bangReport') + SUIT_GATE_DB;
      for (const dM of [1, 2.2, 4]) {
        const at = { x: dM, z: 0 }, cells = [];
        for (const model of ['g9p', 'g13p', 'bc1']) {
          const v = blastVoice({ me, at, model, suit: true, soundMs: SOUND, pKpa: ROOM.pKpa });
          const kind = model === 'bc1' ? 'bangReport' : 'practicePop', pk = peakOf(kind) + v.gainDb;
          cells.push(`${model} ${fmt(v.gainDb)} dB (peak ${fmt(pk)} dBFS)`);
          if (v.gainDb > SUIT_GATE_DB + 1e-9 || pk > ceiling + 1e-9 || !v.gated) bad.push(`${model} at ${dM} m`);
        }
        const t = kitVoice({ me, at, srcDb: TUBE_SNAP_DB, suit: true, soundMs: SOUND, pKpa: ROOM.pKpa }), tp = peakOf('tubeSnap') + t.gainDb;
        cells.push(`the tube ${fmt(t.gainDb)} dB (peak ${fmt(tp)})`);
        if (t.gainDb > SUIT_GATE_DB + 1e-9 || tp > ceiling + 1e-9) bad.push(`tube at ${dM} m`);
        rows.push(`${dM} m: ${cells.join(', ')}`);
      }
      // (the loudest of them all at once, 1 m off, through the master: never past the clip)
      const voice = (kind, v) => ({ samples: samplesOf(kind), sampleRate: SR, atS: 0.05, gainDb: v.gainDb, lowHz: v.lowpassHz, pan: 0, rate: v.rate ?? 1 });
      const near = { x: 1, z: 0 }, vs = [voice('practicePop', blastVoice({ me, at: near, model: 'g9p', suit: true, soundMs: SOUND, pKpa: ROOM.pKpa })), voice('bangReport', blastVoice({ me, at: near, model: 'bc1', suit: true, soundMs: SOUND, pKpa: ROOM.pKpa })), voice('tubeSnap', kitVoice({ me, at: near, srcDb: TUBE_SNAP_DB, suit: true, soundMs: SOUND, pKpa: ROOM.pKpa }))];
      const out = master(mixdown(vs, { sampleRate: SR, durS: 1 }), MASTER, { sampleRate: SR }), L = levels(out, { sampleRate: SR });
      // (the routing: a practice blast is the pop and the whoof, a charge's the report)
      const { played, engine } = recorder(), B = createBlast(engine);
      const house = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'cpl', setup: 'go', loadout: 'mixed' }).state, ms = house.clock.ms;
      B.fact('fx', { kind: 'blast', model: 'g9p', x: 29, z: 9, atMs: ms - 10 }, house);
      B.fact('fx', { kind: 'blast', model: 'bc1', x: 20.15, z: 14.4, atMs: ms - 10 }, house);
      const pop = measure(samplesOf('practicePop'), SR), whoof = measure(samplesOf('practiceWhoof'), SR);
      console.log(`      the gate ${SUIT_GATE_DB} dB, the protect ceiling ${fmt(ceiling)} dBFS at the master's input; ${rows.join(' | ')}`);
      console.log(`      all three at 1 m through the master: peak ${fmt(L.peakDb, 2)} dBFS (the clip ${fmt(20 * Math.log10(CLIP_LIMIT), 2)}); the pop ${fmt(pop.durS * 1000, 0)} ms, centroid ${fmt(pop.centroidHz, 0)} Hz; the whoof decay ${fmt(whoof.decayS * 1000, 0)} ms, centroid ${fmt(whoof.centroidHz, 0)} Hz; played: ${played.map(p => p.kind).join(', ')}`);
      assert(!bad.length, bad.join('; '));
      assert(L.peakDb <= 20 * Math.log10(CLIP_LIMIT) + 1e-6, `clipped: ${L.peakDb}`);
      assert(played.map(p => p.kind).join() === 'practicePop,practiceWhoof,bangReport', JSON.stringify(played));
      // (the whoof is low-passed noise, 250 and 450 Hz corners: its centroid under 800 Hz, a fifth of the pop's or less, and 300 ms long)
      assert(whoof.centroidHz < 800 && whoof.centroidHz < pop.centroidHz / 4 && whoof.decayS >= 0.25 && whoof.decayS <= 0.45, `the whoof: ${JSON.stringify(whoof)}`);
    },
  },
  {
    name: 'one quantity, one number (kit2 §2.9): in Mars\' surface air (0.6 kPa) a G-9P\'s burst 3 m off is about 40 dB down on the house\'s 66 kPa (its peak\'s ratio there and the air\'s), 0 dB in the house\'s own air; in vacuum only the floor\'s thump, low-passed at 120 Hz, within 5 m, nothing past it',
    fn() {
      const me = { x: 0, z: 0 }, at = { x: 3, z: 0 };
      const room = blastVoice({ me, at, model: 'g9p', soundMs: SOUND, pKpa: BLAST_REF_KPA }), mars = blastVoice({ me, at, model: 'g9p', soundMs: 240, pKpa: MARS_KPA });
      const down = room.gainDb - mars.gainDb;
      const vac3 = blastVoice({ me, at, model: 'g9p', soundMs: 0, pKpa: 0 }), vac6 = blastVoice({ me, at: { x: 6, z: 0 }, model: 'g9p', soundMs: 0, pKpa: 0 }), pin = kitVoice({ me, at: { x: 0.3, z: 0 }, srcDb: 0, soundMs: 0, pKpa: 0 });
      const zero = thinDb('g9p', 3, BLAST_REF_KPA), bc = thinDb('bc1', 3, MARS_KPA);
      console.log(`      the G-9P at 3 m: ${fmt(room.gainDb)} dB at 66 kPa, ${fmt(mars.gainDb)} dB at 0.6 kPa: ${fmt(down)} dB down (the peak's ratio ${fmt(thinDb('g9p', 3, MARS_KPA))} dB, the air's ${fmt(down + thinDb('g9p', 3, MARS_KPA), 1)}); the BC-1's peak at 3 m ${fmt(bc)} dB; in the house's air ${fmt(zero, 3)} dB; in vacuum at 3 m the thump ${fmt(vac3.gainDb)} dB < ${vac3.lowpassHz} Hz (${vac3.silent ? 'silent' : 'heard'}), at 6 m ${vac6.silent ? 'silent' : 'heard'}; the pin in vacuum ${pin.silent ? 'silent' : 'heard'}; the G-9P over the G-11 at 1 m ${fmt(sourceDb('g9p', 66))} dB`);
      assert(down >= 37 && down <= 43, `about 40 dB: ${down}`);
      assert(zero === 0 && vac3.thump && !vac3.silent && vac3.lowpassHz === THUMP_LP_HZ && vac6.silent && THUMP_M === 5 && pin.silent, JSON.stringify({ zero, vac3, vac6, pin }));
    },
  },
  {
    name: 'a breach round is the R-7\'s shot plus a steel strike (kit2 §6 test 36): a round whose target is a door is the blast presenter\'s too, the strike and the frangible\'s dust at the leaf, through the suit and under its gate; a round at a stand is not',
    fn() {
      const { played, engine } = recorder(), B = createBlast(engine);
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'cpl', setup: 'go', loadout: 'breach' }), s = g.state;
      const door = { kind: 'door', door: 'o:w4:closet', dM: 0.05 }, ms = s.clock.ms;
      const mine = B.ours('shot', { target: door, fired: true }, s), stand = B.ours('shot', { target: { kind: 'turner', key: 'turner:1' }, fired: true }, s), click = B.ours('shot', { target: door, fired: false }, s);
      B.fact('shot', { target: door, fired: true, atMs: ms }, s);
      const strike = played.find(p => p.kind === 'steelStrike'), dust = played.find(p => p.kind === 'dustHiss');
      const sm = measure(samplesOf('steelStrike'), SR);
      console.log(`      ours: a door's round ${mine}, a stand's ${stand}, a click at the door ${click}; played ${played.map(p => p.kind).join(', ')}; the strike ${fmt(strike?.gainDb)} dB < ${strike?.lowHz} Hz (peak ${fmt((strike?.gainDb ?? 0) + peakOf('steelStrike'))} dBFS), its centroid ${fmt(sm.centroidHz, 0)} Hz, decay ${fmt(sm.decayS * 1000, 0)} ms; the dust ${fmt(dust?.gainDb)} dB`);
      assert(mine && !stand && !click && strike && dust && strike.gainDb <= SUIT_GATE_DB && strike.lowHz <= 6000, JSON.stringify({ mine, stand, click, played }));
    },
  },
  {
    name: 'the pin, the lever, the floor\'s knock, the roll and the shock tube\'s snap are read off the sim\'s devices once a frame (kit2 §2.9): each played once at its moment, nothing played for a moment the clock passed more than 400 ms ago (a load, a skip)',
    fn() {
      const { played, engine } = recorder(), B = createBlast(engine);
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'cpl', setup: 'go', loadout: 'mixed' }), s = g.state, me = s.player.id;
      const id = (m) => Object.keys(s.items).find(k => s.items[k].model === m);
      const g9p = id('g9p'), bc1 = id('bc1'), t0 = s.clock.ms;
      const at = (ms) => { s.clock.ms = ms; B.frame(s); };
      at(t0);
      // (armed in the hand from the pouch, then thrown: the lever at the release, the landing 1.2 s on)
      s.items[g9p].st = 'armed'; s.people[me].kit.hands = [g9p, null]; at(t0 + 50);
      delete s.people[me].kit.hands;
      Object.assign(s.items[g9p], { st: 'live', fuseAtMs: t0 + 4400, flight: { x0: 29, y0: 1.4, z0: 13, vx: 0, vy: 4.755, vz: -3.5, g: 9.8, fromMs: t0 + 100, landMs: t0 + 1300, x1: 29, z1: 8.8 } });
      for (let ms = t0 + 100; ms <= t0 + 1500; ms += 50) at(ms);
      // (a charge fired: its fuse set)
      Object.assign(s.items[bc1], { st: 'primed', door: 'o:w4:r2', side: 'hinge', byId: me, fuseAtMs: t0 + 3000 });
      at(t0 + 1550);
      // (a skip: a landing 2 s ago is not played late)
      Object.assign(s.items[g9p], { flight: { ...s.items[g9p].flight, landMs: t0 + 2000 } });
      at(t0 + 4000);
      const kinds = played.map(p => p.kind), n = (k) => kinds.filter(x => x === k).length;
      console.log(`      played in order: ${kinds.join(', ')}; the knock ${fmt(played.find(p => p.kind === 'floorKnock')?.gainDb)} dB at ${fmt(B.stats.lastKit?.distM)} m last; counts ${JSON.stringify(B.stats.kit)}`);
      assert(n('pinClick') === 1 && n('leverSnap') === 1 && n('floorKnock') === 1 && n('rollRattle') === 1 && n('tubeSnap') === 1, kinds.join());
    },
  },
];
