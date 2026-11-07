// The basin, R saying what it does (the build sheet 0.0.6 §6, check 3; the user, 2026-11-06, after playing v0.0.4:
// "the shave+wash+water when pressing R at a basin without the tootip telling us what is going to happen is no good
// ... R should wash hands if hygiene is low enough, drink if we're thristy and shave if none of the above ... long
// pressing R should open the menu with all the possible interractions as single actions, with the ability to select
// several actions"). The barracks at 19:30, seed 48213: the bot walks from the rack's foot to Head A's urinal and R
// there (the head; with the bladder at 50 mL or under the urinal's row is struck, so a stall, and it says so), then to
// a sink, where R's words read "wash hands · 30 s" and R does that alone (behind the brief splash since
// 2026-11-07, the user: "I'm okay with no time skip for actions taking up to 10s"; the hands clean, nothing else
// changed); R's words then read "shave · 4 min, done …" (or "drink · 30 s" if thirsty); R held lists six rows; brush
// teeth, shave and wash face checked and sent as one chain: one splash, three activity ends each with its line, one
// skip-end with outcome.chain of three, the stubble 0 and the clock 7 minutes on. A save made during the shave,
// loaded, ends on the same digest; run again with Backspace during the shave, it ends at the shave's end, wash face
// dropped. Prints the timeline beside v0.0.5's run of the same walk (the bundle: R at the sink did teeth, a shave and
// the face as one, its words "the basin · 7 min") and saves each beat into .run/moments/.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { assert, fmt, root } from './helpers.mjs';
import { createGame, NO_BUDGET } from './game.mjs';
import { runBot } from './bots/lib.mjs';
import { basinRoutine, menuOf, chainAct, SINK } from './bots/routine.mjs';
import { splashPlan } from '../src/sim/time/splash.js';
import { handOffer } from '../src/sim/places/hand.js';
import { planChain } from '../src/sim/time/chain.js';
import { bodyOf } from '../src/sim/body/body.js';
import { stagesOf } from '../src/sim/body/cues.js';
import { marsClock } from '../src/core/calendar.js';
import { SITES } from '../src/data/setting/calendar.js';
import { MIN_MS, TICK_MS } from '../src/core/clock.js';

const SEED = 48213, LON = SITES.melas.lonEDeg, DIR = path.join(root, '.run', 'moments');
const hm = (ms) => { const c = marsClock(ms, LON); return `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}:${String(c.second).padStart(2, '0')}`; };
const ctxOf = (g) => ({ held: false, tickMs: TICK_MS, sim: g.sim });
/** v0.0.5's run of the same walk, by its own code in a worktree at its tag (2026-11-07), printed beside this one's. */
const V005 = Object.freeze([
  '19:30:00 at the rack\'s foot (52.08, 3.30), bladder 38.4 mL, stubble 14.0 h',
  '19:30:11 at the urinal: R "wait 15 min" (the head not offered, the bladder under 50 mL; nothing said why)',
  '19:30:14 at the sink: R "the basin · 7 min, done 19:37" (R held: drink · 30 s)',
  '19:30:14 to 19:37:14: one splash, 7 min, teeth, shave and face as one: "Brushed, scraped and rinsed: 7 min."',
]);
const CHECKED = Object.freeze(['teeth', 'shave', 'wash-face']);

export default [
  {
    name: 'R at the basin says what it does (the user, 2026-11-06): the head, then "wash hands · 30 s" done alone, then "shave · 4 min, done …"; R held\'s six single rows, three checked: one splash, three ends with their lines, outcome.chain of three; a save in the shave carries on byte for byte; Backspace in the shave drops wash face',
    heavy: true,
    timeoutMs: 300_000,
    fn() {
      mkdirSync(DIR, { recursive: true });
      const save = (g, beat) => writeFileSync(path.join(DIR, `basin-${beat}.json`), g.save());
      const g = createGame({ scenario: 'barracks', seed: SEED, hour: 19.5 });
      const s = g.state, pid = s.player.id, me = g.me(), t0 = s.clock.ms;
      const lines = [];
      const b0 = bodyOf(s, pid);
      lines.push(`${hm(t0)} at the rack's foot (${fmt(me.x, 2)}, ${fmt(me.z, 2)}), bladder ${fmt(b0.bladder.ml, 1)} mL, stubble ${fmt(b0.hygiene.stubbleH, 1)} h, hands ${fmt(b0.hands.dirt, 1)}`);
      save(g, '0-start');
      // (the walk, the head, the sink and R there: the bot; the offers watched as it goes)
      const seen = [];
      const routine = basinRoutine();
      const watch = (state, m, mem) => { const o = handOffer(state); const k = `${o?.verb}|${o?.label}`; if (o && seen.at(-1)?.k !== k) seen.push({ k, at: state.clock.ms, label: o.label, id: o.id, why: o.why, spotId: o.spotId }); return routine(state, m, mem); };
      const r = runBot(g, watch, { maxTicks: 20 * 60 * 12 });
      assert(r.done, `the routine: ${r.reason} ${JSON.stringify(r.log.at(-1))}`);
      const acts = g.facts('activity').filter(f => f.phase === 'end');
      const soiled = g.facts('body-event').filter(e => e.kind === 'soil'), groomed = g.facts('body-event').filter(e => e.kind === 'groom');
      const theHead = acts.find(f => f.activity === 'urinate' || f.activity === 'bowel'), hands = acts.find(f => f.activity === 'wash-hands');
      const atSink = seen.find(x => x.id === 'wash-hands');
      const struck = g.facts('activity').length && theHead?.activity === 'bowel' ? 'the urinal\'s row struck "nothing to give": on to a stall' : 'the urinal';
      lines.push(`${hm(theHead.fromMs)} ${struck}: R "${seen.find(x => x.id === theHead.activity)?.label}" (${theHead.activity}), done ${hm(theHead.toMs)}: "${theHead.outcome.line}"; the hands soiled ${soiled.map(e => `+${e.amount} (${e.why})`).join(', ')}, never washed by it`);
      lines.push(`${hm(hands.fromMs)} at the sink: R "${atSink.label}" (${atSink.why}), lived ${hands.mode === 'live'}, done ${hm(hands.toMs)}: "${hands.outcome.line}"`);
      const b1 = bodyOf(s, pid), st1 = stagesOf(b1, s.clock.ms);
      const o2 = handOffer(s), menu = menuOf(s);
      lines.push(`${hm(s.clock.ms)} R "${o2.label}" (${o2.why}); R held, ${menu.title}: ${menu.rows.map(x => `${x.words}${x.off ? ` (${x.off})` : ''}`).join(' | ')}`);
      save(g, '1-at-sink');
      const pre = g.save();
      // (three checked, Enter: the card's one chain, begun by the sim's action here and advanced by hand, so a save can be made inside the shave)
      const act = chainAct(s, CHECKED), plan = planChain(s, { spotId: act.args.spotId, steps: act.args.steps });
      g.clearFacts();
      const c0 = s.clock.ms, stub0 = b1.hygiene.stubbleH, grime0 = b1.hygiene.grime;
      g.sim.act(s, act, g.bus, ctxOf(g));
      const shave = plan.steps.find(x => x.id === 'shave');
      g.advance(shave.fromMs + 2 * MIN_MS, NO_BUDGET);
      const inShave = s.time.doing?.activity === 'shave', mid = g.save();
      save(g, '2-in-shave');
      g.advance(Infinity, NO_BUDGET);
      const sk = g.facts('skip-start'), se = g.facts('skip-end'), ends = g.facts('activity').filter(f => f.phase === 'end'), b2 = bodyOf(s, pid);
      const sp = splashPlan(sk[0]);
      lines.push(`${hm(c0)} to ${hm(se[0].toMs)}: "${plan.label}", one splash (${sk[0].engine}, ${sp.form}, ${fmt(sp.totalS, 2)} s): ${ends.map(f => `${f.activity} ${hm(f.toMs)} "${f.outcome.line}"`).join('; ')}`);
      lines.push(`  stubble ${fmt(stub0, 2)} → ${fmt(b2.hygiene.stubbleH, 3)} h, grime ${fmt(grime0, 2)} → ${fmt(b2.hygiene.grime, 2)}, hands ${fmt(b1.hands.dirt, 2)} → ${fmt(b2.hands.dirt, 2)}; outcome.chain ${se[0].outcome.chain.map(c => `${c.id} ${c.by}`).join(', ')}`);
      save(g, '3-landed');
      g.step(200);
      const want = g.digest();
      // (the save made in the shave, loaded in a fresh game: the same end)
      const h = createGame({ scenario: 'barracks', seed: SEED, hour: 19.5 });
      h.load(mid); h.advance(Infinity, NO_BUDGET); h.step(200);
      const same = h.digest() === want;
      // (again from the sink, Backspace during the shave)
      const k = createGame({ scenario: 'barracks', seed: SEED, hour: 19.5 });
      k.load(pre); k.clearFacts();
      k.sim.act(k.state, chainAct(k.state, CHECKED), k.bus, ctxOf(k));
      k.advance(shave.fromMs + 2 * MIN_MS, NO_BUDGET);
      k.advance(Infinity, NO_BUDGET, ['skip:stop']);
      const kse = k.facts('skip-end').at(-1), kstop = k.facts('chain').find(c => c.phase === 'stop');
      lines.push(`Backspace at ${hm(shave.fromMs + 2 * MIN_MS)} in the shave: ended ${hm(kse.toMs)} (the shave's end ${hm(shave.toMs)}), ${kse.outcome.chain.map(c => `${c.id} ${c.by}`).join(', ')}; the strip: ${JSON.stringify(kse.outcome.lines)}`);
      lines.push(`a save in the shave (${inShave ? 'the shave running' : 'NOT in the shave'}), loaded in a fresh game: ${same ? 'the same digest' : 'DIFFERENT'} (${want})`);
      console.log('      v0.0.6:');
      for (const l of lines) console.log(`        ${l}`);
      console.log('      v0.0.5, the same walk (the bundle):');
      for (const l of V005) console.log(`        ${l}`);
      // (check 3)
      assert(atSink && atSink.label === 'wash hands · 30 s' && atSink.why === 'hands' && hands.mode === 'ff' && hands.fraction === 1 && stagesOf(bodyOf(s, pid), hands.toMs).hands.i === 0, JSON.stringify({ atSink, hands: hands && [hands.mode, hands.fraction] }));
      assert(soiled.length >= 1 && soiled[0].atMs === theHead.toMs && groomed.length === 1 && groomed[0].amount === 8, JSON.stringify({ soiled, groomed }));
      assert(Math.abs(b1.hygiene.stubbleH - stub0) < 1e-9 && acts.filter(f => f.fromMs >= hands.fromMs).every(f => f.activity === 'wash-hands'), 'washing the hands did something else');
      assert((o2.id === 'shave' && /^shave · 4 min, done \d\d:\d\d$/.test(o2.label)) || (o2.id === 'drink' && o2.label === 'drink · 30 s'), o2.label);
      assert(menu.rows.length === 6 && menu.rows.map(x => x.id).join() === 'wash-hands,teeth,shave,wash-face,drink,wait', menu.rows.map(x => x.id).join());
      assert(act.act === 'chain' && sk.length === 1 && se.length === 1 && ends.map(f => f.activity).join() === CHECKED.join() && ends.every(f => f.outcome.line) && se[0].outcome.chain.length === 3, JSON.stringify(ends.map(f => f.activity)));
      // (7 minutes, plus the first step's end put on the next whole second, chain.js ceilSec: under a second, however the walk lands c0)
      const chainMs = se[0].toMs - c0;
      assert(b2.hygiene.stubbleH < 0.05 && chainMs >= 420_000 && chainMs < 421_000 && se[0].toMs % 1000 === 0, `stubble ${b2.hygiene.stubbleH}, ${chainMs / 1000} s`);
      assert(inShave && same, 'the save in the shave');
      assert(kse.toMs === shave.toMs && kstop && kse.outcome.chain.find(c => c.id === 'wash-face').by === 'dropped' && kse.outcome.chain.find(c => c.id === 'shave').fraction === 1, JSON.stringify(kse.outcome.chain));
    },
  },
];
