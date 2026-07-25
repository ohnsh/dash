'use client'

import { useHls } from './useHls'

export default function ClientStream({ streamUrl }: { streamUrl: string }) {
  const { videoRef, isError } = useHls(streamUrl)

  return (
    <video
      ref={videoRef}
      controls
      autoPlay
      muted
      style={{ width: '100%', aspectRatio: '16/9' }}
      crossOrigin="use-credentials"
      // width="640"
      // height="360"
    ></video>
  )
}
