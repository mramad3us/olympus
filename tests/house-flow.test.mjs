// OLYMPUS tests: the shoot house's flow, the rework's R3 (COMBAT §25.19.3, §25.19.2.1; the build order §25.19.10): a contact suspends the drill from rung 2 instead of cutting it, the shot runs on the hands inside it with the feet going on to the point, one shot row with the feet the drill's, no "Carry on" after a row, "Clear!" waiting until the room is really clear, the inner door asked from the point, ready by slot, the crossing rule.
//
// The user's note on v0.0.12 (2026-11-11): "drop you in the doors and leave you there to aim"; "trained operators know to
// flow in and take shots when they're in position"; "the automatic pauses are awkward in general". Each case below fails
// without its part of the build: the room 1 cases on the drill's bare world (tests/drill-world.mjs: house 1, the tier one
// by the panel's rows, 1a turned), the lane cases on the scene by the honest T bot (tests/bots/house.mjs houseHonestBot).
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { drillWorld } from './drill-world.mjs';
import { houseHonestBot, runHouse } from './bots/house.mjs';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { useClearGate, crossTick, CLEAR_HOLD_MS, readyOf } from '../src/sim/combat/bundle.js';
import { clearGateOf, houseNow } from '../src/sim/scenarios/shoothouse.js';
import { pastThreshold, inFunnel, lanePlanOf } from '../src/sim/combat/room.js';
import { setPost } from '../src/sim/people/staff.js';
import { HOUSE1 } from '../src/data/places/wheel.js';

const pick = (g, id, target = null) => g.step(1, { act: [{ act: 'stop', args: { step: id, ...(target ? { target } : {}) } }] });
const settle = (g, s, max = 3000) => { let n = 0; while (n++ < max && !(s.stop?.mode === 'stop' && s.stop.phase === 'choose')) g.step(1); return n; };
const speed = (a) => Math.hypot(a.v?.[0] ?? 0, a.v?.[1] ?? 0);

// (room 1 on the drill's world: the tier one's Clear the room, 1a turned, to the contact's pause; the paper's sensor as the
// drill's bot has it (tests/bots/drill.mjs): two rounds at him put him down)
function roomOne(tier = 'tierone') {
  const w = drillWorld({ tier }), { g, s } = w, t0 = s.clock.ms, T = w.T('1a'), shots = [];
  s.mind.clearing = { room: 'w4.r1', fromMs: t0 }; T.turnAtMs = t0 - 2000;
  g.bus.on?.('shot', (f) => { if (f.fired !== false && f.who === s.player.id) { shots.push({ atMs: s.clock.ms }); if (shots.length >= 2 && T.stoppedAtMs === null) T.stoppedAtMs = s.clock.ms; } });
  w.shots = shots;
  pick(g, stepsOf(s).find(r => r.id.startsWith('drill:room:clear>')).id);
  const d = s.stop.doing;
  settle(g, s);
  return { ...w, t0, d, P: w.lane.plans['o:w4:r1'] };
}

export default [
  {
    name: 'one shot row inside the flow, the feet by the drill: at the suspended pause the Pair is one row, "moving on" for an armed man facing within 7 m, its feet a variant set at no time ("Moving on ⇄ At your point"), at your point planning the walk to the point before the rounds (COMBAT §25.19.3.2: the moving and planted twins become one row)',
    fn() {
      const w = roomOne(), { g, s } = w;
      const rows = stepsOf(s), pairs = rows.filter(r => /^shot:pair/.test(r.id)), feet = rows.find(r => r.id === 'drill:variant:feet');
      console.log(`      at the pause: ${pairs.map(r => `${r.id} "${r.label}" (${r.way})`).join(', ')}; the variant "${feet?.label}"`);
      assert(pairs.length === 1 && pairs[0].id === 'shot:pair' && pairs[0].way === 'moving' && /moving on/.test(pairs[0].label) && feet, JSON.stringify(pairs.map(r => [r.id, r.label, r.way])));
      pick(g, 'drill:variant:feet');
      const p2 = stepsOf(s).find(r => r.id === 'shot:pair');
      console.log(`      the variant chosen: "${p2?.label}", its parts ${p2?.parts?.map(x => `${x.k} ${x.ms}`).join(', ')}; the clock still ${s.clock.holds.join(',')}`);
      assert(p2?.way === 'point' && p2.parts[0].k === 'plant' && p2.parts[0].ms > 0 && s.stop.flow?.suspended, JSON.stringify({ way: p2?.way, parts: p2?.parts }));
    },
  },
  {
    name: 'the shot on the hands inside the flow: the Pair moving on runs while the entry goes on to the point at its speed, its first round out of the door (past the threshold), and at its end, nobody of yours up, the drill goes on by itself with no stop and no "Carry on" (COMBAT §25.19.3.1 to §25.19.3.3; F4, F5, F12)',
    fn() {
      const w = roomOne(), { g, s, P } = w, me = w.me(), F = s.stop.flow, v0 = speed(me);
      pick(g, 'shot:pair', w.T('1a').key);
      const during = { hold: !!s.stop.flow?.hold, doing: s.stop.doing?.step, minV: Infinity, first: null, inDoor: 0 };
      let n = 0;
      while (n++ < 200 && s.stop?.doing?.step === 'shot:pair') {
        g.step(1);
        if (s.stop?.doing?.step === 'shot:pair') during.minV = Math.min(during.minV, speed(me));
        if (inFunnel(P, me.x, me.z) && speed(me) < 0.3) during.inDoor++;
        if (w.shots.length && !during.first) during.first = { past: pastThreshold(P, me.x, me.z), x: me.x, z: me.z };
      }
      const after = { phase: s.stop?.phase, doing: s.stop?.doing?.step ?? null, flow: !!s.stop?.flow, carry: !!s.stop?.carry, down: w.T('1a').stoppedAtMs !== null, posture: s.people[s.player.id].kit.carry.posture };
      console.log(`      at the pause ${fmt(v0, 2)} m/s; the row beside the flow (hands held ${during.hold}), the feet's least speed during it ${fmt(during.minV, 2)} m/s, ticks still in the door ${during.inDoor}; the first round past the threshold ${during.first?.past}; after: ${JSON.stringify(after)}`);
      assert(F && during.hold && during.minV > 0.3 && !during.inDoor && during.first?.past, JSON.stringify(during));
      assert(after.down && after.phase === 'act' && after.doing === F.step && !after.flow && !after.carry, JSON.stringify(after));
      // (the rifle up first where the row left it at the aim: the flow's own `up` beat, flowing with the feet)
      const up = F.beats.find(b => /(^|:)up\.\d+$/.test(b.key));
      assert(up && up.to === 'highReady', JSON.stringify(F.beats.map(b => b.key)));
    },
  },
  {
    name: 'a step that needs the feet halts the flow where it stands: Hold him cuts the entry there, its rest the panel\'s "Carry on"; the shot\'s "stop here" plants the feet with the brake (COMBAT §25.19.3.1 item 3)',
    fn() {
      const w = roomOne(), { g, s } = w;
      pick(g, 'drill:variant:feet'); pick(g, 'drill:variant:feet');
      const r = stepsOf(s).find(x => x.id === 'shot:pair');
      pick(g, 'shot:pair', w.T('1a').key);
      const d = w.d, cut = d.beats.find(b => b.st === 'cut' && b.k === 'move');
      console.log(`      "${r?.label}": the flow ${s.stop.flow ? 'kept' : 'halted'}, the entry cut ${!!cut}, the feet ${s.stop.feet?.way ?? '-'} (${s.stop.feet?.prof ? fmt(s.stop.feet.prof.T, 2) : '-'} s), the row's parts ${s.stop.doing?.plan?.parts?.map(p => p.k).join(', ')}`);
      assert(r?.way === 'stop' && !s.stop.flow && cut && s.stop.carry?.beats?.includes(cut.key) && s.stop.doing?.plan?.parts?.[0]?.k === 'brake', JSON.stringify({ way: r?.way, flow: !!s.stop.flow, cut: !!cut }));
    },
  },
  {
    name: '"Clear!" waits on what the team perceives (the reach review of 2026-11-13, COMBAT §25.19.2.1): a window open on a man of the room, or your #2 on a man of it, holds the call; a man turned a moment ago and not yet seen, or a turner whose trigger has fired, does not, since nobody in the room knows of him; a call the scene finds void (the man turning as you call) is said again, the drill not done with the room, so the lane ends clear with every room\'s last call good',
    fn() {
      // (the lane by the honest T on the user's seed: the void calls of the range's knowledge are said again)
      const g0 = createGame({ scenario: 'test-shoothouse', seed: 1489397426, tier: 'tierone', setup: 'go' });
      runHouse(g0, houseHonestBot(), { maxMs: 12 * 60_000 });
      const N = houseNow(g0.state), H0 = g0.state.armoury.range.house, legs = [...H0.rooms, H0.hall];
      const calls = legs.flatMap(L => L.calls.filter(c => c.by === 'me')), lastBad = legs.filter(L => { const c = L.calls.filter(x => x.by === 'me').at(-1); return c && (c.void || c.early); });
      console.log(`      the lane: ${N.end?.why}, ${calls.length} calls of yours (${calls.filter(c => c.void || c.early).length} void or early, each said again: ${calls.map(c => `${c.how}${c.void ? ' void' : ''}${c.early ? ' early' : ''}`).join(', ')}); a room whose last call was void ${lastBad.length}; CLEAR_HOLD_MS ${CLEAR_HOLD_MS}`);
      assert(N.end?.why === 'clear' && !lastBad.length && legs.every(L => L.state === 'clear'), JSON.stringify({ end: N.end?.why, lastBad: lastBad.map(L => L.door) }));
      // (the predicate itself: room 1 with its men down, nothing; 1a turned now and unseen, nothing (nobody knows); his door open
      // and his gap to run, nothing; his window open on him, a reason)
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go' }), s = g.state, R = s.armoury.range;
      for (let i = 0; i < 4000 && R.house.goAtMs === null; i++) g.step(1, houseHonestBot());
      const room1 = R.turners.filter(t => t.room === 'w4.r1');
      for (const t of room1) t.stoppedAtMs = s.clock.ms;
      const before = clearGateOf(s, 'o:w4:r1');
      const T = room1.find(t => t.stand === '1a');
      T.stoppedAtMs = null; T.turnAtMs = s.clock.ms; if (s.mind.contact?.known) delete s.mind.contact.known[T.key];
      const turning = clearGateOf(s, 'o:w4:r1');
      T.turnAtMs = null; R.house.doors['o:w4:r1'] = s.clock.ms; T.trigger = { kind: 'door', on: 'o:w4:r1', gapMs: 2000 };
      const trigger = clearGateOf(s, 'o:w4:r1');
      T.turnAtMs = s.clock.ms; s.mind.contact = { ...(s.mind.contact ?? {}), pending: { id: 'c-test', ids: [T.key], seenMs: s.clock.ms, untilMs: s.clock.ms + 500, ms: 500 } };
      const window = clearGateOf(s, 'o:w4:r1');
      console.log(`      the predicate on room 1, its men down: ${before}; 1a turned now, unseen: ${turning}; his door open, his gap to run: ${trigger}; his window open: ${window}`);
      assert(before === null && turning === null && trigger === null && window === 'window', JSON.stringify({ before, turning, trigger, window }));
    },
  },
  {
    name: 'the inner door is asked from the point, never from the doorway: by the honest T on the user\'s seed and two more, the tier one\'s "Hold it or clear it?" for room 2\'s closet comes with #1 past the threshold and out of the funnel, his sector swept (COMBAT §25.19.2.1: v0.0.12 asked it at the sector\'s start, the doorway from rung 3)',
    timeoutMs: 120_000,
    fn() {
      const out = [];
      for (const seed of [1489397426, 1037, 1074]) {
        const g = createGame({ scenario: 'test-shoothouse', seed, tier: 'tierone', setup: 'go' }), asks = [];
        const P = lanePlanOf(g.state).plans['o:w4:r2'];
        runHouse(g, houseHonestBot(), { maxMs: 12 * 60_000, each: (game) => {
          for (const f of game.facts('bundle')) if (f.phase === 'halt' && f.why === 'door-unplanned' && f.who === game.state.player.id) { const me = game.me(); asks.push({ past: pastThreshold(P, me.x, me.z), funnel: inFunnel(P, me.x, me.z), v: speed(me) }); }
        } });
        out.push({ seed, asks, done: houseNow(g.state).end?.why });
      }
      for (const o of out) console.log(`      ${o.seed}: ${o.asks.map(a => `asked past ${a.past}, in the door ${a.funnel}, at ${fmt(a.v, 2)} m/s`).join('; ') || 'not asked'}; ${o.done}`);
      assert(out.every(o => o.done === 'clear' && o.asks.every(a => a.past && !a.funnel)) && out.some(o => o.asks.length), JSON.stringify(out));
    },
  },
  {
    name: 'ready by slot: #1 at high ready on his stack, the #2 at low ready, muzzle down (CALL 97-20: "weapons are pointed down with the exception of the 1-Man"), in the plan and in the scene at your first stack',
    fn() {
      assert(readyOf('highReady', 1) === 'highReady' && readyOf('highReady', 2) === 'lowReady', 'readyOf');
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go' }), s = g.state, H = s.armoury.range.house, pid = s.player.id;
      let seen = null;
      runHouse(g, houseHonestBot(), { maxMs: 4 * 60_000, each: (game) => {
        for (const f of game.facts('house')) if ((f.phase === 'stacked' || f.phase === 'open') && !seen) seen = { me: s.people[pid].kit.carry.posture, two: s.people[H.twoPid].kit.carry.posture };
        if (!seen && H.two?.doing?.beats?.some(b => b.key === 'squeeze' && b.st === 'done')) seen = { me: s.people[pid].kit.carry.posture, two: s.people[H.twoPid].kit.carry.posture, by: 'squeeze' };
      } });
      console.log(`      at the first stack: ${JSON.stringify(seen)}`);
      assert(seen?.two === 'lowReady', JSON.stringify(seen));
    },
  },
  {
    name: 'the crossing rule: a move whose next half second would carry an aimed muzzle across the #2 brings the rifle to low ready, and back to the aim once the line is clear; never while a shot row has the hands (COMBAT §25.19.2.1, TC 3-22.9 §1-10)',
    fn() {
      const w = drillWorld({ tier: 'tierone', posture: 'aimed' }), { g, s, pid } = w;
      // (the #2 posted 1.5 m down the hall ahead of you, a step to your right of the walk's line)
      const twoPid = s.actors.list.find(a => a.who !== pid).who, me = w.me();
      setPost(s, twoPid, { key: 'house-two', area: HOUSE1.area, x: me.x - 1.5, z: me.z + 0.1, face: 'left', outfit: 'combatSuit' });
      g.step(1);
      { const a2 = s.actors.list.find(x => x.who === twoPid); a2.x = me.x - 1.5; a2.z = me.z + 0.1; }
      s.armoury.range.house = { two: { pid: twoPid, aid: s.actors.list.find(a => a.who === twoPid).id, rung: 4, doing: null, contact: null, eng: null, known: {}, ident: {} } };
      const carry = () => s.people[pid].kit.carry;
      // (a walk west along the hall, aimed: the single "Move" row is the room's, so a move beat is set running on the stop)
      const x0 = me.x, z0 = me.z, path = [[x0, z0], [x0 - 3, z0]];
      const prof = { L: 3, v0: 1.23, vp: 1.23, v1: 1.23, au: 3, ad: 5, t1: 0, t2: 3 / 1.23, t3: 0, s1: 0, s3: 0, T: 3 / 1.23 };
      s.stop.feet = { id: 'feet', k: 'move', ch: 'feet', stance: 'combat', path, prof, fromMs: s.clock.ms, untilMs: s.clock.ms + Math.round(prof.T * 1000), way: 'moving' };
      me.headRad = Math.PI;
      const a = crossTick(s, pid, s.clock.ms), low = carry().posture, cross = !!carry().cross;
      // (the #2 stepped out of the line: back to the aim)
      const two = s.actors.list.find(x => x.who === twoPid); two.x = x0 - 1.5; two.z = z0 + 2.5;
      const b = crossTick(s, pid, s.clock.ms), back = carry().posture;
      // (a shot row on the hands: the rule stands aside)
      two.z = z0 + 0.1; carry().posture = 'aimed';
      s.stop.doing = { step: 'shot:pair', list: ['aim'], i: 0 };
      const c = crossTick(s, pid, s.clock.ms), held = carry().posture;
      s.stop.doing = null;
      console.log(`      aimed, the #2 1.5 m ahead in the line: ${a} → ${low} (cross ${cross}); stepped out: ${b} → ${back}; a shot row running: ${c} → ${held}`);
      assert(a === 'low' && low === 'lowReady' && cross && b === 'back' && back === 'aimed' && c === null && held === 'aimed', JSON.stringify({ a, low, b, back, c, held }));
    },
  },
];
