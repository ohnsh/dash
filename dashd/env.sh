# Source this file before running `docker compose`
# It's for containers running Alpine, since there's no mDNS resolver

mdns_resolve() {
  local host=$1
  avahi-resolve -4 -n "$host" | awk '{ print $2 }'
}

# set -a
WUUK_LOCAL_IP=$(mdns_resolve ing-wuuk.local)
WYZE1_LOCAL_IP=$(mdns_resolve ing-wyze-1.local)

# Export all vars for docker compose environment.
export WUUK_LOCAL_IP WYZE1_LOCAL_IP
# set +a
