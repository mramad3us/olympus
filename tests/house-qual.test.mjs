// OLYMPUS tests: qualified, three GOs in a row on houses never seen (the build sheet v0.0.21 §1 items 9 and 16; done lens D5).
//
// cards/house-runs.js is pure over a storage (a Map-backed one here): a qualification lane is on a seed this sheet never played in
// this browser (qualSeed, keyed by sheet and seed), on the drawn house, the standard kit, the sheet's own par or harder (qualWhyNot);
// QUAL_GOS 3 GOs in a row qualify (qualStep), written beside the runs as quals[sheet] (keepQual), and the picker then offers the next
// sheet up (qualNext). A NO-GO, a lane outside the rules or an abandoned one (never reaching qualStep: a fresh attempt starts at 0)
// ends the attempt. The run kept carries the drawn house's code and its place in the attempt; the score line names the code after
// the seed on a drawn lane only (score.js scoreLine). Before v0.0.21 there was no qualification for the house (grep: none).
import { assert } from './helpers.mjs';
import { HOUSE_RUNS_KEY, HOUSE_RUNS_MAX, readRuns, keepRun, qualStart, qualStep, qualSeed, qualWhyNot, keepQual, qualsOf, qualNext, playedSeeds, qualKeep, QUAL_GOS } from '../src/ui/cards/house-runs.js';
import { scoreLine } from '../src/ui/cards/score.js';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { root } from './helpers.mjs';

const store = () => { const m = new Map(); return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) }; };
const SHEETS = ['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone'];
// (a lane of the sergeant's: the drawn house, the standard kit, his own par (advanced) unless said)
const lane = (seed, go = true, o = {}) => ({ sheet: 'sgt', seed, code: `K${seed}`, go, draw: 'drawn', loadout: 'standard', par: 'advanced', own: 'advanced', ...o });
// (an attempt played through: each lane kept as the page keeps it, its step against the runs before it)
function play(s, lanes, attempt = qualStart('sgt')) {
  const said = [];
  let q = null;
  for (const L of lanes) {
    if (!attempt) break;
    q = qualStep(attempt, L, readRuns(s).runs, { label: 'Sergeant' });
    keepRun(s, { scene: 'test-shoothouse', sheet: L.sheet, seed: L.seed, laneMs: 50000, go: L.go, code: L.code, qual: q.qual }, { atIso: 'x' });
    if (q.qualified) keepQual(s, L.sheet, { seeds: q.seeds, codes: q.codes, version: 'test' }, { atIso: 'q' });
    said.push(q.words);
    attempt = q.attempt;
  }
  return { said, q, attempt };
}

export default [
  {
    name: 'three GOs in a row on three fresh drawn seeds qualify: "QUALIFICATION 1 OF 3 · GO", "2 OF 3 · GO", "QUALIFIED: SERGEANT", written beside the runs (seeds, codes), the sergeant marked and the Raider offered next (fails without qualStep: there was no qualification)',
    fn() {
      const s = store(), r = play(s, [lane(11), lane(12), lane(13)]), quals = qualsOf(s), runs = readRuns(s).runs;
      console.log(`      ${r.said.join(' | ')}; quals ${JSON.stringify(quals)}; the runs kept ${runs.map(x => `${x.seed} ${x.code} ${JSON.stringify(x.qual)}`).join(', ')}; next offered ${qualNext(SHEETS, quals)}`);
      assert(r.said.join('|') === 'QUALIFICATION 1 OF 3 · GO|QUALIFICATION 2 OF 3 · GO|QUALIFIED: SERGEANT' && r.attempt === null && r.q.qualified === 'sgt', JSON.stringify(r.said));
      assert(quals.sgt?.seeds.join() === '11,12,13' && quals.sgt.codes.join() === 'K11,K12,K13' && runs.every(x => x.code && x.qual?.of === QUAL_GOS) && qualNext(SHEETS, quals) === 'raider' && qualNext(SHEETS, {}) === 'private', JSON.stringify({ quals }));
    },
  },
  {
    name: 'a NO-GO, a seed played before on that sheet, an easier par, a kit loadout, a house as set or another sheet ends the attempt; a harder par counts; an abandoned lane leaves nothing (a fresh attempt starts at 0)',
    fn() {
      const cases = [
        ['a NO-GO', [lane(21), lane(22, false)]],
        ['a seed played before', [lane(31), lane(31)]],
        ['an easier par', [lane(41), lane(42, true, { par: 'basic' })]],
        ['a kit loadout', [lane(51), lane(52, true, { loadout: 'flash' })]],
        ['a house as set', [lane(61), lane(62, true, { draw: 'set' })]],
        ['another sheet', [lane(71), lane(72, true, { sheet: 'raider' })]],
      ];
      const out = cases.map(([why, ls]) => { const s = store(), r = play(s, ls); return { why, said: r.said.at(-1), attempt: r.attempt, quals: qualsOf(s) }; });
      // (a seed played in an earlier session on that sheet: the runs kept)
      const s2 = store(); keepRun(s2, { scene: 'test-shoothouse', sheet: 'sgt', seed: 81, laneMs: 1, go: true }, { atIso: 'y' });
      const old = qualWhyNot(lane(81), qualStart('sgt'), readRuns(s2).runs), other = qualWhyNot(lane(81), qualStart('sgt'), [{ scene: 'test-shoothouse', sheet: 'private', seed: 81 }]);
      const harder = play(store(), [lane(91), lane(92, true, { par: 'operator' }), lane(93)]);
      // (abandoned: two GOs, then a fresh attempt from the picker starts at 0)
      const s3 = store(), a = play(s3, [lane(101), lane(102)]), fresh = play(s3, [lane(103)]);
      for (const o of out) console.log(`      ${o.why}: "${o.said}", the attempt ${o.attempt ? 'goes on' : 'ended'}, quals ${JSON.stringify(o.quals)}`);
      console.log(`      a seed this sheet played in an earlier session: ${old}; the same seed played by another sheet: ${other ?? 'fine'}; a harder par: ${harder.said.at(-1)}; abandoned after ${a.said.at(-1)}, a fresh attempt: ${fresh.said.at(-1)}`);
      assert(out.every(o => o.attempt === null && !o.quals.sgt) && out[0].said === 'QUALIFICATION 2 OF 3 · NO-GO · ENDED' && out[1].said === 'QUALIFICATION ENDED: A SEED PLAYED BEFORE' && out[2].said === 'QUALIFICATION ENDED: AN EASIER PAR' && out[3].said === 'QUALIFICATION ENDED: A KIT LOADOUT' && out[4].said === 'QUALIFICATION ENDED: A HOUSE AS SET', JSON.stringify(out));
      assert(old === 'a seed played before' && other === null && harder.q.qualified === 'sgt' && fresh.said.at(-1) === 'QUALIFICATION 1 OF 3 · GO' && !qualsOf(s3).sgt, JSON.stringify({ old, other }));
    },
  },
  {
    name: 'the seed is drawn fresh for the sheet (never one it played, nor one of this attempt), 200 runs at most kept with the qualifications beside them, a bad record started afresh and a bad quals dropped with the runs kept',
    fn() {
      const s = store();
      for (let i = 0; i < HOUSE_RUNS_MAX + 5; i++) keepRun(s, { scene: 'test-shoothouse', sheet: 'sgt', seed: i % 7, laneMs: 1, go: true }, { atIso: 'z' });
      keepQual(s, 'private', { seeds: [1, 2, 3], codes: ['a', 'b', 'c'] }, { atIso: 'q' });
      keepRun(s, { scene: 'test-shoothouse', sheet: 'sgt', seed: 99, laneMs: 1, go: true }, { atIso: 'z' });
      let k = 0; const draws = [0, 3, 6, 5, 99, 8, 9];
      const seed = qualSeed(readRuns(s).runs, 'sgt', () => draws[k++], { taken: [8] }), playedN = playedSeeds(readRuns(s).runs, 'sgt').size;
      const kept = readRuns(s), none = qualSeed([], 'sgt', () => 4) === 4;
      s.setItem(HOUSE_RUNS_KEY, JSON.stringify({ v: 1, runs: [{ scene: 'test-shoothouse', sheet: 'sgt', seed: 1 }], quals: [1, 2] }));
      const badQ = readRuns(s);
      s.setItem(HOUSE_RUNS_KEY, 'not json');
      const bad = readRuns(s);
      console.log(`      ${kept.runs.length} runs kept, the private's qualification kept beside them ${!!kept.quals?.private}; the sergeant played ${playedN} seeds; drawn ${draws.slice(0, k).join(', ')} → ${seed}; a bad quals: ${JSON.stringify(badQ)}; a bad record: ${JSON.stringify(bad)}`);
      assert(kept.runs.length === HOUSE_RUNS_MAX && kept.quals?.private?.seeds.join() === '1,2,3' && seed === 9 && none && badQ.runs.length === 1 && badQ.quals === undefined && bad.runs.length === 0, JSON.stringify({ seed, n: kept.runs.length }));
    },
  },
  {
    name: 'the score line names a drawn house after its seed ("seed 48213 · house <code> ·"), and a house as set\'s line is v0.0.20\'s to the character (score.js scoreLine\'s house)',
    fn() {
      const base = { version: '0.0.21', scene: 'test-shoothouse', seed: 48213, aspects: [['pause', 70], ['drill', 65]], star: false, note: '' };
      const set = scoreLine(base), drawn = scoreLine({ ...base, house: 'Cn290pc.Ks206lc.En175pc|ftna|p0120' });
      console.log(`      as set: ${set}`);
      console.log(`      drawn:  ${drawn}`);
      assert(set === 'OLYMPUS v0.0.21 · test-shoothouse · seed 48213 · pause 70 · drill 65 · ★ no · note: none' && drawn === 'OLYMPUS v0.0.21 · test-shoothouse · seed 48213 · house Cn290pc.Ks206lc.En175pc|ftna|p0120 · pause 70 · drill 65 · ★ no · note: none', drawn);
    },
  },
  {
    name: 'a lane loaded from a save ends the attempt: a save at GO of a qualification lane, loaded or imported after a bad run, or Continue, is never counted; only the launch the attempt made itself, on its hidden seed, keeps it; the title ends it (house-runs.js qualKeep, called by main.js launch; the review of 2026-11-16: a retry from a save was counted)',
    fn() {
      // (the attempt after one GO, its second lane launched on its hidden seed 202)
      const s = store(), first = play(s, [lane(201)]), going = { ...first.attempt, pending: 202 };
      const own = qualKeep(going, { qual: true, seed: 202 }), loaded = qualKeep(going, { qual: false, seed: 202 }), other = qualKeep(going, { qual: true, seed: 999 }), none = qualKeep(null, { qual: true, seed: 202 });
      // (the save at GO loaded after the NO-GO: the card's step with the attempt as the launch left it)
      const retry = qualStep(loaded, lane(202), readRuns(s).runs, { label: 'Sergeant' }), straight = qualStep(own, lane(202), readRuns(s).runs, { label: 'Sergeant' });
      // (the page's wiring: launch keeps the attempt only through qualKeep, the title ends it)
      const src = readFileSync(path.join(root, 'src', 'main.js'), 'utf8'), body = (name) => { const i = src.indexOf(`function ${name}(`); return i < 0 ? '' : src.slice(i, src.indexOf('\n}\n', i)); };
      const wired = { launch: /qualAttempt = qualKeep\(qualAttempt, \{ qual: qualLaunching/.test(body('launch')), quit: /qualAttempt = null/.test(body('quitToTitle')), first: /qualLaunch\(\(\) => playScene/.test(body('qualFirst')) };
      console.log(`      after "${first.said[0]}", the second lane on the hidden seed 202: launched by the attempt ${own ? 'kept' : 'ended'}; a save at its GO loaded (or imported, or Continue) ${loaded ? 'kept' : 'ended'}, its card ${retry.words === null ? 'counts nothing' : `"${retry.words}"`}; the attempt's own lane's card "${straight.words}"; a launch on another seed ${other ? 'kept' : 'ended'}; main.js ${JSON.stringify(wired)}`);
      assert(own === going && loaded === null && other === null && none === null && retry.words === null && retry.qual === null && straight.words === 'QUALIFICATION 2 OF 3 · GO', JSON.stringify({ own, loaded, other, retry, straight }));
      assert(wired.launch && wired.quit && wired.first, JSON.stringify(wired));
    },
  },
];
