// OLYMPUS tests: the back of a man (src/art/doll/back.js; the build sheet v0.0.23 §1 A, §6 A; portrait-facing's F1).
//
// The user, 2026-11-17: "the portraits need to be more dynamic and show us what we would be seeing". A man with his back to you is
// drawn from behind: for every gear the live lane's cards can show (yours, your number two's, each role-player's as he stands, with his
// rifle at the ready, on his back, hanging in front, his P-12 out, a G-11 in his hand, his hands up, out of the carrier, in his own
// utilities; and the boards' painted men), backParts draws on the doll's grid (doll.js kitOf and dressKit: the same kit as the front):
// no hand pixel in the front's hands' boxes when the hands are on something in front of him (the body hides them; hanging, the backs of
// the hands at his sides, and held up, by his head, are seen and drawn: a G-11 in the right fist leaves the left hand hanging, seen), the carrier's back panel exactly when a carrier is worn, a
// rifle slung on the back whole (its pixel count within 10% of the same rifle drawn whole across the chest, and at least 90% of it left
// showing on the figure), and the head's anchor where the front's is (the card's HEAD_ROW and A_ROW at the near band, and the head's
// top within a pixel of the front doll's). Prints the counts. Fails without back.js.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { doll, kitOf, dressKit, BODY, DROP, DOLL_ROWS } from '../src/art/doll/doll.js';
import { grid, flesh } from '../src/art/doll/grid.js';
import { dressOf } from '../src/art/doll/dress.js';
import { gearBends, rifleStamp } from '../src/art/doll/worn.js';
import { HEAD_ROW, A_ROW, HIT_SCALE } from '../src/art/doll/hitcard.js';
import { backParts, backRifleStamp, BACK_HEAD, BACK_A } from '../src/art/doll/back.js';
import { gearOf, standGear } from '../src/sim/arms/gear.js';
import { lookFor } from '../src/sim/people/figure.js';
import { word } from '../src/art/paint.js';

const WALL = word(0x383c4a);

// (the gears of the live lane's cards, and their variants: see the header)
function gears() {
  const s = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', opfor: 'live:fight,hide' }).state;
  const P = (who) => { const p = s.people[who], a = s.actors.list.find(x => x.who === who); return { look: lookFor(p.look, a?.outfit ?? 'utilities', true), sex: p.sex ?? 'm' }; };
  const me = s.player.id, two = s.armoury.range.house.twoPid, rps = s.armoury.range.turners.filter(T => T.live).map(T => T.live.who);
  const out = [];
  const add = (name, gear, person) => out.push({ name, gear, person });
  for (const [name, who] of [['you', me], ['your #2', two], ...rps.map((w, i) => [`role-player ${i + 1}`, w])]) {
    const g = gearOf(s, who), p = P(who);
    add(`${name} as he stands`, g, p);
    if (g.rifle) {
      add(`${name}, rifle at the ready`, { ...g, rifle: { ...g.rifle, place: 'ready' } }, p);
      add(`${name}, rifle on his back`, { ...g, rifle: { ...g.rifle, place: 'back' } }, p);
      add(`${name}, rifle hanging in front`, { ...g, rifle: { ...g.rifle, place: 'front' } }, p);
    }
    if (g.pistol) add(`${name}, the P-12 out`, { ...g, rifle: g.rifle ? { ...g.rifle, place: 'front' } : null, pistol: { ...g.pistol, place: 'ready' } }, p);
    add(`${name}, a G-11 in his hand`, { ...g, rifle: g.rifle ? { ...g.rifle, place: 'front' } : null, device: { model: 'g11', shape: 'can', colour: 'olive' } }, p);
    add(`${name}, hands up`, { ...g, rifle: null, hands: 'up' }, p);
    if (g.carrier) add(`${name}, out of the carrier, rifle on his back`, { ...g, carrier: null, rifle: g.rifle ? { ...g.rifle, place: 'back' } : null }, { ...p, look: { ...p.look, outfit: 'utilities' } });
  }
  for (const [face, holds] of [['threat', 'rifle'], ['threat', 'pistol'], ['armoured', 'rifle'], ['noshoot', 'phone']]) add(`the board ${face}/${holds}`, standGear(face, holds), { look: { skin: 'tan', ...(face === 'armoured' ? { outfit: 'carrier' } : {}) }, sex: 'm' });
  return out;
}

// (the back on its grid: { g, kit, r, B, args })
function backOf(gear, person, scale = HIT_SCALE) {
  const args = dressOf(gear, person), g = grid(scale, DROP), B = BODY[args.sex] ?? BODY.m;
  const kit = kitOf(args.look.outfit ? args.look : { ...args.look }, {}, null);
  if (args.gear) dressKit(kit, args.gear);
  const r = backParts(g, B, kit, DOLL_ROWS);
  return { g, kit, r, B, args };
}
const partPx = (g, ids) => { const set = new Set([ids].flat().filter(x => x !== null && x !== undefined)); let n = 0; for (let y = 0; y < g.ROWS; y++) for (let x = 0; x < g.W; x++) if (set.has(g.part[y][x])) n++; return n; };

export default [
  {
    name: 'the back of every gear the live lane\'s cards show: no hand pixel where the hands are on something in front of him, the carrier\'s back panel exactly when a carrier is worn, a rifle on the back whole, the head\'s anchor where the front\'s is',
    fn() {
      const rows = [], bad = [];
      for (const { name, gear, person } of gears()) {
        const { g, kit, r, B, args } = backOf(gear, person), S = g.S;
        // (the front's hands' boxes: where the bent arms' fists are, a gun or a device held in front of him)
        const bends = gearBends(args.gear ?? {}), inFront = !!bends && args.gear?.hands !== 'up';
        // (a hand's pixel: one of the back's hand parts, or bare skin where it is not gloved (a glove's tones are the suit's own rings'))
        const tones = new Set(kit.gloves ? [] : Object.values(flesh(kit.skin)));
        let handPx = 0;
        if (inFront) for (const to of [bends.bendR && [g.MID - to0(bends.bendR), bends.bendR[1]], bends.bendL && [g.MID + to0(bends.bendL), bends.bendL[1]]].filter(Boolean)) {
          for (let y = Math.floor((to[1] - 4) * S); y <= Math.ceil((to[1] + 4) * S); y++) for (let x = Math.floor((to[0] - 4) * S); x <= Math.ceil((to[0] + 4) * S); x++) if (g.col[y]?.[x] !== null && g.col[y]?.[x] !== undefined && (tones.has(g.col[y][x]) || r.parts.hands.includes(g.part[y][x]))) handPx++;
        }
        const carrier = gear.painted ? args.look.outfit === 'carrier' : !!gear.carrier || args.look.outfit === 'carrier', panelPx = partPx(g, r.parts.panel);
        let rifle = null;
        if (args.gear?.rifle?.place === 'back') {
          const back = backRifleStamp(kit.model ?? 'r7', kit.finish, S, g.MID, args.gear.rifle.mag !== false).length, front = rifleStamp(kit.model ?? 'r7', kit.finish, S, 'front', B, g.MID, args.gear.rifle.mag !== false).length;
          rifle = { back, front, shown: partPx(g, r.parts.rifle) };
        }
        const ok = handPx === 0 && (panelPx > 0) === carrier && (!rifle || (Math.abs(rifle.back - rifle.front) <= 0.1 * rifle.front && rifle.shown >= 0.9 * rifle.back))
          && r.parts.hands.length === (inFront ? (bends.bendR ? 0 : 1) + (bends.bendL ? 0 : 1) : 2);
        rows.push(`${name}: hands ${inFront ? `in front, ${handPx} px in their boxes, ${r.parts.hands.length} hanging seen` : `${r.parts.hands.length} seen`}, panel ${panelPx} px${carrier ? '' : ' (no carrier)'}${rifle ? `, rifle on the back ${rifle.shown} of ${rifle.back} px shown (across the chest ${rifle.front})` : ''}`);
        if (!ok) bad.push({ name, handPx, panelPx, carrier, rifle, hands: r.parts.hands.length, inFront });
      }
      for (const l of rows) console.log(`      ${l}`);
      assert(!bad.length, JSON.stringify(bad));
      // (the anchors: the card's head and A rows at the near band (the front's, measured on the doll), and the head's top against the front doll's)
      const headRow = (BACK_HEAD[1] + DROP) * HIT_SCALE, aRow = (BACK_A[1] + DROP) * HIT_SCALE;
      const { gear, person } = gears()[0], front = doll({ ...dressOf(gear, person), scale: HIT_SCALE }), { g } = backOf(gear, person);
      const topFront = (() => { for (let y = 0; y < front.h; y++) for (let x = Math.floor(front.w * 0.35); x < front.w * 0.65; x++) if (front.data[y * front.w + x] !== WALL) return y; return -1; })();
      const topBack = (() => { for (let y = 0; y < g.ROWS; y++) for (let x = Math.floor(g.W * 0.35); x < g.W * 0.65; x++) if (g.col[y][x] !== null) return y + Math.round(DROP * HIT_SCALE) - 1; return -1; })();
      console.log(`      anchors at the near band: the head's row ${headRow.toFixed(1)} (the card's HEAD_ROW ${HEAD_ROW}), the A zone's ${aRow.toFixed(1)} (A_ROW ${A_ROW.toFixed(1)}); the head's top row ${topBack} on the back (its ink included), ${topFront} on the front doll`);
      assert(Math.abs(headRow - HEAD_ROW) <= 1 && Math.abs(aRow - A_ROW) <= 1 && Math.abs(topBack - topFront) <= 1, JSON.stringify({ headRow, aRow, topBack, topFront }));
    },
  },
];
// (a bend's column offset from the middle: bendR [d, y] is d to the viewer's left, bendL [d, y] to the right)
function to0(b) { return b[0]; }
