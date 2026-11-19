// OLYMPUS sample: "A man in the bang", the role-player's daze and cower (the build sheet v0.0.26 §10). The pictures are
// ./breach.js's (see its header: ?c=<candidate>, the candidates ./poses.js); this page shows one, scaled up by a whole number.
import { picture } from './breach.js';
import { show } from '../portrait-lib/page.js';

show(picture(new URLSearchParams(location.search)));
