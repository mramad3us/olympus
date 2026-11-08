// The DI on test-stress (src/sim/skills/instinct/pairs.js; SKILLS §14; COMBAT §5.2; the build sheet 0.0.10 §2.2, §5.2): stress-breathe offers Breathe at felt 20 with nothing facing him (out of the mode "Hands shaking. Breathe: T.", in it its digit), never at 19, never startled; T sends Breathe, the turn still armed; "Again. RELOAD." after a failed RELOAD try on the stress course only; pairs-froze and pairs-shaking on strings 3 to 5; over whole courses every act a line offers is a row the panel has, and every key it names the panel's.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { stressBot, stressFuzzBot } from './bots/stress.mjs';
import { firedNow, instinctNow } from '../src/sim/skills/instinct.js';
import { pairsNow, pairsWant } from '../src/sim/scenarios/pairs.js';
import { recOf, RELOAD_STRING } from '../src/sim/scenarios/stress.js';
import { stepsOf, enterStop, gunOn } from '../src/sim/arms/shooting.js';
import { digitOf } from '../src/sim/arms/panel.js';
import { feltOf, hardOf, breatheOffer } from '../src/sim/combat/supp.js';
import { playerActor } from '../src/core/ids.js';
import { facingOf } from '../src/sim/arms/turners.js';

const rule = (state, id) => firedNow(state).find(l => l.id === id) ?? null;
// (the pool written by hand so felt is what the test asks: felt = round(pool − H))
function feltTo(state, felt) {
  const pid = state.player.id, H = hardOf(state, pid), a = playerActor(state);
  a.combat = { supp: felt + H, suppAtMs: state.clock.ms, suppRate: 2, startleFromMs: null, startleUntilMs: null, blindUntilMs: null, dazzleUntilMs: null, deafUntilMs: null };
  return { H, felt: feltOf(state, pid) };
}
// (an act as T does it: 'stop:<step>[@tempo][>target]', its tempo only a tempo's word (a step such as 'reach@p2' keeps its '@'))
function stepOf(act) {
  let rest = act.slice(5), target = null;
  const gt = rest.indexOf('>');
  if (gt >= 0) { target = rest.slice(gt + 1); rest = rest.slice(0, gt); }
  const m = /^(.*)@(normal|rushed|careful)$/.exec(rest);
  return { step: m ? m[1] : rest, target };
}

export default [
  {
    name: 'stress-breathe (warn) at felt 20 out of the mode in a standby with the turn armed: "Hands shaking. Breathe: T.", its act Breathe; never at 19; never startled; T sends Breathe as a live step and the turn stays armed (pairs.js pairsWant null while it runs); in the mode its digit, the panel\'s ("Breathe: 4.")',
    fn() {
      const g = createGame({ scenario: 'test-stress', seed: 48213, tier: 'recruit', setup: 'standby' }), s = g.state;
      g.step(2);
      const at19 = feltTo(s, 19), r19 = rule(s, 'stress-breathe');
      const at20 = feltTo(s, 20), r20 = rule(s, 'stress-breathe');
      console.log(`      H ${at20.H}: at felt ${at19.felt} ${r19 ? 'offered' : 'not offered'}; at felt ${at20.felt}: ${r20?.tone} "${r20?.rule.text[r20.ctx.variant][0]}" act ${r20?.act}; the turn armed ${s.armoury.range.str.turnAtMs !== null}`);
      assert(!r19 && r20 && r20.tone === 'warn' && r20.act === 'breathe' && r20.ctx.variant === 'out', JSON.stringify({ r19: !!r19, act: r20?.act, v: r20?.ctx.variant }));
      const a = playerActor(s);
      a.combat.startleFromMs = s.clock.ms; a.combat.startleUntilMs = s.clock.ms + 1000;
      assert(!rule(s, 'stress-breathe'), 'offered while startled');
      a.combat.startleUntilMs = null; a.combat.startleFromMs = null;
      feltTo(s, 60);
      const r60 = rule(s, 'stress-breathe');
      console.log(`      at felt 60 (suppressed): "${r60?.rule.text[r60.ctx.variant][0]}"`);
      assert(r60?.ctx.variant === 'shaking', JSON.stringify(r60?.ctx.variant));
      g.step(1, { act: [{ act: 'instinct', args: { id: r60.id, act: r60.act } }] });
      const live = s.stop?.mode === 'live' && s.stop.doing?.step === 'breathe';
      let held = 0;
      for (let n = 0; n < 40 && s.stop?.doing?.step === 'breathe'; n++) { g.step(1); if (s.armoury.range.str.turnAtMs !== null && pairsWant(s) === null) held++; }
      console.log(`      T: Breathe as a live step ${live}; the turn armed and the line ready on ${held} of its ticks; ${s.armoury.range.str.turnedMs !== null ? 'the turn came' : 'not turned yet'}`);
      assert(live && held > 0, JSON.stringify({ live, held }));
      // (in the mode: the digit the panel gives it)
      const h = createGame({ scenario: 'test-stress', seed: 48213, tier: 'recruit', setup: 'standby' }), t = h.state;
      h.step(2);
      enterStop(t, h.bus, { via: 'ready' });
      h.step(1);
      feltTo(t, 30);
      h.step(1);
      const rm = rule(t, 'stress-breathe'), key = digitOf(stepsOf(t), 'breathe');
      console.log(`      in the mode at felt 30: "${rm ? rm.rule.text[rm.ctx.words][0].replace('{key}', rm.ctx.key) : '-'}" act ${rm?.act}; the panel's key ${key}`);
      assert(rm && rm.act === 'stop:breathe' && rm.ctx.key === key && !!key, JSON.stringify({ act: rm?.act, key, k: rm?.ctx.key }));
    },
  },
  {
    name: '"Again. RELOAD." (pairs-reload \'again\') after a failed RELOAD try on the stress course\'s string 5, its act the RELOAD row; on test-pairs\' string 5 the same rifle gets the course\'s own words',
    fn() {
      const lines = {};
      for (const scenario of ['test-stress', 'test-pairs']) {
        const g = createGame({ scenario, seed: 48213, tier: 'recruit', setup: 'standby:4' }), s = g.state, R = s.armoury.range, pid = s.player.id;
        g.step(2);
        // (the string turned, the rifle locked back on the empty magazine, a RELOAD try failed)
        const now = s.clock.ms, gun = s.items[gunOn(s, pid)], mag = s.items[gun.mag];
        R.str.turnAtMs = now; R.str.turnedMs = now; R.hot = true;
        mag.n = 0; gun.chamber = null; gun.locked = true; gun.belief = { chamber: 'empty', count: 0, locked: true };
        if (R.stress) recOf(R, RELOAD_STRING).reload = { startMs: now, endMs: null, tries: [false], open: false };
        enterStop(s, g.bus, { via: 'ready' });
        g.step(1);
        const r = rule(s, 'pairs-reload');
        lines[scenario] = { variant: r?.ctx.variant ?? null, act: r?.act ?? null, text: r ? (r.rule.text[r.ctx.variant ?? 1] ?? r.rule.text[1])[0] : null };
      }
      console.log(`      test-stress: ${JSON.stringify(lines['test-stress'])}; test-pairs: ${JSON.stringify(lines['test-pairs'])}`);
      assert(lines['test-stress'].variant === 'again' && lines['test-stress'].text === 'Again. RELOAD.' && /^stop:macro:reload:(speed|retain)$/.test(lines['test-stress'].act ?? ''), JSON.stringify(lines));
      assert(lines['test-pairs'].variant !== 'again', JSON.stringify(lines));
    },
  },
  {
    name: 'over whole courses (the stress bot as the boot recruit on 48213 and 7, the fuzz bot on 2 seeds): every act a DI line or chip offers is a row of the panel now (T always does something), every key a line names is the panel\'s, Breathe offered out of the mode only where supp.js offers it; pairs-froze heard after the called bang and the bangs, pairs-shaking at a pause on strings 4 and 5; stress-breathe never with a threat facing',
    heavy: true,   // (a whole-course or many-roll run: out of the quick suite, which is held to 60 s; it runs in the full suite and every release)
    timeoutMs: 600_000,
    fn() {
      const runs = [['the stress bot, recruit 48213', 48213, stressBot()], ['the stress bot, recruit 7', 7, stressBot()], ['the fuzz bot, private 5101', 5101, stressFuzzBot({ seed: 1 })], ['the fuzz bot, recruit 5102', 5102, stressFuzzBot({ seed: 2 })]];
      let checked = 0, acts = 0, bad = [];
      const heard = {};
      for (const [tag, seed, bot] of runs) {
        const g = createGame({ scenario: 'test-stress', seed, tier: tag.includes('private') ? 'private' : 'recruit' }), s = g.state, stale = new Set();
        for (let n = 0; n < 20 * 60 * 30 && !pairsNow(s).end; n++) {
          g.step(1, bot);
          g.clearFacts();
          const I = instinctNow(s);
          for (const l of [I.line, I.chip].filter(Boolean)) {
            checked++;
            const k = s.armoury.range.str?.k ?? -1;
            (heard[l.id] ??= new Set()).add(k);
            if (!l.act) continue;
            acts++;
            // ('stop:enter' is G, out of the mode: no row; every other 'stop:' act a row of the panel now)
            if (l.act.startsWith('stop:') && l.act !== 'stop:enter') {
              const { step } = stepOf(l.act), offered = s.stop?.mode === 'stop' ? stepsOf(s).find(x => x.id === step && !x.off) : null;
              if (!offered) bad.push(`${tag} ${s.clock.ms}: ${l.id} ${l.act} not in the panel`);
            } else if (l.act === 'breathe' && !breatheOffer(s).ok) {
              // (the DI settles in its layer of the tick: a line may stand the one tick its offer ends in, never more (the fixer's of
              // 0.0.10: the stress bot Breathes by its own minute now, so it no longer takes every line at once, and a chip stood the
              // tick the shooter went into the mode as the felt fell under 20))
              if (stale.has(`${l.id}|${s.clock.ms - 50}`)) bad.push(`${tag} ${s.clock.ms}: ${l.id} Breathe not offered`);
              stale.add(`${l.id}|${s.clock.ms}`);
            }
            if (l.id === 'stress-breathe') {
              const str = s.armoury.range.str, up = !!str && !str.done && str.turnedMs !== null && s.armoury.range.turners.some(T => str.keys.includes(T.key) && T.stoppedAtMs === null && facingOf(T, s.clock.ms) >= 0.5);
              // (the line as settled stands until the next due tick (whole seconds); T acts only on a rule firing now)
              if (up && rule(s, 'stress-breathe')) bad.push(`${tag} ${s.clock.ms}: Breathe offered with a threat facing`);
              if (l.act === 'stop:breathe' && I.line?.id === l.id && !I.line.text.includes(digitOf(stepsOf(s), 'breathe'))) bad.push(`${tag} ${s.clock.ms}: "${I.line.text}" names another key than ${digitOf(stepsOf(s), 'breathe')}`);
            }
          }
        }
        console.log(`      ${tag}: ${pairsNow(s).end?.phase}; ${pairsNow(s).stress.summary}`);
      }
      console.log(`      ${checked} lines and chips over the courses, ${acts} with an act; not in the panel: ${bad.length ? bad.slice(0, 6).join('; ') : 'none'}`);
      console.log(`      heard by string (1 to 5, 0 between): ${Object.entries(heard).map(([id, ks]) => `${id} ${[...ks].sort().map(k => k + 1).join(',')}`).join('; ')}`);
      assert(!bad.length, bad.slice(0, 6).join('; '));
      assert([2, 3, 4].every(k => heard['pairs-froze']?.has(k)) || [3, 4].every(k => heard['pairs-froze']?.has(k)), `pairs-froze on the bangs' strings: ${[...(heard['pairs-froze'] ?? [])]}`);
      assert([3, 4].some(k => heard['pairs-shaking']?.has(k)), `pairs-shaking on strings 4 or 5: ${[...(heard['pairs-shaking'] ?? [])]}`);
      assert(heard['stress-breathe']?.size, 'Breathe offered somewhere');
    },
  },
];
