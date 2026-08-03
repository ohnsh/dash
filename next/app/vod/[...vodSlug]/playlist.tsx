'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import type { Meta } from '../schema'
import css from './playlist.module.css'
import { vodSlugToTitle } from '../util'

const BUCKETS = {
  days: 'https://days-media.ohn.sh',
  overlay: 'https://vod.ohn.sh',
} as const

const thumbUrl = (assets: string[]) => {
  const [thumb] = assets
  return new URL(thumb, BUCKETS['overlay']).toString()
}

const basename = (path: string) => path.split('/').at(-1)

export default function Playlist({
  slug,
  inventory,
}: {
  slug: string[]
  inventory: Meta[]
}) {
  const pathname = usePathname()
  const sParams = useSearchParams()
  const v = sParams.get('v')

  const vidUrl = useMemo(() => {
    const [, , year, month, ...rest] = pathname.split('/')
    const key = `/${year}-${month}/${rest.join('/')}/${v}`
    // this should be better
    const tree = key.endsWith('hls') ? 'overlay' : 'days'
    return new URL(key, BUCKETS[tree]).toString()
  }, [v, pathname])

  return (
    <article className={css.container}>
      <h2>{vodSlugToTitle(slug)}</h2>
      <ul>
        {inventory.map((item) => (
          <li
            key={item.key}
            className={item.meta_ffprobe.isPortrait ? 'portrait' : 'landscape'}
          >
            <Link href={`?v=${basename(item.key)}`}>
              <img alt="" src={thumbUrl(item.assets)} />
            </Link>
          </li>
        ))}
      </ul>
      {v && <video autoPlay controls playsInline src={vidUrl} />}
    </article>
  )
}
