// The gun as a state machine (src/sim/arms/firearms.js; WEAPONS §4, §5.1, §5.2, §5.4; the build sheet 0.0.5 §5.1): every action's time by Weapon handling against WEAPONS's table, every action from every state of the R-7 (the truth and the belief after it), the refusals' words, the coach's three set stoppages and their clearing, the truth kept apart from the belief, and tradecraft's fumble ladder run through act() to its own numbers.
import { assert, fmt } from './helpers.mjs';
import { armsWorld } from './arms-world.mjs';
import { move } from '../src/sim/arms/kit.js';
import { stream } from '../src/core/rng.js';
import { fixedRoller } from '../src/sim/combat/roll.js';
import { ACTIONS, REFUSALS, act, actionMs, doAction, pull, feel, feed, canDo, beliefOf, conditionOf, conditionOfBelief, said, gunField, ready } from '../src/sim/arms/firearms.js';
import { runMacro } from '../src/sim/arms/drills.js';

const WH = [3, 7, 10, 15, 20, 25, 30];
// WEAPONS §5.2's manipulation table [computed], rifle actions with LONG_K, seconds
const TABLE = [
  ['safety or selector (thumb)', ['selector:safe'], [0.74, 0.51, 0.40, 0.28, 0.21, 0.16, 0.13]],
  ['magazine in', ['magIn'], [2.18, 1.82, 1.61, 1.36, 1.17, 1.03, 0.92]],
  ['charge', ['charge'], [1.25, 1.04, 0.92, 0.78, 0.67, 0.59, 0.53]],
  ['speed reload (drop, in, release)', ['magOut:drop', 'magIn', 'release'], [3.43, 2.85, 2.53, 2.13, 1.84, 1.62, 1.45]],
  ['tactical reload (to a pouch, in)', ['magOut:pouch', 'magIn'], [4.37, 3.63, 3.22, 2.71, 2.34, 2.06, 1.84]],
  ['tap-rack', ['tap', 'charge'], [1.72, 1.43, 1.27, 1.07, 0.92, 0.81, 0.72]],
  ['double feed', ['clearDouble'], [7.80, 6.48, 5.75, 4.85, 4.19, 3.68, 3.29]],
];
const R7 = { type: 'gun', model: 'r7' };
const pass = (actions) => Object.fromEntries(actions.map(a => [a, 'pass']));

// (put a fixture's gun into a state: the truth set direct, the belief as its holder would hold it)
function setup(W, name) {
  const { state, gunId, magIds } = W, g = state.items[gunId], B = g.belief;
  const magIn = (n) => { move(state, magIds[0], { gun: gunId }); state.items[magIds[0]].n = n; delete state.items[magIds[0]].belief; B.count = n; };
  switch (name) {
    case 'C4': break;
    case 'C3': magIn(5); break;
    case 'C1 safe': magIn(5); feed(g, state.items[magIds[0]]); B.chamber = 'live'; B.count = 4; break;
    case 'C1 semi': magIn(5); feed(g, state.items[magIds[0]]); B.chamber = 'live'; B.count = 4; g.mode = 'semi'; break;
    case 'locked, empty magazine': magIn(0); g.locked = true; g.portOpen = true; B.locked = true; B.count = 0; g.mode = 'semi'; break;
    case 'locked, no magazine': g.locked = true; g.portOpen = true; B.locked = true; break;
    case 'stovepipe': magIn(3); g.chamber = 'case'; g.portOpen = true; g.mode = 'semi'; B.chamber = 'live'; B.count = 3; B.stoppage = 'felt'; break;
    case 'double feed': magIn(3); g.chamber = 'case'; g.jam = 'double'; g.portOpen = true; g.mode = 'semi'; B.chamber = 'live'; B.count = 3; B.stoppage = 'felt'; break;
    case 'the coach\'s dud': magIn(3); g.chamber = 'dud'; g.set = 'dud'; g.cocked = false; g.mode = 'semi'; B.chamber = 'live'; B.count = 3; B.stoppage = 'click'; break;
    case 'hammer down, empty': g.cocked = false; g.mode = 'semi'; break;
    default: throw new Error(name);
  }
}
const STATES = ['C4', 'C3', 'C1 safe', 'C1 semi', 'locked, empty magazine', 'locked, no magazine', 'stovepipe', 'double feed', 'the coach\'s dud', 'hammer down, empty'];
const short = (b) => (b ? `${b.chamber}${b.locked ? '/L' : ''}${b.count !== null ? `/${b.count}` : ''}${b.stoppage ? `/${b.stoppage}` : ''}` : '-');
const truthWord = (g) => `${conditionOf(g) ?? (gunField(g, 'jam') ? 'jam' : gunField(g, 'locked') ? 'L' : gunField(g, 'chamber') ?? 'empty')}${g.mag ? '+m' : ''}${gunField(g, 'mode') === 'safe' ? '' : '·' + gunField(g, 'mode')}`;

export default [
  {
    name: 'every handling action takes base time × paceOf(Weapon handling) (thumb work its square, LONG_K on the rifle), WEAPONS §5.2\'s manipulation table to the hundredth',
    fn() {
      const rows = [];
      let worst = 0;
      console.log(`      ${'action'.padEnd(34)} ${WH.map(v => `WH ${v}`.padStart(11)).join('')}   (ours / WEAPONS's)`);
      for (const [label, acts, want] of TABLE) {
        const got = WH.map(v => acts.reduce((s, a) => s + actionMs(fixedRoller({ weapons: v }), R7, a), 0) / 1000);
        got.forEach((g, i) => { worst = Math.max(worst, Math.abs(g - want[i])); });
        rows.push(`      ${label.padEnd(34)} ${got.map((g, i) => `${fmt(g, 2)}/${fmt(want[i], 2)}`.padStart(11)).join('')}`);
      }
      console.log(rows.join('\n'));
      const singles = Object.keys(ACTIONS).filter(a => a !== 'show' && a !== 'draw').map(a => `${a} ${fmt(actionMs(fixedRoller({ weapons: 10 }), R7, a) / 1000, 3)}`);
      console.log(`      every single at WH 10 (s): ${singles.join(', ')}`);
      console.log(`      worst difference against WEAPONS's table: ${fmt(worst, 4)} s`);
      assert(worst <= 0.0101, `the table to the hundredth: worst ${worst}`);
    },
  },
  {
    name: 'Condition 4 to 1 by the singles; the bolt locks back on the last round; the R-7\'s lever won\'t reach safe with the hammer down',
    fn() {
      const W = armsWorld({ wh: 10 }), { state, bus, pid, gunId } = W, g = state.items[gunId];
      const lines = [];
      const step = (action, opts = {}) => {
        const r = doAction(state, bus, { pid, gunId, action, force: pass([action]), ...opts });
        lines.push(`${action} ${r.ms} ms → C${conditionOf(g) ?? '-'} (${short(beliefOf(state, gunId))}): ${r.text}`);
        return r;
      };
      assert(conditionOf(g) === 4 && conditionOfBelief(beliefOf(state, gunId)) === 4, 'new: Condition 4, and believed so');
      step('magIn');
      assert(conditionOf(g) === 3, 'a magazine in: Condition 3');
      step('charge');
      assert(conditionOf(g) === 1 && beliefOf(state, gunId).chamber === 'live' && beliefOf(state, gunId).count === 4, 'charged on safe: Condition 1, one in and four believed');
      step('port');
      step('selector:semi');
      assert(ready(g) && conditionOf(g) === null, 'off safe: ready, no condition');
      const rng = stream('arms-test', 1);
      let fired = 0, last = null;
      for (let i = 0; i < 8; i++) { last = pull(rng, g, state.items[g.mag]); g.belief = feel(g.belief, last, { wh: 10 }); if (!last.fired) break; fired++; }
      lines.push(`${fired} pulls fired, then ${last.why}: ${said(beliefOf(state, gunId))}`);
      assert(fired === 5 && gunField(g, 'locked') && last.why === 'open' && beliefOf(state, gunId).locked && beliefOf(state, gunId).count === 0, `five fired, the bolt locked back on the empty magazine (${fired}, ${last.why})`);
      step('magOut:drop');
      step('release');
      step('functionCheck');
      assert(!gunField(g, 'cocked'), 'the function check drops the hammer');
      const blocked = step('selector:safe');
      assert(blocked.blocked && gunField(g, 'mode') === 'semi', 'the lever won\'t go to safe with the hammer down');
      step('charge');
      step('selector:safe');
      assert(conditionOf(g) === 4 && gunField(g, 'cocked'), 'charged to cock it, then safe: Condition 4');
      for (const l of lines) console.log(`      ${l}`);
    },
  },
  {
    name: 'every action from every state of the R-7: what the truth and the belief become (a forced pass, so the mechanics show)',
    fn() {
      const actions = Object.keys(ACTIONS).filter(a => !['draw', 'show', 'up'].includes(a));
      let n = 0, refused = 0;
      for (const st of STATES) {
        const cells = [];
        for (const action of actions) {
          const W = armsWorld({ wh: 12 });
          setup(W, st);
          const r = doAction(W.state, W.bus, { pid: W.pid, gunId: W.gunId, action, force: pass([action]) });
          n++;
          if (r.refused) { refused++; cells.push(`${action} ✗`); continue; }
          cells.push(`${action}→${truthWord(W.state.items[W.gunId])} [${short(beliefOf(W.state, W.gunId))}]${r.ejected ? ` ${r.ejected} out` : ''}`);
        }
        console.log(`      ${st}: ${cells.join(' · ')}`);
      }
      console.log(`      ${n} action-states, ${refused} refused (✗: nothing to do it with, the hand knows)`);
      // (the mechanics that matter, held)
      const at = (st, action) => { const W = armsWorld({ wh: 12 }); setup(W, st); const r = doAction(W.state, W.bus, { pid: W.pid, gunId: W.gunId, action, force: pass([action]) }); return { W, g: W.state.items[W.gunId], r, b: beliefOf(W.state, W.gunId) }; };
      let x = at('C3', 'charge'); assert(conditionOf(x.g) === 1 && x.b.chamber === 'live', 'charge on C3 chambers a round');
      x = at('C1 safe', 'charge'); assert(x.r.ejected === 'round' && conditionOf(x.g) === 1, 'charge on C1 throws a live round out and chambers the next');
      x = at('locked, empty magazine', 'release'); assert(!gunField(x.g, 'locked') && !gunField(x.g, 'chamber'), 'release on an empty magazine: home on nothing');
      x = at('C1 safe', 'lockBack'); assert(gunField(x.g, 'locked') && !gunField(x.g, 'chamber') && x.r.ejected === 'round', 'lock back extracts the round');
      x = at('stovepipe', 'charge'); assert(x.r.ejected === 'case' && gunField(x.g, 'chamber') === 'live' && !x.b.stoppage, 'charge clears a stovepipe');
      x = at('double feed', 'charge'); assert(gunField(x.g, 'jam') === 'double' && x.r.text === 'It won\'t go into battery.', 'charge changes nothing on a double but its words');
      x = at('double feed', 'clearDouble'); assert(!gunField(x.g, 'jam') && gunField(x.g, 'chamber') === 'live' && x.r.ejects.includes('round'), 'the double-feed drill clears it, the stripped round to the ground');
      // (cleared by its steps too (the code review's): lock back keeps the double seen, and with the magazine stripped a rack throws the loose round out)
      x = at('double feed', 'lockBack'); assert(gunField(x.g, 'jam') === 'double' && x.b.stoppage === 'double' && x.b.locked, 'lock back on a double: the jam kept, and seen');
      { const W = armsWorld({ wh: 12 }); setup(W, 'double feed'); const st = W.state, g = st.items[W.gunId];
        for (const a of ['lockBack', 'magOut:strip', 'rack']) doAction(st, W.bus, { pid: W.pid, gunId: W.gunId, action: a, force: pass([a]) });
        const b = beliefOf(st, W.gunId);
        assert(!gunField(g, 'jam') && !gunField(g, 'chamber') && !b.stoppage && st.people[W.pid].kit.hands?.some(Boolean), `lock, strip, rack: the double cleared, the magazine in the hand (${JSON.stringify({ g, b })})`); }
      x = at('the coach\'s dud', 'charge'); assert(x.r.ejected === 'dummy' && gunField(x.g, 'chamber') === 'live', 'charge throws the orange dummy out');
      x = at('C1 semi', 'functionCheck'); assert(x.r.fired?.fired && x.r.nd, 'a function check on a loaded rifle fires it');
      x = at('C1 safe', 'selector:auto'); assert(gunField(x.g, 'mode') === 'auto', 'selector auto is in the machine');
    },
  },
  {
    name: 'a pull that doesn\'t fire says why, in WEAPONS §4.4\'s words',
    fn() {
      const cases = [
        ['on safe', (g) => { g.chamber = 'live'; }, 'safety'],
        ['worn past BROKEN', (g) => { g.chamber = 'live'; g.mode = 'semi'; g.cond = 0.2; }, 'broken'],
        ['a double feed', (g) => { g.jam = 'double'; g.chamber = 'case'; g.mode = 'semi'; }, 'jammed'],
        ['a stovepipe', (g) => { g.chamber = 'case'; g.mode = 'semi'; }, 'jammed'],
        ['the bolt locked back', (g) => { g.locked = true; g.mode = 'semi'; }, 'open'],
        ['the hammer down', (g) => { g.cocked = false; g.mode = 'semi'; }, 'dead'],
        ['an empty chamber', (g) => { g.mode = 'semi'; }, 'empty'],
        ['the coach\'s dummy', (g) => { g.chamber = 'live'; g.set = 'dud'; g.mode = 'semi'; }, 'dud'],
      ];
      const rng = stream('arms-test', 2);
      for (const [what, set, why] of cases) {
        const g = { type: 'gun', model: 'r7', cond: 0.93 };
        set(g);
        const r = pull(rng, g, null);
        console.log(`      ${what}: ${r.why} → "${REFUSALS[r.why]}"; felt: ${feel({ chamber: 'live' }, r, { wh: 10 }).stoppage}`);
        assert(!r.fired && r.why === why, `${what}: ${r.why}`);
      }
    },
  },
  {
    name: 'the coach\'s set stoppages: a dud clicks and tap-rack clears it; a stovepipe fires and stops, tap-rack clears it; a double fires and feeds two, tap-rack changes nothing but its words, the drill clears it',
    fn() {
      for (const kind of ['dud', 'stovepipe', 'double']) {
        const W = armsWorld({ wh: 10, sets: { 1: { n: 4, kind } } }), { state, bus, pid, gunId } = W, g = state.items[gunId];
        const lines = [];
        runMacro(state, bus, { macro: 'load', pid, gunId, force: pass(['selector:safe', 'magIn', 'port']) });
        runMacro(state, bus, { macro: 'ready', pid, gunId, force: pass(['selector:safe', 'charge', 'pressCheck', 'port']) });
        doAction(state, bus, { pid, gunId, action: 'selector:semi', force: pass(['selector:semi']) });
        const rng = stream('arms-test', 3, kind);
        const first = pull(rng, g, state.items[g.mag]); g.belief = feel(g.belief, first, { wh: 10 });
        const second = pull(rng, g, state.items[g.mag]); g.belief = feel(g.belief, second, { wh: 10 });
        lines.push(`round 1 ${first.fired ? 'fired' : first.why}; round 2 (the set ${kind}): ${second.fired ? 'fired' : second.why}${second.stoppage ? `, ${second.stoppage}` : ''}; felt: ${beliefOf(state, gunId).stoppage}`);
        if (kind === 'dud') assert(!second.fired && second.why === 'dud' && second.set === 'dud', 'the dummy clicks');
        else assert(second.fired && second.stoppage === (kind === 'stovepipe' ? 'case' : 'double'), `${kind}: fires and stops`);
        const ia = runMacro(state, bus, { macro: 'ia', pid, gunId, force: pass(['tap', 'charge', 'observe']) });
        lines.push(`IA: ${ia.subs.map(s => `${s.action} "${s.text}"`).join(', ')} → ${said(beliefOf(state, gunId))}`);
        if (kind !== 'double') assert(!gunField(g, 'jam') && gunField(g, 'chamber') === 'live' && !beliefOf(state, gunId).stoppage, `${kind}: cleared by tap, rack`);
        else {
          assert(gunField(g, 'jam') === 'double' && ia.subs.find(s => s.action === 'charge').text === 'It won\'t go into battery.' && beliefOf(state, gunId).stoppage === 'double', 'a double: IA changes nothing but its words; the look sees it');
          const rem = runMacro(state, bus, { macro: 'remedial', pid, gunId, force: pass(['clearDouble', 'observe']) });
          lines.push(`REMEDIAL: ${rem.subs.map(s => `${s.action} "${s.text}"`).join(', ')} → ${said(beliefOf(state, gunId))}`);
          assert(!gunField(g, 'jam') && gunField(g, 'chamber') === 'live', 'the drill clears the double');
        }
        console.log(`      ${kind}: ${lines.join('\n        ')}`);
      }
    },
  },
  {
    name: 'truth against belief: a bad inspection believes an empty chamber with a round in it, a missed lock back leaves \'?\', only a look or a check copies the truth, and beliefOf shows nothing else',
    fn() {
      // (a missed lock back: the extractor slipped, the round stays in; then a bad look sees what it expected)
      const W = armsWorld({ wh: 10 }), { state, bus, pid, gunId } = W, g = state.items[gunId];
      setup(W, 'C1 safe');
      doAction(state, bus, { pid, gunId, action: 'magOut:pouch', force: pass(['magOut:pouch']) });
      const lb = doAction(state, bus, { pid, gunId, action: 'lockBack', force: { lockBack: 'miss' } });
      assert(beliefOf(state, gunId).chamber === '?' && gunField(g, 'chamber') === 'live' && lb.halts, `a missed lock back: '?' with a round still in (${lb.text})`);
      const ins = doAction(state, bus, { pid, gunId, action: 'inspect', force: { inspect: 'bad' } });
      assert(beliefOf(state, gunId).chamber === 'empty' && gunField(g, 'chamber') === 'live' && ins.silent && ins.roll.hidden && !ins.halts, `a bad look: believed empty, a round in, silent, the roll hidden (${ins.text})`);
      console.log(`      lock back missed: "${lb.text}"; inspection bad: "${ins.text}" (truth: ${gunField(g, 'chamber')}, belief: ${beliefOf(state, gunId).chamber})`);
      // (the truth changed behind the holder's back: nothing but a look or a check finds it)
      const V = armsWorld({ wh: 10 }), s2 = V.state, g2 = s2.items[V.gunId];
      setup(V, 'C3');
      g2.chamber = 'live'; s2.items[g2.mag].n = 2;
      for (const a of ['selector:semi', 'selector:safe', 'port', 'posture:highReady', 'posture:lowReady', 'tap', 'finger']) {
        doAction(s2, V.bus, { pid: V.pid, gunId: V.gunId, action: a, force: pass([a]) });
        assert(beliefOf(s2, V.gunId).chamber === 'empty' && beliefOf(s2, V.gunId).count === 5, `${a} copies nothing`);
      }
      doAction(s2, V.bus, { pid: V.pid, gunId: V.gunId, action: 'pressCheck', force: pass(['pressCheck']) });
      doAction(s2, V.bus, { pid: V.pid, gunId: V.gunId, action: 'magCheck', force: pass(['magCheck']) });
      const b = beliefOf(s2, V.gunId);
      assert(b.chamber === 'live' && b.count === 2, `a press check and a magazine check copy the truth: ${said(b)}`);
      console.log(`      before the checks: believed empty and 5; after: ${said(b)}`);
      const keys = Object.keys(b).sort().join(',');
      // (0.0.6: the believed kind of the magazine in (magLoad) and the magazine in the hand as believed (hand), the user's ask of 2026-11-07)
      assert(keys === 'chamber,cocked,condWord,count,countApprox,hand,locked,mag,magFam,magLoad,mode,model,port,short,stoppage', `beliefOf's fields: ${keys}`);
      for (const k of ['set', 'jam', 'n', 'cond', 'rounds', 'dust', 'foul', 'lube', 'byId', 'belief']) assert(!(k in b), `no truth field ${k}`);
    },
  },
  {
    name: 'tradecraft\'s fumble ladder, exactly: its own experiment (stream(\'fa\', 3): a Makarov drawn from the belt 400 times at values 1, 7, 21, 31, a chambered Glock holstered 400 times at 1) through act() gives its numbers',
    fn() {
      // tradecraft v0.2.0-rc3 tests/firearms.test.mjs, its third test, run from a scratch script against its own
      // modules (2026-11-06): 1.847, 1.394, 0.923, 0.590 s mean; 119, 13, 17, 27 fumbled; 15, 6, 0, 0 dropped; 12 discharges.
      const WANT = { s: ['1.847', '1.394', '0.923', '0.590'], fumbled: [119, 13, 17, 27], dropped: [15, 6, 0, 0], discharges: 12 };
      const tcPace = (v) => Math.max(0.5, Math.min(1.6, 1.6 - v / 30));
      const MAKAROV = { kind: 'pistol', short: 'Makarov', safety: 'manual', holdOpen: true }, GLOCK = { kind: 'pistol', short: 'Glock', safety: 'none', holdOpen: true };
      const rng = stream('fa', 3), got = { s: [], fumbled: [], dropped: [] };
      for (const v of [1, 7, 21, 31]) {
        const roller = fixedRoller({ weapons: v });
        let ms = 0, fails = 0, drops = 0;
        for (let i = 0; i < 400; i++) {
          const gun = { type: 'gun', model: 'makarov', mode: 'safe', chamber: 'live', cond: 0.95 }, mag = { type: 'mag', n: 8 };
          const r = act(rng, roller, gun, mag, 'draw', { model: MAKAROV, pace: tcPace(v), pressure: 'danger', posture: 'lowReady' });
          ms += r.ms; if (!r.ok) fails++; if (r.mishap) drops++;
        }
        got.s.push(fmt(ms / 400 / 1000, 3)); got.fumbled.push(fails); got.dropped.push(drops);
      }
      const roller = fixedRoller({ weapons: 1 }), gun = { type: 'gun', model: 'glock17', mode: 'semi', chamber: 'live', cond: 0.95 }, mag = { type: 'mag', n: 17 };
      let shots = 0;
      for (let i = 0; i < 400; i++) {
        gun.chamber = 'live'; delete gun.jam; delete gun.cocked;
        const r = act(rng, roller, gun, mag, 'stow', { model: GLOCK, pace: tcPace(1), pressure: 'danger', posture: 'lowReady' });
        if (r.mishap === 'discharge') shots++;
      }
      console.log(`      draws from the belt at 1, 7, 21, 31: ${got.s.join(', ')} s mean; fumbled ${got.fumbled.join(', ')}; dropped ${got.dropped.join(', ')} (tradecraft: ${WANT.s.join(', ')}; ${WANT.fumbled.join(', ')}; ${WANT.dropped.join(', ')})`);
      console.log(`      a chambered Glock holstered 400 times at 1: ${shots} discharges (tradecraft: ${WANT.discharges})`);
      assert(JSON.stringify(got) === JSON.stringify({ s: WANT.s, fumbled: WANT.fumbled, dropped: WANT.dropped }) && shots === WANT.discharges, 'tradecraft\'s numbers, exactly');
    },
  },
  {
    name: 'what the belief offers, in the panel\'s order: slung only up; a stoppage felt puts the look, the tap and the charge first; a \'?\' chamber puts the press check first; never auto',
    fn() {
      const lists = {};
      for (const st of STATES) { const W = armsWorld({ wh: 10 }); setup(W, st); lists[st] = canDo(W.state, W.pid, W.gunId); }
      const S = armsWorld({ wh: 10, posture: 'slungFront' });
      lists.slung = canDo(S.state, S.pid, S.gunId);
      const Q = armsWorld({ wh: 10 }); setup(Q, 'C1 safe'); Q.state.items[Q.gunId].belief.chamber = '?';
      lists['chamber ?'] = canDo(Q.state, Q.pid, Q.gunId);
      for (const [k, v] of Object.entries(lists)) console.log(`      ${k}: ${v.join(', ')}`);
      assert(JSON.stringify(lists.slung) === '["up"]', 'slung: up only');
      assert(lists.stovepipe.slice(0, 3).join() === 'observe,tap,charge' && !lists.stovepipe.includes('clearDouble'), 'a stoppage felt: look, tap, charge first');
      assert(lists['chamber ?'][0] === 'pressCheck', 'a \'?\' chamber: the press check first');
      assert(Object.values(lists).every(l => !l.includes('selector:auto')), 'never auto on the range\'s panel');
      assert(lists['locked, empty magazine'].includes('magOut:dump') && !lists['locked, empty magazine'].includes('release'), 'locked on an empty magazine: no release offered');
    },
  },
];
