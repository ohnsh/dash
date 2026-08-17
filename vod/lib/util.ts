import type { VODVideo } from './schema'

export const getSpeechTotal = (
  v: VODVideo,
  { minConfidence }: { minConfidence?: number } = {},
) => {
  if (!v.voiceSegments) return 0
  if (typeof minConfidence === 'undefined') {
    // zod schema now handles computation of missing `speechTotal`
    return v.voiceSegments.speechTotal
  }
  return v.voiceSegments.segments.reduce(
    (prev, { start, end, confidence }) =>
      confidence <= minConfidence ? prev : prev + end - start,
    0,
  )
}
