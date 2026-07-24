'use client'

import Hls from 'hls.js'
import { useEffect, useRef } from 'react'

export default function ClientStream({ streamUrl }: { streamUrl: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls>(null)

  useEffect(() => {
    // as an alternative, check out callback refs
    if (!videoRef.current) {
      console.log('<video> not mounted. Bailing.')
      return
    }

    if (!Hls.isSupported()) {
      console.warn('hls.js not supported by browser.')
      if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        console.warn('Using native HLS support.')
        // For Safari (native HLS support)
        videoRef.current.src = streamUrl
      }
      return
    }

    if (!hlsRef.current) {
      hlsRef.current = new Hls({
        // MediaMTX low-latency options can be tuned here if needed
        liveSyncDurationCount: 3,
        // crucial for mobile safari to work:
        xhrSetup(xhr, _url) {
          xhr.withCredentials = true
        },
      })

      hlsRef.current.on(Hls.Events.ERROR, (event, data) => {
        console.log('Error event:', event)
        console.log('Error data:', data)
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
    <video
      ref={videoRef}
      controls
      autoPlay
      muted
      width="640"
      height="360"
    ></video>
  )
}
