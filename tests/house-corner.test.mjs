// OLYMPUS tests: your corner, a rule and a mark (the user, 2026-11-15: "I feel like there should be rigorous definition of which is our corner, because there is currently no indication at to where we're supposed to be looking when entering a room"; src/sim/combat/corner.js).
//
// Each fails without its part of the build: the rule's table for every door of house 1 (the door's kind, who turns which way and
// why, the corner, the point, the sector's arc) and its agreement with X4's authored plans and the drill's own looks; the rule on
// generated rooms from an opening and its rooms alone (a mirrored hinge, a pull door, a corner-fed door, an L, a doorway with no
// leaf); the DI's line at the stack naming the corner once a room on every sheet; the aid in the stage's look (from the read of the
// door, the sector from the entry, gone at domination, held longest for the boot recruit and briefest for the tier one) and its
// pixels; and (heavy) the aid drawn in the page, looked at.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { WHEEL_S4 } from '../src/data/places/wheel.js';
import { lanePlanOf } from '../src/sim/combat/room.js';
import { cornerTableOf, cornerRuleOf, doorKindOf, frameOf, inSectorOf, roomFromOpening, cornerWordsOf, screenWordsOf, aidK, aidHoldMs, AID_HOLD_MS, AID_FADE_MS, STRAIGHT_M, sectorWedgeOf } from '../src/sim/combat/corner.js';
import { cornerOf } from '../src/sim/combat/bundle.js';
import { walkWords } from '../src/sim/skills/instinct/cqb.js';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { houseLook, houseOf, cornerAidLook } from '../src/sim/scenarios/shoothouse.js';
import { rungOf } from '../src/sim/skills/templates.js';
import { cornerAidPixels, AID_MINE, AID_TWO, AID_SECTOR, AID_Y_M } from '../src/render/range-items.js';
import { CUT_H_M } from '../src/render/walls.js';
import { houseBot, houseTBot, runHouse } from './bots/house.mjs';

const RECTS = Object.fromEntries(WHEEL_S4.rooms.map(r => [r.id, r.rect]));
const OPEN = (id) => WHEEL_S4.openings.find(o => o.id === id);
const D = (r) => (r * 180 / Math.PI).toFixed(1);
const house = (tier, setup = 'go') => { const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier, setup }); return { g, s: g.state }; };
const brief = (r) => `#${r.slot} ${r.side}, ${r.turn === 'straight' ? 'straight in' : `turns ${r.turn}`} (${r.entry}), corner ${r.corner.hot ?? `(${r.corner.x}, ${r.corner.z})`}, point (${r.point.join(', ')}), sector ${D(r.sector.fromRad)}° to ${D(r.sector.toRad)}° (${r.sector.arcDeg}°)`;
// (a derived point's clearance inside its entered rect, m)
const clearIn = (rects, p) => Math.max(...rects.map(r => Math.min(p[0] - r[0], r[2] - p[0], p[1] - r[1], r[3] - p[1])));

export default [
  {
    name: 'the rule for every door of house 1 (corner.js): room 1 centre-fed, push, #1 crosses left behind the door; room 2 corner-fed on its hinge side, #1 hooks left along the door\'s wall, #2 straight in down the west wall; room 3 centre-fed with its far leg east, #1 hooks right by the room\'s shape; the hall a passage, each man down his own wall watching the far corner across',
    fn() {
      const { s } = house('private'), L = lanePlanOf(s), rows = [];
      const want = {
        'o:w4:r1': { kind: 'centre-fed', why: 'behind the door', one: ['left', 'left', 'cross', 'r1:nl'], two: ['right', 'right', 'hook', 'r1:nr'], words: 'left', screen: 'left' },
        'o:w4:r2': { kind: 'corner-fed', why: 'open side', one: ['left', 'left', 'hook', 'r2:ne'], two: ['right', 'straight', 'straight', 'r2:sw'], words: 'left', screen: 'right' },
        'o:w4:r3': { kind: 'centre-fed', why: 'shape', one: ['right', 'right', 'hook', 'r3:ne'], two: ['left', 'left', 'cross', 'r3:nw'], words: 'right', screen: 'right' },
        hall: { kind: 'passage', why: 'passage', one: ['right', 'straight', 'straight', 'hall:sw'], two: ['left', 'straight', 'straight', 'hall:nw'], words: 'the far left', screen: 'the far corner, bottom' },
      };
      for (const k of L.order) {
        const P = L.plans[k], K = doorKindOf(P), T = cornerTableOf(P), W = want[k], F = frameOf(P);
        rows.push(`${k.replace('o:w4:', '')}: ${K.kind}${K.fed ? ` (fed ${K.fed})` : ''}, ${P.swing?.words ?? 'no door'} #1 by ${T[0].why}; ${T.map(brief).join('; ')}`);
        assert(K.kind === W.kind && T[0].why === W.why && T.length === 2, JSON.stringify({ k, K, why: T[0].why }));
        for (const [r, w] of [[T[0], W.one], [T[1], W.two]]) assert([r.side, r.turn, r.entry, r.corner.hot].join() === w.join(), JSON.stringify({ k, slot: r.slot, got: [r.side, r.turn, r.entry, r.corner.hot], w }));
        assert(cornerWordsOf(T[0]) === W.words && T[0].words === W.words && screenWordsOf({ ...T[0], f: F.f, left: F.left }) === T[0].screen && T[0].screen === W.screen, JSON.stringify({ k, words: T[0].words, screen: T[0].screen }));
        // (agreement with the authored plan: #1's entry, each point on the side the rule turns him to (or within STRAIGHT_M of the
        // door's middle going straight), the plan's sector inside the arc, the drill's own corner look (bundle.js cornerOf) inside it)
        if (P.door) assert(T[0].entry === P.entry, JSON.stringify({ k, entry: T[0].entry, plan: P.entry }));
        for (const r of T) {
          const lat = F.to(r.point[0], r.point[1]).s, c = cornerOf(P, r.slot), bc = Math.atan2(c.z - r.point[1], c.x - r.point[0]);
          const sideOk = r.turn === 'straight' ? (P.door ? Math.abs(lat) <= STRAIGHT_M : Math.sign(lat) === (r.side === 'left' ? 1 : -1)) : Math.sign(lat) === (r.side === 'left' ? 1 : -1);
          assert(sideOk && r.pointFrom === 'plan', JSON.stringify({ k, slot: r.slot, lat, turn: r.turn }));
          assert(inSectorOf(r, P.sectors[r.slot - 1].yawRad) && inSectorOf(r, bc, 0.5) && r.sector.arcDeg > 0 && r.sector.arcDeg < 180, JSON.stringify({ k, slot: r.slot, sector: r.sector, yaw: P.sectors[r.slot - 1].yawRad, cornerOf: c.id }));
        }
      }
      // (the method's points where the plan authors them: room 1 and room 3 exactly COMBAT §25.7.3's, room 2's #1 short of it by design)
      const dev = L.order.flatMap(k => cornerTableOf(L.plans[k]).map(r => ({ k, slot: r.slot, dM: Math.hypot(r.derived[0] - r.point[0], r.derived[1] - r.point[1]) })));
      rows.push(`the method's points against the authored: ${dev.map(d => `${d.k.replace('o:w4:', '')}#${d.slot} ${fmt(d.dM, 2)} m`).join(', ')}`);
      console.log(`      ${rows.join('\n      ')}`);
      assert(dev.filter(d => d.k === 'o:w4:r1' || d.k === 'o:w4:r3').every(d => d.dM < 0.01), JSON.stringify(dev));
      // (cached by the frozen plan: the same table on a second read)
      assert(cornerTableOf(L.plans['o:w4:r1']) === cornerTableOf(lanePlanOf(s).plans['o:w4:r1']) && cornerRuleOf(L.plans['o:w4:r2'], 2).turn === 'straight', 'cache');
    },
  },
  {
    name: 'a generated room gets the rule from its opening and rooms alone (corner.js roomFromOpening): room 1\'s door hinged at its other end sends #1 across to the right; turned to open into the hall (a pull) he hooks to the latch side; a door 0.1 m off a side wall is corner-fed, #1 to the open side and #2 straight in; an L reaching 4 m further one way leads #1 there whatever the swing; a doorway with no leaf, #1 crosses',
    fn() {
      const o = OPEN('o:w4:r1'), rows = [];
      const gen = (opening, rects, side, ids) => { const P = roomFromOpening(opening, rects, side, ids); return { P, T: cornerTableOf(P), K: doorKindOf(P) }; };
      const cases = [
        { name: 'room 1 as built', ...gen(o, RECTS, 'w4.hall', ['w4.r1']), want: ['centre-fed', 'behind the door', 'left', 'cross', 'right', 'hook'] },
        { name: 'hinged at b', ...gen({ ...o, swing: { hinge: 'b', into: 1 } }, RECTS, 'w4.hall', ['w4.r1']), want: ['centre-fed', 'behind the door', 'right', 'cross', 'left', 'hook'] },
        { name: 'a pull', ...gen({ ...o, swing: { hinge: 'a', into: 0 } }, RECTS, 'w4.hall', ['w4.r1']), want: ['centre-fed', 'latch side', 'right', 'hook', 'left', 'cross'] },
        // (a door on a z line at x = 10, 0.1 m off the room's north wall, entered from the west: facing east, left is north)
        { name: 'corner-fed', ...gen({ id: 'g1', kind: 'door', axis: 'z', at: 10, a: 0.1, b: 1.0, rooms: ['w', 'e'], swing: { hinge: 'a', into: 1 } }, { w: [6, 0, 10, 5], e: [10, 0, 16, 5] }, 'w', ['e']), want: ['corner-fed', 'open side', 'right', 'hook', 'left', 'straight'] },
        // (room 1 with a leg 4 m east of its east wall: the shape leads, over the push door's hinge side)
        { name: 'an L', ...gen(o, { ...RECTS, leg: [31.5, 8, 35.5, 10] }, 'w4.hall', ['w4.r1', 'leg']), want: ['centre-fed', 'shape', 'right', 'hook', 'left', 'cross'] },
        { name: 'a doorway', ...gen({ ...o, kind: 'doorway', leaf: undefined, swing: undefined }, RECTS, 'w4.hall', ['w4.r1']), want: ['centre-fed', 'no leaf', 'left', 'cross', 'right', 'hook'] },
      ];
      for (const c of cases) {
        const got = [c.K.kind, c.T[0].why, c.T[0].side, c.T[0].entry, c.T[1].side, c.T[1].entry];
        rows.push(`${c.name}: ${c.K.kind}, #1 by ${c.T[0].why}; ${c.T.map(brief).join('; ')}`);
        assert(got.join() === c.want.join(), JSON.stringify({ name: c.name, got, want: c.want }));
        // (derived points: 0.4 m or more off every wall of the room they stand in; the two corners apart; each sector less than half a turn)
        for (const r of c.T) assert(r.pointFrom === 'derived' && clearIn(c.P.rects, r.point) >= 0.4 - 1e-9 && r.sector.arcDeg < 180 && r.corner.hot, JSON.stringify({ name: c.name, r }));
        assert(c.T[0].corner.hot !== c.T[1].corner.hot, JSON.stringify({ name: c.name }));
      }
      // (a push door's #1 takes the corner the leaf hides, named so by the room's hot spots)
      const behind = cases[1].P.hot.find(h => h.id === cases[1].T[0].corner.hot);
      console.log(`      ${rows.join('\n      ')}\n      hinged at b: #1's corner is "${behind.why}"`);
      assert(behind.why === 'behind the door', JSON.stringify(behind));
    },
  },
  {
    name: 'the DI\'s line at the stack names your corner, the rule\'s as the screen shows it, on every sheet ("Your corner: left." at room 1, "right" at rooms 2 and 3: room 2 is entered going south, the marine\'s left the screen\'s right, the play review of 2026-11-15), once a room over a whole lane by the keys and by T, and the walk in\'s words read the same rule',
    timeoutMs: 600000,
    fn() {
      const L = lanePlanOf(house('private').s);
      const ww = ['o:w4:r1', 'o:w4:r2', 'o:w4:r3'].map(k => walkWords(L.plans[k]).side);
      // (the screen's sides (corner.js screenWordsOf, 0.0.16): room 2 is entered going south, so the marine's left is the screen's right)
      assert(ww.join() === 'left,right,right', JSON.stringify(ww));
      const said = [];
      for (const tier of ['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone']) for (const [setup, word] of [['room:2', 'right'], ['room:3', 'right']]) {
        const { g, s } = house(tier, setup);
        g.step(1);
        const t = instinctNow(s)?.line?.text ?? '';
        if (setup === 'room:2') said.push(`${tier}: "${t}"`);
        assert(t.includes(`Your corner: ${word}.`), JSON.stringify({ tier, setup, t }));
      }
      const lanes = [];
      for (const [tier, mode] of [['recruit', 'keys'], ['private', 'keys'], ['cpl', 'T'], ['tierone', 'T']]) {
        const { g, s } = house(tier);
        let last = null;
        const by = {};
        const r = runHouse(g, mode === 'T' ? houseTBot() : houseBot({ mode }), { each: () => {
          const t = instinctNow(s)?.line?.text ?? null;
          if (t && t !== last && /Your corner:/.test(t)) (by[houseOf(s).cur] ??= []).push(t);
          last = t;
        } });
        lanes.push(`${tier} by ${mode}: ${[0, 1, 2, 3].map(i => `${i < 3 ? `room ${i + 1}` : 'the hall'} ${by[i]?.length ?? 0}`).join(', ')}`);
        assert(r.done && [0, 1, 2].every(i => by[i]?.length === 1) && !by[3], JSON.stringify({ tier, by, done: r.done }));
      }
      console.log(`      at room 2's stack: ${said.join('; ')}\n      the corner named, a lane: ${lanes.join('; ')}`);
    },
  },
  {
    name: 'the aid in the stage\'s look (shoothouse.js cornerAidLook): nothing before the stack or the read, your corner and point and your #2\'s from the read of the door (where nothing reads it, the boot recruit\'s from the stack, the others\' from the door\'s opening), your sector\'s wedge from your entry to the walls, gone at domination over AID_FADE_MS; held to domination for the boot recruit, AID_HOLD_MS by the rung above (the tier one 2.5 s)',
    timeoutMs: 600000,
    fn() {
      const rows = [];
      assert(aidK(1000, 2000, 999) === 0 && aidK(1000, 2000, 1500) === 1 && Math.abs(aidK(1000, 2000, 2000 + AID_FADE_MS / 2) - 0.5) < 1e-9 && aidK(1000, 2000, 2000 + AID_FADE_MS) === 0 && aidK(null, null, 5) === 0, 'aidK');
      assert(aidHoldMs(0) === Infinity && aidHoldMs(4) === 2500 && aidHoldMs(9) === 2500 && AID_HOLD_MS.every((v, i) => i === 0 || v < AID_HOLD_MS[i - 1]), JSON.stringify(AID_HOLD_MS));
      for (const [tier, mode] of [['recruit', 'keys'], ['private', 'keys'], ['cpl', 'T'], ['tierone', 'T']]) {
        const { g, s } = house(tier), H = houseOf(s), rung = rungOf(s, s.player.id, 'room');
        assert(cornerAidLook(s).marks.length === 0 && houseLook(s).aid.sector === null, 'nothing at GO');
        const seen = {};
        runHouse(g, mode === 'T' ? houseTBot() : houseBot({ mode }), { each: () => {
          const a = houseLook(s).aid, ms = s.clock.ms;
          for (const m of a.marks) { const e = (seen[m.room] ??= { m0: null, m1: null, s0: null, s1: null }); e.m0 ??= ms; e.m1 = ms; if (m.mine) e.mark = m; }
          if (a.sector) { const e = (seen[a.sector.room] ??= { m0: null, m1: null, s0: null, s1: null }); e.s0 ??= ms; e.s1 = ms; e.wedge = a.sector; }
        } });
        const legs = [...H.rooms, H.hall], plans = lanePlanOf(s).plans, out = [];
        for (const L of legs) {
          const P = plans[L.door], e = seen[L.room], r = cornerRuleOf(P, 1), hot = P.hot ?? [];
          const dom = Math.min(hot.every(h => L.covered[h.id]) ? Math.max(...hot.map(h => L.covered[h.id].atMs)) : Infinity, L.clearAtMs ?? Infinity);
          const start = L.door === 'hall' ? L.fromMs : H.read?.[L.door] ?? (rung === 0 ? L.stackAtMs : L.openAtMs);
          out.push(`${L.room.replace('w4.', '')} marks ${fmt((e.m0 - start) / 1000, 2)} to ${fmt((e.m1 - start) / 1000, 2)} s from ${H.read?.[L.door] ? 'the read' : L.door === 'hall' ? 'the leg' : rung === 0 ? 'the stack' : 'the door open (no read)'}, sector ${e.s0 === null ? 'none' : `${fmt((e.s0 - (L.door === 'hall' ? start : L.enteredAtMs)) / 1000, 2)} to ${fmt((e.s1 - (L.door === 'hall' ? start : L.enteredAtMs)) / 1000, 2)} s from ${L.door === 'hall' ? 'the leg' : 'the entry'}`}, domination ${fmt((dom - start) / 1000, 2)} s`);
          // (from the read; where nothing reads it, the stack for the boot recruit (rung 0), the door's opening above it (he skipped
          // the read: he learns it as the door opens); the hall's from the leg's start: within two ticks of it (a beat's record is
          // at its formula time, between ticks))
          assert(e && e.m0 >= start && e.m0 - start <= 100, JSON.stringify({ tier, room: L.room, e, start, read: H.read?.[L.door] }));
          // (the mark is the rule's: your corner and point)
          assert(e.mark.corner.x === r.corner.x && e.mark.corner.z === r.corner.z && e.mark.point.join() === r.point.join(), JSON.stringify({ mark: e.mark, r }));
          // (gone by domination plus the fade, and by the hold plus the fade from its start)
          assert(e.m1 <= dom + AID_FADE_MS && e.m1 <= e.m0 + aidHoldMs(rung) + AID_FADE_MS, JSON.stringify({ tier, room: L.room, e, dom }));
          if (L.door !== 'hall') assert(e.s0 === null || (e.s0 >= L.enteredAtMs && e.s1 <= dom + AID_FADE_MS), JSON.stringify({ tier, room: L.room, e, entered: L.enteredAtMs }));
          if (e.wedge) assert(e.wedge.x === r.point[0] && e.wedge.rays.every(p => P.rects.some(R => p[0] >= R[0] - 1e-6 && p[0] <= R[2] + 1e-6 && p[1] >= R[1] - 1e-6 && p[1] <= R[3] + 1e-6)), JSON.stringify(e.wedge));
          // (the boot recruit holds it to domination: marks there until it, the sector seen in every room)
          if (rung === 0 && L.door !== 'hall') assert(e.m1 >= Math.min(dom, s.clock.ms) - 50 && e.s0 !== null, JSON.stringify({ room: L.room, e, dom }));
        }
        rows.push(`${tier} (rung ${rung}, hold ${aidHoldMs(rung) === Infinity ? 'to domination' : `${aidHoldMs(rung) / 1000} s`}): ${out.join('; ')}`);
        assert(cornerAidLook(s).marks.length === 0 && cornerAidLook(s).sector === null, 'nothing after the lane');
      }
      console.log(`      ${rows.join('\n      ')}`);
    },
  },
  {
    name: 'the aid\'s pixels (range-items.js cornerAidPixels): your corner\'s bracket and your point\'s ring in AID_MINE, your #2\'s dotted in AID_TWO (fewer pixels), your sector\'s wedge in AID_SECTOR only with a sector, thinned as k falls and none at 0, all flat on the room\'s floor for the overlay pass',
    fn() {
      const { s } = house('private', 'room:2'), P = lanePlanOf(s).plans['o:w4:r2'], T = cornerTableOf(P);
      const mark = (r, k) => ({ room: 'w4.r2', slot: r.slot, mine: r.slot === 1, k, corner: { x: r.corner.x, z: r.corner.z, along: r.corner.along, back: r.corner.back }, point: r.point });
      const full = cornerAidPixels({ marks: T.map(r => mark(r, 1)), sector: { k: 1, ...sectorWedgeOf(P, T[0]) } });
      const half = cornerAidPixels({ marks: T.map(r => mark(r, 0.5)), sector: { k: 0.5, ...sectorWedgeOf(P, T[0]) } });
      const none = cornerAidPixels({ marks: T.map(r => mark(r, 0)), sector: { k: 0, ...sectorWedgeOf(P, T[0]) } });
      const noSector = cornerAidPixels({ marks: T.map(r => mark(r, 1)), sector: null });
      const by = (L) => ({ mine: L.filter(p => p.c === AID_MINE).length, two: L.filter(p => p.c === AID_TWO).length, all: L.length });
      const f = by(full), h = by(half), n = by(noSector);
      // (your bracket's pixels: within 0.8 m of your corner; the ring's within 0.3 m of your point)
      const atCorner = noSector.filter(p => p.c === AID_MINE && Math.hypot(p.x - T[0].corner.x, p.z - T[0].corner.z) < 0.8).length, atPoint = noSector.filter(p => p.c === AID_MINE && Math.hypot(p.x - T[0].point[0], p.z - T[0].point[1]) < 0.35).length;
      console.log(`      room 2: full ${f.all} px (yours ${f.mine}, the #2's ${f.two}, the wedge ${f.all - n.all}); at k 0.5 ${h.all}; at k 0 ${none.length}; your bracket ${atCorner} px at (${T[0].corner.x}, ${T[0].corner.z}), your ring ${atPoint} px at (${T[0].point.join(', ')}); drawn at ${AID_Y_M} m (the cut ${CUT_H_M} m)`);
      assert(f.mine > f.two && f.two > 0 && f.all > n.all && AID_SECTOR === AID_MINE && h.all < f.all && h.all > 0 && none.length === 0, JSON.stringify({ f, h, n, none: none.length }));
      // (flat on the room's floor, for the overlay pass (range.js: no depth test), never upright over the cut, where room 2's sat on
      // the hall-facing wall face and read as in the hall: the play review of 2026-11-15, the fixer's of 0.0.16)
      assert(atCorner >= 16 && atPoint >= 8 && full.every(p => p.y === AID_Y_M && p.flat) && AID_Y_M < 0.05 && cornerAidPixels(null).length === 0, JSON.stringify({ atCorner, atPoint }));
    },
  },
  {
    name: 'in the page (heavy): the boot recruit at GO has no aid drawn; on room 1\'s stack his corner, his point and his #2\'s are drawn (the page\'s house().corners.aid, and the chalk teal on the screen where it was not); in the room his sector\'s wedge is drawn as well; no page errors',
    heavy: true,
    timeoutMs: 300000,
    async fn() {
      const { withGame } = await import('./browser.mjs');
      const port = Number(process.env.OLYMPUS_TEST_PORT) || undefined;
      const dir = process.env.CORNER_SHOT_DIR ?? null;
      await withGame(async (page) => {
        await page.setViewportSize({ width: 1600, height: 900 });
        const step = (n, input) => page.evaluate(([n, input]) => { window.__olympus.step(n, input); return null; }, [n, input]);
        const frames = (k) => page.evaluate((k) => new Promise(r => { let i = 0; const f = () => (++i >= k ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), k);
        const teal = async (name) => {
          const buf = await page.screenshot(dir ? { path: `${dir}/corner-${name}.png` } : {});
          // (the screen's pixels near the chalk teal (AID_MINE 0x62e6d0, snapped by the stage's palette to (178, 220, 203)): decoded in
          // the page from the PNG, the HUD's band at the foot left out)
          return page.evaluate(async (b64) => {
            const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode();
            const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
            const d = x.getImageData(0, 0, c.width, Math.round(c.height * 0.7)).data; let n = 0;
            for (let i = 0; i < d.length; i += 4) if (d[i + 1] - d[i] > 30 && d[i + 2] - d[i] > 15 && d[i + 1] > 190) n++;
            return n;
          }, buf.toString('base64'));
        };
        await step(1, {}); await frames(6);
        const a0 = await page.evaluate(() => window.__olympus.house().corners?.aid ?? null), t0 = await teal('go');
        await page.evaluate(() => { const s = window.__olympus.state, me = s.actors.list.find(a => a.who === s.player.id); me.x = 29.95; me.z = 12.45; delete me.v; });
        await step(1, {}); await frames(6);
        const a1 = await page.evaluate(() => ({ drawn: window.__olympus.house().corners?.aid ?? null, marks: window.__olympus.house().look?.aid?.marks?.length ?? 0 })), t1 = await teal('stack');
        // (the door pushed open, then out of the mode and in to his point)
        await step(1, { act: [{ act: 'stop', args: { step: 'door:push>o:w4:r1', tempo: 'normal' } }] });
        for (let i = 0; i < 40; i++) await step(1, {});
        await page.evaluate(() => { const s = window.__olympus.state, me = s.actors.list.find(a => a.who === s.player.id); me.x = 27.5; me.z = 11.5; delete me.v; });
        await step(1, { act: [{ act: 'stop', args: { step: 'leave', tempo: 'normal' } }] });
        await step(3, {}); await frames(6);
        const a2 = await page.evaluate(() => ({ drawn: window.__olympus.house().corners?.aid ?? null, sector: !!window.__olympus.house().look?.aid?.sector })), t2 = await teal('in');
        console.log(`      at GO: ${a0} aid pixels, ${t0} teal on the screen; on the stack: ${a1.drawn} (${a1.marks} marks), ${t1} teal; in the room: ${a2.drawn}, the sector ${a2.sector ? 'drawn' : 'none'}, ${t2} teal${dir ? `; shots in ${dir}` : ''}`);
        assert(a0 === 0 && a1.marks === 2 && a1.drawn > 40 && t1 > t0 + 40 && a2.sector && a2.drawn > a1.drawn, JSON.stringify({ a0, a1, a2, t0, t1, t2 }));
      }, { port, query: 'play=test-shoothouse&seed=48213&tier=recruit&setup=go&nostore=1' });
    },
  },
];
