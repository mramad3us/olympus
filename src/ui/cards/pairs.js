// OLYMPUS cards: test-pairs' sheet picker, and the end card's "Again as …" and its three aspects (COMBAT §25.10.3; the build sheet 0.0.8 §2.3, §2.4; ROADMAP §2.2).
//
// "Pairs" is played as a sheet, not as a career (ROADMAP §2.1: scenes never write a career): the Tests menu's entry
// opens this page on the title's paper, the five sheets of the picker (templates.js TEST_SHEETS, those marked for it,
// in PICKER_TIERS' order: Boot recruit, Private, Sergeant, Raider, five years, Tier one), each with its Warfighting
// and the numbers that make the scene (Marksmanship, Weapon handling, Awareness, the drills' rung), the Private
// focused (the player's start, the default); a click, Enter or its digit starts the scene as that sheet on a new
// seed (main.js playScene with { tier }); Back or Esc returns to the Tests menu. The corporal is by the URL only
// (&tier=cpl). The end card offers "Again as …" each other sheet on the same seed (the scene's againAs: the same
// targets at the same gaps, so the gulf shows), and says the run's three aspects in the scene's own numbers
// (pairsNow's card): the turn (each string's take-in, its expectation, and the same sheet's in a room it is clearing,
// so the bay's numbers sit beside the user's "0.8+"), the shots (the zones, the steel's rings and its head plate down,
// the rows chosen), the gun (RELOAD's time, the Top up in the lull, the short magazine). The runs of this session on
// this seed (page memory, never the save: main.js) are listed under them, one line a sheet (runLine), so "Again as Tier
// one" shows the gulf on the card itself (the design review of v0.0.8).

/** The tiers on the picker, in its order, when the sim's PICKER_TIERS is not given. */
export const PICKER_ORDER = Object.freeze(['recruit', 'private', 'sgt', 'raider', 'tierone']);
/** The picker's focused sheet (the player's start). */
export const PICKER_DEFAULT = 'private';
/** A sheet's line under its name: "Warfighting 15 · Marksmanship 10 · Weapon handling 10 · Awareness 6 · rung 1". */
export function sheetLine(t) {
  if (!t) return '';
  const v = t.values ?? {};
  return [`Warfighting ${t.wf}`, Number.isFinite(v.marksmanship) ? `Marksmanship ${v.marksmanship}` : null, Number.isFinite(v.weapons) ? `Weapon handling ${v.weapons}` : null,
    Number.isFinite(v.awareness) ? `Awareness ${v.awareness}` : null, Number.isFinite(t.rung) ? `rung ${t.rung}` : null].filter(Boolean).join(' · ');
}
/** The picker's rows: [{ tier, label, line, wf, focus }] from TEST_SHEETS, in order (the scene's sheets, else PICKER_TIERS), focus the scene's default sheet. */
export function pickerRows(sheets = {}, order = null, focus = PICKER_DEFAULT) {
  const tiers = (order?.length ? order : PICKER_ORDER).filter(t => sheets[t]);
  return tiers.map(t => ({ tier: t, label: sheets[t].label ?? t, wf: sheets[t].wf, line: sheetLine(sheets[t]), focus: t === (focus ?? PICKER_DEFAULT) }));
}

/** The picker as a page on the title's paper: { body, buttons }. scene: SCENES' record; onPick(tier); onBack(). */
export function pickerPage({ scene, sheets = {}, order = null, onPick, onBack }) {
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(globalThis.document.createElement(tag), props); for (const k of kids.flat()) if (k !== null && k !== undefined && k !== false) n.append(k); return n; };
  // (the scene's own list and default where it names them (scenes.js: sheets, sheet), else the sim's picker order)
  const rows = pickerRows(sheets, Array.isArray(scene?.sheets) ? scene.sheets : order, scene?.sheet ?? PICKER_DEFAULT);
  const buttons = rows.map((r, i) => {
    const b = el('button', { className: `item sheetpick${r.focus ? ' lead' : ''}`, type: 'button', onclick: () => onPick?.(r.tier) }, el('kbd', { textContent: String(i + 1) }), r.label, el('small', { textContent: r.line }));
    b.dataset.tier = r.tier;
    return b;
  });
  const body = el('div', { className: 'sheet tests picker' },
    el('h2', { textContent: String(scene?.title ?? 'Pairs').toUpperCase() }),
    el('p', { className: 'sub', textContent: 'Play it as a sheet: each its own experience, its own hands and eyes. The same targets turn on the same seed whichever you choose.' }),
    el('hr'),
    ...buttons,
    el('hr'),
    el('button', { className: 'item small', type: 'button', onclick: () => onBack?.() }, 'Back'),
    el('p', { className: 'note', textContent: scene?.goal ?? '' }));
  // (the digits pick a sheet as on a card's lines)
  body.addEventListener('keydown', (e) => {
    const m = /^(?:Digit|Numpad)([1-9])$/.exec(e.code ?? '');
    if (m && buttons[Number(m[1]) - 1]) { e.preventDefault(); buttons[Number(m[1]) - 1].click(); }
  });
  return { body, buttons, rows };
}

const two = (ms) => (Number.isFinite(ms) ? (ms / 1000).toFixed(2) : '?');
/** The rows' names as the card says them. */
const ROW_WORDS = Object.freeze({ 'shot:pair': 'Pair', 'shot:hammer': 'Hammer', 'shot:triple': 'Triple', 'shot:failure': 'Failure drill', 'shot:head': 'To the head', fire: 'Fire' });
/**
 * The end card's three aspects in the scene's numbers (pairsNow().card): [['turn', '0.55 · 0.60 · 1.25 · 0.55 · 0.60 s (sector,
 * sector ×2, alert ×3, …)'], ['shots', '13 A, 1 C, 2 head · no-shoot untouched · Pair 6, Failure drill 1'], ['gun', 'RELOAD 2.53 s · topped
 * up · the short magazine']]. fmt: react.js takeInWords.
 */
export function aspectLines(card, { fmt = two } = {}) {
  if (!card) return [];
  const out = [];
  const turn = card.turn ?? [];
  if (turn.length) out.push(['turn', `${turn.map(t => fmt(t.takeInMs)).join(' · ')} s (${turn.map(t => `${t.expect ?? '?'}${t.n > 1 ? ` ×${t.n}` : ''}`).join(', ')})${Number.isFinite(card.roomMs) ? ` · in a room he is clearing: ${fmt(card.roomMs)} s` : ''}`]);
  const sh = card.shots;
  if (sh) {
    const zones = [['A', 'A'], ['C', 'C'], ['head', 'head'], ['ring', 'rang on steel'], ['headDown', 'head plate down'], ['miss', 'missed']].filter(([k]) => Number(sh[k]) > 0).map(([k, w]) => `${sh[k]} ${w}`);
    const rows = Object.entries(sh.rows ?? {}).filter(([, n]) => n > 0).map(([id, n]) => `${ROW_WORDS[id] ?? id} ${n}`);
    out.push(['shots', [zones.join(', ') || 'no hits', Number(sh.noshoot) > 0 ? `${sh.noshoot} no-shoot hit${sh.noshoot === 1 ? '' : 's'}` : 'no-shoot untouched', rows.join(', ')].filter(Boolean).join(' · ')]);
  }
  const g = card.gun;
  if (g) out.push(['gun', [g.reload ? `${g.reload.kind === 'speed' ? 'RELOAD' : g.reload.kind === 'retain' ? 'RELOAD, keep the empty' : 'Top up'} ${two(g.reload.ms)} s` : 'no reload when dry',
    g.topUp ? `topped up ${two(g.topUp.ms)} s` : 'not topped up', g.short ? 'dry on the short magazine' : null].filter(Boolean).join(' · ')]);
  return out;
}
/**
 * A run's line for the session's list on the end card: "Boot recruit: turn to pause 0.65 · 1.50 · 0.80 · 0.65 · 0.75 s ·
 * pause to first 2.10 · 3.05 · … s · RELOAD 3.30 s". pn: pairsNow's view (its strs, card, label); fmt: takeInWords.
 */
export function runLine(pn, { fmt = two } = {}) {
  if (!pn) return null;
  const strs = (pn.strs ?? []).filter(x => x.done !== 'setup'), t = (ms) => (Number.isFinite(ms) ? fmt(ms) : '–');
  const g = pn.card?.gun;
  return [`${pn.label ?? pn.sheet}: turn to pause ${strs.map(x => t(x.takeInMs)).join(' · ')} s`, `pause to first ${strs.map(x => t(x.pauseToFirstMs)).join(' · ')} s`,
    g?.reload ? `RELOAD ${two(g.reload.ms)} s` : 'no RELOAD', g?.topUp ? `topped up ${two(g.topUp.ms)} s` : null].filter(Boolean).join(' · ');
}
/** The "Again as …" lines' sheets: every picker sheet but the one played, in the picker's order. */
export function againTiers(sheets = {}, played = null, order = null) {
  return pickerRows(sheets, order).filter(r => r.tier !== played).map(r => ({ tier: r.tier, label: r.label, wf: r.wf }));
}
