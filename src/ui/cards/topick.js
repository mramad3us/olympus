// OLYMPUS ui: the Esc menu's To score page, the waiting samples tried live in play and scored (the build sheet v0.0.20 item 10; feel.md FL-2, user.md U-4, U-9).
//
// The samples wait on scores from the user, some since 2026-11-12: the walk ("Hard to tell without seeing it animated ... will
// judge when live"), the stack's figures S0 to S5, the helmets R1 to R4, E1 to E4, O1 to O3, and this round's shot and voices.
// Things that move are judged moving (DESIGN.md's log, 2026-11-12), so this page puts each set in the game behind the dimmed
// picture: a row a set, each candidate a button that applies at once, and on the candidate shown a score from 0 to 100 and a
// star, as the gallery takes them. The rows (ROWS):
//   Stack     S0 to S5, several joined (the sample's own words); S1 to S3 drawn on you and your #2 (helmets.js lookPicked), S4 and
//             S5 the stage's rules the gallery's page draws (struck here: "the gallery");
//   Helmet    R1 to R4 and E1 to E4 in the Corps' Mars trim on both of you, O1 to O3 on your #2 alone, so one is seen in the stack;
//   Walk      A, B, C (the walk cycle, VIEWS §3.10.4: main.js's settings.cycle, state.$cycle, never the save);
//   Shot      A0 to A4 (src/data/sounds.js SHOT_CANDIDATES; engine.js setShot); the Voice row (V-a to V-d) is gone from v0.0.23,
//             the user's "forget voice synthesis, no voices." (2026-11-19): no line is voiced;
//   Mark      the room's mark on the jamb, M1 a chalk X, M2 a chemlight (B's range-items.js jambMarks);
//   Corner aid  by rung, always, off (B's corner.js aidHoldMs: a setting, state.$aid, kept as olympus.cornerAid), not scored;
//   and v0.0.18's and v0.0.19's sets the game draws as built (wcard2, doll-gear, target-view, opfor-look), scored as seen;
//   v0.0.23 (the build sheet v0.0.23 §0 item 36): the target card's four this round judges moving, on the card as you engage:
//   Card gun G1 to G3 (portrait-gun: the gun in the board's ink, its own colours, the ink rimmed), Hands not read V1 and V2 (a man's
//   hands as the stage draws them, or veiled until your take-in reads them), Aimed A1 and A2 (end on, canted), Pistol aimed P1 and P2
//   (arms out, cupped at the chest): state.$look.card { gun, unread, aim, pistol }, read by the target view over portrait.js PORTRAIT_PICKS.
// The picks are runtime only (state.$look { stack, helm, jamb }, the shot, the voice, the walk), never saved, so a save replays
// byte for byte; they are this browser's in localStorage (TOPICK_KEY, every read and write in try and catch; the gallery's own
// olympus.picks is a list of its views, which the page's object would clobber on a shared origin, so the page keeps its own key:
// my call), and the URL's flags win (&look=, &shot=, &voice=, &cycle=: core/debug.js readParams). "Copy my picks" gives the
// gallery's text (its picksText: "★ id · set · candidate · n/100") with the scene, the seed and the version, to paste back;
// picksOf reads that text. With no flag every frame is the game's default (helmets.js HELMET_DRAWN_AS, STACK_DRAWN_AS empty).
// parseLook and lookText are pure; topickCard is the DOM builder, every change sent back through cb (main.js applies it).
import { HELM_IDS, HELMS, STACK_IDS, STACKS } from '../../art/figures/helmets.js';
import { SHOT_IDS } from '../../data/sounds.js';

/** The target card's picks this page tries (see the header): the row's id, the look's key, the candidates (portrait.js PORTRAIT_PICKS' defaults first). */
export const CARD_PICKS = Object.freeze([
  Object.freeze({ id: 'card.gun', key: 'gun', title: 'Card gun', ids: Object.freeze(['G1', 'G2', 'G3']) }),
  Object.freeze({ id: 'card.unread', key: 'unread', title: 'Hands not read', ids: Object.freeze(['V1', 'V2']) }),
  Object.freeze({ id: 'card.aim', key: 'aim', title: 'Aimed', ids: Object.freeze(['A1', 'A2']) }),
  Object.freeze({ id: 'card.pistol', key: 'pistol', title: 'Pistol aimed', ids: Object.freeze(['P1', 'P2']) }),
]);

/** This browser's picks (see the header). */
export const TOPICK_KEY = 'olympus.topick';
/** The corner aid's setting kept (U-9). */
export const CORNER_AID_KEY = 'olympus.cornerAid';
/** The room's mark's candidates (B's samples/marks). */
export const JAMB_IDS = Object.freeze(['M1', 'M2']);
/** The corner aid's settings (B's corner.js aidHoldMs). */
export const AID_SETTINGS = Object.freeze(['rung', 'always', 'off']);
/** The walk cycles (VIEWS §3.10.4). */
export const WALK_IDS = Object.freeze(['A', 'B', 'C']);
/** The rows (see the header): { id, title, ids, multi?, words (an id's words), struck? (an id the stage does not draw: why), scored (false: a setting) }. */
export const ROWS = Object.freeze([
  Object.freeze({ id: 'stack', title: 'The stack\'s figures', ids: STACK_IDS, multi: true, words: (id) => id, struck: (id) => (STACKS[id]?.page ? 'the gallery' : null) }),
  Object.freeze({ id: 'helm', title: 'Helmets', ids: HELM_IDS, words: (id) => id, about: (id) => HELMS[id]?.name ?? id }),
  Object.freeze({ id: 'walk', title: 'The walk', ids: WALK_IDS, words: (id) => id }),
  Object.freeze({ id: 'shot', title: 'The shot', ids: SHOT_IDS, words: (id) => id }),
  Object.freeze({ id: 'jamb', title: 'The room\'s mark', ids: JAMB_IDS, words: (id) => id }),
  ...CARD_PICKS.map(c => Object.freeze({ id: c.id, title: c.title, ids: c.ids, words: (id) => id, card: c.key })),
  Object.freeze({ id: 'aid', title: 'Corner aid', ids: AID_SETTINGS, words: (id) => ({ rung: 'by rung', always: 'always', off: 'off' }[id]), scored: false }),
  Object.freeze({ id: 'drawn', title: 'As the game draws them', ids: Object.freeze(['wcard2', 'doll-gear', 'target-view', 'opfor-look']), words: (id) => id, seen: true }),
]);

/**
 * The look's flags read (&look=stack:4+5,helm:r1,jamb:m2; cycle:B too): { look: { stack: [ids], helm, jamb }, cycle, unknown: [words] }.
 * A number names its stack ("4" is S4); ids by any case; an unknown flag or id is dropped and named, for the toast.
 */
export function parseLook(text) {
  const look = { stack: [], helm: null, jamb: null }, unknown = [];
  let cycle = null;
  for (const part of String(text ?? '').split(',').map(x => x.trim()).filter(Boolean)) {
    const [k, v = ''] = part.split(':').map(x => x.trim()), key = k.toLowerCase();
    if (key === 'stack') for (const x of v.split(/[+ ]/).filter(Boolean)) { const id = /^\d$/.test(x) ? `S${x}` : x.toUpperCase(); if (STACK_IDS.includes(id) && !look.stack.includes(id)) look.stack.push(id); else unknown.push(`stack:${x}`); }
    else if (key === 'helm') { const id = v.toUpperCase(); if (HELM_IDS.includes(id)) look.helm = id; else unknown.push(part); }
    else if (key === 'jamb') { const id = v.toUpperCase(); if (JAMB_IDS.includes(id)) look.jamb = id.toLowerCase(); else unknown.push(part); }
    else if (key === 'cycle') { const id = v.toUpperCase(); if (WALK_IDS.includes(id)) cycle = id; else unknown.push(part); }
    else if (CARD_PICKS.some(c => c.key === key)) { const c = CARD_PICKS.find(x => x.key === key), id = v.toUpperCase(); if (c.ids.includes(id)) look.card = { ...(look.card ?? {}), [key]: id }; else unknown.push(part); }
    else unknown.push(part);
  }
  return { look, cycle, unknown };
}
/** A look's flags as the URL writes them ('' for none): the inverse of parseLook. */
export function lookText(look) {
  const bits = [];
  if (look?.stack?.length) bits.push(`stack:${look.stack.map(id => id.replace(/^S/, '')).join('+')}`);
  if (look?.helm) bits.push(`helm:${String(look.helm).toLowerCase()}`);
  if (look?.jamb) bits.push(`jamb:${String(look.jamb).toLowerCase()}`);
  for (const c of CARD_PICKS) if (look?.card?.[c.key]) bits.push(`${c.key}:${String(look.card[c.key]).toLowerCase()}`);
  return bits.join(',');
}
/** Whether a look picks anything. */
export const lookSet = (look) => !!(look?.stack?.length || look?.helm || look?.jamb || (look?.card && Object.keys(look.card).length));

/** This browser's picks ({ v: 1, scores: { 'row:id': n }, stars: ['row:id'], flags: { look, shot, voice, walk } }), or a fresh record. */
export function readPicks(storage = globalThis.localStorage) {
  try { const o = JSON.parse(storage?.getItem(TOPICK_KEY) ?? 'null'); if (o?.v === 1) return { v: 1, scores: o.scores ?? {}, stars: o.stars ?? [], flags: o.flags ?? {} }; } catch { /* (a private window, a damaged record: a fresh one) */ }
  return { v: 1, scores: {}, stars: [], flags: {} };
}
/** This browser's picks written (nothing on a failure: a private window keeps them for the session). */
export function writePicks(p, storage = globalThis.localStorage) { try { storage?.setItem(TOPICK_KEY, JSON.stringify(p)); return true; } catch { return false; } }

/**
 * "Copy my picks" (see the header): the gallery's text, its first line naming the play (scene, seed, version), then a line a scored
 * or starred candidate: "★ S1 · The stack's figures · S1 · 80/100", '-' where not starred.
 */
export function picksText(p, { scene = '?', seed = '?', version = '?', flags = '' } = {}) {
  const lines = [`OLYMPUS in play, my picks (v${version}, ${scene} on seed ${seed}${flags ? `, ${flags}` : ''}):`];
  const keys = [...new Set([...Object.keys(p.scores ?? {}), ...(p.stars ?? [])])];
  if (!keys.length) return 'No picks yet.';
  for (const k of keys) {
    const [rowId, id] = k.split(':'), row = ROWS.find(r => r.id === rowId);
    if (!row) continue;
    const s = p.scores?.[k];
    lines.push(`${(p.stars ?? []).includes(k) ? '★' : '-'} ${row.words(id)} · ${row.title} · ${row.about?.(id) ?? row.words(id)}${Number.isFinite(s) ? ` · ${s}/100` : ''}`);
  }
  return lines.join('\n');
}
/** The text read back: { head, picks: [{ star, id, set, name, score }] } (the gallery's line form). */
export function picksOf(text) {
  const out = { head: null, picks: [] };
  for (const line of String(text ?? '').split('\n')) {
    if (/^OLYMPUS /.test(line)) { out.head = line; continue; }
    const m = /^([★-]) (.+?) · (.+?) · (.+?)(?: · (\d+)\/100)?$/.exec(line.trim());
    if (m) out.picks.push({ star: m[1] === '★', id: m[2], set: m[3], name: m[4], score: m[5] === undefined ? null : Number(m[5]) });
  }
  return out;
}

/**
 * The page (see the header): { body, lines }. now: { look, shot, voice, walk, aid } as played; picks: readPicks's; cb: { apply(rowId,
 * value) (the row's choice, applied by main.js at once), save(picks), copy(text), back() }; play: { scene, seed, version }.
 */
export function topickCard({ now, picks, cb, play = {} }) {
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(document.createElement(tag), props); n.append(...kids.filter(k => k !== null && k !== undefined)); return n; };
  const P = { v: 1, scores: { ...(picks?.scores ?? {}) }, stars: [...(picks?.stars ?? [])], flags: { ...(picks?.flags ?? {}) } };
  const state = { stack: [...(now.look?.stack ?? [])], helm: now.look?.helm ?? null, walk: now.walk ?? 'B', shot: now.shot ?? null, voice: now.voice ?? null, jamb: (now.look?.jamb ?? 'm1').toUpperCase(), aid: now.aid ?? 'rung', drawn: 'wcard2',
    ...Object.fromEntries(CARD_PICKS.map(c => [c.id, now.look?.card?.[c.key] ?? c.ids[0]])) };
  const shownOf = (row) => (row.multi ? state.stack.at(-1) ?? 'S0' : state[row.id]);
  const rowsEl = el('div', { className: 'topick-rows' }), note = el('p', { className: 'note' });
  const lines = [];
  function draw() {
    rowsEl.replaceChildren(...ROWS.map(row => {
      const on = (id) => (row.multi ? state.stack.includes(id) : state[row.id] === id);
      const chips = row.ids.map(id => {
        const why = row.struck?.(id) ?? null;
        const b = el('button', { type: 'button', className: `chip${on(id) ? ' on' : ''}${why ? ' struck' : ''}`, title: row.about?.(id) ?? '', textContent: row.words(id) + (why ? ` (${why})` : '') });
        b.onclick = () => {
          if (row.multi) { state.stack = id === 'S0' ? [] : on(id) ? state.stack.filter(x => x !== id) : [...state.stack, id]; cb.apply?.('stack', [...state.stack]); }
          else if (row.id === 'helm') { state.helm = state.helm === id ? null : id; cb.apply?.('helm', state.helm); }
          else { state[row.id] = id; if (!row.seen) cb.apply?.(row.id, row.id === 'jamb' ? id.toLowerCase() : id); }
          draw();
        };
        return b;
      });
      const shown = shownOf(row), key = shown ? `${row.id}:${shown}` : null;
      let scoreEl = null;
      if (row.scored !== false && key) {
        const v = P.scores[key], out = el('output', { textContent: Number.isFinite(v) ? `${v}` : '–' });
        const slider = el('input', { type: 'range', min: '0', max: '100', step: '5', value: String(Number.isFinite(v) ? v : 50) });
        slider.setAttribute('aria-label', `Score ${row.words(shown)}`);
        slider.addEventListener('input', () => { P.scores[key] = Number(slider.value); out.textContent = slider.value; cb.save?.(P); });
        const star = el('button', { type: 'button', className: `star${P.stars.includes(key) ? ' on' : ''}`, textContent: '★' });
        star.onclick = () => { P.stars = P.stars.includes(key) ? P.stars.filter(x => x !== key) : [...P.stars, key]; cb.save?.(P); draw(); };
        scoreEl = el('span', { className: 'score' }, el('small', { textContent: row.words(shown) }), slider, out, star);
      }
      return el('div', { className: 'topick-row' }, el('span', { className: 'title', textContent: row.title }), el('span', { className: 'chips' }, ...chips), scoreEl);
    }));
  }
  draw();
  const copy = el('button', { type: 'button', className: 'item lead', textContent: 'Copy my picks' });
  copy.onclick = () => { const t = picksText(P, { ...play, flags: lookText({ stack: state.stack, helm: state.helm, jamb: state.jamb.toLowerCase(), card: Object.fromEntries(CARD_PICKS.filter(c => state[c.id] !== c.ids[0]).map(c => [c.key, state[c.id]])) }) }); cb.copy?.(t); note.textContent = t === 'No picks yet.' ? t : 'Copied: paste them back in the chat.'; };
  const back = el('button', { type: 'button', className: 'item', textContent: 'Back' });
  back.onclick = () => cb.back?.();
  lines.push(copy, back);
  const body = el('div', { className: 'glass menu topick' },
    el('h3', { textContent: 'To score' }),
    el('p', { className: 'note', textContent: 'Each set applies at once, behind this page. Score what is shown from 0 to 100, star what you would keep; Copy my picks gives the text to paste back. Nothing changes the game\'s defaults until you pick.' }),
    rowsEl, el('div', { className: 'glass-list' }, copy, back), note);
  return { body, lines, state, picks: P };
}
