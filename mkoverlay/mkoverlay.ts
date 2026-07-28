#!/usr/bin/env bun

import fs from 'node:fs/promises'
import { basename, join } from 'node:path'
import { $ } from 'bun'
import exiftool from './exiftool'
import ffprobe from './ffprobe'

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
      const meta_exiftool = await exiftool(path)
      const meta_ffprobe = await ffprobe(path)
      return { name: entry.name, meta_exiftool, meta_ffprobe }
    }),
  )

  Bun.write(`${outDir}/inventory.json`, JSON.stringify(metadata, undefined, 2))

  let i = 0
  for (const entry of listing) {
    i++
    const path = join(entry.parentPath, entry.name)
    console.log(`Processing ${path} [${i} of ${listing.length}]`)
    await mkThumb(path, outDir)
    // $`${import.meta.dir}/mkassets.sh ${path} ${outDir}`
  }
}

async function mkThumb(
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

  const baseName = basename(video)
  // const stem = baseName.replace(/\.[^.]+$/, '')

  // The overlay tree consists of directories named after each video. Right now they just
  // contain a single thumbnail, but that will likely change.
  const trueOutDir = join(outDir, `${baseName}+meta`)
  const outPath = join(trueOutDir, `thumb.webp`)

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
