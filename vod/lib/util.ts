import type { VoiceResult } from './schema'

export const getSpeechTotal = (
  voiceSegments: VoiceResult | undefined,
  { minConfidence }: { minConfidence?: number } = {},
) => {
  if (!voiceSegments) return 0
  if (typeof minConfidence === 'undefined') {
    // zod schema now handles computation of missing `speechTotal`
    return voiceSegments.speechTotal
  }
  return voiceSegments.segments.reduce(
    (prev, { start, end, confidence }) =>
      confidence <= minConfidence ? prev : prev + end - start,
    0,
  )
}
