import * as z from 'zod'

// jq '.[0]' < inventory.json | quicktype --lang typescript-zod -o test.ts

export const MetaExiftoolSchema = z.object({
  sourceFile: z.string().optional(),
  fileSize: z.string().optional(),
  mimeType: z.string().optional(),
  // probably need to make the rest optional.
  // currently trying to treat hls differently instead
  createDate: z.optional(z.string()),
  modifyDate: z.string().optional(),
  timeScale: z.number().optional(),
  duration: z.string().optional(),
  imageWidth: z.number().optional(),
  imageHeight: z.number().optional(),
  colorPrimaries: z.string().optional(),
  transferCharacteristics: z.string().optional(),
  averageBitrate: z.number().optional(),
  videoFrameRate: z.number().optional(),
  rotation: z.number().optional(),
  compressorID: z.string().optional(),
  bitDepth: z.number().optional(),
  imageSize: z.string().optional(),
  audioFormat: z.string().optional(),
  audioChannels: z.number().optional(),
  audioBitsPerSample: z.number().optional(),
  audioSampleRate: z.number().optional(),
})
export type MetaExiftool = z.infer<typeof MetaExiftoolSchema>

export const MetaFfprobeSchema = z.object({
  width: z.number().optional(),
  height: z.number().optional(),
  rotation: z.number().optional(),
  duration: z.number().optional(),
  nb_frames: z.number().optional(),
  r_frame_rate: z.number().optional(),
  bit_rate: z.number().optional(),
  pix_fmt: z.string().optional(),
  color_space: z.string().optional(),
  color_transfer: z.string().optional(),
  color_primaries: z.string().optional(),
  isPortrait: z.boolean(),
  isHDR: z.boolean(),
})
export type MetaFfprobe = z.infer<typeof MetaFfprobeSchema>

export const MetaSchema = z.object({
  assets: z.array(z.string()),
  key: z.string(),
  type: z.enum(['mp4', 'hls', 'mov']),
  playlist: z.optional(z.string()),
  tree: z.enum(['days', 'overlay']),
  meta_exiftool: MetaExiftoolSchema,
  meta_ffprobe: MetaFfprobeSchema,
})

export type Meta = z.infer<typeof MetaSchema> &
  (
    | { type: 'hls'; playlist: string }
    | { type: 'mp4' | 'mov'; playlist?: never }
  )
