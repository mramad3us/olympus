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

/** Two places of seconds, as every paper says them. */
const two = (ms) => (Number.isFinite(ms) ? (Math.max(0, ms) / 1000).toFixed(2) : '–');
/** The marks a row's words carry that are faults (drawn red). */
export const FAULT_MARKS = Object.freeze(['NO-SHOOT HIT', 'HOSTAGE HIT', 'MUZZLE', 'FIRED FIRST', 'MISSED', 'STANDING', 'YOUR CORNER', 'DOOR LEFT', 'TIME', 'CEASE FIRE']);
/** Whether a mark is a fault (red on the paper). */
export const isFault = (mark) => FAULT_MARKS.some(f => String(mark).toUpperCase().includes(f));

/** A run sheet row's parts: { head, marks: [{ text, fault }] } from its words ("ROOM 1 · 7.40 S · …": the head is the room and its time). */
export function rowParts(words) {
  const bits = String(words ?? '').split(' · ').map(t => t.trim()).filter(Boolean);
  const headN = bits.length > 1 && /\d+(\.\d+)? S$/i.test(bits[1]) ? 2 : 1;
  return { head: bits.slice(0, headN).join(' · '), marks: bits.slice(headN).map(text => ({ text, fault: isFault(text) })) };
}

/**
 * The run sheet as the instructor's paper: an element ({ className 'runsheet' }) whose data-text is every line in order (the
 * card's line first, then each room's), or null. rs: runSheetOf(state) ({ rows: [{ room, words }], card, one?, spinLine?, practised? }).
 */
export function runSheetEl(rs, { doc = globalThis.document } = {}) {
  if (!rs || !doc) return null;
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(doc.createElement(tag), props); for (const k of kids.flat()) if (k !== null && k !== undefined && k !== false) n.append(k); return n; };
  const rows = (rs.rows ?? []).map(r => {
    const p = rowParts(r.words);
    return el('div', { className: 'rs-row' }, el('span', { className: 'rs-head', textContent: p.head }),
      ...p.marks.map(m => el('span', { className: `rs-mark${m.fault ? ' fault' : ''}`, textContent: m.text })));
  });
  const card = typeof rs.card === 'string' ? rs.card : rs.card?.words ?? rs.card?.text ?? null, one = typeof rs.one === 'string' ? rs.one : rs.one?.text ?? null;
  const body = el('div', { className: 'runsheet' },
    el('div', { className: 'rs-title' }, el('span', { textContent: 'RUN SHEET' }), el('span', { className: 'rs-lane', textContent: rs.lane ? `LANE ${rs.lane}` : 'THE WHEEL · HOUSE 1' })),
    card ? el('p', { className: 'rs-card', textContent: card }) : null,
    ...rows,
    one ? el('p', { className: 'rs-one', textContent: one }) : null,
    rs.practised?.words ? el('p', { className: 'rs-practised', textContent: rs.practised.words }) : null);
  body.dataset.text = [card, ...(rs.rows ?? []).map(r => r.words), one].filter(Boolean).join(' | ');
  return body;
}

/**
 * A take-in bar's segments on a track of spanMs (shares of the track, 0 to 1): { takeIn: [0, k], first: [k, f], par: p, late } from a
 * hotWashOf bar ({ room, key, takeInMs, parMs, firstMs }: ms from the sighting). late: the first round after the par, or none at all.
 */
export function barParts(b, spanMs) {
  const span = Math.max(1, spanMs), k = (ms) => Math.max(0, Math.min(1, (Number(ms) || 0) / span));
  const first = Number.isFinite(b?.firstMs) ? b.firstMs : null, par = Number.isFinite(b?.parMs) ? b.parMs : null;
  return { takeIn: [0, k(b?.takeInMs)], first: first !== null ? [k(b?.takeInMs), k(first)] : null, par: par !== null ? k(par) : null, late: par !== null && (first === null || first > par) };
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
      p.par !== null ? el('i', { className: 'hw-par', style: `left: ${pct(p.par)}` }) : null);
    const said = `take-in ${fmt(b.takeInMs)} · first ${Number.isFinite(b.firstMs) ? two(b.firstMs) : 'none'}${Number.isFinite(b.parMs) ? ` · par ${two(b.parMs)}` : ''}`;
    const row = el('div', { className: `hw-bar${p.late ? ' late' : ''}`, title: said }, el('span', { className: 'hw-key', textContent: String(nameOf(b.key) ?? b.key ?? b.room ?? '') }), track, el('span', { className: 'hw-said', textContent: said }));
    row.dataset.takein = String(b.takeInMs ?? '');
    return row;
  });
  const body = el('div', { className: 'house-wash' },
    el('div', { className: 'hw-title', textContent: 'HOT WASH' }),
    // (the lines the run sheet beside it already says are not said twice: skip)
    ...(hw.lines ?? []).filter(t => !skip?.has(t)).map(t => el('p', { className: 'hw-line', textContent: t })),
    barEls.length ? el('div', { className: 'hw-bars' }, el('p', { className: 'hw-legend', textContent: 'from the sighting: the take-in (amber), to the first round, the par (red tick)' }), ...barEls) : null,
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
    const legs = (d?.legs ?? []).filter(l => Number.isFinite(l.ms));
    const how = (l) => { const h = l.how ?? {}; const ks = Object.entries(h).filter(([, n]) => n > 0).map(([k, n]) => `${k} ${n}`); return ks.length ? ` (${ks.join(', ')})` : ''; };
    return `${legs.map((l, i) => `${i < 3 ? `room ${i + 1}` : 'hall'} ${two(l.ms)} s, ${l.presses ?? 0} press${l.presses === 1 ? '' : 'es'}${how(l)}`).join(' · ')}${Number.isFinite(d?.presses) ? ` · ${d.presses} presses in all` : ''}`;
  };
  const shots = (sh) => {
    const z = ZONE_WORDS.filter(([k]) => Number(sh?.zones?.[k]) > 0).map(([k, word]) => `${sh.zones[k]} ${word}`);
    const dm = sh?.dummy, dummy = dm && Number.isFinite(dm.clickAtMs) ? (Number.isFinite(dm.clearedAtMs) ? `the dummy cleared in ${two(dm.clearedAtMs - dm.clickAtMs)} s` : 'the dummy not cleared') : null;
    return [`${sh?.rounds ?? 0} rounds`, z.join(', ') || 'no hits', sh?.two ? `your number two ${sh.two.fired ?? 0} fired, ${sh.two.hits ?? 0} hit` : null, dummy].filter(Boolean).join(' · ');
  };
  const say = { pause: (v) => w(v) ?? pause(v), drill: (v) => w(v) ?? drill(v), shots: (v) => w(v) ?? shots(v) };
  return ['pause', 'drill', 'shots'].filter(k => a[k] !== undefined && a[k] !== null).map(k => [k, say[k](a[k])]).filter(([, t]) => t);
}

/** The end card's lines for the house: [the run sheet's card line, the instructor's one thing] (the summary is the card's own words). */
export function houseEndLines(hn, rs = null) {
  const card = typeof rs?.card === 'string' ? rs.card : rs?.card?.words ?? null, one = typeof rs?.one === 'string' ? rs.one : rs?.one?.text ?? null;
  return [card ?? (typeof hn?.summary === 'string' ? hn.summary : null), one].filter(Boolean);
}
