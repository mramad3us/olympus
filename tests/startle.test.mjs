// The startle: the take-in's window re-used, the keys taken while the body freezes (COMBAT §5.7; the build sheet 0.0.9 §2.1, §5.1, §8 item 11).
//
// A scripted training bang 1.5 m behind the private on the fixture bay (tests/contact-world.mjs: the 25 m bay's 7 m point,
// six turners edge-on), out of the mode and in it: the tick it lands, the startle's ticks, every key refused between
// (game.js act()'s gate, contact.js refusesAct) and the feet stopped (feetOf), a turner turned inside it taken in only
// from its end with the band of that moment, a stop-motion hold let go inside it and given back at its end; a save at its
// start + 1, + 10 and + 20 ticks loading to the same digest on the same tick; a prepared bang (the thrower's) and a called
// one startling nobody; a felt jump of 9 never startling and one of 10 always.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { bayGame, turn, runTo, LANE } from './contact-world.mjs';
import { refusesAct, feetOf } from '../src/sim/combat/contact.js';
import { contactOf } from '../src/sim/people/mind.js';
import { isHeld } from '../src/core/clock.js';
import { bang, addSupp, startled, blockOf, feltOf, bandN, suppNow, hardOf } from '../src/sim/combat/supp.js';
import { offerReflex } from '../src/sim/combat/reflex.js';
import { pairsBot } from './bots/pairs.mjs';

const ACTIONS = ['shoot', 'ready', 'carry', 'stance:down', 'stance:up', 'stop:fire', 'stop:aim', 'digit:1', 'instinct', 'debug:skip:60000', 'people', 'kd:police'];
const behind = (me) => ({ x: me.x - 1.5, z: me.z });
// (the fixture's familiarisation issue wears ear defenders on the head: off, ears unprotected, the user's case)
const earsOff = (state, pid) => { const w = state.people[pid].kit.worn; for (const [slot, id] of Object.entries(w)) if (state.items[id]?.type === 'ears') delete w[slot]; };

export default [
  {
    name: 'a bang behind the private out of the mode: the startle from the tick it lands to its end, every action refused and the feet stopped between, X and the keys doing nothing, a turner turned inside it taken in only from its end with that moment\'s band; the end\'s fact and J\'s "Startled … s"',
    fn() {
      const { g, me, pid } = bayGame({ tier: 'private' });
      earsOff(g.state, pid);
      const T = g.state.clock.ms, x0 = me.x, z0 = me.z;
      const out = bang(g.state, g.bus, { id: 'test:1', ...behind(me), atMs: T });
      const B = blockOf(g.state, pid), until = B.startleUntilMs;
      const inside = ACTIONS.filter(a => refusesAct(g.state, a));
      // (a turner of the lane turned at once: it faces inside the startle)
      turn(g, [LANE], T);
      const log = [];
      let n = 0;
      while (g.state.clock.ms < until + 400 && n < 200) {
        const s = g.state, on = startled(s, pid), P = contactOf(s)?.pending;
        log.push({ ms: s.clock.ms - T, on, P: !!P, stop: !!s.stop, x: me.x, z: me.z });
        g.step(1, on ? { act: ['shoot'], mz: 1, mx: 1 } : {});
        n++;
      }
      const s = g.state, seen = contactOf(s)?.pending ?? contactOf(s)?.last, ends = g.facts('startle').map(f => `${f.phase} ${f.ms}`);
      const inStartle = log.filter(l => l.on), moved = inStartle.some(l => l.x !== x0 || l.z !== z0), stopped = inStartle.some(l => l.stop), pendIn = inStartle.some(l => l.P);
      const entry = s.log.filter(e => e.kind === 'startle').at(-1);
      console.log(`      the bang at T, 1.5 m behind: pool ${B.supp}, felt ${out.find(o => o.who === pid).felt} (hardening ${hardOf(s, pid)}), startled to T + ${until - T} (${(until - T) / 50} ticks), flash ${out.find(o => o.who === pid).flash ?? 'none'} (his back to it), deafened ${fmt((B.deafUntilMs - T) / 3_600_000, 2)} h`);
      console.log(`      inside: ${inside.length} of ${ACTIONS.length} actions refused; X, Z and D held every tick: the mode ${stopped ? 'ENTERED' : 'never entered'}, the feet ${moved ? 'MOVED' : 'still'}; a window ${pendIn ? 'OPENED INSIDE' : 'never opened inside'}`);
      console.log(`      the turner seen at T + ${seen.seenMs - T} (the startle's end T + ${until - T}), its band ${seen.band ?? 0} (felt ${feltOf(s, pid, seen.seenMs)} then: ${bandN(feltOf(s, pid, seen.seenMs))}), its take-in ${seen.ms} ms with ${seen.parts.filter(p => p.ms && !String(p.why).startsWith('Warfighting')).map(p => `+${p.ms} (${p.why})`).join(', ') || 'no band'}; facts ${ends.join(', ')}; J: "${entry?.text}"`);
      assert(inside.length === ACTIONS.length && !moved && !stopped && !pendIn, JSON.stringify({ inside: inside.length, moved, stopped, pendIn }));
      assert(seen.seenMs === until && (seen.band ?? 0) === bandN(feltOf(s, pid, seen.seenMs)) && seen.band >= 1 && seen.ms > 550, JSON.stringify({ seenMs: seen.seenMs - T, until: until - T, band: seen.band }));
      assert(ends.join() === `start ${until - T},end ${until - T}` && entry && /^Startled \d\.\d\d s: the bang, the chaos \d+ − your hardening 17 = felt \d+\.$/.test(entry.text), JSON.stringify({ ends, entry }));
      assert(!refusesAct(g.state, 'digit:1') || !!contactOf(g.state)?.pending, 'keys back after');
    },
  },
  {
    name: 'a bang in stop motion: the hold is let go inside the startle (time runs, every key refused), given back at its end; a save at its start + 1, + 10 and + 20 ticks loads to the same tick and the same digest as the unsaved run',
    fn() {
      const mk = () => { const w = bayGame({ tier: 'private' }); earsOff(w.state, w.pid); w.g.step(1, { act: ['shoot'] }); return w; };
      const { g, me, pid } = mk();
      const held0 = isHeld(g.state, 'stop'), mode = g.state.stop?.mode, T = g.state.clock.ms;
      bang(g.state, g.bus, { id: 'test:2', ...behind(me), atMs: T });
      const until = blockOf(g.state, pid).startleUntilMs, saves = {}, track = [];
      let k = 0;
      const keys = (s) => (startled(s, pid) ? { act: ['digit:1'] } : {});
      while (k < 60) {
        g.step(1, keys(g.state)); k++;
        track.push(`${g.state.clock.ms - T}${isHeld(g.state, 'stop') ? 'H' : ''}`);
        if ([1, 10, 20].includes(k)) saves[k] = { json: g.save(), atMs: g.state.clock.ms };
      }
      g.step(10);
      const end = { ms: g.state.clock.ms, digest: g.digest(), held: isHeld(g.state, 'stop') };
      const res = Object.entries(saves).map(([at, sv]) => {
        const h = createGame({ scenario: 'test-handling', seed: 48213 });
        h.load(sv.json);
        for (let n = Number(at); n < 60; n++) h.step(1, keys(h.state));
        h.step(10);
        return { at, ms: h.state.clock.ms - T, same: h.digest() === end.digest && h.state.clock.ms === end.ms, errors: h.errors.length };
      });
      const ranInside = track.filter(t => !t.endsWith('H')).length, heldAfter = track.filter(t => t.endsWith('H'));
      console.log(`      in the mode (${mode}, held ${held0}), the bang at T: startled to T + ${until - T}; ticks lived inside ${ranInside}, held from ${heldAfter[0] ?? 'never'} (${heldAfter.length} ticks held of ${track.length}); digit 1 pressed every tick: ${g.facts('step').filter(f => f.phase === 'start').length} steps begun`);
      console.log(`      saves at + 1, + 10, + 20 ticks: ${res.map(r => `+${r.at}: ${r.same ? 'same tick, same digest' : 'DIFFERENT'}`).join('; ')}; the run's end T + ${end.ms - T}, held ${end.held}`);
      assert(held0 && mode === 'stop' && ranInside >= (until - T) / 50 - 1 && end.held && !g.facts('step').some(f => f.phase === 'start' && f.fromMs < until), JSON.stringify({ held0, ranInside, track: track.slice(0, 8) }));
      assert(res.every(r => r.same && !r.errors), JSON.stringify(res));
    },
  },
  {
    name: 'a prepared bang (the thrower\'s own) and a called one startle nobody; a felt jump of 9 never startles, of 10 always (STARTLE_FROM); a startle inside a startle runs to the later end, FROZE the whole freeze',
    fn() {
      const { g, me, pid, state } = bayGame({ tier: 'private' });
      const coach = state.actors.list.find(a => a.who !== pid);
      const T = state.clock.ms;
      const own = coach ? bang(state, g.bus, { id: 'test:3', x: coach.x - 1, z: coach.z, atMs: T, byId: coach.who }) : [];
      const called = createGame({ scenario: 'test-handling', seed: 48213 });
      const cs = called.state, cme = called.me(), cpid = cs.player.id;
      const c = bang(cs, called.bus, { id: 'test:4', x: cme.x - 1.5, z: cme.z, atMs: cs.clock.ms, called: true });
      const ownCoach = own.find(o => o.who === coach?.who);
      // (a jump of 9, then of 10: the hit's points chosen against the private's hardening)
      const j = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'private' }), js = j.state, jp = js.player.id, H = hardOf(js, jp);
      const nine = addSupp(js, j.bus, jp, { id: 'test:5', kind: 'hit', pts: H + 9, atMs: js.clock.ms });
      const k = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'private' }), ks = k.state, kp = ks.player.id;
      const ten = addSupp(ks, k.bus, kp, { id: 'test:6', kind: 'hit', pts: hardOf(ks, kp) + 10, atMs: ks.clock.ms });
      // (two bangs 0.5 s apart on one man: the second's startle inside the first's, the freeze to the later end)
      const two = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'recruit' }), ts = two.state, tp = ts.player.id, tm = two.me(), t0 = ts.clock.ms;
      bang(ts, two.bus, { id: 'pairs:0:1', x: tm.x - 1.5, z: tm.z, atMs: t0 });
      const u1 = blockOf(ts, tp).startleUntilMs;
      two.step(10);
      bang(ts, two.bus, { id: 'pairs:0:2', x: tm.x - 1.5, z: tm.z, atMs: ts.clock.ms });
      const u2 = blockOf(ts, tp).startleUntilMs;
      two.step(Math.ceil((u2 - ts.clock.ms) / 50) + 2);
      const froze = suppNow(ts, tp).froze;
      console.log(`      the thrower's own (prepared): his pool ${ownCoach ? blockOf(state, coach.who)?.supp : '-'}, startle ${ownCoach?.startleMs ?? '-'} ms, flash ${ownCoach?.flash ?? 'none'}; a called bang on the player: pool ${blockOf(cs, cpid)?.supp}, startle ${c.find(o => o.who === cpid)?.startleMs} ms`);
      console.log(`      the private (H ${H}): a hit of ${H + 9} points, felt 0 → ${nine.after} (jump ${nine.jump}): startle ${nine.startleMs} ms; of ${H + 10}: jump ${ten.jump}, startle ${ten.startleMs} ms`);
      console.log(`      the recruit, two bangs 0.5 s apart: the first to T + ${u1 - t0}, the second's to T + ${u2 - t0}; FROZE ${froze ? fmt(froze.ms / 1000, 2) : '-'} s (from T to the later end)`);
      assert((!ownCoach || ownCoach.startleMs === 0) && c.find(o => o.who === cpid).startleMs === 0 && !startled(cs, cpid), JSON.stringify({ ownCoach, c }));
      assert(nine.jump === 9 && nine.startleMs === 0 && ten.jump === 10 && ten.startleMs > 0, JSON.stringify({ nine, ten }));
      assert(u2 >= u1 && froze && froze.ms === u2 - t0, JSON.stringify({ u1: u1 - t0, u2: u2 - t0, froze }));
    },
  },
  {
    name: 'a reflex card that holds time inside a startle (a round fired by a row\'s part clicking) ends the startle there, so the card can be answered: never a game frozen with every key refused',
    fn() {
      const { g, me, pid, state } = bayGame({ tier: 'recruit' });
      earsOff(state, pid);
      g.step(1, { act: ['shoot'] });
      const T = state.clock.ms;
      bang(state, g.bus, { id: 'test:7', ...behind(me), atMs: T });
      g.step(3);
      const until0 = blockOf(state, pid).startleUntilMs;
      offerReflex(state, g.bus, { why: 'click', title: 'Click.' });
      g.step(1);
      const B = blockOf(state, pid), on = startled(state, pid), refused = refusesAct(state, 'reflex:tap');
      console.log(`      startled to T + ${until0 - T}; a card at T + ${state.clock.ms - T - 50}: the startle ended at T + ${B.startleUntilMs - T} (FROZE ${B.startleMs} ms), startled ${on}, the card's answer ${refused ? 'REFUSED' : 'taken'}`);
      assert(!on && !refused && B.startleUntilMs < until0, JSON.stringify({ on, refused, until: B.startleUntilMs - T, until0: until0 - T }));
    },
  },
  {
    name: 'a bang while a shot row runs (a Pair\'s press and its rounds) stops it at the sub-step under way: no round leaves the rifle between the bang and the startle\'s end, the row cut, its rest offered again from the panel (COMBAT §5.7; the code review of v0.0.9: a Pair\'s two rounds fired 0.10 and 0.50 s into a 1.70 s startle)',
    fn() {
      const lines = [];
      for (const tier of ['private', 'sgt', 'recruit']) {
        const g = createGame({ scenario: 'test-pairs', seed: 48213, setup: 'standby', tier });
        const bot = pairsBot(), pid = g.state.player.id;
        earsOff(g.state, pid);
        let n = 0;
        while (n < 4000 && !(g.state.stop?.doing?.kind === 'shot' && g.state.stop.doing.i + 1 < g.state.stop.doing.list.length)) { g.step(1, bot); n++; }
        const d = g.state.stop?.doing;
        assert(d, `${tier}: no shot row reached in ${n} ticks`);
        const me = g.me(), T = g.state.clock.ms, list = d.list.join(','), i0 = d.i;
        bang(g.state, g.bus, { id: 'test:row', x: me.x - 1.5, z: me.z, atMs: T });
        const until = blockOf(g.state, pid).startleUntilMs;
        let k = 0; while (g.state.clock.ms < until + 50 && k < 400) { g.step(1); k++; }
        const inside = g.facts('shot').filter(f => f.atMs > T && f.atMs < until && f.fired);
        const ends = g.facts('step').filter(f => (f.phase === 'cut' || f.phase === 'halt' || f.phase === 'end') && f.step === d.step).map(f => f.phase);
        lines.push(`${tier}: ${d.step} [${list}] at sub ${i0}; the bang at T, startled ${until - T} ms; rounds inside ${inside.length}${inside.length ? ` (T + ${inside.map(f => f.atMs - T).join(', ')} ms)` : ''}; the row ${ends.join(', ') || 'still running'}`);
        assert(inside.length === 0, JSON.stringify({ tier, T, until, inside: inside.map(f => f.atMs - T) }));
        assert(ends.includes('cut') && !g.state.stop?.doing?.plan, JSON.stringify({ tier, ends, doing: g.state.stop?.doing?.step ?? null }));
      }
      for (const l of lines) console.log(`      ${l}`);
    },
  },
  {
    name: 'a bang inside an open take-in window holds the pause to the startle\'s end, and the take-in reported is the sighting to the pause, the startle named in its sum ("Contact · 1.50 s … + 0.95 (startled)"), on the stamp, J and the contact fact alike (the code review of v0.0.9: it reported the planned 0.55 s)',
    fn() {
      const { g, me, pid } = bayGame({ tier: 'private' });
      earsOff(g.state, pid);
      turn(g, [LANE]);
      runTo(g, s => !!contactOf(s)?.pending, {}, 100);
      const P = contactOf(g.state).pending, planned = P.ms;
      const T = g.state.clock.ms;
      bang(g.state, g.bus, { id: 'test:window', ...behind(me), atMs: T });
      const until = blockOf(g.state, pid).startleUntilMs;
      runTo(g, s => !!contactOf(s)?.last, {}, 200);
      const L = contactOf(g.state).last, J = g.state.log.filter(e => e.kind === 'contact').at(-1)?.text ?? '';
      const f = g.facts('contact').filter(x => x.phase === 'pause').at(-1);
      console.log(`      the window planned ${planned} ms; the startle T to T + ${until - T}; the pause at the sighting + ${L.atMs - L.seenMs} ms; reported ${L.ms} ms; the fact ${f?.ms} ms`);
      console.log(`      J: "${J}"`);
      assert(L.ms === L.atMs - L.seenMs && L.ms > planned && f?.ms === L.ms, JSON.stringify({ planned, ms: L.ms, span: L.atMs - L.seenMs, fact: f?.ms }));
      assert(/\(startled\)/.test(J) && J.startsWith(`Contact · ${(L.ms / 1000).toFixed(2)} s.`), J);
    },
  },
];
