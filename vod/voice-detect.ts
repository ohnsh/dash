#!/usr/bin/env bun

import voiceDetect from '@dash/voice-detect'

const mediaPath = Bun.argv[2]
if (!mediaPath) {
  throw new Error(`Usage: ${import.meta.file} FILE`)
}

const result = await voiceDetect(mediaPath)

Bun.stdout.write(JSON.stringify(result))
