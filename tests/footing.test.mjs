// OLYMPUS tests: footing, F102 and F104's half (the build sheet v0.0.24 §6 A, §8's F99 and F101 read three higher; AW§4.1 items 2 to 5;
// BODY §22; COMBAT §14.8).
//
// What src/sim/body/footing.js and its readers do with a body the gravity does not hold, printed:
//   - the roller's footing entry (F102): exactly one 'env' entry of the footing's on a roll whose uses meet it below 0.2 G, none
//     from 0.2 G up (0.25 G under a live gravity, the Wheel's 1 G, Melas's 0.38 G), for every skill and every footing at 0 G;
//   - the holds' rule (src/sim/places/model.js holdNear) against every hold and pad-eye of house 1 laid out by brute force under
//     the rule { gridM 1.5, padEyeM 3 }, at 400 seeded points: the same nearest, to the millimetre;
//   - setAnchor's checks: the boots worn and steel under them; a hold, a pad-eye in reach; the wedge across 0.8 to 1.2 m (room 1's
//     doorway, 0.9 m) and not across the hall (2.24 m) or a shut door;
//   - the anchors as steps on the steel copy (tests/void-world.mjs): "Take the hold" 0.5 s, "Clip in" 1.0 s × the Zero-g pace,
//     "Wedge" 1.0 s, "Let go" 0.2 s, each lived to its tick as a live step, the footing after each, and BODY's group;
//   - the struck move (AW§4.1 item 5): at GO on ship-coast every drill row that would walk struck "no footing: take a hold", with
//     boots worn "no footing: lock your boots", on a hand's hold "no footing: push off from the hold", wedged or on a lanyard
//     "no footing: let go to push off" (the review of v0.0.24's A to C); locked, none; at 1 G none;
//   - T first (AW§4.1 item 4): below 0.05 G with a gun up and floating, the DI's "Anchor before you fire." is the line, its act the
//     best anchor (the boots on steel here), and T takes it; with nothing in reach the note "No footing: nothing in reach to
//     hold." with no act; at Melas it never fires;
//   - Fire is never struck for a floating shooter: its plaque lists "free fall, unanchored" and its time the ×2.5 recovery.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { voidWorld, coastHouse, steelDeck, bootUp } from './void-world.mjs';
import { footingOf, footingMods, setAnchor, noFootingWhy, anchorOffers, wedgeFits } from '../src/sim/body/footing.js';
import { holdNear, passageAt, areaOf, registerArea, dropArea, setOpening } from '../src/sim/places/model.js';
import { navOf } from '../src/sim/places/nav.js';
import { setLiveEnv } from '../src/sim/places/env.js';
import { rollerOf } from '../src/sim/combat/roll.js';
import { SKILL_KEYS, SKILLS, paceOf } from '../src/sim/skills/skills.js';
import { stepsOf, anchorRows, anchorAction, enterStop } from '../src/sim/arms/shooting.js';
import { modelOf } from '../src/sim/arms/groups.js';
import { instinctNow, instinctAction } from '../src/sim/skills/instinct.js';
import { anchorOf, pullMsOf } from '../src/sim/arms/shot.js';
import { FOOTING, GAIT_G } from '../src/data/body/needs.js';
import { stream, next } from '../src/core/rng.js';
import { TICK_MS } from '../src/core/clock.js';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { root } from './helpers.mjs';
import { A_GAUGES } from './flawless-void.mjs';

const SEED = 48213;
/** Room 1's doorway on its line (o:w4:r1, 0.9 m wide), and the hall at the house's start. */
const DOORWAY = Object.freeze([29, 12]), HALL = Object.freeze([33.88, 13.2]);
/** A place in house 1 a body can stand in with 0.82 m across it (x 31.59 to 32.41: found on its C0 grid's free cells), the wedge's for the steps. */
const NARROW = Object.freeze([32, 8.5]);
/** The holds' rule laid on house 1's copy for the arithmetic's check (AW§4.1 item 2). */
const RULE = Object.freeze({ gridM: 1.5, padEyeM: 3, faces: true });
const FOOT_WHY = /free fall|low g/;

const meOf = (s) => s.actors.list.find(a => a.id === s.player.actor);
const walks = (r) => r.kind === 'move' || !!r.walk || (r.kind === 'bundle' && (r.beats ?? []).some(b => b.k === 'move'));
// (an anchor's step run to its end, in the mode or live as the DI's T takes it (shooting.js anchorAction): the ms it took)
function lived(g, step) {
  const s = g.state, t0 = s.clock.ms, r = anchorAction(s, g.bus, step);
  if (!r.ok) return { ok: false, why: r.why, ms: 0 };
  let n = 0; while ((s.stop?.mode === 'live' || s.stop?.doing) && n < 80) { g.step(1); n++; }
  return { ok: true, ms: s.clock.ms - t0 };
}
// (house 1's copy with the holds' rule, made the live area for a read (see the header); undone by the returned function)
function withRule(s) {
  const base = s.places.live.area, a = areaOf(base), id = `${base}~holds`;
  registerArea({ ...a, id, holds: RULE });
  s.places.live.area = id;
  return { id, undo: () => { s.places.live.area = base; dropArea(id); } };
}
// (every hold and pad-eye of the rule by brute force: each face's rungs every gridM, each deck pad-eye every padEyeM on the floor)
function allHolds(s, areaId) {
  const g = navOf(s, areaId, 'C0'), rects = [...g.blockers, ...g.leaves.filter(l => l.closed).map(l => l.rect)], off = RULE.gridM / 2, out = [];
  const onDeck = (x, z) => { const i = Math.floor((x - g.x0) / g.cellM), j = Math.floor((z - g.z0) / g.cellM); return i >= 0 && j >= 0 && i < g.nx && j < g.nz && g.floor[j * g.nx + i] === 1 && !rects.some(r => x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1); };
  for (const r of rects) {
    for (let x = off + Math.ceil((r.x0 - off) / RULE.gridM - 1e-9) * RULE.gridM; x <= r.x1 + 1e-9; x += RULE.gridM) out.push({ x, z: r.z0, kind: 'hold' }, { x, z: r.z1, kind: 'hold' });
    for (let z = off + Math.ceil((r.z0 - off) / RULE.gridM - 1e-9) * RULE.gridM; z <= r.z1 + 1e-9; z += RULE.gridM) out.push({ x: r.x0, z, kind: 'hold' }, { x: r.x1, z, kind: 'hold' });
  }
  for (let x = off + Math.floor((g.x0 - off) / RULE.padEyeM) * RULE.padEyeM; x <= g.x0 + g.nx * g.cellM; x += RULE.padEyeM) for (let z = off + Math.floor((g.z0 - off) / RULE.padEyeM) * RULE.padEyeM; z <= g.z0 + g.nz * g.cellM; z += RULE.padEyeM) if (onDeck(x, z)) out.push({ x, z, kind: 'padEye' });
  return out;
}

export default [
  {
    name: 'footing (F102): the roller\'s footing entry is exactly one below 0.2 G on a roll whose uses meet it, and none at 0.25 G, Melas\'s 0.38 G or the Wheel\'s 1 G, for every skill and every footing at 0 G',
    fn() {
      const cases = [], bad = [];
      const count = (s, pid) => Object.fromEntries(SKILL_KEYS.map(k => [k, rollerOf(s, pid).mods(k).filter(m => m.src === 'env' && FOOT_WHY.test(m.why)).length]));
      const want = (s, pid) => Object.fromEntries(SKILL_KEYS.map(k => [k, footingMods(s, pid, k).length]));
      const look = (what, s, pid, gG) => { const c = count(s, pid), w = want(s, pid), n = Object.values(c).reduce((a, b) => a + b, 0); cases.push({ what, gG, n, skills: Object.keys(c).filter(k => c[k]).length });
        for (const k of SKILL_KEYS) { if (c[k] > 1 || c[k] !== w[k]) bad.push(`${what} ${k}: ${c[k]} entries, footingMods ${w[k]}`); if (gG >= FOOTING.LOWG_BELOW_G && c[k]) bad.push(`${what} ${k}: an entry at ${gG} G`); }
        return c; };
      { const g = createGame({ scenario: 'test-handling', seed: SEED }), s = g.state; look('Melas', s, s.player.id, 0.38); }
      { const { s, pid } = coastHouse({}); setLiveEnv(s, null); look('the Wheel', s, pid, 1); setLiveEnv(s, { preset: 'ship-coast', gravity: { regime: 'thrust', gG: 0.25 } }); look('0.25 G', s, pid, 0.25); }
      { const g = createGame({ scenario: 'test-handling', seed: SEED, env: 'europa-surface' }), s = g.state; const c = look('Europa 0.134 G', s, s.player.id, 0.134); if (!(c.cqc === 1 && c.fieldcraft === 1 && c.fitness === 1)) bad.push(`Europa: ${JSON.stringify(c)}`); }
      { const w = voidWorld({ boots: true, lock: false }), s = w.s, pid = w.pid, me = meOf(s);
        const c0 = look('0 G floating', s, pid, 0);
        if (!(c0.marksmanship === 1 && c0.weapons === 1)) bad.push(`floating: the shot and the hands ${JSON.stringify(c0)}`);
        setAnchor(s, pid, 'boots'); look('0 G boots', s, pid, 0); setAnchor(s, pid, null);
        setAnchor(s, pid, 'handhold'); look('0 G hold', s, pid, 0); setAnchor(s, pid, null);
        setOpening(s, 'o:w4:r1', 'open'); me.x = DOORWAY[0]; me.z = DOORWAY[1]; setAnchor(s, pid, 'braced');
        const cb = look('0 G wedge', s, pid, 0); if (Object.values(cb).some(Boolean)) bad.push(`braced takes 0: ${JSON.stringify(cb)}`); }
      for (const c of cases) console.log(`      ${c.what.padEnd(16)} ${fmt(c.gG, 3)} G: ${c.n} footing entries over ${SKILL_KEYS.length} skills (${c.skills} with one)`);
      assert(!bad.length, bad.join('\n'));
      assert(cases.filter(c => c.gG >= FOOTING.LOWG_BELOW_G).every(c => c.n === 0) && cases.filter(c => c.gG < FOOTING.LOWG_BELOW_G && c.what !== '0 G wedge').every(c => c.n > 0), JSON.stringify(cases));
    },
  },
  {
    name: 'footing: the holds\' rule (model.js holdNear) gives the nearest hold or pad-eye within 0.8 m by arithmetic, the same as every hold of house 1 laid out by brute force under { gridM 1.5, padEyeM 3 }, at 400 points; with no rule the grip underfoot',
    fn() {
      const { s } = coastHouse({}), R = withRule(s);
      try {
        const all = allHolds(s, R.id), g = navOf(s, R.id, 'C0'), rs = stream(SEED, 'footing:holds'), r = () => next(rs), diffs = [];
        let found = 0, pads = 0;
        for (let k = 0; k < 400; k++) {
          const x = g.x0 + r() * g.nx * g.cellM, z = g.z0 + r() * g.nz * g.cellM;
          const got = holdNear(s, x, z, FOOTING.REACH_M);
          let best = null;
          for (const h of all) { const d = Math.hypot(h.x - x, h.z - z); if (d <= FOOTING.REACH_M + 1e-9 && (!best || d < best.d - 1e-9)) best = { ...h, d }; }
          if (!!got !== !!best || (got && (Math.abs(got.dM - best.d) > 0.001 || got.kind !== best.kind && Math.abs(got.dM - best.d) > 1e-6))) diffs.push(JSON.stringify({ x, z, got, best }));
          if (got) { found++; if (got.kind === 'padEye') pads++; }
        }
        console.log(`      house 1 under the rule: ${all.filter(h => h.kind === 'hold').length} rungs on its faces, ${all.filter(h => h.kind === 'padEye').length} pad-eyes in its deck; 400 points, a hold in reach at ${found} (${pads} a pad-eye), ${diffs.length} differing from the brute force`);
        assert(!diffs.length, diffs.slice(0, 3).join('\n'));
        assert(found > 40 && pads > 0, `${found} found`);
      } finally { R.undo(); }
      // (no rule: the grip underfoot, a grating's 'handholds' a hold at the body; the Wheel's concrete none)
      const plain = holdNear(s, ...HALL, FOOTING.REACH_M);
      steelDeck(s); const steel = holdNear(s, ...HALL, FOOTING.REACH_M), clip = holdNear(s, ...HALL, FOOTING.REACH_M, { kind: 'padEye' });
      console.log(`      no rule: on concrete ${JSON.stringify(plain)}, on the plate (grip handholds) ${JSON.stringify(steel)}, a pad-eye ${JSON.stringify(clip)}`);
      assert(plain === null && steel?.kind === 'hold' && steel.dM === 0 && clip === null, JSON.stringify({ plain, steel, clip }));
    },
  },
  {
    name: 'footing: setAnchor checks what the place and the kit allow: the boots worn and steel underfoot, a hold or a pad-eye in reach, the wedge across 0.8 to 1.2 m (room 1\'s doorway 0.9 m) and not the hall (2.24 m) or a shut door; and noFootingWhy\'s reasons (wedged: let go first)',
    fn() {
      const { s, pid } = coastHouse({}), me = meOf(s), out = {};
      out.noBoots = setAnchor(s, pid, 'boots'); bootUp(s, pid, { lock: false }); out.concrete = setAnchor(s, pid, 'boots');
      out.whyBootsConcrete = noFootingWhy(s, pid);
      out.hold = setAnchor(s, pid, 'handhold'); out.clip = setAnchor(s, pid, 'tether');
      out.hall = { p: passageAt(s, ...HALL), r: setAnchor(s, pid, 'braced') };
      me.x = DOORWAY[0]; me.z = DOORWAY[1]; out.shut = { p: passageAt(s, ...DOORWAY), r: setAnchor(s, pid, 'braced') };
      setOpening(s, 'o:w4:r1', 'open'); out.open = { p: passageAt(s, ...DOORWAY), fits: wedgeFits(s, ...DOORWAY), r: setAnchor(s, pid, 'braced') };
      out.whyWedged = noFootingWhy(s, pid); setAnchor(s, pid, null); out.whyFloat = noFootingWhy(s, pid);
      steelDeck(s); out.whySteel = noFootingWhy(s, pid); out.steelBoots = setAnchor(s, pid, 'boots'); out.whyLocked = noFootingWhy(s, pid);
      setLiveEnv(s, null); out.whyWheel = noFootingWhy(s, pid);
      for (const [k, v] of Object.entries(out)) console.log(`      ${k.padEnd(18)} ${JSON.stringify(v)}`);
      assert(!out.noBoots.ok && out.noBoots.why === 'no mag boots on' && !out.concrete.ok && out.concrete.why === 'no ferrous plate underfoot', 'the boots');
      assert(!out.hold.ok && out.hold.why === 'nothing to hold here' && !out.clip.ok && out.clip.why === 'no pad-eye in reach', 'the holds on concrete');
      assert(out.hall.p.widthM === 2.24 && !out.hall.r.ok && out.shut.p.widthM === 0 && !out.shut.r.ok && out.open.p.widthM === 0.9 && out.open.fits && out.open.r.ok, 'the wedge');
      assert(out.whyBootsConcrete === 'no footing: take a hold' && out.whyWedged === 'no footing: let go to push off' && out.whyFloat === 'no footing: take a hold', 'the reasons on concrete');
      assert(out.whySteel === 'no footing: lock your boots' && out.steelBoots.ok && out.whyLocked === null && out.whyWheel === null, 'the reasons on steel and at 1 G');
    },
  },
  {
    name: 'footing: the anchors as steps on the steel copy, in BODY\'s group: "Take the hold" 0.5 s, "Clip in" 1.0 s × the Zero-g pace, "Wedge" 1.0 s, "Let go" 0.2 s, each lived to its tick, the footing after each; none at 1 G',
    fn() {
      const w = voidWorld({ boots: false }), g = w.g, s = w.s, pid = w.pid, me = meOf(s), R = withRule(s), out = [];
      try {
        const row = (id) => anchorRows(s, pid).find(r => r.id === id) ?? null, take = (id) => ({ id, row: row(id), ...lived(g, id), F: footingOf(s, pid) });
        // (the hall: no wedge; a hold within reach on the rule's faces or deck, a pad-eye too where one is)
        const hall0 = anchorRows(s, pid).map(r => `${r.id}${r.off ? ` (${r.off})` : ''}`);
        const pad = holdNear(s, me.x, me.z, 3, { kind: 'padEye' }); me.x = pad.x + 0.3; me.z = pad.z;
        const atPad = anchorRows(s, pid).map(r => `${r.id} ${r.ms} ms${r.off ? ` (${r.off})` : ''}`);
        out.push(take('anchor:clip'), take('anchor:letgo'), take('anchor:hold'), take('anchor:letgo'));
        me.x = NARROW[0]; me.z = NARROW[1];
        const narrow = passageAt(s, ...NARROW);
        out.push(take('anchor:wedge'));
        // (the panel's group of each anchor row, as the page's model places it: groups.js modelOf, the rows of the mode)
        enterStop(s, g.bus, { via: 'ready' });
        const M = modelOf(stepsOf(s)), groupOf = (id) => Object.entries(M.groups).find(([, G]) => G.slots.some(e => e?.row?.id === id) || G.deep.some(r => r.id === id))?.[0] ?? null;
        const groups = [...new Set(anchorRows(s, pid).map(r => groupOf(r.id)))];
        s.stop = null;
        const zg = rollerOf(s, pid).value('zerog'), clipMs = Math.round(FOOTING.STEP_MS.clip * paceOf(zg));
        console.log(`      in the hall: ${hall0.join(', ')}; by a pad-eye: ${atPad.join(', ')}`);
        for (const o of out) console.log(`      ${o.id.padEnd(14)} ${o.row?.ms} ms offered, lived ${o.ms} ms: ${o.F.mode} (${o.F.anchor}, ${o.F.hold}${o.F.oneHand ? ', one hand' : ''})`);
        console.log(`      Zero-g ${zg}: Clip in ${clipMs} ms; the wedge across ${narrow.widthM} m (${narrow.axis}); the rows' group ${groups.join(', ')}`);
        const want = { 'anchor:clip': ['handhold', 'tether', clipMs], 'anchor:hold': ['handhold', 'handhold', FOOTING.STEP_MS.hold], 'anchor:wedge': ['braced', 'braced', FOOTING.STEP_MS.wedge], 'anchor:letgo': ['float', 'none', FOOTING.STEP_MS.letGo] };
        const tick = (ms, w0) => ms >= w0 && ms <= Math.ceil(w0 / TICK_MS) * TICK_MS + TICK_MS;
        for (const o of out) { const [mode, hold, ms] = want[o.id]; assert(o.ok && o.row && !o.row.off && o.row.ms === ms && tick(o.ms, ms) && o.F.mode === mode && o.F.hold === hold, JSON.stringify(o)); }
        assert(out[2].F.oneHand === true && out[0].F.oneHand === false, 'a hand on the hold is one hand; the lanyard both');
        assert(hall0.includes('anchor:wedge (no passage 0.8 to 1.2 m wide)'), hall0.join());
        assert(groups.length === 1 && groups[0] === 'BODY', groups.join());
      } finally { R.undo(); }
      setLiveEnv(s, null);
      assert(anchorRows(s, pid).length === 0, 'no anchors at 1 G');
    },
  },
  {
    name: 'footing: the struck move at 0 G (AW\'s silent stall): at GO on ship-coast every drill row that would walk is struck with the footing\'s reason and none is live; locked boots on the plate walk; at 1 G nothing is struck',
    fn() {
      const panel = (s) => { const was = s.stop; if (!s.stop) enterStop(s, null, { via: 'ready' }); const rows = stepsOf(s).filter(walks); if (!was) s.stop = was; return rows; };
      const summary = (rows) => { const o = {}; for (const r of rows) o[r.off ?? 'live'] = (o[r.off ?? 'live'] ?? 0) + 1; return o; };
      const coast = coastHouse({}), s = coast.s, pid = coast.pid;
      const bare = summary(panel(s));
      bootUp(s, pid, { lock: false }); steelDeck(s); const booted = summary(panel(s));
      setAnchor(s, pid, 'boots'); const locked = summary(panel(s));
      setLiveEnv(s, null); setAnchor(s, pid, null); const wheel = summary(panel(s));
      const one = createGame({ scenario: 'test-shoothouse', seed: SEED, tier: 'sgt', setup: 'go' }).state, plain = summary(panel(one));
      console.log(`      ship-coast, concrete: ${JSON.stringify(bare)}; on the plate in boots: ${JSON.stringify(booted)}; locked: ${JSON.stringify(locked)}; back at 1 G: ${JSON.stringify(wheel)}; the Wheel's own lane at GO: ${JSON.stringify(plain)}`);
      assert(!bare.live && bare['no footing: take a hold'] > 0, JSON.stringify(bare));
      assert(!booted.live && booted['no footing: lock your boots'] > 0, JSON.stringify(booted));
      assert(locked.live > 0 && !Object.keys(locked).some(k => /^no footing/.test(k)), JSON.stringify(locked));
      assert(!Object.keys(wheel).some(k => /^no footing/.test(k)) && JSON.stringify(wheel) === JSON.stringify(plain), JSON.stringify({ wheel, plain }));
    },
  },
  {
    name: 'footing: T first below 0.05 G (AW§4.1 item 4): a gun up and floating, "Anchor before you fire." is the line and T locks the boots on the plate; with nothing in reach a note with no act; at Melas the rule never fires',
    fn() {
      const w = voidWorld({ boots: true, lock: false }), g = w.g, s = w.s, pid = w.pid;
      g.step(2);
      const line = instinctNow(s).line, offers = anchorOffers(s, pid).map(o => `${o.step}${o.ok ? '' : ` (${o.why})`}`);
      instinctAction(s, { act: 'instinct', args: { id: line?.id, act: line?.act } }, g.bus, {});
      let n = 0; while (s.stop && n < 40) { g.step(1); n++; }
      const after = footingOf(s, pid);
      const c = coastHouse({}); c.g.step(2); const none = instinctNow(c.s).line;
      const m = createGame({ scenario: 'test-handling', seed: SEED, setup: 'hot' }); let fired = 0; for (let k = 0; k < 200; k++) { m.step(1); if (instinctNow(m.state).line?.id === 'anchor') fired++; }
      console.log(`      floating in boots on the plate: the offers ${offers.join(', ')}; the line "${line?.text}" (${line?.tone}, act ${line?.act}); after T ${after.mode} (${after.anchor})`);
      console.log(`      on ship-coast's concrete: "${none?.text}" (${none?.tone}, act ${none?.act ?? 'none'}); at Melas, 200 ticks: the rule fired ${fired} times`);
      assert(line?.id === 'anchor' && line.tone === 'urgent' && line.act === 'anchor:boots:lock' && /^Anchor before you fire\./.test(line.text), JSON.stringify(line));
      assert(after.mode === 'magWalk' && after.anchor === 'magBoots', JSON.stringify(after));
      assert(none?.id === 'anchor' && !none.act && none.tone === 'note' && /^No footing/.test(none.text), JSON.stringify(none));
      assert(fired === 0, `${fired}`);
    },
  },
  {
    name: 'footing: Fire is never struck for a floating shooter (COMBAT §14.8: a single shot at need): its plaque lists "free fall, unanchored" and its time the ×2.5 recovery against the planted pull',
    fn() {
      const at = (env) => {
        const g = createGame({ scenario: 'test-handling', seed: SEED, setup: 'bench', ...(env ? { env } : {}) }), s = g.state, pid = s.player.id;
        g.step(2);
        if (!s.stop) enterStop(s, g.bus, { via: 'ready' });
        const fire = stepsOf(s).find(r => r.id === 'fire'), A = anchorOf(s, pid, { gunId: s.stop.gun });
        return { off: fire?.off ?? null, ms: fire?.ms, pull: pullMsOf(s, pid, s.stop.gun).ms, row: A.row, mods: rollerOf(s, pid).mods('marksmanship').filter(m => FOOT_WHY.test(m.why)).map(m => `${m.why} ${m.v}`) };
      };
      const mars = at(null), coast = at('ship-coast');
      console.log(`      Melas: Fire ${mars.ms} ms (${mars.row}), struck ${mars.off ?? 'no'}; ship-coast: Fire ${coast.ms} ms (${coast.row}), struck ${coast.off ?? 'no'}, the roll's ${coast.mods.join(', ')}`);
      assert(coast.off === mars.off && coast.row === 'floating' && coast.ms === coast.pull && coast.ms > mars.ms && coast.mods.some(m => /^free fall, unanchored/.test(m)), JSON.stringify({ mars, coast }));
      void GAIT_G; void SKILLS;
    },
  },
  {
    name: 'footing: role A\'s gauges (tests/flawless-void.mjs A_GAUGES, a filter of void-done.mjs VOID_GAUGES by owner) are homed: F101 to F105 and F116, each suite named in its row present',
    fn() {
      const rows = A_GAUGES.map(r => ({ F: r.F, sheet: r.sheet, files: r.file.split(/,\s*/), missing: r.file.split(/,\s*/).filter(f => !existsSync(path.join(root, 'tests', f))) }));
      for (const r of rows) console.log(`      ${r.F} (the sheet's ${r.sheet}): ${r.files.join(', ')}${r.missing.length ? `; missing ${r.missing.join(', ')}` : ''}`);
      // (F104's and F116's other halves are B's and D's: their own files, named in the rows, are theirs to add)
      const mine = new Set(['anchor-table.test.mjs', 'footing.test.mjs', 'legs-one.test.mjs', 'void-house.test.mjs', 'gear-void.test.mjs']);
      assert(rows.map(r => r.F).join() === 'F101,F102,F103,F104,F105,F116', rows.map(r => r.F).join());
      assert(rows.every(r => r.files.every(f => !mine.has(f) || !r.missing.includes(f))), JSON.stringify(rows));
    },
  },
];
