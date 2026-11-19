// OLYMPUS tests: the plan view's ghost (the build sheet v0.0.22 §1 item 16, §6 D; the house lens's G4; v0.0.20's C6): a run kept by the page and drawn under the next on its house.
//
// Pure, in node: three lanes from GO on 48213 (the tier one by T, the private and the boot recruit by the keys), each made a ghost
// from debriefOf's model as the end card makes it. A ghost round-trips the trace within 0.01 m and 1 degree at every sample; the
// recruit's 92 s lane packs under GHOST_KB_MAX; the tier one's and the private's share a key (the same scene, seed, house and lane),
// and a drawn house, a setup, a loadout, the role-players or derived plans each make another; a trace that starts 31.2 s after GO
// makes none; ghostDelta says the private 5.8 s behind the tier one at room 2's door (the lens's figure); past its end the ghost
// keeps its last place, ended; the page's list keeps GHOSTS_KEPT, newest first, never twice, never the run itself. Fails without
// house-ghosts.js. The quick cases play one lane (the tier one by T, about 1 s of CPU) and read the other keys from fill states;
// the round trip over three lanes and the private's delta are heavy (the A and D review: three lanes cost 3.1 to 3.2 s of CPU against
// the quick budget of 3 s × k).
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseBot, runHouse } from './bots/house.mjs';
import { debriefOf } from '../src/sim/scenarios/house-debrief.js';
import { ghostKeyOf, ghostOf, ghostAt, ghostDelta, keepGhost, ghostsFor, forgetGhosts, ghostWords, deltaWords, GHOSTS_KEPT, GHOST_KB_MAX, GHOST_FROM_GO_MS } from '../src/ui/cards/house-ghosts.js';

const REC = { id: 'test-shoothouse' };
const lanes = new Map();
function lane(tier, mode, o = {}) {
  const k = `${tier}|${mode}|${JSON.stringify(o)}`;
  if (lanes.has(k)) return lanes.get(k);
  const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier, setup: 'go', ...o });
  runHouse(g, houseBot({ mode }));
  const s = g.state, d = debriefOf(s), key = ghostKeyOf(REC, s), G = ghostOf(d, { key, label: tier, sheet: tier });
  const out = { s, d, key, G };
  lanes.set(k, out);
  return out;
}

export default [
  {
    name: 'a ghost round-trips the trace within 0.01 m and 1 degree at every sample, and the boot recruit\'s 92 s lane packs under GHOST_KB_MAX',
    heavy: true,
    fn() {
      const rows = [];
      for (const [tier, mode] of [['tierone', 'T'], ['private', 'keys'], ['recruit', 'keys']]) {
        const { d, G } = lane(tier, mode), tr = d.tracks;
        assert(G, `${tier}: no ghost`);
        let worstM = 0, worstDeg = 0, n = 0;
        for (let i = 0; i < tr.ms.length; i++) {
          if (tr.ms[i] < d.goAtMs || tr.me[i * 5] === null) continue;
          const at = ghostAt(G, tr.ms[i] - d.goAtMs);
          worstM = Math.max(worstM, Math.abs(at.me[0] - tr.me[i * 5]), Math.abs(at.me[1] - tr.me[i * 5 + 1]), ...(tr.two[i * 5] !== null && at.two ? [Math.abs(at.two[0] - tr.two[i * 5]), Math.abs(at.two[1] - tr.two[i * 5 + 1])] : []));
          worstDeg = Math.max(worstDeg, Math.abs(((at.me[2] - (tr.me[i * 5 + 2] ?? 0)) % 360 + 540) % 360 - 180));
          n++;
        }
        const kb = G.b64.length / 1024;
        rows.push({ tier, laneS: G.laneMs / 1000, n, step: G.step, kb, worstM, worstDeg });
        console.log(`      ${tier} by ${mode}: lane ${(G.laneMs / 1000).toFixed(1)} s, ${G.n} samples (every ${G.step}), ${kb.toFixed(1)} KB of ${GHOST_KB_MAX}; round trip worst ${worstM.toFixed(4)} m, ${worstDeg.toFixed(2)} degrees over ${n} samples`);
      }
      assert(rows.every(r => r.worstM <= 0.0101 && r.worstDeg <= 1 && r.kb <= GHOST_KB_MAX && r.step === 1), JSON.stringify(rows));
      const rec = rows.find(r => r.tier === 'recruit');
      assert(rec.laneS > 85, `the recruit's lane is ${rec.laneS} s`);
    },
  },
  {
    name: 'one key for two runs on one seed and house (the tier one played, the private at GO), another for a drawn house, a setup, a loadout, the role-players or derived plans; a trace from 31.2 s makes no ghost',
    fn() {
      const other = (o) => { const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', ...o }); return ghostKeyOf(REC, g.state); };
      const a = lane('tierone', 'T'), b = { key: ghostKeyOf(REC, createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'go' }).state) };
      const drawn = other({ setup: 'go', draw: 'drawn' }), room2 = other({ setup: 'room:2' }), flash = other({ setup: 'go', loadout: 'flash' });
      const live = ghostKeyOf({ id: 'test-shoothouse-live' }, createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go', opfor: 'live' }).state);
      const gd = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go' });
      gd.state.armoury.range.house.plans = 'derived';
      const derived = ghostKeyOf(REC, gd.state), brief = ghostKeyOf(REC, createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private' }).state);
      const keys = { a: a.key, b: b.key, brief, drawn, room2, flash, live, derived };
      console.log(`      keys: ${Object.entries(keys).map(([k, v]) => `${k} ${v}`).join('; ')}`);
      const others = [drawn, room2, flash, live, derived];
      assert(a.key === b.key && brief === a.key && others.every(k => k !== a.key) && new Set(others).size === others.length, JSON.stringify(keys));
      const late = { ...a.d, from: a.d.goAtMs + 31_200 }, edge = { ...a.d, from: a.d.goAtMs + GHOST_FROM_GO_MS };
      const none = ghostOf(late, { key: a.key }), ok = ghostOf(edge, { key: a.key });
      console.log(`      a trace from 31.2 s: ${none === null ? 'no ghost' : 'A GHOST'}; from ${GHOST_FROM_GO_MS} ms: ${ok ? 'a ghost' : 'NONE'}`);
      assert(none === null && ok !== null, 'the trace\'s start');
    },
  },
  {
    name: 'ghostDelta: the private 5.8 s behind the tier one at room 2\'s door on 48213 (the house lens\'s figure)',
    heavy: true,
    fn() {
      const t1 = lane('tierone', 'T'), pv = lane('private', 'keys');
      const legs = pv.d.legs.map((L, k) => ({ k, word: L.word, at: L.fromMs, d: ghostDelta(pv.d, t1.G, L.fromMs) }));
      console.log(`      the private against the tier one's ghost at each leg's start: ${legs.map(L => `${L.word} ${deltaWords(L.d)}`).join(', ')}`);
      const r2 = legs[1].d;
      assert(Number.isFinite(r2) && Math.abs(r2 - 5800) <= 150, JSON.stringify(legs));
    },
  },
  {
    name: 'the ghost past its end keeps its last place, ended',
    fn() {
      const t1 = lane('tierone', 'T');
      const end = ghostAt(t1.G, t1.G.laneMs + 30_000), last = ghostAt(t1.G, t1.G.laneMs);
      console.log(`      the tier one's ghost 30 s past its end: ${end.me.map(v => v.toFixed(2)).join(', ')} ended ${end.ended} (at its end ${last.me.map(v => v.toFixed(2)).join(', ')})`);
      assert(end.ended && end.me[0] === last.me[0] && end.me[1] === last.me[1] && !last.ended, JSON.stringify({ end, last }));
    },
  },
  {
    name: 'the page keeps GHOSTS_KEPT ghosts, newest first, a ghost once, never offering a run its own',
    fn() {
      forgetGhosts();
      // (the private's run stands in as a ghost of its own on the same key: the list keys on identity, never on the trace)
      const t1 = lane('tierone', 'T'), pv = { key: t1.key, G: { ...t1.G, label: 'private', sheet: 'private', laneMs: t1.G.laneMs + 33_000 } };
      const mine = keepGhost(pv.G), again = keepGhost(pv.G);
      const first = ghostsFor(pv.key, { not: mine });
      const t = keepGhost(t1.G), list = ghostsFor(pv.key, { not: t });
      for (let i = 0; i < GHOSTS_KEPT + 2; i++) keepGhost({ ...t1.G, laneMs: t1.G.laneMs + i + 1 });
      const all = ghostsFor(t1.key);
      console.log(`      kept the private's twice: ${again === mine ? 'once' : 'TWICE'}; offered to it: ${first.length}; to the tier one's card: ${list.map(ghostWords).join(', ')}; after ${GHOSTS_KEPT + 2} more: ${all.length} kept`);
      assert(again === mine && first.length === 0 && list.length === 1 && list[0] === mine && all.length === GHOSTS_KEPT && all[0].laneMs === t1.G.laneMs + GHOSTS_KEPT + 2, 'the list');
      forgetGhosts();
    },
  },
];
