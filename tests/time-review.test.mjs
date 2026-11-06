// The review of v0.0.4, pinned (TIME §5.3, §7.5, §8, §9.5; the build sheet 0.0.4 §2.2): a resumed
// shower ends in what was worn into it and credits the water once over both halves; a shower fitted
// in lands in a towel, cut short, with a resume left; R pressed again while the rise plays starts
// nothing and the figure never jumps; the count counts the player only standing mustered at its
// second (mustered and gone: 12 of 13), stand fast at the rack's foot is R's first offer once
// mustered and lands at the count and at the stand-down, sleeping in the drill is late; sleep is never
// offered past reveille, nor "until reveille" where it would not end on it; a woman's body grows no
// stubble (no band, no cue, no shave at the basin, no line); past the count the klaxon's line says you
// missed it; T with no line seen does nothing. Each check fails without its fix.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { startActivity, planOf, nextReveilleMs } from '../src/sim/time/activities.js';
import { handOffer } from '../src/sim/places/hand.js';
import { figureOf } from '../src/sim/people/figure.js';
import { outfitOf, riseActor, RISE_MS } from '../src/sim/people/place.js';
import { transPlaying } from '../src/sim/time/doing.js';
import { bodyOf } from '../src/sim/body/body.js';
import { stagesOf, cuesOf, wordsOf } from '../src/sim/body/cues.js';
import { firedNow, instinctAction, instinctNow } from '../src/sim/skills/instinct.js';
import { NO_BUDGET } from '../src/sim/time/skip.js';
import { areaOf } from '../src/sim/places/model.js';
import { spotsOf } from '../src/sim/places/fixtures.js';
import { marsClock } from '../src/core/calendar.js';
import { SITES } from '../src/data/setting/calendar.js';
import { TICK_MS, MIN_MS } from '../src/core/clock.js';

const SEED = 48213, LON = SITES.melas.lonEDeg, AREA = 'melas.echo.1';
const STALL = 'f:e1:head-2a:shower-2#1', FOOT = 'f:e1:bay-2-1:rack-n1#1';
const ctxOf = (g) => ({ held: false, tickMs: TICK_MS, sim: g.sim });
const hm = (ms) => { const c = marsClock(ms, LON); return c.timeslip ? `24:00 +${Math.floor(c.slipMs / MIN_MS)}` : `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}:${String(c.second).padStart(2, '0')}`; };
const spot = (id) => { const fx = areaOf(AREA).fixtures.find(f => id.startsWith(f.id + '#')); return spotsOf(fx).find(s => s.id === id); };
const putAt = (g, id) => { const sp = spot(id); Object.assign(g.me(), { x: sp.x, z: sp.z, face: sp.face ?? 'down', $px: sp.x, $pz: sp.z }); return sp; };
const water = (g, from = 0) => g.facts('body-event').slice(from).filter(e => e.kind === 'wash').reduce((a, e) => a + (e.amount ?? 0), 0);

// (test-night slept to the klaxon, the player lying in the rack at 02:30)
function atKlaxon() {
  const g = createGame({ scenario: 'test-night', seed: SEED });
  g.step(1, { act: [{ act: 'hand', args: { want: 'activity' } }] });
  return g;
}
// (up from the rack and dressed at its foot: mustered)
function mustered0(g) {
  const s = g.state;
  riseActor(s, g.me(), s.clock.ms);
  g.step(Math.ceil(RISE_MS / TICK_MS) + 2);
  const r = startActivity(s, g.bus, ctxOf(g), { id: 'dress', spotId: FOOT, args: { to: 'utilities' } });
  g.step(1);
  g.step(Math.ceil(1000 / TICK_MS) + 1);                        // (the muster check runs on whole seconds)
  return r;
}

export default [
  {
    name: 'a shower cut at minute 2 and finished by R ends in the utilities worn into it, not the towel it was cut in, the water credited once across both halves (3 of its 3 minutes)',
    fn() {
      const g = createGame({ scenario: 'test-shower', seed: SEED });
      const s = g.state;
      putAt(g, STALL);
      const t0 = s.clock.ms, w0 = g.facts('body-event').length;
      const r = startActivity(s, g.bus, ctxOf(g), { id: 'shower', spotId: STALL });
      g.advance(t0 + 2 * MIN_MS);
      g.advance(Infinity, NO_BUDGET, ['skip:stop']);
      const cut = { outfit: outfitOf(g.me()), resume: s.time.resume ? { ...s.time.resume } : null, water: water(g, w0) };
      const offer = handOffer(s);
      g.step(1, { act: [{ act: 'hand', args: { want: 'resume' } }] });
      const end = g.facts('skip-end').at(-1);
      const total = water(g, w0);
      console.log(`      cut at ${hm(cut.resume ? t0 + 2 * MIN_MS : 0)}: in ${cut.outfit}, ${fmt(cut.water, 2)} water min; R "${offer?.label}"; finished: in ${outfitOf(g.me())} (the strip's look ${end.outcome.look.outfit}), ${fmt(total, 2)} water min in all, "${end.outcome.activity.line}"`);
      assert(r.ok && cut.outfit === 'towel' && cut.resume?.outfit === 'utilities' && offer?.verb === 'resume', JSON.stringify({ r, cut, offer }));
      assert(outfitOf(g.me()) === 'utilities' && end.outcome.look.outfit === 'utilities' && end.outcome.activity.fraction === 1, JSON.stringify({ outfit: outfitOf(g.me()), look: end.outcome.look }));
      assert(Math.abs(total - 3) < 0.05, `the water across both halves: ${total} min`);
    },
  },
  {
    name: '"fit it in" a shower just after the klaxon: it lands cut short in a towel with a resume left and the water it lived, never the whole shower\'s effects in a fraction of its time',
    fn() {
      const g = atKlaxon(), s = g.state;
      riseActor(s, g.me(), s.clock.ms);
      g.step(Math.ceil(RISE_MS / TICK_MS) + 2);
      g.step(20 * 25);
      putAt(g, STALL);
      const p = planOf(s, 'shower', { spotId: STALL }), w0 = g.facts('body-event').length;
      const r = startActivity(s, g.bus, ctxOf(g), { id: 'shower', spotId: STALL, late: 'fit' });
      g.step(1);
      const end = g.facts('skip-end').at(-1), o = end.outcome.activity;
      console.log(`      at ${hm(end.fromMs)} the late check: fit ${fmt(p.late.fitMs / 1000, 0)} s of the shower's 600 s; fitted: ${fmt((end.toMs - end.fromMs) / 1000, 0)} s, fraction ${fmt(o.fraction, 3)}, parts ${o.parts.join(', ')}, in ${outfitOf(g.me())}, ${fmt(water(g, w0), 2)} water min, a resume of ${fmt((s.time.resume?.remainingMs ?? 0) / 60000, 1)} min; "${o.line}"`);
      assert(r.ok && p.late && o.fraction < 0.5 && outfitOf(g.me()) === 'towel' && s.time.resume?.activity === 'shower', JSON.stringify({ r, o, resume: s.time.resume }));
      assert(water(g, w0) < 3 * o.fraction * 2 + 0.01 && !o.parts.includes('dress') && /cut short/.test(o.line), JSON.stringify({ water: water(g, w0), parts: o.parts }));
    },
  },
  {
    name: 'R pressed again 0.25 s into the rise at the klaxon starts nothing: no offer while the rise plays, the activity refused, the figure never jumping more than a cell between frames',
    fn() {
      const g = atKlaxon(), s = g.state;
      g.step(1, { act: [{ act: 'hand', args: { want: 'rise' } }] });
      let prev = figureOf(s, g.me(), s.clock.ms), maxStep = 0, offered = 0, refused = null;
      for (let i = 0; i < Math.ceil(RISE_MS / TICK_MS) + 4; i++) {
        if (transPlaying(g.me(), s.clock.ms) && handOffer(s)) offered++;
        if (i === 5) {
          refused = startActivity(s, g.bus, ctxOf(g), { id: 'dress', spotId: FOOT, args: { to: 'utilities' } });
          g.step(1, { act: [{ act: 'hand', args: {} }] });
        } else g.step(1);
        for (const k of [0.25, 0.5, 0.75, 1]) {
          const f = figureOf(s, g.me(), s.clock.ms - TICK_MS + k * TICK_MS);
          maxStep = Math.max(maxStep, Math.hypot(f.x - prev.x, f.z - prev.z) + Math.abs((f.y ?? 0) - (prev.y ?? 0)));
          prev = f;
        }
      }
      const started = g.facts('skip-start').filter(f => f.activity === 'dress').length;
      console.log(`      the rise ${RISE_MS} ms: offers while it played ${offered}; R again at 0.25 s: ${refused?.why}; dress skips started ${started}; the largest step between frames ${fmt(maxStep, 3)} m`);
      assert(refused && !refused.ok && refused.why === 'busy' && started === 0 && maxStep <= 0.25, JSON.stringify({ refused, started, maxStep }));
      assert(offered === 0, `offers while the rise played: ${offered}`);
    },
  },
  {
    name: 'mustered on time, then gone to the showers: the count says 12 of 13 and marks the arrival left; standing mustered it says 13 of 13 (the count counts who stands there at its second)',
    fn() {
      const g = atKlaxon(), s = g.state;
      mustered0(g);
      const arrived = s.time.attend.at(-1);
      putAt(g, STALL);
      g.run(s.time.drills.open.dueMs - s.clock.ms + 2000);
      const count = s.log.filter(e => /counts the bay/.test(e.text ?? '')).at(-1), rec = s.time.attend.find(a => a.dueMs === arrived.dueMs && a.arrivedMs === arrived.arrivedMs);
      // (and standing there: counted)
      const g2 = atKlaxon(), s2 = g2.state;
      mustered0(g2);
      g2.run(s2.time.drills.open.dueMs - s2.clock.ms + 2000);
      const count2 = s2.log.filter(e => /counts the bay/.test(e.text ?? '')).at(-1);
      console.log(`      mustered ${hm(arrived.arrivedMs)} (${arrived.class}), then to the showers: "${count?.text}", the arrival left at ${rec?.leftMs ? hm(rec.leftMs) : 'never'}; standing there: "${count2?.text}"`);
      assert(arrived.class === 'on-time' && /12 of 13/.test(count?.text ?? '') && Number.isFinite(rec?.leftMs), JSON.stringify({ arrived, count, rec }));
      assert(/13 of 13/.test(count2?.text ?? ''), count2?.text);
    },
  },
  {
    name: 'mustered at the rack\'s foot, R offers "stand fast" first (no sleep, the review\'s 25 minutes of standing), which lands at the count for its beat and again at the stand-down; sleeping instead is late, and the count then says 12 of 13',
    fn() {
      const g = atKlaxon(), s = g.state;
      mustered0(g);
      const o = handOffer(s), sleep = o.more.find(m => m.id === 'sleep');
      g.step(1, { act: [{ act: 'hand', args: { want: 'activity' } }] });
      const a = g.facts('skip-end').at(-1), d = s.time.drills.open;
      const count = s.log.filter(e => /counts the bay/.test(e.text ?? '')).at(-1);
      const o2 = handOffer(s);
      g.step(1, { act: [{ act: 'hand', args: { want: 'activity' } }] });
      const b = g.facts('skip-end').at(-1);
      console.log(`      R at ${hm(a.fromMs)}: "${o.label}" (then ${o.more.map(m => m.label.split(' · ')[0]).join(', ')}; the sleep late: ${!!sleep?.late}); stood fast to ${hm(a.toMs)} (${a.interrupted ? 'stopped by the count' : 'its end'}): "${count?.text}"; R again "${o2?.label}", to ${hm(b.toMs)}`);
      assert(o.id === 'standfast' && sleep?.late && a.activity === 'standfast' && a.toMs === d.dueMs && a.interrupted && /13 of 13/.test(count?.text ?? ''), JSON.stringify({ o: o.label, a: [a.activity, a.toMs, d.dueMs] }));
      assert(o2?.id === 'standfast' && b.toMs === s.time.drills.last.endMs && b.interrupted, JSON.stringify({ o2: o2?.label, b: [b.toMs, s.time.drills.last.endMs] }));
      // (sleeping at 02:33, mustered: the late card's "do it anyway", and the count finds the rack's foot empty)
      const g3 = atKlaxon(), s3 = g3.state;
      mustered0(g3);
      const o3 = handOffer(s3), sl = o3.more.find(m => m.id === 'sleep');
      g3.step(1, { act: [{ act: 'hand', args: { want: 'activity', id: sl.id, args: sl.args, late: 'accepted' } }] });
      const c3 = s3.log.filter(e => /counts the bay/.test(e.text ?? '')).at(-1), e3 = g3.facts('skip-end').at(-1);
      console.log(`      sleeping instead at ${hm(e3.fromMs)}: woken at ${hm(e3.toMs)} by the count (${e3.interrupted}); "${c3?.text}"`);
      assert(/12 of 13/.test(c3?.text ?? '') && e3.toMs === s3.time.drills.open.dueMs, JSON.stringify({ c3, to: e3.toMs }));
    },
  },
  {
    name: 'sleep is never offered past reveille, nor "until reveille" where the plan would not end on it (05:12, 05:24 and 05:29 at the rack: no sleep, no nap; at 21:55 every choice done by 05:30)',
    fn() {
      const rows = [];
      for (const h of [5 + 12 / 60, 5 + 24 / 60, 5 + 29 / 60, 21 + 55 / 60]) {
        const g = createGame({ scenario: 'barracks', seed: SEED, hour: h });
        const s = g.state;
        putAt(g, FOOT);
        const o = handOffer(s), all = [o, ...(o?.more ?? [])].filter(Boolean), rev = nextReveilleMs(s);
        const sleeps = all.filter(c => c.id === 'sleep' || c.id === 'nap');
        const past = sleeps.filter(c => (c.endMs ?? s.clock.ms + c.durMs) > rev), until = all.find(c => /until reveille/.test(c.label));
        rows.push(`${hm(s.clock.ms)}: ${all.map(c => c.label).join(' | ')}`);
        assert(!past.length, `offered past reveille at ${hm(s.clock.ms)}: ${past.map(c => c.label).join(', ')}`);
        if (until) assert(/done 05:30/.test(until.label), until.label);
      }
      for (const r of rows) console.log(`      ${r}`);
    },
  },
  {
    name: 'a woman\'s body grows no stubble: at 30 h no stubble band, no cue, no Shave row, the basin 3 min with no shave and the DI silent about a razor',
    fn() {
      const g = createGame({ scenario: 'test-shower', seed: SEED });
      const s = g.state, pid = s.player.id, p = s.people[pid];
      p.sex = 'f'; p.body.tmpl = 'f-adult';
      p.body.hygiene = { ...(p.body.hygiene ?? {}), stubbleH: 30 };
      const b = bodyOf(s, pid), st = stagesOf(b, s.clock.ms, LON), cu = cuesOf(b, s.clock.ms, LON), wd = wordsOf(b, s.clock.ms, LON);
      const basin = planOf(s, 'basin', { spotId: 'f:e1:head-2a:sinks-1#1' });
      putAt(g, 'f:e1:head-2a:sinks-1#1');
      const lines = firedNow(s).map(l => l.id);
      // (and a man's, the same 30 h: shown, shaved, named)
      p.sex = 'm'; p.body.tmpl = 'm-adult';
      const bm = bodyOf(s, pid), stm = stagesOf(bm, s.clock.ms, LON), basinM = planOf(s, 'basin', { spotId: 'f:e1:head-2a:sinks-1#1' });
      console.log(`      a woman at 30 h: stubble ${st.stubble.band} (i ${st.stubble.i}), stubbleK ${cu.stubbleK}, rows ${wd.needs.map(n => n.need).join(' ')}, the basin ${basin.durMs / 60000} min (${basin.parts.map(x => x.part).join(', ')}); the DI: ${lines.join(', ') || 'nothing'}; a man: ${stm.stubble.band}, the basin ${basinM.durMs / 60000} min`);
      assert(st.stubble.i === 0 && cu.stubbleK === 0 && !wd.needs.some(n => n.need === 'stubble') && basin.durMs === 180_000 && !lines.includes('stubble'), JSON.stringify({ st: st.stubble, cu: cu.stubbleK, basin: basin.durMs, lines }));
      assert(stm.stubble.i > 0 && basinM.durMs === 420_000, JSON.stringify({ stm: stm.stubble, basin: basinM.durMs }));
    },
  },
  {
    name: 'past the count the klaxon\'s line says you missed it, never "the count is at 02:35"; T sent with no line seen does nothing',
    fn() {
      const g = atKlaxon(), s = g.state;
      riseActor(s, g.me(), s.clock.ms);
      g.step(Math.ceil(RISE_MS / TICK_MS) + 2);
      putAt(g, STALL);
      g.run(s.time.drills.open.dueMs - s.clock.ms + 60_000);
      const line = instinctNow(s).line;
      // (T with the page's "no line seen": nothing, even with a line up now)
      const before = JSON.stringify([g.me().x, g.me().z, s.time.doing ?? null, s.skip ?? null]);
      const did = instinctAction(s, { act: 'instinct', args: { id: null, act: null } }, g.bus, ctxOf(g));
      console.log(`      ${hm(s.clock.ms)}, the count past and not mustered: "${line?.text}" (${line?.id}, ${line?.variant}); T with no line seen: ${did}`);
      assert(line?.id === 'alarm' && line.variant === 'late' && !/is at/.test(line.text), JSON.stringify(line));
      assert(did === false && before === JSON.stringify([g.me().x, g.me().z, s.time.doing ?? null, s.skip ?? null]), 'T did something');
    },
  },
];
