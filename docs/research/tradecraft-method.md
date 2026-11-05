# TRADECRAFT's development method and tooling, ported to OLYMPUS

Research note, 2026-11-05. Slice: how tradecraft (`../tradecraft`) is versioned, released, played, tested and tooled, and what OLYMPUS should port, file by file. Tradecraft is at `v0.2.0-rc3` (HEAD `b0cea20`, 148 release tags, 157 commits, 2026-10-25 → 2026-11-05). Everything below was read without changing anything there: no servers run, no scripts run, no git writes.

**Files read** (tradecraft): `CLAUDE.md` (78 lines), `tools/release.sh` (112), `tools/promote.sh` (47), `tools/serve.py` (41), `tools/setup.sh` (66), `tools/gen.sh` (78), `tools/play.ps1` (89), `play.cmd` (8), `play.sh` (54), `tools/awake.sh` (122), `tools/gallery.mjs` (83), `tools/shot.mjs` (44), `tools/vendor-three.mjs` (61), `tests/run.mjs` (35), `tests/helpers.mjs` (13), `tests/bots.mjs` (129), `tests/browser.test.mjs` (285), `tests/syntax.test.mjs` (22), `tests/version.test.mjs` (17), `.gitignore`, `.gitattributes`, `package.json`, `CHANGELOG.md` (lines 1–250 and the oldest entries, 1180–1319), plus `.claude/settings.json`, `.claude/settings.local.json`, `docs/PIPELINE.md`, `docs/PLAYTESTS.md` (head), `docs/DESIGN.md` (method parts), `src/main.js` (header and debug handle), `samples/index.html`, `tests/rangebot.mjs`, `tests/shopwalk.mjs`, `tests/needs.test.mjs`. Compared with longhaul's `tests/run.mjs`, `tests/helpers.mjs`, `play.sh`, `package.json`, `CLAUDE.md`.

**OLYMPUS today** (`/Users/deaumas/lab/vibe/claudecode/Olympus`): one commit `a3481b9 Start OLYMPUS: readme, ignore list, keep-awake tool` on `main`, remote `origin https://github.com/mramad3us/olympus.git`. Present: `README.md`, `.gitignore` (`.DS_Store node_modules/ .run/ .play/ *.private ref/`), `tools/awake.sh` and `tools/bright.swift` (byte-identical copies of tradecraft's, still headed `TRADECRAFT:`), empty `.run/`, `docs/research/shots/`. No `.claude/settings.json` yet, so the keep-awake hooks aren't wired.

---

## 1. The method in one page

Tradecraft's `CLAUDE.md` calls itself "the method (how we version, play, test and work), carried over from longhaul (`../longhaul`) and tightened where longhaul taught us something". What it says:

1. **One version, one place.** `VERSION` (plain text, e.g. `0.2.0-rc3`) is read by the game (`src/main.js:44`: `fetch('VERSION')`) and by the scripts. Longhaul kept it in `js/version.js` as a string literal that `play.sh` scraped with `sed`.
2. **Patch numbers are Claude's; minor and major are the user's.** Work goes out in PATCH releases, "one per round of work and one per batch of the user's patch requests, as many as needed. Bump them as you please." The project stays on 0.0.x while the design settles. When the user declares a release candidate it becomes `0.1.0-rc1` (`release.sh rc --user-declared`). Fixes are rc2, rc3… (`release.sh rc`, Claude's to cut; patch is refused on a candidate). Only the user's validation makes it `0.1.0` (`release.sh minor --user-validated`). "The major (1.0) is the user's call too."
3. **Every release goes through `tools/release.sh`**: a commit `vX.Y.Z: <summary>` on `main` (subject under 72 characters; the detail goes in CHANGELOG.md), an annotated tag, and a push when there's a remote. "That's standing permission for release commits. Other commits, branches, merges and anything forced only when asked."
4. **CHANGELOG.md is the release history**, written under `## Unreleased` as the work happens; `release.sh` stamps it. "The release history doesn't go in memory (longhaul's memory grew to 36 KB of it)."
5. **The play copy.** The user plays `.play/`, a git worktree pinned to a release tag, served on its own port. It moves only through `tools/promote.sh`, and only on the user's go ("update my game", "go", "promote"). After a release, say what's in it and that it's ready to promote; don't promote unasked. If a release breaks their game, `tools/promote.sh <previous tag>` puts the last one back.
6. **Tests gate releases.** `npm test` runs inside `release.sh`; a failure puts VERSION and CHANGELOG back and releases nothing. `npm run test:quick` (`QUICK=1`) drops the tests marked `heavy: true`, "use it whenever the user may be playing", which you can tell from `lsof -nP -iTCP:8100 -sTCP:LISTEN`.
7. **Scratch copies** for experiments, parallel agents and baselines: `git worktree add <scratchpad>/<name> [ref]`, named for what they hold (`base-v0.3.2`, `exp-pathing`), removed when done. "Prep it but don't apply until I say go" means a branch or a scratch worktree, merged on the go. That's separate from promotion.
8. **The Mac stays awake while Claude works** (a lease renewed by hooks; section 9).
9. **Docs are the truth.** `README.md`, `docs/*.md` and the module headers are the source of truth for systems and numbers, updated in the same change. Memory holds only the user's preferences and decisions not written in the repo.
10. **Rules of the code** (from longhaul): vanilla ES modules, no build step, no runtime dependencies, browser, IndexedDB saves, fully offline; the sim is pure (no DOM, reports facts on a bus); one tick at a time in a fixed, documented order, and decisions made in a tick act on the next; state is plain data, keys starting with `$` are runtime-only and stripped from saves; a `SAVE_SCHEMA` with additive `upgradeState`; randomness only through one seeded rng module; units in constant names (`rangeM`, `speedMs`: "In longhaul, a wrong unit once made pirates charge to 800 km instead of 800,000 km"); a scale target set early (spatial indexes, no per-tick work over every entity, far things get outcomes not simulation); from day one a debug handle on `window` and save export/import as a JSON file ("Longhaul had to decode Chrome's IndexedDB blobs to get at a save"); visuals obey the sim (one quantity, one number, one shared helper); every module opens with a prose header; comments say why; **tests print the numbers that matter: read them, don't just count passes**.
11. **Working with the user**: they often play while asking for changes and drop patch requests mid-round, which get folded into the next patch release. If an auto-mode safety check blocks commands, say so and ask the user to switch modes rather than working around it. Kill any server you start.

**House style seen throughout tradecraft, not a recorded user statement:** script and module headers open `TRADECRAFT: <what it does>` with a colon, never an em dash (longhaul used `LONGHAUL —`). There are 0 em-dash lines in tradecraft's CHANGELOG.md and CLAUDE.md and 1 in all of `src/`, against 581 lines in longhaul's `js/`. Prose is plain British English ("colour", "licence", "armour") with numbers in the text. OLYMPUS should keep it: `OLYMPUS: …` headers, no em dashes.

**Design-method rule from DESIGN.md**, to carry over: "Each mechanic is built first as a playable test the user scores, before the mechanics are joined" (Q161; Road to 0.1.0). The look was settled the same way, through numbered samples the user scored. For example, v0.0.14's notes have the user's scores: "camera 95, night 90, environment 80, characters 35: 'front view is too boxy'". Claude's own choices are marked "my call" in the docs so the user can overrule them.

---

## 2. Two copies, two ports, two origins

```
working tree (main) ──── ./play.sh --dev ───► http://localhost:8101   (our origin: tests', smoke runs' saves)
     │
     │ tools/release.sh patch|rc|minor|major  → commit "vX.Y.Z: …" + annotated tag vX.Y.Z (+ push)
     ▼
tags v0.0.1 … v0.1.0-rc1 … v0.1.0 … v0.2.0-rc3
     │
     │ tools/promote.sh [tag]      (only on the user's go; an older tag rolls back)
     ▼
.play/  (git worktree, detached HEAD at a tag) ── ./play.sh ──► http://localhost:8100  (the user's origin and saves)
```

- **Saves live per browser origin** (IndexedDB and localStorage key on scheme+host+port). The play server's saves are the user's. The dev server, the browser tests (:8123) and the gallery (:8112) are other origins, so nothing they do touches the user's game.
- **The play copy never changes under the user's feet.** Promotion is a `git checkout --detach <tag>` inside `.play/`. Because the server sends `Cache-Control: no-store`, one reload picks up the new release whole. Saves survive because the origin is the same.
- **The working tree is always Claude's.** Longhaul's user played from the working copy, so its CLAUDE.md said "build and test in a scratch copy and apply the patch only when they say go". Tradecraft's play copy removed that need: "no scratch copy is needed just because they're playing."
- **Consequence for assets:** `.play/` is a checkout of a tag, so anything gitignored (built atlases, `node_modules`, caches) is **not** in it. Whatever the game loads at runtime must be committed, or generated by the game itself at runtime. Tradecraft commits `assets/` (18 MB of CC0 library assets) and vendors three.js into `vendor/three/` (2.4 MB), because "the game loads nothing from `node_modules`".
- **The live state shows the user sets the pace:** tradecraft's `.play` sits at `b550097` = `v0.2.0-rc1` while the latest release is `v0.2.0-rc3`.

---

## 3. `tools/release.sh`, in full

```bash
#!/usr/bin/env bash
# TRADECRAFT: cut a release.
#
#   tools/release.sh patch "<summary>" [--trailer "Key: value"]... [--no-test]
#   tools/release.sh rc    "<summary>" [--user-declared] [...]
#   tools/release.sh minor "<summary>" --user-validated [...]
#   tools/release.sh major "<summary>" --user-validated [...]
#
# One release, start to finish, so no step is forgotten:
#   1. the next version from VERSION (patch: 0.4.2 -> 0.4.3; minor: -> 0.5.0);
#   2. CHANGELOG.md's "## Unreleased" section becomes "## vX.Y.Z (date)", and
#      a fresh empty Unreleased goes above it (an empty Unreleased is refused:
#      every release says what it changed);
#   3. VERSION is written;
#   4. the tests run (QUICK=1 in the environment leaves out the heavy ones);
#   5. everything is committed as "vX.Y.Z: <summary>" with the trailers given,
#      and tagged vX.Y.Z (annotated, so --follow-tags pushes it);
#   6. pushed, if there is an origin.
# The play copy is not touched: promotion is tools/promote.sh, on the user's go.
#
# The minor and the major move only when the user has declared a release
# candidate and validated it:
#   - rc from a plain version (0.0.14) needs --user-declared, the user's word
#     that this is a candidate: it makes 0.1.0-rc1;
#   - rc from a candidate (0.1.0-rc1 -> 0.1.0-rc2) is a fix to the candidate,
#     ours to cut; patch is refused while on a candidate;
#   - minor --user-validated from a candidate makes its version (0.1.0-rc3 ->
#     0.1.0); from a plain version it moves the minor (0.1.7 -> 0.2.0).
#     --user-validated is the user's validation, said out loud.
set -eu
DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DIR"

usage() { sed -n '4,7p' "$0" | sed 's/^# *//'; exit 1; }
[ $# -ge 2 ] || usage
PART="$1"; SUMMARY="$2"; shift 2
TRAILERS=(); VALIDATED=0; DECLARED=0; TEST=1
while [ $# -gt 0 ]; do
  case "$1" in
    --trailer) TRAILERS+=(--trailer "$2"); shift 2 ;;
    --user-validated) VALIDATED=1; shift ;;
    --user-declared) DECLARED=1; shift ;;
    --no-test) TEST=0; shift ;;
    *) echo "unknown option: $1"; usage ;;
  esac
done

OLD=$(tr -d '[:space:]' < VERSION)
BASE=${OLD%%-rc*}; RC=""
[ "$BASE" != "$OLD" ] && RC=${OLD##*-rc}
IFS=. read -r MA MI PA <<< "$BASE"
SUFFIX=""
case "$PART" in
  patch)
    if [ -n "$RC" ]; then echo "On release candidate $OLD: a fix is the next candidate (rc), or the user validates it (minor --user-validated)."; exit 1; fi
    PA=$((PA + 1)) ;;
  rc)
    if [ -n "$RC" ]; then SUFFIX="-rc$((RC + 1))"
    elif [ $DECLARED = 1 ]; then MI=$((MI + 1)); PA=0; SUFFIX="-rc1"
    else echo "A first release candidate is the user's call: --user-declared says they declared it."; exit 1; fi ;;
  minor|major)
    if [ $VALIDATED = 0 ]; then
      echo "A $PART bump needs the user's validated release candidate (--user-validated). Patch releases need nothing."
      exit 1
    fi
    if [ -n "$RC" ] && [ "$PART" = minor ]; then :                # the candidate becomes its version
    elif [ "$PART" = minor ]; then MI=$((MI + 1)); PA=0
    else MA=$((MA + 1)); MI=0; PA=0; fi ;;
  *) usage ;;
esac
NEW="$MA.$MI.$PA$SUFFIX"
TAG="v$NEW"
SUBJECT="$TAG: $SUMMARY"

if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null; then echo "$TAG already exists."; exit 1; fi
[ ${#SUBJECT} -le 72 ] || echo "note: the subject is ${#SUBJECT} characters; keep it under 72 and put the detail in CHANGELOG.md."

mkdir -p .run
cp VERSION .run/VERSION.bak; cp CHANGELOG.md .run/CHANGELOG.md.bak
restore() { cp .run/VERSION.bak VERSION; cp .run/CHANGELOG.md.bak CHANGELOG.md; }

# The Unreleased section must say something.
python3 - "$NEW" "$(date +%Y-%m-%d)" <<'EOF'
import re, sys
ver, day = sys.argv[1], sys.argv[2]
p = 'CHANGELOG.md'
s = open(p).read()
m = re.search(r'^## Unreleased[ \t]*\n(.*?)(?=^## |\Z)', s, re.S | re.M)
if not m or not m.group(1).strip():
    sys.exit('CHANGELOG.md: write what this release changes under "## Unreleased" first.')
s = s[:m.start()] + f'## Unreleased\n\n## v{ver} ({day})\n\n{m.group(1).strip()}\n\n' + s[m.end():]
open(p, 'w').write(s)
EOF
echo "$NEW" > VERSION

if [ $TEST = 1 ] && [ -f package.json ] && grep -q '"test"' package.json; then
  if ! npm test --silent; then
    restore
    echo "Tests failed; nothing released (VERSION and CHANGELOG.md put back)."
    exit 1
  fi
fi

git add -A
git commit -q -m "$SUBJECT" ${TRAILERS[@]+"${TRAILERS[@]}"}
git tag -a "$TAG" -m "$SUBJECT"
echo "released $TAG ($(git rev-parse --short HEAD))"

if git remote get-url origin >/dev/null 2>&1; then
  git push -q --follow-tags origin HEAD && echo "pushed to origin"
fi
tools/promote.sh --status | sed -n 1p
```

### 3.1 What it does, step by step (line numbers are tradecraft's)

| Lines | Step |
|---|---|
| 30–32 | `set -eu`; `cd` to the repo root, whatever the caller's cwd. |
| 34 | `usage()` prints **header lines 4–7** of the script itself (`sed -n '4,7p'`). If you add usage lines to the header, change this range. |
| 35–46 | Needs at least `<part> <summary>`. Options: `--trailer "K: v"` (repeatable, passed to `git commit --trailer`), `--user-validated`, `--user-declared`, `--no-test`. Anything else is refused. |
| 48–51 | Reads VERSION, whitespace stripped. `BASE` is the version without `-rcN`, `RC` the candidate number (empty if none). `IFS=. read MA MI PA`. |
| 53–70 | The arithmetic (table below). |
| 71–73 | `NEW=MA.MI.PA[-rcN]`, `TAG=vNEW`, `SUBJECT="vNEW: <summary>"`. |
| 75 | Refuses if the tag already exists. |
| 76 | Only **warns** if the subject is over 72 characters. |
| 78–80 | Backs up VERSION and CHANGELOG.md into `.run/` (gitignored). `restore()` copies them back. |
| 83–93 | Python stamps the CHANGELOG (algorithm below), or exits non-zero if Unreleased is empty. Because of `set -e`, nothing has been written yet when it refuses. |
| 94 | Writes the new VERSION. |
| 96–102 | **The test gate.** Only if `package.json` exists and contains `"test"`, and `--no-test` wasn't given: `npm test --silent`. On failure it restores both files, prints "Tests failed; nothing released (VERSION and CHANGELOG.md put back).", and exits 1. The tests run **after** stamping, so `version.test.mjs` checks the new VERSION and the fresh empty Unreleased heading. `QUICK=1` and `SKIP=…` in the caller's environment pass through to the runner. |
| 104–107 | `git add -A` (**everything** not ignored), `git commit -q -m "$SUBJECT" --trailer …`, `git tag -a "$TAG" -m "$SUBJECT"` (annotated, so `--follow-tags` pushes it). Prints `released vX.Y.Z (<short sha>)`. |
| 109–111 | If `origin` exists: `git push -q --follow-tags origin HEAD`. |
| 112 | Prints the first line of `tools/promote.sh --status` (`play copy: vA.B.C`). The play copy itself is not touched. |

### 3.2 Version arithmetic (as written)

| VERSION before | Command | After | Notes |
|---|---|---|---|
| 0.0.14 | `patch` | 0.0.15 | Claude's, any time not on a candidate |
| 0.0.14 | `rc` | refused | "A first release candidate is the user's call: --user-declared says they declared it." |
| 0.0.14 | `rc --user-declared` | 0.1.0-rc1 | MI+1, PA=0 |
| 0.1.0-rc1 | `rc` | 0.1.0-rc2 | Claude's |
| 0.1.0-rc1 | `patch` | refused | "On release candidate …: a fix is the next candidate (rc), or the user validates it (minor --user-validated)." |
| 0.1.0-rc56 | `minor --user-validated` | 0.1.0 | the candidate becomes its version (line 66 `:`) |
| 0.1.7 | `minor --user-validated` | 0.2.0 | a direct minor bump with no candidate is allowed |
| 0.1.42 | `rc --user-declared` | 0.2.0-rc1 | what happened on 2026-11-05 |
| any plain | `minor`/`major` without the flag | refused | "A minor bump needs the user's validated release candidate (--user-validated)." |
| 0.x.y | `major --user-validated` | 1.0.0 | direct |
| 0.10.0-rc2 | `major --user-validated` | 1.0.0 | works only by falling through to the `else` (MA+1) |

**Gaps to fix for OLYMPUS, whose goal is a 1.0:**
- **No way to make `1.0.0-rc1`.** `rc --user-declared` always bumps the minor (`0.9.4 → 0.10.0-rc1`).
- **A major's candidate couldn't be validated.** If a `1.0.0-rc3` existed, `major --user-validated` would make `2.0.0`, because MA+1 runs even on a candidate. `minor --user-validated` would give the right `1.0.0`, but only by accident.
- **No restore if the commit fails** after the tests pass (a hook, an identity problem). VERSION and CHANGELOG stay stamped. Rare, but `git checkout VERSION CHANGELOG.md` is the manual fix.
- **`git add -A`** commits every untracked file not ignored: scratch output, research shots, a stray `.blend`. Keep `.gitignore` honest. That's the intent ("everything is committed"), but it's a trap.
- The script doesn't check the branch. It releases from whatever HEAD is.

Section 12.3 gives the corrected `case` block.

### 3.3 The CHANGELOG stamping algorithm

```
m = first match of /^## Unreleased[ \t]*\n(.*?)(?=^## |\Z)/  (re.S | re.M)
if no match, or m.group(1).strip() == "":  exit "CHANGELOG.md: write what this release changes under \"## Unreleased\" first."
replace m with:  "## Unreleased\n\n## v{ver} ({YYYY-MM-DD})\n\n{body.strip()}\n\n"
```

So the top of the file always reads `# Changelog`, a one-paragraph preamble, `## Unreleased` (empty right after a release), then `## vX.Y.Z (date)` newest first. The date is the machine's local `date +%Y-%m-%d`. The body ends at the next `## ` heading, so **an entry must not use `## ` headings inside it** (it uses bold lead-ins and nested bullets instead).

### 3.4 How it's used in practice

- Invocation: `tools/release.sh patch "<summary>" --trailer "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" --trailer "Claude-Session: https://claude.ai/code/session_…"`. Release commits in the log carry exactly those two trailers.
- `.claude/settings.local.json` pre-allows `Bash(tools/release.sh patch *)` (and `sed *`, `gh auth *`, `gh repo *`, `git branch *`, `git ls-remote *`). `rc`, `minor` and `major` are deliberately not pre-allowed.
- **Cadence:** 148 releases in 12 days: 15 on 10-25, 30 on 10-26, 25 on 10-27, 12 on 10-28, 16 on 10-29, 2 on 10-31, 21 on 11-03, 24 on 11-04, 3 on 11-05. A release is cheap: one per round of work.
- **The rc channel becomes the work channel.** Patch is refused on a candidate, so 0.1.0 went through **56 candidates** (0.1.0-rc1 on 2026-10-27 → rc56 on 2026-11-03), and they carried features, not only fixes (rc1 added bleeding out and first aid "your ask"). The user then validated: "promote the current version as 0.1.0, this is Alpha 1 worthy" (2026-11-03, quoted in the v0.1.0 entry). For 0.2, nine non-release commits titled `0.2: …` (from a scratch worktree branch `v0.2-missions`) came before `0.2.0-rc1`. Those were on the user's ask, under the "other commits only when asked" rule.

---

## 4. `tools/promote.sh`, in full

```bash
#!/usr/bin/env bash
# TRADECRAFT: move the play copy to a release.
#
#   tools/promote.sh             the latest release
#   tools/promote.sh v0.3.2      a given release (an older one too, to go back)
#   tools/promote.sh --status    where the play copy is, and what is newer
#
# The play copy (.play/) is a git worktree on a detached release tag. It is
# what ./play.sh serves and what the user plays, so it moves only on the
# user's go. A reload of the page after a promotion picks up the new release
# whole (the server sends no-store); saves stay, since the origin is the same.
set -eu
DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DIR"
PLAY="$DIR/.play"

latest() { git -c versionsort.suffix=-rc tag -l 'v*' --sort=-v:refname | head -1; }   # v0.1.0 after v0.1.0-rc3
current() { git -C "$PLAY" describe --tags --exact-match 2>/dev/null || git -C "$PLAY" rev-parse --short HEAD 2>/dev/null || echo none; }

if [ "${1:-}" = "--status" ]; then
  if [ -e "$PLAY/.git" ]; then echo "play copy: $(current)"; else echo "play copy: none"; fi
  echo "latest release: $(latest || true)"
  if [ -e "$PLAY/.git" ] && [ -n "$(latest)" ]; then
    newer=$(git log --oneline "$(git -C "$PLAY" rev-parse HEAD)..$(latest)" 2>/dev/null | grep -c . || true)
    echo "commits in the latest release not in the play copy: $newer"
  fi
  exit 0
fi

REF="${1:-$(latest)}"
if [ -z "$REF" ]; then echo "No release tags yet (tools/release.sh makes them)."; exit 1; fi
if ! git rev-parse -q --verify "$REF^{commit}" >/dev/null; then echo "No such release: $REF"; exit 1; fi

if [ -e "$PLAY/.git" ]; then
  if [ -n "$(git -C "$PLAY" status --porcelain)" ]; then
    echo "The play copy has local changes; it should never have any. Look before promoting:"
    git -C "$PLAY" status --short
    exit 1
  fi
  was=$(current)
  git -C "$PLAY" checkout -q --detach "$REF"
else
  was=none
  git worktree prune
  git worktree add -q --detach "$PLAY" "$REF"
fi
echo "play copy: $was -> $(current) ($(cat "$PLAY/VERSION" 2>/dev/null || echo '?')). Reload the game to pick it up."
```

### 4.1 Behaviour

- **`latest()`**: `git -c versionsort.suffix=-rc tag -l 'v*' --sort=-v:refname | head -1`. With `versionsort.suffix=-rc`, `v0.1.0` sorts **after** `v0.1.0-rc56`, so a validated release counts as the latest. Without it, git's version sort would put the `-rc` tags after the plain one.
- **`current()`**: the exact tag at `.play`'s HEAD, else its short sha, else `none`.
- **`--status`** prints three lines: `play copy: vX`, `latest release: vY`, `commits in the latest release not in the play copy: N` (from `git log --oneline PLAYHEAD..latest | grep -c .`). `release.sh` prints line 1 after every release.
- **Promotion** checks that the ref resolves to a commit (`rev-parse -q --verify "$REF^{commit}"`) and **refuses if `.play` has local changes** ("it should never have any. Look before promoting:", then `status --short`). If `.play/.git` exists: `git -C .play checkout -q --detach REF`. Otherwise: `git worktree prune`, then `git worktree add -q --detach .play REF`. It prints `play copy: <was> -> <now> (<VERSION>). Reload the game to pick it up.`
- **Rollback** is the same command with an older tag. Nothing is ever merged into `.play`, and there's no branch in it.
- The worktree shares the main repo's object store, so a tag made in the main tree is checkable in `.play` at once. `git worktree list` shows it as `(detached HEAD)`.

---

## 5. `tools/serve.py`, in full

```python
#!/usr/bin/env python3
# TRADECRAFT: a static file server for the game, on localhost only.
#
#   python3 tools/serve.py <port> [dir]
#
# No caching: the game is plain ES modules, and a browser that keeps some old
# modules and fetches some new ones after an update fails to load at all (an
# import of an export the cached file doesn't have). A deep listen queue: a
# load asks for dozens of modules at once, and with the standard library's
# queue of 5 the odd connection is reset (longhaul: about one load in thirty),
# a module never arrives and the game never starts. Bound to 127.0.0.1, not
# every interface: nothing on the network needs to see the working tree. File
# types are set here, not taken from the system (Windows' registry can call .js
# plain text). Runs the same on macOS and Windows (play.sh, play.cmd).
import sys
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler


class NoCache(SimpleHTTPRequestHandler):
    # Types by extension, not from the system: on Windows the registry can map .js to text/plain,
    # and a browser won't run a module served as text.
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, ".js": "text/javascript", ".mjs": "text/javascript",
                      ".json": "application/json", ".css": "text/css", ".html": "text/html", ".svg": "image/svg+xml",
                      ".png": "image/png", ".wasm": "application/wasm", ".txt": "text/plain"}

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *args):
        pass


class Server(ThreadingHTTPServer):
    request_queue_size = 128


port = int(sys.argv[1])
root = sys.argv[2] if len(sys.argv) > 2 else "."
Server(("127.0.0.1", port), partial(NoCache, directory=root)).serve_forever()
```

### 5.1 Why each line is there (lessons with sources)

- **`Cache-Control: no-store`.** The game is plain ES modules. A browser that keeps some old modules and fetches some new ones after an update fails to load at all ("does not provide an export named …"; longhaul CLAUDE.md line 8). With no-store, a reload after promotion picks up the whole release.
- **`request_queue_size = 128`.** A page load asks for dozens of modules at once (longhaul: about 80). With the standard library's listen queue of 5, the odd connection is reset: in longhaul "about one load in thirty", a module never arrives and the game never starts (ERR_CONNECTION_RESET).
- **`ThreadingHTTPServer`**: concurrent module fetches.
- **Bound to `127.0.0.1`**, not every interface ("nothing on the network needs to see the working tree"). Longhaul's inline server bound `""` (all interfaces).
- **The MIME map is set in code.** On Windows the registry can map `.js` to `text/plain`, and a browser won't run a module served as text. The fix landed in v0.0.29 (2026-10-26) along with `play.cmd`.
- **`log_message` silenced** (stdout goes to `/dev/null` anyway).
- Usage: `python3 tools/serve.py <port> [dir]`. `dir` defaults to `.`; `play.sh` passes `.play` or the repo root.

### 5.2 What OLYMPUS should add

- **MIME types the game will need**, before they bite on Windows: `.jpg`/`.jpeg` `image/jpeg`, `.webp` `image/webp`, `.woff2` `font/woff2`, `.ogg`/`.opus` `audio/ogg`, `.wav` `audio/wav`, `.mp3` `audio/mpeg`, `.bin` `application/octet-stream`, `.glb` `model/gltf-binary` (only if 3D is used), `.map` `application/json`.
- **Cross-origin isolation (a decision, not a default).** `Cross-Origin-Opener-Policy: same-origin` with `Cross-Origin-Embedder-Policy: require-corp` makes `crossOriginIsolated` true, which enables `SharedArrayBuffer` for worker threads (useful for "as much background generation as possible without rendering"). Distribution hosts don't all send these headers: itch.io has an opt-in SharedArrayBuffer checkbox, and GitHub Pages can't set headers at all. My recommendation is to build the workers on transferable `ArrayBuffer`s (postMessage with a transfer list), which need no isolation, and leave the headers off so dev matches distribution. Add them only by recorded decision.

---

## 6. `play.sh`, `play.cmd`, `tools/play.ps1`

**`play.sh`** (54 lines, macOS):
- `./play.sh` serves `.play/` on `PLAY_PORT=8100`. If `.play/.git` is missing, it first runs `tools/promote.sh` (the latest release). This has been the behaviour since v0.0.33 (2026-10-26); before that it stopped and told you to promote.
- `./play.sh --dev` serves the repo root on `DEV_PORT=8101`.
- It reads `$ROOT/VERSION` for the banner `TRADECRAFT v0.2.0-rc3 (play copy) on http://localhost:8100 (server pid N, Ctrl+C to stop)`.
- **The pidfile** `.run/serve-<port>.pid`: it kills **only its own** earlier server on that port ("another project's server (longhaul's on :8090, say) is none of our business"). If the port is still held by anything else, it prints `lsof -nP -iTCP:<port> -sTCP:LISTEN` and exits 1. Longhaul's `play.sh` did `lsof -ti:$PORT | xargs kill`, killing whatever held the port.
- It starts `python3 tools/serve.py PORT ROOT &>/dev/null &`, sleeps 0.5 s, runs `open http://localhost:PORT` (macOS `open`), traps INT/TERM to kill the server and remove the pidfile, then `wait`s.

**`play.cmd`** (8 lines, CRLF): `powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\play.ps1" %*`, then `if errorlevel 1 pause` (so a double-click shows the error).

**`tools/play.ps1`** (89 lines) is `play.sh` and `promote.sh` in one: `--dev`, `--status`, and `--promote [vX.Y.Z]` (promote, then play). Unlike the Mac script, it **fetches tags first** (`git fetch --tags --quiet`), because on Windows the user plays a clone and the releases arrive from GitHub. It makes the play copy on first play, and refuses a dirty play copy. It finds Python as `py -3`, `python` or `python3` (the first whose `--version` exits 0), and refuses a busy port with `Get-NetTCPConnection -LocalPort $Port -State Listen` (it can't tell its own server from another's). Paths are quoted into one `-ArgumentList` string ("a folder with a space in it would split"). It opens the default browser and stops the server in `finally`. CLAUDE.md: "Keep it in step with them."

**The user plays on Windows too.** The evidence is in tradecraft: "passers-by vanished in the middle of the street (the user, on Windows)" (PLAYTESTS 2026-10-26), and the 2026-10-29 lesson on a 64 MB atlas re-upload costing "close to a second on the user's Windows machine (ANGLE over D3D11)". So OLYMPUS needs `play.cmd` from day one, and performance has to be judged on ANGLE/D3D11, not only on the Mac's Metal.

### 6.1 Longhaul vs tradecraft (what tradecraft fixed)

| Aspect | longhaul | tradecraft |
|---|---|---|
| Version source | `js/version.js` literal, scraped by `sed` | `VERSION` file, `fetch('VERSION')` in the game |
| Release | by hand: commit `vX.Y.Z: <whole paragraph>` on branch `overhaul` (subjects run to hundreds of words), push; a single tag (`v1.0.0`); no CHANGELOG | `tools/release.sh`: CHANGELOG stamping, test gate, annotated tag, short subject |
| What the user plays | the working copy (so changes went through a scratch copy, applied "on go") | `.play/` worktree pinned to a tag |
| Ports | one, `:8090` (`./play.sh [port]`) | `:8100` play, `:8101` dev, `:8112` gallery, `:8123` browser tests |
| Server | inline Python in `play.sh`, all interfaces, kills whatever holds the port | `tools/serve.py`: 127.0.0.1, MIME map, pidfile, only its own |
| Test runner | `{ name, fn }`, filter, `SKIP` (`SKIP=200k` drops the timed 200k-ship scale test) | adds `heavy: true` + `QUICK=1`, counts "left out" |
| helpers.mjs | `assert`, `near`, `fmt` + a domain helper (`dockHere`) | `assert`, `near`, `fmt` only; domain drivers live in their own modules (`bots.mjs`, `rangebot.mjs`, `shopwalk.mjs`) |
| Windows | none | `play.cmd` + `tools/play.ps1` |
| Keep-awake | an hour-long `caffeinate` renewed by hand ("the chain lapsed") | lease renewed by hooks |
| Saves | other `SAVE_SCHEMA` refused, no migrations | same; plus "before 1.0, old saves are kept only where it comes naturally" (the user, 2026-10-26) |

---

## 7. The test harness

### 7.1 `tests/run.mjs`, in full (35 lines)

```js
// TRADECRAFT test runner: `npm test` or `node tests/run.mjs [filter]`.
// Each *.test.mjs default-exports an array of { name, fn, heavy? } (fn may be async).
// QUICK=1 (`npm run test:quick`) leaves out the heavy ones (timed, long, machine-loading):
// use it whenever the user may be playing, since their game shares the machine.
// SKIP=a,b leaves out the tests whose names hold any of those.
import { readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const filter = process.argv[2] || '';
const quick = !!process.env.QUICK;
const skip = (process.env.SKIP || '').split(',').map(x => x.trim()).filter(Boolean);
const files = readdirSync(dir).filter(f => f.endsWith('.test.mjs')).sort();

let pass = 0, fail = 0, left = 0;
for (const file of files) {
  const tests = (await import(pathToFileURL(path.join(dir, file)).href)).default;
  for (const t of tests) {
    const full = `${file.replace('.test.mjs', '')} › ${t.name}`;
    if (filter && !full.includes(filter)) continue;
    if ((quick && t.heavy) || skip.some(k => full.includes(k))) { left++; continue; }
    const t0 = performance.now();
    try {
      await t.fn();
      pass++;
      console.log(`  ✓ ${full} (${(performance.now() - t0).toFixed(0)} ms)`);
    } catch (e) {
      fail++;
      console.log(`  ✗ ${full}\n      ${(e.stack || e.message).split('\n').slice(0, 4).join('\n      ')}`);
    }
  }
}
console.log(`\n${pass} passed, ${fail} failed${left ? `, ${left} left out` : ''}`);
process.exitCode = fail ? 1 : 0;
```

### 7.2 The API

- **Discovery:** every `tests/*.test.mjs`, sorted by file name, run in file order and then declaration order, **serially, in one Node process**. Any other `.mjs` in `tests/` is a helper module (`helpers.mjs`, `bots.mjs`, `rangebot.mjs`, `shopwalk.mjs`) and isn't run.
- **Declaration:** each test file `export default [ { name, fn, heavy? }, … ]`. `fn` may be async. A test passes if `fn` returns or resolves, and fails if it throws or rejects. No `describe`, no hooks, no fixtures. Shared setup is a plain function in the file (`life(seed)`, `withGame(fn)`).
- **Full name** is `"<file without .test.mjs> › <name>"`, e.g. `needs › needs: hungry after six hours …`.
- **Filter:** `node tests/run.mjs <substring>` runs only tests whose full name contains it (`node tests/run.mjs tail`, `node tests/run.mjs "browser › the campaign"`). Filtered tests aren't counted at all.
- **`QUICK=1`** (`npm run test:quick`) leaves out `heavy: true`. **`SKIP=a,b`** leaves out names containing any of those substrings. Both count as "left out".
- **Output:** `  ✓ <full> (<ms> ms)`, or `  ✗ <full>` followed by the first 4 lines of the stack, indented 6. Then `N passed, M failed[, K left out]`. `process.exitCode = 1` on any failure, and that's what `release.sh` gates on.
- **Per-test knobs through env**, read inside tests: `TAIL_N` (evenings per cell, default 24), `SDR_N` (default 30), `PRINT_HASH=1` (print golden hashes to re-set them on purpose).
- **Scale:** 76 test files, about 435 tests, 25 heavy across 16 files (8 of them in `browser.test.mjs`).
- **What it lacks** (tolerable, but know it): no per-test timeout (a hung async test hangs the release), no isolation between tests in the same process (module-level state carries over), no parallelism, and every test file is imported even when the filter excludes all its tests (top-level work in a test module always runs). There's also no total-time line.

### 7.3 `tests/helpers.mjs`, in full (13 lines)

```js
// TRADECRAFT test helpers. Tests print the numbers that matter (balance, timings) with fmt, so a
// run is read, not just counted.
export function assert(cond, msg = 'assertion failed') {
  if (!cond) throw new Error(msg);
}

export function near(actual, expected, tol, msg = '') {
  if (!(Math.abs(actual - expected) <= tol)) {
    throw new Error(`${msg} expected ${expected} ± ${tol}, got ${actual}`);
  }
}

export const fmt = (n, d = 1) => Number(n).toFixed(d);
```

`near` is written as `!(… <= tol)`, so it also fails on NaN. Longhaul's is the same plus a domain helper (`dockHere(s, stationId, advance, maxMin)`) that flies a docking from the gate.

### 7.4 Conventions inside tests

- **Names are sentences describing the behaviour**, often with the user's attribution and date in the name itself: `'needs: past starving: weak at two days (no running, −3), faint spells from three …; three weeks, dead (the user, 2026-11-04)'`.
- **Every test prints its numbers** with `console.log('      …')` (6 spaces, so they nest under the ✓ line): balance outcomes, timings, counts, e.g. the browser test's `walked ${fmt(moved, 2)} m east in ${fmt(secs, 1)} s of holding D`, `median frame ${fmt(fps, 1)} ms`, `autosave: "${about}", ${fmt(kb)} KB`. That's "read them; don't just count passes".
- **Assertions carry the evidence:** `assert(cond, JSON.stringify({ weak, fainted, fed }))`.
- **The sim is tested headless and directly:** `newGame({ seed })`, `start(g, bus)`, `step(g, input, bus)` n times, `skip(g, bus, ms)`. A stub bus is `{ emit() {}, on() {} }`, or `null`. State is poked directly (`p.needs.ate = g.time.ms - …`).
- **Golden hashes** pin procedural generation (`cities.test.mjs`): a hash of generated sections and a planned route per seed, compared against stored values. When generation changes on purpose, run with `PRINT_HASH=1`, paste the new values, and say so in the CHANGELOG ("The cities' golden hash re-set on purpose (… a door dump showed nothing else moved)", v0.1.30). This pattern is essential for OLYMPUS's procedural worlds and NPC rosters.
- **Statistical tests use N trials and print rates** (e.g. "lost 0 times in 21 (was 8), burned 15 (was 8)"). Thresholds are set loosely enough for chance. CHANGELOG entries admit when a test "failed it by chance" and widen N (rc2: "over 240 evenings, not 80").
- **A test that pins a bug fails without the fix.** Longhaul's commit notes say so explicitly ("it fails without the fix"), and tradecraft keeps the practice.

### 7.5 `tests/syntax.test.mjs` and `tests/version.test.mjs`

- **syntax:** walks `src/` for every `.js` and runs `node --check` on each, collecting `relative path: first line containing "Error"`. Then `assert(!bad.length, …)` and it prints `N modules parse`. Why: "the screens and the drawing aren't loaded by the other quick tests, so a slip there (a comment that swallowed the rest of a line, 0.1.3) would only show in a browser." It's quick, not heavy, so it runs on every release.
- **version** (the release tooling's one invariant): `VERSION` matches `/^\d+\.\d+\.\d+(-rc\d+)?\n?$/`, and `CHANGELOG.md` matches `/^## Unreleased$/m`.

### 7.6 Browser tests: how they drive Chrome (`tests/browser.test.mjs`)

```js
const PORT = 8123;
async function withGame(fn) {
  const server = spawn('python3', [path.join(root, 'tools/serve.py'), String(PORT), root], { stdio: 'ignore' });
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
  try {
    for (let i = 0; i < 50; i++) { try { await fetch(`http://localhost:${PORT}/VERSION`); break; } catch { await new Promise(r => setTimeout(r, 100)); } }
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
    page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
    page.on('response', r => { if (r.status() >= 400) errors.push(`http ${r.status()}: ${r.url()}`); });
    await fn(page, errors);
  } finally { await browser.close(); server.kill(); }
}
```

- **`playwright-core`** (devDependency 1.64.0: the library with no bundled browsers) drives the **system Chrome**, headless, with **`--use-angle=metal --enable-gpu --ignore-gpu-blocklist`**, so WebGL renders on the GPU as it does for the player (PIPELINE lesson 2026-10-25).
- **Its own port (8123), so its own origin and saves.** Each test starts and kills its own server and browser (slow, fully isolated). Readiness is polled on `/VERSION`, 50 × 100 ms.
- **Errors fail the test:** page errors, console errors and HTTP ≥ 400. Every test ends with `assert(errors.length === 0, errors.join('\n'))`.
- **Skipping the title by URL:** `/?play=walk&seed=4&city=london&hour=12&weather=clear`, `?play=sdr&seed=4`, `?play=dojo&chapter=lesson&seed=2`, `?lesson=…`, `&autoplay[=m]` (the game's own AI plays). Or click through from `/` with locators (`#title .campaign`, `.cand`, `button:hasText(...)`).
- **The game's contract with tests** (`src/main.js`): `window.__ready = true` after the **third** drawn frame. `window.__tradecraft = { state (getter), view, step(n, input), start(state|JSON), newGame(opts), save() → JSON, pause(on), skip(ms), autosave }`.
- **Driving:** `page.keyboard.press('KeyI')` / `down('KeyD')` + `waitForTimeout(1500)` + `up('KeyD')`, by **physical key codes** (the game reads `KeyboardEvent.code`, so it works on AZERTY, the user's layout; README: "Z Q S D (W A S D on QWERTY)"). `page.waitForSelector('.mind.pockets')`, `page.locator(...).click()`. State is set up through `page.evaluate(() => { const T = window.__tradecraft; …; T.step(2); })`. Inside `evaluate`, sim modules are imported dynamically: `await import('/src/sim/transit.js')` (the dev server serves the whole repo, `tests/` included, so the page can `import('/tests/bots.mjs')` too).
- **Debug mode before load:** `page.addInitScript(() => localStorage.setItem('tradecraft.debug', '1'))`.
- **The determinism check** (port this as-is):
  ```js
  h.pause(true); const json = h.save(); h.step(400, { mx: -1 }); const a = h.save();
  h.start(json); h.pause(true); h.step(400, { mx: -1 }); assert(a === h.save(), 'an imported save carried on differently');
  ```
  So save → load → same inputs → byte-identical state, in the real browser build.
- **Autosave lands in IndexedDB:** `import('./src/ui/store.js').then(m => m.getSave('auto'))`, size printed in KB.
- **Frame time:** the median of 119 rAF deltas, printed (`median frame N ms`).
- **The smoke-test recipe** for ad-hoc checks (CLAUDE.md): serve on a port of your own (`./play.sh --dev`, or `python3 tools/serve.py <port> <dir>`), drive with playwright-core and the system Chrome, collect `pageerror` and console errors, and kill the server after.

### 7.7 Bots: scripted players shared by tests and playtests

- `tests/bots.mjs`: followers (`naive`, `careful`, `trained`) and walkers (`oblivious`, `checker`, `pro`). Each is `(g, me, target) → input` for one tick (`{ mx, mz, look, slow, act: ['instinct'] }`). Steering helpers are `toward()` (with stuck detection and sidestep) and `route()`/`goTo()` (through gaps and lanes).
- **A bot's memory is plain data on its actor** (`me.bot ??= {}`), so it saves and loads with the game, and a run plays on the same across a load.
- `tests/rangebot.mjs` `shootRange(g, bus, opts)`: a scripted shooter that does "the gun's whole work through the engine's own steps (`sim/shooting.js options(), choose()`), as a careful player does it: checked clear, the magazines filled, one in, the slide racked, the safety off on the paper; five at each distance … a reload after the first, a stoppage cleared as it comes … then unloaded, holstered, back at the desk". It has options for deliberate faults (`turn`: sweep the muzzle; `stray`: fire at another lane; `skip: ['check']`) to test the range-safety officer. This is the closest existing template for OLYMPUS's weapon-discipline tests.
- `tests/shopwalk.mjs`: "tests' feet in a shop", walking the player to and around an interior as a player would.
- `docs/PLAYTESTS.md`: "Claude plays as the player while the user's away (scripted followers driving the real game in headless Chrome, and the sim at speed for the numbers)". It's a dated log: **Played / Found and fixed / Open**.

---

## 8. Seeing the game: `shot.mjs`, `gallery.mjs`, samples

- **`tools/shot.mjs <url> <out.png> [--size 1600x1000] [--ready <js expr>] [--timeout 30000]`**: same launch flags as the tests. It waits for `window.__ready === true` by default, and screenshots. It prints `window.__renderer` (the GL renderer string) and `window.__report` (numbers a page publishes about itself). It **fails** (exit 1) on page errors, console errors (except "Failed to load resource") or HTTP ≥ 400 (favicon excepted): "so a broken page never passes as a picture."
- **`tools/gallery.mjs [filter]`**: serves the repo on **:8112** and walks `samples/NNN-name/sample.json` (`{ title, about, pixel?, views: [{ name, query }] }`). It shoots each view through `shot.mjs` (90 s timeout), writes `samples/<id>/shots/<view>.jpg` (800 px wide, quality 82), `samples/index.json` and `samples/contact.jpg` (`magick montage`, 4 across, 400×250 tiles, labelled, background `#15171c`). It deletes shots of views that no longer exist, and exits 1 if any view failed.
  - **Pixel-art mode** (directly relevant to OLYMPUS): a `sample.json` with `"pixel": "640x360"` is shot at **3× native**, brought back to native with `magick -filter point -resize WxH!`, then up to **2× native** with point sampling, kept as **PNG**: "every pixel a crisp 2 × 2". JPEG and smooth resizing spoil pixel art.
- **`samples/index.html`** (99 lines) is the gallery page, opened at `./play.sh --dev` → `/samples/`. Each picture opens its view live. **★ marks a pick** (stored in localStorage `tradecraft.picks`), and **"Copy my picks"** puts `My picks:\n- <id> · <view>…` on the clipboard for the user to paste back into the conversation. This is how the user chose the look ("I like the smaller figures", 2026-10-26).
- **`tools/vendor-three.mjs`** copies `node_modules/three` (pinned 0.186.1) into `vendor/three/`: the core `build/three.module.js` + `three.core.js` + `LICENSE`, plus only the add-ons in `ADDONS` and their transitive relative imports (regex on `from`/`import(`), then writes `vendor/three/VERSION`. The import map is `"three": "./vendor/three/build/three.module.js"`, `"three/addons/": "./vendor/three/examples/jsm/"`. Tradecraft's 2D-looking pixel art is in fact three.js (a 45° orthographic camera, painted textures, palette snap; `src/art`, `src/render`). The game loads **no glTF and no MPFB people**: "The pixel look needs no Blender or MPFB: sprites and textures are drawn by code" (DESIGN.md, Stack).

---

## 9. The asset toolchain (`setup.sh`, `gen.sh`, PIPELINE rules)

**`tools/setup.sh`** (rerunnable, each step skips what's done):
1. Homebrew: `blender` (cask), `ffmpeg`, `imagemagick`; prints `blender --version`.
2. `npm install --no-fund --no-audit --silent`; re-vendors three if `vendor/three/VERSION` ≠ the installed version.
3. MPFB: `BV` = Blender major.minor. If `~/Library/Application Support/Blender/$BV/extensions/blender_org/mpfb` is missing: `blender --online-mode -c extension install -s mpfb --enable`.
4. MakeHuman packs: `fetch()` each `<pack>/<zip>` from `tools/blender/mpfb-packs.txt` (`https://files2.makehumancommunity.org/asset_packs/<pack>.zip`, falling back to `files.`). Complete files are skipped by comparing `Content-Length` with `stat -f %z`, partial downloads resume with `curl -C -`, 4 in parallel (`xargs -P 4`: "about 1 MB/s per connection; four in parallel get about 4 MB/s"), into `${TRADECRAFT_CACHE:-~/Library/Caches/tradecraft}/makehuman`. Then `blender -b --python tools/blender/mpfb_packs.py -- <zips>` installs through `bpy.ops.mpfb.load_pack` via `bl_ext.blender_org.mpfb.services.assetservice.AssetService` (Blender 4.2+ names extensions `bl_ext.<repo>.<id>`), skipping installed packs. The pack list is "Chosen for a contemporary setting: no weapons, armour, fantasy or creatures" (23 CC0 + 11 CC-BY = 34).
5. mflux: `brew install uv`; `uv tool install --force --python 3.13 mflux==0.22.0 --with pillow==12.3.0`. The pin exists because "Pillow 13.0 imports a lazy-loading feature these Pythons lack (mflux fails at start)" (2026-10-25).

**`tools/gen.sh <model> --out <file.png> --prompt "…" [--seed N] [--width W --height H] [--steps N] [--q 8|4|none] [-- <mflux args>]`**:
- Models → commands and licence class: `z-image-turbo` → `mflux-generate-z-image-turbo` (Apache-2.0: ships); `flux2-klein-4b` → `mflux-generate-flux2` (Apache-2.0: ships); `flux2-klein-9b` → `mflux-generate-flux2` (FLUX Non-Commercial v2.1, hobby use: ships); `krea-2` → `mflux-generate-krea2` (Krea 2 Community: ships); `ideogram-4-fp8` → `mflux-generate-ideogram4` (Ideogram Non-Commercial, hobby use: ships; forced `Q=none`); `qwen-image-2.1` → `mflux-generate-qwen-2.1` (Qwen Research: **samples only, never ships**). Anything else is refused.
- **It runs from a saved, pre-quantised copy.** On first use it calls `mflux-save --model M --quantize Q --path ~/Library/Caches/tradecraft/models/<model>-q<Q>`, then generates with `--model <saved> --base-model <model>`. The reason: `-q 8` at load time loads full precision first. "Z-Image-Turbo peaked at 25 GB that way, on a 24 GB Mac, and swapped. From the saved 8-bit copy: 7.5 GB, 32 s an image" (1216×832, 9 steps).
- With no seed given, it picks a random one and passes it explicitly, so the seed is always recorded.
- **Provenance sidecar** `<file>.gen.json`: `{ model, licence, prompt, seed, quantize, command: [cmd, ...args], mflux, seconds, date }`.
- PIPELINE rules that never bend: **scripts, not hands** (Blender headless: `blender -b --python tools/blender/<script>.py -- <args>`); **licences** (ship only CC0, CC-BY credited in `CREDITS.md` in the same change, or allowed models); **provenance** (every shipped asset has a sidecar: `.credits.json` for people, `.gen.json` for images, `.source.json` for library assets); **secrets** (the HF token lives in `~/.cache/huggingface/token`, never in the repo, never printed; `*.private` gitignored). Tool choice order: real before generated, a script never a hand edit, the least restrictive licence, local before hosted ("Hosted inference through Hugging Face is metered ($0.10 a month free, 2026-10-25)"), and provenance always. Z-Image-Turbo "garbles text": anything with words goes to Ideogram 4.
- **The licence posture rests on a user statement about tradecraft:** "The game is free and won't be sold (the user, 2026-10-25), which is what lets the non-commercial models in." **Ideogram's licence also has "no real military or surveillance use"**; tradecraft read that as "art for a spy fiction isn't that". OLYMPUS is military fiction, so both points need the user's word before those models ship anything (Open questions).

---

## 10. Keeping the Mac awake (`tools/awake.sh`, `bright.swift`, hooks)

- `tools/awake.sh renew | run <cmd…> | status | off | on`. State lives in `.run/awake/` (`lease`, `keeper.pid`, `off`, `log`, `bright`, `lease_min`).
- **A lease, not a timer:** the hooks touch `lease` on every prompt and every tool call. One keeper process (pidfile with noclobber; a stale one is taken over) runs `caffeinate -dims -w $$` and loops every `PULSE_S=40` s while the lease is younger than `LEASE_MIN=60` min, then exits and lets the Mac sleep. "In longhaul an hour-long caffeinate was renewed by hand, and the chain lapsed."
- **On battery it also pulses `caffeinate -u -t 5`** (declare user activity). Longhaul's Mac went to "Idle Sleep" while `caffeinate -dims` held its assertions (pmset log, 2026-10-25 09:33).
- **The screen stays lit:** "the user, 2026-10-26: stop killing the brightness". Dimming is opt-in (`AWAKE_DIM=1`): after the system's display-sleep time with no HID input it turns the backlight off via `tools/bright.swift` (compiled on first use with `swiftc -O`), and restores it within 30 s of input. It doesn't dim if another process holds `PreventUserIdleDisplaySleep` (a video), or if the screen is already dark.
- "A closed lid on battery still sleeps: say so if the user is about to leave the Mac on battery."
- "Kill caffeinate" means `tools/awake.sh off`, which stays off until `on`. Check `status` before saying anything about it.
- The whole script ends `main "$@"; exit $?` on one line, so bash has read it whole before it runs: "a keeper running for hours would otherwise trip over an edit to this file (a release, a pull)".
- **Hooks** (`.claude/settings.json`): `UserPromptSubmit` and `PreToolUse` → `"$CLAUDE_PROJECT_DIR"/tools/awake.sh renew 2>/dev/null || true` (timeout 10). Permissions allow `Bash(tools/awake.sh *)`, `Bash(npm test *)`, `Bash(npm run test:quick *)`, `Bash(node tests/run.mjs *)`. "Hooks load when a session starts: a new or changed hook needs a restart, or a look at `/hooks`."

---

## 11. Repository hygiene and the CHANGELOG style

**`.gitignore`** (tradecraft): `.DS_Store`, `node_modules/`, `*.log`, `.play/`, `.run/`, `ref/` (commercial art references, never committed), `*.private`, `__pycache__/`, `.claude/worktrees/` (agents' isolated worktrees). OLYMPUS's lacks `*.log`, `__pycache__/` and `.claude/worktrees/`.

**`.gitattributes`**: `*.cmd text eol=crlf` and `*.ps1 text eol=crlf` ("Windows scripts keep Windows line endings, whatever the checkout").

**`package.json`**: `"private": true, "type": "module"`, scripts `start` (`./play.sh`), `dev` (`./play.sh --dev`), `test` (`node tests/run.mjs`), `test:quick` (`QUICK=1 node tests/run.mjs`), `setup` (`tools/setup.sh`). devDependencies are pinned exactly: `three 0.186.1`, `playwright-core 1.64.0`, `@gltf-transform/cli 4.5.1`. `release.sh` gates on the presence of `"test"`.

**`README.md`** opens with the pitch, then **Play** (`./play.sh`, `--dev`, Windows `play.cmd …`, `promote.sh`), **Develop** (`setup.sh`, `npm test`, `release.sh`, `awake.sh status`, `gallery.mjs`), the in-game keys, Code layout, Samples, and Documentation links.

**CHANGELOG style** (from lines 1–250 and the oldest entries):
- Preamble: "One entry per release, newest first: what changed for the player, and the numbers that moved. Write it under Unreleased as the work happens; `tools/release.sh` stamps it with the version and the date."
- **Player-facing.** Each bullet opens with a **bold lead sentence that states the change as a fact about the game**: "**Clinics.**", "**The wounded do what their wounds make them do.**", "**No more streaks.**", "**Officers carry and use ammunition.**". Then plain prose with the mechanism and **the numbers, before → after, measured**: "Walking straight there: lost 0 times in 21 (was 8), burned 15 (was 8)"; "A dressing is 72 s at Medicine 0, 45 s at 10 and 26 s at 30"; "Z-Image-Turbo: 7.5 GB and 32 s an image, down from a 25 GB peak".
- **The user's requests and reports are attributed:** "(your ask: a blood-pressure health stat)", "(your report from Windows)", "Your save showed one dazed officer running off up a lane", and validation quotes with dates.
- Nested bullets for lists of parts or options. No `## ` inside an entry (it would cut the entry: section 3.3).
- **A final `Tests:` bullet** names the suites touched and anything re-set on purpose: "Tests: armed (…); services (…). The cities' golden hash re-set on purpose (…)". Tests fixed because they failed by chance say so.
- `Fixed:` bullets for plain bug fixes.
- The earliest entries (v0.0.1–v0.0.15) are tooling and look work, with paths in backticks: "`tools/gen.sh`: image generation through a saved 8-bit copy …"; "Project boilerplate: the method carried over from longhaul (CLAUDE.md), the pinned play copy (`play.sh`, `tools/promote.sh`), releases (`tools/release.sh`), the keep-awake lease (`tools/awake.sh` and its hooks), the test runner." That was **v0.0.1, the template for OLYMPUS's first release.**
- Commit subjects stay short (`v0.2.0-rc3: An arrested asset's meetings go with him`). All the detail lives in the CHANGELOG, unlike longhaul's paragraph-long subjects.

---

## 12. Recommended OLYMPUS tooling skeleton

### 12.1 Names, ports and keys

| Thing | tradecraft | OLYMPUS |
|---|---|---|
| Header prefix | `TRADECRAFT:` | `OLYMPUS:` |
| Play copy port | 8100 | **8200** |
| Dev port | 8101 | **8201** |
| Gallery port | 8112 | **8212** |
| Browser tests port | 8123 | **8223** |
| Ad-hoc smoke / parallel agents | own choice | **8230–8239** (one per agent or worktree) |
| Never use | | 8090 (longhaul), 8100/8101 (tradecraft), and tradecraft's 8112/8123 |
| Debug handle | `window.__tradecraft` | `window.__olympus` (same shape: `state, view, step(n, input), start(state|JSON), newGame(opts), save(), pause(on), skip(ms), autosave`) |
| Ready flag | `window.__ready` after 3 frames | the same (shot.mjs and tests key on it) |
| Report hook | `window.__report`, `window.__renderer` | the same |
| localStorage | `tradecraft.debug`, `tradecraft.picks`, `tradecraft.farm` | `olympus.debug`, `olympus.picks`, … |
| IndexedDB / save names | tradecraft's `store.js` | `olympus` |
| Cache dir env | `TRADECRAFT_CACHE` → `~/Library/Caches/tradecraft` | `OLYMPUS_CACHE` → `~/Library/Caches/olympus` |
| Process grep in awake.sh | `awake.sh _keeper` | unchanged (the path is per project; `.run/awake` is per repo) |

I checked that 82xx is free: on this Mac only 5000/7000 (ControlCenter) and 49202 (rapportd) are listening. The sibling projects (Konoha, Merlin, oneparty, vigil, witches) use 3000, 3128, 5000/5001, 5173, 8080 and 9001–9010. None use 82xx.

### 12.2 Files, one by one

| OLYMPUS file | From | Verdict | What changes |
|---|---|---|---|
| `VERSION` | tradecraft | reuse | starts at `0.0.0`; the first `release.sh patch` makes `0.0.1` |
| `CHANGELOG.md` | tradecraft | adapt | same preamble, `## Unreleased` with the boilerplate entry |
| `tools/release.sh` | tradecraft | **adapt** | `OLYMPUS:` header; the major-candidate fix (12.3); optional `trap restore ERR` around the commit; usage range `4,8p` if a header line is added |
| `tools/promote.sh` | tradecraft | reuse | header name only |
| `tools/serve.py` | tradecraft | adapt | header name; more MIME types (5.2); COOP/COEP only by decision |
| `play.sh` | tradecraft | adapt | `PLAY_PORT=8200`, `DEV_PORT=8201`; banner `OLYMPUS v…`; comment naming longhaul :8090 and tradecraft :8100/:8101 as "none of our business" |
| `play.cmd` | tradecraft | adapt | name in `rem` lines; ports in the usage lines; CRLF |
| `tools/play.ps1` | tradecraft | adapt | ports 8200/8201, name; CRLF |
| `tests/run.mjs` | tradecraft | reuse (+) | header name; optionally a total-time line and `TIMEOUT_MS` per test (`Promise.race`), keeping `{ name, fn, heavy }` |
| `tests/helpers.mjs` | tradecraft | reuse | name; add domain helpers as their own modules, as tradecraft does |
| `tests/syntax.test.mjs` | tradecraft | reuse | walk `src/` (and `tools/*.mjs` if wanted) |
| `tests/version.test.mjs` | tradecraft | reuse | unchanged |
| `tests/browser.mjs` (new) + `tests/browser.test.mjs` | tradecraft | adapt | move `withGame()` into a shared helper so several browser test files can use it; `PORT = 8223`; `CHROME` env override for the executable path; `__olympus`; the determinism and autosave tests on day one |
| `tests/bots.mjs` | tradecraft | reference | the pattern (pure `(g, me) → input`, memory as plain data on the actor, importable from the page); OLYMPUS bots: a recruit's day bot (follows the schedule: reveille, PT, mess, drill, shower, rack), a range bot (safe weapon handling end to end, plus fault options for the safety tests), a boarding-stack bot |
| `tools/shot.mjs` | tradecraft | reuse | header; `CHROME` env override. Keep the ANGLE Metal flags |
| `tools/gallery.mjs` + `samples/index.html` | tradecraft | adapt | port 8212; `olympus.picks`; title. Pixel mode is exactly what high-res pixel art needs |
| `tools/awake.sh`, `tools/bright.swift` | already copied | adapt | change the `TRADECRAFT:` header lines (awake.sh line 2, bright.swift line 1); add `.claude/settings.json` hooks |
| `.claude/settings.json` | tradecraft | reuse | the same two hooks and four allows (the user's consent needed, as with any config) |
| `tools/setup.sh` | tradecraft | adapt | keep ffmpeg, ImageMagick, uv+mflux, `npm install`; make Blender/MPFB optional (`--3d`); `OLYMPUS_CACHE` |
| `tools/gen.sh` | tradecraft | adapt | `OLYMPUS_CACHE`; look first in `~/Library/Caches/olympus/models`, then read tradecraft's saved `z-image-turbo-q8` (10 GB) rather than duplicate it; licence column re-read for a military setting |
| `tools/vendor-three.mjs` | tradecraft | reference / skip | only if OLYMPUS picks three.js; a top-down 2D pixel renderer can be Canvas2D or hand-written WebGL2 (longhaul's way) with nothing to vendor |
| `tools/fetch-asset.mjs`, `fetch-cmu.sh`, `tools/blender/*` | tradecraft | skip (reference) | photographic PBR textures, mocap and MPFB 3D people don't feed a hand-pixelled top-down game. At most, MPFB renders as pose or proportion references |
| `.gitignore` | Olympus + tradecraft | adapt | add `*.log`, `__pycache__/`, `.claude/worktrees/` (keep `ref/`, `*.private`) |
| `.gitattributes` | tradecraft | reuse | as is |
| `package.json` | tradecraft | adapt | `"name": "olympus"`; devDependencies `playwright-core 1.64.0` (plus three only if chosen) |
| `CLAUDE.md` | tradecraft | adapt | the same sections (Commands, Toolchain and assets, Versions and releases, The play copy, Scratch copies, Keeping the Mac awake, Docs, Rules of the code, Working with the user); ports 8200/8201; `lsof -nP -iTCP:8200 -sTCP:LISTEN` for "is the user playing" |
| `docs/PIPELINE.md`, `docs/PLAYTESTS.md`, `CREDITS.md` | tradecraft | adapt | same structure, empty logs |

### 12.3 The `release.sh` change for a 1.0 (replace lines 37–70)

```bash
TRAILERS=(); VALIDATED=0; DECLARED=0; TEST=1; MAJOR=0
while [ $# -gt 0 ]; do
  case "$1" in
    --trailer) TRAILERS+=(--trailer "$2"); shift 2 ;;
    --user-validated) VALIDATED=1; shift ;;
    --user-declared) DECLARED=1; shift ;;
    --major) MAJOR=1; shift ;;                       # (with rc --user-declared: a candidate for the next major)
    --no-test) TEST=0; shift ;;
    *) echo "unknown option: $1"; usage ;;
  esac
done
# ... (OLD, BASE, RC, MA MI PA as before)
case "$PART" in
  patch)
    if [ -n "$RC" ]; then echo "On release candidate $OLD: a fix is the next candidate (rc), or the user validates it."; exit 1; fi
    PA=$((PA + 1)) ;;
  rc)
    if [ -n "$RC" ]; then SUFFIX="-rc$((RC + 1))"
    elif [ $DECLARED = 1 ] && [ $MAJOR = 1 ]; then MA=$((MA + 1)); MI=0; PA=0; SUFFIX="-rc1"   # 0.9.4 -> 1.0.0-rc1
    elif [ $DECLARED = 1 ]; then MI=$((MI + 1)); PA=0; SUFFIX="-rc1"                           # 0.0.14 -> 0.1.0-rc1
    else echo "A first release candidate is the user's call: --user-declared says they declared it."; exit 1; fi ;;
  minor|major)
    if [ $VALIDATED = 0 ]; then echo "A $PART bump needs the user's validated release candidate (--user-validated). Patch releases need nothing."; exit 1; fi
    if [ -n "$RC" ]; then                                              # the candidate becomes its version
      kind=minor; [ "$MI" = 0 ] && kind=major                          # (X.0.0-rcN is a major's candidate)
      [ "$PART" = "$kind" ] || { echo "$OLD is a $kind's candidate: $kind --user-validated."; exit 1; }
    elif [ "$PART" = minor ]; then MI=$((MI + 1)); PA=0
    else MA=$((MA + 1)); MI=0; PA=0; fi ;;
  *) usage ;;
esac
```
Header usage lines become `rc "<summary>" [--user-declared [--major]]` (still lines 4–7 if kept to four lines). A minor's candidate always has MI ≥ 1, so `MI = 0` identifies a major's. Also optional, after the backup at line 80: `trap 'restore; echo "release stopped; VERSION and CHANGELOG.md put back"' ERR` and `trap - ERR` after `git tag`. With `set -e` this covers a failed commit.

Checked on 2026-11-05 by running the block alone in a scratch harness: 0.0.14 patch → 0.0.15; rc → refused; rc --user-declared → 0.1.0-rc1; 0.1.0-rc1 rc → rc2; patch → refused; 0.1.0-rc56 minor --user-validated → 0.1.0; major --user-validated → refused (a minor's candidate); 0.1.7 minor --user-validated → 0.2.0; 0.9.4 rc --user-declared --major → 1.0.0-rc1; 1.0.0-rc1 rc → rc2; 1.0.0-rc3 major --user-validated → 1.0.0; minor --user-validated → refused (a major's candidate); 0.9.4 major --user-validated → 1.0.0; 0.9.4 minor (no flag) → refused; 1.2.3 rc --user-declared → 1.3.0-rc1.

### 12.4 The bootstrapping sequence (what the first builder does)

1. Write `VERSION` (`0.0.0`), `CHANGELOG.md` (preamble, `## Unreleased`, one bullet: "Project boilerplate: the method carried over from tradecraft (CLAUDE.md), the pinned play copy (`play.sh`, `play.cmd`, `tools/promote.sh`) on :8200, the working tree on :8201, releases (`tools/release.sh`), the keep-awake lease (`tools/awake.sh` and its hooks), the test runner."), `package.json`, `.gitattributes`, the updated `.gitignore`, `tools/{release.sh,promote.sh,serve.py,play.ps1,shot.mjs}`, `play.sh`, `play.cmd`, `tests/{run.mjs,helpers.mjs,version.test.mjs,syntax.test.mjs}`, `CLAUDE.md`, `.claude/settings.json`. `chmod +x` the shell scripts.
2. A minimal `index.html` + `src/main.js` that fetches `VERSION`, sets `window.__ready` after 3 frames and exposes `window.__olympus`. Then the first `browser.test.mjs` (boots with no errors; the determinism check).
3. `npm install` (playwright-core only).
4. `tools/release.sh patch "Project boilerplate: the method from tradecraft" --trailer "Co-Authored-By: …" --trailer "Claude-Session: …"` makes `v0.0.1`, tagged and pushed to `origin` (github.com/mramad3us/olympus, which exists).
5. `./play.sh` (the user's) makes `.play/` at `v0.0.1` and serves :8200. `./play.sh --dev` serves :8201.

---

## 13. The toolchain on this Mac (checked 2026-11-05, nothing changed)

| Tool | State | Where |
|---|---|---|
| Machine | Apple M5 Pro, 24 GB | |
| Blender | **5.2.3 LTS** (built 2026-10-22), Homebrew cask | `/opt/homebrew/bin/blender` → `/Applications/Blender.app` |
| MPFB | **2.0.18**, installed as an extension (blender_version_min 4.2.0) | `~/Library/Application Support/Blender/5.2/extensions/blender_org/mpfb` |
| MPFB data | **34 packs installed**: clothes 236, hair 70, skins 59, eyebrows 26, poses 18, eyelashes 9, proxymeshes 7, teeth 6, targets 4, eyes 3, tongue 1; 2.1 GB | `…/Blender/5.2/extensions/.user/blender_org/mpfb/data` |
| Pack zips | 34 zips, 1.8 GB (23 CC0 + 11 CC-BY; no weapons or armour) | `~/Library/Caches/tradecraft/makehuman` |
| CMU mocap | 11 MB (`bvh/`, `index.txt`, `sequences.txt`, `zip/`) | `~/Library/Caches/tradecraft/cmu` |
| Mixamo | 384 KB (`raw/`) | `~/Library/Caches/tradecraft/mixamo` |
| Saved image models | `z-image-turbo-q8` only, 10 GB | `~/Library/Caches/tradecraft/models` |
| Hugging Face cache | `hub/models--Tongyi-MAI--Z-Image-Turbo` (31 GB of blobs), `xet/` (2.1 MB), `CACHEDIR.TAG`, `.agent_harnesses.json`, and a `token` file (37 bytes, mode 600; **not read**). FLUX.2 klein, Krea 2 and Ideogram 4 are **not downloaded** yet | `~/.cache/huggingface` |
| mflux | **0.22.0** (uv tool; pillow 12.3.0, mlx 0.32.4); 45 `mflux-*` commands incl. `-z-image-turbo`, `-flux2`, `-flux2-edit`, `-krea2`, `-ideogram4`, `-qwen-2.1`, `-save`, `-upscale-seedvr2` | `~/.local/bin`, `~/.local/share/uv/tools/mflux` |
| uv | 0.13.5 | `/opt/homebrew/bin/uv` |
| ffmpeg | 9.0.2 | `/opt/homebrew/bin/ffmpeg` |
| ImageMagick | 7.1.2-32 Q16-HDRI (`magick`) | `/opt/homebrew/bin/magick` |
| Node | v22.18.0 (nvm) | `~/.nvm/versions/node/v22.18.0/bin/node` |
| Python | 3.14.8 (Homebrew) | `/opt/homebrew/bin/python3` |
| swiftc | present (for `bright.swift`) | `/usr/bin/swiftc` |
| Chrome | 157.0.8103.38 | `/Applications/Google Chrome.app` |
| playwright-core | 1.64.0 in tradecraft's `node_modules` (OLYMPUS needs its own `npm install`) | |
| three | 0.186.1 (tradecraft vendored copy, 2.4 MB) | |
| Ports listening | 5000, 7000 (ControlCenter), 49202 (rapportd). Nothing on 8090/8100/8101/82xx | |

So **image generation on Z-Image-Turbo works today with no download**: `tools/gen.sh z-image-turbo …` would reuse the saved q8 copy if OLYMPUS's gen.sh looks there. The other models need the HF token and large first downloads.

---

## 14. Reuse verdicts in brief

- **reuse as-is (rename only):** `promote.sh`, `version.test.mjs`, `syntax.test.mjs`, `helpers.mjs`, `run.mjs`, `shot.mjs`, `.gitattributes`, `awake.sh` + `bright.swift` + hooks. They're pure, small, dependency-free (bash, Python stdlib, Node stdlib, playwright-core), proven over 148 releases, and indifferent to the game's genre.
- **adapt:** `release.sh` (major-candidate path), `serve.py` (MIME types), `play.sh`/`play.cmd`/`play.ps1` (ports), `browser.test.mjs` (shared `withGame`, port, handle), `gallery.mjs` + `samples/index.html` (port, keys; pixel mode is a direct fit), `setup.sh` and `gen.sh` (cache names, model reuse, optional 3D), `package.json`, `.gitignore`, `CLAUDE.md`.
- **reference only:** `bots.mjs`, `rangebot.mjs`, `shopwalk.mjs` (patterns for scripted soldiers and weapon-discipline tests; their code is street- and tradecraft-specific), `vendor-three.mjs` (only if three.js is chosen), PIPELINE's rules and licence table (re-read for OLYMPUS).
- **skip:** `fetch-asset.mjs`, `fetch-cmu.sh`, `tools/blender/*` (`person.py`, `retarget.py`, `animlib.py`, `kit.py`, `mpfb_packs.py`) for the game itself. Tradecraft's own shipped game never used them; its pixel art is drawn by code.

---

## 15. The user's tastes and decisions that bear on the method

Quoted or closely paraphrased, with dates where the source gives them. They carry over to OLYMPUS unless the user says otherwise.

- **OLYMPUS brief (2026-11-05):** "Build from the ground up with functional test versions and a promotion script to test the latest stable version (like tradecraft)." The look and controls should follow tradecraft, "not necessarily the same tech"; longhaul's tech should be refactored "only … if it's the best way".
- **Version numbers:** patch is Claude's; "the minor and the major are the user's"; the first candidate is declared by the user and validated by the user; "The major (1.0) is the user's call too" (tradecraft CLAUDE.md, carried from longhaul v1.12: "Never bump the minor on your own").
- **Validation in the user's words:** "promote the current version as 0.1.0, this is Alpha 1 worthy" (2026-11-03).
- **Promotion only on the user's go** ("update my game", "go", "promote"); after a release, say what's in it and that it's ready; don't promote unasked.
- **"Prep it but don't apply until I say go"** means a branch or scratch worktree, merged on the go.
- **The user plays while work goes on,** and drops patch requests mid-round, which are folded into the next patch release (tradecraft CLAUDE.md; longhaul: "The user often plays from the working copy while asking for changes").
- **The user plays on Windows as well as the Mac** (reports "from Windows", 2026-10-26; the ANGLE/D3D11 hitch, 2026-10-29). Hence `play.cmd`.
- **Keyboard:** keys read by physical position; tradecraft's controls are ZQSD on the user's layout (README; DESIGN v0.0.15 "controls (ZQSD read by physical key, F, I)").
- **Keep the Mac awake through long runs,** but "stop killing the brightness" (2026-10-26); dimming opt-in only.
- **Old saves before 1.0** are kept "only where it comes naturally: no work to carry them over a change" (2026-10-26).
- **The game is free and won't be sold** (2026-10-25, said of tradecraft; it's what admits non-commercial image models).
- **Memory holds only preferences;** the release history lives in CHANGELOG.md ("longhaul's memory grew to 36 KB of it").
- **If an auto-mode safety check blocks commands,** say so and ask to switch modes; never work around it (longhaul: "combat-heavy conversations have triggered it", which is likely in a military game).
- **Kill any server you start.**
- **Each mechanic is a playable test the user scores** before mechanics are joined (tradecraft Q161); looks are chosen from numbered samples with ★ picks and scores (v0.0.8, v0.0.14).
- **Tests print the numbers; read them.** Balance is judged from printed figures (longhaul and tradecraft).

---

## 16. Open questions only the user can answer

1. **Ports:** are 8200 (play), 8201 (dev), 8212 (gallery), 8223 (browser tests) and 8230–8239 (agents) acceptable?
2. **Licence posture:** is OLYMPUS, like tradecraft, free and never sold? That decides whether FLUX.2 klein 9B, Krea 2 and Ideogram 4 (non-commercial / community licences) may ship art. And is Ideogram's "no real military … use" clause acceptable to the user for a military fiction?
3. **The road to 1.0:** should `release.sh` gain the `rc --user-declared --major` path (1.0.0-rc1 … 1.0.0)? Or should the minors run on (0.1 → 0.2 → … ) with the user deciding which validated candidate becomes 1.0.0 directly?
4. **Candidates as the work channel:** tradecraft refuses patches during a candidate, so all work became rc-numbered (0.1.0 had 56). Keep that, or allow patch releases on the last validated minor while a candidate is open?
5. **Windows:** confirm that OLYMPUS should ship `play.cmd` and be performance-checked for ANGLE/D3D11 from the start.
6. **Remote and visibility:** `origin` is `github.com/mramad3us/olympus`, and `release.sh` pushes every release with its tag. Is pushing every release wanted, and should the repo be public?
7. **The 3D toolchain:** may OLYMPUS leave Blender/MPFB out of `setup.sh` by default (a top-down pixel game drawn by code, as tradecraft's shipped game is), or does the user want 3D-rendered references (MPFB bodies in armour or vacuum suits) as part of the art pipeline?
