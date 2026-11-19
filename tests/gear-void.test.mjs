// OLYMPUS tests: gear-void, F116's record half (the build sheet v0.0.24 §6 A, §8's F113 read three higher; AW§4.1 item 1): the gear
// record carries the mag boots and the anchor, what a viewer sees of a body held in free fall.
//
// src/sim/arms/gear.js gearOf gains `boots` (null | 'mag': mag boots worn, src/sim/body/footing.js bootsOf) and `anchor` (null |
// 'hold' | 'lanyard' | 'wedge' | 'buddy' | 'boots': footing.js gearAnchorOf, the actor's anchor checked against where he stands:
// a hold or a lanyard held only while the body is within FOOTING.SLIP_M of where it was taken, a buddy only within BUDDY_M), and
// gearKey adds them only when set, so every key of v0.0.18 to v0.0.23 is the same string. Two cases:
//   - a scripted course on the steel copy of house 1 under the holds' rule (tests/void-world.mjs; the rule as footing's suite lays
//     it), every tick: boots none, worn, locked, released; a hand on a hold, slipped off it by the keys' 0.1 m, the lanyard, let go;
//     the wedge; a teammate's brace on his locked boots, and out of his reach. The record's two fields, and the key's '|b:' and
//     '|a:' suffixes, equal the course's own script at every tick (D adds the figure's half: the stage's figure agreeing with the
//     record: the case D adds below, in Well A, the stage's figure (its look's boots, kitLook) and the stage's anchors (anchors.js
//     anchorsLook, drawn by render/range.js) against the record at every tick);
//   - the keys of every person on five shipped scenes (the house's lane by T, its live lane, "Bang", the bay at 23:00, "Pairs"),
//     sampled every 20 ticks over 400: their digest is the snapshot's (recorded on the stage-0 tree, before A), none carries a
//     suffix and every record's boots and anchor are null.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { golden } from './golden.mjs';
import { voidWorld, bootUp } from './void-world.mjs';
import { houseBot } from './bots/house.mjs';
import { gearOf, gearKey, GEAR_KEYS } from '../src/sim/arms/gear.js';
import { setAnchor } from '../src/sim/body/footing.js';
import { areaOf, registerArea, dropArea, holdNear } from '../src/sim/places/model.js';
import { FOOTING } from '../src/data/body/needs.js';
import { kitLook } from '../src/sim/arms/look.js';
import { anchorsLook, STATIONS } from '../src/sim/scenarios/anchors.js';
import { anchorHoldOf } from '../src/sim/body/footing.js';

const SEED = 48213;
/** The digest of the shipped scenes' gear keys (see the header), recorded on the stage-0 tree (v0.0.24's base, before A's merge). */
const KEYS_DIGEST = '0f092f7f7710a3';
/** The shipped scenes sampled: [what, createGame's options, the bot, ticks]. */
const SCENES = Object.freeze([
  ['the house by T', { scenario: 'test-shoothouse', tier: 'sgt', setup: 'go' }, 'T'],
  ['the live house', { scenario: 'test-shoothouse', opfor: 'live', tier: 'sgt', setup: 'go' }, 'T'],
  ['Bang', { scenario: 'test-stress' }, null],
  ['the bay at 23:00', { scenario: 'barracks', hour: 23 }, null],
  ['Pairs', { scenario: 'test-pairs' }, null],
]);
const TICKS = 400, EVERY = 20;
const NARROW = Object.freeze([32, 8.5]);

const meOf = (s) => s.actors.list.find(a => a.id === s.player.actor);
const suffix = (k) => ({ b: /\|b:(\w+)/.exec(k)?.[1] ?? null, a: /\|a:(\w+)/.exec(k)?.[1] ?? null });

export default [
  {
    name: 'gear-void (F116, the record): on a scripted course in free fall the gear record\'s boots and anchor, and gearKey\'s suffixes, are the course\'s own at every tick: boots worn, locked, released; a hand on a hold, slipped off, the lanyard, the wedge, a teammate\'s brace and out of his reach',
    fn() {
      const w = voidWorld({ boots: false }), g = w.g, s = w.s, pid = w.pid, two = w.twoPid, me = meOf(s), him = s.actors.list.find(a => a.who === two);
      const base = s.places.live.area, id = `${base}~holds`;
      registerArea({ ...areaOf(base), id, holds: { gridM: 1.5, padEyeM: 3, faces: true } });
      s.places.live.area = id;
      const bad = [], seen = [];
      let want = { boots: null, anchor: null }, ticks = 0;
      const check = (what) => {
        const r = gearOf(s, pid), k = gearKey(r), sf = suffix(k);
        if (r.boots !== want.boots || r.anchor !== want.anchor || sf.b !== want.boots || sf.a !== want.anchor || Object.keys(r).join() !== GEAR_KEYS.join()) bad.push(`${what} at ${s.clock.ms}: ${JSON.stringify({ boots: r.boots, anchor: r.anchor, key: k, want })}`);
        ticks++;
      };
      const run = (what, n, fn = null, next = want) => { fn?.(); want = next; seen.push(`${what}: ${JSON.stringify(want)}`); for (let i = 0; i < n; i++) { g.step(1); check(what); } };
      try {
        const pad = holdNear(s, me.x, me.z, 3, { kind: 'padEye' });
        run('bare', 10);
        run('boots worn', 10, () => bootUp(s, pid, { lock: false }), { boots: 'mag', anchor: null });
        run('locked', 10, () => assert(setAnchor(s, pid, 'boots').ok, 'lock'), { boots: 'mag', anchor: 'boots' });
        run('released', 10, () => setAnchor(s, pid, null), { boots: 'mag', anchor: null });
        run('a hand on a hold', 10, () => { me.x = pad.x + 0.3; me.z = pad.z; assert(setAnchor(s, pid, 'handhold').ok, 'hold'); }, { boots: 'mag', anchor: 'hold' });
        run('slipped 0.1 m off it', 10, () => { me.x += 0.1; }, { boots: 'mag', anchor: null });
        run('the lanyard', 10, () => { me.x -= 0.1; assert(setAnchor(s, pid, 'tether').ok, 'clip'); }, { boots: 'mag', anchor: 'lanyard' });
        run('let go', 10, () => setAnchor(s, pid, null), { boots: 'mag', anchor: null });
        run('the wedge', 10, () => { me.x = NARROW[0]; me.z = NARROW[1]; assert(setAnchor(s, pid, 'braced').ok, 'wedge'); }, { boots: 'mag', anchor: 'wedge' });
        run('a teammate\'s brace', 10, () => { setAnchor(s, pid, null); him.x = me.x; him.z = me.z + 0.7; bootUp(s, two, { lock: true }); assert(setAnchor(s, pid, 'buddy', { ref: two }).ok, 'buddy'); }, { boots: 'mag', anchor: 'buddy' });
        run('out of his reach', 10, () => { him.z = me.z + FOOTING.BUDDY_M + 0.3; }, { boots: 'mag', anchor: null });
        const his = gearOf(s, two);
        console.log(`      ${ticks} ticks over the course: ${seen.join('; ')}`);
        console.log(`      the #2 on his boots: ${JSON.stringify({ boots: his.boots, anchor: his.anchor })}, key …${gearKey(his).slice(-12)}; ${bad.length} ticks differing`);
        assert(!bad.length, bad.slice(0, 4).join('\n'));
        assert(his.boots === 'mag' && his.anchor === 'boots', JSON.stringify(his));
      } finally { s.places.live.area = base; dropArea(id); }
    },
  },
  {
    name: 'gear-void (F116, the record): every person\'s gear key on five shipped scenes, every 20 ticks over 400, is the snapshot\'s string (its digest recorded before A); no key carries the boots\' or the anchor\'s suffix and every record\'s boots and anchor are null',
    fn() {
      const keys = [], bad = [];
      for (const [what, o, bot] of SCENES) {
        const g = createGame({ seed: SEED, ...o }), b = bot ? houseBot({ mode: bot }) : null;
        let n = 0;
        for (let t = 0; t <= TICKS; t += EVERY) {
          if (t) g.step(EVERY, b);
          const s = g.state;
          for (const pid of Object.keys(s.people ?? {}).sort()) {
            const r = gearOf(s, pid);
            if (!r) continue;
            const k = gearKey(r);
            keys.push(`${what}|${t}|${pid}|${k}`); n++;
            if (r.boots !== null || r.anchor !== null || /\|[ba]:/.test(k)) bad.push(`${what} ${pid}: ${k}`);
          }
        }
        console.log(`      ${what.padEnd(17)} ${n} keys`);
      }
      const d = golden('gear-void: the shipped scenes\' gear keys', keys.join('\n'), KEYS_DIGEST);
      console.log(`      ${keys.length} keys in all, digest ${d}`);
      assert(!bad.length, bad.slice(0, 4).join('\n'));
    },
  },
  // (v0.0.24 D: the figure's half)
  {
    name: 'gear-void (F116, the figure): on a scripted course in Well A every tick, the stage draws what the record says: the mag boots on your figure (look.js kitLook, the figure\'s look) exactly when gear.boots is \'mag\', and the hand on a hold, the lanyard and the wedge (anchors.js anchorsLook\'s anchors, render/range.js) exactly when gear.anchor is that one, the hold drawn the one the hand is on',
    fn() {
      const g = createGame({ scenario: 'test-anchors', seed: SEED }), s = g.state, pid = s.player.id, me = meOf(s), bad = [], seen = [];
      const marks = Object.fromEntries(STATIONS.map(x => [x.id, x.mark]));
      let ticks = 0;
      const check = (what) => {
        const r = gearOf(s, pid), k = kitLook(s, pid), A = (anchorsLook(s)?.anchors ?? []).filter(x => x.who === pid);
        const drawnBoots = k.boots ?? null, drawnAnchor = A.length === 1 ? A[0].kind : A.length ? 'two' : null;
        const want = ['hold', 'lanyard', 'wedge'].includes(r.anchor) ? r.anchor : null;
        if (drawnBoots !== r.boots || drawnAnchor !== want) bad.push(`${what} at ${s.clock.ms}: drawn ${JSON.stringify({ drawnBoots, drawnAnchor })}, the record ${JSON.stringify({ boots: r.boots, anchor: r.anchor })}`);
        if (want && want !== 'wedge') { const h = anchorHoldOf(s, pid); if (!h || A[0].hold?.x !== h.x || A[0].hold?.z !== h.z) bad.push(`${what}: the hold drawn ${JSON.stringify(A[0].hold)} not the hand's ${JSON.stringify(h)}`); }
        ticks++;
      };
      const run = (what, n, fn = null) => { fn?.(); const r = gearOf(s, pid); seen.push(`${what}: ${r.boots ?? '-'}/${r.anchor ?? '-'}`); for (let i = 0; i < n; i++) { g.step(1); check(what); } };
      run('the start, boots locked', 20);
      run('released', 20, () => setAnchor(s, pid, null));
      run('the lanyard', 20, () => { Object.assign(me, { x: marks.lanyard[0], z: marks.lanyard[1] }); assert(setAnchor(s, pid, 'tether').ok, 'clip'); });
      run('let go', 20, () => setAnchor(s, pid, null));
      run('a hand on a hold', 20, () => { Object.assign(me, { x: marks.onehand[0], z: marks.onehand[1] }); assert(setAnchor(s, pid, 'handhold').ok, 'hold'); });
      run('slipped off it', 20, () => { me.x += 0.3; });
      run('the wedge', 20, () => { Object.assign(me, { x: marks.wedge[0], z: marks.wedge[1] }); setAnchor(s, pid, null); assert(setAnchor(s, pid, 'braced').ok, 'wedge'); });
      run('floating', 20, () => setAnchor(s, pid, null));
      run('boots again', 20, () => { Object.assign(me, { x: marks.boots[0], z: marks.boots[1] }); assert(setAnchor(s, pid, 'boots').ok, 'boots'); });
      const cadre = s.armoury.range.coachId;
      console.log(`      ${ticks} ticks: ${seen.join('; ')}; the cadre's boots drawn ${kitLook(s, cadre).boots}, his record ${gearOf(s, cadre).boots}; ${bad.length} ticks differing`);
      assert(!bad.length, bad.slice(0, 4).join('\n'));
      assert(kitLook(s, cadre).boots === 'mag' && gearOf(s, cadre).boots === 'mag', 'the cadre');
    },
  },
];
