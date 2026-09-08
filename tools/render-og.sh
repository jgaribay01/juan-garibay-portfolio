#!/usr/bin/env bash
#
# Rebuild the social card.
#
#   tools/render-og.sh
#
# Renders og-source.html at exactly 1200x630 and writes it as img/og.png —
# the image every link preview shows, on every page of the site.
#
# Why this script exists at all: the card is the most drift-prone surface in
# the repo. Nothing on the site displays it, nobody reloads it, and its figures
# live inside a PNG where no check can read them. It has already drifted once,
# claiming figures the pages had already moved past. `npm run check` catches
# that by reading og-source.html instead — but only if the PNG is actually
# regenerated from it, which is what this script is for.
#
# After running it:
#
#   1. npm run check          fails if og-source.html has drifted from data.js
#   2. bump the ?v= string    img/ is served immutable for a year, so a card
#                             regenerated at the same URL is a card nobody
#                             sees. The guard requires the query to contain
#                             ?v=<MEASURED_ON>; append a revision suffix
#                             (?v=2026-08-24-b) when the art changes but the
#                             measurement has not.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

OUT="img/og.png"
PORT=8799

echo "rendering og-source.html at 1200x630"

# The card loads css/fonts.css by relative path, so it has to be rendered over
# http rather than from file:// — a file:// origin will not fetch the woff2
# files and the card comes out set in a fallback face.
python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER=$!
trap 'kill "$SERVER" 2>/dev/null || true' EXIT
sleep 1

npx --yes playwright screenshot \
  --viewport-size=1200,630 \
  --wait-for-timeout=1500 \
  "http://127.0.0.1:$PORT/og-source.html" "$OUT" >/dev/null 2>&1

SIZE="$(file -b "$OUT" | grep -o '[0-9]\+ x [0-9]\+' || true)"
if [ "$SIZE" != "1200 x 630" ]; then
  echo "og: expected 1200 x 630, got '${SIZE:-unknown}'" >&2
  exit 1
fi

printf '\nwritten:\n  %-16s %6.1f KB  (%s)\n\n' \
  "$OUT" "$(echo "scale=1; $(wc -c < "$OUT")/1024" | bc)" "$SIZE"
echo "next: npm run check, then bump the ?v= suffix on og:image and twitter:image"
