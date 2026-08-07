#!/usr/bin/env bun

import fs from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import {
  getMetadata,
  getVideoType,
  isVideoFile,
  type MetadataBase,
  mkthumb,
} from './util'

const PREFIX = '/Volumes/Media'
const isHlsDir = (name: string) => /\.hls$/i.test(name)

interface MetadataDerived<T extends MetadataBase['type']> extends MetadataBase {
  key: string
  tree: string
  type: T
}
interface MetadataHLS extends MetadataDerived<'hls'> {
  playlist: string
}
type Metadata = MetadataHLS | MetadataDerived<'mp4' | 'mov'>
type Inventory = Metadata & { assets: string[] }

const composePath = ({ key, tree }: { key: string; tree: string }) =>
  `${PREFIX}/${tree}/${key}`

const decomposePath = (path: string) => {
  path = resolve(path)
  if (!path.startsWith(PREFIX)) {
    throw new Error(
      `Invalid path '${path}'. Must resolve to a location under ${PREFIX}`,
    )
  }
  path = path.slice(PREFIX.length + 1)
  const [tree = '', ...keySegments] = path.split('/')
  return { tree, key: keySegments.join('/') }
}

export async function getOverlayMetadata(
  dir: string,
): Promise<Record<string, Metadata>> {
  // This might be recursive at some point. Keeping it simple for now.
  const listing = await fs
    .readdir(dir, { withFileTypes: true })
    .then((list) =>
      list.filter((entry) =>
        entry.isDirectory() ? isHlsDir(entry.name) : isVideoFile(entry.name),
      ),
    )

  const getEntry = async (
    type: string | undefined,
    path: string,
  ): Promise<[string, Metadata]> => {
    const { key, tree } = decomposePath(path)
    const metadata = await getMetadata(path)
    if (type === 'hls') {
      const playlist = await getHlsPlaylist(path)
      return [
        key,
        {
          key,
          tree,
          playlist,
          ...metadata,
          type,
        },
      ]
    } else if (type === 'mp4' || type === 'mov') {
      return [
        key,
        {
          key,
          tree,
          ...metadata,
          type,
        },
      ]
    } else {
      throw new Error(`Invalid type ${type} detected for path ${path}`)
    }
  }

  return Object.fromEntries(
    await Promise.all(
      listing.map(async (entry) => {
        const path = join(entry.parentPath, entry.name)
        const type = getVideoType(entry.name)
        return getEntry(type, path)
      }),
    ),
  )
}

async function getHlsPlaylist(basePath: string) {
  const glob = new Bun.Glob('**/*.m3u8')
  const firstMatch = await glob.scan(basePath).next()
  if (firstMatch.done) {
    throw new Error(`No playlist file under ${basePath}`)
  }
  return firstMatch.value
}

async function mkassets(metadata: Record<string, Metadata>) {
  // forEach won't really work without spawning dozens of concurrent ffmpeg processes.
  const entries = Object.entries(metadata)
  const count = entries.length
  for (const [
    i,
    [key, { tree, playlist, meta_ffprobe }],
  ] of entries.entries()) {
    const path = composePath({ key, tree })
    const mediaPath = playlist ? join(path, playlist) : path
    console.log(`Processing ${mediaPath} [${i + 1} of ${count}]`)
    await mkthumb(mediaPath, {
      outDir: getAssetDir(key),
      metadata: meta_ffprobe,
    })
  }
}

// Each content directory in the overlay tree contains an `_assets` subdirectory with
// directories named after each video. Right now they only contain a single thumbnail, but
// that will likely change.
// const stem = baseName.replace(/\.[^.]+$/, '')
const getAssetDir = (key: string) => {
  const baseDir = dirname(composePath({ key, tree: 'overlay' }))
  return join(baseDir, '_assets', basename(key))
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error
}

async function mkinventory(metadata: Record<string, Metadata>) {
  // avoid mutating caller's `metadata`; gradually construct a new object instead.
  const inventory: Record<string, Inventory> = {}

  for (const [key, value] of Object.entries(metadata)) {
    let assets: string[]
    try {
      const assetDir = getAssetDir(key)
      const listing = await fs.readdir(assetDir)
      // listing is an array of absolute paths. since this will be an R2 bucket in
      // production, remove prefix.
      assets = listing.map((name) => {
        const path = join(assetDir, name)
        const { key } = decomposePath(path)
        return key
      })
    } catch (err) {
      if (isNodeError(err) && err.code === 'ENOENT') {
        assets = []
      } else {
        throw err
      }
    }
    inventory[key] = { assets, ...value }
  }

  return inventory
}

async function getDirs(inDir: string) {
  inDir = await fs.realpath(inDir)
  let suffix: string

  if (inDir.startsWith(`${PREFIX}/days/`)) {
    suffix = inDir.slice(`${PREFIX}/days/`.length)
  } else if (inDir.startsWith(`${PREFIX}/overlay/`)) {
    suffix = inDir.slice(`${PREFIX}/overlay/`.length)
  } else {
    throw new Error(`Argument must be a path under ${PREFIX}`)
  }

  return {
    daysDir: `${PREFIX}/days/${suffix}`,
    ovDir: `${PREFIX}/overlay/${suffix}`,
  }
}

async function ensureExists(...dirs: string[]) {
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true })
  }
}

const [, , inDir] = Bun.argv
if (!inDir) {
  throw new Error()
}

async function mkoverlay(...dirs: string[]) {
  // watch out for subtle bugs that might result from concurrent async operations
  // I can't see any at the moment
  const metas = await Promise.all(dirs.map(getOverlayMetadata))
  await Promise.all(metas.map(mkassets))
  return await Promise.all(metas.map(mkinventory))
}

const { daysDir, ovDir } = await getDirs(inDir)
await ensureExists(daysDir, ovDir)

const [daysInventory, ovInventory] = await mkoverlay(daysDir, ovDir)
// const daysMeta = await getOverlayMetadata(daysDir)
// const ovMeta = await getOverlayMetadata(ovDir)
// await mkassets(daysMeta)
// await mkassets(ovMeta)
// const daysInventory = await mkinventory(daysMeta)
// const ovInventory = await mkinventory(ovMeta)
const inventory = { ...daysInventory, ...ovInventory }

Bun.write(`${ovDir}/inventory.json`, JSON.stringify(inventory, undefined, 2))
