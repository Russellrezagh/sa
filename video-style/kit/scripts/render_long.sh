#!/usr/bin/env bash
# Resumable render of a long composition: silent video in chunks + one audio-only pass, then concat + mux.
#   scripts/render_long.sh <CompositionId> <outDir> [chunkFrames=4600]
# Re-running skips chunks that already exist. Every frame is a pure function of its index, so chunks join seamlessly.
set -euo pipefail
id=$1; out=$2; chunk=${3:-4600}
mkdir -p "$out"
BX=${REMOTION_BROWSER:+--browser-executable=$REMOTION_BROWSER}
total=$(node -e "const b=require('./src/storyboards/${STORYBOARD:?set STORYBOARD=<file>.json}'); console.log(b.meta.total_frames)")
i=0; start=0; : > "$out/chunks.txt"
while [ $start -lt $total ]; do
  end=$(( start + chunk - 1 )); [ $end -ge $total ] && end=$(( total - 1 ))
  f="$out/chunk-$(printf %02d $i).mp4"
  if [ ! -s "$f" ]; then
    echo "[$(date +%T)] chunk $i: frames $start-$end"
    npx remotion render "$id" "$f.tmp.mp4" --frames=$start-$end --muted --concurrency=4 $BX > "$out/chunk-$i.log" 2>&1
    mv "$f.tmp.mp4" "$f"
  fi
  echo "file '$(basename "$f")'" >> "$out/chunks.txt"
  i=$(( i + 1 )); start=$(( end + 1 ))
done
if [ ! -s "$out/audio.wav" ]; then
  echo "[$(date +%T)] audio"
  npx remotion render "$id" "$out/audio.wav.tmp.wav" --codec=wav --concurrency=4 $BX > "$out/audio.log" 2>&1
  mv "$out/audio.wav.tmp.wav" "$out/audio.wav"
fi
ffmpeg -v error -y -f concat -safe 0 -i "$out/chunks.txt" -i "$out/audio.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$out/$id.mp4"
echo "[$(date +%T)] done: $out/$id.mp4"
