#!/usr/bin/env bun

import { dirname, join } from 'node:path'
import { db } from './db'
import { inventoriesTable } from './db/schema'
import { type VODVideo, vodVideoSchema } from './lib/schema'
import { newContext, toMetadata } from './lib/vod-video'

function log(msg: string) {
  const stamp = new Date()
    .toLocaleString('en-CA', {
      dateStyle: 'short',
      timeStyle: 'medium',
      hour12: false,
    })
    .replace(/^\d{4}-/, '')
    .replace(',', '')
  console.log(`[video.ts ${stamp}] ${msg}`)
}

async function mkassets(path: string) {
  const ctx = await newContext(path)
  const metadata = await toMetadata(ctx)

  const inventoryPath = join(dirname(path), 'inventory.json')

  let inventory: VODVideo[] = []

  if (await Bun.file(inventoryPath).exists()) {
    // intentionally don't catch errors when the file exists to avoid data loss
    inventory = await Bun.file(inventoryPath)
      .json()
      .then((raw) => raw.map(vodVideoSchema.parse))
      .then((all: VODVideo[]) =>
        all.filter(({ name }) => name !== metadata.name),
      )
  }

  const newInventory = [...inventory, metadata].sort((a, b) =>
    a.name.localeCompare(b.name),
  )

  Bun.write(inventoryPath, JSON.stringify(newInventory, undefined, 2))
}

async function index(inventoryPath: string) {
  const [yearMo, day] = inventoryPath.split('/')

  if (
    !yearMo ||
    !/^\d{4}-\d{2}$/.test(yearMo) ||
    !day ||
    !/^\d{2}$/.test(day)
  ) {
    throw new Error(`Couldn't derive date from path ${inventoryPath}`)
  }

  const json: VODVideo[] = await Bun.file('inventory.json')
    .json()
    .then((raw) => raw.map(vodVideoSchema.parse))

  const speechTotal = json.reduce((sum, current) => {
    if (!current.voiceSegments) return sum
    const { speechTotal, duration, speechRatio } = current.voiceSegments
    return sum + (speechTotal ?? Math.round(duration * speechRatio))
  }, 0)

  log(`Indexing ${inventoryPath} with ${speechTotal}s of speech.`)
  await db
    .insert(inventoriesTable)
    .values({
      inventoryPath,
      date: `${yearMo}-${day}`,
      speechTotal,
    })
    .onConflictDoUpdate({
      target: inventoriesTable.inventoryPath,
      set: { speechTotal },
    })
}

const [, , cmd, arg] = Bun.argv

if ((cmd !== 'mkassets' && cmd !== 'index') || !arg) {
  console.error(`Usage:
    ${import.meta.file} mkassets <video-path>
    ${import.meta.file} index <inventory-path>`)

  throw new Error('Incorrect usage')
}

if (cmd === 'mkassets') {
  await mkassets(arg)
} else {
  await index(arg)
}
