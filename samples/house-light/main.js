// OLYMPUS sample: the shoot house's light, three candidates (FL-9 of the v0.0.20 feel round; src/data/places/house-light.js).
//
// Every picture is the game itself: the page holds the game in a frame the size of the window, "Stack and clear" on seed
// 48213 at 10:00 (test-shoothouse, its own &setup=), with nothing stored. Once it is drawn, the page pauses it, sets the
// candidate as the game would carry it (state.$houseLight, runtime only: none for HL-a, today's), moves you (and your #2,
// at the stack) where the view says, steps one tick so the sim and the fog see you there, hides the HUD and lets the
// picture settle. Nothing else is touched: the light, the floor, the fog of awareness, the post pass and the Mars palette
// are the game's own, at 16 px/m (640 × 360, shot at whole pixels).
//   ?view=stack     room 1 from the stack before entry: GO, you on room 1's #1 stack point (29.95, 12.45) and your #2
//                   0.65 m behind, its door shut: the room behind the wall as the fog shows it;
//   ?view=entered   room 1 entered: &setup=contact, its door open, you in the doorway, the window about to open on 1a;
//   ?view=hall      the hall: &setup=hall, rooms 1 to 3 cleared, the stack on the hall's west end;
//   ?view=corner    room 3's corner: &setup=room:3, you moved into room 3's near leg (17.6, 10.9) facing its far corner
//                   (stand 3a's, at 16.0, 5.7), the room dim in HL-a;
//   ?view=catwalk   the instructor's view from the catwalk: &setup=room:3, you at the catwalk's middle under it (20, 13.6),
//                   the camera on the house, the fog lifted (the catwalk sees down into every open-top room).
//   &hl=a | b | c   the candidate: HL-a today's, HL-b the floods from the catwalk, HL-c warm pools over each room's centre.
// Live, keys 1, 2 and 3 switch the candidate at the same moment, and H shows the HUD and plays on from there.
// window.__report: { frame (the stage's picture), view, candidate, light (places' lightLevel at room 1's centre and its
// corners, the hall's and room 3's, and where you stand) }; window.__ready once settled.

const q = new URLSearchParams(location.search);
const VIEW = q.get('view') ?? 'stack', HL = String(q.get('hl') ?? 'a').toLowerCase();
const CANDIDATE = { a: null, b: 'HL-b', c: 'HL-c' };
const VIEWS = {
  stack: { setup: 'go', you: [29.95, 12.45, 'left'], two: [30.6, 12.45, 'left'] },
  entered: { setup: 'contact' },
  hall: { setup: 'hall' },
  corner: { setup: 'room:3', you: [17.6, 10.9, 'up'] },
  catwalk: { setup: 'room:3', you: [20.0, 13.6, 'down'], fog: false },
};
// (room 1: its centre and its corners, 0.3 m in; the hall by room 1's door; room 3's near leg and its far corner)
const POINTS = { r1: [29.0, 10.0], r1nw: [26.8, 8.3], r1ne: [31.2, 8.3], r1sw: [26.8, 11.7], r1se: [31.2, 11.7], hall: [29.0, 13.2], r3: [17.5, 8.6], r3corner: [16.0, 5.7] };
const SETTLE_MS = 1800;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const V = VIEWS[VIEW] ?? VIEWS.stack;
if (!(HL in CANDIDATE)) throw new Error(`no candidate '${HL}' (a, b or c)`);

const frame = document.getElementById('game');
frame.src = `/?play=test-shoothouse&setup=${encodeURIComponent(V.setup)}&seed=48213&nostore=1`;
await new Promise(r => frame.addEventListener('load', r, { once: true }));
const W = frame.contentWindow;
// (the game's errors are this page's: tools/shot.mjs fails a view on them)
W.addEventListener('error', (e) => console.error(`the game: ${e.message}`));
W.addEventListener('unhandledrejection', (e) => console.error(`the game: ${e.reason?.message ?? e.reason}`));
for (let t = 0; !W.__ready; t += 50) { if (t > 60000) throw new Error('the game did not come up'); await sleep(50); }
const G = W.__olympus;
G.pause(true);
const set = (id) => { const s = G.state; if (id) s.$houseLight = id; else delete s.$houseLight; };
set(CANDIDATE[HL]);

const s = G.state, list = s.actors.list, me = list.find(a => a.id === s.player.actor);
const place = (a, [x, z, face]) => { a.x = x; a.z = z; a.face = face; };
if (V.you) place(me, V.you);
if (V.two) {
  // (your #2: the man nearest you who is not the instructor at his booth)
  const two = list.filter(a => a !== me && Math.abs(a.z - 13.2) < 1.5).sort((a, b) => Math.hypot(a.x - me.x, a.z - me.z) - Math.hypot(b.x - me.x, b.z - me.z))[0];
  if (two) place(two, V.two);
}
G.step(1);
if (V.fog === false) G.fog(false);

// (the HUD hidden: everything in the game's page but its stage, the largest canvas)
const doc = frame.contentDocument, style = doc.createElement('style');
style.textContent = 'body * { visibility: hidden !important; } canvas.hl-stage { visibility: visible !important; }';
doc.head.append(style);
[...doc.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height)[0]?.classList.add('hl-stage');
await sleep(SETTLE_MS);

const r3 = (v) => (v === null || v === undefined ? null : Math.round(v * 1e4) / 1e4);
const report = () => {
  const st = G.state, you = st.actors.list.find(a => a.id === st.player.actor);
  return {
    frame: G.view?.res ?? null, view: VIEW, candidate: st.$houseLight ?? 'HL-a', setup: V.setup, fog: V.fog !== false,
    you: [r3(you.x), r3(you.z), you.face],
    light: Object.fromEntries([...Object.entries(POINTS), ['you', [you.x, you.z]]].map(([k, [x, z]]) => [k, r3(G.light(x, z))])),
  };
};
window.__report = report();
window.__ready = true;

// (live: 1, 2, 3 the candidates at this moment; H the HUD back and the game playing on. Until H, these keys are the page's,
// caught before the game's own listeners, so a digit never reaches the step panel)
const keys = (e) => {
  const id = { Digit1: 'a', Digit2: 'b', Digit3: 'c' }[e.code];
  if (!id && e.code !== 'KeyH') return;
  e.preventDefault(); e.stopImmediatePropagation();
  if (id) { set(CANDIDATE[id]); window.__report = report(); return; }
  style.remove(); G.pause(false);
  window.removeEventListener('keydown', keys, true); W.removeEventListener('keydown', keys, true);
};
window.addEventListener('keydown', keys, true);
W.addEventListener('keydown', keys, true);
