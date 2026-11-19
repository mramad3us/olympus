// OLYMPUS cards: the shoot house's run sheet and its hot wash, and the end card's lines for "Stack and clear" (COMBAT §25.10.4; the build sheet 0.0.12 §2.3, §2.4; VIEWS §7.4).
//
// The instructor keeps a paper on the lane: a row a room in his words, "ROOM 1 · 7.40 S · TAKE-IN 0.80 · FIRST 2.00 · BASIC MET
// · 2 A · CORNERS 3 OF 3 · DOORWAY 0.30 S", and the lane's card under them, "LANE A · PRIVATE · 3 ROOMS · 58.4 S · 4 OF 4 THREATS
// · …". Those words are the scene's (shoothouse.js runSheetOf: the one helper of the paper, the card and his speech), so this
// module never builds a number of its own: runSheetEl draws them as the paper they are, a cream sheet on a clipboard, a room's
// row split at its " · " into a head (the room and its time) and its marks, a fault (NO-SHOOT HIT, HOSTAGE HIT, MUZZLE, a par
// missed: "FIRED FIRST") in red. The hot wash (hotWashOf: lines, the spin's line once, and a bar a contact) is the instructor's
// debrief after the lane, 90 s behind the brief splash in the sim; on the end card it stands beside the card (as "Bang"'s does,
// `.end-wrap`), its take-in bars drawn as the take-in itself: an amber bar from the sighting to the pause (the marine's own
// time), then the paper's bar to the first round, the par a red tick across the track, so "he fired first" is seen as a bar
// past its tick. houseEndLines gives the card's summary and the session's runs room by room (houseRunLine), so "Again as Tier
// one" puts the gulf on the card itself. Beside the run sheet the wash leaves out the lines the sheet already says (skip), and names a
// bar by its stand ("1a"), not its key. Pure but for the two DOM builders.
// v0.0.20 (the build sheet v0.0.20 §1 items 4, 10, 11, 19, 20, 21; card C1, C3, C5, C6): a room's time is said against its par
// ("ROOM 1 · 6.70 S / 9.0", the head keeps both); the paper's TEAM row (runSheetOf's team) and the instructor's verdict ("GO" /
// "NO-GO: THE HOSTAGE") under the rows; a take-in bar shows the instructor's click as its own grey segment (barParts' click), so a
// bar past its par's tick is seen to be the dummy's, and a stand's par as a roll on its hover ("Par 3.00 + 0.65 (the head, past the
// hostage) = 3.65 s"); six aspects (pause, drill, team, panel, shots, feel); and the session's sheets side by side, a row a leg and a
// column a sheet (houseGrid, "Bang"'s gridTable form: each cell the leg's time against its par and its marks in the run sheet's own
// words).
// v0.0.22 (its build sheet §1 item 14; the house lens's G3): a named house's word on the paper, "LANE B" (namedLaneOf: assemble.js
// laneWordOf's 'B' or 'C' for the lane's code; null as set and on a drawn house, whose paper says "NEW LAYOUT" as before): the run
// sheet's title and its card's "NEW LAYOUT" say the lane's letter; "Again with a new seed" keeps it (againHouseOf).

// v0.0.24 (the build sheet v0.0.24 item 19; the overhaul's O-17; samples/truth-cards T-a, the default until scored): THE TRUTH
// CARDS. Each man and stand you engaged as he truly was at your first round at him (shoothouse.js truthAt, T.atFirst: his hold,
// pose and facing from your eye then), in the order you engaged them, a row of small cards (CARD_MIN) under the plan view, each
// captioned with its room, its stand, the time of your first round from GO and what your take-in had read of him, the belief you
// acted on ("READ RIFLE"; "READ HANDS NOT SEEN"). The row is a section you can close (a <details>, open as T-a draws it:
// the tier one's card fits whole at 1024 × 768 and 1600 × 900 with it open; a longer run sheet scrolls the side, my call). truthRows(state) is the model
// (pure), truthRowEl the DOM (a canvas a card, painted by the hit card's paint at its own size, never smoothed). A stand with no atFirst (a save made
// before v0.0.24, or none of your rounds at it) is not engaged and has no card.
// v0.0.26 ("Bang, then go", its build sheet §1 items 8 and 10): the run sheet's title says "ROOM 1" and its head the scene's ("BANG, THEN GO ·
// SERGEANT · ROOM 1 · THE BANG ISSUED · THE DOOR WAS HELD"), and under the room's row the window's (breachRows: THE WINDOW, a line a man,
// THEIR CHOICES), every figure shoothouse.js bangWindowOf's; the end card's "Again with a new seed" is the scene's "Another door"
// (scenes.js newSeed), and its "Again" keeps the draw's words (main.js openHouseEnd).

// (the rooms' role's laneWordOf read by name, so the paper is v0.0.21's until it is exported)
import { WRECK_LEGS } from '../../data/courses.js';
import * as ASSEMBLE from '../../sim/scenes/assemble.js';
import { gearOf } from '../../sim/arms/gear.js';
import { seenKey, standSeen } from '../../sim/people/seen.js';
import { lookFor, indoorsNow } from '../../sim/people/figure.js';
/** A named house's letter for a lane's code: 'B' or 'C' (assemble.js laneWordOf), else null (the set, a drawn house, no code). */
export function namedLaneOf(code, laneWordOf = ASSEMBLE.laneWordOf ?? null) {
  if (!code || typeof laneWordOf !== 'function') return null;
  let w = null;
  try { w = laneWordOf(code); } catch { w = null; }
  return w === 'B' || w === 'C' ? w : null;
}
/**
 * The house the end card's "Again" plays (main.js openHouseEnd): { same, code (the lane's drawn code, or null as set), lane
 * (namedLaneOf's letter), rooms (the drawn house's room set, R.house.draw.rooms) } → playScene's house options. The same seed keeps
 * the house's code (v0.0.21); a new seed keeps a named house with a new cast ({ layout: 'B' }: its targets are drawn from the seed),
 * draws a drawn house afresh on the same rooms ({ draw: 'drawn', rooms }), and leaves the set as set ({}). The A and D review
 * (2026-11-16): "Again with a new seed" after layout B passed { draw: 'drawn' } and played a three-room house drawn whole.
 */
export function againHouseOf({ same = false, code = null, lane = null, rooms = null, plans = null } = {}) {
  // (the reviews of 2026-11-17: the same seed keeps the drawn house's room set with its code (`pool`, debug.js
  // houseChoice), so "Again" then "Again with a new seed" still draws from the eight; and every Again keeps the plans' source, so a
  // &plans=derived lane replays on its own plans and is offered its own ghost (ghostKeyOf keys on it))
  const keep = plans === 'derived' ? { plans } : {};
  if (same) return code ? { draw: 'drawn', house: code, ...(rooms === 'all' ? { pool: rooms } : {}), ...keep } : keep;
  if (lane) return { layout: lane, ...keep };
  return code ? { draw: 'drawn', ...(rooms ? { rooms } : {}), ...keep } : keep;
}
/** A missed par's cause in the hot wash's words (shoothouse.js PAR_CAUSES). */
export const CAUSE_WORDS = Object.freeze({ click: 'the click', gun: 'your gun', unready: 'rifle not up', eyes: 'seen late', hands: 'slow hands', feet: 'planted first' });
/** Two places of seconds, as every paper says them. */
const two = (ms) => (Number.isFinite(ms) ? (Math.max(0, ms) / 1000).toFixed(2) : '–');
/** The marks a row's words carry that are faults (drawn red). */
export const FAULT_MARKS = Object.freeze([
  'NO-SHOOT HIT',
  'HOSTAGE HIT',
  'MUZZLE',
  'FIRED FIRST',
  'MISSED',
  'STANDING',
  'YOUR CORNER',
  'DOOR LEFT',
  'TIME',
  'CEASE FIRE',
  // (v0.0.18, the kit's (COMBAT §25.20): late on the bang, the stack in a charge's blast, a grenade slipped at your feet, a
  // charge left on its door at the lane's end)
  'BANG TO ENTRY',
  'STACK IN THE BLAST',
  'BANG AT YOUR FEET',
  'CHARGE LEFT',
  // (v0.0.19, kit D2 (COMBAT §25.20): a frag into a room the brief did not call hostiles only, a man of the stack in a burst's
  // fragments, the thrower hung in the door past the par, a no-shoot or the hostage over the eardrum's 34.5 kPa (the stack's own
  // kPa is D1's STACK IN THE BLAST), a breach round run on into the room. The read's neutral marks stay black: "FRAG IN ROOM 1:
  // 1A DOWN, 1B DOWN", "1A STUNNED 3.2 S", "UNCOOKED 3.8 S", "EXPOSED 0.4 S", "1A HIT THROUGH THE DOOR", so each fault is named
  // whole enough to miss them)
  'FRAGGED',
  'IN THE BURST',
  'EXPOSED IN THE THROW',
  'IN THE BLAST',
  'CONCUSSED',
  'ROUND THROUGH THE DOOR',

  // (v0.0.19, "Stack and clear, live": a round on a man who gave up, a man down or with his hands up left uncovered at a call, a room
  // reopened, a casualty, and his first round before yours ("PAINT ON YOU 0" and "LIVE: 1 DOWN" stay neutral)
  'HANDS UP SHOT',
  'UNCOVERED',
  'REOPENED',
  'CASUALTY',
  'BEFORE YOURS',
  // (one of your number two's rounds held MASK_FAULT_MS by you on his line (shoothouse.js FAULT_PAPER.masked))
  'MASKED',
]);
/** Whether a mark is a fault (red on the paper). */
export const isFault = (mark) => FAULT_MARKS.some(f => String(mark).toUpperCase().includes(f));

/**
 * "Bang, then go"'s rows of the run sheet (v0.0.26; shoothouse.js runSheetOf's breach, its words from bangWindowOf alone): THE WINDOW (or THE
 * DOOR), a line a man, THEIR CHOICES, each { words, head (before its colon), marks (its ' · ' parts) }; [] on every other lane.
 */
export function breachRows(rs) {
  const B = rs?.breach;
  if (!B) return [];
  return [B.window, ...(B.men ?? []), B.choices].filter(Boolean).map(words => { const i = words.indexOf(': '); return { words, head: i > 0 ? words.slice(0, i) : words, marks: i > 0 ? words.slice(i + 2).split(' · ') : [] }; });
}
/** A run sheet row's parts: { head, marks: [{ text, fault }] } from its words ("ROOM 1 · 7.40 S · …": the head is the room and its time). */
export function rowParts(words) {
  const bits = String(words ?? '').split(' · ').map(t => t.trim()).filter(Boolean);
  const headN = bits.length > 1 && /\d+(\.\d+)? S( \/ \d+(\.\d+)?)?$/i.test(bits[1]) ? 2 : 1;
  return { head: bits.slice(0, headN).join(' · '), marks: bits.slice(headN).map(text => ({ text, fault: isFault(text) })) };
}

/**
 * The run sheet as the instructor's paper: an element ({ className 'runsheet' }) whose data-text is every line in order (the
 * card's line first, then each room's), or null. rs: runSheetOf(state) ({ rows: [{ room, words }], card, one?, spinLine?, practised? }).
 */
export function runSheetEl(rs, { doc = globalThis.document, bars = null, lane = null, place = null } = {}) {
  if (!rs || !doc) return null;
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(doc.createElement(tag), props); for (const k of kids.flat()) if (k !== null && k !== undefined && k !== false) n.append(k); return n; };
  // (the play review: each room's missed par says its cause, "BASIC MISSED (SEEN LATE)", from the hot wash's bars
  // (shoothouse.js parCauseOf's, on your own men): the bars stand down beside the plan view, and no cause reached the page)
  const causes = parCauses(bars);
  const rows = (rs.rows ?? []).map(r => {
    const p = rowParts(r.words), why = causes.get(r.room);
    return el('div', { className: 'rs-row' }, el('span', { className: 'rs-head', textContent: p.head }),
      ...p.marks.map(m => el('span', { className: `rs-mark${m.fault ? ' fault' : ''}`, textContent: why && / MISSED$/.test(m.text) ? `${m.text} (${why.toUpperCase()})` : m.text })));
  });
  const would = Array.isArray(rs.would) ? rs.would : [];
  // ("Bang, then go": the window's rows under the room's (breachRows: THE WINDOW or THE DOOR, a line a man, THEIR CHOICES)
  const breach = breachRows(rs);
  // (a named house's letter where the card says NEW LAYOUT)
  const card0 = typeof rs.card === 'string' ? rs.card : rs.card?.words ?? rs.card?.text ?? null, card = lane && card0 ? card0.replace(/\bNEW LAYOUT\b/, `LANE ${lane}`) : card0, one = typeof rs.one === 'string' ? rs.one : rs.one?.text ?? null;
  const body = el('div', { className: 'runsheet' },
    el('div', { className: 'rs-title' }, el('span', { textContent: 'RUN SHEET' }), el('span', { className: 'rs-lane', textContent: place ?? (rs.breach ? 'ROOM 1 · THE WHEEL · HOUSE 1' : lane ? `LANE ${lane} · THE WHEEL · HOUSE 1` : rs.lane ? `LANE ${rs.lane}` : 'THE WHEEL · HOUSE 1') })),
    rs.breach?.head ? el('p', { className: 'rs-card rs-breach', textContent: rs.breach.head }) : null,
    card ? el('p', { className: 'rs-card', textContent: card }) : null,
    ...rows,
    ...breach.map(b => el('div', { className: 'rs-row rs-breach' }, el('span', { className: 'rs-head', textContent: b.head }), ...b.marks.map(m => el('span', { className: 'rs-mark', textContent: m })))),
    // (the team's row under the rooms', its marks split as a room's are)
    rs.team?.words ? (() => { const p = rowParts(rs.team.words); return el('div', { className: 'rs-row rs-team' }, el('span', { className: 'rs-head', textContent: p.head }), ...p.marks.map(m => el('span', { className: `rs-mark${m.fault || /MASKED|HELD OUT [1-9]/.test(m.text) ? ' fault' : ''}`, textContent: m.text }))); })() : null,
    // (the live lane's wound sentences, what the rounds would have done (shoothouse.js wouldLines))
    ...would.map(w => el('p', { className: 'rs-would', textContent: w })),
    one ? el('p', { className: 'rs-one', textContent: one }) : null,
    rs.verdict?.words ? el('p', { className: `rs-verdict ${rs.verdict.go ? 'go' : 'nogo'}`, textContent: rs.verdict.words }) : null,
    rs.practised?.words ? el('p', { className: 'rs-practised', textContent: rs.practised.words }) : null);
  body.dataset.text = [rs.breach?.head ?? null, card, ...(rs.rows ?? []).map(r => r.words), ...breach.map(b => b.words), rs.team?.words ?? null, ...would, one, rs.verdict?.words ?? null].filter(Boolean).join(' | ');
  return body;
}
/** A room's missed pars by cause, in CAUSE_WORDS, from hotWashOf's bars: Map room → "seen late" ("seen late, slow hands" for two). */
export function parCauses(bars) {
  const out = new Map();
  for (const b of bars ?? []) {
    if (!b?.missed || !b.cause || b.cause === 'click') continue;
    const w = CAUSE_WORDS[b.cause] ?? b.cause, had = out.get(b.room);
    if (!had) out.set(b.room, w); else if (!had.split(', ').includes(w)) out.set(b.room, `${had}, ${w}`);
  }
  return out;
}

/**
 * A take-in bar's segments on a track of spanMs (shares of the track, 0 to 1): { takeIn: [0, k], first: [k, f], par: p, late } from a
 * hotWashOf bar ({ room, key, takeInMs, parMs, firstMs }: ms from the sighting). late: the first round after the par, or none at all.
 */
export function barParts(b, spanMs) {
  const span = Math.max(1, spanMs), k = (ms) => Math.max(0, Math.min(1, (Number(ms) || 0) / span));
  const first = Number.isFinite(b?.firstMs) ? b.firstMs : null, par = Number.isFinite(b?.parMs) ? b.parMs : null;
  // (the instructor's click inside the window, its own grey segment from the click to its clearing; a par met within it is not late)
  const click = Number.isFinite(b?.clickMs) ? [k(b.clickMs), k(Number.isFinite(b.clickToMs) ? b.clickToMs : b.clickMs)] : null;
  const clickCost = click && first !== null ? Math.max(0, first - b.clickMs) : 0;
  return { takeIn: [0, k(b?.takeInMs)], first: first !== null ? [k(b?.takeInMs), k(first)] : null, par: par !== null ? k(par) : null, late: par !== null && (first === null || first - clickCost > par), click };
}
/** The track's span for a set of bars: the longest of their pars and first rounds, plus a tenth, at least 1 s. */
export const barSpan = (bars) => Math.max(1000, ...((bars ?? []).flatMap(b => [b.parMs, b.firstMs, b.takeInMs]).filter(Number.isFinite).map(v => v * 1.1)));

/**
 * The hot wash as an element ({ className 'house-wash' }) or null: its lines, the take-in bars a contact (the bar's key, the take-in
 * and the first round in its words, the par's tick), and the spin's line. hw: hotWashOf(state) ({ lines, spinLine, bars }). fmt: the
 * one formatter of the take-in (react.js takeInWords).
 */
export function hotWashEl(hw, { doc = globalThis.document, fmt = two, skip = null, nameOf = (k) => k } = {}) {
  if (!hw || !doc) return null;
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(doc.createElement(tag), props); for (const k of kids.flat()) if (k !== null && k !== undefined && k !== false) n.append(k); return n; };
  const bars = hw.bars ?? [], span = barSpan(bars);
  const barEls = bars.map(b => {
    const p = barParts(b, span), pct = (v) => `${(v * 100).toFixed(1)}%`;
    const track = el('span', { className: 'hw-track' },
      el('i', { className: 'hw-takein', style: `left: 0; width: ${pct(p.takeIn[1])}` }),
      p.first ? el('i', { className: `hw-first${p.late ? ' late' : ''}`, style: `left: ${pct(p.first[0])}; width: ${pct(Math.max(0, p.first[1] - p.first[0]))}` }) : null,
      p.click ? el('i', { className: 'hw-click', style: `left: ${pct(p.click[0])}; width: ${pct(Math.max(0.004, p.click[1] - p.click[0]))}` }) : null,
      p.par !== null ? el('i', { className: 'hw-par', style: `left: ${pct(p.par)}` }) : null);
    const said = `take-in ${fmt(b.takeInMs)} · first ${Number.isFinite(b.firstMs) ? two(b.firstMs) : 'none'}${Number.isFinite(b.parMs) ? ` · par ${two(b.parMs)}` : ''}${p.click ? ' · the click' : ''}${b.cause && p.late ? ` · ${CAUSE_WORDS[b.cause] ?? b.cause}` : ''}`;
    const row = el('div', { className: `hw-bar${p.late ? ' late' : ''}`, title: b.parWords ? `${said} · ${b.parWords}` : said }, el('span', { className: 'hw-key', textContent: String(nameOf(b.key) ?? b.key ?? b.room ?? '') }), track, el('span', { className: 'hw-said', textContent: said }));
    row.dataset.takein = String(b.takeInMs ?? '');
    return row;
  });
  const body = el('div', { className: 'house-wash' },
    el('div', { className: 'hw-title', textContent: 'HOT WASH' }),
    // (the lines the run sheet beside it already says are not said twice: skip)
    ...(hw.lines ?? []).filter(t => !skip?.has(t)).map(t => el('p', { className: 'hw-line', textContent: t })),
    barEls.length ? el('div', { className: 'hw-bars' }, el('p', { className: 'hw-legend', textContent: 'from the sighting: the take-in (amber), to the first round, the par (red tick), the instructor\'s click (grey)' }), ...barEls) : null,
    hw.spinLine ? el('p', { className: 'hw-spin', textContent: hw.spinLine }) : null);
  body.dataset.text = [...(hw.lines ?? []), hw.spinLine ?? null].filter(Boolean).join(' | ');
  return body;
}

/**
 * A run's line for the session's list, room by room (0.0.12, "the runs side by side room by room"): "Private: room 1 13.79 · room 2
 * 9.10 · room 3 11.20 · hall 4.00 · lane 58.40 s · take-in 0.80 to 1.20". hn: houseNow's view ({ label, legs (or rooms and hall):
 * [{ word, ms, state }], timerMs, contacts }); a leg's time the scene's own; fmt the take-in's formatter.
 */
export function houseRunLine(hn, { fmt = two, label = null } = {}) {
  if (!hn) return null;
  const legs = hn.legs ?? [...(hn.rooms ?? []), ...(hn.hall ? [{ ...hn.hall, hall: true }] : [])];
  const word = (r, i) => (r.word ? String(r.word).toLowerCase() : r.hall ? 'hall' : `room ${i + 1}`);
  const ins = (hn.contacts ?? []).filter(c => !c.by || c.by === 'me').map(c => c.takeInMs).filter(Number.isFinite);
  const range = ins.length ? `take-in ${fmt(Math.min(...ins))}${ins.length > 1 && Math.max(...ins) !== Math.min(...ins) ? ` to ${fmt(Math.max(...ins))}` : ''}` : null;
  return [`${label ?? hn.label ?? hn.sheet ?? '?'}: ${legs.map((r, i) => `${word(r, i)} ${Number.isFinite(r.ms) && r.state !== 'ahead' ? two(r.ms) : '–'}`).join(' · ')}`, Number.isFinite(hn.timerMs) ? `lane ${two(hn.timerMs)} s` : null, range].filter(Boolean).join(' · ');
}

/** The zones' words in the card's order: "6 A, 1 C, 2 head". */
const ZONE_WORDS = Object.freeze([['A', 'A'], ['C', 'C'], ['head', 'head'], ['ring', 'rang on steel'], ['headDown', 'head plate down'], ['miss', 'missed'], ['noshoot', 'no-shoot hit'], ['hostage', 'hostage hit']]);
/**
 * The aspects' words for the end card: [['pause', …], ['drill', …], ['shots', …]] from houseNow's aspects, each a string, { words | text },
 * or the scene's numbers ({ pause: { n, minMs, maxMs, firstMinMs }, drill: { legs: [{ ms, presses, how }], presses }, shots: { rounds, zones,
 * two: { fired, hits }, dummy } }), said in words with the one formatter of the take-in.
 */
export function houseAspects(hn, { fmt = two } = {}) {
  const a = hn?.aspects ?? null;
  if (!a) return [];
  const w = (v) => (typeof v === 'string' ? v : v?.words ?? v?.text ?? null);
  const pause = (p) => (!p?.n ? 'no contact taken in' : `${p.n} taken in, ${fmt(p.minMs)}${p.maxMs !== p.minMs ? ` to ${fmt(p.maxMs)}` : ''} s${Number.isFinite(p.firstMinMs) ? ` · the first round ${two(p.firstMinMs)} s from the sighting at the quickest` : ''}`);
  const drill = (d) => {
    // (each leg named by its place in the lane before the untimed ones go (a room a setup cleared has none): the hunt of v0.0.20, P3)
    // (a leg that names itself (the Wreck's "cell 2", "the hold") by its own word)
    const legs = (d?.legs ?? []).map((l, i) => ({ ...l, word: l.word ? String(l.word).toLowerCase() : i < 3 ? `room ${i + 1}` : 'hall' })).filter(l => Number.isFinite(l.ms));
    const how = (l) => { const h = l.how ?? {}; const ks = Object.entries(h).filter(([, n]) => n > 0).map(([k, n]) => `${k} ${n}`); return ks.length ? ` (${ks.join(', ')})` : ''; };
    return `${legs.map(l => `${l.word} ${two(l.ms)} s, ${l.presses ?? 0} press${l.presses === 1 ? '' : 'es'}${how(l)}`).join(' · ')}${Number.isFinite(d?.presses) ? ` · ${d.presses} presses in all` : ''}`;
  };
  const shots = (sh) => {
    const z = ZONE_WORDS.filter(([k]) => Number(sh?.zones?.[k]) > 0).map(([k, word]) => `${sh.zones[k]} ${word}`);
    const dm = sh?.dummy, dummy = dm && Number.isFinite(dm.clickAtMs) ? (Number.isFinite(dm.clearedAtMs) ? `the dummy cleared in ${two(dm.clearedAtMs - dm.clickAtMs)} s` : 'the dummy not cleared') : null;
    return [`${sh?.rounds ?? 0} rounds`, z.join(', ') || 'no hits', sh?.two ? `your number two ${sh.two.fired ?? 0} fired, ${sh.two.hits ?? 0} hit` : null, dummy].filter(Boolean).join(' · ');
  };
  // (the team (the TEAM row's numbers and his rounds), the panel (the keys: presses by hand and by a row, the panel's layout)
  // and the feel (what was played: the walk, the look; the sound's pick is the page's, scoreLine's played))
  const team = (t) => [t.words ? t.words.replace(/^TEAM · /, '').toLowerCase() : null, Number.isFinite(t.fired) ? `his rounds ${t.fired}, ${t.hits ?? 0} hit` : null].filter(Boolean).join(' · ');
  const panel = (p) => `${p.presses ?? 0} press${p.presses === 1 ? '' : 'es'}: ${p.keys ?? 0} by the keys, ${p.rows ?? 0} by a row${p.layout ? ` · panel ${String(p.layout).toUpperCase()}` : ''}`;
  const feel = (f) => [`walk ${f.cycle ?? 'B'}`, f.look ? `look ${Object.entries(f.look).filter(([, v]) => v !== null && v !== undefined && !(Array.isArray(v) && !v.length)).map(([k, v]) => `${k}:${Array.isArray(v) ? v.join('+') : v}`).join(',') || 'as built'}` : 'look as built'].join(' · ');
  // (the Wreck's anchor: "fired floating none · first rounds: braced (#2) 1, mag boots 3")
  const anchor = (an) => [`fired floating ${an.floating ? an.floating : 'none'}`, Object.keys(an.first ?? {}).length ? `first rounds: ${Object.entries(an.first).map(([k, n]) => `${ANCHOR_WORDS[k] ?? k} ${n}`).join(', ')}` : null].filter(Boolean).join(' · ');
  const say = { anchor: (v) => w(v) ?? anchor(v), pause: (v) => w(v) ?? pause(v), drill: (v) => w(v) ?? drill(v), team: (v) => team(v), panel: (v) => w(v) ?? panel(v), shots: (v) => w(v) ?? shots(v), feel: (v) => w(v) ?? feel(v) };
  // (the Wreck's anchor first, where houseNow gives one (never on the house))
  return [...(a.anchor ? ['anchor'] : []), ...HOUSE_ASPECTS].filter(k => a[k] !== undefined && a[k] !== null).map(k => [k, say[k](a[k])]).filter(([, t]) => t);
}
/** "Stack and clear"'s aspects, in the score card's order (scenes.js; v0.0.20: six, from three). */
export const HOUSE_ASPECTS = Object.freeze(['pause', 'drill', 'team', 'panel', 'shots', 'feel']);
// (the anchor's words on the end card (shoothouse.js roundAnchor's rows))
const ANCHOR_WORDS = Object.freeze({ buddy: 'braced (#2)', braced: 'braced', magBoots: 'mag boots', handhold: 'a hand on a hold', floating: 'floating', planted: 'planted', light: 'standing light' });

/**
 * The session's sheets side by side on one seed (card C6; "Bang"'s gridTable form): { cols: [label], rows: [{ word, cells:
 * [{ text, late, fault } | null] }], now } from runs [{ label, legs: [{ word, ms, parMs, state, setup, parMissed, faults }], now? }]
 * (houseNow's legs a sheet). A cell is the leg's time against its par in the run sheet's words ("6.70 / 9.0"), "PASSED" or "SET UP",
 * then "FIRED FIRST" and its faults' paper words; late past its par, a fault where the row has one.
 */
export function houseGrid(runs) {
  const list = (runs ?? []).filter(r => r?.legs?.length), n = Math.max(0, ...list.map(r => r.legs.length));
  const WORDS = ['ROOM 1', 'ROOM 2', 'ROOM 3', 'THE HALL'];
  const cell = (V) => {
    if (!V || V.state === 'ahead') return null;
    if (V.setup) return { text: 'SET UP', late: false, fault: false };
    const t = Number.isFinite(V.ms) ? `${two(V.ms)}${Number.isFinite(V.parMs) ? ` / ${(V.parMs / 1000).toFixed(1)}` : ''}` : '–';
    const marks = [...new Set((V.faults ?? []).map(f => f.kind))].map(k => FAULT_GRID[k] ?? String(k).toUpperCase());
    // (a live man's first round before the stack's is FIRED FIRST too, as on the card (shoothouse.js cardOf; the hunt of v0.0.20, par-met-first))
    const missed = Number(V.parMissed) > 0 || (V.live?.gapMs ?? 0) > 0;
    return { text: [V.state === 'passed' ? 'PASSED' : t, missed ? 'FIRED FIRST' : null, ...marks].filter(Boolean).join(' · '), late: Number.isFinite(V.ms) && Number.isFinite(V.parMs) && V.ms > V.parMs, fault: missed || marks.length > 0 || V.state === 'passed' };
  };
  return { cols: list.map(r => r.label), rows: Array.from({ length: n }, (_, k) => ({ word: list.find(r => r.legs[k])?.legs[k]?.word ?? WORDS[k] ?? `LEG ${k + 1}`, cells: list.map(r => cell(r.legs[k])) })), now: list.findIndex(r => r.now) };
}
// (a fault's word in a grid cell: the run sheet's paper words, shortened where a cell is narrow)
const FAULT_GRID = Object.freeze({ funnel: 'DOORWAY', muzzle: 'MUZZLE', corner: 'CORNER', noshoot: 'NO-SHOOT HIT', hostage: 'HOSTAGE HIT', standing: 'STANDING', door: 'DOOR LEFT', time: 'TIME', relaxed: 'RELAXED', masked: 'MASKED' });
/** The grid as a table ({ className 'house-grid' }), the sheet just played marked, or null with fewer than two sheets. */
export function houseGridEl(g, { doc = globalThis.document } = {}) {
  if (!g || g.cols.length < 2 || !doc) return null;
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(doc.createElement(tag), props); for (const k of kids.flat()) if (k !== null && k !== undefined && k !== false) n.append(k); return n; };
  const t = el('table', { className: 'house-grid' },
    el('tr', {}, el('th', { textContent: '' }), ...g.cols.map((c, i) => el('th', { className: i === g.now ? 'now' : '', textContent: c }))),
    ...g.rows.map(r => el('tr', {}, el('th', { textContent: r.word }), ...r.cells.map((c, i) => el('td', { className: [i === g.now ? 'now' : '', c?.late ? 'late' : '', c?.fault ? 'fault' : ''].filter(Boolean).join(' '), textContent: c?.text ?? '–' })))));
  t.dataset.head = `This seed, this session (${g.cols.length} sheets): each room against its par`;
  return t;
}

/** The end card's lines for the house: [the run sheet's card line, the instructor's one thing] (the summary is the card's own words). */
export function houseEndLines(hn, rs = null, hw = null) {
  const card = typeof rs?.card === 'string' ? rs.card : rs?.card?.words ?? null, one = typeof rs?.one === 'string' ? rs.one : rs?.one?.text ?? null;
  // (the hot wash's lead where it has one ("Bang, then go"'s window, shoothouse.js windowWords), before the one thing: the card
  // shows the plan, so the wash's own block stands down, and its story was nowhere on the page (the play review of v0.0.26, finding 1))
  const lead = typeof hw?.lead === 'string' && hw.lead !== one ? hw.lead : null;
  return [card ?? (typeof hn?.summary === 'string' ? hn.summary : null), lead, one].filter(Boolean);
}

/** The take-in's read of a stand as the truth card's caption says it (the belief you acted on). */
export const READ_WORDS = Object.freeze({ rifle: 'RIFLE', pistol: 'PISTOL', hands: 'EMPTY HANDS', phone: 'A PHONE', unseen: 'HANDS NOT SEEN' });
/**
 * The truth cards' rows (see the header): [{ key, stand, leg, firstMs (from GO), live, subject (the card's subject: a board's
 * truth, or a man's Seen record as at your first round, his gear now), belief: { face, holds }, words }], in the order you engaged them.
 */
export function truthRows(state) {
  const R = state?.armoury?.range, H = R?.house;
  if (R?.course !== 'house' || !H) return [];
  const goAt = H.goAtMs ?? 0, out = [];
  for (const T of R.turners ?? []) {
    const F = T.atFirst;
    if (!F) continue;
    const leg = T.stand === 'H' ? 3 : Number(String(T.stand)[0]) - 1, live = !!T.live?.who;
    let subject;
    if (live) {
      const who = T.live.who, p = state.people?.[who], a = state.actors?.list?.find?.(x => x.who === who), now = gearOf(state, who) ?? {};
      // (the gun in his hands at your first round, though he gave up and dropped it since)
      const gear = { ...now, ...(F.gun && /^rifle/.test(F.how) && !now.rifle ? { rifle: { model: F.gun, finish: null, place: 'ready', mag: true } } : {}), ...(F.gun && /^pistol/.test(F.how) && !now.pistol ? { pistol: { model: F.gun, place: 'ready', mag: true } } : {}), hands: null };
      const rec = { who, kind: 'man', frame: 'stand', gear, hold: { how: F.how, right: null, left: null, act: null }, aimAt: F.aimAt ?? null, pose: F.pose ?? 'stand', facing: F.facing ?? 'front', yawQ: 0, light: null, cover: null, rangeM: null, read: { holds: F.read?.holds ?? null, state: null } };
      rec.key = seenKey(rec);
      subject = { kind: 'man', key: `${who}|truth|${rec.key}`, rec, gear, person: { look: p?.look ? lookFor(p.look, a?.outfit ?? 'utilities', indoorsNow(state)) : {}, sex: p?.sex ?? 'm' } };
    } else {
      const rec = standSeen(F.face ?? T.face, F.holds ?? T.holds);
      subject = { kind: 'board', key: `${rec.face}|${F.holds ?? T.holds}|truth`, face: F.face ?? T.face, holds: F.holds ?? T.holds, rec };
    }
    const belief = { face: F.read?.face ?? null, holds: F.read?.holds ?? null };
    out.push({ key: T.key, stand: T.stand, leg, ...(H.ship === 'wreck' && WRECK_LEGS[leg] ? { legWord: WRECK_LEGS[leg].word } : {}), firstMs: Number.isFinite(F.ms) ? F.ms - goAt : null, live, subject, belief, words: `READ ${READ_WORDS[belief.holds] ?? String(belief.holds ?? '-').toUpperCase()}` });
  }
  return out.sort((a, b) => (a.firstMs ?? Infinity) - (b.firstMs ?? Infinity) || a.leg - b.leg);
}
/** A room's word for a leg (the run sheet's): "ROOM 1" to "ROOM 3", "HALL". */
const legWord = (leg) => (leg === 3 ? 'HALL' : `ROOM ${leg + 1}`);
/**
 * The truth cards as a row (T-a; see the header): an element ({ className 'house-truth' }, a <details> open as T-a draws it, which
 * you close to give the run sheet its height back: on a long run sheet the side scrolls, my call), whose
 * data-text is every card's caption in order, or null with none. modelOf(row) → the card's model (paintHitcard's) or null; paint:
 * paintHitcard; size: the card's size (CARD_MIN). Each card is captioned on one line, its room, its stand, the time of your first
 * round from GO and what you read ("ROOM 2 · 2A · 16.8 S · READ RIFLE"), on one line in the run sheet's small type.
 */
export function truthRowEl(rows, { doc = globalThis.document, modelOf = null, paint = null, size = 170, open = true } = {}) {
  if (!rows?.length || !doc || !paint || !modelOf) return null;
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(doc.createElement(tag), props); for (const k of kids.flat()) if (k !== null && k !== undefined && k !== false) n.append(k); return n; };
  const small = 'font-size: calc(9px * var(--ui, 1)); line-height: 1.25; letter-spacing: 0.04em; color: #9aa0ab; margin: 0;';
  const figs = [], said = [];
  for (const r of rows) {
    const m = modelOf(r);
    if (!m) continue;
    const pm = paint({ ...m, size }), cv = el('canvas', { width: pm.w, height: pm.h });
    cv.style.cssText = `width: ${pm.w}px; height: ${pm.h}px; image-rendering: pixelated; display: block;`;
    cv.getContext('2d')?.putImageData(new globalThis.ImageData(new Uint8ClampedArray(pm.data.buffer.slice(0)), pm.w, pm.h), 0, 0);
    const head = `${r.legWord ?? legWord(r.leg)} · ${String(r.stand).toUpperCase()}${Number.isFinite(r.firstMs) ? ` · ${(Math.max(0, r.firstMs) / 1000).toFixed(1)} S` : ''} · ${r.words}`;
    const cap = el('figcaption', { className: 'truth-head', textContent: head });
    cap.style.cssText = `${small} width: ${pm.w}px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`;
    cap.title = head;
    const fig = el('figure', { className: 'truth-card' }, cap, cv);
    fig.style.cssText = 'margin: 0; flex: 0 0 auto; display: flex; flex-direction: column; gap: 0;';
    fig.dataset.stand = String(r.stand); fig.dataset.marks = JSON.stringify((pm.marks ?? []).map(d => [d.n, d.kind, d.zone]));
    figs.push(fig); said.push(head);
  }
  if (!figs.length) return null;
  const sum = el('summary', { className: 'truth-title', textContent: `THE TRUTH CARDS: EACH YOU ENGAGED, AS HE TRULY WAS AT YOUR FIRST ROUND (${figs.length})` });
  sum.style.cssText = `${small} cursor: pointer;`;
  const list = el('div', { className: 'truth-row' }, ...figs);
  list.style.cssText = 'display: flex; gap: 6px; overflow-x: auto; overflow-y: hidden; padding-top: 1px;';
  const box = el('details', { className: 'house-truth', open }, sum, list);
  box.dataset.text = said.join(' | ');
  box.dataset.n = String(figs.length);
  return box;
}
