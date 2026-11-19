// OLYMPUS sample: the gun in his hands on the target card (the build sheet v0.0.23 §1 items 1 and 8; P§6.1). The pictures are
// ./gun.js's (see its header: ?g=G1|G2|G3, ?w=W1|W2, ?h=H1|H2); this page shows one, scaled up by a whole number.
import { picture } from './gun.js';
import { show } from '../portrait-lib/page.js';

show(picture(new URLSearchParams(location.search)));
