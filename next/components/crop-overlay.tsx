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
} satisfies Record<string, Rect>

type RectId = keyof typeof rects
type Source = [RectId, Rect]

export default function CropOverlay({
  videoRef,
  main: mainInitial = 'topLeft',
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>
  main?: RectId
}) {
  const [pipEnabled, setPipEnabled] = useState(true)
  const [main, setMain] = useState<RectId>(mainInitial)

  const mainSource = Object.entries(rects).find(([id]) => id === main) as
    | Source
    | undefined
  const pipSources = Object.entries(rects).filter(
    ([id]) => id !== main,
  ) as Source[]

  if (!mainSource) return null

  return (
    <div className={css.container}>
      <CropCanvas
        videoRef={videoRef}
        source={mainSource}
        onClick={() => setPipEnabled((prev) => !prev)}
      />
      {pipEnabled && (
        <div className={css.pipContainer}>
          {pipSources.map((source) => (
            <CropCanvas
              key={source[0]}
              videoRef={videoRef}
              source={source}
              onClick={() => setMain(source[0])}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CropCanvas({
  videoRef,
  source,
  onClick,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>
  source: Source
  onClick?: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [rectId, bounds] = source
  const [, , width, height] = bounds

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let cbHandle: number
    const draw = () => {
      ctx.drawImage(video, ...bounds, ...[0, 0, canvas.width, canvas.height])
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
  }, [videoRef, bounds])

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={css.cropCanvas}>
        <canvas ref={canvasRef} width={width} height={height} />
      </button>
    )
  } else {
    return (
      <div className={css.cropCanvas}>
        <canvas ref={canvasRef} width={width} height={height} />
      </div>
    )
  }
}
