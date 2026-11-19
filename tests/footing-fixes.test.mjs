// OLYMPUS tests: the review of v0.0.24's A to C, role A's findings, each failing without its fix (F102, F104, F105's footing).
//
// What the reviewer found playing the new paths headless, and what holds now, printed:
//   1. no walk is planned where the legs have nothing to push on: at 0 G a body moving in Combat in room 1's doorway gets no carry
//      through it (move.js throughOf: its profile was a division by a brake of 0, the player's place NaN, every tick after thrown:
//      "Stack and clear" on ship-coast by the keys after a burn, tick 1326), nor a way out of it or a step aside; at 1 G the same
//      body is carried; and a carry under way is dropped once the body floats;
//   2. mag boots lock only on the deck at rest: lifted off it (actor.floatY over a standing man's) or drifting over REST_MS they are
//      refused "no deck under the boots" (setAnchor, bootsRow, anchorOffers), and a lock at rest stops the body's tumble and puts it
//      on the deck (before: locked 1 m up at 0.6 m/s, then walked 1 m up with the drift left on);
//   3. no step takes a hold, a lanyard or a wedge while drifting ("drifting: grab a hold (L)": only the grab takes one on the move,
//      by its speed's bands): at 2.5, 3.5 and 8.0 m/s "Take the hold" is struck and T's act is not offered; at rest it is (before:
//      the hold taken at 8 m/s with no roll and no injury);
//   4. the struck move's reason names Let go first on a lanyard, a wedge and a buddy, the push-off on a hand's hold, the grab while
//      drifting;
//   5. the DI's anchor line reads saved state only (repeatMs 0): its rule stopped (the place's 1 G a while) and firing again at 0 G
//      across a save, the game
//      loaded says what the game never saved says (before: the loaded game's note held the line where the other's was gone).
import { assert } from './helpers.mjs';
import { voidWorld, coastHouse, bootUp } from './void-world.mjs';
import { footingOf, setAnchor, noFootingWhy, anchorOffers, bootsLockWhy, DRIFT_WHY } from '../src/sim/body/footing.js';
import { setOpening } from '../src/sim/places/model.js';
import { liveZoneAt } from '../src/sim/places/zones.js';
import { setLiveEnv } from '../src/sim/places/env.js';
import { throughOf, throughAway, stepAside } from '../src/sim/places/move.js';
import { anchorRows, anchorAction, bootsRow, leaveStop } from '../src/sim/arms/shooting.js';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { BASE_RULES } from '../src/sim/skills/instinct/base.js';
import { FOOTING } from '../src/data/body/needs.js';

/** Room 1's doorway on its line (o:w4:r1), footing.test.mjs's. */
const DOORWAY = Object.freeze([29, 12]);
const meOf = (s) => s.actors.list.find(a => a.id === s.player.actor);
const rolls = (s, step) => (s.log ?? []).filter(e => e.kind === 'roll' && (!step || e.step === step)).length;
const injuries = (s, pid) => (s.people[pid].body?.injuries ?? []).length;

export default [
  {
    name: 'footing-fixes: no walk is planned without legs (the review\'s crash): at 0 G no carry through room 1\'s doorway, no way out of it, no step aside; at 1 G the carry; a carry under way dropped once the body floats',
    fn() {
      // (the contact's setup: room 1's door open and the clock running, so a tick is lived)
      const { g, s, pid } = coastHouse({ setup: 'contact' }), me = meOf(s), area = s.places.live.area;
      setOpening(s, 'o:w4:r1', 'open');
      const put = () => { me.x = DOORWAY[0]; me.z = DOORWAY[1]; me.moveStance = 'combat'; me.v = [0.6, 0]; me.locoMs = s.clock.ms; delete me.stance; delete me.through; };
      put();
      const zone = liveZoneAt(s, area, me.x, me.z)?.id ?? null, legs0 = footingOf(s, pid).mode;
      const at0 = { through: throughOf(s, pid, me), away: throughAway(s, pid, me, [1, 0]), aside: stepAside(s, pid, me, [me.x + 1.5, me.z]) };
      setLiveEnv(s, null); put();
      const at1 = throughOf(s, pid, me);
      // (a carry planned at 1 G, then the gravity gone under it: dropped on the next tick, the place finite)
      me.through = at1; setLiveEnv(s, { preset: 'ship-coast' });
      g.step(1);
      const after = { through: !!me.through, x: me.x, z: me.z, mode: footingOf(s, pid).mode, errors: g.errors.length };
      console.log(`      room 1's doorway (zone ${zone}), 0.6 m/s in Combat: at 0 G (${legs0}) the carry ${JSON.stringify(at0.through)}, the way out ${JSON.stringify(at0.away)}, the step aside ${JSON.stringify(at0.aside)}`);
      console.log(`      at 1 G the carry ${at1 ? `${at1.zone}, ${at1.path.length} points, T ${at1.prof.T.toFixed(3)} s` : 'none'}; that carry with the gravity gone: kept ${after.through}, at (${after.x}, ${after.z}), ${after.mode}, errors ${after.errors}`);
      assert(zone !== null, 'the doorway is a live zone');
      assert(at0.through === null && at0.away === null && at0.aside === null, JSON.stringify(at0));
      assert(at1 && Number.isFinite(at1.prof.T) && at1.prof.T > 0, JSON.stringify(at1?.prof));
      assert(!after.through && Number.isFinite(after.x) && Number.isFinite(after.z) && after.errors === 0, JSON.stringify(after));
    },
  },
  {
    name: 'footing-fixes: mag boots lock only on the deck at rest: 1 m up or drifting at 0.6 m/s "no deck under the boots" (setAnchor, the row, the offers, T); at rest at a standing man\'s height they lock, the tumble stopped and the body put on the deck',
    fn() {
      const w = voidWorld({ boots: true, lock: false, two: false }), s = w.s, pid = w.pid, me = meOf(s), out = {};
      const read = () => ({ set: null, row: bootsRow(s, pid)?.off ?? null, offer: anchorOffers(s, pid).find(o => o.step === 'boots:lock') ?? null, why: bootsLockWhy(s, pid) });
      me.floatY = 2.0; out.lifted = read(); out.lifted.set = setAnchor(s, pid, 'boots');
      me.floatY = 1.0; me.v = [0.6, 0]; out.drifting = read(); out.drifting.set = setAnchor(s, pid, 'boots');
      w.g.step(1); const line = instinctNow(s).line;
      out.line = line ? { text: line.text, act: line.act } : null;
      delete me.v; me.tumble = 0.3; me.tumbleRad = 0.5; out.rest = read(); out.rest.set = setAnchor(s, pid, 'boots');
      out.after = { anchor: me.anchor ?? null, floatY: me.floatY ?? null, v: me.v ?? null, tumble: me.tumble ?? null, tumbleRad: me.tumbleRad ?? null, mode: footingOf(s, pid).mode };
      for (const [k, v] of Object.entries(out)) console.log(`      ${k.padEnd(9)} ${JSON.stringify(v)}`);
      for (const k of ['lifted', 'drifting']) {
        const r = out[k];
        assert(!r.set.ok && r.set.why === 'no deck under the boots' && r.row === 'no deck under the boots' && r.offer && !r.offer.ok && r.why === 'no deck under the boots', `${k}: ${JSON.stringify(r)}`);
      }
      assert(out.line?.act !== 'anchor:boots:lock', JSON.stringify(out.line));
      assert(out.rest.set.ok && out.rest.row === null && out.rest.offer?.ok, JSON.stringify(out.rest));
      assert(out.after.anchor === 'boots' && out.after.floatY === null && out.after.v === null && out.after.tumble === null && out.after.tumbleRad === null && out.after.mode === 'magWalk', JSON.stringify(out.after));
    },
  },
  {
    name: 'footing-fixes: no step takes a hold while drifting: at 2.5, 3.5 and 8.0 m/s "Take the hold", "Clip in" and "Wedge" are struck "drifting: grab a hold (L)", setAnchor refuses, T offers no act and says "Drifting. L to grab the hold."; at rest the hold is taken',
    fn() {
      const out = [];
      for (const vMs of [2.5, 3.5, 8.0]) {
        const w = voidWorld({ boots: false, two: false }), s = w.s, pid = w.pid, me = meOf(s);
        me.v = [vMs, 0];
        const rows = Object.fromEntries(anchorRows(s, pid).map(r => [r.id, r.off]));
        const set = setAnchor(s, pid, 'handhold'), act = anchorAction(s, w.g.bus, 'anchor:hold');
        w.g.step(1); const line = instinctNow(s).line;
        let n = 0; while (n++ < 15) w.g.step(1);
        out.push({ vMs, rows, set: set.why, act: act.ok ? 'taken' : act.why, line: line?.text ?? null, lineAct: line?.act ?? null, anchor: me.anchor ?? null, rolls: rolls(s), injuries: injuries(s, pid) });
      }
      const r = voidWorld({ boots: false, two: false }), rme = meOf(r.s), atRest = anchorAction(r.s, r.g.bus, 'anchor:hold');
      let n = 0; while ((r.s.stop?.mode === 'live' || r.s.stop?.doing) && n++ < 40) r.g.step(1);
      for (const o of out) console.log(`      ${o.vMs.toFixed(1)} m/s: rows ${JSON.stringify(o.rows)}; setAnchor "${o.set}", the step ${o.act}; the line "${o.line}" (act ${o.lineAct}); after 15 ticks anchor ${o.anchor}, rolls ${o.rolls}, injuries ${o.injuries}`);
      console.log(`      at rest: the step ${atRest.ok ? 'ok' : atRest.why}, the anchor ${rme.anchor ?? null}, the footing ${footingOf(r.s, r.pid).mode}`);
      for (const o of out) {
        assert(['anchor:hold', 'anchor:clip', 'anchor:wedge'].every(id => o.rows[id] === DRIFT_WHY), JSON.stringify(o.rows));
        assert(o.set === DRIFT_WHY && o.act !== 'taken' && o.anchor === null && o.rolls === 0 && o.injuries === 0, JSON.stringify(o));
        assert(o.lineAct === null && /^Drifting/.test(o.line ?? ''), JSON.stringify(o));
      }
      assert(atRest.ok && rme.anchor === 'handhold', JSON.stringify({ atRest, anchor: rme.anchor }));
    },
  },
  {
    name: 'footing-fixes: the struck move\'s reason names what works: a hand\'s hold "push off from the hold", a lanyard, a wedge and a buddy "let go to push off", drifting "drifting, grab a hold (L)"',
    fn() {
      const w = voidWorld({ boots: false, two: true }), s = w.s, pid = w.pid, me = meOf(s), two = s.actors.list.find(a => a.who === w.twoPid), out = {};
      const hold = (kind) => { setAnchor(s, pid, null); me.anchor = kind; me.anchorAt = [me.x, me.z]; return noFootingWhy(s, pid); };
      setAnchor(s, pid, null); out.hand = setAnchor(s, pid, 'handhold').ok ? noFootingWhy(s, pid) : 'no hold';
      out.lanyard = hold('tether'); out.wedge = hold('braced');
      setAnchor(s, pid, null); bootUp(s, w.twoPid); two.x = me.x + 0.6; two.z = me.z;
      out.buddy = setAnchor(s, pid, 'buddy', { ref: w.twoPid }).ok ? `${footingOf(s, pid).mode}: ${noFootingWhy(s, pid)}` : 'no buddy';
      setAnchor(s, pid, null); me.v = [1.0, 0]; out.drifting = noFootingWhy(s, pid);
      delete me.v; out.atRest = noFootingWhy(s, pid);
      for (const [k, v] of Object.entries(out)) console.log(`      ${k.padEnd(9)} ${v}`);
      assert(out.hand === 'no footing: push off from the hold', out.hand);
      assert(out.lanyard === 'no footing: let go to push off' && out.wedge === 'no footing: let go to push off' && out.buddy === 'braced: no footing: let go to push off', JSON.stringify(out));
      assert(out.drifting === 'no footing: drifting, grab a hold (L)' && out.atRest === 'no footing: take a hold', JSON.stringify(out));
      void FOOTING;
    },
  },
  {
    name: 'footing-fixes: the DI\'s anchor line reads saved state only (repeatMs 0): its rule stopped (1 G a while) and firing again across a save, the game loaded says what the game never saved says, to the line and its act, every tick from the first whole second',
    fn() {
      const rule = BASE_RULES.find(r => r.id === 'anchor');
      // (house 1's concrete at 0 G off the range, out of stop motion so the clock runs: nothing in reach, so the note with no act)
      const O = { boots: false, steel: false, two: false }, wa = voidWorld(O), A = wa.g, sa = wa.s;
      leaveStop(sa, A.bus); A.step(2); const first = instinctNow(sa).line;
      // (the footing given back a while (the gravity of the place, 1 G): the rule stops firing and its line goes; then 0 G again)
      setLiveEnv(sa, null); A.step(30); const slung = instinctNow(sa).line;
      const B = voidWorld(O).g; B.load(A.save());
      const lines = [];
      setLiveEnv(sa, { preset: 'ship-coast' }); setLiveEnv(B.state, { preset: 'ship-coast' });
      for (let k = 0; k < 40; k++) {
        A.step(1); B.step(1);
        const a = instinctNow(sa).line, b = instinctNow(B.state).line;
        lines.push([a?.id ?? null, a?.act ?? null, b?.id ?? null, b?.act ?? null]);
      }
      // (from the first whole second on: a load settles the line on its first tick, the game never saved on its next whole second)
      const differ = lines.slice(20).filter(([a, aa, b, bb]) => a !== b || aa !== bb).length, last = lines.at(-1);
      console.log(`      the rule's repeatMs ${rule.repeatMs}; at the start "${first?.text}" (${first?.tone}); 1.5 s at 1 G: ${slung?.id ?? 'no line'}, saved; at 0 G again, 40 ticks: ${differ} of the last 20 differing, the last [never saved ${last[0]}, loaded ${last[2]}]`);
      assert(first?.id === 'anchor' && slung?.id !== 'anchor' && rule.repeatMs === 0, JSON.stringify({ first, slung, repeatMs: rule.repeatMs }));
      assert(differ === 0 && last[0] === 'anchor', JSON.stringify(lines.slice(0, 5)));
    },
  },
];
