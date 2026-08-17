import { useEffect, useRef } from 'react'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export default function useCrop(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  src: string | undefined,
  rect: Rect | undefined,
) {
  const srcVideoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D>(null)

  useEffect(() => {
    if (!src || !rect || !videoRef.current) return

    // const { videoWidth, videoHeight } = videoRef.current

    const srcVideo = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) {
      throw new Error('Canvas rendering context is null')
    }

    srcVideoRef.current = srcVideo
    canvasRef.current = canvas
    ctxRef.current = ctx

    const { x, y, width, height } = rect
    const srcRect = [x, y, width, height] as const
    const destRect = [0, 0, width, height] as const
    canvas.width = width
    canvas.height = height

    srcVideo.crossOrigin = 'anonymous'
    // srcVideo.autoplay = true
    srcVideo.src = src

    // srcVideo.hidden = true
    // document.body.appendChild(srcVideo)
    if (!videoRef.current) return
    videoRef.current.srcObject = canvas.captureStream(30)

    videoRef.current.addEventListener('play', (_e) => {
      srcVideo.play()
    })
    videoRef.current.addEventListener('pause', (_e) => {
      srcVideo.pause()
    })

    let handle = srcVideo.requestVideoFrameCallback(renderFrame)
    function renderFrame() {
      if (!ctx) return
      ctx.drawImage(srcVideo, ...srcRect, ...destRect)
      // if (srcVideo.paused || srcVideo.ended) return
      handle = srcVideo.requestVideoFrameCallback(renderFrame)
    }

    return () => {
      srcVideo.cancelVideoFrameCallback(handle)
      srcVideoRef.current = null
      canvasRef.current = null
      ctxRef.current = null
      if (!videoRef.current) return
      videoRef.current.srcObject = null
    }
  }, [rect, src, videoRef.current])
}
