// The plaque in node (quick): src/ui/plaque.js, tradecraft's enamel plaque ported (VIEWS §9.1) and the shot's
// plaque over the bracketed target (VIEWS §7.4, WEAPONS §7.10; the build sheet 0.0.5 §2.4, §5.4: "the plaque
// from a fed record"). The record is fed in the shape of the shot role's plaqueOf() ({ part, rangeM, rangeText,
// odds, oddsText, words, aimS, held: { aimed, heldS, v, rate, toFullMs }, next, dc, dcParts, mods }); the
// suite reads the plaque's pixels back glyph by glyph (the letters, the glyph, the seam, the meter of the
// odds along its foot, the notch), its words in the sheet's form ("PAPER · 25 M · 85% · AIM 0.9 S", "… · +4 IN
// 1.3 S · CLICK FIRE"), and the hover's list, which is the record's own DC parts and modifiers, in its order.
// The brackets: four corners of the style's light edge, each inked round.
// The 0.0.7 round's (the build sheet 0.0.7 §2.1 plaqueOf's terms and kd, §5.5 ui-plaque): the terms' plate at distance,
// one segment a term (range, wind, hold, zero), each its glyph and its few words, and the rings' strip, its cells as wide
// as their odds; the hover's lines; the far window's label from farPointOf's record.
import { assert } from './helpers.mjs';
import { plaquePixels, bracketPixels, shotPlaque, plaqueWords, plaqueParts, nextSaid, oddsSaid, textW, writeText, pixelBuffer, colourAt, mix, STYLES, ICONS, MARKS,
  termsPixels, termText, termLines, ringShares, ringWords, farLabel, TERM_ICONS, RING_CELLS, RING_STRIP_PX } from '../src/ui/plaque.js';
import { GLYPH_CHARS } from '../src/art/font.js';

// (the record plaqueOf gives at the card, prone, before the aim: DC 19, the optic +1, prone +4: 85%)
const REC = {
  part: 'PAPER', rangeM: 25, rangeText: '25 M', odds: 0.85, oddsText: '85%', words: null, aimS: 0.87, held: { aimed: false, heldS: 0, v: 0, rate: 3, toFullMs: null }, next: 'aim',
  dc: 19, dcParts: [{ why: 'base', v: 6 }, { why: 'the R-7', v: 0 }, { why: '25 m', v: 7 }, { why: 'the torso', v: 0 }, { why: 'the 25 m card', v: 6 }],
  mods: [{ why: 'prone', v: 4, src: 'task' }, { why: 'the SO-4 at 1×', v: 1, src: 'gear' }],
};
const HOLDING = { ...REC, aimS: null, next: 'hold', held: { aimed: true, heldS: 0, v: 0, rate: 3, toFullMs: 1333 }, odds: 0.85 };
const HELD = { ...REC, aimS: null, next: 'fire', held: { aimed: true, heldS: 1.4, v: 4, rate: 3, toFullMs: 0 }, odds: 0.95, oddsText: '95%', mods: [...REC.mods, { why: 'the aim held', v: 4, src: 'task' }] };

// (the ink pixels of a string written alone, as a set of 'x,y')
function inkOf(str) {
  const buf = pixelBuffer(textW(str) + 2, 7), set = new Set();
  writeText(buf.px, 0, 0, str, 0x123456);
  for (let y = 0; y < buf.h; y++) for (let x = 0; x < buf.w; x++) if (colourAt(buf, x, y) === 0x123456) set.add(`${x},${y}`);
  return set;
}
// (the pixels of colour c in a region of a buffer, as 'x,y' relative to its corner)
function pixelsIn(buf, x0, y0, w, h, c) {
  const set = new Set();
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (colourAt(buf, x0 + x, y0 + y) === c) set.add(`${x},${y}`);
  return set;
}
const same = (a, b) => a.size === b.size && [...a].every(k => b.has(k));

export default [
  {
    name: 'the shot\'s plaque from a fed record: "PAPER 85%" in the picked kind\'s ink, "25 M · AIM 0.9 S" after the seam, the aim glyph, the odds as a meter along its foot, a notch at its middle, read back pixel by pixel',
    fn() {
      const spec = shotPlaque(REC), p = plaquePixels(spec), S = STYLES[spec.style];
      console.log(`      ${spec.text} | ${spec.sub} (${spec.style}, ${p.w} × ${p.h} px, tip at ${p.tip}); words: ${p.words}`);
      assert(spec.text === 'PAPER 85%' && spec.sub === '25 M · AIM 0.9 S' && spec.style === 'seen' && spec.icon === 'aim' && spec.meter === 0.85, JSON.stringify(spec));
      const text = pixelsIn(p, p.layout.textX, 3, textW(spec.text), 5, S.ink), sub = pixelsIn(p, p.layout.subX, 3, textW(spec.sub), 5, mix(S.ink, S.face, 0.35));
      const glyph = pixelsIn(p, p.layout.iconX, 3, 5, 5, S.glyph), wantGlyph = new Set(ICONS.aim.flatMap((row, y) => [...row].map((b, x) => (b === '1' ? `${x},${y}` : null)).filter(Boolean)));
      console.log(`      read back: the text's ${text.size} ink pixels, the sub's ${sub.size}, the aim glyph's ${glyph.size}: each the alphabet's own`);
      assert(same(text, inkOf(spec.text)) && same(sub, inkOf(spec.sub)) && same(glyph, wantGlyph), JSON.stringify({ text: text.size, want: inkOf(spec.text).size, sub: sub.size, wantSub: inkOf(spec.sub).size, glyph: glyph.size }));
      // (the meter: the foot's shade lit to the odds; the seam; the notch's point under the middle; the nicked corners clear)
      const body = 11, lit = [...Array(p.w - 2).keys()].filter(i => colourAt(p, 1 + i, body - 2) === S.hi).length;
      assert(lit === Math.round((p.w - 3) * 0.85), `the meter lit ${lit} of ${p.w - 3}`);
      assert(colourAt(p, 0, 0) === null && colourAt(p, p.tip, body + 1) === 0x14151c && colourAt(p, p.layout.subX - 2, 5) === S.lo, 'the corner, the notch, the seam');
      console.log(`      the meter: ${lit} of ${p.w - 3} foot pixels lit (85%); the notch's point at (${p.tip}, ${body + 1})`);
      // (tradecraft's plaque.js for the same words, by its own formula (no test imports ../tradecraft): w = 1 + 3 + 8 (a glyph) +
      // text + 4 + sub + 3 + 1, body 1 + 2 + 5 + 2 + 1 = 11, the notch 3 and the shadow 1 under it, the canvas a pixel wider for the shadow)
      const tw = 1 + 3 + 8 + textW(spec.text.toUpperCase()) + 4 + textW(spec.sub.toUpperCase()) + 3 + 1, th = 11 + 3 + 1;
      console.log(`      tradecraft's formula for the same words: ${tw + 1} × ${th} px, the tip at ${Math.floor(tw / 2)}; ours ${p.w} × ${p.h}, the tip at ${p.tip}`);
      assert(p.w === tw + 1 && p.h === th && p.tip === Math.floor(tw / 2), JSON.stringify({ ours: [p.w, p.h, p.tip], tradecraft: [tw + 1, th] }));
    },
  },
  {
    name: 'the plaque\'s three forms in the sheet\'s words: before the aim "PAPER · 25 M · 85% · AIM 0.9 S", aimed and holding "… · +4 IN 1.3 S · CLICK FIRE" in the aimed red, held "… · HELD +4 · CLICK FIRE"; banded words where the odds are loose',
    fn() {
      const w = [REC, HOLDING, HELD].map(plaqueWords), styles = [REC, HOLDING, HELD].map(r => shotPlaque(r).style);
      for (let i = 0; i < 3; i++) console.log(`      ${w[i]} (${styles[i]})`);
      assert(w[0] === 'PAPER · 25 M · 85% · AIM 0.9 S' && w[1] === 'PAPER · 25 M · 85% · +4 IN 1.3 S · CLICK FIRE' && w[2] === 'PAPER · 25 M · 95% · HELD +4 · CLICK FIRE', w.join(' / '));
      assert(styles.join() === 'seen,tail,tail', styles.join());
      const loose = { ...REC, odds: null, oddsText: null, words: 'a fair chance', part: 'TORSO', rangeText: '≈ 300 M' };
      console.log(`      a loose belief: ${plaqueWords(loose)}; drawn: ${shotPlaque(loose).text} | ${shotPlaque(loose).sub}`);
      assert(plaqueWords(loose) === 'TORSO · ≈ 300 M · A FAIR CHANCE · AIM 0.9 S'.replace('A FAIR CHANCE', 'a fair chance') && oddsSaid(loose) === 'a fair chance', plaqueWords(loose));
      assert(nextSaid({ next: 'hold', held: { v: 2, toFullMs: 0 } }) === 'HELD +2 · CLICK FIRE' && plaqueWords(null) === '', 'a hold already full, no record');
      // (by the keys the plaque names Fire's digit, held to hold and fire, never a click (the design review's))
      const byKey = [nextSaid({ next: 'hold', held: { v: 1, toFullMs: 1400 }, fireKey: '1' }), nextSaid({ next: 'fire', held: { v: 4, toFullMs: 0 }, fireKey: '1' })];
      console.log(`      by the keys: "${byKey.join('" then "')}"`);
      assert(byKey[0] === '+4 IN 1.4 S · 1 HELD FIRE' && byKey[1] === 'HELD +4 · 1 FIRE', byKey.join(' / '));
      // (Fire struck in the panel: the plaque says why in CLICK FIRE's place, never asking for a click the panel refuses: the integrator's, 0.0.5)
      const off = [plaqueWords({ ...HOLDING, fireOff: 'on safe' }), plaqueWords({ ...HELD, fireOff: 'a stoppage' })];
      console.log(`      Fire struck: ${off.join(' / ')}`);
      assert(off[0] === 'PAPER · 25 M · 85% · +4 IN 1.3 S · ON SAFE' && off[1] === 'PAPER · 25 M · 95% · HELD +4 · A STOPPAGE', off.join(' / '));
      // (every mark the plaque writes is the alphabet's or MARKS')
      const marks = new Set([...w.join(''), ...off.join(''), '≈', '?', '+', '·']), missing = [...marks].filter(ch => !GLYPH_CHARS.includes(ch.toUpperCase()) && !MARKS[ch]);
      assert(!missing.length, `marks the plaques cannot draw: ${missing.join(' ')}`);
    },
  },
  {
    name: 'hovering the plaque lists the DC\'s parts and every modifier as believed, the record\'s own list in its order (the one the roll uses)',
    fn() {
      const a = plaqueParts(REC), b = plaqueParts(HELD);
      console.log(`      ${a.dc}: ${a.parts.join(' · ')} | ${a.mods.join(' · ')} (${a.total >= 0 ? '+' : ''}${a.total}) | the odds ${a.odds}`);
      console.log(`      held: ${b.mods.join(' · ')} (+${b.total}) | the odds ${b.odds}`);
      assert(a.dc === 'DC 19' && a.parts.join('|') === 'base +6|the R-7 0|25 m +7|the torso 0|the 25 m card +6' && a.mods.join('|') === 'prone +4|the SO-4 at 1× +1' && a.total === 5, JSON.stringify(a));
      assert(b.mods.length === REC.mods.length + 1 && b.mods.at(-1) === 'the aim held +4' && b.total === 9 && b.odds === '95%', JSON.stringify(b));
      const neg = plaqueParts({ ...REC, mods: [{ why: 'rushed', v: -3 }] });
      assert(neg.mods[0] === 'rushed −3', neg.mods[0]);
    },
  },
  {
    name: 'the brackets: four corners in the style\'s light edge, inked round, the frame\'s size inside (a 16 × 19 px backer at 16 px/m), and every VIEWS §9.1 kind drawable',
    fn() {
      const b = bracketPixels({ w: 16, h: 19, style: 'tail' }), S = STYLES.tail;
      const lit = (x, y) => colourAt(b, x, y) === S.hi;
      const corners = [[1, 1], [b.w - 2, 1], [1, b.h - 2], [b.w - 2, b.h - 2]].map(([x, y]) => lit(x, y));
      const middle = colourAt(b, Math.floor(b.w / 2), Math.floor(b.h / 2));
      console.log(`      ${b.w} × ${b.h} px; the corners lit: ${corners.join(', ')}; the middle clear: ${middle === null}`);
      assert(b.w === 18 && b.h === 21 && corners.every(Boolean) && middle === null, JSON.stringify({ corners, middle }));
      const kinds = Object.keys(STYLES), sizes = kinds.map(k => plaquePixels({ text: k, style: k, icon: 'rifle' }).w);
      console.log(`      ${kinds.length} kinds: ${kinds.map((k, i) => `${k} ${sizes[i]} px`).join(', ')}`);
      assert(['home', 'duty', 'mess', 'armoury', 'medical', 'way', 'seen', 'squad', 'hazard', 'exit', 'felt', 'airlock', 'tail'].every(k => STYLES[k]), 'VIEWS §9.1\'s kinds');
      assert(['bed', 'fork', 'rifle', 'chevron', 'warn', 'ear', 'door', 'lock', 'clock'].every(g => ICONS[g]?.length === 5 && ICONS[g].every(r => r.length === 5)), 'VIEWS §9.1\'s glyphs, 5 × 5');
    },
  },
  {
    name: 'the terms at distance: one plate, a segment a term (range "300 M", wind "2.6 M/S >" the way it blows, hold "0.5 R", zero "▼3"), each its glyph and its words, and the rings\' strip at its end, each cell as wide as its odds; the hover\'s lines; nothing but the record\'s beliefs',
    fn() {
      const terms = [{ key: 'range', v: 300, words: '300 m' }, { key: 'wind', v: 2.6, words: 'wind 2.6 m/s from the left, blowing right (your read)' }, { key: 'hold', v: [0.5, 0], words: 'held 0.5 mil right' }, { key: 'zero', v: { elev: -3, wind: 0 }, words: '3 clicks down from your zero' }];
      const ringOdds = { v: 0.04, 5: 0.21, 4: 0.38, 3: 0.22, 2: 0.09, miss: 0.06 };
      const p = termsPixels(terms, { ringOdds });
      console.log(`      the plate ${p.w} × ${p.h} px: ${p.words}`);
      console.log(`      segments ${p.segments.map(g => `${g.key}@${g.x}+${g.w} "${g.text}"`).join(', ')}; the strip at ${p.strip.x}, cells ${p.strip.cells.map(c => `${c.ring} ${c.w}`).join(' ')}`);
      assert(p.segments.map(g => g.text).join(' | ') === '300 M | 2.6 M/S > | 0.5 R | ▼3', p.segments.map(g => g.text).join(' | '));
      // (each segment's glyph in the plate's glyph colour where its icon says, its words in ink after it)
      const S = STYLES.seen;
      for (const g of p.segments) {
        const icon = ICONS[TERM_ICONS[g.key]], buf = { w: p.w, h: p.h, data: p.data };
        icon.forEach((row, j) => [...row].forEach((b, i) => { if (b === '1') assert(colourAt(buf, g.x + i, 3 + j) === S.glyph, `${g.key}'s glyph at ${g.x + i},${3 + j}`); }));
        assert(same(pixelsIn(buf, g.x + 7, 3, textW(g.text), 5, S.ink), inkOf(g.text)), `${g.key}'s words "${g.text}"`);
      }
      const total = p.strip.cells.reduce((a, c) => a + c.w, 0), sh = ringShares(ringOdds);
      assert(total === RING_STRIP_PX && p.strip.cells.every((c, i) => Math.abs(c.w - sh[i] * RING_STRIP_PX) <= 1.5), JSON.stringify(p.strip.cells));
      const buf = { w: p.w, h: p.h, data: p.data };
      for (const c of p.strip.cells.filter(c => c.w)) assert(colourAt(buf, c.x, 5) === RING_CELLS.find(([k]) => k === c.ring)[1], `the ${c.ring} cell's colour`);
      assert(ringWords(ringOdds) === 'V 4% 5 21% 4 38% 3 22% 2 9% MISS 6%', ringWords(ringOdds));
      // (the words by their values: still air, a hold left and down, on the zero; a term without a value says its own words)
      const said = [termText({ key: 'wind', v: 0.01 }), termText({ key: 'wind', v: -3.04 }), termText({ key: 'hold', v: { xMil: -0.25, yMil: -0.5 } }), termText({ key: 'hold', v: [0, 0] }), termText({ key: 'zero', v: { elev: 0, wind: 0 } }), termText({ key: 'zero', v: { elev: 2, wind: -1 } }), termText({ key: 'range', words: 'about 300 m' })];
      console.log(`      ${said.join(' | ')}`);
      assert(said.join(' | ') === 'STILL | 3 M/S < | 0.25 L 0.5 DN | CENTRE | ON ZERO | ▲2 <1 | ABOUT 300 M', said.join(' | '));
      const lines = termLines({ terms, kd: { ringOdds } });
      console.log(`      the hover: ${lines.join(' · ')}`);
      assert(lines.length === 5 && lines[1] === terms[1].words && /^the rings: v 4%/.test(lines[4]), JSON.stringify(lines));
      assert(termsPixels([], {}).segments.length === 0 && termsPixels(terms).strip === null, 'no terms, no odds: nothing drawn for them');
    },
  },
  {
    name: 'the far window\'s label: "TARGET 10" and after the seam "300 M", farPointOf\'s own words, in the seen kind\'s enamel with the aim glyph and no notch',
    fn() {
      const spec = farLabel({ key: 'face:10', label: 'TARGET 10 · 300 M', rangeM: 300, lane: 10 }), p = plaquePixels(spec);
      console.log(`      ${JSON.stringify(spec)} → ${p.w} × ${p.h} px "${p.words}"`);
      assert(spec.text === 'TARGET 10' && spec.sub === '300 M' && spec.style === 'seen' && spec.icon === 'aim' && spec.notch === false && p.words === 'TARGET 10 300 M', JSON.stringify(spec));
      const bare = farLabel({ key: 'face:7', lane: 7, rangeM: 299.6 });
      assert(bare.text === 'TARGET 7' && bare.sub === '300 M' && farLabel(null) === null, JSON.stringify(bare));
      assert(['range', 'flag', 'hold', 'turret'].every(g => ICONS[g]?.length === 5 && ICONS[g].every(r => r.length === 5)) && ['<', '▲', '▼'].every(m => MARKS[m]?.length === 5), 'the new glyphs, 5 × 5, and marks');
    },
  },
];
