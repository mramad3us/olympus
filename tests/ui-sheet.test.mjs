// The character sheet (C), PERSONNEL, in words (quick): src/ui/cards/sheet.js sheetOf over the player of a real
// barracks game (the build sheet 0.0.4 §5.4's ui-sheet). Held: every band of every need BODY names
// (src/data/body/needs.js: hunger, thirst, bladder, bowel, grime, fatigue) reads on the sheet as that
// band's own words with its tone, in the strip's order, and never as a number (VIEWS §8.2: "never a
// number the character could not know"); the strip is all nine glyphs at the sheet's size; THE FILE is
// the roster's (the name, Private (E1), 0311, 1st Squad, 2nd Platoon, Echo Company, the billet, the rack
// in words, the months of service); the doll's arguments carry the body's cues and the outfit worn.
// Part one feeds the sheet BODY's band tables through readers of their shape (stripOf, wordsOf,
// stagesOf, cuesOf: the sheet §2.1), so it is the sheet's rule under test; part two, once BODY's
// src/sim/body/cues.js is there, reads the real body of a new game and prints its sheet. Prints the
// sheet's lines.
// The 0.0.6 round's (the build sheet 0.0.6 §2.3): a Hands row (BODY's words: the head no longer washes them, the
// user's ask of 2026-11-06) and a Haircut row from the hair's one helper, hairOf ("High and tight · growing out",
// "Haircut due Thursday.", "Out of regulation."; the user, 2026-11-06: "we should have to groom our hair the same
// way we will have to groom our beards"), no number in either; "Head wet." for the shaved cut.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { assert, root } from './helpers.mjs';
import { sheetOf, NEED_NAMES, FINE_WORDS } from '../src/ui/cards/sheet.js';
import { STRIP_ORDER } from '../src/ui/hud/strip.js';
import { HUNGER, THIRST, BLADDER_BANDS, BOWEL_BANDS, GRIME_BANDS, FATIGUE_BANDS } from '../src/data/body/needs.js';
import { newGame } from '../src/sim/game.js';
import { haircutWords } from '../src/ui/cards/sheet.js';
import { hairAt, hairOf, SOL_H } from '../src/sim/body/hair.js';

const TABLES = { food: HUNGER, water: THIRST, bladder: BLADDER_BANDS, bowel: BOWEL_BANDS, grime: GRIME_BANDS, sleep: FATIGUE_BANDS };

/** Readers of BODY's shape that put one need at one band, the rest at their first. */
function readersAt(need, band) {
  const at = (n) => (n === need ? band : TABLES[n][0]);
  const strip = STRIP_ORDER.map(n => (TABLES[n] ? { need: n, band: at(n).id, fill: at(n).fill, tone: at(n).tone } : { need: n, band: 'fine', fill: 0, tone: 'fine' }));
  const words = { line: band.words || 'Nothing to speak of.', needs: Object.keys(TABLES).map(n => ({ need: n, band: at(n).id, words: at(n).words })) };
  return { bodyOf: () => ({ v: 2 }), stripOf: () => strip, wordsOf: () => words, stagesOf: () => ({}), cuesOf: () => ({ wetK: 0, grimeK: need === 'grime' ? band.fill / 5 : 0 }) };
}

export default [
  {
    name: 'every band of every need reads on the sheet as its own words and tone, in the strip\'s order, with no number in them; the strip all nine; THE FILE the roster\'s',
    fn() {
      const s = newGame({ seed: 48213, scenario: 'barracks' });
      let checked = 0;
      for (const [need, table] of Object.entries(TABLES)) {
        const seen = [];
        for (const band of table) {
          const sh = sheetOf(s, { body: readersAt(need, band) });
          const row = sh.needs.find(n => n.need === need);
          assert(row && row.band === band.id && row.words === (band.words || FINE_WORDS[need] || '') && row.words && row.tone === band.tone && row.name === NEED_NAMES[need], JSON.stringify({ need, band: band.id, row }));
          assert(!/\d/.test(row.words), `a number in ${need}'s ${band.id}: ${row.words}`);
          assert(sh.strip.length === 9 && sh.needs.map(n => n.need).join() === STRIP_ORDER.filter(n => TABLES[n]).join(), JSON.stringify(sh.needs.map(n => n.need)));
          seen.push(`${band.id} '${row.words}' (${row.tone})`);
          checked++;
        }
        console.log(`      ${NEED_NAMES[need]}: ${seen.join(', ')}`);
      }
      const sh = sheetOf(s, { body: readersAt('grime', GRIME_BANDS[4]) });
      console.log(`      THE FILE: ${sh.file.map(([k, v]) => `${k} ${v}`).join(' · ')}`);
      console.log(`      the doll: outfit ${sh.doll.outfit}, sex ${sh.doll.sex}, cues ${JSON.stringify(sh.doll.body)}`);
      const f = Object.fromEntries(sh.file);
      assert(f.Rank === 'Private (E1)' && f.MOS === '0311' && /^1st Squad, 2nd Platoon, Echo Company/.test(f.Unit) && /rifleman/.test(f.Billet) && /bay 2-1, rack n1, lower berth/.test(f.Rack) && /months|d|h/.test(f['In service']), JSON.stringify(f));
      assert(sh.doll.body.grimeK === 0.8 && sh.doll.outfit === 'utilities', JSON.stringify(sh.doll));
      console.log(`      ${checked} bands read`);
    },
  },
  {
    name: 'the real body of a new game on the sheet (once BODY\'s cues.js is there): its line, each need\'s stage, the strip',
    async fn() {
      if (!existsSync(path.join(root, 'src/sim/body/cues.js')) || !existsSync(path.join(root, 'src/sim/body/body.js'))) {
        console.log('      BODY\'s src/sim/body/cues.js is not there yet: part one stands alone');
        return;
      }
      const [{ bodyOf }, cues] = await Promise.all([import('../src/sim/body/body.js'), import('../src/sim/body/cues.js')]);
      for (const hour of [12.66, 21.95]) {
        const s = newGame({ seed: 48213, scenario: 'barracks', hour });
        const sh = sheetOf(s, { body: { bodyOf, stagesOf: cues.stagesOf, stripOf: cues.stripOf, wordsOf: cues.wordsOf, cuesOf: cues.cuesOf } });
        console.log(`      at ${hour} h: '${sh.line}'; ${sh.needs.map(n => `${n.name} ${n.band} '${n.words}'`).join(' · ')}; strip ${sh.strip.map(e => `${e.need}:${e.fill}`).join(' ')}`);
        assert(sh.strip.length === 9 && sh.needs.length >= 6 && sh.needs.every(n => !/\d/.test(n.words) && n.words && NEED_NAMES[n.need]), JSON.stringify(sh.needs));
      }
    },
  },
  {
    name: 'the Hands and Haircut rows (the user, 2026-11-06: "we should have to groom our hair the same way we will have to groom our beards"): the hands in BODY\'s words, the cut and how it has grown from hairOf, fresh to growing to due to out of regulation, never a number; "Head wet." for the shaved cut',
    async fn() {
      const [{ bodyOf }, cues] = await Promise.all([import('../src/sim/body/body.js'), import('../src/sim/body/cues.js')]);
      const s = newGame({ seed: 48213, scenario: 'barracks', hour: 19.5 });
      const real = { bodyOf, stagesOf: cues.stagesOf, stripOf: cues.stripOf, wordsOf: cues.wordsOf, cuesOf: cues.cuesOf, hairOf };
      const sh = sheetOf(s, { body: real });
      const hands = sh.needs.find(n => n.need === 'hands'), cut = sh.needs.find(n => n.need === 'haircut');
      console.log(`      a new career at 19:30: Hands '${hands?.words}' (${hands?.tone}); Haircut '${cut?.words}' (${cut?.tone})`);
      assert(hands && hands.name === 'Hands' && hands.words && !/\d/.test(hands.words), JSON.stringify(hands));
      assert(cut && cut.name === 'Haircut' && cut.band === 'fresh' && /·/.test(cut.words) && !/\d/.test(cut.words), JSON.stringify(cut));
      // (the cut as it grows: a high and tight at 0, 3, 7 and 10 sols, read through the sheet with hairAt's records)
      const rows = [0.5, 3, 7, 10].map(sols => {
        const rec = hairAt('highTight', sols * SOL_H, s.clock.ms);
        const one = sheetOf(s, { body: { ...real, hairOf: () => rec } }).needs.find(n => n.need === 'haircut');
        return { sols, band: rec.band.id, words: one.words, tone: one.tone, said: haircutWords(rec) };
      });
      for (const r of rows) console.log(`      ${r.sols} sols: ${r.band}, '${r.words}' (${r.tone})`);
      assert(rows[0].words === 'High and tight · fresh from the barber' && rows[1].words === 'High and tight · growing out' && /^Haircut due [A-Z][a-z]+day\.$/.test(rows[2].words) && rows[3].words === 'Out of regulation.', JSON.stringify(rows));
      assert(rows.every(r => !/\d/.test(r.words) && r.words === r.said) && rows[2].tone === 'note' && rows[3].tone === 'warn', JSON.stringify(rows));
      // (a shaved cut after the shower: its hair is a head)
      const wet = { ...readersAt('grime', GRIME_BANDS[0]), wordsOf: () => ({ line: 'Fresh. Hair wet.', needs: [{ need: 'hair', band: 'wet', words: 'Hair wet.' }] }) };
      const bare = sheetOf(s, { body: wet, look: { hair: { style: 'shaved', color: 'dark' } } }), crew = sheetOf(s, { body: wet, look: { hair: { style: 'lowReg', color: 'dark' } } });
      console.log(`      shaved: '${bare.line}', ${bare.needs.find(n => n.need === 'hair')?.name}; low regulation: '${crew.line}'`);
      assert(bare.line === 'Fresh. Head wet.' && bare.needs.find(n => n.need === 'hair').name === 'Head' && crew.line === 'Fresh. Hair wet.', JSON.stringify({ bare: bare.line, crew: crew.line }));
    },
  },
];
