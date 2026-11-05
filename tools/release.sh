#!/usr/bin/env bash
# OLYMPUS: cut a release.
#
#   tools/release.sh patch "<summary>" [--trailer "Key: value"]... [--no-test]
#   tools/release.sh minor "<summary>" [...]
#   tools/release.sh rc --major "<summary>" [...]
#   tools/release.sh rc "<summary>" [...]
#   tools/release.sh major --user-validated "<summary>" [...]
#
# One release, start to finish, so no step is forgotten:
#   1. the next version from VERSION (below);
#   2. nothing stray: an untracked file outside the shipped top-level paths
#      (ALLOWED) stops the release before anything is touched, so a scratch
#      file never ships by `git add -A`;
#   3. CHANGELOG.md's "## Unreleased" section becomes "## vX.Y.Z (date)", and
#      a fresh empty Unreleased goes above it (an empty Unreleased is refused:
#      every release says what it changed);
#   4. VERSION is written;
#   5. the tests run (npm test; QUICK=1 or SKIP=a,b in the environment pass
#      through to the runner);
#   6. everything is committed as "vX.Y.Z: <summary>" with the trailers given,
#      and tagged vX.Y.Z (annotated, so --follow-tags pushes it);
#   7. pushed, if there is an origin (github.com/mramad3us/olympus: every
#      release is pushed, the user, 2026-11-05).
# VERSION and CHANGELOG.md are backed up in .run/ first. If anything fails
# before the commit is made (the tests, a stray file the tests left, the
# commit itself, Ctrl+C), both are put back and so is git's index: nothing is
# released and nothing is left half done. The play copy is not touched:
# promotion is tools/promote.sh, on the user's go.
#
# The numbers (the user, 2026-11-05: Claude cuts patches and bumps the minor
# at tested milestones; 1.0 is the user's call):
#   - patch: a round of work, 0.0.1 -> 0.0.2. Claude's.
#   - minor: a tested milestone, 0.0.9 -> 0.1.0. Claude's.
#   - rc --major: opens the next major's candidate, 0.9.4 -> 1.0.0-rc1. Only
#     on the user's word that the game is ready for it.
#   - rc: the next candidate, 1.0.0-rc1 -> 1.0.0-rc2: fixes and work while a
#     candidate is open. Patch and minor are refused on a candidate.
#   - major --user-validated: the candidate becomes its version, 1.0.0-rc3 ->
#     1.0.0. --user-validated is the user's validation, said out loud. A major
#     never skips its candidate.
set -eu
DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DIR"

# The top-level paths a release may add when they're new. Anything else
# untracked and not ignored stops the release: commit it on purpose, ignore
# it, or delete it.
ALLOWED=(src tests tools docs vendor samples assets index.html VERSION CHANGELOG.md README.md CLAUDE.md
         CREDITS.md package.json package-lock.json play.sh play.cmd .gitignore .gitattributes)

usage() { sed -n '4,8p' "$0" | sed 's/^# *//'; exit 1; }
[ $# -ge 2 ] || usage
PART="$1"; shift
SUMMARY=""; TRAILERS=(); VALIDATED=0; MAJOR=0; TEST=1
while [ $# -gt 0 ]; do
  case "$1" in
    --trailer) [ $# -ge 2 ] || usage; TRAILERS+=(--trailer "$2"); shift 2 ;;
    --user-validated) VALIDATED=1; shift ;;
    --major) MAJOR=1; shift ;;
    --no-test) TEST=0; shift ;;
    --*) echo "unknown option: $1"; usage ;;
    *) [ -z "$SUMMARY" ] || { echo "one summary only (quote it): \"$SUMMARY\", then \"$1\""; exit 1; }
       SUMMARY="$1"; shift ;;
  esac
done
[ -n "$SUMMARY" ] || { echo "a release needs its summary"; usage; }
[ $MAJOR = 0 ] || [ "$PART" = rc ] || { echo "--major goes with rc (rc --major opens the next major's candidate)."; exit 1; }
[ $VALIDATED = 0 ] || [ "$PART" = major ] || { echo "--user-validated goes with major (a candidate the user validated)."; exit 1; }

OLD=$(tr -d '[:space:]' < VERSION)
[[ "$OLD" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-rc[0-9]+)?$ ]] || { echo "VERSION reads \"$OLD\", not MAJOR.MINOR.PATCH[-rcN]."; exit 1; }
BASE=${OLD%%-rc*}; RC=""
[ "$BASE" != "$OLD" ] && RC=${OLD##*-rc}
IFS=. read -r MA MI PA <<< "$BASE"
SUFFIX=""
case "$PART" in
  patch|minor)
    if [ -n "$RC" ]; then
      echo "On release candidate $OLD: work goes out as the next candidate (rc), until the user validates it (major --user-validated)."
      exit 1
    fi
    if [ "$PART" = patch ]; then PA=$((10#$PA + 1)); else MI=$((10#$MI + 1)); PA=0; fi ;;
  rc)
    if [ $MAJOR = 1 ]; then
      if [ -n "$RC" ]; then echo "$OLD is open already: the next candidate is plain rc."; exit 1; fi
      MA=$((10#$MA + 1)); MI=0; PA=0; SUFFIX="-rc1"
    elif [ -n "$RC" ]; then SUFFIX="-rc$((10#$RC + 1))"
    else
      echo "No candidate is open on $OLD. rc --major opens the next major's (on the user's word); a milestone is minor, a round of work patch."
      exit 1
    fi ;;
  major)
    if [ $VALIDATED = 0 ]; then echo "The major is the user's call: major --user-validated, once they have validated its candidate."; exit 1; fi
    if [ -z "$RC" ]; then echo "A major goes through its candidate first: rc --major opens it ($OLD -> $((10#$MA + 1)).0.0-rc1)."; exit 1; fi
    if [ "$MI.$PA" != "0.0" ]; then echo "$OLD isn't a major's candidate (X.0.0-rcN)."; exit 1; fi
    ;;                                                               # the candidate becomes its version
  *) usage ;;
esac
NEW="$MA.$MI.$PA$SUFFIX"
TAG="v$NEW"
SUBJECT="$TAG: $SUMMARY"

if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null; then echo "$TAG already exists."; exit 1; fi
BRANCH=$(git symbolic-ref -q --short HEAD || true)
# Releases are cut on main (my call): a detached HEAD can't be pushed as a branch, and a
# release tag on a side branch would leave main behind the play copy.
if [ "$BRANCH" != main ]; then echo "Releases are cut on main (HEAD is ${BRANCH:-detached})."; exit 1; fi
[ -f CHANGELOG.md ] || { echo "No CHANGELOG.md."; exit 1; }
[ ${#SUBJECT} -le 72 ] || echo "note: the subject is ${#SUBJECT} characters; keep it under 72 and put the detail in CHANGELOG.md."

stray() {                                    # untracked, not ignored, and outside ALLOWED
  local f top a ok
  git ls-files --others --exclude-standard --directory --no-empty-directory -z | while IFS= read -r -d '' f; do
    top=${f%%/*}; ok=0
    for a in "${ALLOWED[@]}"; do [ "$top" = "$a" ] && { ok=1; break; }; done
    [ $ok = 1 ] || printf '  %s\n' "$f"
  done
}
refuse_stray() {
  local s; s=$(stray)
  [ -z "$s" ] && return 0
  echo "Untracked files outside what a release ships ($1):"
  echo "$s"
  echo "Commit them on purpose, ignore them (.gitignore), or delete them. Shipped top-level paths: ${ALLOWED[*]}"
  return 1
}
refuse_stray "nothing touched" || exit 1

# From here on, anything that stops the release puts VERSION, CHANGELOG.md and git's index back.
mkdir -p .run
cp VERSION .run/VERSION.bak; cp CHANGELOG.md .run/CHANGELOG.md.bak
INDEX=$(git rev-parse --git-path index)
DONE=0; ADDED=0
restore() {
  local changed=0
  cmp -s VERSION .run/VERSION.bak && cmp -s CHANGELOG.md .run/CHANGELOG.md.bak || changed=1
  cp .run/VERSION.bak VERSION; cp .run/CHANGELOG.md.bak CHANGELOG.md
  if [ $ADDED = 1 ]; then
    if [ -f .run/index.bak ]; then cp .run/index.bak "$INDEX"; else rm -f "$INDEX"; fi
  fi
  [ $changed = 0 ] || echo "Nothing released: VERSION and CHANGELOG.md put back."
}
trap '[ $DONE = 1 ] || restore' EXIT
trap 'exit 130' INT TERM

# The Unreleased section must say something, and hold no "## " heading of its own (the entry
# would end there, and what follows it would be stamped into nothing).
python3 - "$NEW" "$(date +%Y-%m-%d)" <<'EOF'
import re, sys
ver, day = sys.argv[1], sys.argv[2]
p = 'CHANGELOG.md'
s = open(p, encoding='utf-8').read()
m = re.search(r'^## Unreleased[ \t]*\n(.*?)(?=^## v\d+\.\d+\.\d+(?:-rc\d+)? \(|\Z)', s, re.S | re.M)
if not m:
    sys.exit('CHANGELOG.md: no "## Unreleased" section.')
inner = re.search(r'^## .*$', m.group(1), re.M)
if inner:
    sys.exit(f'CHANGELOG.md: "{inner.group(0)}" inside Unreleased would cut the entry; use a bold lead-in instead.')
if not m.group(1).strip():
    sys.exit('CHANGELOG.md: write what this release changes under "## Unreleased" first.')
s = s[:m.start()] + f'## Unreleased\n\n## v{ver} ({day})\n\n{m.group(1).strip()}\n\n' + s[m.end():]
open(p, 'w', encoding='utf-8').write(s)
EOF
echo "$NEW" > VERSION

if [ $TEST = 1 ] && [ -f package.json ] && grep -q '"test"' package.json; then
  if ! npm test --silent; then
    echo "Tests failed; nothing released."
    exit 1
  fi
elif [ $TEST = 0 ]; then
  echo "note: tests not run (--no-test)."
fi
refuse_stray "left by the tests?" || exit 1

if [ -f "$INDEX" ]; then cp "$INDEX" .run/index.bak; else rm -f .run/index.bak; fi
ADDED=1
git add -A
if ! git commit -q -m "$SUBJECT" ${TRAILERS[@]+"${TRAILERS[@]}"}; then
  echo "The commit failed; nothing released."
  exit 1
fi
DONE=1
if ! git tag -a "$TAG" -m "$SUBJECT"; then
  echo "Committed as $(git rev-parse --short HEAD) but not tagged: git tag -a $TAG -m \"$SUBJECT\", then push."
  exit 1
fi
echo "released $TAG ($(git rev-parse --short HEAD))"

STATUS=0
if git remote get-url origin >/dev/null 2>&1; then
  if git push -q --follow-tags origin HEAD; then echo "pushed to origin"
  else echo "NOT pushed: git push --follow-tags origin HEAD once the remote answers."; STATUS=1; fi
fi
tools/promote.sh --status
exit $STATUS
