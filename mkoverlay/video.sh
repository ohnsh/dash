#!/usr/bin/env bash

script_dir=$(dirname "$(realpath "${BASH_SOURCE[0]}")")
video_ts=$script_dir/video.ts
marker=.video.sh_inprogress

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
    echo "Remuxing $raw" >&2
    ffmpeg \
      -v warning \
      -i "$raw" \
      -c copy \
      -movflags +faststart \
      "$out" && rm "$raw"
  else
    mv "$raw" "$out"
  fi
}

process_camdir() {
  if [[ ! -d _raw ]]; then
    echo "Error: process_catdir should be called with the working directory already set, perhaps in a subshell. The working directory must contain a _raw directory where mp4 recordings appear." >&2
    return 1
  fi

  # extract date and camera/category information from path
  local ymd cam=${PWD##*/}
  ymd=$(cd .. && basename "$PWD")
  if [[ ! $ymd =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
    echo "Error: parent of working directory ($PWD) should be the date of the recordings (e.g. '$(date -Idate)')." >&2
    return 1
  fi

  local day=${ymd##*-} ym=${ymd%-*}
  local r2path=$ym/$day/$cam

  local videos=(_raw/*.mp4)

  # count used to limit scope when testing
  count=${count:-${#videos[@]}}
  local bn

  for raw in "${videos[@]:0:$count}"; do
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

    touch "$marker" &&
      maybe_remux "$raw" "$bn" &&
      [[ -f "$bn" ]] &&
      mkassets "$bn" &&
      sync_camdir &&
      rm "$marker"
  done

  # do this once per run instead of per file
  index_inventory
}

index_inventory() {
  local r2inv=$r2path/inventory.json

  echo "Indexing $r2inv" >&2
  # only update index if we actually have an inventory file
  if [[ -f ./inventory.json ]]; then
    "$video_ts" index "$r2inv"
  fi
}

sync_camdir() {
  echo "Syncing to r2:vod/$r2path" >&2

  rclone copy \
    . "r2:vod/$r2path" \
    --exclude ".*/**" \
    --exclude "_raw/**" \
    --exclude ".DS_Store"
}

# could limit env loading to subshell
# rclone() {
#   command rclone "$@"
# }

mkassets() {
  local video=$1
  mkdir -p "_assets/$video"

  echo "Creating assets for $video" >&2

  "$video_ts" mkassets "$video"
}

if [[ $1 == '-n' ]]; then
  count=$2
  shift 2
fi
camdir=$1
shift

cd "$camdir" || {
  echo "Error: couldn't enter $camdir" >&2
  exit 1
}

# rclone credentials
set -a
. "$script_dir/.env"
set +a

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
