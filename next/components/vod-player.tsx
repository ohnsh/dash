'use client'

import { use, useEffect, useRef } from 'react'
import type { DashVideo } from '@/lib/dash-video'
import css from './vod-player.module.css'

export default function VodPlayer({
  src,
  videoPromise,
}: {
  src?: string
  videoPromise?: Promise<DashVideo | undefined>
}) {
  const dv = videoPromise && use(videoPromise)
  const videoRef = useRef<HTMLVideoElement>(null)
  src ??= dv?.src

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    video.src = src
    // video.load()

    return () => {
      // if (video.isConnected)
      video.pause()
      video.removeAttribute('src')
      video.load()
    }
  }, [src])

  // const vidUrl = v && `${slugToR2URL(slug)}/${v}`

  // adding key={src} to <video> to unmount/remount it on src change.
  // still hearing phantom audio from previous sources, however.
  // it may be best to force a navigation using <a> instead of <Link>
  // EDIT: the above effect works much better than using the key prop.
  return (
    <div className={css.container}>
      <span>VOD player babyyyyyy</span>
      {src && (
        <video
          ref={videoRef}
          crossOrigin="anonymous"
          autoPlay
          controls
          playsInline
        />
      )}
    </div>
  )
}
