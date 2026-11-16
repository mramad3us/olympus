// OLYMPUS tests: the helmet candidates (src/art/figures/helmets.js, src/art/doll/helmets.js; samples/helmets), behind a look's helm.
//
// The user, 2026-11-15: "The helmet design is pretty goofy" (the combat EVA suit's sealed helmet, the vac suit's dome). The
// candidates are drawn only for a look that carries helm, which no look of the game does, so the game's frames and the figure
// goldens stay as they are until the user picks (figures-frames and the goldens hold that; this checks the hook is shut without
// it). With it: every template is a rectangle of letters the shading knows; every candidate hides the face and the skull at
// both densities and in every facing, its silhouette the width its family is drawn to (printed); the faction's trim reaches
// the helmet, the plates and the shoulders, and only with a faction; the doll's candidates hide the face too. Pure, in node.
import { assert } from './helpers.mjs';
import { HELMS, HELM_IDS, FACTIONS, helmOf, helmTpl, HELMET_DRAWN_AS, helmFor } from '../src/art/figures/helmets.js';
import { dressedDoll, clearDolls } from '../src/art/doll/dress.js';
import { composeFrame } from '../src/art/figures/compose.js';
import { shade } from '../src/art/figures/shade.js';
import { wear, coloursOf } from '../src/art/figures/outfits.js';
import { doll } from '../src/art/doll/doll.js';
import { flesh } from '../src/art/doll/grid.js';
import { SKIN } from '../src/art/figures/outfits.js';
import { unword } from '../src/art/paint.js';
import { bodyOf } from '../src/art/figures/body.js';

const look = (id, faction = null, extra = {}) => wear({ outfit: 'combatSuit', weapon: 'rifle', carry: 'low', carrier: true, seed: 3, ...(id ? { helm: { id, faction } } : {}), ...extra });
const DIRS = ['down', 'up', 'left', 'right'];
const FACE = new Set(['s', 'e', 'o', 'b', 'z', 'h', 'ĥ', 'ħ']);

export default [
  {
    name: 'a look without helm is the game\'s: no helm, no extra letters, the sealed helmet\'s own drawing (the hook shut)',
    fn() {
      const L = look(null), col = coloursOf(L, 16);
      assert(L.helm === undefined && col.$fixed === undefined && col['ĵ'] === undefined, JSON.stringify({ helm: L.helm, fixed: col.$fixed }));
      const a = composeFrame(L, 'down', 'idle0', { ppm: 16 }), b = composeFrame(look(null), 'down', 'idle0', { ppm: 16 });
      const key = (f) => f.cells.map(r => r.map(c => (c ? c.ch : '.')).join('')).join('\n');
      assert(key(a) === key(b) && key(a).includes('þ'), 'today\'s visor is there');
      assert(helmOf({ id: 'nope' }) === null && helmOf(null) === null, 'an unknown candidate draws today\'s');
    },
  },
  {
    name: 'every candidate\'s template is a rectangle of letters the shading knows, in every view',
    fn() {
      const known = new Set(['.', 'a', 'A', 'þ', 'Þ', 'ĵ', 'Ĵ', 'ř', 'Ř', 'ŷ', 'Ŷ', 'l', '÷', '¢', '¬', 'ı', '§']);
      for (const id of HELM_IDS) for (const v of ['down', 'up', 'right']) {
        const rows = HELMS[id].tpl[v][2], w = new Set(rows.map(r => r.length)), odd = [...rows.join('')].filter(ch => !known.has(ch));
        assert(w.size === 1 && odd.length === 0, JSON.stringify({ id, v, widths: [...w], odd }));
      }
      console.log(`      ${HELM_IDS.length} candidates × 3 views: ${HELM_IDS.join(', ')}`);
    },
  },
  {
    name: 'every candidate hides the face and the skull in every facing at 16 and 24 px/m, its silhouette its family\'s width (17 px regular, 15 elite, the OPA\'s filters out to 19)',
    fn() {
      const out = [];
      for (const ppm of [16, 24]) for (const id of HELM_IDS) {
        let width = 0;
        for (const dir of DIRS) {
          const f = composeFrame(look(id), dir, 'idle0', { ppm }), face = [];
          f.cells.forEach((r, y) => r.forEach((c, x) => { if (c && FACE.has(c.ch)) face.push([x, y, c.ch]); }));
          assert(face.length === 0, JSON.stringify({ id, ppm, dir, face: face.slice(0, 6) }));
          const pm = shade(f.cells, coloursOf(f.look, ppm));
          assert(pm.w === f.w, 'shaded');
          if (dir === 'down') width = helmTpl(f.look.helm, 'down', bodyOf(ppm).head.w, bodyOf(ppm).head.h).rows[0].length;
        }
        if (ppm === 16) {
          const want = { regular: 17, elite: 15, opa: 19 }[HELMS[id].family];
          assert(width === want, JSON.stringify({ id, width, want }));
        }
        out.push(`${id} ${width}`);
      }
      console.log(`      head widths, px (16 px/m then 24): ${out.join(', ')}`);
    },
  },
  {
    name: 'the faction\'s trim (Mars red, the UN blue) is on the helmet, the plates and the shoulders, and only with a faction',
    fn() {
      for (const id of ['R1', 'E2']) for (const faction of [null, 'mars', 'un']) {
        const trim = faction ? FACTIONS[faction].trim : null;
        for (const dir of ['down', 'up']) {
          const f = composeFrame(look(id, faction), dir, 'idle0', { ppm: 16 }), pm = shade(f.cells, coloursOf(f.look, 16));
          const at = (c) => { let n = 0; for (const v of pm.data) if ((v >>> 24) >= 128 && unword(v).hex === c) n++; return n; };
          const helmetRows = f.cells.findIndex(r => r.some(c => c && 'aA'.includes(c.ch)));
          let onHead = 0, onBody = 0;
          f.cells.forEach((r, y) => r.forEach((c) => { if (c?.ch === '§') (y < helmetRows + 13 ? onHead++ : onBody++); }));
          const shoulder = f.look.accents.band;
          if (faction) {
            assert(at(trim) >= 10 && onHead >= 5 && onBody >= 4 && shoulder === trim, JSON.stringify({ id, faction, dir, px: at(trim), onHead, onBody }));
            if (dir === 'down') console.log(`      ${id} ${faction} from the front: ${at(trim)} trim pixels (${onHead} on the helmet, ${onBody} below it)`);
          } else {
            const any = Object.values(FACTIONS).reduce((n, F) => n + at(F.trim), 0);
            assert(any === 0 && onHead === 0 && onBody === 0 && shoulder !== FACTIONS.mars.trim, JSON.stringify({ id, dir, any, onHead, onBody }));
          }
        }
      }
    },
  },
  {
    name: 'on the card\'s doll every candidate hides the face (no skin in the head\'s box), and the trim shows only with a faction (never on the OPA, who are neither)',
    fn() {
      const S = flesh(SKIN.tan), skin = new Set([S.light, S.soft, S.base, S.shade, S.deep]);
      const counts = [];
      for (const id of HELM_IDS) {
        const plain = doll({ look: { outfit: 'combatSuit', carrier: true, helm: { id } }, scale: 1 });
        const mars = doll({ look: { outfit: 'combatSuit', carrier: true, helm: { id, faction: 'mars' } }, scale: 1 });
        const count = (pm, test, y1 = 34) => { let n = 0; for (let y = 0; y < y1; y++) for (let x = 14; x < 50; x++) if (test(unword(pm.data[y * pm.w + x]).hex)) n++; return n; };
        const sk = count(plain, c => skin.has(c)), red = count(mars, c => c === FACTIONS.mars.trim, 70), red0 = count(plain, c => c === FACTIONS.mars.trim, 70);
        // (the OPA take no faction's trim: they are neither Mars nor the UN)
        const opa = HELMS[id].family === 'opa';
        assert(sk === 0 && red0 === 0 && (opa ? red === 0 : red > 20), JSON.stringify({ id, skin: sk, trim: red, trimWithout: red0 }));
        counts.push(`${id} ${red}`);
      }
      console.log(`      no skin under any candidate; Mars red trim pixels on the doll's head and chest (the OPA none): ${counts.join(', ')}`);
    },
  },
  // ---- v0.0.20: one helmet in one place (the build sheet v0.0.20 item 22; user.md U-8) ----
  {
    name: 'one helmet in one place: with HELMET_DRAWN_AS.regular set to a candidate, the world figure, the doll and the card\'s man (a dressed doll) each draw its pixels, as a look that names it does; unset, v0.0.19\'s (the user, 2026-11-15: "The helmet design is pretty goofy": the pick lands in one line)',
    fn() {
      const dig = (data) => { let h = 2166136261 >>> 0; for (let i = 0; i < data.length; i++) { h ^= data[i] & 255; h = Math.imul(h, 16777619) >>> 0; } return h.toString(16); };
      const base = { outfit: 'combatSuit', weapon: 'rifle', carry: 'low', carrier: true, seed: 3 };
      const fig = (L) => { const f = composeFrame(wear(L), 'down', 'idle0', { ppm: 16 }); return dig(shade(f.cells, coloursOf(f.look, 16)).data); };
      const dl = (L) => dig(doll({ look: L, sex: 'm', outfit: 'combatSuit' }).data);
      const gear = { outfit: 'combatSuit', suit: { model: 'ces-1', colour: null, helm: null }, carrier: null, ears: null, rifle: null, pistol: null, thigh: null, held: null, devices: [], painted: false, mask: null, hands: null };
      const card = (L) => { clearDolls(); return dig(dressedDoll(gear, { look: L, sex: 'm' }).data); };
      const was = HELMET_DRAWN_AS.regular, rows = {};
      try {
        HELMET_DRAWN_AS.regular = null;
        rows.unset = { fig: fig(base), doll: dl(base), card: card(base) };
        rows.named = { fig: fig({ ...base, helm: { id: 'R1', faction: 'mars' } }), doll: dl({ ...base, helm: { id: 'R1', faction: 'mars' } }), card: card({ ...base, helm: { id: 'R1', faction: 'mars' } }) };
        HELMET_DRAWN_AS.regular = 'R1';
        rows.drawnAs = { fig: fig(base), doll: dl(base), card: card(base) };
      } finally { HELMET_DRAWN_AS.regular = was; clearDolls(); }
      console.log(`      the figure, the doll, the card's man: unset ${JSON.stringify(rows.unset)}; a look naming R1 ${JSON.stringify(rows.named)}; HELMET_DRAWN_AS.regular 'R1' ${JSON.stringify(rows.drawnAs)}; helmFor's R1 ${JSON.stringify(helmFor({ pick: 'R1' }))}, its O1 on you ${JSON.stringify(helmFor({ pick: 'O1', slot: 0 }))}, on your #2 ${JSON.stringify(helmFor({ pick: 'O1', slot: 1 }))}`);
      for (const k of ['fig', 'doll', 'card']) assert(rows.drawnAs[k] === rows.named[k] && rows.drawnAs[k] !== rows.unset[k], `${k}: ${JSON.stringify(rows)}`);
      assert(was === null && helmFor({ pick: 'O1', slot: 0 }) === null && helmFor({ pick: 'O1', slot: 1 })?.id === 'O1', 'nothing drawn as until picked; the OPA on your #2 alone');
    },
  },
];
