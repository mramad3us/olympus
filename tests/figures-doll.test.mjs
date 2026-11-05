// OLYMPUS tests: the close figure (src/art/doll/). Its size at each density, its kit, its slots, its wounds.
//
// Pure: the doll is painted in node at scale 1 (tradecraft's 64 × 140, 16 px/m) and 1.5 (24 px/m), and
// the tests count what is drawn where: the visor hides the face, a used slot shows gold, every wound kind
// marks the figure where its spot says. They print the sizes, the times and the counts.
import { assert } from './helpers.mjs';
import { doll, woundSpot } from '../src/art/doll/doll.js';
import { unword } from '../src/art/paint.js';

const WALL = 0x383c4a, FLOOR = 0x2b2e3a, FLOOR_DARK = 0x1f2029, INK = 0x14151c, GOLD = 0xe7b84a;
const colourAt = (pm, x, y) => unword(pm.data[y * pm.w + x]).hex;
const count = (pm, test, x0 = 0, y0 = 0, x1 = pm.w, y1 = pm.h) => { let n = 0; for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (test(colourAt(pm, x, y))) n++; return n; };
const figure = (c) => c !== WALL && c !== FLOOR && c !== FLOOR_DARK;
const diff = (a, b) => { let n = 0; for (let i = 0; i < a.data.length; i++) if (a.data[i] !== b.data[i]) n++; return n; };

export default [
  {
    name: 'the close figure is tradecraft\'s 64 × 140 at scale 1 (16 px/m) and 96 × 210 at 1.5 (24 px/m): the same size against the picture, its pixels half the stage\'s',
    fn() {
      for (const scale of [1, 1.5]) {
        const t0 = performance.now(), pm = doll({ look: { outfit: 'utilities' }, scale }), ms = performance.now() - t0;
        let top = pm.h, bottom = 0;
        for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) if (figure(colourAt(pm, x, y)) && colourAt(pm, x, y) !== INK) { top = Math.min(top, y); bottom = Math.max(bottom, y); }
        console.log(`      scale ${scale}: ${pm.w} × ${pm.h}, the figure rows ${top}–${bottom} (${bottom - top + 1} rows), painted in ${ms.toFixed(1)} ms`);
        assert(pm.w === Math.round(64 * scale) && pm.h === Math.round(140 * scale), 'size');
        assert(bottom - top + 1 > 125 * scale && bottom - top + 1 < 136 * scale, 'a figure the height of the canvas');
      }
    },
  },
  {
    name: 'sealed, the vac helmet\'s visor hides the face; open, the face is there over the neck ring',
    fn() {
      const sealed = doll({ look: { outfit: 'vac' }, scale: 1 }), open = doll({ look: { outfit: 'vacOpen' }, scale: 1 });
      const visor = count(sealed, c => c === 0x1b2541, 20, 5, 44, 30), skinOpen = count(open, c => { const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255; return r > g && g > b && r - b > 40; }, 20, 5, 44, 30);
      const skinSealed = count(sealed, c => { const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255; return r > g && g > b && r - b > 40; }, 20, 5, 44, 30);
      console.log(`      sealed: ${visor} visor pixels, ${skinSealed} skin-toned in the head's box; open: ${skinOpen} skin-toned`);
      assert(visor > 80 && skinSealed < 10 && skinOpen > 150, 'the visor, then the face');
    },
  },
  {
    name: 'the load-bearing slots are marked as tradecraft marked pockets: free a seam, used a gold bag (the plate carrier\'s magazines, the IFAK, a cargo pocket)',
    fn() {
      const free = doll({ look: { outfit: 'carrier' }, marks: { carrier: ['free', 'free', 'free'], belt: ['free', 'free'], radio: ['free'] }, scale: 1 });
      const used = doll({ look: { outfit: 'carrier' }, marks: { carrier: ['used', 'used', 'used'], belt: ['used', 'free'], radio: ['used'], trousers: ['used', 'free'] }, scale: 1 });
      const gold = (pm) => count(pm, c => c === GOLD);
      console.log(`      gold pixels: all slots free ${gold(free)}, three magazines, the IFAK, the radio and a cargo pocket in use ${gold(used)}`);
      assert(gold(free) < 8 && gold(used) > 60, 'gold where something is');
    },
  },
  {
    name: 'every wound kind marks the figure where its spot says, and dressings, a tourniquet and a splint go on (tradecraft\'s wounds, the user 2026-11-03)',
    fn() {
      const base = doll({ look: { outfit: 'utilities', head: null }, scale: 1 });
      const kinds = [['hole', 'torso'], ['stopped', 'torso'], ['cut', 'armL'], ['gash', 'legR'], ['graze', 'head'], ['split', 'head'], ['bruise', 'head'], ['break', 'legL'], ['inside', 'torso']];
      const rows = [];
      for (const [kind, part] of kinds) {
        const pm = doll({ look: { outfit: 'utilities', head: null }, wounds: { wounds: [{ n: 1, part, kind, bleed: kind === 'stopped' || kind === 'bruise' || kind === 'break' ? 0 : 2 }] }, scale: 1 });
        const d = diff(base, pm), s = pm.spots[0];
        rows.push(`${kind} (${part}) ${d} px at ${s.x},${s.y}`);
        assert(d > 3, `${kind} drew nothing`);
        assert(s.x > 8 && s.x < 56 && s.y > 4 && s.y < 135, `${kind}: its spot is on the figure`);
      }
      const care = doll({ look: { outfit: 'utilities', head: null }, wounds: { wounds: [{ n: 1, part: 'armR', kind: 'hole', bleed: 1, dressed: 'bandage' }], tourniquets: ['legL'], splints: ['legR'] }, scale: 1.5 });
      const bandage = count(care, c => c === 0xeeeae0 || c === 0xf4f2ec);
      console.log(`      ${rows.join('; ')}; dressed and splinted at scale 1.5: ${bandage} bandage pixels`);
      assert(bandage > 10, 'the dressings show');
      assert(woundSpot('m', 'legR', 0, 'break')[1] === 111, 'a break on the shin, tradecraft\'s place');
    },
  },
  {
    name: 'the utilities are in the Valles pattern, the vac suit is not; a rifle in hand is drawn to its length (85 cm)',
    fn() {
      const u = doll({ look: { outfit: 'utilities' }, scale: 1 }), v = doll({ look: { outfit: 'vac' }, scale: 1 }), r = doll({ look: { outfit: 'utilities' }, hand: 'rifle', scale: 1 });
      const colours = (pm, y0, y1) => { const s = new Set(); for (let y = y0; y < y1; y++) for (let x = 14; x < 50; x++) s.add(colourAt(pm, x, y)); return s.size; };
      let rifleRows = 0;
      for (let y = 0; y < r.h; y++) for (let x = 0; x < 18; x++) if (colourAt(r, x, y) !== colourAt(u, x, y)) { rifleRows++; break; }
      console.log(`      colours across the trousers (rows 80–95): utilities ${colours(u, 80, 95)}, vac suit ${colours(v, 80, 95)}; the rifle spans ${rifleRows} rows (85 cm is ${Math.round(85 * 0.72)})`);
      assert(colours(u, 80, 95) > colours(v, 80, 95) + 8, 'a pattern on the utilities');
      assert(rifleRows > 50, 'the rifle to its length');
    },
  },
];
