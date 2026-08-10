'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { BUCKET_URL } from '@/lib/vod'
import css from './vod-player.module.css'

function getSrc(pathname: string, v: string) {
  const [, date] = pathname.split('/')
  const [year, mo, day] = date.split('-')
  const r2date = `${year}-${mo}/${day}`
  // const r2date = date.replace(/-(?=\d{2}$)/, '/')

  return `${BUCKET_URL}/${r2date}/${v}`
}

export default function VodPlayer({ src }: { src?: string }) {
  const pathname = usePathname()
  const sParams = useSearchParams()
  const videoRef = useRef<HTMLVideoElement>(null)

  const v = sParams.get('v')
  src ??= v ? getSrc(pathname, v) : undefined

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
      {src && <video ref={videoRef} autoPlay controls playsInline />}
    </div>
  )
}
