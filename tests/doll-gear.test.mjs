// OLYMPUS tests: the close figure drawn from the gear (src/art/doll/doll.js, worn.js, dress.js; VIEWS §4.2, §4.3; the build sheet
// 0.0.18 §2.2, §5.2). The user's ask of 2026-11-15: "the I and C menu preview of the character should show the currently worn
// gear". Without gear the doll is v0.0.17's to the pixel (stage C0's digests, recorded on v0.0.17 before any edit), but for the
// combat EVA suit, which v0.0.17 never drew (8960 of 8960 pixels the utilities'); with gear each thing worn is where it is worn,
// the magazines in a pouch shown by their baseplates, and a dressed doll paints within a frame's budget.
import { assert, fmt, machineK } from './helpers.mjs';
import { golden } from './golden.mjs';
import { doll, DOLL_SCALE } from '../src/art/doll/doll.js';
import { dressOf, dressedDoll, clearDolls, DOLL_LRU } from '../src/art/doll/dress.js';
import { PLATE_C, stampCount } from '../src/art/doll/worn.js';
import { HIT_SCALE, figGeom, HIT_BANDS } from '../src/art/doll/hitcard.js';
import { COMBAT_SUIT } from '../src/art/figures/outfits.js';
import { HELMET_DRAWN_AS } from '../src/art/figures/helmets.js';
import { word } from '../src/art/paint.js';
import { createGame } from './game.mjs';
import { gearOf } from '../src/sim/arms/gear.js';

/** The paint budget of a dressed doll at the hit card's near band, the rifle's stamp cached (the sheet's DOLL_CEIL_MS: 4 ms × k). */
const DOLL_CEIL_MS = 4;
const board = (face, holds, scale = HIT_SCALE) => { const look = face === 'armoured' ? { outfit: 'carrier', skin: 'tan', hair: { style: 'highTight', color: 'dark' } } : { outfit: 'utilities', skin: face === 'noshoot' ? 'light' : 'tan', head: null, hair: { style: 'medium', color: 'dark' } }; return { look, sex: 'm', hand: holds === 'rifle' || face === 'armoured' ? 'rifle' : null, scale }; };
// (stage C0: v0.0.17's dolls, recorded on its code before any edit; the cases' digests below are its)
const C0 = Object.freeze({
  utilities: [{}, '052a7a7cd0d75d'], 'utilities-f': [{ sex: 'f' }, '1bda1c58d043d0'], 'utilities-rifle': [{ hand: 'rifle' }, '1248be321a93d9'],
  'utilities-rifle-s2': [{ hand: 'rifle', scale: 2 }, '1368ee03702801'], 'utilities-rifle-finish': [{ hand: 'rifle', look: { finish: 'fde' } }, '15c80392cd88dd'],
  nco: [{ look: { outfit: 'nco' } }, '1a4e9456a1d7c3'], 'carrier-free': [{ look: { outfit: 'carrier' } }, '0c31977163c824'],
  'carrier-used': [{ look: { outfit: 'carrier' }, marks: { carrier: ['used', 'used', 'free'], belt: ['used', 'shows'], radio: ['free'], chest: ['used'], trousers: ['free', 'used'] } }, '0a955f51207890'],
  pt: [{ look: { outfit: 'pt' } }, '14b15f0bad2e30'], 'towel-m': [{ look: { outfit: 'towel' } }, '180dfd25e4ae43'], 'towel-f': [{ look: { outfit: 'towel' }, sex: 'f' }, '0ff355dc6cb70d'],
  vac: [{ look: { outfit: 'vac' } }, '018a840426d896'], vacOpen: [{ look: { outfit: 'vacOpen' } }, '05a51f40cb79ef'],
  cues: [{ body: { wetK: 0.5, grimeK: 0.4, sweatK: 0.6, stubbleK: 0.5, tiredK: 0.7, bladderK: 0.8, hungerK: 0.8, handsK: 0.5, handsWhy: 'rifle' } }, '1b137350833c30'],
  wounds: [{ wounds: { wounds: [{ n: 1, part: 'torso', kind: 'hole', bleed: 2 }, { n: 2, part: 'armR', kind: 'cut', bleed: 1 }], tourniquets: ['legL'], splints: [], bloody: { clothes: true } } }, '18302fbeb77d84'],
  // (v0.0.24 F, the four suits re-recorded: the combat EVA suit's gloves grey, outfits.js COMBAT_SUIT.glove, the user's note of
  // 2026-11-19 "maybe gray gloves would be better for this color suit"; the gloves alone moved; was '1a527882c445c5', '0ae7c0b5d1fde1',
  // '127433f0648f18', '13d12d834339e7')
  'R1-suit-carrier': [{ look: { outfit: 'combatSuit', helm: 'R1', carrier: true } }, '14b011d702999b'], 'R4-suit': [{ look: { outfit: 'combatSuit', helm: 'R4' } }, '00a3bbe60767e4'],
  'E1-suit-carrier': [{ look: { outfit: 'combatSuit', helm: 'E1', carrier: true } }, '018d1458505273'], 'O1-suit-carrier': [{ look: { outfit: 'combatSuit', helm: { id: 'O1' }, carrier: true } }, '15113eb654c9d6'],
  'board-threat-rifle': [board('threat', 'rifle'), '1a5ce83c21d700'], 'board-armoured': [board('armoured', 'rifle'), '1a80a5502269cd'], 'board-noshoot-hands': [board('noshoot', 'hands'), '07915b42f5968e'],
  'board-threat-rifle-mid': [board('threat', 'rifle', 80 / 72), '11bc280f56468b'], 'board-threat-rifle-far': [board('threat', 'rifle', 64 / 72), '1c4aa8eaafb248'],
});
/** v0.0.17's combat EVA suit: the utilities' digest (the bug), and the suit's now (re-set on purpose in 0.0.18: the suit drawn). */
// (v0.0.24 F: SUIT_NOW re-recorded, the user's picks of 2026-11-19: the Corps' regular R3 in the Mars trim on the combat EVA suit (helmets.js
// HELMET_DRAWN_AS, "R2, R3 and R4 are very good for military") and its gloves grey; was '03bebef2bbc0f6', the sealed head)
const SUIT_V017 = '052a7a7cd0d75d', SUIT_NOW = '04cad96b23b113';
const ME = (over = {}) => ({ outfit: 'combatSuit', suit: { model: 'ces-1', colour: 'black', helm: null }, carrier: { model: 'pc-m3', pouches: [{ key: 'p1', holds: 2, mags: 1 }, { key: 'p2', holds: 2, mags: 1 }, { key: 'dump', holds: 4, mags: 0 }] }, ears: null, rifle: { model: 'r7', finish: null, place: 'ready', mag: true }, pistol: { model: 'p12', place: 'holster', mag: true }, thigh: { holds: 2, mags: 1 }, held: null, painted: false, ...over });
const PERSON = { look: { skin: 'tan', hair: { style: 'medReg', color: 'dark' }, head: null }, sex: 'm' };
const paint = (gear, scale = DOLL_SCALE) => doll({ ...dressOf(gear, PERSON), scale });
// (the pixels two dolls differ in, inside a reference box [x0, y0, x1, y1] (doll rows after its drop), at the doll's scale)
function diffIn(a, b, box = null) {
  let n = 0;
  for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) {
    if (box) { const rx = x / a.scale, ry = y / a.scale - 2; if (rx < box[0] || rx > box[1] || ry < box[2] || ry > box[3]) continue; }
    if (a.data[y * a.w + x] !== b.data[y * b.w + x]) n++;
  }
  return n;
}
const countC = (pm, c, box) => { const w = word(c); let n = 0; for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) { const rx = x / pm.scale, ry = y / pm.scale - 2; if (box && (rx < box[0] || rx > box[1] || ry < box[2] || ry > box[3])) continue; if (pm.data[y * pm.w + x] === w) n++; } return n; };

export default [
  {
    name: 'a doll without gear is v0.0.17\'s to the pixel for every outfit but the combat EVA suit: golden digests of utilities, nco, the carrier (marks free and used), pt, the towel, vac, vacOpen, four helmet candidates and the board\'s threat and armoured faces (stage C0, recorded on v0.0.17)',
    fn() {
      for (const [name, [args, dig]] of Object.entries(C0)) golden(`doll C0 ${name}`, doll({ scale: DOLL_SCALE, ...args }).data, dig);
      console.log(`      ${Object.keys(C0).length} dolls as v0.0.17 drew them, the rifle from worn.js rifleStamp's memo (${stampCount()} stamps)`);
    },
  },
  {
    name: 'the combat EVA suit is drawn when worn, its helmet and all (the Corps\' R3 from v0.0.24, the sealed head before), indoors too (v0.0.17 drew the utilities, 8960 of 8960 pixels the same, and took the helmet off under the Wheel\'s roof)',
    fn() {
      const suit = doll({ look: { outfit: 'combatSuit' }, scale: DOLL_SCALE }), util = doll({ look: { outfit: 'utilities' }, scale: DOLL_SCALE });
      const indoors = doll({ look: { outfit: 'combatSuit', head: null }, scale: DOLL_SCALE });
      // (v0.0.24: the head is the game's helmet, HELMET_DRAWN_AS.regular in the Corps' trim, pixel for pixel the doll of a look naming it)
      const named = doll({ look: { outfit: 'combatSuit', helm: { id: HELMET_DRAWN_AS.regular, faction: 'mars' } }, scale: DOLL_SCALE });
      const n = diffIn(suit, util), shell = countC(suit, COMBAT_SUIT.shell), head = diffIn(suit, util, [20, 44, 8, 24]);
      console.log(`      ${n} of ${suit.w * suit.h} pixels differ from the utilities'; the suit's shell ${shell} px, the head ${head} px apart from the utilities' cover, the doll naming ${HELMET_DRAWN_AS.regular} ${diffIn(suit, named)} px apart; indoors (head: null) ${diffIn(suit, indoors)} px moved`);
      golden('doll the combat EVA suit', suit.data, SUIT_NOW);
      assert(SUIT_NOW !== SUIT_V017 && n > 2000 && shell > 200 && head > 40 && diffIn(suit, named) === 0, JSON.stringify({ n, shell, head }));
      assert(diffIn(suit, indoors) === 0, 'the helmet stays on under a roof');
      // (and through the gear, with the indoor rule's head: null on the person's look)
      const dressed = paint(ME({ carrier: null, rifle: null, pistol: null, thigh: null }));
      assert(diffIn(dressed, suit, [20, 44, 8, 24]) === 0, 'dressOf drops the indoor rule for a suit');
    },
  },
  {
    name: 'each thing worn is drawn where it is worn: the carrier\'s pouches by the kit\'s list (two and a dump, or three), the holster on the right thigh with the P-12\'s grip in it or empty, the pistol pouch below it, the ear defenders\' cups, the rifle across the chest slung front, over the shoulder slung back, in both hands at the ready',
    fn() {
      const bare = paint(ME({ carrier: null, rifle: null, pistol: null, thigh: null })), me = paint(ME()), rows = [];
      const R = { chest: [14, 50, 30, 54], belt: [12, 52, 55, 66], holsterR: [10, 26, 56, 86], thighPouch: [10, 26, 85, 97], ears: [16, 48, 10, 21], overShoulder: [40, 60, 8, 26], lowRight: [44, 64, 60, 100] };
      const at = (pm, why) => { const o = Object.fromEntries(Object.entries(R).map(([k, b]) => [k, diffIn(pm, bare, b)])); rows.push(`${why}: ${Object.entries(o).map(([k, v]) => `${k} ${v}`).join(', ')}`); return o; };
      const full = at(me, 'the house kit');
      assert(full.chest > 40 && full.holsterR > 30 && full.thighPouch > 10, JSON.stringify(full));
      const drawnOut = at(paint(ME({ pistol: { model: 'p12', place: 'ready', mag: true } })), 'P-12 drawn');
      assert(diffIn(paint(ME({ pistol: { model: 'p12', place: 'ready', mag: true } })), me, R.holsterR) > 0, 'the holster\'s mouth open with the pistol out');
      const front = at(paint(ME({ rifle: { model: 'r7', finish: null, place: 'front', mag: true }, pistol: { model: 'p12', place: 'holster', mag: true } })), 'slung front');
      const back = at(paint(ME({ rifle: { model: 'r7', finish: null, place: 'back', mag: true } })), 'slung back');
      assert(back.overShoulder > 0 && back.lowRight < front.lowRight, JSON.stringify({ back, front }));
      const ready = at(me, 'at the ready');
      assert(ready.lowRight > 20, JSON.stringify(ready));
      const util = paint({ ...ME(), outfit: 'utilities', suit: null, ears: 'cups', pistol: null, thigh: null }), utilBare = paint({ ...ME(), outfit: 'utilities', suit: null, ears: null, pistol: null, thigh: null });
      const ears = diffIn(util, utilBare, R.ears);
      rows.push(`ear defenders on the utilities: ${ears} px at the ears`);
      assert(ears > 20, `${ears}`);
      // (three chest pouches against two: a third pouch's place drawn)
      const three = paint(ME({ carrier: { model: 'pc-m3', pouches: [{ key: 'p1', holds: 2, mags: 2 }, { key: 'p2', holds: 2, mags: 2 }, { key: 'p3', holds: 2, mags: 2 }] } }));
      rows.push(`three pouches against two and a dump: ${diffIn(three, me, R.chest)} px of the chest`);
      assert(diffIn(three, me, R.chest) > 10, 'three pouches');
      void drawnOut;
      for (const r of rows) console.log(`      ${r}`);
    },
  },
  {
    name: 'a magazine pouch shows a baseplate for each magazine in it (VIEWS §4.2: two when full, one when half), the dump pouch sags by what it holds, an empty pouch shows only its seam',
    fn() {
      const lit = (gear, box) => countC(paint(gear), PLATE_C.lit, box);
      const chest = [14, 50, 36, 46], dump = [38, 56, 50, 70];
      const pouches = (a, b, d) => ({ model: 'pc-m3', pouches: [{ key: 'p1', holds: 2, mags: a }, { key: 'p2', holds: 2, mags: b }, { key: 'dump', holds: 4, mags: d }] });
      const counts = [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]].map(([a, b]) => [a + b, lit(ME({ carrier: pouches(a, b, 0) }), chest)]);
      console.log(`      the chest's lit baseplate pixels by magazines in: ${counts.map(([n, px]) => `${n}: ${px}`).join(', ')}`);
      assert(counts[0][1] === 0 && counts.every((c, i) => !i || c[1] > counts[i - 1][1]), JSON.stringify(counts));
      // (one a magazine: the lit row's pixels go up by the same step each time)
      const step = counts[1][1];
      assert(counts.every(([n, px]) => px === n * step), JSON.stringify({ step, counts }));
      const sag = [0, 2, 4].map(n => ({ n, lit: countC(paint(ME({ carrier: pouches(1, 1, n) })), PLATE_C.lit, dump) }));
      console.log(`      the dump pouch: ${sag.map(o => `${o.n} in, ${o.lit} lit px`).join('; ')}`);
      assert(sag[0].lit === 0 && sag[1].lit > 0, JSON.stringify(sag));
      const d0 = paint(ME({ carrier: pouches(1, 1, 0) })), d4 = paint(ME({ carrier: pouches(1, 1, 4) }));
      assert(diffIn(d0, d4, [38, 56, 64, 70]) > 0, 'the dump pouch sags');
    },
  },
  {
    name: 'a dressed doll paints within budget at the I and C cards\' scale and the target view\'s three bands, the rifle\'s stamp cached; printed with the machine factor',
    fn() {
      const k = machineK(), rows = [], gear = ME();
      for (const [why, scale] of [['I and C', DOLL_SCALE], ...HIT_BANDS.map(b => [`${b.id} band`, figGeom(b.pxPerM).scale])]) {
        paint(gear, scale);                                            // (the stamp made)
        const t0 = performance.now(), N = 8;
        for (let i = 0; i < N; i++) paint(gear, scale);
        const ms = (performance.now() - t0) / N;
        rows.push(`${why} (scale ${fmt(scale, 3)}): ${fmt(ms, 2)} ms`);
        if (why === 'near band') assert(ms < DOLL_CEIL_MS * k, `${ms} ms at the near band against ${DOLL_CEIL_MS} × ${fmt(k, 2)}`);
      }
      // (the cache: a second ask is the same painting)
      clearDolls();
      const a = dressedDoll(gear, PERSON, HIT_SCALE), t0 = performance.now(), b = dressedDoll(gear, PERSON, HIT_SCALE), hitMs = performance.now() - t0;
      assert(a === b, 'the cache');
      console.log(`      the machine factor ${fmt(k, 2)}; ${rows.join('; ')}; a cached dressed doll ${fmt(hitMs, 3)} ms; DOLL_LRU ${DOLL_LRU}`);
    },
  },
  {
    name: 'the I and C figures in the shoot house wear the gear worn now: the suit, the carrier, the holster and the R-7 (seed 48213, setup go), and the barracks\' recruit with no kit is drawn as v0.0.17 drew him',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go' }), s = g.state, gear = gearOf(s, s.player.id);
      const person = { look: { ...s.people[s.player.id].look, head: null }, sex: s.people[s.player.id].sex };
      const dressed = dressedDoll(gear, person), plain = doll({ look: person.look, sex: person.sex, outfit: 'combatSuit' });
      console.log(`      ${diffIn(dressed, plain)} px drawn by the gear over the bare suit; the suit's shell ${countC(dressed, COMBAT_SUIT.shell)} px`);
      assert(countC(dressed, COMBAT_SUIT.shell) > 200 && diffIn(dressed, plain) > 200, 'dressed');
      const b = createGame({ scenario: 'barracks', seed: 48213 }), bs = b.state, bg = gearOf(bs, bs.player.id), bp = bs.people[bs.player.id];
      const args = dressOf(bg, { look: bp.look, sex: bp.sex });
      assert(!args.gear, `the barracks' recruit adds nothing: ${JSON.stringify(args)}`);
    },
  },
  {
    name: 'the kit\'s devices are drawn where they are worn (the play review of v0.0.18: with &loadout=flash the I card\'s doll was the standard kit\'s but for 2 × 2 source pixels): Flash\'s two G-11s change the carrier\'s left flank at the viewer\'s right, Breach\'s strip charges the right flank and its halligan the left shoulder; the standard kit draws none of it',
    fn() {
      const dollOf = (loadout) => {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go', ...(loadout ? { loadout } : {}) }), s = g.state, gear = gearOf(s, s.player.id);
        return { gear, pm: dressedDoll(gear, { look: { ...s.people[s.player.id].look, head: null }, sex: s.people[s.player.id].sex }) };
      };
      const std = dollOf(null), flash = dollOf('flash'), breach = dollOf('breach'), mid = std.pm.w / std.pm.scale / 2;
      // (reference boxes: the viewer's right flank, the viewer's left flank, the left shoulder's top)
      const R = [mid + 9, mid + 16, 38, 64], L = [mid - 16, mid - 9, 38, 64], SH = [mid - 19, mid - 8, -2, 12];
      const d = (o, box) => diffIn(o.pm, std.pm, box);
      const n = { flashR: d(flash, R), flashL: d(flash, L), breachR: d(breach, R), breachL: d(breach, L), breachSh: d(breach, SH), all: d(flash, null) };
      console.log(`      the standard's devices ${std.gear.devices.length}; Flash's ${flash.gear.devices.map(x => `${x.model}@${x.face}${x.slot}`).join(', ')}; Breach's ${breach.gear.devices.map(x => `${x.model}@${x.face}${x.slot}`).join(', ')}`);
      console.log(`      changed pixels: Flash at the viewer's right flank ${n.flashR}, the left ${n.flashL}; Breach at the left flank ${n.breachL}, the right ${n.breachR}, the left shoulder ${n.breachSh}`);
      assert(!std.gear.devices.length && flash.gear.devices.filter(x => x.model === 'g11' && x.face === 'left').length === 2 && breach.gear.devices.some(x => x.model === 'hal' && x.face === 'back'), JSON.stringify({ std: std.gear.devices, flash: flash.gear.devices, breach: breach.gear.devices }));
      assert(n.flashR >= 20 && n.flashL === 0 && n.breachL >= 20 && n.breachSh >= 10, JSON.stringify(n));
    },
  },
];
