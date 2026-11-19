// OLYMPUS tests: "Stack and clear, live"'s clear gate and the instructor's calls on a live man (COMBAT §25.18; the build sheet v0.0.19 §1 L-house, §6): a man down, a man who gave up, a room reopened, legOf against manPlace.
//
// The house reads a role-player through combat/men.js only (gateWhy, accountedOf, coverTick, seenK) and rules him out through
// opfor.js ruleOut; these cases drive the scene's own functions on a lane set up at a door (shoothouse.js setupHouse, time
// standing still in stop motion), the man put down by the house's own sensor path (houseShot's two torso rounds), and each fails
// without the hook it names. The last case runs the tier one's lane and holds legOf (by his stand) and room.js manPlace (by where
// he stands) to the same room on every tick, as the live men's rule has it (he never leaves his leg's rooms).
import { assert, root } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse, houseHonestBot } from './bots/house.mjs';
import { houseShot, runSheetOf, clearGateOf, houseCall, liveTick, liveGateOf, houseNow } from '../src/sim/scenarios/shoothouse.js';
import { fatalOf } from '../src/sim/combat/would.js';
import { legOf } from '../src/sim/combat/two.js';
import { accountedOf, gateWhy, COVER_MS } from '../src/sim/combat/men.js';
import { lanePlanOf, manPlace } from '../src/sim/combat/room.js';
import { faceOfHead, stepsOf } from '../src/sim/arms/shooting.js';
import { instinctNow } from '../src/sim/skills/instinct.js';

// (a lane set up at a door, the role-players' cards forced; its parts at hand)
function at(setup, opfor = 'live:fight,fight', tier = 'tierone') {
  const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier, setup, opfor }), st = g.state, R = st.armoury.range, H = R.house;
  const legs = [...H.rooms, H.hall], plans = lanePlanOf(st).plans, pid = st.player.id, me = st.actors.list.find(a => a.who === pid);
  // (the setup's GO is this instant: every man turned long enough ago that a call is no "void: a man turning as you called it")
  for (const T of R.turners) if (T.turnAtMs !== null) T.turnAtMs -= 5000;
  return { g, st, R, H, legs, plans, pid, me, T2: R.turners.find(t => t.stand === '2a'), T3: R.turners.find(t => t.stand === '3a') };
}
// (a round of yours in a man's head, through the scene's own path: opfor.js opforHit and the one rule, combat/would.js (v0.0.20: a
// strike the would-have rates fatal puts him down; v0.0.19's two torso rounds, the stands' sensor, now leave him up 87% of the time))
function downBy(st, T, by) {
  houseShot(st, null, { id: `gate-${T.key}-1`, fired: true, who: by, target: T.key, zone: 'head', part: 'head', atMs: st.clock.ms });
  if (!fatalOf(st, T.live.who)) throw new Error(`downBy: the head strike on ${T.key} not rated fatal: ${JSON.stringify(st.armoury.range.house.live.would.log.at(-1))}`);
}
// (an actor at a room's point looking at a man, the rifle aimed or at low ready)
function lookAt(st, a, x, z, T, posture = 'aimed') {
  a.x = x; a.z = z; a.$px = x; a.$pz = z;
  a.headRad = Math.atan2(T.z - z, T.x - x); a.face = faceOfHead(a.headRad);
  const c = st.people[a.who].kit.carry ??= {}; c.posture = posture;
}

export default [
  {
    name: 'v0.0.19: "Clear!" waits on a role-player down and armed (the gate\'s \'down\') until a muzzle has been on him COVER_MS, then the call rules him out; uncovered at a call by hand, the fault \'uncovered\' ("Cover your man!") and the call stands (fails without the live gate)',
    fn() {
      const A = at('room:2'), { st, R, H, legs, plans, pid, me, T2 } = A, L = legs[1], P = plans[L.door], now = st.clock.ms;
      downBy(st, T2, pid);
      const g1 = clearGateOf(st, L.door, now), w1 = gateWhy(st, T2, now);
      lookAt(st, me, P.points[0][0], P.points[0][1], T2);
      liveTick(st, null, R, H, now);
      const g2 = clearGateOf(st, L.door, now + COVER_MS - 50);
      liveTick(st, null, R, H, now + COVER_MS);
      const g3 = clearGateOf(st, L.door, now + COVER_MS), acc = accountedOf(st, T2, now + COVER_MS);
      L.state = 'entered';
      // (the call said with the cover held: the clock COVER_MS on, as a lived half second would leave it)
      st.clock.ms = now + COVER_MS;
      const ended = houseCall(st, null, { by: 'me', atMs: now + COVER_MS });
      const out = accountedOf(st, T2) === 'out', ruled = (H.live.ruled ?? []).map(x => `${x.key}:${x.why}`);
      console.log(`      2a down (stopped at ${T2.stoppedAtMs - now} ms): the gate ${g1} (men.js ${w1}); covered ${COVER_MS - 50} ms in: ${g2}; at ${COVER_MS} ms: ${g3 ?? 'clear to call'} (${acc}); "Clear!" ${ended ? 'ended the leg' : 'did not'}, ruled ${ruled.join(', ') || 'none'}, faults ${L.faults.map(f => f.kind).join(', ') || 'none'}`);
      assert(g1 === 'down' && w1 === 'down' && g2 === 'down' && g3 === null && acc === 'down', JSON.stringify({ g1, w1, g2, g3, acc }));
      assert(ended && out && ruled.includes(`${T2.key}:clear`) && !L.faults.some(f => f.kind === 'uncovered'), JSON.stringify({ ended, out, ruled, faults: L.faults }));
      // (uncovered at a call by hand: the fault, the call standing)
      const B = at('room:2');
      downBy(B.st, B.T2, B.pid);
      B.legs[1].state = 'entered';
      const ended2 = houseCall(B.st, null, { by: 'me', atMs: B.st.clock.ms }), f2 = B.legs[1].faults.map(f => f.kind);
      console.log(`      uncovered at a call by hand: ${ended2 ? 'the leg ended' : 'not ended'}, faults ${f2.join(', ')}; 2a ${accountedOf(B.st, B.T2)}`);
      assert(ended2 && f2.includes('uncovered') && accountedOf(B.st, B.T2) === 'out', JSON.stringify({ ended2, f2 }));
    },
  },
  {
    name: 'v0.0.19: a role-player who gave up is a no-shoot to the stack: Challenge him leads on him; a round on him after his hands were identified is \'surrendered\', one with his rifle still identified is not and is tallied by its zone, not as a no-shoot hit (the review of v0.0.19: the timer\'s red "1 NO-SHOOT HIT" beside "NO-SHOOTS UNTOUCHED"), and neither is the stands\' \'noshoot\' (fails without the live branch of houseShot)',
    fn() {
      const give = (A) => { Object.assign(A.T2, { face: 'noshoot', holds: 'hands' }); A.T2.live.st = 'hands'; A.T2.live.fromMs = A.st.clock.ms - 1000; };
      const pause = (A, ident) => { const c = (A.st.mind.contact ??= {}); c.last = { id: 'gate-c', ids: [A.T2.key], ident: { [A.T2.key]: ident }, armour: {}, seenMs: A.st.clock.ms - 400, atMs: A.st.clock.ms - 100, ms: 300, expect: 'sector', n: 1 }; (c.known ??= {})[A.T2.key] = A.st.clock.ms - 400; };
      const shot = (A, k) => houseShot(A.st, null, { id: `gate-s${k}`, fired: true, who: A.pid, target: A.T2.key, zone: 'A', part: 'torso', atMs: A.st.clock.ms });
      const A = at('room:2', 'live:give,fight'), L = A.legs[1];
      give(A); pause(A, 'hands');
      A.st.stop.pick = A.T2.key;
      // (the instinct settles on a tick: one with time standing still)
      delete A.st.$instinct; A.g.step(1);
      const line = instinctNow(A.st).line, rows = stepsOf(A.st).filter(s => s.kind === 'contact').map(s => `${s.id}${s.lead ? '*' : ''}${s.off ? `(${s.off})` : ''}`);
      shot(A, 1);
      const B = at('room:2', 'live:give,fight'), LB = B.legs[1];
      give(B); pause(B, 'rifle');
      shot(B, 2);
      console.log(`      hands identified: the line ${line?.id ?? 'none'} "${line?.text ?? ''}" (${line?.act ?? 'no act'}); the contact's rows ${rows.join(', ') || 'none'}; a round: faults ${L.faults.map(f => f.kind).join(', ') || 'none'}`);
      console.log(`      the rifle still identified (a round on its way as the hands came up): faults ${LB.faults.map(f => f.kind).join(', ') || 'none'}; zones ${JSON.stringify(LB.zones)}`);
      assert(L.faults.some(f => f.kind === 'surrendered') && !L.faults.some(f => f.kind === 'noshoot'), JSON.stringify(L.faults));
      assert(!LB.faults.length && !LB.zones.noshoot && LB.zones.A === 1, JSON.stringify({ faults: LB.faults, zones: LB.zones }));
      assert(line?.id === 'cqb-rp-hands' && line.act === 'stop:contact:challenge', JSON.stringify(line));
    },
  },
  {
    name: 'the review of v0.0.19: a role-player who gives up with a round in flight is counted once, GAVE UP, never also DOWN ("2 ROLE-PLAYERS · 2 DOWN, 1 GAVE UP" was three outcomes for two men), on the card and on his room\'s row (v0.0.20: the round in flight one the would-have rates fatal, his head)',
    fn() {
      const A = at('room:3', 'live:fight,give'), { st, T3 } = A, now = st.clock.ms;
      const shot = (k, atMs, zone = 'A') => houseShot(st, null, { id: `once-${k}`, fired: true, who: A.pid, target: T3.key, zone, part: zone === 'head' ? 'head' : 'torso', atMs });
      shot(1, now - 200);
      // (his hands up between the two rounds, the second already on its way (identified 'rifle' at your pause))
      Object.assign(T3, { face: 'noshoot', holds: 'hands' }); T3.live.st = 'hands'; T3.live.gaveAtMs = now - 100; T3.live.fromMs = now - 100;
      const c = (st.mind.contact ??= {}); c.last = { id: 'once-c', ids: [T3.key], ident: { [T3.key]: 'rifle' }, armour: {}, seenMs: now - 400, atMs: now - 300, ms: 100, expect: 'sector', n: 1 };
      shot(2, now - 23, 'head');
      const f = fatalOf(st, T3.live.who);
      const sheet = runSheetOf(st), row3 = sheet.rows.find(r => r.room === T3.room)?.words ?? '', live = /\d+ ROLE-PLAYERS? · [^·]+/.exec(sheet.card)?.[0] ?? '';
      console.log(`      3a: ${T3.hits.length} rounds (a torso, then the head 77 ms after his hands, rated ${f ? `fatal (${f.why})` : 'not fatal'}); the card's "${live}"; room 3's row: ${row3}`);
      assert(f && f.atMs > T3.live.gaveAtMs && /1 GAVE UP/.test(live) && !/[1-9] DOWN/.test(live) && /LIVE: 0 DOWN, 1 GAVE UP/.test(row3) && !/NO-SHOOT/.test(row3), JSON.stringify({ live, row3 }));
    },
  },
  {
    name: 'v0.0.19: a role-player seen up after his room\'s "Clear!" reopens it ("Room 2\'s not clear!", the fault \'reopened\' on the leg you are in), holds that leg\'s gate while he is out of sight (\'unaccounted\'), and voids the hall\'s "Clear!" while he is up (fails without the reopened rule)',
    fn() {
      const A = at('room:2', 'live:fight,fight'), { st, R, H, legs, plans, pid, me, T2 } = A, L2 = legs[1], P2 = plans[L2.door], now = st.clock.ms;
      // (room 2 called with its man never seen: he stays up, never ruled out; the leg ends and room 3 is the current one)
      L2.state = 'entered';
      const ended = houseCall(st, null, { by: 'me', atMs: now });
      const up1 = accountedOf(st, T2) !== 'out';
      // (seen from room 2's point: the room reopened)
      lookAt(st, me, P2.points[0][0], P2.points[0][1], T2, 'lowReady');
      liveTick(st, null, R, H, now);
      const L3 = legs[2], reo = H.live.reopened?.[T2.key] !== undefined, f3 = L3.faults.map(f => `${f.kind} "${f.text}"`);
      // (out of sight now: room 3's gate waits on him)
      me.headRad += Math.PI; me.face = faceOfHead(me.headRad);
      const two = st.actors.list.find(a => a.who === H.twoPid); if (two) { two.headRad = (two.headRad ?? 0) + Math.PI; two.face = faceOfHead(two.headRad); }
      const gate3 = liveGateOf(st, H, 2, now), gate3c = clearGateOf(st, L3.door, now);
      // (the hall's "Clear!" while he is up: void)
      H.cur = 3; const hall = legs[3]; hall.state = 'entered';
      const endedHall = houseCall(st, null, { by: 'me', atMs: now + 50 });
      console.log(`      room 2 called with 2a unseen: ${ended ? 'ended' : 'not ended'}, 2a ${up1 ? 'up' : 'out'}; seen from its point: reopened ${reo}, room 3's faults ${f3.join('; ') || 'none'}; room 3's gate with him out of sight ${gate3} (${gate3c}); the hall's "Clear!" ${endedHall ? 'ENDED THE LANE' : `void (${JSON.stringify(hall.calls.at(-1))})`}`);
      assert(ended && up1 && reo && L3.faults.some(f => f.kind === 'reopened' && /Room 2/.test(f.text ?? '')), JSON.stringify({ ended, up1, reo, f3 }));
      assert(gate3 === 'unaccounted' && gate3c === 'unaccounted' && !endedHall && hall.calls.at(-1)?.void === true, JSON.stringify({ gate3, gate3c, endedHall }));
    },
  },
  {
    name: 'v0.0.19: legOf (his stand) and room.js manPlace (where he stands) agree on every role-player on every tick of the tier one\'s live lane, a man who hides (live:fight,hide) with them',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go', opfor: 'live:fight,hide' }), bad = [], plan = lanePlanOf(g.state);
      let ticks = 0;
      const r = runHouse(g, houseHonestBot(), { maxMs: 6 * 60_000, each: (gg) => {
        const st = gg.state;
        for (const T of st.armoury.range.turners.filter(t => t.live)) {
          ticks++;
          const want = plan.plans[plan.order[legOf(T)]]?.room ?? null, got = manPlace(st, T)?.room ?? null;
          if (want !== got && bad.length < 5) bad.push(`${T.stand} at ${st.clock.ms - st.armoury.range.house.goAtMs} ms: legOf's ${want}, manPlace's ${got} (${T.x}, ${T.z})`);
        }
      } });
      console.log(`      ${ticks} man-ticks over ${r.ticks} ticks (${houseNow(g.state).end?.why ?? 'no end'}): disagreements ${bad.length}${bad.length ? `: ${bad.join('; ')}` : ''}`);
      assert(r.done && ticks > 0 && !bad.length, JSON.stringify({ done: r.done, bad }));
    },
  },
  {
    name: 'v0.0.19 (the build sheet §0 item 23, the review of v0.0.19): a real practice frag 0.85 m from a live man reads him and rules him out \'frag\', never turns him away (readBurst had left every live man out of the read, so the ruling never ran)',
    fn() {
      return import('../src/sim/combat/burst.js').then(({ burst }) => {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go', loadout: 'frag', opfor: 'live:fight,fight' }), bot = houseHonestBot();
        for (let n = 0; g.state.armoury.range.house.cur < 1 && n < 20_000; n++) g.step(1, bot);
        const st = g.state, R = st.armoury.range, H = R.house, T2 = R.turners.find(t => t.live && t.stand === '2a');
        const out = burst(st, g.bus, { id: 'i9999', model: 'g9p', x: T2.x - 0.6, z: T2.z - 0.6, byId: st.player.id, called: true });
        g.step(1, bot);
        const ruled = (H.live.ruled ?? []).find(x => x.key === T2.key), read = out.read?.stands?.[T2.key] ?? null;
        console.log(`      a G-9P 0.85 m from 2a: in the read ${!!read}${read ? ` (${read.n} balls, ${read.kPa} kPa, '${read.out}')` : ''}; ${ruled ? `ruled out '${ruled.why}'` : 'not ruled out'}, st '${T2.live.st}', turned away ${T2.awayAtMs !== null && T2.awayAtMs !== undefined}`);
        assert(read && ruled?.why === 'frag' && T2.live.st === 'out' && (T2.awayAtMs === null || T2.awayAtMs === undefined), JSON.stringify({ read, ruled, st: T2.live.st, awayAtMs: T2.awayAtMs }));
      });
    },
  },
  {
    name: 'the review of v0.0.19: a G-13P\'s stun reaches a live man it does not put out (his combat block\'s stunUntilMs, which rpShocked reads), as burst.js gives the stands theirs',
    fn() {
      return import('../src/sim/combat/burst.js').then(({ burst }) => {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go', loadout: 'conc', opfor: 'live:fight,fight' }), bot = houseHonestBot();
        for (let n = 0; g.state.armoury.range.house.cur < 1 && n < 20_000; n++) g.step(1, bot);
        const st = g.state, R = st.armoury.range, H = R.house, T2 = R.turners.find(t => t.live && t.stand === '2a'), now = st.clock.ms;
        const out = burst(st, g.bus, { id: 'i9998', model: 'g13p', x: T2.x - 2.5, z: T2.z - 1.5, byId: st.player.id, called: true });
        g.step(1, bot);
        const read = out.read?.stands?.[T2.key] ?? null, a = st.actors.list.find(x => x.who === T2.live.who), stun = a?.combat?.stunUntilMs ?? null;
        const ruled = (H.live.ruled ?? []).some(x => x.key === T2.key);
        console.log(`      a G-13P 2.9 m from 2a: in the read ${!!read}${read ? ` (${read.kPa} kPa, '${read.out}', stun ${read.stunMs} ms)` : ''}; ruled out ${ruled}; his stunUntilMs ${stun === null ? 'none' : `now + ${stun - now} ms`}`);
        assert(read && read.stunMs > 0 && (ruled || stun > now), JSON.stringify({ read, ruled, stun, now }));
      });
    },
  },
  {
    name: 'the review of v0.0.19: a role-player hears a burst the rules layer sets off (a G-11 live on the floor, no beat waiting on it): its cue \'burst\' (opfor.js newsOf by count; by time the burst came after the tick\'s news had closed)',
    fn() {
      return Promise.all([import('../src/sim/arms/kit.js'), import('../src/sim/arms/devices.js')]).then(([{ move }, { setSt }]) => {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go', loadout: 'flash', opfor: 'live:fight,fight' }), bot = houseHonestBot();
        for (let n = 0; g.state.armoury.range.house.cur < 1 && n < 20_000; n++) g.step(1, bot);
        const st = g.state, R = st.armoury.range, H = R.house, T = R.turners.find(t => t.live && t.stand === '2a');
        const id = Object.keys(st.items).find(k => st.items[k].type === 'grenade' && st.items[k].model === 'g11');
        move(st, id, { ground: { area: R.area ?? st.places.live.area, x: T.x - 1.5, z: T.z - 1.2 } });
        setSt(st, id, 'live'); st.items[id].fuseAtMs = st.clock.ms + 125;
        const st0 = T.live.st, t0 = st.clock.ms;
        // (six lived ticks: a pause at a choice (v0.0.20's room 1 exit, its status and "Coming out!", ends the clear's doing on the
        // burst's next tick) stands the world still, so the man hears nothing until the honest bot's press moves it on)
        for (let i = 0; i < 60 && st.clock.ms < t0 + 300; i++) g.step(1, st.stop?.phase === 'choose' ? bot : () => null);
        const B = (H.bursts ?? []).at(-1);
        console.log(`      a G-11 1.9 m from 2a (he was '${st0}'): burst ${B?.model} at +${B ? B.atMs - t0 : "-"} ms; his cue ${JSON.stringify(T.live.cue)}, now '${T.live.st}'`);
        assert(B?.model === 'g11' && T.live.cue?.why === 'burst', JSON.stringify({ B: B && { model: B.model, atMs: B.atMs }, cue: T.live.cue, st: T.live.st }));
      });
    },
  },
];
