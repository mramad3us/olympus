// OLYMPUS tests: "Secure for burn" polished (v0.0.25's burn polish; the user's score of test-burn, 2026-11-19: "OLYMPUS v0.0.24 ·
// test-burn · seed 3156898961 · warning 85 · fall 50 · feel 50 · ★ no · note: Good ideas bad execution. We should have some indication
// of how strong is the burn and evasive maneuvers, especially if not straped in, mag boots won't save you from a 3G sideways maneuver.
// No straped in animation, we just linger next to the bunk. Needs overall polish").
//
// Each case fails without its change: the strength shown (the 1MC's size, direction and boots' clause, its onset call; the G line's
// size, arrow and push acting now, and its meter's note; the siren's faster whoop for a manoeuvre), the boots' limit across the deck
// (a booted marine rides the burn and is torn off by the warned 3 G manoeuvre, thrown into the compartment's side, and rides the
// 0.4 G surprise; the limit's number from the boots' breakaway), strapped in drawn (into the berth in the act's time, the straps
// buckled, lying in it strapped, never rising by a move key, out again by Unstrap; the berth painted with its straps; the doll's
// harness), the NCO into rack 1 at the manoeuvre's warning, and the rest of the play's list (a body pinned against a face by a jink
// is not met again each tick; a jink pulls a body off its hold into the compartment; no "get up" T line strapped in; the card says
// the manoeuvre in plain words).
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { burnBot, burnBootsBot, burnLazyBot, runVoid } from './bots/void.mjs';
import { burnNow, burnOffer, BERTH_SEAT, NCO_SEAT, RACK_IN_MS, RACK_OUT_MS, STRAP_MS, UNSTRAP_MS } from '../src/sim/scenarios/burn.js';
import { gLineOf, gravCardOf, gravNow, setProfile } from '../src/sim/places/gravity.js';
import { gLineText, gMeterOf, NO_HOLD_WORDS, STRAPPED_WORDS } from '../src/ui/hud/strip.js';
import { sirenCycle, cycleMsOf } from '../src/ui/audio/siren.js';
import { warnWords, onsetWords, gWords } from '../src/data/onemc.js';
import { GRAV_BODY, MAG_BOOTS } from '../src/data/body/needs.js';
import { BODY_KG } from '../src/sim/body/motion.js';
import { G0_MS2 } from '../src/core/phys.js';
import { SIREN_CYCLE_MS } from '../src/data/sounds.js';
import { paintSleeper, BERTH_M, STRAP_C, STRAP_AT } from '../src/art/figures/bedding.js';
import { gearAnchorOf, setAnchor } from '../src/sim/body/footing.js';
import { doll } from '../src/art/doll/doll.js';
import { word } from '../src/art/paint.js';
import { dressOf } from '../src/art/doll/dress.js';
import { ANCHOR_C } from '../src/art/doll/worn.js';
import { gearOf } from '../src/sim/arms/gear.js';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { burnSaid } from '../src/ui/cards/anchors.js';
import { TICK_MS } from '../src/core/clock.js';

const SEEDS = Object.freeze([3156898961, 48213, 7]);
const meOf = (s) => s.actors.list.find(a => a.id === s.player.actor);
const ncoOf = (s) => s.actors.list.find(a => a.who === s.armoury.burn.ncoPid);
// (one scene by a bot, the facts said and the G line's words kept by phase: { g, B, said, lines, P })
function play(seed, bot, { until = (B) => !!B.end, maxTicks = 20 * 60 * 4, each = null } = {}) {
  const g = createGame({ scenario: 'test-burn', seed }), s = g.state, lines = new Map();
  for (let n = 0; n < maxTicks && !until(burnNow(s), s); n++) {
    g.step(1, bot);
    const f = gLineOf(s);
    if (f?.phase) { const k = `${f.kind}:${f.phase}`; if (!lines.has(k)) lines.set(k, { facts: f, text: gLineText(f), meter: gMeterOf(f) }); }
    each?.(s, g);
  }
  return { g, s, B: burnNow(s), said: g.facts('say').map(f => f.text), lines, P: s.places.live.env.profile };
}

export default [
  {
    name: 'burn-polish: the 1MC gives each event\'s size and direction before it ("Secure for manoeuvring: three G to port. … Strap in: boots will not hold three G.") and as it comes in ("Jinking. Three G to port."); the burn "one G", the surprise said at its onset too',
    fn() {
      const r = play(3156898961, burnBot());
      const want = [
        'Brace, brace, brace. Secure for burn: one G. Burn in fifteen seconds.',
        'Burning. One G.',
        'Brace, brace, brace. Secure for manoeuvring: three G to port. Manoeuvre in ten seconds. Strap in: boots will not hold three G.',
        'Jinking. Three G to port.',
        'Jinking. Zero point four G to port.',
      ];
      console.log(`      the 1MC on 3156898961: ${r.said.filter(t => !/^(Burn!|You heard|Racks|Into|Who left|Loose|Secure from|Coasting\. Check)/.test(t)).join(' / ')}`);
      console.log(`      words: ${[0.4, 1, 1.5, 2.5, 3].map(gWords).join(', ')}; ${onsetWords({ kind: 'cut', toG: 0 })}`);
      for (const w of want) assert(r.said.includes(w), `missing "${w}" in ${JSON.stringify(r.said)}`);
      // (a burn boots ride says no boots clause; v0.0.24's words kept without the event)
      assert(!/boots will not hold/.test(warnWords('burn', 15, { toG: 1 })) && warnWords('burn', 15) === 'Brace, brace, brace. Secure for burn. Burn in fifteen seconds.', warnWords('burn', 15, { toG: 1 }));
    },
  },
  {
    name: 'burn-polish: the G line gives the size and the arrow ("BRACE 0:08 · JINK 3.0 G ↓ PORT", then "3.00 G ↓ jink to port", never v0.0.24\'s "0.00 G · jink"), and its meter the push now against the boots\' mark, "BOOTS WILL NOT HOLD" beside it, "STRAPPED IN" once strapped',
    fn() {
      const boots = play(48213, burnBootsBot()), strapped = play(48213, burnBot());
      const row = (r, k) => r.lines.get(k);
      for (const [who, r] of [['booted', boots], ['strapped', strapped]]) console.log(`      ${who}: ${[...r.lines.values()].map(v => `"${v.text}" [${v.meter ? `${Math.round(v.meter.k * 100)}% mark ${Math.round(v.meter.markK * 100)}% ${v.meter.note || '-'}` : 'no meter'}]`).join('; ')}`);
      const w = row(boots, 'jink:warn'), on = row(boots, 'jink:hold'), bw = row(boots, 'burn:warn'), bh = row(boots, 'burn:hold'), sh = row(strapped, 'jink:hold');
      assert(/^BRACE 0:\d\d · JINK 3\.0 G ↓ PORT$/.test(w?.text) && w.meter.target && w.meter.over && w.meter.note === NO_HOLD_WORDS && Math.abs(w.meter.k - 1) < 1e-9, JSON.stringify(w));
      assert(on?.text === '3.00 G ↓ jink to port' && on.facts.pushG === 3 && on.meter.over && !on.meter.target, JSON.stringify(on));
      assert(/^BRACE 0:\d\d · BURN 1\.0 G ▼$/.test(bw?.text) && bw.meter.over === false && bh?.text === '1.00 G ▼ burn', JSON.stringify({ bw, bh }));
      assert(sh?.meter.note === STRAPPED_WORDS && sh.meter.safe, JSON.stringify(sh));
      // (the boots' mark at what they hold across the deck: 1.0 G of the meter's 3)
      assert(Math.abs(on.meter.markK - GRAV_BODY.BOOTS_SHEAR_G / 3) < 1e-9, JSON.stringify(on.meter));
    },
  },
  {
    name: 'burn-polish: the siren whoops twice as fast for a manoeuvre\'s warning as for a burn\'s (20 cycles through its 10 s, a burn\'s 15 through 15 s)',
    fn() {
      const cyc = (kind, warnS) => { const atMs = 100_000, now = { phase: 'warn', kind, atMs, warnS }, set = new Set(); for (let ms = atMs - warnS * 1000; ms < atMs; ms += TICK_MS) set.add(sirenCycle(now, ms)); return set.size; };
      const jink = cyc('jink', 10), burn = cyc('burn', 15);
      console.log(`      a jink's warning of 10 s: ${jink} cycles of ${cycleMsOf('jink')} ms; a burn's of 15 s: ${burn} of ${cycleMsOf('burn')} ms`);
      assert(jink === 20 && burn === 15 && cycleMsOf('jink') === SIREN_CYCLE_MS / 2, JSON.stringify({ jink, burn }));
    },
  },
  {
    name: 'burn-polish: mag boots hold the burn along the deck\'s normal but not the warned 3 G manoeuvre across it (GRAV_BODY.BOOTS_SHEAR_G 1.0 G, the boots\' 800 N breakaway on a marine of about 80 kg): the booted marine rides the burn, is torn off and thrown into the compartment\'s side, and rides the 0.4 G surprise on his boots again',
    fn() {
      const limit = MAG_BOOTS.BREAKAWAY_N / ((BODY_KG + 5) * G0_MS2);
      console.log(`      the boots' breakaway ${MAG_BOOTS.BREAKAWAY_N} N over ${BODY_KG + 5} kg at ${G0_MS2}: ${limit.toFixed(3)} G, named ${GRAV_BODY.BOOTS_SHEAR_G} G`);
      assert(Math.abs(limit - GRAV_BODY.BOOTS_SHEAR_G) < 0.05, `${limit}`);
      const bad = [];
      for (const seed of SEEDS) {
        const r = play(seed, burnBootsBot()), me = r.P.log.filter(x => x.who === r.s.player.id);
        console.log(`      ${seed}: ${me.map(x => `${x.what}${x.vMs ? ` ${x.vMs.toFixed(2)} m/s` : ''}`).join(', ')}; ${r.B.summary}`);
        if (!r.B.end) bad.push(`${seed}: no end`);
        if (r.B.onset?.what !== 'rode') bad.push(`${seed}: the burn ${r.B.onset?.what}`);
        if (!r.B.evade?.torn || r.B.evade.how !== 'boots' || r.B.evade.what !== 'thrown' || !(r.B.evade.vMs > 1.5)) bad.push(`${seed}: the manoeuvre ${JSON.stringify(r.B.evade)}`);
        if (r.B.jinks && r.B.jink?.what !== 'rode') bad.push(`${seed}: the surprise ${r.B.jink?.what}`);
      }
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'burn-polish: Strap in lies you down in your rack\'s berth in the act\'s time (the frames in RACK_IN_MS, strapped at STRAP_MS), you lie in it strapped (never standing by the bunk), a move key does not get you up, and Unstrap gets you out to the rack\'s foot in UNSTRAP_MS (the rise in its last RACK_OUT_MS)',
    fn() {
      const g = createGame({ scenario: 'test-burn', seed: 48213 }), s = g.state, bot = burnBot();
      let act = null;
      for (let n = 0; n < 20 * 120 && !burnNow(s).strapped; n++) {
        g.step(1, bot);
        const B = burnNow(s), me = meOf(s);
        if (B.doing?.what === 'strap' && !act) act = { fromMs: B.doing.fromMs, untilMs: B.doing.untilMs, posture: me.posture, spotId: me.spotId, trans: { kind: me.trans?.kind, ms: me.trans?.ms } };
      }
      const me = meOf(s), at = { posture: me.posture, spotId: me.spotId, strapped: me.strapped, x: me.x, z: me.z };
      console.log(`      strap in: ${JSON.stringify(act)}; strapped: ${JSON.stringify(at)}; the doll's anchor ${gearAnchorOf(s, s.player.id)}`);
      assert(act && act.posture === 'lie' && act.spotId === BERTH_SEAT && act.trans.kind === 'down' && act.trans.ms === RACK_IN_MS && act.untilMs - act.fromMs === STRAP_MS, JSON.stringify(act));
      assert(at.posture === 'lie' && at.spotId === BERTH_SEAT && at.strapped, JSON.stringify(at));
      assert(gearAnchorOf(s, s.player.id) === 'straps' && gearOf(s, s.player.id).anchor === 'straps', 'the gear\'s anchor');
      // (a move key strapped in: still lying, still strapped)
      g.step(10, { mx: 1, mz: 0 });
      assert(meOf(s).posture === 'lie' && meOf(s).strapped, JSON.stringify({ posture: meOf(s).posture, strapped: meOf(s).strapped }));
      // (Unstrap: R, then out to the rack's foot)
      const o = burnOffer(s);
      g.step(1, { act: ['hand'] });
      const D = burnNow(s).doing;
      let rise = null;
      for (let n = 0; n < 20 * 5 && burnNow(s).doing; n++) { g.step(1); const m = meOf(s); if (m.trans?.kind === 'rise' && !rise) rise = { atMs: s.clock.ms - D.fromMs, ms: m.trans.ms }; }
      const out = meOf(s);
      console.log(`      unstrap: R offered "${o?.label}", the rise at +${rise?.atMs} ms over ${rise?.ms} ms; out at (${out.x}, ${out.z}) ${out.posture ?? 'stand'}, strapped ${!!out.strapped}`);
      assert(o?.id === 'unstrap' && D?.untilMs - D?.fromMs === UNSTRAP_MS && rise && rise.ms === RACK_OUT_MS && rise.atMs <= UNSTRAP_MS - RACK_OUT_MS + TICK_MS, JSON.stringify({ o, D, rise }));
      assert((out.posture ?? 'stand') === 'stand' && !out.strapped && Math.hypot(out.x - 2.3, out.z - 3.0) < 0.05, JSON.stringify({ x: out.x, z: out.z, posture: out.posture }));
    },
  },
  {
    name: 'burn-polish: the berth is painted with the body on top in utilities and the rack\'s three straps across it, webbing rail to rail and a buckle each (a sleeper\'s has none); the doll strapped in wears the harness',
    fn() {
      const ppm = 24, w = Math.round(BERTH_M[0] * ppm), h = Math.round(BERTH_M[1] * ppm);
      const paint = (o) => { const px = new Array(w * h).fill(0); paintSleeper((x, y, ww, hh, c) => { for (let j = y; j < y + hh; j++) for (let i = x; i < x + ww; i++) if (i >= 0 && j >= 0 && i < w && j < h) px[j * w + i] = c; }, w, h, { ppm, seed: 3, ...o }); return px; };
      const sleeper = paint({}), strapped = paint({ straps: true });
      const web = (px) => px.filter(c => c === STRAP_C.web || c === STRAP_C.lit).length, buckle = (px) => px.filter(c => c === STRAP_C.buckle).length;
      // (the straps' rows, rail to rail: rows whose pixels are the webbing, its lit edge, a buckle or a rail's ring across most of the berth)
      const strapRows = [];
      for (let j = 0; j < h; j++) { const r = strapped.slice(j * w, (j + 1) * w); if (r.filter(c => c === STRAP_C.web || c === STRAP_C.lit || c === STRAP_C.ring || c === STRAP_C.buckle).length >= w - 2) strapRows.push(j); }
      const bands = strapRows.filter((j, i) => i === 0 || strapRows[i - 1] !== j - 1).length;
      console.log(`      ${w} × ${h} px: the webbing ${web(strapped)} px and the buckles ${buckle(strapped)} px strapped, ${web(sleeper)} and ${buckle(sleeper)} asleep; straps across it ${bands} (rows ${strapRows.join(', ')}, at ${STRAP_AT.join(', ')} of the body)`);
      assert(bands === STRAP_AT.length && web(strapped) >= 3 * (w - 4) && buckle(strapped) >= 6 && web(sleeper) === 0 && buckle(sleeper) === 0, 'the straps');
      // (the doll: the harness's webbing pixels over the figure, none without)
      const person = { look: { skin: 'tan', hair: { style: 'lowReg', color: 'dark' } }, sex: 'm' };
      const gear = { outfit: 'utilities', suit: null, carrier: null, ears: null, rifle: null, pistol: null, thigh: null, held: null, devices: [], painted: false, mask: null, hands: null, device: null, boots: 'mag', anchor: null };
      const count = (pm, c) => { const k = word(c); let n = 0; for (let i = 0; i < pm.w * pm.h; i++) if (pm.data[i] === k) n++; return n; };
      const plain = doll({ ...dressOf(gear, person), scale: 1 }), harness = doll({ ...dressOf({ ...gear, anchor: 'straps' }, person), scale: 1 });
      const a = count(harness, ANCHOR_C.strap), b = count(plain, ANCHOR_C.strap);
      console.log(`      the doll's webbing: ${a} px strapped in, ${b} px not`);
      assert(a > 60 && a > b + 60, JSON.stringify({ a, b }));
    },
  },
  {
    name: 'burn-polish: at the manoeuvre\'s warning the NCO calls it and straps himself into rack 1, lying there through it (never on his boots by the hatch at 3 G); the T line says the boots\' limit, never "Up. The rack will still be here tonight." to a man strapped in',
    fn() {
      let tLines = new Set();
      const r = play(7, burnBot(), { each: (s) => { const L = instinctNow(s).line; if (L && meOf(s).strapped) tLines.add(L.text); } });
      const nco = ncoOf(r.s), log = r.P.log.filter(x => x.who === nco.who).map(x => x.what);
      console.log(`      the NCO: ${nco.posture} in ${nco.spotId}, strapped ${nco.strapped}; his log ${log.join(', ')}; the T lines strapped in: ${[...tLines].join(' / ')}`);
      assert(nco.posture === 'lie' && nco.spotId === NCO_SEAT && nco.strapped && log[1] === 'couched', JSON.stringify({ posture: nco.posture, spotId: nco.spotId, log }));
      assert(r.said.some(t => /Boots will not hold three G sideways|Your boots are no good for this one/.test(t)), JSON.stringify(r.said));
      assert(![...tLines].some(t => /rack will still be here|On your feet|Eyes open means/.test(t)) && [...tLines].some(t => /Your boots will not hold it|tears boots off the deck/.test(t)), [...tLines].join(' / '));
    },
  },
  {
    name: 'burn-polish: a body pressed against a bulkhead by a jink is held there, not met again each tick (v0.0.24: a log line a tick, "You meet the bulkhead at 0.2 m/s and stop on it."); a jink pulls a body off its hold into the compartment, floating, never down prone on a deck that does not hold it',
    fn() {
      // (floating by your locker, the jink to port pressing you onto it for 3 s)
      const g = createGame({ scenario: 'test-burn', seed: 48213 }), s = g.state, me = meOf(s);
      Object.assign(me, { x: 3.6, z: 4.9 });
      setProfile(s, [{ kind: 'jink', toG: 0.4, atS: 3, holdS: 3, surprise: true, dirDeg: 90 }]);
      const n0 = s.log.length;
      for (let n = 0; n < 20 * 12; n++) { const c = gravCardOf(s); g.step(1, c?.options?.length ? { act: [{ act: 'grav', args: { card: c.options.at(-1).key } }] } : {}); }
      const meets = s.log.slice(n0).filter(l => /You (meet|hit) the bulkhead/.test(l.text ?? ''));
      console.log(`      the jink 0.4 G for 3 s on ${s.places.live.area}: ${meets.length} meetings logged (${meets.slice(0, 3).map(l => l.text).join(' / ')}), at (${me.x}, ${me.z})`);
      assert(meets.length >= 1 && meets.length <= 2, `${meets.length} meetings`);
      // (a hand on a hold pulled off by a 3 G jink: pulled, then floating and thrown, never 'down')
      const h = createGame({ scenario: 'test-burn', seed: 48213 }), hs = h.state, m = meOf(hs);
      setProfile(hs, [{ kind: 'jink', toG: 3, atS: 2, warnS: 1, onsetGs: 3, holdS: 2, dirDeg: 90 }]);
      Object.assign(m, { x: 3.75, z: 3.5 });                          // (a pad-eye in the deck at (3.75, 3.75): the holds' rule, 0.75 m + 3 m k)
      const held = setAnchor(hs, hs.player.id, 'handhold');
      for (let n = 0; n < 20 * 8; n++) h.step(1);
      const mine = hs.places.live.env.profile.log.filter(x => x.who === hs.player.id).map(x => x.what);
      console.log(`      a hand on a hold (${held.ok ? 'taken' : held.why}) at 3 G across: ${mine.join(', ')}`);
      assert(held.ok && mine[0] === 'pulled' && !mine.includes('down') && mine.includes('thrown'), JSON.stringify(mine));
    },
  },
  {
    name: 'burn-polish: the end card says the manoeuvre in plain words (how you were secured as it came in, the boots torn off, the speed you met the compartment\'s side at), and the summary never says the footing\'s "couched"',
    fn() {
      const lines = [];
      for (const [who, bot] of [['careful', burnBot()], ['booted', burnBootsBot()], ['lazy', burnLazyBot()]]) {
        const g = createGame({ scenario: 'test-burn', seed: 48213 });
        // (the lazy marine's card answered, "Nothing: let it come")
        const wrap = (s, me, mem) => { const c = gravCardOf(s); return c?.options?.length ? { act: [{ act: 'grav', args: { card: c.options.at(-1).key } }] } : bot(s, me, mem); };
        runVoid(g, wrap, { view: burnNow, maxTicks: 20 * 60 * 4 });
        const B = burnNow(g.state), said = burnSaid(B);
        lines.push([who, B.summary, said]);
        console.log(`      ${who}: ${said.join(' / ')}`);
      }
      const [careful, booted, lazy] = lines;
      assert(careful[2].some(t => t === 'The manoeuvre: you rode it strapped in (strapped in as it came in)'), JSON.stringify(careful));
      assert(booted[2].some(t => /^The manoeuvre: your boots tore off the deck; you were thrown into the compartment's side at \d\.\d\d m\/s \(on your mag boots as it came in\)$/.test(t)), JSON.stringify(booted));
      assert(lazy[2].some(t => /^The manoeuvre: you were thrown .* \(not secured as it came in\)$/.test(t)), JSON.stringify(lazy));
      assert(lines.every(([, sum]) => sum && !/couched/.test(sum)), JSON.stringify(lines.map(l => l[1])));
    },
  },
];
