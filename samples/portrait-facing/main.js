// OLYMPUS sample: a man turned on the target card, and the card's body (the build sheet v0.0.23 §1 items 4 and 8). The pictures
// are ./facing.js's (see its header: ?v=<candidate>, the candidates C's ./views.js); this page shows one, scaled up by a whole number.
import { picture } from './facing.js';
import { show } from '../portrait-lib/page.js';

show(picture(new URLSearchParams(location.search)));
