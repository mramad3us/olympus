// OLYMPUS tests: v0.0.21's fixer, the play and code reviews of the integrated tree, each case failing without its fix.
//
// The play review drove every sheet to the card in node and in the page, on the set and on drawn houses; the code review read the
// integrated tree against v0.0.20. Each case below pins one of their findings and prints what it measures.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { assert, root } from './helpers.mjs';
import { createGame } from './game.mjs';
import { cqbWorld } from './cqb-world.mjs';
import { drawHouse, areaIdOf, registerHouse, assembleHouse, heldLayouts, houseCodeOf, parseHouse, houseUrlNote, resetCaches as resetHouses, HOUSE_REG_KEEP } from '../src/sim/scenes/assemble.js';
import { readParams } from '../src/core/debug.js';
import { areaOf } from '../src/sim/places/model.js';
import { mineUp } from '../src/sim/combat/bundle.js';
import { splitPages, pageAt, pageText, holdS } from '../src/ui/hud/radio.js';
import { laneModel } from '../src/ui/hud/timer.js';
import { houseNow, roomParOf, parOf, houseVerdict, TURN_FREE_DEG } from '../src/sim/scenarios/shoothouse.js';
import { entryOptions } from '../src/sim/combat/breach.js';
import { breachOf, lockKnownOf } from '../src/sim/combat/bundle.js';
import { lanePlanOf } from '../src/sim/combat/room.js';
import { houseHonestBot, houseFuzzBot, runHouse } from './bots/house.mjs';
import { seqOf } from '../src/sim/scenarios/handling.js';
import { stepsOf } from '../src/sim/arms/shooting.js';

const inRect = (r, x, z) => x >= r[0] - 1e-9 && x <= r[2] + 1e-9 && z >= r[1] - 1e-9 && z <= r[3] + 1e-9;

export default [
  {
    name: 'a drawn house\'s area id names its layout one to one (the code review of 2026-11-16: seeds 3609 and 20029 drew two layouts under one 7-digit hash, and the second game of the session was played on the first\'s rooms, its stand 1b in no room)',
    fn() {
      resetHouses();
      const a = drawHouse(3609), b = drawHouse(20029);
      const g1 = createGame({ scenario: 'test-shoothouse', seed: 3609, tier: 'private', draw: 'drawn' });
      const g2 = createGame({ scenario: 'test-shoothouse', seed: 20029, tier: 'private', draw: 'drawn' });
      const s = g2.state, code = houseCodeOf(s), A = areaOf(s.places.live.area);
      // (each room's stands inside that room's own rect, the rooms read from the area the game plays)
      // (a room's rects: its own and its parts', 'r3' and 'r3-far' of an ell)
      const rectsOf = (room) => A.rooms.filter(r => r.id === room || r.id.startsWith(`${room}-`)).map(r => r.rect);
      const out = s.armoury.range.turners.filter(T => /^[123]/.test(T.stand)).filter(T => !rectsOf(T.room).some(r => inRect(r, T.x, T.z))).map(T => `${T.stand} (${T.x}, ${T.z}) not in ${T.room}`);
      const ids = [areaIdOf(a), areaIdOf(b)], laid = A.gen?.layout;
      // (and over the draws of seeds 1 to 3,000: one id a layout, one layout an id)
      const byId = new Map(); let clash = 0;
      for (let seed = 1; seed <= 3000; seed++) { const L = drawHouse(seed), id = areaIdOf(L); if (byId.has(id) && byId.get(id) !== L) clash++; byId.set(id, L); }
      console.log(`      ${a} and ${b}: ids ${ids.join(', ')}; the second game's code ${code}, its area's layout ${laid}; stands outside their room ${out.length}${out.length ? `: ${out.join('; ')}` : ''}; 3,000 draws, ${byId.size} ids, ${clash} shared`);
      assert(a !== b && ids[0] !== ids[1] && laid === parseHouse(code).layout && !out.length && !clash && g1.state.places.live.area !== s.places.live.area, JSON.stringify({ ids, laid, code, out, clash }));
    },
  },
  {
    name: 'the assembled layouts are kept by last use: the lane read again is never the one evicted (the code review of 2026-11-16: the order was the order assembled, a read never refreshed it)',
    fn() {
      resetHouses();
      const codes = ['Cn290pc.Ks206lc.En175pc', 'Es280pc.Cn250pc.Kn160pc', 'Kn240lc.Es195pc.Cn160lc'], ids = codes.map(areaIdOf);
      registerHouse(codes[0]); registerHouse(codes[1]);
      // (the first read again, as the lane reads its seam every tick, then a third assembled: the second goes, the first stays)
      assembleHouse(codes[0]);
      registerHouse(codes[2]);
      const held = heldLayouts();
      console.log(`      HOUSE_REG_KEEP ${HOUSE_REG_KEEP}; held after the read and the third: ${held.map(id => codes[ids.indexOf(id)]).join(', ')}`);
      assert(held.length === HOUSE_REG_KEEP && held.includes(ids[0]) && held.includes(ids[2]) && !held.includes(ids[1]), JSON.stringify({ held, ids }));
    },
  },
  {
    name: 'off the range, a man of your corner up and known is "a man still up" (the code review of 2026-11-16: mineUp, upIn, rebracket and lineTargetOf read the range\'s turners only, so the drill called "Clear!" with a threat standing)',
    fn() {
      const w = cqbWorld({ two: false });
      // (turned 3 s ago: the fixture stands in stop motion at GO, time held)
      const T = w.T('1a'), s = w.s, ms = s.clock.ms;
      w.turn('1a', ms - 3000);
      s.mind.contact = { ...(s.mind.contact ?? {}), known: { ...(s.mind.contact?.known ?? {}), [T.key]: ms }, last: { ...(s.mind.contact?.last ?? {}), ids: [T.key] } };
      const up = mineUp(s, ms).map(t => t.stand);
      console.log(`      off the range (state.armoury.range ${s.armoury.range === undefined ? 'absent' : 'present'}), 1a turned and taken in: mineUp ${JSON.stringify(up)}`);
      assert(s.armoury.range === undefined && up.includes('1a'), JSON.stringify({ up }));
    },
  },
  {
    name: 'the &house= note says what the scene plays (the code review of 2026-11-16: "Its rooms as given" on &draw=set and on the live lane, both of which play the set; a malformed code dropped with no word)',
    fn() {
      const unfair = 'Cn290pc.Ks206lc.En175pc|ftttttt|p000000', fair = 'Kn240lc.Es195pc.Cn160lc';
      const g = createGame({ scenario: 'test-shoothouse', seed: 7, tier: 'private', draw: 'drawn', house: unfair }), drawnPlayed = houseCodeOf(g.state);
      const cases = {
        'unfair, drawn': houseUrlNote(unfair, drawnPlayed, 7),
        'unfair, &draw=set': houseUrlNote(unfair, 'A', 7),
        'unfair, the live lane': houseUrlNote(unfair, 'A', 7),
        'a scene with no house': houseUrlNote(fair, null, 7),
        'fair, played': houseUrlNote(fair, fair, 7),
        'malformed': houseUrlNote(readParams('?play=test-shoothouse&house=Zz999').houseAsked, 'A', 7),
      };
      const dropped = readParams('?play=test-shoothouse&house=Zz999').house;
      for (const [k, v] of Object.entries(cases)) console.log(`      ${k}: ${v === null ? 'no note' : JSON.stringify(v)}`);
      assert(/Its rooms as given/.test(cases['unfair, drawn'] ?? '') && /not played here: the house as set/.test(cases['unfair, &draw=set'] ?? '') && /not played here: no shoot house/.test(cases['a scene with no house'] ?? '')
        && cases['fair, played'] === null && /^No house 'Zz999'/.test(cases.malformed ?? '') && dropped === null, JSON.stringify({ cases, dropped }));
    },
  },
  {
    name: 'leaving a scene lets go of every read keyed by the clock (the code review of 2026-11-16: the strip, AVPU, the plaque and the hit marks kept, keyed by seed, ms and seq, which "Again" on the same seed repeats)',
    fn() {
      const src = readFileSync(path.join(root, 'src/main.js'), 'utf8');
      const memos = [...src.matchAll(/^(?:let|const) (\w*(?:Memo|Read)) = /gm), ...src.matchAll(/^let [^\n]*?\b(\w+Memo) = /gm)].map(m => m[1]);
      const body = /function leaveScene\([^)]*\) \{([\s\S]*?)\n\}/.exec(src)?.[1] ?? '';
      const kept = [...new Set(memos)].filter(n => !new RegExp(`\\b${n}\\b`).test(body));
      console.log(`      main.js's memos: ${[...new Set(memos)].join(', ')}; not let go of by leaveScene: ${kept.length ? kept.join(', ') : 'none'}`);
      assert(memos.length >= 10 && !kept.length, JSON.stringify({ memos, kept }));
    },
  },
  {
    name: 'a drawn house\'s brief reaches the player whole: the radio pages a line longer than its two rows, never cuts it (the play review of 2026-11-16: the doors and the kit lost behind "Your doors:…", 534 × 125 px of text in 534 × 31)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 36, tier: 'sgt', draw: 'drawn', loadout: 'mixed' });
      let text = null;
      for (let i = 0; i < 400 && !text; i++) { g.step(1); const t = g.state.armoury.range.house.said?.text ?? ''; if (/doors:/.test(t)) text = t; }
      // (two rows of the box at 1280 × 720: about 70 characters a row of the radio's type, my measure of the review's shot)
      const fits = (t) => t.length <= 140, pages = splitPages(text, fits), hold = holdS(text);
      const words = (t) => t.replace(/…/g, ' ').split(/\s+/).filter(Boolean);
      const whole = words(pages.join(' ')).join(' ') === words(text).join(' '), allFit = pages.every((p, i) => fits(pageText(pages, i)));
      const shown = [0, 0.25, 0.5, 0.75, 0.999].map(f => pageAt(pages, f * hold, hold));
      console.log(`      the brief, ${text.length} characters, ${words(text).length} words, held ${hold.toFixed(1)} s: ${pages.length} pages (${pages.map(p => p.length).join(', ')} characters), each fitting ${allFit}, the words whole ${whole}; the page shown at 0, 25, 50, 75 and 100% of its hold: ${shown.join(', ')}`);
      console.log(`      ${pages.map((p, i) => JSON.stringify(pageText(pages, i))).join('\n      ')}`);
      const rising = shown.every((p, i) => !i || p >= shown[i - 1]);
      assert(text && pages.length > 1 && whole && allFit && shown[0] === 0 && shown.at(-1) === pages.length - 1 && rising && splitPages('Short.', fits).length === 1, JSON.stringify({ text, pages, shown }));
    },
  },
  {
    name: 'the lane timer\'s board names a drawn house "NEW LAYOUT", never "LANE A" (the play review of 2026-11-16: the hot wash\'s board read LANE A on seed 48213 drawn)',
    fn() {
      const drawn = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', draw: 'drawn', setup: 'go' }), set = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go' });
      const head = (g) => laneModel(houseNow(g.state), g.state.clock.ms).head;
      const d = head(drawn), s = head(set);
      console.log(`      drawn ${JSON.stringify(d)}, set ${JSON.stringify(s)}`);
      assert(d === 'NEW LAYOUT' && s === 'LANE A', JSON.stringify({ d, s }));
    },
  },
  {
    name: 'the end card keeps a drawn house\'s code in its own case (the play review of 2026-11-16: "HOUSE KN240LC.ES195PC.CN160LC", a code parseHouse refuses)',
    fn() {
      const end = readFileSync(path.join(root, 'src/ui/cards/end.js'), 'utf8'), css = readFileSync(path.join(root, 'src/ui/style.css'), 'utf8');
      const inSpan = /className: 'house-code', textContent: String\(code\)/.test(end), rule = /\.glass h3 \.house-code \{[^}]*text-transform: none/.test(css);
      const upper = parseHouse('Kn240lc.Es195pc.Cn160lc'.toUpperCase()), own = parseHouse('Kn240lc.Es195pc.Cn160lc');
      console.log(`      the code in its own span ${inSpan}, its rule text-transform: none ${rule}; parsed in capitals ${upper !== null}, in its case ${own !== null}`);
      assert(inSpan && rule && upper === null && own !== null, JSON.stringify({ inSpan, rule }));
    },
  },
  {
    name: 'a drawn house\'s locked door is not known until it is read or tried (the play review of 2026-11-16: at GO, 8 m off, Open struck "locked door" and T\'s "Kick, clear the room"; at the stack "Locked. Kick it." with no hand on the handle); the instructor\'s par still books the kick, and the honest tier one still clears it',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 17, tier: 'tierone', draw: 'drawn', setup: 'go' }), s = g.state, pid = s.player.id, H = s.armoury.range.house;
      const plan = lanePlanOf(s), door = plan.order[0], P = plan.plans[door];
      const read = () => ({ open: entryOptions(s, pid, P).find(r => r.id === 'open')?.off ?? null, breach: breachOf(s, P), known: lockKnownOf(s, door) });
      const atGo = read();
      const par = roomParOf(s, door, H), fillPar = H.rooms[0].parMs;
      H.read = { ...(H.read ?? {}), [door]: s.clock.ms };
      const afterRead = read();
      delete H.read[door];
      // (the lane played by the honest tier one: the door tried, refused, kicked; the room cleared)
      const h = createGame({ scenario: 'test-shoothouse', seed: 17, tier: 'tierone', draw: 'drawn' });
      runHouse(h, houseHonestBot());
      const L = h.state.armoury.range.house.rooms[0], tried = h.state.armoury.range.house.tried?.[door] ?? null, said = (h.state.log ?? []).some(x => /Locked/.test(x.text ?? ''));
      console.log(`      ${H.draw.code}: room 1's door ${door} locked; at GO ${JSON.stringify(atGo)}; read ${JSON.stringify(afterRead)}; its par ${par} ms, the fill's ${fillPar}; played: tried at ${tried === null ? 'never' : 'a time'} (read ${h.state.armoury.range.house.read?.[door] !== undefined}), the leg ${L.state}`);
      assert(/k\|/.test(`${H.draw.code.split('.')[0]}|`) && atGo.open === null && atGo.breach !== 'kick' && !atGo.known && afterRead.open === 'locked' && afterRead.breach === 'kick' && afterRead.known
        && par === fillPar && L.state === 'clear', JSON.stringify({ atGo, afterRead, par, fillPar, leg: L.state }));
    },
  },
  {
    name: 'a drawn place off the room\'s sector books the muzzle\'s turn in its par, the set\'s none (the play review of 2026-11-16: the raider at 0.87 to 0.94 s against 0.80 at drawn places 1 and 2, never at place 0)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 105, tier: 'raider', draw: 'drawn', setup: 'go' }), s = g.state, H = s.armoury.range.house;
      const set = createGame({ scenario: 'test-shoothouse', seed: 105, tier: 'raider', setup: 'go' }), S = set.state, HS = S.armoury.range.house;
      const show = (st, h) => st.armoury.range.turners.filter(T => T.face === 'threat' || T.face === 'armoured').map(T => { const p = parOf(st, T, h); return `${T.stand} ${p.ms}${p.parts.length ? ` (${p.parts.map(x => `${x.why} ${x.ms}`).join(', ')})` : ''}`; });
      const drawn = show(s, H), setRows = show(S, HS), turned = s.armoury.range.turners.filter(T => parOf(s, T, H).parts.some(x => x.why === 'turn'));
      const setTurn = S.armoury.range.turners.some(T => parOf(S, T, HS).parts.some(x => x.why === 'turn'));
      console.log(`      TURN_FREE_DEG ${TURN_FREE_DEG}; ${H.draw.code}: ${drawn.join(' · ')}`);
      console.log(`      the set: ${setRows.join(' · ')}`);
      assert(turned.length > 0 && turned.every(T => parOf(s, T, H).ms > H.parMs) && !setTurn, JSON.stringify({ drawn, setRows }));
    },
  },
  {
    name: 'the raider and the corporal by the honest bot make their pars on drawn houses as on the set: GO on most of seeds 101 to 124 drawn (the play review of 2026-11-16: 13 of 24 each, every NO-GO "Too many pars missed"; a second man seen with a first now timed from the first man\'s row)',
    heavy: true,
    timeoutMs: 900_000,
    fn() {
      const out = {};
      for (const tier of ['raider', 'cpl']) {
        let go = 0;
        for (let seed = 101; seed <= 124; seed++) { const g = createGame({ scenario: 'test-shoothouse', seed, tier, draw: 'drawn' }); runHouse(g, houseHonestBot()); if (houseVerdict(g.state).go) go++; }
        out[tier] = go;
      }
      console.log(`      GO on drawn seeds 101 to 124: the raider ${out.raider} of 24, the corporal ${out.cpl} of 24 (13 and 13 before)`);
      assert(out.raider >= 17 && out.cpl >= 18, JSON.stringify(out));
    },
  },
  {
    // (v0.0.22's fixer: the words said are the wash's by the lane's end (shoothouse.js houseCmdSay: its sayEnd, v0.0.22's FL22-3, "Weapons
    // clear. Into the booth: hot wash."), which made v0.0.21's "The lane is closed." a second rule never said (the code review of
    // 2026-11-17); the tower's chain times the words said, so "as long" is no longer the rule: never the lane called clear is)
    name: 'the hot wash after a casualty does not call the lane clear (the play review of 2026-11-16: "The lane is clear. Into the booth: hot wash." after "CEASE FIRE! You are a casualty."), the words the wash\'s by the lane\'s end',
    fn() {
      const said = (R) => { const c = seqOf(R).find(x => x.id === 'wash'), why = R.house.end?.why ?? null; return c.sayEnd ? (why === null || why === 'clear' ? c.sayEnd.clear : c.sayEnd.other) : c.say; };
      const clear = said({ course: 'house', house: {} }), cas = said({ course: 'house', house: { end: { why: 'casualty' } } }), casDrawn = said({ course: 'house', house: { draw: { mode: 'drawn' }, end: { why: 'casualty' } } });
      const ids = (R) => seqOf(R).map(c => c.id).join();
      console.log(`      clear: ${JSON.stringify(clear)}; after a casualty: ${JSON.stringify(cas)} (drawn ${JSON.stringify(casDrawn)})`);
      assert(cas.every(t => !/lane is clear/i.test(t)) && casDrawn.every(t => !/lane is clear/i.test(t)) && clear.some(t => /lane is clear/.test(t)) && ids({ course: 'house', house: { end: { why: 'casualty' } } }) === ids({ course: 'house', house: {} }), JSON.stringify({ cas }));
    },
  },
  {
    name: 'X in the lane from rung 2 lets the clock run, never "Stand easy" (the play review of 2026-11-16)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'cpl', setup: 'go' }), s = g.state;
      const leave = stepsOf(s).find(r => r.id === 'leave');
      console.log(`      the corporal at GO, the lane live: X ${JSON.stringify(leave?.label)}`);
      assert(leave && !/Stand easy/.test(leave.label), JSON.stringify(leave));
    },
  },
  {
    name: 'in the lane, the log never says "You flagged" of a muzzle at high or low ready, which the house\'s judge holds safe (the play review of 2026-11-16: the recruit\'s fuzz on drawn 3, tick 3937, "You flagged LCpl Madsen" with no MUZZLE fault and no word from the instructor)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 3, tier: 'recruit', draw: 'drawn' }), bot = houseFuzzBot({ seed: 3 });
      for (let i = 0; i < 4200 && !g.state.armoury.range.house.end; i++) g.step(1, bot);
      const s = g.state, flags = (s.log ?? []).filter(x => x.kind === 'habit' && /flagged|pointed/.test(x.text ?? '')), ready = flags.filter(x => ['lowReady', 'highReady'].includes(x.posture));
      const faults = [...s.armoury.range.house.rooms, s.armoury.range.house.hall].flatMap(L => L.faults.filter(f => f.kind === 'muzzle'));
      console.log(`      to tick ${s.clock.tick}: habit lines ${flags.length} (${flags.map(x => `${x.posture}: ${x.text}`).join('; ') || 'none'}), at the ready ${ready.length}; MUZZLE faults ${faults.length}`);
      assert(!ready.length, JSON.stringify(ready));
    },
  },
];
