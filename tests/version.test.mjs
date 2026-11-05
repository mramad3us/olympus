// The release tooling's invariants. VERSION is MAJOR.MINOR.PATCH (a release candidate's with its
// -rcN, as tools/release.sh writes it). CHANGELOG.md has its Unreleased section for the next
// release, and its stamped entries run newest first, each version once, the newest being VERSION's
// (none before the first release, at 0.0.0). release.sh runs the tests after stamping, so these
// read the version being released, not the one before.
import { readFileSync } from 'node:fs';
import { assert } from './helpers.mjs';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const parse = v => { const m = /^(\d+)\.(\d+)\.(\d+)(?:-rc(\d+))?$/.exec(v); return m && [+m[1], +m[2], +m[3], m[4] === undefined ? Infinity : +m[4]]; };
const newer = (a, b) => { for (let k = 0; k < 4; k++) if (a[k] !== b[k]) return a[k] > b[k]; return false; };   // (a candidate before its release)

export default [
  {
    name: 'VERSION is MAJOR.MINOR.PATCH, or a candidate\'s MAJOR.MINOR.PATCH-rcN',
    fn: () => {
      assert(/^\d+\.\d+\.\d+(-rc\d+)?\n?$/.test(read('VERSION')), `VERSION reads ${JSON.stringify(read('VERSION'))}`);
      console.log(`      VERSION ${read('VERSION').trim()}`);
    },
  },
  {
    name: 'CHANGELOG.md keeps an Unreleased section',
    fn: () => assert(/^## Unreleased$/m.test(read('CHANGELOG.md')), 'no "## Unreleased" heading'),
  },
  {
    name: 'CHANGELOG.md: its entries run newest first, each once, and the newest is VERSION\'s',
    fn: () => {
      const version = read('VERSION').trim();
      const heads = [...read('CHANGELOG.md').matchAll(/^## (.*)$/gm)].map(m => m[1]);
      const entries = heads.filter(h => h !== 'Unreleased').map(h => {
        const m = /^v(\d+\.\d+\.\d+(?:-rc\d+)?) \((\d{4}-\d{2}-\d{2})\)$/.exec(h);
        assert(m, `a heading that isn't "## vX.Y.Z (YYYY-MM-DD)": "## ${h}"`);
        return { v: m[1], day: m[2] };
      });
      assert(heads[0] === 'Unreleased', `the first heading is "## ${heads[0]}", not Unreleased`);
      for (let k = 1; k < entries.length; k++) {
        assert(newer(parse(entries[k - 1].v), parse(entries[k].v)), `v${entries[k - 1].v} is listed above v${entries[k].v}`);
        assert(entries[k - 1].day >= entries[k].day, `v${entries[k - 1].v} (${entries[k - 1].day}) is dated before v${entries[k].v} (${entries[k].day})`);
      }
      if (entries.length) assert(entries[0].v === version, `the newest entry is v${entries[0].v}, VERSION is ${version}`);
      else assert(version === '0.0.0', `VERSION is ${version} with no release in CHANGELOG.md`);
      console.log(`      ${entries.length} releases in CHANGELOG.md${entries.length ? `, the newest v${entries[0].v} (${entries[0].day})` : ''}`);
    },
  },
];
