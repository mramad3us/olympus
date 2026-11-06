// OLYMPUS people: the staff of a post, drawn from the world's seed for the post and stood at it (PEOPLE §3.13; the build sheet 0.0.5 §2.2, §8 item 24).
//
// The user, 2026-11-05: "All people generated": the range officer in the tower and the coach at your
// shoulder are generated people, never written characters. A post is authored (src/data/people/
// posts.js: what it is, the ranks it takes, its MOS and unit); drawStaff(state, postKey) draws its
// person as the roster draws a billet's (src/sim/people/roster.js drawCore: sex, rank by the post's
// weights, age, home, background, traits, looks), but on the post's own stream, stream('staff', seed,
// site, post), and names them on its side streams (admitStaff), so the roster, the player and their
// goldens move by nothing; they are tier 3 (PEOPLE §3.1's persistent tier for the people you meet
// on duty), registered by name, with no billet in any unit (service.billet names the post), and roll
// with a lazy sheet by their rank's tier (src/sim/skills/templates.js sheetOf: written nowhere).
// The same world draws the same person for a post; drawing a post already filled gives its holder.
// setPost(state, pid, pose) stands them at their post (person.post = { key, area, x, z, y, face,
// posture, outfit }: src/sim/people/place.js places them there and nowhere else while posted); null
// stands them down.
import { stream } from '../../core/rng.js';
import { POSTS } from '../../data/people/posts.js';
import { drawCore, admitStaff } from './roster.js';
import { notePosts } from './place.js';

/** The post a person holds, by their service (its unit and billet word), or null. */
export function postOf(p) {
  const s = p?.service;
  if (!s?.billet) return null;
  for (const [k, P] of Object.entries(POSTS)) if (P.key === s.billet && P.unitId === s.unitId) return k;
  return null;
}

/** A post's holder now, if drawn: the person whose service names the post. */
export function holderOf(state, postKey) {
  if (!POSTS[postKey]) return null;
  for (const id of Object.keys(state.people ?? {})) if (postOf(state.people[id]) === postKey) return id;
  return null;
}

/** Draw a post's person (see the header): their person id. */
export function drawStaff(state, postKey) {
  const P = POSTS[postKey];
  if (!P) throw new Error(`people: no staff post '${postKey}' (${Object.keys(POSTS).join(', ')})`);
  const had = holderOf(state, postKey);
  if (had) return had;
  const seed = state.meta.seed;
  const def = { key: P.key, what: P.what, ranks: P.ranks, mos: P.mos, branch: P.branch, unitId: P.unitId, site: P.site };
  const core = drawCore(seed, P.unitId, def, 3, stream('staff', seed, P.site, P.key));
  return admitStaff(state, core, def, { base: ['staff', seed, P.site, P.key] });
}

/** Stand a person at a post, or stand them down (see the header). */
export function setPost(state, pid, pose) {
  const p = state.people?.[pid];
  if (!p) return null;
  if (!pose) delete p.post;
  else {
    const key = pose.key ?? postOf(p);
    p.post = { key, area: pose.area, x: pose.x, z: pose.z, ...(pose.y ? { y: pose.y } : {}), face: pose.face ?? 'down',
      ...(pose.posture && pose.posture !== 'stand' ? { posture: pose.posture } : {}), outfit: pose.outfit ?? POSTS[key]?.outfit ?? 'utilities' };
  }
  notePosts(state);
  return p.post ?? null;
}

/** A staff person's word for themselves on the radio box: 'SSgt Okafor'. */
export function staffName(state, pid) {
  const p = state.people?.[pid];
  return p ? `${p.service?.rank ?? ''} ${p.name?.family ?? ''}`.trim() : '';
}
