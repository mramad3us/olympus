// OLYMPUS arms: the guns' models, their kinds, their magazines and their optics (WEAPONS §3; the build sheet 0.0.5 §2.1).
//
// Tradecraft's shape kept (src/sim/firearms.js KINDS, FAMILIES, MODELS), its data replaced by
// WEAPONS §3's Martian arsenal:
//   KINDS     what a kind of gun is like to shoot and carry (§3.2): the shot's base DC (§7.2), the
//             sight picture and the turn (× a pistol's: tradecraft's), the hands it takes (two is a
//             sling, not a pocket) and how far it may be aimed. All eight of §3.2's kinds are here, so
//             the shot's DC has its table whole.
//   MODELS    a gun's model (§3.2, §3.8): its maker, calibre and barrel, how it feeds (a box magazine of
//             its family), its safety ('selector', 'manual' or 'none'; a selector's ring in its real
//             order, §3.4), whether the bolt holds open on the last round, whether the lever needs the
//             hammer cocked to reach safe (the R-7's AR-pattern trait), whether it has a port cover,
//             and how it shoots (rpm, recoil, loudness, accuracy, the unreliability and dust factors
//             that multiply §4.3's rates). This round's cut is the R-7, the player's rifle, and from the shoot house's
//             rework (R6, 2026-11-13; COMBAT §25.19.6) the P-12, the sidearm issued in close quarters from the Sergeant up:
//             a striker pistol with a manual safety, its HAD-17 of 17, its irons (the RD-1P red dot waits: my call, so
//             the shot's optic row stays the SO-4's alone).
//   FAMILIES  box magazines (§3.3): the calibre, the rounds, the masses empty and full, the length and
//             volume, a counter (a Hall sensor the HUD link reads) or a witness window.
//   OPTICS    the optic as issued (§3.5): the SO-4, 1× to 4× on its throw lever (0.0.7: the lever, the
//             sight picture 1.00 at 1× as v0.0.5 timed it and 1.20 at 4×, WEAPONS §3.5), its turrets in
//             clicks of 0.1 mrad to ±60 (the metric turret, my call) and its reticle's hold marks every
//             0.5 mrad to ±3 (the build sheet 0.0.7 §2.1, §4).
// A gun's state is not here: it is its record in state.items (firearms.js); a model is what every gun
// of the model shares. Data only: frozen literals and three lookups that read them.

/** The kinds (WEAPONS §3.2): { word, baseDC, sight, turn, hands, aimToM, … }. */
export const KINDS = Object.freeze({
  pistol: Object.freeze({ word: 'a pistol', baseDC: 10, sight: 1.00, turn: 1.00, hands: 1, aimToM: 100, positionK: 0.5 }),
  smg: Object.freeze({ word: 'a submachine gun', baseDC: 6, sight: 1.05, turn: 0.95, hands: 2, aimToM: 200 }),
  pdw: Object.freeze({ word: 'a personal defence weapon', baseDC: 6, sight: 1.05, turn: 0.95, hands: 2, aimToM: 250 }),
  carbine: Object.freeze({ word: 'a carbine', baseDC: 1, sight: 1.15, turn: 0.85, hands: 2, aimToM: 600 }),
  rifle: Object.freeze({ word: 'a rifle', baseDC: 0, sight: 1.20, turn: 0.80, hands: 2, aimToM: 800 }),
  dmr: Object.freeze({ word: 'a marksman\'s rifle', baseDC: -1, sight: 1.35, turn: 0.70, hands: 2, aimToM: 1200 }),
  lmg: Object.freeze({ word: 'a light machine gun', baseDC: 1, sight: 1.40, turn: 0.60, hands: 2, aimToM: 1000, standing: -2 }),
  shotgun: Object.freeze({ word: 'a shotgun', baseDC: 6, sight: 1.10, turn: 0.85, hands: 2, aimToM: 60, close: -3, closeM: 12 }),
  gl: Object.freeze({ word: 'a grenade launcher', baseDC: 4, sight: 1.30, turn: 0.80, hands: 2, aimToM: 400 }),
});

/** The models (WEAPONS §3.2, §3.8; the R-7, and the P-12 from the rework's R6): id → the model's record. */
export const MODELS = Object.freeze({
  r7: Object.freeze({
    maker: 'had', name: 'an R-7 rifle', short: 'R-7', kind: 'rifle', cal: '6.5x40r', barrelMm: 460, feed: 'mag', fam: 'had30',
    fams: Object.freeze(['had30', 'had30c']), action: 'semi', safety: 'selector', ring: Object.freeze(['safe', 'semi', 'auto']),
    holdOpen: true, safeNeedsCocked: true, portCover: true, chamberSensor: true,
    massKg: 3.9, lenCm: 92, lenFoldCm: 85, rpm: 700, optic: 'so4', acc: 0, recoil: 0.70, loud: 1.4, unreliable: 1.0, dustK: 1.0, gloveK: 1.0,
  }),
  // (WEAPONS §3.2's #1: 0.96 kg loaded with its usual 17, so 0.75 kg empty, the magazine weighed apart (kit.js itemKg; my call); no
  // cyclic in the table (semi only), so the slide's cycle as a rate, 900 rounds a minute, for the splits' floor (shot.js fireMs; my call))
  p12: Object.freeze({
    maker: 'had', name: 'a P-12 pistol', short: 'P-12', kind: 'pistol', cal: '9x21r', barrelMm: 110, feed: 'mag', fam: 'had17',
    fams: Object.freeze(['had17']), action: 'semi', safety: 'manual', ring: Object.freeze(['safe', 'semi']),
    holdOpen: true, safeNeedsCocked: false, portCover: false, chamberSensor: false,
    massKg: 0.75, lenCm: 19.5, rpm: 900, optic: null, acc: 0, recoil: 1.0, loud: 1.0, unreliable: 1.0, dustK: 1.0, gloveK: 0.5,
  }),
});

/** Box magazines (WEAPONS §3.3): id → { word, cal, n, emptyG, fullG, lenCm, l, counter, window }. */
export const FAMILIES = Object.freeze({
  had30: Object.freeze({ word: 'a HAD-30 magazine', cal: '6.5x40r', n: 30, emptyG: 120, fullG: 360, lenCm: 21, l: 0.27, counter: false, window: true }),
  had30c: Object.freeze({ word: 'a HAD-30C magazine', cal: '6.5x40r', n: 30, emptyG: 135, fullG: 375, lenCm: 21, l: 0.27, counter: true, window: true }),
  // (WEAPONS §3.3: the P-12's, no counter)
  had17: Object.freeze({ word: 'a HAD-17 magazine', cal: '9x21r', n: 17, emptyG: 80, fullG: 210, lenCm: 12, l: 0.06, counter: false, window: true }),
});

/** Optics (WEAPONS §3.5): the SO-4, its lever's two settings, the sight picture at each, its turrets and its reticle. */
export const OPTICS = Object.freeze({
  so4: Object.freeze({ word: 'the SO-4', magMin: 1, magMax: 4, mags: Object.freeze([1, 4]), sight: 1.0, sightAt: Object.freeze({ 1: 1.0, 4: 1.2 }), throwLever: true, reddot: true, link: true, massG: 480,
    clickMrad: 0.1, turretMaxClk: 60, tickMrad: 0.5, holdMaxMrad: 3 }),
});
/** The sight picture × of an optic at a magnification (the aim's time: shot.js aimS). */
export const opticSight = (O, mag = 1) => O?.sightAt?.[mag] ?? O?.sight ?? 1;

/** A gun's model record (gun: its item record, or a model id), or null. */
export const modelOf = (gun) => MODELS[typeof gun === 'string' ? gun : gun?.model] ?? null;
/** A model's kind record, or null. */
export const kindOf = (M) => KINDS[M?.kind] ?? null;
/** Whether a model is a long gun (two hands: a sling, not a holster). */
export const isLong = (M) => (KINDS[M?.kind]?.hands ?? 1) > 1;
/** A family's capacity (rounds), 0 when unknown. */
export const famCap = (fam) => FAMILIES[fam]?.n ?? 0;
