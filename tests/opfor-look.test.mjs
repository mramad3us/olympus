// OLYMPUS tests: the first live men's look (the build sheet 0.0.19 §1 L-look, §6; opfor §2.6, §5 "opfor-look"). A role-player of
// "Stack and clear, live" rides R.turners with `live` ({ who, st, fromMs, … }: opfor §2.1) and wears the force-on-force mask; when he
// gives up he drops his rifle to the floor and puts his hands up. These hold that the gear record says so and nothing else moves
// (GEAR_KEYS gains 'mask' and 'hands', every v0.0.18 key the same string), that the doll draws the mask and the hands, that the
// world figure has the hands frames without the base sheet growing, that the stage's look (rangeLook().house) gives each live man's
// frame and his rifle in his hands or on the floor, never neither, falling there rather than popping, that the plaque says the state
// read, and that a marking round's report is the gun's own, quieter and duller, with a slap where it strikes.
// THE STUB (until L-opfor's fill lands at the integration): a live man is made of the #2's own body on stand 2a's record, his
// rifle moved to the floor by kit.js move as opfor.js will, a mask item in kit.worn.mask; the record's shape is opfor §2.1's.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseKeysBot } from './bots/house.mjs';
import { gearOf, gearKey, GEAR_KEYS, standGear } from '../src/sim/arms/gear.js';
import { move } from '../src/sim/arms/kit.js';
import { rangeLook, FLOOR_FROM_M, FLOOR_FALL_MS } from '../src/sim/arms/look.js';
import { doll } from '../src/art/doll/doll.js';
import { MASK_LOOKS, HANDS_LOOKS } from '../src/art/doll/worn.js';
import { BANDS, POOL_OF, CARRY_FREE_BANDS, handsFrame, handsPose, poseOf } from '../src/art/figures/poses.js';
import { sheetLayout } from '../src/art/figures/atlas.js';
import { composeFrame } from '../src/art/figures/compose.js';
import { wear } from '../src/art/figures/outfits.js';
import { fofMaskTpl, FOF_MASKS, fofMaskFor, FOF_MASKS_WORN } from '../src/art/figures/helmets.js';
import { contactPixels, STATE_WORDS } from '../src/ui/plaque.js';
import { markingShot, slapVoice, isMarking, MARKING_DB, MARKING_LP_HZ } from '../src/ui/audio/marking.js';
import { ownShot } from '../src/ui/audio/gun.js';
import { dressOf } from '../src/art/doll/dress.js';
import { shapeKey } from '../src/art/figures/atlas.js';

const house = (tier = 'sgt') => createGame({ scenario: 'test-shoothouse', seed: 48213, tier, setup: 'go' });
// (the stub: the #2's body as the role-player on 2a's record (see the header))
function liveOn(g, { st = 'wait', drop = false, mask = true } = {}) {
  const s = g.state, R = s.armoury.range, who = R.house.two.pid, a = s.actors.list.find(x => x.who === who), T = R.turners.find(t => t.stand === '2a');
  T.live = { who, card: 'give', st, fromMs: s.clock.ms, cue: null, aimAt: null, eyes: null, eng: null, move: null, choice: null, seen: [], firstAtMs: null, fired: 0, ia: null, said: {} };
  if (mask) { s.items['i-mask-stub'] = { id: 'i-mask-stub', type: 'worn', model: 'fof-mask' }; s.people[who].kit.worn.mask = 'i-mask-stub'; }
  if (drop) { move(s, s.people[who].kit.worn.sling, { ground: { area: s.actors.area, x: a.x + 0.3, z: a.z } }); a.hands = true; }
  return { s, R, who, a, T };
}
const diff = (p, q) => { let n = 0; for (let i = 0; i < p.data.length; i++) if (p.data[i] !== q.data[i]) n++; return n; };

export default [
  {
    name: 'gearKey gains mask and nothing else moves: GEAR_KEYS gains mask and hands, every person of a v0.0.18 lane keys the same string (no mask, no hands), and the role-player\'s key gains "|m:fof" and, with his hands up and his rifle on the floor, "|h:up" with no rifle',
    fn() {
      const g = house(), s = g.state, keys = s.actors.list.filter(a => s.people[a.who]?.kit).map(a => [a.who, gearKey(gearOf(s, a.who))]);
      for (const [who, k] of keys) { const gr = gearOf(s, who); assert(gr.mask === null && gr.hands === null && !/\|[mh]:/.test(k), `${who}: ${k}`); assert(JSON.stringify(Object.keys(gr)) === JSON.stringify(GEAR_KEYS), Object.keys(gr).join()); }
      // (v0.0.18's ten, its fixer's 'devices' among them, and the two; v0.0.20 adds 'device' after them, the device in the hands:
      // the hunt of v0.0.18's look-2; v0.0.24 A adds 'boots' and 'anchor' after it, the void's, null on every shipped person)
      assert(JSON.stringify(GEAR_KEYS.slice(10, 12)) === '["mask","hands"]' && GEAR_KEYS.length === 15 && GEAR_KEYS[12] === 'device' && GEAR_KEYS.slice(13).join() === 'boots,anchor', GEAR_KEYS.join());
      assert(Object.keys(standGear('threat', 'rifle')).join() === GEAR_KEYS.join(), 'a board\'s keys');
      const { who } = liveOn(g), k1 = gearKey(gearOf(s, who)), k0 = keys.find(x => x[0] === who)[1];
      assert(k1 === `${k0}|m:fof`, `${k1} vs ${k0}`);
      const g2 = house(), L = liveOn(g2, { st: 'hands', drop: true }), gr2 = gearOf(L.s, L.who), k2 = gearKey(gr2);
      assert(gr2.hands === 'up' && gr2.rifle === null && k2.endsWith('|m:fof|h:up'), k2);
      console.log(`      ${keys.length} people on the lane, keys unchanged; the role-player ${k1}; hands up ${k2}`);
    },
  },
  {
    name: 'the doll draws the mask (M1 to M3, each its own, on the face only, never under a sealed helmet) and the hands up (H1 and H2: the arms bent up, the palms open over the fists), and the same doll without them is v0.0.18\'s to the pixel',
    fn() {
      const look = { outfit: 'carrier', skin: 0xb98a64, head: null, hair: { style: 'medium', color: 0x3a2a20 } };
      const base = { rifle: { model: 'r7', place: 'ready', mag: true }, pistol: null, carrier: { pouches: [{ key: 'p1', holds: 2, mags: 1 }] }, thigh: null, ears: null, held: null };
      const plain = doll({ look, scale: 1, gear: base }), again = doll({ look, scale: 1, gear: { ...base, mask: null, hands: null } });
      assert(diff(plain, again) === 0, 'a null mask and hands draw nothing');
      const rows = [], masks = Object.keys(MASK_LOOKS).map(id => doll({ look, scale: 1, gear: { ...base, mask: 'fof', maskLook: id } }));
      masks.forEach((pm, i) => {
        let low = 0, n = 0;
        for (let i2 = 0; i2 < pm.data.length; i2++) if (pm.data[i2] !== plain.data[i2]) { n++; if (Math.floor(i2 / pm.w) > 40) low++; }
        rows.push(`${Object.keys(MASK_LOOKS)[i]} ${n} px changed`);
        assert(n > 80 && low === 0, `mask ${i}: ${n} changed, ${low} below the head`);
      });
      for (let i = 0; i < masks.length; i++) for (let j = i + 1; j < masks.length; j++) assert(diff(masks[i], masks[j]) > 20, `masks ${i} and ${j} alike`);
      const suit = { outfit: 'combatSuit', skin: 0xb98a64, hair: { style: 'medium', color: 0x3a2a20 } };
      assert(diff(doll({ look: suit, scale: 1, gear: base }), doll({ look: suit, scale: 1, gear: { ...base, mask: 'fof' } })) === 0, 'no mask under the sealed helmet');
      const empty = { ...base, rifle: null };
      const bare = doll({ look, scale: 1, gear: empty });
      for (const id of Object.keys(HANDS_LOOKS)) { const n = diff(bare, doll({ look, scale: 1, gear: { ...empty, hands: 'up', handsLook: id } })); rows.push(`${id} ${n} px changed`); assert(n > 150, `${id}: ${n}`); }
      console.log(`      ${rows.join('; ')}`);
    },
  },
  {
    name: 'the world figure gains handsUp and handsKneel at the end of the arms band, carry-free, drawn with empty hands raised in every facing, the base sheet still 512 × 752 at 16 px/m and 768 × 1128 at 24; handsFrame names them by stance; the mask\'s templates fit the head box in every view',
    fn() {
      assert(BANDS.arms.at(-2) === 'handsUp' && BANDS.arms.at(-1) === 'handsKneel' && POOL_OF.arms === 'base' && CARRY_FREE_BANDS.includes('arms'), BANDS.arms.join());
      for (const [ppm, h] of [[16, 752], [24, 1128]]) { const L = sheetLayout(ppm); assert(L.w === 32 * ppm && L.h === h, `${ppm}: ${L.w} × ${L.h}`); }
      assert(handsFrame('kneel') === 'handsKneel' && handsFrame('stand') === 'handsUp' && handsFrame(undefined) === 'handsUp', 'by stance');
      const L = wear({ outfit: 'utilities', skin: 0xb98a64, hair: { style: 'medium', color: 0x3a2a20 }, seed: 3, weapon: null }), out = [];
      for (const f of ['handsUp', 'handsKneel']) {
        const p = poseOf(f);
        assert(p.rig === null && p.arms.r[1] > 2 && p.arms.l[1] > 2, `${f}: ${JSON.stringify(p.arms)}`);
        for (const dir of ['down', 'right', 'up', 'left']) { const fr = composeFrame(L, dir, f, { ppm: 24 }); const n = fr.cells.flat().filter(Boolean).length; out.push(n); assert(n > 100 && !fr.muzzle, `${f} ${dir}: ${n} cells`); }
      }
      assert(JSON.stringify(handsPose('H2').arms) !== JSON.stringify(handsPose('H1').arms), 'H1 and H2 differ');
      for (const id of Object.keys(FOF_MASKS)) for (const v of ['down', 'right', 'left', 'up']) { const t = fofMaskTpl(id, v, 15, 12); assert(t && t.rows.every(r => [...r].length === [...t.rows[0]].length) && t.x >= 0 && t.y + t.rows.length <= 12, `${id} ${v}: ${JSON.stringify(t)}`); }
      console.log(`      cells a frame (handsUp, handsKneel × down, right, up, left at 24 px/m): ${out.join(', ')}`);
    },
  },
  {
    name: 'the figure\'s frame is the role-player\'s state: rangeLook().house.men gives handsUp with his hands up (handsKneel kneeling), sitLow down with his rifle, none of its own while he aims (his rifle\'s), his rifle in his hands or on the floor, never neither; the floor rifle falls from his hands over FLOOR_FALL_MS, never a pop; the turner lane\'s house look has neither key',
    fn() {
      const g0 = house(), h0 = rangeLook(g0.state).house;
      assert(!('men' in h0) && !('floor' in h0), Object.keys(h0).join());
      const A = liveOn(house(), { st: 'aim' }), ha = rangeLook(A.s).house;
      assert(ha.men.length === 1 && ha.men[0].frame === null && ha.men[0].rifle === 'hands' && ha.floor.length === 0, JSON.stringify(ha.men));
      const D = liveOn(house(), { st: 'down' }); D.a.stance = 'sit';
      const hd = rangeLook(D.s).house.men[0];
      assert(hd.frame === 'sitLow' && hd.rifle === 'hands', JSON.stringify(hd));
      const H = liveOn(house(), { st: 'hands', drop: true }), t0 = H.s.clock.ms, ys = [];
      for (const dt of [0, 100, 200, FLOOR_FALL_MS, 1000]) { const h = rangeLook(H.s, t0 + dt).house; ys.push(h.floor[0].y); assert(h.men[0].frame === 'handsUp' && h.men[0].rifle === 'floor' && h.floor.length === 1, JSON.stringify(h.men)); }
      assert(ys[0] === FLOOR_FROM_M && ys.every((y, i) => i === 0 || y <= ys[i - 1]) && ys.at(-1) === 0 && ys.at(-2) === 0, ys.join());
      H.a.stance = 'kneel';
      assert(rangeLook(H.s, t0 + 2000).house.men[0].frame === 'handsKneel', 'kneeling');
      console.log(`      aiming: frame ${ha.men[0].frame}, rifle ${ha.men[0].rifle}; down: ${hd.frame}; hands up: rifle on the floor at y ${ys.join(', ')} m over ${FLOOR_FALL_MS} ms`);
    },
  },
  {
    name: 'the plaque says the state your take-in read after what it identified ("CONTACT · RIFLE · AIMING · TAKEN IN 0.80 S"), a stand\'s plate (no state) is v0.0.18\'s to the pixel',
    fn() {
      const a = contactPixels({ ms: 800, words: '0.80', ident: 'rifle' }), b = contactPixels({ ms: 800, words: '0.80', ident: 'rifle', state: null });
      assert(a.words === b.words && a.w === b.w && a.data.every((v, i) => v === b.data[i]), 'no state, the same plate');
      const rows = Object.keys(STATE_WORDS).map(st => contactPixels({ ms: 800, words: '0.80', ident: st === 'hands' ? 'hands' : 'rifle', state: st }).words);
      assert(rows[0] === 'CONTACT · RIFLE · AIMING · TAKEN IN 0.80 S' && rows.includes('CONTACT · HANDS UP · TAKEN IN 0.80 S'), rows.join(' | '));
      console.log(`      ${rows.join(' | ')}`);
    },
  },
  {
    name: 'a marking round\'s report is the gun\'s own voices MARKING_DB quieter with their top cut at MARKING_LP_HZ, played subsonic; its strike\'s slap falls off with the distance; a live round\'s report is untouched',
    fn() {
      const live = ownShot({ gun: 'r7', space: 'room', prot: 'suit', pKpa: 101.3, supersonic: true, lagS: 0 }), sub = ownShot({ gun: 'r7', space: 'room', prot: 'suit', pKpa: 101.3, supersonic: false, lagS: 0 });
      const m = markingShot(sub);
      assert(isMarking({ load: 'marking' }) && !isMarking({ load: 'frangible' }), 'the load');
      assert(m.voices.length === sub.voices.length && m.voices.every((v, i) => Math.abs(v.gainDb - (sub.voices[i].gainDb + MARKING_DB)) < 1e-9 && v.lowHz <= MARKING_LP_HZ && v.key === sub.voices[i].key), JSON.stringify(m.voices));
      assert(/ownSub/.test(m.voices[0].key) && !/ownSub/.test(live.voices[0].key), m.voices[0].key);
      const near = slapVoice({ me: { x: 0, z: 0 }, at: { x: 1, z: 0 }, pKpa: 101.3 }), far = slapVoice({ me: { x: 0, z: 0 }, at: { x: 6, z: 0 }, pKpa: 101.3 });
      assert(far.gainDb < near.gainDb && far.pan > 0, JSON.stringify({ near, far }));
      console.log(`      live ${live.gainDb.toFixed(1)} dB, marking ${m.gainDb.toFixed(1)} dB (lowpass ${Math.round(m.lowpassHz)} Hz); the slap at 1 m ${near.gainDb.toFixed(1)} dB, at 6 m ${far.gainDb.toFixed(1)} dB`);
    },
  },
  {
    name: 'with the lead\'s wiring (dress.js, outfits.js, compose.js, atlas.js: llook-outside.patch) the target card\'s doll wears the mask and shows the hands up, and the world figure wears the mask (its own composed frames, its own sheet key) while every look without one is as before',
    fn() {
      const g = { outfit: 'utilities', suit: null, carrier: { model: 'pc-m3', pouches: [{ key: 'p1', holds: 2, mags: 1 }] }, ears: null, rifle: null, pistol: null, thigh: null, held: null, painted: false, mask: 'fof', hands: 'up' };
      const args = dressOf(g, { look: { skin: 0xb98a64, head: null, hair: { style: 'medium', color: 0x3a2a20 } } });
      if (!args.gear?.mask) { console.log('      (dress.js does not pass the mask yet: the lead applies llook-outside.patch at the integration; nothing run)'); return; }
      assert(args.gear.mask === 'fof' && args.gear.hands === 'up', JSON.stringify(args.gear));
      const none = dressOf({ ...g, mask: null, hands: null }, { look: {} });
      assert(!('mask' in none.gear) && !('hands' in none.gear), 'absent when unset');
      const base = { outfit: 'carrier', skin: 0xb98a64, hair: { style: 'medium', color: 0x3a2a20 }, seed: 3, head: null }, L0 = wear(base), L1 = wear({ ...base, mask: true });
      // (v0.0.24: a mask set `true` is the man's own of M2 and M3 by his seed, helmets.js fofMaskFor, the user's "M2 and M3 are decent masks" of 2026-11-19)
      assert(L1.mask === fofMaskFor(3) && FOF_MASKS_WORN.includes(L1.mask) && !L0.mask && shapeKey(L1) !== shapeKey(L0) && shapeKey(L0) === shapeKey(wear(base)), `${shapeKey(L0)} / ${shapeKey(L1)}`);
      const rows = [];
      for (const dir of ['down', 'right', 'up']) {
        const a = composeFrame(L0, dir, 'idle0', { ppm: 24 }).cells, b = composeFrame(L1, dir, 'idle0', { ppm: 24 }).cells;
        let n = 0;
        for (let y = 0; y < a.length; y++) for (let x = 0; x < a[y].length; x++) if ((a[y][x]?.ch ?? null) !== (b[y][x]?.ch ?? null)) n++;
        rows.push(`${dir} ${n}`);
        assert(n >= 6, `${dir}: ${n} cells`);
      }
      console.log(`      the mask's cells on the figure at 24 px/m: ${rows.join(', ')}`);
    },
  },
  {
    name: 'on the real lane (the private, 48213, live:give,give): through the give\'s 600 ms his rifle is in his hands at low ready (his rifle\'s own frame), then at the drop it is first drawn near his hands\' height and falls over FLOOR_FALL_MS, never from his hands to the floor in one tick (the review of track L: the fall was timed from the give\'s start, so it popped)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'go', opfor: 'live:give,give' }), bot = houseKeysBot();
      const s = g.state, T = s.armoury.range.turners.find(t => t.stand === '2a'), rows = [];
      // (the live lane is L-opfor's fill and L-house's scene: without them (this role's worktree alone) a note and nothing run)
      if (!T.live) { console.log('      (no role-player on the lane: opfor.js\'s fill lands with L-opfor and L-house; nothing run)'); return; }
      let n = 0, gaveAt = null;
      while (!s.armoury.range.end && n++ < 20_000) {
        g.step(1, bot); g.clearFacts?.();
        if (T.live?.st === 'hands' && gaveAt === null) gaveAt = T.live.gaveAtMs ?? T.live.fromMs;
        if (gaveAt === null) continue;
        const h = rangeLook(s, s.clock.ms).house, m = h.men.find(x => x.key === T.key), f = h.floor.find(x => x.id === (T.live.rifleId ?? null));
        rows.push({ dt: s.clock.ms - gaveAt, frame: m?.frame ?? null, rifle: m?.rifle, posture: s.people[T.live.who].kit.carry?.posture ?? null, y: f ? f.y : null });
        if (f && f.y === 0) break;
      }
      const lowering = rows.filter(r => r.y === null), falling = rows.filter(r => r.y !== null), first = falling[0];
      const worst = falling.reduce((a, r, i) => (i ? Math.max(a, falling[i - 1].y - r.y) : a), 0);
      console.log(`      the give at +0: in his hands ${lowering.length} ticks (to +${lowering.at(-1)?.dt} ms; frames ${[...new Set(lowering.map(r => r.frame ?? 'his rifle\'s'))].join(',')}, postures ${[...new Set(lowering.map(r => r.posture))].join(',')}); on the floor from +${first?.dt} ms at y ${falling.map(r => r.y).join(', ')} m; the worst tick's fall ${worst.toFixed(3)} m`);
      assert(gaveAt !== null && lowering.length >= 10 && lowering.every(r => r.rifle === 'hands' && r.frame === null && r.posture === 'lowReady'), JSON.stringify(lowering.slice(0, 3)));
      assert(first && first.y >= FLOOR_FROM_M / 2 && worst <= FLOOR_FROM_M / 2 && falling.at(-1).y === 0 && falling.length >= FLOOR_FALL_MS / 50 - 1, JSON.stringify(falling));
      assert(falling.every(r => r.frame === 'handsUp' && r.rifle === 'floor'), JSON.stringify(falling.slice(0, 2)));
    },
  },
];
