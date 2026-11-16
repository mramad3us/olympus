// OLYMPUS tests: the hunt of v0.0.18, the pistol's findings (pistol-1 to pistol-6, .run/hunt-v018/findings.json), each pinned by a test that fails without its fix.
//
// The user's rule for the shoot house is "never a dead end": the player's options follow the real gun and hand state, the
// instructor's words name a key that works, and the tower's SHOW CLEAR passes only guns that are clear. Each test below reaches
// the hunt's state through the game's own actions (the bots, doAction with a forced grade, adminRun with one) where it can, and
// by the kit's own moves where a fumble would take a seed hunt to reach (a P-12 loaded again after its clear, the magazines at
// the feet), and prints what the gun, the panel, the instructor and the card then say.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse, houseBot, houseHonestBot, houseKeysBot } from './bots/house.mjs';
import { stepAct } from './bots/lib.mjs';
import { doAction, beliefOf, gunField, act, said } from '../src/sim/arms/firearms.js';
import { stepsOf, chooseStep, enterStop } from '../src/sim/arms/shooting.js';
import { move, pouchesOf, handMagOf, pistolOf } from '../src/sim/arms/kit.js';
import { planFor } from '../src/sim/arms/plan.js';
import { pistolDrawn, adminRun, adminSubs, pistolClearOwed, weaponList } from '../src/sim/arms/sidearm.js';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { CQB_RULES } from '../src/sim/skills/instinct/cqb.js';
import { lineReady } from '../src/sim/scenarios/handling.js';
import { pistolLacks } from '../src/sim/scenarios/shoothouse.js';
import { rollerOf } from '../src/sim/combat/roll.js';
import { seedRng } from '../src/core/rng.js';
import { weaponCardModel } from '../src/ui/hud/steps.js';
import { HOUSE_CHIEF } from '../src/data/courses.js';
import { NET_DICE } from './fumble-hooks.mjs';
import { netGame, netHouse } from './bots/fumble.mjs';

const SEED = 1489397426;
const choosing = (s) => s.stop?.mode === 'stop' && s.stop.phase === 'choose' && !s.stop.reflex;
const settle = (g) => { for (let i = 0; i < 800 && g.state.stop?.mode === 'stop' && !choosing(g.state); i++) g.step(1); };
// (the instinct read again after a write made at a pause)
const line = (g) => { delete g.state.$instinct; g.step(1); return instinctNow(g.state).line; };
// (the house at GO in stop motion)
function atGo(tier = 'sgt', seed = SEED) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'go' }), s = g.state;
  if (s.stop?.mode !== 'stop') enterStop(s, g.bus, { pid: s.player.id });
  settle(g);
  const pid = s.player.id;
  return { g, s, pid, rifle: s.people[pid].kit.worn.sling, pistol: pistolOf(s, pid) };
}
// (a bot run until pred(state) or the card)
function until(g, bot, pred, maxTicks = 40_000) {
  for (let t = 0; t < maxTicks && !g.state.armoury.range.end; t++) { if (pred(g.state)) return true; g.step(1, bot); g.clearFacts?.(); }
  return pred(g.state);
}
const truthOf = (s, id) => { const x = s.items[id], m = x?.mag ? s.items[x.mag] : null; return `ch=${x?.chamber ?? '-'}${x?.locked ? ' locked' : ''} mag=${m ? `${m.fam}:${m.n}` : '-'} ${x?.mode ?? 'safe'}`; };
const clearGun = (g) => !!g && !g.mag && !g.chamber && !g.jam;
// (the J's texts on a gun since an entry)
const jOn = (s, gunId, from = 0) => s.log.slice(from).filter(e => e.gun === gunId && typeof e.text === 'string').map(e => e.text);

export default [
  // ---- pistol-1: a negligent discharge is felt ----
  {
    name: 'a negligent discharge of the drawn P-12 is felt as a shot: the count goes down one with the truth, and on the last round the slide is believed locked back on the empty, so Fix is never a Press check refused for ever (the hunt of v0.0.18, pistol-1)',
    fn() {
      const rows = [];
      for (const n of [6, 0]) {
        const { g, s, pid, pistol } = atGo('sgt');
        assert(pistolDrawn(s, pid, pistol), 'the P-12 was not drawn');
        const p = s.items[pistol], m = s.items[p.mag];
        m.n = n; p.belief = { ...p.belief, chamber: 'live', count: n };
        assert(gunField(p, 'mode') === 'semi' && gunField(p, 'chamber') === 'live', truthOf(s, pistol));
        const r = doAction(s, g.bus, { pid, gunId: pistol, action: 'selector:safe', force: { 'selector:safe': 'disaster' } });
        const b = beliefOf(s, pistol), fix = planFor(s, pid, pistol, 'fire', { purpose: null });
        rows.push({ n, mishap: r.mishap, fired: !!r.fired?.fired, truth: truthOf(s, pistol), belief: { chamber: b.chamber, count: b.count, locked: b.locked }, fix: fix.path?.[0] ?? fix.none });
        assert(r.mishap === 'discharge' && r.fired?.fired, JSON.stringify(rows.at(-1)));
        if (n > 0) assert(b.count === m.n && b.chamber === '?', `the count is the truth's after the shot: ${JSON.stringify(rows.at(-1))}`);
        else assert(b.locked && b.chamber === 'empty' && b.count === 0 && gunField(p, 'locked') && fix.path?.[0] !== 'pressCheck', `the last round locks the slide back, believed so: ${JSON.stringify(rows.at(-1))}`);
      }
      for (const r of rows) console.log(`      ${r.n + 1} in it: ${r.truth}, believed chamber ${r.belief.chamber} count ${r.belief.count}${r.belief.locked ? ' locked' : ''}; Fix's first ${r.fix}`);
    },
  },
  {
    name: 'a press check refused on a slide held back teaches the hand it is back (and a look in refused on a closed one, that it is closed): the next plan is never the same refused press (the hunt of v0.0.18, pistol-1)',
    fn() {
      const { g, s, pid, pistol } = atGo('sgt');
      pistolDrawn(s, pid, pistol);
      const p = s.items[pistol];
      // (the truth after a last round fired unseen: the slide back on an empty magazine; the belief as v0.0.18's ND left it)
      s.items[p.mag].n = 0; delete p.chamber; p.locked = true; p.belief = { chamber: '?', count: 0 };
      const before = planFor(s, pid, pistol, 'fire', { purpose: null }).path?.[0] ?? null;
      const r = doAction(s, g.bus, { pid, gunId: pistol, action: 'pressCheck' });
      const after = planFor(s, pid, pistol, 'fire', { purpose: null });
      console.log(`      before: Fix's first ${before}; the press check ${r.refused ? 'refused' : 'done'} "${r.text}"; after: believed locked ${beliefOf(s, pistol).locked}, Fix's first ${after.path?.[0] ?? after.none}`);
      assert(r.refused && beliefOf(s, pistol).locked && after.path?.[0] !== 'pressCheck', JSON.stringify({ before, r: r.text, after: after.path ?? after.none }));
      // (the other way: a look in refused on a slide believed back that is home)
      delete p.locked; p.chamber = 'live'; s.items[p.mag].n = 5; p.belief = { chamber: '?', count: 5, locked: true };
      const r2 = doAction(s, g.bus, { pid, gunId: pistol, action: 'inspect' });
      assert(r2.refused && !beliefOf(s, pistol).locked, JSON.stringify({ text: r2.text, b: beliefOf(s, pistol) }));
    },
  },
  // ---- pistol-4: the slide's words ----
  {
    name: 'the P-12\'s feedback says "slide" where the rifle\'s says "bolt": lock back, release, the look at the port, the refusals and the belief in words, the rifle\'s words kept to the byte (the hunt of v0.0.18, pistol-4)',
    fn() {
      const { g, s, pid, rifle, pistol } = atGo('sgt');
      pistolDrawn(s, pid, pistol);
      const p = s.items[pistol], R = rollerOf(s, pid), out = {};
      const T = (gun, action, force = 'pass') => act(seedRng(7), R, s.items[gun], s.items[s.items[gun].mag] ?? null, action, { force: { [action]: force }, observer: null }).text;
      out.lockBackP = T(pistol, 'lockBack'); out.releaseP = T(pistol, 'release'); out.homeP = T(pistol, 'release'); out.observeP = T(pistol, 'observe');
      out.pressP = (() => { p.locked = true; return T(pistol, 'pressCheck'); })();
      out.saidP = said({ ...beliefOf(s, pistol), locked: true });
      out.lockBackR = T(rifle, 'lockBack'); out.homeR = T(rifle, 'release'); out.homeR2 = T(rifle, 'release');
      // (the weapon card's hover and aria sentence, the gun in the hand's and the other gun's (the review of the pistol fix, 2026-11-16:
      // "P-12: ..., the bolt locked back."), from the game's own beliefs)
      out.cardP = weaponCardModel({ ...beliefOf(s, pistol), locked: true }).words;
      out.otherP = weaponCardModel(beliefOf(s, rifle), { other: { belief: { ...beliefOf(s, pistol), locked: true }, place: 'holster' } }).other.words;
      out.cardR = weaponCardModel({ ...beliefOf(s, rifle), locked: true }).words;
      const reload = CQB_RULES.find(r => r.id === 'cqb-reload');
      console.log(`      P-12: ${Object.entries(out).filter(([k]) => k.endsWith('P')).map(([k, v]) => `${k} "${v}"`).join('; ')}`);
      console.log(`      R-7: ${Object.entries(out).filter(([k]) => k.endsWith('R')).map(([k, v]) => `${k} "${v}"`).join('; ')}`);
      for (const [k, v] of Object.entries(out)) if (k.endsWith('P')) assert(!/bolt/i.test(v), `${k}: "${v}"`);
      assert(out.lockBackR === 'The bolt locked back, the round out.' && out.homeR2 === 'The bolt is already home.' && out.homeP === 'The slide is already home.' && out.lockBackP === 'The slide locked back, the round out.', JSON.stringify(out));
      assert(/, the slide locked back\.$/.test(out.cardP) && /, the slide locked back\.$/.test(out.otherP) && /, the bolt locked back\.$/.test(out.cardR), JSON.stringify({ cardP: out.cardP, otherP: out.otherP, cardR: out.cardR }));
      assert(reload.text.rldP && !reload.text.rldP.some(t => /bolt/i.test(t)) && reload.text.rldP.length === reload.text[1].length, JSON.stringify(reload.text.rldP));
    },
  },
  // ---- pistol-2: SHOW CLEAR covers the holstered P-12 ----
  {
    name: 'a shooter who presses nothing at UNLOAD, SHOW CLEAR has both guns cleared by the coach\'s take: the lane ends with the holstered P-12 empty, never 1 + 9 under "The lane is clear." (the hunt of v0.0.18, pistol-2, route b)',
    fn() {
      const out = [];
      for (const tier of ['recruit', 'sgt']) {
        const g = createGame({ scenario: 'test-shoothouse', seed: 1, tier, setup: 'go' }), s = g.state, pid = s.player.id;
        const bot = tier === 'recruit' ? houseKeysBot() : houseHonestBot();
        assert(until(g, bot, (x) => x.armoury.range.cmd?.id === 'clear'), `${tier}: SHOW CLEAR not reached`);
        const P = pistolOf(s, pid), at = s.clock.ms;
        // (nothing pressed but Wait where stop motion holds the clock)
        runHouse(g, (st) => (choosing(st) && stepsOf(st).some(r => r.id === 'wait' && !r.off) ? { act: [stepAct('wait')] } : {}), { maxMs: 10 * 60_000 });
        const takes = s.log.filter(e => e.atMs >= at && /I will clear it/.test(e.text ?? '')).length;
        out.push({ tier, P12: truthOf(s, P), R7: truthOf(s, s.people[pid].kit.worn.sling), holstered: s.people[pid].kit.worn.holster === P, done: !!s.armoury.range.end, takes });
        assert(out.at(-1).done && clearGun(s.items[P]) && clearGun(s.items[s.people[pid].kit.worn.sling]) && out.at(-1).holstered && takes === 1, JSON.stringify(out.at(-1)));
      }
      for (const o of out) console.log(`      ${o.tier}: at the card the P-12 ${o.P12} (holstered ${o.holstered}), the R-7 ${o.R7}; coach's takes ${o.takes}`);
    },
  },
  {
    name: 'the P-12\'s own clear stops at a lock back that misses, never a release and a safe over the round still in it, and the tower then holds SHOW CLEAR on it, offers "P-12: SHOW CLEAR" and the instructor names it, which clears it (the hunt of v0.0.18, pistol-2, routes a and c)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 1, tier: 'sgt', setup: 'go' }), s = g.state, pid = s.player.id;
      assert(until(g, houseHonestBot(), (x) => x.armoury.range.cmd?.id === 'clear' && choosing(x)), 'SHOW CLEAR not reached in stop motion');
      const P = pistolOf(s, pid), rifle = s.people[pid].kit.worn.sling;
      // (route c: the P-12's clear with its lock back missed: it stops there, its round still in it)
      const j0 = s.log.length, run = adminRun(s, g.bus, pid, 'pistol:clear', { tempo: 'normal' }, { force: { lockBack: 'miss' } });
      const texts = jOn(s, P, j0), b = beliefOf(s, P);
      console.log(`      the P-12's clear with its lock back missed: ok ${run.ok}, J ${JSON.stringify(texts)}; now ${truthOf(s, P)}, believed chamber ${b.chamber}`);
      assert(run.ok === false && !texts.some(t => /goes home|already home|On safe/.test(t)) && gunField(s.items[P], 'chamber') === 'live', JSON.stringify({ texts, truth: truthOf(s, P) }));
      // (route a: the rifle's UNLOAD, SHOW CLEAR shown and done with the P-12 still loaded (here a round its holder believes gone, the
      // one way its part is left out of the macro), so the tower's SHOW CLEAR is the pistol's alone)
      s.items[P].belief = { chamber: 'empty' }; delete s.items[P].locked;
      const r0 = chooseStep(s, g.bus, { step: 'macro:clear' }); settle(g);
      console.log(`      the rifle's clear ${r0.ok ? 'ran' : r0.why}: ${truthOf(s, rifle)}, shown ${!!s.armoury.range.shown}; the P-12 ${truthOf(s, P)}`);
      // (the tower holds, the row is offered, the instructor names it)
      const owed = pistolClearOwed(s, pid), lack = pistolLacks(s, pid, 'clear'), ready = lineReady(s, 'clear', { relay: false });
      g.step(1);
      const rows = stepsOf(s).filter(r => !r.off).map(r => r.id), L = line(g);
      console.log(`      held: SHOW CLEAR ready ${ready}, the P-12 lacks ${lack}, owed ${owed}; the panel ${rows.includes('weapon:pistol-clear') ? 'offers' : 'lacks'} P-12: SHOW CLEAR; the DI "${L?.text}" → ${L?.act}`);
      assert(!ready && lack === 'pistol:loaded' && owed && rows.includes('weapon:pistol-clear') && L?.act === 'stop:weapon:pistol-clear', JSON.stringify({ ready, lack, owed, rows, L }));
      // (pressed: the pistol cleared, the line called clear)
      g.step(1, { act: [{ act: 'instinct', args: { id: L.id, act: L.act } }] });
      settle(g);
      runHouse(g, houseHonestBot(), { maxMs: 10 * 60_000 });
      console.log(`      at the card: the P-12 ${truthOf(s, P)}, the R-7 ${truthOf(s, rifle)}`);
      assert(s.armoury.range.end && clearGun(s.items[P]) && clearGun(s.items[rifle]), JSON.stringify({ P12: truthOf(s, P), R7: truthOf(s, rifle) }));
    },
  },
  {
    name: 'on natural dice no lane of the boot recruit or the private on seed 1 ends with either gun loaded at the card, every setup and the keys and honest bots (the hunt of v0.0.18, pistol-2: 12 of 36 before)',
    // (a sweep of 24 lanes, about 10 s: the quick tests above pin each route's mechanism)
    heavy: true,
    timeoutMs: 180_000,
    fn() {
      const SETUPS = [null, 'go', 'room:2', 'room:3', 'hall', 'contact'], bad = [];
      let n = 0;
      for (const tier of ['recruit', 'private']) for (const setup of SETUPS) for (const [name, mk] of [['keys', houseKeysBot], ['honest', houseHonestBot]]) {
        const g = createGame({ scenario: 'test-shoothouse', seed: 1, tier, setup }), s = g.state, pid = s.player.id;
        const r = runHouse(g, mk(), { maxMs: 30 * 60_000 });
        n++;
        const P = pistolOf(s, pid), rifle = s.people[pid].kit.worn.sling;
        if (!r.done || !clearGun(s.items[P]) || !clearGun(s.items[rifle])) bad.push(`${tier}/${setup ?? 'brief'}/${name}: done ${r.done}, P-12 ${truthOf(s, P)}, R-7 ${truthOf(s, rifle)}`);
      }
      console.log(`      ${n - bad.length} of ${n} lanes end with both guns clear${bad.length ? `; ${bad.join('; ')}` : ''}`);
      assert(!bad.length, bad.join('\n'));
    },
  },
  // ---- pistol-3: the P-12 in hand at SHOW CLEAR ----
  {
    name: 'a sergeant who ends the lane on the P-12 and never presses Rifle up has both guns cleared by the coach\'s take, and Rifle up off the lane is the holster and the up alone, never a round chambered under Stop (the hunt of v0.0.18, pistol-3)',
    timeoutMs: 120_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: SEED, tier: 'sgt', setup: 'go' }), s = g.state, pid = s.player.id, base = houseHonestBot();
      // (to the click and the card's Transition, as the hunt's player)
      const toPistol = (state, me, mem) => {
        const S = state.stop;
        if (S?.reflex && !state.skip && S.reflex.options.some(o => o.key === 'transition' && !o.off)) return { act: [stepAct('reflex:transition')] };
        return base(state, me, mem);
      };
      assert(until(g, toPistol, (x) => choosing(x) && (x.people[pid].kit.hands ?? []).some(id => id && id === pistolOf(x, pid))), 'the P-12 was never drawn');
      // (then never Rifle up: where T or the bot would holster, the panel's lead row, else Carry on, else Wait)
      const noUp = (state, me, mem) => {
        const o = base(state, me, mem), a = o?.act?.[0];
        const isUp = a && ((a.act === 'instinct' && /rifle-up/.test(a.args?.act ?? '')) || (a.act === 'stop' && /rifle-up/.test(a.args?.step ?? '')));
        if (!isUp || state.armoury.range.shown) return o;
        const rows = stepsOf(state).filter(r => !r.off && r.id !== 'weapon:rifle-up'), r = rows.find(x => x.lead) ?? rows.find(x => x.id === 'drill:carry') ?? rows.find(x => x.id === 'wait');
        return r ? { act: [stepAct(r.id, 'normal', r.target ?? null)] } : {};
      };
      assert(until(g, noUp, (x) => x.armoury.range.cmd?.id === 'stop' && choosing(x) && !!(x.people[pid].kit.hands ?? []).find(id => id === pistolOf(x, pid))), 'the Stop with the P-12 in hand was not reached');
      const list = weaponList(s, pid, 'rifle-up'), row = stepsOf(s).find(r => r.id === 'weapon:rifle-up');
      console.log(`      at Stop with the P-12 out: Rifle up "${row?.label}" [${list?.join(', ')}]; the R-7 ${truthOf(s, s.people[pid].kit.worn.sling)}`);
      assert(list && list.join(',') === 'holster,up' && row?.label === 'Rifle up: holster', JSON.stringify({ list, label: row?.label }));
      runHouse(g, noUp, { maxMs: 10 * 60_000 });
      const rifle = s.people[pid].kit.worn.sling, P = pistolOf(s, pid);
      console.log(`      at the card: the R-7 ${truthOf(s, rifle)}, the P-12 ${truthOf(s, P)} (holstered ${s.people[pid].kit.worn.holster === P}); end ${s.armoury.range.house.end?.why}`);
      assert(s.armoury.range.end && clearGun(s.items[rifle]) && clearGun(s.items[P]) && s.people[pid].kit.worn.holster === P, JSON.stringify({ R7: truthOf(s, rifle), P12: truthOf(s, P) }));
    },
  },
  // ---- pistol-5: Top up with a rifle magazine in the other hand ----
  {
    name: 'with the P-12 drawn and a HAD-30 in the other hand, Top up is live, puts the rifle\'s magazine away in a pouch first and seats a HAD-17, never struck "no plan" (the hunt of v0.0.18, pistol-5)',
    fn() {
      const { g, s, pid, rifle, pistol } = atGo('sgt');
      // (the rifle's magazine reached for into the support hand, then the P-12 drawn into the other)
      const r = chooseStep(s, g.bus, { step: 'reach@p1' }); settle(g);
      assert(r.ok && handMagOf(s, pid), `the reach: ${JSON.stringify(r)}`);
      const held = handMagOf(s, pid).id;
      assert(s.items[held].fam === 'had30' && pistolDrawn(s, pid, pistol), 'not a HAD-30 held with the P-12 drawn');
      s.stop.gun = pistol;
      g.step(1);
      const top = stepsOf(s).find(x => x.id === 'macro:reload:tactical');
      console.log(`      hands ${s.people[pid].kit.hands.map(id => id ? (s.items[id].type === 'gun' ? s.items[id].model : s.items[id].fam) : '-').join(',')}: Top up ${top?.off ? `struck "${top.off}"` : `live [${top?.subs?.map(x => x.id).join(', ')}]`}`);
      assert(top && !top.off && top.subs.some(x => /^(stowMag|dumpMag)/.test(x.id)) && top.subs.some(x => x.id === 'seat'), JSON.stringify(top));
      const was = s.items[pistol].mag;
      const c = chooseStep(s, g.bus, { step: 'macro:reload:tactical' }); settle(g);
      const now = s.items[pistol].mag, pouch = pouchesOf(s, pid).find(p => p.mags.includes(held));
      console.log(`      run: ${c.ok ? 'ok' : c.why}; the P-12's magazine ${was} → ${now} (${s.items[now]?.fam}); the HAD-30 back in ${pouch?.key ?? 'none'}; the hand ${handMagOf(s, pid)?.id ?? 'empty'}`);
      assert(c.ok && now && now !== was && s.items[now].fam === 'had17' && pouch && !handMagOf(s, pid), JSON.stringify({ was, now, pouch: pouch?.key }));
      void rifle;
    },
  },
  // ---- pistol-6: the magazines at the feet at LOAD ----
  {
    name: 'at LOAD with every rifle magazine at the feet the instructor names the pick-up and the keys and honest bots load from the floor: GO comes with the R-7 in Condition 1 and the P-12 chambered (the hunt of v0.0.18, pistol-6)',
    timeoutMs: 120_000,
    fn() {
      const out = [];
      for (const [name, mk] of [['keys', houseKeysBot], ['honest', houseHonestBot]]) {
        const g = createGame({ scenario: 'test-shoothouse', seed: 1, tier: 'recruit', setup: null }), s = g.state, pid = s.player.id, bot = mk();
        assert(until(g, bot, (x) => x.armoury.range.cmd?.id === 'load'), 'LOAD not reached');
        // (every HAD-30 out of the pouches to the feet, as fumbled seats leave them)
        const me = s.actors.list.find(a => a.who === pid), rifle = s.people[pid].kit.worn.sling;
        const mags = pouchesOf(s, pid).flatMap(p => p.mags).filter(id => s.items[id].fam === 'had30');
        mags.forEach((id, i) => move(s, id, { ground: { area: s.actors.area, x: me.x + 0.25, z: me.z + 0.1 + 0.05 * i } }));
        g.step(1);
        let named = null;
        assert(until(g, (st, m, mem) => { if (!named && choosing(st)) { const L = instinctNow(st).line; if (L?.variant === 'floor') named = `${L.text} → ${L.act}`; } return bot(st, m, mem); }, (x) => x.armoury.range.house.goAtMs !== null && x.armoury.range.house.goAtMs !== undefined && x.clock.ms >= x.armoury.range.house.goAtMs), 'GO not reached');
        const P = pistolOf(s, pid);
        out.push({ name, R7: truthOf(s, rifle), P12: truthOf(s, P), named });
        assert(s.items[rifle].mag && gunField(s.items[rifle], 'chamber') === 'live' && gunField(s.items[P], 'chamber') === 'live', JSON.stringify(out.at(-1)));
      }
      for (const o of out) console.log(`      ${o.name}: at GO the R-7 ${o.R7}, the P-12 ${o.P12}; the instructor at LOAD: ${o.named ?? '(not heard in the mode)'}`);
      assert(out.some(o => o.named), 'the instructor never named the pick-up');
    },
  },
  {
    name: 'a shooter who waits through MAKE READY with every rifle magazine at the feet still goes to GO with the P-12 racked by the instructor\'s move-on, whatever the rifle lacks, and he says so (the hunt of v0.0.18, pistol-6; the review of its fix, 2026-11-16)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 1, tier: 'recruit', setup: null }), s = g.state, pid = s.player.id, bot = houseHonestBot();
      assert(until(g, bot, (x) => x.armoury.range.cmd?.id === 'load'), 'LOAD not reached');
      const me = s.actors.list.find(a => a.who === pid), rifle = s.people[pid].kit.worn.sling, P = pistolOf(s, pid);
      pouchesOf(s, pid).flatMap(p => p.mags).filter(id => s.items[id].fam === 'had30').forEach((id, i) => move(s, id, { ground: { area: s.actors.area, x: me.x + 0.25, z: me.z + 0.1 + 0.05 * i } }));
      // (Wait alone, at every pause, through LOAD's and MAKE READY's move-ons to GO)
      const H = s.armoury.range.house, from = s.log.length;
      for (let t = 0; t < 20_000 && !(H.goAtMs != null && s.clock.ms >= H.goAtMs); t++) g.step(1, choosing(s) && stepsOf(s).some(x => x.id === 'wait' && !x.off) ? { act: [stepAct('wait')] } : {});
      const racked = s.log.slice(from).filter(e => e.kind === 'say' && HOUSE_CHIEF.pistolRacked.includes(e.text)).map(e => e.text);
      console.log(`      at GO: the R-7 ${truthOf(s, rifle)}, the P-12 ${truthOf(s, P)}; the instructor: ${racked.join(' / ') || '(nothing)'}`);
      assert(H.goAtMs != null && s.clock.ms >= H.goAtMs, 'GO not reached');
      assert(gunField(s.items[P], 'chamber') === 'live' && gunField(s.items[P], 'mode') === 'safe' && s.people[pid].kit.worn.holster === P && racked.length === 1, JSON.stringify({ P12: truthOf(s, P), racked }));
    },
  },
  // ---- the review of the fix: your #2's P-12 (~two:p12) at SHOW CLEAR ----
  {
    name: 'your #2\'s P-12 (~two:p12) is never holstered loaded under "Number two: clear.": a lock back of his that misses is cleared again, and once his tries are spent the instructor clears it himself and says so (the review of the pistol fix, 2026-11-16: 1 + 0, the slide locked open, in his holster under "The lane is clear.")',
    timeoutMs: 120_000,
    fn() {
      const rows = [];
      // (his rolls in the clear forced to a miss through the fumble net's copy of the game (fumble-hooks.mjs): the first only, then all)
      for (const all of [false, true]) {
        const g = netGame.createGame({ scenario: 'test-shoothouse', seed: SEED, tier: 'sgt', setup: 'go', loadout: 'standard~two:p12' }), s = g.state, W = s.armoury.range.house.two, me = s.player.id;
        const key = Symbol.for(NET_DICE), prev = globalThis[key];
        let armed = false, hit = 0;
        globalThis[key] = (r, o) => {
          if (!armed || o?.skill !== 'weapons' || !o.procedure || !r || o.by == null || o.by === me) return r;
          if (s.items[W.pistol].mag || (!all && hit)) return r;
          hit++;
          return { ...r, grade: 'miss', ok: false, routine: false, forced: true, margin: Math.min(r.margin, -1) };
        };
        try {
          const bot = netHouse.houseHonestBot();
          for (let t = 0; t < 200_000 && !s.armoury.range.end; t++) { if (!armed && s.armoury.range.cmd?.id === 'clear') armed = true; g.step(1, bot); }
          for (let t = 0; t < 40_000 && !['end', 'wash'].includes(s.armoury.range.cmd?.id); t++) g.step(1, bot);
        } finally { globalThis[key] = prev; }
        const x = s.items[W.pistol], says = s.log.filter(e => e.kind === 'say' && (HOUSE_CHIEF.twoClear.includes(e.text) || HOUSE_CHIEF.twoTaken.includes(e.text))).map(e => e.text);
        rows.push({ all, hit, card: !!s.armoury.range.end, P12: truthOf(s, W.pistol), holstered: s.people[W.pid].kit.worn.holster === W.pistol, says });
        assert(hit >= 1 && rows.at(-1).card && clearGun(x) && !x.locked && rows.at(-1).holstered && says.some(t => HOUSE_CHIEF.twoClear.includes(t)), JSON.stringify(rows.at(-1)));
        assert(all ? says.some(t => HOUSE_CHIEF.twoTaken.includes(t)) : !says.some(t => HOUSE_CHIEF.twoTaken.includes(t)), JSON.stringify(rows.at(-1)));
      }
      for (const r of rows) console.log(`      ${r.all ? 'every roll of his P-12 clear missed' : 'his first lock back missed'} (${r.hit} forced): his P-12 ${r.P12}, holstered ${r.holstered}; the instructor: ${r.says.join(' / ')}`);
    },
  },
  {
    name: 'the P-12\'s part of SHOW CLEAR runs with the rifle hanging on its sling (the pistol is in the hand for it): "P-12: SHOW CLEAR" pressed then clears it, never every part refused "P-12 is slung." with the round still in, and the rifle is left hanging as it was (the review of the pistol fix, 2026-11-16: your #2 after his R-7 swung onto its sling)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 1, tier: 'sgt', setup: 'go' }), s = g.state, pid = s.player.id;
      assert(until(g, houseHonestBot(), (x) => x.armoury.range.cmd?.id === 'clear' && choosing(x)), 'SHOW CLEAR not reached in stop motion');
      const P = pistolOf(s, pid), rifle = s.people[pid].kit.worn.sling;
      // (the P-12 left out of the macro, its round believed gone (as in the routes test above), then the rifle let go onto its sling)
      const p = s.items[P];
      if (p.mag) move(s, p.mag, { container: s.people[pid].kit.worn.thigh });
      p.belief = { chamber: 'empty' }; delete p.locked;
      const r0 = chooseStep(s, g.bus, { step: 'macro:clear' }); settle(g);
      s.people[pid].kit.carry.posture = 'slungFront';
      const rows = stepsOf(s).filter(r => !r.off).map(r => r.id), j0 = s.log.length;
      assert(rows.includes('weapon:pistol-clear'), JSON.stringify({ rows, P12: truthOf(s, P), choosing: choosing(s), cmd: s.armoury.range.cmd?.id }));
      const c = chooseStep(s, g.bus, { step: 'weapon:pistol-clear' }); settle(g);
      const texts = jOn(s, P, j0), posture = s.people[pid].kit.carry.posture;
      console.log(`      the rifle's clear ${r0.ok ? 'ran' : r0.why}; P-12: SHOW CLEAR with the R-7 slung ${c.ok ? 'ran' : c.why}: J ${JSON.stringify(texts)}; the P-12 ${truthOf(s, P)}, the rifle's carry ${posture}`);
      assert(clearGun(s.items[P]) && !s.items[P].locked && !texts.some(t => /slung/.test(t)) && posture === 'slungFront', JSON.stringify({ texts, P12: truthOf(s, P), posture }));
      // (your #2's, through the same part on his stream)
      const W = (() => { const h = createGame({ scenario: 'test-shoothouse', seed: 1, tier: 'sgt', setup: 'go', loadout: 'standard~two:p12' }); return { h, W: h.state.armoury.range.house.two }; })();
      const s2 = W.h.state, two = W.W, k2 = s2.people[two.pid].kit;
      k2.carry.posture = 'slungFront';
      const x = adminRun(s2, W.h.bus, two.pid, 'pistol:clear', { tempo: 'normal' }, { rng: 'house-two', log: false });
      console.log(`      your #2's P-12 clear with his R-7 slung: ok ${x.ok}, "${x.text}"; his P-12 ${truthOf(s2, two.pistol)}, his rifle's carry ${k2.carry.posture}`);
      assert(clearGun(s2.items[two.pistol]) && !s2.items[two.pistol].locked && k2.carry.posture === 'slungFront', JSON.stringify({ x, P12: truthOf(s2, two.pistol) }));
    },
  },
  {
    name: 'your #2 whose R-7 clear spends its tries still clears his own P-12 (~two:p12), the instructor taking nothing, on natural dice (the review of the pistol fix, 2026-11-16: the boot recruit at GO on seed 6, his R-7\'s charge fumbled three times, the macro\'s end left his P-12 1 + 9 in the holster)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 6, tier: 'recruit', setup: 'go', loadout: 'standard~two:p12' }), s = g.state, W = s.armoury.range.house.two;
      const r = runHouse(g, houseHonestBot(), { maxMs: 30 * 60_000 });
      const says = s.log.filter(e => e.kind === 'say' && (HOUSE_CHIEF.twoClear.includes(e.text) || HOUSE_CHIEF.twoTaken.includes(e.text))).map(e => e.text);
      const out = { done: r.done, gaveUp: Object.keys(W.gaveUp ?? {}), P12: truthOf(s, W.pistol), R7: truthOf(s, s.people[W.pid].kit.worn.sling), says };
      console.log(`      his tries spent on ${out.gaveUp.join(', ') || '(none)'}; at the card his P-12 ${out.P12}, his R-7 ${out.R7}; the instructor: ${says.join(' / ')}`);
      assert(r.done && out.gaveUp.includes('clear') && clearGun(s.items[W.pistol]) && !says.some(t => HOUSE_CHIEF.twoTaken.includes(t)) && says.some(t => HOUSE_CHIEF.twoClear.includes(t)), JSON.stringify(out));
    },
  },
  {
    name: 'on natural dice no lane with your #2 carrying a P-12 (~two:p12) ends with his P-12 loaded, every sheet, the brief and GO, seeds 1 to 3 (the review of the pistol fix, 2026-11-16: the boot recruit\'s brief on seed 3 ended with his P-12 1 + 0 under "The lane is clear.")',
    heavy: true,
    timeoutMs: 180_000,
    fn() {
      let n = 0;
      const bad = [];
      for (const seed of [1, 2, 3]) for (const tier of ['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone']) for (const setup of [null, 'go']) {
        const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup, loadout: 'standard~two:p12' }), s = g.state, W = s.armoury.range.house.two;
        const r = runHouse(g, (tier === 'recruit' || tier === 'private') ? houseKeysBot() : houseHonestBot(), { maxMs: 30 * 60_000 });
        n++;
        const P = pistolOf(s, s.player.id), R = s.people[s.player.id].kit.worn.sling, R2 = s.people[W.pid].kit.worn.sling;
        const loaded = [W.pistol, P, R, R2].filter(id => id && !clearGun(s.items[id]));
        if (!r.done || loaded.length || s.items[W.pistol].locked) bad.push(`${tier}/${setup ?? 'brief'}/${seed}: done ${r.done}, his P-12 ${truthOf(s, W.pistol)}, his rifle ${truthOf(s, R2)}, your P-12 ${truthOf(s, P)}, your R-7 ${truthOf(s, R)}`);
      }
      console.log(`      ${n - bad.length} of ${n} lanes to the card with every gun clear${bad.length ? `; not: ${bad.join('; ')}` : ''}`);
      assert(!bad.length, bad.join('\n'));
    },
  },
];
