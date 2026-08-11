#!/usr/bin/env bash

script_dir=$(dirname "$(realpath "${BASH_SOURCE[0]}")")

# rclone credentials
set -a
. "$script_dir/.env"
set +a

exec rclone "$@"
