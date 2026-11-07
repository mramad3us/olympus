// The instinct's line and R's offer as the HUD lays them out, and the R and T keys (quick): src/ui/hud/instinct.js
// partsOf, src/ui/hud/offer.js, core/keys.js's press kind (the build sheet 0.0.4 §5.4's ui-instinct).
// Held: the line carries its tone (calm, note, warn, urgent) and T's keycap when T does something; the
// chip leads with "T held" and carries the waiting lines' own keys and the count; R's offer is its own
// plate on EVERY line, urgent ones included (the 0.0.6 round: the user, 2026-11-06, "the shave+wash+water
// when pressing R at a basin without the tootip telling us what is going to happen is no good"; the build
// sheet 0.0.6 §8 item 7, against SKILLS §14.1's "except on an urgent line"), its chip still showing
// (SKILLS §14.1: "nothing that matters hides behind the line"), its "…" where R held has more (handOffer's
// rows over two, R's wait not counted), its pixels the kit's (R's keycap, the words in the 3 × 5 capitals, cut with "…" to its
// width); keycaps by physical code, AZERTY's labels (T and R are T and R; a QWERTY table
// changes nothing for them, the walk's Z Q S D would); the wait's "again:" once armed; R tapped sends
// what the offer said (a door 'door', an activity its id and spot); R and T are press keys: a tap on
// the key going up under 220 ms, 'held' at 220 ms while still down, never both, and nothing queued for
// the sim by the keys themselves (the page sends their actions, with what the line said at key-down).
// Uses fixtures of instinctNow's shape (SKILLS §15.4) and handOffer's (the sheet §2.2.6), so it is the
// HUD's rule under test, not the rules'. Prints each case's line as the player reads it.
import { assert } from './helpers.mjs';
import { partsOf, textOf, LINE_TONES } from '../src/ui/hud/instinct.js';
import { offerWords, wantOf } from '../src/ui/hud/offer.js';
import { keyPlatePixels, asText, textWidth } from '../src/ui/kit/pixels.js';
import { createKeyState, label, TAP_MS, bindingOf } from '../src/core/keys.js';

const az = (a) => label(a), qw = (a) => label(a, { layout: 'qwerty' });
const line = (tone, text, act = null, id = `r-${tone}`) => ({ id, voice: 'di', tone, text, act, ms: 0 });
const SHOWER = { act: 'hand', verb: 'activity', target: null, id: 'shower', spotId: 'f:e1:head-2a:shower-2#1', label: 'shower · 10 min, done 19:41', durMs: 600_000, late: null, rows: 1, more: [] };
const SINK = { act: 'hand', verb: 'activity', target: 'f:e1:head-2a:sinks-1', id: 'wash-hands', spotId: 'f:e1:head-2a:sinks-1#1', args: {}, label: 'wash hands · 30 s', durMs: 30_000, late: null, why: 'hands', rows: 6, more: [] };
const RACK = { act: 'hand', verb: 'activity', id: 'sleep', spotId: 'f:e1:bay-2-1:rack-n1#1', args: { until: 'reveille' }, label: 'sleep until reveille · 8 h 15 min, done 05:30', durMs: 29_675_300, late: null, more: [{ id: 'nap', args: { min: 45 }, label: 'nap · 45 min, done 22:40' }] };
const WAIT = { act: 'hand', verb: 'wait', target: null, label: 'wait 15 min', id: 'wait' };
const DOOR = { act: 'hand', verb: 'open', target: 'o:e1:bay-2-1', label: 'open the door', id: null, spotId: null };

export default [
  {
    name: 'the line: its tone as its border (calm, note, warn, urgent), T\'s keycap when it acts; the chip "T held" (where it has an act) with the waiting keys and the count; R\'s plate on every line, urgent ones too (the user, 2026-11-06: "without the tootip telling us what is going to happen is no good"), the chip still showing',
    fn() {
      const cases = [
        ['calm, nothing to do', { line: line('calm', 'Taps at 22:00.') }, SHOWER],
        ['warn, T drinks; a chip waiting', { line: line('warn', 'Thirsty. The tap is right here.', 'activity:drink'), chip: { id: 'need-dirt', tone: 'note', short: 'Wash', act: 'activity:shower' }, keys: ['people'], queued: 1 }, SHOWER],
        ['urgent, the klaxon: R\'s plate stays, and the chip', { line: line('urgent', 'Klaxon. Up, utilities, the foot of your rack. Five minutes.', 'rise'), chip: { id: 'need-bladder', tone: 'warn', short: 'Bladder', act: null } }, RACK],
        ['note at a sink after the head: R washes the hands', { line: line('note', 'The basins. Wash your hands.', 'activity:wash-hands') }, SINK],
        ['note, lying awake: T rises', { line: line('note', 'Awake. Up.', 'rise') }, null],
        ['nothing said: R alone', null, DOOR],
      ];
      for (const [what, now, offer] of cases) {
        const p = partsOf({ now, offer, label: az });
        console.log(`      ${what}: ${textOf(p)}  [${p.map(x => `${x.part}${x.part === 'line' ? `:${x.tone}` : ''}`).join(' ')}]`);
        const ln = p.find(x => x.part === 'line'), chip = p.find(x => x.part === 'chip'), off = p.find(x => x.part === 'offer');
        if (now?.line) assert(ln && LINE_TONES.includes(ln.tone) && ln.tone === now.line.tone && ln.keys.length === (now.line.act ? 1 : 0) && (!now.line.act || ln.keys[0] === 'T'), JSON.stringify(ln));
        // (T held only where the chip has an act: a key never promised for nothing, the review of v0.0.4)
        if (now?.chip) assert(chip && (now.chip.act ? chip.keys[0] === 'T held' : chip.keys.length === 0), `the chip: ${JSON.stringify(chip)}`);
        if (now?.keys?.length) assert(chip.text.includes('[F]') && chip.text.includes('+1'), `the waiting keys and the count: ${chip.text}`);
        assert(!!off === !!offer, `R's plate on ${what}: ${JSON.stringify(off)}`);
        // (an urgent line's plate short: no ", done" or ", the count", so the DI's order keeps its sentence; the fixer's, 0.0.6)
        if (off) assert(off.keys[0] === 'R' && off.text === (now?.line?.tone === 'urgent' ? offer.label.replace(/, (done|the count) .*$/, '') : offer.label) && off.more === ((offer.rows ?? 0) > 2 || (offer.more?.length ?? 0) > 0), JSON.stringify(off));
        if (now?.line?.tone === 'urgent') assert(off && chip, `the urgent line keeps R's plate and the chip: ${JSON.stringify(p)}`);
      }
    },
  },
  {
    name: 'keycaps by physical code, labelled AZERTY: T and R on either layout (the walk differs: Z Q S D against W A S D); "R held: the menu" where the offer has more; "again:" on the wait once armed',
    fn() {
      const a = textOf(partsOf({ now: { line: line('warn', 'Thirsty.', 'activity:drink'), chip: { id: 'x', short: 'Eat', act: 'activity:snack' } }, offer: RACK, label: az }));
      const q = textOf(partsOf({ now: { line: line('warn', 'Thirsty.', 'activity:drink'), chip: { id: 'x', short: 'Eat', act: 'activity:snack' } }, offer: RACK, label: qw }));
      console.log(`      AZERTY: ${a}\n      QWERTY: ${q}\n      the walk: ${['up', 'left', 'down', 'right'].map(az).join(' ')} (AZERTY), ${['up', 'left', 'down', 'right'].map(qw).join(' ')} (QWERTY)`);
      assert(a === q && /^T Thirsty\.  T held Eat  R sleep until reveille .* · R held: the menu$/.test(a), a);
      const once = partsOf({ offer: WAIT, label: az, armed: true }).find(p => p.part === 'offer');
      assert(once.text === 'again: wait 15 min' && offerWords(WAIT).text === 'wait 15 min', JSON.stringify(once));
      console.log(`      the wait armed: R ${once.text}`);
    },
  },
  {
    name: 'R\'s plate in the kit\'s pixels: the keycap R, the words in the 3 × 5 capitals ("R WASH HANDS · 30 S"), "HOLD ▸" of more in brass at its right, a struck note before the keycap, the late\'s amber, the words cut with "…" to its width; the same plate on every layout',
    fn() {
      const p = keyPlatePixels({ keyText: 'R', words: offerWords(SINK).text, more: offerWords(SINK).more });
      const art = asText(p);
      console.log(`      "${p.words}", ${p.w} × ${p.h} kit pixels (${p.w * 2} × ${p.h * 2} CSS px at --ui 1):\n${art.map(r => `      ${r}`).join('\n')}`);
      assert(p.words === 'R WASH HANDS · 30 S' && p.h === 11 && !p.cut, JSON.stringify({ words: p.words, h: p.h }));
      // (more: "HOLD ▸" in brass at the right after a brass rule, words not dots (the fixer's, 0.0.6))
      const brass = art.slice(2, -2).map(r => r.slice(-28)).join('');
      assert((brass.match(/c/g) ?? []).length >= 30 && !art.some(r => r.slice(0, -28).includes('c')), `the more mark: ${art.map(r => r.slice(-28)).join(' / ')}`);
      // (a struck note before the keycap, in the struck rows' grey: "USE THE HEAD: NOTHING TO GIVE · R WAIT 15 MIN")
      const noted = keyPlatePixels({ keyText: 'R', words: 'wait 15 min', note: offerWords({ ...WAIT, rows: 2, struck: { words: 'use the head', off: 'nothing to give' } }).note });
      const nArt = asText(noted);
      console.log(`      the urinal, nothing to give: "${noted.note} · ${noted.words}", ${noted.w} wide:\n${nArt.map(r => `      ${r}`).join('\n')}`);
      assert(noted.note === 'USE THE HEAD: NOTHING TO GIVE' && nArt.some(r => r.includes('s')) && noted.words === 'R WAIT 15 MIN', JSON.stringify({ note: noted.note, words: noted.words }));
      // (short of room, the note gives way first)
      const tight = keyPlatePixels({ keyText: 'R', words: 'wait 15 min', note: 'the head: nothing to give', maxW: 80 });
      assert(tight.words === 'R WAIT 15 MIN' && tight.w <= 80 && tight.note.length < 'the head: nothing to give'.length, JSON.stringify({ words: tight.words, note: tight.note, w: tight.w }));
      // (the words in the plate's text colour; late, in the late's amber)
      const late = asText(keyPlatePixels({ keyText: 'R', words: 'wait 15 min', late: true }));
      assert(art.some(r => r.includes('T')) && late.some(r => r.includes('L')), 'the words\' colours');
      // (the sleep's long price cut to a width: the plate never wider than asked)
      const long = 'sleep until reveille · 8 h 15 min, done 05:30, the count 02:35', cut = keyPlatePixels({ keyText: 'R', words: long, maxW: 160 });
      console.log(`      cut to 160 kit pixels: "${cut.words}" (${cut.w} wide; whole it is ${keyPlatePixels({ keyText: 'R', words: long }).w})`);
      assert(cut.w <= 160 && cut.cut && cut.words.endsWith('…') && textWidth(long) > 160, JSON.stringify({ w: cut.w, words: cut.words }));
    },
  },
  {
    name: 'R tapped sends what the offer said: a door want \'door\', an activity its id and spot, the wait \'wait\', getting up \'rise\'',
    fn() {
      const got = [DOOR, SHOWER, RACK, WAIT, { act: 'hand', verb: 'rise', label: 'get up' }].map(wantOf);
      console.log(`      ${got.map(g => JSON.stringify(g.args)).join(' | ')}`);
      assert(got[0].args.want === 'door' && got[1].args.want === 'activity' && got[1].args.id === 'shower' && got[1].args.spotId === SHOWER.spotId, JSON.stringify(got));
      assert(JSON.stringify(got[2].args.args) === JSON.stringify({ until: 'reveille' }) && got[3].args.want === 'wait' && got[4].args.want === 'rise' && wantOf(null) === null, JSON.stringify(got));
    },
  },
  {
    name: 'R and T are press keys: a tap on the key going up under 220 ms, \'held\' at 220 ms while down and nothing on release, never both; the key-down said first, nothing of theirs queued for the sim',
    fn() {
      const k = createKeyState();
      assert(bindingOf('hand').kind === 'press' && bindingOf('instinct').kind === 'press', 'R and T are press keys');
      const d = k.down('KeyT', 1000);
      const early = k.due(1000 + TAP_MS - 1), tap = k.up('KeyT', 1000 + TAP_MS - 1);
      k.down('KeyR', 2000);
      const held = k.due(2000 + TAP_MS), again = k.due(2000 + 900), rel = k.up('KeyR', 2900);
      k.down('KeyR', 4000);
      const lateUp = k.up('KeyR', 4000 + TAP_MS + 30);                // (a release past 220 ms the timer missed: 'held' then)
      console.log(`      T 219 ms: down ${JSON.stringify(d)}, due ${JSON.stringify(early)}, up ${JSON.stringify(tap)}; R held: due at 220 ms ${JSON.stringify(held)}, again ${JSON.stringify(again)}, up ${JSON.stringify(rel)}; a 250 ms release with no timer: ${JSON.stringify(lateUp)}`);
      assert(d.length === 1 && d[0].kind === 'down' && !early.length && tap.length === 1 && tap[0].action === 'instinct' && tap[0].kind === 'tap', 'the tap');
      assert(held.length === 1 && held[0].action === 'hand' && held[0].kind === 'held' && !again.length && !rel.length, 'the hold, once, and nothing on release');
      assert(lateUp.length === 1 && lateUp[0].kind === 'held', 'a late release');
      assert(![d, tap, held].flat().some(f => f.kind === 'sim'), 'a press key fired a sim action by itself');
    },
  },
];
