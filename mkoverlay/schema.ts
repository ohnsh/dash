import { z } from 'zod'

export const ffprobeSchema = z.object({
  streams: z.array(
    z.object({
      width: z.coerce.number(),
      height: z.coerce.number(),
      rotation: z.coerce.number().default(0),
      duration: z.coerce.number(),
      nb_frames: z.optional(z.coerce.number()),
      color_space: z.string(),
      color_transfer: z.string(),
      color_primaries: z.string(),
    }),
  ),
})

export type FFprobeOutput = z.infer<typeof ffprobeSchema>

export type FFprobeMetadata = FFprobeOutput['streams'][number] & {
  isPortrait: boolean
  isHDR: boolean
}

export function wrangleOutput([exiftool_output]: [
  Record<string, Record<string, string | number>>,
]) {
  const flatObj = Object.entries(exiftool_output).reduce(
    (prev, [key, val]) =>
      Object.assign(prev, typeof val === 'object' ? val : { [key]: val }),
    {},
  )

  const lowerKey = (key: string) =>
    key === 'MIMEType'
      ? 'mimeType'
      : key.slice(0, 1).toLocaleLowerCase() + key.slice(1)

  return Object.fromEntries(
    Object.entries(flatObj).map(([key, val]) => [lowerKey(key), val]),
  )
}
