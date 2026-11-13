// OLYMPUS sim: the step panel by groups, VIEWS §7.8's model built once, and its three layouts' keys (COMBAT §25.19.7; the shoot house's rework, R7).
//
// The user's note on v0.0.12 (2026-11-11): "I spend my time either tapping "T", or cycling through endless, seemingly
// unorganized options with "0" until I find what I'm looking for ... we need to find a way to group them by type and find a
// clever way to make this manageable with top of the head core gameplay options being always visible and accessible (even if
// grayed out, like hammer if you only have one bullet)." So every row stepsOf offers gets a fixed group and slot:
//   FIRE   1 Pair, 2 Hammer, 3 Triple, 4 Failure drill, 5 To the head, 6 Fire, 7 Aim ⇄ Hold ("Hold him" folded in), 8 Breathe,
//          9 The line ▸ (the KD line's rows: the dial, the dope, the holds, the flags, the lever, the pits' acts)
//   DRILL  outside a door: 1 Stack up, 2 Stack up, take point, 3 Open, 4 Kick door, 5 Breach, 6 Flash, then in, 7 Enter (its
//          reach by rung), 8 Read the door, 9 Hold it; inside a room: 1 Watch your corner, 2 To your point (Dominate), 3 "Clear!",
//          4 Go long, 5 Mark the room, 6 Coming out, 7 To the next door, 8 Hold it (an inner door), 9 Clear it (an inner door)
//   GUN    1 Reload by purpose, 2 Gun down, 3 Transition: pistol (Rifle up), 4 Off the line, 5 Safe ⇄ Off safe, 6 Finger,
//          7 Check: press ⇄ magazine, 8 the tower's command ◉, 9 Hands ▸ (the admin singles, never chosen on the lane)
//   BODY   1 High ready, 2 Careful ⇄ Fast, 3 Kneel ⇄ Stand, 4 Prone, 5 To cover, 6 Stop here, 7 Wait, 8 Sling it ⇄ Relaxed, 9 Low
//          ready (my call: stepsOf offers both postures from Relaxed, so each keeps a slot; the core's muzzle is the toggle)
//   TEAM   1 Cover me (Cover his sector), 6 Challenge, 7 Engage: armed, my sector (the standing order; my call: the design's
//          table has no slot for it and Short room is not built), the rest not built yet (empty, their numbers kept)
// A slot holds a list of candidates (the reloads by purpose, the drill's entries by reach): it shows T's row where T names one
// of them, else the first live, else the first; the rest, and every row no slot takes, go to the group's third level ("▸",
// on 9 in FIRE and GUN, on 0 in the others), so nothing stepsOf offers is ever out of reach. DRILL's two halves are chosen by
// where you stand, read from the rows themselves (T's row's half first; a live stack or door row and nothing of the room's
// own live: outside).
//
// The core five, each on a fixed key in every layout: the shot (Pair at a contact in layout A, else Fire), Aim ⇄ Hold, Fix
// (the remedy for the gun's state, panel.js remedyOf: Off safe, IMMEDIATE ACTION, MAKE READY, Press check, RELOAD; with
// nothing to fix, the reload by purpose), the muzzle (Low ⇄ High ready) and NEXT, T's act (T is never the only way).
// Greyed, never removed: a struck row keeps its slot with a badge, badgeOf(off): an arrow and the remedy's key where the panel
// has one (→ the aim, → Fix), a round's count (▮1), a gate (MKS 18), a rung (▲▲ 3), "by hand first" (✋), not issued (a struck
// silhouette), locked (a padlock), nothing to act on (a struck eye), already so (✓); else its words.
//
// The situation (layout C's five on 1 to 5): STOPPAGE, CONTACT, THE TOWER, THE KD LINE, AN INNER DOOR, IN THE ROOM, AT THE
// DOOR, THE LINE, by the rows (situationOf). The layouts (viewOf, keyPathOf):
//   a  "Home and drawers": the core on 1 to 5, the groups as drawers on 6 FIRE, 7 DRILL, 8 GUN, 9 BODY, 0 TEAM; FIRE opens by
//      itself at a contact's pause (not with a stoppage); a drawer's slots on 1 to 9, its own digit again or Esc home
//   b  "The fixed ten and the letter banks": the shots on 1 to 5, the core on 6 to 0, the banks on R (DRILL), C (GUN; its 0
//      FIRE's map: Breathe and the line), B (BODY) and F (TEAM), physical keys, so the same on AZERTY
//   c  "Five that follow the situation" (the default until the user scores P1 to P3): the five on 1 to 5, the core on 6 to 0,
//      Tab held the fan: a digit the group, a second the row
// keyPathOf(model, layout, id) is the keys a row is on (['4'], ['Tab', '2', '4'], ['R', '3']), the DI's words keyText of it,
// "Kick door: 4", "Go long: Tab › 2 › 4"; nothing here reads the DOM. The layout the player chose rides the state as a
// runtime key (state.$panel, never saved: main.js sets it from &panel= or olympus.panel), read by layoutIn. Pure.
import { isShotRow, remedyOf } from './panel.js';

/** The layouts, and the one played until the user scores P1 to P3 (VIEWS §7.8.4: the designer's lean, my call). */
export const LAYOUTS = Object.freeze(['a', 'b', 'c']);
export const DEFAULT_LAYOUT = 'c';
/** A layout from a word ('A', 'c', null), the default where it names none. */
export const layoutOfWord = (w) => (LAYOUTS.includes(String(w ?? '').toLowerCase()) ? String(w).toLowerCase() : DEFAULT_LAYOUT);
/** The layout the player plays (the runtime key main.js sets; node's tests: the default). */
export const layoutIn = (state) => layoutOfWord(state?.$panel);
/** The groups, in the fan's and the drawers' order. */
export const GROUPS = Object.freeze(['FIRE', 'DRILL', 'GUN', 'BODY', 'TEAM']);
/** The group's words where the panel names it. */
export const GROUP_WORDS = Object.freeze({ FIRE: 'FIRE', DRILL: 'DRILL', GUN: 'GUN', BODY: 'BODY', TEAM: 'TEAM' });
/** The core five, in their keys' order. */
export const CORE = Object.freeze(['shot', 'aim', 'fix', 'muzzle', 'next']);
/** The core's words on its tiles. */
export const CORE_WORDS = Object.freeze({ shot: 'SHOT', aim: 'AIM', fix: 'FIX', muzzle: 'MUZZLE', next: 'NEXT' });
/** The digits a band is keyed by, in order. */
export const DIGITS = Object.freeze(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']);
/** Layout A's drawers on 6 to 0, layout B's banks by physical code (their labels the same on AZERTY and QWERTY). */
export const DRAWER_KEYS = Object.freeze({ FIRE: '6', DRILL: '7', GUN: '8', BODY: '9', TEAM: '0' });
export const BANK_CODES = Object.freeze({ KeyR: 'DRILL', KeyC: 'GUN', KeyB: 'BODY', KeyF: 'TEAM' });
export const BANK_KEYS = Object.freeze({ DRILL: 'R', GUN: 'C', BODY: 'B', TEAM: 'F' });
/** The fan's key (held). */
export const FAN_KEY = 'Tab';
/** The third level's key in a group's map: 9 where the slot is the group's own ▸ (FIRE's line, GUN's hands), else 0. */
export const DEEP_KEY = Object.freeze({ FIRE: '9', DRILL: '0', GUN: '9', BODY: '0', TEAM: '0' });
/** A third level's rows a page (its 0 pages past nine, where 0 is not the way in). */
export const DEEP_PAGE = 9;

const is = (re) => (s) => re.test(String(s?.id ?? ''));
const id = (x) => (s) => s?.id === x;
const LINE_RE = /^(sight:|optic:|read$|hold:|wait:mark|kd:|police|confirm)/;
const ROOM_RE = /^(watch:|look:|call:clear|mark$|move:)/;
const OUT_RE = /^(drill:stack:|door:(push|pull|kick|read)|drill:door:|drill:room:(in|clear)(@|>|$))/;
const lineRow = (s) => LINE_RE.test(String(s?.id ?? '')) || (!!s?.act && s?.kind !== 'shot');

/**
 * The fixed maps: a group's slots 1 to 9, each its candidates (predicates on a row) and the words it keeps when no row is
 * there. DRILL has two halves. A slot whose words end "▸" is the group's third level.
 */
export const MAPS = Object.freeze({
  FIRE: [null,
    { words: 'Pair', c: [is(/^shot:pair(@|$)/)] }, { words: 'Hammer', c: [is(/^shot:hammer(@|$)/)] }, { words: 'Triple', c: [is(/^shot:triple(@|$)/)] },
    { words: 'Failure drill', c: [is(/^shot:failure(@|$)/)] }, { words: 'To the head', c: [is(/^shot:head(@|$)/)] }, { words: 'Fire', c: [id('fire')] },
    { words: 'Aim ⇄ Hold', c: [(s) => s?.id === 'contact:hold' && !!s.lead && !s.off, (s) => s?.kind === 'aim', id('hold'), id('contact:hold')] }, { words: 'Breathe', c: [is(/^breathe/)] },
    { words: 'The line ▸', deep: true, c: [] }],
  DRILL_OUT: [null,
    { words: 'Stack up', c: [is(/^drill:stack:up(@|>|$)/)] }, { words: 'Stack up, take point', c: [is(/^drill:stack:point(@|>|$)/)] },
    { words: 'Open', c: [is(/^door:(push|pull)>/)] }, { words: 'Kick door', c: [is(/^door:kick>/)] }, { words: 'Breach', c: [is(/^drill:door:breach(@|>|$)/)] },
    { words: 'Flash, then in', c: [is(/^drill:door:flash/)], stand: { off: 'not issued' } },
    { words: 'Enter', c: [id('drill:carry'), is(/^drill:room:clear(@|>|$)/), is(/^drill:room:dominate(@|>|$)/), is(/^drill:room:in(@|>|$)/)] },
    { words: 'Read the door', c: [is(/^door:read>/)] }, { words: 'Hold it', c: [is(/^door:hold>/)] }],
  DRILL_IN: [null,
    { words: 'Watch your corner', c: [is(/^watch:/), is(/^look:/)], cycle: true }, { words: 'To your point', c: [id('drill:carry'), is(/^drill:room:dominate(@|>|$)/), id('move:point')] },
    { words: '"Clear!"', c: [id('call:clear')] }, { words: 'Go long', c: [is(/^move:far/)] }, { words: 'Mark the room', c: [id('mark')] },
    { words: 'Coming out', c: [is(/^call:out/)] }, { words: 'To the next door', c: [is(/^drill:stack:up(@|>|$)/), is(/^drill:stack:point(@|>|$)/), is(/^move:(hallEnd|next)/)] },
    { words: 'Hold it', c: [is(/^door:hold>/)] }, { words: 'Clear it', c: [is(/^door:(push|pull|kick)>/), is(/^drill:room:(in|clear)(@|>|$)/)] }],
  GUN: [null,
    { words: 'Reload', c: [(s) => /^macro:reload:/.test(s?.id ?? '') && !!s.first && !s.off, id('macro:reload:speed'), id('macro:reload:tactical'), id('macro:reload:retain')] },
    { words: 'Gun down', c: [id('weapon:gun-down')] }, { words: 'Transition: pistol', c: [id('weapon:transition'), id('weapon:rifle-up')] },
    { words: 'Off the line', c: [id('weapon:offline')] }, { words: 'Safe ⇄ Off safe', c: [is(/^selector:/)] }, { words: 'Finger off ⇄ on', c: [id('finger')] },
    { words: 'Check: press ⇄ magazine', c: [id('pressCheck'), id('magCheck')] },
    { words: "The tower's command", c: [id('queue'), (s) => s?.kind === 'command' && !!s.cmd, (s) => s?.kind === 'command' && /^macro:(load|ready|unload|clear|cease|safe)$/.test(s.id)] },
    { words: 'Hands ▸', deep: true, c: [] }],
  BODY: [null,
    { words: 'High ready', c: [id('posture:highReady')] }, { words: 'Careful ⇄ Fast', c: [id('drill:variant:stance'), is(/^gait:(combat|assault)$/)] },
    { words: 'Kneel ⇄ Stand', c: [id('stance:kneel'), id('stance:stand')] }, { words: 'Prone', c: [id('stance:prone')] }, { words: 'To cover', c: [is(/^move:cover/)] },
    { words: 'Stop here', c: [id('drill:variant:feet')] }, { words: 'Wait', c: [id('wait')] }, { words: 'Sling it ⇄ Relaxed', c: [id('stow'), id('gait:relaxed')] },
    { words: 'Low ready', c: [id('posture:lowReady')] }],
  TEAM: [null,
    { words: 'Cover me', c: [id('team:cover')] }, null, null, null, null,
    { words: 'Challenge', c: [id('contact:challenge')] }, { words: 'Engage: armed, my sector', c: [id('drill:variant:engage')] }, null, null],
});
/** The group a row no slot takes goes to (its third level), by its kind. */
const OVERFLOW_OF = (s) => (isShotRow(s) || s?.kind === 'fire' || lineRow(s) ? 'FIRE'
  : ['door', 'bundle', 'watch', 'look', 'move', 'mark', 'call', 'variant'].includes(s?.kind) || /^drill:/.test(s?.id ?? '') ? 'DRILL'
    : ['stance', 'posture', 'gait', 'wait'].includes(s?.kind) ? 'BODY' : s?.kind === 'contact' ? 'TEAM' : 'GUN');
/** Rows the panel never draws: their keys are their own (X, the keys' strip), and T's act names them by those keys. */
const KEYED = Object.freeze({ leave: 'X' });

/** The situations (layout C's five on 1 to 5), first to last in precedence, each its five as [group, slot] or a row id. */
export const SITUATIONS = Object.freeze({
  stoppage: { name: 'STOPPAGE', five: [['GUN', 2], ['GUN', 3], ['GUN', 4], { id: 'macro:remedial', words: 'REMEDIAL' }, ['TEAM', 1]] },
  contact: { name: 'CONTACT', five: [['FIRE', 1], ['FIRE', 2], ['FIRE', 4], ['FIRE', 5], ['TEAM', 6]] },
  tower: { name: 'THE TOWER', five: [{ id: 'macro:load', words: 'LOAD' }, { id: 'macro:ready', words: 'MAKE READY' }, { id: 'macro:unload', words: 'UNLOAD' }, { id: 'macro:clear', words: 'SHOW CLEAR' }, { id: ['macro:cease', 'macro:safe'], words: 'Stop' }] },
  // (THE KD LINE's five: Wait (for your mark) on 4 in place of the design's lever (my call: the audit's 18 Waits and 4 Waits for
  // the mark on the KD course against 2 lever presses; the lever stays in FIRE's line ▸))
  kd: { name: 'THE KD LINE', five: [{ re: /^hold:(read|call|centre)$/, words: 'Hold ⇄ the call' }, { id: 'sight:call', words: 'Dial the call' }, { re: /^sight:dope:/, words: 'Dope for the line' }, { id: ['wait:mark', 'wait'], words: 'Wait' }, ['FIRE', 8]] },
  inner: { name: 'AN INNER DOOR', half: 'in', five: [['DRILL', 8], ['DRILL', 9], ['DRILL', 1], ['DRILL', 3], ['DRILL', 6]] },
  room: { name: 'IN THE ROOM', half: 'in', five: [['DRILL', 1], ['DRILL', 2], ['DRILL', 3], ['DRILL', 6], ['DRILL', 7]] },
  // (AT THE DOOR's five: Stack up, take point, Open, Enter, Kick door, in place of the design's Breach on 5 (my call: R4's catalogue
  // made the entry with its reach the door's own row, "Open, in: your corner" and "Open, clear the room", 27 of the honest bot's
  // 54 door stops; Breach is struck in this lane, "no charge issued", and stays on DRILL 5 in the fan))
  door: { name: 'AT THE DOOR', half: 'out', five: [['DRILL', 1], ['DRILL', 2], ['DRILL', 3], ['DRILL', 7], ['DRILL', 4]] },
  // (THE LINE's five: Wait on 4 in place of the design's Prone (my call: Wait, "for the turn", "for the coach", "for the instructor",
  // is T's act on the line and before GO many times more than Prone; Prone keeps BODY 4 in the fan))
  line: { name: 'THE LINE', five: [['GUN', 1], ['GUN', 7], ['BODY', 3], ['BODY', 7], ['FIRE', 8]] },
});

/**
 * A struck row's badge from its reason (VIEWS §7.8.1's table): { t: 'to', ref: 'aim' | 'fix' } (an arrow and the remedy's key),
 * { t: 'rounds', n }, { t: 'gate', text: 'MKS 18' }, { t: 'rung', n }, { t: 'hand' } (by hand first), { t: 'issue' } (not
 * issued, its silhouette struck), { t: 'lock' }, { t: 'none' } (nothing to act on), { t: 'done' } (already so), else
 * { t: 'note', text } (its words), or null for a live row.
 */
export function badgeOf(off) {
  if (!off) return null;
  const w = String(off);
  if (/^aim first$|^plant first$/.test(w)) return { t: 'to', ref: 'aim' };
  if (/off safe first|^on safe$|^a stoppage$|charge first|^chamber (empty|unknown)$|RELOAD first|^on auto$/.test(w)) return { t: 'to', ref: 'fix' };
  let x = /^(one|two|three|four|\d+) left$/.exec(w);
  if (x) return { t: 'rounds', n: { one: 1, two: 2, three: 3, four: 4 }[x[1]] ?? Number(x[1]) };
  x = /^Marksmanship (\d+)$/.exec(w);
  if (x) return { t: 'gate', text: `MKS ${x[1]}` };
  x = /^rung (\d+)$/.exec(w);
  if (x) return { t: 'rung', n: Number(x[1]) };
  if (/by hand first/.test(w)) return { t: 'hand' };
  if (/not issued/.test(w)) return { t: 'issue' };
  if (/locked/.test(w)) return { t: 'lock' };
  if (/^nothing|no one|nothing to|^he is down$/.test(w)) return { t: 'none' };
  if (/^(held|watching|steady|already)/.test(w)) return { t: 'done' };
  return { t: 'note', text: w };
}

// (the first candidate row of a slot: T's where T names one of them, else the first live, else the first; the rest stay apart)
// (a cycling slot (the one Watch row: VIEWS §7.8.1) shows its pick'th live candidate of the first kind, Q and D stepping it)
function fill(slot, pool, actId, pick = 0) {
  if (!slot) return { row: null, rest: [] };
  const all = [];
  for (const c of slot.c) for (const s of pool) if (c(s) && !all.includes(s)) all.push(s);
  const live = slot.cycle ? all.filter(s => !s.off && slot.c[0](s)) : [];
  const turn = live.length > 1 && pick ? live[((pick % live.length) + live.length) % live.length] : null;
  const row = all.find(s => s.id === actId) ?? turn ?? all.find(s => !s.off) ?? all[0] ?? null;
  return { row, rest: all.filter(s => s !== row) };
}
// (DRILL's half: T's row's where it is one of a half's, else outside where a stack, door or breach row is live and nothing of the room's own)
function halfOf(steps, actId) {
  const act = actId ? steps.find(s => s.id === actId) : null;
  if (act && OUT_RE.test(act.id)) return 'out';
  if (act && ROOM_RE.test(act.id)) return 'in';
  const liveOut = steps.some(s => OUT_RE.test(s.id) && !s.off), anyIn = steps.some(s => ROOM_RE.test(s.id)), liveIn = steps.some(s => ROOM_RE.test(s.id) && !s.off && !/^(look|watch):/.test(s.id));
  if (liveOut && !liveIn) return 'out';
  if (anyIn) return 'in';
  return steps.some(s => OUT_RE.test(s.id) || /^drill:/.test(s.id)) ? 'out' : null;
}
/** The id T's act names on the panel ('stop:door:push>d1' → 'door:push>d1'), or null. */
export const actRowId = (act) => (typeof act === 'string' && act.startsWith('stop:') ? act.slice(5) : null);

/**
 * The model of a stop's rows (stepsOf), built once and laid out by every layout: { groups: { FIRE: { slots: [null, entry×9],
 * deep: [row…] }, … }, half ('out' | 'in' | null), core: { shot, aim, fix, muzzle, next }, situation: { id, name, five:
 * [entry×5] }, rows (all), act }. An entry: { group, slot, words, row (the step, or null: an empty slot), badge, deep (a ▸),
 * stand (a stand-in row, greyed with its reason: Flash, Transition) }. ctx: { act (T's act now, 'stop:…'), actLabel (its words
 * where it is not a row), watch (the one Watch row's step through the live hot spots: Q and D with nobody in sight) }.
 */
export function modelOf(steps = [], { act = null, actLabel = null, watch = 0 } = {}) {
  const rows = (steps ?? []).filter(s => s && s.kind !== 'gated' && !KEYED[s.id]);
  const actId0 = actRowId(act), actRow = actId0 ? rows.find(s => s.id === actId0) ?? rows.find(s => s.id === actId0.split('>')[0]) ?? null : null;
  const actId = actRow?.id ?? null;
  const half = halfOf(rows, actId), house = half !== null;
  const taken = new Set(), groups = {};
  for (const g of GROUPS) {
    const map = g === 'DRILL' ? (half === 'in' ? MAPS.DRILL_IN : MAPS.DRILL_OUT) : MAPS[g];
    const slots = [null], deep = [];
    for (let k = 1; k <= 9; k++) {
      const sl = map[k];
      if (!sl) { slots.push({ group: g, slot: k, words: null, row: null, badge: null }); continue; }
      if (sl.deep) { slots.push({ group: g, slot: k, words: sl.words, row: null, badge: null, deep: true }); continue; }
      const { row } = fill(sl, rows.filter(s => !taken.has(s)), actId, watch);
      if (row) taken.add(row);
      // (a stand-in greyed with its reason where the house could offer the row and stepsOf does not: Flash, not issued)
      const stand = !row && sl.stand && g === 'DRILL' && house && half === 'out' ? { id: `stand:${g}:${k}`, kind: 'stand', label: sl.words, off: sl.stand.off } : null;
      const r = row ?? stand;
      slots.push({ group: g, slot: k, words: sl.words, row: r, badge: badgeOf(r?.off), stand: !!stand });
    }
    groups[g] = { slots, deep };
  }
  // (the stand-in Transition below the Sergeant: the house's card names it "not issued", so the slot says the same)
  const gun3 = groups.GUN.slots[3];
  if (!gun3.row && house && rows.some(s => s.id === 'weapon:gun-down' || s.id === 'weapon:offline')) { gun3.row = { id: 'stand:GUN:3', kind: 'stand', label: 'Transition: pistol', off: 'not issued' }; gun3.badge = badgeOf('not issued'); gun3.stand = true; }
  // (the third levels: every row no slot took, by its group, in stepsOf's order)
  for (const s of rows) if (!taken.has(s)) groups[OVERFLOW_OF(s)].deep.push(s);
  for (const g of GROUPS) {
    const dk = DEEP_KEY[g], n = groups[g].deep.length;
    if (dk === '9') { const e = groups[g].slots[9]; e.count = n; if (!n) { e.badge = { t: 'none' }; e.empty = true; } }
  }
  const at = (g, k) => groups[g]?.slots[k] ?? null;
  // (the core five)
  // (the muzzle: the toggle, the one offered; from Relaxed (both offered) High ready in the house (the close-quarters carry), Low
  // ready on a line (the range's carry))
  const hi = at('BODY', 1), lo = at('BODY', 9), live = (e) => !!e?.row && !e.row.off;
  const muzzle = live(hi) && live(lo) ? (house ? hi : lo) : live(hi) ? hi : live(lo) ? lo : hi?.row ? hi : lo;
  const fire = at('FIRE', 6), pair = at('FIRE', 1), aimE = at('FIRE', 7), reload = at('GUN', 1);
  const fixRow = fixOf(rows, reload?.row ?? null);
  const nextRow = actRow ?? null;
  const core = {
    shot: { core: 'shot', ...(fire ?? {}), pairShot: pair?.row && !pair.row.off ? pair : null },
    aim: { core: 'aim', ...(aimE ?? {}) },
    // (nothing to fix: ✓ where the gun is as it should be; a struck eye where a shot is struck for the gun's state and nothing that
    // lifts it is offered now (the string's end, one magazine a string: the tower's next command is the way on))
    fix: fixRow ? { core: 'fix', group: null, slot: null, words: 'Fix', row: fixRow, badge: badgeOf(fixRow.off) }
      : gunStruck(rows) ? { core: 'fix', words: 'Fix', row: { id: 'core:fix', kind: 'stand', label: 'Fix', off: 'nothing offered now' }, badge: { t: 'none' }, stand: true }
        : { core: 'fix', words: 'Fix', row: { id: 'core:fix', kind: 'stand', label: 'Nothing to fix', off: 'already so' }, badge: { t: 'done' }, stand: true },
    muzzle: { core: 'muzzle', ...(muzzle ?? {}) },
    next: { core: 'next', words: 'NEXT', row: nextRow, act, actLabel: actLabel ?? nextRow?.label ?? null, badge: act ? null : { t: 'none' }, live: !!act },
  };
  const sit = situationOf(rows, { half, groups, act: actRow });
  return { groups, half, core, situation: sit, rows, act, actId };
}
/** The reasons a shot or Fire is struck for the gun's state (the ones Fix answers). */
export const GUN_STATE_RE = /off safe first|^on safe$|^a stoppage$|^chamber (empty|unknown)$|RELOAD first/;
/** Whether a shot or Fire is struck for the gun's state. */
export const gunStruck = (rows) => rows.some(s => (s.id === 'fire' || isShotRow(s)) && GUN_STATE_RE.test(String(s.off ?? '')));
/** The core's Fix: the remedy for the gun's state (a struck shot's or Fire's reason, panel.js remedyOf), IMMEDIATE ACTION, else the reload by purpose. */
export function fixOf(rows, reload = null) {
  for (const s of rows) if ((s.id === 'fire' || isShotRow(s)) && s.off) { const r = remedyOf(rows, s.off); if (r) return r; }
  const ia = rows.find(s => (s.id === 'macro:ia' || s.id === 'macro:remedial') && !s.off);
  if (ia) return ia;
  // (on safe with a rifle to fire: Off safe (Off safe is offered only on safe))
  const sel = rows.find(s => s.id === 'selector:semi' && !s.off);
  if (sel && rows.some(s => s.id === 'fire')) return sel;
  return reload && !reload.off ? reload : null;
}
/** The situation now, by the rows (see the header): { id, name, five: [entry×5] }. */
export function situationOf(rows, { half = null, groups = null, act = null } = {}) {
  const has = (re) => rows.some(s => re.test(String(s.id)));
  // (the pistol out (Rifle up offered) is the stoppage's still, its five holding Rifle up on 2, unless a shot row is live on a
  // man up: then CONTACT's five, the pistol's shots on 1 to 5 and Rifle up in the fan (the design and play reviews of
  // 2026-11-13: after Transition the band kept Gun down, Rifle up, Off the line, REMEDIAL, Cover me while the DI said
  // "Head." at the armoured man, the head row at Tab › 1 › 5, and Fire on the band rang the plate nine times))
  const contact = rows.some(s => isShotRow(s));
  const liveShot = rows.some(s => isShotRow(s) && !s.off);
  const stop = rows.some(s => /^weapon:(gun-down|offline)$/.test(s.id) && !s.off) || has(/^macro:(ia|remedial)$/) || (rows.some(s => s.id === 'weapon:rifle-up' && !s.off) && !liveShot);
  // (the tower's command given, or T's act a command (the instructor's Stop and CEASE FIRE in the house carry no cmd mark))
  const tower = rows.some(s => s.kind === 'command' && s.cmd) || (!!act && act.kind === 'command' && !act.purpose);
  const kd = has(/^(sight:|optic:|hold:(read|call|centre)$|read$)/);
  const inner = half === 'in' && has(/^door:(hold|push|pull|kick)>/);
  // (a contact whose man is down while T names the drill's next row (Carry on, "Clear!", the stack): the drill's situation)
  const drillAct = !!act && (OUT_RE.test(act.id) || ROOM_RE.test(act.id) || /^(drill:|door:)/.test(act.id));
  const id = stop ? 'stoppage' : contact && !drillAct ? 'contact' : tower ? 'tower' : kd ? 'kd' : inner ? 'inner' : half === 'in' ? 'room' : half === 'out' ? 'door' : 'line';
  const S = SITUATIONS[id];
  const five = S.five.map((f, i) => {
    if (Array.isArray(f)) { const e = groups?.[f[0]]?.slots[f[1]]; return e ? { ...e, five: i + 1 } : { five: i + 1, words: null, row: null, badge: null }; }
    const ids = [].concat(f.id ?? []), row = (f.re ? rows.find(s => f.re.test(s.id) && !s.off) ?? rows.find(s => f.re.test(s.id)) : null) ?? ids.map(x => rows.find(s => s.id === x && !s.off)).find(Boolean) ?? ids.map(x => rows.find(s => s.id === x)).find(Boolean) ?? null;
    return { five: i + 1, group: null, slot: null, words: f.words, row, badge: row ? badgeOf(row.off) : { t: 'none' } };
  });
  return { id, name: S.name, five };
}

// ---- the layouts ----
/** The core's keys in a layout: A on 1 to 5, B and C on 6 to 0. */
export const coreKeys = (layout) => (layout === 'a' ? { shot: '1', aim: '2', fix: '3', muzzle: '4', next: '5' } : { shot: '6', aim: '7', fix: '8', muzzle: '9', next: '0' });
/** A badge's remedy key in a layout ('to' badges: the aim's or Fix's key), or null. */
export const badgeKey = (badge, layout) => (badge?.t === 'to' ? coreKeys(layout)[badge.ref] ?? null : null);
// (the core entry as the band shows it: A's shot is Pair at a contact, else Fire)
function coreEntry(model, c, layout) {
  const e = model.core[c];
  if (c === 'shot' && layout === 'a' && e.pairShot) return { ...e.pairShot, core: 'shot' };
  return e;
}
/**
 * What the panel shows now, by layout and the player's place in it (nav: { fan (C: Tab held), group (an open drawer, bank or
 * the fan's group), deep (its third level open), page (the third level's) }): { level ('band' | 'fan' | 'group' | 'deep'),
 * head: { kind ('situation' | 'group' | 'fan' | 'core'), name }, keys: [{ key, entry }] (an entry: a slot's, a core's ({ core }),
 * a group's tab ({ tab: group, count, dot }), the third level's way in ({ deep }), its pager ({ more, page, pages }), or null),
 * banks (B: [{ key, group, count, dot, open }]) }. dotId: the row the DI names (its group's tab carries the amber dot).
 */
export function viewOf(model, layout = DEFAULT_LAYOUT, nav = {}, { dotId = model?.actId ?? null } = {}) {
  const L = LAYOUTS.includes(layout) ? layout : DEFAULT_LAYOUT;
  const { groups } = model;
  const count = (g) => groups[g].slots.filter(e => e?.row && !e.row.off).length + groups[g].deep.filter(s => !s.off).length;
  const holds = (g, idWanted) => !!idWanted && (groups[g].slots.some(e => e?.row?.id === idWanted) || groups[g].deep.some(s => s.id === idWanted));
  const tab = (g) => ({ tab: g, count: count(g), dot: holds(g, dotId) });
  const banks = L === 'b' ? Object.entries(BANK_KEYS).map(([g, key]) => ({ key, group: g, count: count(g), dot: holds(g, dotId), open: nav.group === g })) : null;
  // (a group's map, or its third level)
  const groupKeys = (g) => {
    if (nav.deep) {
      const list = groups[g].deep, pages = Math.max(1, Math.ceil(list.length / DEEP_PAGE)), p = (((nav.page ?? 0) % pages) + pages) % pages;
      const keys = list.slice(p * DEEP_PAGE, p * DEEP_PAGE + DEEP_PAGE).map((s, i) => ({ key: DIGITS[i], entry: { group: g, deepRow: true, row: s, words: s.label, badge: badgeOf(s.off) } }));
      if (pages > 1) keys.push({ key: '0', entry: { more: true, page: p, pages } });
      return { level: 'deep', head: { kind: 'group', name: `${GROUP_WORDS[g]} ▸`, group: g }, keys };
    }
    const keys = [];
    for (let k = 1; k <= 9; k++) keys.push({ key: String(k), entry: groups[g].slots[k] });
    const dk = DEEP_KEY[g];
    if (dk === '0' && groups[g].deep.length) keys.push({ key: '0', entry: { group: g, deep: true, words: '▸', count: groups[g].deep.length } });
    else if (L === 'b' && g === 'GUN') keys.push({ key: '0', entry: { tab: 'FIRE', count: count('FIRE'), dot: holds('FIRE', dotId), words: 'FIRE ▸' } });
    else if (L === 'a') keys.push({ key: '0', entry: { home: true, words: '◂ home' } });
    return { level: 'group', head: { kind: 'group', name: GROUP_WORDS[g], group: g }, keys };
  };
  if (nav.group && groups[nav.group]) return { layout: L, ...groupKeys(nav.group), banks };
  if (L === 'c' && nav.fan) return { layout: L, level: 'fan', head: { kind: 'fan', name: FAN_KEY }, keys: GROUPS.map((g, i) => ({ key: DIGITS[i], entry: tab(g) })), banks };
  const core = CORE.map(c => coreEntry(model, c, L));
  if (L === 'a') {
    const keys = core.map((e, i) => ({ key: DIGITS[i], entry: e }));
    for (const g of GROUPS) keys.push({ key: DRAWER_KEYS[g], entry: tab(g) });
    return { layout: L, level: 'band', head: { kind: 'core', name: 'HOME' }, keys, banks };
  }
  const left = L === 'b' ? [1, 2, 3, 4, 5].map(k => groups.FIRE.slots[k]) : model.situation.five;
  const keys = [...left.map((e, i) => ({ key: DIGITS[i], entry: e })), ...core.map((e, i) => ({ key: DIGITS[5 + i], entry: e }))];
  return { layout: L, level: 'band', head: L === 'b' ? { kind: 'group', name: 'FIRE', group: 'FIRE' } : { kind: 'situation', name: model.situation.name, id: model.situation.id }, keys, banks };
}
/**
 * A layout's own behaviour on a fresh stop: A opens FIRE by itself at a contact's pause with a shot to take (never with a stoppage,
 * nor with every shot struck for the gun's state: Fix, on the band, is then the one press; nor where T names a row of another
 * group, Challenge: NEXT, on the band, is; my calls, as the sample's for a stoppage).
 */
export const autoNav = (model, layout) => (layout === 'a' && model.situation.id === 'contact' && model.rows.some(s => isShotRow(s) && !s.off)
  && (!model.actId || model.groups.FIRE.slots.some(e => e?.row?.id === model.actId)) ? { group: 'FIRE' } : {});

/** The row an entry acts on (a slot's, a core's, a third level's), or null (a tab, an empty slot, a stand-in is still a row: struck). */
export const rowOfEntry = (e) => e?.row ?? null;
/**
 * The keys a row is on in a layout, fewest first: ['4'], ['Tab', '2', '4'], ['7', '4'] (A's drawer), ['R', '3'] (B's bank),
 * a third level's ['Tab', '3', '9', '2'] (its page's 0s before the digit); ['X'] for a row with a key of its own; null when the
 * panel has it nowhere. id: a row's id ('core:next' for T's key in the layout). next: false leaves NEXT out (the row's own place).
 */
export function keyPathOf(model, layout = DEFAULT_LAYOUT, rowId, { nav = autoNavOf(model, layout), next = true } = {}) {
  const L = LAYOUTS.includes(layout) ? layout : DEFAULT_LAYOUT;
  if (!model || !rowId) return null;
  if (KEYED[rowId]) return [KEYED[rowId]];
  if (rowId === 'core:next') return [coreKeys(L).next];
  // (next false: the row's own place, as a player who does not press T finds it (the press model's))
  const hit = (keys) => keys.find(k => rowOfEntry(k.entry)?.id === rowId && (next || k.entry?.core !== 'next'))?.key ?? null;
  // (the band as it stands on the stop (A's FIRE drawer open at a contact), then the band itself)
  const v0 = viewOf(model, L, nav), k0 = hit(v0.keys);
  if (k0) return [k0];
  const home = nav?.group ? viewOf(model, L, {}) : null, kh = home ? hit(home.keys) : null;
  const back = nav?.group ? [L === 'b' ? BANK_KEYS[nav.group] ?? 'Esc' : homeKey(model, L, nav.group)] : [];
  if (kh) return [...back, kh];
  const open = (g) => (L === 'a' ? (nav?.group === g ? [] : [...back, DRAWER_KEYS[g]])
    : L === 'b' ? (nav?.group === g ? [] : g === 'FIRE' ? ['C', '0'] : [BANK_KEYS[g]]) : [FAN_KEY, DIGITS[GROUPS.indexOf(g)]]);
  for (const g of GROUPS) {
    const ks = hit(viewOf(model, L, { group: g }).keys);
    if (ks) return [...open(g), ks];
  }
  for (const g of GROUPS) {
    const i = model.groups[g].deep.findIndex(s => s.id === rowId);
    if (i < 0) continue;
    const page = Math.floor(i / DEEP_PAGE), d = DIGITS[i % DEEP_PAGE];
    return [...open(g), DEEP_KEY[g], ...Array(page).fill('0'), d];
  }
  return null;
}
const autoNavOf = (model, layout) => (model ? autoNav(model, layout) : {});
/**
 * The key that closes a group's map back to the band: 0 ("◂ home": layout A's drawer, VIEWS §7.8.2) where the group's third
 * level is not on 0, else Esc (DRILL, BODY and TEAM keep their ▸ on 0; my call). B's banks close on their letter.
 */
export const homeKey = (model, layout, g) => (layout === 'b' ? BANK_KEYS[g] ?? 'Esc' : DEEP_KEY[g] === '0' && model?.groups?.[g]?.deep?.length ? 'Esc' : '0');
/** A key path in the DI's words: '4', 'Tab › 2 › 4'. */
export const keyText = (path) => (Array.isArray(path) && path.length ? path.join(' › ') : null);
/** The panel's model of a stop's rows in a layout, and a row's keys there: { model, path, text } (the DI's line names text). */
export function keysFor(steps, rowId, { layout = DEFAULT_LAYOUT, act = null } = {}) {
  const model = modelOf(steps, { act }), path = keyPathOf(model, layout, rowId);
  return { model, path, text: keyText(path) };
}
/** Presses a row costs in a layout (its key path's length), or null where the panel lacks it. */
export const pressesOf = (model, layout, rowId) => keyPathOf(model, layout, rowId)?.length ?? null;
/** Every row of the model with its group and slot (the third level's slot 'deep'): [{ id, group, slot }], the stability count's. */
export function placesOf(model) {
  const out = [];
  for (const g of GROUPS) {
    model.groups[g].slots.forEach((e, k) => { if (e?.row && !e.stand) out.push({ id: e.row.id, group: g, slot: k }); });
    for (const s of model.groups[g].deep) out.push({ id: s.id, group: g, slot: 'deep' });
  }
  return out;
}
/** A row's keys in the DI's words for a stop's rows in a layout ('4', 'Tab › 1 › 8'), or null: keysFor's text. */
export const keyOn = (steps, rowId, { layout = DEFAULT_LAYOUT, act = null } = {}) => keysFor(steps, rowId, { layout, act }).text;
/**
 * Where a key path leads on the panel, pressed from the stop's own start (autoNav): the row its last key is on, { next: true,
 * row } for NEXT, { id: 'leave' } for X; null where a key does nothing or the path stops short. The test that every key the
 * DI's line names works (VIEWS §7.8.5), and the page's own check of keyPathOf.
 */
export function resolvePath(model, layout = DEFAULT_LAYOUT, path = [], nav0 = autoNav(model, layout)) {
  const L = LAYOUTS.includes(layout) ? layout : DEFAULT_LAYOUT;
  let nav = { ...nav0 };
  for (let i = 0; i < (path?.length ?? 0); i++) {
    const k = String(path[i]), last = i === path.length - 1;
    if (k === FAN_KEY) { if (L !== 'c' || last) return null; nav = { fan: true }; continue; }
    if (k === 'Esc') { nav = {}; continue; }
    if (k === 'X') return last ? { id: 'leave' } : null;
    const bank = L === 'b' ? Object.keys(BANK_KEYS).find(g => BANK_KEYS[g] === k) : null;
    if (bank) { nav = nav.group === bank && !nav.deep ? {} : { group: bank }; continue; }
    const e = viewOf(model, L, nav).keys.find(x => x.key === k)?.entry ?? null;
    if (!e) return null;
    if (e.tab) { nav = { ...(nav.fan ? { fan: true } : {}), group: e.tab }; continue; }
    if (e.deep && !e.row) { nav = { ...nav, group: e.group, deep: true, page: 0 }; continue; }
    if (e.home) { nav = {}; continue; }
    if (e.more) { nav = { ...nav, page: (nav.page ?? 0) + 1 }; continue; }
    if (!last) return null;
    return e.core === 'next' ? { next: true, row: e.row ?? null } : e.row ?? null;
  }
  return null;
}
