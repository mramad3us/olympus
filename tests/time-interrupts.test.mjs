// Interrupts (TIME §7; the build sheet 0.0.4 §2.2.3; TIME's tests 9 and 10, §7.4, §7.6): the masks
// table by activity class against TIME §7.3, the A event that stops a night's sleep landing at its
// exact tick with the sleep accrued to it and the ambient lines in the ticker, two events at one
// second resolving by priority then by posting order (e999 before e1000), O* holding reveille in a
// shower, B−hygiene passing the grime and stopping on the bladder, S(k) only knocks, one S a skip and
// three a sol, and a body left without water for seven sols landing at its band, never past it.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { PRIO, CLASS_MASKS, parseMask, stops, letterOf, S_PER_SKIP, S_PER_SOL } from '../src/sim/time/interrupts.js';
import { post, sorted } from '../src/core/queue.js';
import { marsClock } from '../src/core/calendar.js';
import { MIN_MS, HOUR_MS, TICK_MS } from '../src/core/clock.js';
import { startActivity } from '../src/sim/time/activities.js';
import { bodyOf, relieve, intake } from '../src/sim/body/body.js';
import { stagesOf } from '../src/sim/body/cues.js';

const SEED = 48213;
const ctxOf = (g) => ({ held: false, tickMs: TICK_MS, sim: g.sim });
const clock = (g, ms) => { const c = marsClock(ms, g.sim.lonOf(g.state)); return `${c.timeslip ? '24:00 +' + Math.floor(c.slipMs / 60000) : `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}:${String(c.second).padStart(2, '0')}`}.${String(ms % 1000).padStart(3, '0')}`; };
const ev = (prio, more = {}) => ({ id: 'e1', atMs: 0, prio, kind: more.kind ?? 'test', src: 'test', ...more });
// (a game started at the player's rack's foot at 21:55, a fresh barracks night)
const night = () => createGame({ scenario: 'test-night', seed: SEED });
const at = (g, spotId) => { const me = g.me(); const area = g.state.places.live.area; return { me, area }; };

export default [
  {
    name: 'TIME §7.3\'s masks by class: D and A stop every one; O but where O* holds it; B but B−x\'s own ledger; S by S, S(k) only a knock, S(w) only a wake; priority 5 and job events never (test 10)',
    fn() {
      const kinds = [['D', ev(0)], ['A', ev(1)], ['O', ev(2)], ['B', ev(3, { payload: { ledger: 'bladder' } })], ['B hygiene', ev(3, { payload: { ledger: 'hygiene' } })],
        ['S', ev(4, { payload: { social: 'message' } })], ['S knock', ev(4, { payload: { social: 'knock' } })], ['S wake', ev(4, { payload: { social: 'wake' } })], ['5', ev(5)], ['job', ev(1, { kind: 'job' })]];
      const want = {
        hygiene: [1, 1, 0, 1, 0, 0, 1, 0, 0, 0], toilet: [1, 1, 0, 0, 0, 0, 1, 0, 0, 0], eating: [1, 1, 1, 1, 1, 1, 1, 1, 0, 0], sleep: [1, 1, 1, 1, 1, 0, 0, 1, 0, 0],
        rest: [1, 1, 1, 1, 1, 1, 1, 1, 0, 0], kit: [1, 1, 1, 1, 1, 1, 1, 1, 0, 0], block: [1, 1, 1, 1, 1, 0, 0, 0, 0, 0], watch: [1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
        ride: [1, 1, 1, 1, 1, 0, 0, 0, 0, 0], day: [1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
      };
      console.log(`      ${'class'.padEnd(8)} ${'mask'.padEnd(18)} ${kinds.map(([k]) => k.padEnd(9)).join('')}`);
      for (const [cls, mask] of Object.entries(CLASS_MASKS)) {
        const m = mask.replace('B−x', 'B−hygiene');
        const row = kinds.map(([, e]) => (stops(m, e) ? 1 : 0));
        console.log(`      ${cls.padEnd(8)} ${m.padEnd(18)} ${row.map(v => (v ? 'stops' : '.').padEnd(9)).join('')}`);
        assert(row.join() === want[cls].join(), `${cls} (${m}): ${row.join()} against TIME §7.3's ${want[cls].join()}`);
      }
      const p = parseMask('D A O* B−hygiene S(k)'), q = parseMask('D A O* B-hygiene S(k)');
      assert(p.O === 'hold' && p.B.except === 'hygiene' && p.S === 'k' && JSON.stringify(p) === JSON.stringify(q), JSON.stringify({ p, q }));
      assert(PRIO.D === 0 && PRIO.S === 4 && letterOf(ev(5)) === null && letterOf(ev(1, { kind: 'job' })) === null && letterOf(ev(2)) === 'O', 'letters');
      console.log(`      '−' and '-' read the same: ${JSON.stringify(p)}`);
    },
  },
  {
    name: 'test 9: an A event at 02:30 in a night\'s sleep lands at its exact tick (clock.ms === atMs), the sleep accrued to it; the ambient lines before it go to the ticker; a D and an S at one second resolve D first; e999 before e1000 at one second and priority',
    fn() {
      const g = night();
      const s = g.state, me = g.me();
      const drill = s.events.find(e => !e.dead && e.kind === 'alert');
      assert(drill && drill.atMs === 23_532_601_000, `the scene's drill: ${JSON.stringify(drill)}`);
      // (an ambient line and a D event at once later on, to see the order once landed)
      post(s, { atMs: drill.atMs - 30 * MIN_MS, prio: 5, kind: 'ambient', src: 'test', line: 'A rover passes on the street.' });
      const before = JSON.parse(JSON.stringify(bodyOf(s, s.player.id)));
      const r = startActivity(s, g.bus, ctxOf(g), { id: 'sleep', spotId: 'f:e1:bay-2-1:rack-n1#1', args: { until: 'reveille' } });
      assert(r.ok && s.skip, JSON.stringify(r));
      const t0 = s.clock.ms;
      for (let n = 0; s.skip && n < 1e6; n++) g.advance(Infinity, { over: (k) => k >= 37 });   // (sliced, as the page slices it)
      const end = g.facts('skip-end').at(-1), intr = g.facts('skip-interrupt').at(-1), after = bodyOf(s, s.player.id);
      assert(s.clock.ms === drill.atMs && end.toMs === drill.atMs && end.interrupted && intr.letter === 'A' && intr.kind === 'alert' && intr.atMs === drill.atMs, JSON.stringify({ clock: s.clock.ms, end: { ...end, outcome: undefined }, intr }));
      assert(s.clock.ms % TICK_MS === 0, 'off the tick grid');
      const lines = end.outcome.lines;
      assert(lines.includes('Taps. Lights out.') && lines.includes('A rover passes on the street.'), `the ticker: ${JSON.stringify(lines)}`);
      assert(after.atMs === drill.atMs && after.sleep?.pressureH < before.sleep?.pressureH, `the sleep accrued: ${JSON.stringify({ before: before.sleep, after: after.sleep, atMs: after.atMs })}`);
      console.log(`      the sleep from ${clock(g, t0)} stopped at ${clock(g, s.clock.ms)} = ${s.clock.ms} (the drill's ${drill.atMs}), ${end.minutes} game min, by ${intr.letter} '${intr.kind}': "${intr.line}"`);
      console.log(`      the ticker: ${lines.map(l => `"${l}"`).join(', ')}; sleep pressure ${fmt(before.sleep.pressureH, 2)} h → ${fmt(after.sleep.pressureH, 2)} h, the body at ${after.atMs}`);
      // (two at one second: D then S by priority; then e999 and e1000 at one priority, in posting order)
      const g2 = createGame({ scenario: 'barracks', seed: SEED, hour: 12 });
      const s2 = g2.state, t = Math.ceil((s2.clock.ms + 5 * MIN_MS) / 1000) * 1000;
      s2.meta.next.e = 999;
      post(s2, { atMs: t, prio: 4, kind: 'knock', src: 'test', payload: { social: 'knock' }, line: 'A knock.' });           // e999
      post(s2, { atMs: t, prio: 0, kind: 'danger', src: 'test', line: 'Danger.' });                                         // e1000
      post(s2, { atMs: t + 60_000, prio: 3, kind: 'x', src: 'test', line: 'first' });                                       // e1001
      const order = sorted(s2).filter(e => e.src === 'test').map(e => `${e.id}/${e.prio}`);
      assert(order.join() === 'e1000/0,e999/4,e1001/3', `queue order ${order.join()}`);
      const s3 = createGame({ scenario: 'barracks', seed: SEED, hour: 12 }).state;
      s3.meta.next.e = 999;
      const ta = Math.ceil((s3.clock.ms + MIN_MS) / 1000) * 1000;
      post(s3, { atMs: ta, prio: 3, kind: 'a', src: 'test' }); post(s3, { atMs: ta, prio: 3, kind: 'b', src: 'test' });
      const o3 = sorted(s3).filter(e => e.src === 'test').map(e => e.id);
      assert(o3.join() === 'e999,e1000', o3.join());
      console.log(`      at one second: ${order.join(', ')} (D before S whatever the posting order); at one second and priority: ${o3.join(', ')} (seq, not the strings)`);
    },
  },
  {
    name: 'O* holds reveille in a shower (dispatched, its line in the ticker, its id held) and the squad still rises; B−hygiene lets a grime crossing pass and stops on the bladder; S(k) stops on a knock only; one S a skip, three a sol (TIME §7.4)',
    fn() {
      // (a shower that runs across reveille at 05:30)
      const g = createGame({ scenario: 'barracks', seed: SEED, hour: 5 + 25 / 60, at: { area: 'melas.echo.1', x: 58.95, z: 16.27, face: 'down' } });
      const s = g.state;
      const rev = s.events.find(e => !e.dead && e.kind === 'reveille');
      const r = startActivity(s, g.bus, ctxOf(g), { id: 'shower', spotId: 'f:e1:head-2a:shower-2#1' });
      assert(r.ok, JSON.stringify(r));
      // (a grime crossing and a bladder crossing posted into it, as BODY would)
      post(s, { atMs: s.clock.ms + 2 * MIN_MS, prio: 3, kind: 'test-body', src: 'test', payload: { ledger: 'hygiene', band: 'clean' }, line: 'Cleaner.' });
      g.advance();
      const end = g.facts('skip-end').at(-1);
      assert(rev && rev.atMs > end.fromMs && rev.atMs < end.planned, `reveille ${rev?.atMs} inside the shower ${end.fromMs}-${end.planned}`);
      assert(!end.interrupted && end.outcome.held.length === 1 && end.outcome.lines.includes('Reveille. Lights.') && end.outcome.lines.includes('Cleaner.'), JSON.stringify({ interrupted: end.interrupted, by: end.by, held: end.outcome.held, lines: end.outcome.lines }));
      const rose = g.facts('reveille').length;
      console.log(`      a shower from ${clock(g, end.fromMs)} to ${clock(g, end.toMs)}: reveille at ${clock(g, rev.atMs)} held (${end.outcome.held.join(', ')}), its line in the ticker; the grime crossing passed B−hygiene: ${JSON.stringify(end.outcome.lines)}; ${rose} reveille fact`);
      // (the bladder stops it)
      const g2 = createGame({ scenario: 'barracks', seed: SEED, hour: 19.5, at: { area: 'melas.echo.1', x: 58.95, z: 16.27, face: 'down' } });
      const s2 = g2.state;
      startActivity(s2, g2.bus, ctxOf(g2), { id: 'shower', spotId: 'f:e1:head-2a:shower-2#1' });
      const tb = Math.ceil((s2.clock.ms + 4 * MIN_MS) / 1000) * 1000;
      post(s2, { atMs: tb, prio: 3, kind: 'test-body', src: 'test', payload: { ledger: 'bladder', band: 'urgent' }, line: 'Bladder.' });
      g2.advance();
      const e2 = g2.facts('skip-end').at(-1), i2 = g2.facts('skip-interrupt').at(-1);
      assert(e2.interrupted && e2.toMs === tb && i2.letter === 'B', JSON.stringify({ e2: { ...e2, outcome: undefined }, i2 }));
      console.log(`      the bladder's crossing stopped the shower at ${clock(g2, tb)} (${e2.minutes} min in), landing in a ${e2.outcome.look.outfit}${e2.outcome.look.wet ? ', wet' : ''}; R offers "${g2.state.time.resume ? 'finish your shower' : 'nothing'}"`);
      // (S(k): a message passes, a knock stops; one S a skip; three a sol)
      const g3 = createGame({ scenario: 'barracks', seed: SEED, hour: 19.5, at: { area: 'melas.echo.1', x: 58.95, z: 16.27, face: 'down' } });
      const s3 = g3.state, lines = [];
      const sStop = (social) => {
        // (the body's own crossings kept out of the way: emptied and watered first)
        relieve(s3, s3.player.id, { bladderK: 1, bowelK: 1 }, s3.clock.ms, g3.bus);
        intake(s3, s3.player.id, { waterL: 1, kcal: 300, food: 'snack' }, s3.clock.ms, g3.bus);
        if (!startActivity(s3, g3.bus, ctxOf(g3), { id: 'shower', spotId: 'f:e1:head-2a:shower-2#1' }).ok) throw new Error('no shower');
        const t = Math.ceil((s3.clock.ms + MIN_MS) / 1000) * 1000;
        post(s3, { atMs: t, prio: 4, kind: 'social', src: 'test', payload: { social }, line: social });
        post(s3, { atMs: t + 1000, prio: 4, kind: 'social', src: 'test', payload: { social: 'knock' }, line: 'knock 2' });
        g3.advance();
        const e = g3.facts('skip-end').at(-1);
        const why = e.interrupted ? g3.facts('skip-interrupt').at(-1) : null;
        lines.push(`${social}: ${e.interrupted ? `stopped at +${(e.toMs - e.fromMs) / 1000} s by ${why?.letter} ${why?.kind}` : 'ran on'}`);
        g3.step(Math.round((20 * MIN_MS) / TICK_MS / 10));                                           // (a little lived time between)
        return e;
      };
      const a = sStop('message'), b = sStop('knock'), c = sStop('knock'), d = sStop('knock');
      const e = sStop('knock');
      assert(a.interrupted && a.toMs === Math.ceil((a.fromMs + MIN_MS) / 1000) * 1000 + 1000, `a message passes, the knock a second later stops: ${lines.join('; ')}`);
      const knock = { id: 'e1', atMs: s3.clock.ms, prio: 4, kind: 'social', src: 'test', payload: { social: 'knock' } };
      const saved = { ...s3.time.interrupts };
      s3.time.interrupts = { ...saved, perSkip: S_PER_SKIP, perSol: 0 };
      const capSkip = stops('D A O* B−hygiene S(k)', knock, s3);
      s3.time.interrupts = saved;
      assert(b.interrupted && c.interrupted && !d.interrupted && !e.interrupted && !capSkip, `one S a skip, three a sol: ${lines.join('; ')} (${JSON.stringify(s3.time.interrupts)}; a knock with ${S_PER_SKIP} already this skip ${capSkip ? 'stops' : 'passes'})`);
      console.log(`      S(k), one a skip (${S_PER_SKIP}), three a sol (${S_PER_SOL}): ${lines.join('; ')}; counts ${JSON.stringify(s3.time.interrupts)}`);
    },
  },
  {
    name: 'death never in a splash (TIME §7.6): seven sols skipped without water land at the body\'s dehydrated band (6%), never past it, every other stop carried on from',
    fn() {
      const g = createGame({ scenario: 'barracks', seed: SEED, hour: 12 });
      const s = g.state, pid = s.player.id;
      const lon = g.sim.lonOf(s);
      // (TIME §7.3's stand-by mask, D A O B S, over seven sols: reveille, the drill and the bladder stop it and it
      // carries on (the bladder emptied: no water drunk); the thirst's interrupting crossing lands it)
      const SEVEN = Math.round(7 * 24.66 * HOUR_MS / TICK_MS) * TICK_MS, t0 = s.clock.ms;
      const stops = [];
      let landed = null;
      for (let n = 0; n < 400; n++) {
        const left = t0 + SEVEN - s.clock.ms;
        if (left <= 0) break;
        g.clearFacts();
        g.skipNow({ activity: 'wait', planMs: left, mask: 'D A O B S', kind: 'outcome' });
        const e = g.facts('skip-end').at(-1), why = g.facts('skip-interrupt').at(-1), bi = g.facts('body-interrupt').at(-1);
        if (!e.interrupted) break;
        stops.push(why?.letter === 'B' ? `B ${bi?.ledger} ${bi?.band}` : `${why?.letter} ${why?.kind}`);
        if (why?.letter === 'B' && bi?.ledger === 'thirst') { landed = bi; break; }
        if (why?.letter === 'B') relieve(s, pid, { bladderK: 1, bowelK: 1 }, s.clock.ms, g.bus);
      }
      const st = stagesOf(bodyOf(s, pid), s.clock.ms, lon);
      const h = (s.clock.ms - t0) / 3_600_000;
      const tally = stops.reduce((m, x) => { const k = x.replace(/ (could-go|need|urgent|bursting|desperate)$/, ''); m[k] = (m[k] ?? 0) + 1; return m; }, {});
      console.log(`      ${stops.length} stops in ${fmt(h / 24.66, 2)} sols (${fmt(h, 1)} h): ${Object.entries(tally).map(([k, v]) => `${k} ×${v}`).join(', ')}`);
      console.log(`      landed by ${landed ? `B thirst '${landed.band}'` : 'nothing'} at ${clock(g, s.clock.ms)}; thirst ${st?.thirst?.band}, hunger ${st?.hunger?.band}`);
      assert(landed && landed.band === 'dehydrated' && st.thirst.band === 'dehydrated' && h < 7 * 24.66, `seven sols without water: ${JSON.stringify({ landed, thirst: st?.thirst, h })}`);
    },
  },
];
