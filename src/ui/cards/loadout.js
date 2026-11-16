// OLYMPUS ui: the loadout screen, the carrier's four faces and what goes on them, from the shoot house's sheet picker (WEAPONS §12.7; the build sheet 0.0.18 §2.3, §8 item 9).
//
// The user, 2026-11-15: "a loadout screen where the marine draws and carries them", and "everyone should have the same loadout":
// the screen is one loadout for every sheet, chosen on the picker ("Kit: Standard ▸") and carried into the lane as its code
// (src/sim/arms/loadout.js codeOf), kept on "Again as …". On the title's paper: the carrier's faces as columns of places (the
// front the house's issue this round, two magazine pouches and the dump pouch, not to change; the left and right two places
// each, the back one), the issue table (the G-11, the SC-1 with its FD-1, the halligan, the ram) with each item's mass and its
// reach from the face it would ride at the sheet's Weapon handling, the presets on 1 to 4, and the whole kit's mass with the
// walk's push and brake at it, before and after. Every number is the sim's: preview(code, tier) is main.js's, a fill of the lane
// with that code (loadout.js loadoutView: kitMassKg, motion.js tractionOf), and the reach devices.js deviceMs at the sheet's own
// values; this module computes nothing of its own.
// The keys (by code; the letters are the game's in play, so none is taken here): the arrows (and Z, S) move between the buttons
// as on every title page (the front's fixed places, disabled, left out), the control in focus kept through every redraw;
// Enter or a click on an item of the table chooses it, on a place puts it there (a tool only on the back, a pouch only on a
// side: the sim's checkLoadout gives the reason a place refuses it, said under the faces), Backspace or Delete empties the
// place in focus, 1 to 4 the presets, Enter on "Kit up" back to the picker with the code, Back (Esc) without it. Plain DOM; the look is style.css's "v0.0.18 loadout" block. Pure but the DOM builder.
import { ISSUE, ISSUE_ORDER, PRESET_ORDER, PRESET_WORDS, LOADOUT_PRESETS, FACE_N, loadoutOf, codeOf, checkLoadout, placeKg } from '../../sim/arms/loadout.js';
import { DEVICES, FACES, FACE_K, DEVICE_ACTIONS } from '../../sim/arms/devices.js';
import { paceOf } from '../../sim/skills/skills.js';

/** The faces' words on the screen. */
export const FACE_WORDS = Object.freeze({ front: 'FRONT', left: 'LEFT SIDE', right: 'RIGHT SIDE', back: 'BACK' });
/** A loadout's word on the picker ("Standard", or "Custom" for a code that is no preset). */
export const loadoutWord = (code) => { const s = loadoutOf(code); if (s.error) return PRESET_WORDS.standard; const c = codeOf(s); return PRESET_WORDS[c] ?? 'Custom'; };

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
export function loadoutPage({ code = 'standard', tier = 'private', wh = 10, preview = null, onDone, onBack, doc = globalThis.document } = {}) {
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(doc.createElement(tag), props); for (const k of kids.flat()) if (k !== null && k !== undefined && k !== false) n.append(k); return n; };
  let spec = loadoutOf(code);
  if (spec.error) spec = loadoutOf('standard');
  spec = Object.fromEntries(FACES.map(f => [f, [...spec[f]]]));
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
      const b = el('button', { className: `item preset${c === id ? ' on' : ''}`, type: 'button', onclick: () => { spec = Object.fromEntries(FACES.map(f => [f, [...LOADOUT_PRESETS[id][f]]])); why = null; draw(); } }, el('kbd', { textContent: String(i + 1) }), PRESET_WORDS[id]);
      b.dataset.preset = id;
      return b;
    });
    const mass = now && base ? `${base.massKg.toFixed(2)} kg → ${now.massKg.toFixed(2)} kg · push ${base.push.pushMs2.toFixed(2)} → ${now.push.pushMs2.toFixed(2)} m/s² · brake ${base.push.brakeMs2.toFixed(2)} → ${now.push.brakeMs2.toFixed(2)} m/s²` : '';
    const kitUp = el('button', { className: 'item lead kitup', type: 'button', onclick: () => onDone?.(codeOf(spec)) }, 'Kit up');
    body.replaceChildren(
      el('h2', { textContent: 'KIT' }),
      el('p', { className: 'sub', textContent: `One loadout for every sheet, your number two's the same. Reach shown at ${tier === 'private' ? 'the private' : tier}'s Weapon handling (${wh}). What you carry is felt in every push and brake.` }),
      el('div', { className: 'faces' }, ...FACES.map(col)),
      el('p', { className: `why${why ? ' on' : ''}`, textContent: why ?? '' }),
      el('div', { className: 'issues' }, ...issue),
      el('div', { className: 'presets' }, ...presets),
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
    const next = Object.fromEntries(FACES.map(x => [x, [...spec[x]]]));
    if (p) next[f][i] = p; else next[f].splice(i, 1);
    next[f] = next[f].filter(Boolean);
    const w = checkLoadout(next);
    if (w) why = `${cap(w)}.`; else { spec = next; why = null; }
    draw();
    body.querySelector(`button.place[data-face="${f}"][data-i="${i}"]`)?.focus();
  };
  body.addEventListener('keydown', (e) => {
    const m = /^(?:Digit|Numpad)([1-4])$/.exec(e.code ?? '');
    if (m) { e.preventDefault(); body.querySelectorAll('button.preset')[Number(m[1]) - 1]?.click(); return; }
    if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); onBack?.(); }
  });
  draw();
  return { body, get code() { return codeOf(spec); } };
}
// (a place's items' own mass, kg: the G-11's 0.38, its pouch apart)
const itemKg = (p) => (ISSUE[p]?.items ?? []).reduce((n, m) => n + (DEVICES[m]?.massKg ?? 0), 0);
const cap = (w) => String(w).charAt(0).toUpperCase() + String(w).slice(1);
