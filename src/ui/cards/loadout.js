// OLYMPUS ui: the loadout screen, the carrier's four faces and what goes on them, from the shoot house's sheet picker (WEAPONS §12.7; the build sheet 0.0.18 §2.3, §8 item 9; 0.0.19 §1 K-face, §4 item 5).
//
// The user, 2026-11-15: "a loadout screen where the marine draws and carries them", and "everyone should have the same loadout":
// the screen is one loadout for every sheet, chosen on the picker ("Kit: Standard ▸") and carried into the lane as its code
// (src/sim/arms/loadout.js codeOf), kept on "Again as …". On the title's paper: the carrier's faces as columns of places (the
// front the house's issue this round, two magazine pouches and the dump pouch, not to change; the left and right two places
// each, the back one), the issue table (the G-11, v0.0.19's G-9P and G-13P practice grenades, the SC-1 with its FD-1, v0.0.19's
// BC-1 cutting charge with its FD-1, the halligan, the ram: loadout.js ISSUE_ORDER, so a grenade hidden by PRACTICE_ISSUED is not
// drawn) with each item's mass and its reach from the face it would ride at the sheet's Weapon handling, the presets on 1 to 8
// (loadout.js PRESET_ORDER: v0.0.18's four, then Frag, Concussion, Cut and Mixed; they wrap on the paper, never over the mass),
// the line "Your #2: P-12, issued as yours" (his sidearm is standard issue, the user's answer of 2026-11-16, "#2 has
// to have a sidearm"; v0.0.19's row that turned it on and off is gone, loadout.js TWO_P12_DEFAULT), and the whole kit's mass with the walk's push and brake at it, before and after. Every number is the sim's: preview(code, tier) is main.js's, a fill of the lane
// with that code (loadout.js loadoutView: kitMassKg, motion.js tractionOf), and the reach devices.js deviceMs at the sheet's own
// values; this module computes nothing of its own.
// The keys (by code; the letters are the game's in play, so none is taken here): the arrows (and Z, S) move between the buttons
// as on every title page (the front's fixed places, disabled, left out), the presets' row one stop (Left and Right along it),
// the control in focus kept through every redraw;
// Enter or a click on an item of the table chooses it, on a place puts it there (a tool only on the back, a pouch only on a
// side: the sim's checkLoadout gives the reason a place refuses it, said under the faces), Backspace or Delete empties the
// place in focus, 1 to 8 the presets, Enter on "Kit up" back to the picker with the code, Back (Esc) without it (the #2's line
// is words, not a control: nothing to choose). loadoutWord names a code on the picker: its preset's word or "Custom" ("Kit: Frag
// ▸"; v0.0.19's ", #2 P-12" after it is gone, every kit has it). Plain DOM; the look is style.css's "v0.0.18 loadout" block.
// v0.0.20 (the build sheet item 23; user.md U-7, the user, 2026-11-15: "a loadout screen where the marine draws and carries them"):
// the marine stands beside the faces, the gear doll of the I and C cards (art/doll/dress.js dressedDoll, from gear.js's record) in
// the kit being chosen: preview(code) gives it as `doll` (a Pixmap: main.js paints it from the fill's own gear, so the pouches
// on his left, right and back are what applyLoadout put there, each device as devices.js DEVICES[model].look draws it), redrawn
// on each change, at DOLL_PX CSS pixels a doll pixel (1 in a window under DOLL_SHORT_PX tall, so Kit up stays in it). Pure but the DOM
// builder.
import { ISSUE, ISSUE_ORDER, PRESET_ORDER, PRESET_WORDS, LOADOUT_PRESETS, FACE_N, loadoutOf, codeOf, checkLoadout, placeKg } from '../../sim/arms/loadout.js';
import { DEVICES, FACES, FACE_K, DEVICE_ACTIONS } from '../../sim/arms/devices.js';
import { paceOf } from '../../sim/skills/skills.js';

/** The marine's doll on the screen: CSS pixels a doll pixel at --ui 1 (the PERSONNEL card's). */
export const DOLL_PX = 2;
/** Under this window height (CSS px) the doll is drawn at 1 CSS pixel a doll pixel, so Kit up and Back stay in the window (the play review: at 1600 × 900 and 1920 × 1080 Kit up sat below the fold, the doll 350 px tall above the issue list). */
export const DOLL_SHORT_PX = 1200;
/** The faces' words on the screen. */
export const FACE_WORDS = Object.freeze({ front: 'FRONT', left: 'LEFT SIDE', right: 'RIGHT SIDE', back: 'BACK' });
/** The #2's P-12 on the screen: a line, standard issue. */
export const TWO_WORDS = Object.freeze({ head: 'Your #2', issued: 'P-12, issued as yours' });
/** A loadout's word on the picker ("Standard", "Custom" for a code that is no preset). */
export const loadoutWord = (code) => {
  const s = loadoutOf(code);
  if (s.error) return PRESET_WORDS.standard;
  return PRESET_WORDS[codeOf({ ...s, two: undefined })] ?? 'Custom';
};
// (a spec's own copy: its four faces, nothing shared with the sim's frozen presets; no `two`, so the code it gives carries no token and
// the #2's P-12 is loadout.js twoP12Of's, the one reader (TWO_P12_DEFAULT: standard issue from v0.0.20))
const copyOf = (s) => ({ ...Object.fromEntries(FACES.map(f => [f, [...(s?.[f] ?? [])]])) });

/**
 * A place's reach at a sheet (s, two places): the item's first device's reach action, base × FACE_K × paceOf(Weapon handling),
 * as devices.js deviceMs times it (the sheet's value given, calm).
 */
export function reachS(place, face, wh) {
  const m = ISSUE[place]?.items?.[0], D = DEVICES[m];
  const act = D?.kind === 'grenade' ? 'gren:reach' : D?.kind === 'tool' ? 'tool:reach' : D ? 'charge:reach' : null;
  if (!act) return null;
  return Math.round(DEVICE_ACTIONS[act].s * (FACE_K[face] ?? 1) * paceOf(wh) * 100) / 100;
}

/**
 * The screen (see the header): { body, get code() }. code: the loadout now; tier and wh: the sheet the reach is shown at;
 * preview(code) → loadoutView-shaped { massKg, push: { pushMs2, brakeMs2 } } or null; onDone(code); onBack().
 */
export function loadoutPage({ code = 'standard', tier = 'private', wh = 10, preview = null, onDone, onBack, doc = globalThis.document, winH = globalThis.innerHeight ?? 768 } = {}) {
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(doc.createElement(tag), props); for (const k of kids.flat()) if (k !== null && k !== undefined && k !== false) n.append(k); return n; };
  let spec = loadoutOf(code);
  if (spec.error) spec = loadoutOf('standard');
  spec = copyOf(spec);
  let chosen = 'g11', why = null;
  const base = preview ? preview('standard') : null;
  const body = el('div', { className: 'sheet loadout' });
  // (the control in focus found again after a redraw, by what it is (an issue, a preset, a place, Kit up), so the arrows and the
  // digits go on working from the keyboard: the review of 2026-11-16, focus fell to the page after Enter on an item or a preset)
  const keyOf = (n) => (!n || !body.contains(n) ? null : n.dataset.issue ? `button.issue[data-issue="${n.dataset.issue}"]` : n.dataset.preset ? `button.preset[data-preset="${n.dataset.preset}"]`
    : n.dataset.face ? `button.place[data-face="${n.dataset.face}"][data-i="${n.dataset.i}"]` : n.classList.contains('kitup') ? 'button.kitup' : null);
  const draw = () => {
    const was = keyOf(doc.activeElement);
    const now = preview ? preview(codeOf(spec)) : null, c = codeOf(spec);
    const col = (f) => {
      const n = f === 'front' ? 3 : FACE_N[f], places = [];
      for (let i = 0; i < n; i++) {
        const p = spec[f][i] ?? null, I = p ? ISSUE[p] : null, r = p && f !== 'front' ? reachS(p, f, wh) : null;
        const b = el('button', { className: `item place${p ? ' full' : ''}${f === 'front' ? ' fixed' : ''}`, type: 'button' },
          el('span', { className: 'pw', textContent: I ? I.word : 'empty' }), I && f !== 'front' ? el('small', { textContent: `${itemKg(p).toFixed(2)} kg · reach ${r?.toFixed(2)} s` }) : null);
        b.dataset.face = f; b.dataset.i = String(i); if (p) b.dataset.item = p;
        b.disabled = f === 'front';
        b.onclick = () => put(f, i, chosen);
        b.onkeydown = (e) => { if (e.code === 'Backspace' || e.code === 'Delete') { e.preventDefault(); e.stopPropagation(); put(f, i, null); } };
        places.push(b);
      }
      return el('div', { className: `face face-${f}` }, el('div', { className: 'fh', textContent: FACE_WORDS[f] }), ...places);
    };
    const issue = ISSUE_ORDER.map(p => {
      const I = ISSUE[p], face = I.faces.includes('back') ? 'back' : 'left';
      const b = el('button', { className: `item issue${p === chosen ? ' on' : ''}`, type: 'button', onclick: () => { chosen = p; why = null; draw(); } },
        el('span', { className: 'pw', textContent: I.word }),
        el('small', { textContent: `${itemKg(p).toFixed(2)} kg + ${(placeKg(p) - itemKg(p)).toFixed(2)} pouch · ${reachS(p, face, wh)?.toFixed(2)} s, ${face === 'back' ? 'back' : 'side'}` }));
      b.dataset.issue = p;
      return b;
    });
    const presets = PRESET_ORDER.map((id, i) => {
      const on = codeOf({ ...spec, two: undefined }) === id;
      const b = el('button', { className: `item preset${on ? ' on' : ''}`, type: 'button', onclick: () => { spec = copyOf(LOADOUT_PRESETS[id]); why = null; draw(); } }, el('kbd', { textContent: String(i + 1) }), PRESET_WORDS[id]);
      b.dataset.preset = id;
      return b;
    });
    const mass = now && base ? `${base.massKg.toFixed(2)} kg → ${now.massKg.toFixed(2)} kg · push ${base.push.pushMs2.toFixed(2)} → ${now.push.pushMs2.toFixed(2)} m/s² · brake ${base.push.brakeMs2.toFixed(2)} → ${now.push.brakeMs2.toFixed(2)} m/s²` : '';
    // (the #2's P-12: standard issue, said as a line, never a control)
    const twoLine = el('p', { className: 'two', textContent: `${TWO_WORDS.head}: ${TWO_WORDS.issued}` });
    const kitUp = el('button', { className: 'item lead kitup', type: 'button', onclick: () => onDone?.(codeOf(spec)) }, 'Kit up');
    // (the marine in the kit, the preview's doll, its pixels straight onto a canvas at whole-pixel scale)
    let figure = null;
    if (now?.doll?.data) {
      figure = el('canvas', { className: 'doll marine' });
      figure.width = now.doll.w; figure.height = now.doll.h;
      const px = winH < DOLL_SHORT_PX ? 1 : DOLL_PX;
      figure.style.width = `calc(${now.doll.w * px}px * var(--ui, 1))`; figure.style.height = `calc(${now.doll.h * px}px * var(--ui, 1))`;
      const g = figure.getContext?.('2d');
      if (g) g.putImageData(new ImageData(new Uint8ClampedArray(now.doll.data.buffer.slice(0)), now.doll.w, now.doll.h), 0, 0);
      figure.dataset.devices = String(now.gear?.devices?.length ?? 0);
      figure.dataset.gear = now.gearKey ?? '';
    }
    body.replaceChildren(
      el('h2', { textContent: 'KIT' }),
      el('p', { className: 'sub', textContent: `One loadout for every sheet, your number two's the same. Reach shown at ${tier === 'private' ? 'the private' : tier}'s Weapon handling (${wh}). What you carry is felt in every push and brake.` }),
      el('div', { className: 'faces' }, figure, ...FACES.map(col)),
      el('p', { className: `why${why ? ' on' : ''}`, textContent: why ?? '' }),
      el('div', { className: 'issues' }, ...issue),
      el('div', { className: 'presets' }, ...presets),
      twoLine,
      el('p', { className: 'mass', textContent: mass }),
      el('p', { className: 'code', textContent: c }),
      el('hr'),
      kitUp,
      el('button', { className: 'item small', type: 'button', onclick: () => onBack?.() }, 'Back'));
    body.dataset.code = c;
    body.dataset.mass = now ? String(now.massKg) : '';
    if (was) body.querySelector(was)?.focus();
  };
  // (a place set: the sim's checkLoadout says whether the face takes it, its reason under the faces if not)
  const put = (f, i, p) => {
    const next = copyOf(spec);
    if (p) next[f][i] = p; else next[f].splice(i, 1);
    next[f] = next[f].filter(Boolean);
    const w = checkLoadout(next);
    if (w) why = `${cap(w)}.`; else { spec = next; why = null; }
    draw();
    body.querySelector(`button.place[data-face="${f}"][data-i="${i}"]`)?.focus();
  };
  body.addEventListener('keydown', (e) => {
    // (the presets one stop for the arrows: Up and Down (Z and S) step over the whole row, Left and Right move along it, so the
    // keys' way to Kit up is no longer for the eight presets than it was for v0.0.18's four (the review of v0.0.19's K: 21
    // ArrowDowns, past ui-loadout's walk of 20); the title's own walk (boot.js) never sees a key taken here)
    const pre = e.target?.closest?.('button.preset');
    if (pre && /^(ArrowUp|ArrowDown|KeyW|KeyS|ArrowLeft|ArrowRight)$/.test(e.code ?? '')) {
      e.preventDefault(); e.stopPropagation();
      const row = [...body.querySelectorAll('button.preset')], items = [...body.querySelectorAll('button.item:not(:disabled)')], i = row.indexOf(pre);
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') { row[(i + (e.code === 'ArrowRight' ? 1 : -1) + row.length) % row.length]?.focus(); return; }
      const lo = items.indexOf(row[0]), hi = items.indexOf(row.at(-1)), down = e.code === 'ArrowDown' || e.code === 'KeyS';
      items[down ? (hi + 1) % items.length : (lo - 1 + items.length) % items.length]?.focus();
      return;
    }
    const m = /^(?:Digit|Numpad)([1-9])$/.exec(e.code ?? '');
    if (m) { e.preventDefault(); body.querySelectorAll('button.preset')[Number(m[1]) - 1]?.click(); return; }
    if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); onBack?.(); }
  });
  draw();
  return { body, get code() { return codeOf(spec); } };
}
// (a place's items' own mass, kg: the G-11's 0.38, its pouch apart)
const itemKg = (p) => (ISSUE[p]?.items ?? []).reduce((n, m) => n + (DEVICES[m]?.massKg ?? 0), 0);
const cap = (w) => String(w).charAt(0).toUpperCase() + String(w).slice(1);
