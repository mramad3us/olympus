// The keys (src/core/keys.js) and the input (src/core/input.js): the bindings by physical code with
// AZERTY labels (QWERTY on request), every control DESIGN.md names, hold against tap at 220 ms, the
// digits by code, and the per-tick snapshot with the mouse in stage pixels, driven here through a
// plain EventTarget (no browser needed).
import { assert } from './helpers.mjs';
import { BINDINGS, TAP_MS, label, actionOf, bindingOf, createKeyState, AZERTY_LABELS } from '../src/core/keys.js';
import { createInput } from '../src/core/input.js';

// (a key event as the browser would send it, enough for input.js)
const key = (type, code, extra = {}) => Object.assign(new Event(type, { cancelable: true }), { code, key: extra.key ?? '', repeat: false, metaKey: false, ctrlKey: false, altKey: false, ...extra });
const mouse = (type, x, y, extra = {}) => Object.assign(new Event(type, { cancelable: true }), { clientX: x, clientY: y, button: 0, buttons: 0, deltaY: 0, ...extra });

export default [
  {
    name: 'bindings: by physical code, labelled AZERTY by default, QWERTY on request (KeyW is up: Z on AZERTY, W on QWERTY)',
    fn() {
      assert(actionOf('KeyW') === 'up' && actionOf('KeyA') === 'left' && actionOf('KeyS') === 'down' && actionOf('KeyD') === 'right', 'ZQSD');
      assert(actionOf('KeyZ') === null && actionOf('KeyQ') === null, 'the keys AZERTY labels W and A walk nowhere');
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
        shoot: 'X', hit: 'K', grab: 'L', guard: 'M', inventory: 'I', sheet: 'C', aid: 'H', mind: 'Tab', log: 'J', pause: 'Space', help: '?', menu: 'Esc' };
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
      assert(k.down('KeyZ', 0).length === 0 && k.down('F13', 0).length === 0, 'unbound keys fire nothing');
      k.clear();
      s = k.snapshot(10);
      assert(s.mx === 0 && s.mz === 0 && !s.run && k.held.length === 0, 'clear');
      console.log(`      Z+D → (1, -1); Z+S+D+→ → (1, 0); digits: ${d.join(' ')}`);
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
];
