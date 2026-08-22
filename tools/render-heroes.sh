#!/usr/bin/env bash
#
# Rebuild the two hero cards that state measured figures.
#
#   tools/render-heroes.sh
#
# Renders hero-source.html at 900x1124, cuts it at y=562 into the two cards,
# and writes them as WebP:
#
#   img/ff-hero.webp        Cotizador Farmers Fresh
#   img/currents-hero.webp  Currents
#
# The device mockups inside them come from img/ff-shot.webp and
# img/currents-shot.webp, which were cropped out of the original images once
# and are not regenerated here — only the text around them is.
#
# Run this after any figure on those cards changes, then `npm run check`, which
# fails if hero-source.html has drifted from js/data.js. Nothing can read the
# figures once they are inside a WebP, so the check reads the source instead.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

command -v cwebp >/dev/null || { echo "cwebp not found (brew install webp)" >&2; exit 1; }
command -v ffmpeg >/dev/null || { echo "ffmpeg not found (brew install ffmpeg)" >&2; exit 1; }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "rendering hero-source.html at 900x1124"
npx --no-install playwright screenshot \
  --viewport-size=900,1124 \
  --wait-for-timeout=1800 \
  "file://$ROOT/hero-source.html" "$TMP/sheet.png" >/dev/null 2>&1

# One straight cut. The cards are authored at exactly the height of the images
# they become, so this is a slice, not a measurement.
ffmpeg -y -v error -i "$TMP/sheet.png" -vf "crop=900:562:0:0"   "$TMP/ff.png"
ffmpeg -y -v error -i "$TMP/sheet.png" -vf "crop=900:562:0:562" "$TMP/currents.png"

cwebp -quiet -q 90 "$TMP/ff.png"       -o img/ff-hero.webp
cwebp -quiet -q 90 "$TMP/currents.png" -o img/currents-hero.webp

echo
echo "written:"
for f in img/ff-hero.webp img/currents-hero.webp; do
  printf "  %-26s %6.1f KB\n" "$f" "$(echo "scale=1; $(wc -c < "$f")/1024" | bc)"
done
echo
echo "next: npm run check  (verifies hero-source.html still matches js/data.js)"
