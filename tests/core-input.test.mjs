// The keys (src/core/keys.js) and the input (src/core/input.js): the bindings by physical code with
// AZERTY labels (QWERTY on request), every control DESIGN.md names, hold against tap at 220 ms, the
// digits by code, and the per-tick snapshot with the mouse in stage pixels, driven here through a
// plain EventTarget (no browser needed). The 0.0.5 round's (the build sheet §2.4, §5.4): V carry, A and
// W the stance up and down by code (KeyQ, KeyZ, labelled A and W on AZERTY, Q and Z on QWERTY), queued
// as carry, stance:up and stance:down; the digits a press key for the step panel (tapped under TAP_MS,
// held at TAP_MS while still down, never both), their key-down 'digit' kept for menus and G's stub.
// The 0.0.6 round's (the build sheet 0.0.6 §5.3): R held at 220 ms opens the R menu (cards/actions.js), which reads
// its own keys by code while it is up (input.own): every key going down is the card's alone, nothing queued, no
// listener told, so a key pressed in the menu never lands in the world, now or when it closes; R let go after its
// hold, a key held into the menu, still lets go in the machine.
// The 0.0.7 round's (the build sheet 0.0.7 §2.5 (a)): in stop motion the scope's turrets by the keys, dialOf: Z and S
// (KeyW, KeyS) and ↑ ↓ a click of elevation, Shift with Q and D (KeyA, KeyD) or ← → a click of windage; Q and D alone
// stay the brackets'; the keys card lists them, labelled AZERTY.
import { assert } from './helpers.mjs';
import { BINDINGS, TAP_MS, label, actionOf, bindingOf, createKeyState, AZERTY_LABELS, isDigitCode, dialOf, DIAL_ELEV_CODES, DIAL_WIND_CODES } from '../src/core/keys.js';
import { keysRows } from '../src/ui/cards/keys.js';
import { createInput } from '../src/core/input.js';

// (a key event as the browser would send it, enough for input.js)
const key = (type, code, extra = {}) => Object.assign(new Event(type, { cancelable: true }), { code, key: extra.key ?? '', repeat: false, metaKey: false, ctrlKey: false, altKey: false, ...extra });
const mouse = (type, x, y, extra = {}) => Object.assign(new Event(type, { cancelable: true }), { clientX: x, clientY: y, button: 0, buttons: 0, deltaY: 0, ...extra });

export default [
  {
    name: 'bindings: by physical code, labelled AZERTY by default, QWERTY on request (KeyW is up: Z on AZERTY, W on QWERTY)',
    fn() {
      assert(actionOf('KeyW') === 'up' && actionOf('KeyA') === 'left' && actionOf('KeyS') === 'down' && actionOf('KeyD') === 'right', 'ZQSD');
      // (the keys AZERTY labels W and A walk nowhere: since 0.0.5 they are the stance down and up)
      assert(actionOf('KeyZ') === 'stanceDown' && actionOf('KeyQ') === 'stanceUp', 'the keys AZERTY labels W and A');
      assert(label('up') === 'Z' && label('left') === 'Q' && label('down') === 'S' && label('right') === 'D', `AZERTY move labels ${['up', 'left', 'down', 'right'].map(a => label(a))}`);
      const q = { layout: 'qwerty' };
      assert(label('up', q) === 'W' && label('left', q) === 'A' && label('guard', q) === ';' && label('guard') === 'M', 'QWERTY / AZERTY labels');
      assert(label('KeyQ') === 'A' && label('KeyQ', q) === 'Q' && label('KeyM') === ',', 'labels by code');
      assert(label('pause') === 'Space' && label('menu') === 'Esc' && label('mind') === 'Tab' && label('run') === 'Shift' && label('stroll') === 'Alt' && label('stroll', { mac: true }) === 'Option', 'named keys');
      assert(label('help') === '?' && label('digit:3') === '3' && label('Numpad7') === '7' && label('ArrowUp') === '↑', 'help, digits, arrows');
      assert(label('KeyW', { layout: 'auto', layoutMap: new Map([['KeyW', 'z']]) }) === 'Z' && label('KeyW', { layout: 'auto' }) === 'Z', 'the browser\'s layout map, and AZERTY without one');
      const codes = BINDINGS.flatMap(b => b.codes);
      assert(new Set(codes).size === codes.length, 'a code bound twice');
      console.log(`      up/left/down/right: AZERTY ${['up', 'left', 'down', 'right'].map(a => label(a)).join(' ')}, QWERTY ${['up', 'left', 'down', 'right'].map(a => label(a, q)).join(' ')}; ${BINDINGS.length} bindings, ${codes.length} codes, none twice; ${Object.keys(AZERTY_LABELS).length} AZERTY labels`);
    },
  },
  {
    name: 'bindings: every control DESIGN.md names, on its key and of its kind',
    fn() {
      // (DESIGN.md, Controls: ZQSD walk; Shift run; Alt stroll; E look/glance; F people; R at hand; T instinct;
      // G ready; X shooting mode; K L M hit grab guard; I C H Tab J; Space pause; ? keys; Esc menu)
      const want = { up: 'Z', left: 'Q', down: 'S', right: 'D', run: 'Shift', stroll: 'Alt', look: 'E', people: 'F', hand: 'R', instinct: 'T', ready: 'G',
        shoot: 'X', carry: 'V', stanceUp: 'A', stanceDown: 'W', hit: 'K', grab: 'L', guard: 'M', inventory: 'I', sheet: 'C', aid: 'H', mind: 'Tab', log: 'J', pause: 'Space', help: '?', menu: 'Esc' };
      const wrong = Object.entries(want).filter(([a, l]) => label(a) !== l).map(([a, l]) => `${a}: ${label(a)} (want ${l})`);
      assert(!wrong.length, wrong.join('; '));
      const kinds = Object.fromEntries(BINDINGS.map(b => [b.action, b.kind]));
      assert(kinds.ready === 'sim' && kinds.hit === 'sim' && kinds.inventory === 'ui' && kinds.pause === 'loop' && kinds.look === 'hold' && kinds.run === 'mod' && kinds.up === 'move', JSON.stringify(kinds));
      assert(BINDINGS.every(b => b.say && b.say.length > 2), 'a binding without its words');
      console.log(`      ${Object.entries(want).map(([a, l]) => `${l} ${a}`).join(', ')}`);
    },
  },
  {
    name: 'hold vs tap (220 ms): E let go sooner glances back; held 220 ms or more it looks, and lets go without a glance',
    fn() {
      const k = createKeyState();
      assert(TAP_MS === 220, `TAP_MS ${TAP_MS}`);
      assert(k.down('KeyE', 1000).length === 0, 'E fired on the way down');
      assert(!k.snapshot(1100).look, 'looking at 100 ms');
      const tap = k.up('KeyE', 1000 + TAP_MS - 1);
      assert(tap.length === 1 && tap[0].action === 'glance' && tap[0].kind === 'sim', `a 219 ms press: ${JSON.stringify(tap)}`);
      k.down('KeyE', 2000);
      assert(!k.snapshot(2000 + TAP_MS - 1).look && k.snapshot(2000 + TAP_MS).look, 'look turns on at exactly 220 ms');
      assert(k.up('KeyE', 2000 + 900).length === 0 && !k.snapshot(3000).look, 'a hold glanced on letting go');
      k.down('KeyE', 4000);
      assert(k.up('KeyE', 4000 + TAP_MS).length === 0, 'a 220 ms press counted as a tap');
      console.log(`      219 ms: glance; 220 ms: look (held), no glance on release`);
    },
  },
  {
    name: 'the machine: moves add up and cancel, a repeat fires once, digits by code, ? by the character, clear lets go',
    fn() {
      const k = createKeyState();
      k.down('KeyW', 0); k.down('KeyD', 0);
      let s = k.snapshot(10);
      assert(s.mx === 1 && s.mz === -1, `Z+D: ${s.mx},${s.mz}`);
      k.down('KeyS', 0); k.down('ArrowRight', 0);
      s = k.snapshot(10);
      assert(s.mx === 1 && s.mz === 0, `Z+S+D+→: ${s.mx},${s.mz}`);
      k.down('ShiftLeft', 0);
      assert(k.snapshot(10).run && !k.snapshot(10).stroll, 'Shift runs');
      const g1 = k.down('KeyG', 0), g2 = k.down('KeyG', 30);
      assert(g1.length === 1 && g1[0].action === 'ready' && g2.length === 0, 'G twice without a keyup');
      const d = [...k.down('Digit1', 0), ...k.down('Numpad0', 0), ...k.down('Digit7', 0)].map(f => `${f.action}/${f.kind}`);
      assert(d.join() === 'digit:1/digit,digit:0/digit,digit:7/digit', d.join());
      const help = k.down('KeyM', 0, '?');
      assert(help[0]?.action === 'help', 'Shift and the comma\'s key on AZERTY: help');
      assert(k.down('F13', 0).length === 0 && k.down('KeyY', 0).length === 0, 'unbound keys fire nothing');
      k.clear();
      s = k.snapshot(10);
      assert(s.mx === 0 && s.mz === 0 && !s.run && k.held.length === 0, 'clear');
      console.log(`      Z+D → (1, -1); Z+S+D+→ → (1, 0); digits: ${d.join(' ')}`);
    },
  },
  {
    name: 'V, A and W by code (KeyV, KeyQ, KeyZ), labelled V, A and W on AZERTY (V, Q, Z on QWERTY), queued for the sim as carry, stance:up and stance:down',
    fn() {
      const k = createKeyState(), q = { layout: 'qwerty' };
      const fired = ['KeyV', 'KeyQ', 'KeyZ'].map(c => k.down(c, 0)[0]);
      const labels = ['carry', 'stanceUp', 'stanceDown'].map(a => label(a)), qwerty = ['carry', 'stanceUp', 'stanceDown'].map(a => label(a, q));
      console.log(`      ${fired.map((f, i) => `${['KeyV', 'KeyQ', 'KeyZ'][i]} → ${f.action}/${f.kind}`).join(', ')}; AZERTY ${labels.join(' ')}, QWERTY ${qwerty.join(' ')}`);
      assert(fired.map(f => `${f.action}/${f.kind}`).join() === 'carry/sim,stance:up/sim,stance:down/sim', JSON.stringify(fired));
      assert(labels.join('') === 'VAW' && qwerty.join('') === 'VQZ', JSON.stringify({ labels, qwerty }));
      // (through the input: queued as the sim's actions, the listeners told the same)
      const win = new EventTarget(), heard = [];
      const inp = createInput({ target: win, now: () => 0 });
      inp.onAction((a, kind) => heard.push(`${a}/${kind}`));
      for (const c of ['KeyV', 'KeyQ', 'KeyZ']) { win.dispatchEvent(key('keydown', c)); win.dispatchEvent(key('keyup', c)); }
      const s = inp.snapshot();
      assert(s.act.join() === 'carry,stance:up,stance:down' && s.mx === 0 && s.mz === 0, JSON.stringify(s));
      assert(heard.join() === 'carry/sim,stance:up/sim,stance:down/sim', heard.join());
      inp.dispose();
    },
  },
  {
    name: 'the digits as press keys (the build sheet 0.0.5 §2.4): down fires digit:N/digit for menus; let go under 220 ms a tap; held 220 ms a held, then nothing on letting go; never both',
    fn() {
      const k = createKeyState();
      const down = k.down('Digit3', 1000), up = k.up('Digit3', 1000 + TAP_MS - 1);
      assert(down.length === 1 && down[0].action === 'digit:3' && down[0].kind === 'digit', JSON.stringify(down));
      assert(up.length === 1 && up[0].action === 'digit:3' && up[0].kind === 'tap', `a 219 ms press: ${JSON.stringify(up)}`);
      k.down('Numpad1', 2000);
      const early = k.due(2000 + TAP_MS - 1), due = k.due(2000 + TAP_MS), again = k.due(2000 + 900), off = k.up('Numpad1', 2000 + 900);
      assert(!early.length && due.length === 1 && due[0].action === 'digit:1' && due[0].kind === 'held' && !again.length && !off.length, JSON.stringify({ early, due, again, off }));
      // (a stalled timer: let go past TAP_MS without a due() asked, the hold fires on the way up)
      k.down('Digit0', 3000);
      const late = k.up('Digit0', 3000 + 400);
      assert(late.length === 1 && late[0].kind === 'held' && late[0].action === 'digit:0', JSON.stringify(late));
      assert(isDigitCode('Digit5') && isDigitCode('Numpad9') && !isDigitCode('KeyD'), 'isDigitCode');
      // (through the input: the down queued (a menu's, G's stub), the tap and the hold to the listeners only; Shift's state read with them)
      const win = new EventTarget(), heard = [];
      let t = 0;
      const inp = createInput({ target: win, now: () => t });
      inp.onAction((a, kind, e) => heard.push(`${a}/${kind}${e?.shiftKey ? '+shift' : ''}`));
      win.dispatchEvent(key('keydown', 'Digit2')); t = 100; win.dispatchEvent(key('keyup', 'Digit2'));
      win.dispatchEvent(key('keydown', 'ShiftLeft', { shiftKey: true })); win.dispatchEvent(key('keydown', 'Digit4', { shiftKey: true })); t = 150; win.dispatchEvent(key('keyup', 'Digit4', { shiftKey: true })); win.dispatchEvent(key('keyup', 'ShiftLeft'));
      t = 1000; win.dispatchEvent(key('keydown', 'Digit1'));
      t = 1000 + TAP_MS; const held = inp.snapshot();
      t = 1700; win.dispatchEvent(key('keyup', 'Digit1'));
      console.log(`      Digit3 down → digit:3/digit, up at 219 ms → tap; Numpad1 held → held at 220 ms, nothing after; heard through the input: ${heard.join(' ')}; queued ${held.act.join(', ')}`);
      assert(held.act.join() === 'digit:2,digit:4,digit:1', held.act.join());
      assert(heard.join(' ') === 'digit:2/digit digit:2/tap digit:4/digit+shift digit:4/tap+shift digit:1/digit digit:1/held', heard.join(' '));
      inp.dispose();
    },
  },
  {
    name: 'input: events in, a per-tick snapshot out (each press once), accept() gates the sim, the browser\'s keys left alone',
    fn() {
      const win = new EventTarget();
      let accepting = true;
      const heard = [];
      let t = 0;
      const inp = createInput({ target: win, now: () => t, accept: () => accepting });
      inp.onAction((a, kind) => heard.push(`${a}/${kind}`));
      const space = key('keydown', 'Space'); win.dispatchEvent(space);
      win.dispatchEvent(key('keydown', 'KeyF')); win.dispatchEvent(key('keyup', 'KeyF'));
      win.dispatchEvent(key('keydown', 'KeyW'));
      t = 400;
      win.dispatchEvent(key('keydown', 'KeyE'));
      t = 500; win.dispatchEvent(key('keyup', 'KeyE'));
      const s1 = inp.snapshot(), s2 = inp.snapshot();
      assert(space.defaultPrevented, 'Space scrolled the page');
      assert(s1.act.join() === 'people,glance' && s1.mz === -1 && s2.act.length === 0 && s2.mz === -1, `snapshots ${JSON.stringify(s1.act)} then ${JSON.stringify(s2.act)}`);
      assert(heard.join() === 'pause/loop,people/sim,glance/sim', heard.join());
      accepting = false;
      win.dispatchEvent(key('keydown', 'KeyG'));
      assert(inp.snapshot().act.length === 0 && heard.at(-1) === 'ready/sim', 'a sim action queued while not accepted');
      accepting = true;
      const cmd = key('keydown', 'KeyR', { metaKey: true }); win.dispatchEvent(cmd);
      const rep = key('keydown', 'KeyT', { repeat: true }); win.dispatchEvent(rep);
      assert(inp.snapshot().act.length === 0 && !cmd.defaultPrevented, 'Cmd+R or a repeat reached the game');
      win.dispatchEvent(new Event('blur'));
      assert(inp.snapshot().mz === 0, 'blur did not let the keys go');
      assert(inp.label('up') === 'Z', 'the input\'s labels');
      inp.dispose();
      win.dispatchEvent(key('keydown', 'KeyF'));
      assert(inp.snapshot().act.length === 0, 'heard after dispose');
      console.log(`      F then a 100 ms E: [${s1.act.join(', ')}], then []; Space prevented; Cmd+R and a repeat ignored`);
    },
  },
  {
    name: 'input: Tab, Space and the move keys keep their browser meaning while the game does not own the keys (the title), and letting Cmd go lets every key go (macOS sends no keyup under Cmd)',
    fn() {
      const win = new EventTarget();
      let owns = false;
      const inp = createInput({ target: win, now: () => 0, swallow: () => owns });
      const tab = key('keydown', 'Tab'), down = key('keydown', 'ArrowDown'), space = key('keydown', 'Space'), alt = key('keydown', 'AltLeft');
      for (const e of [tab, down, space, alt]) win.dispatchEvent(e);
      const onTitle = [tab, down, space].map(e => e.defaultPrevented);
      for (const c of ['Tab', 'ArrowDown', 'Space', 'AltLeft']) win.dispatchEvent(key('keyup', c));
      owns = true;
      const tab2 = key('keydown', 'Tab'), space2 = key('keydown', 'Space');
      win.dispatchEvent(tab2); win.dispatchEvent(space2);
      win.dispatchEvent(key('keyup', 'Tab')); win.dispatchEvent(key('keyup', 'Space'));
      // (walking with Z held, Cmd goes down, Z is let go under it (no keyup comes), then Cmd is let go)
      win.dispatchEvent(key('keydown', 'KeyW'));
      win.dispatchEvent(key('keydown', 'MetaLeft', { metaKey: true }));
      const walking = inp.snapshot().mz;
      win.dispatchEvent(key('keyup', 'MetaLeft'));
      const after = inp.snapshot().mz;
      console.log(`      on the title, Tab, ArrowDown and Space prevented: ${onTitle.join(', ')}; Alt ${alt.defaultPrevented}; in play, Tab and Space prevented: ${tab2.defaultPrevented}, ${space2.defaultPrevented}; Z held into Cmd: mz ${walking}, after Cmd let go ${after}`);
      assert(onTitle.every(p => !p) && alt.defaultPrevented && tab2.defaultPrevented && space2.defaultPrevented, JSON.stringify({ onTitle, alt: alt.defaultPrevented, tab2: tab2.defaultPrevented }));
      assert(walking === -1 && after === 0, `mz ${walking} then ${after}`);
      inp.dispose();
    },
  },
  {
    name: 'the mouse: stage pixels from client pixels, clicks on the stage only, buttons and the wheel',
    fn() {
      const win = new EventTarget();
      // (the stage drawn at 100,50 and 1280 × 720 on the page, 640 × 360 stage pixels: two page pixels a stage pixel)
      const stage = { getBoundingClientRect: () => ({ left: 100, top: 50, width: 1280, height: 720 }), contains: (t) => t === win };
      const inp = createInput({ target: win, now: () => 0 });
      inp.setStage(stage, 640, 360);
      win.dispatchEvent(mouse('mousemove', 100 + 640, 50 + 360));
      assert(inp.mouse.x === 320 && inp.mouse.y === 180 && inp.mouse.inside, `centre: ${JSON.stringify(inp.mouse)}`);
      win.dispatchEvent(mouse('mousedown', 100 + 2, 50 + 4, { button: 2, buttons: 2 }));
      win.dispatchEvent(mouse('wheel', 0, 0, { deltaY: 120 }));
      const s = inp.snapshot();
      assert(s.mouse.clicks.length === 1 && s.mouse.clicks[0].join() === '2,1,2' && s.mouse.buttons === 2 && s.mouse.wheel === 120, JSON.stringify(s.mouse));
      assert(inp.snapshot().mouse.clicks.length === 0 && inp.snapshot().mouse.wheel === 0, 'a click delivered twice');
      win.dispatchEvent(mouse('mousemove', 50, 20));
      assert(!inp.mouse.inside, 'off the stage counted as inside');
      const off = createInput({ target: win, now: () => 0 });       // (no stage set: clicks on the interface aren't the stage's)
      win.dispatchEvent(mouse('mousedown', 10, 10));
      assert(off.snapshot().mouse.clicks.length === 0, 'a click with no stage');
      console.log(`      page (740, 410) → stage (320, 180); a right click at page (102, 54) → [2, 1, 2]; wheel 120`);
    },
  },
  {
    name: 'a card\'s own keys (the R menu, the build sheet 0.0.6 §2.3): R held 220 ms fires held while still down; then while the card owns the keys, Space, the digits, Enter, Z, the arrows and R are its alone (none queued, no listener told, Space and the arrows prevented), its release gives them back, and R let go fires nothing more',
    fn() {
      const win = new EventTarget(), heard = [], card = [];
      let t = 0;
      const inp = createInput({ target: win, now: () => t });
      inp.onAction((a, kind) => heard.push(`${a}/${kind}`));
      win.dispatchEvent(key('keydown', 'KeyR'));
      t = TAP_MS;
      const s0 = inp.snapshot();
      assert(heard.join() === 'hand/down,hand/held' && !s0.act.length, `R held: ${heard.join()}`);
      // (the page opens the menu on the hold: from here its keys are its own)
      const release = inp.own((code, e) => { card.push(`${code}${e.repeat ? '*' : ''}`); return true; });
      const evs = ['Digit2', 'Space', 'Digit3', 'Space', 'KeyW', 'ArrowDown', 'Enter', 'KeyF', 'KeyG', 'Escape'].map(c => key('keydown', c));
      for (const e of evs) { win.dispatchEvent(e); win.dispatchEvent(key('keyup', e.code)); }
      win.dispatchEvent(key('keydown', 'ArrowDown', { repeat: true }));
      t = TAP_MS + 600; win.dispatchEvent(key('keyup', 'KeyR'));
      const s1 = inp.snapshot();
      console.log(`      R held: ${heard.slice(0, 2).join(', ')}; the card heard ${card.join(' ')}; the world heard ${heard.slice(2).join(', ') || 'nothing'}, queued [${s1.act.join(', ')}], walking ${s1.mz}; R let go: nothing`);
      assert(card.join(' ') === 'Digit2 Space Digit3 Space KeyW ArrowDown Enter KeyF KeyG Escape ArrowDown*' && inp.owned, card.join(' '));
      assert(heard.length === 2 && !s1.act.length && s1.mz === 0 && evs.every(e => e.defaultPrevented), JSON.stringify({ heard, act: s1.act, mz: s1.mz }));
      // (the card closed: the keys are the world's again, and R works as before)
      release();
      win.dispatchEvent(key('keydown', 'KeyF')); win.dispatchEvent(key('keyup', 'KeyF'));
      t = 2000; win.dispatchEvent(key('keydown', 'KeyR')); t = 2100; win.dispatchEvent(key('keyup', 'KeyR'));
      const s2 = inp.snapshot();
      assert(!inp.owned && s2.act.join() === 'people' && heard.slice(2).join() === 'people/sim,hand/down,hand/tap', JSON.stringify({ act: s2.act, heard }));
      // (a stale release never takes back a newer owner)
      const r1 = inp.own(() => true), r2 = inp.own(() => true);
      r1();
      assert(inp.owned, 'the newer owner kept');
      r2();
      assert(!inp.owned, 'released');
      inp.dispose();
    },
  },
  {
    name: 'the scope\'s turrets by the keys in stop motion: Z S and ↑ ↓ a click of elevation, Shift with Q D or ← → a click of windage, Q D alone the brackets\' (dialOf); the keys card says so in AZERTY',
    fn() {
      const said = ['KeyW', 'ArrowUp', 'KeyS', 'ArrowDown', 'KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight', 'KeyE'].map(c => `${c} ${dialOf(c) ?? '-'} / ⇧ ${dialOf(c, { shift: true }) ?? '-'}`);
      console.log(`      ${said.join('; ')}`);
      assert(dialOf('KeyW') === 'sight:elev:+1' && dialOf('ArrowDown') === 'sight:elev:-1' && dialOf('KeyS', { shift: true }) === 'sight:elev:-1', 'the elevation, with or without Shift');
      assert(dialOf('KeyA') === null && dialOf('KeyD') === null && dialOf('KeyA', { shift: true }) === 'sight:wind:-1' && dialOf('ArrowRight', { shift: true }) === 'sight:wind:+1', 'the windage only with Shift');
      assert(Object.keys(DIAL_ELEV_CODES).every(c => actionOf(c)) && Object.keys(DIAL_WIND_CODES).every(c => actionOf(c)), 'every dial key is a move key, which walks nowhere in stop motion');
      const rows = keysRows({ label: (a) => label(a) });
      const dial = rows.filter(([, w]) => /elevation|windage|far window/.test(w));
      console.log(`      the keys card: ${dial.map(([k, w]) => `${k}: ${w}`).join(' | ')}`);
      assert(dial.length === 3 && dial[0][0] === 'Z S' && dial[1][0] === 'Shift Q D' && dial[2][0] === 'E', JSON.stringify(dial));
    },
  },
];
