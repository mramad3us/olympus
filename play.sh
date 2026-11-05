#!/usr/bin/env bash
# OLYMPUS: serve the game and open the browser.
#
#   ./play.sh          the play copy (.play/, the release you play) on :8200; made from the
#                      latest release the first time (as play.cmd does on Windows)
#   ./play.sh --dev    the working tree, as it is right now, on :8201
#   ./play.sh --gallery  the play copy's look samples on :8212, to star and score (/samples/)
#
# Two copies on two ports, on purpose. The play copy is a release pinned by
# tools/promote.sh: it changes only when promoted, so a game in progress never
# has its files changed underneath it while work goes on in the tree. And the
# browser keeps saves per origin, so the dev server's saves (tests, smoke runs)
# never touch the player's. OLYMPUS_PLAY_PORT and OLYMPUS_DEV_PORT move the
# ports, for a check of this script itself away from the user's (8230-8239).
set -u
DIR="$(cd "$(dirname "$0")" && pwd)"
PLAY_PORT=${OLYMPUS_PLAY_PORT:-8200}
DEV_PORT=${OLYMPUS_DEV_PORT:-8201}

PAGE=""
case "${1:-}" in
  --dev) ROOT="$DIR"; PORT=$DEV_PORT; WHAT="working tree" ;;
  ""|--gallery)
    ROOT="$DIR/.play"; PORT=$PLAY_PORT; WHAT="play copy"
    # The gallery has a port of its own, so its stars and scores (localStorage) never mix with the
    # play copy's saves.
    if [ "${1:-}" = "--gallery" ]; then PORT=${OLYMPUS_GALLERY_PORT:-8212}; WHAT="look gallery"; PAGE="samples/"; fi
    if [ ! -e "$ROOT/.git" ]; then
      echo "No play copy yet: making it from the latest release."
      "$DIR/tools/promote.sh" || exit 1
    fi ;;
  *) echo "unknown option: $1"; sed -n '4,7p' "$0" | sed 's/^# *//'; exit 1 ;;
esac

VERSION=$(cat "$ROOT/VERSION" 2>/dev/null || echo '?')
mkdir -p "$DIR/.run"
PIDFILE="$DIR/.run/serve-$PORT.pid"

# Stop our own earlier server on this port, and only ours: another project's
# server (longhaul's on :8090, tradecraft's on :8100 and :8101, say) is none
# of our business. The pid is checked to be our serve.py before it's killed,
# since a pid left from before a restart may name something else by now.
if [ -f "$PIDFILE" ]; then
  OLD_PID=$(cat "$PIDFILE")
  if ps -p "$OLD_PID" -o command= 2>/dev/null | grep -q "tools/serve.py $PORT"; then
    kill "$OLD_PID" 2>/dev/null && sleep 0.3
  fi
  rm -f "$PIDFILE"
fi
if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port $PORT is taken by something else:"
  lsof -nP -iTCP:"$PORT" -sTCP:LISTEN
  exit 1
fi

python3 "$DIR/tools/serve.py" "$PORT" "$ROOT" &>/dev/null &
SERVER_PID=$!
echo "$SERVER_PID" > "$PIDFILE"
echo "OLYMPUS v$VERSION ($WHAT) on http://localhost:$PORT/$PAGE  (server pid $SERVER_PID, Ctrl+C to stop)"

sleep 0.5
open "http://localhost:$PORT/$PAGE"

trap 'kill $SERVER_PID 2>/dev/null; rm -f "$PIDFILE"; echo; echo "Server stopped."; exit 0' INT TERM
wait $SERVER_PID
rm -f "$PIDFILE"
