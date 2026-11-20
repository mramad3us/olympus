// OLYMPUS tests: "The window and the canopy"'s words, F180's sim half (the build sheet v0.0.28 item 5, §6 B, §8; the user, 2026-11-19:
// "forget voice synthesis, no voices.", and their report of 2026-11-19: every instruction says what to press).
//
// The private by the keys on 48213 to the card, tick by tick: every line a 'say' fact of kind 'speech' at its speaker, a person with an actor
// on the live area as it is said (a bubble at him; none on the tower's PA, none voiced: tests/no-voices.test.mjs holds the engine); at every
// standing command the radio box's line (handling.js standingCmd) is the speaker's words and after them the press words, and those name a row
// by its label (courses.js ARM_ROWS) and a key by its label from core/keys.js, on AZERTY and on QWERTY (armouryPressOf's layout); off the
// station they name the walk's four keys. Fails without the press words or with a line said by no one there. The review of v0.0.28 B's:
// the radio box shows a standing line in two lines at most (style.css .said, -webkit-line-clamp 2; about 68 characters a line at every size,
// the font scaled with the box), so each line is at most STANDING_MAX_CH and names one row (the next not yet done), never a chain; the
// window's three rows and "(or G, then its row)" had run it to 167 characters, "then R: Sign for it" never seen (ui-armoury measures the page).
import { assert } from './helpers.mjs';
import { laneMemo } from './armoury-world.mjs';
import { ARM_PRESS, ARM_ROWS } from '../src/data/courses.js';
import { label } from '../src/core/keys.js';

/** The longest standing line the radio box shows whole in its two lines (characters: 120 measured whole and 130 not at 1024 × 768 beside
 * "SGT LAURENT · 6 M", 110 the margin for a longer speaker's name; my call, ui-armoury measures the page). */
const STANDING_MAX_CH = 110;

export default [
  {
    name: 'F180: every line a bubble at its speaker there, none on the PA; every standing command\'s line carries its press words, a row\'s label and a key\'s label on AZERTY and QWERTY, the walk\'s keys off the station',
    fn() {
      // (the lane armoury-world plays once a process: its lines as said, its standing lines and their press words as read at each command)
      const L = laneMemo(), bad = [], seen = L.stood, n = L.out.ticks, said = L.said.length;
      for (const v of seen.values()) {
        const P = ARM_PRESS[v.cmd];
        for (const lay of ['azerty', 'qwerty']) {
          const w = v[lay] ?? '', R = label('hand', { layout: lay }), walk = ['up', 'left', 'down', 'right'].map(a => label(a, { layout: lay })).join(' ');
          const rowsNamed = P.rows.length ? P.rows.some(id => w.includes(ARM_ROWS[id]) || (P.tempo && w.includes(ARM_ROWS[id].replace(/^Clean, /, '')))) : true;
          // (the serial check's wait on its station names no key, for none is wanted until your name: "wait for your name"; at your name its
          // R, held below (the fixer of v0.0.28's play review, finding 3: "R: Call your serial" for 14 s while R did nothing))
          const ok = v.wait && v.at ? w === 'wait for your name' : v.cmd === 'fallIn' ? w.includes(walk) : v.cmd === 'card' && v.at ? w.includes(R) : (w.includes(R) || w.includes(walk)) && (rowsNamed || !v.at);
          if (!ok) bad.push(`${v.cmd} (${v.at ? 'on' : 'off'} its station, ${lay}): "${w}"`);
        }
        if (!v.text.includes(v.azerty ?? '\u0000')) bad.push(`${v.cmd}: the radio box's line "${v.text}" without its press words`);
        if (v.text.length > STANDING_MAX_CH) bad.push(`${v.cmd}: the radio box's line ${v.text.length} characters, over ${STANDING_MAX_CH}: "${v.text}"`);
        if (((v.azerty ?? '').match(new RegExp(`(^|, then )${label('hand')}: `, 'g')) ?? []).length > 1) bad.push(`${v.cmd}: a chain of rows "${v.azerty}"`);
        if (/[{}]/.test(v.text)) bad.push(`${v.cmd}: a blank left in "${v.text}"`);
      }
      if (![...seen.values()].some(v => v.cmd === 'serials' && v.at && !v.wait && (v.azerty ?? '').includes(`${label('hand')}: ${ARM_ROWS.call}`))) bad.push('serials: never read at your name with its R');
      for (const f of L.said) if (f.kind !== 'speech' || !f.person || !f.there || /[{}]/.test(f.text)) bad.push(`"${f.text}": ${f.kind} by ${f.who}${f.there ? '' : ' (not there)'}`);
      for (const [k, v] of seen) console.log(`      ${k}: "${v.text}" | QWERTY: ${v.qwerty}`);
      console.log(`      ${said} lines said over ${n} ticks, ${seen.size} standing lines read, the longest ${Math.max(...[...seen.values()].map(v => v.text.length))} characters (at most ${STANDING_MAX_CH}); ${bad.length} wrong`);
      assert(!bad.length, bad.slice(0, 6).join('; '));
    },
  },
];
