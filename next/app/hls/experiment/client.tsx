'use client'

import type HlsType from 'hls.js'
import Script from 'next/script'
import { useEffect, useRef } from 'react'

declare global {
  var Hls: typeof HlsType
}

export default function ClientStream({ streamUrl }: { streamUrl: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<HlsType>(null)

  useEffect(() => {
    // as an alternative, check out callback refs
    if (!videoRef.current) {
      console.log('<video> not mounted. Bailing.')
      return
    }

    if (!Hls.isSupported()) {
      if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        // For Safari (native HLS support)
        videoRef.current.src = streamUrl
      }
      return
    }

    if (!hlsRef.current) {
      hlsRef.current = new Hls({
        // MediaMTX low-latency options can be tuned here if needed
        liveSyncDurationCount: 3,
      })
    }

    hlsRef.current.loadSource(streamUrl)
    hlsRef.current.attachMedia(videoRef.current)

    return () => {
      hlsRef.current?.destroy()
      hlsRef.current = null
    }
  }, [streamUrl])

  return (
    <>
      <video
        ref={videoRef}
        controls
        autoPlay
        muted
        width="640"
        height="360"
      ></video>
      <Script
        src="https://cdn.jsdelivr.net/npm/hls.js@latest"
        strategy="beforeInteractive"
      />
    </>
  )
}
