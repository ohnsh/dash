#!/usr/bin/env bash

SCRIPT_DIR=$(dirname "$(realpath "${BASH_SOURCE[0]}")")
SCRIPT_NAME=$(basename "$0")

# wrappers ensure credentials from .env are available regardless of how or where the
# commands are invoked. Considering a single wrapper that uses $0 to detect what to exec
video_ts=$SCRIPT_DIR/videots_wrapper.sh
rclone=$SCRIPT_DIR/rclone_v.sh

marker=.video.sh_inprogress

HALF_HOUR=$((60 * 30))
ONE_MB=$((1024 * 1024))
MIN_MB=${MIN_MB:-3}

# Skip files smaller than 3 MB (configurable)
MIN_VID_SIZE=${MIN_VID_SIZE:-$((MIN_MB * ONE_MB))}

usage() { cat; } <<EOF
Usage: $SCRIPT_NAME <subcommand> DIR

Available Subcommands:
    vod     Remux fragmented mp4s, generate assets (thumbnails), and sync to R2.
    watch   Watch a directory where video files are saved, running \`$SCRIPT_NAME vod\`
            periodically.
    link    Link a directory of archived videos to a workspace with the folder structure
            expected by \`$SCRIPT_NAME vod\`.

Options:
    -h        Show this help message.

Environment:
    COUNT   Limit directory processing to first \$COUNT files (for testing).

EOF

log() {
  printf "[%s %s] %s\n" \
    "${SCRIPT_NAME:-$0}" \
    "$(date +"%m-%d %T")" \
    "$*" >&2
}

notify() {
  local msg=$1
  # be quiet
  curl -fsL -d "$msg" https://ntfy.sh/ohnsh-push &>/dev/null
}

log_notify() {
  local msg
  # if running interactively, log to terminal and don't notify
  if [[ -z $autopilot ]]; then
    log "$@"
  else
    msg=$(log "$@" 2>&1)
    echo "$msg" >&2
    notify "$msg"
  fi
}

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

get_size() {
  local mp4=$1
  [[ -f $mp4 ]] || return 1

  # stat is different on macOS
  # follow links!
  if [[ $OSTYPE == darwin* ]]; then
    stat -Lf %z "$mp4"
  else
    stat -Lc %s "$mp4"
  fi
}

validate_vid() {
  [[ $(get_size "$1") -ge "$MIN_VID_SIZE" ]]
}

maybe_remux() {
  local raw=$1
  local out=$2

  if is_fragmented "$raw"; then
    log "Remuxing $raw"
    # -xerror \
    ffmpeg \
      -v warning \
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
    log "Error: process_catdir should be called with the working directory already set, perhaps in a subshell. The working directory must contain a _raw directory where mp4 recordings appear."
    return 1
  fi

  # extract date and camera/category information from path
  local ymd day ym cam=${PWD##*/}
  ymd=$(cd .. && basename "$PWD")
  # the _vod suffix is added by `link` subcommand
  cam=${cam%_vod}
  # controversially remove leading underscore
  cam=${cam#_}

  if [[ $ymd =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
    day=${ymd##*-}
    ym=${ymd%-*}
  elif [[ $ymd =~ ^[0-9]{2}$ ]]; then
    day=$ymd
    ym=$(cd ../.. && basename "$PWD")
  fi

  if [[ ! $ym/$day =~ ^[0-9]{4}-[0-9]{2}/[0-9]{2}$ ]]; then
    log "Error: parent of working directory ($PWD) should be the date of the recordings (e.g. '$(date -Idate)')."
    return 1
  fi

  local r2path=$ym/$day/$cam
  local videos=(_raw/*.mp4)

  # count used to limit scope when testing
  local count=${COUNT:-${#videos[@]}}
  local bn

  touch "$marker"

  for raw in "${videos[@]:0:$count}"; do
    [[ -f $raw ]] || continue

    if lsof_t "$raw" &>/dev/null; then
      log "$raw currently open; skipping."
      continue
    fi

    bn=$(basename "$raw")

    if [[ -f $bn ]]; then
      log "Error: $bn already exists"
      toss "$raw" dup
      continue
    fi

    if ! validate_vid "$raw"; then
      log_notify "Invalid recording $raw: smaller than MIN_VID_SIZE. Tossing aside."
      toss "$raw" size
      continue
    fi

    if ! {
      maybe_remux "$raw" "$bn" &&
        [[ -f "$bn" ]] &&
        [[ ! -f "$raw" ]]
    }; then
      log_notify "Error processing $raw: remux or move failed. Tossing aside."
      toss "$raw" remux
      continue
    fi

    if ! mkassets "$bn"; then
      log_notify "Error creating assets for $bn... Continuing."
      toss "$bn" assets
    fi
  done

  # do this once per run instead of per file
  # index_inventory is ignored by the db after the first insert
  sync_camdir &&
    maybe_index_inventory &&
    rm "$marker"
}

toss() {
  local file=$1 error=$2
  mkdir -p "_error_$error"
  if [[ -f $file ]]; then
    mv -v "$file" "_error_$error"
  fi
}

indexed=
maybe_index_inventory() {
  [[ -z $indexed ]] || {
    log "Inventory already indexed; skipping..."
    return 0
  }

  local r2inv=$r2path/inventory.json

  log "Indexing $r2inv"
  # only update index if we actually have an inventory file
  if [[ -f ./inventory.json ]]; then
    "$video_ts" index "$r2inv" && indexed=1
  fi
}

sync_camdir() {
  local camdir=${1:-.}
  log "Syncing to r2:vod/$r2path"

  $rclone copy -L \
    "$camdir" "r2:vod/$r2path" \
    --exclude ".*" \
    --exclude ".*/**" \
    --exclude "_raw/**" \
    --exclude "_error/**" \
    --exclude "_error/**"
}

# could limit env loading to subshell
# rclone() {
#   command rclone "$@"
# }

mkassets() {
  local video=$1
  mkdir -p "_assets/$video"

  log "Creating assets for $video"

  "$video_ts" mkassets "$video"
}

vod() {
  local camdir=$1

  cd "$camdir" || exit 1
  process_camdir
}

watch() {
  local autopilot=1
  local camdir=$1
  local status

  cd "$camdir" || exit 1

  while true; do
    if ! process_camdir; then
      status=$?
      # Since this will run all day, hit a webhook so I get notified.
      log_notify "Error exit status from process_camdir...canceling watch."
      # Would be interesting to look into process management options.
      # For now, it's no big deal if I need to babysit the script a bit.
      return $status
    fi
    # For now, prioritize simplicity and portability.
    # FS watching will differ between macOS, Alpine, and Debian.
    # (Video lengths are typically 15-20 min.)
    echo >&2
    log "Sleeping 30 min..."
    sleep $HALF_HOUR
  done
}

reset() {
  local camdir=$1
  local -a aborted
  cd "$camdir" || exit 1

  # list lines not in common
  readarray -t aborted < <(
    cat \
      <(jq -r '.[] | .name' <inventory.json) \
      <(printf '%s\n' *.mp4) |
      sort | uniq -u
  )

  for mp4 in "${aborted[@]}"; do
    toss "$mp4" asset
  done
}

link_dir() {
  local refdir=${1%/}

  [[ -d $refdir ]] || {
    log "Error: $refdir must be an existing directory."
    return 1
  }

  local workdir
  workdir=$(dirname "$refdir")/$(basename "$refdir")_vod
  mkdir -p "$workdir/_raw"

  # local link_base=../../$(basename "$refdir")
  # local link_src=$link_base/$(basename "$vid")
  # using absolute links instead for now
  local link_src

  for vid in "$refdir"/*.mp4; do
    [[ -f $vid ]] || continue
    link_src=$(realpath "$vid")

    ln -sv "$link_src" "$workdir/_raw"
  done

  log "$refdir linked to $workdir/_raw"
  log "run 'cd $workdir && $0 vod .'"
}

if [[ $1 == '-h' ]]; then
  usage
  exit 0
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
watch)
  cmd=watch
  shift
  ;;
reset)
  cmd=reset
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
