#!/usr/bin/env bash

OV_PREFIX=/Volumes/Media/overlay
DAYS_PREFIX=/Volumes/Media/days

rclone_sec() {
  # RCLONE_CONFIG_PASS
  RCLONE_PASSWORD_COMMAND="passage rclone/config" \
    rclone --config="$HOME/.config/rclone/rclone-sec.conf" \
    "$@"
}

mkroot() {
  find "$OV_PREFIX" -name inventory.json | sed "s|^$OV_PREFIX||" >"$OV_PREFIX/root.txt"
}

show() {
  cat "$OV_PREFIX/root.txt"
}

# sync overlay material (generated files) to R2
sync_ov() {
  rclone_sec sync -P "$OV_PREFIX" r2:vod
}

# sync original media to R2
sync() {
  local rp
  rp=$(realpath "$1")

  if [[ $rp != "$DAYS_PREFIX"* ]]; then
    echo "Argument must be a path under days tree" >&2
    return 1
  fi

  local vpath=${1#"$DAYS_PREFIX"}
  # if we sync, we'll invariably lose the overlay material. The original vision was for
  # overlay (generated files) and original media to be separate buckets. That may be the
  # way to go.
  rclone_sec copy -P "$rp" "r2:vod${vpath}"
}

if [[ $# -eq 0 ]]; then
  mkroot
  exit
fi

cmd=${1//-/_}
shift
case "$cmd" in
mkroot | sync | sync_ov | show)
  $cmd "$@"
  ;;
*)
  echo "Invalid subcommand: $cmd" >&2
  exit 1
  ;;
esac
