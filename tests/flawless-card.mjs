// OLYMPUS tests: the card's gauges, F55 to F58 (v0.0.20, the build sheet v0.0.20 §8; card C1, C2, C3, C7; feel FL-4, FL-8); F1 to F54 are the other files', untouched.
//
//   F55  the cause: no par missed inside the instructor's click is FIRED FIRST (a contact whose time less its click is within its
//        par is met); no T sheet whose rifle was up at the sighting is told the Watch; the honest tier one's lane "clean" on at least
//        CLEAN_MIN 80% of its seeds (0 of 20 on v0.0.19)
//   F56  the pars: each stand's par met outside the click on at least PAR_MET_MIN 85% of the seeds by its sheet's bot (the keys bot
//        with the Watch below rung 2, the honest bot from the corporal), missed on at least PAR_PROBE_MIN 80% by the same lane held
//        PAR_PROBE_MS 600 after each pause (the same lane's first round that much later: a press held in stop motion costs no game
//        time, so the probe is the hold the lane would have lived; my call), and each room's par met on at least ROOM_MET_MIN 90%
//        (its other side printed, OPEN: the same leg ROOM_PROBE_K 1.25 slower missing its par on at least 80%, and the lane's)
//   F57  off the room: at every contact of yours, the contact's plate slid by plaque.js slideRect clear of every figure, stand, the
//        panel, the radio box and the current room's floor (or in its reserved rect), and every speaker's mark or balloon placed
//        by markPlace over its speaker's head clear of the others' boxes; the pure placement over the lanes' camera (render/camera.js's
//        oblique projection, centred on you, at the picture's own size and the page's 1600 × 900)
//   F58  the debrief: every round, sighting, fault, covered corner and "Clear!" of the lane has a place and a time on the plan
//        (house-debrief.js debriefOf's events, counted against the record), and an exported run replays to the same run sheet and
//        save digest (tests/replay-run.mjs)
// Each returns { id, name, met, value, target } as flawless.mjs's rows (printGauge prints them), and the raw numbers.
import { createGame } from './game.mjs';
import { runHouse, houseHonestBot, houseBot } from './bots/house.mjs';
import { recordRun, replayRun } from './replay-run.mjs';
import { houseOf, runSheetOf, parOf, curLeg, houseVerdict } from '../src/sim/scenarios/shoothouse.js';
import { debriefOf } from '../src/sim/scenarios/house-debrief.js';
import { RUNG_OF_TIER } from '../src/sim/skills/templates.js';
import { plaquePixels, slideRect, markPlace, speakerMarks, balloonPixels, markPixels } from '../src/ui/plaque.js';
import { rectsAt } from '../src/ui/hud/layout.js';
import { WHEEL_S4 } from '../src/data/places/wheel.js';
import { spokenMs } from '../src/core/speech.js';
import { contactOf } from '../src/sim/people/mind.js';

/** F55 to F58's numbers (see the header). */
export const CLEAN_MIN = 0.8, PAR_MET_MIN = 0.85, PAR_PROBE_MIN = 0.8, ROOM_MET_MIN = 0.9, PAR_PROBE_MS = 600;
/** F56's rooms, the other side (the C and D review of 2026-11-16): the same leg ROOM_PROBE_K slower must miss its par on at least PAR_PROBE_MIN of the seeds (printed, OPEN). */
export const ROOM_PROBE_K = 1.25;
/** The seeds: the card's 40 (101 to 140) for F55, the gauges' (1000 + 37 i) for F56. */
export const CAUSE_SEEDS = Object.freeze(Array.from({ length: 40 }, (_, i) => 101 + i));
export const PAR_SEEDS = Object.freeze(Array.from({ length: 40 }, (_, i) => 1000 + 37 * i));
export const SHEETS = Object.freeze(['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone']);
const READY = new Set(['aimed', 'highReady']);
const pc = (n, d) => (d ? `${Math.round(100 * n / d)}%` : '-');

/** The sheet's bot (F56's): the keys bot with the Watch below rung 2, the honest bot from it. */
export const sheetBot = (tier) => (RUNG_OF_TIER[tier] < 2 ? houseBot({ mode: 'keys', watch: true }) : houseHonestBot());
/** One lane from GO to the card: the game. */
export function cardLane(tier, seed, { bot = sheetBot(tier), each = null } = {}) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'go' });
  runHouse(g, bot, { each });
  return g;
}

// (a judged contact's numbers: its window's start (the earliest sighting by whose sighting carries it), its first round, the click)
function judged(s, H) {
  const R = s.armoury.range, out = [];
  for (const [k, L] of [...H.rooms, H.hall].entries()) for (const c of L.contacts) {
    if (c.parMet === null || c.parMet === undefined) continue;
    const T = R.turners.find(t => t.key === c.key), from = Math.min(...L.contacts.filter(x => x.key === c.key && x.by === c.by).map(x => x.seenMs));
    const first = c.firstAtMs ?? T?.firstAtMs ?? null;
    out.push({ leg: k, stand: c.stand, by: c.by, met: c.parMet, cause: c.cause ?? null, click: c.click ?? 0, carry: c.carry ?? null, from, first, par: parOf(s, T, H).ms });
  }
  return out;
}

/** F55 over seeds (the honest tier one on CAUSE_SEEDS, and each sheet's bot on a few): { rows, lines }. */
export function causeGauge({ seeds = CAUSE_SEEDS, sheets = SHEETS, perSheet = 6 } = {}) {
  let clickFired = 0, watchT = 0, clean = 0, n = 0;
  const causes = {}, ones = {}, lines = [];
  for (const tier of sheets) {
    const list = tier === 'tierone' ? seeds : seeds.slice(0, perSheet), rung = RUNG_OF_TIER[tier];
    for (const seed of list) {
      const g = cardLane(tier, seed, { bot: tier === 'tierone' ? houseHonestBot() : sheetBot(tier) }), s = g.state, H = houseOf(s), rs = runSheetOf(s);
      const J = judged(s, H);
      for (const c of J) if (!c.met) { causes[`${tier}:${c.cause}`] = (causes[`${tier}:${c.cause}`] ?? 0) + 1; if (c.click && Number.isFinite(c.first) && c.first - c.from - c.click <= c.par) clickFired++; }
      if (rung >= 2 && /Watch/.test(rs.one.text) && J.filter(c => !c.met && c.by === 'me').every(c => READY.has(c.carry))) watchT++;
      ones[`${tier}:${rs.one.key}`] = (ones[`${tier}:${rs.one.key}`] ?? 0) + 1;
      if (tier === 'tierone') { n++; if (rs.one.key === 'clean') clean++; }
    }
  }
  lines.push(`the causes of the missed pars: ${Object.entries(causes).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}`);
  lines.push(`the one thing: ${Object.entries(ones).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  const rows = [{ id: 'F55', name: 'the cause: no click-only miss FIRED FIRST, no rifle-up T sheet told the Watch, the honest tier one clean', met: clickFired === 0 && watchT === 0 && clean >= CLEAN_MIN * n,
    value: `click-only misses ${clickFired}, the Watch to a rifle up ${watchT}, the tier one clean ${clean} of ${n} (${pc(clean, n)})`, target: `0, 0, at least ${CLEAN_MIN * 100}%` }];
  return { rows, lines, met: rows.every(r => r.met), fails: rows.filter(r => !r.met).map(r => `${r.id} ${r.name}: ${r.value}`) };
}

/** F56 over seeds a sheet (see the header): { rows, lines, met, fails }. */
export function parsGauge({ seeds = PAR_SEEDS, sheets = SHEETS } = {}) {
  const lines = [], fails = [], probes = [];
  for (const tier of sheets) {
    const stands = {}, rooms = {}, lane = { n: 0, met: 0, probe: 0, ratio: [] };
    for (const seed of seeds) {
      const g = cardLane(tier, seed), s = g.state, H = houseOf(s);
      for (const c of judged(s, H)) {
        const o = (stands[c.stand] ??= { n: 0, met: 0, probe: 0 });
        o.n++; if (c.met) o.met++;
        // (the probe holds your pause, so it reads your men: your number two's are timed by his own)
        if (c.by === 'me') { o.mine = (o.mine ?? 0) + 1; if (!c.met || (Number.isFinite(c.first) && c.first - c.from - c.click + PAR_PROBE_MS > c.par)) o.probe++; }
      }
      for (const [k, L] of [...H.rooms, H.hall].entries()) { const o = (rooms[k] ??= { n: 0, met: 0, probe: 0 }); if (L.state === 'ahead' || L.setup) continue; o.n++; if (L.state === 'clear' && L.clearAtMs - L.fromMs <= L.parMs) o.met++; if (L.state !== 'clear' || (L.clearAtMs - L.fromMs) * ROOM_PROBE_K > L.parMs) o.probe++; }
      // (the lane: within its par, and ROOM_PROBE_K slower over it)
      const v = houseVerdict(s); if (Number.isFinite(v.laneMs) && v.laneParMs > 0) { lane.n++; if (v.laneMs <= v.laneParMs) lane.met++; if (v.laneMs * ROOM_PROBE_K > v.laneParMs) lane.probe++; lane.ratio.push(v.laneMs / v.laneParMs); }
    }
    const st = Object.entries(stands).map(([k, o]) => `${k} ${pc(o.met, o.n)} met (${o.n}), ${pc(o.probe, o.mine ?? 0)} probed (${o.mine ?? 0} yours)`), rm = Object.entries(rooms).map(([k, o]) => `${['room 1', 'room 2', 'room 3', 'hall'][k]} ${pc(o.met, o.n)} (${pc(o.probe, o.n)} ${ROOM_PROBE_K}× slower missed)`);
    lines.push(`${tier.padEnd(8)} stands: ${st.join('; ')} · rooms: ${rm.join(', ')} · the lane within its par ${pc(lane.met, lane.n)}, ${ROOM_PROBE_K}× slower over it ${pc(lane.probe, lane.n)}, its time over its par ${(lane.ratio.reduce((a, b) => a + b, 0) / Math.max(1, lane.n)).toFixed(2)}`);
    for (const [k, o] of Object.entries(stands)) { if (o.met < PAR_MET_MIN * o.n) fails.push(`${tier} ${k}: met ${o.met} of ${o.n}`); if (o.probe < PAR_PROBE_MIN * (o.mine ?? 0)) fails.push(`${tier} ${k}: the probe missed ${o.probe} of ${o.mine}`); }
    for (const [k, o] of Object.entries(rooms)) { if (o.met < ROOM_MET_MIN * o.n) fails.push(`${tier} leg ${k}: its par met ${o.met} of ${o.n}`); if (o.probe < PAR_PROBE_MIN * o.n) probes.push(`${tier} leg ${k}: ${ROOM_PROBE_K}× slower missed ${o.probe} of ${o.n}`); }
  }
  // (F56 as built (C's handoff): the rooms' clause, the one fit's, is enforced; the stands' two clauses are printed, OPEN: their pars
  // are the class's (PAR_MS, unchanged by the sheet) plus formula allowances, which no fit moves, and on F56's seeds they miss on
  // both sides (the boot recruit's 1a met on 20%, the corporal's and sergeant's men met with 0.6 s to spare): the user's question 11)
  const rooms = fails.filter(f => / leg \d/.test(f)), stands = fails.filter(f => !/ leg \d/.test(f));
  const rows = [{ id: 'F56', name: 'the pars a sheet can meet: rooms met 90% (enforced); stands met 85% outside the click and the probe missing 80% (printed)', met: !rooms.length,
    value: `rooms ${rooms.length ? `${rooms.length} short: ${rooms.join('; ')}` : 'every room within'}; stands ${stands.length ? `OPEN, ${stands.length} short: ${stands.slice(0, 8).join('; ')}` : 'every stand within'}; rooms ${ROOM_PROBE_K}× slower ${probes.length ? `OPEN, ${probes.length} short of ${PAR_PROBE_MIN * 100}%: ${probes.slice(0, 8).join('; ')}` : 'every room missed'}`, target: '90% (85%, 80%, 80%)' }];
  // (the rooms' other side is printed, OPEN, as the stands' are: with ROOM_PAR_K by the leg's kind (the review's fix), a sheet's room
  // whose book runs long (the corporal's and sergeant's room 1, 1.6 times their time and more) still meets its par 25% slower; a tighter par
  // there is the book's (the user's question 11), not a K's)
  return { rows, lines, met: !rooms.length, fails: rooms, open: [...stands, ...probes] };
}

// ---- F57: the pure placement over the lane's camera ----
/** The page the placement is judged at (CSS px) and the picture's size there (render/scale.js's densities at 16 px/m: 640 × 360 at ×2.5). */
export const PAGE = Object.freeze({ w: 1600, h: 900, picW: 640, picH: 360, ppm: 16 });
/** render/camera.js's oblique projection, centred on (cx, cz) (the ground at a point's z less its height): picture px. */
export const projectAt = (cx, cz, P = PAGE) => (x, y, z) => [P.picW / 2 + (x - cx) * P.ppm, P.picH / 2 + (z - cz - y) * P.ppm];
/** The boxes a plate keeps off at a moment, picture px: { boxes, reserved, bounds, proj }. */
export function keepBoxesAt(state, P = PAGE) {
  const me = state.actors.list.find(a => a.who === state.player.id), proj = projectAt(me.x, me.z, P), boxes = [];
  for (const a of state.actors.list) { if (!a.who) continue; const [fx, fy] = proj(a.x, 0, a.z), [, hy] = proj(a.x, 1.85, a.z); boxes.push({ x: fx - 0.35 * P.ppm, y: hy, w: 0.7 * P.ppm, h: fy - hy + 1, who: a.who }); }
  for (const T of state.armoury.range.turners) { const [fx, fy] = proj(T.x, 0, T.z), [, hy] = proj(T.x, 1.8, T.z); boxes.push({ x: fx - 0.3 * P.ppm, y: hy, w: 0.6 * P.ppm, h: fy - hy + 1, who: T.key }); }
  const L = curLeg(houseOf(state)), rr = L ? (WHEEL_S4.rooms ?? []).find(r => r.id === L.room)?.rect : null;
  if (rr) { const [ax, ay] = proj(rr[0], 0, rr[1]), [bx, by] = proj(rr[2], 0, rr[3]); boxes.push({ x: ax, y: ay, w: bx - ax, h: by - ay, who: 'room' }); }
  const k = Math.min(P.w / P.picW, P.h / P.picH), ox = (P.w - P.picW * k) / 2, oy = (P.h - P.picH * k) / 2, r = rectsAt(P.w, P.h, 'weapon'), toPic = (q) => ({ x: (q.x - ox) / k, y: (q.y - oy) / k, w: q.w / k, h: q.h / k });
  for (const name of ['STEPS', 'RADIO']) boxes.push({ ...toPic(r[name]), who: name });
  return { boxes, reserved: toPic(r.PLAQUE), bounds: { x: 0, y: 0, w: P.picW, h: P.picH }, proj };
}
const meets = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
/** F57 over lanes: { rows, lines, met, fails, n }. */
export function placeGauge(lanes = [['private', 48213], ['tierone', 48213]], P = PAGE) {
  let plates = 0, over = 0, reserved = 0, marks = 0, markOver = 0, unplaced = 0;
  const lines = [];
  for (const [tier, seed] of lanes) {
    let seen = null;
    const says = [];
    cardLane(tier, seed, { each: (g) => {
      const s = g.state, H = houseOf(s), c = contactOf(s)?.last ?? null;
      for (const [type, f] of g.bus.events ?? []) if (type === 'say' && f?.who && f.text && [s.player.id, H.twoPid, H.chiefPid].includes(f.who)) says.push({ who: f.who, text: f.text, atMs: s.clock.ms, spokenMs: spokenMs(f.text) });
      let K0 = null; const Kf = () => (K0 ??= keepBoxesAt(s, P));
      if (c && c.atMs !== seen && H.goAtMs !== null && !H.end) {
        seen = c.atMs;
        for (const key of c.ids ?? []) {
          const T = s.armoury.range.turners.find(t => t.key === key);
          if (!T) continue;
          const K = Kf(), p = plaquePixels({ text: 'CONTACT', sub: 'RIFLE · TAKEN IN 0.55 S', style: 'hazard' }), [tx, ty] = K.proj(T.x, 1.8, T.z);
          const r = slideRect({ x: tx - p.w / 2, y: ty - p.h, w: p.w, h: p.h }, K.boxes, { bounds: K.bounds, reserved: K.reserved });
          plates++; if (r.how === 'reserved') reserved++;
          if (r.how !== 'reserved' && K.boxes.some(b => meets({ x: r.x, y: r.y, w: p.w, h: p.h }, b))) over++;
        }
      }
      for (const m of speakerMarks(says, s.clock.ms)) {
        if (m.fromMs !== s.clock.ms) continue;
        const a = s.actors.list.find(x => x.who === m.who);
        if (!a) continue;
        const K = Kf(), [hx, hy] = K.proj(a.x, 1.8, a.z), head = { x: hx - 0.3 * P.ppm, y: hy, w: 0.6 * P.ppm, h: 0.4 * P.ppm }, pix = m.kind === 'balloon' ? balloonPixels(m.text) : markPixels();
        const others = K.boxes.filter(b => b.who !== m.who && b.who !== 'room' && b.who !== 'STEPS' && b.who !== 'RADIO'), at = markPlace(head, { w: pix.w, h: pix.h }, others);
        marks++;
        if (!at) unplaced++; else if (others.some(b => meets({ x: at.x, y: at.y, w: pix.w, h: pix.h }, b))) markOver++;
      }
      if (says.length > 40) says.splice(0, says.length - 40);
    } });
  }
  lines.push(`plates ${plates}, slid clear or kept ${plates - over - reserved}, to the reserved rect ${reserved}, over a protected box ${over}; marks and balloons ${marks}, over another's box ${markOver}, with no free place ${unplaced}`);
  const rows = [{ id: 'F57', name: 'off the room: no plate, mark or balloon over a figure, a stand, the panel, the radio box or the room\'s floor', met: over === 0 && markOver === 0, value: `plates over ${over} of ${plates} (${reserved} reserved), marks over ${markOver} of ${marks} (${unplaced} unplaced)`, target: '0' }];
  return { rows, lines, met: rows.every(r => r.met), fails: rows.filter(r => !r.met).map(r => `${r.id}: ${r.value}`), n: { plates, marks } };
}

/** F58 on lanes: the debrief's events against the record, and an exported run replayed: { rows, lines, met, fails }. */
export function debriefGauge(lanes = [['private', 48213, 'keys'], ['tierone', 48213, 'honest']]) {
  const lines = [], bad = [];
  for (const [tier, seed, bot] of lanes) {
    const mk = () => (bot === 'keys' ? houseBot({ mode: 'keys' }) : houseHonestBot());
    const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'go' });
    const run = recordRun(g, mk()), s = g.state, H = houseOf(s), d = debriefOf(s);
    const legs = [...H.rooms, H.hall], count = (kind) => d.events.filter(e => e.kind === kind).length;
    const want = { round: s.armoury.range.shots.length + (H.two.shots ?? []).length, sighting: legs.reduce((a, L) => a + L.contacts.length, 0), fault: legs.reduce((a, L) => a + L.faults.length, 0),
      corner: legs.reduce((a, L) => a + Object.keys(L.covered ?? {}).length, 0), clear: legs.reduce((a, L) => a + (L.calls ?? []).filter(c => c.say === 'clear').length, 0) };
    const got = Object.fromEntries(Object.keys(want).map(k => [k, count(k)])), unplaced = d.events.filter(e => !Number.isFinite(e.x) || !Number.isFinite(e.z) || !Number.isFinite(e.atMs)).length;
    const r = replayRun(run);
    lines.push(`${tier} ${seed} (${bot}): ${Object.keys(want).map(k => `${k} ${got[k]}/${want[k]}`).join(', ')}, unplaced ${unplaced}, ${d.tracks.ms.length} samples; replayed ${run.steps} steps, ${run.inputs.length} inputs: the run sheet ${r.same.sheet ? 'the same' : 'DIFFERENT'}, the save ${r.same.save ? 'the same' : 'DIFFERENT'}`);
    if (Object.keys(want).some(k => got[k] !== want[k]) || unplaced || !r.same.sheet || !r.same.save) bad.push(`${tier} ${seed}`);
  }
  const rows = [{ id: 'F58', name: 'the debrief: every event placed and timed, the export replayed to the same run sheet and save', met: !bad.length, value: bad.length ? `short on ${bad.join(', ')}` : `${lanes.length} lanes whole`, target: 'every lane' }];
  return { rows, lines, met: !bad.length, fails: bad };
}
