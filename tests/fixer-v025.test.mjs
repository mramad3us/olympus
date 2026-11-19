// OLYMPUS tests: v0.0.25's fixer, the play review and the code review of the integrated round (.run/v025/fix.md). Each case
// fails without its fix (checked by undoing it): Strap in lost when a move key gets you up before the straps are on, never a body
// strapped standing at the rack's foot; a marine torn off his boots by the 3 G jink pitches as he is thrown, and his boots will
// not lock again while the push across the deck is over their limit; one boots rule for the 1MC, the G line's meter and the sim; a
// speaker's two lines of one tick shown one after the other, in the bubble and in the radio box; the bubble's brackets and quote;
// the nearest free place for a bubble and a line heard at a place reaching higher; the radio box's words on the Wreck (no tower; a
// line at a place as far as the place); the Wreck's words on the end card (the legs, the run sheet's compartments) and its hatches;
// no kneel floating; the gallery's newest sets first; the instinct's line settled for T on a game loaded at a pause; "Feet aft"
// unlit while a step acts; the one deck test; the burn's summary saying how you were first secured; the anchors' distances.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { assert, root } from './helpers.mjs';
import { createGame } from './game.mjs';
import { burnBot, burnBootsBot, anchorsBot } from './bots/void.mjs';
import { houseTBot, houseHonestBot } from './bots/house.mjs';
import { burnNow, BERTH_SEAT } from '../src/sim/scenarios/burn.js';
import { warnWords, bootsHold } from '../src/data/onemc.js';
import { GRAV_BODY, SURPRISE_G } from '../src/data/body/needs.js';
import { setProfile, gLineOf } from '../src/sim/places/gravity.js';
import { setAnchor, bootsLockWhy, BOOTS_SHEAR_WHY } from '../src/sim/body/footing.js';
import { speakerMarks, placeBubbles, balloonPixels, markPlace, BUBBLE_ABOVE_PX, BUBBLE_AT_REACH_PX, CALL_BALLOON_MS } from '../src/ui/plaque.js';
import { lineOf, createRadioQueue } from '../src/ui/hud/radio.js';
import { hatchWords, shipWords } from '../src/ui/ship-words.js';
import { debriefOf } from '../src/sim/scenarios/house-debrief.js';
import { runSheetOf } from '../src/sim/scenarios/shoothouse.js';
import { truthRows } from '../src/ui/cards/house.js';
import { WRECK_LEGS, VOID_CADRE } from '../src/data/courses.js';
import { wreckDeckAt as deckOfData } from '../src/data/places/wreck.js';
import { wreckDeckAt as deckOfAssemble } from '../src/sim/scenes/assemble.js';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { isHeld } from '../src/core/clock.js';
import { toScore } from '../samples/to-score.js';
import { spokenMs } from '../src/core/speech.js';

const meOf = (s) => s.actors.list.find(a => a.id === s.player.actor);
const H_ = (s) => s.armoury?.range?.house;

export default [
  {
    name: 'fixer-v025: a move key held during Strap in, once the lie-down has played, gets you up and loses the act: never strapped standing at the rack\'s foot (the code review; the user\'s "we just linger next to the bunk")',
    fn() {
      const g = createGame({ scenario: 'test-burn', seed: 48213 }), s = g.state, bot = burnBot();
      for (let n = 0; n < 20 * 120 && burnNow(s).doing?.what !== 'strap'; n++) g.step(1, bot);
      assert(burnNow(s).doing?.what === 'strap', 'no strap act');
      g.step(60, { mx: 1, mz: 0 });
      const me = meOf(s), B = burnNow(s);
      console.log(`      after 60 ticks of a move key: ${me.posture ?? 'stand'} at (${me.x}, ${me.z}), strapped ${me.strapped ?? 'no'}, the act ${B.doing?.what ?? 'none'}; R offers ${B.offer?.id ?? B.offer?.label}`);
      assert(!(me.strapped && (me.posture ?? 'stand') === 'stand'), `strapped standing: ${JSON.stringify({ posture: me.posture, strapped: me.strapped })}`);
      assert(!me.strapped || (me.posture === 'lie' && me.spotId === BERTH_SEAT), JSON.stringify({ posture: me.posture, spot: me.spotId, strapped: me.strapped }));
    },
  },
  {
    name: 'fixer-v025: the booted marine torn off by the warned 3 G jink pitches as he is thrown (GRAV_BODY.TORN_SPIN_RADS), meets the compartment\'s side tilted, and his boots will not lock while the push across the deck is over their limit (the play review: "barely visibly moves")',
    fn() {
      const bad = [];
      for (const seed of [3156898961, 48213, 7]) {
        const g = createGame({ scenario: 'test-burn', seed }), s = g.state, bot = burnBootsBot();
        let maxRad = 0, lockedUnder = 0, refused = null;
        for (let n = 0; n < 20 * 140 && !burnNow(s).end; n++) {
          g.step(1, bot);
          const me = meOf(s), lat = s.places.live.env.profile?.lat ?? 0;
          if (burnNow(s).evade?.atMs && Number.isFinite(me.tumbleRad)) maxRad = Math.max(maxRad, Math.abs(me.tumbleRad));
          if (lat > GRAV_BODY.BOOTS_SHEAR_G) { if (me.anchor === 'boots') lockedUnder++; refused ??= bootsLockWhy(s, s.player.id); }
        }
        const ev = burnNow(s).evade;
        console.log(`      ${seed}: torn ${ev?.torn}, thrown at ${ev?.vMs} m/s, pitched to ${maxRad.toFixed(2)} rad; ticks booted under the push ${lockedUnder}; a lock then: "${refused}"`);
        if (!ev?.torn || !(maxRad >= Math.PI / 8)) bad.push(`${seed}: pitched ${maxRad}`);
        if (lockedUnder) bad.push(`${seed}: booted ${lockedUnder} ticks under the push`);
        if (refused !== BOOTS_SHEAR_WHY) bad.push(`${seed}: lock ${refused}`);
      }
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'fixer-v025: one boots rule (onemc.js bootsHold) for the 1MC, the G line and the sim: a 0.8 G surprise jink is not held (the sim puts a booted man down), a 2 G burn from 1 G is a change of 1 G and held (the code review)',
    fn() {
      assert(bootsHold(true, 0.8, { surprise: true }) === false && bootsHold(true, 0.4, { surprise: true }) === true && bootsHold(true, 3) === false && bootsHold(false, 1.0) === true && bootsHold(false, -1) === true, 'the rule');
      const w2 = warnWords('burn', 15, { toG: 2, fromG: 1 }), w0 = warnWords('burn', 15, { toG: 2 });
      console.log(`      "${w2}" / from 0 G: "${w0}"`);
      assert(!/boots will not hold/.test(w2) && /boots will not hold/.test(w0), JSON.stringify({ w2, w0 }));
      // (the sim: a booted marine at 0 G, a surprise jink of 0.8 G: down, as the meter says)
      const g = createGame({ scenario: 'test-burn', seed: 48213 }), s = g.state, pid = s.player.id;
      g.step(5);
      setAnchor(s, pid, 'boots');
      setProfile(s, [{ kind: 'jink', toG: 0.8, dirDeg: 90, atS: 2, warnS: 0, surprise: true }]);
      let line = null;
      for (let n = 0; n < 20 * 6; n++) { g.step(1); const f = gLineOf(s); if (f?.phase === 'onset' || f?.phase === 'hold') line ??= f; }
      const log = (s.places.live.env.profile?.log ?? []).filter(x => x.who === pid).map(x => x.what);
      console.log(`      0.8 G surprise on boots: the sim ${log.join(', ')}; the G line's holds ${line?.holds}`);
      assert(log.includes('down') && line?.holds === false, JSON.stringify({ log, holds: line?.holds }));
      assert(SURPRISE_G < 0.8 && GRAV_BODY.BOOTS_SHEAR_G > 0.8, 'the case sits between the two limits');
    },
  },
  {
    name: 'fixer-v025: a speaker\'s two lines said on one tick are both shown, the second from the end of the first, in the bubble and, after a long one (over CHAIN_WORDS), in the radio box; a line said later still takes over (the play review: the brief\'s first line never shown)',
    fn() {
      const a = 'This is the Wreck: deck five, the trunk, deck six, in free fall. You and your number two on your boots.', b = 'Standby.';
      const says = [{ who: 'c', text: a, atMs: 1000, spokenMs: spokenMs(a) }, { who: 'c', text: b, atMs: 1000, spokenMs: spokenMs(b) }];
      const dA = Math.max(CALL_BALLOON_MS, spokenMs(a));
      const at0 = speakerMarks(says, 1000)[0], at1 = speakerMarks(says, 1000 + dA + 50)[0];
      const later = speakerMarks([...says, { who: 'c', text: 'Go.', atMs: 1500, spokenMs: spokenMs('Go.') }], 1600)[0];
      console.log(`      at the tick: "${at0?.text.split('\n')[0]}"; after ${dA} ms: "${at1?.text}"; a line at +500 ms: "${later?.text}"`);
      assert(at0 && /WRECK|Wreck/.test(at0.text) && at1?.text === b && later?.text === 'Go.', JSON.stringify({ at0, at1, later }));
      const q = createRadioQueue(), l1 = { head: '◉ SSGT BARROS', text: a, kind: 'speech', who: 'c', atMs: 5, holdS: 4 }, l2 = { ...l1, text: b, holdS: 3.8 };
      q.push(l1); q.push(l2);
      const first = q.lines.map(l => l.text);
      for (let i = 0; i < 42; i++) q.frame(0.1);
      const then = q.lines.map(l => l.text);
      console.log(`      the radio box: ${JSON.stringify(first)} then ${JSON.stringify(then)}`);
      assert(first.length === 1 && first[0] === a && then.length === 1 && then[0] === b, JSON.stringify({ first, then }));
    },
  },
  {
    name: 'fixer-v025: the bubble draws "(", ")" and the double quote (the play review: "Walk to it (D)," read "WALK TO IT  D ."), each as wide as the blank',
    fn() {
      // (the pixels that differ from the same balloon with blanks in their places: the marks drawn, seven a bracket)
      const diff = (t, u) => { const a = balloonPixels(t), b = balloonPixels(u); let n = 0; for (let i = 0; i < a.data.length; i++) if (a.data[i] !== b.data[i]) n++; return { n, w: a.w, wb: b.w }; };
      const br = diff('(D)', ' D '), qu = diff('"D"', ' D ');
      console.log(`      "(D)" against " D ": ${br.n} bytes differ (${br.w} px wide against ${br.wb}); "\\"D\\"": ${qu.n}`);
      assert(br.n >= 12 && br.w === br.wb && qu.n >= 4, JSON.stringify({ br, qu }));
    },
  },
  {
    name: 'fixer-v025: a bubble takes the nearest free place, a row higher over its speaker before a whole width aside; a line heard at a place (its `at`) reaches BUBBLE_AT_REACH_PX up where the boards round a scuttle leave none in BUBBLE_ABOVE_PX (the play review: bubbles in the margin; "Got you." and "Through." in the radio box alone)',
    fn() {
      const head = { x: 200, y: 200, w: 10, h: 6 }, size = { w: 60, h: 13 };
      // (a box over the first rows straight above, free a width aside: the nearest is a few rows up, straight over him)
      const near = markPlace(head, size, [{ x: 170, y: 180, w: 70, h: 7 }], { reach: BUBBLE_ABOVE_PX });
      console.log(`      over him: ${JSON.stringify(near)} (straight above at x ${200 + 5 - 30})`);
      assert(near && near.x === 175, JSON.stringify(near));
      // (boards over every row within BUBBLE_ABOVE_PX, five offsets wide: a place's line goes higher, clear of them; a body's line was
      // left to the radio box here until v0.0.26's K6, which tries it once more over the figures and boards (never the HUD or another
      // bubble): re-read at v0.0.26's integration, both fixes kept, the user's "every line a text bubble at its speaker" of 2026-11-19)
      const boards = [{ x: 0, y: 150, w: 400, h: 50 }];
      const marks = [{ who: 'two', text: 'Got you.', fromMs: 0, k: 1, at: { x: 0, y: 2.2, z: 0 } }, { who: 'man', text: 'Clear!', fromMs: 0, k: 1 }];
      const r = placeBubbles(marks, { headOf: () => head, boxes: boards, bounds: { x: 0, y: 0, w: 640, h: 360 } });
      console.log(`      placed ${r.placed.map(p => `${p.m.who} at y ${p.at.y}${p.over ? ' (over the boards)' : ''}`).join(', ')}; left ${r.unplaced.map(m => m.who).join(', ')}`);
      const two = r.placed.find(p => p.m.who === 'two'), man = r.placed.find(p => p.m.who === 'man');
      assert(r.placed.length === 2 && two && !two.over && two.at.y + 13 <= 150 && man?.over && man.at.y + 15 <= head.y && man.at.y + 15 >= head.y - BUBBLE_ABOVE_PX - 1 && BUBBLE_AT_REACH_PX > BUBBLE_ABOVE_PX, JSON.stringify(r));
    },
  },
  {
    name: 'fixer-v025: the radio box on the Wreck: the cadre\'s commands never "TOWER", a line heard at a place as far as the place, not its speaker in the plan (the play review: "TOWER · SSGT BARROS", "LCPL ROSSI · 59 M Got you.")',
    fn() {
      const g = createGame({ scenario: 'test-zerocqb', seed: 48213, tier: 'sgt', setup: 'trunk' }), s = g.state, H = H_(s), me = meOf(s);
      const cmd = lineOf({ who: H.chiefPid, text: 'Load.', kind: 'pa' }, s);
      const two = s.actors.list.find(a => a.who === H.twoPid);
      const far = { x: two.x + 58, y: 2.2, z: two.z };
      const atMe = lineOf({ who: H.twoPid, text: 'Got you.', kind: 'speech', at: { x: me.x, y: 2.2, z: me.z } }, s);
      two.x += 58;
      const atFar = lineOf({ who: H.twoPid, text: 'Got you.', kind: 'speech', at: { x: me.x + 0.5, y: 2.2, z: me.z } }, s);
      two.x -= 58;
      const house = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go' }).state;
      const tower = lineOf({ who: house.armoury.range.house.chiefPid, text: 'Load.', kind: 'pa' }, house);
      console.log(`      the Wreck's command "${cmd?.head}"; the #2's line at the scuttle "${atFar?.head}" (${atMe?.head}); the house's "${tower?.head}"; far ${JSON.stringify(far).length > 0}`);
      assert(!/TOWER/.test(cmd?.head ?? 'TOWER') && /BESIDE YOU/.test(atFar?.head ?? '') && /TOWER/.test(tower?.head ?? ''), JSON.stringify({ cmd, atFar, tower }));
    },
  },
  {
    name: 'fixer-v025: the Wreck\'s end card in its own words: the plan\'s legs CELL 2 to THE STORE, the truth cards\' legs, "clean compartments"; on a ship a door\'s words are a hatch\'s in the page (the play review: "ROOM 1 … THE HALL", "4 clean rooms", "AT THE DOOR", "Kick door")',
    timeoutMs: 120_000,
    fn() {
      const g = createGame({ scenario: 'test-zerocqb', seed: 48213, tier: 'sgt', setup: 'go' }), s = g.state, bot = houseTBot(), mem = {};
      for (let n = 0; n < 6000 && !s.armoury.range.end; n++) g.step(1, (st, m) => bot(st, m, mem));
      const d = debriefOf(s), rs = runSheetOf(s), tr = truthRows(s);
      const legs = d.legs.map(L => L.word), truth = tr.map(r => r.legWord ?? null);
      console.log(`      plan legs ${legs.join(' / ')}; truth ${[...new Set(truth)].join(', ')}; "${rs.practised.words}"`);
      assert(JSON.stringify(legs) === JSON.stringify(WRECK_LEGS.map(L => L.word)), JSON.stringify(legs));
      assert(tr.length && tr.every(r => WRECK_LEGS.some(L => L.word === r.legWord)), JSON.stringify(truth));
      assert(/clean compartment/.test(rs.practised.words) && !/room/.test(rs.practised.words), rs.practised.words);
      const words = ['AT THE DOOR', 'Kick door', 'Read the door, then tell your two.', "Don't stop in the door!", 'Push door, hinge right.', 'Doorway. Move.', 'DOORS'];
      const said = words.map(hatchWords);
      console.log(`      ${said.join(' | ')}`);
      assert(JSON.stringify(said) === JSON.stringify(['AT THE HATCH', 'Kick hatch', 'Read the hatch, then tell your two.', "Don't stop in the hatch!", 'Push hatch, hinge right.', 'Hatchway. Move.', 'HATCHES']), JSON.stringify(said));
      const house = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go' }).state;
      assert(shipWords('Kick door', s) === 'Kick hatch' && shipWords('Kick door', house) === 'Kick door', 'the house keeps its doors');
    },
  },
  {
    name: 'fixer-v025: no kneel, prone or sit offered floating clipped in or on a hold (the play review: "Kneel" offered clipped in, floating); standing on the deck they stay',
    fn() {
      // (the course by its keys bot to the first stance rows offered on boots, then off them: clipped in, floating)
      const g = createGame({ scenario: 'test-anchors', seed: 48213 }), s = g.state, pid = s.player.id, bot = anchorsBot();
      const rows = () => stepsOf(s).filter(x => x.kind === 'stance' && x.id !== 'stance:stand');
      for (let n = 0; n < 20 * 300 && !rows().length; n++) g.step(1, bot);
      const deck = rows().map(x => `${x.id}${x.off ? ' off' : ''}`);
      const me = meOf(s);
      setAnchor(s, pid, null); me.floatY = 1.0;
      const floating = rows().map(x => `${x.id}${x.off ? ` off (${x.off})` : ''}`);
      console.log(`      on boots on the deck: ${deck.join(', ') || 'none'}; floating: ${floating.join(', ') || 'none'}`);
      assert(deck.length && deck.every(t => !/ off/.test(t)), JSON.stringify(deck));
      assert(floating.length && rows().every(x => x.off), JSON.stringify(floating));
    },
  },
  {
    name: 'fixer-v025: the gallery\'s waiting sets lead with the newest round\'s, as the game\'s To score page does (the play review: wreck-faces and portrait-faces last of 17)',
    fn() {
      const index = JSON.parse(readFileSync(path.join(root, 'samples/index.json'), 'utf8')), rows = toScore(index);
      const newest = rows[0]?.builtIn;
      console.log(`      ${rows.length} waiting; first ${rows.slice(0, 3).map(r => `${r.id} (${r.builtIn})`).join(', ')}`);
      assert(rows.slice(0, rows.filter(r => r.builtIn === newest).length).every(r => r.builtIn === newest) && rows.every((r, i) => !i || String(rows[i - 1].builtIn) >= String(r.builtIn)), JSON.stringify(rows.map(r => r.builtIn)));
    },
  },
  {
    name: 'fixer-v025: T on the first tick of a game loaded at a pause does what it did in the game that saved: the instinct\'s line settled from what fires (the code review: a save at a pause parted on T)',
    timeoutMs: 120_000,
    fn() {
      const opts = { scenario: 'test-zerocqb', seed: 48213, tier: 'sgt', setup: 'go' }, g = createGame(opts), s = g.state, bot = houseTBot(), mem = {};
      let tried = 0, apart = 0, n = 0;
      const rows = [];
      while (n++ < 4000 && tried < 3 && !s.armoury.range.end) {
        const line = instinctNow(s).line;
        if (isHeld(s, 'stop') && line?.act && !s.skip) {
          const json = g.save(), g2 = createGame(opts);
          g2.load(json);
          g.step(1, { act: ['instinct'] }); g2.step(1, { act: ['instinct'] });
          const same = g.digest() === g2.digest();
          rows.push(`${line.id}${same ? '' : ' APART'}`);
          tried++; if (!same) apart++;
          for (let i = 0; i < 40; i++) { g.step(1, (st, m) => bot(st, m, mem)); }
          continue;
        }
        g.step(1, (st, m) => bot(st, m, mem));
      }
      console.log(`      T at ${tried} pauses after a load: ${rows.join(', ')}`);
      assert(tried >= 1 && !apart, rows.join(', '));
    },
  },
  {
    name: 'fixer-v025: "Feet aft." is no T act while a step of yours acts in stop motion (the hold\'s clearing): T is lit only when it can act (the play review: 81 presses on a lit line that did nothing)',
    timeoutMs: 120_000,
    fn() {
      const g = createGame({ scenario: 'test-zerocqb', seed: 48213, tier: 'sgt', setup: 'go' }), s = g.state, bot = houseTBot(), mem = {};
      let lit = 0, idle = 0, seen = 0;
      for (let n = 0; n < 6000 && !s.armoury.range.end; n++) {
        const L = instinctNow(s).line;
        if (L?.id === 'aft') { seen++; const S = s.stop, acting = S?.mode === 'stop' && S.phase === 'act' && S.doing && S.doing.kind !== 'wait'; if (L.act && acting) lit++; }
        g.step(1, (st, m) => bot(st, m, mem));
        if (L?.id === 'aft' && L.act) idle++;
      }
      console.log(`      "Feet aft." shown ${seen} ticks; with T's act while a step acted ${lit}`);
      assert(seen > 0 && lit <= 1, JSON.stringify({ seen, lit, idle }));
    },
  },
  {
    name: 'fixer-v025: one deck test (data/places/wreck.js wreckDeckAt, assemble.js re-exporting it): no 30 m stand-in left in two.js or bundle.js (the code review)',
    fn() {
      const two = readFileSync(path.join(root, 'src/sim/combat/two.js'), 'utf8'), bundle = readFileSync(path.join(root, 'src/sim/combat/bundle.js'), 'utf8');
      const xs = [0, 4.6, 9.2, 25, 35, 60, 64.6, 69.2];
      assert(deckOfData === deckOfAssemble && xs.every(x => deckOfData(x) === (x < 30 ? 5 : 6)), xs.map(deckOfData).join(','));
      assert(!/ONE_DECK_M|SHIP_DECK_M/.test(two + bundle) && /wreckDeckAt/.test(two) && /wreckDeckAt/.test(bundle), 'the stand-ins');
    },
  },
  {
    name: 'fixer-v025: the burn\'s summary says how you were first secured when it is not how you rode the burn (the play review: "Secured in 0.0 s (strapped in your rack at the burn)" for a marine booted at the warning)',
    fn() {
      const g = createGame({ scenario: 'test-burn', seed: 3156898961 }), s = g.state, boots = burnBootsBot(), strap = burnBot();
      // (booted at the warning by the boots' bot, then strapped by the strap bot before the burn)
      for (let n = 0; n < 20 * 140 && !burnNow(s).end; n++) {
        const B = burnNow(s);
        g.step(1, B.secured && B.secured.how === 'boots' && !B.onset ? strap : boots);
      }
      const B = burnNow(s), sum = B.summary ?? '';
      console.log(`      ${sum.split(' · ')[0]}`);
      assert(B.secured?.how !== 'strapped' || /on your mag boots; strapped in your rack/.test(sum) || !/0\.0 s/.test(sum), sum);
    },
  },
  {
    name: 'fixer-v025: Well A\'s commands give each station\'s distance as the target\'s, never read as the ring\'s (the play review: "Ten metres" read as the distance to the ring)',
    fn() {
      const lines = Object.values(VOID_CADRE.cmd).flat().filter(t => /metres/.test(t));
      console.log(`      ${lines.map(t => t.slice(t.lastIndexOf('.', t.length - 2) + 2)).join(' | ')}`);
      assert(lines.length >= 8 && lines.every(t => /target at \w+ metres\.$/.test(t)), JSON.stringify(lines));
    },
  },
];
