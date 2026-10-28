#!/usr/bin/env bash
# QA: timestamped contact sheet of a rendered video (one frame per second; long videos are
# sampled every ceil(duration/60) s so the sheet stays at <= ~60 tiles).
#   video-style/tools/contact_sheet.sh kit/out/mai-demo.mp4 kit/out/mai-demo-sheet.png
set -euo pipefail
in=$1; out=${2:-${in%.*}-sheet.png}
w=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$in")
h=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$in")
d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$in")
step=$(python3 -c "import math; print(max(1, math.ceil(float('$d') / 60)))")
n=$(python3 -c "import math; print(math.ceil(float('$d') / $step))")
if [ "$h" -gt "$w" ]; then scale=270; cols=8; else scale=480; cols=5; fi
tile=${cols}x$(( (n + cols - 1) / cols ))
ffmpeg -v error -y -i "$in" -vf "fps=1/${step},scale=${scale}:-1,drawtext=text='%{pts\:hms}':x=6:y=6:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.5,tile=${tile}" -frames:v 1 "$out"
echo "$out"
