import { $ } from 'bun'
import { z } from 'zod'
import type { FFprobeStream } from './schema'

// define the metadata we're probing
const STREAM_ENTRIES = [
  'width',
  'height',
  'nb_frames',
  'duration',
  'r_frame_rate',
  'bit_rate',
  'pix_fmt',
  'color_space',
  'color_transfer',
  'color_primaries',
]

const STREAM_SIDE_ENTRIES = ['rotation']

const ENTRIES = `stream=${STREAM_ENTRIES.join(',')}:stream_side_data=${STREAM_SIDE_ENTRIES.join(',')}`

// command output, given the argument above
const ffprobeOutputSchema = z.object({
  streams: z.array(
    z.object({
      width: z.coerce.number(),
      height: z.coerce.number(),
      rotation: z.coerce.number().default(0),
      duration: z.coerce.number().optional(),
      nb_frames: z.coerce.number().optional(),
      r_frame_rate: z.preprocess((val) => {
        if (typeof val !== 'string') return val
        const [numer, denom] = val.split('/')
        if (!numer) return val
        const result = parseInt(numer, 10) / (denom ? parseInt(denom, 10) : 1)
        return result.toLocaleString('en-US', { maximumFractionDigits: 2 })
      }, z.coerce.number()),
      bit_rate: z.coerce.number(),
      pix_fmt: z.string(),
      color_space: z.string(),
      color_transfer: z.string(),
      color_primaries: z.string(),
    }),
  ),
})

export default async function ffprobe(video: string): Promise<FFprobeStream> {
  const result = await $`
    ffprobe -v error \
      -select_streams v:0 \
      -show_entries ${ENTRIES} \
      -of json \
      ${video}`
    .json()
    .then(ffprobeOutputSchema.parse)

  const meta_ffprobe = result.streams[0]
  if (!meta_ffprobe) {
    throw new Error('ffprobe did not produce stream metadata')
  }

  const { rotation = 0, width, height, color_transfer = 'bt709' } = meta_ffprobe
  const isRotated = rotation !== 0
  const isNominallyPortrait = width < height
  const isPortrait = isNominallyPortrait !== isRotated
  const isHDR = ['arib-std-b67', 'smpte2084'].includes(color_transfer)
  const hasAudio = await testAudio(video)

  return { ...meta_ffprobe, isPortrait, isHDR, hasAudio }
}

export async function testAudio(video: string): Promise<boolean> {
  try {
    const probe = await $`
      ffprobe -v quiet \
        -select_streams a \
        -show_entries stream=codec_type \
        -of default=noprint_wrappers=1 \
        ${video}
      `.text()

    // output is `codec_type=audio` when audio is present, blank otherwise.
    return probe.includes('audio')
  } catch {
    return false
  }
}
