import { useEffect, useRef } from 'react'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export default function useCrop(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  rect: Rect,
) {
  const srcVideoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D>(null)

  useEffect(() => {
    if (!videoRef.current) return

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
    srcVideo.src = videoRef.current.src

    // srcVideo.hidden = true
    // document.body.appendChild(srcVideo)

    videoRef.current.addEventListener('play', (_e) => {
      srcVideo.play()
      if (!videoRef.current) return
      videoRef.current.srcObject = canvas.captureStream(30)
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
    }
  }, [rect, videoRef.current])
}
