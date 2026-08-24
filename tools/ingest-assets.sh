#!/usr/bin/env bash
#
# Turn the raw generated files into the assets the page actually loads.
#
#   tools/ingest-assets.sh [source-dir]
#
# Source defaults to ~/scrollcraft/builds/pitwall/assets/generated. Reads five
# files by name, any of png/jpg/jpeg/webp:
#
#   corridor-panel   wall material, becomes a seamless tile
#   dust             particulate on black, becomes a seamless tile
#   endwall          the room the corridor terminates in
#   bay-housing      the bezel each screenshot sits in
#   og-plate         ground for the social card
#
# Three things happen to every file and they are all deliberate:
#
# 1. The generator stamps a visible mark in the bottom-right corner. On a tile
#    that repeats across the whole wall several times a screen, so it is
#    painted out with `delogo` rather than cropped, because cropping a tile
#    destroys the edges that have to meet.
#
# 2. Nothing an image model returns actually tiles, whatever the prompt asked
#    for. The two tiles are made seamless by construction: mirrored on both
#    axes, so opposite edges are identical by definition. On a bolt grid and on
#    scattered dust the symmetry does not read.
#
# 3. Everything is encoded to WebP and size-capped. The page ships ~100 KB of
#    imagery today; these must not turn that into five megabytes.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="${1:-$HOME/scrollcraft/builds/pitwall/assets/generated}"
OUT="$ROOT/img"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

command -v ffmpeg >/dev/null || { echo "ffmpeg not found (brew install ffmpeg)" >&2; exit 1; }
command -v cwebp  >/dev/null || { echo "cwebp not found (brew install webp)" >&2; exit 1; }

find_src() {
  local base="$1" f
  for ext in png jpg jpeg webp PNG JPG JPEG WEBP; do
    f="$SRC/$base.$ext"
    [ -f "$f" ] && { echo "$f"; return 0; }
  done
  return 1
}

dims() { ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "$1"; }

# Paint out the corner mark. The box is sized from the image so it holds at any
# resolution, and it is generous: a little extra painted corner costs nothing,
# a sliver of leftover mark costs the whole asset.
unmark() {
  local in="$1" out="$2" w h bw bh
  IFS=x read -r w h < <(dims "$in")
  bw=$(( w * 12 / 100 )); bh=$(( h * 12 / 100 ))
  [ "$bw" -lt 60 ] && bw=60
  [ "$bh" -lt 60 ] && bh=60
  ffmpeg -y -v error -i "$in" \
    -vf "delogo=x=$((w-bw-8)):y=$((h-bh-8)):w=$bw:h=$bh:show=0" "$out"
}

# Seamless by construction: mirror right, mirror down. Opposite edges are then
# the same pixels, so the tile cannot seam no matter how the model drew it.
mirror_tile() {
  local in="$1" out="$2" size="$3"
  ffmpeg -y -v error -i "$in" -filter_complex \
    "[0:v]split=2[l][r];[r]hflip[rf];[l][rf]hstack=inputs=2[top];\
     [top]split=2[t][b];[b]vflip[bf];[t][bf]vstack=inputs=2[full];\
     [full]scale=${size}:${size}:flags=lanczos[o]" -map "[o]" "$out"
}

plain() {
  local in="$1" out="$2" w="$3"
  ffmpeg -y -v error -i "$in" -vf "scale=${w}:-2:flags=lanczos" "$out"
}

report() {
  printf "  %-26s %-12s %6.1f KB\n" "$1" "$(dims "$1" 2>/dev/null || echo '-')" \
    "$(echo "scale=1; $(wc -c < "$1")/1024" | bc)"
}

echo "reading from $SRC"
made=0

for spec in "corridor-panel:tile:1024:82" "dust:tile:1024:78"; do
  IFS=: read -r name kind size q <<< "$spec"
  src="$(find_src "$name")" || { echo "  skip $name (not found)"; continue; }
  unmark "$src" "$TMP/$name-clean.png"
  mirror_tile "$TMP/$name-clean.png" "$TMP/$name-tile.png" "$size"
  cwebp -quiet -q "$q" "$TMP/$name-tile.png" -o "$OUT/$name.webp"
  made=$((made+1))
done

for spec in "endwall:1600:80" "bay-housing:1200:84" "og-plate:1600:80"; do
  IFS=: read -r name width q <<< "$spec"
  src="$(find_src "$name")" || { echo "  skip $name (not found)"; continue; }
  unmark "$src" "$TMP/$name-clean.png"
  plain "$TMP/$name-clean.png" "$TMP/$name-out.png" "$width"
  cwebp -quiet -q "$q" "$TMP/$name-out.png" -o "$OUT/$name.webp"
  made=$((made+1))
done

echo
echo "$made asset(s) written:"
total=0
for f in "$OUT"/corridor-panel.webp "$OUT"/dust.webp "$OUT"/endwall.webp "$OUT"/bay-housing.webp "$OUT"/og-plate.webp; do
  [ -f "$f" ] || continue
  report "$f"
  total=$(( total + $(wc -c < "$f") ))
done
echo
printf "  added to the page: %.0f KB\n" "$(echo "scale=2; $total/1024" | bc)"
echo "next: look at every one before wiring it, then npm run check"
