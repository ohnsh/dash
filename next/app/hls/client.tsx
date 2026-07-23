'use client'

import type HlsType from 'hls.js'
import Script from 'next/script'
import { useRef } from 'react'

declare global {
  var Hls: typeof HlsType
}

export default function ClientStream({ streamUrl }: { streamUrl: string }) {
  const video = useRef<HTMLVideoElement>(null)

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/hls.js@latest"
        strategy="afterInteractive"
        onLoad={() => {
          if (!video.current) {
            console.log("Video wasn't ready. Bailing.")
            return
          }
          if (Hls.isSupported()) {
            // For Edge, Chrome, Firefox, etc.
            const hls = new Hls({
              // MediaMTX low-latency options can be tuned here if needed
              liveSyncDurationCount: 3,
            })
            hls.loadSource(streamUrl)
            hls.attachMedia(video.current)
          } else if (
            video.current.canPlayType('application/vnd.apple.mpegurl')
          ) {
            // For Safari (native HLS support)
            video.current.src = streamUrl
          }
        }}
      />
      <video
        ref={video}
        // suppressHydrationWarning (not needed due to use of load event in script)
        controls
        autoPlay
        muted
        width="640"
        height="360"
      ></video>
    </>
  )
}
