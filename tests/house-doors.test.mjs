// OLYMPUS tests: a door's swing read from its data and shaping the entry (the user, 2026-11-15: "also, doors should have a direction they open (pull or push) and it should affect our options for entry"; src/sim/places/swing.js, PLACES §1.6).
//
// Each fails without its part of the build: the read of house 1's doors from their openings (room 1 and room 3 push, room 2
// pull, the closet push from room 2) and the stack on the latch side, a generated door read from its data alone (the hinge
// moved, the swing turned, a door on the other axis), a locked pull door and a stack off the latch side refused at the plan;
// the rows (Kick struck "opens toward you" on a pull door with no odds, live on a push door; Open naming the way; the read
// saying it in a line; Push ⇄ Kick offered on a push door only; a kick asked of a pull door planned as the pull); the time
// each costs (a pull's hand and step back, its way in only fully open, the approach at rest and the hand after the feet,
// where a push is shoved on the approach's last stretch from rung 3); the leaf's arc a no-stop zone only while it moves, and
// only the sweep still to come; the arc drawn on the floor; the DI never naming a struck kick.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { stepAct } from './bots/lib.mjs';
import { WHEEL_S4 } from '../src/data/places/wheel.js';
import { swingFrom, stackPointsOf, arcOf, inSweep, arcPoints, doorWordsOf, KICK_PULL_WHY, STACK_OFF_FRAME_M, STACK_OFF_WALL_M } from '../src/sim/places/swing.js';
import { arcsOf, arcLiveAt, liveZoneAt, zonesOf, exitOf } from '../src/sim/places/zones.js';
import { setOpening, openingState } from '../src/sim/places/model.js';
import { lanePlanOf, doorPlanOf } from '../src/sim/combat/room.js';
import { singleRows, bundleRows, planBundle, doorS, breachOf, skillsOf, HANDBACK_WORDS, PULL_STEP_S } from '../src/sim/combat/bundle.js';
import { PASS_SHARE } from '../src/sim/combat/drills/enter-and-clear.js';
import { paceOf } from '../src/sim/skills/skills.js';
import { houseLook } from '../src/sim/scenarios/shoothouse.js';
import { leafArcPixels, LEAF_SHUT, LEAF_MOVING } from '../src/render/range-items.js';
import { instinctNow } from '../src/sim/skills/instinct.js';

const RECTS = Object.fromEntries(WHEEL_S4.rooms.map(r => [r.id, r.rect]));
const OPEN = (id) => WHEEL_S4.openings.find(o => o.id === id);
const SHEETS = ['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone'];
const house = (tier, setup) => { const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier, setup }); return { g, s: g.state }; };
const near = (a, b, e = 1e-6) => Math.hypot(a[0] - b[0], a[1] - b[1]) <= e;

export default [
  {
    name: 'house 1\'s doors read from their own swing: room 1 "Push door, hinge left.", room 2 "Pull door, hinge right.", room 3 "Push door, hinge left." from the hall, the closet "Push door, hinge left." from room 2; every plan\'s stack on its latch side (swing.js stackPointsOf: 0.5 m past the latch jamb, 0.45 m off the wall, the #2 0.65 m behind), and behind the door a push door\'s hinge side only',
    fn() {
      const { s } = house('private', 'go'), L = lanePlanOf(s), rows = [];
      const want = { 'o:w4:r1': 'Push door, hinge left.', 'o:w4:r2': 'Pull door, hinge right.', 'o:w4:r3': 'Push door, hinge left.' };
      for (const k of ['o:w4:r1', 'o:w4:r2', 'o:w4:r3']) {
        const P = L.plans[k], sw = P.swing, pts = stackPointsOf(OPEN(k), -P.plane.into, RECTS);
        // (behind the door: the hot spot the plan names so lies on the swing's hinge side, and only a push door has one)
        const behind = (P.hot ?? []).filter(h => h.why === 'behind the door');
        const mid = OPEN(k).axis === 'x' ? (OPEN(k).a + OPEN(k).b) / 2 : (OPEN(k).a + OPEN(k).b) / 2, f = P.plane.axis === 'x' ? [0, P.plane.into] : [P.plane.into, 0];
        const sideOf = (h) => { const dx = h.x - (P.plane.axis === 'x' ? mid : P.plane.at), dz = h.z - (P.plane.axis === 'x' ? P.plane.at : mid); return dx * f[1] - dz * f[0] > 0 ? 'left' : 'right'; };
        rows.push({ k, words: sw.words, stack: sw.stackSide, kick: sw.kickable, behind: behind.map(h => `${h.id} ${sideOf(h)}`), stackOk: P.stack.every((p, i) => near(p, pts[i], 1e-3)) });
        assert(sw.words === want[k] && P.stack.every((p, i) => near(p, pts[i], 1e-3)) && sw.stackSide === sw.latch, JSON.stringify({ k, sw, stack: P.stack, pts }));
        assert(sw.how === 'push' ? behind.length === 1 && sideOf(behind[0]) === sw.behindSide : behind.length === 0 && sw.behindSide === null, JSON.stringify({ k, behind, sw }));
      }
      const closet = swingFrom(OPEN('o:w4:closet'), 'w4.r2', RECTS);
      console.log(`      ${rows.map(r => `${r.k.replace('o:w4:', '')}: "${r.words}" stack ${r.stack} (latch), kick ${r.kick ? 'yes' : 'no'}, behind the door ${r.behind.join(', ') || 'none'}`).join('\n      ')}\n      the closet from room 2: "${closet.words}", kick ${closet.kickable ? 'yes' : 'no'}; the lane meets ${new Set(rows.map(r => r.words.split(' ')[0])).size} ways (authored: the area's frozen record, PLACES §1.6)`);
      assert(closet.words === 'Push door, hinge left.' && closet.kickable && new Set(rows.map(r => r.words.split(' ')[0])).size === 2, JSON.stringify({ closet, rows }));
    },
  },
  {
    name: 'a generated door is read from its data alone (swing.js): the hinge moved to the other end puts the stack on the other side, the swing turned makes a push a pull (its kick struck "opens toward you", nothing behind it) from the same side, a door on the other axis reads the same way, and the read\'s words follow',
    fn() {
      const o = OPEN('o:w4:r1'), base = swingFrom(o, 'w4.hall', RECTS);
      const hinged = { ...o, swing: { ...o.swing, hinge: 'b' } }, turned = { ...o, swing: { ...o.swing, into: 0 } };
      const h = swingFrom(hinged, 'w4.hall', RECTS), t = swingFrom(turned, 'w4.hall', RECTS), hp = stackPointsOf(hinged, 'w4.hall', RECTS), bp = stackPointsOf(o, 'w4.hall', RECTS);
      // (a door on the z axis, x = 10, from 2 to 2.9, hinged at b, swinging into the room east of it, read from the west)
      const z = { id: 'gen', kind: 'door', axis: 'z', at: 10, a: 2, b: 2.9, rooms: ['west', 'east'], swing: { hinge: 'b', into: 1 } }, zr = { west: [6, 0, 10, 5], east: [10, 0, 14, 5] };
      const zs = swingFrom(z, 'west', zr), zp = stackPointsOf(z, 'west', zr), zb = swingFrom(z, 'east', zr);
      console.log(`      room 1 as built: "${base.words}" stack ${base.stackSide} at ${JSON.stringify(bp[0])}; its hinge at b: "${h.words}" stack ${h.stackSide} at ${JSON.stringify(hp[0])}; its swing into the hall: "${t.words}" kick ${t.kickable ? 'yes' : `struck, ${t.kickWhy}`}`);
      console.log(`      a z-axis door from the west: "${zs.words}" stack ${zs.stackSide} at ${JSON.stringify(zp)}; from the east: "${zb.words}"`);
      assert(base.how === 'push' && base.hinge === 'left' && h.hinge === 'right' && h.stackSide === 'left' && Math.abs(hp[0][0] - (o.a - STACK_OFF_FRAME_M)) < 1e-6 && Math.abs(bp[0][0] - (o.b + STACK_OFF_FRAME_M)) < 1e-6, JSON.stringify({ base, h, hp, bp }));
      assert(t.how === 'pull' && !t.kickable && t.kickWhy === KICK_PULL_WHY && t.behindSide === null && t.words === doorWordsOf('pull', 'left'), JSON.stringify(t));
      // (facing east from the west, b (z 2.9, south) is on the right: the stack north of the door, on the latch's side)
      assert(zs.how === 'push' && zs.hinge === 'right' && zs.stackSide === 'left' && near(zp[0], [10 - STACK_OFF_WALL_M, 2 - STACK_OFF_FRAME_M], 1e-6) && zb.how === 'pull' && zb.hinge === 'left', JSON.stringify({ zs, zp, zb }));
    },
  },
  {
    name: 'the plan refuses a door that would be a dead end or a stack on the wrong side (room.js doorPlanOf): a locked pull door on the lane (no kick opens it, no charge is issued), and an authored stack off its latch side; a plan with no stack gets the swing\'s',
    fn() {
      const o = OPEN('o:w4:r2'), side = -1, P = lanePlanOf(house('private', 'go').s).plans['o:w4:r2'];
      let locked = null, off = null;
      try { doorPlanOf('t', P.stack, { ...o, lock: { kind: 'key' } }, side, RECTS); } catch (e) { locked = e.message; }
      try { doorPlanOf('t', [[19.65, 13.95], [19.0, 13.95]], o, side, RECTS); } catch (e) { off = e.message; }
      const derived = doorPlanOf('t', null, o, side, RECTS);
      console.log(`      a locked pull door: "${locked}"\n      a stack on the hinge side: "${off}"\n      no stack authored: ${JSON.stringify(derived.stack)} (the plan's ${JSON.stringify(P.stack)})`);
      assert(/locked pull door/.test(locked ?? '') && /off the left \(latch\) side/.test(off ?? '') && derived.stack.every((p, i) => near(p, P.stack[i], 1e-3)), JSON.stringify({ locked, off, derived }));
    },
  },
  {
    name: 'the rows follow the swing: at room 2 (a pull) Open names it, "Open the door: pull", Kick door is struck "opens toward you" with no odds and cannot be started, and no Push ⇄ Kick is offered; at room 1 (a push) Kick is live with its odds and Push ⇄ Kick is offered from rung 2; in room 2 the closet\'s rows read from inside, "Open the door: push" and a live kick; a kick asked of the pull door is planned as the pull',
    fn() {
      const out = [];
      for (const tier of SHEETS) {
        const { g, s } = house(tier, 'room:2'), one = singleRows(s), b2 = bundleRows(s);
        const open = one.find(r => r.id === 'door:pull>o:w4:r2'), kick = one.find(r => r.id === 'door:kick>o:w4:r2');
        assert(open && open.label === 'Open the door: pull' && !open.off && kick && kick.off === KICK_PULL_WHY && kick.odds === null && !b2.some(r => r.id === 'drill:variant:breach'), JSON.stringify({ tier, open, kick, b2: b2.map(r => r.id) }));
        // (pressed anyway, the struck kick does nothing: the door shut, still choosing)
        g.step(1, { act: [stepAct('door:kick>o:w4:r2')] });
        assert(openingState(s, 'o:w4:r2') !== 'open' && s.stop?.phase === 'choose', JSON.stringify({ tier, door: openingState(s, 'o:w4:r2'), phase: s.stop?.phase }));
        const asked = breachOf(s, lanePlanOf(s).plans['o:w4:r2'], 'kick');
        const r1 = house(tier, 'go'), b1 = bundleRows(r1.s), rung = r1.s.armoury.range.house ? b1.find(r => r.id === 'drill:variant:breach') : null;
        out.push(`${tier}: room 2 "${open.label}" ${fmt(open.ms / 1000, 2)} s, Kick struck "${kick.off}", Push ⇄ Kick ${b2.some(r => r.id === 'drill:variant:breach') ? 'offered' : 'not offered'}, a kick asked planned as ${asked}; room 1 Push ⇄ Kick ${rung ? 'offered' : 'not offered'}`);
        assert(asked === 'pull', asked);
        if (['cpl', 'sgt', 'raider', 'tierone'].includes(tier)) assert(rung && rung.label === 'Push ⇄ Kick', JSON.stringify(b1.map(r => r.id)));
      }
      // (at room 1's door, stacked: Kick live with its odds)
      const { s: s1 } = house('private', 'go'), P1 = lanePlanOf(s1).plans['o:w4:r1'], me1 = s1.actors.list.find(a => a.who === s1.player.id);
      me1.x = P1.stack[0][0]; me1.z = P1.stack[0][1];
      const k1 = singleRows(s1).find(r => r.id === 'door:kick>o:w4:r1'), o1 = singleRows(s1).find(r => /^door:(push|pull)>o:w4:r1$/.test(r.id));
      // (in room 2, the closet: read from inside)
      const { s: s2 } = house('private', 'room:2'), me2 = s2.actors.list.find(a => a.who === s2.player.id), P2 = lanePlanOf(s2).plans['o:w4:r2'];
      setOpening(s2, 'o:w4:r2', 'open', { atMs: s2.clock.ms - 5000 }); me2.x = P2.points[0][0]; me2.z = P2.points[0][1];
      const inner = singleRows(s2).filter(r => r.id.endsWith('>o:w4:closet'));
      console.log(`      ${out.join('\n      ')}\n      room 1 stacked: "${o1?.label}", Kick ${k1?.off ? `struck ${k1.off}` : `live, ${Math.round((k1?.odds ?? 0) * 100)}%`}; room 2's closet from inside: ${inner.map(r => `${r.label}${r.off ? ` (${r.off})` : ''}`).join(', ')}`);
      assert(o1?.label === 'Open the door: push' && k1 && !k1.off && k1.odds > 0, JSON.stringify({ o1, k1 }));
      assert(inner.some(r => r.id === 'door:push>o:w4:closet' && r.label === 'Open the door: push') && inner.some(r => r.id === 'door:kick>o:w4:closet' && !r.off && r.odds > 0), JSON.stringify(inner));
    },
  },
  {
    name: 'a pull door is opened from its latch side (bundle.js latchSideOk): at room 2 from the hinge side, where its leaf would swing onto you and stand across your way in, Open is struck "from the latch side" (its badge "latch"), no row whose first beat is the door is offered, and Stack up takes you round to the latch side; from the latch side, a step off the stack, Open is live',
    fn() {
      const { g, s } = house('sgt', 'room:2'), me = s.actors.list.find(a => a.who === s.player.id), P = lanePlanOf(s).plans['o:w4:r2'];
      me.x = 19.9; me.z = 13.8;
      const rows = singleRows(s), open = rows.find(r => r.id === 'door:pull>o:w4:r2'), b = bundleRows(s), stack = rows.find(r => /^drill:stack:up/.test(r.id));
      const doorFirst = b.filter(r => /^drill:room:in/.test(r.id) && !r.off);
      g.step(1);
      const line = instinctNow(s)?.line ?? null;
      me.x = P.stack[0][0] - 0.4; me.z = P.stack[0][1];
      const open2 = singleRows(s).find(r => r.id === 'door:pull>o:w4:r2');
      console.log(`      at (19.90, 13.80), the hinge side: Open "${open?.off}", ${doorFirst.length} door-first rows live, Stack up ${stack ? 'offered' : 'NOT offered'}, the DI "${line?.text}" → ${line?.act}; 0.4 m off the stack on the latch side: Open ${open2?.off ?? 'live'}`);
      assert(open?.off === 'from the latch side' && !doorFirst.length && stack && open2 && !open2.off && !/door:pull/.test(String(line?.act ?? '')), JSON.stringify({ open, doorFirst: doorFirst.map(r => r.id), stack: stack?.id, line, open2 }));
    },
  },
  {
    name: 'the read says it (2026-11-15: "the read of the door says which"): Read the door at room 2 ends in the line "Pull door, hinge right.", at room 1 "Push door, hinge left.", and from rung 1 Stack up and take point\'s read says the same',
    fn() {
      const said = [];
      for (const [tier, setup, door, want] of [['private', 'room:2', 'o:w4:r2', 'Pull door, hinge right.'], ['recruit', 'go', 'o:w4:r1', 'Push door, hinge left.']]) {
        const { g, s } = house(tier, setup), me = s.actors.list.find(a => a.who === s.player.id), P = lanePlanOf(s).plans[door];
        me.x = P.stack[0][0]; me.z = P.stack[0][1]; g.clearFacts();
        g.step(1, { act: [stepAct(`door:read>${door}`)] });
        for (let t = 0; t < 40 && !g.facts('line').some(f => f.door === door); t++) g.step(1, {});
        const line = g.facts('line').find(f => f.door === door)?.text ?? null;
        said.push(`${tier} at ${door.replace('o:w4:', '')}: "${line}"`);
        assert(line === want, JSON.stringify({ tier, door, line, facts: g.facts('line') }));
      }
      // (the corporal's Stack up, take point at room 2: its read beat says it as it ends)
      const { g, s } = house('private', 'room:2'), P = lanePlanOf(s).plans['o:w4:r2'], me = s.actors.list.find(a => a.who === s.player.id);
      // (off the stack in the hall, west of it, so the walk to it does not run through the #2 at his)
      me.x = 20.6; me.z = 13.0; g.clearFacts();
      const row = bundleRows(s).find(r => /^drill:stack:point/.test(r.id));
      if (row) { g.step(1, { act: [stepAct(row.id)] }); for (let t = 0; t < 200 && !g.facts('line').some(f => f.door === 'o:w4:r2'); t++) g.step(1); }
      const bl = g.facts('line').find(f => f.door === 'o:w4:r2')?.text ?? null;
      console.log(`      ${said.join('; ')}; the private's Stack up, take point at room 2: ${row ? `"${bl}"` : 'not offered'}`);
      assert(!row || bl === 'Pull door, hinge right.', JSON.stringify({ row: row?.id, bl }));
    },
  },
  {
    name: 'each way costs its time (bundle.js doorS, planBundle): a pull adds its step back (PULL_STEP_S 0.3 × pace) and is passable only fully open at every rung, where a push is passable at two thirds from rung 3; at a pull door the approach ends at rest and the hand comes after the feet, where at a push door from rung 3 the hand rides the approach\'s last stretch: printed for every sheet with the room\'s planned time',
    fn() {
      const rows = [];
      for (const tier of SHEETS) {
        const { s } = house(tier, 'room:2'), pid = s.player.id, wh = skillsOf(s, pid).wh;
        const pull = doorS(wh, 'pull', 4), push = doorS(wh, 'push', 4), pull0 = doorS(wh, 'pull', 0), push0 = doorS(wh, 'push', 0);
        assert(pull.passMs === pull.ms && pull0.passMs === pull0.ms && push.passMs < push.ms && Math.abs(push.passMs - (push.handMs + 400 * PASS_SHARE)) <= 1 && Math.abs(pull.handMs - push.handMs - PULL_STEP_S * paceOf(wh) * 1000) <= 1, JSON.stringify({ tier, pull, push }));
        const P2 = planBundle(s, pid, 'room:clear', { door: 'o:w4:r2', rung: 4 }), d2 = P2?.beats.find(b => b.key === 'door'), a2 = P2?.beats.find(b => b.key === 'approach');
        const r1 = house(tier, 'go'), P1 = planBundle(r1.s, pid, 'room:clear', { door: 'o:w4:r1', rung: 4 }), d1 = P1?.beats.find(b => b.key === 'door'), a1 = P1?.beats.find(b => b.key === 'approach');
        assert(d2 && d2.how === 'pull' && d2.after.includes('approach') && !d2.after.includes('approach@arrive') && a2.prof.v1 === 0 && d2.passMs === d2.ms, JSON.stringify({ tier, d2, v1: a2?.prof?.v1 }));
        assert(d1 && d1.how === 'push' && d1.after.includes('approach@arrive') && a1.prof.v1 > 0, JSON.stringify({ tier, d1, v1: a1?.prof?.v1 }));
        rows.push(`${tier} (WH ${wh}): push ${fmt(push.handMs / 1000, 2)} + 0.40 s, way in at ${fmt(push.passMs / 1000, 2)} s from rung 3; pull ${fmt(pull.handMs / 1000, 2)} + 0.40 s, way in at ${fmt(pull.passMs / 1000, 2)} s; kick ${fmt(doorS(wh, 'kick', 4).ms / 1000, 2)} s; "Open, clear the room" at rung 4: room 2 (pull) ${fmt(P2.ms / 1000, 2)} s, room 1 (push) ${fmt(P1.ms / 1000, 2)} s`);
      }
      console.log(`      ${rows.join('\n      ')}`);
    },
  },
  {
    name: 'a leaf\'s arc is a no-stop zone only while it moves, and only the sweep still to come (places/zones.js arcLiveAt, swing.js inSweep): room 2\'s pull door sweeps the hall in front of it, live during the hand and the swing, the part already swept free, nothing once it is open; the funnels and the plan\'s zones are as before; a body\'s way out of the arc lies outside it',
    fn() {
      const { s } = house('private', 'room:2'), area = s.places.live.area, A = arcsOf(area).find(z => z.door === 'o:w4:r2');
      // (two places in front of room 2's door on the hall side: near the closed leaf (angle 10°) and near its open stop (80°))
      const at = (deg, r) => { const t = deg * Math.PI / 180; return [A.hinge[0] + r * (Math.cos(t) * A.u[0] + Math.sin(t) * A.n[0]), A.hinge[1] + r * (Math.cos(t) * A.u[1] + Math.sin(t) * A.n[1])]; };
      const lo = at(10, 0.6), hi = at(80, 0.6), now = s.clock.ms, seen = [];
      const check = (ms) => ({ ms: ms - now, lo: arcLiveAt(s, A, ...lo, ms), hi: arcLiveAt(s, A, ...hi, ms) });
      seen.push(['shut', check(now)]);
      setOpening(s, 'o:w4:r2', 'open', { atMs: now + 600 });          // (the hand 0.2 s, then the swing 0.4 s)
      for (const dt of [0, 150, 300, 400, 550, 600, 700]) seen.push([`+${dt}`, check(now + dt)]);
      console.log(`      room 2's arc: hinge ${JSON.stringify(A.hinge)}, reach ${A.rM} m, opening toward ${JSON.stringify(A.n)} (the hall); live at 10° and at 80°: ${seen.map(([k, v]) => `${k} ${v.lo ? '■' : '□'}${v.hi ? '■' : '□'}`).join(' · ')}`);
      const m = Object.fromEntries(seen);
      // (the hand to +200 ms: the whole quarter to come; at +300 the leaf a quarter open (22.5°), 10° swept and 80° to come; at +550
      // 87.5% (78.75°), 80° still to come; open at +600)
      assert(!m.shut.lo && !m.shut.hi && m['+0'].lo && m['+0'].hi && m['+150'].lo && !m['+300'].lo && m['+300'].hi && m['+550'].hi && !m['+600'].lo && !m['+600'].hi && !m['+700'].hi, JSON.stringify(seen));
      // (liveZoneAt gives the arc while it moves; the plan's zones never hold it)
      s.clock.ms = now + 300;
      const z = liveZoneAt(s, area, ...hi), plan = zonesOf(area).some(x => x.kind === 'arc'), e = exitOf(A, hi, [1, 0]), r = exitOf(A, hi);
      s.clock.ms = now;
      assert(z?.kind === 'arc' && z.door === 'o:w4:r2' && !plan && !inSweep(A, ...e, 0, 1) && !inSweep(A, ...r, 0, 1), JSON.stringify({ z, plan, e, r }));
      // (the drawing: the quarter from the closed leaf's edge to the open stop, the hall's side)
      const pts = arcPoints(A, 0.1);
      assert(near(pts[0], [A.hinge[0] + A.widthM * A.u[0], A.hinge[1]], 1e-6) && near(pts.at(-1), [A.hinge[0], A.hinge[1] + A.widthM * A.n[1]], 1e-6) && pts.every(p => p[1] <= A.hinge[1] + 1e-9), JSON.stringify(pts));
    },
  },
  {
    name: 'the swing is drawn on the floor (houseLook leaves, range-items.js leafArcPixels): stacked at room 2, its dotted quarter arc on the hall\'s side in pale (the pull read before a word), at room 1 on the room\'s side (the push); while a leaf moves only its sweep still to come, in LEAF_MOVING; gone once open',
    fn() {
      const out = [];
      for (const [setup, door, sideWant] of [['room:2', 'o:w4:r2', -1], ['go', 'o:w4:r1', -1]]) {
        const { s } = house('private', setup), L = (houseLook(s)?.leaves ?? []).find(l => l.door === door);
        const px = leafArcPixels(L), hingeZ = L?.hinge?.[1];
        // (room 2's hall lies north of its door (z < 14.4); room 1's room north of its door (z < 12): both arcs on the north side)
        const side = px.every(p => Math.sign(p.z - hingeZ - 1e-9) <= 0) ? -1 : 1;
        out.push(`${door.replace('o:w4:', '')} ${L?.how}: ${px.length} px, ${px.every(p => p.c === LEAF_SHUT) ? 'pale' : 'other'}, on the ${side < 0 ? 'north' : 'south'} side of its wall`);
        assert(L && !L.moving && px.length >= 10 && px.every(p => p.c === LEAF_SHUT) && side === sideWant && L.how === (door === 'o:w4:r2' ? 'pull' : 'push'), JSON.stringify({ L, n: px.length, side }));
        // (moving: the sweep still to come only, in the warning colour; then gone)
        const now = s.clock.ms;
        setOpening(s, door, 'open', { atMs: now + 200 });
        const M = (houseLook(s)?.leaves ?? []).find(l => l.door === door), mp = leafArcPixels(M);
        s.clock.ms = now + 250;
        const gone = (houseLook(s)?.leaves ?? []).find(l => l.door === door);
        s.clock.ms = now;
        out.push(`  moving at ${fmt(M?.openK ?? 0, 2)} open: ${mp.length} px ${mp.every(p => p.c === LEAF_MOVING) ? 'warning' : 'other'}; open: ${gone ? 'still drawn' : 'gone'}`);
        assert(M?.moving && mp.length > 0 && mp.length < px.length && mp.every(p => p.c === LEAF_MOVING) && !gone, JSON.stringify({ M, n: mp.length, gone }));
      }
      console.log(`      ${out.join('\n      ')}`);
    },
  },
  {
    name: 'the DI never names a struck kick: at room 2 the recruit\'s and the private\'s line is the pull ("Pull it open." and the like) naming door:pull, every line at the door names a live row; a locked pull door\'s hand-back says to hold it, never to kick it',
    fn() {
      const said = [];
      for (const tier of ['recruit', 'private']) {
        const { g, s } = house(tier, 'room:2');
        g.step(1);
        const line = instinctNow(s)?.line ?? null, act = String(line?.act ?? '');
        said.push(`${tier}: "${line?.text}" → ${act}`);
        assert(/door:pull>o:w4:r2$/.test(act) && !/kick/.test(act), JSON.stringify(line));
      }
      console.log(`      ${said.join('; ')}; a locked pull door: "${HANDBACK_WORDS['refused-pull']}"`);
      assert(/Hold it/.test(HANDBACK_WORDS['refused-pull']) && !/Kick/.test(HANDBACK_WORDS['refused-pull']), HANDBACK_WORDS['refused-pull']);
    },
  },
];
