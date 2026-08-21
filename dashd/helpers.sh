#!/usr/bin/env bash

# https://github.com/mpatfield/homebridge-dummy/wiki/Webhooks
trigger_switch() {
  . .env
  curl "http://r314.local:63743/?id=${DUMMY_SWITCH_ID}&set=ProgrammableSwitchEvent&value=0"
}
