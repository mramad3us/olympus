// The check (src/sim/skills/checks.js; SKILLS §5): the dice, the odds, routine work, the grades, the words.
// Tradecraft's parity numbers below come from a scratch run of tradecraft's own checks.js and rng.js on
// the same streams (the build sheet 0.0.5 §5.2), pasted in: no test imports ../tradecraft.
import { assert, fmt } from './helpers.mjs';
import { stream, d20 } from '../src/core/rng.js';
import { check, opposed, won, oddsOf, grade, checkText, checkShort, isRoutine, isMastered, sortMods, DC, TEMPO } from '../src/sim/skills/checks.js';

const arms = await import('../src/sim/arms/drills.js').then(async (d) => ({ MACROS: d.MACROS, ACTIONS: (await import('../src/sim/arms/firearms.js')).ACTIONS })).catch(() => null);
// (UNLOAD SHOW CLEAR's rolled sub-steps as SKILLS §5.1 counts them, when the arms are not there to read: the selector 6, a pouch 7, lock back 6, inspect 6 (dark +4), release 6, the selector 6, charge 8, the selector 6, the port 3)
const CLEAR_FALLBACK = [['selector:safe', 6], ['magOut:pouch', 7], ['lockBack', 6], ['inspect', 6, 4], ['release', 6], ['selector:semi', 6], ['charge', 8], ['selector:safe', 6], ['port', 3]];

export default [
  {
    name: 'tradecraft\'s dice, bit for bit: the first ten d20s on stream(\'olympus-parity\', 1) and tradecraft\'s own log line on stream(\'olympus-parity\', 2)',
    fn() {
      const r = stream('olympus-parity', 1), rolls = [], totals = [], oks = [];
      for (let i = 0; i < 10; i++) { const c = check(r, { skill: 'weapons', value: 10, dc: 12, mods: [{ why: 'dusk', v: -1, src: 'env' }] }); rolls.push(c.roll); totals.push(c.total); oks.push(c.ok); }
      const line = checkText(check(stream('olympus-parity', 2), { skill: 'weapons', value: 10, dc: 12, mods: [{ why: 'dusk', v: -1, src: 'env' }] }));
      console.log(`      d20s ${rolls.join(', ')} (tradecraft's 7, 7, 8, 4, 11, 10, 20, 3, 15, 9); totals ${totals.join(', ')}; ${oks.every(Boolean) ? 'all passed' : 'NOT all passed'}`);
      console.log(`      "${line}"`);
      assert(rolls.join() === '7,7,8,4,11,10,20,3,15,9' && totals.join() === '16,16,17,13,20,19,29,12,24,18' && oks.every(Boolean), JSON.stringify({ rolls, totals }));
      assert(line === 'Weapon handling check: 5 + 10 − 1 (dusk) = 14 against 12, success.', line);
    },
  },
  {
    name: 'the odds of a check over 100,000 rolls a cell, value − DC from −22 to +22, within half a point of oddsOf\'s closed form; from value 15 at the DC + 10 a natural 1 is caught, so it never fails, and oddsOf given the roll\'s way of working says 1 there (SKILLS §5.1, the mastery rule: the user\'s "good defaults", 2026-11-11)',
    fn() {
      const r = stream('checks', 'odds'), rows = [];
      let worst = 0;
      for (let d = -22; d <= 22; d++) {
        let ok = 0;
        const N = 100_000;
        for (let i = 0; i < N; i++) if (check(r, { skill: 'marksmanship', value: 10 + d, dc: 10 }).ok) ok++;
        const sure = isMastered({ value: 10 + d, dc: 10 }), q = sure ? 1 : oddsOf(10 + d, 10, []), p = ok / N;
        assert(oddsOf(10 + d, 10, [], { procedure: false, pressure: 'evaluated', tempo: 'normal' }) === q, `oddsOf with the way of working at ${d}`);
        worst = Math.max(worst, Math.abs(p - q));
        rows.push(`${d >= 0 ? '+' : ''}${d} ${fmt(p * 100)}/${fmt(q * 100, 0)}`);
      }
      for (let i = 0; i < rows.length; i += 9) console.log(`      ${rows.slice(i, i + 9).join('  ')}`);
      console.log(`      worst gap ${fmt(worst * 100, 2)} points (value − DC: measured % / closed form %; from +10 the mastered 1 is caught: 100%)`);
      assert(worst < 0.005, `worst ${worst}`);
    },
  },
  {
    name: 'routine work (SKILLS §5.1) through UNLOAD SHOW CLEAR\'s rolls: under 3% halts at WH 10 rested and lit, none at 18; the recruit, the tired and the dark still halt; at danger the private\'s naturals bite and the sergeant\'s are caught by mastery (value 15, the DC + 10: "at every pressure", the user\'s "good defaults", 2026-11-11); a shot and an opposed roll never routine',
    fn() {
      const subs = arms ? arms.MACROS.clear.subs.filter(a => arms.ACTIONS[a]?.dc !== null && !arms.ACTIONS[a]?.observer).map(a => [a, arms.ACTIONS[a].dc, arms.ACTIONS[a].dark ?? 0]) : CLEAR_FALLBACK;
      const CONDS = { 'rested, lit': { mods: [], dark: false }, 'exhausted': { mods: [{ why: 'exhausted', v: -3, src: 'need' }], dark: false },
        'exhausted, cold hands, dark': { mods: [{ why: 'exhausted', v: -3, src: 'need' }, { why: 'cold hands', v: -2, src: 'body' }, { why: 'no light to see it by', v: -2, src: 'env' }], dark: true } };
      const N = 20_000, r = stream('checks', 'routine'), table = {};
      for (const wh of [4, 10, 18]) for (const [cond, C] of Object.entries(CONDS)) for (const pressure of ['evaluated', 'danger']) {
        let halts = 0, slow = 0;
        for (let i = 0; i < N; i++) {
          for (const [, dc, dark] of subs) {
            const c = check(r, { skill: 'weapons', value: wh, dc: dc + (C.dark ? dark : 0), mods: C.mods, pressure, procedure: true });
            if (!c.ok && !c.routine) { halts++; break; }
            if (!c.ok) slow++;
          }
        }
        table[`${wh}|${cond}|${pressure}`] = { halts: halts / N, slow: slow / N };
      }
      console.log(`      UNLOAD SHOW CLEAR's ${subs.length} rolled sub-steps (${subs.map(s => `${s[0]} ${s[1]}`).join(', ')}${arms ? ', from drills.js MACROS' : ', the fallback list'}), ${N} runs a cell: halts / routine misses a run`);
      for (const pressure of ['evaluated', 'danger']) for (const wh of [4, 10, 18]) {
        console.log(`      ${pressure.padEnd(9)} WH ${String(wh).padStart(2)}: ${Object.keys(CONDS).map(c => `${c} ${fmt(table[`${wh}|${c}|${pressure}`].halts * 100)}% / ${fmt(table[`${wh}|${c}|${pressure}`].slow, 2)}`).join(';  ')}`);
      }
      const at = (wh, c, p = 'evaluated') => table[`${wh}|${c}|${p}`].halts;
      assert(at(10, 'rested, lit') < 0.03 && at(18, 'rested, lit') === 0 && at(4, 'rested, lit') > 0.2 && at(10, 'exhausted, cold hands, dark') > 0.3, JSON.stringify(table));
      assert(at(10, 'rested, lit', 'danger') > 0.3 && at(18, 'rested, lit', 'danger') === 0, 'at danger the private\'s naturals bite, the sergeant\'s are caught');
      const s = check(stream('checks', 'shot'), { skill: 'marksmanship', value: 30, dc: 5, pressure: 'evaluated', procedure: false });
      const o = opposed(stream('checks', 'opp'), { skill: 'awareness', value: 30 }, { skill: 'fieldcraft', value: 0 });
      assert(!s.routine && !('routine' in o) && !isRoutine({ value: 30, dc: 5, procedure: true, tempo: 'rushed', pressure: 'none' }), 'a shot, an opposed roll, a rushed one');
    },
  },
  {
    name: 'the grades (SKILLS §5.6), the modifiers in SKILLS\' order, the tempos, the hook, and eleven golden lines of checkText and checkShort (a caught 1 and a clean 20 among them, SKILLS §5.1)',
    fn() {
      const g = [[-12, 0], [-10, 0], [-9, 0], [-6, 0], [-5, 0], [-1, 0], [0, 0], [3, 0], [4, 0], [9, 0], [10, 0], [-4, 20], [-12, 20], [2, 1], [-7, 1], [-11, 1]].map(([m, n]) => `${m}${n ? `/n${n}` : ''} ${grade(m, n)}`);
      console.log(`      ${g.join(', ')}`);
      assert(g.join() === '-12 disaster,-10 disaster,-9 bad,-6 bad,-5 miss,-1 miss,0 pass,3 pass,4 good,9 good,10 superb,-4/n20 pass,-12/n20 pass,2/n1 miss,-7/n1 bad,-11/n1 disaster', g.join());
      const sorted = sortMods([{ why: 'tired', v: -1, src: 'need' }, { why: 'the cold', v: -1, src: 'body:thermal' }, { why: 'prone', v: 4, src: 'task' }, { why: 'zero', v: 0, src: 'gear' }, { why: 'the optic', v: 1, src: 'gear' }, { why: 'dark', v: -2, src: 'env' }]);
      assert(sorted.map(m => m.why).join() === 'prone,dark,the optic,the cold,tired', sorted.map(m => m.why).join());
      // (a stream whose next d20 shows a given face: found by peeking at copies, the dice themselves never forced)
      const at = (face) => { for (let k = 0; ; k++) { const r = stream('checks', 'face', face, k); if (d20([...r]) === face) return r; } };
      const lines = [
        check(at(12), { skill: 'weapons', value: 10, dc: 9, procedure: true, pressure: 'evaluated' }),
        check(at(1), { skill: 'weapons', value: 10, dc: 8, procedure: true, pressure: 'evaluated' }),
        check(at(1), { skill: 'weapons', value: 4, dc: 8, procedure: true, pressure: 'evaluated' }),
        check(at(12), { skill: 'weapons', value: 14, dc: 9, tempo: 'steady', procedure: true }),
        check(at(9), { skill: 'weapons', value: 10, dc: 8, tempo: 'rushed', procedure: true, pressure: 'evaluated' }),
        check(at(14), { skill: 'marksmanship', value: 10, dc: 19, mods: [{ why: 'prone', v: 4, src: 'task' }, { why: 'the SO-4 at 1×', v: 1, src: 'gear' }, { why: 'the aim held', v: 4, src: 'task' }], pressure: 'evaluated', dcParts: [{ why: '25 m', v: 7 }, { why: 'the 25 m card', v: 6 }, { why: 'the R-7', v: 0 }, { why: 'base', v: 6 }], verb: 'a 5' }),
        check(at(20), { skill: 'marksmanship', value: 6, dc: 30, pressure: 'evaluated' }),
        check(at(9), { skill: 'social', value: 6, dc: 20, hook: true }),
        check(at(11), { skill: 'awareness', value: 14, dc: 6, pressure: 'evaluated', verb: 'clear' }),
        // (the mastery rule, SKILLS §5.1: a sergeant's natural 1 under fire caught by his margin, a natural 20 on procedure clean)
        check(at(1), { skill: 'weapons', value: 19, dc: 6, procedure: true, pressure: 'fire' }),
        check(at(20), { skill: 'weapons', value: 10, dc: 8, procedure: true, pressure: 'evaluated' }),
      ];
      for (const c of lines) console.log(`      "${checkText(c)}"  ·  "${checkShort(c)}"`);
      const want = [
        'Weapon handling check: 12 + 10 = 22 against 9: routine, done.',
        'Weapon handling check: 1 + 10 = 11 against 8, a natural 1, caught: it only cost time.',
        'Weapon handling check: 1 + 4 = 5 against 8, a natural 1, failure.',
        'Weapon handling, taken steady: 12 + 14 + 3 (steady) = 29 against 9, done.',
        'Weapon handling check: 9 + 10 − 3 (rushed) = 16 against 8, success.',
        'Marksmanship check: 14 + 10 + 4 (prone) + 4 (the aim held) + 1 (the SO-4 at 1×) = 33 against 19 (25 m 7, the 25 m card 6, the R-7 0, base 6), a 5.',
        'Marksmanship check: 20 + 6 = 26 against 30, a natural 20, success.',
        'Social check: 9 + 6 = 15 against 20, halved by leverage to 10, success.',
        'Awareness check: 11 + 14 = 25 against 6, clear.',
        'Weapon handling check: 1 + 19 = 20 against 6, a natural 1, caught.',
        'Weapon handling check: 20 + 10 = 30 against 8, a natural 20: clean.',
      ];
      const shorts = ['Weapon handling 22 against 9 · routine', 'Weapon handling 11 against 8 (a natural 1) · caught', 'Weapon handling 5 against 8 (a natural 1) · failed', 'Weapon handling 29 against 9 · routine',
        'Weapon handling 16 against 8 · passed', 'Marksmanship 33 against 19 · a 5', 'Marksmanship 26 against 30 (a natural 20) · passed', 'Social 15 against 10 · passed', 'Awareness 25 against 6 · clear', 'Weapon handling 20 against 6 (a natural 1) · caught', 'Weapon handling 30 against 8 (a natural 20) · clean'];
      lines.forEach((c, i) => { assert(checkText(c) === want[i], `${i}: ${checkText(c)}`); assert(checkShort(c) === shorts[i], `${i}: ${checkShort(c)}`); });
      assert(TEMPO.rushed.timeK === 0.6 && TEMPO.careful.v === 2 && DC.hard === 20 && lines[4].routine === false, 'the tempos and DCs');
      const o = opposed(stream('checks', 'opp', 2), { skill: 'fieldcraft', value: 12 }, { skill: 'awareness', value: 9, mods: [{ why: 'dark', v: -2, src: 'env' }] }, { them: true });
      console.log(`      "${checkText(o)}"  ·  "${checkShort(o)}" (them: won() ${won(o)})`);
      assert(won(o) === !o.ok, 'won() reads a roll against the player the right way round');
    },
  },
];
