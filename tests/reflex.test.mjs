// The reflex card inside stop motion (src/sim/combat/reflex.js, shooting.js; COMBAT §3.5, the build sheet 0.0.5 §8 item 8): a click, a shot that did not cycle, each answer's step, a kept answer.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { stepAct } from './bots/lib.mjs';
import { offerReflex, chosenReflex, KEEP_MS, NONE } from '../src/sim/combat/reflex.js';

// (the line hot, the rifle aimed and off safe, the chambered round set to what the coach set it to)
function armed({ seed = 48213, set = 'dud' } = {}) {
  const g = createGame({ scenario: 'test-handling', seed, hour: 9, setup: 'hot' }), s = g.state, gun = s.items[s.stop.gun];
  gun.mode = 'semi'; gun.set = set;
  return g;
}
const playOut = (g) => { for (let n = 0; g.state.stop?.phase === 'act' && n < 400; n++) g.step(1); };

export default [
  {
    name: 'a click and a shot that did not cycle each offer the card, \'reflex\' held with \'stop\'; each answer runs its step: tap and rack (IMMEDIATE ACTION), the look at the port, nothing',
    fn() {
      const out = [];
      for (const [set, answer] of [['dud', 'ia'], ['stovepipe', 'look'], ['double', 'look'], ['dud', 'none']]) {
        const g = armed({ set });
        g.step(1, { act: [stepAct('fire')] });
        playOut(g);
        const S = g.state.stop, card = S.reflex, holds = g.state.clock.holds.join();
        const t = g.state.clock.ms;
        g.step(10);
        const still = g.state.clock.ms === t;
        assert(card && holds.includes('stop') && holds.includes('reflex') && still, JSON.stringify({ set, card, holds }));
        const n0 = g.facts('step').length;
        g.step(1, { act: [stepAct(`reflex:${answer}`)] });
        playOut(g);
        const started = g.facts('step').slice(n0).find(f => f.phase === 'start');
        const b = g.state.items[S.gun].belief;
        out.push(`${set}: "${card.title}" [${card.options.map(o => o.key).join(', ')}]; ${answer} → ${started ? started.step : 'no step'}; then the belief ${JSON.stringify({ chamber: b.chamber, stoppage: b.stoppage ?? null })}, holds [${g.state.clock.holds}]`);
        if (answer === 'ia') assert(started?.step === 'macro:ia', 'ia'); else if (answer === 'look') assert(started?.step === 'observe', 'look'); else assert(!started && !g.state.stop.reflex, 'none');
        if (set === 'double' && answer === 'look') assert(b.stoppage === 'double', 'the look sees the double');
      }
      for (const l of out) console.log(`      ${l}`);
    },
  },
  {
    name: 'an answer kept answers the next moment of its kind at once, with no card, until 120 s after it was kept and not after; a kept answer no longer offered is not used',
    fn() {
      const g = armed({ set: 'dud' }), s = g.state;
      g.step(1, { act: [stepAct('fire')] }); playOut(g);
      g.step(1, { act: [{ act: 'stop', args: { step: 'reflex:ia', keep: true } }] }); playOut(g);
      const keep = s.stop.keep.click;
      assert(keep?.key === 'ia' && keep.untilMs > s.clock.ms && keep.untilMs <= s.clock.ms + KEEP_MS, JSON.stringify(keep));
      // (the next dud, a minute later in the world's clock: answered by reflex)
      s.items[s.stop.gun].set = 'dud'; s.items[s.stop.gun].chamber = 'live'; delete s.items[s.stop.gun].cocked;
      const k0 = g.facts('reflex').length;
      g.step(1, { act: [stepAct('fire')] }); playOut(g);
      const after = g.facts('reflex').slice(k0);
      console.log(`      kept 'ia' until +${KEEP_MS / 1000} s; the next click: ${after.map(f => f.phase).join(', ')}; the log "${s.log.filter(e => e.text?.startsWith('By reflex')).at(-1)?.text}"`);
      assert(after.some(f => f.phase === 'kept') && !after.some(f => f.phase === 'offer'), JSON.stringify(after));
      // (after the 120 s, or an answer not among the options: the card)
      const S = s.stop;
      S.keep.click.untilMs = s.clock.ms - 1;
      S.phase = 'choose'; S.doing = null;
      assert(offerReflex(s, null, { why: 'click', title: 'Click.', options: [{ key: 'ia', label: 'Tap, rack', step: 'macro:ia' }] }) && S.reflex, 'expired: the card');
      chosenReflex(s, null, 'none');
      S.keep.stop = { key: 'remedial', untilMs: s.clock.ms + KEEP_MS };
      assert(offerReflex(s, null, { why: 'stop', title: "It didn't cycle.", options: [{ key: 'ia', label: 'Tap, rack', step: 'macro:ia' }] }) && S.reflex?.why === 'stop', 'a kept answer not offered: the card');
      const none = chosenReflex(s, null, 'whatever', { keep: true });
      assert(none.key === NONE.key && !S.keep.stop.key.startsWith('none'), 'nothing is never kept');
      console.log(`      expired: the card again; kept 'remedial' for a moment that offers only tap and rack: the card; an unknown answer is "${none.label}", never kept`);
    },
  },
];
