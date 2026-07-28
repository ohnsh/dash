#!/usr/bin/env bun

import fs from 'node:fs/promises'
import { basename, join } from 'node:path'
import { $ } from 'bun'
import { type FFprobeMetadata, ffprobeSchema, wrangleOutput } from './schema'

const DAYS_PREFIX = '/Volumes/Media/days'
const OVERLAY_PREFIX = '/Volumes/Media/overlay'
const isVideoExt = (name: string) => /\.(mov|mp4)$/i.test(name)

export async function mkassets(inDir: string, outDir: string) {
  const listing = await fs
    .readdir(inDir, { withFileTypes: true })
    .then((list) =>
      list.filter((entry) => !entry.isDirectory() && isVideoExt(entry.name)),
    )

  const metadata = await Promise.all(
    listing.map(async (entry) => {
      const path = join(entry.parentPath, entry.name)
      // exiftool returns an array of length 1 on a single file
      const meta_exiftool = await $`${import.meta.dir}/meta.sh ${path}`
        .json()
        .then(wrangleOutput)
      const meta_ffprobe = await probe(path)
      return { name: entry.name, meta_exiftool, meta_ffprobe }
    }),
  )

  Bun.write(`${outDir}/inventory.json`, JSON.stringify(metadata, undefined, 2))

  for (const entry of listing) {
    const path = join(entry.parentPath, entry.name)
    await mkThumb(path, outDir)
    // $`${import.meta.dir}/mkassets.sh ${path} ${outDir}`
  }
}

async function probe(video: string): Promise<FFprobeMetadata> {
  const SIDE_DATA = 'stream_side_data=rotation'
  const STREAM_DATA =
    'stream=width,height,nb_frames,duration,color_space,color_transfer,color_primaries'
  const ENTRIES = `${STREAM_DATA}:${SIDE_DATA}`

  const result = await $`
  ffprobe -v error \
    -select_streams v:0 \
    -show_entries ${ENTRIES} \
    -of json \
    ${video}`
    .json()
    .then((out) => ffprobeSchema.parse(out))

  const [meta_ffprobe] = result.streams
  if (!meta_ffprobe) {
    throw new Error('ffprobe did not produce stream metadata')
  }

  const { rotation = 0, width, height, color_transfer = 'bt709' } = meta_ffprobe
  const isRotated = rotation !== 0
  const isNominallyPortrait = width < height
  const isPortrait = isNominallyPortrait !== isRotated
  const isHDR = ['arib-std-b67', 'smpte2084'].includes(color_transfer)

  return { ...meta_ffprobe, isPortrait, isHDR }
}

async function mkThumb(
  video: string,
  outDir: string,
  metadata?: FFprobeMetadata,
) {
  if (!metadata) {
    metadata = await probe(video)
  }

  const VF_HDR =
    'zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p'

  const { isHDR, isPortrait } = metadata
  const vf_scale = isPortrait ? 'scale=-2:1280' : 'scale=1280:-2'
  const vf = `${isHDR ? `${VF_HDR},` : ''}thumbnail,${vf_scale}`

  const baseName = basename(video)
  const stem = baseName.replace(/\.[^.]+$/, '')

  const trueOutDir = join(outDir, `${baseName}+meta`)
  const outPath = join(trueOutDir, `${stem}.webp`)

  await $`mkdir -p ${trueOutDir}`
  await $`ffmpeg -v error -i ${video} -vf ${vf} -c:v libwebp -frames:v 1 -y ${outPath}`
}

async function getOverlayDir(daysDir: string) {
  const realpath = await fs.realpath(daysDir)
  if (!realpath.startsWith(DAYS_PREFIX)) {
    throw new Error(
      `When only one argument is supplied, it must be a path under ${DAYS_PREFIX}`,
    )
  }
  return realpath.replace(DAYS_PREFIX, OVERLAY_PREFIX)
}

const [, , inDir, outDir] = Bun.argv
if (!inDir) {
  throw new Error()
}

if (!outDir) {
  await mkassets(inDir, await getOverlayDir(inDir))
} else {
  await mkassets(inDir, outDir)
}
