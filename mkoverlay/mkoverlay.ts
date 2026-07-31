#!/usr/bin/env bun

import type { Dirent } from 'node:fs'
import fs from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { $ } from 'bun'
import exiftool from './exiftool'
import ffprobe from './ffprobe'

const PREFIX = '/Volumes/Media'

const isVideoFile = (name: string) => /\.(mov|mp4)$/i.test(name)
const isHlsDir = (name: string) => /\.hls$/i.test(name)

interface Metadata {
  key: string
  tree: string
  meta_exiftool: Awaited<ReturnType<typeof exiftool>>
  meta_ffprobe: Awaited<ReturnType<typeof ffprobe>>
}

interface Inventory extends Metadata {
  assets?: string[]
}

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

export async function getMetadata(
  dir: string,
): Promise<Record<string, Metadata>> {
  // This might be recursive at some point. Keeping it simple for now.
  let listing: Dirent<string>[] | undefined
  try {
    listing = await fs
      .readdir(dir, { withFileTypes: true })
      .then((list) =>
        list.filter((entry) =>
          entry.isDirectory() ? isHlsDir(entry.name) : isVideoFile(entry.name),
        ),
      )
  } catch (err) {
    if (isNodeError(err) && err.code === 'ENOENT') {
      listing = undefined
    } else {
      throw err
    }
  }

  if (!listing) {
    return {}
  }

  return Object.fromEntries(
    await Promise.all(
      listing.map<Promise<[string, Metadata]>>(async (entry) => {
        // what's that they say about naming variables?
        const _path = join(entry.parentPath, entry.name)
        const path = isHlsDir(_path) ? await getHlsPlaylist(_path) : _path
        const { key, tree } = decomposePath(path)

        const meta_exiftool = await exiftool(path)
        const meta_ffprobe = await ffprobe(path)
        return [key, { key, tree, meta_exiftool, meta_ffprobe }]
      }),
    ),
  )
}

async function getHlsPlaylist(basePath: string) {
  const firstMatch = await fs.glob('*.m3u8', { cwd: basePath }).next()
  if (firstMatch.done) {
    throw new Error(`No paylist file under ${basePath}`)
  }
  return firstMatch.value
}

async function mkassets(metadata: Record<string, Metadata>) {
  // forEach won't really work without spawning dozens of concurrent ffmpeg processes.
  // And traditional `for (let i = 0; i < length; i++)` requires non-null assertion in body.
  // ...so here we are
  let i = 0
  const entries = Object.entries(metadata)
  const count = entries.length
  for (const [key, { tree }] of entries) {
    i++
    const path = composePath({ key, tree })
    console.log(`Processing ${path} [${i} of ${count}]`)
    await mkthumb(path, getAssetDir(key))
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
    try {
      const assetDir = getAssetDir(key)
      const listing = await fs.readdir(assetDir)
      // listing is an array of absolute paths. since this will be an R2 bucket in
      // production, remove prefix.
      const assets = listing.map((name) => {
        const path = join(assetDir, name)
        const { key, tree } = decomposePath(path)
        return key
      })
      inventory[key] = { assets, ...value }
    } catch (err) {
      if (isNodeError(err) && err.code === 'ENOENT') {
        inventory[key] = value
      } else {
        throw err
      }
    }
  }

  return inventory
}

async function mkthumb(
  video: string,
  outDir: string,
  metadata?: Awaited<ReturnType<typeof ffprobe>>,
) {
  if (!metadata) {
    metadata = await ffprobe(video)
  }

  // An ffmpeg filter for HDR videos, to get reasonable colors out when
  // extracting thumbnails. It doesn't mean a thing to me.
  const VF_HDR =
    'zscale=t=linear:npl=100,' +
    'format=gbrpf32le,' +
    'zscale=p=bt709,' +
    'tonemap=tonemap=hable:desat=0,' +
    'zscale=t=bt709:m=bt709:r=tv,' +
    'format=yuv420p'

  const { isHDR, isPortrait } = metadata

  // A nifty syntax for the ffmpeg `scale` filter. -1 means "maintain aspect ratio" and -2
  // means "also make it an even number," which some codecs actually require.
  const vf_scale = isPortrait ? 'scale=-2:1280' : 'scale=1280:-2'

  // The `thumbnail` filter samples 100 frames and selects the one it considers 'best',
  // based on the histogram I believe.
  const vf = `${isHDR ? `${VF_HDR},` : ''}thumbnail,${vf_scale}`
  const outPath = join(outDir, `thumb.webp`)

  await $`mkdir -p ${outDir}`
  await $`ffmpeg -v error -i ${video} -vf ${vf} -c:v libwebp -frames:v 1 -y ${outPath}`
}

async function getDirs(inDir: string) {
  inDir = await fs.realpath(inDir)
  let suffix: string

  if (inDir.startsWith(`${PREFIX}/days/`)) {
    suffix = inDir.slice(`${PREFIX}/days/`.length)
  } else if (inDir.startsWith(`${PREFIX}`)) {
    suffix = inDir.slice(`${PREFIX}/overlay/`.length)
  } else {
    throw new Error(`Argument must be a path under ${PREFIX}`)
  }

  return {
    daysDir: `${PREFIX}/days/${suffix}`,
    ovDir: `${PREFIX}/overlay/${suffix}`,
  }
}

const [, , inDir] = Bun.argv
if (!inDir) {
  throw new Error()
}

const { daysDir, ovDir } = await getDirs(inDir)

const daysMeta = await getMetadata(daysDir)
const ovMeta = await getMetadata(ovDir)
await mkassets(daysMeta)
await mkassets(ovMeta)
const daysInventory = await mkinventory(daysMeta)
const ovInventory = await mkinventory(ovMeta)
const inventory = { ...daysInventory, ...ovInventory }

Bun.write(`${ovDir}/inventory.json`, JSON.stringify(inventory, undefined, 2))
