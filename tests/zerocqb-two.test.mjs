// OLYMPUS tests: your #2's brace and cue at the trunk, F129 (v0.0.25, "Hold to hold"; its build sheet §6 B, §8; PL§7; COMBAT §14.8).
//
// On A's bare Wreck with an operation open (tests/void-run.mjs), held and printed:
//   1. the brace from your transit's start to your plant, never longer, never absent: taken at the transit's first tick ("Got you."),
//      held across the trunk (footing.js heldBy's 'buddy' through actor.anchorVia, the pair 60 m apart in the plan and his reach to the
//      scuttle within FOOTING.BUDDY_M), the footing 'braced' on every tick of it, gone at the plant (your boots in its place);
//   2. or let go LET_AFTER_MS 0.2 s after your first round fired from it (two.js voidTick, "Through."), a hand on the coaming then;
//      never taken where he is not ready: no hand out (the transit waits on it TWO_WAIT_MS 3 s, as the door's hand waits on him, then
//      goes on the coaming's hold), or out of reach (1.5 m from the scuttle);
//   3. his cue (bundle.js entryGo on the hold's plan): never while you hang in his grip, at your plant or at his letting go; his own
//      "Through.", transit and plant on the scuttle's other side from it, through the trunk within 3 s of the cue (F25 re-read);
//   3b. a man taken in as you come through (a contact's window open, state.mind.contact.pending): the plant waits in his grip, so the
//      pause comes on the brace and the pair goes from it, then plants once the window has closed;
//   4. his boots locked with yours through your transit (two.js twoBoots: not released while his grip holds you, which v0.0.24's
//      mirror did 300 ms in).
//   5. feet aft under a burn's warning (places/gravity.js setProfile, the Wreck's tug: C's lane sets it at GO): your #2 on the deckhead
//      says "Feet aft." once and is on the deck on his boots within the face change's 1.5 s; the DI's rule 'aft' (skills/instinct/
//      base.js) gives you "Feet aft." with T's act 'anchor:face:aft', which puts your boots on the deck; on the deck it is silent.
//   6. (the review of v0.0.25's E, A and B, failing without its fix) his lines through the trunk are heard at the scuttle on your deck:
//      "Got you." (said once the deck has changed with you) and "Through." carry `at`, deck 6's end of the trunk under its deckhead,
//      inside the picture round you (render/scale.js MAX_VIEW_M), while he stands 58 m off in the plan; on one deck, none.
// The lane's halves (F2 and F26 on the bulkhead hatches) are C's, on test-zerocqb's lanes.
import { assert } from './helpers.mjs';
import { wreckOp, voidDoing, runFor, holdPlan, TRUNK } from './void-run.mjs';
import { footingOf, buddyGapM, bootsLocked } from '../src/sim/body/footing.js';
import { entryGo, TWO_WAIT_MS } from '../src/sim/combat/bundle.js';
import { kindOf } from '../src/sim/combat/stepper.js';
import { FOOTING, VOID } from '../src/data/body/needs.js';
import { TICK_MS } from '../src/core/clock.js';
import { setProfile } from '../src/sim/places/gravity.js';
import { setOnFace, setAnchor, onFaceOf } from '../src/sim/body/footing.js';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { anchorAction } from '../src/sim/arms/shooting.js';
import { faceMsOf } from '../src/sim/combat/drills/void.js';
import { MAX_VIEW_M } from '../src/render/scale.js';
import { heardAt } from '../src/sim/combat/bundle.js';

// (#2's hand out, then #1's transit and plant, every tick: the anchor, the gap in the plan and through the trunk, his boots, the cue)
function trace(w, { plant = true, round = null, ready = true } = {}) {
  const s = w.s, me = w.me(), two = w.two(), plan = holdPlan(), rows = [];
  if (ready) runFor(w, [voidDoing(s, w.twoPid, ['brace'], { slot: 2 })], 1);
  const d = voidDoing(s, w.pid, plant ? ['hatch', 'plant'] : ['hatch']), t0 = s.clock.ms;
  runFor(w, [d], 70, (i) => {
    if (round !== null && i === round) w.H.rooms[0].rounds += 1;
    const F = footingOf(s, w.pid);
    rows.push({ ms: s.clock.ms - t0, anchor: me.anchor, mode: F.mode, hold: F.hold, via: me.anchorVia ?? null, plan: Math.round(Math.hypot(me.x - two.x, me.z - two.z) * 100) / 100, gap: me.anchor === 'buddy' ? Math.round(buddyGapM(s, me, two, me.anchorVia) * 1000) / 1000 : null, his: bootsLocked(s, w.twoPid), cue: entryGo(s, plan, me, s.clock.ms) });
  });
  return { d, rows, said: w.g.facts('say').filter(x => x.who === w.twoPid).map(x => x.text) };
}
const span = (rows, f) => { const i = rows.findIndex(f), j = rows.findLastIndex(f); return i < 0 ? null : [rows[i].ms, rows[j].ms]; };

export default [
  {
    name: 'zerocqb-two (F129): the brace from your transit\'s first tick to your plant, held across the trunk (60 m apart in the plan, his reach to the scuttle within BUDDY_M), the footing braced on every tick of it; "Got you."',
    fn() {
      const w = wreckOp(), { d, rows, said } = trace(w);
      const hatch = d.beats.find(b => b.key === 'hatch'), plant = d.beats.find(b => b.key === 'plant'), t0 = d.fromMs;
      const braced = span(rows, r => r.mode === 'braced' && r.hold === 'buddy'), gaps = rows.filter(r => r.gap !== null).map(r => r.gap), plans = rows.filter(r => r.gap !== null).map(r => r.plan);
      const holes = rows.filter(r => r.ms < plant.untilMs - t0 && r.mode !== 'braced').length, after = rows.filter(r => r.ms >= plant.untilMs - t0 && r.anchor === 'buddy').length;
      console.log(`      the transit ${hatch.fromMs - t0}–${hatch.untilMs - t0} ms, the plant to ${plant.untilMs - t0} ms; braced ${JSON.stringify(braced)} ms; ticks unbraced before the plant ${holes}, gripped after it ${after}`);
      console.log(`      in the grip: the plan's gap ${Math.min(...plans)}–${Math.max(...plans)} m, his reach to the scuttle ${Math.min(...gaps)}–${Math.max(...gaps)} m (BUDDY_M ${FOOTING.BUDDY_M}); his words ${JSON.stringify(said)}`);
      assert(braced && braced[0] <= TICK_MS && braced[1] < plant.untilMs - t0 && holes === 0 && after === 0, JSON.stringify({ braced, holes, after, plant: plant.untilMs - t0 }));
      assert(Math.min(...plans) > 55 && Math.max(...gaps) <= FOOTING.BUDDY_M && said.includes('Got you.'), JSON.stringify({ plans: [Math.min(...plans), Math.max(...plans)], gaps: Math.max(...gaps), said }));
    },
  },
  {
    name: 'zerocqb-two (F129): the grip let go LET_AFTER_MS after your first round from it ("Through."), a hand on the coaming then; never taken where he is not ready (no hand out, or 1.5 m from the scuttle)',
    fn() {
      const w = wreckOp(), { rows, said } = trace(w, { plant: false, round: 6 });
      const fired = rows[6].ms, let0 = rows.find(r => r.anchor !== 'buddy' && r.ms > 0);
      const N = wreckOp(), noHand = trace(N, { ready: false });
      const F = wreckOp(); const two = F.two(); two.x += 0.8; F.keep();
      const far = trace(F);
      console.log(`      a round at ${fired} ms: the grip let go at ${let0?.ms} ms (${let0 ? let0.ms - fired : '–'} ms after), then ${let0?.anchor}/${let0?.mode}; his words ${JSON.stringify(said)}`);
      const waited = noHand.rows.find(r => r.anchor !== 'boots')?.ms ?? null;
      console.log(`      no hand out: ${[...new Set(noHand.rows.map(r => r.anchor))].join(' → ')}, the transit waiting on it ${waited} ms (TWO_WAIT_MS ${TWO_WAIT_MS}); 1.5 m from the scuttle: ${[...new Set(far.rows.map(r => r.anchor))].join(' → ')}`);
      assert(waited !== null && waited >= TWO_WAIT_MS && waited <= TWO_WAIT_MS + 2 * TICK_MS, JSON.stringify({ waited }));
      assert(let0 && let0.ms - fired >= VOID.LET_AFTER_MS && let0.ms - fired <= VOID.LET_AFTER_MS + TICK_MS && let0.anchor === 'handhold' && said.includes('Through.'), JSON.stringify({ fired, let0, said }));
      assert(!noHand.rows.some(r => r.anchor === 'buddy') && !far.rows.some(r => r.anchor === 'buddy'), JSON.stringify({ noHand: noHand.rows[0], far: far.rows[0] }));
    },
  },
  {
    name: 'zerocqb-two (F129, F25 re-read): his cue never while you hang in his grip, at your plant; his "Through.", transit and plant on the scuttle\'s other side from it, through the trunk within 3 s of the cue',
    fn() {
      const w = wreckOp(), { rows } = trace(w), cue = rows.find(r => r.cue), before = rows.filter(r => r.anchor === 'buddy' && r.cue).length;
      // (his entry from his cue, as his runSlot plans his room:in at a deck hatch (bundle.js hatchBeats): "Through.", the transit, the plant)
      const t0 = w.s.clock.ms, his = voidDoing(w.s, w.twoPid, ['let', 'hatch', 'plant'], { slot: 2 });
      let crossMs = null;
      runFor(w, [his], 70, () => { if (crossMs === null && w.two().x >= 30) crossMs = w.s.clock.ms - t0; });
      const two = w.two(), me = w.me();
      const said = w.g.facts('say').filter(x => x.who === w.twoPid).map(x => x.text);
      console.log(`      the cue at ${cue?.ms} ms (cued while gripped ${before}); his crossing ${crossMs} ms after it, then ${two.onFace}/${two.anchor} at (${two.x.toFixed(2)}, ${two.z.toFixed(2)}), you at (${me.x.toFixed(2)}, ${me.z.toFixed(2)}); his words ${JSON.stringify(said)}`);
      assert(cue && before === 0 && crossMs !== null && crossMs <= 3000 && two.onFace === 'deckhead' && two.anchor === 'boots', JSON.stringify({ cue, before, crossMs, two: { onFace: two.onFace, anchor: two.anchor } }));
      assert(said.join() === 'Got you.,Through.', JSON.stringify(said));
      assert(Math.sign(two.x - 64.6) !== Math.sign(me.x - 64.6), 'the scuttle\'s other side');
    },
  },
  {
    name: 'zerocqb-two (F129): his boots stay locked through your transit and plant (his grip holds you on them), with yours after it',
    fn() {
      const w = wreckOp(), { rows } = trace(w), unlocked = rows.filter(r => !r.his).length;
      console.log(`      ${rows.length} ticks: his boots unlocked on ${unlocked}; yours at the end ${rows.at(-1).anchor}`);
      assert(unlocked === 0 && rows.at(-1).anchor === 'boots', JSON.stringify({ unlocked, end: rows.at(-1) }));
    },
  },
  {
    name: 'zerocqb-two: feet aft under a burn\'s warning: your #2 on the deckhead says "Feet aft." once and is on the deck within 1.5 s; the DI\'s rule \'aft\' gives you "Feet aft." and T\'s act puts your boots on the deck; on the deck, silent',
    fn() {
      const w = wreckOp(), s = w.s, two = w.two(), me = w.me();
      two.x = 65.6; two.z = 3.6; w.keep(); setOnFace(s, w.twoPid, 'deckhead'); setAnchor(s, w.twoPid, 'boots');
      me.x = 63.6; me.z = 3.6; setOnFace(s, w.pid, 'deckhead'); setAnchor(s, w.pid, 'boots');
      setProfile(s, [{ kind: 'burn', toG: 0.2, atS: 20, warnS: 15, holdS: 3 }]);
      let warnAt = null, hisDeckAt = null, line = null;
      runFor(w, [], 160, () => {
        if (warnAt === null && w.g.facts('say').some(x => /Secure for burn/.test(x.text ?? ''))) { warnAt = s.clock.ms; line = instinctNow(s).line; }
        if (warnAt !== null && hisDeckAt === null && onFaceOf(s, w.twoPid) === 'deck' && two.anchor === 'boots') hisDeckAt = s.clock.ms;
      });
      const said = w.g.facts('say').filter(x => x.who === w.twoPid).map(x => x.text);
      // (T's act on your rule, lived to its end)
      const t0 = s.clock.ms, act = anchorAction(s, w.g.bus, line?.act?.replace(/^anchor:/, '') ?? 'none');
      let n = 0; while ((s.stop?.mode === 'live' || s.stop?.doing) && n < 80) { w.g.step(1); n++; }
      const mine = { face: onFaceOf(s, w.pid), anchor: me.anchor, ms: s.clock.ms - t0 }, after = instinctNow(s).line;
      console.log(`      the 1MC's warning, then his words ${JSON.stringify(said)}, on the deck ${hisDeckAt - warnAt} ms after it; your line "${line?.text}" (${line?.id}, act ${line?.act})`);
      console.log(`      T's act ${JSON.stringify(act)}: ${JSON.stringify(mine)}; the line on the deck ${after?.id ?? 'none'}`);
      assert(said.filter(x => x === 'Feet aft.').length === 1 && hisDeckAt !== null && hisDeckAt - warnAt <= faceMsOf(true) + 2 * TICK_MS, JSON.stringify({ said, warnAt, hisDeckAt }));
      assert(line?.id === 'aft' && line.act === 'anchor:face:aft' && act.ok && mine.face === 'deck' && mine.anchor === 'boots' && after?.id !== 'aft', JSON.stringify({ line, act, mine, after }));
    },
  },
  {
    name: 'zerocqb-two (F129): a man taken in as you come through: the plant waits in his grip while the window is open (the pause on the brace), and plants once it has closed',
    fn() {
      const w = wreckOp(), s = w.s, me = w.me();
      runFor(w, [voidDoing(s, w.twoPid, ['brace'], { slot: 2 })], 1);
      const d = voidDoing(s, w.pid, ['hatch']);
      runFor(w, [d], 25);
      // (the plant's handler as the stepper calls it at its start: a window open, then shut)
      const P = kindOf('plant'), b = { key: 'plant', k: 'plant', ch: 'feet', to: 'deckhead', ms: faceMsOf(false), hatch: TRUNK };
      (s.mind ??= {}).contact = { ...(s.mind.contact ?? {}), pending: { id: 'test', ids: [], seenMs: s.clock.ms, untilMs: s.clock.ms + 800 } };
      const held = P.run(s, w.g.bus, d, b, s.clock.ms), during = { faceTo: me.faceTo ?? null, mode: footingOf(s, w.pid).mode };
      delete s.mind.contact.pending;
      const went = P.run(s, w.g.bus, d, b, s.clock.ms), after = { faceTo: me.faceTo ?? null };
      console.log(`      the window open: ${JSON.stringify(held)}, ${JSON.stringify(during)}; shut: ms ${went.ms}, ${JSON.stringify(after)}`);
      assert(held.again && held.ms === TICK_MS && during.faceTo === null && during.mode === 'braced', JSON.stringify({ held, during }));
      assert(!went.again && went.ms === faceMsOf(false) && after.faceTo === 'deckhead', JSON.stringify({ went, after }));
    },
  },
  {
    name: 'zerocqb-two (the review of v0.0.25\'s E, A and B): his "Got you." and "Through." through the trunk are heard at the scuttle on your deck, inside your picture, while he stands 58 m off in the plan; on one deck none',
    fn() {
      const w = wreckOp(), me = w.me(), two = w.two(), at = [];
      w.g.bus.on('say', (f) => { if (f.who === w.twoPid) at.push({ text: f.text, at: f.at ?? null, me: [me.x, me.z], him: [two.x, two.z] }); });
      trace(w, { plant: false, round: 6 });
      const rows = at.map(x => ({ text: x.text, at: x.at, toMe: x.at ? Math.round(Math.hypot(x.at.x - x.me[0], x.at.z - x.me[1]) * 100) / 100 : null, toHim: Math.round(Math.hypot(x.him[0] - x.me[0], x.him[1] - x.me[1]) * 10) / 10 }));
      const same = heardAt(w.s, w.twoPid, TRUNK);
      // (on one deck: the pair at deck 5's stack, nothing to hear through)
      const O = wreckOp(), one = heardAt(O.s, O.twoPid, TRUNK);
      console.log(`      ${rows.map(r => `"${r.text}" at ${JSON.stringify(r.at)}, ${r.toMe} m from you, he ${r.toHim} m off in the plan`).join('; ')}; the half-picture ${MAX_VIEW_M[1] / 2} m; on one deck ${JSON.stringify(one)}`);
      for (const t of ['Got you.', 'Through.']) {
        const r = rows.find(x => x.text === t);
        assert(r && r.at && r.at.x >= 60 && r.at.y === 2.2 && r.toMe <= MAX_VIEW_M[1] / 2 && r.toHim > MAX_VIEW_M[0] / 2, JSON.stringify({ t, r, rows }));
      }
      assert(same.at && JSON.stringify(one) === '{}', JSON.stringify({ same, one }));
    },
  },
];
