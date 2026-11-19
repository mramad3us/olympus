// OLYMPUS tests: the review of v0.0.24's A to C, role B's findings, each failing without its fix (F104, F106, F108; BODY §16.6).
//
// What the reviewer found playing free fall headless, and what holds now, printed:
//   1. a floating man is hit where a standing man is: the float's height is a field of its own (actor.floatY, the centre of mass,
//      FLOAT_Y_M 1.0 m a standing man's), never actor.y, which the hit model (arms/penetrate.js) and the blast read as the floor
//      under his feet. A round at chest height (1.45 m) from 0.65 m takes the #2's torso on the deck and floating alike (before:
//      floating, his legs, the body read as raised 1 m);
//   2. free fall's facts reach the page: the keys' push-off emits its roll and a bulkhead met at 4 m/s its log line and its fx,
//      through the game's own step (places/move.js hands floatStep the bus; before: 0 roll, 0 log and 0 fx facts, the marine hurt
//      with nothing on screen);
//   3. two drifting as one: grab your floating #2 and you are kept at the grab's offset from him over the ticks after, his drift
//      shared, whatever moves him (before: one tick, then 3.99 m apart eighty ticks on).
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { floatRoom, BAY } from './float-world.mjs';
import { FREEFALL } from '../src/data/body/needs.js';
import { pushOff, grab } from '../src/sim/body/freefall.js';
import { footingOf } from '../src/sim/body/footing.js';
import { traceRound } from '../src/sim/arms/penetrate.js';

const SEED = 48213, F = FREEFALL;
const meOf = (s) => s.actors.list.find(a => a.id === s.player.actor);

export default [
  {
    name: 'freefall-fixes: a floating man is hit where a standing man is: a round at chest height from 0.65 m takes the #2\'s torso on the deck and floating off it (his height actor.floatY, never actor.y, the floor the hit model reads)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: SEED, tier: 'sgt', setup: 'go', env: 'ship-coast' }), s = g.state;
      const me = meOf(s), b = s.actors.list.find(a => a.who && a !== me && Math.hypot(a.x - me.x, a.z - me.z) < 4);
      const yaw = Math.atan2(b.z - me.z, b.x - me.x), shot = () => traceRound(s, { shooterId: me.who, from: { x: me.x, y: 1.45, z: me.z }, yawRad: yaw, pitchRad: 0, maxM: 6 }).hits.map(h => h.part);
      const deck = shot();
      // (he floats off the deck by free fall's own path: a push-off from it, away from you, so the round still meets him)
      const r = pushOff(s, b.who, yaw, F.PUSH.SPEEDS_MS.stroll);
      const off = { floatY: b.floatY ?? null, y: b.y ?? null, parts: shot() };
      console.log(`      the #2 (${b.who}) ${Math.hypot(b.x - me.x, b.z - me.z).toFixed(2)} m off, from 1.45 m: on the deck ${JSON.stringify(deck)}; pushed off (${r.ok ? 'ok' : r.why}), floatY ${off.floatY}, y ${off.y}: ${JSON.stringify(off.parts)}`);
      assert(r.ok && off.floatY === F.FLOAT_Y_M && off.y === null, JSON.stringify({ r, off }));
      assert(deck.includes('torso') && off.parts.includes('torso') && !off.parts.includes('legs'), JSON.stringify({ deck, off }));
    },
  },
  {
    name: 'freefall-fixes: free fall\'s facts reach the page through the game\'s step: the keys\' push-off emits its roll, a bulkhead met at 4 m/s its log line and its impact fx',
    fn() {
      const w = floatRoom({ at: [BAY.x0 + 0.5, 6.25] }), a = w.me();
      w.g.clearFacts();
      w.g.step(1, { mx: 1, run: true });
      const push = { started: !!a.push, rolls: w.g.facts('roll').length, logs: w.g.facts('log').filter(f => f.entry?.step === 'push' || f.entry?.kind === 'roll').length };
      w.g.step(25); a.v = [4, 0];
      let n = 0; while (a.v && n++ < 400) w.g.step(1);
      const logs = w.g.facts('log').filter(f => /bulkhead/.test(f.entry?.text ?? '')).map(f => f.entry.text), fx = w.g.facts('fx').filter(f => f.kind === 'impact');
      console.log(`      the push-off by the keys: started ${push.started}, roll facts ${push.rolls}, its log facts ${push.logs}; the bulkhead at 4 m/s after ${n} ticks: log facts ${JSON.stringify(logs)}, impact fx ${fx.length} (${fx.map(f => `${f.vMs} m/s ${f.first}`).join(', ')})`);
      assert(push.started && push.rolls >= 1 && push.logs >= 1, JSON.stringify(push));
      assert(logs.length === 1 && /4\.0 m\/s/.test(logs[0]) && fx.length === 1, JSON.stringify({ logs, fx: fx.length }));
    },
  },
  {
    name: 'freefall-fixes: two drifting as one: your floating #2 grabbed, you are kept at the grab\'s offset from him for 80 ticks after, his drift shared and the hold kept',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: SEED, tier: 'sgt', env: 'ship-coast', setup: 'contact' }), s = g.state, pid = s.player.id;
      const me = meOf(s), two = s.actors.list.find(x => x.who && x.who !== pid);
      me.x = two.x + 0.6; me.z = two.z; me.floatY = F.FLOAT_Y_M; me.v = [-0.3, 0];
      const took = grab(s, pid), gap0 = Math.hypot(me.x - two.x, me.z - two.z), rows = [], x0 = me.x, tx0 = two.x;
      let worst = 0, lost = null;
      for (let t = 1; t <= 80; t++) {
        g.step(1);
        const gap = Math.hypot(me.x - two.x, me.z - two.z);
        worst = Math.max(worst, Math.abs(gap - gap0));
        if (lost === null && me.anchor !== 'buddy') lost = t;
        if (t === 1 || t === 40 || t === 80) rows.push(`${t}: gap ${gap.toFixed(3)} m, you v ${JSON.stringify(me.v ?? null)}, he v ${JSON.stringify(two.v ?? null)}, your anchor ${me.anchor ?? '-'} (${footingOf(s, pid).mode})`);
      }
      // (the momentum shared: 0.3 m/s of yours over the two masses, about 0.15 m/s west, 4 s: 0.6 m drifted, both of you)
      const moved = { you: me.x - x0, he: two.x - tx0 };
      console.log(`      the grab ${took.ok ? took.band : took.why}, the gap at it ${gap0.toFixed(3)} m; ${rows.join('; ')}; the worst off the grab's gap ${worst.toFixed(3)} m, the hold lost at ${lost ?? 'never'}; drifted you ${moved.you.toFixed(3)} m, he ${moved.he.toFixed(3)} m`);
      assert(took.ok && lost === null && worst <= 0.1, JSON.stringify({ took: took.ok, lost, worst }));
      assert(moved.you < -0.4 && Math.abs(moved.you - moved.he) <= 0.1, JSON.stringify(moved));
    },
  },
];
