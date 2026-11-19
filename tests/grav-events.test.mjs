// OLYMPUS tests: gravity events, a ship's thrust changing under you (v0.0.24, ROADMAP "anywhere" step 6; the build sheet §6 C, §8 F112, as shifted: the sheet's F109).
//
// F112: the events to the tick (the warning warnS before the onset, the onset, the ramp at onsetGs a tick at a time, the hold, the
// end and the off ramp); the thrown speeds (a body floating 3 m over the deck lands at 7.67 m/s under a sharp 1 G onset and 4.20 at
// 0.3 G, √(2 a y), and under the default 0.5 G/s ramp at the closed form's 5.83 m/s, checked against a numerical integration made
// here); couched safe at any change; standing, braced and on mag boots ridden up to BRACE_G under a warning and SURPRISE_G under a
// surprise, down prone above; a hand on a hold kept to 1 G and pulled off above; a 0.4 G surprise jink survived, the floating pushed
// across the deck; the surprise's card ("Turn feet aft"); a skip refused while a brace is pending and one already running stopped at
// the warning. Every case on a coasting deck (&env=ship-coast): the sandbox for one body, the shoot house's sector 4 for the steel
// apron's mag boots and the house's people (the #2, the instructor), who are thrown in the same pass.
import { assert, near, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { setProfile, gravNow, profileOf, fallOf, couchedOf, setStrapped, gravCardOf, bracePending } from '../src/sim/places/gravity.js';
import { gravityAt } from '../src/sim/places/env.js';
import { footingOf, setAnchor } from '../src/sim/body/footing.js';
import { wear } from '../src/sim/arms/kit.js';
import { G0_MS2 } from '../src/core/phys.js';
import { TICK_MS, isHeld } from '../src/core/clock.js';
import { BRACE_G, SURPRISE_G, COUCH_G, GRAV_BODY } from '../src/data/body/needs.js';
import { BRACE_REFUSED } from '../src/sim/time/activities.js';

const SEED = 48213;
const meOf = (s) => s.actors.list.find(a => a.id === s.player.actor);
/** The shoot house's steel apron (deckPlate, ferrous: anchor-table's spot). */
const APRON = Object.freeze([2, 10]);
// (a game on a coasting deck with a profile set at its start, and its grav facts with the clock's ms; scenario the sandbox or the house)
function game(list, { scenario = 'sandbox', at = null } = {}) {
  const g = createGame({ scenario, seed: SEED, env: 'ship-coast' }), s = g.state, me = meOf(s);
  if (at) { me.x = at[0]; me.z = at[1]; }
  const t0 = s.clock.ms, seen = [];
  g.bus.on('grav', (f) => seen.push({ ...f, ms: s.clock.ms }));
  setProfile(s, list);
  return { g, s, me, pid: s.player.id, t0, seen };
}
const run = (G, ms) => G.g.step(Math.round(ms / TICK_MS));
// (what the event's onset did to a person, from the profile's log)
const logOf = (s, pid) => s.places.live.env.profile.log.filter(r => r.who === pid);
// (a fall's landing speed by a numerical integration at 1 ms of the ramp from g0 to g1 at k: the test's own, not the closed form)
function integrate(yM, g0G, g1G, onsetGs) {
  let t = 0, v = 0, d = 0;
  const dt = 1e-4;
  while (d < yM) { const g = Math.min(g1G, g0G + onsetGs * t) * G0_MS2; v += g * dt; d += v * dt; t += dt; }
  return { tS: t, vMs: v };
}

export default [
  {
    name: 'F112: a burn\'s events to the tick (the warning 15 s before, the onset, the ramp at 0.5 G/s a tick at a time to 1 G in 2 s, the hold of 20 s, the end and the off ramp back to 0 G), and the 1MC\'s words said as text (from v0.0.25\'s burn polish with the size, and at the onset too)',
    fn() {
      const G = game([{ kind: 'burn', toG: 1, atS: 20, warnS: 15 }]), { s, t0 } = G, said = [];
      G.g.bus.on('say', (f) => said.push({ text: f.text, speaker: f.speaker, kind: f.kind, ms: s.clock.ms }));
      const ramp = [];
      for (let k = 0; k < 50 * 20; k++) { G.g.step(1); const dt = s.clock.ms - t0; if (dt > 20000 && dt <= 22100) ramp.push([dt, gravityAt(s).gG]); }
      const at = (ph) => G.seen.find(f => f.phase === ph)?.ms - t0;
      const bad = ramp.filter(([dt, gG]) => Math.abs(gG - Math.min(1, Math.round(0.5 * ((dt - 20050) / 1000) * 1e4) / 1e4)) > 1e-9);
      console.log(`      warn +${at('warn')} ms, onset +${at('onset')} ms, hold +${at('hold')} ms, end +${at('end')} ms; the ramp: ${ramp.slice(0, 3).map(([d, g]) => `+${d} ${g} G`).join(', ')} … +${ramp.find(r => r[1] === 1)?.[0]} ms 1 G; ${bad.length} ticks off the rate`);
      console.log(`      said: ${said.map(l => `+${l.ms - t0} ${l.speaker} (${l.kind}) "${l.text}"`).join('; ')}`);
      console.log(`      after: ${gravityAt(s).gG} G, phase ${s.places.live.env.profile.phase}, the profile ${JSON.stringify(profileOf(s))}`);
      assert(at('warn') === 5000 && at('onset') === 20000 && at('hold') === 22000 && at('end') === 42000, JSON.stringify(G.seen.map(f => [f.phase, f.ms - t0])));
      assert(!bad.length && ramp.find(r => r[1] === 1)?.[0] === 22050, `the ramp at 0.5 G/s: ${JSON.stringify(bad.slice(0, 3))}`);
      // (v0.0.25's burn polish: the warning names the size, "Secure for burn: one G.", and the 1MC says it again at the onset, "Burning. One G.")
      assert(said.length === 3 && said[0].text === 'Brace, brace, brace. Secure for burn: one G. Burn in fifteen seconds.' && said[0].speaker === '1MC' && said[0].kind === 'pa' && said[0].ms - t0 === 5000 && said[1].text === 'Burning. One G.' && said[1].ms - t0 === 20000 && said[2].text === 'Burn complete. Coasting.' && said[2].ms - t0 === 42000, JSON.stringify(said));
      assert(gravityAt(s).gG === 0 && s.places.live.env.profile.phase === 'done' && gravNow(s) === null, 'back to coasting, the profile done');
    },
  },
  {
    name: 'F112: the thrown speeds: a body floating 3 m over the deck lands at 7.67 m/s under a sharp 1 G onset and 4.20 at 0.3 G (√(2 a y)), and under the default 0.5 G/s ramp at the closed form\'s speed, which a numerical integration of the ramp meets; its height written each tick of the fall, feet first only when it turned its feet aft',
    fn() {
      const out = [];
      for (const [toG, onsetGs, feet] of [[1, 20, false], [0.3, 20, false], [1, 0.5, false], [1, 0.5, true]]) {
        const G = game([{ kind: 'burn', toG, atS: 1, warnS: 0, onsetGs }]), { s, me, pid, t0 } = G;
        me.floatY = 3;
        if (feet) me.feetAft = true;
        const ys = [];
        for (let k = 0; k < 6 * 20; k++) { G.g.step(1); if (s.clock.ms - t0 > 1000) ys.push(me.floatY ?? null); }
        const L = logOf(s, pid).find(r => r.what === 'fell'), N = integrate(3, 0, toG, onsetGs), C = fallOf(3, 0, toG, onsetGs);
        const falling = ys.filter(y => y !== null), down = falling.every((y, i) => i === 0 || y <= falling[i - 1]);
        out.push({ toG, onsetGs, feet, L, N, C, sqrt: Math.sqrt(2 * toG * G0_MS2 * 3), ticks: falling.length, down, landed: me.floatY === undefined, stance: me.stance });
      }
      for (const o of out) console.log(`      ${o.toG} G at ${o.onsetGs} G/s${o.feet ? ', feet aft' : ''}: lands at ${fmt(o.L?.vMs, 3)} m/s (${o.L?.first}) after ${fmt(o.C.tS, 3)} s, ${o.ticks} ticks of fall; the integration ${fmt(o.N.vMs, 3)} m/s at ${fmt(o.N.tS, 3)} s; √(2ay) ${fmt(o.sqrt, 3)}; ${o.stance ?? 'standing'}; impactOf: ${(o.L?.injuries ?? []).map(i => `${i.part} ${i.state}${i.injuries.length ? ` (${i.injuries.join(', ')})` : ''}`).join(', ') || 'unhurt'}`);
      near(out[0].L.vMs, 7.67, 0.05, '1 G sharp from 3 m:'); near(out[1].L.vMs, 4.2, 0.05, '0.3 G sharp from 3 m:');
      for (const o of out) {
        near(o.L.vMs, o.N.vMs, 0.01, `${o.toG} G at ${o.onsetGs} G/s, against the integration:`);
        assert(o.down && o.landed && o.ticks >= 1 && o.L.first === (o.feet ? 'feet' : 'body') && o.stance === 'prone', JSON.stringify(o));
      }
      assert(out[2].L.vMs < out[0].L.vMs - 1, 'the ramp lands it slower than a sharp onset');
    },
  },
  {
    name: 'F112: couched safe at any change (strapped in under a 3 G burn), and at COUCH_G and over couched whatever holds you; standing and braced ride a warned change up to BRACE_G and go down prone above it, with the bruise roll at DOWN_DROP_M',
    fn() {
      const cases = [];
      for (const [toG, how] of [[3, 'strapped'], [3, 'standing'], [1.5, 'standing'], [1.6, 'standing'], [1.5, 'braced'], [1.6, 'braced']]) {
        const G = game([{ kind: 'burn', toG, atS: 1, warnS: 0, onsetGs: 1 }]), { s, me, pid } = G;
        if (how === 'strapped') setStrapped(s, pid, 'rack:test');
        // (the sandbox has no passage for the wedge (setAnchor checks one): the record written as the wedge leaves it)
        if (how === 'braced') { me.anchor = 'braced'; me.anchorAt = [me.x, me.z]; assert(footingOf(s, pid).mode === 'braced', 'braced'); }
        run(G, 1100);
        const L = logOf(s, pid)[0];
        run(G, 3000);
        cases.push({ toG, how, what: L?.what, vMs: L?.vMs ?? null, stance: me.stance ?? 'stand', couched: couchedOf(s, pid), mode: footingOf(s, pid).mode, gG: gravityAt(s).gG });
      }
      for (const c of cases) console.log(`      ${c.toG} G, ${c.how}: ${c.what}${c.vMs !== null ? ` (${c.vMs} m/s)` : ''}, ${c.stance}; at ${c.gG} G couched ${c.couched}, the footing ${c.mode}`);
      const by = (toG, how) => cases.find(c => c.toG === toG && c.how === how);
      assert(by(3, 'strapped').what === 'couched' && by(3, 'strapped').stance === 'stand', 'strapped in: safe');
      assert(by(3, 'standing').what === 'down' && by(3, 'standing').couched && by(3, 'standing').mode === 'couched', 'at 3 G everyone is couched');
      assert(by(1.5, 'standing').what === 'rode' && by(1.6, 'standing').what === 'down' && by(1.6, 'standing').stance === 'prone', 'standing: BRACE_G');
      assert(by(1.5, 'braced').what === 'rode' && by(1.6, 'braced').what === 'down', 'braced: BRACE_G');
      near(by(1.6, 'standing').vMs, Math.sqrt(2 * 1.6 * G0_MS2 * GRAV_BODY.DOWN_DROP_M), 0.001, 'the bruise roll\'s speed:');
      assert(BRACE_G === 1.5 && SURPRISE_G === 0.5 && COUCH_G === 2.5 && GRAV_BODY.HOLD_MAX_G === 1, 'the constants');
    },
  },
  {
    name: 'F112: on the shoot house\'s steel apron, mag boots locked ride a warned burn up to BRACE_G and a surprise up to SURPRISE_G and go down above them; a hand on a hold keeps it to 1 G and is pulled off above; the house\'s other people are thrown in the same pass; a 0.4 G surprise jink is survived and pushes the floating across the deck',
    fn() {
      const rows = [];
      for (const [kind, toG, surprise, how] of [['burn', 1.5, false, 'boots'], ['burn', 1.6, false, 'boots'], ['jink', 0.4, true, 'boots'], ['jink', 0.6, true, 'boots'], ['burn', 1.0, false, 'hold'], ['burn', 1.2, false, 'hold'], ['jink', 0.4, true, 'floating']]) {
        const G = game([{ kind, toG, atS: 1, ...(surprise ? { surprise: true } : { warnS: 0 }), onsetGs: 1 }], { scenario: 'test-shoothouse', at: APRON }), { s, me, pid } = G;
        if (how === 'boots') { wear(s, pid, 'mb-1'); assert(setAnchor(s, pid, 'boots').ok, 'the boots lock on the apron'); }
        if (how === 'hold') { me.anchor = 'handhold'; me.anchorAt = [me.x, me.z]; }
        const before = footingOf(s, pid).mode;
        run(G, 1100);
        if (gravCardOf(s)) G.g.step(1, { act: [{ act: 'grav', args: { card: 'none' } }] });
        const L = logOf(s, pid)[0], others = s.places.live.env.profile.log.filter(r => r.who !== pid), x0 = me.x, z0 = me.z;
        // (the jink's push: the fastest drift seen and the way moved; the drift meets a face in under a second and stops there, B's landing)
        let vMax = 0;
        for (let k = 0; k < (kind === 'jink' ? 1500 : 500) / TICK_MS; k++) { G.g.step(1); vMax = Math.max(vMax, me.v ? Math.hypot(...me.v) : 0); }
        rows.push({ kind, toG, how, before, what: L?.what, stance: me.stance ?? 'stand', anchor: me.anchor ?? null, v: vMax, movedM: Math.hypot(me.x - x0, me.z - z0), hurt: (L?.injuries ?? []).length, others: others.map(r => r.what) });
      }
      for (const r of rows) console.log(`      ${r.kind} ${r.toG} G, ${r.how} (${r.before}): ${r.what}, ${r.stance}${r.anchor ? `, ${r.anchor}` : ''}${r.v ? `, drifted at up to ${fmt(r.v, 3)} m/s, ${fmt(r.movedM, 2)} m` : ''}${r.hurt ? `, ${r.hurt} parts hurt` : ''}; the others ${r.others.join(', ') || 'none'}`);
      const by = (k, g, how) => rows.find(r => r.kind === k && r.toG === g && r.how === how);
      assert(by('burn', 1.5, 'boots').what === 'rode' && by('burn', 1.6, 'boots').what === 'down', 'boots under a warning: BRACE_G');
      assert(by('jink', 0.4, 'boots').what === 'rode' && by('jink', 0.6, 'boots').what === 'down', 'boots under a surprise: SURPRISE_G');
      assert(by('burn', 1.0, 'hold').what === 'held' && by('burn', 1.0, 'hold').anchor === 'handhold' && by('burn', 1.2, 'hold').what === 'pulled' && !by('burn', 1.2, 'hold').anchor, 'a hold: to 1 G');
      const fl = by('jink', 0.4, 'floating');
      assert(fl.what === 'slid' && fl.v > 0.5 && fl.movedM > 0.1, `the floating pushed by the jink: ${JSON.stringify(fl)}`);
      assert(rows.every(r => r.others.length >= 1), 'the house\'s people are in the pass');
    },
  },
  {
    name: 'F112: the surprise\'s card: a floating body falling at a surprise gets "Turn feet aft" in the onset\'s tick, time standing still until it answers; the answer lands it feet first, and "Nothing" on its body',
    fn() {
      const out = [];
      for (const key of ['feet', 'none']) {
        const G = game([{ kind: 'burn', toG: 0.4, atS: 1, surprise: true, onsetGs: 2 }]), { s, me, pid, t0 } = G;
        me.floatY = 2;
        run(G, 1000);
        G.g.step(1);
        const card = gravCardOf(s), heldAt = s.clock.ms, held = isHeld(s, 'reflex');
        G.g.step(5);
        const still = s.clock.ms === heldAt;
        G.g.step(1, { act: [{ act: 'grav', args: { card: key } }] });
        run(G, 3000);
        const L = logOf(s, pid).find(r => r.what === 'fell');
        out.push({ key, card: card ? card.options.map(o => o.label) : null, title: card?.title, held, still, atOnset: heldAt - t0, first: L?.first, vMs: L?.vMs, released: !isHeld(s) });
      }
      for (const o of out) console.log(`      answered ${o.key}: the card "${o.title}" [${o.card?.join(' · ')}] at +${o.atOnset} ms, time held ${o.held} and still ${o.still}; landed ${o.first} first at ${o.vMs} m/s; released ${o.released}`);
      for (const o of out) assert(o.card && o.card.includes('Turn feet aft') && o.card.at(-1) === 'Nothing: let it come' && o.held && o.still && o.atOnset === 1000 && o.released, JSON.stringify(o));
      assert(out[0].first === 'feet' && out[1].first === 'body', JSON.stringify(out));
    },
  },
  {
    name: 'F112: a skip refused while a brace is pending (the warning out, the change coming in), allowed before it and after; one already running stopped at the warning\'s second',
    fn() {
      const G = game([{ kind: 'burn', toG: 1, atS: 30, warnS: 15 }]), { s, t0 } = G, lines = [];
      G.g.bus.on('line', (f) => lines.push(f));
      G.g.step(1, { act: ['debug:skip:600000'] });
      const stoppedAt = s.clock.ms - t0, phase = s.places.live.env.profile.phase, pending = bracePending(s);
      const ms0 = s.clock.ms;
      G.g.step(1, { act: ['debug:skip:60000'] });
      const refusedMs = s.clock.ms - ms0, refused = lines.find(l => l.text === BRACE_REFUSED);
      run(G, 16000);
      const onset = s.places.live.env.profile.phase, pendingOnset = bracePending(s);
      run(G, 3000);
      const ms1 = s.clock.ms;
      G.g.step(1, { act: ['debug:skip:5000'] });
      const holdSkip = s.clock.ms - ms1;
      console.log(`      a 10 min skip begun at the start stopped at +${stoppedAt} ms (${phase}, pending ${pending}); a skip in the warning: ${refusedMs} ms passed, "${refused?.text}"; in the ${onset} pending ${pendingOnset}; under the hold a 5 s skip passes ${holdSkip} ms`);
      assert(stoppedAt === 15000 && phase === 'warn' && pending, 'stopped at the warning');
      assert(refusedMs === TICK_MS && refused, 'refused in the warning');
      assert(holdSkip >= 5000 && !bracePending(s), 'allowed under the hold');
    },
  },
  {
    name: 'F112: nothing at Mars and the Wheel without a profile: no event, no write, the G line\'s facts null; and a profile\'s events are drawn from the seed (a range of onsets in whole seconds, a chance on half the seeds)',
    fn() {
      const m = createGame({ scenario: 'test-handling', seed: SEED }), w = createGame({ scenario: 'test-shoothouse', seed: SEED });
      for (const g of [m, w]) { g.step(40); assert(!g.state.places.live.env?.profile && !(g.state.events ?? []).some(e => /^grav:/.test(e.kind)), 'no profile, no event'); }
      const ats = [], kept = [];
      for (let seed = 1; seed <= 200; seed++) {
        const g = createGame({ scenario: 'sandbox', seed, env: 'ship-coast' });
        setProfile(g.state, [{ kind: 'burn', toG: 1, atS: [25, 45] }, { kind: 'jink', toG: 0.4, atS: 80, surprise: true, chance: 0.5 }]);
        const P = profileOf(g.state);
        ats.push(P[0].atS); kept.push(P.length === 2);
      }
      const lo = Math.min(...ats), hi = Math.max(...ats), share = kept.filter(Boolean).length / kept.length;
      console.log(`      onsets drawn over 200 seeds: ${lo} to ${hi} s, whole seconds ${ats.every(Number.isInteger)}; the jink on ${fmt(share * 100, 1)}% of seeds`);
      assert(lo === 25 && hi === 45 && ats.every(Number.isInteger) && share > 0.4 && share < 0.6, 'the draws');
    },
  },
];
