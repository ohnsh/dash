import { $ } from 'bun'
import { z } from 'zod'

const ffprobeSchema = z.object({
  streams: z.array(
    z.object({
      width: z.coerce.number(),
      height: z.coerce.number(),
      rotation: z.coerce.number().default(0),
      duration: z.optional(z.coerce.number()),
      nb_frames: z.optional(z.coerce.number()),
      color_space: z.string(),
      color_transfer: z.string(),
      color_primaries: z.string(),
    }),
  ),
})

type FFprobeOutput = z.infer<typeof ffprobeSchema>

type FFprobeMetadata = FFprobeOutput['streams'][number] & {
  isPortrait: boolean
  isHDR: boolean
}

export default async function ffprobe(video: string): Promise<FFprobeMetadata> {
  const ENTRIES =
    'stream=width,height,nb_frames,duration,color_space,color_transfer,color_primaries' +
    ':stream_side_data=rotation'

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
