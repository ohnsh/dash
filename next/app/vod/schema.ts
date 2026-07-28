import * as z from 'zod'

// jq '.[0]' < inventory.json | quicktype --lang typescript-zod -o test.ts

export const MetaExiftoolSchema = z.object({
  sourceFile: z.string(),
  fileSize: z.string(),
  fileType: z.string(),
  mimeType: z.string(),
  createDate: z.string(),
  modifyDate: z.string(),
  majorBrand: z.string(),
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
})
export type MetaExiftool = z.infer<typeof MetaExiftoolSchema>

export const MetaFfprobeSchema = z.object({
  width: z.number(),
  height: z.number(),
  rotation: z.number(),
  duration: z.number(),
  nb_frames: z.number(),
  color_space: z.string(),
  color_transfer: z.string(),
  color_primaries: z.string(),
  isPortrait: z.boolean(),
  isHDR: z.boolean(),
})
export type MetaFfprobe = z.infer<typeof MetaFfprobeSchema>

export const MetaSchema = z.object({
  name: z.string(),
  meta_exiftool: MetaExiftoolSchema,
  meta_ffprobe: MetaFfprobeSchema,
})
export type Meta = z.infer<typeof MetaSchema>
