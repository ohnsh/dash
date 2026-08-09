'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import type { Meta } from '@/lib/vod-schema'
import css from './playlist.module.css'
import { slugToR2URL, slugToTitle } from '@/lib/vod'

const thumbUrl = (slug: string[], assets: string[]) => {
  // relative to camdir base
  const [thumbRelative] = assets
  // absolute path
  // const thumbPath = [...slug, thumbRelative].join('/')
  return `${slugToR2URL(slug)}/${thumbRelative}`
}

// const basename = (path: string) => path.split('/').at(-1)

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

  const vidUrl = useMemo(() => v && `${slugToR2URL(slug)}/${v}`, [v, pathname])

  return (
    <article className={css.container}>
      <h2>{slugToTitle(slug)}</h2>
      <ul>
        {inventory.map((item) => {
          let name = item.name
          // if (item.type === 'hls') {
          //   name = `${name}/${item.playlist}`
          // }
          return (
            <li
              key={name}
              className={
                item.meta_ffprobe.isPortrait ? 'portrait' : 'landscape'
              }
            >
              <Link href={`?v=${name}`}>
                <img alt="" src={thumbUrl(slug, item.assets)} />
              </Link>
            </li>
          )
        })}
      </ul>
      {vidUrl && <video autoPlay controls playsInline src={vidUrl} />}
    </article>
  )
}
