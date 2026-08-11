#!/usr/bin/env bash

script_dir=$(dirname "$(realpath "${BASH_SOURCE[0]}")")

exec bun --env-file "$script_dir/.env" "$script_dir/video.ts" "$@"
