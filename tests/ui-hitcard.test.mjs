// The hit card's face in node: the build sheet 0.0.10 §5.3's ui-hitcard (VIEWS §7.7; the user's words of 2026-11-07: "Targets in game
// should be represented with the same logic we represent the shooting range targets, drawn with impact points drawn as well, using
// similar to inventory and character menu drawings of people"; their answer A, the doll in colour; belief, then truth). HITCARD's place
// at 1600 × 900, 1024 × 768 and 1920 × 1080 clear of every HUD rectangle of its states and of PAPER; the card's marks equal the sim's
// hitMarks (src/sim/arms/marks.js) on a real run of "Bang" (the stress bot on seed 48213): during the string only the called rings and
// the seen ones filled, no hole; at its end the holes at the sim's points, numbered, coloured by zone; whole device pixels a card pixel
// where they fit (hitFit); the man-target's zones on the doll (the head's on its face, the A box on the chest); a golden digest of each
// look's drawing on fixed marks (re-set only on purpose); when the card shows (hitShown).
import { assert, fmt } from './helpers.mjs';
import { golden } from './golden.mjs';
import { rectsAt, clashesAt, overlaps, STATES, uiScale } from '../src/ui/hud/layout.js';
import { paintHitcard, cardDigest, manToCard, zonesOnCard, CARD_W, CARD_H, HIT_PX_PER_M, LOOKS, ZONE_C, RING_PX, HOLE_PX } from '../src/art/doll/hitcard.js';
import { hitFit, hitShown, cardModel, hitTabs, HIT_HOLD_MS, cardText } from '../src/ui/hud/hitcard.js';
import { unword } from '../src/art/paint.js';
import { PAPERS } from '../src/sim/arms/paper.js';
import { SKIN } from '../src/art/figures/outfits.js';
import { createGame } from './game.mjs';

const SIZES = [[1600, 900], [1024, 768], [1920, 1080]];
const HIT_STATES = ['weapon-hit', 'weapon-hit-paused', 'walking-hit', 'paused-hit'];
// (fixed marks for the goldens: a Pair to the chest, a third round high, a miss)
const FIXED = Object.freeze([
  { n: 1, shotId: 'g1', called: [-1.5, 2.0], seen: true, hole: [4.6, -3.1], zone: 'A', part: 'torso' },
  { n: 2, shotId: 'g2', called: [2.5, 6.0], seen: true, hole: [-12.4, 15.8], zone: 'C', part: 'torso' },
  { n: 3, shotId: 'g3', called: [0.5, -21.0], seen: true, hole: [3.0, -26.5], zone: 'head', part: 'head' },
  { n: 4, shotId: 'g4', called: [6.0, 12.0], seen: false, hole: null, zone: null, part: 'torso' },
]);
const at = (pm, x, y) => unword(pm.data[y * pm.w + x]).hex;

// (a run of "Bang" with the stress bot to the first string's first round in the mode, then to its end: the belief and the truth)
let RUN = null;
async function run() {
  if (RUN) return RUN;
  const { stressBot } = await import('./bots/stress.mjs');
  const MARKS = await import('../src/sim/arms/marks.js');
  const g = createGame({ scenario: 'test-stress', seed: 48213, tier: 'recruit' }), bot = stressBot();
  const R = () => g.state.armoury.range;
  let n = 0;
  for (; n < 40000 && !(R().str && !R().str.done && R().str.shots?.some(x => x.fired) && g.state.stop?.mode === 'stop' && g.state.stop.phase === 'choose'); n++) g.step(1, bot);
  const k = R().str.k, keys = [...R().str.keys];
  const belief = keys.map(key => MARKS.hitMarks(g.state, key, { k })).find(h => h?.marks?.length);
  for (; n < 80000 && !(R().strs.some(x => x.k === k && x.done !== 'setup')); n++) g.step(1, bot);
  const truth = MARKS.hitMarks(g.state, belief.key, { k });
  const rec = (R().stress?.strs ?? []).find(x => x.k === k);
  RUN = { g, k, belief, truth, rec, ticks: n };
  return RUN;
}

export default [
  {
    name: 'HITCARD at 1600 × 900, 1024 × 768 and 1920 × 1080 meets no rectangle of its states (PAPER, TOASTS, WATCH, STEPS, RADIO, INSTINCT, KEYS, PAUSED), and every state without it is as before',
    fn() {
      const rows = [];
      for (const [w, h] of SIZES) {
        const r = rectsAt(w, h, 'weapon-hit'), clash = HIT_STATES.flatMap(st => clashesAt(w, h, st).map(c => `${st}: ${c}`));
        rows.push(`${w} × ${h} (--ui ${uiScale(w, h)}): HITCARD ${fmt(r.HITCARD.x)}, ${fmt(r.HITCARD.y)}, ${fmt(r.HITCARD.w)} × ${fmt(r.HITCARD.h)}; PAPER at ${fmt(r.PAPER.x)}; TOASTS' foot ${fmt(r.TOASTS.y + r.TOASTS.h)}; clashes ${clash.join(', ') || 'none'}`);
        assert(!clash.length, JSON.stringify(clash));
        assert(!overlaps(r.HITCARD, r.PAPER) && !overlaps(r.HITCARD, r.TOASTS) && r.HITCARD.x >= 0 && r.HITCARD.y + r.HITCARD.h < r.RADIO.y, JSON.stringify(r));
        for (const st of HIT_STATES) assert(STATES[st].includes('HITCARD') && STATES[st].includes('PAPER'), st);
        // (the states that were: no HITCARD, so test-pairs and the other courses keep their places to the pixel)
        for (const st of ['walking', 'weapon', 'weapon-far', 'walking-paper', 'paused-paper']) assert(!STATES[st].includes('HITCARD'), st);
      }
      for (const l of rows) console.log(`      ${l}`);
    },
  },
  {
    name: 'the card painted at its box\'s whole pixels (200 from --ui 1, 170 at 1024 × 768: the runtime review of 0.0.10, as the 200 px card resampled smooth to 170 smeared its marks and words) and shown at whole device pixels a card pixel at every test size; it shows in belief at the pause and HIT_HOLD_MS out of the mode, in truth until the next string',
    fn() {
      const rows = [];
      for (const [w, h] of SIZES) for (const dpr of [1, 2]) {
        const ui = uiScale(w, h), f = hitFit(ui, dpr), devPx = f.k * dpr, size = f.size * f.k;
        rows.push(`${w} × ${h} at DPR ${dpr}: painted ${f.size} px, ${f.smooth ? 'smooth' : `${devPx} device px a card px`}, the card ${fmt(size)} CSS px in a box of ${fmt(CARD_W * ui)}`);
        assert(size <= CARD_W * ui + 1e-6 && !f.smooth, JSON.stringify({ w, h, dpr, f }));
        assert(Math.abs(devPx - Math.round(devPx)) < 1e-9 && devPx >= 1, JSON.stringify(f));
      }
      assert(!hitFit(1.25, 1).smooth && !hitFit(0.85, 1).smooth && hitFit(0.85, 1).size === 170 && hitFit(0.85, 1).k === 1 && !hitFit(1.5, 1).smooth && !hitFit(1.25, 2).smooth && hitFit(0.7, 1).smooth, 'the test sizes');
      const shown = (o) => hitShown({ phase: 'belief', n: 2, lastT: 1000, ...o });
      rows.push(`hitShown: in the mode ${shown({ inStop: true, nowT: 99999 })}, out of it 5.9 s after ${shown({ nowT: 1000 + HIT_HOLD_MS - 100 })}, 6.1 s after ${shown({ nowT: 1000 + HIT_HOLD_MS + 100 })}; truth ${hitShown({ phase: 'truth', n: 1, nowT: 1e9 })}; no rounds ${hitShown({ phase: 'truth', n: 0 })}`);
      assert(shown({ inStop: true, nowT: 99999 }) && shown({ nowT: 1000 + HIT_HOLD_MS - 100 }) && !shown({ nowT: 1000 + HIT_HOLD_MS + 100 }) && hitShown({ phase: 'truth', n: 1, nowT: 1e9 }) && !hitShown({ phase: 'truth', n: 0 }), 'hitShown');
      const tabs = hitTabs(['turner:4', 'turner:2'], 'turner:2', (k) => Number(k.split(':')[1]));
      rows.push(`tabs: ${tabs.map(t => `${t.label}${t.on ? ' (shown)' : ''}`).join(', ')}`);
      assert(tabs.length === 2 && tabs[1].on && tabs[0].label === 'L4', JSON.stringify(tabs));
      for (const l of rows) console.log(`      ${l}`);
    },
  },
  {
    name: 'the man-target over the doll (VIEWS §7.7): life size at HIT_PX_PER_M 96, its head\'s centre on the doll\'s face (skin), its A box on the chest (cloth), the figure head to mid-thigh',
    fn() {
      const pm = paintHitcard({ look: 'A', man: PAPERS.man, phase: 'truth', marks: [], words: '' }), z = zonesOnCard('A', PAPERS.man);
      const [hx, hy] = manToCard(0, -30, 'A'), [ax, ay] = manToCard(0, 0, 'A');
      const head = at(pm, Math.round(hx), Math.round(hy)), chest = at(pm, Math.round(ax), Math.round(ay));
      const skin = Object.values(SKIN), skinish = (c) => { const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255; return r > g && g > b && r > 120; };
      console.log(`      the head's centre at ${fmt(hx)}, ${fmt(hy)}: #${head.toString(16)}; the A centre at ${fmt(ax)}, ${fmt(ay)}: #${chest.toString(16)}; the A box ${fmt(z.A.w)} × ${fmt(z.A.h)} px (16 × 28 cm), the torso ${fmt(z.torso.w)} × ${fmt(z.torso.h)}, the head's ring ${fmt(z.head.r)} px; ${HIT_PX_PER_M} px a metre`);
      assert(skinish(head) || skin.includes(head), `the head's centre is not on the face: #${head.toString(16)}`);
      assert(!skinish(chest), `the A centre is not on the cloth: #${chest.toString(16)}`);
      assert(Math.abs(z.A.w - 16 * HIT_PX_PER_M / 100) < 0.01 && Math.abs(z.A.h - 28 * HIT_PX_PER_M / 100) < 0.01, JSON.stringify(z));
    },
  },
  {
    name: 'the card\'s marks equal hitMarks\' on a real run of "Bang" (seed 48213, the boot recruit, string 1): during the string the called rings and the seen ones filled, no hole and no zone; at its end the holes at the sim\'s points, numbered in order, coloured by zone; a save and load gives the same marks',
    async fn() {
      const { g, k, belief, truth, rec, ticks } = await run();
      const MARKS = await import('../src/sim/arms/marks.js');
      const b = paintHitcard({ ...cardModel(belief), look: 'A' }), t = paintHitcard({ ...cardModel(truth), look: 'A' });
      console.log(`      ${ticks} ticks; string ${k + 1}, ${belief.key}: belief '${belief.words}' ${belief.marks.map(m => `${m.n}${m.seen ? ' seen' : ' called'} at ${m.called.map(v => fmt(v)).join(',')}`).join('; ')}`);
      console.log(`      truth '${truth.words}' / '${truth.line}': ${truth.marks.map(m => `${m.n} ${m.zone ?? 'miss'} at ${m.hole ? m.hole.map(v => fmt(v)).join(',') : '-'}`).join('; ')}; the record's holes ${JSON.stringify((rec?.holes ?? []).map(h => [h.zone, h.at]))}`);
      console.log(`      drawn: belief ${JSON.stringify(b.marks.map(d => [d.n, d.kind, d.x, d.y]))}; truth ${JSON.stringify(t.marks.map(d => [d.n, d.kind, d.zone, d.x, d.y]))}; the card's words '${cardText(cardModel(truth))}'`);
      // (belief: no hole, no zone; every round marked once, in order, at its called point; filled only those that struck)
      assert(belief.phase === 'belief' && belief.marks.every(m => m.hole === null && m.zone === null), JSON.stringify(belief.marks));
      assert(b.marks.length === belief.marks.length && b.marks.every((d, i) => d.n === belief.marks[i].n && d.kind === (belief.marks[i].seen ? 'seen' : 'ring') && d.zone === null), JSON.stringify(b.marks));
      for (const [i, d] of b.marks.entries()) { const [x, y] = manToCard(...belief.marks[i].called, 'A'); assert(d.x === Math.round(x) && d.y === Math.round(y), JSON.stringify({ d, x, y })); }
      // (truth: the holes the sim's, numbered, coloured by zone; a miss never on the figure)
      const holes = truth.marks.filter(m => m.hole);
      assert(truth.phase === 'truth' && t.marks.length === holes.length && t.marks.every((d, i) => d.n === holes[i].n && d.kind === 'hole' && d.zone === holes[i].zone), JSON.stringify(t.marks));
      for (const [i, d] of t.marks.entries()) {
        const [x, y] = manToCard(...holes[i].hole, 'A');
        assert(d.x === Math.round(x) && d.y === Math.round(y) && at(t, d.x, d.y) === ZONE_C[holes[i].zone], JSON.stringify({ d, x, y, c: at(t, d.x, d.y).toString(16) }));
      }
      // (the sim's holes: the record's own points)
      if (rec?.holes?.length) for (const m of holes) assert(rec.holes.some(h => h.at && Math.abs(h.at[0] - m.hole[0]) < 1e-6 && Math.abs(h.at[1] - m.hole[1]) < 1e-6), JSON.stringify({ m, holes: rec.holes }));
      // (a save and load: the same marks)
      const g2 = createGame({ scenario: 'test-stress', seed: 48213, tier: 'recruit' });
      g2.load(g.save());
      const again = MARKS.hitMarks(g2.state, truth.key, { k });
      assert(JSON.stringify(again.marks) === JSON.stringify(truth.marks), 'a load moved the marks');
    },
  },
  {
    name: 'the three looks (A the doll in colour, B the khaki board, C the casualty card) on fixed marks, belief and truth: golden digests of each drawing (re-set only on purpose)',
    fn() {
      const DIG = {
        // (re-set by the fixer of 0.0.10 on purpose: the figure from figTop, the coach's line at the headline's size, the numbers
        // placed clear of each other, C's labels over its figures; was 1660b953e599ef, 0e7e7298cafcfc, 01b7d4ed88981c, 13bc266888e7e4,
        // 18cf05cad3dd48, 0ecd715e082daa)
        'A-belief': '0346c1803b892c', 'A-truth': '19352a55e555f4', 'B-belief': '0e3dfdf1feb2ea', 'B-truth': '137286d5976b39', 'C-belief': '06ba953bae304c', 'C-truth': '12400760f20a76',
      };
      const rows = [];
      const t0 = performance.now();
      for (const look of LOOKS) for (const phase of ['belief', 'truth']) {
        const pm = paintHitcard({ look, phase, man: PAPERS.man, marks: FIXED, words: phase === 'truth' ? 'PAIR · A · C · HEAD · MISS' : 'PAIR · HAMMER · 3 SEEN', line: 'Two in the chest, one in the head. He went down.' });
        assert(pm.w === CARD_W && pm.h === CARD_H, `${pm.w} × ${pm.h}`);
        const want = phase === 'belief' ? FIXED.length : FIXED.filter(m => m.hole).length;
        assert(pm.marks.length === want, `${look} ${phase}: ${pm.marks.length} marks`);
        rows.push(`${look} ${phase}: ${pm.marks.length} marks, digest ${cardDigest(pm)}`);
        golden(`hitcard ${look} ${phase}`, pm.data, DIG[`${look}-${phase}`]);
      }
      const ms = (performance.now() - t0) / 6;
      for (const l of rows) console.log(`      ${l}`);
      console.log(`      a card painted in ${fmt(ms, 1)} ms on average (the doll cached by face); a ring ${RING_PX} px, a hole ${HOLE_PX} px in its rim`);
    },
  },
];
