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
// 2026-11-13, the shoot house's rework R7 (VIEWS §7.8; COMBAT §25.19.7; the user's "group them by type ... with top of the head core
// gameplay options being always visible and accessible (even if grayed out, like hammer if you only have one bullet)", 2026-11-11):
// the paged list is gone from the HUD. The rows are the sim's model (src/sim/arms/groups.js modelOf: five groups of fixed slots,
// the core five, the situation's five) laid out by the layout played (viewOf: A drawers, B banks, C the situation's five and the
// fan; &panel= or olympus.panel, C until the user scores P1 to P3), in the same two columns of five, with a head at their left
// (the situation's name, the open group's, HOME) and in B the banks' keycaps at their right. A row the situation could offer
// and cannot take now is greyed, never removed, with its badge at its right edge (badgeEl: → and the remedy's key, ▮ the
// rounds, MKS a gate, ▲▲ a rung, a hand, a struck silhouette, a padlock, a struck eye, ✓), its reason in words on its hover.
// The navigation is the panel's own state (nav: the open drawer, bank or fan group, its third level), reset when the stop
// changes; down(key) moves it, entryFor(key) is what a key does now (main.js sends the row, or T's tap for NEXT).
import { CARD_W, CARD_H } from './layout.js';
import { badgeOf, modelOf, viewOf, autoNav, badgeKey, keyPathOf, DEFAULT_LAYOUT, LAYOUTS, CORE_WORDS, GROUP_WORDS, FAN_KEY, GROUPS } from '../../sim/arms/groups.js';
import { distanceParts, dialWords } from '../../art/weaponcard.js';
// (the panel's numbering is the sim's (src/sim/arms/panel.js), so the DI's line can name the digit a row is on: re-exported here)
import { PANEL_KEYS, FIXED_KINDS, isFixed, FIXED_MAX, FIXED_REPEAT, isGated, gatedRow, panelList, panelOf, isShotRow } from '../../sim/arms/panel.js';
import { markOf as simMarkOf } from '../../sim/combat/stepper.js';
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
/** The badges drawn as pictures (12 × 12, the row's text colour; the strike in the HUD's red): a hand, a struck silhouette, a padlock, a struck eye. */
export const BADGE_SVG = Object.freeze({
  hand: '<svg viewBox="0 0 12 12" aria-label="by hand first"><path d="M3.5 11V6M5.5 11V3M7.5 11V3.5M9.5 11V6M3.5 11h6" fill="none" stroke="currentColor"/></svg>',
  issue: '<svg viewBox="0 0 12 12" aria-label="not issued"><rect x="2" y="4" width="8" height="4" fill="none" stroke="currentColor"/><path d="M1.5 10.5L10.5 1.5" stroke="#c0564e" stroke-width="1.5"/></svg>',
  lock: '<svg viewBox="0 0 12 12" aria-label="locked"><rect x="2.5" y="5.5" width="7" height="5" fill="currentColor"/><path d="M4 5.5V4a2 2 0 0 1 4 0v1.5" fill="none" stroke="currentColor"/></svg>',
  none: '<svg viewBox="0 0 12 12" aria-label="nothing to act on"><path d="M1 6c1.5-2.5 3-3.5 5-3.5S9.5 3.5 11 6c-1.5 2.5-3 3.5-5 3.5S2.5 8.5 1 6z" fill="none" stroke="currentColor"/><circle cx="6" cy="6" r="1.4" fill="currentColor"/><path d="M2 10.5L10 1.5" stroke="#c0564e" stroke-width="1.5"/></svg>',
});

// ---- 2026-11-15 (the keys role): layout C drawn as the user's pick, P3 (samples/panel, ★ 100 for P3-j: "That idea is probably
// the best proposal if we can make the controls work cleanly") ----
// The band: two rows of six tiles, the situation's tile (its picture and name) and 1 to 5 above, the Tab tile ("held: more") and
// the core's 6 to 0 below, each core tile tagged with its picture and word (SHOT, AIM, FIX, MUZZLE, and T on NEXT); a tile is its
// key and badge, its name on two lines, its time and odds at its foot. Tab held: the fan, a half-wheel of the five groups at the
// left (the open one lit), the group's card (its key, picture, name and half: OUTSIDE A DOOR, IN THE ROOM), its nine in two columns
// of five and "Tab let go". Under --ui 1 (1024 × 768) a tile says one word (shortName) and its time is left to the hover, as the
// sample's small views. The DI's row (the line's row: its act's, or the row its words name) is edged in brass wherever it is.
/** The pictures of the situations, the groups and the core (12 × 12, the tile's text colour; a strike in the HUD's red). */
export const ICON_SVG = Object.freeze({
  door: '<svg viewBox="0 0 12 12"><rect x="3" y="1.5" width="6" height="9.5" fill="none" stroke="currentColor"/><circle cx="7.4" cy="6.6" r="0.8" fill="currentColor"/></svg>',
  inner: '<svg viewBox="0 0 12 12"><path d="M1.5 1.5h9v9" fill="none" stroke="currentColor"/><rect x="5" y="4" width="3.5" height="6.5" fill="none" stroke="currentColor"/></svg>',
  room: '<svg viewBox="0 0 12 12"><path d="M1.5 1.5v9h9" fill="none" stroke="currentColor"/><path d="M3.5 8.5l5-5M6 3.5h2.5V6" fill="none" stroke="currentColor"/></svg>',
  contact: '<svg viewBox="0 0 12 12"><circle cx="6" cy="6" r="3.8" fill="none" stroke="currentColor"/><path d="M6 0.5v3M6 8.5v3M0.5 6h3M8.5 6h3" stroke="currentColor"/></svg>',
  stoppage: '<svg viewBox="0 0 12 12"><path d="M1 4.5h9v2H6l-1 3H3l0.5-3H1z" fill="none" stroke="currentColor"/><path d="M2 11L11 1.5" stroke="#c0564e" stroke-width="1.5"/></svg>',
  tower: '<svg viewBox="0 0 12 12"><path d="M3 11.5V1.5l6.5 2.2L3 6" fill="none" stroke="currentColor"/></svg>',
  kd: '<svg viewBox="0 0 12 12"><circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor"/><circle cx="6" cy="6" r="2" fill="none" stroke="currentColor"/><circle cx="6" cy="6" r="0.6" fill="currentColor"/></svg>',
  line: '<svg viewBox="0 0 12 12"><path d="M1 10.5h10M3 10.5V4M9 10.5V4" fill="none" stroke="currentColor"/><circle cx="6" cy="4.5" r="2" fill="none" stroke="currentColor"/></svg>',
  FIRE: '<svg viewBox="0 0 12 12"><circle cx="6" cy="6" r="3.8" fill="none" stroke="currentColor"/><path d="M6 0.5v3M6 8.5v3M0.5 6h3M8.5 6h3" stroke="currentColor"/></svg>',
  DRILL: '<svg viewBox="0 0 12 12"><rect x="3" y="1.5" width="6" height="9.5" fill="none" stroke="currentColor"/><circle cx="7.4" cy="6.6" r="0.8" fill="currentColor"/></svg>',
  GUN: '<svg viewBox="0 0 12 12"><path d="M0.5 4.5h10v2H6.5l-1 3.5h-2l0.5-3.5h-3.5z" fill="none" stroke="currentColor"/></svg>',
  BODY: '<svg viewBox="0 0 12 12"><circle cx="6" cy="2.5" r="1.6" fill="none" stroke="currentColor"/><path d="M6 4.5v4M3 6.5h6M6 8.5l-2 3M6 8.5l2 3" fill="none" stroke="currentColor"/></svg>',
  TEAM: '<svg viewBox="0 0 12 12"><circle cx="4" cy="3.5" r="1.5" fill="none" stroke="currentColor"/><circle cx="8.5" cy="3.5" r="1.5" fill="none" stroke="currentColor"/><path d="M1.5 10.5c0-3 5-3 5 0M6 10.5c0-3 5-3 5 0" fill="none" stroke="currentColor"/></svg>',
  shot: '<svg viewBox="0 0 12 12"><circle cx="6" cy="6" r="3.8" fill="none" stroke="currentColor"/><circle cx="6" cy="6" r="0.9" fill="currentColor"/></svg>',
  aim: '<svg viewBox="0 0 12 12"><path d="M1 6c1.5-2.5 3-3.5 5-3.5S9.5 3.5 11 6c-1.5 2.5-3 3.5-5 3.5S2.5 8.5 1 6z" fill="none" stroke="currentColor"/><circle cx="6" cy="6" r="1.4" fill="currentColor"/></svg>',
  fix: '<svg viewBox="0 0 12 12"><path d="M2 10l5.2-5.2" stroke="currentColor" stroke-width="1.6"/><path d="M7 2.2a2.6 2.6 0 1 0 2.8 2.8L8.4 5.2 6.8 3.6z" fill="none" stroke="currentColor"/></svg>',
  muzzle: '<svg viewBox="0 0 12 12"><path d="M2 2l7.5 7.5M9.5 4.5v5h-5" fill="none" stroke="currentColor"/></svg>',
  next: '<svg viewBox="0 0 12 12"><path d="M2 2l4 4-4 4M6.5 2l4 4-4 4" fill="none" stroke="currentColor"/></svg>',
});
/** The half's words on the fan's DRILL card. */
export const HALF_WORDS = Object.freeze({ out: 'OUTSIDE A DOOR', in: 'IN THE ROOM' });
/** One word a key under --ui 1 (P3's small views: "Stack", "Point", "Open", "Kick"), by group and slot; the core's and the rest by shortName. */
export const SHORT_WORDS = Object.freeze({
  FIRE: [null, 'Pair', 'Hammer', 'Triple', 'Failure', 'Head', 'Fire', 'Aim', 'Breathe', 'Line'],
  DRILL_OUT: [null, 'Stack', 'Point', 'Open', 'Kick', 'Breach', 'Flash', 'Enter', 'Read', 'Hold'],
  DRILL_IN: [null, 'Watch', 'Point', 'Clear!', 'Long', 'Mark', 'Out', 'Next', 'Hold', 'Clear it'],
  GUN: [null, 'Reload', 'Down', 'Pistol', 'Offline', 'Safe', 'Finger', 'Check', 'Command', 'Hands'],
  BODY: [null, 'High', 'Stance', 'Kneel', 'Prone', 'Cover', 'Stop', 'Wait', 'Sling', 'Low'],
  TEAM: [null, 'Cover', null, null, null, null, 'Challenge', 'Engage', null, null],
});
const WORD_SHORT = Object.freeze({ 'IMMEDIATE ACTION': 'IA', 'MAKE READY': 'READY', 'SHOW CLEAR': 'CLEAR', 'Off safe': 'Off safe', 'Top up': 'Top up', 'Rifle up': 'Rifle', 'Gun down': 'Down', 'Transition: pistol': 'Pistol', 'Nothing to fix': 'Nothing' });
/** A tile's one word (P3's small views): its slot's (SHORT_WORDS, by its group and DRILL's half), else its row's or words' first word. */
export function shortName(e, half = null) {
  const g = e?.group === 'DRILL' ? (half === 'in' ? 'DRILL_IN' : 'DRILL_OUT') : e?.group;
  // (the row's own words first where they have a short of their own (a slot's second row: Rifle up on Transition's), then the slot's)
  const w = String(e?.row?.label ?? e?.words ?? '').trim();
  if (WORD_SHORT[w]) return WORD_SHORT[w];
  for (const [k, v] of Object.entries(WORD_SHORT)) if (w.startsWith(`${k} `) || w.startsWith(`${k},`) || w.startsWith(`${k}:`)) return v;
  const bySlot = !e?.core && g && Number.isInteger(e?.slot) ? SHORT_WORDS[g]?.[e.slot] : null;
  if (bySlot) return bySlot;
  return w.length <= 8 ? w : (w.split(/[\s,:]+/)[0] || w);
}

const secs = (ms) => (Number.isFinite(ms) ? `${(Math.max(0, ms) / 1000).toFixed(1)} s` : '');
const secs2 = (ms) => (Math.max(0, ms) / 1000).toFixed(2);
/** A shot row's odds, round by round in order: [0.95, 0.95, 0.75]. */
export const roundOdds = (s) => (isShotRow(s) ? s.rounds.map(r => r.odds) : []);
/** A step's odds as the row says them: 'routine', '85%', a shot row's every round '95% 95% 75%', or '' where no roll is in doubt. */
export function oddsText(step) {
  if (!step) return '';
  // (a round or a step whose natural 1 would be caught reads "sure" (VIEWS §7.4, SKILLS §5.1))
  if (isShotRow(step)) return step.rounds.map(r => (Number.isFinite(r.odds) ? (r.odds >= 1 ? 'sure' : `${Math.round(r.odds * 100)}%`) : '?')).join(' ');
  if (step.routine) return 'routine';
  if (step.sure) return 'sure';
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
/** A sub-step's mark, the sim's one helper (stepper.js markOf): ✓ passed, ◦ routine, ~ a natural 1 caught, ★ a natural 20, ! a stoppage, ✗ only a failure that cost something. */
export const markOf = simMarkOf;
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
 * turrets shown), view.line (the KD line you are on: its dope), view.hold (the stop's hold, { xMil, yMil }). 0.0.12:
 * view.finish, the gun's finish (src/data/finishes.js), read by the caller from the item, passed to paintCard(belief, far, finish).
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
  let sigRows = null, sigCard = null, slots = [], rowsEls = [], bar = null, text = '', cardK = null, hovered = null, cardLine = '';
  // (R7: the model, the layout, the view, and where the player is in it: nav (an open drawer, bank or the fan's group, its third
  // level), reset where the stop changes (navKey); fanHeld, Tab held in layout C)
  let pm = null, layout = DEFAULT_LAYOUT, view = null, nav = {}, navKey = null, fanHeld = false, watchStep = 0, small = false, diRow = null;
  // (every step the panel has shown, by id: the one running leaves stepsOf's list as it changes the gun, LOAD once the magazine is in)
  const known = new Map();

  function update(v = {}) {
    if (v.hidden || !v.steps) { root.hidden = true; text = ''; return ''; }
    cardLine = '';
    root.hidden = false;
    // (the card: repainted only when the belief it shows changes; its size at a whole number of device pixels)
    const fit = cardFit(v.ui ?? 1, globalThis.devicePixelRatio || 1), k = fit.k;
    if (k !== cardK) { cardK = k; cardCanvas.style.width = `${CARD_W * k}px`; cardCanvas.style.height = `${CARD_H * k}px`; cardCanvas.style.imageRendering = fit.smooth ? 'auto' : ''; }
    const far = { distance: !!v.distance, line: v.line ?? null, hold: v.hold ?? null, zeroing: v.zeroing ?? null };
    const model = weaponCardModel(v.belief, far);
    cardLine = model.line;
    // (0.0.12: the gun's finish, its colours on the card: the caller's, read from the item by id, never from the belief)
    const finish = v.finish ?? null;
    const cs = JSON.stringify([BELIEF_FIELDS.map(k => v.belief?.[k]), far, finish]);
    if (cs !== sigCard) {
      sigCard = cs;
      let drawn = false;
      try { drawn = !!paintCard && putPixels(cardCanvas, paintCard(v.belief, far, finish)); } catch (e) { console.warn('the weapon card was not painted', e); }
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
    // (the model once, laid out by the layout played; the navigation reset to the layout's own where the stop changes)
    layout = LAYOUTS.includes(v.layout) ? v.layout : DEFAULT_LAYOUT;
    const sk = `${layout}|${v.stopKey ?? ''}`;
    if (sk !== navKey) { navKey = sk; watchStep = 0; nav = {}; }
    pm = modelOf(v.steps, { act: v.act ?? null, actLabel: v.actWords ?? null, watch: watchStep });
    if (nav.auto === undefined) nav = { ...autoNav(pm, layout), auto: true };
    if (nav.group && !pm.groups[nav.group]) nav = { auto: true };
    view = viewOf(pm, layout, { ...nav, fan: layout === 'c' && fanHeld });
    slots = view.keys.filter(k => k.entry?.row && !k.entry.stand && k.entry.core !== 'next').map(k => ({ key: k.key, digit: Number(k.key), step: k.entry.row }));
    // (2026-11-15: layout C as its sample, P3: the band in tiles, Tab's fan with its wheel and the group's card; one word a key under --ui 1)
    small = (v.ui ?? 1) < 1; diRow = v.diRow ?? null;
    const form = layout === 'c' && view.level === 'band' ? 'tiles' : layout === 'c' && fanHeld ? 'fan' : 'list';
    const rs = JSON.stringify(['groups', layout, form, small, diRow, !!v.shift, view.level, view.head, doing?.step ?? null, doing?.chain ?? null, view.banks, view.keys.map(k => sigOf(k, v)), v.chaos?.sum ?? null, form === 'fan' ? nav.group ?? null : null]);
    if (rs !== sigRows) {
      sigRows = rs;
      bar = null;
      rowsEls = [];
      const kids = [];
      const at = (n, c, r) => { n.style.gridColumn = String(c); n.style.gridRow = String(r); return n; };
      if (form === 'tiles') {
        kids.push(at(sitTile(view), 1, 1), at(tabTile(), 1, 2));
        view.keys.forEach((k, i) => { const e = at(tile(k, v, doing, i, form), 2 + (i % 5), 1 + Math.floor(i / 5)); rowsEls.push(e); kids.push(e); });
      } else if (form === 'fan') {
        kids.push(wheelEl(view), groupCard(view));
        view.keys.forEach((k, i) => { const e = at(tile(k, v, doing, i, form), 3 + Math.floor(i / 5), 1 + (i % 5)); rowsEls.push(e); kids.push(e); });
        if (view.keys.length < 10) kids.push(at(letGoTile(), 4, 5));
      } else {
        if (view.head) kids.push(headEl(view));
        view.keys.forEach((k, i) => { const e = tile(k, v, doing, i, form); rowsEls.push(e); kids.push(e); });
        if (view.banks) kids.push(banksEl(view));
      }
      list.replaceChildren(...kids);
      list.classList.add('grouped');
      list.dataset.layout = layout; list.dataset.level = view.level; list.dataset.form = form;
      root.classList.toggle('small', small);
      root.classList.toggle('acting', !!doing);
      text = [cardLine, `${view.head?.name ?? ''}:`, ...view.keys.map(k => tileText(k, v)).filter(Boolean), view.banks ? view.banks.map(b => `${b.key} ${GROUP_WORDS[b.group]}`).join(' ') : null].filter(Boolean).join(' | ');
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
  function row(slot, v, doing, entry = null) {
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
        // (R7: a struck row's badge where its reason has one, its words on the hover; the words where it has none)
        s.off ? (badgeEl(entry?.badge ?? badgeOf(s.off)) ?? el('span', { className: 'why', textContent: s.off })) : s.warn ? el('span', { className: 'why warn', textContent: `! ${warnWords(s.warn)}` })
          // (a shot row: each round's odds, a meter under each, the head's marked: graphics beside the numbers)
          : isShotRow(s) ? rounds()
          : odds ? el('span', { className: `odds${s.routine ? ' routine' : ''}`, textContent: odds }) : null);
    const kids = [el('kbd', { textContent: slot.key }), lab, meta];
    // (R7: the hover leads with the row's own words, whole where the tile cuts them short)
    const hover = rowTitle(s, { label, chaos: v.chaos ?? null });
    const r = el('div', { className: `step ${kindClass(s.kind)}${isFree(s) ? ' variant' : ''}${s.off ? ' off' : ''}${s.warn && !s.off ? ' warned' : ''}${shaking ? ' shaking' : ''}${s.cmd ? ' cmd' : ''}${s.lead ? ' leads' : ''}${s.first ? ' first' : ''}${isRunning ? ' running' : ''}`, title: entry ? `${s.label}${hover ? `: ${hover}` : ''}` : hover }, ...kids);
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
  // ---- R7: the tiles of the grouped panel ----
  // (a key's signature for the redraw: what its tile shows)
  function sigOf(k, v) {
    const e = k.entry;
    if (!e) return [k.key];
    const st = e.row;
    return [k.key, e.core ?? null, e.tab ?? null, e.count ?? null, !!e.dot, !!e.deep, !!e.home, !!e.more, e.page ?? null, e.words ?? null, e.badge?.t ?? null,
      e.core === 'next' ? [e.actLabel, !!e.live] : null,
      st ? [st.id, st.label, st.ms, st.rushMs, st.odds, st.routine, st.off, st.warn ?? null, st.cmd, roundOdds(st), st.lead ?? false, st.shaking ? [st.shaking.v, st.shaking.band] : null, lastMarks(v.ticks, st.id), bundleDots(st)] : null];
  }
  // (a key's words in the panel's text, the tests' and the report's: '4 Kick door · 1.2 s', '6 FIRE 4', '9 The line ▸ 3', '0 NEXT: Stack up')
  function tileText(k, v) {
    const e = k.entry;
    if (!e) return null;
    if (e.tab) return `${k.key} ${e.words ?? GROUP_WORDS[e.tab]} ${e.count}${e.dot ? ' •' : ''}`;
    if (e.home) return `${k.key} ◂ home`;
    if (e.more) return `${k.key} more · ${e.page + 1}/${e.pages}`;
    if (e.deep && !e.row) return `${k.key} ${e.words ?? '▸'} ${e.count ?? ''}`.trim();
    if (e.core === 'next') return `${k.key} NEXT: ${e.live ? e.actLabel ?? 'T' : 'nothing'}`;
    if (!e.row) return e.words ? `${k.key} (${e.words})` : null;
    const t = rowText({ key: k.key, step: e.row }, { shift: v.shift });
    return e.core ? `${t} [${CORE_WORDS[e.core]}]` : t;
  }
  // (the head at the columns' left: the situation's name (C), the open group's (its third level ▸), HOME (A), Tab's fan)
  function headEl(vw) {
    const h = vw.head, kind = h.kind;
    const n = el('div', { className: `ghead ${kind}${vw.level === 'deep' ? ' deep' : ''}`, title: kind === 'situation' ? `The situation: ${h.name}. Its five on 1 to 5; the core on 6 to 0; hold ${FAN_KEY} for the groups.` : kind === 'fan' ? `${FAN_KEY} held: a digit picks the group, a second the row.` : kind === 'group' ? `${h.name}: its slots on 1 to 9.` : 'The core on 1 to 5, the groups on 6 to 0.' });
    n.append(el('span', { className: 'gname', textContent: kind === 'fan' ? FAN_KEY : h.name }));
    n.style.gridColumn = '1'; n.style.gridRow = '1 / span 5';
    return n;
  }
  // (B's banks at the columns' right: R C B F, each its group, its live count and the DI's dot)
  function banksEl(vw) {
    const n = el('div', { className: 'gbanks' });
    for (const b of vw.banks) {
      const k = el('div', { className: `gbank${b.open ? ' open' : ''}${b.dot ? ' dot' : ''}`, title: `${b.key}: ${GROUP_WORDS[b.group]}, ${b.count} live${b.dot ? ', the DI\'s row is here' : ''}` },
        el('kbd', { textContent: b.key }), el('span', { className: 'gb-name', textContent: GROUP_WORDS[b.group].slice(0, 2) }));
      n.append(k);
    }
    n.style.gridColumn = '4'; n.style.gridRow = '1 / span 5';
    return n;
  }
  // ---- 2026-11-15: layout C's forms, as P3 ----
  const icon = (id, cls = 'icon') => { const n = el('span', { className: cls }); n.innerHTML = ICON_SVG[id] ?? ''; return n; };
  // (the situation's tile at the band's top left: its picture and its name, brass)
  function sitTile(vw) {
    const h = vw.head ?? {};
    return el('div', { className: 'step sit', title: `The situation: ${h.name}. Its five on 1 to 5; the core on 6 to 0; hold ${FAN_KEY} for the groups.` }, icon(pm?.situation?.hall ? 'room' : h.id ?? 'line'), el('span', { className: 'label' }, el('span', { className: 'name', textContent: h.name ?? '' })));
  }
  // (the Tab tile under it: "held: more")
  function tabTile() {
    return el('div', { className: 'step tabtile', title: `${FAN_KEY} held: the five groups, a digit the group, a second the row.` }, el('kbd', { textContent: FAN_KEY }), el('span', { className: 'label' }, el('span', { className: 'name', textContent: small ? 'more' : 'held: more' })));
  }
  // (Tab let go, the fan's last tile where the group leaves room)
  function letGoTile() {
    return el('div', { className: 'step tabtile letgo', title: `Let go of ${FAN_KEY}: back to the situation's five.` }, el('kbd', { textContent: FAN_KEY }), el('span', { className: 'label' }, el('span', { className: 'name', textContent: 'let go' })));
  }
  // (the fan's half-wheel: the five groups' keys and pictures round a half-disc, the open group's sector lit; SVG in the tile's units)
  function wheelEl(vw) {
    const open = vw.head?.kind === 'group' ? vw.head.group : null, R = 50, r0 = 12;
    const parts = [];
    GROUPS.forEach((g, i) => {
      const a0 = -Math.PI / 2 + (i * Math.PI) / 5, a1 = a0 + Math.PI / 5, am = (a0 + a1) / 2;
      const p = (a, rr) => `${(rr * Math.cos(a)).toFixed(2)} ${(rr * Math.sin(a)).toFixed(2)}`;
      const lit = g === open;
      parts.push(`<path d="M${p(a0, r0)} L${p(a0, R)} A${R} ${R} 0 0 1 ${p(a1, R)} L${p(a1, r0)} A${r0} ${r0} 0 0 0 ${p(a0, r0)} Z" class="sector${lit ? ' lit' : ''}"/>`);
      const [kx, ky] = p(am, 22).split(' ').map(Number), [ix, iy] = p(am, 38).split(' ').map(Number);
      parts.push(`<rect x="${(kx - 5.5).toFixed(2)}" y="${(ky - 5.5).toFixed(2)}" width="11" height="11" rx="1.5" class="cap${lit ? ' lit' : ''}"/><text x="${kx.toFixed(2)}" y="${(ky + 3).toFixed(2)}" class="capt${lit ? ' lit' : ''}">${i + 1}</text>`);
      parts.push(`<g transform="translate(${(ix - 5).toFixed(2)} ${(iy - 5).toFixed(2)}) scale(0.84)" class="gi${lit ? ' lit' : ''}">${(ICON_SVG[g] ?? '').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>`);
    });
    const n = el('div', { className: 'fanwheel', title: `${FAN_KEY} held: 1 FIRE, 2 DRILL, 3 GUN, 4 BODY, 5 TEAM` });
    n.innerHTML = `<svg viewBox="-2 -52 54 104" preserveAspectRatio="xMinYMid meet">${parts.join('')}</svg>`;
    n.style.gridColumn = '1'; n.style.gridRow = '1 / span 5';
    return n;
  }
  // (the fan's card beside the wheel: the open group's key, picture, name and half; before a group, the hint)
  function groupCard(vw) {
    const g = vw.head?.kind === 'group' ? vw.head.group : null;
    const n = g
      ? el('div', { className: 'gcard' }, el('div', { className: 'gc-top' }, el('kbd', { textContent: String(GROUPS.indexOf(g) + 1) }), icon(g)), el('span', { className: 'gc-name', textContent: `${GROUP_WORDS[g]}${vw.level === 'deep' ? ' ▸' : ''}` }), g === 'DRILL' && pm?.half ? el('span', { className: 'gc-half', textContent: HALF_WORDS[pm.half] }) : null)
      : el('div', { className: 'gcard none' }, el('span', { className: 'gc-name', textContent: FAN_KEY }), el('span', { className: 'gc-half', textContent: 'a digit: the group' }));
    n.style.gridColumn = '2'; n.style.gridRow = '1 / span 5';
    return n;
  }
  // (a tile: a row (a slot's, the core's, a third level's) drawn as v0.0.13's rows are, with its badge; a group's tab; a way in or out)
  function tile(k, v, doing, i, form = 'list') {
    const e = k.entry;
    let n;
    if (!e || (!e.row && !e.tab && !e.deep && !e.home && !e.more && e.core !== 'next')) {
      // (an empty slot keeps its number, and the words of what it holds where it has them: greyed, nothing to act on now)
      n = el('div', { className: `step empty${e?.words ? ' named' : ''}`, title: e?.words ? `${e.words}: nothing to act on now` : '' }, el('kbd', { textContent: k.key }), el('span', { className: 'label' }, el('span', { className: 'name', textContent: e?.words ?? '' })));
    } else if (e.tab) {
      n = el('div', { className: `step gtab${e.dot ? ' dot' : ''}`, title: `${GROUP_WORDS[e.tab]}: ${e.count} live${e.dot ? '; the DI\'s row is here' : ''}` },
        el('kbd', { textContent: k.key }), el('span', { className: 'label' }, el('span', { className: 'name', textContent: e.words ?? GROUP_WORDS[e.tab] })), el('span', { className: 'meta' }, el('span', { className: 'gcount', textContent: String(e.count) })));
      n.addEventListener('click', () => { down(k.key); onNav?.(); });
    } else if (e.home || e.more || (e.deep && !e.row)) {
      const words = e.home ? '◂ home' : e.more ? `more · ${e.page + 1}/${e.pages}` : e.words ?? '▸';
      n = el('div', { className: `step gway${e.empty ? ' empty' : ''}`, title: e.home ? 'Back to the band' : e.more ? 'The next nine' : `${e.count ?? 0} more` }, el('kbd', { textContent: k.key }), el('span', { className: 'label' }, el('span', { className: 'name', textContent: words })), e.deep ? el('span', { className: 'meta' }, el('span', { className: 'gcount', textContent: String(e.count ?? 0) })) : null);
      if (!e.empty) n.addEventListener('click', () => { down(k.key); onNav?.(); });
    } else if (e.core === 'next') {
      const st = e.row, live = !!e.live;
      const t = live && st ? timeText(st, v) : '';
      n = el('div', { className: `step core next${live ? '' : ' off'}`, title: live ? `NEXT: what T does now${st ? `, ${st.label}` : ''} (T tapped does the same)` : 'NEXT: T has nothing to do now' },
        el('kbd', { textContent: k.key }), el('span', { className: 'label' }, el('span', { className: 'name', textContent: live ? st?.label ?? e.actLabel ?? 'T' : 'T: nothing now' })),
        el('span', { className: 'meta' }, t ? el('span', { className: 'time', textContent: t }) : null, el('kbd', { className: 'tcap', textContent: 'T' })));
      if (live) n.addEventListener('click', () => onNext?.());
    } else {
      n = row({ key: k.key, step: e.row }, v, doing, e);
    }
    n.dataset.key = k.key;
    if (e?.core) { n.dataset.core = e.core; n.classList.add('core', `core-${e.core}`); }
    if (e?.group) n.dataset.group = e.group;
    // (C's tiles: the core's picture and word by the key; one word a key under --ui 1, the whole name on the hover; the DI's row edged)
    if (form !== 'list') {
      // (the core's picture by its key, and its word where the picture is not enough (FIX, MUZZLE), as P3; NEXT's T keycap there too)
      if (e?.core) {
        const tcap = e.core === 'next' ? n.querySelector('.meta .tcap') : null;
        const tag = el('span', { className: 'ctag' }, tcap, icon(e.core), e.core === 'fix' || e.core === 'muzzle' ? el('span', { className: 'cw', textContent: CORE_WORDS[e.core] }) : null);
        n.querySelector(':scope > kbd')?.after(tag);
      }
      else if (e?.tab) n.querySelector(':scope > kbd')?.after(icon(e.tab));
      const nm = n.querySelector('.label .name');
      // (the hover leads with the tile's whole name, where the tile cuts it (NEXT's said "NEXT: …" first))
      if (nm?.firstChild && e?.core === 'next' && !String(n.title).startsWith(nm.firstChild.textContent)) n.title = `${nm.firstChild.textContent}: ${n.title}`;
      if (small && nm?.firstChild && (e?.row || e?.words) && !e?.tab && !e?.more && !e?.home) { const w = e.core === 'next' && !e.live ? 'nothing' : e.core === 'next' ? shortName({ row: e.row, words: e.actLabel }) : shortName(e, pm?.half); if (!n.title) n.title = nm.textContent; nm.firstChild.textContent = w; }
    }
    const rid = e?.row?.id ?? null;
    if (diRow && rid && (rid === diRow || rid === String(diRow).split('>')[0]) && e.core !== 'next') n.classList.add('di');
    // (the head called for (the DI's row To the head: still up after the plate, the hostage), the other shots stand aside, dimmed,
    // so the old habit's 1 (a pair into the plate, Pairs and Bang before v0.0.14) is seen not to be it: the question of 2026-11-14;
    // the core's shot on 6 too, a round into the plate all the same)
    else if (/^shot:head(@|$)/.test(String(diRow ?? '')) && (/^shot:/.test(String(rid ?? '')) || (e?.core === 'shot' && rid === 'fire')) && (!e.core || e.core === 'shot')) n.classList.add('aside');
    n.style.gridColumn = String(2 + Math.floor(i / 5)); n.style.gridRow = String(1 + (i % 5));
    return n;
  }
  // (a struck row's badge: → and the remedy's key, ▮ the rounds, MKS a gate, ▲▲ a rung, a hand, a struck silhouette, a padlock, a struck eye, ✓)
  function badgeEl(b) {
    if (!b) return null;
    const n = el('span', { className: `badge b-${b.t}` });
    if (b.t === 'to') { const key = badgeKey(b, layout); n.append(el('span', { className: 'arrow', textContent: '→' }), el('kbd', { textContent: key ?? '?' })); n.dataset.key = key ?? ''; }
    else if (b.t === 'rounds') n.textContent = `▮${b.n}`;
    else if (b.t === 'gate' || b.t === 'note') n.textContent = b.text;
    else if (b.t === 'rung') n.textContent = `▲▲ ${b.n}`;
    else if (b.t === 'done') n.textContent = '✓';
    else n.innerHTML = BADGE_SVG[b.t] ?? '';
    return n;
  }
  /** Move the navigation by a key going down: a tab opens its group, a ▸ its third level, home and the pager; returns whether it moved. */
  function down(key) {
    const k = view?.keys.find(x => x.key === String(key)), e = k?.entry;
    if (!e) return false;
    if (e.tab) { nav = { group: e.tab, auto: true }; sigRows = null; return true; }
    if (e.deep && !e.row && !e.empty) { nav = { ...nav, group: e.group, deep: true, page: 0 }; sigRows = null; return true; }
    if (e.deep && !e.row) return true;
    if (e.home) { nav = { auto: true }; sigRows = null; return true; }
    if (e.more) { nav = { ...nav, page: (nav.page ?? 0) + 1 }; sigRows = null; return true; }
    return false;
  }
  let onNav = null, onNext = null;
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
    /** The step on a digit now (n 0 to 9), 'next' for NEXT (T's act), 'nav' for a tab or a way in or out, or null. */
    stepFor(n) {
      const e = view?.keys.find(x => x.key === String(n))?.entry ?? null;
      if (!e) return null;
      if (e.core === 'next') return e.live ? 'next' : null;
      if (e.row) return e.row;
      return e.tab || e.home || e.more || e.deep ? 'nav' : null;
    },
    /** What a key does now: { entry } (a row, NEXT, a tab…), or null. */
    entryFor(n) { return view?.keys.find(x => x.key === String(n))?.entry ?? null; },
    /** A key going down: the navigation moved (true), or not (false: a row's key, chosen on its tap or held). */
    down,
    /** After a row is chosen: a drawer, a bank and the fan's group close (VIEWS §7.8: "it closes after a choice"). */
    chosen() { if (nav.group || nav.deep) { nav = { auto: true }; sigRows = null; } },
    /** Q and D with nobody in sight: the one Watch row steps across the live hot spots (VIEWS §7.8.1); whether there was a Watch row to step. */
    stepWatch(d) { const live = (pm?.rows ?? []).filter(s => /^watch:/.test(s.id) && !s.off).length; if (live < 2) return false; watchStep += d; sigRows = null; return true; },
    /** Esc or Backspace: back to the band where a group is open; whether it was. */
    back() { if (!nav.group && !nav.deep) return false; nav = { auto: true }; sigRows = null; return true; },
    /** Layout B's banks by letter: its group's map, or back to the band where it is open. */
    bank(group) { nav = nav.group === group && !nav.deep ? { auto: true } : { group, auto: true }; sigRows = null; },
    /** Layout C's fan: Tab held (true) or let go (false: the fan and its group close). */
    fan(on) { if (fanHeld === !!on) return; fanHeld = !!on; if (!on) nav = { auto: true }; sigRows = null; },
    get fanHeld() { return fanHeld; },
    /** The layout drawn, its level and head: { layout, level, head, nav }. */
    get where() { return view ? { layout, level: view.level, head: view.head, nav: { ...nav } } : null; },
    /** The model of the rows shown (groups.js modelOf), or null. */
    get model() { return pm; },
    /** The keys a row is on now in the layout drawn (groups.js keyPathOf from the band), or null. */
    keysFor(id, { next = true } = {}) { return pm ? keyPathOf(pm, layout, id, { next }) : null; },
    /** The keys the DI's row is on by its own place (never NEXT), the row matched whole, else by its id before '>' ('aim>turner:5' → 'aim'), or null. */
    rowKeys(id) {
      if (!pm || !id) return null;
      const ids = [id, String(id).split('>')[0]];
      for (const x of ids) if (pm.rows.some(r => r.id === x)) return keyPathOf(pm, layout, x, { next: false });
      return null;
    },
    /** The keys of what is drawn now: [{ key, id, label, off, kind, core, group, tab }]. */
    get keys() { return (view?.keys ?? []).map(k => ({ key: k.key, id: k.entry?.row?.id ?? null, label: k.entry?.row?.label ?? k.entry?.words ?? null, off: k.entry?.row?.off ?? null, kind: k.entry?.row?.kind ?? null, core: k.entry?.core ?? null, group: k.entry?.group ?? null, tab: k.entry?.tab ?? null, live: k.entry?.core === 'next' ? !!k.entry.live : !!k.entry?.row && !k.entry.row.off })); },
    /** Hooks: a tab clicked (onNav), NEXT clicked (onNext, main.js: T's tap). */
    set onNav(fn) { onNav = fn; }, set onNext(fn) { onNext = fn; },
  };
}
