// OLYMPUS sample: the step panel redesigned, the designer's three layouts of rework1 drawn over the same four true moments, for the user to score (VIEWS §7.4; COMBAT §25.6.1).
//
// The user's ask of 2026-11-11: "If We're going to keep this system of numbered options, we need to find a way to group them
// by type and find a clever way to make this manageable with top of the head core gameplay options being always visible and
// accessible (even if grayed out, like hammer if you only have one bullet)." The designer's proposal (rework1, panel-design
// proposal.md) gives every row stepsOf offers a fixed group and slot (FIRE, DRILL with its two halves outside a door and inside
// a room, GUN, BODY, TEAM), a core of five on fixed keys (the shot, Aim ⇄ Hold, Fix: the remedy for the gun's state, Muzzle:
// Low ⇄ High ready, NEXT: T's act), and greys a row the situation could offer with a badge that says why and points to the
// fix (→ a key, ▮ a count of rounds, MKS a gate, ▲▲ a rung, a struck silhouette for what is not issued, a padlock, a struck
// eye for nothing to act on; ✓ is the sample's for a thing already done, my call). Three ways to show it:
//   ?layout=a  "Home and drawers": the core on 1 to 5, the five groups as drawers on 6 to 0, a digit inside the drawer;
//              FIRE's drawer opens by itself at a contact's pause (not with a stoppage: the sample's reading, my call);
//   ?layout=b  "The fixed ten and the letter banks": the shots on 1 to 5 and the core on 6 to 0 in every scene, the other
//              groups in banks on R (the room), C (the gun), B (the body) and F (friends);
//   ?layout=c  "Five that follow the situation": 1 to 5 the situation's five, named at the band's left (AT THE DOOR,
//              CONTACT, STOPPAGE, THE TOWER), 6 to 0 the core, Tab held opens a fan of the groups.
// ?state= is the moment, each a true one captured from the game (samples/panel/moments.json, made by the bots on the user's
// seed 1489397426 and the 25 m line's 48213: stepsOf's rows, the believed gun, the DI's line): 'stack' (a private, rung 1,
// stacked on room 2's door, "Open it. Pull."), 'contact' (a corporal at the hall's man with one round left, "Press.", the
// hall's dead end), 'stoppage' (the corporal's click on the instructor's dummy in room 2, "Immediate action."), 'load' (the
// 25 m line under the tower's LOAD), and 'open' (the stack's moment with the second level held open: A's DRILL drawer, B's
// bank R, C's fan on DRILL). Rows today's stepsOf offers are drawn from it (their labels shortened to the proposal's verbs,
// their times and odds the game's own, through the hud's timeText and oddsText); the rows the proposal adds (Stack up, take
// point; Breach; Transition: pistol; the TEAM rows; Fix; Stop here) are drawn in the state the proposal gives them, with no
// time where the game has none yet. ?win=1600 (1600 × 900, --ui 1.25) or 1024 (1024 × 768, --ui 0.85): the bottom of that
// window at its own pixels, the STEPS and INSTINCT rectangles where layout.js puts them, the weapon card painted by the
// stage's paintWeaponCard and fitted as the hud fits it (cardFit), over a 16 px/m floor drawn at the picture's scale with a
// metre's grid. The picture is drawn at its own size and scaled up by a whole number, so the gallery shoots it crisply;
// window.__report.frame is its size.
import { paintWeaponCard } from '../../src/art/weaponcard.js';
import { cardFit, timeText, oddsText, bundleDots } from '../../src/ui/hud/steps.js';
import { uiScale, RECTS, MARGIN_PX, GAP_PX, CARD_W, CARD_H } from '../../src/ui/hud/layout.js';
import { frameFor } from '../../src/render/scale.js';

const params = new URLSearchParams(location.search);
const LAYOUT = ['a', 'b', 'c'].includes(params.get('layout')) ? params.get('layout') : 'c';
/** The moments, and the second level held open on the stack's. */
export const STATES = Object.freeze(['stack', 'contact', 'stoppage', 'load', 'open']);
const STATE = STATES.includes(params.get('state')) ? params.get('state') : 'stack';
/** The windows the views are shot for (their --ui from layout.js uiScale). */
export const WINDOWS = Object.freeze({ 1024: [1024, 768], 1600: [1600, 900] });
const WIN = WINDOWS[params.get('win')] ? params.get('win') : '1600', [WW, WH] = WINDOWS[WIN];
const U = uiScale(WW, WH), SMALL = U < 1;
const DATA = await (await fetch('./moments.json')).json();
const M = DATA.moments[STATE === 'open' ? 'stack' : STATE];

// ---- the tones (src/ui/style.css's tokens) ----
const C = Object.freeze({
  hud: 'rgba(20, 21, 28, 0.80)', edge: '#353947', line: '#4c5262', paper: '#f4efe6', glass: '#dfe2e8', muted: '#8f96a6', faint: '#6a7182',
  time: '#b8bdc8', brass: '#e7b84a', brassBg: 'rgba(231, 184, 74, 0.10)', red: '#c0564e', redText: '#f0a090', green: '#8fd19e', blue: '#3b6296',
  tile: 'rgba(255, 255, 255, 0.035)', tileOff: 'rgba(255, 255, 255, 0.015)', fire: '#f6d0c8', card: '#2b2e3a', well: '#1b1c24',
});
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

// ---- the pixel icons ('#' the main tone, '+' the accent; drawn one picture pixel a pixel) ----
const ICONS = {
  fire: ['......#......', '....#####....', '...#..#..#...', '..#.......#..', '.#.........#.', '.#.........#.', '###...+...###', '.#.........#.', '.#.........#.', '..#.......#..', '...#..#..#...', '....#####....', '......#......'],
  door: ['###########', '#.........#', '#.#######.#', '#.#.....#.#', '#.#.....#.#', '#.#######.#', '#.........#', '#.......++#', '#.........#', '#.#######.#', '#.#.....#.#', '#.#######.#', '#.........#', '###########'],
  gun: ['######..', '#++++#..', '######..', '#....#..', '#....#..', '.#....#.', '.#....#.', '.#....#.', '..#....#', '..#....#', '..#....#', '..######', '..######'],
  body: ['..######....', '..#....#....', '..#....#....', '..#....#....', '..#....#....', '..#....##...', '..#......##.', '..#........#', '..#........#', '..##########', '..#+#+#+#+##'],
  team: ['..###......###..', '.#...#....#...#.', '.#...#....#...#.', '.#...#....#...#.', '..###......###..', '................', '.#####....#####.', '#.....#..#.....#', '#.....#..#.....#', '#.....#..#.....#'],
  aim: ['...#####...', '..#.....#..', '.#..###..#.', '#..#...#..#', '#..#.+.#..#', '#..#...#..#', '.#..###..#.', '..#.....#..', '...#####...'],
  fix: ['........###', '.......#..#', '......#..#.', '.....#..#..', '....#..#...', '...#..#....', '..#..#.....', '.#..#......', '#..#.......', '#.#........', '##.........'],
  muzzle: ['###.........', '.###........', '..###.......', '...###......', '....###..#..', '.....###.#..', '......####..', '.......###..', '....######..'],
  next: ['#...#....', '##..##...', '###.###..', '########.', '#########', '########.', '###.###..', '##..##...', '#...#....'],
  room: ['#############', '#...........#', '#...........#', '#...........#', '#.....+.....#', '#...........#', '#...........#', '#...........#', '#####...#####'],
  jam: ['###########', '#....#....#', '#....#....#', '#....#....#', '#....#....#', '#.........#', '#....#....#', '###########'],
  tower: ['..#######..', '..#.....#..', '..#######..', '...#...#...', '...#...#...', '...##.##...', '...#.#.#...', '...##.##...', '..#..#..#..', '..##...##..', '.#.#...#.#.', '#..#...#..#'],
  paper: ['#########', '#.......#', '#..###..#', '#.#...#.#', '#.#.+.#.#', '#.#...#.#', '#..###..#', '#.......#', '#########', '....#....', '....#....'],
  man: ['....###....', '...#####...', '...#####...', '....###....', '..#######..', '.#########.', '###########', '###########', '###########', '###########', '###########'],
  round: ['.#.', '###', '###', '###', '###', '###', '+++'],
  chev: ['..#..', '.#.#.', '#...#'],
  hand: ['..#.#.#.', '..#.#.#.', '#.#.#.#.', '#.#####.', '#######.', '.######.', '..####..'],
  pistol: ['#########', '#########', '####.....', '###......', '###......'],
  charge: ['########', '#++++++#', '########', '...#....', '....##..', '......##'],
  flash: ['.##...', '####..', '.##.#.', '####..', '####..', '####..', '.##...'],
  lock: ['..###..', '.#...#.', '.#...#.', '#######', '###.###', '###.###', '#######'],
  eye: ['..#####..', '.#.....#.', '#...#...#', '.#.....#.', '..#####..'],
  check: ['......#', '.....#.', '#...#..', '.#.#...', '..#....'],
};
// (where the shots of each shot row strike the silhouette: the shot's own graphic, 2 × 2 marks)
const SHOT_MARKS = { pair: [[3, 6], [6, 6]], hammer: [[4, 6], [5, 8]], triple: [[2, 6], [5, 8], [7, 6]], failure: [[3, 6], [6, 6], [4, 1]], head: [[4, 1]], fire: [[4, 7]] };

// ---- the picture ----
const m = Math.round(MARGIN_PX * U), gp = Math.round(GAP_PX * U);
const SW = Math.round(RECTS.STEPS.w * U), SH = Math.round(RECTS.STEPS.h * U), IH = Math.round(RECTS.INSTINCT.h * U);
const TOP = Math.round(14 * U), W = WW, H = TOP + SH + gp + IH + m;
const SX = Math.round((W - SW) / 2), SY = TOP, IY = SY + SH + gp;
const cv = document.getElementById('pic'), g = cv.getContext('2d');
cv.width = W; cv.height = H;
const px = (n) => Math.round(n * U);
const font = (size, weight = '') => { g.font = `${weight ? weight + ' ' : ''}${(size * U).toFixed(2)}px ${MONO}`; };

// the floor: the house's boards at 16 px/m as the picture scales them at this window, a metre's grid over it
function floor() {
  g.fillStyle = '#34302b'; g.fillRect(0, 0, W, H);
  const mPx = 16 * frameFor(WW, WH, 1, { res: [640, 360], resMax: [768, 430] }).scale;
  g.fillStyle = 'rgba(0, 0, 0, 0.18)';
  for (let x = (W / 2) % mPx; x < W; x += mPx) g.fillRect(Math.round(x), 0, 1, H);
  for (let y = H % mPx; y < H; y += mPx) g.fillRect(0, Math.round(y), W, 1);
  return mPx;
}
function rrect(x, y, w, h, r, fill, stroke = null, lw = 1) {
  g.beginPath(); g.roundRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(w) - 1, Math.round(h) - 1, r);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
}
function icon(name, x, y, main, accent = C.brass, k = 1) {
  const rows = ICONS[name];
  if (!rows) return { w: 0, h: 0 };
  for (let j = 0; j < rows.length; j++) for (let i = 0; i < rows[j].length; i++) {
    const ch = rows[j][i];
    if (ch === '.') continue;
    g.fillStyle = ch === '+' ? accent : main; g.fillRect(Math.round(x) + i * k, Math.round(y) + j * k, k, k);
  }
  return { w: Math.max(...rows.map(r => r.length)) * k, h: rows.length * k };
}
const iconW = (name, k = 1) => (ICONS[name] ? Math.max(...ICONS[name].map(r => r.length)) : 0) * k, iconH = (name, k = 1) => (ICONS[name]?.length ?? 0) * k;
/** The badges' pictures: two pixels a pixel where the interface is large (--ui 1.2 and over), one under. */
const BK = U >= 1.2 ? 2 : 1;
function shotIcon(kind, x, y, main) {
  icon('man', x, y, main);
  g.fillStyle = C.redText;
  for (const [i, j] of SHOT_MARKS[kind] ?? []) g.fillRect(Math.round(x) + i, Math.round(y) + j, 2, 2);
  return { w: 11, h: 11 };
}
function strike(x, y, w, h) { g.strokeStyle = C.red; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - 1, y + h + 1); g.lineTo(x + w + 1, y - 1); g.stroke(); }
function fitText(str, maxW) {
  str = String(str ?? '');
  if (g.measureText(str).width <= maxW) return str;
  while (str.length > 1 && g.measureText(str + '…').width > maxW) str = str.slice(0, -1);
  return str + '…';
}
function txt(str, x, y, { size = 12, colour = C.paper, weight = '', align = 'left', maxW = Infinity, base = 'middle' } = {}) {
  font(size, weight); g.fillStyle = colour; g.textAlign = align; g.textBaseline = base;
  const s = fitText(str, maxW); g.fillText(s, Math.round(x), Math.round(y));
  return g.measureText(s).width;
}
const textW = (str, size = 12, weight = '') => { font(size, weight); return g.measureText(String(str)).width; };
/** A keycap (the style sheet's kbd): its width. */
function kbd(k, x, y, { size = 11, lit = false, dim = false, pressed = false } = {}) {
  font(size); const tw = g.measureText(k).width, w = Math.max(Math.round(size * U * 1.6), Math.round(tw + px(8))), h = Math.round(size * U * 1.5) + 3;
  rrect(x, y, w, h, 3, pressed ? C.brass : lit ? 'rgba(231, 184, 74, 0.18)' : 'rgba(0, 0, 0, 0.25)', dim ? C.edge : lit || pressed ? C.brass : C.line);
  g.fillStyle = pressed ? '#1a1214' : dim ? C.faint : C.paper; g.fillRect(Math.round(x) + 1, Math.round(y) + h - 2, w - 2, 1);
  g.fillStyle = pressed ? 'rgba(0,0,0,0.25)' : C.line; g.fillRect(Math.round(x) + 1, Math.round(y) + h - 2, w - 2, 1);
  txt(k, x + w / 2, y + (h - 1) / 2, { size, colour: pressed ? '#1a1214' : dim ? C.faint : C.paper, align: 'center' });
  return w;
}
const kbdH = (size = 11) => Math.round(size * U * 1.5) + 3;

// ---- the model: every row by group and slot (the proposal's §1.1), from the moment's true rows ----
const RUNG = { recruit: 0, private: 1, cpl: 2, sgt: 3, raider: 4, tierone: 4 };
const steps = M.steps, by = (id) => steps.find(s => s.id === id), find = (re) => steps.find(s => re.test(s.id));
const range = M.scene === 'test-handling', rung = RUNG[M.tier] ?? 1, B = M.belief, stoppage = !!B.stoppage;
const contact = /CONTACT/.test(M.ctx), inside = /:inside/.test(M.ctx), stacked = /stacked/.test(M.ctx), doorOpen = /:open:/.test(M.ctx);
const row = (o) => ({ label: '', short: '', icon: null, time: '', odds: '', state: 'live', badge: null, brass: false, toggle: false, dots: '', real: false, ...o });
function badgeOf(off) {
  const w = String(off);
  if (/^aim first/.test(w)) return { t: 'to', ref: 'aim' };
  if (/off safe first|a stoppage|charge first|chamber|RELOAD first/.test(w)) return { t: 'to', ref: 'fix' };
  let x = /^(one|two|three) left/.exec(w);
  if (x) return { t: 'rounds', n: { one: 1, two: 2, three: 3 }[x[1]] };
  x = /^Marksmanship (\d+)/.exec(w);
  if (x) return { t: 'gate', text: `MKS ${x[1]}` };
  if (/locked/.test(w)) return { t: 'lock' };
  if (/nothing in the frame|no one|no man/.test(w)) return { t: 'none' };
  return { t: 'note', text: w };
}
function fromStep(s, o = {}) {
  if (!s) return null;
  const r = row({ label: s.label, short: s.label, time: timeText(s), odds: oddsText(s), real: true, dots: bundleDots(s), ...o });
  if (s.off && !o.state) { r.state = 'off'; r.badge = badgeOf(s.off); }
  return r;
}
const none = (label, short, o = {}) => row({ label, short, state: 'off', badge: { t: 'none' }, ...o });
const shot = (k, label, short) => {
  const s = by(`shot:${k}@moving`) ?? by(`shot:${k}`) ?? by(`shot:${k}@planted`);
  // (a shot row stepsOf leaves out under a stoppage stays, struck with the remedy's key: rows are never removed)
  return s ? fromStep(s, { label, short, shot: k }) : stoppage ? row({ label, short, shot: k, state: 'off', badge: { t: 'to', ref: 'fix' } }) : none(label, short, { shot: k, odds: '' });
};

const FIRE = [null,
  shot('pair', 'Pair', 'Pair'), shot('hammer', 'Hammer', 'Hammer'), shot('triple', 'Triple', 'Triple'), shot('failure', 'Failure drill', 'Failure'),
  // (To the head: offered today only when called for; the proposal never removes a row the situation could offer)
  by('shot:head') || by('shot:head@moving') ? shot('head', 'To the head', 'Head') : contact && !stoppage ? row({ label: 'To the head', short: 'Head', shot: 'head' }) : none('To the head', 'Head', { shot: 'head' }),
  fromStep(by('fire'), { label: range ? 'Fire' : 'Fire (one)', short: 'Fire', shot: 'fire' }),
  by('aim') ? fromStep(by('aim'), { label: 'Aim ⇄ Hold', short: 'Aim', icon: 'aim', toggle: true }) : fromStep(by('hold') ?? by('contact:hold'), { label: 'Hold ⇄ Aim', short: 'Hold', icon: 'aim', toggle: true }),
  by('breathe') ? fromStep(by('breathe'), { label: 'Breathe', short: 'Breathe' }) : row({ label: 'Breathe', short: 'Breathe', time: '4.0 s' }),
  none('The line ▸', 'Line'),
];
const doorRow = (re) => steps.find(s => re.test(s.id) && !/closet/.test(s.id));
const DRILL_OUT = [null,
  find(/^drill:room:stack/) ? fromStep(find(/^drill:room:stack/), { label: 'Stack up', short: 'Stack' }) : row({ label: 'Stack up', short: 'Stack', state: stacked || doorOpen ? 'done' : 'live', badge: stacked || doorOpen ? { t: 'done' } : null, dots: '●│' }),
  row({ label: 'Stack up, take point', short: 'Point', dots: rung >= 2 ? '● ● │' : '● ●│' }),
  doorRow(/^door:(push|pull)/) ? fromStep(doorRow(/^door:(push|pull)/), { label: `Open (${doorRow(/^door:(push|pull)/).id.includes('pull') ? 'pull' : 'push'})`, short: 'Open', dots: '●│' }) : row({ label: 'Open', short: 'Open', state: doorOpen ? 'done' : 'off', badge: doorOpen ? { t: 'done' } : { t: 'none' } }),
  doorRow(/^door:kick/) ? fromStep(doorRow(/^door:kick/), { label: 'Kick door', short: 'Kick', dots: '●│' }) : none('Kick door', 'Kick'),
  row({ label: 'Breach', short: 'Breach', state: 'off', badge: { t: 'issue', item: 'charge' } }),
  rung < 2 ? row({ label: 'Flash, then enter', short: 'Flash', state: 'off', badge: { t: 'rung', n: 2 } }) : row({ label: 'Flash, then enter', short: 'Flash', state: 'off', badge: { t: 'issue', item: 'flash' } }),
  row({ label: rung <= 1 ? 'Enter: X, then walk' : rung === 2 ? 'Enter, your corner' : 'Clear the room', short: 'Enter', state: doorOpen ? 'live' : 'off', badge: doorOpen ? null : { t: 'to', ref: 'open' } }),
  doorRow(/^door:read/) ? fromStep(doorRow(/^door:read/), { label: 'Read the door', short: 'Read' }) : none('Read the door', 'Read'),
  row({ label: 'Hold it (not ours)', short: 'Hold' }),
];
const watch = find(/^(watch|look):/), inner = steps.find(s => /closet/.test(s.id));
const DRILL_IN = [null,
  watch ? fromStep(watch, { label: 'Watch your corner', short: 'Watch' }) : none('Watch your corner', 'Watch'),
  fromStep(find(/^drill:room:dominate/) ?? by('move:point'), { label: 'To your point', short: 'Point' }) ?? none('To your point', 'Point'),
  fromStep(by('call:clear'), { label: '"Clear!"', short: 'Clear!' }) ?? none('"Clear!"', 'Clear!'),
  row({ label: 'Go long', short: 'Long' }),
  fromStep(by('mark'), { label: 'Mark the room', short: 'Mark' }) ?? none('Mark the room', 'Mark'),
  row({ label: 'Coming out', short: 'Out' }),
  row({ label: 'To the next door', short: 'Next door' }),
  inner ? fromStep(steps.find(s => /^door:hold>.*closet/.test(s.id)), { label: 'Hold it (inner)', short: 'Hold' }) : none('Hold it (inner)', 'Hold'),
  inner ? row({ label: 'Clear it (inner)', short: 'Clear it' }) : none('Clear it (inner)', 'Clear it'),
];
const HANDS = steps.filter(s => /^(lockBack|magOut|reach@|port|observe|charge|tap|release)/.test(s.id));
const reloadRow = find(/^macro:reload/);
const GUN = [null,
  stoppage ? row({ label: 'Reload', short: 'Reload', state: 'off', badge: { t: 'to', ref: 'fix' } })
    : range ? row({ label: 'Reload', short: 'Reload', state: 'off', badge: { t: 'to', ref: 'next' } })
    : contact ? row({ label: 'Reload (speed)', short: 'Reload' })
    : row({ label: 'Reload', short: 'Reload', state: 'off', badge: { t: 'rounds', n: `${B.countApprox ? '≈' : ''}${B.count}` }, note: reloadRow ? 'today: Top up (the halfOrLess bug)' : '' }),
  stoppage ? row({ label: 'Gun down: knee, tap, rack', tl: 'Gun down: tap, rack', short: 'Gun down' }) : none('Gun down: knee, tap, rack', 'Gun down'),
  row({ label: 'Transition: pistol', short: 'Pistol', state: 'off', badge: { t: 'issue', item: 'pistol' } }),
  stoppage ? row({ label: 'Step to cover, clear', tl: 'To cover, clear', short: 'Cover' }) : none('Step to cover, clear', 'Cover'),
  fromStep(find(/^selector:/), { label: B.mode === 'safe' ? 'Off safe ⇄ Safe' : 'Safe ⇄ Off safe', short: B.mode === 'safe' ? 'Off safe' : 'Safe', toggle: true }),
  by('finger') ? fromStep(by('finger'), { label: 'Finger off ⇄ on', short: 'Finger', toggle: true }) : row({ label: 'Finger off ⇄ on', short: 'Finger', state: 'done', badge: { t: 'done' } }),
  fromStep(by('pressCheck'), { label: 'Check: press ⇄ mag', short: 'Check', toggle: true }) ?? none('Check: press ⇄ mag', 'Check'),
  range ? fromStep(by('macro:load'), { label: '◉ LOAD', short: '◉ LOAD', brass: true }) : none("The tower's command", 'Tower'),
  row({ label: `Hands ▸ ${HANDS.length}`, short: `Hands ${HANDS.length}`, state: HANDS.length ? 'live' : 'off' }),
];
const postureNow = M.posture, toPosture = postureNow === 'highReady' ? 'lowReady' : 'highReady';
const MUZZLE = fromStep(by(`posture:${toPosture}`) ?? by('posture:lowReady'), { label: toPosture === 'lowReady' ? 'Low ready' : 'High ready', short: toPosture === 'lowReady' ? 'Low' : 'High', icon: 'muzzle', cap: 'MUZZLE', toggle: true });
const BODY = [null,
  fromStep(by(`posture:${toPosture}`) ?? by('posture:lowReady'), { label: toPosture === 'lowReady' ? 'Low ⇄ High ready' : 'High ⇄ Low ready', short: toPosture === 'lowReady' ? 'Low' : 'High', toggle: true }),
  fromStep(by('drill:variant:stance') ?? by('gait:assault'), { label: 'Careful ⇄ Fast', short: 'Pace', time: '' }) ?? none('Careful ⇄ Fast', 'Pace'),
  fromStep(by('stance:kneel') ?? by('stance:stand'), { label: by('stance:kneel') ? 'Kneel ⇄ Stand' : 'Stand ⇄ Kneel', short: by('stance:kneel') ? 'Kneel' : 'Stand', toggle: true }),
  fromStep(by('stance:prone'), { label: 'Prone', short: 'Prone' }) ?? none('Prone', 'Prone'),
  range ? none('To cover', 'Cover') : row({ label: 'To cover', short: 'Cover' }),
  range ? none('Stop here', 'Stop') : row({ label: 'Stop here', short: 'Stop' }),
  fromStep(by('wait'), { label: by('wait')?.label ?? 'Wait', short: 'Wait' }),
  fromStep(by('stow'), { label: 'Sling it ⇄ Relaxed', short: 'Sling', toggle: true }) ?? none('Sling it ⇄ Relaxed', 'Sling'),
  null,
];
const mate = (label, short, live = !range) => (live ? row({ label, short }) : none(label, short));
const TEAM = [null,
  mate('Cover me', 'Cover me'), mate('Stack on me', 'On me', !range && !inside), mate('Hold the door', 'Hold door', !range && !inside), mate('On me (follow)', 'Follow'),
  mate('Ready (squeeze)', 'Ready', !range && stacked),
  fromStep(by('contact:challenge'), { label: 'Challenge', short: 'Challenge' }) ?? none('Challenge', 'Challenge'),
  mate('Short room', 'Short', !range && !inside), mate('Next man in', 'Next in', !range && !inside), mate('Status', 'Status'),
];
const GROUPS = Object.freeze([
  { id: 'FIRE', name: 'FIRE', icon: 'fire', bank: 'C', slots: FIRE },
  { id: 'DRILL', name: 'DRILL', icon: 'door', bank: 'R', slots: inside ? DRILL_IN : DRILL_OUT, half: inside ? 'INSIDE A ROOM' : 'OUTSIDE A DOOR' },
  { id: 'GUN', name: 'GUN', icon: 'gun', bank: 'C', slots: GUN },
  { id: 'BODY', name: 'BODY', icon: 'body', bank: 'B', slots: BODY },
  { id: 'TEAM', name: 'TEAM', icon: 'team', bank: 'F', slots: TEAM },
]);
const G = Object.fromEntries(GROUPS.map(x => [x.id, x]));

// the core: the shot, Aim ⇄ Hold, Fix, Muzzle, NEXT
const IA = by('macro:ia');
const FIX = stoppage ? fromStep(IA, { label: 'IMMEDIATE ACTION', short: 'IA', icon: 'fix', cap: 'FIX', state: 'live' })
  : contact ? row({ label: 'Reload (speed)', short: 'Reload', icon: 'fix', cap: 'FIX' })
  : range ? row({ label: 'the tower first', short: 'Fix', icon: 'fix', cap: 'FIX', state: 'off', badge: { t: 'to', ref: 'next' } })
  : row({ label: 'nothing to fix', short: 'Fix', icon: 'fix', cap: 'FIX', state: 'off', badge: { t: 'done' } });
const act = M.line?.act ? String(M.line.act).replace(/^stop:/, '') : null, actStep = act ? by(act) : null;
const tCan = !!actStep;
const NEXT = actStep ? fromStep(actStep, { label: actStep.kind === 'command' ? `◉ ${actStep.label}` : actStep.id.startsWith('door:pull') ? 'Open (pull)' : actStep.label, short: actStep.kind === 'command' ? actStep.label : 'Open', icon: 'next', cap: 'NEXT', brass: true })
  : stoppage ? fromStep(IA, { label: 'IMMEDIATE ACTION', short: 'IA', icon: 'next', cap: 'NEXT', brass: true, state: 'live' })
  : fromStep(by('fire'), { label: 'Fire (one)', short: 'Fire', icon: 'next', cap: 'NEXT', brass: true });
NEXT.tOff = !tCan;
const SHOT1 = range ? fromStep(by('fire'), { label: 'Fire', short: 'Fire', shot: 'fire' }) : FIRE[1];
// (the core's keys in each layout: A on 1 to 5, B and C on 6 to 0)
const CORE_KEY = LAYOUT === 'a' ? { shot: '1', fire: '1', aim: '2', fix: '3', muzzle: '4', next: '5' } : { shot: '6', fire: '6', aim: '7', fix: '8', muzzle: '9', next: '0' };

// the situation's five (layout C) and its name
const SIT = range ? { name: 'THE TOWER', icon: 'tower', five: [
  fromStep(by('macro:load'), { label: '◉ LOAD', short: 'LOAD', brass: true }),
  row({ label: 'MAKE READY', short: 'READY', state: 'off', badge: { t: 'key', k: '1' } }),
  none('UNLOAD', 'UNLOAD'), none('SHOW CLEAR', 'CLEAR'),
  row({ label: 'Stop: safe, finger off, low', tl: 'Stop', short: 'Stop', state: 'done', badge: { t: 'done' } }),
] } : stoppage ? { name: 'STOPPAGE', icon: 'jam', five: [GUN[2], GUN[3], GUN[4], row({ label: 'REMEDIAL', short: 'Remedial', state: 'off', badge: { t: 'to', ref: 'fix' } }), row({ label: 'Cover me (to the #2)', tl: 'Cover me (#2)', short: 'Cover me' })] }
  : contact ? { name: 'CONTACT', icon: 'fire', five: [FIRE[1], FIRE[2], FIRE[4], FIRE[5], TEAM[6]] }
  : inside ? { name: 'IN THE ROOM', icon: 'room', five: [DRILL_IN[1], DRILL_IN[2], DRILL_IN[3], DRILL_IN[6], DRILL_IN[7]] }
  : { name: 'AT THE DOOR', icon: 'door', five: DRILL_OUT.slice(1, 6) };

// the DI's line and the keys it names, by layout (the proposal: the line always names a key that works)
const NAMED = {
  stack: { a: ['7', '3'], b: ['R', '3'], c: ['3'] }, open: { a: ['7', '3'], b: ['R', '3'], c: ['3'] },
  contact: { a: ['6'], b: ['6'], c: ['6'] }, stoppage: { a: ['3'], b: ['8'], c: ['8'] }, load: { a: ['5'], b: ['0'], c: ['1'] },
}[STATE][LAYOUT];

// ---- the pieces ----
/** A badge at its right edge xr, centred on cy: its width. Opaque, whatever the row's opacity. */
function badge(b, xr, cy) {
  if (!b) return 0;
  g.globalAlpha = 1;
  const s = 10;
  if (b.t === 'to' || b.t === 'key') {
    const k = b.t === 'key' ? b.k : b.ref === 'open' ? '3' : CORE_KEY[b.ref] ?? '?';
    const kw = Math.max(Math.round(s * U * 1.6), Math.round(textW(k, s) + px(6))), kh = kbdH(s) - 2;
    const aw = textW('→', s);
    rrect(xr - kw, cy - kh / 2, kw, kh, 2, 'rgba(231, 184, 74, 0.14)', C.brass);
    txt(k, xr - kw / 2, cy, { size: s, colour: C.brass, align: 'center' });
    txt('→', xr - kw - 2, cy, { size: s, colour: C.brass, align: 'right' });
    return kw + aw + 2;
  }
  if (b.t === 'rounds') {
    const t = String(b.n), tw = textW(t, s + 1, 'bold');
    txt(t, xr, cy, { size: s + 1, colour: C.brass, align: 'right', weight: 'bold' });
    icon('round', xr - tw - 2 - iconW('round', BK), Math.round(cy - iconH('round', BK) / 2), C.brass, '#a07a2a', BK);
    return tw + 3 + iconW('round', BK);
  }
  if (b.t === 'gate' || b.t === 'note') {
    const tw = textW(b.text, s - 0.5);
    rrect(xr - tw - px(6), cy - px(7), tw + px(6), px(14), 2, null, C.line);
    txt(b.text, xr - px(3), cy, { size: s - 0.5, colour: C.muted, align: 'right' });
    return tw + px(6);
  }
  if (b.t === 'rung') {
    const t = String(b.n), tw = textW(t, s, 'bold');
    txt(t, xr, cy, { size: s, colour: C.brass, align: 'right', weight: 'bold' });
    const cw = iconW('chev', BK), ch = iconH('chev', BK);
    icon('chev', xr - tw - 3 - cw, Math.round(cy - ch - 1), C.brass, C.brass, BK); icon('chev', xr - tw - 3 - cw, Math.round(cy + 1), C.brass, C.brass, BK);
    return tw + 4 + cw;
  }
  const name = b.t === 'issue' ? b.item : b.t === 'lock' ? 'lock' : b.t === 'none' ? 'eye' : b.t === 'done' ? 'check' : b.t === 'hand' ? 'hand' : null;
  if (!name) return 0;
  const w = iconW(name, BK), h = iconH(name, BK);
  icon(name, xr - w, Math.round(cy - h / 2), b.t === 'done' ? C.green : C.muted, C.muted, BK);
  if (b.t === 'issue' || b.t === 'none') strike(xr - w, Math.round(cy - h / 2), w, h);
  return w;
}
/** A row's own picture: its shot's marks on the silhouette, or its icon. */
function rowIcon(r, x, y, colour) {
  if (r.shot) return shotIcon(r.shot, x, y, colour);
  if (r.icon) return icon(r.icon, x, y, colour);
  return { w: 0, h: 0 };
}
/** A tile: a core or situation key, big (its keycap, its picture, its verb, its time and odds). */
function tile(x, y, w, h, key, r, { named = false, tKey = false } = {}) {
  if (!r) return;
  const off = r.state !== 'live', pad = px(5);
  rrect(x, y, w, h, 3, r.brass ? C.brassBg : off ? C.tileOff : C.tile, named ? C.brass : C.edge, named ? 1.5 : 1);
  if (r.brass) { g.fillStyle = C.brass; g.fillRect(Math.round(x) + 1, Math.round(y) + 1, 2, Math.round(h) - 2); }
  let bw = badge(r.badge, x + w - pad, y + pad + kbdH() / 2);
  g.globalAlpha = off ? 0.4 : 1;
  // (a drill row's reach, its dots, up by the keycap where no badge is: the foot keeps the time and the odds)
  if (r.dots && !bw && !SMALL) bw = txt(r.dots, x + w - pad, y + pad + kbdH() / 2, { size: 9, colour: C.brass, align: 'right', maxW: w * 0.4 });
  let cx = x + pad + (r.brass ? 2 : 0);
  cx += kbd(key, cx, y + pad, { dim: off }) + px(4);
  if (tKey) { g.globalAlpha = r.tOff ? 0.35 : 1; const tw = kbd('T', cx, y + pad, { lit: !r.tOff }); if (r.tOff) strike(cx, y + pad, tw, kbdH()); g.globalAlpha = off ? 0.4 : 1; cx += tw + px(4); }
  const ic = r.shot || r.icon ? (r.shot ? 11 : iconW(r.icon)) : 0;
  if (ic && cx + ic < x + w - pad - bw - 2) {
    rowIcon(r, cx, y + pad + Math.round((kbdH() - (r.shot ? 11 : iconH(r.icon))) / 2), off ? C.muted : r.brass ? C.brass : C.glass);
    // (the core's caption beside its picture: FIX, MUZZLE, NEXT, where the tile has room)
    const capX = cx + ic + px(4);
    if (r.cap && capX + textW(r.cap, 9) < x + w - pad - bw - px(3)) txt(r.cap, capX, y + pad + kbdH() / 2, { size: 9, colour: r.brass ? C.brass : C.muted });
  }
  // the verb: two lines where the tile has room, one word at 1024
  const hasMeta = SMALL ? !off && !!r.odds : !!(r.time || (!off && r.odds));
  const ly = y + pad + kbdH() + px(2), size = 11.5, lh = size * U * 1.04, room = y + h - pad - (hasMeta ? px(10) : 0) - ly;
  const words = SMALL ? r.short : r.tl ?? r.label, maxW = w - pad * 2 - (r.brass ? 2 : 0);
  font(size); const parts = String(words).split(' '), lines = [];
  for (const p of parts) { const cur = lines.length ? lines[lines.length - 1] : null; if (cur !== null && g.measureText(`${cur} ${p}`).width <= maxW) lines[lines.length - 1] = `${cur} ${p}`; else lines.push(p); }
  const nLines = Math.max(1, Math.min(lines.length, Math.floor(room / lh + 0.1)));
  const shown = lines.slice(0, nLines); if (lines.length > nLines) shown[nLines - 1] = lines.slice(nLines - 1).join(' ');
  const col = off ? C.faint : r.shot ? C.fire : r.brass ? C.brass : C.paper;
  shown.forEach((l, i) => txt(l, x + pad + (r.brass ? 2 : 0), ly + lh * (i + 0.5), { size, colour: col, maxW }));
  // the time and the odds, under (at 1024 the time is the hover's; the shot's first odds stay)
  const my = y + h - pad - px(4);
  if (!SMALL && r.time) txt(r.time, x + pad + (r.brass ? 2 : 0), my, { size: 10, colour: C.time, maxW: w * 0.6 });
  if (r.odds && !off) txt(SMALL ? r.odds.split(' ')[0] : r.odds, x + w - pad, my, { size: 10, colour: r.odds === 'routine' ? C.muted : C.brass, align: 'right', maxW: SMALL ? w - pad * 2 : w * 0.5 });
  g.globalAlpha = 1;
  if (named) { g.fillStyle = C.brass; g.beginPath(); g.arc(Math.round(x + w - 4), Math.round(y + h - 4), 2.5, 0, Math.PI * 2); g.fill(); }
}
/** A list row (a drawer's, a bank's, the fan's): its keycap, its verb, its time, odds or dots, its badge. */
function listRow(x, y, w, h, key, r, { named = false } = {}) {
  if (!r) { g.globalAlpha = 0.3; kbd(key, x + px(3), y + (h - kbdH()) / 2, { dim: true }); g.globalAlpha = 1; return; }
  const off = r.state !== 'live';
  if (r.brass) { rrect(x, y + 1, w, h - 2, 2, C.brassBg); g.fillStyle = C.brass; g.fillRect(Math.round(x), Math.round(y) + 1, 2, Math.round(h) - 2); }
  if (named) rrect(x, y + 1, w, h - 2, 2, null, C.brass, 1.5);
  const cy = y + h / 2, bw = badge(r.badge, x + w - px(4), cy);
  g.globalAlpha = off ? 0.4 : 1;
  let cx = x + px(3) + (r.brass ? 2 : 0);
  cx += kbd(key, cx, cy - kbdH() / 2, { dim: off }) + px(5);
  const meta = SMALL ? '' : r.dots || (off ? '' : [r.time, r.odds].filter(Boolean).join(' · '));
  const mw = meta ? textW(meta, 9.5) : 0;
  const lw = x + w - px(4) - (bw ? bw + px(5) : 0) - (mw ? mw + px(6) : 0) - cx;
  txt(SMALL ? r.short : r.label, cx, cy, { size: 12, colour: off ? C.faint : r.shot ? C.fire : r.brass ? C.brass : C.paper, maxW: lw });
  if (meta) txt(meta, x + w - px(4) - (bw ? bw + px(5) : 0), cy, { size: 9.5, colour: r.dots ? C.brass : C.time, align: 'right' });
  g.globalAlpha = 1;
}
/** The two columns of a group's slots, 1 to 5 and 6 to 9, the close key at 0's place. */
function slotColumns(x, y, w, h, grp, { closeKey = '0', closeWords = '◂ home', named = null } = {}) {
  const cw = (w - px(6)) / 2, rh = h / 5;
  for (let i = 1; i <= 9; i++) {
    const col = i <= 5 ? 0 : 1, rI = i <= 5 ? i - 1 : i - 6;
    listRow(x + col * (cw + px(6)), y + rI * rh, cw, rh, String(i), grp.slots[i], { named: named === i });
  }
  const cx = x + cw + px(6), cy = y + 4 * rh;
  const kw = kbd(closeKey, cx + px(3), cy + (rh - kbdH()) / 2);
  txt(closeWords, cx + px(3) + kw + px(5), cy + rh / 2, { size: 11, colour: C.muted });
}
/** A group's title, left of its open slots: the picture, the name, the half, the key that opened it. */
function groupTitle(x, y, w, h, grp, opener) {
  rrect(x, y, w, h, 3, 'rgba(231, 184, 74, 0.07)', C.brass);
  let cy = y + px(6);
  const kw = kbd(opener, x + px(5), cy, { pressed: true });
  icon(grp.icon, x + px(5) + kw + px(5), cy + Math.round((kbdH() - iconH(grp.icon)) / 2), C.brass);
  cy += kbdH() + px(8);
  txt(grp.name, x + px(6), cy, { size: SMALL ? 12 : 14, colour: C.brass, weight: 'bold' });
  if (grp.half) {
    const parts = grp.half.split(' ');
    const half = [parts.slice(0, 1).join(' '), parts.slice(1).join(' ')];
    half.forEach((l, i) => txt(l, x + px(6), cy + px(15) + i * px(12), { size: 9.5, colour: C.muted, maxW: w - px(10) }));
  }
}

// ---- the layouts ----
const CW = Math.round(CARD_W * U);
const AX = SX + CW + px(6), AY = SY + px(5), AW = SX + SW - px(6) - AX, AH = SH - px(10);
const report = { layout: LAYOUT, state: STATE, win: Number(WIN), ui: U, moment: `${M.tier ?? 'range'} ${M.ctx}`, line: M.line?.text ?? null, keys: NAMED, rows: {} };

function layoutA() {
  const autoFire = contact && !stoppage;
  const open = STATE === 'open' ? G.DRILL : autoFire ? G.FIRE : null;
  if (open) {
    const tw = px(SMALL ? 70 : 96), opener = open === G.DRILL ? '7' : '6';
    groupTitle(AX, AY, tw, AH, open, opener);
    if (autoFire) txt('by itself', AX + px(6), AY + AH - px(9), { size: 9, colour: C.muted });
    const namedSlot = STATE === 'contact' ? 6 : STATE === 'open' ? 3 : null;
    slotColumns(AX + tw + px(6), AY, AW - tw - px(6), AH, open, { named: namedSlot });
    report.rows.open = open.id;
    return;
  }
  const homeH = Math.round((AH - px(5)) * 0.6), tabsH = AH - homeH - px(5), cw = (AW - 4 * px(5)) / 5;
  const core = [['1', SHOT1], ['2', FIRE[7]], ['3', FIX], ['4', MUZZLE], ['5', NEXT]];
  const namedKey = NAMED.length === 1 ? NAMED[0] : null;
  core.forEach(([k, r], i) => tile(AX + i * (cw + px(5)), AY, cw, homeH, k, r, { named: k === namedKey, tKey: k === '5' }));
  const tabs = [['6', G.FIRE], ['7', G.DRILL], ['8', G.GUN], ['9', G.BODY], ['0', G.TEAM]];
  tabs.forEach(([k, grp], i) => {
    const x = AX + i * (cw + px(5)), y = AY + homeH + px(5), live = grp.slots.filter(r => r && r.state === 'live').length, named = NAMED.length > 1 && NAMED[0] === k;
    rrect(x, y, cw, tabsH, 3, 'rgba(0, 0, 0, 0.22)', named ? C.brass : C.edge, named ? 1.5 : 1);
    const kw = kbd(k, x + px(5), y + (tabsH - kbdH()) / 2);
    const ix = x + px(5) + kw + px(5);
    icon(grp.icon, ix, y + Math.round((tabsH - iconH(grp.icon)) / 2), C.glass);
    const nx = ix + iconW(grp.icon) + px(5);
    txt(grp.name, nx, y + tabsH / 2 - (SMALL ? 0 : px(5)), { size: SMALL ? 10.5 : 12, colour: C.paper, weight: 'bold', maxW: x + cw - nx - px(4) });
    if (!SMALL) txt(`${live} live`, nx, y + tabsH / 2 + px(7), { size: 9.5, colour: C.muted });
    if (named) { g.fillStyle = C.brass; g.beginPath(); g.arc(Math.round(x + cw - 6), Math.round(y + 6), 3, 0, Math.PI * 2); g.fill(); }
  });
}
function layoutB() {
  const bankW = px(SMALL ? 38 : 50), tw = AW - bankW - px(5), rh = (AH - px(5)) / 2, cw = (tw - 4 * px(5)) / 5;
  const bankOpen = STATE === 'open' ? G.DRILL : null;
  if (bankOpen) {
    const tW = px(SMALL ? 70 : 96);
    groupTitle(AX, AY, tW, AH, bankOpen, 'R');
    slotColumns(AX + tW + px(6), AY, tw - tW - px(6), AH, bankOpen, { closeKey: 'Esc', closeWords: 'close', named: 3 });
  } else {
    const ten = [['1', FIRE[1]], ['2', FIRE[2]], ['3', FIRE[3]], ['4', FIRE[4]], ['5', FIRE[5]], ['6', FIRE[6]], ['7', FIRE[7]], ['8', FIX], ['9', MUZZLE], ['0', NEXT]];
    // (on a paper line the shots have no man: struck with the eye, and a digit never changes meaning)
    if (range) for (let i = 0; i < 5; i++) ten[i][1] = { ...ten[i][1], state: 'off', badge: { t: 'none' }, odds: '' };
    ten.forEach(([k, r], i) => tile(AX + (i % 5) * (cw + px(5)), AY + (i < 5 ? 0 : rh + px(5)), cw, rh, k, r, { named: NAMED.length === 1 && NAMED[0] === k, tKey: k === '0' }));
  }
  const banks = [['R', G.DRILL, 'ROOM'], ['C', G.GUN, 'GUN'], ['B', G.BODY, 'BODY'], ['F', G.TEAM, 'FRIENDS']], bh = (AH - 3 * px(4)) / 4, bx = AX + tw + px(5);
  banks.forEach(([k, grp, name], i) => {
    const y = AY + i * (bh + px(4)), live = grp.slots.filter(r => r && r.state === 'live').length, open = bankOpen === grp, named = NAMED[0] === k;
    rrect(bx, y, bankW, bh, 3, open ? 'rgba(231, 184, 74, 0.18)' : 'rgba(0, 0, 0, 0.22)', open || named ? C.brass : C.edge, named ? 1.5 : 1);
    const kw = kbd(k, bx + px(3), y + (bh - kbdH()) / 2, { pressed: open });
    if (!SMALL) icon(grp.icon, bx + px(3) + kw + px(3), Math.round(y + (bh - iconH(grp.icon)) / 2), open ? C.brass : C.glass);
    txt(String(live), bx + bankW - px(4), y + bh / 2, { size: 10, colour: C.muted, align: 'right' });
    if (named && !open) { g.fillStyle = C.brass; g.beginPath(); g.arc(Math.round(bx + bankW - 5), Math.round(y + 5), 2.5, 0, Math.PI * 2); g.fill(); }
    report.rows[`bank ${k}`] = `${name} ${live} live`;
  });
}
function layoutC() {
  const leftW = px(SMALL ? 62 : 80), tw = AW - leftW - px(5), rh = (AH - px(5)) / 2, cw = (tw - 4 * px(5)) / 5, tx = AX + leftW + px(5);
  if (STATE === 'open') {
    // the fan: the five groups as a half-wheel at STEPS' left, inside STEPS (never over the picture); DRILL picked
    const r = AH / 2, cx = AX, cy = AY + AH / 2, picked = 1;
    for (let i = 0; i < 5; i++) {
      const a0 = -Math.PI / 2 + (i * Math.PI) / 5, a1 = a0 + Math.PI / 5, lit = i === picked;
      g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, r, a0, a1); g.closePath();
      g.fillStyle = lit ? 'rgba(231, 184, 74, 0.22)' : 'rgba(0, 0, 0, 0.28)'; g.fill();
      g.strokeStyle = lit ? C.brass : C.line; g.lineWidth = 1; g.stroke();
      const am = (a0 + a1) / 2, grp = GROUPS[i], ix = cx + Math.cos(am) * r * 0.82, iy = cy + Math.sin(am) * r * 0.82;
      // (each wedge its digit, and its group's picture further out where the wedge has room)
      const kx = cx + Math.cos(am) * r * (SMALL ? 0.6 : 0.52), ky = cy + Math.sin(am) * r * (SMALL ? 0.6 : 0.52);
      kbd(String(i + 1), kx - px(7), ky - kbdH() / 2, { pressed: lit });
      if (!SMALL) icon(grp.icon, Math.round(ix - iconW(grp.icon) / 2), Math.round(iy - iconH(grp.icon) / 2), lit ? C.brass : C.glass);
    }
    g.fillStyle = C.well; g.beginPath(); g.arc(cx, cy, px(7), -Math.PI / 2, Math.PI / 2); g.fill();
    const fx = AX + r + px(6), tW = px(SMALL ? 60 : 84);
    groupTitle(fx, AY, tW, AH, G.DRILL, '2');
    slotColumns(fx + tW + px(6), AY, AX + AW - fx - tW - px(6), AH, G.DRILL, { closeKey: 'Tab', closeWords: 'let go', named: 3 });
    report.rows.fan = 'DRILL';
    return;
  }
  // the situation's name and picture, at the band's left
  rrect(AX, AY, leftW, rh, 3, 'rgba(231, 184, 74, 0.07)', C.brass);
  icon(SIT.icon, AX + px(5), AY + px(5), C.brass);
  const parts = SIT.name.split(' '), l1 = parts.length > 2 ? parts.slice(0, 2).join(' ') : parts[0], l2 = parts.length > 2 ? parts.slice(2).join(' ') : parts.slice(1).join(' ');
  txt(l1, AX + px(5), AY + rh - px(SMALL ? 16 : 20), { size: SMALL ? 9 : 10.5, colour: C.brass, weight: 'bold', maxW: leftW - px(8) });
  if (l2) txt(l2, AX + px(5), AY + rh - px(SMALL ? 7 : 8), { size: SMALL ? 9 : 10.5, colour: C.brass, weight: 'bold', maxW: leftW - px(8) });
  // the fan's key, under it
  const by2 = AY + rh + px(5);
  rrect(AX, by2, leftW, rh, 3, 'rgba(0, 0, 0, 0.22)', C.edge);
  const kw = kbd('Tab', AX + px(5), by2 + px(5));
  g.strokeStyle = C.muted; g.lineWidth = 1.5; g.beginPath(); g.arc(AX + px(5) + kw + px(10), by2 + px(5) + kbdH() / 2, px(5), -Math.PI / 2, Math.PI / 2); g.stroke();
  txt(SMALL ? 'more' : 'held: more', AX + px(5), by2 + rh - px(SMALL ? 9 : 11), { size: SMALL ? 9 : 10, colour: C.muted, maxW: leftW - px(8) });
  const namedKey = NAMED[0];
  SIT.five.forEach((r, i) => tile(tx + i * (cw + px(5)), AY, cw, rh, String(i + 1), r, { named: String(i + 1) === namedKey }));
  const core = [['6', FIRE[6]], ['7', FIRE[7]], ['8', FIX], ['9', MUZZLE], ['0', NEXT]];
  core.forEach(([k, r], i) => tile(tx + i * (cw + px(5)), by2, cw, rh, k, r, { named: k === namedKey, tKey: k === '0' }));
  report.rows.situation = SIT.name;
}

// ---- the weapon card, the instinct's line, the keys' hint ----
function card() {
  rrect(SX, SY, CW, SH, 3, C.card);
  g.fillStyle = C.edge; g.fillRect(SX + CW - 1, SY + 1, 1, SH - 2);
  const pm = paintWeaponCard({ model: 'r7', belief: M.belief, k: 1 }), fit = cardFit(U, 1);
  const off = document.createElement('canvas'); off.width = pm.w; off.height = pm.h;
  off.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(pm.data.buffer.slice(0)), pm.w, pm.h), 0, 0);
  const dw = Math.round(CARD_W * fit.k), dh = Math.round(CARD_H * fit.k);
  g.imageSmoothingEnabled = fit.smooth;
  g.drawImage(off, Math.round(SX + (CW - dw) / 2), Math.round(SY + (SH - dh) / 2), dw, dh);
  g.imageSmoothingEnabled = false;
  return fit;
}
function instinct() {
  const IW = SW, size = 12.5, h = px(22), cy = IY + IH / 2;
  const lead = M.lead ?? 'Time stands still.', line = M.line?.text ?? '', tone = M.line?.tone ?? 'note';
  const keys = NAMED, chipWords = tCan ? (M.line?.short ?? '') : '';
  // (the widths first, to centre the whole)
  const lw = textW(lead, size) + px(18), sw = textW(line, size) + px(18);
  font(11); const kws = keys.map(k => Math.max(Math.round(11 * U * 1.6), Math.round(g.measureText(k).width + px(8))));
  const kTot = kws.reduce((a, b) => a + b, 0) + (keys.length - 1) * (textW('›', 11) + px(6)) + px(8);
  const cw = chipWords ? kbdH() + textW(chipWords, size) + px(26) : 0;
  const total = lw + px(8) + sw + kTot + (cw ? px(8) + cw : 0);
  let x = SX + (IW - total) / 2;
  rrect(x, cy - h / 2, lw, h, 0, C.hud); g.fillStyle = C.brass; g.fillRect(Math.round(x), Math.round(cy - h / 2), 3, h);
  txt(lead, x + px(10), cy, { size }); x += lw + px(8);
  const lineW = sw + kTot;
  rrect(x, cy - h / 2, lineW, h, 0, C.hud); g.fillStyle = tone === 'urgent' ? C.red : tone === 'warn' ? C.brass : C.blue; g.fillRect(Math.round(x), Math.round(cy - h / 2), 3, h);
  txt(line, x + px(10), cy, { size }); let kx = x + sw;
  keys.forEach((k, i) => {
    if (i) { txt('›', kx + px(3), cy, { size: 11, colour: C.brass }); kx += textW('›', 11) + px(6); }
    kx += kbd(k, kx, cy - kbdH() / 2, { lit: true });
  });
  x += lineW + px(8);
  if (cw) {
    rrect(x, cy - h / 2, cw, h, 3, C.hud, C.edge);
    const tw = kbd('T', x + px(6), cy - kbdH() / 2);
    txt(chipWords, x + px(6) + tw + px(6), cy, { size, colour: C.glass });
  }
  report.instinct = `${lead} | ${line} [${keys.join(' › ')}]${cw ? ` | T ${chipWords}` : ''}`;
}
function keysHint() {
  const kw = px(120), kh = px(32), x = W - m - kw, y = H - m - kh;
  rrect(x, y, kw, kh, 4, C.hud);
  const w1 = kbd('?', x + px(30), y + (kh - kbdH()) / 2);
  txt('keys', x + px(30) + w1 + px(6), y + kh / 2, { size: 11, colour: C.time });
}

const mPx = floor();
rrect(SX, SY, SW, SH, 4, C.hud, C.edge);
const fit = card();
({ a: layoutA, b: layoutB, c: layoutC })[LAYOUT]();
instinct();
keysHint();
function fitWin() {
  const k = Math.max(1, Math.floor(Math.min(innerWidth / W, innerHeight / H)));
  cv.style.width = `${W * k}px`; cv.style.height = `${H * k}px`;
}
fitWin();
addEventListener('resize', fitWin);
const live = (rs) => rs.filter(r => r && r.state === 'live').length;
Object.assign(report, { frame: [W, H], steps: { x: SX, y: SY, w: SW, h: SH }, card: { k: fit.k, smooth: fit.smooth }, metrePx: Math.round(mPx * 10) / 10,
  live: Object.fromEntries(GROUPS.map(x => [x.id, `${live(x.slots)}/${x.slots.filter(Boolean).length}`])), stepsOf: steps.length });
window.__report = report;
requestAnimationFrame(() => requestAnimationFrame(() => { window.__ready = true; }));
