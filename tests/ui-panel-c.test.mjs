// OLYMPUS tests: layout C in the page as the user's pick drew it (heavy; 2026-11-15, the keys role; samples/panel P3, ★ 100 for P3-j).
//
// The user (2026-11-15): "I notice that the keys selection isn't updated according to the choices made earlier yet ?" The picked
// sample, P3, drew the band as two rows of six tiles (the situation's tile with its picture and name, 1 to 5; the Tab tile, "held:
// more", and the core's 6 to 0, FIX and MUZZLE named), Tab held as a half-wheel of the five groups beside the group's card, and the
// DI's line with the row's key after its words ("Open it. Pull. 3"); the game drew two columns of rows with a vertical name. Pinned
// here, at 1600 × 900 and 1024 × 768 in the house: the band's twelve tiles in two rows of six in STEPS; the situation's tile named
// with its picture; the core's tags; Tab held, the wheel and, after 2, DRILL's card "OUTSIDE A DOOR" and the group's nine; the DI's
// row's tile edged in brass and its keys after the line's words; one word a tile at 1024 × 768; the house played by those keys
// (Stack up and take point on 2, Open on 3: the stack on room 1, then the door open).
import { assert } from './helpers.mjs';
import { withGame } from './browser.mjs';

const settle = (page, ms = 300) => page.waitForTimeout(ms);
const look = (page) => page.evaluate(() => {
  const S = document.querySelector('.steps'), L = S.querySelector('.steplist'), R = (e) => e.getBoundingClientRect(), s = R(S);
  const kids = [...L.children].map(e => ({ cls: e.className, key: e.dataset.key ?? null, r: R(e), name: e.querySelector('.name')?.textContent ?? '', di: e.classList.contains('di'), col: e.style.gridColumn, row: e.style.gridRow, tag: e.querySelector('.ctag')?.textContent ?? '', icon: !!e.querySelector('.icon svg') }));
  const inside = kids.every(k => k.r.left >= s.left - 0.5 && k.r.right <= s.right + 0.5 && k.r.top >= s.top - 0.5 && k.r.bottom <= s.bottom + 0.5);
  const line = document.querySelector('.instinct .line');
  return { form: L.dataset.form, small: S.classList.contains('small'), kids, inside, wheel: !!S.querySelector('.fanwheel svg .sector.lit'), card: S.querySelector('.gcard')?.textContent ?? null, line: line?.textContent ?? '', rowKeys: [...(line?.querySelectorAll('.rowkeys kbd') ?? [])].map(k => k.textContent) };
});

export default [
  {
    name: 'layout C in the page as P3 (the user\'s pick, ★ 100): at 1600 × 900 and 1024 × 768 in the house, the band two rows of six tiles in STEPS (the situation\'s, named with its picture; Tab "held: more"; the core\'s FIX and MUZZLE named), Tab held a lit half-wheel and DRILL\'s card "OUTSIDE A DOOR" with its nine, the DI\'s row edged in brass and its keys after the line\'s words; one word a tile at 1024 × 768; Stack up and take point on 2 then Open on 3 play the stack',
    heavy: true,
    timeoutMs: 600000,
    async fn() {
      const port = Number(process.env.OLYMPUS_TEST_PORT) || undefined;
      await withGame(async (page, errors, game) => {
        const out = {};
        for (const [W, H] of [[1600, 900], [1024, 768]]) {
          await page.setViewportSize({ width: W, height: H });
          await game.open('play=test-shoothouse&setup=go&tier=private&seed=1489397426&nostore=1&panel=c');
          await page.waitForFunction(() => window.__ready && !!window.__olympus.panel()?.where, null, { timeout: 60000 });
          await settle(page, 600);
          const band = await look(page);
          await page.keyboard.down('Tab'); await settle(page);
          const fan = await look(page);
          await page.keyboard.press('Digit2'); await settle(page);
          const drill = await look(page);
          await page.keyboard.up('Tab'); await settle(page);
          // (play it by the keys: the DI's row is Stack up and take point on 2, then the door's Open on 3)
          const di1 = band.kids.find(k => k.di)?.key ?? null;
          await page.keyboard.press(`Digit${di1}`);
          await page.waitForFunction(() => { const s = window.__olympus.stop(); return s?.phase === 'choose' && /^stop:door:/.test(window.__olympus.instinct()?.line?.act ?? ''); }, null, { timeout: 60000 });
          await settle(page, 500);
          const door = await look(page);
          out[W] = { band, fan, drill, door, di1 };
          const tiles = band.kids.filter(k => /\bstep\b/.test(k.cls));
          const sit = tiles.find(k => /\bsit\b/.test(k.cls)), tab = tiles.find(k => /tabtile/.test(k.cls));
          console.log(`      ${W}: band ${band.form}, ${tiles.length} tiles; ${sit?.name} (${sit?.col}/${sit?.row}), Tab "${tab?.name}"; 1 to 5 ${tiles.filter(k => /^[1-5]$/.test(k.key ?? '')).map(k => k.name).join(' · ')}; the core ${tiles.filter(k => /^[06-9]$/.test(k.key ?? '')).map(k => `${k.key} ${k.tag.trim() || '-'}`).join(' · ')}; the line "${band.line}" keys ${band.rowKeys.join(' › ')}, the lit tile ${di1}`);
          console.log(`      ${W}: Tab held ${fan.form}, wheel lit ${fan.wheel}; Tab 2: ${drill.card} · ${drill.kids.filter(k => /^[1-9]$/.test(k.key ?? '')).map(k => `${k.key} ${k.name}`).join(' · ')}; after ${di1}: the line "${door.line}", the lit tile ${door.kids.find(k => k.di)?.key} (${door.kids.find(k => k.di)?.name})`);
          assert(band.form === 'tiles' && tiles.length === 12 && band.inside && sit?.name === 'AT THE DOOR' && sit.icon && sit.col === '1' && sit.row === '1' && tab?.col === '1' && tab.row === '2', JSON.stringify({ W, form: band.form, n: tiles.length, sit, tab, inside: band.inside }));
          assert(['1', '2', '3', '4', '5'].every(k => tiles.find(t => t.key === k)?.row === '1') && ['6', '7', '8', '9', '0'].every(k => tiles.find(t => t.key === k)?.row === '2'), JSON.stringify(tiles.map(t => [t.key, t.col, t.row])));
          assert(W === 1024 || (/FIX/.test(tiles.find(t => t.key === '8')?.tag ?? '') && /MUZZLE/.test(tiles.find(t => t.key === '9')?.tag ?? '')), JSON.stringify(tiles.map(t => [t.key, t.tag])));
          assert(fan.form === 'fan' && !fan.wheel && drill.wheel && /DRILL/.test(drill.card ?? '') && /OUTSIDE A DOOR/.test(drill.card ?? '') && drill.inside, JSON.stringify({ fan: fan.form, card: drill.card }));
          assert(di1 === '2' && band.rowKeys.join() === '2' && door.kids.find(k => k.di)?.key === '3' && door.rowKeys.join() === '3', JSON.stringify({ di1, keys: band.rowKeys, door: door.rowKeys, lit: door.kids.find(k => k.di) }));
          if (W === 1024) assert(band.small && tiles.filter(k => /^[1-5]$/.test(k.key ?? '')).every(k => !/\s/.test(k.name.trim())), JSON.stringify(tiles.map(k => k.name)));
          else assert(!band.small, 'not small at 1600');
        }
        await page.screenshot({ path: '/dev/null' }).catch(() => {});
      }, { port, viewport: { width: 1600, height: 900 }, query: 'play=test-shoothouse&setup=go&tier=private&seed=1489397426&nostore=1&panel=c' });
    },
  },
  {
    name: 'the head called for is unmistakable in the page (the question of 2026-11-14: in Pairs and Three bangs the head moved from 1 to 4 and the old habit misfires; one panel model): at the plate\'s still-up, the DI says "To the head: 4.", tile 4 (To the head) is edged in brass and the other shots on 1 and 3, and the core\'s Fire on 6, stand aside, dimmed',
    heavy: true,
    timeoutMs: 600000,
    async fn() {
      const port = Number(process.env.OLYMPUS_TEST_PORT) || undefined;
      await withGame(async (page, errors, game) => {
        for (const setup of [null, 'bangs']) {
          await game.open(`play=test-pairs&seed=48213&tier=private${setup ? `&setup=${setup}` : ''}&nostore=1&panel=c`);
          const got = await page.evaluate(async ({ setup }) => {
            const h = window.__olympus;
            const { pairsBot } = await import('/tests/bots/pairs.mjs');
            const { playerActor } = await import('/src/core/ids.js');
            h.pause(true);
            const b = pairsBot();
            for (let t = 0; t < 20 * 60 * 15; t++) {
              const s = h.state, me = playerActor(s);
              if (s.skip?.engine === 'ff') { h.sim.ffTick(s); continue; }
              const l = h.instinct()?.line;
              if (l?.row === 'shot:head' && s.stop?.mode === 'stop' && s.stop.phase === 'choose') return { tick: s.clock.tick, text: l.text, str: s.armoury.range.str?.k ?? null, setup };
              h.step(1, b(s, me, (me.bot ??= {})));
            }
            return null;
          }, { setup });
          await page.evaluate(() => window.__olympus.pause(false));
          await settle(page, 700);
          const v = await look(page), on = (k) => v.kids.find(x => x.key === k) ?? null;
          console.log(`      ${setup ?? 'Pairs'}: string ${got?.str}, "${got?.text}"; the line "${v.line}"; ${['1', '2', '3', '4', '5', '6'].map(k => `${k} ${on(k)?.name ?? '-'}${on(k)?.di ? ' [DI]' : ''}${/\baside\b/.test(on(k)?.cls ?? '') ? ' (aside)' : ''}`).join(' · ')}`);
          if (!setup) await page.screenshot({ path: new URL('../.run/v016/keys/pairs-head.png', import.meta.url).pathname }).catch(() => {});
          assert(got && /To the head: 4\./.test(v.line) && on('4')?.di && /head/i.test(on('4')?.name ?? '') && /\baside\b/.test(on('1')?.cls ?? '') && /\baside\b/.test(on('3')?.cls ?? '') && /\baside\b/.test(on('6')?.cls ?? '') && !on('1')?.di, JSON.stringify({ got, line: v.line, kids: v.kids.map(k => [k.key, k.name, k.di, k.cls]) }));
        }
      }, { port, viewport: { width: 1600, height: 900 }, query: 'play=test-pairs&seed=48213&tier=private&nostore=1&panel=c' });
    },
  },
];
