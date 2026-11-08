// body-hands: the hands' ledger (the build sheet 0.0.6 §2.2, §5.2, §8 items 3 and 4; the user, 2026-11-06:
// "first of all using the head shouldn't wash our hands either afterwards"). The hands' dirt, 0 to 100, beside
// grime: a linear closed form at HANDS.RATE_K times grime's rate and by events (the head 40, a stall 60, a bar
// 10, a rifle handling sub-step 1.5, regolith 15), washed to 0 at a basin and in a shower. Printed: the hands
// through the reference sol (each head, meal and basin), through test-handling's course, and the slow rate's
// times to each band awake, asleep and outdoors. Held: the events' amounts and causes, a basin and a shower
// clean them, a split anywhere equals one call, lived and skipped equal, the words name the cause, and the
// head never washes them.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { templateBody, runSols, weekOf, MELAS_LON, REF_REVEILLE, MELAS_PLACE } from './bots/sol.mjs';

// (Melas's indoor and outdoor environments as the body reads them: src/sim/places/env.js bodyPlaceOf)
const INDOORS = envOf({ gG: MELAS_PLACE.gG, ...MELAS_PLACE.in }), OUTDOORS = envOf({ gG: MELAS_PLACE.gG, ...MELAS_PLACE.out, outdoors: true });
import { marsTimeText } from '../src/core/calendar.js';
import { HOUR_MS, MIN_MS, SEC_MS } from '../src/core/clock.js';
import { playerId } from '../src/core/ids.js';
import { HANDS, HANDS_BANDS, HYGIENE } from '../src/data/body/needs.js';
import { REFERENCE_SOL } from '../src/data/body/sol.js';
import { TEMPLATES } from '../src/data/body/templates.js';
import { bodyAdvance, bodyOf, bodySync, envOf, loadOf, soil, groom, wash, relieve, withLedgers, startBody, solPlan } from '../src/sim/body/body.js';
import { popDue } from '../src/core/queue.js';
import { copy, deltaOf } from '../src/sim/body/record.js';
import { stagesOf, cuesOf, wordsOf, handsWords } from '../src/sim/body/cues.js';
import { handsIndex } from '../src/sim/body/hygiene.js';
import { START_MS } from '../src/data/setting/calendar.js';

const T = (ms) => marsTimeText(ms, MELAS_LON);
const SOLS = () => weekOf(REF_REVEILLE, MELAS_LON, 1).slice(0, 2);
// (a game's player and a bus that keeps the facts)
function game(hour = 19.5) {
  const g = createGame({ scenario: 'barracks', seed: 48213, hour });
  return { g, s: g.state, pid: playerId(g.state) };
}
const dirtOf = (s, pid) => bodyOf(s, pid).hands;

export default [
  {
    name: 'the hands through the reference sol: each head, stall and meal soils them, each basin, the washing up and the shower wash them; a career starts with the hands of the day\'s last wash (the template\'s reveille dirt 5 against the sol\'s own)',
    fn() {
      const sols = SOLS(), b = templateBody(sols[0].reveilleMs);
      const rows = [];
      const plan = solPlan(REFERENCE_SOL, sols[0].reveilleMs, MELAS_LON, sols[1].reveilleMs);
      for (const span of plan) {
        const before = b.hands.dirt;
        runSols({ body: b, sols, fromMs: Math.max(sols[0].reveilleMs, b.atMs), untilMs: span.toMs });
        const r = span.row;
        if (r.head || r.stall || r.eat || r.groom || r.wash) rows.push(`${span.row.at} ${r.what}: ${fmt(before, 1)} → ${fmt(b.hands.dirt, 1)}${b.hands.why ? ` (${b.hands.why})` : ''}`);
      }
      for (let i = 0; i < rows.length; i += 4) console.log(`      ${rows.slice(i, i + 4).join('; ')}`);
      const atRev = b.hands.dirt, tmpl = TEMPLATES['m-adult'].hands.dirt;
      console.log(`      at the next reveille: ${fmt(atRev, 2)} (the template's ${tmpl}: washed at 21:45, a night at ${HYGIENE.GRIME_ASLEEP_H} an hour); New career at 12:39 starts at ${fmt(startBody({ sex: 'm' }, START_MS, MELAS_LON).hands.dirt, 1)}, the barracks at 19:30 at ${fmt(startBody({ sex: 'm' }, START_MS + 6.85 * HOUR_MS, MELAS_LON).hands.dirt, 2)}`);
      assert(Math.abs(atRev - tmpl) <= 1, `the reference sol's reveille dirt ${atRev} against the template's ${tmpl}`);
      // (the range's portable heads have no basin: the hands stay soiled until the washing up)
      const range = plan.find(p => p.row.what.includes('portable heads'));
      assert(range && !range.row.groom, 'the range\'s portable heads wash nothing');
    },
  },
  {
    name: 'the user, 2026-11-06: "using the head shouldn\'t wash our hands either afterwards": a head soils them by 40, a stall by 60, a bar by 10, each event told with its cause, and only a basin or a shower cleans them',
    fn() {
      const { g, s, pid } = game();
      g.clearFacts();
      const ms0 = s.clock.ms, d0 = dirtOf(s, pid).dirt;
      relieve(s, pid, { bladderK: 1 }, ms0, g.bus);
      const afterHead = dirtOf(s, pid);
      assert(Math.abs(afterHead.dirt - d0) < 0.01, `relieving alone moves no dirt: ${d0} → ${afterHead.dirt} (the activity soils, by soil())`);
      soil(s, pid, { k: HANDS.HEAD, why: 'head' }, ms0, g.bus);
      const h1 = dirtOf(s, pid);
      soil(s, pid, { k: HANDS.STALL, why: 'stall' }, ms0, g.bus);
      const h2 = dirtOf(s, pid);
      groom(s, pid, { hands: true }, ms0, g.bus);
      const h3 = dirtOf(s, pid);
      soil(s, pid, { k: HANDS.FOOD, why: 'food' }, ms0, g.bus);
      const h4 = dirtOf(s, pid);
      wash(s, pid, { waterMin: 3 }, ms0, g.bus);
      const h5 = dirtOf(s, pid);
      const ev = g.bus.events.filter(([t, d]) => t === 'body-event' && (d.kind === 'soil' || d.kind === 'groom' || d.kind === 'wash')).map(([, d]) => `${d.kind}${d.kind === 'soil' ? ` ${d.amount} ${d.why}` : d.kind === 'groom' ? ` bits ${d.amount}` : ''}`);
      console.log(`      from ${fmt(d0, 2)}: the head ${fmt(h1.dirt, 2)} (${h1.why}), a stall ${fmt(h2.dirt, 2)} (${h2.why}, capped at ${HANDS.MAX}), the basin's hands ${fmt(h3.dirt, 2)} (${h3.why}), a bar ${fmt(h4.dirt, 2)} (${h4.why}), a 3-minute shower ${fmt(h5.dirt, 2)}`);
      console.log(`      the facts: ${ev.join(', ')}`);
      assert(Math.abs(h1.dirt - (d0 + HANDS.HEAD)) < 1e-6 && h1.why === 'head', `the head: ${JSON.stringify(h1)}`);
      assert(h2.dirt === Math.min(HANDS.MAX, h1.dirt + HANDS.STALL) && h2.why === 'stall', `a stall: ${JSON.stringify(h2)}`);
      assert(h3.dirt === 0 && h3.why === null, `the basin: ${JSON.stringify(h3)}`);
      assert(Math.abs(h4.dirt - HANDS.FOOD) < 1e-6 && h4.why === 'food', `a bar: ${JSON.stringify(h4)}`);
      assert(h5.dirt === 0 && h5.why === null, `the shower: ${JSON.stringify(h5)}`);
      assert(ev.join() === 'soil 40 head,soil 60 stall,groom bits 8,soil 10 food,wash', ev.join());
    },
  },
  {
    name: 'the slow rate (HANDS.RATE_K × grime\'s): the times from clean to each band awake indoors, asleep and outdoors; a split at 1,000 random seconds equals one call to 1e-9; the dirt is capped at 100',
    fn() {
      const rows = [];
      for (const [what, env, load] of [['awake indoors, idle', INDOORS, { met: 1.5 }], ['outdoors, walking', OUTDOORS, { met: 3.0, kind: 'walk', out: true }], ['hard work over MET 5 outdoors', OUTDOORS, { met: 6, kind: 'walk', out: true }]]) {
        const b = withLedgers(templateBody(REF_REVEILLE), { handsDirt: 0 }), seg = { env, load: loadOf({ ...load, out: env.outdoors }, env) };
        const out = bodyAdvance(b, seg, REF_REVEILLE, REF_REVEILLE + 120 * HOUR_MS);
        const hits = out.crossed.filter(c => c.ledger === 'hands').map(c => `${c.to} ${fmt((c.atMs - REF_REVEILLE) / HOUR_MS, 1)} h`);
        rows.push(`${what}: ${hits.join(', ')}; after 120 h ${fmt(b.hands.dirt, 1)}`);
        assert(b.hands.dirt <= HANDS.MAX, `${what}: ${b.hands.dirt}`);
      }
      // (asleep: a night's slow rate, lying in the rack)
      const sols = SOLS(), night = templateBody(sols[0].reveilleMs);
      runSols({ body: night, sols, untilMs: sols[1].reveilleMs - 7.5 * HOUR_MS });
      const n0 = night.hands.dirt;
      runSols({ body: night, sols, fromMs: night.atMs, untilMs: sols[1].reveilleMs });
      rows.push(`asleep, a night of 7.5 h: ${fmt(n0, 2)} → ${fmt(night.hands.dirt, 2)} (${fmt((night.hands.dirt - n0) / 7.5, 2)} an hour, grime's ${HYGIENE.GRIME_ASLEEP_H})`);
      for (const r of rows) console.log(`      ${r}`);
      // (composition: one call against the same span split at random seconds)
      const b1 = withLedgers(templateBody(REF_REVEILLE), { handsDirt: 3 }), b2 = copy(b1), seg = { env: OUTDOORS, load: loadOf({ met: 3, kind: 'walk', out: true }, OUTDOORS) };
      bodyAdvance(b1, seg, REF_REVEILLE, REF_REVEILLE + 9 * HOUR_MS);
      const cuts = Array.from({ length: 1000 }, (_, i) => REF_REVEILLE + Math.round(((i * 7919) % 32400) + 1) * SEC_MS).sort((a, c) => a - c);
      let t = REF_REVEILLE;
      for (const c of [...new Set(cuts)]) { if (c > t) { bodyAdvance(b2, seg, t, c); t = c; } }
      bodyAdvance(b2, seg, t, REF_REVEILLE + 9 * HOUR_MS);
      const rel = Math.abs(b1.hands.dirt - b2.hands.dirt) / Math.max(10, b1.hands.dirt), relH = Math.abs(b1.hair.h - b2.hair.h) / Math.max(1, b1.hair.h);
      console.log(`      9 h outdoors in one call against split at ${cuts.length} seconds: hands ${fmt(b1.hands.dirt, 6)}/${fmt(b2.hands.dirt, 6)}, hair ${fmt(b1.hair.h, 6)}/${fmt(b2.hair.h, 6)} h (relative ${rel.toExponential(1)}, ${relH.toExponential(1)})`);
      assert(rel <= 1e-9 && relH <= 1e-9, `the split: ${rel}, ${relH}`);
    },
  },
  {
    name: 'lived and skipped give the same hands: fifteen minutes lived at 20 Hz in the bay after the head against the same skipped; a save mid-minute carries on byte for byte',
    fn() {
      const a = game(), b = game(), t0 = a.s.clock.ms, span = 15 * MIN_MS;
      for (const x of [a, b]) soil(x.s, x.pid, { k: HANDS.HEAD, why: 'head' }, x.s.clock.ms, x.g.bus);
      a.g.run(span);
      bodySync(a.s, a.pid, a.s.clock.ms, a.g.bus);
      // (skipped: the slow layer's steps as an outcome skip takes them, body-skip's way)
      const st = b.s;
      for (let t = st.clock.ms; t < t0 + span;) {
        const nextEv = (st.events ?? []).filter(e => !e.dead && e.atMs > t).reduce((m, e) => Math.min(m, e.atMs), Infinity);
        const t1 = Math.min(t0 + span, Math.floor(t / MIN_MS) * MIN_MS + MIN_MS, nextEv);
        st.clock.ms = t1;
        b.g.sim.slowStep(st, b.g.bus, t, t1, { skipping: true });
        for (const ev of popDue(st, t1)) b.g.sim.dispatch(st, b.g.bus, ev);
        t = t1;
      }
      const ha = dirtOf(a.s, a.pid), hb = dirtOf(b.s, b.pid), ra = bodyOf(a.s, a.pid).hair.h, rb = bodyOf(b.s, b.pid).hair.h;
      console.log(`      after the head at 19:30, 15 minutes: lived ${fmt(ha.dirt, 6)} (${ha.why}), skipped ${fmt(hb.dirt, 6)} (${hb.why}); the hair ${fmt(ra, 6)}/${fmt(rb, 6)} h`);
      assert(Math.abs(ha.dirt - hb.dirt) <= 0.01 && ha.why === hb.why && Math.abs(ra - rb) <= 1e-6, JSON.stringify({ ha, hb, ra, rb }));
      const c = game();
      soil(c.s, c.pid, { k: HANDS.FOOD, why: 'food' }, c.s.clock.ms, c.g.bus);
      c.g.step(20 * 37 + 7, { mx: -1 });
      const json = c.g.save();
      c.g.step(20 * 90, { mx: -1 });
      const end = c.g.save(), d = game();
      d.g.load(json); d.g.step(20 * 90, { mx: -1 });
      const same = end === d.g.save();
      console.log(`      saved at +37.35 s mid-minute walking, carried on 90 s: ${same ? 'byte for byte' : 'different'} (hands ${fmt(dirtOf(d.g.state, c.pid).dirt, 4)})`);
      assert(same, 'a save mid-minute did not carry on byte for byte');
    },
  },
  {
    name: 'the words name the cause: "Dirty hands, since the head.", "Gun oil and carbon on your hands.", "Regolith ground into your palms."; the bands at 20, 40, 70; the cues give the doll handsK and handsWhy',
    fn() {
      const lines = [];
      for (const why of [null, 'head', 'stall', 'food', 'rifle', 'regolith']) lines.push(`${why ?? 'slow'}: ${[0, 1, 2, 3].map(i => handsWords(i, why)).join(' / ')}`);
      for (const l of lines) console.log(`      ${l}`);
      const b = withLedgers(templateBody(REF_REVEILLE), { handsDirt: 45, handsWhy: 'head' });
      const st = stagesOf(b, REF_REVEILLE, MELAS_LON).hands, cu = cuesOf(b, REF_REVEILLE, MELAS_LON), w = wordsOf(b, REF_REVEILLE, MELAS_LON);
      console.log(`      dirt 45 after the head: stage ${st.band} (${st.tone}) "${st.words}"; cues handsK ${cu.handsK}, handsWhy ${cu.handsWhy}; the sheet's line "${w.line}"`);
      assert(st.band === 'dirty' && st.words === 'Dirty hands, since the head.', JSON.stringify(st));
      assert(handsWords(2, 'rifle') === 'Gun oil and carbon on your hands.' && handsWords(2, 'regolith') === 'Regolith ground into your palms.', 'the causes\' words');
      assert(cu.handsK === 0.45 && cu.handsWhy === 'head', JSON.stringify(cu));
      assert(w.needs.some(n => n.need === 'hands' && n.band === 'dirty') && /dirty hands, since the head/.test(w.line), JSON.stringify(w));
      assert([0, 19.99, 20, 39.99, 40, 69.99, 70, 100].map(handsIndex).join() === '0,0,1,1,2,2,3,3', 'the bands');
      assert(HANDS_BANDS.map(x => x.dirt ?? 0).join() === '0,20,40,70', 'the bands\' dirt');
    },
  },
  {
    name: 'test-handling\'s course: the hands through the range scene (the rifle\'s handling sub-steps and the regolith soil them: the actions role\'s calls in shooting.js), printed',
    fn() {
      let mod = null;
      return import('./scene-handling.test.mjs').then(m => { mod = m; }).then(() => {
        const { g, s, steps } = mod.playScene({ seed: 48213 });
        const pid = playerId(s), soils = g.bus.events.filter(([t, d]) => t === 'body-event' && d.kind === 'soil' && d.who === pid).map(([, d]) => d);
        const by = {};
        for (const d of soils) { by[d.why] ??= { n: 0, amount: 0 }; by[d.why].n++; by[d.why].amount += d.amount; }
        const h = dirtOf(s, pid);
        console.log(`      ${steps.length} steps on the line; ${soils.length} soilings (${Object.entries(by).map(([k, v]) => `${k} ${v.n} × = ${fmt(v.amount, 1)}`).join(', ') || 'none yet: the range\'s soil calls are the actions role\'s'}); the hands at the end ${fmt(h.dirt, 1)} (${h.why ?? 'the slow rate'}): "${stagesOf(bodyOf(s, pid), s.clock.ms, MELAS_LON).hands.words}"`);
        for (const d of soils) assert((d.why === 'rifle' && d.amount === HANDS.RIFLE_SUB) || (d.why === 'regolith' && d.amount === HANDS.REGOLITH) || ['head', 'stall', 'food'].includes(d.why), JSON.stringify(d));
      });
    },
  },
];
