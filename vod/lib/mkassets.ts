import { join } from 'node:path'
import { $ } from 'bun'
import ffprobe from './ffprobe'

interface MkThumbOpts {
  outDir: string
  metadata?: { isHDR: boolean; isPortrait: boolean }
  name?: string
}

export async function mkthumb(
  path: string,
  { outDir, name = 'thumb.webp', metadata }: MkThumbOpts,
) {
  const outPath = join(outDir, name)

  if (await Bun.file(outPath).exists()) {
    console.log(`Skipping thumbnail generation; file exists: ${outPath}`)
    return outPath
  }

  metadata ??= await ffprobe(path)

  const { isHDR, isPortrait } = metadata

  // An ffmpeg filter for HDR videos, to get reasonable colors out when
  // extracting thumbnails. It doesn't mean a thing to me.
  const VF_HDR =
    'zscale=t=linear:npl=100,' +
    'format=gbrpf32le,' +
    'zscale=p=bt709,' +
    'tonemap=tonemap=hable:desat=0,' +
    'zscale=t=bt709:m=bt709:r=tv,' +
    'format=yuv420p'

  // A nifty syntax for the ffmpeg `scale` filter. -1 means "maintain aspect ratio" and -2
  // means "also make it an even number," which some codecs actually require.
  const vf_scale = isPortrait ? 'scale=-2:1280' : 'scale=1280:-2'

  // The `thumbnail` filter samples 100 frames and selects the one it considers 'best',
  // based on the histogram I believe.
  const vf = `${isHDR ? `${VF_HDR},` : ''}thumbnail,${vf_scale}`

  await $`mkdir -p ${outDir}`
  await $`ffmpeg -v error -i ${path} -vf ${vf} -c:v libwebp -frames:v 1 -y ${outPath}`
  return outPath
}
