import Hls from 'hls.js'
import { useCallback, useEffect, useRef, useState } from 'react'

const RETRY_PAUSE_MS = 2000

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.platform) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export function useHls(streamUrl: string) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const hlsRef = useRef<Hls | null>(null)
  const timerRef = useRef<number>(null)
  const [isError, setIsError] = useState(false)

  const clearRetryTimer = useRef(() => {
    if (timerRef.current === null) {
      return
    }
    clearTimeout(timerRef.current)
    timerRef.current = null
  }).current

  const loadHls = useCallback(() => {
    if (!videoRef.current) {
      return
    }

    clearRetryTimer()

    if (hlsRef.current) {
      hlsRef.current.destroy()
    }

    const hls = new Hls({
      // MediaMTX low-latency options can be tuned here if needed
      // liveSyncDurationCount: 3,
      maxLiveSyncPlaybackRate: 1.5,

      // could help with sporadic cookie errors:
      // enableWorker: false,

      // Once thought to be crucial for mobile safari to work:
      // Creates problems with the wildcard CORS allowed origin.
      // Currently, streaming works fine without this setting, and without sending cookies
      // with every request, which is great.
      //
      // xhrSetup(xhr, _url) {
      //   xhr.withCredentials = true
      // },
    })

    hlsRef.current = hls

    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (!data.fatal || hlsRef.current !== hls) {
        return
      }

      setIsError(true)
      hls.destroy()
      hlsRef.current = null

      if (data.details === 'manifestIncompatibleCodecsError') {
        console.error(
          'stream makes use of codecs which are not compatible with this browser or operative system',
        )
      } else if (data.response && data.response.code === 404) {
        console.error('stream not found, retrying in some seconds')
      } else {
        console.error('Fatal hls.js error:', data.error)
      }

      clearRetryTimer()
      timerRef.current = window.setTimeout(() => {
        setIsError(false)
        loadHls()
      }, RETRY_PAUSE_MS)
    })

    hls.on(Hls.Events.MEDIA_ATTACHED, () => {
      hls.loadSource(streamUrl)
    })

    hls.on(Hls.Events.MANIFEST_LOADED, () => {
      videoRef.current?.play().catch((e) => {
        console.warn('Autoplay prevented:', e)
      })
    })

    hls.attachMedia(videoRef.current)
  }, [streamUrl, clearRetryTimer])

  useEffect(() => {
    if (!videoRef.current || !streamUrl) {
      return
    }

    // Now emulating logic in mediamtx iframe, which is relatively resilient.
    if (Hls.isSupported() && !isIOS()) {
      console.log('Using hls.js!')
      loadHls()
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      console.warn('Using native HLS support.')
      // For Safari (native HLS support)
      videoRef.current.src = streamUrl
      videoRef.current.play().catch((e) => {
        console.warn('Autoplay prevented:', e)
      })
    } else {
      console.error('No HLS support detected.')
    }

    return () => {
      clearRetryTimer()

      hlsRef.current?.detachMedia()
      hlsRef.current?.destroy()
      hlsRef.current = null

      if (videoRef.current) {
        videoRef.current.removeAttribute('src')
        videoRef.current.load()
      }
    }
  }, [loadHls, streamUrl, clearRetryTimer])

  return { videoRef, isError }
}
