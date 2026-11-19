// OLYMPUS tests: the card in his light (the build sheet v0.0.24 item 16, its F118 read as F121; P§3.3; samples/portrait-light L1, the default).
//
// The user, 2026-11-17: the portraits "need to be more dynamic and show us what we would be seeing". The Seen record carries his light
// at his feet (seen.js lightOf: lightLevel and spectrumAt, the level to LIGHT_Q), and the hit card darkens his figure by lightK (the
// level over LIGHT_FULL_K 0.75, the house's lit rooms, measured; never below LIGHT_FLOOR_K 0.3), so room 3's dim (0.40) draws 2a's
// man at 0.53 of his colours, a dark room at the floor, and the lit rooms (0.75) and "Bang" (1.0) byte for byte as before. On the
// live lane 3a stands in room 3: his record reads 0.40, his card darker than 2a's in the lit room 2. The light is the card's paint,
// never the doll's key: a man walking through a lamp's pool repaints the card, never the doll. Without the change every card was
// drawn unlit (the record's light was null). Prints the levels, the shares and the luminance.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { seenOf, standSeen, lightOf } from '../src/sim/people/seen.js';
import { paintHitcard } from '../src/art/doll/hitcard.js';
import { portraitKey, LIGHT_FULL_K, LIGHT_FLOOR_K } from '../src/art/doll/portrait.js';
import { dollPaints } from '../src/art/doll/dress.js';
import { lightDrawn, LOOKS_ENFORCED } from './flawless-looks.mjs';
import { holdTonePx } from './flawless-portrait.mjs';

const live = () => createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', opfor: 'live:fight,hide', setup: 'go' });
// (the figure's pixels: those of the unlit card above its words that differ from the ground (a man's card's ground is one colour a row))
function figureOf(card) {
  const f = new Uint8Array(card.data.length), W = card.w, figH = card.h - card.words.h;
  for (let y = 1; y < figH; y++) { const g = card.data[y * W + 2]; for (let x = 1; x < W - 1; x++) if (card.data[y * W + x] !== g) f[y * W + x] = 1; }
  return f;
}

export default [
  {
    name: 'F121 the card in his light: at 1.0 ("Bang") and the house\'s lit 0.75 byte for byte the unlit card; at 0.40 (room 3) and 0.2 his figure darkened by lightK, never below LIGHT_FLOOR_K; on the live lane 3a in room 3 reads 0.40 and 2a in room 2 the lit 0.75; no doll painted for a change of light',
    fn() {
      const g = live(), s = g.state, men = s.armoury.range.turners.filter(T => T.live), out = [], bad = [];
      for (const T of men) { const r = seenOf(s, T.live.who, { fresh: true }); out.push(`${T.stand} ${r.light.level} (sp ${r.light.sp})`); }
      console.log(`      the live lane's men in their light: ${out.join(', ')}`);
      const lv = Object.fromEntries(men.map(T => [T.stand, seenOf(s, T.live.who, { fresh: true }).light.level]));
      assert(lv['2a'] >= LIGHT_FULL_K && Math.abs(lv['3a'] - 0.4) < 1e-9, JSON.stringify(lv));
      const rp = men[0].live.who, rec = seenOf(s, rp, { fresh: true }), person = { look: s.people[rp].look, sex: s.people[rp].sex };
      const card = (level) => paintHitcard({ subject: { kind: 'man', rec: { ...rec, light: level === null ? null : { level, sp: 1 } }, person }, rangeM: 4, words: 'CHECK' });
      const unlit = card(null), fig = figureOf(unlit);
      const paints0 = dollPaints(), key0 = portraitKey(rec, person);
      for (const level of [1, 0.85, LIGHT_FULL_K, 0.6, 0.4, 0.2, 0.05]) {
        const c = card(level), L = lightDrawn(unlit, c, level, fig);
        console.log(`      level ${level}: ${L.same ? 'byte for byte the unlit card' : `${L.differ} px darkened (off the figure ${L.off}), his mean luminance ×${L.lum} against lightK ${L.want}`}`);
        if (!L.ok) bad.push(`level ${level}: ${JSON.stringify(L)}`);
        if (level < LIGHT_FULL_K && L.want < LIGHT_FLOOR_K) bad.push(`level ${level} below the floor`);
      }
      // (no doll repainted: the doll's key holds no light)
      const lit2 = portraitKey({ ...rec, light: { level: 0.2, sp: 1 } }, person);
      console.log(`      dolls painted for seven levels: ${dollPaints() - paints0}; the doll's key the same at 0.2: ${lit2 === key0}`);
      assert(lit2 === key0 && dollPaints() - paints0 <= 1, 'a change of light painted a doll');
      assert(!bad.length && LOOKS_ENFORCED.has('F121'), bad.join('; '));
    },
  },
  {
    name: 'F121 a board in room 3 is drawn in its light too, its gun in the board\'s ink as in the light (F89), and "Bang"\'s boards (no record) as scored: the house\'s stand 3b\'s card darker than 1a\'s',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go' }), s = g.state;
      const R = s.armoury.range, T1 = R.turners.find(T => T.stand === '1a'), T3 = R.turners.find(T => T.stand === '3b');
      const lightAt = (T) => lightOf(s, T.x, T.z), recOf = (T) => standSeen('threat', 'rifle', null, { light: lightAt(T) });
      const c1 = paintHitcard({ subject: { kind: 'board', face: 'threat', holds: 'rifle', rec: recOf(T1) }, rangeM: 6, words: '1A' });
      const c3 = paintHitcard({ subject: { kind: 'board', face: 'threat', holds: 'rifle', rec: recOf(T3) }, rangeM: 6, words: '3B' });
      const plain = paintHitcard({ subject: { kind: 'board', face: 'threat', holds: 'rifle' }, rangeM: 6, words: '1A' });
      let d1 = 0, d3 = 0;
      for (let i = 0; i < plain.data.length; i++) { if (c1.data[i] !== plain.data[i]) d1++; if (c3.data[i] !== plain.data[i]) d3++; }
      // (the board's gun keeps the board's ink in any light, so it reads (F89's tones): the ui-portrait save of 3b in room 3's dim)
      const ink3 = holdTonePx(c3), ink = holdTonePx(plain);
      console.log(`      1a at ${lightAt(T1).level}: ${d1} px off the plain board; 3b at ${lightAt(T3).level}: ${d3} px darkened (lit ×${c3.lit.toFixed(3)}), the gun's ink ${ink3} px against ${ink} unlit`);
      assert(d1 === 0 && d3 > 1000 && c3.lit < 1 && ink3 === ink && ink > 0, JSON.stringify({ d1, d3, lit: c3.lit, ink3, ink }));
    },
  },
];
