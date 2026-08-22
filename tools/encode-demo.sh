#!/usr/bin/env bash
#
# Turn a raw screen recording into the three files a project card needs.
#
#   tools/encode-demo.sh ~/Desktop/rutero.mov rutero
#
# Produces, in img/:
#   rutero-demo.mp4           H.264, broad support
#   rutero-demo.webm          VP9, smaller where it is supported
#   rutero-demo-poster.webp   first usable frame, shown until someone presses play
#
# Audio is stripped on purpose: the card plays muted and silent video is
# meaningfully smaller. Nothing here uploads anything — it is all local ffmpeg.
#
# Before recording, read the note in README.md about what must not be on screen.

set -euo pipefail

SRC="${1:-}"
NAME="${2:-}"
START="${3:-0}"          # seconds to trim off the front, e.g. 1.5
POSTER_AT="${4:-}"        # seconds to grab the poster from; defaults to a third in

if [[ -z "$SRC" || -z "$NAME" ]]; then
  echo "usage: tools/encode-demo.sh <recording> <name> [trim-start-seconds] [poster-at-seconds]" >&2
  echo "example: tools/encode-demo.sh ~/Desktop/rutero.mov rutero 1.5 12" >&2
  exit 1
fi
[[ -f "$SRC" ]] || { echo "no such file: $SRC" >&2; exit 1; }
command -v ffmpeg >/dev/null || { echo "ffmpeg not found (brew install ffmpeg)" >&2; exit 1; }
command -v cwebp >/dev/null || { echo "cwebp not found (brew install webp)" >&2; exit 1; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/img"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

DURATION=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC")
[[ -z "$POSTER_AT" ]] && POSTER_AT=$(awk -v d="$DURATION" 'BEGIN { printf "%.1f", d/3 }')

echo "source   : $(basename "$SRC")  ${DURATION%.*}s"
echo "trimming : ${START}s from the front"
echo "poster   : frame at ${POSTER_AT}s"

# Scale so the long edge is at most 720px. A card never shows it larger, and
# anything bigger is bytes nobody sees.
SCALE="scale='if(gt(iw,ih),min(720,iw),-2)':'if(gt(iw,ih),-2,min(720,ih))'"

ffmpeg -y -v error -ss "$START" -i "$SRC" -an \
  -c:v libx264 -profile:v high -crf 30 -preset slow -pix_fmt yuv420p -movflags +faststart \
  -vf "fps=24,$SCALE" "$OUT/$NAME-demo.mp4"

ffmpeg -y -v error -ss "$START" -i "$SRC" -an \
  -c:v libvpx-vp9 -crf 40 -b:v 0 -row-mt 1 \
  -vf "fps=24,$SCALE" "$OUT/$NAME-demo.webm"

ffmpeg -y -v error -ss "$POSTER_AT" -i "$SRC" -frames:v 1 -vf "$SCALE" "$TMP/poster.png"
cwebp -quiet -q 80 "$TMP/poster.png" -o "$OUT/$NAME-demo-poster.webp"

echo
echo "written:"
for f in "$OUT/$NAME-demo.mp4" "$OUT/$NAME-demo.webm" "$OUT/$NAME-demo-poster.webp"; do
  printf "  %-38s %6.1f KB\n" "img/$(basename "$f")" "$(echo "scale=1; $(wc -c < "$f")/1024" | bc)"
done
DIMS=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "$OUT/$NAME-demo.mp4")
echo "  dimensions: $DIMS"
echo
echo "next: add a demo block to that project in js/data.js —"
cat <<EOF
      demo: {
        mp4: 'img/$NAME-demo.mp4',
        webm: 'img/$NAME-demo.webm',
        poster: 'img/$NAME-demo-poster.webp',
        label: 'Screen recording of …  (describe what happens, for screen readers)',
      },
EOF
echo "then: npm run check && npx vercel deploy --prod"
