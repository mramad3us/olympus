// The activities (TIME §8; the build sheet 0.0.4 §2.2.1, §2.2.6; the 0.0.6 sheet §2.1; TIME's test 7 and
// R's offers): each activity's length at Melas, its engine and its splash's form, the basin's single
// actions (0.0.6: v0.0.4's bundle split); what R offers at every fixture of Head A and bay-2-1, at the
// mail room's machine, at a door, mid-aisle and lying in the rack, with its price; another marine's rack
// and locker offering nothing; R's wait away from anything; a door at hand acting at once; an offer that
// changed kind by its tick doing nothing; a drink lived 30 s at 1:1 and cut by a move key at its fraction.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { planOf, startActivity, activitiesAt, kindFor, LIVE_MAX_MS } from '../src/sim/time/activities.js';
import { activityNow, feetHeld } from '../src/sim/time/doing.js';
import { splashPlan } from '../src/sim/time/splash.js';
import { handOffer, handMenu } from '../src/sim/places/hand.js';
import { areaOf } from '../src/sim/places/model.js';
import { spotsOf } from '../src/sim/places/fixtures.js';
import { openingState } from '../src/sim/places/model.js';
import { setOutfit } from '../src/sim/people/place.js';
import { bodyOf } from '../src/sim/body/body.js';
import { stagesOf } from '../src/sim/body/cues.js';
import { durationText, TICK_MS, MIN_MS } from '../src/core/clock.js';

const SEED = 48213, AREA = 'melas.echo.1';
const ctxOf = (g) => ({ held: false, tickMs: TICK_MS, sim: g.sim });
const mmss = (ms) => { const s = Math.round(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60; return h ? `${h} h ${m} m ${r} s` : `${m}:${String(r).padStart(2, '0')}`; };
const put = (g, x, z, face = 'down') => Object.assign(g.me(), { x, z, face, $px: x, $pz: z });
const spot = (id) => { const fx = areaOf(AREA).fixtures.find(f => id.startsWith(f.id + '#')); return spotsOf(fx).find(s => s.id === id); };
const at = (g, id, face) => { const s = spot(id); put(g, s.x, s.z, face ?? s.face); return handOffer(g.state); };

export default [
  {
    name: 'each activity\'s length at Melas (TIME §8.2 to §8.4: the shower 10:00, dressing 5:12 and 4:24, the sink\'s single actions 0:30, 2:00, 4:00, 10:00 and 1:00, sleep from 21:55 to reveille 8 h 14 m 35 s in whatever you wear, the naps, the barber 12:00) with its engine and its splash\'s form (test 7)',
    fn() {
      const g = createGame({ scenario: 'test-night', seed: SEED });
      const s = g.state, me = g.me();
      const rows = [], len = {};
      const row = (what, id, spotId, args = {}) => {
        const p = planOf(s, id, { spotId, args });
        const sp = splashPlan({ fromMs: 0, toMs: p.durMs, engine: p.kind === 'ff' ? 'ff' : 'outcome' });
        rows.push(`${what.padEnd(34)} ${mmss(p.durMs).padStart(12)}  ${p.kind.padEnd(7)} ${p.kind === 'live' ? 'no splash' : `${sp.form}, ${fmt(sp.totalS, 2)} s`}  parts ${p.parts.map(x => `${x.part} ${mmss(x.toMs - x.fromMs)}`).join(' + ')}`);
        len[what] = p;
        return p;
      };
      row('shower', 'shower', 'f:e1:head-2a:shower-2#1');
      setOutfit(me, 'pt'); row('dress PT kit → utilities', 'dress', 'f:e1:bay-2-1:rack-n1#1', { to: 'utilities' });
      setOutfit(me, 'utilities'); row('dress utilities → PT kit', 'dress', 'f:e1:bay-2-1:rack-n1#1', { to: 'pt' });
      setOutfit(me, 'towel'); row('dress towel → utilities', 'dress', 'f:e1:bay-2-1:locker-n1a#1', { to: 'utilities' });
      setOutfit(me, 'pt');
      for (const id of ['wash-hands', 'teeth', 'shave', 'clip', 'wash-face']) row(id, id, 'f:e1:head-2a:sinks-1#1');
      row('urinate', 'urinate', 'f:e1:head-2a:urinal-1#1');
      row('bowel', 'bowel', 'f:e1:head-2a:stall-1#1');
      row('sleep 21:55 to reveille (in PT kit)', 'sleep', 'f:e1:bay-2-1:rack-n1#1', { until: 'reveille' });
      setOutfit(me, 'utilities'); row('sleep to reveille, from utilities', 'sleep', 'f:e1:bay-2-1:rack-n1#1', { until: 'reveille' }); setOutfit(me, 'pt');
      for (const m of [20, 45, 90]) row(`nap ${m} min`, 'nap', 'f:e1:bay-2-1:rack-n1#1', { min: m });
      row('a drink at a tap', 'drink', 'f:e1:head-2a:sinks-1#2');
      row('a bar at the mail room\'s machine', 'snack', 'f:e1:mail:vending-1#1');
      row('a haircut (the barber\'s chair)', 'haircut', null, { cut: 'highTight' });
      row('R\'s wait', 'wait', null);
      // (in an open drill, utilities at the alarm's tempo: TIME §8.2's emergency one, the review of v0.0.4)
      s.time.drills.open = { drill: 0, atMs: s.clock.ms, dueMs: s.clock.ms + 300_000, endMs: s.clock.ms + 1_800_000 };
      row('dress PT kit → utilities, in a drill', 'dress', 'f:e1:bay-2-1:rack-n1#1', { to: 'utilities' });
      delete s.time.drills.open;
      for (const r of rows) console.log(`      ${r}`);
      assert(len.shower.durMs === 600_000 && len.shower.kind === 'outcome', 'the shower');
      assert(len['dress PT kit → utilities'].durMs === 312_000 && len['dress utilities → PT kit'].durMs === 264_000 && len['dress towel → utilities'].durMs === 240_000, 'dressing');
      const sink = ['wash-hands', 'teeth', 'shave', 'clip', 'wash-face'].map(id => len[id].durMs);
      assert(sink.join() === '30000,120000,240000,600000,60000' && len['wash-hands'].kind === 'ff' && len['wash-face'].kind === 'ff' && len.teeth.kind === 'outcome', `the sink: ${sink.join()}`);
      assert(Object.values(len).every(p => p.parts.length === 1 || ['in', 'turn-in'].includes(p.parts[0].part)), 'a single action of one part, but the shower');
      assert(len['dress PT kit → utilities, in a drill'].durMs === 156_000, `the hurried dress: ${len['dress PT kit → utilities, in a drill'].durMs}`);
      assert(len.urinate.durMs === 75_000 && len.urinate.kind === 'ff' && len.bowel.durMs === 360_000, 'the head');
      assert(len['a haircut (the barber\'s chair)'].durMs === 720_000 && len['a haircut (the barber\'s chair)'].parts[0].posture === 'sit' && len['a haircut (the barber\'s chair)'].parts[0].inside, 'the barber');
      const night = len['sleep 21:55 to reveille (in PT kit)'];
      assert(night.endMs === 23_543_401_000 && night.durMs === 23_543_401_000 - s.clock.ms && Math.round(night.durMs / 1000) === 8 * 3600 + 14 * 60 + 35, `the night: ${night.durMs}`);
      // (0.0.6: no turn-in, you sleep in what you wear; the build sheet §8 item 6)
      const fromUt = len['sleep to reveille, from utilities'];
      assert(fromUt.parts.length === 1 && fromUt.parts[0].part === 'lie' && fromUt.endMs === night.endMs, `the night from utilities: ${fromUt.parts.map(p => p.part)}`);
      // the user, 2026-11-07: "No time skip on the 30s of hand washing intentional ? I'm okay with no time skip for actions taking up to 10s"
      assert(len['a drink at a tap'].kind === 'ff' && len['wash-hands'].kind === 'ff' && len['a drink at a tap'].durMs === 30_000 && len['R\'s wait'].durMs === 900_000, 'drink and wait');
      assert(LIVE_MAX_MS === 10_000 && kindFor(s, LIVE_MAX_MS) === 'live' && kindFor(s, LIVE_MAX_MS + 50) === 'ff' && kindFor(s, 120_000) === 'outcome', 'the engines by length');
      console.log(`      engines: up to ${LIVE_MAX_MS / 1000} s lived (the user, 2026-11-07: "up to 10s"; wash hands, a drink and a snack, 30 s, now a fast-forward behind the brief splash), to 120 s a fast-forward (here ${s.actors.list.length} actors × 75 s = ${s.actors.list.length * 75} actor-seconds ≤ 6,000), from 120 s an outcome skip`);
    },
  },
  {
    name: 'R at each fixture of Head A and bay-2-1, the mail room\'s machine, the hall\'s fountain, a door, mid-aisle and lying in the rack: its verb, its price and its menu\'s rows; another marine\'s rack and locker offer nothing',
    fn() {
      const g = createGame({ scenario: 'barracks', seed: SEED, hour: 19.5 });
      const s = g.state;
      const rows = [], out = {};
      const look = (what, id, face) => { const o = at(g, id, face); out[what] = o; const m = handMenu(s); rows.push(`${what.padEnd(28)} ${o ? `${o.verb.padEnd(8)} ${o.label}${o.why ? ` (${o.why})` : ''}${m ? `  [R held, ${m.title}: ${m.rows.map(r => `${r.words}${r.choices ? ` ▾${r.choices[r.pick].words}` : ''}${r.off ? ` (${r.off})` : ''}`).join(' | ')}]` : ''}` : 'null'}`); return o; };
      // (an empty bladder has nothing for the head: the urinal's row struck, R the wait; the stall its stall; the review of v0.0.4)
      const pid = s.player.id, bl = (ml) => { s.people[pid].body.bladder = { ...(s.people[pid].body.bladder ?? {}), ml }; };
      bl(10);
      look('a urinal, the bladder empty', 'f:e1:head-2a:urinal-2#1');
      look('a toilet stall, empty', 'f:e1:head-2a:stall-2#1');
      bl(300);
      look('a shower stall', 'f:e1:head-2a:shower-3#1');
      look('a sink at 19:30', 'f:e1:head-2a:sinks-2#2');
      look('a urinal', 'f:e1:head-2a:urinal-2#1');
      look('a toilet stall', 'f:e1:head-2a:stall-2#1');
      look('your rack\'s foot at 19:30', 'f:e1:bay-2-1:rack-n1#1');
      look('your locker', 'f:e1:bay-2-1:locker-n1a#1');
      look('another\'s rack\'s foot', 'f:e1:bay-2-1:rack-n2#1');
      look('another\'s locker', 'f:e1:bay-2-1:locker-n2a#1');
      look('the mail room\'s machine', 'f:e1:mail:vending-1#1');
      look('the lounge\'s machine', 'f:e1:lounge-2:vending-1#1');
      look('the hall\'s fountain', 'f:e1:hall-2:fountain-1#1');
      put(g, 57.7, 8.6, 'up'); out.door = handOffer(s); rows.push(`${'the bay door from the hall'.padEnd(28)} ${out.door.verb} ${out.door.label}  [R held: ${handMenu(s).rows.map(r => r.words).join(' | ')}]`);
      put(g, 55.75, 3.95, 'down'); out.aisle = handOffer(s); rows.push(`${'mid-aisle'.padEnd(28)} ${out.aisle.verb} ${out.aisle.label}  [R held, ${handMenu(s).title}: ${handMenu(s).rows.map(r => r.words).join(' | ')}]`);
      // (the evening: your rack offers the night; the morning: a sink a single action, the morning routine's bundle gone: the review of v0.0.4)
      const g2 = createGame({ scenario: 'barracks', seed: SEED, hour: 21.5 });
      const night = at(g2, 'f:e1:bay-2-1:rack-n1#1');
      rows.push(`${'your rack\'s foot at 21:30'.padEnd(28)} ${night.verb} ${night.label} (${night.why})`);
      const g3 = createGame({ scenario: 'barracks', seed: SEED, hour: 6 });
      const morning = at(g3, 'f:e1:head-2a:sinks-1#1');
      rows.push(`${'a sink at 06:00'.padEnd(28)} ${morning.verb} ${morning.label} (${morning.why ?? 'the first row not struck'})`);
      // (lying in the rack: get up)
      const g4 = createGame({ scenario: 'test-night', seed: SEED });
      g4.step(1, { act: [{ act: 'hand', args: { want: 'activity' } }] });
      const lying = handOffer(g4.state);
      rows.push(`${'lying in your rack (02:30)'.padEnd(28)} ${lying?.verb} ${lying?.label}; R held: ${handMenu(g4.state) ?? 'nothing'}`);
      for (const r of rows) console.log(`      ${r}`);
      assert(out['a shower stall'].id === 'shower' && /^shower · 10 min, done 19:4\d$/.test(out['a shower stall'].label), JSON.stringify(out['a shower stall']));
      // (the sink: single actions only, R the most urgent by the user's priority: hands, thirst, stubble; time-actions holds the grid)
      const st = stagesOf(bodyOf(s, pid), s.clock.ms), stub = bodyOf(s, pid).hygiene.stubbleH;
      const want = st.hands.i >= 2 ? 'wash-hands' : st.thirst.i >= 1 ? 'drink' : stub >= 12 ? 'shave' : 'wait', sk = out['a sink at 19:30'];
      console.log(`      the sink at 19:30: hands ${st.hands.band} (dirt ${fmt(bodyOf(s, pid).hands.dirt, 1)}), thirst ${st.thirst.band}, stubble ${fmt(stub, 1)} h: R ${sk.id}`);
      // (nothing due: R the wait, the menu the rest, the plate saying the shave is struck (the fixer's, 0.0.6))
      assert(sk.id === want && sk.rows === 6 && (want === 'wait' ? sk.struck?.words === 'shave' : [sk.id, ...sk.more.map(m => m.id)].sort().join() === 'drink,shave,teeth,wash-face,wash-hands'), JSON.stringify(sk));
      assert(['wash-hands', 'drink', 'shave', 'wait'].includes(morning.id), JSON.stringify(morning));
      assert(out['a urinal'].id === 'urinate' && ['bowel', 'urinate'].includes(out['a toilet stall'].id), 'the head');
      // (an empty bladder and a bowel with nothing due: R at a stall the wait, never six minutes for nothing; the plate says why (the fixer's, 0.0.6))
      assert(out['a urinal, the bladder empty'].verb === 'wait' && out['a toilet stall, empty'].verb === 'wait' && out['a toilet stall, empty'].struck?.off === 'nothing to give', JSON.stringify({ urinal: out['a urinal, the bladder empty'], stall: out['a toilet stall, empty'] }));
      assert(out['your rack\'s foot at 19:30'].id === 'nap' && night.id === 'sleep' && /^sleep until reveille · /.test(night.label) && /done 05:30$/.test(night.label), `the rack: ${out['your rack\'s foot at 19:30'].label} / ${night.label}`);
      assert(out['your locker'].id === 'dress' && out['another\'s rack\'s foot'].verb === 'wait' && out['another\'s locker'].verb === 'wait', `others' racks: ${JSON.stringify([out['another\'s rack\'s foot'], out['another\'s locker']])}`);
      assert(out['the mail room\'s machine'].id === 'snack' && out['the lounge\'s machine'].id === 'drink', 'the machines');
      assert(out['the hall\'s fountain'].id === 'drink' && out['the hall\'s fountain'].label === 'drink · 30 s', JSON.stringify(out['the hall\'s fountain']));
      assert(out.door.verb === 'open' && out.door.target === 'o:e1:bay-2-1' && out.aisle.verb === 'wait', 'the door and the aisle');
      assert(lying?.verb === 'rise' && handMenu(g4.state) === null, JSON.stringify(lying));
    },
  },
  {
    name: 'R twice waits fifteen minutes away from anything (TIME §7.3\'s stand-by, chunked); a door at hand acts at once; an offer that changed kind by its tick does nothing; R gets you up from the rack',
    fn() {
      const g = createGame({ scenario: 'barracks', seed: SEED, hour: 19.5 });
      const s = g.state;
      put(g, 55.75, 3.95, 'down');
      const t0 = s.clock.ms;
      g.step(1, { act: [{ act: 'hand', args: { want: 'wait' } }] });
      const w = g.facts('skip-end').at(-1), ws = g.facts('skip-start').at(-1);
      assert(w.activity === 'wait' && w.minutes === 15 && ws.mask === 'D A O B S' && ws.chunkMs === 900_000 && w.outcome.chunk?.offerMs === 1200, JSON.stringify({ ws, chunk: w.outcome.chunk }));
      // (carry on: T in the strip, skip:chunk at the landing's clock, another fifteen)
      g.step(0);
      g.sim.act(s, 'skip:chunk', g.bus, ctxOf(g));
      const again = g.facts('skip-start').length;
      g.step(1);
      const w2 = g.facts('skip-end').at(-1);
      assert(again === 2 && w2.activity === 'wait' && w2.fromMs === w.toMs, `carry on: ${again} starts, ${JSON.stringify({ from: w2.fromMs, was: w.toMs })}`);
      // (a door at hand: at once, no skip)
      put(g, 57.7, 8.6, 'up');
      const before = openingState(s, 'o:e1:bay-2-1'), starts = g.facts('skip-start').length;
      g.step(1, { act: [{ act: 'hand', args: { want: 'door' } }] });
      assert(openingState(s, 'o:e1:bay-2-1') !== before && g.facts('skip-start').length === starts, 'the door');
      // (the offer changed kind by the tick: a 'wait' sent at a door, an 'activity' sent mid-aisle)
      const st2 = g.facts('skip-start').length, open2 = openingState(s, 'o:e1:bay-2-1');
      g.step(1, { act: [{ act: 'hand', args: { want: 'wait' } }] });
      put(g, 55.75, 3.95, 'down');
      g.step(1, { act: [{ act: 'hand', args: { want: 'activity' } }] });
      assert(g.facts('skip-start').length === st2 && openingState(s, 'o:e1:bay-2-1') === open2 && !s.time.doing, 'a changed offer did something');
      console.log(`      R's wait: ${w.minutes} min (mask ${ws.mask}, chunk ${ws.chunkMs / 60000} min, carry on offered ${w.outcome.chunk.offerMs} ms), carried on to ${fmt((w2.toMs - t0) / MIN_MS, 0)} min; the bay door ${before} → ${openingState(s, 'o:e1:bay-2-1') === before ? before : 'turned'} at once; a 'wait' at a door and an 'activity' mid-aisle did nothing`);
      // (R gets you up from the rack: the rise plays, the feet held through it)
      const g4 = createGame({ scenario: 'test-night', seed: SEED });
      g4.step(1, { act: [{ act: 'hand', args: { want: 'activity' } }] });
      const me = g4.me();
      g4.step(1, { act: [{ act: 'hand', args: { want: 'rise' } }] });
      const tr = me.trans;
      const held = feetHeld(g4.state);
      g4.step(Math.ceil(tr.ms / TICK_MS) + 2);
      assert(tr?.kind === 'rise' && held && (me.posture ?? 'stand') === 'stand' && !feetHeld(g4.state) && Math.abs(me.z - 3.3) < 1e-6, JSON.stringify({ tr, me }));
      console.log(`      at the klaxon in the rack, R: a ${tr.kind} of ${tr.ms} ms from (${tr.from.x}, ${tr.from.z}, y ${tr.from.y}) to (${me.x}, ${me.z}), the feet held through it`);
    },
  },
  {
    name: 'a drink at a tap is a fast-forward behind the brief splash (30 s, over LIVE_MAX_MS 10 s: the user, 2026-11-07); forced live it runs at 1:1, the feet held, and a move key cuts it at its fraction, the water taken by it',
    fn() {
      const g = createGame({ scenario: 'barracks', seed: SEED, hour: 19.5 });
      const s = g.state, pid = s.player.id;
      at(g, 'f:e1:head-2a:sinks-1#2');
      const water = () => { const w = bodyOf(s, pid).water; return w.balanceL + (w.gutL ?? 0); };   // (the body's water and what is still in the gut)
      const b0 = water();
      // (its own kind is 'ff' now; the 1:1 engine, still every action's up to 10 s, is pinned by forcing it)
      const own = planOf(s, 'drink', { spotId: 'f:e1:head-2a:sinks-1#2' });
      assert(own.kind === 'ff', JSON.stringify({ kind: own.kind, durMs: own.durMs }));
      const r = startActivity(s, g.bus, ctxOf(g), { id: 'drink', spotId: 'f:e1:head-2a:sinks-1#2', force: 'live' });
      assert(r.ok && r.kind === 'live' && !s.skip && s.time.doing?.mode === 'live' && feetHeld(s), JSON.stringify(r));
      const n = activityNow(s);
      g.step(20 * 30 + 2);
      const end = g.facts('activity').at(-1), b1 = water();
      assert(end.phase === 'end' && end.fraction === 1 && !s.time.doing && b1 - b0 > 0.45, JSON.stringify({ end, b0, b1 }));
      // (again, cut by a move key at 12 s)
      const r2 = startActivity(s, g.bus, ctxOf(g), { id: 'drink', spotId: 'f:e1:head-2a:sinks-1#2', force: 'live' });
      const b2 = water();
      g.step(20 * 12);
      g.step(1, { mx: 1 });
      const cut = g.facts('activity').at(-1), b3 = water();
      assert(r2.ok && cut.phase === 'end' && cut.by === 'player' && Math.abs(cut.fraction - 12 / 30) < 0.01 && b3 - b2 > 0.19 && b3 - b2 < 0.22, JSON.stringify({ cut, gained: b3 - b2 }));
      console.log(`      lived ${durationText(end.toMs - end.fromMs)} (part '${n.part}', MET ${n.met}, ${n.posture}): water (balance and gut) ${fmt(b0, 3)} → ${fmt(b1, 3)} L; cut by a move key at ${fmt(cut.fraction * 30, 1)} s: +${fmt(b3 - b2, 3)} L (0.5 L × ${fmt(cut.fraction, 3)}, less what the body lost meanwhile)`);
    },
  },
];
