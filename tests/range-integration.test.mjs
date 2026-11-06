// The integrator's fixes to test-handling (v0.0.5), each pinned so it fails without its fix: what the roles built apart and the scene played by the keys showed wrong together.
//
// Played by the keys in the page at 16 px/m (the integrator's run), the scene read wrong in places no
// role's suite could see: R offered a fifteen-minute wait under a running LOAD; X did nothing while the
// chained wait for the tower ran; Off safe sat on the step panel's second or third page; the coach said
// "Five in the five" of a string the set stoppage had cut to four; UNLOAD, SHOW CLEAR sat in the panel
// from the first second; the dummy, the stripped round and the cleared case were thrown out of the port
// with no record, so the stage drew nothing; J's handling rolls read as one sum after another with no
// action named; the DI's muzzle line never spoke outside stop motion; "Free time." came back over the
// end card. The arms role's REFUSALS and the I card's capacities and reach are here too.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { stepAct } from './bots/lib.mjs';
import { rangeBot } from './bots/range.mjs';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { handOffer } from '../src/sim/places/hand.js';
import { kitView } from '../src/sim/arms/kit.js';
import { actionMs } from '../src/sim/arms/firearms.js';
import { rollerOf } from '../src/sim/combat/roll.js';
import { rollLine } from '../src/ui/cards/log.js';

// (the scene with the range bot to a condition, or its end; returns the game)
function playTo(seed, until = () => false, maxTicks = 6000) {
  const g = createGame({ scenario: 'test-handling', seed, hour: 9 }), bot = rangeBot();
  for (let t = 0; t < maxTicks && !g.me().bot?.done && !until(g.state); t++) g.step(1, bot);
  return g;
}
const cmdOf = (s) => s.armoury.range?.cmd?.id ?? null;

export default [
  {
    name: 'R offers nothing while stop motion runs (a step playing, the chained wait), and X leaves the mode from the chained wait as any step cuts it (the integrator\'s play by the keys: "R wait 15 min" under LOAD, and X after LOAD did nothing)',
    fn() {
      const g = playTo(48213, (s) => s.stop?.doing?.kind === 'command' && s.stop.doing.step === 'macro:load');
      const s = g.state, during = handOffer(s);
      for (let t = 0; t < 200 && !s.stop?.doing?.chain; t++) g.step(1, {});
      const chained = !!s.stop?.doing?.chain, inWait = handOffer(s);
      g.step(1, { act: ['shoot'] });
      console.log(`      under LOAD: R offers ${during ? `"${during.label}"` : 'nothing'}; in the chained wait: ${inWait ? `"${inWait.label}"` : 'nothing'}; X there: the mode ${s.stop ? s.stop.mode : 'left'}; then R: "${handOffer(s)?.label ?? 'nothing'}" (the line is the tower's: the reviews of v0.0.5)`);
      assert(during === null && chained && inWait === null && s.stop === null && handOffer(s) === null, JSON.stringify({ during, chained, inWait, stop: s.stop }));
    },
  },
  {
    name: 'the step panel shows the selector first among the singles, so Off safe is on the first page at commence fire, and UNLOAD, SHOW CLEAR only once the tower has said it (the shot and arms roles\' reports: 7.4 s of it in the panel from the first second)',
    fn() {
      const g = playTo(48213, (s) => cmdOf(s) === 'fire' && s.stop?.phase === 'choose' && s.stop.aim);
      const s = g.state, steps = stepsOf(s), singles = steps.filter(x => x.kind === 'single');
      const before = [];
      const seen = (st) => { if (cmdOf(st) !== 'clear' && st.stop?.mode === 'stop' && st.stop.phase === 'choose' && stepsOf(st).some(x => x.id === 'macro:clear')) before.push(cmdOf(st)); };
      seen(s);
      for (let t = 0; t < 6000 && cmdOf(s) !== 'clear' && !g.me().bot?.done; t++) { g.step(1, rangeBot()); seen(s); }
      for (let t = 0; t < 200 && s.stop?.phase !== 'choose'; t++) g.step(1, {});
      const after = stepsOf(s).some(x => x.id === 'macro:clear');
      console.log(`      at commence fire: ${steps.map(x => x.id).slice(0, 9).join(', ')}; the first single ${singles[0]?.id}`);
      console.log(`      SHOW CLEAR offered before the tower's command: ${before.length ? before.join(', ') : 'never'}; after it: ${after}`);
      assert(singles[0]?.id?.startsWith('selector:') && steps.indexOf(singles[0]) <= 8, JSON.stringify(steps.map(x => x.id)));
      assert(!before.length && after, JSON.stringify({ before, after }));
    },
  },
  {
    name: 'the coach counts a string by the shots fired: the set stoppage\'s string of four is "four", never "five" (the integrator\'s: "Five in the five" of four shots)',
    fn() {
      for (const seed of [48213, 7]) {
        const g = playTo(seed), s = g.state, R = s.armoury.range;
        const lines = s.log.filter(e => e.kind === 'say' && e.say === 'speech' && e.who === R.coachId).map(e => e.text);
        const shots = [0, 1, 2].map(k => R.shots.filter(x => x.string === k).length);
        const said = lines.filter(t => /on the paper|^(None|One|Two|Three|Four|Five) of |got off lightly|went wide|got away/.test(t));
        console.log(`      seed ${seed}: shots a string ${shots.join(', ')}; the coach: ${said.map(t => `"${t}"`).join(' ')}`);
        assert(said.length === 3 && said.every((t, k) => !/five/i.test(t) || shots[k] === 5), JSON.stringify({ said, shots }));
      }
    },
  },
  {
    name: 'at SHOW CLEAR the coach looks into the chamber, then says "Clear.": his word at the look\'s end, not its start (the integrator\'s: "Clear." was in the radio box the moment he began to look)',
    fn() {
      const g = playTo(48213), s = g.state, R = s.armoury.range;
      const look = g.bus.events.find(([type, d]) => type === 'step' && d.phase === 'sub' && d.action === 'show')?.[1];
      const word = s.log.find(e => e.kind === 'say' && e.who === R.coachId && /^(Clear|Hold)/.test(e.text));
      console.log(`      the look from +0 to +${look.toMs - look.fromMs} ms; "${word?.text}" at +${word.atMs - look.fromMs} ms (the first tick at or past its end)`);
      assert(look && word && word.atMs >= look.toMs && word.atMs - look.toMs < 50, JSON.stringify({ look, word }));
    },
  },
  {
    name: 'what a handling step throws out of the port lies where it lands: the stripped round of a double, the coach\'s orange dummy, a stovepipe\'s case, each case drawn once (the arms role\'s report: they had no record, so the stage drew nothing; the integrator\'s: a stovepipe\'s case flew at the shot and again when cleared)',
    fn() {
      for (const [seed, want] of [[48213, 'round'], [1, 'dummy'], [7, 'case']]) {
        const g = playTo(seed), R = g.state.armoury.range, kinds = {};
        for (const b of R.brass) kinds[b.kind] = (kinds[b.kind] ?? 0) + 1;
        const thrown = R.brass.filter(b => b.kind !== 'case' || !R.shots.some(sh => sh.atMs === b.atMs));
        console.log(`      seed ${seed}: the set a ${R.set.kind}; brass ${JSON.stringify(kinds)}; thrown by a hand: ${thrown.map(b => `${b.kind} at (${b.at.map(v => v.toFixed(2)).join(', ')}) after ${b.landMs - b.atMs} ms`).join('; ')}`);
        // (and a shot that did not cycle throws no case of its own: its case flies once, when a step clears it)
        const fired = R.shots.length, cycled = fired - (R.set.kind === 'dud' ? 0 : 1);
        assert(thrown.some(b => b.kind === want) && (kinds.case ?? 0) === cycled + (R.set.kind === 'dud' ? 0 : 1), JSON.stringify({ seed, kinds, set: R.set, fired }));
      }
    },
  },
  {
    name: 'J names the action before a handling roll ("Magazine in: Weapon handling …"); a shot\'s line is its own (the integrator\'s: a page of sums with nothing said of what was done)',
    fn() {
      const g = playTo(48213, (s) => cmdOf(s) === 'ready'), rolls = g.state.log.filter(e => e.kind === 'roll');
      const lines = rolls.map(r => rollLine(r)?.short).filter(Boolean);
      console.log(`      ${lines.slice(0, 5).join(' | ')}`);
      assert(lines.some(l => /^Magazine in: Weapon handling \d+ against \d+/.test(l)) && lines.every(l => /^[A-Z][^:]*: (Weapon handling|Awareness)|^Marksmanship/.test(l)), JSON.stringify(lines));
    },
  },
  {
    name: 'the DI\'s muzzle line speaks outside stop motion too, the heading read from the facing (the integrator\'s: walking north off the line with the rifle up, "Your card. Aim." spoke instead)',
    fn() {
      // (facing north with the rifle up out of the mode: the keys no longer turn you on the line (the design review's
      // strafe), so the facing is set as leaving the mode from an aim to the north would leave it)
      const g = createGame({ scenario: 'test-handling', seed: 7, hour: 9, setup: 'hot' }), s = g.state;
      g.step(1, { act: [stepAct('leave')] });
      g.step(1, {});
      g.me().face = 'up';
      for (let t = 0; t < 30; t++) g.step(1, {});
      const line = s.$instinct?.line ?? null, me = g.me();
      console.log(`      out of the mode, ${s.people[s.player.id].kit.carry.posture}, facing ${me.face}: "${line?.text ?? ''}" (${line?.id ?? 'no line'}, ${line?.tone ?? '-'})`);
      assert(!s.stop && me.face === 'up' && line?.id === 'range-muzzle' && line.tone === 'urgent', JSON.stringify({ line, face: me.face }));
    },
  },
  {
    name: 'once the line is clear nothing speaks over the end card below urgent, and entering stop motion says "Time stands still." only as the line\'s lead, not a toast too (the integrator\'s: "Free time. Spend it like it costs something." over the end card; the hud role\'s report)',
    fn() {
      const g = playTo(48213), s = g.state;
      for (let t = 0; t < 200; t++) g.step(1, {});
      const line = s.$instinct?.line ?? null;
      const enter = g.bus.events.filter(([type, d]) => type === 'line' && /Time stands still/.test(d?.text ?? ''));
      console.log(`      after "The line is clear.": ${line ? `"${line.text}" (${line.tone})` : 'no line'}; 'line' facts saying time stands still: ${enter.length}`);
      assert(s.armoury.range.end?.phase === 'clear' && (!line || line.tone === 'urgent') && !enter.length, JSON.stringify({ line, enter: enter.length }));
    },
  },
  {
    name: 'the I card gives each pouch its capacity and its reach, the sim\'s own time for a magazine in, the step panel\'s (VIEWS §8.3; the hud role\'s report: every pouch read full and no reach showed; the parity review\'s: 1.4 and 2.0 s charged nowhere)',
    fn() {
      // (the reach is the sim's magIn time, the step panel's "Magazine in" (the parity review's: the card's 1.4 and 2.0 s were charged nowhere))
      const g = createGame({ scenario: 'test-handling', seed: 48213, hour: 9 }), s = g.state, pid = s.player.id, gun = s.items[s.people[pid].kit.worn.sling];
      const magInS = actionMs(rollerOf(s, pid), gun, 'magIn') / 1000, v = kitView(s, pid, { magInS });
      const pouches = v.groups.filter(x => x.id !== 'worn');
      console.log(`      ${pouches.map(p => `${p.word}: ${p.items.length} of ${p.holds}, reach ${p.reachS.toFixed(2)} s (${p.items.map(i => `${i.word} ${i.n}`).join('; ')})`).join(' | ')}; the panel's Magazine in ${magInS.toFixed(2)} s`);
      assert(pouches.length === 3 && pouches.every(p => Number.isFinite(p.holds) && p.holds >= p.items.length && p.reachS === magInS && p.items.every(i => i.reachS === magInS)), JSON.stringify(pouches));
    },
  },
];
