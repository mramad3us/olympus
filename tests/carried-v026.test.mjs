// OLYMPUS tests: v0.0.26's carried fixes (its build sheet §1 D, items 12 and 14; the carried lens's K2 and v0.0.25's integration's
// K6), each failing without its fix.
//
// K2, T on the first tick after a load at a pause: the instinct's line lives in state.$instinct, runtime and stripped from saves, and
// a tick runs its actions (the input layer) before its offers, so on the first tick after a load a bare T (the debug handle, the
// bots' { act: ['instinct'] }) found no line and did nothing, where the game saved did the line's act: the two parted on that tick
// (v0.0.25 C's finding, "the instinct's line is runtime, so a T press on a pause's tick parts after a load"). skills/instinct.js
// instinctAction settles the line first when it is absent, as the next offers would. The case: v0.0.25's own save, the sergeant by T
// (the honest bot) on 48213 at his first contact's pause in room 1 (tests/saves/v0.0.25-house-pause.json.gz, stage 0's), played on
// to the next pause whose line carries an act (room 2's stack: "Clear it." and the bundle), saved there, loaded, and T pressed on the
// first tick: the same act, the same save after it, the same game 300 ticks on, as the game that was saved.
// K6, a bubble at its speaker among boards: your #2's "Got you." and "Through." from across the Wreck's trunk are said at the scuttle
// on your deck (B's `at`), and every row within BUBBLE_ABOVE_PX over it met the boxes of the hold's boards behind it, so the
// v0.0.24 rule sent both to the radio box. ui/plaque.js placeBubbles now tries a bubble with no place once more with the figures' and
// boards' boxes left out (never the HUD's, never another bubble's), after every bubble that found a place, so those stand where they
// did. Page-free: the sergeant by T from 'trunk' on 48213 (the integrator's probe), his two lines placed over the scuttle at 1600 ×
// 900 and 1024 × 768 (the picture centred on you, render/camera.js's oblique projection, flawless-card.mjs projectAt; the HUD's
// rects layout.js rectsAt's), where the snapshot's rule placed neither; and over the Wreck's lane from GO (quick) and bubbles.test's
// four lanes of the house (heavy), at every line's first tick and half way through it, every bubble the old rule placed stands
// exactly where it did, none of the new over the HUD, another bubble or off the picture.
// Re-read at v0.0.26's integration (both causes named): v0.0.25's own fixer, released in its tag after the snapshot D built on,
// fixed the two lines another way, a line heard at a place (its `at`) reaching BUBBLE_AT_REACH_PX 60 up on the first try, so on the
// tag they stand over the boards' tops without K6. Both fixes are kept (placeBubbles' first try with the tag's reach, K6's second at
// the same reach). So `placeBefore` is now v0.0.25's tag's placeBubbles to the letter (the reach included), the lines said at the
// scuttle are held placed at their speaker within the reach on both, and K6's own case is the same words from a body standing at the
// scuttle (no `at`: BUBBLE_ABOVE_PX, as "Don't shoot!" among the boards and bodies), which the tag's rule still sends to the radio
// box and K6 stands over the boards: the case stays red without K6.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { assert, root } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseHonestBot, houseTBot, runHouse } from './bots/house.mjs';
import { sheetBot, projectAt } from './flawless-card.mjs';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { placeBubbles, markPlace, speakerMarks, balloonSize, BUBBLE_ABOVE_PX, BUBBLE_AT_REACH_PX, CALL_BALLOON_MS } from '../src/ui/plaque.js';
import { spokenMs } from '../src/core/speech.js';
import { rectsAt, STATES } from '../src/ui/hud/layout.js';

const save = (name) => gunzipSync(readFileSync(`${root}/tests/saves/${name}.json.gz`)).toString('utf8');
const meets = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

// ---- K2 ----
/** The honest sergeant's game from the v0.0.25 save to its next pause whose line carries an act: { g, json, line } (the game left there). */
function toActPause() {
  const g = createGame({ scenario: 'test-shoothouse', seed: 48213 }), b = houseHonestBot();
  g.load(save('v0.0.25-house-pause'));
  for (let i = 0; i < 600; i++) {
    const s = g.state, L = instinctNow(s).line;
    if (s.stop?.mode === 'stop' && s.stop.phase === 'choose' && !s.skip && L?.act) return { g, b, json: g.save(), line: L };
    g.step(1, b);
  }
  throw new Error('no pause with an act within 600 ticks of the v0.0.25 save');
}

// ---- K6 ----
/** The pages' sizes the bubbles are judged at (CSS px; one 640 × 360 picture at 16 px/m, render/scale.js). */
const PAGES = Object.freeze([{ w: 1600, h: 900 }, { w: 1024, h: 768 }].map(P => Object.freeze({ ...P, picW: 640, picH: 360, ppm: 16 })));
/** The HUD's rectangles in picture px at a page's size: the weapon state's, the shot timer's paper left out (it is not up in the house or the Wreck; bubbles.test's HOUSE_HUD). */
function uiAt(P) {
  const k = Math.min(P.w / P.picW, P.h / P.picH), ox = (P.w - P.picW * k) / 2, oy = (P.h - P.picH * k) / 2, r = rectsAt(P.w, P.h, 'weapon');
  return STATES.weapon.filter(n => n !== 'PAPER').map(n => r[n]).filter(Boolean).map(q => ({ x: (q.x - ox) / k, y: (q.y - oy) / k, w: q.w / k, h: q.h / k, who: 'ui' }));
}
/** The frame's figures' and boards' boxes and the speakers' head boxes, main.js figureBoxes' and speakerHud headOf's (a line's `at` first), about you. */
function frameAt(s, P) {
  const me = s.actors.list.find(a => a.who === s.player.id), proj = projectAt(me.x, me.z, P), boxes = [], byWho = new Map();
  for (const a of s.actors.list) { if (!a.who) continue; byWho.set(a.who, a); const [fx, fy] = proj(a.x, 0, a.z), [, hy] = proj(a.x, 1.85, a.z); boxes.push({ x: fx - 0.35 * P.ppm, y: Math.min(hy, fy), w: 0.7 * P.ppm, h: Math.abs(fy - hy) + 1, who: a.who }); }
  for (const T of s.armoury?.range?.turners ?? []) { const [fx, fy] = proj(T.x, 0, T.z), [, hy] = proj(T.x, 1.8, T.z); boxes.push({ x: fx - 0.3 * P.ppm, y: Math.min(hy, fy), w: 0.6 * P.ppm, h: Math.abs(fy - hy) + 1, who: T.key }); }
  const headOf = (m) => {
    const a = byWho.get(m.who), p = m.at && typeof m.at === 'object' ? [m.at.x, m.at.y ?? 2.2, m.at.z] : a ? [a.x, 1.8, a.z] : null;
    if (!p) return null;
    const [hx, hy] = proj(p[0], p[1], p[2]);
    return { x: hx - 0.3 * P.ppm, y: hy, w: 0.6 * P.ppm, h: 0.4 * P.ppm };
  };
  return { boxes, headOf, bounds: { x: 0, y: 0, w: P.picW, h: P.picH } };
}
/** v0.0.25's rule, its tag's placeBubbles to the letter: one try, clear of the boxes, the HUD and the bubbles before it, a line at a place reaching BUBBLE_AT_REACH_PX. */
function placeBefore(marks, { headOf, boxes = [], ui = [], bounds = null }) {
  const placed = [], unplaced = [], taken = [];
  for (const m of [...marks].sort((a, b) => a.fromMs - b.fromMs || String(a.who).localeCompare(String(b.who)))) {
    const head = headOf(m);
    if (!head) continue;
    const pix = balloonSize(m.text), at = markPlace(head, { w: pix.w, h: pix.h }, [...boxes.filter(b => b.who !== m.who), ...ui, ...taken], { bounds, reach: m.at ? BUBBLE_AT_REACH_PX : BUBBLE_ABOVE_PX });
    if (!at) { unplaced.push(m); continue; }
    taken.push({ x: at.x - 1, y: at.y - 1, w: pix.w + 2, h: pix.h + 2, who: 'bubble' });
    placed.push({ m, pix, at, head });
  }
  return { placed, unplaced };
}
const keyOf = (m) => `${m.who}|${m.fromMs}|${m.page}`;
/**
 * A lane's bubbles under both rules (see the header), at every line's first tick and half way through it, at each page's size:
 * { lines, frames, kept (placed by both, the same place), moved (placed by the old rule, elsewhere or not at all now), gained
 * (placed now, not before; their words), lost (unplaced by both), bad (a new bubble over the HUD, another bubble or off the picture) }.
 */
function laneBubbles(g, bot, { maxMs = 10 * 60_000 } = {}) {
  const says = [], mids = new Set(), out = { lines: 0, frames: 0, kept: 0, moved: [], gained: [], lost: 0, bad: [] };
  runHouse(g, bot, { maxMs, each: (game) => {
    const s = game.state, who = new Set(s.actors.list.filter(a => a.who).map(a => a.who));
    for (const [type, f] of game.bus.events ?? []) if (type === 'say' && f?.who && f.text && (who.has(f.who) || (f.at && typeof f.at === 'object'))) {
      says.push({ who: f.who, text: String(f.text), atMs: s.clock.ms, spokenMs: spokenMs(f.text), ...(f.at ? { at: f.at } : {}) });
      mids.add(s.clock.ms + Math.round(Math.max(CALL_BALLOON_MS, spokenMs(f.text)) / 2)); out.lines++;
    }
    if (says.length > 40) says.splice(0, says.length - 40);
    if (!says.some(x => x.atMs === s.clock.ms) && !mids.has(s.clock.ms)) return;
    const marks = speakerMarks(says, s.clock.ms);
    for (const P of PAGES) {
      const F = frameAt(s, P), ui = uiAt(P), opts = { headOf: F.headOf, boxes: F.boxes, ui, bounds: F.bounds };
      const was = placeBefore(marks, opts), now = placeBubbles(marks, opts), at = new Map(now.placed.map(p => [keyOf(p.m), p]));
      out.frames++;
      for (const p of was.placed) { const q = at.get(keyOf(p.m)); if (q && !q.over && q.at.x === p.at.x && q.at.y === p.at.y) out.kept++; else out.moved.push(`${p.m.text} at ${s.clock.ms}`); }
      const before = new Set(was.placed.map(p => keyOf(p.m)));
      for (const q of now.placed.filter(p => !before.has(keyOf(p.m)))) {
        out.gained.push(`${P.w}: "${q.m.text.replace(/\n/g, ' ')}"`);
        const r = { x: q.at.x, y: q.at.y, w: q.pix.w, h: q.pix.h };
        if (!q.over || ui.some(u => meets(r, u)) || now.placed.some(o => o !== q && meets(r, { x: o.at.x, y: o.at.y, w: o.pix.w, h: o.pix.h })) || r.x < 0 || r.y < 0 || r.x + r.w > P.picW || r.y + r.h > P.picH) out.bad.push(`${q.m.text} at ${s.clock.ms}`);
      }
      out.lost += now.unplaced.length;
    }
  } });
  return out;
}
const laneRow = (name, o) => `${name}: ${o.lines} lines, ${o.frames} frames; placed as before ${o.kept}, moved ${o.moved.length}, newly at their speaker ${o.gained.length}${o.gained.length ? ` (${[...new Set(o.gained)].slice(0, 4).join('; ')})` : ''}, still with no place ${o.lost}, a new one over the HUD, a bubble or the edge ${o.bad.length}`;

/** The lanes K6's "nothing else moves" reads: the Wreck's (where the boards stand over the trunk's scuttle) and bubbles.test's four of the house. */
const MOVED_LANES = Object.freeze({
  wreck: ['the Wreck, sgt 48213 by T from GO', () => createGame({ scenario: 'test-zerocqb', seed: 48213, tier: 'sgt', setup: 'go' }), () => houseTBot()],
  private: ['the house, private 48213 from GO', () => createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'go' }), () => sheetBot('private')],
  tierone: ['the house, tierone 48213 from GO', () => createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go' }), () => sheetBot('tierone')],
  'sgt-fill': ['the house, sgt 48213 from the fill', () => createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt' }), () => sheetBot('sgt')],
  live: ['the house, tierone 48213 live', () => createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go', opfor: 'live' }), () => sheetBot('tierone')],
});
/** K6's "nothing else moves" over the named lanes: printed, 0 moved and 0 bad. */
function movedGauge(ids) {
  const rows = [], all = { moved: 0, bad: 0, kept: 0 };
  for (const id of ids) {
    const [name, make, bot] = MOVED_LANES[id], o = laneBubbles(make(), bot());
    rows.push(laneRow(name, o)); all.moved += o.moved.length; all.bad += o.bad.length; all.kept += o.kept;
    if (o.moved.length) rows.push(`  moved: ${o.moved.slice(0, 4).join('; ')}`);
  }
  for (const r of rows) console.log(`      ${r}`);
  assert(all.kept > 100 && all.moved === 0 && all.bad === 0, JSON.stringify(all));
}

export default [
  {
    name: 'K2: T on the first tick after a load at a pause does the act the game saved did (the sergeant by T on 48213 from v0.0.25\'s save at his first contact\'s pause, on to room 2\'s stack: "Clear it.")',
    fn() {
      const { g, b, json, line } = toActPause();
      const h = createGame({ scenario: 'test-shoothouse', seed: 48213 });
      h.load(json);
      const loadedLine = instinctNow(h.state).line;
      g.step(1, { act: ['instinct'] }); h.step(1, { act: ['instinct'] });
      const doing = (s) => (s.stop?.doing ? `${s.stop.doing.kind}:${s.stop.doing.step}` : null);
      const after = { saved: doing(g.state), loaded: doing(h.state) }, same = g.save() === h.save();
      for (let i = 0; i < 300; i++) { g.step(1, b); h.step(1, b); }
      const on = g.save() === h.save();
      console.log(`      the pause at tick ${g.state.clock.tick - 301}: the line "${line.text}" (${line.id}, act ${line.act}); loaded, the line before a tick ${loadedLine ? `"${loadedLine.text}"` : 'none (runtime)'}; T on the first tick: the game saved doing ${after.saved}, the save loaded doing ${after.loaded}; the saves after it ${same ? 'byte for byte' : 'DIFFERENT'}, 300 ticks on ${on ? 'byte for byte' : 'DIFFERENT'}; errors ${g.errors.length} and ${h.errors.length}`);
      assert(after.saved && after.loaded === after.saved && same && on && !g.errors.length && !h.errors.length, JSON.stringify({ after, same, on, errors: [...g.errors, ...h.errors].slice(0, 2) }));
    },
  },
  {
    name: 'K6: your #2\'s "Got you." and "Through." across the Wreck\'s trunk stand at the scuttle among the hold\'s boards, not in the radio box (the sergeant by T from \'trunk\' on 48213, 1600 × 900 and 1024 × 768), and the same words from a body standing there, which v0.0.25\'s rule sends to the radio box, stand over the boards',
    fn() {
      const g = createGame({ scenario: 'test-zerocqb', seed: 48213, tier: 'sgt', setup: 'trunk' }), b = houseTBot(), got = [];
      // (the lane stepped to the second of each line at each size, each as said and from a body: eight placements)
      for (let i = 0; i < 6000 && got.length < 8 && !g.state.armoury.range.end; i++) {
        g.step(1, b);
        const s = g.state;
        for (const [type, f] of g.bus.events ?? []) if (type === 'say' && (f?.text === 'Got you.' || f?.text === 'Through.')) {
          const m = { who: f.who, text: f.text, fromMs: s.clock.ms, page: 0, k: 1, ...(f.at ? { at: f.at } : {}) };
          for (const P of PAGES) {
            const F = frameAt(s, P), opts = { headOf: F.headOf, boxes: F.boxes, ui: uiAt(P), bounds: F.bounds }, head = F.headOf(m);
            const near = F.boxes.filter(q => q.who !== m.who && head && Math.abs(q.x + q.w / 2 - (head.x + head.w / 2)) < 40 && q.y < head.y && q.y + q.h > head.y - 40).map(q => q.who);
            got.push({ text: f.text, page: P.w, at: f.at ?? null, head, near, was: placeBefore([m], opts).placed[0]?.at ?? null, now: placeBubbles([m], opts).placed[0] ?? null });
            // (K6's own: the same words said by a body standing at the scuttle, no `at`, so BUBBLE_ABOVE_PX, its head the same box)
            const { at: _at, ...mb } = m, ob = { ...opts, headOf: () => head };
            got.push({ text: f.text, page: P.w, at: null, body: true, head, near, was: placeBefore([mb], ob).placed[0]?.at ?? null, now: placeBubbles([mb], ob).placed[0] ?? null });
          }
        }
        g.clearFacts?.();
      }
      for (const x of got) console.log(`      "${x.text}" ${x.body ? 'from a body at the scuttle' : `at ${JSON.stringify(x.at)}`} (${x.page}): the head box at ${Math.round(x.head.x)}, ${Math.round(x.head.y)} px, the boxes over it ${x.near.join(', ')}; v0.0.25's rule ${x.was ? JSON.stringify(x.was) : 'no place (the radio box)'}; now ${x.now ? `${JSON.stringify(x.now.at)}${x.now.over ? ', over the boards' : ''}` : 'NO PLACE'}`);
      assert(got.length >= 8 && ['Got you.', 'Through.'].every(t => got.some(x => x.text === t && !x.body) && got.some(x => x.text === t && x.body)), JSON.stringify(got.map(x => x.text)));
      for (const x of got) {
        const n = x.now, r = n ? { x: n.at.x, y: n.at.y, w: n.pix.w, h: n.pix.h } : null, P = PAGES.find(p => p.w === x.page);
        // (placed now, at its speaker: its foot over the head box and within its reach of it (markPlace's rows, rounded to whole
        // pixels: BUBBLE_ABOVE_PX for a body, BUBBLE_AT_REACH_PX for a line at a place), its middle within its own width of the head's
        // (markPlace's steps left and right), clear of the HUD, inside the picture)
        const reach = x.body ? BUBBLE_ABOVE_PX : BUBBLE_AT_REACH_PX;
        const atHim = r && r.y + r.h <= Math.ceil(x.head.y) && r.y + r.h >= x.head.y - reach - 1 && Math.abs(r.x + r.w / 2 - (x.head.x + x.head.w / 2)) <= r.w;
        const clear = r && !uiAt(P).some(u => meets(r, u)) && r.x >= 0 && r.y >= 0 && r.x + r.w <= P.picW && r.y + r.h <= P.picH;
        // (the body's: no place under v0.0.25's rule, placed over the boards now (K6); the line at the place: placed under both)
        if (x.body) assert(x.was === null && n && n.over && atHim && clear, JSON.stringify(x));
        else assert(x.at && n && atHim && clear, JSON.stringify(x));
      }
    },
  },
  {
    name: 'K6, nothing else moves: every bubble v0.0.25\'s rule placed stands exactly where it did, and none it gains is over the HUD, another bubble or the picture\'s edge (the Wreck\'s sergeant by T from GO on 48213, at 1600 × 900 and 1024 × 768)',
    fn() { movedGauge(['wreck']); },
  },
  {
    name: 'K6, nothing else moves, the house: the same over bubbles\' four lanes of the house (the private by the keys and the tier one from GO, the sergeant from the fill with the brief, the tier one on the live lane, 48213)',
    heavy: true,
    fn() { movedGauge(['private', 'tierone', 'sgt-fill', 'live']); },
  },
];
