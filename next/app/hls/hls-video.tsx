'use client'

import Hls from 'hls.js'
import { useEffect, useCallback, useRef } from 'react'

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.platform) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export default function ClientStream({ streamUrl }: { streamUrl: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls>(null)

  const loadHls = useCallback(() => {
    const retryPause = 2000

    if (!videoRef.current) {
      console.log('<video> not mounted. Bailing.')
      return
    }
    if (!hlsRef.current) {
      hlsRef.current = new Hls({
        // MediaMTX low-latency options can be tuned here if needed
        // liveSyncDurationCount: 3,
        maxLiveSyncPlaybackRate: 1.5,

        // could help with sporadic cookie errors:
        // enableWorker: false,

        // crucial for mobile safari to work:
        xhrSetup(xhr, _url) {
          xhr.withCredentials = true
        },
      })

      hlsRef.current.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          hlsRef.current?.destroy()
          hlsRef.current = null

          if (data.details === 'manifestIncompatibleCodecsError') {
            console.error(
              'stream makes use of codecs which are not compatible with this browser or operative system',
            )
          } else if (data.response && data.response.code === 404) {
            console.error('stream not found, retrying in some seconds')
          } else {
            console.error({ data })
          }

          setTimeout(() => loadHls(), retryPause)
        }
      })
    }

    hlsRef.current.loadSource(streamUrl)
    hlsRef.current.attachMedia(videoRef.current)
  }, [streamUrl])

  useEffect(() => {
    // as an alternative, check out callback refs
    if (!videoRef.current) {
      console.log('<video> not mounted. Bailing.')
      return
    }

    // Now emulating logic in mediamtx iframe, which is relatively resilient.
    if (Hls.isSupported() && !isIOS()) {
      console.log('Using hls.js!')

      loadHls()
      return () => {
        hlsRef.current?.detachMedia()
        hlsRef.current?.destroy()
        hlsRef.current = null
      }
    }

    if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      console.warn('Using native HLS support.')
      // For Safari (native HLS support)
      videoRef.current.src = streamUrl
    } else {
      console.error('No HLS support detected.')
    }
  }, [streamUrl, loadHls])

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
