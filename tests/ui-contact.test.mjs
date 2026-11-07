// The take-in made readable, in node (quick): src/ui/plaque.js's window brackets, the pause's stamp, the plaque's lead and its
// strip, and a shot row's parts' plate (the build sheet 0.0.8 §2.4, §4's face, §5.4 ui-contact; COMBAT §25.11, §25.15's "the
// window reads as lag"). The brackets open at BRACKET_START_K 3 times the target's box on the sighting tick and close to it
// as the window's k goes to 1 (a recruit's slowly, a tier one's before they can be seen moving), in one amber whatever the
// face (they say where, never what); the stamp is the take-in in the 3 × 5 alphabet, amber from 0.50 s and pale below; the
// plaque's lead "CONTACT · RIFLE · TAKEN IN 0.55 S" carries a strip ticked every 0.1 s on one scale for every sheet and
// filled to the take-in, so 0.80 and 0.05 differ at a glance; the parts' plate a segment a part as wide as its time. The
// take-in's words are react.js's takeInWords (the one formatter of the quantity); where the react role's module is not in
// the tree yet, a local stand-in of the same form (two places) is used, and the test says so. The log (J) explains it: the
// pause's record ("Contact · 0.55 s. Taken in in 0.55 s: … noticed. Lane 2, 7 m: a pistol.", contact.js's) reads as its
// head over the take-in's sum, factor by factor, folded as a roll's line, under the Rolls filter.
import { assert, fmt } from './helpers.mjs';
import { windowBracketPixels, bracketScale, stampPixels, stampColour, contactPixels, rowPartsPixels, colourAt, AMBER, STAMP_PALE, BRACKET_START_K, STAMP_AMBER_MS,
  STRIP_TICK_MS, STRIP_SPAN_MS, STRIP_TICK_PX, IDENT_WORDS, STYLES, stripSpanMs, PARTS_PX_S } from '../src/ui/plaque.js';
import { turnerPx, TURNER_K } from '../src/render/range-items.js';
import { contactLine, logLines, LOG_FILTERS } from '../src/ui/cards/log.js';

const react = await import('../src/sim/combat/react.js').catch(() => null);
const takeInWords = react?.takeInWords ?? ((ms) => (Math.max(0, ms) / 1000).toFixed(2));
const INK = 0x14151c;
// (every colour in a pixel buffer, as a set)
const coloursOf = (buf) => { const out = new Set(); for (let y = 0; y < buf.h; y++) for (let x = 0; x < buf.w; x++) { const c = colourAt(buf, x, y); if (c !== null) out.add(c); } return out; };
// (the bay's take-ins the faces show: the build sheet 0.0.8 §4's table on a passed roll, ms)
const BAY = Object.freeze({ recruit: { sector: 650, alert: 1300 }, private: { sector: 550, alert: 1050 }, sgt: { sector: 250, alert: 500 }, raider: { sector: 100, alert: 200 }, tierone: { sector: 50, alert: 150 } });

export default [
  {
    name: 'the window\'s brackets open at three times the target\'s box on the sighting tick and close linearly to it at the pause, 3 px amber arms inked round, the same pixels whatever face is behind them (where, never what)',
    fn() {
      const box = turnerPx(16);
      console.log(`      ${react ? 'react.js takeInWords' : 'a stand-in for takeInWords (react.js not in this tree)'}; the turner's face ${box.w} × ${box.h} px at 16 px/m (TURNER_K ${TURNER_K})`);
      const rows = [];
      for (const k of [0, 0.25, 0.5, 0.75, 1]) {
        const sc = bracketScale(k), b = windowBracketPixels({ w: box.w * sc, h: box.h * sc });
        rows.push(`k ${fmt(k, 2)}: × ${fmt(sc, 2)} → ${b.w} × ${b.h} px, arms ${b.arm} px`);
        // (the arms 3 px thick: the top-left corner's arm runs along its top three rows, amber, an ink pixel over it)
        // (past the corner's upright, 3 px wide from x 1: x 4 is on the top arm alone, amber three rows deep under its ink)
        assert(b.arm >= 4 && colourAt(b, 4, 1) === AMBER && colourAt(b, 4, 3) === AMBER && colourAt(b, 4, 0) === INK && colourAt(b, b.arm + 2, 2) === null, JSON.stringify({ k, arm: b.arm, top: [0, 1, 3].map(y => colourAt(b, 4, y)), past: colourAt(b, b.arm + 2, 2) }));
        const cs = coloursOf(b);
        assert(cs.size === 2 && cs.has(AMBER) && cs.has(INK), `one amber and the ink, never a kind's colour: ${[...cs].map(c => c.toString(16))}`);
        // (the middle of the box clear: hollow)
        assert(colourAt(b, Math.floor(b.w / 2), Math.floor(b.h / 2)) === null, 'hollow');
      }
      for (const r of rows) console.log(`      ${r}`);
      assert(bracketScale(0) === BRACKET_START_K && bracketScale(1) === 1 && Math.abs(bracketScale(0.5) - 2) < 1e-9 && bracketScale(-1) === 3 && bracketScale(2) === 1, 'the scale 3 → 1, clamped');
      // (the window's frames: at 60 frames a second a recruit's 0.65 s window closes over 39 frames, a tier one's 0.05 s in 3)
      for (const [who, ms] of [['boot recruit', 650], ['private', 550], ['tier one', 50]]) {
        const frames = Math.round(ms / (1000 / 60)), steps = new Set(Array.from({ length: frames + 1 }, (_, i) => Math.round(bracketScale(i / frames) * box.w)));
        console.log(`      ${who}, in his sector: ${ms} ms, ${frames} frames, ${steps.size} sizes of the brackets from ${Math.round(3 * box.w)} px to ${box.w}`);
      }
    },
  },
  {
    name: 'the stamp names the take-in in the picture\'s alphabet, "0.80 S", amber from 0.50 s and pale below, an ink pixel round each letter',
    fn() {
      const out = [];
      for (const [tier, t] of Object.entries(BAY)) for (const [e, ms] of Object.entries(t)) {
        const s = stampPixels(ms, takeInWords(ms)), c = stampColour(ms);
        out.push(`${tier} ${e} ${s.words} ${c === AMBER ? 'amber' : 'pale'}`);
        assert(s.words === `${takeInWords(ms)} S` && s.colour === c && c === (ms >= STAMP_AMBER_MS ? AMBER : STAMP_PALE), JSON.stringify({ ms, words: s.words }));
        const cs = coloursOf(s);
        assert(cs.has(c) && cs.has(INK) && cs.size === 2, JSON.stringify([...cs]));
      }
      console.log(`      ${out.join(' · ')}`);
      assert(stampColour(500) === AMBER && stampColour(450) === STAMP_PALE, 'the boundary at 0.50 s');
    },
  },
  {
    name: 'the plaque\'s lead says "CONTACT · RIFLE · TAKEN IN 0.55 S" and its strip is ticked every 0.1 s on one scale and filled to the take-in, so 0.80 and 0.05 differ at a glance',
    fn() {
      const lines = [];
      for (const [tier, t] of Object.entries(BAY)) for (const ms of [t.sector, t.alert]) {
        const c = contactPixels({ ms, words: takeInWords(ms), ident: 'rifle' });
        lines.push(`${tier} ${takeInWords(ms)} s: ${c.strip.filled} of ${c.strip.w} px, ${c.strip.ticks} ticks`);
        assert(c.words === `CONTACT · RIFLE · TAKEN IN ${takeInWords(ms)} S`, c.words);
        assert(c.strip.spanMs === STRIP_SPAN_MS && c.strip.ticks === STRIP_SPAN_MS / STRIP_TICK_MS, JSON.stringify(c.strip));
        assert(c.strip.filled === Math.max(1, Math.round(ms / STRIP_TICK_MS * STRIP_TICK_PX)), JSON.stringify({ ms, strip: c.strip }));
        // (the strip's filled part in the face's light, the rest its shade: the fill read from the pixels)
        const S = STYLES.hazard, y = c.strip.y + 1;
        let lit = 0;
        for (let x = c.strip.x; x < c.strip.x + c.strip.w; x++) if (colourAt(c, x, y) === S.hi) lit++;
        assert(Math.abs(lit - c.strip.filled) <= Math.ceil(c.strip.filled / STRIP_TICK_PX) + 1, JSON.stringify({ ms, lit, filled: c.strip.filled }));
      }
      console.log(`      ${lines.join(' · ')}`);
      const a = contactPixels({ ms: 800, words: '0.80' }), b = contactPixels({ ms: 50, words: '0.05' });
      console.log(`      0.80 s fills ${a.strip.filled} px, 0.05 s ${b.strip.filled}: ${fmt(a.strip.filled / b.strip.filled, 0)} times`);
      assert(a.strip.filled >= 12 * b.strip.filled, JSON.stringify([a.strip, b.strip]));
      // (a take-in past the span: the scale grows to the next whole second, so a miss's 2.95 s still fits)
      const long = contactPixels({ ms: 2950, words: '2.95' });
      assert(long.strip.spanMs === 3000 && stripSpanMs(1950) === 2000 && long.strip.filled === Math.round(2950 / 100 * STRIP_TICK_PX), JSON.stringify(long.strip));
      // (what was identified, after the pause only; a failed roll says the hands were not seen)
      for (const [k, w] of Object.entries(IDENT_WORDS)) assert(contactPixels({ ms: 550, words: '0.55', ident: k }).words.includes(w), k);
      assert(!Object.values(IDENT_WORDS).some(w => /THREAT|NO-SHOOT|ARMOUR/.test(w)) && contactPixels({ ms: 550, words: '0.55', ident: 'unseen' }).words === 'CONTACT · HANDS UNSEEN · TAKEN IN 0.55 S', 'the plate never names a face\'s kind');
    },
  },
  {
    name: 'a shot row\'s parts stand as a plate: a segment a part as wide as its time, each round its part\'s glyph and odds',
    fn() {
      const pair = { id: 'shot:pair', label: 'Pair', ms: 1230, parts: [{ k: 'aim', ms: 440 }, { k: 'press', ms: 150 }, { k: 'round', ms: 400 }, { k: 'round', ms: 240 }], rounds: [{ part: 'torso', odds: 0.95 }, { part: 'torso', odds: 0.9 }] };
      const failure = { id: 'shot:failure', label: 'Failure drill', ms: 820, parts: [{ k: 'press', ms: 150 }, { k: 'round', ms: 210 }, { k: 'round', ms: 90 }, { k: 'shift', ms: 210 }, { k: 'round', ms: 160 }], rounds: [{ part: 'torso', odds: 0.95 }, { part: 'torso', odds: 0.95 }, { part: 'head', odds: 0.75 }] };
      for (const row of [pair, failure]) {
        const p = rowPartsPixels(row);
        console.log(`      ${p.words}: ${p.w} × ${p.h} px, segments ${p.segs.map(s => `${s.k}${s.part ? ` ${s.part}` : ''} ${s.w} px`).join(', ')}`);
        assert(p.segs.length === row.parts.length && p.segs.filter(s => s.k === 'round').map(s => s.odds).join() === row.rounds.map(r => String(Math.round(r.odds * 100))).join(), JSON.stringify(p.segs));
        for (const [i, s] of p.segs.entries()) assert(s.w >= Math.round(row.parts[i].ms / 1000 * PARTS_PX_S), JSON.stringify({ i, s }));
        assert(p.segs.every((s, i) => i === 0 || s.x > p.segs[i - 1].x), 'in order');
      }
      assert(rowPartsPixels(failure).words.includes('HEAD 75%'), 'the head round named');
    },
  },
  {
    name: 'the log explains the take-in factor by factor: the pause\'s record reads "Contact · 0.55 s. Lane 2, 7 m: a pistol." over its sum "Taken in in 0.55 s: 0.54 (Warfighting 15) × 1 (your sector); Awareness 6 + 2 = 8 against 7, noticed.", folded as a roll\'s, among the Rolls',
    fn() {
      const recs = [
        { seq: 1, atMs: 1000, kind: 'contact', tone: 'warn', text: 'Contact · 0.55 s. Taken in in 0.55 s: 0.54 (Warfighting 15) × 1 (your sector); Awareness 6 + 2 = 8 against 7, noticed. Lane 2, 7 m: a pistol.' },
        { seq: 2, atMs: 2000, kind: 'contact', tone: 'warn', text: 'Contact · 1.60 s. Taken in in 1.60 s: 0.54 (Warfighting 15) × 2 (not where your muzzle was) × 1.15 (2 at once) × 1.5 (noticed late); Awareness 6 + 1 = 7 against 9, a natural 1, noticed late. Lanes 1 and 2, 7 m: a rifle, hands unseen.' },
      ];
      const lines = logLines({ log: recs }, { lonEDeg: 0 });
      for (const l of lines) console.log(`      ${l.text}\n        ${l.sub}`);
      assert(lines[1].text === 'Contact · 0.55 s. Lane 2, 7 m: a pistol.' && lines[1].sub.startsWith('Taken in in 0.55 s: 0.54 (Warfighting 15) × 1 (your sector)') && lines[1].roll, JSON.stringify(lines[1]));
      assert(lines[0].text.startsWith('Contact · 1.60 s.') && /noticed late\.$/.test(lines[0].sub), JSON.stringify(lines[0]));
      assert(LOG_FILTERS.rolls[1]({ kind: 'contact' }) && !LOG_FILTERS.other[1]({ kind: 'contact' }), 'among the rolls');
      assert(contactLine({ kind: 'roll' }) === null, 'a contact\'s only');
    },
  },
];
