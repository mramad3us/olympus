// The DI's rules on test-pairs' bay (src/sim/skills/instinct/pairs.js; SKILLS §14; COMBAT §25.8.3; the build sheet 0.0.8 §2.3, §5.3; 0.0.9 §2.2, §5.2): each rule fires in its scripted state with its act, by the drills' rung at the pause; nothing fires while a take-in's window is open, nor while the marine is startled ("Three bangs"); the line's lead at the pause is "Contact · 0.55 s."; T is never the shot.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { pairsBot } from './bots/pairs.mjs';
import { stepAct } from './bots/lib.mjs';
import { pairsNow } from '../src/sim/scenarios/pairs.js';
import { RULES, firedNow, instinctNow } from '../src/sim/skills/instinct.js';
import { PAIRS_RULES } from '../src/sim/skills/instinct/pairs.js';
import { contactNow } from '../src/sim/combat/contact.js';
import { contactOf, noteContact } from '../src/sim/people/mind.js';
import { gunOn } from '../src/sim/arms/shooting.js';
import { startled, feltOf, bandOf, hearingOf, blockOf } from '../src/sim/combat/supp.js';
import { bangDue } from '../src/sim/scenarios/pairs.js';
import { instinctStep } from '../src/sim/skills/instinct.js';

const ids = (state) => firedNow(state, state.clock.ms, RULES).map(l => l.id);
const rule = (state, id) => firedNow(state, state.clock.ms, RULES).find(l => l.id === id) ?? null;
const SHOT = /^stop:(shot:|fire)/;
// (a game stepped by the pairs bot, or by nothing, until pred holds: the ticks taken)
function until(g, pred, bot = null, max = 20 * 60 * 5) {
  for (let n = 0; n < max; n++) { if (pred(g.state)) return n; g.step(1, bot ?? {}); }
  throw new Error('never reached');
}
const paused = (s) => !!contactNow(s)?.last && s.stop?.mode === 'stop' && s.stop.phase === 'choose' && !contactNow(s)?.pending;
const acts = [];
const seeAct = (l) => { if (l?.act) acts.push(`${l.id}: ${l.act}`); return l; };

export default [
  {
    name: 'out of the mode with the turn armed, pairs-wait (calm, no act); nothing at all fires while the window is open (COMBAT §25.4.5: no words in the take-in); at the pause the lead is "Contact · 0.55 s." (until a step is chosen: then "Time stands still.") and the private\'s T takes the safe off first (rung 1), then aims',
    fn() {
      const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'private', setup: 'standby' }), s = g.state;
      g.step(2);
      const w = seeAct(rule(s, 'pairs-wait'));
      console.log(`      standing by: ${ids(s).join(', ')}; pairs-wait "${w?.rule.text[1][0]}" act ${w?.act}`);
      assert(w && w.tone === 'calm' && w.act === null, JSON.stringify(ids(s)));
      until(g, (st) => !!contactNow(st)?.pending);
      const inWindow = [];
      for (let n = 0; n < 40 && contactNow(s)?.pending; n++) { inWindow.push(...ids(s)); g.step(1); }
      console.log(`      in the window: ${inWindow.length ? inWindow.join(', ') : 'nothing'}; the line ${JSON.stringify(instinctNow(s).line)}`);
      assert(!inWindow.length, inWindow.join(', '));
      until(g, paused);
      g.step(1);
      const c = seeAct(rule(s, 'pairs-contact')), lead = instinctNow(s).lead;
      console.log(`      at the pause: ${ids(s).join(', ')}; the lead "${lead}"; pairs-contact (${c?.tone}) act ${c?.act}`);
      assert(c && c.tone === 'urgent' && c.act === 'stop:selector:semi' && /^Contact · \d\.\d\d s\.$/.test(lead ?? ''), JSON.stringify({ c: c && { act: c.act, tone: c.tone }, lead }));
      g.step(1, { act: [{ act: 'instinct', args: { id: c.id, act: c.act } }] });
      until(g, (st) => st.stop?.phase === 'choose');
      g.step(1);
      const c2 = seeAct(rule(s, 'pairs-contact'));
      console.log(`      off safe, then: pairs-contact act ${c2?.act}; the lead ${JSON.stringify(instinctNow(s).lead)}`);
      assert(c2?.act === `stop:aim>${s.stop.pick}` && instinctNow(s).lead === 'Time stands still.', JSON.stringify({ act: c2?.act, lead: instinctNow(s).lead }));
    },
  },
  {
    name: 'the tier one\'s T at the pause aims at once (rung 4: the row\'s aim takes the safe off), never the shot',
    fn() {
      const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'tierone', setup: 'standby' }), s = g.state;
      until(g, paused);
      g.step(1);
      const c = seeAct(rule(s, 'pairs-contact'));
      console.log(`      the tier one at the pause: ${ids(s).join(', ')}; act ${c?.act}`);
      assert(c?.act === `stop:aim>${s.stop.pick}`, JSON.stringify(c?.act));
    },
  },
  {
    name: 'string 2\'s no-shoot bracketed: pairs-noshoot ("Hands. No weapon. Don\'t.", Hold him); not identified (\'unseen\'): pairs-unknown (Challenge)',
    fn() {
      const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'private', setup: 'standby:2' }), s = g.state;
      until(g, paused);
      const R = s.armoury.range, ns = R.str.keys.find(k => R.turners.find(t => t.key === k).face === 'noshoot');
      g.step(1, { act: [stepAct(`pick=${ns}`, 'normal', null)] });
      g.step(1);
      const n = seeAct(rule(s, 'pairs-noshoot'));
      console.log(`      the no-shoot ${ns} bracketed, identified "${contactNow(s).last.ident?.[ns]}": ${ids(s).join(', ')}; pairs-noshoot (${n?.tone}) act ${n?.act}`);
      assert(n && n.tone === 'warn' && !ids(s).includes('pairs-contact'), JSON.stringify(ids(s)));
      // (what the marine could not tell: the hands unseen)
      const last = contactOf(s).last;
      noteContact(s, { last: { ...last, ident: { ...last.ident, [ns]: 'unseen' } } });
      g.step(1);
      const u = seeAct(rule(s, 'pairs-unknown'));
      console.log(`      the same, its hands unseen: ${ids(s).join(', ')}; pairs-unknown act ${u?.act}`);
      assert(u && u.tone === 'warn' && !ids(s).includes('pairs-noshoot'), JSON.stringify(ids(s)));
    },
  },
  {
    name: 'the armoured silhouette hit in the torso and still up: pairs-still-up (urgent, "He\'s still up. Head."), its act never the shot',
    fn() {
      const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'raider', setup: 'standby:3' }), s = g.state, bot = pairsBot();
      until(g, paused);
      // (the bot's first row: the pair on the plate)
      until(g, (st) => { const T = st.armoury.range.turners.find(t => t.key === st.stop?.pick); return !!T?.hits.length && st.stop?.phase === 'choose'; }, bot);
      g.step(1);
      const u = seeAct(rule(s, 'pairs-still-up')), T = s.armoury.range.turners.find(t => t.key === s.stop.pick);
      console.log(`      after ${T.hits.length} rounds on the plate (${T.hits.map(h => `${h.part} ${h.zone}${h.ring ? ' rang' : ''}`).join(', ')}), down ${T.stoppedAtMs !== null}: ${ids(s).join(', ')}; pairs-still-up act ${u?.act}`);
      assert(T.stoppedAtMs !== null || (u && u.tone === 'urgent' && !SHOT.test(u.act ?? '')), JSON.stringify(ids(s)));
    },
  },
  {
    name: 'the rules between strings: pairs-cmd (the coach\'s LOAD, MAKE READY, UNLOAD, SHOW CLEAR), pairs-reset (the string done, in the mode), pairs-ready (the coach\'s Stop, off safe), pairs-topup (a lull, half or less, a fuller one at hand), pairs-short (the short one named), pairs-reload (locked on an empty with rounds left)',
    fn() {
      const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'private' }), s = g.state, bot = pairsBot();
      const seen = {};
      const look = () => { for (const l of firedNow(s, s.clock.ms, RULES)) if (l.id.startsWith('pairs-') && !seen[l.id]) { seen[l.id] = { tone: l.tone, act: l.act, cmd: pairsNow(s).cmd }; seeAct(l); } };
      for (let n = 0; n < 20 * 60 * 10 && !pairsNow(s).end; n++) { g.step(1, bot); look(); }
      // (the bolt locked on an empty with rounds left, as string 4 leaves it)
      const h = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'private', setup: 'standby:4' }), hs = h.state;
      until(h, paused);
      const gun = hs.items[gunOn(hs, hs.player.id)], mag = hs.items[gun.mag];
      mag.n = 0; delete gun.chamber; gun.locked = true; gun.belief = { chamber: 'empty', count: 0, locked: true, load: 'ball' };
      h.step(1);
      const r = seeAct(rule(hs, 'pairs-reload'));
      if (r) seen['pairs-reload'] = { tone: r.tone, act: r.act, cmd: 'standby' };
      // (a lull with three left in the magazine and fuller ones in the pouches: string 0 over, the coach's Stop given)
      const l = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'private', setup: 'standby' }), ls = l.state, LR = ls.armoury.range;
      const lg = ls.items[gunOn(ls, ls.player.id)];
      ls.items[lg.mag].n = 3; lg.belief = { ...lg.belief, count: 3 };
      LR.str.done = 'stopped'; LR.str.turnAtMs = null; LR.cmd = { id: 'stop', i: LR.cmd.i + 1, atMs: ls.clock.ms };
      let t = null;
      for (let n = 0; n < 100 && !t; n++) { l.step(1); t = rule(ls, 'pairs-topup'); }
      if (t) { seen['pairs-topup'] = { tone: t.tone, act: t.act, cmd: 'stop' }; seeAct(t); }
      for (const [id, v] of Object.entries(seen)) console.log(`      ${id} (${v.tone}) at '${v.cmd}': act ${v.act}`);
      for (const id of ['pairs-cmd', 'pairs-reset', 'pairs-ready', 'pairs-topup', 'pairs-reload']) assert(seen[id], `${id} never fired: ${Object.keys(seen).join(', ')}`);
      assert(seen['pairs-reload'].act === 'stop:macro:reload:speed' || seen['pairs-reload'].act === 'stop:macro:reload:retain', JSON.stringify(seen['pairs-reload']));
    },
  },
  {
    name: '"Three bangs" (0.0.9): nothing fires while the boot recruit is startled; at its end pairs-froze ("You flinched. Everybody does. Your lane.", no act) until a step, a pause or 3 s; at the pause, pinned, on safe, below rung 2: pairs-shaking is the line and pairs-contact\'s own Off safe stands down ("Thumb it off.", T Off safe; the chip never says it twice), "Again. Thumb it off." after a failed one, "Rifle up. Then thumb it off." (T the rifle up) slung; never the shot',
    fn() {
      const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'recruit', setup: 'bangs:standby' }), s = g.state, pid = s.player.id;
      let ticks = 0, said = 0, gaps = 0;
      until(g, (st) => startled(st, pid));
      // (the three bangs' freezes, joined: pairs-froze waits for the series' end (bangDue), said once)
      for (; ticks < 400 && (startled(s, pid) || bangDue(s)); ticks++) { said += ids(s).length; if (!startled(s, pid)) gaps++; g.step(1); }
      g.step(1);
      const f = seeAct(rule(s, 'pairs-froze'));
      console.log(`      startled or a bang still due ${ticks} ticks (${gaps} free between): ${said} rules fired in it; after it: ${ids(s).join(', ')}; pairs-froze (${f?.tone}, ${f?.ctx?.variant}) "${f?.rule.text[f?.ctx?.variant]?.[0]}" act ${f?.act}`);
      assert(ticks >= 2 && said === 0 && f && f.tone === 'warn' && f.ctx.variant === 'first' && f.act === null, JSON.stringify({ ticks, said, f: f && { tone: f.tone, v: f.ctx.variant } }));
      until(g, paused);
      g.step(1);
      const felt = feltOf(s, pid), sh = seeAct(rule(s, 'pairs-shaking')), line = instinctNow(s).line;
      console.log(`      at the pause (felt ${felt}, ${bandOf(felt)}): ${ids(s).join(', ')}; the line ${line?.id} "${line?.text}"; act ${sh?.act}`);
      assert(sh && sh.tone === 'urgent' && sh.act === 'stop:selector:semi' && line?.id === 'pairs-shaking' && !ids(s).includes('pairs-contact') && !ids(s).includes('pairs-froze') && instinctNow(s).chip?.act !== sh.act, JSON.stringify({ ids: ids(s), line, chip: instinctNow(s).chip }));
      // (a failed Off safe since this pause, the lever still on safe as believed: "Again.")
      const R = s.armoury.range;
      R.bangs.offSafe = { atMs: s.clock.ms, ok: false };
      g.step(1);
      const again = seeAct(rule(s, 'pairs-shaking'));
      s.people[pid].kit.carry.posture = 'slungFront';
      g.step(1);
      const up = seeAct(rule(s, 'pairs-shaking'));
      console.log(`      after a failed Off safe: "${again?.ctx?.variant}" act ${again?.act}; slung: "${up?.ctx?.variant}" act ${up?.act}`);
      assert(again?.ctx?.variant === 'again' && again.act === 'stop:selector:semi' && up?.ctx?.variant === 'up' && up.act === 'stop:up', JSON.stringify({ again: again?.ctx, up: up?.ctx }));
    },
  },
  {
    name: '"Three bangs" (0.0.9): T\'s Off safe is offered only below rung 2 at the pause: the private pinned gets pairs-shaking, the sergeant suppressed (rung 3: the row\'s aim takes the safe off) and the tier one at felt 10 never do, and their T is the aim',
    fn() {
      const out = [];
      for (const tier of ['private', 'sgt', 'tierone']) {
        const g = createGame({ scenario: 'test-pairs', seed: 48213, tier, setup: 'bangs:standby' }), s = g.state;
        until(g, paused);
        g.step(1);
        const sh = seeAct(rule(s, 'pairs-shaking')), c = seeAct(rule(s, 'pairs-contact')), f = feltOf(s, s.player.id);
        out.push({ tier, felt: f, band: bandOf(f), shaking: sh?.act ?? null, contact: c?.act ?? null });
      }
      for (const o of out) console.log(`      ${o.tier} at the pause, felt ${o.felt} (${o.band}): pairs-shaking ${o.shaking ?? 'silent'}, pairs-contact ${o.contact ?? 'silent'}`);
      assert(out[0].shaking === 'stop:selector:semi' && out[0].contact === null && out[1].shaking === null && out[2].shaking === null && /^stop:aim>/.test(out[1].contact ?? '') && /^stop:aim>/.test(out[2].contact ?? ''), JSON.stringify(out));
    },
  },
  {
    name: '"Three bangs" (0.0.9): deafened, in the first standby after the bangs with its turn armed, pairs-deaf ("Ears ringing. Watch your lane.", a note, no act); not in the banged standby itself nor in the ones after',
    fn() {
      const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'private', setup: 'bangs' }), s = g.state, bot = pairsBot(), by = {};
      for (let n = 0; n < 20 * 60 * 5 && !pairsNow(s).end && (s.armoury.range.str?.k ?? 0) <= 2; n++) {
        g.step(1, bot);
        const d = rule(s, 'pairs-deaf'), k = s.armoury.range.str?.k;
        if (d) { seeAct(d); by[k] = (by[k] ?? 0) + 1; }
      }
      const deaf = hearingOf(s, s.player.id);
      console.log(`      deaf until +${Math.round((deaf.untilMs - s.clock.ms) / 60000)} min; pairs-deaf fired on string ${JSON.stringify(by)} (ticks); its words "${PAIRS_RULES.find(r => r.id === 'pairs-deaf').text[1][0]}"`);
      assert(deaf.deaf && by[1] > 0 && !by[0] && !by[2], JSON.stringify(by));
    },
  },
  {
    name: 'every pairs rule has at least four phrasings for each of its cases, and no act any rule offered here is the shot (v0.0.5: "T aims and goes off safe but never takes the shot")',
    fn() {
      for (const r of PAIRS_RULES) {
        const cases = Object.entries(r.text).filter(([k, v]) => k !== '1' || Object.keys(r.text).length === 1);
        console.log(`      ${r.id} (${typeof r.tone === 'string' ? r.tone : 'by case'}): ${cases.map(([k, v]) => `${k} ${v.length}`).join(', ')}`);
        assert(cases.every(([, v]) => v.length >= 4), `${r.id}: fewer than four phrasings`);
      }
      console.log(`      acts offered across the scripted states: ${[...new Set(acts)].join('; ')}`);
      assert(acts.length && !acts.some(a => SHOT.test(a.split(': ')[1])), acts.join('; '));
    },
  },
  {
    name: 'one torso hit on paper is not "still up" (the design review of v0.0.8: the coach, the DI and the panel said it after one round, and the recruit went to the head on paper): pairs-contact says "Again. Chest." with no act, Pair stays the first row; the steel that rang leads the line with pairs-still-up, never pairs-contact\'s "press"',
    async fn() {
      const { stepsOf } = await import('../src/sim/arms/shooting.js');
      const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'private', setup: 'standby' }), s = g.state;
      until(g, paused);
      const pick = s.stop.pick, T = s.armoury.range.turners.find(t => t.key === pick), gun = s.items[gunOn(s, s.player.id)];
      // (one round in his torso, aimed at him, off safe)
      T.hits.push({ shotId: 'sh-x', part: 'torso', zone: 'A', ring: false, through: false, at: [0, 0], atMs: s.clock.ms });
      gun.mode = 'semi'; s.stop.aim = { key: pick, settledMs: s.clock.ms }; s.people[s.player.id].kit.carry.posture = 'aimed';
      g.step(1);
      const c = rule(s, 'pairs-contact');
      const panel = stepsOf(s).filter(x => x.kind === 'shot').map(x => x.id);
      console.log(`      one torso hit on ${pick}: ${ids(s).join(', ')}; pairs-contact "${c?.ctx?.variant}" act ${c?.act}; shot rows ${panel.join(', ')}`);
      assert(!ids(s).includes('pairs-still-up') && c?.ctx?.variant === 'again' && c.act === null && panel[0] === 'shot:pair' && !panel.includes('shot:head'), JSON.stringify({ ids: ids(s), v: c?.ctx?.variant, panel }));
      // (the steel: the private's first row, the Pair (his failure drill is gated), rings on the plate and he stands)
      const h = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'private', setup: 'standby:3' }), hs = h.state, bot = pairsBot();
      until(h, paused);
      until(h, (st) => { const A = st.armoury.range.turners.find(t => t.key === st.stop?.pick); return !!A?.hits.some(x => x.ring) && st.stop?.phase === 'choose'; }, bot);
      h.step(1);
      const A = hs.armoury.range.turners.find(t => t.key === hs.stop.pick), fired = firedNow(hs, hs.clock.ms, RULES).filter(l => l.tone === 'urgent').map(l => l.id);
      console.log(`      the steel after ${A.hits.map(x => `${x.part}${x.ring ? ' rang' : ''}`).join(', ')}, down ${A.stoppedAtMs !== null}: urgent ${fired.join(', ')}; the line ${JSON.stringify(instinctNow(hs).line?.text)}`);
      assert(A.stoppedAtMs === null && fired[0] === 'pairs-still-up' && !fired.includes('pairs-contact') && instinctNow(hs).line?.id === 'pairs-still-up', JSON.stringify({ fired, line: instinctNow(hs).line }));
    },
  },
  {
    name: 'the no-shoot bracketed with a threat he identified still up: pairs-noshoot says "Not him", names the threat\'s lane and offers no act (Hold him only when he is the last one up); Hold him held is struck "held"; X at the pause with a threat facing: pairs-live-out, "He\'s still there. G, and take him." (G)',
    async fn() {
      const { stepsOf } = await import('../src/sim/arms/shooting.js');
      const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'private', setup: 'standby:2' }), s = g.state;
      until(g, paused);
      const R = s.armoury.range, ns = R.str.keys.find(k => R.turners.find(t => t.key === k).face === 'noshoot');
      const last = contactOf(s).last, ident = Object.fromEntries(R.str.keys.map(k => [k, R.turners.find(t => t.key === k).holds]));
      noteContact(s, { last: { ...last, ident } });
      g.step(1, { act: [stepAct(`pick=${ns}`, 'normal', null)] });
      g.step(1);
      const n = seeAct(rule(s, 'pairs-noshoot'));
      console.log(`      ${ns} (${ident[ns]}) bracketed, ${R.str.keys.filter(k => k !== ns).map(k => `${k} ${ident[k]}`).join(', ')} up: pairs-noshoot "${n?.ctx?.variant}" act ${n?.act}`);
      assert(n?.ctx?.variant === 'other' && n.act === null, JSON.stringify({ v: n?.ctx?.variant, act: n?.act }));
      // (Hold him, then held: struck)
      g.step(1, { act: [stepAct('contact:hold', 'normal', null)] });
      until(g, (st) => st.stop?.phase === 'choose');
      g.step(1);
      const hold = stepsOf(s).find(x => x.id === 'contact:hold');
      console.log(`      Hold him done: the row ${hold?.off ?? 'offered'}, leading ${!!hold?.lead}`);
      assert(hold?.off === 'held' && !hold.lead, JSON.stringify(hold && { off: hold.off, lead: hold.lead }));
      // (X at the pause: live, a threat facing)
      g.step(1, { act: [stepAct('leave', 'normal', null)] });
      g.step(1);
      const o = seeAct(rule(s, 'pairs-live-out'));
      console.log(`      out of the mode with threats facing: pairs-live-out (${o?.tone}) act ${o?.act}`);
      assert(!s.stop && o?.act === 'stop:enter' && o.tone === 'urgent', JSON.stringify({ stop: !!s.stop, act: o?.act }));
    },
  },
  {
    name: 'pairs-ready names what is lacking (pairs.js pairsWant): with the magazine out between strings, "No magazine in" and, in the mode, the step that puts one in; the coach\'s nudge names it too (the design review of v0.0.8: the DI was silent and the coach nagged about the safe)',
    fn() {
      const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'private' }), s = g.state, bot = pairsBot();
      until(g, (st) => pairsNow(st).cmd === 'stop' && pairsNow(st).str?.k === 0, bot, 20 * 60 * 3);
      until(g, (st) => !st.stop && st.armoury.range.cmd?.id === 'stop', bot, 20 * 60);
      // (the magazine out to a pouch, as a fumbled Top up leaves it)
      g.step(1, { act: ['ready'] });
      until(g, (st) => st.stop?.phase === 'choose');
      g.step(1, { act: [stepAct('magOut:pouch', 'normal', null)] });
      until(g, (st) => st.stop?.phase === 'choose');
      g.step(1);
      const r = seeAct(rule(s, 'pairs-ready'));
      console.log(`      the magazine out at the coach's Stop: pairs-ready "${r?.ctx?.variant}" act ${r?.act}`);
      assert(r?.ctx?.variant === 'mag' && /^stop:(macro:load|seat|reach@p\d|queue)$/.test(r.act ?? ''), JSON.stringify({ v: r?.ctx?.variant, act: r?.act }));
      // (left alone out of the mode: the coach's nudge at nudgeMs names the magazine)
      g.step(1, { act: [stepAct('leave', 'normal', null)] });
      const said = [];
      for (let n = 0; n < 20 * 40 && !said.some(t => /^Shooter, /.test(t)); n++) { g.step(1); for (const [t, d] of g.bus.events) if (t === 'say') said.push(d.text); g.clearFacts(); }
      const nudge = said.find(t => /^Shooter, /.test(t));
      console.log(`      the coach's nudge: "${nudge}"`);
      assert(nudge === 'Shooter, a magazine in.', JSON.stringify(said.slice(-4)));
    },
  },
  {
    name: 'at a pause off the point the DI never offers Off safe: "Back on your point first." with no act (the design review of v0.0.8); a fumble that slung the rifle: "Rifle up." (Rifle up)',
    fn() {
      const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'private', setup: 'standby' }), s = g.state;
      until(g, paused);
      const me = g.me(), x0 = me.x;
      me.x = x0 - 3; me.$px = me.x;
      g.step(1);
      const c = seeAct(rule(s, 'pairs-contact'));
      console.log(`      3 m behind the point at the pause: pairs-contact "${c?.ctx?.variant}" act ${c?.act}`);
      assert(c?.ctx?.variant === 'point' && c.act === null, JSON.stringify({ v: c?.ctx?.variant, act: c?.act }));
      me.x = x0; me.$px = x0;
      s.people[s.player.id].kit.carry.posture = 'slungFront';
      g.step(1);
      const u = seeAct(rule(s, 'pairs-contact'));
      console.log(`      on the point, the rifle slung by a fumble: pairs-contact "${u?.ctx?.variant}" act ${u?.act}`);
      assert(u?.ctx?.variant === 'up' && u.act === 'stop:up', JSON.stringify({ v: u?.ctx?.variant, act: u?.act }));
    },
  },
  {
    name: '"Three bangs" (0.0.9, the runtime review): the tier one\'s one-tick flinch and the Raider\'s 0.15 s get no "Flinched. Everybody does, the first time." (FROZE_SAY_MIN_MS 0.3 s); the boot recruit\'s first series is "first", the sergeant\'s steadier words never say "the first time"; nothing is said while a planned bang is still to join the freeze; the DI\'s line goes on the bang\'s own tick, not at the next whole second',
    fn() {
      const out = {};
      for (const tier of ['recruit', 'sgt', 'raider', 'tierone']) {
        const g = createGame({ scenario: 'test-pairs', seed: 48213, tier, setup: 'bangs:standby' }), s = g.state, pid = s.player.id;
        const seen = [];
        let lineAtBang = 'none', saidDue = 0;
        for (let n = 0; n < 20 * 30; n++) {
          const was = startled(s, pid);
          g.step(1);
          if (!was && startled(s, pid) && lineAtBang === 'none') lineAtBang = s.$instinct?.line?.id ?? null;
          const f = rule(s, 'pairs-froze');
          if (f && bangDue(s)) saidDue++;
          if (f && !seen.some(x => x.variant === f.ctx.variant)) seen.push({ variant: f.ctx.variant, words: f.rule.text[f.ctx.variant][0], froze: blockOf(s, pid)?.startleMs ?? 0 });
          if (paused(s)) break;
        }
        out[tier] = { seen, lineAtBang, saidDue, froze: blockOf(s, pid)?.startleMs ?? 0 };
        console.log(`      ${tier}: froze ${out[tier].froze} ms in all; pairs-froze ${seen.map(x => `${x.variant} "${x.words}"`).join(', ') || 'never'}; the line on the first startled tick: ${lineAtBang ?? 'none'}; said with a bang due: ${saidDue}`);
      }
      assert(!out.tierone.seen.length && !out.raider.seen.length, JSON.stringify({ tierone: out.tierone, raider: out.raider }));
      assert(out.recruit.seen[0]?.variant === 'first' && out.sgt.seen.length && out.sgt.seen.every(x => !/first time|Everybody/.test(x.words)), JSON.stringify({ recruit: out.recruit.seen, sgt: out.sgt.seen }));
      // (the tier one's one-tick startle is over before a tick's end sees it: 'none')
      assert(Object.values(out).every(o => o.saidDue === 0 && (o.lineAtBang === null || o.lineAtBang === 'none')) && out.recruit.lineAtBang === null, JSON.stringify(out));
    },
  },
];
