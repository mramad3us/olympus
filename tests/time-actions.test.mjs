// R says what it does (the build sheet 0.0.6 §2.1, §5.1; TIME §8; VIEWS §10.1's R): the user, 2026-11-06, after
// playing v0.0.4: "the shave+wash+water when pressing R at a basin without the tootip telling us what is going to
// happen is no good ... R should wash hands if hygiene is low enough, drink if we're thristy and shave if none of
// the above (use a priority thing and R is the most urgent), long pressing R should open the menu with all the
// possible interractions as single actions". Prints every spot's menu (its rows, their words, times and struck
// reasons: a sink for a man at 14 h of stubble, a woman, a shaved head at 8 sols; a urinal empty and full; a toilet
// stall; your rack by night, by day and in a drill; your locker; a tap; a machine; the barber's pole at 09:00 and
// 14:00; a door; nothing at hand) and R's quick action over the sink's grid (the hands clean or dirty × thirsty or
// not × stubble or not × a shaved head due or not). Holds the user's priority exactly; no row is two actions (each
// one activity of one part, but the shower); the head leaves the hands dirty ("using the head shouldn't wash our
// hands"); R's label names what it does and its time; a struck row is refused by startActivity with its reason.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { handOffer, handMenu, titleOf } from '../src/sim/places/hand.js';
import { planOf, startActivity } from '../src/sim/time/activities.js';
import { areaOf } from '../src/sim/places/model.js';
import { spotsOf } from '../src/sim/places/fixtures.js';
import { setOutfit } from '../src/sim/people/place.js';
import { bodyOf } from '../src/sim/body/body.js';
import { stagesOf } from '../src/sim/body/cues.js';
import { hairOf, SOL_H } from '../src/sim/body/hair.js';
import { TICK_MS } from '../src/core/clock.js';

const SEED = 48213, AREA = 'melas.echo.1';
const SINK = 'f:e1:head-2a:sinks-1#1', URINAL = 'f:e1:head-2a:urinal-1#1', STALL = 'f:e1:head-2a:stall-1#1', FOOT = 'f:e1:bay-2-1:rack-n1#1';
const BARBER = 'f:melas:px:barber#1';
const ctxOf = (g) => ({ held: false, tickMs: TICK_MS, sim: g.sim });
const spotIn = (area, id) => { const fx = areaOf(area).fixtures.find(f => id.startsWith(f.id + '#')); return spotsOf(fx).find(s => s.id === id); };
const putAt = (g, id, area = AREA) => { const sp = spotIn(area, id); Object.assign(g.me(), { x: sp.x, z: sp.z, face: sp.face ?? 'down', $px: sp.x, $pz: sp.z }); return sp; };
// (the player's body and look set for a case: the hands' dirt, the water balance, the stubble, the cut and its hours)
function setBody(g, { dirt = null, balanceL = null, stubbleH = null, cut = null, hairH = null, bladderMl = null } = {}) {
  const s = g.state, p = s.people[s.player.id], b = p.body;
  if (dirt !== null) b.hands = { dirt, why: dirt >= 40 ? 'head' : null };
  if (balanceL !== null) b.water = { ...(b.water ?? {}), balanceL };
  if (stubbleH !== null) b.hygiene = { ...(b.hygiene ?? {}), stubbleH };
  if (bladderMl !== null) b.bladder = { ...(b.bladder ?? {}), ml: bladderMl };
  if (hairH !== null) b.hair = { h: hairH };
  if (cut) p.look = { ...p.look, hair: { ...(p.look.hair ?? {}), style: cut } };
}
// (a menu as one line: the rows, each with its pick and its reason)
const menuText = (m) => (m ? `${m.title}: ${m.rows.map(r => `${r.key === m.quick ? '>' : ''}${r.label}${r.choices ? ` [▾ ${r.choices.map(c => `${c.words}${c.off ? ` (${c.off})` : ''}`).join(' / ')}]` : ''}${r.off ? ` (${r.off})` : ''}`).join(' | ')}` : 'no menu');

export default [
  {
    name: 'every spot\'s menu, its single actions in the order one does them in, each with its time or its reason struck; no row is two actions (one activity of one part, but the shower); the barber\'s pole by the PX\'s hours',
    fn() {
      const rows = [], all = [];
      const look = (what, g, spotId, area = AREA) => { if (spotId) putAt(g, spotId, area); const m = handMenu(g.state), o = handOffer(g.state); rows.push(`${what.padEnd(34)} R ${o?.label ?? 'nothing'}${o?.why ? ` (${o.why})` : ''}`, `${''.padEnd(34)} R held: ${menuText(m)}`); if (m) all.push(...m.rows.map(r => ({ r, parts: r.verb === 'activity' && !r.off ? planOf(g.state, r.id, { spotId: r.spotId, args: r.args }).parts.length : null }))); return { m, o }; };
      const g = createGame({ scenario: 'barracks', seed: SEED, hour: 14 });
      setBody(g, { dirt: 5, balanceL: 0.3, stubbleH: 14, cut: 'lowReg', hairH: 30, bladderMl: 300 });
      const man = look('a sink, a man at 14 h of stubble', g, SINK);
      const gw = createGame({ scenario: 'barracks', seed: SEED, hour: 14 });
      const pw = gw.state.people[gw.state.player.id];
      pw.sex = 'f'; pw.body.tmpl = 'f-adult'; setBody(gw, { dirt: 5, stubbleH: 30, cut: 'bun' });
      const woman = look('a sink, a woman', gw, SINK);
      const gs = createGame({ scenario: 'barracks', seed: SEED, hour: 14 });
      setBody(gs, { dirt: 5, balanceL: 0.3, stubbleH: 2, cut: 'shaved', hairH: 8 * SOL_H });
      const shaved = look('a sink, a shaved head at 8 sols', gs, SINK);
      setBody(g, { bladderMl: 20 });
      const empty = look('a urinal, the bladder empty', g, URINAL);
      setBody(g, { bladderMl: 300 });
      const full = look('a urinal, the bladder full', g, URINAL);
      look('a toilet stall', g, STALL);
      look('the shower', g, 'f:e1:head-2a:shower-1#1');
      const day = look('your rack by day (14:00)', g, FOOT);
      const gn = createGame({ scenario: 'barracks', seed: SEED, hour: 21.9 });
      const night = look('your rack by night (21:54)', gn, FOOT);
      const gd = createGame({ scenario: 'test-night', seed: SEED });
      gd.step(1, { act: [{ act: 'hand', args: { want: 'activity' } }] });            // (asleep to the klaxon)
      gd.step(1, { act: [{ act: 'hand', args: { want: 'rise' } }] }); gd.step(120);
      const drill = look('your rack in a drill (PT kit)', gd, FOOT);
      setOutfit(gd.me(), 'utilities');
      const drillU = look('your rack in a drill (utilities)', gd, FOOT);
      look('your locker', g, 'f:e1:bay-2-1:locker-n1a#1');
      look('a tap (the hall\'s fountain)', g, 'f:e1:hall-2:fountain-1#1');
      look('a machine (the mail room\'s)', g, 'f:e1:mail:vending-1#1');
      const sp = spotIn('melas.ground', BARBER);
      const g9 = createGame({ scenario: 'barracks', seed: SEED, hour: 9, at: { area: 'melas.ground', x: sp.x, z: sp.z, face: sp.face } });
      setBody(g9, { hairH: 5 * SOL_H });
      const b9 = look('the barber\'s pole at 09:00', g9, null);
      const g14 = createGame({ scenario: 'barracks', seed: SEED, hour: 14, at: { area: 'melas.ground', x: sp.x, z: sp.z, face: sp.face } });
      const bF = look('the barber\'s pole at 14:00, cut fresh', g14, null);
      setBody(g14, { hairH: 5 * SOL_H });
      const b14 = look('the barber\'s pole at 14:00, 5 sols on', g14, null);
      Object.assign(g.me(), { x: 57.7, z: 8.6, face: 'up', $px: 57.7, $pz: 8.6 });
      const door = look('a door (the bay\'s, from the hall)', g, null);
      Object.assign(g.me(), { x: 55.75, z: 3.95, face: 'down', $px: 55.75, $pz: 3.95 });
      const aisle = look('nothing at hand (mid-aisle)', g, null);
      for (const r of rows) console.log(`      ${r}`);
      // (single actions: every activity row one activity, planned as one part, but the shower's three)
      const two = all.filter(({ r, parts }) => parts !== null && r.id !== 'shower' && parts !== 1);
      console.log(`      ${all.length} rows printed; rows of more than one part: ${two.map(x => x.r.id).join(', ') || 'none'} (the shower's in, water and dress are one action, as v0.0.4 had it)`);
      assert(!two.length, two.map(x => x.r.id).join());
      assert(man.m.rows.map(r => r.id).join() === 'wash-hands,teeth,shave,wash-face,drink,wait' && woman.m.rows.map(r => r.id).join() === 'wash-hands,teeth,wash-face,drink,wait'
        && shaved.m.rows.map(r => r.id).join() === 'wash-hands,teeth,shave,clip,wash-face,drink,wait', `the sinks: ${[man, woman, shaved].map(x => x.m.rows.map(r => r.id).join()).join(' / ')}`);
      assert(shaved.m.rows.find(r => r.id === 'shave').off === 'clean-shaven' && shaved.o.id === 'clip' && shaved.o.why === 'haircut' && man.m.title === 'The sink', JSON.stringify(shaved.o));
      assert(empty.m.rows[0].off === 'nothing to give' && empty.o.verb === 'wait' && full.o.id === 'urinate' && full.o.why === 'bladder', 'the urinal');
      assert(day.o.id === 'nap' && day.o.args.min === 45 && night.o.id === 'sleep' && night.o.args.until === 'reveille' && day.m.rows.map(r => r.id).join() === 'dress,sleep,nap,wait', `the rack: ${day.o.label} / ${night.o.label}`);
      assert(drill.o.id === 'dress' && drill.o.args.to === 'utilities' && drill.o.why === 'drill' && drillU.o.id === 'standfast' && drillU.m.rows.map(r => r.id).join() === 'dress,standfast,sleep,nap,wait', `the drill: ${drill.o.label} / ${drillU.o.label}`);
      assert(drillU.m.rows.find(r => r.id === 'sleep').late && !drillU.m.rows.find(r => r.id === 'sleep').off, 'a late row is not struck');
      // (a fresh cut: the haircut struck, R the wait, the plate saying why; the fixer's, 0.0.6)
      assert(bF.o.verb === 'wait' && bF.m.rows[0].off === 'fresh from the barber' && bF.o.struck?.off === 'fresh from the barber' && empty.o.struck?.off === 'nothing to give', `the fresh cut: ${JSON.stringify({ o: bF.o, empty: empty.o.struck })}`);
      assert(b9.o.verb === 'wait' && b9.m.rows[0].off === 'the barber opens at 10:00' && b14.o.id === 'haircut' && /^haircut \(.+\) · 12 min, done 14:12$/.test(b14.o.label) && b14.m.title === 'The barber\'s', `the barber: ${b9.m.rows[0].off} / ${b14.o.label}`);
      assert(door.o.verb === 'open' && door.m.rows.map(r => r.key).join() === 'door,wait' && door.m.title === 'The door' && aisle.m.title === titleOf(null) && aisle.m.rows.length === 1, 'the door and the aisle');
    },
  },
  {
    name: 'R\'s quick action at a sink is the user\'s priority exactly (the user, 2026-11-06: "R should wash hands if hygiene is low enough, drink if we\'re thristy and shave if none of the above (use a priority thing and R is the most urgent)"), then a shaved head\'s buzz when due, else nothing is due and R is the wait (the fixer\'s, 0.0.6, overruling the integrator\'s wash hands); its label names what it does and its time',
    fn() {
      const out = [];
      let bad = 0;
      for (const dirty of [false, true]) for (const thirsty of [false, true]) for (const stubble of [false, true]) for (const due of [false, true]) {
        const g = createGame({ scenario: 'barracks', seed: SEED, hour: 14 });
        setBody(g, { dirt: dirty ? 55 : 5, balanceL: thirsty ? -1.4 : 0.3, stubbleH: stubble ? 14 : 3, cut: due ? 'shaved' : 'lowReg', hairH: due ? 8 * SOL_H : 30 });
        putAt(g, SINK);
        const s = g.state, b = bodyOf(s, s.player.id), st = stagesOf(b, s.clock.ms), o = handOffer(s);
        const want = dirty ? 'wash-hands' : thirsty ? 'drink' : stubble ? 'shave' : due ? 'clip' : 'wait';
        const why = dirty ? 'hands' : thirsty ? 'thirst' : stubble ? 'stubble' : due ? 'haircut' : null;
        const ok = o.id === want && o.why === why && st.hands.i >= 2 === dirty && st.thirst.i >= 1 === thirsty;
        if (!ok) bad++;
        out.push(`${dirty ? 'dirty' : 'clean'} ${thirsty ? 'thirsty' : 'quenched'} ${stubble ? 'stubble' : 'smooth'} ${due ? `shaved, ${hairOf(s, s.player.id).band.id}` : 'lowReg'}`.padEnd(46) + ` R "${o.label}"${o.why ? ` (${o.why})` : ''}${ok ? '' : `  WANTED ${want}`}`);
      }
      for (const l of out) console.log(`      ${l}`);
      const labels = out.map(l => l.match(/R "([^"]+)"/)[1]);
      assert(!bad, `${bad} of 16 cases off the priority`);
      assert(labels.includes('wash hands · 30 s') && labels.includes('wait 15 min') && labels.includes('drink · 30 s') && labels.some(l => /^shave · 4 min, done \d\d:\d\d$/.test(l)) && labels.some(l => /^buzz your head · 10 min, done \d\d:\d\d$/.test(l)),
        `the labels: ${[...new Set(labels)].join(' | ')}`);
      console.log('      16 of 16 by the priority: hands, thirst, stubble, a shaved head due, else the wait; ", done HH:MM" only from 45 s (a lived action ends in front of you)');
    },
  },
  {
    name: 'the head no longer washes your hands (the user, 2026-11-06: "using the head shouldn\'t wash our hands either afterwards"): after the head they are dirty and R at a sink then washes them, and that alone',
    fn() {
      const g = createGame({ scenario: 'barracks', seed: SEED, hour: 14 });
      const s = g.state, pid = s.player.id;
      setBody(g, { dirt: 0, bladderMl: 300, balanceL: 0.3, stubbleH: 14 });
      putAt(g, URINAL);
      const o = handOffer(s);
      g.step(1, { act: [{ act: 'hand', args: { want: 'activity' } }] });
      for (let n = 0; (s.skip || s.time.doing) && n < 4000; n++) g.step(1);
      const b1 = bodyOf(s, pid), st1 = stagesOf(b1, s.clock.ms);
      const groomed = g.facts('body-event').filter(e => e.kind === 'groom'), soiled = g.facts('body-event').filter(e => e.kind === 'soil');
      putAt(g, SINK);
      const o2 = handOffer(s), stub0 = b1.hygiene.stubbleH, grime0 = b1.hygiene.grime;
      g.step(1, { act: [{ act: 'hand', args: { want: 'activity' } }] });
      const lived = s.time.doing?.mode ?? (s.skip ? s.skip.engine : null);   // (a fast-forward behind the brief splash: 30 s is over LIVE_MAX_MS 10 s, the user, 2026-11-07)
      g.run(31_000);
      const b2 = bodyOf(s, pid), st2 = stagesOf(b2, s.clock.ms), end = g.facts('activity').at(-1);
      const line = s.log.filter(e => e.kind === 'activity').at(-1);
      console.log(`      the urinal: R "${o.label}"; after: hands ${st1.hands.band} (dirt ${fmt(b1.hands.dirt, 1)}, ${b1.hands.why}), soil events ${soiled.map(e => `${e.amount} (${e.why})`).join(', ')}, groom events ${groomed.length}`);
      console.log(`      the sink: R "${o2.label}" (${o2.why}), lived ${lived}: hands ${st2.hands.band} (dirt ${fmt(b2.hands.dirt, 2)}), stubble ${fmt(stub0, 2)} → ${fmt(b2.hygiene.stubbleH, 2)} h, grime ${fmt(grime0, 2)} → ${fmt(b2.hygiene.grime, 2)}; "${line?.text}"`);
      assert(o.id === 'urinate' && st1.hands.i >= 2 && b1.hands.why === 'head' && !groomed.length && soiled.length === 1, JSON.stringify({ hands: b1.hands, groomed: groomed.length }));
      assert(o2.id === 'wash-hands' && o2.label === 'wash hands · 30 s' && lived === 'ff' && end.mode === 'ff' && end.activity === 'wash-hands' && end.fraction === 1 && st2.hands.i === 0, JSON.stringify({ o2: o2.label, end, hands: b2.hands }));
      assert(b2.hygiene.stubbleH > stub0 && Math.abs(b2.hygiene.grime - grime0) < 0.1, 'washing the hands shaved or washed something else');
    },
  },
  {
    name: 'a struck row is never done: startActivity refuses it with its reason (clean-shaven, buzzed today, nothing to give, already in utilities, reveille comes first, the barber opens at 10:00, taken), and a legacy record never begins',
    fn() {
      const rows = [];
      const tryIt = (what, g, id, spotId, args = {}) => { const n = g.facts('line').length, r = startActivity(g.state, g.bus, ctxOf(g), { id, spotId, args }); const said = g.facts('line').slice(n).at(-1)?.text; rows.push(`${what.padEnd(40)} ${r.ok ? 'BEGAN' : `refused '${r.why}'`}${said ? ` ("${said}")` : ''}`); return r; };
      const g = createGame({ scenario: 'barracks', seed: SEED, hour: 14 });
      setBody(g, { stubbleH: 3, bladderMl: 20, cut: 'shaved', hairH: 5 });
      putAt(g, SINK);
      const shave = tryIt('a shave at 3 h of stubble', g, 'shave', SINK);
      const clip = tryIt('the clippers 5 h after the last cut', g, 'clip', SINK);
      const legacy = tryIt('v0.0.4\'s basin bundle', g, 'basin', SINK);
      putAt(g, URINAL);
      const pee = tryIt('the head, 20 mL in the bladder', g, 'urinate', URINAL);
      putAt(g, FOOT);
      const dress = tryIt('dressing into utilities, in utilities', g, 'dress', FOOT, { to: 'utilities' });
      const gr = createGame({ scenario: 'barracks', seed: SEED, hour: 5 + 12 / 60 });
      putAt(gr, FOOT);
      const nap = tryIt('a 20-minute nap at 05:12', gr, 'nap', FOOT, { min: 20 });
      const sp = spotIn('melas.ground', BARBER);
      const g9 = createGame({ scenario: 'barracks', seed: SEED, hour: 9, at: { area: 'melas.ground', x: sp.x, z: sp.z, face: sp.face } });
      setBody(g9, { hairH: 5 * SOL_H });
      const cut = tryIt('a haircut at 09:00', g9, 'haircut', BARBER, { cut: 'lowReg' });
      // (taken: a squadmate stood on the sink's spot)
      const gt = createGame({ scenario: 'barracks', seed: SEED, hour: 14 });
      const sink = putAt(gt, SINK), other = gt.state.actors.list.find(a => a.id !== gt.state.player.actor);
      Object.assign(other, { x: sink.x + 0.1, z: sink.z, $px: sink.x + 0.1, $pz: sink.z });
      const taken = tryIt('a sink with a squadmate at it', gt, 'wash-hands', SINK);
      const m = handMenu(gt.state);
      // (and the taken sink alone in reach: every row struck 'taken', R the wait)
      const gt2 = createGame({ scenario: 'barracks', seed: SEED, hour: 14 });
      const sink2 = putAt(gt2, SINK);
      Object.assign(gt2.me(), { x: sink2.x - 0.3, $px: sink2.x - 0.3 });
      const other2 = gt2.state.actors.list.find(a => a.id !== gt2.state.player.actor);
      Object.assign(other2, { x: sink2.x - 0.05, z: sink2.z, $px: sink2.x - 0.05, $pz: sink2.z });
      const m2 = handMenu(gt2.state), o2 = handOffer(gt2.state);
      for (const r of rows) console.log(`      ${r}`);
      console.log(`      R held beside the taken sink, the next sink in reach: ${m.spotId} (${menuText(m)})`);
      console.log(`      R held at the taken sink alone (0.3 m west of it): ${m2.spotId}, R ${o2.label} (${menuText(m2)})`);
      assert(shave.why === 'clean-shaven' && clip.why === 'buzzed today' && pee.why === 'nothing to give' && dress.why === 'already in utilities' && nap.why === 'reveille comes first' && cut.why === 'the barber opens at 10:00' && taken.why === 'taken' && !legacy.ok,
        JSON.stringify({ shave, clip, pee, dress, nap, cut, taken, legacy }));
      assert(m.spotId !== SINK && m2.spotId === SINK && m2.rows.filter(r => r.verb === 'activity').every(r => r.off === 'taken') && o2.verb === 'wait', 'the taken sink\'s rows');
    },
  },
];
