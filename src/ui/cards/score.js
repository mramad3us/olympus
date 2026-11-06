// OLYMPUS cards: the score card, the user's score of a test scene, and the line they paste back (ROADMAP §2.2).
//
// Each mechanic is first a playable test the user scores (CLAUDE.md; tradecraft's method). A test
// scene (src/data/scenes.js) names three aspects; the card scores each 0 to 100 in steps of 5, a ★
// for "join it as it is", and a free note, and "Copy my scores" puts one plain line on the clipboard
// for the user to paste into the chat (the gallery's "Copy my picks" applied to mechanics):
//   OLYMPUS v0.0.4 · test-shower · seed 48213 · splash 85 · vignette 70 · pace 60 · ★ no · note: …
// The note is the user's words as typed, on one line (a newline becomes a space); an empty one reads
// "note: none" (my call). Every score given is also kept in localStorage['olympus.scores'] on the
// origin where it was given, { v: 1, scores: [{ scene, version, seed, aspects: { splash: 85, … },
// star, note, atIso }] }, newest last, SCORES_MAX at most; a stored value that does not parse is
// started afresh rather than thrown on. scoreLine, readScores and keepScore are pure over a storage
// (the ui-scores test hands them a Map-backed one); scoreCard(…) is the DOM.

/** The storage key, and the most scores kept. */
export const SCORES_KEY = 'olympus.scores', SCORES_MAX = 200;
/** An aspect's score: 0 to 100 in steps of SCORE_STEP. */
export const SCORE_STEP = 5, SCORE_DEFAULT = 50;

/** A score snapped to the card's grid (0 to 100, steps of 5). */
export const snapScore = (v) => Math.max(0, Math.min(100, Math.round((Number(v) || 0) / SCORE_STEP) * SCORE_STEP));

/** The line to paste (ROADMAP §2.2's form). aspects: [[name, value]…] in the scene's order, or { name: value }. */
export function scoreLine({ version, scene, seed, aspects, star = false, note = '' }) {
  const list = Array.isArray(aspects) ? aspects : Object.entries(aspects ?? {});
  const said = String(note ?? '').replace(/\s+/g, ' ').trim();
  return [`OLYMPUS v${version}`, scene, `seed ${seed}`, ...list.map(([k, v]) => `${k} ${snapScore(v)}`), `★ ${star ? 'yes' : 'no'}`, `note: ${said || 'none'}`].join(' · ');
}

/** The scores kept on a storage (localStorage, or anything with getItem): { v: 1, scores: [] }. */
export function readScores(storage = globalThis.localStorage) {
  let raw = null;
  try { raw = storage?.getItem?.(SCORES_KEY) ?? null; } catch { raw = null; }
  if (!raw) return { v: 1, scores: [] };
  try {
    const o = JSON.parse(raw);
    return o && o.v === 1 && Array.isArray(o.scores) ? o : { v: 1, scores: [] };
  } catch { return { v: 1, scores: [] }; }
}

/** Keep a score (newest last, SCORES_MAX at most). Returns the record kept. now: an ISO time (tests give one). */
export function keepScore(storage = globalThis.localStorage, { scene, version, seed, aspects, star = false, note = '' }, { atIso = new Date().toISOString() } = {}) {
  const all = readScores(storage);
  const list = Array.isArray(aspects) ? aspects : Object.entries(aspects ?? {});
  const rec = { scene, version, seed, aspects: Object.fromEntries(list.map(([k, v]) => [k, snapScore(v)])), star: !!star, note: String(note ?? '').replace(/\s+/g, ' ').trim(), atIso };
  all.scores.push(rec);
  while (all.scores.length > SCORES_MAX) all.scores.shift();
  try { storage?.setItem?.(SCORES_KEY, JSON.stringify(all)); } catch { /* (no storage here: the line is still copied) */ }
  return rec;
}

/** The last score kept for a scene, or null. */
export function lastScore(storage, scene) {
  const all = readScores(storage).scores.filter(s => s.scene === scene);
  return all.length ? all[all.length - 1] : null;
}

/**
 * The card's body: { body, lines, read() }. scene: SCENES' record ({ id, title, aspects: [[name, about]…] });
 * version, seed; onCopy(text) → Promise<boolean>; onDone(); storage. Lines: 1 Copy my scores, 2 Done.
 */
export function scoreCard({ scene, version, seed, onCopy, onDone = null, storage = globalThis.localStorage }) {
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(globalThis.document.createElement(tag), props); n.append(...kids.filter(k => k !== null && k !== undefined)); return n; };
  const before = lastScore(storage, scene.id);
  const sliders = (scene.aspects ?? []).map(([name, about]) => {
    const v = before?.aspects?.[name] ?? SCORE_DEFAULT;
    const out = el('output', { className: 'score-out', textContent: String(v) });
    const input = el('input', { type: 'range', min: '0', max: '100', step: String(SCORE_STEP), value: String(v), className: 'score' });
    input.setAttribute('aria-label', name);
    input.dataset.aspect = name;
    input.addEventListener('input', () => { out.textContent = String(snapScore(input.value)); });
    return { name, input, row: el('label', { className: 'aspect' }, el('span', { className: 'name', textContent: name }), el('small', { textContent: about }), input, out) };
  });
  let star = !!before?.star;
  const starBtn = el('button', { className: `item star${star ? ' on' : ''}`, type: 'button', textContent: '' });
  const starText = () => { starBtn.textContent = star ? '★ join it as it is: yes' : '☆ join it as it is: no'; starBtn.classList.toggle('on', star); };
  starText();
  starBtn.onclick = () => { star = !star; starText(); };
  const note = el('textarea', { className: 'note-in', rows: 2, placeholder: 'A note (what to rework, what felt wrong)', value: '' });
  const read = () => ({ scene: scene.id, version, seed, aspects: sliders.map(s => [s.name, snapScore(s.input.value)]), star, note: note.value });
  const said = el('span', { className: 'copied', textContent: '' });
  const text = el('textarea', { className: 'benchtext score-line', readOnly: true, rows: 2, value: scoreLine(read()) });
  const refresh = () => { text.value = scoreLine(read()); };
  for (const s of sliders) s.input.addEventListener('input', refresh);
  note.addEventListener('input', refresh);
  starBtn.addEventListener('click', refresh);
  const copy = el('button', { className: 'item lead copy', type: 'button' }, el('kbd', { textContent: '1' }), 'Copy my scores');
  copy.onclick = async () => {
    const r = read(), line = scoreLine(r);
    keepScore(storage, r);
    text.value = line;
    const ok = await onCopy?.(line);
    said.textContent = ok ? 'Copied and kept: paste it into the conversation.' : 'Kept; the copy failed: select the line below.';
  };
  const done = el('button', { className: 'item', type: 'button', onclick: () => onDone?.() }, el('kbd', { textContent: '2' }), 'Done');
  // (a slider or the note with focus are fields the game's keys leave alone; Esc and the digits still close the card or pick its lines)
  for (const f of [...sliders.map(s => s.input), note]) {
    f.addEventListener('keydown', (e) => {
      if (e.code !== 'Escape' && !(/^(Digit|Numpad)[0-9]$/.test(e.code) && f.tagName !== 'TEXTAREA')) return;
      e.preventDefault(); f.blur();
      globalThis.dispatchEvent(new KeyboardEvent('keydown', { code: e.code, key: e.key, bubbles: true }));
    });
  }
  const body = el('div', { className: 'glass score' },
    el('h3', { textContent: `Score: ${scene.title}` }),
    el('div', { className: 'aspects' }, ...sliders.map(s => s.row)),
    starBtn, note,
    el('div', { className: 'glass-list' }, copy, done),
    said, text,
    el('p', { className: 'note', textContent: 'Each aspect 0 to 100. Under 60 it is reworked first; every aspect at 70 or a ★ and it joins the career as it is.' }));
  return { body, lines: [copy, done], read };
}
