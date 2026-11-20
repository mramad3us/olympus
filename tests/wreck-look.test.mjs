// OLYMPUS tests: the look off the deck (the build sheet v0.0.25 items 7 and 8, §3.4, §6 D wreck-look; PC§3.2 to PC§3.4; VIEWS §2.1, §3.5).
//
// "Hold to hold" draws a body or a board on any of a compartment's six faces by turning its standing card on the picture
// (art/figures/poses.js faceCard: 6 faces × 4 facings, as samples/wreck-faces turns every candidate: flipped top to bottom on the
// deckhead and the dorsal bulkhead, a quarter turn on a side one, about the anchor, the facing kept, the rifle the rifle's shape),
// a face change through the tumble's 45° frames (render/faces.js faceTurnFrame), and every body off the deck by one rule
// (render/faces.js heightLookOf, float-look's F-b, read from the lift over a standing man's place, floatY − FLOAT_Y_M, never the floor
// `a.y`). Pinned here in node: faceCard's 24 rows whole; a turned card's corners on the pixel grid with its size kept (a quarter turn
// moves no pixel off the grid and scales nothing: render/faces.js cardTurn) and at quarter 0 exactly the placement the figures used;
// a board turned by the same table (range-items.js boardPixels: every pixel of turnerPixels' list moved by the turn, nothing added
// or lost, each on the grid); a pop-up's rise; the tumble frame held over the release and the lock; heightLookOf one value for a
// planted and a floating body at one height (a floater at floatY 1.0 drawn at the deck's height, as today; at 1.6, raised 0.6 m and
// scaled 1.25); the walls to the deckhead under the flag only (every shipped area's walls WALL_H_M). Quick.
import { assert } from './helpers.mjs';
import { faceCard, FACE_CARDS, tumbleFrame } from '../src/art/figures/poses.js';
import { FACE_QUARTERS, ON_FACES, STAGE_TURNS, rollOf } from '../src/data/faces.js';
import { TURN as SAMPLE_TURN } from '../samples/wreck-faces/faces.js';
import { heightLookOf, liftOf, faceTurnFrame, cardTurn, turnPixels, wallHOf, FLOAT_SCALE_K, FLOAT_SCALE_FROM_M, FLOAT_LOOK, OVERHEAD_LOOK, FACE_TURN_SHARES } from '../src/render/faces.js';
import { turnerPixels, boardPixels, popupPixels, overheadPixels, turnerAt } from '../src/render/range-items.js';
import { FREEFALL } from '../src/data/body/needs.js';
import { WALL_H_M } from '../src/sim/places/plan.js';
import { AREA_LIST } from '../src/sim/places/areas.js';
import { createKnown } from '../src/render/known.js';
import * as KNOWN from '../src/sim/places/known.js';
import { areaOf } from '../src/sim/places/model.js';
import { createGame } from './game.mjs';

const PPM = 16, G = 0.0006 * 9.80665;
const near = (a, b, e = 1e-9) => Math.abs(a - b) <= e;
const onGrid = (v, half = false) => near(((v * PPM - (half ? 0.5 : 0)) % 1 + 1) % 1 % 1, 0, 1e-6) || near(((v * PPM - (half ? 0.5 : 0)) % 1 + 1) % 1, 1, 1e-6);

export default [
  {
    name: "faceCard's 24 rows, samples/wreck-faces' own turn: the deck and the ventral bulkhead upright, the deckhead and the dorsal bulkhead flipped top to bottom, starboard a quarter turn counter-clockwise and port clockwise, the facing kept",
    fn() {
      const want = { deck: [0, false], ventral: [0, false], deckhead: [0, true], dorsal: [0, true], starboard: [1, false], port: [3, false] };
      let rows = 0;
      for (const face of ON_FACES) {
        const line = [], [q, flip] = want[face];
        for (const facing of ['up', 'down', 'left', 'right']) {
          const r = faceCard(face, facing);
          assert(r.cardFacing === facing && r.quarter === q && r.flip === flip && r === FACE_CARDS[face][facing] && Object.isFrozen(r), JSON.stringify({ face, facing, r }));
          line.push(`${facing}→${r.cardFacing}/${r.quarter}${r.flip ? 'f' : ''}`);
          rows++;
        }
        // (the sample's TURN of a card offset (right, down from the feet): the same map as the stage's on the picture)
        const st = STAGE_TURNS[face], probe = [[1, 0], [0, -1], [2, -3]].map(([dx, dy]) => SAMPLE_TURN[face](dx, dy));
        const mine = [[1, 0], [0, -1], [2, -3]].map(([dx, dy]) => { const y = -dy * (st.flip ? -1 : 1), c = [1, 0, -1, 0][st.quarter], s = [0, 1, 0, -1][st.quarter]; return [c * dx - s * y, -(s * dx + c * y)]; });
        assert(JSON.stringify(probe.map(p => p.map(v => v + 0))) === JSON.stringify(mine.map(p => p.map(v => v + 0))), JSON.stringify({ face, probe, mine }));
        console.log(`      ${face.padEnd(9)} ${line.join('  ')}  (the sample's turn: the same)`);
      }
      assert(rows === 24 && Object.keys(FACE_CARDS).length === 6, `rows ${rows}`);
      // (absent, unknown: the deck's own row, so nothing shipped turns)
      assert(faceCard(undefined, 'left') === FACE_CARDS.deck.left && faceCard('deck', 'sideways') === FACE_CARDS.deck.down, 'the deck by default');
    },
  },
  {
    name: 'a turned card stands on the pixel grid at its own size, about its anchor, its lowest row over the deck; at quarter 0 exactly where the figures placed every card before',
    fn() {
      const cases = [];
      for (const [cw, ch, ax, ay] of [[24, 36, 12, 2], [23, 35, 11, 3], [30, 40, 15, 20]]) for (const [q, flip] of [[0, false], [1, false], [2, false], [3, false], [0, true]]) for (const at of [{ x: 4.6, y: 2.2, z: 3.6 }, { x: 64.53, y: 1.07, z: 2.11 }, { x: 1.0, y: 0, z: 1.0 }]) {
        const T = cardTurn({ cw, ch, ax, ay, quarter: q, flip, at, ppm: PPM });
        // (the four corners: whole pixels, the card's own area, no mirror)
        const corners = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([u, v]) => [T.a * u + T.b * v + T.tx, T.c * u + T.d * v + T.ty]);
        const det = T.a * T.d - T.b * T.c;
        assert(near(Math.abs(det), (cw / PPM) * (ch / PPM), 1e-9) && (det > 0) === !flip, JSON.stringify({ cw, ch, q, flip, det }));
        for (const [x, y] of corners) assert(near(Math.round(x * PPM), x * PPM, 1e-6) && near(Math.round(y * PPM), y * PPM, 1e-6), JSON.stringify({ cw, ch, q, at, x, y }));
        const lo = Math.min(...corners.map(c => c[1]));
        assert(lo >= -1e-9, JSON.stringify({ cw, ch, q, at, lo }));
        // (the anchor's pixel corner lands at the spot's x and the raised height, the plane brought as much nearer the camera)
        const axM = ax / PPM, ayM = ay / PPM, X = T.a * (axM / (cw / PPM)) + T.b * (ayM / (ch / PPM)) + T.tx, Y = T.c * (axM / (cw / PPM)) + T.d * (ayM / (ch / PPM)) + T.ty;
        assert(near(X, Math.round(at.x * PPM) / PPM, 1e-9) && near(Y, T.yA, 1e-9) && near(T.tz - T.yA, Math.round((at.z - Math.round(at.y * PPM) / PPM + T.yA) * PPM) / PPM - T.yA, 1e-9), JSON.stringify({ X, Y, T }));
        if (q === 0 && !flip) {
          // (the figures' own placement, figures.js update before v0.0.25)
          const nb = ay / PPM, yb = Math.round(Math.max(0, at.y - nb) * PPM) / PPM, left = Math.round(at.x * PPM) / PPM - ax / PPM;
          assert(near(T.tx, left, 1e-9) && near(T.ty, yb, 1e-6) && near(T.a, cw / PPM) && near(T.d, ch / PPM) && T.b === 0 && T.c === 0, JSON.stringify({ T, left, yb }));
        }
        cases.push(q);
      }
      // (on the deckhead, flipped: the card hangs head down from the feet at 2.2 m, its pixel row 2.1875 m at 16 px/m, the anchor's two rows above)
      const D = cardTurn({ cw: 24, ch: 36, ax: 12, ay: 2, flip: true, at: { x: 4.6, y: 2.2, z: 3.6 }, ppm: PPM }), S = (v) => Math.round(v * PPM) / PPM;
      const top = D.ty + Math.max(0, D.d), bottom = D.ty + Math.min(0, D.d);
      console.log(`      ${cases.length} placements on the grid; the deckhead's card from ${bottom.toFixed(4)} m to ${top.toFixed(4)} m (its feet at ${D.yA} m), its plane at z ${D.tz}`);
      assert(near(D.yA, S(2.2), 1e-9) && near(bottom, S(2.2) - 34 / PPM, 1e-9) && near(top, S(2.2) + 2 / PPM, 1e-9) && near(D.tz, S(3.6), 1e-9), JSON.stringify(D));
    },
  },
  {
    name: "a board on a face is turnerPixels' own list turned by the face's quarters about its centre (every pixel moved, none added or lost, each on the half-pixel grid); a pop-up rises from flat by its facingK; its footprint dashed under the deckhead only under K-b (v0.0.28: K-a, none)",
    fn() {
      const t = { key: 'h1', face: 'paper', holds: 'rifle', x: 64.6, z: 2.4, y: 1.3, facingK: 1, holes: [{ xCm: 3, yCm: -5, zone: 'A', ring: false, atMs: 100 }] };
      const base = turnerPixels(t, 1000, PPM, G);
      assert(boardPixels(t, 1000, PPM, G).length === base.length && boardPixels({ ...t, onFace: 'deck' }, 1000, PPM, G).every((p, i) => p.x === base[i].x && p.y === base[i].y), 'the deck: the list as it was');
      const ta = turnerAt(t, PPM);
      for (const face of ['deckhead', 'dorsal', 'port', 'starboard', 'ventral']) {
        const { quarter: q, flip } = STAGE_TURNS[face], list = boardPixels({ ...t, onFace: face }, 1000, PPM, G);
        assert(list.length === base.length, JSON.stringify({ face, n: list.length }));
        const cx = ta.cx, cy = ta.yTop - Math.round(ta.h / 2) / PPM;
        const want = turnPixels(base, cx, cy, q, (p) => p.z - ta.z, flip);
        let off = 0;
        list.forEach((p, i) => { if (!near(p.x, want[i].x, 1e-9) || !near(p.y, want[i].y, 1e-9) || p.z !== base[i].z || p.c !== base[i].c) off++; if (!onGrid(p.x, true) || !onGrid(p.y - (p.noLine ? 0.24 : 0.2), true)) off++; });
        const ys = list.map(p => p.y);
        console.log(`      ${face.padEnd(9)} q ${q}${flip ? ' flipped' : ''}: ${list.length} pixels, ${off} off; y ${Math.min(...ys).toFixed(3)} to ${Math.max(...ys).toFixed(3)} m`);
        assert(off === 0, JSON.stringify({ face, off }));
        if (flip) {
          // (flipped top to bottom: (x, y) → (x, 2cy − y) in the face's plane, exactly)
          assert(list.every((p, i) => { const l = base[i].z - ta.z; return near(p.x, base[i].x, 1e-9) && near(p.y - l, 2 * cy - (base[i].y - l), 1e-9); }), face);
        }
      }
      // (a pop-up, P-a hinged: flat, a row; half up, half the face's rows; up, turnerPixels' own)
      const rows = (l) => new Set(l.filter(p => !p.slot).map(p => Math.round(p.y * PPM * 2))).size;
      const pf = [0, 0.25, 0.5, 1].map(k => popupPixels(t, k, 1000, PPM, G, 'P-a'));
      console.log(`      a hinged pop-up's (P-a) rows at 0, 0.25, 0.5, 1 up: ${pf.map(rows).join(', ')} (the face ${ta.h} rows)`);
      assert(rows(pf[0]) === 1 && rows(pf[2]) === Math.round(ta.h / 2) && pf[3].length === base.length, JSON.stringify(pf.map(rows)));
      // (its base where it stands: the lowest row the same at any rise)
      assert(near(Math.min(...pf[1].map(p => p.y)), Math.min(...base.filter(p => !p.noLine).map(p => p.y)), 1e-9), 'the pop-up hinged at its base');
      // (v0.0.28, P-b, the user's star of 2026-11-20, the game's: sliding from its slot, down none of the board but the slot's row, half
      // up the face's top half at its own size on the base, up turnerPixels' own with no slot)
      const ps = [0, 0.5, 1].map(k => popupPixels(t, k, 1000, PPM, G));
      console.log(`      a sliding pop-up's (P-b) board rows at 0, 0.5, 1 up: ${ps.map(rows).join(', ')}, slot pixels ${ps.map(l => l.filter(p => p.slot).length).join(', ')}`);
      assert(rows(ps[0]) === 0 && ps[0].length && ps[0].every(p => p.slot) && rows(ps[1]) === Math.round(ta.h / 2) && ps[2].length === base.length && !ps[2].some(p => p.slot), JSON.stringify(ps.map(rows)));
      assert(near(Math.min(...ps[1].filter(p => !p.slot).map(p => p.y)), Math.min(...base.filter(p => !p.noLine).map(p => p.y)), 1e-9), 'the pop-up slides out on its base');
      assert(boardPixels({ ...t, pop: true, facingK: 0.5 }, 1000, PPM, G).length === ps[1].length, 'boardPixels draws a pop-up by its facingK');
      const oh = overheadPixels({ ...t, onFace: 'deckhead' }, PPM);
      // (v0.0.28: K-a, the user's star of 2026-11-20, the projection alone: no footprint dashed under the deckhead; K-b drew one)
      assert((OVERHEAD_LOOK === 'K-a' ? oh.length === 0 : oh.length > 0 && oh.every(p => p.y < 0.02)) && overheadPixels(t, PPM).length === 0 && overheadPixels({ ...t, onFace: 'dorsal' }, PPM).length === 0, `overhead ${oh.length} (${OVERHEAD_LOOK})`);
      console.log(`      the deckhead's footprint ${oh.length} dashes on the deck`);
    },
  },
  {
    name: 'a face change shows the tumble frame between the two faces: one 45° step off the face left over the release, one short of the face met over the lock, the steps between over the tuck and turn; none between two faces drawn alike',
    fn() {
      const [r0, r1] = FACE_TURN_SHARES, seen = [];
      for (const k of [0, 0.1, r0 - 1e-6, r0, 0.3, 0.45, 0.6, r1 - 1e-6, r1, 0.9, 1]) seen.push(faceTurnFrame({ from: 'deck', to: 'deckhead', k }));
      console.log(`      deck → deckhead by share: ${seen.join(', ')}`);
      assert(seen[0] === 'tumble1' && seen[2] === 'tumble1' && seen[8] === 'tumble3' && seen[10] === 'tumble3', JSON.stringify(seen));
      assert(seen.slice(3, 8).every(f => f === 'tumble1' || f === 'tumble2' || f === 'tumble3') && seen.includes('tumble2'), JSON.stringify(seen));
      // (never the face's own frame mid-change, never a jump of more than one step between neighbours)
      const idx = seen.map(f => Number(f.replace('tumble', '')));
      assert(idx.every((v, i) => i === 0 || Math.abs(v - idx[i - 1]) <= 1), JSON.stringify(idx));
      const back = [0.05, 0.5, 0.95].map(k => faceTurnFrame({ from: 'deckhead', to: 'deck', k }));
      console.log(`      deckhead → deck: ${back.join(', ')}; deck → ventral ${faceTurnFrame({ from: 'deck', to: 'ventral', k: 0.5 })}; deck → port ${faceTurnFrame({ from: 'deck', to: 'port', k: 0.5 })}`);
      assert(back[0] === 'tumble5' && back[2] === 'tumble7', JSON.stringify(back));
      assert(faceTurnFrame({ from: 'deck', to: 'ventral', k: 0.5 }) === null && faceTurnFrame({ from: 'deck', to: 'port', k: 0.5 }) === tumbleFrame(-Math.PI / 4), 'a quarter turn the short way');
    },
  },
  {
    name: 'heightLookOf is one value for a planted and a floating body at one height, read from the lift over a standing man (floatY − FLOAT_Y_M): a floater at floatY 1.0 at the deck\'s height as today, at 1.6 raised 0.6 m (v0.0.28, F-a, the user\'s star: no scale step, v0.0.24\'s 1.25 retired); the floor `a.y` never read',
    fn() {
      const F = FREEFALL.FLOAT_Y_M;
      assert(F === 1.0, `FLOAT_Y_M ${F}`);
      const rows = [];
      for (const fy of [undefined, 1.0, 1.2, 1.5, 1.6, 2.0]) {
        const a = fy === undefined ? { y: 0.7 } : { floatY: fy, y: 0 }, L = liftOf(a), H = heightLookOf(L);
        rows.push(`floatY ${fy ?? '-'} lift ${L.toFixed(2)} scale ${H.scaleK} blob ${H.blob.k.toFixed(3)}/${H.blob.alpha.toFixed(3)}`);
        assert(L === (fy === undefined ? 0 : Math.max(0, fy - F)), JSON.stringify({ fy, L }));
        assert(H.scaleK === (FLOAT_LOOK === 'F-b' && L > FLOAT_SCALE_FROM_M ? FLOAT_SCALE_K : 1), JSON.stringify({ L, H }));
      }
      console.log(`      ${rows.join('; ')}`);
      assert(heightLookOf(liftOf({ floatY: 1.0 })).scaleK === 1 && liftOf({ floatY: 1.0 }) === 0, 'a floater at FLOAT_Y_M: the deck\'s height');
      const up = heightLookOf(liftOf({ floatY: 1.6 }));
      assert(near(up.blob.liftM, 0.6, 1e-9) && up.scaleK === 1 && FLOAT_LOOK === 'F-a', JSON.stringify(up));
      // (one value at one height, whoever asks: planted or floating is the caller's, the look the height's)
      const P = heightLookOf(liftOf({ floatY: 1.2, onFace: 'deckhead' })), Q = heightLookOf(0.2);
      assert(P.scaleK === Q.scaleK && near(P.blob.k, Q.blob.k, 1e-12) && near(P.blob.alpha, Q.blob.alpha, 1e-12), 'planted and floating alike');
    },
  },
  {
    name: 'the walls stand to the deckhead only under the area\'s look.wallsToCeiling: every shipped area\'s picture frames WALL_H_M as before, a flagged area its rooms\' ceiling; the faces\' roll between two ups by the same quarters',
    fn() {
      const shipped = AREA_LIST.filter(a => a.kind !== 'ground');
      const odd = shipped.filter(a => !a.look?.wallsToCeiling && wallHOf(a) !== WALL_H_M);
      console.log(`      ${shipped.length} floors and decks: ${shipped.filter(a => a.look?.wallsToCeiling).map(a => `${a.id} ${wallHOf(a)} m`).join(', ') || 'none flagged'}; the rest ${WALL_H_M} m`);
      assert(!odd.length, odd.map(a => a.id).join());
      assert(wallHOf({ look: { wallsToCeiling: true }, rooms: [{ ceilingM: 2.2 }, { ceilingM: 2.2 }] }) === 2.2 && wallHOf({ rooms: [{ ceilingM: 2.2 }] }) === WALL_H_M, 'the flag');
      // (rollOf: the faces' quarters, the viewer's taken off)
      assert(rollOf('deck', 'deckhead') === 2 && rollOf('deckhead', 'deck') === 2 && rollOf('deck', 'deck') === 0 && rollOf(undefined, 'port') === 3 && rollOf('port', 'starboard') === 2, 'rolls');
    },
  },
  {
    name: 'the Wreck at GO under its plan\'s walls: the 51 m of hull between its decks is known (the background\'s colour), every compartment\'s floor unknown (the review of C and D: the gap was the unknown\'s black slab beside the deck in every frame)',
    fn() {
      const g = createGame({ scenario: 'test-zerocqb', seed: 48213, tier: 'sgt', setup: 'go' }), s = g.state, area = areaOf(s.places.live.area);
      const K = createKnown(), on = K.begin(s, area, () => ({ familiar: KNOWN.familiarOf(s, area.id), footprint: KNOWN.footprintOf(s), rooms: KNOWN.knownRoomsOf(s) }));
      // (the gap's cells, x 9.2 to 60 m, on the area's lattice; and each compartment's middle)
      let gap = 0, gapKnown = 0;
      for (let x = 10.125; x < 59.9; x += 0.25) for (let z = 0.125; z < 7.2; z += 0.25) { gap++; if (K.at(x, z)) gapKnown++; }
      const floors = area.rooms.map(r => ({ id: r.id, k: K.at((r.rect[0] + r.rect[2]) / 2, (r.rect[1] + r.rect[3]) / 2) }));
      console.log(`      active ${on}; the gap: ${gapKnown} of ${gap} cells known; the rooms' middles known: ${floors.filter(f => f.k).map(f => f.id).join(', ') || 'none'} of ${floors.length}; ${K.count} cells known in all`);
      assert(on && gapKnown === gap, JSON.stringify({ on, gap, gapKnown }));
      assert(floors.every(f => !f.k), JSON.stringify(floors));
    },
  },
];
