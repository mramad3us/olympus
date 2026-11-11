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
//
// 0.0.9 (the build sheet 0.0.9 §2.3, §8 items 16, 20, 21; COMBAT §25.18.3): "Three bangs" (test-pairs-bangs, the setup 'bangs')
// opens the same picker on the Boot recruit (the scene's sheet), each sheet's line ending with its hardening in words
// ("Boot recruit · Hardening: green · Warfighting 6 · …", labelled and leading on "Three bangs", closing the line on Pairs:
// supp.js hardWord of the sheet's hardening, main.js's reader; the number and its parts only on the word's hover, "Hardening
// 7: experience 5, training 2"), and the setup's line under the title (SETUP_LINES). The end card leads with the bangs'
// summary (the scene's bangsNow().summary, the chaos's sum and the calm figure by the book in it) and this session's calm run
// on the seed and the sheet where the page remembers one (bangLines).
// 0.0.10 (the build sheet 0.0.10 §2.3, §8 item 21): "Bang" (test-stress) opens the same picker on the Boot recruit, its lines led by
// the hardening (leadsHard), its scene's line under the title (SCENE_LINES).
// 0.0.12 (the build sheet 0.0.12 §2.3, §5.4): "Stack and clear" (test-shoothouse) opens the same picker on the Private, the six sheets
// with the Boot recruit at their head (the scene's own list), and under them the par chooser (parOptions: the sheet's own, Basic
// 3.0 s, Advanced 1.5 s, Operator 0.8 s, the scene's PAR_MS; P cycles it), which the pick carries (onPick(tier, { par })).

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
/**
 * The picker's rows: [{ tier, label, line, wf, focus, hard }] from TEST_SHEETS, in order (the scene's sheets, else PICKER_TIERS), focus
 * the scene's default sheet; hard(tier) → the sheet's hardening in words (0.0.9, main.js's: supp.js hardWord), added to its line.
 */
export function pickerRows(sheets = {}, order = null, focus = PICKER_DEFAULT, { hard = null, lead = false } = {}) {
  const tiers = (order?.length ? order : PICKER_ORDER).filter(t => sheets[t]);
  return tiers.map(t => {
    let got = null;
    try { got = hard ? hard(t) ?? null : null; } catch { got = null; }
    // (hard gives the word, or { word, title }: the hover's number and parts; the fixer's: labelled "Hardening: green", leading
    // the line where the scene is about it (lead: "Three bangs"), else closing it)
    const word = typeof got === 'string' ? got : got?.word ?? null, hardLine = word ? `Hardening: ${word}` : null;
    const line = (lead ? [hardLine, sheetLine(sheets[t])] : [sheetLine(sheets[t]), hardLine]).filter(Boolean).join(' · ');
    return { tier: t, label: sheets[t].label ?? t, wf: sheets[t].wf, line, focus: t === (focus ?? PICKER_DEFAULT), hard: word, hardTitle: typeof got === 'object' ? got?.title ?? null : null, lead };
  });
}
/** A setup's line under the picker's title (0.0.9; my words). */
export const SETUP_LINES = Object.freeze({ bangs: 'Utilities, no ear defenders. In the first standby the coach makes some noise behind you; the rest is Pairs as built. Esc, End the scene, takes you to the card after the first string.' });
/** A scene's line under the picker's title where it has no setup (0.0.10: "Bang"; my words). */
export const SCENE_LINES = Object.freeze({ 'test-stress': 'Ear defenders on. Five strings at 7 m: one calm, then the coach makes noise beside you (a horn and blanks, a bang he calls, three he does not), the last on a one-round magazine. Breathe when you can. Esc, End the scene, takes you to the card.',
  // (0.0.12: the shoot house; my words)
  'test-shoothouse': 'The Wheel, at 1 G. Your number two is of your sheet too, and runs the same drill. The recruit does it a step at a time, X and the keys to go in; from the Corporal T bundles it. The same rooms and draws on the seed whichever you choose.' });
/** Whether a scene's picker leads with the hardening (its lesson: "Three bangs" and "Bang"). */
export const leadsHard = (scene) => scene?.setup === 'bangs' || scene?.id === 'test-stress' || scene?.course === 'stress';

/** The par chooser's words (0.0.12, test-shoothouse: the build sheet 0.0.12 §4's PAR_MS names). */
export const PAR_WORDS = Object.freeze({ basic: 'Basic', advanced: 'Advanced', operator: 'Operator' });
/**
 * The par chooser's options (0.0.12): [{ id: null, label: "The sheet's own" }, { id: 'basic', label: 'Basic', ms: 3000 }, …] from the
 * scene's pars (scenes.js `pars`: the names) and their times (parMs: { basic: 3000, … }, the scene's PAR_MS, never a copy here).
 */
export function parOptions(scene, parMs = {}) {
  const ids = Array.isArray(scene?.pars) ? scene.pars : [];
  if (!ids.length) return [];
  return [{ id: null, label: "The sheet's own" }, ...ids.map(id => ({ id, label: PAR_WORDS[id] ?? id, ms: Number.isFinite(parMs?.[id]) ? parMs[id] : null }))];
}
/** A par option's words: "Basic · 3.0 s"; the sheet's own with the sheet's par where it is known ("The sheet's own (basic, 3.0 s)"). */
export function parWords(o, own = null, parMs = {}) {
  if (!o) return '';
  if (o.id === null) return own ? `${o.label} (${String(PAR_WORDS[own] ?? own).toLowerCase()}${Number.isFinite(parMs?.[own]) ? `, ${(parMs[own] / 1000).toFixed(1)} s` : ''})` : o.label;
  return `${o.label}${Number.isFinite(o.ms) ? ` · ${(o.ms / 1000).toFixed(1)} s` : ''}`;
}

/**
 * The picker as a page on the title's paper: { body, buttons, pars }. scene: SCENES' record; onPick(tier, { par }) (par null: the
 * sheet's own); onBack(). 0.0.12: a scene with pars (test-shoothouse) shows the par chooser under the sheets (P cycles it, or a
 * click): parMs the scene's PAR_MS, parOf(tier) the sheet's own par's name.
 */
export function pickerPage({ scene, sheets = {}, order = null, onPick, onBack, hard = null, parMs = {}, parOf = null }) {
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(globalThis.document.createElement(tag), props); for (const k of kids.flat()) if (k !== null && k !== undefined && k !== false) n.append(k); return n; };
  // (the scene's own list and default where it names them (scenes.js: sheets, sheet), else the sim's picker order)
  const rows = pickerRows(sheets, Array.isArray(scene?.sheets) ? scene.sheets : order, scene?.sheet ?? PICKER_DEFAULT, { hard, lead: leadsHard(scene) });
  // (the hardening's words emphasised, its number and parts on their hover)
  const small = (r) => {
    if (!r.hard) return el('small', { textContent: r.line });
    const h = el('b', { className: 'hard', textContent: `Hardening: ${r.hard}`, ...(r.hardTitle ? { title: r.hardTitle } : {}) }), rest = sheetLine(sheets[r.tier]);
    return r.lead ? el('small', {}, h, rest ? ` · ${rest}` : '') : el('small', {}, rest ? `${rest} · ` : '', h);
  };
  // (0.0.12: the par chooser, its choice kept while the page stands; the sheet's own by default)
  const pars = parOptions(scene, parMs);
  let parAt = 0;
  const parBtns = pars.map((o, i) => {
    const b = el('button', { className: `item parpick${i === 0 ? ' on' : ''}`, type: 'button' }, '');
    b.dataset.par = o.id ?? 'own';
    b.onclick = () => { parAt = i; for (const [j, x] of parBtns.entries()) x.classList.toggle('on', j === parAt); };
    return b;
  });
  const parText = () => { for (const [i, b] of parBtns.entries()) b.textContent = parWords(pars[i], null, parMs); };
  parText();
  const buttons = rows.map((r, i) => {
    const b = el('button', { className: `item sheetpick${r.focus ? ' lead' : ''}`, type: 'button', onclick: () => onPick?.(r.tier, { par: pars[parAt]?.id ?? null }) }, el('kbd', { textContent: String(i + 1) }), r.label, small(r));
    b.dataset.tier = r.tier;
    // (0.0.12: each sheet's own par on its line's hover, where the scene has pars)
    if (pars.length && parOf) { const own = parOf(r.tier); if (own) b.title = `Par: ${parWords(pars[0], own, parMs)}`; }
    return b;
  });
  const body = el('div', { className: 'sheet tests picker' },
    el('h2', { textContent: String(scene?.title ?? 'Pairs').toUpperCase() }),
    el('p', { className: 'sub', textContent: 'Play it as a sheet: each its own experience, its own hands and eyes. The same targets turn on the same seed whichever you choose.' }),
    SETUP_LINES[scene?.setup] ? el('p', { className: 'sub setup', textContent: SETUP_LINES[scene.setup] }) : SCENE_LINES[scene?.id] ? el('p', { className: 'sub setup', textContent: SCENE_LINES[scene.id] }) : null,
    el('hr'),
    ...buttons,
    pars.length ? el('div', { className: 'pars' }, el('span', { className: 'parhead' }, el('kbd', { textContent: 'P' }), ' Par'), ...parBtns) : null,
    el('hr'),
    el('button', { className: 'item small', type: 'button', onclick: () => onBack?.() }, 'Back'),
    el('p', { className: 'note', textContent: scene?.goal ?? '' }));
  // (the digits pick a sheet as on a card's lines)
  body.addEventListener('keydown', (e) => {
    const m = /^(?:Digit|Numpad)([1-9])$/.exec(e.code ?? '');
    if (m && buttons[Number(m[1]) - 1]) { e.preventDefault(); buttons[Number(m[1]) - 1].click(); }
    // (0.0.12: P cycles the par)
    if (e.code === 'KeyP' && parBtns.length) { e.preventDefault(); parBtns[(parAt + 1) % parBtns.length].click(); }
  });
  return { body, buttons, rows, pars: parBtns, get par() { return pars[parAt]?.id ?? null; } };
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

/**
 * The end card's lines for the banged scene (0.0.9): [summary, calm] from the scene's bangsNow ({ summary }): its summary ("Boot
 * recruit · three bangs · the chaos 105 − hardening 7 (green) = felt 98, pinned · froze 2.45 s · … (calm 2.50 s)"), then, where
 * the page remembers one, this session's calm run of the same sheet on the same seed ("Your calm run on this seed: first round
 * 2.61 s after you saw him"). calmRunMs: that run's first string's TURN TO PAUSE + PAUSE TO FIRST (ms), or null. fmt: takeInWords.
 */
export function bangLines(bn, { calmRunMs = null, fmt = two } = {}) {
  if (!bn) return [];
  // (the book's calm figure is in the summary already: the calm line only for this session's own calm run (the design review
  // of v0.0.9: it repeated "(calm 2.60 s)"), measured as the paper's TURN TO PAUSE + PAUSE TO FIRST, as the summary's is)
  return [bn.summary ?? null, Number.isFinite(calmRunMs) ? `Your calm run on this seed: first round ${fmt(calmRunMs)} s after you saw him` : null].filter(Boolean);
}
