#!/usr/bin/env bash

OUT=${2:-preview.mp4}

# pick 1 sec out of every 60
len=60
sel=0.75

ffmpeg -i "$1" \
  -vf "select='lt(mod(t,$len),$sel)',setpts=N/FRAME_RATE/TB,fps=10,scale=-2:480" \
  -an \
  -c:v libx264 -crf 26 -preset fast \
  -movflags +faststart \
  "$OUT"
