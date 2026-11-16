// OLYMPUS tests: the live men's seam, src/sim/combat/men.js (the build sheet v0.0.19 §3.3, §6 "L", §0 item 13): what a viewer sees of a stand (every sighting's own expression, to the bit) and of a live man (his exposure), the fading memory, the eye drawn by a round, a marking round at a marine, and a man covered and accounted for.
//
// The stand's case plays the honest tier one's lane on 48213 from the fill to the card and, on every tick, holds men.js seenK
// against the expression each sighting read before v0.0.19 (PEOPLE's sightOf at the stand's spot times its facing): raw where
// contact.js twoOn read it raw, quantised to 1e-6 where the detector and the #2's twoSees quantised it, for you and your
// number two and every stand facing. The live man's cases use tests/drill-world.mjs (house 1 at 1 G, a sergeant's sheet) with
// stand 3a's record made live ({ live: { who, st } }, the shape src/sim/scenarios/opfor.js writes), the detector driven tick by
// tick (contact.js contactLook) on a clock moved by hand, the role-players' brain stubbed by writing his record.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { botOf } from './flawless.mjs';
import { runHouse } from './bots/house.mjs';
import { drillWorld } from './drill-world.mjs';
import { q } from '../src/core/num.js';
import { TICK_MS } from '../src/core/clock.js';
import { sightOf, SEEN } from '../src/sim/people/perception.js';
import { facingOf } from '../src/sim/arms/turners.js';
import { contactLook } from '../src/sim/combat/contact.js';
import { contactOf } from '../src/sim/people/mind.js';
import { twoSees } from '../src/sim/scenarios/shoothouse.js';
import { seenK, incoming, struckOn, coverTick, coveringOf, accountedOf, gateWhy, upNow, MAN_MEMORY_MS, COVER_MS, CASUALTY_MS } from '../src/sim/combat/men.js';
import { blockOf, HIT_PTS } from '../src/sim/combat/supp.js';
import { poiOf } from '../src/sim/arms/shot.js';
import { gunOn } from '../src/sim/arms/shooting.js';
import { gunField } from '../src/sim/arms/firearms.js';
import { loadOf } from '../src/sim/arms/calibres.js';
import { MODELS } from '../src/sim/arms/models.js';

// (the spots found by a scratch search on house 1's sight grid, from room 3's point 1 (18.5, 11.5): his centre and one side
// clear, the other behind the wall; one side clear only; all three clear; all three blocked)
const VIEW = [18.5, 11.5], HALF = [15.5, 8.75], SLIVER = [15.4, 8.75];

// (a drill world with stand 3a made a live man at (x, z), you on VIEW facing face)
function liveWorld({ at = HALF, face = 'left', st = 'aim' } = {}) {
  const W = drillWorld({ tier: 'sgt' }), s = W.s, me = W.me(), T = W.T('3a');
  me.x = VIEW[0]; me.z = VIEW[1]; me.face = face; me.headRad = { left: Math.PI, right: 0, up: -Math.PI / 2, down: Math.PI / 2 }[face];
  T.x = at[0]; T.z = at[1]; T.live = { who: 'p:rp-test', card: 'fight', st, seen: [] };
  return { ...W, s, me, T };
}
// (one tick of the clock moved by hand, then the detector's look)
function look(W, n = 1) { for (let i = 0; i < n; i++) { W.s.clock.ms += TICK_MS; W.s.clock.tick += 1; contactLook(W.s, {}, W.g.bus, {}); } }
// (a fully clear spot and a fully hidden one, found by the test itself near 3a, so the memory case reads what the grid says)
function spots(W) {
  const out = { clear: null, hidden: null };
  for (let x = 14; x <= 17 && !(out.clear && out.hidden); x += 0.1) for (let z = 6; z <= 9.5; z += 0.1) {
    W.T.x = q(x, 0.01); W.T.z = q(z, 0.01);
    const k = seenK(W.s, W.me, W.T, W.s.clock.ms), d = Math.hypot(W.T.x - VIEW[0], W.T.z - VIEW[1]);
    if (d < 3) continue;
    if (!out.clear && k >= 0.999) out.clear = [W.T.x, W.T.z];
    if (!out.hidden && k === 0) out.hidden = [W.T.x, W.T.z];
  }
  return out;
}

export default [
  {
    name: 'a stand\'s seenK is the sighting\'s own to the bit (the build sheet v0.0.19 §0 item 13): raw as twoOn read it, quantised as the detector and the #2\'s twoSees read it, for you and your #2 and every stand facing, on every tick of the honest tier one\'s lane on 48213 (fails if the helper\'s expression drifts)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone' });
      let ticks = 0, pairs = 0, seen = 0, twoChecks = 0;
      const bad = [];
      const r = runHouse(g, botOf('honest', { seed: 48213 }), { each: (game) => {
        const s = game.state, ms = s.clock.ms, H = s.armoury.range.house, me = game.me(), two = H?.two?.pid ? s.actors.list.find(a => a.who === H.two.pid) : null;
        ticks++;
        for (const T of s.armoury.range.turners ?? []) {
          const f = facingOf(T, ms);
          if (f < SEEN) continue;
          for (const a of [me, two]) {
            if (!a) continue;
            const was = sightOf(s, a, { x: T.x, z: T.z }, ms).vis * f, now = seenK(s, a, T, ms), nowF = seenK(s, a, T, ms, { f });
            pairs++;
            if (q(was, 1e-6) >= SEEN) seen++;
            if (!Object.is(was, now) || !Object.is(was, nowF) || q(was, 1e-6) !== q(now, 1e-6)) bad.push({ tick: s.clock.tick, key: T.key, by: a.who, was, now });
            if (a === two) { twoChecks++; if (twoSees(s, a, T, ms) !== (q(was, 1e-6) >= SEEN)) bad.push({ tick: s.clock.tick, key: T.key, twoSees: true }); }
          }
        }
      } });
      console.log(`      the lane: ${r.done ? 'to the card' : 'NOT to the card'} in ${fmt(r.ms / 1000, 1)} s, ${ticks} ticks; ${pairs} viewer-stand pairs facing (${seen} seen at SEEN), ${twoChecks} of the #2's twoSees; differing ${bad.length}`);
      assert(r.done && pairs > 1000 && seen > 100 && !bad.length, JSON.stringify({ done: r.done, pairs, seen, bad: bad.slice(0, 5) }));
    },
  },
  {
    name: 'a live man half behind room 3\'s wall is seen at two lines of three (0.67, over SEEN) and not at one (0.33), where his centre alone said 1 and 0 (fails without the exposure)',
    fn() {
      const W = liveWorld(), out = [];
      for (const [name, at, want] of [['half', HALF, 2 / 3], ['sliver', SLIVER, 1 / 3]]) {
        W.T.x = at[0]; W.T.z = at[1];
        const k = seenK(W.s, W.me, W.T, W.s.clock.ms), centre = sightOf(W.s, W.me, { x: at[0], z: at[1] }, W.s.clock.ms).vis;
        out.push({ name, at, k: q(k, 1e-4), centre: q(centre, 1e-4), want: q(want, 1e-4) });
      }
      for (const o of out) console.log(`      ${o.name.padEnd(6)} at [${o.at}] from [${VIEW}]: seenK ${fmt(o.k, 3)} (three lines' share ${fmt(o.want, 3)}), his centre's sight ${fmt(o.centre, 3)}`);
      const [half, sliver] = out;
      assert(Math.abs(half.k - 2 / 3) < 0.01 && half.k >= SEEN && Math.abs(sliver.k - 1 / 3) < 0.01 && sliver.k < SEEN && half.centre === 1 && sliver.centre === 0, JSON.stringify(out));
    },
  },
  {
    name: `a live man out of sight is remembered MAN_MEMORY_MS (${MAN_MEMORY_MS} ms), then his return is a fresh window (fails with no memory: a window every return, or none)`,
    fn() {
      const W = liveWorld(), sp = spots(W), c = () => contactOf(W.s);
      assert(sp.clear && sp.hidden, JSON.stringify(sp));
      const put = (p) => { W.T.x = p[0]; W.T.z = p[1]; };
      const marks = [];
      put(sp.clear); look(W);
      marks.push({ at: 'first sighting', n: c()?.n ?? 0, pending: !!c()?.pending });
      c().pending = null;                                              // (the pause taken: the window closed, he is known)
      put(sp.hidden); look(W, Math.round(2000 / TICK_MS));
      marks.push({ at: 'out of sight 2.0 s', n: c().n, known: c().known[W.T.key] !== undefined });
      put(sp.clear); look(W);
      marks.push({ at: 'back after 2.0 s', n: c().n, pending: !!c().pending });
      put(sp.hidden); look(W, Math.round(3500 / TICK_MS));
      marks.push({ at: 'out of sight 3.5 s', n: c().n, known: c().known[W.T.key] !== undefined });
      put(sp.clear); look(W);
      marks.push({ at: 'back after 3.5 s', n: c().n, pending: !!c().pending });
      console.log(`      clear at [${sp.clear}], hidden at [${sp.hidden}]: ${marks.map(m => `${m.at}: window ${m.n}${m.pending ? ' open' : ''}${m.known !== undefined ? (m.known ? ', known' : ', forgotten') : ''}`).join('; ')}`);
      assert(marks[0].n === 1 && marks[0].pending && marks[1].known && marks[2].n === 1 && !marks[2].pending && !marks[3].known && marks[4].n === 2 && marks[4].pending, JSON.stringify(marks));
    },
  },
  {
    name: 'a round from a man outside your cone draws your eye: a window opens on him the next look, expect alert, where without the round none does, and in a room you are clearing (mind.clearing, where expectOf alone reads \'area\') still alert (fails without the drawn eye, or without its expectation: the review of track L)',
    fn() {
      // (a spot behind you, past the awareness radius, with a clear line: found on the grid, unseen undrawn and seen drawn)
      const W0 = liveWorld({ face: 'right' });
      let at = null;
      for (let x = 13; x <= 17.5 && !at; x += 0.1) for (let z = 6; z <= 10 && !at; z += 0.1) {
        W0.T.x = q(x, 0.01); W0.T.z = q(z, 0.01);
        if (seenK(W0.s, W0.me, W0.T, W0.s.clock.ms) === 0 && seenK(W0.s, W0.me, W0.T, W0.s.clock.ms, { drawn: true }) >= 0.999) at = [W0.T.x, W0.T.z];
      }
      assert(at, 'no spot behind you with a clear line');
      const runs = {};
      for (const [fired, clearing] of [[false, false], [true, false], [true, true]]) {
        const W = liveWorld({ at, face: 'right' }), s = W.s, pid = s.player.id;
        // (the house's GO writes mind.clearing (shoothouse.js noteMind): react.js expectOf then reads 'area' outside the muzzle's sector)
        if (clearing) s.mind.clearing = { room: 'r3', fromMs: s.clock.ms };
        const k0 = seenK(s, W.me, W.T, s.clock.ms);
        if (fired) incoming(s, W.g.bus, { who: pid, by: W.T.key, shot: { id: 'sh:test-1', fired: true, hole: null, zone: null, part: 'torso', load: 'marking', muzzle: { x: at[0], y: 1.4, z: at[1] }, dirRad: Math.atan2(VIEW[1] - at[1], VIEW[0] - at[0]), atMs: s.clock.ms } });
        const drawn = !!contactOf(s)?.drawn;
        contactLook(s, {}, W.g.bus, {});
        const P = contactOf(s)?.pending ?? null;
        runs[clearing ? 'clearing' : fired ? 'fired' : 'quiet'] = { k0: q(k0, 1e-4), drawn, window: !!P, expect: P?.expect ?? null, ms: P?.ms ?? null, pool: q(blockOf(s, pid)?.supp ?? 0, 0.01), spent: !contactOf(s)?.drawn };
      }
      console.log(`      the shooter at [${at}], ${fmt(Math.hypot(at[0] - VIEW[0], at[1] - VIEW[1]), 2)} m behind you (facing right)`);
      for (const [k, v] of Object.entries(runs)) console.log(`      ${k.padEnd(8)}: seen undrawn ${fmt(v.k0, 2)}, eye drawn ${v.drawn}, ${v.window ? `window open, expect ${v.expect}, take-in ${fmt(v.ms / 1000, 2)} s` : 'no window'}; your pool ${fmt(v.pool, 2)}; the drawn eye spent ${v.spent}`);
      assert(runs.quiet.k0 < SEEN && !runs.quiet.window && runs.fired.drawn && runs.fired.window && runs.fired.expect === 'alert' && runs.fired.spent && runs.fired.pool > 0, JSON.stringify(runs));
      assert(runs.clearing.window && runs.clearing.expect === 'alert', JSON.stringify(runs.clearing));
    },
  },
  {
    name: `a marking round on a marine is on R.house.live.struck with its part and zone, stings HIT_PTS (${HIT_PTS}) and never wounds him; v0.0.20 (the user's answer of 2026-11-16, "Paintball should end if the hit is 'fatal'"): each strike is rated by the would-have (combat/would.js), one torso strike a wound and the lane on, two in the torso as the model rates them, and the strike it rates fatal the casualty, CASUALTY_MS (${CASUALTY_MS} ms) to the card, its why and its shot on the casualty (fails without the one rule)`,
    fn() {
      const W = liveWorld(), s = W.s, pid = s.player.id;
      s.armoury.range.house = { live: { mode: 'live', cards: {}, seenBy: {}, struck: [], casualty: null, ruled: [] } };
      const shot = (n, part, zone) => ({ id: `sh:t${n}`, fired: true, hole: { at: [0, 30] }, zone, part, load: 'marking', muzzle: { x: W.T.x, y: 1.4, z: W.T.z }, dirRad: 0, atMs: s.clock.ms + n * 100 });
      const r1 = incoming(s, W.g.bus, { who: pid, by: W.T.key, shot: shot(1, 'torso', 'C') });
      const after1 = { ...struckOn(s, pid), pool: q(blockOf(s, pid)?.supp ?? 0, 0.01), wounds: (s.people[pid].body?.injuries ?? []).length };
      const r2 = incoming(s, W.g.bus, { who: pid, by: W.T.key, shot: shot(2, 'torso', 'A') });
      const L = s.armoury.range.house.live, c2 = L.casualty ? { ...L.casualty } : null;
      const r3 = incoming(s, W.g.bus, { who: pid, by: W.T.key, shot: shot(3, 'head', 'head') });
      const v = (r) => (r.would ? `${r.would.layer} ${r.would.fatal ? `FATAL (${r.would.why})` : r.would.why ?? 'wound'} w ${r.would.w}` : 'none');
      console.log(`      one round (torso C): hit ${r1.hit}, down ${r1.down}, would-have ${v(r1)}, marks torso ${after1.torso} head ${after1.head}, your pool ${fmt(after1.pool, 1)}, your own body's injuries ${after1.wounds}; two rounds (torso A): down ${r2.down}, would-have ${v(r2)}; the head: down ${r3.down}, would-have ${v(r3)}; the casualty ${JSON.stringify(L.casualty)}; the 'house' facts ${W.g.facts('house').map(f => `${f.phase}${f.would ? `:${f.would}` : ''}`).join(', ')}`);
      assert(r1.hit && !r1.down && !r1.would.fatal && after1.torso === 1 && after1.pool === HIT_PTS && after1.wounds === 0 && L.struck[0].part === 'torso' && L.struck[0].zone === 'C' && L.struck[0].by === W.T.key, JSON.stringify({ r1, after1 }));
      // (the casualty on the first strike rated fatal, none before it; the head rated fatal (99 to 100% at any Fitness, the design's table))
      const first = [r1, r2, r3].find(r => r.would?.fatal), at = [r1, r2, r3].indexOf(first);
      assert(r3.would.fatal && first && L.casualty?.who === pid && L.casualty.shotId === first.would.shotId && L.casualty.why === first.would.why && L.casualty.endAtMs - L.casualty.atMs === CASUALTY_MS
        && (at === 1 ? c2?.shotId === r2.would.shotId : !c2) && (s.people[pid].body?.injuries ?? []).length === 0, JSON.stringify({ r1, r2, r3, L: L.casualty }));
    },
  },
  {
    name: `a live man down is covered once your muzzle has held on him COVER_MS (${COVER_MS} ms): the clear gate's 'down' until then, accounted for after; a man seen and gone behind the bend is 'unaccounted'`,
    fn() {
      const W = liveWorld({ st: 'down' }), s = W.s, pid = s.player.id;
      s.armoury.range.house = { live: { mode: 'live', cards: {}, seenBy: {}, struck: [], casualty: null, ruled: [] } };
      W.T.stoppedAtMs = s.clock.ms;
      s.people[pid].kit.carry.posture = 'aimed';
      W.me.headRad = Math.atan2(W.T.z - W.me.z, W.T.x - W.me.x);
      const rows = [];
      for (let t = 0; t <= COVER_MS + TICK_MS; t += TICK_MS) {
        const by = coverTick(s, W.T, s.clock.ms);
        rows.push({ t, by, gate: gateWhy(s, W.T, s.clock.ms), acc: accountedOf(s, W.T, s.clock.ms) });
        s.clock.ms += TICK_MS; s.clock.tick += 1;
      }
      // (a man up, seen by the team once, now behind the wall)
      const U = liveWorld({ at: [15.4, 8.75] }), su = U.s;
      su.armoury.range.house = { live: { mode: 'live', cards: {}, seenBy: { [U.T.key]: su.clock.ms }, struck: [], casualty: null, ruled: [] } };
      const hid = { k: q(seenK(su, U.me, U.T, su.clock.ms), 1e-3), gate: gateWhy(su, U.T, su.clock.ms), up: upNow(U.T, su.clock.ms) };
      console.log(`      down: ${rows.filter((r, i) => i % 2 === 0 || i === rows.length - 1).map(r => `${r.t} ms ${r.gate ?? 'covered'}${r.acc ? ` (${r.acc})` : ''}`).join(', ')}; up behind the bend: seen ${hid.k}, gate ${hid.gate}`);
      const first = rows.find(r => r.acc === 'down');
      assert(rows[0].gate === 'down' && first && first.t >= COVER_MS && first.by === pid && hid.gate === 'unaccounted' && hid.up, JSON.stringify({ rows, hid }));
    },
  },
  {
    name: 'a marking round flies as marking (shot.js poiOf, the chambered round\'s load or the fired one): 0.5 g at about 119 m/s, its spin bias at 5 m on the Wheel 2.8 cm, where it flew as ball (0.43 cm, about 800 m/s; the review of track L)',
    fn() {
      // (the house at GO with a marking round chambered by hand: the live lane's issue, kit.js 'house-fof', is L-house's and L-opfor's)
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go' }), s = g.state, pid = s.player.id, gunId = gunOn(s, pid), me = s.actors.list.find(a => a.who === pid);
      // (the marking load is L-opfor's (calibres.js): without it (this role's worktree alone) a note and nothing run)
      if (!loadOf(MODELS[s.items[gunId].model ?? 'r7'].cal, 'marking')) { console.log('      (no marking load in calibres.js: it lands with L-opfor; nothing run)'); return; }
      s.items[gunId].load = 'marking';
      const target = { key: 'm:test', kind: 'marine', x: me.x + 5, z: me.z, y: 1.35, dM: 5 };
      const spin = (p) => p.terms.find(t => t.key === 'spin') ?? { elevCm: 0, windCm: 0 }, cm = (p) => Math.hypot(spin(p).elevCm, spin(p).windCm);
      const chambered = poiOf(s, pid, gunId, target), fired = poiOf(s, pid, gunId, target, { load: 'marking' }), ball = poiOf(s, pid, gunId, target, { load: 'ball' });
      console.log(`      the chambered round ${gunField(s.items[gunId], 'load')}: ${chambered.flight.vMs} m/s, spin ${fmt(cm(chambered), 2)} cm; fired 'marking' ${fired.flight.vMs} m/s, ${fmt(cm(fired), 2)} cm; ball ${ball.flight.vMs} m/s, ${fmt(cm(ball), 2)} cm at 5 m`);
      assert(chambered.flight.vMs < 130 && fired.flight.vMs < 130 && ball.flight.vMs > 500, JSON.stringify({ c: chambered.flight, f: fired.flight, b: ball.flight }));
      assert(Math.abs(cm(fired) - 2.82) < 0.15 && Math.abs(cm(chambered) - 2.82) < 0.15 && cm(ball) < 1, JSON.stringify({ c: cm(chambered), f: cm(fired), b: cm(ball) }));
    },
  },
];
