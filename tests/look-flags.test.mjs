// OLYMPUS tests: the look's flags and the To score page's picks (the build sheet v0.0.20 item 10; feel.md FL-2; quick, in node).
//
// The page tries the waiting samples live: &look=stack:1+3,helm:r1,jamb:m2 (or the page's own buttons) rides the state as
// state.$look, runtime only, and the stage draws your and your #2's looks through helmets.js lookPicked. With no flag nothing
// may change: a walk over the figure code (ten outfits, three carries, four facings, the gait band and the rifle's first frames
// at 16 px/m: 2,240 frames; v0.0.15's 63,375 was a one-off walk of its own, not a test) hashes as the stage-0 tree's, every
// look passes lookPicked untouched, and HELMET_DRAWN_AS and STACK_DRAWN_AS draw nothing. With stack:1 at GO only the two men's
// looks change (S1, the lit edge, is the figure code's; S4's gap and S5's shadow are the stage's, drawn by the gallery's page
// alone, so the page strikes them). An unknown flag is dropped and named for the toast, as &env= is. The page's text is the
// gallery's line form, read back by picksOf.
import { assert } from './helpers.mjs';
import { paintFrame } from '../src/art/figures/atlas.js';
import { OUTFITS, DUTY_DRESS, WORN_KIT } from '../src/art/figures/outfits.js';
import { DIRS, BANDS } from '../src/art/figures/poses.js';
import { lookPicked, HELMET_DRAWN_AS, STACK_DRAWN_AS } from '../src/art/figures/helmets.js';
import { parseLook, lookText, picksText, picksOf, ROWS } from '../src/ui/cards/topick.js';
import { readParams } from '../src/core/debug.js';
import { createGame } from './game.mjs';

/** The walk's digest on the stage-0 tree (3d3fd9a5), recorded before any change of v0.0.20's D: FNV-1a over every frame's pixels. */
const STAGE0_WALK = Object.freeze({ digest: '67cf35d1', frames: 2240 });

export default [
  {
    name: 'with no flag every figure frame is the stage-0 tree\'s: 2,240 frames of the figure code hash as before, every look passes lookPicked untouched, nothing drawn as',
    fn() {
      let h = 2166136261 >>> 0, n = 0;
      const mix = (v) => { for (let k = 0; k < 4; k++) { h ^= (v >>> (8 * k)) & 255; h = Math.imul(h, 16777619) >>> 0; } };
      const carries = [{}, { weapon: 'rifle', carry: 'low', model: 'r7', carrier: true }, { weapon: 'rifle', carry: 'front', model: 'r7', ears: true }];
      let untouched = 0, looks = 0;
      for (const outfit of [...OUTFITS, ...DUTY_DRESS, ...WORN_KIT]) for (const c of carries) {
        const look = { outfit, seed: 7, skin: 'tan', hair: { style: 'low', color: 'dark' }, ...c };
        for (const slot of [0, 1]) { looks++; if (lookPicked(look, slot, null) === look && lookPicked(look, slot, { stack: [], helm: null, jamb: null }) === look) untouched++; }
        for (const dir of DIRS) for (const frame of [...BANDS.gait, ...(c.weapon ? BANDS.rifle.slice(0, 4) : [])]) {
          const d = paintFrame(look, dir, frame, { ppm: 16 }).pm.data;
          for (let i = 0; i < d.length; i++) mix(d[i] >>> 0);
          n++;
        }
      }
      console.log(`      ${n} frames, digest ${h.toString(16)} (the stage-0 tree's ${STAGE0_WALK.digest} over ${STAGE0_WALK.frames}); looks untouched by lookPicked with no pick ${untouched} of ${looks}; HELMET_DRAWN_AS ${JSON.stringify(HELMET_DRAWN_AS)}, STACK_DRAWN_AS ${JSON.stringify(STACK_DRAWN_AS)}`);
      assert(h.toString(16) === STAGE0_WALK.digest && n === STAGE0_WALK.frames && untouched === looks, JSON.stringify({ h: h.toString(16), n, untouched }));
      assert(Object.values(HELMET_DRAWN_AS).every(v => v === null) && !STACK_DRAWN_AS.length, 'nothing drawn as until the user picks');
    },
  },
  {
    name: 'with stack:1 at GO only your and your #2\'s looks change (the lit edge on both); helm:r1 on both in the Mars trim, helm:o1 on your #2 alone; an unknown flag dropped and named; the flags read and written back the same',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, setup: 'go' }); g.step(1);
      const s = g.state, H = s.armoury.range.house, me = s.player.id, slotOf = (who) => (who === me ? 0 : who === H.twoPid ? 1 : -1);
      const changed = (picks) => s.actors.list.filter(a => { const L = s.people[a.who]?.look; return L && lookPicked({ ...L, outfit: a.outfit ?? L.outfit }, slotOf(a.who), picks) !== null && JSON.stringify(lookPicked({ ...L, outfit: a.outfit ?? L.outfit }, slotOf(a.who), picks)) !== JSON.stringify({ ...L, outfit: a.outfit ?? L.outfit }); }).map(a => a.who);
      const p1 = parseLook('stack:1'), pr = parseLook('helm:r1'), po = parseLook('helm:o1'), bad = parseLook('stack:9,helm:x9,colour:red,jamb:m2');
      const c1 = changed(p1.look), cr = changed(pr.look), co = changed(po.look);
      const q = readParams('?play=test-shoothouse&look=stack:1+3,helm:r1,jamb:m2&shot=a3&voice=old');
      const round = lookText(parseLook(q.look).look);
      console.log(`      at GO ${s.actors.list.length} actors: stack:1 changes ${JSON.stringify(c1)}, helm:r1 ${JSON.stringify(cr)}, helm:o1 ${JSON.stringify(co)} (you ${me}, your #2 ${H.twoPid}); 'stack:9,helm:x9,colour:red,jamb:m2' keeps ${JSON.stringify(bad.look)} and drops ${JSON.stringify(bad.unknown)}; the URL ${JSON.stringify({ look: q.look, shot: q.shot, voice: q.voice })} → ${round}`);
      assert(c1.length === 2 && c1.includes(me) && c1.includes(H.twoPid) && cr.length === 2 && co.length === 1 && co[0] === H.twoPid, JSON.stringify({ c1, cr, co }));
      assert(bad.unknown.length === 3 && bad.look.jamb === 'm2' && q.shot === 'A3' && q.voice === 'a' && round === 'stack:1+3,helm:r1,jamb:m2', JSON.stringify({ bad, q, round }));
    },
  },
  {
    name: 'the To score page\'s rows (the stack, the helmets, the walk, the shot, the room\'s mark, the card\'s four, the corner aid, the sets drawn as built; the voices\' row gone, the user\'s "no voices" of 2026-11-19) and "Copy my picks" in the gallery\'s line form, read back the same, an old voice pick left out',
    fn() {
      const p = { v: 1, scores: { 'stack:S1': 80, 'helm:R1': 65, 'shot:A3': 90, 'voice:c': 70 }, stars: ['shot:A3', 'helm:R1'], flags: {} };
      const t = picksText(p, { scene: 'test-shoothouse', seed: 48213, version: '0.0.20', flags: 'stack:1,helm:r1' }), back = picksOf(t);
      console.log(`      rows: ${ROWS.map(r => `${r.title} (${r.ids.length})`).join(', ')}`);
      console.log(`      ${t.split('\n').join(' | ')}`);
      // (v0.0.23: the target card's four rows join, Card gun, Hands not read, Aimed, Pistol aimed (the build sheet v0.0.23 §0 item 36))
      // (v0.0.23's fixer: the voices' row out (the user, 2026-11-19, "forget voice synthesis, no voices."), so eleven rows, and an old
      // 'voice:c' score in this browser's picks is not copied)
      assert(ROWS.length === 11 && !ROWS.some(r => r.id === 'voice') && back.picks.length === 3 && back.picks.find(x => x.id === 'A3')?.star && !back.picks.some(x => x.id === 'V-c') && /test-shoothouse on seed 48213/.test(back.head), JSON.stringify(back));
    },
  },
];
