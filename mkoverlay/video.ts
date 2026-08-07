#!/usr/bin/env bun

import { dirname, join, resolve } from 'node:path'
import { indexInventory } from './lib/db'
import { type Metadata, pipeline } from './lib/util'

async function mkassets(path: string) {
  const metadata = await pipeline(path)
  const inventoryPath = join(dirname(path), 'inventory.json')

  const inventory: Metadata[] = await Bun.file(inventoryPath)
    .json()
    .catch((_err) => [])

  const filtered = inventory.filter(({ name }) => name !== metadata.name)

  const newInventory = [...filtered, metadata].sort((a, b) =>
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

  indexInventory(inventoryPath, `${yearMo}-${day}`)
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
