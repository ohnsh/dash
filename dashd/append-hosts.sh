#!/usr/bin/env bash

hosts=(
  ing-wuuk.local
  ing-wyze-1.local
  box.local
)

for host in "${hosts[@]}"; do
  avahi-resolve -4 -n "$host"
done |
  while read -r name addr; do
    printf "%s\t%s\n" "$addr" "$name"
  done | doas tee -a /etc/hosts
