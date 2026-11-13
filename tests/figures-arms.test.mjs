// OLYMPUS tests: the rifle on the figure, the range's pixels and the weapon card (the build sheet 0.0.5 §2.3 (b), (c), (e), §5.3).
//
// The stage's quick suite for 0.0.5, all in node (the pure art and the render's pure geometry):
//   - every new frame of the rifle's bands (poses.js: rifle, rifleKneel, rifleProne) composes facing down,
//     up, right and left at 16 and 24 px/m, drawn, in its cell, its colours near the MARS palette; the held
//     frames of a stance differ from each other; the bands live in the atlas's rifle pool, so the base
//     sheet keeps its size (40 looks at 16 px/m);
//   - rifleFrame() maps the arms role's gunLook (carry, stance, action, aim, kick) to the frame to draw:
//     its table printed and held;
//   - the magazine out draws the rifle without it, but in the magazine's own frames; the range staff's
//     brassard, the RO's headset, ear defenders and the plate carrier each change the figure;
//   - the flash's card (MARS_FLASH_K) sits on the composed muzzle, within a pixel, for every fire frame;
//     the sim's muzzle (gunLook, a real body's: carry.js muzzleOf) beside the drawn one is printed (the
//     chibi holds its rifle lower: the stage draws the flash at the drawn muzzle and maps a case's height
//     onto the drawn bore, range-items.js drawnY), and a case leaves the drawn port within a pixel;
//   - the card's face (cardFace, holePixel) lands on the kit's painting: the centre in the black, a hole
//     at 0 cm in the black, at 10 cm on the 2 ring, off the card none; the flag hoists to its pole's top
//     and stirs; a case flies as one upright pixel and lies as two flat ones of its kind; a thing lying
//     has its ink outline, the same each time; the weapon mode's lead (camera.js aimLead) clamps;
//   - the weapon card reads the belief and only the belief: every glyph changes with it, nothing else does.
// 0.0.7 (the build sheet 0.0.7 §5.4): sitting with the R-7 (the seated band: aim, fire, low, the charging handle, a
// magazine), the casualty lying (hurt) and the corpsman kneeling at work (aid) compose in every facing at 16 and 24
// px/m, each a frame of its own (none alike side on, none the kneeling or prone frame it is closest to), the base
// sheet still 40 looks at 16 px/m; rifleFrame sits a seated shooter; the KD's drawn muzzle sitting is printed.
// The arms role's gunLook is used live where it exists (the scene's hot setup) and from small fixtures of
// its shape elsewhere, said so in the lines.
import { assert, fmt } from './helpers.mjs';
import { BANDS, DIRS, RIFLE_BANDS, POOL_OF, rifleFrame, gaitCarryOf, cellKind } from '../src/art/figures/poses.js';
import { composeFrame } from '../src/art/figures/compose.js';
import { paintFrame, sheetLayout, flashStrip, MARS_FLASH_K, FIRE_FRAMES } from '../src/art/figures/atlas.js';
import { wear } from '../src/art/figures/outfits.js';
import { PALETTES, paletteDistance } from '../src/art/palette.js';
import { rgbOf } from '../src/art/tone.js';
import { paint, unword } from '../src/art/paint.js';
import { paintCard, cardPx, CARD_K, CARD_RINGS_CM } from '../src/art/kit/range.js';
import { cardFace, holePixel, flagPixels, brassPixels, drawnY, drawnBoreM, decalPixels, SIM_PORT_M, PALE, HOLE_LIFT_M } from '../src/render/range-items.js';
import { aimLead } from '../src/render/lead.js';
import { paintWeaponCard, cardParts, CARD_W, CARD_H } from '../src/art/weaponcard.js';
import { KD_RANGE, FLAG, TOWER } from '../src/data/places/range.js';

const PALETTE_E = 0.02;
const LOOK = { outfit: 'utilities', weapon: 'rifle', carry: 'front', skin: 'tan', hair: { style: 'short', color: 'brown' }, ears: true, carrier: true };
const NEW = RIFLE_BANDS.flatMap(b => BANDS[b]);
const opaque = (pm) => { let n = 0; for (const v of pm.data) if ((v >>> 24) >= 128) n++; return n; };
const diff = (a, b) => { let n = 0; const N = Math.max(a.data.length, b.data.length); for (let i = 0; i < N; i++) if ((a.data[i] ?? 0) !== (b.data[i] ?? 0)) n++; return n; };
const sig = (pm) => { let h = 2166136261; for (const v of pm.data) { h ^= v; h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); };

export default [
  {
    name: 'every rifle frame (standing, kneeling, prone: the build sheet 0.0.5 §2.3 (b)) composes facing down, up, right and left at 16 and 24 px/m, drawn, inside its cell, its colours near the MARS palette',
    fn() {
      const mars = PALETTES.mars.map(rgbOf);
      let n = 0, worst = { e: 0 }, blank = [];
      const t0 = performance.now();
      for (const ppm of [16, 24]) for (const look of [LOOK, { ...LOOK, magOut: true }, { ...LOOK, outfit: 'rangeStaff', headset: true }]) for (const frame of NEW) for (const dir of DIRS) {
        const fr = composeFrame(look, dir, frame, { ppm }), pf = paintFrame(look, dir, frame, { ppm });
        n++;
        const px = opaque(pf.pm);
        if (px < 40 * (ppm / 16) ** 2) blank.push(`${frame} ${dir}@${ppm}: ${px}`);
        assert(fr.kind === cellKind(frame, dir) && fr.w === pf.pm.w && fr.h === pf.pm.h, `${frame} ${dir}: its cell`);
        if (fr.kind === 'stand') {
          let y1 = -1;
          fr.cells.forEach((row, y) => row.forEach(c => { if (c) y1 = Math.max(y1, y); }));
          assert(y1 + 1 >= fr.ay - Math.round(0.2 * ppm) && y1 + 1 <= fr.ay + Math.round(0.125 * ppm), `${frame} ${dir}@${ppm}: on the anchor's row (${y1 + 1} vs ${fr.ay})`);
        }
        for (const v of pf.pm.data) {
          if ((v >>> 24) < 128) continue;
          const [r, g, b] = rgbOf(unword(v).hex);
          let e = Infinity;
          for (const [pr, pg, pb] of mars) e = Math.min(e, paletteDistance(r, g, b, pr, pg, pb));
          if (e > worst.e) worst = { e, frame, dir, ppm, hex: unword(v).hex.toString(16) };
        }
      }
      console.log(`      ${n} frames composed (${NEW.length} new frames × 4 facings × 3 looks × 2 densities: the rifle, its magazine out, the RO's dress) in ${fmt(performance.now() - t0, 0)} ms; ${blank.length} blank; the worst colour ${fmt(worst.e, 4)} from the palette (${worst.frame} ${worst.dir}@${worst.ppm}, #${worst.hex})`);
      assert(!blank.length, blank.join(', '));
      assert(worst.e <= PALETTE_E, JSON.stringify(worst));
    },
  },
  {
    name: 'the held frames of a stance differ from each other side on, and the rifle bands live in the atlas\'s rifle pool: the base sheet keeps 40 looks at 16 px/m',
    fn() {
      for (const band of RIFLE_BANDS) {
        const pms = BANDS[band].map(f => paintFrame(LOOK, 'right', f).pm), same = [];
        for (let i = 0; i < pms.length; i++) for (let j = i + 1; j < pms.length; j++) if (diff(pms[i], pms[j]) < 3) same.push(`${BANDS[band][i]} = ${BANDS[band][j]}`);
        console.log(`      ${band} (${BANDS[band].length}): ${BANDS[band].join(', ')}; pairs alike side on: ${same.length ? same.join(', ') : 'none'}`);
        assert(!same.length, same.join(', '));
        assert(POOL_OF[band] === 'rifle', band);
      }
      for (const ppm of [16, 24]) {
        const lay = sheetLayout(ppm), slots = Math.floor(4096 / lay.w) * Math.floor(4096 / lay.h), R = lay.pools.rifle;
        const rows = Math.floor(4096 / lay.h), rifleSlots = Math.floor(4096 / R.w) * Math.floor((4096 - rows * lay.h) / R.h);
        console.log(`      ${ppm} px/m: the base sheet ${lay.w} × ${lay.h} (${slots} looks), the rifle sheet ${R.w} × ${R.h} (${rifleSlots} in the rows left under the base sheets)`);
        assert(slots >= (ppm === 16 ? 40 : 15) && rifleSlots >= 4, `${slots} looks, ${rifleSlots} rifle sheets`);
        for (const f of NEW) for (const d of DIRS) { const c = lay.cells.get(`${f}|${d}`), b = lay.bands[c.band]; assert(c.pool === 'rifle' && c.x >= b.x && c.y >= b.y && c.x + c.w <= b.x + b.w && c.y + c.h <= b.y + b.h, `${f} ${d} in its band`); }
      }
    },
  },
  {
    name: 'rifleFrame turns the arms role\'s gunLook into the frame to draw: a carry held by stance, an action\'s frame (a list walked by k), the aim turned to the target, the kick\'s fire frame',
    fn() {
      // (fixtures of gunLook's shape, src/sim/arms/look.js)
      const at = { x: 1100, z: 295.5, face: 'right', ms: 10_000 };
      const gl = (o) => ({ model: 'r7', carry: 'low', stance: 'stand', aim: null, shotMs: null, action: null, flash: 0, kick: 0, mag: true, ...o });
      const rows = [];
      for (const stance of ['stand', 'kneel', 'prone']) {
        const line = [];
        for (const carry of ['front', 'slung', 'low', 'high', 'aim']) line.push(`${carry} ${rifleFrame(gl({ carry, stance, aim: carry === 'aim' ? { x: 1125, z: 295.5, ms: 0 } : null }), at).frame}`);
        for (const frame of ['raise', 'charge', 'release', 'check', 'magout', 'magin', 'aim', 'fire']) line.push(`${frame} ${rifleFrame(gl({ stance, action: { frame, k: 0.5 } }), at).frame}`);
        line.push(`kick ${rifleFrame(gl({ stance, carry: 'aim', kick: 0.6, flash: 0.3, aim: { x: 1125, z: 295.5, ms: 0 } }), at).frame}`);
        rows.push(`${stance}: ${line.join(', ')}`);
      }
      for (const r of rows) console.log(`      ${r}`);
      const f = (o) => rifleFrame(gl(o), at);
      assert(f({ carry: 'front' }).frame === 'slungFront' && f({ carry: 'low', stance: 'kneel' }).frame === 'kneelLow' && f({ carry: 'high', stance: 'prone' }).frame === 'proneLow', 'the carries held');
      assert(f({ action: { frame: 'charge', k: 0.2 }, stance: 'prone' }).frame === 'proneCharge' && f({ action: { frame: 'check' } }).frame === 'pressCheck' && f({ action: { frame: 'magout' }, stance: 'kneel' }).frame === 'kneelMagout', 'the actions');
      // (clearDouble's list walked by k: magout, then charge three times, magin, charge)
      const list = ['magout', 'charge', 'charge', 'charge', 'magin', 'charge'];
      const walk = [0, 0.2, 0.7, 0.75, 0.99].map(k => f({ action: { frame: list, k } }).frame);
      console.log(`      clearDouble's frames walked by k 0, 0.2, 0.7, 0.75, 0.99: ${walk.join(', ')}`);
      assert(walk.join() === 'magout,charge,magin,magin,charge', walk.join());
      assert(f({ carry: 'aim', aim: { x: 1125, z: 285, ms: 0 }, stance: 'stand' }).frame === 'aimhi' && f({ carry: 'aim', aim: { x: 1125, z: 306, ms: 0 } }).frame === 'aimlo', 'turned up and down the picture');
      assert(f({ carry: 'aim', aim: { x: 1125, z: 295.5, ms: at.ms - 50 } }).frame === 'aimlo', 'held lower its first RAISE_MS');
      assert(f({ kick: 0.5, stance: 'prone', flash: 0.2 }).frame === 'pronefire' && f({ kick: 0.5, stance: 'prone', flash: 0.2 }).flash === true && f({ kick: 0.1, stance: 'kneel' }).frame === 'kneelfire', 'the kick');
      // (the rework's R2, VIEWS §3.10.1: an aim walks at the high ready until the aimed bands exist, never the low ready)
      assert(gaitCarryOf('aim') === 'high' && gaitCarryOf('front') === 'front' && gaitCarryOf(null) === 'low', 'the gait carries');
    },
  },
  {
    name: 'sitting with the R-7, the casualty lying and the corpsman kneeling at work (the build sheet 0.0.7 §5.4) compose facing down, up, right and left at 16 and 24 px/m, each a frame of its own, the base sheet keeping 40 looks; rifleFrame sits a seated shooter',
    fn() {
      const mars = PALETTES.mars.map(rgbOf), frames = [...BANDS.seated, 'hurt', 'aid'];
      let n = 0, worst = { e: 0 };
      const blank = [];
      for (const ppm of [16, 24]) for (const frame of frames) for (const dir of DIRS) {
        const look = frame === 'aid' ? { ...LOOK, weapon: null, outfit: 'utilities' } : LOOK;
        const fr = composeFrame(look, dir, frame, { ppm }), pf = paintFrame(look, dir, frame, { ppm });
        n++;
        if (opaque(pf.pm) < 40 * (ppm / 16) ** 2) blank.push(`${frame} ${dir}@${ppm}`);
        assert(fr.kind === cellKind(frame, dir) && fr.w === pf.pm.w && fr.h === pf.pm.h, `${frame} ${dir}: its cell`);
        for (const v of pf.pm.data) {
          if ((v >>> 24) < 128) continue;
          const [r, g, b] = rgbOf(unword(v).hex);
          let e = Infinity;
          for (const [pr, pg, pb] of mars) e = Math.min(e, paletteDistance(r, g, b, pr, pg, pb));
          if (e > worst.e) worst = { e, frame, dir, ppm };
        }
      }
      const side = (f) => paintFrame(f === 'aid' ? { ...LOOK, weapon: null } : LOOK, 'right', f).pm;
      const pairs = [...frames.map((a, i) => frames.slice(i + 1).map(b => [a, b])).flat(), ['sitAim', 'kneel'], ['sitFire', 'kneelfire'], ['sitLow', 'kneelLow'], ['sitMagout', 'kneelMagout'], ['hurt', 'sleep'], ['aid', 'kneelLow']];
      const alike = pairs.filter(([a, b]) => diff(side(a), side(b)) < 3).map(([a, b]) => `${a} = ${b}`);
      const lay = sheetLayout(16), slots = Math.floor(4096 / lay.w) * Math.floor(4096 / lay.h);
      const at = { x: 1400, z: 330, face: 'right', ms: 10_000 }, gl = (o) => ({ model: 'r7', carry: 'low', stance: 'sit', aim: null, action: null, flash: 0, kick: 0, mag: true, ...o });
      const sat = { low: rifleFrame(gl({}), at).frame, aim: rifleFrame(gl({ carry: 'aim', aim: { x: 1600, z: 330, ms: 0 } }), at).frame, kick: rifleFrame(gl({ carry: 'aim', kick: 0.5 }), at).frame,
        charge: rifleFrame(gl({ action: { frame: 'charge', k: 0.5 } }), at).frame, magin: rifleFrame(gl({ action: { frame: 'magin', k: 0.5 } }), at).frame };
      console.log(`      ${n} frames composed (${frames.join(', ')} × 4 facings × 2 densities); ${blank.length} blank; the worst colour ${fmt(worst.e, 4)} (${worst.frame} ${worst.dir}@${worst.ppm}); alike side on: ${alike.length ? alike.join(', ') : 'none'}`);
      console.log(`      the base sheet ${lay.w} × ${lay.h} (${slots} looks at 16 px/m); seated: ${Object.entries(sat).map(([k, v]) => `${k} ${v}`).join(', ')}`);
      assert(!blank.length && worst.e <= PALETTE_E, JSON.stringify({ blank, worst }));
      assert(!alike.length, alike.join(', '));
      assert(slots >= 40, `${slots} looks`);
      assert(sat.low === 'sitLow' && sat.aim === 'sitAim' && sat.kick === 'sitFire' && sat.charge === 'sitCharge' && sat.magin === 'sitMagout', JSON.stringify(sat));
      for (const f of frames) assert(POOL_OF[BANDS.seated.includes(f) ? 'seated' : f === 'hurt' ? 'lie' : 'rest'] === 'base', `${f} in the base pool`);
    },
  },
  {
    name: 'the magazine out draws the rifle without it but in its own frames; the brassard, the RO\'s headset, ear defenders and the plate carrier each change the figure',
    fn() {
      const out = { ...LOOK, magOut: true }, lines = [];
      for (const frame of ['lowReady', 'kneelLow', 'proneLow', 'charge', 'magin', 'magout', 'proneMagin']) {
        const d = diff(paintFrame(LOOK, 'right', frame).pm, paintFrame(out, 'right', frame).pm);
        lines.push(`${frame} ${d}`);
        if (['magin', 'magout', 'proneMagin'].includes(frame)) assert(d === 0, `${frame}: the magazine's own frame draws it in hand either way (${d})`);
        else assert(d > 0, `${frame}: the magazine out shows (${d} pixels)`);
      }
      console.log(`      pixels apart with the magazine out, side on at 16 px/m: ${lines.join(', ')}`);
      const base = { outfit: 'utilities', skin: 'tan', hair: { style: 'short', color: 'brown' } };
      const each = { brassard: [{ ...base, outfit: 'rangeStaff' }, 'down'], headset: [{ ...base, outfit: 'rangeStaff', headset: true }, 'down'], ears: [{ ...base, ears: true }, 'right'], carrier: [{ ...base, carrier: true }, 'right'] };
      const ref = { brassard: base, headset: { ...base, outfit: 'rangeStaff' }, ears: base, carrier: base };
      const got = Object.entries(each).map(([k, [look, dir]]) => [k, diff(paintFrame(ref[k], dir, 'idle0').pm, paintFrame(look, dir, 'idle0').pm)]);
      console.log(`      pixels each adds to the idle figure at 16 px/m: ${got.map(([k, n]) => `${k} ${n}`).join(', ')}`);
      for (const [k, n] of got) assert(n >= 3, `${k}: ${n} pixels`);
      assert(wear({ ...base, outfit: 'rangeStaff' }).brassard && wear({ ...base, carrier: true }).armour && !wear({ ...base, carrier: true }).head?.kind?.startsWith('helmet'), 'the dress\'s layers');
    },
  },
  {
    name: 'the flash sits on the drawn muzzle within a pixel for every fire frame (Mars ×1.2); a case leaves the drawn port within a pixel standing and prone; the sim\'s muzzle beside the drawn one is printed',
    async fn() {
      const lines = [];
      for (const ppm of [16, 24]) {
        const strip = flashStrip(ppm), lay = sheetLayout(ppm);
        let worst = 0, n = 0;
        for (const dir of ['right', 'left']) for (const frame of FIRE_FRAMES) {
          const fr = composeFrame({ outfit: 'utilities', weapon: 'rifle' }, dir, frame, { ppm }), c = lay.cells.get(`${frame}|${dir}`), fl = strip.index.get(`rifle|${dir}|${frame}`);
          assert(fr.muzzle && fl, `${frame} ${dir}: its muzzle and its flash`);
          // (the flash's origin, the muzzle's cell, is in its slot where the muzzle is in the layout's cell)
          const mx = fr.muzzle[0] + (c.ax - fr.ax), my = fr.muzzle[1] + (c.ay - fr.ay);
          const d = Math.max(Math.abs(mx - fl.ox) > strip.size ? Infinity : 0, Math.abs(my - fl.oy) > strip.size ? Infinity : 0);
          worst = Math.max(worst, d); n++;
        }
        lines.push(`${ppm} px/m: ${n} side-on fire frames, every flash slot over its muzzle; ${strip.count} flashes in a ${strip.size}-px square each (× ${MARS_FLASH_K} of tradecraft's)`);
        assert(worst === 0, `${ppm}: a flash away from its muzzle`);
        const bores = drawnBoreM(ppm);
        for (const stance of ['stand', 'prone']) {
          const launch = drawnY(SIM_PORT_M[stance], ppm), off = Math.abs(launch - bores[stance]) * ppm;
          lines.push(`${ppm} px/m ${stance}: the sim's port at ${SIM_PORT_M[stance]} m is drawn at ${fmt(launch, 3)} m, the drawn bore ${fmt(bores[stance], 3)} m (${fmt(off, 2)} px)`);
          assert(off <= 1, `${stance}@${ppm}: the case leaves ${fmt(off, 2)} px from the drawn port`);
        }
      }
      // (the sim's muzzle, live from the scene's hot setup when the arms role's modules are in the tree)
      try {
        const { createGame } = await import('./game.mjs'), L = await import('../src/sim/arms/look.js');
        const g = createGame({ scenario: 'test-handling', seed: 48213, setup: 'hot' }), s = g.state, a = s.actors.list.find(x => x.id === s.player.actor);
        const gl = L.gunLook(s, a, s.clock.ms), fr = composeFrame({ outfit: 'utilities', weapon: 'rifle' }, a.face, 'prone', { ppm: 16 });
        const drawn = { x: a.x + (fr.muzzle[0] + 0.5 - fr.ax) / 16, y: (fr.ay - fr.muzzle[1] - 0.5) / 16 };
        lines.push(`the sim's muzzle (gunLook, prone, a real body's) at (${fmt(gl.muzzle.x, 2)}, ${fmt(gl.muzzle.y, 2)} m up); the drawn chibi's at (${fmt(drawn.x, 2)}, ${fmt(drawn.y, 2)} m up): ${fmt((drawn.x - gl.muzzle.x) * 16, 1)} px along, ${fmt((drawn.y - gl.muzzle.y) * 16, 1)} px up (the flash is drawn at the drawn one)`);
      } catch (e) { lines.push(`the sim's muzzle: not in this tree yet (${e.message.split('\n')[0]})`); }
      for (const l of lines) console.log(`      ${l}`);
    },
  },
  {
    name: 'the card\'s face as the stage draws holes on it is the kit\'s painting: the centre in the black, a hole at 0 cm in the black, at 10 cm on the 2 ring, off the card none; the flag hoists and stirs; a case flies and lies; a thing lying is outlined, the same each time',
    fn() {
      const t = KD_RANGE.bay.lanes[3].target, lines = [];
      for (const ppm of [16, 24]) {
        const f = cardFace(t, ppm), n = cardPx(ppm), pm = paint(f.w, f.h, (px) => { px(0, 0, f.w, f.h, 0xc4ac97); paintCard(px, f.cx0, f.cy0, ppm); });
        const at = (i, j) => unword(pm.data[j * f.w + i]).hex;
        const centre = holePixel(t, { xCm: 0, yCm: 0 }, ppm), ring = holePixel(t, { xCm: CARD_RINGS_CM.two, yCm: 0 }, ppm), off = holePixel(t, { xCm: 40, yCm: 0 }, ppm);
        lines.push(`${ppm} px/m: the card ${n} px (× ${CARD_K} life), on a ${f.w} × ${f.h} backer at texel (${f.cx0}, ${f.cy0}); a hole at 0 cm → texel (${centre.i}, ${centre.j}) #${at(centre.i, centre.j).toString(16)}, at 10 cm → (${ring.i}, ${ring.j}) #${at(ring.i, ring.j).toString(16)}, at 40 cm → ${off}`);
        assert([0x1a1214, 0x31292a].includes(at(centre.i, centre.j)) && centre.black, `${ppm}: the centre in the black (the 5 ring's grey within it at 24 px/m)`);
        assert(at(ring.i, ring.j) === 0x7c736b || at(ring.i - 1, ring.j) === 0x7c736b, `${ppm}: the 2 ring's line`);
        assert(off === null, 'off the card');
        assert(Math.abs((centre.z - centre.y) - (f.z - (f.y1 - (centre.j + 0.5) / ppm))) < 1e-9 && Math.abs(centre.z - f.z - HOLE_LIFT_M) < 1e-9, `${ppm}: the hole on its texel's pixel, ${HOLE_LIFT_M} m toward the camera`);
      }
      const pole = KD_RANGE.tower.flag, up = flagPixels(pole, 1, 0), half = flagPixels(pole, 0.5, 0), stir = flagPixels(pole, 1, 400);
      const top = Math.max(...up.map(p => p.y));
      lines.push(`the tower's flag: ${up.length} px hoisted, its top at ${fmt(top, 2)} m (the pole's ${FLAG.poleTopY}), half hoisted ${fmt(Math.max(...half.map(p => p.y)), 2)} m; none lowered; stirring between two shapes every 400 ms`);
      assert(flagPixels(pole, 0, 0).length === 0 && Math.abs(top - FLAG.poleTopY) < 0.1 && Math.max(...half.map(p => p.y)) < top && Math.max(...half.map(p => p.y)) > TOWER.deckY, 'the hoist');
      assert(JSON.stringify(up) !== JSON.stringify(stir), 'it stirs');
      const fly = brassPixels({ x: 1101, y: 0.9, z: 296.2, kind: 'case', rest: false, rotRad: 1 }), lie = ['case', 'round', 'dummy'].map(kind => brassPixels({ x: 1101.3, y: 0, z: 296.5, kind, rest: true, rotRad: 0.2 }));
      lines.push(`a case in flight at 0.9 m (the sim's) drawn as ${fly.length} upright pixels from ${fmt(fly[0].y, 3)} m (two from the design review of v0.0.5); lying, two flat pixels: a case #${lie[0].map(p => p.c.toString(16)).join(' #')}, a round #${lie[1].map(p => p.c.toString(16)).join(' #')}, the dummy #${lie[2].map(p => p.c.toString(16)).join(' #')}`);
      assert(fly.length === 2 && fly.every(p => !p.flat) && Math.abs(fly[0].y - drawnY(0.9)) < 1e-9 && lie.every(l => l.length === 2 && l.every(p => p.flat)), 'flying and lying');
      assert(new Set(lie.map(l => l.map(p => p.c).join())).size === 3, 'each kind its colours');
      const mag = decalPixels({ id: 'i6', kind: 'mag', x: 1100.411, z: 295.409 }), mag2 = decalPixels({ id: 'i6', kind: 'mag', x: 1100.411, z: 295.409 });
      lines.push(`a magazine lying: ${mag.length} pixels, ${mag.filter(p => p.c === 0x14151c).length} of them its outline; the same twice: ${JSON.stringify(mag) === JSON.stringify(mag2)}`);
      assert(mag.length >= 20 && mag.filter(p => p.c === 0x14151c).length >= 10 && JSON.stringify(mag) === JSON.stringify(mag2), 'the magazine lying');
      const lead = aimLead({ x: 1100, z: 295.5 }, { x: 1125, z: 295.5 }, [20, 11.25]), far = aimLead({ x: 1100, z: 295.5 }, { x: 1180, z: 260 }, [20, 11.25]);
      lines.push(`the weapon mode's lead to the card: [${lead.map(v => fmt(v, 2)).join(', ')}] m (0.55 of 25 m); to a point 80 m east and 35 m north, clamped to [${far.map(v => fmt(v, 2)).join(', ')}]`);
      assert(Math.abs(lead[0] - 13.75) < 1e-9 && lead[1] === 0 && far[0] === 17.5 && far[1] === -8.75, 'the lead and its clamp');
      for (const l of lines) console.log(`      ${l}`);
      void PALE;
    },
  },
  {
    name: 'the weapon card (VIEWS §4.4) reads the belief and only the belief: every glyph changes with it (the selector, the magazine in or out and its count, a guess, the chamber, the port, the bolt, a stoppage felt and seen), a truth beside it changes nothing',
    fn() {
      const base = { model: 'r7', short: 'R-7', chamber: 'live', mag: 'in', count: 4, countApprox: false, mode: 'semi', locked: false, port: 'open', stoppage: null };
      const card = (b) => paintWeaponCard({ model: 'r7', belief: b, k: 1 });
      const a = card(base);
      assert(a.w === CARD_W && a.h === CARD_H && a.px === a.data && [...a.data].every(v => (v >>> 24) === 255), 'the card: 180 × 148, opaque');
      assert(sig(card(base)) === sig(a), 'the same twice');
      const variants = {
        'on safe': { mode: 'safe' }, 'on auto': { mode: 'auto' }, 'magazine out': { mag: 'out', count: null }, 'two in it': { count: 2 }, 'about four': { countApprox: true },
        'count unknown': { count: null }, 'chamber empty': { chamber: 'empty' }, 'chamber unchecked': { chamber: '?' }, 'port shut': { port: 'shut' }, 'bolt locked': { locked: true, chamber: 'empty', count: 0 },
        'a click felt': { stoppage: 'click' }, 'a stovepipe seen': { stoppage: 'case', chamber: 'case' }, 'a double seen': { stoppage: 'double' }, 'a dummy seen': { chamber: 'dud' },
      };
      const lines = [];
      for (const [k, v] of Object.entries(variants)) { const d = diff(a, card({ ...base, ...v })); lines.push(`${k} ${d}`); assert(d > 0, `${k}: the card did not change`); }
      const truth = diff(a, card({ ...base, truth: { chamber: 'empty', mag: 'out' }, rounds: 1254, cond: 0.3, set: 'dud' }));
      console.log(`      pixels changed from a loaded rifle on semi: ${lines.join(', ')}; a truth beside the belief: ${truth}`);
      assert(truth === 0, 'the truth changed the card');
      const p = cardParts({ ...base, stoppage: 'felt' }), q = cardParts({ ...base, chamber: '?', port: 'shut' });
      console.log(`      the parts read: felt ${JSON.stringify(p)}; unchecked ${JSON.stringify(q)}`);
      assert(p.mark === '!' && q.mark === '?' && q.port === 'shut', 'the marks');
    },
  },
];
