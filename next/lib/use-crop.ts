import { useEffect, useRef, useState } from 'react'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

const CROPS = {
  topLeft: {
    x: 0,
    y: 0,
    width: 1920,
    height: 1080,
  },
  bottomLeft: {
    x: 0,
    y: 1080,
    width: 1920,
    height: 1080,
  },
  topRight: {
    x: 1920,
    y: 0,
    width: 1920,
    height: 1080,
  },
  bottomRight: {
    x: 1920,
    y: 1080,
    width: 1920,
    height: 1080,
  },
}

export default function useCrop(
  src: string | undefined,
  userVideoRef = useRef<HTMLVideoElement>(null),
  enabled = true,
) {
  const srcVideoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D>(null)
  const [crop, setCrop] = useState<Rect | undefined>(undefined)

  useEffect(() => {
    if (!src || !enabled || !userVideoRef.current) return

    // const { videoWidth, videoHeight } = videoRef.current

    const userVideo = userVideoRef.current
    const srcVideo = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) {
      throw new Error('Canvas rendering context is null')
    }

    srcVideoRef.current = srcVideo
    canvasRef.current = canvas
    ctxRef.current = ctx

    srcVideo.crossOrigin = 'anonymous'
    srcVideo.src = src

    return () => {
      srcVideoRef.current = null
      canvasRef.current = null
      ctxRef.current = null

      userVideo.srcObject = null
    }
  }, [enabled, src])

  useEffect(() => {
    const srcVideo = srcVideoRef.current
    const userVideo = userVideoRef.current
    const canvas = canvasRef.current
    const ctx = ctxRef.current

    if (!srcVideo || !userVideo || !canvas || !ctx) {
      return
    }

    const playHandler = () => {
      srcVideo.play()
    }
    const pauseHandler = () => {
      srcVideo.pause()
    }

    let cbHandle: number | undefined
    const clickHandler = (ev: MouseEvent) => {
      if (!ev.altKey) {
        return
      }
      ev.preventDefault()

      if (crop) {
        if (typeof cbHandle === 'number') {
          srcVideo.cancelVideoFrameCallback(cbHandle)
          cbHandle = undefined
        }
        userVideo.srcObject = null
        srcVideo.pause()
        userVideo.play()
        setCrop(undefined)
      } else {
        // get quadrant
        // ev.offsetX
        // ev.offsetY
        const { x, y, width, height } = CROPS.bottomLeft
        const srcRect = [x, y, width, height] as const
        const destRect = [0, 0, width, height] as const

        canvas.width = width
        canvas.height = height

        userVideo.srcObject = canvas.captureStream(30)

        cbHandle = srcVideo.requestVideoFrameCallback(renderFrame)
        srcVideo.play()
        userVideo.play()

        function renderFrame() {
          if (!ctx || !srcVideo) return
          ctx.drawImage(srcVideo, ...srcRect, ...destRect)
          // if (srcVideo.paused || srcVideo.ended) return
          cbHandle = srcVideo.requestVideoFrameCallback(renderFrame)
        }
        setCrop(CROPS.bottomLeft)
      }
    }

    userVideo.addEventListener('play', playHandler)
    userVideo.addEventListener('pause', pauseHandler)
    userVideo.addEventListener('click', clickHandler)

    return () => {
      if (typeof cbHandle === 'number') {
        // srcVideo.cancelVideoFrameCallback(cbHandle)
        // cbHandle = undefined
      }

      userVideo.removeEventListener('play', playHandler)
      userVideo.removeEventListener('pause', pauseHandler)
      userVideo.removeEventListener('click', clickHandler)
    }
  }, [crop])

  return { videoRef: userVideoRef }
}
