// OLYMPUS arms: the devices' catalogue (WEAPONS §12.1; the build sheet 0.0.18 §2.3, §4), data in a leaf with no imports.
//
// devices.js holds the devices' states, actions and readers and re-exports this table; kit.js reads it for a device's mass and
// what a pouch holds. Both import it from here, so kit.js never imports devices.js, which imports kit.js's readers (the code review
// of v0.0.18: the two imported each other, a cycle that would throw on the first top-level read of the other's table). Pure data.
const fz = (o) => Object.freeze(o);

/**
 * The catalogue (WEAPONS §12.1, the build sheet's §4): model → { kind, word, short, massG and massKg, tntKg?, fuseMs? (a flat fuse) |
 * fuse: [lo, hi] (each grenade's own, its stream), cook, flash?, frag?, on?, side?, placeS?, dc?, force?, misfireP?, spoolM?,
 * look: { shape, colour } (for the doll), issued }. My calls but the WEAPONS figures: the SC-1, FD-1, halligan and ram are new.
 */
// (each its mass in grams as the table gives it, its massKg derived)
const dev = (o) => fz({ ...o, massKg: o.massG / 1000 });
export const DEVICES = fz({
  g11: dev({ kind: 'grenade', word: 'G-11 stun grenade', short: 'G-11', massG: 380, tntKg: 0.0143, fuseMs: 1500, cook: false, flash: true, look: fz({ shape: 'can', colour: 'olive' }), issued: true }),
  g9: dev({ kind: 'grenade', word: 'G-9 fragmentation grenade', short: 'G-9', massG: 400, tntKg: 0.24, fuse: fz([4000, 4800]), cook: true, frag: fz({ K: 160 }), look: fz({ shape: 'egg', colour: 'olive' }), issued: false }),
  g9p: dev({ kind: 'grenade', word: 'G-9P practice grenade', short: 'G-9P', massG: 400, tntKg: 0.004, fuse: fz([4000, 4800]), cook: true, as: 'g9', look: fz({ shape: 'egg', colour: 'blue' }), issued: false }),
  g13: dev({ kind: 'grenade', word: 'G-13 concussion grenade', short: 'G-13', massG: 450, tntKg: 0.23, fuse: fz([4000, 4800]), cook: true, look: fz({ shape: 'can', colour: 'black' }), issued: false }),
  g13p: dev({ kind: 'grenade', word: 'G-13P practice grenade', short: 'G-13P', massG: 450, tntKg: 0.004, fuse: fz([4000, 4800]), cook: true, as: 'g13', look: fz({ shape: 'can', colour: 'blue' }), issued: false }),
  g12: dev({ kind: 'grenade', word: 'G-12 smoke grenade', short: 'G-12', massG: 600, fuseMs: 1500, cook: false, look: fz({ shape: 'can', colour: 'grey' }), issued: false }),
  sc1: dev({ kind: 'charge', word: 'SC-1 strip charge', short: 'SC-1', massG: 350, tntKg: 0.10, on: fz(['push']), side: 'latch', placeS: 6.0, dc: 10, look: fz({ shape: 'strip', colour: 'olive' }), issued: true }),
  fd1: dev({ kind: 'initiator', word: 'FD-1 firing device and shock tube', short: 'FD-1', massG: 250, spoolM: 15, misfireP: 0.01, look: fz({ shape: 'spool', colour: 'orange' }), issued: true }),
  hal: dev({ kind: 'tool', word: 'halligan', short: 'Halligan', massG: 3000, force: fz({ s: 3.0, dcK: -4, on: fz(['push', 'pull']) }), look: fz({ shape: 'bar', colour: 'steel' }), issued: true }),
  ram: dev({ kind: 'tool', word: 'ram', short: 'Ram', massG: 12000, force: fz({ s: 1.0, dcK: -6, swing: true, on: fz(['push']) }), look: fz({ shape: 'ram', colour: 'black' }), issued: true }),
});
