#!/usr/bin/env bash

ONE_MB=$((1024 * 1024))
MIN_MB=${MIN_MB:-2}
MIN_VID_SIZE=${MIN_VID_SIZE:-$((MIN_MB * ONE_MB))}

get_size() {
  local mp4=$1
  [[ -f $mp4 ]] || return 1

  # stat is different on macOS
  if [[ $OSTYPE == darwin* ]]; then
    stat -f %z "$mp4"
  else
    stat -c %s "$mp4"
  fi
}

# clean up aborted recordings and re-sync inventory.json
# should be obsolete now that video.sh checks before processing
clean() {
  local dir=$1 sz bn

  [[ -d $dir ]] || {
    echo "Error: $dir is not a directory." >&2
    exit 1
  }

  local inv=$dir/inventory.json
  cp "$inv" "$inv.bak"

  for mp4 in "$dir"/*.mp4; do
    sz=$(get_size "$mp4")
    [[ $sz -ge "$MIN_VID_SIZE" ]] && continue

    mkdir -p "$dir/_error"
    mv -v "$mp4" "$dir/_error"

    [[ -f $inv ]] || continue

    bn=$(basename "$mp4")
    jq "map(select(.name != \"$bn\"))" <"$inv" >"$inv.tmp"
    [[ -s "$inv.tmp" ]] && mv "$inv.tmp" "$inv"
  done
}

cmd=$1
shift

case "$cmd" in
clean)
  clean "$@"
  ;;
*)
  echo "Invalid subcommand $cmd" >&2
  exit 1
  ;;
esac
