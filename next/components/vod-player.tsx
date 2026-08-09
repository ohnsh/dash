'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { BUCKET_URL } from '@/lib/vod'

// Tip: Adding key={videoSrc} to your <video> element ensures the browser cleanly tears down and reloads the media pipeline when a genuinely new video URL is set.

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
  const v = sParams.get('v')

  src ??= v ? getSrc(pathname, v) : undefined

  // const vidUrl = v && `${slugToR2URL(slug)}/${v}`

  return <div>{src && <video autoPlay controls playsInline src={src} />}</div>
}
