#!/usr/bin/env bash

# https://github.com/mpatfield/homebridge-dummy/wiki/Webhooks
trigger_switch() {
  . .env
  curl "http://r314.local:63743/?id=${HB_DUMMY_SWITCH_ID}&set=ProgrammableSwitchEvent&value=0"
}

last10() {
  local db=${1:-data/sensor-data.db}
  sqlite3 "$db" <<EOF
    SELECT l.name as location, r.timestamp, r.temp_c, r.humidity_rel
    FROM readings r
    JOIN locations l ON r.location_id = l.id
    ORDER BY timestamp DESC
    LIMIT 10;
EOF
}

usage() {
  cat <<EOF
Subcommands:
  trigger-switch
  last10
EOF
}

if [[ ${BASH_SOURCE[0]} == "$0" ]]; then
  cmd=${1//-/_}
  shift
  case "$cmd" in
  trigger_switch | last10)
    $cmd "$@"
    ;;
  *)
    usage >&2
    exit 1
    ;;
  esac
fi

last10_old() {
  local db=${1:-data/sensor-data.db}
  sqlite3 "$db" <<EOF
    SELECT l.location_name as location, r.timestamp, r.temp_c, r.humidity_rel
    FROM readings r
    JOIN locations l ON r.location_id = l.location_id
    ORDER BY timestamp DESC
    LIMIT 10;
EOF
}
