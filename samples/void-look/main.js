// OLYMPUS sample: the two new places' look and sounds, Well A's deck and holds and the ship's siren and the boots' clank (v0.0.24's
// stage 0, its build sheet §0 item 27). The pictures are ./deck.js's (P: ?p=P-a|P-b, the deck; H: ?h=H-a|H-b, the holds) and
// ./sounds.js's (S: ?s=S-a|S-b, the siren; K: ?k=K-a|K-b, the clank; see their headers); this page shows one, scaled up by a whole
// number. A sound's view plays it live (the gallery's O, or ?live=1): Space or a click.
import { picture as deck } from './deck.js';
import { picture as sound, play } from './sounds.js';
import { show } from '../portrait-lib/page.js';

const q = new URLSearchParams(location.search), heard = q.has('s') || q.has('k');
const P = heard ? sound(q) : deck(q);
show(P);
if (heard && (q.get('live') === '1' || q.get('hud') === '1')) {
  addEventListener('keydown', (e) => { if (e.code === 'Space') play(P.report.view); });
  addEventListener('pointerdown', () => play(P.report.view));
}
