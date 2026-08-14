import type { VODVideo } from './schema'

export const getSpeechTotal = (v: VODVideo) => {
  if (!v.voiceSegments) return 0
  const { speechTotal, duration, speechRatio } = v.voiceSegments
  return speechTotal ?? Math.round(duration * speechRatio)
}
