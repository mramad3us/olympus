// Truth never leaks to the interface (quick; the build sheet 0.0.7 §5.5: "a state with the true wind 4.37 m/s from the
// left, the read 2.6, the true zero (6, −3) and the believed (7, −2): every string the step panel, the plaque, the weapon
// card, the coach's lines, the far window's label and C render contains the beliefs and none of the truths"; WEAPONS §4.2,
// §7.4, §7.10; the user's rule from tradecraft, 2026-10-26: "we only know what we know").
//
// The turrets are seen (the gun's sight is shown as it is); the zero, the wind and a range off a known line are beliefs.
// First on fed records in the shapes the shot role and the range give (plaqueOf's terms and kd, beliefOf's sight, zero,
// optic and dope, stepsOf's rows, kdNow's coach's call, farPointOf's label, the say facts): every renderer of the HUD
// (the weapon card's model and pixels, the plaque, its terms' plate and hover, the step rows, the radio box's lines, the
// far label, C) given a world whose truth differs, and its strings searched for the truth's numbers. Then on the real
// records of a test-range game at the 300 m line ('confirm'), its rifle's true zero set to (6, −3) and its holder's
// belief to (7, −2), the read set to 2.6 m/s: the real stepsOf, plaqueOf, beliefOf, farPointOf and kdNow through the
// same renderers, and the true wind at that moment (wind.js pathWind) nowhere in what they say.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { weaponCardModel, rowText, rowTitle, panelOf, BELIEF_FIELDS } from '../src/ui/hud/steps.js';
import { plaqueWords, plaqueParts, termsPixels, termLines, farLabel, plaquePixels, shotPlaque } from '../src/ui/plaque.js';
import { paintWeaponCard } from '../src/art/weaponcard.js';
import { lineOf } from '../src/ui/hud/radio.js';
import { kdLiveModel, groupCardModel } from '../src/ui/cards/kd.js';
import { sheetOf } from '../src/ui/cards/sheet.js';
import { beliefOf } from '../src/sim/arms/firearms.js';
import { plaqueOf } from '../src/sim/arms/shot.js';
import * as shooting from '../src/sim/arms/shooting.js';
import * as wind from '../src/sim/arms/wind.js';
import * as kdScene from '../src/sim/scenarios/range.js';
import { bodyOf } from '../src/sim/body/body.js';
import { stagesOf, stripOf, wordsOf, cuesOf } from '../src/sim/body/cues.js';
import { woundWords } from '../src/sim/body/wounds.js';
import { KD_RANGE } from '../src/data/places/range.js';

// (the world: the true crosswind 4.37 m/s from the left, the read 2.6; the true zero (6, −3), the believed (7, −2); the turrets at (4, −2))
const TRUE_CROSS = 4.37, READ = 2.6, TRUE_ZERO = Object.freeze({ elev: 6, wind: -3 }), BELIEVED = Object.freeze({ elev: 7, wind: -2 }), SIGHT = Object.freeze({ elev: 4, wind: -2 });
// (what the truth would say, in every form a renderer could put it: the wind to one or two decimals, the dial counted from the true zero)
const TRUTHS = [/4\.37/, /4\.4\b/, /2 clicks down/, /1 click right/, /▼2\b/];

/** Every string an object holds, deep (the renderers' records). */
const stringsOf = (o, out = []) => { if (typeof o === 'string') out.push(o); else if (Array.isArray(o)) o.forEach(v => stringsOf(v, out)); else if (o && typeof o === 'object') Object.values(o).forEach(v => stringsOf(v, out)); return out; };
const leaks = (strs, truths = TRUTHS) => strs.filter(s => truths.some(t => t.test(s)));

export default [
  {
    name: 'fed records: the weapon card, the plaque and its terms, the step rows, the coach\'s lines, the far label and C say the beliefs (the read 2.6, 3 clicks down off the believed zero) and none of the truths (4.37 m/s, the dial off the true zero)',
    fn() {
      // (the gun's belief as beliefOf gives it, with the truth beside it in fields a renderer must never read: a Proxy counts each key touched)
      const touched = new Set();
      const B = new Proxy({ model: 'r7', short: 'R-7', chamber: 'live', mag: 'in', count: 4, mode: 'semi', port: 'closed', condWord: 'fine', cocked: true, hand: null,
        sight: SIGHT, zero: BELIEVED, optic: 4, dope: { 200: { elev: 1, wind: -2 }, 300: { elev: 4, wind: -2 }, 500: { elev: 11, wind: -2 } },
        trueZero: TRUE_ZERO, truth: { zero: TRUE_ZERO, crossMs: TRUE_CROSS } }, { get(t, k) { touched.add(String(k)); return t[k]; } });
      const card = weaponCardModel(B, { distance: true, line: 300, hold: { xMil: 0.5, yMil: 0 } });
      paintWeaponCard({ model: 'r7', belief: B, distance: true, line: 300, hold: { xMil: 0.5, yMil: 0 } });
      const stray = [...touched].filter(k => !BELIEF_FIELDS.includes(k) && typeof k === 'string' && !k.startsWith('Symbol'));
      // (the plaque's record as plaqueOf gives it on a face: its terms the beliefs)
      const rec = { part: 'PAPER', rangeM: 300, rangeText: '300 M', odds: 0.72, oddsText: '72%', aimS: 1.2, next: 'aim', held: { aimed: false }, dc: 20,
        dcParts: [{ why: 'base', v: 6 }, { why: '300 m', v: 25 }, { why: 'the A target', v: -11 }], mods: [{ why: 'prone', v: 4 }, { why: 'the SO-4 at 4×', v: 5 }],
        terms: [{ key: 'range', words: '300 m, a known distance', v: 300 }, { key: 'wind', words: 'wind 2.6 m/s from the left, your read', v: READ }, { key: 'hold', words: 'held 0.5 mil right', v: [0.5, 0] }, { key: 'zero', words: 'the turrets 3 down of your zero', v: { elev: SIGHT.elev - BELIEVED.elev, wind: 0 } }],
        kd: { aimCm: [0, 0], poiCm: [1.2, -2.4], holdMil: [0.5, 0], scoreOdds: 0.72, ringOdds: { v: 0.05, 5: 0.2, 4: 0.3, 3: 0.12, 2: 0.05, miss: 0.28 } } };
      const plaqueStrs = [plaqueWords(rec), shotPlaque(rec).text, shotPlaque(rec).sub, ...stringsOf(plaqueParts(rec)), ...termLines(rec), termsPixels(rec.terms, { ringOdds: rec.kd.ringOdds }).words];
      // (the rows as stepsOf gives them at the line, the coach's say facts in the radio box, the far label, C)
      const rows = [{ id: 'sight:call', kind: 'single', label: 'Dial the coach\'s call: 1 down', ms: 400, words: 'his call from your marks' }, { id: 'hold:read', kind: 'single', label: 'Hold for your read: 0.5 mil right', ms: 300, words: 'your read: 2.6 m/s from the left' }];
      const rowStrs = panelOf(rows).slots.flatMap(s => [rowText(s), rowTitle(s.step)]);
      const state = { player: { id: 'p145', actor: 'a1' }, people: { p147: { name: { given: 'Ana', family: 'Ruiz' }, service: { rank: 'Sgt' } } } };
      const radio = [lineOf({ who: 'p147', kind: 'speech', text: 'Wind from the left, three and a half: hold three quarters of a mil right.' }, state)].flatMap(x => stringsOf(x));
      const far = [plaquePixels(farLabel({ key: 'face:10', label: 'TARGET 10 · 300 M', rangeM: 300, lane: 10 })).words];
      const all = [card.line, card.words, card.far, ...plaqueStrs, ...rowStrs, ...radio, ...far];
      console.log(`      the card: ${card.far} | ${card.words}`);
      console.log(`      the plaque: ${plaqueStrs.slice(0, 3).join(' | ')}; terms: ${plaqueStrs.at(-1)}`);
      console.log(`      ${all.length} strings searched; touched past the belief: ${stray.join(', ') || 'none'}; leaks: ${leaks(all).join(' | ') || 'none'}`);
      assert(!stray.length, `the card read past the belief: ${stray}`);
      assert(!leaks(all).length, JSON.stringify(leaks(all)));
      assert(all.some(s => /2\.6/.test(s)) && /▼3/.test(card.far) && /3 clicks down from your zero/.test(card.words), 'the beliefs are said');
    },
  },
  {
    name: 'real records on test-range at the 300 m line: the rifle truly zeroed at (6, −3), believed (7, −2), the read 2.6 m/s: the real stepsOf, plaqueOf, beliefOf, farPointOf, kdNow and C through the HUD\'s renderers say the beliefs, and the true wind at that moment is nowhere in them',
    fn() {
      const g = createGame({ scenario: 'test-range', seed: 48213, setup: 'confirm' }), s = g.state, pid = s.player.id;
      g.step(40);
      const gunId = shooting.gunOn(s, pid), gun = s.items[gunId];
      gun.zero = { ...TRUE_ZERO }; gun.sight = { ...SIGHT }; gun.optic = 4;
      gun.belief = { ...(gun.belief ?? {}), zero: { ...BELIEVED } };
      const R = s.armoury.range;
      R.reads = { ...(R.reads ?? {}), [pid]: { crossMs: READ, atMs: s.clock.ms } };
      if (s.stop?.mode !== 'stop') shooting.enterStop(s, g.bus ?? null, { pid, gunId });
      const face = shooting.targetsOf(s, pid).find(t => t.far && t.lane === kdScene.kdLane(s));
      assert(face, `your face in the targets: ${JSON.stringify(shooting.targetsOf(s, pid).map(t => t.key))}`);
      s.stop.pick = face.key;
      // (the truth at this moment: the crosswind along your line, wind.js's one helper)
      const me = s.actors.list.find(a => a.id === s.player.actor), lane = KD_RANGE.kd.lanes.find(l => l.lane === face.lane);
      const truth = wind.pathWind(s.meta.seed, s.clock.ms, { x: me.x, z: me.z }, { x: lane.face.x, z: lane.face.z }).crossMs;
      const truthRe = [new RegExp(`\\b${Math.abs(truth).toFixed(1).replace('.', '\\.')}\\b`), new RegExp(`\\b${Math.abs(truth).toFixed(2).replace('.', '\\.')}\\b`)];
      const ownTruths = [/2 clicks down/, /1 click right/, ...(Math.abs(Math.abs(truth) - READ) >= 0.05 ? truthRe : [])];
      const b = beliefOf(s, gunId), card = weaponCardModel(b, { distance: true, line: 300, hold: s.stop.hold ?? null });
      const rec = plaqueOf(s, pid, { target: face }), rows = shooting.stepsOf(s);
      const fp = shooting.farPointOf(s, pid), kd = kdScene.kdNow(s);
      const sheet = sheetOf(s, { body: { bodyOf, stagesOf, stripOf, wordsOf, cuesOf, woundWords } });
      const strs = [card.line, card.words, card.far, plaqueWords(rec), ...stringsOf(plaqueParts(rec)), ...termLines(rec), termsPixels(rec.terms ?? [], { ringOdds: rec.kd?.ringOdds }).words,
        ...panelOf(rows).slots.flatMap(x => [rowText(x), rowTitle(x.step)]), ...panelOf(rows, { page: 1 }).slots.flatMap(x => [rowText(x), rowTitle(x.step)]),
        fp ? plaquePixels(farLabel(fp)).words : '', kdLiveModel(kd?.pits?.[kd?.kdLane], { lane: kd?.kdLane, line: 300 }).words, groupCardModel(kd?.groups ?? [], { lane: kd?.lane }).words,
        ...stringsOf(sheet.needs), ...sheet.wounds, sheet.line];
      console.log(`      the true cross ${fmt(truth, 2)} m/s, the read ${READ}; the belief's zero ${JSON.stringify(b.zero)}, the turrets ${JSON.stringify(b.sight)}; the card: ${card.far}`);
      console.log(`      the plaque: ${plaqueWords(rec)}; its terms: ${(rec.terms ?? []).map(t => t.words).join(' · ')}`);
      console.log(`      the far label: ${fp?.label ?? 'none'}; ${strs.length} strings searched; leaks: ${leaks(strs, ownTruths).join(' | ') || 'none'}`);
      assert(!Object.keys(b).some(k => !BELIEF_FIELDS.includes(k)), `beliefOf gives a field the HUD does not know: ${Object.keys(b)}`);
      assert(JSON.stringify(b.zero) === JSON.stringify(BELIEVED) && /▼3/.test(card.far ?? ''), JSON.stringify({ zero: b.zero, far: card.far }));
      assert(!leaks(strs, ownTruths).length, JSON.stringify(leaks(strs, ownTruths)));
      assert((rec.terms ?? []).some(t => t.key === 'wind' && Math.abs(t.v - READ) < 1e-9), `the plaque's wind is the read: ${JSON.stringify(rec.terms)}`);
    },
  },
];
