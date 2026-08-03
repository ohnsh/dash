import * as z from 'zod'

// jq '.[0]' < inventory.json | quicktype --lang typescript-zod -o test.ts

export const MetaExiftoolSchema = z.object({
  sourceFile: z.string(),
  fileSize: z.string(),
  mimeType: z.string(),
  // probably need to make the rest optional.
  // currently trying to treat hls differently instead
  createDate: z.optional(z.string()),
  modifyDate: z.string(),
  timeScale: z.number(),
  duration: z.string(),
  imageWidth: z.number(),
  imageHeight: z.number(),
  colorPrimaries: z.string(),
  transferCharacteristics: z.string(),
  averageBitrate: z.number(),
  videoFrameRate: z.number(),
  rotation: z.number(),
  compressorID: z.string(),
  bitDepth: z.number(),
  imageSize: z.string(),
  audioFormat: z.string(),
  audioChannels: z.number(),
  audioBitsPerSample: z.number(),
  audioSampleRate: z.number(),
})
export type MetaExiftool = z.infer<typeof MetaExiftoolSchema>

export const MetaFfprobeSchema = z.object({
  width: z.number(),
  height: z.number(),
  rotation: z.number(),
  duration: z.number(),
  nb_frames: z.number(),
  r_frame_rate: z.number(),
  bit_rate: z.number(),
  pix_fmt: z.string(),
  color_space: z.string(),
  color_transfer: z.string(),
  color_primaries: z.string(),
  isPortrait: z.boolean(),
  isHDR: z.boolean(),
})
export type MetaFfprobe = z.infer<typeof MetaFfprobeSchema>

export const MetaSchema = z.object({
  assets: z.array(z.string()),
  key: z.string(),
  type: z.enum(['mp4', 'hls', 'mov']),
  tree: z.enum(['days', 'overlay']),
  meta_exiftool: MetaExiftoolSchema,
  meta_ffprobe: MetaFfprobeSchema,
})
export type Meta = z.infer<typeof MetaSchema>
