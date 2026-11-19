// OLYMPUS tests: the portrait is the man as you see him, posed and turned (the build sheet v0.0.23 items 4 and 5, F90; the user's note of 2026-11-17).
//
// "the portraits need to be more dynamic and show us what we would be seeing, including what they are holding" (the user, 2026-11-17).
// On v0.0.22 the card drew every man standing front on with one hold, whatever the stage drew: the doll's key was his gear's, so a
// role-player aiming, kneeling, sitting ruled out or with his hands up drew the one card. Now the card is painted from the Seen record
// (src/sim/people/seen.js seenOf: his hold, his pose, his facing from your eye) by src/art/doll/portrait.js. On the live lane (the tier
// one by the honest bot, 48213, live:hide,give: 2a hides, aims from the knee and sits ruled out, 3a aims and gives up) every
// (how, pose, facing, aimAt) the record takes is painted and each is its own doll; aimed at you is not the low ready. A man turned
// 150° from your eye is drawn from behind (A's back.js: no gun in his hands drawn, the marks' anchors within a pixel of the front's),
// 90° front on with his head turned (a doll of its own). You on the C card as in a mirror: kneeling on the bay with your carry,
// prone at the bench (Y-p, end on behind the rifle), a G-11 in the fist on the house's lane, the P-12 drawn at the low ready. Prints
// what the lane gave and the dolls' digests.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseHonestBot, runHouse } from './bots/house.mjs';
import { seenOf } from '../src/sim/people/seen.js';
import { paintPortrait, PORTRAIT_POSES, PORTRAIT_FACING } from '../src/art/doll/portrait.js';
import { DOLL_SCALE } from '../src/art/doll/doll.js';
import { move, pistolOf } from '../src/sim/arms/kit.js';
import { hash } from '../src/core/hash.js';

const NEAR = { pxPerM: 96 };
const digest = (pm) => hash(Array.from(pm.data).join(',')).toString(16);
const heldPx = (P) => P.held.reduce((a, v) => a + v, 0);
const sig = (r) => `${r.hold.how}${r.hold.act ? `/${r.hold.act}` : ''} ${r.pose} ${r.facing} ${r.aimAt ?? '-'}`;
const person = (s, who) => ({ look: s.people[who]?.look ?? {}, sex: s.people[who]?.sex ?? 'm' });
const actorOf = (s, who) => s.actors.list.find(a => a.who === who);

export default [
  {
    name: 'on the live lane (the tier one, 48213, live:hide,give) the role-players\' cards take every hold, pose and facing the record gives, each its own doll: aimed at you standing and from the knee, kneeling, sitting ruled out, hands up; aimed is not the low ready (v0.0.22: one doll a man)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go', opfor: 'live:hide,give' });
      const first = new Map(), counts = new Map();
      const r = runHouse(g, houseHonestBot(), { each(game) {
        const s = game.state;
        for (const T of s.armoury.range.turners.filter(t => t.live?.who)) {
          const rec = seenOf(s, T.live.who);
          if (!rec) continue;
          const k = sig(rec);
          counts.set(k, (counts.get(k) ?? 0) + 1);
          if (!first.has(k)) first.set(k, { rec: structuredClone(rec), person: person(s, T.live.who), stand: T.stand, ms: s.clock.ms - s.armoury.range.house.goAtMs });
        }
      } });
      assert(r.done, 'the lane reaches its card');
      const dolls = new Map();
      for (const [k, v] of first) dolls.set(k, digest(paintPortrait(v.rec, v.person, NEAR).pm));
      for (const [k, v] of first) console.log(`      ${v.stand} ${k.padEnd(28)} ${String(counts.get(k)).padStart(5)} ticks, first ${(v.ms / 1000).toFixed(2)} s after GO, doll ${dolls.get(k)}`);
      const has = (re) => [...first.keys()].some(k => re.test(k));
      const need = { 'aimed at you, standing': /^rifle-aim stand \w+ you$/, 'aimed at you, kneeling': /^rifle-aim kneel \w+ you$/, kneeling: /^rifle-low kneel/, 'sitting ruled out': /^rifle-low sit/, 'hands up': /^up stand/ };
      const missing = Object.entries(need).filter(([, re]) => !has(re)).map(([n]) => n);
      assert(!missing.length && PORTRAIT_POSES, `never met: ${missing.join(', ')}`);
      // (two different signatures, two different dolls: by the drawn fields (the aim's side drawn as one where the pick draws it so))
      const byDoll = new Map();
      for (const [k, d] of dolls) (byDoll.get(d) ?? byDoll.set(d, []).get(d)).push(k);
      const shared = [...byDoll.values()].filter(ks => ks.length > 1 && new Set(ks.map(x => x.replace(/ (you|away|-)$/, ''))).size > 1);
      assert(!shared.length, `one doll for two holds or poses: ${JSON.stringify(shared)}`);
      const aim = dolls.get([...first.keys()].find(k => /^rifle-aim stand front you$/.test(k))), low = dolls.get('rifle-low stand front -');
      assert(aim && low && aim !== low, JSON.stringify({ aim, low }));
      console.log(`      ${first.size} records, ${byDoll.size} dolls; aimed at you ${aim}, the low ready ${low}`);
    },
  },
  {
    name: 'a role-player turned 150° from your eye is drawn from behind (no gun in his hands drawn, the marks\' anchors within a pixel of the front\'s), and 90° front on with his head turned, a doll of its own (with PORTRAIT_FACING; v0.0.22 drew both front on)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go', opfor: 'live:fight,fight' }), s = g.state;
      const T = s.armoury.range.turners.find(t => t.live?.who && t.stand === '2a'), who = T.live.who, a = actorOf(s, who), me = actorOf(s, s.player.id);
      const toYou = Math.atan2(me.z - a.z, me.x - a.x), P = person(s, who), out = {};
      for (const [name, d] of [['front', 0], ['side', Math.PI / 2], ['back', 5 * Math.PI / 6]]) {
        a.headRad = toYou + d;
        const rec = seenOf(s, who, { fresh: true }), pm = paintPortrait(rec, P, NEAR);
        out[name] = { facing: rec.facing, how: rec.hold.how, key: rec.key, doll: digest(pm.pm), held: heldPx(pm), anchors: pm.anchors };
      }
      for (const [n, o] of Object.entries(out)) console.log(`      ${n.padEnd(5)} ${o.facing.padEnd(5)} ${o.how}: doll ${o.doll}, ${o.held} gun px, the A zone at ${o.anchors.aZone.map(v => v.toFixed(1)).join(', ')}`);
      assert(PORTRAIT_FACING && out.front.facing === 'front' && out.back.facing === 'back' && ['left', 'right'].includes(out.side.facing), JSON.stringify(out));
      assert(out.back.held === 0 && out.front.held > 0, `from behind the gun is hidden: ${out.back.held} px (front ${out.front.held})`);
      assert(new Set([out.front.doll, out.side.doll, out.back.doll]).size === 3 && new Set([out.front.key, out.side.key, out.back.key]).size === 3, 'three dolls, three keys');
      const off = Math.max(...['head', 'aZone'].map(k => Math.hypot(out.back.anchors[k][0] - out.front.anchors[k][0], out.back.anchors[k][1] - out.front.anchors[k][1]) / 96 * 72));
      assert(off <= 1, `the back's anchors ${off.toFixed(2)} doll px from the front's`);
    },
  },
  {
    name: 'you on the C card as in a mirror: kneeling on the bay with your carry, prone at the bench end on behind the rifle (Y-p), a G-11 in the fist, the P-12 drawn at the low ready; each its own doll, standing front on otherwise (the ask of 2026-11-15: "show the currently worn gear")',
    fn() {
      const rows = [], dolls = {};
      const mirror = (s, label, want) => {
        const pid = s.player.id, rec = seenOf(s, pid, { mirror: true }), P = paintPortrait(rec, person(s, pid), { scale: DOLL_SCALE });
        dolls[label] = digest(P.pm);
        rows.push(`${label.padEnd(10)} ${sig(rec).padEnd(26)} gun or device px ${String(heldPx(P)).padStart(4)}, the body set down ${(P.anchors.drop / DOLL_SCALE).toFixed(0)} rows, doll ${dolls[label]}`);
        for (const [k, v] of Object.entries(want)) assert(k === 'held' ? heldPx(P) > 0 : k === 'drop' ? P.anchors.drop > 0 : (k === 'how' ? rec.hold.how : rec[k]) === v, `${label}: ${k} ${JSON.stringify({ rec: sig(rec), held: heldPx(P), drop: P.anchors.drop })}`);
        assert(rec.facing === 'front', `${label} front on in the mirror`);
        return rec;
      };
      // (the bay: the 25 m line, standing, then kneeling as the stance step leaves you)
      const bay = createGame({ scenario: 'test-handling', seed: 48213 }), me = actorOf(bay.state, bay.state.player.id);
      const stand = mirror(bay.state, 'bay', { pose: 'stand' });
      me.stance = 'kneel';
      mirror(bay.state, 'kneeling', { pose: 'kneel', how: stand.hold.how, drop: true });
      // (the bench: prone on the line, Y-p)
      mirror(createGame({ scenario: 'test-handling', seed: 48213, setup: 'bench' }).state, 'prone', { pose: 'prone', held: true, drop: true });
      // (the house's lane with the flash kit: a G-11 from its pouch into the right hand)
      const h = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go', loadout: 'flash' }), hs = h.state, pid = hs.player.id;
      mirror(hs, 'lane', {});
      const g11 = Object.keys(hs.items).find(id => hs.items[id].model === 'g11'), hands = hs.people[pid].kit.hands ?? [];
      assert(g11 && !hands.some(Boolean), 'a G-11 issued, the hands free');
      move(hs, g11, { pid, hand: 0 });
      mirror(hs, 'G-11', { how: 'device', held: true });
      // (the P-12 drawn, on a lane of its own: in the right hand, the carry its own at the low ready)
      const p = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go' }).state, p12 = pistolOf(p, p.player.id);
      move(p, p12, { pid: p.player.id, hand: 0 }); p.people[p.player.id].kit.carry.posture = 'lowReady';
      mirror(p, 'P-12', { how: 'pistol-ready', held: true });
      for (const r of rows) console.log(`      ${r}`);
      assert(new Set(Object.values(dolls)).size === Object.keys(dolls).length, `each its own doll: ${JSON.stringify(dolls)}`);
    },
  },
];
