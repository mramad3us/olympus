// The weapon mode's HUD in node (quick): the step panel's numbering and rows (src/ui/hud/steps.js), the
// ticks of a running command, the reflex card (hud/reflex.js), the radio box's lines (hud/radio.js), the
// PAPER inset's model (hud/paper.js), the inventory's tiles (cards/inventory.js) and the weapon states'
// rectangles (hud/layout.js). The build sheet 0.0.5 §5.4: "the digits from a fed list (1 Fire, 2 Aim,
// commands, singles, 0 more), struck reasons, 'routine'". The lists here are fed by hand in the shape of
// the shot role's stepsOf() and stopNow().reflex, arms' rangeLook() and kitView(), and PEOPLE's say fact
// (the sheet's §2.2 and §2.5): this suite tests the HUD's reading of them, not their making.
// The 0.0.7 round's (the build sheet 0.0.7 §2.1, §5.5 ui-steps): the rows at distance as the shot role gives them
// ({ id, label, ms, skill: null, odds: null, words }): the coach's call to dial, the dope for the line, the holds, the
// flags read, the lever, sitting; each with its time and no odds (no roll), its words on its hover, Fire and the
// commands kept on the first page past ten, the singles paged.
import { assert, fmt } from './helpers.mjs';
import { panelOf, rowText, oddsText, shownMs, rowTitle, createTicks, markOf, PANEL_KEYS } from '../src/ui/hud/steps.js';
import { reflexOf } from '../src/ui/hud/reflex.js';
import { lineOf, holdS, createRadioQueue, HOLD_S, WORD_S } from '../src/ui/hud/radio.js';
import { paperModel, PAPER_K, ringR, RINGS } from '../src/ui/hud/paper.js';
import { tilesOf, magIcon } from '../src/ui/cards/inventory.js';
import { colourAt } from '../src/ui/plaque.js';
import { rectsAt, clashesAt, STATES, CARD_W, CARD_H } from '../src/ui/hud/layout.js';

// (a stepsOf() list as the shot role gives it at Condition 4, the line cold, the tower's LOAD the current command)
const STEPS_C4 = [
  { id: 'fire', kind: 'fire', label: 'fire', ms: 400, off: 'on safe', skill: 'marksmanship' },
  { id: 'aim', kind: 'aim', label: 'aim at your card', ms: 870, odds: null, skill: 'weapons' },
  { id: 'macro:load', kind: 'command', label: 'LOAD', ms: 2410, rushMs: 1450, carefulMs: 3620, routine: true, cmd: true, subs: [{ id: 'selector:safe', label: 'safe', ms: 400 }, { id: 'magIn', label: 'magazine in', ms: 1610 }, { id: 'port', label: 'port shut', ms: 400 }], skill: 'weapons' },
  { id: 'magIn', kind: 'single', label: 'magazine in', ms: 1610, rushMs: 966, routine: true, skill: 'weapons' },
  { id: 'charge', kind: 'single', label: 'charge', ms: 920, rushMs: 552, odds: 0.85, skill: 'weapons' },
  { id: 'selector:semi', kind: 'single', label: 'to semi', ms: 400, routine: true, skill: 'weapons' },
  { id: 'port', kind: 'single', label: 'port: shut', ms: 400, routine: true },
  { id: 'stance:kneel', kind: 'stance', label: 'kneel', ms: 500 },
  { id: 'posture:highReady', kind: 'posture', label: 'high ready', ms: 345 },
  { id: 'wait', kind: 'wait', label: 'wait for the tower', ms: null },
];
const MORE = [...STEPS_C4.slice(0, 3), { id: 'macro:ready', kind: 'command', label: 'MAKE READY', ms: 3100, routine: true }, ...STEPS_C4.slice(3), { id: 'stow', kind: 'single', label: 'sling it', ms: 1000 }, { id: 'stance:prone', kind: 'stance', label: 'prone', ms: 1033 }, { id: 'leave', kind: 'leave', label: 'leave the mode', ms: 0 }];

export default [
  {
    name: 'the step panel numbers a fed list: 1 Fire, 2 Aim, the commands, the singles, 0 the tenth; past ten, 1 to 9 keep Fire, Aim and the commands and 0 is "more", paging the rest',
    fn() {
      const p = panelOf(STEPS_C4);
      console.log('      ten steps:');
      for (const s of p.slots) console.log(`        ${rowText(s)}`);
      assert(p.slots.length === 10 && !p.more && p.slots.map(s => s.key).join('') === PANEL_KEYS.join(''), JSON.stringify(p.slots.map(s => s.key)));
      assert(p.slots[0].step.id === 'fire' && p.slots[1].step.id === 'aim' && p.slots[2].step.cmd && p.slots[9].key === '0', JSON.stringify(p.slots.map(s => s.step.id)));
      const m0 = panelOf(MORE, { page: 0 }), m1 = panelOf(MORE, { page: 1 }), m2 = panelOf(MORE, { page: 2 });
      console.log(`      ${MORE.length} steps, page 1 of ${m0.pages}: ${m0.slots.map(s => `${s.key} ${s.step.label}`).join(' · ')} · 0 more`);
      console.log(`      page 2: ${m1.slots.map(s => `${s.key} ${s.step.label}`).join(' · ')} · 0 more; page 3 wraps to page ${m2.page + 1}`);
      assert(m0.more && m0.more.key === '0' && m0.pages === 2 && m0.slots.length === 9, JSON.stringify(m0.more));
      for (const pg of [m0, m1]) assert(pg.slots.slice(0, 4).map(s => s.step.id).join() === 'fire,aim,macro:load,macro:ready', `the fixed rows on every page: ${pg.slots.map(s => s.step.id)}`);
      const shown = new Set([...m0.slots, ...m1.slots].map(s => s.step.id));
      assert(MORE.every(s => shown.has(s.id)), `every step on some page: missing ${MORE.filter(s => !shown.has(s.id)).map(s => s.id)}`);
      assert(m2.page === 0, `paging wraps: ${m2.page}`);
    },
  },
  {
    name: 'a row says its time, its odds ("85%", "routine") and, struck, its reason ("1 fire · 0.4 s (on safe)"); Shift shows the rushed time; hovering names the roll and the rushed and careful times',
    fn() {
      const p = panelOf(STEPS_C4), fire = rowText(p.slots[0]), load = rowText(p.slots[2]), charge = rowText(p.slots[4]);
      const rushed = rowText(p.slots[2], { shift: true }), wait = rowText(p.slots[9]);
      console.log(`      ${fire} | ${load} | ${charge} | Shift: ${rushed} | ${wait}`);
      console.log(`      hover LOAD: ${rowTitle(STEPS_C4[2], { label: () => 'Shift' })}`);
      assert(fire === '1 fire · 0.4 s (on safe)', fire);
      assert(load === '3 LOAD · 2.4 s · routine' && rushed === '3 LOAD · 1.4 s · routine', `${load} / ${rushed}`);
      assert(charge === '5 charge · 0.9 s · 85%' && oddsText({ odds: 1 }) === '' && oddsText({ routine: true, odds: 0.5 }) === 'routine', charge);
      assert(shownMs(STEPS_C4[1], { shift: true }) === 870, 'a step with no rushed time keeps its own under Shift');
      assert(wait === '0 wait for the tower', wait);
      const t = rowTitle(STEPS_C4[2], { label: () => 'Shift' });
      assert(/rolls weapons/.test(t) && /rushed, 1\.4 s/.test(t) && /careful, 3\.6 s/.test(t) && /magazine in 1\.6 s/.test(t), t);
    },
  },
  {
    name: 'a running command\'s ticks fill from the step facts: ✓ passed, ◦ routine, ✗ fumbled, · to come; a new step starts them afresh',
    fn() {
      const t = createTicks();
      const seen = [];
      // (as shooting.js gives them: 'start' with no roll, then a 'sub' as each is rolled, 'halt' on the one that stops the rest, 'end' with none)
      t.fact({ phase: 'start', who: 'p145', step: 'macro:ready', i: 0, action: 'selector:safe', ok: null, routine: null, grade: null });
      t.fact({ phase: 'sub', who: 'p145', step: 'macro:ready', i: 0, action: 'selector:safe', ok: true, routine: true, grade: 'pass' });
      seen.push(t.of('macro:ready', 4).join(''));
      t.fact({ phase: 'sub', who: 'p145', step: 'macro:ready', i: 1, action: 'charge', ok: true, routine: false, grade: 'good' });
      seen.push(t.of('macro:ready', 4).join(''));
      t.fact({ phase: 'halt', who: 'p145', step: 'macro:ready', i: 2, action: 'pressCheck', ok: false, routine: false, grade: 'miss' });
      seen.push(t.of('macro:ready', 4).join(''));
      t.fact({ phase: 'start', who: 'p145', step: 'macro:load', i: 0, ok: null });
      t.fact({ phase: 'sub', who: 'p145', step: 'macro:load', i: 0, ok: true, routine: true, grade: 'pass' });
      t.fact({ phase: 'end', who: 'p145', step: 'macro:load', i: 0, ok: true, routine: null, grade: null });
      seen.push(t.of('macro:load', 3).join(''));
      console.log(`      MAKE READY: ${seen.slice(0, 3).join(' → ')}; then LOAD: ${seen[3]}; a routine natural 1 (miss, ok): ${markOf({ ok: true, routine: true, grade: 'miss' })}`);
      assert(seen.join('|') === '◦···|◦✓··|◦✓✗·|◦··', seen.join('|'));
      assert(t.of('macro:ready', 4).join('') === '····', 'the old step\'s ticks gone');
      assert(markOf({ ok: true, routine: true, grade: 'miss' }) === '✗' && markOf({}) === null, 'a routine fumble is a fumble');
    },
  },
  {
    name: 'the reflex card: the options numbered with their times, "nothing" always last, R\'s keep on and off',
    fn() {
      const rx = { why: 'click', title: 'Click.', options: [{ key: 'none', label: 'Nothing: let it come', step: null }, { key: 'ia', label: 'Tap, rack', step: 'macro:ia', ms: 1566 }, { key: 'look', label: 'Look at the port', step: 'observe', ms: 300 }] };
      const off = reflexOf(rx, { label: () => 'R' }), on = reflexOf(rx, { keep: true, label: () => 'R' });
      console.log(`      ${off.title} ${off.rows.map(r => r.text).join(' | ')} | ${off.keepText} → ${on.keepText}`);
      assert(off.rows.map(r => r.text).join('|') === '1 Tap, rack · 1.6 s|2 Look at the port · 0.3 s|3 Nothing: let it come', off.rows.map(r => r.text).join('|'));
      assert(off.keepText === 'R keep this answer 2 min: off' && on.keepText === 'R keep this answer 2 min: on', on.keepText);
      assert(reflexOf(null) === null, 'no reflex, no card');
    },
  },
  {
    name: 'the radio box: the tower as "◉ TOWER · SSGT <NAME>", the coach as "◉ SGT <NAME> · BESIDE YOU", each held 3.5 s + 0.33 s a word on a clock that stands with time; two lines at most',
    fn() {
      const state = { player: { id: 'p145', actor: 'a1' }, people: { p146: { name: { given: 'Ilse', family: 'Kowalski' }, service: { rank: 'SSgt', unitId: '2/4' } }, p147: { name: { given: 'Tomas', family: 'Abara' }, service: { rank: 'Sgt' } } },
        actors: { list: [{ id: 'a1', who: 'p145', x: 1100, z: 292.5 }, { id: 'a2', who: 'p146', x: 1080, z: 296 }, { id: 'a3', who: 'p147', x: 1099.4, z: 293.5 }] } };
      const brief = 'Range is open. Familiarisation fire, two-five metres: three strings of five, prone, kneeling, standing. The line is cold.';
      const pa = lineOf({ who: 'p146', kind: 'pa', text: brief }, state), coach = lineOf({ who: 'p147', kind: 'speech', text: "I'm your coach. Wait for the tower." }, state);
      const mine = lineOf({ who: 'p145', kind: 'speech', text: 'Ready.' }, state);
      console.log(`      ${pa.head} "${pa.text}" ${fmt(pa.holdS, 2)} s; ${coach.head} "${coach.text}" ${fmt(coach.holdS, 2)} s; your own words: ${mine}`);
      assert(pa.head === '◉ TOWER · SSGT KOWALSKI' && coach.head === '◉ SGT ABARA · BESIDE YOU' && mine === null, JSON.stringify({ pa: pa.head, coach: coach.head }));
      assert(Math.abs(pa.holdS - (HOLD_S + WORD_S * 18)) < 1e-9 && Math.abs(holdS('MAKE READY.') - 4.16) < 1e-9, `${pa.holdS} ${holdS('MAKE READY.')}`);
      const q = createRadioQueue();
      q.push(pa); q.push(coach);
      q.frame(5, false); q.frame(5, false);                            // (time standing still: nothing goes)
      const held = q.lines.length;
      q.push(lineOf({ who: 'p146', kind: 'pa', text: 'Shooters, assume the prone position.' }, state));
      const three = q.lines.map(l => l.text.split(' ')[0]);
      for (let i = 0; i < 22; i++) q.frame(0.25, true);                // (5.5 s of play: the coach's 5.81 s holds, the 5.15 s command goes)
      console.log(`      held through 10 s of standing time: ${held}; a third line pushes the oldest out: ${three.join(', ')}; after 5.5 s of play: ${q.lines.map(l => `"${l.text.split(' ')[0]}" ${fmt(l.leftS, 2)} s left`).join(', ')}`);
      assert(held === 2 && three.join() === "I'm,Shooters," && q.lines.length === 1 && q.lines[0].text.startsWith("I'm"), JSON.stringify(q.lines));
    },
  },
  {
    name: 'the PAPER inset: the card at 4 px a cm (30 × 30 cm, 120 px), its rings at 1.25, 2.5, 5, 7.5 and 10 cm, each hole at (xCm, yCm), the newest numbered and ringed, the string\'s score at its cease fire, a miss \'-\'',
    fn() {
      const look = { lane: 4, mine: true, holes: [{ xCm: -1.6, yCm: 3.1, score: 4, v: false, n: 1 }, { xCm: 0.4, yCm: -0.3, score: 5, v: true, n: 2 }, { xCm: 6.0, yCm: 0, score: 3, v: false, n: 3 }] };
      const hot = paperModel(look, { hot: true }), cold = paperModel(look, { hot: false, last: { n: 1, score: 12, of: 15, v: 1, shots: [{ score: 4 }, { score: 5, v: true }, { score: 3 }] } });
      console.log(`      card ${hot.card.size} px at (${hot.card.x}, ${hot.card.y}); rings ${hot.rings.map(r => `${r.name} ${fmt(r.r, 0)} px`).join(', ')}; the black to ${fmt(hot.blackR, 0)} px`);
      console.log(`      holes: ${hot.holes.map(h => `${h.n} at (${fmt(h.x, 1)}, ${fmt(h.y, 1)})${h.newest ? ' newest' : ''}${h.onBlack ? ' in the black' : ''}`).join('; ')}; hot: ${hot.score}; cold: "${cold.score}"`);
      assert(hot.card.size === 30 * PAPER_K && RINGS.map(([n]) => ringR(n)).join() === '1.25,2.5,5,7.5,10', JSON.stringify(hot.card));
      const h1 = hot.holes[0];
      assert(Math.abs(h1.x - (hot.card.cx - 1.6 * PAPER_K)) < 1e-9 && Math.abs(h1.y - (hot.card.cy - 3.1 * PAPER_K)) < 1e-9, 'a hole at its centimetres, y up');
      assert(hot.holes.map(h => h.newest).join() === 'false,false,true' && hot.holes[1].onBlack && !hot.holes[2].onBlack, JSON.stringify(hot.holes));
      assert(hot.score === null && cold.score === 'STRING 1 · 4 V 3 · 12 OF 15 · 1 V' && hot.label === 'LANE 4 · 25 M', cold.score);
      // (one card for the course: a second string's holes numbered, the first's plain, read from n starting again at 1)
      const two = paperModel({ lane: 4, holes: [...look.holes, { xCm: 2, yCm: 2, score: 4, n: 1 }, { xCm: -3, yCm: -4, score: 3, n: 2 }] }, { hot: false, last: { n: 2, score: 7, of: 10, v: 0, shots: 2 } });
      // (the newest alone numbered, the order the footer's: the design review's, five numbers in the black a knot)
      const numbered = two.holes.filter(h => Number.isFinite(h.numX));
      console.log(`      a second string: ${numbered.length} numbered (${numbered.map(h => h.n).join(', ')}, the newest), ${two.holes.filter(h => h.old).length} plain from the first; "${two.score}"`);
      assert(numbered.length === 1 && numbered[0].newest && numbered[0].n === 2 && two.holes.filter(h => h.old).length === 3 && two.score === 'STRING 2 · 4 3 · 7 OF 10', JSON.stringify({ two: two.holes, score: two.score }));
      // (a miss in the string's list: '-', every shot in order (the runtime review's: the line left the misses out))
      const miss = paperModel(look, { hot: false, last: { n: 2, score: 13, of: 25, v: 1, shots: [{ score: 4, hit: true }, { score: 0, hit: false }, { score: 5, v: true, hit: true }, { score: 0, hit: false }, { score: 4, hit: true }] } });
      console.log(`      a string of five with two misses: "${miss.score}"`);
      assert(miss.score === 'STRING 2 · 4 - V - 4 · 13 OF 25 · 1 V', miss.score);
    },
  },
  {
    name: 'what you carry (I): the tiles by gear from kitView, a magazine\'s believed count ("5", "≈3", "?") and its reach; its icon fills its window as believed and shows only its plate when uncounted',
    fn() {
      const view = { groups: [{ id: 'worn', word: 'worn', items: [{ id: 'i2', kind: 'carrier', word: 'plate carrier', n: null, reachS: 0 }, { id: 'i9', kind: 'ears', word: 'ear defenders', n: null, reachS: 0 }] },
        { id: 'i3', word: 'magazine pouch', holds: 2, items: [{ id: 'i7', kind: 'mag', word: 'a HAD-30', n: 5, approx: false, reachS: 1.4 }, { id: 'i8', kind: 'mag', word: 'a HAD-30', n: 3, approx: true, reachS: 1.4 }] },
        { id: 'i5', word: 'dump pouch', holds: 4, items: [{ id: 'i6', kind: 'mag', word: 'a HAD-30', n: null, reachS: 0.9 }] }], sling: { gunId: 'i1', posture: 'slungFront', word: 'Your R-7' } };
      const t = tilesOf(view);
      console.log(`      ${t.sling.word}; ${t.groups.map(g => `${g.word} (${Math.round(g.fill * 100)}%): ${g.items.map(i => `${i.word}${i.count ? ` ${i.count}` : ''}${i.reach && i.reach !== '0.0 s' ? ` · ${i.reach}` : ''}`).join(', ')}`).join(' | ')}`);
      assert(t.sling.word === 'Your R-7, slung in front' && !t.empty, t.sling.word);
      assert(t.groups[1].items.map(i => i.count).join() === '5,≈3' && t.groups[2].items[0].count === '?' && t.groups[1].items[0].reach === '1.4 s' && t.groups[1].fill === 1 && t.groups[2].fill === 0.25, JSON.stringify(t.groups));
      const full = magIcon({ n: 5 }), three = magIcon({ n: 3, approx: true }), none = magIcon({ n: null });
      const lit = (b) => { let n = 0; for (let y = 2; y < 10; y++) if ([0xd9a83a, 0xb8643a].includes(colourAt(b, 3, y))) n++; return n; };
      console.log(`      the icon's window: 5 rounds ${lit(full)} rows, ≈3 ${lit(three)} rows, uncounted ${lit(none)} (its plate marked)`);
      assert(lit(full) === 4 && lit(three) === 2 && lit(none) === 0 && colourAt(none, 2, 11) === 0xf8e08a, JSON.stringify({ full: lit(full), three: lit(three) }));
      assert(tilesOf(null).empty && tilesOf({ groups: [], sling: null }).empty, 'nothing issued');
    },
  },
  {
    name: 'the weapon mode\'s rectangles (layout.js): STEPS 720 × 148 on INSTINCT with the card\'s 180 × 148, RADIO on STEPS, PAPER 200 × 200 under PAUSED\'s slot; apart in the weapon and weapon-paused states at 1024 × 768, 1280 × 600, 1600 × 900 and 1920 × 1080',
    fn() {
      for (const [w, h] of [[1024, 768], [1280, 600], [1600, 900], [1920, 1080]]) {
        const r = rectsAt(w, h, 'weapon'), clash = [...clashesAt(w, h, 'weapon'), ...clashesAt(w, h, 'weapon-paused'), ...clashesAt(w, h, 'walking')];
        const onSteps = Math.abs(r.RADIO.y + r.RADIO.h + 6 * r.ui - r.STEPS.y) < 1e-6, onInstinct = Math.abs(r.STEPS.y + r.STEPS.h + 6 * r.ui - r.INSTINCT.y) < 1e-6;
        console.log(`      ${w} × ${h} (--ui ${r.ui}): STEPS ${fmt(r.STEPS.w, 0)} × ${fmt(r.STEPS.h, 0)} at y ${fmt(r.STEPS.y, 0)}, RADIO at ${fmt(r.RADIO.y, 0)}, PAPER ${fmt(r.PAPER.w, 0)} px at y ${fmt(r.PAPER.y, 0)} to ${fmt(r.PAPER.y + r.PAPER.h, 0)}, ${fmt(r.RADIO.y - r.PAPER.y - r.PAPER.h, 0)} px over RADIO; meeting: ${clash.join(', ') || 'none'}`);
        assert(!clash.length && onSteps && onInstinct && r.STEPS.w === 720 * r.ui && r.PAPER.h === 200 * r.ui, JSON.stringify({ clash, onSteps, onInstinct }));
      }
      assert(CARD_W === 180 && CARD_H === 148 && STATES.weapon.includes('PAPER') && STATES['weapon-paused'].includes('PAUSED'), 'the card and the states');
      const walk = rectsAt(1280, 720);
      assert(Math.abs(walk.RADIO.y + walk.RADIO.h + 6 * walk.ui - walk.INSTINCT.y) < 1e-6, 'walking, RADIO stays on INSTINCT');
    },
  },
  {
    name: 'the rows at distance read as the panel\'s others: "Dial the coach\'s call: 4 up, 2 left · 1.6 s", "Dope for 300 m: 3 down · 0.4 s", the holds, "Read the flags · 1.5 s", "Four power · 0.5 s", "Sitting · 2.0 s"; no odds (no roll), their words on the hover; past ten, Fire and the commands stay on the first page',
    fn() {
      const rows = [
        { id: 'fire', kind: 'fire', label: 'Fire at your target', ms: 400, off: null, odds: 0.72, skill: 'marksmanship' },
        { id: 'hold', kind: 'hold', label: 'Hold the aim', ms: 1300, skill: 'marksmanship' },
        { id: 'macro:unload', kind: 'command', label: 'UNLOAD', ms: 3200, routine: true, skill: 'weapons' },
        { id: 'sight:call', kind: 'single', label: 'Dial the coach\'s call: 4 up, 2 left', ms: 1600, skill: null, odds: null, words: 'the coach\'s clicks from his read of your marks' },
        { id: 'sight:dope:300', kind: 'single', label: 'Dope for 300 m: 3 down', ms: 400, skill: null, odds: null, words: 'the turrets to your card\'s dope for 300 m' },
        { id: 'hold:read', kind: 'single', label: 'Hold for your read: 0.5 mil right', ms: 300, skill: null, odds: null, words: 'your read of the flags: 2.6 m/s from the left' },
        { id: 'hold:call', kind: 'single', label: 'Hold for the coach: 0.75 mil right', ms: 300, skill: null, odds: null, words: 'the coach\'s call: 3.5 m/s from the left' },
        { id: 'hold:centre', kind: 'single', label: 'Hold centre', ms: 300, skill: null, odds: null },
        { id: 'read', kind: 'single', label: 'Read the flags', ms: 1500, skill: null, odds: null, words: 'the flags along the range, ten seconds of them' },
        { id: 'optic:4', kind: 'single', label: 'Four power', ms: 500, skill: null, odds: null },
        { id: 'stance:sit', kind: 'stance', label: 'Sitting', ms: 2000, skill: null, odds: null },
        { id: 'wait', kind: 'wait', label: 'Wait for the tower', ms: null },
      ];
      const p0 = panelOf(rows), p1 = panelOf(rows, { page: 1 });
      const lines = p0.slots.map(s => rowText(s)), lines1 = p1.slots.map(s => rowText(s));
      console.log(`      page 1: ${lines.join(' | ')}`);
      console.log(`      page 2: ${lines1.join(' | ')}`);
      assert(p0.pages === 2 && ['1', '2', '3'].every((k, i) => p0.slots[i].key === k && p1.slots[i].step.id === rows[i].id), 'Fire, Hold and UNLOAD on 1, 2, 3 on every page');
      const all = [...p0.slots, ...p1.slots.slice(3)].map(s => rowText(s));
      for (const want of ['Dial the coach\'s call: 4 up, 2 left · 1.6 s', 'Dope for 300 m: 3 down · 0.4 s', 'Hold for your read: 0.5 mil right · 0.3 s', 'Hold for the coach: 0.75 mil right · 0.3 s', 'Read the flags · 1.5 s', 'Four power · 0.5 s', 'Sitting · 2.0 s'])
        assert(all.some(l => l.endsWith(want) && !/%|routine/.test(l)), `"${want}" in ${JSON.stringify(all)}`);
      const t = rowTitle(rows[5]);
      console.log(`      the hover of "${rows[5].label}": ${t}`);
      assert(t.includes('your read of the flags') && !/rolls/.test(t), t);
    },
  },
];
