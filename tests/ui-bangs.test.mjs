// "Three bangs"'s face in node (quick) and in the page (heavy): the build sheet 0.0.9 §5.3's ui-bangs. The picture's chaos
// (src/render/chaos.js: the band's corners, the drain and the dither, the startle's dark, the flash's white by blind.k frame by
// frame, the reduced grey), the bang drawn at its real size and time (src/render/range-items.js: the flash 1.2 m in radius for
// 30 ms, the smoke growing from 0.3 to 1.5 m over 1.5 s and fading by 8 s with no frame's step a pop, the body's arc), the FROZE
// stamp (src/ui/plaque.js: amber, its words), "! shaking" (src/ui/hud/steps.js: its odds kept, its term and the arithmetic on its
// hover), C's Hardening row and the picker in words (src/ui/cards/sheet.js, pairs.js: green to unshakeable, never the number),
// the banged paper (src/ui/hud/timer.js), the end card's lines and the score line in ROADMAP §2.2's form; in the page, the picker,
// C and the end card at 1600 × 900 and 1024 × 768 meeting no HUD rectangle. Felt is never a number but on the roll's hover and in
// J. The sim's helpers are supp.js's; where the scene's are not in this tree yet, the test says so.
import { assert, fmt } from './helpers.mjs';
import { chaosOf, easeChaos, coneK, CALM, VIGNETTE_K, DRAIN_K, STARTLE_DARK, REDUCED_GREY, CHAOS_EASE_S } from '../src/render/chaos.js';
import { bangFlashPixels, bangSmokePixels, bangBodyPixels, bangBodyAt, bangFlashOn, puffRadiusM, smokeDensity, BANG_FLASH_MS, BANG_FLASH_R_M, BANG_SMOKE_MS, BANG_PUFF_MS, BANG_HAND_Y_M } from '../src/render/range-items.js';
import { frozePixels, FROZE_COLOUR, AMBER, chaosSum, feltMod, textW } from '../src/ui/plaque.js';
import { rowText, rowTitle, isShaking, shakingWords } from '../src/ui/hud/steps.js';
import { hardeningRow, sheetOf } from '../src/ui/cards/sheet.js';
import { pickerRows, bangLines, SETUP_LINES } from '../src/ui/cards/pairs.js';
import { timerModel } from '../src/ui/hud/timer.js';
import { scoreLine } from '../src/ui/cards/score.js';
import { startleLine, logLines } from '../src/ui/cards/log.js';
import { readParams, SETUPS } from '../src/core/debug.js';
import { BENCH_SCENES } from '../src/data/bench.js';
import { bangOf } from '../src/ui/cards/bench.js';
import { menuActs } from '../src/ui/boot.js';
import { standingLine, boxLines, lineOf } from '../src/ui/hud/radio.js';
import { pairsBot } from './bots/pairs.mjs';
import { SMOKE_FIG_HALF_W_M, SMOKE_OFF_PAD_M } from '../src/render/range-items.js';
import { createGame } from './game.mjs';
import * as SUPP from '../src/sim/combat/supp.js';
import { TEST_SHEETS } from '../src/sim/skills/templates.js';
import { SCENES } from '../src/data/scenes.js';
import { withGame } from './browser.mjs';
import { overlaps } from '../src/ui/hud/layout.js';

const PPM = 16;
const react = await import('../src/sim/combat/react.js');
const takeInWords = react.takeInWords;
// (the scene's record, or the build sheet §2.2's where scenes.js has none yet)
const SCENE = SCENES['test-pairs-bangs'] ?? { id: 'test-pairs-bangs', title: 'Three bangs', scenario: 'test-pairs', setup: 'bangs', aspects: [['bangs', "the bangs: does the recruit's hand fail and the tier one's not, as the marine's, not as lag"]], sheets: ['recruit', 'private', 'sgt', 'raider', 'tierone'], sheet: 'recruit' };
// (suppNow's records as the sheet's §3 shows them: the recruit pinned after three bangs, the tier one at felt 10)
const SN = Object.freeze({
  recruit: { pool: 105, H: 7, felt: 98, band: 'pinned', bandN: 3, mod: -10, timeK: 1.49, word: 'green', startle: null, froze: { ms: 2450, atMs: 1000 }, blind: null, dazzle: null, deaf: { untilMs: 9e9, voiceM: 2 }, sum: SUPP.suppWords({ pool: 105, H: 7, felt: 98, mod: -10 }) },
  tierone: { pool: 105, H: 95, felt: 10, band: 'calm', bandN: 0, mod: -1, timeK: 1.05, word: 'unshakeable', startle: null, froze: { ms: 50, atMs: 1000 }, blind: null, dazzle: null, deaf: { untilMs: 9e9, voiceM: 2 }, sum: SUPP.suppWords({ pool: 105, H: 95, felt: 10, mod: -1 }) },
});
const BANG = Object.freeze({ id: 'pairs:0:1', i: 1, x: 1115.5, z: 292.3, fromX: 1116.1, fromZ: 291.1, throwAtMs: 400_000, atMs: 401_000, done: true });
const HUD_DIGITS = /\d/;

export default [
  {
    name: 'the picture by felt\'s band (VIEWS §7.3): calm nothing, under fire 6% at the corners, suppressed 14% dithered, pinned 24% and the colour drained 20%; the tier one under three bangs (felt 10, calm) shows nothing; the startle holds 12% dark; a band\'s change eases over 0.6 s, never a pop',
    fn() {
      const rows = [];
      for (const [n, band] of [[0, 'calm'], [1, 'under fire'], [2, 'suppressed'], [3, 'pinned']]) {
        const c = chaosOf({ bandN: n, band });
        rows.push(`${band}: corners ${fmt(c.vignette * 100, 0)}%, dither ${c.dither}, drained ${fmt(c.drain * 100, 0)}%`);
        assert(c.vignette === VIGNETTE_K[n] && c.drain === (n === 3 ? DRAIN_K : 0) && c.dither === (n >= 2 ? 1 : 0), JSON.stringify(c));
      }
      assert(VIGNETTE_K.join() === '0,0.06,0.14,0.24' && DRAIN_K === 0.2, VIGNETTE_K.join());
      const t1 = chaosOf(SN.tierone);
      rows.push(`the tier one at felt 10: ${JSON.stringify({ vignette: t1.vignette, drain: t1.drain, dark: t1.dark, white: t1.white })}`);
      assert(t1.vignette === 0 && t1.drain === 0 && t1.dark === 0 && t1.white === 0, JSON.stringify(t1));
      assert(chaosOf(null) === CALM, 'no block: calm');
      const st = chaosOf({ bandN: 3, band: 'pinned', startle: { fromMs: 1000, untilMs: 3450 } }, { ms: 2000 });
      const after = chaosOf({ bandN: 3, band: 'pinned', startle: { fromMs: 1000, untilMs: 3450 } }, { ms: 3450 });
      rows.push(`startled at 2.000 s: dark ${st.dark}; at its end 3.450 s: ${after.dark}`);
      assert(st.dark === STARTLE_DARK && after.dark === 0, JSON.stringify({ st, after }));
      // (calm to pinned eased at 60 fps: the biggest step a frame, and how long to within a hundredth)
      let shown = { ...CALM }, maxStep = 0, t = 0;
      const want = chaosOf({ bandN: 3, band: 'pinned' });
      for (; t < 3 && Math.abs(shown.vignette - want.vignette) > 0.05 * want.vignette; t += 1 / 60) { const next = easeChaos(shown, want, 1 / 60); maxStep = Math.max(maxStep, next.vignette - shown.vignette); shown = next; }
      rows.push(`calm to pinned at 60 fps: ${fmt(t, 2)} s to 95% of its 24%, its biggest step a frame ${fmt(maxStep * 100, 2)} points (the ease's ${CHAOS_EASE_S} s)`);
      assert(maxStep < 0.03 && t <= CHAOS_EASE_S + 0.05, JSON.stringify({ maxStep, t }));
      for (const l of rows) console.log(`      ${l}`);
    },
  },
  {
    name: 'flash-blind: the white is blind.k frame by frame, over the cone the eyes faced (whole within 60°, nothing past 120°), with an afterimage strongest halfway through its fade; reduced flashes give a 60% grey veil and no white; the dazzle a pale veil by dazzle.k',
    fn() {
      const rows = [];
      // (the sim's k over the 5 s, at each 50 ms tick: the white is that k, never more, never after it)
      let worst = 0;
      for (let ms = 0; ms <= 5200; ms += 50) {
        const k = Math.max(0, Math.min(1, (5000 - ms) / 5000)), sn = { bandN: 0, band: 'calm', blind: k > 0 ? { untilMs: 5000, k } : null };
        const c = chaosOf(sn, { ms, face: 'left', burst: { x: 0, z: 0 } });
        worst = Math.max(worst, Math.abs(c.white - k));
        if (ms % 1000 === 0) rows.push(`t ${fmt(ms / 1000, 1)} s: blind.k ${fmt(k, 2)} → white ${fmt(c.white, 2)}, afterimage ${fmt(c.after, 2)}`);
      }
      assert(worst === 0, `the white off blind.k by ${worst}`);
      const red = chaosOf({ bandN: 0, blind: { untilMs: 5000, k: 0.8 } }, { reduce: true });
      rows.push(`reduced flashes at k 0.8: white ${red.white}, grey ${fmt(red.grey, 2)} (${REDUCED_GREY * 100}% × k)`);
      assert(red.white === 0 && Math.abs(red.grey - REDUCED_GREY * 0.8) < 1e-9, JSON.stringify(red));
      const dz = chaosOf({ bandN: 0, dazzle: { untilMs: 2000, k: 0.5 } });
      rows.push(`dazzled at k 0.5: the pale veil ${dz.veil}`);
      assert(dz.veil === 0.25 && dz.white === 0, JSON.stringify(dz));
      const cone = [0, 45, 60, 90, 120, 150, 180].map(deg => { const a = deg * Math.PI / 180; return [deg, coneK(Math.cos(a) * 10, Math.sin(a) * 10, 'right')]; });
      rows.push(`the cone, facing right: ${cone.map(([d, k]) => `${d}° ${fmt(k, 2)}`).join(', ')}`);
      assert(cone[0][1] === 1 && cone[2][1] === 1 && cone[4][1] === 0 && cone[6][1] === 0 && cone[3][1] > 0 && cone[3][1] < 1, JSON.stringify(cone));
      for (const l of rows) console.log(`      ${l}`);
    },
  },
  {
    name: 'the bang drawn at its real size and time: the flash 1.2 m in radius (19 px at 16 px/m) for 30 ms and on one forced frame after, the body from the coach\'s hand on a low arc to the pad, the smoke from 0.3 to 1.5 m over 1.5 s, thinning, gone by 8 s, no frame\'s step at 60 fps a pop',
    fn() {
      const rows = [];
      const fl = bangFlashPixels(BANG, BANG.atMs, PPM);
      const up = fl.filter(p => !p.flat), xs = up.map(p => p.x), w = Math.round((Math.max(...xs) - Math.min(...xs)) * PPM) + 1, h = Math.round(Math.max(...up.map(p => p.y)) * PPM + 0.5);
      rows.push(`the flash at its moment: ${fl.length} px, ${w} px across and ${h} px high (1.2 m: ${Math.round(BANG_FLASH_R_M * PPM)} px), centred ${fmt((Math.max(...xs) + Math.min(...xs)) / 2, 2)} (the bang at ${BANG.x})`);
      assert(Math.abs(w - (2 * Math.round(BANG_FLASH_R_M * PPM) + 1)) <= 2 && Math.abs(h - (Math.round(BANG_FLASH_R_M * PPM) + 1)) <= 2, JSON.stringify({ w, h }));
      assert(Math.abs((Math.max(...xs) + Math.min(...xs)) / 2 - BANG.x) < 0.07, 'the flash at the bang');
      const times = [-1, 0, 16, 29, 30, 50].map(d => [d, bangFlashPixels(BANG, BANG.atMs + d, PPM).length]);
      rows.push(`the flash's pixels by ms after the bang: ${times.map(([d, n]) => `${d} ms ${n}`).join(', ')}; forced at 60 ms: ${bangFlashPixels(BANG, BANG.atMs + 60, PPM, { force: true }).length}`);
      assert(times[0][1] === 0 && times[1][1] > 0 && times[3][1] > 0 && times[4][1] === 0 && BANG_FLASH_MS === 30 && bangFlashOn(BANG, BANG.atMs + 60, true), JSON.stringify(times));
      // (the body: from the hand, over the arc, on the pad)
      const at = [0, 0.25, 0.5, 0.75, 1].map(u => bangBodyAt(BANG, BANG.throwAtMs + u * (BANG.atMs - BANG.throwAtMs)));
      rows.push(`the body: ${at.map(a => `(${fmt(a.x, 2)}, ${fmt(a.y, 2)} m up)`).join(' → ')}; before the throw ${bangBodyAt(BANG, BANG.throwAtMs - 1)}; lying ${bangBodyPixels(BANG, BANG.atMs + 5000, PPM).length} px flat`);
      assert(at[0].y === BANG_HAND_Y_M && at[2].y > BANG_HAND_Y_M * 0.5 && !at[4].flying && bangBodyAt(BANG, BANG.throwAtMs - 1) === null, JSON.stringify(at));
      // (the smoke: its radius and density by its time, its pixels frame by frame at 60 fps)
      const radii = [0, 0.375, 0.75, 1.125, 1.5, 3, 6].map(t => [t, puffRadiusM(t)]);
      rows.push(`a puff's radius: ${radii.map(([t, r]) => `${t} s ${fmt(r, 2)} m`).join(', ')}; density at 0, 1.5, 4, 7.9, 8 s: ${[0, 1.5, 4, 7.9, 8].map(t => fmt(smokeDensity(t), 2)).join(', ')}`);
      assert(Math.abs(radii[0][1] - 0.3) < 1e-9 && Math.abs(radii[4][1] - 1.5) < 1e-9 && radii.every((r, i) => !i || r[1] >= radii[i - 1][1]) && smokeDensity(BANG_SMOKE_MS / 1000) === 0, JSON.stringify(radii));
      let prev = 0, maxJump = 0, peak = 0, last = 0;
      const wind = { towardRad: 0.6, speedMs: 4 };
      for (let ms = 0; ms <= BANG_SMOKE_MS + 100; ms += 1000 / 60) {
        const n = bangSmokePixels(BANG, BANG.atMs + ms, PPM, wind).length;
        if (ms > 0) maxJump = Math.max(maxJump, Math.abs(n - prev));
        peak = Math.max(peak, n); prev = n; last = n;
      }
      rows.push(`the smoke over 8 s at 60 fps: at most ${peak} px, the biggest change a frame ${maxJump} px (${fmt(maxJump / peak * 100, 1)}% of its peak), ${last} at 8.1 s; at 1.5 s ${bangSmokePixels(BANG, BANG.atMs + BANG_PUFF_MS, PPM, wind).length}`);
      assert(last === 0 && maxJump / peak < 0.12, JSON.stringify({ peak, maxJump, last }));
      for (const l of rows) console.log(`      ${l}`);
    },
  },
  {
    name: 'FROZE: "FROZE 2.45 S" in the take-in stamp\'s 3 × 5 alphabet, amber whatever its length (the tier one\'s "FROZE 0.05 S" too), its figure react.js takeInWords\'; the felt term on the roll\'s hover with the chaos\'s arithmetic, and nowhere on a row but its hover',
    fn() {
      const rows = [];
      for (const ms of [2450, 1190, 50]) {
        const p = frozePixels(ms, takeInWords(ms));
        rows.push(`'${p.words}': ${p.w} × ${p.h} px, ${p.colour === AMBER ? 'amber' : p.colour.toString(16)}`);
        assert(p.words === `FROZE ${takeInWords(ms)} S` && p.colour === FROZE_COLOUR && FROZE_COLOUR === AMBER && p.h === 7 && p.w === textW(p.words) + 2, JSON.stringify(p.words));
      }
      assert(frozePixels(2450, takeInWords(2450)).words === 'FROZE 2.45 S', 'the anchor\'s words');
      const mods = [{ why: 'prone', v: 4, src: 'stance' }, SUPP.suppMod(98, 'weapons')];
      const line = chaosSum(feltMod(mods), SN.recruit);
      rows.push(`the hover's chaos line: '${line}'`);
      assert(/^pinned −10: the chaos 105 − your hardening 7 = felt 98$/.test(line), line);
      assert(chaosSum(feltMod([{ why: 'prone', v: 4 }]), SN.recruit) === null, 'no felt term: no line');
      for (const l of rows) console.log(`      ${l}`);
    },
  },
  {
    name: '"! shaking" on a row the chaos cut under 70%: "Fire · 0.7 s · 45% ! shaking", marked, never struck, never routine; its hover "pinned −10: the chaos 105 − your hardening 7 = felt 98"; a calm row as before',
    fn() {
      const fire = { id: 'fire', kind: 'fire', label: 'Fire', ms: 700, odds: 0.45, routine: false, shaking: { v: -10, felt: 98, band: 'pinned' }, warn: 'shaking', skill: 'marksmanship' };
      const off = { id: 'selector:semi', kind: 'single', label: 'Off safe', ms: 390, odds: 0.45, routine: false, shaking: { v: -10, felt: 98, band: 'pinned' }, warn: 'shaking', skill: 'weapons' };
      const calm = { id: 'selector:semi', kind: 'single', label: 'Off safe', ms: 300, odds: 1, routine: true, skill: 'weapons' };
      const t1 = rowText({ key: '1', step: fire }), t2 = rowText({ key: '3', step: off }), t3 = rowText({ key: '3', step: calm });
      const h = rowTitle(fire, { chaos: SN.recruit });
      console.log(`      '${t1}' | '${t2}' | calm '${t3}'\n      hover: '${h}'`);
      assert(t1 === '1 Fire · 0.7 s · 45% ! shaking' && t2 === '3 Off safe · 0.4 s · 45% ! shaking' && t3 === '3 Off safe · 0.3 s · routine', JSON.stringify([t1, t2, t3]));
      assert(h.startsWith('pinned −10: the chaos 105 − your hardening 7 = felt 98') && isShaking(fire) && !isShaking(calm) && shakingWords(fire) === 'pinned −10', h);
      assert(!HUD_DIGITS.test(t1.replace(/\d+(\.\d+)? s|\d+%|^\d/g, '')), 'felt on the row');
    },
  },
  {
    name: 'Hardening in words (the user, 2026-11-07: "shown in words from green to unshakeable"): C\'s row for the six test sheets ("green · inoculation 2 of 6: as far as boot camp goes"), the number only on its hover; the picker\'s lines end with the word; the hardening never a number on either',
    fn() {
      const rows = [], want = { recruit: 'green', private: 'green', cpl: 'settled', sgt: 'steady', raider: 'hardened', tierone: 'unshakeable' };
      const readers = { hardParts: SUPP.hardParts, hardWord: SUPP.hardWord, inocOf: SUPP.inocOf };
      for (const tier of Object.keys(want)) {
        const g = createGame({ scenario: 'test-pairs', seed: 48213, tier });
        const s = g.state, pid = s.player.id, row = hardeningRow(s, pid, s.clock.ms, readers), sheet = sheetOf(s, { supp: readers });
        const onC = sheet.file.find(f => f[0] === 'Hardening');
        rows.push(`${TEST_SHEETS[tier]?.label ?? tier}: C '${onC?.[1]}' (hover '${onC?.[2]?.split('.')[0]}')`);
        assert(row && row.word === want[tier] && onC && onC[1].startsWith(want[tier]) && !new RegExp(`\\b${Math.round(row.H)}\\b`).test(onC[1].replace(/inoculation \d+ of \d+/, '')) && onC[2].startsWith(`Hardening ${Math.round(row.H)}:`), JSON.stringify({ tier, row, onC }));
      }
      const hard = (t) => SUPP.hardWord(SUPP.hardFrom({ wf: TEST_SHEETS[t].wf, cls: 'soldier', inoc: TEST_SHEETS[t].inoc }));
      const pick = pickerRows(TEST_SHEETS, SCENE.sheets, SCENE.sheet, { hard });
      rows.push(`the picker: ${pick.map(r => `${r.label} · ${r.hard}${r.focus ? ' (focused)' : ''}`).join(' | ')}; the setup's line '${SETUP_LINES.bangs}'`);
      assert(pick.map(r => r.tier).join() === 'recruit,private,sgt,raider,tierone' && pick[0].focus && pick.every(r => r.line.endsWith(` · Hardening: ${want[r.tier]}`)), JSON.stringify(pick));
      for (const l of rows) console.log(`      ${l}`);
    },
  },
  {
    name: 'the banged paper: "BANGS 3 · FROZE 2.45" over the take-in and "OFF SAFE ✗ ✗ ✓" after PAUSE TO FIRST, a failed try red; its words the scene\'s exactly; a calm paper as before, row for row',
    fn() {
      const banged = timerModel({ k: 0, line: 7, takeInMs: 1250, pauseToFirstMs: 4100, splitsMs: [520], zones: { A: 1, C: 1 }, bangs: 3, frozeMs: 2450, offSafe: [false, false, true] }, { text: 'BANGS 3 · FROZE 2.45 S · TURN TO PAUSE 1.25 · PAUSE TO FIRST 4.10 · OFF SAFE ✗ ✗ ✓ · SPLITS 0.52 · 1 A, 1 C', fmt: takeInWords });
      const calm = timerModel({ k: 0, line: 7, takeInMs: 550, pauseToFirstMs: 1450, splitsMs: [400], zones: { A: 2 } }, { fmt: takeInWords });
      console.log(`      banged: ${banged.rows.map(r => `${r.label} ${r.value}`).join(' | ')}; words '${banged.text}'\n      calm: ${calm.rows.map(r => `${r.label} ${r.value}`).join(' | ')}`);
      assert(banged.rows.map(r => r.label).join() === 'BANGS 3,TURN TO PAUSE,PAUSE TO FIRST,OFF SAFE,SPLITS' && banged.rows[0].value === 'FROZE 2.45' && banged.rows[3].value === '✗ ✗ ✓', JSON.stringify(banged.rows));
      assert(calm.rows.map(r => r.label).join() === 'TURN TO PAUSE,PAUSE TO FIRST,SPLITS' && calm.text === 'TURN TO PAUSE 0.55 · PAUSE TO FIRST 1.45 · SPLITS 0.40 · 2 A', JSON.stringify(calm));
    },
  },
  {
    name: 'the end card and the score: the bangs\' summary over the course\'s own, the calm line by the book and this session\'s calm run; one aspect, "Score it" says one; Copy my scores "OLYMPUS v0.0.9 · test-pairs-bangs · seed 48213 · bangs 80 · ★ no · note: none"; J\'s startle line its head over the sum; the URL\'s setups and the bench',
    fn() {
      const bn = { summary: 'Boot recruit · three bangs · the chaos 105 − hardening 7 (green) = felt 98, pinned · froze 2.45 s · Off safe 3 tries, 2 failed · first round 7.10 s after you saw him (calm 2.50 s)', calm: { turnToFirstMs: 2600, sightMs: 100 } };
      const lines = bangLines(bn, { calmRunMs: 2610, fmt: takeInWords }), alone = bangLines(bn, { fmt: takeInWords });
      const line = scoreLine({ version: '0.0.9', scene: SCENE.id, seed: 48213, aspects: [['bangs', 80]], star: false, note: '' });
      const j = startleLine({ kind: 'startle', text: 'Startled 2.45 s: the bang, the chaos 105 − your hardening 7 = felt 98.' });
      const ll = logLines({ log: [{ seq: 1, kind: 'startle', atMs: 0, text: 'Startled 2.45 s: the bang, the chaos 105 − your hardening 7 = felt 98.', tone: 'warn' }] });
      console.log(`      the card: ${lines.map(l => `'${l}'`).join(' | ')}\n      the score line: '${line}' (the scene's aspects: ${SCENE.aspects.map(a => a[0]).join(', ')}${SCENES['test-pairs-bangs'] ? '' : '; scenes.js has no test-pairs-bangs yet: the build sheet\'s record'})\n      J: '${ll[0].text}' over '${ll[0].sub}'`);
      // (the book's calm figure is in the summary: the calm line only for a session's own calm run (the design review of v0.0.9))
      assert(lines[0] === bn.summary && lines[1] === 'Your calm run on this seed: first round 2.61 s after you saw him' && alone.length === 1, JSON.stringify({ lines, alone }));
      assert(line === 'OLYMPUS v0.0.9 · test-pairs-bangs · seed 48213 · bangs 80 · ★ no · note: none' && SCENE.aspects.length === 1, line);
      assert(j.words === 'Startled 2.45 s: the bang.' && j.short === 'the chaos 105 − your hardening 7 = felt 98' && ll[0].sub === j.short, JSON.stringify(j));
      const p = readParams('?play=test-pairs&setup=bangs&tier=recruit&flashes=reduced'), q = readParams('?play=test-pairs&setup=bangs:standby');
      console.log(`      the URL: setup '${p.setup}', tier '${p.tier}', flashes '${p.flashes}'; '${q.setup}'; the bench pairs-bangs: ${JSON.stringify(BENCH_SCENES['pairs-bangs'])}`);
      assert(p.setup === 'bangs' && p.tier === 'recruit' && p.flashes === 'reduced' && q.setup === 'bangs:standby' && SETUPS.includes('bangs:standby') && BENCH_SCENES['pairs-bangs']?.setup === 'bangs:standby', JSON.stringify(p));
      const b = bangOf([{ dt: 16.7, bang: false }, { dt: 16.6, bang: true }, { dt: 30, bang: true }]);
      assert(b.frames === 2 && b.over25 === 1 && b.maxMs === 30, JSON.stringify(b));
    },
  },
  {
    name: 'in the page at 1600 × 900 and 1024 × 768 (heavy): the picker\'s rows inside the window, each with "Hardening: <its word>" (leading, the fixer\'s); C\'s Hardening row in words with its number on the hover, the card inside the window; the banged paper in PAPER meeting no HUD rectangle; felt never a number anywhere on the HUD through the bangs, the pause and the paper',
    heavy: true,
    timeoutMs: 300000,
    async fn() {
      await withGame(async (page, errors, game) => {
        const rows = [];
        for (const [w, h] of [[1600, 900], [1024, 768]]) {
          await page.setViewportSize({ width: w, height: h });
          // (the picker)
          await game.open('nostore=1');
          await page.waitForSelector('#title .item.tests');
          await page.click('#title .item.tests');
          await page.evaluate(() => [...document.querySelectorAll('#title .item.scene')].find(b => b.innerText.startsWith('Three bangs')).click());
          await page.waitForSelector('#title .sheet.picker');
          const pk = await page.evaluate(() => [...document.querySelectorAll('#title .item.sheetpick')].map(b => { const r = b.getBoundingClientRect(); return { tier: b.dataset.tier, last: /Hardening: (\w+)/.exec(b.innerText)?.[1] ?? null, in: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight }; }));
          rows.push(`${w} × ${h} the picker: ${pk.map(r => `${r.tier} ${r.last}${r.in ? '' : ' (out)'}`).join(', ')}`);
          assert(pk.length === 5 && pk.every(r => r.in && /^(green|settled|steady|hardened|unshakeable)$/.test(r.last)), JSON.stringify(pk));
          // (the banged standby: every frame the HUD's words read for a felt figure, to the paper)
          await game.open('play=test-pairs&setup=bangs:standby&tier=recruit&seed=48213&nostore=1');
          await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.bangs, null, { timeout: 30000 });
          await page.evaluate(() => {
            window.__felt = [];
            const f = () => { if (!window.__felt) return; const vis = (sel) => [...document.querySelectorAll(sel)].filter(e => !e.hidden && !e.closest('[hidden]')).map(e => e.innerText ?? e.dataset.text ?? ''); const t = [...vis('.toasts .toast'), ...vis('.instinct'), ...vis('.radio'), ...vis('.steps .step'), ...[...document.querySelectorAll('canvas.plaque')].filter(e => !e.hidden).map(e => e.dataset.text ?? ''), ...vis('.timer')].join(' | '); if (/felt\s*\d/i.test(t)) window.__felt.push(t.slice(0, 200)); requestAnimationFrame(f); };
            requestAnimationFrame(f);
          });
          const bot = (until, maxTicks = 60000) => page.evaluate(async ([until, maxTicks]) => {
            const { pairsBot } = await import('/tests/bots/pairs.mjs');
            const O = window.__olympus; window.__pairsBot = window.__pairsBot ?? pairsBot();
            const run = window.__pairsBot, done = new Function('O', `return (${until});`);
            let n = 0;
            O.pause(true);
            for (; n < maxTicks && !done(O); n++) { const s = O.state, me = s.actors.list.find(a => a.id === s.player.actor); O.step(1, run(s, me, (me.bot ??= {}))); }
            O.pause(false);
            return n;
          }, [until, maxTicks]);
          await page.waitForFunction(() => window.__olympus.state.stop?.mode === 'stop' && window.__olympus.contact()?.last, null, { timeout: 30000 });
          await page.waitForTimeout(600);
          // (C: the Hardening row)
          await page.keyboard.press('KeyC');
          await page.waitForSelector('.glass.sheetcard');
          const c = await page.evaluate(() => { const ks = [...document.querySelectorAll('.glass.sheetcard .keylist.file .k')], k = ks.find(e => e.textContent === 'Hardening'), v = k?.nextElementSibling, r = document.querySelector('.glass.sheetcard').getBoundingClientRect(); return { v: v?.textContent ?? null, title: v?.title ?? null, in: r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1 }; });
          rows.push(`${w} × ${h} C: Hardening '${c.v}' (hover '${c.title?.split('.')[0]}'), the card ${c.in ? 'inside' : 'outside'} the window`);
          assert(c.v && c.v.startsWith('green') && /^Hardening 7:/.test(c.title ?? '') && c.in && !/\b7\b/.test(c.v.replace(/inoculation \d+ of \d+/, '')), JSON.stringify(c));
          await page.keyboard.press('KeyC');
          await page.waitForFunction(() => !document.querySelector('.glass.sheetcard'), null, { timeout: 5000 });
          // (the banged paper: in PAPER, meeting no HUD rectangle)
          await bot('!!O.pairs()?.strs?.[0]?.done');
          await page.waitForFunction(() => !document.querySelector('.timer')?.hidden, null, { timeout: 5000 });
          await page.waitForTimeout(400);
          const got = await page.evaluate(() => {
            const r = (sel) => { const e = document.querySelector(sel); if (!e || e.hidden || e.closest('[hidden]') || getComputedStyle(e).display === 'none') return null; const b = e.getBoundingClientRect(); return b.width && b.height ? { x: b.left, y: b.top, w: b.width, h: b.height } : null; };
            return { TOASTS: r('.toasts'), WATCH: r('.watch'), TIMER: r('.timer'), INSTINCT: r('.instinct'), STEPS: r('.steps'), RADIO: r('.radio.voices'), KEYS: r('.keyshint'), BANNER: r('.banner') };
          });
          const names = Object.keys(got).filter(k => got[k]), clash = [];
          for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) if (overlaps(got[names[i]], got[names[j]])) clash.push(`${names[i]} × ${names[j]}`);
          const paper = await page.evaluate(() => document.querySelector('.timer')?.dataset.text);
          const felt = await page.evaluate(() => { const f = window.__felt; window.__felt = null; return f; });
          rows.push(`${w} × ${h} the paper '${paper}': meeting ${clash.join(', ') || 'none'}; felt as a number on the HUD: ${felt.length ? felt.slice(0, 2).join(' / ') : 'never'}`);
          assert(got.TIMER && !clash.length && /^BANGS 3/.test(paper ?? ''), JSON.stringify({ got, clash, paper }));
          assert(!felt.length, felt.join(' / '));
          await page.evaluate(() => { window.__pairsBot = null; });
        }
        for (const l of rows) console.log(`      ${l}`);
        assert(!errors.length, errors.join('\n'));
      }, { query: 'nostore=1', viewport: { width: 1600, height: 900 } });
    },
  },
  {
    name: 'the fixer\'s of v0.0.9: the Esc menu turns "Reduce flashes" and offers "End the scene: to its card" in a test scene still running (the design review: every "Again as …" cost the whole course), never in a career or once ended; the picker labels "Hardening: green" and leads with it on "Three bangs", the number and its parts on its hover',
    fn() {
      const words = (o) => menuActs(o, {}).map(a => a[0]);
      const inScene = words({ scene: { id: 'test-pairs-bangs', ended: false }, flashes: false }), career = words({ scene: null, flashes: true }), ended = words({ scene: { id: 'test-pairs-bangs', ended: true } });
      console.log(`      in a scene: ${inScene.join(' | ')}\n      a career: ${career.join(' | ')}`);
      assert(inScene.includes('End the scene: to its card') && inScene.at(-1) === 'Quit to the title' && !career.some(w => /End the scene/.test(w)) && !ended.some(w => /End the scene/.test(w)), JSON.stringify({ inScene, career, ended }));
      // ("reduce flashes" turned from the menu (the integrator's: only by the URL or the storage key))
      assert(inScene.includes('Reduce flashes: off') && career.includes('Reduce flashes: on') && !ended.some(w => /Reduce flashes/.test(w)), JSON.stringify({ inScene, career }));
      const hard = (t) => ({ word: SUPP.hardWord(SUPP.hardFrom({ wf: TEST_SHEETS[t].wf, cls: 'soldier', inoc: TEST_SHEETS[t].inoc })), title: `Hardening ${SUPP.hardFrom({ wf: TEST_SHEETS[t].wf, cls: 'soldier', inoc: TEST_SHEETS[t].inoc })}` });
      const lead = pickerRows(TEST_SHEETS, SCENE.sheets, SCENE.sheet, { hard, lead: true }), tail = pickerRows(TEST_SHEETS, SCENE.sheets, SCENE.sheet, { hard });
      console.log(`      the picker on "Three bangs": ${lead.map(r => `${r.label}: ${r.line.split(' · ')[0]} (${r.hardTitle})`).join(' | ')}`);
      assert(lead.every(r => r.line.startsWith(`Hardening: ${r.hard}`) && r.hardTitle) && tail.every(r => r.line.endsWith(` · Hardening: ${r.hard}`)), JSON.stringify({ lead: lead.map(r => r.line), tail: tail.map(r => r.line) }));
    },
  },
  {
    name: 'the fixer\'s of v0.0.9 (the reviews: the smoke hid the shooter and the coach, and lay across the line of fire): over a standing figure\'s box the smoke is a checker\'s half, never whole; carried 2.5 m off the pad by the wind it is gone; the thrown body has an ink outline in flight (5 × 4 px)',
    fn() {
      const b = { id: 'pairs:0:1', x: 10, z: 10, atMs: 1000, throwAtMs: 400, fromX: 11, fromZ: 9 };
      const fig = { x: 10, z: 10.6 };
      const inBox = (q) => Math.abs(q.x - fig.x) < SMOKE_FIG_HALF_W_M && q.z - q.y > fig.z - 1.85 && q.z - q.y < fig.z + 0.15;
      const bare = bangSmokePixels(b, 1800, PPM, null).filter(inBox).length, thin = bangSmokePixels(b, 1800, PPM, null, { figures: [fig] }).filter(inBox).length;
      const wind = { towardRad: 0, speedMs: 3 }, v = Math.min(1.2, 0.35 * 3), tGone = SMOKE_OFF_PAD_M[1] / v;
      const before = bangSmokePixels(b, 1000 + Math.round((SMOKE_OFF_PAD_M[0] / v) * 1000) - 100, PPM, wind).length, gone = bangSmokePixels(b, 1000 + Math.ceil(tGone * 1000) + 50, PPM, wind).length;
      const fly = bangBodyPixels(b, 700, PPM), lying = bangBodyPixels(b, 1200, PPM);
      console.log(`      over the figure's box at +0.8 s: ${bare} smoke pixels bare, ${thin} with the figure (${fmt(thin / Math.max(1, bare) * 100, 0)}%); in a 3 m/s wind: ${before} pixels at ${SMOKE_OFF_PAD_M[0]} m of drift, ${gone} at ${SMOKE_OFF_PAD_M[1]} m; the body ${fly.length} pixels in flight (${fly.filter(q => q.c === 0x24201f).length} ink), ${lying.length} on the pad`);
      // (a checker's half, the box's edge pixels either way)
      assert(bare > 50 && thin > 0 && thin <= bare * 0.6, JSON.stringify({ bare, thin }));
      assert(before > 0 && gone === 0, JSON.stringify({ before, gone }));
      assert(fly.length === 20 && fly.filter(q => q.c === 0x24201f).length === 14 && lying.length === 6, JSON.stringify({ fly: fly.length, lying: lying.length }));
    },
  },
  {
    name: 'the radio box on the pairs bay keeps the coach\'s standing command once, as his own speech beside you (the integrator\'s, from v0.0.8: "One target. Standby." stood twice, as "◉ TOWER … NOW" and as his "BESIDE YOU" line)',
    fn() {
      const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'private', setup: 'standby' }), bot = pairsBot(), lines = [];
      for (let n = 0; n < 200; n++) { g.step(1, bot); for (const f of g.facts('say')) { const l = lineOf(f, g.state); if (l) lines.push(l); } g.clearFacts(); }
      const st = standingLine(g.state), box = boxLines(lines, st);
      console.log(`      ${box.map(l => `${l.head}: ${l.text}${l.standing ? ' [NOW]' : ''}`).join('\n      ')}`);
      assert(st && /BESIDE YOU/.test(st.head) && !/TOWER/.test(st.head) && box.filter(l => l.text === st.text).length === 1, JSON.stringify({ st, box: box.map(l => [l.head, l.text]) }));
    },
  },
];
