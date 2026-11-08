// Breathe: a step that drains the chaos twice as fast, its time and its cost (COMBAT §5.2; the build sheet 0.0.10 §2.1, §5.1, §8 items 11 to 14).
//
// The closed form against a tick-by-tick reference: from pool 105 exposed, Breathe begun 3 s after the last input sheds
// 8.00 points more than waiting by its end (4 s × 2 a second; in cover it would be 16, printed, not built: the bay has no
// cover); begun inside the grace it drains only past it. On the fixture bay (tests/contact-world.mjs): a sighting in its
// second sub-step cuts it at that sub-step's end (4.00 shed, the 'breathe' fact cut); a bang cuts it the same way; the row
// absent at felt 19 and present at 20, fixed on the first page with nothing facing, a single marked "! he's up" with a
// threat up, never struck; 4,000 ms at felt 98 (never × the chaos's time factor); refused while startled and while a
// take-in window is open; out of the mode a live step that keeps the stress course's turn armed (pairs.js counts it out
// of it and still: the scene role's hook, read here on test-pairs); a save at its start + 1, + 20 and + 60 ticks loading
// to the same digest and tick.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { bayGame, turn, runTo, LANE } from './contact-world.mjs';
import { TICK_MS, isHeld } from '../src/core/clock.js';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { panelOf, isFixed, digitOf } from '../src/sim/arms/panel.js';
import { refusesAct } from '../src/sim/combat/contact.js';
import { contactOf } from '../src/sim/people/mind.js';
import { suppAt, blockOf, feltOf, hardOf, bang, shotNoise, breatheOffer, suppTimeK, SUPP_DECAY, SUPP_GRACE_MS, BREATHE_MS, BREATHE_K, BREATHE_FROM } from '../src/sim/combat/supp.js';

// (a block written so a person's felt is f at ms: the pool f + H, fresh)
// (ago: the last input that long before ms, so a block written while time stands still can be past its grace)
function feltTo(state, pid, f, ms = state.clock.ms, ago = 0) {
  const H = hardOf(state, pid, ms), a = state.actors.list.find(x => x.who === pid);
  a.combat = { supp: f === 0 ? 0 : f + H + Math.max(0, ago - SUPP_GRACE_MS) * SUPP_DECAY.exposed / 1000, suppAtMs: ms - ago, suppRate: SUPP_DECAY.exposed, startleFromMs: null, startleUntilMs: null, blindUntilMs: null, dazzleUntilMs: null, deafUntilMs: null };
  return H;
}
// (the clock moved on past the grace, nothing else touched)
const past = (w, ms) => { const n = Math.ceil(ms / TICK_MS); for (let i = 0; i < n; i++) w.g.step(1); };

export default [
  {
    name: 'breathe: the closed form (COMBAT §5.2): from pool 105 exposed, Breathe begun 3 s after the last input leaves 8.00 points less than waiting at its end (4 s × 2 a second × (BREATHE_K − 1)); begun in the grace it drains only past it; a tick-by-tick reference to 0.01; in cover it would shed 16 (printed, not built)',
    fn() {
      const T = 1_000_000, rec = { supp: 105, suppAtMs: T, suppRate: SUPP_DECAY.exposed };
      const br = (from, rate = SUPP_DECAY.exposed) => ({ ...rec, suppRate: rate, breatheFromMs: T + from, breatheUntilMs: T + from + BREATHE_MS });
      const gap = (from, rate) => suppAt({ ...rec, suppRate: rate ?? rec.suppRate }, T + from + BREATHE_MS) - suppAt(br(from, rate), T + from + BREATHE_MS);
      // (the reference: the pool kept tick by tick, falling 2 a second past the grace, × BREATHE_K inside the window)
      let worst = 0;
      for (const from of [3000, 500, 0, 20_000]) {
        const R = br(from);
        let ref = 105;
        for (let t = T + TICK_MS; t <= T + 70_000; t += TICK_MS) {
          if (t - T > SUPP_GRACE_MS) ref = Math.max(0, ref - SUPP_DECAY.exposed * (t > R.breatheFromMs && t <= R.breatheUntilMs ? BREATHE_K : 1) * TICK_MS / 1000);
          worst = Math.max(worst, Math.abs(ref - suppAt(R, t)));
        }
      }
      const g3 = gap(3000), g05 = gap(500), cover = gap(3000, SUPP_DECAY.cover), down = gap(3000, SUPP_DECAY.down);
      console.log(`      Breathe from T + 3.0 s: ${fmt(g3, 2)} points under waiting at its end (the pool ${fmt(suppAt(br(3000), T + 7000), 2)} against ${fmt(suppAt(rec, T + 7000), 2)}); from T + 0.5 s, in the grace: ${fmt(g05, 2)} (its 3.0 s past the grace); in cover it would be ${fmt(cover, 2)} and staying down ${fmt(down, 2)} (built, not used: the bay has no cover, COMBAT §5.2)`);
      console.log(`      the closed form against a tick-by-tick reference over 70 s, four windows: worst ${worst.toExponential(2)} points`);
      assert(Math.abs(g3 - 8) < 1e-9 && Math.abs(g05 - 6) < 1e-9 && Math.abs(cover - 16) < 1e-9 && worst < 0.01, JSON.stringify({ g3, g05, cover, worst }));
    },
  },
  {
    name: 'breathe: offered from felt 20 (BREATHE_FROM), absent at 19; with nothing facing a fixed row on the first page, with a threat up a single marked "! he\'s up" and never struck; Breathe · 4.0 s at felt 98 as at 20 (never × the chaos\'s time factor); refused while startled and while a take-in window is open',
    fn() {
      const rows = [];
      const panel = (f, { up = false } = {}) => {
        const w = bayGame({ tier: 'private' });
        w.g.step(1, { act: ['shoot'] });
        feltTo(w.state, w.pid, f);
        if (up) { const T = w.R.turners.find(x => x.lane === LANE); T.turnAtMs = w.state.clock.ms - 2000; }
        const steps = stepsOf(w.state), row = steps.find(s => s.id === 'breathe') ?? null, p = panelOf(steps);
        return { w, row, digit: digitOf(steps, 'breathe'), fixed: row ? isFixed(row) : null, n: steps.length, pages: p.pages, offer: breatheOffer(w.state, w.pid) };
      };
      const at19 = panel(19), at20 = panel(20), at98 = panel(98), up = panel(60, { up: true });
      for (const [k, r] of Object.entries({ 'felt 19': at19, 'felt 20': at20, 'felt 98': at98, 'felt 60, a threat up': up }))
        console.log(`      ${k}: ${r.row ? `"${r.row.label} · ${(r.row.ms / 1000).toFixed(1)} s"${r.row.warn ? ` ! ${r.row.warn}` : ''}${r.row.off ? ` struck (${r.row.off})` : ''}, ${r.fixed ? 'fixed' : 'paged'}, key ${r.digit ?? 'not on page 1'} of ${r.n} rows on ${r.pages} pages` : `no row (${r.offer.why})`}; the chaos's time factor ${fmt(suppTimeK(feltOf(r.w.state, r.w.pid)), 3)}`);
      assert(!at19.row && at19.offer.why === 'calm' && at20.row && at20.fixed && at20.digit && !at20.row.warn && !at20.row.off, JSON.stringify({ at19: at19.offer, at20: at20.row }));
      assert(at98.row?.ms === BREATHE_MS && at98.row.subs.reduce((a, s) => a + s.ms, 0) === BREATHE_MS && up.row?.warn === 'up' && !up.row.off && !up.fixed, JSON.stringify({ at98: at98.row, up: up.row }));
      // (refused: startled (a bang behind him), and in a take-in window (a turner turned, out of the mode))
      const s1 = bayGame({ tier: 'recruit' });
      feltTo(s1.state, s1.pid, 40);
      bang(s1.state, s1.g.bus, { id: 'test:startle', x: s1.me.x - 1.5, z: s1.me.z });
      const startledOffer = breatheOffer(s1.state, s1.pid), refusedS = refusesAct(s1.state, 'breathe');
      const s2 = bayGame({ tier: 'recruit' });
      feltTo(s2.state, s2.pid, 40);
      turn(s2.g, [LANE]);
      runTo(s2.g, st => !!contactOf(st)?.pending, {}, 40);
      const windowOffer = breatheOffer(s2.state, s2.pid), refusedW = refusesAct(s2.state, 'breathe');
      s2.g.step(1, { act: ['breathe'] });
      const startedW = s2.g.facts('breathe').length;
      console.log(`      startled: offered ${startledOffer.ok} (${startledOffer.why}), the act gate ${refusedS ? 'refuses' : 'lets'} it; in a take-in window: offered ${windowOffer.ok} (${windowOffer.why}), the gate ${refusedW ? 'refuses' : 'lets'} it, ${startedW} Breathe begun when pressed`);
      assert(!startledOffer.ok && startledOffer.why === 'startled' && refusedS && !windowOffer.ok && windowOffer.why === 'taking in' && refusedW && !startedW, JSON.stringify({ startledOffer, windowOffer, startedW }));
    },
  },
  {
    name: 'breathe: lived out of the mode (T, the action \'breathe\'): four sub-steps of 1 s, no roll, the hands left as they were, 8.00 shed exposed and "Breathed 4.0 s: the chaos … → …." in J; a sighting in its second sub-step cuts it at that sub-step\'s end (4.00 shed, the fact cut), the pause then; a bang cuts it at its sub-step\'s end too',
    fn() {
      // (whole: from felt 60, past the grace, out of the mode)
      const w = bayGame({ tier: 'private' });
      feltTo(w.state, w.pid, 60);
      past(w, SUPP_GRACE_MS + 1000);
      const t0 = w.state.clock.ms;
      w.g.clearFacts();
      w.g.step(1, { act: ['breathe'] });
      runTo(w.g, s => !s.stop, {}, 200);
      const f = w.g.facts('breathe'), subs = w.g.facts('step').filter(x => x.step === 'breathe' && x.phase === 'sub'), entry = w.state.log.filter(e => e.kind === 'breathe').at(-1);
      const end = f.find(x => x.phase === 'end'), soiled = w.g.facts('body-event').filter(x => x.kind === 'soil').length;
      console.log(`      whole: ${subs.length} sub-steps (${subs.map(x => `"${x.text}" ${x.toMs - x.fromMs} ms${x.grade ? ` ${x.grade}` : ''}`).join(', ')}), ${end.untilMs - end.fromMs} ms from T + ${end.fromMs - t0}, shed ${end.shedPts}, cut ${end.cut}; J: "${entry?.text}"; the hands soiled ${soiled} times`);
      assert(subs.length === 4 && subs.every(x => x.toMs - x.fromMs === 1000 && !x.grade) && end.untilMs - end.fromMs === BREATHE_MS && Math.abs(end.shedPts - 8) < 0.01 && !end.cut && /^Breathed 4\.0 s: the chaos \d+ → \d+\.$/.test(entry?.text ?? '') && !soiled, JSON.stringify({ end, entry, soiled }));
      // (cut by a sighting: the lane's turner turned 1.0 s into it, seen in its second sub-step)
      const c = bayGame({ tier: 'private' });
      feltTo(c.state, c.pid, 30);
      past(c, SUPP_GRACE_MS + 500);
      c.g.step(1, { act: ['breathe'] });
      const from = c.g.facts('breathe')[0].fromMs;
      runTo(c.g, s => s.clock.ms >= from + 1000, {}, 40);
      turn(c.g, [LANE]);
      runTo(c.g, s => s.stop?.mode === 'stop' && isHeld(s), {}, 200);
      const ce = c.g.facts('breathe').find(x => x.phase === 'end'), seen = contactOf(c.state)?.last?.seenMs;
      console.log(`      cut by a sighting: seen at +${seen - from} ms into it, cut at +${ce.untilMs - from} ms (the second sub-step's end), shed ${ce.shedPts}, cut ${ce.cut}; the pause at +${c.state.clock.ms - from} ms, in the mode via ${c.state.stop?.via}`);
      assert(seen - from >= 1000 && seen - from < 2000 && ce.untilMs - from === 2000 && ce.cut && Math.abs(ce.shedPts - 4) < 0.01 && c.state.stop?.via === 'contact', JSON.stringify({ ce, seen: seen - from }));
      // (cut by a bang 0.5 s into it: the startle cuts it at its sub-step's end)
      const b = bayGame({ tier: 'recruit' });
      feltTo(b.state, b.pid, 30);
      past(b, SUPP_GRACE_MS + 500);
      b.g.step(1, { act: ['breathe'] });
      const bf = b.g.facts('breathe')[0].fromMs;
      runTo(b.g, s => s.clock.ms >= bf + 500, {}, 20);
      bang(b.state, b.g.bus, { id: 'test:cut', x: b.me.x - 1.5, z: b.me.z });
      runTo(b.g, s => !s.stop || s.stop.doing?.step !== 'breathe', {}, 100);
      const be = b.g.facts('breathe').find(x => x.phase === 'end'), bs = blockOf(b.state, b.pid);
      console.log(`      cut by a bang at +500 ms: startled ${bs.startleUntilMs - bs.startleFromMs} ms, Breathe ended at +${be.untilMs - bf} ms, cut ${be.cut}, shed ${be.shedPts} (its 0.5 s before the bang, × 2 a second, narrowed by the bang's saturating add; the bang's grace began again, so nothing past it)`);
      assert(be.cut && be.untilMs - bf === 1000 && be.shedPts > 0.5 && be.shedPts < 1, JSON.stringify(be));
    },
  },
  {
    name: 'breathe: in the mode, chosen from the panel: the clock runs its 4 s and holds again at its end; a second Breathe since the last input begins from the pool the first left (its drain folded in, never given back); out of the mode on test-pairs\' standby the turn stays armed through it',
    fn() {
      // (test-pairs' standby on its own point (the fixture's point is off the line's box, which stops the line after 8 s); in the
      // mode before the turn, so the turn is put off)
      const wg = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'private', setup: 'standby:1' });
      wg.step(2);
      const w = { g: wg, state: wg.state, pid: wg.state.player.id };
      w.g.step(1, { act: ['shoot'] });
      // (time stands still in the mode: the block written past its grace, the last input 3 s ago)
      feltTo(w.state, w.pid, 70, w.state.clock.ms, 3000);
      const ended = (n) => (s) => w.g.facts('breathe').filter(x => x.phase === 'end').length >= n;
      const t0 = w.state.clock.ms, pool0 = suppAt(blockOf(w.state, w.pid), t0);
      w.g.step(1, { act: [{ act: 'stop', args: { step: 'breathe' } }] });
      runTo(w.g, ended(1), {}, 200);
      const t1 = w.state.clock.ms, pool1 = suppAt(blockOf(w.state, w.pid), t1), chained = w.state.stop?.doing?.step ?? (isHeld(w.state) ? 'held' : 'running');
      w.g.step(1, { act: [{ act: 'stop', args: { step: 'breathe' } }] });
      const t1b = w.state.clock.ms, pool1b = suppAt(blockOf(w.state, w.pid), t1b);
      runTo(w.g, ended(2), {}, 200);
      const t2 = w.state.clock.ms, pool2 = suppAt(blockOf(w.state, w.pid), t2), ends = w.g.facts('breathe').filter(x => x.phase === 'end');
      console.log(`      in the mode: pool ${fmt(pool0, 2)} → ${fmt(pool1, 2)} in ${(t1 - t0) / 1000} s (then ${chained}); a second Breathe begins a tick later at ${fmt(pool1b, 2)} and leaves ${fmt(pool2, 2)} after ${(t2 - t1b) / 1000} s, ${fmt(pool1 - pool2, 2)} under the first's end (4 s × 2 × 2: its drain folded in, never given back); shed ${ends.map(e => e.shedPts).join(' and ')}`);
      assert(t1 - t0 === BREATHE_MS && Math.abs(pool0 - pool1 - 16) < 0.02 && pool1b <= pool1 && Math.abs(pool1 - pool2 - 16) < 0.02 && ends.length === 2 && ends.every(e => Math.abs(e.shedPts - 8) < 0.01), JSON.stringify({ t: t1 - t0, pool0, pool1, pool1b, pool2, ends }));
      // (test-pairs' standby, out of the mode, the turn armed: Breathe as a live step keeps it armed)
      const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'recruit', setup: 'standby:1' }), s = g.state, pid = s.player.id;
      g.step(2);
      feltTo(s, pid, 40);
      const armed0 = s.armoury.range.str?.turnAtMs ?? null;
      g.clearFacts();
      g.step(1, { act: ['breathe'] });
      const live = s.stop?.mode === 'live' && s.stop.doing?.step === 'breathe';
      runTo(g, st => st.stop?.mode === 'stop' && isHeld(st), {}, 200);
      const turned = g.facts('turner').find(f => f.phase === 'turn'), be = g.facts('breathe').find(f => f.phase === 'end'), bs = g.facts('breathe').find(f => f.phase === 'start');
      console.log(`      test-pairs standby:1, the recruit at felt 40: the turn armed for +${armed0 - bs.fromMs} ms after Breathe began live (${live}); the turner turned at +${turned ? turned.atMs - bs.fromMs : 'NEVER'} ms (pairs.js outOfIt, the scene role's hook: a live Breathe is out of it and still); Breathe cut at +${be.untilMs - bs.fromMs} ms (${be.cut ? 'cut' : 'whole'}), the pause via ${s.stop?.via}`);
      assert(live && turned && turned.atMs === armed0 && be.cut && s.stop?.via === 'contact', JSON.stringify({ live, armed0, turned, be }));
    },
  },
  {
    name: 'breathe: an input landing while it runs keeps what the window shed before it (the code review of 0.0.10: read at the end alone, a blank 2 s in left "shed 1" where it took 4.96 off, a bang "shed 0" where it took 2.80; a gap kept as drained would say 4, so it is carried × (1 − pts / SUPP_MAX) through the input\'s saturating add): the \'breathe\' fact\'s shedPts within 0.1 of the pool against the same run without Breathe',
    fn() {
      const rows = [];
      for (const kind of ['blank', 'bang']) {
        const pools = {};
        let end = null, entry = null;
        for (const withBreathe of [true, false]) {
          const b = bayGame({ tier: 'recruit' });
          feltTo(b.state, b.pid, 40);
          past(b, SUPP_GRACE_MS + 1000);
          const t0 = b.state.clock.ms;
          b.g.step(1, withBreathe ? { act: ['breathe'] } : {});
          past(b, 1950);
          const me = b.state.actors.list.find(x => x.who === b.pid);
          if (kind === 'blank') shotNoise(b.state, b.g.bus, { id: 'test:blank', x: me.x + 0.9, z: me.z, byId: 'nobody', blank: true });
          else bang(b.state, b.g.bus, { id: 'test:bang', x: me.x - 3, z: me.z });
          runTo(b.g, s => s.clock.ms >= t0 + 8000, {}, 400);
          pools[withBreathe] = suppAt(blockOf(b.state, b.pid), b.state.clock.ms);
          if (withBreathe) { end = b.g.facts('breathe').find(x => x.phase === 'end'); entry = b.state.log?.entries?.findLast?.(e => e.kind === 'breathe') ?? null; }
        }
        const truth = pools.false - pools.true;
        rows.push({ kind, truth, shed: end?.shedPts, cut: end?.cut, ms: end ? end.untilMs - end.fromMs : null });
      }
      console.log(`      ${rows.map(r => `a ${r.kind} 2 s into it (${r.cut ? `cut at ${r.ms} ms` : `whole, ${r.ms} ms`}): the pool ${fmt(r.truth, 2)} under the run without Breathe 8 s on, the fact's shed ${r.shed}`).join('; ')}`);
      assert(rows.every(r => Number.isFinite(r.shed) && Math.abs(r.shed - r.truth) < 0.1 && r.truth > 2), JSON.stringify(rows));
    },
  },
  {
    name: 'breathe: a save at its start + 1, + 20 and + 60 ticks loads to the same digest and the same tick as the unsaved run (the window and the step are plain data)',
    fn() {
      const mk = () => { const w = bayGame({ tier: 'private' }); feltTo(w.state, w.pid, 50); w.g.step(Math.ceil((SUPP_GRACE_MS + 500) / TICK_MS)); w.g.step(1, { act: ['breathe'] }); return w; };
      const ref = mk(), rows = [];
      const saves = {};
      for (let n = 1; n <= 100; n++) { ref.g.step(1); if ([1, 20, 60].includes(n)) saves[n] = ref.g.save(); }
      const want = ref.g.digest(), tick = ref.state.clock.ms;
      for (const [n, json] of Object.entries(saves)) {
        const h = createGame({ scenario: 'test-handling', seed: 48213 });
        h.load(json); h.step(100 - Number(n));
        rows.push({ n: Number(n), same: h.digest() === want && h.state.clock.ms === tick, errors: h.errors.length });
      }
      console.log(`      ${rows.map(r => `saved at + ${r.n} ticks: ${r.same ? 'the same digest and tick' : 'DIFFERENT'}`).join('; ')} (${want})`);
      assert(rows.every(r => r.same && !r.errors), JSON.stringify(rows));
    },
  },
];
