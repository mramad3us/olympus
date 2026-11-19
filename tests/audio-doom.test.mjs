// OLYMPUS tests: the shot the user picked, rebuilt (v0.0.24 F; the user, 2026-11-19, A4 starred: "If i had to pick only one it's
// the last one, however, I would use the R-7 wave for the P-12 and make the R-7 sound meaner, blunter, more bass heavy. less a
// "PAF" and more a "DOOM" if that makes sense."). A5 (src/data/sounds.js SHOT_CANDIDATES, every scene's: SHOT_DEFAULT and
// SHOT_HOUSE) is A4 with the P-12 voiced by A4's R-7 wave (gun.js gunWith's `waves`: the wave's blast and body, the gun's own
// crack, action and loudness) and the R-7 by R7_DOOM, through the electronics' band opened to 70 Hz for the rifle. Measured
// without anyone listening, as audio-gun does: the bass share and the brightness of the R-7 through the suit in the house against
// A4's, the house's loudness targets of v0.0.20 kept (the loudest 50 ms at least -11.0 dBFS, 10 ms -9.0, the peak at most -1.0),
// the pistol 2 to 4 dB under, a burst of twelve under the soft clip's 0.97, and the engine baking A5 at prepare. Quick; each
// case fails without A5.
import { assert, fmt } from './helpers.mjs';
import { gunBakes, gunWith, ownShot, shotKey, protectOf, GUNS, R7_DOOM, GUN_RATE_HZ, TAIL_RATE_HZ } from '../src/ui/audio/gun.js';
import { mixdown, master, levels, MASTER, CLIP_LIMIT } from '../src/ui/audio/mix.js';
import { SHOT_CANDIDATES, SHOT_DEFAULT, SHOT_HOUSE, shotFor } from '../src/data/sounds.js';
import { engineOn } from './audio-gun.test.mjs';

const SR = GUN_RATE_HZ, db = (v) => (v > 0 ? 20 * Math.log10(v) : -Infinity);
const loudest = (st, wS) => { const n = Math.round(wS * SR); let best = 0, s2 = 0; const e = (i) => (st.left[i] ** 2 + st.right[i] ** 2) / 2; for (let i = 0; i < st.left.length; i++) { s2 += e(i); if (i >= n) s2 -= e(i - n); if (i >= n - 1) best = Math.max(best, s2 / n); } return db(Math.sqrt(best)); };
// (the share of the energy under hz, a one-pole split, over a window; and a brightness: the mean slope over the mean level, in Hz)
function share(buf, hz, fromS, toS) { const a = Math.exp(-2 * Math.PI * hz / SR); let y = 0, lo = 0, all = 0; for (let i = Math.round(fromS * SR); i < Math.min(buf.length, toS * SR); i++) { y = (1 - a) * buf[i] + a * y; lo += y * y; all += buf[i] * buf[i]; } return lo / all; }
function bright(buf, fromS, toS) { let d = 0, x = 0; for (let i = Math.round(fromS * SR) + 1; i < Math.min(buf.length, toS * SR); i++) { d += Math.abs(buf[i] - buf[i - 1]); x += Math.abs(buf[i]); } return (d / x) * SR / (2 * Math.PI); }
const parts = new Map();
/** A candidate's house parts (own and the room's tail, protected), baked once. */
function houseParts(shot) {
  if (!parts.has(shot)) { const G = {}; for (const b of gunBakes(shot)) { if (!/:(own:p|tail:room:p)$/.test(b.key)) continue; const it = b.steps(0, GUN_RATE_HZ, TAIL_RATE_HZ); let r; do r = it.next(); while (!r.done); G[b.key] = r.value; } parts.set(shot, G); }
  return parts.get(shot);
}
/** n shots of a gun in the house through the suit and the master, 0.1 s apart: { left, right }. */
function inHouse(shot, gun, n = 1) {
  const G = houseParts(shot), vs = [];
  for (let i = 0; i < n; i++) for (const x of ownShot({ gun, space: 'room', prot: 'suit', pKpa: 66 }).voices) { const sm = G[shotKey(x.key, shot)]; vs.push({ samples: sm, sampleRate: sm.left ? TAIL_RATE_HZ : GUN_RATE_HZ, atS: 0.02 + 0.1 * i, gainDb: x.gainDb, lowHz: x.lowHz, pan: x.pan, rate: x.rate }); }
  return master(mixdown(vs, { durS: 0.8 + 0.1 * n }), MASTER);
}
const numbers = (m) => { const mono = m.left.map((v, i) => (v + m.right[i]) / 2); return { peak: levels(m).peakDb, w10: loudest(m, 0.01), w50: loudest(m, 0.05), bass: share(mono, 200, 0.02, 0.22), bright: bright(mono, 0.02, 0.12) }; };
const WAVE_KEYS = ['posMs', 'b', 'drive', 'durS', 'gas', 'gust', 'thump'];

export default [
  {
    name: 'the P-12 fires A4\'s R-7 wave (the user, 2026-11-19: "I would use the R-7 wave for the P-12"): under A5 its blast and body are the R-7\'s under A4, its crack, action and loudness its own',
    fn() {
      const p = gunWith('p12', 'A5'), r4 = gunWith('r7', 'A4'), p4 = gunWith('p12', 'A4');
      const same = WAVE_KEYS.filter(k => JSON.stringify(p[k]) === JSON.stringify(r4[k]));
      assert(same.length === WAVE_KEYS.length, JSON.stringify({ same, p: WAVE_KEYS.map(k => p[k]), r4: WAVE_KEYS.map(k => r4[k]) }));
      assert(p.crack === GUNS.p12.crack && p.mech === GUNS.p12.mech && p.loud === GUNS.p12.loud && JSON.stringify(p.gas) !== JSON.stringify(p4.gas), JSON.stringify({ crack: p.crack, loud: p.loud }));
      assert(protectOf('A5', 'p12').hpHz === protectOf('A4', 'r7').hpHz && protectOf('A5', 'r7').hpHz === 70, JSON.stringify({ p: protectOf('A5', 'p12'), r: protectOf('A5', 'r7') }));
      console.log(`      the P-12 under A5: blast ${p.posMs} ms (A4's P-12 ${p4.posMs}, A4's R-7 ${r4.posMs}), gas ${p.gas.decayMs} ms, gust ${p.gust.decayMs} ms ${p.gust.db} dB, thump ${p.thump.hz} → ${p.thump.toHz} Hz ${p.thump.decayMs} ms, ${p.durS} s; its crack ${p.crack.ms} ms and loudness ${p.loud} its own; the band from ${protectOf('A5', 'p12').hpHz} Hz (the rifle's ${protectOf('A5', 'r7').hpHz})`);
    },
  },
  {
    name: 'the R-7 rebuilt "less a PAF and more a DOOM": through the suit in the house its first 200 ms at least half under 200 Hz and its brightness at most 60% of A4\'s; the house\'s loudness targets held (50 ms ≥ -11.0, 10 ms ≥ -9.0, peak ≤ -1.0 dBFS); the P-12 2 to 4 dB under; twelve shots never past the soft clip',
    fn() {
      const a4 = numbers(inHouse('A4', 'r7')), a5 = numbers(inHouse('A5', 'r7')), p5 = numbers(inHouse('A5', 'p12'));
      const burst = levels(inHouse('A5', 'r7', 12));
      console.log(`      A4's R-7: peak ${fmt(a4.peak)}, 10 ms ${fmt(a4.w10)}, 50 ms ${fmt(a4.w50)} dBFS, ${Math.round(100 * a4.bass)}% under 200 Hz, brightness ${Math.round(a4.bright)} Hz`);
      console.log(`      A5's R-7: peak ${fmt(a5.peak)}, 10 ms ${fmt(a5.w10)}, 50 ms ${fmt(a5.w50)} dBFS, ${Math.round(100 * a5.bass)}% under 200 Hz, brightness ${Math.round(a5.bright)} Hz; its P-12 ${fmt(a5.w50 - p5.w50)} dB under over 50 ms; twelve shots peak ${fmt(burst.peakDb, 2)} dBFS (the clip ${fmt(db(CLIP_LIMIT), 2)})`);
      assert(a5.bass >= 0.5 && a4.bass <= 0.25 && a5.bright <= 0.6 * a4.bright, JSON.stringify({ a4, a5 }));
      assert(a5.w50 >= -11.0 && a5.w10 >= -9.0 && a5.peak <= -1.0, JSON.stringify(a5));
      assert(a5.w50 - p5.w50 >= 2 && a5.w50 - p5.w50 <= 4, JSON.stringify({ a5, p5 }));
      assert(burst.peakDb <= db(CLIP_LIMIT) + 1e-6, JSON.stringify(burst));
    },
  },
  {
    name: 'A5 is every scene\'s shot and the engine bakes it at prepare: its parts under A5/, the R-7 played from them at the start',
    fn() {
      const scenes = ['test-shoothouse', 'test-shoothouse-live', 'test-handling', 'test-range', 'test-pairs', 'test-stress', 'barracks'].map(id => shotFor(id));
      assert(SHOT_DEFAULT === 'A5' && SHOT_HOUSE === 'A5' && scenes.every(x => x === 'A5') && SHOT_CANDIDATES.A5.waves.r7 === 'r7doom' && GUNS.r7 !== R7_DOOM, JSON.stringify(scenes));
      const N = engineOn('new');
      const keys = gunBakes('A5').map(b => b.key);
      assert(N.audio.shot === 'A5' && keys.every(k => k.startsWith('A5/')) && keys.length === gunBakes('A1').length, JSON.stringify({ shot: N.audio.shot, n: keys.length }));
      console.log(`      every scene: ${[...new Set(scenes)].join()}; the engine plays ${N.audio.shot} after ${N.frames} bake frames (the longest ${fmt(N.worstMs, 1)} ms), ${keys.length} parts under A5/`);
    },
  },
];
