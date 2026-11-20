// OLYMPUS tests: look-sealed, the sealed combat EVA suit's one look (the build sheet v0.0.27 item 16, §3.5, §6 E, §11 risk 8; F165's atlas half).
//
// "Away the boarding party" puts four marines and up to four armed men on one deck. Every person was his own look (src/sim/people/
// figure.js lookFor keyed his skin, his hair and his seed), and a look that handles a rifle takes a sheet of the atlas's rifle pool
// (6 at 16 px/m with RIFLE_SLOTS_MIN 4): the deck's 4 + 4 aimed at once would be 8 and two would swap sheets mid-fight (SH§9.2). In
// the sealed combat suit (outfit 'combatSuit', the visor down) nothing of the man is drawn, so lookFor leaves the three out: every
// marine in the suit is one spec (SEALED_LOOK), and the four with one weapon and carry share one sheet. Render only. These tests hold
// that the stage's figure and the doll paint the same pixels whatever the skin, hair, hair's step or seed under the suit (so leaving
// them out changes no picture), that lookFor gives one object for any two marines in the suit and still one per person in any other
// outfit, and print the rifle pool's sheets against the deck's need. Quick. Fails on v0.0.26's lookFor (one spec a person).
import { assert } from './helpers.mjs';
import { lookFor, SEALED_LOOK } from '../src/sim/people/figure.js';
import { paintSheet, sheetLayout } from '../src/art/figures/atlas.js';
import { doll } from '../src/art/doll/doll.js';
import { dressOf } from '../src/art/doll/dress.js';
import { registerHooks } from 'node:module';

// (the page's import map in node: render/figures.js imports 'three' by its bare name, here the vendored build, as render-devices does)
const THREE_URL = new URL('../vendor/three/build/three.module.js', import.meta.url).href;
registerHooks({ resolve: (spec, ctx, next) => (spec === 'three' ? { url: THREE_URL, shortCircuit: true } : next(spec, ctx)) });
const { RIFLE_SLOTS_MIN, ATLAS_PX } = await import('../src/render/figures.js');

// (two marines as unlike as the roster makes them, and a third with nothing but the outfit)
const A = Object.freeze({ skin: 'light', hair: { style: 'medReg', color: 'blond' }, seed: 5, sex: 'm' });
const B = Object.freeze({ skin: 'dark', hair: { style: 'highTight', color: 'black' }, seed: 91, sex: 'f' });
const ARMED = Object.freeze({ weapon: 'rifle', carry: 'low', carrier: true, boots: 'mag' });
const GEAR = Object.freeze({ outfit: 'combatSuit', suit: { model: 'ces-1', colour: 'black', helm: null }, carrier: { model: 'pc-m3', pouches: [] }, ears: null, rifle: { model: 'r7', finish: null, place: 'ready', mag: true }, pistol: null, thigh: null, held: null, devices: [], painted: false, mask: null, hands: null, device: null, boots: 'mag', anchor: null });
const diffs = (a, b) => { let n = 0; for (let i = 0; i < a.data.length; i++) if (a.data[i] !== b.data[i]) n++; return n + Math.abs(a.data.length - b.data.length); };
// (the rifle pool's sheets an atlas holds at a density: render/figures.js createFigures' rule, rows given up for RIFLE_SLOTS_MIN)
function rifleSlots(ppm, atlasPx = ATLAS_PX) {
  const lay = sheetLayout(ppm), RL = lay.pools.rifle, RCOLS = Math.max(1, Math.floor(atlasPx / RL.w));
  let ROWS = Math.floor(atlasPx / lay.h);
  while (ROWS > 1 && Math.floor((atlasPx - ROWS * lay.h) / RL.h) * RCOLS < RIFLE_SLOTS_MIN) ROWS--;
  return { base: Math.floor(atlasPx / lay.w) * ROWS, rifle: RCOLS * Math.floor((atlasPx - ROWS * lay.h) / RL.h) };
}

export default [
  {
    name: 'two marines of different skins, hair and seeds in the sealed combat suit share one look: lookFor gives them one object (SEALED_LOOK, its key the outfit alone) under a roof or not and at any hair\'s step, while in utilities each keeps his own; the stage paints the suit\'s arms and shock bands pixel for pixel alike at 16 px/m, and the doll alike',
    fn() {
      const la = lookFor(A, 'combatSuit', false, 0), lb = lookFor(B, 'combatSuit', true, 2);
      assert(la === lb && la === SEALED_LOOK && JSON.stringify(la) === '{"outfit":"combatSuit"}', JSON.stringify({ la, lb }));
      const ua = lookFor(A, 'utilities'), ub = lookFor(B, 'utilities');
      assert(ua !== ub && ua.skin === 'light' && ub.skin === 'dark' && ua.seed === 5, JSON.stringify({ ua, ub }));
      const rows = [];
      // (the bands where a face, a hand or the hair would show: the arms' aims, fire and hands up, the shock band's
      // blind fire and the 0 G down, at the stage's density: within the quick file's budget)
      for (const [ppm, bands] of [[16, ['arms', 'stanceShock']]]) {
        const pa = paintSheet({ outfit: 'combatSuit', ...A, ...ARMED }, { ppm, bands }), pb = paintSheet({ outfit: 'combatSuit', ...B, hair: { ...B.hair, step: 2 }, ...ARMED }, { ppm, bands }), ps = paintSheet({ ...SEALED_LOOK, ...ARMED }, { ppm, bands });
        const d1 = diffs(pa, pb), d2 = diffs(pa, ps);
        rows.push(`${ppm} px/m: ${pa.w}×${pa.h}, ${d1} pixels differ between the two men and ${d2} between a man and the sealed look`);
        assert(d1 === 0 && d2 === 0, rows.at(-1));
      }
      const da = doll({ ...dressOf(GEAR, { look: A, sex: 'm' }), scale: 1 }), db = doll({ ...dressOf(GEAR, { look: B, sex: 'm' }), scale: 1 }), ds = doll({ ...dressOf(GEAR, { look: SEALED_LOOK, sex: 'm' }), scale: 1 });
      const dd = diffs(da, db) + diffs(da, ds);
      rows.push(`the doll ${da.w}×${da.h}: ${dd} pixels differ`);
      assert(dd === 0, rows.at(-1));
      for (const r of rows) console.log(`      ${r}`);
    },
  },
  {
    name: 'the boarding\'s rifle pool: four marines with one weapon and carry take one look and so one rifle sheet, and with the deck\'s four armed men five of the six sheets at 16 px/m (RIFLE_SLOTS_MIN 4 kept, base slots unchanged); a look a person, as before, would need eight',
    fn() {
      const marines = ['a', 'b', 'c', 'd'].map((k, i) => lookFor({ skin: i % 2 ? 'dark' : 'tan', hair: { style: 'lowReg', color: 'dark' }, seed: 100 + i }, 'combatSuit'));
      const men = [1, 2, 3, 4].map(i => lookFor({ skin: 'brown', hair: { style: 'medium', color: 'black' }, seed: 200 + i }, 'beltCoverall'));
      const looks = new Set([...marines, ...men].map(L => JSON.stringify({ ...L, ...ARMED }))), S16 = rifleSlots(16), S24 = rifleSlots(24);
      console.log(`      the atlas at 16 px/m: base ${S16.base}, rifle ${S16.rifle} (at 24: base ${S24.base}, rifle ${S24.rifle}; RIFLE_SLOTS_MIN ${RIFLE_SLOTS_MIN}); the deck's aimed looks ${looks.size} (four marines as one, four armed men), a look a person ${marines.length + men.length}`);
      assert(new Set(marines).size === 1 && looks.size === 5 && looks.size <= S16.rifle && RIFLE_SLOTS_MIN === 4 && S16.base === 40, JSON.stringify({ looks: looks.size, S16 }));
    },
  },
];
