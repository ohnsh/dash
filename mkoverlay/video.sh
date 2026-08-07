#!/usr/bin/env bash

lsof_t() {
  local file=$1

  # on a busybox system, we actually want fuser
  # in both cases, command succeeds when the file is open, fails otherwise.
  if [[ $(readlink "$(command -v lsof)" 2>/dev/null) == */busybox ]]; then
    fuser "$file" 2>/dev/null
  else
    command lsof -t "$file" 2>/dev/null
  fi
}

is_fragmented() {
  local mp4=$1
  ffprobe -v trace "$mp4" 2>&1 | grep -q "type:'moof'"
}

maybe_remux() {
  local raw=$1
  local out=$2

  if is_fragmented "$raw"; then
    ffmpeg -i "$raw" -c copy -movflags +faststart "$out"
  else
    mv "$raw" "$out"
  fi
}

process_camdir() {
  if [[ ! -d _raw ]]; then
    echo "Error: process_catdir should be called with the working directory already set, perhaps in a subshell. The working directory must contain a _raw directory where mp4 recordings appear." >&2
    return 1
  fi

  local videos=(_raw/*.mp4)
  local bn

  for raw in "${videos[@]}"; do
    if lsof_t "$raw" &>/dev/null; then
      echo "$raw currently open; skipping." >&2
      continue
    fi

    bn=$(basename "$raw")

    if [[ -f $bn ]]; then
      echo "Error: $bn already exists" >&2
      mkdir -p _error
      mv "$raw" _error
      continue
    fi

    maybe_remux "$raw" "$bn" &&
      [[ -f "$bn" ]] &&
      mkassets "$bn"
  done
}

mkassets() {
  local video=$1
  mkdir -p "_assets/$video"

  
  
}

camdir=$1

cd "$camdir" || {
  echo "Error: couldn't enter $camdir" >&2
  exit 1
}

process_camdir

# layout:
# %Y-%m-%d
#  |-category1
#  |  |-_raw
#  |  |  |-three.mp4
#  |  |  |-four.mp4
#  |  |  |-...
#  |  |-one.mp4
#  |  |-two.mp4
#  |  |-_assets
#  |  |  |-one.mp4
#  |  |  |  |-thumb.webp
#  |  |  |-two.mp4
#  |  |  |  |-thumb.webp
#  |  |-_error
#  |
#  |-category2
#
