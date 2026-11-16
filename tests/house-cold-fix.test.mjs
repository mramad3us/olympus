// OLYMPUS tests: Fix on the shoot house's cold line does what the tower says (the build sheet v0.0.20 item 6; user.md U-3).
//
// The user, 2026-11-15: "the reload, top up etc options should simply look at the state of our weapons"; and of the panel, 2026-11-12,
// "if we can make the controls work cleanly". Off the lane (before GO, after Stop) the core's Fix plans to the current or last
// command's end state (plan.js 'cmd:<id>', COLD_ENDS; shooting.js markFix): never Off safe, never a Charge before MAKE READY, never a
// reload after Stop; at each command its own row or its way, or ✓ "already so" with the gun already there, the reason the tower's
// command ("the tower: LOAD", panel.js remedyWhy). Each case fails without the fix: v0.0.19's cold Fix named the command row with no
// reason and never ✓, and v0.0.18's read Off safe under LOAD and Charge between LOAD and MAKE READY.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseKeysBot, houseHonestBot } from './bots/house.mjs';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { modelOf } from '../src/sim/arms/groups.js';
import { remedyWhy } from '../src/sim/arms/panel.js';
import { planFor, COLD_ENDS } from '../src/sim/arms/plan.js';
import { gunOn } from '../src/sim/arms/shooting.js';
import { houseNow } from '../src/sim/scenarios/shoothouse.js';
import { stepAct } from './bots/lib.mjs';

const RELOAD_RE = /^macro:reload:|^reach|^seat|^magIn/;
// (every stop off the lane of one lane, from the fill to the card: the command, the core's Fix (its row or its stand-in's reason))
function coldLane(tier, seed, bot) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier }), s = g.state, out = [];
  let last = null;
  for (let i = 0; i < 12_000 && !houseNow(s)?.rangeEnd; i++) {
    g.step(1, bot);
    const N = houseNow(s), S = s.stop;
    if (!N || (N.goAtMs !== null && !N.end) || !(S?.mode === 'stop' && S.phase === 'choose') || S.reflex) continue;
    const key = `${s.clock.ms}|${N.cmd}`;
    if (key === last) continue;
    last = key;
    const steps = stepsOf(s), M = modelOf(steps), fix = M.core.fix, row = fix?.row ?? null;
    out.push({ ms: s.clock.ms, cmd: N.cmd, after: N.end ? 'stop' : 'go', fix: row?.id ?? null, off: row?.off ?? null, why: remedyWhy(steps.find(r => r.fix && !r.off)) });
  }
  return { stops: out, end: houseNow(s)?.end?.why ?? null, done: !!houseNow(s)?.rangeEnd };
}
// (F51's three, read off a lane's stops: Off safe anywhere, a Charge before MAKE READY's end, a reload after Stop)
function faults(L) {
  const bad = [];
  let readyDone = false;
  for (const x of L.stops) {
    if (x.cmd === 'standby' || x.cmd === 'go') readyDone = true;
    if (x.fix === 'selector:semi') bad.push(`${x.cmd}: Off safe`);
    if (!readyDone && x.fix === 'charge') bad.push(`${x.cmd}: Charge before MAKE READY`);
    if (x.after === 'stop' && RELOAD_RE.test(x.fix ?? '')) bad.push(`${x.cmd}: ${x.fix} after Stop`);
  }
  return bad;
}
const show = (L) => [...new Set(L.stops.map(x => `${x.cmd}→${x.fix ?? '-'}${x.off ? ` (${x.off})` : ''}${x.why ? ` [${x.why}]` : ''}`))].join(' · ');

export default [
  {
    name: 'the tower\'s goals (plan.js COLD_ENDS): from an empty rifle LOAD plans the reach and the seat, MAKE READY a Charge after them, Stop nothing on safe, UNLOAD, SHOW CLEAR nothing with the magazine out and the chamber empty; with a round up, LOAD has no plan (the instructor\'s, never Fix\'s) and UNLOAD the magazine out and a Charge',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private' }), s = g.state, pid = s.player.id, gid = gunOn(s, pid);
      const plans = (tag) => Object.fromEntries(Object.keys(COLD_ENDS).map(id => { const p = planFor(s, pid, gid, `cmd:${id}`); return [id, p.path ? p.path.join(',') || '✓' : p.none]; }));
      const empty = plans('empty');
      console.log(`      the fill (magazine out, chamber empty, on safe): ${JSON.stringify(empty)}`);
      assert(empty.load === 'reach,seat' && empty.ready === 'reach,seat,charge' && empty.stop === '✓' && empty.clear === '✓', JSON.stringify(empty));
      // (the lane by the keys bot to MAKE READY's end)
      const bot = houseKeysBot();
      for (let i = 0; i < 3000 && houseNow(s).cmd !== 'standby'; i++) g.step(1, bot);
      const up = plans('up');
      console.log(`      at Standby (a round chambered, on safe): ${JSON.stringify(up)}`);
      assert(up.ready === '✓' && up.standby === '✓' && up.load === 'no plan' && /^magOut:(dump|pouch),charge$/.test(up.clear), JSON.stringify(up));
    },
  },
  {
    name: 'Fix on the cold line plans to the tower\'s command (the user, 2026-11-15: "the reload, top up etc options should simply look at the state of our weapons"): the private by the keys on 48213, from LOAD to GO and from Stop to the card, never Off safe, a Charge before MAKE READY or a reload after Stop; at each command its own row, or ✓ "already so" with the rifle already there, the reason "the tower: <command>"',
    timeoutMs: 120_000,
    fn() {
      const L = coldLane('private', 48213, houseKeysBot()), bad = faults(L);
      const named = L.stops.filter(x => x.fix && !x.off), why = named.filter(x => x.why && /^the tower: /.test(x.why)), already = L.stops.filter(x => x.off === 'already so');
      console.log(`      ${L.stops.length} cold stops, the lane ${L.end}: ${show(L)}`);
      console.log(`      Fix named a row at ${named.length}, its reason the tower's at ${why.length}; ✓ "already so" at ${already.length} (${[...new Set(already.map(x => x.cmd))].join(', ')}); faults ${bad.length}`);
      assert(L.done && !bad.length, JSON.stringify(bad));
      assert(named.length > 0 && why.length === named.filter(x => x.cmd !== 'brief').length && already.length > 0, JSON.stringify({ named: named.length, why: why.length, already: already.length }));
    },
  },
  {
    name: 'UNLOAD, SHOW CLEAR is the gun and the show: unloaded by the singles (the magazine out, the round out, the bolt forward), Fix names the command\'s row, "the tower: UNLOAD, SHOW CLEAR", never ✓ "already so" while the tower waits on the show; shown, ✓ (the review of 2026-11-16)',
    timeoutMs: 120_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private' }), s = g.state, bot = houseKeysBot();
      for (let i = 0; i < 20_000 && houseNow(s).cmd !== 'clear'; i++) g.step(1, bot);
      if (s.stop?.mode !== 'stop') { g.step(1, { act: ['ready'] }); g.step(3, {}); }
      const press = (re) => {
        const r = stepsOf(s).find(x => !x.off && re.test(x.id));
        assert(r, `no row ${re}: ${stepsOf(s).filter(x => !x.off).map(x => x.id).join(', ')}`);
        g.step(1, { act: [stepAct(r.id)] });
        for (let i = 0; i < 2000 && s.stop?.phase !== 'choose' && !(re.source.includes('macro') && s.armoury.range.shown); i++) g.step(1, {});
        return r.id;
      };
      const look = () => { const st = stepsOf(s), fx = st.find(r => r.fix && !r.off), none = st.find(r => r.fixNone); return { fix: fx?.id ?? null, why: remedyWhy(fx) ?? null, none: none?.fixNone ?? null, shown: !!s.armoury.range.shown }; };
      const pressed = [press(/^magOut:(dump|pouch)$/), press(/^charge$/)], gun = planFor(s, s.player.id, gunOn(s, s.player.id), 'cmd:clear').path, unloaded = look();
      console.log(`      UNLOAD, SHOW CLEAR, by ${pressed.join(' then ')}: the gun's plan ${JSON.stringify(gun)}; Fix ${unloaded.fix} [${unloaded.why}], ✓ ${unloaded.none ?? 'none'}, shown ${unloaded.shown}`);
      assert(Array.isArray(gun) && !gun.length && !unloaded.shown, JSON.stringify({ gun, unloaded }));
      assert(unloaded.fix === 'macro:clear' && unloaded.why === 'the tower: UNLOAD, SHOW CLEAR' && unloaded.none !== 'already so', JSON.stringify(unloaded));
      press(/^macro:clear$/);
      const shown = look();
      console.log(`      Fix pressed: shown ${shown.shown}, Fix ${shown.fix ?? '-'}, ✓ ${shown.none ?? 'none'}; the tower on ${houseNow(s).cmd}`);
      assert(shown.shown && shown.none === 'already so', JSON.stringify(shown));
    },
  },
  {
    name: 'every sheet on 48213 (heavy: six whole lanes), the keys bot for the boot recruit and the private, the honest bot from the corporal: Fix on the cold line never Off safe, a Charge before MAKE READY or a reload after Stop',
    heavy: true, timeoutMs: 10 * 60_000,
    fn() {
      const rows = [];
      for (const tier of ['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone']) {
        const L = coldLane(tier, 48213, tier === 'recruit' || tier === 'private' ? houseKeysBot() : houseHonestBot()), bad = faults(L);
        rows.push({ tier, n: L.stops.length, bad, end: L.end, done: L.done });
        console.log(`      ${tier}: ${L.stops.length} cold stops, the lane ${L.end}; faults ${bad.length}${bad.length ? `: ${bad.slice(0, 3).join('; ')}` : ''}`);
      }
      assert(rows.every(r => r.done && !r.bad.length), JSON.stringify(rows.filter(r => !r.done || r.bad.length)));
    },
  },
];
