// OLYMPUS tests: every pick of v0.0.23's look sets drawn as picked, every unscored set at its default (the build sheet v0.0.24 item 14, §6 E; its F120 read as F123).
//
// v0.0.23 sent its look sets (the portraits' portrait-gun, portrait-pose, portrait-facing, portrait-light and portrait-suit, the
// truth cards, the P-12's stances, the unknown house, the boots and the anchors, and v0.0.18's doll-gear, target-view and wcard2
// shot at last). None was scored by this round's start (DESIGN.md's log, the entry of 2026-11-19, scored the older sets: role F's),
// but for one word on doll-gear's rifle: "The Doll is wrong, nobody holds their gun like that" (the doll's low ready, redrawn: the
// butt in the shoulder's pocket, worn.js READY_BUTT; doll-hold holds the drawing). So:
//   the homes: each set's one-line home holds its pick: the scored one where DESIGN.md's log names it, else the set's open default
//   as samples/index.json gives it (read from those two files, never restated here; the table below says only where each group's
//   pick lives);
//   the frames: where a view is drawn by the game's own code in node (the sets' picture() modules over the game's doll, card and
//   figure; doll-gear's dolls as its page lays them), the game's frame of it equals the committed shot (samples/<set>/shots/<view>.png)
//   pixel for pixel, so the gallery shows what the game draws. A sample drawn by sample-local code (pistol-stances' T, the stage's
//   capture) is checked by its home alone. The shots are palette PNGs (the gallery's magick): read here, palette and all.
// F's sets (the older picks of 2026-11-19) are F's own test. Prints each home and each view's differing pixels.
// v0.0.28 (the user's picks of 2026-11-20): the sets scored then join the homes (the daze, the roll, the stack, the float, the
// Wreck's faces, the shot, the siren), and a group partly decided is held to its stars and its views sent back together.
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import path from 'node:path';
import { assert, root } from './helpers.mjs';
import { expand } from '../tools/gallery.mjs';
import { PORTRAIT_PICKS } from '../src/art/doll/portrait.js';
import { MAN_GROUND_PICKS } from '../src/art/doll/hitcard.js';
import { PISTOL_HANG, READY_BUTT, holdGear } from '../src/art/doll/worn.js';
import { PISTOL_FRAMES } from '../src/art/figures/poses.js';
import { UNKNOWN_LOOK } from '../src/render/known.js';
import { STACK_DRAWN_AS } from '../src/art/figures/helmets.js';
import { DAZE_POSE, COWER_POSE } from '../src/art/figures/poses.js';
import { MAG_BOOT_LOOK } from '../src/art/figures/templates.js';
import { FLOAT_LOOK, OVERHEAD_LOOK } from '../src/render/faces.js';
import { POPUP_LOOK } from '../src/render/range-items.js';
import { SCUTTLE_LOOK } from '../src/art/kit/wreck.js';
import { ROLL_NAMED } from '../src/art/doll/portrait.js';
import { SHOT_HOUSE, SHOT_DEFAULT, WORLD } from '../src/data/sounds.js';
import { paintWeaponCard } from '../src/art/weaponcard.js';
import { doll, DOLL_SCALE } from '../src/art/doll/doll.js';
import { dressOf } from '../src/art/doll/dress.js';

const SAMPLES = path.join(root, 'samples');
const json = (p) => JSON.parse(readFileSync(p, 'utf8'));
const P = PORTRAIT_PICKS;
/**
 * Where each group's pick lives (set → group → the home's value now, as a view id). A group not named is for reference (target-view
 * F) or decided by its set's other home (pistol-stances PS: every stance drawn, its frame in the figure's pistol band).
 */
const HOMES = {
  'portrait-gun': { G: P.gun, W: P.where, H: P.hostage },
  'portrait-pose': { A: P.aim, P: P.pistol, K: P.kneel, D: P.down, C: P.cower, Y: P.prone },
  'portrait-facing': { F: [P.back, P.side], R: P.body },
  'portrait-light': { L: P.light, J: P.jamb, V: P.unread },
  'portrait-suit': { D: P.suit },
  'truth-cards': { T: P.truth },
  // (v0.0.28: the boots as the figure and the doll draw them, templates.js MAG_BOOT_LOOK; PORTRAIT_PICKS.boots its record, held equal by defaults-v028)
  'mag-boots': { B: MAG_BOOT_LOOK, H: P.anchor },
  'target-view': { L: Object.entries(MAN_GROUND_PICKS).find(([, g]) => g === MAN_GROUND_PICKS[P.ground])?.[0], H: P.hostageSide },
  'pistol-stances': { RH: PISTOL_HANG, PS: ['PS-a', 'PS-b', 'PS-c', 'PS-d', 'PS-e'].filter((id, i) => PISTOL_FRAMES.includes(['pistolLow', 'pistolHigh', 'pistolAimed', 'pistolHolster', 'pistolCheck'][i])) },
  'house-unknown': { U: UNKNOWN_LOOK },
  // (v0.0.28, the sets the user scored on 2026-11-20, each group's one home: the daze and the cower (poses.js), a man upside down (R-a
  // turned, and R-b's words on it: ROLL_NAMED), the stack's marks (S0 to S5 are the views S-a to S-f), a floating body's height, the
  // Wreck's overhead, pop-up and deck hatch (its T, B and X have no one constant: T-a and B-a are the stage's only drawing, X waits),
  // the shot in the house and elsewhere (D-a A4, D-b A5), the burn's siren (S-a two tones, S-b the whoop))
  'breach-poses': { D: DAZE_POSE, C: COWER_POSE },
  'portrait-faces': { R: [P.roll, ...(P.roll === 'R-a' && ROLL_NAMED.includes('R-b') ? ['R-b'] : [])] },
  'house-stack-figures': { S: STACK_DRAWN_AS.map(id => `S-${'abcdef'[Number(String(id).slice(1))]}`) },
  'float-look': { F: FLOAT_LOOK },
  'wreck-faces': { K: OVERHEAD_LOOK, P: POPUP_LOOK, H: SCUTTLE_LOOK },
  audio: { D: SHOT_HOUSE === SHOT_DEFAULT ? { A4: 'D-a', A5: 'D-b' }[SHOT_HOUSE] : null },
  'void-look': { S: WORLD.siren.layers[0].kind === 'glide' ? 'S-b' : 'S-a' },
  // (doll-gear's R: the low ready in both hands (R-a, as redrawn) or hanging from the hand (R-b), by the place holdGear gives rifle-low)
  'doll-gear': { R: { ready: 'R-a', hand: 'R-b' }[holdGear({ rifle: { model: 'r7', place: 'front' } }, { how: 'rifle-low' }).rifle.place] },
  // (wcard2: the weapon card's strip by default, the glyph WC2-A, the word WC2-B: the card painted with no strip named against each)
  wcard2: { 'WC2-A': (() => { const o = { model: 'r7', belief: { mode: 'safe', chamber: 'live', mag: 'in', count: 29 }, other: { model: 'p12', place: 'holster', belief: { mode: 'safe', chamber: 'live', mag: 'in', count: 15 } } }; const d = paintWeaponCard(o).data, a = paintWeaponCard({ ...o, strip: 'glyph' }).data; return d.every((v, i) => v === a[i]) ? 'WC2-A-a' : 'WC2-B-a'; })() },
};
/** The node-drawable views, by set: the picture module (for mag-boots, by group). */
const MODS = { 'portrait-gun': 'gun.js', 'portrait-light': 'light.js', 'portrait-suit': 'suit.js', 'pistol-stances': 'stances.js', 'portrait-pose': 'pose.js', 'portrait-facing': 'facing.js', 'mag-boots': { B: 'boots.js', H: 'anchors.js' } };
/** The sets whose frames tests/looks-shots.test.mjs checks (v0.0.28: portrait-pose and portrait-facing gained four views, A3, P3, D3 and
 * F4, and the file went over its quick CPU (TECH §13.7): the same check, the file split, nothing left out). */
export const SPLIT = new Set(['portrait-pose', 'portrait-facing']);
/** A set's views drawn in node against their committed shots: { rows, bad } (F123's check, shared with tests/looks-shots.test.mjs). */
export async function framesOf(sets) {
  const idx = json(path.join(SAMPLES, 'index.json')), bad = [], rows = [];
  for (const set of sets) {
    const mod = MODS[set], s = json(path.join(SAMPLES, set, 'sample.json')), e = idx.samples.find(x => x.id === set), out = [];
    for (const g of expand(set, s)) for (const v of g.views) {
      if (OWN.has(`${set}/${g.id}`)) continue;
      const M = await import(path.join(SAMPLES, set, typeof mod === 'string' ? mod : mod[g.id])), pic = M.picture(new URLSearchParams(v.query));
      const shot = readPng(readFileSync(path.join(SAMPLES, e.groups.flatMap(x => x.views).find(x => x.id === v.id).shot))), k = shot.w / pic.w, d = differ(pic, shot, k);
      out.push(`${v.id} ${d}`);
      if (d || !Number.isInteger(k)) bad.push(`${set} ${v.id}: ${d} px off its shot (×${k})`);
    }
    rows.push(`${set}: ${out.join(', ')}`);
  }
  return { rows, bad };
}
/** Views a sample draws by its own code (checked by the home alone). */
const OWN = new Set(['pistol-stances/T']);

// (a PNG's colours, 8-bit RGB, RGBA or a palette: the gallery's shots are written by magick, a palette where 256 colours do)
function readPng(buf) {
  let o = 8, w = 0, h = 0, depth = 0, type = 0, plte = null;
  const idat = [];
  while (o < buf.length) {
    const len = buf.readUInt32BE(o), kind = buf.toString('ascii', o + 4, o + 8), body = buf.subarray(o + 8, o + 8 + len);
    if (kind === 'IHDR') { w = body.readUInt32BE(0); h = body.readUInt32BE(4); depth = body[8]; type = body[9]; } else if (kind === 'PLTE') plte = body; else if (kind === 'IDAT') idat.push(body); else if (kind === 'IEND') break;
    o += 12 + len;
  }
  const bpp = type === 6 ? 4 : type === 2 ? 3 : 1, bits = type === 3 ? depth : 8, stride = Math.ceil((w * bpp * bits) / 8), fb = Math.max(1, (bpp * bits) >> 3);
  const raw = inflateSync(Buffer.concat(idat)), px = new Uint8Array(stride * h);
  const pa = (a, b, c) => { const p = a + b - c, x = Math.abs(p - a), y = Math.abs(p - b), z = Math.abs(p - c); return x <= y && x <= z ? a : y <= z ? b : c; };
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)), row = y * stride;
    for (let i = 0; i < stride; i++) { const a = i >= fb ? px[row + i - fb] : 0, b = y ? px[row - stride + i] : 0, c = i >= fb && y ? px[row - stride + i - fb] : 0; px[row + i] = (src[i] + (f === 1 ? a : f === 2 ? b : f === 3 ? (a + b) >> 1 : f === 4 ? pa(a, b, c) : 0)) & 255; }
  }
  const col = new Int32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (type === 3) { const bi = x * bits, v = (px[y * stride + (bi >> 3)] >> (8 - bits - (bi & 7))) & ((1 << bits) - 1); col[y * w + x] = (plte[v * 3] << 16) | (plte[v * 3 + 1] << 8) | plte[v * 3 + 2]; } else { const i = y * stride + x * bpp; col[y * w + x] = (px[i] << 16) | (px[i + 1] << 8) | px[i + 2]; }
  }
  return { w, h, col };
}
/** A picture's pixels against a shot (the shot k × its size): the count differing. at: [x, y] where the picture sits in the shot's native pixels. */
function differ(pic, shot, k, at = [0, 0]) {
  let d = 0;
  for (let y = 0; y < pic.h; y++) for (let x = 0; x < pic.w; x++) if (shot.col[Math.floor((y + at[1]) * k) * shot.w + Math.floor((x + at[0]) * k)] !== pic.col[y * pic.w + x]) d++;
  return d;
}
const hexOf = (v) => ((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff);

export default [
  {
    name: 'F123 every pick of v0.0.23\'s sets drawn as picked, every unscored set at its default: each group\'s home holds the scored pick (DESIGN.md\'s log) or the set\'s open default (samples/index.json); the doll\'s rifle redrawn as the log says',
    fn() {
      const idx = json(path.join(SAMPLES, 'index.json')), log = readFileSync(path.join(root, 'docs', 'DESIGN.md'), 'utf8');
      const entry = log.slice(log.indexOf('- 2026-11-19, the user\'s gallery picks'), log.indexOf('\n- 2026-11-19, v0.0.23\'s integration'));
      const bad = [], rows = [];
      for (const [set, homes] of Object.entries(HOMES)) {
        const s = json(path.join(SAMPLES, set, 'sample.json')), e = idx.samples.find(x => x.id === set), groups = expand(set, s);
        const defaults = e?.open?.default ?? s.open?.default ?? [];
        for (const g of groups) {
          if (!(g.id in homes)) continue;
          const ids = g.views.map(v => v.id), want = defaults.filter(d => ids.includes(d)), home = homes[g.id], have = [].concat(home ?? []);
          // (scored in the log: a view id of the group named with a star or "pick" in the entry; none of v0.0.23's is)
          const scored = ids.filter(id => new RegExp(`\\b${id.replace(/[-]/g, '\\-')}\\b[^.]*(★|picked|pick)`).test(entry) && !/^(R|H|T|G|P|M|E|O|W)\d$/.test(id));
          // (v0.0.24 F: a set the user scored carries its picks in "scored" where "open" stood (tools/gallery.mjs indexEntry))
          const filed = (e?.scored?.picks ?? s.scored?.picks ?? []).filter(id => ids.includes(id));
          // (v0.0.28: a set scored or sent back after that entry (the picks of 2026-11-20) carries its own: its "scored" and "open" win)
          const newer = (s.scored?.on ?? s.open?.since ?? '') > '2026-11-19';
          // (v0.0.28: in a set scored on 2026-11-20 a group partly decided carries both, its stars in "scored" and the views sent back in
          // "open" (pistol-stances PS): the pick is both, in the group's order)
          const both = newer ? ids.filter(id => filed.includes(id) || want.includes(id)) : [];
          const pick = scored.length && !newer ? scored : newer && both.length ? both : filed.length ? filed : want;
          rows.push(`${set} ${g.id}: home ${have.join('+') || '-'}; ${scored.length ? `scored ${scored.join('+')}` : `default ${want.join('+') || '-'}`}`);
          if (!pick.length || pick.join('+') !== have.join('+')) bad.push(`${set} ${g.id}: home ${have.join('+')}, the pick ${pick.join('+')}`);
        }
      }
      // (the one word on a v0.0.23 set: the doll's hold redrawn, the butt in the shoulder's pocket)
      const said = /The Doll is wrong, nobody holds their gun like that/.test(entry);
      rows.push(`doll-gear R in the log: "${said ? 'The Doll is wrong, nobody holds their gun like that' : 'NOT FOUND'}"; the low ready's butt at row ${READY_BUTT[1]} (v0.0.23: the hip, row 52)`);
      if (!said || READY_BUTT[1] > 40) bad.push('the doll\'s hold not redrawn as the log says');
      for (const r of rows) console.log(`      ${r}`);
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'F123 the game\'s frame of every view it draws equals the committed shot pixel for pixel: the portraits\' sets, the stances, the boots and the anchors over the game\'s doll, card and figure, and doll-gear\'s dolls',
    async fn() {
      const idx = json(path.join(SAMPLES, 'index.json')), bad = [], rows = [];
      for (const [set, mod] of Object.entries(MODS)) {
        if (SPLIT.has(set)) continue;
        const s = json(path.join(SAMPLES, set, 'sample.json')), e = idx.samples.find(x => x.id === set), out = [];
        for (const g of expand(set, s)) for (const v of g.views) {
          if (OWN.has(`${set}/${g.id}`)) continue;
          const M = await import(path.join(SAMPLES, set, typeof mod === 'string' ? mod : mod[g.id])), pic = M.picture(new URLSearchParams(v.query));
          const shot = readPng(readFileSync(path.join(SAMPLES, e.groups.flatMap(x => x.views).find(x => x.id === v.id).shot))), k = shot.w / pic.w, d = differ(pic, shot, k);
          out.push(`${v.id} ${d}`);
          if (d || !Number.isInteger(k)) bad.push(`${set} ${v.id}: ${d} px off its shot (×${k})`);
        }
        rows.push(`${set}: ${out.join(', ')}`);
      }
      // (doll-gear: its page's five dolls (samples/doll-gear/main.js's layout and gear), each against its cell of the R-a shot)
      const DG = { GAP: 4, LABEL_H: 8 }, S = DOLL_SCALE, DW = Math.round(64 * S);
      const ME = (over = {}) => ({ outfit: 'combatSuit', suit: { model: 'ces-1', colour: 'black', helm: null }, carrier: { model: 'pc-m3', pouches: [{ key: 'p1', holds: 2, mags: 1 }, { key: 'p2', holds: 2, mags: 1 }, { key: 'dump', holds: 4, mags: 0 }] }, ears: null, rifle: { model: 'r7', finish: null, place: 'ready', mag: true }, pistol: { model: 'p12', place: 'holster', mag: true }, thigh: { holds: 2, mags: 1 }, held: null, painted: false, ...over });
      const PERSON = { look: { skin: 'tan', hair: { style: 'medReg', color: 'dark' }, head: null }, sex: 'm' }, TWO = { look: { skin: 'brown', hair: { style: 'highTight', color: 'black' }, head: null }, sex: 'm' }, rifle = (place) => ({ model: 'r7', finish: null, place, mag: true });
      const FIGS = [[ME({ rifle: rifle('ready') }), PERSON], [ME({ rifle: rifle('front'), pistol: { model: 'p12', place: 'ready', mag: true } }), PERSON], [ME({ rifle: rifle('back') }), PERSON], [ME({ rifle: rifle('ready'), pistol: null, thigh: null }), TWO], [ME({ outfit: 'utilities', suit: null, ears: 'cups', pistol: null, thigh: null, held: 'mag', rifle: rifle('ready') }), PERSON]];
      const e = idx.samples.find(x => x.id === 'doll-gear'), shot = readPng(readFileSync(path.join(SAMPLES, e.groups.flatMap(x => x.views).find(x => x.id === 'R-a').shot))), k = shot.w / (DG.GAP + 5 * (DW + DG.GAP));
      const dd = FIGS.map(([gear, person], i) => { const pm = doll({ ...dressOf(gear, person), scale: S }); return differ({ w: pm.w, h: pm.h, col: Array.from(pm.data, hexOf) }, shot, k, [DG.GAP + i * (DW + DG.GAP), DG.GAP + DG.LABEL_H]); });
      rows.push(`doll-gear R-a: the five dolls ${dd.join(', ')} px off the shot (×${k})`);
      if (dd.some(d => d) || !Number.isInteger(k)) bad.push(`doll-gear R-a: ${dd.join(', ')}`);
      for (const r of rows) console.log(`      ${r}`);
      assert(!bad.length, bad.join('; '));
    },
  },
];
