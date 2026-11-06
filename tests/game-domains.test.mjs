// The composition root (src/sim/game.js; TECH §2.5, §3.1): the state's keys, each claimed by one
// domain; each domain's init making only its own; the twelve fast layers in order, the slow layer
// each minute and no hourly game layer; no save key outside the registry; the actions table.
import { assert } from './helpers.mjs';
import { DOMAINS, domainOwners, newState } from '../src/core/state.js';
import { createLoop, NO_INPUT } from '../src/core/loop.js';
import { recordingBus } from '../src/core/bus.js';
import { MIN_MS } from '../src/core/clock.js';
import { createSim, newGame, domainsOf, FAST_LAYERS, DOMAIN_ORDER, notesInState } from '../src/sim/game.js';
import { toJSON } from '../src/core/state.js';
import { digest } from '../src/core/hash.js';
import { WAIT_MS, AUTOSAVE_LIVE_MS } from '../src/sim/time/domain.js';
import { marsClock } from '../src/core/calendar.js';
import { createGame } from './game.mjs';
import { scriptInput } from './game-dummy.mjs';
import { STUB_DOMAINS } from '../src/sim/game.js';

const throwsWith = (fn, re) => { try { fn(); } catch (e) { assert(re.test(e.message), `threw "${e.message}", not ${re}`); return e.message; } throw new Error(`did not throw ${re}`); };

// (TECH §6.1's owners, as the build sheet's §3 lists them)
const OWNERS = {
  tech: ['meta', 'rng', 'log', 'flags'], time: ['clock', 'events', 'skip', 'time'], places: ['places'],
  people: ['player', 'people', 'units', 'happenings', 'actors', 'mind', 'talk', 'names'], weapons: ['stop', 'items', 'armoury'],
  combat: ['fights'], world: ['world'], career: ['career', 'careers', 'memorial'],
};

export default [
  {
    name: 'the keys are TECH §6.1\'s, one domain each; a second claim throws naming both, and so does a key outside the table',
    fn() {
      const sim = createSim({ bus: recordingBus() });
      const owners = domainOwners();
      assert(DOMAINS.length === 25 && Object.keys(owners).sort().join() === [...DOMAINS].sort().join(), `registered ${Object.keys(owners).length}: ${Object.keys(owners)}`);
      for (const [d, keys] of Object.entries(OWNERS)) for (const k of keys) assert(owners[k] === d, `${k} is ${owners[k]}'s, not ${d}'s`);
      const twice = throwsWith(() => createSim({ bus: recordingBus(), domains: { combat: { keys: ['fights', 'people'] } } }), /claimed twice/);
      assert(/people/.test(twice) && /combat/.test(twice), twice);
      const outside = throwsWith(() => createSim({ bus: recordingBus(), domains: { combat: { keys: ['fights', 'shots'] } } }), /not a reserved key/);
      createSim({ bus: recordingBus() });                          // (and the registry is whole again)
      const byOwner = Object.entries(OWNERS).map(([d, ks]) => `${d} (${sim.domains.find(x => x.name === d).owner}${sim.domains.find(x => x.name === d).stub ? ', stub' : ''}): ${ks.join(' ')}`);
      console.log(`      ${DOMAINS.length} keys, each claimed once (the sheet's "26" counts 25: TECH §6.1 and the sheet's own owner list agree on 25)`);
      for (const line of byOwner) console.log(`      ${line}`);
      console.log(`      a second claim: "${twice}"; outside the table: "${outside}"`);
    },
  },
  {
    name: 'each domain\'s init, alone on an empty state, makes only its own keys',
    fn() {
      const list = domainsOf();
      assert(list.map(d => d.name).join() === DOMAIN_ORDER.join(), list.map(d => d.name).join());
      const made = [];
      for (const d of list) {
        const s = {};
        d.init(s);
        const keys = Object.keys(s).filter(k => !k.startsWith('$')).sort();
        assert(keys.join() === [...d.keys].sort().join(), `${d.name}'s init made ${keys.join(' ')} (its keys: ${d.keys.join(' ')})`);
        made.push(`${d.name} ${keys.length}`);
      }
      // (and run twice on a full state, a fill changes nothing)
      const s = newGame({ seed: 5 });
      const before = JSON.stringify(s);
      for (const d of list) d.init(s);
      assert(JSON.stringify(s) === before, 'an init changed a filled state');
      console.log(`      keys made alone: ${made.join(', ')}; run again on a new game's state, the inits change nothing`);
    },
  },
  {
    name: 'the loop runs the twelve fast layers in order (input and offers while held), slow each game minute, and no hourly game layer',
    fn() {
      const loop = createLoop({ bus: recordingBus() });
      const sim = createSim({ loop, bus: recordingBus() });
      const layers = loop.layers;
      const fast = layers.filter(L => L.everyMs === 50);
      assert(fast.map(L => L.name).join() === FAST_LAYERS.map(L => L.name).join() && fast.length === 12, fast.map(L => L.name).join());
      assert(fast.filter(L => L.whileHeld).map(L => L.name).join() === 'input,offers', 'whileHeld');
      const periodic = layers.filter(L => L.everyMs !== 50);
      assert(periodic.length === 1 && periodic[0].name === 'slow' && periodic[0].everyMs === MIN_MS, JSON.stringify(periodic));
      // (the slow layer steps each minute lived)
      loop.setState(newGame({ seed: 2 }));
      const n0 = sim.stats.slowSteps;
      loop.step(20 * 60 * 3);
      assert(sim.stats.slowSteps - n0 === 3, `three game minutes lived: ${sim.stats.slowSteps - n0} slow steps`);
      console.log(`      ${sim.layers.map(L => `${L.name}${L.whileHeld ? ' (held)' : ''}${L.contributors.length ? ` [${L.contributors.join(', ')}]` : ''}`).join(', ')}`);
      console.log(`      periodic: ${periodic.map(L => `${L.name} every ${L.everyMs / 1000} s`).join(', ')}; three minutes lived, ${sim.stats.slowSteps - n0} slow steps; slow contributors: ${sim.slow.join(', ') || 'none yet'}`);
    },
  },
  {
    name: 'a save has no key outside the registry, and every key in it',
    fn() {
      const g = createGame({ seed: 11 });
      g.step(800, (state) => scriptInput(state.clock.seq));
      const keys = Object.keys(JSON.parse(g.save())).sort();
      assert(keys.join() === [...DOMAINS].sort().join(), `save keys ${keys.join(' ')}`);
      const fresh = Object.keys(newState(1)).join();
      assert(fresh === DOMAINS.join(), fresh);
      console.log(`      after 800 ticks of scripted play: ${keys.length} keys, exactly the registry`);
    },
  },
  {
    name: 'the actions table: routed by prefix to their owners (R\'s hand and the door to places, 0.0.3; the activity to time and the instinct\'s T to people, 0.0.4; G, the digits, X, the steps, V and the stances to weapons, 0.0.5), the people and body domains built, the stubs doing what the sheet says; an unknown action counted, never thrown',
    fn() {
      const g = createGame({ seed: 4 });
      const table = g.sim.actions;
      const want = { debug: 'tech', skip: 'time', activity: 'time', hand: 'places', door: 'places', people: 'people', instinct: 'people',
        ready: 'weapons', digit: 'weapons', shoot: 'weapons', stop: 'weapons', carry: 'weapons', stance: 'weapons', hit: 'combat', grab: 'combat', guard: 'combat' };
      assert(JSON.stringify(Object.keys(table).sort()) === JSON.stringify(Object.keys(want).sort()) && Object.entries(want).every(([a, d]) => table[a] === d), JSON.stringify(table));
      const people = g.sim.domains.find(d => d.name === 'people');
      assert(people && !people.stub && g.sim.layers.find(L => L.name === 'actors').contributors.includes('people') && g.sim.slow.includes('people:place'), `the people domain: ${JSON.stringify(people)}`);
      const body = g.sim.domains.find(d => d.name === 'body');
      assert(body && !body.stub && body.keys.length === 0 && g.sim.domains.map(d => d.name).join() === DOMAIN_ORDER.join() && DOMAIN_ORDER.indexOf('body') === DOMAIN_ORDER.indexOf('places') + 1, `the body domain: ${JSON.stringify(body)}, order ${DOMAIN_ORDER.join()}`);
      assert(g.sim.layers.find(L => L.name === 'offers').contributors.includes('people'), 'the instinct in the offers layer');
      const press = (act) => g.step(1, { act: [act] });
      const lines = () => g.facts('line').map(l => l.text);
      // (G holds time until a digit)
      press('ready');
      const heldAt = g.state.clock.ms;
      g.step(20);
      assert(g.state.clock.holds.join() === 'ready' && g.state.clock.ms === heldAt, `ready: holds ${g.state.clock.holds}`);
      press('hand');                                               // (R is refused while time stands still)
      assert(!g.state.skip && g.state.clock.ms === heldAt, 'R began a skip while held');
      press('digit:2');
      assert(!g.state.clock.holds.length && g.state.clock.ms === heldAt + 50, 'digit: the hold stayed');
      // (R: a 15-minute wait, an outcome skip, run to its end before the next tick)
      const t0 = g.state.clock.ms;
      press('hand');
      const end = g.facts('skip-end').at(-1);
      assert(end && end.activity === 'wait' && end.minutes === WAIT_MS / MIN_MS && g.facts('skip-start').at(-1).kind === 'outcome' && g.state.clock.ms - t0 === WAIT_MS, JSON.stringify(end));
      // (skip:stop goes into the running skip's commands, at the clock)
      const s = g.beginSkip({ activity: 'idle', planMs: 30 * MIN_MS });
      g.sim.act(g.state, 'skip:stop', g.bus, { held: false, tickMs: 50, sim: g.sim });
      assert(s.cmds.length === 1 && s.cmds[0].cmd === 'stop' && s.cmds[0].atMs === g.state.clock.ms, JSON.stringify(s.cmds));
      g.advance();
      assert(!g.state.skip && g.facts('skip-end').at(-1).interrupted && g.facts('skip-end').at(-1).by === 'player', 'skip:stop did not stop it');
      // (the debug skip marks the save, logs, and skips)
      // (the debug skip: TIME's idle activity, its [debug] record and then the activity's own line)
      const seq0 = g.state.log.at(-1)?.seq ?? 0;
      press('debug:skip:900000');
      const [rec, idleLine] = g.state.log.filter(e => e.seq > seq0);
      const idleEnd = g.facts('skip-end').at(-1);
      assert(g.state.meta.debugUsed === true && rec.kind === 'debug' && rec.text === '[debug] skipped 15 min' && idleLine?.kind === 'activity' && idleEnd.activity === 'idle' && idleEnd.minutes === 15, JSON.stringify({ rec, idleLine, idleEnd }));
      // (the stubs route and do nothing; an unknown action is counted)
      const routed0 = g.sim.stats.routed, unrouted0 = g.sim.stats.unrouted;
      for (const a of ['people', 'instinct', 'shoot', 'stop', 'carry', 'hit', 'grab', 'guard']) press(a);
      assert(!g.state.skip && !g.state.time.doing && g.state.stop === null, 'a bare T, X, a step or V did something in the sandbox');
      press('dance'); press({ act: 'juggle', args: [3] }); press({ args: [] });
      assert(g.sim.stats.routed - routed0 === 8 && g.sim.stats.unrouted - unrouted0 === 3 && g.errors.length === 0, JSON.stringify(g.sim.stats));
      console.log(`      ${Object.entries(table).map(([a, d]) => `${a} → ${d}`).join(', ')}; the people domain built (the actors layer, the slow 'people:place', the instinct in 'offers'); the body domain after places (${DOMAIN_ORDER.join(', ')})`);
      console.log(`      lines: ${lines().map(l => `"${l}"`).join(', ')}`);
      console.log(`      R: ${end.minutes} minutes stepped as an outcome skip; skip:stop at ${s.cmds[0].atMs}; debug: "${rec.text}", debugUsed; routed ${g.sim.stats.routed}, unrouted ${g.sim.stats.unrouted} (last: ${JSON.stringify(g.sim.stats.unroutedLast)})`);
    },
  },

  {
    name: 'TIME\'s second layer asks a live autosave after five minutes of lived time, not of held time; its day job asks one at local 00:00',
    fn() {
      const g = createGame({ seed: 12 });
      const lives = () => g.facts('autosave').filter(a => a.why === 'live');
      g.step(20 * 60 * 4);                                         // (four minutes lived)
      g.step(1, { act: ['ready'] });
      g.step(20 * 120);                                            // (two minutes of ticks while time stands still: they don't count)
      g.step(1, { act: ['digit:1'] });
      assert(lives().length === 0 && g.state.time.liveSinceSaveMs >= 240_000 && g.state.time.liveSinceSaveMs < AUTOSAVE_LIVE_MS, `after 4 min lived and 2 held: ${g.state.time.liveSinceSaveMs} ms, ${lives().length} asks`);
      g.step(20 * 60);
      assert(lives().length === 1 && g.state.time.liveSinceSaveMs < 60_000, `after 5 min lived: ${lives().length} asks, ${g.state.time.liveSinceSaveMs} ms since`);
      // (a skip's end asks one too, and starts the count again)
      g.step(20 * 30);
      g.step(1, { act: ['hand'] });
      const skipAsk = g.facts('autosave').at(-1);
      assert(skipAsk.why === 'skip' && g.state.time.liveSinceSaveMs === 0, JSON.stringify({ skipAsk, since: g.state.time.liveSinceSaveMs }));
      // (the day job: at the sol's 00:00 on the Melas clock)
      const job = g.state.events.find(ev => !ev.dead && ev.payload?.job === 'autosaveDay');
      const c = marsClock(job.atMs, g.sim.lonOf(g.state));
      g.skipNow({ activity: 'idle', planMs: job.atMs - g.state.clock.ms + 1000, mask: 'D' });
      const day = g.facts('autosave').filter(a => a.why === 'day');
      assert(c.hour === 0 && c.minute === 0 && !c.timeslip && day.length === 1, JSON.stringify({ c, days: day.length }));
      console.log(`      live: none after 4 min lived and 2 min held, one at 5 min lived; a skip's end asks 'skip' and resets the count; 'day' at the sol's ${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}:${String(c.second).padStart(2, '0')} (src ${job.src}, prio ${job.prio})`);
    },
  },
  {
    name: 'a render that throws, paused or live, never touches the state: only a tick\'s or a skip\'s error is noted in meta.errors (TECH §3.7; 0.0.2 noted three render errors while paused)',
    fn() {
      const bus = recordingBus();
      let sim = null, boom = true;
      const loop = createLoop({ bus, render: () => { if (boom) throw new Error('a view bug'); }, onError: (e, where) => sim.noteError(loop.state, e, where) });
      sim = createSim({ loop, bus });
      loop.setState(newGame({ seed: 11, version: 'test' }));
      loop.pause(true, 'player');
      const before = digest(toJSON(loop.state));
      for (let f = 0; f < 3; f++) loop.frame(1000 + f * 16);
      const paused = digest(toJSON(loop.state)), pausedErrors = [...(loop.state.meta.errors ?? [])];
      loop.pause(false, 'player');
      for (let f = 3; f < 8; f++) loop.frame(1000 + f * 50);
      const liveErrors = [...(loop.state.meta.errors ?? [])];
      boom = false;
      sim.noteError(loop.state, new Error('a tick bug'), 'tick');
      sim.noteError(loop.state, new Error('a skip bug'), 'skip');
      const broke = bus.events.filter(([type]) => type === 'broke').length;
      console.log(`      paused, 3 frames whose render threw: digest ${before} → ${paused}, meta.errors ${JSON.stringify(pausedErrors)}; live 5 more: ${JSON.stringify(liveErrors)}; then a tick's and a skip's: ${JSON.stringify(loop.state.meta.errors)}; 'broke' heard ${broke} times`);
      assert(before === paused && !pausedErrors.length && !liveErrors.length, JSON.stringify({ before, paused, pausedErrors, liveErrors }));
      assert(JSON.stringify(loop.state.meta.errors) === JSON.stringify(['tick: a tick bug', 'skip: a skip bug']) && broke === 10, JSON.stringify({ errors: loop.state.meta.errors, broke }));
      assert(notesInState('tick') && notesInState('skip') && !notesInState('render') && !notesInState("a listener of 'line'"), 'the wheres');
    },
  },

  {
    name: 'the weapons domain (0.0.5) replaces its stub and a gunless game does not change by one byte: its keys filled as the stub filled them, its layers and its event; the sandbox, the barracks and both test scenes made as v0.0.4 made them (digests from v0.0.4\'s own code), and a barracks played with G and a digit too',
    fn() {
      const sim = createSim({ bus: recordingBus() });
      const w = sim.domains.find(d => d.name === 'weapons');
      assert(w && !w.stub && w.owner === 'WEAPONS' && w.keys.join() === 'stop,items,armoury' && !('weapons' in STUB_DOMAINS), JSON.stringify(w));
      const s = {};
      domainsOf().find(d => d.name === 'weapons').init(s);
      assert(JSON.stringify(s) === JSON.stringify({ stop: null, items: {}, armoury: { guns: {}, ammoIssues: [] } }), JSON.stringify(s));
      const layers = sim.layers.filter(L => L.contributors.includes('weapons')).map(L => L.name);
      assert(layers.join() === 'input,rules,second', layers.join());
      // (v0.0.4's own digests, made by its code in a scratch worktree of the tag, 2026-11-06)
      const V004 = { 'sandbox|4|null': '03bf21fea193f8', 'sandbox|48213|null': '0d3ad82fd1c184', 'barracks|48213|null': '0ce4d2a7f4b363', 'barracks|48213|21.9': '11013be0e1a17f',
        'test-shower|48213|null': '157083cd7cf59e', 'test-night|7|null': '0a5f3c0639a9f0', 'barracks|48213|21.9|played': '08234d7efc6892' };
      const now = {};
      for (const key of Object.keys(V004)) {
        const [scenario, seed, hour, played] = key.split('|');
        if (played) {
          const g = createGame({ scenario, seed: Number(seed), hour: Number(hour), version: 'test' });
          g.step(20 * 20, { mx: 1 }); g.step(1, { act: ['ready'] }); g.step(40); g.step(1, { act: ['digit:3'] }); g.step(20 * 20, { mz: -1 });
          // (the eyes' record, body.eyes, is v0.0.5's patch round's, written once the player moves: left out, so this
          // digest still says whether the weapons domain changed a gunless game; with it in, 17a67af3db88cc)
          const saved = JSON.parse(toJSON(g.state));
          for (const p of Object.values(saved.people ?? {})) if (p?.body) delete p.body.eyes;
          now[key] = digest(JSON.stringify(saved));
        } else now[key] = digest(toJSON(newGame({ seed: Number(seed), scenario, hour: hour === 'null' ? null : Number(hour), version: 'test' })));
      }
      for (const [k, d] of Object.entries(V004)) console.log(`      ${k.padEnd(28)} v0.0.4 ${d}, now ${now[k]}${now[k] === d ? '' : '  DIFFERENT'}`);
      console.log(`      the weapons domain: keys ${w.keys.join(', ')}; layers ${layers.join(', ')}; events ${Object.keys(domainsOf().find(d => d.name === 'weapons').events).join(', ')}`);
      assert(Object.entries(V004).every(([k, d]) => now[k] === d), JSON.stringify(now));
    },
  },
];
