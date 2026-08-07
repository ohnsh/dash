// code that isn't coupled to the days and overlay tree structure
import fs from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { $ } from 'bun'
import exiftool, { type ExiftoolMetadata } from './exiftool'
import ffprobe, { type FFprobeMetadata } from './ffprobe'

export interface MetadataBase {
  type: 'mp4' | 'mov' | 'hls'
  meta_exiftool: ExiftoolMetadata
  meta_ffprobe: FFprobeMetadata
}

export interface Metadata extends MetadataBase {
  name: string
  assets: string[]
}

export const isVideoFile = (name: string) => /\.(mov|mp4)$/i.test(name)
export const getVideoType = (name: string): Metadata['type'] => {
  const type = name.match(/\.([^.]+)$/)?.[1]
  switch (type) {
    case 'hls':
    case 'mp4':
    case 'mov':
      return type
  }
  throw new Error(`Invalid video type ${type}`)
}

export async function getMetadata(path: string) {
  if (!isVideoFile(path)) {
    throw new Error(`Invalid video file: ${path}`)
  }

  if (!(await Bun.file(path).exists())) {
    throw new Error(`Video file doesn't exist: ${path}`)
  }

  const name = basename(path)
  const type = getVideoType(path)
  const meta_exiftool = await exiftool(path)
  const meta_ffprobe = await ffprobe(path)

  return { name, type, meta_exiftool, meta_ffprobe }
}

interface MkThumbOpts {
  outDir?: string
  name?: string
  metadata?: { isHDR: boolean; isPortrait: boolean }
}

export async function mkthumb(
  video: string,
  { outDir = dirname(video), name = 'thumb.webp', metadata }: MkThumbOpts,
) {
  const outPath = join(outDir, name)

  if (await Bun.file(outPath).exists()) {
    console.log(`Skipping thumbnail generation; file exists: ${outPath}`)
    return
  }

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

  await $`mkdir -p ${outDir}`
  await $`ffmpeg -v error -i ${video} -vf ${vf} -c:v libwebp -frames:v 1 -y ${outPath}`
}

const getAssetDir = (path: string) =>
  join(dirname(path), '_assets', basename(path))

export async function pipeline(path: string): Promise<Metadata> {
  const metadata = await getMetadata(path)
  const assetDir = getAssetDir(path)

  await $`mkdir -p ${assetDir}`
  await mkthumb(path, { outDir: assetDir, metadata: metadata.meta_ffprobe })

  const assets = await fs
    .readdir(assetDir)
    .then((list) => list.map((name) => join(assetDir, name)))
    .catch((_e) => [] as string[])

  return { ...metadata, assets }
}
