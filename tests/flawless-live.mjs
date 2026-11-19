// OLYMPUS tests: the shoot house's gauges on the live lane, "Stack and clear, live" (COMBAT §25.18, §25.19.8; the build sheet v0.0.19 §8): F1 to F26 as tests/flawless.mjs measures them, F15 against LIVE_LANE_MAX_S, and F38 to F46 of the live men's own.
//
// A live lane is tests/flawless.mjs flawlessLane with the fill's opfor ('live', or 'live:<2a card>,<3a card>' forced) and the
// honest bot (the keys bot below rung 2, as the kit's lanes have it), so gaugeOf holds it to the criteria it holds the turner
// lanes to, three of them read the live lane's way, each declared on its row: F15 against LIVE_LANE_MAX_S 120 s (LANE_MAX_S 60
// untouched: a man who fires, hides and gives up is a longer room than a paper one), F21 and F22 printed only (defined on the
// turner lane's references), and a 'casualty' lane measured over the legs it reached (F9's men left up and F10's pars only
// there, the leg of the cease fire's men nobody had fired on left out of F9's men left up). The live men's own, each lane
// watched tick by tick (liveLane's `more`):
//   F38  perception honest: no window, join, known or sighting of a role-player on a tick when that viewer's men.js seenK is under
//        SEEN in that tick: yours read here from your eye's pose at the look (me.$look, the bodies mid-tick), the tick's start or its
//        end, the #2's by the house's H.two.seenAt, the start or the end, or his round in it drawing the eye (contact.drawn); no
//        live man in the open within your or your #2's sight longer
//        than OPEN_UNKNOWN_MS 3.73 s (TAKEIN_FLOOR_MS + TAKEIN_SPAN_MS + MAN_MEMORY_MS) without being known; the seen-to-known
//        times printed (v0.0.20: unchanged; the design's discount of the viewer's startled ticks was not needed, at most 2.40 s)
//   F39  no round on a man the shooter believed down or given up: the fault 'surrendered' 0, and no round on a role-player begun
//        LATE_ROUND_MS 0.5 s or more after his down tick or after his give's first tick (st 'hands', his hands coming up; a pair's
//        second round already in the air is no new decision)
//   F40  at every "Clear!", each role-player of the leg the team has seen down and covered, with his hands up and covered, or ruled
//        out: no man the team saw up and unaccounted for at the call, the faults 'uncovered' and 'reopened' 0 for the honest bot
//        (the keys bot's printed)
//   F41  interrupts: a startled marine starts no beat (supp.js startled; L-men's suspension); every strike on the house's record
//        on the tick it lands; a strike by a man you did not know opens a window on him (or draws your eye) within one tick; a
//        casualty reaches the lane's end within CASUALTY_MS + a tick
//   F42  role-players are bodies: against the walls and the closed leaves by F1's method (overlapOf), the marines' gap by F2's
//        (BODY_GAP_M from you and your #2 while he is up), never in a moving leaf's arc by F26's (arcLiveAt)
//   F43  the figure says what the sim says: each tick a role-player's tween start is where he was (F19's method), and his rifle
//        is on him (in his hands or slung) or lying on the floor, never neither; a rifle he drops falls (look.js rangeLook's
//        house.floor): first drawn on the floor at half FLOOR_FROM_M or higher, and no tick's fall over half of it (the review of
//        track L: it went from his hands to y 0 in one tick)
//   F44  balance by sheet (printed): the share of lanes with paint on you or your #2; enforced, the tier one's at most 5% and the
//        recruit's at least the tier one's plus 10 points
//   F45  one rule (v0.0.20, the user's answer of 2026-11-16: "Paintball should end if the hit is 'fatal'"; combat/would.js): each
//        tick, every strike on anyone (R.house.live.struck on you or your #2, a role-player's T.hits while he is up) has exactly
//        one entry on the would-have's ledger, on its tick; a casualty if and only if a fatal entry on you or your #2, on its tick,
//        naming its man; a role-player down if and only if a fatal entry on him, his stoppedAtMs its; no lane ends 'casualty' on a
//        wound or a stop; the card names the fatal entry's man and its why; the real bodies of the marines and the role-players
//        unhurt at the card (people[pid].body with no injury: the would-have is the lane's record, never theirs)
//   F46  casualty balance by sheet: the share of lanes ending 'casualty'; enforced, the tier one's at most CASUALTY_TIERONE_MAX 5%
//        and the recruit's at least the tier one's plus CASUALTY_GAP_PTS 10 points; printed with the ledger's tallies (wounds,
//        stops, fatal by why, the strikes to a role-player's down)
// LIVE_ENFORCED names them all (the build sheet's stage 4); a lane that throws or never reaches its card fails before any of them.
import { flawlessLane, gaugeOf, ENFORCED, SHEETS, flawlessSeeds, mean, quantile, s1, s2, top, tally, overlapOf, WALL_TOL_M, BODY_GAP_M, TWO_CUE_MS } from './flawless.mjs';
import { houseNow, runSheetOf } from '../src/sim/scenarios/shoothouse.js';
import { isLive, seenK, accountedOf, upNow, MAN_MEMORY_MS, CASUALTY_MS } from '../src/sim/combat/men.js';
import { SEEN } from '../src/sim/people/perception.js';
import { TAKEIN_FLOOR_MS, TAKEIN_SPAN_MS } from '../src/sim/combat/react.js';
import { startled } from '../src/sim/combat/supp.js';
import { gunOn } from '../src/sim/arms/shooting.js';
import { ownerOf as itemOwnerOf, lyingOf } from '../src/sim/arms/kit.js';
import { arcsOf, arcLiveAt } from '../src/sim/places/zones.js';
import { RUNG_OF_TIER } from '../src/sim/skills/templates.js';
import { fatalOf, WOULD_WHY } from '../src/sim/combat/would.js';
import { TICK_MS } from '../src/core/clock.js';
// (look.js's floor is L-look's, merged after this file's: read through the namespace, so the file loads before it lands)
import * as LOOK from '../src/sim/arms/look.js';

/** The live lane's time ceiling (s; F15 for live lanes only, the build sheet's §5; LANE_MAX_S untouched). */
export const LIVE_LANE_MAX_S = 120;
/** The live men's criteria, enforced (the build sheet's §8, stage 4). */
export const LIVE_ENFORCED = Object.freeze(new Set(['F38', 'F39', 'F40', 'F41', 'F42', 'F43', 'F44', 'F45', 'F46']));
/** F38: a live man in the open within a marine's sight unknown at most this long (ms): the slowest take-in and the memory's fade. */
export const OPEN_UNKNOWN_MS = TAKEIN_FLOOR_MS + TAKEIN_SPAN_MS + MAN_MEMORY_MS;
/** F39: a round on a man begun this long after his down tick is a new decision on a man believed down (ms; my call: a pair's split is under 0.35 s). */
export const LATE_ROUND_MS = 500;
/** F44's bands: the tier one's lanes with paint on the stack at most this share; the recruit's at least the tier one's plus this (points). */
export const PAINT_TIERONE_MAX = 0.05, PAINT_GAP_PTS = 10;
/** F46's bands (v0.0.20): the tier one's lanes ending 'casualty' at most this share; the recruit's at least the tier one's plus this (points). */
export const CASUALTY_TIERONE_MAX = 0.05, CASUALTY_GAP_PTS = 10;
/** The forced cards each sheet plays once besides its drawn ones (opfor.js parseOpfor's codes). */
export const FORCED = Object.freeze(['live:fight,hide', 'live:give,give', 'live:fight,give']);

const r3 = (v) => Math.round(v * 1000) / 1000;

/** One live lane (see the header): flawlessLane's record with the live men's numbers (rec.live). */
// (v0.0.22 G5: the house's options, draw, house, rooms and layout, passed to the fill only when given (flawlessLane's `fill`), so a live
// lane of the set is v0.0.21's; a drawn one (`{ draw: 'drawn' }`, `{ rooms: 'all' }`) is tests/flawless-end.mjs's F80 slice)
export function liveLane({ tier, seed, opfor = 'live', bot = null, maxMs = 15 * 60_000, draw = null, house = null, rooms = null, layout = null }) {
  const keys = (RUNG_OF_TIER[tier] ?? 0) < 2, L = { win: 0, winBad: [], twoKnown: 0, twoBad: [], openMax: 0, openAt: null, seenToKnown: [], late: [], startBeat: 0, strikeLate: 0, drawnLate: 0, drawnN: 0,
    bodies: { wall: 0, worstM: 0, gap: 0, minGapM: Infinity, arc: 0 }, tween: 0, rifle: 0, rifleWhat: [], pop: 0, popWhat: [], clears: [], paint: 0, casualty: null, endMs: null, cards: null,
    rule: { strikes: 0, bad: [], ledger: null, card: null } };
  const prev = { known: {}, pending: new Set(), twoKnown: {}, open: {}, at: {}, struck: 0, check: [], seen: {}, k: {}, hits: {}, log: 0 };
  let guns = null;
  const more = (game, ctx) => {
    const st = game.state, R = st.armoury.range, H = R.house, now = st.clock.ms, pid = st.player.id, onLane = H.goAtMs !== null && !H.end;
    if (!H.live) return;
    // (F25 on the live lane: a cue whose #2 is still not in at the lane's end, a casualty having halted every doing inside TWO_CUE_MS
    // of it, is cut by the casualty, not late (v0.0.20's code review moved w to the impact's speed: the private on 1489397426 now falls 1.3 s after room 3's
    // cue, his #2 halted at the door; liveGaugeOf leaves such a cue out of F25 and prints it)
    const K = H.live.casualty;
    if (K && H.end) for (const E of Object.values(ctx?.rec?.entry ?? {})) if (E.cueMs !== null && E.inMs === null && E.cut === undefined && K.atMs >= E.cueMs && K.atMs <= E.cueMs + TWO_CUE_MS) E.cut = K.atMs;
    L.cards ??= { ...(H.live.cards ?? {}) };
    const me = st.actors.list.find(a => a.who === pid), two = H.twoPid ? st.actors.list.find(a => a.who === H.twoPid) : null, c = st.mind?.contact ?? {};
    const men = R.turners.filter(isLive);
    guns ??= Object.fromEntries(men.map(T => [T.key, gunOn(st, T.live.who)]));
    const dt = now - (prev.ms ?? now);
    // ---- F38: every new window, join or known of yours, and every new known of your #2's, on a role-player seen at SEEN ----
    const pend = new Set(c.pending?.ids ?? []);
    for (const T of men) {
      const drawn = c.drawn?.key === T.key;
      const kMe = me ? seenK(st, me, T, now, { drawn }) : 0, kTwo = two ? seenK(st, two, T, now) : 0;
      // (the look reads the tick's bodies mid-tick, before the stop layer turns the head and the feet carry on: a sighting of yours is
      // honest where seenK, computed here for itself, has him at SEEN from your eye's pose at that look (contact.js's runtime
      // me.$look: where you stood and looked, never the detector's verdict: the review of track L found the gauge reading
      // contact.seenAt, the detector's own record, so it could not fail), or at the tick's start or its end, or his round drew the
      // eye in it (his shots, R.house.live.shots); your #2's by the house's own reading of him (liveTick's H.two.seenAt), the
      // tick's start or its end)
      const drew = (H.live.shots ?? []).some(x => (x.by ?? x.key) === T.key && x.atMs >= (prev.ms ?? now) - TICK_MS);
      const look = me?.$look && me.$look.ms >= (prev.ms ?? now) ? { ...me, x: me.$look.x, z: me.$look.z, headRad: me.$look.headRad ?? undefined, face: me.$look.face ?? me.face } : null;
      const kLook = look ? seenK(st, look, T, me.$look.ms, { drawn }) : 0;
      const kMe0 = drew ? 1 : Math.max(kMe, kLook, prev.k[`me|${T.key}`] ?? 0), kTwo0 = (H.two?.seenAt?.[T.key] ?? -Infinity) >= (prev.ms ?? now) || drew ? 1 : Math.max(kTwo, prev.k[`two|${T.key}`] ?? 0);
      prev.k[`me|${T.key}`] = kMe; prev.k[`two|${T.key}`] = kTwo;
      const newMine = (c.known?.[T.key] !== undefined && prev.known[T.key] === undefined) || (pend.has(T.key) && !prev.pending.has(T.key));
      if (newMine) { L.win++; if (kMe0 < SEEN - 1e-6) L.winBad.push(`${tier} ${seed} ${T.stand} at ${now - H.goAtMs} ms, seenK ${r3(kMe)}`); }
      const newTwo = H.two?.known?.[T.key] !== undefined && prev.twoKnown[T.key] === undefined;
      if (newTwo) { L.twoKnown++; if (kTwo0 < SEEN - 1e-6) L.twoBad.push(`${tier} ${seed} ${T.stand} by your #2 at ${now - H.goAtMs} ms, seenK ${r3(kTwo)}`); }
      // (in the open, up, in your sight or your #2's, unknown to that viewer: the run's length while time runs)
      for (const [who, k, known] of [['me', kMe, c.known?.[T.key] !== undefined || pend.has(T.key) || (c.last?.ids ?? []).includes(T.key)], ['two', kTwo, H.two?.known?.[T.key] !== undefined]]) {
        const key = `${who}|${T.key}`;
        if (onLane && k >= SEEN && upNow(T, now) && T.face !== 'noshoot' && !known) {
          prev.open[key] ??= now;
          const run = now - prev.open[key];
          if (run > L.openMax) { L.openMax = run; L.openAt = `${tier} ${seed} ${T.stand} by ${who} at ${now - H.goAtMs} ms`; }
        } else if (prev.open[key] !== undefined) {
          if (known) L.seenToKnown.push(now - prev.open[key]);
          delete prev.open[key];
        }
      }
      // ---- F42: his body against the walls, the stack's gap, a moving leaf's arc ----
      const a = st.actors.list.find(x => x.who === T.live.who);
      if (a && onLane) {
        const o = overlapOf(st, a.x, a.z, now);
        if (o.m > WALL_TOL_M) L.bodies.wall++;
        L.bodies.worstM = Math.max(L.bodies.worstM, r3(o.m));
        if (upNow(T, now)) for (const m of [me, two]) if (m) { const d = Math.hypot(m.x - a.x, m.z - a.z); L.bodies.minGapM = Math.min(L.bodies.minGapM, r3(d)); if (d < BODY_GAP_M) L.bodies.gap++; }
        if (dt > 0 && arcsOf(R.area ?? st.places.live.area).some(Z => arcLiveAt(st, Z, a.x, a.z, now))) L.bodies.arc++;
        // ---- F43: his tween start where he was, and his rifle on him or on the floor ----
        const was = prev.at[T.key];
        if (was && dt > 0 && Math.hypot((a.$px ?? a.x) - was[0], (a.$pz ?? a.z) - was[1]) > 1e-6 && Math.hypot(a.x - was[0], a.z - was[1]) > 1e-6) L.tween++;
        prev.at[T.key] = [a.x, a.z];
        const g = guns[T.key];
        if (g && st.items[g] && itemOwnerOf(st, g) !== T.live.who && !lyingOf(st, st.places.live.area).some(l => l.id === g)) { L.rifle++; if (L.rifleWhat.length < 3) L.rifleWhat.push(`${T.stand} at ${now - H.goAtMs} ms`); }
      }
      // ---- F43: his dropped rifle falls, never pops: first drawn on the floor near his hands' height, no tick's fall over half of it ----
      if (T.live.st === 'hands' && guns[T.key] && (prev.fell ??= {})[T.key] !== 'done') {
        const f = (LOOK.rangeLook(st, now)?.house?.floor ?? []).find(x => x.id === guns[T.key]), FROM_M = LOOK.FLOOR_FROM_M ?? 0.9;
        if (f) {
          const was = prev.fell[T.key];
          if (was === undefined ? f.y < FROM_M / 2 : was - f.y > FROM_M / 2) { L.pop++; if (L.popWhat.length < 3) L.popWhat.push(`${tier} ${seed} ${T.stand} at ${now - H.goAtMs} ms, y ${was ?? '-'} to ${f.y} m`); }
          prev.fell[T.key] = f.y > 0 ? f.y : 'done';
        }
      }
      prev.known[T.key] = c.known?.[T.key];
      prev.twoKnown[T.key] = H.two?.known?.[T.key];
    }
    prev.pending = pend;
    // ---- F39: rounds on a role-player begun LATE_ROUND_MS after his down tick, or after his give's first tick (st 'hands') ----
    for (const T of men) if (T.live.st === 'hands' && (prev.gave ??= {})[T.key] === undefined) prev.gave[T.key] = Math.min(now, T.live.fromMs ?? now);
    for (const f of game.facts('shot')) {
      if (!f.fired || !f.target) continue;
      const T = men.find(x => x.key === f.target);
      if (T && T.stoppedAtMs !== null && T.stoppedAtMs !== undefined && f.atMs >= T.stoppedAtMs + LATE_ROUND_MS) L.late.push(`${tier} ${seed} ${T.stand} by ${f.who === pid ? 'you' : 'your #2'} ${f.atMs - T.stoppedAtMs} ms after his down`);
      else if (T && prev.gave?.[T.key] !== undefined && f.atMs >= prev.gave[T.key] + LATE_ROUND_MS) L.late.push(`${tier} ${seed} ${T.stand} by ${f.who === pid ? 'you' : 'your #2'} ${f.atMs - prev.gave[T.key]} ms after his hands came up`);
    }
    // ---- F41: a beat begun by a startled you; strikes on their tick; a strike by a man unknown answered within a tick ----
    if (startled(st, pid, now)) for (const f of game.facts('bundle')) if (f.who === pid && f.phase === 'beat') L.startBeat++;
    const struck = H.live.struck ?? [];
    for (const x of struck.slice(prev.struck)) {
      // (a strike lands in the tick just run, which began at the clock's last reading: prev.ms up to now)
      if (!(x.atMs >= (prev.ms ?? now) && x.atMs < Math.max(now, (prev.ms ?? now) + 1))) L.strikeLate++;
      if (x.who === pid) { L.paint++; if (c.known?.[x.by] === undefined && !pend.has(x.by)) prev.check.push({ key: x.by, atMs: now }); }
      else if (x.who === H.twoPid) L.paint++;
    }
    prev.struck = struck.length;
    prev.check = prev.check.filter(k => {
      if (now === k.atMs) return true;
      // (the next tick lived since the strike: its look has had its tick)
      L.drawnN++;
      if (!(c.known?.[k.key] !== undefined || pend.has(k.key) || c.drawn?.key === k.key)) L.drawnLate++;
      return false;
    });
    // ---- F45: the one rule: every strike rated once on its tick; a casualty and a man down if and only if a fatal entry ----
    if (H.live.would) {
      // (each wrong once a lane, at its first tick: a casualty without its fatal strike would say so every tick of its beat)
      const W = H.live.would, bad = (why) => { const k = why.replace(/\(sh\w+\)/, ''); if ((prev.bad ??= new Set()).has(k)) return; prev.bad.add(k); L.rule.bad.push(`${tier} ${seed} at ${now - H.goAtMs} ms: ${why}`); };
      const entries = (shotId, on) => W.log.filter(e => e.shotId === shotId && e.on === on), fresh = new Set();
      // (this tick's strikes: on the stack (R.house.live.struck), on a role-player while he was up (his T.hits in A, C or the head)
      for (const x of struck.slice(prev.struck45 ?? 0)) { L.rule.strikes++; fresh.add(`${x.shotId}|${x.who}`); if (entries(x.shotId, x.who).length !== 1) bad(`a strike on the stack rated ${entries(x.shotId, x.who).length} times (${x.shotId})`); }
      prev.struck45 = struck.length;
      for (const T of men) {
        for (const h of T.hits.slice(prev.hits[T.key] ?? 0)) {
          if (!['A', 'C', 'head'].includes(h.zone) || (T.stoppedAtMs !== null && T.stoppedAtMs !== undefined && T.stoppedAtMs < h.atMs)) continue;
          L.rule.strikes++; fresh.add(`${h.shotId}|${T.live.who}`);
          if (entries(h.shotId, T.live.who).length !== 1) bad(`a strike on ${T.stand} rated ${entries(h.shotId, T.live.who).length} times (${h.shotId})`);
        }
        prev.hits[T.key] = T.hits.length;
        const f = fatalOf(st, T.live.who);
        if (f && T.live.st !== 'down' && T.live.st !== 'out') bad(`${T.stand} fatal (${f.why}) and ${T.live.st}`);
        if (T.live.st === 'down' && (!f || T.stoppedAtMs !== f.atMs)) bad(`${T.stand} down with ${f ? `his fatal strike at ${f.atMs - H.goAtMs} ms, stopped at ${T.stoppedAtMs - H.goAtMs}` : 'no fatal strike'}`);
      }
      // (every entry written this tick is one of this tick's strikes: rated on its tick, never later or for nothing)
      for (const e of W.log.slice(prev.log)) if (!fresh.has(`${e.shotId}|${e.on}`)) bad(`an entry not on its strike's tick (${e.shotId})`);
      prev.log = W.log.length;
      const fm = fatalOf(st, pid), ft = H.twoPid ? fatalOf(st, H.twoPid) : null, K = H.live.casualty;
      if ((fm || ft) && !K) bad('a fatal strike on the stack and no casualty');
      if (K && !fatalOf(st, K.who)) bad(`a casualty on ${K.who === pid ? 'you' : 'your #2'} with no fatal strike`);
      if (K && fatalOf(st, K.who) && K.shotId !== undefined && K.shotId !== fatalOf(st, K.who).shotId) bad('the casualty not on its fatal strike');
    }
    // ---- F40: at each "Clear!", the leg's men the team has seen: none up and unaccounted ----
    for (const f of game.facts('house')) if (f.phase === 'clear') {
      const k = [...H.rooms, H.hall].findIndex(V => V.room === f.room);
      for (const T of men) if (Number(T.stand[0]) - 1 === k && H.live.seenBy?.[T.key] !== undefined && accountedOf(st, T) !== 'out') L.clears.push(`${tier} ${seed} ${T.stand} up at the call, ${now - H.goAtMs} ms`);
    }
    if (H.live.casualty) L.casualty = { ...H.live.casualty };
    // (the race at the door (tests/live-race.test.mjs): each role-player's first round less the stack's first on him, once both are in)
    for (const T of men) if (Number.isFinite(T.live.firstAtMs) && Number.isFinite(T.firstAtMs) && !(L.gapOf ??= {})[T.key]) L.gapOf[T.key] = T.live.firstAtMs - T.firstAtMs;
    if (H.end && L.endMs === null) {
      L.endMs = H.end.atMs;
      // (F45 at the lane's end: a casualty's lane on a fatal strike, its card naming the man and the why; every real body unhurt)
      const W = H.live.would, K = H.live.casualty, f = K ? fatalOf(st, K.who) : null;
      L.rule.ledger = W ? { rule: W.rule, n: W.log.length, wounds: W.log.filter(e => !e.fatal && e.why !== 'stopped').length, stopped: W.log.filter(e => e.why === 'stopped').length,
        fatal: W.log.filter(e => e.fatal).map(e => `${e.on === pid ? 'you' : e.on === H.twoPid ? 'two' : 'rp'}:${e.why}`), rpDown: men.filter(T => T.live.st === 'down' || fatalOf(st, T.live.who)).map(T => W.log.filter(e => e.on === T.live.who).findIndex(e => e.fatal) + 1) } : null;
      if (H.end.why === 'casualty' && !f) L.rule.bad.push(`${tier} ${seed}: the lane ended 'casualty' on no fatal strike`);
      L.rule.endWhy = H.end.why; L.rule.casualty = K ? { mine: K.who === pid, why: f?.why ?? null } : null;
      L.rule.card = runSheetOf(st).card;
      const hurt = [pid, H.twoPid, ...men.map(T => T.live.who)].filter(p => p && (st.people[p]?.body?.injuries ?? []).length);
      if (hurt.length) L.rule.bad.push(`${tier} ${seed}: a real body hurt by paint (${hurt.join(', ')})`);
    }
    prev.ms = now;
  };
  const rec = flawlessLane({ tier, seed, bot: bot ?? (keys ? 'keys' : 'honest'), fill: { opfor, ...(draw ? { draw } : {}), ...(house ? { house } : {}), ...(rooms ? { rooms } : {}), ...(layout ? { layout } : {}) }, more });
  rec.opfor = opfor;
  rec.live = L;
  // (F45: the card names the fatal strike's man and its why: "CASUALTY · FATAL: THE CHEST, …" or "… FATAL ON YOUR #2: …")
  if (L.rule.casualty?.why && L.rule.casualty.why !== 'count') {
    const card = String(L.rule.card ?? ''), want = `CASUALTY · FATAL${L.rule.casualty.mine ? '' : ' ON YOUR #2'}: ${WOULD_WHY[L.rule.casualty.why]}`;
    if (!card.startsWith(want)) L.rule.bad.push(`${tier} ${seed}: the card does not read "${want}" (${card.slice(0, 80)})`);
  }
  // (over 0: the role-player fired first; a man who never fired, or whom the stack never fired on, has none)
  rec.liveGaps = Object.values(L.gapOf ?? {}).map(ms => -ms);
  // (a casualty lane is measured over the legs it reached: F9's men left up and F10's pars only there)
  if (rec.end === 'casualty') {
    const reached = rec.legState.findLastIndex(x => x !== 'ahead');
    const legOfStand = (s) => (s === 'H' ? 3 : Number(s[0]) - 1);
    // (the leg the cease fire came in: a man still up that nobody had fired on is not "left up" (the lane ended before his turn,
    // the casualty's own fault and card); a man fired on there is judged as ever)
    rec.engaged = rec.engaged.filter(x => legOfStand(x.stand) < reached || (legOfStand(x.stand) === reached && !(x.up && x.by === null)));
    rec.pars.missed = rec.pars.missed.filter(m => legOfStand(m.stand) <= reached);
  }
  return rec;
}

/** The live lanes: every sheet over `seeds` with the drawn cards, then each of `forced` once on `forcedSeed`. */
export function liveLanes({ sheets = SHEETS, seeds = flawlessSeeds(3), forced = FORCED, forcedSeed = 48213, print = true } = {}) {
  const recs = [];
  for (const tier of sheets) {
    const mine = [...seeds.map(seed => liveLane({ tier, seed })), ...forced.map(opfor => liveLane({ tier, seed: forcedSeed, opfor }))];
    recs.push(...mine);
    if (print) {
      const xs = mine.map(r => r.laneS).filter(Number.isFinite);
      console.log(`      ${tier.padEnd(8)} ${mine.length} lanes (${mine[0].bot}): mean ${s1(mean(xs))} s, max ${s1(xs.length ? Math.max(...xs) : null)}; ends ${top(tally(mine.map(r => r.err ? 'throw' : r.end ?? 'none')))}; paint on the stack in ${mine.filter(r => r.live.paint > 0).length}; cards ${top(tally(mine.map(r => Object.values(r.live.cards ?? {}).join(','))))}; dead ends ${s2(mean(mine.map(r => Object.values(r.mem?.dead ?? {}).reduce((a, b) => a + b, 0))))} a lane`);
    }
  }
  return recs;
}

/** The live gauge: gaugeOf's rows with F15, F21 and F22 read the live lane's way, then F38 to F44. */
export function liveGaugeOf(recs) {
  // (the cues a casualty cut (liveLane: E.cut) left out of F25, counted on its row)
  const cut = recs.flatMap(r => Object.entries(r.entry ?? {}).filter(([, E]) => E.cut !== undefined).map(([door]) => `${r.bot} ${r.tier} ${r.seed} ${door.replace(/^o:w4:/, '')}`));
  const view = recs.map(r => ({ ...r, entry: Object.fromEntries(Object.entries(r.entry ?? {}).filter(([, E]) => E.cut === undefined)) }));
  const rows = gaugeOf(view).map(r => {
    if (r.id === 'F25') return { ...r, value: `${r.value}; cues cut by a casualty before he was in ${cut.length}${cut.length ? ` (${cut.slice(0, 3).join('; ')})` : ''}` };
    if (r.id === 'F15') {
      const xs = recs.filter(x => x.bot === 'honest' && x.rung >= 2 && x.end !== 'casualty').map(x => x.laneS).filter(Number.isFinite), max = xs.length ? Math.max(...xs) : null;
      return { ...r, name: 'lane time (the live lanes, honest, but a casualty\'s)', met: xs.length > 0 && max <= LIVE_LANE_MAX_S, value: `mean ${s1(mean(xs))} s, p95 ${s1(quantile(xs, 0.95))}, max ${s1(max)}`, target: `max ${LIVE_LANE_MAX_S} s (LIVE_LANE_MAX_S; LANE_MAX_S untouched)` };
    }
    if (r.id === 'F21' || r.id === 'F22') return { ...r, met: true, value: `${r.value} (printed only: the turner lane's references)` };
    return r;
  });
  const Ls = recs.map(r => r.live), sum = (f) => Ls.reduce((a, L) => a + f(L), 0);
  const bad38 = [...Ls.flatMap(L => L.winBad), ...Ls.flatMap(L => L.twoBad)], openMax = Math.max(0, ...Ls.map(L => L.openMax)), openAt = Ls.reduce((a, L) => (L.openMax > (a?.openMax ?? -1) ? L : a), null)?.openAt;
  const s2k = Ls.flatMap(L => L.seenToKnown);
  rows.push({ id: 'F38', name: 'perception honest', met: !bad38.length && openMax <= OPEN_UNKNOWN_MS, value: `${sum(L => L.win)} windows and knowns of yours, ${sum(L => L.twoKnown)} of your #2's; under SEEN ${bad38.length}${bad38.length ? ` (${bad38.slice(0, 3).join('; ')})` : ''}; in the open unknown at most ${s2(openMax / 1000)} s (${openAt ?? 'none'}); seen to known p50 ${s2((quantile(s2k, 0.5) ?? 0) / 1000)} s, p95 ${s2((quantile(s2k, 0.95) ?? 0) / 1000)} s, max ${s2(Math.max(0, ...s2k) / 1000)} s over ${s2k.length}`, target: `0 under SEEN; at most ${OPEN_UNKNOWN_MS / 1000} s` });
  const sur = recs.reduce((a, r) => a + (r.faults.surrendered ?? 0), 0), late = Ls.flatMap(L => L.late);
  rows.push({ id: 'F39', name: 'no round on a man believed down or given up', met: !sur && !late.length, value: `'surrendered' ${sur}; rounds begun ${LATE_ROUND_MS} ms or more after his down or his give ${late.length}${late.length ? ` (${late.slice(0, 3).join('; ')})` : ''}`, target: '0' });
  const honest = recs.filter(r => r.bot === 'honest'), cl = Ls.flatMap(L => L.clears), unc = honest.reduce((a, r) => a + (r.faults.uncovered ?? 0), 0), reo = honest.reduce((a, r) => a + (r.faults.reopened ?? 0), 0);
  const kUnc = recs.filter(r => r.bot === 'keys').reduce((a, r) => a + (r.faults.uncovered ?? 0), 0), kReo = recs.filter(r => r.bot === 'keys').reduce((a, r) => a + (r.faults.reopened ?? 0), 0);
  rows.push({ id: 'F40', name: 'every man of the leg accounted for at "Clear!"', met: !cl.length && !unc && !reo, value: `seen and up at a call ${cl.length}${cl.length ? ` (${cl.slice(0, 3).join('; ')})` : ''}; honest 'uncovered' ${unc}, 'reopened' ${reo}; the keys' 'uncovered' ${kUnc}, 'reopened' ${kReo} (printed)`, target: '0 (honest)' });
  const cas = recs.filter(r => r.live.casualty), casLate = cas.filter(r => r.live.endMs === null || r.live.endMs - r.live.casualty.atMs > CASUALTY_MS + TICK_MS);
  rows.push({ id: 'F41', name: 'interrupts', met: !sum(L => L.startBeat) && !sum(L => L.strikeLate) && !sum(L => L.drawnLate) && !casLate.length, value: `beats begun startled ${sum(L => L.startBeat)}; strikes ${sum(L => L.paint)}, recorded off their tick ${sum(L => L.strikeLate)}; by a man unknown ${sum(L => L.drawnN)}, no window or drawn eye the next tick ${sum(L => L.drawnLate)}; casualties ${cas.length}, to the lane's end over ${(CASUALTY_MS + TICK_MS) / 1000} s ${casLate.length}`, target: '0; 0; 0; 0' });
  const B = Ls.map(L => L.bodies), minGap = Math.min(...B.map(b => b.minGapM));
  rows.push({ id: 'F42', name: 'role-players are bodies', met: !B.some(b => b.wall || b.gap || b.arc), value: `ticks against a wall or leaf over ${WALL_TOL_M} m ${B.reduce((a, b) => a + b.wall, 0)} (worst ${s2(Math.max(0, ...B.map(b => b.worstM)) * 100)} cm); under ${BODY_GAP_M} m of the stack while up ${B.reduce((a, b) => a + b.gap, 0)} (least ${Number.isFinite(minGap) ? s2(minGap) : '-'} m); in a moving leaf's arc ${B.reduce((a, b) => a + b.arc, 0)}`, target: '0' });
  rows.push({ id: 'F43', name: 'the figure says what the sim says', met: !sum(L => L.tween) && !sum(L => L.rifle) && !sum(L => L.pop), value: `tween start not where he was ${sum(L => L.tween)}; his rifle neither on him nor on the floor ${sum(L => L.rifle)}${sum(L => L.rifle) ? ` (${Ls.flatMap(L => L.rifleWhat).slice(0, 3).join('; ')})` : ''}; a dropped rifle popped to the floor ${sum(L => L.pop)}${sum(L => L.pop) ? ` (${Ls.flatMap(L => L.popWhat).slice(0, 3).join('; ')})` : ''}`, target: '0' });
  const by = {}; for (const r of recs) { const o = by[r.tier] ??= { n: 0, paint: 0 }; o.n++; if (r.live.paint > 0) o.paint++; }
  const share = (t) => (by[t] ? by[t].paint / by[t].n : null), t1 = share('tierone'), rc = share('recruit');
  const met44 = t1 !== null && rc !== null && t1 <= PAINT_TIERONE_MAX && rc >= t1 + PAINT_GAP_PTS / 100;
  rows.push({ id: 'F44', name: 'balance by sheet', met: met44, value: `paint on the stack: ${Object.entries(by).map(([t, o]) => `${t} ${o.paint}/${o.n} (${Math.round(o.paint / o.n * 100)}%)`).join(', ')}`, target: `the tier one ${PAINT_TIERONE_MAX * 100}% or less; the recruit the tier one's + ${PAINT_GAP_PTS} points or more` });
  const bad45 = Ls.flatMap(L => L.rule.bad), led = Ls.map(L => L.rule.ledger).filter(Boolean);
  const whys = tally(led.flatMap(x => x.fatal)), downs = led.flatMap(x => x.rpDown).filter(n => n > 0);
  rows.push({ id: 'F45', name: 'one rule for every strike', met: !bad45.length, value: `${sum(L => L.rule.strikes)} strikes rated, ${bad45.length} wrong${bad45.length ? ` (${bad45.slice(0, 3).join('; ')})` : ''}; the ledger: wounds ${led.reduce((a, x) => a + x.wounds, 0)}, stopped ${led.reduce((a, x) => a + x.stopped, 0)}, fatal ${top(whys) || 'none'}; a role-player down on his strike ${top(tally(downs.map(String))) || 'none'}`, target: '0 wrong' });
  const byC = {}; for (const r of recs) { const o = byC[r.tier] ??= { n: 0, cas: 0, me: 0, two: 0 }; o.n++; if (r.end === 'casualty') { o.cas++; if (r.live.rule.casualty?.mine) o.me++; else o.two++; } }
  const cshare = (t) => (byC[t] ? byC[t].cas / byC[t].n : null), c1 = cshare('tierone'), cr = cshare('recruit');
  rows.push({ id: 'F46', name: 'casualty balance by sheet', met: c1 !== null && cr !== null && c1 <= CASUALTY_TIERONE_MAX && cr >= c1 + CASUALTY_GAP_PTS / 100, value: `lanes ending 'casualty': ${Object.entries(byC).map(([t, o]) => `${t} ${o.cas}/${o.n} (${Math.round(o.cas / o.n * 100)}%${o.cas ? `: you ${o.me}, your #2 ${o.two}` : ''})`).join(', ')}`, target: `the tier one ${CASUALTY_TIERONE_MAX * 100}% or less; the recruit the tier one's + ${CASUALTY_GAP_PTS} points or more` });
  return rows;
}
/** The live criteria failing: F1 to F26 where ENFORCED (F15 the live lane's), F38 to F44 where LIVE_ENFORCED. */
export const liveFailing = (rows) => rows.filter(r => (ENFORCED.has(r.id) || LIVE_ENFORCED.has(r.id)) && !r.met).map(r => `${r.id} ${r.name}: ${r.value}`);
export { houseNow };
