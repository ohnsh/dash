// bunx quicktype sample.json --lang typescript-zod -o Path.ts

import * as z from 'zod'

export const SourceSchema = z.object({
  type: z.string(),
  id: z.string(),
})
export type Source = z.infer<typeof SourceSchema>

export const CodecPropsSchema = z.object({
  width: z.number().optional(),
  height: z.number().optional(),
  profile: z.string().optional(),
  level: z.string().optional(),
  sampleRate: z.number().optional(),
  channelCount: z.number().optional(),
})
export type CodecProps = z.infer<typeof CodecPropsSchema>

export const Tracks2Schema = z.object({
  codec: z.string(),
  codecProps: CodecPropsSchema,
})
export type Tracks2 = z.infer<typeof Tracks2Schema>

export const PathSchema = z.object({
  name: z.string(),
  confName: z.string(),
  ready: z.boolean(),
  readyTime: z.coerce.date(),
  available: z.boolean(),
  availableTime: z.coerce.date(),
  online: z.boolean(),
  onlineTime: z.coerce.date(),
  source: SourceSchema,
  tracks: z.array(z.string()),
  tracks2: z.array(Tracks2Schema),
  readers: z.array(SourceSchema),
  inboundBytes: z.number(),
  outboundBytes: z.number(),
  inboundFramesInError: z.number(),
  bytesReceived: z.number(),
  bytesSent: z.number(),
})
export type Path = z.infer<typeof PathSchema>
