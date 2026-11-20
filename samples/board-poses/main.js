// OLYMPUS sample: "A man in a real fight", blind fire and a man down at 0 G (the build sheet v0.0.27 §10). The pictures are
// ./board.js's (see its header: ?c=<candidate>, the candidates ./poses.js); this page shows one, scaled up by a whole number.
import { picture } from './board.js';
import { show } from '../portrait-lib/page.js';

show(picture(new URLSearchParams(location.search)));
