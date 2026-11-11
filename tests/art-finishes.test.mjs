// The rifles' finishes (quick; src/data/finishes.js; the user, 2026-11-08, of the standard issue's sample: "Make sure we have multiple
// colors so we can equip ourselves to camo in environments depending on deployments").
//
// Seven finishes, the issue's black first, every colour of each a Mars palette colour (so the stage's snap leaves it as drawn); Mars
// rust is the regolith's own red dust, its base the valley floor's colour and the least seen of all on it; a coloured magazine's
// window stands at least 1.8:1 off its body, so the believed rounds and an empty window still read. A gun item carries `finish`
// only when it is not the issue's: newGun writes none for black, writes a camouflage, refuses an unknown one; materialise issues a
// squad's rifle in one finish and changes nothing else of its kit; the saves of v0.0.7 and v0.0.9 load with every rifle in black
// and save again byte for byte, and no scene issues a finish. The wiring in node: a rifle issued in Mars rust shows rust on the
// weapon card painted from the item's finish (finishOf, never the belief) and on the figure drawn from gunLook's finish (the page's
// own wiring, main.js and view.js, is ui-finish's, heavy).
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';
import { assert, fmt, root } from './helpers.mjs';
import { FINISHES, FINISH_IDS, ISSUE_FINISH, finishId, isFinish } from '../src/data/finishes.js';
import { PALETTES } from '../src/art/palette.js';
import { GROUND } from '../src/art/terrain/ground.js';
import { newGun, finishOf, beliefOf } from '../src/sim/arms/firearms.js';
import { materialise } from '../src/sim/arms/kit.js';
import { gunLook } from '../src/sim/arms/look.js';
import { paintWeaponCard } from '../src/art/weaponcard.js';
import { composeFrame } from '../src/art/figures/compose.js';
import { shade } from '../src/art/figures/shade.js';
import { wear, coloursOf } from '../src/art/figures/outfits.js';
import { armsWorld } from './arms-world.mjs';
import { createGame } from './game.mjs';

// (WCAG's relative luminance and contrast of two 0xrrggbb colours)
const relLum = (c) => { const ch = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * ch((c >> 16) & 255) + 0.7152 * ch((c >> 8) & 255) + 0.0722 * ch(c & 255); };
const contrast = (a, b) => { const [x, y] = [relLum(a), relLum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const hex = (c) => `#${c.toString(16).padStart(6, '0')}`;
const rgb = (v) => ((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff);
const read = (name) => gunzipSync(readFileSync(path.join(root, 'tests', 'saves', `${name}.json.gz`))).toString('utf8');
const guns = (s) => Object.entries(s.items).filter(([, it]) => it.type === 'gun');

export default [
  {
    name: 'seven finishes, the issue\'s black first (black, flat dark earth, Mars rust, Earth desert, Europa ice, Earth woodland, urban grey), every colour a Mars palette colour; Mars rust is the regolith\'s own (base 0xa65e4b) and the least seen on it; every coloured magazine\'s window at least 1.8:1 off its body',
    fn() {
      assert(FINISH_IDS.join() === 'black,fde,mars,desert,ice,woodland,urban' && ISSUE_FINISH === 'black' && FINISH_IDS[0] === ISSUE_FINISH, FINISH_IDS.join());
      for (const f of FINISH_IDS) {
        const F = FINISHES[f], cols = [F.FL, F.F, F.FD, F.FDD, F.B, F.BL, ...Object.values(F.mag)];
        for (const c of cols) assert(PALETTES.mars.includes(c), `${f}: ${hex(c)} is not a Mars colour`);
      }
      const onGround = FINISH_IDS.map(f => [f, contrast(FINISHES[f].F, GROUND.regolith)]);
      const windows = FINISH_IDS.filter(f => FINISHES[f].mag.body !== FINISHES.black.mag.body).map(f => [f, contrast(FINISHES[f].mag.win, FINISHES[f].mag.body)]);
      console.log(`      on the regolith ${hex(GROUND.regolith)}: ${onGround.map(([f, k]) => `${f} ${fmt(k, 2)}:1`).join(', ')}`);
      console.log(`      the coloured magazines' windows against their bodies: ${windows.map(([f, k]) => `${f} ${fmt(k, 2)}:1`).join(', ')}`);
      assert(FINISHES.mars.F === GROUND.regolith && onGround.every(([f, k]) => f === 'mars' || k >= onGround.find(x => x[0] === 'mars')[1]), JSON.stringify(onGround));
      assert(windows.length >= 4 && windows.every(([, k]) => k >= 1.8), JSON.stringify(windows));
      assert(finishId('nonesuch') === 'black' && finishId(undefined) === 'black' && finishId('ice') === 'ice' && isFinish('woodland') && !isFinish('vacuum') && !isFinish('toString'), 'finishId and isFinish');
    },
  },
  {
    name: 'Earth desert and Europa ice part on the figure (the judge\'s crops of 2026-11-11: both rifles near white at 16 px/m): desert\'s figure is one step under its card, a warm sand at least 1.3:1 off ice\'s cool grey, every figure tone a Mars colour; the cards keep their own ramps',
    fn() {
      const fig = (f) => FINISHES[f].fig ?? FINISHES[f], rows = [];
      for (const f of FINISH_IDS) for (const c of [fig(f).FL, fig(f).F, fig(f).FD]) assert(PALETTES.mars.includes(c), `${f}: the figure's ${hex(c)} is not a Mars colour`);
      const card = contrast(FINISHES.desert.F, FINISHES.ice.F), figure = contrast(fig('desert').F, fig('ice').F);
      const warm = (c) => ((c >> 16) & 255) - (c & 255);
      rows.push(`desert against ice: the card ${fmt(card, 2)}:1, the figure ${fmt(figure, 2)}:1 (desert ${hex(fig('desert').F)}, ice ${hex(fig('ice').F)}); red less blue ${warm(fig('desert').F)} against ${warm(fig('ice').F)}`);
      rows.push(`with a figure ramp of its own: ${FINISH_IDS.filter(f => FINISHES[f].fig).join(', ')}`);
      for (const r of rows) console.log(`      ${r}`);
      assert(figure >= 1.3 && figure > card && warm(fig('desert').F) > 0 && warm(fig('ice').F) < 0, rows[0]);
      assert(FINISHES.desert.fig.FL === FINISHES.desert.F && FINISHES.desert.fig.F === FINISHES.desert.FD && FINISHES.desert.fig.FD === FINISHES.desert.FDD, 'desert\'s figure a step under its card');
    },
  },
  {
    name: 'the gun item\'s finish: newGun writes no field for the issue\'s black (none given or "black"), writes a camouflage, refuses an unknown one; materialise issues the squad\'s rifle in its finish and nothing else of the kit changes; finishOf reads an absent field as black',
    fn() {
      const W = armsWorld(), s = W.state;
      const a = newGun(s), b = newGun(s, { finish: 'black' }), c = newGun(s, { finish: 'mars' });
      assert(!('finish' in s.items[a]) && !('finish' in s.items[b]) && s.items[c].finish === 'mars', JSON.stringify([s.items[a], s.items[c]]));
      assert(finishOf(s.items[a]) === 'black' && finishOf(s.items[c]) === 'mars' && finishOf(null) === 'black' && finishOf({ finish: 'nonesuch' }) === 'black', 'finishOf');
      let refused = null;
      try { newGun(s, { finish: 'vacuum' }); } catch (e) { refused = e.message; }
      assert(refused && /no finish 'vacuum'/.test(refused), String(refused));
      // (one kit per squad: the same template issued in black and in woodland differs in the rifle's finish alone)
      const k1 = armsWorld(), k2 = armsWorld();
      const blackKit = materialise(k1.state, 'p2', 'range-fam'), woodKit = materialise(k2.state, 'p2', 'range-fam', { finish: 'woodland' });
      const strip = (st) => JSON.stringify(st.items, (k, v) => (k === 'finish' ? undefined : v));
      console.log(`      new guns: ${JSON.stringify(s.items[a])} | ${JSON.stringify(s.items[c])}; refused: "${refused}"; the coach's kit in woodland: gun ${woodKit.gunId} ${JSON.stringify(k2.state.items[woodKit.gunId].finish)}, in black ${JSON.stringify(k1.state.items[blackKit.gunId].finish)}`);
      assert(k2.state.items[woodKit.gunId].finish === 'woodland' && !('finish' in k1.state.items[blackKit.gunId]) && strip(k1.state) === strip(k2.state), 'the kits differ past the finish');
    },
  },
  {
    name: 'no field for black, so nothing old moves: no scene issues a finish (test-handling, test-range, test-stress), and the v0.0.7 and v0.0.9 saves load with every rifle in black and save again byte for byte',
    fn() {
      const rows = [];
      for (const scenario of ['test-handling', 'test-range', 'test-stress']) {
        const g = createGame({ scenario, seed: 48213 }), gs = guns(g.state);
        rows.push(`${scenario}: ${gs.length} guns, finishes ${[...new Set(gs.map(([, it]) => finishOf(it)))].join(', ')}`);
        assert(gs.length && gs.every(([, it]) => !('finish' in it)), rows.at(-1));
      }
      for (const name of ['v0.0.7-range-confirm', 'v0.0.9-pairs-standby']) {
        const json = read(name), old = JSON.parse(json);
        const g = createGame({ scenario: old.meta.scenario, seed: 48213 }), s = g.load(json), again = g.save();
        const h = createGame({ scenario: old.meta.scenario, seed: 48213 });
        h.load(again);
        const gs = guns(s);
        rows.push(`${name}: ${gs.length} guns, all ${[...new Set(gs.map(([, it]) => finishOf(it)))].join(', ')}; saved again ${h.save() === again ? 'byte for byte' : 'DIFFERENT'}`);
        assert(gs.length && gs.every(([, it]) => finishOf(it) === 'black' && !('finish' in it)) && h.save() === again && !g.errors.length, rows.at(-1));
      }
      for (const r of rows) console.log(`      ${r}`);
    },
  },
  {
    name: 'a rifle issued in Mars rust shows rust: on the weapon card painted with the item\'s finish (finishOf, never read from the belief), and on the figure drawn from gunLook\'s finish; in black, none on either',
    fn() {
      const RUST = FINISHES.mars.F, rows = [];
      for (const finish of ['mars', null]) {
        const W = armsWorld(), s = W.state;
        if (finish) s.items[W.gunId].finish = finish;           // (as materialise's finish writes it: see the test above)
        const gun = s.items[W.gunId], belief = beliefOf(s, W.gunId);
        assert(!('finish' in belief), 'the belief carries no finish');
        const card = paintWeaponCard({ model: belief.model, finish: finishOf(gun), belief });
        let cardRust = 0;
        for (const v of card.data) if (rgb(v) === RUST) cardRust++;
        const gl = gunLook(s, W.actor), L = wear({ outfit: 'utilities', weapon: 'rifle', carry: 'aim', ...(gl.finish ? { finish: gl.finish } : {}) }), col = coloursOf(L, 16);
        let figRust = 0;
        for (const frame of ['aim', 'prone']) { const pm = shade(composeFrame(L, 'right', frame, { ppm: 16 }).cells, col); for (const v of pm.data) if ((v >>> 24) >= 128 && rgb(v) === RUST) figRust++; }
        rows.push(`${finish ?? 'black'}: gunLook's finish ${gl.finish ?? '(none)'}; ${cardRust} rust pixels on the card, ${figRust} on the figure aimed and prone`);
        if (finish) assert(gl.finish === 'mars' && cardRust > 300 && figRust > 4, rows.at(-1));
        else assert(!('finish' in gl) && cardRust === 0 && figRust === 0, rows.at(-1));
      }
      for (const r of rows) console.log(`      ${r}`);
    },
  },
];
