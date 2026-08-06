'use client'

import { useHls } from './useHls'

export default function ClientStream({ streamUrl }: { streamUrl: string }) {
  const { videoRef, isError } = useHls(streamUrl)

  return (
    <video
      ref={videoRef}
      controls
      autoPlay
      playsInline
      muted
      // needs to be dynamic based on isPortrait
      style={{ aspectRatio: '16/9' }}
    ></video>
  )
}
