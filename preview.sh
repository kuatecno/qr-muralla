#!/usr/bin/env bash
set -e

PORT="${1:-8000}"
HOST="127.0.0.1"
URL="http://$HOST:$PORT/"

echo "➡️  Serving QRMURALLA at $URL"

open_url() {
  if command -v open >/dev/null 2>&1; then
    (sleep 1; open "$URL") >/dev/null 2>&1 &
  elif command -v xdg-open >/dev/null 2>&1; then
    (sleep 1; xdg-open "$URL") >/dev/null 2>&1 &
  fi
}

open_url

# Prefer Node (APIs enabled)
if command -v node >/dev/null 2>&1 && node -e 'process.exit(global.fetch?0:1)' >/dev/null 2>&1; then
  HOST="$HOST" PORT="$PORT" node server.js
  exit $?
fi

# Fallback to Python (static only)
if command -v python3 >/dev/null 2>&1; then
  exec python3 -m http.server "$PORT" --bind "$HOST"
elif command -v python >/dev/null 2>&1; then
  exec python -m SimpleHTTPServer "$PORT"
elif command -v php >/dev/null 2>&1; then
  exec php -S "$HOST:$PORT"
elif command -v ruby >/dev/null 2>&1; then
  exec ruby -run -e httpd . -p "$PORT" -b "$HOST"
else
  echo "No simple HTTP server found. Install Node 18+, Python, PHP, or Ruby." >&2
  exit 1
fi
