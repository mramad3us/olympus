// OLYMPUS ui: the way in, and the cards over the game: the title, enlistment, and the card host.
//
// The title is a typed sheet of paper on the dark (tradecraft's title: docs/research/shots/
// tradecraft-title.png): OLYMPUS, the version, then Continue (the newest autosave of any world, a
// Standard career's 'auto' or an Ironman's 'ironman', v0.0.1's unworlded ones included: the store's
// summaries carry each slot's name), New career (the lead entry, brass-edged), and Load a save file. New
// career leads to the enlistment paper, a stub until the career screens arrive: the unit the recruit
// joins (DESIGN.md, Setting: 1st Squad, 2nd Platoon, Echo Company, 2nd Battalion, 4th Marine
// Regiment, at Marine Corps Base Melas) and the one choice the user settled at kickoff, how death is
// kept, Standard or Ironman, for the whole career (the user, 2026-11-05). The career opens in Echo's
// barracks on Monday, Sol 590 of MY 211, at 12:40 Melas time (CONTRACTS §3).
//
// The title's Tests (ROADMAP §2.2, first used at v0.0.4): a page of the test scenes on the same
// paper (cards/tests.js), each started with its goal and scored at its end; Esc or Back returns.
//
// In play, cards of dark glass, each built by its own module and hosted here: the menu (Esc:
// cards/menu.js, with the sound's volume and mute), the keys ('?': cards/keys.js, every key this
// build gives a meaning, labelled AZERTY), the log (J: cards/log.js, its last lines), the bench's
// result (cards/bench.js), and the 0.0.4 round's, opened by main.js through openCard: PERSONNEL (C:
// cards/sheet.js), the R menu (R held: cards/actions.js, the 0.0.6 round's pixel menu of single actions,
// which reads its own keys while it is up and has no button to focus), the late card (cards/late.js), a test
// scene's end card and its score card (cards/end.js, cards/score.js); and the 0.0.5 round's what you
// carry (I: cards/inventory.js, tradecraft's pockets ported, the gear's tiles by arms' kitView). The
// step panel and the reflex card of stop motion are the HUD's (src/ui/hud/steps.js, reflex.js), not
// cards: they hold no pause of their own, the sim's 'stop' and 'reflex' holds stand time still. Each card that opens tells main.js through cb.overlay(name, open), and
// main.js holds a pause reason for it while it is open (DESIGN.md, Time: "an open overlay pauses")
// and hides the HUD under it (VIEWS §7.5: the card alone, never the HUD drawn through the glass). A
// card's lines are numbered and a digit picks one (read by code: AZERTY's top row types & é " '
// without Shift). A card opens with the focus on its lead line (the end card's Score it), and for its
// first CARD_GUARD_MS it takes no Enter or Space, so a key meant for the screen before never presses
// its focused line (but the R menu, opened by R held for it: its first Space checks, its first Enter does). The title's pages answer the arrows (and Z, S) by moving between their buttons.
//
// The screens never change the state: every choice goes back to main.js through cb, which acts.
// Plain DOM, built here and in the cards' modules and nowhere else; the look is src/ui/style.css.
import { menuCard } from './cards/menu.js';
import { keysCard } from './cards/keys.js';
import { logCard } from './cards/log.js';
import { testsPage } from './cards/tests.js';

const el = (tag, props = {}, ...kids) => {
  const n = Object.assign(document.createElement(tag), props);
  for (const k of kids.flat()) if (k !== null && k !== undefined && k !== false) n.append(k);
  return n;
};
const item = (text, about, onclick, className = 'item') => el('button', { className, onclick, type: 'button' }, text, about ? el('small', { textContent: about }) : null);

const ago = (ms) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return s < 90 ? 'just now' : s < 90 * 60 ? `${Math.round(s / 60)} min ago` : s < 36 * 3600 ? `${Math.round(s / 3600)} h ago` : `${Math.round(s / 86400)} days ago`;
};

/**
 * cb: { newCareer(mode), continueFrom(slot), loadFile(), resume(), saveFile(), report(), quit(), overlay(name, open),
 * keysRows() (the keys card's [[key, words]…]: cards/keys.js keysRows), logLines() (the log card's lines: cards/log.js
 * logLines), sound() ({ volume, muted } now, or null), volume(v), mute(on), scenes() (the test scenes, src/data/scenes.js's
 * records in order), playScene(scene) }.
 */
/** A card ignores Enter and Space this long after it opens (ms; the design review's: a key meant for the screen before). */
export const CARD_GUARD_MS = 400;

export function createBoot({ root = document.body, cb }) {
  const title = el('div', { id: 'title', hidden: true });
  const veil = el('div', { className: 'overlay', hidden: true });
  root.append(title, veil);
  let card = null, picks = [], page = null, titleArgs = null, openedAt = -Infinity, guard = true;
  const nowMs = () => globalThis.performance?.now?.() ?? Date.now();
  // (a key pressed for the screen before never lands on a card that has just opened: Enter and Space do nothing
  // for its first CARD_GUARD_MS (the design review's: Enter, read as the HUD's "end the scene", pressed the end
  // card's Again and threw the run away); a digit names its line, so it is never pressed by accident)
  const guarded = () => guard && nowMs() - openedAt < CARD_GUARD_MS;
  root.ownerDocument?.addEventListener?.('keydown', (e) => {
    if (!card || !guarded()) return;
    if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') { e.preventDefault(); e.stopPropagation(); }
  }, true);

  // ---- paper ----

  function showTitle({ version = '?', saves = [], now = Date.now() } = {}) {
    titleArgs = { version, saves };
    page = 'title';
    const nameOf = (r) => r.name ?? String(r.slot).split(':').pop();
    const last = saves.filter(r => nameOf(r) === 'auto' || nameOf(r) === 'ironman').sort((a, b) => b.savedAt - a.savedAt)[0];
    title.replaceChildren(el('div', { className: 'sheet' },
      el('h1', { textContent: 'OLYMPUS' }),
      el('p', { className: 'sub', textContent: `v${version} · in development: the barracks` }),
      el('hr'),
      last ? item('Continue', `${last.about || (last.mode === 'ironman' ? 'Ironman career' : 'Standard career')} · saved ${ago(now - last.savedAt)}`, () => cb.continueFrom(last.slot), 'item continue') : null,
      item('New career: enlist', 'Out of boot camp, a private of the MCRN Marine Corps, posted to a rifle platoon at Marine Corps Base Melas, on the floor of the Mariner Valley.', () => showEnlist(), 'item lead career'),
      el('hr'),
      item('Load a save file…', 'A .json save exported from the menu (Esc), from this browser or another.', () => cb.loadFile(), 'item load'),
      (cb.scenes?.() ?? []).length ? item('Tests: scenes to play and score', 'Each new mechanic first as a scene of its own: play it, then score it and paste the line back.', () => showTests(), 'item tests') : null,
      el('hr'),
      el('p', { className: 'note', textContent: 'Keys are read by where they sit on the keyboard, so they work on any layout; they are labelled AZERTY (Z Q S D to walk). In play, ? shows them all, Space pauses, Esc is the menu.' }),
    ));
    title.hidden = false;
    title.querySelector('.item')?.focus();
  }

  function showEnlist() {
    page = 'enlist';
    title.replaceChildren(el('div', { className: 'sheet enlist' },
      el('div', { style: 'display:flex;justify-content:space-between;align-items:center' }, el('h2', { textContent: 'ENLISTMENT' }), el('span', { className: 'stamp', textContent: 'MCRN' })),
      el('p', { className: 'unit', innerHTML: 'Private, MCRN Marine Corps, out of basic training.<br>1st Squad, 2nd Platoon, Echo Company, 2nd Battalion, 4th Marine Regiment.<br>Report to Marine Corps Base Melas, Melas Chasma, Mariner Valley, Mars.' }),
      el('hr'),
      el('div', { className: 'section', textContent: 'HOW DEATH IS KEPT' }),
      el('p', { className: 'note', textContent: 'Chosen once, for the whole career.' }),
      item('Standard', 'Save anywhere: an autosave and nine slots of your own. After a death, load a save and carry on.', () => cb.newCareer('standard'), 'item lead standard'),
      item('Ironman', 'One autosave and nothing else. Death ends the career; the world goes on, and the next recruit can enlist into it.', () => cb.newCareer('ironman'), 'item ironman'),
      el('p', { className: 'note', textContent: 'Either way, a save can be exported to a file and imported again.' }),
      el('hr'),
      item('Back', null, () => back(), 'item small'),
      el('p', { className: 'note', textContent: 'For now the career is a stub: you arrive in Echo Company\'s barracks on Monday, Sol 590, after the noon meal, and the base is yours to walk; the body, the routine and the squad\'s lives are still being built.' }),
    ));
    title.hidden = false;
    title.querySelector('.item.standard')?.focus();
  }

  // (the title's pages from the keyboard: the arrows, and Z and S by where they sit, move between its
  // buttons, Tab too, and Enter or Space presses one; main.js leaves those keys their browser meaning here)
  root.ownerDocument?.addEventListener?.('keydown', (e) => {
    if (!page || title.hidden || card || e.metaKey || e.ctrlKey || e.altKey) return;
    const step = e.code === 'ArrowDown' || e.code === 'KeyS' ? 1 : e.code === 'ArrowUp' || e.code === 'KeyW' ? -1 : 0;
    if (!step) return;
    const items = [...title.querySelectorAll('button.item')];
    if (!items.length) return;
    e.preventDefault();
    const at = items.indexOf(root.ownerDocument.activeElement);
    items[at < 0 ? 0 : (at + step + items.length) % items.length].focus();
  });

  function showTests() {
    page = 'tests';
    title.replaceChildren(testsPage({ scenes: cb.scenes?.() ?? [], version: titleArgs?.version ?? '?', onPick: (scene) => cb.playScene?.(scene), onBack: () => back() }));
    title.hidden = false;
    title.querySelector('.item.scene')?.focus();
  }

  const hideTitle = () => { title.hidden = true; page = null; };
  /** Esc on the title's pages: from enlistment or the tests back to the title. */
  function back() { if ((page === 'enlist' || page === 'tests') && titleArgs) showTitle(titleArgs); }

  // ---- glass cards ----

  // (guard false: a card opened by a key held down for it, the R menu, whose first Space or Enter is meant for it)
  function openCard(name, body, lines = [], { guard: g = true } = {}) {
    if (card) closeCard();
    card = name; picks = lines; openedAt = nowMs(); guard = g !== false;
    veil.replaceChildren(body);
    veil.hidden = false;
    cb.overlay(name, true);
    // (the focus on the card's lead line where it has one (the end card's Score it), else its first)
    (body.querySelector('button.lead') ?? body.querySelector('button'))?.focus();
  }
  function closeCard() {
    if (!card) return;
    const was = card;
    card = null; picks = [];
    veil.hidden = true;
    veil.replaceChildren();
    cb.overlay(was, false);
  }
  function openMenu() {
    const sound = cb.sound?.() ?? null;
    const { body, lines } = menuCard({
      acts: [
        ['Resume', () => { closeCard(); cb.resume(); }, 'Esc'],
        ['Save to a file', () => cb.saveFile(), null],
        ['Load a save file…', () => { closeCard(); cb.loadFile(); }, null],
        ['Report a problem', () => { closeCard(); cb.report?.(); }, null],
        ['Quit to the title', () => { closeCard(); cb.quit(); }, null],
      ],
      sound: sound && { ...sound, onVolume: (v) => cb.volume?.(v), onMute: (on) => cb.mute?.(on) },
      note: 'An autosave after every five minutes of play, after time passes, on changing place, at the start of each sol, on leaving the page, and on quitting to the title. Report a problem writes a file with the last autosave and what went wrong.',
    });
    openCard('menu', body, lines);
  }

  function openKeys() { openCard('keys', keysCard(cb.keysRows?.() ?? [])); }
  function openLog() { openCard('log', logCard(cb.logLines?.() ?? [])); }

  return {
    showTitle, showEnlist, showTests, hideTitle, back, openMenu, openKeys, openLog, openCard, closeCard,
    /** A digit while a card is open: its line, if it has one. */
    digit(n) { const b = picks[(n === 0 ? 10 : n) - 1]; if (b) b.click(); return !!b; },
    get card() { return card; },
    get page() { return page; },
  };
}
