// A magazine reached for, its kind of round, and the magazines drawn slimmer (src/sim/arms/firearms.js, kit.js, drills.js, calibres.js; src/art/weaponcard.js, figures/templates.js; the user, 2026-11-07: "There should be some way to select which mag we put in as well because we may have different types of rounds in inventory, putting magazine in should be a "Reach for magazine" (or equivalent) and when we have the mag we reached for, we see if it has ammo in and which kind before we decide to either put it away again, drop it or put it in" and "on the gun drawing, the magazines are very long, if they could be a bit slicker it would be nice"; DESIGN.md's log). v0.0.5's magazine in split into its reach and its seat, the total unchanged; the weight felt in the hand and the look at the witness holes and the feed lips; the steps for a magazine in hand; the drills' rule; test-handling's setup 'mixed' with its tracer; the tracer drawn; the magazines' pixels before and after.
import { assert, fmt } from './helpers.mjs';
import { armsWorld } from './arms-world.mjs';
import { createGame } from './game.mjs';
import { fixedRoller } from '../src/sim/combat/roll.js';
import { actionMs, doAction, canDo, beliefOf, feelOf, FEEL_WORDS, ACTIONS, REACH_S, SEAT_S, PICKUP_DUST, MAG_DROP_WEAR, newMag } from '../src/sim/arms/firearms.js';
import { MACROS, macroMs, subsOf, runMacro } from '../src/sim/arms/drills.js';
import { move, kitView, pouchesOf, handMagOf, holderOf, pickMag, rankOf, atFeetOf } from '../src/sim/arms/kit.js';
import { LIVE_LOADS, loadOf } from '../src/sim/arms/calibres.js';
import { resolveShot, } from '../src/sim/arms/shot.js';
import { targetsOf, stepsOf } from '../src/sim/arms/shooting.js';
import { recordShot, rangeNow } from '../src/sim/scenarios/handling.js';
import { rangeLook } from '../src/sim/arms/look.js';
import { rangeBot } from './bots/range.mjs';
import { tracePixels, brassPixels, decalPixels, EMBER } from '../src/render/range-items.js';
import { KD_RANGE } from '../src/data/places/range.js';
import { tilesOf, magIcon } from '../src/ui/cards/inventory.js';
import { weaponCardModel } from '../src/ui/hud/steps.js';
import { paintWeaponCard, cardParts, MAG_SHOWN_M, MAG_HIDDEN_M, MAG_W_PX, MAG_CURVE_PX, CARD_PX_PER_M } from '../src/art/weaponcard.js';
import { shapeAt } from '../src/art/figures/templates.js';
import { MODELS, FAMILIES } from '../src/sim/arms/models.js';

const R7 = { type: 'gun', model: 'r7' };
const pass = (a) => ({ [a.split('@')[0]]: 'pass' });
const act = (W, action, force = true) => doAction(W.state, W.bus, { pid: W.pid, gunId: W.gunId, action, ...(force ? { force: pass(action) } : {}) });
const handOf = (W) => handMagOf(W.state, W.pid);
// (v0.0.5's magazine drawn, measured from its own code at its tag: the card's pixels with it in against out, and the figure's cells)
const V005 = Object.freeze({ cardPx: 416, cardBox: [27, 38], fig16: 4, fig24: 12 });

export default [
  {
    name: 'Reach for a magazine and Magazine in make v0.0.5\'s magazine in (the user, 2026-11-07: "putting magazine in should be a "Reach for magazine" (or equivalent)"): 0.6 + 0.8 s at value 10, both × LONG_K, 690 + 920 = 1,610 ms; within 1 ms at every tier; LOAD 2.41 s and the RELOADs 2.53, 2.99, 3.22 s as before; the reach rolls nothing, the seat the old DC 9; a pickup off the ground 1.0 s',
    fn() {
      const rows = [];
      let worst = 0;
      for (const wh of [3, 7, 10, 15, 20, 25, 30]) {
        const r = fixedRoller({ weapons: wh }), reach = actionMs(r, R7, 'reach@p1'), seat = actionMs(r, R7, 'seat'), whole = actionMs(r, R7, 'magIn');
        worst = Math.max(worst, Math.abs(reach + seat - whole));
        rows.push(`WH ${wh}: ${reach} + ${seat} = ${reach + seat} (v0.0.5's ${whole}); off the ground ${actionMs(r, R7, 'reach@ground')}`);
      }
      const r10 = fixedRoller({ weapons: 10 }), out = { mag: 'out', chamber: 'empty', locked: false }, dry = { mag: 'in', chamber: 'empty', locked: true, count: 0 }, part = { mag: 'in', chamber: 'live', count: 2 };
      const drills = { LOAD: macroMs(r10, R7, 'load', out), 'RELOAD speed': macroMs(r10, R7, 'reload:speed', dry), 'RELOAD retain': macroMs(r10, R7, 'reload:retain', dry), 'RELOAD tactical': macroMs(r10, R7, 'reload:tactical', part) };
      console.log(`      ${rows.join('\n      ')}`);
      console.log(`      at value 10: ${Object.entries(drills).map(([k, v]) => `${k} ${fmt(v / 1000, 2)} s (${MACROS[{ LOAD: 'load', 'RELOAD speed': 'reload:speed', 'RELOAD retain': 'reload:retain', 'RELOAD tactical': 'reload:tactical' }[k]].subs.join(', ')})`).join('; ')}`);
      // (each sub-step rounded to its whole millisecond (TIME §4.3), so the two may make one more than the whole; a step
      // lives whole ticks, so LOAD and the RELOADs live the ticks they lived in v0.0.5)
      const old = { LOAD: 2 * actionMs(r10, R7, 'selector:safe') + actionMs(r10, R7, 'magIn'), 'RELOAD speed': actionMs(r10, R7, 'magOut:drop') + actionMs(r10, R7, 'magIn') + actionMs(r10, R7, 'release'),
        'RELOAD retain': actionMs(r10, R7, 'magOut:dump') + actionMs(r10, R7, 'magIn') + actionMs(r10, R7, 'release'), 'RELOAD tactical': actionMs(r10, R7, 'magOut:pouch') + actionMs(r10, R7, 'magIn') };
      const ticks = (ms) => Math.ceil(ms / 50);
      assert(REACH_S + SEAT_S === ACTIONS.magIn.s && worst <= 1 && actionMs(r10, R7, 'reach@ground') === 1001, JSON.stringify({ worst }));
      assert(Object.keys(old).every(k => Math.abs(drills[k] - old[k]) <= 1 && ticks(drills[k]) === ticks(old[k])) && Math.round(drills.LOAD / 10) === 241 && Math.round(drills['RELOAD speed'] / 10) === 253 && Math.round(drills['RELOAD retain'] / 10) === 299 && Math.round(drills['RELOAD tactical'] / 10) === 322, JSON.stringify({ drills, old }));
      assert(ACTIONS.reach.dc === null && ACTIONS.seat.dc === 9 && MACROS.load.subs.join() === 'selector:safe,reach,seat,port' && MACROS.remedial.subs.includes('magIn'), 'the reach rolls nothing; REMEDIAL keeps its magazine in');
    },
  },
  {
    name: 'in the hand you learn what it holds (the user, 2026-11-07: "when we have the mag we reached for, we see if it has ammo in and which kind"): its weight felt, none, a few, about half, nearly full, full; a look at its witness holes and feed lips the count and the top round\'s kind ("5 rounds, ball on top: a bare copper tip", "tracer on top: a red tip"); a weight unlike the count believed makes it unknown and stops the drill',
    fn() {
      const bands = [];
      for (let n = 0; n <= 30; n++) { const b = feelOf(n, 30); if (!bands.length || bands.at(-1)[0] !== b) bands.push([b, n, n]); else bands.at(-1)[2] = n; }
      console.log(`      a HAD-30's weight by its rounds: ${bands.map(([b, a, z]) => `${a === z ? a : `${a} to ${z}`} ${FEEL_WORDS[b]}`).join(', ')}`);
      assert(bands.map(b => b[0]).join() === 'none,few,half,most,full' && feelOf(5, 30) === 'few', JSON.stringify(bands));
      // (the range's magazine of five, told: reached for from chest pouch 1, felt, looked at)
      const W = armsWorld({ wh: 10 }), { state } = W;
      const r1 = act(W, 'reach@p1'), h1 = handOf(W), b1 = beliefOf(state, W.gunId).hand;
      const l1 = act(W, 'lookMag'), b2 = beliefOf(state, W.gunId).hand;
      console.log(`      reach@p1: ${r1.ms} ms, "${r1.text}" → the hand ${JSON.stringify(b1)}; look ${l1.ms} ms, "${l1.text}" → ${JSON.stringify(b2)}`);
      assert(h1 && r1.text === 'From chest pouch 1. Light: a few rounds in it.' && b1.n === 5 && l1.text === '5 rounds, ball on top: a bare copper tip.' && b2.load === 'ball' && b2.n === 5, JSON.stringify({ r1: r1.text, l1: l1.text, b2 }));
      act(W, 'stowMag@p1');
      // (a tracer magazine never counted: the hand feels it, the look tells)
      const tid = newMag(state, { fam: 'had30', n: 24, load: 'tracer', told: false });
      move(state, tid, { container: pouchesOf(state, W.pid).find(p => p.key === 'p2').id });
      move(state, state.items[pouchesOf(state, W.pid).find(p => p.key === 'p2').id].holds[0], { container: pouchesOf(state, W.pid).find(p => p.key === 'dump').id });
      const r2 = act(W, 'reach@p2'), f2 = beliefOf(state, W.gunId).hand, l2 = act(W, 'lookMag'), t2 = beliefOf(state, W.gunId).hand;
      console.log(`      an uncounted tracer magazine: "${r2.text}" → ${JSON.stringify(f2)}; "${l2.text}" → ${JSON.stringify(t2)}`);
      assert(f2.n === null && f2.feel === 'most' && f2.load === null && /^About (23|24|25) rounds, tracer on top: a red tip\.$/.test(l2.text) && t2.load === 'tracer' && t2.approx && !t2.feel, JSON.stringify({ f2, l2: l2.text, t2 }));
      // (believed five, in truth none: the hand finds it out and the drill stops there)
      const V = armsWorld({ wh: 10 }), first = pickMag(V.state, V.pid, { from: 'rule' });
      V.state.items[first.id].n = 0;
      const run = runMacro(V.state, V.bus, { macro: 'load', pid: V.pid, gunId: V.gunId });
      console.log(`      LOAD with a magazine believed 5 and empty: ${run.subs.map(x => `${x.action} "${x.text}"`).join(', ')}; halted ${JSON.stringify(run.halted)}, the rest ${run.queue.join(', ')}; the hand ${JSON.stringify(beliefOf(V.state, V.gunId).hand)}`);
      assert(run.halted?.at === 'reach' && run.queue.join() === 'seat,port' && run.subs.at(-1).text === 'From chest pouch 1. It feels empty. You thought 5 rounds.' && beliefOf(V.state, V.gunId).hand.n === null && beliefOf(V.state, V.gunId).hand.feel === 'none', JSON.stringify(run));
    },
  },
  {
    name: 'then you decide (the user, 2026-11-07: "either put it away again, drop it or put it in"): with a magazine in hand the panel offers Magazine in, Look at it, Put it back in each chest pouch with room, Dump it and Drop it, and no reach; each puts it where it says, every item held once; dropped on the firing point\'s paving it takes the drop\'s wear, lying on the regolith at your feet and picked up it takes its dust (+0.1); one dumped with rounds is reached from the dump pouch and goes in',
    fn() {
      const W = armsWorld({ wh: 10 }), { state } = W;
      state.items[W.magIds[2]].belief = { n: 5 };
      const free = canDo(state, W.pid, W.gunId).filter(a => /^(reach|seat|lookMag|stowMag|dumpMag|dropMag)/.test(a));
      act(W, 'reach@p1');
      const held = canDo(state, W.pid, W.gunId).filter(a => /^(reach|seat|lookMag|stowMag|dumpMag|dropMag)/.test(a));
      console.log(`      a hand free: ${free.join(', ')}; a magazine in it: ${held.join(', ')}`);
      assert(free.join() === 'reach@p1,reach@p2' && held.join() === 'seat,lookMag,stowMag@p1,stowMag@p2,dumpMag,dropMag', JSON.stringify({ free, held }));
      const id = handOf(W).id, where = () => { const h = holderOf(state, id); return h?.container ? pouchesOf(state, W.pid).find(p => p.id === h.container)?.key : h?.ground ? 'ground' : h?.hand !== undefined ? 'hand' : h?.gun ? 'gun' : '?'; };
      const trail = [];
      act(W, 'stowMag@p2'); trail.push(where());
      act(W, 'reach@p2'); trail.push(where() === 'p2' && handOf(W).id === W.magIds[2] ? 'p2 (the front one first)' : '?');
      act(W, 'stowMag@p2'); act(W, 'reach@p2'); trail.push(where());
      act(W, 'dumpMag'); trail.push(where());
      act(W, 'reach@dump'); trail.push(where());
      const cond0 = state.items[id].cond ?? 0.95, dust0 = state.items[id].dust ?? 0;
      act(W, 'dropMag'); trail.push(where());
      const cond1 = state.items[id].cond ?? 0.95, feet = atFeetOf(state, W.pid).map(l => `${l.id} ${fmt(l.dM, 2)} m`);
      // (the firing point is paved within reach: the marine stepped 3 m ahead onto the regolith, the magazine at their feet there)
      const me = state.actors.list.find(a => a.who === W.pid);
      me.x += 3;
      move(state, id, { ground: { area: 'melas.ground', x: me.x + 0.3, z: me.z } });
      const pick = act(W, 'reach@ground'); trail.push(where());
      const seat = act(W, 'seat'); trail.push(where());
      console.log(`      ${id}: put back in chest pouch 2 (behind the one there), reached again (the front one came), put back, reached again, dumped, reached from the dump, dropped on the paving (at your feet: ${feet.join(', ')}), then lying on the regolith 3 m ahead at the marine's feet there, picked up ("${pick.text}", ${pick.ms} ms), seated ("${seat.text}"): ${trail.join(' → ')}; its condition ${cond0} → ${cond1} by the drop, its dust ${dust0} → ${state.items[id].dust}`);
      assert(trail.join() === 'p2,p2 (the front one first),hand,dump,hand,ground,hand,gun' && Math.abs(cond0 - MAG_DROP_WEAR - cond1) < 1e-9 && state.items[id].dust === dust0 + PICKUP_DUST && /^A magazine in: 5 rounds\.$/.test(seat.text), JSON.stringify({ trail, cond1, dust: state.items[id].dust }));
      assert(MAG_DROP_WEAR > 0 && Object.keys(state.items).filter(k => state.items[k].type === 'mag').every(k => holderOf(state, k)), 'every magazine held');
    },
  },
  {
    name: 'LOAD and the RELOADs reach by rule (the user, 2026-11-07: "some way to select which mag we put in"): the kind the gun is meant to fire first (ball on the range), then a kind not known, then another; the fullest believed within it; a magazine already in hand is seated with no reach',
    fn() {
      const W = armsWorld({ wh: 10 }), { state } = W, ids = W.magIds;
      // (chest pouch 1: a tracer believed 5 and a ball believed 3; chest pouch 2: one of 5 whose kind is not known)
      state.items[ids[0]].load = 'tracer'; state.items[ids[0]].belief = { n: 5, kind: 'tracer' };
      state.items[ids[1]].n = 3; state.items[ids[1]].belief = { n: 3, kind: 'ball' };
      state.items[ids[2]].belief = { n: 5 };
      const order = rankOf(state, ids, { load: 'ball' }), word = (id) => `${state.items[id].belief?.kind ?? '?'} ${state.items[id].belief.n}`, said = order.map(word);
      const run = runMacro(state, W.bus, { macro: 'load', pid: W.pid, gunId: W.gunId, force: { reach: 'pass', seat: 'pass' } });
      console.log(`      by the rule for ball: ${said.join(', ')}; LOAD took ${state.items[W.gunId].mag === ids[1] ? 'the ball of 3' : state.items[W.gunId].mag}: ${run.subs.map(x => x.action).join(', ')}`);
      assert(order.join() === [ids[1], ids[2], ids[0]].join() && state.items[W.gunId].mag === ids[1], JSON.stringify(order));
      const V = armsWorld({ wh: 10 });
      act(V, 'reach@p2');
      const b = beliefOf(V.state, V.gunId), subs = subsOf('load', b), r = runMacro(V.state, V.bus, { macro: 'load', pid: V.pid, gunId: V.gunId });
      console.log(`      a magazine already in hand: LOAD's steps ${subs.join(', ')}; it seated ${V.state.items[V.gunId].mag === V.magIds[2] ? 'the one in hand' : 'ANOTHER'}`);
      assert(!subs.includes('reach') && V.state.items[V.gunId].mag === V.magIds[2] && !r.halted, JSON.stringify({ subs, r }));
      // (an empty is never a drill's choice, whatever its kind: the arms role's play of setup 'mixed', where "RELOAD, keep the
      // empty" reached for the ball magazine it had just dumped, believed empty, over full ones of a kind not known)
      const E = armsWorld({ wh: 10 }), es = E.state;
      es.items[E.magIds[0]].n = 0; es.items[E.magIds[0]].belief = { n: 0, kind: 'ball' };
      es.items[E.magIds[1]].belief = { n: 5 }; es.items[E.magIds[2]].belief = { n: 5 };
      move(es, E.magIds[0], { container: pouchesOf(es, E.pid).find(p => p.key === 'dump').id });
      const rule = pickMag(es, E.pid, { from: 'rule' });
      console.log(`      an empty believed ball in the dump pouch, two of 5 whose kind is not known: the rule takes ${rule.id === E.magIds[0] ? 'THE EMPTY' : `a full one from ${rule.from}`}`);
      assert(rule.id !== E.magIds[0] && rule.from === 'p1', JSON.stringify(rule));
    },
  },
  {
    name: 'setup \'mixed\' played to its end (the user, 2026-11-07: "we see if it has ammo in and which kind before we decide"): at LOAD the hand reaches chest pouch 2, looks, puts the ball back, reaches again, finds the tracer and puts it back; then the drills fire the course on ball, never the tracer, with no fault, its RELOADs never reaching an empty',
    fn() {
      for (const seed of [48213, 7]) {
        const g = createGame({ scenario: 'test-handling', seed, hour: 9, setup: 'mixed' }), bot = rangeBot();
        const script = ['reach@p2', 'lookMag', 'stowMag@p2', 'reach@p2', 'lookMag', 'stowMag@p2'];
        let si = 0;
        const played = (s, me, mem) => (si < script.length && s.stop?.phase === 'choose' && rangeNow(s).cmd === 'load' ? { act: [{ act: 'stop', args: { step: script[si++], tempo: 'normal' } }] } : bot(s, me, mem));
        for (let t = 0; t < 20 * 900 && !g.me().bot?.done; t++) g.step(1, played);
        const s = g.state, R = rangeNow(s), looks = s.log.filter(e => e.step === 'lookMag').map(e => e.text), reaches = s.log.filter(e => e.step === 'reach').map(e => e.text);
        const issues = s.armoury.ammoIssues.map(a => `${a.load} ${a.fired} of ${a.n}`);
        console.log(`      seed ${seed}: the looks ${looks.map(t => `"${t}"`).join(', ')}; the reaches ${reaches.length} (${reaches.filter(t => /empty/.test(t)).length} empty); ${R.end?.phase}, ${R.summary.score} of ${R.summary.of}, faults ${s.armoury.range.faults.length}; fired ${issues.join(', ')}`);
        assert(/ball on top/.test(looks[0]) && /tracer on top: a red tip/.test(looks[1]) && R.end?.phase === 'clear' && !s.armoury.range.faults.length && !reaches.some(t => /empty/.test(t)) && /^tracer 0 of 5$/.test(issues[1]) && R.summary.shots >= 14, JSON.stringify({ looks, reaches, end: R.end, issues }));
      }
    },
  },
  {
    name: 'test-handling\'s setup \'mixed\' (my call, the user\'s "we may have different types of rounds in inventory", 2026-11-07): a fourth magazine of tracer, the counts told and the kinds not; I says "5 in it, kind not seen" under each chest pouch\'s name; chest pouch 2 reached and looked at is ball, put back, reached again the tracer, put back; I then says ball and tracer; LOAD by rule never takes the tracer; a tracer fired counts on its own issue and its ember is drawn to the card; a tracer thrown out lies with its red tip',
    fn() {
      const g = createGame({ scenario: 'test-handling', seed: 48213, hour: 9, setup: 'mixed' }), s = g.state, pid = s.player.id, gunId = s.people[pid].kit.worn.sling;
      const issues = s.armoury.ammoIssues.map(a => `${a.load} ${a.n}`), lines = (v) => tilesOf(v).groups.filter(x => x.items.some(i => i.kind === 'mag')).map(x => `${x.word}: ${x.items.map(i => i.says).join('; ')}`);
      const before = lines(kitView(s, pid));
      s.people[pid].kit.carry.posture = 'lowReady';
      const W = { state: s, bus: g.bus, pid, gunId };
      const seen = [];
      for (const a of ['reach@p2', 'lookMag', 'stowMag@p2', 'reach@p2', 'lookMag', 'stowMag@p2']) { const r = act(W, a); seen.push(`${a} "${r.text}"`); }
      const after = lines(kitView(s, pid));
      console.log(`      issued ${issues.join(', ')}; I before: ${before.join(' | ')}`);
      console.log(`      ${seen.join(', ')}`);
      console.log(`      I after: ${after.join(' | ')}`);
      assert(issues.join() === 'ball 15,tracer 5' && before.every(l => /kind not seen/.test(l)) && /^Chest pouch|^chest pouch/.test(before[0]) && /tracer on top: a red tip/.test(seen[4]) && /ball on top/.test(seen[1]) && after.some(l => /tracer/.test(l)) && after.some(l => /ball/.test(l)), JSON.stringify({ issues, before, seen, after }));
      const tracerId = Object.keys(s.items).find(k => s.items[k].load === 'tracer');
      const ruled = pickMag(s, pid, { from: 'rule' });
      assert(ruled.id !== tracerId, 'LOAD by rule would take the tracer');
      // (the tracer in by hand, charged, fired at your card: its load on the shot, its issue counted, its ember)
      move(s, tracerId, { pid, hand: 1 });
      for (const a of ['seat', 'charge', 'selector:semi']) act(W, a);
      const T = targetsOf(s, pid).find(t => t.key === `paper:${s.armoury.range.lane}`);
      s.armoury.range.hot = true; s.armoury.range.string = 0;
      const { shot } = resolveShot(s, g.bus, { pid, gunId, target: T });
      recordShot(s, g.bus, shot);
      const fire = rangeLook(s, shot.atMs + 10).fire, lane = KD_RANGE.bay.lanes.find(l => l.lane === s.armoury.range.lane);
      const ember = tracePixels(fire, shot.atMs + 10, 16, lane.target), ball = tracePixels({ ...fire, load: undefined }, shot.atMs + 10, 16, lane.target), late = tracePixels(fire, shot.atMs + 60, 16, lane.target);
      const counted = s.armoury.ammoIssues.map(a => `${a.load} ${a.fired} of ${a.n}`);
      console.log(`      a tracer fired: shot.load ${shot.load}; issues ${counted.join(', ')}; at +10 ms ${ember.length} ember pixels (${[...new Set(ember.map(p => p.c.toString(16)))].join(', ')}), ball's ${ball.length}, at +60 ms ${late.length}`);
      assert(shot.load === 'tracer' && counted.join() === 'ball 0 of 15,tracer 1 of 5' && ember.length >= 20 && ember.every(p => p.c === EMBER) && !ball.length && !late.length, JSON.stringify({ shot: shot.load, counted }));
      const out = act(W, 'charge'), lying = brassPixels({ x: 1, y: 0, z: 1, kind: out.ejected, rest: true, rotRad: 0 }, 16), decal = decalPixels({ kind: 'tracer', x: 1, z: 1 }, 16);
      console.log(`      a live tracer charged out: '${out.ejected}', lying ${lying.map(p => p.c.toString(16)).join(' ')}; its decal ${decal.length} pixels`);
      assert(out.ejected === 'tracer' && lying.some(p => p.c === 0xc23b2e) && decal.some(p => p.c === 0xc23b2e), out.ejected);
      assert(LIVE_LOADS['6.5x40r'].join() === 'ball,tracer' && loadOf('6.5x40r', 'tracer').tip === 0xc23b2e && loadOf('6.5x40r', 'ball').tip === null, 'the kinds as data');
    },
  },
  {
    name: 'the magazines drawn shorter (the user, 2026-11-07: "on the gun drawing, the magazines are very long, if they could be a bit slicker it would be nice") and as wide as they scored the standard issue\'s (2026-11-08, G2 ★ 95, "make this the standard issue"): on the weapon card at 144 px/m the HAD-30\'s 0.21 m is 0.045 m up in the well and 0.165 m below it, 9 px wide, curving 5, against v0.0.5\'s whole 0.21 m below the well, 9 px wide, curving 14; on the figure\'s rifle 2 cells at 16 px/m and 7 at 24, against 4 and 12',
    fn() {
      const b = { model: 'r7', short: 'R-7', chamber: 'live', mag: 'in', count: 5, mode: 'safe', port: 'closed' };
      const a = paintWeaponCard({ model: 'r7', belief: b }), o = paintWeaponCard({ model: 'r7', belief: { ...b, mag: 'out', count: null } });
      let n = 0, x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
      for (let y = 0; y < 108; y++) for (let x = 0; x < a.w; x++) if (a.data[y * a.w + x] !== o.data[y * a.w + x]) { n++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      const fig16 = shapeAt('rifle', 16, 1, true).length - shapeAt('rifle', 16, 1, false).length, fig24 = shapeAt('rifle', 24, 1.5, true).length - shapeAt('rifle', 24, 1.5, false).length;
      const shownPx = Math.round(MAG_SHOWN_M * CARD_PX_PER_M), rifle = MODELS.r7.lenCm, magCm = FAMILIES.had30.lenCm;
      console.log(`      the card (${CARD_PX_PER_M} px/m, the ${rifle} cm rifle ${Math.round(rifle / 100 * CARD_PX_PER_M)} px): the magazine ${shownPx} px below the well (${fmt(MAG_SHOWN_M * 100, 1)} cm) + a 2-px baseplate, ${MAG_W_PX} px wide (${fmt(MAG_W_PX / CARD_PX_PER_M * 100, 1)} cm), curving ${MAG_CURVE_PX} px; ${fmt(MAG_HIDDEN_M * 100, 1)} cm up in the well make its ${magCm} cm`);
      console.log(`      its pixels with the shadow and the ink: ${n} in a ${x1 - x0 + 1} × ${y1 - y0 + 1} box (v0.0.5: ${V005.cardPx} in ${V005.cardBox.join(' × ')}); the figure's magazine ${fig16} cells at 16 px/m and ${fig24} at 24 (v0.0.5: ${V005.fig16} and ${V005.fig24})`);
      // (0.0.12, my call: the later pick wins, so the magazine is G2's 9 px, not v0.0.6's 7; the bound of v0.0.6 to v0.0.11, under
      // 0.75 of v0.0.5's pixels (312), is superseded by 0.9 (374: 353 drawn), the box under 0.85 of v0.0.5's height and 0.75 of its
      // width; MAG_W_PX back to 7 in src/art/rifles.js undoes it, should the user's 2026-11-07 ask win)
      assert(Math.abs(MAG_SHOWN_M + MAG_HIDDEN_M - magCm / 100) < 1e-9 && n < V005.cardPx * 0.9 && y1 - y0 + 1 < V005.cardBox[1] * 0.85 && x1 - x0 + 1 < V005.cardBox[0] * 0.75 && fig16 === 2 && fig24 === 7, JSON.stringify({ n, box: [x1 - x0 + 1, y1 - y0 + 1], fig16, fig24 }));
    },
  },
  {
    name: 'the weapon card shows the magazine in hand as believed (the user, 2026-11-07): its count, its weight\'s band when not counted, "?" when nothing is known, "TR" when tracer; the line says "HAND 5 TR"; the hand\'s truth never shows; the I card\'s icon tips a tracer\'s top round red',
    fn() {
      const base = { model: 'r7', short: 'R-7', chamber: 'empty', mag: 'out', count: null, mode: 'safe', locked: true, port: 'open', stoppage: null };
      const card = (b) => paintWeaponCard({ model: 'r7', belief: b }), diff = (p, q) => { let d = 0; for (let i = 0; i < p.data.length; i++) if (p.data[i] !== q.data[i]) d++; return d; };
      const none = card(base), variants = { 'hand 5 ball': { n: 5, load: 'ball' }, 'hand 5 tracer': { n: 5, load: 'tracer' }, 'hand a few': { n: null, feel: 'few' }, 'hand ?': { n: null } };
      const rows = Object.entries(variants).map(([k, h]) => [k, diff(none, card({ ...base, hand: h })), weaponCardModel({ ...base, hand: h }).line, cardParts({ ...base, hand: h }).hand]);
      console.log(`      ${rows.map(([k, d, line]) => `${k}: ${d} px, "${line}"`).join('; ')}`);
      assert(rows.every(r => r[1] > 0) && rows[1][2] === 'SAFE · 0 + OUT · LOCKED · HAND 5 TR' && rows[2][2].endsWith('HAND A FEW') && rows[3][2].endsWith('HAND ?') && diff(card({ ...base, hand: variants['hand 5 ball'] }), card({ ...base, hand: variants['hand 5 tracer'] })) > 0, JSON.stringify(rows));
      const W = armsWorld({ wh: 10 });
      act(W, 'reach@p1');
      W.state.items[handOf(W).id].n = 0;                                 // (the truth changed under the hand's belief)
      const b = beliefOf(W.state, W.gunId);
      assert(b.hand.n === 5 && !('cond' in b.hand) && Object.keys(b.hand).sort().join() === 'approx,cap,fam,feel,load,n', JSON.stringify(b.hand));
      const ic = (load) => magIcon({ n: 5, load }), at = (buf) => buf.data[2 * 7 + 3];
      assert(at(ic('tracer')) !== at(ic('ball')) && at(ic(null)) !== at(ic('ball')), 'the icon\'s top round');
    },
  },
  {
    name: 'a double feed\'s REMEDIAL ACTION carries no "one magazine a string" mark (the fixer\'s, 0.0.6): it strips the rifle\'s own magazine and seats that one again, the right drill, never warned away from',
    fn() {
      const g = createGame({ scenario: 'test-handling', seed: 48213, hour: 9, setup: 'hot' }), s = g.state, R = s.armoury.range;
      const gunId = s.people[s.player.id].kit.worn.sling, gun = s.items[gunId];
      R.strMag = gun.mag;                                   // (the string's magazine, as its commence fire would have set it)
      gun.jam = 'double'; gun.belief = { ...(gun.belief ?? {}), stoppage: 'double', chamber: 'case' };
      s.stop.phase = 'choose'; s.stop.doing = null;
      const steps = stepsOf(s), rem = steps.find(x => x.id === 'macro:remedial'), other = steps.filter(x => x.warn).map(x => `${x.id} [${x.warn}]`);
      console.log(`      the double feed: ${rem ? `${rem.label} ${rem.warn ? `[${rem.warn}]` : 'unmarked'}` : 'no REMEDIAL ACTION'}; marked: ${other.join(', ') || 'none'}`);
      assert(rem && !rem.warn, JSON.stringify(rem));
    },
  },
  {
    name: 'setup \'mixed\': the tracer looked at and in the hand, its "Magazine in" is marked "! tracer: the course is ball", never struck; seated, the coach says once "That\'s your tracer. The course is ball: change it before you fire.", no fault (the fixer\'s, 0.0.6: the user\'s "we see if it has ammo in and which kind before we decide" given its moment)',
    fn() {
      const g = createGame({ scenario: 'test-handling', seed: 48213, hour: 9, setup: 'mixed' }), s = g.state, then = rangeBot();
      let marked = null, seated = false, looks = 0;
      const bot = (state, me, mem) => {
        const R = rangeNow(state);
        if (!R || R.end) { mem.done = true; return {}; }
        const S = state.stop;
        if (seated || R.cmd !== 'load' || !S || S.mode !== 'stop' || S.phase !== 'choose') return then(state, me, mem);
        const steps = stepsOf(state), has = (id) => steps.find(x => x.id === id && !x.off), hand = handMagOf(state, state.player.id);
        const pick = (id) => ({ act: [{ act: 'stop', args: { step: id, tempo: 'normal' } }] });
        if (!hand) return has('reach@p2') ? pick('reach@p2') : then(state, me, mem);
        const m = state.items[hand.id];
        if (!m.belief?.kind && has('lookMag') && looks < 4) { looks++; return pick('lookMag'); }
        if (m.belief?.kind && m.belief.kind !== 'tracer') return pick('stowMag@p2');
        const seat = has('seat');
        marked = seat?.warn ?? null; seated = true;
        return pick('seat');
      };
      for (let t = 0; t < 20 * 60 * 20 && !g.me().bot?.done; t++) g.step(1, bot);
      const raw = s.armoury.range, lines = s.log.filter(e => e.kind === 'say' && e.say === 'speech').map(e => e.text), kind = lines.filter(l => /tracer/.test(l) && /change it/.test(l));
      console.log(`      the seat's row marked "${marked}"; the coach "${kind[0]}" ×${kind.length}; faults ${raw.faults.map(f => f.rule).join(', ') || 'none'}; the end ${raw.end?.phase}`);
      assert(marked === 'tracer: the course is ball' && kind.length === 1 && raw.faults.every(f => f.rule !== 'kind') && raw.end?.phase === 'clear', JSON.stringify({ marked, kind, faults: raw.faults, end: raw.end }));
    },
  },
];
