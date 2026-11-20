// OLYMPUS tests: the user's picks of 2026-11-20 drawn as the game's defaults, and the sets they scored folded (v0.0.28's DEFAULTS).
//
// The user pasted their gallery picks on 2026-11-20 (.run/v028/picks/paste-2026-11-20.txt): a star on a candidate makes it the
// game's where the set picks one, each in its one home. Here, each home and what it draws, every case red on v0.0.27's tree:
//   the stack's figures S1 and S5 joined (helmets.js STACK_DRAWN_AS: S1's lit edge on you and your #2 in the black suit);
//   the Wreck's pop-up sliding out of a slot (P-b, range-items.js POPUP_LOOK): its face at its own size, the head out first;
//   the trunk's scuttle round with a hand wheel (H-b, art/kit/wreck.js SCUTTLE_LOOK): its ring and lid laid a pixel row at a time;
//   mag boots with the heavier sole and no cuff (B-a, templates.js MAG_BOOT_LOOK) on the figure and the doll, the lanyard (H-b) and
//   the place's backdrop on the I and C cards (D-b) recorded in portrait.js PORTRAIT_PICKS;
//   a man upside down turned as you see him with his face named in the words too (R-a and R-b joined, portrait.js ROLL_NAMED);
//   the burn's siren a rising whoop, 500 to 1,200 Hz (S-b, data/sounds.js WORLD.siren), a jink's over its half cycle;
//   and the fold (the user's rule of 2026-11-19, "please in the future, place the already rated picks in a hidden drop down section
//   at the bottom"): every set scored whole on 2026-11-20 rated with its picks, the sets sent back with new pictures waiting on top in
//   the lead's order, the game's To score page the same (topick.js DRAWN_WAITING, RATED_SETS). Quick, in node; prints what it read.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { assert, root } from './helpers.mjs';
import { STACK_DRAWN_AS, lookPicked } from '../src/art/figures/helmets.js';
import { POPUP_LOOK, popupPixels, turnerPixels, turnerAt } from '../src/render/range-items.js';
import { SCUTTLE_LOOK, roundScuttleRuns, scuttle } from '../src/art/kit/wreck.js';
import { builder } from '../src/art/kit/kit.js';
import { C } from '../src/art/kit/common.js';
import { MAG_BOOT_LOOK, MAG_BOOT_SPEC, MAG_BOOT_LETTERS, magBootCells } from '../src/art/figures/templates.js';
import { doll, DOLL_SCALE, MAG_BOOT_C, MAG_SOLE_ROWS } from '../src/art/doll/doll.js';
import { PORTRAIT_PICKS, ROLL_NAMED, cardBackdrop } from '../src/art/doll/portrait.js';
import { dressedDoll } from '../src/art/doll/dress.js';
import { WORLD, SIREN_WHOOP_HZ, SIREN_CYCLE_MS } from '../src/data/sounds.js';
import { sirenSoundOf, cycleMsOf } from '../src/ui/audio/siren.js';
import { render } from '../src/ui/audio/synth.js';
import { toScore, ratedSets } from '../samples/to-score.js';
import { DRAWN_WAITING, DRAWN_RATED, RATED_SETS } from '../src/ui/cards/topick.js';

const PPM = 16, G = 0.0006 * 9.80665, ON = '2026-11-20';
const json = (p) => JSON.parse(readFileSync(path.join(root, p), 'utf8'));
/** The sets the user scored whole on 2026-11-20, with what they starred (the paste; DEFAULTS D1 to D19 of the triage). */
const SCORED = Object.freeze({
  'breach-poses': ['D-a', 'C-a'], 'portrait-faces': ['R-a', 'R-b'], 'house-stack-figures': ['S-b', 'S-f'], 'doll-gear': ['R-a'], 'float-look': ['F-a'],
  'mag-boots': ['B-a', 'H-b'], 'portrait-suit': ['D-b'], 'target-view': ['F-a', 'L-a', 'H-a'], 'house-unknown': ['U2'], 'truth-cards': ['T-a'],
  audio: ['A-4', 'D-b'], 'void-look': ['P-a', 'H-a', 'S-b', 'K-a'],
});
/** The sets sent back with new pictures, in the order they lead (the side card first: "I need you to be serious about this"). */
const WAITING = Object.freeze(['portrait-facing', 'portrait-pose', 'portrait-gun', 'portrait-light', 'pistol-stances', 'corner-aid', 'wreck-faces']);

export default [
  {
    name: 'each new star in its one home: the stack S1 and S5, the pop-up P-b, the scuttle H-b, the boots B-a, the lanyard H-b, the suit\'s backdrop D-b, the roll\'s words on R-a, the siren S-b',
    fn() {
      const homes = { stack: STACK_DRAWN_AS, popup: POPUP_LOOK, scuttle: SCUTTLE_LOOK, boots: [MAG_BOOT_LOOK, PORTRAIT_PICKS.boots], anchor: PORTRAIT_PICKS.anchor, suit: PORTRAIT_PICKS.suit, roll: [PORTRAIT_PICKS.roll, ...ROLL_NAMED], siren: [WORLD.siren.layers[0].kind, ...SIREN_WHOOP_HZ] };
      console.log(`      ${JSON.stringify(homes)}`);
      assert(JSON.stringify(STACK_DRAWN_AS) === '["S1","S5"]' && POPUP_LOOK === 'P-b' && SCUTTLE_LOOK === 'H-b' && MAG_BOOT_LOOK === 'B-a' && PORTRAIT_PICKS.boots === MAG_BOOT_LOOK && PORTRAIT_PICKS.anchor === 'H-b' && PORTRAIT_PICKS.suit === 'D-b' && PORTRAIT_PICKS.roll === 'R-a' && ROLL_NAMED.includes('R-a'), JSON.stringify(homes));
      assert(WORLD.siren.layers[0].kind === 'glide' && SIREN_WHOOP_HZ.join() === '500,1200', JSON.stringify(WORLD.siren));
      // (S1 on you and your #2 in the black suit with no pick: its lit edge, the figure's mark; S5 is the stage's shadow, no mark)
      const look = { outfit: 'combatSuit', seed: 3, skin: 'tan', hair: { style: 'low', color: 'dark' } };
      const ut = { ...look, outfit: 'utilities' }, me = lookPicked(look, 0, null), two = lookPicked(look, 1, null), other = lookPicked(ut, 0, null);
      assert(me?.mark?.rim && two?.mark?.rim && other === ut, JSON.stringify({ me: me?.mark, two: two?.mark }));
    },
  },
  {
    name: 'P-b: a pop-up half up shows its face\'s top half at its own size on its base, the head out first, with the slot under it; P-a (v0.0.25\'s) squeezed the whole face into the same rows',
    fn() {
      const t = { key: 'h1', face: 'paper', holds: 'rifle', x: 64.6, z: 2.4, y: 1.3, facingK: 1, holes: [] };
      const up = turnerPixels(t, 1000, PPM, G).filter(p => !p.noLine), ta = turnerAt(t, PPM), P = 1 / PPM;
      const rowOf = (p) => Math.round((ta.yTop - (p.y - 0.2)) * PPM - 0.5);
      const half = popupPixels(t, 0.5, 1000, PPM, G), slid = half.filter(p => !p.slot), slot = half.filter(p => p.slot), hinged = popupPixels(t, 0.5, 1000, PPM, G, 'P-a');
      const dh = Math.round(ta.h / 2), shift = (ta.h - dh) * P;
      // (each pixel shown half up is the pixel of the board up dh rows higher: the top dh rows, not resampled)
      const key = (p) => `${Math.round(p.x * PPM * 2)},${Math.round(p.y * PPM * 2)},${p.c}`, upAt = new Set(up.filter(p => rowOf(p) < dh).map(p => key({ ...p, y: p.y - shift })));
      const same = slid.filter(p => upAt.has(key(p))).length, hingedSame = hinged.filter(p => upAt.has(key(p))).length;
      console.log(`      the face ${ta.h} rows; half up ${slid.length} board pixels (${same} the top ${dh} rows' own), ${slot.length} of slot; P-a's ${hinged.length} (${hingedSame} of them)`);
      assert(slid.length === upAt.size && same === slid.length && slot.length > 0 && hingedSame < hinged.length, JSON.stringify({ n: slid.length, want: upAt.size, same, hingedSame }));
    },
  },
  {
    name: 'H-b: the trunk\'s scuttle round, a grey ring round a lid with a hand wheel, laid a pixel row at a time at 16 and 24 px/m (every box inside the circle, symmetric, no hazard stripes); H-a was a square of four striped bars',
    fn() {
      for (const ppm of [16, 24]) {
        const { N, runs } = roundScuttleRuns(0.8, ppm), g = Array.from({ length: N }, () => Array(N).fill(null));
        for (const r of runs) for (let i = r.i0; i < r.i1; i++) g[r.j][i] = r.kind;
        const R = N / 2, c = Math.floor(N / 2);
        let asym = 0, outside = 0;
        for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { if (g[j][i] !== g[j][N - 1 - i] || g[j][i] !== g[N - 1 - j][i] || g[j][i] !== g[i][j]) asym++; if (g[j][i] && Math.hypot(i + 0.5 - R, j + 0.5 - R) > R) outside++; }
        console.log(`      ${ppm} px/m: ${N} px across, ${runs.length} runs (${runs.filter(r => r.kind === 'ring').length} of ring); the middle ${g[c][c]}, the edge ${g[c][0]} and ${g[0][c]}, corners ${g[0][0]}; ${asym} asymmetric, ${outside} outside`);
        assert(N % 2 === 1 && g[c][c] === 'wheel' && g[c][0] === 'ring' && g[0][c] === 'ring' && g[0][0] === null && !asym && !outside && runs.some(r => r.kind === 'lid'), JSON.stringify({ N, asym, outside }));
        // (the kit's own pieces: boxes of the ring, flat pieces of the lid and the wheel; no box in the hazard's yellow; deckhead: the ring alone)
        for (const make of ['deck', 'deckhead']) {
          const boxes = [], grounds = [], area = { ppm, part: () => 1, box: (s) => (boxes.push(s), s), ground: (s) => (grounds.push(s), s) };
          scuttle(builder(area, { x: 10, z: 10, y: make === 'deckhead' ? 2.2 : 0 }), { W: 0.8, D: 0.8, make });
          const far = boxes.filter(b => [[b.x0, b.z0], [b.x1, b.z0], [b.x0, b.z1], [b.x1, b.z1]].some(([x, z]) => Math.hypot(x - 10, z - 10) > 0.4 * Math.SQRT2 * 0.8 + 1 / ppm));
          const yellow = boxes.filter(b => Object.values(b.faces).some(f => f === C.hazard || f === C.hazardD));
          console.log(`      ${ppm} px/m, ${make}: ${boxes.length} boxes, ${grounds.length} flat pieces, ${far.length} reaching past the circle, ${yellow.length} striped`);
          assert(boxes.length > 4 && !far.length && !yellow.length && (make === 'deck' ? grounds.length > 0 : grounds.length === 0), JSON.stringify({ make, boxes: boxes.length, grounds: grounds.length, far: far.length }));
        }
      }
    },
  },
  {
    name: 'B-a: mag boots draw a sole two pixels deep under each boot column and no cuff, on the figure and on the doll; B-b drew one row and the cuff',
    fn() {
      // (a boot two columns wide and three rows deep on an empty grid, as compose.js hands its cells)
      const grid = (n = 8) => Array.from({ length: n }, () => Array(4).fill(null));
      const cells = grid(); for (const y of [2, 3, 4]) for (const x of [1, 2]) cells[y][x] = { ch: 'f', part: 3 };
      const n = magBootCells(cells), letters = cells.flat().filter(Boolean).map(c => c.ch);
      const old = grid(); for (const y of [2, 3, 4]) for (const x of [1, 2]) old[y][x] = { ch: 'f', part: 3 };
      const nb = magBootCells(old, 'B-b');
      console.log(`      B-a: ${n} pixels (${letters.filter(c => c === MAG_BOOT_LETTERS.sole).length} sole, ${letters.filter(c => c === MAG_BOOT_LETTERS.cuff).length} cuff); B-b: ${nb}; the doll's sole rows ${MAG_SOLE_ROWS}`);
      assert(n === 4 && cells[5][1]?.ch === MAG_BOOT_LETTERS.sole && cells[6][2]?.ch === MAG_BOOT_LETTERS.sole && !letters.includes(MAG_BOOT_LETTERS.cuff) && nb === 4 && old[2][1].ch === MAG_BOOT_LETTERS.cuff, JSON.stringify({ n, nb }));
      assert(MAG_SOLE_ROWS === MAG_BOOT_SPEC['B-a'].sole && MAG_SOLE_ROWS === 2 && !MAG_BOOT_SPEC['B-a'].cuff, JSON.stringify(MAG_BOOT_SPEC));
      // (the doll in the black suit on his boots: the sole's tone and none of the cuff's)
      const pm = doll({ look: { skin: 'tan', hair: { style: 'medReg', color: 'dark' } }, outfit: 'combatSuit', gear: { boots: 'mag' }, scale: DOLL_SCALE });
      const hex = (v) => ((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff), count = (c) => Array.from(pm.data).filter(v => hex(v) === c).length;
      console.log(`      the doll on mag boots: ${count(MAG_BOOT_C.sole)} sole px, ${count(MAG_BOOT_C.cuff)} cuff px`);
      assert(count(MAG_BOOT_C.sole) > 10 && count(MAG_BOOT_C.cuff) === 0, 'the doll\'s boots');
    },
  },
  {
    name: 'D-b: your I and C cards stand on the place\'s backdrop by default (the doll\'s own wall under D-a); the siren whoops up from 500 to 1,200 Hz each cycle, a jink\'s over its half cycle',
    fn() {
      const pm = dressedDoll({ outfit: 'combatSuit', suit: { model: 'ces-1', colour: 'black', helm: null } }, { look: { skin: 'tan', hair: { style: 'medReg', color: 'dark' } }, sex: 'm' });
      const def = cardBackdrop(pm, DOLL_SCALE, 'house'), a = cardBackdrop(pm, DOLL_SCALE, 'house', 'D-a');
      let moved = 0;
      for (let i = 0; i < pm.data.length; i++) if (def.data[i] !== pm.data[i]) moved++;
      console.log(`      the default backdrop moves ${moved} of ${pm.data.length} pixels of the doll's own card (D-a: ${a === pm ? 'the very pixmap' : 'changed'})`);
      assert(moved > 1000 && a === pm, JSON.stringify({ moved }));
      // (the pitch from the zero crossings of a stretch: the whoop's fundamental near its start and its end)
      const pitch = (x, sr, t0, t1) => { let n = 0, first = -1, last = -1; for (let i = Math.max(1, Math.round(t0 * sr)); i < Math.round(t1 * sr); i++) if (x[i - 1] < 0 && x[i] >= 0) { if (first < 0) first = i; last = i; n++; } return n > 2 ? (n - 1) * sr / (last - first) : 0; };
      const sr = WORLD.siren.rateHz, x = render(WORLD.siren, { sampleRate: sr, name: 'defaults-v028' }), j = render(WORLD.sirenJink, { sampleRate: sr, name: 'defaults-v028' });
      const lo = pitch(x, sr, 0.03, 0.13), hi = pitch(x, sr, 0.85, 0.95), jlo = pitch(j, sr, 0.02, 0.07), jhi = pitch(j, sr, 0.41, 0.46);
      console.log(`      the siren: ${Math.round(lo)} Hz at 0.08 s, ${Math.round(hi)} Hz at 0.9 s (${(x.length / sr).toFixed(2)} s); a jink's ${Math.round(jlo)} to ${Math.round(jhi)} Hz in ${(j.length / sr).toFixed(2)} s, played as ${sirenSoundOf('jink')} every ${cycleMsOf('jink')} ms, a burn's as ${sirenSoundOf('burn')} every ${cycleMsOf('burn')} ms`);
      assert(lo > 450 && lo < 650 && hi > 1000 && hi < 1300 && jlo < 650 && jhi > 1000 && j.length / sr <= cycleMsOf('jink') / 1000 + 0.03 && sirenSoundOf('jink') === 'sirenJink' && sirenSoundOf('burn') === 'siren' && cycleMsOf('burn') === SIREN_CYCLE_MS, JSON.stringify({ lo, hi, jlo, jhi }));
    },
  },
  {
    name: 'the fold: every set scored whole on 2026-11-20 is rated with its stars (no "open"), the sets sent back wait on top in the lead\'s order (the side card first), and the To score page draws them the same',
    fn() {
      const index = json('samples/index.json'), waiting = toScore(index).map(r => r.id), rated = new Map(ratedSets(index).map(r => [r.id, r]));
      const bad = [];
      for (const [id, picks] of Object.entries(SCORED)) {
        const r = rated.get(id), s = json(`samples/${id}/sample.json`);
        if (!r || s.open || r.scored?.on !== ON || JSON.stringify(r.scored.picks) !== JSON.stringify(picks) || JSON.stringify(s.scored) !== JSON.stringify(r.scored) || !RATED_SETS.includes(id)) bad.push(`${id}: ${JSON.stringify({ rated: !!r, open: !!s.open, scored: r?.scored })}`);
      }
      // (the sets sent back: open, scored where a group of them was decided, ahead of v0.0.27's three)
      const top = waiting.slice(0, WAITING.length);
      if (JSON.stringify(top) !== JSON.stringify(WAITING)) bad.push(`the order ${top.join(', ')}`);
      if (JSON.stringify(DRAWN_WAITING) !== JSON.stringify(waiting)) bad.push(`the page's waiting ${DRAWN_WAITING.join(', ')} against the gallery's ${waiting.join(', ')}`);
      if (!DRAWN_RATED.every(id => rated.has(id)) || DRAWN_WAITING.some(id => rated.has(id))) bad.push('the page\'s rated row');
      const wf = json('samples/wreck-faces/sample.json');
      if (JSON.stringify(wf.open?.default) !== '["X-a"]' || wf.scored?.on !== ON) bad.push(`wreck-faces: ${JSON.stringify({ open: wf.open, scored: wf.scored })}`);
      console.log(`      waiting, on top: ${waiting.join(', ')}; rated ${rated.size}, ${Object.keys(SCORED).length} of them on ${ON}`);
      assert(!bad.length, bad.join('; '));
    },
  },
];
