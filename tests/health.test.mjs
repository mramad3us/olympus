// health: the wound model against tradecraft's (src/sim/body/wounds.js; BODY §17; the build sheet 0.0.7 §5.2).
// Twelve hits, each part at force 0.3 and 0.7 with w 1.5 on the same dice, through tradecraft's health.js
// and its bullet()'s wound sequence (run read-only from a scratch script, 2026-11-07, its numbers pasted
// below as data) and through OLYMPUS's port: the injuries, the bleed rate, the pain's points and band,
// the knock's seconds, the seconds to the collapse (55%) and to death (45%), side by side. Equal within
// rounding, but where BODY §17.1's changes say otherwise: a non-artery limb wound bleeds at most 8 %/min
// (change 1), so its times are 8 %/min's. Then applyHit itself is that sequence on its own stream; the
// torso's turn to an arm by the margin (WEAPONS §7.7); and the readers: words, never numbers, AVPU, the
// knock and the mods on BODY §22's uses, an unwounded body unchanged.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { stream, chance, range } from '../src/core/rng.js';
import { MIN_MS, SEC_MS } from '../src/core/clock.js';
import * as W from '../src/sim/body/wounds.js';
import { bodyMods } from '../src/sim/body/mods.js';
import { stripOf, woundLine } from '../src/sim/body/cues.js';
import { lonOf } from '../src/sim/places/model.js';

// (tradecraft's numbers, its scratch run: part, force, injuries, rate %/min, pain points, band, knock s, collapse s, death s, killed outright)
const TRADECRAFT = [
  ['head', 0.3, 'cut:deep', 4.59, 13, 'none', 0, null, null, true],
  ['head', 0.7, 'crack+cut:deep', 8.91, 36, 'in pain', 0, null, null, true],
  ['torso', 0.3, 'cut:deep', 3.31, 23, 'none', 13.4, 816, 997, false],
  ['torso', 0.7, 'crack+cut:deep', 6.19, 46, 'bad pain', 44.9, 437, 534, false],
  ['armL', 0.3, 'cut:deep', 4.59, 13, 'none', 4.3, 589, 719, false],
  ['armL', 0.7, 'crack+cut:deep', 8.91, 36, 'in pain', 2.1, 304, 371, false],
  ['armR', 0.3, 'cut:deep', 4.59, 13, 'none', 3.8, 589, 719, false],
  ['armR', 0.7, 'cut:deep', 8.91, 28, 'in pain', 5.2, 304, 371, false],
  ['legL', 0.3, 'cut:deep', 4.59, 13, 'none', 9.9, 589, 719, false],
  ['legL', 0.7, 'cut:deep', 8.91, 28, 'in pain', 9.1, 304, 371, false],
  ['legR', 0.3, 'cut:deep', 4.59, 13, 'none', 11.3, 589, 719, false],
  ['legR', 0.7, 'crack+cut:artery', 14.12, 38, 'in pain', 6, 192, 234, false],
];
const MS = 1_000_000, Wk = 1.5;
const sec = (t) => (t === null ? null : Math.ceil((t - MS) / SEC_MS - 1e-9));

// (OLYMPUS's port on the scratch run's dice: the same sequence, part by part)
function port(part, force) {
  const rec = { fitness: 0 }, r = stream('parity', part, force);
  W.hurt(rec, part, force * W.takes(rec, part));
  const made = W.injure(rec, part, force, r, MS, { edge: true, deep: true, bleedK: (part === 'torso' ? W.TORSO_BLEED_K : W.LIMB_BLEED_K) * Math.min(W.W_BLEED_MAX, Wk) });
  rec.blood = 100; rec.bloodMs = MS;
  let dead = false;
  if (part === 'head' && chance(r, Math.min(W.HEAD_KILL_MAX, W.HEAD_KILL * Math.max(1, Wk)))) { dead = true; rec.dead = { ms: MS, why: 'shot' }; }
  else if (part === 'head') {
    const i = made.find(j => j.kind === 'cut');
    if (chance(r, W.HEAD_GRAZE)) Object.assign(i, { rate: Math.min(i.rate, W.GRAZE_RATE), bleed: Math.min(i.bleed, MS + W.GRAZE_BLEED_MIN * MIN_MS), artery: false });
    else { W.hurt(rec, 'head', W.takes(rec, 'head')); rec.injuries.push({ part: 'head', kind: 'cut', ms: MS, bleed: MS + 12 * 3600000, rate: W.BRAIN_BLEED, deep: true, internal: true }); }
  }
  if (part === 'torso') rec.injuries.push({ part: 'torso', kind: 'cut', ms: MS, bleed: MS + W.CHEST_BLEED_H * 3600000, rate: W.CHEST_BLEED, deep: true, internal: true });
  const knock = dead ? 0 : W.knockS(rec, part, r, true, MS);
  const c = W.bloodCurve(rec, MS + 6 * 3600000), pain = W.painOf(rec, MS, { adrenaline: false });
  return { injuries: made.map(i => i.kind + (i.artery ? ':artery' : i.deep ? ':deep' : '')).join('+'), rate: W.bleedSumOf(rec, MS), pain, band: W.painBand(pain)?.word ?? 'none', knockS: knock, collapseS: sec(c.collapseMs), deathS: sec(c.deadMs), dead };
}

export default [
  {
    name: 'twelve hits (each part at force 0.3 and 0.7, w 1.5, the same dice) give tradecraft\'s injuries, bleed, pain, knock and times to collapse and death, but a non-artery limb wound capped at 8 %/min (BODY change 1)',
    fn() {
      console.log('      part   force | injuries (T / O)                  | rate %/min T / O | pain T / O  band | knock s T / O | collapse s T / O | death s T / O');
      const bad = [];
      for (const [part, force, inj, rate, pain, band, knock, coll, death, dead] of TRADECRAFT) {
        const o = port(part, force);
        const capped = !inj.includes('artery') && W.PART_KEYS.includes(part) && part !== 'torso' && part !== 'head' && rate > W.LIMB_CAP_PM;
        const wantRate = capped ? W.LIMB_CAP_PM : rate;
        const wantColl = dead ? null : capped ? Math.ceil(45 / W.LIMB_CAP_PM * 60 - 1e-9) : coll, wantDeath = dead ? null : capped ? Math.ceil(55 / W.LIMB_CAP_PM * 60 - 1e-9) : death;
        console.log(`      ${part.padEnd(6)} ${force}   | ${inj.padEnd(16)} / ${o.injuries.padEnd(16)} | ${fmt(rate, 2).padStart(5)} / ${fmt(o.rate, 2).padStart(5)}${capped ? ' (cap)' : '      '} | ${String(pain).padStart(2)} / ${fmt(o.pain, 0).padStart(2)} ${o.band.padEnd(8)} | ${fmt(knock, 1).padStart(4)} / ${fmt(o.knockS, 1).padStart(4)}   | ${String(coll ?? '-').padStart(4)} / ${String(o.collapseS ?? '-').padStart(4)}      | ${String(death ?? '-').padStart(4)} / ${String(o.deathS ?? '-').padStart(4)}${dead ? '  (killed outright)' : ''}`);
        const ok = o.injuries === inj && Math.abs(o.rate - wantRate) < 0.011 && Math.abs(o.pain - pain) < 0.01 && o.band === band && Math.abs(o.knockS - knock) < 0.051 && o.collapseS === wantColl && o.deathS === wantDeath && o.dead === dead;
        if (!ok) bad.push({ part, force, o, want: { inj, rate: wantRate, pain, band, knock, wantColl, wantDeath, dead } });
      }
      assert(!bad.length, JSON.stringify(bad));
    },
  },
  {
    name: 'applyHit is bullet()\'s sequence on its own stream (stream(\'wound\', seed, onId, shotId)): the same hit gives the same wound whatever was rolled before; it emits \'wound\', spills no state but the body\'s and the place\'s blood, and a torso hit turns to an arm 15% of the time at margin 0 and never at 10 (WEAPONS §7.7)',
    fn() {
      const g = createGame({ scenario: 'test-handling', seed: 48213, hour: 9 }), s = g.state, pid = Object.keys(s.people).find(id => id !== s.player.id);
      const snap = JSON.stringify(s.people[pid].body);
      const a = W.applyHit(s, g.bus, { onId: pid, part: 'legs', w: 1.61, margin: 3, shotId: 'sh1', through: true });
      const recA = JSON.stringify(s.people[pid].body);
      s.people[pid].body = JSON.parse(snap);
      for (let i = 0; i < 50; i++) s.rng = { main: [i, i + 1, i + 2, i + 3] };   // (the game's dice moved: a hit's wound must not care)
      const b = W.applyHit(s, g.bus, { onId: pid, part: 'legs', w: 1.61, margin: 3, shotId: 'sh1', through: true });
      const recB = JSON.stringify(s.people[pid].body);
      const fact = g.facts('wound').at(-1);
      console.log(`      ${a.words} ${JSON.stringify(a.injuries.map(i => [i.name, i.rate]))}, knock ${a.knockS} s; again after the dice moved: ${recA === recB ? 'the same record' : 'DIFFERENT'}; the fact ${JSON.stringify(fact)}`);
      assert(recA === recB && fact?.who === pid && fact.kind === 'gunshot' && fact.through, JSON.stringify({ recA, recB, fact }));
      // (the torso's turn to an arm, by the margin)
      const N = 4000, share = (margin) => { let arm = 0; for (let k = 0; k < N; k++) { const r = stream('wound', s.meta.seed, 'px', `t${margin}:${k}`); if (chance(r, W.ARM_SHARE * (1 - Math.min(1, margin / 10)))) arm++; } return arm / N; };
      const m0 = share(0), m5 = share(5), m10 = share(10);
      console.log(`      a torso hit turned to an arm over ${N}: margin 0 ${fmt(m0 * 100, 1)}%, 5 ${fmt(m5 * 100, 1)}%, 10 ${fmt(m10 * 100, 1)}%`);
      assert(Math.abs(m0 - 0.15) < 0.02 && Math.abs(m5 - 0.075) < 0.015 && m10 === 0, JSON.stringify({ m0, m5, m10 }));
    },
  },
  {
    name: 'a thigh wound in words, never a number, as it bleeds: "A gunshot wound in the left thigh, bleeding hard."; AVPU A to P to U; the knock and down; BODY §22\'s mods on the uses; the corpsman\'s tourniquet stops it; an unwounded body\'s mods and strip unchanged',
    fn() {
      const g = createGame({ scenario: 'test-handling', seed: 48213, hour: 9 }), s = g.state, pid = s.player.id, ms = s.clock.ms;
      const clean = { mods: JSON.stringify(bodyMods(s, pid, ['hands', 'eyes'])), strip: JSON.stringify(stripOf(s.people[pid].body, ms, lonOf(s))) };
      const rec = s.people[pid].body;
      rec.fitness = 10; rec.blood = 100; rec.bloodMs = ms;
      rec.parts = { legL: 9.8 };
      rec.injuries = [{ part: 'legL', kind: 'cut', name: 'a gunshot wound in the left thigh', where: 'left thigh', ms, until: ms + 864000000, bleed: ms + 6 * 3600000, rate: 7.2, deep: true, gunshot: true }];
      rec.knock = { untilMs: ms + 12000 };
      const at = (min) => ms + min * MIN_MS;
      const rows = [0, 0.5, 2, 4, 5.5, 6, 6.5].map(min => ({ min, words: W.woundWords(rec, at(min)).join(' '), avpu: W.avpuOf(rec, at(min)), down: W.downOf(rec, at(min)).why, blood: W.bloodAt(rec, at(min)), line: woundLine(rec, at(min))?.text ?? '' }));
      for (const r of rows) console.log(`      +${fmt(r.min, 1)} min: ${r.avpu}, down ${r.down ?? 'no'}, "${r.words}" (blood ${fmt(r.blood, 1)}%, not shown); the body line "${r.line}"`);
      assert(rows[0].words.startsWith('A gunshot wound in the left thigh, bleeding hard.'), rows[0].words);
      assert(rows.every(r => !/\d/.test(r.words) && !/\d/.test(r.line)), 'a number in the words');
      assert(rows[0].avpu === 'A' && rows[0].down === 'knock' && rows.find(r => r.min === 6).avpu === 'P' && rows.find(r => r.min === 6.5).avpu === 'U', JSON.stringify(rows.map(r => r.avpu)));
      const mk = bodyMods(s, pid, ['legs']).filter(m => m.src.startsWith('body:w') || m.src === 'body:pain' || m.src === 'body:blood');
      console.log(`      on the legs at once: ${mk.map(m => `${m.why} ${m.v}`).join(', ')}`);
      assert(mk.some(m => m.why === 'a wounded left leg' && m.v === -2), JSON.stringify(mk));
      // (a broken right arm: −6 on Weapon handling (hands), −4 on Marksmanship (eyes, arms, breath))
      rec.parts.armR = 30;
      const wh = bodyMods(s, pid, ['hands', 'eyes']).find(m => m.why.includes('right arm')), mk2 = bodyMods(s, pid, ['eyes', 'arms', 'breath']).find(m => m.why.includes('right arm'));
      console.log(`      a broken right arm: Weapon handling ${wh?.v}, Marksmanship ${mk2?.v}`);
      assert(wh?.v === -6 && mk2?.v === -4, JSON.stringify({ wh, mk2 }));
      delete rec.parts.armR;
      W.careOf(rec, at(1));
      const out = W.casualtyOutcome(rec, { fromMs: at(1) });
      console.log(`      the corpsman at +1 min: "${W.woundWords(rec, at(2)).join(' ')}"; the outcome ${out.outcome} at +${fmt((out.atMs - ms) / MIN_MS, 1)} min, blood ${fmt(out.bloodPct, 1)}%`);
      assert(!W.bleeding(rec, at(2)) && out.outcome === 'evacuated', JSON.stringify(out));
      const g2 = createGame({ scenario: 'test-handling', seed: 48213, hour: 9 });
      const again = { mods: JSON.stringify(bodyMods(g2.state, pid, ['hands', 'eyes'])), strip: JSON.stringify(stripOf(g2.state.people[pid].body, ms, lonOf(g2.state))) };
      assert(JSON.stringify(again) === JSON.stringify(clean), JSON.stringify({ clean, again }));
    },
  },
];
