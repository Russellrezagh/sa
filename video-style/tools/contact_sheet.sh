#!/usr/bin/env bash
# QA: timestamped contact sheet of a rendered video (one frame per second).
#   video-style/tools/contact_sheet.sh kit/out/mai-demo.mp4 kit/out/mai-demo-sheet.png
set -euo pipefail
in=$1; out=${2:-${in%.*}-sheet.png}
w=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$in")
h=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$in")
if [ "$h" -gt "$w" ]; then scale=270; tile=8x4; else scale=480; tile=5x6; fi
ffmpeg -v error -y -i "$in" -vf "fps=1,scale=${scale}:-1,drawtext=text='%{pts\:hms}':x=6:y=6:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.5,tile=${tile}" -frames:v 1 "$out"
echo "$out"
