// OLYMPUS render: the kit's devices on the stage, the shoot house's grenades and bursts drawn by the bangs layer (VIEWS §7.3; the build sheet 0.0.18 §2.3, §11).
//
// The house's look (look.js: burst.js devicesLook) gives the grenades thrown, each with its arc from the hand at its release and
// its burst at its fuse, and the bursts of the last seconds, in the shape the bangs layer (bangs.js) already draws the training
// bangs in: the body flying and on the floor, the flash at its real size and time with its lamp, the smoke. bangListOf(rl) is the
// view's one list: the pairs' and the stress course's bangs as before (null where none, so a scene without the kit draws as it
// did), the house's added. A charge placed on its door is not drawn this round (D1: the burst is).
// Pure.

/** The bangs the view draws from a range look (see the header): a list, or null where there is none. */
export function bangListOf(rl) {
  const before = rl?.stress?.bangs?.length ? [...(rl?.pairs?.bangs ?? []), ...rl.stress.bangs] : rl?.pairs?.bangs ?? null;
  const kit = rl?.house?.bangs ?? [];
  return kit.length ? [...(before ?? []), ...kit] : before;
}
