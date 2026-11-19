// OLYMPUS sample: mag boots and the anchors on the figure and the doll (the build sheet v0.0.23 §1 item 8; the anywhere round's
// AW§5). The pictures are ./boots.js's (B: ?b=B-a|B-b|B-c) and ./anchors.js's (H: ?h=H-a|H-b|H-c; see their headers); this page
// shows one, scaled up by a whole number.
import { picture as boots } from './boots.js';
import { picture as anchors } from './anchors.js';
import { show } from '../portrait-lib/page.js';

const q = new URLSearchParams(location.search);
show(q.has('h') ? anchors(q) : boots(q));
