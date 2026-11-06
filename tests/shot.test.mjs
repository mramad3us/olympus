// The shot (src/sim/arms/shot.js, paper.js; WEAPONS §7, §11.1): the DC, every modifier this scene sees, the odds, the plaque against the roll, tradecraft's formulas.
// Tradecraft's numbers (874, 2087, 2792 ms; 416 ms; the climb and the taps) come from its own
// shooting.js's formulas run in a scratch script with its pace (1.6 − 10/30 at value 10) and the M4's
// kind (sight 1.15, turn 0.85), pasted in (the build sheet 0.0.5 §5): no test imports ../tradecraft.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { oddsOf } from '../src/sim/skills/checks.js';
import { rangeDC, opticMod, dcOf, modsOf, aimS, fireMs, tapsOf, climbOf, plaqueOf, resolveShot, aimMsOf, pullMsOf, heldOf } from '../src/sim/arms/shot.js';
import { KD_RINGS, ringOf, holeOf, scoreOf } from '../src/sim/arms/paper.js';
import { targetsOf } from '../src/sim/arms/shooting.js';
import { startBody } from '../src/sim/body/body.js';
import { deltaOf } from '../src/sim/body/record.js';
import { setLedgers } from '../src/sim/scenarios/tests.js';
import { SITES } from '../src/data/setting/calendar.js';

const POS = { stand: 0, kneel: 2, prone: 4 };
/** The closed form of a string of five at a position: the expected score and the V share (KD_RINGS over the d20's twenty faces). */
export function stringOf(mrk, stance, held) {
  const sum = mrk + 1 + POS[stance] + (held ? 4 : 0), dc = 19;
  let pts = 0, v = 0;
  for (let face = 1; face <= 20; face++) {
    const ring = ringOf(face + sum - dc, face === 20 ? 20 : face === 1 ? 1 : 0);
    pts += ring?.score ?? 0; if (ring?.v) v++;
  }
  return { pts: pts / 20, v: v / 20 };
}
// (a scene at the line, hot, its player's sheet set to a Marksmanship and a Weapon handling)
export function hotGame({ seed = 48213, mrk = 10, wh = 10, stance = 'prone', setup = 'hot' } = {}) {
  const g = createGame({ scenario: 'test-handling', seed, hour: 9, setup });
  const s = g.state, p = s.people[s.player.id];
  p.skills = { cls: 'soldier', os: 0, skills: { ...p.skills.skills, marksmanship: [mrk, 0], weapons: [wh, 0], fitness: [10, 0] } };
  const me = g.me();
  if (stance === 'stand') delete me.stance; else me.stance = stance;
  return g;
}

export default [
  {
    name: 'rangeDC is round(5 log2(d / 10)) from 10 m; the 25 m card is DC 19 (6 + 0 + 0 + 7 + 6), its parts listed; the SO-4 at 1× +1 within 25 m',
    fn() {
      const at = [10, 15, 25, 50, 100, 200, 300, 400, 500, 600, 800, 1000];
      console.log(`      rangeDC: ${at.map(d => `${d} m ${rangeDC(d)}`).join(', ')}`);
      assert(at.map(rangeDC).join() === '0,3,7,12,17,22,25,27,28,30,32,33', at.map(rangeDC).join());
      const card = dcOf({ model: 'r7', rangeM: 25, paper: 'card25' }), torso = dcOf({ model: 'r7', rangeM: 300, part: 'torso' });
      console.log(`      the card: DC ${card.dc} (${card.parts.map(p => `${p.why} ${p.v}`).join(', ')}); a torso at 300 m: DC ${torso.dc}`);
      console.log(`      opticMod at 1×: 10 m ${opticMod(1, 10)}, 25 m ${opticMod(1, 25)}; at 4×: 10 m ${opticMod(4, 10)}, 100 m ${opticMod(4, 100)}, 300 m ${opticMod(4, 300)}`);
      assert(card.dc === 19 && torso.dc === 31 && opticMod(1, 25) === 1 && opticMod(4, 10) === -2 && opticMod(4, 300) === 5, JSON.stringify(card));
    },
  },
  {
    name: 'tradecraft\'s formulas: aimS with its pace (1.267 at value 10) and the M4\'s kind gives 874, 2087 and 2792 ms ahead, at 90° and behind; fireMs 416 ms at recoil 0.6; climbOf and tapsOf by Marksmanship; the R-7 from low ready at WH 10 0.87 s',
    fn() {
      const pace = 1.6 - 10 / 30;
      const ms = [0, 90, 180].map(t => Math.round(aimS({ pace, kindSight: 1.15, turnDeg: t, value: 10, kindTurn: 0.85 }) * 1000));
      const f = fireMs({ recoil: 0.6, pace });
      const mrk = [3, 7, 10, 15, 20, 30], climb = mrk.map(m => Number(climbOf(m).toFixed(2))), taps = mrk.map(tapsOf);
      const g = hotGame({ wh: 10, mrk: 10 }), s = g.state, pid = s.player.id;
      s.people[pid].kit.carry.posture = 'lowReady';
      const card = targetsOf(s, pid).find(t => t.key === `paper:${s.armoury.range.lane}`);
      const r7 = aimMsOf(s, pid, s.stop.gun, card), pull = pullMsOf(s, pid, s.stop.gun);
      console.log(`      aim ahead / 90° / behind: ${ms.join(', ')} ms (tradecraft's 874, 2087, 2792); fireMs ${f} ms (416)`);
      console.log(`      climbOf at MRK ${mrk.join(', ')}: ${climb.join(', ')}; tapsOf: ${taps.join(', ')}`);
      console.log(`      the R-7 from low ready at WH 10: the aim ${r7} ms (lived ${Math.ceil(r7 / 50) * 50}); the pull ${pull.ms} ms (lived ${Math.ceil(pull.ms / 50) * 50}), its recovery ${pull.recoverMs} ms`);
      assert(ms.join() === '874,2087,2792' && f === 416, JSON.stringify({ ms, f }));
      assert(climb.join() === '1.28,1.12,1,0.8,0.6,0.35' && taps.join() === '1,1,2,2,3,3', JSON.stringify({ climb, taps }));
      assert(Math.abs(r7 - 870) <= 1 && Math.ceil(r7 / 50) * 50 === 900 && Math.ceil(pull.ms / 50) * 50 === 400, JSON.stringify({ r7, pull }));
    },
  },
  {
    name: 'the odds at 25 m (the build sheet §4): standing, kneeling, prone, unheld and held to +4, by Marksmanship, exactly; the string of fifteen\'s expected score and the V\'s share in closed form',
    fn() {
      const T = {};
      for (const m of [6, 8, 10, 14]) for (const held of [false, true]) T[`${m}|${held}`] = ['stand', 'kneel', 'prone'].map(p => Math.round(oddsOf(m, 19, 1 + POS[p] + (held ? 4 : 0)) * 100));
      for (const m of [6, 8, 10, 14]) console.log(`      MRK ${String(m).padStart(2)}: ${T[`${m}|false`].join(', ')}% → held ${T[`${m}|true`].join(', ')}%`);
      const want = { '6|false': '45,55,65', '6|true': '65,75,85', '8|false': '55,65,75', '8|true': '75,85,95', '10|false': '65,75,85', '10|true': '85,95,95', '14|false': '85,95,95', '14|true': '95,95,95' };
      for (const [k, w] of Object.entries(want)) assert(T[k].join() === w, `${k}: ${T[k]}`);
      const strings = [6, 8, 10, 12, 14, 18].map(m => {
        const total = (held) => 5 * ['stand', 'kneel', 'prone'].reduce((a, p) => a + stringOf(m, p, held).pts, 0);
        return { m, held: total(true), unheld: total(false) };
      });
      console.log(`      a string of 15, held (unheld): ${strings.map(x => `MRK ${x.m} ${fmt(x.held)} of 75 (${fmt(x.unheld)})`).join(', ')}`);
      const sheet = { 6: [49.0, 34.5], 8: [55.0, 42.0], 10: [59.8, 49.0], 12: [63.5, 55.0], 14: [66.5, 59.8], 18: [70.3, 66.5] };
      for (const x of strings) assert(Math.abs(x.held - sheet[x.m][0]) < 0.06 && Math.abs(x.unheld - sheet[x.m][1]) < 0.06, JSON.stringify(x));
      const v = ['prone', 'kneel', 'stand'].map(p => Math.round(stringOf(10, p, true).v * 100));
      console.log(`      a V, a held shot at MRK 10: prone ${v[0]}%, kneeling ${v[1]}%, standing ${v[2]}%; the rings ${KD_RINGS.map(r => `${r.score}${r.v ? 'V' : ''} from ${r.from}`).join(', ')}`);
      assert(v.join() === '40,30,20', v.join());
    },
  },
  {
    name: 'every modifier this scene sees, in SKILLS\' order, the body\'s and the needs\' among them; the plaque equals the roll computed on the shooter\'s beliefs, here the true odds; the same rolls with holes drawn or not',
    fn() {
      const g = hotGame({ mrk: 10, wh: 10, stance: 'kneel' }), s = g.state, pid = s.player.id, gunId = s.stop.gun;
      const lon = SITES.melas.lonEDeg, p = s.people[pid];
      p.body = deltaOf(setLedgers(startBody(p, s.clock.ms, lon, s.meta.seed), { pressureH: 23 }));   // (a long day behind him: tired)
      const card = targetsOf(s, pid).find(t => t.key === `paper:${s.armoury.range.lane}`);
      const now = s.clock.ms;
      const show = (label, mods) => console.log(`      ${label.padEnd(26)} ${mods.map(m => `${m.v > 0 ? '+' : ''}${m.v} ${m.why} [${m.src}]`).join(', ') || 'none'}`);
      s.stop.aim.settledMs = now - 2000;
      show('kneeling, held 2 s:', modsOf(s, pid, { gunId, target: card, ms: now }));
      s.stop.aim.settledMs = now + 300;
      show('coming down from the last:', modsOf(s, pid, { gunId, target: card, ms: now }));
      show('a tap\'s follow-up, rushed:', modsOf(s, pid, { gunId, target: card, ms: now, follow: 1, tempo: 'rushed' }));
      g.me().stance = 'prone'; s.stop.aim.settledMs = now;
      const pl = plaqueOf(s, pid, { target: card, ms: now });
      show('prone, just aimed:', pl.mods);
      console.log(`      the plaque: ${pl.part} · ${pl.rangeText} · ${pl.oddsText} · next ${pl.next} (+4 in ${pl.held.toFullMs} ms), DC ${pl.dc} (${pl.dcParts.map(x => `${x.why} ${x.v}`).join(', ')})`);
      const needs = pl.mods.filter(m => String(m.src).startsWith('need') || String(m.src).startsWith('body'));
      // (the roll at the same moment, off safe: its DC and its list are the plaque's, so its odds are the plaque's)
      s.items[gunId].mode = 'semi';
      const before = JSON.stringify(pl.mods);
      const { shot } = resolveShot(s, g.bus, { pid, gunId, target: card });
      const roll = shot.roll;
      console.log(`      the roll: "${roll ? `${roll.roll} + ${roll.value} … = ${roll.total} against ${roll.dc}` : shot.why}", its list ${roll && JSON.stringify(roll.mods) === before ? 'the plaque\'s, term for term' : 'DIFFERENT'}; the true odds ${Math.round(oddsOf(roll.value, roll.dc, roll.mods) * 100)}%`);
      // (on a card the plaque's figure is the chance of a hole, the edge ring's margin −3 or better: the parity review's)
      console.log(`      on the card the plaque says ${Math.round(pl.odds * 100)}%, the chance of a hole (the roll's own pass at DC ${pl.dc}: ${Math.round(pl.rollOdds * 100)}%)`);
      assert(roll && JSON.stringify(roll.mods) === before && roll.dc === pl.dc && Math.abs(oddsOf(roll.value, roll.dc, roll.mods) - pl.rollOdds) < 1e-12 && Math.abs(oddsOf(roll.value, roll.dc - 3, roll.mods) - pl.odds) < 1e-12, JSON.stringify({ roll, pl }));
      assert(needs.length >= 1, `no body or need term reached the plaque: ${before}`);
      // (holes by hash: the same stream fired at a card and at a torso of the same range draws the same dice)
      const dice = (paper) => {
        const h = hotGame({ seed: 7, mrk: 10 }), t = targetsOf(h.state, h.state.player.id).find(x => x.key === `paper:${h.state.armoury.range.lane}`);
        const T = paper ? t : { ...t, kind: 'person', paper: null, key: 'a99' };
        const out = [];
        h.state.items[h.state.stop.gun].mode = 'semi';
        for (let i = 0; i < 5; i++) { const r = resolveShot(h.state, h.bus, { pid: h.state.player.id, gunId: h.state.stop.gun, target: T }).shot; out.push(r.roll?.roll ?? r.why); }
        return out;
      };
      const a = dice(true), b = dice(false);
      console.log(`      five pulls at the card: d20s ${a.join(', ')}; the same at a torso, no holes: ${b.join(', ')}`);
      assert(a.join() === b.join(), 'a hole moved the dice');
      const holes = [0, 1, 2, 3].map(i => holeOf('card25', { margin: [14, 6, 0, -5][i], nat: 0 }, `sh${i + 1}`));
      console.log(`      holes at margins 14, 6, 0, −5: ${holes.map(h => `${JSON.stringify(h.at)} ${h.score}${h.v ? 'V' : ''} (${h.word})`).join('; ')}; scored ${JSON.stringify(scoreOf(holes))}`);
      assert(holes[0].v && holes[1].score === 4 && holes[2].score === 2 && holes[3].at === null && Math.hypot(...holes[0].at) <= 1.25, JSON.stringify(holes));
      void heldOf;
    },
  },
];
