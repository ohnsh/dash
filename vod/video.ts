#!/usr/bin/env bun

import { dirname, join } from 'node:path'
import { db } from './db'
import { inventoriesTable } from './db/schema'
import { type Metadata, newContext, toMetadata } from './lib/vod-video'

async function mkassets(path: string) {
  const ctx = await newContext(path)
  const metadata = await toMetadata(ctx)

  const inventoryPath = join(dirname(path), 'inventory.json')

  let inventory: Metadata[] = []

  if (await Bun.file(inventoryPath).exists()) {
    // intentionally don't catch errors when the file exists to avoid data loss
    inventory = await Bun.file(inventoryPath)
      .json()
      .then((raw: Metadata[]) =>
        raw.filter(({ name }) => name !== metadata.name),
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

  const json: Metadata[] = await Bun.file('inventory.json').json()

  const speechTotal = json.reduce((sum, current) => {
    if (!current.voiceSegments) return sum
    const { speechTotal, duration, speechRatio } = current.voiceSegments
    return sum + (speechTotal ?? Math.round(duration * speechRatio))
  }, 0)

  db.insert(inventoriesTable).values({
    inventoryPath,
    date: `${yearMo}-${day}`,
    speechTotal,
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
