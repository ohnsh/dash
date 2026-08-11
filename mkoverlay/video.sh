#!/usr/bin/env bash

script_dir=$(dirname "$(realpath "${BASH_SOURCE[0]}")")
video_ts=$script_dir/videots_wrapper.sh
rclone=$script_dir/rclone_v.sh
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
      -xerror \
      -i "$raw" \
      -c copy \
      -movflags +faststart \
      "$out" && rm "$raw" || return
  else
    mv "$raw" "$out"
  fi
}

# using absolute links instead for now
# move_or_relink() {
#   local src=$1 dst=$2
#   local ln_src

#   if [[ -L $src ]]; then
#     # TODO: smartly rebuild link
#     ln_src=$(readlink "$src")
#     if [[ $ln_src == ../* ]]
#     ln -s && rm "$src"
#   else
#     mv "$src" "$dst"
#   fi
# }

process_camdir() {
  if [[ ! -d _raw ]]; then
    echo "Error: process_catdir should be called with the working directory already set, perhaps in a subshell. The working directory must contain a _raw directory where mp4 recordings appear." >&2
    return 1
  fi

  # extract date and camera/category information from path
  local ymd day ym cam=${PWD##*/}
  ymd=$(cd .. && basename "$PWD")
  cam=${cam%_vod}

  if [[ $ymd =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
    day=${ymd##*-}
    ym=${ymd%-*}
  elif [[ $ymd =~ ^[0-9]{2}$ ]]; then
    day=$ymd
    ym=$(cd ../.. && basename "$PWD")
  fi

  if [[ ! $ym/$day =~ ^[0-9]{4}-[0-9]{2}/[0-9]{2}$ ]]; then
    echo "Error: parent of working directory ($PWD) should be the date of the recordings (e.g. '$(date -Idate)')." >&2
    return 1
  fi

  local r2path=$ym/$day/$cam
  local videos=(_raw/*.mp4)

  # count used to limit scope when testing
  count=${count:-${#videos[@]}}
  local bn

  touch "$marker"

  for raw in "${videos[@]:0:$count}"; do
    [[ -f $raw ]] || continue

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
      mkassets "$bn" ||
      handle_error "$raw" "$bn"
  done

  # do this once per run instead of per file
  sync_camdir &&
    index_inventory &&
    rm "$marker"
}

handle_error() {
  local raw=$1 bn=$2
  mkdir -p "_error"
  if [[ -f $raw ]]; then
    mv -v "$raw" "_error"
  fi
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
  local camdir=${1:-.}
  echo "Syncing to r2:vod/$r2path" >&2

  $rclone copy -L \
    "$camdir" "r2:vod/$r2path" \
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

vod() {
  local camdir=$1

  cd "$camdir" || {
    echo "Error: couldn't enter $camdir" >&2
    exit 1
  }

  process_camdir
}

link_dir() {
  local refdir=${1%/}

  [[ -d $refdir ]] || {
    echo "Error: $refdir must be an existing directory." >&2
    return 1
  }

  local workdir
  workdir=$(dirname "$refdir")/${refdir}_vod
  mkdir -p "$workdir/_raw"

  # using absolute links instead for now
  # local link_base=../../$(basename "$refdir")
  local link_src

  for vid in "$refdir"/*.mp4; do
    [[ -f $vid ]] || continue
    # link_src=$link_base/$(basename "$vid")
    link_src=$(realpath "$vid")

    ln -sv "$link_src" "$workdir/_raw"
  done

  echo "$refdir linked to $workdir/_raw" >&2
  echo "run 'cd $workdir && $0 vod .'" >&2
}

usage() { cat; } <<EOF
  $0 [-n COUNT] vod|link DIR
EOF

if [[ $1 == '-n' ]]; then
  count=$2
  shift 2
fi

# vod is default command; enforce one directory argument regardless.
case "$1" in
vod)
  cmd=vod
  shift
  ;;
link)
  cmd=link_dir
  shift
  ;;
*)
  if [[ -d $1 && $# -eq 1 ]]; then
    cmd=vod
  else
    usage
    exit 1
  fi
  ;;
esac

if [[ $# -ne 1 ]]; then
  usage
  exit 1
fi

$cmd "$@"

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
