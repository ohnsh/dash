import { useEffect, useRef, useState } from 'react'
import css from './crop-overlay.module.css'

export type Rect = readonly [
  x: number,
  y: number,
  width: number,
  height: number,
]

interface Source {
  id: 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft'
  name: string // descriptive name
  rect: Rect
}

const sources: Source[] = [
  {
    id: 'topLeft',
    name: 'Display 1 (top left)',
    rect: [0, 0, 1920, 1080],
  },
  {
    id: 'topRight',
    name: 'Display 2 (top right)',
    rect: [1920, 0, 1920, 1080],
  },
  {
    id: 'bottomRight',
    name: 'Side cam (bottom right)',
    rect: [1920, 1080, 1920, 1080],
  },
  {
    id: 'bottomLeft',
    name: 'Front cam (bottom left)',
    rect: [0, 1080, 1920, 1080],
  },
]

export default function CropOverlay({
  videoRef,
  main: mainInitial = 'topLeft',
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>
  main?: Source['id']
}) {
  const [pipEnabled, setPipEnabled] = useState(true)
  const [main, setMain] = useState<Source['id']>(mainInitial)

  const mainSource = sources.find(({ id }) => id === main)
  const pipSources = sources.filter(({ id }) => id !== main)

  if (!mainSource) {
    console.error(`No source found for id ${mainSource}`)
    return null
  }

  return (
    <div className={css.container}>
      <section
        className={css.main}
        aria-label={`Main view: ${mainSource.name}`}
      >
        <CropCanvas
          videoRef={videoRef}
          source={mainSource}
          onClick={() => setPipEnabled((prev) => !prev)}
        />
      </section>
      {pipEnabled && (
        <section className={css.pip} aria-label="Picture-in-picture views">
          {pipSources.map((source) => (
            <CropCanvas
              key={source.id}
              videoRef={videoRef}
              source={source}
              onClick={() => setMain(source.id)}
            />
          ))}
        </section>
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
  const [, , width, height] = source.rect

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let cbHandle: number
    const draw = () => {
      ctx.drawImage(
        video,
        ...source.rect,
        ...[0, 0, canvas.width, canvas.height],
      )
    }
    const cb: VideoFrameRequestCallback = (_now, _metadata) => {
      draw()
      cbHandle = video.requestVideoFrameCallback(cb)
    }

    // provide immediate feedback when pipEnabled changes
    draw()
    cbHandle = video.requestVideoFrameCallback(cb)

    return () => {
      video.cancelVideoFrameCallback(cbHandle)
    }
  }, [videoRef, source])

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={css.cropCanvas}
        aria-label={`Switch main view to ${source.name}`}
      >
        <canvas ref={canvasRef} width={width} height={height} />
      </button>
    )
  } else {
    return (
      <div className={css.cropCanvas}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          role="img"
          aria-label={source.name}
        />
      </div>
    )
  }
}
