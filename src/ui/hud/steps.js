// OLYMPUS hud: the step panel of stop motion, in the STEPS rectangle, the weapon card at its left (VIEWS §4.4, §7.4, §10.2; the build sheet 0.0.5 §2.4).
//
// Tradecraft's numbered steps, each with its key and its time (docs/research/tradecraft-art-render.md:
// "1 draw SIG · 1.4 s; 2 aim at the man in the grey coat · 0.9 s"), the pattern the user approved, laid
// out in OLYMPUS's reserved rectangle (layout.js STEPS, 720 × 148 at --ui 1, on INSTINCT): the weapon
// card (CARD_W × CARD_H, 180 × 148) at its left, the steps in two columns of five to its right.
//
// The steps are the shot role's stepsOf(state) (TECH §2.6's options(): Fire, Aim, Hold, the Corps'
// commands with the tower's current first, the singles canDo() allows from the gun's believed state,
// stance, posture, Wait), each { id, kind, label, ms, rushMs, carefulMs, odds, routine, off, subs, cmd,
// skill }. panelOf(steps, { page }) numbers them: 1 to 9 then 0 while ten or fewer; past ten, 1 to 9
// hold Fire, Aim, Hold and the commands, then a page of the rest, and 0 is "more", paging the singles
// (the sheet's "past nine, 0 is more"). A row reads "3 LOAD · 2.4 s" (the step's own label and its time
// at the normal tempo), its odds where they matter ("85%", or "routine" for a roll the trained never
// miss: SKILLS §5.1), a command's sub-steps as dots, struck through with its reason when off ("1 fire ·
// 0.4 s (on safe)"); the tower's current command is marked (a brass edge, its "◉"); Shift held shows the
// rushed times (where a step can be rushed), and hovering a row its rushed and careful times and what
// it rolls. The keys (main.js, the build sheet §8 item 15): a digit tapped is the step at its normal
// tempo, with Shift rushed, held careful; Fire held is hold and fire.
//
// While a step runs (stopNow's phase 'act') the panel shows it alone, the running view: its name and
// tempo, its sub-steps with their words as glyph ticks filling as they are rolled (✓ passed, ◦ routine,
// ✗ fumbled, · still to come), from the 'step' facts (createTicks), and a bar of its time gone on the
// game clock (the sub-steps done and the share of the one running), so stop motion freezes it as it
// freezes the picture; the tap is retired (0.0.8, COMBAT §25.6.4): a Pair, a Hammer or a Triple is a shot row chosen
// while time stands still, and Fire during a fire step is busy. The step
// is the one the panel last listed under its id (it leaves stepsOf's list as it changes the gun: LOAD
// once the magazine is in). A chained wait (a step that completed the tower's command runs on to the
// next: the sheet's §8 item 16) keeps the panel, any step chosen cutting it, its row "waiting for the tower".
//
// While a reflex card waits the panel is its weapon card alone (cardOnly), the reflex card beside it in the rest of
// STEPS (main.js), so the believed state stays in sight at the moment of diagnosis.
//
// The weapon card (VIEWS §4.4) is the gun as its holder believes it, never the truth they do not know
// (WEAPONS §4.2; the sheet's §8 item 27): its picture is the stage's paintWeaponCard({ model, belief })
// (src/art/weaponcard.js: the selector's marks, the window's rounds, the port's glint, its "?" and "!"),
// and its words weaponCardModel(belief) (the card's hover, and its caption only where the picture could
// not be painted), both fed beliefOf(state, gunId) alone (arms' "the only view the HUD reads"), so
// nothing here can read a truth field: SAFE or SEMI, the
// chamber as believed (a round, empty, "?" never checked, a dud or a case once seen), the magazine's
// count as known ("3", "≈3" under Weapon handling 15, "?" uncounted, OUT), the bolt locked, a stoppage
// once felt (CLICK, DEAD, FELT; CASE and DOUBLE once looked at). The ui-weaponcard test feeds a belief
// whose truth differs and reads the belief in every glyph.
//
// 0.0.6 (the user, 2026-11-07): the card carries the magazine in the hand as believed (beliefOf's hand: its count,
// its kind, its weight's band) and the believed kind of the one in the rifle (magLoad); the line adds "HAND 5",
// "HAND A FEW", "HAND ?" ("TR" when tracer). A row the scene marks without striking it (step.warn: "one magazine a
// string") shows its mark in amber where a struck row shows its reason, and stays choosable.
//
// 0.0.7 (the build sheet 0.0.7 §2.5 (a): the shot at distance): the card carries the SO-4's turrets and the hold
// (src/art/weaponcard.js distanceParts: the dial from the believed zero, the lever's power, the line's believed dope,
// the reticle with the hold), from beliefOf's new fields (sight, seen; zero and dope, believed; optic, seen) and the
// stop's hold, never the rifle's true zero; its words and caption say the same ("4× · ▼3 · 300 ▼3 ✓ · HOLD 0.5 R"); while
// the rifle is being zeroed (v.zeroing: kdNow's, shot.js zeroingOf) the clicks dialled in this zero ("1× · ZEROING ▲4 ◀2").
// The panel's new rows are the shot role's (stepsOf: the coach's call to dial, the dope for the line, the holds for
// your read and the coach's, the flags read, the lever, sitting), each with its words on its hover; a row's time
// and odds as any other's. The dial's keys (Z S and the arrows a click of elevation, Shift with Q D a click of
// windage: core/keys.js dialOf) send 'sight:elev:±1' and 'sight:wind:±1' (main.js).
//
// 0.0.8 (the build sheet 0.0.8 §2.2, §2.4; COMBAT §25.6, §25.11): at a contact's pause the panel leads with the contact's
// answers and the shot rows (stepsOf's order: an identified no-shoot's Hold him and Challenge first), each row a real
// choice priced and with its odds before you press: a shot row (kind 'shot': Pair, Hammer, Triple, Failure drill, To the
// head) reads its time to two places, its aim apart where the row carries it ("Pair · 0.12 + 0.58 s"), and every
// round's odds in order ("95% 95%", the head's after the torso's), struck with its gate's words where the sheet is
// below it ("Marksmanship 12": what training buys); Hold him and Challenge as rows of their own; the reloads by their
// purpose as stepsOf labels them (RELOAD, Top up, RELOAD, keep the empty). The shot and the contact's rows stay on
// every page. Running, a shot row's sub-steps are its parts (the aim, the press, each round by its part, the shift),
// ticked as each is rolled. The tap is retired (COMBAT §25.6.4): no follow-up is offered in Fire's recovery.
//
// 0.0.9 (the build sheet 0.0.9 §2.1, §2.3; VIEWS §7.4; COMBAT §5.9): a row whose roll the chaos cut under SHAKING_ODDS
// (stepsOf's step.shaking: { v, felt, band }, its warn 'shaking') is marked, never struck: "Fire · 0.70 s · 45% ! shaking",
// its odds kept beside the amber mark, and its hover says the term and the arithmetic, "pinned −10: the chaos 105 − your
// hardening 7 = felt 98" (shakingWords: the band's word and the row's own term, then supp.js suppNow's sum, the one
// formatter of felt; view.chaos is that reading). Felt is never a number on the row itself. The step last run keeps its
// sub-steps' marks on its row until another is chosen ("Off safe ✗": a single's one roll had no ticks to show it failed,
// the running view leaving with the step; lastMarks), and the weapon card carries the step last run with its marks for
// LAST_SHOW_MS of real time ("Off safe ✗", .wc-last), whatever its row became (Off safe gives way to Safe), so a thumb that
// slipped on the safety is seen on the panel.
// 0.0.10 (the build sheet 0.0.10 §2.1, §2.3; COMBAT §5.2; VIEWS §7.4): Breathe's row is the shot role's ("Breathe · 4.0 s", no odds:
// no roll), fixed on the first page with nothing facing you, else a single marked "! he's up" (step.warn 'up': WARN_WORDS; never
// struck, pillar 3); while it runs, the running view counts its four sub-steps as the box: in · hold · out · hold (BREATHE_COUNTS),
// each filled (•) as it is breathed, the one running lit, its bar the game clock's.
// 0.0.12 (the build sheet 0.0.12 §2.2, §2.4; COMBAT §25.7, §25.11; VIEWS §7.4): in the shoot house the panel gains the door's rows, the
// stack's and the drill's singles (labels and times the drill's, as any row's), and the bundles: a bundle's row (kind 'bundle') reads like a
// command, its name and time, then its beats as dots grouped by channel (FEET, HANDS, EYES, VOICE: a gap where the channel changes) with a
// seam drawn as a bar where the rung stops it ("Clear it · 4.0 s ● ● ● │ ● ● ●", bundleDots), struck once "by hand first" where it is taught
// and not yet lived; its variants (kind 'variant', or a row the drill marks free) are set at no time, so they show none. While a bundle
// runs the panel shows it alone with four short lanes of glyph ticks (bundleNow's lanes: ✓ passed, ◦ routine, ✗ fumbled, · to come, ▸
// running), FEET HANDS EYES VOICE, filling one at a time below rung 3 and together above, and a bar of its time on the game clock.
import { CARD_W, CARD_H } from './layout.js';
import { distanceParts, dialWords } from '../../art/weaponcard.js';
// (the panel's numbering is the sim's (src/sim/arms/panel.js), so the DI's line can name the digit a row is on: re-exported here)
import { PANEL_KEYS, FIXED_KINDS, isFixed, FIXED_MAX, FIXED_REPEAT, isGated, gatedRow, panelList, panelOf, isShotRow } from '../../sim/arms/panel.js';
export { PANEL_KEYS, FIXED_KINDS, isFixed, FIXED_MAX, FIXED_REPEAT, isGated, gatedRow, panelList, panelOf, isShotRow };

/** A warn's words where the sim's id is short (0.0.10: Breathe with a threat up). */
export const WARN_WORDS = Object.freeze({ up: "he's up" });
/** A row's warning as the row says it. */
export const warnWords = (w) => WARN_WORDS[w] ?? w;
/** Breathe's four sub-steps as the running view counts them (COMBAT §5.2's box: in, hold, out, hold). */
export const BREATHE_COUNTS = Object.freeze(['in', 'hold', 'out', 'hold']);
/** Whether a step is Breathe (the shot role's id). */
export const isBreathe = (id) => id === 'breathe' || String(id ?? '').startsWith('breathe');
/** A row's mark when the chaos shakes it (stepsOf's warn). */
export const SHAKING = 'shaking';
/** Whether a row is marked as shaking (stepsOf's shaking record, or its warn). */
export const isShaking = (s) => !!s && !s.off && (!!s.shaking || s.warn === SHAKING);
/**
 * A shaking row's hover words: "pinned −10: the chaos 105 − your hardening 7 = felt 98" (the band's word and the row's
 * term, then the arithmetic in suppNow's sum's words); chaos: suppNow's record (or null: the term alone).
 */
export function shakingWords(step, chaos = null) {
  const sh = step?.shaking;
  if (!sh) return '';
  const v = Number(sh.v) || 0, head = `${sh.band ?? chaos?.band ?? 'shaking'} ${v < 0 ? `−${-v}` : v > 0 ? `+${v}` : '0'}`;
  const sum = chaos?.sum ? String(chaos.sum).split(':')[0].trim() : '';
  return sum ? `${head}: ${sum}` : head;
}
/** The marks of the step last run, for its row (createTicks' last, once it has ended or halted): '✗', '✓◦✗', or '' (none, another step's, or still running). */
export function lastMarks(ticks, stepId) {
  const lt = ticks?.last;
  if (!lt || !(lt.ended || lt.halted) || lt.step !== stepId) return '';
  return lt.marks.filter(Boolean).join('');
}
/** The step last run stays on the weapon card this long (ms of real time), or until another starts. */
export const LAST_SHOW_MS = 3000;
/** A struck row chosen lights this long (ms). */
export const FLASH_MS = 220;

const secs = (ms) => (Number.isFinite(ms) ? `${(Math.max(0, ms) / 1000).toFixed(1)} s` : '');
const secs2 = (ms) => (Math.max(0, ms) / 1000).toFixed(2);
/** A shot row's odds, round by round in order: [0.95, 0.95, 0.75]. */
export const roundOdds = (s) => (isShotRow(s) ? s.rounds.map(r => r.odds) : []);
/** A step's odds as the row says them: 'routine', '85%', a shot row's every round '95% 95% 75%', or '' where no roll is in doubt. */
export function oddsText(step) {
  if (!step) return '';
  if (isShotRow(step)) return step.rounds.map(r => (Number.isFinite(r.odds) ? `${Math.round(r.odds * 100)}%` : '?')).join(' ');
  if (step.routine) return 'routine';
  return Number.isFinite(step.odds) && step.odds < 1 ? `${Math.round(step.odds * 100)}%` : '';
}
/**
 * A shot row's time as the row says it, to two places (its splits are a few hundredths): the aim apart where the row
 * carries one, "0.12 + 0.58 s", else "0.79 s"; Shift's rushed time where it has one. Any other step: one place.
 */
export function timeText(step, { shift = false } = {}) {
  const ms = shownMs(step, { shift });
  if (!Number.isFinite(ms) || isFree(step)) return '';
  if (!isShotRow(step)) return secs(ms);
  const aim = (step.parts ?? []).find(p => p.k === 'aim'), aimMs = aim && !(shift && Number.isFinite(step.rushMs)) ? aim.ms : 0;
  return aimMs > 0 && aimMs < ms ? `${secs2(aimMs)} + ${secs2(ms - aimMs)} s` : `${secs2(ms)} s`;
}
/**
 * A row's kind as its class (0.0.12): the kind itself, but a kind that is also a HUD element's class ('watch': the house's Watch row met
 * the wrist terminal's .watch, its time drawn at the watch's size) is prefixed, so no HUD rule reaches a row.
 */
export const HUD_CLASSES = Object.freeze(['watch', 'timer', 'paper', 'radio', 'steps', 'instinct', 'plaque', 'toasts', 'hitcard', 'keyshint', 'banner']);
export const kindClass = (kind) => (HUD_CLASSES.includes(kind ?? '') ? `kind-${kind}` : kind ?? 'single');
/** The channels of a bundle's beats, in the lanes' order (COMBAT §25.7.1; the drill's CHANNELS less 'world'), and their lanes' names. */
export const LANES = Object.freeze(['feet', 'hands', 'eyes', 'voice']);
export const LANE_WORDS = Object.freeze({ feet: 'FEET', hands: 'HANDS', eyes: 'EYES', voice: 'VOICE' });
/** Whether a row is set at no time (a bundle's variant: "Cross ⇄ Hook"), so its row shows no time. */
export const isFree = (s) => !!s && (s.kind === 'variant' || s.free === true || (s.kind !== 'bundle' && /⇄/.test(String(s.label ?? '')) && !(s.ms > 0)));
/** A bundle's dots between seams at most (the lane's bundle has thirty-odd beats: the rest are its hover's), then "…". */
export const DOTS_SEG_MAX = 6;
/**
 * A bundle's beats as dots (0.0.12): '● ● ● │ ● ● ●', a dot a beat in its order, a gap where the channel changes, a bar after each
 * seam's beat (bundleRows' seams: the beat indices where the rung stops the bundle), at most DOTS_SEG_MAX dots between two bars and
 * then '…' (the beats in words are the row's hover). '' for a row that is not a bundle.
 */
export function bundleDots(step) {
  if (step?.kind !== 'bundle' || !Array.isArray(step.beats) || !step.beats.length) return '';
  const seams = new Set(step.seams ?? []), segs = [[]];
  step.beats.forEach((b, i) => { segs[segs.length - 1].push(b); if (seams.has(i) && i < step.beats.length - 1) segs.push([]); });
  return segs.map(seg => {
    let out = '', ch = null;
    seg.slice(0, DOTS_SEG_MAX).forEach((b, i) => { if (i) out += ch !== null && b.ch !== ch ? '  ' : ' '; out += '●'; ch = b.ch ?? null; });
    return seg.length > DOTS_SEG_MAX ? `${out} …` : out;
  }).join(' │ ');
}
/** A bundle's beats in words, its row's hover: "feet: the approach 3.4 s, the entry 0.4 s · hands: …" by channel, the seams named. */
export function beatsWords(step) {
  if (step?.kind !== 'bundle' || !Array.isArray(step.beats)) return '';
  const by = new Map();
  for (const b of step.beats) { const c = b.ch ?? 'world'; if (!by.has(c)) by.set(c, []); by.get(c).push(`${b.label ?? b.k ?? b.id}${Number.isFinite(b.ms) ? ` ${secs(b.ms)}` : ''}`); }
  const seams = (step.seams ?? []).length;
  return `${[...by.entries()].map(([c, l]) => `${c}: ${l.join(', ')}`).join(' · ')}${seams ? ` · ${seams} seam${seams === 1 ? '' : 's'}: it stops there below rung ${(step.rung ?? 0) + 1}` : ''}`;
}
/**
 * A running bundle's lanes (bundleNow's): [{ ch, name, glyphs: [{ key, glyph }] }] in LANES' order, the lanes with a beat; or from the
 * doing record's beats when bundleNow gives none (st: wait ·, run ▸, done ✓, cut ✗).
 */
export function laneRows(bn, doing = null) {
  const lanes = bn?.lanes ?? null;
  if (lanes) return LANES.filter(c => (lanes[c] ?? []).length).map(c => ({ ch: c, name: LANE_WORDS[c], glyphs: lanes[c] }));
  const beats = doing?.beats ?? [], G = { wait: '·', run: '▸', done: '✓', cut: '✗' };
  return LANES.map(c => ({ ch: c, name: LANE_WORDS[c], glyphs: beats.filter(b => b.ch === c).map(b => ({ key: b.key, glyph: G[b.st] ?? '·' })) })).filter(l => l.glyphs.length);
}
/** Which time a row shows: rushed while Shift is held (where it can be rushed), else the normal one. */
export const shownMs = (step, { shift = false } = {}) => (shift && Number.isFinite(step?.rushMs) ? step.rushMs : step?.ms);
/** A row as one plain line: '3 LOAD · 2.4 s · routine', '1 fire · 0.4 s (on safe)', a marked one '5 RELOAD · 3.0 s · routine (! one magazine a string)'. */
export function rowText(slot, opts = {}) {
  const s = slot.step, t = timeText(s, opts), odds = oddsText(s);
  // (0.0.9: a shaking row "1 Fire · 0.70 s · 45% ! shaking": its odds, then the mark)
  if (isShaking(s)) return `${slot.key} ${s.label}${t ? ` · ${t}` : ''}${odds ? ` · ${odds}` : ''} ! ${SHAKING}`;
  const dots = bundleDots(s);
  return `${slot.key} ${s.label}${t ? ` · ${t}` : ''}${dots ? ` ${dots}` : ''}${odds && !s.off ? ` · ${odds}` : ''}${s.off ? ` (${s.off})` : s.warn ? ` (! ${warnWords(s.warn)})` : ''}`;
}
/** A row's hover words: what it rolls, and its rushed and careful times where it has them. */
export function rowTitle(step, { label = (a) => a, chaos = null } = {}) {
  if (!step) return '';
  const bits = [];
  // (0.0.9: shaking, the term and its arithmetic first)
  if (isShaking(step)) bits.push(shakingWords(step, chaos) || SHAKING);
  if (step.skill) bits.push(`rolls ${step.skill}`);
  if (Number.isFinite(step.rushMs)) bits.push(`${label('run')} + digit: rushed, ${secs(step.rushMs)} (−3, never routine)`);
  if (Number.isFinite(step.carefulMs)) bits.push(`held: careful, ${secs(step.carefulMs)} (+2)`);
  if (step.kind === 'fire') bits.push('held: hold the aim to +4, then fire');
  if (isShotRow(step)) bits.push(partsWords(step));
  else if (step.kind === 'bundle') bits.push(beatsWords(step));
  else if (step.subs?.length) bits.push(step.subs.map(x => `${x.label ?? x.id}${Number.isFinite(x.ms) ? ` ${secs(x.ms)}` : ''}`).join(', '));
  if (step.gate && step.off) bits.push(`needs ${step.off}`);
  if (step.words && step.words !== step.label) bits.push(step.words);
  if (step.off) bits.push(`not now: ${step.off}`);
  else if (step.warn && step.warn !== SHAKING) bits.push(step.warn === 'one magazine a string' ? `ahead of the tower: ${step.warn}` : step.warn === 'up' ? "he's up: four seconds of your time with a threat facing you" : step.warn);
  // (0.0.10: Breathe's own words: what it buys and what it costs)
  if (isBreathe(step.id) && !step.words) bits.push('box breathing, in, hold, out, hold: the chaos drains twice as fast while it runs; never free');
  return bits.join(' · ');
}

/** The parts' words of a shot row, the hover's: "the aim 0.12 s, the press 0.15 s, a round on the torso 95% (climb −1), …". */
export function partsWords(step) {
  if (!isShotRow(step)) return '';
  let ri = 0;
  const said = (step.parts ?? []).map(p => {
    if (p.k === 'round') {
      const r = step.rounds[ri++] ?? {}, part = r.part ?? p.part ?? 'torso';
      return `a round ${part === 'head' ? 'to the head' : 'on the torso'}${Number.isFinite(r.odds) ? ` ${Math.round(r.odds * 100)}%` : ''}${r.climb ? ` (climb ${r.climb > 0 ? '+' : '−'}${Math.abs(r.climb)})` : ''}${Number.isFinite(p.ms) ? `, then ${secs2(p.ms)} s` : ''}`;
    }
    const w = { aim: 'the aim', press: 'the press', shift: 'the assessment and the shift' }[p.k] ?? p.k;
    return `${w}${Number.isFinite(p.ms) ? ` ${secs2(p.ms)} s` : ''}`;
  });
  return said.join(', ');
}
/** A running shot row's sub-step's words: its part's, a round by its order and its part ("round 2 · torso"). */
export function subWords(step, list, i, labelOf = (id) => id) {
  const id = list?.[i];
  if (!isShotRow(step) || id !== 'round') return labelOf(id);
  const n = list.slice(0, i + 1).filter(x => x === 'round').length, r = step.rounds[n - 1];
  return `round ${n} · ${r?.part ?? 'torso'}`;
}

// ---- the ticks of a running macro, from the 'step' facts ----
/** A sub-step's mark: ✓ passed, ◦ routine, ✗ fumbled (a failure, or a routine natural 1's slowed miss). */
export function markOf(f) {
  if (!f || f.ok === undefined || f.ok === null) return null;
  if (!f.ok || f.grade === 'miss' || f.grade === 'bad' || f.grade === 'disaster') return '✗';
  return f.routine ? '◦' : '✓';
}
/** The running step's ticks: { fact(payload) (a 'step' fact: 'start' begins a step, each 'sub' and 'halt' marks its i), of(stepId, n) → ['✓', '◦', '·'…], last }. */
export function createTicks() {
  let cur = null;
  return {
    fact(f) {
      if (!f) return;
      if (f.phase === 'start' || !cur || cur.step !== f.step || cur.who !== f.who) cur = { step: f.step, who: f.who, marks: [], halted: false, ended: false };
      // (a sub-step's own roll, as it is rolled, and the one that halted the rest; the step's start and end carry none)
      const m = f.phase === 'sub' || f.phase === 'halt' ? markOf(f) : null;
      if (m && Number.isInteger(f.i)) cur.marks[f.i] = m;
      if (f.phase === 'halt') cur.halted = true;
      if (f.phase === 'end' || f.phase === 'cut') cur.ended = true;
    },
    of(stepId, n) {
      const marks = cur && cur.step === stepId ? cur.marks : [];
      return Array.from({ length: Math.max(n, marks.length) }, (_, i) => marks[i] ?? '·');
    },
    get last() { return cur; },
    reset() { cur = null; },
  };
}

// ---- the weapon card: the belief, never the truth ----
const MODE_WORD = Object.freeze({ safe: 'SAFE', semi: 'SEMI', auto: 'AUTO', burst: 'BURST' });
const CHAMBER_WORD = Object.freeze({ live: 'ROUND', empty: 'EMPTY', '?': '?', dud: 'DUD', case: 'CASE' });
const STOPPAGE_WORD = Object.freeze({ click: 'CLICK', dead: 'DEAD', felt: 'FELT', case: 'CASE', double: 'DOUBLE' });
/** The keys of beliefOf's record the card reads: nothing else is ever read from it. */
export const BELIEF_FIELDS = Object.freeze(['model', 'short', 'chamber', 'mag', 'magFam', 'count', 'countApprox', 'magLoad', 'mode', 'locked', 'port', 'stoppage', 'condWord', 'cocked', 'hand', 'sight', 'zero', 'optic', 'dope']);
const FEEL_LINE = Object.freeze({ none: 'NONE', few: 'A FEW', half: 'HALF', most: 'NEARLY FULL', full: 'FULL' });
const FEEL_WORDS = Object.freeze({ none: 'feels empty', few: 'a few rounds by its weight', half: 'about half full by its weight', most: 'nearly full by its weight', full: 'full by its weight' });
/**
 * The card's caption from a belief (beliefOf's record): { short, mode, chamber, count, locked, port, stoppage,
 * cond, line ('SAFE · ROUND + 3'), words (the hover's plain sentence) }. Pure; reads only BELIEF_FIELDS.
 */
export function weaponCardModel(belief, { distance = false, line: kdLine = null, hold = null, zeroing = null } = {}) {
  const b = {};
  for (const k of BELIEF_FIELDS) b[k] = belief?.[k];
  const mode = MODE_WORD[b.mode] ?? (b.mode ? String(b.mode).toUpperCase() : '?');
  const chamber = CHAMBER_WORD[b.chamber] ?? '?';
  const count = b.mag === 'out' ? 'OUT' : b.count === null || b.count === undefined || b.count === '?' ? '?' : b.countApprox ? `≈${b.count}` : String(b.count);
  const stoppage = b.stoppage ? STOPPAGE_WORD[b.stoppage] ?? String(b.stoppage).toUpperCase() : null;
  const roundIn = b.chamber === 'live' ? '1' : b.chamber === 'empty' ? '0' : b.chamber === '?' ? '?' : chamber;
  const H = b.hand ?? null, handCount = H ? (Number.isFinite(H.n) ? `${H.approx ? '≈' : ''}${H.n}` : H.feel ? FEEL_LINE[H.feel] ?? '?' : '?') : null;
  const hand = H ? `HAND ${handCount}${H.load === 'tracer' ? ' TR' : ''}` : null;
  const line = [mode, `${roundIn} + ${count}${b.magLoad === 'tracer' && b.mag !== 'out' ? ' TR' : ''}`, b.locked ? 'LOCKED' : null, stoppage, hand].filter(Boolean).join(' · ');
  const chamberWords = { live: 'a round in the chamber', empty: 'the chamber empty', '?': "the chamber: you haven't checked", dud: 'a dud in the chamber', case: 'a case caught in the port' }[b.chamber] ?? 'the chamber: unknown';
  const magWords = b.mag === 'out' ? 'no magazine' : count === '?' ? 'a magazine, uncounted' : `${b.countApprox ? 'about ' : ''}${b.count} in the magazine`;
  const handWords = H ? `; in your hand a magazine, ${Number.isFinite(H.n) ? `${H.approx ? 'about ' : ''}${H.n === 0 ? 'empty' : `${H.n} round${H.n === 1 ? '' : 's'}`}` : H.feel ? FEEL_WORDS[H.feel] ?? 'its count unknown' : 'its count unknown'}${H.load ? `, ${H.load}` : ', its kind not seen'}` : '';
  // (0.0.7: the turrets and the hold, where the card shows them: the dial from the believed zero, the line's dope)
  const F = distanceParts(b, { distance, line: kdLine, hold, zeroing }), D = F ? dialWords(F) : null;
  const holdSaid = F && (F.hold.xMil || F.hold.yMil) ? `HOLD ${[F.hold.xMil ? `${Math.abs(F.hold.xMil)} ${F.hold.xMil > 0 ? 'R' : 'L'}` : null, F.hold.yMil ? `${Math.abs(F.hold.yMil)} ${F.hold.yMil > 0 ? 'UP' : 'DN'}` : null].filter(Boolean).join(' ')}` : null;
  const far = D ? [D.power, D.dial, D.dope ? `${D.dope}${D.onDope ? ' ✓' : D.toGo ? ` (${D.toGo} to go)` : ''}` : null, holdSaid].filter(Boolean).join(' · ') : null;
  const clickWords = (n, up, down) => `${Math.abs(n)} click${Math.abs(n) === 1 ? '' : 's'} ${n > 0 ? up : down}`;
  const dialled = [F?.dial.elev ? clickWords(F.dial.elev, 'up', 'down') : null, F?.dial.wind ? clickWords(F.dial.wind, 'right', 'left') : null].filter(Boolean).join(' and ');
  // (while zeroing, the clicks dialled in this zero from the turrets as issued: the user's report, 2026-11-07)
  const dialSaid = !F ? '' : F.zeroing ? (dialled ? `zeroing, ${dialled} dialled this zero` : 'zeroing, nothing dialled yet') : !dialled ? `on ${F.zero ? 'your' : 'the card\'s'} zero` : `${dialled} from ${F.zero ? 'your' : 'the card\'s'} zero`;
  const farWords = F ? `; the scope at ${F.optic} power, ${dialSaid}${F.line ? `, ${F.onDope ? 'on' : 'off'} your dope for ${F.line} m` : ''}${holdSaid ? `, holding ${holdSaid.slice(5).replace(' R', ' mil right').replace(' L', ' mil left').replace(' UP', ' mil up').replace(' DN', ' mil down')}` : ''}` : '';
  const words = `${b.short ?? 'The rifle'}: ${chamberWords}, ${magWords}${b.magLoad && b.mag !== 'out' ? ` of ${b.magLoad}` : ''}, ${b.mode === 'safe' ? 'on safe' : `on ${b.mode ?? '?'}`}${b.locked ? ', the bolt locked back' : ''}${stoppage ? `; ${stoppage.toLowerCase()}` : ''}${b.condWord && b.condWord !== 'fine' ? `; ${b.condWord}` : ''}${handWords}${farWords}.`;
  return { short: b.short ?? null, model: b.model ?? null, mode, chamber, count, locked: !!b.locked, port: b.port ?? null, stoppage, cond: b.condWord ?? null, hand, far, line: far ? `${line} · ${far}` : line, words };
}

/** Pixels onto a canvas: a Pixmap-like { w, h, data | px } (a Uint32Array in ImageData's order, or RGBA bytes). */
export function putPixels(canvas, pm) {
  const raw = pm?.data ?? pm?.px;
  if (!raw || !pm.w || !pm.h) return false;
  canvas.width = pm.w; canvas.height = pm.h;
  const g = canvas.getContext('2d');
  if (!g) return false;
  const bytes = raw instanceof Uint8ClampedArray ? raw : new Uint8ClampedArray(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));
  g.putImageData(new ImageData(bytes, pm.w, pm.h), 0, 0);
  // (a card pixel a CSS pixel at --ui 1, as the doll is drawn: VIEWS §4.1's density; the panel sets an integer scale)
  if (!canvas.style.width) { canvas.style.width = `calc(${pm.w}px * var(--ui))`; canvas.style.height = `calc(${pm.h}px * var(--ui))`; }
  return true;
}
/**
 * The weapon card's CSS pixels a card pixel: a whole number of device pixels, the largest at or under the --ui
 * scale (at least one), so its pixel letters keep every column (the runtime review's: at 1.244 they ran uneven,
 * shrunk to 0.84 they dropped columns, "SEMI" reading "<-NT"); a card larger than its box is cropped by it, centred.
 */
export const cardScale = (ui = 1, dpr = 1) => Math.max(1, Math.floor(ui * dpr + 1e-6)) / dpr;
/**
 * The card fitted to its box (CARD_W × CARD_H at --ui): cardScale's whole device pixels where they fit; where even
 * one device pixel a card pixel is larger than the box (--ui under 1 at a DPR of 1: 1024 × 768's 0.85), the box's own
 * scale, drawn smooth rather than pixelated so no column drops: { k, smooth } (the runtime review's of v0.0.7: at
 * 1024 × 768 the 180 × 148 card was cut by its 153 px box on every side, the turrets' row and "▼3 TO GO" lost).
 */
export function cardFit(ui = 1, dpr = 1) {
  const k = cardScale(ui, dpr);
  return k <= ui + 1e-6 ? { k, smooth: false } : { k: ui, smooth: true };
}

/**
 * The panel in parent: { el, update(view) → its text, text, slots, stepFor(n) }. view: { phase ('choose' | 'act'),
 * steps (stepsOf), page, shift (Shift held), doing (stopNow's), nowMs, belief (beliefOf's record), ticks
 * (createTicks()), hidden }. paintCard(belief) → the card's pixels (the stage's paintWeaponCard), or null;
 * onPick(step) a row clicked (main.js sends it as a tapped digit would); labelOf(actionId) an action's words
 * (shooting.js LABELS), for the running step's sub-steps. 0.0.7: view.distance (a course at distance: the card's
 * turrets shown), view.line (the KD line you are on: its dope), view.hold (the stop's hold, { xMil, yMil }).
 */
export function createSteps(parent, { label = (a) => a, paintCard = null, onPick = null, labelOf = (id) => id } = {}) {
  const doc = globalThis.document;
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(doc.createElement(tag), props); n.append(...kids.filter(k => k !== null && k !== undefined && k !== false)); return n; };
  const root = el('div', { className: 'steps', hidden: true });
  const cardBox = el('div', { className: 'wcard' }), cardCanvas = el('canvas', { className: 'wcard-pic' }), caption = el('div', { className: 'wcard-cap' });
  cardBox.style.setProperty('--card-w', String(CARD_W)); cardBox.style.setProperty('--card-h', String(CARD_H));
  // (0.0.9: the step last run and its marks over the card's top)
  const lastEl = el('div', { className: 'wc-last', hidden: true });
  cardBox.append(cardCanvas, caption, lastEl);
  let lastSeen = { sig: null, t0: 0 };
  const list = el('div', { className: 'steplist' });
  root.append(cardBox, list);
  parent.append(root);
  let sigRows = null, sigCard = null, slots = [], rowsEls = [], bar = null, text = '', cardK = null, hovered = null;
  // (every step the panel has shown, by id: the one running leaves stepsOf's list as it changes the gun, LOAD once the magazine is in)
  const known = new Map();

  function update(v = {}) {
    if (v.hidden || !v.steps) { root.hidden = true; text = ''; return ''; }
    root.hidden = false;
    // (the card: repainted only when the belief it shows changes; its size at a whole number of device pixels)
    const fit = cardFit(v.ui ?? 1, globalThis.devicePixelRatio || 1), k = fit.k;
    if (k !== cardK) { cardK = k; cardCanvas.style.width = `${CARD_W * k}px`; cardCanvas.style.height = `${CARD_H * k}px`; cardCanvas.style.imageRendering = fit.smooth ? 'auto' : ''; }
    const far = { distance: !!v.distance, line: v.line ?? null, hold: v.hold ?? null, zeroing: v.zeroing ?? null };
    const model = weaponCardModel(v.belief, far);
    const cs = JSON.stringify([BELIEF_FIELDS.map(k => v.belief?.[k]), far]);
    if (cs !== sigCard) {
      sigCard = cs;
      let drawn = false;
      try { drawn = !!paintCard && putPixels(cardCanvas, paintCard(v.belief, far)); } catch (e) { console.warn('the weapon card was not painted', e); }
      cardCanvas.hidden = !drawn;
      // (the card's picture says it all, its marks and its count included; the words only stand in when it can't be painted)
      caption.hidden = drawn;
      caption.replaceChildren(...[el('span', { className: `wc-mode ${model.mode === 'SAFE' ? 'safe' : 'live'}`, textContent: model.mode }),
        el('span', { className: `wc-rounds${model.chamber === '?' || model.count === '?' ? ' unknown' : ''}`, textContent: model.line.split(' · ')[1] ?? '' }),
        model.far ? el('span', { className: 'wc-far', textContent: model.far }) : null,
        model.locked ? el('span', { className: 'wc-locked', textContent: 'LOCKED' }) : null,
        model.stoppage ? el('span', { className: 'wc-stop', textContent: model.stoppage }) : null].filter(Boolean));
      cardBox.title = model.words;
      cardBox.dataset.text = model.line;
    }
    // (a reflex card waiting: the weapon card alone, at its place at the left, the card in the rest of STEPS beside it,
    // so what you believe of the rifle stays in sight while you decide (the design review's: the card hid it))
    root.classList.toggle('cardonly', !!v.cardOnly);
    if (v.cardOnly) { if (sigRows !== 'cardonly') { list.replaceChildren(); sigRows = 'cardonly'; slots = []; rowsEls = []; } text = model.line; return text; }
    for (const st of v.steps) known.set(st.id, st);
    while (known.size > 64) known.delete(known.keys().next().value);
    const doing = v.phase === 'act' ? v.doing ?? null : null;
    // (0.0.9: the step last run with its marks on the card, LAST_SHOW_MS from when it ended, gone once another runs)
    const lt = v.ticks?.last, marks = lt && (lt.ended || lt.halted) ? lt.marks.filter(Boolean).join('') : '';
    const nowT = globalThis.performance?.now?.() ?? 0;
    if (marks) { const sg = `${lt.step}|${marks}|${lt.who}`; if (sg !== lastSeen.sig) lastSeen = { sig: sg, t0: nowT }; }
    const showLast = !!marks && !doing && nowT - lastSeen.t0 < LAST_SHOW_MS;
    const lastText = showLast ? `${known.get(lt.step)?.label ?? labelOf(lt.step)} ${marks}` : '';
    if (lastEl.dataset.text !== lastText) { lastEl.dataset.text = lastText; lastEl.textContent = lastText; lastEl.classList.toggle('bad', marks.includes('✗')); }
    lastEl.hidden = !showLast;
    // (a step running, the chained wait apart (any step chosen cuts it, so its panel stays): the running view)
    if (doing && doing.kind !== 'wait') return running(v, doing, model);
    const panel = panelOf(v.steps, { page: v.page ?? 0 });
    slots = panel.slots;
    const rs = JSON.stringify(['panel', !!v.shift, panel.page, panel.pages, doing?.step ?? null, doing?.chain ?? null, panel.slots.map(s => [s.key, s.step.id, s.step.label, s.step.ms, s.step.rushMs, s.step.odds, s.step.routine, s.step.off, s.step.warn ?? null, s.step.cmd, s.step.subs?.length ?? 0, roundOdds(s.step), s.step.lead ?? false, s.step.shaking ? [s.step.shaking.v, s.step.shaking.band] : null, lastMarks(v.ticks, s.step.id), bundleDots(s.step)]), v.chaos?.sum ?? null]);
    if (rs !== sigRows) {
      sigRows = rs;
      bar = null;
      rowsEls = panel.slots.map(slot => row(slot, v, doing));
      if (panel.more) rowsEls.push(el('div', { className: 'step more' }, el('kbd', { textContent: '0' }), el('span', { className: 'label', textContent: `more · ${panel.page + 1}/${panel.pages}` })));
      list.replaceChildren(...rowsEls);
      root.classList.toggle('acting', !!doing);
      text = [model.line, ...panel.slots.map(s => rowText(s, { shift: v.shift })), panel.more ? `0 more · ${panel.page + 1}/${panel.pages}` : null].filter(Boolean).join(' | ');
    }
    if (bar && doing) bar.style.width = `${Math.round(progress(doing, v.nowMs) * 100)}%`;
    return text;
  }
  // (how far a doing has gone, 0 to 1: its sub-steps done and the share of the current one, on the game clock)
  function progress(d, nowMs) {
    const n = Math.max(1, d.list?.length ?? 1), i = Math.max(0, d.i ?? 0), from = d.subFromMs ?? d.fromMs, to = d.untilMs;
    const k = Number.isFinite(from) && Number.isFinite(to) && to > from ? Math.max(0, Math.min(1, ((nowMs ?? from) - from) / (to - from))) : 0;
    return Math.min(1, (i + k) / n);
  }
  // (the running view: the step's name and tempo, its sub-steps as ticks with their words, its time gone; the tap is
  // retired (0.0.8, COMBAT §25.6.4): a Pair, a Hammer or a Triple is a row chosen while time stands still, so Fire's
  // recovery offers nothing)
  function running(v, d, model) {
    const st = known.get(d.step) ?? { id: d.step, kind: d.kind, label: labelOf(d.step) };
    // (0.0.12: a bundle running: its lanes, not its sub-steps)
    if (d.kind === 'bundle' || Array.isArray(d.beats)) return runningBundle(v, d, st, model);
    const subs = d.list ?? st.subs?.map(x => x.id) ?? [d.step];
    // (0.0.10: Breathe has no roll to tick: its counts fill as they are breathed)
    const breathe = isBreathe(d.step), marks = breathe ? subs.map((_, i) => (i < (d.i ?? 0) ? '•' : '·')) : v.ticks?.of(d.step, subs.length) ?? subs.map(() => '·');
    const subWord = (i) => (breathe ? BREATHE_COUNTS[i] ?? labelOf(subs[i]) : subWords(st, subs, i, labelOf));
    const fire = null;
    slots = [];
    const rs = JSON.stringify(['run', d.step, d.tempo, d.i, marks.join(''), !!fire]);
    if (rs !== sigRows) {
      sigRows = rs;
      bar = el('i', { className: 'bar' });
      const tempo = d.tempo && d.tempo !== 'normal' ? d.tempo : null;
      rowsEls = [el('div', { className: `running-view ${d.kind ? kindClass(d.kind) : ''}${breathe ? ' breathe' : ''}` },
        el('div', { className: 'rv-head' }, el('span', { className: 'rv-name', textContent: st.label }), tempo ? el('span', { className: `rv-tempo ${tempo}`, textContent: tempo }) : null),
        subs.length > 1 ? el('div', { className: 'rv-subs' }, ...subs.map((id, i) => el('span', { className: `rv-sub${i === d.i ? ' now' : ''}${marks[i] === '✗' ? ' bad' : ''}` }, el('b', { textContent: marks[i] }), ` ${subWord(i)}`))) : null,
        el('span', { className: 'track' }, bar))];
      list.replaceChildren(...rowsEls);
      root.classList.add('acting');
      text = [model.line, `running: ${st.label}${subs.length > 1 ? ` ${subs.map((id, i) => `${marks[i]} ${subWord(i)}`).join(', ')}` : ''}`].filter(Boolean).join(' | ');
    }
    bar.style.width = `${Math.round(progress(d, v.nowMs) * 100)}%`;
    return text;
  }
  // (0.0.12: the running bundle, alone: its name and tempo, its four lanes of glyphs, a bar of its time on the game clock)
  function runningBundle(v, d, st, model) {
    // (the row's own label where the panel listed it; bundleNow's where it names the bundle in words, never an id)
    const bn = v.bundle ?? null, lanes = laneRows(bn, d), idLike = (t) => !t || /[>:]/.test(String(t)) && !/\s/.test(String(t));
    const label = [known.has(d.step) ? st.label : null, bn?.label, st.label, labelOf(d.step)].find(t => !idLike(t)) ?? st.label ?? d.step;
    slots = [];
    const rs = JSON.stringify(['bundle', d.step, d.tempo, label, lanes.map(l => [l.ch, l.glyphs.map(g => g.glyph).join('')])]);
    if (rs !== sigRows) {
      sigRows = rs;
      bar = el('i', { className: 'bar' });
      const tempo = d.tempo && d.tempo !== 'normal' ? d.tempo : null;
      const laneEls = lanes.flatMap(l => [el('span', { className: 'rv-lane-name', textContent: l.name }),
        el('span', { className: 'rv-lane' }, ...l.glyphs.map(g => el('b', { className: g.glyph === '▸' ? 'now' : g.glyph === '✗' ? 'bad' : '', textContent: `${g.glyph} ` })))]);
      rowsEls = [el('div', { className: 'running-view bundle' },
        el('div', { className: 'rv-head' }, el('span', { className: 'rv-name', textContent: label }), tempo ? el('span', { className: `rv-tempo ${tempo}`, textContent: tempo }) : null),
        el('div', { className: 'rv-lanes' }, ...laneEls),
        el('span', { className: 'track' }, bar))];
      list.replaceChildren(...rowsEls);
      root.classList.add('acting');
      text = [model.line, `running: ${label} ${lanes.map(l => `${l.name} ${l.glyphs.map(g => g.glyph).join('')}`).join(' ')}`].join(' | ');
    }
    const from = bn?.fromMs ?? d.fromMs, to = bn?.untilMs ?? d.untilMs;
    const k = Number.isFinite(from) && Number.isFinite(to) && to > from ? Math.max(0, Math.min(1, ((v.nowMs ?? from) - from) / (to - from))) : 0;
    bar.style.width = `${Math.round(k * 100)}%`;
    return text;
  }
  // (a row: its key, its label (two lines at most), and at its right its time over its odds or its reason;
  // the chained wait's row marked as it runs, its time gone as a bar along its foot)
  function row(slot, v, doing) {
    const s = slot.step, isRunning = !!doing && doing.step === s.id, odds = oddsText(s), t = timeText(s, v);
    // (0.0.9: the step last run, its marks after its name until another is chosen)
    const done = lastMarks(v.ticks, s.id);
    const dots = bundleDots(s);
    const lab = el('span', { className: 'label' }, el('span', { className: 'name', textContent: s.label }, done ? el('span', { className: `lasttry${done.includes('✗') ? ' bad' : ''}`, textContent: ` ${done}` }) : null),
      dots ? el('span', { className: 'dots' }, ...dots.split('│').flatMap((part, i) => (i ? [el('span', { className: 'seam', textContent: '│' }), part] : [part]))) : null);
    const shaking = isShaking(s);
    const rounds = () => el('span', { className: 'odds rounds' }, ...s.rounds.map(r => { const o = el('span', { className: `round ${r.part === 'head' ? 'head' : 'torso'}`, textContent: Number.isFinite(r.odds) ? `${Math.round(r.odds * 100)}%` : '?' }); o.style.setProperty('--k', String(Number.isFinite(r.odds) ? r.odds : 0)); return o; }));
    const timeEl = t ? el('span', { className: `time${v.shift && Number.isFinite(s.rushMs) ? ' rushed' : ''}`, textContent: t }) : null;
    // (0.0.9: a shaking row: its time and its odds on one line, the amber mark under them (marked, never struck), so the
    // row keeps its height; three lines had run out of it at 1600 × 900)
    const meta = shaking
      ? el('span', { className: 'meta shake' }, el('span', { className: 'line1' }, timeEl, isShotRow(s) ? rounds() : odds ? el('span', { className: 'odds', textContent: odds }) : null), el('span', { className: 'why warn shake', textContent: `! ${SHAKING}` }))
      : el('span', { className: 'meta' }, timeEl,
        s.off ? el('span', { className: 'why', textContent: s.off }) : s.warn ? el('span', { className: 'why warn', textContent: `! ${warnWords(s.warn)}` })
          // (a shot row: each round's odds, a meter under each, the head's marked: graphics beside the numbers)
          : isShotRow(s) ? rounds()
          : odds ? el('span', { className: `odds${s.routine ? ' routine' : ''}`, textContent: odds }) : null);
    const kids = [el('kbd', { textContent: slot.key }), lab, meta];
    const r = el('div', { className: `step ${kindClass(s.kind)}${isFree(s) ? ' variant' : ''}${s.off ? ' off' : ''}${s.warn && !s.off ? ' warned' : ''}${shaking ? ' shaking' : ''}${s.cmd ? ' cmd' : ''}${s.lead ? ' leads' : ''}${s.first ? ' first' : ''}${isRunning ? ' running' : ''}`, title: rowTitle(s, { label, chaos: v.chaos ?? null }) }, ...kids);
    r.dataset.step = s.id; r.dataset.key = slot.key;
    if (done) r.dataset.last = done;
    if (onPick && !s.off) r.addEventListener('click', () => onPick(s));
    // (the row under the pointer: a shot row's parts stand over the target as a plate (main.js), the plaque for a row's parts)
    r.addEventListener('mouseenter', () => { hovered = s.id; });
    r.addEventListener('mouseleave', () => { if (hovered === s.id) hovered = null; });
    if (isRunning) {
      if (doing.chain) r.append(el('span', { className: 'wait', textContent: 'waiting for the tower' }));
      bar = el('i', { className: 'bar' });
      r.append(el('span', { className: 'track' }, bar));
    }
    return r;
  }
  return {
    el: root, update,
    get text() { return root.hidden ? '' : text; },
    /** The slots shown now: [{ key, digit, step }]. */
    get slots() { return slots; },
    /** The step under the pointer now (its id), or null. */
    get hovered() { return root.hidden || !slots.some(x => x.step.id === hovered) ? null : hovered; },
    /** Flash a row (a struck step chosen: its reason lit for FLASH_MS). */
    flash(id) {
      const r = rowsEls.find(x => x.dataset?.step === id);
      if (!r) return false;
      r.classList.add('refused');
      setTimeout(() => r.classList.remove('refused'), FLASH_MS);
      return true;
    },
    /** The step on a digit now (n 0 to 9), or 'more' for the pager, or null. */
    stepFor(n) {
      const key = String(n);
      const s = slots.find(x => x.key === key);
      if (s) return s.step;
      return key === '0' && rowsEls.some(r => r.classList.contains('more')) ? 'more' : null;
    },
  };
}
