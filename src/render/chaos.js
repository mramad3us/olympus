// OLYMPUS render: the chaos on the picture. What felt suppression, the startle and a bang's flash do to what the marine sees (VIEWS §7.3). Pure.
//
// COMBAT §5's model is the sim's (src/sim/combat/supp.js suppNow: the band of what is felt, the startle's span, the
// flash-blindness and the dazzle with the share of each still to run); this module turns one reading of it into the post
// pass's numbers (src/render/post.js setChaos), and the view (view.js) eases them and draws them. Never a number of felt:
// the picture shows the band, in palette, applied in the post pass before the palette snap.
//   - the band (VIEWS §7.3's table): under fire VIGNETTE_K 6% darker at the corners, suppressed 14% with the edge
//     dithered, pinned 24% and the colour drained DRAIN_K 20% (Easterbrook's narrowing; Artwohl's tunnel vision, COMBAT
//     §5.10); calm (the tier one's felt 10 under three bangs) nothing. The view eases a band's change over CHAOS_EASE_S of
//     real time, so a tick's step never pops;
//   - the startle (COMBAT §5.7): the picture held STARTLE_DARK 12% dark from its start to its end, and one frame lit pale
//     (PALE_K) on its start: the view lights the first frame it draws at or after a startle's fromMs, once a startle,
//     and none under "reduce flashes";
//   - flash-blind (COMBAT §11.4, BODY §17.3): the picture white where the eyes faced the burst (the cone FLASH_CONE_DEG
//     either side of the facing whole, falling to nothing at FLASH_DAZZLE_DEG), by blind.k, the share of the blindness
//     still to run, the sim's number at each tick (never a filter that outlives it); as it fades, a dark afterimage
//     where the flash stood (AFTER_K at its strongest halfway, AFTER_R_M round the burst); dazzled, a pale veil by
//     dazzle.k (DAZZLE_VEIL). Under "reduce flashes" no white: a REDUCED_GREY 60% grey veil over the same cone, and the
//     dazzle's veil grey and halved (VIEWS §12).
// chaosOf(sn, opts) is the model of one reading; easeChaos(shown, want, dtS) the view's easing; both pure, the view-range
// and ui-bangs tests read them in node.

/** The corners' darkening by the band (0 calm, 1 under fire, 2 suppressed, 3 pinned), the colour drained when pinned (VIEWS §7.3). */
export const VIGNETTE_K = Object.freeze([0, 0.06, 0.14, 0.24]), DRAIN_K = 0.2;
/** The band from which the vignette's edge is dithered (suppressed). */
export const DITHER_FROM_BAND = 2;
/** The startle's dark (a share of the picture's light taken), and its one pale frame's mix toward the pale. */
export const STARTLE_DARK = 0.12, PALE_K = 0.55;
/** The flash's white cone: whole within FLASH_CONE_DEG either side of the facing, nothing past FLASH_DAZZLE_DEG (COMBAT §11.4's angles). */
export const WHITE_CONE_DEG = 60, WHITE_EDGE_DEG = 120;
/** The afterimage: its darkening at its strongest (halfway through the fade), and its radius round the burst (m: the flash's 1.2 m). */
export const AFTER_K = 0.6, AFTER_R_M = 1.2;
/** The dazzle's pale veil at its start; under "reduce flashes" the grey veil in the flash's place (VIEWS §12). */
export const DAZZLE_VEIL = 0.5, REDUCED_GREY = 0.6;
/** A band's change eases over this long (s of real time). */
export const CHAOS_EASE_S = 0.6;

/** Nothing on the picture: the post pass's rest. */
export const CALM = Object.freeze({ band: 'calm', bandN: 0, vignette: 0, dither: 0, drain: 0, dark: 0, startle: null, white: 0, grey: 0, veil: 0, veilGrey: 0, after: 0, burst: null, face: null });

const clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));
const FACE_DIR = Object.freeze({ right: [1, 0], left: [-1, 0], up: [0, -1], down: [0, 1] });

/**
 * One reading of the chaos (suppNow's record, or null) as the picture's numbers: { band, bandN, vignette, dither, drain,
 * dark, startle: { fromMs, untilMs } | null, white, grey, veil, veilGrey, after, burst, face }. opts: { ms (the moment
 * drawn), reduce (the "reduce flashes" setting), face (the player's facing: 'right' …), burst ({ x, z }: where the flash
 * stood, the last bang's) }. white is blind.k (grey in its place when reduced), veil dazzle.k × DAZZLE_VEIL.
 */
export function chaosOf(sn, { ms = null, reduce = false, face = 'right', burst = null } = {}) {
  if (!sn) return CALM;
  const n = Math.max(0, Math.min(3, Math.round(Number(sn.bandN) || 0)));
  const st = sn.startle && Number.isFinite(sn.startle.untilMs) && (ms === null || ms < sn.startle.untilMs) ? { fromMs: sn.startle.fromMs, untilMs: sn.startle.untilMs } : null;
  const bk = sn.blind ? clamp01(sn.blind.k) : 0, dk = sn.dazzle ? clamp01(sn.dazzle.k) : 0;
  return {
    band: sn.band ?? 'calm', bandN: n,
    vignette: VIGNETTE_K[n], dither: n >= DITHER_FROM_BAND ? 1 : 0, drain: n >= 3 ? DRAIN_K : 0,
    dark: st ? STARTLE_DARK : 0, startle: st,
    white: reduce ? 0 : bk, grey: reduce ? REDUCED_GREY * bk : 0,
    veil: reduce ? 0 : DAZZLE_VEIL * dk, veilGrey: reduce ? DAZZLE_VEIL * dk / 2 : 0,
    // (the afterimage: nothing while the white is whole, strongest halfway through its fade, gone with it)
    after: bk > 0 ? AFTER_K * Math.min(1, 4 * bk * (1 - bk)) : 0,
    burst: bk > 0 || dk > 0 ? burst ?? null : null, face: FACE_DIR[face] ? face : 'right',
  };
}

/** The facing as a unit vector in the picture (x right, y down: north is up). */
export const faceDir = (face) => FACE_DIR[face] ?? FACE_DIR.right;

/** The white's share at a picture offset (dx, dy px from the eyes) for a facing: 1 within the cone, 0 past its edge, smooth between; 1 at the eyes. */
export function coneK(dx, dy, face = 'right') {
  const d = Math.hypot(dx, dy);
  if (d < 1e-6) return 1;
  const [fx, fy] = faceDir(face), c = (dx * fx + dy * fy) / d;
  const c0 = Math.cos(WHITE_EDGE_DEG * Math.PI / 180), c1 = Math.cos(WHITE_CONE_DEG * Math.PI / 180), t = clamp01((c - c0) / (c1 - c0));
  return t * t * (3 - 2 * t);
}

/**
 * The view's easing of the band's numbers toward a reading (dtS of real time; CHAOS_EASE_S): the vignette, the drain and
 * the dither ease, so a band's step never pops; the startle, the flash and the dazzle are the sim's at each tick and are
 * not eased (the white fades by blind.k itself). shown: the last frame's (or null: snapped).
 */
export function easeChaos(shown, want, dtS = 0) {
  if (!shown || !(dtS > 0)) return { ...want };
  const k = 1 - Math.exp(-dtS / (CHAOS_EASE_S / 3)), out = { ...want };
  for (const key of ['vignette', 'drain', 'dither']) out[key] = shown[key] + (want[key] - shown[key]) * k;
  if (Math.abs(out.vignette - want.vignette) < 1e-3) out.vignette = want.vignette;
  if (Math.abs(out.drain - want.drain) < 1e-3) out.drain = want.drain;
  if (Math.abs(out.dither - want.dither) < 1e-3) out.dither = want.dither;
  return out;
}
