import { useEffect, useRef, useState } from 'react'
import css from './crop-overlay.module.css'

export type Rect = readonly [
  x: number,
  y: number,
  width: number,
  height: number,
]

const rects = {
  topLeft: [0, 0, 1920, 1080],
  topRight: [1920, 0, 1920, 1080],
  bottomRight: [1920, 1080, 1920, 1080],
  bottomLeft: [0, 1080, 1920, 1080],
} as const

export default function CropOverlay({
  videoRef,
  bounds = rects.topLeft,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>
  bounds?: Rect
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pipEnabled, setPipEnabled] = useState(false)

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let cbHandle: number
    const draw = () => {
      ctx.drawImage(video, ...bounds, ...[0, 0, canvas.width, canvas.height])
      if (pipEnabled) {
        Object.values(rects).forEach((rect: Rect, i) => {
          ctx.drawImage(
            video,
            ...rect,
            canvas.width - 360,
            canvas.height - 200 * (i + 1),
            320,
            180,
          )
        })
      }
    }
    const cb: VideoFrameRequestCallback = (_now, _metadata) => {
      draw()
      cbHandle = video.requestVideoFrameCallback(cb)
    }

    /* provide immediate feedback when pipEnabled state changes */
    draw()
    cbHandle = video.requestVideoFrameCallback(cb)

    return () => {
      video.cancelVideoFrameCallback(cbHandle)
    }
  }, [videoRef, bounds, pipEnabled])

  const [, , width, height] = bounds

  return (
    <div className={css.container}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={() => setPipEnabled((prev) => !prev)}
      />
    </div>
  )
}
