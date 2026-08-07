#!/usr/bin/env bun

import { dirname, join } from 'node:path'
import { type Metadata, pipeline } from './util'

async function main(path: string) {
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

const [, , arg] = Bun.argv

if (!arg) {
  throw new Error(`Usage: ${import.meta.file} <path>`)
}

await main(arg)
