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
// 0.0.18 (the build sheet 0.0.18 §2.3, §8 item 9): under the par, "Kit: Standard ▸" (Enter on it, or a click) opens the loadout screen
// (cards/loadout.js) in the picker's place, one loadout for every sheet; Kit up comes back and the pick carries its code
// (onPick(tier, { par, loadout })); the standard is carried as no code at all, so its lane is the lane without one.
// v0.0.21 (the build sheet v0.0.21 §1 items 9 and 16; done lens D5): on a scene whose house can be drawn (scenes.js draws: ['set',
// 'drawn']), under the kit, "House: As set · Drawn from the seed" (H cycles it; the scene's HOUSE_DRAW_DEFAULT first), carried with
// the pick (onPick(tier, { draw })); and "Qualify as <sheet>" (house-runs.js qualNext: the sheet after the highest qualified, else the
// focused one), which starts a qualification (onPick(tier, { qual: true, draw: 'drawn', par })): the drawn house, the standard kit,
// the par chosen where it is the sheet's own or harder; a qualified sheet's line says so ("QUALIFIED" after its best). Hidden where
// the house is not drawn (the ship rule: nothing of qualified shows unless the drawn house ships).
// v0.0.22 (its build sheet §1 item 14, §0 items 19 to 21; the house lens's G3): where the scene names its houses (scenes.js layouts:
// ['A', 'B', 'C']) and the sim has them (assemble.js HOUSE_LAYOUTS), the house row is "House: A · B · C · Drawn from the seed" (H
// cycles it; A is the house as set, B and C the instructors' other two panel settings, carried as onPick(tier, { layout: 'B' })), and
// under it, where the sim has a second room set (assemble.js ROOM_SETS.all) and the scene offers it (scenes.js rooms: ['a', 'all'], the
// ship rule's switch, ['a'] until house-drawn8 is green: the A and D review), "Rooms: The three · All eight" (R cycles it; the scene's
// HOUSE_ROOMS_DEFAULT first), live only on the drawn choice and carried with it (onPick(tier, { draw: 'drawn', rooms })). Without
// them (A's exports not there, or a scene with no layouts) the row is v0.0.21's to the letter. Qualify draws as before (the page's
// room default; a named house never qualifies: the build sheet §0 item 21).
import { loadoutPage, loadoutWord } from './loadout.js';
import { readRuns, bestsOf, bestWords, qualNext, PAR_ORDER } from './house-runs.js';
import * as SCENES_DATA from '../../data/scenes.js';
// (the named houses and the room sets read by name, so the rows stay v0.0.21's until the rooms' role exports them)
import * as ASSEMBLE from '../../sim/scenes/assemble.js';

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
  // (0.0.12: the shoot house; my words. v0.0.23, its build sheet item 15, carried FH-7: in plain words, what T does at each sheet and
  // what the keys do (the first-hour lens: "a step at a time" and "T bundles it" told a new player nothing he could do))
  'test-shoothouse': 'The Wheel, at 1 G. Your number two is of your sheet too, and runs the same drill. Boot recruit and Private: T names every step and does it, but your keys walk you through each door, as the instructor calls them. From the Corporal, T takes you through the door too, a room\'s drill at a time. The same rooms and draws on the seed whichever you choose.' });
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

/** The house's choice on the picker: its words, and the default (scenes.js HOUSE_DRAW_DEFAULT, the ship rule's switch). */
export const DRAW_WORDS = Object.freeze({ set: 'As set', drawn: 'Drawn from the seed' });
export const drawDefaultOf = (scene) => (Array.isArray(scene?.draws) && scene.draws.includes(SCENES_DATA.HOUSE_DRAW_DEFAULT) ? SCENES_DATA.HOUSE_DRAW_DEFAULT : scene?.draws?.[0] ?? 'set');
/** The named houses a scene offers on the picker: its layouts (scenes.js) the sim has (assemble.js HOUSE_LAYOUTS), A first; [] for none or A alone. */
export function layoutsOf(scene, have = ASSEMBLE.HOUSE_LAYOUTS ?? { A: 'A' }) {
  const L = Array.isArray(scene?.layouts) ? scene.layouts.filter(x => have?.[x] !== undefined) : [];
  return L.length > 1 && L.includes('A') ? ['A', ...L.filter(x => x !== 'A')] : [];
}
/**
 * The room sets a drawn house may take on the picker: ['a', 'all'] where the sim has the eight (assemble.js ROOM_SETS.all)
 * and the scene offers them (scenes.js rooms holding 'all': the ship rule's switch, which the lead flips), else []. (The A and D
 * review: with the sim's export alone, the merged tree showed "All eight" while house-drawn8 was red.)
 */
export const roomSetsOf = (sets = ASSEMBLE.ROOM_SETS ?? null, scene = null) => (sets?.all && Array.isArray(scene?.rooms) && scene.rooms.includes('all') ? ['a', 'all'] : []);
/** The rooms row's words. */
export const ROOMS_WORDS = Object.freeze({ a: 'The three', all: 'All eight' });
/** Whether the scene's house can be drawn (scenes.js draws), so qualified shows (its ship rule). */
export const drawsHouse = (scene) => Array.isArray(scene?.draws) && scene.draws.includes('drawn');
/** The qualifications kept in this browser (house-runs.js), or {} with none or no storage. */
function houseQuals(scene) {
  if (scene?.scenario !== 'test-shoothouse') return {};
  try { return readRuns(globalThis.localStorage).quals ?? {}; } catch { return {}; }
}
/** The shoot house's bests on the picker (house-runs.js), or null off it or with no storage. */
function houseBests(scene) {
  if (scene?.scenario !== 'test-shoothouse') return null;
  let by = null;
  try { by = bestsOf(readRuns(globalThis.localStorage).runs, { scene: scene.id }); } catch { by = null; }
  return by ? (tier) => bestWords(by[tier]) : null;
}
/**
 * The picker as a page on the title's paper: { body, buttons, pars }. scene: SCENES' record; onPick(tier, { par }) (par null: the
 * sheet's own); onBack(). 0.0.12: a scene with pars (test-shoothouse) shows the par chooser under the sheets (P cycles it, or a
 * click): parMs the scene's PAR_MS, parOf(tier) the sheet's own par's name.
 */
// (the card (the build sheet v0.0.20 §1 item 20): bests(tier) → the sheet's best lane and its GOs in words ("best 42.2 s ·
// 3 GO", cards/house-runs.js bestWords, from the runs kept in this browser), after its line; nothing is locked. The shoot house's
// own by default, read here from localStorage (every read in try and catch: none in a private window))
export function pickerPage({ scene, sheets = {}, order = null, onPick, onBack, hard = null, parMs = {}, parOf = null, loadout = null, bests = houseBests(scene), quals = houseQuals(scene),
  layouts = ASSEMBLE.HOUSE_LAYOUTS ?? { A: 'A' }, roomSets = ASSEMBLE.ROOM_SETS ?? null, roomsDefault = SCENES_DATA.HOUSE_ROOMS_DEFAULT ?? 'a' }) {
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
  // (v0.0.18: the shoot house's loadout, one for every sheet (cards/loadout.js): "Kit: Standard ▸" opens its screen in the picker's
  // place, Kit up comes back with the code, carried into the lane with the sheet; loadout: main.js's { code, save, preview, wh })
  let kitCode = loadout && scene?.scenario === 'test-shoothouse' ? (loadout.code ?? 'standard') : null;
  const kitBtn = kitCode !== null ? el('button', { className: 'item small kitpick', type: 'button' }, '') : null;
  const kitText = () => { if (kitBtn) { kitBtn.textContent = `Kit: ${loadoutWord(kitCode)} ▸`; kitBtn.dataset.code = kitCode; } };
  kitText();
  // (the house, as set or drawn from the seed, where the scene draws it; its choice kept while the page stands)
  // (with named houses, A, B and C in the set's place (see the header): a choice is { draw } or { layout })
  const draws = drawsHouse(scene) ? scene.draws : [], named = draws.length ? layoutsOf(scene, layouts) : [];
  const houses = named.length ? [...named.map(l => ({ layout: l, draw: l === 'A' ? 'set' : null })), ...draws.filter(d => d !== 'set').map(d => ({ draw: d }))] : draws.map(d => ({ draw: d }));
  const dflt = drawDefaultOf(scene);
  let drawAt = Math.max(0, houses.findIndex(h => h.draw === dflt));
  const sets = draws.includes('drawn') ? roomSetsOf(roomSets, scene) : [];
  let roomsAt = Math.max(0, sets.indexOf(roomsDefault));
  const roomBtns = sets.map((r, i) => {
    const b = el('button', { className: `item roompick${i === roomsAt ? ' on' : ''}`, type: 'button', textContent: ROOMS_WORDS[r] ?? r });
    b.dataset.rooms = r;
    b.onclick = () => { if (b.disabled) return; roomsAt = i; for (const [j, x] of roomBtns.entries()) x.classList.toggle('on', j === roomsAt); };
    return b;
  });
  const roomsLive = () => { const on = houses[drawAt]?.draw === 'drawn'; for (const b of roomBtns) { b.disabled = !on; b.classList.toggle('off', !on); } };
  const drawBtns = houses.map((h, i) => {
    const b = el('button', { className: `item drawpick${i === drawAt ? ' on' : ''}`, type: 'button', textContent: h.layout ?? DRAW_WORDS[h.draw] ?? h.draw, ...(h.layout ? { title: h.layout === 'A' ? 'House A: the house as set' : `House ${h.layout}: the instructors' panels set another way, its stands drawn from the seed` } : {}) });
    if (h.draw) b.dataset.draw = h.draw;
    if (h.layout) b.dataset.layout = h.layout;
    b.onclick = () => { drawAt = i; for (const [j, x] of drawBtns.entries()) x.classList.toggle('on', j === drawAt); roomsLive(); };
    return b;
  });
  roomsLive();
  const drawOf = () => {
    const h = houses[drawAt];
    if (!h) return {};
    if (h.layout && h.layout !== 'A') return { layout: h.layout };
    return { draw: h.draw, ...(h.draw === 'drawn' && sets.length ? { rooms: sets[roomsAt] } : {}) };
  };
  const buttons = rows.map((r, i) => {
    const best = bests ? bests(r.tier) : null, q = quals?.[r.tier] ? 'QUALIFIED' : null, line = [best, q].filter(Boolean).join(' · ') || null;
    const b = el('button', { className: `item sheetpick${r.focus ? ' lead' : ''}${q ? ' qualified' : ''}`, type: 'button', onclick: () => onPick?.(r.tier, { par: pars[parAt]?.id ?? null, ...(kitCode && kitCode !== 'standard' ? { loadout: kitCode } : {}), ...drawOf() }) }, el('kbd', { textContent: String(i + 1) }), r.label, small(r), line ? el('small', { className: 'best', textContent: line }) : null);
    b.dataset.tier = r.tier;
    // (0.0.12: each sheet's own par on its line's hover, where the scene has pars)
    if (pars.length && parOf) { const own = parOf(r.tier); if (own) b.title = `Par: ${parWords(pars[0], own, parMs)}`; }
    return b;
  });
  // ("Qualify as <sheet>": the drawn house, the standard kit, the par chosen if it is the sheet's own or harder (see the header))
  const qTier = draws.includes('drawn') ? qualNext(rows.map(r => r.tier), quals, rows.find(r => r.focus)?.tier ?? PICKER_DEFAULT) : null;
  const qualParOf = () => { const id = pars[parAt]?.id ?? null, own = parOf ? parOf(qTier) : null; return id && own && PAR_ORDER.indexOf(id) > PAR_ORDER.indexOf(own) ? id : null; };
  const qualBtn = qTier ? el('button', { className: 'item small qualpick', type: 'button', onclick: () => onPick?.(qTier, { qual: true, draw: 'drawn', par: qualParOf() }) },
    `Qualify as ${sheets[qTier]?.label ?? qTier}`, el('small', { textContent: 'three GOs in a row on houses you have not seen · the standard kit · your par or harder' })) : null;
  if (qualBtn) qualBtn.dataset.tier = qTier;
  const body = el('div', { className: 'sheet tests picker' },
    el('h2', { textContent: String(scene?.title ?? 'Pairs').toUpperCase() }),
    el('p', { className: 'sub', textContent: 'Play it as a sheet: each its own experience, its own hands and eyes. The same targets turn on the same seed whichever you choose.' }),
    SETUP_LINES[scene?.setup] ? el('p', { className: 'sub setup', textContent: SETUP_LINES[scene.setup] }) : SCENE_LINES[scene?.id] ? el('p', { className: 'sub setup', textContent: SCENE_LINES[scene.id] }) : null,
    el('hr'),
    // (six sheets in two columns on a wide window, so the par, the kit, the house, "Qualify as" and Back fit a 720-px
    // window unscrolled (the play review of 2026-11-16: from "As set" down they sat below 1280 × 720, Back below 1920 × 1080))
    el('div', { className: `sheets${buttons.length > 4 ? ' two' : ''}` }, ...buttons),
    pars.length ? el('div', { className: 'pars' }, el('span', { className: 'parhead' }, el('kbd', { textContent: 'P' }), ' Par'), ...parBtns) : null,
    kitBtn,
    drawBtns.length ? el('div', { className: 'pars draws' }, el('span', { className: 'parhead' }, el('kbd', { textContent: 'H' }), ' House'), ...drawBtns) : null,
    roomBtns.length ? el('div', { className: 'pars rooms' }, el('span', { className: 'parhead' }, el('kbd', { textContent: 'R' }), ' Rooms'), ...roomBtns) : null,
    qualBtn,
    el('hr'),
    el('button', { className: 'item small', type: 'button', onclick: () => onBack?.() }, 'Back'),
    el('p', { className: 'note', textContent: scene?.goal ?? '' }));
  // (the loadout's screen in the picker's place, and back (see above): the sheet focused or the scene's default for its reach)
  const page = [...body.childNodes];
  const openKit = () => {
    const tier = rows.find(r => r.focus)?.tier ?? 'private', lp = loadoutPage({ code: kitCode, tier, wh: loadout?.wh?.(tier) ?? 10, preview: loadout?.preview ? (c) => loadout.preview(c, tier) : null,
      onDone: (c) => { kitCode = c; loadout?.save?.(c); kitText(); close(); }, onBack: () => close() });
    body.replaceChildren(lp.body); body.classList.add('kit');
    lp.body.querySelector('button.issue.on, button.issue')?.focus();
  };
  const close = () => { body.replaceChildren(...page); body.classList.remove('kit'); kitBtn?.focus(); };
  if (kitBtn) kitBtn.onclick = () => openKit();
  // (the digits pick a sheet as on a card's lines)
  body.addEventListener('keydown', (e) => {
    if (body.classList.contains('kit')) return;
    const m = /^(?:Digit|Numpad)([1-9])$/.exec(e.code ?? '');
    if (m && buttons[Number(m[1]) - 1]) { e.preventDefault(); buttons[Number(m[1]) - 1].click(); }
    // (0.0.12: P cycles the par)
    if (e.code === 'KeyP' && parBtns.length) { e.preventDefault(); parBtns[(parAt + 1) % parBtns.length].click(); }
    // (H cycles the house)
    if (e.code === 'KeyH' && drawBtns.length) { e.preventDefault(); drawBtns[(drawAt + 1) % drawBtns.length].click(); }
    // (R cycles the rooms, on the drawn house only)
    if (e.code === 'KeyR' && roomBtns.length && !roomBtns[0].disabled) { e.preventDefault(); roomBtns[(roomsAt + 1) % roomBtns.length].click(); }
  });
  return { body, buttons, rows, pars: parBtns, get par() { return pars[parAt]?.id ?? null; }, get loadout() { return kitCode; }, kit: kitBtn, draws: drawBtns, get draw() { return houses[drawAt]?.draw ?? null; }, qual: qualBtn,
    // (the named house chosen ('A', 'B', 'C', null on the drawn one or with none), the rooms' buttons and their choice, what the pick carries)
    get layout() { return houses[drawAt]?.layout ?? null; }, rooms: roomBtns, get roomSet() { return sets.length ? sets[roomsAt] : null; }, get house() { return drawOf(); } };
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
