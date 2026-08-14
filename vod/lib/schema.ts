import { z } from 'zod'

// for downstream users
export const ffprobeStreamSchema = z.object({
  width: z.number(),
  height: z.number(),
  rotation: z.number(),
  duration: z.number().optional(),
  nb_frames: z.number().optional(),
  r_frame_rate: z.number(),
  bit_rate: z.number(),
  pix_fmt: z.string(),
  color_space: z.string(),
  color_transfer: z.string(),
  color_primaries: z.string(),
  isPortrait: z.boolean(),
  isHDR: z.boolean(),
  hasAudio: z.boolean().optional(),
})

export type FFprobeStream = z.infer<typeof ffprobeStreamSchema>

// jq '.[0]' < inventory.json | quicktype --lang typescript-zod -o schema.ts
export const exiftoolSchema = z.object({
  // What's optional highly depends on the input. For now, keep it simple.
  sourceFile: z.string().optional(),
  fileSize: z.string().optional(),
  mimeType: z.string().optional(),
  createDate: z.string().optional(),
  timeScale: z.number().optional(),
  duration: z.string().optional(),
  imageWidth: z.number().optional(),
  imageHeight: z.number().optional(),
  averageBitrate: z.number().optional(),
  videoFrameRate: z.number().optional(),
  rotation: z.number().optional(),
  compressorID: z.string().optional(),
  bitDepth: z.number().optional(),
  audioFormat: z.string().optional(),
  audioChannels: z.number().optional(),
  audioBitsPerSample: z.number().optional(),
  audioSampleRate: z.number().optional(),
})

export type ExiftoolProbe = z.infer<typeof exiftoolSchema>

export const voiceResultSchema = z.object({
  duration: z.number(),
  speechRatio: z.number(),
  speechTotal: z.number().optional(),
  params: z.object({
    speechThreshold: z.number(),
    hysteresis: z.number(),
    padding: z.number(),
    minGap: z.number(),
  }),
  segments: z.array(
    z.object({
      start: z.number(),
      end: z.number(),
      confidence: z.number(),
    }),
  ),
})

export type VoiceResult = z.infer<typeof voiceResultSchema>

export const vodVideoSchema = z.object({
  name: z.string(),
  type: z.enum(['hls', 'mp4', 'mov']),
  assets: z.array(z.string()),
  meta_exiftool: exiftoolSchema,
  meta_ffprobe: ffprobeStreamSchema,
  voiceSegments: voiceResultSchema.optional(),
})

export type VODVideo = z.infer<typeof vodVideoSchema>
